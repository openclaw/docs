---
read_when:
    - การรันโฮสต์ Node แบบ headless
    - การจับคู่ Node ที่ไม่ใช่ macOS สำหรับ `system.run`
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw node` (โฮสต์ Node แบบ headless)
title: Node
x-i18n:
    generated_at: "2026-04-26T11:26:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40f623b163a3c3bcd2d3ff218c5e62a4acba45f7e3f16694d8da62a004b77706
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

รัน**โฮสต์ Node แบบ headless**ที่เชื่อมต่อกับ Gateway WebSocket และเปิดใช้
`system.run` / `system.which` บนเครื่องนี้

## ทำไมจึงควรใช้โฮสต์ Node?

ใช้โฮสต์ Node เมื่อต้องการให้เอเจนต์**รันคำสั่งบนเครื่องอื่น**ในเครือข่ายของคุณ
โดยไม่ต้องติดตั้งแอป macOS companion แบบเต็มบนเครื่องนั้น

กรณีใช้งานที่พบบ่อย:

- รันคำสั่งบนเครื่อง Linux/Windows ระยะไกล (เซิร์ฟเวอร์ build, เครื่องแล็บ, NAS)
- ให้ exec ยังคงถูก**sandboxed**บน gateway แต่ส่งต่องานที่ได้รับอนุมัติไปยังโฮสต์อื่น
- จัดเตรียมเป้าหมายการทำงานแบบเบาและ headless สำหรับระบบอัตโนมัติหรือ Node ของ CI

การรันยังคงถูกควบคุมด้วย**การอนุมัติ exec**และ allowlist รายเอเจนต์บน
โฮสต์ Node ดังนั้นคุณจึงจำกัดขอบเขตการเข้าถึงคำสั่งให้ชัดเจนและชัดแจ้งได้

## Browser proxy (ไม่ต้องตั้งค่า)

โฮสต์ Node จะประกาศ browser proxy โดยอัตโนมัติหาก `browser.enabled` ไม่ได้
ถูกปิดใช้งานบน Node ซึ่งช่วยให้เอเจนต์ใช้ระบบอัตโนมัติของเบราว์เซอร์บน Node นั้น
ได้โดยไม่ต้องตั้งค่าเพิ่มเติม

โดยค่าเริ่มต้น proxy จะเปิดเผยพื้นผิวโปรไฟล์เบราว์เซอร์ตามปกติของ Node หากคุณ
ตั้งค่า `nodeHost.browserProxy.allowProfiles` proxy จะกลายเป็นแบบเข้มงวด:
การกำหนดเป้าหมายโปรไฟล์ที่ไม่อยู่ใน allowlist จะถูกปฏิเสธ และเส้นทาง
create/delete ของ persistent profile จะถูกบล็อกผ่าน proxy

ปิดใช้งานบน Node ได้หากจำเป็น:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## รัน (foreground)

```bash
openclaw node run --host <gateway-host> --port 18789
```

ตัวเลือก:

- `--host <host>`: โฮสต์ Gateway WebSocket (ค่าเริ่มต้น: `127.0.0.1`)
- `--port <port>`: พอร์ต Gateway WebSocket (ค่าเริ่มต้น: `18789`)
- `--tls`: ใช้ TLS สำหรับการเชื่อมต่อ Gateway
- `--tls-fingerprint <sha256>`: fingerprint ของใบรับรอง TLS ที่คาดหวัง (sha256)
- `--node-id <id>`: เขียนทับ node id (ล้าง pairing token)
- `--display-name <name>`: เขียนทับชื่อที่แสดงของ Node

## การยืนยันตัวตน Gateway สำหรับโฮสต์ Node

`openclaw node run` และ `openclaw node install` จะ resolve การยืนยันตัวตนของ gateway จาก config/env (ไม่มีแฟล็ก `--token`/`--password` บนคำสั่ง node):

- ระบบจะตรวจสอบ `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` ก่อน
- จากนั้น fallback ไปยังคอนฟิกในเครื่อง: `gateway.auth.token` / `gateway.auth.password`
- ใน local mode โฮสต์ Node จะไม่สืบทอด `gateway.remote.token` / `gateway.remote.password` โดยเจตนา
- หากมีการกำหนด `gateway.auth.token` / `gateway.auth.password` อย่างชัดเจนผ่าน SecretRef แต่ resolve ไม่ได้ การ resolve การยืนยันตัวตนของ node จะ fail closed (ไม่มี remote fallback มาบดบัง)
- ใน `gateway.mode=remote` ฟิลด์ของ remote client (`gateway.remote.token` / `gateway.remote.password`) ก็ใช้ได้เช่นกันตามกฎลำดับความสำคัญของ remote
- การ resolve การยืนยันตัวตนของโฮสต์ Node จะยอมรับเฉพาะตัวแปร env `OPENCLAW_GATEWAY_*`

สำหรับ Node ที่เชื่อมต่อกับ Gateway แบบ `ws://` ที่ไม่ใช่ loopback บน
เครือข่ายส่วนตัวที่เชื่อถือได้ ให้ตั้งค่า `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`
หากไม่ตั้งค่า การเริ่มต้น Node จะ fail closed และขอให้คุณใช้
`wss://`, SSH tunnel หรือ Tailscale
นี่เป็นการเลือกใช้ผ่าน process environment ไม่ใช่คีย์ config ใน `openclaw.json`
`openclaw node install` จะบันทึกค่านี้ไว้ในบริการ Node ที่ถูกกำกับดูแลเมื่อมัน
มีอยู่ใน environment ของคำสั่ง install

## บริการ (background)

ติดตั้งโฮสต์ Node แบบ headless เป็นบริการของผู้ใช้

```bash
openclaw node install --host <gateway-host> --port 18789
```

ตัวเลือก:

- `--host <host>`: โฮสต์ Gateway WebSocket (ค่าเริ่มต้น: `127.0.0.1`)
- `--port <port>`: พอร์ต Gateway WebSocket (ค่าเริ่มต้น: `18789`)
- `--tls`: ใช้ TLS สำหรับการเชื่อมต่อ Gateway
- `--tls-fingerprint <sha256>`: fingerprint ของใบรับรอง TLS ที่คาดหวัง (sha256)
- `--node-id <id>`: เขียนทับ node id (ล้าง pairing token)
- `--display-name <name>`: เขียนทับชื่อที่แสดงของ Node
- `--runtime <runtime>`: รันไทม์ของบริการ (`node` หรือ `bun`)
- `--force`: ติดตั้งใหม่/เขียนทับหากติดตั้งไว้แล้ว

จัดการบริการ:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

ใช้ `openclaw node run` สำหรับโฮสต์ Node แบบ foreground (ไม่มีบริการ)

คำสั่งบริการรองรับ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้

โฮสต์ Node จะลองใหม่ในโปรเซสเดียวกันเมื่อ Gateway รีสตาร์ตและเมื่อการเชื่อมต่อเครือข่ายปิดลง หาก
Gateway รายงานการหยุดยืนยันตัวตนของ token/password/bootstrap แบบ terminal โฮสต์ Node
จะบันทึกรายละเอียดการปิดและออกด้วยค่าสถานะไม่เป็นศูนย์ เพื่อให้ launchd/systemd สามารถรีสตาร์ตมัน
ด้วยคอนฟิกและข้อมูลรับรองใหม่ การหยุดแบบต้องจับคู่จะยังคงอยู่ในโฟลว์ foreground
เพื่อให้สามารถอนุมัติคำขอที่รอดำเนินการได้

## การจับคู่

การเชื่อมต่อครั้งแรกจะสร้างคำขอจับคู่อุปกรณ์ที่รอดำเนินการ (`role: node`) บน Gateway
อนุมัติได้ผ่าน:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

บนเครือข่าย Node ที่ควบคุมอย่างเข้มงวด ผู้ปฏิบัติงาน Gateway สามารถเลือกเปิดใช้
การอนุมัติอัตโนมัติสำหรับการจับคู่ Node ครั้งแรกจาก CIDR ที่เชื่อถือได้อย่างชัดเจน:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

สิ่งนี้ปิดใช้งานโดยค่าเริ่มต้น และใช้ได้เฉพาะกับการจับคู่ `role: node` ใหม่ที่
ไม่มีการร้องขอ scopes เท่านั้น ไคลเอนต์ operator/browser, Control UI, WebChat รวมถึงการอัปเกรด
role, scope, metadata หรือ public key ยังคงต้องได้รับการอนุมัติด้วยตนเอง

หาก Node ลองจับคู่ใหม่ด้วยรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (role/scopes/public key)
คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะมีการสร้าง `requestId` ใหม่
ให้รัน `openclaw devices list` อีกครั้งก่อนอนุมัติ

โฮสต์ Node จะจัดเก็บ node id, token, ชื่อที่แสดง และข้อมูลการเชื่อมต่อ gateway ไว้ใน
`~/.openclaw/node.json`

## การอนุมัติ exec

`system.run` ถูกควบคุมด้วยการอนุมัติ exec ภายในเครื่อง:

- `~/.openclaw/exec-approvals.json`
- [Exec approvals](/th/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (แก้ไขจาก Gateway)

สำหรับ async node exec ที่ได้รับอนุมัติ OpenClaw จะเตรียม `systemRunPlan`
แบบ canonical ก่อนแสดงพรอมป์ จากนั้นการส่งต่อ `system.run` ที่ได้รับอนุมัติในภายหลังจะนำ plan ที่เก็บไว้นั้นมาใช้ซ้ำ
ดังนั้นการแก้ไขฟิลด์ command/cwd/session หลังจากสร้างคำขออนุมัติแล้วจะถูกปฏิเสธ
แทนที่จะเปลี่ยนสิ่งที่ Node จะรันจริง

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Nodes](/th/nodes)
