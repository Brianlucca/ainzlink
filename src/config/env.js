const trimTrailingSlash = (value) => value.replace(/\/+$/, '');
const normalizeApiUrl = (value) => {
  const normalized = trimTrailingSlash(value.trim());
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `${normalized.startsWith('localhost') ? 'http' : 'https'}://${normalized}`;
};

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error('VITE_API_URL não foi definida.');
}

export const env = Object.freeze({
  apiUrl: normalizeApiUrl(apiUrl),
  appUrl: trimTrailingSlash(window.location.origin),
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  },
  turnstileSiteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
});
