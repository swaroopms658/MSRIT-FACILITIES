import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
import base64
from io import BytesIO
import qrcode
from bson import ObjectId

from fastapi import APIRouter, HTTPException, Depends, status
from .models import BookingRequest
from .auth import verify_token, verify_admin
from .database import bookings_collection, users_collection, FRONTEND_BASE_URL

router = APIRouter(prefix="/api/booking", tags=["booking"])

VALID_FACILITIES = ["Gym", "Basketball", "Badminton", "Table Tennis"]

def get_today_slot_datetime(slot_time: str) -> datetime:
    now = datetime.now(timezone.utc)
    hour, minute = map(int, slot_time.split(":"))
    return now.replace(hour=hour, minute=minute, second=0, microsecond=0)

def serialize_document(doc):
    """Helper function to convert MongoDB specific types to JSON serializable types."""
    if not doc:
        return None
    # Use a copy to avoid modifying the original dictionary during iteration
    doc_copy = doc.copy()
    doc_copy["_id"] = str(doc_copy["_id"])
    for key, value in doc_copy.items():
        if isinstance(value, datetime):
            doc_copy[key] = value.isoformat()
    return doc_copy

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_booking(booking: BookingRequest, user: dict = Depends(verify_token)):
    user_id = user["id"]
    now_utc = datetime.now(timezone.utc)

    if user.get("cooldown_until") and user["cooldown_until"] > now_utc:
        cooldown_end_str = user["cooldown_until"].strftime("%Y-%m-%d %H:%M UTC")
        raise HTTPException(status_code=403, detail=f"On cooldown until {cooldown_end_str}.")

    if await bookings_collection.find_one({"user_id": user_id, "status": "booked"}):
        raise HTTPException(status_code=400, detail="You already have an active booking.")

    slot_start = get_today_slot_datetime(booking.start)
    slot_end = get_today_slot_datetime(booking.end)

    if await bookings_collection.find_one({"facility": booking.facility, "start": slot_start, "status": "booked"}):
        raise HTTPException(status_code=409, detail="This slot is already booked.")

    temp_booking_id = ObjectId()
    qr_url = f"{FRONTEND_BASE_URL}/#/verify-booking/{temp_booking_id}"
    
    qr_img = qrcode.make(qr_url)
    buffered = BytesIO()
    qr_img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

    booking_doc = {
        "_id": temp_booking_id,
        "facility": booking.facility,
        "start": slot_start,
        "end": slot_end,
        "user_id": user_id,
        "status": "booked",
        "qr_code_base64": qr_base64,
    }
    await bookings_collection.insert_one(booking_doc)
    
    # --- FIXED: Return the full, serialized booking document ---
    return serialize_document(booking_doc)

@router.get("/me")
async def get_my_status(user: dict = Depends(verify_token)):
    booking = await bookings_collection.find_one({"user_id": user["id"], "status": "booked"})
    cooldown_time = user.get("cooldown_until")
    return {
        "booking": serialize_document(booking),
        "cooldown_until": cooldown_time.isoformat() if cooldown_time else None
    }

@router.get("/booked-slots")
async def get_all_booked_slots():
    now_utc = datetime.now(timezone.utc)
    today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    slots_cursor = bookings_collection.find({"start": {"$gte": today_start}, "status": "booked"})
    
    bookings = await slots_cursor.to_list(length=None)
    # Return only the necessary, serialized data
    return [
        {
            "facility": doc["facility"],
            "start": doc["start"].isoformat(),
            "end": doc["end"].isoformat(),
        }
        for doc in bookings
    ]

@router.get("/details/{booking_id}")
async def get_booking_details(booking_id: str):
    try:
        object_id = ObjectId(booking_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid booking ID format")

    booking = await bookings_collection.find_one({"_id": object_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    
    user = await users_collection.find_one({"id": booking["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="Associated user not found.")
        
    booking["user_details"] = {"name": user["name"], "rollNumber": user["rollNumber"]}
    return serialize_document(booking)

@router.post("/verify/{booking_id}")
async def verify_booking(booking_id: str, admin: dict = Depends(verify_admin)):
    try:
        object_id = ObjectId(booking_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid booking ID format")
    result = await bookings_collection.update_one(
        {"_id": object_id, "status": "booked"},
        {"$set": {"status": "completed"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Active booking not found.")
    return {"message": "Booking marked as completed."}

@router.post("/admin/process-missed")
async def process_missed(admin: dict = Depends(verify_admin)):
    now_utc = datetime.now(timezone.utc)
    cooldown_duration = timedelta(hours=24)
    
    missed_bookings_cursor = bookings_collection.find({"end": {"$lt": now_utc}, "status": "booked"})
    count = 0
    async for booking in missed_bookings_cursor:
        await bookings_collection.update_one({"_id": booking["_id"]}, {"$set": {"status": "missed"}})
        await users_collection.update_one(
            {"id": booking["user_id"]},
            {"$set": {"cooldown_until": now_utc + cooldown_duration}}
        )
        count += 1
    return {"message": f"Processed {count} missed bookings."}

@router.delete("/cancel")
async def cancel_booking(user: dict = Depends(verify_token)):
    result = await bookings_collection.delete_one({"user_id": user["id"], "status": "booked"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="No active booking to cancel.")
    return {"message": "Booking cancelled."}
