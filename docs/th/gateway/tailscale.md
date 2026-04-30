---
read_when:
    - การเปิดให้ส่วนติดต่อผู้ใช้สำหรับควบคุมของ Gateway เข้าถึงได้จากภายนอก localhost
    - ทำให้การเข้าถึงแดชบอร์ดผ่าน tailnet หรือแบบสาธารณะเป็นอัตโนมัติ
summary: ผสานรวม Tailscale Serve/Funnel สำหรับแดชบอร์ด Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-30T09:56:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5bc0a90ce8105017f5f52bad4a40609711f4bd4538437916c020680d3e9eda4
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw สามารถตั้งค่า Tailscale **Serve** (tailnet) หรือ **Funnel** (สาธารณะ) อัตโนมัติสำหรับ
แดชบอร์ด Gateway และพอร์ต WebSocket ได้ วิธีนี้ทำให้ Gateway ยังคงผูกกับ loopback ขณะที่
Tailscale ให้บริการ HTTPS, การกำหนดเส้นทาง และส่วนหัวระบุตัวตน (สำหรับ Serve)

## โหมด

- `serve`: Serve เฉพาะ Tailnet ผ่าน `tailscale serve` เกตเวย์ยังคงอยู่ที่ `127.0.0.1`
- `funnel`: HTTPS สาธารณะผ่าน `tailscale funnel` OpenClaw ต้องใช้รหัสผ่านร่วม
- `off`: ค่าเริ่มต้น (ไม่มีการทำงานอัตโนมัติของ Tailscale)

ผลลัพธ์สถานะและการตรวจสอบใช้คำว่า **การเปิดเผยผ่าน Tailscale** สำหรับโหมด Serve/Funnel
ของ OpenClaw นี้ `off` หมายความว่า OpenClaw ไม่ได้จัดการ Serve หรือ Funnel; ไม่ได้หมายความว่า
daemon ของ Tailscale ในเครื่องหยุดทำงานหรือออกจากระบบแล้ว

## การยืนยันตัวตน

ตั้งค่า `gateway.auth.mode` เพื่อควบคุมการจับมือ:

- `none` (ทางเข้าแบบส่วนตัวเท่านั้น)
- `token` (ค่าเริ่มต้นเมื่อมีการตั้งค่า `OPENCLAW_GATEWAY_TOKEN`)
- `password` (ความลับร่วมผ่าน `OPENCLAW_GATEWAY_PASSWORD` หรือการกำหนดค่า)
- `trusted-proxy` (พร็อกซีย้อนกลับที่รับรู้ตัวตน; ดู [การยืนยันตัวตน Trusted Proxy](/th/gateway/trusted-proxy-auth))

เมื่อ `tailscale.mode = "serve"` และ `gateway.auth.allowTailscale` เป็น `true`,
การยืนยันตัวตนของ Control UI/WebSocket สามารถใช้ส่วนหัวระบุตัวตนของ Tailscale
(`tailscale-user-login`) ได้โดยไม่ต้องระบุโทเค็น/รหัสผ่าน OpenClaw ตรวจสอบ
ตัวตนโดยแก้ไขที่อยู่ `x-forwarded-for` ผ่าน daemon ของ Tailscale ในเครื่อง
(`tailscale whois`) และจับคู่กับส่วนหัวก่อนยอมรับ
OpenClaw จะถือว่าคำขอเป็น Serve ก็ต่อเมื่อคำขอมาจาก loopback พร้อมกับส่วนหัว
`x-forwarded-for`, `x-forwarded-proto` และ `x-forwarded-host` ของ Tailscale
เท่านั้น
สำหรับเซสชันผู้ปฏิบัติงานของ Control UI ที่มีตัวตนอุปกรณ์เบราว์เซอร์ เส้นทาง Serve
ที่ตรวจสอบแล้วนี้จะข้ามรอบการจับคู่อุปกรณ์ด้วย แต่ไม่ได้ข้ามตัวตนอุปกรณ์เบราว์เซอร์:
ไคลเอนต์ที่ไม่มีอุปกรณ์ยังคงถูกปฏิเสธ และการเชื่อมต่อ WebSocket แบบ node-role
หรือที่ไม่ใช่ Control UI ยังคงทำตามการจับคู่และการตรวจสอบการยืนยันตัวตนตามปกติ
เอนด์พอยต์ HTTP API (เช่น `/v1/*`, `/tools/invoke` และ `/api/channels/*`)
**ไม่** ใช้การยืนยันตัวตนด้วยส่วนหัวระบุตัวตนของ Tailscale เอนด์พอยต์เหล่านี้ยังคงทำตาม
โหมดการยืนยันตัวตน HTTP ปกติของเกตเวย์: การยืนยันตัวตนด้วยความลับร่วมเป็นค่าเริ่มต้น
หรือการตั้งค่า trusted-proxy / private-ingress `none` ที่ตั้งค่าไว้อย่างตั้งใจ
โฟลว์แบบไม่ใช้โทเค็นนี้ถือว่าโฮสต์เกตเวย์เชื่อถือได้ หากโค้ดในเครื่องที่ไม่น่าเชื่อถือ
อาจทำงานบนโฮสต์เดียวกัน ให้ปิดใช้ `gateway.auth.allowTailscale` และกำหนดให้ใช้
การยืนยันตัวตนด้วยโทเค็น/รหัสผ่านแทน
หากต้องการกำหนดให้ใช้ข้อมูลรับรองแบบความลับร่วมอย่างชัดเจน ให้ตั้งค่า `gateway.auth.allowTailscale: false`
และใช้ `gateway.auth.mode: "token"` หรือ `"password"`

## ตัวอย่างการกำหนดค่า

### เฉพาะ Tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

เปิด: `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดค่าไว้)

### เฉพาะ Tailnet (ผูกกับ IP ของ Tailnet)

ใช้ตัวเลือกนี้เมื่อคุณต้องการให้ Gateway ฟังโดยตรงบน IP ของ Tailnet (ไม่มี Serve/Funnel)

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

### อินเทอร์เน็ตสาธารณะ (Funnel + รหัสผ่านร่วม)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

ควรใช้ `OPENCLAW_GATEWAY_PASSWORD` แทนการคอมมิตรหัสผ่านลงดิสก์

## ตัวอย่าง CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## หมายเหตุ

- Tailscale Serve/Funnel ต้องติดตั้ง CLI `tailscale` และเข้าสู่ระบบแล้ว
- `tailscale.mode: "funnel"` จะปฏิเสธการเริ่มทำงาน เว้นแต่ว่าโหมดการยืนยันตัวตนจะเป็น `password` เพื่อหลีกเลี่ยงการเปิดเผยสู่สาธารณะ
- ตั้งค่า `gateway.tailscale.resetOnExit` หากคุณต้องการให้ OpenClaw ยกเลิกการกำหนดค่า `tailscale serve`
  หรือ `tailscale funnel` เมื่อปิดระบบ
- `gateway.bind: "tailnet"` คือการผูกกับ Tailnet โดยตรง (ไม่มี HTTPS, ไม่มี Serve/Funnel)
- `gateway.bind: "auto"` จะเลือก loopback ก่อน; ใช้ `tailnet` หากคุณต้องการเฉพาะ Tailnet
- Serve/Funnel เปิดเผยเฉพาะ **Gateway control UI + WS** เท่านั้น โหนดเชื่อมต่อผ่าน
  เอนด์พอยต์ Gateway WS เดียวกัน ดังนั้น Serve จึงสามารถใช้สำหรับการเข้าถึงโหนดได้

## การควบคุมเบราว์เซอร์ (Gateway ระยะไกล + เบราว์เซอร์ในเครื่อง)

หากคุณรัน Gateway บนเครื่องหนึ่ง แต่ต้องการควบคุมเบราว์เซอร์บนอีกเครื่องหนึ่ง
ให้รัน **โฮสต์โหนด** บนเครื่องเบราว์เซอร์ และให้ทั้งสองอยู่ใน tailnet เดียวกัน
Gateway จะพร็อกซีการกระทำของเบราว์เซอร์ไปยังโหนด; ไม่จำเป็นต้องมีเซิร์ฟเวอร์ควบคุมหรือ URL ของ Serve แยกต่างหาก

หลีกเลี่ยง Funnel สำหรับการควบคุมเบราว์เซอร์; ให้ปฏิบัติต่อการจับคู่โหนดเหมือนการเข้าถึงของผู้ปฏิบัติงาน

## ข้อกำหนดเบื้องต้น + ขีดจำกัดของ Tailscale

- Serve ต้องเปิดใช้ HTTPS สำหรับ tailnet ของคุณ; CLI จะแจ้งหากยังไม่มี
- Serve แทรกส่วนหัวระบุตัวตนของ Tailscale; Funnel ไม่ทำเช่นนั้น
- Funnel ต้องใช้ Tailscale v1.38.3+, MagicDNS, เปิดใช้ HTTPS และแอตทริบิวต์โหนด funnel
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
