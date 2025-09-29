import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom"; 
import { createClient } from "@supabase/supabase-js";
import { Star, CheckCircle2, MapPin, Globe, Users, Shield, Heart, HeartOff, Phone, Mail, Play, Camera, Loader2 } from "lucide-react";

/**
 * Provider Profile Page for Appy Link
 * Route example: /provider?id=PROVIDER_ID
 *
 * Required tables in Supabase:
 *  - providers
 *  - provider_services
 *  - provider_media
 *  - provider_reviews
 *  - leads
 *  - favorites
 */

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Small helper UI bits
const Pill = ({ children }) => (
  <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm bg-white/60 border-black/5">
    {children}
  </span>
);

const Section = ({ title, children, right }) => (
  <section className="w-full my-6">
    <div className="mb-4 flex items-end justify-between">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {right}
    </div>
    <div className="rounded-2xl border bg-white/70 p-4 shadow-sm border-black/5">{children}</div>
  </section>
);

const Skeleton = ({ className = "h-5 w-full" }) => (
  <div className={`animate-pulse rounded-md bg-black/10 ${className}`} />
);

// Media carousel
function MediaCarousel({ items = [] }) {
  const [i, setI] = useState(0);
  if (!items.length) return <div className="aspect-video w-full bg-black/5 rounded-xl" />;

  const current = items[i];
  const next = () => setI((p) => (p + 1) % items.length);
  const prev = () => setI((p) => (p - 1 + items.length) % items.length);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl">
      {current?.type === "video" ? (
        <video src={current.url} controls className="w-full aspect-video rounded-2xl object-cover" />
      ) : (
        <img src={current.url} alt="media" className="w-full aspect-video object-cover" />
      )}
      {items.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow">‹</button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow">›</button>
        </>
      )}
    </div>
  );
}

// Stars
function Stars({ value = 0 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, idx) => (
        <Star key={idx} className={`h-4 w-4 ${idx < Math.round(value) ? "fill-yellow-400 text-yellow-400" : "text-black/20"}`} />
      ))}
      <span className="ml-2 text-sm text-black/60">{value.toFixed(1)}</span>
    </div>
  );
}

// Map placeholder
function MiniMap({ lat, lng }) {
  return (
    <div className="h-48 flex items-center justify-center bg-gradient-to-br from-blue-50 to-violet-50 rounded-xl text-sm text-black/60">
      <MapPin className="mr-2 h-5 w-5" />
      {lat && lng ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : "Service area map"}
    </div>
  );
}

// Lead form
function LeadForm({ providerId, providerName, onSent }) {
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({ name: "", email: "", phone: "", details: "" });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("leads").insert([{ provider_id: providerId, ...values }]);
    setLoading(false);
    if (error) alert(error.message);
    else onSent?.();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input placeholder="Name" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} required className="w-full p-2 border rounded-xl" />
      <input placeholder="Email" type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} required className="w-full p-2 border rounded-xl" />
      <input placeholder="Phone" value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} className="w-full p-2 border rounded-xl" />
      <textarea placeholder="Details" rows={3} value={values.details} onChange={(e) => setValues({ ...values, details: e.target.value })} className="w-full p-2 border rounded-xl" />
      <button type="submit" disabled={loading} className="w-full py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-xl">
        {loading ? "Sending..." : "Request a Quote"}
      </button>
    </form>
  );
}

// Reviews
function Reviews({ reviews = [] }) {
  if (!reviews.length) return <div className="text-black/60">No reviews yet.</div>;
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="border rounded-xl p-3">
          <Stars value={r.rating || 0} />
          <p><strong>{r.author || "Customer"}:</strong> {r.body}</p>
        </div>
      ))}
    </div>
  );
}

// Favorite button
function FavoriteButton({ providerId, session }) {
  const [favId, setFavId] = useState(null);
  useEffect(() => {
    (async () => {
      if (!session) return;
      const { data } = await supabase.from("favorites").select("id").eq("provider_id", providerId).eq("user_id", session.user.id).maybeSingle();
      setFavId(data?.id || null);
    })();
  }, [providerId, session]);

  const toggle = async () => {
    if (!session) return alert("Please sign in");
    if (favId) {
      await supabase.from("favorites").delete().eq("id", favId);
      setFavId(null);
    } else {
      const { data } = await supabase.from("favorites").insert([{ provider_id: providerId, user_id: session.user.id }]).select("id").single();
      setFavId(data.id);
    }
  };

  return <button onClick={toggle} className="border rounded-xl px-3 py-1">{favId ? "Saved" : "Save"}</button>;
}

// Main Page
export default function ProviderProfilePage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [media, setMedia] = useState([]);
  const [reviews, setReviews] = useState([]);

  const location = useLocation();
const providerId = useMemo(() => {
  // With HashRouter, location.search contains "?id=..." correctly
  return new URLSearchParams(location.search).get("id");
}, [location.search]);


  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    (async () => {
      if (!providerId) return setLoading(false);
      const [{ data: p }, { data: s }, { data: m }, { data: r }] = await Promise.all([
        supabase.from("providers").select("*").eq("id", providerId).single(),
        supabase.from("provider_services").select("*").eq("provider_id", providerId),
        supabase.from("provider_media").select("*").eq("provider_id", providerId).order("sort"),
        supabase.from("provider_reviews").select("*").eq("provider_id", providerId).order("created_at", { ascending: false }),
      ]);
      setProvider(p); setServices(s || []); setMedia(m || []); setReviews(r || []); setLoading(false);
    })();
    return () => sub.subscription.unsubscribe();
  }, [providerId]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!provider) return <div className="p-6">Provider not found</div>;

  const rating = reviews.length ? reviews.reduce((a, b) => a + (b.rating || 0), 0) / reviews.length : 0;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        {provider.logo_url && <img src={provider.logo_url} alt={provider.name} className="h-16 w-16 rounded-xl object-cover" />}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">{provider.name} {provider.verified && <CheckCircle2 className="text-green-500 h-5 w-5" />}</h1>
          <Stars value={rating} />
        </div>
      </div>

      <MediaCarousel items={media} />
      <Section title="About"><p>{provider.description}</p></Section>
      <Section title="Services">{services.map((s) => <div key={s.id}>{s.label}</div>)}</Section>
      <Section title="Reviews"><Reviews reviews={reviews} /></Section>
      <Section title="Contact"><LeadForm providerId={provider.id} providerName={provider.name} onSent={() => alert("Submitted")} /></Section>
      <FavoriteButton providerId={provider.id} session={session} />
    </div>
  );
}
