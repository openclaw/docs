---
read_when:
    - การเปิดเผย Control UI ของ Gateway ออกนอก localhost
    - การทำให้การเข้าถึงแดชบอร์ดผ่าน tailnet หรือสาธารณะเป็นแบบอัตโนมัติ
summary: Tailscale Serve/Funnel ที่ผสานรวมสำหรับแดชบอร์ด Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-26T11:31:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5966490f8e85774b5149ed29cf7fd4b108eb438f94f5f74a3e5aa3e3b39568a
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClaw สามารถกำหนดค่า Tailscale **Serve** (tailnet) หรือ **Funnel** (สาธารณะ) โดยอัตโนมัติสำหรับแดชบอร์ด Gateway และพอร์ต WebSocket ได้ วิธีนี้ทำให้ Gateway ยังคง bind กับ loopback ขณะที่ Tailscale เป็นผู้ให้ HTTPS การกำหนดเส้นทาง และ (สำหรับ Serve) identity headers

## โหมด

- `serve`: Serve แบบ tailnet-only ผ่าน `tailscale serve` gateway ยังคงอยู่บน `127.0.0.1`
- `funnel`: HTTPS สาธารณะผ่าน `tailscale funnel` OpenClaw บังคับให้ใช้รหัสผ่านแบบ shared
- `off`: ค่าเริ่มต้น (ไม่มีการทำ Tailscale แบบอัตโนมัติ)

เอาต์พุตสถานะและการตรวจสอบจะใช้คำว่า **Tailscale exposure** สำหรับโหมด OpenClaw Serve/Funnel นี้ `off` หมายถึง OpenClaw ไม่ได้จัดการ Serve หรือ Funnel ไม่ได้หมายความว่า daemon ของ Tailscale ในเครื่องหยุดทำงานหรือออกจากระบบแล้ว

## Auth

ตั้งค่า `gateway.auth.mode` เพื่อควบคุม handshake:

- `none` (private ingress เท่านั้น)
- `token` (ค่าเริ่มต้นเมื่อมีการตั้ง `OPENCLAW_GATEWAY_TOKEN`)
- `password` (shared secret ผ่าน `OPENCLAW_GATEWAY_PASSWORD` หรือ config)
- `trusted-proxy` (reverse proxy ที่รู้จักตัวตน; ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth))

เมื่อ `tailscale.mode = "serve"` และ `gateway.auth.allowTailscale` เป็น `true`
auth ของ Control UI/WebSocket สามารถใช้ Tailscale identity headers
(`tailscale-user-login`) ได้โดยไม่ต้องส่ง token/password OpenClaw จะตรวจสอบ
ตัวตนโดย resolve ที่อยู่ `x-forwarded-for` ผ่าน local Tailscale
daemon (`tailscale whois`) และตรวจสอบให้ตรงกับ header ก่อนยอมรับ OpenClaw จะถือว่า
คำขอเป็น Serve ก็ต่อเมื่อมาจาก loopback พร้อม headers `x-forwarded-for`, `x-forwarded-proto` และ `x-forwarded-host` ของ Tailscale เท่านั้น
สำหรับเซสชัน operator ของ Control UI ที่มี browser device identity รวมอยู่ด้วย
เส้นทาง Serve ที่ตรวจสอบแล้วนี้จะข้ามรอบ device-pairing ไปด้วย แต่ไม่ได้ข้าม
browser device identity: ไคลเอนต์ที่ไม่มีอุปกรณ์จะยังถูกปฏิเสธ และการเชื่อมต่อ WebSocket
ที่เป็น node-role หรือไม่ใช่ Control UI จะยังคงผ่านการตรวจสอบ pairing และ
auth ตามปกติ
endpoints HTTP API (เช่น `/v1/*`, `/tools/invoke` และ `/api/channels/*`)
**ไม่** ใช้ Tailscale identity-header auth และยังคงเป็นไปตามโหมด HTTP auth
ปกติของ gateway: shared-secret auth เป็นค่าเริ่มต้น หรือ trusted-proxy / private-ingress
`none` ที่กำหนดไว้อย่างตั้งใจ
โฟลว์แบบไม่ใช้ token นี้ถือว่าโฮสต์ gateway เป็นที่เชื่อถือได้ หากมีโค้ดในเครื่องที่ไม่น่าเชื่อถือ
อาจรันอยู่บนโฮสต์เดียวกัน ให้ปิด `gateway.auth.allowTailscale` แล้วบังคับใช้
token/password auth แทน
หากต้องการบังคับใช้ข้อมูลรับรอง shared-secret แบบชัดเจน ให้ตั้ง `gateway.auth.allowTailscale: false`
และใช้ `gateway.auth.mode: "token"` หรือ `"password"`

## ตัวอย่าง config

### Tailnet-only (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

เปิด: `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดไว้)

### Tailnet-only (bind ไปยัง Tailnet IP)

ใช้วิธีนี้เมื่อคุณต้องการให้ Gateway ฟังโดยตรงบน Tailnet IP (ไม่ใช้ Serve/Funnel)

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

หมายเหตุ: loopback (`http://127.0.0.1:18789`) จะ **ใช้ไม่ได้** ในโหมดนี้

### อินเทอร์เน็ตสาธารณะ (Funnel + shared password)

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

- Tailscale Serve/Funnel ต้องติดตั้ง `tailscale` CLI และล็อกอินแล้ว
- `tailscale.mode: "funnel"` จะปฏิเสธการเริ่มต้น เว้นแต่ auth mode จะเป็น `password` เพื่อหลีกเลี่ยงการเปิดเผยสู่สาธารณะ
- ตั้ง `gateway.tailscale.resetOnExit` หากคุณต้องการให้ OpenClaw ย้อนการกำหนดค่า `tailscale serve`
  หรือ `tailscale funnel` เมื่อปิดระบบ
- `gateway.bind: "tailnet"` คือการ bind ตรงไปยัง Tailnet (ไม่มี HTTPS, ไม่มี Serve/Funnel)
- `gateway.bind: "auto"` จะเลือก loopback เป็นหลัก; ใช้ `tailnet` หากคุณต้องการ Tailnet-only
- Serve/Funnel จะเปิดเผยเฉพาะ **Gateway control UI + WS** เท่านั้น Nodes จะเชื่อมต่อผ่าน
  Gateway WS endpoint เดียวกัน ดังนั้น Serve จึงใช้สำหรับการเข้าถึง Node ได้ด้วย

## Browser control (Gateway ระยะไกล + เบราว์เซอร์ในเครื่อง)

หากคุณรัน Gateway บนเครื่องหนึ่ง แต่ต้องการควบคุมเบราว์เซอร์บนอีกเครื่องหนึ่ง
ให้รัน **node host** บนเครื่องเบราว์เซอร์ และให้ทั้งสองอยู่ใน tailnet เดียวกัน
Gateway จะ proxy การทำงานของเบราว์เซอร์ไปยัง node; ไม่ต้องมี control server หรือ Serve URL แยกต่างหาก

หลีกเลี่ยงการใช้ Funnel สำหรับ browser control; ให้มองการจับคู่ Node ว่าเทียบเท่าการเข้าถึงของ operator

## ข้อกำหนดเบื้องต้น + ข้อจำกัดของ Tailscale

- Serve ต้องเปิดใช้ HTTPS สำหรับ tailnet ของคุณ; CLI จะถามหากยังไม่มี
- Serve จะฉีด Tailscale identity headers; Funnel จะไม่ทำ
- Funnel ต้องใช้ Tailscale v1.38.3+, MagicDNS, เปิดใช้ HTTPS และมี funnel node attribute
- Funnel รองรับเฉพาะพอร์ต `443`, `8443` และ `10000` ผ่าน TLS
- Funnel บน macOS ต้องใช้ Tailscale app รุ่นโอเพนซอร์ส

## เรียนรู้เพิ่มเติม

- ภาพรวม Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- คำสั่ง `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- ภาพรวม Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- คำสั่ง `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## ที่เกี่ยวข้อง

- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [Discovery](/th/gateway/discovery)
- [Authentication](/th/gateway/authentication)
