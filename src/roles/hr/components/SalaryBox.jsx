import { useEffect, useState } from 'react'
import { Button, useToast } from '@/shared/ui'
import { hrApi } from '../api'
import { money } from '../format'

/**
 * เงินเดือน/เบี้ยตำแหน่งรายคน — ซ่อนไว้ก่อน กด "แสดง" จึงโหลดจากเซิร์ฟเวอร์
 * ทุกครั้งที่แสดงจะมี Audit Log ฝั่งเซิร์ฟเวอร์ · เปลี่ยนคนที่เลือกแล้วจะซ่อนกลับทันที
 */
export default function SalaryBox({ employeeId }) {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => setData(null), [employeeId])

  const toggle = async () => {
    if (data) return setData(null)
    setBusy(true)
    try {
      setData(await hrApi.get(`/employees/${employeeId}/compensation`))
      toast('บันทึกการเปิดดูเงินเดือนใน Audit Log แล้ว')
    } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }
  const v = (n) => (data ? `${money(n)} บาท` : '•••••')

  return (
    <div className="grid gap-2">
      <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-slate-500">เงินเดือน</dt><dd className="tabular-nums">{v(data?.base_salary)}</dd>
        <dt className="text-slate-500">เบี้ยตำแหน่ง</dt><dd className="tabular-nums">{v(data?.allowance)}</dd>
      </dl>
      <div><Button variant="ghost" disabled={busy} onClick={toggle}>{data ? 'ซ่อนเงินเดือน' : 'แสดงเงินเดือน'}</Button></div>
    </div>
  )
}
