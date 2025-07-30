import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables from a .env file (MONGO_URI, DB_NAME, FRONTEND_BASE_URL, etc.)
load_dotenv()

# MongoDB connection string, e.g. mongodb+srv://username:password@cluster.mongodb.net
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable not set")

# Database name to use
DB_NAME = os.getenv("DB_NAME", "facility_booking_db")  # default DB name if not set

# Frontend base URL (used in booking router for QR URL etc.)
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")

# Initialize MongoDB async client
client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

# Collections
users_collection = db["users"]
bookings_collection = db["bookings"]
