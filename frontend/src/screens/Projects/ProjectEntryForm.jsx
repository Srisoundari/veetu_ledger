import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/Button";
import Input from "../../components/Input";
import NLPInput from "../../components/NLPInput";
import { toISODate } from "../../utils/format";

export default function ProjectEntryForm({ onSave, onCancel, dayNumber }) {
  const { t } = useTranslation();
  const [showNLP, setShowNLP] = useState(false);
  const [form, setForm] = useState({
    entry_date:       toISODate(),
    day_number:       dayNumber || "",
    work_description: "",
    total_amount:     "",
    paid_amount:      "",
  });
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        ...form,
        day_number:   parseInt(form.day_number)   || null,
        total_amount: parseFloat(form.total_amount),
        paid_amount:  parseFloat(form.paid_amount),
      });
    } finally {
      setLoading(false);
    }
  };

  // ProjectEntryForm uses NLPInput only to pre-fill fields (no DB save from here).
  // We call nlpApi.parse directly and fill from the first project_entry in the result.
  const handleNLPResult = async (savedItems) => {
    const entry = savedItems.find((i) => i.type === "project_entry");
    if (!entry) throw new Error("No project entry found. Try rephrasing.");
    setForm((f) => ({
      ...f,
      entry_date:       entry.entry_date  || entry.date || f.entry_date,
      work_description: entry.work_description          || f.work_description,
      total_amount:     entry.total_amount              ?? f.total_amount,
      paid_amount:      entry.paid_amount               ?? f.paid_amount,
    }));
    setShowNLP(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      {/* NLP quick fill */}
      <div className="bg-blue-50 dark:bg-slate-700 rounded-2xl p-3">
        <button
          type="button"
          onClick={() => setShowNLP((v) => !v)}
          className="text-sm text-blue-700 dark:text-blue-300 font-medium"
        >
          💬 {showNLP ? "Hide" : "Fill from text"}
        </button>
        {showNLP && (
          <div className="mt-2">
            <NLPInput onResult={handleNLPResult} fillOnly />
          </div>
        )}
      </div>

      <Input label={t("project.day")}  type="number" value={form.day_number}
        onChange={set("day_number")} placeholder="1" />
      <Input label={t("project.work")} value={form.work_description}
        onChange={set("work_description")} placeholder="Tiling, plumbing..." />
      <Input label={t("project.total")} type="number" value={form.total_amount}
        onChange={set("total_amount")} placeholder="0" required />
      <Input label={t("project.paid")}  type="number" value={form.paid_amount}
        onChange={set("paid_amount")} placeholder="0" required />
      <Input label={t("expense.date")}  type="date" value={form.entry_date}
        onChange={set("entry_date")} required />

      <div className="flex gap-2 mt-2">
        <Button type="submit" full disabled={loading}>{loading ? "..." : t("nlp.save")}</Button>
        <Button variant="secondary" full onClick={onCancel}>{t("common.cancel")}</Button>
      </div>
    </form>
  );
}
