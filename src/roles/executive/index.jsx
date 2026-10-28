import { Navigate } from 'react-router-dom'
import { selfServiceRoutes } from '@/shared/self-service'
import ExecutiveLayout from './ExecutiveLayout'
import ApprovalsPage from './pages/ApprovalsPage'
import OverviewPage from './pages/OverviewPage'

// ตำแหน่งผู้บริหาร — เข้าได้เฉพาะผู้ที่มีบทบาท executive
export const executiveRoutes = {
  path: 'executive',
  handle: { roles: ['executive'] },
  element: <ExecutiveLayout />,
  children: [
    { index: true, element: <Navigate to="approvals" replace /> },
    { path: 'approvals', element: <ApprovalsPage /> },
    { path: 'overview', element: <OverviewPage /> },
    ...selfServiceRoutes, // ฟังก์ชันที่ทุกตำแหน่งมี (ลา/OT คำขอ สลิป โปรไฟล์) — ลบบรรทัดนี้ได้ถ้าไม่ใช้
  ],
}
export default executiveRoutes
