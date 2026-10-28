import RoleLayout from '@/shared/layout/RoleLayout'
import { selfServiceNav } from '@/shared/self-service'

const SALES_NAV = [
  { to: 'customers', label: 'ลูกค้าและ Price List' },
  { to: 'documents', label: 'เสนอราคา สั่งขาย ส่งของ' },
  { to: 'payments', label: 'สถานะการชำระ' },
  { to: 'crm', label: 'CRM · Pipeline' },
]

export default function SalesLayout() {
  return (
    <RoleLayout
      title="ERP · ฝ่ายขาย"
      groups={[{ items: SALES_NAV }, { heading: 'ของฉัน', items: selfServiceNav }]}
      note={{ title: 'ไม่แสดงต้นทุน', text: 'เห็นเฉพาะลูกค้าและเอกสารของตนและทีม' }}
    />
  )
}
