// เก็บ token ไว้ที่ localStorage (key เดียว) — ถ้าต้องการเปลี่ยนที่เก็บ แก้ที่ไฟล์นี้ไฟล์เดียว
const KEY = 'token'
export const getToken = () => localStorage.getItem(KEY)
export const setToken = (token) => localStorage.setItem(KEY, token)
export const clearToken = () => localStorage.removeItem(KEY)
