---
read_when:
    - คุณต้องการค้นหารหัสของผู้ติดต่อ/กลุ่ม/ตนเองสำหรับช่องทางหนึ่ง
    - คุณกำลังพัฒนาอะแดปเตอร์ไดเรกทอรีช่องทาง
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw directory` (ตนเอง, เพียร์, กลุ่ม)
title: ไดเรกทอรี
x-i18n:
    generated_at: "2026-05-02T20:41:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 011f762d6f53605a37bd12b31c767594c0efa5681da4b2aabe7fb358751b1542
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

การค้นหาไดเรกทอรีสำหรับช่องทางที่รองรับ (รายชื่อ/เพียร์, กลุ่ม และ “ฉัน”)

## แฟล็กทั่วไป

- `--channel <name>`: id/alias ของช่องทาง (จำเป็นเมื่อกำหนดค่าหลายช่องทาง; อัตโนมัติเมื่อกำหนดค่าไว้เพียงช่องทางเดียว)
- `--account <id>`: id ของบัญชี (ค่าเริ่มต้น: ค่าเริ่มต้นของช่องทาง)
- `--json`: ส่งออก JSON

## หมายเหตุ

- `directory` มีไว้ช่วยคุณค้นหา ID ที่สามารถวางลงในคำสั่งอื่นได้ (โดยเฉพาะ `openclaw message send --target ...`)
- สำหรับหลายช่องทาง ผลลัพธ์อิงตามการกำหนดค่า (allowlist / กลุ่มที่กำหนดค่าไว้) มากกว่าไดเรกทอรีของผู้ให้บริการแบบสด
- Plugin ช่องทางที่ติดตั้งแล้วยังอาจไม่รองรับไดเรกทอรีได้; ในกรณีนั้นคำสั่งจะรายงานการดำเนินการไดเรกทอรีที่ไม่รองรับแทนการติดตั้ง Plugin ใหม่
- เอาต์พุตเริ่มต้นคือ `id` (และบางครั้งคือ `name`) คั่นด้วยแท็บ; ใช้ `--json` สำหรับการเขียนสคริปต์

## การใช้ผลลัพธ์กับ `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## รูปแบบ ID (ตามช่องทาง)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (กลุ่ม), `120363123456789@newsletter` (เป้าหมายขาออกของช่องทาง/จดหมายข่าว)
- Telegram: `@username` หรือ id แชตแบบตัวเลข; กลุ่มเป็น id แบบตัวเลข
- Slack: `user:U…` และ `channel:C…`
- Discord: `user:<id>` และ `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` หรือ `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` และ `conversation:<id>`
- Zalo (Plugin): id ผู้ใช้ (Bot API)
- Zalo Personal / `zalouser` (Plugin): id เธรด (DM/กลุ่ม) จาก `zca` (`me`, `friend list`, `group list`)

## ตัวเอง ("me")

```bash
openclaw directory self --channel zalouser
```

## เพียร์ (รายชื่อ/ผู้ใช้)

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

- [เอกสารอ้างอิง CLI](/th/cli)
