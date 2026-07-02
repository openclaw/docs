---
read_when:
    - การสร้างไคลเอนต์ API
    - การเพิ่ม endpoint หรือ schema
summary: ภาพรวมและข้อตกลงของ REST API สาธารณะ (v1).
x-i18n:
    generated_at: "2026-07-02T01:18:56Z"
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

## การใช้แค็ตตาล็อกสาธารณะซ้ำ

คุณสามารถสร้างแค็ตตาล็อก ไดเรกทอรี หรือพื้นผิวการค้นหาของบุคคลที่สามบน public read APIs ของ ClawHub ได้ เมทาดาทา Skills สาธารณะและไฟล์ Skills จะเผยแพร่ภายใต้กฎใบอนุญาต Skills ของ ClawHub ขณะที่ตัว API เองมีการจำกัดอัตราการใช้งานและควรถูกใช้อย่างรับผิดชอบ

แนวทาง:

- ใช้ปลายทางอ่านสาธารณะ เช่น `GET /api/v1/skills`, `GET /api/v1/search` และ `GET /api/v1/skills/{slug}` สำหรับรายการแค็ตตาล็อก
- แคชการตอบกลับและเคารพ `429`, `Retry-After` และเฮดเดอร์จำกัดอัตรา แทนการ polling อย่างถี่เกินไป
- ลิงก์กลับไปยัง URL Skills ของ ClawHub ที่เป็น canonical เมื่อแสดงรายการ เพื่อให้ผู้ใช้ตรวจสอบระเบียนรีจิสทรีต้นทางได้
- ใช้ URL หน้าที่เป็น canonical ในรูปแบบ `https://clawhub.ai/<owner>/skills/<slug>`
- อย่าสื่อว่า ClawHub รับรอง ยืนยัน หรือตั้งดำเนินการไซต์ของบุคคลที่สาม
- อย่ามิเรอร์เนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรองด้วยการข้ามตัวกรอง public API หรือขอบเขต auth

## Auth

- การอ่านสาธารณะ: ไม่ต้องใช้โทเค็น
- การเขียน + บัญชี: `Authorization: Bearer clh_...`

## ขีดจำกัดอัตรา

การบังคับใช้ที่รับรู้ Auth:

- คำขอแบบไม่ระบุชื่อ: ต่อ IP
- คำขอที่ผ่านการยืนยันตัวตน (Bearer token ที่ถูกต้อง): ต่อบัคเก็ตผู้ใช้
- โทเค็นที่ขาดหาย/ไม่ถูกต้องจะถอยกลับไปใช้การบังคับใช้ตาม IP

- อ่าน: 3000/นาที ต่อ IP, 12000/นาที ต่อคีย์
- เขียน: 300/นาที ต่อ IP, 3000/นาที ต่อคีย์
- ดาวน์โหลด: 1200/นาที ต่อ IP, 6000/นาที ต่อคีย์

เฮดเดอร์: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` และ `Retry-After` จะถูกรวมไว้ใน `429`

ความหมาย:

- `X-RateLimit-Reset`: วินาที Unix epoch (เวลาร reset แบบสัมบูรณ์)
- `RateLimit-Reset`: จำนวนวินาทีที่ต้องรอจนกว่าจะ reset
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: งบประมาณที่เหลืออยู่แบบแน่นอนเมื่อ
  มีอยู่; คำขอที่สำเร็จแบบ sharded จะละเว้นค่านี้แทนการคืนค่า global โดยประมาณ
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

การจัดการฝั่งไคลเอนต์:

- ให้ใช้ `Retry-After` เป็นหลักเมื่อมีอยู่
- มิฉะนั้นให้ใช้ `RateLimit-Reset` หรือคำนวณ delay จาก `X-RateLimit-Reset`
- เพิ่ม jitter ให้การลองซ้ำ

## ข้อผิดพลาด

- ข้อผิดพลาด v1 เป็นข้อความล้วน (`text/plain; charset=utf-8`) รวมถึง `400`,
  `401`, `403`, `404`, `429` และการตอบกลับดาวน์โหลดที่ถูกบล็อก
- พารามิเตอร์ query ที่ไม่รู้จักจะถูกละเว้นเพื่อความเข้ากันได้
- พารามิเตอร์ query ที่รู้จักแต่มีค่าไม่ถูกต้องจะคืน `400`

## ปลายทาง

การอ่านสาธารณะ:

- `GET /api/v1/search?q=...`
  - ตัวกรองเสริม: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - นามแฝงเดิม: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (ค่าเริ่มต้น), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), นามแฝงการติดตั้งเดิม `installsCurrent`/`installs`/`installsAllTime` แมปไปยัง `downloads`, `trending`
  - ค่า `sort` ที่ไม่ถูกต้องจะคืน `400`
  - `cursor` ใช้กับการจัดเรียงที่ไม่ใช่ `trending`
  - ตัวกรองเสริม: `nonSuspiciousOnly=true`
  - นามแฝงเดิม: `nonSuspicious=true`
  - เมื่อใช้ `nonSuspiciousOnly=true` หน้าที่อิงตาม cursor อาจมีรายการน้อยกว่า `limit`; ใช้ `nextCursor` เพื่อดำเนินต่อ
  - `recommended` ใช้สัญญาณการมีส่วนร่วมและความใหม่
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Skills ที่โฮสต์อยู่จะคืนไบต์ ZIP แบบกำหนดแน่นอน
  - Skills ปัจจุบันที่หนุนด้วย GitHub พร้อมการสแกน `clean` หรือ `suspicious` จะคืน
    descriptor การส่งต่อ JSON `public-github` แทนไบต์จาก ClawHub
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Skills ที่โฮสต์อยู่จะถูกส่งออกเป็นไฟล์ที่จัดเก็บไว้
  - Skills ปัจจุบันที่หนุนด้วย GitHub พร้อมการสแกน `clean` หรือ `suspicious` จะถูกส่งออก
    เป็น descriptor การส่งต่อ `public-github`
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (ค่าเริ่มต้น), `recommended`, `downloads`, นามแฝงเดิม `installs`
  - ค่า `sort` ที่ไม่ถูกต้องจะคืน `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (ค่าเริ่มต้น), `downloads`, `updated`, นามแฝงเดิม `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

ต้องใช้ Auth:

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

สำหรับ Admin เท่านั้น:

- `POST /api/v1/users/reserve` จอง root slugs และ placeholder แพ็กเกจส่วนตัวแบบไม่มี release สำหรับ handle ของเจ้าของ

## เดิม

Legacy `/api/*` และ `/api/cli/*` ยังคงใช้งานได้ ดู `DEPRECATIONS.md`
