import React, { useEffect, useMemo, useReducer, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/**
 * Appy Link – Linking movers with suppliers (UK)
 * -------------------------------------------------
 * Single‑file React + Tailwind app, production‑ready, wired to Supabase.
 * - Public site: directory with filters, favorites, compare, discounts, learning
 * - Forms: Submit Listing, Contact (with anti‑spam)
 * - Admin: login (magic link), submissions review (approve/reject), suppliers CRUD (show/hide/add/edit/delete), categories CRUD
 * - Monetisation: featured/tier fields, home "Featured" section, admin controls to set/expire featuring
 * - Security: Supabase RLS so only admins can write; public can read providers/categories and submit forms
 * - Scalability: pagination support, favicon logo fallback, lazy images
 *
 * ENV (Vercel → Settings → Environment Variables)
 *  - VITE_SUPABASE_URL
 *  - VITE_SUPABASE_ANON_KEY
 */

/***********************************\
|*           BRAND CONFIG           *|
\***********************************/
const BRAND = {
  name: "Appy Link",
  tagline: "Linking movers with suppliers.",
  ctaPrimary: "Browse UK Suppliers",
  ctaSecondary: "Submit A Listing",
};

const NAV = [
  { label: "Home", hash: "#home" },
  { label: "Suppliers", hash: "#providers" },
  { label: "Discounts", hash: "#discounts" },
  { label: "Learning Center", hash: "#learning" },
  { label: "Submit Listing", hash: "#submit" },
  { label: "Contact", hash: "#contact" },
];

/***********************************\
|*            UTILITIES            *|
\***********************************/
function classNames(...xs) { return xs.filter(Boolean).join(" "); }

function useHashRoute(defaultHash = "#home") {
  const [hash, setHash] = useState(() => window.location.hash || defaultHash);
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || defaultHash);
    window.addEventListener("hashchange", onHash);
    if (!window.location.hash) window.location.hash = defaultHash;
    return () => window.removeEventListener("hashchange", onHash);
  }, [defaultHash]);
  const push = (next) => (window.location.hash = next);
  return [hash, push];
}

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initialValue; } catch { return initialValue; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }, [key, value]);
  return [value, setValue];
}

// Build a logo URL for a provider: prefer explicit logo (or logo_url from DB), else favicon
function getLogo(p) {
  if (p.logo) return p.logo;
  if (p.logo_url) return p.logo_url;
  try { const u = new URL(p.website || ""); return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=128`; } catch { return `https://www.google.com/s2/favicons?domain=example.com&sz=128`; }
}

/***********************************\
|*         SUPABASE CLIENT         *|
\***********************************/
const SB_URL = import.meta?.env?.VITE_SUPABASE_URL;
const SB_KEY = import.meta?.env?.VITE_SUPABASE_ANON_KEY;
const supabase = (SB_URL && SB_KEY) ? createClient(SB_URL, SB_KEY) : null;

/***********************************\
|*          SAMPLE CONTENT          *|
\***********************************/
const categoriesSeed = [
  { id: "marketing", label: "Marketing / Advertising" },
  { id: "software", label: "Moving Software & CRM" },
  { id: "sales", label: "Moving Sales Solutions" },
  { id: "insurance", label: "Moving Insurance" },
  { id: "apps", label: "Apps & Online Tools" },
  { id: "leads", label: "Moving Leads" },
  { id: "equipment", label: "Moving Equipment" },
];

const providersSeed = [
  { id: "moveman", name: "MoveMan", category: "software", tags: ["UK","CRM","Operations"], website: "https://www.movemanpro.com/", logo: "https://www.google.com/s2/favicons?domain=movemanpro.com&sz=128", summary: "Removals management software widely used in the UK.", details: "Quoting, scheduling, dispatch & storage; long‑standing UK vendor.", is_featured: true },
  { id: "moveware", name: "Moveware", category: "software", tags: ["ERP","CRM","Accounting"], website: "https://www.moveconnect.com/", logo: "https://www.google.com/s2/favicons?domain=moveconnect.com&sz=128", summary: "Complete ERP/CRM for moving & storage companies.", details: "Manage sales, ops and accounting in one platform." },
  { id: "moneypenny", name: "Moneypenny (UK)", category: "sales", tags: ["Call Answering","Live Chat","UK"], website: "https://www.moneypenny.com/uk/", logo: "https://www.google.com/s2/favicons?domain=moneypenny.com&sz=128", summary: "Professional call answering and live chat.", details: "Overflow and 24/7 options to capture enquiries and bookings." },
  { id: "basilfry", name: "Basil Fry & Company", category: "insurance", tags: ["Broker","Removals","Storage"], website: "https://basilfry.co.uk/removals-and-storage/", logo: "https://www.google.com/s2/favicons?domain=basilfry.co.uk&sz=128", summary: "Specialist insurance for removals & storage.", details: "Risk management and claims handling for UK movers." },
  { id: "teacrate", name: "phs Teacrate – Crate Hire", category: "equipment", tags: ["Crate Hire","Nationwide","UK"], website: "https://teacrate.co.uk/", logo: "https://www.google.com/s2/favicons?domain=teacrate.co.uk&sz=128", summary: "UK‑wide lidded crate rental & purchase.", details: "Fast delivery nationwide and multiple crate options." },
];

/***********************************\
|*        STATE & REDUCER          *|
\***********************************/
const initialState = { q: "", category: "all", tags: new Set(), onlyDiscounts: false, sort: "relevance" };
function reducer(state, action) {
  switch (action.type) {
    case "SET_QUERY": return { ...state, q: action.q };
    case "SET_CATEGORY": return { ...state, category: action.category };
    case "TOGGLE_TAG": { const tags = new Set(state.tags); tags.has(action.tag) ? tags.delete(action.tag) : tags.add(action.tag); return { ...state, tags }; }
    case "TOGGLE_ONLY_DISCOUNTS": return { ...state, onlyDiscounts: !state.onlyDiscounts };
    case "SET_SORT": return { ...state, sort: action.sort };
    case "RESET_FILTERS": return { ...initialState };
    default: return state;
  }
}

/***********************************\
|*          UI PRIMITIVES          *|
\***********************************/
const Badge = ({ children, color = "bg-gray-100 text-gray-700" }) => (
  <span className={classNames("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", color)}>{children}</span>
);
const Button = ({ as:As="button", className="", children, ...props }) => (
  <As className={classNames("inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm transition disabled:opacity-50","bg-gray-900 text-white hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black",className)} {...props}>{children}</As>
);
const OutlineButton = ({ className="", children, ...props }) => (
  <button className={classNames("inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50",className)} {...props}>{children}</button>
);
const TextInput = React.forwardRef(function TextInput({ className="", ...props }, ref){
  return <input ref={ref} className={classNames("block w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm placeholder-gray-400","focus:outline-none focus:ring-2 focus:ring-black",className)} {...props}/>;
});
const TextArea = ({ className="", ...props }) => (
  <textarea className={classNames("block w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm placeholder-gray-400","focus:outline-none focus:ring-2 focus:ring-black",className)} rows={6} {...props}/>
);

/***********************************\
|*       DATA LOADER (REMOTE)      *|
\***********************************/
function useProvidersAndCategories({ page = 1, pageSize = 48 } = {}) {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(categoriesSeed);
  const [providers, setProviders] = useState(providersSeed);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!supabase) { setLoading(false); return; }
      try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        const [{ data: cats, error: catErr }, { data: provs, error: provErr }] = await Promise.all([
          supabase.from("categories").select("id,label").order("label"),
          supabase.from("providers").select("id,name,category_id,tags,website,summary,details,discount_label,discount_details,logo,is_active,is_featured,feature_until,tier").eq("is_active", true).order("is_featured", { ascending:false }).order("name").range(from, to),
        ]);
        if (catErr) throw catErr; if (provErr) throw provErr;
        if (mounted) {
          const catList = cats?.length ? cats : categoriesSeed; setCategories(catList);
          const catMap = new Map(catList.map(c=>[c.id,c.label]));
          const source = provs?.length ? provs : providersSeed;
          const mapped = source.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category_id || p.category,
            categoryLabel: catMap.get(p.category_id || p.category) || p.categoryLabel,
            tags: p.tags || [],
            website: p.website,
            summary: p.summary,
            details: p.details,
            discount: p.discount_label ? { label: p.discount_label, details: p.discount_details } : p.discount || null,
            logo: p.logo || p.logo_url,
            is_featured: !!p.is_featured || (p.feature_until ? new Date(p.feature_until) > new Date() : false),
            tier: p.tier || "free",
          }));
          setProviders(mapped);
        }
      } catch (e) { console.error(e); setError(e.message); }
      finally { mounted && setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [page, pageSize]);

  return { loading, categories, providers, error };
}

/***********************************\
|*       PROVIDER COMPONENTS       *|
\***********************************/
const ProviderCard = ({ p, onOpen, onToggleFav, isFav, onCompareToggle, comparing }) => (
  <div className="group relative flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <img src={getLogo(p)} loading="lazy" alt="" className="h-10 w-10 rounded-full object-cover border border-gray-200 bg-white"/>
        <h3 className="truncate text-base font-semibold text-gray-900">{p.name}</h3>
      </div>
      <div className="flex items-center gap-2">
        {p.is_featured && <Badge color="bg-yellow-100 text-yellow-800">Featured</Badge>}
        {p.discount && (<Badge color="bg-green-100 text-green-800">{p.discount.label}</Badge>)}
      </div>
    </div>
    <div className="mb-3 flex flex-wrap gap-1">
      <Badge>{p.categoryLabel || p.category}</Badge>
      {p.tags?.slice(0,3).map(t => <Badge key={t}>{t}</Badge>)}
    </div>
    <p className="mb-4 line-clamp-3 text-sm text-gray-600">{p.summary}</p>

    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
      <OutlineButton onClick={() => onOpen(p)} className="w-full">Details</OutlineButton>
    </div>

    <div className="absolute right-3 top-3 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
      <button title={isFav?"Remove from favorites":"Save to favorites"} onClick={onToggleFav} className={classNames("rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold shadow-sm", isFav?"text-amber-700":"text-gray-700 hover:bg-gray-50")}>{isFav?"★ Saved":"☆ Save"}</button>
      <button title="Add to compare" onClick={onCompareToggle} className={classNames("rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50", comparing?"ring-2 ring-black":"")}>⇄ Compare</button>
    </div>
  </div>
);

const ProviderModal = ({ provider, onClose }) => {
  if (!provider) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal>
      <div className="max-h:[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={getLogo(provider)} alt="" className="h-10 w-10 rounded-full object-cover border border-gray-200 bg-white"/>
            <h3 className="text-xl font-semibold text-gray-900">{provider.name}</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">✕</button>
        </div>
        <div className="mb-3 flex flex-wrap gap-1">
          <Badge>{provider.categoryLabel}</Badge>
          {provider.tags?.map(t => <Badge key={t}>{t}</Badge>)}
          {provider.is_featured && <Badge color="bg-yellow-100 text-yellow-800">Featured</Badge>}
          {provider.discount && (<Badge color="bg-green-100 text-green-800">{provider.discount.label}</Badge>)}
        </div>
        <p className="mb-4 text-gray-700">{provider.details || provider.summary}</p>
        {provider.website && (
          <a href={provider.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black">Visit Website ↗</a>
        )}
      </div>
    </div>
  );
};

/***********************************\
|*              PAGES              *|
\***********************************/
function Home() {
  const { providers } = useProvidersAndCategories({ pageSize: 100 });
  const featured = providers.filter(p => p.is_featured).slice(0, 6);
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"><span>Supplier Directory</span><span aria-hidden>•</span><span>Built for UK movers</span></div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">{BRAND.tagline}</h1>
          <p className="mt-4 max-w-xl text-gray-600">Browse vetted UK providers, compare options, and claim partner discounts. Submit your listing in minutes.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => (window.location.hash = "#providers")}>{BRAND.ctaPrimary}</Button>
            <OutlineButton onClick={() => (window.location.hash = "#submit")}>{BRAND.ctaSecondary}</OutlineButton>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-[4/3] w-full rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 p-6 shadow-inner">
            <div className="grid h-full grid-rows-3 gap-3">
              <div className="rounded-2xl bg-white shadow-sm"></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white shadow-sm"></div>
                <div className="rounded-2xl bg-white shadow-sm"></div>
                <div className="rounded-2xl bg-white shadow-sm"></div>
              </div>
              <div className="rounded-2xl bg-white shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>

      {featured.length > 0 && (
        <div className="mt-12">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Featured suppliers</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map(p => (
              <div key={p.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-3">
                  <img src={getLogo(p)} alt="" className="h-8 w-8 rounded-full border border-amber-200 bg-white"/>
                  <div className="font-semibold">{p.name}</div>
                </div>
                <div className="text-sm text-gray-700">{p.summary}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Providers({ state, dispatch, favorites, setFavorites, compare, setCompare }) {
  const { loading, categories, providers, error } = useProvidersAndCategories();
  const [modal, setModal] = useState(null);

  const allTags = useMemo(() => { const s = new Set(); providers.forEach(p => p.tags?.forEach(t => s.add(t))); return Array.from(s).sort(); }, [providers]);

  useEffect(() => {
    const params = new URLSearchParams((window.location.hash.split("?")[1] || ""));
    const cat = params.get("cat");
    if (cat && categories.find(c=>c.id===cat)) dispatch({ type:"SET_CATEGORY", category:cat });
  }, [dispatch, categories]);

  const results = useMemo(() => {
    let r = providers.slice();
    if (state.category !== "all") r = r.filter(p => p.category === state.category);
    if (state.onlyDiscounts) r = r.filter(p => p.discount);
    if (state.tags.size) r = r.filter(p => p.tags && p.tags.some(t => state.tags.has(t)));
    if (state.q.trim()) { const q = state.q.toLowerCase(); r = r.filter(p => p.name.toLowerCase().includes(q) || p.summary?.toLowerCase().includes(q) || p.details?.toLowerCase().includes(q) || p.tags?.some(t => t.toLowerCase().includes(q))); }
    if (state.sort === "name-asc") r.sort((a,b)=>a.name.localeCompare(b.name));
    if (state.sort === "name-desc") r.sort((a,b)=>b.name.localeCompare(a.name));
    // keep featured near top for relevance sort
    if (state.sort === "relevance") r.sort((a,b)=> (b.is_featured?1:0) - (a.is_featured?1:0));
    return r;
  }, [state, providers]);

  const toggleFav = (id) => { setFavorites(prev => { const s = new Set(prev); s.has(id)?s.delete(id):s.add(id); return Array.from(s); }); };
  const toggleCompare = (id) => { setCompare(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else if (s.size<3) s.add(id); return Array.from(s); }); };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h2 className="text-2xl font-bold text-gray-900">Browse Suppliers</h2>
        <div className="flex items-center gap-2">
          <OutlineButton onClick={() => dispatch({ type:"RESET_FILTERS" })}>Reset</OutlineButton>
          <OutlineButton onClick={() => (window.location.hash = "#favorites")}>Favorites ({favorites.length})</OutlineButton>
          <Button onClick={() => (window.location.hash = "#compare")}>Compare ({compare.length}/3)</Button>
        </div>
      </div>

      <div className="mb-2 text-sm text-gray-500">{loading ? "Loading live data…" : error ? `Using local data (error: ${error})` : "Live data loaded"}</div>

      <div className="mb-6 grid gap-4 md:grid-cols-12">
        <div className="md:col-span-9">
          <div className="sticky top-4 z-10 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row">
              <div className="relative flex-1">
                <TextInput placeholder="Search by name, feature, or tag…" value={state.q} onChange={(e)=>dispatch({ type:"SET_QUERY", q:e.target.value })} aria-label="Search suppliers"/>
                <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 sm:block">🔎</div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <select value={state.category} onChange={(e)=>dispatch({ type:"SET_CATEGORY", category:e.target.value })} className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm" aria-label="Filter by category">
                  <option value="all">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <select value={state.sort} onChange={(e)=>dispatch({ type:"SET_SORT", sort:e.target.value })} className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm" aria-label="Sort">
                  <option value="relevance">Sort: Relevance</option>
                  <option value="name-asc">Name A→Z</option>
                  <option value="name-desc">Name Z→A</option>
                </select>
                <label className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm">
                  <input type="checkbox" checked={state.onlyDiscounts} onChange={()=>dispatch({ type:"TOGGLE_ONLY_DISCOUNTS" })}/> Only discounts
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map(p => (
              <ProviderCard key={p.id} p={p} onOpen={setModal} onToggleFav={() => toggleFav(p.id)} isFav={favorites.includes(p.id)} onCompareToggle={() => toggleCompare(p.id)} comparing={compare.includes(p.id)} />
            ))}
          </div>

          {!loading && results.length===0 && (
            <div className="mt-10 rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-600">No results. Try different filters.</div>
          )}
        </div>

        <aside className="md:col-span-3">
          <div className="sticky top-4 space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Filter by Tags</h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map(t => {
                  const active = state.tags.has(t);
                  return (
                    <button key={t} onClick={()=>dispatch({ type:"TOGGLE_TAG", tag:t })} className={classNames("rounded-full border px-3 py-1 text-xs font-semibold", active?"border-gray-900 bg-gray-900 text-white":"border-gray-300 bg-white text-gray-800 hover:bg-gray-50")}>{t}</button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Need help choosing?</h3>
              <p className="mb-3 text-sm text-gray-600">Save favorites and compare up to 3 providers side‑by‑side.</p>
              <div className="flex gap-2">
                <OutlineButton onClick={()=> (window.location.hash = "#favorites")}>View Favorites</OutlineButton>
                <Button onClick={()=> (window.location.hash = "#compare")}>
                  Compare
                </Button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <ProviderModal provider={modal} onClose={()=>setModal(null)} />
    </section>
  );
}

function Favorites({ favorites, setFavorites }) {
  const { providers } = useProvidersAndCategories();
  const favs = providers.filter(p => favorites.includes(p.id));
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Your Favorites</h2>
        <OutlineButton onClick={()=>setFavorites([])}>Clear All</OutlineButton>
      </div>
      {favs.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favs.map(p => (
            <ProviderCard key={p.id} p={p} onOpen={()=>{}} onToggleFav={() => setFavorites(prev => prev.filter(id => id !== p.id))} isFav={true} onCompareToggle={()=>{}} comparing={false} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-600">No favorites yet. Save providers to build your shortlist.</div>
      )}
    </section>
  );
}

function Compare({ compare, setCompare }) {
  const { providers } = useProvidersAndCategories();
  const picks = providers.filter(p => compare.includes(p.id));
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Compare Providers</h2>
        <OutlineButton onClick={()=> setCompare([])}>Clear</OutlineButton>
      </div>
      {picks.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {picks.map(p => (
            <div key={p.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <img src={getLogo(p)} alt="" className="h-8 w-8 rounded-full object-cover border border-gray-200 bg-white"/>
                  <h3 className="text-base font-semibold">{p.name}</h3>
                </div>
                {p.discount && (<Badge color="bg-green-100 text-green-800">{p.discount.label}</Badge>)}
              </div>
              <div className="mb-3 text-xs text-gray-600">{p.categoryLabel}</div>
              <p className="mb-3 text-sm text-gray-700">{p.summary}</p>
              <ul className="mb-4 list-disc pl-5 text-sm text-gray-700">{(p.tags||[]).map(t => <li key={t}>{t}</li>)}</ul>
              {p.website && (<a href={p.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg:black">Visit ↗</a>)}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-600">Add up to 3 providers from the directory to compare here.</div>
      )}
    </section>
  );
}

function Discounts() {
  const { providers } = useProvidersAndCategories();
  const discounted = providers.filter(p => p.discount);
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Discount Partners</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {discounted.map(p => (
          <div key={p.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img src={getLogo(p)} alt="" className="h-8 w-8 rounded-full object-cover border border-gray-200 bg-white"/>
                <h3 className="truncate text-base font-semibold text-gray-900">{p.name}</h3>
              </div>
              <Badge color="bg-green-100 text-green-800">{p.discount?.label}</Badge>
            </div>
            <p className="mb-4 text-sm text-gray-600">{p.summary}</p>
            <a href={p.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-3 py-2 text-sm font-semibold text:white hover:bg-black">Redeem / Learn More ↗</a>
          </div>
        ))}
      </div>
    </section>
  );
}

function LearningCenter() {
  const learningSeed = [
    { id: "the-mover", type: "magazine", title: "The Mover – UK & global industry news", href: "https://www.themover.co.uk/", blurb: "Independent news, features and insights for the moving & relocation industry." },
    { id: "bar-news", type: "article", title: "British Association of Removers – News & Guidance", href: "https://bar.co.uk/news/", blurb: "Updates from the UK’s leading removals trade association, including best practice and events." },
    { id: "movers-storers", type: "event", title: "Movers & Storers Show – UK trade expo", href: "https://moversandstorershow.com/", blurb: "The UK’s biggest removals & storage trade show with seminars and suppliers." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="mb-4 text-2xl font-bold text-gray-900">Learning Center</h2>
      <p className="mb-8 max-w-2xl text-gray-600">Interviews, how‑to guides, and marketing tips to help your moving business grow.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {learningSeed.map(i => (
          <a key={i.id} href={i.href} target="_blank" rel="noreferrer" className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="mb-2 text-xs uppercase tracking-wide text-gray-500">{i.type}</div>
            <div className="text-base font-semibold text-gray-900 group-hover:underline">{i.title}</div>
            <p className="mt-2 line-clamp-3 text-sm text-gray-600">{i.blurb}</p>
            <div className="mt-3 text-sm font-semibold text-gray-800">Read / Listen ↗</div>
          </a>
        ))}
      </div>
    </section>
  );
}

function SubmitListing() {
  const [values, set] = useState({ name: "", category: "software", website: "", description: "", discount: "", honey: "" });
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault(); setErr("");
    // basic anti‑spam: hidden honeypot + simple throttling
    if (values.honey) return; // bots fill hidden field
    const last = +localStorage.getItem("last_submit_ts") || 0;
    if (Date.now() - last < 30000) { setErr("Please wait a moment before submitting again."); return; }

    try {
      if (supabase) {
        const { error } = await supabase.from("listing_submissions").insert([{ company_name: values.name, category_id: values.category, website: values.website, description: values.description, discount: values.discount }]);
        if (error) throw error; setDone(true); localStorage.setItem("last_submit_ts", String(Date.now()));
      } else {
        const drafts = JSON.parse(localStorage.getItem("draft_listings") || "[]"); drafts.push({ ...values, id: `draft-${Date.now()}` }); localStorage.setItem("draft_listings", JSON.stringify(drafts)); setDone(true);
      }
    } catch (e) { console.error(e); setErr(e.message || "Submission failed"); }
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Submit A Listing</h2>
      {done ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-green-900"><div className="mb-2 text-lg font-semibold">Thanks! Your listing was submitted.</div><p className="text-sm">We’ll review and publish if approved.</p></div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {err && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
          <div className="hidden"><label>Company</label><input value={values.honey} onChange={(e)=>set({ ...values, honey:e.target.value })}/></div>
          <div><label className="mb-1 block text-sm font-semibold text-gray-800">Company Name</label><TextInput value={values.name} onChange={(e)=>set({ ...values, name:e.target.value })} required/></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-800">Category</label>
              <select className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm" value={values.category} onChange={(e)=>set({ ...values, category:e.target.value })}>
                {categoriesSeed.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div><label className="mb-1 block text-sm font-semibold text-gray-800">Website</label><TextInput type="url" placeholder="https://" value={values.website} onChange={(e)=>set({ ...values, website:e.target.value })}/></div>
          </div>
          <div><label className="mb-1 block text-sm font-semibold text-gray-800">Short Description</label><TextArea value={values.description} onChange={(e)=>set({ ...values, description:e.target.value })}/></div>
          <div><label className="mb-1 block text-sm font-semibold text-gray-800">Discount (optional)</label><TextInput placeholder="e.g., 50% off second month" value={values.discount} onChange={(e)=>set({ ...values, discount:e.target.value })}/></div>
          <div className="pt-2"><Button type="submit">Submit Listing</Button></div>
        </form>
      )}
    </section>
  );
}

function Contact() {
  const [values, set] = useState({ name: "", email: "", message: "", honey: "" });
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault(); setErr("");
    if (values.honey) return;
    try {
      if (supabase) {
        const { error } = await supabase.from("contact_messages").insert([{ name: values.name, email: values.email, message: values.message }]);
        if (error) throw error; setSent(true);
      } else {
        const drafts = JSON.parse(localStorage.getItem("contact_messages") || "[]"); drafts.push({ ...values, id: `local-${Date.now()}` }); localStorage.setItem("contact_messages", JSON.stringify(drafts)); setSent(true);
      }
    } catch (e) { console.error(e); setErr(e.message || "Could not send message"); }
  };

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Contact Us</h2>
      {sent ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-green-900"><div className="mb-2 text-lg font-semibold">Message sent!</div><p className="text-sm">We will reply to your email shortly.</p></div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {err && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
          <div className="hidden"><label>Company</label><input value={values.honey} onChange={(e)=>set({ ...values, honey:e.target.value })}/></div>
          <div><label className="mb-1 block text-sm font-semibold text-gray-800">Name</label><TextInput value={values.name} onChange={(e)=>set({ ...values, name:e.target.value })} required/></div>
          <div><label className="mb-1 block text-sm font-semibold text-gray-800">Email</label><TextInput type="email" value={values.email} onChange={(e)=>set({ ...values, email:e.target.value })} required/></div>
          <div><label className="mb-1 block text-sm font-semibold text-gray-800">Message</label><TextArea value={values.message} onChange={(e)=>set({ ...values, message:e.target.value })} required/></div>
          <div className="pt-2"><Button type="submit">Send Message</Button></div>
        </form>
      )}
    </section>
  );
}

/***********************************\
|*           ADMIN PORTAL          *|
\***********************************/
function AdminLogin() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  if (!supabase) return <section className="mx-auto max-w-2xl px-4 py-10">Supabase env not configured.</section>;
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

function AdminDashboard() {
  const [tab, setTab] = useState("submissions");
  const [subs, setSubs] = useState([]);
  const [prov, setProv] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState("submissions");
  const [subs, setSubs] = useState([]);
  const [prov, setProv] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // detect role non-blocking so dashboard still renders
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setIsAdmin(false); return; }
        const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
        setIsAdmin(prof?.role === 'admin');
      } catch { setIsAdmin(false); }
    })();
  }, []);

  // Submissions actions
  const approve = async (id) => { await supabase.rpc("approve_submission", { sub_id:id, publish:true }); await load(); };
  const reject  = async (id) => { await supabase.from("listing_submissions").update({ status:"rejected" }).eq("id", id); await load(); };

  // Providers actions
  const toggleShow = async (id, on) => { await supabase.from("providers").update({ is_active:on }).eq("id", id); await load(); };
  const delProv    = async (id) => { if (confirm("Delete provider?")) { await supabase.from("providers").delete().eq("id", id); await load(); } };
  const addProv    = async () => {
    const name = prompt("Company name?");
    if (!name) return;
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

  // Categories actions
  const addCat = async () => {
    const id = prompt("Category id (letters only, e.g. software)");
    if (!id) return;
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
          You are signed in but not marked as <strong>admin</strong>. Read-only features will work; write actions may be blocked by RLS. To enable full access, set your role to <code>admin</code> in <code>public.profiles</code>.
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
                    <img src={p.logo || (p.website ? `https://www.google.com/s2/favicons?domain=${new URL(p.website).hostname}&sz=64` : "")} className="h-8 w-8 rounded-full border border-gray-200 bg-white" alt=""/>
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.category_id} · {p.website || "—"} {p.is_featured ? "· Featured" : ""} {p.tier && p.tier !== 'free' ? `· ${p.tier}` : ''}</div>
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

function AdminPortal() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user || null);
      setLoading(false);
    });
    // initial
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user || null);
      setLoading(false);
    })();
    return () => { sub?.subscription?.unsubscribe?.(); };
  }, []);

  if (!supabase) return (
    <section className="mx-auto max-w-xl px-4 py-10">
      <h2 className="mb-2 text-2xl font-bold">Supabase not configured</h2>
      <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
        <li>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in Vercel (Preview + Production).</li>
        <li>Redeploy the site.</li>
        <li>Supabase → Auth → URL Config: add <code>{window.location.origin}/#admin</code> to Redirect URLs.</li>
      </ol>
    </section>
  );

  if (loading) return <section className="mx-auto max-w-2xl px-4 py-10">Checking session…</section>;
  if (!user) return <AdminLogin />;
  return <AdminDashboard />;
}
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const BOOTSTRAP_ADMIN = import.meta?.env?.VITE_BOOTSTRAP_ADMIN_EMAIL; // optional safety net

  useEffect(() => {
    if (!supabase) return;
    let unsub = supabase.auth.onAuthStateChange(async () => {
      // any auth change → re-evaluate
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user || null);
      if (!user) { setAllowed(false); setLoading(false); return; }

      // Bootstrap: allow the configured email even if profiles row hasn't been created yet
      if (BOOTSTRAP_ADMIN && user.email && user.email.toLowerCase() === BOOTSTRAP_ADMIN.toLowerCase()) {
        setAllowed(true); setLoading(false); return;
      }

      // Check role from profiles (RLS policies must allow select of own row / admin)
      const { data: prof, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.warn("profiles read error", error.message);
        setAllowed(false);
      } else {
        setAllowed(prof?.role === 'admin');
      }
      setLoading(false);
    }).data?.subscription;

    // initial load (covers hard refresh)
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user || null);
      if (!user) { setAllowed(false); setLoading(false); return; }
      if (BOOTSTRAP_ADMIN && user.email && user.email.toLowerCase() === BOOTSTRAP_ADMIN.toLowerCase()) {
        setAllowed(true); setLoading(false); return;
      }
      const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      setAllowed(prof?.role === 'admin');
      setLoading(false);
    })();

    return () => { try { unsub && unsub.unsubscribe && unsub.unsubscribe(); } catch {} };
  }, []);

  if (!supabase) return (
    <section className="mx-auto max-w-xl px-4 py-10">
      <h2 className="mb-2 text-2xl font-bold">Supabase not configured</h2>
      <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
        <li>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in Vercel (Preview + Production).</li>
        <li>Redeploy the site.</li>
        <li>Supabase → Auth → URL Config: add <code>{window.location.origin}/#admin</code> to Redirect URLs.</li>
      </ol>
    </section>
  );

  if (loading) return <section className="mx-auto max-w-2xl px-4 py-10">Checking session…</section>;
  if (!user) return <AdminLogin />;
  if (!allowed) return (
    <section className="mx-auto max-w-xl px-4 py-10">
      <h2 className="mb-3 text-2xl font-bold">Access restricted</h2>
      <p className="text-sm text-gray-700">You are signed in as <strong>{user.email}</strong> but not recognised as an admin.</p>
      <p className="mt-2 text-sm text-gray-700">Ask an admin to set your role in <code>public.profiles</code> or set <code>VITE_BOOTSTRAP_ADMIN_EMAIL</code> to your email and redeploy, then refresh this page.</p>
    </section>
  );

  return <AdminDashboard />;
}

/***********************************\
|*           APP SHELL             *|
\***********************************/
function Header({ hash }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <a href="#home" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-content-center rounded-full bg-gray-900 font-black text-white">AL</div>
          <div className="text-sm font-extrabold tracking-wider text-gray-900">{BRAND.name}</div>
        </a>
        <nav className="hidden items-center gap-2 md:flex">
          {NAV.map(item => (
            <a key={item.hash} href={item.hash} className={classNames("rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100", hash===item.hash?"bg-gray-900 text-white hover:bg-gray-900":"")}>{item.label}</a>
          ))}
        </nav>
        <div className="md:hidden"><a href="#providers" className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white">Browse</a></div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200 bg:white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="grid h-8 w-8 place-content-center rounded-full bg-gray-900 font-black text-white">AL</div>
            <div className="text-sm font-extrabold tracking-wider text-gray-900">{BRAND.name}</div>
          </div>
          <p className="max-w-sm text-sm text-gray-600">{BRAND.tagline}</p>
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold text-gray-900">Explore</div>
          <ul className="space-y-1 text-sm text-gray-700">
            <li><a className="hover:underline" href="#providers">Suppliers</a></li>
            <li><a className="hover:underline" href="#discounts">Discounts</a></li>
            <li><a className="hover:underline" href="#learning">Learning Center</a></li>
            <li><a className="hover:underline" href="#submit">Submit Listing</a></li>
            <li><a className="hover:underline" href="#contact">Contact</a></li>
            <li><a className="hover:underline" href="#admin">Admin</a></li>
          </ul>
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold text-gray-900">Newsletter</div>
          <p className="mb-3 text-sm text-gray-600">Get occasional updates and new partner discounts.</p>
          <div className="flex gap-2"><TextInput placeholder="you@company.com" className="flex-1"/><Button>Subscribe</Button></div>
        </div>
      </div>
      <div className="border-t border-gray-200 py-4 text-center text-xs text-gray-500">© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</div>
    </footer>
  );
}

export default function App() {
  const [hash] = useHashRoute("#home");
  const [state, dispatch] = useReducer(reducer, initialState);
  const [favorites, setFavorites] = useLocalStorage("favorites_providers", []);
  const [compare, setCompare] = useLocalStorage("compare_providers", []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <Header hash={hash || "#home"} />
      {(!hash || hash==="#home") && (<Home />)}
      {hash==="#providers" && (<Providers state={state} dispatch={dispatch} favorites={favorites} setFavorites={setFavorites} compare={compare} setCompare={setCompare} />)}
      {hash==="#favorites" && (<Favorites favorites={favorites} setFavorites={setFavorites} />)}
      {hash==="#compare" && (<Compare compare={compare} setCompare={setCompare} />)}
      {hash==="#discounts" && (<Discounts />)}
      {hash==="#learning" && (<LearningCenter />)}
      {hash==="#submit" && (<SubmitListing />)}
      {hash==="#contact" && (<Contact />)}
      {hash==="#admin" && (<AdminPortal />)}
      <Footer />

      {/**
       * ---- SUPABASE SCHEMA (paste in Supabase SQL Editor) ----
       *
       * create extension if not exists "pgcrypto";
       *
       * create table if not exists public.categories (
       *   id text primary key,
       *   label text not null
       * );
       *
       * create table if not exists public.providers (
       *   id uuid primary key default gen_random_uuid(),
       *   name text not null,
       *   category_id text not null references public.categories(id) on delete restrict,
       *   tags text[] default '{}',
       *   website text,
       *   summary text,
       *   details text,
       *   discount_label text,
       *   discount_details text,
       *   logo text,
       *   is_active boolean default true,
       *   is_featured boolean default false,
       *   feature_until timestamptz,
       *   tier text default 'free',
       *   created_at timestamptz default now()
       * );
       *
       * create index if not exists providers_category_idx on public.providers(category_id);
       * create index if not exists providers_active_idx   on public.providers(is_active);
       * create index if not exists providers_featured_idx on public.providers(is_featured);
       *
       * create table if not exists public.listing_submissions (
       *   id uuid primary key default gen_random_uuid(),
       *   company_name text not null,
       *   category_id text not null,
       *   website text,
       *   description text,
       *   discount text,
       *   status text check (status in ('new','approved','rejected')) default 'new',
       *   reviewed_at timestamptz,
       *   reviewed_by text,
       *   notes text,
       *   created_at timestamptz default now()
       * );
       *
       * create table if not exists public.contact_messages (
       *   id uuid primary key default gen_random_uuid(),
       *   name text not null,
       *   email text not null,
       *   message text not null,
       *   created_at timestamptz default now()
       * );
       *
       * -- Roles / profiles for admin auth
       * create table if not exists public.profiles (
       *   id uuid primary key references auth.users(id) on delete cascade,
       *   email text unique,
       *   role text check (role in ('admin','editor','viewer')) default 'viewer',
       *   created_at timestamptz default now()
       * );
       * create or replace function public.handle_new_user() returns trigger language plpgsql security definer as $$
       * begin
       *   insert into public.profiles (id,email,role)
       *   values (new.id, new.email, 'viewer') on conflict (id) do nothing;
       *   return new;
       * end; $$;
       * drop trigger if exists on_auth_user_created on auth.users;
       * create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
       * -- MANUALLY promote yourself: update public.profiles set role='admin' where email ilike 'you@yourcompany.com';
       *
       * -- RLS
       * alter table public.categories enable row level security;
       * alter table public.providers enable row level security;
       * alter table public.listing_submissions enable row level security;
       * alter table public.contact_messages enable row level security;
       * alter table public.profiles enable row level security;
       *
       * -- Public reads
       * create policy "Public read categories" on public.categories for select using (true);
       * create policy "Public read providers"  on public.providers  for select using (true);
       *
       * -- Submissions: public insert; admins read/update/delete
       * create policy "Public submit listings" on public.listing_submissions for insert using (true) with check (true);
       * create policy "Admins read submissions" on public.listing_submissions for select using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role='admin'));
       * create policy "Admins update submissions" on public.listing_submissions for update using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role='admin')) with check (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role='admin'));
       * create policy "Admins delete submissions" on public.listing_submissions for delete using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role='admin'));
       *
       * -- Providers/Categories write only by admins
       * create policy "Admins manage providers" on public.providers for all using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role='admin')) with check (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role='admin'));
       * create policy "Admins manage categories" on public.categories for all using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role='admin')) with check (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role='admin'));
       *
       * -- Approve helper
       * create or replace function public.approve_submission(sub_id uuid, publish boolean default true)
       * returns void language plpgsql security definer as $$
       * declare s record;
       * begin
       *   select * into s from public.listing_submissions where id=sub_id;
       *   if not found then raise exception 'Submission % not found', sub_id; end if;
       *   if publish then
       *     insert into public.providers (name, category_id, tags, website, summary, details, discount_label, discount_details, logo, is_active)
       *     values (s.company_name, s.category_id, '{}', s.website, coalesce(s.description,'Submitted via Appy Link'), s.description, s.discount, null, null, true);
       *   end if;
       *   update public.listing_submissions set status='approved', reviewed_at=now() where id=sub_id;
       * end $$;
       *
       * -- Seeds
       * insert into public.categories (id,label) values
       * ('marketing','Marketing / Advertising'),
       * ('software','Moving Software & CRM'),
       * ('sales','Moving Sales Solutions'),
       * ('insurance','Moving Insurance'),
       * ('apps','Apps & Online Tools'),
       * ('leads','Moving Leads'),
       * ('equipment','Moving Equipment') on conflict (id) do nothing;
       */}
    </div>
  );
}
