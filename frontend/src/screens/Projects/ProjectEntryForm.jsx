import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { toISODate } from "../../utils/format";

export default function ProjectEntryForm({ onSave, onCancel }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    entry_date:       toISODate(),
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
        total_amount: parseFloat(form.total_amount),
        paid_amount:  parseFloat(form.paid_amount) || 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <Input label="Description" value={form.work_description}
        onChange={set("work_description")} placeholder="e.g. Tiles, Plumbing…" autoFocus />
      <Input label="Date" type="date" value={form.entry_date}
        onChange={set("entry_date")} required />
      <Input label="Amount" type="number" value={form.total_amount}
        onChange={set("total_amount")} placeholder="0" required />
      <Input label="Paid (leave 0 if yet to pay)" type="number" value={form.paid_amount}
        onChange={set("paid_amount")} placeholder="0" />
      <div className="flex gap-2 mt-2">
        <Button type="submit" full disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
        <Button variant="secondary" full onClick={onCancel}>{t("common.cancel")}</Button>
      </div>
    </form>
  );
}
