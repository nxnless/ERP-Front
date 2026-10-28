import { Async, Card, PageHeader, Table, Tag } from '@/shared/ui'
import { useHrApi } from '../api'
import { monthShort } from '../format'

export default function HeadcountPage() {
  const data = useHrApi('/headcount')
  return (
    <>
      <PageHeader title="รายงานอัตรากำลังคน" sub="เทียบกับอัตราตามแผนปีนี้" />
      <Async state={data}>
        {(d) => {
          const pct = d.avg_headcount ? Math.round((d.resigned_ytd / d.avg_headcount) * 100) : 0
          return (
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Card><div className="text-xs text-slate-500">พนักงานปัจจุบัน</div><div className="text-2xl font-semibold">{d.actual} คน</div><div className="text-xs text-slate-500">ตามแผน {d.planned} · ตำแหน่งว่าง {d.vacant}</div></Card>
                <Card><div className="text-xs text-slate-500">ทดลองงาน</div><div className="text-2xl font-semibold">{d.probation} คน</div><div className="text-xs text-slate-500">เข้าใหม่เดือนนี้ {d.joined_this_month}</div></Card>
                <Card><div className="text-xs text-slate-500">ลาออกสะสมปีนี้</div><div className="text-2xl font-semibold">{d.resigned_ytd} คน</div><div className="text-xs text-slate-500">{pct}% ของพนักงานเฉลี่ย {d.avg_headcount} คน</div></Card>
              </div>
              <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
                <Table head={['แผนก', 'ตามแผน', 'ปัจจุบัน', 'ว่าง', 'ลาออกสะสม']}>
                  {d.by_department.map((r) => (
                    <tr key={r.department}>
                      <td className="px-3 py-2">{r.department}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.planned}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.actual}</td>
                      <td className="px-3 py-2 text-right">{r.planned - r.actual > 0 ? <Tag tone="warn">{r.planned - r.actual}</Tag> : '—'}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.resigned_ytd || '—'}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-medium dark:bg-slate-800">
                    <td className="px-3 py-2">รวม</td><td className="px-3 py-2 text-right tabular-nums">{d.planned}</td><td className="px-3 py-2 text-right tabular-nums">{d.actual}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{d.vacant}</td><td className="px-3 py-2 text-right tabular-nums">{d.resigned_ytd}</td>
                  </tr>
                </Table>
                <Card className="self-start"><div className="mb-2 font-medium">จำนวนพนักงานรายเดือน</div><Bars series={d.monthly} /></Card>
              </div>
            </div>
          )
        }}
      </Async>
    </>
  )
}

/** แท่งจำนวนพนักงาน 6 เดือนล่าสุด (เดือนล่าสุดเข้มกว่า) — ฐานแกนเลื่อนตามค่าต่ำสุดเพื่อให้เห็นความต่าง */
function Bars({ series }) {
  const vals = series.map((s) => s.n), max = Math.max(...vals, 1), base = Math.max(0, Math.min(...vals) - 5)
  return (
    <svg viewBox="0 0 400 170" role="img" aria-label="จำนวนพนักงานรายเดือน" className="w-full">
      {series.map((s, i) => {
        const h = Math.max(4, ((s.n - base) / (max - base || 1)) * 110), x = 14 + i * 64, last = i === series.length - 1
        return (
          <g key={s.month}>
            <rect x={x} y={135 - h} width="40" height={h} rx="3" className={last ? 'fill-rose-700' : 'fill-rose-200 dark:fill-rose-900'} />
            <text x={x + 20} y={128 - h} textAnchor="middle" fontSize="12" className="fill-slate-800 dark:fill-slate-100">{s.n}</text>
            <text x={x + 20} y="153" textAnchor="middle" fontSize="11" className="fill-slate-500">{monthShort(s.month)}</text>
          </g>
        )
      })}
    </svg>
  )
}
