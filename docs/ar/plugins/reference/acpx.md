---
read_when:
    - أنت تثبّت Plugin ‏acpx أو تهيّئه أو تدقّق فيه
summary: واجهة خلفية لبيئة تشغيل ACP في OpenClaw مع إدارة الجلسات والنقل المملوكة للـ Plugin.
title: Plugin ACPx
x-i18n:
    generated_at: "2026-07-16T14:47:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9816ca3ada81eb44883b641f3d761b76f894bd83c8aa978c516125c77842f664
    source_path: plugins/reference/acpx.md
    workflow: 16
---

# plugin ACPx

واجهة خلفية لوقت تشغيل ACP في OpenClaw مع إدارة الجلسات والنقل المملوكة للـ plugin.

## التوزيع

- الحزمة: `@openclaw/acpx`
- مسار التثبيت: npm؛ ClawHub

## الواجهة

المهارات

<!-- openclaw-plugin-reference:manual-start -->

## جلسات Pi الأصلية

يكتشف وقت التشغيل المضمّن تلقائيًا مخزن جلسات Pi على Gateway والعُقد
المقترنة. تظهر الجلسات المخزنة في مجموعة الشريط الجانبي للجلسات **Pi**، مع
تصفح النصوص المسجلة للقراءة فقط من تنسيق جلسات JSONL الموثق لدى Pi. يراعي
الكتالوج أدلة الجلسات `settings.json` على مستوى المشروع والمستوى العام، بالإضافة إلى
`PI_CODING_AGENT_DIR` و`PI_CODING_AGENT_SESSION_DIR`. تُحلّ المسارات النسبية
انطلاقًا من الدليل الذي يحتوي على ملف `settings.json` الخاص بها.

عطّل **Pi Session Catalog** ضمن **Config > Plugins > ACPX Runtime**
لتعطيل الاكتشاف. وهو مفعّل افتراضيًا.

<!-- openclaw-plugin-reference:manual-end -->

## الوثائق ذات الصلة

- [acpx](/ar/tools/acp-agents-setup)
