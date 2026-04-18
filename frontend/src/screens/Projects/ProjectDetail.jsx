import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useProjectEntries } from "../../hooks/useProjects";
import { nlpApi } from "../../api/nlp.api";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Spinner from "../../components/Spinner";
import ProjectEntryForm from "./ProjectEntryForm";
import { formatCurrency, formatDate } from "../../utils/format";

export default function ProjectDetail({ project, onBack }) {
  const { t } = useTranslation();

  // Manual entry form
  const [showForm, setShowForm]       = useState(false);

  // Paste & parse panel
  const [showParse, setShowParse]     = useState(false);
  const [parseText, setParseText]     = useState("");
  const [parsedItems, setParsedItems] = useState(null);
  const [parsing, setParsing]         = useState(false);
  const [parseSaving, setParseSaving] = useState(false);
  const [parseError, setParseError]   = useState(null);

  // Inline edit
  const [editingId, setEditingId]     = useState(null);
  const [editForm, setEditForm]       = useState({});
  const [editSaving, setEditSaving]   = useState(false);
  const [editError, setEditError]     = useState(null);

  const { entries, summary, loading, error, addEntry, updateEntry, removeEntry, refresh } =
    useProjectEntries(project.id);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSave = async (data) => { await addEntry(data); setShowForm(false); };

  const handleParse = async () => {
    setParsing(true); setParseError(null);
    try {
      const items = await nlpApi.parse(parseText, "en");
      const projectItems = items.filter((i) => i.type === "project_entry");
      if (projectItems.length === 0)
        throw new Error("No expense items found — check the format and try again.");
      setParsedItems(projectItems);
    } catch (e) {
      setParseError(e.message);
    } finally {
      setParsing(false);
    }
  };

  const handleSaveAll = async () => {
    setParseSaving(true); setParseError(null);
    try {
      await nlpApi.save(parsedItems, project.id);
      await refresh();
      setShowParse(false); setParseText(""); setParsedItems(null);
    } catch (e) {
      setParseError(e.message);
    } finally {
      setParseSaving(false);
    }
  };

  const resetParse = () => {
    setShowParse(false); setParseText(""); setParsedItems(null); setParseError(null);
  };

  const startEdit = (entry) => {
    setEditingId(entry.id); setEditError(null);
    setEditForm({
      entry_date:       entry.entry_date,
      work_description: entry.work_description || "",
      total_amount:     entry.total_amount,
      paid_amount:      entry.paid_amount,
    });
  };

  const saveEdit = async (id) => {
    setEditSaving(true); setEditError(null);
    try {
      await updateEntry(id, {
        ...editForm,
        total_amount: parseFloat(editForm.total_amount),
        paid_amount:  parseFloat(editForm.paid_amount),
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

  // ── Derived ───────────────────────────────────────────────────────────────

  const paidPct = summary?.total_amount > 0
    ? Math.min(100, (summary.paid_amount / summary.total_amount) * 100)
    : 0;

  const paidEntries = entries.filter((e) => (e.balance ?? 0) <= 0);
  const dueEntries  = entries.filter((e) => (e.balance ?? 0) > 0);

  // ── Main view ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">

      {/* ── Teal header ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-teal-600 to-cyan-700 px-5 pt-12 pb-5">
        <button onClick={onBack} className="flex items-center gap-1 text-teal-100 text-sm mb-4">
          ← Groups
        </button>
        <p className="text-white text-2xl font-bold leading-tight">{project.name}</p>
        {project.description && (
          <p className="text-teal-200 text-sm mt-1">{project.description}</p>
        )}

        {/* Summary chips */}
        {entries.length > 0 && summary && (
          <div className="flex gap-3 mt-4">
            <div className="bg-white/10 rounded-xl px-3 py-2 flex-1 text-center">
              <p className="text-teal-300 text-xs">Total</p>
              <p className="text-white text-sm font-bold mt-0.5">{formatCurrency(summary.total_amount)}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2 flex-1 text-center">
              <p className="text-teal-300 text-xs">Paid</p>
              <p className="text-white text-sm font-bold mt-0.5">{formatCurrency(summary.paid_amount)}</p>
            </div>
            {summary.balance > 0 && (
              <div className="bg-white/10 rounded-xl px-3 py-2 flex-1 text-center">
                <p className="text-teal-300 text-xs">Due</p>
                <p className="text-orange-300 text-sm font-bold mt-0.5">{formatCurrency(summary.balance)}</p>
              </div>
            )}
          </div>
        )}

        {/* Progress bar */}
        {summary?.total_amount > 0 && (
          <div className="mt-3">
            <div className="h-1.5 bg-teal-800 rounded-full overflow-hidden">
              <div className="h-full bg-white/80 rounded-full transition-all" style={{ width: `${paidPct}%` }} />
            </div>
            <p className="text-teal-300 text-xs mt-1">{Math.round(paidPct)}% paid</p>
          </div>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-24 px-4 py-4 flex flex-col gap-3">

        {/* ── Paste & parse panel ─────────────────────────────────────────── */}
        {showParse ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Paste expense report</p>
              <button onClick={resetParse}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none px-1">
                ×
              </button>
            </div>

            <textarea
              value={parseText}
              onChange={(e) => { setParseText(e.target.value); setParsedItems(null); }}
              placeholder={"Paste your WhatsApp expense summary…\n\ne.g.\n14 Apr 2026\nTiles :- 4250\nSand :- 5460\n\nYet to Pay\nPlumbing :- 20277"}
              rows={7}
              autoFocus
              className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-700
                         border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5
                         resize-none focus:outline-none focus:border-slate-400 dark:focus:border-slate-500
                         placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />

            {parseError && <p className="text-xs text-red-500">{parseError}</p>}

            {/* Parsed preview */}
            {parsedItems && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  {parsedItems.length} items found — review before saving
                </p>
                <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-0.5">
                  {parsedItems.map((item, i) => {
                    const isDue = (item.paid_amount ?? 0) < (item.total_amount ?? 0);
                    return (
                      <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-xl
                        ${isDue
                          ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30"
                          : "bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/30"}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                            {item.work_description || "—"}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {formatDate(item.entry_date)}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className={`text-sm font-bold ${isDue ? "text-orange-500" : "text-teal-600"}`}>
                            {formatCurrency(item.total_amount)}
                          </p>
                          {isDue && <p className="text-[10px] text-orange-400 font-semibold">yet to pay</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {!parsedItems ? (
                <Button onClick={handleParse} disabled={parsing || !parseText.trim()} full>
                  {parsing ? "Parsing…" : "Parse"}
                </Button>
              ) : (
                <>
                  <Button onClick={handleSaveAll} disabled={parseSaving} full>
                    {parseSaving ? "Saving…" : `Save ${parsedItems.length} items`}
                  </Button>
                  <Button variant="secondary" full onClick={() => { setParsedItems(null); setParseError(null); }}>
                    Re-parse
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowParse(true)}
            className="w-full py-2 text-xs font-semibold text-teal-600 dark:text-teal-400 text-center
                       bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800/30
                       active:bg-teal-100 dark:active:bg-teal-900/40"
          >
            📋 Paste expense report
          </button>
        )}

        {loading && <Spinner />}
        {error   && <p className="text-sm text-red-500 text-center">{error}</p>}

        {!loading && entries.length === 0 && (
          <p className="text-center text-slate-400 dark:text-slate-500 text-sm mt-6">
            No expenses yet — add one or paste a report above
          </p>
        )}

        {/* ── Paid entries ────────────────────────────────────────────────── */}
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

        {/* ── Yet to Pay entries ──────────────────────────────────────────── */}
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

      {/* FAB */}
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
          <Input label="Date" type="date" value={editForm.entry_date}
            onChange={(e) => onEditChange((f) => ({ ...f, entry_date: e.target.value }))} className="flex-1" />
          <Input label="Amount" type="number" value={editForm.total_amount}
            onChange={(e) => onEditChange((f) => ({ ...f, total_amount: e.target.value }))} className="flex-1" />
        </div>
        <Input label="Description" value={editForm.work_description}
          onChange={(e) => onEditChange((f) => ({ ...f, work_description: e.target.value }))} />
        <Input label={t("project.paid")} type="number" value={editForm.paid_amount}
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
            {entry.work_description || "—"}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{formatDate(entry.entry_date)}</p>
        </div>
        <p className={`text-sm font-bold shrink-0 ${due ? "text-orange-500" : "text-teal-600"}`}>
          {formatCurrency(entry.total_amount)}
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
