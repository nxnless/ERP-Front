import { Navigate } from 'react-router-dom'
import { selfServiceRoutes } from '@/shared/self-service'
import EmployeeLayout from './EmployeeLayout'

// พนักงานทั่วไปมีเฉพาะฟังก์ชันมาตรฐาน (self-service) — ไม่มีหน้าเฉพาะตำแหน่ง
export const employeeRoutes = {
  path: 'employee',
  handle: { roles: [] }, // ผู้ล็อกอินทุกคนเข้าได้ (จำกัดตำแหน่งอื่นด้วย roles: ['manager'] ฯลฯ)
  element: <EmployeeLayout />,
  children: [{ index: true, element: <Navigate to="time" replace /> }, ...selfServiceRoutes],
}

export default employeeRoutes // src/roles/index.js จะรวมให้เอง
