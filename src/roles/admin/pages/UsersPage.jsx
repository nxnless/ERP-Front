import { useEffect, useState } from 'react'
import { Async, Button, Card, Input, PageHeader, Select, Table, Tag, thDate, thTime, useToast } from '@/shared/ui'
import { useAuth } from '@/shared/auth'
import { adminApi, useAdminApi } from '../api'
import Modal from '../components/Modal'
import SecretBox from '../components/SecretBox'
import UserForm from '../components/UserForm'

const STATUS = { active: ['ใช้งาน', 'ok'], suspended: ['ระงับ', 'bad'], invited: ['รอเปิดใช้', 'warn'] }

export default function UsersPage() {
  const toast = useToast()
  const { user: me } = useAuth()
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [role, setRole] = useState('')
  useEffect(() => { const t = setTimeout(() => setQ(qInput.trim()), 300); return () => clearTimeout(t) }, [qInput])
  const qs = new URLSearchParams({ ...(q && { q }), ...(status && { status }), ...(role && { role }) }).toString()
  const list = useAdminApi('/users' + (qs ? `?${qs}` : ''))
  const meta = useAdminApi('/meta')
  const [modal, setModal] = useState(null) // { kind: 'create' } | { kind: 'edit', user }
  const [secret, setSecret] = useState(null)
  const [busy, setBusy] = useState(false)

  const run = async (fn, ok) => {
    setBusy(true)
    try { const r = await fn(); if (ok) toast(ok); list.reload(); return r } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }
  const create = async (f) => {
    const r = await run(() => adminApi.post('/users', { email: f.email, display_name: f.display_name, branch_id: f.branch_id, role_ids: f.role_ids }))
    if (r) { setModal(null); setSecret({ title: 'สร้างผู้ใช้แล้ว', email: r.email, password: r.temp_password }) }
  }
  const edit = async (f) => {
    const r = await run(() => adminApi.put(`/users/${modal.user.id}`, { display_name: f.display_name, branch_id: f.branch_id ?? null, role_ids: f.role_ids }), 'บันทึกแล้ว')
    if (r) setModal(null)
  }
  const toggle = (u) => {
    const suspend = u.status === 'active'
    if (!window.confirm(suspend ? `ระงับบัญชี ${u.email} ?\nผู้ใช้จะเข้าระบบไม่ได้ทันที` : `เปิดใช้บัญชี ${u.email} อีกครั้ง?`)) return
    run(() => adminApi.post(`/users/${u.id}/${suspend ? 'suspend' : 'reactivate'}`), suspend ? 'ระงับบัญชีแล้ว' : 'เปิดใช้บัญชีแล้ว')
  }
  const reset = async (u) => {
    if (!window.confirm(`รีเซ็ตรหัสผ่านของ ${u.email} ?\nรหัสเดิมจะใช้ไม่ได้ทันที`)) return
    const r = await run(() => adminApi.post(`/users/${u.id}/reset-password`))
    if (r) setSecret({ title: 'รีเซ็ตรหัสผ่านแล้ว', email: r.email, password: r.temp_password })
  }

  return (
    <>
      <PageHeader title="ผู้ใช้" sub="เพิ่ม ระงับ รีเซ็ตรหัสผ่าน และกำหนดบทบาท" />
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="min-w-48 flex-1"><Input placeholder="ค้นหาชื่อหรืออีเมล" value={qInput} onChange={(e) => setQInput(e.target.value)} aria-label="ค้นหา" /></div>
        <div className="w-40"><Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="สถานะ"><option value="">ทุกสถานะ</option>{Object.entries(STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</Select></div>
        <div className="w-44"><Select value={role} onChange={(e) => setRole(e.target.value)} aria-label="บทบาท"><option value="">ทุกบทบาท</option>{meta.data?.roles.map((r) => <option key={r.id} value={r.code}>{r.name}</option>)}</Select></div>
        <Button disabled={!meta.data} onClick={() => setModal({ kind: 'create' })}>+ เพิ่มผู้ใช้</Button>
      </div>
      <Async state={list}>
        {(rows) => (
          <Table head={['ผู้ใช้', 'บทบาท', 'สาขา', 'สถานะ', 'เข้าใช้ล่าสุด', '']}>
            {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">ไม่พบผู้ใช้</td></tr>}
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="px-3 py-2"><div className="font-medium">{u.display_name}</div><div className="text-xs text-slate-500">{u.email}</div></td>
                <td className="px-3 py-2"><div className="flex flex-wrap gap-1">{u.roles.map((r) => <Tag key={r.id} tone={r.code === 'admin' ? 'accent' : 'muted'}>{r.name}</Tag>)}</div></td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{u.branch_name ?? '—'}</td>
                <td className="px-3 py-2"><Tag tone={STATUS[u.status][1]}>{STATUS[u.status][0]}</Tag>{u.mfa_enabled && <span className="ml-1 text-xs text-slate-500">MFA</span>}</td>
                <td className="px-3 py-2 text-xs text-slate-500">{u.last_login_at ? `${thDate(u.last_login_at)} ${thTime(u.last_login_at)}` : '—'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <Button variant="ghost" className="mr-1" disabled={busy} onClick={() => setModal({ kind: 'edit', user: u })}>แก้ไข</Button>
                  {u.id !== me.id && <>
                    <Button variant="ghost" className="mr-1" disabled={busy} onClick={() => reset(u)}>รีเซ็ตรหัส</Button>
                    {u.status !== 'invited' && <Button variant={u.status === 'active' ? 'danger' : 'ghost'} disabled={busy} onClick={() => toggle(u)}>{u.status === 'active' ? 'ระงับ' : 'เปิดใช้'}</Button>}
                  </>}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Async>
      <p className="mt-2 text-xs text-slate-500">ยังไม่มีระบบส่งอีเมลเชิญ — ระบบจะสร้างรหัสผ่านชั่วคราวให้ส่งต่อผู้ใช้เอง</p>

      {modal?.kind === 'create' && meta.data && (
        <Modal title="เพิ่มผู้ใช้" onClose={() => setModal(null)}>
          <UserForm meta={meta.data} busy={busy} submitLabel="สร้างผู้ใช้" onSubmit={create} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.kind === 'edit' && meta.data && (
        <Modal title={`แก้ไข ${modal.user.email}`} onClose={() => setModal(null)}>
          <UserForm meta={meta.data} busy={busy} lockEmail lockRoles={modal.user.id === me.id} submitLabel="บันทึก"
            initial={{ email: modal.user.email, display_name: modal.user.display_name, branch_id: modal.user.branch_id ?? '', role_ids: modal.user.roles.map((r) => r.id) }}
            onSubmit={edit} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {secret && <SecretBox {...secret} onClose={() => setSecret(null)} />}
    </>
  )
}
