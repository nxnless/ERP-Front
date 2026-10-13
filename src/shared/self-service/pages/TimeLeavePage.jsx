import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useSelfService } from '../context'
import { useSelfServiceApi as useApi } from '../hooks'
import { Async, Button, Card, Field, Input, Notice, PageHeader, Select, Table, Tag, Textarea, addDays, daysBetween, thDate, thTime, today, useToast } from '@/shared/ui'

export default function TimeLeavePage() {
  const toast = useToast()
  const nav = useNavigate()
  const { reloadMe, base } = useSelfService()
  const balances = useApi('/leave/balances')
  const att = useApi('/attendance')
  const [busy, setBusy] = useState(false)

  const clock = async (kind) => {
    setBusy(true)
    try {
      await api.post(`/attendance/${kind}`)
      toast(kind === 'clock-in' ? 'ลงเวลาเข้างานแล้ว' : 'ลงเวลาออกงานแล้ว')
      att.reload()
    } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }

  // ---------- ฟอร์มยื่นลา / OT ----------
  const [kind, setKind] = useState('vacation') // รหัสประเภทลา หรือ 'ot'
  const [start, setStart] = useState(addDays(today(), 7))
  const [end, setEnd] = useState(addDays(today(), 7))
  const [days, setDays] = useState(null) // null = ใช้ค่าอัตโนมัติจากช่วงวันที่
  const [hours, setHours] = useState(2)
  const [reason, setReason] = useState('')
  const [cert, setCert] = useState(false)

  const lt = balances.data?.find((b) => b.code === kind)
  const autoDays = Math.max(1, daysBetween(start, end) + 1)
  const d = days ?? autoDays
  const available = lt ? lt.balance - lt.pending : 0
  const over = lt && d > available
  const needCert = lt?.cert_from != null && d >= lt.cert_from
  const noticeOk = !lt || lt.notice_days === 0 || daysBetween(today(), start) >= lt.notice_days
  const valid = kind === 'ot' ? hours > 0 && start : end >= start && d > 0 && d <= autoDays && noticeOk

  const submit = async () => {
    setBusy(true)
    try {
      const r = kind === 'ot'
        ? await api.post('/ot-requests', { work_date: start, hours: Number(hours), reason: reason || undefined })
        : await api.post('/leave-requests', { leave_type_code: kind, start_date: start, end_date: end, days: Number(d), reason: reason || undefined, certificate_attached: cert })
      toast(`ส่งคำขอแล้ว · เส้นทาง: ${r.route.join(' › ')}`)
      reloadMe()
      nav(`${base}/requests`)
    } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }

  const todayRow = att.data?.today
  return (
    <>
      <PageHeader title="เวลาทำงานและลา" sub={`วันนี้ ${thDate(today())}`} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="text-xs text-slate-500">ลงเวลาวันนี้</div>
          <div className="my-1 text-lg font-semibold">
            {todayRow?.clock_in ? `${thTime(todayRow.clock_in)}${todayRow.clock_out ? ' – ' + thTime(todayRow.clock_out) : ' เป็นต้นไป'}` : 'ยังไม่ได้ลงเวลา'}
          </div>
          {!todayRow?.clock_in && <Button disabled={busy} onClick={() => clock('clock-in')}>ลงเวลาเข้างาน</Button>}
          {todayRow?.clock_in && !todayRow.clock_out && <Button disabled={busy} onClick={() => clock('clock-out')}>ลงเวลาออกงาน</Button>}
          {todayRow?.clock_out && <Tag tone="ok">ลงเวลาครบแล้ว</Tag>}
        </Card>
        <Async state={balances}>
          {(rows) => rows.map((b) => (
            <Card key={b.code}>
              <div className="text-xs text-slate-500">{b.name}คงเหลือ</div>
              <div className="text-lg font-semibold">{b.balance} <span className="text-sm font-normal text-slate-500">จาก {b.annual_days} วัน</span></div>
              {b.pending > 0 && <div className="text-xs text-amber-700">มีใบลารออนุมัติ {b.pending} วัน</div>}
            </Card>
          ))}
        </Async>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[3fr_2fr]">
        <section>
          <h2 className="mb-2 font-medium">ประวัติเดือนนี้</h2>
          <Async state={att}>
            {({ rows }) => (
              <Table head={['วันที่', 'เข้า', 'ออก', { label: 'ชั่วโมง', right: true }]}>
                {rows.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-500">ยังไม่มีข้อมูลเดือนนี้</td></tr>}
                {rows.map((r) => (
                  <tr key={r.work_date}>
                    <td className="px-3 py-2">{thDate(r.work_date)}</td><td className="px-3 py-2">{thTime(r.clock_in)}</td>
                    <td className="px-3 py-2">{thTime(r.clock_out)}</td><td className="px-3 py-2 text-right">{r.worked_hours ?? '—'}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Async>
        </section>

        <Card className="self-start">
          <h2 className="mb-3 font-medium">ยื่นคำขอลา / OT</h2>
          <div className="grid gap-3">
            <Field label="ประเภท">
              <Select value={kind} onChange={(e) => { setKind(e.target.value); setDays(null); setCert(false) }}>
                {balances.data?.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
                <option value="ot">ขอทำ OT</option>
              </Select>
            </Field>
            {kind === 'ot' ? (
              <>
                <Field label="วันที่ทำ OT"><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
                <Field label="จำนวนชั่วโมง"><Input type="number" min="0.5" max="12" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} /></Field>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="วันที่เริ่ม" hint={lt?.notice_days ? `ต้องแจ้งล่วงหน้า ${lt.notice_days} วัน` : undefined}>
                    <Input type="date" value={start} onChange={(e) => { setStart(e.target.value); if (e.target.value > end) setEnd(e.target.value); setDays(null) }} />
                  </Field>
                  <Field label="วันที่สิ้นสุด"><Input type="date" min={start} value={end} onChange={(e) => { setEnd(e.target.value); setDays(null) }} /></Field>
                </div>
                <Field label="จำนวนวัน" hint="ลาครึ่งวันให้ใส่ 0.5">
                  <Input type="number" min="0.5" step="0.5" max={autoDays} value={d} onChange={(e) => setDays(e.target.value === '' ? null : Number(e.target.value))} />
                </Field>
                {lt?.code === 'sick' && (
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cert} onChange={(e) => setCert(e.target.checked)} /> แนบใบรับรองแพทย์แล้ว</label>
                )}
                {!noticeOk && <Notice tone="bad">{lt.name}ต้องแจ้งล่วงหน้าอย่างน้อย {lt.notice_days} วัน</Notice>}
                {noticeOk && over && <Notice>เกินสิทธิ์คงเหลือ ({available} วัน) — คำขอจะส่งให้ผู้จัดการ แล้วต่อให้ HR พิจารณาเพิ่ม</Notice>}
                {needCert && !cert && <Notice>ลาตั้งแต่ {lt.cert_from} วันขึ้นไปต้องแนบใบรับรองแพทย์ HR จะติดตามเอกสาร</Notice>}
              </>
            )}
            <Field label="เหตุผล"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} /></Field>
            <Button disabled={busy || !valid} onClick={submit}>ส่งคำขอ</Button>
          </div>
        </Card>
      </div>
    </>
  )
}
