import { useState, useMemo, useEffect } from "react";
import { useExpenses } from "../../hooks/useExpenses";
import { useProjects } from "../../hooks/useProjects";
import { useSharedList } from "../../hooks/useSharedList";
import { projectsApi } from "../../api/projects.api";
import Spinner from "../../components/Spinner";
import PageInfo from "../../components/PageInfo";
import { formatCurrency, formatDate, currentMonth } from "../../utils/format";

// ── constants ─────────────────────────────────────────────────────────────────

const PALETTE = [
  "#0d9488", // teal-600
  "#6366f1", // indigo-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#0891b2", // cyan-600
  "#f43f5e", // rose-500
  "#10b981", // emerald-500
  "#a78bfa", // violet-400
];

// ── helpers ───────────────────────────────────────────────────────────────────


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
      <circle cx={cx} cy={cy} r={r} fill="none" className="stroke-slate-100 dark:stroke-slate-700" strokeWidth={sw} />

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
        className="fill-slate-900 dark:fill-slate-100"
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

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 px-5 pt-14 pb-7">

        {/* Total spent + month picker on same line */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-widest">Total Spent</p>
            <p className="text-white text-4xl font-bold tracking-tight mt-1">
              {expLoading ? "…" : formatCurrency(totalExpenses)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="month"
              value={month}
              max={now}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="bg-white/15 text-white text-xs font-semibold rounded-xl px-3 py-2
                         border-0 outline-none [color-scheme:dark]"
            />
            <PageInfo dark text="Your monthly financial snapshot. See total spending, outstanding project balances, and pending shopping items at a glance. Tap a tile to jump to that section." />
          </div>
        </div>

        {/* Stat chips */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setTab("projects")}
            className="bg-white/10 rounded-xl px-3 py-2 flex-1 text-center active:bg-white/20"
          >
            <p className="text-slate-400 text-xs">To pay</p>
            <p className="text-white text-sm font-bold mt-0.5">
              {balanceLoading ? "…" : formatCurrency(balance?.total_balance ?? 0)}
            </p>
          </button>
          <button
            onClick={() => setTab("list")}
            className="bg-white/10 rounded-xl px-3 py-2 flex-1 text-center active:bg-white/20"
          >
            <p className="text-slate-400 text-xs">Items</p>
            <p className="text-white text-sm font-bold mt-0.5">
              {listLoading ? "…" : pendingItems}
            </p>
          </button>
          <button
            onClick={() => setTab("projects")}
            className="bg-white/10 rounded-xl px-3 py-2 flex-1 text-center active:bg-white/20"
          >
            <p className="text-slate-400 text-xs">Projects</p>
            <p className="text-white text-sm font-bold mt-0.5">
              {projLoading ? "…" : activeProjects}
            </p>
          </button>
        </div>

      </div>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className="bg-slate-50 dark:bg-slate-950 flex-1 overflow-y-auto pb-24">
        <div className="px-4 py-4 flex flex-col gap-4">

          {expLoading && <Spinner />}

          {!expLoading && expenses.length === 0 && (
            <p className="text-center text-slate-400 dark:text-slate-500 text-sm mt-6">
              No expenses in {monthLabel(month)}
            </p>
          )}

          {/* ── Breakdown section ───────────────────────────────────────────── */}
          {!expLoading && expenses.length > 0 && (
            <>
              {/* Section header + chart toggle */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Breakdown
                </p>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-0.5 flex border border-slate-100 dark:border-slate-700 shadow-sm">
                  <button
                    onClick={() => setChartType("donut")}
                    className={chartType === "donut"
                      ? "bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs font-semibold"
                      : "text-slate-400 dark:text-slate-500 px-3 py-1.5 text-xs"}
                  >
                    Donut
                  </button>
                  <button
                    onClick={() => setChartType("bar")}
                    className={chartType === "bar"
                      ? "bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs font-semibold"
                      : "text-slate-400 dark:text-slate-500 px-3 py-1.5 text-xs"}
                  >
                    Bar
                  </button>
                </div>
              </div>

              {/* Chart card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4">
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
                          <span className="text-slate-600 dark:text-slate-300 text-xs truncate flex-1">{cat.name}</span>
                          <span className="text-xs font-semibold text-gray-800 dark:text-slate-200 shrink-0">
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
                          <span className="text-gray-500 dark:text-slate-400">{cat.name}</span>
                          <span className="font-semibold text-gray-700 dark:text-slate-200">
                            {formatCurrency(cat.total)}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
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

              {/* ── Category filter chips ──────────────────────────────────── */}
              <div
                className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4"
                style={{ scrollbarWidth: "none" }}
              >
                <button
                  onClick={() => setSelected("All")}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                    ${selectedCategory === "All"
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-white border-slate-200 text-slate-500"}`}
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
                        : "bg-white border-slate-200 text-slate-500"}`}
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

              {/* ── Expense list ───────────────────────────────────────────── */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
                {visibleExpenses.length === 0 ? (
                  <p className="text-center text-slate-400 dark:text-slate-500 text-sm mt-6 py-6">
                    No expenses in this category
                  </p>
                ) : (
                  visibleExpenses.map((e, idx) => (
                    <div
                      key={e.id}
                      className={`flex items-center justify-between px-4 py-3
                        ${idx < visibleExpenses.length - 1 ? "border-b border-gray-50 dark:border-slate-700/50" : ""}`}
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="text-slate-800 dark:text-slate-100 text-sm font-medium truncate">
                          {e.note || e.category || "—"}
                        </p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">
                          {e.category || "Uncategorised"} · {formatDate(e.date)}
                        </p>
                      </div>
                      <p className="text-slate-900 dark:text-slate-100 text-sm font-semibold shrink-0">
                        {formatCurrency(e.amount)}
                      </p>
                    </div>
                  ))
                )}
                <button
                  onClick={() => setTab("expenses")}
                  className="w-full text-center text-amber-600 text-xs font-semibold py-3 border-t border-gray-50 active:bg-gray-50 dark:active:bg-slate-700"
                >
                  View all expenses →
                </button>
              </div>
            </>
          )}

        </div>
      </div>

    </div>
  );
}
