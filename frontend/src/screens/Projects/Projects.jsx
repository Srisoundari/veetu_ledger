import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useProjects } from "../../hooks/useProjects";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Spinner from "../../components/Spinner";
import ProjectDetail from "./ProjectDetail";

export default function Projects() {
  const { t } = useTranslation();
  const [selected, setSelected]   = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [name, setName]           = useState("");
  const [desc, setDesc]           = useState("");
  const [loading, setLoading]     = useState(false);
  const { projects, loading: listLoading, error, create, complete, remove } = useProjects();

  if (selected) {
    return <ProjectDetail project={selected} onBack={() => setSelected(null)} />;
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await create({ name, description: desc });
      setName("");
      setDesc("");
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t("tabs.projects")} />

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 flex flex-col gap-3">
        {showForm && (
          <Card>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <Input label={t("project.name")} value={name}
                onChange={(e) => setName(e.target.value)} required />
              <Input label="Description (optional)" value={desc}
                onChange={(e) => setDesc(e.target.value)} />
              <div className="flex gap-2">
                <Button type="submit" full disabled={loading}>
                  {loading ? "..." : "Create"}
                </Button>
                <Button variant="secondary" full onClick={() => setShowForm(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {listLoading && <Spinner />}
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        {!listLoading && projects.length === 0 && !showForm && (
          <p className="text-center text-gray-400 text-sm mt-6">No projects yet</p>
        )}

        {projects.map((p) => (
          <Card key={p.id}>
            {/* Tap row opens detail */}
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setSelected(p)}
            >
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                {p.description && (
                  <p className="text-sm text-gray-400 mt-0.5 truncate">{p.description}</p>
                )}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                p.status === "completed"
                  ? "bg-gray-100 text-gray-400"
                  : "bg-green-100 text-green-700"
              }`}>
                {p.status}
              </span>
            </div>

            {/* Action row */}
            <div className="flex gap-3 mt-3 pt-2.5 border-t border-gray-50">
              {p.status !== "completed" && (
                <button
                  onClick={(e) => { e.stopPropagation(); complete(p.id); }}
                  className="text-xs text-green-600 font-medium hover:text-green-700"
                >
                  ✓ Mark complete
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); remove(p.id); }}
                className="text-xs text-red-400 font-medium hover:text-red-500 ml-auto"
              >
                Delete
              </button>
            </div>
          </Card>
        ))}
      </div>

      <button
        onClick={() => setShowForm((v) => !v)}
        className="fixed bottom-20 right-5 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg text-2xl flex items-center justify-center active:bg-green-700"
      >
        +
      </button>
    </div>
  );
}
