---
read_when:
    - تريد مسح الحالة المحلية مع الإبقاء على CLI مثبتًا
    - تريد تنفيذًا تجريبيًا لما سيتم حذفه
summary: مرجع CLI لـ `openclaw reset` (إعادة تعيين الحالة/الإعدادات المحلية)
title: إعادة التعيين
x-i18n:
    generated_at: "2026-04-24T07:35:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4a4aba32fb44905d079bf2a22e582a3affbe9809eac9af237ce3e48da72b42c
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

أعد تعيين الإعدادات/الحالة المحلية (مع الإبقاء على CLI مثبتًا).

الخيارات:

- `--scope <scope>`: ‏`config` أو `config+creds+sessions` أو `full`
- `--yes`: تخطي مطالبات التأكيد
- `--non-interactive`: تعطيل المطالبات؛ ويتطلب `--scope` و`--yes`
- `--dry-run`: طباعة الإجراءات دون إزالة الملفات

أمثلة:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

ملاحظات:

- شغّل `openclaw backup create` أولًا إذا كنت تريد لقطة قابلة للاستعادة قبل إزالة الحالة المحلية.
- إذا حذفت `--scope`، يستخدم `openclaw reset` مطالبة تفاعلية لاختيار ما يجب إزالته.
- يكون `--non-interactive` صالحًا فقط عندما يتم ضبط كل من `--scope` و`--yes`.

## ذو صلة

- [مرجع CLI](/ar/cli)
