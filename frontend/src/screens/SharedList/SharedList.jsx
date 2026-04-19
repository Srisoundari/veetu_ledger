import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSharedList } from "../../hooks/useSharedList";
import { useAuth } from "../../hooks/useAuth";
import { householdsApi } from "../../api/households.api";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Spinner from "../../components/Spinner";
import PageInfo from "../../components/PageInfo";

export default function SharedList() {
  const { t } = useTranslation();
  const { user, isGuest } = useAuth();
  const [item, setItem]                 = useState("");
  const [qty, setQty]                   = useState("");
  const [loading, setLoading]           = useState(false);
  const [showForm, setShowForm]         = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [members, setMembers]           = useState([]);

  useEffect(() => {
    if (!isGuest) householdsApi.members().then(setMembers).catch(() => {});
  }, [isGuest]);

  const { items, loading: listLoading, error, add, update, markDone, remove, clearDone, refresh } =
    useSharedList();

  const pending   = items.filter((i) => !i.is_done);
  const completed = items.filter((i) =>  i.is_done);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!item.trim()) return;
    setLoading(true);
    try {
      await add({ item_name: item.trim(), quantity: qty.trim() || null });
      setItem(""); setQty(""); setShowForm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">

      {/* ── Violet header ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-teal-600 to-cyan-700 px-5 pt-12 pb-5">

        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-white text-xl font-bold">{t("tabs.list")}</p>
            <PageInfo dark text="A shared shopping list for your household. Tap the circle to mark an item as done. Use 'Add item' to add manually, or the ✦ assistant to add by typing naturally." />
          </div>
          <button
            onClick={refresh}
            className="bg-white/15 text-white text-sm rounded-xl px-3 py-2 active:bg-white/25"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Stat chips */}
        <div className="flex gap-3 mt-4">
          <div className="bg-white/10 rounded-xl px-3 py-2.5 flex-1 text-center">
            <p className="text-teal-200 text-xs">Pending</p>
            <p className="text-white text-base font-bold mt-0.5">{pending.length}</p>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2.5 flex-1 text-center">
            <p className="text-teal-200 text-xs">Done</p>
            <p className="text-white text-base font-bold mt-0.5">{completed.length}</p>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-52 px-4 py-4 flex flex-col gap-3">

        {/* Add form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4">
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Input value={item} onChange={(e) => setItem(e.target.value)}
                  placeholder={t("list.item")} className="flex-1" autoFocus />
                <Input value={qty} onChange={(e) => setQty(e.target.value)}
                  placeholder={t("list.quantity")} className="w-24" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" full disabled={loading || !item.trim()}>
                  {loading ? "…" : t("list.add")}
                </Button>
                <Button variant="secondary" full onClick={() => setShowForm(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </form>
          </div>
        )}

        {listLoading && <Spinner />}
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        {!listLoading && pending.length === 0 && (
          <p className="text-center text-slate-400 dark:text-slate-500 text-sm mt-6">List is empty 🎉</p>
        )}

        {/* Pending items */}
        {pending.length > 0 && (
          <div className="flex flex-col gap-2">
            {pending.map((i) => (
              <ListItem key={i.id} item={i} onDone={markDone} onEdit={update} onRemove={remove} />
            ))}
          </div>
        )}

        {/* Completed items */}
        {completed.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between items-center px-1">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wide">Done</p>
              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Clear {completed.length} items?</span>
                  <button onClick={() => { clearDone(); setConfirmClear(false); }}
                    className="text-xs text-red-500 font-semibold">Yes</button>
                  <button onClick={() => setConfirmClear(false)}
                    className="text-xs text-slate-400">No</button>
                </div>
              ) : (
                <button onClick={() => setConfirmClear(true)}
                  className="text-xs text-red-400 hover:text-red-500">
                  {t("list.clear_done")}
                </button>
              )}
            </div>
            {completed.map((i) => (
              <ListItem key={i.id} item={i} onRemove={remove} done
                members={members} currentUserId={user?.id} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowForm((v) => !v)}
        className="fixed bottom-[88px] right-4 flex items-center gap-1.5 bg-teal-600 text-white
                   pl-3 pr-4 py-2.5 rounded-full shadow-lg shadow-teal-200/60
                   text-sm font-semibold active:bg-teal-700 transition-transform active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add item
      </button>
    </div>
  );
}

// ── ListItem ─────────────────────────────────────────────────────────────────

function ListItem({ item, onDone, onEdit, onRemove, done = false, members = [], currentUserId }) {
  const [editing, setEditing]     = useState(false);
  const [form, setForm]           = useState({ item_name: item.item_name || "", quantity: item.quantity || "" });
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (!editing) setForm({ item_name: item.item_name || "", quantity: item.quantity || "" });
  }, [item.item_name, item.quantity, editing]);

  const save = async () => {
    setSaving(true); setSaveError(null);
    try {
      await onEdit(item.id, { item_name: form.item_name, quantity: form.quantity || null });
      setEditing(false);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input value={form.item_name} onChange={(e) => setForm((f) => ({ ...f, item_name: e.target.value }))}
              placeholder="Item" className="flex-1" autoFocus />
            <Input value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              placeholder="Qty" className="w-20" />
          </div>
          {saveError && <p className="text-xs text-red-500">{saveError}</p>}
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || !form.item_name.trim()} full>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button variant="secondary" full onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm px-4 py-3 flex items-center gap-3 ${done ? "opacity-50" : ""}`}>
      {!done ? (
        <button onClick={() => onDone(item.id)}
          className="w-5 h-5 rounded-full border-2 border-teal-400 shrink-0 active:bg-violet-50" />
      ) : (
        <div className="w-5 h-5 rounded-full bg-teal-500 shrink-0 flex items-center justify-center text-white text-[10px]">✓</div>
      )}

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold text-slate-800 dark:text-slate-100 ${done ? "line-through text-slate-400 dark:text-slate-500" : ""}`}>
          {item.item_name}
        </p>
        {item.quantity && <p className="text-xs text-slate-400 dark:text-slate-500">{item.quantity}</p>}
        {done && item.done_by && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            by {item.done_by === currentUserId
              ? "you"
              : members.find((m) => m.id === item.done_by)?.name || "member"}
          </p>
        )}
      </div>

      {!done && (
        <button onClick={() => setEditing(true)}
          className="text-xs text-teal-600 font-medium px-1.5 py-1 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/30">
          Edit
        </button>
      )}
      <button onClick={() => onRemove(item.id)}
        className="text-slate-300 dark:text-slate-600 hover:text-red-400 text-xl px-1 leading-none">×</button>
    </div>
  );
}
