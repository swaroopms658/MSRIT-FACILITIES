import React from "react";
import QRCode from "qrcode.react";

// Helper to format HH:MM like "10:00" to single-line IST AM/PM
function prettyTimeLabel(t) {
  const [h, m] = t.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date
    .toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    })
    .replace(/\s+/g, ' ')
    .replace('.', '')
    .toUpperCase();
}

// Helper to format backend ISO datetimes to IST
function formatIstTime(dtString) {
  if (!dtString) return '';
  return new Date(dtString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).replace(/\s+/g, ' ').replace('.', '').toUpperCase();
}

export default function QRDisplay({ value, slot }) {
  if (!value) {
    return <p>No QR code to display</p>;
  }

  // slot: optionally an object with {start, end}, or ISO string pair
  let timeLabel = "";
  if (slot) {
    if (slot.start && slot.end && slot.start.length <= 5 && slot.end.length <= 5) {
      // display as pretty slot
      timeLabel = `${prettyTimeLabel(slot.start)} — ${prettyTimeLabel(slot.end)}`;
    } else if (slot.start && slot.end) {
      // assume ISO datetime strings
      timeLabel = `${formatIstTime(slot.start)} — ${formatIstTime(slot.end)}`;
    }
  }

  return (
    <div style={{ textAlign: "center", margin: "20px" }}>
      <h3>Your QR Code</h3>
      {timeLabel && <div style={{ fontWeight: "bold", marginBottom: 12 }}>{timeLabel}</div>}
      <QRCode
        value={value}
        size={256}
        bgColor="#ffffff"
        fgColor="#000000"
        level="H"
        includeMargin={true}
      />
      <p style={{ marginTop: "10px", wordBreak: "break-all" }}>{value}</p>
    </div>
  );
}
