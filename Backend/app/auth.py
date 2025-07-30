from fastapi import APIRouter, HTTPException, Depends, Header, status
from uuid import uuid4
from passlib.context import CryptContext
from .models import UserIn, UserOut, LoginRequest, LoginResponse
from .database import users_collection

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# In-memory token store for demonstration purposes only
active_tokens = {}

def hash_password(password: str) -> str:
    """Hash the plain password."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the hashed one."""
    return pwd_context.verify(plain_password, hashed_password)

async def verify_token(authorization: str = Header(...)):
    """
    Verify Bearer token from Authorization header,
    fetch corresponding user if token is valid.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization[len("Bearer "):].strip()
    user_id = active_tokens.get(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = await users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def verify_admin(user=Depends(verify_token)):
    """
    Dependency to ensure the current user is an admin.
    """
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return user

@router.post("/register", response_model=UserOut)
async def register(user: UserIn):
    """
    Register a new student user; disallow duplicate emails.
    """
    existing = await users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = {
        "id": str(uuid4()),
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "rollNumber": user.rollNumber,
        "department": user.department,
        "role": "student",  # Default role for new users
        "cooldown_until": None
    }
    await users_collection.insert_one(new_user)
    return UserOut(**new_user)

@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    """
    Authenticate user and return an access token.
    """
    user = await users_collection.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = str(uuid4())
    active_tokens[token] = user["id"]
    return LoginResponse(access_token=token, token_type="bearer")

@router.get("/me")
async def get_me(user=Depends(verify_token)):
    """
    Return the authenticated user's information.
    """
    return {
        "id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "name": user["name"],
        "department": user.get("department"),
        "rollNumber": user.get("rollNumber"),
        "cooldown_until": user.get("cooldown_until").isoformat() if user.get("cooldown_until") else None
    }
