from fastapi import APIRouter, HTTPException
from uuid import uuid4
from .models import UserIn, UserOut, LoginRequest, LoginResponse
from .database import users_collection  # <-- Import the async collection

router = APIRouter(prefix="/auth")

@router.post("/register", response_model=UserOut)
async def register(user: UserIn):
    # Check for existing user
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid4())
    new_user = {
        "id": user_id,
        "name": user.name,
        "email": user.email,
        "password": user.password,  # Hash in production!
        "rollNumber": user.rollNumber,
        "department": user.department,
    }

    await users_collection.insert_one(new_user)  # <-- Use await

    return {
        "id": user_id,
        "name": user.name,
        "email": user.email,
        "qr_code": f"https://api.qrserver.com/v1/create-qr-code/?data={user_id}&size=200x200"
    }

@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    user = await users_collection.find_one({"email": data.email})
    if not user or user["password"] != data.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # In real applications, generate JWT or OAuth2 token here
    token = str(uuid4())  # Temporary token generation for example

    return {
        "access_token": token,
        "token_type": "bearer"
    }
