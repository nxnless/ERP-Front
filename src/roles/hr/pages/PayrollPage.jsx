import { useState } from 'react'
import { Async, Button, Card, Field, Input, Notice, PageHeader, Select, Table, Tag, useToast } from '@/shared/ui'
import { hrApi, useHrApi } from '../api'
import { money, monthLabel } from '../format'

const STATUS = {
  draft: ['ฉบับร่าง', 'warn'], submitted_to_accounting: ['ส่งบัญชีตรวจแล้ว · รอบัญชีตรวจ', 'warn'], accounting_checked: ['บัญชีตรวจแล้ว · รอผู้จัดการอนุมัติ', 'warn'],
  approved: ['อนุมัติแล้ว รอจ่าย', 'ok'], rejected: ['ถูกส่งกลับ', 'bad'], paid: ['จ่ายแล้ว', 'ok'], cancelled: ['ยกเลิก', 'muted'],
}
const STEP = { approved: ['ผ่านแล้ว', 'ok'], pending: ['รอดำเนินการ', 'warn'], waiting: ['รอขั้นก่อนหน้า', 'muted'], rejected: ['ส่งกลับ', 'bad'], skipped: ['ข้าม', 'muted'] }
const st = (s) => STATUS[s] ?? [s, 'muted'] // กันสถานะที่ไม่รู้จักทำให้หน้าล่ม
const inReview = (s) => s === 'submitted_to_accounting' || s === 'accounting_checked'
const nextMonth = () => { const d = new Date(); d.setMonth(d.getMonth() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }

export default function PayrollPage() {
  const toast = useToast()
  const list = useHrApi('/payroll/runs')
  const [sel, setSel] = useState(null)
  const [month, setMonth] = useState(nextMonth())
  const [busy, setBusy] = useState(false)
  const run = async (fn, ok) => {
    setBusy(true)
    try { const r = await fn(); if (ok) toast(typeof ok === 'function' ? ok(r) : ok); list.reload(); return r } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }
  const create = async () => { const r = await run(() => hrApi.post('/payroll/runs', { month }), (x) => `สร้างรอบ ${x.run_no} แล้ว`); if (r) setSel(r.id) }

  return (
    <>
      <PageHeader title="เงินเดือน" sub="HR เตรียมรอบและรายการปรับปรุง · บัญชีตรวจ → ผู้จัดการอนุมัติ → จ่าย (HR อนุมัติจ่ายเองไม่ได้)" />
      <Async state={list}>
        {(runs) => (
          <div className="grid gap-4">
            <Table head={['รอบ', 'เดือน', 'พนักงาน', 'จ่ายสุทธิ', 'สถานะ']}>
              {runs.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-500">ยังไม่มีรอบเงินเดือน</td></tr>}
              {runs.map((r) => (
                <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${r.id === sel ? 'bg-rose-50 dark:bg-rose-950' : ''}`}>
                  <td className="px-3 py-2"><button type="button" className="font-medium hover:underline" onClick={() => setSel(r.id)}>{r.run_no}</button></td>
                  <td className="px-3 py-2">{monthLabel(r.month)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.headcount}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{money(r.net)}</td>
                  <td className="px-3 py-2"><Tag tone={st(r.status)[1]}>{st(r.status)[0]}</Tag></td>
                </tr>
              ))}
            </Table>
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-44"><Field label="เดือนของรอบใหม่"><Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></Field></div>
              <Button disabled={busy || !month} onClick={create}>สร้างรอบเงินเดือน {month && monthLabel(month)}</Button>
            </div>
            {sel && <Detail key={sel} id={sel} onChanged={() => list.reload()} />}
          </div>
        )}
      </Async>
    </>
  )
}

function Detail({ id, onChanged }) {
  const toast = useToast()
  const state = useHrApi(`/payroll/runs/${id}`)
  const [busy, setBusy] = useState(false)
  const [f, setF] = useState({ employee_id: '', component: 'BONUS', amount: '', reason: '' })
  const run = async (fn, ok) => {
    setBusy(true)
    try { const r = await fn(); if (ok) toast(typeof ok === 'function' ? ok(r) : ok); state.reload(); onChanged(); return r } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }
  return (
    <Async state={state}>
      {(data) => {
        // Async อาจเรียก children ตอนที่ข้อมูลยังเป็น null (เช่นเฟรมแรกหลังเปลี่ยนรอบ) — ไม่ destructure ถ้ายังไม่มีข้อมูล
        if (!data) return <p className="text-sm text-slate-500">กำลังโหลด…</p>
        const { run: r, totals: t, adjustments, employees, review, labels } = data
        const draft = r.status === 'draft', all = [...labels.earning, ...labels.deduction], labelOf = (c) => all.find((x) => x.component === c)?.label ?? c
        const add = async () => {
          const ok = await run(() => hrApi.post(`/payroll/runs/${r.id}/adjustments`, { employee_id: f.employee_id, component: f.component, amount: Number(f.amount), reason: f.reason }), 'เพิ่มรายการแล้ว')
          if (ok) setF({ ...f, amount: '', reason: '' })
        }
        const submit = () => window.confirm(`ส่งรอบ ${r.run_no} ให้บัญชีตรวจ?\nส่งแล้วแก้ไขยอดและรายการไม่ได้`) && run(() => hrApi.post(`/payroll/runs/${r.id}/submit`), (x) => `ส่งรอบ ${r.run_no} ให้บัญชีตรวจแล้ว (${x.request_no})`)
        return (
          <section className="grid gap-3">
            <h2 className="font-medium">รอบ {monthLabel(r.month)} ({r.run_no}) <Tag tone={st(r.status)[1]}>{st(r.status)[0]}</Tag></h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card><div className="text-xs text-slate-500">รายได้รวม</div><div className="text-2xl font-semibold tabular-nums">{money(t.gross)}</div><div className="text-xs text-slate-500">โบนัสและรายการเพิ่ม {money(t.earn)}</div></Card>
              <Card><div className="text-xs text-slate-500">รายการหักรวม</div><div className="text-2xl font-semibold tabular-nums">{money(t.deductions)}</div><div className="text-xs text-slate-500">รายการหักที่เพิ่ม {money(t.deduct)}</div></Card>
              <Card><div className="text-xs text-slate-500">จ่ายสุทธิ ({t.headcount} คน)</div><div className="text-2xl font-semibold tabular-nums">{money(t.net)}</div></Card>
            </div>
            {draft && (
              <Card>
                <div className="mb-2 font-medium">เพิ่มโบนัส / หักเงิน</div>
                <div className="grid gap-2 sm:grid-cols-[2fr_1.2fr_1fr] ">
                  <Select aria-label="พนักงาน" value={f.employee_id} onChange={(e) => setF({ ...f, employee_id: e.target.value })}><option value="">— เลือกพนักงาน —</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}</Select>
                  <Select aria-label="ประเภทรายการ" value={f.component} onChange={(e) => setF({ ...f, component: e.target.value })}>
                    <optgroup label="เพิ่ม">{labels.earning.map((l) => <option key={l.component} value={l.component}>{l.label}</option>)}</optgroup>
                    <optgroup label="หัก">{labels.deduction.map((l) => <option key={l.component} value={l.component}>{l.label}</option>)}</optgroup>
                  </Select>
                  <Input aria-label="จำนวนเงิน" type="number" min="1" placeholder="จำนวนเงิน" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <div className="min-w-48 flex-1"><Input aria-label="เหตุผล" placeholder="เหตุผล (จำเป็น)" maxLength={300} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></div>
                  <Button disabled={busy || !f.employee_id || !(Number(f.amount) > 0) || !f.reason.trim()} onClick={add}>เพิ่มรายการ</Button>
                </div>
              </Card>
            )}
            <Table head={['พนักงาน', 'ประเภท', 'จำนวน', 'เหตุผล', '']}>
              {adjustments.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">ยังไม่มีรายการปรับปรุง</td></tr>}
              {adjustments.map((a) => (
                <tr key={a.id}>
                  <td className="px-3 py-2">{a.full_name}</td>
                  <td className="px-3 py-2"><Tag tone={a.kind === 'earning' ? 'ok' : 'bad'}>{labelOf(a.component)}</Tag></td>
                  <td className="px-3 py-2 text-right tabular-nums">{a.kind === 'earning' ? '+' : '−'}{money(a.amount)}</td>
                  <td className="px-3 py-2 text-slate-500">{a.reason}</td>
                  <td className="px-3 py-2 text-right">{draft && <Button variant="danger" disabled={busy} onClick={() => run(() => hrApi.delete(`/payroll/runs/${r.id}/adjustments/${a.id}`), 'ลบรายการแล้ว')}>ลบ</Button>}</td>
                </tr>
              ))}
            </Table>
            {draft && <div><Button disabled={busy || t.headcount === 0} onClick={submit}>ส่งให้บัญชีตรวจ</Button></div>}
            {review.length > 0 && (
              <Card>
                <div className="mb-1 font-medium">ความคืบหน้าการอนุมัติ</div>
                {review.map((v) => (
                  <div key={v.seq} className="flex flex-wrap items-baseline gap-2 py-0.5 text-sm">
                    <span className="w-40">{v.seq}. {v.role_name}</span>
                    <Tag tone={STEP[v.status]?.[1] ?? 'muted'}>{STEP[v.status]?.[0] ?? v.status}</Tag>
                    {v.actor && <span className="text-xs text-slate-500">{v.actor}</span>}
                    {v.comment && <span className="text-slate-600 dark:text-slate-300">“{v.comment}”</span>}
                  </div>
                ))}
              </Card>
            )}
            {inReview(r.status) && <Notice tone="accent">ส่งให้บัญชีตรวจแล้ว ({r.request_no}) — แก้ไขไม่ได้</Notice>}
            {r.status === 'rejected' && (
              <Notice tone="bad">
                รอบนี้ถูกส่งกลับ ({r.request_no}){review.find((v) => v.status === 'rejected')?.comment ? ` — หมายเหตุ: “${review.find((v) => v.status === 'rejected').comment}”` : ''} · เปิดกลับเป็นฉบับร่างเพื่อแก้ไขแล้วส่งใหม่{' '}
                <Button variant="ghost" disabled={busy} onClick={() => run(() => hrApi.post(`/payroll/runs/${r.id}/reopen`), 'เปิดกลับเป็นฉบับร่างแล้ว')}>เปิดแก้ไข</Button>
              </Notice>
            )}
          </section>
        )
      }}
    </Async>
  )
}
