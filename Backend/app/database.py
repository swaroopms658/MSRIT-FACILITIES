from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Get MongoDB URI and database name from environment
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

# Create a MongoDB client and select the database
client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

# Define the users collection to be used elsewhere
users_collection = db["users"]
