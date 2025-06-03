from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth import router as auth_router
from .booking import router as booking_router

app = FastAPI()

# Allow frontend on localhost:3000 to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include your auth routes under /auth prefix
app.include_router(auth_router)

# Include booking routes under /api/booking prefix (already prefixed in booking.py)
app.include_router(booking_router)

@app.get("/")
def root():
    return {"message": "Service is running"}