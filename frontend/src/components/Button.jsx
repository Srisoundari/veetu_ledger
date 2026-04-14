const variants = {
  primary:   "bg-green-600 text-white hover:bg-green-700 active:bg-green-800",
  secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300",
  danger:    "bg-red-500  text-white hover:bg-red-600   active:bg-red-700",
  ghost:     "text-green-600 hover:bg-green-50",
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
