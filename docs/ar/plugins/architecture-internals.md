---
read_when:
    - تنفيذ hooks وقت تشغيل المزوّد أو دورة حياة القناة أو حزم packages
    - تصحيح أخطاء ترتيب تحميل Plugin أو حالة السجل
    - إضافة قدرة Plugin جديدة أو Plugin لمحرك السياق
summary: 'البنية الداخلية للـ Plugin: مسار التحميل، والسجل، وhooks وقت التشغيل، ومسارات HTTP، والجداول المرجعية'
title: البنية الداخلية للـ Plugin
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:35:17Z"
  model: gpt-5.4
  provider: openai
  source_hash: 9a435e118dc6acbacd44008f0b1c47b51da32dc3f17c24fe4c99f75c8cbd9311
  source_path: plugins/architecture-internals.md
  workflow: 15
---

بالنسبة إلى نموذج القدرات العام، وأشكال الـ Plugin، وعقود الملكية/التنفيذ،
راجع [بنية Plugin](/ar/plugins/architecture). هذه الصفحة هي
المرجع للآليات الداخلية: مسار التحميل، والسجل، وhooks وقت التشغيل،
ومسارات Gateway HTTP، ومسارات الاستيراد، وجداول schema.

## مسار التحميل

عند بدء التشغيل، ينفذ OpenClaw تقريبًا ما يلي:

1. اكتشاف جذور Plugin المرشحة
2. قراءة manifests الخاصة بالحزم الأصلية أو المتوافقة وبيانات package metadata
3. رفض المرشحين غير الآمنين
4. تطبيع إعدادات Plugin ‏(`plugins.enabled` و`allow` و`deny` و`entries` و
   `slots` و`load.paths`)
5. تحديد حالة التمكين لكل مرشح
6. تحميل الوحدات الأصلية المُمكّنة: تستخدم الوحدات المضمّنة المبنية native loader؛
   أما Plugins الأصلية غير المبنية فتستخدم jiti
7. استدعاء hooks الأصلية `register(api)` وجمع التسجيلات في سجل Plugin
8. إتاحة السجل لأسطح الأوامر/وقت التشغيل

<Note>
تُعد `activate` اسمًا بديلًا قديمًا لـ `register` — إذ يحلّل المحمّل أيهما موجود (`def.register ?? def.activate`) ويستدعيه في النقطة نفسها. تستخدم جميع Plugins المضمّنة `register`؛ لذلك فضّل `register` في Plugins الجديدة.
</Note>

تحدث بوابات الأمان **قبل** التنفيذ أثناء runtime. ويُحظر المرشحون
عندما يفلت entry من جذر Plugin، أو يكون المسار قابلاً للكتابة من الجميع، أو
تبدو ملكية المسار مثيرة للشبهات بالنسبة إلى Plugins غير المضمّنة.

### سلوك manifest-first

يُعد manifest هو مصدر الحقيقة في control plane. ويستخدمه OpenClaw من أجل:

- تحديد Plugin
- اكتشاف القنوات/Skills/schema الإعدادات أو قدرات الحزمة المعلنة
- التحقق من `plugins.entries.<id>.config`
- زيادة labels/placeholders في Control UI
- عرض بيانات التثبيت/الفهرس الوصفية
- الحفاظ على واصفات التنشيط والإعداد الرخيصة دون تحميل runtime الخاصة بـ Plugin

بالنسبة إلى Plugins الأصلية، تُعد وحدة runtime هي جزء data plane. وهي التي تسجل
السلوك الفعلي مثل hooks أو الأدوات أو الأوامر أو تدفقات المزوّد.

تبقى كتلتا manifest الاختياريتان `activation` و`setup` ضمن control plane.
وهما واصفات بيانات وصفية فقط لتخطيط التنشيط واكتشاف الإعداد؛
ولا تستبدلان تسجيل runtime أو `register(...)` أو `setupEntry`.
أما أوائل المستهلكين للتنشيط الحي فيستخدمون الآن تلميحات الأوامر والقنوات والمزوّدين في manifest
لتضييق تحميل Plugin قبل بناء السجل الأوسع:

- يضيّق تحميل CLI إلى Plugins التي تملك الأمر الأساسي المطلوب
- يضيّق حل إعداد/Plugin الخاصة بالقناة إلى Plugins التي تملك
  معرّف القناة المطلوب
- يضيّق حل إعداد/وقت تشغيل المزوّد الصريح إلى Plugins التي تملك
  معرّف المزوّد المطلوب

يعرّض مخطّط التنشيط كلًا من API خاصة بالمعرّفات فقط للمستدعين الحاليين وواجهة
خطة للمعلومات التشخيصية الجديدة. وتبلغ إدخالات الخطة عن سبب اختيار Plugin،
مع فصل تلميحات المخطّط الصريحة `activation.*` عن احتياطي الملكية في manifest
مثل `providers` و`channels` و`commandAliases` و`setup.providers`
و`contracts.tools` وhooks. ويُعد هذا الفصل في الأسباب حدّ التوافق:
إذ تستمر بيانات Plugin الوصفية الحالية في العمل، بينما يمكن للكود الجديد اكتشاف
التلميحات الواسعة أو السلوك الاحتياطي دون تغيير دلالات التحميل أثناء runtime.

ويُفضِّل اكتشاف الإعداد الآن المعرّفات المملوكة للواصفات مثل `setup.providers` و
`setup.cliBackends` لتضييق Plugins المرشحة قبل الرجوع إلى
`setup-api` بالنسبة إلى Plugins التي ما تزال تحتاج إلى hooks runtime وقت الإعداد. وتستخدم
قوائم إعداد المزوّد manifest `providerAuthChoices` وخيارات الإعداد المشتقة من الواصفات
وبيانات install-catalog الوصفية من دون تحميل runtime الخاصة بالمزوّد. ويُعد
`setup.requiresRuntime: false` الصريح حدًا خاصًا بالواصفات فقط؛ أما حذف
`requiresRuntime` فيُبقي fallback القديمة الخاصة بـ setup-api من أجل التوافق. وإذا ادعت
أكثر من Plugin مكتشفة واحدة ملكية معرّف مهيأ لمزوّد الإعداد نفسه أو CLI backend نفسه،
فإن lookup الإعداد يرفض هذا المالك الملتبس بدل الاعتماد على
ترتيب الاكتشاف. وعندما تُنفَّذ runtime الخاصة بالإعداد، تُبلغ تشخيصات السجل
عن الانجراف بين `setup.providers` / `setup.cliBackends` وبين المزوّدين أو
CLI backends المسجّلة بواسطة setup-api من دون حظر Plugins القديمة.

### ما الذي يخبئه المحمّل مؤقتًا

يحتفظ OpenClaw بذاكرات مؤقتة قصيرة داخل العملية من أجل:

- نتائج الاكتشاف
- بيانات manifest registry
- سجلات Plugins المحمّلة

تقلّل هذه الذاكرات المؤقتة من عبء بدء التشغيل المتكرر وتكرار تكلفة الأوامر. ومن الآمن
التفكير فيها باعتبارها ذاكرات مؤقتة قصيرة العمر للأداء، لا تخزينًا دائمًا.

ملاحظة أداء:

- اضبط `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` أو
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` لتعطيل هذه الذواكر المؤقتة.
- اضبط نوافذ التخزين المؤقت باستخدام `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` و
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## نموذج السجل

لا تعدّل Plugins المحمّلة عشوائيًا globals الخاصة بالنواة مباشرةً. بل تسجّل ضمن
سجل Plugin مركزي.

يتتبع السجل ما يلي:

- سجلات Plugins ‏(الهوية، والمصدر، والمنشأ، والحالة، والتشخيصات)
- الأدوات
- hooks القديمة وhooks المُنمطة
- القنوات
- المزوّدون
- معالجات Gateway RPC
- مسارات HTTP
- مسجلات CLI
- الخدمات الخلفية
- الأوامر المملوكة لـ Plugin

ثم تقرأ ميزات النواة من هذا السجل بدلًا من التحدث إلى وحدات Plugin مباشرةً.
ويحافظ هذا على التحميل في اتجاه واحد:

- وحدة Plugin ← التسجيل في السجل
- runtime الخاصة بالنواة ← استهلاك السجل

وهذا الفصل مهم من أجل سهولة الصيانة. إذ يعني أن معظم أسطح النواة
تحتاج فقط إلى نقطة تكامل واحدة: "اقرأ السجل"، وليس "اعمل حالة خاصة لكل وحدة Plugin".

## استدعاءات ربط المحادثة

يمكن للـ Plugins التي تربط محادثة أن تتفاعل عند حل الموافقة.

استخدم `api.onConversationBindingResolved(...)` لتلقي استدعاء
بعد الموافقة على طلب الربط أو رفضه:

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
- `request`: ملخص الطلب الأصلي، وتلميح الفصل، ومعرّف المرسل، وبيانات المحادثة الوصفية

هذا الاستدعاء مخصص للإشعارات فقط. ولا يغيّر من المسموح له بربط محادثة،
ويعمل بعد انتهاء معالجة الموافقة في النواة.

## hooks وقت تشغيل المزوّد

تملك Plugins الخاصة بالمزوّد ثلاث طبقات:

- **بيانات manifest الوصفية** من أجل lookup رخيص قبل runtime:
  `setup.providers[].envVars`، والتوافق القديم المهجور `providerAuthEnvVars`,
  و`providerAuthAliases`، و`providerAuthChoices`، و`channelEnvVars`.
- **hooks وقت الإعدادات**: ‏`catalog` (القديم `discovery`) بالإضافة إلى
  `applyConfigDefaults`.
- **hooks وقت التشغيل**: أكثر من 40 hook اختيارية تغطي
  المصادقة، وحل النموذج، وتغليف التدفقات، ومستويات التفكير، وسياسة replay، ونقاط نهاية الاستخدام. راجع
  القائمة الكاملة تحت [ترتيب hook والاستخدام](#hook-order-and-usage).

لا يزال OpenClaw يملك الحلقة العامة للوكيل، وfailover، ومعالجة السجل النصي، وسياسة
الأدوات. وتُعد هذه hooks هي سطح التوسعة للسلوك الخاص بالمزوّد من دون
الحاجة إلى نقل استدلال مخصص بالكامل.

استخدم manifest `setup.providers[].envVars` عندما يملك المزوّد بيانات اعتماد
مبنية على env ويجب أن تراها مسارات auth/status/model-picker العامة من دون
تحميل runtime الخاصة بـ Plugin. ولا يزال `providerAuthEnvVars` المهجور
يُقرأ بواسطة محول التوافق خلال نافذة الإهمال، وتتلقى Plugins غير المضمّنة
التي تستخدمه تشخيصًا في manifest. واستخدم manifest `providerAuthAliases`
عندما يجب أن يعيد معرّف مزوّد واحد استخدام env vars أو auth profiles أو
المصادقة المعتمدة على config أو اختيار onboarding لمفتاح API الخاصة بمعرّف مزوّد آخر. واستخدم manifest
`providerAuthChoices` عندما يجب أن تعرف أسطح CLI الخاصة بـ onboarding/auth-choice
معرّف خيار المزوّد، وتسميات المجموعات، وربط المصادقة البسيط ذي العلامة الواحدة من دون
تحميل runtime الخاصة بالمزوّد. وأبقِ `envVars` في runtime الخاصة بالمزوّد
لتلميحات المشغّل مثل labels الخاصة بـ onboarding أو متغيرات
إعداد OAuth client-id/client-secret.

استخدم manifest `channelEnvVars` عندما تكون لدى القناة مصادقة أو إعدادات
تعتمد على env ويجب أن تراها shell-env fallback العامة، أو فحوصات config/status، أو prompts الخاصة بالإعداد
من دون تحميل runtime الخاصة بالقناة.

### ترتيب hook والاستخدام

بالنسبة إلى Plugins النماذج/المزوّدين، يستدعي OpenClaw hooks بهذا الترتيب التقريبي.
ويمثل العمود "متى تستخدمه" دليل القرار السريع.

| #   | Hook                              | ما الذي تفعله                                                                                                  | متى تستخدمها                                                                                                                                  |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | نشر إعدادات المزوّد داخل `models.providers` أثناء إنشاء `models.json`                                         | عندما يملك المزوّد فهرسًا أو إعدادات افتراضية لـ base URL                                                                                     |
| 2   | `applyConfigDefaults`             | تطبيق الإعدادات الافتراضية العامة المملوكة للمزوّد أثناء إنشاء الإعدادات                                       | عندما تعتمد الإعدادات الافتراضية على وضع المصادقة أو env أو دلالات عائلة نماذج المزوّد                                                        |
| --  | _(البحث المضمّن عن النموذج)_      | يحاول OpenClaw أولًا مسار السجل/الفهرس العادي                                                                  | _(ليست hook خاصة بـ Plugin)_                                                                                                                  |
| 3   | `normalizeModelId`                | تطبيع الأسماء البديلة القديمة أو التجريبية لمعرّف النموذج قبل البحث                                            | عندما يملك المزوّد تنظيف الأسماء البديلة قبل الحل القياسي لمعرّف النموذج                                                                      |
| 4   | `normalizeTransport`              | تطبيع `api` / `baseUrl` الخاصة بعائلة المزوّد قبل تجميع النموذج العام                                          | عندما يملك المزوّد تنظيف النقل لمعرّفات مزوّد مخصصة ضمن عائلة النقل نفسها                                                                     |
| 5   | `normalizeConfig`                 | تطبيع `models.providers.<id>` قبل حل runtime/المزوّد                                                         | عندما يحتاج المزوّد إلى تنظيف الإعدادات بطريقة يجب أن تعيش مع Plugin؛ كما تدعم مساعدات Google-family المضمّنة إدخالات إعدادات Google المدعومة |
| 6   | `applyNativeStreamingUsageCompat` | تطبيق إعادة كتابة compat الخاصة بالاستخدام المتدفق الأصلي على مزوّدي الإعدادات                                 | عندما يحتاج المزوّد إلى إصلاحات لبيانات الاستخدام الوصفية الخاصة بالبث الأصلي والمدفوعة بنقطة النهاية                                          |
| 7   | `resolveConfigApiKey`             | حل مصادقة env-marker لمزوّدي الإعدادات قبل تحميل مصادقة runtime                                                | عندما يملك المزوّد حل API-key خاصًا به مبنيًا على env-marker؛ ويحتوي `amazon-bedrock` أيضًا على محلّل AWS env-marker مضمّن هنا               |
| 8   | `resolveSyntheticAuth`            | إظهار مصادقة محلية/مستضافة ذاتيًا أو مدعومة بالإعدادات دون حفظ نص واضح                                         | عندما يستطيع المزوّد العمل باستخدام علامة بيانات اعتماد اصطناعية/محلية                                                                        |
| 9   | `resolveExternalAuthProfiles`     | تراكب ملفات auth الخارجية المملوكة للمزوّد؛ والقيمة الافتراضية لـ `persistence` هي `runtime-only` لبيانات الاعتماد المملوكة للتطبيق/CLI | عندما يعيد المزوّد استخدام بيانات اعتماد auth الخارجية دون حفظ refresh tokens المنسوخة؛ وأعلن `contracts.externalAuthProviders` في manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | خفض أولوية العناصر النائبة الاصطناعية المخزنة في الملفات التعريفية خلف المصادقة المدعومة بـ env/config        | عندما يخزن المزوّد ملفات تعريف نائبة اصطناعية لا ينبغي أن تتقدم في الأولوية                                                                  |
| 11  | `resolveDynamicModel`             | fallback متزامن لمعرّفات النماذج المملوكة للمزوّد وغير الموجودة بعد في السجل المحلي                             | عندما يقبل المزوّد معرّفات نماذج علوية المصدر اعتباطية                                                                                        |
| 12  | `prepareDynamicModel`             | إحماء غير متزامن، ثم يُشغَّل `resolveDynamicModel` مرة أخرى                                                     | عندما يحتاج المزوّد إلى بيانات وصفية من الشبكة قبل حل المعرّفات غير المعروفة                                                                  |
| 13  | `normalizeResolvedModel`          | إعادة كتابة نهائية قبل أن يستخدم المشغّل المضمّن النموذج المحلول                                               | عندما يحتاج المزوّد إلى إعادة كتابة النقل لكنه لا يزال يستخدم نقلًا من النواة                                                                |
| 14  | `contributeResolvedModelCompat`   | الإسهام بعلامات compat لنماذج المورّد الموجودة خلف نقل متوافق آخر                                               | عندما يتعرف المزوّد على نماذجه الخاصة على وسائل نقل proxy من دون أن يتولى المزوّد نفسه                                                       |
| 15  | `capabilities`                    | بيانات وصفية يملكها المزوّد حول السجل النصي/الأدوات وتستخدمها منطق النواة المشترك                               | عندما يحتاج المزوّد إلى خصائص خاصة بالسجل النصي/عائلة المزوّد                                                                                  |
| 16  | `normalizeToolSchemas`            | تطبيع schemas الأدوات قبل أن يراها المشغّل المضمّن                                                             | عندما يحتاج المزوّد إلى تنظيف schema خاص بعائلة النقل                                                                                         |
| 17  | `inspectToolSchemas`              | إظهار تشخيصات schema المملوكة للمزوّد بعد التطبيع                                                               | عندما يريد المزوّد تحذيرات الكلمات المفتاحية من دون تعليم النواة قواعد خاصة بالمزوّد                                                         |
| 18  | `resolveReasoningOutputMode`      | اختيار عقد reasoning-output الأصلي مقابل العقد الموسوم                                                         | عندما يحتاج المزوّد إلى reasoning/final output موسومة بدلًا من الحقول الأصلية                                                                  |
| 19  | `prepareExtraParams`              | تطبيع معاملات الطلب قبل أغلفة خيارات البث العامة                                                               | عندما يحتاج المزوّد إلى معاملات طلب افتراضية أو تنظيف معاملات خاص بكل مزوّد                                                                   |
| 20  | `createStreamFn`                  | استبدال مسار البث العادي بالكامل بنقل مخصص                                                                      | عندما يحتاج المزوّد إلى بروتوكول wire مخصص، وليس مجرد غلاف                                                                                   |
| 21  | `wrapStreamFn`                    | غلاف للبث بعد تطبيق الأغلفة العامة                                                                              | عندما يحتاج المزوّد إلى أغلفة توافق للرؤوس/الحمولة/النموذج من دون نقل مخصص                                                                    |
| 22  | `resolveTransportTurnState`       | إرفاق رؤوس أو بيانات وصفية أصلية لكل دورة نقل                                                                   | عندما يريد المزوّد من وسائل النقل العامة إرسال هوية الدورة الأصلية الخاصة بالمزوّد                                                            |
| 23  | `resolveWebSocketSessionPolicy`   | إرفاق رؤوس WebSocket أصلية أو سياسة تبريد الجلسة                                                               | عندما يريد المزوّد من وسائل WS العامة ضبط رؤوس الجلسة أو سياسة fallback                                                                        |
| 24  | `formatApiKey`                    | منسق auth-profile: يتحول الملف التعريفي المخزن إلى سلسلة `apiKey` الخاصة بـ runtime                            | عندما يخزن المزوّد بيانات auth وصفية إضافية ويحتاج إلى شكل token مخصص أثناء runtime                                                           |
| 25  | `refreshOAuth`                    | تجاوز لتحديث OAuth لنقاط نهاية التحديث المخصصة أو سياسة فشل التحديث                                             | عندما لا يتوافق المزوّد مع أدوات التحديث المشتركة `pi-ai`                                                                                     |
| 26  | `buildAuthDoctorHint`             | تلميح إصلاح يُلحق عند فشل تحديث OAuth                                                                          | عندما يحتاج المزوّد إلى إرشاد إصلاح خاص به بعد فشل التحديث                                                                                    |
| 27  | `matchesContextOverflowError`     | مطابق يملكه المزوّد لأخطاء تجاوز نافذة السياق                                                                   | عندما يملك المزوّد أخطاء تجاوز خام لا تلتقطها الاستدلالات العامة                                                                              |
| 28  | `classifyFailoverReason`          | تصنيف سبب failover المملوك للمزوّد                                                                              | عندما يستطيع المزوّد ربط أخطاء API/النقل الخام بحالات مثل rate-limit/overload وما إلى ذلك                                                     |
| 29  | `isCacheTtlEligible`              | سياسة prompt-cache لمزوّدي proxy/backhaul                                                                      | عندما يحتاج المزوّد إلى بوابة TTL خاصة بالـ proxy                                                                                              |
| 30  | `buildMissingAuthMessage`         | بديل عن رسالة استعادة missing-auth العامة                                                                       | عندما يحتاج المزوّد إلى تلميح استعادة missing-auth خاص به                                                                                      |
| 31  | `suppressBuiltInModel`            | إخفاء النماذج القديمة في المنبع مع تلميح خطأ اختياري موجه للمستخدم                                              | عندما يحتاج المزوّد إلى إخفاء الصفوف القديمة في المنبع أو استبدالها بتلميح خاص بالمورّد                                                      |
| 32  | `augmentModelCatalog`             | صفوف فهرس اصطناعية/نهائية تُلحق بعد الاكتشاف                                                                   | عندما يحتاج المزوّد إلى صفوف forward-compat اصطناعية في `models list` وواجهات الاختيار                                                       |
| 33  | `resolveThinkingProfile`          | مجموعة مستويات `/think` الخاصة بالنموذج، وتسميات العرض، والقيمة الافتراضية                                     | عندما يوفّر المزوّد سلّم تفكير مخصصًا أو تسمية ثنائية لنماذج محددة                                                                             |
| 34  | `isBinaryThinking`                | hook توافق لتبديل reasoning تشغيل/إيقاف                                                                        | عندما يوفّر المزوّد reasoning ثنائية فقط تشغيل/إيقاف                                                                                           |
| 35  | `supportsXHighThinking`           | hook توافق لدعم reasoning بمستوى `xhigh`                                                                       | عندما يريد المزوّد `xhigh` فقط لمجموعة فرعية من النماذج                                                                                         |
| 36  | `resolveDefaultThinkingLevel`     | hook توافق لمستوى `/think` الافتراضي                                                                           | عندما يملك المزوّد سياسة `/think` الافتراضية لعائلة نماذج                                                                                      |
| 37  | `isModernModelRef`                | مطابق modern-model لمرشحات الملفات التعريفية الحية واختيار smoke                                              | عندما يملك المزوّد منطق مطابقة النماذج المفضلة لسيناريوهات live/smoke                                                                        |
| 38  | `prepareRuntimeAuth`              | استبدال بيانات الاعتماد المهيأة بالـ token/key الفعلية الخاصة بـ runtime مباشرة قبل الاستدلال                 | عندما يحتاج المزوّد إلى تبادل token أو بيانات اعتماد طلب قصيرة العمر                                                                          |
| 39  | `resolveUsageAuth`                | حل بيانات اعتماد الاستخدام/الفوترة لـ `/usage` وأس surfaces الحالة ذات الصلة                                  | عندما يحتاج المزوّد إلى تحليل token استخدام/حصة مخصص أو إلى بيانات اعتماد استخدام مختلفة                                                     |
| 40  | `fetchUsageSnapshot`              | جلب وتطبيع snapshots الاستخدام/الحصة الخاصة بالمزوّد بعد حل المصادقة                                           | عندما يحتاج المزوّد إلى نقطة نهاية استخدام خاصة به أو محلّل حمولة خاص به                                                                     |
| 41  | `createEmbeddingProvider`         | بناء محول embeddings مملوك للمزوّد من أجل الذاكرة/البحث                                                        | عندما يجب أن يكون سلوك embeddings الخاصة بالذاكرة تابعًا لـ Plugin المزوّد                                                                   |
| 42  | `buildReplayPolicy`               | إعادة سياسة replay تتحكم في معالجة السجل النصي للمزوّد                                                         | عندما يحتاج المزوّد إلى سياسة سجل نصي مخصصة (مثل إزالة كتل التفكير)                                                                          |
| 43  | `sanitizeReplayHistory`           | إعادة كتابة سجل replay بعد تنظيف السجل النصي العام                                                             | عندما يحتاج المزوّد إلى إعادة كتابة replay خاصة به تتجاوز مساعدات Compaction المشتركة                                                         |
| 44  | `validateReplayTurns`             | تحقق نهائي من أدوار replay أو إعادة تشكيلها قبل المشغّل المضمّن                                                | عندما يحتاج نقل المزوّد إلى تحقق أشد من الأدوار بعد التنقية العامة                                                                             |
| 45  | `onModelSelected`                 | تشغيل تأثيرات جانبية لاحقة للاختيار يملكها المزوّد                                                             | عندما يحتاج المزوّد إلى telemetry أو حالة يملكها هو عند تفعيل نموذج ما                                                                         |

تتحقق `normalizeModelId` و`normalizeTransport` و`normalizeConfig` أولًا من
Plugin المزوّد المطابقة، ثم تنتقل إلى Plugins المزوّد الأخرى القادرة على استخدام hooks
حتى تُجري إحداها فعليًا تغييرًا على معرّف النموذج أو النقل/الإعدادات. ويحافظ ذلك على
عمل طبقات alias/compat الخاصة بالمزوّد من دون أن يُطلب من المستدعي معرفة أي Plugin
مضمّنة تملك إعادة الكتابة. وإذا لم تعِد أي hook خاصة بالمزوّد كتابة إدخال إعدادات مدعوم
من Google-family، فسيظل مُطبِّع إعدادات Google المضمّن يطبق تنظيف التوافق ذاك.

إذا كان المزوّد يحتاج إلى بروتوكول wire مخصص بالكامل أو منفّذ طلبات مخصص،
فهذا نوع مختلف من التوسعة. فهذه hooks مخصصة لسلوك المزوّد
الذي لا يزال يعمل داخل حلقة الاستدلال العادية في OpenClaw.

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

تجمع Plugins المضمّنة الخاصة بالمزوّدين بين hooks المذكورة أعلاه لتناسب احتياجات
كل مورّد من الفهرسة والمصادقة والتفكير وreplay والاستخدام. وتوجد
المجموعة المعتمدة من hooks مع كل Plugin تحت `extensions/`؛ وتعرض
هذه الصفحة الأشكال بدلًا من نسخ القائمة كما هي.

<AccordionGroup>
  <Accordion title="مزوّدات الفهرسة الممرّرة">
    تسجل OpenRouter وKilocode وZ.AI وxAI كلًا من `catalog` بالإضافة إلى
    `resolveDynamicModel` / `prepareDynamicModel` حتى تتمكن من إظهار
    معرّفات النماذج من المنبع قبل الفهرس الثابت الخاص بـ OpenClaw.
  </Accordion>
  <Accordion title="مزوّدات OAuth ونقاط نهاية الاستخدام">
    تجمع GitHub Copilot وGemini CLI وChatGPT Codex وMiniMax وXiaomi وz.ai بين
    `prepareRuntimeAuth` أو `formatApiKey` مع `resolveUsageAuth` +
    `fetchUsageSnapshot` لامتلاك تبادل token وتكامل `/usage`.
  </Accordion>
  <Accordion title="عائلات replay وتنظيف السجل النصي">
    تسمح العائلات المسماة المشتركة (`google-gemini` و`passthrough-gemini` و
    `anthropic-by-model` و`hybrid-anthropic-openai`) للمزوّدين بالاشتراك في
    سياسة السجل النصي عبر `buildReplayPolicy` بدلًا من أن يعيد كل Plugin
    تنفيذ التنظيف.
  </Accordion>
  <Accordion title="مزوّدات الفهرس فقط">
    تسجل `byteplus` و`cloudflare-ai-gateway` و`huggingface` و`kimi-coding` و`nvidia` و
    `qianfan` و`synthetic` و`together` و`venice` و`vercel-ai-gateway` و
    `volcengine` فقط `catalog` وتستفيد من حلقة الاستدلال المشتركة.
  </Accordion>
  <Accordion title="مساعدات البث الخاصة بـ Anthropic">
    تعيش Beta headers و`/fast` / `serviceTier` و`context1m` داخل
    الواجهة العامة `api.ts` / `contract-api.ts` الخاصة بـ Plugin Anthropic
    (`wrapAnthropicProviderStream` و`resolveAnthropicBetas` و
    `resolveAnthropicFastMode` و`resolveAnthropicServiceTier`) بدلًا من
    SDK العامة.
  </Accordion>
</AccordionGroup>

## مساعدات وقت التشغيل

يمكن للـ Plugins الوصول إلى بعض مساعدات النواة المختارة عبر `api.runtime`. وبالنسبة إلى TTS:

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

- تعيد `textToSpeech` حمولة مخرجات TTS العادية من النواة لأسطح الملفات/الملاحظات الصوتية.
- تستخدم إعدادات `messages.tts` الخاصة بالنواة واختيار المزوّد.
- تعيد buffer صوت PCM + معدل العينة. ويجب على Plugins إعادة التعيين/الترميز من أجل المزوّدين.
- تكون `listVoices` اختيارية بحسب كل مزوّد. استخدمها لواجهات اختيار الأصوات أو تدفقات الإعداد التي يملكها المورّد.
- يمكن أن تتضمن قوائم الأصوات بيانات وصفية أغنى مثل locale والجنس ووسوم الشخصية من أجل أدوات اختيار تراعي المزوّد.
- يدعم كل من OpenAI وElevenLabs الاتصال الهاتفي اليوم. أما Microsoft فلا تدعم ذلك.

يمكن للـ Plugins أيضًا تسجيل مزوّدي الكلام عبر `api.registerSpeechProvider(...)`.

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

- أبقِ سياسة TTS وfallback وتسليم الردود في النواة.
- استخدم مزوّدي الكلام لسلوك التوليف الذي يملكه المورّد.
- يُطبَّع الإدخال القديم `edge` الخاص بـ Microsoft إلى معرّف المزوّد `microsoft`.
- نموذج الملكية المفضّل موجّه حسب الشركة: إذ يمكن لـ Plugin مورّد واحدة أن تملك
  مزوّدي النص والكلام والصورة ووسائط المستقبل مع إضافة OpenClaw لعقود تلك القدرات.

أما بالنسبة إلى فهم الصور/الصوت/الفيديو، فتسجل Plugins مزوّدًا typed واحدًا
لفهم الوسائط بدل حقيبة مفاتيح/قيم عامة:

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

- أبقِ orchestration وfallback والإعدادات وربط القنوات في النواة.
- أبقِ سلوك المورّد داخل Plugin المزوّد.
- يجب أن يبقى التوسع الإضافي typed: أساليب اختيارية جديدة، وحقول نتائج اختيارية جديدة، وقدرات اختيارية جديدة.
- يتبع توليد الفيديو النمط نفسه بالفعل:
  - تملك النواة عقد القدرة ومساعد runtime
  - تسجل Plugins المورّدين `api.registerVideoGenerationProvider(...)`
  - تستهلك Plugins الميزات/القنوات ‎`api.runtime.videoGeneration.*`

وبالنسبة إلى مساعدات runtime الخاصة بفهم الوسائط، يمكن للـ Plugins استدعاء:

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

أما بالنسبة إلى نسخ الصوت إلى نص، فيمكن للـ Plugins استخدام runtime الخاصة
بفهم الوسائط أو الاسم البديل الأقدم STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // اختياري عندما يتعذر استنتاج MIME بشكل موثوق:
  mime: "audio/ogg",
});
```

ملاحظات:

- يُعد `api.runtime.mediaUnderstanding.*` السطح المشترك المفضّل من أجل
  فهم الصور/الصوت/الفيديو.
- يستخدم إعدادات الصوت الخاصة بفهم الوسائط في النواة (`tools.media.audio`) وترتيب fallback الخاص بالمزوّد.
- يعيد `{ text: undefined }` عندما لا يُنتج أي خرج نسخ (مثل الإدخال المتجاوز/غير المدعوم).
- يبقى `api.runtime.stt.transcribeAudioFile(...)` اسمًا بديلًا للتوافق.

يمكن للـ Plugins أيضًا تشغيل تنفيذات subagent في الخلفية عبر `api.runtime.subagent`:

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

- يُعد `provider` و`model` تجاوزات اختيارية لكل تشغيل، وليسا تغييرات دائمة على الجلسة.
- لا يطبّق OpenClaw حقول التجاوز هذه إلا للمستدعين الموثوقين.
- بالنسبة إلى تشغيلات fallback المملوكة لـ Plugin، يجب أن يوافق المشغّلون صراحةً عبر `plugins.entries.<id>.subagent.allowModelOverride: true`.
- استخدم `plugins.entries.<id>.subagent.allowedModels` لتقييد Plugins الموثوقة بأهداف `provider/model` قياسية محددة، أو `"*"` للسماح الصريح بأي هدف.
- لا تزال تشغيلات subagent الخاصة بـ Plugin غير الموثوقة تعمل، لكن يتم رفض طلبات التجاوز بدلًا من الرجوع بصمت إلى fallback.

أما بالنسبة إلى البحث في الويب، فيمكن للـ Plugins استهلاك مساعد runtime المشترك بدل
النفاذ إلى ربط أداة الوكيل:

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

يمكن للـ Plugins أيضًا تسجيل مزوّدي بحث الويب عبر
`api.registerWebSearchProvider(...)`.

ملاحظات:

- أبقِ اختيار المزوّد وحل بيانات الاعتماد ودلالات الطلب المشتركة في النواة.
- استخدم مزوّدي بحث الويب لوسائل النقل الخاصة بالبحث التي يملكها المورّد.
- يُعد `api.runtime.webSearch.*` السطح المشترك المفضّل بالنسبة إلى Plugins الميزات/القنوات التي تحتاج إلى سلوك بحث دون الاعتماد على غلاف أداة الوكيل.

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

يمكن للـ Plugins تعريض نقاط نهاية HTTP باستخدام `api.registerHttpRoute(...)`.

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
- `auth`: مطلوب. استخدم `"gateway"` لطلب مصادقة gateway العادية، أو `"plugin"` لمصادقة/تحقق webhook المدار من قبل Plugin.
- `match`: اختياري. ‏`"exact"` (الافتراضي) أو `"prefix"`.
- `replaceExisting`: اختياري. يسمح لـ Plugin نفسها باستبدال تسجيل route موجود خاص بها.
- `handler`: أعد `true` عندما يكون المسار قد عالج الطلب.

ملاحظات:

- تمت إزالة `api.registerHttpHandler(...)` وستسبب خطأ تحميل Plugin. استخدم `api.registerHttpRoute(...)` بدلًا منها.
- يجب أن تعلن مسارات Plugin عن `auth` صراحةً.
- تُرفض تعارضات `path + match` التامة ما لم تكن `replaceExisting: true`، ولا يمكن لـ Plugin واحدة استبدال route تخص Plugin أخرى.
- تُرفض المسارات المتداخلة ذات مستويات `auth` المختلفة. وأبقِ سلاسل fallthrough الخاصة بـ `exact`/`prefix` على مستوى auth نفسه فقط.
- لا تتلقى المسارات `auth: "plugin"` **operator runtime scopes** تلقائيًا. فهي مخصصة لعمليات webhook/التحقق من التوقيع التي تديرها Plugin، وليس لاستدعاءات مساعدات Gateway ذات الامتيازات.
- تعمل المسارات `auth: "gateway"` داخل runtime خاص بنطاق طلب Gateway، لكن هذا النطاق محافظ عمدًا:
  - تُبقي مصادقة bearer بالسر المشترك (`gateway.auth.mode = "token"` / `"password"`) نطاقات runtime لمسارات Plugin مثبتة عند `operator.write`، حتى لو أرسل المستدعي `x-openclaw-scopes`
  - تحترم أوضاع HTTP الحاملة للهوية والموثوقة (مثل `trusted-proxy` أو `gateway.auth.mode = "none"` على private ingress) قيمة `x-openclaw-scopes` فقط عندما تكون الترويسة موجودة صراحةً
  - إذا كانت `x-openclaw-scopes` غائبة في طلبات Plugin-route الحاملة للهوية، فيعود نطاق runtime إلى `operator.write`
- القاعدة العملية: لا تفترض أن مسار Plugin موثق بمصادقة gateway هو سطح إدارة ضمني. فإذا كان مسارك يحتاج إلى سلوك خاص بالمسؤول فقط، فاطلب وضع مصادقة حاملًا للهوية ووثّق عقد الترويسة الصريحة `x-openclaw-scopes`.

## مسارات استيراد Plugin SDK

استخدم المسارات الفرعية الضيقة في SDK بدل الجذر البرميلي الأحادي
`openclaw/plugin-sdk` عند تأليف Plugins جديدة. المسارات الفرعية الأساسية:

| المسار الفرعي                         | الغرض                                             |
| ------------------------------------ | ------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`   | بدائيات تسجيل Plugin                              |
| `openclaw/plugin-sdk/channel-core`   | مساعدات إدخال/بناء القناة                         |
| `openclaw/plugin-sdk/core`           | مساعدات مشتركة عامة وعقد مظلي                     |
| `openclaw/plugin-sdk/config-schema`  | مخطط Zod الجذري لـ `openclaw.json` ‏(`OpenClawSchema`) |

تختار Plugins القنوات من عائلة من الواجهات الضيقة — `channel-setup`,
و`setup-runtime`، و`setup-adapter-runtime`، و`setup-tools`، و`channel-pairing`,
و`channel-contract`، و`channel-feedback`، و`channel-inbound`، و`channel-lifecycle`,
و`channel-reply-pipeline`، و`command-auth`، و`secret-input`، و`webhook-ingress`,
و`channel-targets`، و`channel-actions`. ويجب أن يتركز سلوك الموافقة
على عقد `approvalCapability` واحدة بدل مزجه عبر حقول Plugin غير المرتبطة.
راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins).

توجد مساعدات runtime والإعدادات تحت مسارات فرعية مقابلة `*-runtime`
(`approval-runtime`، و`config-runtime`، و`infra-runtime`، و`agent-runtime`,
و`lazy-runtime`، و`directory-runtime`، و`text-runtime`، و`runtime-store`، وغيرها).

<Info>
المسار `openclaw/plugin-sdk/channel-runtime` مهجور — وهو طبقة توافق
للـ Plugins الأقدم. ويجب أن يستورد الكود الجديد بدائيات عامة أضيق بدلًا منه.
</Info>

نقاط الدخول الداخلية في المستودع (لكل جذر حزمة Plugin مضمّنة):

- `index.js` — نقطة دخول Plugin المضمّنة
- `api.js` — برميل المساعدات/الأنواع
- `runtime-api.js` — برميل runtime فقط
- `setup-entry.js` — نقطة دخول Plugin للإعداد

يجب على Plugins الخارجية أن تستورد فقط المسارات الفرعية `openclaw/plugin-sdk/*`.
ولا تستورد أبدًا `src/*` الخاصة بحزمة Plugin أخرى من النواة أو من Plugin أخرى.
وتفضّل نقاط الدخول المحمّلة عبر facade لقطة الإعدادات النشطة الخاصة بـ runtime عندما
توجد، ثم تعود إلى ملف الإعدادات المحلول على القرص.

توجد مسارات فرعية خاصة بالقدرات مثل `image-generation` و`media-understanding`
و`speech` لأن Plugins المضمّنة تستخدمها اليوم. لكنها ليست تلقائيًا عقودًا خارجية
مجمّدة على المدى الطويل — راجع صفحة مرجع SDK ذات الصلة عند الاعتماد عليها.

## مخططات أدوات الرسائل

يجب أن تملك Plugins مساهمات schema الخاصة بـ `describeMessageTool(...)`
الخاصة بالقنوات من أجل العناصر غير الرسائلية مثل التفاعلات وإيصالات القراءة والاستطلاعات.
ويجب أن تستخدم بنية الإرسال المشتركة عقد `MessagePresentation` العامة
بدل حقول الأزرار أو المكوّنات أو الكتل أو البطاقات الأصلية الخاصة بالمزوّد.
راجع [Message Presentation](/ar/plugins/message-presentation) للاطلاع على العقد
وقواعد fallback وربط المزوّد وقائمة التحقق الخاصة بمؤلف Plugin.

تُعلن Plugins القادرة على الإرسال عما يمكنها عرضه من خلال message capabilities:

- `presentation` من أجل كتل العرض الدلالية (`text` و`context` و`divider` و`buttons` و`select`)
- `delivery-pin` لطلبات التسليم المثبّتة

تقرر النواة ما إذا كانت ستعرض البنية بشكل أصلي أو ستخفضها إلى نص.
ولا تعرّض منافذ هروب UI الأصلية الخاصة بالمزوّد من أداة الرسائل العامة.
ولا تزال مساعدات SDK المهجورة الخاصة بالمخططات الأصلية القديمة مُصدّرة من أجل
Plugins الطرف الثالث الموجودة، لكن لا ينبغي للـ Plugins الجديدة استخدامها.

## حل أهداف القنوات

يجب أن تملك Plugins القنوات دلالات الأهداف الخاصة بالقنوات. وأبقِ مضيف الصادر
المشترك عامًا، واستخدم سطح محول الرسائل لقواعد المزوّد:

- يحدد `messaging.inferTargetChatType({ to })` ما إذا كان ينبغي التعامل مع الهدف المطبع
  باعتباره `direct` أو `group` أو `channel` قبل البحث في الدليل.
- يخبر `messaging.targetResolver.looksLikeId(raw, normalized)` النواة ما إذا كان
  يجب على الإدخال أن يتجاوز مباشرةً إلى حل شبيه بالمعرّف بدل البحث في الدليل.
- يُعد `messaging.targetResolver.resolveTarget(...)` fallback الخاصة بـ Plugin عندما
  تحتاج النواة إلى حل نهائي يملكه المزوّد بعد التطبيع أو بعد الإخفاق في الدليل.
- تملك `messaging.resolveOutboundSessionRoute(...)` إنشاء مسار الجلسة
  الخاص بالمزوّد بعد حل الهدف.

التقسيم الموصى به:

- استخدم `inferTargetChatType` من أجل قرارات الفئة التي يجب أن تحدث قبل
  البحث في الأقران/المجموعات.
- استخدم `looksLikeId` من أجل فحوصات "تعامل مع هذا على أنه معرّف هدف صريح/أصلي".
- استخدم `resolveTarget` من أجل fallback الخاصة بالتطبيع التي يملكها المزوّد، وليس من أجل البحث الواسع في الدليل.
- احتفظ بالمعرّفات الأصلية الخاصة بالمزوّد مثل chat ids وthread ids وJIDs والمعالجات وroom ids
  داخل قيم `target` أو المعاملات الخاصة بالمزوّد، وليس في حقول SDK العامة.

## الأدلة المدعومة بالإعدادات

يجب أن تُبقي Plugins التي تشتق إدخالات الدليل من الإعدادات هذا المنطق داخل
Plugin، وأن تعيد استخدام المساعدات المشتركة من
`openclaw/plugin-sdk/directory-runtime`.

استخدم هذا عندما تحتاج القناة إلى أقران/مجموعات مدعومة بالإعدادات مثل:

- أقران DM المدفوعين بقائمة السماح
- خرائط القنوات/المجموعات المهيأة
- fallback ثابتة على مستوى الحساب في الدليل

تعالج المساعدات المشتركة في `directory-runtime` العمليات العامة فقط:

- تصفية الاستعلام
- تطبيق الحدود
- إزالة التكرار/مساعدات التطبيع
- بناء `ChannelDirectoryEntry[]`

أما فحص الحسابات الخاص بالقناة وتطبيع المعرّفات فيجب أن يبقيا في
تنفيذ Plugin.

## فهارس المزوّدين

يمكن لPlugins المزوّدين تعريف فهارس النماذج للاستدلال باستخدام
`registerProvider({ catalog: { run(...) { ... } } })`.

تعيد `catalog.run(...)` الشكل نفسه الذي يكتبه OpenClaw داخل
`models.providers`:

- `{ provider }` لإدخال مزوّد واحد
- `{ providers }` لعدة إدخالات مزوّدين

استخدم `catalog` عندما تملك Plugin معرّفات نماذج خاصة بالمزوّد، أو إعدادات
افتراضية لـ base URL، أو بيانات وصفية للنماذج محمية بالمصادقة.

يتحكم `catalog.order` في وقت دمج فهرس Plugin نسبةً إلى
المزوّدين الضمنيين المضمّنين في OpenClaw:

- `simple`: مزوّدون عاديون يعتمدون على API-key أو env
- `profile`: مزوّدون يظهرون عند وجود ملفات auth profile
- `paired`: مزوّدون يصطنعون عدة إدخالات مزوّد مرتبطة
- `late`: المرور الأخير، بعد المزوّدين الضمنيين الآخرين

يفوز المزوّدون المتأخرون عند تصادم المفاتيح، لذلك يمكن للـ Plugins
تجاوز إدخال مزوّد مضمّن له معرّف المزوّد نفسه عن قصد.

التوافق:

- لا يزال `discovery` يعمل كاسم بديل قديم
- إذا سُجِّل كل من `catalog` و`discovery`، يستخدم OpenClaw القيمة `catalog`

## فحص القنوات للقراءة فقط

إذا كانت Plugin الخاصة بك تسجل قناة، ففضّل تنفيذ
`plugin.config.inspectAccount(cfg, accountId)` إلى جانب `resolveAccount(...)`.

السبب:

- يُعد `resolveAccount(...)` مسار runtime. ومن المسموح له أن يفترض أن بيانات الاعتماد
  قد أصبحت كاملة وأن يفشل سريعًا عند غياب الأسرار المطلوبة.
- لا يجب أن تحتاج مسارات الأوامر للقراءة فقط مثل `openclaw status` و
  `openclaw status --all` و`openclaw channels status` و
  `openclaw channels resolve` وتدفقات doctor/config repair إلى
  تحويل بيانات الاعتماد الخاصة بـ runtime فقط من أجل وصف الإعدادات.

السلوك الموصى به لـ `inspectAccount(...)`:

- أعد فقط حالة وصفية للحساب.
- احتفظ بالقيمتين `enabled` و`configured`.
- أدرج حقول مصدر/حالة بيانات الاعتماد عند الحاجة، مثل:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- لا تحتاج إلى إعادة قيم token الخام فقط للإبلاغ عن التوفر للقراءة فقط.
  إن إعادة `tokenStatus: "available"` (ومعها حقل المصدر المطابق)
  تكفي لأوامر على نمط الحالة.
- استخدم `configured_unavailable` عندما تكون بيانات الاعتماد مهيأة عبر SecretRef لكن
  غير متاحة في مسار الأمر الحالي.

وهذا يتيح لأوامر القراءة فقط الإبلاغ عن "مهيأة لكن غير متاحة في مسار هذا الأمر"
بدل التعطل أو الإبلاغ خطأً بأن الحساب غير مهيأ.

## حزم packages

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

يصبح كل إدخال Plugin. وإذا أدرجت الحزمة عدة extensions، فإن معرّف Plugin
يصبح `name/<fileBase>`.

إذا كانت Plugin الخاصة بك تستورد تبعيات npm، فثبّتها في ذلك الدليل حتى
يصبح `node_modules` متاحًا (`npm install` / `pnpm install`).

حاجز أمني: يجب أن يبقى كل إدخال في `openclaw.extensions` داخل دليل Plugin
بعد حل symlink. وتُرفض الإدخالات التي تفلت من دليل الحزمة.

ملاحظة أمنية: يثبّت `openclaw plugins install` تبعيات Plugin باستخدام
`npm install --omit=dev --ignore-scripts` محليًا على مستوى المشروع (من دون lifecycle scripts،
ومن دون dev dependencies في runtime)، مع تجاهل إعدادات تثبيت npm العامة الموروثة.
وأبقِ أشجار تبعيات Plugin "pure JS/TS" وتجنب الحزم التي تتطلب
بناءات `postinstall`.

اختياري: يمكن لـ `openclaw.setupEntry` الإشارة إلى وحدة خفيفة مخصصة للإعداد فقط.
وعندما يحتاج OpenClaw إلى أسطح إعداد من أجل Plugin قناة معطّلة، أو
عندما تكون Plugin قناة مفعلة لكنها لا تزال غير مهيأة، فإنه يحمّل `setupEntry`
بدل إدخال Plugin الكامل. ويحافظ هذا على خفة بدء التشغيل والإعداد
عندما يكون إدخال Plugin الرئيسي لديك يربط أيضًا الأدوات أو hooks أو غيرها من
الأكواد المخصصة لـ runtime فقط.

اختياري: يمكن لـ `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
إدخال Plugin قناة في مسار `setupEntry` نفسه خلال مرحلة
بدء التشغيل pre-listen الخاصة بـ gateway، حتى عندما تكون القناة مهيأة بالفعل.

استخدم هذا فقط عندما يغطي `setupEntry` بالكامل سطح بدء التشغيل الذي يجب أن يوجد
قبل أن تبدأ gateway بالاستماع. وعمليًا، يعني ذلك أن إدخال الإعداد
يجب أن يسجل كل قدرة تملكها القناة ويعتمد عليها بدء التشغيل، مثل:

- تسجيل القناة نفسها
- أي مسارات HTTP يجب أن تكون متاحة قبل أن تبدأ gateway في الاستماع
- أي أساليب أو أدوات أو خدمات في gateway يجب أن توجد خلال تلك النافذة نفسها

إذا ظل إدخالك الكامل يملك أي قدرة مطلوبة عند بدء التشغيل، فلا تفعّل
هذا العلم. وأبقِ Plugin على السلوك الافتراضي ودَع OpenClaw يحمّل
الإدخال الكامل أثناء بدء التشغيل.

يمكن للقنوات المضمّنة أيضًا نشر مساعدات خاصة بسطح العقود ومخصصة للإعداد فقط بحيث تستطيع
النواة الرجوع إليها قبل تحميل runtime الكاملة للقناة. وسطح
الترقية الحالي الخاص بالإعداد هو:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

تستخدم النواة هذا السطح عندما تحتاج إلى ترقية إعدادات قناة قديمة
ذات حساب واحد إلى `channels.<id>.accounts.*` من دون تحميل إدخال Plugin الكامل.
وتُعد Matrix المثال المضمّن الحالي: فهي تنقل فقط مفاتيح auth/bootstrap إلى
حساب مُرقّى مسمى عندما تكون الحسابات المسماة موجودة بالفعل، كما يمكنها
الحفاظ على مفتاح default-account غير القياسي المهيأ بدل إنشاء
`accounts.default` دائمًا.

وتُبقي محولات patch الخاصة بالإعداد تلك اكتشاف أسطح العقود المضمّنة كسولًا. إذ يبقى
زمن الاستيراد خفيفًا؛ ويُحمَّل سطح الترقية فقط عند أول استخدام بدل إعادة
دخول بدء تشغيل القناة المضمّنة عند استيراد الوحدة.

وعندما تتضمن أسطح بدء التشغيل تلك أساليب Gateway RPC، فأبقِها على
بادئة خاصة بـ Plugin. وتبقى مساحات أسماء إدارة النواة (`config.*`،
و`exec.approvals.*`، و`wizard.*`، و`update.*`) محجوزة وتُحل دائمًا إلى
`operator.admin`، حتى لو طلبت Plugin نطاقًا أضيق.

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

### بيانات وصفية لفهرس القنوات

يمكن لPlugins القنوات الإعلان عن بيانات وصفية خاصة بالإعداد/الاكتشاف عبر `openclaw.channel` و
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

من حقول `openclaw.channel` المفيدة إلى جانب المثال الأدنى:

- `detailLabel`: تسمية ثانوية لأسطح الفهرس/الحالة الأكثر ثراءً
- `docsLabel`: تجاوز نص الرابط لرابط الوثائق
- `preferOver`: معرّفات Plugin/قنوات أقل أولوية يجب أن يتفوق عليها إدخال الفهرس هذا
- `selectionDocsPrefix` و`selectionDocsOmitLabel` و`selectionExtras`: أدوات تحكم لنسخة سطح الاختيار
- `markdownCapable`: يعلّم القناة بأنها قادرة على Markdown من أجل قرارات التنسيق الصادر
- `exposure.configured`: إخفاء القناة من أسطح عرض القنوات المهيأة عند ضبطه على `false`
- `exposure.setup`: إخفاء القناة من أدوات الاختيار التفاعلية الخاصة بالإعداد/التهيئة عند ضبطه على `false`
- `exposure.docs`: تعليم القناة بأنها داخلية/خاصة بالنسبة إلى أسطح التنقل في الوثائق
- `showConfigured` / `showInSetup`: أسماء بديلة قديمة ما زالت مقبولة من أجل التوافق؛ ويفضّل استخدام `exposure`
- `quickstartAllowFrom`: إدخال القناة في تدفق `allowFrom` القياسي الخاص بالبدء السريع
- `forceAccountBinding`: فرض ربط حساب صريح حتى عند وجود حساب واحد فقط
- `preferSessionLookupForAnnounceTarget`: تفضيل البحث في الجلسة عند حل أهداف announce

يمكن لـ OpenClaw أيضًا دمج **فهارس قنوات خارجية** (مثل تصدير
سجل MPM). ضع ملف JSON في أحد المواقع التالية:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

أو وجّه `OPENCLAW_PLUGIN_CATALOG_PATHS` (أو `OPENCLAW_MPM_CATALOG_PATHS`) إلى
ملف JSON واحد أو أكثر (مفصولة بفواصل/فواصل منقوطة/على نمط `PATH`). ويجب أن
يحتوي كل ملف على الشكل `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. كما يقبل المحلل أيضًا المفتاحين `"packages"` أو `"plugins"` كأسماء بديلة قديمة للمفتاح `"entries"`.

تعرض إدخالات فهرس القنوات المُولَّدة وإدخالات فهرس تثبيت المزوّدين
حقائق مطبّعة حول مصدر التثبيت إلى جانب كتلة `openclaw.install` الخام. وتحدد
هذه الحقائق المطبّعة ما إذا كانت مواصفة npm إصدارًا دقيقًا أو محددًا عائمًا،
وما إذا كانت بيانات السلامة الوصفية المتوقعة موجودة، وما إذا كان مسار مصدر محلي
متاحًا أيضًا. وعندما تكون هوية الفهرس/الحزمة معروفة، تُحذّر
الحقائق المطبّعة إذا انجرف اسم حزمة npm المحلل بعيدًا عن تلك الهوية.
كما تُحذّر أيضًا عندما تكون `defaultChoice` غير صالحة أو تشير إلى مصدر
غير متاح، وعندما تكون بيانات سلامة npm الوصفية موجودة دون مصدر npm صالح.
ويجب على المستهلكين التعامل مع `installSource` على أنها حقل اختياري إضافي حتى لا تضطر
الإدخالات المبنية يدويًا وطبقات الفهرس المساعدة إلى اصطناعه.
وهذا يتيح لـ onboarding والتشخيصات شرح حالة source-plane من دون
استيراد runtime الخاصة بـ Plugin.

ويجب أن تفضّل إدخالات npm الخارجية الرسمية `npmSpec` دقيقة بالإضافة إلى
`expectedIntegrity`. ولا تزال أسماء الحزم المجردة وdist-tags تعمل من أجل
التوافق، لكنها تُظهر تحذيرات على مستوى source-plane حتى يتمكن الفهرس من الانتقال
نحو تثبيتات مثبتة بالإصدار ومتحقق من سلامتها من دون كسر Plugins الموجودة.
وعندما يثبّت onboarding من مسار فهرس محلي، فإنه يسجل إدخال index
لـ Plugin مدارة بقيمة `source: "path"` ومع
`sourcePath` نسبةً إلى مساحة العمل عندما يكون ذلك ممكنًا. ويبقى
مسار التحميل التشغيلي المطلق في `plugins.load.paths`؛ بينما يتجنب سجل التثبيت
تكرار مسارات محطة العمل المحلية في الإعدادات طويلة الأمد. ويحافظ هذا على ظهور
تثبيتات التطوير المحلية في تشخيصات source-plane من دون إضافة سطح ثانٍ
للكشف عن مسارات نظام الملفات الخام. ويُعد plugin index المحفوظ في `plugins/installs.json`
مصدر الحقيقة الخاص بمصدر التثبيت، ويمكن تحديثه من دون تحميل وحدات runtime الخاصة بـ Plugin.
وتبقى خريطة `installRecords` فيه دائمة حتى عند غياب manifest الخاصة بـ Plugin أو
عندما تكون غير صالحة؛ أما مصفوفة `plugins` فهي عرض قابل لإعادة البناء للـ manifest/cache.

## Plugins محرك السياق

تملك Plugins محرك السياق orchestration الخاصة بسياق الجلسة لعمليات الإدخال
والتجميع وCompaction. سجّلها من Plugin الخاصة بك باستخدام
`api.registerContextEngine(id, factory)`، ثم اختر المحرك النشط باستخدام
`plugins.slots.contextEngine`.

استخدم هذا عندما تحتاج Plugin الخاصة بك إلى استبدال مسار السياق الافتراضي
أو توسيعه بدلًا من مجرد إضافة بحث الذاكرة أو hooks.

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

إذا كان محركك **لا** يملك خوارزمية Compaction، فأبقِ `compact()`
منفذةً ومرّرها صراحةً:

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

عندما تحتاج Plugin إلى سلوك لا يناسب API الحالية، فلا تتجاوز
نظام Plugin عبر نفاذ خاص إلى الداخل. بل أضف القدرة الناقصة.

التسلسل الموصى به:

1. عرّف عقد النواة
   قرر ما السلوك المشترك الذي يجب أن تملكه النواة: السياسة، وfallback، ودمج الإعدادات،
   ودورة الحياة، ودلالات القناة المواجهة للمستخدم، وشكل مساعد runtime.
2. أضف أسطح تسجيل/runtime typed خاصة بالـ Plugin
   وسّع `OpenClawPluginApi` و/أو `api.runtime` بأصغر
   سطح قدرة typed مفيد.
3. اربط مستهلكي النواة + القناة/الميزة
   يجب أن تستهلك القنوات وPlugins الميزات القدرة الجديدة عبر النواة،
   لا عبر استيراد تنفيذ مورّد مباشرةً.
4. سجّل تنفيذات المورّدين
   ثم تسجل Plugins الخاصة بالمورّدين خلفياتها مقابل القدرة.
5. أضف تغطية للعقد
   أضف اختبارات حتى تظل الملكية وشكل التسجيل صريحين بمرور الوقت.

وهكذا يظل OpenClaw صاحب رأي من دون أن يصبح مبرمجًا بشكل صلب على
رؤية مزوّد واحد للعالم. راجع [Capability Cookbook](/ar/plugins/architecture)
للحصول على قائمة ملفات ملموسة ومثال عملي.

### قائمة التحقق الخاصة بالقدرة

عندما تضيف قدرة جديدة، يجب عادةً أن يلمس التنفيذ هذه
الأسطح معًا:

- أنواع عقد النواة في `src/<capability>/types.ts`
- مشغّل/مساعد runtime في النواة داخل `src/<capability>/runtime.ts`
- سطح تسجيل Plugin API في `src/plugins/types.ts`
- ربط سجل Plugin في `src/plugins/registry.ts`
- تعريض runtime الخاصة بالـ Plugin في `src/plugins/runtime/*` عندما تحتاج
  Plugins الميزات/القنوات إلى استهلاكها
- مساعدات الالتقاط/الاختبار في `src/test-utils/plugin-registration.ts`
- تأكيدات الملكية/العقد في `src/plugins/contracts/registry.ts`
- وثائق المشغّل/Plugin في `docs/`

إذا كان أحد هذه الأسطح مفقودًا، فهذه عادةً علامة على أن القدرة
لم تندمج بالكامل بعد.

### قالب القدرة

النمط الأدنى:

```ts
// عقد النواة
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

// مساعد runtime مشترك لPlugins الميزات/القنوات
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

- تملك النواة عقد القدرة + orchestration
- تملك Plugins المورّدين تنفيذات المورّدين
- تستهلك Plugins الميزات/القنوات مساعدات runtime
- تُبقي اختبارات العقد الملكية صريحة

## ذو صلة

- [بنية Plugin](/ar/plugins/architecture) — نموذج القدرات العامة والأشكال
- [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
