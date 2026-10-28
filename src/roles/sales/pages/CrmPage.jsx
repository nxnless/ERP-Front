import { useState } from 'react'
import { Async, Button, Card, Input, PageHeader, Tag, baht, useToast } from '@/shared/ui'
import { salesApi, useSalesApi } from '../api'

export default function CrmPage() {
  const toast = useToast()
  const data = useSalesApi('/pipeline')
  const [lead, setLead] = useState({ company_name: '', amount: '' })
  const [busy, setBusy] = useState(false)

  const run = async (fn, ok) => { setBusy(true); try { const r = await fn(); toast(typeof ok === 'function' ? ok(r) : ok); data.reload(); return true } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) } }
  const add = async () => { if (await run(() => salesApi.post('/opportunities', { company_name: lead.company_name, amount: Number(lead.amount) || 0 }), 'เพิ่ม Lead แล้ว')) setLead({ company_name: '', amount: '' }) }
  const move = (o, stage) => run(() => salesApi.put(`/opportunities/${o.id}/stage`, { stage_code: stage.code }), (r) => (r.won ? 'ปิดการขายแล้ว — ไปสร้างใบเสนอราคาและใบสั่งขายต่อได้' : 'ย้ายขั้นแล้ว'))
  const month = (d) => { const x = new Date(d), n = new Date(); return x.getFullYear() === n.getFullYear() && x.getMonth() === n.getMonth() }

  return (
    <>
      <PageHeader title="CRM · Pipeline" sub="Lead → Opportunity → ปิดการขาย · กดลูกศรเพื่อย้ายขั้น (ย้ายได้เฉพาะรายการของตนเอง · หัวหน้าแผนกย้ายของลูกทีมได้)" />
      <Async state={data}>
        {({ stages, opportunities }) => {
          const prob = Object.fromEntries(stages.map((s) => [s.code, s.probability]))
          const open = opportunities.filter((o) => prob[o.stage_code] < 100)
          const won = opportunities.filter((o) => prob[o.stage_code] === 100 && month(o.updated_at))
          const sum = (xs) => xs.reduce((a, o) => a + o.amount, 0)
          return (
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Card><div className="text-xs text-slate-500">มูลค่า Pipeline ที่เปิดอยู่</div><div className="text-2xl font-semibold">{baht(sum(open))}</div></Card>
                <Card><div className="text-xs text-slate-500">ถ่วงน้ำหนักตามโอกาส</div><div className="text-2xl font-semibold">{baht(open.reduce((a, o) => a + (o.amount * prob[o.stage_code]) / 100, 0))}</div></Card>
                <Card><div className="text-xs text-slate-500">ปิดได้เดือนนี้</div><div className="text-2xl font-semibold text-green-700 dark:text-green-400">{baht(sum(won))}</div></Card>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="min-w-44 flex-[2]"><Input placeholder="ชื่อบริษัท Lead ใหม่" aria-label="ชื่อบริษัท" maxLength={150} value={lead.company_name} onChange={(e) => setLead({ ...lead, company_name: e.target.value })} /></div>
                <div className="min-w-32 flex-1"><Input type="number" min="0" placeholder="มูลค่าโดยประมาณ" aria-label="มูลค่าโดยประมาณ" value={lead.amount} onChange={(e) => setLead({ ...lead, amount: e.target.value })} /></div>
                <Button disabled={!lead.company_name.trim() || busy} onClick={add}>เพิ่ม Lead</Button>
              </div>
              <div className="overflow-x-auto pb-2">
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(190px, 1fr))` }}>
                  {stages.map((s, k) => {
                    const col = opportunities.filter((o) => o.stage_code === s.code)
                    return (
                      <div key={s.code} className="grid content-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/50">
                        <div className="flex justify-between px-1"><b>{s.name}</b><span className="text-xs text-slate-500">{s.probability}% · {baht(sum(col))}</span></div>
                        {col.length === 0 && <div className="p-2 text-xs text-slate-500">ยังไม่มีรายการ</div>}
                        {col.map((o) => (
                          <Card key={o.id} className="p-3">
                            <b>{o.company_name}</b>
                            <div>{baht(o.amount)}</div>
                            <div className="text-xs text-slate-500">{o.next_step}</div>
                            {!o.own && <div className="text-xs text-slate-500">ผู้ดูแล: {o.owner_name}</div>}
                            <div className="mt-2 flex items-center gap-2">
                              {o.mine ? (<>
                                {k > 0 && <Button variant="ghost" aria-label="ย้ายไปขั้นก่อนหน้า" disabled={busy} onClick={() => move(o, stages[k - 1])}>◀</Button>}
                                {k < stages.length - 1 && <Button variant="ghost" aria-label="ย้ายไปขั้นถัดไป" disabled={busy} onClick={() => move(o, stages[k + 1])}>▶</Button>}
                              </>) : <Tag>ของ {o.owner_name}</Tag>}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        }}
      </Async>
    </>
  )
}
