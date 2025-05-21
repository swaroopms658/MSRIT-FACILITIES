import React from 'react';
import QRCode from 'qrcode.react';

export default function QRDisplay({ value }) {
  // value = the string to encode in QR, e.g., user token or registration id

  if (!value) {
    return <p>No QR code to display</p>;
  }

  return (
    <div style={{ textAlign: 'center', margin: '20px' }}>
      <h3>Your QR Code</h3>
      <QRCode
        value={value}
        size={256} // size in px
        bgColor="#ffffff"
        fgColor="#000000"
        level="H" // error correction level: L, M, Q, H
        includeMargin={true}
      />
      <p style={{ marginTop: '10px', wordBreak: 'break-all' }}>{value}</p>
    </div>
  );
}
