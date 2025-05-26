import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const facilities = ["Gym", "Basketball", "Badminton", "Table Tennis"];
const facilityColors = {
  Gym: "#FF6F61", // Coral red
  Basketball: "#FFA726", // Orange
  Badminton: "#29B6F6", // Light Blue
  "Table Tennis": "#AB47BC", // Purple
};

const TOTAL_SLOTS = 30;

const Booking = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [currentBooking, setCurrentBooking] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookedSlots, setBookedSlots] = useState({}); // { facility: [bookedSlotNumbers] }
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Fetch booking and booked slots
  useEffect(() => {
    if (token) {
      fetchCurrentBooking();
      fetchBookedSlots();
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
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setMessage("Failed to fetch booking info.");
      }
    }
  };

  // Mock or API call to fetch booked slots for all facilities
  // For demo, assume API returns something like:
  // { Gym: [1,5,10], Basketball: [2,7], ... }
  const fetchBookedSlots = async () => {
    try {
      // Replace with your real API endpoint if you have it
      // For demo, we mock booked slots randomly
      // await axios.get('http://localhost:8000/api/booked-slots', { headers: { Authorization: `Bearer ${token}` }})
      //    .then(res => setBookedSlots(res.data));

      // MOCK:
      const mockBooked = {
        Gym: [3, 7, 15, 20],
        Basketball: [2, 10, 14],
        Badminton: [1, 6, 18, 22],
        "Table Tennis": [5, 8, 19, 29],
      };
      setBookedSlots(mockBooked);
    } catch (error) {
      setMessage("Failed to fetch booked slots.");
    }
  };

  const handleSlotClick = (facility, slot) => {
    if (bookedSlots[facility]?.includes(slot)) return; // ignore booked slots
    setSelectedFacility(facility);
    setSelectedSlot(slot);
    setMessage("");
  };

  const handleBooking = async () => {
    if (!selectedFacility || selectedSlot == null) {
      setMessage("Please select a facility and slot.");
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        "http://localhost:8000/api/booking",
        { facility: selectedFacility, slot_number: selectedSlot }, // send slot_number as well
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Booking successful!");
      fetchCurrentBooking();
      fetchBookedSlots();
      setSelectedSlot(null);
      setSelectedFacility("");
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
      setSelectedSlot(null);
      setSelectedFacility("");
      fetchBookedSlots();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setMessage(error.response?.data?.detail || "Failed to cancel booking.");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{ color: "#222", marginBottom: 24 }}>Facility Booking</h2>

      {loading && <p style={{ fontWeight: "bold" }}>Loading...</p>}

      {!loading && (
        <>
          {currentBooking ? (
            <div
              style={{
                ...styles.bookingInfo,
                borderLeft: `6px solid ${
                  facilityColors[currentBooking.facility] || "#333"
                }`,
                background: `linear-gradient(135deg, ${
                  facilityColors[currentBooking.facility]
                }22, #fff)`,
              }}
            >
              <p style={{ fontSize: "1.2rem", fontWeight: "600" }}>
                You have booked:{" "}
                <span
                  style={{ color: facilityColors[currentBooking.facility] }}
                >
                  {currentBooking.facility}
                </span>{" "}
                - Slot #{currentBooking.slot_number}
              </p>
              <p style={{ fontSize: "1rem", marginBottom: "1rem" }}>
                Slot time:{" "}
                <strong>
                  {new Date(currentBooking.slot_time).toLocaleString()}
                </strong>
              </p>
              <button
                style={{
                  ...styles.cancelBtn,
                  backgroundColor: "#ff5252",
                  boxShadow: "0 4px 8px #ff5250aa",
                }}
                onClick={handleCancel}
              >
                Cancel Booking
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontWeight: "600" }}>Select a facility and slot:</p>
                <div style={styles.facilityTabs}>
                  {facilities.map((f) => (
                    <button
                      key={f}
                      style={{
                        ...styles.facilityTab,
                        borderColor:
                          selectedFacility === f ? facilityColors[f] : "#ccc",
                        backgroundColor:
                          selectedFacility === f
                            ? facilityColors[f] + "33"
                            : "transparent",
                        color:
                          selectedFacility === f ? facilityColors[f] : "#444",
                        fontWeight: selectedFacility === f ? "700" : "500",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setSelectedFacility(f);
                        setSelectedSlot(null);
                        setMessage("");
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {selectedFacility && (
                <>
                  <div style={styles.slotsGrid}>
                    {[...Array(TOTAL_SLOTS)].map((_, idx) => {
                      const slotNum = idx + 1;
                      const isBooked =
                        bookedSlots[selectedFacility]?.includes(slotNum);
                      const isSelected = selectedSlot === slotNum;

                      return (
                        <button
                          key={slotNum}
                          disabled={isBooked}
                          onClick={() =>
                            handleSlotClick(selectedFacility, slotNum)
                          }
                          style={{
                            ...styles.slotButton,
                            backgroundColor: isBooked
                              ? "#ccc"
                              : isSelected
                              ? facilityColors[selectedFacility]
                              : "#f0f0f0",
                            color: isBooked
                              ? "#666"
                              : isSelected
                              ? "white"
                              : "#444",
                            cursor: isBooked ? "not-allowed" : "pointer",
                            boxShadow: isSelected
                              ? `0 0 10px ${facilityColors[selectedFacility]}`
                              : "none",
                            border: `2px solid ${
                              isSelected
                                ? facilityColors[selectedFacility]
                                : "#ddd"
                            }`,
                          }}
                          title={isBooked ? "Booked" : `Slot #${slotNum}`}
                        >
                          {slotNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    style={{
                      ...styles.bookBtn,
                      backgroundColor: selectedSlot
                        ? facilityColors[selectedFacility]
                        : "#bbb",
                      cursor: selectedSlot ? "pointer" : "not-allowed",
                    }}
                    onClick={handleBooking}
                    disabled={!selectedSlot}
                  >
                    Book Selected Slot
                  </button>
                </>
              )}
            </>
          )}

          {message && (
            <p
              style={{
                ...styles.message,
                color:
                  message.toLowerCase().includes("failed") ||
                  message.toLowerCase().includes("error")
                    ? "#e53935"
                    : "#43a047",
              }}
            >
              {message}
            </p>
          )}
        </>
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
    padding: "2rem",
    borderRadius: "15px",
    background: "linear-gradient(135deg, #f9f9f9, #e0e0e0)",
    boxShadow: "0 15px 40px rgba(0,0,0,0.1)",
  },
  bookingInfo: {
    marginTop: "1.5rem",
    backgroundColor: "#fff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  cancelBtn: {
    marginTop: "1rem",
    padding: "12px 25px",
    borderRadius: "25px",
    border: "none",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 10px #ff4d4daa",
    transition: "background-color 0.3s ease",
  },
  facilityTabs: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  facilityTab: {
    padding: "10px 18px",
    borderRadius: "25px",
    border: "2px solid #ccc",
    backgroundColor: "transparent",
    fontSize: "1rem",
    outline: "none",
    transition: "all 0.3s ease",
  },
  slotsGrid: {
    marginTop: "1rem",
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: "10px",
    justifyItems: "center",
  },
  slotButton: {
    width: "40px",
    height: "40px",
    borderRadius: "20px",
    border: "2px solid #ddd",
    fontSize: "1rem",
    fontWeight: "600",
    outline: "none",
    userSelect: "none",
  },
  bookBtn: {
    marginTop: "1.8rem",
    padding: "12px 40px",
    borderRadius: "30px",
    border: "none",
    color: "white",
    fontWeight: "700",
    fontSize: "1.1rem",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  message: {
    marginTop: "1.5rem",
    fontWeight: "600",
  },
};

export default Booking;
