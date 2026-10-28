import { useState } from 'react'
import { Async, Button, Card, Field, Input, Notice, PageHeader, Select, Tag, thDate, useToast } from '@/shared/ui'
import { useWarehouseApi, warehouseApi } from '../api'
import Seg from '../components/Seg'
import { qty } from '../constants'

export default function MovementsPage() {
  const [tab, setTab] = useState('grn')
  return (
    <>
      <PageHeader title="รับ · เบิก · โอนย้าย" sub="รับสินค้าตามใบสั่งซื้อ จ่ายสินค้าตามใบเบิก และโอนระหว่างคลัง — ทุกรายการบันทึกลงประวัติการเคลื่อนไหวและ Audit Log" />
      <Seg className="mb-4" value={tab} onChange={setTab} options={[['grn', 'รับสินค้า (GRN)'], ['issue', 'จ่ายสินค้า'], ['transfer', 'โอนย้ายคลัง']]} />
      {tab === 'grn' ? <Receiving /> : tab === 'issue' ? <Issues /> : <Transfers />}
    </>
  )
}

/* ---------- รับสินค้า ---------- */
function Receiving() {
  const pos = useWarehouseApi('/receiving/pos')
  const meta = useWarehouseApi('/meta')
  return (
    <Async state={pos}>
      {(rows) => rows.length === 0 ? <Card className="py-10 text-center text-sm text-slate-500">ไม่มีใบสั่งซื้อที่รอรับสินค้า</Card> : (
        <div className="grid gap-3">
          {rows.map((po) => <PoCard key={po.id} po={po} meta={meta.data} onDone={pos.reload} />)}
        </div>
      )}
    </Async>
  )
}

function PoCard({ po, meta, onDone }) {
  const toast = useToast()
  const [wh, setWh] = useState('')
  const [busy, setBusy] = useState(false)
  const [rows, setRows] = useState(() => Object.fromEntries(po.lines.map((l) => [l.id, { acc: String(l.qty - l.qty_received), rej: '0', reason: '', bin: '' }])))
  const whId = wh || meta?.warehouses[0]?.id || ''
  const bins = (meta?.bins ?? []).filter((b) => b.warehouse_id === whId)
  const set = (id, k) => (e) => setRows((r) => ({ ...r, [id]: { ...r[id], [k]: e.target.value } }))

  const entries = po.lines.map((l) => ({ l, r: rows[l.id], acc: Number(rows[l.id].acc) || 0, rej: Number(rows[l.id].rej) || 0, left: l.qty - l.qty_received }))
  const used = entries.filter((e) => e.acc + e.rej > 0)
  const problem = entries.find((e) => e.acc < 0 || e.rej < 0 || e.acc + e.rej > e.left)?.l.name
    ?? entries.find((e) => e.rej > 0 && !e.r.reason.trim())?.l.name
  const err = problem ? (entries.find((e) => e.acc + e.rej > e.left) ? `${problem}: รับเกินจำนวนที่ค้างรับ — แจ้งจัดซื้อแก้ใบสั่งซื้อก่อน` : `${problem}: ระบุเหตุผลที่ชำรุด`) : null

  const submit = async () => {
    setBusy(true)
    try {
      const out = await warehouseApi.post('/receiving/grn', {
        po_id: po.id, warehouse_id: whId,
        lines: used.map((e) => ({ po_line_id: e.l.id, qty_accepted: e.acc, qty_rejected: e.rej || undefined, bin_id: e.r.bin || undefined, reject_reason: e.rej > 0 ? e.r.reason.trim() : undefined })),
      })
      toast(`บันทึกใบรับสินค้า ${out.doc_no} แล้ว`); onDone()
    } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }

  return (
    <Card>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-medium">{po.doc_no} <span className="text-sm font-normal text-slate-500">· {po.supplier_name}</span></div>
          <div className="text-xs text-slate-500">{po.expected_date ? `กำหนดส่ง ${thDate(po.expected_date)}` : 'ไม่ระบุกำหนดส่ง'} {po.status === 'partially_received' && <Tag tone="warn">รับแล้วบางส่วน</Tag>}</div>
        </div>
        <div className="w-52"><Select aria-label="รับเข้าคลัง" value={whId} onChange={(e) => setWh(e.target.value)} disabled={!meta}>{(meta?.warehouses ?? []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs text-slate-500"><tr><th className="py-1 pr-2 font-medium">สินค้า</th><th className="px-2 font-medium">ค้างรับ</th><th className="px-2 font-medium">รับปกติ</th><th className="px-2 font-medium">ชำรุด/ไม่รับ</th><th className="px-2 font-medium">เหตุผลที่ชำรุด</th><th className="px-2 font-medium">ตำแหน่ง</th></tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {entries.map(({ l, r, rej, left }) => (
              <tr key={l.id}>
                <td className="py-1.5 pr-2"><div>{l.name}</div><div className="text-xs text-slate-500">{l.sku} · สั่ง {qty(l.qty)} รับแล้ว {qty(l.qty_received)} {l.uom}</div></td>
                <td className="px-2 tabular-nums">{qty(left)}</td>
                <td className="px-2"><div className="w-24"><Input type="number" min="0" aria-label={`รับปกติ ${l.name}`} value={r.acc} onChange={set(l.id, 'acc')} /></div></td>
                <td className="px-2"><div className="w-24"><Input type="number" min="0" aria-label={`ชำรุด ${l.name}`} value={r.rej} onChange={set(l.id, 'rej')} /></div></td>
                <td className="px-2"><div className="w-44"><Input disabled={rej <= 0} maxLength={200} aria-label={`เหตุผล ${l.name}`} placeholder={rej > 0 ? 'จำเป็น' : '—'} value={r.reason} onChange={set(l.id, 'reason')} /></div></td>
                <td className="px-2"><div className="w-32"><Select aria-label={`ตำแหน่ง ${l.name}`} value={r.bin} onChange={set(l.id, 'bin')}><option value="">— ไม่ระบุ —</option>{bins.map((b) => <option key={b.id} value={b.id}>{b.code}</option>)}</Select></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">ของชำรุดบันทึกไว้ในใบรับสินค้าแต่ไม่เข้าสต็อก · รับเกินจำนวนสั่งไม่ได้</span>
        <Button disabled={busy || !whId || used.length === 0 || !!err} onClick={submit}>{busy ? 'กำลังบันทึก…' : 'บันทึกใบรับสินค้า'}</Button>
      </div>
    </Card>
  )
}

/* ---------- จ่ายสินค้า ---------- */
const ISSUE_STATUS = { pending_approval: ['รออนุมัติ', 'warn'], pending: ['รอจ่าย', 'accent'], issued: ['จ่ายแล้ว', 'ok'] }

function Issues() {
  const toast = useToast()
  const list = useWarehouseApi('/issues')
  const [busy, setBusy] = useState(null)
  const issue = async (s) => {
    if (!window.confirm(`ยืนยันจ่ายสินค้าตามใบเบิก ${s.doc_no} ?\nสต็อกจะถูกตัดทันที`)) return
    setBusy(s.id)
    try { await warehouseApi.post(`/issues/${s.id}/issue`); toast(`จ่ายสินค้า ${s.doc_no} แล้ว`); list.reload() }
    catch (e) { toast(e.message, 'bad') } finally { setBusy(null) }
  }
  return (
    <Async state={list}>
      {(rows) => rows.length === 0 ? <Card className="py-10 text-center text-sm text-slate-500">ไม่มีใบเบิกที่รอดำเนินการ</Card> : (
        <div className="grid gap-3">
          {rows.map((s) => {
            const short = s.lines.filter((l) => l.on_hand - l.reserved_other < l.qty)
            const [label, tone] = ISSUE_STATUS[s.status]
            return (
              <Card key={s.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{s.doc_no}</span><Tag tone={tone}>{label}</Tag><Tag>{s.issue_type === 'sales' ? 'ส่งของลูกค้า' : 'เบิกภายใน'}</Tag></div>
                    <div className="mt-0.5 text-xs text-slate-500">{[s.ref_doc_no && `อ้างอิง ${s.ref_doc_no}`, s.purpose, s.requester_name && `ผู้ขอ ${s.requester_name}`, s.warehouse_name, s.issued_at && `จ่ายเมื่อ ${thDate(s.issued_at)}`].filter(Boolean).join(' · ')}</div>
                  </div>
                  {s.status === 'pending' && <Button disabled={busy === s.id || short.length > 0} onClick={() => issue(s)}>{busy === s.id ? 'กำลังจ่าย…' : 'ยืนยันจ่าย'}</Button>}
                </div>
                <ul className="mt-2 divide-y divide-slate-100 text-sm dark:divide-slate-800">
                  {s.lines.map((l) => {
                    const avail = l.on_hand - l.reserved_other, ok = avail >= l.qty
                    return (
                      <li key={l.id} className="flex items-center justify-between gap-3 py-1.5">
                        <span>{l.name} <span className="text-xs text-slate-500">{l.sku}</span></span>
                        <span className="tabular-nums">ต้องการ {qty(l.qty)} {l.uom}{s.status !== 'issued' && <span className={`ml-2 text-xs ${ok ? 'text-slate-500' : 'text-red-600'}`}>พร้อมใช้ {qty(avail)}</span>}</span>
                      </li>
                    )
                  })}
                </ul>
                {s.status === 'pending' && short.length > 0 && <div className="mt-2"><Notice tone="bad">สต็อกพร้อมใช้ไม่พอ {short.length} รายการ — โอนจากคลังอื่นหรือแจ้งจัดซื้อก่อนจึงจะจ่ายได้</Notice></div>}
                {s.status === 'pending_approval' && <p className="mt-2 text-xs text-slate-500">ใบเบิกนี้ยังไม่ผ่านการอนุมัติ — จ่ายสินค้าไม่ได้จนกว่าจะอนุมัติ</p>}
              </Card>
            )
          })}
        </div>
      )}
    </Async>
  )
}

/* ---------- โอนย้ายคลัง ---------- */
function Transfers() {
  const toast = useToast()
  const list = useWarehouseApi('/transfers')
  const meta = useWarehouseApi('/meta')
  const stock = useWarehouseApi('/stock')
  const [f, setF] = useState({ item_id: '', from: '', to: '', qty: '' })
  const [busy, setBusy] = useState(false)
  const whs = meta.data?.warehouses ?? []
  const from = f.from || whs[0]?.id || '', to = f.to || whs.find((w) => w.id !== from)?.id || ''
  const item = stock.data?.items.find((i) => i.id === f.item_id)
  const have = item ? (item.on_hand[from] ?? 0) : null
  const n = Number(f.qty) || 0
  const valid = item && from && to && from !== to && n > 0

  const create = async () => {
    setBusy(true)
    try {
      const out = await warehouseApi.post('/transfers', { from_warehouse_id: from, to_warehouse_id: to, lines: [{ item_id: f.item_id, qty: n }] })
      toast(`สร้างใบโอน ${out.doc_no} แล้ว — สต็อกต้นทางถูกตัด รอปลายทางรับเข้า`); setF({ ...f, qty: '' }); list.reload(); stock.reload()
    } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }
  const receive = async (t) => {
    setBusy(true)
    try { await warehouseApi.post(`/transfers/${t.id}/receive`); toast(`รับเข้า ${t.to_name} แล้ว`); list.reload(); stock.reload() }
    catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <h2 className="mb-2 font-medium">สร้างใบโอนย้าย</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="สินค้า"><Select value={f.item_id} onChange={(e) => setF({ ...f, item_id: e.target.value })}><option value="">— เลือกสินค้า —</option>{(stock.data?.items ?? []).map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}</Select></Field>
          <Field label="จากคลัง"><Select value={from} onChange={(e) => setF({ ...f, from: e.target.value })}>{whs.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select></Field>
          <Field label="ไปคลัง"><Select value={to} onChange={(e) => setF({ ...f, to: e.target.value })}>{whs.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select></Field>
          <Field label={`จำนวน${item ? ` (${item.uom})` : ''}`} hint={have != null ? `ต้นทางมี ${qty(have)}` : undefined}><Input type="number" min="0" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /></Field>
        </div>
        {from === to && <p className="mt-2 text-sm text-red-600">คลังต้นทางและปลายทางต้องไม่ใช่คลังเดียวกัน</p>}
        <div className="mt-3 flex justify-end"><Button disabled={!valid || busy} onClick={create}>สร้างใบโอน</Button></div>
      </Card>
      <Async state={list}>
        {(rows) => (
          <Card className="p-0">
            {rows.length === 0 && <p className="p-4 text-sm text-slate-500">ยังไม่มีใบโอนย้าย</p>}
            {rows.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 text-sm last:border-0 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2"><span className="font-medium">{t.doc_no}</span><Tag tone={t.status === 'in_transit' ? 'warn' : 'ok'}>{t.status === 'in_transit' ? 'ระหว่างขนส่ง' : 'รับเข้าแล้ว'}</Tag></div>
                  <div className="text-xs text-slate-500">{t.from_name} → {t.to_name} · {t.lines.map((l) => `${l.name} ${qty(l.qty)} ${l.uom}`).join(', ')} · {thDate(t.created_at)}{t.actor_name && ` · ${t.actor_name}`}</div>
                </div>
                {t.status === 'in_transit' && <Button variant="ghost" disabled={busy} onClick={() => receive(t)}>รับเข้าปลายทาง</Button>}
              </div>
            ))}
          </Card>
        )}
      </Async>
    </div>
  )
}
