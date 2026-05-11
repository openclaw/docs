---
read_when:
    - تريد أن يستخدم وكلاء OpenClaw بوضع Codex إضافات Codex الأصلية
    - أنت تنقل Plugins Codex المنسّقة من OpenAI والمثبّتة من المصدر
    - أنت تستكشف أخطاء `codexPlugins` أو مخزون التطبيقات أو الإجراءات التدميرية أو تشخيصات تطبيقات Plugin وتحلّها
summary: تهيئة Plugins Codex الأصلية المُرحَّلة لوكلاء OpenClaw في وضع Codex
title: إضافات Codex الأصلية
x-i18n:
    generated_at: "2026-05-11T20:37:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64e8f552e65b3f1c1c62bc1ba1abfc1bf592d1bdc7fbbe2a484f3eb9955159f0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

دعم Plugin الأصلي في Codex يتيح لوكيل OpenClaw بوضع Codex استخدام قدرات التطبيق وPlugin الخاصة بـ Codex
app-server داخل سلسلة Codex نفسها التي
تتعامل مع دورة OpenClaw.

لا يترجم OpenClaw Plugins الخاصة بـ Codex إلى أدوات ديناميكية اصطناعية من نوع `codex_plugin_*`
في OpenClaw. تبقى استدعاءات Plugin في سجل Codex الأصلي، ويتولى
Codex app-server تنفيذ MCP المدعوم بالتطبيق.

استخدم هذه الصفحة بعد أن يكون [Codex harness](/ar/plugins/codex-harness) الأساسي يعمل.

## المتطلبات

- يجب أن يكون وقت تشغيل وكيل OpenClaw المحدد هو Codex harness الأصلي.
- يجب أن تكون `plugins.entries.codex.enabled` مضبوطة على true.
- يجب أن تكون `plugins.entries.codex.config.codexPlugins.enabled` مضبوطة على true.
- يدعم V1 فقط Plugins من `openai-curated` التي لاحظتها عملية الترحيل على أنها
  مثبتة من المصدر في موطن Codex المصدر.
- يجب أن يكون Codex app-server الهدف قادرا على رؤية السوق المتوقع،
  وPlugin، ومخزون التطبيقات.

ليس لـ `codexPlugins` أي تأثير على عمليات PI، أو عمليات مزود OpenAI العادية، أو ارتباطات محادثة ACP
، أو harnesses الأخرى لأن تلك المسارات لا تنشئ
سلاسل Codex app-server بإعدادات `apps` الأصلية.

## البدء السريع

عاين الترحيل من موطن Codex المصدر:

```bash
openclaw migrate codex --dry-run
```

طبّق الترحيل عندما تبدو الخطة صحيحة:

```bash
openclaw migrate apply codex --yes
```

يكتب الترحيل إدخالات `codexPlugins` صريحة لـ Plugins المؤهلة ويستدعي
`plugin/install` في Codex app-server لـ Plugins المحددة. يبدو
إعداد مرحّل نموذجي كما يلي:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

بعد تغيير `codexPlugins`، استخدم `/new` أو `/reset` أو أعد تشغيل Gateway حتى
تبدأ جلسات Codex harness المستقبلية بمجموعة التطبيقات المحدثة.

## كيفية عمل إعداد Plugin الأصلي

للتكامل ثلاث حالات منفصلة:

- مثبت: يمتلك Codex حزمة Plugin المحلية في وقت تشغيل app-server الهدف.
- مفعّل: إعداد OpenClaw مستعد لإتاحة Plugin لدورات Codex
  harness.
- قابل للوصول: يؤكد Codex app-server أن إدخالات تطبيقات Plugin متاحة
  للحساب النشط ويمكن ربطها بهوية Plugin المرحّلة.

الترحيل هو خطوة التثبيت/الأهلية الدائمة. ومخزون التطبيقات في وقت التشغيل هو
فحص قابلية الوصول. ثم يحسب إعداد جلسة Codex harness إعداد تطبيقات سلسلة
مقيّدا لتطبيقات Plugin المفعّلة والقابلة للوصول.

يتم حساب إعداد تطبيقات السلسلة عندما ينشئ OpenClaw جلسة Codex harness
أو يستبدل ارتباط سلسلة Codex قديما. لا يعاد حسابه في كل دورة.

## حدود دعم V1

V1 ضيق عمدا:

- فقط Plugins من `openai-curated` التي كانت مثبتة مسبقا في مخزون Codex
  app-server المصدر مؤهلة للترحيل.
- يكتب الترحيل هويات Plugin صريحة باستخدام `marketplaceName` و
  `pluginName`؛ ولا يكتب مسارات ذاكرة التخزين المؤقت المحلية `marketplacePath`.
- `codexPlugins.enabled` هو مفتاح التفعيل العام.
- لا يوجد حرف بدل `plugins["*"]` ولا مفتاح إعداد يمنح صلاحية تثبيت
  عشوائية.
- يتم الاحتفاظ بالأسواق غير المدعومة، وحزم Plugin المخزنة مؤقتا، والخطافات، وملفات إعدادات Codex
  في تقرير الترحيل للمراجعة اليدوية.

## مخزون التطبيقات والملكية

يقرأ OpenClaw مخزون تطبيقات Codex عبر `app/list` في app-server، ويخزنه مؤقتا لمدة
ساعة واحدة، ويحدّث الإدخالات القديمة أو المفقودة بشكل غير متزامن.

لا يتم عرض تطبيق Plugin إلا عندما يستطيع OpenClaw ربطه مرة أخرى بـ Plugin المرحّل
من خلال ملكية مستقرة:

- معرّف التطبيق الدقيق من تفاصيل Plugin
- اسم خادم MCP معروف
- بيانات وصفية مستقرة وفريدة

تُستبعد الملكية المعتمدة على اسم العرض فقط أو الملكية الغامضة إلى أن يثبت تحديث المخزون
التالي الملكية.

## إعداد تطبيقات السلسلة

يحقن OpenClaw تصحيح `config.apps` مقيّدا لسلسلة Codex:
يتم تعطيل `_default` ولا يتم تفعيل إلا التطبيقات المملوكة لـ Plugins مرحّلة ومفعّلة.

يضبط OpenClaw `destructive_enabled` على مستوى التطبيق من السياسة العامة أو
الخاصة بـ Plugin الفعالة لـ `allow_destructive_actions` ويترك لـ Codex فرض
بيانات تعريف الأدوات التدميرية من تعليقات أدوات التطبيق الأصلية. يتم تعطيل إعداد تطبيق `_default`
باستخدام `open_world_enabled: false`. تُصدر تطبيقات Plugin المفعّلة
باستخدام `open_world_enabled: true`؛ لا يعرّض OpenClaw مفتاح سياسة
open-world منفصلا لـ Plugin ولا يحتفظ بقوائم رفض لأسماء الأدوات التدميرية
لكل Plugin.

وضع الموافقة على الأدوات تلقائي افتراضيا لتطبيقات Plugin بحيث يمكن تشغيل أدوات القراءة غير التدميرية
من دون واجهة موافقة في السلسلة نفسها. تبقى الأدوات التدميرية
خاضعة لسياسة `destructive_enabled` الخاصة بكل تطبيق.

## سياسة الإجراءات التدميرية

تفشل طلبات Plugin التدميرية بإغلاق آمن افتراضيا:

- القيمة الافتراضية العامة لـ `allow_destructive_actions` هي `false`.
- تتجاوز `allow_destructive_actions` الخاصة بكل Plugin السياسة العامة لذلك
  Plugin.
- عندما تكون السياسة `false`، يعيد OpenClaw رفضا حتميا.
- عندما تكون السياسة `true`، يقبل OpenClaw تلقائيا فقط المخططات الآمنة التي يستطيع ربطها
  باستجابة موافقة، مثل حقل موافقة منطقي.
- يؤدي غياب هوية Plugin، أو غموض الملكية، أو غياب معرّف الدورة، أو معرّف دورة خاطئ
  ، أو مخطط طلب غير آمن إلى الرفض بدلا من المطالبة.

## استكشاف الأخطاء وإصلاحها

**`auth_required`:** ثبّت الترحيل Plugin، لكن أحد تطبيقاته لا يزال
بحاجة إلى مصادقة. يُكتب إدخال Plugin الصريح معطلا حتى تعيد
التفويض وتفعّله.

**`marketplace_missing` أو `plugin_missing`:** لا يستطيع Codex app-server الهدف
رؤية سوق `openai-curated` أو Plugin المتوقع. أعد تشغيل الترحيل
ضد وقت التشغيل الهدف أو افحص حالة Plugin في Codex app-server.

**`app_inventory_missing` أو `app_inventory_stale`:** جاءت جاهزية التطبيق من
ذاكرة تخزين مؤقت فارغة أو قديمة. يجدول OpenClaw تحديثا غير متزامن ويستبعد تطبيقات Plugin
حتى تصبح الملكية والجاهزية معروفتين.

**`app_ownership_ambiguous`:** طابق مخزون التطبيقات اسم العرض فقط، لذلك
لا يتم عرض التطبيق لسلسلة Codex.

**تغير الإعداد لكن الوكيل لا يستطيع رؤية Plugin:** استخدم `/new` أو `/reset` أو
أعد تشغيل Gateway. تحتفظ ارتباطات سلاسل Codex الحالية بإعداد التطبيقات الذي
بدأت به إلى أن ينشئ OpenClaw جلسة harness جديدة أو يستبدل
ارتباطا قديما.

**تم رفض الإجراء التدميري:** تحقق من قيم `allow_destructive_actions` العامة والخاصة بـ Plugin.
حتى عندما تكون السياسة true، لا تزال مخططات الطلب غير الآمنة
وهوية Plugin الغامضة تفشل بإغلاق آمن.

## ذات صلة

- [Codex harness](/ar/plugins/codex-harness)
- [مرجع Codex harness](/ar/plugins/codex-harness-reference)
- [وقت تشغيل Codex harness](/ar/plugins/codex-harness-runtime)
- [مرجع الإعدادات](/ar/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate CLI](/ar/cli/migrate)
