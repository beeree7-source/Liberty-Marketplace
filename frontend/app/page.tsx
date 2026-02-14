"use client";

import { useState } from "react";

export default function Dashboard() {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");

  const login = async () => {
    const res = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "supplier@test.com", password: "password123" })
    });
    const data = await res.json();
    if (data.token) setToken(data.token);
    setMessage(data.message || data.error);
  };

  const testProtected = async () => {
    const res = await fetch("http://localhost:4000/api/protected/users", {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    const data = await res.json();
    setMessage(data.message || JSON.stringify(data));
  };

  return (
    <main>
      <h1>Cigar Order Hub - JWT Test</h1>
      {!token ? (
        <button onClick={login}>Login (supplier@test.com / password123)</button>
      ) : (
        <button onClick={testProtected}>Test Protected Route</button>
      )}
      <p>{message}</p>
    </main>
  );
}
