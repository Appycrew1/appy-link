// src/admin/AdminLogin.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button, TextInput, OutlineButton } from "../components/UI";

export default function AdminLogin() {
  const [mode, setMode] = useState("magic"); // 'magic' | 'signin' | 'signup' | 'fix'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    e.preventDefault();
    setMsg("");
    setError("");
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo }
      });
      
      if (error) throw error;
      setMsg("Check your email for a magic link.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithPassword = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) throw error;
      
      // Ensure profile exists after sign in
      if (data?.user) {
        await ensureProfileExists(data.user);
      }
      
      setMsg("Signed in successfully!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithPassword = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo }
      });
      
      if (error) {
        // Handle specific database error
        if (error.message.includes("Database error")) {
          setError("There was an issue creating your account. Trying alternative method...");
          
          // Try to create user without trigger
          const { data: retryData, error: retryError } = await supabase.auth.signUp({
            email,
            password,
            options: { 
              emailRedirectTo: redirectTo,
              data: { skip_profile_creation: true }
            }
          });
          
          if (retryError) throw retryError;
          
          // Manually create profile if user was created
          if (retryData?.user) {
            await ensureProfileExists(retryData.user);
          }
          
          setMsg("Account created! Check your email to confirm (if email confirmations are enabled).");
        } else {
          throw error;
        }
      } else {
        // Success - ensure profile exists
        if (data?.user) {
          await ensureProfileExists(data.user);
        }
        
        setMsg("Account created! Check your email to confirm (if email confirmations are enabled).");
      }
    } catch (err) {
      setError(err.message);
      
      // Provide troubleshooting steps for database errors
      if (err.message.includes("Database error") || err.message.includes("trigger")) {
        setMode("fix");
      }
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async () => {
    setMsg("");
    setError("");
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo
      });
      
      if (error) throw error;
      setMsg("Password reset link sent (check your email).");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to ensure profile exists
  const ensureProfileExists = async (user) => {
    try {
      // Check if profile exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      
      // Create profile if it doesn't exist
      if (!profile) {
        const { error } = await supabase
          .from("profiles")
          .insert([{
            id: user.id,
            email: user.email,
            role: "user"
          }]);
        
        if (error && !error.message.includes("duplicate")) {
          console.error("Error creating profile:", error);
        }
      }
    } catch (err) {
      console.error("Error ensuring profile:", err);
    }
  };

  // Try to fix profile for existing user
  const fixExistingUserProfile = async () => {
    setMsg("");
    setError("");
    setLoading(true);
    
    try {
      // First try to sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) throw signInError;
      
      if (data?.user) {
        // Try to create profile
        await ensureProfileExists(data.user);
        setMsg("Profile fixed! Refreshing...");
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      setError(`Could not fix profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-sm px-4 py-10">
      <h2 className="mb-4 text-2xl font-bold">Admin Access</h2>

      {/* Mode selector */}
      <div className="mb-4 inline-flex rounded-2xl border border-gray-300 bg-white p-1 text-sm font-semibold">
        <button
          onClick={() => setMode("magic")}
          className={`px-3 py-1.5 rounded-xl transition-colors ${
            mode === "magic" ? "bg-gray-900 text-white" : "text-gray-800"
          }`}
        >
          Magic Link
        </button>
        <button
          onClick={() => setMode("signin")}
          className={`px-3 py-1.5 rounded-xl transition-colors ${
            mode === "signin" ? "bg-gray-900 text-white" : "text-gray-800"
          }`}
        >
          Password
        </button>
        <button
          onClick={() => setMode("signup")}
          className={`px-3 py-1.5 rounded-xl transition-colors ${
            mode === "signup" ? "bg-gray-900 text-white" : "text-gray-800"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Magic Link Mode */}
      {mode === "magic" && (
        <form onSubmit={sendMagicLink} className="space-y-3">
          <TextInput
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send magic link"}
          </Button>
        </form>
      )}

      {/* Sign In Mode */}
      {mode === "signin" && (
        <form onSubmit={signInWithPassword} className="space-y-3">
          <TextInput
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextInput
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex items-center justify-between gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <OutlineButton
              type="button"
              onClick={sendPasswordReset}
              disabled={!email || loading}
            >
              Forgot?
            </OutlineButton>
          </div>
        </form>
      )}

      {/* Sign Up Mode */}
      {mode === "signup" && (
        <form onSubmit={signUpWithPassword} className="space-y-3">
          <TextInput
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextInput
            type="password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </Button>
          <p className="mt-2 text-xs text-gray-500">
            Tip: Use at least 6 characters for your password.
          </p>
        </form>
      )}

      {/* Fix Mode - shown when database error occurs */}
      {mode === "fix" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
            <p className="font-semibold text-amber-900 mb-2">
              Database Setup Required
            </p>
            <p className="text-amber-800 mb-3">
              The user profile trigger may not be configured. Run this SQL in your Supabase SQL editor:
            </p>
            <pre className="bg-white p-2 rounded border border-amber-300 text-xs overflow-x-auto">
{`-- Quick fix for user creation
ALTER TABLE profiles 
  ALTER COLUMN email DROP NOT NULL;

CREATE OR REPLACE FUNCTION 
public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles 
    (id, email, role)
  VALUES 
    (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN others THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`}
            </pre>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              If you already have an account, try fixing your profile:
            </p>
            <TextInput
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextInput
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={fixExistingUserProfile} disabled={loading || !email || !password}>
              {loading ? "Fixing..." : "Fix Profile"}
            </Button>
          </div>
          
          <OutlineButton onClick={() => setMode("signin")}>
            Back to Sign In
          </OutlineButton>
        </div>
      )}

      {/* Messages */}
      {msg && (
        <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">
          {msg}
        </p>
      )}
      
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
          {error.includes("Database error") && (
            <button
              onClick={() => setMode("fix")}
              className="mt-2 text-xs underline"
            >
              View troubleshooting steps →
            </button>
          )}
        </div>
      )}
    </section>
  );
}
