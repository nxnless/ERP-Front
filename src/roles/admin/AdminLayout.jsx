import RoleLayout from '@/shared/layout/RoleLayout'
import { selfServiceNav } from '@/shared/self-service'

const ADMIN_NAV = [
  { to: 'overview', label: 'ภาพรวม' },
  { to: 'users', label: 'ผู้ใช้' },
  { to: 'account-requests', label: 'คำขอเปิดบัญชี' },
  { to: 'roles', label: 'บทบาทและสิทธิ์' },
  { to: 'workflow', label: 'Workflow อนุมัติ' },
  { to: 'forms', label: 'ฟอร์มและเทมเพลต' },
  { to: 'modules', label: 'เปิด–ปิดโมดูล' },
  { to: 'audit', label: 'Audit Log' },
]

export default function AdminLayout() {
  return (
    <RoleLayout
      title="ERP · ผู้ดูแลระบบ"
      groups={[{ items: ADMIN_NAV }, { heading: 'ของฉัน', items: selfServiceNav }]}
      note={{ title: 'ตั้งค่าระบบเท่านั้น', text: 'ไม่เห็นข้อมูลธุรกิจ (ยอดขาย เงินเดือน) และอนุมัติธุรกรรมไม่ได้' }}
    />
  )
}
