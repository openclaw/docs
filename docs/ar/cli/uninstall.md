---
read_when:
    - تريد إزالة خدمة Gateway و/أو الحالة المحلية
    - تريد تشغيلًا تجريبيًا أولًا
summary: مرجع CLI لـ `openclaw uninstall` (إزالة خدمة Gateway + البيانات المحلية)
title: إلغاء التثبيت
x-i18n:
    generated_at: "2026-04-24T07:36:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: b774fc006e989068b9126aff2a72888fd808a2e0e3d5ea8b57e6ab9d9f1b63ee
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

ألغِ تثبيت خدمة Gateway + البيانات المحلية (يبقى CLI).

الخيارات:

- `--service`: إزالة خدمة Gateway
- `--state`: إزالة الحالة والتهيئة
- `--workspace`: إزالة دلائل workspace
- `--app`: إزالة تطبيق macOS
- `--all`: إزالة الخدمة والحالة وworkspace والتطبيق
- `--yes`: تخطّي مطالبات التأكيد
- `--non-interactive`: تعطيل المطالبات؛ ويتطلب `--yes`
- `--dry-run`: طباعة الإجراءات دون إزالة الملفات

أمثلة:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

ملاحظات:

- شغّل `openclaw backup create` أولًا إذا كنت تريد لقطة قابلة للاستعادة قبل إزالة الحالة أو مساحات العمل.
- `--all` اختصار لإزالة الخدمة والحالة وworkspace والتطبيق معًا.
- يتطلب `--non-interactive` استخدام `--yes`.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [إلغاء التثبيت](/ar/install/uninstall)
