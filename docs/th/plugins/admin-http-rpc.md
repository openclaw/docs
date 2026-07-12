---
read_when:
    - การสร้างเครื่องมือสำหรับโฮสต์ที่ไม่สามารถใช้ไคลเอนต์ RPC ผ่าน WebSocket ของ Gateway ได้
    - เปิดให้ใช้งานระบบอัตโนมัติสำหรับการดูแล Gateway ผ่านจุดรับเข้าที่เชื่อถือได้และเป็นส่วนตัว
    - การตรวจสอบโมเดลความปลอดภัยสำหรับการเข้าถึงเมธอดของ Gateway ผ่าน HTTP
summary: เปิดให้เรียกใช้เมธอดส่วนควบคุมของ Gateway ที่เลือกไว้ผ่าน Plugin `admin-http-rpc` แบบรวมมาให้และต้องเลือกเปิดใช้งานเอง
title: Plugin RPC ผ่าน HTTP สำหรับผู้ดูแลระบบ
x-i18n:
    generated_at: "2026-07-12T16:25:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0709081efd0ce65cef7edac54df9a71978cbad17e2b25df83ac9075de938376c
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Plugin `admin-http-rpc` ที่มาพร้อมระบบเปิดเผยชุดเมธอดในระนาบควบคุมของ Gateway ที่อยู่ในรายการอนุญาตผ่าน HTTP สำหรับระบบอัตโนมัติบนโฮสต์ที่เชื่อถือได้ซึ่งไม่สามารถเปิดการเชื่อมต่อ Gateway WebSocket ค้างไว้ได้

Plugin นี้มาพร้อมกับ OpenClaw แต่ถูกปิดใช้งานโดยค่าเริ่มต้น เมื่อปิดใช้งาน เส้นทางจะไม่ถูกลงทะเบียน เมื่อเปิดใช้งาน ระบบจะเพิ่ม `POST /api/v1/admin/rpc` บนตัวรับฟังเดียวกับ Gateway (`http://<gateway-host>:<port>/api/v1/admin/rpc`)

เปิดใช้งานเฉพาะสำหรับเครื่องมือส่วนตัวบนโฮสต์ ระบบอัตโนมัติบน tailnet หรือทางเข้าภายในที่เชื่อถือได้เท่านั้น ห้ามเปิดเผยเส้นทางนี้ต่ออินเทอร์เน็ตสาธารณะโดยตรง

## ก่อนเปิดใช้งาน

Admin HTTP RPC เป็นพื้นผิวระนาบควบคุมเต็มรูปแบบสำหรับผู้ดูแลระบบ ผู้เรียกใดก็ตามที่ผ่านการยืนยันตัวตน HTTP ของ Gateway สามารถเรียกใช้เมธอดในรายการอนุญาตด้านล่างได้ เปิดใช้งานเฉพาะเมื่อเงื่อนไขทั้งหมดต่อไปนี้เป็นจริง:

- ผู้เรียกได้รับความไว้วางใจให้ควบคุม Gateway
- ผู้เรียกไม่สามารถใช้ไคลเอนต์ WebSocket RPC ได้
- เส้นทางเข้าถึงได้เฉพาะบน local loopback, tailnet หรือทางเข้าส่วนตัวที่ผ่านการยืนยันตัวตน
- คุณได้ตรวจสอบเมธอดที่อนุญาตแล้ว และเมธอดเหล่านั้นตรงกับระบบอัตโนมัติที่คุณวางแผนจะเรียกใช้

สำหรับไคลเอนต์ OpenClaw และเครื่องมือแบบโต้ตอบที่สามารถเปิดการเชื่อมต่อ Gateway WebSocket ค้างไว้ได้ ให้ใช้ WebSocket RPC แทน

## เปิดใช้งาน

เปิดใช้งาน Plugin ที่มาพร้อมระบบ:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="การกำหนดค่า">
    ```json5
    {
      plugins: {
        entries: {
          "admin-http-rpc": { enabled: true },
        },
      },
    }
    ```
  </Tab>
</Tabs>

เส้นทางจะถูกลงทะเบียนระหว่างการเริ่มต้น Plugin ดังนั้นให้รีสตาร์ต Gateway หลังจากเปลี่ยนการกำหนดค่า Plugin

ปิดใช้งานเมื่อคุณไม่ต้องการพื้นผิว HTTP อีกต่อไป:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## ตรวจสอบเส้นทาง

ใช้ `health` เป็นคำขอที่ปลอดภัยและมีขนาดเล็กที่สุด:

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

การตอบกลับที่สำเร็จมี `ok: true`:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

เมื่อ Plugin ถูกปิดใช้งาน เส้นทางจะส่งคืน `404` เนื่องจากไม่ได้ลงทะเบียนไว้

## การยืนยันตัวตน

เส้นทางของ Plugin ใช้การยืนยันตัวตน HTTP ของ Gateway

วิธีการยืนยันตัวตนทั่วไป:

- การยืนยันตัวตนด้วยข้อมูลลับร่วมกัน (`gateway.auth.mode="token"` หรือ `"password"`): `Authorization: Bearer <token-or-password>`
- การยืนยันตัวตน HTTP ที่มีข้อมูลประจำตัวซึ่งเชื่อถือได้ (`gateway.auth.mode="trusted-proxy"`): กำหนดเส้นทางผ่านพร็อกซีที่รับรู้ข้อมูลประจำตัวซึ่งกำหนดค่าไว้ และให้พร็อกซีแทรกส่วนหัวข้อมูลประจำตัวที่จำเป็น
- การยืนยันตัวตนแบบเปิดผ่านทางเข้าส่วนตัว (`gateway.auth.mode="none"`): ไม่ต้องใช้ส่วนหัวการยืนยันตัวตน

## โมเดลความปลอดภัย

ให้ถือว่า Plugin นี้เป็นพื้นผิวเต็มรูปแบบสำหรับผู้ควบคุม Gateway

- การเปิดใช้งาน Plugin เป็นการเปิดให้เข้าถึงเมธอด RPC สำหรับผู้ดูแลระบบที่อยู่ในรายการอนุญาตผ่าน `/api/v1/admin/rpc` โดยเจตนา
- Plugin ประกาศสัญญาแมนิเฟสต์ที่สงวนไว้ `contracts.gatewayMethodDispatch: ["authenticated-request"]` ซึ่งทำให้เส้นทาง HTTP ที่ผ่านการยืนยันตัวตนของ Gateway สามารถส่งเมธอดระนาบควบคุมภายในโปรเซสได้ นี่ไม่ใช่แซนด์บ็อกซ์ สัญญานี้ป้องกันการใช้ตัวช่วย SDK ที่สงวนไว้โดยไม่ตั้งใจ แต่ Plugin ที่เชื่อถือได้ยังคงทำงานภายในโปรเซส Gateway
- การยืนยันตัวตนแบบ bearer ด้วยข้อมูลลับร่วมกัน (โหมด `token`/`password`) พิสูจน์การครอบครองข้อมูลลับของผู้ควบคุม Gateway ส่วนหัว `x-openclaw-scopes` ที่มีขอบเขตแคบกว่าจะถูกละเว้นบนเส้นทางนี้ และค่าเริ่มต้นของผู้ควบคุมเต็มรูปแบบตามปกติจะถูกคืนค่า
- การยืนยันตัวตน HTTP ที่มีข้อมูลประจำตัวซึ่งเชื่อถือได้ (โหมด `trusted-proxy`) จะใช้ `x-openclaw-scopes` เมื่อมี
- `gateway.auth.mode="none"` หมายความว่าเส้นทางนี้ไม่มีการยืนยันตัวตนหากเปิดใช้งาน Plugin ใช้โหมดนี้เฉพาะหลังทางเข้าส่วนตัวที่คุณเชื่อถืออย่างเต็มที่เท่านั้น
- หลังจากการยืนยันตัวตนของเส้นทาง Plugin ผ่านแล้ว คำขอจะถูกส่งผ่านตัวจัดการเมธอดและการตรวจสอบขอบเขตเดียวกับ WebSocket RPC ของ Gateway
- เส้นทางยังคงเข้าถึงได้ระหว่างสัญญาเช่าการระงับที่เตรียมไว้ การตรวจสอบความถูกต้องของคำขอแบบจำกัดขอบเขตและการตอบกลับการค้นพบ `commands.list` ภายในเครื่องยังคงพร้อมใช้งาน สำหรับเมธอดที่ส่งไปยัง Gateway มีเพียง `gateway.suspend.prepare`, `gateway.suspend.status` และ `gateway.suspend.resume` เท่านั้นที่สามารถทำงานได้ขณะปิดรับคำขอ เมธอดอื่นในรายการอนุญาตจะส่งคืนการตอบกลับ `UNAVAILABLE` แบบลองใหม่ได้ตามปกติของ Gateway
- ให้เส้นทางนี้อยู่บน local loopback, tailnet หรือทางเข้าส่วนตัวที่เชื่อถือได้ ห้ามเปิดเผยต่ออินเทอร์เน็ตสาธารณะโดยตรง ใช้ Gateway แยกกันเมื่อผู้เรียกอยู่คนละขอบเขตความไว้วางใจ

## คำขอ

```http
POST /api/v1/admin/rpc
Authorization: Bearer <gateway-token>
Content-Type: application/json
```

```json
{
  "id": "optional-request-id",
  "method": "health",
  "params": {}
}
```

ฟิลด์:

- `id` (สตริง, ไม่บังคับ): คัดลอกไปยังการตอบกลับ หากละเว้น ระบบจะสร้าง UUID
- `method` (สตริง, จำเป็น): ชื่อเมธอด Gateway ที่อนุญาต
- `params` (ค่าใดก็ได้, ไม่บังคับ): พารามิเตอร์เฉพาะของเมธอด

ขนาดสูงสุดเริ่มต้นของเนื้อหาคำขอคือ 1 MB

## การตอบกลับ

การตอบกลับที่สำเร็จใช้รูปแบบ RPC ของ Gateway:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

ข้อผิดพลาดของเมธอด Gateway ใช้รูปแบบต่อไปนี้:

```json
{
  "id": "optional-request-id",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "bad params"
  }
}
```

สถานะ HTTP จะเป็นไปตามรหัสข้อผิดพลาด:

| รหัสข้อผิดพลาด             | สถานะ HTTP |
| -------------------------- | ----------- |
| `INVALID_REQUEST`          | 400         |
| `APPROVAL_NOT_FOUND`       | 404         |
| `NOT_LINKED`, `NOT_PAIRED` | 409         |
| `UNAVAILABLE`              | 503         |
| `AGENT_TIMEOUT`            | 504         |
| รหัสอื่นใด                 | 500         |

## เมธอดที่อนุญาต

- การค้นพบ: `commands.list`
  ส่งคืนชื่อเมธอด HTTP RPC ที่ Plugin นี้อนุญาต
- Gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`, `gateway.suspend.prepare`, `gateway.suspend.status`, `gateway.suspend.resume`
- การกำหนดค่า: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- ช่องทาง: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- เว็บ: `web.login.start`, `web.login.wait`
- โมเดล: `models.list`, `models.authStatus`
- เอเจนต์: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- การอนุมัติ: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- อุปกรณ์: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- Node: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- งาน: `tasks.list`, `tasks.get`, `tasks.cancel`
- การวินิจฉัย: `doctor.memory.status`, `update.status`

เมธอด Gateway อื่นจะถูกบล็อกจนกว่าจะมีการเพิ่มโดยเจตนา

## การเปรียบเทียบกับ WebSocket

เส้นทาง RPC ผ่าน WebSocket ของ Gateway ตามปกติยังคงเป็น API ระนาบควบคุมที่แนะนำสำหรับไคลเอนต์ OpenClaw ใช้ Admin HTTP RPC เฉพาะกับเครื่องมือบนโฮสต์ที่ต้องการพื้นผิว HTTP แบบคำขอ/การตอบกลับ

ไคลเอนต์ WebSocket ที่ใช้โทเค็นร่วมกันและไม่มีข้อมูลประจำตัวของอุปกรณ์ที่เชื่อถือได้ ไม่สามารถประกาศขอบเขตผู้ดูแลระบบด้วยตนเองระหว่างการเชื่อมต่อ Admin HTTP RPC ปฏิบัติตามโมเดลผู้ควบคุม HTTP ที่เชื่อถือได้ซึ่งมีอยู่แล้วโดยเจตนา เมื่อเปิดใช้งาน Plugin การยืนยันตัวตนแบบ bearer ด้วยข้อมูลลับร่วมกันจะถือว่าเป็นสิทธิ์เข้าถึงแบบผู้ควบคุมเต็มรูปแบบสำหรับพื้นผิวผู้ดูแลระบบนี้

## การแก้ไขปัญหา

`404 Not Found`

: Plugin ถูกปิดใช้งาน, Gateway ยังไม่ได้รีสตาร์ตหลังจากเปิดใช้งาน หรือคำขอถูกส่งไปยังกระบวนการ Gateway อื่น

`401 Unauthorized`

: คำขอไม่ผ่านการยืนยันตัวตน HTTP ของ Gateway ตรวจสอบ bearer token หรือส่วนหัวข้อมูลประจำตัวของ trusted proxy

`405 Method Not Allowed`

: คำขอใช้เมธอดอื่นที่ไม่ใช่ `POST`

`413 Payload Too Large`

: เนื้อหาคำขอมีขนาดเกินขีดจำกัด 1 MB

`400 INVALID_REQUEST`

: เนื้อหาคำขอไม่ใช่ JSON ที่ถูกต้อง, ไม่มีฟิลด์ `method`, เมธอดไม่อยู่ในรายการอนุญาตของ Plugin หรือ ID สำหรับดำเนินการต่อจากการระงับไม่ตรงกับสัญญาเช่าที่ใช้งานอยู่

`503 UNAVAILABLE`

: เมธอด Gateway กำลังเริ่มต้น ถูกจำกัดอัตรา ถูกระงับ หรือกำลังรอการดำเนินการระงับ/ดำเนินการต่ออื่นที่แข่งขันกัน ตรวจสอบ `error.details` เมื่อมี และรอเป็นเวลา `error.retryAfterMs` ก่อนลองใหม่

## ที่เกี่ยวข้อง

- [ขอบเขตของผู้ควบคุม](/th/gateway/operator-scopes)
- [ความปลอดภัยของ Gateway](/th/gateway/security)
- [การเข้าถึงจากระยะไกล](/th/gateway/remote)
- [แมนิเฟสต์ของ Plugin](/th/plugins/manifest#contracts-reference)
- [พาธย่อยของ SDK](/th/plugins/sdk-subpaths)
