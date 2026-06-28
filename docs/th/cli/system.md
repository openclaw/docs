---
read_when:
    - คุณต้องการเพิ่มเหตุการณ์ของระบบเข้าคิวโดยไม่ต้องสร้างงาน Cron
    - คุณต้องเปิดหรือปิดใช้งาน Heartbeat
    - คุณต้องการตรวจสอบรายการสถานะการมีอยู่ของระบบ
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw system` (เหตุการณ์ของระบบ, Heartbeat, สถานะการปรากฏตัว)
title: ระบบ
x-i18n:
    generated_at: "2026-05-11T20:27:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2810fb064ea4afeac24ca0d71419913a664bbec0721cabdb09196075914f4864
    source_path: cli/system.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw system`

ตัวช่วยระดับระบบสำหรับ Gateway: จัดคิวเหตุการณ์ระบบ ควบคุม Heartbeat
และดูสถานะการปรากฏ

คำสั่งย่อย `system` ทั้งหมดใช้ Gateway RPC และยอมรับแฟล็กไคลเอนต์ที่ใช้ร่วมกัน:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## คำสั่งทั่วไป

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

โดยค่าเริ่มต้น จะจัดคิวเหตุการณ์ระบบบนเซสชัน**หลัก** Heartbeat ถัดไป
จะแทรกเหตุการณ์นั้นเป็นบรรทัด `System:` ในพรอมป์ ใช้ `--mode now` เพื่อทริกเกอร์
Heartbeat ทันที; `next-heartbeat` จะรอ tick ตามกำหนดการถัดไป

ส่ง `--session-key` เพื่อกำหนดเป้าหมายเป็นเซสชันเฉพาะ (เช่น เพื่อส่งต่อ
การเสร็จสิ้นของงานแบบอะซิงโครนัสกลับไปยังช่องทางที่เริ่มงานนั้น)

> **ข้อยกเว้นด้านเวลากับ `--session-key`:** เมื่อระบุ `--session-key`,
> `--mode next-heartbeat` จะยุบเป็นการปลุกเป้าหมายทันทีแทนที่จะ
> รอ tick ตามกำหนดการถัดไป การปลุกเป้าหมายใช้เจตนา Heartbeat
> `immediate` จึงข้ามด่าน not-due ของรันเนอร์ ซึ่งไม่เช่นนั้นจะ
> เลื่อน (และเท่ากับทิ้ง) การปลุกที่มีเจตนาเป็น `event` หากคุณต้องการ
> การส่งมอบแบบหน่วงเวลา ให้ละ `--session-key` เพื่อให้เหตุการณ์ลงที่เซสชันหลักและ
> ไปกับ Heartbeat ปกติถัดไป

แฟล็ก:

- `--text <text>`: ข้อความเหตุการณ์ระบบที่จำเป็นต้องระบุ
- `--mode <mode>`: `now` หรือ `next-heartbeat` (ค่าเริ่มต้น)
- `--session-key <sessionKey>`: ไม่บังคับ; กำหนดเป้าหมายเป็นเซสชันเอเจนต์เฉพาะ
  แทนเซสชันหลักของเอเจนต์ คีย์ที่ไม่ได้เป็นของเอเจนต์ที่แก้ไขได้จะย้อนกลับไปยังเซสชันหลักของเอเจนต์
- `--json`: เอาต์พุตที่เครื่องอ่านได้
- `--url`, `--token`, `--timeout`, `--expect-final`: แฟล็ก Gateway RPC ที่ใช้ร่วมกัน

## `system heartbeat last|enable|disable`

การควบคุม Heartbeat:

- `last`: แสดงเหตุการณ์ Heartbeat ล่าสุด
- `enable`: เปิด Heartbeat อีกครั้ง (ใช้สิ่งนี้หากถูกปิดไว้)
- `disable`: หยุด Heartbeat ชั่วคราว

แฟล็ก:

- `--json`: เอาต์พุตที่เครื่องอ่านได้
- `--url`, `--token`, `--timeout`, `--expect-final`: แฟล็ก Gateway RPC ที่ใช้ร่วมกัน

## `system presence`

แสดงรายการเอนทรีสถานะการปรากฏของระบบปัจจุบันที่ Gateway ทราบ (โหนด,
อินสแตนซ์ และบรรทัดสถานะที่คล้ายกัน)

แฟล็ก:

- `--json`: เอาต์พุตที่เครื่องอ่านได้
- `--url`, `--token`, `--timeout`, `--expect-final`: แฟล็ก Gateway RPC ที่ใช้ร่วมกัน

## หมายเหตุ

- ต้องมี Gateway ที่กำลังทำงานและเข้าถึงได้โดยการกำหนดค่าปัจจุบันของคุณ (ภายในเครื่องหรือระยะไกล)
- เหตุการณ์ระบบเป็นแบบชั่วคราวและจะไม่คงอยู่ข้ามการรีสตาร์ต

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
