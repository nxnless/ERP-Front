export const money = (n) => Number(n ?? 0).toLocaleString('th-TH', { maximumFractionDigits: 0 })

/** '2026-11' → 'พ.ย. 2569' */
export const monthLabel = (ym) => {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })
}
export const monthShort = (ym) => {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('th-TH', { month: 'short' })
}
