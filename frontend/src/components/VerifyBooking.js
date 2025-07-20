import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const IST = 'Asia/Kolkata';
function formatIstTime(dtString) {
  if (!dtString) return '';
  return new Date(dtString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: IST,
  });
}


const VerifyBooking = () => {
  const { bookingId } = useParams();
  const [adminToken, setAdminToken] = useState(localStorage.getItem("adminToken"));
  const [bookingDetails, setBookingDetails] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/booking/details/${bookingId}`);
            setBookingDetails(response.data);
        } catch (err) {
            setError("Could not fetch booking details. The booking may not exist or the link is invalid.");
        } finally {
            setLoading(false);
        }
    };
    fetchDetails();
  }, [bookingId]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem("adminToken", response.data.access_token);
      setAdminToken(response.data.access_token);
      setError("");
    } catch (err) {
      setError("Admin login failed. Please check credentials.");
    }
  };

  const handleVerifyAttendance = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/booking/verify/${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setMessage(response.data.message);
      setBookingDetails(prev => ({ ...prev, status: 'completed' }));
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 401 || status === 403) {
        // Token invalid/expired: clear token and show login form
        localStorage.removeItem("adminToken");
        setAdminToken(null);
        setError("Session expired. Please log in again as admin.");
      } else {
        setError(detail || "Verification failed.");
      }
    }
  };


  if (loading) return <div style={styles.container}><p>Loading...</p></div>;

  // --- FIXED: Added a more robust check for bookingDetails and its nested properties ---
  if (!bookingDetails || !bookingDetails.user_details) {
    return <div style={styles.container}><p style={styles.error}>{error || "No booking details found."}</p></div>;
  }

  if (!adminToken) {
    return (
      <div style={styles.container}>
        <h2 style={styles.header}>Admin Verification Required</h2>
        <p>You must be logged in as an admin to verify this booking.</p>
        <div style={styles.detailsCard}>
          <p><strong>Student:</strong> {bookingDetails.user_details.name}</p>
          <p><strong>Facility:</strong> {bookingDetails.facility}</p>
        </div>
        <form onSubmit={handleAdminLogin} style={styles.form}>
          <input type="email" placeholder="Admin Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input}/>
          <input type="password" placeholder="Admin Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input}/>
          <button type="submit" style={styles.button}>Login as Admin</button>
        </form>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Verify Booking Attendance</h2>
      <div style={styles.detailsCard}>
        <p><strong>Student:</strong> {bookingDetails.user_details.name}</p>
        <p><strong>Roll Number:</strong> {bookingDetails.user_details.rollNumber}</p>
        <p><strong>Facility:</strong> {bookingDetails.facility}</p>
        <p>
          <strong>Time:</strong> {formatIstTime(bookingDetails.start)} - {formatIstTime(bookingDetails.end)}
        </p>

        <p><strong>Status:</strong> <span style={{...styles.status, backgroundColor: bookingDetails.status === 'completed' ? '#2ecc71' : '#f1c40f' }}>{bookingDetails.status}</span></p>
        {bookingDetails.status === 'booked' && (
          <button onClick={handleVerifyAttendance} style={{...styles.button, backgroundColor: '#27ae60'}}>Confirm Attendance</button>
        )}
      </div>
      {message && <p style={styles.success}>{message}</p>}
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
};

const styles = {
  container: { maxWidth: "500px", margin: "3rem auto", padding: "2rem", textAlign: "center", fontFamily: "sans-serif", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", borderRadius: "8px" },
  header: { marginBottom: "1.5rem", color: "#333" },
  form: { display: "flex", flexDirection: "column", gap: "1rem", marginTop: '1rem' },
  input: { padding: "12px", fontSize: "16px", borderRadius: "5px", border: "1px solid #ccc" },
  button: { background: "#3498db", color: "white", padding: "12px", fontSize: "16px", border: "none", cursor: "pointer", borderRadius: "5px" },
  detailsCard: { background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px", lineHeight: "1.8", textAlign: 'left' },
  status: { padding: '5px 10px', borderRadius: '15px', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' },
  success: { color: "green", marginTop: "1rem" },
  error: { color: "red", marginTop: "1rem" },
};

export default VerifyBooking;
