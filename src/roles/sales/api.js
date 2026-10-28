import { createApi } from '@/shared/api/client'
import { useApi } from '@/shared/hooks/useApi'

export const salesApi = createApi('/sales')
/** GET ผ่าน endpoint ของฝ่ายขาย: useSalesApi('/customers') — ส่ง null เพื่อยังไม่โหลด */
export const useSalesApi = (path) => useApi(salesApi, path)
