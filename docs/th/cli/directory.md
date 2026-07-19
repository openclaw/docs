---
read_when:
    - คุณต้องการค้นหา ID ของผู้ติดต่อ/กลุ่ม/ตนเองสำหรับช่องทางหนึ่ง
    - คุณกำลังพัฒนาอะแดปเตอร์ไดเรกทอรีช่องทาง
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw directory` (ตนเอง เพียร์ กลุ่ม)
title: ไดเรกทอรี
x-i18n:
    generated_at: "2026-07-19T07:05:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 33f1cabd0954f2e6e6affbfbff9f8e1f543bffebc54baff7c1ffaa21778744a0
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

การค้นหาไดเรกทอรีสำหรับช่องทางที่รองรับ ได้แก่ รายชื่อติดต่อ/เพียร์ กลุ่ม และ "ฉัน" (ตนเอง)

ผลลัพธ์มีไว้สำหรับวางลงในคำสั่งอื่น โดยเฉพาะ `openclaw message send --target ...`

## แฟล็กทั่วไป

- `--channel <name>`: id/นามแฝงของช่องทาง (จำเป็นเมื่อกำหนดค่าหลายช่องทาง และจะเลือกให้อัตโนมัติเมื่อกำหนดค่าไว้เพียงช่องทางเดียว)
- `--account <id>`: id บัญชี (ค่าเริ่มต้น: ค่าเริ่มต้นของช่องทาง)
- `--json`: แสดงผลเป็น JSON

ผลลัพธ์เริ่มต้น (ไม่ใช่ JSON) คือ `id` (และบางครั้งเป็น `name`) โดยคั่นด้วยแท็บ

## หมายเหตุ

- สำหรับหลายช่องทาง ผลลัพธ์อ้างอิงจากการกำหนดค่า (รายการที่อนุญาต / กลุ่มที่กำหนดค่าไว้) แทนไดเรกทอรีสดของผู้ให้บริการ
- การแสดงรายการกลุ่ม WhatsApp เป็นแบบสด การค้นหาผ่าน Gateway จะใช้การเชื่อมต่อที่ Gateway เป็นเจ้าของซ้ำ ส่วนคำสั่งแบบสแตนด์อโลนจะเปิดเซสชันที่เชื่อมโยงไว้เฉพาะเมื่อไม่มีกระบวนการอื่นเป็นเจ้าของบัญชีนั้น มิฉะนั้นจะแจ้งว่ากลุ่มแบบสดไม่พร้อมใช้งาน
- Plugin ช่องทางที่ติดตั้งไว้แล้วอาจไม่รองรับไดเรกทอรี ในกรณีดังกล่าว คำสั่งจะแจ้งว่าการดำเนินการนี้ไม่รองรับ และจะไม่พยายามติดตั้งใหม่หรืออัปเกรด Plugin เพื่อเพิ่มการรองรับ

## การใช้ผลลัพธ์กับ `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## รูปแบบ ID ตามช่องทาง

| ช่องทาง                             | รูปแบบ id เป้าหมาย                                                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (DM), `1234567890-1234567890@g.us` (กลุ่ม), `120363123456789@newsletter` (ช่องทาง/จดหมายข่าว, ส่งออกเท่านั้น) |
| Signal                              | นามแฝงที่กำหนดค่าไว้จะแปลงเป็นเป้าหมาย DM แบบ E.164/UUID หรือเป้าหมายกลุ่ม `group:<id>`                                           |
| Telegram                            | `@username` หรือ id แชตแบบตัวเลข กลุ่มใช้ id แบบตัวเลข                                                                      |
| Slack                               | `user:U…` และ `channel:C…`                                                                                                  |
| Discord                             | `user:<id>` และ `channel:<id>`                                                                                              |
| Matrix (Plugin)                     | `user:@user:server`, `room:!roomId:server` หรือ `#alias:server`                                                              |
| Microsoft Teams (Plugin)            | `user:<id>` และ `conversation:<id>`                                                                                         |
| Zalo (Plugin)                       | id ผู้ใช้ (Bot API)                                                                                                           |
| Zalo Personal / `zalouser` (Plugin) | id เธรด (DM/กลุ่ม) จาก `zca` (`me`, `friend list`, `group list`)                                                        |

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
