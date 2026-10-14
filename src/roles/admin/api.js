import { createApi } from '@/shared/api/client'
import { useApi } from '@/shared/hooks/useApi'

export const adminApi = createApi('/admin')
/** GET ผ่าน endpoint ของ Admin: useAdminApi('/users?status=active') */
export const useAdminApi = (path) => useApi(adminApi, path)
