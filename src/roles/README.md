# src/roles/<ตำแหน่ง>/
หนึ่งโฟลเดอร์ต่อหนึ่งตำแหน่ง (employee, manager, hr, accounting, ...)
ไฟล์ที่ต้องมี: `index.jsx` → `export default { path: '<ตำแหน่ง>', element: <Layout/>, children: [...] }`
วางโฟลเดอร์แล้ว route จะถูกรวมให้อัตโนมัติ ไม่ต้องแก้ router
ฟังก์ชันที่ทุกตำแหน่งมีเหมือนกัน (ลา/OT, คำขอของฉัน, สลิปเงินเดือน, ข้อมูลส่วนตัว) เรียกจาก `@/shared/self-service`
