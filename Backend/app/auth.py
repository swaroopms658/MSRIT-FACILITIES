from fastapi import APIRouter, HTTPException, Depends, Header, status
from uuid import uuid4
from passlib.context import CryptContext
from .models import UserIn, UserOut, LoginRequest, LoginResponse
from .database import users_collection  # Async MongoDB collection

router = APIRouter(prefix="/auth")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Simple token store for demo (replace with DB or JWT in prod)
active_tokens = {}

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

async def verify_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header")

    token = authorization[len("Bearer "):]
    user_id = active_tokens.get(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user = await users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user

@router.post("/register", response_model=UserOut)
async def register(user: UserIn):
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid4())
    hashed_password = hash_password(user.password)

    new_user = {
        "id": user_id,
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "rollNumber": user.rollNumber,
        "department": user.department,
    }

    await users_collection.insert_one(new_user)

    return UserOut(
        id=user_id,
        name=user.name,
        email=user.email,
        qr_code=f"https://api.qrserver.com/v1/create-qr-code/?data={user_id}&size=200x200"
    )


@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    user = await users_collection.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = str(uuid4())
    active_tokens[token] = user["id"]

    return LoginResponse(
        access_token=token,
        token_type="bearer"
    )
