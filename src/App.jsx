import React, { useEffect, useMemo, useReducer, useState } from "react";
import AdminPortal from "./admin/AdminPortal";
import { supabase } from "./lib/supabaseClient";
import { Badge, Button, OutlineButton, TextArea, TextInput } from "./components/UI";
import ProviderCard from "./components/ProviderCard";
import { getLogo } from "./utils/getLogo";

/**
 * Appy Link – Public site shell with seeds + Supabase hook
 * - Public pages: Home, Providers (filters/favorites/compare), Discounts, Learning, Submit, Contact
 * - Admin lives in ./admin/*
 * - Reads live data from Supabase when env is set; otherwise uses seeds
 */

// ---------------- Brand & Nav ----------------
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

// ---------------- Utilities ----------------
function classNames(...xs) { return xs.filter(Boolean).join(" "); }
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
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initialValue; } catch { return initialValue; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }, [key, value]);
  return [value, setValue];
}

// ---------------- Seeds (Categories + 30 Suppliers) ----------------
const categoriesSeed = [
  { id: "software",  label: "Moving Software & CRM" },
  { id: "sales",     label: "Moving Sales Solutions" },
  { id: "marketing", label: "Marketing / Advertising" },
  { id: "insurance", label: "Moving Insurance" },
  { id: "equipment", label: "Moving Equipment" },
  { id: "apps",      label: "Apps & Online Tools" },
  { id: "leads",     label: "Moving Leads" },
];

const providersSeed = [
  // SOFTWARE / CRM
  { id:"moveman", name:"MoveMan", category:"software", tags:["UK","CRM","Ops"], website:"https://www.movemanpro.com/", summary:"UK removals CRM for quoting, planning and storage.", details:"Long-standing removals CRM covering quotes, diary, crews, storage and invoicing.", is_featured:true },
  { id:"moveware", name:"Moveware", category:"software", tags:["ERP","CRM"], website:"https://www.moveconnect.com/", summary:"End-to-end ERP/CRM for moving & storage.", details:"Sales to operations to accounting in one stack." },
  { id:"movehq", name:"MoveHQ", category:"software", tags:["CRM","Survey"], website:"https://www.movehq.com/", summary:"Digital surveys, CRM, and operations tools.", details:"Mobile crews apps, digital inventory, and survey tools for movers." },
  { id:"supermove", name:"Supermove", category:"software", tags:["CRM","Ops"], website:"https://www.supermove.com/", summary:"Modern CRM and operations platform for movers.", details:"Scheduling, dispatch, payments and customer portal." },

  // SALES / ANSWERING / CHAT
  { id:"moneypenny", name:"Moneypenny (UK)", category:"sales", tags:["Call Answering","Chat","UK"], website:"https://www.moneypenny.com/uk/", summary:"Call answering & live chat for removals firms.", details:"Capture more enquiries 24/7 with professional receptionists.", is_featured:true },
  { id:"yomdel", name:"Yomdel Live Chat", category:"sales", tags:["Live Chat","Leads"], website:"https://www.yomdel.com/", summary:"Managed live chat to convert website visitors.", details:"Human chat teams generate qualified moving leads." },
  { id:"answer4u", name:"Answer4u", category:"sales", tags:["Call Handling"], website:"https://www.answer-4u.com/", summary:"24/7 call handling and message taking.", details:"Never miss a sales call on busy removal days." },
  { id:"talkative", name:"Talkative", category:"sales", tags:["Web Chat","Cobrowse"], website:"https://www.talkative.uk/", summary:"Web chat & video for customer sales journeys.", details:"Cobrowsing and proactive chat to boost conversions." },

  // MARKETING
  { id:"bar_marketing", name:"BAR Partner Marketing", category:"marketing", tags:["Association","UK"], website:"https://bar.co.uk/", summary:"Partner routes to reach BAR member movers.", details:"Advertising and sponsorship to the UK BAR network." },
  { id:"brightlocal", name:"BrightLocal", category:"marketing", tags:["Local SEO","Reviews"], website:"https://www.brightlocal.com/", summary:"Local SEO & review management for removals.", details:"Boost map rankings and manage Google reviews." },
  { id:"mailchimp", name:"Mailchimp", category:"marketing", tags:["Email","CRM"], website:"https://mailchimp.com/", summary:"Email marketing & simple CRM.", details:"Onboard leads and nurture quotes to booking." },
  { id:"canva", name:"Canva", category:"marketing", tags:["Design","Social"], website:"https://www.canva.com/", summary:"Quick design for quotes packs & social posts.", details:"Brand kits and templates for movers." },

  // INSURANCE
  { id:"basilfry", name:"Basil Fry & Company", category:"insurance", tags:["Broker","Removals"], website:"https://basilfry.co.uk/removals-and-storage/", summary:"Specialist insurance for removals & storage.", details:"UK market leader with claims support.", is_featured:true },
  { id:"feeds", name:"FEEDS Insurance", category:"insurance", tags:["Storage","Policy"], website:"https://www.feedsinsurance.com/", summary:"Storage container and removals insurance.", details:"Tailored cover for operators." },
  { id:"insurethatmove", name:"Insure That Move", category:"insurance", tags:["Transit","Cover"], website:"https://www.insurethatmove.co.uk/", summary:"Transit & goods-in-transit insurance.", details:"Flexible cover options for moving firms." },
  { id:"towergate", name:"Towergate Brokers", category:"insurance", tags:["Commercial","Fleet"], website:"https://www.towergate.com/", summary:"Commercial & fleet insurance.", details:"Bespoke policies for logistics and removals." },

  // EQUIPMENT / CRATES / PACKAGING
  { id:"teacrate", name:"phs Teacrate – Crate Hire", category:"equipment", tags:["Crate Hire","Nationwide"], website:"https://teacrate.co.uk/", summary:"UK-wide lidded crate rental & purchase.", details:"Fast delivery nationwide; full range of crates.", is_featured:true },
  { id:"pss_removalsupplies", name:"PSS – Removals Supplies", category:"equipment", tags:["Packaging"], website:"https://www.pssremovals.com/packing-materials", summary:"Boxes and packing materials.", details:"Trade options for removals companies." },
  { id:"rajapack", name:"RAJA UK", category:"equipment", tags:["Boxes","Tape"], website:"https://www.rajapack.co.uk/", summary:"Packaging and warehouse supplies.", details:"Bulk pricing for moving kits." },
  { id:"harcross", name:"Harcross Crate Hire", category:"equipment", tags:["Crates","Dollies"], website:"https://www.harcrosscrates.co.uk/", summary:"Crate hire and moving equipment.", details:"Skates, dollies and crates for office moves." },

  // APPS & TOOLS
  { id:"zapier", name:"Zapier", category:"apps", tags:["Automation"], website:"https://zapier.com/", summary:"Connect forms/CRM to 6,000+ apps.", details:"Automate quotes → CRM → email." },
  { id:"typeform", name:"Typeform", category:"apps", tags:["Forms"], website:"https://www.typeform.com/", summary:"Customer survey & lead forms.", details:"Great for pre-move questionnaires." },
  { id:"calendly", name:"Calendly", category:"apps", tags:["Scheduling"], website:"https://calendly.com/", summary:"Book video surveys and site visits.", details:"Reduce back-and-forth scheduling." },
  { id:"notion", name:"Notion", category:"apps", tags:["Docs","Wiki"], website:"https://www.notion.so/", summary:"Playbooks and SOPs for teams.", details:"Keep your crew handbook up-to-date." },

  // LEADS
  { id:"comparemymove", name:"Compare My Move", category:"leads", tags:["Lead Gen","UK"], website:"https://www.comparemymove.com/", summary:"Consumer marketplace for removal quotes.", details:"Pay-per-lead to fill the diary.", is_featured:true },
  { id:"reallymoving", name:"reallymoving", category:"leads", tags:["Leads","UK"], website:"https://www.reallymoving.com/", summary:"Moving leads across the UK.", details:"Domestic and international leads." },
  { id:"moveit", name:"Move It Removals Leads", category:"leads", tags:["Leads"], website:"https://www.moveitnetwork.co.uk/", summary:"Lead supply for removal companies.", details:"Flexible volumes and regions." },
  { id:"houseremovalleads", name:"House Removal Leads UK", category:"leads", tags:["Leads"], website:"https://houseremovalleads.co.uk/", summary:"Exclusive and shared removal leads.", details:"Filter by postcode and job type." },

  // MORE SOFTWARE & OPS
  { id:"smoveit", name:"Smove IT", category:"software", tags:["Ops","Inventory"], website:"https://www.smoveit.com/", summary:"Crew app & inventory management.", details:"Digital signatures, inventory photos." },
  { id:"surveybot", name:"Surveybot (Video Surveys)", category:"software", tags:["Video","Survey"], website:"https://www.surveybot.io/", summary:"Remote video pre-move surveys.", details:"Reduce travel time and qualify jobs." },
  { id:"smartmoving", name:"SmartMoving", category:"software", tags:["CRM","Scheduling"], website:"https://www.smartmoving.com/", summary:"CRM and scheduling platform.", details:"Pipeline to dispatch in one place." },
  { id:"oncue", name:"Oncue", category:"software", tags:["Sales","Follow-up"], website:"https://www.oncue.co/", summary:"Sales follow-up and booking team.", details:"Done-for-you contact centre for leads." },
  { id:"livechat", name:"LiveChat", category:"sales", tags:["Chat"], website:"https://www.livechat.com/", summary:"Live chat widget for websites.", details:"Triggers and integrations for CRM." },
];

// ---------------- Directory state / reducer ----------------
const initialState = { q: "", category: "all", tags: new Set(), onlyDiscounts: false, sort: "relevance" };
function reducer(state, action) {
  switch (action.type) {
    case "SET_QUERY": return { ...state, q: action.q };
    case "SET_CATEGORY": return { ...state, category: action.category };
    case "TOGGLE_TAG": {
      const tags = new Set(state.tags);
      tags.has(action.tag) ? tags.delete(action.tag) : tags.add(action.tag);
      return { ...state, tags };
    }
    case "TOGGLE_ONLY_DISCOUNTS": return { ...state, onlyDiscounts: !state.onlyDiscounts };
    case "SET_SORT": return { ...state, sort: action.sort };
    case "RESET_FILTERS": return { ...initialState };
    default: return state;
  }
}

// ---------------- Data Loader (Supabase if present; seeds otherwise) ----------------
function useProvidersAndCategories({ page = 1, pageSize = 60 } = {}) {
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
          supabase.from("providers").select("id,name,category_id,tags,website,summary,details,discount_label,discount_details,logo,is_active,is_featured,feature_until,tier")
            .eq("is_active", true)
            .order("is_featured", { ascending:false })
            .order("name")
            .range(from, to),
        ]);
        if (catErr) throw catErr; if (provErr) throw provErr;
        if (!mounted) return;
        const catList = cats?.length ? cats : categoriesSeed;
        setCategories(catList);
        const catMap = new Map(catList.map(c => [c.id, c.label]));
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
          logo: p.logo,
          is_featured: !!p.is_featured || (p.feature_until ? new Date(p.feature_until) > new Date() : false),
          tier: p.tier || "free",
        }));
        setProviders(mapped);
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [page, pageSize]);

  return { loading, categories, providers, error };
}

// ---------------- Pages ----------------
function Home() {
  const { providers } = useProvidersAndCategories({ pageSize: 100 });
  const featured = providers.filter(p => p.is_featured).slice(0, 6);
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
            <span>Supplier Directory</span><span aria-hidden>•</span><span>Built for UK movers</span>
          </div>
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
    if (cat && categories.find(c => c.id === cat)) dispatch({ type:"SET_CATEGORY", category:cat });
  }, [dispatch, categories]);

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
    if (state.sort === "name-asc") r.sort((a,b)=>a.name.localeCompare(b.name));
    if (state.sort === "name-desc") r.sort((a,b)=>b.name.localeCompare(a.name));
    if (state.sort === "relevance") r.sort((a,b)=> (b.is_featured?1:0) - (a.is_featured?1:0));
    return r;
  }, [state, providers]);

  const toggleFav = (id) => setFavorites(prev => { const s=new Set(prev); s.has(id)?s.delete(id):s.add(id); return Array.from(s); });
  const toggleCompare = (id) => setCompare(prev => { const s=new Set(prev); if (s.has(id)) s.delete(id); else if (s.size<3) s.add(id); return Array.from(s); });

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
              <p className="mb-3 text-sm text-gray-600">Save favorites and compare up to 3 providers side-by-side.</p>
              <div className="flex gap-2">
                <OutlineButton onClick={()=> (window.location.hash = "#favorites")}>View Favorites</OutlineButton>
                <Button onClick={()=> (window.location.hash = "#compare")}>Compare</Button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal>
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img src={getLogo(modal)} alt="" className="h-10 w-10 rounded-full object-cover border border-gray-200 bg-white"/>
                <h3 className="text-xl font-semibold text-gray-900">{modal.name}</h3>
              </div>
              <button onClick={()=>setModal(null)} className="rounded-full p-2 hover:bg-gray-100">✕</button>
            </div>
            <div className="mb-3 flex flex-wrap gap-1">
              <Badge>{modal.categoryLabel || modal.category}</Badge>
              {modal.tags?.map(t => <Badge key={t}>{t}</Badge>)}
              {modal.is_featured && <Badge color="bg-yellow-100 text-yellow-800">Featured</Badge>}
              {modal.discount && (<Badge color="bg-green-100 text-green-800">{modal.discount.label}</Badge>)}
            </div>
            <p className="mb-4 text-gray-700">{modal.details || modal.summary}</p>
            {modal.website && (
              <a href={modal.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black">Visit Website ↗</a>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Favorites({ favorites, setFavorites }) {
  const { providers } = useProvidersAndCategories({ pageSize: 100 });
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
  const { providers } = useProvidersAndCategories({ pageSize: 100 });
  const picks = providers.filter(p => compare.includes(p.id));
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Compare Providers</h2>
        <OutlineButton onClick={()=> setCompare([])}>Clear</OutlineButton>
      </div>
      {picks.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols={Math.min(3,picks.length)}">
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
  const { providers } = useProvidersAndCategories({ pageSize: 100 });
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
    { id:"the-mover", type:"magazine", title:"The Mover – UK & global industry news", href:"https://www.themover.co.uk/", blurb:"Independent news, features and insights for the moving & relocation industry." },
    { id:"bar-news", type:"article", title:"British Association of Removers – News & Guidance", href:"https://bar.co.uk/news/", blurb:"Updates from the UK’s leading removals trade association, including best practice and events." },
    { id:"movers-storers", type:"event", title:"Movers & Storers Show – UK trade expo", href:"https://moversandstorershow.com/", blurb:"The UK’s biggest removals & storage trade show with seminars and suppliers." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="mb-4 text-2xl font-bold text-gray-900">Learning Center</h2>
      <p className="mb-8 max-w-2xl text-gray-600">Interviews, how-to guides, and marketing tips to help your moving business grow.</p>
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
    if (values.honey) return;
    const last = +localStorage.getItem("last_submit_ts") || 0;
    if (Date.now() - last < 30000) { setErr("Please wait a moment before submitting again."); return; }

    try {
      if (supabase) {
        const { error } = await supabase.from("listing_submissions").insert([{
          company_name: values.name, category_id: values.category, website: values.website, description: values.description, discount: values.discount
        }]);
        if (error) throw error; setDone(true); localStorage.setItem("last_submit_ts", String(Date.now()));
      } else {
        const drafts = JSON.parse(localStorage.getItem("draft_listings") || "[]");
        drafts.push({ ...values, id: `draft-${Date.now()}` });
        localStorage.setItem("draft_listings", JSON.stringify(drafts));
        setDone(true);
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
            <div><label className="mb-1 block text-sm font-semibold text-gray-800">Website</label><TextInput type="url" placeholder="https://"
              value={values.website} onChange={(e)=>set({ ...values, website:e.target.value })}/></div>
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
        const drafts = JSON.parse(localStorage.getItem("contact_messages") || "[]");
        drafts.push({ ...values, id: `local-${Date.now()}` }); localStorage.setItem("contact_messages", JSON.stringify(drafts)); setSent(true);
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

// ---------------- App Shell ----------------
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
    <footer className="mt-20 border-t border-gray-200">
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
    </div>
  );
}
