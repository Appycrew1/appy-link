// src/admin/AdminDashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button, OutlineButton } from "../components/UI";

export default function AdminDashboard() {
  const [tab, setTab] = useState("submissions");
  const [subs, setSubs] = useState([]);
  const [prov, setProv] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  
  // Fixed: Properly access the environment variable
  const BOOTSTRAP_EMAIL = import.meta.env?.VITE_BOOTSTRAP_ADMIN_EMAIL?.toLowerCase();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    
    try {
      const [sRes, pRes, cRes] = await Promise.all([
        supabase.from("listing_submissions").select("*").order("created_at", { ascending: false }),
        supabase.from("providers").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("label", { ascending: true }),
      ]);
      
      if (sRes.error) throw sRes.error;
      if (pRes.error) throw pRes.error;
      if (cRes.error) throw cRes.error;
      
      setSubs(sRes.data || []);
      setProv(pRes.data || []);
      setCats(cRes.data || []);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize user and admin status
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAdmin(false);
          return;
        }
        
        setUser(user);
        
        // Check if user is bootstrap admin
        if (BOOTSTRAP_EMAIL && user.email?.toLowerCase() === BOOTSTRAP_EMAIL) {
          setIsAdmin(true);
          return;
        }
        
        // Check database for admin role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
          
        setIsAdmin(profile?.role === "admin");
      } catch (err) {
        console.error("Error checking admin status:", err);
        setIsAdmin(false);
      }
    })();
  }, [BOOTSTRAP_EMAIL]);
  
  // Load data when component mounts
  useEffect(() => {
    load();
  }, [load]);

  // Submissions handlers with error handling
  const approve = async (id) => {
    try {
      const { error } = await supabase.rpc("approve_submission", { 
        sub_id: id, 
        publish: true 
      });
      if (error) throw error;
      await load();
    } catch (err) {
      alert(`Error approving submission: ${err.message}`);
    }
  };
  
  const reject = async (id) => {
    try {
      const { error } = await supabase
        .from("listing_submissions")
        .update({ status: "rejected" })
        .eq("id", id);
      if (error) throw error;
      await load();
    } catch (err) {
      alert(`Error rejecting submission: ${err.message}`);
    }
  };

  // Provider handlers with validation
  const toggleShow = async (id, isActive) => {
    try {
      const { error } = await supabase
        .from("providers")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
      await load();
    } catch (err) {
      alert(`Error updating provider: ${err.message}`);
    }
  };
  
  const delProv = async (id) => {
    if (!confirm("Delete this provider? This action cannot be undone.")) return;
    
    try {
      const { error } = await supabase
        .from("providers")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await load();
    } catch (err) {
      alert(`Error deleting provider: ${err.message}`);
    }
  };
  
  const addProv = async () => {
    const name = prompt("Company name:")?.trim();
    if (!name) return;
    
    const website = prompt("Website (https://)")?.trim() || null;
    const category_id = prompt(
      `Category id (${cats.map(c => c.id).join(", ")}):`, 
      cats[0]?.id || "software"
    )?.trim() || "software";
    
    // Validate category exists
    if (!cats.find(c => c.id === category_id)) {
      alert(`Invalid category: ${category_id}`);
      return;
    }
    
    try {
      const { error } = await supabase
        .from("providers")
        .insert([{ 
          name, 
          category_id, 
          website, 
          is_active: false 
        }]);
      if (error) throw error;
      await load();
    } catch (err) {
      alert(`Error adding provider: ${err.message}`);
    }
  };
  
  const editProv = async (row) => {
    const name = prompt("Name:", row.name)?.trim() || row.name;
    const website = prompt("Website:", row.website || "")?.trim() || row.website;
    const category_id = prompt("Category id:", row.category_id || "")?.trim() || row.category_id;
    const logo = prompt("Logo URL (optional):", row.logo || "")?.trim() || row.logo;
    const tier = prompt("Tier (free/featured/sponsor):", row.tier || "free")?.trim() || row.tier;
    const is_featured = tier !== "free" ? true : confirm("Mark as featured? OK=yes, Cancel=no");
    
    try {
      const { error } = await supabase
        .from("providers")
        .update({ 
          name, 
          website, 
          category_id, 
          logo, 
          tier, 
          is_featured 
        })
        .eq("id", row.id);
      if (error) throw error;
      await load();
    } catch (err) {
      alert(`Error updating provider: ${err.message}`);
    }
  };

  // Category handlers with validation
  const addCat = async () => {
    const id = prompt("Category id (letters only, e.g. software):")?.trim();
    if (!id || !/^[a-z_]+$/.test(id)) {
      alert("Invalid category id. Use only lowercase letters and underscores.");
      return;
    }
    
    const label = prompt("Category label:", id)?.trim() || id;
    
    try {
      const { error } = await supabase
        .from("categories")
        .insert([{ id, label }]);
      if (error) throw error;
      await load();
    } catch (err) {
      alert(`Error adding category: ${err.message}`);
    }
  };
  
  const editCat = async (row) => {
    const idNew = prompt("Category id:", row.id)?.trim() || row.id;
    const label = prompt("Label:", row.label)?.trim() || row.label;
    
    try {
      if (idNew !== row.id) {
        // Create new category
        const { error: insertErr } = await supabase
          .from("categories")
          .insert([{ id: idNew, label }]);
        if (insertErr) throw insertErr;
        
        // Update providers
        const { error: updateErr } = await supabase
          .from("providers")
          .update({ category_id: idNew })
          .eq("category_id", row.id);
        if (updateErr) throw updateErr;
        
        // Delete old category
        const { error: deleteErr } = await supabase
          .from("categories")
          .delete()
          .eq("id", row.id);
        if (deleteErr) throw deleteErr;
      } else {
        const { error } = await supabase
          .from("categories")
          .update({ label })
          .eq("id", row.id);
        if (error) throw error;
      }
      await load();
    } catch (err) {
      alert(`Error updating category: ${err.message}`);
    }
  };
  
  const deleteCat = async (row) => {
    const inUse = prov.filter(p => p.category_id === row.id).length;
    if (inUse > 0) {
      alert(`Cannot delete: ${inUse} provider(s) still use this category. Reassign them first.`);
      return;
    }
    
    if (!confirm(`Delete category "${row.label}"? This action cannot be undone.`)) return;
    
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", row.id);
      if (error) throw error;
      await load();
    } catch (err) {
      alert(`Error deleting category: ${err.message}`);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.reload();
    } catch (err) {
      alert(`Error signing out: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-center">
          <div className="text-gray-600">Loading admin dashboard...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Error loading data: {error}
        </div>
      )}
      
      {!isAdmin && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Limited Access:</strong> You are signed in as {user?.email} but not marked as admin. 
          Read-only features will work; write actions may be blocked by Row Level Security.
        </div>
      )}
      
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          {user && (
            <p className="text-sm text-gray-600 mt-1">
              Signed in as: {user.email} {isAdmin && <span className="text-green-600">(Admin)</span>}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <OutlineButton onClick={() => setTab("submissions")}>
            Submissions {subs.length > 0 && `(${subs.length})`}
          </OutlineButton>
          <OutlineButton onClick={() => setTab("suppliers")}>
            Suppliers {prov.length > 0 && `(${prov.length})`}
          </OutlineButton>
          <OutlineButton onClick={() => setTab("categories")}>
            Categories {cats.length > 0 && `(${cats.length})`}
          </OutlineButton>
          <OutlineButton onClick={load}>Refresh</OutlineButton>
          <Button onClick={signOut}>Sign out</Button>
        </div>
      </div>

      {/* Submissions Tab */}
      {tab === "submissions" && (
        <div className="space-y-3">
          {subs.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-gray-600">
              No new submissions.
            </div>
          )}
          {subs.map(s => (
            <div key={s.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold">{s.company_name}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(s.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold 
                  ${s.status === 'approved' ? 'bg-green-100 text-green-800' : 
                    s.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                    'bg-gray-100 text-gray-800'}`}>
                  {s.status || "new"}
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-600">{s.website}</div>
              <div className="mt-2 text-sm">{s.description}</div>
              {s.discount && (
                <div className="mt-2 text-sm text-green-700">
                  <strong>Discount:</strong> {s.discount}
                </div>
              )}
              {(!s.status || s.status === 'new') && (
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => approve(s.id)} disabled={!isAdmin}>
                    Approve & Publish
                  </Button>
                  <OutlineButton onClick={() => reject(s.id)} disabled={!isAdmin}>
                    Reject
                  </OutlineButton>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Suppliers Tab */}
      {tab === "suppliers" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Active: {prov.filter(p => p.is_active).length} / {prov.length}
            </div>
            <Button onClick={addProv} disabled={!isAdmin}>Add Provider</Button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {prov.map(p => (
              <div key={p.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.logo || (p.website ? 
                        `https://www.google.com/s2/favicons?domain=${new URL(p.website).hostname}&sz=64` : 
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect width='32' height='32' fill='%23e5e7eb'/%3E%3C/svg%3E")}
                      className="h-8 w-8 rounded-full border border-gray-200 bg-white" 
                      alt=""
                      onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect width='32' height='32' fill='%23e5e7eb'/%3E%3C/svg%3E";
                      }}
                    />
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-gray-500">
                        {p.category_id} · {p.website || "No website"} 
                        {p.is_featured && " · Featured"} 
                        {p.tier && p.tier !== "free" && ` · ${p.tier}`}
                        {!p.is_active && " · Hidden"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <OutlineButton onClick={() => editProv(p)} disabled={!isAdmin}>
                      Edit
                    </OutlineButton>
                    <OutlineButton onClick={() => toggleShow(p.id, !p.is_active)} disabled={!isAdmin}>
                      {p.is_active ? "Hide" : "Show"}
                    </OutlineButton>
                    <Button onClick={() => delProv(p.id)} disabled={!isAdmin}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {prov.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-gray-600">
                No providers yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {tab === "categories" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={addCat} disabled={!isAdmin}>Add Category</Button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {cats.map(c => {
              const count = prov.filter(p => p.category_id === c.id).length;
              return (
                <div key={c.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{c.label}</div>
                      <div className="text-xs text-gray-500">
                        id: {c.id} · {count} provider{count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <OutlineButton onClick={() => editCat(c)} disabled={!isAdmin}>
                        Edit
                      </OutlineButton>
                      <Button onClick={() => deleteCat(c)} disabled={!isAdmin || count > 0}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {cats.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-gray-600">
                No categories yet.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
