# backend/app/__init__.py

from .core import database
from .core.config import settings

# This ensures the DB connection is initialized at import time
client = database.client
db = database.db

__all__ = ["client", "db", "settings"]
