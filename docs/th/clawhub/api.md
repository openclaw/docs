---
read_when:
    - การสร้างไคลเอนต์ API
    - การเพิ่มเอนด์พอยต์หรือสคีมา
summary: ภาพรวมและแนวปฏิบัติของ REST API สาธารณะ (v1).
x-i18n:
    generated_at: "2026-05-13T05:32:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: b47be9d71678924ec43f061a1013776695facc1ee8017397b07e24faa65fc154
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

ฐาน: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## การนำแค็ตตาล็อกสาธารณะกลับมาใช้

คุณสามารถสร้างแค็ตตาล็อก ไดเรกทอรี หรือพื้นที่ค้นหาของบุคคลที่สามบน API อ่านสาธารณะของ ClawHub ได้ ข้อมูลเมตาของ Skills สาธารณะและไฟล์ Skills เผยแพร่ภายใต้กฎสิทธิ์การใช้งาน Skills ของ ClawHub ส่วน API เองมีการจำกัดอัตราการใช้งานและควรใช้อย่างรับผิดชอบ

แนวทาง:

- ใช้ปลายทางอ่านสาธารณะ เช่น `GET /api/v1/skills`, `GET /api/v1/search` และ `GET /api/v1/skills/{slug}` สำหรับรายการแค็ตตาล็อก
- แคชการตอบกลับและเคารพ `429`, `Retry-After` และส่วนหัวการจำกัดอัตรา แทนการโพลอย่างรุนแรง
- ลิงก์กลับไปยัง URL Skills ของ ClawHub ที่เป็นต้นทางหลักเมื่อแสดงรายการ เพื่อให้ผู้ใช้ตรวจสอบระเบียนรีจิสทรีต้นทางได้
- ใช้ URL หน้าต้นทางหลักในรูปแบบ `https://clawhub.ai/<owner>/<slug>`
- อย่าบอกเป็นนัยว่า ClawHub รับรอง ตรวจสอบ หรือดำเนินการไซต์ของบุคคลที่สาม
- อย่ามิเรอร์เนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรอง ด้วยการข้ามตัวกรอง API สาธารณะหรือขอบเขตการตรวจสอบสิทธิ์

## การตรวจสอบสิทธิ์

- อ่านสาธารณะ: ไม่ต้องใช้โทเค็น
- เขียน + บัญชี: `Authorization: Bearer clh_...`

## การจำกัดอัตรา

การบังคับใช้ที่รับรู้การตรวจสอบสิทธิ์:

- คำขอแบบไม่ระบุตัวตน: ต่อ IP
- คำขอที่ตรวจสอบสิทธิ์แล้ว (โทเค็น Bearer ที่ถูกต้อง): ต่อบักเก็ตผู้ใช้
- โทเค็นที่ขาดหายไป/ไม่ถูกต้องจะถอยกลับไปใช้การบังคับใช้ตาม IP

- อ่าน: 600/นาที ต่อ IP, 2400/นาที ต่อคีย์
- เขียน: 45/นาที ต่อ IP, 180/นาที ต่อคีย์

ส่วนหัว: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (เมื่อเป็น 429)

ความหมาย:

- `X-RateLimit-Reset`: วินาที Unix epoch (เวลารีเซ็ตแบบสัมบูรณ์)
- `RateLimit-Reset`: จำนวนวินาทีที่หน่วงจนกว่าจะรีเซ็ต
- `Retry-After`: จำนวนวินาทีที่ต้องรอเมื่อได้รับ `429`

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

- ควรใช้ `Retry-After` เมื่อมี
- มิฉะนั้นให้ใช้ `RateLimit-Reset` หรือคำนวณเวลาหน่วงจาก `X-RateLimit-Reset`
- เพิ่ม jitter ให้การลองใหม่

## ปลายทาง

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
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

ต้องมีการตรวจสอบสิทธิ์:

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

สำหรับผู้ดูแลระบบเท่านั้น:

- `POST /api/v1/users/reserve` สำรอง slug รากและตัวยึดตำแหน่งแพ็กเกจส่วนตัวแบบไม่มีรีลีสสำหรับแฮนเดิลเจ้าของ

## เดิม

ยังมี `/api/*` และ `/api/cli/*` เดิมให้ใช้งานอยู่ ดู `DEPRECATIONS.md`
