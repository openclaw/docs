---
read_when:
    - การเปลี่ยนการตรวจสอบสิทธิ์ของแดชบอร์ดหรือโหมดการเปิดให้เข้าถึง
summary: การเข้าถึงและการยืนยันตัวตนของแดชบอร์ด Gateway (Control UI)
title: แดชบอร์ด
x-i18n:
    generated_at: "2026-05-05T01:51:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e2086587fee6303221663748c3047886a5beae29862d66e2edf78e02bfe3da1
    source_path: web/dashboard.md
    workflow: 16
---

แดชบอร์ด Gateway คือ UI ควบคุมในเบราว์เซอร์ที่ให้บริการที่ `/` ตามค่าเริ่มต้น
(แทนที่ได้ด้วย `gateway.controlUi.basePath`)

เปิดอย่างรวดเร็ว (Gateway ในเครื่อง):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (หรือ [http://localhost:18789/](http://localhost:18789/))
- เมื่อใช้ `gateway.tls.enabled: true` ให้ใช้ `https://127.0.0.1:18789/` และ
  `wss://127.0.0.1:18789` สำหรับปลายทาง WebSocket

ข้อมูลอ้างอิงสำคัญ:

- [UI ควบคุม](/th/web/control-ui) สำหรับการใช้งานและความสามารถของ UI
- [Tailscale](/th/gateway/tailscale) สำหรับระบบอัตโนมัติ Serve/Funnel
- [พื้นผิวเว็บ](/th/web) สำหรับโหมดการ bind และหมายเหตุด้านความปลอดภัย

การยืนยันตัวตนจะถูกบังคับใช้ที่การจับมือ WebSocket ผ่านพาธ auth ของ gateway
ที่กำหนดค่าไว้:

- `connect.params.auth.token`
- `connect.params.auth.password`
- ส่วนหัวข้อมูลประจำตัวของ Tailscale Serve เมื่อ `gateway.auth.allowTailscale: true`
- ส่วนหัวข้อมูลประจำตัวของ trusted-proxy เมื่อ `gateway.auth.mode: "trusted-proxy"`

ดู `gateway.auth` ใน [การกำหนดค่า Gateway](/th/gateway/configuration)

หมายเหตุด้านความปลอดภัย: UI ควบคุมเป็น **พื้นผิวผู้ดูแลระบบ** (แชต, การกำหนดค่า, การอนุมัติการ exec)
อย่าเปิดเผยต่อสาธารณะ UI จะเก็บโทเค็น URL ของแดชบอร์ดไว้ใน sessionStorage
สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL gateway ที่เลือก และลบโทเค็นออกจาก URL หลังโหลด
ควรใช้ localhost, Tailscale Serve หรืออุโมงค์ SSH

## เส้นทางด่วน (แนะนำ)

- หลังจาก onboarding แล้ว CLI จะเปิดแดชบอร์ดโดยอัตโนมัติและพิมพ์ลิงก์สะอาด (ไม่มีโทเค็น)
- เปิดใหม่ได้ทุกเมื่อ: `openclaw dashboard` (คัดลอกลิงก์ เปิดเบราว์เซอร์ถ้าทำได้ แสดงคำแนะนำ SSH หากเป็น headless)
- หากการส่งผ่านคลิปบอร์ดและเบราว์เซอร์ล้มเหลว `openclaw dashboard` ยังคงพิมพ์
  URL สะอาดและบอกให้คุณใช้โทเค็นจาก `OPENCLAW_GATEWAY_TOKEN` หรือ
  `gateway.auth.token` เป็นคีย์ fragment ของ URL ชื่อ `token`; คำสั่งนี้จะไม่พิมพ์ค่าโทเค็น
  ในล็อก
- หาก UI ขอ auth แบบ shared-secret ให้วางโทเค็นหรือ
  รหัสผ่านที่กำหนดค่าไว้ลงในการตั้งค่า UI ควบคุม

## พื้นฐาน auth (ในเครื่องเทียบกับระยะไกล)

- **Localhost**: เปิด `http://127.0.0.1:18789/`
- **Gateway TLS**: เมื่อ `gateway.tls.enabled: true` ลิงก์แดชบอร์ด/สถานะจะใช้
  `https://` และลิงก์ WebSocket ของ UI ควบคุมจะใช้ `wss://`
- **แหล่งที่มาของโทเค็น shared-secret**: `gateway.auth.token` (หรือ
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` สามารถส่งผ่าน URL fragment
  สำหรับการ bootstrap ครั้งเดียว และ UI ควบคุมจะเก็บไว้ใน sessionStorage สำหรับ
  เซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL gateway ที่เลือก แทนที่จะใช้ localStorage
- หาก `gateway.auth.token` จัดการโดย SecretRef `openclaw dashboard`
  จะพิมพ์/คัดลอก/เปิด URL ที่ไม่มีโทเค็นตามการออกแบบ วิธีนี้ช่วยหลีกเลี่ยงการเปิดเผย
  โทเค็นที่จัดการภายนอกในล็อกเชลล์ ประวัติคลิปบอร์ด หรืออาร์กิวเมนต์
  การเปิดเบราว์เซอร์
- หาก `gateway.auth.token` ถูกกำหนดค่าเป็น SecretRef และยัง resolve ไม่ได้ใน
  เชลล์ปัจจุบันของคุณ `openclaw dashboard` จะยังคงพิมพ์ URL ที่ไม่มีโทเค็นพร้อม
  คำแนะนำการตั้งค่า auth ที่นำไปใช้ได้
- **รหัสผ่าน shared-secret**: ใช้ `gateway.auth.password` ที่กำหนดค่าไว้ (หรือ
  `OPENCLAW_GATEWAY_PASSWORD`) แดชบอร์ดจะไม่คงรหัสผ่านไว้ข้ามการโหลดซ้ำ
- **โหมดที่มีข้อมูลประจำตัว**: Tailscale Serve สามารถตอบสนอง auth ของ UI ควบคุม/WebSocket
  ผ่านส่วนหัวข้อมูลประจำตัวเมื่อ `gateway.auth.allowTailscale: true` และ
  reverse proxy ที่รับรู้ข้อมูลประจำตัวแบบ non-loopback สามารถตอบสนอง
  `gateway.auth.mode: "trusted-proxy"` ได้ ในโหมดเหล่านั้นแดชบอร์ดไม่จำเป็นต้อง
  วาง shared secret สำหรับ WebSocket
- **ไม่ใช่ localhost**: ใช้ Tailscale Serve, การ bind shared-secret แบบ non-loopback,
  reverse proxy แบบ non-loopback ที่รับรู้ข้อมูลประจำตัวพร้อม
  `gateway.auth.mode: "trusted-proxy"` หรืออุโมงค์ SSH HTTP API ยังคงใช้
  auth แบบ shared-secret เว้นแต่คุณตั้งใจเรียกใช้ private-ingress
  `gateway.auth.mode: "none"` หรือ auth HTTP แบบ trusted-proxy ดู
  [พื้นผิวเว็บ](/th/web)

<a id="if-you-see-unauthorized-1008"></a>

## หากคุณเห็น "unauthorized" / 1008

- ตรวจสอบให้แน่ใจว่า gateway เข้าถึงได้ (ในเครื่อง: `openclaw status`; ระยะไกล: อุโมงค์ SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` จากนั้นเปิด `http://127.0.0.1:18789/`)
- สำหรับ `AUTH_TOKEN_MISMATCH` ไคลเอนต์อาจลองใหม่แบบเชื่อถือได้หนึ่งครั้งด้วยโทเค็นอุปกรณ์ที่แคชไว้เมื่อ gateway ส่งคืนคำใบ้สำหรับการลองใหม่ การลองใหม่ด้วยโทเค็นที่แคชไว้นั้นจะใช้ขอบเขตที่อนุมัติและแคชไว้ของโทเค็นซ้ำ ผู้เรียกที่ระบุ `deviceToken` / `scopes` อย่างชัดเจนจะยังคงใช้ชุดขอบเขตที่ร้องขอไว้ หาก auth ยังล้มเหลวหลังจากการลองใหม่นั้น ให้แก้ไข token drift ด้วยตนเอง
- นอกพาธการลองใหม่นั้น ลำดับความสำคัญของ connect auth คือ shared token/password ที่ระบุชัดเจนก่อน จากนั้น `deviceToken` ที่ระบุชัดเจน จากนั้นโทเค็นอุปกรณ์ที่จัดเก็บไว้ และสุดท้ายโทเค็น bootstrap
- บนพาธ UI ควบคุมของ Tailscale Serve แบบ async ความพยายามที่ล้มเหลวสำหรับ
  `{scope, ip}` เดียวกันจะถูกทำให้ทำงานตามลำดับก่อนที่ตัวจำกัด failed-auth จะบันทึกไว้ ดังนั้น
  การลองใหม่ที่ไม่ถูกต้องพร้อมกันครั้งที่สองอาจแสดง `retry later` ได้แล้ว
- สำหรับขั้นตอนการซ่อมแซม token drift ให้ทำตาม [เช็กลิสต์การกู้คืน token drift](/th/cli/devices#token-drift-recovery-checklist)
- ดึงหรือระบุ shared secret จากโฮสต์ gateway:
  - โทเค็น: `openclaw config get gateway.auth.token`
  - รหัสผ่าน: resolve `gateway.auth.password` ที่กำหนดค่าไว้ หรือ
    `OPENCLAW_GATEWAY_PASSWORD`
  - โทเค็นที่จัดการโดย SecretRef: resolve ผู้ให้บริการ secret ภายนอก หรือ export
    `OPENCLAW_GATEWAY_TOKEN` ในเชลล์นี้ จากนั้นเรียก `openclaw dashboard` อีกครั้ง
  - ไม่มี shared secret ที่กำหนดค่าไว้: `openclaw doctor --generate-gateway-token`
- ในการตั้งค่าแดชบอร์ด ให้วางโทเค็นหรือรหัสผ่านลงในช่อง auth
  แล้วเชื่อมต่อ
- ตัวเลือกภาษา UI อยู่ใน **ภาพรวม -> การเข้าถึง Gateway -> ภาษา**
  เป็นส่วนหนึ่งของการ์ดการเข้าถึง ไม่ใช่ส่วน Appearance

## ที่เกี่ยวข้อง

- [UI ควบคุม](/th/web/control-ui)
- [WebChat](/th/web/webchat)
