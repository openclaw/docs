---
read_when:
    - คุณต้องดูบันทึกของ Gateway แบบต่อเนื่องจากระยะไกล (โดยไม่ใช้ SSH)
    - คุณต้องการบรรทัดบันทึก JSON สำหรับเครื่องมือ
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw logs` (ติดตามบันทึก Gateway ผ่าน RPC)
title: บันทึก
x-i18n:
    generated_at: "2026-06-27T17:21:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3835880c0919d4c0c67bd3b371f9f8b0f396b80a9456c545ea0caa064a6361c0
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

ติดตามท้ายไฟล์ log ของ Gateway ผ่าน RPC (ใช้งานได้ในโหมดระยะไกล)

ที่เกี่ยวข้อง:

- ภาพรวมการบันทึก log: [การบันทึก log](/th/logging)
- Gateway CLI: [gateway](/th/cli/gateway)

## ตัวเลือก

- `--limit <n>`: จำนวนบรรทัด log สูงสุดที่จะส่งคืน (ค่าเริ่มต้น `200`)
- `--max-bytes <n>`: จำนวนไบต์สูงสุดที่จะอ่านจากไฟล์ log (ค่าเริ่มต้น `250000`)
- `--follow`: ติดตามสตรีม log
- `--interval <ms>`: ช่วงเวลาการ polling ขณะติดตาม (ค่าเริ่มต้น `1000`)
- `--json`: ส่งออกอีเวนต์ JSON แบบหนึ่งบรรทัดต่อรายการ
- `--plain`: เอาต์พุตข้อความธรรมดาโดยไม่มีการจัดรูปแบบแบบมีสไตล์
- `--no-color`: ปิดใช้งานสี ANSI
- `--local-time`: แสดง timestamp ตามเขตเวลาท้องถิ่นของคุณ (ค่าเริ่มต้น)
- `--utc`: แสดง timestamp เป็น UTC

## ตัวเลือก Gateway RPC ที่ใช้ร่วมกัน

`openclaw logs` ยังรับ flag มาตรฐานของไคลเอนต์ Gateway ด้วย:

- `--url <url>`: URL WebSocket ของ Gateway
- `--token <token>`: token ของ Gateway
- `--timeout <ms>`: timeout เป็น ms (ค่าเริ่มต้น `30000`)
- `--expect-final`: รอการตอบกลับสุดท้ายเมื่อการเรียก Gateway มี agent รองรับอยู่เบื้องหลัง

เมื่อคุณส่ง `--url` CLI จะไม่นำ config หรือข้อมูลรับรองจาก environment มาใช้โดยอัตโนมัติ ให้ระบุ `--token` อย่างชัดเจนหาก Gateway ปลายทางต้องใช้การยืนยันตัวตน

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
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## หมายเหตุ

- โดยค่าเริ่มต้น timestamp จะแสดงตามเขตเวลาท้องถิ่นของคุณ ใช้ `--utc` สำหรับเอาต์พุต UTC
- หาก Gateway แบบ local loopback โดยนัยขอให้จับคู่ ปิดระหว่างเชื่อมต่อ หรือ timeout ก่อนที่ `logs.tail` จะตอบ `openclaw logs` จะ fallback ไปยังไฟล์ log ของ Gateway ที่กำหนดค่าไว้โดยอัตโนมัติ เป้าหมาย `--url` ที่ระบุอย่างชัดเจนจะไม่ใช้ fallback นี้
- `openclaw logs --follow` จะไม่ติดตาม fallback แบบไฟล์ที่กำหนดค่าไว้หลังจาก Gateway RPC ภายในเครื่องโดยนัยล้มเหลว บน Linux จะใช้ journal ของ Gateway แบบ user-systemd ที่ใช้งานอยู่ตาม PID เมื่อมี และพิมพ์แหล่ง log ที่เลือก มิฉะนั้นจะลองเชื่อมต่อ Gateway สดซ้ำแทนการ tail ไฟล์ข้างเคียงที่อาจล้าสมัย
- เมื่อใช้ `--follow` การตัดการเชื่อมต่อ Gateway ชั่วคราว (WebSocket ปิด, timeout, การเชื่อมต่อหลุด) จะทริกเกอร์การเชื่อมต่อใหม่อัตโนมัติพร้อม exponential backoff (สูงสุด 8 ครั้ง จำกัดที่ 30 s ระหว่างครั้ง) จะพิมพ์คำเตือนไปยัง stderr ในแต่ละครั้งที่ลองใหม่ และพิมพ์ข้อความแจ้ง `[logs] gateway reconnected` เมื่อ poll สำเร็จหนึ่งครั้ง ในโหมด `--json` ทั้งคำเตือนการลองใหม่และ transition ของการเชื่อมต่อใหม่จะถูกส่งออกเป็นระเบียน `{"type":"notice"}` บน stderr ข้อผิดพลาดที่กู้คืนไม่ได้ (การยืนยันตัวตนล้มเหลว, การกำหนดค่าไม่ถูกต้อง) จะยังคงออกทันที

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [การบันทึก log ของ Gateway](/th/gateway/logging)
