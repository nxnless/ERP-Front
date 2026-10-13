import { createContext, useCallback, useContext, useState } from 'react'

export * from '../format'

// ---------- องค์ประกอบพื้นฐาน ----------
const TONES = {
  ok: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  warn: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  bad: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  accent: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  muted: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}
export const Tag = ({ tone = 'muted', children }) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>{children}</span>
)

export const Card = ({ className = '', children }) => (
  <div className={`rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 ${className}`}>{children}</div>
)

export const PageHeader = ({ title, sub }) => (
  <header className="mb-5">
    <h1 className="text-xl font-semibold">{title}</h1>
    {sub && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{sub}</p>}
  </header>
)

const BTN = {
  primary: 'bg-rose-700 text-white hover:bg-rose-800 disabled:hover:bg-rose-700',
  ghost: 'border border-slate-300 bg-white hover:border-rose-600 dark:border-slate-600 dark:bg-slate-900',
  danger: 'border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950',
}
export const Button = ({ variant = 'primary', className = '', ...p }) => (
  <button type="button" {...p} className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${BTN[variant]} ${className}`} />
)

export const inputCls =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 dark:border-slate-600 dark:bg-slate-900'
export const Field = ({ label, hint, children, className = '' }) => (
  <label className={`block text-sm ${className}`}>
    <span className="mb-1 block text-slate-600 dark:text-slate-300">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
  </label>
)
export const Input = ({ className = '', ...p }) => <input {...p} className={`${inputCls} ${className}`} />
export const Select = ({ children, ...p }) => <select {...p} className={inputCls}>{children}</select>
export const Textarea = (p) => <textarea rows={2} {...p} className={inputCls} />

export const Notice = ({ tone = 'warn', children }) => (
  <div className={`rounded-md px-3 py-2 text-sm ${tone === 'warn' ? TONES.warn : tone === 'bad' ? TONES.bad : 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200'}`}>{children}</div>
)

/** ครอบการแสดงผลของข้อมูลที่โหลดจาก useApi: กำลังโหลด / ผิดพลาด / ปกติ */
export function Async({ state, children }) {
  if (state.loading && !state.data) return <p className="py-8 text-center text-sm text-slate-500">กำลังโหลด…</p>
  if (state.error) return (
    <Notice tone="bad">
      {state.error} <button className="ml-2 underline" onClick={state.reload}>ลองใหม่</button>
    </Notice>
  )
  return children(state.data)
}

export const Table = ({ head, children, className = '' }) => (
  <div className={`overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${className}`}>
    <table className="w-full min-w-[520px] text-sm">
      <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <tr>{head.map((h, i) => <th key={i} className={`px-3 py-2 font-medium ${h.right ? 'text-right' : ''}`}>{h.label ?? h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody>
    </table>
  </div>
)

// ---------- แจ้งเตือนมุมจอ ----------
const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null)
  const show = useCallback((text, tone = 'ok') => {
    setMsg({ text, tone })
    setTimeout(() => setMsg(null), 3500)
  }, [])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && (
        <div role="status" className={`fixed bottom-5 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-md px-4 py-2 text-sm shadow-lg ${msg.tone === 'bad' ? 'bg-red-700 text-white' : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'}`}>
          {msg.text}
        </div>
      )}
    </ToastCtx.Provider>
  )
}
