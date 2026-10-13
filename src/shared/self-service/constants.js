export const TYPE_LABEL = { LEAVE: 'ใบลา', OT: 'ขอ OT', EXPENSE: 'เบิกค่าใช้จ่าย', PR: 'ใบขอซื้อ', ISSUE: 'ขอเบิกสินค้า', DATA_CHANGE: 'ขอแก้ข้อมูล', BANK_CHANGE: 'เปลี่ยนบัญชีธนาคาร' }
// [ข้อความ, tone ของ <Tag>]
export const STATUS = {
  pending: ['รอดำเนินการ', 'warn'], approved: ['อนุมัติแล้ว', 'ok'], rejected: ['ไม่อนุมัติ', 'bad'], cancelled: ['ยกเลิกแล้ว', 'muted'],
}
