import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get MongoDB URI and database name from environment
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

# This URL points to your FRONTEND application for the QR code
# For local testing, use your computer's IP: http://192.168.1.5:3000
# For production, use your deployed frontend URL.
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")

# --- Database Setup ---
client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

# Define collections for use in other files
users_collection = db["users"]
bookings_collection = db["bookings"]
