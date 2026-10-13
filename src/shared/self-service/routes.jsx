import TimeLeavePage from './pages/TimeLeavePage'
import RequestsPage from './pages/RequestsPage'
import NewRequestPage from './pages/NewRequestPage'
import PayslipPage from './pages/PayslipPage'
import ProfilePage from './pages/ProfilePage'

// route ลูกที่ตำแหน่งไหนก็เอาไป spread ใส่ children ได้: children: [...หน้าเฉพาะตำแหน่ง, ...selfServiceRoutes]
export const selfServiceRoutes = [
  { path: 'time', element: <TimeLeavePage /> },
  { path: 'requests', element: <RequestsPage /> },
  { path: 'new-request', element: <NewRequestPage /> },
  { path: 'payslip', element: <PayslipPage /> },
  { path: 'profile', element: <ProfilePage /> },
]
