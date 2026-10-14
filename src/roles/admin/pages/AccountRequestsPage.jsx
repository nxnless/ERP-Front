import { useState } from 'react'
import { Async, Button, Card, Field, PageHeader, Tag, Textarea, thDate, useToast } from '@/shared/ui'
import { adminApi, useAdminApi } from '../api'
import Modal from '../components/Modal'
import SecretBox from '../components/SecretBox'
import UserForm from '../components/UserForm'

export default function AccountRequestsPage() {
  const toast = useToast()
  const list = useAdminApi('/account-requests')
  const meta = useAdminApi('/meta')
  const [fulfill, setFulfill] = useState(null)
  const [reject, setReject] = useState(null)
  const [reason, setReason] = useState('')
  const [secret, setSecret] = useState(null)
  const [busy, setBusy] = useState(false)

  const initialFor = (r) => {
    const want = meta.data.roles.find((x) => x.code === r.payload.requested_role) ?? meta.data.roles.find((x) => x.code === 'employee')
    return { email: r.payload.email ?? '', display_name: r.payload.name ?? '', branch_id: '', role_ids: want ? [want.id] : [] }
  }
  const doFulfill = async (f) => {
    setBusy(true)
    try {
      const out = await adminApi.post(`/account-requests/${fulfill.id}/fulfill`, { email: f.email, display_name: f.display_name, branch_id: f.branch_id, role_ids: f.role_ids, ...(fulfill.payload.employee_id && { employee_id: fulfill.payload.employee_id }) })
      setFulfill(null); setSecret({ title: 'สร้างบัญชีตามคำขอแล้ว', email: out.email, password: out.temp_password }); list.reload()
    } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }
  const doReject = async () => {
    setBusy(true)
    try { await adminApi.post(`/account-requests/${reject.id}/reject`, { reason }); toast('ปฏิเสธคำขอแล้ว'); setReject(null); setReason(''); list.reload() }
    catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title="คำขอเปิดบัญชี" sub="คำขอจากฝ่ายบุคคลที่รอผู้ดูแลระบบสร้างบัญชีผู้ใช้ — Admin ดำเนินการสร้างบัญชีเท่านั้น ไม่ใช่การอนุมัติธุรกรรม" />
      <Async state={list}>
        {(rows) => rows.length === 0 ? <Card className="py-10 text-center text-sm text-slate-500">ไม่มีคำขอที่รอดำเนินการ</Card> : (
          <div className="grid gap-3">
            {rows.map((r) => (
              <Card key={r.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2"><Tag tone="accent">ขอเปิดบัญชี</Tag><span className="text-xs text-slate-500">{r.request_no} · {thDate(r.created_at)} · ผู้ยื่น {r.requester_name}</span></div>
                    <div className="mt-1 font-medium">{r.payload.name ?? r.payload.summary ?? '—'}</div>
                    <div className="text-sm text-slate-500">{[r.payload.email, r.payload.position, r.payload.requested_role && `บทบาทที่ขอ: ${r.payload.requested_role}`].filter(Boolean).join(' · ')}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button disabled={!meta.data} onClick={() => setFulfill(r)}>สร้างบัญชี</Button>
                    <Button variant="danger" onClick={() => { setReason(''); setReject(r) }}>ปฏิเสธ</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Async>
      {fulfill && meta.data && (
        <Modal title={`สร้างบัญชีตามคำขอ ${fulfill.request_no}`} onClose={() => setFulfill(null)}>
          <UserForm meta={meta.data} busy={busy} initial={initialFor(fulfill)} submitLabel="สร้างบัญชีและปิดคำขอ" onSubmit={doFulfill} onCancel={() => setFulfill(null)} />
          {fulfill.payload.employee_id && <p className="mt-2 text-xs text-slate-500">บัญชีจะถูกผูกกับทะเบียนพนักงานตามที่ HR ระบุในคำขอ</p>}
        </Modal>
      )}
      {reject && (
        <Modal title={`ปฏิเสธคำขอ ${reject.request_no}`} onClose={() => setReject(null)}>
          <div className="grid gap-3">
            <Field label="เหตุผล (ส่งกลับให้ผู้ยื่น)"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} /></Field>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setReject(null)}>ยกเลิก</Button><Button variant="danger" disabled={!reason.trim() || busy} onClick={doReject}>ปฏิเสธคำขอ</Button></div>
          </div>
        </Modal>
      )}
      {secret && <SecretBox {...secret} onClose={() => setSecret(null)} />}
    </>
  )
}
