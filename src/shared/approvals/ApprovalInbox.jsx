import { useState } from 'react'
import { Async, Button, Card, PageHeader, Tag, Textarea, useToast } from '@/shared/ui'

const num = (n) => Math.round(n).toLocaleString('th-TH')
const age = (ts) => {
  const h = (Date.now() - new Date(ts).getTime()) / 3600000
  return h < 1 ? 'รอไม่ถึง 1 ชม.' : h < 24 ? `รอ ${Math.floor(h)} ชม.` : `รอ ${Math.floor(h / 24)} วัน`
}

const ACCENT = {
  indigo: { pill: 'border-indigo-900 bg-indigo-900 text-white', on: 'border-l-indigo-800 bg-indigo-50 dark:bg-indigo-950/40' },
  amber: { pill: 'border-amber-700 bg-amber-700 text-white', on: 'border-l-amber-700 bg-amber-50 dark:bg-amber-950/30' },
}

/**
 * กล่องอนุมัติกลาง — ใช้ซ้ำได้ทุกบทบาทที่มี endpoint /inbox และ /inbox/:id/decision (backend: approvals/routes.ts)
 *   api = createApi(...) ของบทบาทนั้น · useRoleApi = hook GET ของบทบาทนั้น (เช่น useExecutiveApi)
 */
export default function ApprovalInbox({ api, useRoleApi, title = 'อนุมัติรายการสำคัญ', sub, accent = 'indigo' }) {
  const toast = useToast()
  const inbox = useRoleApi('/inbox')
  const ac = ACCENT[accent] ?? ACCENT.indigo
  const [f, setF] = useState('ทั้งหมด')
  const [sel, setSel] = useState(null)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  const decide = async (c, action) => {
    if (action === 'reject' && !comment.trim()) return toast('ใส่เหตุผลที่ไม่อนุมัติก่อน', 'bad')
    setBusy(true)
    try {
      const r = await api.post(`/inbox/${c.id}/decision`, { action, comment: comment.trim() || undefined })
      toast(action === 'reject' ? 'ส่งกลับพร้อมเหตุผลแล้ว'
        : r.status === 'approved' ? `อนุมัติ ${c.doc_no} แล้ว${r.type === 'PO' ? ' · ส่งกลับจัดซื้อเพื่อส่งให้ผู้ขาย' : ''}`
        : `อนุมัติ ${c.doc_no} แล้ว · ส่งต่อ${r.next_role ?? 'ขั้นถัดไป'}`)
      setSel(null); setComment(''); inbox.reload()
    } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }

  return (
    <Async state={inbox}>
      {(all) => {
        const types = [...new Set(all.map((i) => i.type_label))]
        const list = all.filter((i) => f === 'ทั้งหมด' || i.type_label === f).sort((a, b) => Number(b.stale) - Number(a.stale) || new Date(a.waiting_since) - new Date(b.waiting_since))
        const c = list.find((i) => i.id === sel) ?? list[0]
        return (
          <>
            <PageHeader title={title} sub={`${sub ? `${sub} · ` : ''}รอคุณ ${all.length} รายการ`} />
            <div className="mb-3 flex flex-wrap gap-2">
              {['ทั้งหมด', ...types].map((t) => (
                <button key={t} aria-pressed={f === t} onClick={() => { setF(t); setSel(null) }} className={`rounded-full border px-3 py-1 text-sm ${f === t ? ac.pill : 'border-slate-300 dark:border-slate-600'}`}>
                  {t} {t === 'ทั้งหมด' ? all.length : all.filter((i) => i.type_label === t).length}
                </button>
              ))}
            </div>
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(280px,400px)_1fr]">
              <Card className="p-0">
                {list.length === 0 && <p className="p-7 text-center text-sm text-slate-500">ไม่มีรายการรออนุมัติ</p>}
                {list.map((i) => (
                  <button key={i.id} aria-current={c?.id === i.id} onClick={() => { setSel(i.id); setComment('') }}
                    className={`block w-full border-b border-l-[3px] border-slate-100 px-4 py-3 text-left last:border-b-0 dark:border-slate-800 ${c?.id === i.id ? ac.on : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                    <div className="flex justify-between gap-2"><span>{i.title}</span><b className="tabular-nums">{i.amount ? num(i.amount) : ''}</b></div>
                    <div className="text-xs text-slate-500">{i.type_label} · {i.requester_name}{i.requester_roles ? ` (${i.requester_roles})` : ''}</div>
                    <div className="mt-0.5 text-xs">{i.stale && <Tag tone="warn">ค้างนาน</Tag>} <span className="text-slate-500">{age(i.waiting_since)}</span></div>
                  </button>
                ))}
              </Card>
              {c ? (
                <Card>
                  <Tag>{c.type_label}</Tag> <span className="text-xs text-slate-500">{c.doc_no} · {age(c.waiting_since)}</span>
                  <h2 className="mb-0.5 mt-1.5 text-lg font-semibold">{c.title}</h2>
                  {c.amount > 0 && <div className="text-xl font-semibold tabular-nums">{num(c.amount)} บาท <span className="text-xs font-normal text-slate-500">ก่อน VAT</span></div>}
                  <div className="text-xs text-slate-500">{c.policy}</div>
                  <dl className="my-3 grid grid-cols-[130px_1fr] gap-x-3 gap-y-1.5 text-sm">
                    <dt className="text-slate-500">ผู้ขอ</dt><dd>{c.requester_name}{c.requester_roles ? ` (${c.requester_roles})` : ''}</dd>
                    {c.rows.map(([k, v], n) => <div key={n} className="contents"><dt className="text-slate-500">{k}</dt><dd>{v}</dd></div>)}
                  </dl>
                  {c.checks.map(([ok, text], n) => (
                    <div key={n} className="flex gap-2 py-0.5 text-sm"><b className={ok ? 'text-emerald-600' : 'text-amber-600'}>{ok ? '✓' : '!'}</b>{text}</div>
                  ))}
                  <Textarea className="mt-3 w-full" rows={2} maxLength={300} placeholder="ความเห็น (จำเป็นเมื่อไม่อนุมัติ)" aria-label="ความเห็น" value={comment} onChange={(e) => setComment(e.target.value)} />
                  <div className="mt-3 flex gap-2">
                    <Button disabled={busy} onClick={() => decide(c, 'approve')}>อนุมัติ</Button>
                    <Button variant="danger" disabled={busy} onClick={() => decide(c, 'reject')}>ไม่อนุมัติ</Button>
                  </div>
                </Card>
              ) : <Card className="py-9 text-center text-sm text-slate-500">เลือกรายการทางซ้าย</Card>}
            </div>
          </>
        )
      }}
    </Async>
  )
}
