---
read_when:
    - การเรียกใช้เครื่องมือโดยไม่ต้องเรียกใช้รอบการทำงานของเอเจนต์แบบเต็ม
    - การสร้างระบบอัตโนมัติที่ต้องการการบังคับใช้นโยบายเครื่องมือ
summary: เรียกใช้เครื่องมือเดียวโดยตรงผ่านปลายทาง HTTP ของ Gateway
title: API สำหรับเรียกใช้เครื่องมือ
x-i18n:
    generated_at: "2026-05-10T19:41:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 531e77673fb9c06d0cc8f8145d874e22f7e590dc3e4c5dee1574874af5666886
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw's Gateway เปิดเผย endpoint HTTP แบบง่ายสำหรับเรียกใช้เครื่องมือเดียวโดยตรง โดยเปิดใช้งานอยู่เสมอและใช้การยืนยันตัวตนของ Gateway ร่วมกับนโยบายเครื่องมือ เช่นเดียวกับพื้นผิว `/v1/*` ที่เข้ากันได้กับ OpenAI การยืนยันตัวตนแบบ bearer ด้วย shared secret จะถือเป็นสิทธิ์การเข้าถึงแบบ trusted operator สำหรับทั้ง gateway

- `POST /tools/invoke`
- พอร์ตเดียวกับ Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/tools/invoke`

ขนาด payload สูงสุดเริ่มต้นคือ 2 MB

## การยืนยันตัวตน

ใช้การกำหนดค่าการยืนยันตัวตนของ Gateway

เส้นทางการยืนยันตัวตน HTTP ที่พบบ่อย:

- การยืนยันตัวตนแบบ shared-secret (`gateway.auth.mode="token"` หรือ `"password"`):
  `Authorization: Bearer <token-or-password>`
- การยืนยันตัวตน HTTP ที่มี trusted identity (`gateway.auth.mode="trusted-proxy"`):
  ส่งผ่าน identity-aware proxy ที่กำหนดค่าไว้ และให้ proxy แทรก
  header ระบุตัวตนที่จำเป็น
- การยืนยันตัวตนแบบเปิดบน private-ingress (`gateway.auth.mode="none"`):
  ไม่ต้องใช้ header การยืนยันตัวตน

หมายเหตุ:

- เมื่อ `gateway.auth.mode="token"` ให้ใช้ `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
- เมื่อ `gateway.auth.mode="password"` ให้ใช้ `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
- เมื่อ `gateway.auth.mode="trusted-proxy"` คำขอ HTTP ต้องมาจาก
  แหล่ง trusted proxy ที่กำหนดค่าไว้; proxy แบบ loopback บนโฮสต์เดียวกันต้องกำหนด
  `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน
- หากกำหนดค่า `gateway.auth.rateLimit` และเกิดความล้มเหลวในการยืนยันตัวตนมากเกินไป endpoint จะส่งคืน `429` พร้อม `Retry-After`

## ขอบเขตความปลอดภัย (สำคัญ)

ให้ถือว่า endpoint นี้เป็นพื้นผิว **การเข้าถึงระดับ operator เต็มรูปแบบ** สำหรับอินสแตนซ์ gateway

- การยืนยันตัวตน HTTP bearer ที่นี่ไม่ใช่โมเดลขอบเขตแบบแคบต่อผู้ใช้
- token/password ของ Gateway ที่ถูกต้องสำหรับ endpoint นี้ควรถูกถือเหมือนข้อมูลรับรองของ owner/operator
- สำหรับโหมดการยืนยันตัวตนแบบ shared-secret (`token` และ `password`) endpoint จะคืนค่าเริ่มต้นแบบ full operator ตามปกติ แม้ผู้เรียกจะส่ง header `x-openclaw-scopes` ที่แคบกว่า
- การยืนยันตัวตนแบบ shared-secret ยังถือว่าการเรียกใช้เครื่องมือโดยตรงบน endpoint นี้เป็น owner-sender turns
- โหมด HTTP ที่มี trusted identity (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน private ingress) จะเคารพ `x-openclaw-scopes` เมื่อมีอยู่ และมิฉะนั้นจะย้อนกลับไปใช้ชุด scope เริ่มต้นของ operator ตามปกติ
- เก็บ endpoint นี้ไว้บน loopback/tailnet/private ingress เท่านั้น; อย่าเปิดเผยโดยตรงต่ออินเทอร์เน็ตสาธารณะ

เมทริกซ์การยืนยันตัวตน:

- `gateway.auth.mode="token"` หรือ `"password"` + `Authorization: Bearer ...`
  - พิสูจน์การครอบครอง shared gateway operator secret
  - ไม่สนใจ `x-openclaw-scopes` ที่แคบกว่า
  - คืนชุด scope เริ่มต้นของ operator แบบเต็ม:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - ถือว่าการเรียกใช้เครื่องมือโดยตรงบน endpoint นี้เป็น owner-sender turns
- โหมด HTTP ที่มี trusted identity (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน private ingress)
  - ยืนยันตัวตนของ trusted identity ภายนอกบางรายการ หรือขอบเขตการ deploy
  - เคารพ `x-openclaw-scopes` เมื่อมี header อยู่
  - ย้อนกลับไปใช้ชุด scope เริ่มต้นของ operator ตามปกติเมื่อไม่มี header
  - จะสูญเสีย semantic ของ owner เฉพาะเมื่อผู้เรียกจำกัด scope ให้แคบลงอย่างชัดเจนและละเว้น `operator.admin`

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

- `tool` (string, ต้องระบุ): ชื่อเครื่องมือที่จะเรียกใช้
- `action` (string, ไม่บังคับ): ถูก map เข้า args หาก schema ของเครื่องมือรองรับ `action` และ payload args ละเว้นฟิลด์นี้
- `args` (object, ไม่บังคับ): อาร์กิวเมนต์เฉพาะของเครื่องมือ
- `sessionKey` (string, ไม่บังคับ): session key เป้าหมาย หากละเว้นหรือเป็น `"main"` Gateway จะใช้ main session key ที่กำหนดค่าไว้ (เคารพ `session.mainKey` และ agent เริ่มต้น หรือ `global` ใน global scope)
- `dryRun` (boolean, ไม่บังคับ): สำรองไว้สำหรับการใช้งานในอนาคต; ปัจจุบันถูกละเว้น

## นโยบาย + พฤติกรรมการ routing

ความพร้อมใช้งานของเครื่องมือถูกกรองผ่าน policy chain เดียวกับที่ agent ของ Gateway ใช้:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- นโยบายกลุ่ม (หาก session key map ไปยังกลุ่มหรือ channel)
- นโยบาย subagent (เมื่อเรียกใช้ด้วย session key ของ subagent)

หากเครื่องมือไม่ได้รับอนุญาตจากนโยบาย endpoint จะส่งคืน **404**

หมายเหตุสำคัญเกี่ยวกับขอบเขต:

- การอนุมัติ exec เป็น guardrails ของ operator ไม่ใช่ขอบเขตการอนุญาตแยกต่างหากสำหรับ endpoint HTTP นี้ หากเครื่องมือเข้าถึงได้ที่นี่ผ่านการยืนยันตัวตนของ Gateway + นโยบายเครื่องมือ `/tools/invoke` จะไม่เพิ่ม prompt อนุมัติเพิ่มเติมต่อการเรียกแต่ละครั้ง
- หาก `exec` เข้าถึงได้ที่นี่ ให้ถือว่าเป็นพื้นผิว shell ที่เปลี่ยนแปลงระบบได้ การปฏิเสธ `write`, `edit`, `apply_patch` หรือเครื่องมือ HTTP สำหรับเขียน filesystem ไม่ได้ทำให้การ execute shell เป็นแบบอ่านอย่างเดียว
- อย่าแชร์ข้อมูลรับรอง bearer ของ Gateway กับผู้เรียกที่ไม่น่าเชื่อถือ หากต้องการแยกข้ามขอบเขตความเชื่อถือ ให้รัน gateway แยกกัน (และควรแยก OS users/hosts ด้วย)

HTTP ของ Gateway ยังใช้ deny list แบบเข้มงวดโดยค่าเริ่มต้น (แม้นโยบาย session จะอนุญาตเครื่องมือนั้น):

- `exec` - การ execute คำสั่งโดยตรง (พื้นผิว RCE)
- `spawn` - การสร้าง child process ตามอำเภอใจ (พื้นผิว RCE)
- `shell` - การ execute คำสั่ง shell (พื้นผิว RCE)
- `fs_write` - การแก้ไขไฟล์ตามอำเภอใจบนโฮสต์
- `fs_delete` - การลบไฟล์ตามอำเภอใจบนโฮสต์
- `fs_move` - การย้าย/เปลี่ยนชื่อไฟล์ตามอำเภอใจบนโฮสต์
- `apply_patch` - การใช้ patch สามารถเขียนไฟล์ตามอำเภอใจใหม่ได้
- `sessions_spawn` - การจัดการ session; การ spawn agents จากระยะไกลคือ RCE
- `sessions_send` - การฉีดข้อความข้าม session
- `cron` - control plane สำหรับ automation แบบ persistent
- `gateway` - control plane ของ gateway; ป้องกันการ reconfiguration ผ่าน HTTP
- `nodes` - relay คำสั่งของ node สามารถเข้าถึง system.run บนโฮสต์ที่จับคู่ไว้
- `whatsapp_login` - การตั้งค่าแบบโต้ตอบที่ต้องสแกน QR ผ่านเทอร์มินัล; จะค้างบน HTTP

คุณสามารถปรับแต่ง deny list นี้ผ่าน `gateway.tools`:

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

เพื่อช่วยให้นโยบายกลุ่ม resolve context ได้ คุณสามารถตั้งค่าเพิ่มเติมได้:

- `x-openclaw-message-channel: <channel>` (ตัวอย่าง: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (เมื่อมีหลายบัญชี)

## การตอบกลับ

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (คำขอไม่ถูกต้องหรือข้อผิดพลาด input ของเครื่องมือ)
- `401` → ไม่ได้รับอนุญาต
- `429` → ถูกจำกัดอัตราการยืนยันตัวตน (`Retry-After` ถูกตั้งค่า)
- `404` → เครื่องมือไม่พร้อมใช้งาน (ไม่พบหรือไม่ได้อยู่ใน allowlist)
- `405` → method ไม่ได้รับอนุญาต
- `500` → `{ ok: false, error: { type, message } }` (ข้อผิดพลาดที่ไม่คาดคิดระหว่างการ execute เครื่องมือ; ข้อความถูก sanitize แล้ว)

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
