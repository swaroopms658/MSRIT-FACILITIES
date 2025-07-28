import React from "react";
import { QRCodeSVG } from "qrcode.react";

function prettyTimeLabel(t) {
  const [h, m] = t.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  }).replace(/\s+/g, " ").replace('.', "").toUpperCase();
}

function formatIstTime(dtString) {
  if (!dtString) return '';
  return new Date(dtString).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata"
  }).replace(/\s+/g, " ").replace('.', "").toUpperCase();
}

export default function QRDisplay({ qr_url, slot }) {
  if (!qr_url) return <p>No QR code to display</p>;

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
      <QRCodeSVG value={qr_url} size={200} bgColor="#ffffff" fgColor="#000000" level="H" includeMargin={true} />
      <p style={{ marginTop: "10px", wordBreak: "break-all" }}>{qr_url}</p>
    </div>
  );
}
