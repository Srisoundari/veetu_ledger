import { useState } from "react";
import Expenses from "../Expenses/Expenses";
import Projects from "../Projects/Projects";

function SubTabBar({ value, onChange }) {
  return (
    <div className="flex gap-1 bg-white/10 rounded-xl p-1 mb-4">
      <button
        onClick={() => onChange("expenses")}
        className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors
          ${value === "expenses" ? "bg-white text-teal-700" : "text-white/70 hover:text-white"}`}
      >
        ₹ Expenses
      </button>
      <button
        onClick={() => onChange("projects")}
        className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors
          ${value === "projects" ? "bg-white text-teal-700" : "text-white/70 hover:text-white"}`}
      >
        ⬡ Projects
      </button>
    </div>
  );
}

export default function Finance({ defaultSub = "expenses" }) {
  const [sub, setSub] = useState(defaultSub);
  const switcher = <SubTabBar value={sub} onChange={setSub} />;

  return sub === "expenses"
    ? <Expenses subTabBar={switcher} />
    : <Projects subTabBar={switcher} />;
}
