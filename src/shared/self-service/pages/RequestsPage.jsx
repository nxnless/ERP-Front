import { useState } from 'react'
import { api } from '../api'
import { useSelfService } from '../context'
import { useSelfServiceApi as useApi } from '../hooks'
import { Async, Button, Card, PageHeader, Tag, thDate, useToast } from '@/shared/ui'
import { STATUS, TYPE_LABEL } from '../constants'

const STEP_CLS = {
  done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  pending: 'bg-amber-100 text-amber-800 font-semibold dark:bg-amber-900/40 dark:text-amber-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  waiting: 'border border-slate-200 text-slate-500 dark:border-slate-700',
  skipped: 'border border-slate-200 text-slate-400 line-through dark:border-slate-700',
}
const FILTERS = [['all', 'ทั้งหมด'], ['pending', 'รอดำเนินการ'], ['done', 'เสร็จสิ้น']]

export default function RequestsPage() {
  const toast = useToast()
  const { reloadMe, base } = useSelfService()
  const list = useApi('/requests')
  const [filter, setFilter] = useState('all')

  const cancel = async (r) => {
    if (!window.confirm(`ยกเลิกคำขอ ${r.request_no} ?`)) return
    try {
      await api.post(`/requests/${r.id}/cancel`)
      toast('ยกเลิกคำขอแล้ว'); list.reload(); reloadMe()
    } catch (e) { toast(e.message, 'bad') }
  }

  return (
    <>
      <PageHeader title="สถานะคำขอของฉัน" sub="ใบลาไปที่ผู้จัดการของคุณก่อน ถ้าลาเกินสิทธิ์ระบบส่งต่อให้ HR พิจารณาเพิ่ม" />
      <div className="mb-3 flex gap-2">
        {FILTERS.map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} aria-pressed={filter === k}
            className={`rounded-full border px-3 py-1 text-sm ${filter === k ? 'border-rose-700 bg-rose-700 text-white' : 'border-slate-300 dark:border-slate-600'}`}>{label}</button>
        ))}
      </div>
      <Async state={list}>
        {(rows) => {
          const shown = rows.filter((r) => filter === 'all' || (filter === 'pending' ? r.status === 'pending' : r.status !== 'pending'))
          if (!shown.length) return <Card className="py-10 text-center text-sm text-slate-500">ไม่มีคำขอในหมวดนี้</Card>
          return (
            <div className="grid gap-3">
              {shown.map((r) => {
                const [label, tone] = STATUS[r.status] ?? [r.status, 'muted']
                const rejected = r.steps.find((s) => s.status === 'rejected')
                return (
                  <Card key={r.id}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2"><Tag tone="accent">{TYPE_LABEL[r.type] ?? r.type}</Tag><span className="text-xs text-slate-500">{r.request_no} · ยื่นเมื่อ {thDate(r.created_at)}</span></div>
                        <div className="mt-1 font-medium">{r.payload?.summary ?? '—'}</div>
                      </div>
                      <Tag tone={tone}>{label}</Tag>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className={`rounded-full px-2.5 py-0.5 ${STEP_CLS.done}`}>ยื่นคำขอ</span>
                      {r.steps.map((s) => (
                        <span key={s.seq} className="flex items-center gap-1.5"><span className="text-slate-400">›</span><span className={`rounded-full px-2.5 py-0.5 ${STEP_CLS[s.status]}`}>{s.role}</span></span>
                      ))}
                    </div>
                    {r.payload?.over_quota && <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">เกินสิทธิ์คงเหลือ — ต้องให้ HR พิจารณาเพิ่ม</p>}
                    {rejected?.comment && <p className="mt-2 rounded bg-red-50 px-2 py-1 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">เหตุผลที่ไม่อนุมัติ: {rejected.comment}</p>}
                    {r.status === 'pending' && <div className="mt-3"><Button variant="ghost" onClick={() => cancel(r)}>ยกเลิกคำขอ</Button></div>}
                  </Card>
                )
              })}
            </div>
          )
        }}
      </Async>
    </>
  )
}
