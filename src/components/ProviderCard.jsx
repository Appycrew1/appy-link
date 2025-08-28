// src/components/ProviderCard.jsx
import React from "react";
import { Badge } from "./UI";
import { getLogo } from "../utils/getLogo";

export default function ProviderCard({
  p,
  onOpen,
  onToggleFav,
  isFav,
  onCompareToggle,
  comparing,
}) {
  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={getLogo(p)}
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
}

