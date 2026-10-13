import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useSelfService } from '../context'
import { useSelfServiceApi as useApi } from '../hooks'
import { Button, Card, Field, Input, Notice, PageHeader, Select, Textarea, addDays, baht, today, useToast } from '@/shared/ui'

const TYPES = [['EXPENSE', 'เบิกค่าใช้จ่าย'], ['PR', 'ขอซื้อ (PR)'], ['ISSUE', 'ขอเบิกสินค้า'], ['DATA_CHANGE', 'ขอแก้ข้อมูลที่ล็อก']]
const CATEGORIES = ['เดินทาง', 'รับรองลูกค้า', 'อุปกรณ์สำนักงาน', 'ฝึกอบรม', 'อื่น ๆ']
const FIELDS = ['ชื่อ-นามสกุล', 'ตำแหน่ง', 'ที่อยู่ตามทะเบียนบ้าน', 'วันเริ่มงาน']
const emptyLine = { item_id: '', description: '', qty: 1, uom: '', est_unit_price: 0 }

export default function NewRequestPage() {
  const toast = useToast()
  const nav = useNavigate()
  const { reloadMe, base } = useSelfService()
  const [sp, setSp] = useSearchParams()
  const type = TYPES.some(([k]) => k === sp.get('type')) ? sp.get('type') : 'EXPENSE'
  const items = useApi('/lookups/items')
  const [busy, setBusy] = useState(false)

  // ค่าในฟอร์มแต่ละประเภท
  const [exp, setExp] = useState({ category: CATEGORIES[0], expense_date: today(), amount: '', receipt_no: '', description: '' })
  const [pr, setPr] = useState({ need_by: addDays(today(), 14), reason: '', lines: [{ ...emptyLine }] })
  const [iss, setIss] = useState({ purpose: '', lines: [{ ...emptyLine }] })
  const [dc, setDc] = useState({ field: FIELDS[0], new_value: '', reason: '' })

  // มูลค่าเพื่อคำนวณเส้นทางอนุมัติ (เช่น เบิกเกิน 10,000 ต้องผ่านบัญชี)
  const amount = type === 'EXPENSE' ? Number(exp.amount) || 0 : type === 'PR' ? pr.lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.est_unit_price) || 0), 0) : 0
  const [route, setRoute] = useState({ steps: [], error: null })
  useEffect(() => {
    const t = setTimeout(() => {
      api.get(`/route-preview?type=${type}&amount=${amount}`).then((steps) => setRoute({ steps, error: null })).catch((e) => setRoute({ steps: [], error: e.message }))
    }, 300)
    return () => clearTimeout(t)
  }, [type, amount])

  const body = () => {
    if (type === 'EXPENSE') return { type, ...exp, amount: Number(exp.amount) }
    if (type === 'PR') return { type, need_by: pr.need_by, reason: pr.reason || undefined, lines: pr.lines.map(cleanLine) }
    if (type === 'ISSUE') return { type, purpose: iss.purpose, lines: iss.lines.map(cleanLine) }
    return { type, ...dc }
  }
  const valid = {
    EXPENSE: exp.amount > 0 && exp.receipt_no.trim() && exp.description.trim(),
    PR: pr.lines.every((l) => l.description.trim() && l.qty > 0 && l.uom.trim()),
    ISSUE: iss.purpose.trim() && iss.lines.every((l) => l.description.trim() && l.qty > 0 && l.uom.trim()),
    DATA_CHANGE: dc.new_value.trim() && dc.reason.trim(),
  }[type]

  const submit = async () => {
    setBusy(true)
    try {
      const r = await api.post('/requests', body())
      toast(`ส่งคำขอแล้ว${r.doc_no ? ` (${r.doc_no})` : ''} · เส้นทาง: ${r.route.join(' › ')}`)
      reloadMe(); nav(`${base}/requests`)
    } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title="ยื่นคำขออื่น ๆ" sub="ระบบกำหนดเส้นทางอนุมัติให้ตามประเภทและมูลค่า" />
      <div className="mb-4 flex flex-wrap gap-2">
        {TYPES.map(([k, label]) => (
          <button key={k} aria-pressed={type === k} onClick={() => setSp({ type: k })}
            className={`rounded-full border px-3 py-1 text-sm ${type === k ? 'border-rose-700 bg-rose-700 text-white' : 'border-slate-300 dark:border-slate-600'}`}>{label}</button>
        ))}
      </div>

      <Card className="grid max-w-2xl gap-3">
        {type === 'EXPENSE' && (<>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ประเภทค่าใช้จ่าย"><Select value={exp.category} onChange={(e) => setExp({ ...exp, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
            <Field label="วันที่เกิดค่าใช้จ่าย"><Input type="date" max={today()} value={exp.expense_date} onChange={(e) => setExp({ ...exp, expense_date: e.target.value })} /></Field>
            <Field label="จำนวนเงิน (บาท)"><Input type="number" min="0" value={exp.amount} onChange={(e) => setExp({ ...exp, amount: e.target.value })} /></Field>
            <Field label="เลขที่ใบเสร็จ / ใบกำกับภาษี"><Input value={exp.receipt_no} onChange={(e) => setExp({ ...exp, receipt_no: e.target.value })} /></Field>
          </div>
          <Field label="รายละเอียด"><Textarea value={exp.description} onChange={(e) => setExp({ ...exp, description: e.target.value })} maxLength={300} /></Field>
        </>)}

        {type === 'PR' && (<>
          <div className="grid grid-cols-2 gap-3">
            <Field label="วันที่ต้องการสินค้า"><Input type="date" min={today()} value={pr.need_by} onChange={(e) => setPr({ ...pr, need_by: e.target.value })} /></Field>
            <Field label="เหตุผล"><Input value={pr.reason} onChange={(e) => setPr({ ...pr, reason: e.target.value })} maxLength={300} /></Field>
          </div>
          <Lines lines={pr.lines} setLines={(lines) => setPr({ ...pr, lines })} items={items.data} withPrice />
          <p className="text-sm text-slate-600 dark:text-slate-300">มูลค่าประเมินรวม <b>{baht(amount)}</b> บาท</p>
        </>)}

        {type === 'ISSUE' && (<>
          <Field label="วัตถุประสงค์ / ศูนย์ต้นทุน"><Input value={iss.purpose} onChange={(e) => setIss({ ...iss, purpose: e.target.value })} maxLength={200} /></Field>
          <Lines lines={iss.lines} setLines={(lines) => setIss({ ...iss, lines })} items={items.data} />
        </>)}

        {type === 'DATA_CHANGE' && (<>
          <Field label="ข้อมูลที่ต้องการแก้"><Select value={dc.field} onChange={(e) => setDc({ ...dc, field: e.target.value })}>{FIELDS.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="ค่าใหม่"><Input value={dc.new_value} onChange={(e) => setDc({ ...dc, new_value: e.target.value })} maxLength={200} /></Field>
          <Field label="เหตุผล / เอกสารประกอบ" hint="HR อาจขอเอกสารเพิ่มเติม เช่น ทะเบียนสมรสหรือใบเปลี่ยนชื่อ"><Textarea value={dc.reason} onChange={(e) => setDc({ ...dc, reason: e.target.value })} maxLength={300} /></Field>
        </>)}

        {route.error ? <Notice tone="bad">{route.error}</Notice> : route.steps.length > 0 && (
          <Notice tone="accent">เส้นทางอนุมัติ: {route.steps.join(' › ')}</Notice>
        )}
        <div><Button disabled={busy || !valid || !!route.error} onClick={submit}>ส่งคำขอ</Button></div>
      </Card>
    </>
  )
}

const cleanLine = (l) => ({ ...(l.item_id ? { item_id: l.item_id } : {}), description: l.description.trim(), qty: Number(l.qty), uom: l.uom.trim(), est_unit_price: Number(l.est_unit_price) || 0 })

function Lines({ lines, setLines, items, withPrice = false }) {
  const upd = (i, patch) => setLines(lines.map((l, k) => (k === i ? { ...l, ...patch } : l)))
  const pick = (i, id) => {
    const it = items?.find((x) => x.id === id)
    upd(i, it ? { item_id: id, description: it.name, uom: it.uom } : { item_id: '' })
  }
  return (
    <div className="grid gap-2">
      <span className="text-sm text-slate-600 dark:text-slate-300">รายการ</span>
      {lines.map((l, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 rounded-md border border-slate-200 p-2 dark:border-slate-700">
          <div className="col-span-12 sm:col-span-5"><Select aria-label="เลือกสินค้า" value={l.item_id} onChange={(e) => pick(i, e.target.value)}>
            <option value="">— เลือกสินค้าในระบบ หรือพิมพ์เอง —</option>{items?.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
          </Select></div>
          <div className="col-span-12 sm:col-span-7"><Input aria-label="รายละเอียด" placeholder="ชื่อรายการ" value={l.description} onChange={(e) => upd(i, { description: e.target.value })} /></div>
          <div className="col-span-4"><Input aria-label="จำนวน" type="number" min="0" step="any" value={l.qty} onChange={(e) => upd(i, { qty: e.target.value })} /></div>
          <div className="col-span-4"><Input aria-label="หน่วย" placeholder="หน่วย" value={l.uom} onChange={(e) => upd(i, { uom: e.target.value })} /></div>
          {withPrice && <div className="col-span-4"><Input aria-label="ราคาประเมินต่อหน่วย" type="number" min="0" placeholder="ราคา/หน่วย" value={l.est_unit_price} onChange={(e) => upd(i, { est_unit_price: e.target.value })} /></div>}
          {lines.length > 1 && <button className="col-span-12 text-left text-xs text-red-700" onClick={() => setLines(lines.filter((_, k) => k !== i))}>ลบรายการนี้</button>}
        </div>
      ))}
      {lines.length < 20 && <button className="justify-self-start text-sm text-rose-700 underline dark:text-rose-400" onClick={() => setLines([...lines, { ...emptyLine }])}>+ เพิ่มรายการ</button>}
    </div>
  )
}
