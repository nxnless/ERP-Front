import { createApi } from '@/shared/api/client'
import { useApi } from '@/shared/hooks/useApi'

export const purchasingApi = createApi('/purchasing')
/** GET ผ่าน endpoint ของจัดซื้อ: usePurchasingApi('/suppliers') */
export const usePurchasingApi = (path) => useApi(purchasingApi, path)
