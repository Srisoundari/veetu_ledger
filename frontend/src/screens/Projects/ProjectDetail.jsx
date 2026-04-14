import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useProjectEntries } from "../../hooks/useProjects";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/Card";
import Spinner from "../../components/Spinner";
import ProjectEntryForm from "./ProjectEntryForm";
import { formatCurrency, formatDate } from "../../utils/format";

export default function ProjectDetail({ project, onBack }) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const { entries, summary, loading, error, addEntry, removeEntry } =
    useProjectEntries(project.id);

  const handleSave = async (data) => {
    await addEntry(data);
    setShowForm(false);
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

        {loading && <Spinner />}
        {error   && <p className="text-sm text-red-500 text-center">{error}</p>}

        {!loading && entries.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-6">No entries yet</p>
        )}

        {entries.map((entry) => (
          <Card key={entry.id}>
            <div className="flex justify-between items-start">
              <div>
                {entry.day_number && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    Day {entry.day_number}
                  </span>
                )}
                <p className="font-medium text-gray-800 mt-1">
                  {entry.work_description || "—"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(entry.entry_date)}</p>
              </div>
              <button
                onClick={() => removeEntry(entry.id)}
                className="text-gray-300 hover:text-red-400 text-lg px-1"
              >
                ×
              </button>
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
