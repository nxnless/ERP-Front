const fmM = (v) => (v / 1e6).toFixed(2)
const TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

/** แท่งยอดขายรายเดือน + เส้นเป้าของเดือนปัจจุบัน — months = [{ ym:'2026-10', sales, target }] (แท่งสุดท้าย = เดือนปัจจุบัน) */
export default function SalesChart({ months }) {
  const last = months[months.length - 1]
  const T = last?.target
  const max = Math.max(1, ...months.map((m) => m.sales), T ?? 0) * 1.15
  const H = 140, W = 400, step = W / months.length
  return (
    <svg viewBox="0 0 400 190" role="img" aria-label="ยอดขายรายเดือนเทียบเป้า" className="w-full">
      {months.map((m, i) => {
        const h = (m.sales / max) * H, x = i * step + step * 0.18, w = step * 0.64, cur = i === months.length - 1
        return (
          <g key={m.ym}>
            <rect x={x} y={160 - h} width={w} height={h} rx="3" className={cur ? 'fill-teal-700 dark:fill-teal-400' : 'fill-teal-300 dark:fill-teal-800'} />
            <text x={x + w / 2} y={153 - h} textAnchor="middle" fontSize="11" className="fill-slate-700 dark:fill-slate-200">{fmM(m.sales)}</text>
            <text x={x + w / 2} y="178" textAnchor="middle" fontSize="11" className="fill-slate-500">{TH[Number(m.ym.slice(5)) - 1]}{cur ? '*' : ''}</text>
          </g>
        )
      })}
      {T != null && (
        <>
          <line x1="0" x2={W} y1={160 - (T / max) * H} y2={160 - (T / max) * H} strokeDasharray="4 3" className="stroke-amber-600" />
          <text x={W - 2} y={154 - (T / max) * H} textAnchor="end" fontSize="11" className="fill-amber-600">เป้า {fmM(T)}</text>
        </>
      )}
    </svg>
  )
}
