// src/App.jsx
import React from "react";
import { HashRouter, Routes, Route, Link, Navigate } from "react-router-dom";

// Direct imports so we avoid any lazy-loading issues
import ProviderProfilePage from "./pages/ProviderProfilePage.jsx";
import AdminPortal from "./admin/AdminPortal.jsx"; // keep if you have it; otherwise stub it

// TEMP Home page (replace with your real one if you have it)
function Home() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Appy Link</h1>
      <p>Quick links for testing:</p>
      <ul>
        <li><Link to="/admin">Admin</Link></li>
        <li><Link to="/provider?id=REPLACE_WITH_PROVIDER_ID">Provider Profile</Link></li>
      </ul>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="/provider" element={<ProviderProfilePage />} />
        <Route path="/providers" element={<Navigate to="/provider" replace />} />
        <Route
          path="*"
          element={
            <div style={{ padding: 24 }}>
              <h2>404 — Not Found</h2>
              <p><Link to="/">Go Home</Link></p>
            </div>
          }
        />
      </Routes>
    </HashRouter>
  );
}
