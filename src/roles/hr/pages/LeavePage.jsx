import { useState } from 'react'
import { Async, Button, Field, Input, PageHeader, Table, Tag, Textarea, thDate, useToast } from '@/shared/ui'
import { hrApi, useHrApi } from '../api'
import Modal from '../components/Modal'

const range = (a, b) => (!a ? '—' : !b || a === b ? thDate(a) : `${thDate(a)} – ${thDate(b)}`)
const changed = () => window.dispatchEvent(new Event('hr:leave-changed'))

export default function LeavePage() {
  const [tab, setTab] = useState('requests')
  return (
    <>
      <PageHeader title="ใบลาและนโยบายลา" sub="ผู้จัดการอนุมัติก่อน · HR พิจารณาเฉพาะใบที่เกินสิทธิ์คงเหลือหรือเอกสารไม่ครบ" />
      <div className="mb-4 flex gap-2">
        {[['requests', 'ใบลารอตรวจ'], ['policy', 'นโยบายลา']].map(([k, l]) => (
          <button key={k} aria-pressed={tab === k} onClick={() => setTab(k)} className={`rounded-full border px-3 py-1 text-sm ${tab === k ? 'border-rose-700 bg-rose-700 text-white' : 'border-slate-300 dark:border-slate-600'}`}>{l}</button>
        ))}
      </div>
      {tab === 'requests' ? <Requests /> : <Policies />}
    </>
  )
}

function Requests() {
  const toast = useToast()
  const list = useHrApi('/leave/requests')
  const [reject, setReject] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async (fn, ok) => {
    setBusy(true)
    try { await fn(); toast(ok); list.reload(); changed(); return true } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }
  const approve = (r) => window.confirm(`อนุมัติ ${r.request_no} เป็นกรณียกเว้น?`) && run(() => hrApi.post(`/leave/requests/${r.id}/approve`), `อนุมัติ ${r.request_no} เป็นกรณียกเว้นแล้ว`)
  const doReject = async () => { if (await run(() => hrApi.post(`/leave/requests/${reject.id}/reject`, { reason }), `ไม่อนุมัติ ${reject.request_no} แล้ว แจ้งพนักงานพร้อมเหตุผล`)) { setReject(null); setReason('') } }
  const status = (r) => ({
    pending_hr: ['รอ HR ตรวจ', 'warn'], pending_other: [`รอ${r.awaiting ?? 'ผู้อนุมัติ'}อนุมัติ`, 'warn'],
    approved: ['อนุมัติแล้ว', 'ok'], rejected: ['ไม่อนุมัติ', 'bad'], rejected_hr: ['HR ไม่อนุมัติ', 'bad'], cancelled: ['ยกเลิกแล้ว', 'muted'],
  })[r.status]

  return (
    <>
      <Async state={list}>
        {(rows) => (
          <Table head={['ใบลา', 'พนักงาน', 'รายการ', 'ผลตรวจ', 'สถานะ', '']}>
            {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">ไม่มีใบลาที่ต้องตรวจ</td></tr>}
            {rows.map((r) => {
              const mine = r.status === 'pending_hr', c = r.checks, [label, tone] = status(r)
              return (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-3 py-2">{r.request_no}</td>
                  <td className="px-3 py-2">{r.employee_name}</td>
                  <td className="px-3 py-2">{r.type_name} {r.days} วัน<div className="text-xs text-slate-500">{range(r.start_date, r.end_date)}</div></td>
                  <td className="px-3 py-2">
                    {mine ? (
                      <div className="flex flex-wrap gap-1">
                        <Tag tone={c.balanceOk ? 'ok' : 'bad'}>{c.balanceOk ? `สิทธิ์พอ (เหลือ ${r.balance})` : `สิทธิ์ไม่พอ (เหลือ ${r.balance})`}</Tag>
                        {c.certRequired && <Tag tone={c.certOk ? 'ok' : 'bad'}>{c.certOk ? 'เอกสารครบ' : 'ขาดใบรับรองแพทย์'}</Tag>}
                      </div>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-3 py-2"><Tag tone={tone}>{label}</Tag></td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    {mine && <>
                      <Button className="mr-1" disabled={busy} onClick={() => approve(r)}>อนุมัติเป็นกรณียกเว้น</Button>
                      <Button variant="danger" disabled={busy} onClick={() => { setReason(''); setReject(r) }}>ไม่อนุมัติ</Button>
                    </>}
                  </td>
                </tr>
              )
            })}
          </Table>
        )}
      </Async>
      <p className="mt-2 text-xs text-slate-500">ใบลาที่อยู่ในสิทธิ์ ผู้จัดการอนุมัติเองได้ · HR พิจารณาเฉพาะข้อยกเว้น · ไม่อนุมัติต้องระบุเหตุผล</p>
      {reject && (
        <Modal title={`ไม่อนุมัติ ${reject.request_no}`} onClose={() => setReject(null)}>
          <div className="grid gap-3">
            <Field label="เหตุผลที่ไม่อนุมัติ (แจ้งพนักงาน)"><Textarea value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} /></Field>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setReject(null)}>ยกเลิก</Button><Button variant="danger" disabled={!reason.trim() || busy} onClick={doReject}>ไม่อนุมัติ</Button></div>
          </div>
        </Modal>
      )}
    </>
  )
}

const COLS = [['annual_days', 'สิทธิ์/ปี (วัน)'], ['carry_days', 'ยกไปปีหน้า (วัน)'], ['notice_days', 'แจ้งล่วงหน้า (วัน)'], ['cert_after_days', 'ต้องแนบใบรับรองแพทย์เมื่อลา ≥ (วัน)']]

function Policies() {
  const list = useHrApi('/leave/policies')
  return (
    <Async state={list}>
      {(rows) => (
        <>
          <Table head={['ประเภทการลา', ...COLS.map(([, l]) => l)]}>
            {rows.map((p) => <PolicyRow key={p.leave_type} p={p} />)}
          </Table>
          <p className="mt-2 text-xs text-slate-500">การแก้นโยบายมีผลกับใบลาใหม่ และบันทึกใน Audit Log · ลาคลอดกำหนดตามกฎหมาย แก้ไม่ได้</p>
        </>
      )}
    </Async>
  )
}

function PolicyRow({ p }) {
  const toast = useToast()
  const [v, setV] = useState(() => Object.fromEntries(COLS.map(([k]) => [k, String(p[k])])))
  const [saved, setSaved] = useState(p)
  const save = async (k) => {
    const n = Number(v[k])
    if (!Number.isFinite(n) || n < 0 || v[k] === '' || n === saved[k]) return setV({ ...v, [k]: String(saved[k]) })
    try { const r = await hrApi.put(`/leave/policies/${p.leave_type}`, { [k]: n }); setSaved({ ...saved, ...r }); toast(`บันทึกนโยบาย${p.name}แล้ว`) }
    catch (e) { setV({ ...v, [k]: String(saved[k]) }); toast(e.message, 'bad') }
  }
  // ช่อง "ใบรับรองแพทย์" แสดงเฉพาะประเภทที่ใช้ (ลาป่วย หรือที่ตั้งค่าไว้แล้ว)
  const showCert = p.leave_type === 'sick' || saved.cert_after_days > 0
  return (
    <tr>
      <td className="px-3 py-2">{p.name}</td>
      {COLS.map(([k]) => (
        <td key={k} className="px-3 py-2">
          {p.statutory ? (k === 'annual_days' ? <span className="text-slate-500">ตามกฎหมาย {p.annual_days}</span> : <span className="text-slate-400">—</span>)
            : k === 'cert_after_days' && !showCert ? <span className="text-slate-400">—</span>
            : <div className="w-24"><Input type="number" min="0" max="365" step="0.5" aria-label={`${p.name} ${COLS.find(([c]) => c === k)[1]}`} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} onBlur={() => save(k)} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} /></div>}
        </td>
      ))}
    </tr>
  )
}
