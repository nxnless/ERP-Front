import { useEffect, useRef, useState } from 'react'
import { Button, Card, Notice, PageHeader, Select, Tag, thTime, useToast } from '@/shared/ui'
import { useWarehouseApi, warehouseApi } from '../api'
import Seg from '../components/Seg'
import { qty } from '../constants'

const STATUS = { low: ['ต่ำกว่าจุดสั่งซื้อ', 'bad'], incoming: ['มีของกำลังมา', 'warn'], ok: ['ปกติ', 'ok'] }

export default function ScanPage() {
  const toast = useToast()
  const meta = useWarehouseApi('/meta')
  const [mode, setMode] = useState('lookup')
  const [wh, setWh] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState(null) // ผลสแกนล่าสุด { item, counted_qty }
  const [hist, setHist] = useState([])
  const input = useRef(null)
  const whId = wh || meta.data?.warehouses[0]?.id || ''
  const cur = useWarehouseApi(mode === 'count' && whId ? `/counts/current?warehouse_id=${whId}` : null)
  const openCount = cur.data?.count?.status === 'open' ? cur.data.count : null
  useEffect(() => { input.current?.focus() }, [mode, busy])

  const scan = async (e) => {
    e.preventDefault()
    const barcode = code.trim()
    if (!barcode || busy) return
    setBusy(true)
    try {
      const out = await warehouseApi.post('/scan', { barcode, mode, ...(mode === 'count' && { count_id: openCount.id }) })
      setLast(out); setHist((h) => [{ at: new Date().toISOString(), name: out.item.name, sku: out.item.sku, counted: out.counted_qty }, ...h].slice(0, 8))
      if (mode === 'count') cur.reload()
    } catch (err) { setLast(null); toast(err.message, 'bad') } finally { setCode(''); setBusy(false) }
  }

  const it = last?.item
  return (
    <>
      <PageHeader title="สแกนบาร์โค้ด" sub="ใช้เครื่องสแกนหรือพิมพ์รหัสสินค้า (SKU) แล้วกด Enter — ค้นหาสต็อก หรือสแกนนับในรอบตรวจนับ" />
      <Seg className="mb-3" value={mode} onChange={(m) => { setMode(m); setLast(null) }} options={[['lookup', 'ค้นหาสินค้า'], ['count', 'สแกนนับสต็อก']]} />
      {mode === 'count' && (
        <div className="mb-3 grid gap-2">
          <div className="w-64"><Select aria-label="คลัง" value={whId} onChange={(e) => setWh(e.target.value)}>{(meta.data?.warehouses ?? []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select></div>
          {cur.data && !openCount && <Notice tone="bad">คลังนี้ไม่มีรอบตรวจนับที่กำลังนับอยู่ — เริ่มรอบใหม่ที่หน้า “ตรวจนับสต็อก” ก่อน</Notice>}
          {openCount && <Notice tone="accent">สแกนแต่ละครั้งบวกยอดนับ +1 ในรอบ {openCount.doc_no}</Notice>}
        </div>
      )}
      <form onSubmit={scan} className="mb-4 flex gap-2">
        <input ref={input} aria-label="บาร์โค้ดหรือ SKU" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} placeholder="สแกนหรือพิมพ์บาร์โค้ด / SKU"
          disabled={busy || (mode === 'count' && !openCount)} className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-lg dark:border-slate-600 dark:bg-slate-900" />
        <Button type="submit" disabled={busy || !code.trim() || (mode === 'count' && !openCount)}>ตกลง</Button>
      </form>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {it ? (
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><div className="text-lg font-semibold">{it.name}</div><div className="text-sm text-slate-500">{it.sku}{it.barcode && ` · ${it.barcode}`} · ตำแหน่ง {it.location ?? '—'}</div></div>
              <Tag tone={STATUS[it.status][1]}>{STATUS[it.status][0]}</Tag>
            </div>
            {last.counted_qty != null && <div className="mt-3 rounded-md bg-rose-50 p-3 text-rose-900 dark:bg-rose-950 dark:text-rose-200">นับแล้ว <b className="text-2xl tabular-nums">{qty(last.counted_qty)}</b> {it.uom}</div>}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(meta.data?.warehouses ?? []).map((w) => <div key={w.id} className="flex justify-between rounded-md border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700"><span className="text-slate-500">{w.name}</span><span className="tabular-nums">{qty(it.on_hand[w.id] ?? 0)} {it.uom}</span></div>)}
              <div className="flex justify-between rounded-md border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700"><span className="text-slate-500">จองแล้ว</span><span className="tabular-nums">{qty(it.reserved)}</span></div>
              <div className="flex justify-between rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium dark:border-slate-700"><span className="text-slate-500">พร้อมใช้</span><span className="tabular-nums">{qty(it.available)} {it.uom}</span></div>
            </div>
            <div className="mt-2 text-xs text-slate-500">จุดสั่งซื้อ {qty(it.reorder_point)}{it.incoming > 0 && ` · ค้างรับจากใบสั่งซื้อ ${qty(it.incoming)}`}</div>
          </Card>
        ) : <Card className="py-10 text-center text-sm text-slate-500">ผลการสแกนจะแสดงที่นี่</Card>}
        <Card className="self-start">
          <h2 className="mb-2 font-medium">สแกนล่าสุด</h2>
          {hist.length === 0 && <p className="text-sm text-slate-500">—</p>}
          <ul className="grid gap-1.5 text-sm">
            {hist.map((h, i) => <li key={i} className="flex justify-between gap-2"><span>{h.name} <span className="text-xs text-slate-500">{h.sku}</span></span><span className="whitespace-nowrap text-xs text-slate-500">{h.counted != null && `นับ ${qty(h.counted)} · `}{thTime(h.at)}</span></li>)}
          </ul>
        </Card>
      </div>
    </>
  )
}
