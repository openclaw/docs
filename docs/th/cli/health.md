---
read_when:
    - คุณต้องการตรวจสอบสถานะความสมบูรณ์ของ Gateway ที่กำลังทำงานอยู่อย่างรวดเร็ว
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw health` (สแนปช็อตสถานะสุขภาพของ Gateway ผ่าน RPC)
title: สถานะสุขภาพ
x-i18n:
    generated_at: "2026-05-06T09:05:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 443684af04efce2c54a6679e13b0bff0a5c1869f85d60fae0e853aed0a362226
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

ดึงข้อมูลสถานะสุขภาพจาก Gateway ที่กำลังทำงานอยู่

ตัวเลือก:

- `--json`: เอาต์พุตที่เครื่องอ่านได้
- `--timeout <ms>`: หมดเวลาการเชื่อมต่อเป็นมิลลิวินาที (ค่าเริ่มต้น `10000`)
- `--verbose`: การบันทึกแบบละเอียด
- `--debug`: นามแฝงของ `--verbose`

ตัวอย่าง:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

หมายเหตุ:

- ค่าเริ่มต้น `openclaw health` จะขอภาพรวมสถานะสุขภาพจาก Gateway ที่กำลังทำงานอยู่ เมื่อ
  Gateway มีภาพรวมที่แคชไว้ซึ่งยังใหม่อยู่แล้ว ก็สามารถส่งเพย์โหลดที่แคชนั้นกลับมา และ
  รีเฟรชในเบื้องหลังได้
- `--verbose` บังคับให้ทำการตรวจสอบแบบสด พิมพ์รายละเอียดการเชื่อมต่อ Gateway และขยาย
  เอาต์พุตที่มนุษย์อ่านได้ให้ครอบคลุมบัญชีและเอเจนต์ที่กำหนดค่าทั้งหมด
- เอาต์พุตรวมถึงที่เก็บเซสชันรายเอเจนต์เมื่อมีการกำหนดค่าเอเจนต์หลายตัว

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [สถานะสุขภาพของ Gateway](/th/gateway/health)
