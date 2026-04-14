import { useState, useEffect } from "react";
import { householdsApi } from "../api/households.api";

export function useHousehold(user) {
  const [household, setHousehold] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await householdsApi.me();
      setHousehold(data?.households ?? null);
    } catch {
      setHousehold(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
    else { setHousehold(null); setLoading(false); }
  }, [user]);

  const create = async (name) => {
    const h = await householdsApi.create(name);
    setHousehold(h);
    return h;
  };

  const join = async (code) => {
    const h = await householdsApi.join(code);
    setHousehold(h);
    return h;
  };

  const rename = async (name) => {
    const h = await householdsApi.rename(name);
    setHousehold((prev) => ({ ...prev, name: h.name }));
    return h;
  };

  const newInvite = async () => {
    const h = await householdsApi.newInvite();
    setHousehold((prev) => ({ ...prev, invite_code: h.invite_code }));
    return h;
  };

  const leave = async () => {
    await householdsApi.leave();
    setHousehold(null);
  };

  return { household, loading, error, create, join, rename, newInvite, leave, refresh: load };
}
