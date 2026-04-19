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
  update: (id, data) => {
    const updated = read(K.expenses).map((e) => e.id === id ? { ...e, ...data } : e);
    save(K.expenses, updated);
    return updated.find((e) => e.id === id);
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
  update: (id, data) => {
    const updated = read(K.projects).map((p) => p.id === id ? { ...p, ...data } : p);
    save(K.projects, updated);
    return updated.find((p) => p.id === id);
  },
  complete: (id) =>
    save(K.projects, read(K.projects).map((p) => p.id === id ? { ...p, status: "completed" } : p)),
  delete: (id) => save(K.projects, read(K.projects).filter((p) => p.id !== id)),
};

// ---------- Project expenses (unified field names: date/amount/description) ----------
export const localEntries = {
  list: (pid) => read(K.entries(pid)),
  create: (pid, data) => {
    const amount = data.amount ?? 0;
    const paid   = data.paid_amount ?? amount;
    const item = {
      ...data,
      id: uid(),
      project_id: pid,
      amount,
      paid_amount: paid,
      balance: amount - paid,
      created_at: now(),
    };
    save(K.entries(pid), [...read(K.entries(pid)), item]);
    return item;
  },
  update: (pid, eid, data) => {
    const updated = read(K.entries(pid)).map((e) => {
      if (e.id !== eid) return e;
      const amount = data.amount ?? e.amount;
      const paid   = data.paid_amount ?? e.paid_amount ?? amount;
      return { ...e, ...data, amount, paid_amount: paid, balance: amount - paid };
    });
    save(K.entries(pid), updated);
    return updated.find((e) => e.id === eid);
  },
  delete: (pid, eid) =>
    save(K.entries(pid), read(K.entries(pid)).filter((e) => e.id !== eid)),
  summary: (pid) => {
    const entries = read(K.entries(pid));
    return {
      total_amount: entries.reduce((s, e) => s + (e.amount      ?? 0), 0),
      paid_amount:  entries.reduce((s, e) => s + (e.paid_amount ?? 0), 0),
      balance:      entries.reduce((s, e) => s + (e.balance     ?? 0), 0),
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
  update:    (id, data) => {
    const updated = read(K.list).map((i) => i.id === id ? { ...i, ...data } : i);
    save(K.list, updated);
    return updated.find((i) => i.id === id);
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
