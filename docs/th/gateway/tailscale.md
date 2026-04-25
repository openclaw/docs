---
read_when:
    - การเปิดเผย Control UI ของ Gateway ออกนอก localhost
    - การทำให้การเข้าถึงแดชบอร์ดผ่าน tailnet หรือสาธารณะเป็นแบบอัตโนมัติ
summary: การผสานรวม Tailscale Serve/Funnel สำหรับแดชบอร์ด Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-25T13:49:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6042ddaf7194b34f003b1cdf5226f4693da22663d4007c65c79580e7f8ea2835
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClaw สามารถกำหนดค่า Tailscale **Serve** (tailnet) หรือ **Funnel** (สาธารณะ) แบบอัตโนมัติสำหรับ
แดชบอร์ด Gateway และพอร์ต WebSocket ได้ วิธีนี้ทำให้ Gateway ยังคง bind อยู่กับ loopback ขณะที่
Tailscale เป็นผู้จัดการ HTTPS, การกำหนดเส้นทาง และ (สำหรับ Serve) identity headers

## โหมด

- `serve`: Serve สำหรับ tailnet เท่านั้นผ่าน `tailscale serve` โดย gateway จะยังคงอยู่บน `127.0.0.1`
- `funnel`: HTTPS แบบสาธารณะผ่าน `tailscale funnel` โดย OpenClaw ต้องใช้ shared password
- `off`: ค่าเริ่มต้น (ไม่มีระบบอัตโนมัติของ Tailscale)

## การยืนยันตัวตน

ตั้งค่า `gateway.auth.mode` เพื่อควบคุม handshake:

- `none` (เฉพาะ private ingress)
- `token` (ค่าเริ่มต้นเมื่อมีการตั้ง `OPENCLAW_GATEWAY_TOKEN`)
- `password` (shared secret ผ่าน `OPENCLAW_GATEWAY_PASSWORD` หรือคอนฟิก)
- `trusted-proxy` (reverse proxy แบบ identity-aware; ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth))

เมื่อ `tailscale.mode = "serve"` และ `gateway.auth.allowTailscale` เป็น `true`
การยืนยันตัวตนของ Control UI/WebSocket สามารถใช้ Tailscale identity headers
(`tailscale-user-login`) ได้โดยไม่ต้องส่ง token/password OpenClaw จะตรวจสอบ
ตัวตนโดย resolve ที่อยู่ `x-forwarded-for` ผ่าน Tailscale daemon ภายในเครื่อง
(`tailscale whois`) และจับคู่กับ header ก่อนยอมรับ
OpenClaw จะถือว่าคำขอเป็นคำขอจาก Serve ก็ต่อเมื่อคำขอนั้นมาถึงจาก loopback พร้อม
headers `x-forwarded-for`, `x-forwarded-proto` และ `x-forwarded-host` ของ Tailscale
HTTP API endpoints (เช่น `/v1/*`, `/tools/invoke` และ `/api/channels/*`)
จะ **ไม่** ใช้การยืนยันตัวตนด้วย Tailscale identity-header โดยจะยังคงเป็นไปตาม
โหมด HTTP auth ปกติของ gateway: ใช้ shared-secret auth เป็นค่าเริ่มต้น หรือใช้การตั้งค่า trusted-proxy / private-ingress `none` ที่กำหนดอย่างตั้งใจ
โฟลว์แบบไม่ใช้ token นี้ตั้งอยู่บนสมมติฐานว่าโฮสต์ gateway เป็นโฮสต์ที่เชื่อถือได้ หากอาจมีโค้ดภายในเครื่องที่ไม่น่าเชื่อถือรันอยู่บนโฮสต์เดียวกัน ให้ปิด `gateway.auth.allowTailscale` และบังคับใช้
token/password auth แทน
หากต้องการบังคับใช้ข้อมูลรับรองแบบ shared-secret อย่างชัดเจน ให้ตั้ง `gateway.auth.allowTailscale: false`
และใช้ `gateway.auth.mode: "token"` หรือ `"password"`

## ตัวอย่างคอนฟิก

### เฉพาะ tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

เปิดที่: `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดไว้)

### เฉพาะ tailnet (bind กับ Tailnet IP)

ใช้วิธีนี้เมื่อคุณต้องการให้ Gateway รับการเชื่อมต่อโดยตรงบน Tailnet IP (ไม่ใช้ Serve/Funnel)

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

เชื่อมต่อจากอุปกรณ์อื่นใน Tailnet:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

หมายเหตุ: loopback (`http://127.0.0.1:18789`) จะ **ไม่** ใช้งานได้ในโหมดนี้

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

- Tailscale Serve/Funnel ต้องติดตั้ง `tailscale` CLI และลงชื่อเข้าใช้แล้ว
- `tailscale.mode: "funnel"` จะปฏิเสธการเริ่มทำงานหาก auth mode ไม่ใช่ `password` เพื่อหลีกเลี่ยงการเปิดเผยสู่สาธารณะ
- ตั้งค่า `gateway.tailscale.resetOnExit` หากคุณต้องการให้ OpenClaw ยกเลิกการกำหนดค่า `tailscale serve`
  หรือ `tailscale funnel` เมื่อปิดระบบ
- `gateway.bind: "tailnet"` คือการ bind กับ Tailnet โดยตรง (ไม่มี HTTPS และไม่มี Serve/Funnel)
- `gateway.bind: "auto"` จะเลือก loopback ก่อน; ใช้ `tailnet` หากคุณต้องการใช้เฉพาะ Tailnet
- Serve/Funnel จะแสดงเฉพาะ **Gateway control UI + WS** เท่านั้น Nodes จะเชื่อมต่อผ่าน
  Gateway WS endpoint เดียวกัน ดังนั้น Serve จึงใช้กับการเข้าถึง node ได้

## การควบคุมเบราว์เซอร์ (remote Gateway + local browser)

หากคุณรัน Gateway บนเครื่องหนึ่ง แต่ต้องการควบคุมเบราว์เซอร์บนอีกเครื่องหนึ่ง
ให้รัน **node host** บนเครื่องที่มีเบราว์เซอร์ และให้ทั้งสองเครื่องอยู่ใน tailnet เดียวกัน
Gateway จะ proxy การกระทำของเบราว์เซอร์ไปยัง node โดยไม่ต้องมี control server แยกหรือ Serve URL เพิ่มเติม

หลีกเลี่ยงการใช้ Funnel สำหรับการควบคุมเบราว์เซอร์; ให้ถือว่า node pairing มีความสำคัญระดับเดียวกับการเข้าถึงของ operator

## ข้อกำหนดเบื้องต้น + ข้อจำกัดของ Tailscale

- Serve ต้องเปิดใช้ HTTPS สำหรับ tailnet ของคุณ; CLI จะมี prompt หากยังไม่มี
- Serve จะ inject Tailscale identity headers; Funnel จะไม่ทำ
- Funnel ต้องใช้ Tailscale v1.38.3+, MagicDNS, เปิดใช้ HTTPS และมี funnel node attribute
- Funnel รองรับเฉพาะพอร์ต `443`, `8443` และ `10000` ผ่าน TLS
- Funnel บน macOS ต้องใช้แอป Tailscale แบบโอเพนซอร์ส

## เรียนรู้เพิ่มเติม

- ภาพรวม Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- คำสั่ง `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- ภาพรวม Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- คำสั่ง `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## ที่เกี่ยวข้อง

- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [Discovery](/th/gateway/discovery)
- [Authentication](/th/gateway/authentication)
