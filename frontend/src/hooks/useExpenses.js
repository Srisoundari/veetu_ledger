import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { expensesApi } from "../api/expenses.api";
import { localExpenses } from "../utils/localStore";

export function useExpenses(month) {
  const { isGuest } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setExpenses(
        isGuest ? localExpenses.list(month) : await expensesApi.list(month)
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, isGuest]);

  const add = async (data) => {
    const created = isGuest
      ? localExpenses.create(data)
      : await expensesApi.create(data);
    setExpenses((prev) => [created, ...prev]);
    return created;
  };

  const update = async (id, data) => {
    const updated = isGuest
      ? localExpenses.update(id, data)
      : await expensesApi.update(id, data);
    setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  };

  const remove = async (id) => {
    isGuest ? localExpenses.delete(id) : await expensesApi.delete(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  return { expenses, loading, error, add, update, remove, refresh: load };
}
