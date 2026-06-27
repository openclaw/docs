---
read_when:
    - أنت تثبّت أو تهيّئ أو تدقّق Plugin codex-supervisor
summary: أشرف على جلسات خادم تطبيق Codex من OpenClaw.
title: Plugin مشرف Codex
x-i18n:
    generated_at: "2026-06-27T18:11:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d0791cf6aab23cb3ac14949742735ac45ac9210c608890048e9e3edc4dd9a5
    source_path: plugins/reference/codex-supervisor.md
    workflow: 16
---

# Plugin مشرف Codex

أشرف على جلسات خادم تطبيق Codex من OpenClaw.

## التوزيع

- الحزمة: `@openclaw/codex-supervisor`
- مسار التثبيت: مضمّن في OpenClaw

## السطح

العقود: الأدوات

<!-- openclaw-plugin-reference:manual-start -->

## سرد الجلسات

يقتصر `codex_sessions_list` افتراضيًا على جلسات Codex المحمّلة فقط. اضبط `include_stored` لتضمين السجل المخزّن؛ يستخدم الPlugin مسار السرد المعتمد فقط على قاعدة بيانات الحالة في خادم تطبيق Codex ويحدّ النتائج المخزّنة عند 200 افتراضيًا. مرّر `max_stored_sessions` لخفض ذلك الحد أو رفعه، حتى 1000.

<!-- openclaw-plugin-reference:manual-end -->
