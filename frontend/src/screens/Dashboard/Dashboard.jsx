import { useState, useMemo } from "react";
import { useDashboard } from "../../hooks/useDashboard";
import Spinner from "../../components/Spinner";
import PageInfo from "../../components/PageInfo";
import { formatCurrency, formatDate, currentMonth } from "../../utils/format";

const PALETTE = [
  "#0d9488", "#6366f1", "#f59e0b", "#8b5cf6",
  "#0891b2", "#f43f5e", "#10b981", "#a78bfa",
];

function monthLabel(ym) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

// ── DonutChart ────────────────────────────────────────────────────────────────
function DonutChart({ data, size = 140, centerLabel }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const r = size * 0.34;
  const C = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  const sw = size * 0.14;
  let startAngle = -90;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none"
        className="stroke-slate-100 dark:stroke-slate-700" strokeWidth={sw} />
      {data.map((d, i) => {
        const fraction = d.value / total;
        const arcLen = fraction * C;
        const rotation = startAngle;
        startAngle += fraction * 360;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={d.color} strokeWidth={sw}
            strokeDasharray={`${arcLen} ${C - arcLen}`}
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />
        );
      })}
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize={size * 0.085} fill="#9ca3af">
        Total
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={size * 0.095} fontWeight="700"
        className="fill-slate-900 dark:fill-slate-100">
        {centerLabel}
      </text>
    </svg>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard({ setTab }) {
  const now = currentMonth();
  const [month, setMonth] = useState(now);
  const [selectedCat, setSelected] = useState("All");
  const [chartType, setChartType] = useState("donut");

  const { data, loading, error } = useDashboard(month);

  // Attach colours to categories
  const categories = useMemo(() =>
    (data?.categories ?? []).map((c, i) => ({ ...c, color: PALETTE[i % PALETTE.length] })),
    [data]);

  const donutData = categories.map((c) => ({ value: c.total, color: c.color }));
  const maxCatTotal = categories[0]?.total ?? 1;

  const visibleExpenses = useMemo(() => {
    const all = data?.recent_expenses ?? [];
    const filtered = selectedCat === "All"
      ? all
      : all.filter((e) => (e.category || "Uncategorised") === selectedCat);

    // Group by description + category, summing amounts
    const groups = new Map();
    for (const e of filtered) {
      const title = e.description || e.category || "—";
      const key = `${title}::${e.category || "Uncategorised"}`;
      const g = groups.get(key);
      if (g) {
        g.amount += e.amount || 0;
        g.count += 1;
        if (e.date > g.date) g.date = e.date;
      } else {
        groups.set(key, {
          id: e.id,
          title,
          category: e.category,
          amount: e.amount || 0,
          date: e.date,
          count: 1,
        });
      }
    }
    return Array.from(groups.values()).sort((a, b) => b.amount - a.amount);
  }, [data, selectedCat]);

  const handleMonthChange = (m) => { setMonth(m); setSelected("All"); };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 px-5 pt-6 pb-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-widest">Total Spent</p>
            <p className="text-white text-3xl font-bold tracking-tight mt-1">
              {loading ? "…" : formatCurrency(data?.total_spent ?? 0)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="month" value={month} max={now}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="bg-white/15 text-white text-xs font-semibold rounded-xl px-3 py-2
                         border-0 outline-none [color-scheme:dark]"
            />
            <PageInfo dark text="Your monthly financial snapshot. Tap a tile to jump to that section." />
          </div>
        </div>

        {/* Stat chips */}
        <div className="flex gap-3 mt-4">
          <button onClick={() => setTab("finance")}
            className="bg-white/10 rounded-xl px-3 py-2 flex-1 text-center active:bg-white/20">
            <p className="text-slate-400 text-xs">To Pay</p>
            <p className="text-white text-sm font-bold mt-0.5">
              {loading ? "…" : formatCurrency(data?.outstanding_balance ?? 0)}
            </p>
          </button>
          <button onClick={() => setTab("list")}
            className="bg-white/10 rounded-xl px-3 py-2 flex-1 text-center active:bg-white/20">
            <p className="text-slate-400 text-xs">To buy</p>
            <p className="text-white text-sm font-bold mt-0.5">
              {loading ? "…" : (data?.pending_items ?? 0)}
            </p>
          </button>
          <button onClick={() => setTab("finance")}
            className="bg-white/10 rounded-xl px-3 py-2 flex-1 text-center active:bg-white/20">
            <p className="text-slate-400 text-xs">Categories</p>
            <p className="text-white text-sm font-bold mt-0.5">
              {loading ? "…" : (data?.active_projects ?? 0)}
            </p>
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-52">
        <div className="px-4 py-4 flex flex-col gap-4">

          {loading && <Spinner />}
          {error && <p className="text-sm text-red-500 text-center mt-6">{error}</p>}

          {!loading && !error && (data?.recent_expenses ?? []).length === 0 && (
            <p className="text-center text-slate-400 dark:text-slate-500 text-sm mt-6">
              No expenses in {monthLabel(month)}
            </p>
          )}

          {!loading && !error && categories.length > 0 && (
            <>
              {/* Section header + chart toggle */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Breakdown
                </p>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-0.5 flex border border-slate-100 dark:border-slate-700 shadow-sm">
                  {["donut", "bar"].map((t) => (
                    <button key={t} onClick={() => setChartType(t)}
                      className={t === chartType
                        ? "bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs font-semibold"
                        : "text-slate-400 dark:text-slate-500 px-3 py-1.5 text-xs capitalize"}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4">
                {chartType === "donut" ? (
                  <div className="flex items-center gap-4">
                    <DonutChart data={donutData} size={130}
                      centerLabel={formatCurrency(data.total_spent)} />
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      {categories.map((cat) => (
                        <div key={cat.name} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }} />
                          <span className="text-slate-600 dark:text-slate-300 text-xs truncate flex-1">
                            {cat.name}
                          </span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 shrink-0">
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
                          <span className="text-slate-500 dark:text-slate-400">{cat.name}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {formatCurrency(cat.total)}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${((cat.total / maxCatTotal) * 100).toFixed(1)}%`,
                              backgroundColor: cat.color,
                            }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Category filter chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4"
                style={{ scrollbarWidth: "none" }}>
                <button onClick={() => setSelected("All")}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                    ${selectedCat === "All"
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"}`}>
                  All · {formatCurrency(data.total_spent)}
                </button>
                {categories.map((cat) => (
                  <button key={cat.name} onClick={() => setSelected(cat.name)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                      ${selectedCat === cat.name
                        ? "text-white border-transparent"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"}`}
                    style={selectedCat === cat.name
                      ? { backgroundColor: cat.color, borderColor: cat.color } : {}}>
                    {cat.name} · {formatCurrency(cat.total)}
                  </button>
                ))}
              </div>

              {/* Expense list */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
                {visibleExpenses.length === 0 ? (
                  <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-6">
                    No expenses in this category
                  </p>
                ) : (
                  visibleExpenses.map((e, idx) => (
                    <div key={e.id}
                      className={`flex items-center justify-between px-4 py-3
                        ${idx < visibleExpenses.length - 1
                          ? "border-b border-slate-50 dark:border-slate-700/50" : ""}`}>
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="text-slate-800 dark:text-slate-100 text-sm font-medium truncate">
                          {e.title}
                          {e.count > 1 && (
                            <span className="ml-1.5 text-xs text-slate-400 font-normal">×{e.count}</span>
                          )}
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
                <button onClick={() => setTab("finance")}
                  className="w-full text-center text-amber-600 text-xs font-semibold py-3
                             border-t border-slate-50 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-700">
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
