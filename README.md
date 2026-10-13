# ERP Frontend (Vite + React + Tailwind v4)

```
src/
  main.jsx  App.jsx  index.css
  app/                         เปลือกแอป: router.jsx · LoginPage · RootRedirect · NotFoundPage · home.js
  roles/                       ★ หนึ่งโฟลเดอร์ต่อหนึ่งตำแหน่ง (วางแล้วลงทะเบียนเอง)
    index.jsx                    รวม src/roles/*/index.jsx อัตโนมัติ + ครอบ <RequireAuth> ให้ทุกตำแหน่ง
    employee/                    ← วางโฟลเดอร์ employee ที่นี่ (มีให้แล้ว)
      index.jsx                    export default { path:'employee', element, children }
      EmployeeLayout.jsx
  shared/                      ใช้ร่วมกันทุกตำแหน่ง
    auth/       AuthContext (useAuth) · RequireAuth · storage.js (ที่เก็บ token) · api.js
    api/        client.js (createApi · จัดการ 401) · auth.js (แนบ Bearer token)
    hooks/      useApi.js
    ui/         Card Tag Button Field Table Notice Async Toast … + ฟังก์ชันจัดรูปแบบ (baht, thDate, …)
    format.js
    layout/     RoleLayout.jsx          เมนูซ้าย + เนื้อหา ใช้ได้ทุกตำแหน่ง
    self-service/                       ★ ฟังก์ชันที่ "ทุกตำแหน่งมี"
      index.js                            selfServiceRoutes · selfServiceNav · useSelfService …
      pages/ TimeLeave · Requests · NewRequest · Payslip · Profile
```

## เริ่มใช้งาน
```bash
npm install
cp .env.example .env     # ตั้ง VITE_API_URL (ชี้ไป backend)
npm run dev              # เปิด http://localhost:5173 → ถูกพาไป /login
npm run build
```

## ระบบ login
- `/login` (`src/app/LoginPage.jsx`) → `POST /auth/login` ได้ JWT เก็บที่ `localStorage` (แก้ที่เก็บได้ที่ `shared/auth/storage.js` ไฟล์เดียว)
- ทุก route ใน `src/roles/*` ถูกครอบด้วย `<RequireAuth>` อัตโนมัติ: ไม่ล็อกอิน → `/login` แล้วกลับหน้าเดิมหลังเข้าสู่ระบบ
- จำกัดตามบทบาทที่ route ของตำแหน่งนั้น: `handle: { roles: ['manager'] }` (ไม่ใส่/ว่าง = ผู้ล็อกอินทุกคน)
- เปิดแอป/รีเฟรชหน้า: ถ้ามี token จะเรียก `GET /auth/me` กู้เซสชัน; ถ้า backend ตอบ 401 (หมดอายุ/ถูกระงับ) ระบบล้าง token และกลับหน้า login เอง
- ในโค้ด: `const { user, logout, hasRole } = useAuth()` — `user = { id, email, name, roles }`
- เข้า `/` = ไปหน้าแรกตามบทบาท (เลือกที่ `src/app/home.js` เฉพาะตำแหน่งที่มีโฟลเดอร์อยู่จริง); ปุ่ม "ออกจากระบบ" อยู่ท้ายเมนูใน `RoleLayout`

## เพิ่มตำแหน่งใหม่ (เช่น manager) และเรียกใช้ฟังก์ชันที่ทุกคนมี
สร้าง `src/roles/manager/index.jsx` แล้ววางเท่านี้ — ไม่ต้องแก้ router:
```jsx
import RoleLayout from '@/shared/layout/RoleLayout'
import { selfServiceRoutes, selfServiceNav } from '@/shared/self-service'
import InboxPage from './pages/InboxPage'

const ManagerLayout = () => (
  <RoleLayout
    title="ERP · ผู้จัดการ"
    groups={[
      { items: [{ to: 'inbox', label: 'กล่องงานรออนุมัติ' }] },        // เมนูเฉพาะตำแหน่ง
      { heading: 'ของฉัน', items: selfServiceNav },                     // เมนูมาตรฐาน (ลา/คำขอ/สลิป/โปรไฟล์)
    ]}
  />
)
export default {
  path: 'manager',
  element: <ManagerLayout />,
  children: [{ path: 'inbox', element: <InboxPage /> }, ...selfServiceRoutes],  // หน้ามาตรฐานมาให้ครบ
}
```
- path ของเมนูและลิงก์ภายในเป็นแบบสัมพัทธ์ ไม่ฝังคำว่า `/employee` จึงทำงานใต้ `/manager/time`, `/manager/payslip` ฯลฯ ได้ทันที
- ในหน้าของตำแหน่งเอง ใช้ `useSelfService()` ได้: `{ me, reloadMe, base }`
- เรียก API แบบเดียวกันได้ด้วย `useSelfServiceApi('/path')` หรือ `selfServiceApi.post(...)`; endpoint ของตำแหน่งอื่นให้สร้าง `createApi('/manager')` เอง
- หน้าไหนไม่ต้องการ เช่นตำแหน่งที่ไม่มีเงินเดือน ก็ไม่ใส่ item นั้นใน nav และกรอง `selfServiceRoutes` ออกได้

## ข้อกำหนดของโฟลเดอร์ตำแหน่ง
`src/roles/<ชื่อ>/index.jsx` ต้อง `export default` เป็น route object หรือ array ของ route object (path ไม่ต้องขึ้นต้นด้วย `/`)
