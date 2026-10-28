import ApprovalInbox from '@/shared/approvals/ApprovalInbox'
import { purchasingApi, usePurchasingApi } from '../api'

export default function ApprovalsPage() {
  return <ApprovalInbox api={purchasingApi} useRoleApi={usePurchasingApi} accent="amber" title="อนุมัติรายการ" sub="รายการที่ถึงขั้นของคุณตามนโยบายอนุมัติ — หัวหน้าจัดซื้อ: PO · ซัพพลายเออร์ใหม่ · ใบขอซื้อ / หัวหน้าแผนก: ใบขอซื้อ · อนุมัติรายการที่ตนเองยื่นไม่ได้" />
}
