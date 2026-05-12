---
read_when:
    - تريد أن يستخدم وكلاء OpenClaw بوضع Codex إضافات Codex الأصلية
    - أنت تنقل إضافات Codex المنسّقة من OpenAI والمثبّتة من المصدر
    - أنت تستكشف أخطاء codexPlugins أو جرد التطبيقات أو الإجراءات المدمرة أو تشخيصات تطبيقات Plugin وتصلحها
summary: تكوين Plugins Codex الأصلية المُرحَّلة لوكلاء OpenClaw في وضع Codex
title: Plugins Codex الأصلية
x-i18n:
    generated_at: "2026-05-12T01:00:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4cc1c7b6a97c6eb27eb10a7b14261ecfd398eff58fbd26cc2979a31e6f6a6c4
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

يدعم Plugin الأصلي في Codex السماحَ لوكيل OpenClaw في وضع Codex باستخدام
إمكانات التطبيق والـPlugin الخاصة بـCodex app-server داخل سلسلة Codex نفسها التي
تتعامل مع دورة OpenClaw.

لا يحوّل OpenClaw إضافات Codex إلى أدوات ديناميكية اصطناعية في OpenClaw باسم
`codex_plugin_*`. تبقى استدعاءات Plugin ضمن النص الأصلي في Codex، ويتولى
Codex app-server تنفيذ MCP المدعوم بالتطبيقات.

استخدم هذه الصفحة بعد أن يعمل [حاضن Codex](/ar/plugins/codex-harness) الأساسي.

## المتطلبات

- يجب أن يكون وقت تشغيل وكيل OpenClaw المحدد هو حاضن Codex الأصلي.
- يجب أن تكون `plugins.entries.codex.enabled` مضبوطة على true.
- يجب أن تكون `plugins.entries.codex.config.codexPlugins.enabled` مضبوطة على true.
- يدعم V1 فقط إضافات `openai-curated` التي رصدت الهجرة أنها مثبتة من المصدر
  في موطن Codex المصدر.
- يجب أن يكون Codex app-server الهدف قادراً على رؤية marketplace المتوقع،
  ومخزون الـPlugin والتطبيقات.

لا يؤثر `codexPlugins` في تشغيلات PI، أو تشغيلات مزود OpenAI العادية، أو
ارتباطات محادثات ACP، أو الحاضنات الأخرى، لأن هذه المسارات لا تنشئ سلاسل
Codex app-server بإعدادات `apps` أصلية.

## البدء السريع

عاين الهجرة من موطن Codex المصدر:

```bash
openclaw migrate codex --dry-run
```

طبّق الهجرة عندما تبدو الخطة صحيحة:

```bash
openclaw migrate apply codex --yes
```

تكتب الهجرة إدخالات `codexPlugins` صريحة للإضافات المؤهلة وتستدعي
`plugin/install` في Codex app-server للإضافات المحددة. يبدو إعداد مرحّل نموذجي
كما يلي:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
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

بعد تغيير `codexPlugins`، استخدم `/new` أو `/reset` أو أعد تشغيل Gateway لكي
تبدأ جلسات حاضن Codex المستقبلية بمجموعة التطبيقات المحدّثة.

## كيف يعمل إعداد Plugin الأصلي

يحتوي التكامل على ثلاث حالات منفصلة:

- مثبت: لدى Codex حزمة Plugin المحلية في وقت تشغيل app-server الهدف.
- مفعّل: إعداد OpenClaw مستعد لإتاحة Plugin لدورات حاضن Codex.
- متاح: يؤكد Codex app-server أن إدخالات تطبيقات Plugin متاحة للحساب النشط
  ويمكن ربطها بهوية Plugin المرحّلة.

الهجرة هي خطوة التثبيت والأهلية الدائمة. ومخزون التطبيقات وقت التشغيل هو
فحص الإتاحة. ثم يحسب إعداد جلسة حاضن Codex إعداد تطبيقات مقيّداً للسلسلة
من أجل تطبيقات Plugin المفعّلة والمتاحة.

يُحسب إعداد تطبيقات السلسلة عندما ينشئ OpenClaw جلسة حاضن Codex أو يستبدل
ارتباط سلسلة Codex قديماً. ولا يُعاد حسابه في كل دورة.

## حدود دعم V1

V1 محدود عمداً:

- فقط إضافات `openai-curated` التي كانت مثبتة مسبقاً في مخزون Codex
  app-server المصدر مؤهلة للهجرة.
- تكتب الهجرة هويات Plugin صريحة تتضمن `marketplaceName` و`pluginName`؛
  ولا تكتب مسارات ذاكرة التخزين المؤقت المحلية `marketplacePath`.
- `codexPlugins.enabled` هو مفتاح التفعيل العام.
- لا يوجد حرف بدل `plugins["*"]` ولا مفتاح إعداد يمنح صلاحية تثبيت عشوائية.
- تُحفظ الأسواق غير المدعومة، وحزم Plugin المخزنة مؤقتاً، والخطافات، وملفات
  إعداد Codex في تقرير الهجرة للمراجعة اليدوية.

## مخزون التطبيقات والملكية

يقرأ OpenClaw مخزون تطبيقات Codex عبر `app/list` في app-server، ويخزنه مؤقتاً
لمدة ساعة واحدة، ويحدّث الإدخالات القديمة أو المفقودة بشكل غير متزامن.

لا يُعرض تطبيق Plugin إلا عندما يستطيع OpenClaw ربطه مجدداً بالـPlugin المرحّل
عبر ملكية مستقرة:

- معرّف التطبيق المطابق من تفاصيل Plugin
- اسم خادم MCP معروف
- بيانات وصفية مستقرة وفريدة

تُستبعد الملكية المعتمدة على اسم العرض فقط أو الملكية الغامضة إلى أن يثبت
تحديث المخزون التالي الملكية.

## إعداد تطبيقات السلسلة

يحقن OpenClaw تصحيح `config.apps` مقيّداً لسلسلة Codex:
يُعطّل `_default`، ولا تُفعّل إلا التطبيقات المملوكة لإضافات مرحّلة مفعّلة.

يضبط OpenClaw قيمة `destructive_enabled` على مستوى التطبيق من السياسة العامة
الفعالة أو سياسة `allow_destructive_actions` الخاصة بكل Plugin، ويترك Codex
يفرض بيانات تعريف الأدوات المدمّرة من تعليقات أدوات التطبيقات الأصلية لديه.
يُعطّل إعداد تطبيق `_default` باستخدام `open_world_enabled: false`. وتُصدّر
تطبيقات Plugin المفعّلة مع `open_world_enabled: true`؛ لا يعرّض OpenClaw مفتاح
سياسة منفصلاً للعالم المفتوح الخاص بالـPlugin ولا يحتفظ بقوائم منع لأسماء
الأدوات المدمّرة لكل Plugin.

وضع اعتماد الأدوات تلقائي افتراضياً لتطبيقات Plugin حتى تتمكن أدوات القراءة
غير المدمّرة من العمل من دون واجهة اعتماد داخل السلسلة نفسها. وتظل الأدوات
المدمّرة محكومة بسياسة `destructive_enabled` لكل تطبيق.

## سياسة الإجراءات المدمّرة

تُسمح استدعاءات Plugin المدمّرة افتراضياً لإضافات Codex المرحّلة، بينما تفشل
المخططات غير الآمنة والملكية الغامضة بشكل مغلق:

- القيمة الافتراضية العامة لـ`allow_destructive_actions` هي `true`.
- تتجاوز قيمة `allow_destructive_actions` لكل Plugin السياسة العامة لذلك
  الـPlugin.
- عندما تكون السياسة `false`، يعيد OpenClaw رفضاً حتمياً.
- عندما تكون السياسة `true`، يقبل OpenClaw تلقائياً فقط المخططات الآمنة التي
  يمكنه ربطها برد اعتماد، مثل حقل موافقة منطقي.
- تؤدي هوية Plugin المفقودة، أو الملكية الغامضة، أو معرّف الدورة المفقود، أو
  معرّف الدورة الخاطئ، أو مخطط الاستدعاء غير الآمن إلى الرفض بدلاً من طلب
  تأكيد.

## استكشاف الأخطاء وإصلاحها

**`auth_required`:** ثبّتت الهجرة Plugin، لكن أحد تطبيقاته ما زال يحتاج إلى
مصادقة. يُكتب إدخال Plugin الصريح معطلاً إلى أن تعيد التفويض وتفعّله.

**`marketplace_missing` أو `plugin_missing`:** لا يستطيع Codex app-server الهدف
رؤية marketplace أو Plugin المتوقع ضمن `openai-curated`. أعد تشغيل الهجرة على
وقت التشغيل الهدف أو افحص حالة Plugin في Codex app-server.

**`app_inventory_missing` أو `app_inventory_stale`:** جاءت جاهزية التطبيق من
ذاكرة تخزين مؤقت فارغة أو قديمة. يجدول OpenClaw تحديثاً غير متزامن ويستبعد
تطبيقات Plugin إلى أن تُعرف الملكية والجاهزية.

**`app_ownership_ambiguous`:** لم يطابق مخزون التطبيقات إلا اسم العرض، لذلك
لا يُعرض التطبيق لسلسلة Codex.

**تغيّر الإعداد لكن الوكيل لا يرى Plugin:** استخدم `/new` أو `/reset` أو أعد
تشغيل Gateway. تحتفظ ارتباطات سلاسل Codex الحالية بإعدادات التطبيقات التي
بدأت بها إلى أن ينشئ OpenClaw جلسة حاضن جديدة أو يستبدل ارتباطاً قديماً.

**رُفض الإجراء المدمّر:** تحقق من القيم العامة والخاصة بكل Plugin في
`allow_destructive_actions`. حتى عندما تكون السياسة true، تظل مخططات الاستدعاء
غير الآمنة وهوية Plugin الغامضة تفشل بشكل مغلق.

## ذو صلة

- [حاضن Codex](/ar/plugins/codex-harness)
- [مرجع حاضن Codex](/ar/plugins/codex-harness-reference)
- [وقت تشغيل حاضن Codex](/ar/plugins/codex-harness-runtime)
- [مرجع الإعدادات](/ar/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI الهجرة](/ar/cli/migrate)
