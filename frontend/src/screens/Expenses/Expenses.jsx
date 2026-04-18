import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useExpenses } from "../../hooks/useExpenses";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Spinner from "../../components/Spinner";
import ExpenseForm from "./ExpenseForm";
import { formatCurrency, formatDate, currentMonth } from "../../utils/format";
import PageInfo from "../../components/PageInfo";

// ── Category config ──────────────────────────────────────────────────────────
const CAT_EMOJI = {
  food: "🍽", groceries: "🛒", grocery: "🛒", transport: "🚗", travel: "✈️",
  fuel: "⛽", petrol: "⛽", health: "💊", medical: "🏥", medicine: "💊",
  utilities: "💡", electricity: "⚡", water: "💧", entertainment: "🎬",
  shopping: "🛍", rent: "🏠", education: "📚", clothing: "👕", clothes: "👕",
  restaurant: "🍴", snacks: "🍿", phone: "📱", internet: "🌐",
};
function catEmoji(cat) {
  return CAT_EMOJI[(cat || "").toLowerCase().trim()] ?? "💸";
}

// ── Date group label ─────────────────────────────────────────────────────────
function groupLabel(dateStr) {
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (dateStr === today)     return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return formatDate(dateStr);
}

export default function Expenses({ subTabBar }) {
  const { t } = useTranslation();
  const [month, setMonth]           = useState(currentMonth());
  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [editForm, setEditForm]     = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError]   = useState(null);
  const { expenses, loading, error, add, update, remove } = useExpenses(month);

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const grouped = useMemo(() => {
    const map = {};
    [...expenses]
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach((e) => { (map[e.date] = map[e.date] || []).push(e); });
    return Object.entries(map);
  }, [expenses]);

  const handleSave = async (data) => { await add(data); setShowForm(false); };

  const startEdit = (e) => {
    setEditingId(e.id);
    setEditError(null);
    setEditForm({ date: e.date, amount: e.amount, note: e.note || "", category: e.category || "" });
  };

  const saveEdit = async (id) => {
    setEditSaving(true);
    setEditError(null);
    try {
      await update(id, { ...editForm, amount: parseFloat(editForm.amount) });
      setEditingId(null);
    } catch (e) {
      setEditError(e.message);
    } finally {
      setEditSaving(false);
    }
  };

  if (showForm) {
    return (
      <>
        <PageHeader title={t("expense.add")} onBack={() => setShowForm(false)} />
        <ExpenseForm onSave={handleSave} onCancel={() => setShowForm(false)} />
      </>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">

      {/* ── Teal header (matches Projects) ─────────────────────────────────── */}
      <div className="bg-gradient-to-br from-teal-600 to-cyan-700 px-5 pt-12 pb-5">

        {subTabBar}

        {/* Title + info + month picker */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-white text-xl font-bold">Expenses</p>
            <PageInfo dark text="Log and review household expenses. Use the month picker to browse history. Tap any entry to edit it, or use the ✦ assistant to add expenses by typing naturally." />
          </div>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-white/15 text-white text-xs font-semibold rounded-xl px-3 py-2
                       border-0 outline-none [color-scheme:dark]"
          />
        </div>

        {/* Stat chips */}
        <div className="flex gap-3 mt-4">
          <div className="bg-white/10 rounded-xl px-3 py-2.5 flex-1 text-center">
            <p className="text-teal-200 text-xs">This month</p>
            <p className="text-white text-base font-bold mt-0.5">{formatCurrency(total)}</p>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2.5 flex-1 text-center">
            <p className="text-teal-200 text-xs">Entries</p>
            <p className="text-white text-base font-bold mt-0.5">{expenses.length}</p>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-24">

        {loading && <div className="pt-8"><Spinner /></div>}
        {error   && <p className="text-sm text-red-500 text-center pt-6">{error}</p>}

        {!loading && expenses.length === 0 && (
          <p className="text-center text-slate-400 dark:text-slate-500 text-sm mt-10">No expenses this month</p>
        )}

        {/* Date-grouped rows */}
        {grouped.map(([date, rows]) => {
          const dayTotal = rows.reduce((s, e) => s + e.amount, 0);
          return (
            <div key={date}>
              {/* Group header */}
              <div className="flex justify-between items-center px-5 pt-5 pb-2">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  {groupLabel(date)}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{formatCurrency(dayTotal)}</p>
              </div>

              {/* Rows inside a white card */}
              <div className="mx-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
                {rows.map((e, idx) =>
                  editingId === e.id ? (
                    <div key={e.id} className={`p-4 ${idx < rows.length - 1 ? "border-b border-slate-50 dark:border-slate-700/50" : ""}`}>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Input type="number" placeholder="Amount" value={editForm.amount}
                            onChange={(ev) => setEditForm((f) => ({ ...f, amount: ev.target.value }))} className="flex-1" />
                          <Input type="date" value={editForm.date}
                            onChange={(ev) => setEditForm((f) => ({ ...f, date: ev.target.value }))} className="flex-1" />
                        </div>
                        <Input placeholder="Note" value={editForm.note}
                          onChange={(ev) => setEditForm((f) => ({ ...f, note: ev.target.value }))} />
                        <Input placeholder="Category" value={editForm.category}
                          onChange={(ev) => setEditForm((f) => ({ ...f, category: ev.target.value }))} />
                        {editError && <p className="text-xs text-red-500">{editError}</p>}
                        <div className="flex gap-2">
                          <Button onClick={() => saveEdit(e.id)} disabled={editSaving} full>
                            {editSaving ? "Saving…" : "Save"}
                          </Button>
                          <Button variant="secondary" full onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={e.id}
                      className={`flex items-center gap-3 px-4 py-3
                        ${idx < rows.length - 1 ? "border-b border-slate-50 dark:border-slate-700/50" : ""}`}
                    >
                      {/* Emoji badge */}
                      <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-lg shrink-0">
                        {catEmoji(e.category)}
                      </div>

                      {/* Label */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {e.note || e.category || "Expense"}
                        </p>
                        {e.category && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 capitalize truncate">{e.category}</p>
                        )}
                      </div>

                      {/* Amount */}
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 shrink-0">
                        {formatCurrency(e.amount)}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 shrink-0 ml-1">
                        <button onClick={() => startEdit(e)}
                          className="text-xs text-teal-600 font-medium px-1.5 py-1 rounded-lg hover:bg-teal-50">
                          Edit
                        </button>
                        <button onClick={() => remove(e.id)}
                          className="text-slate-300 hover:text-red-400 text-xl px-1 leading-none">
                          ×
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}

        {/* Bottom spacer */}
        <div className="h-4" />
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
