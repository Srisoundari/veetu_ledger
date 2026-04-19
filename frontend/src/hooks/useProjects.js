import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { projectsApi } from "../api/projects.api";
import { expensesApi } from "../api/expenses.api";
import { localProjects, localEntries } from "../utils/localStore";

export function useProjects() {
  const { isGuest } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setProjects(isGuest ? localProjects.list() : await projectsApi.list());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [isGuest]);

  const create = async (data) => {
    const p = isGuest ? localProjects.create(data) : await projectsApi.create(data);
    setProjects((prev) => [p, ...prev]);
    return p;
  };

  const update = async (id, data) => {
    const p = isGuest ? localProjects.update(id, data) : await projectsApi.update(id, data);
    setProjects((prev) => prev.map((proj) => (proj.id === id ? p : proj)));
    return p;
  };

  const complete = async (id) => {
    isGuest ? localProjects.complete(id) : await projectsApi.complete(id);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "completed" } : p))
    );
  };

  const remove = async (id) => {
    if (!isGuest) await projectsApi.delete(id);
    else localProjects.delete(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return { projects, loading, error, create, update, complete, remove, refresh: load };
}

// ── Expenses scoped to one group (replaces old useProjectEntries) ────────────
export function useProjectEntries(projectId) {
  const { isGuest } = useAuth();
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      if (isGuest) {
        setEntries(localEntries.list(projectId));
        setSummary(localEntries.summary(projectId));
      } else {
        const [e, s] = await Promise.all([
          expensesApi.list({ projectId }),
          expensesApi.summary(projectId),
        ]);
        setEntries(e);
        setSummary(s);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (projectId) load(); }, [projectId, isGuest]);

  const addEntry = async (data) => {
    const payload = { ...data, project_id: projectId };
    const entry = isGuest
      ? localEntries.create(projectId, data)
      : await expensesApi.create(payload);
    setEntries((prev) => [entry, ...prev]);
    if (!isGuest) setSummary(await expensesApi.summary(projectId));
    else setSummary(localEntries.summary(projectId));
    return entry;
  };

  const updateEntry = async (entryId, data) => {
    const entry = isGuest
      ? localEntries.update(projectId, entryId, data)
      : await expensesApi.update(entryId, data);
    setEntries((prev) => prev.map((e) => (e.id === entryId ? entry : e)));
    if (!isGuest) setSummary(await expensesApi.summary(projectId));
    else setSummary(localEntries.summary(projectId));
    return entry;
  };

  const removeEntry = async (entryId) => {
    if (isGuest) localEntries.delete(projectId, entryId);
    else await expensesApi.delete(entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    if (!isGuest) setSummary(await expensesApi.summary(projectId));
    else setSummary(localEntries.summary(projectId));
  };

  return { entries, summary, loading, error, addEntry, updateEntry, removeEntry, refresh: load };
}
