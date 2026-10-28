import RoleLayout from '@/shared/layout/RoleLayout'
import { selfServiceNav } from '@/shared/self-service'

const WAREHOUSE_NAV = [
  { to: 'stock', label: 'ระดับสต็อก' },
  { to: 'movements', label: 'รับ · เบิก · โอนย้าย' },
  { to: 'counts', label: 'ตรวจนับสต็อก' },
  { to: 'scan', label: 'สแกนบาร์โค้ด' },
]

export default function WarehouseLayout() {
  return (
    <RoleLayout
      title="ERP · คลังสินค้า"
      groups={[{ items: WAREHOUSE_NAV }, { heading: 'ของฉัน', items: selfServiceNav }]}
      note={{ title: 'ไม่แสดงราคาและต้นทุน', text: 'เห็นเฉพาะจำนวนและการเคลื่อนไหวของสต็อก · ปรับยอดจากการนับต้องให้ผู้จัดการอนุมัติ' }}
    />
  )
}
