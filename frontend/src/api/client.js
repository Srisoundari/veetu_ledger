import { supabase } from "../lib/supabase";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("access_token") || null;
}

async function request(method, path, body = null, _retry = true) {
  const token = getToken();
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new DOMException("Request timed out", "TimeoutError")),
    10_000
  );

  try {
    let res;
    try {
      res = await fetch(`${BASE_URL}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : null,
      });
    } catch (networkErr) {
      if (networkErr.name === "TimeoutError") throw new Error("Request timed out. Is the backend running?");
      throw new Error("Cannot reach the server. Is the backend running?");
    }

    // Token expired — refresh once and retry
    if (res.status === 401 && _retry) {
      const { data } = await supabase.auth.refreshSession();
      if (data.session?.access_token) {
        localStorage.setItem("access_token", data.session.access_token);
        return request(method, path, body, false);
      }
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Request failed");
    }

    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

export const http = {
  get:    (path)       => request("GET",    path),
  post:   (path, body) => request("POST",   path, body),
  patch:  (path, body) => request("PATCH",  path, body),
  delete: (path)       => request("DELETE", path),
};
