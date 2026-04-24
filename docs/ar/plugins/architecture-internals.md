---
read_when:
    - تنفيذ hooks وقت تشغيل المزوّد، أو دورة حياة القناة، أو حِزم package packs
    - تصحيح أخطاء ترتيب تحميل Plugin أو حالة السجل
    - إضافة قدرة Plugin جديدة أو Plugin لمحرك السياق
summary: 'البنية الداخلية لـ Plugin: مسار التحميل، والسجل، وhooks وقت التشغيل، ومسارات HTTP، والجداول المرجعية'
title: البنية الداخلية لـ Plugin
x-i18n:
    generated_at: "2026-04-24T07:53:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6a99b7be56b7042a0e58a8119066ccfcb898279e6d6668f2aaa7351b188b88e
    source_path: plugins/architecture-internals.md
    workflow: 15
---

بالنسبة إلى نموذج الإمكانات العامة، وأشكال Plugins، وعقود الملكية/التنفيذ،
راجع [بنية Plugin](/ar/plugins/architecture). هذه الصفحة هي
المرجع للآليات الداخلية: مسار التحميل، والسجل، وhooks وقت التشغيل،
ومسارات Gateway HTTP، ومسارات الاستيراد، وجداول schema.

## مسار التحميل

عند بدء التشغيل، يقوم OpenClaw تقريبًا بما يلي:

1. اكتشاف جذور Plugins المرشحة
2. قراءة manifestات أصلية أو متوافقة مع الحِزم وبيانات package الوصفية
3. رفض المرشحين غير الآمنين
4. تطبيع تهيئة Plugin ‏(`plugins.enabled`, و`allow`, و`deny`, و`entries`,
   و`slots`, و`load.paths`)
5. تقرير التفعيل لكل مرشح
6. تحميل الوحدات الأصلية المفعّلة: تستخدم الوحدات المضمّنة المبنية محمّلًا أصليًا؛
   بينما تستخدم Plugins الأصلية غير المبنية `jiti`
7. استدعاء hooks الأصلية `register(api)` وجمع التسجيلات في سجل Plugin
8. كشف السجل لأسطح الأوامر/وقت التشغيل

<Note>
تُعد `activate` اسمًا مستعارًا قديمًا لـ `register` — إذ يحلّل المحمّل أيًّا منهما كان موجودًا (`def.register ?? def.activate`) ويستدعيه في النقطة نفسها. وتستخدم جميع Plugins المضمّنة `register`; ففضّل `register` عند إنشاء Plugins جديدة.
</Note>

تحدث بوابات الأمان **قبل** تنفيذ وقت التشغيل. ويُحظر المرشحون
عندما يهرب الإدخال من جذر Plugin, أو يكون المسار قابلاً للكتابة من الجميع، أو
تبدو ملكية المسار مريبة بالنسبة إلى Plugins غير المضمّنة.

### السلوك القائم على Manifest أولًا

تُعد manifest مصدر الحقيقة في control plane. ويستخدمها OpenClaw من أجل:

- تحديد Plugin
- اكتشاف القنوات/Skills/schema التهيئة المعلنة أو إمكانات الحِزم
- التحقق من `plugins.entries.<id>.config`
- تعزيز تسميات/عناصر placeholder في Control UI
- إظهار بيانات تعريف التثبيت/الكتالوج
- الحفاظ على واصفات تفعيل وإعداد خفيفة من دون تحميل وقت تشغيل Plugin

بالنسبة إلى Plugins الأصلية، تكون وحدة وقت التشغيل هي جزء data-plane. فهي تسجل
السلوك الفعلي مثل hooks أو الأدوات أو الأوامر أو تدفقات المزوّد.

تبقى كتل `activation` و`setup` الاختيارية في manifest ضمن control plane.
وهي واصفات قائمة على البيانات الوصفية فقط من أجل تخطيط التفعيل واكتشاف الإعداد؛
ولا تحل محل التسجيل وقت التشغيل، أو `register(...)`, أو `setupEntry`.
ويستخدم أوائل مستهلكي التفعيل الحي الآن تلميحات manifest الخاصة بالأوامر والقنوات والمزوّدين
لتضييق تحميل Plugin قبل التبلور الأوسع للسجل:

- يضيّق تحميل CLI إلى Plugins التي تملك الأمر الأساسي المطلوب
- يضيّق حل إعداد/Plugin الخاصة بالقنوات إلى Plugins التي تملك
  معرّف القناة المطلوب
- يضيّق حل إعداد/وقت تشغيل المزوّد الصريح إلى Plugins التي تملك
  معرّف المزوّد المطلوب

يكشف مخطّط التفعيل عن API للمعرّفات فقط للمستدعين الموجودين وعن
plan API للتشخيصات الجديدة. وتبلغ إدخالات plan عن سبب اختيار Plugin,
مع فصل تلميحات المخطِّط الصريحة `activation.*` عن fallback الخاصة بملكية manifest
مثل `providers`, و`channels`, و`commandAliases`, و`setup.providers`,
و`contracts.tools`, وhooks. وهذا الفصل في الأسباب هو حد التوافق:
إذ تستمر بيانات تعريف Plugin الحالية في العمل، بينما تستطيع الشيفرة الجديدة اكتشاف التلميحات الواسعة
أو سلوك fallback من دون تغيير دلالات التحميل وقت التشغيل.

يفضّل اكتشاف الإعداد الآن المعرّفات المملوكة للواصفات مثل `setup.providers` و
`setup.cliBackends` لتضييق Plugins المرشحة قبل الرجوع إلى
`setup-api` بالنسبة إلى Plugins التي ما تزال تحتاج hooks وقت تشغيل في وقت الإعداد. وإذا ادّعت
أكثر من Plugin مكتشفة واحدة المعرّف المطبع نفسه لمزوّد إعداد أو CLI backend,
فإن بحث الإعداد يرفض المالك الملتبس بدلًا من الاعتماد على ترتيب الاكتشاف.

### ما الذي يخزّنه المحمّل مؤقتًا

يحتفظ OpenClaw بمخابئ قصيرة داخل العملية من أجل:

- نتائج الاكتشاف
- بيانات سجل manifest
- سجلات Plugins المحمّلة

وتقلل هذه المخابئ من حمل بدء التشغيل المتفجر ومن حمل الأوامر المتكررة. ومن الآمن
التفكير فيها على أنها مخابئ أداء قصيرة العمر، وليست حالة حفظ دائم.

ملاحظة أداء:

- اضبط `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` أو
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` لتعطيل هذه المخابئ.
- اضبط نوافذ المخابئ عبر `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` و
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## نموذج السجل

لا تقوم Plugins المحمّلة بتعديل globals عشوائية داخل core مباشرةً. بل تسجّل داخل
سجل مركزي لـ Plugin.

يتتبع السجل ما يلي:

- سجلات Plugins ‏(الهوية، والمصدر، والأصل، والحالة، والتشخيصات)
- الأدوات
- hooks القديمة وhooks المطبّعة
- القنوات
- المزوّدون
- معالجات Gateway RPC
- مسارات HTTP
- مسجلات CLI
- الخدمات في الخلفية
- الأوامر المملوكة لـ Plugin

ثم تقرأ الميزات الأساسية من ذلك السجل بدلًا من التحدث إلى وحدات Plugin
مباشرةً. وهذا يبقي التحميل باتجاه واحد:

- وحدة Plugin -> تسجيل السجل
- وقت تشغيل core -> استهلاك السجل

وهذا الفصل مهم لقابلية الصيانة. فهو يعني أن معظم أسطح core تحتاج فقط إلى
نقطة تكامل واحدة: “اقرأ السجل”، وليس “خصّص حالة لكل وحدة Plugin”.

## استدعاءات ربط المحادثة

يمكن لـ Plugins التي تربط محادثة ما أن تتفاعل عندما تُحلّ الموافقة.

استخدم `api.onConversationBindingResolved(...)` لتلقي استدعاء بعد
الموافقة على طلب ربط أو رفضه:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // يوجد الآن ربط لهذه Plugin + هذه المحادثة.
        console.log(event.binding?.conversationId);
        return;
      }

      // تم رفض الطلب؛ امسح أي حالة انتظار محلية.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

حقول حمولة الاستدعاء:

- `status`: ‏`"approved"` أو `"denied"`
- `decision`: ‏`"allow-once"` أو `"allow-always"` أو `"deny"`
- `binding`: الربط المحلول للطلبات الموافق عليها
- `request`: ملخص الطلب الأصلي، وتلميح detach, ومعرّف المرسل، وبيانات المحادثة الوصفية

هذا الاستدعاء مخصص للإشعار فقط. وهو لا يغير من المسموح له بربط
المحادثة، ويعمل بعد انتهاء معالجة الموافقة في core.

## hooks وقت تشغيل المزوّد

لدى Plugins المزوّدين ثلاث طبقات:

- **بيانات manifest الوصفية** للبحث الرخيص قبل وقت التشغيل: ‏`providerAuthEnvVars`,
  و`providerAuthAliases`, و`providerAuthChoices`, و`channelEnvVars`.
- **hooks وقت التهيئة**: ‏`catalog` ‏(`discovery` سابقًا) بالإضافة إلى
  `applyConfigDefaults`.
- **hooks وقت التشغيل**: أكثر من 40 hook اختيارية تغطي المصادقة، وحل النموذج،
  ولف stream, ومستويات التفكير، وسياسة replay, ونقاط نهاية الاستخدام. راجع
  القائمة الكاملة تحت [ترتيب hooks واستخدامها](#hook-order-and-usage).

ما يزال OpenClaw يملك حلقة الوكيل العامة، والرجوع الاحتياطي، ومعالجة transcript, و
سياسة الأدوات. وهذه hooks هي سطح التوسعة من أجل السلوك الخاص بالمزوّد
من دون الحاجة إلى طبقة نقل استدلال مخصصة كاملة.

استخدم `providerAuthEnvVars` في manifest عندما يكون للمزوّد بيانات اعتماد
معتمدة على env يفترض أن تراها مسارات auth/status/model-picker العامة من دون تحميل وقت تشغيل Plugin. واستخدم `providerAuthAliases` في manifest عندما يجب أن يعيد أحد معرّفات المزوّد استخدام متغيرات env وملفات تعريف المصادقة والمصادقة المدعومة بالتهيئة وخيار إعداد API-key الخاص بمعرّف مزوّد آخر. واستخدم `providerAuthChoices` في manifest عندما ينبغي لأسطح onboarding/auth-choice في CLI أن تعرف معرّف الخيار الخاص بالمزوّد، وتسميات المجموعات، وبنية المصادقة البسيطة ذات العلامة الواحدة من دون تحميل وقت تشغيل المزوّد. وأبقِ `envVars` الخاصة بوقت تشغيل المزوّد للتلميحات الموجهة للمشغّل مثل تسميات onboarding أو متغيرات إعداد OAuth client-id/client-secret.

استخدم `channelEnvVars` في manifest عندما تكون للقناة مصادقة أو إعدادات معتمدة على env يفترض أن تراها shell-env fallback العامة، أو فحوصات التهيئة/الحالة، أو مطالبات الإعداد من دون تحميل وقت تشغيل القناة.

### ترتيب hooks واستخدامها

بالنسبة إلى Plugins النماذج/المزوّدين، يستدعي OpenClaw hooks بهذا الترتيب التقريبي.
ويمثل عمود "متى تستخدمه" دليل القرار السريع.

| #   | Hook                              | ما الذي تفعله                                                                                                  | متى تستخدمها                                                                                                                                  |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | نشر تهيئة المزوّد داخل `models.providers` أثناء توليد `models.json`                                           | عندما يملك المزوّد كتالوجًا أو إعدادات افتراضية لـ `baseUrl`                                                                                 |
| 2   | `applyConfigDefaults`             | تطبيق الإعدادات الافتراضية العامة المملوكة للمزوّد أثناء تجسيد التهيئة                                         | عندما تعتمد الإعدادات الافتراضية على وضع المصادقة أو env أو دلالات عائلة نماذج المزوّد                                                     |
| --  | _(built-in model lookup)_         | يحاول OpenClaw أولًا مسار السجل/الكتالوج العادي                                                                | _(ليست hook خاصة بـ Plugin)_                                                                                                                 |
| 3   | `normalizeModelId`                | تطبيع الأسماء المستعارة القديمة أو الخاصة بالمعاينة لـ model-id قبل البحث                                      | عندما يملك المزوّد تنظيف الأسماء المستعارة قبل حل النموذج القانوني                                                                            |
| 4   | `normalizeTransport`              | تطبيع `api` / `baseUrl` الخاصة بعائلة المزوّد قبل التجميع العام للنموذج                                        | عندما يملك المزوّد تنظيف النقل لمعرّفات مزوّد مخصصة ضمن عائلة النقل نفسها                                                                   |
| 5   | `normalizeConfig`                 | تطبيع `models.providers.<id>` قبل حل وقت التشغيل/المزوّد                                                       | عندما يحتاج المزوّد إلى تنظيف تهيئة ينبغي أن تعيش مع Plugin; كما أن المساعدات المضمّنة الخاصة بعائلة Google تدعم إدخالات Google المدعومة |
| 6   | `applyNativeStreamingUsageCompat` | تطبيق عمليات إعادة كتابة التوافق الخاصة باستخدام التدفق الأصلي على مزوّدي التهيئة                              | عندما يحتاج المزوّد إلى إصلاحات بيانات وصفية خاصة باستخدام التدفق الأصلي تعتمد على نقطة النهاية                                              |
| 7   | `resolveConfigApiKey`             | حل مصادقة env-marker لمزوّدي التهيئة قبل تحميل مصادقة وقت التشغيل                                               | عندما يملك المزوّد حلًا مملوكًا للمزوّد لمفتاح API عبر env-marker؛ كما يملك `amazon-bedrock` محلل AWS env-marker مدمجًا هنا أيضًا        |
| 8   | `resolveSyntheticAuth`            | إظهار مصادقة محلية/مستضافة ذاتيًا أو مدعومة بالتهيئة من دون حفظ plaintext                                     | عندما يستطيع المزوّد العمل بعلامة بيانات اعتماد اصطناعية/محلية                                                                               |
| 9   | `resolveExternalAuthProfiles`     | تراكب ملفات تعريف المصادقة الخارجية المملوكة للمزوّد؛ والقيمة الافتراضية لـ `persistence` هي `runtime-only` لبيانات اعتماد CLI/app المملوكة | عندما يعيد المزوّد استخدام بيانات اعتماد مصادقة خارجية من دون حفظ refresh tokens المنسوخة؛ وصرّح بـ `contracts.externalAuthProviders` في manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | خفض أولوية العناصر النائبة الاصطناعية المحفوظة خلف المصادقة المدعومة عبر env/config                           | عندما يخزّن المزوّد ملفات تعريف نائبة اصطناعية لا ينبغي أن تفوز بالأسبقية                                                                    |
| 11  | `resolveDynamicModel`             | رجوع احتياطي متزامن لمعرّفات النماذج المملوكة للمزوّد وغير الموجودة في السجل المحلي بعد                         | عندما يقبل المزوّد معرّفات نماذج صاعدة تعسفية                                                                                               |
| 12  | `prepareDynamicModel`             | إحماء غير متزامن، ثم تُشغَّل `resolveDynamicModel` مرة أخرى                                                    | عندما يحتاج المزوّد إلى بيانات وصفية شبكية قبل حل المعرّفات غير المعروفة                                                                     |
| 13  | `normalizeResolvedModel`          | إعادة كتابة نهائية قبل أن يستخدم embedded runner النموذج المحلول                                                | عندما يحتاج المزوّد إلى إعادة كتابة النقل لكنه ما يزال يستخدم نقلًا من core                                                                  |
| 14  | `contributeResolvedModelCompat`   | الإسهام بعلامات التوافق للنماذج الخاصة بالمورّد خلف نقل متوافق آخر                                              | عندما يتعرف المزوّد إلى نماذجه الخاصة على وسائل نقل proxy من دون الاستيلاء على المزوّد                                                      |
| 15  | `capabilities`                    | بيانات transcript/tooling وصفية مملوكة للمزوّد تستخدمها منطقية core المشتركة                                   | عندما يحتاج المزوّد إلى خصائص quirks خاصة بـ transcript/عائلة المزوّد                                                                       |
| 16  | `normalizeToolSchemas`            | تطبيع Tool schemas قبل أن يراها embedded runner                                                                  | عندما يحتاج المزوّد إلى تنظيف schema خاص بعائلة النقل                                                                                       |
| 17  | `inspectToolSchemas`              | إظهار تشخيصات schema مملوكة للمزوّد بعد التطبيع                                                                 | عندما يريد المزوّد تحذيرات بالكلمات المفتاحية من دون تعليم core قواعد خاصة بالمزوّد                                                         |
| 18  | `resolveReasoningOutputMode`      | اختيار عقدة مخرجات reasoning الأصلية مقابل المعلّمة                                                             | عندما يحتاج المزوّد إلى reasoning/final output معلّمة بدلًا من الحقول الأصلية                                                                |
| 19  | `prepareExtraParams`              | تطبيع معلمات الطلب قبل أغلفة خيارات التدفق العامة                                                                | عندما يحتاج المزوّد إلى معلمات طلب افتراضية أو تنظيف معلمات لكل مزوّد                                                                         |
| 20  | `createStreamFn`                  | استبدال مسار التدفق العادي بالكامل بنقل مخصص                                                                    | عندما يحتاج المزوّد إلى بروتوكول wire مخصص، وليس مجرد غلاف                                                                                  |
| 21  | `wrapStreamFn`                    | غلاف للتدفق بعد تطبيق الأغلفة العامة                                                                            | عندما يحتاج المزوّد إلى أغلفة توافق لطلب/ترويسات/جسم/نموذج من دون نقل مخصص                                                                  |
| 22  | `resolveTransportTurnState`       | إرفاق ترويسات أو بيانات وصفية أصلية لكل دورة على مستوى النقل                                                   | عندما يريد المزوّد أن ترسل وسائل النقل العامة هوية دورة أصلية خاصة بالمزوّد                                                                 |
| 23  | `resolveWebSocketSessionPolicy`   | إرفاق ترويسات WebSocket أصلية أو سياسة تبريد للجلسة                                                             | عندما يريد المزوّد من وسائل WS العامة ضبط ترويسات الجلسة أو سياسة الرجوع الاحتياطي                                                          |
| 24  | `formatApiKey`                    | مُنسّق auth-profile: يتحول ملف التعريف المخزّن إلى سلسلة `apiKey` الخاصة بوقت التشغيل                           | عندما يخزّن المزوّد بيانات وصفية إضافية للمصادقة ويحتاج إلى شكل token مخصص لوقت التشغيل                                                     |
| 25  | `refreshOAuth`                    | تجاوز لتحديث OAuth لنقاط نهاية تحديث مخصصة أو سياسة فشل تحديث                                                   | عندما لا يلائم المزوّد محدّثات `pi-ai` المشتركة                                                                                              |
| 26  | `buildAuthDoctorHint`             | تلميح إصلاح يُلحَق عند فشل تحديث OAuth                                                                          | عندما يحتاج المزوّد إلى إرشادات إصلاح مصادقة يملكها هو بعد فشل التحديث                                                                       |
| 27  | `matchesContextOverflowError`     | مطابِق مملوك للمزوّد لأخطاء تجاوز نافذة السياق                                                                  | عندما يملك المزوّد أخطاء overflow خام قد تفوتها الاستدلالات العامة                                                                           |
| 28  | `classifyFailoverReason`          | تصنيف مملوك للمزوّد لأسباب الرجوع الاحتياطي                                                                     | عندما يستطيع المزوّد ربط أخطاء API/النقل الخام بأسباب مثل rate-limit/overload وما إلى ذلك                                                   |
| 29  | `isCacheTtlEligible`              | سياسة Prompt-cache لمزوّدي proxy/backhaul                                                                      | عندما يحتاج المزوّد إلى تقييد TTL خاص بالوكيل                                                                                                 |
| 30  | `buildMissingAuthMessage`         | بديل لرسالة الاسترداد العامة الخاصة بفقدان المصادقة                                                             | عندما يحتاج المزوّد إلى تلميح استرداد خاص بالمزوّد عند فقدان المصادقة                                                                          |
| 31  | `suppressBuiltInModel`            | حجب النماذج الصاعدة القديمة مع تلميح اختياري موجه للمستخدم                                                      | عندما يحتاج المزوّد إلى إخفاء صفوف صاعدة قديمة أو استبدالها بتلميح خاص بالمورّد                                                              |
| 32  | `augmentModelCatalog`             | صفوف كتالوج اصطناعية/نهائية تُلحَق بعد الاكتشاف                                                                 | عندما يحتاج المزوّد إلى صفوف توافق أمامي اصطناعية في `models list` وأدوات الاختيار                                                          |
| 33  | `resolveThinkingProfile`          | مجموعة مستويات `/think` الخاصة بالنموذج، وتسميات العرض، والقيمة الافتراضية                                      | عندما يكشف المزوّد عن سُلَّم تفكير مخصص أو تسمية ثنائية للنماذج المحددة                                                                       |
| 34  | `isBinaryThinking`                | hook توافق لمفتاح reasoning ثنائي on/off                                                                        | عندما يكشف المزوّد عن تفكير ثنائي on/off فقط                                                                                                  |
| 35  | `supportsXHighThinking`           | hook توافق لدعم reasoning من نوع `xhigh`                                                                        | عندما يريد المزوّد `xhigh` فقط على مجموعة فرعية من النماذج                                                                                   |
| 36  | `resolveDefaultThinkingLevel`     | hook توافق للمستوى الافتراضي لـ `/think`                                                                       | عندما يملك المزوّد سياسة `/think` الافتراضية لعائلة نماذج                                                                                    |
| 37  | `isModernModelRef`                | مطابِق النماذج الحديثة لفلاتر الملفات التعريفية الحية واختيار smoke                                            | عندما يملك المزوّد مطابقة النماذج المفضلة لسيناريوهات live/smoke                                                                             |
| 38  | `prepareRuntimeAuth`              | استبدال بيانات اعتماد مهيأة بالرمز/المفتاح الفعلي لوقت التشغيل قبل الاستدلال مباشرةً                           | عندما يحتاج المزوّد إلى تبادل token أو بيانات اعتماد طلب قصيرة العمر                                                                          |
| 39  | `resolveUsageAuth`                | حل بيانات اعتماد الاستخدام/الفوترة لأسطح `/usage` والحالة ذات الصلة                                            | عندما يحتاج المزوّد إلى تحليل مخصص لـ token الخاصة بالاستخدام/الحصة أو إلى بيانات اعتماد استخدام مختلفة                                      |
| 40  | `fetchUsageSnapshot`              | جلب لقطات الاستخدام/الحصة الخاصة بالمزوّد وتطبيعها بعد حل المصادقة                                             | عندما يحتاج المزوّد إلى نقطة نهاية استخدام خاصة به أو محلل حمولة خاص به                                                                       |
| 41  | `createEmbeddingProvider`         | بناء مهايئ تضمين embedding مملوك للمزوّد للذاكرة/البحث                                                         | عندما يكون سلوك تضمين الذاكرة مملوكًا لـ Plugin المزوّد                                                                                      |
| 42  | `buildReplayPolicy`               | إعادة سياسة replay تتحكم في معالجة transcript الخاصة بالمزوّد                                                   | عندما يحتاج المزوّد إلى سياسة transcript مخصصة (مثل إزالة كتل التفكير)                                                                       |
| 43  | `sanitizeReplayHistory`           | إعادة كتابة سجل replay بعد تنظيف transcript العام                                                              | عندما يحتاج المزوّد إلى عمليات إعادة كتابة replay خاصة به تتجاوز مساعدات Compaction المشتركة                                                 |
| 44  | `validateReplayTurns`             | التحقق النهائي من دورات replay أو إعادة تشكيلها قبل embedded runner                                            | عندما يحتاج نقل المزوّد إلى تحقق أشد للدورات بعد التنقية العامة                                                                              |
| 45  | `onModelSelected`                 | تشغيل آثار جانبية بعد الاختيار مملوكة للمزوّد                                                                   | عندما يحتاج المزوّد إلى قياس عن بُعد أو حالة خاصة به عند تفعيل نموذج ما                                                                       |

تتحقق `normalizeModelId`, و`normalizeTransport`, و`normalizeConfig` أولًا من
Plugin المزوّد المطابقة، ثم تنتقل إلى Plugins المزوّدين الأخرى القادرة على استخدام hooks
حتى تقوم إحداها فعليًا بتغيير model id أو transport/config. وهذا يحافظ على عمل
الأسماء المستعارة/توافق المزوّدات من دون أن يضطر المستدعي إلى معرفة أي Plugin
مضمّنة تملك إعادة الكتابة. وإذا لم تُعد أي hook خاصة بالمزوّد كتابة
إدخال تهيئة مدعوم من عائلة Google, فإن مُطبّع تهيئة Google المضمّن لا يزال يطبق
هذا التنظيف التوافقي.

إذا كان المزوّد يحتاج إلى بروتوكول wire مخصص بالكامل أو منفّذ طلبات مخصص،
فهذا صنف مختلف من الامتدادات. فهذه hooks مخصصة لسلوك المزوّد
الذي لا يزال يعمل ضمن حلقة الاستدلال العادية في OpenClaw.

### مثال على مزوّد

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### أمثلة مضمّنة

تجمع Plugins المضمّنة الخاصة بالمزوّدين hooks المذكورة أعلاه لتلائم احتياجات
الكتالوج، والمصادقة، والتفكير، وreplay, والاستخدام لدى كل مورّد. وتعيش مجموعة hooks
المرجعية مع كل Plugin تحت `extensions/`; وتوضح هذه الصفحة الأشكال
بدلًا من عكس القائمة كما هي.

<AccordionGroup>
  <Accordion title="مزوّدو الكتالوج الممرّر">
    تسجل OpenRouter, وKilocode, وZ.AI, وxAI القيم `catalog` بالإضافة إلى
    `resolveDynamicModel` / `prepareDynamicModel` حتى تتمكن من إظهار
    معرّفات النماذج الصاعدة قبل كتالوج OpenClaw الثابت.
  </Accordion>
  <Accordion title="مزوّدو OAuth ونقاط نهاية الاستخدام">
    تقرن GitHub Copilot, وGemini CLI, وChatGPT Codex, وMiniMax, وXiaomi, وz.ai
    بين `prepareRuntimeAuth` أو `formatApiKey` و`resolveUsageAuth` +
    `fetchUsageSnapshot` لامتلاك تبادل token وتكامل `/usage`.
  </Accordion>
  <Accordion title="عائلات replay وتنظيف transcript">
    تسمح العائلات المشتركة المسماة (`google-gemini`, و`passthrough-gemini`,
    و`anthropic-by-model`, و`hybrid-anthropic-openai`) للمزوّدين بالاشتراك في
    سياسة transcript عبر `buildReplayPolicy` بدلًا من أن يعيد كل Plugin
    تنفيذ التنظيف بنفسه.
  </Accordion>
  <Accordion title="مزوّدو الكتالوج فقط">
    تسجل `byteplus`, و`cloudflare-ai-gateway`, و`huggingface`, و`kimi-coding`, و`nvidia`,
    و`qianfan`, و`synthetic`, و`together`, و`venice`, و`vercel-ai-gateway`, و
    `volcengine` قيمة `catalog` فقط وتعتمد على حلقة الاستدلال المشتركة.
  </Accordion>
  <Accordion title="مساعدات التدفق الخاصة بـ Anthropic">
    تعيش رؤوس Beta, و`/fast` / `serviceTier`, و`context1m` داخل
    seam العامة `api.ts` / `contract-api.ts` الخاصة بـ Plugin Anthropic
    (`wrapAnthropicProviderStream`, و`resolveAnthropicBetas`,
    و`resolveAnthropicFastMode`, و`resolveAnthropicServiceTier`) بدلًا من
    SDK العامة.
  </Accordion>
</AccordionGroup>

## مساعدات وقت التشغيل

يمكن لـ Plugins الوصول إلى مساعدات core محددة عبر `api.runtime`. وبالنسبة إلى TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

ملاحظات:

- تعيد `textToSpeech` حمولة مخرجات TTS العادية في core لأسطح الملفات/الملاحظات الصوتية.
- تستخدم تهيئة core `messages.tts` واختيار المزوّد.
- تعيد PCM audio buffer + sample rate. ويجب على Plugins إعادة أخذ العينات/الترميز بالنسبة إلى المزوّدين.
- `listVoices` اختيارية لكل مزوّد. استخدمها لأدوات اختيار الأصوات المملوكة للمورّد أو لتدفقات الإعداد.
- يمكن أن تتضمن قوائم الأصوات بيانات وصفية أغنى مثل locale, وgender, وعلامات personality لأدوات الاختيار المدركة للمزوّد.
- يدعم كل من OpenAI وElevenLabs خدمات telephony اليوم. أما Microsoft فلا تدعمها.

كما يمكن لـ Plugins تسجيل مزوّدي speech عبر `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

ملاحظات:

- أبقِ سياسة TTS, والرجوع الاحتياطي، وتسليم الرد في core.
- استخدم مزوّدي speech لسلوك التوليف المملوك للمورّد.
- يُطبَّع الإدخال القديم Microsoft `edge` إلى معرّف المزوّد `microsoft`.
- نموذج الملكية المفضّل موجّه نحو الشركات: إذ يمكن أن يملك
  Plugin مورّد واحدة المزوّدات الخاصة بالنص والكلام والصور والوسائط المستقبلية مع إضافة OpenClaw لعقود تلك القدرات.

وبالنسبة إلى فهم الصور/الصوت/الفيديو، تسجّل Plugins مزودًا واحدًا مُمَطَّطًا لفهم
الوسائط بدلًا من حقيبة key/value عامة:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

ملاحظات:

- أبقِ orchestration, والرجوع الاحتياطي، والتهيئة، وربط القنوات في core.
- أبقِ سلوك المورّد في Plugin المزوّد.
- يجب أن يبقى التوسع الإضافي مُمَطَّطًا: طرائق اختيارية جديدة، وحقول نتائج اختيارية جديدة، وقدرات اختيارية جديدة.
- يتبع توليد الفيديو بالفعل النمط نفسه:
  - تملك core عقد القدرة ومساعد وقت التشغيل
  - تسجّل Plugins المورّدين `api.registerVideoGenerationProvider(...)`
  - تستهلك Plugins الميزات/القنوات `api.runtime.videoGeneration.*`

وبالنسبة إلى مساعدات وقت التشغيل الخاصة بفهم الوسائط، يمكن لـ Plugins استدعاء:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

وبالنسبة إلى النسخ النصي للصوت، يمكن لـ Plugins استخدام وقت تشغيل فهم الوسائط
أو الاسم المستعار الأقدم STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // اختياري عندما يتعذر استنتاج MIME بشكل موثوق:
  mime: "audio/ogg",
});
```

ملاحظات:

- يُعد `api.runtime.mediaUnderstanding.*` السطح المشترك المفضل
  لفهم الصور/الصوت/الفيديو.
- يستخدم تهيئة الصوت الخاصة بفهم الوسائط في core ‏(`tools.media.audio`) وترتيب الرجوع الاحتياطي للمزوّد.
- يعيد `{ text: undefined }` عندما لا يُنتج أي ناتج نسخ نصي (مثلًا بسبب إدخال تم تخطيه/غير مدعوم).
- تظل `api.runtime.stt.transcribeAudioFile(...)` اسمًا مستعارًا للتوافق.

كما يمكن لـ Plugins إطلاق تشغيلات وكلاء فرعيين في الخلفية عبر `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

ملاحظات:

- تُعد `provider` و`model` تجاوزات اختيارية لكل تشغيل، وليست تغييرات دائمة على الجلسة.
- لا يحترم OpenClaw حقول التجاوز هذه إلا للمستدعين الموثوقين.
- بالنسبة إلى تشغيلات الرجوع الاحتياطي المملوكة لـ Plugin, يجب على المشغّلين الاشتراك عبر `plugins.entries.<id>.subagent.allowModelOverride: true`.
- استخدم `plugins.entries.<id>.subagent.allowedModels` لتقييد Plugins الموثوقة على أهداف قانونية محددة من نوع `provider/model`, أو استخدم `"*"` للسماح صراحة بأي هدف.
- ما تزال تشغيلات الوكلاء الفرعيين الخاصة بـ Plugin غير الموثوقة تعمل، لكن تُرفض طلبات التجاوز بدلًا من الرجوع بصمت.

وبالنسبة إلى البحث على الويب، يمكن لـ Plugins استهلاك مساعد وقت التشغيل المشترك بدلًا من
الوصول إلى ربط أداة الوكيل:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

كما يمكن لـ Plugins تسجيل مزوّدي web-search عبر
`api.registerWebSearchProvider(...)`.

ملاحظات:

- أبقِ اختيار المزوّد، وحل بيانات الاعتماد، ودلالات الطلب المشتركة في core.
- استخدم مزوّدي web-search لوسائل نقل البحث الخاصة بالمورّد.
- يُعد `api.runtime.webSearch.*` السطح المشترك المفضل لـ Plugins الخاصة بالميزات/القنوات التي تحتاج إلى سلوك البحث من دون الاعتماد على غلاف أداة الوكيل.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: توليد صورة باستخدام سلسلة مزوّد توليد الصور المهيأة.
- `listProviders(...)`: عرض مزوّدي توليد الصور المتاحين وقدراتهم.

## مسارات Gateway HTTP

يمكن لـ Plugins كشف نقاط نهاية HTTP عبر `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

حقول المسار:

- `path`: مسار route تحت خادم Gateway HTTP.
- `auth`: مطلوب. استخدم `"gateway"` لطلب مصادقة Gateway العادية، أو `"plugin"` من أجل المصادقة/التحقق من webhook المدار من Plugin.
- `match`: اختياري. ‏`"exact"` ‏(الافتراضي) أو `"prefix"`.
- `replaceExisting`: اختياري. يسمح لـ Plugin نفسها باستبدال تسجيل مسارها الحالي.
- `handler`: أعد `true` عندما يكون المسار قد عالج الطلب.

ملاحظات:

- تمت إزالة `api.registerHttpHandler(...)` وستؤدي إلى خطأ عند تحميل Plugin. استخدم `api.registerHttpRoute(...)` بدلًا منها.
- يجب أن تصرح مسارات Plugin بـ `auth` صراحةً.
- تُرفض تعارضات `path + match` الدقيقة ما لم تكن `replaceExisting: true`, ولا يمكن لـ Plugin واحدة أن تستبدل مسار Plugin أخرى.
- تُرفض المسارات المتداخلة ذات مستويات `auth` المختلفة. وأبقِ سلاسل fallthrough الخاصة بـ `exact`/`prefix` على مستوى auth نفسه فقط.
- لا تتلقى المسارات ذات `auth: "plugin"` نطاقات runtime الخاصة بالمشغّل تلقائيًا. فهي مخصصة لـ webhooks/التحقق من التوقيع المدار من Plugin, وليست لاستدعاءات مساعد Gateway المميّزة.
- تعمل المسارات ذات `auth: "gateway"` ضمن نطاق runtime لطلب Gateway, لكن هذا النطاق محافظ عمدًا:
  - تبقي مصادقة bearer ذات السر المشترك (`gateway.auth.mode = "token"` / `"password"`) نطاقات runtime الخاصة بمسارات plugin مثبتة على `operator.write`, حتى إذا أرسل المستدعي `x-openclaw-scopes`
  - تحترم أوضاع HTTP الحاملة للهوية الموثوقة (مثل `trusted-proxy` أو `gateway.auth.mode = "none"` على منفذ دخول خاص) قيمة `x-openclaw-scopes` فقط عند وجود الترويسة صراحةً
  - إذا كانت `x-openclaw-scopes` غائبة على طلبات plugin-route الحاملة للهوية، فإن نطاق runtime يعود إلى `operator.write`
- القاعدة العملية: لا تفترض أن مسار Plugin المصادق عليه عبر gateway هو سطحًا إداريًا ضمنيًا. وإذا كان مسارك يحتاج إلى سلوك خاص بالمسؤولين فقط، فاطلب وضع مصادقة حاملًا للهوية ووثّق عقد الترويسة الصريحة `x-openclaw-scopes`.

## مسارات استيراد Plugin SDK

استخدم مسارات SDK الفرعية الضيقة بدلًا من الجذر الجامع الأحادي `openclaw/plugin-sdk`
عند تأليف Plugins جديدة. المسارات الفرعية الأساسية:

| المسار الفرعي                         | الغرض                                             |
| ----------------------------------- | ------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | بدائيات تسجيل Plugin                              |
| `openclaw/plugin-sdk/channel-core`  | مساعدات إدخال/بناء القناة                         |
| `openclaw/plugin-sdk/core`          | مساعدات مشتركة عامة والعقدة الجامعة               |
| `openclaw/plugin-sdk/config-schema` | ‏Zod schema الجذرية لـ `openclaw.json` ‏(`OpenClawSchema`) |

تختار Plugins القنوات من عائلة من seams الضيقة — `channel-setup`,
و`setup-runtime`, و`setup-adapter-runtime`, و`setup-tools`, و`channel-pairing`,
و`channel-contract`, و`channel-feedback`, و`channel-inbound`, و`channel-lifecycle`,
و`channel-reply-pipeline`, و`command-auth`, و`secret-input`, و`webhook-ingress`,
و`channel-targets`, و`channel-actions`. ويجب أن يتوحد سلوك الموافقات
حول عقدة واحدة `approvalCapability` بدلًا من المزج بين حقول Plugin غير ذات الصلة.
راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins).

تعيش مساعدات وقت التشغيل والتهيئة تحت مسارات فرعية مطابقة من نوع `*-runtime`
‏(`approval-runtime`, و`config-runtime`, و`infra-runtime`, و`agent-runtime`,
و`lazy-runtime`, و`directory-runtime`, و`text-runtime`, و`runtime-store`, إلخ).

<Info>
يُعد `openclaw/plugin-sdk/channel-runtime` مهملًا — وهو غلاف توافق لـ
Plugins الأقدم. ويجب على الشيفرة الجديدة استيراد بدائيات عامة أضيق بدلًا من ذلك.
</Info>

نقاط الدخول الداخلية للمستودع (لكل جذر package خاص بـ Plugin مضمّنة):

- `index.js` — إدخال Plugin المضمّنة
- `api.js` — برميل مساعدات/أنواع
- `runtime-api.js` — برميل خاص بوقت التشغيل فقط
- `setup-entry.js` — إدخال Plugin الخاصة بالإعداد

يجب على Plugins الخارجية أن تستورد فقط من المسارات الفرعية `openclaw/plugin-sdk/*`.
ولا تستورد أبدًا `src/*` الخاصة بـ package Plugin أخرى من core أو من Plugin أخرى.
وتفضّل نقاط الدخول المحمّلة عبر الواجهة لقطة تهيئة وقت التشغيل النشطة عندما تكون موجودة،
ثم تعود إلى ملف التهيئة المحلول على القرص.

توجد مسارات فرعية خاصة بالقدرات مثل `image-generation`, و`media-understanding`,
و`speech` لأن Plugins المضمّنة تستخدمها اليوم. وهي ليست
تلقائيًا عقودًا خارجية مجمّدة على المدى الطويل — راجع صفحة
مرجع SDK ذات الصلة عند الاعتماد عليها.

## Tool schemas الخاصة بالرسائل

يجب أن تملك Plugins إسهامات `describeMessageTool(...)` الخاصة بالقنوات لـ
البدائيات غير الرسائلية مثل reactions, وreads, وpolls.
ويجب أن يستخدم send presentation المشتركة العقدة العامة `MessagePresentation`
بدلًا من الحقول الأصلية الخاصة بالمزوّد للأزرار، أو المكوّنات، أو الكتل، أو البطاقات.
راجع [Message Presentation](/ar/plugins/message-presentation) للعقدة،
وقواعد الرجوع الاحتياطي، وربط المزوّدين، وقائمة التحقق لمؤلفي Plugin.

تعلن Plugins القادرة على الإرسال ما يمكنها عرضه من خلال قدرات الرسائل:

- `presentation` لكتل العرض الدلالية (`text`, و`context`, و`divider`, و`buttons`, و`select`)
- `delivery-pin` لطلبات التسليم المثبت

تقرر core ما إذا كان يجب عرض presentation بشكل أصلي أو تحويلها إلى نص.
ولا تكشف مخارج هروب للواجهة الأصلية الخاصة بالمزوّد من أداة الرسائل العامة.
وتظل مساعدات SDK المهملة الخاصة بالمخططات الأصلية القديمة مُصدَّرة لـ Plugins الخارجية الموجودة،
لكن يجب ألا تستخدمها Plugins الجديدة.

## حل أهداف القناة

يجب أن تملك Plugins القنوات دلالات الأهداف الخاصة بالقنوات. أبقِ
المضيف الصادر المشترك عامًا واستخدم سطح مهايئ المراسلة لقواعد المزوّد:

- يقرر `messaging.inferTargetChatType({ to })` ما إذا كان ينبغي التعامل مع الهدف
  المطبَّع بوصفه `direct`, أو `group`, أو `channel` قبل البحث في الدليل.
- يخبر `messaging.targetResolver.looksLikeId(raw, normalized)` core ما إذا كان يجب على
  الإدخال أن يتجاوز مباشرةً إلى حل شبيه بالمعرّف بدلًا من البحث في الدليل.
- تمثل `messaging.targetResolver.resolveTarget(...)` الرجوع الاحتياطي في Plugin عندما
  تحتاج core إلى حل نهائي يملكه المزوّد بعد التطبيع أو بعد
  فشل البحث في الدليل.
- تملك `messaging.resolveOutboundSessionRoute(...)` بناء مسار الجلسة
  الخاص بالمزوّد بعد حل الهدف.

التقسيم الموصى به:

- استخدم `inferTargetChatType` لقرارات الفئة التي يجب أن تحدث قبل
  البحث في peers/groups.
- استخدم `looksLikeId` لفحوصات “تعامل مع هذا باعتباره معرّف هدف صريح/أصلي”.
- استخدم `resolveTarget` للرجوع الاحتياطي للتطبيع الخاص بالمزوّد، وليس
  للبحث الواسع في الدليل.
- أبقِ المعرّفات الأصلية للمزوّد مثل chat ids, وthread ids, وJIDs, وhandles, وroom
  ids داخل قيم `target` أو المعلمات الخاصة بالمزوّد، وليس في حقول SDK العامة.

## الأدلة المدعومة بالتهيئة

يجب أن تبقي Plugins التي تشتق إدخالات directory من التهيئة هذه المنطقية داخل
Plugin وأن تعيد استخدام المساعدات المشتركة من
`openclaw/plugin-sdk/directory-runtime`.

استخدم هذا عندما تحتاج قناة إلى peers/groups مدعومة بالتهيئة مثل:

- DM peers مدفوعة بقوائم السماح
- خرائط القنوات/المجموعات المهيأة
- عمليات الرجوع الاحتياطي الثابتة الخاصة بالدليل ضمن نطاق الحساب

تتعامل المساعدات المشتركة في `directory-runtime` فقط مع العمليات العامة:

- ترشيح الاستعلام
- تطبيق الحدود
- إزالة التكرار/مساعدات التطبيع
- بناء `ChannelDirectoryEntry[]`

أما فحص الحسابات الخاص بالقنوات وتطبيع المعرّفات فيجب أن يبقى داخل
تنفيذ Plugin.

## كتالوجات المزوّدين

يمكن لـ Plugins المزوّدين تعريف كتالوجات نماذج للاستدلال باستخدام
`registerProvider({ catalog: { run(...) { ... } } })`.

تعيد `catalog.run(...)` الشكل نفسه الذي يكتبه OpenClaw داخل
`models.providers`:

- `{ provider }` لإدخال مزوّد واحد
- `{ providers }` لعدة إدخالات مزوّدين

استخدم `catalog` عندما تملك Plugin معرّفات نماذج أو إعدادات افتراضية لـ base URL أو بيانات وصفية للنماذج مرتبطة بالمصادقة خاصة بالمزوّد.

يتحكم `catalog.order` في وقت دمج كتالوج Plugin بالنسبة إلى
المزوّدين الضمنيين المدمجين في OpenClaw:

- `simple`: مزوّدون عاديون يعتمدون على API-key أو env
- `profile`: مزوّدون يظهرون عند وجود ملفات تعريف المصادقة
- `paired`: مزوّدون يصنعون عدة إدخالات مزوّدين مرتبطة
- `late`: التمريرة الأخيرة، بعد المزوّدين الضمنيين الآخرين

ويفوز المزوّدون اللاحقون عند تعارض المفتاح، لذلك تستطيع Plugins أن تتجاوز
عن عمد إدخال مزوّد مدمجًا له معرّف المزوّد نفسه.

التوافق:

- ما تزال `discovery` تعمل كاسم مستعار قديم
- إذا سُجّل كل من `catalog` و`discovery`, فإن OpenClaw تستخدم `catalog`

## فحص القنوات للقراءة فقط

إذا كانت Plugin الخاصة بك تسجّل قناة، ففضّل تنفيذ
`plugin.config.inspectAccount(cfg, accountId)` إلى جانب `resolveAccount(...)`.

لماذا:

- تمثل `resolveAccount(...)` مسار وقت التشغيل. ويُسمح لها بأن تفترض أن بيانات الاعتماد
  قد تبلورت بالكامل وأن تفشل سريعًا عندما تكون الأسرار المطلوبة مفقودة.
- يجب ألا تحتاج مسارات الأوامر الخاصة بالقراءة فقط مثل `openclaw status`, و`openclaw status --all`,
  و`openclaw channels status`, و`openclaw channels resolve`, وتدفقات إصلاح doctor/config
  إلى تجسيد بيانات اعتماد وقت التشغيل لمجرد وصف التهيئة.

سلوك `inspectAccount(...)` الموصى به:

- أعد فقط حالة الحساب الوصفية.
- حافظ على `enabled` و`configured`.
- ضمّن حقول مصدر/حالة بيانات الاعتماد عند الاقتضاء، مثل:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- لا تحتاج إلى إعادة القيم الخام للرموز لمجرد الإبلاغ عن التوفر
  للقراءة فقط. فإعادة `tokenStatus: "available"` ‏(وحقل المصدر المطابق)
  تكفي لأوامر من نمط الحالة.
- استخدم `configured_unavailable` عندما تكون بيانات الاعتماد مهيأة عبر SecretRef لكن
  غير متاحة في مسار الأمر الحالي.

وهذا يسمح لأوامر القراءة فقط بالإبلاغ عن "مهيأ لكنه غير متاح في مسار الأمر هذا" بدلًا من التعطل أو الإبلاغ الخاطئ بأن الحساب غير مهيأ.

## حِزم package packs

قد يتضمن دليل Plugin ملف `package.json` يحتوي على `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

يصبح كل إدخال Plugin. وإذا أدرجت الحزمة عدة امتدادات، فإن معرّف Plugin
يصبح `name/<fileBase>`.

إذا كانت Plugin الخاصة بك تستورد تبعيات npm, فثبّتها في ذلك الدليل حتى يكون
`node_modules` متاحًا (`npm install` / `pnpm install`).

حاجز أمان: يجب أن يبقى كل إدخال في `openclaw.extensions` داخل دليل Plugin
بعد حل الروابط الرمزية. وتُرفض الإدخالات التي تهرب من دليل package.

ملاحظة أمان: يقوم `openclaw plugins install` بتثبيت تبعيات Plugin باستخدام
`npm install --omit=dev --ignore-scripts` ‏(من دون lifecycle scripts, ومن دون تبعيات dev وقت التشغيل). أبقِ أشجار تبعيات Plugin
من نوع "pure JS/TS" وتجنب الحزم التي تتطلب عمليات بناء عبر `postinstall`.

اختياري: يمكن أن يشير `openclaw.setupEntry` إلى وحدة خفيفة مخصصة للإعداد فقط.
وعندما يحتاج OpenClaw إلى أسطح إعداد لقناة Plugin معطلة، أو
عندما تكون قناة Plugin مفعلة لكنها ما تزال غير مهيأة، فإنه يحمّل `setupEntry`
بدلًا من الإدخال الكامل لـ Plugin. وهذا يبقي بدء التشغيل والإعداد أخف
عندما يربط الإدخال الرئيسي أيضًا أدوات أو hooks أو شيفرة وقت تشغيل فقط أخرى.

اختياري: يمكن أن يُدرج `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
قناة Plugin في المسار نفسه الخاص بـ `setupEntry` خلال
مرحلة startup السابقة لـ listen الخاصة بـ gateway, حتى عندما تكون القناة مهيأة بالفعل.

استخدم هذا فقط عندما تغطي `setupEntry` بالكامل سطح startup الذي يجب أن يوجد
قبل أن تبدأ gateway في الاستماع. وعمليًا، يعني ذلك أن إدخال الإعداد
يجب أن يسجّل كل قدرة مملوكة للقناة تعتمد عليها startup، مثل:

- تسجيل القناة نفسها
- أي مسارات HTTP يجب أن تكون متاحة قبل أن تبدأ gateway في الاستماع
- أي طرائق Gateway, أو أدوات، أو خدمات يجب أن توجد خلال النافذة نفسها

إذا كان الإدخال الكامل ما يزال يملك أي قدرة startup مطلوبة، فلا تفعّل
هذه العلامة. وأبقِ Plugin على السلوك الافتراضي ودع OpenClaw يحمّل الإدخال
الكامل أثناء startup.

كما يمكن للقنوات المضمّنة أن تنشر مساعدات setup-only خاصة بسطح العقدة يمكن لـ core
الرجوع إليها قبل تحميل وقت تشغيل القناة الكامل. ويتمثل سطح ترقية الإعداد الحالي في:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

وتستخدم core هذا السطح عندما تحتاج إلى ترقية تهيئة قناة قديمة ذات حساب واحد
إلى `channels.<id>.accounts.*` من دون تحميل الإدخال الكامل لـ Plugin.
ويمثل Matrix المثال المضمّن الحالي: إذ ينقل فقط مفاتيح auth/bootstrap إلى
حساب مُرَقّى مسمّى عندما توجد حسابات مسماة بالفعل، ويمكنه الحفاظ على
مفتاح حساب افتراضي غير قانوني مهيأ بدلًا من إنشاء
`accounts.default` دائمًا.

وتُبقي مهايئات تصحيح الإعداد هذه اكتشاف سطح العقدة الخاص بالقنوات المضمّنة كسولًا.
ويظل وقت الاستيراد خفيفًا؛ فلا يُحمَّل سطح الترقية إلا عند أول استخدام بدلًا من
إعادة الدخول إلى startup القناة المضمّنة أثناء استيراد الوحدة.

وعندما تتضمن أسطح startup هذه طرائق Gateway RPC, فأبقها على
بادئة خاصة بـ Plugin. إذ تبقى مساحات أسماء الإدارة في core ‏(`config.*`,
و`exec.approvals.*`, و`wizard.*`, و`update.*`) محجوزة وتُحل دائمًا إلى
`operator.admin`, حتى إذا طلبت Plugin نطاقًا أضيق.

مثال:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### بيانات تعريف كتالوج القناة

يمكن لقنوات Plugin الإعلان عن بيانات تعريف setup/discovery عبر `openclaw.channel` و
تلميحات التثبيت عبر `openclaw.install`. وهذا يُبقي بيانات core الخاصة بالكتالوج خالية من البيانات.

مثال:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "دردشة مستضافة ذاتيًا عبر روبوتات Webhook الخاصة بـ Nextcloud Talk.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

حقول `openclaw.channel` المفيدة بخلاف المثال الأدنى:

- `detailLabel`: تسمية ثانوية لأسطح الكتالوج/الحالة الأغنى
- `docsLabel`: تجاوز نص الرابط الخاص برابط الوثائق
- `preferOver`: معرّفات Plugin/قناة ذات أولوية أدنى يجب أن يتقدم عليها هذا الإدخال في الكتالوج
- `selectionDocsPrefix`, و`selectionDocsOmitLabel`, و`selectionExtras`: أدوات تحكم خاصة بنسخ سطح الاختيار
- `markdownCapable`: يضع علامة على القناة على أنها قادرة على Markdown لقرارات التنسيق الصادر
- `exposure.configured`: يخفي القناة من أسطح عرض القنوات المهيأة عندما تكون قيمته `false`
- `exposure.setup`: يخفي القناة من أدوات الاختيار التفاعلية الخاصة بالإعداد/التهيئة عندما تكون قيمته `false`
- `exposure.docs`: يضع علامة على القناة على أنها داخلية/خاصة بالنسبة إلى أسطح التنقل في الوثائق
- `showConfigured` / `showInSetup`: أسماء مستعارة قديمة ما تزال مقبولة للتوافق؛ ويفضل استخدام `exposure`
- `quickstartAllowFrom`: يُدرج القناة في تدفق `allowFrom` القياسي الخاص بالبداية السريعة
- `forceAccountBinding`: يطلب ربط حساب صريحًا حتى عندما يوجد حساب واحد فقط
- `preferSessionLookupForAnnounceTarget`: يفضل البحث في الجلسة عند حل أهداف announce

كما يمكن لـ OpenClaw دمج **كتالوجات قنوات خارجية** ‏(مثل تصدير من سجل
MPM). ضع ملف JSON في أحد المواقع التالية:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

أو وجّه `OPENCLAW_PLUGIN_CATALOG_PATHS` ‏(أو `OPENCLAW_MPM_CATALOG_PATHS`) إلى
ملف JSON واحد أو أكثر (مفصولة بفواصل/فواصل منقوطة/بواسطة `PATH`). ويجب أن يحتوي كل ملف
على `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. كما يقبل المحلل أيضًا `"packages"` أو `"plugins"` كأسماء مستعارة قديمة للمفتاح `"entries"`.

تكشف إدخالات كتالوج القنوات المولدة وإدخالات كتالوج تثبيت المزوّدين عن
حقائق مطبّعة خاصة بمصدر التثبيت إلى جانب كتلة `openclaw.install` الخام. وتحدد
الحقائق المطبّعة ما إذا كانت npm spec إصدارًا دقيقًا أو محددًا عائمًا، وما إذا كانت
بيانات تعريف السلامة المتوقعة موجودة، وما إذا كان مسار مصدر محلي متاحًا أيضًا.
ويجب أن يتعامل المستهلكون مع `installSource` باعتباره حقلًا اختياريًا إضافيًا
حتى لا تضطر الإدخالات اليدوية القديمة وغلافات التوافق إلى توليده اصطناعيًا.
وهذا يسمح للإعداد الأولي والتشخيصات بشرح حالة طبقة المصدر من دون استيراد وقت تشغيل Plugin.

يجب أن تفضّل الإدخالات الرسمية الخارجية عبر npm قيمة `npmSpec` دقيقة بالإضافة إلى
`expectedIntegrity`. وما تزال أسماء الحزم العارية وdist-tags تعمل للتوافق،
لكنها تظهر تحذيرات خاصة بطبقة المصدر بحيث يمكن أن يتجه الكتالوج نحو تثبيتات
مثبتة ومتحقق من سلامتها من دون كسر Plugins الموجودة.

## Plugins محرك السياق

تمتلك Plugins محرك السياق orchestration الخاصة بسياق الجلسة من أجل ingest وassembly و
Compaction. سجّلها من Plugin الخاصة بك باستخدام
`api.registerContextEngine(id, factory)`, ثم اختر المحرك النشط عبر
`plugins.slots.contextEngine`.

استخدم هذا عندما تحتاج Plugin الخاصة بك إلى استبدال خط أنابيب
السياق الافتراضي أو توسيعه بدلًا من مجرد إضافة بحث في الذاكرة أو hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

إذا كان محركك **لا** يملك خوارزمية Compaction, فأبقِ `compact()`
مطبقة وقم بتفويضها صراحةً:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## إضافة قدرة جديدة

عندما تحتاج Plugin إلى سلوك لا يلائم API الحالية، فلا تتجاوز
نظام Plugin عبر وصول خاص داخلي. أضف القدرة المفقودة.

التسلسل الموصى به:

1. تعريف عقدة core
   قرر السلوك المشترك الذي يجب أن تملكه core: السياسة، والرجوع الاحتياطي، ودمج التهيئة،
   ودورة الحياة، والدلالات المواجهة للقنوات، وشكل مساعد وقت التشغيل.
2. إضافة أسطح تسجيل/وقت تشغيل مطبّعة خاصة بـ Plugin
   وسّع `OpenClawPluginApi` و/أو `api.runtime` بأصغر سطح قدرة
   مطبّع ومفيد.
3. توصيل مستهلكي core + القناة/الميزة
   يجب أن تستهلك Plugins القنوات والميزات القدرة الجديدة عبر core,
   لا عبر استيراد تنفيذ مورّد مباشرة.
4. تسجيل تنفيذات المورّد
   ثم تسجّل Plugins المورّدين الواجهات الخلفية الخاصة بها مقابل القدرة.
5. إضافة تغطية للعقدة
   أضف اختبارات حتى تظل الملكية وشكل التسجيل صريحين بمرور الوقت.

وهكذا يبقى OpenClaw ذا رأي واضح من دون أن يصبح مشفرًا صراحةً
لرؤية مزوّد واحد للعالم. راجع [Capability Cookbook](/ar/plugins/architecture)
للحصول على قائمة تحقق فعلية للملفات ومثال عملي.

### قائمة تحقق القدرة

عندما تضيف قدرة جديدة، ينبغي عادةً أن يلمس التنفيذ هذه
الأسطح معًا:

- أنواع عقدة core في `src/<capability>/types.ts`
- مساعد runner/runtime في core في `src/<capability>/runtime.ts`
- سطح تسجيل Plugin API في `src/plugins/types.ts`
- توصيل سجل Plugin في `src/plugins/registry.ts`
- كشف Plugin runtime في `src/plugins/runtime/*` عندما تحتاج Plugins الميزات/القنوات إلى استهلاكها
- مساعدات الالتقاط/الاختبار في `src/test-utils/plugin-registration.ts`
- تأكيدات الملكية/العقدة في `src/plugins/contracts/registry.ts`
- وثائق المشغّل/Plugin في `docs/`

إذا كان أحد هذه الأسطح مفقودًا، فعادةً ما يكون ذلك علامة على أن القدرة
لم تُدمج بالكامل بعد.

### قالب القدرة

النمط الأدنى:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

نمط اختبار العقدة:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

وهذا يبقي القاعدة بسيطة:

- تملك core عقدة القدرة + orchestration
- تملك Plugins المورّدين تنفيذات المورّدين
- تستهلك Plugins الميزات/القنوات مساعدات وقت التشغيل
- تُبقي اختبارات العقدة الملكية صريحة

## ذو صلة

- [بنية Plugin](/ar/plugins/architecture) — نموذج الإمكانات العامة والأشكال
- [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
