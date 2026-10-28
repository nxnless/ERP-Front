import { useState } from 'react'
import { Async, Button, Card, Notice, Tag, Textarea, baht, thDate, useToast } from '@/shared/ui'
import { managerApi, useManagerApi } from '../api'

const STEP_TONE = { approved: 'ok', pending: 'warn', rejected: 'bad', skipped: 'muted', waiting: 'muted' }

/** รายละเอียดคำขอ + ปุ่มตัดสินใจ  (ใช้ key={id} จากหน้าแม่เพื่อล้างความเห็น/ติ๊กยืนยันเมื่อเปลี่ยนรายการ) */
export default function DetailPanel({ id, onDone }) {
  const toast = useToast()
  const d = useManagerApi(`/inbox/${id}`)
  const [comment, setComment] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)

  const act = async (action, x) => {
    if (action === 'reject' && !comment.trim()) return toast('ใส่เหตุผลที่ไม่อนุมัติก่อน', 'bad')
    if (action === 'approve' && x.confirm_text && !confirm) return toast('ติ๊กยืนยันการตรวจสอบก่อนอนุมัติ', 'bad')
    if (action === 'forward' && !window.confirm('ส่งต่อรายการนี้ให้ผู้บริหารอนุมัติ?')) return
    setBusy(true)
    try {
      await managerApi.post(`/inbox/${id}/${action}`, { comment: comment.trim() || undefined, confirm })
      toast(
        action === 'forward' ? 'ส่งต่อผู้บริหารแล้ว'
          : action === 'reject' ? 'ส่งกลับผู้ยื่นพร้อมเหตุผลแล้ว'
            : x.type === 'PAYROLL' ? 'อนุมัติแล้ว ส่งเข้ารอบจ่ายเงิน' : `อนุมัติ ${x.ref_no ?? x.request_no} แล้ว`,
      )
      onDone()
    } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }

  return (
    <Async state={d}>
      {(x) => (
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="accent">{x.type_label}</Tag>
            <span className="text-xs text-slate-500">{x.ref_no ?? x.request_no} · ผู้ยื่น {x.requester_name} · {thDate(x.created_at)}</span>
          </div>
          <h2 className="mt-2 text-lg font-semibold">{x.title}</h2>
          {x.amount > 0 && <div className="text-xl font-semibold">{baht(x.amount)}</div>}
          <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-500">
            เส้นทางอนุมัติ: {x.steps.map((s) => <Tag key={s.seq} tone={STEP_TONE[s.status]}>{s.role_name}</Tag>)}
          </div>

          <dl className="my-4 grid grid-cols-[130px_1fr] gap-x-3 gap-y-1.5 text-sm">
            {x.rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd>{v}</dd></div>)}
          </dl>
          <div className="grid gap-1 text-sm">
            {x.checks.map(([ok, text], i) => (
              <div key={i} className="flex gap-2"><b className={ok ? 'text-emerald-600' : 'text-amber-600'}>{ok ? '✓' : '!'}</b><span>{text}</span></div>
            ))}
          </div>

          {x.over_limit && <div className="mt-3"><Notice>เกินวงเงินอนุมัติของคุณ ({x.limit.toLocaleString('th-TH')} บาท) — ส่งต่อผู้บริหารเพื่ออนุมัติ คุณอนุมัติรายการนี้เองไม่ได้</Notice></div>}
          {x.confirm_text && (
            <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} /> {x.confirm_text}</label>
          )}
          <div className="mt-3"><Textarea rows={2} maxLength={300} placeholder="ความเห็น (จำเป็นเมื่อไม่อนุมัติ)" aria-label="ความเห็น" value={comment} onChange={(e) => setComment(e.target.value)} /></div>
          <div className="mt-3 flex flex-wrap gap-2">
            {x.over_limit
              ? <Button disabled={busy} onClick={() => act('forward', x)}>ส่งต่อผู้บริหาร</Button>
              : <Button disabled={busy} onClick={() => act('approve', x)}>{x.type === 'PAYROLL' ? 'อนุมัติรอบเงินเดือน' : 'อนุมัติ'}</Button>}
            <Button variant="danger" disabled={busy} onClick={() => act('reject', x)}>ไม่อนุมัติ</Button>
          </div>
        </Card>
      )}
    </Async>
  )
}
