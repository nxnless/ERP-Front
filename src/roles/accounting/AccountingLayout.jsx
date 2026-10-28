import { useEffect } from 'react'
import RoleLayout from '@/shared/layout/RoleLayout'
import { selfServiceNav } from '@/shared/self-service'
import { useAccApi } from './api'

const ACC_NAV = [
  { to: 'journal', label: 'สมุดรายวัน / ผังบัญชี' },
  { to: 'aging', label: 'ลูกหนี้ เจ้าหนี้ Aging' },
  { to: 'payroll', label: 'ตรวจรอบเงินเดือน' },
  { to: 'tax', label: 'ภาษี และ e-Tax' },
  { to: 'bank', label: 'กระทบยอดธนาคาร' },
  { to: 'statements', label: 'งบการเงิน' },
]

export default function AccountingLayout() {
  // จำนวนรอบเงินเดือนที่รอฝ่ายบัญชีตรวจ แสดงต่อท้ายเมนู — หน้าตรวจรอบส่ง event 'acc:payroll-changed' เมื่อมีการตัดสิน
  const pending = useAccApi('/payroll-review/pending-count')
  useEffect(() => {
    const on = () => pending.reload()
    window.addEventListener('acc:payroll-changed', on)
    return () => window.removeEventListener('acc:payroll-changed', on)
  }, [pending])
  const n = pending.data?.count ?? 0
  const nav = ACC_NAV.map((i) => (i.to === 'payroll' && n > 0 ? { ...i, label: `${i.label} (${n})` } : i))

  return (
    <RoleLayout
      title="ERP · บัญชีและการเงิน"
      groups={[{ items: nav }, { heading: 'ของฉัน', items: selfServiceNav }]}
      note={{ title: 'ขั้นตอนของคุณคือตรวจสอบ', text: 'อนุมัติขั้นสุดท้ายเป็นของผู้จัดการ' }}
    />
  )
}
