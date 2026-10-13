import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

/**
 * ครอบหน้าที่ต้องล็อกอิน:  <RequireAuth roles={['manager']}>…</RequireAuth>
 *   ไม่ล็อกอิน → ไปหน้า login แล้วกลับมาหน้าเดิมหลัง login
 *   roles ว่าง/ไม่ใส่ = ผู้ล็อกอินทุกคน; ใส่ = ต้องมีอย่างน้อยหนึ่งบทบาท
 */
export default function RequireAuth({ roles, children }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">กำลังตรวจสอบการเข้าสู่ระบบ…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />
  if (roles?.length && !roles.some((r) => user.roles.includes(r))) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center dark:bg-slate-950 dark:text-slate-100">
        <div>
          <h1 className="text-xl font-semibold">คุณไม่มีสิทธิ์เข้าหน้านี้</h1>
          <Link to="/" className="mt-3 inline-block text-rose-700 underline dark:text-rose-400">กลับหน้าหลักของคุณ</Link>
        </div>
      </div>
    )
  }
  return children
}
