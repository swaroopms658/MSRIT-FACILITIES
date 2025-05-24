from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from .database import db
from .models import UserIn, UserOut, Token
from .utils import hash_password, verify_password, create_access_token, decode_access_token
from bson import ObjectId

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/register", response_model=UserOut)
async def register(user: UserIn):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(user.password)
    user_dict = user.dict()
    user_dict["hashed_password"] = hashed
    del user_dict["password"]
    res = await db.users.insert_one(user_dict)
    return UserOut(id=str(res.inserted_id), name=user.name, email=user.email)

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": str(user["_id"])})
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return UserOut(id=str(user["_id"]), name=user["name"], email=user["email"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/profile", response_model=UserOut)
async def read_profile(current_user: UserOut = Depends(get_current_user)):
    return current_user
