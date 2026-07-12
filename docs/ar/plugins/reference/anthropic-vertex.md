---
read_when:
    - أنت تثبّت Plugin ‏anthropic-vertex أو تهيّئه أو تدقّق فيه
summary: Plugin موفّر Anthropic Vertex لـ OpenClaw لنماذج Claude على Google Vertex AI.
title: Plugin ‏Anthropic Vertex
x-i18n:
    generated_at: "2026-07-12T06:19:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe5500ca56df49c0ef6ccbf39ced71e3fd0b18776ad23716de8575bc6ba64cb8
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin ‏Anthropic Vertex

Plugin موفّر Anthropic Vertex في OpenClaw لنماذج Claude على Google Vertex AI.

## التوزيع

- الحزمة: `@openclaw/anthropic-vertex-provider`
- مسار التثبيت: npm؛ ClawHub

## السطح

الموفّرون: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

استخدم `anthropic-vertex/claude-fable-5` حيثما يكون النموذج متاحًا في منطقة Google Cloud الخاصة بك.
يستخدم Fable 5 دائمًا التفكير التكيفي ويعتمد افتراضيًا مستوى جهد `high`. يستخدم الأمران `/think off`
و`/think minimal` مستوى جهد `low` لأن النموذج لا يدعم تعطيل التفكير.

## Claude Sonnet 5

استخدم `anthropic-vertex/claude-sonnet-5` مع نقطة نهاية Vertex ‏`global` أو `us` أو `eu`.
يعتمد Sonnet 5 افتراضيًا التفكير التكيفي بمستوى جهد `high`، ويدعم
`/think off` أو المستويين الأصليين `/think xhigh|max`. ينشر OpenClaw تلقائيًا
نافذة السياق الخاصة به بسعة 1,000,000 رمز وحدّ الإخراج البالغ 128,000 رمز.

يتبع تسعير الكتالوج السعر العالمي التمهيدي لـ Vertex، والبالغ `$2/$10` لكل
مليون رمز إدخال/إخراج حتى 31 أغسطس 2026، ثم `$3/$15` اعتبارًا من
1 سبتمبر. تستخدم نقطتا النهاية متعددتا المناطق `us` و`eu` الزيادة الموثّقة
من Vertex والبالغة 10%.

<!-- openclaw-plugin-reference:manual-end -->
