---
read_when:
    - คุณต้องการตรวจสอบข้อผูกพันในการติดตามผลที่อนุมานได้
    - คุณต้องการยกเลิกการเช็กอินที่รอดำเนินการ
    - คุณกำลังตรวจสอบสิ่งที่ Heartbeat อาจส่งมอบ
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw commitments` (ตรวจสอบและยกเลิกการติดตามผลที่อนุมานไว้)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-16T18:51:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db8a7d8f5756ccb18ed0990fcedf50d1072bb67e775c29eefdbd1a7dd795b7b0
    source_path: cli/commitments.md
    workflow: 16
---

แสดงรายการและจัดการข้อผูกพันในการติดตามผลที่อนุมานได้

ข้อผูกพันเป็นฟีเจอร์ที่ต้องเลือกใช้ (`commitments.enabled`) ซึ่งเป็นความจำสำหรับการติดตามผลระยะสั้น
ที่สร้างจากบริบทของการสนทนาและส่งผ่าน Heartbeat ดูคู่มือแนวคิดและการกำหนดค่าได้ที่
[ข้อผูกพันที่อนุมานได้](/th/concepts/commitments)

เมื่อไม่มีคำสั่งย่อย `openclaw commitments` จะแสดงรายการข้อผูกพันที่รอดำเนินการ

## การใช้งาน

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## ตัวเลือก

- `--all`: แสดงทุกสถานะแทนที่จะแสดงเฉพาะข้อผูกพันที่รอดำเนินการ
- `--agent <id>`: กรองตาม ID ของเอเจนต์หนึ่งรายการ
- `--status <status>`: กรองตามสถานะ ค่าได้แก่ `pending`, `sent`,
  `dismissed`, `snoozed` หรือ `expired` หากใช้ค่าที่ไม่รู้จัก โปรแกรมจะออกพร้อมข้อผิดพลาด
- `--json`: แสดงผลเป็น JSON ที่เครื่องอ่านได้

`dismiss` จะทำเครื่องหมาย ID ข้อผูกพันที่ระบุเป็น `dismissed` เพื่อไม่ให้ Heartbeat
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

## ผลลัพธ์

ผลลัพธ์แบบข้อความจะแสดงจำนวนข้อผูกพัน พาธฐานข้อมูล SQLite ที่ใช้ร่วมกัน ตัวกรองที่ใช้งานอยู่
และหนึ่งแถวต่อข้อผูกพัน:

- ID ข้อผูกพัน
- สถานะ
- ประเภท (`event_check_in`, `deadline_check`, `care_check_in` หรือ `open_loop`)
- เวลาครบกำหนดเร็วที่สุด
- ขอบเขต (เอเจนต์/ช่องทาง/เป้าหมาย)
- ข้อความติดตามผลที่แนะนำ

ผลลัพธ์ JSON ประกอบด้วยจำนวน ตัวกรองสถานะและเอเจนต์ที่ใช้งานอยู่
พาธฐานข้อมูล SQLite ที่ใช้ร่วมกัน และระเบียนที่จัดเก็บไว้อย่างครบถ้วน

## ที่เกี่ยวข้อง

- [ข้อผูกพันที่อนุมานได้](/th/concepts/commitments)
- [ภาพรวมความจำ](/th/concepts/memory)
- [Heartbeat](/th/gateway/heartbeat)
- [งานตามกำหนดเวลา](/th/automation/cron-jobs)
