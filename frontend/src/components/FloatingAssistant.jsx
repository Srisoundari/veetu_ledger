import { useState, useRef, useEffect } from "react";
import { nlpApi } from "../api/nlp.api";
import { projectsApi } from "../api/projects.api";
import { formatCurrency, formatDate } from "../utils/format";
import { useTranslation } from "react-i18next";

/**
 * Global floating NLP assistant.
 * - Collapsed: a ✦ button fixed bottom-right
 * - Expanded:  a floating panel slides up above the button
 * - After save, navigates to the relevant tab via onSaved(type)
 */
export default function FloatingAssistant({ onSaved }) {
  const { i18n } = useTranslation();
  const [open, setOpen]         = useState(false);
  const [text, setText]         = useState("");
  const [parsed, setParsed]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [done, setDone]         = useState(false);

  // Group picker state (only shown when project_entry items are parsed)
  const [groups, setGroups]         = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");

  const textareaRef = useRef(null);

  // Focus textarea when panel opens
  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [open]);

  const reset = () => {
    setParsed(null); setText(""); setError(null); setDone(false);
    setGroups([]); setSelectedGroup("");
  };

  const close = () => { reset(); setOpen(false); };

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true); setError(null);
    try {
      const result = await nlpApi.parse(text, i18n.language);
      setParsed(result);
      // If any expense items, load groups so user can optionally attach them to one.
      // Auto-select the first active group — user can click "None" to override.
      if (result.some((i) => i.type === "expense" || i.type === "project_entry")) {
        const all = await projectsApi.list();
        const active = all.filter((p) => p.status !== "completed");
        setGroups(active);
        if (active.length > 0) setSelectedGroup(active[0].id);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true); setError(null);
    try {
      await nlpApi.save(parsed, selectedGroup || null);
      setDone(true);
      const type = parsed[0]?.type;
      onSaved?.(type);
      setTimeout(() => { close(); }, 1200);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Tap-outside overlay */}
      {open && (
        <div className="fixed inset-0 z-30" onClick={close} />
      )}

      {/* Floating panel */}
      {open && (
        <div
          className="fixed right-4 z-40 w-[21rem] bg-white rounded-2xl shadow-2xl overflow-hidden dark:bg-slate-800"
          style={{ bottom: "144px" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">✦</span>
              <p className="text-white text-sm font-semibold">Assistant</p>
            </div>
            <button onClick={close} className="text-slate-400 hover:text-white text-xl leading-none px-1">
              ×
            </button>
          </div>

          <div className="p-4 flex flex-col gap-3">
            {done ? (
              /* Success state */
              <div className="py-5 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-2xl dark:bg-teal-900">
                  ✓
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Saved!</p>
              </div>
            ) : (
              <>
                {/* Text input */}
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => { setText(e.target.value); if (parsed) { setParsed(null); setGroups([]); setSelectedGroup(""); } }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleParse(); }
                  }}
                  placeholder={"e.g. spent ₹450 on groceries today\nor paste a WhatsApp expense report…"}
                  rows={3}
                  className="w-full text-sm text-slate-800 placeholder-slate-400 bg-slate-50
                             border border-slate-200 rounded-xl px-3 py-2.5 resize-none
                             focus:outline-none focus:border-slate-400 focus:bg-white transition-colors
                             dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:bg-slate-700 dark:focus:border-slate-500"
                />

                {error && <p className="text-xs text-red-500 -mt-1">{error}</p>}

                {/* Group picker — optional destination for expense items */}
                {parsed && groups.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Attach to category <span className="text-slate-300 dark:text-slate-600">(optional)</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setSelectedGroup("")}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                          selectedGroup === ""
                            ? "bg-slate-900 text-white dark:bg-slate-700"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        None
                      </button>
                      {groups.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => setSelectedGroup(g.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                            selectedGroup === g.id
                              ? "bg-teal-600 text-white"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Parsed preview cards */}
                {parsed && (
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-0.5">
                    {parsed.map((item, i) => (
                      <div key={i} className="rounded-xl p-3 border bg-slate-50 border-slate-100 dark:bg-slate-700 dark:border-slate-600">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                          {item.type?.replace(/_/g, " ")}
                        </p>
                        <ParsedRow item={item} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                {!parsed ? (
                  <button
                    onClick={handleParse}
                    disabled={loading || !text.trim()}
                    className="w-full bg-slate-900 text-white text-sm font-semibold py-3 rounded-xl
                               disabled:opacity-40 active:bg-slate-800 transition-opacity"
                  >
                    {loading ? "Thinking…" : "Parse ↵"}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-xl
                                 disabled:opacity-40 active:bg-slate-800"
                    >
                      {loading ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => { setParsed(null); setError(null); setGroups([]); setSelectedGroup(""); }}
                      className="flex-1 bg-slate-100 text-slate-600 text-sm font-medium py-2.5 rounded-xl
                                 active:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`fixed right-4 z-40 w-12 h-12 rounded-full shadow-lg
                    flex items-center justify-center text-lg font-bold
                    transition-all duration-200
                    ${open
                      ? "bg-slate-700 text-white scale-95"
                      : "bg-slate-900 text-white active:scale-95"}`}
        style={{ bottom: "144px" }}
      >
        {open ? "×" : "✦"}
      </button>
    </>
  );
}

function ParsedRow({ item }) {
  return (
    <div className="flex flex-col gap-1.5">
      {Object.entries(item)
        .filter(([k]) => k !== "type")
        .map(([k, v]) => {
          const isAmt    = typeof v === "number" && (k.includes("amount") || k === "balance");
          const isDate   = k === "date" || k === "entry_date";
          const display  = isAmt  ? formatCurrency(v)
                         : isDate ? formatDate(String(v))
                         : String(v ?? "—");
          return (
            <div key={k} className="flex justify-between items-baseline text-xs gap-2">
              <span className="text-slate-400 capitalize shrink-0">{k.replace(/_/g, " ")}</span>
              <span className="font-semibold text-slate-700 text-right dark:text-slate-200">{display}</span>
            </div>
          );
        })}
    </div>
  );
}
