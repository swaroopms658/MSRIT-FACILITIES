import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import Register from './components/Register';
import Login from './components/Login';
import Booking from './components/BookingForm';

function Home() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const fetchMessage = () => {
    setLoading(true);
    fetch('https://msirit-facilites.onrender.com/api/message')
      .then(res => res.json())
      .then(data => {
        setMessage(data.message);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching message:', err);
        setMessage('Failed to fetch message');
        setLoading(false);
      });
  };

  return (
    <div style={styles.container} className={fadeIn ? 'fade-in' : ''}>
      <h1 style={styles.title}>Welcome to MSRIT Facilities Portal</h1>
      <p style={styles.subtitle}>
        Seamlessly book your preferred facilities and make the most of your campus life.
      </p>
      <p style={styles.description}>
        Whether it’s the gym, basketball court, badminton arena, or table tennis hall — we've got you covered.
        Enjoy a hassle-free booking experience, instant confirmations, and manage your slots all in one place.
      </p>

      <div style={styles.buttonGroup}>
        <Link to="/register" style={{ ...styles.button, backgroundColor: '#4caf50' }} className="hover-effect">
          Create Account
        </Link>
        <Link to="/login" style={{ ...styles.button, backgroundColor: '#2196f3' }} className="hover-effect">
          Sign In
        </Link>
        <Link to="/booking" style={{ ...styles.button, backgroundColor: '#ff5722' }} className="hover-effect">
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
          {loading ? 'Loading...' : 'Get Daily Inspiration'}
        </button>
        <p style={styles.message}>{message}</p>
      </div>

      <style>{`
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
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
  container: {
    maxWidth: 700,
    margin: '80px auto',
    padding: '0 20px',
    textAlign: 'center',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#333',
  },
  title: {
    fontSize: '3rem',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: '1.4rem',
    color: '#555',
    marginBottom: 20,
  },
  description: {
    fontSize: '1.1rem',
    color: '#666',
    marginBottom: 40,
    lineHeight: 1.5,
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'center',
    gap: 25,
    flexWrap: 'wrap',
  },
  button: {
    display: 'inline-block',
    padding: '14px 34px',
    color: 'white',
    fontWeight: '700',
    fontSize: '1.1rem',
    borderRadius: 35,
    textDecoration: 'none',
    boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
    userSelect: 'none',
  },
  fetchButton: {
    padding: '12px 28px',
    fontSize: '1.1rem',
    borderRadius: 30,
    border: 'none',
    backgroundColor: '#673ab7',
    color: 'white',
    boxShadow: '0 5px 12px rgba(103, 58, 183, 0.4)',
    userSelect: 'none',
  },
  message: {
    marginTop: 20,
    fontSize: '1.2rem',
    minHeight: 28,
    color: '#444',
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

export default App;
