---
read_when:
    - تُجري إعداد التشغيل الأول دون إكمال التهيئة الكاملة عبر CLI
    - تريد تعيين المسار الافتراضي لمساحة العمل
summary: مرجع CLI لـ `openclaw setup` (تهيئة التكوين + مساحة العمل)
title: الإعداد
x-i18n:
    generated_at: "2026-05-06T17:55:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a47d41f8c6c59395eaa4bc6055fa09f863af819c7920e29969793904180c910
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

هيّئ `~/.openclaw/openclaw.json` ومساحة عمل الوكيل.

<Note>
`openclaw setup` مخصص لتثبيتات الإعدادات القابلة للتغيير. في وضع Nix (`OPENCLAW_NIX_MODE=1`)، يرفض OpenClaw عمليات كتابة الإعداد لأن ملف الإعدادات مُدار بواسطة Nix. يجب على الوكلاء استخدام [البدء السريع لـ nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) الرسمي أو إعدادات المصدر المكافئة لحزمة Nix أخرى.
</Note>

ذو صلة:

- البدء: [البدء](/ar/start/getting-started)
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

- `--workspace <dir>`: دليل مساحة عمل الوكيل (يُخزّن كـ `agents.defaults.workspace`)
- `--wizard`: تشغيل الإعداد الأولي
- `--non-interactive`: تشغيل الإعداد الأولي دون مطالبات
- `--mode <local|remote>`: وضع الإعداد الأولي
- `--import-from <provider>`: موفّر الترحيل الذي سيتم تشغيله أثناء الإعداد الأولي
- `--import-source <path>`: مجلد الوكيل المصدر لـ `--import-from`
- `--import-secrets`: استيراد الأسرار المدعومة أثناء ترحيل الإعداد الأولي
- `--remote-url <url>`: عنوان URL لـ WebSocket الخاص بـ Gateway البعيد
- `--remote-token <token>`: رمز Gateway البعيد

لتشغيل الإعداد الأولي عبر setup:

```bash
openclaw setup --wizard
```

ملاحظات:

- يؤدي `openclaw setup` العادي إلى تهيئة الإعدادات + مساحة العمل دون تدفق الإعداد الأولي الكامل.
- بعد الإعداد العادي، شغّل `openclaw configure` لاختيار النماذج والقنوات وGateway وplugins وSkills أو فحوصات السلامة.
- يعمل الإعداد الأولي تلقائيًا عند وجود أي من علامات الإعداد الأولي (`--wizard`، `--non-interactive`، `--mode`، `--import-from`، `--import-source`، `--import-secrets`، `--remote-url`، `--remote-token`).
- إذا تم اكتشاف حالة Hermes، يمكن أن يعرض الإعداد الأولي التفاعلي الترحيل تلقائيًا. يتطلب إعداد الاستيراد الأولي إعدادًا جديدًا؛ استخدم [الترحيل](/ar/cli/migrate) لخطط التشغيل التجريبي والنسخ الاحتياطية ووضع الاستبدال خارج الإعداد الأولي.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [نظرة عامة على التثبيت](/ar/install)
