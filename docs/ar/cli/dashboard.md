---
read_when:
    - تريد فتح واجهة التحكم باستخدام رمزك الحالي
    - تريد طباعة URL دون تشغيل متصفح
summary: مرجع CLI لـ `openclaw dashboard` (افتح واجهة التحكم)
title: لوحة المعلومات
x-i18n:
    generated_at: "2026-05-05T01:44:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51b3326b3884013ebcf570b417e66efe62ea89dcdedb5ab3173f39fb021de89f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

افتح واجهة التحكم باستخدام مصادقتك الحالية.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

ملاحظات:

- يحل `dashboard` مراجع SecretRefs الخاصة بـ `gateway.auth.token` المهيأة عندما يكون ذلك ممكنًا.
- يتبع `dashboard` إعداد `gateway.tls.enabled`: تطبع/تفتح بوابات Gateway المفعّل فيها TLS
  عناوين URL لواجهة التحكم بصيغة `https://` وتتصل عبر `wss://`.
- إذا فشل التسليم إلى الحافظة/المتصفح لعنوان URL للوحة تحكم مصادَق عليه برمز مميز،
  يسجل `dashboard` تلميحًا آمنًا للمصادقة اليدوية يذكر `OPENCLAW_GATEWAY_TOKEN`،
  و`gateway.auth.token`، ومفتاح الجزء `token` من دون طباعة قيمة الرمز
  المميز.
- بالنسبة إلى الرموز المميزة المُدارة بواسطة SecretRef (سواء جرى حلها أم لا)، يطبع/ينسخ/يفتح `dashboard` عنوان URL غير متضمن لرمز مميز لتجنب كشف الأسرار الخارجية في مخرجات الطرفية، أو سجل الحافظة، أو وسائط تشغيل المتصفح.
- إذا كان `gateway.auth.token` مُدارًا بواسطة SecretRef لكن لم يُحل في مسار هذا الأمر، يطبع الأمر عنوان URL غير متضمن لرمز مميز وإرشادات إصلاح صريحة بدلًا من تضمين عنصر نائب لرمز مميز غير صالح.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [لوحة التحكم](/ar/web/dashboard)
