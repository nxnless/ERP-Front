import { Async, Card, PageHeader, Table, Tag, baht, thDate } from '@/shared/ui'
import { useManagerApi } from '../api'
import SalesChart from '../components/SalesChart'

const M = (n) => (n / 1e6).toFixed(2)
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : null)
const SO_STATUS = { approved: 'อนุมัติแล้ว', ready_to_ship: 'พร้อมส่ง', partially_shipped: 'ส่งบางส่วน' }

export default function DashboardPage() {
  const o = useManagerApi('/dashboard')
  return (
    <>
      <Async state={o}>
        {(d) => {
          const hit = pct(d.sales.mtd, d.sales.target)
          const growth = d.sales.prev > 0 ? Math.round(((d.sales.mtd - d.sales.prev) / d.sales.prev) * 1000) / 10 : null
          const kpis = [
            ['ยอดขายเดือนนี้ (ก่อน VAT)', M(d.sales.mtd), `${hit != null ? `${hit}% ของเป้า ${M(d.sales.target)}` : 'ยังไม่ได้ตั้งเป้า'}${growth != null ? ` · ${growth >= 0 ? '+' : ''}${growth}% จากช่วงเดียวกันเดือนก่อน` : ''}`],
            ['ใบสั่งขายค้างส่ง', `${d.backlog.n} ใบ`, `มูลค่า ${M(d.backlog.total)} · เกินกำหนด ${d.backlog.late} ใบ`],
            ['ลูกหนี้เกินกำหนด', M(d.ar_overdue.total), d.ar_overdue.parties ? `จาก ${d.ar_overdue.parties} ราย · เก่าสุด ${d.ar_overdue.oldest} วัน` : 'ไม่มีค้างเกินกำหนด'],
            ['เจ้าหนี้ครบกำหนดใน 7 วัน', M(d.ap_due7.total), `${d.ap_due7.n} ใบ`],
          ]
          return (
            <>
              <PageHeader title="Dashboard สาขา" sub={`ข้อมูล ณ ${thDate(d.as_of)} · หน่วย: ล้านบาท ยกเว้นระบุอื่น`} />
              <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {kpis.map(([k, v, s]) => (
                    <Card key={k}><div className="text-xs text-slate-500">{k}</div><div className="text-2xl font-semibold">{v}</div><div className="text-xs text-slate-500">{s}</div></Card>
                  ))}
                </div>
                <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
                  <Card>
                    <h2 className="font-medium">ยอดขายรายเดือน 6 เดือนล่าสุด</h2>
                    <div className="mb-1 text-xs text-slate-500">* เดือนปัจจุบัน ถึงวันนี้</div>
                    <SalesChart months={d.months} />
                  </Card>
                  <div>
                    <h2 className="mb-2 font-medium">สต็อกใกล้หมด</h2>
                    <Table head={['สินค้า', 'คงเหลือ', 'จุดสั่งซื้อ']}>
                      {d.low_stock.length === 0 && <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-500">ไม่มีสินค้าต่ำกว่าจุดสั่งซื้อ</td></tr>}
                      {d.low_stock.map((r) => (
                        <tr key={r.sku}><td className="px-3 py-2">{r.name}</td><td className="px-3 py-2"><Tag tone="bad">{r.on_hand.toLocaleString('th-TH')}</Tag></td><td className="px-3 py-2 text-slate-500">{r.reorder_point.toLocaleString('th-TH')}</td></tr>
                      ))}
                    </Table>
                  </div>
                </div>
                <section>
                  <h2 className="mb-2 font-medium">ใบสั่งขายค้างส่งเกินกำหนด</h2>
                  <Table head={['เลขที่', 'ลูกค้า', 'กำหนดส่ง', 'มูลค่า', 'สถานะ']}>
                    {d.late_orders.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">ไม่มีใบสั่งขายเกินกำหนด</td></tr>}
                    {d.late_orders.map((r) => (
                      <tr key={r.doc_no}><td className="px-3 py-2">{r.doc_no}</td><td className="px-3 py-2">{r.customer}</td><td className="px-3 py-2">{thDate(r.due)}</td><td className="px-3 py-2">{baht(r.total)}</td><td className="px-3 py-2 text-slate-500">{SO_STATUS[r.status] ?? r.status}</td></tr>
                    ))}
                  </Table>
                </section>
              </div>
            </>
          )
        }}
      </Async>
    </>
  )
}
