import { useState } from 'react'
import { Async, Button, Input, PageHeader, Select, Table, Tag, useToast } from '@/shared/ui'
import { purchasingApi, usePurchasingApi } from '../api'

const STATUS = { approved: ['อนุมัติ', 'ok'], trial: ['ทดลอง (ยังไม่มีประวัติ)', 'warn'], pending: ['รออนุมัติ', 'warn'], suspended: ['ระงับ', 'bad'] }
const num = (n) => Math.round(n).toLocaleString('th-TH')
const early = (s) => (s.early_discount_pct > 0 ? `${s.early_discount_pct}/${s.early_discount_days} n/${s.credit_days}` : '—')

export default function SuppliersPage() {
  const toast = useToast()
  const list = usePurchasingApi('/suppliers')
  const meta = usePurchasingApi('/meta')
  const [f, setF] = useState({ name: '', category: '', payment_terms_id: '' })
  const [busy, setBusy] = useState(false)

  const run = async (fn, ok) => { setBusy(true); try { const r = await fn(); toast(typeof ok === 'function' ? ok(r) : ok); list.reload(); return r } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) } }
  const termsId = f.payment_terms_id || meta.data?.terms[0]?.id || ''
  const add = async () => {
    if (!f.name.trim()) return toast('ใส่ชื่อซัพพลายเออร์ก่อน', 'bad')
    const r = await run(() => purchasingApi.post('/suppliers', { name: f.name, category: f.category || undefined, payment_terms_id: termsId }), (r) => `เพิ่มซัพพลายเออร์แล้ว · ส่งคำขออนุมัติ: ${r.route.join(' › ')}`)
    if (r) setF({ name: '', category: '', payment_terms_id: '' })
  }
  const setTerms = (s, id) => run(() => purchasingApi.put(`/suppliers/${s.id}/terms`, { payment_terms_id: id }), `บันทึกเงื่อนไข ${s.name} แล้ว`)

  return (
    <>
      <PageHeader title="ซัพพลายเออร์และเงื่อนไขชำระเงิน" sub="เปลี่ยนเงื่อนไขชำระได้จากรายการเลือกในแถว · ผู้ขายที่ยังไม่มีประวัติให้ซื้อได้ภายในวงเงินทดลอง และต้องผ่านการอนุมัติ" />
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="min-w-48 flex-[2]"><Input placeholder="ชื่อซัพพลายเออร์ใหม่" aria-label="ชื่อซัพพลายเออร์ใหม่" maxLength={150} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="min-w-32 flex-1"><Input placeholder="หมวดสินค้า" aria-label="หมวดสินค้า" maxLength={80} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></div>
        <div className="min-w-40 flex-1"><Select aria-label="เงื่อนไขชำระ" value={termsId} onChange={(e) => setF({ ...f, payment_terms_id: e.target.value })}>{(meta.data?.terms ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></div>
        <Button disabled={busy || !meta.data} onClick={add}>เพิ่มซัพพลายเออร์</Button>
      </div>
      <Async state={list}>
        {(rows) => (
          <Table head={['ซัพพลายเออร์', 'หมวด', 'เงื่อนไขชำระเงิน', 'ส่วนลดชำระเร็ว', 'Lead time', 'ส่งตรงเวลา', 'ค้างจ่าย', 'สถานะ']}>
            {rows.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-500">ยังไม่มีซัพพลายเออร์</td></tr>}
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="px-3 py-2"><div className="font-medium">{s.name}</div><div className="text-xs text-slate-500">{s.code}</div></td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{s.category ?? '—'}</td>
                <td className="px-3 py-2">
                  <div className="w-44"><Select aria-label={`เงื่อนไขชำระ ${s.name}`} value={s.payment_terms_id ?? ''} disabled={busy || !meta.data} onChange={(e) => setTerms(s, e.target.value)}>
                    {!s.payment_terms_id && <option value="">— ไม่ระบุ —</option>}
                    {(meta.data?.terms ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select></div>
                </td>
                <td className="px-3 py-2">{early(s)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{s.lead_time_days} วัน</td>
                <td className="px-3 py-2 text-right tabular-nums">{s.on_time_rate ? `${s.on_time_rate}%` : '—'}</td>
                <td className="px-3 py-2 text-right tabular-nums">{s.payable ? num(s.payable) : '—'}</td>
                <td className="px-3 py-2"><Tag tone={STATUS[s.status]?.[1]}>{STATUS[s.status]?.[0] ?? s.status}</Tag></td>
              </tr>
            ))}
          </Table>
        )}
      </Async>
    </>
  )
}
