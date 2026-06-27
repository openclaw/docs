---
read_when:
    - การเปิดให้เข้าถึงส่วนติดต่อผู้ใช้สำหรับควบคุมของ Gateway จากภายนอก localhost
    - การทำให้การเข้าถึง tailnet หรือแดชบอร์ดสาธารณะเป็นอัตโนมัติ
summary: ผสานรวม Tailscale Serve/Funnel สำหรับแดชบอร์ด Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-06-27T17:39:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35944eba19cd82d373b25c602b66d1b76f35ad63aa90767bb1c7ef75549fe905
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw สามารถกำหนดค่า Tailscale **Serve** (tailnet) หรือ **Funnel** (สาธารณะ) โดยอัตโนมัติสำหรับ
แดชบอร์ด Gateway และพอร์ต WebSocket ได้ วิธีนี้ทำให้ Gateway ผูกอยู่กับ loopback ขณะที่
Tailscale จัดการ HTTPS, การกำหนดเส้นทาง และ (สำหรับ Serve) ส่วนหัวระบุตัวตน

## โหมด

- `serve`: Serve เฉพาะ Tailnet ผ่าน `tailscale serve` Gateway ยังคงอยู่บน `127.0.0.1`
- `funnel`: HTTPS สาธารณะผ่าน `tailscale funnel` OpenClaw ต้องใช้รหัสผ่านที่ใช้ร่วมกัน
- `off`: ค่าเริ่มต้น (ไม่มีการทำงานอัตโนมัติของ Tailscale)

เอาต์พุตสถานะและการตรวจสอบใช้ **Tailscale exposure** สำหรับโหมด OpenClaw Serve/Funnel
นี้ `off` หมายถึง OpenClaw ไม่ได้จัดการ Serve หรือ Funnel ไม่ได้หมายความว่า
daemon ของ Tailscale ในเครื่องหยุดทำงานหรือออกจากระบบแล้ว

## การยืนยันตัวตน

ตั้งค่า `gateway.auth.mode` เพื่อควบคุมการ handshake:

- `none` (เฉพาะ ingress ส่วนตัว)
- `token` (ค่าเริ่มต้นเมื่อมีการตั้งค่า `OPENCLAW_GATEWAY_TOKEN`)
- `password` (secret ที่ใช้ร่วมกันผ่าน `OPENCLAW_GATEWAY_PASSWORD` หรือ config)
- `trusted-proxy` (reverse proxy ที่รับรู้ตัวตน; ดู [การยืนยันตัวตนผ่าน Trusted Proxy](/th/gateway/trusted-proxy-auth))

เมื่อ `tailscale.mode = "serve"` และ `gateway.auth.allowTailscale` เป็น `true`
การยืนยันตัวตนของ Control UI/WebSocket สามารถใช้ส่วนหัวระบุตัวตนของ Tailscale
(`tailscale-user-login`) ได้โดยไม่ต้องส่ง token/password OpenClaw ตรวจสอบ
ตัวตนด้วยการ resolve ที่อยู่ `x-forwarded-for` ผ่าน daemon ของ Tailscale
ในเครื่อง (`tailscale whois`) แล้วจับคู่กับส่วนหัวก่อนยอมรับ
OpenClaw จะถือว่าคำขอเป็น Serve ก็ต่อเมื่อมาจาก loopback พร้อมส่วนหัว
`x-forwarded-for`, `x-forwarded-proto` และ `x-forwarded-host` ของ Tailscale
เท่านั้น
สำหรับเซสชันผู้ปฏิบัติงานใน Control UI ที่มีตัวตนอุปกรณ์ของเบราว์เซอร์
เส้นทาง Serve ที่ตรวจสอบแล้วนี้จะข้ามรอบการจับคู่อุปกรณ์ด้วยเช่นกัน แต่ไม่ได้ข้าม
ตัวตนอุปกรณ์ของเบราว์เซอร์: ไคลเอนต์ที่ไม่มีอุปกรณ์ยังคงถูกปฏิเสธ และการเชื่อมต่อ
node-role หรือ WebSocket ที่ไม่ใช่ Control UI ยังคงผ่านการจับคู่และ
การตรวจสอบการยืนยันตัวตนตามปกติ
endpoint ของ HTTP API (เช่น `/v1/*`, `/tools/invoke` และ `/api/channels/*`)
**ไม่** ใช้การยืนยันตัวตนผ่านส่วนหัวระบุตัวตนของ Tailscale แต่ยังคงทำตามโหมด
การยืนยันตัวตน HTTP ปกติของ gateway: การยืนยันตัวตนด้วย shared-secret ตามค่าเริ่มต้น
หรือการตั้งค่า trusted-proxy / private-ingress `none` ที่ตั้งใจไว้อย่างชัดเจน
โฟลว์แบบไม่ใช้ token นี้ถือว่าโฮสต์ gateway เชื่อถือได้ หากโค้ดในเครื่องที่ไม่น่าเชื่อถือ
อาจทำงานบนโฮสต์เดียวกัน ให้ปิดใช้ `gateway.auth.allowTailscale` และบังคับใช้
การยืนยันตัวตนด้วย token/password แทน
หากต้องการบังคับใช้ข้อมูลประจำตัว shared-secret อย่างชัดเจน ให้ตั้งค่า `gateway.auth.allowTailscale: false`
และใช้ `gateway.auth.mode: "token"` หรือ `"password"`

## ตัวอย่าง Config

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

หากต้องการเปิด Control UI ผ่าน Tailscale Service ที่มีชื่อ แทนที่จะใช้
ชื่อโฮสต์ของอุปกรณ์ ให้ตั้งค่า `gateway.tailscale.serviceName` เป็นชื่อ Service:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

จากตัวอย่างด้านบน การเริ่มต้นจะแสดง URL ของ Service เป็น
`https://openclaw.<tailnet-name>.ts.net/` แทนชื่อโฮสต์ของอุปกรณ์
Tailscale Services ต้องการให้โฮสต์เป็น node ที่ติดแท็กและได้รับอนุมัติใน
tailnet ของคุณ กำหนดค่า tag และอนุมัติ Service ใน Tailscale ก่อนเปิดใช้
ตัวเลือกนี้ มิฉะนั้น `tailscale serve --service=...` จะล้มเหลวระหว่างการเริ่มต้น
gateway

### เฉพาะ Tailnet (ผูกกับ Tailnet IP)

ใช้ตัวเลือกนี้เมื่อคุณต้องการให้ Gateway รับฟังโดยตรงบน Tailnet IP (ไม่มี Serve/Funnel)

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

ควรใช้ `OPENCLAW_GATEWAY_PASSWORD` แทนการ commit รหัสผ่านลงดิสก์

## ตัวอย่าง CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## หมายเหตุ

- Tailscale Serve/Funnel ต้องติดตั้ง `tailscale` CLI และเข้าสู่ระบบแล้ว
- `tailscale.mode: "funnel"` จะปฏิเสธการเริ่มต้น เว้นแต่โหมดการยืนยันตัวตนเป็น `password` เพื่อหลีกเลี่ยงการเปิดเผยต่อสาธารณะ
- `gateway.tailscale.serviceName` ใช้ได้เฉพาะกับโหมด Serve และถูกส่งต่อไปยัง
  `tailscale serve --service=<name>` ค่าต้องใช้รูปแบบชื่อ Service ของ Tailscale
  แบบ `svc:<dns-label>` เช่น `svc:openclaw`
  Tailscale ต้องการให้โฮสต์ของ Service เป็น node ที่ติดแท็ก และ Service อาจต้อง
  ได้รับการอนุมัติในคอนโซลผู้ดูแลก่อนที่ Serve จะเผยแพร่ได้
- ตั้งค่า `gateway.tailscale.resetOnExit` หากคุณต้องการให้ OpenClaw ย้อนกลับการกำหนดค่า `tailscale serve`
  หรือ `tailscale funnel` เมื่อปิดระบบ
- ตั้งค่า `gateway.tailscale.preserveFunnel: true` เพื่อคงเส้นทาง
  `tailscale funnel` ที่กำหนดค่าจากภายนอกให้ทำงานต่อไปข้ามการรีสตาร์ท gateway เมื่อเปิดใช้และ
  gateway ทำงานใน `mode: "serve"` OpenClaw จะตรวจสอบ `tailscale funnel status`
  ก่อนนำ Serve ไปใช้ซ้ำ และจะข้ามเมื่อมีเส้นทาง Funnel ครอบคลุม
  พอร์ต gateway อยู่แล้ว นโยบาย Funnel ที่ OpenClaw จัดการแบบต้องใช้รหัสผ่านเท่านั้นยังคงไม่เปลี่ยนแปลง
- `gateway.bind: "tailnet"` คือการผูกกับ Tailnet โดยตรง (ไม่มี HTTPS, ไม่มี Serve/Funnel)
- `gateway.bind: "auto"` จะเลือก loopback เป็นหลัก; ใช้ `tailnet` หากคุณต้องการเฉพาะ Tailnet
- Serve/Funnel เปิดเผยเฉพาะ **Control UI + WS ของ Gateway** เท่านั้น Node เชื่อมต่อผ่าน
  endpoint Gateway WS เดียวกัน ดังนั้น Serve จึงใช้สำหรับการเข้าถึง node ได้

## การควบคุมเบราว์เซอร์ (Gateway ระยะไกล + เบราว์เซอร์ในเครื่อง)

หากคุณเรียกใช้ Gateway บนเครื่องหนึ่ง แต่ต้องการควบคุมเบราว์เซอร์บนอีกเครื่องหนึ่ง
ให้เรียกใช้ **node host** บนเครื่องเบราว์เซอร์ และให้ทั้งสองอยู่ใน tailnet เดียวกัน
Gateway จะ proxy การทำงานของเบราว์เซอร์ไปยัง node; ไม่จำเป็นต้องมีเซิร์ฟเวอร์ควบคุมหรือ URL Serve แยกต่างหาก

หลีกเลี่ยง Funnel สำหรับการควบคุมเบราว์เซอร์; ให้ปฏิบัติต่อการจับคู่ node เหมือนการเข้าถึงของผู้ปฏิบัติงาน

## ข้อกำหนดเบื้องต้น + ขีดจำกัดของ Tailscale

- Serve ต้องเปิดใช้ HTTPS สำหรับ tailnet ของคุณ; CLI จะแจ้งเตือนหากยังไม่มี
- Serve แทรกส่วนหัวระบุตัวตนของ Tailscale; Funnel ไม่ทำเช่นนั้น
- Funnel ต้องใช้ Tailscale v1.38.3+, MagicDNS, เปิดใช้ HTTPS และแอตทริบิวต์ funnel node
- Funnel รองรับเฉพาะพอร์ต `443`, `8443` และ `10000` ผ่าน TLS
- Funnel บน macOS ต้องใช้แอป Tailscale รุ่น open-source

## เรียนรู้เพิ่มเติม

- ภาพรวม Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- คำสั่ง `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- ภาพรวม Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- คำสั่ง `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## ที่เกี่ยวข้อง

- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [การค้นหา](/th/gateway/discovery)
- [การยืนยันตัวตน](/th/gateway/authentication)
