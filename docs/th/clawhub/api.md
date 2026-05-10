---
read_when:
    - การสร้างไคลเอนต์ API
    - การเพิ่มเอนด์พอยต์หรือสคีมา
summary: ภาพรวมและแนวปฏิบัติของ REST API สาธารณะ (v1).
x-i18n:
    generated_at: "2026-05-10T19:25:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca750027e4077f907a5590e4e28bde896c1f74b65a9ca39a79274b97e5de6148
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

ฐาน: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## การนำแค็ตตาล็อกสาธารณะกลับมาใช้ซ้ำ

คุณสามารถสร้างแค็ตตาล็อก ไดเรกทอรี หรือพื้นผิวการค้นหาของบุคคลที่สามบน API สำหรับอ่านแบบสาธารณะของ ClawHub ได้ ข้อมูลเมตา Skills สาธารณะและไฟล์ Skills เผยแพร่ภายใต้กฎสิทธิ์ใช้งาน Skills ของ ClawHub ขณะที่ตัว API เองมีการจำกัดอัตราการใช้งานและควรเรียกใช้อย่างรับผิดชอบ

แนวทาง:

- ใช้ endpoint สำหรับอ่านแบบสาธารณะ เช่น `GET /api/v1/skills`, `GET /api/v1/search` และ `GET /api/v1/skills/{slug}` สำหรับรายการแค็ตตาล็อก
- แคชคำตอบและเคารพ `429`, `Retry-After` และ header จำกัดอัตราแทนการ polling อย่างถี่เกินไป
- ลิงก์กลับไปยัง URL Skills ของ ClawHub ที่เป็นต้นฉบับเมื่อแสดงรายการ เพื่อให้ผู้ใช้ตรวจสอบระเบียน registry ต้นทางได้
- ใช้ URL หน้าตามรูปแบบมาตรฐาน `https://clawhub.ai/<owner>/<slug>`
- อย่าสื่อว่า ClawHub รับรอง ตรวจสอบ หรือดำเนินการไซต์ของบุคคลที่สาม
- อย่าทำ mirror เนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรองด้วยการข้ามตัวกรอง API สาธารณะหรือขอบเขต auth

## การยืนยันตัวตน

- การอ่านแบบสาธารณะ: ไม่ต้องใช้ token
- การเขียน + บัญชี: `Authorization: Bearer clh_...`

## การจำกัดอัตรา

การบังคับใช้ที่รับรู้ auth:

- คำขอแบบไม่ระบุตัวตน: ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (Bearer token ที่ถูกต้อง): ต่อ bucket ของผู้ใช้
- token ที่ขาดหายหรือไม่ถูกต้องจะ fallback ไปใช้การบังคับใช้ตาม IP

- อ่าน: 600/นาที ต่อ IP, 2400/นาที ต่อ key
- เขียน: 45/นาที ต่อ IP, 180/นาที ต่อ key

Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (บน 429)

ความหมาย:

- `X-RateLimit-Reset`: วินาที Unix epoch (เวลา reset แบบสัมบูรณ์)
- `RateLimit-Reset`: จำนวนวินาทีที่หน่วงจนกว่าจะ reset
- `Retry-After`: จำนวนวินาทีที่ต้องรอบน `429`

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

- ให้ใช้ `Retry-After` ก่อนเมื่อมีอยู่
- มิฉะนั้นให้ใช้ `RateLimit-Reset` หรือคำนวณเวลาหน่วงจาก `X-RateLimit-Reset`
- เพิ่ม jitter ให้การ retry

## Endpoints

การอ่านแบบสาธารณะ:

- `GET /api/v1/search?q=...`
  - ตัวกรองเสริม: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - alias เดิม: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (ค่าเริ่มต้น), `createdAt` (`newest`), `downloads`, `stars` (`rating`), `installsCurrent` (`installs`), `installsAllTime`, `trending`
  - `cursor` ใช้กับการเรียงลำดับที่ไม่ใช่ `trending`
  - ตัวกรองเสริม: `nonSuspiciousOnly=true`
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
- `POST /api/v1/skills/{slug}/rename`
- `POST /api/v1/skills/{slug}/merge`
- `POST /api/v1/skills/{slug}/transfer`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

เฉพาะผู้ดูแลระบบ:

- `POST /api/v1/users/reserve` จอง root slug และ placeholder แพ็กเกจส่วนตัวที่ไม่มี release สำหรับ handle เจ้าของ

## Legacy

Legacy `/api/*` และ `/api/cli/*` ยังคงใช้งานได้ ดู `DEPRECATIONS.md`
