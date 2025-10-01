import React, { useEffect, useMemo, useReducer, useState, useCallback, lazy, Suspense } from "react";
import { supabase } from "./lib/supabaseClient";
import { Badge, Button, OutlineButton, TextArea, TextInput } from "./components/UI";
import ProviderCard from "./components/ProviderCard";
import { getLogo } from "./utils/getLogo";
import { sanitizeHtml } from "./utils/sanitization";
import { validateSubmission, validateContact } from "./utils/validation";

// Lazy load admin portal
const AdminPortal = lazy(() => import("./admin/AdminPortal"));

// Constants
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
  { label: "Admin", hash: "#admin" },
];

// Utilities
function classNames(...xs) { 
  return xs.filter(Boolean).join(" "); 
}

function useHashRoute(defaultHash = "#home") {
  const [hash, setHash] = useState(() => window.location.hash || defaultHash);
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || defaultHash);
    window.addEventListener("hashchange", onHash);
    if (!window.location.hash) window.location.hash = defaultHash;
    return () => window.removeEventListener("hashchange", onHash);
  }, [defaultHash]);
  return [hash, (next) => (window.location.hash = next)];
}

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try { 
      const raw = localStorage.getItem(key); 
      return raw ? JSON.parse(raw) : initialValue; 
    } catch { 
      return initialValue; 
    }
  });
  
  const setStoredValue = useCallback((newValue) => {
    try {
      setValue(newValue);
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error(`Error saving to localStorage:`, error);
    }
  }, [key]);
  
  return [value, setStoredValue];
}

// Seeds
const categoriesSeed = [
  { id: "software", label: "Moving Software & CRM" },
  { id: "sales", label: "Moving Sales Solutions" },
  { id: "marketing", label: "Marketing / Advertising" },
  { id: "insurance", label: "Moving Insurance" },
  { id: "equipment", label: "Moving Equipment" },
  { id: "apps", label: "Apps & Online Tools" },
  { id: "leads", label: "Moving Leads" },
];

const providersSeed = [
  // SOFTWARE / CRM
  { id:"moveman", name:"MoveMan", category:"software", tags:["UK","CRM","Ops"], website:"https://www.movemanpro.com/", summary:"UK removals CRM for quoting, planning and storage.", details:"Long-standing removals CRM covering quotes, diary, crews, storage and invoicing.", is_featured:true },
  { id:"moveware", name:"Moveware", category:"software", tags:["ERP","CRM"], website:"https://www.moveconnect.com/", summary:"End-to-end ERP/CRM for moving & storage.", details:"Sales to operations to accounting in one stack." },
  // Add more seeds as needed...
];

// Reducer for filters
const initialState = { 
  q: "", 
  category: "all", 
  tags: new Set(), 
  onlyDiscounts: false, 
  sort: "relevance" 
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_QUERY": 
      return { ...state, q: action.q };
    case "SET_CATEGORY": 
      return { ...state, category: action.category };
    case "TOGGLE_TAG": {
      const tags = new Set(state.tags);
      tags.has(action.tag) ? tags.delete(action.tag) : tags.add(action.tag);
      return { ...state, tags };
    }
    case "TOGGLE_ONLY_DISCOUNTS": 
      return { ...state, onlyDiscounts: !state.onlyDiscounts };
    case "SET_SORT": 
      return { ...state, sort: action.sort };
    case "RESET_FILTERS": 
      return { ...initialState, tags: new Set() };
    default: 
      return state;
  }
}

// Data Hook with Pagination
function useProvidersAndCategories({ page = 1, pageSize = 20 } = {}) {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(categoriesSeed);
  const [providers, setProviders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    (async () => {
      setLoading(true);
      
      if (!supabase) { 
        setProviders(providersSeed.slice((page - 1) * pageSize, page * pageSize));
        setTotalCount(providersSeed.length);
        setLoading(false); 
        return; 
      }
      
      try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        
        // Get categories
        const { data: cats, error: catErr } = await supabase
          .from("categories")
          .select("id,label")
          .order("label");
          
        if (catErr) throw catErr;
        
        // Get total count
        const { count, error: countErr } = await supabase
          .from("providers")
          .select("id", { count: 'exact', head: true })
          .eq("is_active", true);
          
        if (countErr) throw countErr;
        
        // Get paginated providers
        const { data: provs, error: provErr } = await supabase
          .from("providers")
          .select("id,name,category_id,tags,website,summary,details,discount_label,discount_details,logo,is_active,is_featured,feature_until,tier")
          .eq("is_active", true)
          .order("is_featured", { ascending: false })
          .order("name")
          .range(from, to);
          
        if (provErr) throw provErr;
        
        if (!mounted) return;
        
        const catList = cats?.length ? cats : categoriesSeed;
        setCategories(catList);
        setTotalCount(count || 0);
        
        const catMap = new Map(catList.map(c => [c.id, c.label]));
        const mapped = (provs || []).map(p => ({
          id: p.id,
          name: p.name,
          category: p.category_id,
          categoryLabel: catMap.get(p.category_id),
          tags: p.tags || [],
          website: p.website,
          summary: p.summary,
          details: p.details,
          discount: p.discount_label ? { 
            label: p.discount_label, 
            details: p.discount_details 
          } : null,
          logo: p.logo,
          is_featured: !!p.is_featured,
          tier: p.tier || "free",
        }));
        
        setProviders(mapped);
      } catch (e) {
        console.error(e);
        setError(e.message);
        // Fallback to seeds on error
        setProviders(providersSeed.slice((page - 1) * pageSize, page * pageSize));
        setTotalCount(providersSeed.length);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    
    return () => { mounted = false; };
  }, [page, pageSize]);

  return { loading, categories, providers, totalCount, error };
}

// Pages
function Home() {
  const { providers, loading } = useProvidersAndCategories({ pageSize: 6 });
  const featured = providers.filter(p => p.is_featured);
  
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
            <span>Supplier Directory</span>
            <span aria-hidden="true">•</span>
            <span>Built for UK movers</span>
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">
            {BRAND.tagline}
          </h1>
          <p className="mt-4 max-w-xl text-gray-600">
            Browse vetted UK providers, compare options, and claim partner discounts. Submit your listing in minutes.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => (window.location.hash = "#providers")}>
              {BRAND.ctaPrimary}
            </Button>
            <OutlineButton onClick={() => (window.location.hash = "#submit")}>
              {BRAND.ctaSecondary}
            </OutlineButton>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-[4/3] w-full rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 p-6 shadow-inner">
            <div className="grid h-full grid-rows-3 gap-3">
              <div className="rounded-2xl bg-white shadow-sm" />
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white shadow-sm" />
                <div className="rounded-2xl bg-white shadow-sm" />
                <div className="rounded-2xl bg-white shadow-sm" />
              </div>
              <div className="rounded-2xl bg-white shadow-sm" />
            </div>
          </div>
        </div>
      </div>

      {!loading && featured.length > 0 && (
        <div className="mt-12">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Featured suppliers</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map(p => (
              <div key={p.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-3">
                  <img 
                    src={getLogo(p)} 
                    alt="" 
                    className="h-8 w-8 rounded-full border border-amber-200 bg-white"
                    loading="lazy"
                  />
                  <div className="font-semibold">{sanitizeHtml(p.name)}</div>
                </div>
                <div className="text-sm text-gray-700">{sanitizeHtml(p.summary)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

const Providers = React.memo(function Providers({ state, dispatch, favorites, setFavorites, compare, setCompare }) {
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const { loading, categories, providers, totalCount, error } = useProvidersAndCategories({ page, pageSize });
  const [modal, setModal] = useState(null);

  const allTags = useMemo(() => { 
    const s = new Set(); 
    providers.forEach(p => p.tags?.forEach(t => s.add(t))); 
    return Array.from(s).sort(); 
  }, [providers]);

  const results = useMemo(() => {
    let r = providers.slice();
    if (state.category !== "all") r = r.filter(p => p.category === state.category);
    if (state.onlyDiscounts) r = r.filter(p => p.discount);
    if (state.tags.size) r = r.filter(p => p.tags && p.tags.some(t => state.tags.has(t)));
    if (state.q.trim()) {
      const q = state.q.toLowerCase();
      r = r.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.summary?.toLowerCase().includes(q) ||
        p.details?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    if (state.sort === "name-asc") r.sort((a,b) => a.name.localeCompare(b.name));
    if (state.sort === "name-desc") r.sort((a,b) => b.name.localeCompare(a.name));
    if (state.sort === "relevance") r.sort((a,b) => (b.is_featured?1:0) - (a.is_featured?1:0));
    return r;
  }, [state, providers]);

  const toggleFav = useCallback((id) => {
    setFavorites(prev => { 
      const s = new Set(prev); 
      s.has(id) ? s.delete(id) : s.add(id); 
      return Array.from(s); 
    });
  }, [setFavorites]);
  
  const toggleCompare = useCallback((id) => {
    setCompare(prev => { 
      const s = new Set(prev); 
      if (s.has(id)) s.delete(id); 
      else if (s.size < 3) s.add(id); 
      return Array.from(s); 
    });
  }, [setCompare]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h2 className="text-2xl font-bold text-gray-900">Browse Suppliers</h2>
        <div className="flex items-center gap-2">
          <OutlineButton onClick={() => dispatch({ type: "RESET_FILTERS" })}>
            Reset
          </OutlineButton>
          <OutlineButton onClick={() => (window.location.hash = "#favorites")}>
            Favorites ({favorites.length})
          </OutlineButton>
          <Button onClick={() => (window.location.hash = "#compare")}>
            Compare ({compare.length}/3)
          </Button>
        </div>
      </div>

      <div className="mb-2 text-sm text-gray-500">
        {loading ? "Loading..." : error ? `Error: ${error}` : `Showing ${results.length} results`}
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-12">
        <div className="md:col-span-9">
          <div className="sticky top-4 z-10 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row">
              <div className="relative flex-1">
                <TextInput 
                  placeholder="Search..." 
                  value={state.q} 
                  onChange={(e) => dispatch({ type: "SET_QUERY", q: e.target.value })} 
                  aria-label="Search suppliers"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <select 
                  value={state.category} 
                  onChange={(e) => dispatch({ type: "SET_CATEGORY", category: e.target.value })} 
                  className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm" 
                  aria-label="Filter by category"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <select 
                  value={state.sort} 
                  onChange={(e) => dispatch({ type: "SET_SORT", sort: e.target.value })} 
                  className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm" 
                  aria-label="Sort"
                >
                  <option value="relevance">Sort: Relevance</option>
                  <option value="name-asc">Name A→Z</option>
                  <option value="name-desc">Name Z→A</option>
                </select>
                <label className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm">
                  <input 
                    type="checkbox" 
                    checked={state.onlyDiscounts} 
                    onChange={() => dispatch({ type: "TOGGLE_ONLY_DISCOUNTS" })}
                  /> 
                  Only discounts
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map(p => (
              <ProviderCard
                key={p.id}
                p={p}
                onOpen={setModal}
                onToggleFav={() => toggleFav(p.id)}
                isFav={favorites.includes(p.id)}
                onCompareToggle={() => toggleCompare(p.id)}
                comparing={compare.includes(p.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="mt-10 rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-600">
              No results. Try different filters.
            </div>
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
                    <button 
                      key={t} 
                      onClick={() => dispatch({ type: "TOGGLE_TAG", tag: t })} 
                      className={classNames(
                        "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                        active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Modal */}
      {modal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" 
          role="dialog" 
          aria-modal="true"
          onClick={() => setModal(null)}
        >
          <div 
            className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img 
                  src={getLogo(modal)} 
                  alt="" 
                  className="h-10 w-10 rounded-full object-cover border border-gray-200 bg-white"
                />
                <h3 className="text-xl font-semibold text-gray-900">
                  {sanitizeHtml(modal.name)}
                </h3>
              </div>
              <button 
                onClick={() => setModal(null)} 
                className="rounded-full p-2 hover:bg-gray-100"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className="mb-3 flex flex-wrap gap-1">
              <Badge>{modal.categoryLabel || modal.category}</Badge>
              {modal.tags?.map(t => <Badge key={t}>{t}</Badge>)}
              {modal.is_featured && <Badge color="bg-yellow-100 text-yellow-800">Featured</Badge>}
              {modal.discount && <Badge color="bg-green-100 text-green-800">{modal.discount.label}</Badge>}
            </div>
            <p className="mb-4 text-gray-700">
              {sanitizeHtml(modal.details || modal.summary)}
            </p>
            {modal.website && (
              <a 
                href={modal.website} 
                target="_blank" 
                rel="noreferrer noopener" 
                className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black"
              >
                Visit Website ↗
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
});

function SubmitListing() {
  const [values, setValues] = useState({ 
    name: "", 
    category: "software", 
    website: "", 
    description: "", 
    discount: "" 
  });
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const validationErrors = validateSubmission(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setErrors({});
    setSubmitting(true);

    try {
      if (supabase) {
        const { error } = await supabase.from("listing_submissions").insert([{
          company_name: sanitizeHtml(values.name),
          category_id: values.category,
          website: values.website,
          description: sanitizeHtml(values.description),
          discount: sanitizeHtml(values.discount)
        }]);
        if (error) throw error;
        setDone(true);
      } else {
        // Local storage fallback
        const drafts = JSON.parse(localStorage.getItem("draft_listings") || "[]");
        drafts.push({ ...values, id: `draft-${Date.now()}` });
        localStorage.setItem("draft_listings", JSON.stringify(drafts));
        setDone(true);
      }
    } catch (e) {
      console.error(e);
      setErrors({ submit: e.message || "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Submit A Listing</h2>
      {done ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-green-900">
          <div className="mb-2 text-lg font-semibold">Thanks! Your listing was submitted.</div>
          <p className="text-sm">We'll review and publish if approved.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {errors.submit && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errors.submit}
            </div>
          )}
          
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">
              Company Name *
            </label>
            <TextInput 
              value={values.name} 
              onChange={(e) => setValues({ ...values, name: e.target.value })} 
              required
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-800">
                Category
              </label>
              <select 
                className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm" 
                value={values.category} 
                onChange={(e) => setValues({ ...values, category: e.target.value })}
              >
                {categoriesSeed.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-800">
                Website
              </label>
              <TextInput 
                type="url" 
                placeholder="https://"
                value={values.website} 
                onChange={(e) => setValues({ ...values, website: e.target.value })}
                aria-invalid={!!errors.website}
              />
              {errors.website && (
                <p className="mt-1 text-xs text-red-600">{errors.website}</p>
              )}
            </div>
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">
              Short Description *
            </label>
            <TextArea 
              value={values.description} 
              onChange={(e) => setValues({ ...values, description: e.target.value })}
              required
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description}</p>
            )}
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">
              Discount (optional)
            </label>
            <TextInput 
              placeholder="e.g., 50% off second month" 
              value={values.discount} 
              onChange={(e) => setValues({ ...values, discount: e.target.value })}
            />
          </div>
          
          <div className="pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Listing"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

// Main App Component
function Header({ hash }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <a href="#home" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-content-center rounded-full bg-gray-900 font-black text-white">
            AL
          </div>
          <div className="text-sm font-extrabold tracking-wider text-gray-900">
            {BRAND.name}
          </div>
        </a>
        <nav className="hidden items-center gap-2 md:flex">
          {NAV.map(item => (
            <a 
              key={item.hash} 
              href={item.hash} 
              className={classNames(
                "rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100",
                hash === item.hash ? "bg-gray-900 text-white hover:bg-gray-900" : ""
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="md:hidden">
          <a href="#providers" className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white">
            Browse
          </a>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="grid h-8 w-8 place-content-center rounded-full bg-gray-900 font-black text-white">
              AL
            </div>
            <div className="text-sm font-extrabold tracking-wider text-gray-900">
              {BRAND.name}
            </div>
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
          <p className="mb-3 text-sm text-gray-600">
            Get occasional updates and new partner discounts.
          </p>
        </div>
      </div>
      <div className="border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
      </div>
    </footer>
  );
}

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
            <p className="mt-2 text-gray-600">Please refresh the page to try again.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-white"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

export default function App() {
  const [hash] = useHashRoute("#home");
  const [state, dispatch] = useReducer(reducer, initialState);
  const [favorites, setFavorites] = useLocalStorage("favorites_providers", []);
  const [compare, setCompare] = useLocalStorage("compare_providers", []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
        <Header hash={hash || "#home"} />
        
        {(!hash || hash === "#home") && <Home />}
        {hash === "#providers" && (
          <Providers 
            state={state} 
            dispatch={dispatch} 
            favorites={favorites} 
            setFavorites={setFavorites} 
            compare={compare} 
            setCompare={setCompare} 
          />
        )}
        {hash === "#submit" && <SubmitListing />}
        {hash === "#admin" && (
          <Suspense fallback={
            <div className="flex justify-center p-8">
              <div className="text-gray-600">Loading admin panel...</div>
            </div>
          }>
            <AdminPortal />
          </Suspense>
        )}
        
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
