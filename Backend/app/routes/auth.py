from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app import db, utils
from app.schemas import Token, UserCreate
import qrcode
import io
import base64

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

@router.post("/register")
async def register(user: UserCreate):
    users = db.db.users
    if await users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    user_dict = user.dict()
    user_dict["password"] = utils.hash_password(user.password)
    await users.insert_one(user_dict)

    qr = qrcode.make(user.email)
    buf = io.BytesIO()
    qr.save(buf, format="PNG")
    img_str = base64.b64encode(buf.getvalue()).decode("utf-8")
    return {"qr_code": f"data:image/png;base64,{img_str}"}

@router.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.db.users.find_one({"email": form_data.username})
    if not user or not utils.verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = utils.create_token({"sub": user["email"]})
    return {"access_token": token, "token_type": "bearer"}
