import os
from dotenv import load_dotenv

load_dotenv()  # Loads variables from a .env file if present

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/msrit_facilities")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))