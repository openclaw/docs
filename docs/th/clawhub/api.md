---
read_when:
    - การสร้างไคลเอนต์ API
    - การเพิ่มปลายทางหรือสคีมา
summary: ภาพรวมและธรรมเนียมปฏิบัติของ REST API สาธารณะ (v1)
x-i18n:
    generated_at: "2026-07-02T22:52:39Z"
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

## การนำแคตตาล็อกสาธารณะกลับมาใช้

คุณสามารถสร้างแคตตาล็อก ไดเรกทอรี หรือพื้นผิวการค้นหาของบุคคลที่สามบน public read APIs ของ ClawHub ได้ เมทาดาทา Skills สาธารณะและไฟล์ Skills เผยแพร่ภายใต้กฎสิทธิ์การใช้งาน Skills ของ ClawHub ส่วน API เองมีการจำกัดอัตราการใช้งานและควรใช้อย่างรับผิดชอบ

แนวทาง:

- ใช้ endpoint สำหรับอ่านแบบสาธารณะ เช่น `GET /api/v1/skills`, `GET /api/v1/search` และ `GET /api/v1/skills/{slug}` สำหรับรายการแคตตาล็อก
- แคช response และเคารพ `429`, `Retry-After` และ header การจำกัดอัตรา แทนการ polling อย่างถี่เกินไป
- ลิงก์กลับไปยัง URL Skills ของ ClawHub ที่เป็น canonical เมื่อแสดงรายการ เพื่อให้ผู้ใช้ตรวจสอบระเบียน registry ต้นทางได้
- ใช้ URL หน้า canonical ในรูปแบบ `https://clawhub.ai/<owner>/skills/<slug>`
- อย่าสื่อว่า ClawHub รับรอง ตรวจสอบ หรือดำเนินงานไซต์ของบุคคลที่สาม
- อย่าทำสำเนาเนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดย moderation ด้วยการข้ามตัวกรอง API สาธารณะหรือขอบเขต auth

## Auth

- การอ่านสาธารณะ: ไม่ต้องใช้ token
- การเขียน + บัญชี: `Authorization: Bearer clh_...`

## การจำกัดอัตรา

การบังคับใช้ที่รับรู้ Auth:

- คำขอแบบไม่ระบุตัวตน: ต่อ IP
- คำขอที่ผ่านการยืนยันตัวตน (Bearer token ที่ถูกต้อง): ต่อ bucket ผู้ใช้
- token ที่ขาดหาย/ไม่ถูกต้องจะถอยกลับไปใช้การบังคับใช้ตาม IP

- อ่าน: 3000/นาที ต่อ IP, 12000/นาที ต่อ key
- เขียน: 300/นาที ต่อ IP, 3000/นาที ต่อ key
- ดาวน์โหลด: 1200/นาที ต่อ IP, 6000/นาที ต่อ key

Headers: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` และ `Retry-After` จะรวมอยู่ใน `429`

ความหมาย:

- `X-RateLimit-Reset`: วินาทีของ Unix epoch (เวลา reset แบบสัมบูรณ์)
- `RateLimit-Reset`: จำนวนวินาทีที่หน่วงจนถึง reset
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: งบประมาณที่เหลืออย่างแม่นยำเมื่อ
  มีอยู่; คำขอที่สำเร็จแบบ sharded จะละไว้แทนการคืนค่า global
  โดยประมาณ
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

การจัดการของ client:

- ควรใช้ `Retry-After` เมื่อมีอยู่
- มิฉะนั้นให้ใช้ `RateLimit-Reset` หรือคำนวณ delay จาก `X-RateLimit-Reset`
- เพิ่ม jitter ให้กับการ retry

## ข้อผิดพลาด

- ข้อผิดพลาด v1 เป็น plain text (`text/plain; charset=utf-8`) รวมถึง `400`,
  `401`, `403`, `404`, `429` และ response ของการดาวน์โหลดที่ถูกบล็อก
- query parameter ที่ไม่รู้จักจะถูกละเว้นเพื่อความเข้ากันได้
- query parameter ที่รู้จักแต่มีค่าที่ไม่ถูกต้องจะคืน `400`

## Endpoints

การอ่านสาธารณะ:

- `GET /api/v1/search?q=...`
  - ตัวกรองแบบไม่บังคับ: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - alias legacy: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (ค่าเริ่มต้น), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), alias การติดตั้ง legacy `installsCurrent`/`installs`/`installsAllTime` map ไปยัง `downloads`, `trending`
  - ค่า `sort` ที่ไม่ถูกต้องจะคืน `400`
  - `cursor` ใช้กับ sort ที่ไม่ใช่ `trending`
  - ตัวกรองแบบไม่บังคับ: `nonSuspiciousOnly=true`
  - alias legacy: `nonSuspicious=true`
  - เมื่อใช้ `nonSuspiciousOnly=true` หน้าแบบอิง `cursor` อาจมีรายการน้อยกว่า `limit`; ใช้ `nextCursor` เพื่อดำเนินการต่อ
  - `recommended` ใช้สัญญาณ engagement และความใหม่
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Skills ที่ host อยู่จะคืน ZIP bytes แบบ deterministic
  - Skills ปัจจุบันที่ backed โดย GitHub พร้อม scan แบบ `clean` หรือ `suspicious` จะคืน
    descriptor ส่งต่อ JSON `public-github` แทน bytes ของ ClawHub
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Skills ที่ host อยู่จะถูก export เป็นไฟล์ที่จัดเก็บไว้
  - Skills ปัจจุบันที่ backed โดย GitHub พร้อม scan แบบ `clean` หรือ `suspicious` จะถูก export
    เป็น descriptor ส่งต่อ `public-github`
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (ค่าเริ่มต้น), `recommended`, `downloads`, alias legacy `installs`
  - ค่า `sort` ที่ไม่ถูกต้องจะคืน `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (ค่าเริ่มต้น), `downloads`, `updated`, alias legacy `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

ต้องใช้ Auth:

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
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

เฉพาะผู้ดูแลระบบ:

- `POST /api/v1/users/reserve` สงวน root slugs และ placeholder แพ็กเกจ private no-release สำหรับ owner handle

## Legacy

Legacy `/api/*` และ `/api/cli/*` ยังคงใช้ได้ ดู `DEPRECATIONS.md`
