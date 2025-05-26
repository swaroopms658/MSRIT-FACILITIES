import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const facilities = ["Gym", "Basketball", "Badminton", "Table Tennis"];

const Booking = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [currentBooking, setCurrentBooking] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Fetch current booking
  useEffect(() => {
    if (token) {
      fetchCurrentBooking();
    }
  }, [token]);

  const fetchCurrentBooking = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8000/api/booking/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentBooking(response.data.booking || null);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (error.response && error.response.status === 401) {
        // Token invalid or expired
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setMessage("Failed to fetch booking info.");
      }
    }
  };

  const handleBooking = async () => {
    if (!selectedFacility) {
      setMessage("Please select a facility to book.");
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        "http://localhost:8000/api/booking",
        { facility: selectedFacility },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Booking successful!");
      fetchCurrentBooking();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setMessage(
        error.response?.data?.detail ||
          "Failed to create booking. You may have an active booking already."
      );
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
      setSelectedFacility("");
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setMessage(error.response?.data?.detail || "Failed to cancel booking.");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Facility Booking</h2>

      {loading && <p>Loading...</p>}

      {!loading && (
        <>
          {currentBooking ? (
            <div style={styles.bookingInfo}>
              <p>
                You have booked: <strong>{currentBooking.facility}</strong>
              </p>
              <p>
                Slot time:{" "}
                <strong>
                  {new Date(currentBooking.slot_time).toLocaleString()}
                </strong>
              </p>
              <button style={styles.cancelBtn} onClick={handleCancel}>
                Cancel Booking
              </button>
            </div>
          ) : (
            <div style={styles.bookingForm}>
              <label htmlFor="facility-select">Select Facility:</label>
              <select
                id="facility-select"
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
                style={styles.select}
              >
                <option value="">--Choose a Facility--</option>
                {facilities.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <button style={styles.bookBtn} onClick={handleBooking}>
                Book Slot
              </button>
            </div>
          )}

          {message && <p style={styles.message}>{message}</p>}
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "500px",
    margin: "3rem auto",
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
  },
  bookingForm: {
    marginTop: "1rem",
  },
  select: {
    padding: "10px",
    fontSize: "16px",
    marginRight: "10px",
  },
  bookBtn: {
    padding: "10px 15px",
    fontSize: "16px",
    cursor: "pointer",
  },
  bookingInfo: {
    marginTop: "1rem",
    backgroundColor: "#f0f0f0",
    padding: "1rem",
    borderRadius: "5px",
  },
  cancelBtn: {
    marginTop: "1rem",
    padding: "8px 12px",
    backgroundColor: "#ff4d4d",
    border: "none",
    color: "white",
    cursor: "pointer",
  },
  message: {
    marginTop: "1rem",
    color: "green",
  },
};

export default Booking;
