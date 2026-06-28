---
read_when:
    - คุณต้องการตรวจสอบสถานะสุขภาพของ Gateway ที่กำลังทำงานอยู่อย่างรวดเร็ว
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw health` (สแนปชอตสถานะสุขภาพของ Gateway ผ่าน RPC)
title: สถานะสุขภาพ
x-i18n:
    generated_at: "2026-05-10T19:29:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26be7bbbf75c2eca1213fe145fdeeab6fee96798dff457278ac69a20145bf75d
    source_path: cli/health.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw health`

ดึงข้อมูลสถานะสุขภาพจาก Gateway ที่กำลังทำงานอยู่

## ตัวเลือก

| แฟล็ก             | ค่าเริ่มต้น | คำอธิบาย                                                        |
| ---------------- | ------- | ------------------------------------------------------------------ |
| `--json`         | `false` | พิมพ์ JSON ที่เครื่องอ่านได้แทนข้อความ                       |
| `--timeout <ms>` | `10000` | ระยะหมดเวลาการเชื่อมต่อเป็นมิลลิวินาที                                |
| `--verbose`      | `false` | การบันทึกแบบละเอียด บังคับให้ตรวจสอบแบบสดและขยายเอาต์พุตรายเอเจนต์ |
| `--debug`        | `false` | นามแฝงสำหรับ `--verbose`                                             |

ตัวอย่าง:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

หมายเหตุ:

- ค่าเริ่มต้น `openclaw health` จะถาม Gateway ที่กำลังทำงานอยู่เพื่อขอสแนปช็อตสถานะสุขภาพ เมื่อ
  Gateway มีสแนปช็อตที่แคชไว้และยังสดอยู่แล้ว ก็สามารถส่งคืนเพย์โหลดที่แคชไว้นั้นและ
  รีเฟรชในเบื้องหลังได้
- `--verbose` บังคับให้ตรวจสอบแบบสด พิมพ์รายละเอียดการเชื่อมต่อ Gateway และขยาย
  เอาต์พุตที่มนุษย์อ่านได้สำหรับบัญชีและเอเจนต์ทั้งหมดที่กำหนดค่าไว้
- เอาต์พุตรวม session store รายเอเจนต์เมื่อกำหนดค่าเอเจนต์หลายตัว

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [สถานะสุขภาพของ Gateway](/th/gateway/health)
