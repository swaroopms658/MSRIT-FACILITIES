import React from "react";
import QRCode from "qrcode.react";

export default function QRDisplay({ value }) {
  if (!value) {
    return <p>No QR code to display</p>;
  }

  return (
    <div style={{ textAlign: "center", margin: "20px" }}>
      <h3>Your QR Code</h3>
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
