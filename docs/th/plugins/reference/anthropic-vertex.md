---
read_when:
    - คุณกำลังติดตั้ง กำหนดค่า หรือตรวจสอบ Plugin anthropic-vertex
summary: Plugin ผู้ให้บริการ Anthropic Vertex ของ OpenClaw สำหรับโมเดล Claude บน Google Vertex AI
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-07-12T16:32:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe5500ca56df49c0ef6ccbf39ced71e3fd0b18776ad23716de8575bc6ba64cb8
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin ผู้ให้บริการ Anthropic Vertex ของ OpenClaw สำหรับโมเดล Claude บน Google Vertex AI

## การเผยแพร่

- แพ็กเกจ: `@openclaw/anthropic-vertex-provider`
- ช่องทางการติดตั้ง: npm; ClawHub

## ส่วนที่เปิดให้ใช้งาน

ผู้ให้บริการ: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

ใช้ `anthropic-vertex/claude-fable-5` ในกรณีที่โมเดลพร้อมใช้งานในภูมิภาค Google Cloud ของคุณ
Fable 5 ใช้การคิดแบบปรับตัวเสมอและใช้ระดับความพยายาม `high` เป็นค่าเริ่มต้น `/think off` และ
`/think minimal` ใช้ระดับความพยายาม `low` เนื่องจากโมเดลไม่รองรับการปิดใช้งานการคิด

## Claude Sonnet 5

ใช้ `anthropic-vertex/claude-sonnet-5` กับปลายทาง `global`, `us` หรือ `eu`
ของ Vertex โดย Sonnet 5 ใช้การคิดแบบปรับตัวที่ระดับความพยายาม `high` เป็นค่าเริ่มต้น และรองรับ
`/think off` หรือระดับแบบเนทีฟ `/think xhigh|max` OpenClaw เผยแพร่
หน้าต่างบริบทขนาด 1,000,000 โทเค็นและขีดจำกัดเอาต์พุต 128,000 โทเค็นโดยอัตโนมัติ

ราคาในแค็ตตาล็อกเป็นไปตามอัตราเปิดตัวแบบทั่วโลกของ Vertex ที่ `$2/$10` ต่อ
หนึ่งล้านโทเค็นอินพุต/เอาต์พุตจนถึงวันที่ 31 สิงหาคม 2026 จากนั้นเป็น `$3/$15` ตั้งแต่
วันที่ 1 กันยายนเป็นต้นไป ส่วนปลายทางแบบหลายภูมิภาค `us` และ `eu` ใช้อัตราเพิ่ม
10% ตามที่ระบุไว้ในเอกสารของ Vertex

<!-- openclaw-plugin-reference:manual-end -->
