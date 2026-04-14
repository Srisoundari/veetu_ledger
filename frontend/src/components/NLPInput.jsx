import { useState } from "react";
import { useTranslation } from "react-i18next";
import { nlpApi } from "../api/nlp.api";
import Button from "./Button";
import Input from "./Input";
import { formatCurrency, formatDate } from "../utils/format";

export default function NLPInput({ onResult }) {
  const { t, i18n } = useTranslation();
  const [text, setText]       = useState("");
  const [parsed, setParsed]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleParse = async () => {
    if (!text.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const result = await nlpApi.parse(text, i18n.language);
      setParsed(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onResult(parsed);
    setParsed(null);
    setText("");
  };

  const handleDiscard = () => {
    setParsed(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("nlp.placeholder")}
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleParse()}
        />
        <Button onClick={handleParse} disabled={loading || !text.trim()}>
          {loading ? "..." : t("nlp.parse")}
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {parsed && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-green-800">{t("nlp.confirm")}</p>

          <ParsedPreview parsed={parsed} />

          <div className="flex gap-2">
            <Button onClick={handleConfirm} full>{t("nlp.save")}</Button>
            <Button onClick={handleDiscard} variant="secondary" full>{t("nlp.edit")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ParsedPreview({ parsed }) {
  if (!parsed) return null;

  const rows = Object.entries(parsed)
    .filter(([k]) => k !== "type")
    .map(([k, v]) => {
      const val = typeof v === "number" && k.includes("amount") || k === "balance" || k === "paid"
        ? formatCurrency(v)
        : k === "date" ? formatDate(v) : String(v);
      return (
        <div key={k} className="flex justify-between text-sm">
          <span className="text-gray-500 capitalize">{k.replace(/_/g, " ")}</span>
          <span className="font-medium text-gray-800">{val}</span>
        </div>
      );
    });

  return <div className="flex flex-col gap-1.5">{rows}</div>;
}
