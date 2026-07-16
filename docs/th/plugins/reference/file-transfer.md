---
read_when:
    - คุณกำลังติดตั้ง กำหนดค่า หรือตรวจสอบ Plugin การถ่ายโอนไฟล์
summary: ดึงข้อมูล แสดงรายการ และเขียนไฟล์บน Node ที่จับคู่แล้วผ่านคำสั่งเฉพาะของ Node หลีกเลี่ยงการตัดทอน stdout ของ bash โดยใช้ base64 ผ่าน node.invoke สำหรับไฟล์ไบนารีขนาดสูงสุด 16 MB.
title: Plugin การถ่ายโอนไฟล์
x-i18n:
    generated_at: "2026-07-16T19:27:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f76e92a821be53e988011e2fd9dd53b107b43a8191bf4cdf41baaf918a9c5412
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Plugin การถ่ายโอนไฟล์

ดึงข้อมูล แสดงรายการ และเขียนไฟล์บน Node ที่จับคู่ไว้ผ่านคำสั่งเฉพาะสำหรับ Node โดยหลีกเลี่ยงการตัดทอน stdout ของ bash ด้วยการใช้ base64 ผ่าน node.invoke สำหรับไฟล์ไบนารีขนาดไม่เกิน 16 MB

## การเผยแพร่

- แพ็กเกจ: `@openclaw/file-transfer`
- ช่องทางการติดตั้ง: รวมอยู่ใน OpenClaw

## อินเทอร์เฟซ

สัญญา: `tools`
