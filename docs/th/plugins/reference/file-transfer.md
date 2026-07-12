---
read_when:
    - คุณกำลังติดตั้ง กำหนดค่า หรือตรวจสอบ Plugin สำหรับถ่ายโอนไฟล์
summary: ดึงข้อมูล แสดงรายการ และเขียนไฟล์บน Node ที่จับคู่แล้วผ่านคำสั่งเฉพาะสำหรับ Node โดยหลีกเลี่ยงการตัดทอน stdout ของ bash ด้วยการใช้ base64 ผ่าน node.invoke สำหรับไฟล์ไบนารีขนาดไม่เกิน 16 MB
title: Plugin ถ่ายโอนไฟล์
x-i18n:
    generated_at: "2026-07-12T16:27:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Plugin การถ่ายโอนไฟล์

ดึงข้อมูล แสดงรายการ และเขียนไฟล์บน Node ที่จับคู่ไว้ผ่านคำสั่งเฉพาะของ Node หลีกเลี่ยงการตัดทอน stdout ของ bash โดยใช้ base64 ผ่าน node.invoke สำหรับไฟล์ไบนารีขนาดสูงสุด 16 MB

## การเผยแพร่

- แพ็กเกจ: `@openclaw/file-transfer`
- ช่องทางการติดตั้ง: รวมอยู่ใน OpenClaw

## ส่วนติดต่อ

สัญญา: เครื่องมือ
