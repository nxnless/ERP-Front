import { useState } from 'react'
import { Async, Button, Field, Input, Notice, PageHeader, Select, Table, Tag, Textarea, baht, thDate, useToast } from '@/shared/ui'
import { salesApi, useSalesApi } from '../api'
import Modal from '../components/Modal'
import Seg from '../components/Seg'

const WHY = [['overdue', 'ค้างชำระเกินกำหนด'], ['limit', 'วงเงินเครดิตเต็ม']]

export default function CustomersPage() {
  const toast = useToast()
  const [tab, setTab] = useState('customers')
  const meta = useSalesApi('/meta')
  const list = useSalesApi('/customers')
  const pl = useSalesApi(tab === 'price' ? '/price-list' : null)
  const [add, setAdd] = useState(null)
  const [exc, setExc] = useState(null)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async (fn, ok) => { setBusy(true); try { await fn(); toast(ok); list.reload(); return true } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) } }
  const create = async () => { if (await run(() => salesApi.post('/customers', { name: add.name, tax_id: add.tax_id || undefined, price_list_id: add.price_list_id }), 'เพิ่มลูกค้าแล้ว')) setAdd(null) }
  const request = async () => { if (await run(() => salesApi.post(`/customers/${exc.c.id}/credit-exception`, { why: exc.why, reason: exc.reason }), 'ส่งคำขอยกเว้นแล้ว รอผู้อนุมัติ')) setExc(null) }
  const startAdd = () => setAdd({ name: '', tax_id: '', price_list_id: meta.data.price_lists.find((l) => l.is_default)?.id ?? meta.data.price_lists[0]?.id ?? '' })

  const status = (c) => c.hold ? ['ระงับสั่งขายใหม่', 'bad'] : c.pct >= 100 ? ['เครดิตเต็ม', 'bad'] : c.near_limit ? ['เครดิตใกล้เต็ม', 'warn'] : ['ปกติ', 'ok']

  return (
    <>
      <PageHeader title="ลูกค้าและ Price List" sub="ลูกค้าของฉันและทีม · ราคาแสดงเป็นราคาขายเท่านั้น ไม่แสดงต้นทุนหรือกำไรขั้นต้น" />
      <Seg value={tab} onChange={setTab} options={[['customers', 'ลูกค้า'], ['price', 'Price List']]} />
      {tab === 'customers' ? (
        <>
          <div className="mb-3"><Button disabled={!meta.data || !meta.data.price_lists.length} onClick={startAdd}>+ เพิ่มลูกค้า</Button></div>
          <Async state={list}>
            {(rows) => (
              <Table head={['ลูกค้า', 'กลุ่มราคา', 'เครดิต', 'วงเงินที่ใช้', 'สั่งล่าสุด', 'สถานะ']}>
                {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">ยังไม่มีลูกค้า</td></tr>}
                {rows.map((c) => {
                  const [label, tone] = status(c)
                  return (
                    <tr key={c.id}>
                      <td className="px-3 py-2"><div className="font-medium">{c.name}</div><div className="text-xs text-slate-500">{c.code}{!c.own && c.owner_name ? ` · ดูแลโดย ${c.owner_name}` : ''}</div></td>
                      <td className="px-3 py-2"><Tag>{c.price_list_name ?? '—'}</Tag></td>
                      <td className="px-3 py-2">{c.credit_days} วัน</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded bg-slate-200 dark:bg-slate-700"><div className={`h-full ${c.pct >= 90 ? 'bg-red-600' : 'bg-green-700'}`} style={{ width: `${Math.min(c.pct, 100)}%` }} /></div>
                          <span className="whitespace-nowrap text-xs">{c.pct}% · เหลือ {baht(Math.max(c.credit_limit - c.used, 0))}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">{c.last_order ? thDate(c.last_order) : '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <Tag tone={tone}>{label}</Tag>
                        {c.exception_active && <> <Tag tone="ok">ได้รับยกเว้น</Tag></>}
                        {c.exception_pending && <> <Tag tone="warn">รออนุมัติยกเว้น</Tag></>}
                        {c.blocked && !c.exception_active && !c.exception_pending && <Button variant="ghost" className="ml-1" onClick={() => setExc({ c, why: c.hold ? 'overdue' : 'limit', reason: '' })}>ขอยกเว้น</Button>}
                      </td>
                    </tr>
                  )
                })}
              </Table>
            )}
          </Async>
        </>
      ) : (
        <>
          <div className="mb-3 max-w-xs"><Input placeholder="ค้นหาสินค้า" aria-label="ค้นหาสินค้า" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Async state={pl}>
            {({ lists, items }) => (
              <>
                <Table head={['รหัส', 'สินค้า', 'หน่วย', ...lists.map((l) => l.name)]}>
                  {items.filter((i) => `${i.sku} ${i.name}`.toLowerCase().includes(q.trim().toLowerCase())).map((i) => (
                    <tr key={i.id}>
                      <td className="px-3 py-2 text-slate-500">{i.sku}</td><td className="px-3 py-2">{i.name}</td><td className="px-3 py-2">{i.uom}</td>
                      {lists.map((l) => <td key={l.id} className="px-3 py-2 text-right tabular-nums">{i.prices[l.id] != null ? baht(i.prices[l.id]) : '—'}</td>)}
                    </tr>
                  ))}
                </Table>
                {meta.data && <p className="mt-2 text-xs text-slate-500">ส่วนลดเกิน {meta.data.rules.discount_free_pct}% ต้องให้ผู้จัดการอนุมัติ · ราคาไม่รวม VAT {Math.round(meta.data.rules.vat_rate * 100)}%</p>}
              </>
            )}
          </Async>
        </>
      )}

      {add && meta.data && (
        <Modal title="เพิ่มลูกค้า" onClose={() => setAdd(null)}>
          <div className="grid gap-3">
            <Field label="ชื่อลูกค้า"><Input value={add.name} maxLength={150} onChange={(e) => setAdd({ ...add, name: e.target.value })} /></Field>
            <Field label="เลขประจำตัวผู้เสียภาษี (ถ้ามี)"><Input value={add.tax_id} maxLength={20} onChange={(e) => setAdd({ ...add, tax_id: e.target.value })} /></Field>
            <Field label="กลุ่มราคา"><Select value={add.price_list_id} onChange={(e) => setAdd({ ...add, price_list_id: e.target.value })}>{meta.data.price_lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
            <p className="text-xs text-slate-500">ลูกค้าใหม่เริ่มที่เครดิต 30 วัน วงเงิน {baht(meta.data.rules.new_customer_credit)}</p>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setAdd(null)}>ยกเลิก</Button><Button disabled={!add.name.trim() || !add.price_list_id || busy} onClick={create}>เพิ่มลูกค้า</Button></div>
          </div>
        </Modal>
      )}
      {exc && (
        <Modal title={`ขอยกเว้นการบล็อก · ${exc.c.name}`} onClose={() => setExc(null)}>
          <div className="grid gap-3">
            <Notice>คำขอจะเข้าสายอนุมัติตามที่ Admin ตั้งไว้ · เมื่ออนุมัติแล้วใช้สร้างใบสั่งขายของลูกค้ารายนี้ได้ภายในเวลาที่กำหนด</Notice>
            <Field label="เหตุที่ถูกบล็อก"><Select value={exc.why} onChange={(e) => setExc({ ...exc, why: e.target.value })}>{WHY.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
            <Field label="เหตุผลที่ขอยกเว้น"><Textarea value={exc.reason} maxLength={300} onChange={(e) => setExc({ ...exc, reason: e.target.value })} /></Field>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setExc(null)}>ยกเลิก</Button><Button disabled={!exc.reason.trim() || busy} onClick={request}>ส่งคำขอ</Button></div>
          </div>
        </Modal>
      )}
    </>
  )
}
