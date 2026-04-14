// localStorage-backed data store for guest mode.
// Same return shapes as the API so hooks can use both interchangeably.

const K = {
  expenses:       "veedu_g_expenses",
  projects:       "veedu_g_projects",
  entries:        (pid) => `veedu_g_entries_${pid}`,
  list:           "veedu_g_list",
};

const uid  = () => crypto.randomUUID();
const now  = () => new Date().toISOString();
const read = (key) => JSON.parse(localStorage.getItem(key) || "[]");
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// ---------- Expenses ----------
export const localExpenses = {
  list: (month) => {
    const all = read(K.expenses);
    return month ? all.filter((e) => e.date?.startsWith(month)) : all;
  },
  create: (data) => {
    const item = { ...data, id: uid(), created_at: now() };
    save(K.expenses, [item, ...read(K.expenses)]);
    return item;
  },
  delete: (id) => save(K.expenses, read(K.expenses).filter((e) => e.id !== id)),
};

// ---------- Projects ----------
export const localProjects = {
  list: () => read(K.projects),
  create: (data) => {
    const item = { ...data, id: uid(), status: "active", created_at: now() };
    save(K.projects, [item, ...read(K.projects)]);
    return item;
  },
  complete: (id) =>
    save(K.projects, read(K.projects).map((p) => p.id === id ? { ...p, status: "completed" } : p)),
  delete: (id) => save(K.projects, read(K.projects).filter((p) => p.id !== id)),
};

// ---------- Project Entries ----------
export const localEntries = {
  list: (pid) => read(K.entries(pid)),
  create: (pid, data) => {
    const item = {
      ...data,
      id: uid(),
      project_id: pid,
      balance: (data.total_amount ?? 0) - (data.paid_amount ?? 0),
      created_at: now(),
    };
    save(K.entries(pid), [...read(K.entries(pid)), item]);
    return item;
  },
  delete: (pid, eid) =>
    save(K.entries(pid), read(K.entries(pid)).filter((e) => e.id !== eid)),
  summary: (pid) => {
    const entries = read(K.entries(pid));
    return {
      total_amount: entries.reduce((s, e) => s + (e.total_amount ?? 0), 0),
      paid_amount:  entries.reduce((s, e) => s + (e.paid_amount  ?? 0), 0),
      balance:      entries.reduce((s, e) => s + (e.balance      ?? 0), 0),
      days:         entries.length,
    };
  },
};

// ---------- Shared List ----------
export const localList = {
  get:       ()     => read(K.list),
  add:       (data) => {
    const item = { ...data, id: uid(), is_done: false, created_at: now() };
    save(K.list, [...read(K.list), item]);
    return item;
  },
  markDone:  (id)   => save(K.list, read(K.list).map((i) => i.id === id ? { ...i, is_done: true } : i)),
  delete:    (id)   => save(K.list, read(K.list).filter((i) => i.id !== id)),
  clearDone: ()     => save(K.list, read(K.list).filter((i) => !i.is_done)),
};

// ---------- Clear all guest data (on sign out) ----------
export function clearGuestData() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith("veedu_g"))
    .forEach((k) => localStorage.removeItem(k));
}
