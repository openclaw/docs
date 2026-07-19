---
read_when:
    - คุณต้องการล้างสถานะในเครื่องโดยที่ยังคงติดตั้ง CLI ไว้
    - คุณต้องการทดลองรันเพื่อดูว่าจะมีอะไรถูกลบบ้าง
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw reset` (รีเซ็ตสถานะ/การกำหนดค่าภายในเครื่อง)
title: รีเซ็ต
x-i18n:
    generated_at: "2026-07-19T07:05:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 54f1d320ee368dae4a4bfb32dea73d19eb35f9f30edd12d9c2580ab7e6a26fa6
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
- `--non-interactive`: ปิดใช้งานข้อความแจ้ง ต้องระบุ `--scope` และ `--yes`
- `--dry-run`: แสดงการดำเนินการโดยไม่ลบไฟล์

## ขอบเขต

| ขอบเขต                   | สิ่งที่ลบ                                                                     | หยุด Gateway ก่อน |
| ----------------------- | --------------------------------------------------------------------------- | ------------------- |
| `config`                | เฉพาะไฟล์การกำหนดค่า                                                            | ไม่                  |
| `config+creds+sessions` | ไฟล์การกำหนดค่า ไดเรกทอรี OAuth/ข้อมูลประจำตัว และไดเรกทอรีเซสชันของแต่ละเอเจนต์           | ใช่                 |
| `full`                  | ไดเรกทอรีสถานะ (รวมถึงฐานข้อมูล SQLite ที่ใช้ร่วมกัน) และไดเรกทอรีเวิร์กสเปซ | ใช่                 |

`config+creds+sessions` และ `full` จะหยุดบริการ Gateway ที่มีการจัดการและกำลังทำงานอยู่ก่อนลบสถานะ

## หมายเหตุ

- เรียกใช้ `openclaw backup create` ก่อน เพื่อสร้างสแนปชอตที่กู้คืนได้ก่อนลบสถานะภายในเครื่อง
- สถานะการตั้งค่าเวิร์กสเปซและการรับรองเป็นแถวข้อมูลในฐานข้อมูล SQLite ที่ใช้ร่วมกัน ดังนั้น `full` จะลบข้อมูลเหล่านี้ไปพร้อมกับไดเรกทอรีสถานะ ปัจจุบันไม่มีไฟล์เสริมการรับรองที่ต้องลบแยกต่างหาก
- หากไม่มี `--scope` คำสั่ง `openclaw reset` จะแจ้งให้เลือกขอบเขตที่จะลบแบบโต้ตอบ
- `--non-interactive` ใช้ได้เฉพาะเมื่อตั้งค่าทั้ง `--scope` และ `--yes` แล้วเท่านั้น
- `config+creds+sessions` และ `full` จะแสดง `Next: openclaw onboard --install-daemon` เมื่อเสร็จสิ้น

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
