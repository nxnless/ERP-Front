import RoleLayout from '@/shared/layout/RoleLayout'
import { selfServiceNav } from '@/shared/self-service'

export default function EmployeeLayout() {
  return (
    <RoleLayout
      title="ERP · พนักงาน"
      groups={[{ items: selfServiceNav }]}
      note={{ title: 'เห็นเฉพาะข้อมูลของตนเอง', text: 'ไม่มีสิทธิ์เข้าโมดูลธุรกิจ' }}
    />
  )
}
