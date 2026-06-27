---
read_when:
    - คุณกำลังติดตั้ง กำหนดค่า หรือตรวจสอบ Plugin codex-supervisor
summary: ดูแลเซสชัน app-server ของ Codex จาก OpenClaw
title: Plugin Codex Supervisor
x-i18n:
    generated_at: "2026-06-27T18:00:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d0791cf6aab23cb3ac14949742735ac45ac9210c608890048e9e3edc4dd9a5
    source_path: plugins/reference/codex-supervisor.md
    workflow: 16
---

# Plugin ผู้ดูแล Codex

ดูแลเซสชัน app-server ของ Codex จาก OpenClaw

## การแจกจ่าย

- แพ็กเกจ: `@openclaw/codex-supervisor`
- เส้นทางการติดตั้ง: รวมอยู่ใน OpenClaw

## พื้นผิว

contracts: tools

<!-- openclaw-plugin-reference:manual-start -->

## รายการเซสชัน

`codex_sessions_list` มีค่าเริ่มต้นเป็นเฉพาะเซสชัน Codex ที่โหลดแล้ว ตั้งค่า `include_stored` เพื่อรวมประวัติที่จัดเก็บไว้; plugin ใช้เส้นทางการแสดงรายการแบบ state-DB-only ของ app-server ของ Codex และจำกัดผลลัพธ์ที่จัดเก็บไว้ที่ 200 โดยค่าเริ่มต้น ส่ง `max_stored_sessions` เพื่อลดหรือเพิ่มขีดจำกัดนั้นได้สูงสุดถึง 1000

<!-- openclaw-plugin-reference:manual-end -->
