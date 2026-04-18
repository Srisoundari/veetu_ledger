import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useProjectEntries } from "../../hooks/useProjects";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Spinner from "../../components/Spinner";
import NLPInput from "../../components/NLPInput";
import ProjectEntryForm from "./ProjectEntryForm";
import { formatCurrency, formatDate } from "../../utils/format";

export default function ProjectDetail({ project, onBack }) {
  const { t } = useTranslation();
  const { isGuest } = useAuth();
  const [showForm, setShowForm]     = useState(false);
  const [showNLP, setShowNLP]       = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [editForm, setEditForm]     = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError]   = useState(null);
  const { entries, summary, loading, error, addEntry, updateEntry, removeEntry, refresh } =
    useProjectEntries(project.id);

  const handleSave = async (data) => { await addEntry(data); setShowForm(false); };

  const handleNLPResult = async (savedItems) => {
    if (!savedItems.some((i) => i.type === "project_entry"))
      throw new Error("No project entries found. Try rephrasing.");
    await refresh();
    setShowNLP(false);
  };

  const startEditEntry = (entry) => {
    setEditingId(entry.id);
    setEditError(null);
    setEditForm({
      entry_date:       entry.entry_date,
      day_number:       entry.day_number || "",
      work_description: entry.work_description || "",
      total_amount:     entry.total_amount,
      paid_amount:      entry.paid_amount,
    });
  };

  const saveEditEntry = async (id) => {
    setEditSaving(true); setEditError(null);
    try {
      await updateEntry(id, {
        ...editForm,
        day_number:   parseInt(editForm.day_number)   || null,
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

  if (showForm) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
        {/* Back header */}
        <div className="bg-gradient-to-br from-teal-600 to-cyan-700 px-5 pt-12 pb-5">
          <button onClick={() => setShowForm(false)}
            className="flex items-center gap-1 text-teal-100 text-sm mb-4">
            ← Back
          </button>
          <p className="text-teal-100 text-xs uppercase tracking-widest">{project.name}</p>
          <p className="text-white text-xl font-bold mt-0.5">{t("project.add_entry")}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ProjectEntryForm
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
            dayNumber={entries.length + 1}
          />
        </div>
      </div>
    );
  }

  const paidPct = summary && summary.total_amount > 0
    ? Math.min(100, (summary.paid_amount / summary.total_amount) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">

      {/* ── Teal header ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-teal-600 to-cyan-700 px-5 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-1 text-teal-100 text-sm mb-4">
          ← Projects
        </button>
        <p className="text-white text-2xl font-bold leading-tight">{project.name}</p>
        {project.description && (
          <p className="text-teal-200 text-sm mt-1">{project.description}</p>
        )}

        {/* Summary row */}
        {summary && summary.days > 0 && (
          <div className="mt-4">
            <div className="flex gap-4">
              <div>
                <p className="text-teal-300 text-xs">Total</p>
                <p className="text-white text-base font-bold">{formatCurrency(summary.total_amount)}</p>
              </div>
              <div>
                <p className="text-teal-300 text-xs">Paid</p>
                <p className="text-white text-base font-bold">{formatCurrency(summary.paid_amount)}</p>
              </div>
              {summary.balance > 0 && (
                <div>
                  <p className="text-teal-300 text-xs">Due</p>
                  <p className="text-orange-300 text-base font-bold">{formatCurrency(summary.balance)}</p>
                </div>
              )}
              <div className="ml-auto text-right">
                <p className="text-teal-300 text-xs">Days</p>
                <p className="text-white text-base font-bold">{summary.days}</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-1.5 bg-teal-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-white/80 transition-all"
                style={{ width: `${paidPct}%` }}
              />
            </div>
            <p className="text-teal-300 text-xs mt-1">{Math.round(paidPct)}% paid</p>
          </div>
        )}

        {/* NLP strip */}
        {!isGuest && (
          <button
            onClick={() => setShowNLP((v) => !v)}
            className="mt-4 w-full bg-white/15 rounded-xl px-3 py-2 text-left text-teal-100 text-sm"
          >
            💬 {showNLP ? "Hide voice entry" : t("nlp.placeholder")}
          </button>
        )}
        {showNLP && !isGuest && (
          <div className="mt-2">
            <NLPInput onResult={handleNLPResult} projectId={project.id} />
          </div>
        )}
      </div>

      {/* ── Entries ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-24 px-4 py-4 flex flex-col gap-3">
        {loading && <Spinner />}
        {error   && <p className="text-sm text-red-500 text-center">{error}</p>}

        {!loading && entries.length === 0 && (
          <p className="text-center text-slate-400 dark:text-slate-500 text-sm mt-10">No entries yet</p>
        )}

        {entries.map((entry) => (
          <div key={entry.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="h-0.5 bg-teal-400" />
            <div className="p-4">
              {editingId === entry.id ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input label="Day #" type="number" value={editForm.day_number}
                      onChange={(e) => setEditForm((f) => ({ ...f, day_number: e.target.value }))} className="w-20" />
                    <Input label="Date" type="date" value={editForm.entry_date}
                      onChange={(e) => setEditForm((f) => ({ ...f, entry_date: e.target.value }))} className="flex-1" />
                  </div>
                  <Input label="Work description" value={editForm.work_description}
                    onChange={(e) => setEditForm((f) => ({ ...f, work_description: e.target.value }))} />
                  <div className="flex gap-2">
                    <Input label={t("project.total")} type="number" value={editForm.total_amount}
                      onChange={(e) => setEditForm((f) => ({ ...f, total_amount: e.target.value }))} className="flex-1" />
                    <Input label={t("project.paid")} type="number" value={editForm.paid_amount}
                      onChange={(e) => setEditForm((f) => ({ ...f, paid_amount: e.target.value }))} className="flex-1" />
                  </div>
                  {editError && <p className="text-xs text-red-500">{editError}</p>}
                  <div className="flex gap-2 mt-1">
                    <Button onClick={() => saveEditEntry(entry.id)} disabled={editSaving} full>
                      {editSaving ? "Saving…" : "Save"}
                    </Button>
                    <Button variant="secondary" full onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Entry header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {entry.day_number && (
                        <span className="text-xs bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full font-semibold">
                          Day {entry.day_number}
                        </span>
                      )}
                      <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(entry.entry_date)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEditEntry(entry)}
                        className="text-xs text-teal-600 font-medium px-1.5 py-1 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/30">
                        Edit
                      </button>
                      <button onClick={() => removeEntry(entry.id)}
                        className="text-slate-300 hover:text-red-400 text-xl px-1 leading-none">
                        ×
                      </button>
                    </div>
                  </div>

                  {entry.work_description && (
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-2">{entry.work_description}</p>
                  )}

                  {/* Amounts */}
                  <div className="flex gap-4 mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/50">
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{t("project.total")}</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatCurrency(entry.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{t("project.paid")}</p>
                      <p className="text-sm font-bold text-teal-600">{formatCurrency(entry.paid_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{t("project.balance")}</p>
                      <p className="text-sm font-bold text-orange-500">{formatCurrency(entry.balance)}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
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
        Add entry
      </button>
    </div>
  );
}
