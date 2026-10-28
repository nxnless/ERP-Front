import { createApi } from '@/shared/api/client'
import { useApi } from '@/shared/hooks/useApi'

export const managerApi = createApi('/manager')
/** GET ผ่าน endpoint ของผู้จัดการ: useManagerApi('/inbox') — ส่ง null เพื่อยังไม่โหลด */
export const useManagerApi = (path) => useApi(managerApi, path)
