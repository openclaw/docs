---
read_when:
    - คุณต้องการล้างสถานะภายในเครื่องโดยยังคงติดตั้ง CLI ไว้
    - คุณต้องการทดลองรันเพื่อดูว่าจะมีสิ่งใดถูกลบออกบ้าง
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw reset` (รีเซ็ตสถานะ/การกำหนดค่าในเครื่อง)
title: รีเซ็ต
x-i18n:
    generated_at: "2026-07-12T16:03:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

รีเซ็ตการกำหนดค่า/สถานะภายในเครื่อง (ยังคงติดตั้ง CLI ไว้)

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## ตัวเลือก

- `--scope <scope>`: `config`, `config+creds+sessions` หรือ `full`
- `--yes`: ข้ามข้อความแจ้งให้ยืนยัน
- `--non-interactive`: ปิดใช้งานข้อความแจ้ง โดยต้องระบุ `--scope` และ `--yes`
- `--dry-run`: แสดงการดำเนินการโดยไม่ลบไฟล์

## ขอบเขต

| ขอบเขต                 | รายการที่ลบ                                                                                                  | หยุด Gateway ก่อน |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------- |
| `config`                | เฉพาะไฟล์การกำหนดค่า                                                                                         | ไม่                |
| `config+creds+sessions` | ไฟล์การกำหนดค่า ไดเรกทอรี OAuth/ข้อมูลประจำตัว และไดเรกทอรีเซสชันของแต่ละเอเจนต์                            | ใช่                |
| `full`                  | ไดเรกทอรีสถานะ (รวมถึงการกำหนดค่า/ข้อมูลประจำตัวหากซ้อนอยู่ภายใน) รวมทั้งไดเรกทอรีเวิร์กสเปซและคำรับรองเวิร์กสเปซ | ใช่                |

`config+creds+sessions` และ `full` จะหยุดบริการ Gateway ที่มีการจัดการซึ่งกำลังทำงานอยู่ก่อนลบสถานะ

## หมายเหตุ

- เรียกใช้ `openclaw backup create` ก่อน เพื่อสร้างสแนปช็อตที่กู้คืนได้ก่อนลบสถานะภายในเครื่อง
- หากไม่ระบุ `--scope` คำสั่ง `openclaw reset` จะแจ้งให้เลือกขอบเขตที่จะลบแบบโต้ตอบ
- `--non-interactive` ใช้ได้เฉพาะเมื่อตั้งค่าทั้ง `--scope` และ `--yes`
- เมื่อเสร็จสิ้น `config+creds+sessions` และ `full` จะแสดง `Next: openclaw onboard --install-daemon`

## เนื้อหาที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
