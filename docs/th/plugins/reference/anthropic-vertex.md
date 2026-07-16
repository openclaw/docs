---
read_when:
    - คุณกำลังติดตั้ง กำหนดค่า หรือตรวจสอบ Plugin anthropic-vertex
summary: Plugin ผู้ให้บริการ Anthropic Vertex ของ OpenClaw สำหรับโมเดล Claude บน Google Vertex AI
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-07-16T19:26:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bd73b80b4e49a85cd6b1d8e47df6bf8d2d791c36a677124112f299027bfd9af5
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin ผู้ให้บริการ Anthropic Vertex ของ OpenClaw สำหรับโมเดล Claude บน Google Vertex AI

## การเผยแพร่

- แพ็กเกจ: `@openclaw/anthropic-vertex-provider`
- ช่องทางการติดตั้ง: npm; ClawHub

## พื้นผิว

ผู้ให้บริการ: `anthropic-vertex`

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

ใช้ `anthropic-vertex/claude-fable-5` ในภูมิภาค Google Cloud ที่มีโมเดลนี้ให้บริการ
Fable 5 ใช้การคิดแบบปรับตัวเสมอ และมีค่าเริ่มต้นเป็นระดับความพยายาม `high` ส่วน `/think off` และ
`/think minimal` ใช้ระดับความพยายาม `low` เนื่องจากโมเดลไม่รองรับการปิดใช้งานการคิด

## Claude Sonnet 5

ใช้ `anthropic-vertex/claude-sonnet-5` กับปลายทาง `global`, `us` หรือ `eu`
ของ Vertex โดย Sonnet 5 มีค่าเริ่มต้นเป็นการคิดแบบปรับตัวที่ระดับความพยายาม `high` และรองรับ
`/think off` หรือระดับแบบเนทีฟ `/think xhigh|max` OpenClaw เผยแพร่
หน้าต่างบริบทขนาด 1,000,000 โทเค็นและขีดจำกัดเอาต์พุต 128,000 โทเค็นโดยอัตโนมัติ

การกำหนดราคาในแค็ตตาล็อกเป็นไปตามอัตราเริ่มต้นทั่วโลกของ Vertex ที่ `$2/$10` ต่อ
หนึ่งล้านโทเค็นอินพุต/เอาต์พุตจนถึงวันที่ 31 สิงหาคม 2026 จากนั้นเป็น `$3/$15` ตั้งแต่
วันที่ 1 กันยายน ส่วนปลายทางแบบหลายภูมิภาค `us` และ `eu` ใช้อัตรา
เพิ่ม 10% ตามที่ Vertex ระบุไว้ในเอกสาร

<!-- openclaw-plugin-reference:manual-end -->
