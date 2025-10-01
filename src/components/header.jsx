// src/components/Header.jsx
import React, { useState, useEffect } from "react";

const BRAND = {
  name: "Appy Link",
  tagline: "Linking movers with suppliers.",
};

const NAV = [
  { label: "Home", hash: "#home", icon: "🏠" },
  { label: "Suppliers", hash: "#providers", icon: "📋" },
  { label: "Discounts", hash: "#discounts", icon: "🎯" },
  { label: "Learning Center", hash: "#learning", icon: "📚" },
  { label: "Submit Listing", hash: "#submit", icon: "➕" },
  { label: "Contact", hash: "#contact", icon: "📧" },
  { label: "Admin", hash: "#admin", icon: "⚙️" },
];

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function Header({ hash }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Close mobile menu when hash changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [hash]);
  
  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-content-center rounded-full bg-gray-900 font-black text-white">
              AL
            </div>
            <div className="text-sm font-extrabold tracking-wider text-gray-900">
              {BRAND.name}
            </div>
          </a>
          
          {/* Desktop Navigation */}
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
          
          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <a
              href="#providers"
              className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white"
            >
              Browse
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl p-2 text-gray-700 hover:bg-gray-100"
              aria-label="Open navigation menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          {/* Dark overlay */}
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          
          {/* Menu Panel */}
          <div
            className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-content-center rounded-full bg-gray-900 font-black text-white">
                  AL
                </div>
                <div className="text-sm font-extrabold tracking-wider text-gray-900">
                  {BRAND.name}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full p-2 text-gray-700 hover:bg-gray-100"
                aria-label="Close navigation menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            
            {/* Menu Items */}
            <nav className="px-4 py-6">
              <div className="space-y-1">
                {NAV.map(item => (
                  <a
                    key={item.hash}
                    href={item.hash}
                    className={classNames(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition-colors",
                      hash === item.hash
                        ? "bg-gray-900 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                    {item.hash === hash && (
                      <svg
                        className="ml-auto h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </a>
                ))}
              </div>
              
              {/* Tagline */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-600">{BRAND.tagline}</p>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
