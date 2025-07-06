import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(
        "https://configuration-corps-flower-screensaver.trycloudflare.com/auth/login",
        formData
      );
      localStorage.setItem("token", response.data.access_token);
      navigate("/booking"); // Redirect to booking page
    } catch (err) {
      let msg = "Login failed. Please try again.";

      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        msg = detail.map((e) => `${e.loc?.join(".")} → ${e.msg}`).join("\n");
      } else if (typeof detail === "string") {
        msg = detail;
      } else if (typeof detail === "object") {
        msg = JSON.stringify(detail);
      }

      setError(msg);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Login to Your Account</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="email"
          name="email"
          placeholder="College Email"
          value={formData.email}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Login
        </button>
      </form>
      {error && <pre style={styles.error}>{error}</pre>}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "400px",
    margin: "3rem auto",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
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
    padding: "10px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
  },
  error: {
    color: "red",
    marginTop: "1rem",
    textAlign: "left",
    whiteSpace: "pre-wrap",
  },
};

export default Login;
