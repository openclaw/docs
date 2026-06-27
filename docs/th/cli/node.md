---
read_when:
    - การเรียกใช้โฮสต์ Node แบบไม่มีส่วนติดต่อผู้ใช้
    - จับคู่โหนดที่ไม่ใช่ macOS สำหรับ system.run
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw node` (โฮสต์ Node แบบไม่มีส่วนติดต่อผู้ใช้)
title: Node
x-i18n:
    generated_at: "2026-06-27T17:21:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03a1b02e90f8f5f7edcfb2e7fd75ef0cbbdeae79dc0ce91339f31a80daeaaa92
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

เรียกใช้**โฮสต์ Node แบบ headless** ที่เชื่อมต่อกับ Gateway WebSocket และเปิดให้ใช้
`system.run` / `system.which` บนเครื่องนี้

## ทำไมต้องใช้โฮสต์ Node?

ใช้โฮสต์ Node เมื่อคุณต้องการให้เอเจนต์**เรียกใช้คำสั่งบนเครื่องอื่น** ใน
เครือข่ายของคุณโดยไม่ต้องติดตั้งแอป companion ของ macOS แบบเต็มที่นั่น

กรณีใช้งานทั่วไป:

- เรียกใช้คำสั่งบนเครื่อง Linux/Windows ระยะไกล (เซิร์ฟเวอร์บิลด์ เครื่องแล็บ NAS)
- ให้ exec อยู่ใน**แซนด์บ็อกซ์**บน Gateway แต่ส่งต่อการเรียกใช้ที่อนุมัติแล้วไปยังโฮสต์อื่น
- จัดเตรียมเป้าหมายการประมวลผลแบบ headless ที่เบา สำหรับระบบอัตโนมัติหรือโหนด CI

การประมวลผลยังคงถูกควบคุมด้วย**การอนุมัติ exec** และ allowlist ต่อเอเจนต์บน
โฮสต์ Node คุณจึงจำกัดและระบุสิทธิ์การเข้าถึงคำสั่งได้อย่างชัดเจน

## พร็อกซีเบราว์เซอร์ (ไม่ต้องกำหนดค่า)

โฮสต์ Node จะประกาศพร็อกซีเบราว์เซอร์โดยอัตโนมัติ หาก `browser.enabled` ไม่ได้
ถูกปิดใช้งานบนโหนด ซึ่งช่วยให้เอเจนต์ใช้ระบบอัตโนมัติของเบราว์เซอร์บนโหนดนั้น
ได้โดยไม่ต้องกำหนดค่าเพิ่มเติม

ตามค่าเริ่มต้น พร็อกซีจะเปิดเผยพื้นผิวโปรไฟล์เบราว์เซอร์ปกติของโหนด หากคุณ
ตั้งค่า `nodeHost.browserProxy.allowProfiles` พร็อกซีจะกลายเป็นแบบจำกัด:
การกำหนดเป้าหมายโปรไฟล์ที่ไม่อยู่ใน allowlist จะถูกปฏิเสธ และเส้นทาง
สร้าง/ลบโปรไฟล์แบบถาวรจะถูกบล็อกผ่านพร็อกซี

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

## เรียกใช้ (foreground)

```bash
openclaw node run --host <gateway-host> --port 18789
```

ตัวเลือก:

- `--host <host>`: โฮสต์ Gateway WebSocket (ค่าเริ่มต้น: `127.0.0.1`)
- `--port <port>`: พอร์ต Gateway WebSocket (ค่าเริ่มต้น: `18789`)
- `--tls`: ใช้ TLS สำหรับการเชื่อมต่อ Gateway
- `--tls-fingerprint <sha256>`: fingerprint ใบรับรอง TLS ที่คาดไว้ (sha256)
- `--node-id <id>`: แทนที่ id ของโหนด (ล้างโทเค็นการจับคู่)
- `--display-name <name>`: แทนที่ชื่อที่แสดงของโหนด

## การยืนยันตัวตน Gateway สำหรับโฮสต์ Node

`openclaw node run` และ `openclaw node install` resolve การยืนยันตัวตน Gateway จาก config/env (ไม่มีแฟล็ก `--token`/`--password` บนคำสั่ง node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` จะถูกตรวจสอบก่อน
- จากนั้น fallback ไปยัง config ภายในเครื่อง: `gateway.auth.token` / `gateway.auth.password`
- ในโหมด local โฮสต์ Node จะไม่สืบทอด `gateway.remote.token` / `gateway.remote.password` โดยตั้งใจ
- หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าไว้อย่างชัดเจนผ่าน SecretRef และยัง resolve ไม่ได้ การ resolve การยืนยันตัวตนของโหนดจะ fail closed (ไม่มี remote fallback มาบดบัง)
- ใน `gateway.mode=remote` ฟิลด์ไคลเอนต์ระยะไกล (`gateway.remote.token` / `gateway.remote.password`) จะมีสิทธิ์ใช้ได้ตามกฎลำดับความสำคัญของ remote ด้วย
- การ resolve การยืนยันตัวตนของโฮสต์ Node จะเคารพเฉพาะตัวแปร env `OPENCLAW_GATEWAY_*`

สำหรับโหนดที่เชื่อมต่อกับ Gateway แบบ plaintext `ws://` จะยอมรับ loopback,
literal ของ IP ส่วนตัว, `.local`, และโฮสต์ Tailnet `*.ts.net` สำหรับชื่อ
private-DNS อื่นที่เชื่อถือได้ ให้ตั้งค่า `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`;
หากไม่มีค่านี้ การเริ่มต้นโหนดจะ fail closed และขอให้คุณใช้ `wss://`, อุโมงค์
SSH หรือ Tailscale นี่เป็นการ opt-in ผ่านสภาพแวดล้อมของโปรเซส ไม่ใช่คีย์ config
ใน `openclaw.json`
`openclaw node install` จะบันทึกค่านี้ไว้ในบริการโหนดที่ถูกควบคุม เมื่อค่านี้
มีอยู่ในสภาพแวดล้อมของคำสั่งติดตั้ง

## บริการ (background)

ติดตั้งโฮสต์ Node แบบ headless เป็นบริการผู้ใช้

```bash
openclaw node install --host <gateway-host> --port 18789
```

ตัวเลือก:

- `--host <host>`: โฮสต์ Gateway WebSocket (ค่าเริ่มต้น: `127.0.0.1`)
- `--port <port>`: พอร์ต Gateway WebSocket (ค่าเริ่มต้น: `18789`)
- `--tls`: ใช้ TLS สำหรับการเชื่อมต่อ Gateway
- `--tls-fingerprint <sha256>`: fingerprint ใบรับรอง TLS ที่คาดไว้ (sha256)
- `--node-id <id>`: แทนที่ id ของโหนด (ล้างโทเค็นการจับคู่)
- `--display-name <name>`: แทนที่ชื่อที่แสดงของโหนด
- `--runtime <runtime>`: รันไทม์ของบริการ (`node` หรือ `bun`)
- `--force`: ติดตั้งใหม่/เขียนทับ หากติดตั้งไว้แล้ว

จัดการบริการ:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

ใช้ `openclaw node run` สำหรับโฮสต์ Node แบบ foreground (ไม่มีบริการ)

คำสั่งบริการยอมรับ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้

โฮสต์ Node จะลองใหม่เมื่อ Gateway รีสตาร์ตและเมื่อเครือข่ายปิดการเชื่อมต่อภายในโปรเซส หาก
Gateway รายงานการหยุดพัก auth แบบ terminal สำหรับโทเค็น/รหัสผ่าน/bootstrap โฮสต์ Node
จะบันทึกรายละเอียดการปิดและออกด้วยสถานะ non-zero เพื่อให้ launchd/systemd สามารถรีสตาร์ตด้วย
config และข้อมูลรับรองใหม่ การหยุดพักที่ต้องจับคู่จะยังคงอยู่ใน flow แบบ foreground
เพื่อให้คำขอที่ค้างอยู่ได้รับการอนุมัติ

## การจับคู่

การเชื่อมต่อครั้งแรกจะสร้างคำขอจับคู่อุปกรณ์ที่รอดำเนินการ (`role: node`) บน Gateway
อนุมัติผ่าน:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

บนเครือข่ายโหนดที่ควบคุมอย่างเข้มงวด ผู้ดูแล Gateway สามารถ opt in อย่างชัดเจน
เพื่ออนุมัติการจับคู่โหนดครั้งแรกจาก CIDR ที่เชื่อถือได้โดยอัตโนมัติ:

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

ค่านี้ปิดใช้งานตามค่าเริ่มต้น ใช้กับการจับคู่ `role: node` ใหม่ที่ไม่มี
scope ที่ร้องขอเท่านั้น ไคลเอนต์ผู้ดูแล/เบราว์เซอร์, Control UI, WebChat และการอัปเกรด role,
scope, metadata หรือ public-key ยังคงต้องได้รับการอนุมัติด้วยตนเอง

หากโหนดลองจับคู่อีกครั้งด้วยรายละเอียด auth ที่เปลี่ยนไป (role/scopes/public key)
คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะสร้าง `requestId` ใหม่
เรียกใช้ `openclaw devices list` อีกครั้งก่อนอนุมัติ

โฮสต์ Node จะเก็บ id โหนด, โทเค็น, ชื่อที่แสดง และข้อมูลการเชื่อมต่อ Gateway ไว้ใน
`~/.openclaw/node.json`

## การอนุมัติ exec

`system.run` ถูกควบคุมด้วยการอนุมัติ exec ภายในเครื่อง:

- `$OPENCLAW_STATE_DIR/exec-approvals.json` หรือ
  `~/.openclaw/exec-approvals.json` เมื่อไม่ได้ตั้งค่าตัวแปร
- [การอนุมัติ exec](/th/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (แก้ไขจาก Gateway)

สำหรับ exec โหนดแบบ async ที่อนุมัติแล้ว OpenClaw จะเตรียม `systemRunPlan` แบบ canonical
ก่อนแจ้งขออนุมัติ การ forward `system.run` ที่อนุมัติภายหลังจะใช้แผนที่จัดเก็บไว้นั้นซ้ำ
ดังนั้นการแก้ไขฟิลด์ command/cwd/session หลังจากสร้างคำขออนุมัติแล้วจะถูกปฏิเสธ
แทนที่จะเปลี่ยนสิ่งที่โหนดประมวลผล

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [โหนด](/th/nodes)
