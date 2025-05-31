import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Register from "./components/Register";
import Login from "./components/Login";
import Booking from "./components/BookingForm";

// import navstyles from './styles/navStyles';
function Home() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const fetchMessage = () => {
    setLoading(true);
    fetch("https://msirit-facilites.onrender.com/api/message")
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.message);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching message:", err);
        setMessage("Failed to fetch message");
        setLoading(false);
      });
  };

  return (
    <div>
      {/* Alert Ticker */}
      <div style={styles.alertBox}>
        <marquee
          behavior="scroll"
          direction="left"
          scrollamount="6"
          style={styles.alertText}
        >
          🚨 Manage Slots for Various Facilities | Book your Gym, TT, Badminton
          slots today | New facilities coming soon!
        </marquee>
      </div>
      {/* Main Container */}
      <div style={styles.container} className={fadeIn ? "fade-in" : ""}>
        <div style={styles.headerContainer}>
          <img
            src="/images/ramaiah logo.png"
            alt="Ramaiah Institute of Technology Logo"
            style={styles.logo}
          />
          <h1 style={styles.title}>Welcome to MSRIT Facilities Portal</h1>
        </div>
        <p style={styles.subtitle}>
          Seamlessly book your preferred facilities and make the most of your
          campus life.
        </p>
        <p style={styles.description}>
          Whether it's the gym, basketball court, badminton arena, or table
          tennis hall — we've got you covered. Enjoy a hassle-free booking
          experience, instant confirmations, and manage your slots all in one
          place.
        </p>
        <div style={styles.buttonGroup}>
          <Link
            to="/register"
            style={{ ...styles.button, backgroundColor: "#4caf50" }}
            className="hover-effect"
          >
            Create Account
          </Link>
          <Link
            to="/login"
            style={{ ...styles.button, backgroundColor: "#2196f3" }}
            className="hover-effect"
          >
            Sign In
          </Link>
          <Link
            to="/booking"
            style={{ ...styles.button, backgroundColor: "#ff5722" }}
            className="hover-effect"
          >
            Book Your Slot
          </Link>
        </div>
        <div style={{ marginTop: 40 }}>
          <button
            onClick={fetchMessage}
            style={styles.fetchButton}
            disabled={loading}
            className="hover-effect"
          >
            {loading ? "Loading..." : "Get Daily Inspiration"}
          </button>
          <p style={styles.message}>{message}</p>
        </div>
      </div>
      <style>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeInUp 0.8s ease forwards;
        }
        .hover-effect {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
          user-select: none;
        }
        .hover-effect:hover {
          transform: translateY(-5px) scale(1.05);
          box-shadow: 0 8px 15px rgba(0,0,0,0.2);
        }
        button[disabled].hover-effect:hover {
          transform: none;
          box-shadow: none;
          cursor: not-allowed;
          opacity: 0.7;
        }
        nav a:hover {
          color: #ff9800 !important;
          text-shadow: 0 0 8px #ff9800;
        }
      `}</style>
    </div>
  );
}

const styles = {
  alertBox: {
    width: "100%",
    backgroundColor: "#b71c1c",
    color: "#fff",
    padding: "6px 0",
    fontWeight: "600",
    fontSize: "1rem",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },
  alertText: {
    fontFamily: "monospace",
    paddingLeft: "1rem",
  },
  container: {
    maxWidth: 850,
    margin: "30px auto", // Reduced from 60px to 30px
    padding: "30px 25px", // Reduced from 50px 30px
    textAlign: "center",
    fontFamily: "'Poppins', sans-serif",
    color: "#2C3E50",
    background: `linear-gradient(rgba(255, 255, 255, 0.75), rgba(227, 242, 253, 0.75)), 
                url('/images/statue.jpg')`,
    backgroundSize: "cover", // Changed from 100% 100% to cover
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
    borderRadius: "15px", // Reduced from 20px
    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
    position: "relative",
    overflow: "hidden",
  },
  headerContainer: {
    display: "flex",
    flexDirection: "row", // Change from 'column' to 'row'
    alignItems: "center",
    justifyContent: "center",
    gap: "15px", // Reduced from 20px
    marginBottom: "20px", // Reduced from 25px
  },
  logo: {
    height: "60px", // Fixed height instead of maxWidth
    width: "auto",
    objectFit: "contain",
    margin: 0, // Remove auto margins
  },
  title: {
    fontSize: "2.5rem", // Slightly smaller to match logo height
    margin: 0, // Remove default margin
    fontWeight: "bold",
    color: "#1a237e",
    textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
  },
  subtitle: {
    fontSize: "1.5rem",
    color: "#37474f",
    marginBottom: 15, // Reduced from 20
    textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
  },
  description: {
    fontSize: "1.1rem",
    color: "#555",
    marginBottom: 40,
    lineHeight: 1.6,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    padding: "15px", // Reduced from 20px
    borderRadius: "10px",
    backdropFilter: "blur(8px)",
    margin: "15px auto", // Reduced from 20px
    maxWidth: "95%", // Increased from 90%
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "center",
    gap: 20, // Reduced from 25
    flexWrap: "wrap",
    margin: "25px 0", // Added margin
  },
  button: {
    padding: "14px 34px",
    color: "white",
    fontWeight: "600",
    fontSize: "1.1rem",
    borderRadius: 35,
    textDecoration: "none",
    userSelect: "none",
    boxShadow: "0 6px 12px rgba(0,0,0,0.1)",
  },
  fetchButton: {
    padding: "12px 28px",
    fontSize: "1.1rem",
    borderRadius: 30,
    border: "none",
    backgroundColor: "#6a1b9a",
    color: "white",
    boxShadow: "0 5px 12px rgba(106, 27, 154, 0.4)",
    userSelect: "none",
  },
  message: {
    marginTop: 20,
    fontSize: "1.2rem",
    color: "#333",
    minHeight: 28,
  },
};
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/booking" element={<Booking />} />
      </Routes>
    </Router>
  );
}

// function App() {
//   return (
//     <Router>
//       <nav style={navStyles.nav}>
//         <Link to="/" style={navStyles.link}>Home</Link>
//         <Link to="/register" style={navStyles.link}>Register</Link>
//         <Link to="/login" style={navStyles.link}>Login</Link>
//         <Link to="/booking" style={navStyles.link}>Booking</Link>
//       </nav>

//   <Routes>
//     <Route path="/" element={<Home />} />
//     <Route path="/register" element={<Register />} />
//     <Route path="/login" element={<Login />} />
//     <Route path="/booking" element={<Booking />} />
//   </Routes>
// </Router>
//   );
// }

export default App;
