// src/App.jsx
import React, { Suspense, lazy, useEffect } from "react";
import { HashRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";

/* ===== Lazy-loaded pages (paths match your structure) ===== */
const ProviderProfilePage = lazy(() => import("./pages/ProviderProfilePage.jsx"));
const AdminPortal         = lazy(() => import("./admin/AdminPortal.jsx"));

/* ===== Simple Home (replace with your real Home component if you have one) ===== */
function Home() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Appy Link</h1>
      <p>Welcome! Try these:</p>
      <ul>
        <li><Link to="/admin">Admin</Link></li>
        <li><Link to="/provider?id=REPLACE_WITH_PROVIDER_ID">Provider Profile</Link></li>
      </ul>
    </div>
  );
}

/* ===== Loader while pages stream in ===== */
function Loader() {
  return <div style={{ padding: 24 }}>Loading…</div>;
}

/* ===== Normalize old-style hashes like "#provider" → "#/provider" ===== */
function HashNormalizer() {
  useEffect(() => {
    if (location.hash.startsWith("#provider")) {
      location.replace("#" + location.hash.replace("#provider", "/provider"));
    }
    if (location.hash === "#admin") {
      location.replace("#/admin");
    }
  }, []);
  return null;
}

/* ===== Scroll to top on route change (nice to have) ===== */
function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

/* ===== App with HashRouter ===== */
export default function App() {
  return (
    <HashRouter>
      <HashNormalizer />
      <ScrollToTop />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Admin portal: https://your-site/#/admin */}
          <Route path="/admin" element={<AdminPortal />} />

          {/* Provider profile: https://your-site/#/provider?id=UUID */}
          <Route path="/provider" element={<ProviderProfilePage />} />

          {/* Helpful redirect if someone types '#/providers' */}
          <Route path="/providers" element={<Navigate to="/provider" replace />} />

          {/* 404 */}
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
      </Suspense>
    </HashRouter>
  );
}
