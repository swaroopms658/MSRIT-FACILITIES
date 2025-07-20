import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const facilities = ["Gym", "Basketball", "Badminton", "Table Tennis"];
const facilityColors = { 
  Gym: "#e67e22", 
  Basketball: "#2980b9", 
  Badminton: "#27ae60", 
  "Table Tennis": "#8e44ad" 
};

function generateTimeSlots() {
  const slots = [];
  // 10:00-13:00 (last slot ends at 13:00)
  for (let hour = 10; hour < 13; hour++) {
    slots.push({ start: `${String(hour).padStart(2, '0')}:00`, end: `${String(hour).padStart(2, '0')}:30` });
    slots.push({ start: `${String(hour).padStart(2, '0')}:30`, end: `${String(hour + 1).padStart(2, '0')}:00` });
  }
  // 14:00-16:00 (last slot ends at 16:00)
  for (let hour = 14; hour < 16; hour++) {
    slots.push({ start: `${String(hour).padStart(2, '0')}:00`, end: `${String(hour).padStart(2, '0')}:30` });
    slots.push({ start: `${String(hour).padStart(2, '0')}:30`, end: `${String(hour + 1).padStart(2, '0')}:00` });
  }
  return slots;
}
const timeSlots = generateTimeSlots();

// Helper: Convert "10:00" to "10:00 AM" in IST
function prettyTimeLabel(t) {
  const [h, m] = t.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute:'2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
}

// For ISO datetimes (from backend), show IST
function formatIstTime(dtString) {
  if (!dtString) return '';
  return new Date(dtString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

function BookingForm() {
  const navigate = useNavigate();
  const [token] = useState(localStorage.getItem("token"));
  const [currentBooking, setCurrentBooking] = useState(null);
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(facilities[0]);
  const [bookedSlots, setBookedSlots] = useState({});
  const [selectedSlotIdx, setSelectedSlotIdx] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const handleApiError = (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      navigate("/login");
    } else {
      setMessage(error.response?.data?.detail || "An unexpected error occurred.");
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchInitialData = async () => {
      setLoading(true);
      setMessage("");
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [meResponse, slotsResponse] = await Promise.all([
          axios.get(`${API_URL}/api/booking/me`, { headers }),
          axios.get(`${API_URL}/api/booking/booked-slots`, { headers })
        ]);

        const { booking, cooldown_until } = meResponse.data;
        setCurrentBooking(booking || null);
        setCooldownUntil(cooldown_until || null);
        if (booking) setSelectedFacility(booking.facility);

        const allBooked = facilities.reduce((acc, f) => {
          acc[f] = slotsResponse.data.filter(b => b.facility === f);
          return acc;
        }, {});
        setBookedSlots(allBooked);

      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [token, navigate]);

  const isSlotBooked = (facility, slot) => {
    return bookedSlots[facility]?.some(b => b.start.slice(11, 16) === slot.start);
  };

  const handleBooking = async () => {
    if (selectedSlotIdx === null) return;
    setMessage("");
    try {
      const slot = timeSlots[selectedSlotIdx];
      const response = await axios.post(`${API_URL}/api/booking`,
        { facility: selectedFacility, start: slot.start, end: slot.end },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentBooking(response.data);
      setMessage("Booking successful!");
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleCancel = async () => {
    setMessage("");
    try {
      await axios.delete(`${API_URL}/api/booking/cancel`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Booking cancelled.");
      setCurrentBooking(null);
    } catch (error) {
      handleApiError(error);
    }
  };

  if (loading) return <div style={styles.container}><p>Loading...</p></div>;

  if (cooldownUntil && new Date(cooldownUntil) > new Date()) {
    return (
      <div style={styles.container}>
        <div style={styles.cooldownBox}>
          <h2>Booking Disabled</h2>
          <p>You are on a cooldown for missing a previous booking.</p>
          <p>You can book again after: <strong>{new Date(cooldownUntil).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={{ marginBottom: "1rem" }}>Facility Booking</h2>
      {message && 
        <p style={{
          ...styles.message, 
          color: message.toLowerCase().includes("error") || message.toLowerCase().includes("cooldown") ? "#e74c3c" : "#27ae60"
        }}>{message}</p>
      }

      {currentBooking ? (
        <div style={styles.bookingInfo}>
          <h3>Your Active Booking</h3>
          <p>
            <strong>{currentBooking.facility}</strong> at <strong>
              {formatIstTime(currentBooking.start)} — {formatIstTime(currentBooking.end)}
            </strong>
          </p>
          {currentBooking.qr_code_base64 && 
            <img src={`data:image/png;base64,${currentBooking.qr_code_base64}`} alt="Booking QR Code" style={{maxWidth: '200px', margin: '1rem auto', display: 'block'}}/>
          }
          <button onClick={handleCancel} style={styles.cancelBtn}>Cancel Booking</button>
        </div>
      ) : (
        <>
          <div style={styles.facilityTabs}>
            {facilities.map(f => (
              <button key={f} onClick={() => setSelectedFacility(f)} 
                style={{
                  ...styles.facilityTab, 
                  backgroundColor: selectedFacility === f ? facilityColors[f] : "transparent", 
                  color: selectedFacility === f ? "white" : facilityColors[f], 
                  borderColor: facilityColors[f]
                }}>{f}
              </button>
            ))}
          </div>
          <div style={styles.slotsGrid}>
            {timeSlots.map((slot, idx) => {
              const isBooked = isSlotBooked(selectedFacility, slot);
              return (
                <button 
                  key={idx} 
                  disabled={isBooked}
                  onClick={() => setSelectedSlotIdx(idx)}
                  style={{
                    ...styles.slotButton, 
                    backgroundColor: isBooked
                      ? "#bdc3c7"
                      : selectedSlotIdx === idx
                        ? facilityColors[selectedFacility]
                        : "#2ecc71",
                    cursor: isBooked ? "not-allowed" : "pointer"
                  }}
                >
                  {prettyTimeLabel(slot.start)} — {prettyTimeLabel(slot.end)}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleBooking}
            disabled={selectedSlotIdx === null}
            style={{
              ...styles.bookBtn, 
              backgroundColor: selectedSlotIdx !== null ? facilityColors[selectedFacility] : "#bdc3c7"
            }}
          >
            Book Selected Slot
          </button>
        </>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: "700px", margin: "2rem auto", fontFamily: "sans-serif", textAlign: "center", padding: "1rem" },
  cooldownBox: { padding: '2rem', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '8px', color: '#d46b08' },
  facilityTabs: { display: "flex", justifyContent: "center", gap: "10px", marginBottom: "1.5rem", flexWrap: "wrap" },
  facilityTab: { padding: "8px 18px", borderRadius: "25px", border: "2px solid", fontSize: "1rem", cursor: "pointer" },
  slotsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px", marginBottom: "1.5rem" },
  slotButton: { width: "100%", height: "45px", borderRadius: "8px", border: "none", color: "white", fontWeight: "600", cursor: "pointer", fontSize: "1.1rem" },
  bookBtn: { padding: "12px 30px", borderRadius: "30px", border: "none", color: "white", fontWeight: "700", fontSize: "1.1rem", cursor: "pointer" },
  bookingInfo: { padding: "1.5rem", backgroundColor: "#f9f9f9", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
  cancelBtn: { marginTop: "1rem", padding: "10px 20px", border: "none", borderRadius: "25px", color: "white", fontWeight: "600", cursor: "pointer", backgroundColor: "#e74c3c" },
  message: { marginTop: "1rem", fontWeight: "600" },
};

export default BookingForm;
