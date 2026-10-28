import { useState } from 'react'
import { Async, Button, Card, Field, Input, PageHeader, Select, Table, Tag, thDate, useToast } from '@/shared/ui'
import { accApi, useAccApi } from '../api'
import Tabs from '../components/Tabs'
import { TYPE_TH, fm } from '../format'

export default function JournalPage() {
  const [tab, setTab] = useState('journal')
  const accounts = useAccApi('/accounts')
  return (
    <>
      <PageHeader title="สมุดรายวันและผังบัญชี" sub="บันทึกรายการและดูยอดคงเหลือรายบัญชี · ผลการลงบัญชีไหลไปงบการเงินทันที" />
      <Tabs value={tab} onChange={setTab} options={[['journal', 'สมุดรายวัน'], ['chart', 'ผังบัญชี']]} />
      {tab === 'chart' ? <Chart state={accounts} /> : <Journal accounts={accounts} />}
    </>
  )
}

function Chart({ state }) {
  return (
    <Async state={state}>
      {(rows) => (
        <Table head={['รหัส', 'ชื่อบัญชี', 'หมวด', 'ยอดคงเหลือ (บาท)']}>
          {rows.map((a) => (
            <tr key={a.code}>
              <td className="px-3 py-2">{a.code}</td><td className="px-3 py-2">{a.name}</td>
              <td className="px-3 py-2"><Tag>{TYPE_TH[a.type]}</Tag></td><td className="px-3 py-2 text-right tabular-nums">{fm(a.balance)}</td>
            </tr>
          ))}
        </Table>
      )}
    </Async>
  )
}

function Journal({ accounts }) {
  const toast = useToast()
  const [page, setPage] = useState(0)
  const list = useAccApi(`/journal?limit=20&offset=${page * 20}`)
  const [f, setF] = useState({ description: '', debit_code: '', credit_code: '', amount: '' })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const valid = f.description.trim() && f.debit_code && f.credit_code && f.debit_code !== f.credit_code && Number(f.amount) > 0
  const submit = async () => {
    setBusy(true)
    try {
      const r = await accApi.post('/journal', { description: f.description.trim(), debit_code: f.debit_code, credit_code: f.credit_code, amount: Number(f.amount) })
      toast(`ลงบัญชีแล้ว ${r.entry_no}`); setF({ ...f, description: '', amount: '' }); setPage(0); list.reload(); accounts.reload()
    } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }
  const opts = accounts.data ?? []
  return (
    <>
      <Card className="mb-4">
        <div className="mb-2 font-medium">บันทึกรายการคู่</div>
        <div className="grid gap-2 md:grid-cols-[2fr_2fr_2fr_1fr_auto]">
          <Input aria-label="คำอธิบายรายการ" placeholder="คำอธิบายรายการ" maxLength={200} value={f.description} onChange={set('description')} />
          <Select aria-label="บัญชีเดบิต" value={f.debit_code} onChange={set('debit_code')}><option value="">เดบิต: เลือกบัญชี</option>{opts.map((a) => <option key={a.code} value={a.code}>{a.code} {a.name}</option>)}</Select>
          <Select aria-label="บัญชีเครดิต" value={f.credit_code} onChange={set('credit_code')}><option value="">เครดิต: เลือกบัญชี</option>{opts.map((a) => <option key={a.code} value={a.code}>{a.code} {a.name}</option>)}</Select>
          <Input aria-label="จำนวนเงิน" type="number" min="0.01" step="0.01" placeholder="จำนวนเงิน" value={f.amount} onChange={set('amount')} />
          <Button disabled={!valid || busy} onClick={submit}>ลงบัญชี</Button>
        </div>
        <div className="mt-1 text-xs text-slate-500">เลือกบัญชีเดบิตและเครดิต · รายการจะลงด้วยจำนวนเท่ากันทั้งสองฝั่ง · ลงย้อนหลังในงวดที่ปิดแล้วไม่ได้</div>
      </Card>
      <Async state={list}>
        {({ rows, total }) => (
          <div className="grid gap-3">
            {rows.length === 0 && <Card className="py-8 text-center text-sm text-slate-500">ยังไม่มีรายการ</Card>}
            {rows.map((j) => (
              <Card key={j.id} className="p-0">
                <div className="flex flex-wrap items-center gap-3 px-4 py-2">
                  <b>{j.entry_no}</b><span className="text-xs text-slate-500">{thDate(j.entry_date)}</span><span className="mr-auto">{j.description}</span>
                  {j.status === 'reversed' ? <Tag tone="warn">กลับรายการแล้ว</Tag> : <Tag tone="ok">เดบิต = เครดิต</Tag>}
                </div>
                <table className="w-full text-sm"><thead><tr className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800"><th className="px-4 py-1.5">บัญชี</th><th className="px-4 py-1.5 text-right">เดบิต</th><th className="px-4 py-1.5 text-right">เครดิต</th></tr></thead>
                  <tbody>{j.lines.map((l, i) => (
                    <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                      <td className={`py-1.5 ${l.credit ? 'pl-9' : 'pl-4'}`}>{l.code} {l.name}</td>
                      <td className="px-4 py-1.5 text-right tabular-nums">{l.debit ? fm(l.debit) : ''}</td><td className="px-4 py-1.5 text-right tabular-nums">{l.credit ? fm(l.credit) : ''}</td>
                    </tr>))}</tbody></table>
              </Card>
            ))}
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>ทั้งหมด {total.toLocaleString('th-TH')} รายการ</span>
              <div className="flex gap-2"><Button variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>ก่อนหน้า</Button><Button variant="ghost" disabled={(page + 1) * 20 >= total} onClick={() => setPage(page + 1)}>ถัดไป</Button></div>
            </div>
          </div>
        )}
      </Async>
    </>
  )
}
