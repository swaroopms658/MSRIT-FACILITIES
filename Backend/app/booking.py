import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel

from .auth import verify_token  # your auth dependency

router = APIRouter(prefix="/api/booking", tags=["booking"])

VALID_FACILITIES = ["Gym", "Basketball", "Badminton", "Table Tennis"]


class BookingRequest(BaseModel):
    facility: str


# Store booked slots as list of bookings with start/end datetime
booked_slots: Dict[str, List[Dict]] = {f: [] for f in VALID_FACILITIES}
user_bookings: Dict[str, Dict] = {}
booking_id_map: Dict[str, Dict] = {}


def is_overlapping(start1: datetime, end1: datetime, start2: datetime, end2: datetime) -> bool:
    return max(start1, start2) < min(end1, end2)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_booking(booking: BookingRequest, user=Depends(verify_token)):
    user_id = user["id"]
    now_utc = datetime.now(timezone.utc)
    slot_start = now_utc
    slot_end = now_utc + timedelta(hours=1)

    if booking.facility not in VALID_FACILITIES:
        raise HTTPException(status_code=400, detail="Invalid facility")

    # Check if user already has an active booking (not expired)
    existing_booking = user_bookings.get(user_id)
    if existing_booking and existing_booking["end"] > now_utc:
        raise HTTPException(
            status_code=400,
            detail="User already has an active booking. Only one booking allowed at a time."
        )

    # Check overlapping bookings for the facility
    for existing in booked_slots[booking.facility]:
        if is_overlapping(slot_start, slot_end, existing["start"], existing["end"]):
            raise HTTPException(status_code=400, detail="Slot already booked for this time")

    booking_id = str(uuid.uuid4())

    new_booking = {
        "booking_id": booking_id,
        "facility": booking.facility,
        "start": slot_start,
        "end": slot_end,
        "user_id": user_id,
    }
    user_bookings[user_id] = new_booking
    booked_slots[booking.facility].append(new_booking)
    booking_id_map[booking_id] = new_booking

    return {
        "message": "Booking successful",
        "facility": booking.facility,
        "start": slot_start.isoformat(),
        "end": slot_end.isoformat(),
        "booking_id": booking_id,
    }


@router.get("/me")
async def get_current_booking(user=Depends(verify_token)):
    user_id = user["id"]
    booking = user_bookings.get(user_id)
    if booking:
        return {
            "facility": booking["facility"],
            "start": booking["start"].isoformat(),
            "end": booking["end"].isoformat(),
            "booking_id": booking["booking_id"],
        }
    else:
        return {"booking": None}


@router.get("/verify")
async def verify_booking(booking_id: str):
    booking = booking_id_map.get(booking_id)
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
    if facility:
        if facility not in VALID_FACILITIES:
            raise HTTPException(status_code=400, detail="Invalid facility")
        slots = booked_slots.get(facility, [])
        return [
            {
                "start": slot["start"].isoformat(),
                "end": slot["end"].isoformat(),
                "user_id": slot["user_id"],
            }
            for slot in slots
        ]
    else:
        # Return all booked slots for all facilities
        response = {}
        for fac, slots in booked_slots.items():
            response[fac] = [
                {
                    "start": slot["start"].isoformat(),
                    "end": slot["end"].isoformat(),
                    "user_id": slot["user_id"],
                }
                for slot in slots
            ]
        return response
