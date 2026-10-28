import { useState } from 'react'
import { Async, PageHeader, Table, Tag, baht, thDate } from '@/shared/ui'
import { useManagerApi } from '../api'

export default function ReportsPage() {
  const [view, setView] = useState('team')
  const data = useManagerApi(`/reports?view=${view}`)
  return (
    <>
      <PageHeader title="รายงานเปรียบเทียบ" sub="ผลงานเดือนนี้ (ถึงวันนี้) เทียบเป้าและช่วงเดียวกันของเดือนก่อน · ยอดขายก่อน VAT" />
      <div className="mb-3 flex gap-2">
        {[['team', 'ตามทีม (สาขาของคุณ)'], ['branch', 'ตามสาขา']].map(([k, l]) => (
          <button key={k} aria-pressed={view === k} onClick={() => setView(k)}
            className={`rounded-full border px-3 py-1 text-sm ${view === k ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300 dark:border-slate-600'}`}>{l}</button>
        ))}
      </div>
      <Async state={data}>
        {({ rows, as_of }) => {
          const down = rows.filter((r) => r.change != null && r.change < 0)
          return (
            <>
              <div className="mb-2 text-xs text-slate-500">ข้อมูล ณ {thDate(as_of)}</div>
              <Table head={[view === 'team' ? 'ทีม (แผนกผู้ขาย)' : 'สาขา', 'ยอดขาย (บาท)', 'บรรลุเป้า', 'ใบสั่งขาย', 'อัตราปิดการขาย', 'เทียบเดือนก่อน']}>
                {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">ยังไม่มีข้อมูลยอดขายเดือนนี้</td></tr>}
                {rows.map((r) => {
                  const p = r.target > 0 ? Math.round((r.sales / r.target) * 100) : null
                  return (
                    <tr key={r.id ?? 'none'} className={r.mine ? 'bg-teal-50 dark:bg-teal-950' : ''}>
                      <td className="px-3 py-2">{r.name}{r.mine && <span className="ml-1 text-xs text-slate-500">(คุณ)</span>}</td>
                      <td className="px-3 py-2">{baht(r.sales)}</td>
                      <td className="px-3 py-2">
                        {p == null ? <span className="text-slate-400">—</span> : (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded bg-slate-200 dark:bg-slate-700"><div className={`h-full ${p >= 100 ? 'bg-emerald-600' : 'bg-teal-500'}`} style={{ width: `${Math.min(p, 100)}%` }} /></div>
                            <span className="text-xs">{p}%</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">{r.orders}</td>
                      <td className="px-3 py-2">{r.close_rate == null ? '—' : `${r.close_rate}%`}</td>
                      <td className="px-3 py-2">{r.change == null ? '—' : <Tag tone={r.change >= 0 ? 'ok' : 'bad'}>{r.change >= 0 ? '+' : ''}{r.change}%</Tag>}</td>
                    </tr>
                  )
                })}
              </Table>
              <p className="mt-2 text-xs text-slate-500">
                {view === 'branch'
                  ? 'ข้อมูลสาขาอื่นแสดงเป็นยอดรวม ไม่เห็นรายละเอียดรายการ'
                  : down.length ? `ยอดต่ำกว่าช่วงเดียวกันของเดือนก่อน: ${down.map((r) => r.name).join(', ')}` : 'ทุกทีมยอดไม่ต่ำกว่าช่วงเดียวกันของเดือนก่อน'}
              </p>
            </>
          )
        }}
      </Async>
    </>
  )
}
