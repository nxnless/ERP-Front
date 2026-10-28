import { useState } from 'react'
import { Async, Button, Card, PageHeader, Table, Tag, useToast } from '@/shared/ui'
import { purchasingApi, usePurchasingApi } from '../api'

const num = (n) => Math.round(n).toLocaleString('th-TH')
const STATUS = { low: ['ต่ำกว่าจุดสั่งซื้อ', 'bad'], incoming: ['มี PO ระหว่างทาง', 'warn'], ok: ['ปกติ', 'ok'] }

export default function ReorderPage() {
  const toast = useToast()
  const data = usePurchasingApi('/reorder')
  const [busy, setBusy] = useState(false)

  const mkPr = async (r) => {
    setBusy(true)
    try {
      const x = await purchasingApi.post(`/reorder/${r.id}/pr`, { qty: r.suggest })
      toast(`สร้าง ${x.doc_no} แล้ว · รออนุมัติ: ${x.route.join(' › ')}`); data.reload()
    } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title="แจ้งเตือนจุดสั่งซื้อซ้ำ" sub="เทียบสต็อกพร้อมใช้ (หักของที่จองแล้ว) กับจุดสั่งซื้อ · รวม PO ที่อนุมัติแล้วและกำลังมา" />
      <Async state={data}>
        {(rows) => (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card><div className="text-xs text-slate-500">ต้องสั่งซื้อ</div><div className="text-2xl font-semibold text-red-600">{rows.filter((r) => r.status === 'low').length} รายการ</div></Card>
              <Card><div className="text-xs text-slate-500">มี PO ระหว่างทางแล้ว</div><div className="text-2xl font-semibold">{rows.filter((r) => r.status === 'incoming').length} รายการ</div></Card>
            </div>
            <Table head={['สินค้า', 'พร้อมใช้', 'จุดสั่งซื้อ', 'ใช้/วัน', 'พอใช้อีก', 'กำลังมา', 'สถานะ', 'แนะนำสั่ง', '']}>
              {rows.length === 0 && <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-500">ยังไม่มีสินค้าที่กำหนดจุดสั่งซื้อ</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2"><div className="font-medium">{r.name}</div><div className="text-xs text-slate-500">{r.sku}{r.supplier_name ? ` · ผู้ขายประจำ ${r.supplier_name}` : ''}</div></td>
                  <td className="px-3 py-2 text-right tabular-nums">{num(r.available)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{num(r.reorder_point)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.avg_daily_use ?? '—'}</td>
                  <td className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${r.urgent ? 'font-semibold text-red-600' : ''}`}>{r.days != null ? `${r.days} วัน` : '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.incoming ? num(r.incoming) : '—'}</td>
                  <td className="px-3 py-2"><Tag tone={STATUS[r.status][1]}>{STATUS[r.status][0]}</Tag></td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{r.status === 'low' ? `${num(r.suggest)} ${r.uom}` : '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    {r.status === 'low' && (r.open_pr > 0 ? <Tag tone="accent">มี PR รอดำเนินการ</Tag> : <Button variant="ghost" disabled={busy} onClick={() => mkPr(r)}>สร้าง PR</Button>)}
                  </td>
                </tr>
              ))}
            </Table>
            <p className="mt-2 text-xs text-slate-500">ตัวเลขแดงในช่อง “พอใช้อีก” คือสต็อกจะหมดก่อนสินค้าใหม่จะมาถึง (ตาม lead time ของผู้ขายประจำ) · PO ที่ยังรออนุมัติไม่นับเป็น “กำลังมา”</p>
          </>
        )}
      </Async>
    </>
  )
}
