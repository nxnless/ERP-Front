import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center dark:bg-slate-950 dark:text-slate-100">
      <div>
        <h1 className="text-2xl font-semibold">ไม่พบหน้านี้</h1>
        <Link to="/" className="mt-3 inline-block text-rose-700 underline">กลับหน้าหลัก</Link>
      </div>
    </div>
  )
}
