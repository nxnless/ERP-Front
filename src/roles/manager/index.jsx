import { Navigate } from 'react-router-dom'
import { selfServiceRoutes } from '@/shared/self-service'
import ManagerLayout from './ManagerLayout'
import InboxPage from './pages/InboxPage'
import DashboardPage from './pages/DashboardPage'
import ReportsPage from './pages/ReportsPage'

// ตำแหน่งผู้จัดการสาขา — เข้าได้เฉพาะผู้ที่มีบทบาท manager
export const managerRoutes = {
  path: 'manager',
  handle: { roles: ['manager'] },
  element: <ManagerLayout />,
  children: [
    { index: true, element: <Navigate to="inbox" replace /> },
    { path: 'inbox', element: <InboxPage /> },
    { path: 'dashboard', element: <DashboardPage /> },
    { path: 'reports', element: <ReportsPage /> },
    ...selfServiceRoutes, // ฟังก์ชันที่ทุกตำแหน่งมี (ลา/OT คำขอ สลิป โปรไฟล์) — เหมือนที่ Admin เรียกใช้
  ],
}
export default managerRoutes
