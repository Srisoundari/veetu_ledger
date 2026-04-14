export default function PageHeader({ title, onBack, action }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 text-xl"
          >
            ←
          </button>
        )}
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
