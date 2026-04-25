---
read_when:
    - คุณมีปัญหาการเชื่อมต่อ/การยืนยันตัวตน และต้องการแนวทางแก้ไขแบบมีคำแนะนำ
    - คุณได้อัปเดตแล้วและต้องการการตรวจสอบความสมเหตุสมผล
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw doctor` (การตรวจสอบสุขภาพ + การซ่อมแซมแบบมีคำแนะนำ)
title: Doctor
x-i18n:
    generated_at: "2026-04-25T13:44:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e185d17d91d1677d0b16152d022b633d012d22d484bd9961820b200d5c4ce5
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

การตรวจสอบสุขภาพ + การแก้ไขอย่างรวดเร็วสำหรับ gateway และช่อง

ที่เกี่ยวข้อง:

- การแก้ปัญหา: [การแก้ปัญหา](/th/gateway/troubleshooting)
- การตรวจสอบความปลอดภัย: [ความปลอดภัย](/th/gateway/security)

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
- `--yes`: ยอมรับค่าเริ่มต้นโดยไม่ต้องถาม
- `--repair`: ใช้การซ่อมแซมที่แนะนำโดยไม่ต้องถาม
- `--fix`: ชื่อแทนของ `--repair`
- `--force`: ใช้การซ่อมแซมเชิงรุก รวมถึงเขียนทับ config ของ service แบบกำหนดเองเมื่อจำเป็น
- `--non-interactive`: ทำงานโดยไม่มีพรอมต์; ใช้เฉพาะ migration ที่ปลอดภัย
- `--generate-gateway-token`: สร้างและกำหนดค่าโทเค็น Gateway
- `--deep`: สแกน system service เพื่อหาการติดตั้ง gateway เพิ่มเติม

หมายเหตุ:

- พรอมต์แบบโต้ตอบ (เช่น การแก้ไข keychain/OAuth) จะทำงานเฉพาะเมื่อ stdin เป็น TTY และ **ไม่ได้** ตั้งค่า `--non-interactive` การรันแบบ headless (Cron, Telegram, ไม่มีเทอร์มินัล) จะข้ามพรอมต์
- ประสิทธิภาพ: การรัน `doctor` แบบ non-interactive จะข้ามการโหลด Plugin ล่วงหน้าเพื่อให้การตรวจสอบสุขภาพแบบ headless ยังทำงานได้รวดเร็ว เซสชันแบบโต้ตอบจะยังโหลด Plugin เต็มรูปแบบเมื่อการตรวจสอบต้องใช้ส่วนที่ Plugin นั้นมีส่วนร่วม
- `--fix` (ชื่อแทนของ `--repair`) จะเขียนไฟล์สำรองไปที่ `~/.openclaw/openclaw.json.bak` และลบคีย์ config ที่ไม่รู้จัก พร้อมแสดงรายการทุกคีย์ที่ถูกลบ
- การตรวจสอบความสมบูรณ์ของสถานะตอนนี้สามารถตรวจพบไฟล์ transcript ที่ไม่มีการอ้างอิงในไดเรกทอรี sessions และสามารถเก็บถาวรเป็น `.deleted.<timestamp>` เพื่อคืนพื้นที่อย่างปลอดภัย
- Doctor ยังสแกน `~/.openclaw/cron/jobs.json` (หรือ `cron.store`) เพื่อหารูปแบบ cron job แบบเดิม และสามารถเขียนใหม่ในตำแหน่งเดิมก่อนที่ scheduler จะต้องทำการ normalize อัตโนมัติระหว่างรันไทม์
- Doctor ซ่อมแซม dependency ของ runtime สำหรับ Plugin ที่ bundle มาแต่ขาดหายไป โดยไม่เขียนลงในการติดตั้ง global แบบแพ็กเกจ สำหรับการติดตั้ง npm ที่เป็นของ root หรือ systemd unit ที่ถูกทำให้แข็งแกร่งแล้ว ให้ตั้งค่า `OPENCLAW_PLUGIN_STAGE_DIR` ไปยังไดเรกทอรีที่เขียนได้ เช่น `/var/lib/openclaw/plugin-runtime-deps`
- Doctor จะย้าย config Talk แบบแบนเดิม (`talk.voiceId`, `talk.modelId` และรายการที่เกี่ยวข้อง) ไปเป็น `talk.provider` + `talk.providers.<provider>` โดยอัตโนมัติ
- การรัน `doctor --fix` ซ้ำจะไม่รายงาน/ใช้การ normalize ของ Talk อีกต่อไปเมื่อความแตกต่างมีเพียงลำดับของ object key
- Doctor มีการตรวจสอบความพร้อมของ memory-search และสามารถแนะนำ `openclaw configure --section model` ได้เมื่อไม่มีข้อมูลรับรองสำหรับ embedding
- หากเปิดใช้โหมด sandbox แต่ไม่มี Docker ให้ใช้งาน doctor จะรายงานคำเตือนที่มีสัญญาณสูงพร้อมแนวทางแก้ไข (`install Docker` หรือ `openclaw config set agents.defaults.sandbox.mode off`)
- หาก `gateway.auth.token`/`gateway.auth.password` ถูกจัดการด้วย SecretRef และไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานคำเตือนแบบอ่านอย่างเดียวและจะไม่เขียนข้อมูลรับรอง plaintext แบบ fallback
- หากการตรวจสอบ SecretRef ของช่องล้มเหลวระหว่างเส้นทางการแก้ไข doctor จะดำเนินการต่อและรายงานคำเตือนแทนการออกจากการทำงานก่อนเวลา
- การ resolve ชื่อผู้ใช้ Telegram อัตโนมัติสำหรับ `allowFrom` (`doctor --fix`) ต้องใช้โทเค็น Telegram ที่สามารถ resolve ได้ในเส้นทางคำสั่งปัจจุบัน หากไม่สามารถตรวจสอบโทเค็นได้ doctor จะรายงานคำเตือนและข้ามการ resolve อัตโนมัติในการรอบนั้น

## macOS: การแทนที่ env ของ `launchctl`

หากคุณเคยรัน `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (หรือ `...PASSWORD`) มาก่อน ค่านั้นจะมีลำดับความสำคัญเหนือไฟล์ config ของคุณ และอาจทำให้เกิดข้อผิดพลาด “unauthorized” อย่างต่อเนื่อง

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Gateway doctor](/th/gateway/doctor)
