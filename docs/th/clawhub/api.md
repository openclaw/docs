---
read_when:
    - การสร้างไคลเอนต์ API
    - การเพิ่มเอนด์พอยต์หรือสคีมา
summary: ภาพรวมและแบบแผนของ REST API สาธารณะ (v1)
x-i18n:
    generated_at: "2026-05-12T23:28:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b6bb020fec1f8aca039dab4d1a09f7a42c64158ad48bf061ce5dbda819d1987
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

ฐาน: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## การนำแค็ตตาล็อกสาธารณะมาใช้ซ้ำ

คุณสามารถสร้างแค็ตตาล็อก ไดเรกทอรี หรือพื้นผิวการค้นหาของบุคคลที่สามบน API อ่านข้อมูลสาธารณะของ ClawHub ได้ เมทาดาทาของสกิลสาธารณะและไฟล์สกิลเผยแพร่ภายใต้กฎใบอนุญาตสกิลของ ClawHub ขณะที่ตัว API เองมีการจำกัดอัตราและควรใช้งานอย่างรับผิดชอบ

แนวทาง:

- ใช้ endpoint อ่านข้อมูลสาธารณะ เช่น `GET /api/v1/skills`, `GET /api/v1/search` และ `GET /api/v1/skills/{slug}` สำหรับรายการแค็ตตาล็อก
- แคชการตอบกลับและเคารพ `429`, `Retry-After` และ header จำกัดอัตรา แทนการ polling อย่างถี่เกินไป
- ลิงก์กลับไปยัง URL สกิล ClawHub แบบ canonical เมื่อแสดงรายการ เพื่อให้ผู้ใช้ตรวจสอบระเบียน registry ต้นทางได้
- ใช้ URL หน้ารูปแบบ canonical ในรูปแบบ `https://clawhub.ai/<owner>/<slug>`
- อย่าสื่อว่า ClawHub รับรอง ตรวจสอบ หรือดำเนินงานไซต์ของบุคคลที่สาม
- อย่าทำสำเนาเนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการดูแลเนื้อหา ด้วยการข้ามตัวกรอง API สาธารณะหรือขอบเขตการยืนยันตัวตน

## การยืนยันตัวตน

- อ่านข้อมูลสาธารณะ: ไม่ต้องใช้ token
- เขียน + บัญชี: `Authorization: Bearer clh_...`

## การจำกัดอัตรา

การบังคับใช้ที่รับรู้การยืนยันตัวตน:

- คำขอไม่ระบุตัวตน: ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (Bearer token ที่ถูกต้อง): ต่อ bucket ผู้ใช้
- token ที่หายไป/ไม่ถูกต้องจะถอยกลับไปใช้การบังคับใช้ตาม IP

- อ่าน: 600/นาที ต่อ IP, 2400/นาที ต่อ key
- เขียน: 45/นาที ต่อ IP, 180/นาที ต่อ key

Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (เมื่อเป็น 429)

ความหมาย:

- `X-RateLimit-Reset`: วินาที Unix epoch (เวลา reset แบบสัมบูรณ์)
- `RateLimit-Reset`: จำนวนวินาทีที่หน่วงจนถึง reset
- `Retry-After`: จำนวนวินาทีที่ต้องรอเมื่อเกิด `429`

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

การจัดการฝั่ง client:

- เลือกใช้ `Retry-After` เมื่อมี
- มิฉะนั้นให้ใช้ `RateLimit-Reset` หรือคำนวณเวลาหน่วงจาก `X-RateLimit-Reset`
- เพิ่ม jitter ให้กับการ retry

## Endpoints

อ่านข้อมูลสาธารณะ:

- `GET /api/v1/search?q=...`
  - ตัวกรองแบบไม่บังคับ: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - alias เดิม: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (ค่าเริ่มต้น), `createdAt` (`newest`), `downloads`, `stars` (`rating`), `installsCurrent` (`installs`), `installsAllTime`, `trending`
  - `cursor` ใช้กับการเรียงลำดับที่ไม่ใช่ `trending`
  - ตัวกรองแบบไม่บังคับ: `nonSuspiciousOnly=true`
  - alias เดิม: `nonSuspicious=true`
  - เมื่อใช้ `nonSuspiciousOnly=true` หน้าที่อิง `cursor` อาจมีรายการน้อยกว่า `limit`; ใช้ `nextCursor` เพื่อดำเนินการต่อ
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

- `POST /api/v1/skills` (publish, แนะนำ multipart)
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

เฉพาะผู้ดูแลระบบ:

- `POST /api/v1/users/reserve` จอง root slugs และ private no-release package placeholders สำหรับ owner handle

## เดิม

Legacy `/api/*` และ `/api/cli/*` ยังใช้งานได้ ดู `DEPRECATIONS.md`
