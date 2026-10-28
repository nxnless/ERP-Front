import { useState } from 'react'
import { Async, Button, Field, PageHeader, Table, Tag, Textarea, baht, thDate, useToast } from '@/shared/ui'
import { portalApi, usePortalApi } from '../api'
import Modal from '../components/Modal'

const STATUS = {
  pending: ['รอตอบรับ', 'warn'], accepted: ['ตอบรับแล้ว', 'ok'], converted: ['ตอบรับแล้ว', 'ok'], declined: ['ปฏิเสธแล้ว', 'bad'], expired: ['หมดอายุ', 'muted'],
}

export default function QuotationsPage() {
  const toast = useToast()
  const list = usePortalApi('/quotations')
  const [no, setNo] = useState(null) // { q, reason }
  const [busy, setBusy] = useState(false)

  const respond = async (q, decision, reason) => {
    setBusy(true)
    try { await portalApi.post(`/quotations/${q.id}/respond`, { decision, reason }); toast(decision === 'accepted' ? 'ตอบรับใบเสนอราคาแล้ว' : 'ปฏิเสธใบเสนอราคาแล้ว'); setNo(null); list.reload() }
    catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title="ใบเสนอราคา" sub="ตอบรับหรือปฏิเสธออนไลน์ ฝ่ายขายจะเห็นผลการตอบในระบบ" />
      <Async state={list}>
        {(rows) => (
          <Table head={['เลขที่', 'วันที่', 'ใช้ได้ถึง', 'มูลค่า (ก่อน VAT)', 'สถานะ', '']}>
            {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">ยังไม่มีใบเสนอราคา</td></tr>}
            {rows.map((q) => {
              const [label, tone] = STATUS[q.status] ?? [q.status, 'muted']
              return (
                <tr key={q.id}>
                  <td className="px-3 py-2">{q.doc_no}<div className="text-xs text-slate-500">{q.line_count} รายการ{q.max_discount > 0 ? ` · ส่วนลดสูงสุด ${q.max_discount}%` : ''}</div></td>
                  <td className="px-3 py-2 text-slate-500">{thDate(q.quote_date)}</td><td className="px-3 py-2">{q.valid_until ? thDate(q.valid_until) : '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{baht(q.subtotal)}</td>
                  <td className="px-3 py-2"><Tag tone={tone}>{label}</Tag>{q.so_no && <div className="text-xs text-slate-500">→ ใบสั่งขาย {q.so_no}</div>}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    {q.status === 'pending' && <><Button disabled={busy} onClick={() => window.confirm(`ตอบรับใบเสนอราคา ${q.doc_no}?`) && respond(q, 'accepted')}>ตอบรับ</Button> <Button variant="ghost" disabled={busy} onClick={() => setNo({ q, reason: '' })}>ปฏิเสธ</Button></>}
                  </td>
                </tr>
              )
            })}
          </Table>
        )}
      </Async>
      {no && (
        <Modal title={`ปฏิเสธใบเสนอราคา ${no.q.doc_no}`} onClose={() => setNo(null)}>
          <div className="grid gap-3">
            <Field label="เหตุผล (แจ้งให้ฝ่ายขายทราบ)"><Textarea value={no.reason} maxLength={300} onChange={(e) => setNo({ ...no, reason: e.target.value })} /></Field>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setNo(null)}>ยกเลิก</Button><Button variant="danger" disabled={!no.reason.trim() || busy} onClick={() => respond(no.q, 'declined', no.reason)}>ปฏิเสธ</Button></div>
          </div>
        </Modal>
      )}
    </>
  )
}
