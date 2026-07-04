---
read_when:
    - การแพ็กเกจ OpenClaw.app
    - การดีบักบริการ launchd ของ Gateway บน macOS
    - การติดตั้ง Gateway CLI สำหรับ macOS
summary: รันไทม์ Gateway บน macOS (บริการ launchd ภายนอก)
title: Gateway บน macOS
x-i18n:
    generated_at: "2026-07-04T06:57:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8b646f4cae43cb66acbf3527ef2af9ccaf4b6f2678a464586a110e5e9b3662
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app ไม่ได้บันเดิล Node/Bun หรือรันไทม์ Gateway อีกต่อไป แอป macOS
คาดว่าจะมีการติดตั้ง CLI `openclaw` แบบ **ภายนอก** ไม่ได้สปอว์น Gateway เป็น
โพรเซสลูก และจัดการบริการ launchd ต่อผู้ใช้เพื่อให้ Gateway
ทำงานต่อเนื่อง (หรือแนบกับ Gateway ภายในเครื่องที่มีอยู่แล้ว หากมีตัวหนึ่งกำลังทำงานอยู่)

## การตั้งค่าอัตโนมัติ

บน Mac เครื่องใหม่ ให้เลือก **This Mac** ระหว่างการเริ่มใช้งาน แอปจะรันตัวติดตั้งที่ลงนามแล้วและ
บันเดิลมาด้วยก่อนตัวช่วย Gateway ติดตั้งรันไทม์ Node ในพื้นที่ผู้ใช้
และ CLI `openclaw` ที่ตรงกันไว้ใต้ `~/.openclaw` จากนั้นติดตั้งและเริ่มบริการ
launchd ต่อผู้ใช้ เส้นทางนี้ไม่ต้องใช้ Terminal, Homebrew หรือ
สิทธิ์ผู้ดูแลระบบ

แอปบันเดิลสคริปต์ติดตั้ง ไม่ใช่เพย์โหลด Node หรือ Gateway ดังนั้นการตั้งค่า
จึงต้องใช้อินเทอร์เน็ตเพื่อดาวน์โหลดรันไทม์และแพ็กเกจ
OpenClaw ที่ตรงกัน

## การกู้คืนด้วยตนเอง

แนะนำให้ใช้ Node 24 สำหรับการติดตั้งด้วยตนเอง Node 22 LTS ซึ่งปัจจุบันคือ `22.19+`
ก็ใช้งานได้เช่นกัน จากนั้นติดตั้ง `openclaw` แบบโกลบอล:

```bash
npm install -g openclaw@<version>
```

ใช้ **Retry setup** หลังจากการตั้งค่าอัตโนมัติล้มเหลว หากยังล้มเหลว ให้ติดตั้ง
CLI ด้วยตนเองด้วยคำสั่งด้านบน จากนั้นเลือก **Check again** ใน
การเริ่มใช้งาน Node ยังคงเป็นรันไทม์ Gateway ที่แนะนำ

## Launchd (Gateway เป็น LaunchAgent)

ป้ายกำกับ:

- `ai.openclaw.gateway` (หรือ `ai.openclaw.<profile>`; แบบเดิม `com.openclaw.*` อาจยังคงอยู่)

ตำแหน่ง Plist (ต่อผู้ใช้):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (หรือ `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

ตัวจัดการ:

- แอป macOS เป็นเจ้าของการติดตั้ง/อัปเดต LaunchAgent ในโหมด Local
- CLI ก็สามารถติดตั้งได้เช่นกัน: `openclaw gateway install`

พฤติกรรม:

- "OpenClaw Active" เปิด/ปิดใช้งาน LaunchAgent
- การออกจากแอป **ไม่** หยุด gateway (launchd จะคงให้ทำงานอยู่)
- หากมี Gateway กำลังทำงานอยู่บนพอร์ตที่กำหนดค่าไว้แล้ว แอปจะแนบกับ
  Gateway นั้นแทนการเริ่มตัวใหม่

การบันทึกล็อก:

- stdout ของ launchd: `~/Library/Logs/openclaw/gateway.log` (โปรไฟล์ใช้ `gateway-<profile>.log`)
- stderr ของ launchd: ระงับไว้

## ความเข้ากันได้ของเวอร์ชัน

แอป macOS ตรวจสอบเวอร์ชัน Gateway เทียบกับเวอร์ชันของตัวเอง การเริ่มใช้งาน
จะรันการตั้งค่าที่จัดการให้โดยอัตโนมัติเมื่อไม่มี CLI ที่มีอยู่หรือ
ไม่เข้ากัน ใช้ **Retry setup** เพื่อทำการติดตั้งซ้ำ หรือ **Check again**
หลังจากซ่อม CLI ภายนอกแล้ว

## ไดเรกทอรีสถานะบน macOS

เก็บสถานะ OpenClaw ไว้บนดิสก์ภายในเครื่องที่ไม่ซิงก์ หลีกเลี่ยง iCloud Drive และโฟลเดอร์อื่น
ที่ซิงก์กับคลาวด์ เพราะความหน่วงของการซิงก์และการล็อกไฟล์อาจกระทบเซสชัน
ข้อมูลรับรอง และสถานะ Gateway

ตั้งค่า `OPENCLAW_STATE_DIR` เป็นพาธภายในเครื่องเท่านั้นเมื่อคุณต้องการเขียนทับค่า
`openclaw doctor` จะเตือนเกี่ยวกับพาธสถานะทั่วไปที่ซิงก์กับคลาวด์และแนะนำ
ให้ย้ายกลับไปยังพื้นที่จัดเก็บภายในเครื่อง ดู
[ตัวแปรสภาพแวดล้อม](/th/help/environment#path-related-env-vars) และ
[Doctor](/th/gateway/doctor)

## ดีบักการเชื่อมต่อของแอป

ใช้ CLI ดีบักของ macOS จากเช็กเอาต์ซอร์สเพื่อทดสอบ handshake ของ Gateway
WebSocket และตรรกะการค้นพบเดียวกันกับที่แอปใช้:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` รองรับ `--url`, `--token`, `--timeout` และ `--json` ส่วน `discover`
รองรับ `--timeout`, `--json` และ `--include-local` เปรียบเทียบเอาต์พุตการค้นพบ
กับ `openclaw gateway discover --json` เมื่อคุณต้องแยกปัญหาการค้นพบของ CLI
ออกจากปัญหาการเชื่อมต่อฝั่งแอป

## การตรวจสอบ Smoke

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
