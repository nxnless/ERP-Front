/** เส้นทางหน้ายื่นคำขอ (self-service) ที่ใช้ตอนกด "แจ้งจัดซื้อ" — ปรับให้ตรงกับ shared/self-service/routes.jsx ของโปรเจคหลัก */
export const NEW_REQUEST_PATH = '../new-request'

export const MOVE_TYPES = {
  opening: ['ยอดยกมา', 'muted'], grn: ['รับเข้า', 'ok'], issue: ['จ่ายออก', 'bad'], transfer_out: ['โอนออก', 'warn'],
  transfer_in: ['โอนเข้า', 'ok'], count_adjust: ['ปรับยอดนับ', 'accent'], return: ['รับคืน', 'ok'],
}
export const REASONS = {
  miscount: 'นับผิด/นับซ้ำ', damaged: 'สินค้าชำรุดตัดทิ้ง', misplaced: 'หยิบผิดตำแหน่ง', unrecorded: 'ยังไม่บันทึกเอกสาร', unknown: 'ไม่ทราบสาเหตุ',
}
/** แสดงจำนวนแบบไทย (ไม่เกิน 3 ทศนิยมตามฐานข้อมูล) */
export const qty = (n) => (n == null ? '—' : Number(n).toLocaleString('th-TH', { maximumFractionDigits: 3 }))
/** ผลต่างพร้อมเครื่องหมาย */
export const signed = (n) => (n > 0 ? '+' : '') + qty(n)
