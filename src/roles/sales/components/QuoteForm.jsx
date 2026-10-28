import { useMemo, useState } from 'react'
import { Button, Field, Input, Notice, Select, baht } from '@/shared/ui'

/**
 * ฟอร์มสร้างใบเสนอราคา — แสดงราคาตาม Price List ของลูกค้าเพื่อดูก่อนเท่านั้น (เซิร์ฟเวอร์คำนวณราคาจริงซ้ำเอง)
 *   customers = จาก GET /sales/customers · pl = จาก GET /sales/price-list · rules = จาก GET /sales/meta
 */
export default function QuoteForm({ customers, pl, rules, busy, onSubmit, onCancel }) {
  const [customerId, setCustomerId] = useState('')
  const [note, setNote] = useState('')
  const [lines, setLines] = useState([{ item_id: '', qty: '1', discount: '0' }])
  const customer = customers.find((c) => c.id === customerId)
  const defList = pl.lists.find((l) => l.is_default)?.id
  const items = useMemo(() => new Map(pl.items.map((i) => [i.id, i])), [pl])
  const unit = (id) => { const it = items.get(id); return it ? (it.prices[customer?.price_list_id] ?? it.prices[defList] ?? null) : null }
  const set = (k, patch) => setLines((ls) => ls.map((l, i) => (i === k ? { ...l, ...patch } : l)))

  const calc = lines.map((l) => {
    const u = unit(l.item_id), q = Number(l.qty), d = Number(l.discount)
    return { u, q, d, total: u == null ? 0 : Math.round(q * u * (100 - d)) / 100, ok: l.item_id && u != null && q > 0 && d >= 0 && d <= rules.max_discount_pct }
  })
  const sub = calc.reduce((s, c) => s + c.total, 0), vat = Math.round(sub * rules.vat_rate * 100) / 100
  const maxD = Math.max(0, ...calc.map((c) => c.d || 0))
  const valid = customerId && calc.every((c) => c.ok)

  return (
    <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); if (valid && !busy) onSubmit({ customer_id: customerId, note: note.trim() || undefined, lines: lines.map((l) => ({ item_id: l.item_id, qty: Number(l.qty), discount_pct: Number(l.discount) || 0 })) }) }}>
      <Field label="ลูกค้า">
        <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">— เลือกลูกค้า —</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.price_list_name ? ` (${c.price_list_name})` : ''}</option>)}
        </Select>
      </Field>
      <div className="grid gap-2">
        {lines.map((l, k) => (
          <div key={k} className="grid grid-cols-[1fr_80px_80px_auto] items-end gap-2">
            <Field label={k === 0 ? 'สินค้า' : ''}>
              <Select value={l.item_id} onChange={(e) => set(k, { item_id: e.target.value })}>
                <option value="">— เลือกสินค้า —</option>{pl.items.map((i) => <option key={i.id} value={i.id}>{i.sku} · {i.name}</option>)}
              </Select>
            </Field>
            <Field label={k === 0 ? 'จำนวน' : ''}><Input type="number" min="0" step="any" value={l.qty} onChange={(e) => set(k, { qty: e.target.value })} /></Field>
            <Field label={k === 0 ? 'ลด %' : ''}><Input type="number" min="0" max={rules.max_discount_pct} step="any" value={l.discount} onChange={(e) => set(k, { discount: e.target.value })} /></Field>
            <Button variant="ghost" disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((_, i) => i !== k))}>ลบ</Button>
            <div className="col-span-4 -mt-1 text-xs text-slate-500">
              {l.item_id && (calc[k].u == null ? <span className="text-red-600">สินค้านี้ยังไม่มีราคาใน Price List</span> : <>ราคา/{items.get(l.item_id).uom}: {baht(calc[k].u)} · รวม {baht(calc[k].total)}</>)}
            </div>
          </div>
        ))}
        <div><Button variant="ghost" onClick={() => setLines((ls) => [...ls, { item_id: '', qty: '1', discount: '0' }])}>+ เพิ่มรายการ</Button></div>
      </div>
      <Field label="หมายเหตุ"><Input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} /></Field>
      <div className="rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-800">
        รวมก่อน VAT <b>{baht(sub)}</b> · VAT {Math.round(rules.vat_rate * 100)}% {baht(vat)} · สุทธิ <b>{baht(sub + vat)}</b>
      </div>
      {maxD > rules.discount_free_pct && <Notice>ส่วนลดเกิน {rules.discount_free_pct}% — ต้องให้ผู้จัดการอนุมัติก่อนส่งให้ลูกค้า</Notice>}
      {sub > rules.exec_quote_threshold && <Notice>มูลค่าเกิน {baht(rules.exec_quote_threshold)} — ต้องให้ผู้บริหารอนุมัติก่อนส่งให้ลูกค้า</Notice>}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onCancel}>ยกเลิก</Button>
        <Button type="submit" disabled={!valid || busy}>{busy ? 'กำลังบันทึก…' : 'บันทึกใบเสนอราคา'}</Button>
      </div>
    </form>
  )
}
