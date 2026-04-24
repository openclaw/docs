---
read_when:
    - أنت تريد فتح Control UI باستخدام الرمز الحالي الخاص بك
    - أنت تريد طباعة عنوان URL دون تشغيل متصفح
summary: مرجع CLI لـ `openclaw dashboard` (افتح Control UI)
title: لوحة التحكم
x-i18n:
    generated_at: "2026-04-24T07:34:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0864d9c426832ffb9e2acd9d7cb7fc677d859a5b7588132e993a36a5c5307802
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

افتح Control UI باستخدام المصادقة الحالية الخاصة بك.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

ملاحظات:

- يحل `dashboard` مراجع SecretRef المضبوطة في `gateway.auth.token` عندما يكون ذلك ممكنًا.
- بالنسبة إلى الرموز المُدارة عبر SecretRef (المحلولة أو غير المحلولة)، يقوم `dashboard` بطباعة/نسخ/فتح عنوان URL غير مضمّن فيه الرمز لتجنب كشف الأسرار الخارجية في مخرجات الطرفية أو سجل الحافظة أو وسائط تشغيل المتصفح.
- إذا كان `gateway.auth.token` مُدارًا عبر SecretRef لكنه غير محلول في مسار هذا الأمر، فسيقوم الأمر بطباعة عنوان URL غير مضمّن فيه الرمز مع إرشادات معالجة صريحة بدلًا من تضمين عنصر نائب لرمز غير صالح.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Dashboard](/ar/web/dashboard)
