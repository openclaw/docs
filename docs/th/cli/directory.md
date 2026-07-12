---
read_when:
    - คุณต้องการค้นหา ID ของรายชื่อติดต่อ/กลุ่ม/ตนเองสำหรับช่องทางหนึ่ง
    - คุณกำลังพัฒนาอะแดปเตอร์ไดเรกทอรีช่องทาง
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw directory` (ตนเอง เพียร์ กลุ่ม)
title: ไดเรกทอรี
x-i18n:
    generated_at: "2026-07-12T16:00:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

ค้นหาไดเรกทอรีสำหรับช่องทางที่รองรับ ได้แก่ รายชื่อติดต่อ/เพียร์ กลุ่ม และ "ฉัน" (ตนเอง)

ผลลัพธ์ออกแบบมาให้นำไปวางในคำสั่งอื่น โดยเฉพาะ `openclaw message send --target ...`

## แฟล็กทั่วไป

- `--channel <name>`: รหัส/นามแฝงของช่องทาง (จำเป็นเมื่อกำหนดค่าหลายช่องทาง และจะเลือกโดยอัตโนมัติเมื่อกำหนดค่าเพียงช่องทางเดียว)
- `--account <id>`: รหัสบัญชี (ค่าเริ่มต้น: บัญชีเริ่มต้นของช่องทาง)
- `--json`: แสดงผลเป็น JSON

ตามค่าเริ่มต้น ผลลัพธ์ที่ไม่ใช่ JSON คือ `id` (และบางครั้งมี `name`) โดยคั่นด้วยแท็บ

## หมายเหตุ

- สำหรับช่องทางจำนวนมาก ผลลัพธ์อ้างอิงจากการกำหนดค่า (รายการอนุญาต/กลุ่มที่กำหนดค่าไว้) แทนที่จะมาจากไดเรกทอรีสดของผู้ให้บริการ
- Plugin ช่องทางที่ติดตั้งไว้แล้วอาจไม่รองรับไดเรกทอรี ในกรณีดังกล่าว คำสั่งจะรายงานว่าไม่รองรับการดำเนินการนี้ และจะไม่พยายามติดตั้งใหม่หรืออัปเกรด Plugin เพื่อเพิ่มการรองรับ

## การใช้ผลลัพธ์กับ `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## รูปแบบรหัสตามช่องทาง

| ช่องทาง                             | รูปแบบรหัสเป้าหมาย                                                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (ข้อความส่วนตัว), `1234567890-1234567890@g.us` (กลุ่ม), `120363123456789@newsletter` (ช่อง/จดหมายข่าว ส่งออกเท่านั้น) |
| Signal                              | นามแฝงที่กำหนดค่าไว้จะแปลงเป็นเป้าหมายข้อความส่วนตัวแบบ E.164/UUID หรือเป้าหมายกลุ่ม `group:<id>`                                           |
| Telegram                            | `@username` หรือรหัสแชตแบบตัวเลข กลุ่มใช้รหัสแบบตัวเลข                                                                      |
| Slack                               | `user:U…` และ `channel:C…`                                                                                                  |
| Discord                             | `user:<id>` และ `channel:<id>`                                                                                              |
| Matrix (Plugin)                     | `user:@user:server`, `room:!roomId:server` หรือ `#alias:server`                                                              |
| Microsoft Teams (Plugin)            | `user:<id>` และ `conversation:<id>`                                                                                         |
| Zalo (Plugin)                       | รหัสผู้ใช้ (Bot API)                                                                                                           |
| Zalo Personal / `zalouser` (Plugin) | รหัสเธรด (ข้อความส่วนตัว/กลุ่ม) จาก `zca` (`me`, `friend list`, `group list`)                                                        |

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

- [เอกสารอ้างอิง CLI](/th/cli)
