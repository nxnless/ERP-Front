import { useEffect } from 'react'
import RoleLayout from '@/shared/layout/RoleLayout'
import { selfServiceNav } from '@/shared/self-service'
import { useHrApi } from './api'

const HR_NAV = [
  { to: 'employees', label: 'ทะเบียนพนักงาน' },
  { to: 'leave', label: 'ใบลาและนโยบายลา' },
  { to: 'payroll', label: 'เงินเดือน' },
  { to: 'headcount', label: 'อัตรากำลังคน' },
]

export default function HrLayout() {
  // จำนวนใบลาที่รอ HR ตรวจ แสดงต่อท้ายเมนู — หน้าใบลาส่ง event 'hr:leave-changed' เมื่ออนุมัติ/ไม่อนุมัติ
  const pending = useHrApi('/leave/pending-count')
  useEffect(() => {
    const on = () => pending.reload()
    window.addEventListener('hr:leave-changed', on)
    return () => window.removeEventListener('hr:leave-changed', on)
  }, [pending])
  const n = pending.data?.count ?? 0
  const nav = HR_NAV.map((i) => (i.to === 'leave' && n > 0 ? { ...i, label: `${i.label} (${n})` } : i))

  return (
    <RoleLayout
      title="ERP · ฝ่ายบุคคล"
      groups={[{ items: nav }, { heading: 'ของฉัน', items: selfServiceNav }]}
      note={{ title: 'เตรียมเงินเดือนได้ ไม่อนุมัติจ่าย', text: 'พิจารณาใบลาที่เกินสิทธิ์ ผู้จัดการอนุมัติใบลาปกติ' }}
    />
  )
}
