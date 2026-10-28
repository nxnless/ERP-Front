import { useEffect, useState } from 'react'
import { Async, Button, Card, Input, PageHeader, Select, Table, Tag, thDate, useToast } from '@/shared/ui'
import { hrApi, useHrApi } from '../api'
import EmployeeForm from '../components/EmployeeForm'
import Modal from '../components/Modal'
import SalaryBox from '../components/SalaryBox'

const STATUS = { active: ['ปฏิบัติงาน', 'ok'], probation: ['ทดลองงาน', 'warn'], resigned: ['ลาออก', 'bad'] }

export default function EmployeesPage() {
  const toast = useToast()
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('')
  useEffect(() => { const t = setTimeout(() => setQ(qInput.trim()), 300); return () => clearTimeout(t) }, [qInput])
  const qs = new URLSearchParams({ ...(q && { q }), ...(dept && { department: dept }) }).toString()
  const list = useHrApi('/employees' + (qs ? `?${qs}` : ''))
  const meta = useHrApi('/meta')
  const [sel, setSel] = useState(null)
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)

  const create = async (f) => {
    setBusy(true)
    try {
      const r = await hrApi.post('/employees', f)
      toast(`เพิ่มพนักงานแล้ว และส่งคำขอเปิดบัญชี ${r.request_no} ให้ Admin`)
      setAdding(false); setSel(r.id); list.reload()
    } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title="ทะเบียนพนักงาน" sub="ค้นหาและดูข้อมูลพนักงาน · เงินเดือนซ่อนไว้ เปิดดูแล้วมีบันทึกใน Audit Log" />
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="min-w-48 flex-1"><Input placeholder="ค้นหาชื่อ รหัส ตำแหน่ง" aria-label="ค้นหา" value={qInput} onChange={(e) => setQInput(e.target.value)} /></div>
        <div className="w-48"><Select aria-label="แผนก" value={dept} onChange={(e) => setDept(e.target.value)}><option value="">ทุกแผนก</option>{meta.data?.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></div>
        <Button disabled={!meta.data} onClick={() => setAdding(true)}>+ เพิ่มพนักงานใหม่</Button>
      </div>
      <Async state={list}>
        {({ total, rows }) => {
          const e = rows.find((x) => x.id === sel)
          return (
            <>
              <p className="mb-2 text-sm text-slate-500">พนักงานทั้งบริษัท {total.toLocaleString('th-TH')} คน · แสดง {rows.length} รายการ</p>
              <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
                <Table head={['รหัส', 'ชื่อ', 'ตำแหน่ง · แผนก', 'สถานะ']}>
                  {rows.length === 0 && <tr><td colSpan={4} className="px-3 py-8 text-center text-slate-500">ไม่พบพนักงาน</td></tr>}
                  {rows.map((r) => (
                    <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${r.id === sel ? 'bg-rose-50 dark:bg-rose-950' : ''}`}>
                      <td className="px-3 py-2 text-slate-500">{r.employee_no}</td>
                      <td className="px-3 py-2"><button type="button" className="text-left font-medium hover:underline" onClick={() => setSel(r.id)}>{r.full_name}</button></td>
                      <td className="px-3 py-2">{r.position}<div className="text-xs text-slate-500">{r.department}{r.branch_name ? ` · ${r.branch_name}` : ''}</div></td>
                      <td className="px-3 py-2"><Tag tone={STATUS[r.status]?.[1] ?? 'muted'}>{STATUS[r.status]?.[0] ?? r.status}</Tag></td>
                    </tr>
                  ))}
                </Table>
                {e ? (
                  <Card className="self-start">
                    <div className="text-lg font-semibold">{e.full_name}</div>
                    <div className="mb-3 text-sm text-slate-500">{e.employee_no} · {e.position}</div>
                    <dl className="mb-3 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-sm">
                      <dt className="text-slate-500">แผนก</dt><dd>{e.department}</dd>
                      <dt className="text-slate-500">สาขา</dt><dd>{e.branch_name ?? '—'}</dd>
                      <dt className="text-slate-500">เริ่มงาน</dt><dd>{thDate(e.hire_date)}</dd>
                      {e.end_date && <><dt className="text-slate-500">สิ้นสุด</dt><dd>{thDate(e.end_date)}</dd></>}
                      <dt className="text-slate-500">บัญชีผู้ใช้</dt><dd>{e.has_account ? <Tag tone="ok">มีแล้ว</Tag> : <Tag tone="warn">ยังไม่มี</Tag>}</dd>
                    </dl>
                    <SalaryBox employeeId={e.id} />
                  </Card>
                ) : <Card className="self-start py-10 text-center text-sm text-slate-500">เลือกพนักงานเพื่อดูรายละเอียด</Card>}
              </div>
            </>
          )
        }}
      </Async>
      {adding && meta.data && (
        <Modal title="เพิ่มพนักงานใหม่" onClose={() => setAdding(false)}>
          <EmployeeForm meta={meta.data} busy={busy} onSubmit={create} onCancel={() => setAdding(false)} />
        </Modal>
      )}
    </>
  )
}
