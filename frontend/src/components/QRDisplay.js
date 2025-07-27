import React from "react";
import { QRCodeSVG } from "qrcode.react";

function prettyTimeLabel(t) {
  const [h, m] = t.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })
    .replace(/\s+/g, " ").replace('.', "").toUpperCase();
}

function formatIstTime(dtString) {
  if (!dtString) return '';
  return new Date(dtString).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata"
  }).replace(/\s+/g, " ").replace('.', "").toUpperCase();
}

export default function QRDisplay({ value, slot, qr_code_base64 }) {
  if (!value && !qr_code_base64) return <p>No QR code to display</p>;

  let timeLabel = "";
  if (slot) {
    if (slot.start && slot.end && slot.start.length <= 5 && slot.end.length <= 5) {
      timeLabel = `${prettyTimeLabel(slot.start)} — ${prettyTimeLabel(slot.end)}`;
    } else if (slot.start && slot.end) {
      timeLabel = `${formatIstTime(slot.start)} — ${formatIstTime(slot.end)}`;
    }
  }

  return (
    <div style={{ textAlign: "center", margin: "20px" }}>
      <h3>Your QR Code</h3>
      {timeLabel && <div style={{ fontWeight: "bold", marginBottom: 12 }}>{timeLabel}</div>}
      {qr_code_base64
        ? <img src={`data:image/png;base64,${qr_code_base64}`} alt="Booking QR Code" style={{ maxWidth: '200px', margin: '1rem auto', display: 'block' }} />
        : (value && <QRCodeSVG value={value} size={256} bgColor="#ffffff" fgColor="#000000" level="H" includeMargin={true} />)
      }
      {value && <p style={{ marginTop: "10px", wordBreak: "break-all" }}>{value}</p>}
    </div>
  );
}
