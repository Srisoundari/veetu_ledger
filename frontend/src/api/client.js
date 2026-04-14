const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Read token synchronously from localStorage — no network call
function getToken() {
  // Try our manually stored key first (set by AuthContext on sign in)
  const manual = localStorage.getItem("access_token");
  if (manual) return manual;

  // Fall back to Supabase's own session key
  const url = import.meta.env.VITE_SUPABASE_URL || "";
  const ref = url.split("//")[1]?.split(".")[0];
  if (ref) {
    try {
      const raw = localStorage.getItem(`sb-${ref}-auth-token`);
      if (raw) return JSON.parse(raw).access_token;
    } catch {}
  }
  return null;
}

async function request(method, path, body = null) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }

  return res.json();
}

export const http = {
  get:    (path)        => request("GET",    path),
  post:   (path, body)  => request("POST",   path, body),
  patch:  (path, body)  => request("PATCH",  path, body),
  delete: (path)        => request("DELETE", path),
};
