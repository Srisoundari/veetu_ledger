import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { projectsApi } from "../api/projects.api";
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

  const complete = async (id) => {
    isGuest ? localProjects.complete(id) : await projectsApi.complete(id);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "completed" } : p))
    );
  };

  const remove = async (id) => {
    if (!isGuest) await projectsApi.delete(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return { projects, loading, error, create, complete, remove, refresh: load };
}

export function useProjectEntries(projectId) {
  const { isGuest } = useAuth();
  const [entries, setEntries]   = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      if (isGuest) {
        setEntries(localEntries.list(projectId));
        setSummary(localEntries.summary(projectId));
      } else {
        const [e, s] = await Promise.all([
          projectsApi.listEntries(projectId),
          projectsApi.summary(projectId),
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
    const entry = isGuest
      ? localEntries.create(projectId, data)
      : await projectsApi.addEntry(projectId, data);
    setEntries((prev) => [...prev, entry]);
    setSummary(
      isGuest
        ? localEntries.summary(projectId)
        : await projectsApi.summary(projectId)
    );
    return entry;
  };

  const removeEntry = async (entryId) => {
    isGuest
      ? localEntries.delete(projectId, entryId)
      : await projectsApi.deleteEntry(projectId, entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    setSummary(
      isGuest
        ? localEntries.summary(projectId)
        : await projectsApi.summary(projectId)
    );
  };

  return { entries, summary, loading, error, addEntry, removeEntry, refresh: load };
}
