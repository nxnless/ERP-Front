import { Async, Card, PageHeader, Table, Tag, thDate, thTime } from '@/shared/ui'
import { useExecutiveApi } from '../api'

const num = (n) => Math.round(n).toLocaleString('th-TH')
const mil = (n) => `${(n / 1e6).toFixed(2)} ล้าน`
const monthEnd = (iso) => new Date(iso).toLocaleDateString('th-TH', { month: 'short', timeZone: 'Asia/Bangkok' })
const range = (p) => (p.min_amount === 0 && p.max_amount == null ? 'ทุกวงเงิน' : p.min_amount === 0 ? `ไม่เกิน ${num(p.max_amount)}` : p.max_amount == null ? `มากกว่า ${num(Math.floor(p.min_amount))}` : `${num(Math.ceil(p.min_amount))} – ${num(p.max_amount)}`)
const noAccess = <Card className="text-sm text-slate-500">ไม่มีสิทธิ์ดูข้อมูลส่วนนี้ (หรือโมดูลถูกปิดอยู่)</Card>

export default function OverviewPage() {
  const o = useExecutiveApi('/overview')
  return (
    <>
      <PageHeader title="ภาพรวมบริษัท" sub="ทุกสาขา · ตัวเลขรวมระดับบริหาร" />
      <Async state={o}>
        {(d) => {
          const fin = d.finance, ppl = d.people
          const cards = [
            fin && ['รายได้สะสม ม.ค.–' + monthEnd(d.as_of), mil(fin.revenue), `ค่าใช้จ่ายรวม ${mil(fin.expense)}`],
            fin && ['กำไรสุทธิสะสม', mil(fin.net), fin.revenue > 0 ? `อัตรากำไรสุทธิ ${((fin.net / fin.revenue) * 100).toFixed(1)}%` : '—'],
            fin && ['เงินสดและเงินฝาก', mil(fin.cash), `เจ้าหนี้ ${(fin.payable / 1e6).toFixed(2)} · ลูกหนี้ ${(fin.receivable / 1e6).toFixed(2)}`],
            ppl && ['พนักงาน', `${ppl.headcount} คน`, `ทดลองงาน ${ppl.probation} · ลาออกสะสมปีนี้ ${ppl.resigned_ytd}`],
          ].filter(Boolean)
          const top = Math.max(...(d.branches ?? []).map((b) => b.sales), 1), total = (d.branches ?? []).reduce((s, b) => s + b.sales, 0)
          return (
            <div className="grid gap-4">
              {!fin && !ppl ? noAccess : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([k, v, s]) => <Card key={k}><div className="text-xs text-slate-500">{k}</div><div className="text-2xl font-semibold">{v}</div><div className="text-xs text-slate-500">{s}</div></Card>)}</div>}
              <div className="grid items-start gap-4 lg:grid-cols-[3fr_2fr]">
                {d.branches ? (
                  <Card>
                    <b>ยอดขายรายสาขา</b>
                    <div className="mb-2 text-xs text-slate-500">ใบสั่งขายที่อนุมัติแล้ว (ก่อน VAT) ตั้งแต่ต้นปี · รวม {num(total)} บาท</div>
                    {d.branches.length === 0 && <p className="text-sm text-slate-500">ยังไม่มีสาขา</p>}
                    {d.branches.map((b) => (
                      <div key={b.id} className="my-2.5">
                        <div className="flex justify-between"><span>{b.name}</span><span className="text-xs text-slate-500">{num(b.sales)}</span></div>
                        <div className="h-2 overflow-hidden rounded bg-slate-200 dark:bg-slate-700"><div className="h-full bg-indigo-800 dark:bg-indigo-400" style={{ width: `${Math.round((b.sales / top) * 100)}%` }} /></div>
                      </div>
                    ))}
                  </Card>
                ) : noAccess}
                {d.risks ? (
                  <Card className="self-start">
                    <b>เหตุการณ์ความเสี่ยงสูงล่าสุด</b>
                    {d.risks.length === 0 && <p className="mt-2 text-sm text-slate-500">ไม่มีรายการ</p>}
                    {d.risks.map((r) => (
                      <div key={r.id} className="border-t border-slate-100 py-1.5 text-sm first:mt-2 dark:border-slate-800">
                        <Tag tone="bad">สูง</Tag> {r.action}{r.entity_ref ? ` · ${r.entity_ref}` : ''}
                        <div className="text-xs text-slate-500">{r.actor_name ?? '—'} · {r.module} · {thDate(r.occurred_at)} {thTime(r.occurred_at)}</div>
                      </div>
                    ))}
                    <div className="mt-2 text-xs text-slate-500">ดูอย่างเดียว</div>
                  </Card>
                ) : noAccess}
              </div>
              <section>
                <h3 className="mb-2 font-medium">นโยบายการอนุมัติปัจจุบัน</h3>
                <Table head={['เอกสาร', 'วงเงิน (บาท)', 'ขั้น', 'ผู้อนุมัติ']}>
                  {d.policies.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-500">ยังไม่มีนโยบาย</td></tr>}
                  {d.policies.map((p, i) => (
                    <tr key={i}><td className="px-3 py-2">{p.label}{p.condition_key === 'over_quota' ? ' (เมื่อเกินสิทธิ์)' : ''}</td><td className="px-3 py-2">{range(p)}</td><td className="px-3 py-2">{p.step_order}</td><td className="px-3 py-2">{p.role_name}</td></tr>
                  ))}
                </Table>
                <p className="mt-1.5 text-xs text-slate-500">ตั้งค่าโดย Admin เท่านั้น ผู้บริหารเห็นแต่แก้ไขเองไม่ได้</p>
              </section>
            </div>
          )
        }}
      </Async>
    </>
  )
}
