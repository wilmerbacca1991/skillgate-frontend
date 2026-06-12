const trimTrailingSlash = (value, fallback) => {
  const resolved = value && String(value).trim() ? value : fallback;
  return resolved.replace(/\/$/, '');
};

const parseCsv = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL,
  'http://localhost:5000'
);

export const SOCKET_URL = trimTrailingSlash(
  import.meta.env.VITE_SOCKET_URL,
  API_BASE_URL
);

const stunUrls = parseCsv(import.meta.env.VITE_WEBRTC_STUN_URLS);
const turnUrls = parseCsv(import.meta.env.VITE_WEBRTC_TURN_URLS);
const turnUsername = String(import.meta.env.VITE_WEBRTC_TURN_USERNAME || '').trim();
const turnCredential = String(import.meta.env.VITE_WEBRTC_TURN_CREDENTIAL || '').trim();

const defaultStunUrls = ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'];

const stunIceServer = {
  urls: stunUrls.length ? stunUrls : defaultStunUrls
};

const turnIceServer =
  turnUrls.length && turnUsername && turnCredential
    ? {
        urls: turnUrls,
        username: turnUsername,
        credential: turnCredential
      }
    : null;

export const WEBRTC_ICE_SERVERS = turnIceServer
  ? [stunIceServer, turnIceServer]
  : [stunIceServer];