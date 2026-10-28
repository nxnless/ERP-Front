import { useState } from 'react'
import { Button, Field, Input, Notice, Select } from '@/shared/ui'

/**
 * ฟอร์มเพิ่มพนักงานใหม่ (เข้าสถานะทดลองงาน) — บันทึกแล้วระบบส่งคำขอเปิดบัญชีผู้ใช้ให้ Admin อัตโนมัติ
 *   meta = { departments, branches, roles } จาก GET /hr/meta
 */
export default function EmployeeForm({ meta, busy, onSubmit, onCancel }) {
  const [f, setF] = useState({ full_name: '', position: '', department_id: meta.departments[0]?.id ?? '', email: '', branch_id: '', base_salary: '', allowance: '', requested_role: 'employee' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const valid = f.full_name.trim() && f.position.trim() && f.department_id && Number(f.base_salary) > 0
  const submit = (e) => {
    e.preventDefault()
    if (!valid || busy) return
    onSubmit({
      full_name: f.full_name.trim(), position: f.position.trim(), department_id: f.department_id, requested_role: f.requested_role,
      base_salary: Number(f.base_salary), allowance: Number(f.allowance) || 0,
      ...(f.email.trim() && { email: f.email.trim() }), ...(f.branch_id && { branch_id: f.branch_id }),
    })
  }
  return (
    <form className="grid gap-3" onSubmit={submit}>
      <Field label="ชื่อ-นามสกุล"><Input value={f.full_name} maxLength={100} required onChange={set('full_name')} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="ตำแหน่ง"><Input value={f.position} maxLength={100} required onChange={set('position')} /></Field>
        <Field label="แผนก"><Select value={f.department_id} onChange={set('department_id')}>{meta.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
        <Field label="เงินเดือน (บาท)"><Input type="number" min="1" value={f.base_salary} required onChange={set('base_salary')} /></Field>
        <Field label="เบี้ยตำแหน่ง (บาท)"><Input type="number" min="0" value={f.allowance} onChange={set('allowance')} /></Field>
        <Field label="สาขา"><Select value={f.branch_id} onChange={set('branch_id')}><option value="">— ไม่ระบุ —</option>{meta.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
        <Field label="บทบาทในระบบที่ขอ"><Select value={f.requested_role} onChange={set('requested_role')}>{meta.roles.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}</Select></Field>
      </div>
      <Field label="อีเมลบริษัท" hint="ไม่บังคับ — ถ้าไม่ใส่ Admin จะกรอกตอนสร้างบัญชี"><Input type="email" value={f.email} onChange={set('email')} /></Field>
      <Notice tone="accent">พนักงานใหม่เข้าสถานะ “ทดลองงาน” และคำขอเปิดบัญชีผู้ใช้จะถูกส่งให้ผู้ดูแลระบบ — HR ไม่ได้สร้างบัญชีเอง</Notice>
      <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onCancel}>ยกเลิก</Button><Button type="submit" disabled={!valid || busy}>{busy ? 'กำลังบันทึก…' : 'เพิ่มพนักงาน'}</Button></div>
    </form>
  )
}
