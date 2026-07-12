---
read_when:
    - คุณต้องการตรวจสอบข้อผูกพันในการติดตามผลที่อนุมานได้
    - คุณต้องการยกเลิกการเช็กอินที่รอดำเนินการ
    - คุณกำลังตรวจสอบสิ่งที่ Heartbeat อาจส่งมอบ
summary: คู่มืออ้างอิง CLI สำหรับ `openclaw commitments` (ตรวจสอบและยกเลิกการติดตามผลที่อนุมานไว้)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-12T16:00:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

แสดงรายการและจัดการข้อผูกพันในการติดตามผลที่อนุมานขึ้น

ข้อผูกพันเป็นฟีเจอร์ที่ต้องเลือกเปิดใช้ (`commitments.enabled`) โดยเป็นความจำระยะสั้นสำหรับการติดตามผล
ที่สร้างจากบริบทของบทสนทนาและส่งผ่าน Heartbeat โปรดดู
[ข้อผูกพันที่อนุมานขึ้น](/th/concepts/commitments) สำหรับคู่มือแนวคิดและการกำหนดค่า

เมื่อไม่มีคำสั่งย่อย `openclaw commitments` จะแสดงรายการข้อผูกพันที่รอดำเนินการ

## การใช้งาน

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## ตัวเลือก

- `--all`: แสดงทุกสถานะแทนที่จะแสดงเฉพาะข้อผูกพันที่รอดำเนินการ
- `--agent <id>`: กรองตามรหัสเอเจนต์หนึ่งรายการ
- `--status <status>`: กรองตามสถานะ ค่าที่ใช้ได้: `pending`, `sent`,
  `dismissed`, `snoozed` หรือ `expired` ค่าที่ไม่รู้จักจะทำให้โปรแกรมจบการทำงานพร้อมข้อผิดพลาด
- `--json`: แสดงผลเป็น JSON ที่เครื่องอ่านได้

`dismiss` จะกำหนดข้อผูกพันตามรหัสที่ระบุให้มีสถานะ `dismissed` เพื่อไม่ให้ Heartbeat
ส่งข้อผูกพันเหล่านั้น

## ตัวอย่าง

แสดงรายการข้อผูกพันที่รอดำเนินการ:

```bash
openclaw commitments
```

แสดงรายการข้อผูกพันทั้งหมดที่จัดเก็บไว้:

```bash
openclaw commitments --all
```

กรองตามเอเจนต์หนึ่งรายการ:

```bash
openclaw commitments --agent main
```

ค้นหาข้อผูกพันที่เลื่อนการแจ้งเตือนไว้:

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

## ผลลัพธ์

ผลลัพธ์แบบข้อความจะแสดงจำนวนข้อผูกพัน พาธของที่เก็บ ตัวกรองที่ใช้งานอยู่
และหนึ่งแถวต่อข้อผูกพัน:

- รหัสข้อผูกพัน
- สถานะ
- ชนิด (`event_check_in`, `deadline_check`, `care_check_in` หรือ `open_loop`)
- เวลาครบกำหนดที่เร็วที่สุด
- ขอบเขต (เอเจนต์/ช่องทาง/เป้าหมาย)
- ข้อความติดตามผลที่แนะนำ

ผลลัพธ์ JSON ประกอบด้วยจำนวน ตัวกรองสถานะและเอเจนต์ที่ใช้งานอยู่ พาธของ
ที่เก็บข้อผูกพัน และระเบียนที่จัดเก็บไว้ทั้งหมด

## เนื้อหาที่เกี่ยวข้อง

- [ข้อผูกพันที่อนุมานขึ้น](/th/concepts/commitments)
- [ภาพรวมความจำ](/th/concepts/memory)
- [Heartbeat](/th/gateway/heartbeat)
- [งานที่ตั้งเวลาไว้](/th/automation/cron-jobs)
