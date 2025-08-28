// src/utils/getLogo.js
export function getLogo(provider = {}) {
  if (provider.logo) return provider.logo;
  if (provider.logo_url) return provider.logo_url;
  try {
    const u = new URL(provider.website || "");
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=128`;
  } catch {
    return `https://www.google.com/s2/favicons?domain=example.com&sz=128`;
  }
}
