from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import asyncio

from .auth import router as auth_router
from .booking import router as booking_router, process_missed_bookings

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://msirit-facilites-1.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(booking_router)

scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup_event():
    def run_missed_bookings_job():
        asyncio.create_task(process_missed_bookings())

    scheduler.add_job(
        run_missed_bookings_job,
        trigger='cron',
        hour='10-19',
        minute='10,40',
        id='missed_bookings_job',
        replace_existing=True,
    )
    scheduler.start()
    print("[Scheduler] Missed bookings processor scheduled.")

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()
    print("[Scheduler] Scheduler stopped.")

@app.get("/")
async def root():
    return {"message": "Facilities Booking Service is running"}
