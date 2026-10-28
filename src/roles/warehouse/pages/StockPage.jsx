import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Async, Button, Card, Notice, PageHeader, Table, Tag, thDate, thTime } from '@/shared/ui'
import { useWarehouseApi } from '../api'
import Seg from '../components/Seg'
import { MOVE_TYPES, NEW_REQUEST_PATH, qty, signed } from '../constants'

const STATUS = { low: ['ต่ำกว่าจุดสั่งซื้อ', 'bad'], incoming: ['มีของกำลังมา', 'warn'], ok: ['ปกติ', 'ok'] }
const BAR = { low: 'bg-red-600', incoming: 'bg-amber-500', ok: 'bg-emerald-600' }
const PAGE = 50

export default function StockPage() {
  const [tab, setTab] = useState('levels')
  return (
    <>
      <PageHeader title="ระดับสต็อก" sub="จำนวนคงเหลือรายคลัง ยอดที่ถูกจอง และสินค้าที่ต้องสั่งซื้อ — ไม่แสดงราคาและต้นทุน" />
      <Seg className="mb-4" value={tab} onChange={setTab} options={[['levels', 'ระดับสต็อก'], ['moves', 'ประวัติการเคลื่อนไหว']]} />
      {tab === 'levels' ? <Levels /> : <Movements />}
    </>
  )
}

function Levels() {
  const nav = useNavigate()
  const data = useWarehouseApi('/stock')
  return (
    <Async state={data}>
      {({ warehouses, items, low_count, pending_pos }) => (
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card><div className="text-xs text-slate-500">ต้องสั่งซื้อ</div><div className={`text-2xl font-semibold ${low_count ? 'text-red-600' : ''}`}>{low_count}</div><div className="text-xs text-slate-500">รายการที่ต่ำกว่าจุดสั่งซื้อและของที่กำลังมายังไม่พอ</div></Card>
            <Card><div className="text-xs text-slate-500">ใบสั่งซื้อรอรับของ</div><div className="text-2xl font-semibold">{pending_pos}</div><div className="text-xs text-slate-500">รับได้ที่ รับ · เบิก · โอนย้าย</div></Card>
            <Card><div className="text-xs text-slate-500">สินค้าทั้งหมด</div><div className="text-2xl font-semibold">{items.length}</div><div className="text-xs text-slate-500">ใน {warehouses.length} คลัง</div></Card>
          </div>
          {low_count > 0 && <Notice tone="bad">มีสินค้า {low_count} รายการต่ำกว่าจุดสั่งซื้อ — กด “แจ้งจัดซื้อ” เพื่อยื่นใบขอซื้อ (ใบขอซื้อต้องผ่านการอนุมัติตามนโยบาย)</Notice>}
          <Table head={['สินค้า', 'ตำแหน่ง', ...warehouses.map((w) => w.name), 'จองแล้ว', 'พร้อมใช้', 'เทียบจุดสั่งซื้อ', 'สถานะ', '']}>
            {items.length === 0 && <tr><td colSpan={warehouses.length + 7} className="px-3 py-8 text-center text-slate-500">ยังไม่มีสินค้า</td></tr>}
            {items.map((r) => {
              const pct = r.reorder_point > 0 ? Math.min(100, Math.round((r.available / (r.reorder_point * 2)) * 100)) : 100
              return (
                <tr key={r.id}>
                  <td className="px-3 py-2"><div className="font-medium">{r.name}</div><div className="text-xs text-slate-500">{r.sku} · {r.uom}</div></td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{r.location ?? '—'}</td>
                  {warehouses.map((w) => <td key={w.id} className="px-3 py-2 text-right tabular-nums">{qty(r.on_hand[w.id] ?? 0)}</td>)}
                  <td className="px-3 py-2 text-right tabular-nums text-slate-500">{qty(r.reserved)}</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">{qty(r.available)}</td>
                  <td className="px-3 py-2">
                    <div className="h-1.5 w-28 overflow-hidden rounded bg-slate-200 dark:bg-slate-700"><div className={`h-full ${BAR[r.status]}`} style={{ width: `${pct}%` }} /></div>
                    <div className="mt-1 text-xs text-slate-500">จุดสั่งซื้อ {qty(r.reorder_point)}{r.incoming > 0 && ` · กำลังมา ${qty(r.incoming)}`}</div>
                  </td>
                  <td className="px-3 py-2"><Tag tone={STATUS[r.status][1]}>{STATUS[r.status][0]}</Tag></td>
                  <td className="px-3 py-2 text-right">
                    {r.status === 'low' && <Button variant="ghost" onClick={() => nav(NEW_REQUEST_PATH, { state: { type: 'PR', sku: r.sku, name: r.name } })}>แจ้งจัดซื้อ</Button>}
                  </td>
                </tr>
              )
            })}
          </Table>
        </div>
      )}
    </Async>
  )
}

function Movements() {
  const [offset, setOffset] = useState(0)
  const data = useWarehouseApi(`/movements?limit=${PAGE}&offset=${offset}`)
  return (
    <Async state={data}>
      {({ rows, has_more }) => (
        <>
          <Table head={['เวลา', 'ประเภท', 'สินค้า', 'คลัง', 'จำนวน', 'เอกสาร', 'ผู้ทำ']}>
            {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">ยังไม่มีการเคลื่อนไหว</td></tr>}
            {rows.map((m) => {
              const [label, tone] = MOVE_TYPES[m.movement_type] ?? [m.movement_type, 'muted']
              return (
                <tr key={m.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">{thDate(m.created_at)} {thTime(m.created_at)}</td>
                  <td className="px-3 py-2"><Tag tone={tone}>{label}</Tag></td>
                  <td className="px-3 py-2"><div>{m.item_name}</div><div className="text-xs text-slate-500">{m.sku}</div></td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{m.warehouse_name}</td>
                  <td className={`px-3 py-2 text-right font-medium tabular-nums ${m.qty < 0 ? 'text-red-600' : 'text-emerald-700 dark:text-emerald-400'}`}>{signed(m.qty)} <span className="text-xs font-normal text-slate-500">{m.uom}</span></td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{m.doc_no ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{m.actor_name ?? '—'}</td>
                </tr>
              )
            })}
          </Table>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>ก่อนหน้า</Button>
            <Button variant="ghost" disabled={!has_more} onClick={() => setOffset(offset + PAGE)}>ถัดไป</Button>
          </div>
        </>
      )}
    </Async>
  )
}
