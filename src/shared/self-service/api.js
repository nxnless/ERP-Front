import { createApi } from '@/shared/api/client'

// endpoint ของโมดูลพนักงานฝั่ง backend — ใช้ได้กับทุกตำแหน่งที่มีข้อมูลพนักงาน
export const api = createApi('/employee')
