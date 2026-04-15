import { useState, useMemo, useEffect } from "react";
import { useExpenses } from "../../hooks/useExpenses";
import { useProjects } from "../../hooks/useProjects";
import { useSharedList } from "../../hooks/useSharedList";
import { projectsApi } from "../../api/projects.api";
import PageHeader from "../../components/PageHeader";
import Spinner from "../../components/Spinner";
import { formatCurrency, formatDate, currentMonth } from "../../utils/format";

// ── constants ─────────────────────────────────────────────────────────────────

const PALETTE = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#ec4899",
];

// ── helpers ───────────────────────────────────────────────────────────────────

function shiftMonth(ym, delta) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(ym) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

// ── DonutChart ────────────────────────────────────────────────────────────────
// Pure SVG; no library. Each segment is a full circle whose stroke is trimmed
// with stroke-dasharray and rotated into position via the SVG transform attribute.

function DonutChart({ data, size = 140, centerLabel }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const r  = size * 0.34;           // ring radius
  const C  = 2 * Math.PI * r;       // circumference
  const cx = size / 2;
  const cy = size / 2;
  const sw = size * 0.14;           // stroke / ring thickness

  let startAngle = -90;             // first segment starts at 12 o'clock

  return (
    <svg width={size} height={size} className="shrink-0">
      {/* background track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={sw} />

      {data.map((d, i) => {
        const fraction = d.value / total;
        const arcLen   = fraction * C;
        const rotation = startAngle;
        startAngle    += fraction * 360;

        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={sw}
            strokeDasharray={`${arcLen} ${C - arcLen}`}
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />
        );
      })}

      {/* center text */}
      <text
        x={cx} y={cy - 5}
        textAnchor="middle"
        fontSize={size * 0.085}
        fill="#9ca3af"
      >
        Total
      </text>
      <text
        x={cx} y={cy + 10}
        textAnchor="middle"
        fontSize={size * 0.095}
        fontWeight="700"
        fill="#111827"
      >
        {centerLabel}
      </text>
    </svg>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard({ setTab }) {
  const now = currentMonth();
  const [month, setMonth]               = useState(now);
  const [selectedCategory, setSelected] = useState("All");
  const [chartType, setChartType]       = useState("donut");
  const [balance, setBalance]           = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const { expenses, loading: expLoading }  = useExpenses(month);
  const { projects, loading: projLoading } = useProjects();
  const { items,    loading: listLoading } = useSharedList();

  // One-time fetch of outstanding project balance
  useEffect(() => {
    projectsApi.balance()
      .then(setBalance)
      .catch(() => setBalance(null))
      .finally(() => setBalanceLoading(false));
  }, []);

  // ── derived ──────────────────────────────────────────────────────────────────

  const totalExpenses  = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const activeProjects = useMemo(() => projects.filter((p) => p.status !== "completed").length, [projects]);
  const pendingItems   = useMemo(() => items.filter((i) => !i.is_done).length, [items]);

  // Categories with consistent colours — colour index is stable within a month
  const categories = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      const key = e.category || "Uncategorised";
      map[key] = (map[key] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([name, total], i) => ({ name, total, color: PALETTE[i % PALETTE.length] }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const maxCatTotal  = categories[0]?.total ?? 1;
  const donutData    = categories.map((c) => ({ value: c.total, color: c.color }));

  const visibleExpenses = useMemo(() => {
    const base =
      selectedCategory === "All"
        ? expenses
        : expenses.filter((e) => (e.category || "Uncategorised") === selectedCategory);
    return base.slice(0, 10);
  }, [expenses, selectedCategory]);

  const handleMonthChange = (m) => { setMonth(m); setSelected("All"); };
  const isCurrentMonth    = month === now;

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Home" />

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 flex flex-col gap-4">

        {/* ── Month navigation ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleMonthChange(shiftMonth(month, -1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm text-gray-600 text-lg active:bg-gray-50"
          >
            ←
          </button>
          <span className="text-sm font-semibold text-gray-800">{monthLabel(month)}</span>
          <button
            onClick={() => handleMonthChange(shiftMonth(month, 1))}
            disabled={isCurrentMonth}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border shadow-sm text-lg
              ${isCurrentMonth
                ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-white border-gray-100 text-gray-600 active:bg-gray-50"}`}
          >
            →
          </button>
        </div>

        {/* ── 2 × 2 summary tiles ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Expenses */}
          <button
            onClick={() => setTab("expenses")}
            className="bg-green-600 rounded-2xl p-4 flex flex-col items-start active:bg-green-700"
          >
            <span className="text-green-100 text-xs">This month</span>
            <span className="text-white text-xl font-bold mt-1 leading-tight">
              {expLoading ? "…" : formatCurrency(totalExpenses)}
            </span>
            <span className="text-green-200 text-xs mt-0.5">expenses</span>
          </button>

          {/* To be paid */}
          <button
            onClick={() => setTab("projects")}
            className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex flex-col items-start active:bg-orange-100"
          >
            <span className="text-orange-400 text-xs">To be paid</span>
            <span className="text-orange-600 text-xl font-bold mt-1 leading-tight">
              {balanceLoading ? "…" : formatCurrency(balance?.total_balance ?? 0)}
            </span>
            <span className="text-orange-300 text-xs mt-0.5">project balance</span>
          </button>

          {/* Pending items */}
          <button
            onClick={() => setTab("list")}
            className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex flex-col items-start active:bg-gray-50"
          >
            <span className="text-gray-400 text-xs">Shopping</span>
            <span className="text-gray-900 text-xl font-bold mt-1 leading-tight">
              {listLoading ? "…" : pendingItems}
            </span>
            <span className="text-gray-400 text-xs mt-0.5">pending items</span>
          </button>

          {/* Active projects */}
          <button
            onClick={() => setTab("projects")}
            className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex flex-col items-start active:bg-gray-50"
          >
            <span className="text-gray-400 text-xs">Projects</span>
            <span className="text-gray-900 text-xl font-bold mt-1 leading-tight">
              {projLoading ? "…" : activeProjects}
            </span>
            <span className="text-gray-400 text-xs mt-0.5">active</span>
          </button>
        </div>

        {expLoading && <Spinner />}

        {!expLoading && expenses.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-4">
            No expenses in {monthLabel(month)}
          </p>
        )}

        {/* ── Breakdown section ─────────────────────────────────────────────── */}
        {!expLoading && expenses.length > 0 && (
          <>
            {/* Section header + chart toggle */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Breakdown
              </p>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setChartType("donut")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors
                    ${chartType === "donut" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}
                >
                  Donut
                </button>
                <button
                  onClick={() => setChartType("bar")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors
                    ${chartType === "bar" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}
                >
                  Bar
                </button>
              </div>
            </div>

            {/* Chart card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              {chartType === "donut" ? (
                <div className="flex items-center gap-4">
                  <DonutChart
                    data={donutData}
                    size={130}
                    centerLabel={formatCurrency(totalExpenses)}
                  />
                  {/* Legend */}
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    {categories.map((cat) => (
                      <div key={cat.name} className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-xs text-gray-600 truncate flex-1">{cat.name}</span>
                        <span className="text-xs font-semibold text-gray-800 shrink-0">
                          {formatCurrency(cat.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {categories.map((cat) => (
                    <div key={cat.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">{cat.name}</span>
                        <span className="font-semibold text-gray-700">
                          {formatCurrency(cat.total)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${((cat.total / maxCatTotal) * 100).toFixed(1)}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Category filter chips ─────────────────────────────────────── */}
            <div
              className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4"
              style={{ scrollbarWidth: "none" }}
            >
              <button
                onClick={() => setSelected("All")}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                  ${selectedCategory === "All"
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-600 border-gray-200"}`}
              >
                All · {formatCurrency(totalExpenses)}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelected(cat.name)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                    ${selectedCategory === cat.name
                      ? "text-white border-transparent"
                      : "bg-white text-gray-600 border-gray-200"}`}
                  style={
                    selectedCategory === cat.name
                      ? { backgroundColor: cat.color, borderColor: cat.color }
                      : {}
                  }
                >
                  {cat.name} · {formatCurrency(cat.total)}
                </button>
              ))}
            </div>

            {/* ── Expense list ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {visibleExpenses.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">
                  No expenses in this category
                </p>
              ) : (
                visibleExpenses.map((e, idx) => (
                  <div
                    key={e.id}
                    className={`flex items-center justify-between px-4 py-3
                      ${idx < visibleExpenses.length - 1 ? "border-b border-gray-50" : ""}`}
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {e.note || e.category || "—"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {e.category || "Uncategorised"} · {formatDate(e.date)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 shrink-0">
                      {formatCurrency(e.amount)}
                    </p>
                  </div>
                ))
              )}
              <button
                onClick={() => setTab("expenses")}
                className="w-full text-center text-xs text-green-600 font-medium py-3 border-t border-gray-50 active:bg-gray-50"
              >
                View all expenses →
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
