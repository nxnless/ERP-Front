import { useMemo, useState } from 'react'
import { Async, Card, PageHeader, Tag, baht } from '@/shared/ui'
import { useManagerApi } from '../api'
import DetailPanel from '../components/DetailPanel'

const waited = (h) => (h < 1 ? 'เพิ่งยื่น' : h < 24 ? `รอ ${Math.floor(h)} ชม.` : `รอ ${Math.floor(h / 24)} วัน`)

export default function InboxPage() {
  const list = useManagerApi('/inbox')
  return (
    <Async state={list}>
      {({ rows }) => <Inbox rows={rows} reload={list.reload} />}
    </Async>
  )
}

function Inbox({ rows, reload }) {
  const [type, setType] = useState('')
  const [sel, setSel] = useState(null)
  const types = useMemo(() => {
    const m = new Map()
    rows.forEach((r) => m.set(r.type_label, (m.get(r.type_label) ?? 0) + 1))
    return [...m]
  }, [rows])
  const active = types.some(([l]) => l === type) ? type : ''
  const shown = active ? rows.filter((r) => r.type_label === active) : rows
  const cur = shown.find((r) => r.id === sel) ?? shown[0]
  const done = () => { setSel(null); reload(); window.dispatchEvent(new Event('manager:inbox-changed')) }

  return (
    <>
      <PageHeader title="กล่องงานรออนุมัติ" sub={`รอคุณอยู่ ${rows.length} รายการ · เฉพาะเอกสารของสาขาคุณ ไม่รวมคำขอของตนเอง`} />
      <div className="mb-3 flex flex-wrap gap-2">
        {[['', 'ทั้งหมด', rows.length], ...types.map(([l, n]) => [l, l, n])].map(([k, l, n]) => (
          <button key={k} aria-pressed={active === k} onClick={() => setType(k)}
            className={`rounded-full border px-3 py-1 text-sm ${active === k ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300 dark:border-slate-600'}`}>{l} {n}</button>
        ))}
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(300px,420px)_1fr]">
        <Card className="p-0">
          {shown.length === 0 && <p className="p-8 text-center text-sm text-slate-500">ไม่มีรายการรออนุมัติในหมวดนี้</p>}
          {shown.map((r) => (
            <button key={r.id} onClick={() => setSel(r.id)} aria-current={cur?.id === r.id}
              className={`block w-full border-b border-l-4 border-slate-100 px-4 py-3 text-left last:border-b-0 dark:border-slate-800 ${cur?.id === r.id ? 'border-l-teal-700 bg-teal-50 dark:bg-teal-950' : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <div className="flex justify-between gap-2"><span>{r.title ?? r.type_label}</span><span className="whitespace-nowrap font-semibold">{r.amount > 0 ? baht(r.amount) : ''}</span></div>
              <div className="text-xs text-slate-500">{r.type_label} · {r.ref_no ?? r.request_no} · {r.requester_name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                {r.urgent && <Tag tone="warn">เร่งด่วน</Tag>}
                {r.over_limit && <Tag tone="bad">เกินวงเงินคุณ</Tag>}
                {r.overdue && !r.urgent && <Tag tone="warn">ค้างเกิน 2 วัน</Tag>}
                <span>{waited(r.waiting_hours)}</span>
              </div>
            </button>
          ))}
        </Card>
        {cur ? <DetailPanel key={cur.id} id={cur.id} onDone={done} /> : <Card className="py-10 text-center text-sm text-slate-500">เลือกรายการทางซ้ายเพื่อดูรายละเอียด</Card>}
      </div>
    </>
  )
}
