import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import QRDisplay from "./QRDisplay";

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
  for (let hour = 10; hour < 13; hour++) {
    slots.push({ start: `${hour.toString().padStart(2, "0")}:00`, end: `${hour.toString().padStart(2, "0")}:30` });
    slots.push({ start: `${hour.toString().padStart(2, "0")}:30`, end: `${(hour + 1).toString().padStart(2, "0")}:00` });
  }
  for (let hour = 14; hour < 16; hour++) {
    slots.push({ start: `${hour.toString().padStart(2, "0")}:00`, end: `${hour.toString().padStart(2, "0")}:30` });
    slots.push({ start: `${hour.toString().padStart(2, "0")}:30`, end: `${(hour + 1).toString().padStart(2, "0")}:00` });
  }
  return slots;
}

const timeSlots = generateTimeSlots();

function prettyTimeLabel(t) {
  const [h, m] = t.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date
    .toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })
    .replace(/\s+/g, " ")
    .replace(".", "")
    .toUpperCase();
}

function formatIstTime(dtString) {
  if (!dtString) return "";
  return new Date(dtString).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })
    .replace(/\s+/g, " ").replace(".", "").toUpperCase();
}

function getSlotLabel(slotStart, slotEnd) {
  if (!slotStart || !slotEnd) return "";
  return `${prettyTimeLabel(slotStart)} — ${prettyTimeLabel(slotEnd)}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowISO() {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return t.toISOString().slice(0, 10);
}

const dateOptions = [
  { value: "today", label: "Today", getDate: todayISO },
  { value: "tomorrow", label: "Tomorrow", getDate: tomorrowISO }
];

function isSlotInPast(slot, compareDate) {
  const now = new Date();
  const todayIso = todayISO();
  if (compareDate !== todayIso) return false;
  const d = new Date();
  const [h, m] = slot.end.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d.getTime() < now.getTime();
}

function BookingForm() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [currentBooking, setCurrentBooking] = useState(null);
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(facilities[0]);
  const [bookedSlots, setBookedSlots] = useState({});
  const [selectedSlotIdx, setSelectedSlotIdx] = useState(null);
  const [selectedDate, setSelectedDate] = useState("today");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastBookedSlot, setLastBookedSlot] = useState(null);

  const handleApiError = useCallback((error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      setToken(null);
      navigate("/login");
    } else {
      setMessage(
        error.response?.data?.detail
          ? "API ERROR: " + JSON.stringify(error.response.data.detail)
          : "An unexpected error occurred."
      );
      console.error("API Error Response:", error.response ?? error);
    }
  }, [navigate]);

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
        const bookingDate = dateOptions.find((d) => d.value === selectedDate).getDate();
        const [meResponse, slotsResponse] = await Promise.all([
          axios.get(`${API_URL}/api/booking/me`, { headers }),
          axios.get(`${API_URL}/api/booking/booked-slots?date=${bookingDate}`, { headers })
        ]);
        const { booking, cooldown_until } = meResponse.data;
        setCurrentBooking(booking || null);
        setCooldownUntil(cooldown_until || null);
        if (booking) setSelectedFacility(booking.facility);
        let allBooked;
        if (Array.isArray(slotsResponse.data)) {
          allBooked = facilities.reduce((acc, f) => {
            acc[f] = slotsResponse.data.filter((b) => b.facility === f);
            return acc;
          }, {});
        } else {
          allBooked = facilities.reduce((acc, f) => { acc[f] = []; return acc; }, {});
          setMessage("Error loading slot info. Please refresh or contact admin.");
        }
        setBookedSlots(allBooked);
        setLastBookedSlot(null);
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
    setSelectedSlotIdx(null);
  }, [token, navigate, handleApiError, selectedDate]);

  const isSlotBooked = (facility, slot) => {
    return bookedSlots[facility]?.some((b) => b.start === slot.start);
  };

  const handleBooking = async () => {
    if (selectedSlotIdx === null) {
      setMessage("Please select a slot before booking.");
      return;
    }
    setMessage("");
    const slot = timeSlots[selectedSlotIdx];
    const selectedBookingDate = dateOptions.find((d) => d.value === selectedDate).getDate();
    const dataToSend = {
      facility: selectedFacility,
      start: slot.start,
      end: slot.end,
      date: selectedBookingDate
    };
    try {
      const response = await axios.post(`${API_URL}/api/booking`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentBooking(response.data);
      setLastBookedSlot(slot);
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
      setLastBookedSlot(null);
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/login");
  };

  if (loading) return <div style={styles.container}><p>Loading...</p></div>;

  if (cooldownUntil && new Date(cooldownUntil) > new Date()) {
    return (
      <div style={styles.container}>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        <div style={styles.cooldownBox}>
          <h2>Booking Disabled</h2>
          <p>You are on a cooldown for missing a previous booking.</p>
          <p>
            You can book again after:{" "}
            <strong>{new Date(cooldownUntil).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</strong>
          </p>
        </div>
      </div>
    );
  }

  function getActiveBookingTimeLabel() {
    if (lastBookedSlot && currentBooking) {
      return getSlotLabel(lastBookedSlot.start, lastBookedSlot.end);
    } else if (currentBooking && currentBooking.start && currentBooking.end) {
      return `${formatIstTime(currentBooking.start)} — ${formatIstTime(currentBooking.end)}`;
    }
    return "";
  }

  // Legend above slots grid
  const legend = (
    <div style={{
      background: "#fffbe6",
      borderLeft: "5px solid #ffb300",
      color: "#b65700",
      padding: "7px 15px",
      marginBottom: "9px",
      borderRadius: "7px",
      fontSize: "1.01rem",
      maxWidth: 360,
      marginLeft: "auto",
      marginRight: "auto"
    }}>
      <span style={{
        fontWeight: 600,
        background: "#ffe0b2",
        borderRadius: "5px",
        padding: "2px 9px",
        marginRight: 7
      }}>
        Past
      </span>
      means that the slot has already started/ended and cannot be booked.
    </div>
  );

  return (
    <div style={styles.container}>
      <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>

      <h2 style={{ marginBottom: "1rem" }}>Facility Booking</h2>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 18, margin: "0 0 24px", fontSize: "1.12rem"
      }}>
        <span>Date:</span>
        <select
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={{ fontSize: "1rem", padding: "4px 10px", borderRadius: 8, marginRight: 14 }}
        >
          {dateOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {legend}
      {message &&
        <p style={{
          ...styles.message,
          color:
            message.toLowerCase().includes("error") ||
              message.toLowerCase().includes("cooldown") ||
              message.toLowerCase().includes("api error")
              ? "#e74c3c"
              : "#27ae60"
        }}>{message}</p>
      }
      {currentBooking ? (
        <div style={styles.bookingInfo}>
          <h3>Your Active Booking</h3>
          <p>
            <strong>{currentBooking.facility}</strong> at <strong>
              {getActiveBookingTimeLabel()}
            </strong>
          </p>
          <QRDisplay
            qr_url={currentBooking.qr_url}
            slot={{
              start:
                (lastBookedSlot && lastBookedSlot.start) ||
                (currentBooking.start && currentBooking.start.slice ? currentBooking.start.slice(11, 16) : ""),
              end:
                (lastBookedSlot && lastBookedSlot.end) ||
                (currentBooking.end && currentBooking.end.slice ? currentBooking.end.slice(11, 16) : "")
            }}
          />
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
              const bookingDate = dateOptions.find(d => d.value === selectedDate).getDate();
              const past = isSlotInPast(slot, bookingDate);
              return (
                <button
                  key={idx}
                  disabled={isBooked || past}
                  onClick={() => setSelectedSlotIdx(idx)}
                  style={{
                    ...styles.slotButton,
                    backgroundColor: isBooked
                      ? "#bdc3c7"
                      : past
                        ? "#efefef"
                        : selectedSlotIdx === idx
                          ? facilityColors[selectedFacility]
                          : "#2ecc71",
                    cursor: isBooked || past ? "not-allowed" : "pointer",
                    color: past ? "#8a8a8a" : "white",
                    opacity: past ? 0.55 : 1,
                    position: "relative",
                  }}
                  title={
                    past
                      ? "You cannot book a slot in the past."
                      : isBooked
                        ? "Slot already booked"
                        : ""
                  }
                >
                  <div>
                    {prettyTimeLabel(slot.start)} — {prettyTimeLabel(slot.end)}
                  </div>
                  {past && (
                    <div style={{
                      marginTop: 3,
                      fontSize: "0.98em",
                      color: "#b65700",
                      background: "#ffe0b2",
                      borderRadius: "5px",
                      padding: "2px 8px",
                      display: "inline-block",
                      fontWeight: 600
                    }}>
                      Past
                      <span style={{
                        display: "block",
                        color: "#a96300",
                        fontWeight: 400,
                        fontSize: "0.97em",
                        marginTop: 2
                      }}>
                        You cannot book a past slot
                      </span>
                    </div>
                  )}
                  {isBooked && !past && (
                    <span style={{
                      marginLeft: 8,
                      color: "#aaa",
                      fontSize: "0.9em"
                    }}>
                      Booked
                    </span>
                  )}
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
  container: { maxWidth: "700px", margin: "2rem auto", fontFamily: "sans-serif", textAlign: "center", padding: "1rem", position: "relative" },
  cooldownBox: { padding: "2rem", backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '8px', color: '#d46b08' },
  facilityTabs: { display: "flex", justifyContent: "center", gap: "10px", marginBottom: "1.5rem", flexWrap: "wrap" },
  facilityTab: { padding: "8px 18px", borderRadius: "25px", border: "2px solid", fontSize: "1rem", cursor: "pointer" },
  slotsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", marginBottom: "1.5rem" },
  slotButton: {
    width: "100%",
    minHeight: "60px",
    borderRadius: "10px",
    border: "none",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "1.17rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  bookBtn: { padding: "13px 38px", borderRadius: "30px", border: "none", color: "white", fontWeight: "700", fontSize: "1.1rem", cursor: "pointer" },
  bookingInfo: { padding: "1.5rem", backgroundColor: "#f9f9f9", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
  cancelBtn: { marginTop: "1rem", padding: "10px 20px", border: "none", borderRadius: "25px", color: "white", fontWeight: "600", cursor: "pointer", backgroundColor: "#e74c3c" },
  message: { marginTop: "1rem", fontWeight: "600" },
  logoutBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    padding: "8px 15px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.9rem",
  },
};

export default BookingForm;
