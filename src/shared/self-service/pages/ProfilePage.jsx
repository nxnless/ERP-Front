import { Fragment, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useSelfService } from '../context'
import { useSelfServiceApi as useApi } from '../hooks'
import { Async, Button, Card, Field, Input, Notice, PageHeader, Select, Tag, Textarea, thDate, useToast } from '@/shared/ui'

const BANKS = ['กสิกรไทย', 'กรุงเทพ', 'ไทยพาณิชย์', 'กรุงไทย', 'กรุงศรีอยุธยา', 'ทหารไทยธนชาต']

export default function ProfilePage() {
  const toast = useToast()
  const { reloadMe, base } = useSelfService()
  const p = useApi('/profile')
  const [f, setF] = useState(null)
  const [bank, setBank] = useState({ bank_name: BANKS[0], account_no: '' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (p.data) setF({
      phone: p.data.phone ?? '', personal_email: p.data.personal_email ?? '', address: p.data.address ?? '',
      emergency_name: p.data.emergency_name ?? '', emergency_relation: p.data.emergency_relation ?? '', emergency_phone: p.data.emergency_phone ?? '',
    })
  }, [p.data])
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  const saveContact = async () => {
    setBusy(true)
    try { await api.put('/profile/contact', f); toast('บันทึกข้อมูลติดต่อแล้ว'); p.reload() }
    catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }
  const changeBank = async () => {
    setBusy(true)
    try {
      const r = await api.post('/profile/bank-change', bank)
      toast(`ส่งคำขอแล้ว · เส้นทาง: ${r.route.join(' › ')}`); setBank({ ...bank, account_no: '' }); p.reload(); reloadMe()
    } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title="ข้อมูลส่วนตัว" sub="แก้ข้อมูลติดต่อได้เอง · ข้อมูลที่ HR ดูแลต้องยื่นคำขอแก้ไข" />
      <Async state={p}>
        {(d) => f && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="self-start">
              <h2 className="mb-3 font-medium">ข้อมูลที่ HR ดูแล</h2>
              <dl className="grid grid-cols-[110px_1fr] gap-y-1.5 text-sm">
                {[['รหัสพนักงาน', d.code], ['ชื่อ-นามสกุล', d.full_name], ['ตำแหน่ง', d.position], ['แผนก', d.department ?? '—'], ['เริ่มงาน', thDate(d.hire_date)], ['ผู้จัดการ', d.manager_name ?? '—']]
                  .map(([k, v]) => (<Fragment key={k}><dt className="text-slate-500">{k}</dt><dd>{v}</dd></Fragment>))}
              </dl>
              <Link to={`${base}/new-request?type=DATA_CHANGE`} className="mt-3 inline-block text-sm text-rose-700 underline dark:text-rose-400">ขอแก้ชื่อ / ตำแหน่ง / ข้อมูลอื่นที่ล็อก</Link>
            </Card>

            <Card>
              <h2 className="mb-3 font-medium">ข้อมูลติดต่อ</h2>
              <div className="grid gap-3">
                <Field label="เบอร์โทรศัพท์"><Input value={f.phone} onChange={set('phone')} inputMode="tel" placeholder="0812345678" /></Field>
                <Field label="อีเมลส่วนตัว"><Input type="email" value={f.personal_email} onChange={set('personal_email')} /></Field>
                <Field label="ที่อยู่ปัจจุบัน"><Textarea value={f.address} onChange={set('address')} maxLength={300} /></Field>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="ผู้ติดต่อฉุกเฉิน" className="col-span-3 sm:col-span-1"><Input value={f.emergency_name} onChange={set('emergency_name')} /></Field>
                  <Field label="ความสัมพันธ์"><Input value={f.emergency_relation} onChange={set('emergency_relation')} /></Field>
                  <Field label="เบอร์โทร"><Input value={f.emergency_phone} onChange={set('emergency_phone')} inputMode="tel" /></Field>
                </div>
                <div className="flex items-center gap-3"><Button disabled={busy} onClick={saveContact}>บันทึกข้อมูลติดต่อ</Button><span className="text-xs text-slate-500">อัปเดตล่าสุด {thDate(d.updated_at)}</span></div>
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <h2 className="mb-1 font-medium">บัญชีรับเงินเดือน</h2>
              <p className="mb-3 text-sm">{d.bank_active ? `${d.bank_active.bank_name} xxx-x-x${d.bank_active.account_last4}` : 'ยังไม่มีบัญชีที่ใช้งาน'}</p>
              {d.bank_pending ? (
                <Notice>คำขอเปลี่ยนเป็น {d.bank_pending.bank_name} xxx-x-x{d.bank_pending.account_last4} <Tag tone="warn">รอ HR ตรวจสอบ</Tag> — เงินเดือนงวดนี้ยังโอนเข้าบัญชีเดิม ยกเลิกคำขอได้ที่หน้า “สถานะคำขอ”</Notice>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <div className="w-44"><Select value={bank.bank_name} onChange={(e) => setBank({ ...bank, bank_name: e.target.value })} aria-label="ธนาคาร">{BANKS.map((b) => <option key={b}>{b}</option>)}</Select></div>
                    <div className="w-56"><Input value={bank.account_no} onChange={(e) => setBank({ ...bank, account_no: e.target.value })} placeholder="เลขบัญชีใหม่ 10–12 หลัก" inputMode="numeric" aria-label="เลขบัญชีใหม่" /></div>
                    <Button variant="ghost" disabled={busy || bank.account_no.replace(/\D/g, '').length < 10} onClick={changeBank}>ส่งคำขอเปลี่ยนบัญชี</Button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">ต้องให้ HR ตรวจสอบก่อนเปลี่ยน เพื่อป้องกันการเปลี่ยนบัญชีโดยผู้อื่น</p>
                </>
              )}
            </Card>
          </div>
        )}
      </Async>
    </>
  )
}
