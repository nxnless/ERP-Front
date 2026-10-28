/** จำนวนเงิน: ติดลบแสดงในวงเล็บแบบงบการเงิน — (1,234) */
export const fm = (n) => { const v = Number(n ?? 0); return (v < 0 ? '(' : '') + Math.abs(v).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + (v < 0 ? ')' : '') }
export const monthLabel = (ym) => { const [y, m] = ym.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }) }
export const curMonth = (back = 0) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - back); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
export const TYPE_TH = { asset: 'สินทรัพย์', liability: 'หนี้สิน', equity: 'ทุน', revenue: 'รายได้', expense: 'ค่าใช้จ่าย' }
