export default function Card({ children, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-sm border border-gray-100 p-4
        ${onClick ? "cursor-pointer active:bg-gray-50" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
