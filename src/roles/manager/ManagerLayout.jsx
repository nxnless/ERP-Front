import { useEffect } from 'react'
import RoleLayout from '@/shared/layout/RoleLayout'
import { selfServiceNav } from '@/shared/self-service'
import { useManagerApi } from './api'

const MANAGER_NAV = [
  { to: 'inbox', label: 'กล่องงานรออนุมัติ' },
  { to: 'dashboard', label: 'Dashboard สาขา' },
  { to: 'reports', label: 'รายงานเปรียบเทียบ' },
]

export default function ManagerLayout() {
  const me = useManagerApi('/me')
  // หน้ากล่องงานแจ้งเมื่อมีการตัดสินใจ เพื่อให้ตัวเลขกำกับเมนูอัปเดตทันที
  useEffect(() => {
    const on = () => me.reload()
    window.addEventListener('manager:inbox-changed', on)
    return () => window.removeEventListener('manager:inbox-changed', on)
  }, [me.reload]) // eslint-disable-line react-hooks/exhaustive-deps
  const limit = me.data?.limit
  return (
    <RoleLayout
      title="ERP · ผู้จัดการ"
      groups={[{ items: MANAGER_NAV }, { heading: 'ของฉัน', items: selfServiceNav }]}
      badges={{ inbox: me.data?.pending }}
      note={{
        title: limit ? `วงเงินอนุมัติ ${limit.toLocaleString('th-TH')} บาท/รายการ` : 'วงเงินอนุมัติต่อรายการ',
        text: 'เกินวงเงินส่งต่อผู้บริหาร · อนุมัติเอกสารของตนเองไม่ได้',
      }}
    />
  )
}
