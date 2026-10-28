import { Navigate } from 'react-router-dom'
import { selfServiceRoutes } from '@/shared/self-service'
import HrLayout from './HrLayout'
import EmployeesPage from './pages/EmployeesPage'
import LeavePage from './pages/LeavePage'
import PayrollPage from './pages/PayrollPage'
import HeadcountPage from './pages/HeadcountPage'

// ตำแหน่งฝ่ายบุคคล — เข้าได้เฉพาะผู้ที่มีบทบาท hr
export const hrRoutes = {
  path: 'hr',
  handle: { roles: ['hr'] },
  element: <HrLayout />,
  children: [
    { index: true, element: <Navigate to="employees" replace /> },
    { path: 'employees', element: <EmployeesPage /> },
    { path: 'leave', element: <LeavePage /> },
    { path: 'payroll', element: <PayrollPage /> },
    { path: 'headcount', element: <HeadcountPage /> },
    ...selfServiceRoutes, // ฟังก์ชันที่ทุกตำแหน่งมี (ลา/OT คำขอ สลิป โปรไฟล์) — ยื่นคำขอ/คำขอของฉัน/เวลาทำงาน/เงินเดือนของฉัน
  ],
}
export default hrRoutes
