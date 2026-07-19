---
read_when:
    - การสร้างไคลเอนต์ API
    - การเพิ่มเอนด์พอยต์หรือสคีมา
summary: ภาพรวมและข้อตกลงของ REST API สาธารณะ (v1)
x-i18n:
    generated_at: "2026-07-19T07:09:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

ฐาน: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## การนำแค็ตตาล็อกสาธารณะมาใช้ซ้ำ

คุณสามารถสร้างแค็ตตาล็อก ไดเรกทอรี หรือส่วนติดต่อการค้นหาของบุคคลที่สามบน API สำหรับอ่านแบบสาธารณะของ ClawHub ได้ ข้อมูลเมตาและไฟล์ของ Skills สาธารณะเผยแพร่ภายใต้กฎใบอนุญาต Skills ของ ClawHub ขณะที่ตัว API มีการจำกัดอัตราการเรียกใช้และควรใช้งานอย่างรับผิดชอบ

แนวทาง:

- ใช้ปลายทางสำหรับอ่านแบบสาธารณะ เช่น `GET /api/v1/skills`, `GET /api/v1/search` และ `GET /api/v1/skills/{slug}` สำหรับรายการแค็ตตาล็อก
- แคชการตอบกลับและปฏิบัติตาม `429`, `Retry-After` และส่วนหัวการจำกัดอัตรา แทนการสำรวจซ้ำถี่เกินไป
- เมื่อนำเสนอรายการ ให้ลิงก์กลับไปยัง URL ของ Skills บน ClawHub ที่เป็นแหล่งอ้างอิงหลัก เพื่อให้ผู้ใช้ตรวจสอบระเบียนรีจิสทรีต้นทางได้
- ใช้ URL ของหน้าที่เป็นแหล่งอ้างอิงหลักในรูปแบบ `https://clawhub.ai/<owner>/skills/<slug>`
- อย่าสื่อว่า ClawHub รับรอง ตรวจสอบ หรือดำเนินงานเว็บไซต์ของบุคคลที่สาม
- อย่าทำสำเนาเนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกระงับโดยการกลั่นกรอง ด้วยการข้ามตัวกรอง API สาธารณะหรือขอบเขตการยืนยันตัวตน

## การยืนยันตัวตน

- การอ่านแบบสาธารณะ: ไม่ต้องใช้โทเค็น
- การเขียนและบัญชี: `Authorization: Bearer clh_...`

## การจำกัดอัตรา

การบังคับใช้โดยคำนึงถึงการยืนยันตัวตน:

- คำขอแบบไม่ระบุตัวตน: ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (โทเค็น Bearer ที่ถูกต้อง): ต่อบักเก็ตของผู้ใช้
- โทเค็นที่ขาดหายไปหรือไม่ถูกต้องจะกลับไปใช้การบังคับใช้ตาม IP

- อ่าน: 3000/นาทีต่อ IP, 12000/นาทีต่อคีย์
- เขียน: 300/นาทีต่อ IP, 3000/นาทีต่อคีย์
- ดาวน์โหลด: 1200/นาทีต่อ IP, 6000/นาทีต่อคีย์

ส่วนหัว: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` และ `Retry-After` จะรวมอยู่ในการตอบกลับ `429`

ความหมาย:

- `X-RateLimit-Reset`: วินาทีของ Unix epoch (เวลารีเซ็ตแบบสัมบูรณ์)
- `RateLimit-Reset`: จำนวนวินาทีที่หน่วงไว้จนกว่าจะรีเซ็ต
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: งบประมาณที่เหลืออย่างแม่นยำเมื่อ
  มีค่าอยู่ คำขอที่สำเร็จและกระจายเป็นชาร์ดจะละเว้นค่านี้แทนการส่งคืนค่า
  ส่วนกลางโดยประมาณ
- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่เมื่อได้รับ `429`

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

- เลือกใช้ `Retry-After` ก่อนเมื่อมีค่า
- มิฉะนั้นให้ใช้ `RateLimit-Reset` หรือคำนวณระยะหน่วงจาก `X-RateLimit-Reset`
- เพิ่ม jitter ในการลองใหม่

## ข้อผิดพลาด

- ข้อผิดพลาดของ v1 เป็นข้อความธรรมดา (`text/plain; charset=utf-8`) รวมถึง `400`,
  `401`, `403`, `404`, `429` และการตอบกลับเมื่อการดาวน์โหลดถูกระงับ
- พารามิเตอร์คำค้นหาที่ไม่รู้จักจะถูกละเว้นเพื่อความเข้ากันได้
- พารามิเตอร์คำค้นหาที่รู้จักแต่มีค่าไม่ถูกต้องจะส่งคืน `400`

## ปลายทาง

การอ่านแบบสาธารณะ:

- `GET /api/v1/search?q=...`
  - ตัวกรองที่ไม่บังคับ: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - นามแฝงแบบเดิม: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (ค่าเริ่มต้น), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), นามแฝงการติดตั้งแบบเดิม `installsCurrent`/`installs`/`installsAllTime` จะแมปไปยัง `downloads`, `trending`
  - ค่า `sort` ที่ไม่ถูกต้องจะส่งคืน `400`
  - `cursor` ใช้กับการจัดเรียงที่ไม่ใช่ `trending`
  - ตัวกรองที่ไม่บังคับ: `nonSuspiciousOnly=true`
  - นามแฝงแบบเดิม: `nonSuspicious=true`
  - เมื่อใช้ `nonSuspiciousOnly=true` หน้าที่อิงเคอร์เซอร์อาจมีรายการน้อยกว่า `limit` รายการ ให้ใช้ `nextCursor` เพื่อดำเนินการต่อ
  - `recommended` ใช้สัญญาณการมีส่วนร่วมและความใหม่
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Skills ที่โฮสต์ไว้จะส่งคืนไบต์ ZIP ที่กำหนดผลลัพธ์ได้แน่นอน
  - Skills ปัจจุบันที่ใช้ GitHub เป็นแบ็กเอนด์และมีการสแกน `clean` หรือ `suspicious` จะส่งคืน
    ตัวอธิบายการส่งต่อ `public-github` แบบ JSON แทนไบต์จาก ClawHub
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Skills ที่โฮสต์ไว้จะถูกส่งออกเป็นไฟล์ตามที่จัดเก็บ
  - Skills ปัจจุบันที่ใช้ GitHub เป็นแบ็กเอนด์และมีการสแกน `clean` หรือ `suspicious` จะถูกส่งออก
    เป็นตัวอธิบายการส่งต่อ `public-github`
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (ค่าเริ่มต้น), `recommended`, `downloads`, นามแฝงแบบเดิม `installs`
  - ค่า `sort` ที่ไม่ถูกต้องจะส่งคืน `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (ค่าเริ่มต้น), `downloads`, `updated`, นามแฝงแบบเดิม `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

ต้องยืนยันตัวตน:

- `POST /api/v1/skills` (เผยแพร่ แนะนำให้ใช้ multipart)
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

- `POST /api/v1/users/reserve` สงวน slug ระดับรากและตัวยึดตำแหน่งแพ็กเกจส่วนตัวที่ยังไม่มีรีลีสไว้สำหรับแฮนเดิลของเจ้าของ

## แบบเดิม

`/api/*` และ `/api/cli/*` แบบเดิมยังคงใช้งานได้ โปรดดู `DEPRECATIONS.md`
