from fastapi import APIRouter, HTTPException, Depends, Header, status
from uuid import uuid4
from passlib.context import CryptContext
from .models import UserIn, UserOut, LoginRequest, LoginResponse
from .database import users_collection
from fastapi.security import HTTPBearer

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
active_tokens = {}  # For demo only. Use Redis/JWT in production.

security = HTTPBearer()

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

async def verify_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header")
    token = authorization.split(" ")[1]
    user_id = active_tokens.get(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = await users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

async def verify_admin(user=Depends(verify_token)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return user

@router.post("/register", response_model=UserOut)
async def register(user: UserIn):
    if await users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = {
        "id": str(uuid4()),
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "rollNumber": user.rollNumber,
        "department": user.department,
        "role": "student",
        "cooldown_until": None
    }
    await users_collection.insert_one(new_user)
    return UserOut(**new_user)

@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    user = await users_collection.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = str(uuid4())
    active_tokens[token] = user["id"]
    return LoginResponse(access_token=token, token_type="bearer")

@router.get("/me")
async def get_me(user=Depends(verify_token)):
    return {
        "id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "name": user["name"],
        "department": user.get("department"),
        "rollNumber": user.get("rollNumber"),
        "cooldown_until": user.get("cooldown_until").isoformat() if user.get("cooldown_until") else None
    }
