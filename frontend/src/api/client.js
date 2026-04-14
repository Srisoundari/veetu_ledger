import { createClient } from "@supabase/supabase-js";

const _supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL     || "",
  import.meta.env.VITE_SUPABASE_ANON_KEY || ""
);

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Always get a fresh token directly from Supabase session
async function getToken() {
  const { data } = await _supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function request(method, path, body = null) {
  const token = await getToken();
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
