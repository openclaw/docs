---
read_when:
    - أنت تجري إعداد التشغيل الأول دون الإعداد التمهيدي الكامل عبر CLI
    - تريد تعيين مسار مساحة العمل الافتراضي
summary: مرجع CLI لـ `openclaw setup` (تهيئة الإعدادات + مساحة العمل)
title: الإعداد
x-i18n:
    generated_at: "2026-05-02T20:43:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805f60c81f5fc216fc446641efe0bcb60bb6c34b3a50a6fc9e767461206e5f90
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

هيّئ `~/.openclaw/openclaw.json` ومساحة عمل الوكيل.

ذات صلة:

- بدء الاستخدام: [بدء الاستخدام](/ar/start/getting-started)
- الإعداد الأولي عبر CLI: [الإعداد الأولي (CLI)](/ar/start/wizard)

## أمثلة

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## الخيارات

- `--workspace <dir>`: دليل مساحة عمل الوكيل (يُخزَّن باسم `agents.defaults.workspace`)
- `--wizard`: شغّل الإعداد الأولي
- `--non-interactive`: شغّل الإعداد الأولي دون مطالبات
- `--mode <local|remote>`: وضع الإعداد الأولي
- `--import-from <provider>`: موفر الترحيل الذي سيُشغَّل أثناء الإعداد الأولي
- `--import-source <path>`: مجلد المنزل للوكيل المصدر لـ `--import-from`
- `--import-secrets`: استورد الأسرار المدعومة أثناء ترحيل الإعداد الأولي
- `--remote-url <url>`: عنوان URL لـ WebSocket الخاص بـ Gateway البعيد
- `--remote-token <token>`: رمز Gateway البعيد

لتشغيل الإعداد الأولي عبر setup:

```bash
openclaw setup --wizard
```

ملاحظات:

- يقوم `openclaw setup` العادي بتهيئة الإعدادات + مساحة العمل دون تدفق الإعداد الأولي الكامل.
- بعد الإعداد العادي، شغّل `openclaw configure` لاختيار النماذج، أو القنوات، أو Gateway، أو plugins، أو Skills، أو فحوصات السلامة.
- يعمل الإعداد الأولي تلقائيًا عند وجود أي من أعلام الإعداد الأولي (`--wizard`، `--non-interactive`، `--mode`، `--import-from`، `--import-source`، `--import-secrets`، `--remote-url`، `--remote-token`).
- إذا اكتُشفت حالة Hermes، يمكن للإعداد الأولي التفاعلي أن يعرض الترحيل تلقائيًا. يتطلب إعداد الاستيراد الأولي إعدادًا جديدًا؛ استخدم [الترحيل](/ar/cli/migrate) لخطط التشغيل التجريبي والنسخ الاحتياطية ووضع الاستبدال خارج الإعداد الأولي.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [نظرة عامة على التثبيت](/ar/install)
