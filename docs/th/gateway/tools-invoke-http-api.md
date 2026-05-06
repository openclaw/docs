---
read_when:
    - การเรียกใช้เครื่องมือโดยไม่ต้องรันรอบการทำงานของเอเจนต์เต็มรูปแบบ
    - การสร้างระบบอัตโนมัติที่ต้องบังคับใช้นโยบายการใช้เครื่องมือ
summary: เรียกใช้เครื่องมือเดียวโดยตรงผ่านปลายทาง HTTP ของ Gateway
title: API สำหรับเรียกใช้เครื่องมือ
x-i18n:
    generated_at: "2026-05-06T09:16:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fcd490d4eaa63f23b0d502e537c4094ade88afcdd04e2b7df1a5f0484a11c57
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

Gateway ของ OpenClaw เปิดเผย endpoint HTTP แบบง่ายสำหรับเรียกใช้เครื่องมือเดียวโดยตรง endpoint นี้เปิดใช้งานเสมอ และใช้การยืนยันตัวตนของ Gateway ร่วมกับนโยบายเครื่องมือ เช่นเดียวกับพื้นผิว `/v1/*` ที่เข้ากันได้กับ OpenAI การยืนยันตัวตนแบบ bearer ด้วย shared-secret จะถือเป็นสิทธิ์เข้าถึงของผู้ปฏิบัติการที่เชื่อถือได้สำหรับ gateway ทั้งหมด

- `POST /tools/invoke`
- พอร์ตเดียวกับ Gateway (มัลติเพล็กซ์ WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

ขนาด payload สูงสุดเริ่มต้นคือ 2 MB

## การยืนยันตัวตน

ใช้การกำหนดค่าการยืนยันตัวตนของ Gateway

เส้นทางการยืนยันตัวตน HTTP ทั่วไป:

- การยืนยันตัวตนแบบ shared-secret (`gateway.auth.mode="token"` หรือ `"password"`):
  `Authorization: Bearer <token-or-password>`
- การยืนยันตัวตน HTTP ที่มีข้อมูลระบุตัวตนที่เชื่อถือได้ (`gateway.auth.mode="trusted-proxy"`):
  ส่งผ่าน proxy ที่รับรู้ข้อมูลระบุตัวตนซึ่งกำหนดค่าไว้ และปล่อยให้ proxy แทรก
  header ข้อมูลระบุตัวตนที่จำเป็น
- การยืนยันตัวตนแบบเปิดบน private-ingress (`gateway.auth.mode="none"`):
  ไม่ต้องใช้ header การยืนยันตัวตน

หมายเหตุ:

- เมื่อ `gateway.auth.mode="token"` ให้ใช้ `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
- เมื่อ `gateway.auth.mode="password"` ให้ใช้ `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
- เมื่อ `gateway.auth.mode="trusted-proxy"` คำขอ HTTP ต้องมาจากแหล่ง proxy
  ที่เชื่อถือได้ซึ่งกำหนดค่าไว้; proxy แบบ loopback บน host เดียวกันต้องตั้งค่า
  `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน
- หากมีการกำหนดค่า `gateway.auth.rateLimit` และเกิดความล้มเหลวในการยืนยันตัวตนมากเกินไป endpoint จะคืนค่า `429` พร้อม `Retry-After`

## ขอบเขตความปลอดภัย (สำคัญ)

ให้ถือว่า endpoint นี้เป็นพื้นผิวที่มี **สิทธิ์เข้าถึงระดับผู้ปฏิบัติการเต็มรูปแบบ** สำหรับอินสแตนซ์ gateway

- การยืนยันตัวตน HTTP bearer ตรงนี้ไม่ใช่โมเดล scope ต่อผู้ใช้แบบแคบ
- token/password ของ Gateway ที่ถูกต้องสำหรับ endpoint นี้ควรถูกปฏิบัติเหมือน credential ของเจ้าของ/ผู้ปฏิบัติการ
- สำหรับโหมดการยืนยันตัวตนแบบ shared-secret (`token` และ `password`) endpoint จะคืนค่า default ของผู้ปฏิบัติการเต็มรูปแบบตามปกติ แม้ผู้เรียกจะส่ง header `x-openclaw-scopes` ที่แคบกว่า
- การยืนยันตัวตนแบบ shared-secret ยังถือว่าการเรียกใช้เครื่องมือโดยตรงบน endpoint นี้เป็น turn ของผู้ส่งที่เป็นเจ้าของ
- โหมด HTTP ที่มีข้อมูลระบุตัวตนที่เชื่อถือได้ (เช่น การยืนยันตัวตนผ่าน proxy ที่เชื่อถือได้ หรือ `gateway.auth.mode="none"` บน private ingress) จะเคารพ `x-openclaw-scopes` เมื่อมีอยู่ และหากไม่มีจะ fallback ไปยังชุด scope default ของผู้ปฏิบัติการตามปกติ
- ให้เปิด endpoint นี้เฉพาะบน loopback/tailnet/private ingress เท่านั้น; อย่าเปิดเผยโดยตรงสู่ internet สาธารณะ

ตารางการยืนยันตัวตน:

- `gateway.auth.mode="token"` หรือ `"password"` + `Authorization: Bearer ...`
  - พิสูจน์การครอบครอง secret ของผู้ปฏิบัติการ gateway ที่ใช้ร่วมกัน
  - เพิกเฉยต่อ `x-openclaw-scopes` ที่แคบกว่า
  - คืนค่าชุด scope default ของผู้ปฏิบัติการเต็มรูปแบบ:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - ถือว่าการเรียกใช้เครื่องมือโดยตรงบน endpoint นี้เป็น turn ของผู้ส่งที่เป็นเจ้าของ
- โหมด HTTP ที่มีข้อมูลระบุตัวตนที่เชื่อถือได้ (เช่น การยืนยันตัวตนผ่าน proxy ที่เชื่อถือได้ หรือ `gateway.auth.mode="none"` บน private ingress)
  - ยืนยันตัวตนผ่านข้อมูลระบุตัวตนภายนอกที่เชื่อถือได้ หรือขอบเขตการ deploy บางอย่าง
  - เคารพ `x-openclaw-scopes` เมื่อมี header อยู่
  - fallback ไปยังชุด scope default ของผู้ปฏิบัติการตามปกติเมื่อไม่มี header
  - จะเสีย semantics ของเจ้าของก็ต่อเมื่อผู้เรียกจำกัด scope ให้แคบลงอย่างชัดเจนและละ `operator.admin`

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
- `action` (string, ไม่บังคับ): map เข้าไปใน args หาก schema ของเครื่องมือรองรับ `action` และ payload args ไม่ได้ระบุไว้
- `args` (object, ไม่บังคับ): argument เฉพาะของเครื่องมือ
- `sessionKey` (string, ไม่บังคับ): session key เป้าหมาย หากละไว้หรือเป็น `"main"` Gateway จะใช้ session key หลักที่กำหนดค่าไว้ (เคารพ `session.mainKey` และ agent default หรือ `global` ใน scope ระดับ global)
- `dryRun` (boolean, ไม่บังคับ): สงวนไว้สำหรับการใช้งานในอนาคต; ปัจจุบันถูกเพิกเฉย

## พฤติกรรมของนโยบาย + การกำหนดเส้นทาง

ความพร้อมใช้งานของเครื่องมือจะถูกกรองผ่านสายโซ่นโยบายเดียวกับที่ใช้โดย agent ของ Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- นโยบายกลุ่ม (หาก session key map ไปยังกลุ่มหรือช่องทาง)
- นโยบาย subagent (เมื่อเรียกใช้ด้วย session key ของ subagent)

หากเครื่องมือไม่ได้รับอนุญาตตามนโยบาย endpoint จะคืนค่า **404**

หมายเหตุขอบเขตสำคัญ:

- การอนุมัติ Exec เป็น guardrail ของผู้ปฏิบัติการ ไม่ใช่ขอบเขตการอนุญาตแยกต่างหากสำหรับ endpoint HTTP นี้ หากเครื่องมือเข้าถึงได้ที่นี่ผ่านการยืนยันตัวตนของ Gateway + นโยบายเครื่องมือ `/tools/invoke` จะไม่เพิ่ม prompt อนุมัติต่อการเรียกเพิ่มเติม
- อย่าแชร์ credential bearer ของ Gateway กับผู้เรียกที่ไม่น่าเชื่อถือ หากคุณต้องการแยกข้ามขอบเขตความเชื่อถือ ให้รัน gateway แยกกัน (และตามอุดมคติควรใช้ผู้ใช้/host ของ OS แยกกัน)

HTTP ของ Gateway ยังใช้รายการปฏิเสธแบบแข็งตามค่าเริ่มต้นด้วย (แม้นโยบาย session จะอนุญาตเครื่องมือนั้น):

- `exec` - การดำเนินคำสั่งโดยตรง (พื้นผิว RCE)
- `spawn` - การสร้าง child process ตามอำเภอใจ (พื้นผิว RCE)
- `shell` - การดำเนินคำสั่ง shell (พื้นผิว RCE)
- `fs_write` - การเปลี่ยนแปลงไฟล์ตามอำเภอใจบน host
- `fs_delete` - การลบไฟล์ตามอำเภอใจบน host
- `fs_move` - การย้าย/เปลี่ยนชื่อไฟล์ตามอำเภอใจบน host
- `apply_patch` - การใช้ patch สามารถเขียนไฟล์ใดๆ ใหม่ได้
- `sessions_spawn` - การจัดการ session; การ spawn agent จากระยะไกลคือ RCE
- `sessions_send` - การแทรกข้อความข้าม session
- `cron` - control plane ของ automation แบบถาวร
- `gateway` - control plane ของ gateway; ป้องกันการกำหนดค่าใหม่ผ่าน HTTP
- `nodes` - การ relay คำสั่ง node สามารถเข้าถึง system.run บน host ที่จับคู่ไว้
- `whatsapp_login` - การตั้งค่าแบบโต้ตอบที่ต้องสแกน QR ผ่าน terminal; จะค้างบน HTTP

คุณสามารถปรับแต่งรายการปฏิเสธนี้ได้ผ่าน `gateway.tools`:

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

เพื่อช่วยให้นโยบายกลุ่ม resolve บริบท คุณสามารถตั้งค่าได้ตามต้องการ:

- `x-openclaw-message-channel: <channel>` (ตัวอย่าง: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (เมื่อมีหลายบัญชี)

## การตอบกลับ

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (คำขอไม่ถูกต้องหรือข้อผิดพลาด input ของเครื่องมือ)
- `401` → ไม่ได้รับอนุญาต
- `429` → ถูกจำกัดอัตราการยืนยันตัวตน (`Retry-After` ถูกตั้งค่า)
- `404` → เครื่องมือไม่พร้อมใช้งาน (ไม่พบหรือไม่อยู่ในรายการที่อนุญาต)
- `405` → method ไม่ได้รับอนุญาต
- `500` → `{ ok: false, error: { type, message } }` (ข้อผิดพลาดการดำเนินเครื่องมือที่ไม่คาดคิด; ข้อความถูก sanitized)

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
