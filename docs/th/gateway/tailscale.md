---
read_when:
    - การเปิดให้เข้าถึงส่วนติดต่อผู้ใช้สำหรับควบคุม Gateway จากภายนอก localhost
    - การทำให้การเข้าถึง tailnet หรือแดชบอร์ดสาธารณะเป็นอัตโนมัติ
summary: ผสานรวม Tailscale Serve/Funnel สำหรับแดชบอร์ด Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-05-10T19:40:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3a90145b9884f31d43fabaddabe17e6ba017dabaec6e6e7d263dacefb33f1b6
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw สามารถกำหนดค่า Tailscale **Serve** (tailnet) หรือ **Funnel** (สาธารณะ) โดยอัตโนมัติสำหรับ
แดชบอร์ด Gateway และพอร์ต WebSocket ซึ่งทำให้ Gateway ยังคงผูกอยู่กับ loopback ขณะที่
Tailscale ให้บริการ HTTPS, การกำหนดเส้นทาง และ (สำหรับ Serve) ส่วนหัวระบุตัวตน

## โหมด

- `serve`: Serve สำหรับ Tailnet เท่านั้นผ่าน `tailscale serve` gateway จะยังอยู่บน `127.0.0.1`
- `funnel`: HTTPS สาธารณะผ่าน `tailscale funnel` OpenClaw ต้องใช้รหัสผ่านที่ใช้ร่วมกัน
- `off`: ค่าเริ่มต้น (ไม่มีการทำงานอัตโนมัติของ Tailscale)

เอาต์พุตสถานะและการตรวจสอบใช้ **การเปิดเผยผ่าน Tailscale** สำหรับโหมด Serve/Funnel
ของ OpenClaw นี้ `off` หมายความว่า OpenClaw ไม่ได้จัดการ Serve หรือ Funnel ไม่ได้หมายความว่า
daemon ของ Tailscale ในเครื่องหยุดทำงานหรือออกจากระบบแล้ว

## การยืนยันตัวตน

ตั้งค่า `gateway.auth.mode` เพื่อควบคุม handshake:

- `none` (ทางเข้าที่เป็นส่วนตัวเท่านั้น)
- `token` (ค่าเริ่มต้นเมื่อมีการตั้งค่า `OPENCLAW_GATEWAY_TOKEN`)
- `password` (ความลับที่ใช้ร่วมกันผ่าน `OPENCLAW_GATEWAY_PASSWORD` หรือ config)
- `trusted-proxy` (พร็อกซีย้อนกลับที่รับรู้ตัวตน; ดู [การยืนยันตัวตนผ่านพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth))

เมื่อ `tailscale.mode = "serve"` และ `gateway.auth.allowTailscale` เป็น `true`,
การยืนยันตัวตนของ Control UI/WebSocket สามารถใช้ส่วนหัวระบุตัวตนของ Tailscale
(`tailscale-user-login`) ได้โดยไม่ต้องระบุ token/password OpenClaw ตรวจสอบ
ตัวตนโดยแก้ไขที่อยู่ `x-forwarded-for` ผ่าน daemon ของ Tailscale ในเครื่อง
(`tailscale whois`) และจับคู่กับส่วนหัวก่อนยอมรับ
OpenClaw จะถือว่าคำขอเป็น Serve เฉพาะเมื่อคำขอมาจาก loopback พร้อมส่วนหัว
`x-forwarded-for`, `x-forwarded-proto` และ `x-forwarded-host`
ของ Tailscale เท่านั้น
สำหรับเซสชันตัวดำเนินการของ Control UI ที่มีตัวตนอุปกรณ์เบราว์เซอร์ เส้นทาง Serve
ที่ผ่านการตรวจสอบนี้จะข้ามรอบการจับคู่อุปกรณ์ด้วย แต่ไม่ได้ข้าม
ตัวตนอุปกรณ์เบราว์เซอร์: ไคลเอนต์ที่ไม่มีอุปกรณ์ยังคงถูกปฏิเสธ และการเชื่อมต่อ WebSocket
แบบ node-role หรือที่ไม่ใช่ Control UI ยังคงทำตามการจับคู่และ
การตรวจสอบการยืนยันตัวตนตามปกติ
ปลายทาง HTTP API (ตัวอย่างเช่น `/v1/*`, `/tools/invoke` และ `/api/channels/*`)
**ไม่** ใช้การยืนยันตัวตนผ่านส่วนหัวระบุตัวตนของ Tailscale แต่ยังคงทำตามโหมดการยืนยันตัวตน HTTP
ปกติของ gateway: การยืนยันตัวตนด้วยความลับที่ใช้ร่วมกันเป็นค่าเริ่มต้น หรือการตั้งค่า
trusted-proxy / private-ingress `none` ที่กำหนดไว้โดยตั้งใจ
โฟลว์แบบไม่ใช้ token นี้ถือว่าโฮสต์ gateway เชื่อถือได้ หากโค้ดในเครื่องที่ไม่น่าเชื่อถือ
อาจทำงานบนโฮสต์เดียวกัน ให้ปิดใช้ `gateway.auth.allowTailscale` และกำหนดให้ใช้
การยืนยันตัวตนด้วย token/password แทน
หากต้องการบังคับใช้ข้อมูลรับรองความลับที่ใช้ร่วมกันอย่างชัดเจน ให้ตั้งค่า `gateway.auth.allowTailscale: false`
และใช้ `gateway.auth.mode: "token"` หรือ `"password"`

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

### Tailnet เท่านั้น (ผูกกับ IP ของ Tailnet)

ใช้สิ่งนี้เมื่อคุณต้องการให้ Gateway รับฟังโดยตรงบน IP ของ Tailnet (ไม่มี Serve/Funnel)

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

เชื่อมต่อจากอุปกรณ์ Tailnet อีกเครื่อง:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Loopback (`http://127.0.0.1:18789`) จะ **ไม่** ทำงานในโหมดนี้
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

แนะนำให้ใช้ `OPENCLAW_GATEWAY_PASSWORD` แทนการ commit รหัสผ่านลงดิสก์

## ตัวอย่าง CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## หมายเหตุ

- Tailscale Serve/Funnel ต้องติดตั้ง CLI ของ `tailscale` และเข้าสู่ระบบแล้ว
- `tailscale.mode: "funnel"` จะปฏิเสธการเริ่มทำงาน เว้นแต่ว่าโหมดการยืนยันตัวตนคือ `password` เพื่อหลีกเลี่ยงการเปิดเผยสู่สาธารณะ
- ตั้งค่า `gateway.tailscale.resetOnExit` หากคุณต้องการให้ OpenClaw ย้อนกลับการกำหนดค่า `tailscale serve`
  หรือ `tailscale funnel` เมื่อปิดการทำงาน
- ตั้งค่า `gateway.tailscale.preserveFunnel: true` เพื่อคงเส้นทาง
  `tailscale funnel` ที่กำหนดค่าจากภายนอกให้ทำงานต่อไปข้ามการรีสตาร์ต gateway เมื่อเปิดใช้และ
  gateway ทำงานใน `mode: "serve"` OpenClaw จะตรวจสอบ `tailscale funnel status`
  ก่อนใช้ Serve ซ้ำ และข้ามขั้นตอนนั้นเมื่อมีเส้นทาง Funnel ที่ครอบคลุม
  พอร์ต gateway อยู่แล้ว นโยบาย Funnel แบบรหัสผ่านเท่านั้นที่ OpenClaw จัดการยังคงไม่เปลี่ยนแปลง
- `gateway.bind: "tailnet"` คือการผูกกับ Tailnet โดยตรง (ไม่มี HTTPS, ไม่มี Serve/Funnel)
- `gateway.bind: "auto"` จะเลือก loopback ก่อน; ใช้ `tailnet` หากคุณต้องการ Tailnet เท่านั้น
- Serve/Funnel เปิดเผยเฉพาะ **UI ควบคุม Gateway + WS** เท่านั้น Nodes เชื่อมต่อผ่าน
  ปลายทาง Gateway WS เดียวกัน ดังนั้น Serve จึงใช้สำหรับการเข้าถึง node ได้

## การควบคุมเบราว์เซอร์ (Gateway ระยะไกล + เบราว์เซอร์ในเครื่อง)

หากคุณเรียกใช้ Gateway บนเครื่องหนึ่งแต่ต้องการควบคุมเบราว์เซอร์บนอีกเครื่องหนึ่ง
ให้เรียกใช้ **โฮสต์ node** บนเครื่องเบราว์เซอร์ และให้ทั้งสองอยู่บน tailnet เดียวกัน
Gateway จะพร็อกซีการดำเนินการของเบราว์เซอร์ไปยัง node; ไม่ต้องใช้เซิร์ฟเวอร์ควบคุมหรือ URL ของ Serve แยกต่างหาก

หลีกเลี่ยง Funnel สำหรับการควบคุมเบราว์เซอร์; ให้ถือว่าการจับคู่ node เหมือนการเข้าถึงของตัวดำเนินการ

## ข้อกำหนดเบื้องต้นและข้อจำกัดของ Tailscale

- Serve ต้องเปิดใช้ HTTPS สำหรับ tailnet ของคุณ; CLI จะแจ้งเตือนหากยังไม่มี
- Serve แทรกส่วนหัวระบุตัวตนของ Tailscale; Funnel ไม่ทำเช่นนั้น
- Funnel ต้องใช้ Tailscale v1.38.3+, MagicDNS, เปิดใช้ HTTPS และแอตทริบิวต์ node สำหรับ funnel
- Funnel รองรับเฉพาะพอร์ต `443`, `8443` และ `10000` ผ่าน TLS
- Funnel บน macOS ต้องใช้แอป Tailscale รุ่นโอเพนซอร์ส

## เรียนรู้เพิ่มเติม

- ภาพรวม Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- คำสั่ง `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- ภาพรวม Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- คำสั่ง `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## ที่เกี่ยวข้อง

- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [การค้นพบ](/th/gateway/discovery)
- [การยืนยันตัวตน](/th/gateway/authentication)
