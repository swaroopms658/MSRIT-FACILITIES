// BookingForm.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const facilities = ["Gym", "Basketball", "Badminton", "Table Tennis"];

const facilityColors = {
  Gym: "#e67e22",
  Basketball: "#2980b9",
  Badminton: "#27ae60",
  "Table Tennis": "#8e44ad",
};

// Helper to generate 30-min time slots for 10:00-13:30 and 14:00-16:30
function generateTimeSlots() {
  const slots = [];
  // Morning: 10:00 to 13:30
  let hour = 10, minute = 0;
  while (hour < 13 || (hour === 13 && minute === 0)) {
    const start = `${hour.toString().padStart(2, "0")}:${minute === 0 ? "00" : "30"}`;
    minute += 30;
    if (minute === 60) {
      hour += 1;
      minute = 0;
    }
    const end = `${hour.toString().padStart(2, "0")}:${minute === 0 ? "00" : "30"}`;
    slots.push({ start, end });
  }
  // Afternoon: 14:00 to 16:30
  hour = 14; minute = 0;
  while (hour < 16 || (hour === 16 && minute === 0)) {
    const start = `${hour.toString().padStart(2, "0")}:${minute === 0 ? "00" : "30"}`;
    minute += 30;
    if (minute === 60) {
      hour += 1;
      minute = 0;
    }
    const end = `${hour.toString().padStart(2, "0")}:${minute === 0 ? "00" : "30"}`;
    slots.push({ start, end });
  }
  return slots;
}

const timeSlots = generateTimeSlots();

const Booking = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [currentBooking, setCurrentBooking] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(facilities[0]);
  const [bookedSlots, setBookedSlots] = useState({}); // {facility: [{start, end}]}
  const [selectedSlotIdx, setSelectedSlotIdx] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (token) {
      fetchCurrentBooking();
      fetchBookedSlots();
    }
    // eslint-disable-next-line
  }, [token, selectedFacility]);

  const fetchCurrentBooking = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8000/api/booking/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentBooking(response.data.booking || null);
      setLoading(false);
      if (response.data.booking) {
        setSelectedFacility(response.data.booking.facility);
        // Find the slot index that matches the booking's start and end
        const idx = timeSlots.findIndex(
          (slot) =>
            slot.start === response.data.booking.start.slice(11, 16) &&
            slot.end === response.data.booking.end.slice(11, 16)
        );
        setSelectedSlotIdx(idx !== -1 ? idx : null);
      } else {
        setSelectedSlotIdx(null);
      }
    } catch (error) {
      setLoading(false);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setMessage("Failed to fetch booking info.");
      }
    }
  };

  const fetchBookedSlots = async () => {
    try {
      let allBooked = {};
      for (const facility of facilities) {
        const response = await axios.get(
          `http://localhost:8000/api/booking/booked-slots?facility=${encodeURIComponent(
            facility
          )}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        // Store as array of {start, end}
        allBooked[facility] = response.data || [];
      }
      setBookedSlots(allBooked);
    } catch (error) {
      setMessage("Failed to fetch booked slots.");
    }
  };

  const isSlotBooked = (facility, slot) => {
    // slot: {start, end}
    const booked = bookedSlots[facility] || [];
    return booked.some(
      (b) =>
        b.start.slice(11, 16) === slot.start &&
        b.end.slice(11, 16) === slot.end
    );
  };

  const handleSlotClick = (idx) => {
    setSelectedSlotIdx(idx);
    setMessage("");
  };

  const handleBooking = async () => {
    if (selectedSlotIdx === null) {
      setMessage("Please select a slot to book.");
      return;
    }
    try {
      setLoading(true);
      const slot = timeSlots[selectedSlotIdx];
      await axios.post(
        "http://localhost:8000/api/booking",
        {
          facility: selectedFacility,
          start: slot.start,
          end: slot.end,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Booking successful!");
      setLoading(false);
      fetchCurrentBooking();
      fetchBookedSlots();
    } catch (error) {
      setLoading(false);
      setMessage(error.response?.data?.detail || "Failed to create booking.");
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);
      await axios.delete("http://localhost:8000/api/booking/cancel", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Booking cancelled.");
      setCurrentBooking(null);
      setSelectedSlotIdx(null);
      fetchBookedSlots();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setMessage(error.response?.data?.detail || "Failed to cancel booking.");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{ marginBottom: "1rem" }}>Facility Booking</h2>

      {/* Facility Tabs */}
      <div style={styles.facilityTabs}>
        {facilities.map((facility) => (
          <button
            key={facility}
            onClick={() => {
              setSelectedFacility(facility);
              setSelectedSlotIdx(null);
              setMessage("");
            }}
            style={{
              ...styles.facilityTab,
              backgroundColor:
                selectedFacility === facility
                  ? facilityColors[facility]
                  : "transparent",
              color:
                selectedFacility === facility
                  ? "white"
                  : facilityColors[facility],
              borderColor: facilityColors[facility],
              fontWeight: selectedFacility === facility ? "700" : "500",
            }}
          >
            {facility}
          </button>
        ))}
      </div>

      {loading && <p style={{ marginTop: "1rem" }}>Loading...</p>}

      {!loading && currentBooking ? (
        <div style={styles.bookingInfo}>
          <p>
            You have booked: <strong>{currentBooking.facility}</strong>
          </p>
          <p>
            Slot time:{" "}
            <strong>
              {currentBooking.start.slice(11, 16)} - {currentBooking.end.slice(11, 16)}
            </strong>
          </p>
          <button
            style={{ ...styles.cancelBtn, backgroundColor: "#e74c3c" }}
            onClick={handleCancel}
          >
            Cancel Booking
          </button>
        </div>
      ) : (
        <>
          <div style={styles.slotsGrid}>
            {timeSlots.map((slot, idx) => {
              const isBooked = isSlotBooked(selectedFacility, slot);
              const isSelected = selectedSlotIdx === idx;

              return (
                <button
                  key={idx}
                  disabled={isBooked}
                  onClick={() => handleSlotClick(idx)}
                  style={{
                    ...styles.slotButton,
                    backgroundColor: isBooked
                      ? "#e74c3c"
                      : isSelected
                      ? "#27ae60"
                      : "#2ecc71",
                    color: "white",
                    cursor: isBooked ? "not-allowed" : "pointer",
                    boxShadow: isSelected ? "0 0 8px #27ae60" : "none",
                    border: "none",
                    minWidth: 90,
                  }}
                  title={isBooked ? "Booked" : `${slot.start} - ${slot.end}`}
                >
                  {slot.start} - {slot.end}
                </button>
              );
            })}
          </div>

          <button
            style={{
              ...styles.bookBtn,
              backgroundColor: selectedSlotIdx !== null
                ? facilityColors[selectedFacility]
                : "#bdc3c7",
              cursor: selectedSlotIdx !== null ? "pointer" : "not-allowed",
            }}
            onClick={handleBooking}
            disabled={selectedSlotIdx === null}
          >
            Book Selected Slot
          </button>
        </>
      )}

      {message && (
        <p
          style={{
            ...styles.message,
            color: message.toLowerCase().includes("failed")
              ? "#e74c3c"
              : "#27ae60",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "600px",
    margin: "3rem auto",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    textAlign: "center",
    padding: "0 1rem",
  },
  facilityTabs: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
  },
  facilityTab: {
    padding: "8px 18px",
    borderRadius: "25px",
    border: "2px solid",
    backgroundColor: "transparent",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
    minWidth: "110px",
  },
  slotsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    justifyItems: "center",
    marginBottom: "1.8rem",
  },
  slotButton: {
    width: "120px",
    height: "45px",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    outline: "none",
    userSelect: "none",
    transition: "background-color 0.3s ease, box-shadow 0.3s ease",
  },
  bookBtn: {
    padding: "14px 40px",
    borderRadius: "30px",
    border: "none",
    color: "white",
    fontWeight: "700",
    fontSize: "1.1rem",
    transition: "background-color 0.3s ease",
  },
  bookingInfo: {
    marginTop: "1rem",
    backgroundColor: "#f9f9f9",
    padding: "1.5rem",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgb(0 0 0 / 0.05)",
  },
  cancelBtn: {
    marginTop: "1.2rem",
    padding: "10px 20px",
    border: "none",
    borderRadius: "25px",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  message: {
    marginTop: "1.2rem",
    fontWeight: "600",
  },
};

export default Booking;