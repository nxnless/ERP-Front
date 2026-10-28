import { useEffect, useState } from 'react'
import { Async, Button, Card, Notice, PageHeader, Select, Tag, useToast } from '@/shared/ui'
import { useWarehouseApi, warehouseApi } from '../api'
import { REASONS, qty, signed } from '../constants'

const tolerance = (system) => Math.ceil(system * 0.01) // ผลต่างไม่เกิน 1% ของยอดระบบ = อยู่ในเกณฑ์

export default function CountPage() {
  const toast = useToast()
  const meta = useWarehouseApi('/meta')
  const [wh, setWh] = useState('')
  const whId = wh || meta.data?.warehouses[0]?.id || ''
  const cur = useWarehouseApi(whId ? `/counts/current?warehouse_id=${whId}` : null)
  const [draft, setDraft] = useState({}) // line.id -> { counted, reason }
  const [busy, setBusy] = useState(false)
  useEffect(() => { setDraft({}) }, [whId, cur.data?.count?.id])

  const count = cur.data?.count
  const open = count?.status === 'open'
  const val = (l) => draft[l.id]?.counted ?? (l.counted_qty == null ? '' : String(l.counted_qty))
  const reason = (l) => draft[l.id]?.reason ?? l.reason_code ?? ''
  const edit = (l, k) => (e) => setDraft((d) => ({ ...d, [l.id]: { counted: val(l), reason: reason(l), ...d[l.id], [k]: e.target.value } }))
  const dirty = Object.keys(draft).length > 0

  const run = async (fn, ok) => { setBusy(true); try { const r = await fn(); if (ok) toast(typeof ok === 'function' ? ok(r) : ok); cur.reload(); return true } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) } }
  const payload = (lines) => ({ lines: lines.map((l) => ({ id: l.id, counted_qty: val(l) === '' ? null : Number(val(l)), reason_code: reason(l) || null })) })
  const start = () => run(() => warehouseApi.post('/counts', { warehouse_id: whId }), 'เปิดรอบตรวจนับแล้ว')
  const save = (lines) => warehouseApi.put(`/counts/${count.id}/lines`, payload(lines))
  const submit = async (lines) => {
    if (!window.confirm('ส่งผลตรวจนับ?\nส่งแล้วแก้ไม่ได้ และระบบจะสร้างคำขอปรับยอดให้ผู้จัดการอนุมัติ')) return
    await run(async () => { await save(lines); return warehouseApi.post(`/counts/${count.id}/submit`) }, (r) => `ส่งผลตรวจนับแล้ว (${r.request_no}) รอผู้จัดการอนุมัติ`)
  }

  return (
    <>
      <PageHeader title="ตรวจนับสต็อก" sub="กรอกหรือสแกนยอดนับจริง เทียบกับยอดในระบบ แล้วส่งผลให้ผู้จัดการอนุมัติ — คลังไม่ปรับยอดสต็อกเอง" />
      <div className="mb-3 w-64"><Select aria-label="คลัง" value={whId} onChange={(e) => setWh(e.target.value)} disabled={!meta.data}>{(meta.data?.warehouses ?? []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select></div>
      <Async state={cur}>
        {({ lines }) => {
          const missing = lines.filter((l) => val(l) === '').length
          const diffs = lines.filter((l) => val(l) !== '' && Number(val(l)) !== l.system_qty)
          const noReason = diffs.filter((l) => !reason(l))
          const ready = open && missing === 0 && noReason.length === 0
          return (
            <div className="grid gap-3">
              {!count || ['approved', 'rejected'].includes(count.status) ? (
                <Card className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm">
                    {count ? <>รอบล่าสุด <b>{count.doc_no}</b> <Tag tone={count.status === 'approved' ? 'ok' : 'bad'}>{count.status === 'approved' ? 'อนุมัติปรับยอดแล้ว' : 'ไม่อนุมัติ'}</Tag></> : 'ยังไม่มีรอบตรวจนับของคลังนี้'}
                  </div>
                  <Button disabled={busy || !whId} onClick={start}>เริ่มรอบตรวจนับใหม่</Button>
                </Card>
              ) : (
                <>
                  <Card className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm"><b>{count.doc_no}</b> · {count.warehouse_name} {open ? <Tag tone="warn">กำลังนับ</Tag> : <Tag tone="accent">ส่งผลแล้ว รอผู้จัดการอนุมัติ{count.request_no && ` (${count.request_no})`}</Tag>}</div>
                    <div className="text-xs text-slate-500">ยอดระบบถ่ายไว้ ณ ตอนเปิดรอบ</div>
                  </Card>
                  {!open && <Notice tone="accent">ส่งผลแล้ว — แก้ไขไม่ได้ ยอดสต็อกจะเปลี่ยนเมื่อผู้จัดการอนุมัติ</Notice>}
                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <tr><th className="px-3 py-2">สินค้า</th><th className="px-3 py-2">ตำแหน่ง</th><th className="px-3 py-2 text-right">ยอดระบบ</th><th className="px-3 py-2">ยอดนับจริง</th><th className="px-3 py-2 text-right">ผลต่าง</th><th className="px-3 py-2">สาเหตุผลต่าง</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {lines.map((l) => {
                          const filled = val(l) !== '', diff = filled ? Number(val(l)) - l.system_qty : null
                          const tone = diff == null ? 'muted' : diff === 0 ? 'ok' : Math.abs(diff) <= tolerance(l.system_qty) ? 'warn' : 'bad'
                          return (
                            <tr key={l.id}>
                              <td className="px-3 py-2"><div className="font-medium">{l.name}</div><div className="text-xs text-slate-500">{l.sku} · {l.uom}</div></td>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{l.location ?? '—'}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{qty(l.system_qty)}</td>
                              <td className="px-3 py-2"><input type="number" min="0" aria-label={`ยอดนับ ${l.name}`} disabled={!open || busy} value={val(l)} onChange={edit(l, 'counted')} className="w-24 rounded-md border border-slate-300 px-2 py-1 text-right tabular-nums disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900" /></td>
                              <td className="px-3 py-2 text-right">{diff == null ? <span className="text-slate-400">—</span> : <Tag tone={tone}>{diff === 0 ? 'ตรง' : signed(diff)}</Tag>}</td>
                              <td className="px-3 py-2">
                                {diff ? (
                                  <select aria-label={`สาเหตุ ${l.name}`} disabled={!open || busy} value={reason(l)} onChange={edit(l, 'reason')} className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900">
                                    <option value="">— เลือกสาเหตุ —</option>{Object.entries(REASONS).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
                                  </select>
                                ) : <span className="text-slate-400">—</span>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {open && (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-slate-500">{missing > 0 ? `ยังไม่ได้กรอก ${missing} รายการ` : noReason.length > 0 ? `ระบุสาเหตุของผลต่างอีก ${noReason.length} รายการ` : `ผลต่าง ${diffs.length} จาก ${lines.length} รายการ — พร้อมส่ง`}</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" disabled={busy || !dirty} onClick={() => run(() => save(lines), 'บันทึกร่างแล้ว')}>บันทึกร่าง</Button>
                        <Button disabled={busy || !ready} onClick={() => submit(lines)}>ส่งผลตรวจนับ</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        }}
      </Async>
    </>
  )
}
