// src/App.jsx
import React, { Suspense, lazy, useEffect } from "react";
import { HashRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";

/* ========= Lazy-loaded pages (adjust paths if yours differ) ========= */
const ProviderProfilePage = lazy(() => import("./pages/ProviderProfilePage.jsx"));
const AdminPortal         = lazy(() => import("./admin/AdminPortal.jsx"));

/* ========= Optional: your real Home component ========= */
// If you already have a Home page, import it instead and delete this.
function Home() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Appy Link</h1>
      <p>Welcome! Try these routes:</p>
      <ul>
        <li><Link to="/admin">Admin</Link></li>
        <li><Link to="/provider?id=REPLACE_WITH_PROVIDER_ID">Provider Profile</Link></li>
      </ul>
    </div>
  );
}

/* ========= Small loader for lazy pages ========= */
function Loader() {
  return (
    <div style={{ padding: 24 }}>
      <span>Loading…</span>
    </div>
  );
}

/* ========= Normalize old hashes like "#provider" -> "#/provider" ========= */
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

/* ========= Scroll to top on route change (nice to have) ========= */
function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

/* ========= App with HashRouter ========= */
export default function App() {
  return (
    <HashRouter>
      <HashNormalizer />
      <ScrollToTop />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Admin portal (works at https://your-site/#/admin) */}
          <Route path="/admin" element={<AdminPortal />} />

          {/* Provider profile page (works at https://your-site/#/provider?id=UUID) */}
          <Route path="/provider" element={<ProviderProfilePage />} />

          {/* Helpful redirect if someone types '#/providers' */}
          <Route path="/providers" element={<Navigate to="/provider" replace />} />

          {/* 404 fallback */}
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
