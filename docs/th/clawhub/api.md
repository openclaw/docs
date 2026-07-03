---
read_when:
    - การสร้างไคลเอนต์ API
    - การเพิ่ม endpoints หรือ schemas
summary: ภาพรวมและแบบแผนของ REST API สาธารณะ (v1)
x-i18n:
    generated_at: "2026-07-03T02:56:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

ฐาน: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## การนำแคตตาล็อกสาธารณะไปใช้ซ้ำ

คุณสามารถสร้างแคตตาล็อก ไดเรกทอรี หรือพื้นผิวการค้นหาของบุคคลที่สามบน API การอ่านสาธารณะของ ClawHub ได้ เมทาดาทาสกิลสาธารณะและไฟล์สกิลเผยแพร่ภายใต้กฎสิทธิ์การใช้งานสกิลของ ClawHub ขณะที่ตัว API เองมีการจำกัดอัตราและควรถูกใช้งานอย่างรับผิดชอบ

แนวทาง:

- ใช้ endpoint การอ่านสาธารณะ เช่น `GET /api/v1/skills`, `GET /api/v1/search` และ `GET /api/v1/skills/{slug}` สำหรับรายการแคตตาล็อก
- แคชการตอบกลับและเคารพ `429`, `Retry-After` และส่วนหัวจำกัดอัตรา แทนการ polling อย่างถี่เกินไป
- ลิงก์กลับไปยัง URL สกิล ClawHub ต้นฉบับเมื่อแสดงรายการ เพื่อให้ผู้ใช้ตรวจสอบระเบียนรีจิสทรีต้นทางได้
- ใช้ URL หน้าต้นฉบับในรูปแบบ `https://clawhub.ai/<owner>/skills/<slug>`
- อย่าสื่อว่า ClawHub รับรอง ตรวจสอบ หรือดำเนินการไซต์ของบุคคลที่สาม
- อย่ามิเรอร์เนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรอง ด้วยการเลี่ยงตัวกรอง API สาธารณะหรือขอบเขตการยืนยันตัวตน

## การยืนยันตัวตน

- อ่านสาธารณะ: ไม่ต้องใช้ token
- เขียน + บัญชี: `Authorization: Bearer clh_...`

## ขีดจำกัดอัตรา

การบังคับใช้โดยคำนึงถึงการยืนยันตัวตน:

- คำขอแบบไม่ระบุตัวตน: ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (Bearer token ที่ถูกต้อง): ต่อ bucket ผู้ใช้
- token ที่หายไป/ไม่ถูกต้องจะถอยกลับไปใช้การบังคับใช้ตาม IP

- อ่าน: 3000/นาที ต่อ IP, 12000/นาที ต่อคีย์
- เขียน: 300/นาที ต่อ IP, 3000/นาที ต่อคีย์
- ดาวน์โหลด: 1200/นาที ต่อ IP, 6000/นาที ต่อคีย์

ส่วนหัว: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` และ `Retry-After` จะรวมอยู่ใน `429`

ความหมาย:

- `X-RateLimit-Reset`: วินาทีแบบ Unix epoch (เวลารีเซ็ตแบบสัมบูรณ์)
- `RateLimit-Reset`: วินาทีที่ต้องหน่วงจนกว่าจะรีเซ็ต
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: งบประมาณที่เหลืออยู่แบบแน่นอนเมื่อ
  มีอยู่; คำขอสำเร็จที่ถูกแบ่งชาร์ดจะละไว้ แทนการคืนค่ารวมทั่วระบบแบบประมาณ
- `Retry-After`: วินาทีที่ต้องหน่วงเพื่อรอบน `429`

ตัวอย่าง `429`:

```http
HTTP/2 429
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34
```

การจัดการฝั่งไคลเอนต์:

- ใช้ `Retry-After` ก่อนเมื่อมีอยู่
- ไม่เช่นนั้นให้ใช้ `RateLimit-Reset` หรือคำนวณเวลาหน่วงจาก `X-RateLimit-Reset`
- เพิ่ม jitter ให้กับการลองซ้ำ

## ข้อผิดพลาด

- ข้อผิดพลาด v1 เป็นข้อความธรรมดา (`text/plain; charset=utf-8`) รวมถึง `400`,
  `401`, `403`, `404`, `429` และการตอบกลับการดาวน์โหลดที่ถูกบล็อก
- พารามิเตอร์ query ที่ไม่รู้จักจะถูกละเว้นเพื่อความเข้ากันได้
- พารามิเตอร์ query ที่รู้จักแต่มีค่าไม่ถูกต้องจะคืน `400`

## Endpoint

อ่านสาธารณะ:

- `GET /api/v1/search?q=...`
  - ตัวกรองเสริม: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - alias เดิม: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (ค่าเริ่มต้น), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), alias การติดตั้งเดิม `installsCurrent`/`installs`/`installsAllTime` แมปไปยัง `downloads`, `trending`
  - ค่า `sort` ที่ไม่ถูกต้องจะคืน `400`
  - `cursor` ใช้กับการเรียงลำดับที่ไม่ใช่ `trending`
  - ตัวกรองเสริม: `nonSuspiciousOnly=true`
  - alias เดิม: `nonSuspicious=true`
  - เมื่อใช้ `nonSuspiciousOnly=true` หน้าที่อิง `cursor` อาจมีรายการน้อยกว่า `limit`; ใช้ `nextCursor` เพื่อดำเนินการต่อ
  - `recommended` ใช้สัญญาณ engagement และ recency
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - สกิลที่โฮสต์ไว้จะคืน bytes ของ ZIP แบบกำหนดผลลัพธ์ได้แน่นอน
  - สกิลปัจจุบันที่มี GitHub เป็นแหล่งรองรับและมีผลสแกน `clean` หรือ `suspicious` จะคืน
    descriptor การส่งต่อ JSON `public-github` แทน bytes จาก ClawHub
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - สกิลที่โฮสต์ไว้จะถูกส่งออกเป็นไฟล์ที่จัดเก็บไว้
  - สกิลปัจจุบันที่มี GitHub เป็นแหล่งรองรับและมีผลสแกน `clean` หรือ `suspicious` จะถูกส่งออก
    เป็น descriptor การส่งต่อ `public-github`
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (ค่าเริ่มต้น), `recommended`, `downloads`, alias เดิม `installs`
  - ค่า `sort` ที่ไม่ถูกต้องจะคืน `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (ค่าเริ่มต้น), `downloads`, `updated`, alias เดิม `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

ต้องมีการยืนยันตัวตน:

- `POST /api/v1/skills` (เผยแพร่, แนะนำให้ใช้ multipart)
- `DELETE /api/v1/skills/{slug}`
- `DELETE /api/v1/packages/{name}`
- `POST /api/v1/skills/{slug}/undelete`
- `POST /api/v1/packages/{name}/undelete`
- `POST /api/v1/skills/{slug}/rename`
- `POST /api/v1/skills/{slug}/merge`
- `POST /api/v1/skills/{slug}/transfer`
- `POST /api/v1/packages/{name}/transfer`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

เฉพาะผู้ดูแลระบบ:

- `POST /api/v1/users/reserve` สำรอง root slugs และ placeholder แพ็กเกจส่วนตัวแบบไม่มี release สำหรับ handle เจ้าของ

## เดิม

`/api/*` และ `/api/cli/*` เดิมยังพร้อมใช้งาน ดู `DEPRECATIONS.md`
