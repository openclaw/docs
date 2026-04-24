---
read_when:
    - تنفيذ خطافات وقت تشغيل المزوّد، ودورة حياة القناة، أو حِزم الحزم
    - تصحيح ترتيب تحميل Plugin أو حالة السجل
    - إضافة قدرة جديدة لـ Plugin أو Plugin لمحرك السياق
summary: 'الواجهات الداخلية لمعمارية Plugin: مسار التحميل، السجل، خطافات وقت التشغيل، مسارات HTTP، والجداول المرجعية'
title: الواجهات الداخلية لمعمارية Plugin
x-i18n:
    generated_at: "2026-04-24T09:01:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9370788c5f986e9205b1108ae633e829edec8890e442a49f80d84bb0098bb393
    source_path: plugins/architecture-internals.md
    workflow: 15
---

للاطلاع على نموذج القدرات العام، وأشكال Plugin، وعقود الملكية/التنفيذ،
راجع [معمارية Plugin](/ar/plugins/architecture). هذه الصفحة هي المرجع
للآليات الداخلية: مسار التحميل، والسجل، وخطافات وقت التشغيل،
ومسارات HTTP الخاصة بـ Gateway، ومسارات الاستيراد، وجداول المخططات.

## مسار التحميل

عند بدء التشغيل، ينفّذ OpenClaw تقريبًا ما يلي:

1. اكتشاف جذور Plugin المرشحة
2. قراءة بيانات manifest للحزم الأصلية أو المتوافقة وبيانات package الوصفية
3. رفض المرشحين غير الآمنين
4. تطبيع إعدادات Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. تحديد حالة التمكين لكل مرشح
6. تحميل الوحدات الأصلية الممكّنة: تستخدم الوحدات المجمّعة المبنية مُحمّلًا أصليًا؛ وتستخدم Plugins الأصلية غير المبنية `jiti`
7. استدعاء خطافات `register(api)` الأصلية وجمع التسجيلات داخل سجل Plugin
8. إتاحة السجل لأسطح الأوامر/وقت التشغيل

<Note>
`activate` هو اسم بديل قديم لـ `register` — يحلّ المُحمّل أيهما موجود (`def.register ?? def.activate`) ويستدعيه في النقطة نفسها. تستخدم جميع Plugins المجمّعة `register`; ويفضّل استخدام `register` في Plugins الجديدة.
</Note>

تحدث بوابات الأمان **قبل** تنفيذ وقت التشغيل. ويُحظر المرشحون
عندما يفلت المدخل من جذر Plugin، أو يكون المسار قابلاً للكتابة من الجميع، أو
تبدو ملكية المسار مريبة بالنسبة إلى Plugins غير المجمّعة.

### سلوك manifest أولًا

يُعد manifest مصدر الحقيقة لمستوى التحكم. ويستخدمه OpenClaw من أجل:

- تحديد Plugin
- اكتشاف القنوات/Skills/مخطط الإعدادات المصرّح بها أو قدرات الحزمة
- التحقق من `plugins.entries.<id>.config`
- تعزيز التسميات/العناصر النائبة في واجهة Control
- عرض بيانات التثبيت/الفهرس الوصفية
- الحفاظ على واصفات تفعيل وإعداد منخفضة الكلفة دون تحميل وقت تشغيل Plugin

بالنسبة إلى Plugins الأصلية، تكون وحدة وقت التشغيل هي جزء مستوى البيانات. فهي تسجّل
السلوك الفعلي مثل الخطافات، والأدوات، والأوامر، أو تدفقات المزوّد.

تظل الكتلتان الاختياريتان `activation` و`setup` في manifest ضمن مستوى التحكم.
وهما واصفات وصفية فقط لتخطيط التفعيل واكتشاف الإعداد؛
ولا تستبدلان التسجيل في وقت التشغيل، أو `register(...)`، أو `setupEntry`.
ويستخدم أول مستهلكي التفعيل الفعليين الآن تلميحات الأوامر والقنوات والمزوّدات في manifest
لتضييق تحميل Plugin قبل إنشاء السجل الأوسع:

- يضيّق تحميل CLI إلى Plugins التي تملك الأمر الأساسي المطلوب
- يضيّق إعداد القناة/تحليل Plugin إلى Plugins التي تملك
  معرّف القناة المطلوب
- يضيّق تحليل الإعداد/وقت التشغيل الصريح للمزوّد إلى Plugins التي تملك
  معرّف المزوّد المطلوب

يكشف مخطّط التفعيل كلاً من API خاص بالمعرّفات فقط للمستدعين الحاليين و
API خاص بالخطة للتشخيصات الجديدة. وتوضح إدخالات الخطة سبب اختيار Plugin ما،
مع فصل تلميحات المخطّط الصريحة `activation.*` عن الرجوع الاحتياطي لملكية manifest
مثل `providers` و`channels` و`commandAliases` و`setup.providers`
و`contracts.tools` والخطافات. ويُعد هذا الفصل في الأسباب حدّ التوافق:
إذ تستمر بيانات Plugin الوصفية الحالية في العمل، بينما يمكن للشيفرة الجديدة اكتشاف التلميحات الواسعة
أو سلوك الرجوع الاحتياطي دون تغيير دلالات التحميل في وقت التشغيل.

يفضّل اكتشاف الإعداد الآن المعرّفات المملوكة للواصفات مثل `setup.providers` و
`setup.cliBackends` لتضييق Plugins المرشحة قبل الرجوع إلى
`setup-api` بالنسبة إلى Plugins التي ما تزال تحتاج إلى خطافات وقت تشغيل أثناء الإعداد. وإذا ادّعى
أكثر من Plugin مكتشَف واحد ملكية معرّف موحّد لمزوّد إعداد أو واجهة CLI خلفية،
فإن البحث عن الإعداد يرفض المالك الملتبس بدلًا من الاعتماد على ترتيب الاكتشاف.

### ما الذي يخزّنه المُحمّل مؤقتًا

يحتفظ OpenClaw بذاكرات مؤقتة قصيرة داخل العملية من أجل:

- نتائج الاكتشاف
- بيانات سجل manifest
- سجلات Plugins المحمّلة

تقلّل هذه الذواكر المؤقتة من كلفة الاندفاعات عند بدء التشغيل ومن عبء الأوامر المتكررة. ومن الآمن
اعتبارها ذواكر مؤقتة قصيرة العمر للأداء، وليست تخزينًا دائمًا.

ملاحظة حول الأداء:

- اضبط `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` أو
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` لتعطيل هذه الذواكر المؤقتة.
- اضبط نوافذ الذاكرة المؤقتة باستخدام `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` و
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## نموذج السجل

لا تقوم Plugins المحمّلة بتعديل متغيرات أساسية عشوائية في النواة مباشرةً. بل تسجّل في
سجل Plugin مركزي.

يتتبّع السجل ما يلي:

- سجلات Plugin (الهوية، والمصدر، والمنشأ، والحالة، والتشخيصات)
- الأدوات
- الخطافات القديمة والخطافات المكتوبة
- القنوات
- المزوّدات
- معالجات Gateway RPC
- مسارات HTTP
- مسجّلات CLI
- الخدمات الخلفية
- الأوامر المملوكة لـ Plugin

ثم تقرأ الميزات الأساسية من ذلك السجل بدلًا من التحدث إلى وحدات Plugin
مباشرةً. وهذا يُبقي التحميل باتجاه واحد:

- وحدة Plugin -> التسجيل في السجل
- وقت التشغيل الأساسي -> استهلاك السجل

ويهم هذا الفصل من ناحية قابلية الصيانة. فهو يعني أن معظم أسطح النواة تحتاج فقط
إلى نقطة تكامل واحدة: "اقرأ السجل"، وليس "أنشئ معالجة خاصة لكل وحدة Plugin".

## استدعاءات ربط المحادثة

يمكن لـ Plugins التي تربط محادثةً أن تتفاعل عند حسم الموافقة.

استخدم `api.onConversationBindingResolved(...)` لتلقي استدعاء بعد الموافقة على
طلب ربط أو رفضه:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // توجد الآن عملية ربط لهذا Plugin + هذه المحادثة.
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

- `status`: `"approved"` أو `"denied"`
- `decision`: `"allow-once"` أو `"allow-always"` أو `"deny"`
- `binding`: الربط المحسوم للطلبات الموافق عليها
- `request`: ملخص الطلب الأصلي، وتلميح الفصل، ومعرّف المرسل، و
  بيانات المحادثة الوصفية

هذا الاستدعاء مخصّص للإشعار فقط. ولا يغيّر الجهة المسموح لها بربط
محادثة، ويعمل بعد انتهاء معالجة الموافقة الأساسية.

## خطافات وقت تشغيل المزوّد

تتكون Plugins المزوّد من ثلاث طبقات:

- **بيانات manifest الوصفية** لبحث منخفض الكلفة قبل وقت التشغيل: `providerAuthEnvVars`,
  و`providerAuthAliases`, و`providerAuthChoices`, و`channelEnvVars`.
- **خطافات وقت الإعداد**: `catalog` (الاسم القديم `discovery`) بالإضافة إلى
  `applyConfigDefaults`.
- **خطافات وقت التشغيل**: أكثر من 40 خطافًا اختياريًا تغطي
  المصادقة، وتحليل النموذج، وتغليف البث، ومستويات التفكير، وسياسة الإعادة، ونقاط نهاية الاستخدام. راجع
  القائمة الكاملة ضمن [ترتيب الخطافات واستخدامها](#hook-order-and-usage).

ما يزال OpenClaw يملك حلقة الوكيل العامة، والتبديل الاحتياطي، ومعالجة النصوص، و
سياسة الأدوات. وهذه الخطافات هي سطح الامتداد الخاص بالسلوك المرتبط بالمزوّد
من دون الحاجة إلى نقل استدلال مخصص بالكامل.

استخدم `providerAuthEnvVars` في manifest عندما يملك المزوّد بيانات اعتماد معتمدة على env
يجب أن تراها مسارات المصادقة/الحالة/منتقي النماذج العامة دون تحميل وقت تشغيل Plugin.
واستخدم `providerAuthAliases` في manifest عندما يجب على معرّف مزوّد ما إعادة استخدام
متغيرات env الخاصة بمزوّد آخر، وملفات تعريف المصادقة، والمصادقة المعتمدة على الإعدادات، وخيار
التهيئة باستخدام مفتاح API. واستخدم `providerAuthChoices` في manifest عندما ينبغي لأسطح
CLI الخاصة بالإعداد/اختيار المصادقة أن تعرف معرّف خيار المزوّد، وتسميات المجموعات،
وتهيئة المصادقة البسيطة بعلم واحد من دون تحميل وقت تشغيل المزوّد. وأبقِ
`envVars` الخاصة بوقت تشغيل المزوّد لتلميحات موجّهة للمشغّل مثل تسميات الإعداد أو
متغيرات إعداد OAuth مثل client-id/client-secret.

استخدم `channelEnvVars` في manifest عندما تكون لدى القناة مصادقة أو إعداد يعتمد على env
يجب أن تراه آليات الرجوع العامة إلى shell-env، أو فحوصات config/status، أو مطالبات الإعداد
من دون تحميل وقت تشغيل القناة.

### ترتيب الخطافات واستخدامها

بالنسبة إلى Plugins النموذج/المزوّد، يستدعي OpenClaw الخطافات بهذا الترتيب التقريبي.
ويُعد العمود "متى تستخدمه" دليل القرار السريع.

| #   | الخطاف                              | ما الذي يفعله                                                                                                   | متى تستخدمه                                                                                                                                   |
| --- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                           | ينشر إعدادات المزوّد داخل `models.providers` أثناء توليد `models.json`                                          | عندما يملك المزوّد فهرسًا أو إعدادات افتراضية أساسية لـ URL                                                                                  |
| 2   | `applyConfigDefaults`               | يطبّق الإعدادات الافتراضية العامة المملوكة للمزوّد أثناء إنشاء الإعدادات                                         | عندما تعتمد الإعدادات الافتراضية على نمط المصادقة أو env أو دلالات عائلة نماذج المزوّد                                                      |
| --  | _(بحث النموذج المضمّن)_             | يحاول OpenClaw أولًا المسار العادي للسجل/الفهرس                                                                  | _(ليس خطاف Plugin)_                                                                                                                           |
| 3   | `normalizeModelId`                  | يطبّع الأسماء البديلة القديمة أو التجريبية لمعرّف النموذج قبل البحث                                              | عندما يملك المزوّد تنظيف الأسماء البديلة قبل التحليل القياسي لمعرّف النموذج                                                                  |
| 4   | `normalizeTransport`                | يطبّع `api` / `baseUrl` الخاص بعائلة المزوّد قبل التجميع العام للنموذج                                           | عندما يملك المزوّد تنظيف طبقة النقل لمعرّفات مزوّد مخصّصة ضمن عائلة النقل نفسها                                                              |
| 5   | `normalizeConfig`                   | يطبّع `models.providers.<id>` قبل تحليل وقت التشغيل/المزوّد                                                      | عندما يحتاج المزوّد إلى تنظيف الإعدادات بطريقة يجب أن تبقى مع Plugin؛ كما تدعم أدوات Google-family المجمّعة أيضًا إدخالات إعدادات Google المدعومة |
| 6   | `applyNativeStreamingUsageCompat`   | يطبّق تعديلات التوافق الخاصة باستخدام البث الأصلي على مزوّدات الإعدادات                                          | عندما يحتاج المزوّد إلى إصلاحات لبيانات وصفية لاستخدام البث الأصلي تعتمد على نقطة النهاية                                                    |
| 7   | `resolveConfigApiKey`               | يحلّ مصادقة env-marker لمزوّدات الإعدادات قبل تحميل مصادقة وقت التشغيل                                            | عندما يملك المزوّد تحليلًا مملوكًا له لمفتاح API عبر env-marker؛ كما يملك `amazon-bedrock` أيضًا محلّل AWS env-marker مضمّنًا هنا           |
| 8   | `resolveSyntheticAuth`              | يعرض مصادقة محلية/مستضافة ذاتيًا أو معتمدة على الإعدادات دون حفظ نص عادي                                          | عندما يستطيع المزوّد العمل باستخدام واسم اعتماد اصطناعي/محلي                                                                                 |
| 9   | `resolveExternalAuthProfiles`       | يضيف تراكبًا لملفات تعريف المصادقة الخارجية المملوكة للمزوّد؛ والقيمة الافتراضية لـ `persistence` هي `runtime-only` لبيانات الاعتماد المملوكة لـ CLI/التطبيق | عندما يعيد المزوّد استخدام بيانات اعتماد مصادقة خارجية من دون حفظ رموز تحديث منسوخة؛ صرّح عن `contracts.externalAuthProviders` في manifest |
| 10  | `shouldDeferSyntheticProfileAuth`   | يخفض أولوية العناصر النائبة المخزّنة لملفات التعريف الاصطناعية لصالح المصادقة المعتمدة على env/الإعدادات        | عندما يخزّن المزوّد ملفات تعريف اصطناعية نائبة يجب ألا تتقدّم في الأولوية                                                                     |
| 11  | `resolveDynamicModel`               | مزامنة رجوعية لمعرّفات النماذج المملوكة للمزوّد غير الموجودة بعد في السجل المحلي                                  | عندما يقبل المزوّد معرّفات نماذج علوية اعتباطية                                                                                               |
| 12  | `prepareDynamicModel`               | تهيئة غير متزامنة، ثم يُشغَّل `resolveDynamicModel` مرة أخرى                                                      | عندما يحتاج المزوّد إلى بيانات وصفية من الشبكة قبل تحليل المعرّفات غير المعروفة                                                               |
| 13  | `normalizeResolvedModel`            | إعادة كتابة نهائية قبل أن يستخدم المنفّذ المضمّن النموذج المحلَّل                                                | عندما يحتاج المزوّد إلى إعادة كتابة لطبقة النقل مع الاستمرار في استخدام طبقة نقل أساسية                                                      |
| 14  | `contributeResolvedModelCompat`     | يضيف أعلام توافق لنماذج المورّد الموجودة خلف طبقة نقل متوافقة أخرى                                                | عندما يتعرّف المزوّد على نماذجه الخاصة في طبقات نقل وسيطة من دون أن يتولى المزوّد نفسه                                                        |
| 15  | `capabilities`                      | بيانات وصفية للنصوص/الأدوات مملوكة للمزوّد وتستخدمها منطق النواة المشتركة                                         | عندما يحتاج المزوّد إلى خصائص خاصة بالنصوص أو بعائلة المزوّد                                                                                  |
| 16  | `normalizeToolSchemas`              | يطبّع مخططات الأدوات قبل أن يراها المنفّذ المضمّن                                                                  | عندما يحتاج المزوّد إلى تنظيف مخططات خاص بعائلة النقل                                                                                         |
| 17  | `inspectToolSchemas`                | يعرض تشخيصات المخططات المملوكة للمزوّد بعد التطبيع                                                                | عندما يريد المزوّد تحذيرات للكلمات المفتاحية من دون تعليم النواة قواعد خاصة بالمزوّد                                                         |
| 18  | `resolveReasoningOutputMode`        | يختار عقد مخرجات الاستدلال الأصلي مقابل الموسوم                                                                   | عندما يحتاج المزوّد إلى مخرجات استدلال/نهائية موسومة بدلًا من الحقول الأصلية                                                                  |
| 19  | `prepareExtraParams`                | تطبيع بارامترات الطلب قبل أغلفة خيارات البث العامة                                                                | عندما يحتاج المزوّد إلى بارامترات طلب افتراضية أو تنظيف بارامترات خاص بكل مزوّد                                                              |
| 20  | `createStreamFn`                    | يستبدل مسار البث العادي بالكامل بطبقة نقل مخصّصة                                                                   | عندما يحتاج المزوّد إلى بروتوكول نقل مخصّص بالكامل، وليس مجرد غلاف                                                                            |
| 21  | `wrapStreamFn`                      | غلاف للبث بعد تطبيق الأغلفة العامة                                                                                 | عندما يحتاج المزوّد إلى أغلفة توافق لرؤوس/جسم/نموذج الطلب من دون طبقة نقل مخصّصة                                                             |
| 22  | `resolveTransportTurnState`         | يرفق رؤوسًا أو بيانات وصفية أصلية خاصة بكل دورة نقل                                                               | عندما يريد المزوّد من طبقات النقل العامة إرسال هوية دورة أصلية خاصة بالمزوّد                                                                  |
| 23  | `resolveWebSocketSessionPolicy`     | يرفق رؤوس WebSocket أصلية أو سياسة تهدئة للجلسة                                                                    | عندما يريد المزوّد من طبقات WS العامة ضبط رؤوس الجلسة أو سياسة الرجوع الاحتياطي                                                                |
| 24  | `formatApiKey`                      | منسّق ملف تعريف المصادقة: يتحول ملف التعريف المخزّن إلى سلسلة `apiKey` الخاصة بوقت التشغيل                         | عندما يخزّن المزوّد بيانات مصادقة وصفية إضافية ويحتاج إلى شكل مخصص لرمز وقت التشغيل                                                           |
| 25  | `refreshOAuth`                      | تجاوز لتحديث OAuth لنقاط نهاية تحديث مخصّصة أو سياسة فشل التحديث                                                   | عندما لا يتوافق المزوّد مع محدّثات `pi-ai` المشتركة                                                                                            |
| 26  | `buildAuthDoctorHint`               | تلميح إصلاح يُضاف عند فشل تحديث OAuth                                                                              | عندما يحتاج المزوّد إلى إرشاد إصلاح مصادقة مملوك له بعد فشل التحديث                                                                            |
| 27  | `matchesContextOverflowError`       | مطابقة مملوكة للمزوّد لخطأ تجاوز نافذة السياق                                                                      | عندما يملك المزوّد أخطاء تجاوز خام قد تفوّتها الاستدلالات العامة                                                                                |
| 28  | `classifyFailoverReason`            | تصنيف مملوك للمزوّد لسبب التبديل الاحتياطي                                                                         | عندما يستطيع المزوّد ربط أخطاء API/النقل الخام بأسباب مثل حد المعدل/الحمولة الزائدة/إلخ                                                      |
| 29  | `isCacheTtlEligible`                | سياسة Prompt-cache لمزوّدات proxy/backhaul                                                                         | عندما يحتاج المزوّد إلى تقييد TTL خاص بالـ proxy                                                                                               |
| 30  | `buildMissingAuthMessage`           | بديل لرسالة استعادة المصادقة المفقودة العامة                                                                        | عندما يحتاج المزوّد إلى تلميح استعادة خاص بالمزوّد للمصادقة المفقودة                                                                            |
| 31  | `suppressBuiltInModel`              | إخفاء النماذج العلوية القديمة مع تلميح خطأ اختياري موجّه للمستخدم                                                  | عندما يحتاج المزوّد إلى إخفاء صفوف علوية قديمة أو استبدالها بتلميح خاص بالمورّد                                                               |
| 32  | `augmentModelCatalog`               | صفوف فهرس اصطناعية/نهائية تُضاف بعد الاكتشاف                                                                      | عندما يحتاج المزوّد إلى صفوف توافق أمامي اصطناعية في `models list` وأدوات الاختيار                                                             |
| 33  | `resolveThinkingProfile`            | يحدد مستوى `/think` الخاص بالنموذج، وتسميات العرض، والقيمة الافتراضية                                             | عندما يوفّر المزوّد سلم تفكير مخصصًا أو تسمية ثنائية للنماذج المحددة                                                                            |
| 34  | `isBinaryThinking`                  | خطاف توافق لتبديل الاستدلال تشغيل/إيقاف                                                                            | عندما يوفّر المزوّد تفكيرًا ثنائيًا تشغيل/إيقاف فقط                                                                                            |
| 35  | `supportsXHighThinking`             | خطاف توافق لدعم الاستدلال `xhigh`                                                                                 | عندما يريد المزوّد تفعيل `xhigh` فقط لمجموعة فرعية من النماذج                                                                                  |
| 36  | `resolveDefaultThinkingLevel`       | خطاف توافق لمستوى `/think` الافتراضي                                                                              | عندما يملك المزوّد سياسة `/think` الافتراضية لعائلة نماذج                                                                                     |
| 37  | `isModernModelRef`               | مطابِق النماذج الحديثة لمرشحات الملفات التعريفية الحية واختيار smoke                                           | عندما يملك المزوّد مطابقة النموذج المفضل للاختبارات الحية/smoke                                                                               |
| 38  | `prepareRuntimeAuth`             | يستبدل بيانات اعتماد مُعدّة مسبقًا بالرمز/المفتاح الفعلي لوقت التشغيل مباشرة قبل الاستدلال                    | عندما يحتاج المزوّد إلى تبادل رمز أو بيانات اعتماد طلب قصيرة العمر                                                                            |
| 39  | `resolveUsageAuth`               | يحل بيانات اعتماد الاستخدام/الفوترة الخاصة بـ `/usage` والأسطح المرتبطة بالحالة                                 | عندما يحتاج المزوّد إلى تحليل مخصص لرمز الاستخدام/الحصة أو إلى بيانات اعتماد استخدام مختلفة                                                   |
| 40  | `fetchUsageSnapshot`             | يجلب ويطبّع لقطات الاستخدام/الحصة الخاصة بالمزوّد بعد حلّ المصادقة                                              | عندما يحتاج المزوّد إلى نقطة نهاية استخدام خاصة به أو إلى محلّل حمولة                                                                          |
| 41  | `createEmbeddingProvider`        | يبني مُهايئ embeddings مملوكًا للمزوّد للذاكرة/البحث                                                           | عندما يكون سلوك embeddings الخاص بالذاكرة تابعًا لـ Plugin المزوّد                                                                            |
| 42  | `buildReplayPolicy`              | يعيد سياسة replay تتحكم في معالجة النصوص الخاصة بالمزوّد                                                       | عندما يحتاج المزوّد إلى سياسة نصوص مخصصة (مثل إزالة كتل التفكير)                                                                              |
| 43  | `sanitizeReplayHistory`          | يعيد كتابة سجل replay بعد التنظيف العام للنصوص                                                                 | عندما يحتاج المزوّد إلى إعادة كتابة replay خاصة به تتجاوز أدوات Compaction المشتركة                                                          |
| 44  | `validateReplayTurns`            | التحقق النهائي من دورات replay أو إعادة تشكيلها قبل المنفّذ المضمّن                                            | عندما تحتاج طبقة نقل المزوّد إلى تحقق أكثر صرامة من الدورات بعد التنقية العامة                                                                 |
| 45  | `onModelSelected`                | ينفّذ آثارًا جانبية لاحقة للاختيار مملوكة للمزوّد                                                               | عندما يحتاج المزوّد إلى telemetry أو حالة مملوكة له عند تفعيل نموذج ما                                                                          |

يتحقق `normalizeModelId` و`normalizeTransport` و`normalizeConfig` أولًا من
Plugin المزوّد المطابق، ثم ينتقل إلى Plugins المزوّد الأخرى القادرة على استخدام الخطافات
إلى أن يغيّر أحدها فعليًا معرّف النموذج أو النقل/الإعدادات. ويحافظ ذلك على
عمل طبقات alias/compat الوسيطة للمزوّد من دون مطالبة المستدعي بمعرفة أي Plugin
مجمّع يملك إعادة الكتابة. وإذا لم يُعِد أي خطاف مزوّد كتابة
إدخال إعدادات مدعوم من Google-family، فسيظل مطبّع إعدادات Google المجمّع يطبّق
تنظيف التوافق هذا.

إذا كان المزوّد يحتاج إلى بروتوكول نقل مخصص بالكامل أو منفّذ طلبات مخصص،
فهذه فئة مختلفة من الامتداد. هذه الخطافات مخصّصة لسلوك المزوّد الذي
يستمر في العمل ضمن حلقة الاستدلال العادية في OpenClaw.

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

تجمع Plugins المزوّد المجمّعة بين الخطافات أعلاه لتلبية احتياجات كل مورّد في
الفهرس، والمصادقة، والتفكير، وreplay، والاستخدام. وتوجد مجموعة الخطافات المعتمدة مع
كل Plugin ضمن `extensions/`; وتعرض هذه الصفحة الأشكال بدلًا من
عكس القائمة كما هي.

<AccordionGroup>
  <Accordion title="مزوّدات فهرس تمريري">
    تسجّل OpenRouter وKilocode وZ.AI وxAI `catalog` بالإضافة إلى
    `resolveDynamicModel` / `prepareDynamicModel` حتى تتمكن من إظهار معرّفات
    النماذج العلوية قبل الفهرس الثابت في OpenClaw.
  </Accordion>
  <Accordion title="مزوّدات OAuth ونقطة نهاية الاستخدام">
    تقرن GitHub Copilot وGemini CLI وChatGPT Codex وMiniMax وXiaomi وz.ai
    `prepareRuntimeAuth` أو `formatApiKey` مع `resolveUsageAuth` +
    `fetchUsageSnapshot` لتتولى تبادل الرموز والتكامل مع `/usage`.
  </Accordion>
  <Accordion title="عائلات replay وتنظيف النصوص">
    تتيح العائلات المسماة المشتركة (`google-gemini` و`passthrough-gemini`
    و`anthropic-by-model` و`hybrid-anthropic-openai`) للمزوّدات الاشتراك في
    سياسة النصوص عبر `buildReplayPolicy` بدلًا من إعادة تنفيذ التنظيف في
    كل Plugin.
  </Accordion>
  <Accordion title="مزوّدات تعتمد على الفهرس فقط">
    تسجّل `byteplus` و`cloudflare-ai-gateway` و`huggingface` و`kimi-coding` و`nvidia`
    و`qianfan` و`synthetic` و`together` و`venice` و`vercel-ai-gateway` و
    `volcengine` فقط `catalog` وتعتمد على حلقة الاستدلال المشتركة.
  </Accordion>
  <Accordion title="أدوات بث خاصة بـ Anthropic">
    توجد رؤوس Beta، و`/fast` / `serviceTier`، و`context1m` داخل
    واجهة `api.ts` / `contract-api.ts` العامة الخاصة بـ Plugin Anthropic
    (`wrapAnthropicProviderStream` و`resolveAnthropicBetas`
    و`resolveAnthropicFastMode` و`resolveAnthropicServiceTier`) بدلًا من
    SDK العامة.
  </Accordion>
</AccordionGroup>

## أدوات وقت التشغيل

يمكن لـ Plugins الوصول إلى أدوات أساسية محددة عبر `api.runtime`. بالنسبة إلى TTS:

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

- يعيد `textToSpeech` حمولة خرج TTS الأساسية العادية لأسطح الملفات/الملاحظات الصوتية.
- يستخدم إعداد `messages.tts` الأساسي واختيار المزوّد.
- يعيد مخزن PCM صوتيًا + معدل العيّنة. ويجب على Plugins إعادة أخذ العينات/الترميز للمزوّدات.
- `listVoices` اختياري لكل مزوّد. استخدمه لمنتقيات الأصوات أو تدفقات الإعداد المملوكة للمورّد.
- يمكن أن تتضمن قوائم الأصوات بيانات وصفية أغنى مثل اللغة المحلية، والجنس، ووسوم الشخصية لمنتقيات تراعي المزوّد.
- يدعم OpenAI وElevenLabs الاتصال الهاتفي اليوم. أما Microsoft فلا يدعمه.

يمكن لـ Plugins أيضًا تسجيل مزوّدي الكلام عبر `api.registerSpeechProvider(...)`.

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

- أبقِ سياسة TTS، والرجوع الاحتياطي، وتسليم الردود داخل النواة.
- استخدم مزوّدي الكلام لسلوك التوليف المملوك للمورّد.
- يُطبَّع الإدخال القديم `edge` الخاص بـ Microsoft إلى معرّف المزوّد `microsoft`.
- نموذج الملكية المفضّل موجّه نحو الشركة: يمكن لـ Plugin واحد خاص بالمورّد أن يملك
  مزوّدي النص، والكلام، والصورة، ووسائط مستقبلية أخرى كلما أضاف OpenClaw
  عقود القدرات تلك.

لفهم الصورة/الصوت/الفيديو، تسجّل Plugins مزوّدًا واحدًا مكتوبًا
لفهم الوسائط بدلًا من حقيبة عامة من أزواج المفتاح/القيمة:

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

- أبقِ التنسيق، والرجوع الاحتياطي، والإعدادات، وربط القنوات داخل النواة.
- أبقِ سلوك المورّد داخل Plugin المزوّد.
- يجب أن يظل التوسع الإضافي مكتوبًا: أساليب اختيارية جديدة، وحقول نتائج اختيارية جديدة، وقدرات اختيارية جديدة.
- يتبع توليد الفيديو النمط نفسه بالفعل:
  - تملك النواة عقد القدرة وأداة وقت التشغيل
  - تسجّل Plugins المورّد `api.registerVideoGenerationProvider(...)`
  - تستهلك Plugins الميزة/القناة `api.runtime.videoGeneration.*`

بالنسبة إلى أدوات وقت تشغيل فهم الوسائط، يمكن لـ Plugins استدعاء:

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

وبالنسبة إلى نسخ الصوت، يمكن لـ Plugins استخدام وقت تشغيل فهم الوسائط
أو الاسم البديل الأقدم STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // اختياري عندما لا يمكن استنتاج MIME بشكل موثوق:
  mime: "audio/ogg",
});
```

ملاحظات:

- يُعد `api.runtime.mediaUnderstanding.*` السطح المشترك المفضّل
  لفهم الصورة/الصوت/الفيديو.
- يستخدم إعداد الصوت الأساسي لفهم الوسائط (`tools.media.audio`) وترتيب الرجوع الاحتياطي للمزوّد.
- يعيد `{ text: undefined }` عندما لا يُنتَج أي خرج نسخ (مثلًا إذا كان الإدخال متخطًى/غير مدعوم).
- يبقى `api.runtime.stt.transcribeAudioFile(...)` اسمًا بديلًا للتوافق.

يمكن لـ Plugins أيضًا تشغيل عمليات Subagent خلفية عبر `api.runtime.subagent`:

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

- `provider` و`model` هما تجاوزان اختياريان لكل تشغيل، وليسا تغييرات جلسة دائمة.
- لا يطبّق OpenClaw حقول التجاوز هذه إلا للمستدعين الموثوقين.
- بالنسبة إلى عمليات الرجوع الاحتياطي المملوكة لـ Plugin، يجب على المشغّلين تفعيل ذلك صراحةً عبر `plugins.entries.<id>.subagent.allowModelOverride: true`.
- استخدم `plugins.entries.<id>.subagent.allowedModels` لتقييد Plugins الموثوقة بأهداف `provider/model` القياسية المحددة، أو `"*"` للسماح الصريح بأي هدف.
- تظل عمليات Subagent الخاصة بـ Plugins غير الموثوقة تعمل، لكن تُرفض طلبات التجاوز بدلًا من الرجوع الاحتياطي بصمت.

بالنسبة إلى البحث على الويب، يمكن لـ Plugins استهلاك أداة وقت التشغيل المشتركة بدلًا من
الوصول إلى ربط أدوات الوكيل:

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

يمكن لـ Plugins أيضًا تسجيل مزوّدي البحث على الويب عبر
`api.registerWebSearchProvider(...)`.

ملاحظات:

- أبقِ اختيار المزوّد، وتحليل بيانات الاعتماد، ودلالات الطلبات المشتركة داخل النواة.
- استخدم مزوّدي البحث على الويب لطبقات النقل الخاصة بالمورّد.
- يُعد `api.runtime.webSearch.*` السطح المشترك المفضّل لPlugins الميزات/القنوات التي تحتاج إلى سلوك بحث من دون الاعتماد على غلاف أداة الوكيل.

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

- `generate(...)`: يولّد صورة باستخدام سلسلة مزوّد توليد الصور المهيّأة.
- `listProviders(...)`: يسرد مزوّدي توليد الصور المتاحين وقدراتهم.

## مسارات HTTP الخاصة بـ Gateway

يمكن لـ Plugins كشف نقاط نهاية HTTP باستخدام `api.registerHttpRoute(...)`.

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

- `path`: مسار route ضمن خادم HTTP الخاص بـ Gateway.
- `auth`: مطلوب. استخدم `"gateway"` لطلب مصادقة Gateway العادية، أو `"plugin"` للمصادقة/التحقق من Webhook الذي يديره Plugin.
- `match`: اختياري. `"exact"` (الافتراضي) أو `"prefix"`.
- `replaceExisting`: اختياري. يسمح لـ Plugin نفسه باستبدال تسجيل مساره الحالي.
- `handler`: أعِد `true` عندما يكون المسار قد عالج الطلب.

ملاحظات:

- أُزيل `api.registerHttpHandler(...)` وسيسبب خطأ في تحميل Plugin. استخدم `api.registerHttpRoute(...)` بدلًا منه.
- يجب على مسارات Plugin التصريح عن `auth` صراحةً.
- تُرفض تعارضات `path + match` المتطابقة ما لم يكن `replaceExisting: true`، ولا يمكن لـ Plugin واحد استبدال مسار Plugin آخر.
- تُرفض المسارات المتداخلة ذات مستويات `auth` المختلفة. أبقِ سلاسل التمرير `exact`/`prefix` ضمن مستوى المصادقة نفسه فقط.
- لا تتلقى مسارات `auth: "plugin"` نطاقات وقت تشغيل المشغّل تلقائيًا. فهي مخصّصة لـ Webhooks/التحقق من التوقيع الذي يديره Plugin، وليست لاستدعاءات Gateway المساعدة ذات الامتيازات.
- تعمل مسارات `auth: "gateway"` داخل نطاق وقت تشغيل طلب Gateway، لكن هذا النطاق متحفظ عمدًا:
  - تبقي مصادقة bearer بالمفتاح السري المشترك (`gateway.auth.mode = "token"` / `"password"`) نطاقات وقت تشغيل مسار Plugin مثبتة عند `operator.write`، حتى لو أرسل المستدعي `x-openclaw-scopes`
  - أوضاع HTTP الموثوقة الحاملة للهوية (مثل `trusted-proxy` أو `gateway.auth.mode = "none"` على مدخل خاص) لا تكرّم `x-openclaw-scopes` إلا عندما يكون الرأس موجودًا صراحةً
  - إذا كان `x-openclaw-scopes` غائبًا في طلبات مسار Plugin الحاملة للهوية تلك، يعود نطاق وقت التشغيل إلى `operator.write`
- القاعدة العملية: لا تفترض أن مسار Plugin ذي مصادقة gateway هو سطح إدارة ضمني. إذا كان مسارك يحتاج إلى سلوك مخصص للمشرف فقط، فاشترط وضع مصادقة حاملًا للهوية ووثّق عقد الرأس `x-openclaw-scopes` الصريح.

## مسارات استيراد Plugin SDK

استخدم المسارات الفرعية الضيقة في SDK بدلًا من البرميل الجذري الأحادي `openclaw/plugin-sdk`
عند تأليف Plugins جديدة. المسارات الفرعية الأساسية:

| المسار الفرعي                         | الغرض                                              |
| ------------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`    | بدائيات تسجيل Plugin                               |
| `openclaw/plugin-sdk/channel-core`    | أدوات إدخال/بناء القنوات                           |
| `openclaw/plugin-sdk/core`            | أدوات مشتركة عامة والعقد المظلّي                   |
| `openclaw/plugin-sdk/config-schema`   | مخطط Zod الجذري لـ `openclaw.json` (`OpenClawSchema`) |

تختار Plugins القنوات من عائلة من الأسطح الضيقة — `channel-setup`,
و`setup-runtime`, و`setup-adapter-runtime`, و`setup-tools`, و`channel-pairing`,
و`channel-contract`, و`channel-feedback`, و`channel-inbound`, و`channel-lifecycle`,
و`channel-reply-pipeline`, و`command-auth`, و`secret-input`, و`webhook-ingress`,
و`channel-targets`, و`channel-actions`. يجب أن يوحَّد سلوك الموافقة
حول عقد `approvalCapability` واحد بدلًا من المزج عبر حقول Plugin
غير المرتبطة. راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins).

توجد أدوات وقت التشغيل والإعدادات ضمن مسارات فرعية مطابقة من نوع `*-runtime`
(`approval-runtime`, و`config-runtime`, و`infra-runtime`, و`agent-runtime`,
و`lazy-runtime`, و`directory-runtime`, و`text-runtime`, و`runtime-store`، وغيرها).

<Info>
`openclaw/plugin-sdk/channel-runtime` مهمل — وهو طبقة توافقية لـ
Plugins الأقدم. يجب أن تستورد الشيفرة الجديدة بدائيات عامة أضيق بدلًا من ذلك.
</Info>

نقاط الدخول الداخلية في المستودع (لكل جذر حزمة Plugin مجمّعة):

- `index.js` — إدخال Plugin المجمّع
- `api.js` — برميل الأدوات/الأنواع
- `runtime-api.js` — برميل خاص بوقت التشغيل فقط
- `setup-entry.js` — إدخال Plugin الإعداد

يجب على Plugins الخارجية أن تستورد فقط مسارات `openclaw/plugin-sdk/*` الفرعية. لا
تستورد أبدًا `src/*` من حزمة Plugin أخرى من النواة أو من Plugin آخر.
وتفضّل نقاط الدخول المحمّلة عبر الواجهة لقطة إعدادات وقت التشغيل النشطة عندما
تكون موجودة، ثم تعود إلى ملف الإعدادات المحلول على القرص.

توجد مسارات فرعية خاصة بالقدرات مثل `image-generation` و`media-understanding`
و`speech` لأن Plugins المجمّعة تستخدمها اليوم. وهي ليست تلقائيًا عقودًا خارجية
ثابتة طويلة الأمد — راجع صفحة مرجع SDK ذات الصلة عند الاعتماد عليها.

## مخططات أدوات الرسائل

يجب أن تملك Plugins مساهمات مخطط `describeMessageTool(...)` الخاصة بالقنوات
للوحدات غير الرسائلية مثل التفاعلات، وعلامات القراءة، والاستطلاعات.
ويجب أن يستخدم عرض الإرسال المشترك عقد `MessagePresentation` العام
بدلًا من حقول الأزرار أو المكونات أو الكتل أو البطاقات الأصلية الخاصة بالمزوّد.
راجع [Message Presentation](/ar/plugins/message-presentation) لمعرفة العقد،
وقواعد الرجوع الاحتياطي، وربط المزوّد، وقائمة التحقق الخاصة بمؤلف Plugin.

تصرّح Plugins القادرة على الإرسال بما يمكنها عرضه من خلال قدرات الرسائل:

- `presentation` لكتل العرض الدلالية (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` لطلبات التسليم المثبّت

تقرر النواة ما إذا كانت ستعرض هذا التمثيل عرضًا أصليًا أم ستخفّضه إلى نص.
لا تكشف منافذ هروب لواجهات المستخدم الأصلية الخاصة بالمزوّد من أداة الرسائل العامة.
وتظل أدوات SDK المهملة للمخططات الأصلية القديمة مُصدّرة من أجل Plugins الأطراف الثالثة الحالية، لكن يجب ألا تستخدمها Plugins الجديدة.

## تحليل أهداف القنوات

يجب أن تملك Plugins القنوات دلالات الأهداف الخاصة بالقناة. أبقِ المضيف
الصادر المشترك عامًا، واستخدم سطح مُهايئ المراسلة لقواعد المزوّد:

- يحدد `messaging.inferTargetChatType({ to })` ما إذا كان الهدف الموحّد
  يجب التعامل معه كـ `direct` أو `group` أو `channel` قبل البحث في الدليل.
- يوضح `messaging.targetResolver.looksLikeId(raw, normalized)` للنواة ما إذا كان
  الإدخال يجب أن يتجاوز مباشرة إلى التحليل الشبيه بالمعرّف بدلًا من البحث في الدليل.
- يمثّل `messaging.targetResolver.resolveTarget(...)` رجوع Plugin الاحتياطي عندما
  تحتاج النواة إلى تحليل نهائي مملوك للمزوّد بعد التطبيع أو بعد
  فشل البحث في الدليل.
- يملك `messaging.resolveOutboundSessionRoute(...)` إنشاء مسار الجلسة
  الخاص بالمزوّد بعد تحليل الهدف.

التقسيم الموصى به:

- استخدم `inferTargetChatType` لقرارات التصنيف التي يجب أن تحدث قبل
  البحث عن الأقران/المجموعات.
- استخدم `looksLikeId` لفحوصات "تعامل مع هذا على أنه معرّف هدف صريح/أصلي".
- استخدم `resolveTarget` لرجوع التطبيع الاحتياطي الخاص بالمزوّد، وليس
  للبحث الواسع في الدليل.
- أبقِ المعرّفات الأصلية الخاصة بالمزوّد مثل معرّفات الدردشة، ومعرّفات السلاسل، وJIDs،
  والمقابض، ومعرّفات الغرف داخل قيم `target` أو البارامترات الخاصة بالمزوّد، لا في
  حقول SDK العامة.

## الأدلة المعتمدة على الإعدادات

يجب أن تبقي Plugins التي تشتق إدخالات الدليل من الإعدادات هذا المنطق داخل
Plugin وأن تعيد استخدام الأدوات المشتركة من
`openclaw/plugin-sdk/directory-runtime`.

استخدم هذا عندما تحتاج قناة إلى أقران/مجموعات معتمدة على الإعدادات مثل:

- أقران DM المعتمدين على allowlist
- خرائط القنوات/المجموعات المهيّأة
- بدائل دليل ثابتة ضمن نطاق الحساب

لا تتعامل الأدوات المشتركة في `directory-runtime` إلا مع العمليات العامة:

- تصفية الاستعلام
- تطبيق الحد
- أدوات إزالة التكرار/التطبيع
- بناء `ChannelDirectoryEntry[]`

يجب أن يبقى فحص الحساب الخاص بالقناة وتطبيع المعرّفات داخل تنفيذ Plugin.

## فهارس المزوّدين

يمكن لـ Plugins المزوّدين تعريف فهارس نماذج للاستدلال باستخدام
`registerProvider({ catalog: { run(...) { ... } } })`.

يعيد `catalog.run(...)` الشكل نفسه الذي يكتبه OpenClaw داخل
`models.providers`:

- `{ provider }` لإدخال مزوّد واحد
- `{ providers }` لعدة إدخالات مزوّدين

استخدم `catalog` عندما يملك Plugin معرّفات نماذج خاصة بالمزوّد، أو
إعدادات `base URL` الافتراضية، أو بيانات وصفية للنماذج مقيدة بالمصادقة.

يتحكم `catalog.order` في وقت دمج فهرس Plugin مقارنةً بمزوّدي OpenClaw
الضمنيين المضمّنين:

- `simple`: مزوّدات تعتمد على مفتاح API عادي أو على env
- `profile`: مزوّدات تظهر عندما توجد ملفات تعريف المصادقة
- `paired`: مزوّدات تُنشئ عدة إدخالات مزوّد مترابطة
- `late`: التمريرة الأخيرة، بعد بقية المزوّدين الضمنيين

تنتصر المزوّدات اللاحقة عند تعارض المفاتيح، لذا يمكن لـ Plugins أن تتعمد
تجاوز إدخال مزوّد مضمّن باستخدام معرّف المزوّد نفسه.

التوافق:

- ما يزال `discovery` يعمل كاسم بديل قديم
- إذا سُجّل كل من `catalog` و`discovery`، يستخدم OpenClaw `catalog`

## فحص القنوات للقراءة فقط

إذا كان Plugin الخاص بك يسجّل قناة، ففضّل تنفيذ
`plugin.config.inspectAccount(cfg, accountId)` إلى جانب `resolveAccount(...)`.

السبب:

- `resolveAccount(...)` هو مسار وقت التشغيل. ويُسمح له بافتراض أن بيانات الاعتماد
  قد جرى تجسيدها بالكامل، ويمكنه الفشل سريعًا عند غياب الأسرار المطلوبة.
- لا ينبغي لمسارات الأوامر للقراءة فقط مثل `openclaw status`، و`openclaw status --all`،
  و`openclaw channels status`، و`openclaw channels resolve`، وعمليات doctor/config
  repair أن تحتاج إلى تجسيد بيانات اعتماد وقت التشغيل لمجرد
  وصف الإعدادات.

السلوك الموصى به لـ `inspectAccount(...)`:

- أعِد فقط حالة حساب وصفية.
- حافظ على `enabled` و`configured`.
- ضمّن حقول مصدر/حالة بيانات الاعتماد عند الاقتضاء، مثل:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- لا تحتاج إلى إعادة قيم الرموز الخام فقط للإبلاغ عن
  الإتاحة في القراءة فقط. يكفي إرجاع `tokenStatus: "available"` (وحقل المصدر المطابق)
  لأوامر نمط الحالة.
- استخدم `configured_unavailable` عندما تكون بيانات الاعتماد مهيأة عبر SecretRef لكن
  غير متاحة في مسار الأمر الحالي.

يسمح هذا لأوامر القراءة فقط بالإبلاغ عن "مهيأ ولكن غير متاح في مسار الأمر هذا"
بدلًا من التعطل أو الإبلاغ الخاطئ عن أن الحساب غير مهيأ.

## حِزم الحزم

قد يتضمن دليل Plugin ملف `package.json` يحوي `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

يصبح كل إدخال Plugin. وإذا سردت الحزمة عدة extensions، فإن معرّف Plugin
يصبح `name/<fileBase>`.

إذا كان Plugin الخاص بك يستورد تبعيات npm، فثبّتها في هذا الدليل حتى
يصبح `node_modules` متاحًا (`npm install` / `pnpm install`).

حاجز أمان: يجب أن يبقى كل إدخال في `openclaw.extensions` داخل دليل Plugin
بعد تحليل الروابط الرمزية. وتُرفض الإدخالات التي تخرج من دليل الحزمة.

ملاحظة أمنية: يثبّت `openclaw plugins install` تبعيات Plugin باستخدام
`npm install --omit=dev --ignore-scripts` (من دون نصوص دورة حياة، ومن دون تبعيات تطوير في وقت التشغيل). حافظ على أشجار تبعيات Plugin
"JavaScript/TypeScript خالصة" وتجنب الحزم التي تتطلب بناء `postinstall`.

اختياري: يمكن أن يشير `openclaw.setupEntry` إلى وحدة خفيفة مخصّصة للإعداد فقط.
عندما يحتاج OpenClaw إلى أسطح إعداد لقناة Plugin معطلة، أو
عندما تكون قناة Plugin مفعّلة ولكنها غير مهيأة بعد، فإنه يحمّل `setupEntry`
بدلًا من إدخال Plugin الكامل. وهذا يُبقي بدء التشغيل والإعداد أخف
عندما يكون إدخال Plugin الرئيسي لديك يربط أيضًا أدوات أو خطافات أو
شيفرة أخرى خاصة بوقت التشغيل فقط.

اختياري: يمكن أن يفعّل `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
لقناة Plugin مسار `setupEntry` نفسه أثناء
مرحلة بدء التشغيل قبل الاستماع في Gateway، حتى عندما تكون القناة مهيأة بالفعل.

استخدم هذا فقط عندما يغطي `setupEntry` بالكامل سطح بدء التشغيل الذي يجب أن يوجد
قبل أن يبدأ Gateway في الاستماع. وعمليًا، يعني ذلك أن إدخال الإعداد
يجب أن يسجّل كل قدرة مملوكة للقناة يعتمد عليها بدء التشغيل، مثل:

- تسجيل القناة نفسه
- أي مسارات HTTP يجب أن تكون متاحة قبل أن يبدأ Gateway في الاستماع
- أي أساليب Gateway أو أدوات أو خدمات يجب أن توجد خلال تلك النافذة نفسها

إذا كان إدخالك الكامل لا يزال يملك أي قدرة مطلوبة عند بدء التشغيل، فلا تفعّل
هذا العلم. وأبقِ Plugin على السلوك الافتراضي ودَع OpenClaw يحمّل
الإدخال الكامل أثناء بدء التشغيل.

يمكن للقنوات المجمّعة أيضًا نشر أدوات سطح عقد للإعداد فقط يمكن للنواة
الرجوع إليها قبل تحميل وقت تشغيل القناة الكامل. وسطح ترقية الإعداد
الحالي هو:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

تستخدم النواة هذا السطح عندما تحتاج إلى ترقية إعداد قناة قديم ذي حساب واحد
إلى `channels.<id>.accounts.*` من دون تحميل إدخال Plugin الكامل.
وتُعد Matrix المثال المجمّع الحالي: فهي تنقل فقط مفاتيح المصادقة/التمهيد
إلى حساب مُرقّى مسمّى عندما تكون الحسابات المسمّاة موجودة بالفعل، ويمكنها
الحفاظ على مفتاح حساب افتراضي غير قياسي مهيأ بدلًا من إنشاء
`accounts.default` دائمًا.

تُبقي مُهايئات التصحيح الخاصة بالإعداد هذه اكتشاف أسطح العقود المجمّعة كسولًا.
ويبقى وقت الاستيراد خفيفًا؛ ويُحمَّل سطح الترقية فقط عند أول استخدام بدلًا من
إعادة الدخول إلى بدء تشغيل القناة المجمّعة عند استيراد الوحدة.

عندما تتضمن أسطح بدء التشغيل هذه أساليب Gateway RPC، فأبقها ضمن
بادئة خاصة بـ Plugin. وتظل مساحات أسماء الإدارة الأساسية (`config.*`,
و`exec.approvals.*`, و`wizard.*`, و`update.*`) محجوزة وتُحل دائمًا إلى
`operator.admin`، حتى إذا طلب Plugin نطاقًا أضيق.

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

### البيانات الوصفية لفهرس القنوات

يمكن لـ Plugins القنوات الإعلان عن بيانات وصفية خاصة بالإعداد/الاكتشاف عبر `openclaw.channel` و
تلميحات التثبيت عبر `openclaw.install`. وهذا يُبقي بيانات فهرس النواة خالية من البيانات.

مثال:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (مستضاف ذاتيًا)",
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

حقول `openclaw.channel` المفيدة إلى جانب المثال الأدنى:

- `detailLabel`: تسمية ثانوية لأسطح الفهرس/الحالة الأكثر ثراءً
- `docsLabel`: تجاوز نص الرابط الخاص برابط الوثائق
- `preferOver`: معرّفات Plugin/قنوات ذات أولوية أقل يجب أن يتفوق عليها إدخال الفهرس هذا
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: عناصر تحكم نصية خاصة بسطح الاختيار
- `markdownCapable`: يعلّم القناة على أنها قادرة على استخدام Markdown لقرارات التنسيق الصادر
- `exposure.configured`: إخفاء القناة من أسطح سرد القنوات المهيأة عند ضبطه على `false`
- `exposure.setup`: إخفاء القناة من منتقيات الإعداد/التهيئة التفاعلية عند ضبطه على `false`
- `exposure.docs`: تعليم القناة على أنها داخلية/خاصة لأسطح التنقل في الوثائق
- `showConfigured` / `showInSetup`: أسماء بديلة قديمة ما تزال مقبولة للتوافق؛ ويفضّل استخدام `exposure`
- `quickstartAllowFrom`: يضم القناة إلى تدفق `allowFrom` القياسي في البدء السريع
- `forceAccountBinding`: يفرض ربط حساب صريحًا حتى عند وجود حساب واحد فقط
- `preferSessionLookupForAnnounceTarget`: يفضّل البحث عن الجلسة عند تحليل أهداف الإعلان

يمكن لـ OpenClaw أيضًا دمج **فهارس قنوات خارجية** (مثلًا، تصدير سجل
MPM). ضع ملف JSON في أحد المواقع التالية:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

أو وجّه `OPENCLAW_PLUGIN_CATALOG_PATHS` (أو `OPENCLAW_MPM_CATALOG_PATHS`) إلى
ملف JSON واحد أو أكثر (مفصولة بفواصل/فواصل منقوطة/محدِّد `PATH`). يجب أن يحتوي كل ملف
على `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. ويقبل المحلّل أيضًا
`"packages"` أو `"plugins"` كأسماء بديلة قديمة للمفتاح `"entries"`.

تكشف إدخالات فهرس القنوات المُولّدة وإدخالات فهرس تثبيت المزوّدين
حقائق مطبّعة لمصدر التثبيت إلى جانب كتلة `openclaw.install` الخام. وتحدّد
الحقائق المطبّعة ما إذا كان npm spec إصدارًا مطابقًا تمامًا أو محددًا عائمًا،
وما إذا كانت بيانات السلامة المتوقعة موجودة، وما إذا كان مسار مصدر محلي
متاحًا أيضًا. ويجب على المستهلكين التعامل مع `installSource` باعتباره
حقلًا اختياريًا إضافيًا حتى لا تضطر الإدخالات الأقدم المبنية يدويًا وطبقات التوافق
إلى توليده. ويتيح ذلك لعمليات الإعداد والتشخيصات شرح
حالة مستوى المصدر من دون استيراد وقت تشغيل Plugin.

يجب أن تفضّل إدخالات npm الخارجية الرسمية `npmSpec` مطابقًا تمامًا بالإضافة إلى
`expectedIntegrity`. ولا تزال أسماء الحزم المجردة وdist-tags تعمل
للتوافق، لكنها تُظهر تحذيرات على مستوى المصدر بحيث يمكن للفهرس أن يتجه
نحو تثبيتات مثبتة ومتحقق من سلامتها دون كسر Plugins الحالية.
وعند التثبيت أثناء الإعداد من مسار فهرس محلي، يُسجَّل
إدخال `plugins.installs` مع `source: "path"` و`sourcePath`
نسبي لمساحة العمل عندما يكون ذلك ممكنًا. ويبقى مسار التحميل التشغيلي المطلق في
`plugins.load.paths`; ويتجنب سجل التثبيت تكرار مسارات محطة العمل المحلية
داخل إعدادات طويلة الأمد. ويحافظ ذلك على ظهور تثبيتات التطوير المحلية في
تشخيصات مستوى المصدر من دون إضافة سطح كشف ثانٍ خام لمسار نظام الملفات.

## Plugins لمحرك السياق

تملك Plugins محرك السياق تنسيق سياق الجلسة لعمليات الإدخال، والتجميع،
وCompaction. سجّلها من Plugin الخاص بك باستخدام
`api.registerContextEngine(id, factory)`، ثم اختر المحرك النشط عبر
`plugins.slots.contextEngine`.

استخدم هذا عندما يحتاج Plugin الخاص بك إلى استبدال مسار السياق الافتراضي
أو توسيعه بدلًا من مجرد إضافة بحث في الذاكرة أو خطافات.

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

إذا كان المحرك **لا** يملك خوارزمية Compaction، فأبقِ `compact()`
منفذة وفوّضها صراحةً:

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

عندما يحتاج Plugin إلى سلوك لا يلائم API الحالية، فلا تتجاوز
نظام Plugin عبر وصول خاص داخلي. أضف القدرة الناقصة.

التسلسل الموصى به:

1. تعريف العقد الأساسي
   حدّد السلوك المشترك الذي ينبغي أن تملكه النواة: السياسة، والرجوع الاحتياطي، ودمج الإعدادات،
   ودورة الحياة، والدلالات المواجهة للقنوات، وشكل أداة وقت التشغيل.
2. إضافة أسطح تسجيل/وقت تشغيل مكتوبة لـ Plugin
   وسّع `OpenClawPluginApi` و/أو `api.runtime` بأصغر
   سطح قدرة مكتوب ومفيد.
3. ربط النواة + مستهلكي القنوات/الميزات
   يجب أن تستهلك القنوات وPlugins الميزات القدرة الجديدة من خلال النواة،
   لا عبر استيراد تنفيذ خاص بمورّد مباشرة.
4. تسجيل تنفيذات المورّدين
   بعد ذلك تسجّل Plugins المورّدين الواجهات الخلفية الخاصة بها مقابل القدرة.
5. إضافة تغطية للعقد
   أضف اختبارات حتى تبقى الملكية وشكل التسجيل واضحين مع مرور الوقت.

هكذا يحافظ OpenClaw على نهجه الواضح من دون أن يصبح مقيدًا
برؤية مزوّد واحد للعالم. راجع [دليل Cookbook للقدرات](/ar/plugins/architecture)
للحصول على قائمة ملفات عملية ومثال كامل.

### قائمة التحقق للقدرات

عندما تضيف قدرة جديدة، يجب عادةً أن يلمس التنفيذ هذه
الأسطح معًا:

- أنواع العقد الأساسية في `src/<capability>/types.ts`
- المشغّل/أداة وقت التشغيل الأساسية في `src/<capability>/runtime.ts`
- سطح تسجيل Plugin API في `src/plugins/types.ts`
- ربط سجل Plugin في `src/plugins/registry.ts`
- كشف وقت تشغيل Plugin في `src/plugins/runtime/*` عندما تحتاج Plugins
  الميزات/القنوات إلى استهلاكه
- أدوات الالتقاط/الاختبار في `src/test-utils/plugin-registration.ts`
- تأكيدات الملكية/العقد في `src/plugins/contracts/registry.ts`
- وثائق المشغّل/Plugin في `docs/`

إذا كان أحد هذه الأسطح مفقودًا، فغالبًا ما تكون هذه علامة على أن القدرة
لم تُدمج بالكامل بعد.

### قالب القدرة

النمط الأدنى:

```ts
// العقد الأساسي
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// Plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// أداة وقت تشغيل مشتركة لPlugins الميزات/القنوات
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

نمط اختبار العقد:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

وهذا يبقي القاعدة بسيطة:

- تملك النواة عقد القدرة + التنسيق
- تملك Plugins المورّدين التنفيذات الخاصة بالمورّد
- تستهلك Plugins الميزات/القنوات أدوات وقت التشغيل
- تُبقي اختبارات العقد الملكية واضحة

## ذو صلة

- [معمارية Plugin](/ar/plugins/architecture) — نموذج القدرات العام والأشكال
- [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
