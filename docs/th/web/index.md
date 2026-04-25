---
read_when:
    - คุณต้องการเข้าถึง Gateway ผ่าน Tailscale
    - คุณต้องการ Control UI บนเบราว์เซอร์และการแก้ไข config
summary: 'พื้นผิวเว็บของ Gateway: Control UI, โหมด bind และความปลอดภัย'
title: เว็บ
x-i18n:
    generated_at: "2026-04-25T14:02:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 424704a35ce3a0f5960486372514751cc93ae90e4b75d0ed114e045664256d2d
    source_path: web/index.md
    workflow: 15
---

Gateway ให้บริการ **Control UI บนเบราว์เซอร์** ขนาดเล็ก (Vite + Lit) จากพอร์ตเดียวกันกับ Gateway WebSocket:

- ค่าเริ่มต้น: `http://<host>:18789/`
- เมื่อใช้ `gateway.tls.enabled: true`: `https://<host>:18789/`
- คำนำหน้าแบบไม่บังคับ: ตั้งค่า `gateway.controlUi.basePath` (เช่น `/openclaw`)

ความสามารถต่าง ๆ อยู่ใน [Control UI](/th/web/control-ui)
หน้านี้เน้นเรื่องโหมด bind ความปลอดภัย และพื้นผิวที่หันออกสู่เว็บ

## Webhook

เมื่อ `hooks.enabled=true` Gateway จะเปิดเผย endpoint Webhook ขนาดเล็กบน HTTP server เดียวกันด้วย
ดู [การกำหนดค่า Gateway](/th/gateway/configuration) → `hooks` สำหรับ auth + payloads

## Config (เปิดใช้ตามค่าเริ่มต้น)

Control UI จะ **เปิดใช้ตามค่าเริ่มต้น** เมื่อมี assets อยู่ (`dist/control-ui`)
คุณสามารถควบคุมได้ผ่าน config:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath ไม่บังคับ
  },
}
```

## การเข้าถึงผ่าน Tailscale

### Serve แบบผสานรวม (แนะนำ)

คง Gateway ไว้บน loopback แล้วให้ Tailscale Serve ทำ proxy ให้:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

จากนั้นเริ่ม Gateway:

```bash
openclaw gateway
```

เปิด:

- `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดไว้)

### bind กับ tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

จากนั้นเริ่ม Gateway (ตัวอย่างแบบ non-loopback นี้ใช้ token auth
แบบ shared-secret):

```bash
openclaw gateway
```

เปิด:

- `http://<tailscale-ip>:18789/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดไว้)

### อินเทอร์เน็ตสาธารณะ (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // หรือ OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## หมายเหตุด้านความปลอดภัย

- ต้องใช้ auth ของ Gateway ตามค่าเริ่มต้น (token, password, trusted-proxy หรือ header ยืนยันตัวตนของ Tailscale Serve เมื่อเปิดใช้งาน)
- การ bind แบบ non-loopback ยังคง **ต้องใช้** auth ของ Gateway ในทางปฏิบัติหมายถึง token/password auth หรือ reverse proxy ที่รับรู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"`
- ตัวช่วยสร้างจะสร้าง auth แบบ shared-secret ตามค่าเริ่มต้น และโดยทั่วไปจะสร้าง
  token ของ gateway ด้วย (แม้อยู่บน loopback)
- ในโหมด shared-secret UI จะส่ง `connect.params.auth.token` หรือ
  `connect.params.auth.password`
- เมื่อ `gateway.tls.enabled: true` ตัวช่วย dashboard และ status ภายในเครื่องจะเรนเดอร์
  URL ของ dashboard เป็น `https://` และ URL ของ WebSocket เป็น `wss://`
- ในโหมดที่มีตัวตนกำกับ เช่น Tailscale Serve หรือ `trusted-proxy`
  การตรวจสอบ auth ของ WebSocket จะผ่านจาก request headers แทน
- สำหรับการ deploy Control UI แบบ non-loopback ให้ตั้งค่า `gateway.controlUi.allowedOrigins`
  อย่างชัดเจน (origin แบบเต็ม) หากไม่ตั้งค่า การเริ่มต้น gateway จะถูกปฏิเสธตามค่าเริ่มต้น
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` เปิดใช้
  โหมด fallback ของ origin จาก Host header แต่เป็นการลดระดับความปลอดภัยที่อันตราย
- เมื่อใช้ Serve, header ยืนยันตัวตนของ Tailscale สามารถผ่าน auth ของ Control UI/WebSocket ได้
  เมื่อ `gateway.auth.allowTailscale` เป็น `true` (ไม่ต้องใช้ token/password)
  ส่วน endpoint ของ HTTP API จะไม่ใช้ header ยืนยันตัวตนของ Tailscale เหล่านั้น แต่จะทำตาม
  โหมด HTTP auth ปกติของ gateway แทน ตั้งค่า
  `gateway.auth.allowTailscale: false` หากต้องการบังคับใช้ข้อมูลรับรองอย่างชัดเจน ดู
  [Tailscale](/th/gateway/tailscale) และ [Security](/th/gateway/security)
  โฟลว์แบบไม่ใช้ token นี้ตั้งอยู่บนสมมติฐานว่าโฮสต์ของ gateway เชื่อถือได้
- `gateway.tailscale.mode: "funnel"` ต้องใช้ `gateway.auth.mode: "password"` (รหัสผ่านแบบแชร์ร่วมกัน)

## การ build UI

Gateway ให้บริการไฟล์สแตติกจาก `dist/control-ui` build ไฟล์เหล่านี้ด้วย:

```bash
pnpm ui:build
```
