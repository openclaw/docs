---
read_when:
    - การสร้างไคลเอนต์ API
    - การเพิ่มเอนด์พอยต์หรือสคีมา
summary: ภาพรวมและแนวทางปฏิบัติของ REST API สาธารณะ (v1).
x-i18n:
    generated_at: "2026-06-30T22:39:09Z"
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

## การใช้แคตตาล็อกสาธารณะซ้ำ

คุณสามารถสร้างแคตตาล็อก ไดเรกทอรี หรือพื้นผิวการค้นหาของบุคคลที่สามบน read API สาธารณะของ ClawHub ได้ เมตาดาต้า Skills สาธารณะและไฟล์ Skills เผยแพร่ภายใต้กฎสิทธิ์การใช้งาน Skills ของ ClawHub ส่วน API เองมีการจำกัดอัตราและควรใช้อย่างรับผิดชอบ

แนวทาง:

- ใช้ endpoint สำหรับอ่านแบบสาธารณะ เช่น `GET /api/v1/skills`, `GET /api/v1/search` และ `GET /api/v1/skills/{slug}` สำหรับรายการแคตตาล็อก
- แคชการตอบกลับและเคารพ `429`, `Retry-After` และ header จำกัดอัตรา แทนการ polling ถี่เกินไป
- ลิงก์กลับไปยัง URL Skills ของ ClawHub ที่เป็นต้นฉบับเมื่อแสดงรายการ เพื่อให้ผู้ใช้ตรวจสอบระเบียน registry ต้นทางได้
- ใช้ URL หน้าต้นฉบับในรูปแบบ `https://clawhub.ai/<owner>/skills/<slug>`
- อย่าสื่อว่า ClawHub รับรอง ตรวจสอบ หรือดำเนินงานเว็บไซต์บุคคลที่สาม
- อย่า mirror เนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรอง ด้วยการเลี่ยงตัวกรอง API สาธารณะหรือขอบเขตการยืนยันตัวตน

## การยืนยันตัวตน

- อ่านแบบสาธารณะ: ไม่ต้องใช้ token
- เขียน + บัญชี: `Authorization: Bearer clh_...`

## ขีดจำกัดอัตรา

การบังคับใช้ที่รับรู้การยืนยันตัวตน:

- คำขอแบบไม่ระบุตัวตน: ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (Bearer token ที่ถูกต้อง): ต่อ bucket ของผู้ใช้
- token ที่หายไป/ไม่ถูกต้องจะ fallback เป็นการบังคับใช้ตาม IP

- อ่าน: 3000/นาที ต่อ IP, 12000/นาที ต่อ key
- เขียน: 300/นาที ต่อ IP, 3000/นาที ต่อ key
- ดาวน์โหลด: 1200/นาที ต่อ IP, 6000/นาที ต่อ key

Header: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` และ `Retry-After` จะรวมอยู่ใน `429`

ความหมาย:

- `X-RateLimit-Reset`: วินาทีแบบ Unix epoch (เวลา reset แบบสัมบูรณ์)
- `RateLimit-Reset`: จำนวนวินาทีที่ต้องรอจนถึง reset
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: งบประมาณที่เหลือแบบแม่นยำเมื่อ
  มีอยู่; คำขอที่สำเร็จแบบแบ่ง shard จะละไว้แทนการส่งค่ารวมทั่วโลกแบบประมาณ
- `Retry-After`: จำนวนวินาทีที่ต้องรอเมื่อพบ `429`

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

- ควรใช้ `Retry-After` เมื่อมีอยู่
- มิฉะนั้นให้ใช้ `RateLimit-Reset` หรือคำนวณเวลาหน่วงจาก `X-RateLimit-Reset`
- เพิ่ม jitter ให้การลองใหม่

## ข้อผิดพลาด

- ข้อผิดพลาด v1 เป็นข้อความธรรมดา (`text/plain; charset=utf-8`) รวมถึง `400`,
  `401`, `403`, `404`, `429` และการตอบกลับดาวน์โหลดที่ถูกบล็อก
- พารามิเตอร์ query ที่ไม่รู้จักจะถูกละไว้เพื่อความเข้ากันได้
- พารามิเตอร์ query ที่รู้จักแต่มีค่าไม่ถูกต้องจะส่งกลับ `400`

## Endpoint

อ่านแบบสาธารณะ:

- `GET /api/v1/search?q=...`
  - ตัวกรองเสริม: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - alias เดิม: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (ค่าเริ่มต้น), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), alias การติดตั้งเดิม `installsCurrent`/`installs`/`installsAllTime` map ไปยัง `downloads`, `trending`
  - ค่า `sort` ที่ไม่ถูกต้องจะส่งกลับ `400`
  - `cursor` ใช้กับการเรียงลำดับที่ไม่ใช่ `trending`
  - ตัวกรองเสริม: `nonSuspiciousOnly=true`
  - alias เดิม: `nonSuspicious=true`
  - เมื่อใช้ `nonSuspiciousOnly=true` หน้าแบบ cursor อาจมีรายการน้อยกว่า `limit`; ใช้ `nextCursor` เพื่อดำเนินการต่อ
  - `recommended` ใช้สัญญาณการมีส่วนร่วมและความใหม่
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Skills ที่ host ไว้จะส่งคืน byte ของ ZIP แบบกำหนดซ้ำได้
  - Skills ปัจจุบันที่ backed by GitHub และมี scan เป็น `clean` หรือ `suspicious` จะส่งคืน
    descriptor การส่งต่อแบบ JSON `public-github` แทน byte จาก ClawHub
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Skills ที่ host ไว้จะถูก export เป็นไฟล์ที่จัดเก็บไว้
  - Skills ปัจจุบันที่ backed by GitHub และมี scan เป็น `clean` หรือ `suspicious` จะถูก export
    เป็น descriptor การส่งต่อ `public-github`
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (ค่าเริ่มต้น), `recommended`, `downloads`, alias เดิม `installs`
  - ค่า `sort` ที่ไม่ถูกต้องจะส่งกลับ `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (ค่าเริ่มต้น), `downloads`, `updated`, alias เดิม `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
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
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

เฉพาะผู้ดูแลระบบ:

- `POST /api/v1/users/reserve` จอง slug ระดับ root และ placeholder แพ็กเกจส่วนตัวแบบไม่มี release สำหรับ owner handle

## ระบบเดิม

Legacy `/api/*` และ `/api/cli/*` ยังคงใช้งานได้ ดู `DEPRECATIONS.md`
