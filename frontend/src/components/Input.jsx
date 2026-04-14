export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  className = "",
  ...rest
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-600">{label}</label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="
          w-full px-4 py-2.5 rounded-xl border border-gray-200
          bg-white text-gray-900 text-sm
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
          placeholder:text-gray-400
        "
        {...rest}
      />
    </div>
  );
}
