---
read_when:
    - การเปลี่ยนโหมดการยืนยันตัวตนหรือการเปิดให้เข้าถึงของแดชบอร์ด
summary: การเข้าถึงและการยืนยันตัวตนของแดชบอร์ด Gateway (ส่วนติดต่อผู้ใช้สำหรับควบคุม)
title: แดชบอร์ด
x-i18n:
    generated_at: "2026-05-11T20:40:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07e11c1f71e6691ee053192e238a3b48568f81c3180e6b5f8e21b6874417e57e
    source_path: web/dashboard.md
    workflow: 16
    postprocess_version: locale-links-v1
---

แดชบอร์ด Gateway คือส่วนติดต่อผู้ใช้สำหรับควบคุมบนเบราว์เซอร์ซึ่งให้บริการที่ `/` โดยค่าเริ่มต้น
(เขียนทับได้ด้วย `gateway.controlUi.basePath`).

เปิดอย่างรวดเร็ว (Gateway ภายในเครื่อง):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (หรือ [http://localhost:18789/](http://localhost:18789/))
- เมื่อใช้ `gateway.tls.enabled: true` ให้ใช้ `https://127.0.0.1:18789/` และ
  `wss://127.0.0.1:18789` สำหรับปลายทาง WebSocket

เอกสารอ้างอิงสำคัญ:

- [ส่วนติดต่อผู้ใช้สำหรับควบคุม](/th/web/control-ui) สำหรับการใช้งานและความสามารถของ UI
- [Tailscale](/th/gateway/tailscale) สำหรับการทำงานอัตโนมัติของ Serve/Funnel
- [พื้นผิวเว็บ](/th/web) สำหรับโหมดการ bind และหมายเหตุด้านความปลอดภัย

การยืนยันตัวตนถูกบังคับใช้ในการ handshake ของ WebSocket ผ่านเส้นทาง auth ของ gateway
ที่กำหนดค่าไว้:

- `connect.params.auth.token`
- `connect.params.auth.password`
- เฮดเดอร์ตัวตนของ Tailscale Serve เมื่อ `gateway.auth.allowTailscale: true`
- เฮดเดอร์ตัวตนของ trusted-proxy เมื่อ `gateway.auth.mode: "trusted-proxy"`

ดู `gateway.auth` ใน [การกำหนดค่า Gateway](/th/gateway/configuration)

หมายเหตุด้านความปลอดภัย: ส่วนติดต่อผู้ใช้สำหรับควบคุมเป็น **พื้นผิวผู้ดูแล** (แชท, การกำหนดค่า, การอนุมัติ exec)
อย่าเปิดเผยต่อสาธารณะ UI จะเก็บโทเค็น URL ของแดชบอร์ดไว้ใน sessionStorage
สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL ของ gateway ที่เลือก และลบโทเค็นออกจาก URL หลังโหลด
ควรใช้ localhost, Tailscale Serve หรือ SSH tunnel

## เส้นทางเร็ว (แนะนำ)

- หลัง onboarding แล้ว CLI จะเปิดแดชบอร์ดอัตโนมัติและพิมพ์ลิงก์สะอาด (ไม่มีโทเค็น)
- เปิดใหม่ได้ทุกเมื่อ: `openclaw dashboard` (คัดลอกลิงก์, เปิดเบราว์เซอร์ถ้าทำได้, แสดงคำแนะนำ SSH ถ้าเป็น headless)
- ถ้าส่งผ่านคลิปบอร์ดและเบราว์เซอร์ไม่สำเร็จ `openclaw dashboard` จะยังพิมพ์
  URL สะอาดและบอกให้คุณใช้โทเค็นจาก `OPENCLAW_GATEWAY_TOKEN` หรือ
  `gateway.auth.token` เป็นคีย์ fragment ของ URL ชื่อ `token`; คำสั่งจะไม่พิมพ์ค่าโทเค็น
  ในล็อก
- ถ้า UI ขอ auth แบบ shared-secret ให้วางโทเค็นหรือ
  รหัสผ่านที่กำหนดค่าไว้ในการตั้งค่าส่วนติดต่อผู้ใช้สำหรับควบคุม

## พื้นฐาน Auth (ภายในเครื่องเทียบกับระยะไกล)

- **Localhost**: เปิด `http://127.0.0.1:18789/`
- **Gateway TLS**: เมื่อ `gateway.tls.enabled: true` ลิงก์แดชบอร์ด/สถานะจะใช้
  `https://` และลิงก์ WebSocket ของส่วนติดต่อผู้ใช้สำหรับควบคุมจะใช้ `wss://`
- **แหล่งที่มาของโทเค็น shared-secret**: `gateway.auth.token` (หรือ
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` สามารถส่งผ่าน fragment ของ URL
  เพื่อ bootstrap ครั้งเดียว และส่วนติดต่อผู้ใช้สำหรับควบคุมจะเก็บไว้ใน sessionStorage สำหรับ
  เซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL ของ gateway ที่เลือก แทน localStorage
- ถ้า `gateway.auth.token` จัดการด้วย SecretRef `openclaw dashboard`
  จะพิมพ์/คัดลอก/เปิด URL ที่ไม่มีโทเค็นตามการออกแบบ เพื่อหลีกเลี่ยงการเปิดเผย
  โทเค็นที่จัดการจากภายนอกในล็อก shell, ประวัติคลิปบอร์ด หรืออาร์กิวเมนต์
  การเปิดเบราว์เซอร์
- ถ้า `gateway.auth.token` ถูกกำหนดค่าเป็น SecretRef และ resolve ไม่ได้ใน
  shell ปัจจุบันของคุณ `openclaw dashboard` จะยังพิมพ์ URL ที่ไม่มีโทเค็นพร้อม
  คำแนะนำการตั้งค่า auth ที่นำไปปฏิบัติได้
- **รหัสผ่าน shared-secret**: ใช้ `gateway.auth.password` ที่กำหนดค่าไว้ (หรือ
  `OPENCLAW_GATEWAY_PASSWORD`) แดชบอร์ดจะไม่คงรหัสผ่านไว้ข้ามการ reload
- **โหมดที่มีตัวตนแนบมาด้วย**: Tailscale Serve สามารถทำให้ auth ของส่วนติดต่อผู้ใช้สำหรับควบคุม/WebSocket
  ผ่านได้ด้วยเฮดเดอร์ตัวตนเมื่อ `gateway.auth.allowTailscale: true` และ
  reverse proxy แบบ non-loopback ที่รู้ตัวตนสามารถทำให้
  `gateway.auth.mode: "trusted-proxy"` ผ่านได้ ในโหมดเหล่านั้นแดชบอร์ดไม่
  ต้องใช้ shared secret ที่วางด้วยมือสำหรับ WebSocket
- **ไม่ใช่ localhost**: ใช้ Tailscale Serve, การ bind shared-secret แบบ non-loopback, reverse proxy
  แบบ non-loopback ที่รู้ตัวตนพร้อม
  `gateway.auth.mode: "trusted-proxy"` หรือ SSH tunnel ส่วน HTTP API ยังคงใช้
  auth แบบ shared-secret เว้นแต่คุณตั้งใจรัน
  `gateway.auth.mode: "none"` สำหรับ private-ingress หรือ auth HTTP แบบ trusted-proxy ดู
  [พื้นผิวเว็บ](/th/web)

<a id="if-you-see-unauthorized-1008"></a>

## ถ้าคุณเห็น "unauthorized" / 1008

- ตรวจสอบว่า gateway เข้าถึงได้ (ภายในเครื่อง: `openclaw status`; ระยะไกล: SSH tunnel `ssh -N -L 18789:127.0.0.1:18789 user@host` แล้วเปิด `http://127.0.0.1:18789/`)
- สำหรับ `AUTH_TOKEN_MISMATCH` ไคลเอนต์อาจ retry แบบเชื่อถือได้หนึ่งครั้งด้วยโทเค็นอุปกรณ์ที่แคชไว้เมื่อ gateway ส่ง hint สำหรับ retry กลับมา การ retry ด้วย cached-token นั้นจะใช้ขอบเขตที่อนุมัติแล้วซึ่งแคชไว้ของโทเค็นนั้นซ้ำ; ผู้เรียกที่ระบุ `deviceToken` ชัดเจน / `scopes` ชัดเจนจะคงชุดขอบเขตที่ร้องขอไว้ ถ้า auth ยังล้มเหลวหลัง retry นั้น ให้แก้ token drift ด้วยตนเอง
- สำหรับ `AUTH_SCOPE_MISMATCH` โทเค็นอุปกรณ์ถูกจดจำแล้ว แต่ไม่มีขอบเขตที่แดชบอร์ดร้องขอ; ให้ pair ใหม่หรืออนุมัติสัญญาขอบเขตที่ร้องขอแทนการหมุนเวียนโทเค็น gateway แบบ shared
- นอกเส้นทาง retry นั้น ลำดับความสำคัญของ connect auth คือ shared token/password ที่ระบุชัดเจนก่อน จากนั้น `deviceToken` ที่ระบุชัดเจน จากนั้นโทเค็นอุปกรณ์ที่จัดเก็บไว้ แล้วจึง bootstrap token
- ในเส้นทางส่วนติดต่อผู้ใช้สำหรับควบคุมผ่าน Tailscale Serve แบบ async ความพยายามที่ล้มเหลวสำหรับ
  `{scope, ip}` เดียวกันจะถูกจัดลำดับก่อนที่ failed-auth limiter จะบันทึก ดังนั้น
  การ retry ผิดพร้อมกันครั้งที่สองอาจแสดง `retry later` ได้แล้ว
- สำหรับขั้นตอนซ่อม token drift ให้ทำตาม [รายการตรวจสอบการกู้คืน token drift](/th/cli/devices#token-drift-recovery-checklist)
- ดึงหรือระบุ shared secret จากโฮสต์ gateway:
  - โทเค็น: `openclaw config get gateway.auth.token`
  - รหัสผ่าน: resolve `gateway.auth.password` ที่กำหนดค่าไว้หรือ
    `OPENCLAW_GATEWAY_PASSWORD`
  - โทเค็นที่จัดการด้วย SecretRef: resolve ผู้ให้บริการ secret ภายนอกหรือ export
    `OPENCLAW_GATEWAY_TOKEN` ใน shell นี้ แล้วรัน `openclaw dashboard` ใหม่
  - ไม่ได้กำหนดค่า shared secret: `openclaw doctor --generate-gateway-token`
- ในการตั้งค่าแดชบอร์ด ให้วางโทเค็นหรือรหัสผ่านลงในฟิลด์ auth
  แล้วเชื่อมต่อ
- ตัวเลือกภาษา UI อยู่ที่ **ภาพรวม -> การเข้าถึง Gateway -> ภาษา**
  เป็นส่วนหนึ่งของการ์ดการเข้าถึง ไม่ใช่ส่วน Appearance

## ที่เกี่ยวข้อง

- [ส่วนติดต่อผู้ใช้สำหรับควบคุม](/th/web/control-ui)
- [WebChat](/th/web/webchat)
