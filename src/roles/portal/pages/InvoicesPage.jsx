import { useState } from 'react'
import { Async, Button, Card, Notice, PageHeader, Table, Tag, baht, thDate, useToast } from '@/shared/ui'
import { portalApi, usePortalApi } from '../api'

const METHOD = { promptpay: 'PromptPay QR', card: 'บัตรเครดิต', transfer: 'โอนผ่านธนาคาร' }

export default function InvoicesPage() {
  const toast = useToast()
  const data = usePortalApi('/invoices')
  const [sel, setSel] = useState(new Set())
  const [step, setStep] = useState('list') // list | pay | done
  const [method, setMethod] = useState('transfer')
  const [done, setDone] = useState(null)
  const [busy, setBusy] = useState(false)

  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const submit = async () => {
    setBusy(true)
    try { const r = await portalApi.post('/payments', { invoice_ids: [...sel], method }); setDone(r); setSel(new Set()); setStep('done'); data.reload() }
    catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }
  const back = () => { setStep('list'); setDone(null) }

  return (
    <>
      <PageHeader title="ใบแจ้งหนี้และการชำระเงิน" sub="เลือกใบแจ้งหนี้ที่ต้องการชำระ แล้วเลือกช่องทางชำระเงิน" />
      <Async state={data}>
        {({ summary, invoices, history, methods }) => {
          const chosen = invoices.filter((i) => sel.has(i.id))
          const amount = chosen.reduce((s, i) => s + i.balance, 0)
          const fee = method === 'card' ? Math.round(amount * methods.card_fee_pct) / 100 : 0
          const available = [['transfer', true], ['promptpay', methods.promptpay], ['card', methods.card]].filter(([, on]) => on).map(([k]) => k)
          return (
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Card><div className="text-xs text-slate-500">ยอดค้างชำระ</div><div className="text-2xl font-semibold">{baht(summary.outstanding)}</div><div className="text-xs text-slate-500">{summary.open_count} ใบ{summary.next_due ? ` · ใบถัดไปครบกำหนด ${thDate(summary.next_due)}` : ''}</div></Card>
                <Card><div className="text-xs text-slate-500">วงเงินเครดิต</div><div className="text-2xl font-semibold">{baht(summary.credit_limit)}</div><div className="text-xs text-slate-500">ใช้ไป {summary.used_pct}% · เครดิต {summary.credit_days} วัน</div></Card>
              </div>

              {step === 'done' && done && (
                <Card>
                  <h2 className="mb-2 font-medium">บันทึกรายการชำระเงินแล้ว</h2>
                  <p className="text-sm">ใบแจ้งหนี้ {done.invoices.join(', ')} · ยอด {baht(done.total)} ({METHOD[done.method]})</p>
                  <Notice>สถานะ “รอยืนยัน” — ใบแจ้งหนี้จะเปลี่ยนเป็นชำระแล้วและออกใบเสร็จเมื่อฝ่ายบัญชีตรวจสอบยอดเงินเข้าเรียบร้อย</Notice>
                  <div className="mt-3"><Button onClick={back}>กลับไปรายการ</Button></div>
                </Card>
              )}

              {step === 'pay' && (
                <Card>
                  <div className="font-medium">ชำระเงิน {chosen.length} ใบ</div>
                  <div className="mb-3 text-xs text-slate-500">{chosen.map((i) => i.doc_no).join(', ')}</div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {available.map((k) => <button key={k} type="button" aria-pressed={method === k} onClick={() => setMethod(k)} className={`rounded-md border px-3 py-1.5 text-sm ${method === k ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 dark:border-slate-600'}`}>{METHOD[k]}</button>)}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="text-sm">
                      {method === 'transfer' && (methods.transfer
                        ? <>โอนเข้าบัญชี<br /><b>{methods.transfer.bank_name} {methods.transfer.account_no_masked}</b><div className="mt-1 text-xs text-slate-500">ใส่เลขที่ใบแจ้งหนี้ในหมายเหตุการโอน · ฝ่ายบัญชีจะตรวจสอบยอดเงินเข้า</div></>
                        : <>ยังไม่มีข้อมูลบัญชีรับโอน — ติดต่อฝ่ายการเงินของ Acme</>)}
                      {method !== 'transfer' && <>ระบบจะพาไปชำระกับผู้ให้บริการเมื่อกดดำเนินการ</>}
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">ยอดชำระ</div><div className="text-2xl font-semibold">{baht(amount)}</div>
                      {fee > 0 && <div className="text-xs text-slate-500">ค่าธรรมเนียมบัตร {methods.card_fee_pct}% {baht(fee)} · <b>รวม {baht(amount + fee)}</b></div>}
                      <div className="mt-3 flex gap-2"><Button disabled={busy || (method === 'transfer' && !methods.transfer)} onClick={submit}>{method === 'transfer' ? 'แจ้งว่าโอนแล้ว' : 'ดำเนินการชำระเงิน'}</Button><Button variant="ghost" onClick={back}>ย้อนกลับ</Button></div>
                    </div>
                  </div>
                </Card>
              )}

              {step === 'list' && (
                <>
                  <Table head={['', 'ใบแจ้งหนี้', 'ออกเมื่อ', 'ครบกำหนด', 'ยอด (รวม VAT)', 'สถานะ']}>
                    {invoices.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">ไม่มีใบแจ้งหนี้</td></tr>}
                    {invoices.map((i) => {
                      const paid = !(i.balance > 0)
                      return (
                        <tr key={i.id}>
                          <td className="px-3 py-2">{!paid && !i.payment_pending && <input type="checkbox" checked={sel.has(i.id)} onChange={() => toggle(i.id)} aria-label={`เลือก ${i.doc_no}`} />}</td>
                          <td className="px-3 py-2">{i.doc_no}</td><td className="px-3 py-2 text-slate-500">{thDate(i.issue_date)}</td><td className="px-3 py-2">{thDate(i.due_date)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{baht(i.total)}{!paid && i.balance < i.total && <div className="text-xs text-slate-500">คงเหลือ {baht(i.balance)}</div>}</td>
                          <td className="px-3 py-2">{paid ? <><Tag tone="ok">ชำระแล้ว</Tag>{i.receipt_no && <div className="text-xs text-slate-500">{i.receipt_no}</div>}</> : i.payment_pending ? <Tag tone="warn">รอยืนยันการชำระ</Tag> : <Tag tone="warn">รอชำระ</Tag>}</td>
                        </tr>
                      )
                    })}
                  </Table>
                  <div className="flex items-center gap-3"><b>ยอดที่เลือก {baht(amount)}</b><Button disabled={!sel.size} onClick={() => { setMethod('transfer'); setStep('pay') }}>ชำระเงิน</Button></div>
                  {history.length > 0 && (
                    <section>
                      <h3 className="mb-2 font-medium">ประวัติการชำระเงิน</h3>
                      <Table head={['ใบเสร็จ', 'วันที่', 'ช่องทาง', 'จำนวน']}>
                        {history.map((h) => <tr key={h.doc_no}><td className="px-3 py-2">{h.doc_no}</td><td className="px-3 py-2">{thDate(h.paid_at)}</td><td className="px-3 py-2">{METHOD[h.method] ?? h.method}</td><td className="px-3 py-2 text-right tabular-nums">{baht(h.amount)}</td></tr>)}
                      </Table>
                    </section>
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
