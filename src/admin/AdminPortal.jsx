import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

export default function AdminPortal() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [recovering, setRecovering] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const readSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      console.log("Initial session check", data, error);
      if (!error) setSession(data.session || null);
      setChecking(false);
    };

    readSession();

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      console.log("Auth state changed:", event, s);
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      setSession(s || null);
      setChecking(false);
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  const submitNewPassword = async (e) => {
    e.preventDefault();
    setMsg("");
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setMsg(error ? error.message : "Password updated. You are now signed in.");
    if (!error) setRecovering(false);
  };

  if (!supabase) {
    return (
      <section className="mx-auto max-w-xl px-4 py-10">
        <h2 className="mb-2 text-2xl font-bold">Supabase not configured</h2>
        <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
          <li>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in Vercel.</li>
          <li>Redeploy the site.</li>
          <li>Supabase → Auth → URL Config: add <code>{window.location.origin}/#admin</code>.</li>
        </ol>
      </section>
    );
  }

  if (checking)
    return <section className="mx-auto max-w-2xl px-4 py-10">Checking session…</section>;

  if (recovering) {
    return (
      <section className="mx-auto max-w-sm px-4 py-10">
        <h2 className="mb-4 text-2xl font-bold">Reset Password</h2>
        <form onSubmit={submitNewPassword} className="space-y-3">
          <input
            className="block w-full rounded-2xl border border-gray-300 px-4 py-2 text-sm"
            type="password"
            placeholder="New password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            required
          />
          <button
            className="inline-flex items-center justify-center rounded-2xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
            type="submit"
          >
            Update password
          </button>
        </form>
        {msg && <p className="mt-3 text-sm text-gray-700">{msg}</p>}
      </section>
    );
  }

  if (!session) {
    console.log("No session found, showing login");
    return <AdminLogin />;
  }

  console.log("Session found, rendering dashboard", session);
  try {
    return <AdminDashboard />;
  } catch (err) {
    console.error("Failed to render AdminDashboard:", err);
    return <div className="p-10 text-center text-red-600">Error loading dashboard. Check console.</div>;
  }
}
