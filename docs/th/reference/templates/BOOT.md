---
read_when:
    - การเพิ่มรายการตรวจสอบ BOOT.md
summary: เทมเพลตพื้นที่ทำงานสำหรับ BOOT.md
title: เทมเพลต BOOT.md
x-i18n:
    generated_at: "2026-07-12T16:44:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

เพิ่มคำสั่งเริ่มต้นระบบที่กระชับและชัดเจนไว้ที่นี่ hook `boot-md` ที่มาพร้อมระบบจะเรียกใช้ไฟล์นี้หนึ่งครั้งต่อพื้นที่ทำงานของเอเจนต์ทุกครั้งที่ Gateway เริ่มทำงาน หากไฟล์มีอยู่และมีเนื้อหาที่ไม่ใช่เพียงช่องว่าง เอเจนต์หลายตัวที่ใช้พื้นที่ทำงานร่วมกันจะเรียกใช้เพียงครั้งเดียว

hook นี้ถูกปิดใช้งานมาโดยค่าเริ่มต้น ให้เปิดใช้งานก่อน:

```bash
openclaw hooks enable boot-md
```

หากรายการตรวจสอบข้อใดส่งข้อความ ให้ใช้เครื่องมือส่งข้อความ แล้วตอบกลับด้วยโทเค็นแบบเงียบ `NO_REPLY` ให้ตรงตามนี้ทุกประการ (ไม่คำนึงถึงตัวพิมพ์เล็กหรือพิมพ์ใหญ่)

## ที่เกี่ยวข้อง

- [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)
- [Hook](/th/automation/hooks#boot-md)
