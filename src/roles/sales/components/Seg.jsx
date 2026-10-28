/** ปุ่มเลือกแบบแท็บ: options = [[key, label], ...] */
export default function Seg({ value, options, onChange }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {options.map(([k, l]) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)}
          className={`rounded-full border px-3 py-1 text-sm ${value === k ? 'border-green-700 bg-green-700 text-white' : 'border-slate-300 dark:border-slate-600'}`}>{l}</button>
      ))}
    </div>
  )
}
