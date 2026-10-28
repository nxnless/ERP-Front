import { NavLink, Navigate, Outlet, useOutletContext } from 'react-router-dom'
import { Async, Tag } from '@/shared/ui'
import { useAuth } from '@/shared/auth'
import { usePortalApi } from './api'

const TABS = {
  customer: [{ to: 'invoices', label: 'ใบแจ้งหนี้และชำระเงิน' }, { to: 'quotations', label: 'ใบเสนอราคา' }],
  supplier: [{ to: 'purchase-orders', label: 'ใบสั่งซื้อ' }, { to: 'payments', label: 'การจ่ายเงิน' }],
}

/** เปิด /portal แล้วพาไปหน้าแรกตามประเภทของบริษัท */
export function PortalHome() {
  const me = useOutletContext()
  return <Navigate to={me.kinds.includes('customer') ? 'invoices' : 'purchase-orders'} replace />
}

export default function PortalLayout() {
  const me = usePortalApi('/me')
  const { logout } = useAuth()
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Async state={me}>
        {(d) => (
          <>
            <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-5 py-3">
                <div className="mr-auto"><div className="text-lg font-semibold">Acme Portal</div><div className="text-xs text-slate-500">{d.party.name} · รหัส {d.party.code}</div></div>
                <div className="text-right text-sm">{d.user.name}<br />{d.user.mfa && <Tag tone="ok">ยืนยัน 2 ขั้นตอนแล้ว</Tag>}</div>
                {typeof logout === 'function' && <button type="button" onClick={logout} className="rounded border border-slate-300 px-3 py-1 text-sm dark:border-slate-600">ออกจากระบบ</button>}
              </div>
              <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-5">
                {d.kinds.flatMap((k) => TABS[k] ?? []).map((t) => (
                  <NavLink key={t.to} to={t.to} className={({ isActive }) => `whitespace-nowrap border-b-[3px] px-3.5 py-2.5 text-sm ${isActive ? 'border-blue-700 font-semibold text-blue-700 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-slate-500'}`}>{t.label}</NavLink>
                ))}
              </nav>
            </header>
            <main className="mx-auto max-w-5xl px-5 pb-10 pt-6"><Outlet context={d} /></main>
            <footer className="mx-auto max-w-5xl border-t border-slate-200 px-5 py-4 text-xs text-slate-500 dark:border-slate-700">
              พอร์ทัลนี้แยกจากระบบภายในของ Acme · คุณเห็นเฉพาะเอกสารของบริษัทคุณเท่านั้น · ข้อมูลต้นทุนและการอนุมัติภายในไม่แสดงในพอร์ทัล
            </footer>
          </>
        )}
      </Async>
    </div>
  )
}
