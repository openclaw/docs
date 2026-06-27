---
read_when:
    - การแพ็กเกจ OpenClaw.app
    - การดีบักบริการ launchd ของ Gateway บน macOS
    - การติดตั้ง Gateway CLI สำหรับ macOS
summary: รันไทม์ Gateway บน macOS (บริการ launchd ภายนอก)
title: Gateway บน macOS
x-i18n:
    generated_at: "2026-06-27T17:49:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c55e3d24e5bc743233e11be4897f4f2a865c97f2e0d795a472caeb6d097d34
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app ไม่ได้บันเดิล Node/Bun หรือรันไทม์ Gateway อีกต่อไป แอป macOS
คาดว่าจะมีการติดตั้ง CLI `openclaw` **ภายนอก** ไม่สร้าง Gateway เป็น
โปรเซสลูก และจัดการบริการ launchd รายผู้ใช้เพื่อให้ Gateway
ทำงานต่อเนื่อง (หรือเชื่อมต่อกับ Gateway ภายในเครื่องที่มีอยู่แล้ว หากมีตัวหนึ่งทำงานอยู่)

## ติดตั้ง CLI (จำเป็นสำหรับโหมดภายในเครื่อง)

Node 24 เป็นรันไทม์เริ่มต้นบน Mac ส่วน Node 22 LTS ซึ่งปัจจุบันคือ `22.19+` ยังใช้งานได้เพื่อความเข้ากันได้ จากนั้นติดตั้ง `openclaw` แบบโกลบอล:

```bash
npm install -g openclaw@<version>
```

ปุ่ม **ติดตั้ง CLI** ของแอป macOS จะรันโฟลว์ติดตั้งแบบโกลบอลเดียวกับที่แอป
ใช้ภายใน: แอปจะเลือก npm ก่อน ตามด้วย pnpm แล้วจึงเลือก bun หากนั่นเป็น
ตัวจัดการแพ็กเกจเดียวที่ตรวจพบ Node ยังคงเป็นรันไทม์ Gateway ที่แนะนำ

## Launchd (Gateway เป็น LaunchAgent)

ป้ายกำกับ:

- `ai.openclaw.gateway` (หรือ `ai.openclaw.<profile>`; ค่าเดิม `com.openclaw.*` อาจยังคงอยู่)

ตำแหน่ง Plist (รายผู้ใช้):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (หรือ `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

ตัวจัดการ:

- แอป macOS เป็นเจ้าของการติดตั้ง/อัปเดต LaunchAgent ในโหมด Local
- CLI ก็สามารถติดตั้งได้เช่นกัน: `openclaw gateway install`

ลักษณะการทำงาน:

- "OpenClaw ทำงานอยู่" เปิด/ปิด LaunchAgent
- การออกจากแอป **ไม่** หยุด Gateway (launchd จะคงให้ทำงานต่อ)
- หากมี Gateway ทำงานอยู่แล้วบนพอร์ตที่กำหนดค่าไว้ แอปจะเชื่อมต่อกับ
  Gateway นั้นแทนการเริ่มตัวใหม่

การบันทึกล็อก:

- stdout ของ launchd: `~/Library/Logs/openclaw/gateway.log` (โปรไฟล์ใช้ `gateway-<profile>.log`)
- stderr ของ launchd: ระงับไว้

## ความเข้ากันได้ของเวอร์ชัน

แอป macOS จะตรวจสอบเวอร์ชัน Gateway เทียบกับเวอร์ชันของตัวเอง หากไม่
เข้ากัน ให้อัปเดต CLI แบบโกลบอลให้ตรงกับเวอร์ชันของแอป

## การตรวจสอบเบื้องต้น

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

จากนั้น:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
