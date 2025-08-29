// src/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button, OutlineButton } from "../components/UI";

export default function AdminDashboard() {
  const [tab, setTab] = useState("submissions");
  const [subs, setSubs] = useState([]);
  const [prov, setProv] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const BOOTSTRAP = import.meta?.env?.VITE_BOOTSTRAP_ADMIN_EMAIL?.toLowerCase?.();
useEffect(() => {
  if (BOOTSTRAP && session?.user?.email?.toLowerCase() === BOOTSTRAP) {
    setIsAdmin(true);
  }
}, [BOOTSTRAP, session?.user?.email]);


  const load = async () => {
    setLoading(true);
    const [sRes, pRes, cRes] = await Promise.all([
      supabase.from("listing_submissions").select("*").order("created_at", { ascending:false }),
      supabase.from("providers").select("*").order("created_at", { ascending:false }),
      supabase.from("categories").select("*").order("label", { ascending:true }),
    ]);
    setSubs(sRes.data || []);
    setProv(pRes.data || []);
    setCats(cRes.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setIsAdmin(false); return; }
        const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
        setIsAdmin(prof?.role === "admin");
      } catch { setIsAdmin(false); }
    })();
  }, []);

  // Submissions
  const approve = async (id) => { await supabase.rpc("approve_submission", { sub_id:id, publish:true }); await load(); };
  const reject  = async (id) => { await supabase.from("listing_submissions").update({ status:"rejected" }).eq("id", id); await load(); };

  // Providers
  const toggleShow = async (id, on) => { await supabase.from("providers").update({ is_active:on }).eq("id", id); await load(); };
  const delProv    = async (id) => { if (confirm("Delete provider?")) { await supabase.from("providers").delete().eq("id", id); await load(); } };
  const addProv    = async () => {
    const name = prompt("Company name?"); if (!name) return;
    const website = prompt("Website (https://)") || null;
    const category_id = prompt("Category id (e.g. software, marketing)", cats[0]?.id || "software") || "software";
    await supabase.from("providers").insert([{ name, category_id, website, is_active:false }]);
    await load();
  };
  const editProv   = async (row) => {
    const name = prompt("Name", row.name) ?? row.name;
    const website = prompt("Website", row.website ?? "") ?? row.website;
    const category_id = prompt("Category id", row.category_id ?? "") ?? row.category_id;
    const logo = prompt("Logo URL (optional)", row.logo ?? "") ?? row.logo;
    const tier = prompt("Tier (free/featured/sponsor)", row.tier ?? "free") ?? row.tier;
    const is_featured = tier !== "free" ? true : confirm("Mark as featured? OK=yes, Cancel=no");
    await supabase.from("providers").update({ name, website, category_id, logo, tier, is_featured }).eq("id", row.id);
    await load();
  };

  // Categories
  const addCat = async () => {
    const id = prompt("Category id (letters only, e.g. software)"); if (!id) return;
    const label = prompt("Category label", id) || id;
    await supabase.from("categories").insert([{ id, label }]);
    await load();
  };
  const editCat = async (row) => {
    const idNew = prompt("Category id", row.id) ?? row.id;
    const label = prompt("Label", row.label) ?? row.label;
    if (idNew !== row.id) {
      await supabase.from("categories").insert([{ id: idNew, label }]);
      await supabase.from("providers").update({ category_id: idNew }).eq("category_id", row.id);
      await supabase.from("categories").delete().eq("id", row.id);
    } else {
      await supabase.from("categories").update({ label }).eq("id", row.id);
    }
    await load();
  };
  const deleteCat = async (row) => {
    const inUse = prov.filter(p => p.category_id === row.id).length;
    if (inUse > 0) { alert(`Cannot delete: ${inUse} provider(s) still use this category. Reassign them first.`); return; }
    if (confirm(`Delete category "${row.label}"?`)) { await supabase.from("categories").delete().eq("id", row.id); await load(); }
  };

  if (loading) return <section className="mx-auto max-w-5xl px-4 py-10">Loading…</section>;

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      {!isAdmin && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          You are signed in but not marked as <strong>admin</strong>. Read-only features will work; write actions may be blocked by RLS.
        </div>
      )}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Admin</h2>
        <div className="flex flex-wrap gap-2">
          <OutlineButton onClick={() => setTab("submissions")}>Submissions</OutlineButton>
          <OutlineButton onClick={() => setTab("suppliers")}>Suppliers</OutlineButton>
          <OutlineButton onClick={() => setTab("categories")}>Categories</OutlineButton>
          <Button onClick={async ()=>{ await supabase.auth.signOut(); location.reload(); }}>Sign out</Button>
        </div>
      </div>

      {tab === "submissions" && (
        <div className="space-y-3">
          {subs.length === 0 && <div className="rounded-xl border border-dashed border-gray-300 p-6 text-gray-600">No submissions.</div>}
          {subs.map(s => (
            <div key={s.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{s.company_name}</div>
                <span className="text-xs">{s.status ?? "new"}</span>
              </div>
              <div className="mt-1 text-sm text-gray-600">{s.website}</div>
              <div className="mt-2 text-sm">{s.description}</div>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => approve(s.id)}>Approve & Publish</Button>
                <OutlineButton onClick={() => reject(s.id)}>Reject</OutlineButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "suppliers" && (
        <div className="space-y-4">
          <div className="flex justify-end"><Button onClick={addProv}>Add Provider</Button></div>
          <div className="grid grid-cols-1 gap-3">
            {prov.map(p => (
              <div key={p.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.logo || (p.website ? `https://www.google.com/s2/favicons?domain=${new URL(p.website).hostname}&sz=64` : "")}
                      className="h-8 w-8 rounded-full border border-gray-200 bg-white" alt=""
                    />
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-gray-500">
                        {p.category_id} · {p.website || "—"} {p.is_featured ? "· Featured" : ""} {p.tier && p.tier !== "free" ? `· ${p.tier}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <OutlineButton onClick={() => editProv(p)}>Edit</OutlineButton>
                    <OutlineButton onClick={() => toggleShow(p.id, !p.is_active)}>{p.is_active ? "Hide" : "Show"}</OutlineButton>
                    <Button onClick={() => delProv(p.id)}>Delete</Button>
                  </div>
                </div>
              </div>
            ))}
            {prov.length === 0 && <div className="rounded-xl border border-dashed border-gray-300 p-6 text-gray-600">No providers yet.</div>}
          </div>
        </div>
      )}

      {tab === "categories" && (
        <div className="space-y-4">
          <div className="flex justify-end"><Button onClick={addCat}>Add Category</Button></div>
          <div className="grid grid-cols-1 gap-3">
            {cats.map(c => (
              <div key={c.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{c.label}</div>
                    <div className="text-xs text-gray-500">id: {c.id}</div>
                  </div>
                  <div className="flex gap-2">
                    <OutlineButton onClick={() => editCat(c)}>Edit</OutlineButton>
                    <Button onClick={() => deleteCat(c)}>Delete</Button>
                  </div>
                </div>
              </div>
            ))}
            {cats.length === 0 && <div className="rounded-xl border border-dashed border-gray-300 p-6 text-gray-600">No categories.</div>}
          </div>
        </div>
      )}
    </section>
  );
}
