// รูปแบบแสดงผลที่ใช้ร่วมกัน (ปี พ.ศ. ตามเครื่องผู้ใช้)
export const baht = (n) => Number(n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
export const thDate = (v) => (v ? new Date(v.length === 10 ? v + 'T00:00:00' : v).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
export const thTime = (v) => (v ? new Date(v).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '—')
export const today = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD ตามเวลาเครื่อง
export const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA') }
export const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000)
