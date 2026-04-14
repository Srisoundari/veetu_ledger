import { createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { clearGuestData } from "../utils/localStore";

const GUEST_KEY = "veedu_guest_user";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety net — if the SDK never fires, unblock the app after 8s
    const timeout = setTimeout(() => setLoading(false), 8000);

    // onAuthStateChange fires INITIAL_SESSION once the SDK has loaded the
    // session (and refreshed the access token if it was expired).
    // This is the correct Supabase v2 pattern — never rely on getSession()
    // for startup because it returns the cached (possibly expired) token.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          localStorage.setItem("access_token", session.access_token);
        }

        // Only unblock loading on the first event (INITIAL_SESSION).
        // Subsequent events (TOKEN_REFRESHED, SIGNED_IN, etc.) should not
        // reset loading — the app is already rendered.
        if (event === "INITIAL_SESSION") {
          if (!session?.user) {
            // No Supabase session — restore a guest session if one exists
            const stored = localStorage.getItem(GUEST_KEY);
            if (stored) setUser(JSON.parse(stored));
          }
          clearTimeout(timeout);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signInAsGuest = () => {
    const guest = { id: `guest-${crypto.randomUUID()}`, is_anonymous: true };
    localStorage.setItem(GUEST_KEY, JSON.stringify(guest));
    setUser(guest);
  };

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email, password) =>
    supabase.auth.signUp({ email, password });

  const logout = async () => {
    clearGuestData();
    localStorage.removeItem(GUEST_KEY);
    localStorage.removeItem("access_token");
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
  };

  const isGuest = user?.is_anonymous === true;

  return (
    <AuthContext.Provider
      value={{ user, loading, isGuest, signIn, signUp, signInAsGuest, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
