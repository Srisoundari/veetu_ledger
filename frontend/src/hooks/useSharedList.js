import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { listApi } from "../api/list.api";
import { localList } from "../utils/localStore";

export function useSharedList() {
  const { isGuest } = useAuth();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setItems(isGuest ? localList.get() : await listApi.get());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [isGuest]);

  const add = async (data) => {
    const item = isGuest ? localList.add(data) : await listApi.add(data);
    setItems((prev) => [...prev, item]);
    return item;
  };

  const markDone = async (id) => {
    isGuest ? localList.markDone(id) : await listApi.markDone(id);
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_done: true } : i))
    );
  };

  const remove = async (id) => {
    isGuest ? localList.delete(id) : await listApi.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearDone = async () => {
    isGuest ? localList.clearDone() : await listApi.clearDone();
    setItems((prev) => prev.filter((i) => !i.is_done));
  };

  return { items, loading, error, add, markDone, remove, clearDone, refresh: load };
}
