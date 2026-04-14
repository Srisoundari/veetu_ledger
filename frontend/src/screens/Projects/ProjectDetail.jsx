import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useProjectEntries } from "../../hooks/useProjects";
import { useAuth } from "../../hooks/useAuth";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/Card";
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
  const { entries, summary, loading, error, addEntry, updateEntry, removeEntry } =
    useProjectEntries(project.id);

  const handleSave = async (data) => {
    await addEntry(data);
    setShowForm(false);
  };

  const handleNLPResult = async (parsed) => {
    if (parsed.type !== "project_entry") {
      throw new Error(`Expected a project entry, but got "${parsed.type}". Try rephrasing.`);
    }
    await addEntry({
      entry_date:       parsed.date,
      day_number:       entries.length + 1,
      work_description: parsed.work_description,
      total_amount:     parsed.total_amount,
      paid_amount:      parsed.paid_amount,
    });
    setShowNLP(false);
  };

  const startEditEntry = (entry) => {
    setEditingId(entry.id);
    setEditForm({
      entry_date:       entry.entry_date,
      day_number:       entry.day_number || "",
      work_description: entry.work_description || "",
      total_amount:     entry.total_amount,
      paid_amount:      entry.paid_amount,
    });
  };

  const saveEditEntry = async (id) => {
    setEditSaving(true);
    try {
      await updateEntry(id, {
        ...editForm,
        day_number:   parseInt(editForm.day_number)   || null,
        total_amount: parseFloat(editForm.total_amount),
        paid_amount:  parseFloat(editForm.paid_amount),
      });
      setEditingId(null);
    } finally {
      setEditSaving(false);
    }
  };

  if (showForm) {
    return (
      <>
        <PageHeader title={t("project.add_entry")} onBack={() => setShowForm(false)} />
        <ProjectEntryForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          dayNumber={entries.length + 1}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={project.name} onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 flex flex-col gap-3">
        {/* Summary card */}
        {summary && (
          <Card className="bg-green-600 border-0 text-white">
            <p className="text-green-100 text-xs mb-2">
              {summary.days} {summary.days === 1 ? "day" : "days"} total
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-green-200 text-xs">{t("project.total")}</p>
                <p className="font-bold text-sm">{formatCurrency(summary.total_amount)}</p>
              </div>
              <div>
                <p className="text-green-200 text-xs">{t("project.paid")}</p>
                <p className="font-bold text-sm">{formatCurrency(summary.paid_amount)}</p>
              </div>
              <div>
                <p className="text-green-200 text-xs">{t("project.balance")}</p>
                <p className="font-bold text-sm">{formatCurrency(summary.balance)}</p>
              </div>
            </div>
          </Card>
        )}

        {/* NLP quick entry — signed-in users only */}
        {!isGuest && (
          <div className="bg-green-50 rounded-2xl p-3">
            <button
              onClick={() => setShowNLP((v) => !v)}
              className="text-sm text-green-700 font-medium w-full text-left"
            >
              💬 {showNLP ? "Hide" : t("nlp.placeholder")}
            </button>
            {showNLP && (
              <div className="mt-2">
                <NLPInput onResult={handleNLPResult} />
              </div>
            )}
          </div>
        )}

        {loading && <Spinner />}
        {error   && <p className="text-sm text-red-500 text-center">{error}</p>}

        {!loading && entries.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-6">No entries yet</p>
        )}

        {entries.map((entry) => (
          <Card key={entry.id}>
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
                <div className="flex gap-2">
                  <Button onClick={() => saveEditEntry(entry.id)} disabled={editSaving} full>
                    {editSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="secondary" full onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    {entry.day_number && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Day {entry.day_number}
                      </span>
                    )}
                    <p className="font-medium text-gray-800 mt-1">{entry.work_description || "—"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(entry.entry_date)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEditEntry(entry)}
                      className="text-xs text-green-600 font-medium px-2 py-1 hover:bg-green-50 rounded-lg">
                      Edit
                    </button>
                    <button onClick={() => removeEntry(entry.id)} className="text-gray-300 hover:text-red-400 text-lg px-1">×</button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">{t("project.total")}</p>
                    <p className="font-semibold text-gray-700">{formatCurrency(entry.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">{t("project.paid")}</p>
                    <p className="font-semibold text-green-600">{formatCurrency(entry.paid_amount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">{t("project.balance")}</p>
                    <p className="font-semibold text-orange-500">{formatCurrency(entry.balance)}</p>
                  </div>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-5 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg text-2xl flex items-center justify-center active:bg-green-700"
      >
        +
      </button>
    </div>
  );
}
