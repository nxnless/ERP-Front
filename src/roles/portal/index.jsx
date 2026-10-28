import PortalLayout, { PortalHome } from './PortalLayout'
import InvoicesPage from './pages/InvoicesPage'
import QuotationsPage from './pages/QuotationsPage'
import PurchaseOrdersPage from './pages/PurchaseOrdersPage'
import SupplierPaymentsPage from './pages/SupplierPaymentsPage'

// พอร์ทัลลูกค้า/ซัพพลายเออร์ — เข้าได้เฉพาะ session ที่มีบทบาท portal (ผู้ใช้ภายนอก)
// เมนูที่เห็นขึ้นกับประเภทบริษัท (ลูกค้า / ซัพพลายเออร์) และ backend ตรวจซ้ำทุก endpoint
export const portalRoutes = {
  path: 'portal',
  handle: { roles: ['portal'] },
  element: <PortalLayout />,
  children: [
    { index: true, element: <PortalHome /> },
    { path: 'invoices', element: <InvoicesPage /> },
    { path: 'quotations', element: <QuotationsPage /> },
    { path: 'purchase-orders', element: <PurchaseOrdersPage /> },
    { path: 'payments', element: <SupplierPaymentsPage /> },
  ],
}
export default portalRoutes
