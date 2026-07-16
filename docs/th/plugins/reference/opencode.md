---
read_when:
    - คุณกำลังติดตั้ง กำหนดค่า หรือตรวจสอบ Plugin opencode
summary: เพิ่มการรองรับผู้ให้บริการโมเดล OpenCode ใน OpenClaw
title: Plugin OpenCode
x-i18n:
    generated_at: "2026-07-16T19:28:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aecf396cfc645e4a036b8130ed7f33db9081dffda120c6d06ebe863dd3be3730
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# Plugin OpenCode

เพิ่มการรองรับผู้ให้บริการโมเดล OpenCode ให้กับ OpenClaw

## การเผยแพร่

- แพ็กเกจ: `@openclaw/opencode-provider`
- ช่องทางการติดตั้ง: รวมอยู่ใน OpenClaw

## พื้นผิว

ผู้ให้บริการ: `opencode`; สัญญา: `mediaUnderstandingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## เซสชันแบบเนทีฟ

OpenClaw ตรวจหา CLI `opencode` โดยอัตโนมัติบน Gateway และ Node ที่จับคู่ไว้ จากนั้นเซสชัน
ที่จัดเก็บไว้จะปรากฏในกลุ่มเซสชัน **OpenCode** บนแถบด้านข้าง พร้อมการเรียกดู
ทรานสคริปต์แบบอ่านอย่างเดียวผ่านคำสั่งอย่างเป็นทางการ `opencode --pure db ... --format json`
และ `opencode --pure export` สภาพแวดล้อมที่จำกัดและโหมด `--pure`
ช่วยป้องกันไม่ให้การเรียกดูแค็ตตาล็อกโหลด Plugin ของโปรเจกต์หรือรับช่วงข้อมูลประจำตัว
ของ Gateway ที่ไม่เกี่ยวข้อง

ปิด **OpenCode Session Catalog** ภายใต้ **Config > Plugins > OpenCode** เพื่อ
ปิดใช้งานการค้นหา โดยเปิดใช้งานเป็นค่าเริ่มต้น

<!-- openclaw-plugin-reference:manual-end -->

## เอกสารที่เกี่ยวข้อง

- [opencode](/th/providers/opencode)
