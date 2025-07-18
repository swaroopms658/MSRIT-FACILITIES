from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Get MongoDB URI and database name from environment
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

# --- CORRECT WAY TO LOAD THE URL FOR THE BACKEND ---
# It will use the value from your .env file, or "http://localhost:8000" if not found.
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000") 

# Create a MongoDB client and select the database
client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

# Define the collections to be used elsewhere
users_collection = db["users"]
bookings_collection = db["bookings"]
