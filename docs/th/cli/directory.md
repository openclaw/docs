---
read_when:
    - คุณต้องการค้นหารหัสผู้ติดต่อ/กลุ่ม/ตัวเองสำหรับช่องทางหนึ่ง
    - คุณกำลังพัฒนาอะแดปเตอร์สำหรับไดเรกทอรีช่องทาง
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw directory` (ตนเอง, เพียร์, กลุ่ม)
title: ไดเรกทอรี
x-i18n:
    generated_at: "2026-05-06T17:52:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 855f9312790134f2d1da53ffbb106167c190155510a7bdef212b5d38c2fba0b3
    source_path: cli/directory.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw directory`

การค้นหาไดเรกทอรีสำหรับช่องทางที่รองรับ (รายชื่อติดต่อ/เพียร์, กลุ่ม และ "ฉัน")

## แฟล็กทั่วไป

- `--channel <name>`: ID/นามแฝงของช่องทาง (จำเป็นเมื่อกำหนดค่าหลายช่องทางไว้; อัตโนมัติเมื่อกำหนดค่าไว้เพียงช่องทางเดียว)
- `--account <id>`: ID บัญชี (ค่าเริ่มต้น: ค่าเริ่มต้นของช่องทาง)
- `--json`: ส่งออก JSON

## หมายเหตุ

- `directory` มีไว้เพื่อช่วยคุณค้นหา ID ที่สามารถนำไปวางในคำสั่งอื่นได้ (โดยเฉพาะ `openclaw message send --target ...`)
- สำหรับหลายช่องทาง ผลลัพธ์จะอิงจากการกำหนดค่า (allowlists / กลุ่มที่กำหนดค่าไว้) แทนที่จะเป็นไดเรกทอรีผู้ให้บริการแบบสด
- Plugin ช่องทางที่ติดตั้งแล้วยังสามารถไม่รองรับไดเรกทอรีได้; ในกรณีนั้นคำสั่งจะรายงานว่าการดำเนินการไดเรกทอรีไม่รองรับ แทนที่จะติดตั้ง Plugin ใหม่
- เอาต์พุตเริ่มต้นคือ `id` (และบางครั้งคือ `name`) คั่นด้วยแท็บ; ใช้ `--json` สำหรับการเขียนสคริปต์

## การใช้ผลลัพธ์กับ `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## รูปแบบ ID (ตามช่องทาง)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (กลุ่ม), `120363123456789@newsletter` (เป้าหมายขาออกของ Channel/Newsletter)
- Telegram: `@username` หรือ ID แชตแบบตัวเลข; กลุ่มเป็น ID แบบตัวเลข
- Slack: `user:U…` และ `channel:C…`
- Discord: `user:<id>` และ `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server`, หรือ `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` และ `conversation:<id>`
- Zalo (Plugin): ID ผู้ใช้ (Bot API)
- Zalo Personal / `zalouser` (Plugin): ID เธรด (DM/กลุ่ม) จาก `zca` (`me`, `friend list`, `group list`)

## ตนเอง ("ฉัน")

```bash
openclaw directory self --channel zalouser
```

## เพียร์ (รายชื่อติดต่อ/ผู้ใช้)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## กลุ่ม

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
