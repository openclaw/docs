---
read_when:
    - คุณพบ `openclaw flows` ในเอกสารเก่าหรือบันทึกประจำรุ่น
    - คุณต้องการเอกสารอ้างอิงสำหรับตรวจสอบ TaskFlow อย่างรวดเร็ว
summary: 'การเปลี่ยนเส้นทาง: คำสั่งโฟลว์อยู่ภายใต้ `openclaw tasks flow`'
title: โฟลว์ (การเปลี่ยนเส้นทาง)
x-i18n:
    generated_at: "2026-07-12T15:53:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
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

| คำสั่งย่อย | คำอธิบาย                         | อาร์กิวเมนต์ / ตัวเลือก                                                                                  |
| ---------- | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `list`     | แสดงรายการ TaskFlow ที่ติดตามอยู่ | `--json` แสดงผลในรูปแบบที่เครื่องอ่านได้; ตัวกรอง `--status <name>` (ดูค่าสถานะด้านล่าง)                 |
| `show`     | แสดง TaskFlow หนึ่งรายการ         | `<lookup>` คือรหัสโฟลว์หรือคีย์เจ้าของ; `--json` แสดงผลในรูปแบบที่เครื่องอ่านได้                         |
| `cancel`   | ยกเลิก TaskFlow ที่กำลังทำงาน     | `<lookup>` คือรหัสโฟลว์หรือคีย์เจ้าของ                                                                  |

`<lookup>` รับได้ทั้งรหัสโฟลว์ (ที่ส่งคืนโดย `list` / `show`) หรือคีย์เจ้าของของโฟลว์ (ตัวระบุแบบคงที่ที่ระบบย่อยซึ่งเป็นเจ้าของใช้ติดตามโฟลว์)

### ค่าตัวกรองสถานะ

`--status` ใน `list` รับค่าใดค่าหนึ่งต่อไปนี้: `queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## ตัวอย่าง

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

สำหรับแนวคิดและการเขียน TaskFlow โปรดดู [TaskFlow](/th/automation/taskflow) สำหรับคำสั่งแม่ `tasks` โปรดดู [เอกสารอ้างอิง CLI ของ tasks](/th/cli/tasks)

## เนื้อหาที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [ระบบอัตโนมัติ](/th/automation)
- [TaskFlow](/th/automation/taskflow)
