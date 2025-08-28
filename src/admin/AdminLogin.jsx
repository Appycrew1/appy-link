// src/admin/AdminLogin.jsx
import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button, TextInput } from "../components/UI";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
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
  const login = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/#admin" }
    });
    setMsg(error ? error.message : "Check your email for a magic link.");
  };
  return (
    <section className="mx-auto max-w-sm px-4 py-10">
      <h2 className="mb-4 text-2xl font-bold">Admin Login</h2>
      <form onSubmit={login} className="space-y-3">
        <TextInput type="email" placeholder="you@company.com" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <Button type="submit">Send magic link</Button>
      </form>
      {msg && <p className="mt-3 text-sm text-gray-600">{msg}</p>}
    </section>
  );
}
