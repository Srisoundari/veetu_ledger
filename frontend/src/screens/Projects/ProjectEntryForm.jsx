import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { toISODate } from "../../utils/format";

export default function ProjectEntryForm({ onSave, onCancel }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    date:        toISODate(),
    description: "",
    amount:      "",
    paid_amount: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const amount = parseFloat(form.amount);
      const paid   = form.paid_amount === "" ? amount : parseFloat(form.paid_amount);
      await onSave({
        date:        form.date,
        description: form.description,
        amount,
        paid_amount: paid,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <Input label="Description" value={form.description}
        onChange={set("description")} placeholder="e.g. Tiles, Plumbing…" autoFocus />
      <Input label="Date" type="date" value={form.date}
        onChange={set("date")} required />
      <Input label="Amount" type="number" value={form.amount}
        onChange={set("amount")} placeholder="0" required />
      <Input label="Paid (leave blank if fully paid)" type="number" value={form.paid_amount}
        onChange={set("paid_amount")} placeholder="= amount" />
      <div className="flex gap-2 mt-2">
        <Button type="submit" full disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
        <Button variant="secondary" full onClick={onCancel}>{t("common.cancel")}</Button>
      </div>
    </form>
  );
}
