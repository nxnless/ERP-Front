import { Navigate } from 'react-router-dom'
import { selfServiceRoutes } from '@/shared/self-service'
import SalesLayout from './SalesLayout'
import CustomersPage from './pages/CustomersPage'
import DocumentsPage from './pages/DocumentsPage'
import PaymentsPage from './pages/PaymentsPage'
import CrmPage from './pages/CrmPage'

// ตำแหน่งฝ่ายขาย — เข้าได้เฉพาะบทบาท sales และหัวหน้าแผนก (dept_head) · backend ตรวจซ้ำว่าเป็นหัวหน้าแผนกขายจริง
export const salesRoutes = {
  path: 'sales',
  handle: { roles: ['sales', 'dept_head'] },
  element: <SalesLayout />,
  children: [
    { index: true, element: <Navigate to="customers" replace /> },
    { path: 'customers', element: <CustomersPage /> },
    { path: 'documents', element: <DocumentsPage /> },
    { path: 'payments', element: <PaymentsPage /> },
    { path: 'crm', element: <CrmPage /> },
    ...selfServiceRoutes, // ฟังก์ชันที่ทุกตำแหน่งมี (ลา/OT คำขอ สลิป โปรไฟล์) = หมวด "ของฉัน"
  ],
}
export default salesRoutes
