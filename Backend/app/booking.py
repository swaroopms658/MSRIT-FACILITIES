import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel
from bson import ObjectId

from .auth import verify_token
from .database import bookings_collection

router = APIRouter(prefix="/api/booking", tags=["booking"])

VALID_FACILITIES = ["Gym", "Basketball", "Badminton", "Table Tennis"]


class BookingRequest(BaseModel):
    facility: str


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_booking(booking: BookingRequest, user=Depends(verify_token)):
    user_id = user["id"]
    now_utc = datetime.now(timezone.utc)
    slot_start = now_utc
    slot_end = now_utc + timedelta(minutes=30)  # 30-minute slot

    if booking.facility not in VALID_FACILITIES:
        raise HTTPException(status_code=400, detail="Invalid facility")

    # Check if user already has an active booking
    existing_booking = await bookings_collection.find_one({
        "user_id": user_id,
        "end": {"$gt": now_utc}
    })
    if existing_booking:
        raise HTTPException(
            status_code=400,
            detail="User already has an active booking. Only one booking allowed at a time."
        )

    # Check overlapping bookings for the facility
    overlapping = await bookings_collection.find_one({
        "facility": booking.facility,
        "start": {"$lt": slot_end},
        "end": {"$gt": slot_start}
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
    return {
        "message": "Booking successful",
        "facility": booking.facility,
        "start": slot_start.isoformat(),
        "end": slot_end.isoformat(),
        "booking_id": str(result.inserted_id),
    }


@router.get("/me")
async def get_current_booking(user=Depends(verify_token)):
    user_id = user["id"]
    now_utc = datetime.now(timezone.utc)
    booking = await bookings_collection.find_one({
        "user_id": user_id,
        "end": {"$gt": now_utc}
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


@router.get("/verify")
async def verify_booking(booking_id: str):
    booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    now_utc = datetime.now(timezone.utc)
    if not (booking["start"] <= now_utc <= booking["end"]):
        raise HTTPException(status_code=400, detail="Booking not active at this time")

    return {
        "message": "Booking is valid",
        "facility": booking["facility"],
        "start": booking["start"].isoformat(),
        "end": booking["end"].isoformat(),
        "user_id": booking["user_id"],
    }


@router.get("/booked-slots")
async def get_booked_slots(facility: Optional[str] = Query(None, description="Facility name")):
    now_utc = datetime.now(timezone.utc)
    query = {"end": {"$gt": now_utc}}
    if facility:
        if facility not in VALID_FACILITIES:
            raise HTTPException(status_code=400, detail="Invalid facility")
        query["facility"] = facility

    cursor = bookings_collection.find(query)
    slots = []
    async for slot in cursor:
        slots.append({
            "start": slot["start"].isoformat(),
            "end": slot["end"].isoformat(),
            "user_id": slot["user_id"],
        })
    return slots
