---
read_when:
    - คุณกำลังติดตั้ง กำหนดค่า หรือตรวจสอบ Plugin สำหรับการถ่ายโอนไฟล์
summary: ดึงข้อมูล แสดงรายการ และเขียนไฟล์บนโหนดที่จับคู่ไว้ผ่านคำสั่งโหนดเฉพาะ เลี่ยงการตัดทอน stdout ของ bash โดยใช้ base64 ผ่าน node.invoke สำหรับไบนารีขนาดสูงสุด 16 MB
title: Plugin การถ่ายโอนไฟล์
x-i18n:
    generated_at: "2026-05-02T20:51:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Plugin การถ่ายโอนไฟล์

ดึงข้อมูล แสดงรายการ และเขียนไฟล์บนโหนดที่จับคู่ไว้ผ่านคำสั่งโหนดเฉพาะ เลี่ยงการตัดทอน stdout ของ bash โดยใช้ base64 ผ่าน node.invoke สำหรับไฟล์ไบนารีขนาดสูงสุด 16 MB

## การจัดจำหน่าย

- แพ็กเกจ: `@openclaw/file-transfer`
- เส้นทางการติดตั้ง: รวมอยู่ใน OpenClaw

## พื้นผิว

contracts: tools
