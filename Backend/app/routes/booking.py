from fastapi import APIRouter, HTTPException, Depends
from app import db, schemas, utils
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from datetime import datetime

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = utils.decode_token(token)
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
        user = await db.db.users.find_one({"email": email})
        if not user:
            raise credentials_exception
        return user
    except JWTError:
        raise credentials_exception

@router.get("/me")
async def get_booking(user=Depends(get_current_user)):
    booking = await db.db.bookings.find_one({"user_id": user["_id"]})
    return {"booking": booking}

@router.post("")
async def book(data: schemas.BookingCreate, user=Depends(get_current_user)):
    existing = await db.db.bookings.find_one({"user_id": user["_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Already booked")

    booking = {
        "user_id": user["_id"],
        "facility": data.facility,
        "slot_time": datetime.utcnow()
    }
    await db.db.bookings.insert_one(booking)
    return {"message": "Booking successful"}

@router.delete("/cancel")
async def cancel_booking(user=Depends(get_current_user)):
    result = await db.db.bookings.delete_one({"user_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="No booking to cancel")
    return {"message": "Booking cancelled"}
