---
read_when:
    - การเรียกใช้เครื่องมือโดยไม่ต้องเรียกใช้รอบการทำงานเต็มรูปแบบของเอเจนต์
    - การสร้างระบบอัตโนมัติที่ต้องบังคับใช้นโยบายเครื่องมือ
summary: เรียกใช้เครื่องมือเดียวโดยตรงผ่านปลายทาง HTTP ของ Gateway
title: API สำหรับเรียกใช้เครื่องมือ
x-i18n:
    generated_at: "2026-04-30T09:56:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ba20b7471de76e7f6bccc4d7a3d72c00d9d7b9843ad4e74825685c992a33f1a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

# การเรียกใช้เครื่องมือ (HTTP)

Gateway ของ OpenClaw เปิดเผย endpoint HTTP แบบเรียบง่ายสำหรับเรียกใช้เครื่องมือเดียวโดยตรง endpoint นี้เปิดใช้งานเสมอและใช้การยืนยันตัวตนของ Gateway ร่วมกับนโยบายเครื่องมือ เช่นเดียวกับพื้นผิว `/v1/*` ที่เข้ากันได้กับ OpenAI การยืนยันตัวตนแบบ bearer ด้วยความลับร่วมจะถือเป็นสิทธิ์เข้าถึงของผู้ปฏิบัติการที่เชื่อถือได้สำหรับ Gateway ทั้งหมด

- `POST /tools/invoke`
- พอร์ตเดียวกับ Gateway (มัลติเพล็กซ์ WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

ขนาด payload สูงสุดเริ่มต้นคือ 2 MB

## การยืนยันตัวตน

ใช้การกำหนดค่าการยืนยันตัวตนของ Gateway

เส้นทางการยืนยันตัวตน HTTP ที่พบบ่อย:

- การยืนยันตัวตนด้วยความลับร่วม (`gateway.auth.mode="token"` หรือ `"password"`):
  `Authorization: Bearer <token-or-password>`
- การยืนยันตัวตน HTTP ที่มีตัวตนที่เชื่อถือได้ (`gateway.auth.mode="trusted-proxy"`):
  ส่งผ่านพร็อกซีที่รับรู้ตัวตนตามที่กำหนดค่าไว้ และให้พร็อกซีนั้นฉีด
  header ตัวตนที่จำเป็น
- การยืนยันตัวตนแบบเปิดผ่านทางเข้าส่วนตัว (`gateway.auth.mode="none"`):
  ไม่ต้องใช้ header การยืนยันตัวตน

หมายเหตุ:

- เมื่อ `gateway.auth.mode="token"` ให้ใช้ `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
- เมื่อ `gateway.auth.mode="password"` ให้ใช้ `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
- เมื่อ `gateway.auth.mode="trusted-proxy"` คำขอ HTTP ต้องมาจากแหล่งพร็อกซีที่เชื่อถือได้
  ซึ่งกำหนดค่าไว้; พร็อกซี loopback บนโฮสต์เดียวกันต้องกำหนดอย่างชัดเจน
  `gateway.auth.trustedProxy.allowLoopback = true`
- หากกำหนดค่า `gateway.auth.rateLimit` และเกิดความล้มเหลวในการยืนยันตัวตนมากเกินไป endpoint จะส่งคืน `429` พร้อม `Retry-After`

## ขอบเขตความปลอดภัย (สำคัญ)

ให้ถือว่า endpoint นี้เป็นพื้นผิวที่มี **สิทธิ์เข้าถึงระดับผู้ปฏิบัติการเต็มรูปแบบ** สำหรับอินสแตนซ์ Gateway

- การยืนยันตัวตนแบบ bearer ของ HTTP ที่นี่ไม่ใช่โมเดล scope ต่อผู้ใช้แบบแคบ
- token/password ของ Gateway ที่ถูกต้องสำหรับ endpoint นี้ควรถูกปฏิบัติเหมือนข้อมูลประจำตัวของเจ้าของ/ผู้ปฏิบัติการ
- สำหรับโหมดการยืนยันตัวตนด้วยความลับร่วม (`token` และ `password`) endpoint จะคืนค่าเริ่มต้นระดับผู้ปฏิบัติการเต็มรูปแบบตามปกติ แม้ว่าผู้เรียกจะส่ง header `x-openclaw-scopes` ที่แคบกว่า
- การยืนยันตัวตนด้วยความลับร่วมยังถือว่าการเรียกใช้เครื่องมือโดยตรงบน endpoint นี้เป็นรอบที่ผู้ส่งคือเจ้าของ
- โหมด HTTP ที่มีตัวตนที่เชื่อถือได้ (เช่น การยืนยันตัวตนด้วยพร็อกซีที่เชื่อถือได้ หรือ `gateway.auth.mode="none"` บนทางเข้าส่วนตัว) จะเคารพ `x-openclaw-scopes` เมื่อมีอยู่ และมิฉะนั้นจะย้อนกลับไปใช้ชุด scope เริ่มต้นของผู้ปฏิบัติการตามปกติ
- เก็บ endpoint นี้ไว้เฉพาะบน loopback/tailnet/ทางเข้าส่วนตัวเท่านั้น; อย่าเปิดเผยต่ออินเทอร์เน็ตสาธารณะโดยตรง

เมทริกซ์การยืนยันตัวตน:

- `gateway.auth.mode="token"` หรือ `"password"` + `Authorization: Bearer ...`
  - พิสูจน์การครอบครองความลับร่วมของผู้ปฏิบัติการ Gateway
  - ไม่สนใจ `x-openclaw-scopes` ที่แคบกว่า
  - คืนค่าชุด scope เริ่มต้นของผู้ปฏิบัติการแบบเต็ม:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - ถือว่าการเรียกใช้เครื่องมือโดยตรงบน endpoint นี้เป็นรอบที่ผู้ส่งคือเจ้าของ
- โหมด HTTP ที่มีตัวตนที่เชื่อถือได้ (เช่น การยืนยันตัวตนด้วยพร็อกซีที่เชื่อถือได้ หรือ `gateway.auth.mode="none"` บนทางเข้าส่วนตัว)
  - ยืนยันตัวตนภายนอกที่เชื่อถือได้บางอย่างหรือขอบเขตการปรับใช้
  - เคารพ `x-openclaw-scopes` เมื่อมี header อยู่
  - ย้อนกลับไปใช้ชุด scope เริ่มต้นของผู้ปฏิบัติการตามปกติเมื่อไม่มี header
  - สูญเสียความหมายแบบเจ้าของเฉพาะเมื่อผู้เรียกจำกัด scope ให้แคบลงอย่างชัดเจนและละเว้น `operator.admin`

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
- `action` (สตริง, ไม่บังคับ): แมปเข้าไปใน args หาก schema ของเครื่องมือรองรับ `action` และ payload args ละเว้นค่านี้
- `args` (อ็อบเจกต์, ไม่บังคับ): อาร์กิวเมนต์เฉพาะของเครื่องมือ
- `sessionKey` (สตริง, ไม่บังคับ): คีย์ session เป้าหมาย หากละเว้นหรือเป็น `"main"` Gateway จะใช้คีย์ session หลักที่กำหนดค่าไว้ (เคารพ `session.mainKey` และ agent เริ่มต้น หรือ `global` ใน scope แบบ global)
- `dryRun` (บูลีน, ไม่บังคับ): สำรองไว้สำหรับการใช้งานในอนาคต; ปัจจุบันถูกละเว้น

## นโยบาย + พฤติกรรมการกำหนดเส้นทาง

ความพร้อมใช้งานของเครื่องมือถูกกรองผ่านลำดับนโยบายเดียวกับที่ agent ของ Gateway ใช้:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- นโยบายกลุ่ม (หากคีย์ session แมปกับกลุ่มหรือช่องทาง)
- นโยบาย subagent (เมื่อเรียกใช้ด้วยคีย์ session ของ subagent)

หากนโยบายไม่อนุญาตเครื่องมือ endpoint จะส่งคืน **404**

หมายเหตุสำคัญเกี่ยวกับขอบเขต:

- การอนุมัติ exec เป็นรั้วป้องกันของผู้ปฏิบัติการ ไม่ใช่ขอบเขตการอนุญาตแยกต่างหากสำหรับ endpoint HTTP นี้ หากเครื่องมือเข้าถึงได้ที่นี่ผ่านการยืนยันตัวตนของ Gateway + นโยบายเครื่องมือ `/tools/invoke` จะไม่เพิ่ม prompt การอนุมัติรายครั้งเพิ่มเติม
- อย่าแชร์ข้อมูลประจำตัว bearer ของ Gateway กับผู้เรียกที่ไม่น่าเชื่อถือ หากต้องการแยกระหว่างขอบเขตความไว้วางใจ ให้รัน Gateway แยกกัน (และควรแยกผู้ใช้/โฮสต์ของ OS ด้วย)

HTTP ของ Gateway ยังใช้รายการปฏิเสธแบบบังคับโดยค่าเริ่มต้น (แม้ว่านโยบาย session จะอนุญาตเครื่องมือนั้น):

- `exec` — การเรียกใช้คำสั่งโดยตรง (พื้นผิว RCE)
- `spawn` — การสร้าง process ลูกตามอำเภอใจ (พื้นผิว RCE)
- `shell` — การเรียกใช้คำสั่ง shell (พื้นผิว RCE)
- `fs_write` — การแก้ไขไฟล์ใดก็ได้บนโฮสต์ตามอำเภอใจ
- `fs_delete` — การลบไฟล์ใดก็ได้บนโฮสต์ตามอำเภอใจ
- `fs_move` — การย้าย/เปลี่ยนชื่อไฟล์ใดก็ได้บนโฮสต์ตามอำเภอใจ
- `apply_patch` — การใช้ patch สามารถเขียนไฟล์ใดก็ได้ใหม่
- `sessions_spawn` — การจัดการ session; การ spawn agent ระยะไกลคือ RCE
- `sessions_send` — การฉีดข้อความข้าม session
- `cron` — control plane ระบบอัตโนมัติแบบถาวร
- `gateway` — control plane ของ Gateway; ป้องกันการกำหนดค่าใหม่ผ่าน HTTP
- `nodes` — relay คำสั่งของ Node สามารถเข้าถึง system.run บนโฮสต์ที่จับคู่ไว้
- `whatsapp_login` — การตั้งค่าแบบโต้ตอบที่ต้องสแกน QR จาก terminal; จะค้างบน HTTP

คุณสามารถปรับแต่งรายการปฏิเสธนี้ผ่าน `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

เพื่อช่วยให้นโยบายกลุ่มแก้ context ได้ คุณสามารถตั้งค่าเพิ่มเติมได้:

- `x-openclaw-message-channel: <channel>` (ตัวอย่าง: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (เมื่อมีหลายบัญชี)

## การตอบกลับ

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (คำขอไม่ถูกต้องหรือข้อผิดพลาด input ของเครื่องมือ)
- `401` → ไม่ได้รับอนุญาต
- `429` → การยืนยันตัวตนถูกจำกัดอัตรา (`Retry-After` ถูกตั้งค่า)
- `404` → เครื่องมือไม่พร้อมใช้งาน (ไม่พบหรือไม่ได้อยู่ในรายการอนุญาต)
- `405` → ไม่อนุญาต method นี้
- `500` → `{ ok: false, error: { type, message } }` (ข้อผิดพลาดการเรียกใช้เครื่องมือที่ไม่คาดคิด; ข้อความถูกทำให้ปลอดภัยแล้ว)

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
- [เครื่องมือและ Plugin](/th/tools)
