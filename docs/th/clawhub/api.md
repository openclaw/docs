---
read_when:
    - การสร้างไคลเอนต์ API
    - การเพิ่มเอนด์พอยต์หรือสคีมา
summary: ภาพรวมและแบบแผนของ REST API สาธารณะ (v1)
x-i18n:
    generated_at: "2026-07-12T15:57:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

ฐาน: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## การนำแคตตาล็อกสาธารณะไปใช้ซ้ำ

คุณสามารถสร้างแคตตาล็อก ไดเรกทอรี หรือส่วนติดต่อการค้นหาของบุคคลที่สามบน API สำหรับอ่านข้อมูลสาธารณะของ ClawHub ได้ เมทาดาทาและไฟล์ของ Skills สาธารณะเผยแพร่ภายใต้กฎใบอนุญาต Skills ของ ClawHub ขณะที่ตัว API มีการจำกัดอัตราการเรียกใช้และควรใช้งานอย่างรับผิดชอบ

แนวทาง:

- ใช้ปลายทางสำหรับอ่านข้อมูลสาธารณะ เช่น `GET /api/v1/skills`, `GET /api/v1/search` และ `GET /api/v1/skills/{slug}` สำหรับรายการในแคตตาล็อก
- แคชการตอบกลับและปฏิบัติตาม `429`, `Retry-After` และส่วนหัวการจำกัดอัตราแทนการสำรวจข้อมูลถี่เกินไป
- ลิงก์กลับไปยัง URL ของ Skills บน ClawHub ที่เป็นมาตรฐานเมื่อแสดงรายการ เพื่อให้ผู้ใช้ตรวจสอบระเบียนต้นทางในรีจิสทรีได้
- ใช้ URL ของหน้าแบบมาตรฐานในรูปแบบ `https://clawhub.ai/<owner>/skills/<slug>`
- อย่าสื่อเป็นนัยว่า ClawHub รับรอง ตรวจสอบ หรือดำเนินงานเว็บไซต์ของบุคคลที่สาม
- อย่าทำสำเนาเนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกระงับโดยการกลั่นกรอง ด้วยการข้ามตัวกรอง API สาธารณะหรือขอบเขตการยืนยันตัวตน

## การยืนยันตัวตน

- การอ่านข้อมูลสาธารณะ: ไม่ต้องใช้โทเค็น
- การเขียนและบัญชี: `Authorization: Bearer clh_...`

## การจำกัดอัตรา

การบังคับใช้ที่คำนึงถึงสถานะการยืนยันตัวตน:

- คำขอที่ไม่ระบุตัวตน: จำกัดตาม IP
- คำขอที่ยืนยันตัวตนแล้ว (โทเค็น Bearer ที่ถูกต้อง): จำกัดตามกลุ่มของผู้ใช้
- โทเค็นที่ขาดหายหรือไม่ถูกต้องจะกลับไปใช้การบังคับใช้ตาม IP

- อ่าน: 3000/นาทีต่อ IP, 12000/นาทีต่อคีย์
- เขียน: 300/นาทีต่อ IP, 3000/นาทีต่อคีย์
- ดาวน์โหลด: 1200/นาทีต่อ IP, 6000/นาทีต่อคีย์

ส่วนหัว: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
การตอบกลับ `429` จะมี `X-RateLimit-Remaining`, `RateLimit-Remaining` และ `Retry-After`

ความหมาย:

- `X-RateLimit-Reset`: วินาทีของ Unix epoch (เวลารีเซ็ตแบบสัมบูรณ์)
- `RateLimit-Reset`: จำนวนวินาทีที่หน่วงจนกว่าจะรีเซ็ต
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: โควตาคงเหลือที่แน่นอนเมื่อ
  มีส่วนหัวนี้ คำขอที่สำเร็จในระบบแบบแบ่งชาร์ดจะละเว้นส่วนหัวนี้แทนการส่งคืนค่า
  ส่วนกลางโดยประมาณ
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

- เลือกใช้ `Retry-After` ก่อนเมื่อมีส่วนหัวนี้
- มิฉะนั้น ให้ใช้ `RateLimit-Reset` หรือคำนวณเวลาหน่วงจาก `X-RateLimit-Reset`
- เพิ่มค่าความคลาดเคลื่อนแบบสุ่มในการลองใหม่

## ข้อผิดพลาด

- ข้อผิดพลาด v1 เป็นข้อความธรรมดา (`text/plain; charset=utf-8`) รวมถึง `400`,
  `401`, `403`, `404`, `429` และการตอบกลับสำหรับการดาวน์โหลดที่ถูกระงับ
- พารามิเตอร์คิวรีที่ไม่รู้จักจะถูกละเว้นเพื่อความเข้ากันได้
- พารามิเตอร์คิวรีที่รู้จักแต่มีค่าไม่ถูกต้องจะส่งคืน `400`

## ปลายทาง

การอ่านข้อมูลสาธารณะ:

- `GET /api/v1/search?q=...`
  - ตัวกรองที่เลือกใช้ได้: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - นามแฝงเดิม: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (ค่าเริ่มต้น), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), นามแฝงการติดตั้งเดิม `installsCurrent`/`installs`/`installsAllTime` จะถูกแมปเป็น `downloads`, `trending`
  - ค่า `sort` ที่ไม่ถูกต้องจะส่งคืน `400`
  - `cursor` ใช้กับการเรียงลำดับที่ไม่ใช่ `trending`
  - ตัวกรองที่เลือกใช้ได้: `nonSuspiciousOnly=true`
  - นามแฝงเดิม: `nonSuspicious=true`
  - เมื่อใช้ `nonSuspiciousOnly=true` หน้าที่อิงเคอร์เซอร์อาจมีรายการน้อยกว่า `limit` ให้ใช้ `nextCursor` เพื่อดำเนินการต่อ
  - `recommended` ใช้สัญญาณการมีส่วนร่วมและความใหม่
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Skills ที่โฮสต์ไว้จะส่งคืนไบต์ ZIP ที่ให้ผลลัพธ์แน่นอน
  - Skills ที่ใช้ GitHub เป็นแหล่งข้อมูลในปัจจุบันและมีผลการสแกนเป็น `clean` หรือ `suspicious` จะส่งคืน
    ตัวระบุการส่งต่อ `public-github` ในรูปแบบ JSON แทนไบต์จาก ClawHub
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Skills ที่โฮสต์ไว้จะถูกส่งออกเป็นไฟล์ที่จัดเก็บไว้
  - Skills ที่ใช้ GitHub เป็นแหล่งข้อมูลในปัจจุบันและมีผลการสแกนเป็น `clean` หรือ `suspicious` จะถูกส่งออก
    เป็นตัวระบุการส่งต่อ `public-github`
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

- `POST /api/v1/skills` (เผยแพร่ โดยแนะนำให้ใช้ multipart)
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

สำหรับผู้ดูแลระบบเท่านั้น:

- `POST /api/v1/users/reserve` จอง slug ระดับรากและตัวแทนแพ็กเกจส่วนตัวที่ยังไม่มีรุ่นเผยแพร่สำหรับชื่อผู้ใช้ของเจ้าของ

## รุ่นเดิม

`/api/*` และ `/api/cli/*` รุ่นเดิมยังคงใช้งานได้ โปรดดู `DEPRECATIONS.md`
