---
read_when:
    - คุณกำลังจัดการโหนดที่จับคู่กัน (กล้อง, หน้าจอ, แคนวาส)
    - คุณต้องอนุมัติคำขอหรือเรียกใช้คำสั่ง node
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw nodes` (status, pairing, invoke, camera/canvas/screen)
title: โหนด
x-i18n:
    generated_at: "2026-06-27T17:22:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e752e4a5809e01ee7970204c84d9f1008f146d8a55954f6ed5de527a6a124bc7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

จัดการโหนด (อุปกรณ์) ที่จับคู่แล้วและเรียกใช้ความสามารถของโหนด

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

`nodes list` พิมพ์ตารางที่รอดำเนินการ/จับคู่แล้ว แถวที่จับคู่แล้วจะรวมอายุการเชื่อมต่อล่าสุด (เชื่อมต่อล่าสุด)
ใช้ `--connected` เพื่อแสดงเฉพาะโหนดที่เชื่อมต่ออยู่ในปัจจุบัน ใช้ `--last-connected <duration>` เพื่อ
กรองเฉพาะโหนดที่เชื่อมต่อภายในช่วงเวลาหนึ่ง (เช่น `24h`, `7d`)
ใช้ `nodes remove --node <id|name|ip>` เพื่อลบการจับคู่โหนด สำหรับโหนดที่มี
อุปกรณ์รองรับอยู่ การดำเนินการนี้จะเพิกถอนบทบาท `node` ของอุปกรณ์ใน `devices/paired.json`
และตัดการเชื่อมต่อเซสชันบทบาทโหนดของอุปกรณ์นั้น (อุปกรณ์ที่มีหลายบทบาทจะยังคงแถวของตัวเองและ
เสียเฉพาะบทบาท `node`; อุปกรณ์ที่เป็นโหนดเท่านั้นจะถูกลบ); และยังล้าง
ระเบียนการจับคู่โหนดแบบเดิมที่ Gateway เป็นเจ้าของซึ่งตรงกันด้วย `operator.pairing` สามารถลบ
แถวโหนดที่ไม่ใช่โอเปอเรเตอร์ได้; ผู้เรียกที่ใช้โทเคนอุปกรณ์ซึ่งเพิกถอนบทบาทโหนดของตนเองบน
อุปกรณ์ที่มีหลายบทบาทจะต้องมี `operator.admin` เพิ่มเติม

หมายเหตุการอนุมัติ:

- `openclaw nodes pending` ต้องการเฉพาะขอบเขตการจับคู่
- `gateway.nodes.pairing.autoApproveCidrs` สามารถข้ามขั้นตอนรอดำเนินการได้เฉพาะสำหรับ
  การจับคู่อุปกรณ์ `role: node` ครั้งแรกที่เชื่อถืออย่างชัดเจนเท่านั้น ค่านี้ปิดไว้เป็น
  ค่าเริ่มต้นและไม่อนุมัติการอัปเกรด
- `openclaw nodes approve <requestId>` รับข้อกำหนดขอบเขตเพิ่มเติมจาก
  คำขอที่รอดำเนินการ:
  - คำขอที่ไม่มีคำสั่ง: การจับคู่เท่านั้น
  - คำสั่งโหนดที่ไม่ใช่ exec: การจับคู่ + เขียน
  - `system.run` / `system.run.prepare` / `system.which`: การจับคู่ + ผู้ดูแลระบบ

## เรียกใช้

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

แฟล็กการเรียกใช้:

- `--params <json>`: สตริงอ็อบเจกต์ JSON (ค่าเริ่มต้น `{}`)
- `--invoke-timeout <ms>`: ระยะหมดเวลาการเรียกใช้โหนด (ค่าเริ่มต้น `15000`)
- `--idempotency-key <key>`: คีย์ idempotency ที่ไม่บังคับ
- `system.run` และ `system.run.prepare` ถูกบล็อกที่นี่; ใช้เครื่องมือ `exec` พร้อม `host=node` สำหรับการประมวลผลเชลล์

สำหรับการประมวลผลเชลล์บนโหนด ให้ใช้เครื่องมือ `exec` พร้อม `host=node` แทน `openclaw nodes run`
ตอนนี้ CLI `nodes` มุ่งเน้นความสามารถ: RPC โดยตรงผ่าน `nodes invoke` รวมถึงการจับคู่ กล้อง
หน้าจอ ตำแหน่งที่ตั้ง Canvas และการแจ้งเตือน คำสั่ง Canvas ถูกใช้งานโดย Plugin Canvas รุ่นทดลองที่รวมมาในชุด; core คงฮุกความเข้ากันได้ไว้เพื่อให้คำสั่งเหล่านี้ยังอยู่ภายใต้ `openclaw nodes canvas`

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [โหนด](/th/nodes)
