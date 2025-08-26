import React, { useEffect, useMemo, useReducer, useState } from "react";

/**
 * Appy Link – Linking movers with suppliers (UK)
 * -------------------------------------------------
 * Production‑ready single‑file React app with Supabase wiring.
 * - Reads providers + categories from Supabase if env is set, else falls back to seed.
 * - Submits "Submit a Listing" and "Contact" to Supabase tables if available.
 * - Keeps Favorites/Compare locally.
 *
 * ENV (add in Vercel > Settings > Environment Variables):
 *  - VITE_SUPABASE_URL
 *  - VITE_SUPABASE_ANON_KEY
 *
 * DATABASE (Supabase SQL – see bottom of this file for schema block you can run):
 *  - public.categories
 *  - public.providers
 *  - public.listing_submissions
 *  - public.contact_messages
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
  const push = (next) => (window.location.hash = next);
  return [hash, push];
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
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue];
}

/***********************************\
|*         SUPABASE CLIENT         *|
\***********************************/
import { createClient } from "@supabase/supabase-js";

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

// UK supplier seed (used if Supabase not configured or empty)
const providersSeed = [
  // SOFTWARE & CRM
  {
    id: "moveman",
    name: "MoveMan",
    category: "software",
    tags: ["UK", "CRM", "Operations"],
    website: "https://www.movemanpro.com/",
    summary: "Removals management software widely used in the UK; quoting, scheduling, dispatch & storage.",
    details: "MoveMan has been supplied to the removals industry since the 1990s and is a leading UK provider supporting hundreds of companies.",
  },
  {
    id: "moveware",
    name: "Moveware",
    category: "software",
    tags: ["ERP", "CRM", "Accounting"],
    website: "https://www.moveconnect.com/",
    summary: "Complete move management and financial solution (ERP/CRM) used by moving & storage companies worldwide.",
    details: "Moveware helps teams manage the entire move lifecycle, from sales to operations to integrated accounting and reporting.",
  },
  {
    id: "move4u",
    name: "Move4U",
    category: "software",
    tags: ["Apps", "Virtual Survey", "Inventory"],
    website: "https://move4u.com/",
    summary: "Suite of digital tools for movers, including virtual video surveys, inventory apps and claims handling.",
    details: "Move4U provides applications like SurveyVideo for remote estimates and other workflow tools to digitise the moving process.",
  },
  {
    id: "imve",
    name: "i-mve",
    category: "software",
    tags: ["CRM", "Storage", "UK"],
    website: "https://www.i-mve.com/",
    summary: "CRM & storage platform focused on UK removals operators to convert leads into bookings and invoices.",
    details: "A UK‑oriented CRM and storage platform designed to help removals companies manage enquiries, jobs and billing.",
  },

  // MARKETING
  { id: "birdmarketing", name: "Bird Marketing – Moving Company SEO", category: "marketing", tags: ["SEO", "PPC", "Web"], website: "https://bird.co.uk/moving-company/", summary: "Award‑winning UK agency pages dedicated to removals companies: SEO, PPC and conversion‑focused web.", details: "Tailored campaigns for UK movers to increase enquiries and rankings across local markets." },
  { id: "artemis", name: "Artemis – SEO for Removals", category: "marketing", tags: ["SEO", "Content"], website: "https://artemis.marketing/about-us/businesses/removal-companies/", summary: "Ethical, effective SEO for removal companies with sector experience in the UK.", details: "Visibility and lead growth for local and national movers via technical SEO and content." },
  { id: "oym", name: "Outsource Your Marketing", category: "marketing", tags: ["SEO", "PPC", "Web"], website: "https://www.outsourceyourmarketing.co.uk/seo-for-removal-companies/", summary: "UK digital marketing for removal firms: web design, SEO and PPC to boost enquiries.", details: "Full‑funnel support for movers including website builds and ongoing campaigns." },
  { id: "removalsmarketing", name: "RemovalsMarketing.co.uk", category: "marketing", tags: ["Marketing", "SEO", "Consulting"], website: "https://www.removalsmarketing.co.uk/", summary: "Specialist marketing support dedicated to removals, man & van and moving companies.", details: "Founded by movers to help movers with practical marketing execution." },

  // SALES (answering & chat)
  { id: "moneypenny", name: "Moneypenny (UK)", category: "sales", tags: ["Call Answering", "Live Chat", "UK"], website: "https://www.moneypenny.com/uk/", summary: "UK market‑leading telephone answering and live chat reception to capture enquiries and book appointments.", details: "Professional receptionists handle calls and chats, overflow or 24/7 options, and appointment booking." },
  { id: "answerforce", name: "AnswerForce UK", category: "sales", tags: ["24/7", "Virtual Reception", "Bookings"], website: "https://www.answerforce.com/uk", summary: "24/7 call answering and web chat for home‑services businesses, with appointment booking.", details: "Virtual receptionists answer, qualify and schedule enquiries around the clock." },
  { id: "yomdel", name: "Yomdel – Live Chat for Removals", category: "sales", tags: ["Live Chat", "Lead Capture", "BAR Affiliate"], website: "https://www.yomdel.com/removals", summary: "Managed live chat specialists for the removals sector; increase website leads and out‑of‑hours capture.", details: "Approved BAR affiliate providing 24/7 rapid response, qualification and appointment booking." },

  // INSURANCE
  { id: "basilfry", name: "Basil Fry & Company", category: "insurance", tags: ["Broker", "Removals", "Storage"], website: "https://basilfry.co.uk/removals-and-storage/", summary: "Specialist insurance broking, risk management and claims handling for removals and storage.", details: "Leading UK provider with bespoke cover for movers, storage, and self‑storage operators." },
  { id: "reasonglobal", name: "Reason Global Insurance", category: "insurance", tags: ["Broker", "Transit", "Liability"], website: "https://www.reason-global.com/", summary: "UK insurance experts for the moving, self‑storage and relocation industries.", details: "Transit & storage cover for customers’ goods plus contractual & legal liability protection." },

  // APPS & TOOLS
  { id: "what3words", name: "what3words – Logistics", category: "apps", tags: ["Location", "Delivery", "API"], website: "https://what3words.com/business/logistics", summary: "3‑word addressing to pinpoint pickup/drop‑off locations precisely; integrations with UK carriers.", details: "Improve route accuracy by capturing a what3words address on quotes, surveys and job sheets." },
  { id: "loqate", name: "Loqate – Address Verification", category: "apps", tags: ["PAF", "Postcode Lookup", "Forms"], website: "https://www.loqate.com/en-gb/address-verification/postcode-lookup/", summary: "Royal Mail PAF‑powered postcode lookup to capture clean addresses in quotes and bookings.", details: "Real‑time UK address verification to reduce failed deliveries and admin rework." },
  { id: "gocardless", name: "GoCardless – Direct Debit", category: "apps", tags: ["Payments", "Direct Debit", "UK"], website: "https://gocardless.com/small-business/", summary: "Collect deposits & recurring payments via bank, integrated with leading accounting tools.", details: "Set up Direct Debit mandates online and automate invoice collection for storage or monthly plans." },
  { id: "xero", name: "Xero Accounting (UK)", category: "apps", tags: ["Accounting", "Invoices", "VAT"], website: "https://www.xero.com/uk/accounting-software/", summary: "Cloud accounting for UK SMEs; invoices, bank feeds, VAT & app integrations.", details: "Use with GoCardless and your CRM to reconcile payments and track cash flow." },

  // LEADS
  { id: "comparemymove", name: "Compare My Move – Partner Leads", category: "leads", tags: ["Leads", "Removal", "UK"], website: "https://www.comparemymove.com/partners/removals", summary: "UK removals lead generation; join the partner network for real‑time local leads.", details: "Free to join, no commission; manage postcodes and lead flow in their portal." },
  { id: "reallymoving", name: "reallymoving – Removals Leads", category: "leads", tags: ["Leads", "Instant Quotes", "UK"], website: "https://www.reallymoving.com/become-a-partner/removals-enquiry", summary: "Established since 1999; instant quotes platform generating high‑quality removals leads.", details: "Trial available with real‑time leads and a directory page with reviews." },
  { id: "getamover", name: "Getamover – Advertise Your Company", category: "leads", tags: ["Leads", "Pay‑per‑lead", "UK"], website: "https://www.getamover.co.uk/companies/", summary: "Pay only for qualified leads; flexible postcode and volume controls.", details: "Large UK partner base; trial periods available to test performance." },
  { id: "moveralerts", name: "MoverAlerts – Homemover Data", category: "leads", tags: ["Data", "Direct Mail", "UK"], website: "https://www.moveralerts.co.uk/", summary: "Address‑level homemover data covering most of the UK market for direct mail campaigns.", details: "Target addresses by postcode stage to time your outreach when people are moving." },
  { id: "bark", name: "Bark – Marketplace", category: "leads", tags: ["Marketplace", "Leads"], website: "https://www.bark.com/en/gb/sellers/create/", summary: "General UK marketplace where you pay per lead; set categories for house removals.", details: "Useful for additional volume; monitor quality and ROI." },

  // EQUIPMENT & SUPPLIES
  { id: "teacrate", name: "phs Teacrate – Crate Hire", category: "equipment", tags: ["Crate Hire", "Nationwide", "UK"], website: "https://teacrate.co.uk/", summary: "UK‑wide rental and purchase of lidded removal crates for home & office moves.", details: "Largest UK crate hire provider with fast delivery and multiple crate options." },
  { id: "simpsonpackaging", name: "Simpson Packaging", category: "equipment", tags: ["Packaging", "Wardrobe Cartons", "Nationwide"], website: "https://www.simpson-packaging.co.uk/", summary: "Leading UK supplier of removals packaging materials, handling equipment and workwear.", details: "From wardrobe cartons to protective materials with nationwide distribution." },
  { id: "transpack", name: "Transpack", category: "equipment", tags: ["Boxes", "Protective", "Wholesale"], website: "https://www.transpack.co.uk/", summary: "Family‑run UK wholesaler of boxes, protective packaging and polythene, with eco options.", details: "Bulk buy moving boxes and packing supplies with next‑day delivery options." },
  { id: "raja", name: "RAJA UK", category: "equipment", tags: ["Boxes", "Wardrobe Cartons", "Next‑day"], website: "https://www.rajapack.co.uk/", summary: "Extensive range of removal boxes and packing materials with next‑day delivery.", details: "Double‑wall cartons, wardrobe boxes and warehouse supplies for removals operations." },
  { id: "kitepackaging", name: "Kite Packaging – Removals Range", category: "equipment", tags: ["Boxes", "Removal Supplies", "Trade"], website: "https://www.kitepackaging.co.uk/scp/removals-packaging/removals-boxes/", summary: "Heavy‑duty removals boxes and wardrobe cartons designed for trade use.", details: "Equip removal teams with durable packaging and accessories in one place." },
];

/***********************************\
|*        STATE & REDUCER          *|
\***********************************/
const initialState = {
  q: "",
  category: "all",
  tags: new Set(),
  onlyDiscounts: false,
  sort: "relevance", // 'name-asc' | 'name-desc'
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
      return { ...initialState };
    default:
      return state;
  }
}

/***********************************\
|*          SMALL COMPONENTS        *|
\***********************************/
const Badge = ({ children, color = "bg-gray-100 text-gray-700" }) => (
  <span className={classNames("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", color)}>
    {children}
  </span>
);

const Button = ({ as: As = "button", className = "", children, ...props }) => (
  <As
    className={classNames(
      "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm transition disabled:opacity-50",
      "bg-gray-900 text-white hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black",
      className
    )}
    {...props}
  >
    {children}
  </As>
);

const OutlineButton = ({ className = "", children, ...props }) => (
  <button
    className={classNames(
      "inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50",
      className
    )}
    {...props}
  >
    {children}
  </button>
);

const TextInput = React.forwardRef(function TextInput(
  { className = "", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={classNames(
        "block w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm placeholder-gray-400",
        "focus:outline-none focus:ring-2 focus:ring-black",
        className
      )}
      {...props}
    />
  );
});

const TextArea = ({ className = "", ...props }) => (
  <textarea
    className={classNames(
      "block w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm placeholder-gray-400",
      "focus:outline-none focus:ring-2 focus:ring-black",
      className
    )}
    rows={6}
    {...props}
  />
);

/***********************************\
|*        PROVIDER COMPONENTS       *|
\***********************************/
const ProviderCard = ({ p, onOpen, onToggleFav, isFav, onCompareToggle, comparing }) => (
  <div className="group relative flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
    <div className="mb-3 flex items-start justify-between gap-3">
      <h3 className="text-base font-semibold text-gray-900">{p.name}</h3>
      {p.discount && (
        <Badge color="bg-green-100 text-green-800">{p.discount.label}</Badge>
      )}
    </div>
    <div className="mb-3 flex flex-wrap gap-1">
      <Badge>{(p.categoryLabel) || p.category}</Badge>
      {p.tags?.slice(0, 3).map((t) => (
        <Badge key={t}>{t}</Badge>
      ))}
    </div>
    <p className="mb-4 line-clamp-3 text-sm text-gray-600">{p.summary}</p>

    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
      <OutlineButton onClick={() => onOpen(p)} className="w-full">Details</OutlineButton>
    </div>

    <div className="absolute right-3 top-3 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
      <button
        title={isFav ? "Remove from favorites" : "Save to favorites"}
        onClick={onToggleFav}
        className={classNames(
          "rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold shadow-sm",
          isFav ? "text-amber-700" : "text-gray-700 hover:bg-gray-50"
        )}
      >
        {isFav ? "★ Saved" : "☆ Save"}
      </button>
      <button
        title="Add to compare"
        onClick={onCompareToggle}
        className={classNames(
          "rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50",
          comparing ? "ring-2 ring-black" : ""
        )}
      >
        ⇄ Compare
      </button>
    </div>
  </div>
);

const ProviderModal = ({ provider, onClose }) => {
  if (!provider) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{provider.name}</h3>
            <div className="mt-1 flex flex-wrap gap-1">
              <Badge>{provider.categoryLabel}</Badge>
              {provider.tags?.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
              {provider.discount && (
                <Badge color="bg-green-100 text-green-800">{provider.discount.label}</Badge>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">✕</button>
        </div>
        <p className="mb-4 text-gray-700">{provider.details || provider.summary}</p>
        {provider.website && (
          <a
            href={provider.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black"
          >
            Visit Website ↗
          </a>
        )}
      </div>
    </div>
  );
};

/***********************************\
|*             PAGES               *|
\***********************************/
function Home() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
            <span>Supplier Directory</span>
            <span aria-hidden>•</span>
            <span>Built for UK movers</span>
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">
            {BRAND.tagline}
          </h1>
          <p className="mt-4 max-w-xl text-gray-600">
            Browse vetted UK providers, compare options, and claim partner discounts. Submit your listing in minutes.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => (window.location.hash = "#providers")}>{BRAND.ctaPrimary}</Button>
            <OutlineButton onClick={() => (window.location.hash = "#submit")}>
              {BRAND.ctaSecondary}
            </OutlineButton>
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

const Stat = ({ kpi, label, dim = false }) => (
  <div>
    <div className={classNames("text-2xl font-extrabold", dim ? "text-gray-400" : "text-gray-900")}>{kpi}</div>
    <div className="text-sm text-gray-600">{label}</div>
  </div>
);

function useProvidersAndCategories() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(categoriesSeed);
  const [providers, setProviders] = useState(providersSeed);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const [{ data: cats, error: catErr }, { data: provs, error: provErr }] = await Promise.all([
          supabase.from("categories").select("id,label").order("label"),
          supabase.from("providers").select("id,name,category_id,tags,website,summary,details,discount_label,discount_details,is_active").eq("is_active", true).order("name"),
        ]);
        if (catErr) throw catErr;
        if (provErr) throw provErr;
        if (mounted) {
          const catMap = new Map((cats?.length ? cats : categoriesSeed).map((c) => [c.id, c.label]));
          setCategories(cats?.length ? cats : categoriesSeed);
          const mapped = (provs?.length ? provs : providersSeed).map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category_id || p.category,
            categoryLabel: catMap.get(p.category_id || p.category) || p.categoryLabel,
            tags: p.tags || [],
            website: p.website,
            summary: p.summary,
            details: p.details,
            discount: p.discount_label ? { label: p.discount_label, details: p.discount_details } : p.discount || null,
          }));
          setProviders(mapped);
        }
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { loading, categories, providers, error };
}

function Providers({ state, dispatch, favorites, setFavorites, compare, setCompare }) {
  const { loading, categories, providers, error } = useProvidersAndCategories();
  const [modal, setModal] = useState(null);

  const allTags = useMemo(() => {
    const s = new Set();
    providers.forEach((p) => p.tags?.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [providers]);

  // Pre-filter by URL param cat
  useEffect(() => {
    const params = new URLSearchParams((window.location.hash.split("?")[1] || ""));
    const cat = params.get("cat");
    if (cat && categories.find((c) => c.id === cat)) {
      dispatch({ type: "SET_CATEGORY", category: cat });
    }
  }, [dispatch, categories]);

  const results = useMemo(() => {
    let r = providers.slice();

    if (state.category !== "all") r = r.filter((p) => p.category === state.category);

    if (state.onlyDiscounts) r = r.filter((p) => p.discount);

    if (state.tags.size) {
      r = r.filter((p) => p.tags && p.tags.some((t) => state.tags.has(t)));
    }

    if (state.q.trim()) {
      const q = state.q.toLowerCase();
      r = r.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.summary?.toLowerCase().includes(q) ||
          p.details?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (state.sort === "name-asc") r.sort((a, b) => a.name.localeCompare(b.name));
    if (state.sort === "name-desc") r.sort((a, b) => b.name.localeCompare(a.name));

    return r;
  }, [state, providers]);

  const toggleFav = (id) => {
    setFavorites((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return Array.from(s);
    });
  };

  const toggleCompare = (id) => {
    setCompare((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else if (s.size < 3) s.add(id);
      return Array.from(s);
    });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h2 className="text-2xl font-bold text-gray-900">Browse Suppliers</h2>
        <div className="flex items-center gap-2">
          <OutlineButton onClick={() => dispatch({ type: "RESET_FILTERS" })}>Reset</OutlineButton>
          <OutlineButton onClick={() => (window.location.hash = "#favorites")}>Favorites ({favorites.length})</OutlineButton>
          <Button onClick={() => (window.location.hash = "#compare")}>
            Compare ({compare.length}/3)
          </Button>
        </div>
      </div>

      <div className="mb-2 text-sm text-gray-500">
        {loading ? "Loading live data…" : error ? `Using local data (error: ${error})` : "Live data loaded"}
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-12">
        <div className="md:col-span-9">
          <div className="sticky top-4 z-10 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row">
              <div className="relative flex-1">
                <TextInput
                  placeholder="Search by name, feature, or tag…"
                  value={state.q}
                  onChange={(e) => dispatch({ type: "SET_QUERY", q: e.target.value })}
                  aria-label="Search suppliers"
                />
                <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 sm:block">🔎</div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <select
                  value={state.category}
                  onChange={(e) => dispatch({ type: "SET_CATEGORY", category: e.target.value })}
                  className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  aria-label="Filter by category"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
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
            {results.map((p) => (
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
                {allTags.map((t) => {
                  const active = state.tags.has(t);
                  return (
                    <button
                      key={t}
                      onClick={() => dispatch({ type: "TOGGLE_TAG", tag: t })}
                      className={classNames(
                        "rounded-full border px-3 py-1 text-xs font-semibold",
                        active
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Need help choosing?</h3>
              <p className="mb-3 text-sm text-gray-600">
                Save favorites and compare up to 3 providers side-by-side.
              </p>
              <div className="flex gap-2">
                <OutlineButton onClick={() => (window.location.hash = "#favorites")}>
                  View Favorites
                </OutlineButton>
                <Button onClick={() => (window.location.hash = "#compare")}>
                  Compare
                </Button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <ProviderModal provider={modal} onClose={() => setModal(null)} />
    </section>
  );
}

function Favorites({ favorites, setFavorites }) {
  const { providers } = useProvidersAndCategories();
  const favs = providers.filter((p) => favorites.includes(p.id));
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Your Favorites</h2>
        <OutlineButton onClick={() => setFavorites([])}>Clear All</OutlineButton>
      </div>
      {favs.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favs.map((p) => (
            <ProviderCard
              key={p.id}
              p={p}
              onOpen={() => {}}
              onToggleFav={() =>
                setFavorites((prev) => prev.filter((id) => id !== p.id))
              }
              isFav={true}
              onCompareToggle={() => {}}
              comparing={false}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-600">
          No favorites yet. Save providers to build your shortlist.
        </div>
      )}
    </section>
  );
}

function Compare({ compare, setCompare }) {
  const { providers } = useProvidersAndCategories();
  const picks = providers.filter((p) => compare.includes(p.id));
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Compare Providers</h2>
        <OutlineButton onClick={() => setCompare([])}>Clear</OutlineButton>
      </div>
      {picks.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {picks.map((p) => (
            <div key={p.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold">{p.name}</h3>
                {p.discount && (<Badge color="bg-green-100 text-green-800">{p.discount.label}</Badge>)}
              </div>
              <div className="mb-3 text-xs text-gray-600">{p.categoryLabel}</div>
              <p className="mb-3 text-sm text-gray-700">{p.summary}</p>
              <ul className="mb-4 list-disc pl-5 text-sm text-gray-700">
                {(p.tags || []).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              {p.website && (
                <a
                  href={p.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black"
                >
                  Visit ↗
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-600">
          Add up to 3 providers from the directory to compare here.
        </div>
      )}
    </section>
  );
}

function Discounts() {
  const { providers } = useProvidersAndCategories();
  const discounted = providers.filter((p) => p.discount);
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Discount Partners</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {discounted.map((p) => (
          <div key={p.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-gray-900">{p.name}</h3>
              <Badge color="bg-green-100 text-green-800">{p.discount?.label}</Badge>
            </div>
            <p className="mb-4 text-sm text-gray-600">{p.summary}</p>
            <a
              href={p.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              Redeem / Learn More ↗
            </a>
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
        {learningSeed.map((i) => (
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
    e.preventDefault();
    setErr("");
    try {
      if (supabase) {
        const { error } = await supabase.from("listing_submissions").insert([
          {
            company_name: values.name,
            category_id: values.category,
            website: values.website,
            description: values.description,
            discount: values.discount,
          },
        ]);
        if (error) throw error;
        setDone(true);
      } else {
        const drafts = JSON.parse(localStorage.getItem("draft_listings") || "[]");
        drafts.push({ ...values, id: `draft-${Date.now()}` });
        localStorage.setItem("draft_listings", JSON.stringify(drafts));
        setDone(true);
      }
    } catch (e) {
      console.error(e);
      setErr(e.message || "Submission failed");
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Submit A Listing</h2>
      {done ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-green-900">
          <div className="mb-2 text-lg font-semibold">Thanks! Your listing was submitted.</div>
          <p className="text-sm">We’ll review and publish if approved.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {err && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">Company Name</label>
            <TextInput value={values.name} onChange={(e) => set({ ...values, name: e.target.value })} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-800">Category</label>
              <select
                className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm"
                value={values.category}
                onChange={(e) => set({ ...values, category: e.target.value })}
              >
                {categoriesSeed.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-800">Website</label>
              <TextInput type="url" placeholder="https://" value={values.website} onChange={(e) => set({ ...values, website: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">Short Description</label>
            <TextArea value={values.description} onChange={(e) => set({ ...values, description: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">Discount (optional)</label>
            <TextInput placeholder="e.g., 50% off second month" value={values.discount} onChange={(e) => set({ ...values, discount: e.target.value })} />
          </div>
          <div className="pt-2">
            <Button type="submit">Submit Listing</Button>
          </div>
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
    e.preventDefault();
    setErr("");
    try {
      if (supabase) {
        const { error } = await supabase.from("contact_messages").insert([
          { name: values.name, email: values.email, message: values.message },
        ]);
        if (error) throw error;
        setSent(true);
      } else {
        // Fallback: local save
        const drafts = JSON.parse(localStorage.getItem("contact_messages") || "[]");
        drafts.push({ ...values, id: `local-${Date.now()}` });
        localStorage.setItem("contact_messages", JSON.stringify(drafts));
        setSent(true);
      }
    } catch (e) {
      console.error(e);
      setErr(e.message || "Could not send message");
    }
  };
  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Contact Us</h2>
      {sent ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-green-900">
          <div className="mb-2 text-lg font-semibold">Message sent!</div>
          <p className="text-sm">We will reply to your email shortly.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {err && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">Name</label>
            <TextInput value={values.name} onChange={(e) => set({ ...values, name: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">Email</label>
            <TextInput type="email" value={values.email} onChange={(e) => set({ ...values, email: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">Message</label>
            <TextArea value={values.message} onChange={(e) => set({ ...values, message: e.target.value })} required />
          </div>
          <div className="pt-2">
            <Button type="submit">Send Message</Button>
          </div>
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
          <div className="grid h-8 w-8 place-content-center rounded-xl bg-gray-900 font-black text-white">AL</div>
          <div className="text-sm font-extrabold tracking-wider text-gray-900">{BRAND.name}</div>
        </a>
        <nav className="hidden items-center gap-2 md:flex">
          {NAV.map((item) => (
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
          <a href="#providers" className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white">Browse</a>
        </div>
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
            <div className="grid h-8 w-8 place-content-center rounded-xl bg-gray-900 font-black text-white">AL</div>
            <div className="text-sm font-extrabold tracking-wider text-gray-900">{BRAND.name}</div>
          </div>
          <p className="text-sm text-gray-600 max-w-sm">
            {BRAND.tagline}
          </p>
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
          <div className="flex gap-2">
            <TextInput placeholder="you@company.com" className="flex-1" />
            <Button>Subscribe</Button>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
      </div>
    </footer>
  );
}

export default function App() {
  const [hash, push] = useHashRoute("#home");
  const [state, dispatch] = useReducer(reducer, initialState);
  const [favorites, setFavorites] = useLocalStorage("favorites_providers", []);
  const [compare, setCompare] = useLocalStorage("compare_providers", []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <Header hash={hash || "#home"} />

      {(!hash || hash === "#home") && (
        <section>
          <Home />
          <section className="mx-auto mt-6 max-w-7xl px-4">
            <dl className="grid w-full grid-cols-2 gap-6 sm:max-w-xl">
              <Stat kpi="7" label="Core Categories" />
              <Stat kpi=">25" label="UK Providers" />
              <Stat kpi="Compare" label="Select up to 3" />
              <Stat kpi="Favorites" label="Saved locally" />
            </dl>
          </section>
        </section>
      )}
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
      {hash === "#favorites" && <Favorites favorites={favorites} setFavorites={setFavorites} />}
      {hash === "#compare" && <Compare compare={compare} setCompare={setCompare} />}
      {hash === "#discounts" && <Discounts />}
      {hash === "#learning" && <LearningCenter />}
      {hash === "#submit" && <SubmitListing />}
      {hash === "#contact" && <Contact />}

      <Footer />

      {/* ---- SUPABASE SCHEMA (paste into Supabase SQL editor) ----

      -- Categories
      create table if not exists public.categories (
        id text primary key,
        label text not null
      );

      -- Providers
      create table if not exists public.providers (
        id uuid primary key default gen_random_uuid(),
        name text not null,
        category_id text references public.categories(id) not null,
        tags text[] default '{}',
        website text,
        summary text,
        details text,
        discount_label text,
        discount_details text,
        is_active boolean default true,
        created_at timestamp with time zone default now()
      );

      -- Public listing submissions
      create table if not exists public.listing_submissions (
        id uuid primary key default gen_random_uuid(),
        company_name text not null,
        category_id text not null,
        website text,
        description text,
        discount text,
        created_at timestamp with time zone default now()
      );

      -- Contact messages
      create table if not exists public.contact_messages (
        id uuid primary key default gen_random_uuid(),
        name text not null,
        email text not null,
        message text not null,
        created_at timestamp with time zone default now()
      );

      alter table public.categories enable row level security;
      alter table public.providers enable row level security;
      alter table public.listing_submissions enable row level security;
      alter table public.contact_messages enable row level security;

      create policy "Anyone can read providers"
      on public.providers for select using (true);

      create policy "Anyone can read categories"
      on public.categories for select using (true);

      create policy "Anon can insert listing submissions"
      on public.listing_submissions for insert using (true) with check (true);

      create policy "Anon can insert contact messages"
      on public.contact_messages for insert using (true) with check (true);

      insert into public.categories (id,label) values
      ('marketing','Marketing / Advertising'),
      ('software','Moving Software & CRM'),
      ('sales','Moving Sales Solutions'),
      ('insurance','Moving Insurance'),
      ('apps','Apps & Online Tools'),
      ('leads','Moving Leads'),
      ('equipment','Moving Equipment')
      on conflict (id) do nothing;

      */}
  </div>
  );
}
