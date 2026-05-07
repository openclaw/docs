---
read_when:
    - คุณกำลังจัดการโหนดที่จับคู่กัน (กล้อง หน้าจอ แคนวาส)
    - คุณต้องอนุมัติคำขอหรือเรียกใช้คำสั่ง Node
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw nodes` (สถานะ, การจับคู่, การเรียกใช้, กล้อง/แคนวาส/หน้าจอ)
title: Node
x-i18n:
    generated_at: "2026-05-07T13:14:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 681c199462d5f58c3e4346713263a78e7513335f087c713877e3050e21c8e15f
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

จัดการ Node (อุปกรณ์) ที่จับคู่แล้วและเรียกใช้ความสามารถของ Node

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
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` แสดงตารางที่รอดำเนินการ/จับคู่แล้ว แถวที่จับคู่แล้วจะมีอายุการเชื่อมต่อล่าสุด (Last Connect)
ใช้ `--connected` เพื่อแสดงเฉพาะ Node ที่เชื่อมต่ออยู่ในขณะนี้ ใช้ `--last-connected <duration>` เพื่อ
กรองเฉพาะ Node ที่เชื่อมต่อภายในช่วงเวลาหนึ่ง (เช่น `24h`, `7d`)
ใช้ `nodes remove --node <id|name|ip>` เพื่อลบระเบียนการจับคู่ Node เก่าที่ Gateway เป็นเจ้าของ

หมายเหตุการอนุมัติ:

- `openclaw nodes pending` ต้องใช้เฉพาะขอบเขตการจับคู่เท่านั้น
- `gateway.nodes.pairing.autoApproveCidrs` สามารถข้ามขั้นตอนที่รอดำเนินการได้เฉพาะสำหรับ
  การจับคู่อุปกรณ์ `role: node` ครั้งแรกที่เชื่อถืออย่างชัดเจนเท่านั้น โดยค่าเริ่มต้นจะปิดอยู่
  และไม่อนุมัติการอัปเกรด
- `openclaw nodes approve <requestId>` รับช่วงข้อกำหนดขอบเขตเพิ่มเติมจาก
  คำขอที่รอดำเนินการ:
  - คำขอที่ไม่มีคำสั่ง: จับคู่เท่านั้น
  - คำสั่ง Node ที่ไม่ใช่ exec: จับคู่ + เขียน
  - `system.run` / `system.run.prepare` / `system.which`: จับคู่ + ผู้ดูแลระบบ

## เรียกใช้

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

แฟล็กการเรียกใช้:

- `--params <json>`: สตริงออบเจ็กต์ JSON (ค่าเริ่มต้น `{}`)
- `--invoke-timeout <ms>`: ระยะหมดเวลาการเรียกใช้ Node (ค่าเริ่มต้น `15000`)
- `--idempotency-key <key>`: คีย์ idempotency ที่ไม่บังคับ
- `system.run` และ `system.run.prepare` ถูกบล็อกที่นี่ ให้ใช้เครื่องมือ `exec` พร้อม `host=node` สำหรับการเรียกใช้เชลล์

สำหรับการเรียกใช้เชลล์บน Node ให้ใช้เครื่องมือ `exec` พร้อม `host=node` แทน `openclaw nodes run`
ตอนนี้ CLI ของ `nodes` มุ่งเน้นที่ความสามารถ: RPC โดยตรงผ่าน `nodes invoke` รวมถึงการจับคู่ กล้อง
หน้าจอ ตำแหน่งที่ตั้ง Canvas และการแจ้งเตือน คำสั่ง Canvas ดำเนินการโดย Plugin Canvas แบบทดลองที่รวมมาให้; core คง hook ความเข้ากันได้ไว้ เพื่อให้คำสั่งเหล่านั้นยังคงอยู่ภายใต้ `openclaw nodes canvas`

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Node](/th/nodes)
