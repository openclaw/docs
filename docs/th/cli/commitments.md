---
read_when:
    - คุณต้องการตรวจสอบข้อผูกพันในการติดตามผลที่อนุมานได้
    - คุณต้องการยกเลิกการเช็กอินที่รอดำเนินการ
    - คุณกำลังตรวจสอบสิ่งที่ Heartbeat อาจส่งมอบได้
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw commitments` (ตรวจสอบและปิดการติดตามผลที่อนุมานได้)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-04-30T09:42:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37d5e5dca25cf649a5069360aa4e41fcc33d042dea99f643b98c07189c58f21c
    source_path: cli/commitments.md
    workflow: 16
---

แสดงรายการและจัดการข้อผูกพันในการติดตามผลที่อนุมานได้

ข้อผูกพันคือความจำสำหรับการติดตามผลแบบเลือกใช้เองและมีอายุสั้น ซึ่งสร้างจาก
บริบทของการสนทนา ดู [ข้อผูกพันที่อนุมานได้](/th/concepts/commitments) สำหรับ
คู่มือแนวคิด

เมื่อไม่มีคำสั่งย่อย `openclaw commitments` จะแสดงรายการข้อผูกพันที่รอดำเนินการ

## การใช้งาน

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## ตัวเลือก

- `--all`: แสดงทุกสถานะแทนที่จะแสดงเฉพาะข้อผูกพันที่รอดำเนินการ
- `--agent <id>`: กรองให้เหลือ agent id เดียว
- `--status <status>`: กรองตามสถานะ ค่า: `pending`, `sent`,
  `dismissed`, `snoozed` หรือ `expired`
- `--json`: ส่งออก JSON ที่เครื่องอ่านได้

## ตัวอย่าง

แสดงรายการข้อผูกพันที่รอดำเนินการ:

```bash
openclaw commitments
```

แสดงรายการข้อผูกพันที่จัดเก็บไว้ทั้งหมด:

```bash
openclaw commitments --all
```

กรองให้เหลือ agent เดียว:

```bash
openclaw commitments --agent main
```

ค้นหาข้อผูกพันที่เลื่อนการแจ้งเตือน:

```bash
openclaw commitments --status snoozed
```

ยกเลิกข้อผูกพันหนึ่งรายการขึ้นไป:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

ส่งออกเป็น JSON:

```bash
openclaw commitments --all --json
```

## เอาต์พุต

เอาต์พุตแบบข้อความประกอบด้วย:

- id ของข้อผูกพัน
- สถานะ
- ชนิด
- เวลาถึงกำหนดที่เร็วที่สุด
- ขอบเขต
- ข้อความเช็กอินที่แนะนำ

เอาต์พุต JSON ยังมีเส้นทางของที่จัดเก็บข้อผูกพันและระเบียนที่จัดเก็บไว้แบบเต็ม

## ที่เกี่ยวข้อง

- [ข้อผูกพันที่อนุมานได้](/th/concepts/commitments)
- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [Heartbeat](/th/gateway/heartbeat)
- [งานตามกำหนดเวลา](/th/automation/cron-jobs)
