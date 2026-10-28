import { Navigate } from 'react-router-dom'
import { selfServiceRoutes } from '@/shared/self-service'
import PurchasingLayout from './PurchasingLayout'
import SuppliersPage from './pages/SuppliersPage'
import OrdersPage from './pages/OrdersPage'
import RfqPage from './pages/RfqPage'
import ReorderPage from './pages/ReorderPage'
import ApprovalsPage from './pages/ApprovalsPage'

// ตำแหน่งฝ่ายจัดซื้อ — เข้าได้เฉพาะผู้ที่มีบทบาท purchasing หรือ purchasing_head
export const purchasingRoutes = {
  path: 'purchasing',
  handle: { roles: ['purchasing', 'purchasing_head'] },
  element: <PurchasingLayout />,
  children: [
    { index: true, element: <Navigate to="suppliers" replace /> },
    { path: 'suppliers', element: <SuppliersPage /> },
    { path: 'orders', element: <OrdersPage /> },
    { path: 'rfq', element: <RfqPage /> },
    { path: 'reorder', element: <ReorderPage /> },
    { path: 'approvals', element: <ApprovalsPage /> }, // เฉพาะ purchasing_head (backend ตรวจสิทธิ์)
    ...selfServiceRoutes, // ฟังก์ชันที่ทุกตำแหน่งมี (ลา/OT คำขอ สลิป โปรไฟล์) — ลบบรรทัดนี้ได้ถ้าไม่ใช้
  ],
}
export default purchasingRoutes
