import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useProjectEntries } from "../../hooks/useProjects";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Spinner from "../../components/Spinner";
import ProjectEntryForm from "./ProjectEntryForm";
import { formatCurrency, formatDate } from "../../utils/format";

export default function ProjectDetail({ project, onBack }) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError]   = useState(null);

  const { entries, summary, loading, error, addEntry, updateEntry, removeEntry } =
    useProjectEntries(project.id);

  const handleSave = async (data) => { await addEntry(data); setShowForm(false); };

  const startEdit = (entry) => {
    setEditingId(entry.id); setEditError(null);
    setEditForm({
      date:        entry.date,
      description: entry.description || "",
      amount:      entry.amount,
      paid_amount: entry.paid_amount ?? entry.amount,
    });
  };

  const saveEdit = async (id) => {
    setEditSaving(true); setEditError(null);
    try {
      await updateEntry(id, {
        ...editForm,
        amount:      parseFloat(editForm.amount),
        paid_amount: parseFloat(editForm.paid_amount),
      });
      setEditingId(null);
    } catch (e) {
      setEditError(e.message);
    } finally {
      setEditSaving(false);
    }
  };

  // ── Add expense full-screen form ──────────────────────────────────────────
  if (showForm) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
        <div className="bg-gradient-to-br from-teal-600 to-cyan-700 px-5 pt-12 pb-5">
          <button onClick={() => setShowForm(false)}
            className="flex items-center gap-1 text-teal-100 text-sm mb-4">
            ← Back
          </button>
          <p className="text-teal-100 text-xs uppercase tracking-widest">{project.name}</p>
          <p className="text-white text-xl font-bold mt-0.5">Add Expense</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ProjectEntryForm onSave={handleSave} onCancel={() => setShowForm(false)} />
        </div>
      </div>
    );
  }

  // Compute totals directly from entries (balance column is the authoritative
  // per-row field; summary sums can drift if paid_amount was stored loosely).
  const totalAmount = entries.reduce((s, e) => s + (e.amount || 0), 0);
  const dueAmount   = entries.reduce((s, e) => s + Math.max(0, e.balance ?? 0), 0);
  const paidAmount  = Math.max(0, totalAmount - dueAmount);
  const paidPct     = totalAmount > 0
    ? Math.min(100, (paidAmount / totalAmount) * 100).toFixed(2)
    : "0.00";

  const paidEntries = entries.filter((e) => (e.balance ?? 0) <= 0);
  const dueEntries  = entries.filter((e) => (e.balance ?? 0) > 0);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">

      {/* ── Teal header (compact) ──────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-teal-600 to-cyan-700 px-4 pt-6 pb-3">
        {/* Back + title on one row */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full
                       bg-white/10 hover:bg-white/20 active:bg-white/25 text-white transition-colors"
            aria-label="Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-white text-lg font-bold leading-tight truncate">{project.name}</p>
            {project.description && (
              <p className="text-teal-200 text-xs truncate">{project.description}</p>
            )}
          </div>
          {totalAmount > 0 && (
            <span className="shrink-0 text-teal-100 text-xs font-semibold bg-white/10 rounded-full px-2 py-0.5">
              {paidPct}%
            </span>
          )}
        </div>

        {/* Totals row — inline, wraps on narrow widths */}
        {entries.length > 0 && (
          <div className="flex items-baseline flex-wrap gap-x-4 gap-y-1 mt-3 text-xs">
            <span className="text-teal-200 whitespace-nowrap">
              Total <span className="text-white font-bold ml-1">{formatCurrency(totalAmount)}</span>
            </span>
            <span className="text-teal-200 whitespace-nowrap">
              Paid <span className="text-white font-bold ml-1">{formatCurrency(paidAmount)}</span>
            </span>
            {dueAmount > 0 && (
              <span className="text-teal-200 whitespace-nowrap">
                Due <span className="text-orange-300 font-bold ml-1">{formatCurrency(dueAmount)}</span>
              </span>
            )}
          </div>
        )}

        {/* Slim progress bar */}
        {totalAmount > 0 && (
          <div className="h-1 bg-teal-800 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-white/80 rounded-full transition-all"
              style={{ width: `${paidPct}%` }} />
          </div>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-52 px-4 py-4 flex flex-col gap-3">

        {loading && <Spinner />}
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        {!loading && entries.length === 0 && (
          <p className="text-center text-slate-400 dark:text-slate-500 text-sm mt-6">
            No expenses yet — tap + to add one or use the ✦ assistant
          </p>
        )}

        {paidEntries.length > 0 && (
          <div className="flex flex-col gap-2">
            {dueEntries.length > 0 && (
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide px-1">
                Paid
              </p>
            )}
            {paidEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry}
                editingId={editingId} editForm={editForm} editError={editError} editSaving={editSaving}
                onEdit={startEdit} onSave={saveEdit}
                onCancel={() => setEditingId(null)} onEditChange={setEditForm}
                onRemove={removeEntry}
              />
            ))}
          </div>
        )}

        {dueEntries.length > 0 && (
          <div className="flex flex-col gap-2 mt-1">
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide px-1">
              Yet to Pay
            </p>
            {dueEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} due
                editingId={editingId} editForm={editForm} editError={editError} editSaving={editSaving}
                onEdit={startEdit} onSave={saveEdit}
                onCancel={() => setEditingId(null)} onEditChange={setEditForm}
                onRemove={removeEntry}
              />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-[88px] right-4 flex items-center gap-1.5 bg-teal-600 text-white
                   pl-3 pr-4 py-2.5 rounded-full shadow-lg shadow-teal-200/60
                   text-sm font-semibold active:bg-teal-700 transition-transform active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add
      </button>
    </div>
  );
}

// ── EntryCard ────────────────────────────────────────────────────────────────
function EntryCard({ entry, due = false, editingId, editForm, editError, editSaving,
  onEdit, onSave, onCancel, onEditChange, onRemove }) {
  const { t } = useTranslation();

  if (editingId === entry.id) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <Input label="Date" type="date" value={editForm.date}
            onChange={(e) => onEditChange((f) => ({ ...f, date: e.target.value }))} className="flex-1" />
          <Input label="Amount" type="number" value={editForm.amount}
            onChange={(e) => onEditChange((f) => ({ ...f, amount: e.target.value }))} className="flex-1" />
        </div>
        <Input label="Description" value={editForm.description}
          onChange={(e) => onEditChange((f) => ({ ...f, description: e.target.value }))} />
        <Input label="Paid" type="number" value={editForm.paid_amount}
          onChange={(e) => onEditChange((f) => ({ ...f, paid_amount: e.target.value }))} />
        {editError && <p className="text-xs text-red-500">{editError}</p>}
        <div className="flex gap-2 mt-1">
          <Button onClick={() => onSave(entry.id)} disabled={editSaving} full>
            {editSaving ? "Saving…" : "Save"}
          </Button>
          <Button variant="secondary" full onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className={`h-0.5 ${due ? "bg-orange-400" : "bg-teal-400"}`} />
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
            {entry.description || "—"}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{formatDate(entry.date)}</p>
        </div>
        <p className={`text-sm font-bold shrink-0 ${due ? "text-orange-500" : "text-teal-600"}`}>
          {formatCurrency(entry.amount)}
        </p>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => onEdit(entry)}
            className="text-xs text-teal-600 font-medium px-1.5 py-1 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/30">
            Edit
          </button>
          <button onClick={() => onRemove(entry.id)}
            className="text-slate-300 dark:text-slate-600 hover:text-red-400 text-xl px-1 leading-none">
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
