import { createApi } from '@/shared/api/client'
import { useApi } from '@/shared/hooks/useApi'

export const executiveApi = createApi('/executive')
/** GET ผ่าน endpoint ของผู้บริหาร: useExecutiveApi('/inbox') */
export const useExecutiveApi = (path) => useApi(executiveApi, path)
