---
read_when:
    - أنت تثبّت أو تهيّئ أو تدقّق Plugin opencode
summary: يضيف دعم موفّر نماذج OpenCode إلى OpenClaw.
title: Plugin OpenCode
x-i18n:
    generated_at: "2026-07-16T14:41:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aecf396cfc645e4a036b8130ed7f33db9081dffda120c6d06ebe863dd3be3730
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# Plugin OpenCode

يضيف دعم موفّر نماذج OpenCode إلى OpenClaw.

## التوزيع

- الحزمة: `@openclaw/opencode-provider`
- مسار التثبيت: مضمّن في OpenClaw

## السطح

الموفّرون: `opencode`؛ العقود: `mediaUnderstandingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## الجلسات الأصلية

يكتشف OpenClaw تلقائيًا CLI ‏`opencode` على Gateway والعُقد المقترنة. ثم تظهر
الجلسات المخزّنة في مجموعة جلسات **OpenCode** بالشريط الجانبي، مع تصفّح
النصوص المنسوخة للقراءة فقط عبر الأمرين الرسميين `opencode --pure db ... --format json`
و`opencode --pure export`. تمنع البيئة المقيّدة ووضع `--pure`
تصفّح الكتالوج من تحميل Plugins المشروع أو وراثة بيانات اعتماد
Gateway غير ذات الصلة.

عطّل **كتالوج جلسات OpenCode** ضمن **الإعدادات > Plugins > OpenCode**
لتعطيل الاكتشاف. وهو مفعّل افتراضيًا.

<!-- openclaw-plugin-reference:manual-end -->

## الوثائق ذات الصلة

- [opencode](/ar/providers/opencode)
