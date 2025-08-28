// src/components/UI.jsx
import React from "react";

export const Badge = ({ children, color = "bg-gray-100 text-gray-700" }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>{children}</span>
);

export const Button = ({ as:As="button", className="", children, ...props }) => (
  <As className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm transition disabled:opacity-50 bg-gray-900 text-white hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${className}`} {...props}>{children}</As>
);

export const OutlineButton = ({ className="", children, ...props }) => (
  <button className={`inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 ${className}`} {...props}>{children}</button>
);

export const TextInput = React.forwardRef(function TextInput({ className="", ...props }, ref){
  return <input ref={ref} className={`block w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black ${className}`} {...props}/>;
});

export const TextArea = ({ className="", ...props }) => (
  <textarea className={`block w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black ${className}`} rows={6} {...props}/>
);
