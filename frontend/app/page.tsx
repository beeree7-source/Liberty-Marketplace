"use client";

import { useState, useEffect } from "react";

export default function Dashboard() {
  const [token, setToken] = useState("");
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState(0);

  const apiCall = async (url: string, body?: any, isGet = false) => {
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const method = isGet ? "GET" : "POST";
    const res = await fetch(`http://localhost:4000${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    setMessage(data.message || data.error);
    return data;
  };

  const login = async () => {
    const data = await apiCall("/api/auth/login", {
      email: "supplier@test.com",
      password: "password123"
    });
    if (data.token) setToken(data.token);
  };

  const registerSupplier = async () => {
    await apiCall("/api/users/register", {
      name: "Test Supplier", 
      email: "supplier@test.com",
      role: "supplier",
      password: "password123"
    });
  };

  // Rest of your functions (loadUsers, etc.) stay the same...
  const loadUsers = async () => { const data = await apiCall("/api/protected/users", null, true); setUsers(data); };
  const loadOrders = async () => { const data = await apiCall("/api/protected/orders", null, true); setOrders(data); };

  return (
    <main>
      <h1>Cigar Order Hub (JWT Auth)</h1>
      
      {!token ? (
        <div>
          <button onClick={registerSupplier}>Register Test Supplier</button>
          <button onClick={login} style={{ marginLeft: "1rem" }}>Login</button>
        </div>
      ) : (
        <>
          <p>✅ Logged in (Token active)</p>
          {/* Your existing workflow buttons here */}
          <div style={{ margin: "2rem 0" }}>
            <input type="number" placeholder="User ID" value={userId} onChange={(e) => setUserId(Number(e.target.value))} style={{
