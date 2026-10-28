import { useState } from 'react'
import { Async, Button, Card, Field, Input, Notice, PageHeader, Table, Tag, thDate, useToast } from '@/shared/ui'
import { accApi, useAccApi } from '../api'
import Modal from '../components/Modal'
import Tabs from '../components/Tabs'
import { curMonth, fm, monthLabel } from '../format'

const FORM = { PP30: ['ภ.พ.30', 'ภาษีมูลค่าเพิ่ม'], PND1: ['ภ.ง.ด.1', 'ภาษีเงินเดือน'], PND3: ['ภ.ง.ด.3', 'หัก ณ ที่จ่าย บุคคลธรรมดา'], PND53: ['ภ.ง.ด.53', 'หัก ณ ที่จ่าย นิติบุคคล'], SSO: ['ประกันสังคม', 'นำส่งประกันสังคม'] }
const ETAX = { sent: ['ส่งแล้ว', 'ok'], pending: ['รอส่ง', 'warn'], rejected: ['ถูกปฏิเสธ', 'bad'] }

export default function TaxPage() {
  const [tab, setTab] = useState('tax')
  return (
    <>
      <PageHeader title="ภาษีและ e-Tax Invoice" sub="ภาษีขาย ภาษีซื้อ แบบที่ต้องยื่น และการส่งใบกำกับภาษีอิเล็กทรอนิกส์" />
      <Tabs value={tab} onChange={setTab} options={[['tax', 'ภาษี'], ['etax', 'e-Tax Invoice']]} />
      {tab === 'tax' ? <Tax /> : <Etax />}
    </>
  )
}

function Tax() {
  const toast = useToast()
  const [month, setMonth] = useState(curMonth(1))
  const data = useAccApi(`/tax?month=${month}`)
  const [busy, setBusy] = useState(false)
  const run = async (fn, ok) => { setBusy(true); try { await fn(); toast(ok); data.reload() } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) } }
  const status = (f) => {
    if (f.status === 'filed') return <Tag tone="ok">ยื่นแล้ว</Tag>
    const today = new Date().toISOString().slice(0, 10), due = String(f.due_date).slice(0, 10)
    if (due < today) return <Tag tone="bad">เลยกำหนด</Tag>
    if (due === today) return <Tag tone="bad">ครบกำหนดวันนี้</Tag>
    return <Tag tone="warn">{f.status === 'ready' ? 'พร้อมยื่น' : 'เตรียมข้อมูล'}</Tag>
  }
  const file = (f) => { const ref = window.prompt(`บันทึกว่ายื่น ${FORM[f.form_code][0]} แล้ว — เลขอ้างอิง (ถ้ามี)`, ''); if (ref !== null) run(() => accApi.post(`/tax/filings/${f.id}/file`, { reference: ref }), 'บันทึกการยื่นแล้ว') }
  return (
    <Async state={data}>
      {(d) => (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-44"><Field label="รอบภาษี"><Input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} /></Field></div>
            <span className="pb-2 text-sm text-slate-500">{monthLabel(month)}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card><div className="text-xs text-slate-500">ภาษีขาย</div><div className="text-2xl font-semibold tabular-nums">{fm(d.output_vat)}</div></Card>
            <Card><div className="text-xs text-slate-500">ภาษีซื้อ</div><div className="text-2xl font-semibold tabular-nums">{fm(d.input_vat)}</div></Card>
            <Card><div className="text-xs text-slate-500">ภ.พ.30 {d.payable < 0 ? 'ขอคืน/ยกไป' : 'ต้องชำระ'}</div><div className="text-2xl font-semibold tabular-nums">{fm(d.payable)}</div><div className="text-xs text-slate-500">ภาษีขาย − ภาษีซื้อ (จากใบกำกับที่ออกในเดือนนี้)</div></Card>
          </div>
          <Table head={['แบบ', 'รายการ', 'กำหนดยื่น', 'ยอด (บาท)', 'สถานะ', '']}>
            {d.filings.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-500">ยังไม่มีแบบของรอบนี้ <Button variant="ghost" disabled={busy} onClick={() => run(() => accApi.post('/tax/filings/generate', { month }), 'เตรียม ภ.พ.30 แล้ว')}>เตรียม ภ.พ.30</Button></td></tr>}
            {d.filings.map((f) => (
              <tr key={f.id}>
                <td className="px-3 py-2">{FORM[f.form_code][0]}</td><td className="px-3 py-2">{FORM[f.form_code][1]}</td><td className="px-3 py-2">{thDate(f.due_date)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fm(f.amount)}</td><td className="px-3 py-2">{status(f)}</td>
                <td className="px-3 py-2 text-right">{f.status !== 'filed' && <Button variant="ghost" disabled={busy} onClick={() => file(f)}>บันทึกว่ายื่นแล้ว</Button>}</td>
              </tr>
            ))}
          </Table>
        </div>
      )}
    </Async>
  )
}

function Etax() {
  const toast = useToast()
  const list = useAccApi('/tax/etax')
  const [fix, setFix] = useState(null) // { inv, tax_id }
  const [busy, setBusy] = useState(false)
  const send = async (inv, party_tax_id) => {
    setBusy(true)
    try { await accApi.post(`/tax/etax/${inv.id}/send`, party_tax_id ? { party_tax_id } : {}); toast(`ส่ง ${inv.doc_no} ให้กรมสรรพากรแล้ว`); setFix(null) }
    catch (e) { toast(e.message, 'bad') } finally { setBusy(false); list.reload() }
  }
  return (
    <>
      <Async state={list}>
        {(rows) => (
          <>
            <Table head={['เลขที่ใบกำกับ', 'ลูกค้า', 'มูลค่า', 'สถานะ', '']}>
              {rows.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-500">ไม่มีใบกำกับที่ต้องส่ง e-Tax</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2">{r.doc_no}</td><td className="px-3 py-2">{r.party}</td><td className="px-3 py-2 text-right tabular-nums">{fm(r.total)}</td>
                  <td className="px-3 py-2"><Tag tone={ETAX[r.etax_status][1]}>{ETAX[r.etax_status][0]}</Tag>{r.etax_error && <div className="mt-0.5 text-xs text-red-600">{r.etax_error}</div>}{r.etax_ref && <div className="mt-0.5 text-xs text-slate-500">{r.etax_ref}</div>}</td>
                  <td className="px-3 py-2 text-right">
                    {r.etax_status === 'pending' && <Button variant="ghost" disabled={busy} onClick={() => send(r)}>ส่งสรรพากร</Button>}
                    {r.etax_status === 'rejected' && <Button variant="ghost" disabled={busy} onClick={() => setFix({ inv: r, tax_id: '' })}>แก้ไขและส่งซ้ำ</Button>}
                  </td>
                </tr>
              ))}
            </Table>
            <p className="mt-2 text-xs text-slate-500">{rows.filter((r) => r.etax_status !== 'sent').length} ฉบับยังไม่เสร็จ · การส่งต้องเชื่อมต่อผู้ให้บริการ e-Tax (ดู lib/etax.ts) — ถ้ายังไม่เชื่อมต่อ ระบบจะแจ้งและไม่เปลี่ยนสถานะ</p>
          </>
        )}
      </Async>
      {fix && (
        <Modal title={`แก้ไขและส่งซ้ำ ${fix.inv.doc_no}`} onClose={() => setFix(null)}>
          <div className="grid gap-3">
            {fix.inv.etax_error && <Notice tone="bad">{fix.inv.etax_error}</Notice>}
            <Field label="เลขประจำตัวผู้เสียภาษีของผู้ซื้อ (13 หลัก)" hint="เว้นว่างเพื่อส่งซ้ำด้วยเลขเดิม"><Input inputMode="numeric" maxLength={13} value={fix.tax_id} onChange={(e) => setFix({ ...fix, tax_id: e.target.value.replace(/\D/g, '') })} /></Field>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setFix(null)}>ยกเลิก</Button><Button disabled={busy || (fix.tax_id !== '' && fix.tax_id.length !== 13)} onClick={() => send(fix.inv, fix.tax_id)}>ส่งซ้ำ</Button></div>
          </div>
        </Modal>
      )}
    </>
  )
}
