---
read_when:
    - คุณมีปัญหาการเชื่อมต่อ/การยืนยันตัวตน และต้องการวิธีแก้ไขแบบมีคำแนะนำ
    - คุณอัปเดตแล้วและต้องการการตรวจสอบความถูกต้องเบื้องต้น
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw doctor` (การตรวจสอบสถานะ + การซ่อมแซมแบบมีคำแนะนำ)
title: doctor
x-i18n:
    generated_at: "2026-04-23T10:15:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4b858e8726094c950edcde1e3bdff05d03ae2bd216c3519bbee4805955cf851
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

การตรวจสอบสถานะ + การแก้ไขอย่างรวดเร็วสำหรับ Gateway และ channels

ที่เกี่ยวข้อง:

- การแก้ปัญหา: [Troubleshooting](/th/gateway/troubleshooting)
- การตรวจสอบความปลอดภัย: [Security](/th/gateway/security)

## ตัวอย่าง

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## ตัวเลือก

- `--no-workspace-suggestions`: ปิดคำแนะนำเกี่ยวกับหน่วยความจำ/การค้นหาของ workspace
- `--yes`: ยอมรับค่าเริ่มต้นโดยไม่ถาม
- `--repair`: ใช้การซ่อมแซมที่แนะนำโดยไม่ถาม
- `--fix`: ชื่ออื่นของ `--repair`
- `--force`: ใช้การซ่อมแซมเชิงรุก รวมถึงเขียนทับ config ของ service แบบกำหนดเองเมื่อจำเป็น
- `--non-interactive`: รันโดยไม่มีการถาม; ใช้เฉพาะ migration ที่ปลอดภัย
- `--generate-gateway-token`: สร้างและตั้งค่า gateway token
- `--deep`: สแกน system services เพื่อหาการติดตั้ง Gateway เพิ่มเติม

หมายเหตุ:

- การถามแบบโต้ตอบ (เช่น การแก้ไข keychain/OAuth) จะทำงานเฉพาะเมื่อ stdin เป็น TTY และ **ไม่ได้** ตั้ง `--non-interactive` เท่านั้น การรันแบบ headless (Cron, Telegram, ไม่มีเทอร์มินัล) จะข้ามการถาม
- ประสิทธิภาพ: การรัน `doctor` แบบ non-interactive จะข้ามการโหลด plugin แบบ eager เพื่อให้การตรวจสอบสถานะแบบ headless ยังรวดเร็ว ส่วนเซสชันแบบโต้ตอบจะยังโหลด plugins เต็มรูปแบบเมื่อการตรวจสอบนั้นต้องใช้ส่วนช่วยจาก plugin
- `--fix` (ชื่ออื่นของ `--repair`) จะเขียนไฟล์สำรองไว้ที่ `~/.openclaw/openclaw.json.bak` และลบ config keys ที่ไม่รู้จัก โดยแสดงรายการแต่ละรายการที่ถูกลบ
- การตรวจสอบความสมบูรณ์ของสถานะตอนนี้สามารถตรวจพบไฟล์ transcript ที่ไม่มีเจ้าของในไดเรกทอรี sessions และสามารถเก็บถาวรเป็น `.deleted.<timestamp>` เพื่อคืนพื้นที่อย่างปลอดภัย
- Doctor จะสแกน `~/.openclaw/cron/jobs.json` (หรือ `cron.store`) เพื่อหารูปแบบ cron job แบบเดิม และสามารถเขียนใหม่ในตำแหน่งเดิมก่อนที่ scheduler จะต้อง normalize อัตโนมัติระหว่าง runtime
- Doctor ซ่อมแซม dependencies ของ runtime สำหรับ bundled plugin ที่หายไปได้ โดยไม่ต้องมีสิทธิ์เขียนไปยังแพ็กเกจ OpenClaw ที่ติดตั้งไว้ สำหรับการติดตั้ง npm ที่เป็นของ root หรือ systemd units ที่ถูกทำให้เข้มงวด ให้ตั้ง `OPENCLAW_PLUGIN_STAGE_DIR` ไปยังไดเรกทอรีที่เขียนได้ เช่น `/var/lib/openclaw/plugin-runtime-deps`
- Doctor จะทำ migration ให้โดยอัตโนมัติจาก config Talk แบบแบนรุ่นเก่า (`talk.voiceId`, `talk.modelId` และรายการที่เกี่ยวข้อง) ไปเป็น `talk.provider` + `talk.providers.<provider>`
- การรัน `doctor --fix` ซ้ำจะไม่รายงาน/ใช้การ normalize ของ Talk อีก หากความแตกต่างมีเพียงลำดับคีย์ของออบเจ็กต์
- Doctor มีการตรวจสอบความพร้อมของ memory-search และสามารถแนะนำ `openclaw configure --section model` เมื่อไม่มีข้อมูลรับรองสำหรับ embeddings
- หากเปิดใช้งานโหมด sandbox แต่ Docker ใช้งานไม่ได้ doctor จะรายงานคำเตือนที่ชัดเจนพร้อมแนวทางแก้ไข (`install Docker` หรือ `openclaw config set agents.defaults.sandbox.mode off`)
- หาก `gateway.auth.token`/`gateway.auth.password` ถูกจัดการด้วย SecretRef และไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานคำเตือนแบบอ่านอย่างเดียว และจะไม่เขียนข้อมูลรับรอง plaintext แบบ fallback
- หากการตรวจสอบ SecretRef ของ channel ล้มเหลวในเส้นทางการแก้ไข doctor จะทำงานต่อและรายงานคำเตือนแทนการออกก่อนกำหนด
- การ resolve ชื่อผู้ใช้ใน `allowFrom` ของ Telegram โดยอัตโนมัติ (`doctor --fix`) ต้องใช้ Telegram token ที่ resolve ได้ในเส้นทางคำสั่งปัจจุบัน หากไม่สามารถตรวจสอบ token ได้ doctor จะรายงานคำเตือนและข้ามการ resolve อัตโนมัติในการรันรอบนั้น

## macOS: การ override env ของ `launchctl`

หากก่อนหน้านี้คุณเคยรัน `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (หรือ `...PASSWORD`) ค่านั้นจะ override ไฟล์ config ของคุณ และอาจทำให้เกิดข้อผิดพลาด “unauthorized” อย่างต่อเนื่อง

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
