import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSharedList } from "../../hooks/useSharedList";
import { useAuth } from "../../hooks/useAuth";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Spinner from "../../components/Spinner";
import NLPInput from "../../components/NLPInput";

export default function SharedList() {
  const { t } = useTranslation();
  const { isGuest } = useAuth();
  const [item, setItem]       = useState("");
  const [qty, setQty]         = useState("");
  const [loading, setLoading] = useState(false);
  const [showNLP, setShowNLP] = useState(false);
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
      setItem("");
      setQty("");
    } finally {
      setLoading(false);
    }
  };

  const handleNLPResult = async (savedItems) => {
    const newItems = savedItems.filter((i) => i.type === "list_item");
    if (newItems.length === 0) throw new Error("No list items found. Try rephrasing.");
    await refresh();
    setShowNLP(false);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={t("tabs.list")}
        action={
          <button onClick={refresh} className="text-sm text-green-600 font-medium px-2">
            ↻ Refresh
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 flex flex-col gap-3">
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

        {/* Add item form */}
        <Card>
          <form onSubmit={handleAdd} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder={t("list.item")}
                className="flex-1"
              />
              <Input
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder={t("list.quantity")}
                className="w-24"
              />
            </div>
            <Button type="submit" full disabled={loading || !item.trim()}>
              {loading ? "..." : t("list.add")}
            </Button>
          </form>
        </Card>

        {listLoading && <Spinner />}
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        {/* Pending items */}
        {pending.length > 0 && (
          <div className="flex flex-col gap-2">
            {pending.map((i) => (
              <ListItem key={i.id} item={i} onDone={markDone} onEdit={update} onRemove={remove} />
            ))}
          </div>
        )}

        {!listLoading && pending.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-4">List is empty 🎉</p>
        )}

        {/* Completed items */}
        {completed.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Done</p>
              <button
                onClick={clearDone}
                className="text-xs text-red-400 hover:text-red-500"
              >
                {t("list.clear_done")}
              </button>
            </div>
            {completed.map((i) => (
              <ListItem key={i.id} item={i} onRemove={remove} done />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ListItem({ item, onDone, onEdit, onRemove, done = false }) {
  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState({ item_name: item.item_name || "", quantity: item.quantity || "" });
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Re-sync form whenever the item data changes (e.g. after a refresh brings new values)
  useEffect(() => {
    if (!editing) {
      setForm({ item_name: item.item_name || "", quantity: item.quantity || "" });
    }
  }, [item.item_name, item.quantity, editing]);

  const startEdit = () => {
    setForm({ item_name: item.item_name || "", quantity: item.quantity || "" });
    setSaveError(null);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
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
      <Card>
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
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="secondary" full onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={done ? "opacity-50" : ""}>
      <div className="flex items-center gap-3">
        {!done && (
          <button onClick={() => onDone(item.id)}
            className="w-6 h-6 rounded-full border-2 border-green-400 flex-shrink-0 hover:bg-green-100" />
        )}
        {done && (
          <div className="w-6 h-6 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center text-white text-xs">✓</div>
        )}
        <div className="flex-1">
          <p className={`font-medium text-gray-800 ${done ? "line-through" : ""}`}>{item.item_name}</p>
          {item.quantity && <p className="text-xs text-gray-400">{item.quantity}</p>}
        </div>
        {!done && (
          <button onClick={startEdit}
            className="text-xs text-green-600 font-medium px-1 hover:text-green-700">
            Edit
          </button>
        )}
        <button onClick={() => onRemove(item.id)} className="text-gray-300 hover:text-red-400 text-lg px-1">×</button>
      </div>
    </Card>
  );
}
