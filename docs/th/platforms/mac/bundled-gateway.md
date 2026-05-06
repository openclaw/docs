---
read_when:
    - การแพ็กเกจ OpenClaw.app
    - การแก้ไขข้อบกพร่องบริการ launchd ของ Gateway บน macOS
    - การติดตั้ง Gateway CLI สำหรับ macOS
summary: รันไทม์ของ Gateway บน macOS (บริการ launchd ภายนอก)
title: Gateway บน macOS
x-i18n:
    generated_at: "2026-05-06T09:22:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f5dcc73671140d7599ffefceeb98ac7ce34da1f944c1e7c70bc9e5810e6ca66
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app จะไม่บันเดิล Node/Bun หรือรันไทม์ Gateway อีกต่อไป แอป macOS
คาดหวังให้มีการติดตั้ง CLI `openclaw` **ภายนอก** ไม่ได้เรียกใช้ Gateway เป็น
โปรเซสลูก และจัดการบริการ launchd รายผู้ใช้เพื่อให้ Gateway
ทำงานต่อเนื่อง (หรือเชื่อมต่อกับ Gateway ภายในเครื่องที่มีอยู่แล้วหากกำลังทำงานอยู่)

## ติดตั้ง CLI (จำเป็นสำหรับโหมดภายในเครื่อง)

Node 24 เป็นรันไทม์เริ่มต้นบน Mac ส่วน Node 22 LTS ซึ่งปัจจุบันคือ `22.14+` ยังใช้งานได้เพื่อความเข้ากันได้ จากนั้นติดตั้ง `openclaw` แบบโกลบอล:

```bash
npm install -g openclaw@<version>
```

ปุ่ม **ติดตั้ง CLI** ของแอป macOS จะเรียกใช้โฟลว์การติดตั้งแบบโกลบอลเดียวกับที่แอป
ใช้ภายใน: โดยจะเลือก npm ก่อน ตามด้วย pnpm แล้วจึงใช้ bun หากเป็น package manager
เดียวที่ตรวจพบ Node ยังคงเป็นรันไทม์ Gateway ที่แนะนำ

## Launchd (Gateway เป็น LaunchAgent)

ป้ายกำกับ:

- `ai.openclaw.gateway` (หรือ `ai.openclaw.<profile>`; ค่าเดิม `com.openclaw.*` อาจยังคงอยู่)

ตำแหน่ง Plist (รายผู้ใช้):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (หรือ `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

ตัวจัดการ:

- แอป macOS เป็นเจ้าของการติดตั้ง/อัปเดต LaunchAgent ในโหมด Local
- CLI ก็สามารถติดตั้งได้เช่นกัน: `openclaw gateway install`

พฤติกรรม:

- "OpenClaw ใช้งานอยู่" เปิด/ปิดใช้งาน LaunchAgent
- การออกจากแอป **ไม่** หยุด Gateway (launchd จะคงให้ทำงานต่อ)
- หากมี Gateway กำลังทำงานอยู่บนพอร์ตที่กำหนดค่าไว้แล้ว แอปจะเชื่อมต่อกับ
  Gateway นั้นแทนการเริ่มตัวใหม่

การบันทึก:

- stdout/err ของ launchd: `/tmp/openclaw/openclaw-gateway.log`

## ความเข้ากันได้ของเวอร์ชัน

แอป macOS จะตรวจสอบเวอร์ชัน Gateway เทียบกับเวอร์ชันของตัวเอง หากไม่เข้ากัน
ให้อัปเดต CLI แบบโกลบอลให้ตรงกับเวอร์ชันของแอป

## การตรวจสอบแบบ smoke

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
- [รันบุ๊ก Gateway](/th/gateway)
