---
read_when:
    - تريد إكمالات shell لـ zsh/bash/fish/PowerShell
    - تحتاج إلى تخزين سكربتات الإكمال مؤقتًا ضمن حالة OpenClaw
summary: مرجع CLI لـ `openclaw completion` (إنشاء/تثبيت سكربتات الإكمال الخاصة بـ shell)
title: الإكمال
x-i18n:
    generated_at: "2026-04-24T07:34:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d064723b97f09105154197e4ef35b98ccb61e4b775f3fd990b18958f751f713
    source_path: cli/completion.md
    workflow: 15
---

# `openclaw completion`

إنشاء سكربتات إكمال shell واختيارياً تثبيتها في ملف تعريف shell الخاص بك.

## الاستخدام

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## الخيارات

- `-s, --shell <shell>`: هدف shell (`zsh` أو `bash` أو `powershell` أو `fish`؛ الافتراضي: `zsh`)
- `-i, --install`: تثبيت الإكمال بإضافة سطر source إلى ملف تعريف shell الخاص بك
- `--write-state`: كتابة سكربت/سكربتات الإكمال إلى `$OPENCLAW_STATE_DIR/completions` من دون الطباعة إلى stdout
- `-y, --yes`: تخطي مطالبات تأكيد التثبيت

## ملاحظات

- يكتب `--install` كتلة صغيرة باسم "OpenClaw Completion" في ملف تعريف shell الخاص بك ويوجهها إلى السكربت المخزن مؤقتًا.
- من دون `--install` أو `--write-state`، يطبع الأمر السكربت إلى stdout.
- يقوم إنشاء الإكمال بتحميل أشجار الأوامر بشكل مسبق حتى يتم تضمين الأوامر الفرعية المتداخلة.

## ذو صلة

- [مرجع CLI](/ar/cli)
