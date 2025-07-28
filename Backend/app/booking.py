import base64
from io import BytesIO
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, status
from pytz import timezone as pytz_timezone
from .models import BookingRequest
from .auth import verify_token, verify_admin
from .database import bookings_collection, users_collection, FRONTEND_BASE_URL

router = APIRouter(prefix="/api/booking", tags=["booking"])

VALID_FACILITIES = ["Gym", "Basketball", "Badminton", "Table Tennis"]
IST = pytz_timezone("Asia/Kolkata")


def get_slot_datetime(date_str: str, slot_time: str) -> datetime:
    naive_dt = datetime.strptime(f"{date_str} {slot_time}", "%Y-%m-%d %H:%M")
    ist_dt = IST.localize(naive_dt)
    return ist_dt.astimezone(timezone.utc)


def get_today_str():
    return datetime.now(IST).date().isoformat()


def get_tomorrow_str():
    return (datetime.now(IST) + timedelta(days=1)).date().isoformat()


def serialize_document(doc):
    if not doc:
        return None
    # Copy to avoid side effects
    doc_copy = doc.copy()
    doc_copy["_id"] = str(doc_copy["_id"])
    for key, value in doc_copy.items():
        if isinstance(value, datetime):
            doc_copy[key] = value.astimezone(IST).isoformat()
    # qr_url included in DB doc, no base64 QR code anymore
    return doc_copy


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_booking(booking: BookingRequest, user=Depends(verify_token)):
    user_id = user["id"]
    now_utc = datetime.now(timezone.utc)

    booking_date = booking.date or get_today_str()
    try:
        slot_start = get_slot_datetime(booking_date, booking.start)
        slot_end = get_slot_datetime(booking_date, booking.end)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid slot or date.")

    if booking_date == get_today_str() and slot_start < now_utc:
        raise HTTPException(status_code=400, detail="Cannot book a slot in the past.")

    if user.get("cooldown_until") and user["cooldown_until"] > now_utc:
        cooldown_end_str = user["cooldown_until"].strftime("%Y-%m-%d %H:%M UTC")
        raise HTTPException(status_code=403, detail=f"On cooldown until {cooldown_end_str}.")

    if await bookings_collection.find_one({"user_id": user_id, "status": "booked"}):
        raise HTTPException(status_code=400, detail="You already have an active booking.")

    clash_filter = {
        "facility": booking.facility,
        "date": booking_date,
        "start": booking.start,
        "status": "booked"
    }
    if await bookings_collection.find_one(clash_filter):
        raise HTTPException(status_code=409, detail="This slot is already booked.")

    temp_booking_id = ObjectId()
    qr_url = f"{FRONTEND_BASE_URL}/#/verify-booking/{temp_booking_id}"

    booking_doc = {
        "_id": temp_booking_id,
        "facility": booking.facility,
        "date": booking_date,
        "start": booking.start,
        "end": booking.end,
        "user_id": user_id,
        "status": "booked",
        "qr_url": qr_url,  # Send QR URL string only
    }
    await bookings_collection.insert_one(booking_doc)
    return serialize_document(booking_doc)


@router.get("/me")
async def get_my_status(user=Depends(verify_token)):
    booking = await bookings_collection.find_one({"user_id": user["id"], "status": "booked"})
    cooldown_time = user.get("cooldown_until")

    if booking:
        booking_date_str = booking.get("date")
        start_time = booking.get("start")
        end_time = booking.get("end")

        if booking_date_str and start_time and end_time:
            try:
                naive_start = datetime.strptime(f"{booking_date_str} {start_time}", "%Y-%m-%d %H:%M")
                naive_end = datetime.strptime(f"{booking_date_str} {end_time}", "%Y-%m-%d %H:%M")
                ist_start = IST.localize(naive_start)
                ist_end = IST.localize(naive_end)
                booking["start"] = ist_start.isoformat()
                booking["end"] = ist_end.isoformat()
            except Exception:
                pass

        booking = serialize_document(booking)

    return {
        "booking": booking,
        "cooldown_until": cooldown_time.isoformat() if cooldown_time else None
    }


@router.get("/booked-slots")
async def get_all_booked_slots(date: str = None):
    query_date = date or get_today_str()
    booked = await bookings_collection.find({"date": query_date, "status": "booked"}).to_list(length=None)
    return [
        {
            "facility": doc["facility"],
            "date": doc["date"],
            "start": doc["start"],
            "end": doc["end"],
        }
        for doc in booked
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

    booking_date_str = booking.get("date")
    if booking_date_str:
        naive_date = datetime.strptime(booking_date_str, "%Y-%m-%d")
        booking["date"] = IST.localize(naive_date).isoformat()

    start_time = booking.get("start")
    end_time = booking.get("end")

    if booking_date_str and start_time and end_time:
        naive_start = datetime.strptime(f"{booking_date_str} {start_time}", "%Y-%m-%d %H:%M")
        naive_end = datetime.strptime(f"{booking_date_str} {end_time}", "%Y-%m-%d %H:%M")
        booking["start"] = IST.localize(naive_start).isoformat()
        booking["end"] = IST.localize(naive_end).isoformat()

    booking["user_details"] = {"name": user["name"], "rollNumber": user["rollNumber"]}
    return serialize_document(booking)


@router.post("/verify/{booking_id}")
async def verify_booking(booking_id: str, admin=Depends(verify_admin)):
    try:
        object_id = ObjectId(booking_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid booking ID format")

    booking = await bookings_collection.find_one({"_id": object_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if admin.get("department") != booking.get("facility"):
        raise HTTPException(status_code=403, detail="You are not authorized to approve this facility's bookings.")

    result = await bookings_collection.update_one(
        {"_id": object_id, "status": "booked"},
        {"$set": {"status": "completed"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Active booking not found.")
    return {"message": "Booking marked as completed."}


@router.post("/admin/process-missed")
async def process_missed(admin=Depends(verify_admin)):
    now_utc = datetime.now(timezone.utc)
    cooldown_duration = timedelta(hours=24)

    missed_bookings_cursor = bookings_collection.find({
        "status": "booked",
        "$expr": {
            "$lt": [
                { "$dateFromString": {
                    "dateString": { "$concat": ["$date", "T", "$end", ":00+05:30"] }
                }},
                now_utc
            ]
        }
    })
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
async def cancel_booking(user=Depends(verify_token)):
    result = await bookings_collection.delete_one({"user_id": user["id"], "status": "booked"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="No active booking to cancel.")
    return {"message": "Booking cancelled."}
