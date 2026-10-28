import { Navigate } from 'react-router-dom'
import { selfServiceRoutes } from '@/shared/self-service'
import WarehouseLayout from './WarehouseLayout'
import StockPage from './pages/StockPage'
import MovementsPage from './pages/MovementsPage'
import CountPage from './pages/CountPage'
import ScanPage from './pages/ScanPage'

// ตำแหน่งคลังสินค้า — เข้าได้เฉพาะผู้ที่มีบทบาท warehouse
export const warehouseRoutes = {
  path: 'warehouse',
  handle: { roles: ['warehouse'] },
  element: <WarehouseLayout />,
  children: [
    { index: true, element: <Navigate to="stock" replace /> },
    { path: 'stock', element: <StockPage /> },
    { path: 'movements', element: <MovementsPage /> },
    { path: 'counts', element: <CountPage /> },
    { path: 'scan', element: <ScanPage /> },
    ...selfServiceRoutes, // ฟังก์ชันที่ทุกตำแหน่งมี (ลา/OT คำขอ สลิป โปรไฟล์)
  ],
}
export default warehouseRoutes
