import { useState } from 'react'
import { Async, Button, Notice, PageHeader, Table, Tag, baht, useToast } from '@/shared/ui'
import { salesApi, useSalesApi } from '../api'
import Modal from '../components/Modal'
import QuoteForm from '../components/QuoteForm'
import Seg from '../components/Seg'

const TYPE = { QT: 'ใบเสนอราคา', SO: 'ใบสั่งขาย', DN: 'ใบส่งของ' }
const STATUS = {
  QT: { draft: ['ร่าง', 'warn'], pending_discount_approval: ['รอผู้จัดการอนุมัติส่วนลด', 'warn'], pending_exec_approval: ['รอผู้บริหารอนุมัติ', 'warn'], approval_rejected: ['ไม่ผ่านการอนุมัติ', 'bad'],
    sent: ['ส่งลูกค้าแล้ว', 'ok'], accepted: ['ลูกค้าตอบรับ', 'ok'], declined: ['ลูกค้าปฏิเสธ', 'bad'], expired: ['หมดอายุ', 'muted'], converted: ['แปลงเป็นใบสั่งขายแล้ว', 'muted'] },
  SO: { pending_approval: ['รออนุมัติ', 'warn'], approved: ['พร้อมส่ง', 'ok'], ready_to_ship: ['พร้อมส่ง', 'ok'], partially_shipped: ['ส่งบางส่วน', 'warn'], shipped: ['จัดส่งแล้ว', 'ok'], invoiced: ['ออกใบแจ้งหนี้แล้ว', 'muted'], cancelled: ['ยกเลิก', 'bad'] },
  DN: { preparing: ['เตรียมจัดส่ง', 'warn'], in_transit: ['กำลังจัดส่ง', 'warn'], delivered: ['ส่งแล้ว', 'ok'], cancelled: ['ยกเลิก', 'bad'] },
}
// ปุ่มดำเนินการต่อสถานะ (เฉพาะเอกสารของตนเอง)
const ACTIONS = {
  QT: { draft: [{ label: 'ส่งให้ลูกค้า', path: (d) => `/quotations/${d.id}/send`, ok: 'บันทึกว่าส่งให้ลูกค้าแล้ว' }],
        sent: [{ label: 'ลูกค้าตอบรับ', path: (d) => `/quotations/${d.id}/accept`, ok: 'บันทึกว่าลูกค้าตอบรับ' },
               { label: 'ลูกค้าปฏิเสธ', path: (d) => `/quotations/${d.id}/decline`, ok: 'บันทึกว่าลูกค้าปฏิเสธ', danger: true, confirm: 'บันทึกว่าลูกค้าปฏิเสธใบเสนอราคานี้?' }],
        accepted: [{ label: 'แปลงเป็นใบสั่งขาย', path: (d) => `/quotations/${d.id}/convert`, ok: 'สร้างใบสั่งขายแล้ว' }] },
  SO: Object.fromEntries(['approved', 'ready_to_ship', 'partially_shipped'].map((s) => [s, [{ label: 'สร้างใบส่งของ', path: (d) => `/sales-orders/${d.id}/delivery`, ok: 'สร้างใบส่งของแล้ว', confirm: 'สร้างใบส่งของสำหรับรายการที่เหลือทั้งหมด?' }]])),
  DN: { in_transit: [{ label: 'บันทึกส่งสำเร็จ', path: (d) => `/delivery-notes/${d.id}/delivered`, ok: 'บันทึกส่งสำเร็จแล้ว' }] },
}
const APPROVAL_MSG = { discount: 'ส่งคำขออนุมัติส่วนลดให้ผู้จัดการแล้ว', exec: 'มูลค่าเกินเกณฑ์ ส่งผู้บริหารอนุมัติแล้ว' }

export default function DocumentsPage() {
  const toast = useToast()
  const list = useSalesApi('/documents')
  const customers = useSalesApi('/customers')
  const pl = useSalesApi('/price-list')
  const meta = useSalesApi('/meta')
  const [type, setType] = useState('ALL')
  const [form, setForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const ready = customers.data && pl.data && meta.data

  const run = async (fn, ok) => { setBusy(true); try { const r = await fn(); toast(typeof ok === 'function' ? ok(r) : ok); list.reload(); if (customers.reload) customers.reload(); return true } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) } }
  const create = async (body) => { if (await run(() => salesApi.post('/quotations', body), (r) => (r.approval ? APPROVAL_MSG[r.approval] : `บันทึกใบเสนอราคา ${r.doc_no} แล้ว`))) setForm(false) }
  const act = (a, d) => { if (a.confirm && !window.confirm(a.confirm)) return; run(() => salesApi.post(a.path(d)), a.ok) }

  return (
    <>
      <PageHeader title="ใบเสนอราคา · ใบสั่งขาย · ใบส่งของ" sub="ใบเสนอราคา → ใบสั่งขาย → ใบส่งของ · แปลงเอกสารต่อกันได้ในหน้านี้" />
      <div className="mb-3"><Button disabled={!ready} onClick={() => setForm(true)}>+ สร้างใบเสนอราคา</Button></div>
      <Seg value={type} onChange={setType} options={[['ALL', 'ทั้งหมด'], ...Object.entries(TYPE)]} />
      <Notice tone="accent">หน้านี้ไม่ตัดสต็อกและไม่ออกใบแจ้งหนี้ — คลังสินค้าและฝ่ายบัญชีดำเนินการต่อจากใบส่งของ</Notice>
      <div className="mt-3">
        <Async state={list}>
          {(rows) => {
            const L = rows.filter((d) => type === 'ALL' || d.type === type)
            return (
              <Table head={['เลขที่', 'ลูกค้า', 'มูลค่า (ก่อน VAT)', 'ส่วนลด', 'สถานะ', 'อ้างอิง', '']}>
                {L.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">ไม่พบเอกสาร</td></tr>}
                {L.map((d) => {
                  const [label, tone] = STATUS[d.type][d.status] ?? [d.status, 'muted']
                  return (
                    <tr key={`${d.type}-${d.id}`}>
                      <td className="whitespace-nowrap px-3 py-2"><div>{d.doc_no}</div><div className="text-xs text-slate-500">{TYPE[d.type]}{!d.own && ` · ${d.owner_name ?? 'ของทีม'}`}</div></td>
                      <td className="px-3 py-2">{d.customer}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{baht(d.amount)}</td>
                      <td className="px-3 py-2">{d.discount ? `${d.discount}%` : '—'}</td>
                      <td className="px-3 py-2"><Tag tone={tone}>{label}</Tag></td>
                      <td className="px-3 py-2 text-slate-500">{d.ref ?? '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        {d.mine && (ACTIONS[d.type][d.status] ?? []).map((a) => <Button key={a.label} variant={a.danger ? 'danger' : 'ghost'} className="ml-1" disabled={busy} onClick={() => act(a, d)}>{a.label}</Button>)}
                      </td>
                    </tr>
                  )
                })}
              </Table>
            )
          }}
        </Async>
      </div>
      {form && ready && (
        <Modal title="สร้างใบเสนอราคา" wide onClose={() => setForm(false)}>
          <QuoteForm customers={customers.data} pl={pl.data} rules={meta.data.rules} busy={busy} onSubmit={create} onCancel={() => setForm(false)} />
        </Modal>
      )}
    </>
  )
}
