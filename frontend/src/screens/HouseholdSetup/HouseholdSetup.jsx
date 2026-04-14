import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/Button";
import Input from "../../components/Input";

const MODES = { CHOOSE: "choose", CREATE: "create", JOIN: "join" };

export default function HouseholdSetup({ onDone }) {
  const { t } = useTranslation();
  const [mode, setMode]     = useState(MODES.CHOOSE);
  const [name, setName]     = useState("");
  const [code, setCode]     = useState("");
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onDone(mode, mode === MODES.CREATE ? name : code);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-gray-800">{t("household.create")}</h2>
        <p className="text-gray-400 text-sm mt-1">Link your household to share data</p>
      </div>

      {mode === MODES.CHOOSE && (
        <div className="flex flex-col gap-4">
          <Button full onClick={() => setMode(MODES.CREATE)}>
            {t("household.create")}
          </Button>
          <Button full variant="secondary" onClick={() => setMode(MODES.JOIN)}>
            {t("household.join")}
          </Button>
        </div>
      )}

      {mode === MODES.CREATE && (
        <form onSubmit={handle} className="flex flex-col gap-4">
          <Input
            label="Household name (e.g. Our Home)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Our Home"
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" full disabled={loading}>
            {loading ? "..." : "Create"}
          </Button>
          <Button variant="ghost" full onClick={() => setMode(MODES.CHOOSE)}>← Back</Button>
        </form>
      )}

      {mode === MODES.JOIN && (
        <form onSubmit={handle} className="flex flex-col gap-4">
          <Input
            label={t("household.invite_code")}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" full disabled={loading}>
            {loading ? "..." : "Join"}
          </Button>
          <Button variant="ghost" full onClick={() => setMode(MODES.CHOOSE)}>← Back</Button>
        </form>
      )}
    </div>
  );
}
