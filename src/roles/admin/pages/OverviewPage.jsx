import { Link } from 'react-router-dom'
import { Async, Card, Notice, PageHeader, Tag, thDate, thTime } from '@/shared/ui'
import { useAdminApi } from '../api'

const RISK = { low: ['ต่ำ', 'ok'], medium: ['กลาง', 'warn'], high: ['สูง', 'bad'] }

export default function OverviewPage() {
  const o = useAdminApi('/overview')
  return (
    <>
      <PageHeader title="ภาพรวมระบบ" sub="สถานะการตั้งค่าและสิ่งที่ต้องทำ" />
      <Async state={o}>
        {(d) => (
          <div className="grid gap-4">
            {d.admins_active < 2 && <Notice tone="bad">มี Admin ที่ใช้งานอยู่เพียง {d.admins_active} คน — ระบบกำหนดให้ต้องมีอย่างน้อย 2 คน <Link className="underline" to="../users">เพิ่มผู้ดูแลระบบ</Link></Notice>}
            {d.pending_accounts > 0 && <Notice tone="accent">มีคำขอเปิดบัญชีรอดำเนินการ {d.pending_accounts} รายการ <Link className="underline" to="../account-requests">ไปดำเนินการ</Link></Notice>}
            {d.types_without_policy.length > 0 && (
              <Notice>ยังไม่มีนโยบายอนุมัติ {d.types_without_policy.length} ประเภท — คำขอประเภทนี้จะยื่นไม่ได้จนกว่าจะตั้งค่า: {d.types_without_policy.map((t) => t.label).join(', ')} <Link className="underline" to="../workflow">ตั้งค่า</Link></Notice>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[['ผู้ใช้ที่ใช้งาน', d.users.active, `ระงับ ${d.users.suspended} · รอเปิดใช้ ${d.users.invited}`], ['ผู้ดูแลระบบที่ใช้งาน', d.admins_active, 'ต้องไม่น้อยกว่า 2'],
                ['บทบาท', d.roles, 'รวมบทบาทที่สร้างเอง'], ['โมดูลที่เปิด', `${d.modules.enabled}/${d.modules.total}`, 'ปิดได้ที่ เปิด–ปิดโมดูล']].map(([k, v, s]) => (
                <Card key={k}><div className="text-xs text-slate-500">{k}</div><div className="text-2xl font-semibold">{v}</div><div className="text-xs text-slate-500">{s}</div></Card>
              ))}
            </div>
            <section>
              <h2 className="mb-2 font-medium">การเปลี่ยนแปลงการตั้งค่าล่าสุด</h2>
              <Card className="p-0">
                {d.recent.length === 0 && <p className="p-4 text-sm text-slate-500">ยังไม่มีรายการ</p>}
                {d.recent.map((r, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-x-3 border-b border-slate-100 px-4 py-2 text-sm last:border-0 dark:border-slate-800">
                    <span className="w-36 text-xs text-slate-500">{thDate(r.occurred_at)} {thTime(r.occurred_at)}</span>
                    <span className="font-medium">{r.actor_name}</span><span>{r.action}</span><span className="text-slate-500">{r.entity_ref}</span>
                    <span className="ml-auto"><Tag tone={RISK[r.risk][1]}>{RISK[r.risk][0]}</Tag></span>
                  </div>
                ))}
              </Card>
            </section>
          </div>
        )}
      </Async>
    </>
  )
}
