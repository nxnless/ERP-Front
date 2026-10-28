import RoleLayout from '@/shared/layout/RoleLayout'
import { selfServiceNav } from '@/shared/self-service'
import { useAuth } from '@/shared/auth'

const PURCHASING_NAV = [
  { to: 'suppliers', label: 'ซัพพลายเออร์' },
  { to: 'orders', label: 'PR → PO' },
  { to: 'rfq', label: 'เปรียบเทียบราคา (RFQ)' },
  { to: 'reorder', label: 'จุดสั่งซื้อซ้ำ' },
]
const APPROVER_NAV = { to: 'approvals', label: 'อนุมัติรายการ' }

// เมนูอนุมัติแสดงเฉพาะหัวหน้าฝ่ายจัดซื้อ / หัวหน้าแผนก (backend ตรวจสิทธิ์ซ้ำเสมอ) — ถ้า user ไม่มีข้อมูลบทบาทให้แสดงไว้ก่อน
const hasRole = (u, code) => !Array.isArray(u?.roles) || u.roles.some((r) => (r?.code ?? r) === code)

export default function PurchasingLayout() {
  const { user } = useAuth()
  return (
    <RoleLayout
      title="ERP · ฝ่ายจัดซื้อ"
      groups={[{ items: hasRole(user, 'purchasing_head') || hasRole(user, 'dept_head') ? [...PURCHASING_NAV, APPROVER_NAV] : PURCHASING_NAV }, { heading: 'ของฉัน', items: selfServiceNav }]}
      note={{ title: 'ดูสต็อกได้อย่างเดียว', text: 'ออก PO ได้ แต่อนุมัติ PO ของตนเองไม่ได้ ผู้อนุมัติตามวงเงิน' }}
    />
  )
}
