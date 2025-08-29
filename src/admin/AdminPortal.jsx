// src/admin/AdminPortal.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

export default function AdminPortal() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  // Helper to read current session safely
  const readSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      setSession(data.session || null);
    } catch (e) {
      setError(e.message);
      setSession(null);
    } finally {
      setChecking(false);
    }
  };

  // On mount: get session, then subscribe to changes
  useEffect(() => {
    if (!supabase) return;
    (async () => {
      await readSession();
      const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s || null);
        setChecking(false);
      });
      return () => sub?.subscription?.unsubscribe?.();
    })();
  }, []);

  // Load profile (role) if we have a user
  useEffect(() => {
    (async () => {
      if (!session?.user) { setProfile(null); return; }
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("email, role")
          .eq("id", session.user.id)
          .maybeSingle();
        if (error) throw error;
        setProfile(data || null);
      } catch (e) {
        setProfile(null);
      }
    })();
  }, [session?.user?.id]);

  // Not configured
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

  // Still checking session?
  if (checking) return <section className="mx-auto max-w-2xl px-4 py-10">Checking session…</section>;

  // No session → show login
  if (!session) return <AdminLogin />;

  // Session exists → ALWAYS render dashboard; show debug above it
  return (
    <section>
      <div className="mx-auto my-4 max-w-5xl rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div><strong>Signed in as:</strong> {session.user?.email || "(no email)"} · <strong>User ID:</strong> {session.user?.id?.slice(0,8)}…</div>
            <div><strong>Profile role:</strong> {profile?.role || "unknown"} {profile?.email ? `(${profile.email})` : ""}</div>
            {error && <div className="text-red-700"><strong>Error:</strong> {error}</div>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={async()=>{ await supabase.auth.signOut(); location.reload(); }}
              className="rounded-lg border border-blue-300 bg-white px-3 py-1 font-semibold text-blue-900 hover:bg-blue-100"
            >Sign out</button>
            <button
              onClick={()=>location.reload()}
              className="rounded-lg border border-blue-300 bg-white px-3 py-1 font-semibold text-blue-900 hover:bg-blue-100"
            >Reload</button>
          </div>
        </div>
        <div className="mt-2">
          <details><summary>Debug JSON</summary>
            <pre className="mt-2 overflow-auto rounded bg-white p-2">{JSON.stringify({
              origin: window.location.origin,
              hash: window.location.hash,
              user: { id: session.user?.id, email: session.user?.email },
              profile
            }, null, 2)}</pre>
          </details>
        </div>
      </div>
      <AdminDashboard />
    </section>
  );
}
