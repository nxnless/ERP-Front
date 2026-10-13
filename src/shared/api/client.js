import { authHeaders } from './auth'
import { clearToken } from '../auth/storage'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/** สร้าง client ที่เรียก `${VITE_API_URL}${prefix}${path}` เช่น createApi('/employee') */
export function createApi(prefix = '') {
  async function call(method, path, body, opts = {}) {
    const res = await fetch(`${BASE}${prefix}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data = await res.json().catch(() => null)
    // 401 = token หมดอายุ/ไม่ถูกต้อง → ล้าง token แล้วแจ้ง AuthProvider ให้กลับไปหน้า login
    // (silent401 ใช้กับ /auth/login ที่ 401 หมายถึงรหัสผ่านผิด ไม่ใช่เซสชันหมดอายุ)
    if (res.status === 401 && !opts.silent401) {
      clearToken()
      window.dispatchEvent(new Event('auth:expired'))
    }
    if (!res.ok) throw new Error(data?.error ?? `เกิดข้อผิดพลาด (${res.status})`)
    return data
  }
  return {
    get: (path) => call('GET', path),
    post: (path, body = {}, opts) => call('POST', path, body, opts),
    put: (path, body) => call('PUT', path, body),
    delete: (path) => call('DELETE', path),
  }
}
