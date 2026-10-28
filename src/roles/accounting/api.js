import { createApi } from '@/shared/api/client'
import { useApi } from '@/shared/hooks/useApi'

export const accApi = createApi('/accounting')
/** GET ผ่าน endpoint ของบัญชี: useAccApi('/aging?direction=AR') — ส่ง null เพื่อยังไม่โหลด */
export const useAccApi = (path) => useApi(accApi, path)
