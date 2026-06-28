---
read_when:
    - การแพ็กเกจ OpenClaw.app
    - การดีบักบริการ launchd ของ Gateway บน macOS
    - การติดตั้ง Gateway CLI สำหรับ macOS
summary: รันไทม์ Gateway บน macOS (บริการ launchd ภายนอก)
title: Gateway บน macOS
x-i18n:
    generated_at: "2026-06-28T00:13:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5317e82435ecf179407116339507a666957a8e23a07a49665233b22f22f5b155
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app จะไม่บันเดิล Node/Bun หรือรันไทม์ Gateway อีกต่อไป แอป macOS
คาดหวังการติดตั้ง CLI `openclaw` แบบ **ภายนอก** ไม่ได้สปอน Gateway เป็น
โพรเซสลูก และจัดการบริการ launchd ต่อผู้ใช้เพื่อให้ Gateway
ทำงานอยู่เสมอ (หรือเชื่อมต่อกับ Gateway ภายในเครื่องที่มีอยู่แล้ว หากมีตัวหนึ่งทำงานอยู่แล้ว)

## ติดตั้ง CLI (จำเป็นสำหรับโหมดภายในเครื่อง)

Node 24 เป็นรันไทม์เริ่มต้นบน Mac ส่วน Node 22 LTS ซึ่งปัจจุบันคือ `22.19+` ยังทำงานได้เพื่อความเข้ากันได้ จากนั้นติดตั้ง `openclaw` แบบโกลบอล:

```bash
npm install -g openclaw@<version>
```

ปุ่ม **ติดตั้ง CLI** ของแอป macOS จะรันโฟลว์การติดตั้งแบบโกลบอลเดียวกับที่แอป
ใช้ภายใน: จะเลือก npm ก่อน จากนั้น pnpm แล้วจึง bun หากนั่นเป็นตัวจัดการแพ็กเกจเดียว
ที่ตรวจพบ Node ยังคงเป็นรันไทม์ Gateway ที่แนะนำ

## Launchd (Gateway เป็น LaunchAgent)

ป้ายกำกับ:

- `ai.openclaw.gateway` (หรือ `ai.openclaw.<profile>`; `com.openclaw.*` แบบเดิมอาจยังคงอยู่)

ตำแหน่ง Plist (ต่อผู้ใช้):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (หรือ `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

ตัวจัดการ:

- แอป macOS เป็นเจ้าของการติดตั้ง/อัปเดต LaunchAgent ในโหมด Local
- CLI สามารถติดตั้งได้เช่นกัน: `openclaw gateway install`

พฤติกรรม:

- "OpenClaw ใช้งานอยู่" เปิด/ปิด LaunchAgent
- การออกจากแอป **ไม่** หยุด Gateway (launchd จะคงให้มันทำงานอยู่)
- หากมี Gateway ทำงานอยู่แล้วบนพอร์ตที่กำหนดค่าไว้ แอปจะเชื่อมต่อกับ
  Gateway นั้นแทนการเริ่มตัวใหม่

การบันทึกล็อก:

- stdout ของ launchd: `~/Library/Logs/openclaw/gateway.log` (โปรไฟล์ใช้ `gateway-<profile>.log`)
- stderr ของ launchd: ถูกระงับ

## ความเข้ากันได้ของเวอร์ชัน

แอป macOS จะตรวจสอบเวอร์ชันของ Gateway เทียบกับเวอร์ชันของตัวเอง หากทั้งสอง
เข้ากันไม่ได้ ให้อัปเดต CLI แบบโกลบอลให้ตรงกับเวอร์ชันของแอป

## ไดเรกทอรีสถานะบน macOS

เก็บสถานะของ OpenClaw ไว้บนดิสก์ภายในเครื่องที่ไม่ซิงค์ หลีกเลี่ยง iCloud Drive และโฟลเดอร์อื่น
ที่ซิงค์ผ่านคลาวด์ เพราะความหน่วงในการซิงค์และการล็อกไฟล์อาจส่งผลต่อเซสชัน
ข้อมูลประจำตัว และสถานะ Gateway

ตั้งค่า `OPENCLAW_STATE_DIR` เป็นพาธภายในเครื่องเท่านั้นเมื่อคุณต้องการโอเวอร์ไรด์
`openclaw doctor` จะเตือนเกี่ยวกับพาธสถานะที่มักซิงค์ผ่านคลาวด์ และแนะนำ
ให้ย้ายกลับไปใช้พื้นที่จัดเก็บภายในเครื่อง ดู
[ตัวแปรสภาพแวดล้อม](/th/help/environment#path-related-env-vars) และ
[Doctor](/th/gateway/doctor)

## ดีบักการเชื่อมต่อของแอป

ใช้ CLI ดีบักของ macOS จากซอร์สเช็กเอาต์เพื่อทดสอบแฮนด์เชก Gateway
WebSocket และตรรกะการค้นพบเดียวกับที่แอปใช้:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` รับ `--url`, `--token`, `--timeout` และ `--json` ส่วน `discover`
รับ `--timeout`, `--json` และ `--include-local` เปรียบเทียบเอาต์พุตการค้นพบ
กับ `openclaw gateway discover --json` เมื่อคุณต้องการแยกปัญหาการค้นพบของ CLI
ออกจากปัญหาการเชื่อมต่อฝั่งแอป

## ตรวจสอบ Smoke

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
