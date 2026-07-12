---
read_when:
    - تريد إزالة خدمة Gateway و/أو الحالة المحلية
    - تريد إجراء تشغيل تجريبي أولًا
summary: مرجع CLI للأمر `openclaw uninstall` (إزالة خدمة Gateway والبيانات المحلية)
title: إلغاء التثبيت
x-i18n:
    generated_at: "2026-07-12T05:48:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

أزِل خدمة Gateway و/أو البيانات المحلية. لا تتم إزالة CLI نفسها؛ أزِل تثبيتها عبر npm/pnpm بشكل منفصل.

## الخيارات

| العلامة             | الافتراضي | الوصف                                                     |
| ------------------- | --------- | --------------------------------------------------------- |
| `--service`         | `false`   | إزالة خدمة Gateway.                                       |
| `--state`           | `false`   | إزالة الحالة والإعدادات.                                  |
| `--workspace`       | `false`   | إزالة أدلة مساحات العمل.                                  |
| `--app`             | `false`   | إزالة تطبيق macOS.                                        |
| `--all`             | `false`   | اختصار لـ `--service --state --workspace --app`.          |
| `--yes`             | `false`   | تخطي مطالبات التأكيد.                                     |
| `--non-interactive` | `false`   | تعطيل المطالبات؛ يتطلب `--yes`.                           |
| `--dry-run`         | `false`   | طباعة الإجراءات المخططة دون إزالة الملفات.                |

عند عدم تحديد علامات النطاق، تظهر مطالبة تفاعلية متعددة التحديد لاختيار المكونات المراد إزالتها (مع تحديد الخدمة والحالة ومساحة العمل مسبقًا افتراضيًا).

## أمثلة

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## ملاحظات

- شغّل `openclaw backup create` أولًا لإنشاء لقطة قابلة للاستعادة قبل إزالة الحالة أو مساحات العمل.
- يحافظ `--state` على أدلة مساحات العمل المُعدّة ما لم يُحدَّد `--workspace` أيضًا.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [إلغاء التثبيت](/ar/install/uninstall)
