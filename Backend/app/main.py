from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import auth, booking, db

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(booking.router, prefix="/api/booking")

@app.on_event("startup")
async def startup():
    await db.init_indexes()
