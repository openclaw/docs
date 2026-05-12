---
read_when:
    - การสร้างไคลเอนต์ API
    - การเพิ่มเอนด์พอยต์หรือสคีมา
summary: ภาพรวมและแนวทางปฏิบัติของ REST API สาธารณะ (v1).
x-i18n:
    generated_at: "2026-05-12T04:09:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b6bb020fec1f8aca039dab4d1a09f7a42c64158ad48bf061ce5dbda819d1987
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

ฐาน: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## การนำแคตตาล็อกสาธารณะกลับมาใช้

คุณสามารถสร้างแคตตาล็อก ไดเรกทอรี หรือพื้นผิวการค้นหาของบุคคลที่สามบน API อ่านสาธารณะของ ClawHub ได้ metadata ของ skill สาธารณะและไฟล์ skill เผยแพร่ภายใต้กฎสิทธิ์การใช้งาน skill ของ ClawHub ขณะที่ตัว API เองมีการจำกัดอัตราการใช้งานและควรใช้งานอย่างรับผิดชอบ

แนวทาง:

- ใช้เอนด์พอยต์อ่านสาธารณะ เช่น `GET /api/v1/skills`, `GET /api/v1/search` และ `GET /api/v1/skills/{slug}` สำหรับรายการแคตตาล็อก
- แคชการตอบกลับและเคารพ `429`, `Retry-After` และส่วนหัวจำกัดอัตรา แทนการโพลอย่างถี่เกินไป
- ลิงก์กลับไปยัง URL skill ของ ClawHub ที่เป็นมาตรฐานเมื่อแสดงรายการ เพื่อให้ผู้ใช้ตรวจสอบเรคคอร์ด registry ต้นทางได้
- ใช้ URL หน้ามาตรฐานในรูปแบบ `https://clawhub.ai/<owner>/<slug>`
- อย่าสื่อว่า ClawHub รับรอง ยืนยัน หรือดำเนินการไซต์ของบุคคลที่สาม
- อย่ามิเรอร์เนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรองด้วยการข้ามตัวกรอง API สาธารณะหรือขอบเขตการยืนยันตัวตน

## การยืนยันตัวตน

- อ่านสาธารณะ: ไม่ต้องใช้โทเค็น
- เขียน + บัญชี: `Authorization: Bearer clh_...`

## ขีดจำกัดอัตรา

การบังคับใช้ที่รับรู้การยืนยันตัวตน:

- คำขอแบบไม่ระบุตัวตน: ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (โทเค็น Bearer ที่ถูกต้อง): ต่อบัคเก็ตผู้ใช้
- โทเค็นที่ขาดหาย/ไม่ถูกต้องจะย้อนกลับไปใช้การบังคับใช้ตาม IP

- อ่าน: 600/นาที ต่อ IP, 2400/นาที ต่อคีย์
- เขียน: 45/นาที ต่อ IP, 180/นาที ต่อคีย์

ส่วนหัว: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (เมื่อเป็น 429)

ความหมาย:

- `X-RateLimit-Reset`: วินาที Unix epoch (เวลารีเซ็ตแบบสัมบูรณ์)
- `RateLimit-Reset`: วินาทีที่ต้องหน่วงจนกว่าจะรีเซ็ต
- `Retry-After`: วินาทีที่ต้องรอเมื่อเจอ `429`

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

- เลือกใช้ `Retry-After` เมื่อมีอยู่
- มิฉะนั้นใช้ `RateLimit-Reset` หรือคำนวณเวลาหน่วงจาก `X-RateLimit-Reset`
- เพิ่ม jitter ให้การลองซ้ำ

## เอนด์พอยต์

อ่านสาธารณะ:

- `GET /api/v1/search?q=...`
  - ตัวกรองเสริม: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - นามแฝงเดิม: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (ค่าเริ่มต้น), `createdAt` (`newest`), `downloads`, `stars` (`rating`), `installsCurrent` (`installs`), `installsAllTime`, `trending`
  - `cursor` ใช้กับการเรียงลำดับที่ไม่ใช่ `trending`
  - ตัวกรองเสริม: `nonSuspiciousOnly=true`
  - นามแฝงเดิม: `nonSuspicious=true`
  - เมื่อใช้ `nonSuspiciousOnly=true` หน้าที่อิงเคอร์เซอร์อาจมีรายการน้อยกว่า `limit`; ใช้ `nextCursor` เพื่อดำเนินการต่อ
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

ผู้ดูแลระบบเท่านั้น:

- `POST /api/v1/users/reserve` สงวน root slugs และ private no-release package placeholders สำหรับ owner handle

## เดิม

Legacy `/api/*` และ `/api/cli/*` ยังพร้อมใช้งาน ดู `DEPRECATIONS.md`
