from fastapi import APIRouter, HTTPException
from typing import List

router = APIRouter()

# Example booking model (replace with your actual model)
from pydantic import BaseModel

class Booking(BaseModel):
    id: int
    facility: str
    user: str
    date: str

# In-memory "database" for demonstration
bookings_db = []

@router.get("/", response_model=List[Booking])
def get_bookings():
    return bookings_db

@router.post("/", response_model=Booking)
def create_booking(booking: Booking):
    bookings_db.append(booking)
    return booking