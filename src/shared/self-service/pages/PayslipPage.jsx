import { useEffect, useState } from 'react'
import { useSelfServiceApi as useApi } from '../hooks'
import { Async, Button, Card, PageHeader, Select, baht, thDate } from '@/shared/ui'

const LABEL = {
  BASE: 'เงินเดือน', ALLOWANCE: 'เบี้ยตำแหน่ง', OT: 'ค่า OT', BONUS: 'โบนัส', COMMISSION: 'คอมมิชชัน', OTHER_EARN: 'รายได้อื่น ๆ',
  SSO: 'ประกันสังคม', TAX: 'ภาษีหัก ณ ที่จ่าย', PROVIDENT: 'กองทุนสำรองเลี้ยงชีพ', ABSENCE: 'หักขาดงาน', STUDENT_LOAN: 'กยศ.', OTHER_DEDUCT: 'หักอื่น ๆ',
}
const monthLabel = (p) => new Date(p + '-01T00:00:00').toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })

export default function PayslipPage() {
  const list = useApi('/payslips')
  const [id, setId] = useState(null)
  const [show, setShow] = useState(false) // ซ่อนตัวเลขไว้ก่อน กันคนข้างหลังเห็น
  useEffect(() => { if (!id && list.data?.length) setId(list.data[0].id) }, [list.data, id])
  const detail = useApi(id ? `/payslips/${id}` : null)
  const x = (n) => (show ? baht(n) : '•••••')

  return (
    <>
      <PageHeader title="สลิปเงินเดือน" sub="เห็นเฉพาะของตนเอง และเฉพาะรอบที่ผู้จัดการอนุมัติแล้ว" />
      <Async state={list}>
        {(rows) => rows.length === 0 ? <Card className="py-10 text-center text-sm text-slate-500">ยังไม่มีสลิปเงินเดือน</Card> : (
          <>
            <div className="mb-4 flex flex-wrap gap-2 print:hidden">
              <div className="w-48"><Select value={id ?? ''} onChange={(e) => setId(e.target.value)} aria-label="เลือกเดือน">
                {rows.map((r) => <option key={r.id} value={r.id}>{monthLabel(r.period)}</option>)}
              </Select></div>
              <Button variant="ghost" onClick={() => setShow((s) => !s)}>{show ? 'ซ่อนจำนวนเงิน' : 'แสดงจำนวนเงิน'}</Button>
              <Button variant="ghost" onClick={() => window.print()}>พิมพ์</Button>
            </div>
            <Async state={detail}>
              {(d) => d && (
                <div className="grid max-w-3xl gap-4 md:grid-cols-[3fr_2fr]">
                  <Card className="p-0">
                    <Section title="รายได้" rows={d.detail?.earnings} x={x} />
                    <Section title="รายการหัก" rows={d.detail?.deductions} x={x} />
                    {!d.detail?.earnings && <p className="p-4 text-sm text-slate-500">ไม่มีรายละเอียดรายการ</p>}
                  </Card>
                  <Card className="self-start">
                    <div className="text-xs text-slate-500">รับสุทธิ {monthLabel(d.period)}</div>
                    <div className="my-1 text-3xl font-semibold">{x(d.net)} <span className="text-sm font-normal text-slate-500">บาท</span></div>
                    <div className="text-xs text-slate-500">รายได้รวม {x(d.gross)} · หักรวม {x(d.deductions)}</div>
                    <div className="mt-3 text-xs text-slate-500">โอนเข้าบัญชี {d.bank ?? '—'} วันที่ {thDate(d.pay_date)}</div>
                  </Card>
                </div>
              )}
            </Async>
          </>
        )}
      </Async>
    </>
  )
}

function Section({ title, rows, x }) {
  if (!rows?.length) return null
  return (
    <div>
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800">{title}</div>
      {rows.map((r, i) => (
        <div key={i} className="flex justify-between border-b border-slate-100 px-4 py-2 text-sm last:border-0 dark:border-slate-800">
          <span>{r.label ?? LABEL[r.component] ?? r.component}</span><span className="tabular-nums">{x(r.amount)}</span>
        </div>
      ))}
    </div>
  )
}
