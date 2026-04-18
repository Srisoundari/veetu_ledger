import { useState } from "react";
import { useTranslation } from "react-i18next";
import { nlpApi } from "../api/nlp.api";
import Button from "./Button";
import Input from "./Input";
import { formatCurrency, formatDate } from "../utils/format";

// projectId — pass when used inside ProjectDetail so entries are linked to it
// fillOnly  — skips /nlp/save and passes parsed items straight to onResult (for form pre-fill)
export default function NLPInput({ onResult, projectId = null, fillOnly = false }) {
  const { t, i18n } = useTranslation();
  const [text, setText]       = useState("");
  const [parsed, setParsed]   = useState(null);   // array | null
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const items = await nlpApi.parse(text, i18n.language);
      setParsed(items);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = fillOnly ? parsed : await nlpApi.save(parsed, projectId);
      await onResult(result);
      setParsed(null);
      setText("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    setParsed(null);
    setError(null);
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
          {loading && !parsed ? "..." : t("nlp.parse")}
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {parsed && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 dark:bg-slate-800 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {parsed.length === 1 ? t("nlp.confirm") : `${parsed.length} items to save`}
          </p>

          <div className="flex flex-col gap-2">
            {parsed.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-3 border border-slate-100 dark:bg-slate-700 dark:border-slate-600">
                <span className="text-xs font-medium text-teal-600 uppercase tracking-wide mb-1.5 block dark:text-teal-400">
                  {item.type?.replace("_", " ")}
                </span>
                <ParsedPreview parsed={item} />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleConfirm} disabled={loading} full>
              {loading ? "Saving..." : t("nlp.save")}
            </Button>
            <Button onClick={handleDiscard} variant="secondary" full>
              {t("nlp.edit")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ParsedPreview({ parsed }) {
  if (!parsed) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {Object.entries(parsed)
        .filter(([k]) => k !== "type")
        .map(([k, v]) => {
          const isAmount = typeof v === "number" && (k.includes("amount") || k === "balance" || k === "paid");
          const val = isAmount ? formatCurrency(v) : k === "date" ? formatDate(v) : String(v ?? "");
          return (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-gray-500 capitalize dark:text-slate-400">{k.replace(/_/g, " ")}</span>
              <span className="font-medium text-gray-800 dark:text-slate-200">{val}</span>
            </div>
          );
        })}
    </div>
  );
}
