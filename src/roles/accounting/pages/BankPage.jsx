import { useEffect, useState } from 'react'
import { Async, Button, Card, Field, Input, Notice, PageHeader, Select, Table, Tag, thDate, useToast } from '@/shared/ui'
import { accApi, useAccApi } from '../api'
import Modal from '../components/Modal'
import { curMonth, fm } from '../format'

const MS = { unmatched: ['ยังไม่จับคู่', 'bad'], matched: ['จับคู่แล้ว', 'ok'], adjusted: ['ลงบัญชีแล้ว', 'ok'] }

export default function BankPage() {
  const toast = useToast()
  const banks = useAccApi('/bank/accounts')
  const [bankId, setBankId] = useState('')
  const [month, setMonth] = useState(curMonth(1))
  const qs = new URLSearchParams({ month, ...(bankId && { bank_account_id: bankId }) }).toString()
  const data = useAccApi(`/bank?${qs}`)
  const [form, setForm] = useState({ statement_balance: '', outstanding_cheques: '', deposits_in_transit: '' })
  const [act, setAct] = useState(null) // { line, kind, party_id, account_code }
  const [parties, setParties] = useState([])
  const [busy, setBusy] = useState(false)
  const d = data.data
  useEffect(() => { if (d) setForm({ statement_balance: String(d.statement_balance), outstanding_cheques: String(d.outstanding_cheques), deposits_in_transit: String(d.deposits_in_transit) }) }, [d?.account.id, d?.month, d?.statement_balance, d?.outstanding_cheques, d?.deposits_in_transit]) // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (fn, ok) => { setBusy(true); try { const r = await fn(); toast(ok); data.reload(); return r } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) } }
  const save = () => run(() => accApi.put('/bank/reconciliation', { bank_account_id: d.account.id, month, statement_balance: Number(form.statement_balance), outstanding_cheques: Number(form.outstanding_cheques) || 0, deposits_in_transit: Number(form.deposits_in_transit) || 0 }), 'บันทึกยอดแล้ว')
  const close = () => run(() => accApi.post('/bank/reconciliation/close', { bank_account_id: d.account.id, month }), 'ปิดรอบกระทบยอดแล้ว')
  const open = async (line) => {
    setAct({ line, kind: line.amount > 0 ? 'receipt' : 'entry', party_id: '', account_code: line.amount < 0 ? '5300' : '' })
    if (line.amount > 0 && parties.length === 0) { try { setParties(await accApi.get('/aging?direction=AR').then((r) => r.rows)) } catch { /* เลือกลูกหนี้ไม่ได้ก็ยังลงเป็นรายการอื่นได้ */ } }
  }
  const post = async () => {
    const body = act.kind === 'receipt' ? { kind: 'receipt', party_id: act.party_id } : { kind: 'entry', account_code: act.account_code }
    const r = await run(() => accApi.post(`/bank/lines/${act.line.id}/post`, body), 'ลงบัญชีและจับคู่แล้ว')
    if (r) setAct(null)
  }
  // ผลต่างสดจากยอดที่กำลังกรอก (เทียบกับยอดตามบัญชีจาก GL)
  const live = d ? Math.round((Number(form.statement_balance) - (Number(form.outstanding_cheques) || 0) + (Number(form.deposits_in_transit) || 0) - d.book_balance) * 100) / 100 : 0
  const closed = d?.status === 'closed'

  return (
    <>
      <PageHeader title="กระทบยอดธนาคาร" sub="เทียบยอดตามสเตทเมนต์กับยอดตามบัญชี (GL) จับคู่รายการ แล้วปิดรอบเมื่อผลต่างเป็น 0" />
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div className="w-64"><Field label="บัญชีธนาคาร"><Select value={bankId} onChange={(e) => setBankId(e.target.value)}>{(banks.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.bank_name} {b.account_no_masked}</option>)}</Select></Field></div>
        <div className="w-44"><Field label="รอบ"><Input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} /></Field></div>
      </div>
      <Async state={data}>
        {(x) => (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card><Field label="ยอดตามสเตทเมนต์"><Input type="number" step="0.01" disabled={closed} value={form.statement_balance} onChange={(e) => setForm({ ...form, statement_balance: e.target.value })} /></Field></Card>
              <Card><Field label="เช็คจ่ายยังไม่ขึ้นเงิน (หัก)"><Input type="number" min="0" step="0.01" disabled={closed} value={form.outstanding_cheques} onChange={(e) => setForm({ ...form, outstanding_cheques: e.target.value })} /></Field></Card>
              <Card><Field label="เงินฝากระหว่างทาง (บวก)"><Input type="number" min="0" step="0.01" disabled={closed} value={form.deposits_in_transit} onChange={(e) => setForm({ ...form, deposits_in_transit: e.target.value })} /></Field></Card>
              <Card><div className="text-xs text-slate-500">ยอดตามบัญชี ({x.account.gl_code})</div><div className="text-2xl font-semibold tabular-nums">{fm(x.book_balance)}</div></Card>
            </div>
            {live === 0 ? <Notice tone="accent">ผลต่าง 0 บาท — กระทบยอดครบ{x.unmatched_count ? ` · แต่ยังมีรายการไม่จับคู่ ${x.unmatched_count} รายการ` : ''}</Notice>
              : <Notice tone="bad">ผลต่างที่ยังหาสาเหตุไม่ได้ {fm(live)} บาท — จัดการรายการที่ยังไม่จับคู่ด้านล่าง หรือแก้ยอดเช็ค/เงินฝากระหว่างทาง</Notice>}
            <Table head={['วันที่', 'รายการในสเตทเมนต์', 'จำนวน', 'สถานะ', '']}>
              {x.lines.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-500">ไม่มีรายการในสเตทเมนต์ของรอบนี้ (นำเข้าสเตทเมนต์ที่ bank_statement_lines)</td></tr>}
              {x.lines.map((l) => (
                <tr key={l.id}>
                  <td className="px-3 py-2">{thDate(l.txn_date)}</td><td className="px-3 py-2">{l.description}</td><td className="px-3 py-2 text-right tabular-nums">{fm(l.amount)}</td>
                  <td className="px-3 py-2"><Tag tone={MS[l.match_status][1]}>{MS[l.match_status][0]}</Tag></td>
                  <td className="px-3 py-2 text-right">{l.match_status === 'unmatched' ? <Button variant="ghost" disabled={busy || closed} onClick={() => open(l)}>{l.amount > 0 ? 'ระบุลูกหนี้ / ลงบัญชี' : 'ลงบัญชี'}</Button> : <span className="text-xs text-slate-500">{l.entry_no}</span>}</td>
                </tr>
              ))}
            </Table>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={busy || closed} onClick={save}>บันทึกยอด</Button>
              <Button disabled={busy || closed || !x.saved || live !== 0 || x.unmatched_count > 0} onClick={close}>{closed ? 'ปิดรอบแล้ว' : 'ปิดรอบกระทบยอด'}</Button>
              {!closed && !x.saved && <span className="self-center text-xs text-slate-500">บันทึกยอดก่อนจึงปิดรอบได้</span>}
            </div>
          </div>
        )}
      </Async>
      {act && (
        <Modal title={`ลงบัญชีรายการ ${fm(act.line.amount)} บาท`} onClose={() => setAct(null)}>
          <div className="grid gap-3">
            <p className="text-sm text-slate-500">{thDate(act.line.txn_date)} · {act.line.description}</p>
            {act.line.amount > 0 && (
              <Field label="ประเภท"><Select value={act.kind} onChange={(e) => setAct({ ...act, kind: e.target.value })}><option value="receipt">รับชำระจากลูกหนี้ (ตัดใบแจ้งหนี้เก่าสุดก่อน)</option><option value="entry">รายการอื่น (ลงเข้าบัญชีที่เลือก)</option></Select></Field>
            )}
            {act.kind === 'receipt'
              ? <Field label="ลูกหนี้"><Select value={act.party_id} onChange={(e) => setAct({ ...act, party_id: e.target.value })}><option value="">— เลือกลูกหนี้ —</option>{parties.map((p) => <option key={p.party_id} value={p.party_id}>{p.party} (ค้าง {fm(p.total)})</option>)}</Select></Field>
              : <Field label="ลงบัญชี" hint="เช่น ค่าธรรมเนียมธนาคาร → 5300"><Input value={act.account_code} placeholder="รหัสบัญชี เช่น 5300" onChange={(e) => setAct({ ...act, account_code: e.target.value.trim() })} /></Field>}
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setAct(null)}>ยกเลิก</Button><Button disabled={busy || (act.kind === 'receipt' ? !act.party_id : !act.account_code)} onClick={post}>ลงบัญชีและจับคู่</Button></div>
          </div>
        </Modal>
      )}
    </>
  )
}
