import { useState } from 'react'
import { Async, Button, Card, Field, Input, Notice, PageHeader, Select, Tag, baht, useToast } from '@/shared/ui'
import { adminApi, useAdminApi } from '../api'
import Modal from '../components/Modal'

const range = (p) => (p.min_amount === 0 && p.max_amount == null ? 'ทุกวงเงิน' : `${baht(p.min_amount)} – ${p.max_amount == null ? 'ไม่จำกัด' : baht(p.max_amount)}`)

export default function WorkflowPage() {
  const toast = useToast()
  const data = useAdminApi('/policies')
  const meta = useAdminApi('/meta')
  const [form, setForm] = useState(null) // ฟอร์มเพิ่ม/แก้ไข
  const [busy, setBusy] = useState(false)
  const [sim, setSim] = useState({ type: 'PO', amount: '', over: false, result: null })

  const run = async (fn, ok) => { setBusy(true); try { await fn(); toast(ok); data.reload(); return true } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) } }
  const payload = (f) => ({ doc_type: f.doc_type, min_amount: Number(f.min_amount) || 0, max_amount: f.max_amount === '' ? null : Number(f.max_amount), step_order: Number(f.step_order), approver_role_id: f.approver_role_id, condition_key: f.condition_key || null, active: f.active })
  const save = async () => { if (await run(() => (form.id ? adminApi.put(`/policies/${form.id}`, payload(form)) : adminApi.post('/policies', payload(form))), 'บันทึกนโยบายแล้ว')) setForm(null) }
  const del = (p) => window.confirm(`ลบขั้นอนุมัติ "${p.role_name}" (${range(p)}) ?`) && run(() => adminApi.delete(`/policies/${p.id}`), 'ลบแล้ว')
  const toggle = (p) => run(() => adminApi.put(`/policies/${p.id}`, payload({ ...p, active: !p.active, max_amount: p.max_amount ?? '', condition_key: p.condition_key })), p.active ? 'ปิดใช้ขั้นนี้แล้ว' : 'เปิดใช้ขั้นนี้แล้ว')
  const blank = (type) => ({ doc_type: type, min_amount: 0, max_amount: '', step_order: 1, approver_role_id: '', condition_key: '', active: true })
  const simulate = async () => {
    try { setSim({ ...sim, result: await adminApi.get(`/policies/preview?type=${sim.type}&amount=${Number(sim.amount) || 0}&over_quota=${sim.over}`) }) } catch (e) { toast(e.message, 'bad') }
  }
  const approvers = (type) => meta.data?.roles.filter((r) => r.can_approve || (r.code === 'admin' && type === 'ACCOUNT')) ?? []

  return (
    <>
      <PageHeader title="Workflow อนุมัติ" sub="กำหนดว่าเอกสารแต่ละประเภทต้องให้ใครอนุมัติ ที่วงเงินเท่าไร (ขั้นที่มีวงเงินตรงกันจะถูกนำมาต่อกันตามลำดับ)" />
      <Async state={data}>
        {({ types, policies }) => (
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <div className="grid gap-3">
              {types.some((t) => t.active_steps === 0) && <Notice>ประเภทที่ยังไม่มีนโยบายจะยื่นคำขอไม่ได้ (ระบบแจ้งให้ติดต่อ Admin): {types.filter((t) => t.active_steps === 0).map((t) => t.label).join(', ')}</Notice>}
              {types.map((t) => {
                const rows = policies.filter((p) => p.doc_type === t.type)
                return (
                  <Card key={t.type}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-medium">{t.label} <span className="text-xs text-slate-500">{t.type}</span> {t.active_steps === 0 && <Tag tone="warn">ยังไม่มีนโยบาย</Tag>}</div>
                      <Button variant="ghost" disabled={!meta.data} onClick={() => setForm(blank(t.type))}>+ เพิ่มขั้น</Button>
                    </div>
                    {rows.length > 0 && (
                      <table className="w-full text-sm"><tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {rows.map((p) => (
                          <tr key={p.id} className={p.active ? '' : 'opacity-50'}>
                            <td className="w-16 py-1.5 text-slate-500">ขั้น {p.step_order}</td><td className="py-1.5">{range(p)}</td>
                            <td className="py-1.5"><Tag tone="accent">{p.role_name}</Tag>{p.condition_key === 'over_quota' && <Tag tone="warn">เมื่อเกินสิทธิ์ลา</Tag>}</td>
                            <td className="whitespace-nowrap py-1.5 text-right">
                              <Button variant="ghost" className="mr-1" disabled={busy} onClick={() => toggle(p)}>{p.active ? 'ปิดใช้' : 'เปิดใช้'}</Button>
                              <Button variant="ghost" className="mr-1" disabled={busy || !meta.data} onClick={() => setForm({ ...p, max_amount: p.max_amount ?? '', condition_key: p.condition_key ?? '' })}>แก้ไข</Button>
                              <Button variant="danger" disabled={busy} onClick={() => del(p)}>ลบ</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody></table>
                    )}
                  </Card>
                )
              })}
            </div>

            <Card className="self-start">
              <h2 className="mb-2 font-medium">ทดลองเส้นทางอนุมัติ</h2>
              <div className="grid gap-2">
                <Select aria-label="ประเภท" value={sim.type} onChange={(e) => setSim({ ...sim, type: e.target.value, result: null })}>{types.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}</Select>
                <Input aria-label="วงเงิน" type="number" min="0" placeholder="วงเงิน (บาท)" value={sim.amount} onChange={(e) => setSim({ ...sim, amount: e.target.value, result: null })} />
                {sim.type === 'LEAVE' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sim.over} onChange={(e) => setSim({ ...sim, over: e.target.checked, result: null })} /> ลาเกินสิทธิ์คงเหลือ</label>}
                <Button variant="ghost" onClick={simulate}>ดูเส้นทาง</Button>
                {sim.result && <div className="rounded-md bg-rose-50 p-2 text-sm text-rose-900 dark:bg-rose-950 dark:text-rose-200" data-testid="sim-result">{sim.result.length ? 'ผู้ยื่น › ' + sim.result.join(' › ') : 'ไม่มีนโยบายที่ตรงกับวงเงินนี้'}</div>}
              </div>
            </Card>
          </div>
        )}
      </Async>

      {form && meta.data && (
        <Modal title={form.id ? 'แก้ไขขั้นอนุมัติ' : 'เพิ่มขั้นอนุมัติ'} onClose={() => setForm(null)}>
          <div className="grid gap-3">
            <div className="text-sm text-slate-500">ประเภท: <b className="text-slate-900 dark:text-slate-100">{data.data.types.find((t) => t.type === form.doc_type)?.label}</b></div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="วงเงินตั้งแต่ (บาท)"><Input type="number" min="0" value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: e.target.value })} /></Field>
              <Field label="ถึง (ว่าง = ไม่จำกัด)"><Input type="number" min="0" value={form.max_amount} onChange={(e) => setForm({ ...form, max_amount: e.target.value })} /></Field>
              <Field label="ลำดับขั้น"><Input type="number" min="1" max="10" value={form.step_order} onChange={(e) => setForm({ ...form, step_order: e.target.value })} /></Field>
              <Field label="ผู้อนุมัติ">
                <Select value={form.approver_role_id} onChange={(e) => setForm({ ...form, approver_role_id: e.target.value })}>
                  <option value="">— เลือกบทบาท —</option>{approvers(form.doc_type).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </Select>
              </Field>
            </div>
            {form.doc_type === 'LEAVE' && (
              <Field label="เงื่อนไข"><Select value={form.condition_key} onChange={(e) => setForm({ ...form, condition_key: e.target.value })}><option value="">ทุกกรณี</option><option value="over_quota">เฉพาะเมื่อลาเกินสิทธิ์</option></Select></Field>
            )}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> ใช้งาน</label>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setForm(null)}>ยกเลิก</Button><Button disabled={!form.approver_role_id || busy} onClick={save}>บันทึก</Button></div>
          </div>
        </Modal>
      )}
    </>
  )
}
