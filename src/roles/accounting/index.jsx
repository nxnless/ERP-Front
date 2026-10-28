import { Navigate } from 'react-router-dom'
import { selfServiceRoutes } from '@/shared/self-service'
import AccountingLayout from './AccountingLayout'
import JournalPage from './pages/JournalPage'
import AgingPage from './pages/AgingPage'
import PayrollReviewPage from './pages/PayrollReviewPage'
import TaxPage from './pages/TaxPage'
import BankPage from './pages/BankPage'
import StatementsPage from './pages/StatementsPage'

// ตำแหน่งบัญชีและการเงิน — เข้าได้เฉพาะผู้ที่มีบทบาทบัญชี
export const accountingRoutes = {
  path: 'accounting',
  handle: { roles: ['accounting', 'accounting_manager'] },
  element: <AccountingLayout />,
  children: [
    { index: true, element: <Navigate to="journal" replace /> },
    { path: 'journal', element: <JournalPage /> },
    { path: 'aging', element: <AgingPage /> },
    { path: 'payroll', element: <PayrollReviewPage /> },
    { path: 'tax', element: <TaxPage /> },
    { path: 'bank', element: <BankPage /> },
    { path: 'statements', element: <StatementsPage /> },
    ...selfServiceRoutes, // หมวด "ของฉัน": ยื่นคำขอ/คำขอของฉัน/เวลาทำงาน OT ลา/เงินเดือนของฉัน
  ],
}
export default accountingRoutes
