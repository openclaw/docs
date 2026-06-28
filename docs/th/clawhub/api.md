---
read_when:
    - การสร้างไคลเอนต์ API
    - การเพิ่มเอนด์พอยต์หรือสคีมา
summary: ภาพรวมและรูปแบบการใช้งานของ Public REST API (v1)
x-i18n:
    generated_at: "2026-06-28T05:07:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# เอพีไอ v1

ฐาน: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## การนำแคตตาล็อกสาธารณะกลับมาใช้

คุณสามารถสร้างแคตตาล็อก ไดเรกทอรี หรือพื้นผิวการค้นหาของบุคคลที่สามบน API อ่านสาธารณะของ ClawHub ได้ เมทาดาทา Skill สาธารณะและไฟล์ Skill จะเผยแพร่ภายใต้กฎสิทธิ์การใช้งาน Skill ของ ClawHub ขณะที่ตัว API เองมีการจำกัดอัตราและควรถูกใช้อย่างรับผิดชอบ

แนวทาง:

- ใช้จุดปลายทางอ่านสาธารณะ เช่น `GET /api/v1/skills`, `GET /api/v1/search` และ `GET /api/v1/skills/{slug}` สำหรับรายการแคตตาล็อก
- แคชการตอบกลับและเคารพ `429`, `Retry-After` และส่วนหัวจำกัดอัตรา แทนการโพลอย่างถี่เกินไป
- ลิงก์กลับไปยัง URL Skill ของ ClawHub ที่เป็นต้นฉบับเมื่อแสดงรายการ เพื่อให้ผู้ใช้ตรวจสอบระเบียนรีจิสทรีต้นทางได้
- ใช้ URL หน้ามาตรฐานในรูปแบบ `https://clawhub.ai/<owner>/skills/<slug>`
- อย่าสื่อว่า ClawHub รับรอง ตรวจสอบ หรือดำเนินการเว็บไซต์บุคคลที่สามนั้น
- อย่ามิเรอร์เนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรอง ด้วยการข้ามตัวกรอง API สาธารณะหรือขอบเขตการยืนยันตัวตน

## การยืนยันตัวตน

- อ่านสาธารณะ: ไม่ต้องใช้โทเค็น
- เขียน + บัญชี: `Authorization: Bearer clh_...`

## ขีดจำกัดอัตรา

การบังคับใช้ที่รับรู้การยืนยันตัวตน:

- คำขอไม่ระบุตัวตน: ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (โทเค็น Bearer ที่ถูกต้อง): ต่อบักเก็ตผู้ใช้
- โทเค็นที่ขาดหายหรือไม่ถูกต้องจะย้อนกลับไปใช้การบังคับใช้ตาม IP

- อ่าน: 3000/นาที ต่อ IP, 12000/นาที ต่อคีย์
- เขียน: 300/นาที ต่อ IP, 3000/นาที ต่อคีย์
- ดาวน์โหลด: 1200/นาที ต่อ IP, 6000/นาที ต่อคีย์

ส่วนหัว: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` และ `Retry-After` จะรวมอยู่ใน `429`

ความหมาย:

- `X-RateLimit-Reset`: วินาที Unix epoch (เวลารีเซ็ตแบบสัมบูรณ์)
- `RateLimit-Reset`: วินาทีที่ต้องหน่วงจนกว่าจะรีเซ็ต
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: งบประมาณที่เหลืออย่างแม่นยำเมื่อมีอยู่; คำขอสำเร็จแบบแบ่งชาร์ดจะละไว้แทนการส่งคืนค่าทั่วโลกแบบประมาณ
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

การจัดการของไคลเอนต์:

- ใช้ `Retry-After` ก่อนเมื่อมีอยู่
- มิฉะนั้นใช้ `RateLimit-Reset` หรือคำนวณเวลาหน่วงจาก `X-RateLimit-Reset`
- เพิ่ม jitter ในการลองใหม่

## ข้อผิดพลาด

- ข้อผิดพลาด v1 เป็นข้อความธรรมดา (`text/plain; charset=utf-8`) รวมถึง `400`,
  `401`, `403`, `404`, `429` และการตอบกลับดาวน์โหลดที่ถูกบล็อก
- พารามิเตอร์คิวรีที่ไม่รู้จักจะถูกละเว้นเพื่อความเข้ากันได้
- พารามิเตอร์คิวรีที่รู้จักแต่มีค่าไม่ถูกต้องจะส่งคืน `400`

## จุดปลายทาง

อ่านสาธารณะ:

- `GET /api/v1/search?q=...`
  - ตัวกรองทางเลือก: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - นามแฝงเดิม: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (ค่าเริ่มต้น), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), นามแฝงการติดตั้งเดิม `installsCurrent`/`installs`/`installsAllTime` จะแมปไปยัง `downloads`, `trending`
  - ค่า `sort` ที่ไม่ถูกต้องจะส่งคืน `400`
  - `cursor` ใช้กับการจัดเรียงที่ไม่ใช่ `trending`
  - ตัวกรองทางเลือก: `nonSuspiciousOnly=true`
  - นามแฝงเดิม: `nonSuspicious=true`
  - เมื่อใช้ `nonSuspiciousOnly=true` หน้าที่อิง `cursor` อาจมีรายการน้อยกว่า `limit`; ใช้ `nextCursor` เพื่อดำเนินการต่อ
  - `recommended` ใช้สัญญาณการมีส่วนร่วมและความใหม่
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Skill ที่โฮสต์ไว้จะส่งคืนไบต์ ZIP แบบกำหนดแน่นอน
  - Skill ปัจจุบันที่อิง GitHub ซึ่งมีการสแกน `clean` หรือ `suspicious` จะส่งคืนตัวบอกการส่งต่อ JSON `public-github` แทนไบต์จาก ClawHub
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Skill ที่โฮสต์ไว้จะถูกส่งออกเป็นไฟล์ที่จัดเก็บไว้
  - Skill ปัจจุบันที่อิง GitHub ซึ่งมีการสแกน `clean` หรือ `suspicious` จะถูกส่งออกเป็นตัวบอกการส่งต่อ `public-github`
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (ค่าเริ่มต้น), `recommended`, `downloads`, นามแฝงเดิม `installs`
  - ค่า `sort` ที่ไม่ถูกต้องจะส่งคืน `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (ค่าเริ่มต้น), `downloads`, `updated`, นามแฝงเดิม `installs`
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

- `POST /api/v1/users/reserve` สำรอง slug ระดับรากและตัวแทนแพ็กเกจส่วนตัวแบบไม่มีรีลีสสำหรับแฮนเดิลเจ้าของ

## เดิม

`/api/*` และ `/api/cli/*` เดิมยังใช้งานได้ ดู `DEPRECATIONS.md`
