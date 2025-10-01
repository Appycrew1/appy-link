// src/components/ProviderCard.jsx
import React from "react";
import { Badge } from "./UI";
import { getLogo } from "../utils/getLogo";
import { sanitizeHtml } from "../utils/sanitization";

const ProviderCard = React.memo(function ProviderCard({
  p,
  onOpen,
  onToggleFav,
  isFav,
  onCompareToggle,
  comparing,
}) {
  const handleDetailsClick = React.useCallback(() => {
    onOpen(p);
  }, [onOpen, p]);

  const handleFavClick = React.useCallback((e) => {
    e.stopPropagation();
    onToggleFav(p.id);
  }, [onToggleFav, p.id]);

  const handleCompareClick = React.useCallback((e) => {
    e.stopPropagation();
    onCompareToggle(p.id);
  }, [onCompareToggle, p.id]);

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={getLogo(p)}
            alt=""
            loading="lazy"
            className="h-10 w-10 rounded-full object-cover border border-gray-200 bg-white"
            onError={(e) => {
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23e5e7eb'/%3E%3C/svg%3E";
            }}
          />
          <h3 className="truncate text-base font-semibold text-gray-900">
            {sanitizeHtml(p.name)}
          </h3>
        </div>
        
        {/* Featured/Discount badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {p.is_featured && (
            <Badge color="bg-yellow-100 text-yellow-800">
              Featured
            </Badge>
          )}
          {p.discount && (
            <Badge color="bg-green-100 text-green-800">
              {sanitizeHtml(p.discount.label)}
            </Badge>
          )}
        </div>
      </div>

      {/* Category and Tags */}
      <div className="mb-3 flex flex-wrap gap-1">
        <Badge>{sanitizeHtml(p.categoryLabel || p.category)}</Badge>
        {p.tags?.slice(0, 3).map((t) => (
          <Badge key={t}>{sanitizeHtml(t)}</Badge>
        ))}
        {p.tags?.length > 3 && (
          <Badge color="bg-gray-100 text-gray-600">
            +{p.tags.length - 3}
          </Badge>
        )}
      </div>

      {/* Summary */}
      <p className="mb-4 line-clamp-3 text-sm text-gray-600 flex-grow">
        {sanitizeHtml(p.summary)}
      </p>

      {/* Actions */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <button
          onClick={handleDetailsClick}
          className="inline-flex w-full items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 transition-colors"
          aria-label={`View details for ${p.name}`}
        >
          Details
        </button>
      </div>

      {/* Hover actions */}
      <div 
        className="absolute right-3 top-3 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100"
        role="group"
        aria-label="Quick actions"
      >
        <button
          onClick={handleFavClick}
          className={`rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold shadow-sm transition-colors ${
            isFav 
              ? "text-amber-700 border-amber-300 bg-amber-50" 
              : "text-gray-700 hover:bg-gray-50"
          }`}
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isFav}
        >
          {isFav ? "★ Saved" : "☆ Save"}
        </button>
        
        <button
          onClick={handleCompareClick}
          className={`rounded-full border bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm transition-all ${
            comparing 
              ? "ring-2 ring-black border-black bg-gray-50" 
              : "border-gray-300 hover:bg-gray-50"
          }`}
          aria-label={comparing ? "Remove from comparison" : "Add to comparison"}
          aria-pressed={comparing}
        >
          ⇄ Compare
        </button>
      </div>
    </article>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo optimization
  // Only re-render if these specific props change
  return (
    prevProps.p.id === nextProps.p.id &&
    prevProps.p.name === nextProps.p.name &&
    prevProps.p.summary === nextProps.p.summary &&
    prevProps.p.is_featured === nextProps.p.is_featured &&
    prevProps.p.discount?.label === nextProps.p.discount?.label &&
    prevProps.isFav === nextProps.isFav &&
    prevProps.comparing === nextProps.comparing &&
    prevProps.onOpen === nextProps.onOpen &&
    prevProps.onToggleFav === nextProps.onToggleFav &&
    prevProps.onCompareToggle === nextProps.onCompareToggle
  );
});

export default ProviderCard;
