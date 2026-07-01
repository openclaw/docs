---
read_when:
    - การเรียกใช้โฮสต์ Node แบบไม่มีส่วนติดต่อผู้ใช้
    - จับคู่โหนดที่ไม่ใช่ macOS สำหรับ system.run
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw node` (โฮสต์ Node แบบ headless)
title: Node
x-i18n:
    generated_at: "2026-07-01T13:28:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e68602cb655a6852544f055b9b6c26f2e9cfe1b4d7933e7c27e67011c7cd55
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

เรียกใช้ **โฮสต์โหนดแบบ headless** ที่เชื่อมต่อกับ Gateway WebSocket และเปิดเผย
`system.run` / `system.which` บนเครื่องนี้

## ทำไมต้องใช้โฮสต์โหนด?

ใช้โฮสต์โหนดเมื่อคุณต้องการให้เอเจนต์ **รันคำสั่งบนเครื่องอื่น** ใน
เครือข่ายของคุณโดยไม่ต้องติดตั้งแอปคู่หู macOS แบบเต็มบนเครื่องนั้น

กรณีใช้งานทั่วไป:

- รันคำสั่งบนเครื่อง Linux/Windows ระยะไกล (เซิร์ฟเวอร์บิลด์, เครื่องแล็บ, NAS)
- คง exec ให้ **อยู่ใน sandbox** บน Gateway แต่ส่งต่องานรันที่อนุมัติแล้วไปยังโฮสต์อื่น
- จัดเตรียมเป้าหมายการดำเนินการแบบ lightweight และ headless สำหรับโหนดอัตโนมัติหรือ CI

การดำเนินการยังคงถูกควบคุมโดย **การอนุมัติ exec** และรายการอนุญาตต่อเอเจนต์บน
โฮสต์โหนด ดังนั้นคุณจึงสามารถจำกัดและระบุสิทธิ์เข้าถึงคำสั่งได้อย่างชัดเจน

## พร็อกซีเบราว์เซอร์ (ไม่ต้องตั้งค่า)

โฮสต์โหนดจะประกาศพร็อกซีเบราว์เซอร์โดยอัตโนมัติถ้า `browser.enabled` ไม่ได้
ถูกปิดใช้งานบนโหนด ซึ่งช่วยให้เอเจนต์ใช้การทำงานอัตโนมัติของเบราว์เซอร์บนโหนดนั้น
โดยไม่ต้องตั้งค่าเพิ่มเติม

ตามค่าเริ่มต้น พร็อกซีจะเปิดเผยพื้นผิวโปรไฟล์เบราว์เซอร์ปกติของโหนด หากคุณ
ตั้งค่า `nodeHost.browserProxy.allowProfiles` พร็อกซีจะกลายเป็นแบบจำกัด:
การกำหนดเป้าหมายโปรไฟล์ที่ไม่ได้อยู่ในรายการอนุญาตจะถูกปฏิเสธ และเส้นทาง
สร้าง/ลบโปรไฟล์ถาวรจะถูกบล็อกผ่านพร็อกซี

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
- `--context-path <path>`: พาธบริบท Gateway WebSocket (เช่น `/openclaw-gw`) จะถูกต่อท้ายกับ WebSocket URL
- `--tls`: ใช้ TLS สำหรับการเชื่อมต่อ Gateway
- `--tls-fingerprint <sha256>`: ลายนิ้วมือใบรับรอง TLS ที่คาดไว้ (sha256)
- `--node-id <id>`: แทนที่รหัสโหนด (ล้างโทเค็นการจับคู่)
- `--display-name <name>`: แทนที่ชื่อที่แสดงของโหนด

## การตรวจสอบสิทธิ์ Gateway สำหรับโฮสต์โหนด

`openclaw node run` และ `openclaw node install` แก้ไขการตรวจสอบสิทธิ์ Gateway จาก config/env (ไม่มีแฟล็ก `--token`/`--password` บนคำสั่งโหนด):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` จะถูกตรวจสอบก่อน
- จากนั้น fallback ไปยัง config ภายในเครื่อง: `gateway.auth.token` / `gateway.auth.password`
- ในโหมด local โฮสต์โหนดจงใจไม่สืบทอด `gateway.remote.token` / `gateway.remote.password`
- หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าอย่างชัดเจนผ่าน SecretRef และแก้ไขไม่ได้ การแก้ไขการตรวจสอบสิทธิ์ของโหนดจะล้มเหลวแบบปิด (ไม่มี remote fallback มาบดบัง)
- ใน `gateway.mode=remote` ฟิลด์ไคลเอนต์ระยะไกล (`gateway.remote.token` / `gateway.remote.password`) จะมีสิทธิ์ใช้งานตามกฎลำดับความสำคัญของระยะไกลด้วย
- การแก้ไขการตรวจสอบสิทธิ์ของโฮสต์โหนดจะรองรับเฉพาะตัวแปร env `OPENCLAW_GATEWAY_*` เท่านั้น

สำหรับโหนดที่เชื่อมต่อกับ Gateway `ws://` แบบข้อความล้วน ระบบจะยอมรับ loopback, ลิเทอรัล IP ส่วนตัว,
`.local` และโฮสต์ Tailnet `*.ts.net` สำหรับชื่อ private-DNS ที่เชื่อถือได้อื่น ๆ
ให้ตั้งค่า `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; หากไม่มีค่านี้
การเริ่มต้นโหนดจะล้มเหลวแบบปิดและขอให้คุณใช้ `wss://`, อุโมงค์ SSH หรือ
Tailscale นี่คือการเลือกใช้ผ่านสภาพแวดล้อมของโปรเซส ไม่ใช่คีย์ config
`openclaw.json`
`openclaw node install` จะคงค่านี้ไว้ในบริการโหนดที่มีการกำกับดูแลเมื่อมีค่านี้
อยู่ในสภาพแวดล้อมของคำสั่งติดตั้ง

## บริการ (background)

ติดตั้งโฮสต์โหนดแบบ headless เป็นบริการผู้ใช้

```bash
openclaw node install --host <gateway-host> --port 18789
```

ตัวเลือก:

- `--host <host>`: โฮสต์ Gateway WebSocket (ค่าเริ่มต้น: `127.0.0.1`)
- `--port <port>`: พอร์ต Gateway WebSocket (ค่าเริ่มต้น: `18789`)
- `--context-path <path>`: พาธบริบท Gateway WebSocket (เช่น `/openclaw-gw`) จะถูกต่อท้ายกับ WebSocket URL
- `--tls`: ใช้ TLS สำหรับการเชื่อมต่อ Gateway
- `--tls-fingerprint <sha256>`: ลายนิ้วมือใบรับรอง TLS ที่คาดไว้ (sha256)
- `--node-id <id>`: แทนที่รหัสโหนด (ล้างโทเค็นการจับคู่)
- `--display-name <name>`: แทนที่ชื่อที่แสดงของโหนด
- `--runtime <runtime>`: runtime ของบริการ (`node` หรือ `bun`)
- `--force`: ติดตั้งใหม่/เขียนทับหากติดตั้งไว้แล้ว

จัดการบริการ:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

ใช้ `openclaw node run` สำหรับโฮสต์โหนดแบบ foreground (ไม่มีบริการ)

คำสั่งบริการยอมรับ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้

โฮสต์โหนดจะลองใหม่เมื่อ Gateway รีสตาร์ทและเมื่อเครือข่ายปิดภายในโปรเซส หาก
Gateway รายงานการหยุดพักการตรวจสอบสิทธิ์โทเค็น/รหัสผ่าน/bootstrap แบบสิ้นสุด โฮสต์โหนดจะ
บันทึกรายละเอียดการปิดและออกด้วยค่าที่ไม่ใช่ศูนย์ เพื่อให้ launchd/systemd สามารถรีสตาร์ทด้วย
config และข้อมูลประจำตัวใหม่ การหยุดพักที่ต้องจับคู่จะยังอยู่ในโฟลว์
foreground เพื่อให้คำขอที่รอดำเนินการได้รับการอนุมัติ

## การจับคู่

การเชื่อมต่อครั้งแรกจะสร้างคำขอจับคู่อุปกรณ์ที่รอดำเนินการ (`role: node`) บน Gateway
อนุมัติผ่าน:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

บนเครือข่ายโหนดที่ควบคุมอย่างเข้มงวด ผู้ปฏิบัติการ Gateway สามารถเลือกใช้อย่างชัดเจน
ให้อนุมัติการจับคู่โหนดครั้งแรกจาก CIDR ที่เชื่อถือได้โดยอัตโนมัติ:

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

ค่านี้ถูกปิดใช้งานตามค่าเริ่มต้น ใช้กับการจับคู่ `role: node` ใหม่ที่
ไม่มี scope ที่ร้องขอเท่านั้น ไคลเอนต์ operator/browser, Control UI, WebChat และการอัปเกรด role,
scope, metadata หรือ public-key ยังต้องอนุมัติด้วยตนเอง

หากโหนดลองจับคู่อีกครั้งด้วยรายละเอียดการตรวจสอบสิทธิ์ที่เปลี่ยนไป (role/scopes/public key)
คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะมีการสร้าง `requestId` ใหม่
รัน `openclaw devices list` อีกครั้งก่อนอนุมัติ

โฮสต์โหนดจัดเก็บรหัสโหนด โทเค็น ชื่อที่แสดง และข้อมูลการเชื่อมต่อ Gateway ไว้ใน
`~/.openclaw/node.json`

## การอนุมัติ exec

`system.run` ถูกควบคุมโดยการอนุมัติ exec ภายในเครื่อง:

- `$OPENCLAW_STATE_DIR/exec-approvals.json` หรือ
  `~/.openclaw/exec-approvals.json` เมื่อไม่ได้ตั้งค่าตัวแปร
- [การอนุมัติ exec](/th/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (แก้ไขจาก Gateway)

สำหรับ exec โหนดแบบ async ที่อนุมัติแล้ว OpenClaw จะเตรียม `systemRunPlan` แบบ canonical
ก่อนแจ้งขออนุมัติ การส่งต่อ `system.run` ที่ได้รับอนุมัติในภายหลังจะนำแผนที่จัดเก็บไว้นั้น
กลับมาใช้ซ้ำ ดังนั้นการแก้ไขฟิลด์ command/cwd/session หลังจากสร้างคำขออนุมัติแล้ว
จะถูกปฏิเสธแทนที่จะเปลี่ยนสิ่งที่โหนดดำเนินการ

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [โหนด](/th/nodes)
