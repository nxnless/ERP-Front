import { useState } from 'react'
import { Button, Field, Input, Notice, Select } from '@/shared/ui'

/**
 * ฟอร์มผู้ใช้ (ใช้ทั้ง เพิ่ม/แก้ไข/ดำเนินการคำขอเปิดบัญชี)
 *   meta = { roles, branches } จาก GET /admin/meta · initial = { email, display_name, branch_id, role_ids }
 *   lockEmail = แก้ไขผู้ใช้เดิม (ห้ามเปลี่ยนอีเมล) · lockRoles = แก้ไขตนเอง (ห้ามเปลี่ยนบทบาท)
 */
export default function UserForm({ meta, initial, lockEmail = false, lockRoles = false, submitLabel, busy, onSubmit, onCancel }) {
  const [f, setF] = useState({ email: '', display_name: '', branch_id: '', role_ids: [], ...initial })
  const code = (id) => meta.roles.find((r) => r.id === id)?.code
  const codes = f.role_ids.map(code)
  const conflict = codes.includes('admin') && codes.some((c) => c !== 'admin' && c !== 'employee')
  const valid = f.email.trim() && f.display_name.trim() && f.role_ids.length > 0 && !conflict
  const toggle = (id) => setF((s) => ({ ...s, role_ids: s.role_ids.includes(id) ? s.role_ids.filter((x) => x !== id) : [...s.role_ids, id] }))
  return (
    <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); if (valid && !busy) onSubmit({ ...f, branch_id: f.branch_id || undefined }) }}>
      <Field label="อีเมล"><Input type="email" value={f.email} disabled={lockEmail} required onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
      <Field label="ชื่อที่แสดง"><Input value={f.display_name} required maxLength={100} onChange={(e) => setF({ ...f, display_name: e.target.value })} /></Field>
      <Field label="สาขา">
        <Select value={f.branch_id ?? ''} onChange={(e) => setF({ ...f, branch_id: e.target.value })}>
          <option value="">— ไม่ระบุ —</option>{meta.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
      </Field>
      <fieldset className="grid gap-1.5" disabled={lockRoles}>
        <legend className="mb-1 text-sm text-slate-600 dark:text-slate-300">บทบาท {lockRoles && <span className="text-xs text-slate-500">(แก้บทบาทของตนเองไม่ได้)</span>}</legend>
        <div className="grid grid-cols-2 gap-1.5">
          {meta.roles.map((r) => (
            <label key={r.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={f.role_ids.includes(r.id)} onChange={() => toggle(r.id)} /> {r.name}
            </label>
          ))}
        </div>
      </fieldset>
      {conflict && <Notice tone="bad">ผู้ดูแลระบบถือบทบาทอื่นได้เฉพาะ “พนักงานทั่วไป” (แยกหน้าที่ — Admin ต้องไม่เห็นข้อมูลธุรกิจ)</Notice>}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onCancel}>ยกเลิก</Button>
        <Button type="submit" disabled={!valid || busy}>{busy ? 'กำลังบันทึก…' : submitLabel}</Button>
      </div>
    </form>
  )
}
