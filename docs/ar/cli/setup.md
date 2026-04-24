---
read_when:
    - أنت بصدد إجراء الإعداد الأولي من دون المرور بعملية الإعداد التفاعلي الكاملة في CLI
    - أنت تريد تعيين مسار مساحة العمل الافتراضي
summary: مرجع CLI لـ `openclaw setup` (تهيئة الإعداد + مساحة العمل)
title: الإعداد
x-i18n:
    generated_at: "2026-04-24T07:36:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 650b0faf99ef1bc24ec6514661093a9a2ba7edead2e2622b863d51553c44f267
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

هيّئ `~/.openclaw/openclaw.json` ومساحة عمل الوكيل.

ذو صلة:

- البدء: [بدء الاستخدام](/ar/start/getting-started)
- الإعداد التفاعلي في CLI: [Onboarding (CLI)](/ar/start/wizard)

## أمثلة

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## الخيارات

- `--workspace <dir>`: دليل مساحة عمل الوكيل (يُخزَّن كـ `agents.defaults.workspace`)
- `--wizard`: تشغيل الإعداد التفاعلي
- `--non-interactive`: تشغيل الإعداد التفاعلي دون مطالبات
- `--mode <local|remote>`: وضع الإعداد التفاعلي
- `--remote-url <url>`: عنوان URL الخاص بـ Gateway WebSocket البعيدة
- `--remote-token <token>`: رمز Gateway البعيدة

لتشغيل الإعداد التفاعلي عبر setup:

```bash
openclaw setup --wizard
```

ملاحظات:

- يقوم `openclaw setup` العادي بتهيئة الإعداد + مساحة العمل من دون تدفق الإعداد التفاعلي الكامل.
- يتم تشغيل الإعداد التفاعلي تلقائيًا عند وجود أي من أعلام الإعداد التفاعلي (`--wizard` أو `--non-interactive` أو `--mode` أو `--remote-url` أو `--remote-token`).

## ذو صلة

- [مرجع CLI](/ar/cli)
- [نظرة عامة على التثبيت](/ar/install)
