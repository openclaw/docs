---
read_when:
    - การจัดแพ็กเกจ OpenClaw.app
    - การดีบักบริการ launchd ของ Gateway บน macOS
    - การติดตั้ง CLI ของ Gateway สำหรับ macOS
summary: รันไทม์ Gateway บน macOS (บริการ launchd ภายนอก)
title: Gateway บน macOS
x-i18n:
    generated_at: "2026-07-16T19:25:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 30c1ae14d8f8eaab73d0e2b725292d7411c2c8b5e0e0c32ad13989c01340d054
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app ไม่ได้รวม Node หรือรันไทม์ Gateway ไว้ด้วย แอป macOS
ต้องใช้การติดตั้ง CLI `openclaw` แบบ **ภายนอก** ไม่ได้เรียกใช้ Gateway เป็น
โพรเซสลูก และจัดการบริการ launchd แยกตามผู้ใช้เพื่อให้ Gateway
ทำงานอย่างต่อเนื่อง (หรือเชื่อมต่อกับ Gateway ภายในเครื่องที่กำลังทำงานอยู่แล้ว)

## การตั้งค่าอัตโนมัติ

บน Mac เครื่องใหม่ ให้เลือก **This Mac** ระหว่างการเริ่มต้นใช้งาน แอปจะเรียกใช้
สคริปต์ติดตั้งที่ลงนามและรวมมากับแอปก่อนตัวช่วยตั้งค่า Gateway โดยจะติดตั้ง
รันไทม์ Node ในพื้นที่ของผู้ใช้และ CLI `openclaw` เวอร์ชันที่ตรงกันภายใต้ `~/.openclaw`
จากนั้นติดตั้งและเริ่มบริการ launchd แยกตามผู้ใช้ วิธีนี้ไม่จำเป็นต้องใช้
Terminal, Homebrew หรือสิทธิ์ผู้ดูแลระบบ

แอปรวมเฉพาะสคริปต์ติดตั้งเท่านั้น ไม่ได้รวมเพย์โหลด Node หรือ Gateway
การตั้งค่าต้องใช้การเชื่อมต่ออินเทอร์เน็ตเพื่อดาวน์โหลดรันไทม์และแพ็กเกจ
OpenClaw เวอร์ชันที่ตรงกัน

## การกู้คืนด้วยตนเอง

แนะนำให้ใช้ Node 24.15+ สำหรับการติดตั้งด้วยตนเอง และ Node 22.22.3+ ก็ใช้งานได้เช่นกัน ติดตั้ง
`openclaw` แบบส่วนกลาง:

```bash
npm install -g openclaw@<version>
```

ใช้ **Retry setup** หลังจากการตั้งค่าอัตโนมัติล้มเหลว หากยังคงล้มเหลว
ให้ติดตั้ง CLI ด้วยตนเองโดยใช้คำสั่งด้านบน จากนั้นเลือก **Check again**
ระหว่างการเริ่มต้นใช้งาน

## Launchd (Gateway ในรูปแบบ LaunchAgent)

ป้ายกำกับ: `ai.openclaw.gateway` (โปรไฟล์เริ่มต้น) หรือ `ai.openclaw.<profile>`
สำหรับโปรไฟล์ที่มีชื่อ

ตำแหน่ง Plist (แยกตามผู้ใช้): `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
(หรือ `ai.openclaw.<profile>.plist`)

แอป macOS เป็นผู้จัดการการติดตั้ง/อัปเดต LaunchAgent สำหรับโปรไฟล์เริ่มต้นใน
โหมด Local นอกจากนี้ CLI ยังสามารถติดตั้งโดยตรงได้ด้วย: `openclaw gateway install`
(เลือกโปรไฟล์ที่มีชื่อผ่านตัวแปรสภาพแวดล้อม `OPENCLAW_PROFILE`)

ลักษณะการทำงาน:

- "OpenClaw Active" เปิด/ปิดใช้งาน LaunchAgent
- การออกจากแอปจะ **ไม่** หยุด Gateway (launchd จะคงให้ทำงานต่อไป)
- หาก Gateway กำลังทำงานบนพอร์ตที่กำหนดค่าไว้แล้ว แอปจะเชื่อมต่อกับ
  Gateway นั้นแทนการเริ่มอินสแตนซ์ใหม่

การบันทึกล็อก:

- stdout ของ launchd: `~/Library/Logs/openclaw/gateway.log` (โปรไฟล์ใช้
  `gateway-<profile>.log`)
- stderr ของ launchd: ถูกระงับ
- หากโฮสต์วนซ้ำพร้อม `EADDRINUSE` ซ้ำๆ หรือรีสตาร์ตอย่างรวดเร็ว ให้ตรวจสอบ
  LaunchAgent `ai.openclaw.gateway` / `ai.openclaw.node` ที่ซ้ำกัน และวิธีแก้ปัญหาชั่วคราวสำหรับ
  ตัวทำเครื่องหมาย launchd ใน
  [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#macos-launchd-supervisor-loop-with-duplicate-gatewaynode-launchagents)

## ความเข้ากันได้ของเวอร์ชัน

แอป macOS ตรวจสอบเวอร์ชัน Gateway เทียบกับเวอร์ชันของแอปเอง การเริ่มต้นใช้งาน
จะเรียกใช้การตั้งค่าที่มีการจัดการโดยอัตโนมัติเมื่อ CLI ที่มีอยู่หายไปหรือ
เข้ากันไม่ได้ ใช้ **Retry setup** เพื่อทำการติดตั้งซ้ำ หรือ **Check again**
หลังจากซ่อมแซม CLI ภายนอกแล้ว

## ไดเรกทอรีสถานะบน macOS

เก็บสถานะของ OpenClaw ไว้ในดิสก์ภายในเครื่องที่ไม่ได้ซิงค์ หลีกเลี่ยง iCloud Drive และ
โฟลเดอร์อื่นๆ ที่ซิงค์กับระบบคลาวด์ เนื่องจากความล่าช้าในการซิงค์และการล็อกไฟล์อาจส่งผลต่อเซสชัน
ข้อมูลประจำตัว และสถานะ Gateway

ตั้งค่า `OPENCLAW_STATE_DIR` เป็นพาธภายในเครื่องเฉพาะเมื่อต้องการแทนที่ค่า
`openclaw doctor` จะแจ้งเตือนเกี่ยวกับพาธสถานะที่ซิงค์กับระบบคลาวด์ซึ่งพบได้บ่อย และแนะนำ
ให้ย้ายกลับไปยังพื้นที่จัดเก็บภายในเครื่อง ดู
[ตัวแปรสภาพแวดล้อม](/th/help/environment#path-related-env-vars) และ
[Doctor](/th/gateway/doctor)

## การดีบักการเชื่อมต่อของแอป

ใช้ CLI ดีบักของ macOS จากสำเนาซอร์สโค้ดที่เช็กเอาต์ เพื่อทดสอบแฮนด์เชก WebSocket ของ Gateway
และตรรกะการค้นหาแบบเดียวกับที่แอปใช้:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` รองรับ `--url`, `--token`, `--timeout`, `--probe` และ `--json`
(รวมถึงการแทนที่ข้อมูลระบุตัวตนของไคลเอนต์ ให้เรียกใช้พร้อม `--help` เพื่อดูรายการทั้งหมด)
`discover` รองรับ `--timeout`, `--json` และ `--include-local` เปรียบเทียบ
ผลลัพธ์การค้นหากับ `openclaw gateway discover --json` เมื่อต้องการ
แยกปัญหาการค้นหาของ CLI ออกจากปัญหาการเชื่อมต่อฝั่งแอป

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
- [คู่มือการดำเนินงาน Gateway](/th/gateway)
