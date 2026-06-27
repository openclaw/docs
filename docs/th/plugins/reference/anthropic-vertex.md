---
read_when:
    - คุณกำลังติดตั้ง กำหนดค่า หรือตรวจสอบ Plugin anthropic-vertex
summary: Plugin ผู้ให้บริการ Anthropic Vertex ของ OpenClaw สำหรับโมเดล Claude บน Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-06-27T17:59:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f772c9a5bf1edd6a270b7ba5e6d695290fe96648c9ac38d0bc90bb1504f50cd7
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin ผู้ให้บริการ OpenClaw Anthropic Vertex สำหรับโมเดล Claude บน Google Vertex AI

## การจัดจำหน่าย

- แพ็กเกจ: `@openclaw/anthropic-vertex-provider`
- เส้นทางการติดตั้ง: npm; ClawHub

## พื้นผิว

providers: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

ใช้ `anthropic-vertex/claude-fable-5` ในกรณีที่โมเดลพร้อมใช้งานในภูมิภาค Google Cloud ของคุณ
Fable 5 ใช้การคิดแบบปรับตัวเสมอ และมีค่าเริ่มต้นเป็นระดับความพยายาม `high` `/think off` และ
`/think minimal` ใช้ระดับความพยายาม `low` เพราะโมเดลไม่รองรับการปิดใช้งานการคิด

<!-- openclaw-plugin-reference:manual-end -->
