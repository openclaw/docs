---
read_when:
    - คุณกำลังจัดการ Node ที่จับคู่แล้ว (กล้อง หน้าจอ canvas)
    - คุณต้องอนุมัติคำขอหรือเรียกใช้คำสั่งของ Node
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw nodes` (สถานะ การจับคู่ การเรียกใช้ กล้อง/canvas/หน้าจอ)
title: Node
x-i18n:
    generated_at: "2026-04-25T13:44:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a5701ce0dcba399d93f6eed864b0b0ae34320501de0176aeaad1712d392834
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

จัดการ Node ที่จับคู่แล้ว (อุปกรณ์) และเรียกใช้ความสามารถของ Node

ที่เกี่ยวข้อง:

- ภาพรวมของ Node: [Node](/th/nodes)
- กล้อง: [Node กล้อง](/th/nodes/camera)
- รูปภาพ: [Node รูปภาพ](/th/nodes/images)

ตัวเลือกทั่วไป:

- `--url`, `--token`, `--timeout`, `--json`

## คำสั่งทั่วไป

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` จะแสดงตาราง pending/paired แถวที่จับคู่แล้วจะมีอายุการเชื่อมต่อล่าสุดรวมอยู่ด้วย (Last Connect)
ใช้ `--connected` เพื่อแสดงเฉพาะ Node ที่เชื่อมต่ออยู่ในขณะนี้ ใช้ `--last-connected <duration>` เพื่อ
กรองให้เหลือเฉพาะ Node ที่เชื่อมต่อภายในช่วงเวลาที่กำหนด (เช่น `24h`, `7d`)

หมายเหตุเกี่ยวกับการอนุมัติ:

- `openclaw nodes pending` ต้องใช้เพียง scope การจับคู่เท่านั้น
- `gateway.nodes.pairing.autoApproveCidrs` สามารถข้ามขั้นตอน pending ได้เฉพาะสำหรับ
  การจับคู่อุปกรณ์ `role: node` ครั้งแรกที่เชื่อถือได้อย่างชัดเจนเท่านั้น ค่าเริ่มต้นจะปิดไว้
  และไม่อนุมัติการอัปเกรด
- `openclaw nodes approve <requestId>` จะสืบทอดข้อกำหนด scope เพิ่มเติมจาก
  คำขอที่รอดำเนินการ:
  - คำขอที่ไม่มีคำสั่ง: pairing เท่านั้น
  - คำสั่ง Node ที่ไม่ใช่ exec: pairing + write
  - `system.run` / `system.run.prepare` / `system.which`: pairing + admin

## การเรียกใช้

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

แฟล็กการเรียกใช้:

- `--params <json>`: สตริงออบเจ็กต์ JSON (ค่าเริ่มต้น `{}`).
- `--invoke-timeout <ms>`: ระยะหมดเวลาสำหรับการเรียกใช้ Node (ค่าเริ่มต้น `15000`)
- `--idempotency-key <key>`: idempotency key แบบไม่บังคับ
- `system.run` และ `system.run.prepare` ถูกบล็อกไว้ที่นี่; ให้ใช้เครื่องมือ `exec` กับ `host=node` สำหรับการรัน shell

สำหรับการรัน shell บน Node ให้ใช้เครื่องมือ `exec` กับ `host=node` แทน `openclaw nodes run`
ปัจจุบัน CLI `nodes` มุ่งเน้นที่ความสามารถ: direct RPC ผ่าน `nodes invoke` พร้อมทั้งการจับคู่ กล้อง
หน้าจอ ตำแหน่ง canvas และการแจ้งเตือน

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Node](/th/nodes)
