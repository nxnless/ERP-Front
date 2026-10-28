import { useState } from 'react'
import { Async, Button, Card, Input, PageHeader, Select, Table, Tag, baht, thDate, useToast } from '@/shared/ui'
import { portalApi, usePortalApi } from '../api'

export default function SupplierPaymentsPage() {
  const toast = useToast()
  const data = usePortalApi('/supplier-invoices')
  const [f, setF] = useState({ po_id: '', invoice_no: '', amount: '' })
  const [busy, setBusy] = useState(false)

  const pick = (payable, id) => setF({ ...f, po_id: id, amount: String(payable.find((p) => p.id === id)?.remaining ?? '') })
  const submit = async () => {
    setBusy(true)
    try {
      await portalApi.post('/supplier-invoices', { po_id: f.po_id, invoice_no: f.invoice_no, amount: Number(f.amount) })
      toast('ส่งใบแจ้งหนี้แล้ว ผู้ซื้อจะตรวจรับและแจ้งกำหนดจ่าย'); setF({ po_id: '', invoice_no: '', amount: '' }); data.reload()
    } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }
  const status = (r) => r.status === 'rejected' ? ['ผู้ซื้อปฏิเสธ', 'bad'] : r.invoice_status === 'paid' ? ['จ่ายแล้ว', 'ok'] : r.status === 'accepted' ? [r.due_date ? `กำหนดจ่าย ${thDate(r.due_date)}` : 'ตรวจรับแล้ว', 'ok'] : ['รอผู้ซื้อตรวจรับ', 'warn']

  return (
    <>
      <PageHeader title="สถานะการจ่ายเงิน" sub="ส่งใบแจ้งหนี้ (วางบิล) สำหรับ PO ที่จัดส่งแล้ว และดูสถานะการจ่ายเงิน" />
      <Async state={data}>
        {({ rows, payable, waiting }) => (
          <div className="grid gap-4">
            <Card>
              <b>ส่งใบแจ้งหนี้</b>
              <div className="mt-2 flex flex-wrap gap-2">
                <div className="min-w-52 flex-[2]">
                  <Select aria-label="ใบสั่งซื้อ" value={f.po_id} onChange={(e) => pick(payable, e.target.value)}>
                    <option value="">{payable.length ? '— เลือก PO —' : 'ไม่มี PO ที่จัดส่งแล้วและรอวางบิล'}</option>
                    {payable.map((p) => <option key={p.id} value={p.id}>{p.doc_no} · เหลือวางบิลได้ {baht(p.remaining)}</option>)}
                  </Select>
                </div>
                <div className="min-w-36 flex-1"><Input placeholder="เลขที่ใบแจ้งหนี้" aria-label="เลขที่ใบแจ้งหนี้" maxLength={40} value={f.invoice_no} onChange={(e) => setF({ ...f, invoice_no: e.target.value })} /></div>
                <div className="min-w-32 flex-1"><Input type="number" min="0" step="any" placeholder="ยอด (บาท)" aria-label="ยอดใบแจ้งหนี้" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div>
                <Button disabled={busy || !f.po_id || !f.invoice_no.trim() || !(Number(f.amount) > 0)} onClick={submit}>ส่งใบแจ้งหนี้</Button>
              </div>
            </Card>
            <Table head={['ใบแจ้งหนี้', 'อ้างอิง PO', 'ส่งเมื่อ', 'ยอด', 'สถานะ']}>
              {rows.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-500">ยังไม่เคยส่งใบแจ้งหนี้</td></tr>}
              {rows.map((r) => { const [label, tone] = status(r); return (
                <tr key={r.id}><td className="px-3 py-2">{r.invoice_no}</td><td className="px-3 py-2 text-slate-500">{r.po_no}</td><td className="px-3 py-2 text-slate-500">{thDate(r.submitted_at)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{baht(r.amount)}</td><td className="px-3 py-2"><Tag tone={tone}>{label}</Tag></td></tr>
              ) })}
              <tr><th colSpan={3} className="px-3 py-2 text-left">รวมรอรับเงิน</th><th className="px-3 py-2 text-right tabular-nums">{baht(waiting)}</th><th /></tr>
            </Table>
          </div>
        )}
      </Async>
    </>
  )
}
