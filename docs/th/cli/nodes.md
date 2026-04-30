---
read_when:
    - คุณกำลังจัดการ Node ที่จับคู่ (กล้อง, หน้าจอ, แคนวาส)
    - คุณต้องอนุมัติคำขอหรือเรียกใช้คำสั่ง node
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw nodes` (status, pairing, invoke, camera/canvas/screen)
title: Node
x-i18n:
    generated_at: "2026-04-30T09:44:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3229db91d7e64b0d37bee29bd51895d90796f5fd33b67e3d900fd8bda2b6e7e9
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

จัดการโหนดที่จับคู่แล้ว (อุปกรณ์) และเรียกใช้ความสามารถของโหนด

ที่เกี่ยวข้อง:

- ภาพรวมโหนด: [โหนด](/th/nodes)
- กล้อง: [โหนดกล้อง](/th/nodes/camera)
- รูปภาพ: [โหนดรูปภาพ](/th/nodes/images)

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
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` แสดงตารางที่รอดำเนินการ/จับคู่แล้ว แถวที่จับคู่แล้วจะมีอายุการเชื่อมต่อล่าสุด (Last Connect)
ใช้ `--connected` เพื่อแสดงเฉพาะโหนดที่เชื่อมต่ออยู่ในปัจจุบัน ใช้ `--last-connected <duration>` เพื่อ
กรองเฉพาะโหนดที่เชื่อมต่อภายในระยะเวลาหนึ่ง (เช่น `24h`, `7d`)
ใช้ `nodes remove --node <id|name|ip>` เพื่อลบระเบียนการจับคู่โหนดเก่าที่ Gateway เป็นเจ้าของ

หมายเหตุการอนุมัติ:

- `openclaw nodes pending` ต้องใช้เฉพาะขอบเขตสิทธิ์การจับคู่
- `gateway.nodes.pairing.autoApproveCidrs` สามารถข้ามขั้นตอนที่รอดำเนินการได้เฉพาะสำหรับ
  การจับคู่อุปกรณ์ `role: node` ครั้งแรกที่เชื่อถืออย่างชัดเจนเท่านั้น ค่าเริ่มต้นคือปิด
  และไม่อนุมัติการอัปเกรด
- `openclaw nodes approve <requestId>` รับข้อกำหนดขอบเขตสิทธิ์เพิ่มเติมจาก
  คำขอที่รอดำเนินการ:
  - คำขอที่ไม่มีคำสั่ง: การจับคู่เท่านั้น
  - คำสั่งโหนดที่ไม่ใช่ exec: การจับคู่ + write
  - `system.run` / `system.run.prepare` / `system.which`: การจับคู่ + admin

## เรียกใช้

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

แฟล็กการเรียกใช้:

- `--params <json>`: สตริงออบเจ็กต์ JSON (ค่าเริ่มต้น `{}`)
- `--invoke-timeout <ms>`: เวลาหมดเวลาการเรียกใช้โหนด (ค่าเริ่มต้น `15000`)
- `--idempotency-key <key>`: คีย์ idempotency แบบไม่บังคับ
- `system.run` และ `system.run.prepare` ถูกบล็อกที่นี่ ใช้เครื่องมือ `exec` พร้อม `host=node` สำหรับการเรียกใช้เชลล์

สำหรับการเรียกใช้เชลล์บนโหนด ให้ใช้เครื่องมือ `exec` พร้อม `host=node` แทน `openclaw nodes run`
ตอนนี้ CLI `nodes` เน้นความสามารถเป็นหลัก: RPC โดยตรงผ่าน `nodes invoke` รวมถึงการจับคู่ กล้อง
หน้าจอ ตำแหน่งที่ตั้ง แคนวาส และการแจ้งเตือน

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [โหนด](/th/nodes)
