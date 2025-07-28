import React from "react";
import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";

import Register from "./components/Register";
import Login from "./components/Login";
import Booking from "./components/BookingForm";
import VerifyBooking from "./components/VerifyBooking";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div style={{ textAlign: "center", margin: "3rem" }}>
            <h1>Welcome to MSRIT Facilities Portal</h1>
            <p>Book gym, courts, and more with your campus account.</p>
            <div style={{ margin: "2rem", display: "flex", justifyContent: "center", gap: 20 }}>
              <Link to="/register" style={buttonStyle("#4caf50")}>Create Account</Link>
              <Link to="/login" style={buttonStyle("#2196f3")}>Sign In</Link>
              <Link to="/booking" style={buttonStyle("#ff5722")}>Book Your Slot</Link>
            </div>
          </div>
        } />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/verify-booking/:bookingId" element={<VerifyBooking />} />
      </Routes>
    </Router>
  );
}

function buttonStyle(color) {
  return ({
    padding: "14px 34px",
    borderRadius: "35px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "1.1rem",
    color: "white",
    background: color
  });
}

export default App;
