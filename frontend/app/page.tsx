"use client";

import { useState } from "react";

export default function Dashboard() {
  const [token, setToken] = useState("");
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState(0);

  const apiCall = async (url: string, body?: any, isGet = false, protectedRoute = false) => {
    const headers: any = { "Content-Type": "application/json" };
    if (token && protectedRoute) headers.Authorization = `Bearer ${token}`;
    
    const method = isGet ? "GET" : "POST";
    const res = await fetch(`http://localhost:4000${protectedRoute ? "/api/protected" : ""}${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    setMessage(data.message || data.error);
    return data;
  };

  const registerSupplier = async () => {
    await apiCall("/users/register", {
      name: "Test Supplier", 
      email: "supplier@test.com",
      role: "supplier",
      password: "password123"
    }, false, false);
  };

  const login = async () => {
    const data = await apiCall("/auth/login", {
      email: "supplier@test.com",
      password: "password123"
    }, false, false);
    if (data.token) setToken(data.token);
  };

  const loadUsers = async () => {
    const data = await apiCall("/users", null, true, true);
    setUsers(data);
  };

  const loadOrders = async () => {
    const data = await apiCall("/orders", null, true, true);
    setOrders(data);
  };

  return (
    <main>
      <h1>Cigar Order Hub (JWT Auth)</h1>
      
      {!token ? (
        <div style={{ margin: "2rem 0" }}>
          <button onClick={registerSupplier}>1. Register Supplier</button>
          <button onClick={login} style={{ marginLeft: "1rem" }}>2. Login</button>
          <p><strong>Status:</strong> {message}</p>
        </div>
      ) : (
        <div>
          <p>✅ Logged in as Supplier (Token active)</p>
          
          <div style={{ margin: "2rem 0" }}>
            <input 
              type="number" 
              placeholder="Retailer ID" 
              value={userId} 
              onChange={(e) => setUserId(Number(e.target.value))}
              style={{ margin
