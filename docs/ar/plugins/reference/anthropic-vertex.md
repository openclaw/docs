---
read_when:
    - أنت تثبّت Plugin anthropic-vertex أو تهيئه أو تدقّق فيه
summary: Plugin موفّر Anthropic Vertex في OpenClaw لنماذج Claude على Google Vertex AI.
title: Plugin ‏Anthropic Vertex
x-i18n:
    generated_at: "2026-07-16T14:38:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bd73b80b4e49a85cd6b1d8e47df6bf8d2d791c36a677124112f299027bfd9af5
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin ‏Anthropic Vertex

Plugin موفّر Anthropic Vertex في OpenClaw لنماذج Claude على Google Vertex AI.

## التوزيع

- الحزمة: `@openclaw/anthropic-vertex-provider`
- مسار التثبيت: npm؛ ClawHub

## الواجهة

الموفّرون: `anthropic-vertex`

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

استخدم `anthropic-vertex/claude-fable-5` حيث يتوفر النموذج في منطقتك على Google Cloud.
يستخدم Fable 5 دائمًا التفكير التكيفي، ويكون مستوى الجهد الافتراضي `high`. يستخدم `/think off` و
`/think minimal` مستوى الجهد `low` لأن النموذج لا يدعم تعطيل التفكير.

## Claude Sonnet 5

استخدم `anthropic-vertex/claude-sonnet-5` مع نقطة نهاية Vertex ‏`global` أو `us` أو `eu`.
يكون التفكير التكيفي الافتراضي في Sonnet 5 عند مستوى الجهد `high`، كما يدعم
`/think off` أو المستويات الأصلية `/think xhigh|max`. ينشر OpenClaw تلقائيًا
نافذة السياق الخاصة به بسعة 1,000,000 رمز مميز وحد الإخراج البالغ 128,000 رمز مميز.

تتبع أسعار الكتالوج السعر العالمي التمهيدي لخدمة Vertex، والبالغ `$2/$10` لكل
مليون رمز مميز للإدخال/الإخراج حتى 31 أغسطس 2026، ثم `$3/$15` اعتبارًا من
1 سبتمبر. تستخدم نقطتا النهاية متعددتا المناطق `us` و`eu` الزيادة الموثقة في أسعار Vertex
والبالغة 10%.

<!-- openclaw-plugin-reference:manual-end -->
