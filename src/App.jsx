import React, { useEffect, useMemo, useReducer, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/**
 * Appy Link – Linking movers with suppliers (UK)
 * -------------------------------------------------
 * Single‑file React + Tailwind app, production‑ready, wired to Supabase.
 * - Reads categories & providers from Supabase (fallback to local seed)
 * - Circular logos with favicon fallback
 * - Favorites & Compare (localStorage)
 * - Submit Listing & Contact -> Supabase tables (local fallback)
 * - Sections: Home, Suppliers, Discounts, Learning, Submit, Contact
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
  { id: "moveman", name: "MoveMan", category: "software", tags: ["UK","CRM","Operations"], website: "https://www.movemanpro.com/", logo: "https://www.google.com/s2/favicons?domain=movemanpro.com&sz=128", summary: "Removals management software widely used in the UK.", details: "Quoting, scheduling, dispatch & storage; long‑standing UK vendor." },
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
function useProvidersAndCategories() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(categoriesSeed);
  const [providers, setProviders] = useState(providersSeed);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!supabase) { setLoading(false); return; }
      try {
        const [{ data: cats, error: catErr }, { data: provs, error: provErr }] = await Promise.all([
          supabase.from("categories").select("id,label").order("label"),
          supabase.from("providers").select("id,name,category_id,tags,website,summary,details,discount_label,discount_details,logo,is_active").eq("is_active", true).order("name"),
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
            logo: p.logo || p.logo_url, // support either column
          }));
          setProviders(mapped);
        }
      } catch (e) { console.error(e); setError(e.message); }
      finally { mounted && setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  return { loading, categories, providers, error };
}

/***********************************\
|*       PROVIDER COMPONENTS       *|
\***********************************/
const ProviderCard = ({ p, onOpen, onToggleFav, isFav, onCompareToggle, comparing }) => (
  <div className="group relative flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <img src={getLogo(p)} alt="" className="h-10 w-10 rounded-full object-cover border border-gray-200 bg-white"/>
        <h3 className="truncate text-base font-semibold text-gray-900">{p.name}</h3>
      </div>
      {p.discount && (<Badge color="bg-green-100 text-green-800">{p.discount.label}</Badge>)}
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
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
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
              {p.website && (<a href={p.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black">Visit ↗</a>)}
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
            <a href={p.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black">Redeem / Learn More ↗</a>
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
  const [values, set] = useState({ name: "", category: "software", website: "", description: "", discount: "" });
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault(); setErr("");
    try {
      if (supabase) {
        const { error } = await supabase.from("listing_submissions").insert([{ company_name: values.name, category_id: values.category, website: values.website, description: values.description, discount: values.discount }]);
        if (error) throw error; setDone(true);
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
  const [values, set] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault(); setErr("");
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
    <footer className="mt-20 border-t border-gray-200 bg-white">
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
      {(!hash || hash==="#home") && (<><Home /><section className="mx-auto mt-6 max-w-7xl px-4"><dl className="grid w-full grid-cols-2 gap-6 sm:max-w-xl"><div><div className="text-2xl font-extrabold text-gray-900">7</div><div className="text-sm text-gray-600">Core Categories</div></div><div><div className="text-2xl font-extrabold text-gray-900">≥25</div><div className="text-sm text-gray-600">UK Providers</div></div><div><div className="text-2xl font-extrabold text-gray-400">Compare</div><div className="text-sm text-gray-600">Select up to 3</div></div><div><div className="text-2xl font-extrabold text-gray-400">Favorites</div><div className="text-sm text-gray-600">Saved locally</div></div></dl></section></>)}
      {hash==="#providers" && (<Providers state={state} dispatch={dispatch} favorites={favorites} setFavorites={setFavorites} compare={compare} setCompare={setCompare} />)}
      {hash==="#favorites" && (<Favorites favorites={favorites} setFavorites={setFavorites} />)}
      {hash==="#compare" && (<Compare compare={compare} setCompare={setCompare} />)}
      {hash==="#discounts" && (<Discounts />)}
      {hash==="#learning" && (<LearningCenter />)}
      {hash==="#submit" && (<SubmitListing />)}
      {hash==="#contact" && (<Contact />)}
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
       *   created_at timestamptz default now()
       * );
       *
       * create table if not exists public.listing_submissions (
       *   id uuid primary key default gen_random_uuid(),
       *   company_name text not null,
       *   category_id text not null,
       *   website text,
       *   description text,
       *   discount text,
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
       * alter table public.categories enable row level security;
       * alter table public.providers enable row level security;
       * alter table public.listing_submissions enable row level security;
       * alter table public.contact_messages enable row level security;
       *
       * create policy "Anyone can read categories" on public.categories for select using (true);
       * create policy "Anyone can read providers"  on public.providers  for select using (true);
       * create policy "Anon can insert listing submissions" on public.listing_submissions for insert using (true) with check (true);
       * create policy "Anon can insert contact messages"   on public.contact_messages   for insert using (true) with check (true);
       *
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
