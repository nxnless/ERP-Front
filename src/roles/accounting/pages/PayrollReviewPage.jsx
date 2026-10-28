import { useState } from 'react'
import { Async, Button, Card, Field, Notice, PageHeader, Table, Tag, Textarea, useToast } from '@/shared/ui'
import { accApi, useAccApi } from '../api'
import { fm, monthLabel } from '../format'

const MARK = { pass: ['✓', 'text-emerald-600'], fail: ['✕', 'text-red-600'], warn: ['!', 'text-amber-600'], manual: ['•', 'text-slate-500'] }
const STATUS = { submitted_to_accounting: ['รอบัญชีตรวจ', 'warn'], accounting_checked: ['ตรวจแล้ว รอผู้จัดการอนุมัติ', 'ok'], approved: ['อนุมัติแล้ว', 'ok'], paid: ['จ่ายแล้ว', 'ok'], rejected: ['ส่งกลับ HR', 'bad'] }
const DED = { SSO: 'ประกันสังคม', TAX: 'ภาษี', PROVIDENT: 'กองทุน', OTHER: 'อื่น ๆ' }
const ADJ = { BONUS: 'โบนัส', COMMISSION: 'คอมมิชชัน', OTHER_EARN: 'เงินอื่น ๆ', ABSENCE: 'หักขาดงาน', STUDENT_LOAN: 'หัก กยศ.', OTHER_DEDUCT: 'หักอื่น ๆ' }
const changed = () => window.dispatchEvent(new Event('acc:payroll-changed'))

export default function PayrollReviewPage() {
  const list = useAccApi('/payroll-review/runs')
  const [sel, setSel] = useState(null)
  return (
    <>
      <PageHeader title="ตรวจรอบเงินเดือน" sub="ขั้นตอน: HR จัดทำ → บัญชีตรวจ → ผู้จัดการอนุมัติ → จ่าย" />
      <Async state={list}>
        {(runs) => {
          if (runs.length === 0) return <Card className="py-10 text-center text-sm text-slate-500">ยังไม่มีรอบเงินเดือนที่ HR ส่งมาให้ตรวจ</Card>
          const cur = sel ?? (runs.find((r) => r.awaiting_me) ?? runs[0]).id
          return (
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-2">
                {runs.map((r) => (
                  <button key={r.id} type="button" aria-pressed={cur === r.id} onClick={() => setSel(r.id)}
                    className={`rounded-lg border px-3 py-1.5 text-left text-sm ${cur === r.id ? 'border-rose-700 bg-rose-50 dark:bg-rose-950' : 'border-slate-300 dark:border-slate-600'}`}>
                    <b>{r.run_no}</b> · {monthLabel(r.month)} <Tag tone={STATUS[r.status]?.[1] ?? 'muted'}>{STATUS[r.status]?.[0] ?? r.status}</Tag>
                  </button>
                ))}
              </div>
              <Review id={cur} onDone={() => list.reload()} />
            </div>
          )
        }}
      </Async>
    </>
  )
}

function Review({ id, onDone }) {
  const toast = useToast()
  const data = useAccApi(`/payroll-review/runs/${id}`)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const run = async (fn, ok) => {
    setBusy(true)
    try { await fn(); toast(ok); setNote(''); data.reload(); onDone(); changed(); return true } catch (e) { toast(e.message, 'bad'); data.reload() } finally { setBusy(false) }
  }
  return (
    <Async state={data}>
      {({ run: r, deductions, adjustments, exceptions, checks, can_act: canAct, ready }) => {
        const done = exceptions.filter((e) => e.confirmed_at).length
        const dedText = deductions.map((d) => `${DED[d.component]} ${fm(d.amount)}`).join(' · ')
        return (
          <div className="grid gap-4">
            <p className="text-sm text-slate-500">{r.run_no} · เงินเดือน {monthLabel(r.month)} · จ่าย {new Date(r.pay_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card><div className="text-xs text-slate-500">รายได้รวม</div><div className="text-2xl font-semibold tabular-nums">{fm(r.earnings)}</div></Card>
              <Card><div className="text-xs text-slate-500">รายการหักรวม</div><div className="text-2xl font-semibold tabular-nums">{fm(r.deductions)}</div><div className="text-xs text-slate-500">{dedText}</div></Card>
              <Card><div className="text-xs text-slate-500">จ่ายสุทธิ {r.headcount} คน</div><div className="text-2xl font-semibold tabular-nums">{fm(r.net)}</div>
                <div className="text-xs text-slate-500">{r.change_pct == null ? 'ไม่มีรอบก่อนหน้าให้เทียบ' : `เทียบเดือนก่อน ${r.change_pct > 0 ? '+' : ''}${r.change_pct}%`}</div></Card>
            </div>
            <Card>
              <div className="mb-1 font-medium">ตรวจอัตโนมัติ</div>
              {checks.map((c) => (
                <div key={c.key} className="flex gap-2 py-0.5 text-sm"><i className={`w-4 text-center font-semibold not-italic ${MARK[c.status][1]}`}>{MARK[c.status][0]}</i>
                  <span>{c.label}{c.detail && <span className="block text-xs text-slate-500">{c.detail}</span>}</span></div>
              ))}
            </Card>
            {adjustments.length > 0 && (
              <Card><div className="mb-1 font-medium">รายการที่ HR ปรับเพิ่ม (รวมทุกคน)</div>
                <div className="flex flex-wrap gap-2 text-sm">{adjustments.map((a) => <Tag key={a.component} tone={a.kind === 'earning' ? 'ok' : 'bad'}>{ADJ[a.component] ?? a.component} {a.n} รายการ · {fm(a.amount)}</Tag>)}</div></Card>
            )}
            <div>
              <div className="mb-1 font-medium">รายการผิดปกติที่ต้องยืนยัน {done}/{exceptions.length}</div>
              <Table head={['พนักงาน', 'รายการ', '']}>
                {exceptions.length === 0 && <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-500">ไม่มีรายการผิดปกติ</td></tr>}
                {exceptions.map((e) => (
                  <tr key={e.id}>
                    <td className="px-3 py-2">{e.employee}</td><td className="px-3 py-2">{e.description}</td>
                    <td className="px-3 py-2 text-right">{e.confirmed_at ? <Tag tone="ok">ยืนยันแล้ว</Tag>
                      : <Button variant="ghost" disabled={!canAct || busy} onClick={() => run(() => accApi.post(`/payroll-review/exceptions/${e.id}/confirm`), 'ยืนยันรายการแล้ว')}>ยืนยันถูกต้อง</Button>}</td>
                  </tr>
                ))}
              </Table>
            </div>
            {canAct ? (
              <>
                <Field label="หมายเหตุถึง HR หรือผู้จัดการ"><Textarea rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
                <div className="flex flex-wrap items-center gap-2">
                  <Button disabled={!ready || busy} onClick={() => run(() => accApi.post(`/payroll-review/runs/${id}/pass`, { note }), 'ผ่านการตรวจ ส่งต่อให้ผู้จัดการอนุมัติแล้ว')}>ผ่านการตรวจ ส่งผู้จัดการ</Button>
                  <Button variant="danger" disabled={!note.trim() || busy} onClick={() => run(() => accApi.post(`/payroll-review/runs/${id}/return`, { note }), 'ส่งกลับ HR พร้อมหมายเหตุแล้ว')}>ส่งกลับ HR</Button>
                  {!ready && <span className="text-xs text-slate-500">ยืนยันรายการผิดปกติให้ครบและแก้รายการตรวจอัตโนมัติที่ไม่ผ่านก่อนส่งต่อ · ส่งกลับต้องใส่หมายเหตุ</span>}
                </div>
              </>
            ) : <Notice tone="accent">รอบนี้ไม่ได้อยู่ในขั้นตรวจของคุณ ({STATUS[r.status]?.[0] ?? r.status})</Notice>}
          </div>
        )
      }}
    </Async>
  )
}
