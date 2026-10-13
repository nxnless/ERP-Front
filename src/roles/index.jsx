import { RequireAuth } from '@/shared/auth'

// รวม route ของทุกตำแหน่งอัตโนมัติ: วางโฟลเดอร์ src/roles/<ตำแหน่ง>/ ที่มี index.jsx
const modules = import.meta.glob('./*/index.jsx', { eager: true })

export const roleRoutes = Object.entries(modules)
  .sort(([a], [b]) => a.localeCompare(b))
  .flatMap(([, m]) => [m.default].flat())
  .filter(Boolean) // ป้องกันกรณีไฟล์ไม่มี export default
  .map((r) => ({
    ...r,
    element: <RequireAuth roles={r.handle?.roles}>{r.element}</RequireAuth>,
  }))

// ส่งออก rolePaths ออกไปให้ไฟล์อื่นใช้งาน
export const rolePaths = roleRoutes
  .map((r) => (r.path ? '/' + r.path.replace(/^\/+/, '') : null))
  .filter(Boolean) // เช่น ['/employee', '/manager', '/admin']