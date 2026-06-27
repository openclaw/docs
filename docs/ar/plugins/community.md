---
doc-schema-version: 1
read_when:
    - تريد العثور على إضافات OpenClaw تابعة لجهات خارجية
    - تريد نشر Plugin خاص بك أو إدراجه على ClawHub
summary: اعثر على Plugins OpenClaw التي يصونها المجتمع وانشرها
title: إضافات المجتمع
x-i18n:
    generated_at: "2026-06-27T18:03:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ecf059fa0c32f09d09381b2153a6a63ca522d49719aaa8476209389a6b5b36a
    source_path: plugins/community.md
    workflow: 16
---

Plugins المجتمع هي حزم تابعة لأطراف ثالثة توسّع OpenClaw بقنوات،
وأدوات، ومزوّدين، وخطافات، أو قدرات أخرى. استخدم [ClawHub](/ar/clawhub) كسطح
الاكتشاف الأساسي لـ Plugins المجتمع العامة.

## العثور على Plugins

ابحث في ClawHub من CLI:

```bash
openclaw plugins search "calendar"
```

ثبّت Plugin من ClawHub باستخدام بادئة مصدر صريحة:

```bash
openclaw plugins install clawhub:<package-name>
```

يبقى npm مسار تثبيت مباشرًا مدعومًا أثناء انتقال الإطلاق:

```bash
openclaw plugins install npm:<package-name>
```

استخدم [إدارة Plugins](/ar/plugins/manage-plugins) للاطلاع على أمثلة شائعة للتثبيت، والتحديث،
والفحص، وإلغاء التثبيت. استخدم [`openclaw plugins`](/ar/cli/plugins) للاطلاع على
مرجع الأوامر الكامل وقواعد اختيار المصدر.

## نشر Plugins

انشر Plugins المجتمع العامة على ClawHub عندما تريد أن يكتشفها مستخدمو OpenClaw
ويثبّتوها. يدير ClawHub قائمة الحزم الحية، وسجل الإصدارات،
وحالة الفحص، وتلميحات التثبيت؛ ولا تحتفظ الوثائق بفهرس ثابت
لـ Plugins الأطراف الثالثة.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

قبل النشر، تأكّد من أن Plugin يحتوي على بيانات وصفية للحزمة، وبيان Plugin،
ووثائق إعداد، ومالك صيانة واضح. يتحقق ClawHub من نطاق المالك،
واسم الحزمة، والإصدار، وحدود الملفات، والبيانات الوصفية للمصدر قبل أن ينشئ
إصدارًا، ثم يبقي الإصدارات الجديدة مخفية عن أسطح التثبيت والتنزيل
العادية حتى يكتمل الاستعراض والتحقق.

استخدم قائمة التحقق هذه قبل النشر:

| المتطلب             | السبب                                                |
| ------------------- | ---------------------------------------------------- |
| منشور على ClawHub   | يحتاج المستخدمون إلى أن تعمل تلميحات `openclaw plugins install` |
| مستودع GitHub عام   | مراجعة المصدر، وتتبع المشكلات، والشفافية              |
| وثائق الإعداد والاستخدام | يحتاج المستخدمون إلى معرفة كيفية تكوينه              |
| صيانة نشطة          | تحديثات حديثة أو تعامل متجاوب مع المشكلات            |

استخدم هذه الصفحات للاطلاع على عقد النشر الكامل:

- تشرح [النشر على ClawHub](/ar/clawhub/publishing) المالكين، والنطاقات، والإصدارات،
  والاستعراض، والتحقق من الحزم، ونقل الحزم.
- تعرض [بناء Plugins](/ar/plugins/building-plugins) شكل حزمة Plugin
  وسير عمل النشر الأول.
- يعرّف [بيان Plugin](/ar/plugins/manifest) حقول بيان Plugin الأصلية.

## ذات صلة

- [Plugins](/ar/tools/plugin) - التثبيت، والتكوين، وإعادة التشغيل، واستكشاف الأخطاء وإصلاحها
- [إدارة Plugins](/ar/plugins/manage-plugins) - أمثلة أوامر
- [النشر على ClawHub](/ar/clawhub/publishing) - قواعد النشر والإصدار
