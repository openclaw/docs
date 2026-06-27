---
read_when:
    - คุณต้องการเข้าถึง Gateway ผ่าน Tailscale
    - คุณต้องการ Control UI บนเบราว์เซอร์และการแก้ไขการกำหนดค่า
summary: 'พื้นผิวเว็บของ Gateway: Control UI, โหมดการผูก และความปลอดภัย'
title: เว็บ
x-i18n:
    generated_at: "2026-06-27T18:34:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c6b0c9f4ff53af295eb4eef7290d5d6b70c52543f57a9e83c7f8a635a2b35cd
    source_path: web/index.md
    workflow: 16
---

Gateway ให้บริการ **Control UI บนเบราว์เซอร์** ขนาดเล็ก (Vite + Lit) จากพอร์ตเดียวกับ Gateway WebSocket:

- ค่าเริ่มต้น: `http://<host>:18789/`
- เมื่อใช้ `gateway.tls.enabled: true`: `https://<host>:18789/`
- คำนำหน้าแบบเลือกได้: ตั้งค่า `gateway.controlUi.basePath` (เช่น `/openclaw`)

ความสามารถต่าง ๆ อยู่ใน [Control UI](/th/web/control-ui) ส่วนที่เหลือของหน้านี้เน้นที่โหมด bind, ความปลอดภัย และพื้นผิวที่เปิดให้เว็บเข้าถึง

## Webhook

เมื่อ `hooks.enabled=true` Gateway จะเปิดเผย endpoint webhook ขนาดเล็กบนเซิร์ฟเวอร์ HTTP เดียวกันด้วย
ดู [การกำหนดค่า Gateway](/th/gateway/configuration) → `hooks` สำหรับ auth และ payload

## RPC HTTP สำหรับผู้ดูแล

RPC HTTP สำหรับผู้ดูแลเปิดเผยเมธอด control-plane ของ Gateway ที่เลือกไว้ที่ `POST /api/v1/admin/rpc`
โดยค่าเริ่มต้นจะปิดอยู่ และจะลงทะเบียนเฉพาะเมื่อเปิดใช้ Plugin `admin-http-rpc`
ดู [RPC HTTP สำหรับผู้ดูแล](/th/plugins/admin-http-rpc) สำหรับโมเดล auth, เมธอดที่อนุญาต และการเปรียบเทียบกับ WebSocket

## การกำหนดค่า (เปิดโดยค่าเริ่มต้น)

Control UI จะ **เปิดใช้โดยค่าเริ่มต้น** เมื่อมี assets อยู่ (`dist/control-ui`)
คุณควบคุมได้ผ่าน config:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## การเข้าถึงผ่าน Tailscale

### Serve แบบผสานรวม (แนะนำ)

ให้ Gateway อยู่บน loopback แล้วให้ Tailscale Serve ทำหน้าที่ proxy ให้:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

จากนั้นเริ่ม gateway:

```bash
openclaw gateway
```

เปิด:

- `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดค่าไว้)

### bind Tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

จากนั้นเริ่ม gateway (ตัวอย่าง non-loopback นี้ใช้ auth แบบ shared-secret token):

```bash
openclaw gateway
```

เปิด:

- `http://<tailscale-ip>:18789/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดค่าไว้)

### อินเทอร์เน็ตสาธารณะ (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## หมายเหตุด้านความปลอดภัย

- Gateway auth จำเป็นตามค่าเริ่มต้น (token, password, trusted-proxy หรือส่วนหัวระบุตัวตนของ Tailscale Serve เมื่อเปิดใช้)
- bind แบบ non-loopback ยังคง **ต้องมี** gateway auth ในทางปฏิบัติหมายถึง auth แบบ token/password หรือ reverse proxy ที่รับรู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"`
- wizard จะสร้าง auth แบบ shared-secret ตามค่าเริ่มต้น และโดยทั่วไปจะสร้าง gateway token (แม้บน loopback)
- ในโหมด shared-secret, UI จะส่ง `connect.params.auth.token` หรือ `connect.params.auth.password`
- เมื่อ `gateway.tls.enabled: true` ตัวช่วย dashboard ภายในเครื่องและสถานะจะแสดง URL ของ dashboard แบบ `https://` และ URL ของ WebSocket แบบ `wss://`
- ในโหมดที่มีตัวตน เช่น Tailscale Serve หรือ `trusted-proxy` การตรวจสอบ WebSocket auth จะผ่านจากส่วนหัวของคำขอแทน
- สำหรับการปรับใช้ Control UI สาธารณะแบบ non-loopback ให้ตั้งค่า `gateway.controlUi.allowedOrigins` อย่างชัดเจน (origins แบบเต็ม) การโหลด LAN/Tailnet ส่วนตัวแบบ same-origin จะได้รับการยอมรับสำหรับ loopback, RFC1918/link-local, `.local`, `.ts.net` และโฮสต์ Tailscale CGNAT
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` เปิดใช้โหมด fallback origin จากส่วนหัว Host แต่เป็นการลดระดับความปลอดภัยที่อันตราย
- เมื่อใช้ Serve ส่วนหัวระบุตัวตนของ Tailscale สามารถผ่าน auth ของ Control UI/WebSocket ได้เมื่อ `gateway.auth.allowTailscale` เป็น `true` (ไม่ต้องใช้ token/password)
  endpoint ของ HTTP API ไม่ใช้ส่วนหัวระบุตัวตนของ Tailscale เหล่านั้น แต่จะทำตามโหมด HTTP auth ปกติของ gateway แทน ตั้งค่า
  `gateway.auth.allowTailscale: false` เพื่อบังคับให้ใช้ข้อมูลรับรองอย่างชัดเจน ดู
  [Tailscale](/th/gateway/tailscale) และ [ความปลอดภัย](/th/gateway/security) flow แบบไม่มี token นี้ถือว่าโฮสต์ gateway น่าเชื่อถือ
- `gateway.tailscale.mode: "funnel"` ต้องใช้ `gateway.auth.mode: "password"` (รหัสผ่านที่ใช้ร่วมกัน)

## การ build UI

Gateway ให้บริการไฟล์ static จาก `dist/control-ui` build ไฟล์เหล่านี้ด้วย:

```bash
pnpm ui:build
```
