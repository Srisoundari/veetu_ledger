import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { clearGuestData } from "../utils/localStore";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL     || "",
  import.meta.env.VITE_SUPABASE_ANON_KEY || ""
);

const GUEST_KEY = "veedu_guest_user";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Try to restore a real Supabase session
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (session?.user) {
        setUser(session.user);
        localStorage.setItem("access_token", session.access_token);
      } else {
        // 2. Fall back to a local guest session
        const stored = localStorage.getItem(GUEST_KEY);
        if (stored) setUser(JSON.parse(stored));
      }
      setLoading(false);
    }).catch(() => {
      const stored = localStorage.getItem(GUEST_KEY);
      if (stored) setUser(JSON.parse(stored));
      setLoading(false);
    });

    // Keep real Supabase sessions in sync
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        localStorage.setItem("access_token", session.access_token);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // No network call — creates a local-only guest session
  const signInAsGuest = () => {
    const guest = { id: `guest-${crypto.randomUUID()}`, is_anonymous: true };
    localStorage.setItem(GUEST_KEY, JSON.stringify(guest));
    setUser(guest);
  };

  const sendOtp   = (phone)        => supabase.auth.signInWithOtp({ phone });
  const verifyOtp = (phone, token) => supabase.auth.verifyOtp({ phone, token, type: "sms" });

  const logout = async () => {
    clearGuestData();
    localStorage.removeItem(GUEST_KEY);
    localStorage.removeItem("access_token");
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
  };

  const isGuest = user?.is_anonymous === true;

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, sendOtp, verifyOtp, signInAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

