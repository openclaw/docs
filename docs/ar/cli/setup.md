---
read_when:
    - أنت تجري إعداد التشغيل الأول دون عملية التهيئة الكاملة عبر CLI
    - تريد تعيين مسار مساحة العمل الافتراضي
summary: مرجع CLI لـ `openclaw setup` (تهيئة التكوين + مساحة العمل)
title: الإعداد
x-i18n:
    generated_at: "2026-04-30T07:50:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68e5c07a6b1769420c2125677f3eda9bd4841c938b4fc62583c5bed2a2596250
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
- `--wizard`: تشغيل الإعداد الأولي
- `--non-interactive`: تشغيل الإعداد الأولي من دون مطالبات
- `--mode <local|remote>`: وضع الإعداد الأولي
- `--import-from <provider>`: مزوّد الترحيل المراد تشغيله أثناء الإعداد الأولي
- `--import-source <path>`: موطن الوكيل المصدر لـ `--import-from`
- `--import-secrets`: استيراد الأسرار المدعومة أثناء ترحيل الإعداد الأولي
- `--remote-url <url>`: عنوان URL لـ WebSocket الخاص بـ Gateway البعيد
- `--remote-token <token>`: رمز Gateway البعيد

لتشغيل الإعداد الأولي عبر setup:

```bash
openclaw setup --wizard
```

ملاحظات:

- يهيّئ `openclaw setup` العادي الإعدادات + مساحة العمل من دون تدفق الإعداد الأولي الكامل.
- يعمل الإعداد الأولي تلقائيًا عند وجود أي أعلام للإعداد الأولي (`--wizard`، `--non-interactive`، `--mode`، `--import-from`، `--import-source`، `--import-secrets`، `--remote-url`، `--remote-token`).
- إذا اكتُشفت حالة Hermes، يمكن للإعداد الأولي التفاعلي أن يعرض الترحيل تلقائيًا. يتطلب إعداد الاستيراد الأولي إعدادًا جديدًا؛ استخدم [الترحيل](/ar/cli/migrate) لخطط التشغيل التجريبي، والنسخ الاحتياطية، ووضع الاستبدال خارج الإعداد الأولي.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [نظرة عامة على التثبيت](/ar/install)
