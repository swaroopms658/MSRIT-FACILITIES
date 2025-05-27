from fastapi import APIRouter, HTTPException
from uuid import uuid4
from .models import UserIn, UserOut, LoginRequest, LoginResponse
from pymongo import MongoClient
from dotenv import load_dotenv
from urllib.parse import quote_plus

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
    # Check for existing user
    username = quote_plus("facilitiesproject2")  # Escape special characters
    password = quote_plus("Password123")

    uri = f"mongodb+srv://{username}:{password}@cluster0.mongodb.net/?retryWrites=true&w=majority"
    client = MongoClient(uri)
    print(client.list_database_names())
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid4())

    new_user = {
        "id": user_id,
        "name": user.name,
        "email": user.email,
        "password": user.password, 
        "rollNumber": user.rollNumber, # ⚠️ Store hashed password in production!
        "department": user.department,
    }

    users_collection.insert_one(new_user)

    return {
        "id": user_id,
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
