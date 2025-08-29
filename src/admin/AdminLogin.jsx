// src/admin/AdminLogin.jsx
import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button, TextInput, OutlineButton } from "../components/UI";

export default function AdminLogin() {
  const [mode, setMode] = useState("magic"); // 'magic' | 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!supabase) {
    return (
      <section className="mx-auto max-w-xl px-4 py-10">
        <h2 className="mb-2 text-2xl font-bold">Supabase not configured</h2>
        <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
          <li>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in Vercel.</li>
          <li>Redeploy the site.</li>
          <li>Supabase → Auth → URL Config: add <code>{window.location.origin}/#admin</code> to Redirect URLs.</li>
        </ol>
      </section>
    );
  }

  const redirectTo = window.location.origin + "/#admin";

  const sendMagicLink = async (e) => {
    e.preventDefault(); setMsg(""); setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email, options: { emailRedirectTo: redirectTo }
    });
    setLoading(false);
    setMsg(error ? error.message : "Check your email for a magic link.");
  };

  const signInWithPassword = async (e) => {
    e.preventDefault(); setMsg(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    setMsg(error ? error.message : "Signed in.");
  };

  const signUpWithPassword = async (e) => {
    e.preventDefault(); setMsg(""); setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password, options: { emailRedirectTo: redirectTo }
    });
    setLoading(false);
    setMsg(error ? error.message : "Account created. Check your email to confirm (if required).");
  };

  const sendPasswordReset = async () => {
    setMsg(""); setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    setMsg(error ? error.message : "Password reset link sent (check your email).");
  };

  return (
    <section className="mx-auto max-w-sm px-4 py-10">
      <h2 className="mb-4 text-2xl font-bold">Admin Access</h2>

      <div className="mb-4 inline-flex rounded-2xl border border-gray-300 bg-white p-1 text-sm font-semibold">
        <button onClick={()=>setMode("magic")}
          className={`px-3 py-1.5 rounded-xl ${mode==="magic"?"bg-gray-900 text-white":"text-gray-800"}`}>
          Magic Link
        </button>
        <button onClick={()=>setMode("signin")}
          className={`px-3 py-1.5 rounded-xl ${mode==="signin"?"bg-gray-900 text-white":"text-gray-800"}`}>
          Password
        </button>
        <button onClick={()=>setMode("signup")}
          className={`px-3 py-1.5 rounded-xl ${mode==="signup"?"bg-gray-900 text-white":"text-gray-800"}`}>
          Sign Up
        </button>
      </div>

      {mode === "magic" && (
        <form onSubmit={sendMagicLink} className="space-y-3">
          <TextInput type="email" placeholder="you@company.com" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <Button type="submit" disabled={loading}>{loading?"Sending…":"Send magic link"}</Button>
        </form>
      )}

      {mode === "signin" && (
        <form onSubmit={signInWithPassword} className="space-y-3">
          <TextInput type="email" placeholder="you@company.com" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <TextInput type="password" placeholder="Your password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          <div className="flex items-center justify-between">
            <Button type="submit" disabled={loading}>{loading?"Signing in…":"Sign in"}</Button>
            <OutlineButton type="button" onClick={sendPasswordReset} disabled={!email || loading}>Forgot password?</OutlineButton>
          </div>
        </form>
      )}

      {mode === "signup" && (
        <form onSubmit={signUpWithPassword} className="space-y-3">
          <TextInput type="email" placeholder="you@company.com" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <TextInput type="password" placeholder="Create a strong password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          <Button type="submit" disabled={loading}>{loading?"Creating…":"Create account"}</Button>
          <p className="mt-2 text-xs text-gray-500">Tip: you can require email confirmations in Supabase Auth settings, or allow immediate sign-in.</p>
        </form>
      )}

      {msg && <p className="mt-4 text-sm text-gray-700">{msg}</p>}
    </section>
  );
}
