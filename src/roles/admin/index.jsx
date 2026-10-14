import { Navigate } from 'react-router-dom'
import { selfServiceRoutes } from '@/shared/self-service'
import AdminLayout from './AdminLayout'
import OverviewPage from './pages/OverviewPage'
import UsersPage from './pages/UsersPage'
import AccountRequestsPage from './pages/AccountRequestsPage'
import RolesPage from './pages/RolesPage'
import WorkflowPage from './pages/WorkflowPage'
import FormsPage from './pages/FormsPage'
import ModulesPage from './pages/ModulesPage'
import AuditPage from './pages/AuditPage'

// ตำแหน่งผู้ดูแลระบบ — เข้าได้เฉพาะผู้ที่มีบทบาท admin
export const adminRoutes = {
  path: 'admin',
  handle: { roles: ['admin'] },
  element: <AdminLayout />,
  children: [
    { index: true, element: <Navigate to="overview" replace /> },
    { path: 'overview', element: <OverviewPage /> },
    { path: 'users', element: <UsersPage /> },
    { path: 'account-requests', element: <AccountRequestsPage /> },
    { path: 'roles', element: <RolesPage /> },
    { path: 'workflow', element: <WorkflowPage /> },
    { path: 'forms', element: <FormsPage /> },
    { path: 'modules', element: <ModulesPage /> },
    { path: 'audit', element: <AuditPage /> },
    ...selfServiceRoutes, // ฟังก์ชันที่ทุกตำแหน่งมี (ลา/OT คำขอ สลิป โปรไฟล์) — ลบบรรทัดนี้ได้ถ้า Admin ไม่มีทะเบียนพนักงาน
  ],
}
export default adminRoutes
