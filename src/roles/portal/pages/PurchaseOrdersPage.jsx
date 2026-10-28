import { useState } from 'react'
import { Async, Button, Card, Input, PageHeader, baht, thDate, useToast } from '@/shared/ui'
import { portalApi, usePortalApi } from '../api'

const STAGES = ['ได้รับ PO', 'ซัพพลายเออร์ยืนยัน', 'เตรียมสินค้า', 'จัดส่งแล้ว', 'ผู้ซื้อรับของ', 'ชำระเงิน']
const HINT = { 3: 'ผู้ซื้อกำลังรับของเข้าคลัง', 4: 'ผู้ซื้อรับของแล้ว รอวางบิลและชำระเงิน', 5: 'ผู้ซื้อชำระเงินแล้ว' }

export default function PurchaseOrdersPage() {
  const toast = useToast()
  const list = usePortalApi('/purchase-orders')
  const [tk, setTk] = useState({})
  const [busy, setBusy] = useState(false)

  const run = async (fn, ok) => { setBusy(true); try { await fn(); toast(ok); list.reload() } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) } }

  return (
    <>
      <PageHeader title="ใบสั่งซื้อของฉัน" sub="ยืนยัน PO แจ้งการจัดส่ง และติดตามสถานะจนได้รับเงิน" />
      <Async state={list}>
        {(rows) => rows.length === 0 ? <Card className="py-10 text-center text-sm text-slate-500">ยังไม่มีใบสั่งซื้อ</Card> : (
          <div className="grid gap-3">
            {rows.map((p) => (
              <Card key={p.id}>
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <b>{p.doc_no}</b>
                    <div className="text-sm text-slate-600 dark:text-slate-300">{p.lines.slice(0, 3).map((l) => `${l.name} ${l.qty.toLocaleString('th-TH')} ${l.uom}`).join(' · ')}{p.lines.length > 3 ? ` และอีก ${p.lines.length - 3} รายการ` : ''}</div>
                    <div className="text-xs text-slate-500">{p.expected_date ? `กำหนดส่ง ${thDate(p.expected_date)}` : 'ไม่ระบุกำหนดส่ง'}{p.tracking_no ? ` · เลขพัสดุ ${p.tracking_no}` : ''}</div>
                  </div>
                  <b>{baht(p.amount)}</b>
                </div>
                <div className="my-3 flex flex-wrap items-center gap-1.5 text-xs">
                  {STAGES.map((s, k) => (
                    <span key={s} className="flex items-center gap-1.5">
                      <span className={`rounded-full border px-2.5 py-0.5 ${k < p.stage ? 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : k === p.stage ? 'border-transparent bg-amber-100 font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'border-slate-300 text-slate-500 dark:border-slate-600'}`}>{s}</span>
                      {k < STAGES.length - 1 && <span className="text-slate-400">›</span>}
                    </span>
                  ))}
                </div>
                {p.stage === 0 && <Button disabled={busy} onClick={() => run(() => portalApi.post(`/purchase-orders/${p.id}/confirm`), `ยืนยัน ${p.doc_no} แล้ว`)}>ยืนยันรับ PO</Button>}
                {p.stage === 1 && (
                  <div className="flex flex-wrap gap-2">
                    <div className="min-w-52 flex-1"><Input placeholder="เลขพัสดุ / เลขที่ใบส่งของ" aria-label="เลขพัสดุ" maxLength={60} value={tk[p.id] ?? ''} onChange={(e) => setTk({ ...tk, [p.id]: e.target.value })} /></div>
                    <Button disabled={busy || !(tk[p.id] ?? '').trim()} onClick={() => run(() => portalApi.post(`/purchase-orders/${p.id}/ship`, { tracking_no: tk[p.id] }), 'แจ้งจัดส่งแล้ว ผู้ซื้อจะเห็นสถานะในระบบ')}>แจ้งจัดส่งแล้ว</Button>
                  </div>
                )}
                {HINT[p.stage] && <span className="text-xs text-slate-500">{HINT[p.stage]}</span>}
              </Card>
            ))}
          </div>
        )}
      </Async>
    </>
  )
}
