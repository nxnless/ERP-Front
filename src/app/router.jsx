import { createBrowserRouter } from 'react-router-dom'
import { roleRoutes } from '@/roles'
import LoginPage from './LoginPage'
import RootRedirect from './RootRedirect'
import NotFoundPage from './NotFoundPage'

// route ของทุกตำแหน่งถูกรวมให้อัตโนมัติจาก src/roles/*/index.jsx (และครอบด้วย RequireAuth แล้ว)
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: <RootRedirect /> },
  ...roleRoutes,
  { path: '*', element: <NotFoundPage /> },
])
