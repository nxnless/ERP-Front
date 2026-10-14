import { useEffect, useMemo, useState } from 'react'
import { Async, Button, Card, Field, Input, Notice, PageHeader, Select, Tag, Textarea, inputCls, thDate, useToast } from '@/shared/ui'
import { adminApi, useAdminApi } from '../api'
import Modal from '../components/Modal'

const TYPES = { text: 'ข้อความ', number: 'ตัวเลข', date: 'วันที่', select: 'รายการเลือก', file: 'ไฟล์แนบ' }
const SAMPLE = { doc_no: 'PO-2569-0001', date: '7 ต.ค. 2569', party_name: 'บจก. ตัวอย่าง', party_address: '88/12 ชลบุรี', total: '12,840.00' }
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

export default function FormsPage() {
  const [tab, setTab] = useState('fields')
  return (
    <>
      <PageHeader title="ฟอร์มและเทมเพลต" sub="เพิ่มฟิลด์ในฟอร์มเอกสาร และจัดการเทมเพลตพิมพ์เอกสาร" />
      <div className="mb-4 flex gap-2">
        {[['fields', 'ฟิลด์เพิ่มเติม'], ['templates', 'เทมเพลตเอกสาร']].map(([k, l]) => (
          <button key={k} aria-pressed={tab === k} onClick={() => setTab(k)} className={`rounded-full border px-3 py-1 text-sm ${tab === k ? 'border-rose-700 bg-rose-700 text-white' : 'border-slate-300 dark:border-slate-600'}`}>{l}</button>
        ))}
      </div>
      {tab === 'fields' ? <Fields /> : <Templates />}
    </>
  )
}

function Fields() {
  const toast = useToast()
  const [entity, setEntity] = useState('purchasing.purchase_orders')
  const data = useAdminApi(`/fields?entity=${entity}`)
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const run = async (fn, ok) => { setBusy(true); try { await fn(); toast(ok); data.reload(); return true } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) } }
  const opts = (f) => f.field_type === 'select' ? f.options_text.split('\n').map((s) => s.trim()).filter(Boolean) : undefined
  const save = async () => {
    const ok = form.id
      ? await run(() => adminApi.put(`/fields/${form.id}`, { label: form.label, required: form.required, options: opts(form), sort_order: Number(form.sort_order) || 0, active: form.active }), 'บันทึกแล้ว')
      : await run(() => adminApi.post('/fields', { entity, key: form.key, label: form.label, field_type: form.field_type, required: form.required, options: opts(form), sort_order: Number(form.sort_order) || 0 }), 'เพิ่มฟิลด์แล้ว')
    if (ok) setForm(null)
  }
  const blank = { key: '', label: '', field_type: 'text', required: false, options_text: '', sort_order: 0, active: true }
  const toForm = (f) => ({ ...f, options_text: (f.options ?? []).join('\n') })

  return (
    <Async state={data}>
      {({ entities, fields }) => (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-3 flex gap-2">
              <div className="w-56"><Select aria-label="ฟอร์ม" value={entity} onChange={(e) => setEntity(e.target.value)}>{entities.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}</Select></div>
              <Button onClick={() => setForm(blank)}>+ เพิ่มฟิลด์</Button>
            </div>
            <Card className="p-0">
              {fields.length === 0 && <p className="p-4 text-sm text-slate-500">ยังไม่มีฟิลด์เพิ่มเติมในฟอร์มนี้</p>}
              {fields.map((f) => (
                <div key={f.id} className={`flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-sm last:border-0 dark:border-slate-800 ${f.active ? '' : 'opacity-50'}`}>
                  <div className="flex-1"><div className="font-medium">{f.label} {f.required && <span className="text-red-600">*</span>}</div><div className="text-xs text-slate-500">{f.key} · {TYPES[f.field_type]} · ลำดับ {f.sort_order}</div></div>
                  {!f.active && <Tag>ปิดใช้</Tag>}
                  <Button variant="ghost" onClick={() => setForm(toForm(f))}>แก้ไข</Button>
                </div>
              ))}
            </Card>
            <p className="mt-2 text-xs text-slate-500">รหัสและชนิดของฟิลด์แก้ภายหลังไม่ได้ และลบไม่ได้ (ปิดใช้แทน) เพื่อไม่ให้ข้อมูลเดิมในเอกสารเพี้ยน</p>
          </div>
          <Card className="self-start">
            <h2 className="mb-2 font-medium">ตัวอย่างฟอร์ม</h2>
            <div className="grid gap-2">
              {fields.filter((f) => f.active).map((f) => (
                <label key={f.id} className="grid gap-1 text-xs text-slate-500">{f.label}{f.required ? ' *' : ''}
                  {f.field_type === 'select' ? <select disabled className={inputCls}>{(f.options ?? []).map((o) => <option key={o}>{o}</option>)}</select>
                    : <input disabled type={f.field_type === 'file' ? 'file' : f.field_type} className={inputCls} />}
                </label>
              ))}
              {fields.every((f) => !f.active) && <p className="text-sm text-slate-500">—</p>}
            </div>
          </Card>
          {form && (
            <Modal title={form.id ? `แก้ไขฟิลด์ ${form.key}` : 'เพิ่มฟิลด์'} onClose={() => setForm(null)}>
              <div className="grid gap-3">
                {!form.id && <Field label="รหัสฟิลด์" hint="ตัวพิมพ์เล็ก ตัวเลข _ เช่น project_code"><Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} /></Field>}
                <Field label="ชื่อที่แสดง"><Input value={form.label} maxLength={80} onChange={(e) => setForm({ ...form, label: e.target.value })} /></Field>
                {!form.id && <Field label="ชนิด"><Select value={form.field_type} onChange={(e) => setForm({ ...form, field_type: e.target.value })}>{Object.entries(TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>}
                {form.field_type === 'select' && <Field label="ตัวเลือก (บรรทัดละค่า)"><Textarea rows={4} value={form.options_text} onChange={(e) => setForm({ ...form, options_text: e.target.value })} /></Field>}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="ลำดับ"><Input type="number" min="0" max="999" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></Field>
                  <div className="grid content-end gap-1">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={form.required} onChange={(e) => setForm({ ...form, required: e.target.checked })} /> บังคับกรอก</label>
                    {form.id && <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> ใช้งาน</label>}
                  </div>
                </div>
                <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setForm(null)}>ยกเลิก</Button><Button disabled={busy || !form.label.trim() || (!form.id && !form.key)} onClick={save}>บันทึก</Button></div>
              </div>
            </Modal>
          )}
        </div>
      )}
    </Async>
  )
}

function Templates() {
  const toast = useToast()
  const list = useAdminApi('/templates')
  const [type, setType] = useState('PO')
  const [sel, setSel] = useState(null) // id ของเวอร์ชันที่เปิดอยู่
  const detail = useAdminApi(sel ? `/templates/${sel}` : null)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (detail.data) setBody(detail.data.body) }, [detail.data])
  const versions = useMemo(() => (list.data?.templates ?? []).filter((t) => t.doc_type === type), [list.data, type])
  useEffect(() => { setSel(versions[0]?.id ?? null) }, [type, list.data]) // eslint-disable-line react-hooks/exhaustive-deps
  const run = async (fn, ok) => { setBusy(true); try { const r = await fn(); toast(ok); list.reload(); detail.reload(); return r } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) } }
  const published = !!detail.data?.published_at
  const preview = useMemo(() => body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => esc(SAMPLE[k] ?? `{{${k}}}`)), [body])

  return (
    <Async state={list}>
      {({ types }) => (
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="grid content-start gap-3">
            <Select aria-label="ประเภทเอกสาร" value={type} onChange={(e) => setType(e.target.value)}>{types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select>
            <Button variant="ghost" disabled={busy} onClick={async () => { const r = await run(() => adminApi.post('/templates', { doc_type: type }), 'สร้างเวอร์ชันใหม่แล้ว'); if (r) setSel(r.id) }}>+ เวอร์ชันใหม่ (ร่าง)</Button>
            <Card className="p-0">
              {versions.length === 0 && <p className="p-3 text-sm text-slate-500">ยังไม่มีเทมเพลต</p>}
              {versions.map((v) => (
                <button key={v.id} onClick={() => setSel(v.id)} className={`flex w-full items-center justify-between border-b border-slate-100 px-3 py-2 text-left text-sm last:border-0 dark:border-slate-800 ${sel === v.id ? 'bg-rose-50 dark:bg-rose-950' : ''}`}>
                  <span>v{v.version}</span>{v.published_at ? <Tag tone="ok">เผยแพร่ {thDate(v.published_at)}</Tag> : <Tag tone="warn">ร่าง</Tag>}
                </button>
              ))}
            </Card>
          </div>
          <div>
            {!sel ? <Card className="py-10 text-center text-sm text-slate-500">เลือกหรือสร้างเวอร์ชันเทมเพลต</Card> : (
              <Async state={detail}>
                {() => (
                  <div className="grid gap-3">
                    {published ? <Notice tone="accent">เวอร์ชันนี้เผยแพร่แล้ว แก้ไขไม่ได้ — สร้างเวอร์ชันใหม่เพื่อแก้</Notice> : <Notice>ฉบับร่าง — ผู้ใช้จะเห็นเมื่อกดเผยแพร่</Notice>}
                    <Field label="เนื้อหา (HTML)" hint="ตัวแปร: {{doc_no}} {{date}} {{party_name}} {{party_address}} {{total}}">
                      <textarea aria-label="เนื้อหาเทมเพลต" className={`${inputCls} font-mono`} rows={10} value={body} readOnly={published} onChange={(e) => setBody(e.target.value)} />
                    </Field>
                    {!published && (
                      <div className="flex gap-2">
                        <Button disabled={busy || !body.trim()} onClick={() => run(() => adminApi.put(`/templates/${sel}`, { body }), 'บันทึกร่างแล้ว')}>บันทึกร่าง</Button>
                        <Button variant="ghost" disabled={busy} onClick={() => window.confirm('เผยแพร่เวอร์ชันนี้? เผยแพร่แล้วแก้ไม่ได้') && run(async () => { await adminApi.put(`/templates/${sel}`, { body }); await adminApi.post(`/templates/${sel}/publish`) }, 'เผยแพร่แล้ว')}>เผยแพร่</Button>
                        <Button variant="danger" disabled={busy} onClick={() => window.confirm('ลบร่างนี้?') && run(() => adminApi.delete(`/templates/${sel}`), 'ลบร่างแล้ว')}>ลบร่าง</Button>
                      </div>
                    )}
                    <div>
                      <div className="mb-1 text-sm text-slate-500">ตัวอย่างเอกสาร</div>
                      <iframe title="ตัวอย่างเทมเพลต" sandbox="" srcDoc={preview} className="h-64 w-full rounded-md border border-slate-300 bg-white dark:border-slate-600" />
                    </div>
                  </div>
                )}
              </Async>
            )}
          </div>
        </div>
      )}
    </Async>
  )
}
