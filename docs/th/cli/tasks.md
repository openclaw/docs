---
read_when:
    - คุณต้องการตรวจดู ตรวจสอบ หรือยกเลิกระเบียนงานเบื้องหลัง
    - คุณกำลังจัดทำเอกสารคำสั่ง TaskFlow ภายใต้ `openclaw tasks flow`
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw tasks` (บัญชีแยกประเภทของงานเบื้องหลังและสถานะโฟลว์งาน)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-07T13:15:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca3f05d7c2a3fa7790ad6059ce15721ebffb548ac4a2c627188ac17986442dc6
    source_path: cli/tasks.md
    workflow: 16
---

ตรวจสอบงานเบื้องหลังแบบคงทนและสถานะ Task Flow เมื่อไม่มีคำสั่งย่อย
`openclaw tasks` จะเทียบเท่ากับ `openclaw tasks list`

ดู [งานเบื้องหลัง](/th/automation/tasks) สำหรับวงจรชีวิตและโมเดลการส่งมอบ

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

- `--json`: แสดงผล JSON
- `--runtime <name>`: กรองตามชนิด: `subagent`, `acp`, `cron` หรือ `cli`
- `--status <name>`: กรองตามสถานะ: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` หรือ `lost`

## คำสั่งย่อย

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

แสดงรายการงานเบื้องหลังที่ติดตามไว้ โดยรายการล่าสุดอยู่ก่อน

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

แสดงงานหนึ่งรายการตามรหัสงาน รหัสการรัน หรือคีย์เซสชัน

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

เปลี่ยนนโยบายการแจ้งเตือนสำหรับงานที่กำลังทำงานอยู่

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

ยกเลิกงานเบื้องหลังที่กำลังทำงานอยู่

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

แสดงเรคคอร์ดงานและ Task Flow ที่เก่าเกินไป สูญหาย ส่งมอบล้มเหลว หรือไม่สอดคล้องด้วยเหตุอื่น งานที่สูญหายซึ่งเก็บไว้จนถึง `cleanupAfter` เป็นคำเตือน ส่วนงานที่สูญหายซึ่งหมดอายุหรือไม่มีตราประทับเป็นข้อผิดพลาด

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

แสดงตัวอย่างหรือนำการกระทบยอดงานและ Task Flow การประทับตราการล้างข้อมูล และการตัดทิ้งไปใช้
สำหรับงาน cron การกระทบยอดจะใช้บันทึกการรัน/สถานะงานที่คงอยู่ก่อนทำเครื่องหมายงานที่ใช้งานเก่าเป็น `lost` ดังนั้นการรัน cron ที่เสร็จแล้วจะไม่กลายเป็นข้อผิดพลาดการตรวจสอบเท็จเพียงเพราะสถานะรันไทม์ Gateway ในหน่วยความจำหายไป การตรวจสอบ CLI แบบออฟไลน์ไม่ใช่แหล่งอ้างอิงที่เชื่อถือได้สำหรับชุดงาน cron ที่ใช้งานอยู่เฉพาะกระบวนการของ Gateway งาน CLI ที่มีรหัสการรัน/รหัสแหล่งที่มาจะถูกทำเครื่องหมายเป็น `lost` เมื่อบริบทการรัน Gateway แบบสดหายไป แม้ว่าจะยังมีแถวเซสชันย่อยเก่าเหลืออยู่ก็ตาม

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

ตรวจสอบหรือยกเลิกสถานะ Task Flow แบบคงทนใต้บัญชีแยกประเภทของงาน

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [งานเบื้องหลัง](/th/automation/tasks)
