import { Navigate } from 'react-router-dom'
import { useAuth } from '@/shared/auth'
import { homeFor } from './home'

export default function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">กำลังตรวจสอบการเข้าสู่ระบบ…</div>
  return <Navigate to={user ? homeFor(user.roles) : '/login'} replace />
}
