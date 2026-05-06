---
read_when:
    - การเปิดให้เข้าถึง UI ควบคุมของ Gateway จากภายนอก localhost
    - ทำให้การเข้าถึงแดชบอร์ดผ่าน tailnet หรือแบบสาธารณะเป็นอัตโนมัติ
summary: Tailscale Serve/Funnel ที่ผสานรวมสำหรับแดชบอร์ด Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-05-06T17:56:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89a2094dc5d9250b3af2dcc991e83099bdf6fc4039c86358ca57f7e58899196d
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw สามารถกำหนดค่า Tailscale **Serve** (tailnet) หรือ **Funnel** (สาธารณะ) โดยอัตโนมัติสำหรับแดชบอร์ด Gateway และพอร์ต WebSocket ได้ วิธีนี้ทำให้ Gateway ยังคงผูกอยู่กับ loopback ขณะที่ Tailscale จัดการ HTTPS, การกำหนดเส้นทาง และ (สำหรับ Serve) ส่วนหัวระบุตัวตน

## โหมด

- `serve`: Serve เฉพาะ Tailnet ผ่าน `tailscale serve` Gateway ยังคงอยู่บน `127.0.0.1`
- `funnel`: HTTPS สาธารณะผ่าน `tailscale funnel` OpenClaw ต้องใช้รหัสผ่านที่ใช้ร่วมกัน
- `off`: ค่าเริ่มต้น (ไม่มีการทำงานอัตโนมัติของ Tailscale)

เอาต์พุตสถานะและการตรวจสอบใช้ **การเปิดเผยผ่าน Tailscale** สำหรับโหมด OpenClaw Serve/Funnel นี้ `off` หมายความว่า OpenClaw ไม่ได้จัดการ Serve หรือ Funnel ไม่ได้หมายความว่า daemon ของ Tailscale ในเครื่องหยุดทำงานหรือออกจากระบบแล้ว

## การยืนยันตัวตน

ตั้งค่า `gateway.auth.mode` เพื่อควบคุม handshake:

- `none` (private ingress เท่านั้น)
- `token` (ค่าเริ่มต้นเมื่อมีการตั้งค่า `OPENCLAW_GATEWAY_TOKEN`)
- `password` (shared secret ผ่าน `OPENCLAW_GATEWAY_PASSWORD` หรือ config)
- `trusted-proxy` (reverse proxy ที่รับรู้ตัวตน; ดู [การยืนยันตัวตนผ่าน Trusted Proxy](/th/gateway/trusted-proxy-auth))

เมื่อ `tailscale.mode = "serve"` และ `gateway.auth.allowTailscale` เป็น `true`,
การยืนยันตัวตนของ Control UI/WebSocket สามารถใช้ส่วนหัวระบุตัวตนของ Tailscale
(`tailscale-user-login`) ได้โดยไม่ต้องระบุ token/password OpenClaw ตรวจสอบ
ตัวตนโดย resolve ที่อยู่ `x-forwarded-for` ผ่าน daemon ของ Tailscale ในเครื่อง
(`tailscale whois`) และจับคู่กับส่วนหัวก่อนยอมรับ OpenClaw จะถือว่าคำขอเป็น
Serve ก็ต่อเมื่อคำขอมาจาก loopback พร้อมส่วนหัว
`x-forwarded-for`, `x-forwarded-proto` และ `x-forwarded-host` ของ Tailscale
เท่านั้น
สำหรับเซสชันผู้ปฏิบัติงานของ Control UI ที่มีตัวตนอุปกรณ์เบราว์เซอร์ เส้นทาง
Serve ที่ตรวจสอบแล้วนี้จะข้ามรอบไปกลับของการจับคู่อุปกรณ์ด้วย แต่ไม่ได้ข้าม
ตัวตนอุปกรณ์เบราว์เซอร์: client ที่ไม่มีอุปกรณ์ยังคงถูกปฏิเสธ และการเชื่อมต่อ
WebSocket แบบ node-role หรือที่ไม่ใช่ Control UI ยังคงทำตามการจับคู่และการตรวจสอบ
การยืนยันตัวตนตามปกติ
ปลายทาง HTTP API (ตัวอย่างเช่น `/v1/*`, `/tools/invoke` และ `/api/channels/*`)
**ไม่** ใช้การยืนยันตัวตนด้วยส่วนหัวระบุตัวตนของ Tailscale ปลายทางเหล่านี้ยังคง
ทำตามโหมดการยืนยันตัวตน HTTP ปกติของ Gateway: การยืนยันตัวตนด้วย shared-secret
โดยค่าเริ่มต้น หรือการตั้งค่า trusted-proxy / private-ingress `none` ที่ตั้งใจ
กำหนดไว้
ขั้นตอนแบบไม่ใช้ token นี้ถือว่าสามารถเชื่อถือโฮสต์ Gateway ได้ หากโค้ดในเครื่อง
ที่ไม่น่าเชื่อถืออาจทำงานบนโฮสต์เดียวกัน ให้ปิดใช้ `gateway.auth.allowTailscale`
และกำหนดให้ใช้การยืนยันตัวตนด้วย token/password แทน
หากต้องการบังคับใช้ข้อมูลลับแบบ shared-secret อย่างชัดเจน ให้ตั้งค่า
`gateway.auth.allowTailscale: false` และใช้ `gateway.auth.mode: "token"` หรือ
`"password"`

## ตัวอย่าง config

### Tailnet เท่านั้น (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

เปิด: `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดค่าไว้)

### Tailnet เท่านั้น (ผูกกับ Tailnet IP)

ใช้ตัวเลือกนี้เมื่อคุณต้องการให้ Gateway ฟังโดยตรงบน Tailnet IP (ไม่มี Serve/Funnel)

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

เชื่อมต่อจากอุปกรณ์ Tailnet เครื่องอื่น:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Loopback (`http://127.0.0.1:18789`) จะ**ไม่**ทำงานในโหมดนี้
</Note>

### อินเทอร์เน็ตสาธารณะ (Funnel + รหัสผ่านที่ใช้ร่วมกัน)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

ควรใช้ `OPENCLAW_GATEWAY_PASSWORD` แทนการ commit รหัสผ่านลงดิสก์

## ตัวอย่าง CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## หมายเหตุ

- Tailscale Serve/Funnel ต้องติดตั้ง `tailscale` CLI และเข้าสู่ระบบไว้แล้ว
- `tailscale.mode: "funnel"` จะปฏิเสธการเริ่มทำงาน เว้นแต่โหมดการยืนยันตัวตนจะเป็น `password` เพื่อหลีกเลี่ยงการเปิดเผยต่อสาธารณะ
- ตั้งค่า `gateway.tailscale.resetOnExit` หากคุณต้องการให้ OpenClaw ยกเลิกการกำหนดค่า `tailscale serve`
  หรือ `tailscale funnel` เมื่อปิดระบบ
- `gateway.bind: "tailnet"` คือการผูกกับ Tailnet โดยตรง (ไม่มี HTTPS, ไม่มี Serve/Funnel)
- `gateway.bind: "auto"` จะเลือก loopback ก่อน; ใช้ `tailnet` หากคุณต้องการ Tailnet เท่านั้น
- Serve/Funnel เปิดเผยเฉพาะ **Control UI + WS ของ Gateway** เท่านั้น Node เชื่อมต่อผ่าน
  ปลายทาง Gateway WS เดียวกัน ดังนั้น Serve จึงสามารถใช้สำหรับการเข้าถึง Node ได้

## การควบคุมเบราว์เซอร์ (Gateway ระยะไกล + เบราว์เซอร์ในเครื่อง)

หากคุณเรียกใช้ Gateway บนเครื่องหนึ่ง แต่ต้องการควบคุมเบราว์เซอร์บนอีกเครื่องหนึ่ง
ให้เรียกใช้ **โฮสต์ Node** บนเครื่องเบราว์เซอร์ และให้ทั้งสองอยู่บน tailnet เดียวกัน
Gateway จะ proxy การทำงานของเบราว์เซอร์ไปยัง Node โดยไม่ต้องใช้เซิร์ฟเวอร์ควบคุมแยกต่างหากหรือ URL ของ Serve

หลีกเลี่ยง Funnel สำหรับการควบคุมเบราว์เซอร์; ให้ปฏิบัติต่อการจับคู่ Node เหมือนการเข้าถึงของผู้ปฏิบัติงาน

## ข้อกำหนดเบื้องต้น + ข้อจำกัดของ Tailscale

- Serve ต้องเปิดใช้ HTTPS สำหรับ tailnet ของคุณ; CLI จะแจ้งเตือนหากยังไม่มี
- Serve แทรกส่วนหัวระบุตัวตนของ Tailscale; Funnel ไม่ทำเช่นนั้น
- Funnel ต้องใช้ Tailscale v1.38.3+, MagicDNS, เปิดใช้ HTTPS และแอตทริบิวต์ Node สำหรับ funnel
- Funnel รองรับเฉพาะพอร์ต `443`, `8443` และ `10000` ผ่าน TLS
- Funnel บน macOS ต้องใช้แอป Tailscale รุ่นโอเพนซอร์ส

## เรียนรู้เพิ่มเติม

- ภาพรวม Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- คำสั่ง `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- ภาพรวม Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- คำสั่ง `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## ที่เกี่ยวข้อง

- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [การค้นหา](/th/gateway/discovery)
- [การยืนยันตัวตน](/th/gateway/authentication)
