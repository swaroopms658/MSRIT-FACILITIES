import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

users_collection = db["users"]
bookings_collection = db["bookings"]
