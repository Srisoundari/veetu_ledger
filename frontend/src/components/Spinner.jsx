export default function Spinner({ className = "" }) {
  return (
    <div className={`flex justify-center items-center py-10 ${className}`}>
      <div className="w-8 h-8 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
    </div>
  );
}
