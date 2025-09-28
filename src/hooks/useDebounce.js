// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// src/hooks/useInfiniteScroll.js
import { useState, useEffect, useCallback } from 'react';

export function useInfiniteScroll(callback, hasMore) {
  const [isFetching, setIsFetching] = useState(false);
  
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore]);
  
  useEffect(() => {
    if (!isFetching) return;
    fetchMoreData();
  }, [isFetching]);
  
  const handleScroll = () => {
    if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || !hasMore) {
      return;
    }
    setIsFetching(true);
  };
  
  const fetchMoreData = useCallback(async () => {
    await callback();
    setIsFetching(false);
  }, [callback]);
  
  return [isFetching, setIsFetching];
}

// src/hooks/useLazyImage.js
import { useState, useEffect, useRef } from 'react';

export function useLazyImage(src, placeholder) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState(null);
  
  useEffect(() => {
    if (!imageRef) return;
    
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(imageRef);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    observer.observe(imageRef);
    
    return () => {
      if (imageRef) observer.unobserve(imageRef);
    };
  }, [imageRef, src]);
  
  return [imageSrc, setImageRef];
}

// src/components/OptimizedProviderCard.jsx
import React, { memo } from "react";
import { Badge } from "./UI";
import { useLazyImage } from "../hooks/useLazyImage";

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23f3f4f6'/%3E%3C/svg%3E";

const OptimizedProviderCard = memo(function OptimizedProviderCard({
  p,
  onOpen,
  onToggleFav,
  isFav,
  onCompareToggle,
  comparing,
}) {
  const logoSrc = p.logo || (p.website ? 
    `https://www.google.com/s2/favicons?domain=${new URL(p.website).hostname}&sz=128` : 
    PLACEHOLDER);
  
  const [imageSrc, setImageRef] = useLazyImage(logoSrc, PLACEHOLDER);
  
  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            ref={setImageRef}
            src={imageSrc}
            loading="lazy"
            alt=""
            className="h-10 w-10 rounded-full object-cover border border-gray-200 bg-white"
          />
          <h3 className="truncate text-base font-semibold text-gray-900">
            {p.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {p.is_featured && (
            <Badge color="bg-yellow-100 text-yellow-800">Featured</Badge>
          )}
          {p.discount && (
            <Badge color="bg-green-100 text-green-800">
              {p.discount.label}
            </Badge>
          )}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1">
        <Badge>{p.categoryLabel || p.category}</Badge>
        {p.tags?.slice(0, 3).map((t) => (
          <Badge key={t}>{t}</Badge>
        ))}
      </div>

      <p className="mb-4 line-clamp-3 text-sm text-gray-600">{p.summary}</p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <button
          onClick={() => onOpen(p)}
          className="inline-flex w-full items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
        >
          Details
        </button>
      </div>

      <div className="absolute right-3 top-3 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
        <button
          title={isFav ? "Remove from favorites" : "Save to favorites"}
          onClick={onToggleFav}
          className={`rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold shadow-sm ${
            isFav ? "text-amber-700" : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          {isFav ? "★ Saved" : "☆ Save"}
        </button>
        <button
          title="Add to compare"
          onClick={onCompareToggle}
          className={`rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 ${
            comparing ? "ring-2 ring-black" : ""
          }`}
        >
          ⇄ Compare
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return prevProps.p.id === nextProps.p.id &&
         prevProps.isFav === nextProps.isFav &&
         prevProps.comparing === nextProps.comparing;
});

export default OptimizedProviderCard;

// src/components/OptimizedProvidersPage.jsx
import React, { useMemo, useReducer, useState, useCallback } from "react";
import { useDebounce } from "../hooks/useDebounce";
import OptimizedProviderCard from "./OptimizedProviderCard";
import { Badge, Button, OutlineButton, TextInput } from "./UI";

const ITEMS_PER_PAGE = 12;

function ProvidersPage({ 
  state, 
  dispatch, 
  favorites, 
  setFavorites, 
  compare, 
  setCompare 
}) {
  const { loading, categories, providers, error } = useProvidersAndCategories();
  const [modal, setModal] = useState(null);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  
  // Debounce search query
  const debouncedQuery = useDebounce(state.q, 300);
  
  const allTags = useMemo(() => {
    const s = new Set();
    providers.forEach(p => p.tags?.forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [providers]);
  
  // Filter providers with debounced query
  const results = useMemo(() => {
    let r = providers.slice();
    if (state.category !== "all") r = r.filter(p => p.category === state.category);
    if (state.onlyDiscounts) r = r.filter(p => p.discount);
    if (state.tags.size) r = r.filter(p => p.tags && p.tags.some(t => state.tags.has(t)));
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
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
  }, [state.category, state.onlyDiscounts, state.tags, debouncedQuery, state.sort, providers]);
  
  // Paginated results
  const displayedResults = useMemo(() => 
    results.slice(0, displayCount), 
    [results, displayCount]
  );
  
  const hasMore = displayCount < results.length;
  
  const loadMore = useCallback(() => {
    setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, results.length));
  }, [results.length]);
  
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
  
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h2 className="text-2xl font-bold text-gray-900">Browse Suppliers</h2>
        <div className="flex items-center gap-2">
          <OutlineButton onClick={() => dispatch({ type:"RESET_FILTERS" })}>
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
        {loading ? "Loading live data…" : 
         error ? `Using local data (error: ${error})` : 
         "Live data loaded"} • 
        Showing {displayedResults.length} of {results.length} results
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-12">
        <div className="md:col-span-9">
          {/* Search and Filter Bar */}
          <div className="sticky top-4 z-10 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row">
              <div className="relative flex-1">
                <TextInput 
                  placeholder="Search by name, feature, or tag…" 
                  value={state.q} 
                  onChange={(e) => dispatch({ type:"SET_QUERY", q:e.target.value })} 
                  aria-label="Search suppliers"
                />
                {debouncedQuery !== state.q && (
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <select 
                  value={state.category} 
                  onChange={(e) => dispatch({ type:"SET_CATEGORY", category:e.target.value })} 
                  className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <select 
                  value={state.sort} 
                  onChange={(e) => dispatch({ type:"SET_SORT", sort:e.target.value })} 
                  className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="relevance">Sort: Relevance</option>
                  <option value="name-asc">Name A→Z</option>
                  <option value="name-desc">Name Z→A</option>
                </select>
                <label className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm">
                  <input 
                    type="checkbox" 
                    checked={state.onlyDiscounts} 
                    onChange={() => dispatch({ type:"TOGGLE_ONLY_DISCOUNTS" })}
                  /> 
                  Only discounts
                </label>
              </div>
            </div>
          </div>

          {/* Provider Cards Grid */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedResults.map(p => (
              <OptimizedProviderCard
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
          
          {/* Load More Button */}
          {hasMore && (
            <div className="mt-8 text-center">
              <Button onClick={loadMore}>
                Load More ({results.length - displayCount} remaining)
              </Button>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="mt-10 rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-600">
              No results. Try different filters.
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="md:col-span-3">
          <div className="sticky top-4 space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                Filter by Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map(t => {
                  const active = state.tags.has(t);
                  return (
                    <button
                      key={t}
                      onClick={() => dispatch({ type:"TOGGLE_TAG", tag:t })}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                        active
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-gray-900">
                Need help choosing?
              </h3>
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
    </section>
  );
}

export default ProvidersPage;
