import { useEffect } from 'react'

export default function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-40 grid place-items-center overflow-auto bg-black/40 p-4">
      <div className={`max-h-[92vh] w-full overflow-auto rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900 ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="ปิด" className="rounded px-2 text-xl leading-none text-slate-500 hover:text-slate-900 dark:hover:text-white">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
