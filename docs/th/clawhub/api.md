---
read_when:
    - การสร้างไคลเอนต์ API
    - การเพิ่มปลายทางหรือสคีมา
summary: ภาพรวมและแนวทางปฏิบัติของ REST API สาธารณะ (v1)
x-i18n:
    generated_at: "2026-05-12T15:42:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b6bb020fec1f8aca039dab4d1a09f7a42c64158ad48bf061ce5dbda819d1987
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

ฐาน: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## การนำแค็ตตาล็อกสาธารณะกลับมาใช้

คุณสามารถสร้างแค็ตตาล็อก ไดเรกทอรี หรือพื้นผิวการค้นหาของบุคคลที่สามบน API การอ่านสาธารณะของ ClawHub ได้ เมทาดาทา Skills สาธารณะและไฟล์ Skills ถูกเผยแพร่ภายใต้กฎสิทธิ์การใช้งาน Skills ของ ClawHub ส่วนตัว API เองมีการจำกัดอัตราและควรใช้งานอย่างรับผิดชอบ

แนวทาง:

- ใช้ปลายทางการอ่านสาธารณะ เช่น `GET /api/v1/skills`, `GET /api/v1/search` และ `GET /api/v1/skills/{slug}` สำหรับรายการแค็ตตาล็อก
- แคชการตอบกลับและเคารพ `429`, `Retry-After` และส่วนหัวขีดจำกัดอัตรา แทนการโพลอย่างถี่เกินไป
- ลิงก์กลับไปยัง URL Skills มาตรฐานของ ClawHub เมื่อแสดงรายการ เพื่อให้ผู้ใช้ตรวจสอบระเบียนรีจิสทรีต้นทางได้
- ใช้ URL หน้ามาตรฐานในรูปแบบ `https://clawhub.ai/<owner>/<slug>`
- อย่าสื่อว่า ClawHub รับรอง ตรวจสอบ หรือดำเนินงานไซต์ของบุคคลที่สาม
- อย่าทำมิเรอร์เนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรอง ด้วยการเลี่ยงตัวกรอง API สาธารณะหรือขอบเขตการยืนยันตัวตน

## การยืนยันตัวตน

- การอ่านสาธารณะ: ไม่ต้องใช้โทเค็น
- การเขียน + บัญชี: `Authorization: Bearer clh_...`

## ขีดจำกัดอัตรา

การบังคับใช้ที่รับรู้การยืนยันตัวตน:

- คำขอแบบไม่ระบุตัวตน: ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (Bearer token ที่ถูกต้อง): ต่อบัคเก็ตผู้ใช้
- โทเค็นที่หายไป/ไม่ถูกต้องจะย้อนกลับไปใช้การบังคับใช้ตาม IP

- อ่าน: 600/นาทีต่อ IP, 2400/นาทีต่อคีย์
- เขียน: 45/นาทีต่อ IP, 180/นาทีต่อคีย์

ส่วนหัว: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (เมื่อเป็น 429)

ความหมาย:

- `X-RateLimit-Reset`: วินาทีของ Unix epoch (เวลารีเซ็ตแบบสัมบูรณ์)
- `RateLimit-Reset`: จำนวนวินาทีที่หน่วงจนกว่าจะรีเซ็ต
- `Retry-After`: จำนวนวินาทีที่ต้องรอเมื่อเจอ `429`

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

การจัดการของไคลเอนต์:

- ควรใช้ `Retry-After` เมื่อมี
- มิฉะนั้นใช้ `RateLimit-Reset` หรือคำนวณระยะหน่วงจาก `X-RateLimit-Reset`
- เพิ่ม jitter ให้การลองใหม่

## ปลายทาง

การอ่านสาธารณะ:

- `GET /api/v1/search?q=...`
  - ตัวกรองเสริม: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - ชื่อแทนรุ่นเดิม: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (ค่าเริ่มต้น), `createdAt` (`newest`), `downloads`, `stars` (`rating`), `installsCurrent` (`installs`), `installsAllTime`, `trending`
  - `cursor` ใช้กับการเรียงลำดับที่ไม่ใช่ `trending`
  - ตัวกรองเสริม: `nonSuspiciousOnly=true`
  - ชื่อแทนรุ่นเดิม: `nonSuspicious=true`
  - เมื่อใช้ `nonSuspiciousOnly=true` หน้าที่อิงตามเคอร์เซอร์อาจมีรายการน้อยกว่า `limit`; ใช้ `nextCursor` เพื่อดำเนินต่อ
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

ต้องยืนยันตัวตน:

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
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

ผู้ดูแลเท่านั้น:

- `POST /api/v1/users/reserve` สงวน root slugs และตัวแทนตำแหน่งแพ็กเกจส่วนตัวที่ไม่มีรุ่นเผยแพร่สำหรับแฮนเดิลเจ้าของ

## รุ่นเดิม

รุ่นเดิม `/api/*` และ `/api/cli/*` ยังพร้อมใช้งาน ดู `DEPRECATIONS.md`
