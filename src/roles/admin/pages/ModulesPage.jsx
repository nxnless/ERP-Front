import { useState } from 'react'
import { Async, Card, PageHeader, Tag, useToast } from '@/shared/ui'
import { adminApi, useAdminApi } from '../api'

const PROTECTED = ['settings', 'audit']
const NOTE = { settings: 'ตั้งค่าระบบ (Admin ใช้อยู่)', audit: 'Audit Log (ปิดไม่ได้)' }

export default function ModulesPage() {
  const toast = useToast()
  const mods = useAdminApi('/modules')
  const [busy, setBusy] = useState(false)
  const toggle = async (m) => {
    const next = !m.enabled
    if (!window.confirm(next ? `เปิดโมดูล "${m.name}" ?` : `ปิดโมดูล "${m.name}" ?\nเมนูและการใช้งานของโมดูลนี้จะหายจากผู้ใช้ทุกคน (ข้อมูลเดิมยังอยู่ครบ)`)) return
    setBusy(true)
    try { await adminApi.put(`/modules/${m.code}`, { enabled: next }); toast(next ? 'เปิดโมดูลแล้ว' : 'ปิดโมดูลแล้ว'); mods.reload() }
    catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }
  return (
    <>
      <PageHeader title="เปิด–ปิดโมดูล" sub="โมดูลที่ปิดจะไม่มีสิทธิ์ใช้งานสำหรับทุกบทบาท" />
      <Async state={mods}>
        {(rows) => (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((m) => (
              <Card key={m.code} className="flex items-start justify-between gap-3">
                <div><div className="font-medium">{m.name}</div><div className="text-xs text-slate-500">{NOTE[m.code] ?? m.code}</div><div className="mt-2"><Tag tone={m.enabled ? 'ok' : 'muted'}>{m.enabled ? 'เปิดอยู่' : 'ปิดอยู่'}</Tag></div></div>
                <button role="switch" aria-checked={m.enabled} aria-label={`โมดูล${m.name}`} disabled={busy || (PROTECTED.includes(m.code) && m.enabled)} onClick={() => toggle(m)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${m.enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${m.enabled ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </Card>
            ))}
          </div>
        )}
      </Async>
    </>
  )
}
