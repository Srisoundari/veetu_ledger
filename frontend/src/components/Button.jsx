const variants = {
  primary:   "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-700",
  secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 dark:active:bg-slate-500",
  danger:    "bg-red-500  text-white hover:bg-red-600   active:bg-red-700",
  ghost:     "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
};

export default function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  full = false,
  type = "button",
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]}
        ${full ? "w-full" : ""}
        px-4 py-2.5 rounded-xl font-medium text-sm
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  );
}
