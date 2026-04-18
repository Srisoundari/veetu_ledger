import { useState } from "react";

const InfoIcon = ({ dark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={dark ? "text-white/70" : "text-slate-400"}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <circle cx="12" cy="8" r="0.5" fill="currentColor" strokeWidth="0" />
  </svg>
);

export default function PageInfo({ text, dark = false }) {
  const [show, setShow] = useState(false);

  return (
    <>
      <button onClick={() => setShow(true)} className="flex items-center" aria-label="Page info">
        <InfoIcon dark={dark} />
      </button>

      {show && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setShow(false)} />
          <div className="fixed bottom-24 inset-x-4 z-50 bg-slate-900 rounded-2xl p-5 shadow-2xl">
            <p className="text-white text-sm leading-relaxed">{text}</p>
            <button onClick={() => setShow(false)} className="mt-4 text-slate-400 text-xs">
              Got it ✕
            </button>
          </div>
        </>
      )}
    </>
  );
}
