import { useEffect, useState } from 'react'
import { Async, Button, Card, Input, Notice, PageHeader, Select, Table, Tag, thDate, thTime } from '@/shared/ui'
import { useAdminApi } from '../api'
import Modal from '../components/Modal'

const RISK = { low: ['ต่ำ', 'ok'], medium: ['กลาง', 'warn'], high: ['สูง', 'bad'] }
const PAGE = 50

export default function AuditPage() {
  const [qInput, setQInput] = useState('')
  const [f, setF] = useState({ q: '', module: '', risk: '', from: '', to: '' })
  const [offset, setOffset] = useState(0)
  useEffect(() => { const t = setTimeout(() => { setF((s) => ({ ...s, q: qInput.trim() })); setOffset(0) }, 300); return () => clearTimeout(t) }, [qInput])
  const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)), limit: PAGE, offset }).toString()
  const data = useAdminApi(`/audit?${qs}`)
  const [row, setRow] = useState(null)
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setOffset(0) }

  return (
    <>
      <PageHeader title="Audit Log" sub="ใคร ทำอะไร เมื่อไร และค่าก่อน–หลัง · ดูอย่างเดียว แก้หรือลบไม่ได้" />
      <Notice tone="accent">ค่าก่อน–หลังแสดงเฉพาะเหตุการณ์ของระบบตั้งค่า ส่วนเหตุการณ์ของโมดูลธุรกิจ (เงินเดือน บัญชี ขาย ฯลฯ) เห็นเพียงว่าใครทำอะไรเมื่อไร — ข้อมูลธุรกิจถูกซ่อนจากผู้ดูแลระบบ</Notice>
      <div className="my-3 flex flex-wrap gap-2">
        <div className="min-w-44 flex-1"><Input placeholder="ค้นหาผู้ทำ / การกระทำ / อ้างอิง" aria-label="ค้นหา" value={qInput} onChange={(e) => setQInput(e.target.value)} /></div>
        <div className="w-40"><Select aria-label="โมดูล" value={f.module} onChange={set('module')}><option value="">ทุกโมดูล</option>{(data.data?.modules ?? []).map((m) => <option key={m}>{m}</option>)}</Select></div>
        <div className="w-36"><Select aria-label="ความเสี่ยง" value={f.risk} onChange={set('risk')}><option value="">ทุกระดับ</option>{Object.entries(RISK).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</Select></div>
        <div className="w-40"><Input type="date" aria-label="ตั้งแต่วันที่" value={f.from} onChange={set('from')} /></div>
        <div className="w-40"><Input type="date" aria-label="ถึงวันที่" value={f.to} onChange={set('to')} /></div>
      </div>
      <Async state={data}>
        {({ rows, total }) => (
          <>
            <Table head={['เวลา', 'ผู้ทำ', 'การกระทำ', 'โมดูล', 'อ้างอิง', 'ความเสี่ยง', '']}>
              {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">ไม่พบรายการ</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">{thDate(r.occurred_at)} {thTime(r.occurred_at)}</td>
                  <td className="px-3 py-2">{r.actor_name ?? '—'}<div className="text-xs text-slate-500">{r.ip ?? ''}</div></td>
                  <td className="px-3 py-2">{r.action}</td><td className="px-3 py-2"><Tag>{r.module}</Tag></td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{r.entity_ref ?? '—'}</td>
                  <td className="px-3 py-2"><Tag tone={RISK[r.risk][1]}>{RISK[r.risk][0]}</Tag></td>
                  <td className="px-3 py-2 text-right"><Button variant="ghost" onClick={() => setRow(r)}>รายละเอียด</Button></td>
                </tr>
              ))}
            </Table>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
              <span>ทั้งหมด {total.toLocaleString('th-TH')} รายการ · แสดง {total ? offset + 1 : 0}–{Math.min(offset + PAGE, total)}</span>
              <div className="flex gap-2"><Button variant="ghost" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>ก่อนหน้า</Button><Button variant="ghost" disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>ถัดไป</Button></div>
            </div>
          </>
        )}
      </Async>
      {row && (
        <Modal title={`${row.action} · ${row.entity_ref ?? ''}`} onClose={() => setRow(null)} wide>
          <div className="mb-3 grid grid-cols-2 gap-1 text-sm"><span className="text-slate-500">ผู้ทำ</span><span>{row.actor_name} ({row.actor_roles})</span><span className="text-slate-500">เวลา</span><span>{thDate(row.occurred_at)} {thTime(row.occurred_at)}</span><span className="text-slate-500">ตาราง</span><span>{row.entity_table}</span></div>
          {row.masked ? <Notice>ข้อมูลธุรกิจ — ค่าก่อน–หลังถูกซ่อนจากผู้ดูแลระบบ</Notice> : (
            <div className="grid gap-3 md:grid-cols-2">
              {[['ก่อน', row.before], ['หลัง', row.after]].map(([l, v]) => (
                <div key={l}><div className="mb-1 text-xs text-slate-500">{l}</div><pre className="max-h-72 overflow-auto rounded-md bg-slate-50 p-2 text-xs dark:bg-slate-800">{v ? JSON.stringify(v, null, 2) : '—'}</pre></div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </>
  )
}
