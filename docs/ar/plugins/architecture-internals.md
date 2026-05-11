---
read_when:
    - تنفيذ خطافات وقت تشغيل المزوّد، أو دورة حياة القناة، أو مجموعات الحزم
    - تصحيح أخطاء ترتيب تحميل Plugin أو حالة السجل
    - إضافة قدرة Plugin جديدة أو Plugin لمحرك السياق
summary: 'داخليات بنية Plugin: مسار التحميل، والسجل، وخطافات وقت التشغيل، ومسارات HTTP، وجداول المراجع'
title: الأجزاء الداخلية لبنية Plugin
x-i18n:
    generated_at: "2026-05-11T20:36:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: a74c068fce039ef3b85b2634caea0854e8ffb246a5ff59ebd8feadb8d93601d6
    source_path: plugins/architecture-internals.md
    workflow: 16
---

بالنسبة إلى نموذج القدرات العام، وأشكال Plugins، وعقود الملكية/التنفيذ،
راجع [بنية Plugin](/ar/plugins/architecture). هذه الصفحة هي
المرجع للآليات الداخلية: مسار التحميل، والسجل، وخطافات وقت التشغيل،
ومسارات HTTP الخاصة بـ Gateway، ومسارات الاستيراد، وجداول المخططات.

## مسار التحميل

عند بدء التشغيل، ينفذ OpenClaw تقريبًا ما يلي:

1. يكتشف جذور Plugins المرشحة
2. يقرأ بيانات manifests الأصلية أو حزم التوافق وبيانات تعريف الحزمة
3. يرفض المرشحين غير الآمنين
4. يطبّع إعدادات Plugin (`plugins.enabled`، و`allow`، و`deny`، و`entries`،
   و`slots`، و`load.paths`)
5. يقرر التفعيل لكل مرشح
6. يحمّل الوحدات الأصلية المفعّلة: تستخدم الوحدات المضمنة المبنية محمّلًا أصليًا؛
   وتستخدم TypeScript المصدر المحلي التابع لطرف ثالث مسار Jiti الاحتياطي الطارئ
7. يستدعي خطافات `register(api)` الأصلية ويجمع التسجيلات في سجل Plugins
8. يعرّض السجل للأوامر وأسطح وقت التشغيل

<Note>
`activate` اسم مستعار قديم لـ `register` — يحلّ المحمّل أيهما موجود (`def.register ?? def.activate`) ويستدعيه في النقطة نفسها. تستخدم كل Plugins المضمنة `register`؛ فضّل `register` عند إنشاء Plugins جديدة.
</Note>

تحدث بوابات السلامة **قبل** تنفيذ وقت التشغيل. يُحظر المرشحون
عندما يفلت الإدخال من جذر Plugin، أو يكون المسار قابلًا للكتابة عالميًا، أو تبدو
ملكية المسار مريبة بالنسبة إلى Plugins غير المضمنة.

يبقى المرشحون المحظورون مرتبطين بمعرّف Plugin الخاص بهم لأغراض التشخيص. إذا كانت الإعدادات
لا تزال تشير إلى ذلك المعرّف، فسيبلغ التحقق عن Plugin على أنه موجود لكنه محظور
ويشير إلى تحذير سلامة المسار بدلًا من التعامل مع إدخال الإعدادات
على أنه قديم.

### سلوك manifest أولًا

يمثل manifest مصدر الحقيقة لمستوى التحكم. يستخدمه OpenClaw من أجل:

- تحديد Plugin
- اكتشاف القنوات/Skills/مخطط الإعدادات المعلنة أو قدرات الحزمة
- التحقق من `plugins.entries.<id>.config`
- إثراء تسميات/عناصر نائبة في واجهة التحكم
- إظهار بيانات تعريف التثبيت/الفهرس
- الحفاظ على واصفات التفعيل والإعداد منخفضة الكلفة دون تحميل وقت تشغيل Plugin

بالنسبة إلى Plugins الأصلية، تكون وحدة وقت التشغيل هي جزء مستوى البيانات. وهي تسجل
السلوك الفعلي مثل الخطافات أو الأدوات أو الأوامر أو تدفقات المزوّد.

تبقى كتل manifest الاختيارية `activation` و`setup` على مستوى التحكم.
إنها واصفات بيانات تعريف فقط لتخطيط التفعيل واكتشاف الإعداد؛
ولا تستبدل تسجيل وقت التشغيل، أو `register(...)`، أو `setupEntry`.
يستخدم أوائل مستهلكي التفعيل الحي الآن تلميحات الأوامر والقنوات والمزوّدين من manifest
لتضييق تحميل Plugins قبل تجسيد السجل الأوسع:

- يضيّق تحميل CLI النطاق إلى Plugins التي تملك الأمر الأساسي المطلوب
- يضيّق إعداد القناة/حل Plugin النطاق إلى Plugins التي تملك
  معرّف القناة المطلوب
- يضيّق إعداد/حل وقت تشغيل المزوّد الصريح النطاق إلى Plugins التي تملك
  معرّف المزوّد المطلوب
- يستخدم تخطيط بدء تشغيل Gateway `activation.onStartup` للاستيرادات الصريحة عند بدء التشغيل
  وإلغاء الاشتراك في بدء التشغيل؛ ولا تُحمّل Plugins التي لا تحتوي على بيانات تعريف بدء تشغيل إلا
  عبر محفزات تفعيل أضيق

لا تزال عمليات التحميل المسبق لوقت التشغيل وقت الطلب التي تطلب النطاق الواسع `all` تستنتج
مجموعة معرّفات Plugins فعالة وصريحة من الإعدادات، وتخطيط بدء التشغيل، والقنوات
المعدّة، والفتحات، وقواعد التفعيل التلقائي. إذا كانت تلك المجموعة المستنتجة فارغة، فإن OpenClaw
يحمّل سجل وقت تشغيل فارغًا بدلًا من التوسيع إلى كل Plugin
قابل للاكتشاف.

يعرض مخطط التفعيل كلًا من API للمعرّفات فقط للمتصلين الحاليين وAPI
للخطة للتشخيصات الجديدة. تبلّغ إدخالات الخطة عن سبب اختيار Plugin،
مع فصل تلميحات المخطط الصريحة `activation.*` عن الرجوع إلى ملكية manifest
مثل `providers`، و`channels`، و`commandAliases`، و`setup.providers`،
و`contracts.tools`، والخطافات. هذا الفصل في الأسباب هو حد التوافق:
تستمر بيانات تعريف Plugin الحالية في العمل، بينما يمكن للكود الجديد اكتشاف التلميحات الواسعة
أو سلوك الرجوع دون تغيير دلالات تحميل وقت التشغيل.

يفضل اكتشاف الإعداد الآن المعرّفات المملوكة للواصف مثل `setup.providers` و
`setup.cliBackends` لتضييق Plugins المرشحة قبل الرجوع إلى
`setup-api` بالنسبة إلى Plugins التي لا تزال تحتاج إلى خطافات وقت التشغيل وقت الإعداد. تستخدم
قوائم إعداد المزوّد manifest `providerAuthChoices`، وخيارات الإعداد المشتقة من الواصف،
وبيانات تعريف فهرس التثبيت دون تحميل وقت تشغيل المزوّد. يُعد
`setup.requiresRuntime: false` الصريح حدًا فاصلًا للواصف فقط؛ أما حذف
`requiresRuntime` فيُبقي الرجوع القديم إلى setup-api للتوافق. إذا ادعى أكثر
من Plugin مكتشف واحد ملكية معرّف مزوّد إعداد أو خلفية CLI مُطبّع نفسه،
يرفض بحث الإعداد المالك الغامض بدلًا من الاعتماد على
ترتيب الاكتشاف. عندما يُنفذ وقت تشغيل الإعداد، تبلغ تشخيصات السجل
عن الانحراف بين `setup.providers` / `setup.cliBackends` والمزوّدين أو خلفيات CLI
المسجلة بواسطة setup-api دون حظر Plugins القديمة.

### حد ذاكرة Plugin المؤقتة

لا يخزن OpenClaw نتائج اكتشاف Plugins أو بيانات سجل manifest المباشرة
خلف نوافذ زمنية مرتبطة بالساعة. يجب أن تصبح عمليات التثبيت، وتعديلات manifest، وتغييرات مسارات التحميل
مرئية في القراءة الصريحة التالية لبيانات التعريف أو عند إعادة بناء اللقطة.
قد يحتفظ محلل ملف manifest بذاكرة مؤقتة محدودة لتوقيع الملف، مقيّدة
بمسار manifest المفتوح، وinode، والحجم، والطوابع الزمنية؛ هذه الذاكرة المؤقتة لا تتجنب إلا
إعادة تحليل البايتات غير المتغيرة، ويجب ألا تخزن إجابات الاكتشاف أو السجل أو المالك أو
السياسة.

المسار السريع الآمن لبيانات التعريف هو ملكية كائنات صريحة، لا ذاكرة مؤقتة مخفية.
يجب أن تمرر مسارات بدء تشغيل Gateway الساخنة `PluginMetadataSnapshot` الحالي،
أو `PluginLookUpTable` المشتق، أو سجل manifest صريحًا عبر سلسلة الاستدعاءات.
يمكن للتحقق من الإعدادات، والتفعيل التلقائي عند بدء التشغيل، وتهيئة Plugin، واختيار المزوّد
إعادة استخدام تلك الكائنات ما دامت تمثل الإعدادات الحالية ومخزون
Plugins. لا يزال بحث الإعداد يعيد بناء بيانات تعريف manifest عند الطلب
ما لم يتلق مسار الإعداد المحدد سجل manifest صريحًا؛ أبق ذلك
كخيار رجوع لمسار بارد بدلًا من إضافة ذاكرات مؤقتة مخفية للبحث. عند تغيّر الإدخال،
أعد بناء اللقطة واستبدلها بدلًا من تعديلها أو الاحتفاظ
بنسخ تاريخية.
يجب إعادة حساب العروض فوق سجل Plugins النشط ومساعدات تهيئة القنوات المضمنة
من السجل/الجذر الحالي. لا بأس بالخرائط قصيرة العمر
داخل استدعاء واحد لإزالة تكرار العمل أو حماية إعادة الدخول؛ ويجب ألا تصبح ذاكرات مؤقتة
لبيانات تعريف العملية.

بالنسبة إلى تحميل Plugins، تكون طبقة الذاكرة المؤقتة الدائمة هي تحميل وقت التشغيل. قد تعيد استخدام
حالة المحمّل عند تحميل الكود أو المشغولات المثبتة فعليًا، مثل:

- `PluginLoaderCacheState` وسجلات وقت التشغيل النشطة المتوافقة
- ذاكرات jiti/module المؤقتة وذاكرات محمّل السطح العام المستخدمة لتجنب استيراد
  سطح وقت التشغيل نفسه مرارًا
- ذاكرات نظام الملفات المؤقتة لمشغولات Plugin المثبتة
- خرائط قصيرة العمر لكل استدعاء لتطبيع المسارات أو حل التكرارات

تلك الذاكرات المؤقتة تفاصيل تنفيذية لمستوى البيانات. يجب ألا تجيب عن
أسئلة مستوى التحكم مثل "أي Plugin يملك هذا المزوّد؟" ما لم يكن
المتصل قد طلب عمدًا تحميل وقت التشغيل.

لا تضف ذاكرات مؤقتة دائمة أو مرتبطة بالساعة من أجل:

- نتائج الاكتشاف
- سجلات manifest المباشرة
- سجلات manifest المعاد بناؤها من فهرس Plugins المثبت
- بحث مالك المزوّد، أو إخماد النموذج، أو سياسة المزوّد، أو بيانات تعريف المشغولات العامة
- أي إجابة أخرى مشتقة من manifest حيث يجب أن يكون manifest أو الفهرس المثبت
  أو مسار التحميل المتغير مرئيًا عند القراءة التالية لبيانات التعريف

المتصلون الذين يعيدون بناء بيانات تعريف manifest من فهرس Plugins المثبت
والمستمر يعيدون بناء ذلك السجل عند الطلب. الفهرس المثبت هو حالة مستوى مصدر
دائمة؛ وليس ذاكرة مؤقتة مخفية داخل العملية لبيانات التعريف.

## نموذج السجل

لا تعدّل Plugins المحمّلة متغيرات عامة عشوائية في القلب مباشرة. إنها تسجل في
سجل Plugins مركزي.

يتتبع السجل:

- سجلات Plugins (الهوية، والمصدر، والمنشأ، والحالة، والتشخيصات)
- الأدوات
- الخطافات القديمة والخطافات المكتوبة
- القنوات
- المزوّدين
- معالجات Gateway RPC
- مسارات HTTP
- مسجلات CLI
- خدمات الخلفية
- الأوامر المملوكة لـ Plugin

بعد ذلك تقرأ ميزات القلب من ذلك السجل بدلًا من التحدث إلى وحدات Plugin
مباشرة. هذا يبقي التحميل أحادي الاتجاه:

- وحدة Plugin -> تسجيل السجل
- وقت تشغيل القلب -> استهلاك السجل

هذا الفصل مهم لقابلية الصيانة. فهو يعني أن معظم أسطح القلب لا تحتاج إلا إلى
نقطة تكامل واحدة: "اقرأ السجل"، لا "تعامل مع كل وحدة Plugin كحالة خاصة".

## استدعاءات ربط المحادثة

يمكن لـ Plugins التي تربط محادثة أن تتفاعل عند حل موافقة.

استخدم `api.onConversationBindingResolved(...)` لتلقي استدعاء بعد الموافقة على طلب الربط
أو رفضه:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

حقول حمولة الاستدعاء:

- `status`: `"approved"` أو `"denied"`
- `decision`: `"allow-once"`، أو `"allow-always"`، أو `"deny"`
- `binding`: الربط المحلول للطلبات الموافق عليها
- `request`: ملخص الطلب الأصلي، وتلميح الفصل، ومعرّف المرسل، وبيانات تعريف
  المحادثة

هذا الاستدعاء مخصص للإشعار فقط. لا يغيّر من يُسمح له بربط
محادثة، ويعمل بعد انتهاء معالجة الموافقة في القلب.

## خطافات وقت تشغيل المزوّد

تحتوي Plugins الخاصة بالمزوّد على ثلاث طبقات:

- **بيانات تعريف manifest** للبحث منخفض الكلفة قبل وقت التشغيل:
  `setup.providers[].envVars`، وتوافق `providerAuthEnvVars` المهمل،
  و`providerAuthAliases`، و`providerAuthChoices`، و`channelEnvVars`.
- **خطافات وقت الإعدادات**: `catalog` (القديم `discovery`) بالإضافة إلى
  `applyConfigDefaults`.
- **خطافات وقت التشغيل**: أكثر من 40 خطافًا اختياريًا تغطي المصادقة، وحل النماذج،
  وتغليف التدفق، ومستويات التفكير، وسياسة الإعادة، ونقاط نهاية الاستخدام. راجع
  القائمة الكاملة ضمن [ترتيب الخطافات واستخدامها](#hook-order-and-usage).

لا يزال OpenClaw يملك حلقة الوكيل العامة، وتجاوز الفشل، ومعالجة النصوص، وسياسة
الأدوات. هذه الخطافات هي سطح التوسعة للسلوك الخاص بالمزوّد
دون الحاجة إلى نقل استدلال مخصص بالكامل.

استخدم manifest `setup.providers[].envVars` عندما يكون لدى المزوّد بيانات اعتماد قائمة على env
يجب أن تراها مسارات المصادقة/الحالة/منتقي النماذج العامة دون
تحميل وقت تشغيل Plugin. لا يزال `providerAuthEnvVars` المهمل يُقرأ بواسطة
محول التوافق خلال نافذة الإهمال، وتتلقى Plugins غير المضمنة
التي تستخدمه تشخيص manifest. استخدم manifest `providerAuthAliases`
عندما يجب أن يعيد معرّف مزوّد واحد استخدام env vars، وملفات المصادقة،
والمصادقة المدعومة بالإعدادات، وخيار تهيئة مفتاح API الخاصة بمعرّف مزوّد آخر. استخدم manifest
`providerAuthChoices` عندما يجب أن تعرف أسطح CLI الخاصة بالتهيئة/اختيار المصادقة
معرّف اختيار المزوّد، وتسميات المجموعات، وتوصيل مصادقة بسيط بعلم واحد دون
تحميل وقت تشغيل المزوّد. أبقِ وقت تشغيل المزوّد
`envVars` للتلميحات الموجهة للمشغل مثل تسميات التهيئة أو متغيرات إعداد OAuth
client-id/client-secret.

استخدم manifest `channelEnvVars` عندما تحتوي قناة على مصادقة أو إعداد قائم على env
يجب أن تراه مسارات الرجوع إلى shell-env العامة، أو فحوص الإعدادات/الحالة، أو مطالبات الإعداد
دون تحميل وقت تشغيل القناة.

### ترتيب الخطافات واستخدامها

بالنسبة إلى Plugins الخاصة بالنموذج/المزوّد، يستدعي OpenClaw الخطافات بهذا الترتيب التقريبي.
عمود "متى تستخدم" هو دليل القرار السريع.
حقول المزوّد الخاصة بالتوافق فقط التي لم يعد OpenClaw يستدعيها، مثل
`ProviderPlugin.capabilities` و`suppressBuiltInModel`، غير مدرجة هنا عمدًا.

| #   | الخطاف                              | ما الذي يفعله                                                                                                   | متى يُستخدم                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | نشر إعدادات الموفّر في `models.providers` أثناء توليد `models.json`                                | عندما يملك الموفّر كتالوجًا أو قيَمًا افتراضية لعنوان URL الأساسي                                                                                                  |
| 2   | `applyConfigDefaults`             | تطبيق القيَم الافتراضية العامة للإعدادات التي يملكها الموفّر أثناء تجسيد الإعدادات                                      | عندما تعتمد القيَم الافتراضية على نمط المصادقة أو البيئة أو دلالات عائلة نماذج الموفّر                                                                         |
| --  | _(البحث المدمج عن النماذج)_         | يحاول OpenClaw مسار السجل/الكتالوج العادي أولًا                                                          | _(ليس خطاف Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | تطبيع الأسماء المستعارة القديمة أو التجريبية لمعرّفات النماذج قبل البحث                                                     | عندما يملك الموفّر تنظيف الأسماء المستعارة قبل حلّ النموذج القانوني                                                                                 |
| 4   | `normalizeTransport`              | تطبيع `api` / `baseUrl` لعائلة الموفّر قبل تجميع النموذج العام                                      | عندما يملك الموفّر تنظيف النقل لمعرّفات الموفّرين المخصصة ضمن عائلة النقل نفسها                                                          |
| 5   | `normalizeConfig`                 | تطبيع `models.providers.<id>` قبل حلّ وقت التشغيل/الموفّر                                           | عندما يحتاج الموفّر إلى تنظيف إعدادات يجب أن يبقى مع Plugin؛ وتعمل مساعدات عائلة Google المضمّنة أيضًا كدعم احتياطي لإدخالات إعدادات Google المدعومة   |
| 6   | `applyNativeStreamingUsageCompat` | تطبيق عمليات إعادة كتابة توافق استخدام البث الأصلي على موفّري الإعدادات                                               | عندما يحتاج الموفّر إلى إصلاحات لبيانات استخدام البث الأصلي الوصفية المدفوعة بنقطة النهاية                                                                          |
| 7   | `resolveConfigApiKey`             | حلّ مصادقة علامة البيئة لموفّري الإعدادات قبل تحميل مصادقة وقت التشغيل                                       | عندما يملك الموفّر حلًّا لمفتاح واجهة برمجة التطبيقات بعلامة بيئة مملوكًا له؛ ويملك `amazon-bedrock` أيضًا محللًا مدمجًا لعلامات بيئة AWS هنا                  |
| 8   | `resolveSyntheticAuth`            | إظهار مصادقة محلية/مستضافة ذاتيًا أو مدعومة بالإعدادات دون حفظ النص الصريح                                   | عندما يستطيع الموفّر العمل بعلامة اعتماد اصطناعية/محلية                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | تركيب ملفات تعريف المصادقة الخارجية التي يملكها الموفّر؛ تكون القيمة الافتراضية لـ `persistence` هي `runtime-only` لبيانات الاعتماد المملوكة لـ CLI/التطبيق | عندما يعيد الموفّر استخدام بيانات اعتماد مصادقة خارجية دون حفظ رموز التحديث المنسوخة؛ أعلن `contracts.externalAuthProviders` في البيان |
| 10  | `shouldDeferSyntheticProfileAuth` | خفض أولوية عناصر نائب ملفات التعريف الاصطناعية المخزنة خلف مصادقة مدعومة بالبيئة/الإعدادات                                      | عندما يخزن الموفّر ملفات تعريف نائبة اصطناعية لا ينبغي أن تفوز بالأسبقية                                                                 |
| 11  | `resolveDynamicModel`             | احتياطي متزامن لمعرّفات النماذج التي يملكها الموفّر وغير الموجودة بعد في السجل المحلي                                       | عندما يقبل الموفّر معرّفات نماذج عشوائية من المنبع                                                                                                 |
| 12  | `prepareDynamicModel`             | تهيئة غير متزامنة، ثم يعمل `resolveDynamicModel` مرة أخرى                                                           | عندما يحتاج الموفّر إلى بيانات وصفية من الشبكة قبل حلّ المعرّفات غير المعروفة                                                                                  |
| 13  | `normalizeResolvedModel`          | إعادة الكتابة النهائية قبل أن يستخدم المشغّل المضمّن النموذج المحلول                                               | عندما يحتاج الموفّر إلى عمليات إعادة كتابة للنقل لكنه ما زال يستخدم نقلًا أساسيًا                                                                             |
| 14  | `contributeResolvedModelCompat`   | المساهمة بأعلام التوافق لنماذج المورّد خلف نقل آخر متوافق                                  | عندما يتعرّف الموفّر على نماذجه الخاصة على نقلات وكيلة دون السيطرة على الموفّر                                                       |
| 15  | `normalizeToolSchemas`            | تطبيع مخططات الأدوات قبل أن يراها المشغّل المضمّن                                                    | عندما يحتاج الموفّر إلى تنظيف مخططات عائلة النقل                                                                                                |
| 16  | `inspectToolSchemas`              | إظهار تشخيصات المخططات التي يملكها الموفّر بعد التطبيع                                                  | عندما يريد الموفّر تحذيرات كلمات مفتاحية دون تعليم النواة قواعد خاصة بالموفّر                                                                 |
| 17  | `resolveReasoningOutputMode`      | اختيار عقد إخراج الاستدلال الأصلي أو الموسوم                                                              | عندما يحتاج الموفّر إلى استدلال/إخراج نهائي موسوم بدلًا من الحقول الأصلية                                                                         |
| 18  | `prepareExtraParams`              | تطبيع معاملات الطلب قبل مغلّفات خيارات البث العامة                                              | عندما يحتاج الموفّر إلى معاملات طلب افتراضية أو تنظيف معاملات لكل موفّر                                                                           |
| 19  | `createStreamFn`                  | استبدال مسار البث العادي بالكامل بنقل مخصص                                                   | عندما يحتاج الموفّر إلى بروتوكول سلكي مخصص، وليس مجرد مغلّف                                                                                     |
| 20  | `wrapStreamFn`                    | مغلّف بث بعد تطبيق المغلّفات العامة                                                              | عندما يحتاج الموفّر إلى مغلّفات توافق لرؤوس الطلب/الجسم/النموذج دون نقل مخصص                                                          |
| 21  | `resolveTransportTurnState`       | إرفاق رؤوس نقل أصلية لكل دور أو بيانات وصفية                                                           | عندما يريد الموفّر أن ترسل النقلات العامة هوية دور أصلية للموفّر                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | إرفاق رؤوس WebSocket أصلية أو سياسة تهدئة للجلسة                                                    | عندما يريد الموفّر أن تضبط نقلات WS العامة رؤوس الجلسة أو سياسة الرجوع الاحتياطي                                                               |
| 23  | `formatApiKey`                    | منسّق ملف تعريف المصادقة: يصبح الملف المخزن سلسلة `apiKey` في وقت التشغيل                                     | عندما يخزن الموفّر بيانات وصفية إضافية للمصادقة ويحتاج إلى شكل رمز مخصص في وقت التشغيل                                                                    |
| 24  | `refreshOAuth`                    | تجاوز تحديث OAuth لنقاط نهاية تحديث مخصصة أو سياسة فشل التحديث                                  | عندما لا يناسب الموفّر محدّثات `pi-ai` المشتركة                                                                                           |
| 25  | `buildAuthDoctorHint`             | تلميح إصلاح يُلحق عند فشل تحديث OAuth                                                                  | عندما يحتاج الموفّر إلى إرشادات إصلاح مصادقة مملوكة له بعد فشل التحديث                                                                      |
| 26  | `matchesContextOverflowError`     | مطابق تجاوز نافذة السياق المملوك للموفّر                                                                 | عندما تكون لدى الموفّر أخطاء تجاوز خام قد تفوتها الاستدلالات العامة                                                                                |
| 27  | `classifyFailoverReason`          | تصنيف سبب تجاوز الفشل المملوك للموفّر                                                                  | عندما يستطيع الموفّر تعيين أخطاء واجهة برمجة التطبيقات/النقل الخام إلى حد المعدل/الحمل الزائد/إلخ                                                                          |
| 28  | `isCacheTtlEligible`              | سياسة ذاكرة التخزين المؤقت للمطالبة لموفّري الوكيل/النقل الخلفي                                                               | عندما يحتاج الموفّر إلى تقييد TTL للتخزين المؤقت خاص بالوكيل                                                                                                |
| 29  | `buildMissingAuthMessage`         | بديل لرسالة الاسترداد العامة عند غياب المصادقة                                                      | عندما يحتاج الموفّر إلى تلميح استرداد خاص به عند غياب المصادقة                                                                                 |
| 30  | `augmentModelCatalog`             | صفوف كتالوج اصطناعية/نهائية تُلحق بعد الاكتشاف                                                          | عندما يحتاج الموفّر إلى صفوف توافق أمامي اصطناعية في `models list` وأدوات الاختيار                                                                     |
| 31  | `resolveThinkingProfile`          | مجموعة مستويات `/think` خاصة بالنموذج، وتسميات العرض، والقيمة الافتراضية                                                 | عندما يعرّض الموفّر سلّم تفكير مخصصًا أو تسمية ثنائية لنماذج محددة                                                                 |
| 32  | `isBinaryThinking`                | خطاف توافق تبديل الاستدلال تشغيل/إيقاف                                                                     | عندما يعرّض الموفّر التفكير الثنائي فقط تشغيل/إيقاف                                                                                                  |
| 33  | `supportsXHighThinking`           | خطاف توافق دعم الاستدلال `xhigh`                                                                   | عندما يريد الموفّر `xhigh` على مجموعة فرعية فقط من النماذج                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | خطاف توافق مستوى `/think` الافتراضي                                                                      | عندما يملك الموفّر سياسة `/think` الافتراضية لعائلة نماذج                                                                                      |
| 35  | `isModernModelRef`                | مطابق النماذج الحديثة لمرشحات الملفات التعريفية الحية واختيار اختبارات الدخان                                              | عندما يملك الموفّر مطابقة النماذج المفضلة للاختبار الحي/اختبار الدخان                                                                                             |
| 36  | `prepareRuntimeAuth`              | تحويل اعتماد مضبوط إلى رمز/مفتاح وقت التشغيل الفعلي قبل الاستدلال مباشرة                       | عندما يحتاج الموفّر إلى تبادل رمز أو اعتماد طلب قصير العمر                                                                             |
| 37  | `resolveUsageAuth`                | حل بيانات اعتماد الاستخدام/الفوترة لـ `/usage` والأسطح ذات الصلة بالحالة                                     | يحتاج المزوّد إلى تحليل مخصص لرمز الاستخدام/الحصة أو بيانات اعتماد استخدام مختلفة                                                               |
| 38  | `fetchUsageSnapshot`              | جلب لقطات الاستخدام/الحصة الخاصة بالمزوّد وتطبيعها بعد حل المصادقة                             | يحتاج المزوّد إلى نقطة نهاية استخدام خاصة بالمزوّد أو محلل حمولة                                                                           |
| 39  | `createEmbeddingProvider`         | بناء محوّل تضمين مملوك للمزوّد للذاكرة/البحث                                                     | سلوك تضمين الذاكرة يتبع Plugin المزوّد                                                                                    |
| 40  | `buildReplayPolicy`               | إرجاع سياسة إعادة تشغيل تتحكم في التعامل مع النص المنسوخ للمزوّد                                        | يحتاج المزوّد إلى سياسة نص منسوخ مخصصة (على سبيل المثال، إزالة كتل التفكير)                                                               |
| 41  | `sanitizeReplayHistory`           | إعادة كتابة سجل إعادة التشغيل بعد تنظيف النص المنسوخ العام                                                        | يحتاج المزوّد إلى عمليات إعادة كتابة لإعادة التشغيل خاصة بالمزوّد تتجاوز مساعدات Compaction المشتركة                                                             |
| 42  | `validateReplayTurns`             | التحقق النهائي من دور إعادة التشغيل أو إعادة تشكيله قبل المشغّل المضمّن                                           | يحتاج نقل المزوّد إلى تحقق أكثر صرامة من الأدوار بعد التنظيف العام                                                                    |
| 43  | `onModelSelected`                 | تشغيل الآثار الجانبية اللاحقة للاختيار والمملوكة للمزوّد                                                                 | يحتاج المزوّد إلى قياس عن بُعد أو حالة مملوكة للمزوّد عندما يصبح نموذج ما نشطًا                                                                  |

`normalizeModelId` و`normalizeTransport` و`normalizeConfig` تتحقق أولاً من
Plugin المزوّد المطابق، ثم تمر عبر Plugins المزوّدين الآخرين القادرين على
الخطافات إلى أن يغيّر أحدهم فعلياً معرّف النموذج أو النقل/الإعداد. يحافظ ذلك على
عمل طبقات المواءمة/الأسماء المستعارة للمزوّدين دون أن يتطلب من المستدعي معرفة أي
Plugin مضمن يملك إعادة الكتابة. إذا لم يُعد أي خطاف مزوّد كتابة إدخال إعداد
مدعوم من عائلة Google، فسيظل مطبّع إعداد Google المضمّن يطبّق تنظيف التوافق ذلك.

إذا كان المزوّد يحتاج إلى بروتوكول سلكي مخصص بالكامل أو منفّذ طلبات مخصص، فذلك
صنف مختلف من الامتدادات. هذه الخطافات مخصصة لسلوك المزوّد الذي لا يزال يعمل على
حلقة الاستدلال العادية في OpenClaw.

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

تجمع Plugins المزوّدين المضمّنة الخطافات أعلاه لتناسب احتياجات كل مورّد في
الفهرس، والمصادقة، والتفكير، وإعادة التشغيل، والاستخدام. تعيش مجموعة الخطافات
المعتمدة مع كل Plugin تحت `extensions/`؛ توضّح هذه الصفحة الأشكال بدلاً من
محاكاة القائمة.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    يسجّل OpenRouter وKilocode وZ.AI وxAI `catalog` بالإضافة إلى
    `resolveDynamicModel` / `prepareDynamicModel` حتى يتمكنوا من إظهار معرّفات
    النماذج القادمة من المنبع قبل فهرس OpenClaw الثابت.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    يقرن GitHub Copilot وGemini CLI وChatGPT Codex وMiniMax وXiaomi وz.ai
    `prepareRuntimeAuth` أو `formatApiKey` مع `resolveUsageAuth` +
    `fetchUsageSnapshot` لامتلاك تبادل الرموز والتكامل مع `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    تتيح العائلات المشتركة المسماة (`google-gemini` و`passthrough-gemini`
    و`anthropic-by-model` و`hybrid-anthropic-openai`) للمزوّدين الاشتراك في
    سياسة النص عبر `buildReplayPolicy` بدلاً من أن يعيد كل Plugin تنفيذ التنظيف.
  </Accordion>
  <Accordion title="Catalog-only providers">
    تسجّل `byteplus` و`cloudflare-ai-gateway` و`huggingface` و`kimi-coding`
    و`nvidia` و`qianfan` و`synthetic` و`together` و`venice`
    و`vercel-ai-gateway` و`volcengine` فقط `catalog` وتستخدم حلقة الاستدلال
    المشتركة.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    تعيش ترويسات Beta، و`/fast` / `serviceTier`، و`context1m` داخل سطح
    `api.ts` / `contract-api.ts` العام في Plugin Anthropic
    (`wrapAnthropicProviderStream` و`resolveAnthropicBetas`
    و`resolveAnthropicFastMode` و`resolveAnthropicServiceTier`) بدلاً من SDK
    العام.
  </Accordion>
</AccordionGroup>

## مساعدات وقت التشغيل

يمكن لـ Plugins الوصول إلى مساعدات أساسية محددة عبر `api.runtime`. بالنسبة إلى TTS:

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
- يعيد مخزن صوت PCM المؤقت + معدل العينة. يجب على Plugins إعادة أخذ العينات/الترميز للمزوّدين.
- `listVoices` اختياري لكل مزوّد. استخدمه لمنتقيات الصوت أو تدفقات الإعداد المملوكة للمورّد.
- يمكن أن تتضمن قوائم الأصوات بيانات وصفية أغنى مثل اللغة المحلية، والنوع، ووسوم الشخصية للمنتقيات الواعية بالمزوّد.
- يدعم OpenAI وElevenLabs الاتصالات الهاتفية اليوم. ولا يدعمها Microsoft.

يمكن لـ Plugins أيضاً تسجيل مزوّدي الكلام عبر `api.registerSpeechProvider(...)`.

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

- أبقِ سياسة TTS، والرجوع الاحتياطي، وتسليم الرد في النواة.
- استخدم مزوّدي الكلام لسلوك التركيب المملوك للمورّد.
- يتم تطبيع إدخال Microsoft القديم `edge` إلى معرّف المزوّد `microsoft`.
- نموذج الملكية المفضل موجّه للشركات: يمكن لـ Plugin مورّد واحد أن يملك
  مزوّدي النص، والكلام، والصورة، والوسائط المستقبلية مع إضافة OpenClaw لعقود
  القدرات تلك.

لفهم الصور/الصوت/الفيديو، تسجّل Plugins مزوّد فهم وسائط ذا نوع محدد بدلاً من
حقيبة مفاتيح/قيم عامة:

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

- أبقِ التنسيق، والرجوع الاحتياطي، والإعداد، وربط القنوات في النواة.
- أبقِ سلوك المورّد في Plugin المزوّد.
- يجب أن يبقى التوسع الإضافي ذا أنواع محددة: طرائق اختيارية جديدة، وحقول نتائج
  اختيارية جديدة، وقدرات اختيارية جديدة.
- يتبع توليد الفيديو بالفعل النمط نفسه:
  - تملك النواة عقد القدرة ومساعد وقت التشغيل
  - تسجّل Plugins المورّدين `api.registerVideoGenerationProvider(...)`
  - تستهلك Plugins الميزات/القنوات `api.runtime.videoGeneration.*`

بالنسبة إلى مساعدات وقت تشغيل فهم الوسائط، يمكن لـ Plugins استدعاء:

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

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.5",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "Use the printed fields as the source of truth." },
  ],
  instructions: "Return entities and searchable tags.",
  schemaName: "example.evidence",
  jsonSchema: {
    type: "object",
    properties: {
      entities: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
  },
  cfg: api.config,
});
```

لنسخ الصوت، يمكن لـ Plugins استخدام إما وقت تشغيل فهم الوسائط أو الاسم المستعار
STT الأقدم:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

ملاحظات:

- `api.runtime.mediaUnderstanding.*` هو السطح المشترك المفضل لفهم الصور/الصوت/الفيديو.
- `extractStructuredWithModel(...)` هو السطح المواجه لـ Plugin للاستخراج المحدود
  المملوك للمزوّد والذي يبدأ بالصورة. ضمّن إدخال صورة واحداً على الأقل؛
  إدخالات النص سياق تكميلي.
  تملك Plugins المنتجات مساراتها ومخططاتها بينما يملك OpenClaw حد
  المزوّد/وقت التشغيل.
- يستخدم إعداد صوت فهم الوسائط الأساسي (`tools.media.audio`) وترتيب رجوع المزوّد.
- يعيد `{ text: undefined }` عندما لا يُنتج أي خرج نسخ (مثلاً إدخال متجاوز/غير مدعوم).
- يبقى `api.runtime.stt.transcribeAudioFile(...)` اسماً مستعاراً للتوافق.

يمكن لـ Plugins أيضاً إطلاق عمليات subagent في الخلفية عبر `api.runtime.subagent`:

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

- `provider` و`model` تجاوزات اختيارية لكل تشغيل، وليسا تغييرات جلسة مستمرة.
- لا يلتزم OpenClaw بهذه الحقول المتجاوزة إلا للمتصلين الموثوقين.
- بالنسبة إلى عمليات الرجوع الاحتياطي المملوكة لـ Plugin، يجب أن يختار المشغّلون ذلك عبر `plugins.entries.<id>.subagent.allowModelOverride: true`.
- استخدم `plugins.entries.<id>.subagent.allowedModels` لتقييد Plugins الموثوقة على أهداف `provider/model` أساسية محددة، أو `"*"` للسماح صراحة بأي هدف.
- لا تزال عمليات subagent الخاصة بـ Plugins غير الموثوقة تعمل، لكن تُرفض طلبات التجاوز بدلاً من الرجوع بصمت.
- تُوسم جلسات subagent التي تنشئها Plugins بمعرّف Plugin المنشئ. قد يحذف الرجوع الاحتياطي `api.runtime.subagent.deleteSession(...)` تلك الجلسات المملوكة فقط؛ لا يزال حذف الجلسات الاعتباطي يتطلب طلب Gateway بنطاق إداري.

للبحث على الويب، يمكن لـ Plugins استهلاك مساعد وقت التشغيل المشترك بدلاً من
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

يمكن لـ Plugins أيضاً تسجيل مزوّدي بحث الويب عبر
`api.registerWebSearchProvider(...)`.

ملاحظات:

- أبقِ اختيار المزوّد، وحل بيانات الاعتماد، ودلالات الطلب المشتركة في النواة.
- استخدم مزوّدي بحث الويب لوسائل نقل البحث الخاصة بالمورّدين.
- `api.runtime.webSearch.*` هو السطح المشترك المفضل لـ Plugins الميزات/القنوات التي تحتاج إلى سلوك بحث دون الاعتماد على غلاف أداة الوكيل.

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

- `generate(...)`: ولّد صورة باستخدام سلسلة مزوّدي توليد الصور المضبوطة.
- `listProviders(...)`: اسرد مزوّدي توليد الصور المتاحين وقدراتهم.

## مسارات HTTP في Gateway

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

- `path`: مسار التوجيه تحت خادم HTTP الخاص بالبوابة.
- `auth`: مطلوب. استخدم `"gateway"` لطلب مصادقة Gateway العادية، أو `"plugin"` للمصادقة/التحقق من Webhook المُدارَين بواسطة Plugin.
- `match`: اختياري. `"exact"` (الافتراضي) أو `"prefix"`.
- `replaceExisting`: اختياري. يسمح لنفس Plugin باستبدال تسجيل مساره الحالي.
- `handler`: أعد `true` عندما يكون المسار قد عالج الطلب.

ملاحظات:

- تمت إزالة `api.registerHttpHandler(...)` وسيؤدي ذلك إلى خطأ في تحميل Plugin. استخدم `api.registerHttpRoute(...)` بدلا منه.
- يجب أن تعلن مسارات Plugin عن `auth` صراحة.
- تُرفض تعارضات `path + match` الدقيقة ما لم يكن `replaceExisting: true`، ولا يمكن لـ Plugin واحد استبدال مسار Plugin آخر.
- تُرفض المسارات المتداخلة ذات مستويات `auth` المختلفة. أبقِ سلاسل التمرير الاحتياطي `exact`/`prefix` على مستوى المصادقة نفسه فقط.
- مسارات `auth: "plugin"` لا تتلقى نطاقات وقت تشغيل المشغل تلقائيا. فهي مخصصة لـ webhooks/التحقق من التوقيع التي يديرها Plugin، وليست لاستدعاءات مساعد Gateway ذات الامتيازات.
- تعمل مسارات `auth: "gateway"` داخل نطاق وقت تشغيل طلب Gateway، لكن هذا النطاق محافظ عن قصد:
  - مصادقة الحامل بالسر المشترك (`gateway.auth.mode = "token"` / `"password"`) تُبقي نطاقات وقت تشغيل مسار Plugin مثبتة على `operator.write`، حتى إذا أرسل المستدعي `x-openclaw-scopes`
  - أوضاع HTTP الموثوقة الحاملة للهوية (مثل `trusted-proxy` أو `gateway.auth.mode = "none"` على مدخل خاص) تراعي `x-openclaw-scopes` فقط عندما يكون الرأس موجودا صراحة
  - إذا كان `x-openclaw-scopes` غائبا في طلبات مسار Plugin الحاملة للهوية هذه، يعود نطاق وقت التشغيل إلى `operator.write`
- قاعدة عملية: لا تفترض أن مسار Plugin بمصادقة Gateway هو سطح إدارة ضمني. إذا كان مسارك يحتاج إلى سلوك مخصص للإدارة فقط، فاشترط وضع مصادقة حامل للهوية ووثق عقد رأس `x-openclaw-scopes` الصريح.

## مسارات استيراد Plugin SDK

استخدم مسارات SDK الفرعية الضيقة بدلا من جذر `openclaw/plugin-sdk` الأحادي
barrel عند تأليف Plugins جديدة. المسارات الفرعية الأساسية:

| المسار الفرعي                       | الغرض                                             |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | بدائيات تسجيل Plugin                              |
| `openclaw/plugin-sdk/channel-core`  | مساعدات إدخال/بناء القناة                         |
| `openclaw/plugin-sdk/core`          | مساعدات مشتركة عامة وعقد شامل                     |
| `openclaw/plugin-sdk/config-schema` | مخطط Zod لجذر `openclaw.json` (`OpenClawSchema`) |

تختار Plugins القنوات من عائلة من نقاط الربط الضيقة — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, و`channel-actions`. يجب توحيد سلوك الموافقة
على عقد `approvalCapability` واحد بدلا من الخلط بين حقول Plugin غير مرتبطة.
راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins).

تعيش مساعدات وقت التشغيل والإعدادات ضمن مسارات فرعية مركزة مطابقة `*-runtime`
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, وغير ذلك). فضّل `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot`, و`config-mutation`
بدلا من barrel التوافق الواسع `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
و`openclaw/plugin-sdk/infra-runtime` هي طبقات توافق مهملة لـ
Plugins أقدم. يجب أن تستورد الشيفرة الجديدة بدائيات عامة أضيق بدلا من ذلك.
</Info>

نقاط الإدخال الداخلية للمستودع (لكل جذر حزمة Plugin مضمن):

- `index.js` — إدخال Plugin المضمن
- `api.js` — barrel للمساعدات/الأنواع
- `runtime-api.js` — barrel خاص بوقت التشغيل فقط
- `setup-entry.js` — إدخال Plugin للإعداد

يجب أن تستورد Plugins الخارجية مسارات `openclaw/plugin-sdk/*` الفرعية فقط. لا
تستورد أبدا `src/*` من حزمة Plugin أخرى من core أو من Plugin آخر.
تفضل نقاط الإدخال المحملة عبر الواجهة لقطة إعدادات وقت التشغيل النشطة عندما
توجد، ثم تعود إلى ملف الإعدادات المحلول على القرص.

توجد مسارات فرعية خاصة بالقدرات مثل `image-generation`, `media-understanding`,
و`speech` لأن Plugins المضمنة تستخدمها اليوم. لكنها ليست
عقودا خارجية مجمدة تلقائيا على المدى الطويل — تحقق من صفحة مرجع SDK
ذات الصلة عند الاعتماد عليها.

## مخططات أداة الرسائل

يجب أن تمتلك Plugins مساهمات مخطط `describeMessageTool(...)` الخاصة بالقناة
للبدائيات غير الرسائل مثل التفاعلات، والقراءات، والاستطلاعات.
يجب أن يستخدم عرض الإرسال المشترك عقد `MessagePresentation` العام
بدلا من حقول الأزرار أو المكونات أو الكتل أو البطاقات الأصلية للمزود.
راجع [عرض الرسائل](/ar/plugins/message-presentation) لمعرفة العقد،
وقواعد الرجوع الاحتياطي، وتخطيط المزود، وقائمة تحقق مؤلف Plugin.

تعلن Plugins القادرة على الإرسال ما يمكنها عرضه من خلال قدرات الرسائل:

- `presentation` لكتل العرض الدلالية (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` لطلبات التسليم المثبت

يقرر core ما إذا كان سيعرض العرض أصليا أم سيخفضه إلى نص.
لا تكشف منافذ هروب لواجهة مستخدم أصلية للمزود من أداة الرسائل العامة.
تبقى مساعدات SDK المهملة للمخططات الأصلية القديمة مصدرة لأجل
Plugins طرف ثالث الموجودة، لكن يجب ألا تستخدمها Plugins الجديدة.

## حل هدف القناة

يجب أن تمتلك Plugins القنوات دلالات الأهداف الخاصة بالقناة. أبقِ مضيف
الإرسال المشترك عاما واستخدم سطح محول الرسائل لقواعد المزود:

- `messaging.inferTargetChatType({ to })` يقرر ما إذا كان الهدف المطبع
  يجب أن يعامل كـ `direct` أو `group` أو `channel` قبل البحث في الدليل.
- `messaging.targetResolver.looksLikeId(raw, normalized)` يخبر core ما إذا كان
  يجب أن يتجاوز إدخال ما مباشرة إلى حل شبيه بالمعرف بدلا من بحث الدليل.
- `messaging.targetResolver.resolveTarget(...)` هو رجوع Plugin الاحتياطي عندما
  يحتاج core إلى حل نهائي مملوك للمزود بعد التطبيع أو بعد
  إخفاق الدليل.
- `messaging.resolveOutboundSessionRoute(...)` يمتلك إنشاء مسار الجلسة
  الخاص بالمزود بمجرد حل الهدف.

التقسيم الموصى به:

- استخدم `inferTargetChatType` لقرارات الفئة التي يجب أن تحدث قبل
  البحث في الأقران/المجموعات.
- استخدم `looksLikeId` لفحوصات "عامل هذا كمعرف هدف صريح/أصلي".
- استخدم `resolveTarget` كرجوع احتياطي للتطبيع الخاص بالمزود، وليس من أجل
  بحث واسع في الدليل.
- أبقِ المعرفات الأصلية للمزود مثل معرفات الدردشة، ومعرفات السلاسل، وJIDs، والمقابض، ومعرفات الغرف
  داخل قيم `target` أو معلمات خاصة بالمزود، وليس في حقول SDK العامة.

## أدلة مدعومة بالإعدادات

يجب أن تبقي Plugins التي تستنتج إدخالات الدليل من الإعدادات هذا المنطق داخل
Plugin وأن تعيد استخدام المساعدات المشتركة من
`openclaw/plugin-sdk/directory-runtime`.

استخدم هذا عندما تحتاج قناة إلى أقران/مجموعات مدعومة بالإعدادات مثل:

- أقران DM مدفوعين بقائمة السماح
- خرائط قنوات/مجموعات مهيأة
- بدائل دليل ثابتة ضمن نطاق الحساب

تتعامل المساعدات المشتركة في `directory-runtime` مع العمليات العامة فقط:

- تصفية الاستعلام
- تطبيق الحد
- مساعدات إزالة التكرار/التطبيع
- بناء `ChannelDirectoryEntry[]`

يجب أن يبقى فحص الحساب الخاص بالقناة وتطبيع المعرف في
تنفيذ Plugin.

## كتالوجات المزودين

يمكن لـ Plugins المزودين تعريف كتالوجات نماذج للاستدلال باستخدام
`registerProvider({ catalog: { run(...) { ... } } })`.

يعيد `catalog.run(...)` الشكل نفسه الذي يكتبه OpenClaw في
`models.providers`:

- `{ provider }` لإدخال مزود واحد
- `{ providers }` لعدة إدخالات مزودين

استخدم `catalog` عندما يمتلك Plugin معرفات نماذج خاصة بالمزود، أو
إعدادات URL الأساسية الافتراضية، أو بيانات تعريف نماذج محكومة بالمصادقة.

يتحكم `catalog.order` في وقت دمج كتالوج Plugin بالنسبة إلى المزودين
الضمنيين المدمجين في OpenClaw:

- `simple`: مزودون عاديون مدفوعون بمفتاح API أو env
- `profile`: مزودون يظهرون عند وجود ملفات تعريف مصادقة
- `paired`: مزودون ينشئون عدة إدخالات مزودين مرتبطة
- `late`: آخر تمريرة، بعد المزودين الضمنيين الآخرين

يفوز المزودون اللاحقون عند تصادم المفاتيح، لذلك يمكن لـ Plugins تجاوز
إدخال مزود مدمج له معرف المزود نفسه عمدا.

يمكن لـ Plugins أيضا نشر صفوف نماذج للقراءة فقط من خلال
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. هذا هو المسار المستقبلي لأسطح القائمة/المساعدة/المنتقي ويدعم
صفوف `text`, `image_generation`, `video_generation`, و`music_generation`.
لا تزال Plugins المزودين تمتلك استدعاءات نقاط النهاية الحية، وتبادل الرموز، وتخطيط
استجابة المورد؛ ويمتلك core شكل الصف المشترك، وتسميات المصدر، وتنسيق
مساعدة أدوات الوسائط. تنشئ تسجيلات مزودي توليد الوسائط صفوف كتالوج ثابتة
تلقائيا من `defaultModel`, `models`, و`capabilities`.

التوافق:

- لا يزال `discovery` يعمل كاسم مستعار قديم، لكنه يصدر تحذير إهمال
- إذا تم تسجيل كل من `catalog` و`discovery`، يستخدم OpenClaw `catalog`
- `augmentModelCatalog` مهمل؛ يجب أن تنشر المزودات المضمنة
  صفوفا تكميلية من خلال `registerModelCatalogProvider`

## فحص القناة للقراءة فقط

إذا كان Plugin الخاص بك يسجل قناة، ففضّل تنفيذ
`plugin.config.inspectAccount(cfg, accountId)` إلى جانب `resolveAccount(...)`.

السبب:

- `resolveAccount(...)` هو مسار وقت التشغيل. يُسمح له بافتراض أن بيانات الاعتماد
  مادية بالكامل ويمكنه الفشل بسرعة عند غياب الأسرار المطلوبة.
- يجب ألا تحتاج مسارات الأوامر للقراءة فقط مثل `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`، وتدفقات doctor/config
  repair إلى تجسيد بيانات اعتماد وقت التشغيل فقط من أجل
  وصف الإعدادات.

سلوك `inspectAccount(...)` الموصى به:

- أعد حالة حساب وصفية فقط.
- حافظ على `enabled` و`configured`.
- أدرج حقول مصدر/حالة بيانات الاعتماد عند اللزوم، مثل:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- لا تحتاج إلى إرجاع قيم الرموز الخام فقط للإبلاغ عن
  توفر القراءة فقط. إرجاع `tokenStatus: "available"` (وحقل المصدر المطابق)
  يكفي لأوامر نمط الحالة.
- استخدم `configured_unavailable` عندما تكون بيانات الاعتماد مهيأة عبر SecretRef لكنها
  غير متاحة في مسار الأمر الحالي.

يسمح هذا لأوامر القراءة فقط بالإبلاغ عن "مهيأ لكنه غير متاح في مسار
الأمر هذا" بدلا من الانهيار أو الإبلاغ خطأ عن الحساب على أنه غير مهيأ.

## حزم الحزم

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

يصبح كل إدخال Plugin. إذا سردت الحزمة عدة extensions، يصبح معرف Plugin
`name/<fileBase>`.

إذا كان Plugin الخاص بك يستورد تبعيات npm، فثبتها في ذلك الدليل بحيث
يكون `node_modules` متاحا (`npm install` / `pnpm install`).

حاجز أمان: يجب أن يبقى كل إدخال `openclaw.extensions` داخل دليل Plugin
بعد حل الروابط الرمزية. تُرفض الإدخالات التي تخرج من دليل الحزمة.

ملاحظة أمان: يقوم `openclaw plugins install` بتثبيت تبعيات Plugin باستخدام
`npm install --omit=dev --ignore-scripts` محلي للمشروع (لا توجد نصوص دورة حياة،
ولا تبعيات تطوير في وقت التشغيل)، مع تجاهل إعدادات تثبيت npm العامة الموروثة.
أبقِ أشجار تبعيات Plugin "JS/TS خالصة" وتجنب الحزم التي تتطلب
عمليات بناء `postinstall`.

اختياري: يمكن أن يشير `openclaw.setupEntry` إلى وحدة خفيفة مخصصة للإعداد فقط.
عندما يحتاج OpenClaw إلى أسطح إعداد لـ Plugin قناة معطل، أو
عندما يكون Plugin قناة ممكنا لكنه لا يزال غير مهيأ، فإنه يحمل `setupEntry`
بدلا من إدخال Plugin الكامل. هذا يجعل بدء التشغيل والإعداد أخف
عندما يقوم إدخال Plugin الرئيسي أيضا بتوصيل الأدوات، أو hooks، أو شيفرة أخرى
خاصة بوقت التشغيل فقط.

اختياري: يمكن لـ `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
إدخال Plugin قناة في مسار `setupEntry` نفسه خلال مرحلة بدء تشغيل Gateway
قبل الاستماع، حتى عندما تكون القناة مهيأة بالفعل.

استخدم هذا فقط عندما يغطي `setupEntry` بالكامل سطح بدء التشغيل الذي يجب أن يكون موجودًا
قبل أن يبدأ Gateway في الاستماع. عمليًا، يعني ذلك أن إدخال الإعداد
يجب أن يسجل كل قدرة مملوكة للقناة يعتمد عليها بدء التشغيل، مثل:

- تسجيل القناة نفسه
- أي مسارات HTTP يجب أن تكون متاحة قبل أن يبدأ Gateway في الاستماع
- أي طرق أو أدوات أو خدمات Gateway يجب أن تكون موجودة أثناء تلك النافذة نفسها

إذا كان الإدخال الكامل لديك لا يزال يملك أي قدرة مطلوبة لبدء التشغيل، فلا تفعّل
هذه العلامة. أبقِ Plugin على السلوك الافتراضي ودع OpenClaw يحمّل
الإدخال الكامل أثناء بدء التشغيل.

يمكن للقنوات المضمنة أيضًا نشر مساعدين لسطح عقد خاص بالإعداد فقط يستطيع core
استشارتهم قبل تحميل وقت تشغيل القناة الكامل. سطح ترقية الإعداد الحالي هو:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

يستخدم core هذا السطح عندما يحتاج إلى ترقية إعداد قناة قديم ذي حساب واحد
إلى `channels.<id>.accounts.*` من دون تحميل إدخال Plugin الكامل.
Matrix هو المثال المضمن الحالي: ينقل فقط مفاتيح المصادقة/التمهيد إلى حساب
مُرقّى مسمى عندما تكون الحسابات المسماة موجودة بالفعل، ويمكنه الاحتفاظ بمفتاح
حساب افتراضي مكوّن غير قياسي بدلًا من إنشاء `accounts.default` دائمًا.

تُبقي محولات رقع الإعداد هذه اكتشاف سطح العقد المضمن كسولًا. يبقى وقت الاستيراد
خفيفًا؛ ولا يُحمّل سطح الترقية إلا عند أول استخدام بدلًا من إعادة الدخول إلى بدء
تشغيل القناة المضمنة عند استيراد الوحدة.

عندما تتضمن أسطح بدء التشغيل هذه طرق Gateway RPC، أبقِها على بادئة خاصة
بالـ Plugin. تبقى مساحات أسماء الإدارة الأساسية (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) محجوزة وتتحول دائمًا
إلى `operator.admin`، حتى إذا طلب Plugin نطاقًا أضيق.

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

### بيانات تعريف كتالوج القنوات

يمكن لـ Plugins القنوات الإعلان عن بيانات تعريف الإعداد/الاكتشاف عبر `openclaw.channel` و
تلميحات التثبيت عبر `openclaw.install`. هذا يبقي كتالوج core خاليًا من البيانات.

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
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
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

- `detailLabel`: تسمية ثانوية لأسطح الكتالوج/الحالة الأكثر ثراءً
- `docsLabel`: تجاوز نص الرابط لرابط الوثائق
- `preferOver`: معرفات Plugin/قناة ذات أولوية أدنى يجب أن يتفوق عليها إدخال الكتالوج هذا
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: عناصر تحكم في نص سطح الاختيار
- `markdownCapable`: يعلّم القناة على أنها قادرة على markdown لقرارات تنسيق الإخراج
- `exposure.configured`: إخفاء القناة من أسطح قوائم القنوات المكوّنة عند ضبطها على `false`
- `exposure.setup`: إخفاء القناة من منتقيات الإعداد/التكوين التفاعلية عند ضبطها على `false`
- `exposure.docs`: تعليم القناة على أنها داخلية/خاصة لأسطح تنقل الوثائق
- `showConfigured` / `showInSetup`: أسماء بديلة قديمة لا تزال مقبولة للتوافق؛ فضّل `exposure`
- `quickstartAllowFrom`: إدخال القناة في تدفق البدء السريع القياسي `allowFrom`
- `forceAccountBinding`: طلب ربط حساب صريح حتى عند وجود حساب واحد فقط
- `preferSessionLookupForAnnounceTarget`: تفضيل بحث الجلسة عند حل أهداف الإعلان

يمكن لـ OpenClaw أيضًا دمج **كتالوجات قنوات خارجية** (على سبيل المثال، تصدير سجل MPM).
ضع ملف JSON في أحد المسارات التالية:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

أو وجّه `OPENCLAW_PLUGIN_CATALOG_PATHS` (أو `OPENCLAW_MPM_CATALOG_PATHS`) إلى
ملف JSON واحد أو أكثر (مفصولة بفواصل/فواصل منقوطة/`PATH`). يجب أن يحتوي كل ملف
على `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. يقبل المحلل أيضًا `"packages"` أو `"plugins"` كأسماء بديلة قديمة لمفتاح `"entries"`.

تعرض إدخالات كتالوج القنوات المولدة وإدخالات كتالوج تثبيت المزوّد
حقائق مصدر التثبيت المعيارية بجوار كتلة `openclaw.install` الخام. تحدد
الحقائق المعيارية ما إذا كانت مواصفة npm إصدارًا دقيقًا أم محددًا عائمًا،
وما إذا كانت بيانات تعريف التكامل المتوقعة موجودة، وما إذا كان مسار مصدر
محلي متاحًا أيضًا. عندما تكون هوية الكتالوج/الحزمة معروفة، تحذر الحقائق
المعيارية إذا انحرف اسم حزمة npm المحلل عن تلك الهوية. كما تحذر عندما يكون
`defaultChoice` غير صالح أو يشير إلى مصدر غير متاح، وعندما تكون بيانات تعريف
تكامل npm موجودة من دون مصدر npm صالح. يجب على المستهلكين التعامل مع
`installSource` كحقل اختياري إضافي حتى لا تضطر الإدخالات المصنوعة يدويًا
وواجهات توافق الكتالوج إلى توليده.
يتيح هذا للإعداد التشخيصي وعمليات التشخيص شرح حالة مستوى المصدر من دون
استيراد وقت تشغيل Plugin.

يجب أن تفضّل إدخالات npm الخارجية الرسمية `npmSpec` دقيقًا مع
`expectedIntegrity`. لا تزال أسماء الحزم المجردة وdist-tags تعمل للتوافق،
لكنها تعرض تحذيرات مستوى المصدر كي يستطيع الكتالوج الانتقال نحو تثبيتات
مثبتة ومتحققة التكامل من دون كسر Plugins الموجودة. عندما يثبت الإعداد من
مسار كتالوج محلي، فإنه يسجل إدخال فهرس Plugin مُدارًا مع `source: "path"`
و`sourcePath` نسبيًا إلى مساحة العمل عند الإمكان. يبقى مسار التحميل التشغيلي
المطلق في `plugins.load.paths`؛ ويتجنب سجل التثبيت تكرار مسارات محطة العمل
المحلية في إعدادات طويلة الأجل. هذا يبقي تثبيتات التطوير المحلي مرئية
لتشخيصات مستوى المصدر من دون إضافة سطح إفصاح ثانٍ خام لمسارات نظام الملفات.
فهرس Plugin الدائم `plugins/installs.json` هو مصدر حقيقة التثبيت ويمكن تحديثه
من دون تحميل وحدات وقت تشغيل Plugin. خريطة `installRecords` الخاصة به دائمة
حتى عند فقدان بيان Plugin أو كونه غير صالح؛ ومصفوفة `plugins` الخاصة به
هي عرض بيان قابل لإعادة البناء.

## Plugins محرك السياق

تملك Plugins محرك السياق تنسيق سياق الجلسة للإدخال، والتجميع،
وCompaction. سجّلها من Plugin لديك باستخدام
`api.registerContextEngine(id, factory)`، ثم اختر المحرك النشط باستخدام
`plugins.slots.contextEngine`.

استخدم هذا عندما يحتاج Plugin لديك إلى استبدال مسار السياق الافتراضي أو توسيعه
بدلًا من مجرد إضافة بحث في الذاكرة أو خطافات.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
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

يعرض `ctx` الخاص بالمصنع قيم `config` و`agentDir` و`workspaceDir`
اختيارية للتهيئة وقت الإنشاء.

إذا كان محركك **لا** يملك خوارزمية Compaction، فأبقِ `compact()`
منفذة وفوّضها صراحةً:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
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

عندما يحتاج Plugin إلى سلوك لا يناسب API الحالي، لا تتجاوز نظام Plugin
بوصول خاص إلى الداخل. أضف القدرة الناقصة.

التسلسل الموصى به:

1. عرّف عقد core
   قرر ما السلوك المشترك الذي يجب أن يملكه core: السياسة، والرجوع الاحتياطي،
   ودمج الإعدادات، ودورة الحياة، والدلالات المواجهة للقنوات، وشكل مساعد وقت التشغيل.
2. أضف أسطح تسجيل/وقت تشغيل typed للـ Plugin
   وسّع `OpenClawPluginApi` و/أو `api.runtime` بأصغر سطح قدرة typed مفيد.
3. صِل core + مستهلكي القناة/الميزة
   يجب أن تستهلك القنوات وPlugins الميزات القدرة الجديدة عبر core،
   لا عبر استيراد تنفيذ بائع مباشرة.
4. سجّل تنفيذات البائعين
   ثم تسجل Plugins البائعين خلفياتها مقابل القدرة.
5. أضف تغطية للعقد
   أضف اختبارات حتى تبقى الملكية وشكل التسجيل صريحين مع مرور الوقت.

بهذه الطريقة يبقى OpenClaw ذا رأي واضح من دون أن يصبح مضمّنًا على نحو ثابت
في رؤية مزوّد واحد للعالم. راجع [وصفة القدرات](/ar/plugins/adding-capabilities)
للحصول على قائمة تحقق ملفات ملموسة ومثال عملي.

### قائمة تحقق القدرات

عند إضافة قدرة جديدة، يجب عادةً أن يلمس التنفيذ هذه الأسطح معًا:

- أنواع عقد core في `src/<capability>/types.ts`
- مساعد مشغّل/وقت تشغيل core في `src/<capability>/runtime.ts`
- سطح تسجيل API الخاص بـ Plugin في `src/plugins/types.ts`
- توصيل سجل Plugin في `src/plugins/registry.ts`
- تعريض وقت تشغيل Plugin في `src/plugins/runtime/*` عندما تحتاج Plugins الميزات/القنوات إلى استهلاكه
- مساعدو الالتقاط/الاختبار في `src/test-utils/plugin-registration.ts`
- تأكيدات الملكية/العقد في `src/plugins/contracts/registry.ts`
- وثائق المشغل/Plugin في `docs/`

إذا كان أحد هذه الأسطح مفقودًا، فذلك عادةً علامة على أن القدرة لم تندمج
بالكامل بعد.

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

نمط اختبار العقد:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

هذا يبقي القاعدة بسيطة:

- يملك core عقد القدرة + التنسيق
- تملك Plugins البائعين تنفيذات البائعين
- تستهلك Plugins الميزات/القنوات مساعدي وقت التشغيل
- تبقي اختبارات العقد الملكية صريحة

## ذو صلة

- [معمارية Plugin](/ar/plugins/architecture) — نموذج وأشكال القدرات العامة
- [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
