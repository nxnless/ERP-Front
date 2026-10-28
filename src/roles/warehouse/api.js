import { createApi } from '@/shared/api/client'
import { useApi } from '@/shared/hooks/useApi'

export const warehouseApi = createApi('/warehouse')
/** GET ผ่าน endpoint ของคลัง: useWarehouseApi('/stock') — ส่ง null เพื่อยังไม่โหลด */
export const useWarehouseApi = (path) => useApi(warehouseApi, path)
