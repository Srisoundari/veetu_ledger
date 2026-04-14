import { createClient } from "@supabase/supabase-js";

// Single shared Supabase client — import this everywhere instead of createClient()
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL      || "",
  import.meta.env.VITE_SUPABASE_ANON_KEY || ""
);
