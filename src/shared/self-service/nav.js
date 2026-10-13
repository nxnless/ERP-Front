// เมนูมาตรฐานที่ทุกตำแหน่งมี — `to` เป็น path สัมพัทธ์ ใช้ได้ภายใต้ route ของตำแหน่งใดก็ได้
// badge = ชื่อ field ใน /me ที่ใช้แสดงตัวเลขกำกับเมนู
export const selfServiceNav = [
  { to: 'time', label: 'เวลาทำงานและลา' },
  { to: 'requests', label: 'สถานะคำขอ', badge: 'pending_requests' },
  { to: 'new-request', label: 'ยื่นคำขออื่น ๆ' },
  { to: 'payslip', label: 'สลิปเงินเดือน' },
  { to: 'profile', label: 'ข้อมูลส่วนตัว' },
]
