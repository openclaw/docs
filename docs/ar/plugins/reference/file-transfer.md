---
read_when:
    - أنت تثبّت أو تهيّئ أو تدقّق Plugin نقل الملفات
summary: اجلب الملفات واعرضها واكتبها على العُقد المقترنة عبر أوامر مخصصة للعُقد. يتجاوز اقتطاع المخرجات القياسية لـ bash باستخدام base64 عبر node.invoke للملفات الثنائية التي يصل حجمها إلى 16 MB.
title: Plugin نقل الملفات
x-i18n:
    generated_at: "2026-07-16T14:40:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f76e92a821be53e988011e2fd9dd53b107b43a8191bf4cdf41baaf918a9c5412
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Plugin نقل الملفات

اجلب الملفات واعرضها واكتبها على العُقد المقترنة عبر أوامر مخصصة للعُقد. يتجاوز اقتطاع مخرجات stdout في bash باستخدام base64 عبر node.invoke للملفات الثنائية التي يصل حجمها إلى 16 MB.

## التوزيع

- الحزمة: `@openclaw/file-transfer`
- مسار التثبيت: مضمن في OpenClaw

## السطح

العقود: `tools`
