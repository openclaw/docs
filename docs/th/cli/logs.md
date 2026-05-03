---
read_when:
    - คุณต้องติดตามบันทึก Gateway แบบต่อเนื่องจากระยะไกล (โดยไม่ใช้ SSH)
    - คุณต้องการบรรทัดบันทึก JSON สำหรับเครื่องมือ
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw logs` (ติดตามบันทึก Gateway ผ่าน RPC)
title: บันทึกเหตุการณ์
x-i18n:
    generated_at: "2026-05-03T10:10:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89753a18e31cd643e19db80b6cef4ecac1aae0733e68d6c678e6419e28bd270e
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

ติดตามล็อกไฟล์ของ Gateway ผ่าน RPC (ทำงานในโหมดรีโมต)

ที่เกี่ยวข้อง:

- ภาพรวมการบันทึกล็อก: [การบันทึกล็อก](/th/logging)
- CLI ของ Gateway: [gateway](/th/cli/gateway)

## ตัวเลือก

- `--limit <n>`: จำนวนบรรทัดล็อกสูงสุดที่จะส่งคืน (ค่าเริ่มต้น `200`)
- `--max-bytes <n>`: จำนวนไบต์สูงสุดที่จะอ่านจากไฟล์ล็อก (ค่าเริ่มต้น `250000`)
- `--follow`: ติดตามสตรีมล็อก
- `--interval <ms>`: ช่วงเวลาการโพลขณะติดตาม (ค่าเริ่มต้น `1000`)
- `--json`: ส่งออกเหตุการณ์ JSON แบบหนึ่งบรรทัดต่อหนึ่งรายการ
- `--plain`: เอาต์พุตข้อความธรรมดาโดยไม่มีการจัดรูปแบบ
- `--no-color`: ปิดใช้สี ANSI
- `--local-time`: แสดงเวลาในเขตเวลาท้องถิ่นของคุณ

## ตัวเลือก Gateway RPC ที่ใช้ร่วมกัน

`openclaw logs` ยังรับแฟล็กไคลเอนต์ Gateway มาตรฐานด้วย:

- `--url <url>`: URL WebSocket ของ Gateway
- `--token <token>`: โทเค็น Gateway
- `--timeout <ms>`: ระยะหมดเวลาเป็นมิลลิวินาที (ค่าเริ่มต้น `30000`)
- `--expect-final`: รอการตอบกลับสุดท้ายเมื่อการเรียก Gateway รองรับโดยเอเจนต์

เมื่อคุณส่ง `--url` CLI จะไม่ปรับใช้ข้อมูลประจำตัวจากการกำหนดค่าหรือสภาพแวดล้อมโดยอัตโนมัติ ให้ระบุ `--token` อย่างชัดเจนหาก Gateway เป้าหมายต้องมีการยืนยันตัวตน

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

- ใช้ `--local-time` เพื่อแสดงเวลาในเขตเวลาท้องถิ่นของคุณ
- หาก Gateway แบบ local loopback โดยนัยขอให้จับคู่ ปิดระหว่างการเชื่อมต่อ หรือหมดเวลาก่อนที่ `logs.tail` จะตอบกลับ `openclaw logs` จะย้อนกลับไปใช้ล็อกไฟล์ Gateway ที่กำหนดค่าไว้โดยอัตโนมัติ เป้าหมาย `--url` ที่ระบุอย่างชัดเจนจะไม่ใช้กลไกสำรองนี้
- เมื่อใช้ `--follow` การตัดการเชื่อมต่อ Gateway ชั่วคราว (WebSocket ปิด หมดเวลา การเชื่อมต่อหลุด) จะทริกเกอร์การเชื่อมต่อใหม่โดยอัตโนมัติด้วย exponential backoff (สูงสุด 8 ครั้ง จำกัดช่วงระหว่างความพยายามไว้ที่ 30 วินาที) คำเตือนจะถูกพิมพ์ไปยัง stderr ในแต่ละครั้งที่ลองใหม่ และจะแสดงประกาศ `[logs] gateway reconnected` เมื่อโพลสำเร็จ ในโหมด `--json` ทั้งคำเตือนการลองใหม่และการเปลี่ยนสถานะเชื่อมต่อใหม่จะถูกส่งออกเป็นระเบียน `{"type":"notice"}` บน stderr ข้อผิดพลาดที่กู้คืนไม่ได้ (การยืนยันตัวตนล้มเหลว การกำหนดค่าไม่ถูกต้อง) จะยังออกทันที

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การบันทึกล็อกของ Gateway](/th/gateway/logging)
