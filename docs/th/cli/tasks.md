---
read_when:
    - คุณต้องการตรวจดู ตรวจสอบย้อนหลัง หรือยกเลิกรายการงานเบื้องหลัง
    - คุณกำลังจัดทำเอกสารคำสั่ง TaskFlow ภายใต้ `openclaw tasks flow`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw tasks` (บัญชีบันทึกงานเบื้องหลังและสถานะ Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-10T19:31:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7bbb97690124a8e59ec5e6a517f33166ad449ee6268894ab132ad9cb69dcaa81
    source_path: cli/tasks.md
    workflow: 16
    postprocess_version: locale-links-v1
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

- `--json`: ส่งออก JSON
- `--runtime <name>`: กรองตามชนิด: `subagent`, `acp`, `cron`, หรือ `cli`
- `--status <name>`: กรองตามสถานะ: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled`, หรือ `lost`

## คำสั่งย่อย

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

แสดงรายการงานเบื้องหลังที่ติดตามไว้ โดยรายการใหม่ที่สุดอยู่ก่อน

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

แสดงงานหนึ่งรายการตาม ID งาน, ID การรัน หรือคีย์เซสชัน

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

แสดงระเบียนงานและ Task Flow ที่ค้าง สูญหาย ส่งมอบล้มเหลว หรือไม่สอดคล้องในลักษณะอื่น งานที่สูญหายซึ่งถูกเก็บไว้จนถึง `cleanupAfter` เป็นคำเตือน ส่วนงานที่สูญหายซึ่งหมดอายุหรือไม่มีตราประทับเป็นข้อผิดพลาด

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

แสดงตัวอย่างหรือใช้การกระทบยอดงานและ Task Flow, การประทับตราการล้างข้อมูล, การตัดทิ้ง,
และการล้างรีจิสทรีเซสชันการรัน Cron ที่ค้าง
สำหรับงาน Cron การกระทบยอดจะใช้บันทึกการรัน/สถานะงานที่คงอยู่ก่อนทำเครื่องหมายงานที่ยังใช้งานอยู่เก่าว่า `lost` ดังนั้นการรัน Cron ที่เสร็จสิ้นแล้วจะไม่กลายเป็นข้อผิดพลาด audit เท็จ
เพียงเพราะสถานะรันไทม์ Gateway ในหน่วยความจำหายไป การ audit CLI แบบออฟไลน์
ไม่ใช่แหล่งอ้างอิงเด็ดขาดสำหรับชุดงาน Cron ที่ทำงานอยู่เฉพาะกระบวนการของ Gateway งาน CLI
ที่มี ID การรัน/ID แหล่งที่มาจะถูกทำเครื่องหมายว่า `lost` เมื่อบริบทการรัน Gateway ที่ยังใช้งานอยู่
หายไป แม้ว่าจะยังมีแถวเซสชันลูกเก่าอยู่ก็ตาม
เมื่อใช้จริง maintenance จะตัดแถวรีจิสทรีเซสชัน `cron:<jobId>:run:<uuid>`
ที่เก่ากว่า 7 วันออกด้วย โดยยังคงรักษางาน Cron ที่กำลังทำงานอยู่และปล่อย
แถวเซสชันที่ไม่ใช่ Cron ไว้โดยไม่แตะต้อง

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

ตรวจสอบหรือยกเลิกสถานะ Task Flow แบบคงทนภายใต้บัญชีแยกประเภทงาน

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [งานเบื้องหลัง](/th/automation/tasks)
