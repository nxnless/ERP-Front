import { createContext, useContext, useMemo } from 'react'
import { useSelfServiceApi } from './hooks'

const Ctx = createContext({ me: null, reloadMe: () => {}, base: '' })

/** ข้อมูลผู้ใช้ (/me) + base path ของตำแหน่งที่หน้านี้ถูกวางอยู่ (เช่น '/employee', '/manager') */
export const useSelfService = () => useContext(Ctx)

export function SelfServiceProvider({ base, children }) {
  const me = useSelfServiceApi('/me')
  const value = useMemo(() => ({ me: me.data, reloadMe: me.reload, base }), [me.data, me.reload, base])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
