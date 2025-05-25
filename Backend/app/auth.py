from fastapi import APIRouter, HTTPException
from uuid import uuid4
from .models import UserIn, UserOut, LoginRequest, LoginResponse

router = APIRouter(prefix="/auth")

fake_users_db = {
    "user@msrit.edu": {
        "password": "secret123",
        "access_token": "fake-jwt-token",
        "name": "John Doe",
        "id": "123e4567-e89b-12d3-a456-426614174000"
    }
}

@router.post("/register", response_model=UserOut)
async def register(user: UserIn):
    fake_user_id = str(uuid4())
    fake_users_db[user.email] = {
        "password": user.password,
        "access_token": "fake-jwt-token-for-" + user.email,
        "name": user.name,
        "id": fake_user_id
    }
    return {
        "id": fake_user_id,
        "name": user.name,
        "email": user.email,
        "qr_code": "https://api.qrserver.com/v1/create-qr-code/?data=MSRIT_ACCESS_GRANTED&size=200x200"
    }

@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    user = fake_users_db.get(data.email)
    if not user or user["password"] != data.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {
        "access_token": user["access_token"],
        "token_type": "bearer"
    }
