---
read_when:
    - การเพิ่มรายการตรวจสอบใน BOOT.md
summary: เทมเพลต Workspace สำหรับ BOOT.md
title: เทมเพลต BOOT.md
x-i18n:
    generated_at: "2026-04-24T09:32:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 78c31ef770af20fee60c5d9998c7b2eefb0e2139076f26707ee4cf84502b59f8
    source_path: reference/templates/BOOT.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# BOOT.md

เพิ่มคำสั่งสั้น ๆ และชัดเจนสำหรับสิ่งที่ OpenClaw ควรทำเมื่อเริ่มต้นระบบ (เปิดใช้ `hooks.internal.enabled`)
หากงานนั้นมีการส่งข้อความ ให้ใช้ message tool แล้วจึงตอบกลับด้วย
silent token แบบตรงตัว `NO_REPLY` / `no_reply`

## ที่เกี่ยวข้อง

- [Workspace ของเอเจนต์](/th/concepts/agent-workspace)
