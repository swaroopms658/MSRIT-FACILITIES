from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
import os
import bcrypt
from typing import Union
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
# --- Bcrypt password hashing and verification ---
def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt
   
    Args:
        password: Plain text password
       
    Returns:
        Hashed password as string
    """
    # Generate salt and hash password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against its hash
   
    Args:
        plain_password: Plain text password to verify
        hashed_password: Previously hashed password
       
    Returns:
        True if password matches, False otherwise
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False
def validate_password_strength(password: str) -> tuple[bool, list[str]]:
    """
    Validate password strength
   
    Args:
        password: Password to validate
       
    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
   
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
   
    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")
   
    if not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter")
   
    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one digit")
   
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        errors.append("Password must contain at least one special character")
   
    return len(errors) == 0, errors
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
def decode_access_token(token: str):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])