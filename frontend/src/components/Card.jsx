export default function Card({ children, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-sm border border-gray-100 p-4 dark:bg-slate-800 dark:border-slate-700
        ${onClick ? "cursor-pointer active:bg-gray-50 dark:active:bg-slate-700" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
