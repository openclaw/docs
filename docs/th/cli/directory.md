---
read_when:
    - คุณต้องการค้นหารายชื่อผู้ติดต่อ/กลุ่ม/รหัสตนเองสำหรับช่องทาง
    - คุณกำลังพัฒนาอะแดปเตอร์ไดเรกทอรีช่องทาง
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw directory` (ตนเอง, เพียร์, กลุ่ม)
title: ไดเรกทอรี
x-i18n:
    generated_at: "2026-07-03T17:47:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d17f545ce0bbe23a6c1ba74e4d1b44b103cc985b52affe4b25fbc6a6d1121045
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

การค้นหาไดเรกทอรีสำหรับช่องทางที่รองรับ (ผู้ติดต่อ/เพียร์, กลุ่ม และ "me")

## แฟล็กทั่วไป

- `--channel <name>`: id/นามแฝงของช่องทาง (จำเป็นเมื่อกำหนดค่าหลายช่องทาง; อัตโนมัติเมื่อกำหนดค่าไว้เพียงช่องทางเดียว)
- `--account <id>`: id บัญชี (ค่าเริ่มต้น: ค่าเริ่มต้นของช่องทาง)
- `--json`: ส่งออก JSON

## หมายเหตุ

- `directory` มีไว้เพื่อช่วยคุณค้นหา ID ที่สามารถวางในคำสั่งอื่นได้ (โดยเฉพาะ `openclaw message send --target ...`)
- สำหรับหลายช่องทาง ผลลัพธ์อิงตามการกำหนดค่า (allowlists / กลุ่มที่กำหนดค่าไว้) ไม่ใช่ไดเรกทอรีของผู้ให้บริการแบบสด
- Plugin ช่องทางที่ติดตั้งไว้ยังสามารถไม่รองรับไดเรกทอรีได้; ในกรณีนั้นคำสั่งจะรายงานการดำเนินการไดเรกทอรีที่ไม่รองรับแทนการติดตั้ง Plugin ใหม่
- เอาต์พุตเริ่มต้นคือ `id` (และบางครั้ง `name`) คั่นด้วยแท็บ; ใช้ `--json` สำหรับการสคริปต์

## การใช้ผลลัพธ์กับ `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## รูปแบบ ID (ตามช่องทาง)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (กลุ่ม), `120363123456789@newsletter` (เป้าหมายขาออกของช่องทาง/จดหมายข่าว)
- Signal: นามแฝงที่กำหนดค่าไว้จะแปลงเป็นเป้าหมาย DM แบบ E.164/UUID หรือเป้าหมายกลุ่ม `group:<id>`
- Telegram: `@username` หรือ id แชตแบบตัวเลข; กลุ่มเป็น id แบบตัวเลข
- Slack: `user:U…` และ `channel:C…`
- Discord: `user:<id>` และ `channel:<id>`
- Matrix (plugin): `user:@user:server`, `room:!roomId:server` หรือ `#alias:server`
- Microsoft Teams (plugin): `user:<id>` และ `conversation:<id>`
- Zalo (plugin): id ผู้ใช้ (Bot API)
- Zalo Personal / `zalouser` (plugin): id เธรด (DM/กลุ่ม) จาก `zca` (`me`, `friend list`, `group list`)

## ตัวเอง ("me")

```bash
openclaw directory self --channel zalouser
```

## เพียร์ (ผู้ติดต่อ/ผู้ใช้)

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
