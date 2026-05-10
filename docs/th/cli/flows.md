---
read_when:
    - คุณพบ `openclaw flows` ในเอกสารหรือบันทึกประจำรุ่นเก่า
    - คุณต้องการข้อมูลอ้างอิงฉบับย่อสำหรับการตรวจสอบ TaskFlow
summary: 'เปลี่ยนเส้นทาง: คำสั่ง flow อยู่ภายใต้ `openclaw tasks flow`'
title: โฟลว์ (เปลี่ยนเส้นทาง)
x-i18n:
    generated_at: "2026-05-10T19:29:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: b41e8a911cfbba32f3a1af059df34f73443ea7649bce46a5926cdf26c8399c12
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

ไม่มีคำสั่งระดับบนสุด `openclaw flows` การตรวจสอบ TaskFlow แบบคงทนอยู่ภายใต้ `openclaw tasks flow`

## คำสั่งย่อย

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| คำสั่งย่อย | คำอธิบาย                    | อาร์กิวเมนต์ / ตัวเลือก                                                                 |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | แสดงรายการ TaskFlow ที่ติดตามอยู่ | เอาต์พุตที่เครื่องอ่านได้ `--json`; ตัวกรอง `--status <name>` (ดูค่าสถานะด้านล่าง) |
| `show`     | แสดง TaskFlow หนึ่งรายการ         | id ของ flow หรือคีย์เจ้าของ `<lookup>`; เอาต์พุตที่เครื่องอ่านได้ `--json`          |
| `cancel`   | ยกเลิก TaskFlow ที่กำลังทำงานอยู่ | id ของ flow หรือคีย์เจ้าของ `<lookup>`                                                |

`<lookup>` ยอมรับได้ทั้ง id ของ flow (ที่ส่งกลับโดย `list` / `show`) หรือคีย์เจ้าของของ flow (ตัวระบุที่เสถียรซึ่งระบบย่อยที่เป็นเจ้าของใช้เพื่อติดตาม flow)

### ค่าตัวกรองสถานะ

`--status` บน `list` ยอมรับค่าใดค่าหนึ่งต่อไปนี้:

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## ตัวอย่าง

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

สำหรับแนวคิดและการเขียน TaskFlow แบบเต็ม โปรดดู [TaskFlow](/th/automation/taskflow) สำหรับคำสั่งแม่ `tasks` โปรดดู [เอกสารอ้างอิง CLI ของ tasks](/th/cli/tasks)

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [ระบบอัตโนมัติ](/th/automation)
- [TaskFlow](/th/automation/taskflow)
