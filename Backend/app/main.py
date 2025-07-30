from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import asyncio

from .auth import router as auth_router
from .booking import router as booking_router, process_missed_bookings

app = FastAPI()

# Configure CORS - adjust origins to your frontend URLs
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development React frontend
        "https://msirit-facilites-1.onrender.com",  # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include authentication and booking routes
app.include_router(auth_router)
app.include_router(booking_router)

# Initialize the APScheduler
scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup_event():
    """
    On app start, schedule the missed bookings processing job.
    The job runs at minutes 10 and 40 between 10AM and 7PM IST daily.
    """
    def run_missed_bookings_job():
        asyncio.create_task(process_missed_bookings())

    # Add the scheduled job
    scheduler.add_job(
        run_missed_bookings_job,
        trigger="cron",
        hour="10-19",
        minute="10,40",
        id="missed_bookings_job",
        replace_existing=True,
    )
    scheduler.start()
    print("[Scheduler] Missed bookings processor scheduled.")

@app.on_event("shutdown")
def shutdown_event():
    """Shutdown scheduler gracefully on app shutdown."""
    scheduler.shutdown(wait=False)
    print("[Scheduler] Scheduler stopped.")

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "Facilities Booking Service is running"}
