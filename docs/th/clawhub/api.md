---
read_when:
    - การสร้างไคลเอนต์ API
    - การเพิ่มเอนด์พอยต์หรือสคีมา
summary: ภาพรวมและข้อกำหนดของ REST API สาธารณะ (v1)
x-i18n:
    generated_at: "2026-07-04T20:46:05Z"
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

## การนำแค็ตตาล็อกสาธารณะมาใช้ซ้ำ

คุณสามารถสร้างแค็ตตาล็อก ไดเรกทอรี หรือพื้นผิวการค้นหาของบุคคลที่สามบน API อ่านแบบสาธารณะของ ClawHub ได้ เมตาดาต้า Skills สาธารณะและไฟล์ Skills ถูกเผยแพร่ภายใต้กฎใบอนุญาต Skills ของ ClawHub ขณะที่ตัว API เองมีการจำกัดอัตราและควรถูกใช้อย่างรับผิดชอบ

แนวทาง:

- ใช้ endpoint อ่านแบบสาธารณะ เช่น `GET /api/v1/skills`, `GET /api/v1/search` และ `GET /api/v1/skills/{slug}` สำหรับรายการแค็ตตาล็อก
- แคชการตอบกลับและเคารพ `429`, `Retry-After` และส่วนหัวการจำกัดอัตรา แทนการ polling อย่างถี่เกินไป
- ลิงก์กลับไปยัง URL Skills ตามรูปแบบบัญญัติของ ClawHub เมื่อแสดงรายการ เพื่อให้ผู้ใช้ตรวจสอบเรคอร์ดรีจิสทรีต้นทางได้
- ใช้ URL หน้าตามรูปแบบบัญญัติในรูปแบบ `https://clawhub.ai/<owner>/skills/<slug>`
- อย่าสื่อว่า ClawHub รับรอง ตรวจยืนยัน หรือดำเนินงานไซต์ของบุคคลที่สาม
- อย่ามิเรอร์เนื้อหาที่ซ่อน เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรอง ด้วยการข้ามตัวกรอง API สาธารณะหรือขอบเขตการยืนยันตัวตน

## การยืนยันตัวตน

- อ่านแบบสาธารณะ: ไม่ต้องใช้โทเค็น
- เขียน + บัญชี: `Authorization: Bearer clh_...`

## การจำกัดอัตรา

การบังคับใช้ที่รับรู้การยืนยันตัวตน:

- คำขอแบบไม่ระบุตัวตน: ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (โทเค็น Bearer ที่ถูกต้อง): ต่อ bucket ผู้ใช้
- โทเค็นที่ขาดหาย/ไม่ถูกต้องจะถอยกลับไปใช้การบังคับใช้ตาม IP

- อ่าน: 3000/นาที ต่อ IP, 12000/นาที ต่อ key
- เขียน: 300/นาที ต่อ IP, 3000/นาที ต่อ key
- ดาวน์โหลด: 1200/นาที ต่อ IP, 6000/นาที ต่อ key

ส่วนหัว: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` และ `Retry-After` จะถูกรวมไว้ใน `429`

ความหมาย:

- `X-RateLimit-Reset`: วินาทีแบบ Unix epoch (เวลารีเซ็ตแบบสัมบูรณ์)
- `RateLimit-Reset`: วินาทีที่หน่วงจนกว่าจะรีเซ็ต
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: งบประมาณที่เหลือแบบแน่นอนเมื่อ
  มีอยู่; คำขอที่สำเร็จแบบแบ่ง shard จะละไว้แทนการส่งคืนค่า
  global โดยประมาณ
- `Retry-After`: วินาทีที่ต้องรอก่อน retry เมื่อเจอ `429`

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
- เพิ่ม jitter ให้กับการ retry

## ข้อผิดพลาด

- ข้อผิดพลาด v1 เป็นข้อความธรรมดา (`text/plain; charset=utf-8`) รวมถึง `400`,
  `401`, `403`, `404`, `429` และการตอบกลับดาวน์โหลดที่ถูกบล็อก
- พารามิเตอร์ query ที่ไม่รู้จักจะถูกละไว้เพื่อความเข้ากันได้
- พารามิเตอร์ query ที่รู้จักแต่มีค่าไม่ถูกต้องจะส่งคืน `400`

## Endpoint

อ่านแบบสาธารณะ:

- `GET /api/v1/search?q=...`
  - ตัวกรองเสริม: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - alias ดั้งเดิม: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (ค่าเริ่มต้น), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), alias การติดตั้งดั้งเดิม `installsCurrent`/`installs`/`installsAllTime` map ไปยัง `downloads`, `trending`
  - ค่า `sort` ที่ไม่ถูกต้องจะส่งคืน `400`
  - `cursor` ใช้กับการ sort ที่ไม่ใช่ `trending`
  - ตัวกรองเสริม: `nonSuspiciousOnly=true`
  - alias ดั้งเดิม: `nonSuspicious=true`
  - เมื่อใช้ `nonSuspiciousOnly=true` หน้าแบบอิง cursor อาจมีรายการน้อยกว่า `limit`; ใช้ `nextCursor` เพื่อดำเนินการต่อ
  - `recommended` ใช้สัญญาณ engagement และความใหม่
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Skills ที่โฮสต์จะส่งคืน byte ของ ZIP แบบกำหนดแน่นอน
  - Skills ปัจจุบันที่มี GitHub เป็น backend พร้อม scan แบบ `clean` หรือ `suspicious` จะส่งคืน
    descriptor ส่งต่อ JSON `public-github` แทน byte จาก ClawHub
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Skills ที่โฮสต์จะถูก export เป็นไฟล์ที่จัดเก็บไว้
  - Skills ปัจจุบันที่มี GitHub เป็น backend พร้อม scan แบบ `clean` หรือ `suspicious` จะถูก export
    เป็น descriptor ส่งต่อ `public-github`
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (ค่าเริ่มต้น), `recommended`, `downloads`, alias ดั้งเดิม `installs`
  - ค่า `sort` ที่ไม่ถูกต้องจะส่งคืน `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (ค่าเริ่มต้น), `downloads`, `updated`, alias ดั้งเดิม `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
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
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

ผู้ดูแลระบบเท่านั้น:

- `POST /api/v1/users/reserve` สำรอง root slug และ placeholder แพ็กเกจส่วนตัวแบบไม่มี release สำหรับ handle เจ้าของ

## ดั้งเดิม

Legacy `/api/*` และ `/api/cli/*` ยังพร้อมใช้งาน ดู `DEPRECATIONS.md`
