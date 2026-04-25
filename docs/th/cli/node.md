---
read_when:
    - การรันโฮสต์ Node แบบ headless
    - การจับคู่ Node ที่ไม่ใช่ macOS สำหรับ `system.run`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw node` (โฮสต์ Node แบบ headless)
title: Node
x-i18n:
    generated_at: "2026-04-25T13:44:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8c4b4697da3c0a4594dedd0033a114728ec599a7d33089a33e290e3cfafa5cd
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

รัน **โฮสต์ Node แบบ headless** ที่เชื่อมต่อกับ Gateway WebSocket และเปิดให้ใช้
`system.run` / `system.which` บนเครื่องนี้

## ทำไมจึงควรใช้โฮสต์ Node?

ใช้โฮสต์ Node เมื่อคุณต้องการให้ Agents **รันคำสั่งบนเครื่องอื่น** ในเครือข่ายของคุณ
โดยไม่ต้องติดตั้งแอปคู่หู macOS แบบเต็มบนเครื่องนั้น

กรณีใช้งานทั่วไป:

- รันคำสั่งบนเครื่อง Linux/Windows ระยะไกล (เซิร์ฟเวอร์บิลด์ เครื่องแล็บ NAS)
- เก็บการรัน exec ให้ **sandboxed** บน gateway แต่ส่งต่อการรันที่อนุมัติแล้วไปยังโฮสต์อื่น
- จัดหาเป้าหมายการรันแบบ lightweight และ headless สำหรับระบบอัตโนมัติหรือโหนด CI

การรันยังคงถูกควบคุมด้วย **exec approvals** และ allowlist ราย Agent บน
โฮสต์ Node ดังนั้นคุณจึงสามารถจำกัดขอบเขตการเข้าถึงคำสั่งให้ชัดเจนและเฉพาะเจาะจงได้

## Browser proxy (zero-config)

โฮสต์ Node จะประกาศ browser proxy โดยอัตโนมัติหาก `browser.enabled` บน
โหนดไม่ได้ถูกปิดใช้งาน วิธีนี้ทำให้เอเจนต์สามารถใช้ browser automation บนโหนดนั้นได้
โดยไม่ต้องมีการกำหนดค่าเพิ่มเติม

โดยค่าเริ่มต้น proxy จะเปิดพื้นผิวโปรไฟล์เบราว์เซอร์ตามปกติของโหนด หากคุณ
ตั้งค่า `nodeHost.browserProxy.allowProfiles` proxy จะกลายเป็นแบบจำกัด:
การกำหนดเป้าหมายโปรไฟล์ที่ไม่อยู่ใน allowlist จะถูกปฏิเสธ และเส้นทาง
create/delete สำหรับโปรไฟล์ถาวรจะถูกบล็อกผ่าน proxy

ปิดใช้งานบนโหนดได้หากจำเป็น:

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
- `--tls`: ใช้ TLS สำหรับการเชื่อมต่อกับ Gateway
- `--tls-fingerprint <sha256>`: fingerprint ของใบรับรอง TLS ที่คาดไว้ (sha256)
- `--node-id <id>`: เขียนทับ node id (จะล้างโทเค็นการจับคู่)
- `--display-name <name>`: เขียนทับชื่อที่แสดงของโหนด

## การยืนยันตัวตนของ Gateway สำหรับโฮสต์ Node

`openclaw node run` และ `openclaw node install` จะ resolve การยืนยันตัวตนของ Gateway จาก config/env (ไม่มีแฟล็ก `--token`/`--password` บนคำสั่ง node):

- ตรวจสอบ `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` ก่อน
- จากนั้น fallback ไปยังการกำหนดค่าในเครื่อง: `gateway.auth.token` / `gateway.auth.password`
- ใน local mode โฮสต์ Node จะไม่สืบทอด `gateway.remote.token` / `gateway.remote.password` โดยตั้งใจ
- หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดไว้อย่างชัดเจนผ่าน SecretRef และยัง resolve ไม่ได้ การ resolve การยืนยันตัวตนของ node จะ fail closed (ไม่มี remote fallback มาบดบัง)
- ใน `gateway.mode=remote` ฟิลด์ของ remote client (`gateway.remote.token` / `gateway.remote.password`) ก็อาจถูกใช้ได้ตามกฎลำดับความสำคัญของ remote
- การ resolve การยืนยันตัวตนของโฮสต์ Node จะยอมรับเฉพาะตัวแปร env `OPENCLAW_GATEWAY_*`

สำหรับโหนดที่เชื่อมต่อกับ Gateway แบบ `ws://` ที่ไม่ใช่ loopback บนเครือข่ายส่วนตัวที่เชื่อถือได้
ให้ตั้งค่า `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` หากไม่ตั้งค่า การเริ่มต้น node
จะ fail closed และขอให้คุณใช้ `wss://`, SSH tunnel หรือ Tailscale แทน
นี่เป็นการ opt-in ผ่าน process environment ไม่ใช่คีย์การกำหนดค่าใน `openclaw.json`
`openclaw node install` จะบันทึกค่านี้ลงในบริการ node ที่ถูกควบคุมดูแล
เมื่อมันมีอยู่ใน environment ของคำสั่ง install

## บริการ (background)

ติดตั้งโฮสต์ Node แบบ headless เป็นบริการของผู้ใช้

```bash
openclaw node install --host <gateway-host> --port 18789
```

ตัวเลือก:

- `--host <host>`: โฮสต์ Gateway WebSocket (ค่าเริ่มต้น: `127.0.0.1`)
- `--port <port>`: พอร์ต Gateway WebSocket (ค่าเริ่มต้น: `18789`)
- `--tls`: ใช้ TLS สำหรับการเชื่อมต่อกับ Gateway
- `--tls-fingerprint <sha256>`: fingerprint ของใบรับรอง TLS ที่คาดไว้ (sha256)
- `--node-id <id>`: เขียนทับ node id (จะล้างโทเค็นการจับคู่)
- `--display-name <name>`: เขียนทับชื่อที่แสดงของโหนด
- `--runtime <runtime>`: runtime ของบริการ (`node` หรือ `bun`)
- `--force`: ติดตั้งใหม่/เขียนทับหากติดตั้งอยู่แล้ว

จัดการบริการ:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

ใช้ `openclaw node run` สำหรับโฮสต์ Node แบบ foreground (ไม่ใช่บริการ)

คำสั่งบริการรองรับ `--json` สำหรับผลลัพธ์ที่อ่านได้ด้วยเครื่อง

## การจับคู่

การเชื่อมต่อครั้งแรกจะสร้างคำขอจับคู่อุปกรณ์ที่รอดำเนินการ (`role: node`) บน Gateway
อนุมัติได้ด้วย:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

ในเครือข่ายโหนดที่ควบคุมอย่างเข้มงวด ผู้ดูแลระบบ Gateway สามารถเลือกเปิดใช้
การอนุมัติอัตโนมัติสำหรับการจับคู่โหนดครั้งแรกจาก CIDR ที่เชื่อถือได้โดยชัดเจน:

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

ฟีเจอร์นี้ปิดอยู่เป็นค่าเริ่มต้น และใช้ได้เฉพาะกับการจับคู่ `role: node` ใหม่ที่
ไม่มี scope ที่ร้องขอ Operator/browser clients, Control UI, WebChat และการอัปเกรด
role, scope, metadata หรือ public key ยังคงต้องอนุมัติด้วยตนเอง

หากโหนดลองจับคู่ใหม่ด้วยรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (role/scopes/public key)
คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะมี `requestId` ใหม่ถูกสร้างขึ้น
ให้รัน `openclaw devices list` อีกครั้งก่อนอนุมัติ

โฮสต์ Node จะเก็บ node id, token, display name และข้อมูลการเชื่อมต่อ Gateway ไว้ใน
`~/.openclaw/node.json`

## Exec approvals

`system.run` ถูกควบคุมโดย exec approvals ในเครื่อง:

- `~/.openclaw/exec-approvals.json`
- [Exec approvals](/th/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (แก้ไขจาก Gateway)

สำหรับ node exec แบบ async ที่ได้รับอนุมัติ OpenClaw จะเตรียม `systemRunPlan`
แบบ canonical ก่อนแสดงพรอมป์ การส่งต่อ `system.run` ที่ได้รับอนุมัติในภายหลังจะนำแผนนั้นกลับมาใช้
ดังนั้นการแก้ไขฟิลด์ command/cwd/session หลังจากสร้างคำขออนุมัติแล้วจะถูกปฏิเสธ
แทนที่จะเปลี่ยนสิ่งที่โหนดจะรัน

## ที่เกี่ยวข้อง

- [CLI reference](/th/cli)
- [Nodes](/th/nodes)
