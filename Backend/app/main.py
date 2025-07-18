from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .auth import router as auth_router
from .booking import router as booking_router

app = FastAPI()

# Allow all origins for development purposes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the authentication and booking routers
app.include_router(auth_router)
app.include_router(booking_router)

@app.get("/")
def root():
    return {"message": "Facilities Booking Service is running"}
