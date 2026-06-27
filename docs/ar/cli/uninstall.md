---
read_when:
    - تريد إزالة خدمة Gateway و/أو الحالة المحلية
    - تريد تشغيلًا تجريبيًا أولًا
summary: مرجع CLI لـ `openclaw uninstall` (إزالة خدمة Gateway + البيانات المحلية)
title: إلغاء التثبيت
x-i18n:
    generated_at: "2026-06-27T17:25:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f90fa8cf513e2e8cd422c3b8a880e7fd20fb71131a3ec88260e765daa2ace543
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

ألغِ تثبيت خدمة Gateway + البيانات المحلية (يبقى CLI).

الخيارات:

- `--service`: إزالة خدمة Gateway
- `--state`: إزالة الحالة والتكوين
- `--workspace`: إزالة أدلة مساحة العمل
- `--app`: إزالة تطبيق macOS
- `--all`: إزالة الخدمة والحالة ومساحة العمل والتطبيق
- `--yes`: تخطي مطالبات التأكيد
- `--non-interactive`: تعطيل المطالبات؛ يتطلب `--yes`
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

- شغّل `openclaw backup create` أولاً إذا كنت تريد لقطة قابلة للاستعادة قبل إزالة الحالة أو مساحات العمل.
- يحافظ `--state` على أدلة مساحة العمل المكوّنة ما لم يتم تحديد `--workspace` أيضاً.
- `--all` اختصار لإزالة الخدمة والحالة ومساحة العمل والتطبيق معاً.
- يتطلب `--non-interactive` الخيار `--yes`.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [إلغاء التثبيت](/ar/install/uninstall)
