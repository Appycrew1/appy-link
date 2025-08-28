// src/admin/AdminPortal.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

export default function AdminPortal() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  if (!supabase) {
    return (
      <section className="mx-auto max-w-xl px-4 py-10">
        <h2 className="mb-2 text-2xl font-bold">Supabase not configured</h2>
        <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
          <li>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in Vercel (Preview + Production).</li>
          <li>Redeploy the site.</li>
          <li>Supabase → Auth → URL Config: add <code>{window.location.origin}/#admin</code> to Redirect URLs.</li>
        </ol>
      </section>
    );
  }

  useEffect(() => {
    // live session watcher
    const sub = supabase.auth.onAuthStateChange(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user || null);
      setChecking(false);
    });
    // initial load (hard refresh)
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user || null);
      setChecking(false);
    })();
    return () => { sub?.data?.subscription?.unsubscribe?.(); };
  }, []);

  if (checking) return <section className="mx-auto max-w-2xl px-4 py-10">Checking session…</section>;
  if (!user) return <AdminLogin />;
  return <AdminDashboard />;
}
