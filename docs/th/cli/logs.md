---
read_when:
    - คุณต้องติดตามบันทึกของ Gateway จากระยะไกล (โดยไม่ใช้ SSH)
    - คุณต้องการบรรทัดบันทึกในรูปแบบ JSON สำหรับเครื่องมือ
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw logs` (ติดตามบันทึก Gateway ผ่าน RPC)
title: บันทึก
x-i18n:
    generated_at: "2026-04-30T09:43:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f9268fefa4d0e54297fd12c5cef30a1465bd735ae6a36292c279a438285f2b8
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

ติดตามล็อกไฟล์ของ Gateway ผ่าน RPC (ใช้งานได้ในโหมดระยะไกล)

ที่เกี่ยวข้อง:

- ภาพรวมการบันทึกล็อก: [การบันทึกล็อก](/th/logging)
- CLI ของ Gateway: [gateway](/th/cli/gateway)

## ตัวเลือก

- `--limit <n>`: จำนวนบรรทัดล็อกสูงสุดที่จะส่งคืน (ค่าเริ่มต้น `200`)
- `--max-bytes <n>`: จำนวนไบต์สูงสุดที่จะอ่านจากไฟล์ล็อก (ค่าเริ่มต้น `250000`)
- `--follow`: ติดตามสตรีมล็อก
- `--interval <ms>`: ช่วงเวลาการโพลขณะติดตาม (ค่าเริ่มต้น `1000`)
- `--json`: ส่งออกเหตุการณ์ JSON แบบหนึ่งเหตุการณ์ต่อบรรทัด
- `--plain`: เอาต์พุตข้อความธรรมดาโดยไม่มีการจัดรูปแบบสไตล์
- `--no-color`: ปิดใช้งานสี ANSI
- `--local-time`: แสดงเวลาประทับตามเขตเวลาท้องถิ่นของคุณ

## ตัวเลือก RPC ของ Gateway ที่ใช้ร่วมกัน

`openclaw logs` ยังรองรับแฟล็กมาตรฐานของไคลเอนต์ Gateway ด้วย:

- `--url <url>`: URL WebSocket ของ Gateway
- `--token <token>`: โทเค็น Gateway
- `--timeout <ms>`: หมดเวลาในหน่วยมิลลิวินาที (ค่าเริ่มต้น `30000`)
- `--expect-final`: รอการตอบกลับสุดท้ายเมื่อการเรียก Gateway มีเอเจนต์รองรับอยู่เบื้องหลัง

เมื่อคุณส่ง `--url` CLI จะไม่ใช้ข้อมูลประจำตัวจากการกำหนดค่าหรือสภาพแวดล้อมโดยอัตโนมัติ ให้ระบุ `--token` อย่างชัดเจนหาก Gateway เป้าหมายต้องใช้การยืนยันตัวตน

## ตัวอย่าง

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## หมายเหตุ

- ใช้ `--local-time` เพื่อแสดงเวลาประทับตามเขตเวลาท้องถิ่นของคุณ
- หาก Gateway แบบ local loopback โดยนัยร้องขอการจับคู่ ปิดระหว่างการเชื่อมต่อ หรือหมดเวลาก่อนที่ `logs.tail` จะตอบกลับ `openclaw logs` จะถอยกลับไปใช้ล็อกไฟล์ของ Gateway ที่กำหนดค่าไว้โดยอัตโนมัติ เป้าหมายที่ระบุ `--url` อย่างชัดเจนจะไม่ใช้การถอยกลับนี้

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [การบันทึกล็อกของ Gateway](/th/gateway/logging)
