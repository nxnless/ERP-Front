import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from './api'
import { clearToken, getToken, setToken } from './storage'

const Ctx = createContext(null)

/** { user: { id, email, name, roles } | null, loading, login(email, password), logout(), hasRole(...roles) } */
export const useAuth = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth ต้องใช้ภายใน <AuthProvider>')
  return v
}

export function AuthProvider({ children }) {
  // มี token ค้างอยู่ = ต้องตรวจกับ backend ก่อนว่ายังใช้ได้ (กู้เซสชันตอนเปิดแอป/รีเฟรชหน้า)
  const [state, setState] = useState({ user: null, loading: !!getToken() })

  useEffect(() => {
    if (!getToken()) return
    let live = true
    authApi.get('/me')
      .then((user) => live && setState({ user, loading: false }))
      .catch(() => { clearToken(); live && setState({ user: null, loading: false }) })
    return () => { live = false }
  }, [])

  // token หมดอายุระหว่างใช้งาน (api client ส่ง event นี้เมื่อได้ 401)
  useEffect(() => {
    const expired = () => setState({ user: null, loading: false })
    window.addEventListener('auth:expired', expired)
    return () => window.removeEventListener('auth:expired', expired)
  }, [])

  const login = useCallback(async (email, password) => {
    const r = await authApi.post('/login', { email, password }, { silent401: true })
    setToken(r.token)
    setState({ user: r.user, loading: false })
    return r.user
  }, [])

  const logout = useCallback(() => {
    authApi.post('/logout', {}, { silent401: true }).catch(() => {}) // เรียกก่อนล้าง token (header ถูกอ่านทันที)
    clearToken()
    setState({ user: null, loading: false })
  }, [])

  const value = useMemo(
    () => ({ ...state, login, logout, hasRole: (...roles) => roles.some((r) => state.user?.roles.includes(r)) }),
    [state, login, logout],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
