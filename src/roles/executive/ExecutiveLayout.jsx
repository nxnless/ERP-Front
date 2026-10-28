import RoleLayout from '@/shared/layout/RoleLayout'
import { selfServiceNav } from '@/shared/self-service'

const EXECUTIVE_NAV = [
  { to: 'approvals', label: 'อนุมัติรายการสำคัญ' },
  { to: 'overview', label: 'ภาพรวมบริษัท' },
]

export default function ExecutiveLayout() {
  return (
    <RoleLayout
      title="ERP · ผู้บริหาร"
      groups={[{ items: EXECUTIVE_NAV }, { heading: 'ของฉัน', items: selfServiceNav }]}
      note={{ title: 'อนุมัติรายการเกินวงเงิน', text: 'ดูภาพรวมทุกสาขา แก้นโยบายอนุมัติเองไม่ได้' }}
    />
  )
}
