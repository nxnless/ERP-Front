import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/shared/auth'
import { Button, Field, Input, Notice } from '@/shared/ui'

export default function LoginPage() {
  const { user, login } = useAuth()
  const loc = useLocation()
  const from = loc.state?.from && loc.state.from !== '/login' ? loc.state.from : '/' // "/" จะพาไปหน้าแรกตามบทบาท
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (user) return <Navigate to={from} replace />

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError(null)
    try {
      await login(email.trim(), password) // สำเร็จ → user ถูกตั้งค่า แล้วด้านบนจะ redirect เอง
    } catch (err) {
      setError(err.message)
      setPassword('')
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900" noValidate>
        <h1 className="text-xl font-semibold">เข้าสู่ระบบ</h1>
        <p className="mb-5 mt-1 text-sm text-slate-500 dark:text-slate-400">ใช้อีเมลและรหัสผ่านของบริษัท</p>

        <div className="grid gap-3">
          {error && <div role="alert"><Notice tone="bad">{error}</Notice></div>}
          <Field label="อีเมล">
            <Input type="email" name="email" autoComplete="username" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="รหัสผ่าน">
            <div className="relative">
              <Input type={show ? 'text' : 'password'} name="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-16" />
              <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                className="absolute inset-y-0 right-2 my-auto h-7 rounded px-2 text-xs text-slate-500 hover:text-rose-700">
                {show ? 'ซ่อน' : 'แสดง'}
              </button>
            </div>
          </Field>
          <Button type="submit" disabled={busy || !email.trim() || !password}>{busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}</Button>
        </div>
        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">ลืมรหัสผ่านหรือเข้าไม่ได้ กรุณาติดต่อผู้ดูแลระบบ</p>
      </form>
    </main>
  )
}
