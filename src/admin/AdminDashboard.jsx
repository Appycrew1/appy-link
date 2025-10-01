// src/admin/AdminDashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button, OutlineButton } from "../components/UI";
import { sanitizeHtml, sanitizeInput } from "../utils/sanitization";
import { validateProvider, validateCategory } from "../utils/validation";

export default function AdminDashboard({ session }) {
  const [tab, setTab] = useState("submissions");
  const [submissions, setSubmissions] = useState([]);
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Load data function
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    
    try {
      // Check admin status first
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
        
      const isUserAdmin = profile?.role === "admin" || profile?.role === "moderator";
      setIsAdmin(isUserAdmin);
      
      if (!isUserAdmin) {
        setError("You do not have admin privileges");
        setLoading(false);
        return;
      }
      
      // Load all data in parallel
      const [subsRes, provsRes, catsRes] = await Promise.all([
        supabase
          .from("listing_submissions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("providers")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("categories")
          .select("*")
          .order("label", { ascending: true })
      ]);
      
      if (subsRes.error) throw subsRes.error;
      if (provsRes.error) throw provsRes.error;
      if (catsRes.error) throw catsRes.error;
      
      setSubmissions(subsRes.data || []);
      setProviders(provsRes.data || []);
      setCategories(catsRes.data || []);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session.user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Approve submission
  const approveSubmission = async (id) => {
    if (!window.confirm("Approve this submission and create a provider?")) return;
    
    try {
      const { error } = await supabase.rpc("approve_submission", {
        sub_id: id,
        publish: true
      });
      
      if (error) throw error;
      
      setSuccessMsg("Submission approved successfully");
      await loadData();
    } catch (err) {
      setError(`Error approving submission: ${err.message}`);
    }
  };

  // Reject submission
  const rejectSubmission = async (id) => {
    const reason = prompt("Rejection reason (optional):");
    
    try {
      const { error } = await supabase
        .from("listing_submissions")
        .update({ 
          status: "rejected",
          rejection_reason: reason || null,
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", id);
        
      if (error) throw error;
      
      setSuccessMsg("Submission rejected");
      await loadData();
    } catch (err) {
      setError(`Error rejecting submission: ${err.message}`);
    }
  };

  // Toggle provider visibility
  const toggleProvider = async (id, isActive) => {
    try {
      const { error } = await supabase
        .from("providers")
        .update({ is_active: isActive })
        .eq("id", id);
        
      if (error) throw error;
      
      setSuccessMsg(`Provider ${isActive ? "activated" : "deactivated"}`);
      await loadData();
    } catch (err) {
      setError(`Error updating provider: ${err.message}`);
    }
  };

  // Delete provider
  const deleteProvider = async (id) => {
    if (!window.confirm("Delete this provider permanently? This cannot be undone.")) return;
    
    try {
      const { error } = await supabase
        .from("providers")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      setSuccessMsg("Provider deleted");
      await loadData();
    } catch (err) {
      setError(`Error deleting provider: ${err.message}`);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.hash = "#home";
      window.location.reload();
    } catch (err) {
      setError(`Error signing out: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="text-center text-gray-600">Loading dashboard...</div>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-xl font-bold text-red-900">Access Denied</h2>
          <p className="mt-2 text-red-700">
            You do not have permission to access the admin dashboard.
          </p>
          <button
            onClick={signOut}
            className="mt-4 rounded-lg bg-red-900 px-4 py-2 text-white"
          >
            Sign Out
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Signed in as: {session.user.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OutlineButton onClick={() => setTab("submissions")}>
            Submissions ({submissions.filter(s => s.status === "new").length})
          </OutlineButton>
          <OutlineButton onClick={() => setTab("providers")}>
            Providers ({providers.length})
          </OutlineButton>
          <OutlineButton onClick={() => setTab("categories")}>
            Categories ({categories.length})
          </OutlineButton>
          <OutlineButton onClick={loadData}>Refresh</OutlineButton>
          <Button onClick={signOut}>Sign Out</Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 text-red-900 underline"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {successMsg && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {successMsg}
          <button
            onClick={() => setSuccessMsg("")}
            className="ml-2 text-green-900 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Submissions Tab */}
      {tab === "submissions" && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            Pending Submissions ({submissions.filter(s => s.status === "new").length})
          </h3>
          
          {submissions.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-gray-600">
              No submissions yet.
            </div>
          )}
          
          {submissions.map(sub => (
            <div
              key={sub.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold">
                    {sanitizeHtml(sub.company_name)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(sub.created_at).toLocaleDateString()} •
                    Category: {sub.category_id}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  sub.status === "approved" ? "bg-green-100 text-green-800" :
                  sub.status === "rejected" ? "bg-red-100 text-red-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {sub.status || "new"}
                </span>
              </div>
              
              {sub.website && (
                <div className="mt-1 text-sm text-blue-600">
                  <a
                    href={sub.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="hover:underline"
                  >
                    {sub.website}
                  </a>
                </div>
              )}
              
              <div className="mt-2 text-sm text-gray-700">
                {sanitizeHtml(sub.description)}
              </div>
              
              {sub.discount && (
                <div className="mt-2 text-sm text-green-700">
                  <strong>Discount:</strong> {sanitizeHtml(sub.discount)}
                </div>
              )}
              
              {sub.rejection_reason && (
                <div className="mt-2 text-sm text-red-700">
                  <strong>Rejection reason:</strong> {sanitizeHtml(sub.rejection_reason)}
                </div>
              )}
              
              {sub.status === "new" && (
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => approveSubmission(sub.id)}>
                    Approve & Publish
                  </Button>
                  <OutlineButton onClick={() => rejectSubmission(sub.id)}>
                    Reject
                  </OutlineButton>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Providers Tab */}
      {tab === "providers" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Providers ({providers.filter(p => p.is_active).length} active)
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {providers.map(prov => (
              <div
                key={prov.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-semibold">
                        {sanitizeHtml(prov.name)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {prov.category_id} • 
                        {prov.is_featured && " Featured •"}
                        {!prov.is_active && " Inactive •"}
                        {prov.tier && ` ${prov.tier} tier`}
                      </div>
                      {prov.website && (
                        <a
                          href={prov.website}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {prov.website}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <OutlineButton
                      onClick={() => toggleProvider(prov.id, !prov.is_active)}
                    >
                      {prov.is_active ? "Deactivate" : "Activate"}
                    </OutlineButton>
                    <Button onClick={() => deleteProvider(prov.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {tab === "categories" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Categories</h3>
          
          <div className="grid grid-cols-1 gap-3">
            {categories.map(cat => {
              const providerCount = providers.filter(p => p.category_id === cat.id).length;
              
              return (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{cat.label}</div>
                      <div className="text-xs text-gray-500">
                        ID: {cat.id} • {providerCount} provider{providerCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
