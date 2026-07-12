---
read_when:
    - คุณต้องการตรวจสอบ ตรวจประเมิน หรือยกเลิกบันทึกงานเบื้องหลัง
    - คุณกำลังจัดทำเอกสารคำสั่ง TaskFlow ภายใต้ `openclaw tasks flow`
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw tasks` (บัญชีรายการงานเบื้องหลังและสถานะ Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-12T16:04:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

ตรวจสอบงานเบื้องหลังแบบคงทนและสถานะ Task Flow หากไม่มีคำสั่งย่อย
`openclaw tasks` จะเทียบเท่ากับ `openclaw tasks list`

ดูวงจรชีวิตและรูปแบบการส่งมอบได้ที่ [งานเบื้องหลัง](/th/automation/tasks)
และดูคำอธิบายผลการตรวจสอบทั้งหมดได้ในส่วน `tasks audit`

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

| แฟล็ก              | คำอธิบาย                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `--json`           | แสดงผลเป็น JSON                                                                                    |
| `--runtime <name>` | กรองตามชนิด: `subagent`, `acp`, `cron` หรือ `cli`                                                  |
| `--status <name>`  | กรองตามสถานะ: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` หรือ `lost`     |

## คำสั่งย่อย

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

แสดงรายการงานเบื้องหลังที่ติดตามไว้ โดยเรียงงานใหม่ที่สุดก่อน

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

แสดงงานหนึ่งรายการตามรหัสงาน รหัสการทำงาน หรือคีย์เซสชัน

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

เปลี่ยนนโยบายการแจ้งเตือนสำหรับงานที่กำลังทำงาน

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

ยกเลิกงานเบื้องหลังที่กำลังทำงาน

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

แสดงระเบียนงานและ Task Flow ที่ค้าง สูญหาย ส่งมอบล้มเหลว หรือไม่สอดคล้องกันในลักษณะอื่น
งานที่สูญหายและถูกเก็บไว้จนถึง `cleanupAfter` จะเป็นคำเตือน
ส่วนงานที่สูญหายซึ่งหมดอายุหรือไม่มีการประทับเวลาจะเป็นข้อผิดพลาด

`--code` รองรับรหัสงาน (`stale_queued`, `stale_running`, `lost`,
`delivery_failed`, `missing_cleanup`, `inconsistent_timestamps`) และรหัส Task
Flow (`restore_failed`, `stale_waiting`, `stale_blocked`,
`cancel_stuck`, `missing_linked_tasks`, `blocked_task_missing`) ดูรายละเอียดระดับความรุนแรง
และเงื่อนไขการทริกเกอร์ของแต่ละรหัสได้ที่ [งานเบื้องหลัง](/th/automation/tasks)

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

แสดงตัวอย่างหรือดำเนินการปรับระเบียนงานและ Task Flow ให้สอดคล้องกัน การประทับข้อมูลการล้าง
การตัดระเบียน และการล้างรีจิสทรีเซสชันการทำงาน cron ที่ค้าง

สำหรับงาน cron การปรับให้สอดคล้องจะใช้บันทึกการทำงานและสถานะงานที่จัดเก็บไว้ก่อน
ทำเครื่องหมายงานเก่าที่ยังคงมีสถานะใช้งานเป็น `lost` เพื่อไม่ให้การทำงาน cron ที่เสร็จสมบูรณ์
กลายเป็นข้อผิดพลาดจากการตรวจสอบโดยไม่ถูกต้อง เพียงเพราะสถานะรันไทม์ในหน่วยความจำของ Gateway หายไป
การตรวจสอบ CLI แบบออฟไลน์ไม่ใช่แหล่งข้อมูลที่เชื่อถือได้สำหรับชุดงาน cron ที่กำลังทำงาน
ซึ่งอยู่ภายในโปรเซสของ Gateway งาน CLI ที่มีรหัสการทำงาน/รหัสแหล่งที่มาจะถูกทำเครื่องหมายเป็น `lost`
เมื่อบริบทการทำงานจริงของ Gateway หายไป แม้ว่ายังมีแถวเซสชันลูกเก่าคงเหลืออยู่ก็ตาม

เมื่อดำเนินการ การบำรุงรักษาจะตัดแถวรีจิสทรีเซสชัน `cron:<jobId>:run:<uuid>`
ที่เก่ากว่า 7 วันด้วย โดยจะคงงาน cron ที่กำลังทำงานอยู่ และไม่เปลี่ยนแปลงแถวเซสชันที่ไม่ใช่ cron

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

ตรวจสอบหรือยกเลิกสถานะ Task Flow แบบคงทนภายใต้บัญชีรายการงาน
`flow list --status` รองรับ `queued`, `running`, `waiting`, `blocked`,
`succeeded`, `failed`, `cancelled` หรือ `lost`

## เนื้อหาที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [งานเบื้องหลัง](/th/automation/tasks)
