import { createApi } from '@/shared/api/client'
import { useApi } from '@/shared/hooks/useApi'

export const portalApi = createApi('/portal')
/** GET ผ่าน endpoint ของพอร์ทัล: usePortalApi('/invoices') */
export const usePortalApi = (path) => useApi(portalApi, path)
