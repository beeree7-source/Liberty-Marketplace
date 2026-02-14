"use client";

import { useState } from "react";

export default function Dashboard() {
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState(0);

  const apiCall = async (url: string, body?: any) => {
    const res = await fetch(`http://localhost:4000${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setMessage(data.message || data.error);
    if (data.user) setUserId(data.user.id);
  };

  return (
    <main>
      <h1>Cigar Order Hub Dashboard</h1>
      
      <div style={{ margin: "2rem 0" }}>
        <button onClick={() => apiCall("/api/users/register", { name: "Test Retailer", email: "retailer@test.com", role: "retailer" })}>
          1. Register Retailer
        </button>
      </div>

      <div style={{ margin: "2rem 0" }}>
        <input 
          type="number" 
          placeholder="User ID" 
          value={userId} 
          onChange={(e) => setUserId(Number(e.target.value))}
          style={{ marginRight: "1rem" }}
        />
        <button onClick={() => apiCall(`/api/users/${userId}/approve`)}>
          2. Approve Retailer
        </button>
      </div>

      <div style={{ margin: "2rem 0" }}>
        <button onClick={() => apiCall(`/api/users/${userId}/license`, { licenseNumber: "FL123", expirationDate: "2027-01-01", fileName: "license.pdf" })}>
          3. Upload License
        </button>
      </div>

      <div style={{ margin: "2rem 0" }}>
        <button onClick={() => apiCall("/api/orders", { retailerId: userId, supplierId: 999, items: [{ product: "Cohiba", qty: 10 }] })}>
          4. Place Test Order
        </button>
      </div>

      <p><strong>Result:</strong> {message}</p>
    </div>
  );
}
