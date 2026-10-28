import ApprovalInbox from '@/shared/approvals/ApprovalInbox'
import { executiveApi, useExecutiveApi } from '../api'

export default function ApprovalsPage() {
  return <ApprovalInbox api={executiveApi} useRoleApi={useExecutiveApi} accent="indigo" sub="เฉพาะรายการที่เกินวงเงินผู้จัดการหรือต้องให้ผู้บริหารอนุมัติ" />
}
