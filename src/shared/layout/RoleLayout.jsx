import { NavLink, Outlet, useResolvedPath } from 'react-router-dom'
import { ToastProvider } from '@/shared/ui'
import { SelfServiceProvider, useSelfService } from '@/shared/self-service'
import { useAuth } from '@/shared/auth'

/**
 * โครงหน้า (เมนูซ้าย + เนื้อหา) ที่ทุกตำแหน่งใช้ร่วมกัน
 *   title  : ชื่อหัวเมนู เช่น "ERP · ผู้จัดการ"
 *   groups : [{ heading?: 'ของฉัน', items: [{ to: 'inbox', label: '...', badge?: 'pending_requests' }] }]
 *   note   : { title, text } กล่องเตือนสิทธิ์ใต้เมนู (ไม่ใส่ก็ได้)
 * ภายในมี ToastProvider และ SelfServiceProvider (ข้อมูล /me + base path) ให้แล้ว
 */
export default function RoleLayout({ title, groups, note }) {
  const base = useResolvedPath('.').pathname.replace(/\/$/, '') // เช่น '/employee'
  return (
    <ToastProvider>
      <SelfServiceProvider base={base}>
        <Shell title={title} groups={groups} note={note} />
      </SelfServiceProvider>
    </ToastProvider>
  )
}

function Shell({ title, groups, note }) {
  const { me } = useSelfService()
  const { user, logout } = useAuth()
  const link = ({ isActive }) =>
    `block whitespace-nowrap rounded-md px-3 py-2 text-sm ${isActive ? 'bg-rose-100 font-semibold text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:grid md:grid-cols-[232px_1fr]">
      <nav aria-label={title} className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900 md:sticky md:top-0 md:block md:h-screen md:overflow-y-auto md:border-b-0 md:border-r md:p-3">
        <div className="hidden px-2 pb-4 pt-1 md:block">
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-slate-500">{me ? `${me.full_name} (${me.position})` : '…'}</div>
        </div>
        {groups.map((g, i) => (
          <div key={i} className="flex gap-1 md:block md:space-y-1">
            {g.heading && <div className="hidden px-3 pb-1 pt-4 text-xs text-slate-500 md:block">{g.heading}</div>}
            {g.items.map((it) => {
              const n = it.badge ? me?.[it.badge] ?? 0 : 0
              return (
                <NavLink key={it.to} to={it.to} className={link}>
                  {it.label}
                  {n > 0 && <span className="ml-2 rounded-full bg-red-600 px-1.5 text-xs text-white">{n}</span>}
                </NavLink>
              )
            })}
          </div>
        ))}
        <button type="button" onClick={logout} className={`${link({ isActive: false })} text-left md:mt-4 md:border-t md:border-slate-200 md:pt-3 md:dark:border-slate-700`}>
          ออกจากระบบ<span className="hidden text-xs text-slate-500 md:block">{user?.email}</span>
        </button>
        {note && (
          <div className="mt-4 hidden rounded-md border border-dashed border-red-300 p-2 text-xs text-red-700 dark:border-red-800 dark:text-red-400 md:block">
            <b className="block">{note.title}</b>{note.text}
          </div>
        )}
      </nav>
      <main className="w-full max-w-5xl p-4 md:p-7"><Outlet /></main>
    </div>
  )
}
