---
read_when:
    - คุณต้องการเข้าถึง Gateway ผ่าน Tailscale
    - คุณต้องการ UI ควบคุมบนเบราว์เซอร์และการแก้ไขการกำหนดค่า
summary: 'พื้นผิวเว็บของ Gateway: UI ควบคุม โหมดการผูก และความปลอดภัย'
title: เว็บ
x-i18n:
    generated_at: "2026-07-12T16:54:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

Gateway ให้บริการ **Control UI บนเบราว์เซอร์** ขนาดเล็ก (Vite + Lit) จากพอร์ตเดียวกับ WebSocket ของ Gateway:

- ค่าเริ่มต้น: `http://<host>:18789/`
- เมื่อใช้ `gateway.tls.enabled: true`: `https://<host>:18789/`
- คำนำหน้าแบบไม่บังคับ: ตั้งค่า `gateway.controlUi.basePath` (เช่น `/openclaw`)

ความสามารถต่าง ๆ อยู่ใน [Control UI](/th/web/control-ui) หน้านี้ครอบคลุมโหมดการผูกที่อยู่ ความปลอดภัย และพื้นผิวอื่น ๆ ที่เข้าถึงผ่านเว็บ

## การกำหนดค่า (เปิดใช้งานโดยค่าเริ่มต้น)

Control UI จะ**เปิดใช้งานโดยค่าเริ่มต้น**เมื่อมีแอสเซ็ตอยู่ (`dist/control-ui`):

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath เป็นตัวเลือก
  },
}
```

## Webhook

เมื่อ `hooks.enabled=true` Gateway จะเปิดเผยปลายทาง Webhook บนเซิร์ฟเวอร์ HTTP เดียวกันด้วย โปรดดู `hooks` ใน[ข้อมูลอ้างอิงการกำหนดค่า Gateway](/th/gateway/configuration-reference#hooks) สำหรับการยืนยันตัวตนและเพย์โหลด

## RPC สำหรับผู้ดูแลระบบผ่าน HTTP

`POST /api/v1/admin/rpc` เปิดเผยเมธอดส่วนควบคุมของ Gateway ที่เลือกไว้ผ่าน HTTP โดยค่าเริ่มต้นจะปิดอยู่ และจะลงทะเบียนเฉพาะเมื่อเปิดใช้งาน Plugin `admin-http-rpc` โปรดดู [RPC สำหรับผู้ดูแลระบบผ่าน HTTP](/th/plugins/admin-http-rpc) สำหรับโมเดลการยืนยันตัวตน เมธอดที่อนุญาต และการเปรียบเทียบกับ API แบบ WebSocket

## การเข้าถึงผ่าน Tailscale

<Tabs>
  <Tab title="Serve แบบผสานรวม (แนะนำ)">
    ให้ Gateway อยู่บน local loopback และใช้ Tailscale Serve เป็นพร็อกซี:

    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "serve" },
      },
    }
    ```

    เริ่ม Gateway:

    ```bash
    openclaw gateway
    ```

    เปิด `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดค่าไว้)

  </Tab>
  <Tab title="ผูกกับ Tailnet + โทเค็น">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    เริ่ม Gateway (ตัวอย่างที่ไม่ใช่ local loopback นี้ใช้การยืนยันตัวตนด้วยโทเค็นลับที่ใช้ร่วมกัน):

    ```bash
    openclaw gateway
    ```

    เปิด `http://<tailscale-ip>:18789/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดค่าไว้)

  </Tab>
  <Tab title="อินเทอร์เน็ตสาธารณะ (Funnel)">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // หรือ OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    `tailscale.mode: "funnel"` ต้องใช้ `gateway.auth.mode: "password"` โดยทั้ง Serve และ Funnel ต้องใช้ `gateway.bind: "loopback"`

  </Tab>
</Tabs>

## หมายเหตุด้านความปลอดภัย

- โดยค่าเริ่มต้น Gateway ต้องมีการยืนยันตัวตน ได้แก่ โทเค็น รหัสผ่าน พร็อกซีที่เชื่อถือ หรือส่วนหัวข้อมูลประจำตัวของ Tailscale Serve เมื่อเปิดใช้งาน
- การผูกที่อยู่ที่ไม่ใช่ local loopback ยังคง**ต้องมี**การยืนยันตัวตนของ Gateway ได้แก่ การยืนยันตัวตนด้วยโทเค็น/รหัสผ่าน หรือรีเวิร์สพร็อกซีที่รับรู้ข้อมูลประจำตัวร่วมกับ `gateway.auth.mode: "trusted-proxy"`
- ตัวช่วยเริ่มต้นใช้งานจะสร้างการยืนยันตัวตนด้วยข้อมูลลับที่ใช้ร่วมกันโดยค่าเริ่มต้น และโดยทั่วไปจะสร้างโทเค็น Gateway แม้ใช้งานบน local loopback
- ในโหมดข้อมูลลับที่ใช้ร่วมกัน UI จะส่ง `connect.params.auth.token` หรือ `connect.params.auth.password` ระหว่างการจับมือ WebSocket
- เมื่อใช้ `gateway.tls.enabled: true` ตัวช่วยแดชบอร์ด/สถานะภายในเครื่องจะแสดง URL แบบ `https://` และ URL ของ WebSocket แบบ `wss://`
- ในโหมดที่มีข้อมูลประจำตัว (Tailscale Serve, `trusted-proxy`) การตรวจสอบการยืนยันตัวตนของ WebSocket จะใช้ส่วนหัวของคำขอแทนข้อมูลลับที่ใช้ร่วมกัน
- สำหรับการติดตั้งใช้งาน Control UI แบบสาธารณะที่ไม่ใช่ local loopback ให้ตั้งค่า `gateway.controlUi.allowedOrigins` อย่างชัดเจน (ระบุต้นทางแบบเต็ม) การโหลดจากต้นทางเดียวกันแบบส่วนตัวจะได้รับการยอมรับโดยไม่ต้องตั้งค่านี้สำหรับ local loopback, RFC1918/link-local, `.local`, `.ts.net` และโฮสต์ Tailscale CGNAT
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` เปิดใช้งานการใช้ต้นทางจากส่วนหัว Host เป็นทางเลือกสำรอง ซึ่งเป็นการลดระดับความปลอดภัยที่อันตราย
- เมื่อใช้ Serve ส่วนหัวข้อมูลประจำตัวของ Tailscale จะผ่านการยืนยันตัวตนของ Control UI/WebSocket เมื่อ `gateway.auth.allowTailscale: true` (ไม่ต้องใช้โทเค็น/รหัสผ่าน) ปลายทาง HTTP API ไม่ใช้ส่วนหัวข้อมูลประจำตัวของ Tailscale โดยจะปฏิบัติตามโหมดการยืนยันตัวตน HTTP ปกติของ Gateway เสมอ ตั้งค่า `gateway.auth.allowTailscale: false` เพื่อกำหนดให้ต้องระบุข้อมูลรับรองอย่างชัดเจนแม้เข้าถึงผ่าน Serve ขั้นตอนที่ไม่ใช้โทเค็นนี้ถือว่าโฮสต์ Gateway เองได้รับความเชื่อถือ โปรดดู [Tailscale](/th/gateway/tailscale) และ[ความปลอดภัย](/th/gateway/security)

## การสร้าง UI

Gateway ให้บริการไฟล์แบบคงที่จาก `dist/control-ui`:

```bash
pnpm ui:build
```
