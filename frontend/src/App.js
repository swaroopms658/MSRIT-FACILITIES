import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Import your pages (create these or I can help)
import Register from './components/Register';
import Login from './components/Login';
import Booking from './components/BookingForm';

function Home() {
  const [message, setMessage] = useState('');

  const fetchMessage = () => {
    fetch('https://msirit-facilites.onrender.com/api/message') // Adjust if needed
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => {
        console.error('Error fetching message:', error);
        setMessage('Failed to fetch message');
      });
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>FastAPI Message Fetcher</h1>
      <button onClick={fetchMessage}>Get Message</button>
      <p>{message}</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <nav style={{ padding: '1rem', backgroundColor: '#eee', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <Link to="/">Home</Link>
        <Link to="/register">Register</Link>
        <Link to="/login">Login</Link>
        <Link to="/booking">Booking</Link>
      </nav>

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
