---
read_when:
    - أنت تثبّت أو تهيّئ أو تدقّق Plugin anthropic-vertex
summary: Plugin موفّر Anthropic Vertex في OpenClaw لنماذج Claude على Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-06-27T18:10:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f772c9a5bf1edd6a270b7ba5e6d695290fe96648c9ac38d0bc90bb1504f50cd7
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin موفّر OpenClaw Anthropic Vertex لنماذج Claude على Google Vertex AI.

## التوزيع

- الحزمة: `@openclaw/anthropic-vertex-provider`
- مسار التثبيت: npm؛ ClawHub

## السطح

providers: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

استخدم `anthropic-vertex/claude-fable-5` حيث يكون النموذج متاحًا في منطقة Google Cloud الخاصة بك.
يستخدم Fable 5 دائمًا التفكير التكيفي ويضبط افتراضيًا مستوى الجهد على `high`. يستخدم `/think off` و
`/think minimal` مستوى الجهد `low` لأن النموذج لا يدعم تعطيل التفكير.

<!-- openclaw-plugin-reference:manual-end -->
