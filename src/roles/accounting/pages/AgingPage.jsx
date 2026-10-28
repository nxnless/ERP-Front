import { useState } from 'react'
import { Async, Button, Card, Field, Input, PageHeader, Table, Tag, useToast } from '@/shared/ui'
import { accApi, useAccApi } from '../api'
import Modal from '../components/Modal'
import Tabs from '../components/Tabs'
import { fm } from '../format'

const COLS = [['not_due', 'ยังไม่ครบกำหนด'], ['d1_30', '1–30 วัน'], ['d31_60', '31–60'], ['d61_90', '61–90'], ['d90_plus', 'เกิน 90']]

export default function AgingPage() {
  const toast = useToast()
  const [dir, setDir] = useState('AR')
  const data = useAccApi(`/aging?direction=${dir}`)
  const [busy, setBusy] = useState(false)
  const [propose, setPropose] = useState(null) // { row, amount }
  const ar = dir === 'AR'

  const dun = async (r) => {
    if (!window.confirm(`บันทึกการติดตามทวง ${r.party}?\nระบบจะบันทึกใน Audit Log (ยังไม่ได้ส่งอีเมล/หนังสือ)`)) return
    setBusy(true)
    try { await accApi.post(`/aging/ar/${r.party_id}/dunning`); toast(`บันทึกการติดตามทวง ${r.party} แล้ว`) } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }
  const send = async () => {
    setBusy(true)
    try {
      const r = await accApi.post(`/aging/ap/${propose.row.party_id}/propose-payment`, { amount: Number(propose.amount) })
      toast(`ส่งคำขออนุมัติจ่าย ${propose.row.party} แล้ว (${r.request_no})`); setPropose(null); data.reload()
    } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title="ลูกหนี้ เจ้าหนี้ และ Aging" sub="อายุหนี้นับจากวันครบกำหนดชำระ ณ วันนี้" />
      <Tabs value={dir} onChange={setDir} options={[['AR', 'ลูกหนี้'], ['AP', 'เจ้าหนี้']]} />
      <Async state={data}>
        {(d) => (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Card><div className="text-xs text-slate-500">ยอดรวม{ar ? 'ลูกหนี้' : 'เจ้าหนี้'}</div><div className="text-2xl font-semibold tabular-nums">{fm(d.totals.total)}</div>
                <div className="mt-1">{d.matches_gl ? <Tag tone="ok">ตรงกับบัญชีคุมยอด</Tag> : <Tag tone="bad">ต่างจากบัญชีคุมยอด {fm(d.gl_diff)}</Tag>}</div></Card>
              <Card><div className="text-xs text-slate-500">เกินกำหนดแล้ว</div><div className="text-2xl font-semibold tabular-nums">{fm(d.overdue)}</div>
                <div className="text-xs text-slate-500">{d.totals.total ? Math.round((d.overdue / d.totals.total) * 100) : 0}% ของยอดรวม</div></Card>
              <Card><div className="text-xs text-slate-500">เกิน 60 วัน</div><div className="text-2xl font-semibold tabular-nums text-red-600">{fm(d.over60)}</div>
                <div className="text-xs text-slate-500">พิจารณาตั้งค่าเผื่อหนี้สงสัยจะสูญ</div></Card>
            </div>
            <Table head={[ar ? 'ลูกค้า' : 'ผู้ขาย', ...COLS.map(([, l]) => l), 'รวม', '']}>
              {d.rows.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-500">ไม่มียอดค้าง</td></tr>}
              {d.rows.map((r) => (
                <tr key={r.party_id}>
                  <td className="px-3 py-2">{r.party}</td>
                  {COLS.map(([k], i) => <td key={k} className={`px-3 py-2 text-right tabular-nums ${i >= 3 && r[k] ? 'text-red-600' : ''}`}>{r[k] ? fm(r[k]) : '—'}</td>)}
                  <td className="px-3 py-2 text-right font-medium tabular-nums">{fm(r.total)}</td>
                  <td className="px-3 py-2 text-right">
                    {ar ? <Button variant="ghost" disabled={busy || r.not_due >= r.total} onClick={() => dun(r)}>ติดตามทวง</Button>
                        : <Button variant="ghost" disabled={busy} onClick={() => setPropose({ row: r, amount: String(r.total) })}>เสนอจ่าย</Button>}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-medium dark:bg-slate-800"><td className="px-3 py-2">รวม</td>
                {COLS.map(([k]) => <td key={k} className="px-3 py-2 text-right tabular-nums">{fm(d.totals[k])}</td>)}
                <td className="px-3 py-2 text-right tabular-nums">{fm(d.totals.total)}</td><td /></tr>
            </Table>
          </div>
        )}
      </Async>
      {propose && (
        <Modal title={`เสนอจ่าย ${propose.row.party}`} onClose={() => setPropose(null)}>
          <div className="grid gap-3">
            <p className="text-sm text-slate-500">ยอดค้างทั้งหมด {fm(propose.row.total)} บาท · ระบบตัดจากใบแจ้งหนี้เก่าสุดก่อน และส่งคำขออนุมัติจ่ายตามนโยบาย (เกิน 500,000 ต้องผู้บริหารด้วย)</p>
            <Field label="จำนวนเงินที่เสนอจ่าย (บาท)"><Input type="number" min="0.01" step="0.01" value={propose.amount} onChange={(e) => setPropose({ ...propose, amount: e.target.value })} /></Field>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setPropose(null)}>ยกเลิก</Button><Button disabled={busy || !(Number(propose.amount) > 0)} onClick={send}>ส่งคำขออนุมัติจ่าย</Button></div>
          </div>
        </Modal>
      )}
    </>
  )
}
