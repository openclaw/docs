---
read_when:
    - การเปลี่ยนโหมดการยืนยันตัวตนหรือการเปิดให้เข้าถึงแดชบอร์ด
summary: การเข้าถึงและการยืนยันตัวตนของแดชบอร์ด Gateway (UI ควบคุม)
title: แดชบอร์ด
x-i18n:
    generated_at: "2026-07-16T19:49:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 34d7ab6c5f503f2dd3ab212a1fc6b47c84fcd47c5ad88aa9cdbbbbc73b7ef90e
    source_path: web/dashboard.md
    workflow: 16
---

Gateway dashboard คือ Control UI บนเบราว์เซอร์ ซึ่งให้บริการที่ `/` โดยค่าเริ่มต้น (เปลี่ยนได้ด้วย `gateway.controlUi.basePath`)

เปิดอย่างรวดเร็ว (Gateway ภายในเครื่อง):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (หรือ [http://localhost:18789/](http://localhost:18789/))
- เมื่อใช้ `gateway.tls.enabled: true` ให้ใช้ `https://127.0.0.1:18789/` และ `wss://127.0.0.1:18789` เป็นปลายทาง WebSocket

ข้อมูลอ้างอิงหลัก:

- [Control UI](/th/web/control-ui) สำหรับวิธีใช้งานและความสามารถของ UI
- [Tailscale](/th/gateway/tailscale) สำหรับการทำงานอัตโนมัติของ Serve/Funnel
- [พื้นผิวเว็บ](/th/web) สำหรับโหมดการผูกและหมายเหตุด้านความปลอดภัย

ระบบบังคับใช้การยืนยันตัวตนระหว่างการจับมือ WebSocket ผ่านเส้นทางการยืนยันตัวตนของ Gateway ที่กำหนดค่าไว้:

- `connect.params.auth.token`
- `connect.params.auth.password`
- ส่วนหัวข้อมูลประจำตัวของ Tailscale Serve เมื่อ `gateway.auth.allowTailscale: true`
- ส่วนหัวข้อมูลประจำตัวของพร็อกซีที่เชื่อถือได้เมื่อ `gateway.auth.mode: "trusted-proxy"`

ดู `gateway.auth` ใน [การกำหนดค่า Gateway](/th/gateway/configuration)

<Warning>
Control UI เป็น **พื้นผิวสำหรับผู้ดูแลระบบ** (แชต การกำหนดค่า การอนุมัติการดำเนินการ) อย่าเปิดเผยต่อสาธารณะ UI จะเก็บโทเค็น URL ของ dashboard ไว้ใน sessionStorage สำหรับแท็บเบราว์เซอร์ปัจจุบันและ URL ของ Gateway ที่เลือก และนำโทเค็นออกจาก URL หลังโหลดเสร็จ ควรใช้ localhost, Tailscale Serve หรืออุโมงค์ SSH
</Warning>

## เส้นทางด่วน (แนะนำ)

- หลังการเริ่มต้นใช้งาน CLI จะเปิด dashboard โดยอัตโนมัติและแสดงลิงก์แบบสะอาด (ไม่มีโทเค็น)
- เปิดอีกครั้งได้ทุกเมื่อ: `openclaw dashboard` (คัดลอกลิงก์ เปิดเบราว์เซอร์หากทำได้ และแสดงคำแนะนำ SSH หากไม่มีอินเทอร์เฟซกราฟิก)
- หากส่งผ่านทั้งคลิปบอร์ดและเบราว์เซอร์ไม่สำเร็จ `openclaw dashboard` จะยังคงแสดง URL แบบสะอาดและแจ้งให้ต่อท้ายโทเค็น (จาก `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.token`) เป็นคีย์แฟรกเมนต์ URL `token`; โดยจะไม่แสดงค่าของโทเค็นในบันทึก
- หาก UI ขอการยืนยันตัวตนด้วยข้อมูลลับร่วม ให้วางโทเค็นหรือรหัสผ่านที่กำหนดค่าไว้ในการตั้งค่า Control UI

## พื้นฐานการยืนยันตัวตน (ภายในเครื่องเทียบกับระยะไกล)

- **Localhost**: เปิด `http://127.0.0.1:18789/`
- **TLS ของ Gateway**: เมื่อ `gateway.tls.enabled: true` ลิงก์ dashboard/สถานะจะใช้ `https://` และลิงก์ WebSocket ของ Control UI จะใช้ `wss://`
- **แหล่งที่มาของโทเค็นข้อมูลลับร่วม**: `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`) `openclaw dashboard` สามารถส่งโทเค็นผ่านแฟรกเมนต์ URL เพื่อเริ่มต้นระบบครั้งเดียว โดย Control UI จะเก็บโทเค็นไว้ใน sessionStorage สำหรับแท็บปัจจุบันและ URL ของ Gateway ที่เลือก ไม่ใช่ localStorage
- หาก `gateway.auth.token` จัดการโดย SecretRef ตามการออกแบบแล้ว `openclaw dashboard` จะแสดง/คัดลอก/เปิด URL ที่ไม่มีโทเค็น เพื่อหลีกเลี่ยงการเปิดเผยโทเค็นที่จัดการจากภายนอกในบันทึกเชลล์ ประวัติคลิปบอร์ด หรืออาร์กิวเมนต์สำหรับเปิดเบราว์เซอร์ หากไม่สามารถแก้ไขการอ้างอิงได้ในเชลล์ปัจจุบัน ระบบจะยังคงแสดง URL ที่ไม่มีโทเค็นพร้อมคำแนะนำที่นำไปปฏิบัติได้สำหรับการตั้งค่าการยืนยันตัวตน
- **รหัสผ่านข้อมูลลับร่วม**: ใช้ `gateway.auth.password` ที่กำหนดค่าไว้ (หรือ `OPENCLAW_GATEWAY_PASSWORD`) dashboard จะไม่เก็บรหัสผ่านไว้หลังโหลดใหม่
- **โหมดที่มีข้อมูลประจำตัว**: Tailscale Serve จะผ่านการยืนยันตัวตนของ Control UI/WebSocket ด้วยส่วนหัวข้อมูลประจำตัวเมื่อ `gateway.auth.allowTailscale: true`; ส่วนพร็อกซีย้อนกลับที่รับรู้ข้อมูลประจำตัวและไม่ใช่ loopback จะผ่าน `gateway.auth.mode: "trusted-proxy"` ทั้งสองแบบไม่ต้องวางข้อมูลลับร่วมสำหรับ WebSocket
- **ไม่ใช่ localhost**: ใช้ Tailscale Serve, การผูกแบบไม่ใช่ loopback ที่ใช้ข้อมูลลับร่วม, พร็อกซีย้อนกลับแบบไม่ใช่ loopback ที่รับรู้ข้อมูลประจำตัวร่วมกับ `gateway.auth.mode: "trusted-proxy"` หรืออุโมงค์ SSH ส่วน API ของ HTTP ยังคงใช้การยืนยันตัวตนด้วยข้อมูลลับร่วม เว้นแต่ตั้งใจใช้ `gateway.auth.mode: "none"` แบบทางเข้าระบบส่วนตัว หรือการยืนยันตัวตน HTTP ของพร็อกซีที่เชื่อถือได้ ดู [พื้นผิวเว็บ](/th/web)

## เปิดใน Telegram

บอต Telegram สามารถเปิด dashboard เป็น Telegram Mini App ด้วย `/dashboard`

ข้อกำหนด:

- `gateway.tailscale.mode: "serve"` หรือ `"funnel"` เพื่อให้ Telegram ได้รับ URL ของ Mini App แบบ HTTPS
- ผู้ส่ง Telegram ต้องเป็นเจ้าของบอต: ID ผู้ใช้ Telegram แบบตัวเลขใน `commands.ownerAllowFrom` หรือ `channels.telegram.allowFrom` ที่มีผลของบัญชีที่เลือก
- เรียกใช้ `/dashboard` ใน DM กับบอต การเรียกใช้ในกลุ่มจะแจ้งเพียงให้เปิดคำสั่งใน DM และจะไม่มีปุ่ม
- การติดตั้ง Docker: โหมด Serve/Funnel กำหนดให้ Gateway ผูกกับ loopback ข้าง `tailscaled` ซึ่งเครือข่ายแบบบริดจ์ที่เผยแพร่พอร์ตไม่สามารถรองรับได้ ให้เรียกใช้คอนเทนเนอร์ Gateway ด้วย `network_mode: host` และเมานต์ซ็อกเก็ต `tailscaled` ของโฮสต์ (`/var/run/tailscale`) พร้อมทั้ง CLI `tailscale` เข้าไปในคอนเทนเนอร์

Mini App จะดำเนินการส่งต่อสิทธิ์ของเจ้าของครั้งเดียว และเปลี่ยนเส้นทางไปยัง Control UI พร้อมโทเค็นเริ่มต้นระบบอายุสั้น โดยไม่เปิดเผยโทเค็นร่วมของ Gateway ใน URL

สิ่งที่ไม่ใช่เป้าหมายสำหรับ v1:

- ไม่รองรับ iframe ของ Telegram Web
- Tailscale Serve/Funnel เป็นเส้นทาง URL ที่เผยแพร่ซึ่งรองรับเพียงแบบเดียว

<a id="if-you-see-unauthorized-1008"></a>

## หากพบ "unauthorized" / 1008

- ยืนยันว่าเข้าถึง Gateway ได้: ภายในเครื่องใช้ `openclaw status`; สำหรับระยะไกล ให้สร้างอุโมงค์ SSH ด้วย `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host` แล้วเปิด `http://127.0.0.1:18789/`
- สำหรับ `AUTH_TOKEN_MISMATCH` ไคลเอนต์อาจลองใหม่แบบเชื่อถือได้หนึ่งครั้งด้วยโทเค็นอุปกรณ์ที่แคชไว้ เมื่อ Gateway ส่งคืนคำแนะนำให้ลองใหม่ โดยการลองครั้งนั้นจะนำขอบเขตที่ได้รับอนุมัติและแคชไว้ของโทเค็นกลับมาใช้ใหม่ (ผู้เรียกที่ระบุ `deviceToken`/`scopes` อย่างชัดเจนจะยังคงชุดขอบเขตที่ร้องขอไว้) หากการยืนยันตัวตนยังล้มเหลวหลังลองใหม่ ให้แก้ไขความไม่ตรงกันของโทเค็นด้วยตนเอง
- สำหรับ `AUTH_SCOPE_MISMATCH` ระบบรู้จักโทเค็นอุปกรณ์ แต่โทเค็นไม่มีขอบเขตที่ร้องขอ ให้จับคู่ใหม่หรืออนุมัติชุดขอบเขตใหม่แทนการหมุนเวียนโทเค็นร่วมของ Gateway
- นอกเส้นทางการลองใหม่นั้น ลำดับความสำคัญของการยืนยันตัวตนเพื่อเชื่อมต่อคือ: โทเค็น/รหัสผ่านร่วมที่ระบุอย่างชัดเจน จากนั้น `deviceToken` ที่ระบุอย่างชัดเจน ต่อด้วยโทเค็นอุปกรณ์ที่จัดเก็บไว้ และสุดท้ายคือโทเค็นเริ่มต้นระบบ
- บนเส้นทาง Tailscale Serve แบบอะซิงโครนัส ความพยายามที่ล้มเหลวสำหรับ `{scope, ip}` เดียวกันจะถูกจัดลำดับก่อนที่ตัวจำกัดการยืนยันตัวตนล้มเหลวจะบันทึก ดังนั้นการลองใหม่ที่ไม่ถูกต้องครั้งที่สองซึ่งเกิดพร้อมกันอาจแสดง `retry later` ได้ทันที
- สำหรับขั้นตอนการซ่อมแซมความไม่ตรงกันของโทเค็น โปรดดู [รายการตรวจสอบการกู้คืนความไม่ตรงกันของโทเค็น](/th/cli/devices#token-drift-recovery-checklist)
- ดึงหรือระบุข้อมูลลับร่วมจากโฮสต์ Gateway:
  - โทเค็น: `openclaw config get gateway.auth.token`
  - รหัสผ่าน: แก้ไขค่า `gateway.auth.password` หรือ `OPENCLAW_GATEWAY_PASSWORD` ที่กำหนดค่าไว้
  - โทเค็นที่จัดการโดย SecretRef: แก้ไขผู้ให้บริการข้อมูลลับภายนอก หรือส่งออก `OPENCLAW_GATEWAY_TOKEN` ในเชลล์นี้ แล้วเรียกใช้ `openclaw dashboard` อีกครั้ง
  - ไม่ได้กำหนดค่าข้อมูลลับร่วม: `openclaw doctor --generate-gateway-token`
- ในการตั้งค่า dashboard ให้วางโทเค็นหรือรหัสผ่านในช่องการยืนยันตัวตน แล้วเชื่อมต่อ
- ตัวเลือกภาษาของ UI อยู่ที่ **Settings -> General -> Language** ไม่ได้อยู่ใต้ Appearance

## ที่เกี่ยวข้อง

- [Control UI](/th/web/control-ui)
- [WebChat](/th/web/webchat)
