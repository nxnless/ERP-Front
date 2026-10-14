import { useState } from 'react'
import { Button, Notice } from '@/shared/ui'
import Modal from './Modal'

/** แสดงรหัสผ่านชั่วคราว "ครั้งเดียว" — ระบบไม่เก็บและเปิดดูย้อนหลังไม่ได้ */
export default function SecretBox({ title = 'รหัสผ่านชั่วคราว', email, password, onClose }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(password); setCopied(true) } catch { setCopied(false) }
  }
  return (
    <Modal title={title} onClose={onClose}>
      <div className="grid gap-3">
        <Notice>ส่งรหัสนี้ให้ผู้ใช้ทางช่องทางที่ปลอดภัย แล้วแนะนำให้เปลี่ยนรหัสผ่านทันที — <b>ปิดหน้าต่างนี้แล้วจะดูรหัสอีกไม่ได้</b></Notice>
        <div className="text-sm text-slate-500">บัญชี: <span className="text-slate-900 dark:text-slate-100">{email}</span></div>
        <code data-testid="temp-password" className="select-all rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-lg tracking-wide dark:border-slate-600 dark:bg-slate-800">{password}</code>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={copy}>{copied ? 'คัดลอกแล้ว' : 'คัดลอกรหัสผ่าน'}</Button>
          <Button onClick={onClose}>รับทราบ ปิดหน้าต่าง</Button>
        </div>
      </div>
    </Modal>
  )
}
