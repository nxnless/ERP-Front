import { createApi } from '@/shared/api/client'
import { useApi } from '@/shared/hooks/useApi'

export const hrApi = createApi('/hr')
/** GET ผ่าน endpoint ของ HR: useHrApi('/employees?department=HR') — ส่ง null เพื่อยังไม่โหลด */
export const useHrApi = (path) => useApi(hrApi, path)
