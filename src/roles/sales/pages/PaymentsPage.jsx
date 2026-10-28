import { useState } from 'react'
import { Async, Button, Card, Notice, PageHeader, Table, Tag, baht, thDate, useToast } from '@/shared/ui'
import { salesApi, useSalesApi } from '../api'

export default function PaymentsPage() {
  const toast = useToast()
  const data = useSalesApi('/receivables')
  const meta = useSalesApi('/meta')
  const [busy, setBusy] = useState(false)
  const remind = async (r) => {
    setBusy(true)
    try { await salesApi.post(`/receivables/${r.id}/remind`); toast(`บันทึกการเตือน ${r.customer} แล้ว`) } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }
  const hold = meta.data?.rules.hold_overdue_days ?? 45

  return (
    <>
      <PageHeader title="สถานะการชำระของลูกค้าฉัน" sub="ข้อมูลจากฝ่ายบัญชี · ดูได้เฉพาะลูกค้าในความดูแลของฉันและทีม · ดูอย่างเดียว" />
      <Async state={data}>
        {({ rows, summary }) => (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Card><div className="text-xs text-slate-500">ยอดค้างรับ</div><div className="text-2xl font-semibold">{baht(summary.outstanding)}</div></Card>
              <Card><div className="text-xs text-slate-500">เกินกำหนด</div><div className="text-2xl font-semibold text-red-600">{baht(summary.overdue)}</div><div className="text-xs text-slate-500">{summary.overdue_count} ใบแจ้งหนี้</div></Card>
              <Card><div className="text-xs text-slate-500">ลูกค้าที่ระงับสั่งขายใหม่</div><div className="text-2xl font-semibold">{summary.holds} ราย</div><div className="text-xs text-slate-500">เกินกำหนดเกิน {hold} วัน</div></Card>
            </div>
            <Table head={['ใบแจ้งหนี้', 'ลูกค้า', 'ยอด', 'คงเหลือ', 'ครบกำหนด', 'สถานะ', '']}>
              {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">ไม่มีใบแจ้งหนี้</td></tr>}
              {rows.map((r) => {
                const paid = !(r.balance > 0)
                return (
                  <tr key={r.id}>
                    <td className="px-3 py-2">{r.doc_no}</td><td className="px-3 py-2">{r.customer}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{baht(r.total)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{paid ? '—' : baht(r.balance)}</td>
                    <td className="px-3 py-2 text-slate-500">{thDate(r.due_date)}</td>
                    <td className="px-3 py-2"><Tag tone={paid ? 'ok' : r.days_overdue ? 'bad' : 'warn'}>{paid ? 'ชำระแล้ว' : r.days_overdue ? `เกินกำหนด ${r.days_overdue} วัน` : 'รอชำระ'}</Tag></td>
                    <td className="px-3 py-2 text-right">{!paid && r.days_overdue > 0 && <Button variant="ghost" disabled={busy} onClick={() => remind(r)}>ส่งเตือน</Button>}</td>
                  </tr>
                )
              })}
            </Table>
            <Notice>ปุ่ม “ส่งเตือน” บันทึกการติดตามลูกค้าลง Audit Log — ยังไม่ได้ส่งอีเมลจริง</Notice>
          </div>
        )}
      </Async>
    </>
  )
}
