---
read_when:
    - تريد مسح الحالة المحلية مع إبقاء CLI مثبتًا
    - تريد إجراء تشغيل تجريبي لمعرفة ما ستتم إزالته
summary: مرجع CLI للأمر `openclaw reset` (إعادة تعيين الحالة/الإعدادات المحلية)
title: إعادة التعيين
x-i18n:
    generated_at: "2026-07-12T05:47:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

إعادة ضبط الإعدادات/الحالة المحلية (مع إبقاء CLI مثبتًا).

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## الخيارات

- `--scope <scope>`:‏ `config` أو `config+creds+sessions` أو `full`
- `--yes`: تخطي مطالبات التأكيد
- `--non-interactive`: تعطيل المطالبات؛ يتطلب `--scope` و`--yes`
- `--dry-run`: طباعة الإجراءات دون إزالة الملفات

## النطاقات

| النطاق                  | ما تتم إزالته                                                                                                      | إيقاف Gateway أولًا |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------- |
| `config`                | ملف الإعدادات فقط                                                                                                  | لا                  |
| `config+creds+sessions` | ملف الإعدادات، ودليل OAuth/بيانات الاعتماد، وأدلة الجلسات الخاصة بكل وكيل                                          | نعم                 |
| `full`                  | دليل الحالة (بما في ذلك الإعدادات/بيانات الاعتماد إذا كانت متداخلة داخله)، بالإضافة إلى أدلة مساحة العمل وإثباتاتها | نعم                 |

يوقف النطاقان `config+creds+sessions` و`full` خدمة Gateway مُدارة قيد التشغيل قبل حذف الحالة.

## ملاحظات

- شغّل `openclaw backup create` أولًا لإنشاء لقطة قابلة للاستعادة قبل إزالة الحالة المحلية.
- عند عدم تحديد `--scope`، يطالبك `openclaw reset` تفاعليًا باختيار النطاق المراد إزالته.
- لا يكون `--non-interactive` صالحًا إلا عند تعيين كل من `--scope` و`--yes`.
- يطبع النطاقان `config+creds+sessions` و`full` العبارة `Next: openclaw onboard --install-daemon` عند الانتهاء.

## ذو صلة

- [مرجع CLI](/ar/cli)
