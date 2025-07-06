import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    rollNumber: "",
    department: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await axios.post("https://configuration-corps-flower-screensaver.trycloudflare.com/auth/register", formData);
      setMessage("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      const detail = err.response?.data?.detail;

      if (Array.isArray(detail)) {
        // Pydantic validation errors
        setError(detail.map((d) => `${d.loc.join(".")} → ${d.msg}`).join("\n"));
      } else if (typeof detail === "string") {
        // Custom backend error (e.g., email already exists)
        setError(detail);
      } else {
        setError("Registration failed. Please check your input and try again.");
      }
    }
  };

  return (
    <div className="register-container" style={styles.container}>
      <h2 style={styles.header}>Register for Facility Access</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="email"
          name="email"
          placeholder="College Email (must end with @msrit.edu)"
          value={formData.email}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="text"
          name="rollNumber"
          placeholder="Roll Number"
          value={formData.rollNumber}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="text"
          name="department"
          placeholder="Department"
          value={formData.department}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="password"
          name="password"
          placeholder="Create Password"
          value={formData.password}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Register
        </button>
      </form>

      {message && <p style={styles.success}>{message}</p>}

      {error && <pre style={styles.error}>{error}</pre>}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "500px",
    margin: "auto",
    padding: "2rem",
    textAlign: "center",
    fontFamily: "sans-serif",
  },
  header: {
    marginBottom: "1rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
  },
  button: {
    background: "#4CAF50",
    color: "white",
    padding: "10px",
    fontSize: "16px",
    border: "none",
    cursor: "pointer",
  },
  success: {
    color: "green",
    marginTop: "1rem",
  },
  error: {
    color: "red",
    marginTop: "1rem",
    whiteSpace: "pre-wrap",
    textAlign: "left",
  },
};

export default Register;
