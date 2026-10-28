/** ปุ่มสลับมุมมอง (pill) — options = [[key, label], ...] */
export default function Seg({ value, onChange, options, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map(([k, l]) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)}
          className={`rounded-full border px-3 py-1 text-sm ${value === k ? 'border-rose-700 bg-rose-700 text-white' : 'border-slate-300 dark:border-slate-600'}`}>{l}</button>
      ))}
    </div>
  )
}
