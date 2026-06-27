---
read_when:
    - การสร้างเครื่องมือโฮสต์ที่ไม่สามารถใช้ไคลเอนต์ Gateway WebSocket RPC ได้
    - เปิดเผยระบบอัตโนมัติสำหรับผู้ดูแล Gateway ไว้หลัง ingress ส่วนตัวที่เชื่อถือได้
    - การตรวจสอบโมเดลความปลอดภัยสำหรับการเข้าถึง HTTP ไปยังเมธอดของ Gateway
summary: เปิดเผยเมธอด control-plane ของ Gateway ที่เลือกผ่าน Plugin admin-http-rpc ที่รวมมาให้และเลือกเปิดใช้ได้
title: Plugin HTTP RPC สำหรับผู้ดูแลระบบ
x-i18n:
    generated_at: "2026-06-27T17:50:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f701ef6be7457cd518ecb80b7ec5dade61bb057d62f4ca90984a4c1aa8fdf700
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Plugin `admin-http-rpc` ที่มาพร้อมชุดเผยแพร่เปิดเผยเมธอด control-plane ของ Gateway ที่เลือกไว้ผ่าน HTTP สำหรับระบบอัตโนมัติบนโฮสต์ที่เชื่อถือได้ซึ่งไม่สามารถใช้ไคลเอนต์ RPC ผ่าน WebSocket ของ Gateway ตามปกติได้

Plugin นี้รวมมากับ OpenClaw แต่ปิดไว้โดยค่าเริ่มต้น เมื่อปิดใช้งาน เส้นทางจะไม่ถูกลงทะเบียน เมื่อเปิดใช้งาน จะเพิ่ม:

- `POST /api/v1/admin/rpc`
- listener เดียวกับ Gateway: `http://<gateway-host>:<port>/api/v1/admin/rpc`

เปิดใช้งานเฉพาะสำหรับเครื่องมือโฮสต์ส่วนตัว ระบบอัตโนมัติบน tailnet หรือ ingress ภายในที่เชื่อถือได้เท่านั้น อย่าเปิดเผยเส้นทางนี้โดยตรงต่ออินเทอร์เน็ตสาธารณะ

## ก่อนเปิดใช้งาน

RPC ผู้ดูแลผ่าน HTTP เป็นพื้นผิว control-plane สำหรับผู้ปฏิบัติการแบบเต็มรูปแบบ ผู้เรียกใดก็ตามที่ผ่านการยืนยันตัวตน HTTP ของ Gateway สามารถเรียกเมธอดใน allowlist บนหน้านี้ได้

ใช้เมื่อเงื่อนไขทั้งหมดนี้เป็นจริง:

- ผู้เรียกได้รับความไว้วางใจให้ปฏิบัติการ Gateway
- ผู้เรียกไม่สามารถใช้ไคลเอนต์ RPC ผ่าน WebSocket ได้
- เส้นทางเข้าถึงได้เฉพาะบน loopback, tailnet หรือ ingress ส่วนตัวที่ยืนยันตัวตนแล้ว
- คุณได้ตรวจสอบเมธอดที่อนุญาตแล้ว และเมธอดเหล่านั้นตรงกับระบบอัตโนมัติที่คุณวางแผนจะรัน

ใช้เส้นทาง RPC ผ่าน WebSocket สำหรับไคลเอนต์ OpenClaw และเครื่องมือแบบโต้ตอบที่สามารถคงการเชื่อมต่อ WebSocket ของ Gateway ไว้ได้

## เปิดใช้งาน

เปิดใช้งาน Plugin ที่มาพร้อมชุดเผยแพร่:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Config">
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

เส้นทางจะถูกลงทะเบียนระหว่างการเริ่มต้น Plugin รีสตาร์ท Gateway หลังจากเปลี่ยนการกำหนดค่า Plugin

ปิดใช้งานเมื่อคุณไม่ต้องการพื้นผิว HTTP อีกต่อไป:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## ตรวจสอบเส้นทาง

ใช้ `health` เป็นคำขอที่ปลอดภัยที่สุดและเล็กที่สุด:

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

เมื่อ Plugin ถูกปิดใช้งาน เส้นทางจะส่งคืน `404` เพราะไม่ได้ลงทะเบียนไว้

## การยืนยันตัวตน

เส้นทางของ Plugin ใช้การยืนยันตัวตน HTTP ของ Gateway

เส้นทางการยืนยันตัวตนที่พบบ่อย:

- การยืนยันตัวตนด้วย shared-secret (`gateway.auth.mode="token"` หรือ `"password"`): `Authorization: Bearer <token-or-password>`
- การยืนยันตัวตน HTTP ที่มีตัวตนที่เชื่อถือได้ (`gateway.auth.mode="trusted-proxy"`): ส่งผ่านพร็อกซีที่รับรู้ตัวตนตามที่กำหนดค่าไว้ และให้พร็อกซีนั้นฉีดส่วนหัวตัวตนที่จำเป็น
- การยืนยันตัวตนแบบเปิดสำหรับ ingress ส่วนตัว (`gateway.auth.mode="none"`): ไม่ต้องมีส่วนหัวการยืนยันตัวตน

## โมเดลความปลอดภัย

ปฏิบัติต่อ Plugin นี้เป็นพื้นผิวผู้ปฏิบัติการ Gateway แบบเต็มรูปแบบ

- การเปิดใช้งาน Plugin จงใจให้เข้าถึงเมธอด RPC ผู้ดูแลใน allowlist ที่ `/api/v1/admin/rpc`
- Plugin ประกาศสัญญา manifest ที่สงวนไว้ `contracts.gatewayMethodDispatch: ["authenticated-request"]` เพื่อให้เส้นทาง HTTP ที่ยืนยันตัวตนกับ Gateway แล้วสามารถ dispatch เมธอด control-plane ภายในโปรเซสได้
- การยืนยันตัวตน bearer ด้วย shared-secret พิสูจน์การครอบครองความลับผู้ปฏิบัติการของ gateway
- สำหรับการยืนยันตัวตนแบบ `token` และ `password` ส่วนหัว `x-openclaw-scopes` ที่แคบกว่าจะถูกละเว้น และค่าเริ่มต้นผู้ปฏิบัติการเต็มรูปแบบตามปกติจะถูกคืนค่า
- โหมด HTTP ที่มีตัวตนที่เชื่อถือได้จะเคารพ `x-openclaw-scopes` เมื่อมีอยู่
- `gateway.auth.mode="none"` หมายความว่าเส้นทางนี้ไม่มีการยืนยันตัวตนหาก Plugin เปิดใช้งานอยู่ ใช้เฉพาะหลัง ingress ส่วนตัวที่คุณเชื่อถืออย่างเต็มที่เท่านั้น
- คำขอ dispatch ผ่านตัวจัดการเมธอด Gateway และการตรวจสอบ scope เดียวกับ RPC ผ่าน WebSocket หลังจากการยืนยันตัวตนของเส้นทาง Plugin ผ่านแล้ว
- เก็บเส้นทางนี้ไว้บน loopback, tailnet หรือ ingress ส่วนตัวที่เชื่อถือได้ อย่าเปิดเผยโดยตรงต่ออินเทอร์เน็ตสาธารณะ
- สัญญา manifest ของ Plugin ไม่ใช่ sandbox สัญญาเหล่านี้ป้องกันการใช้ตัวช่วย SDK ที่สงวนไว้โดยไม่ตั้งใจ Plugin ที่เชื่อถือได้ยังคงรันในโปรเซส Gateway

ใช้ gateway แยกกันเมื่อผู้เรียกข้ามขอบเขตความไว้วางใจ

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

- `id` (สตริง, ไม่บังคับ): คัดลอกเข้าไปในการตอบกลับ UUID จะถูกสร้างเมื่อไม่ระบุ
- `method` (สตริง, จำเป็น): ชื่อเมธอด Gateway ที่อนุญาต
- `params` (ค่าใดก็ได้, ไม่บังคับ): params เฉพาะเมธอด

ขนาดเนื้อหาคำขอสูงสุดเริ่มต้นคือ 1 MB

## การตอบกลับ

การตอบกลับที่สำเร็จใช้รูปแบบ RPC ของ Gateway:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

ข้อผิดพลาดของเมธอด Gateway ใช้:

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

สถานะ HTTP จะตามข้อผิดพลาดของ Gateway เมื่อเป็นไปได้ ตัวอย่างเช่น `INVALID_REQUEST` ส่งคืน `400` และ `UNAVAILABLE` ส่งคืน `503`

## เมธอดที่อนุญาต

- การค้นพบ: `commands.list`
  ส่งคืนชื่อเมธอด RPC ผ่าน HTTP ที่ Plugin นี้อนุญาต
- gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- การกำหนดค่า: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- ช่องทาง: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- เว็บ: `web.login.start`, `web.login.wait`
- โมเดล: `models.list`, `models.authStatus`
- เอเจนต์: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- การอนุมัติ: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- อุปกรณ์: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- โหนด: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- งาน: `tasks.list`, `tasks.get`, `tasks.cancel`
- การวินิจฉัย: `doctor.memory.status`, `update.status`

เมธอด Gateway อื่นจะถูกบล็อกจนกว่าจะถูกเพิ่มอย่างตั้งใจ

## การเปรียบเทียบกับ WebSocket

เส้นทาง RPC ผ่าน WebSocket ของ Gateway ตามปกติยังคงเป็น API control-plane ที่แนะนำสำหรับไคลเอนต์ OpenClaw ใช้ RPC ผู้ดูแลผ่าน HTTP เฉพาะสำหรับเครื่องมือโฮสต์ที่ต้องการพื้นผิว HTTP แบบคำขอ/การตอบกลับ

ไคลเอนต์ WebSocket แบบ shared-token ที่ไม่มีตัวตนอุปกรณ์ที่เชื่อถือได้ไม่สามารถประกาศ scope ผู้ดูแลด้วยตนเองระหว่างการเชื่อมต่อได้ RPC ผู้ดูแลผ่าน HTTP ตั้งใจทำตามโมเดลผู้ปฏิบัติการ HTTP ที่เชื่อถือได้ที่มีอยู่: เมื่อ Plugin เปิดใช้งาน การยืนยันตัวตน bearer ด้วย shared-secret จะถือเป็นการเข้าถึงแบบผู้ปฏิบัติการเต็มรูปแบบสำหรับพื้นผิวผู้ดูแลนี้

## การแก้ไขปัญหา

`404 Not Found`

: Plugin ถูกปิดใช้งาน, Gateway ยังไม่ได้รีสตาร์ทหลังเปิดใช้งาน หรือคำขอถูกส่งไปยังโปรเซส Gateway อื่น

`401 Unauthorized`

: คำขอไม่ผ่านการยืนยันตัวตน HTTP ของ Gateway ตรวจสอบ bearer token หรือส่วนหัวตัวตนของ trusted-proxy

`400 INVALID_REQUEST`

: เนื้อหาคำขอไม่ใช่ JSON ที่ถูกต้อง, ฟิลด์ `method` หายไป หรือเมธอดไม่ได้อยู่ใน allowlist ของ Plugin

`503 UNAVAILABLE`

: ตัวจัดการเมธอด Gateway ไม่พร้อมใช้งาน ตรวจสอบบันทึก Gateway แล้วลองใหม่หลัง Gateway เริ่มต้นเสร็จ

## ที่เกี่ยวข้อง

- [Scope ผู้ปฏิบัติการ](/th/gateway/operator-scopes)
- [ความปลอดภัยของ Gateway](/th/gateway/security)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [Manifest ของ Plugin](/th/plugins/manifest#contracts)
- [Subpath ของ SDK](/th/plugins/sdk-subpaths)
