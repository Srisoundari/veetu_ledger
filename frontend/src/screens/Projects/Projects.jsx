import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useProjects } from "../../hooks/useProjects";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Spinner from "../../components/Spinner";
import ProjectDetail from "./ProjectDetail";
import { formatCurrency } from "../../utils/format";
import PageInfo from "../../components/PageInfo";

export default function Projects() {
  const { t } = useTranslation();
  const [selected, setSelected]         = useState(null);
  const [showForm, setShowForm]         = useState(false);
  const [name, setName]                 = useState("");
  const [desc, setDesc]                 = useState("");
  const [creating, setCreating]         = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [editForm, setEditForm]         = useState({});
  const [editSaving, setEditSaving]     = useState(false);
  const [editError, setEditError]       = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const { projects, loading, error, create, update, complete, remove } = useProjects();

  if (selected) {
    return <ProjectDetail project={selected} onBack={() => setSelected(null)} />;
  }

  const saveEdit = async (id) => {
    setEditSaving(true); setEditError(null);
    try { await update(id, editForm); setEditingId(null); }
    catch (e) { setEditError(e.message); }
    finally { setEditSaving(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try { await create({ name, description: desc }); setName(""); setDesc(""); setShowForm(false); }
    finally { setCreating(false); }
  };

  const active    = projects.filter((p) => p.status !== "completed");
  const completed = projects.filter((p) => p.status === "completed");

  const totalBalance = active.reduce((s, p) => s + (p.summary?.balance     ?? 0), 0);
  const totalPaid    = active.reduce((s, p) => s + (p.summary?.paid_amount ?? 0), 0);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">

      {/* ── Teal header ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-teal-600 to-cyan-700 px-5 pt-12 pb-5">

        {/* Title + info */}
        <div className="flex items-center gap-2">
          <p className="text-white text-xl font-bold">Groups</p>
          <PageInfo dark text="Organise expenses into groups — home renovation, construction, events, and more. Paste a WhatsApp expense report inside a group to bulk-add items. Outstanding balances update automatically." />
        </div>

        {/* Stat chips */}
        <div className="flex gap-3 mt-4">
          <div className="bg-white/10 rounded-xl px-3 py-2.5 flex-1 text-center">
            <p className="text-teal-200 text-xs">Active</p>
            <p className="text-white text-base font-bold mt-0.5">{active.length}</p>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2.5 flex-1 text-center">
            <p className="text-teal-200 text-xs">Paid</p>
            <p className="text-white text-base font-bold mt-0.5">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2.5 flex-1 text-center">
            <p className="text-teal-200 text-xs">To Pay</p>
            <p className="text-orange-300 text-base font-bold mt-0.5">{formatCurrency(totalBalance)}</p>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-24 px-4 py-4 flex flex-col gap-3">

        {/* Create form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">New Group</p>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <Input label="Group name" value={name}
                onChange={(e) => setName(e.target.value)} required />
              <Input label="Description (optional)" value={desc}
                onChange={(e) => setDesc(e.target.value)} />
              <div className="flex gap-2">
                <Button type="submit" full disabled={creating}>
                  {creating ? "Creating…" : "Create"}
                </Button>
                <Button variant="secondary" full onClick={() => setShowForm(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </form>
          </div>
        )}

        {loading && <Spinner />}
        {error   && <p className="text-sm text-red-500 text-center">{error}</p>}

        {!loading && projects.length === 0 && !showForm && (
          <p className="text-center text-slate-400 dark:text-slate-500 text-sm mt-10">No groups yet</p>
        )}

        {/* Active */}
        {active.map((p) => (
          <ProjectCard key={p.id} project={p}
            editingId={editingId} editForm={editForm} editError={editError} editSaving={editSaving}
            onSelect={setSelected}
            onStartEdit={() => { setEditingId(p.id); setEditError(null); setEditForm({ name: p.name, description: p.description || "" }); }}
            onEditChange={setEditForm}
            onSaveEdit={saveEdit}
            onCancelEdit={() => setEditingId(null)}
            onComplete={complete}
            onRemove={remove}
          />
        ))}

        {/* Completed toggle */}
        {!loading && completed.length > 0 && (
          <div>
            <button
              onClick={() => setShowArchived((v) => !v)}
              className="w-full text-xs text-slate-400 font-medium text-center py-2"
            >
              {showArchived ? "▲ Hide" : "▼ Show"} completed ({completed.length})
            </button>
            {showArchived && completed.map((p) => (
              <div key={p.id} className="mt-2 opacity-60">
                <ProjectCard project={p}
                  editingId={editingId} editForm={editForm} editError={editError} editSaving={editSaving}
                  onSelect={setSelected}
                  onStartEdit={() => { setEditingId(p.id); setEditError(null); setEditForm({ name: p.name, description: p.description || "" }); }}
                  onEditChange={setEditForm}
                  onSaveEdit={saveEdit}
                  onCancelEdit={() => setEditingId(null)}
                  onRemove={remove}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowForm((v) => !v)}
        className="fixed bottom-[88px] right-4 flex items-center gap-1.5 bg-teal-600 text-white
                   pl-3 pr-4 py-2.5 rounded-full shadow-lg shadow-teal-200/60
                   text-sm font-semibold active:bg-teal-700 transition-transform active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New group
      </button>
    </div>
  );
}

// ── GroupCard ────────────────────────────────────────────────────────────────

function ProjectCard({
  project: p, editingId, editForm, editError, editSaving,
  onSelect, onStartEdit, onEditChange, onSaveEdit, onCancelEdit, onComplete, onRemove,
}) {
  const s       = p.summary ?? { total_amount: 0, paid_amount: 0, balance: 0, days: 0 };
  const paidPct = s.total_amount > 0 ? Math.min(100, (s.paid_amount / s.total_amount) * 100) : 0;
  const isComplete = p.status === "completed";

  if (editingId === p.id) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 flex flex-col gap-2">
        <Input label="Name" value={editForm.name}
          onChange={(e) => onEditChange((f) => ({ ...f, name: e.target.value }))} autoFocus />
        <Input label="Description" value={editForm.description || ""}
          onChange={(e) => onEditChange((f) => ({ ...f, description: e.target.value }))} />
        {editError && <p className="text-xs text-red-500">{editError}</p>}
        <div className="flex gap-2 mt-1">
          <Button onClick={() => onSaveEdit(p.id)} disabled={editSaving || !editForm.name?.trim()} full>
            {editSaving ? "Saving…" : "Save"}
          </Button>
          <Button variant="secondary" full onClick={onCancelEdit}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className={`h-1 ${isComplete ? "bg-slate-200 dark:bg-slate-600" : "bg-teal-500"}`} />

      <div className="p-4">
        {/* Name row */}
        <div className="flex items-start justify-between cursor-pointer" onClick={() => onSelect(p)}>
          <div className="flex-1 min-w-0 pr-3">
            <p className={`font-semibold text-slate-800 dark:text-slate-100 ${isComplete ? "line-through text-slate-400" : ""}`}>
              {p.name}
            </p>
            {p.description && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{p.description}</p>
            )}
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${
            isComplete ? "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500" : "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
          }`}>
            {p.status}
          </span>
        </div>

        {/* Financial summary */}
        {s.days > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mb-1.5">
              <span>{s.days} {s.days === 1 ? "item" : "items"}</span>
              <span className="font-medium text-teal-600">{Math.round(paidPct)}% paid</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${paidPct}%` }} />
            </div>
            <div className="flex gap-4 mt-3">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Total</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatCurrency(s.total_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Paid</p>
                <p className="text-sm font-bold text-teal-600">{formatCurrency(s.paid_amount)}</p>
              </div>
              {s.balance > 0 && (
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Due</p>
                  <p className="text-sm font-bold text-orange-500">{formatCurrency(s.balance)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-50 dark:border-slate-700/50">
          {!isComplete && onComplete && (
            <button
              onClick={(e) => { e.stopPropagation(); onComplete(p.id); }}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              ✓ Complete
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onStartEdit(); }}
            className="text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(p.id); }}
            className="text-xs font-medium text-red-400 hover:text-red-500 ml-auto"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
