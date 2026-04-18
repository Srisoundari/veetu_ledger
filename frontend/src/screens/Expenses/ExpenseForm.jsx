import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { toISODate } from "../../utils/format";

const CATEGORIES = ["groceries", "utilities", "transport", "food", "health", "other"];

export default function ExpenseForm({ onSave, onCancel, initial = {} }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    date:     initial.date     || toISODate(),
    amount:   initial.amount   || "",
    note:     initial.note     || "",
    category: initial.category || "other",
  });
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ ...form, amount: parseFloat(form.amount) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <Input label={t("expense.amount")} type="number" value={form.amount}
        onChange={set("amount")} placeholder="0" required />
      <Input label={t("expense.note")}   value={form.note}
        onChange={set("note")} placeholder="Rice, electricity..." />
      <Input label={t("expense.date")}   type="date" value={form.date}
        onChange={set("date")} required />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600 dark:text-slate-400">{t("expense.category")}</label>
        <select
          value={form.category}
          onChange={set("category")}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 mt-2">
        <Button type="submit" full disabled={loading}>{loading ? "..." : t("nlp.save")}</Button>
        <Button variant="secondary" full onClick={onCancel}>{t("common.cancel")}</Button>
      </div>
    </form>
  );
}
