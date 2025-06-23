import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
import base64
from io import BytesIO
import qrcode
from bson import ObjectId

from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel
from .auth import verify_token
from .database import bookings_collection, users_collection

router = APIRouter(prefix="/api/booking", tags=["booking"])

VALID_FACILITIES = ["Gym", "Basketball", "Badminton", "Table Tennis"]


class BookingRequest(BaseModel):
    facility: str
    start: str  # "HH:MM"
    end: str    # "HH:MM"


def get_today_slot_datetime(slot_time: str) -> datetime:
    now = datetime.now(timezone.utc)
    hour, minute = map(int, slot_time.split(":"))
    return now.replace(hour=hour, minute=minute, second=0, microsecond=0)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_booking(booking: BookingRequest, user=Depends(verify_token)):
    user_id = user["id"]
    now_utc = datetime.now(timezone.utc)

    if booking.facility not in VALID_FACILITIES:
        raise HTTPException(status_code=400, detail="Invalid facility")

    slot_start = get_today_slot_datetime(booking.start)
    slot_end = get_today_slot_datetime(booking.end)

    existing_booking = await bookings_collection.find_one({
        "user_id": user_id,
        "start": {"$gte": now_utc.replace(hour=0, minute=0, second=0, microsecond=0)},
        "end": {"$lte": now_utc.replace(hour=23, minute=59, second=59, microsecond=999999)},
    })
    if existing_booking:
        raise HTTPException(
            status_code=400,
            detail="User already has an active booking. Only one booking allowed at a time."
        )

    overlapping = await bookings_collection.find_one({
        "facility": booking.facility,
        "start": slot_start,
        "end": slot_end,
    })
    if overlapping:
        raise HTTPException(status_code=400, detail="Slot already booked for this time")

    booking_doc = {
        "facility": booking.facility,
        "start": slot_start,
        "end": slot_end,
        "user_id": user_id,
    }
    result = await bookings_collection.insert_one(booking_doc)
    booking_id = str(result.inserted_id)

    # Generate QR code with link to details
    qr_url = f"https://7c66-2405-201-d004-60ea-d9f4-a9c0-8a89-b86c.ngrok-free.app/api/booking/details/{booking_id}"

    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(qr_url)
    qr.make(fit=True)
    img = qr.make_image(fill="black", back_color="white")
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

    return {
        "message": "Booking successful",
        "facility": booking.facility,
        "start": slot_start.isoformat(),
        "end": slot_end.isoformat(),
        "booking_id": booking_id,
        "qr_code": qr_base64,  # Base64-encoded image of QR code
    }


@router.get("/me")
async def get_current_booking(user=Depends(verify_token)):
    user_id = user["id"]
    now_utc = datetime.now(timezone.utc)
    booking = await bookings_collection.find_one({
        "user_id": user_id,
        "start": {"$gte": now_utc.replace(hour=0, minute=0, second=0, microsecond=0)},
        "end": {"$lte": now_utc.replace(hour=23, minute=59, second=59, microsecond=999999)},
    })
    if booking:
        return {
            "facility": booking["facility"],
            "start": booking["start"].isoformat(),
            "end": booking["end"].isoformat(),
            "booking_id": str(booking["_id"]),
        }
    else:
        return {"booking": None}


@router.get("/booked-slots")
async def get_booked_slots(facility: Optional[str] = Query(None, description="Facility name")):
    now_utc = datetime.now(timezone.utc)
    query = {
        "start": {"$gte": now_utc.replace(hour=0, minute=0, second=0, microsecond=0)},
        "end": {"$lte": now_utc.replace(hour=23, minute=59, second=59, microsecond=999999)},
    }
    if facility:
        if facility not in VALID_FACILITIES:
            raise HTTPException(status_code=400, detail="Invalid facility")
        query["facility"] = facility

    bookings = await bookings_collection.find(query).to_list(length=100)
    return [
        {
            "facility": booking["facility"],
            "start": booking["start"].isoformat(),
            "end": booking["end"].isoformat(),
            "user_id": booking["user_id"],
            "booking_id": str(booking["_id"]),
        }
        for booking in bookings
    ]


@router.delete("/cancel")
async def cancel_booking(user=Depends(verify_token)):
    user_id = user["id"]
    now_utc = datetime.now(timezone.utc)
    result = await bookings_collection.delete_one({
        "user_id": user_id,
        "start": {"$gte": now_utc.replace(hour=0, minute=0, second=0, microsecond=0)},
        "end": {"$lte": now_utc.replace(hour=23, minute=59, second=59, microsecond=999999)},
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="No booking found to cancel")
    return {"message": "Booking cancelled"}


@router.get("/details/{booking_id}")
async def get_booking_details(booking_id: str):
    try:
        object_id = ObjectId(booking_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid booking ID")

    booking = await bookings_collection.find_one({"_id": object_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    user = await users_collection.find_one({"id": booking["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "facility": booking["facility"],
        "start": booking["start"].isoformat(),
        "end": booking["end"].isoformat(),
        "user": {
            "name": user["name"],
            "email": user["email"],
            "rollNumber": user["rollNumber"],
            "department": user["department"]
        }
    }
