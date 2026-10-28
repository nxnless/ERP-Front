import { useEffect, useState } from 'react'
import { Async, Button, Card, PageHeader, Table, Tag, Textarea, useToast } from '@/shared/ui'
import { purchasingApi, usePurchasingApi } from '../api'

const num = (n) => Math.round(n).toLocaleString('th-TH')

export default function RfqPage() {
  const toast = useToast()
  const data = usePurchasingApi('/rfqs')
  const [sel, setSel] = useState(0)
  const [pick, setPick] = useState(null) // quote id
  const [why, setWhy] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { setPick(null); setWhy('') }, [sel])

  const submit = async (rfq) => {
    setBusy(true)
    try {
      const r = await purchasingApi.post(`/rfqs/${rfq.id}/select`, { quote_id: pick, justification: why.trim() || undefined })
      toast(`ออก ${r.doc_no} แล้ว · รออนุมัติ: ${r.route.join(' › ')}`); setPick(null); setWhy(''); data.reload()
    } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title="เปรียบเทียบใบเสนอราคา (RFQ)" sub="คะแนนรวม 100 = ราคา 50 + ระยะเวลาส่งมอบ 25 + เงื่อนไขเครดิต 25 · เทียบเฉพาะผู้ที่เสนอราคาครบทุกรายการ" />
      <Async state={data}>
        {(rfqs) => {
          if (rfqs.length === 0) return <Card className="py-10 text-center text-sm text-slate-500">ยังไม่มี RFQ</Card>
          const r = rfqs[Math.min(sel, rfqs.length - 1)]
          const open = r.status === 'open', one = r.lines.length === 1
          const q = r.quotes.find((x) => x.id === pick)
          const needWhy = open && q && q.total > r.min_total
          return (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                {rfqs.map((x, i) => (
                  <button key={x.id} aria-pressed={i === sel} onClick={() => setSel(i)} className={`rounded-full border px-3 py-1 text-sm ${i === sel ? 'border-amber-700 bg-amber-700 text-white' : 'border-slate-300 dark:border-slate-600'}`}>{x.doc_no}{x.status === 'open' ? '' : ' (ปิดแล้ว)'}</button>
                ))}
              </div>
              <Card className="mb-3">
                <b>{r.title}</b> <span className="text-sm text-slate-500">· {open ? 'เปิดรับราคา' : `ปิดแล้ว${r.po_doc_no ? ` ออก ${r.po_doc_no}` : ''}`}</span>
                <div className="mt-1 text-sm text-slate-500">{r.lines.map((l) => `${l.description} ${num(l.qty)} ${l.uom}`).join(' · ')}</div>
              </Card>
              <Table head={['', 'ผู้เสนอราคา', ...(one ? [`ราคา/${r.lines[0].uom}`] : []), 'รวม (ก่อน VAT)', 'ส่งมอบ', 'เครดิต', 'คะแนน']}>
                {r.quotes.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">ยังไม่มีผู้เสนอราคา</td></tr>}
                {r.quotes.map((x) => (
                  <tr key={x.id} className={x.selected ? 'bg-amber-50 dark:bg-amber-950/30' : ''}>
                    <td className="px-3 py-2"><input type="radio" name="rfq-pick" aria-label={`เลือก ${x.supplier_name}`} disabled={!open || !x.complete} checked={pick === x.id} onChange={() => setPick(x.id)} /></td>
                    <td className="px-3 py-2">{x.supplier_name} {x.best && <Tag tone="ok">คะแนนสูงสุด</Tag>} {x.lowest && <Tag>ราคาต่ำสุด</Tag>} {x.selected && <Tag tone="accent">ที่เลือก</Tag>} {!x.complete && <Tag tone="warn">เสนอราคาไม่ครบ</Tag>}
                      {x.selected && x.justification && <div className="text-xs text-slate-500">เหตุผล: {x.justification}</div>}</td>
                    {one && <td className="px-3 py-2 text-right tabular-nums">{x.prices[r.lines[0].id] != null ? num(x.prices[r.lines[0].id]) : '—'}</td>}
                    <td className="px-3 py-2 text-right tabular-nums">{x.total != null ? num(x.total) : '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">{x.lead_time_days} วัน</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">{x.credit_days} วัน</td>
                    <td className="px-3 py-2 text-right tabular-nums"><b>{x.score ?? '—'}</b></td>
                  </tr>
                ))}
              </Table>
              {open && (
                <div className="mt-3 grid gap-3">
                  {needWhy && <Textarea rows={2} maxLength={300} placeholder="เหตุผลที่ไม่เลือกราคาต่ำสุด (จำเป็น)" aria-label="เหตุผลที่ไม่เลือกราคาต่ำสุด" value={why} onChange={(e) => setWhy(e.target.value)} />}
                  <div><Button disabled={!pick || busy || (needWhy && !why.trim())} onClick={() => submit(r)}>ออก PO จากผู้ขายที่เลือก</Button></div>
                </div>
              )}
            </>
          )
        }}
      </Async>
    </>
  )
}
