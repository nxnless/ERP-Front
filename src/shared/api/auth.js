import { getToken } from '../auth/storage'

// headers ที่แนบทุก request — อ่านจาก token ที่ได้ตอน login
export function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
