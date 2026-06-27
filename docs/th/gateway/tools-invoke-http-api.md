---
read_when:
    - การเรียกใช้เครื่องมือโดยไม่ต้องรันรอบการทำงานของเอเจนต์แบบเต็ม
    - การสร้างระบบอัตโนมัติที่ต้องบังคับใช้นโยบายเครื่องมือ
summary: เรียกใช้เครื่องมือเดียวโดยตรงผ่านปลายทาง HTTP ของ Gateway
title: เครื่องมือเรียกใช้ API
x-i18n:
    generated_at: "2026-06-27T17:40:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2023505f5a705b62e2fd685d64d3f9bd7788d09adfe89ac99604e6660c78ad8a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

Gateway ของ OpenClaw เปิดเผย endpoint HTTP แบบง่ายสำหรับเรียกใช้เครื่องมือเดียวโดยตรง endpoint นี้เปิดใช้งานเสมอ และใช้การยืนยันตัวตนของ Gateway ร่วมกับนโยบายเครื่องมือ เช่นเดียวกับพื้นผิวที่เข้ากันได้กับ OpenAI อย่าง `/v1/*` การยืนยันตัวตนแบบ bearer ด้วย shared-secret จะถือเป็นการเข้าถึงระดับผู้ปฏิบัติการที่เชื่อถือได้สำหรับ Gateway ทั้งหมด

- `POST /tools/invoke`
- พอร์ตเดียวกับ Gateway (มัลติเพล็กซ์ WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

ขนาด payload สูงสุดเริ่มต้นคือ 2 MB

## การยืนยันตัวตน

ใช้การกำหนดค่าการยืนยันตัวตนของ Gateway

เส้นทางการยืนยันตัวตน HTTP ที่พบบ่อย:

- การยืนยันตัวตนแบบ shared-secret (`gateway.auth.mode="token"` หรือ `"password"`):
  `Authorization: Bearer <token-or-password>`
- การยืนยันตัวตน HTTP ที่มีตัวตนที่เชื่อถือได้ (`gateway.auth.mode="trusted-proxy"`):
  ส่งผ่านพร็อกซีที่รับรู้ตัวตนตามที่กำหนดค่าไว้ และให้พร็อกซีแทรก
  ส่วนหัวตัวตนที่จำเป็น
- การยืนยันตัวตนแบบเปิดบน private-ingress (`gateway.auth.mode="none"`):
  ไม่ต้องใช้ส่วนหัวการยืนยันตัวตน

หมายเหตุ:

- เมื่อ `gateway.auth.mode="token"` ให้ใช้ `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
- เมื่อ `gateway.auth.mode="password"` ให้ใช้ `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
- เมื่อ `gateway.auth.mode="trusted-proxy"` คำขอ HTTP ต้องมาจากแหล่ง
  พร็อกซีที่เชื่อถือได้ซึ่งกำหนดค่าไว้ พร็อกซี loopback บนโฮสต์เดียวกันต้องตั้งค่าอย่างชัดเจนเป็น
  `gateway.auth.trustedProxy.allowLoopback = true`
- ผู้เรียกภายในบนโฮสต์เดียวกันที่ข้ามพร็อกซีสามารถใช้
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` เป็น fallback โดยตรงในเครื่องได้ หลักฐานส่วนหัว
  `Forwarded`, `X-Forwarded-*` หรือ `X-Real-IP`
  จะทำให้คำขอยังคงอยู่บนเส้นทาง trusted-proxy แทน
- หากกำหนดค่า `gateway.auth.rateLimit` และเกิดความล้มเหลวในการยืนยันตัวตนมากเกินไป endpoint จะคืนค่า `429` พร้อม `Retry-After`

## ขอบเขตความปลอดภัย (สำคัญ)

ให้ถือว่า endpoint นี้เป็นพื้นผิว **การเข้าถึงระดับผู้ปฏิบัติการเต็มรูปแบบ** สำหรับอินสแตนซ์ Gateway

- การยืนยันตัวตน HTTP bearer ที่นี่ไม่ใช่โมเดลขอบเขตแบบแคบต่อผู้ใช้
- token/password ของ Gateway ที่ถูกต้องสำหรับ endpoint นี้ควรถูกถือเหมือนข้อมูลรับรองของเจ้าของ/ผู้ปฏิบัติการ
- สำหรับโหมดการยืนยันตัวตนแบบ shared-secret (`token` และ `password`) endpoint จะกู้คืนค่าเริ่มต้นผู้ปฏิบัติการเต็มรูปแบบตามปกติ แม้ว่าผู้เรียกจะส่งส่วนหัว `x-openclaw-scopes` ที่แคบกว่าก็ตาม
- การยืนยันตัวตนแบบ shared-secret ยังถือว่าการเรียกเครื่องมือโดยตรงบน endpoint นี้เป็นเทิร์นของ owner-sender
- โหมด HTTP ที่มีตัวตนที่เชื่อถือได้ (เช่น การยืนยันตัวตนผ่าน trusted proxy หรือ `gateway.auth.mode="none"` บน private ingress) จะเคารพ `x-openclaw-scopes` เมื่อมีอยู่ และมิฉะนั้นจะ fallback ไปยังชุดขอบเขตค่าเริ่มต้นของผู้ปฏิบัติการตามปกติ
- เก็บ endpoint นี้ไว้บน loopback/tailnet/private ingress เท่านั้น อย่าเปิดเผยโดยตรงต่ออินเทอร์เน็ตสาธารณะ

เมทริกซ์การยืนยันตัวตน:

- `gateway.auth.mode="token"` หรือ `"password"` + `Authorization: Bearer ...`
  - พิสูจน์การครอบครอง shared gateway operator secret
  - ไม่สนใจ `x-openclaw-scopes` ที่แคบกว่า
  - กู้คืนชุดขอบเขตผู้ปฏิบัติการค่าเริ่มต้นแบบเต็ม:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - ถือว่าการเรียกเครื่องมือโดยตรงบน endpoint นี้เป็นเทิร์นของ owner-sender
- โหมด HTTP ที่มีตัวตนที่เชื่อถือได้ (เช่น การยืนยันตัวตนผ่าน trusted proxy หรือ `gateway.auth.mode="none"` บน private ingress)
  - ยืนยันตัวตนภายนอกที่เชื่อถือได้หรือขอบเขตการปรับใช้บางอย่าง
  - เคารพ `x-openclaw-scopes` เมื่อมีส่วนหัวอยู่
  - fallback ไปยังชุดขอบเขตค่าเริ่มต้นของผู้ปฏิบัติการตามปกติเมื่อไม่มีส่วนหัว
  - จะเสียความหมายเชิงเจ้าของเฉพาะเมื่อผู้เรียกจำกัดขอบเขตให้แคบลงอย่างชัดเจนและละเว้น `operator.admin`

## เนื้อหาคำขอ

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

ฟิลด์:

- `tool` (สตริง, จำเป็น): ชื่อเครื่องมือที่จะเรียกใช้
- `action` (สตริง, ไม่บังคับ): แมปเข้าไปใน args หาก schema ของเครื่องมือรองรับ `action` และ payload ของ args ละเว้นไว้
- `args` (อ็อบเจกต์, ไม่บังคับ): อาร์กิวเมนต์เฉพาะเครื่องมือ
- `sessionKey` (สตริง, ไม่บังคับ): คีย์เซสชันเป้าหมาย หากละเว้นหรือเป็น `"main"` Gateway จะใช้คีย์เซสชันหลักที่กำหนดค่าไว้ (เคารพ `session.mainKey` และ agent เริ่มต้น หรือ `global` ในขอบเขต global)
- `dryRun` (บูลีน, ไม่บังคับ): สงวนไว้สำหรับการใช้งานในอนาคต ปัจจุบันถูกละเว้น

## พฤติกรรมด้านนโยบายและการกำหนดเส้นทาง

ความพร้อมใช้งานของเครื่องมือจะถูกกรองผ่านสายโซ่นโยบายเดียวกับที่ agent ของ Gateway ใช้:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- นโยบายกลุ่ม (หากคีย์เซสชันแมปไปยังกลุ่มหรือช่องทาง)
- นโยบาย subagent (เมื่อเรียกด้วยคีย์เซสชัน subagent)

หากเครื่องมือไม่ได้รับอนุญาตโดยนโยบาย endpoint จะคืนค่า **404**

หมายเหตุสำคัญเกี่ยวกับขอบเขต:

- การอนุมัติ exec เป็น guardrails ของผู้ปฏิบัติการ ไม่ใช่ขอบเขตการอนุญาตแยกต่างหากสำหรับ endpoint HTTP นี้ หากเข้าถึงเครื่องมือได้ที่นี่ผ่านการยืนยันตัวตน Gateway + นโยบายเครื่องมือ `/tools/invoke` จะไม่เพิ่มพรอมป์อนุมัติรายครั้งเพิ่มเติม
- หากเข้าถึง `exec` ได้ที่นี่ ให้ถือว่าเป็นพื้นผิว shell ที่เปลี่ยนแปลงสถานะได้ การปฏิเสธ `write`, `edit`, `apply_patch` หรือเครื่องมือเขียน filesystem ผ่าน HTTP ไม่ได้ทำให้การเรียกใช้ shell เป็นแบบอ่านอย่างเดียว
- อย่าแชร์ข้อมูลรับรอง bearer ของ Gateway กับผู้เรียกที่ไม่น่าเชื่อถือ หากคุณต้องการแยกข้ามขอบเขตความเชื่อถือ ให้รัน Gateway แยกกัน (และควรแยกผู้ใช้/โฮสต์ของ OS ด้วย)

HTTP ของ Gateway ยังใช้รายการปฏิเสธแบบตายตัวตามค่าเริ่มต้น (แม้นโยบายเซสชันจะอนุญาตเครื่องมือนั้น):

- `exec` - การเรียกใช้คำสั่งโดยตรง (พื้นผิว RCE)
- `spawn` - การสร้าง child process ตามอำเภอใจ (พื้นผิว RCE)
- `shell` - การเรียกใช้คำสั่ง shell (พื้นผิว RCE)
- `fs_write` - การเปลี่ยนแปลงไฟล์ตามอำเภอใจบนโฮสต์
- `fs_delete` - การลบไฟล์ตามอำเภอใจบนโฮสต์
- `fs_move` - การย้าย/เปลี่ยนชื่อไฟล์ตามอำเภอใจบนโฮสต์
- `apply_patch` - การใช้ patch สามารถเขียนไฟล์ใดๆ ใหม่ได้
- `sessions_spawn` - การประสานงานเซสชัน การ spawn agent จากระยะไกลคือ RCE
- `sessions_send` - การแทรกข้อความข้ามเซสชัน
- `cron` - control plane ของระบบอัตโนมัติแบบถาวร
- `gateway` - control plane ของ Gateway ป้องกันการกำหนดค่าใหม่ผ่าน HTTP
- `nodes` - relay คำสั่ง Node สามารถเข้าถึง system.run บนโฮสต์ที่จับคู่ไว้
- `whatsapp_login` - การตั้งค่าแบบโต้ตอบที่ต้องสแกน QR ในเทอร์มินัล ค้างบน HTTP

คุณสามารถปรับแต่งรายการปฏิเสธนี้ผ่าน `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list for owner/admin callers
      allow: ["gateway"],
    },
  },
}
```

`gateway.tools.allow` เป็นการ override การเปิดเผย ไม่ใช่การอัปเกรดขอบเขต ใน
โหมด HTTP ที่มีตัวตน `cron`, `gateway` และ `nodes` จะยังคงไม่พร้อมใช้งาน
สำหรับผู้เรียกที่ไม่มีตัวตน owner/admin (`operator.admin`) แม้ว่า
จะถูกระบุไว้ใน `gateway.tools.allow` ก็ตาม การยืนยันตัวตนแบบ shared-secret bearer ยังคงเป็นไปตาม
กฎ trusted-operator แบบเต็มข้างต้น

เพื่อช่วยให้นโยบายกลุ่ม resolve บริบท คุณสามารถตั้งค่าเพิ่มเติมได้:

- `x-openclaw-message-channel: <channel>` (ตัวอย่าง: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (เมื่อมีหลายบัญชี)

## การตอบกลับ

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (คำขอไม่ถูกต้องหรือข้อผิดพลาดอินพุตของเครื่องมือ)
- `401` → ไม่ได้รับอนุญาต
- `429` → ถูกจำกัดอัตราการยืนยันตัวตน (`Retry-After` ถูกตั้งค่า)
- `404` → เครื่องมือไม่พร้อมใช้งาน (ไม่พบหรือไม่ได้อยู่ในรายการอนุญาต)
- `405` → ไม่อนุญาตให้ใช้เมธอด
- `500` → `{ ok: false, error: { type, message } }` (ข้อผิดพลาดที่ไม่คาดคิดในการเรียกใช้เครื่องมือ ข้อความถูก sanitize แล้ว)

## ตัวอย่าง

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## ที่เกี่ยวข้อง

- [โปรโตคอล Gateway](/th/gateway/protocol)
- [เครื่องมือและ plugins](/th/tools)
