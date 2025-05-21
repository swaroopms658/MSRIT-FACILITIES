import React, { useState } from 'react';

function App() {
  const [message, setMessage] = useState('');

  const fetchMessage = () => {
    fetch('https://msirit-facilites.onrender.com/api/message') // Adjust this if deployed
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

export default App;
