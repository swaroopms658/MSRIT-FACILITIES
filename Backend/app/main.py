from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import connect_to_mongo, close_mongo_connection
from app.routes import auth, booking  # Import your routers

app = FastAPI()

# Allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/message")
def get_message():
    return {"message": "Hello from FastAPI!"}
# Include API routes
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(booking.router, prefix="/booking", tags=["Booking"])

# MongoDB connection startup/shutdown
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()
    print("✅ MongoDB connected")

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()
    print("🛑 MongoDB connection closed")

# Health check route (optional)
@app.get("/")
def root():
    return {"message": "MSRIT Facility Booking API is live!"}
