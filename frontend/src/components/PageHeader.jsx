export default function PageHeader({ title, onBack, action }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100 sticky top-0 z-10 dark:bg-slate-900 dark:border-slate-800">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 text-xl dark:text-slate-400 dark:hover:bg-slate-800"
          >
            ←
          </button>
        )}
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
