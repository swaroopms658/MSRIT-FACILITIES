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

function generateTimeSlots() {
  const slots = [];
  let hour = 10,
    minute = 0;
  while (hour < 13 || (hour === 13 && minute === 0)) {
    const start = `${hour.toString().padStart(2, "0")}:${
      minute === 0 ? "00" : "30"
    }`;
    minute += 30;
    if (minute === 60) {
      hour += 1;
      minute = 0;
    }
    const end = `${hour.toString().padStart(2, "0")}:${
      minute === 0 ? "00" : "30"
    }`;
    slots.push({ start, end });
  }
  hour = 14;
  minute = 0;
  while (hour < 16 || (hour === 16 && minute === 0)) {
    const start = `${hour.toString().padStart(2, "0")}:${
      minute === 0 ? "00" : "30"
    }`;
    minute += 30;
    if (minute === 60) {
      hour += 1;
      minute = 0;
    }
    const end = `${hour.toString().padStart(2, "0")}:${
      minute === 0 ? "00" : "30"
    }`;
    slots.push({ start, end });
  }
  return slots;
}

const timeSlots = generateTimeSlots();

// --- IMPORTANT: Replace this with your actual backend URL from .env file ---
const API_URL = `${process.env.REACT_APP_BACKEND_URL}`;


function BookingForm() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [currentBooking, setCurrentBooking] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(facilities[0]);
  const [bookedSlots, setBookedSlots] = useState({});
  const [selectedSlotIdx, setSelectedSlotIdx] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);

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
  }, [token]); // Removed selectedFacility to prevent re-fetching slots on tab change

  const fetchCurrentBooking = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/booking/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const bookingData = response.data.booking;
      setCurrentBooking(bookingData || null);
      
      // <-- SET THE QR CODE FROM THE FETCHED BOOKING DATA
      if (bookingData) {
        setQrCode(bookingData.qr_code || null);
        setSelectedFacility(bookingData.facility);
        const idx = timeSlots.findIndex(
          (slot) =>
            slot.start === bookingData.start.slice(11, 16) &&
            slot.end === bookingData.end.slice(11, 16)
        );
        setSelectedSlotIdx(idx !== -1 ? idx : null);
      } else {
        // Clear QR code if there's no booking
        setQrCode(null);
        setSelectedSlotIdx(null);
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        setToken(null); // Clear token state
        navigate("/login");
      } else {
        setMessage("Failed to fetch booking info.");
      }
    }
  };

  const fetchBookedSlots = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/booking/booked-slots`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Group booked slots by facility for efficient lookup
      const allBooked = facilities.reduce((acc, facility) => {
        acc[facility] = response.data.filter(b => b.facility === facility);
        return acc;
      }, {});

      setBookedSlots(allBooked);
    } catch (error) {
      setMessage("Failed to fetch booked slots.");
    }
  };

  const isSlotBooked = (facility, slot) => {
    const booked = bookedSlots[facility] || [];
    return booked.some(
      (b) =>
        b.start.slice(11, 16) === slot.start && b.end.slice(11, 16) === slot.end
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
      const response = await fetch(`${API_URL}/api/booking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          facility: selectedFacility,
          start: slot.start,
          end: slot.end,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Booking successful!");
        // The QR code is already in the response, but we re-fetch to be sure
        fetchCurrentBooking(); 
        fetchBookedSlots();
      } else {
        setMessage(`Error: ${data.detail || JSON.stringify(data)}`);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setMessage("Failed to create booking.");
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/api/booking/cancel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Booking cancelled.");
      setCurrentBooking(null);
      setSelectedSlotIdx(null);
      setQrCode(null); // <-- CLEAR THE QR CODE ON CANCEL
      fetchBookedSlots(); // Refresh slot availability
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setMessage(error.response?.data?.detail || "Failed to cancel booking.");
    }
  };

  // This function is called when the user clicks a facility tab
  const handleFacilityChange = (facility) => {
    setSelectedFacility(facility);
    setSelectedSlotIdx(null); // Reset selected slot
    setMessage("");
  };

  return (
    <div style={styles.container}>
      <h2 style={{ marginBottom: "1rem" }}>Facility Booking</h2>

      <div style={styles.facilityTabs}>
        {facilities.map((facility) => (
          <button
            key={facility}
            onClick={() => handleFacilityChange(facility)}
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

      {/* Display QR Code and booking info if a booking exists */}
      {!loading && currentBooking ? (
        <div style={styles.bookingInfo}>
          <p>
            You have booked: <strong>{currentBooking.facility}</strong>
          </p>
          <p>
            Slot time:{" "}
            <strong>
              {currentBooking.start.slice(11, 16)} -{" "}
              {currentBooking.end.slice(11, 16)}
            </strong>
          </p>
          {qrCode && (
            <div style={{marginTop: '20px'}}>
              <h3>Your Booking QR Code</h3>
              <img src={`data:image/png;base64,${qrCode}`} alt="Booking QR Code" />
            </div>
          )}
          <button
            style={{ ...styles.cancelBtn, backgroundColor: "#e74c3c" }}
            onClick={handleCancel}
          >
            Cancel Booking
          </button>
        </div>
      ) : (
        // Display booking form if no booking exists
        !loading && (
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
                        ? "#bdc3c7" // Grey for booked
                        : isSelected
                        ? facilityColors[selectedFacility] // Highlight color
                        : "#2ecc71", // Default available color
                      color: "white",
                      cursor: isBooked ? "not-allowed" : "pointer",
                      boxShadow: isSelected ? `0 0 8px ${facilityColors[selectedFacility]}` : "none",
                      border: "none",
                      opacity: isBooked ? 0.6 : 1,
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
                backgroundColor:
                  selectedSlotIdx !== null
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
        )
      )}

      {message && (
        <p
          style={{
            ...styles.message,
            color:
              message.toLowerCase().includes("error") ||
              message.toLowerCase().includes("fail")
                ? "#e74c3c"
                : "#27ae60",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

// Styles remain the same
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
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "12px",
    justifyItems: "center",
    marginBottom: "1.8rem",
  },
  slotButton: {
    width: "100%",
    height: "45px",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    outline: "none",
    userSelect: "none",
    transition: "all 0.3s ease",
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

export default BookingForm;
