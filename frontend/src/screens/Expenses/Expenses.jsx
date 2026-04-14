import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useExpenses } from "../../hooks/useExpenses";
import { useAuth } from "../../hooks/useAuth";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Spinner from "../../components/Spinner";
import NLPInput from "../../components/NLPInput";
import ExpenseForm from "./ExpenseForm";
import { formatCurrency, formatDate, currentMonth } from "../../utils/format";

export default function Expenses() {
  const { t } = useTranslation();
  const [month, setMonth]       = useState(currentMonth());
  const [showForm, setShowForm] = useState(false);
  const [showNLP, setShowNLP]   = useState(false);
  const { isGuest } = useAuth();
  const { expenses, loading, error, add, remove } = useExpenses(month);

  const handleSave = async (data) => {
    await add(data);
    setShowForm(false);
  };

  const handleNLPResult = async (parsed) => {
    if (parsed.type === "expense") {
      await add({
        date:     parsed.date,
        amount:   parsed.amount,
        note:     parsed.note,
        category: parsed.category,
      });
      setShowNLP(false);
    }
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (showForm) {
    return (
      <>
        <PageHeader title={t("expense.add")} onBack={() => setShowForm(false)} />
        <ExpenseForm onSave={handleSave} onCancel={() => setShowForm(false)} />
      </>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={t("tabs.expenses")}
        action={
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
          />
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 flex flex-col gap-3">
        {/* NLP quick entry — signed-in users only */}
        {!isGuest && <div className="bg-green-50 rounded-2xl p-3">
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
        </div>}

        {/* Monthly total */}
        <Card className="bg-green-600 border-0">
          <p className="text-green-100 text-sm">Total this month</p>
          <p className="text-white text-2xl font-bold mt-1">{formatCurrency(total)}</p>
        </Card>

        {loading && <Spinner />}
        {error   && <p className="text-sm text-red-500 text-center">{error}</p>}

        {!loading && expenses.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-6">No expenses this month</p>
        )}

        {expenses.map((e) => (
          <Card key={e.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">{formatCurrency(e.amount)}</p>
              <p className="text-sm text-gray-400">{e.note || e.category} · {formatDate(e.date)}</p>
            </div>
            <button
              onClick={() => remove(e.id)}
              className="text-gray-300 hover:text-red-400 text-lg px-2"
            >
              ×
            </button>
          </Card>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-5 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg text-2xl flex items-center justify-center active:bg-green-700"
      >
        +
      </button>
    </div>
  );
}
