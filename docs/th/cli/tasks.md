---
read_when:
    - คุณต้องการตรวจสอบ ทำ audit หรือยกเลิกเรคคอร์ดงานเบื้องหลัง
    - คุณกำลังจัดทำเอกสารคำสั่ง TaskFlow ภายใต้ `openclaw tasks flow`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw tasks` (บัญชีงานเบื้องหลังและสถานะ Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-26T11:27:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e61fb0b67a2bdd932b29543199fb219890f256260a66881c8e7ffeb9fadee33
    source_path: cli/tasks.md
    workflow: 15
---

ตรวจสอบงานเบื้องหลังแบบถาวรและสถานะ TaskFlow หากไม่มี subcommand,
`openclaw tasks` จะเทียบเท่ากับ `openclaw tasks list`

ดู [งานเบื้องหลัง](/th/automation/tasks) สำหรับวงจรชีวิตและโมเดลการส่ง

## การใช้งาน

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## ตัวเลือกระดับราก

- `--json`: ส่งออกเป็น JSON
- `--runtime <name>`: กรองตามชนิด: `subagent`, `acp`, `cron` หรือ `cli`
- `--status <name>`: กรองตามสถานะ: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` หรือ `lost`

## Subcommand

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

แสดงรายการงานเบื้องหลังที่ติดตามไว้ โดยเรียงจากใหม่ไปเก่า

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

แสดงงานหนึ่งรายการตาม task ID, run ID หรือ session key

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

เปลี่ยนนโยบายการแจ้งเตือนสำหรับงานที่กำลังรันอยู่

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

ยกเลิกงานเบื้องหลังที่กำลังรันอยู่

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

แสดงเรคคอร์ดของงานและ TaskFlow ที่เก่า สูญหาย ส่งไม่สำเร็จ หรือไม่สอดคล้องกันในลักษณะอื่น งานที่สูญหายซึ่งยังถูกเก็บไว้จนถึง `cleanupAfter` จะเป็นคำเตือน; งานที่สูญหายและหมดอายุแล้วหรือไม่มีตราประทับจะเป็นข้อผิดพลาด

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

แสดงตัวอย่างหรือดำเนินการกระทบยอด การประทับตราการล้างข้อมูล และการลบข้อมูลเก่าของงานและ TaskFlow
สำหรับงาน cron การกระทบยอดจะใช้บันทึกการรัน/สถานะงานที่จัดเก็บไว้ก่อนทำเครื่องหมาย
งานเก่าที่ active ว่า `lost` ดังนั้นการรัน cron ที่เสร็จแล้วจะไม่กลายเป็นข้อผิดพลาด audit ปลอม
เพียงเพราะสถานะ runtime ในหน่วยความจำของ Gateway หายไปแล้ว
การทำ audit แบบออฟไลน์ผ่าน CLI ไม่ถือเป็นแหล่งอ้างอิงสิทธิ์ขาดสำหรับชุด active-job ของ cron ที่อยู่ในโพรเซสเฉพาะของ Gateway

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

ตรวจสอบหรือยกเลิกสถานะ TaskFlow แบบถาวรภายใต้บัญชีงาน

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [งานเบื้องหลัง](/th/automation/tasks)
