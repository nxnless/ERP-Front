import { useState } from 'react'
import { Async, Button, Card, Field, Input, Notice, PageHeader, Tag, useToast } from '@/shared/ui'
import { adminApi, useAdminApi } from '../api'
import Modal from '../components/Modal'

const LEVELS = [['none', 'ไม่มี'], ['read', 'ดู'], ['write', 'แก้ไข'], ['manage', 'จัดการ']]

export default function RolesPage() {
  const toast = useToast()
  const roles = useAdminApi('/roles')
  const modules = useAdminApi('/modules')
  const [draft, setDraft] = useState({}) // roleId -> { module: level }
  const [add, setAdd] = useState(null)
  const [busy, setBusy] = useState(false)

  const run = async (fn, ok) => { setBusy(true); try { await fn(); toast(ok); roles.reload() } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) } }
  const level = (r, m) => draft[r.id]?.[m] ?? r.access[m] ?? 'none'
  const setLevel = (r, m, v) => setDraft((d) => ({ ...d, [r.id]: { ...Object.fromEntries(modules.data.map((x) => [x.code, r.access[x.code] ?? 'none'])), ...d[r.id], [m]: v } }))
  const save = (r) => run(async () => { await adminApi.put(`/roles/${r.id}/access`, { access: draft[r.id] }); setDraft(({ [r.id]: _, ...rest }) => rest) }, `บันทึกสิทธิ์ ${r.name} แล้ว`)
  const approve = (r, v) => run(() => adminApi.put(`/roles/${r.id}`, { name: r.name, can_approve: v }), 'บันทึกแล้ว')
  const del = (r) => window.confirm(`ลบบทบาท "${r.name}" ?`) && run(() => adminApi.delete(`/roles/${r.id}`), 'ลบบทบาทแล้ว')
  const create = () => run(async () => { await adminApi.post('/roles', add); setAdd(null) }, 'สร้างบทบาทแล้ว')

  return (
    <>
      <PageHeader title="บทบาทและสิทธิ์" sub="กำหนดว่าแต่ละบทบาทเข้าโมดูลใดได้ในระดับไหน และเป็นผู้อนุมัติได้หรือไม่" />
      <Notice tone="accent">บทบาทผู้ดูแลระบบถูกล็อก: ตั้งค่าระบบ + ดู Audit Log เท่านั้น ไม่เห็นข้อมูลธุรกิจ และอนุมัติธุรกรรมไม่ได้ · สิทธิ์ “ตั้งค่าระบบ” มอบให้ได้เฉพาะ Admin</Notice>
      <div className="my-3"><Button variant="ghost" onClick={() => setAdd({ code: '', name: '', can_approve: false })}>+ เพิ่มบทบาท</Button></div>
      <Async state={roles}>
        {(rs) => (
          <Async state={modules}>
            {(ms) => (
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <tr><th className="px-3 py-2">บทบาท</th>{ms.map((m) => <th key={m.code} className="px-2 py-2 text-center font-medium">{m.name}{!m.enabled && <div className="text-[10px] text-red-600">ปิดอยู่</div>}</th>)}<th className="px-2 py-2 text-center">อนุมัติได้</th><th /></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rs.map((r) => {
                      const locked = r.code === 'admin', dirty = !!draft[r.id]
                      return (
                        <tr key={r.id} className={locked ? 'bg-slate-50/60 dark:bg-slate-800/40' : ''}>
                          <td className="px-3 py-2"><div className="font-medium">{r.name}</div><div className="text-xs text-slate-500">{r.code} · {r.user_count} คน {!r.is_system && <Tag>กำหนดเอง</Tag>}</div></td>
                          {ms.map((m) => (
                            <td key={m.code} className="px-1 py-2 text-center">
                              {locked ? <Tag tone={r.access[m.code] ? 'accent' : 'muted'}>{r.access[m.code] ? LEVELS.find(([k]) => k === r.access[m.code])[1] : 'ปิดกั้น'}</Tag> : (
                                <select aria-label={`${r.name} – ${m.name}`} disabled={busy || m.code === 'settings'} value={m.code === 'settings' ? 'none' : level(r, m.code)} onChange={(e) => setLevel(r, m.code, e.target.value)}
                                  className={`rounded border px-1 py-0.5 text-xs dark:bg-slate-900 ${level(r, m.code) === 'none' ? 'border-slate-200 text-slate-400 dark:border-slate-700' : 'border-rose-300 text-rose-800 dark:text-rose-300'}`}>
                                  {LEVELS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                                </select>
                              )}
                            </td>
                          ))}
                          <td className="px-2 py-2 text-center">{locked ? <Tag tone="bad">ไม่ได้</Tag> : <input type="checkbox" aria-label={`${r.name} อนุมัติได้`} checked={r.can_approve} disabled={busy} onChange={(e) => approve(r, e.target.checked)} />}</td>
                          <td className="whitespace-nowrap px-2 py-2 text-right">
                            {dirty && <Button className="mr-1" disabled={busy} onClick={() => save(r)}>บันทึก</Button>}
                            {dirty && <Button variant="ghost" className="mr-1" onClick={() => setDraft(({ [r.id]: _, ...rest }) => rest)}>ยกเลิก</Button>}
                            {!r.is_system && r.user_count === 0 && <Button variant="danger" disabled={busy} onClick={() => del(r)}>ลบ</Button>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Async>
        )}
      </Async>
      {add && (
        <Modal title="เพิ่มบทบาท" onClose={() => setAdd(null)}>
          <div className="grid gap-3">
            <Field label="รหัสบทบาท" hint="ตัวพิมพ์เล็ก ตัวเลข _ ยาว 3–31 ตัว เช่น site_manager (แก้ภายหลังไม่ได้)"><Input value={add.code} onChange={(e) => setAdd({ ...add, code: e.target.value })} /></Field>
            <Field label="ชื่อที่แสดง"><Input value={add.name} onChange={(e) => setAdd({ ...add, name: e.target.value })} maxLength={60} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={add.can_approve} onChange={(e) => setAdd({ ...add, can_approve: e.target.checked })} /> เป็นผู้อนุมัติได้</label>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setAdd(null)}>ยกเลิก</Button><Button disabled={!/^[a-z][a-z0-9_]{2,30}$/.test(add.code) || !add.name.trim() || busy} onClick={create}>สร้าง</Button></div>
          </div>
        </Modal>
      )}
    </>
  )
}
