import { useState } from 'react'
import { Async, Button, PageHeader, Select, Table, Tag, thDate, useToast } from '@/shared/ui'
import { purchasingApi, usePurchasingApi } from '../api'

const num = (n) => Math.round(n).toLocaleString('th-TH')
const PO_STATUS = {
  draft: ['ร่าง', 'muted'], pending_approval: ['รออนุมัติ', 'warn'], approved: ['อนุมัติแล้ว', 'ok'], sent_to_supplier: ['ส่งผู้ขายแล้ว', 'ok'],
  supplier_confirmed: ['ผู้ขายยืนยันแล้ว', 'ok'], shipped: ['กำลังจัดส่ง', 'ok'], partially_received: ['รับบางส่วน', 'ok'], received: ['รับครบแล้ว', 'ok'], cancelled: ['ยกเลิก', 'muted'],
}
const TABS = [['pr', 'PR รออกใบสั่งซื้อ'], ['po', 'ใบสั่งซื้อ']]

export default function OrdersPage() {
  const toast = useToast()
  const [tab, setTab] = useState('pr')
  const prs = usePurchasingApi('/requisitions')
  const pos = usePurchasingApi('/orders')
  const sups = usePurchasingApi('/suppliers')
  const [pick, setPick] = useState({}) // prId -> supplierId
  const [busy, setBusy] = useState(false)
  const usable = (sups.data ?? []).filter((s) => s.status === 'approved' || s.status === 'trial')

  const issue = async (pr) => {
    const supplier_id = pick[pr.id] ?? usable[0]?.id
    if (!supplier_id) return toast('ยังไม่มีซัพพลายเออร์ที่ออก PO ได้', 'bad')
    setBusy(true)
    try {
      const r = await purchasingApi.post(`/requisitions/${pr.id}/issue-po`, { supplier_id })
      toast(`ออก ${r.doc_no} แล้ว · รออนุมัติ: ${r.route.join(' › ')}`); prs.reload(); pos.reload(); setTab('po')
    } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }
  const prTag = (p) => p.status === 'approved' ? <Tag tone="ok">อนุมัติแล้ว</Tag> : p.status === 'po_issued' ? <Tag>ออก PO แล้ว</Tag> : <Tag tone="warn">รอ{p.waiting_role ?? ''}อนุมัติ</Tag>

  return (
    <>
      <PageHeader title="PR → PO" sub="ใบขอซื้อที่อนุมัติแล้วรอคุณเลือกผู้ขายและออกใบสั่งซื้อ · ผู้อนุมัติ PO ตามวงเงินในนโยบายอนุมัติที่ Admin ตั้งไว้ (ออก PO ได้ แต่อนุมัติเองไม่ได้)" />
      <div className="mb-4 flex gap-2">
        {TABS.map(([k, l]) => (
          <button key={k} aria-pressed={tab === k} onClick={() => setTab(k)} className={`rounded-full border px-3 py-1 text-sm ${tab === k ? 'border-amber-700 bg-amber-700 text-white' : 'border-slate-300 dark:border-slate-600'}`}>{l}</button>
        ))}
      </div>

      {tab === 'po' ? (
        <Async state={pos}>
          {(rows) => (
            <Table head={['เลขที่ PO', 'ผู้ขาย', 'มูลค่า (ก่อน VAT)', 'เงื่อนไข', 'ผู้อนุมัติ', 'สถานะ']}>
              {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">ยังไม่มีใบสั่งซื้อ</td></tr>}
              {rows.map((p) => {
                const [label, tone] = PO_STATUS[p.status] ?? [p.status, 'muted']
                return (
                  <tr key={p.id}>
                    <td className="px-3 py-2"><div className="font-medium">{p.doc_no}</div><div className="text-xs text-slate-500">{thDate(p.order_date)}</div></td>
                    <td className="px-3 py-2">{p.supplier_name}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{num(p.subtotal)}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{p.terms_name ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{p.route ?? '—'}</td>
                    <td className="px-3 py-2"><Tag tone={tone}>{p.status === 'pending_approval' && p.waiting_role ? `รอ${p.waiting_role}อนุมัติ` : label}</Tag></td>
                  </tr>
                )
              })}
            </Table>
          )}
        </Async>
      ) : (
        <Async state={prs}>
          {(rows) => (
            <>
              <Table head={['ใบขอซื้อ', 'รายการ', 'ราคาประเมิน', 'ต้องการ', 'สถานะ', '']}>
                {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">ไม่มีใบขอซื้อ</td></tr>}
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2"><div className="font-medium">{p.doc_no}</div><div className="text-xs text-slate-500">{p.department_name ?? p.requester_name}</div></td>
                    <td className="px-3 py-2">{p.lines.map((l) => <div key={l.line_no}>{l.description} <span className="text-slate-500">{num(l.qty)} {l.uom}</span></div>)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{num(p.est_total)}</td>
                    <td className="whitespace-nowrap px-3 py-2">{p.need_by ? thDate(p.need_by) : '—'}</td>
                    <td className="px-3 py-2">{prTag(p)}</td>
                    <td className="px-3 py-2">
                      {p.status === 'approved' && (p.has_open_rfq ? <span className="text-xs text-slate-500">มี RFQ เปิดอยู่ — เลือกที่หน้า RFQ</span> : (
                        <div className="flex gap-2">
                          <div className="w-44"><Select aria-label="เลือกผู้ขาย" value={pick[p.id] ?? usable[0]?.id ?? ''} onChange={(e) => setPick({ ...pick, [p.id]: e.target.value })}>{usable.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div>
                          <Button disabled={busy || !usable.length} onClick={() => issue(p)}>ออก PO</Button>
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </Table>
              <p className="mt-2 text-xs text-slate-500">{rows.filter((p) => p.status === 'approved').length} ใบพร้อมออก PO · ถ้าต้องการเทียบราคาก่อน ไปที่เมนู “เปรียบเทียบราคา (RFQ)”</p>
            </>
          )}
        </Async>
      )}
    </>
  )
}
