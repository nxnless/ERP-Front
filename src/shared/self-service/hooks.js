import { useApi } from '@/shared/hooks/useApi'
import { api } from './api'

/** GET ผ่าน endpoint ของ self-service: useSelfServiceApi('/leave/balances') */
export const useSelfServiceApi = (path) => useApi(api, path)
