---
read_when:
    - การเปลี่ยนโหมดการยืนยันตัวตนหรือการเปิดเผยของแดชบอร์ด
summary: การเข้าถึงและการยืนยันตัวตนของแดชบอร์ด Gateway (Control UI)
title: แดชบอร์ด
x-i18n:
    generated_at: "2026-04-25T14:02:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e0e7c8cebe715f96e7f0e967e9fd86c4c6c54f7cc08a4291b02515fc0933a1a
    source_path: web/dashboard.md
    workflow: 15
---

แดชบอร์ด Gateway คือ Control UI บนเบราว์เซอร์ที่ให้บริการที่ `/` โดยค่าเริ่มต้น
(override ได้ด้วย `gateway.controlUi.basePath`)

เปิดอย่างรวดเร็ว (Gateway ในเครื่อง):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (หรือ [http://localhost:18789/](http://localhost:18789/))
- เมื่อใช้ `gateway.tls.enabled: true` ให้ใช้ `https://127.0.0.1:18789/` และ
  `wss://127.0.0.1:18789` สำหรับ WebSocket endpoint

เอกสารอ้างอิงสำคัญ:

- [Control UI](/th/web/control-ui) สำหรับวิธีใช้งานและความสามารถของ UI
- [Tailscale](/th/gateway/tailscale) สำหรับระบบอัตโนมัติของ Serve/Funnel
- [Web surfaces](/th/web) สำหรับโหมดการ bind และหมายเหตุด้านความปลอดภัย

การยืนยันตัวตนจะถูกบังคับใช้ระหว่าง WebSocket handshake ผ่านเส้นทางการยืนยันตัวตนของ gateway ที่กำหนดไว้:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve identity headers เมื่อ `gateway.auth.allowTailscale: true`
- trusted-proxy identity headers เมื่อ `gateway.auth.mode: "trusted-proxy"`

ดู `gateway.auth` ใน [การกำหนดค่า Gateway](/th/gateway/configuration)

หมายเหตุด้านความปลอดภัย: Control UI เป็น **พื้นผิวสำหรับผู้ดูแลระบบ**
(แชต, config, การอนุมัติ exec) ห้ามเปิดเผยสู่สาธารณะ UI จะเก็บ dashboard URL tokens ไว้ใน sessionStorage
สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL ของ gateway ที่เลือก และจะลบ token ออกจาก URL หลังโหลดเสร็จ
ควรใช้ localhost, Tailscale Serve หรือ SSH tunnel

## เส้นทางลัด (แนะนำ)

- หลัง onboarding เสร็จ CLI จะเปิดแดชบอร์ดให้อัตโนมัติและพิมพ์ลิงก์แบบสะอาด (ไม่มี token)
- เปิดอีกครั้งได้ทุกเมื่อ: `openclaw dashboard` (คัดลอกลิงก์ เปิดเบราว์เซอร์หากทำได้ และแสดงคำแนะนำ SSH หากเป็นสภาพแวดล้อม headless)
- หาก UI ขอการยืนยันตัวตนแบบ shared-secret ให้วาง token หรือ
  password ที่กำหนดไว้ลงในการตั้งค่า Control UI

## พื้นฐานการยืนยันตัวตน (ในเครื่องเทียบกับระยะไกล)

- **Localhost**: เปิด `http://127.0.0.1:18789/`
- **Gateway TLS**: เมื่อ `gateway.tls.enabled: true` ลิงก์ dashboard/status จะใช้
  `https://` และลิงก์ WebSocket ของ Control UI จะใช้ `wss://`
- **แหล่ง token แบบ shared-secret**: `gateway.auth.token` (หรือ
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` สามารถส่งผ่าน URL fragment
  สำหรับ bootstrap แบบครั้งเดียว และ Control UI จะเก็บไว้ใน sessionStorage สำหรับ
  เซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL ของ gateway ที่เลือก แทน localStorage
- หาก `gateway.auth.token` ถูกจัดการด้วย SecretRef, `openclaw dashboard`
  จะพิมพ์/คัดลอก/เปิด URL ที่ไม่มี token โดยตั้งใจ วิธีนี้ช่วยหลีกเลี่ยงการเปิดเผย
  token ที่จัดการจากภายนอกใน shell logs, ประวัติคลิปบอร์ด หรืออาร์กิวเมนต์ตอนเปิดเบราว์เซอร์
- หาก `gateway.auth.token` ถูกกำหนดเป็น SecretRef และยัง resolve ไม่ได้ใน
  shell ปัจจุบันของคุณ `openclaw dashboard` จะยังคงพิมพ์ URL แบบไม่มี token พร้อม
  คำแนะนำการตั้งค่าการยืนยันตัวตนที่นำไปใช้ต่อได้
- **password แบบ shared-secret**: ใช้ `gateway.auth.password` ที่กำหนดไว้ (หรือ
  `OPENCLAW_GATEWAY_PASSWORD`) แดชบอร์ดจะไม่เก็บ password ข้ามการรีโหลด
- **โหมดที่มีข้อมูลระบุตัวตน**: Tailscale Serve สามารถทำให้การยืนยันตัวตนของ Control UI/WebSocket สำเร็จได้
  ผ่าน identity headers เมื่อ `gateway.auth.allowTailscale: true` และ
  reverse proxy แบบรับรู้ตัวตนที่ไม่ใช่ loopback สามารถทำให้สำเร็จได้เมื่อ
  `gateway.auth.mode: "trusted-proxy"` ในโหมดเหล่านี้แดชบอร์ดไม่จำเป็น
  ต้องวาง shared secret สำหรับ WebSocket
- **ไม่ใช่ localhost**: ใช้ Tailscale Serve, non-loopback shared-secret bind,
  non-loopback identity-aware reverse proxy ที่ใช้
  `gateway.auth.mode: "trusted-proxy"` หรือ SSH tunnel ส่วน HTTP APIs ยังคงใช้
  การยืนยันตัวตนแบบ shared-secret เว้นแต่คุณจะตั้งใจใช้ private-ingress
  `gateway.auth.mode: "none"` หรือ trusted-proxy HTTP auth ดู
  [Web surfaces](/th/web)

<a id="if-you-see-unauthorized-1008"></a>

## หากคุณเห็น "unauthorized" / 1008

- ตรวจสอบว่าเข้าถึง gateway ได้ (ในเครื่อง: `openclaw status`; ระยะไกล: SSH tunnel `ssh -N -L 18789:127.0.0.1:18789 user@host` แล้วเปิด `http://127.0.0.1:18789/`)
- สำหรับ `AUTH_TOKEN_MISMATCH` ไคลเอนต์อาจลองใหม่หนึ่งครั้งแบบเชื่อถือได้ด้วย cached device token เมื่อ gateway ส่ง retry hints กลับมา การลองใหม่ด้วย cached token นั้นจะใช้ approved scopes ที่แคชไว้ของ token เดิมต่อไป; ผู้เรียกที่ใช้ `deviceToken` แบบ explicit / `scopes` แบบ explicit จะยังคงใช้ชุด scope ที่ร้องขอไว้ หากการยืนยันตัวตนยังล้มเหลวหลังจากลองใหม่นั้น ให้แก้ token drift ด้วยตนเอง
- นอกเส้นทางการลองใหม่ดังกล่าว ลำดับความสำคัญของ connect auth คือ shared token/password แบบ explicit ก่อน จากนั้น `deviceToken` แบบ explicit จากนั้น stored device token แล้วจึง bootstrap token
- บนเส้นทาง Control UI แบบ async ของ Tailscale Serve ความพยายามที่ล้มเหลวสำหรับ
  `{scope, ip}` เดียวกันจะถูกจัดลำดับแบบอนุกรมก่อนที่ตัวจำกัด failed-auth จะบันทึกไว้ ดังนั้น
  การลองใหม่ที่ผิดพลาดพร้อมกันครั้งที่สองอาจแสดง `retry later` ได้แล้ว
- สำหรับขั้นตอนซ่อมแซม token drift ให้ทำตาม [เช็กลิสต์การกู้คืน token drift](/th/cli/devices#token-drift-recovery-checklist)
- ดึงหรือระบุ shared secret จากโฮสต์ gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Password: resolve `gateway.auth.password` ที่กำหนดไว้ หรือ
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token ที่จัดการด้วย SecretRef: resolve ผู้ให้บริการ secret ภายนอก หรือ export
    `OPENCLAW_GATEWAY_TOKEN` ใน shell นี้ แล้วรัน `openclaw dashboard` อีกครั้ง
  - ไม่มี shared secret ที่กำหนดไว้: `openclaw doctor --generate-gateway-token`
- ในการตั้งค่าแดชบอร์ด ให้วาง token หรือ password ลงในช่อง auth
  จากนั้นจึงเชื่อมต่อ
- ตัวเลือกภาษา UI อยู่ที่ **Overview -> Gateway Access -> Language**
  เป็นส่วนหนึ่งของการ์ดการเข้าถึง ไม่ใช่ส่วน Appearance

## ที่เกี่ยวข้อง

- [Control UI](/th/web/control-ui)
- [WebChat](/th/web/webchat)
