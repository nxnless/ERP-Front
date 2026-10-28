import { useState } from 'react'
import { Async, Card, Field, Input, PageHeader, Tag } from '@/shared/ui'
import { useAccApi } from '../api'
import Tabs from '../components/Tabs'
import { fm } from '../format'

const Row = ({ label, value, bold }) => (
  <tr className="border-t border-slate-100 dark:border-slate-800"><td className={`py-1.5 ${bold ? 'px-4 font-semibold' : 'pl-8 pr-4'}`}>{label}</td><td className={`px-4 py-1.5 text-right tabular-nums ${bold ? 'font-semibold' : ''}`}>{fm(value)}</td></tr>
)

export default function StatementsPage() {
  const [tab, setTab] = useState('bs')
  const [range, setRange] = useState({ from: '', to: '' })
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(range).filter(([, v]) => v))).toString()
  const data = useAccApi('/statements' + (qs ? `?${qs}` : ''))
  return (
    <>
      <PageHeader title="งบการเงิน" sub="คำนวณจากรายการที่ลงบัญชีแล้ว · งบกำไรขาดทุนนับเฉพาะช่วงที่เลือก (ค่าเริ่มต้น 1 ม.ค.–วันนี้) งบฐานะการเงินเป็นยอดสะสมถึงวันสิ้นสุด" />
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="w-44"><Field label="ตั้งแต่"><Input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /></Field></div>
        <div className="w-44"><Field label="ถึง"><Input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></Field></div>
      </div>
      <Tabs value={tab} onChange={setTab} options={[['bs', 'งบฐานะการเงิน'], ['pl', 'งบกำไรขาดทุน']]} />
      <Async state={data}>
        {({ balance_sheet: b, income_statement: p }) => (
          <Card className="max-w-2xl p-0">
            <table className="w-full text-sm"><tbody>
              {tab === 'pl' ? (
                <>
                  <tr className="bg-slate-50 dark:bg-slate-800"><th colSpan={2} className="px-4 py-2 text-left">งบกำไรขาดทุน (บาท)</th></tr>
                  <Row label="รายได้" value={p.total_revenue} bold />
                  {p.revenue.map((a) => <Row key={a.code} label={a.name} value={a.period_amount} />)}
                  {p.expenses.map((a) => <Row key={a.code} label={a.name} value={a.period_amount} />)}
                  <Row label="ค่าใช้จ่ายรวม" value={p.total_expenses} bold /><Row label="กำไรสุทธิ" value={p.net_income} bold />
                  <tr className="border-t border-slate-100 text-slate-500 dark:border-slate-800"><td className="px-4 py-1.5">อัตรากำไรสุทธิ</td><td className="px-4 py-1.5 text-right">{p.margin_pct == null ? '—' : `${p.margin_pct}%`}</td></tr>
                </>
              ) : (
                <>
                  <tr className="bg-slate-50 dark:bg-slate-800"><th colSpan={2} className="px-4 py-2 text-left">งบแสดงฐานะการเงิน (บาท)</th></tr>
                  {b.assets.map((a) => <Row key={a.code} label={a.name} value={a.balance} />)}<Row label="รวมสินทรัพย์" value={b.total_assets} bold />
                  {b.liabilities.map((a) => <Row key={a.code} label={a.name} value={a.balance} />)}<Row label="รวมหนี้สิน" value={b.total_liabilities} bold />
                  {b.equity.map((a) => <Row key={a.code} label={a.name} value={a.balance} />)}<Row label="กำไรสุทธิสะสม" value={b.net_income} />
                  <Row label="รวมส่วนของเจ้าของ" value={b.total_equity} bold /><Row label="รวมหนี้สินและส่วนของเจ้าของ" value={b.total_liabilities + b.total_equity} bold />
                </>
              )}
            </tbody></table>
            {tab === 'bs' && <div className="p-3">{b.balanced ? <Tag tone="ok">สินทรัพย์ = หนี้สิน + ส่วนของเจ้าของ</Tag> : <Tag tone="bad">งบไม่สมดุล</Tag>}</div>}
          </Card>
        )}
      </Async>
    </>
  )
}
