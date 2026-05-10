---
read_when:
    - تنفيذ خطافات وقت تشغيل المزوّد، أو دورة حياة القناة، أو مجموعات الحزم
    - تصحيح أخطاء ترتيب تحميل Plugin أو حالة السجل
    - إضافة قدرة Plugin جديدة أو Plugin لمحرك السياق
summary: 'الأجزاء الداخلية لبنية Plugin: مسار التحميل، والسجل، وخطافات وقت التشغيل، ومسارات HTTP، والجداول المرجعية'
title: داخليات بنية Plugin
x-i18n:
    generated_at: "2026-05-10T19:47:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41a28b83759906df693a00f3a20237bb7b91905eb948ff7bb354608e7997119
    source_path: plugins/architecture-internals.md
    workflow: 16
---

للاطّلاع على نموذج الإمكانات العام، وأشكال Plugin، وعقود الملكية/التنفيذ، راجع [معمارية Plugin](/ar/plugins/architecture). هذه الصفحة هي المرجع للآليات الداخلية: مسار التحميل، والسجل، وخطافات وقت التشغيل، ومسارات HTTP في Gateway، ومسارات الاستيراد، وجداول المخططات.

## مسار التحميل

عند بدء التشغيل، ينفّذ OpenClaw تقريبًا ما يلي:

1. يكتشف جذور Plugin المرشحة
2. يقرأ بيانات manifest للحزم الأصلية أو المتوافقة وبيانات package الوصفية
3. يرفض المرشحين غير الآمنين
4. يطبّع إعدادات Plugin (`plugins.enabled`، `allow`، `deny`، `entries`،
   `slots`، `load.paths`)
5. يقرر التمكين لكل مرشح
6. يحمّل الوحدات الأصلية الممكّنة: تستخدم الوحدات المضمّنة المبنية محمّلًا أصليًا؛
   ويستخدم مصدر TypeScript المحلي التابع لجهات خارجية مسار Jiti الاحتياطي الطارئ
7. يستدعي خطافات `register(api)` الأصلية ويجمع التسجيلات في سجل Plugin
8. يعرّض السجل للأوامر/أسطح وقت التشغيل

<Note>
`activate` هو اسم مستعار قديم لـ `register` — يحلّ المحمّل أيهما موجود (`def.register ?? def.activate`) ويستدعيه في النقطة نفسها. تستخدم جميع Plugins المضمّنة `register`؛ فضّل `register` لـ Plugins الجديدة.
</Note>

تحدث بوابات السلامة **قبل** تنفيذ وقت التشغيل. يُحظر المرشحون
عندما يخرج الإدخال من جذر Plugin، أو يكون المسار قابلًا للكتابة من الجميع، أو تبدو
ملكية المسار مريبة بالنسبة إلى Plugins غير المضمّنة.

يبقى المرشحون المحظورون مرتبطين بمعرّف Plugin الخاص بهم لأغراض التشخيص. إذا كانت الإعدادات
لا تزال تشير إلى ذلك المعرّف، فإن التحقق يبلغ عن Plugin بوصفه موجودًا لكنه محظورًا
ويشير مرة أخرى إلى تحذير سلامة المسار بدلًا من التعامل مع إدخال الإعدادات
بوصفه قديمًا.

### سلوك manifest أولًا

يمثل manifest مصدر الحقيقة لمستوى التحكم. يستخدمه OpenClaw من أجل:

- تحديد Plugin
- اكتشاف القنوات/Skills/مخطط الإعدادات المصرّح بها أو إمكانات الحزمة
- التحقق من `plugins.entries.<id>.config`
- تعزيز تسميات/عناصر نائبة في واجهة التحكم
- عرض بيانات التثبيت/الفهرس الوصفية
- الاحتفاظ بواصفات التنشيط والإعداد الرخيصة دون تحميل وقت تشغيل Plugin

بالنسبة إلى Plugins الأصلية، تكون وحدة وقت التشغيل هي جزء مستوى البيانات. وهي تسجّل
السلوك الفعلي مثل الخطافات أو الأدوات أو الأوامر أو تدفقات المزوّدين.

تبقى كتل manifest الاختيارية `activation` و`setup` على مستوى التحكم.
إنها واصفات بيانات وصفية فقط لتخطيط التنشيط واكتشاف الإعداد؛
ولا تستبدل تسجيل وقت التشغيل أو `register(...)` أو `setupEntry`.
بات أول مستهلكي التنشيط الحي يستخدمون تلميحات الأوامر والقنوات والمزوّدين في manifest
لتضييق تحميل Plugin قبل التجسيد الأوسع للسجل:

- يضيّق تحميل CLI إلى Plugins التي تملك الأمر الأساسي المطلوب
- يضيّق إعداد القناة/حل Plugin إلى Plugins التي تملك معرّف القناة المطلوب
- يضيّق إعداد/حل وقت تشغيل المزوّد الصريح إلى Plugins التي تملك معرّف المزوّد المطلوب
- يستخدم تخطيط بدء تشغيل Gateway ‏`activation.onStartup` لعمليات استيراد بدء التشغيل الصريحة
  وإلغاء الاشتراك في بدء التشغيل؛ ولا تُحمّل Plugins التي لا تحتوي على بيانات وصفية لبدء التشغيل إلا
  عبر مشغلات تنشيط أضيق

لا تزال عمليات التحميل المسبق لوقت التشغيل وقت الطلب التي تطلب نطاق `all` الواسع تستمد
مجموعة معرّفات Plugin فعالة وصريحة من الإعدادات، وتخطيط بدء التشغيل، والقنوات
المهيأة، والفتحات، وقواعد التمكين التلقائي. إذا كانت تلك المجموعة المشتقة فارغة، فإن OpenClaw
يحمّل سجل وقت تشغيل فارغًا بدلًا من التوسيع إلى كل Plugin قابل للاكتشاف.

يعرض مخطط التنشيط كلًا من واجهة API بالمعرّفات فقط للمتصلين الحاليين وواجهة
API للخطة للتشخيصات الجديدة. تبلغ إدخالات الخطة عن سبب اختيار Plugin،
مع فصل تلميحات مخطط `activation.*` الصريحة عن fallback ملكية manifest
مثل `providers` و`channels` و`commandAliases` و`setup.providers`
و`contracts.tools` والخطافات. فصل السبب هذا هو حد التوافق:
تستمر بيانات Plugin الوصفية الحالية في العمل، بينما يمكن للتعليمات البرمجية الجديدة اكتشاف التلميحات الواسعة
أو سلوك fallback دون تغيير دلالات تحميل وقت التشغيل.

يفضّل اكتشاف الإعداد الآن المعرّفات المملوكة للواصف مثل `setup.providers` و
`setup.cliBackends` لتضييق Plugins المرشحة قبل أن يعود إلى
`setup-api` من أجل Plugins التي لا تزال تحتاج إلى خطافات وقت تشغيل وقت الإعداد. تستخدم
قوائم إعداد المزوّد `providerAuthChoices` من manifest، وخيارات الإعداد المشتقة من الواصف،
وبيانات فهرس التثبيت الوصفية دون تحميل وقت تشغيل المزوّد. يُعد
`setup.requiresRuntime: false` الصريح حدًا فاصلاً للواصف فقط؛ أما حذف
`requiresRuntime` فيُبقي fallback القديم إلى setup-api من أجل التوافق. إذا ادعى أكثر
من Plugin مكتشف واحد معرّف مزوّد إعداد أو خلفية CLI نفسه بعد التطبيع،
فإن بحث الإعداد يرفض المالك الغامض بدلًا من الاعتماد على
ترتيب الاكتشاف. عندما يُنفّذ وقت تشغيل الإعداد، تبلغ تشخيصات السجل
عن الانحراف بين `setup.providers` / `setup.cliBackends` والمزوّدين أو خلفيات CLI
المسجلة بواسطة setup-api دون حظر Plugins القديمة.

### حد ذاكرة Plugin المؤقتة

لا يخزّن OpenClaw نتائج اكتشاف Plugin أو بيانات سجل manifest المباشرة
خلف نوافذ زمنية مرتبطة بالساعة. يجب أن تصبح عمليات التثبيت وتعديلات manifest وتغييرات مسار التحميل
مرئية في القراءة الصريحة التالية للبيانات الوصفية أو إعادة بناء اللقطة.
قد يحتفظ محلل ملف manifest بذاكرة مؤقتة محدودة لتوقيع الملف ومفتاحها
مسار manifest المفتوح، وinode، والحجم، والطوابع الزمنية؛ ولا تتجنب تلك الذاكرة المؤقتة إلا
إعادة تحليل البايتات غير المتغيرة، ويجب ألا تخزّن إجابات الاكتشاف أو السجل أو المالك أو
السياسة.

المسار السريع الآمن للبيانات الوصفية هو ملكية كائن صريحة، وليس ذاكرة مؤقتة مخفية.
ينبغي أن تمرر المسارات الساخنة لبدء تشغيل Gateway قيمة `PluginMetadataSnapshot` الحالية،
أو `PluginLookUpTable` المشتقة، أو سجل manifest صريحًا عبر سلسلة الاستدعاء.
يمكن للتحقق من الإعدادات، والتمكين التلقائي عند بدء التشغيل، وتمهيد Plugin، واختيار المزوّد
إعادة استخدام تلك الكائنات ما دامت تمثل الإعدادات الحالية ومخزون Plugin.
لا يزال بحث الإعداد يعيد بناء بيانات manifest الوصفية عند الطلب
ما لم يتلق مسار الإعداد المحدد سجل manifest صريحًا؛ أبقِ ذلك
fallback لمسار بارد بدلًا من إضافة ذاكرات مؤقتة مخفية للبحث. عندما يتغير الإدخال،
أعد بناء اللقطة واستبدلها بدلًا من تعديلها أو الاحتفاظ
بنسخ تاريخية.
ينبغي إعادة حساب العروض فوق سجل Plugin النشط ومساعدات تمهيد القنوات المضمّنة
من السجل/الجذر الحالي. لا بأس بالخرائط قصيرة العمر
داخل استدعاء واحد لإزالة تكرار العمل أو منع إعادة الدخول؛ ويجب ألا تصبح ذاكرات
مؤقتة لبيانات تعريف العملية.

بالنسبة إلى تحميل Plugin، تكون طبقة الذاكرة المؤقتة المستمرة هي تحميل وقت التشغيل. وقد تعيد استخدام
حالة المحمّل عندما تكون التعليمات البرمجية أو artifacts المثبتة قد حُمّلت فعليًا، مثل:

- `PluginLoaderCacheState` وسجلات وقت التشغيل النشطة المتوافقة
- ذاكرات jiti/الوحدات المؤقتة وذاكرات محمّل السطح العام المستخدمة لتجنب استيراد
  سطح وقت التشغيل نفسه مرارًا
- ذاكرات filesystem المؤقتة لـ artifacts الخاصة بـ Plugin المثبتة
- خرائط قصيرة العمر لكل استدعاء لتطبيع المسارات أو حل التكرارات

هذه الذاكرات المؤقتة تفاصيل تنفيذ لمستوى البيانات. ويجب ألا تجيب
عن أسئلة مستوى التحكم مثل "أي Plugin يملك هذا المزوّد؟" ما لم يكن
المتصل قد طلب تحميل وقت التشغيل عمدًا.

لا تضف ذاكرات مؤقتة مستمرة أو مرتبطة بالساعة من أجل:

- نتائج الاكتشاف
- سجلات manifest المباشرة
- سجلات manifest المعاد بناؤها من فهرس Plugin المثبت
- بحث مالك المزوّد، أو كبت النموذج، أو سياسة المزوّد، أو بيانات artifact العامة الوصفية
- أي إجابة أخرى مشتقة من manifest حيث ينبغي أن يكون manifest متغير، أو فهرس مثبت،
  أو مسار تحميل مرئيًا عند القراءة التالية للبيانات الوصفية

يعيد المتصلون الذين يبنون بيانات manifest الوصفية من فهرس Plugin المثبت المستمر
بناء ذلك السجل عند الطلب. الفهرس المثبت هو حالة مستوى مصدر دائمة؛
وليس ذاكرة مؤقتة مخفية للبيانات الوصفية داخل العملية.

## نموذج السجل

لا تعدّل Plugins المحمّلة عموميات عشوائية في core مباشرة. فهي تسجّل في
سجل Plugin مركزي.

يتتبع السجل:

- سجلات Plugin (الهوية، المصدر، الأصل، الحالة، التشخيصات)
- الأدوات
- الخطافات القديمة والخطافات المعرّفة النوع
- القنوات
- المزوّدين
- معالجات RPC في Gateway
- مسارات HTTP
- مسجلات CLI
- خدمات الخلفية
- الأوامر المملوكة لـ Plugin

ثم تقرأ ميزات core من ذلك السجل بدلًا من التحدث إلى وحدات Plugin
مباشرة. وهذا يحافظ على التحميل أحادي الاتجاه:

- وحدة Plugin -> تسجيل في السجل
- وقت تشغيل core -> استهلاك السجل

هذا الفصل مهم لقابلية الصيانة. إذ يعني أن معظم أسطح core لا تحتاج إلا
إلى نقطة تكامل واحدة: "قراءة السجل"، وليس "معاملة خاصة لكل وحدة Plugin".

## استدعاءات ربط المحادثة

يمكن لـ Plugins التي تربط محادثة أن تتفاعل عند حل موافقة.

استخدم `api.onConversationBindingResolved(...)` لتلقي استدعاء بعد الموافقة على طلب ربط
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
- `decision`: `"allow-once"` أو `"allow-always"` أو `"deny"`
- `binding`: الربط المحلول للطلبات الموافق عليها
- `request`: ملخص الطلب الأصلي، وتلميح الفصل، ومعرّف المرسل، و
  بيانات المحادثة الوصفية

هذا الاستدعاء للإشعار فقط. لا يغيّر من يُسمح له بربط
محادثة، ويعمل بعد انتهاء معالجة الموافقة في core.

## خطافات وقت تشغيل المزوّد

تحتوي Plugins المزوّدين على ثلاث طبقات:

- **بيانات manifest الوصفية** للبحث الرخيص قبل وقت التشغيل:
  `setup.providers[].envVars`، وتوافق `providerAuthEnvVars` المهمل،
  و`providerAuthAliases`، و`providerAuthChoices`، و`channelEnvVars`.
- **خطافات وقت الإعدادات**: `catalog` (القديم `discovery`) بالإضافة إلى
  `applyConfigDefaults`.
- **خطافات وقت التشغيل**: أكثر من 40 خطافًا اختياريًا تغطي المصادقة، وحل النماذج،
  وتغليف التدفق، ومستويات التفكير، وسياسة الإعادة، ونقاط نهاية الاستخدام. راجع
  القائمة الكاملة ضمن [ترتيب الخطافات واستخدامها](#hook-order-and-usage).

لا يزال OpenClaw يملك حلقة الوكيل العامة، وfailover، ومعالجة transcript، و
سياسة الأدوات. هذه الخطافات هي سطح التوسعة للسلوك الخاص بالمزوّد
دون الحاجة إلى نقل استدلال مخصص بالكامل.

استخدم `setup.providers[].envVars` في manifest عندما يكون لدى المزوّد بيانات اعتماد قائمة على env
ينبغي أن تراها مسارات المصادقة/الحالة/منتقي النماذج العامة دون
تحميل وقت تشغيل Plugin. لا يزال `providerAuthEnvVars` المهمل يُقرأ بواسطة
محوّل التوافق أثناء نافذة الإهمال، وتتلقى Plugins غير المضمّنة
التي تستخدمه تشخيص manifest. استخدم `providerAuthAliases` في manifest
عندما ينبغي لمعرّف مزوّد واحد إعادة استخدام متغيرات env، وملفات تعريف المصادقة،
والمصادقة المدعومة بالإعدادات، وخيار onboarding لمفتاح API الخاص بمعرّف مزوّد آخر. استخدم
`providerAuthChoices` في manifest عندما ينبغي لأسطح onboarding/اختيار المصادقة في CLI معرفة
معرّف اختيار المزوّد، وتسميات المجموعات، وتوصيل المصادقة البسيط بعلم واحد دون
تحميل وقت تشغيل المزوّد. أبقِ
`envVars` في وقت تشغيل المزوّد للتلميحات المواجهة للمشغل مثل تسميات onboarding أو متغيرات إعداد
client-id/client-secret لـ OAuth.

استخدم `channelEnvVars` في manifest عندما تكون لدى القناة مصادقة أو إعداد مدفوع بـ env ينبغي أن
تراه fallback العام لـ shell-env، أو فحوصات الإعداد/الحالة، أو مطالبات الإعداد
دون تحميل وقت تشغيل القناة.

### ترتيب الخطافات واستخدامها

بالنسبة إلى Plugins النماذج/المزوّدين، يستدعي OpenClaw الخطافات بهذا الترتيب التقريبي.
عمود "متى يُستخدم" هو دليل القرار السريع.
حقول المزوّد الخاصة بالتوافق فقط التي لم يعد OpenClaw يستدعيها، مثل
`ProviderPlugin.capabilities` و`suppressBuiltInModel`، غير مدرجة هنا عمدًا.

| #   | الخطاف                            | ما يفعله                                                                                                      | متى يُستخدم                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | نشر إعدادات المزوّد في `models.providers` أثناء توليد `models.json`                                           | عندما يملك المزوّد كتالوجًا أو قيمًا افتراضية لعنوان URL الأساسي                                                                             |
| 2   | `applyConfigDefaults`             | تطبيق القيم الافتراضية العامة لإعدادات المزوّد أثناء تجسيد الإعدادات                                         | عندما تعتمد القيم الافتراضية على وضع المصادقة، أو البيئة، أو دلالات عائلة نماذج المزوّد                                                     |
| --  | _(البحث المضمّن عن النموذج)_      | يحاول OpenClaw مسار السجل/الكتالوج العادي أولًا                                                              | _(ليس خطاف Plugin)_                                                                                                                          |
| 3   | `normalizeModelId`                | تطبيع الأسماء المستعارة القديمة أو التجريبية لمعرّف النموذج قبل البحث                                        | عندما يملك المزوّد تنظيف الأسماء المستعارة قبل حلّ النموذج القانوني                                                                         |
| 4   | `normalizeTransport`              | تطبيع `api` / `baseUrl` لعائلة المزوّد قبل تجميع النموذج العام                                               | عندما يملك المزوّد تنظيف النقل لمعرّفات مزوّد مخصصة ضمن عائلة النقل نفسها                                                                   |
| 5   | `normalizeConfig`                 | تطبيع `models.providers.<id>` قبل حلّ وقت التشغيل/المزوّد                                                    | عندما يحتاج المزوّد إلى تنظيف إعدادات يجب أن يبقى مع Plugin؛ كما توفّر مساعدات عائلة Google المضمّنة دعمًا احتياطيًا لمدخلات إعدادات Google المدعومة |
| 6   | `applyNativeStreamingUsageCompat` | تطبيق إعادات كتابة توافق استخدام البث الأصلي على مزوّدي الإعدادات                                           | عندما يحتاج المزوّد إلى إصلاحات بيانات وصفية لاستخدام البث الأصلي مدفوعة بنقطة النهاية                                                     |
| 7   | `resolveConfigApiKey`             | حلّ مصادقة علامة البيئة لمزوّدي الإعدادات قبل تحميل مصادقة وقت التشغيل                                      | عندما يملك المزوّد حلّ مفتاح API لعلامة البيئة؛ كما يملك `amazon-bedrock` محلّل علامة بيئة AWS مضمّنًا هنا                                  |
| 8   | `resolveSyntheticAuth`            | إظهار مصادقة محلية/ذاتية الاستضافة أو مدعومة بالإعدادات دون حفظ النص الصريح                                 | عندما يستطيع المزوّد العمل بعلامة اعتماد اصطناعية/محلية                                                                                    |
| 9   | `resolveExternalAuthProfiles`     | تركيب ملفات تعريف المصادقة الخارجية التي يملكها المزوّد؛ القيمة الافتراضية لـ `persistence` هي `runtime-only` لاعتمادات يملكها CLI/التطبيق | عندما يعيد المزوّد استخدام اعتمادات مصادقة خارجية دون حفظ رموز تحديث منسوخة؛ صرّح عن `contracts.externalAuthProviders` في البيان |
| 10  | `shouldDeferSyntheticProfileAuth` | تخفيض أولوية العناصر النائبة المخزّنة لملفات التعريف الاصطناعية خلف مصادقة مدعومة بالبيئة/الإعدادات        | عندما يخزّن المزوّد ملفات تعريف اصطناعية كعناصر نائبة يجب ألا تفوز بالأسبقية                                                               |
| 11  | `resolveDynamicModel`             | مزامنة احتياطية لمعرّفات النماذج التي يملكها المزوّد وليست في السجل المحلي بعد                               | عندما يقبل المزوّد معرّفات نماذج عشوائية من المصدر الأعلى                                                                                  |
| 12  | `prepareDynamicModel`             | إحماء غير متزامن، ثم تشغيل `resolveDynamicModel` مرة أخرى                                                     | عندما يحتاج المزوّد إلى بيانات وصفية من الشبكة قبل حلّ المعرّفات غير المعروفة                                                              |
| 13  | `normalizeResolvedModel`          | إعادة كتابة نهائية قبل أن يستخدم المشغّل المضمّن النموذج الذي تم حلّه                                        | عندما يحتاج المزوّد إلى إعادات كتابة للنقل لكنه لا يزال يستخدم نقلًا أساسيًا                                                               |
| 14  | `contributeResolvedModelCompat`   | المساهمة برايات توافق لنماذج البائع خلف نقل متوافق آخر                                                       | عندما يتعرّف المزوّد على نماذجه الخاصة على نقل الوكيل دون الاستحواذ على المزوّد                                                            |
| 15  | `normalizeToolSchemas`            | تطبيع مخططات الأدوات قبل أن يراها المشغّل المضمّن                                                            | عندما يحتاج المزوّد إلى تنظيف مخططات عائلة النقل                                                                                             |
| 16  | `inspectToolSchemas`              | إظهار تشخيصات مخططات يملكها المزوّد بعد التطبيع                                                              | عندما يريد المزوّد تحذيرات كلمات مفتاحية دون تعليم النواة قواعد خاصة بالمزوّد                                                              |
| 17  | `resolveReasoningOutputMode`      | اختيار عقد إخراج الاستدلال الأصلي أو الموسوم                                                                  | عندما يحتاج المزوّد إلى استدلال/إخراج نهائي موسوم بدلًا من الحقول الأصلية                                                                  |
| 18  | `prepareExtraParams`              | تطبيع معاملات الطلب قبل أغلفة خيارات البث العامة                                                             | عندما يحتاج المزوّد إلى معاملات طلب افتراضية أو تنظيف معاملات خاص بكل مزوّد                                                               |
| 19  | `createStreamFn`                  | استبدال مسار البث العادي بالكامل بنقل مخصص                                                                    | عندما يحتاج المزوّد إلى بروتوكول سلكي مخصص، لا مجرد غلاف                                                                                    |
| 20  | `wrapStreamFn`                    | غلاف بث بعد تطبيق الأغلفة العامة                                                                              | عندما يحتاج المزوّد إلى أغلفة توافق لرؤوس الطلب/الجسم/النموذج دون نقل مخصص                                                                |
| 21  | `resolveTransportTurnState`       | إرفاق رؤوس نقل أصلية لكل دور أو بيانات وصفية                                                                 | عندما يريد المزوّد أن ترسل وسائل النقل العامة هوية دور أصلية للمزوّد                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | إرفاق رؤوس WebSocket أصلية أو سياسة تهدئة للجلسة                                                              | عندما يريد المزوّد أن تضبط وسائل نقل WS العامة رؤوس الجلسة أو سياسة الرجوع الاحتياطي                                                       |
| 23  | `formatApiKey`                    | منسّق ملف تعريف المصادقة: يصبح الملف المخزّن سلسلة `apiKey` الخاصة بوقت التشغيل                             | عندما يخزّن المزوّد بيانات وصفية إضافية للمصادقة ويحتاج إلى شكل رمز وقت تشغيل مخصص                                                       |
| 24  | `refreshOAuth`                    | تجاوز تحديث OAuth لنقاط نهاية تحديث مخصصة أو سياسة فشل التحديث                                               | عندما لا يناسب المزوّد محدّثات `pi-ai` المشتركة                                                                                             |
| 25  | `buildAuthDoctorHint`             | تلميح إصلاح يُضاف عندما يفشل تحديث OAuth                                                                      | عندما يحتاج المزوّد إلى إرشاد إصلاح مصادقة يملكه المزوّد بعد فشل التحديث                                                                  |
| 26  | `matchesContextOverflowError`     | مطابق فيضان نافذة السياق الذي يملكه المزوّد                                                                   | عندما يملك المزوّد أخطاء فيضان خامًا قد تفوتها الاستدلالات العامة                                                                          |
| 27  | `classifyFailoverReason`          | تصنيف سبب التحويل الاحتياطي الذي يملكه المزوّد                                                               | عندما يستطيع المزوّد ربط أخطاء API/النقل الخام بحدود المعدل/التحميل الزائد/وما إلى ذلك                                                     |
| 28  | `isCacheTtlEligible`              | سياسة ذاكرة التخزين المؤقت للمطالبات لمزوّدي الوكيل/النقل الخلفي                                             | عندما يحتاج المزوّد إلى تقييد TTL لذاكرة التخزين المؤقت خاص بالوكيل                                                                        |
| 29  | `buildMissingAuthMessage`         | بديل رسالة استرداد المصادقة المفقودة العامة                                                                  | عندما يحتاج المزوّد إلى تلميح استرداد مصادقة مفقودة خاص بالمزوّد                                                                          |
| 30  | `augmentModelCatalog`             | صفوف كتالوج اصطناعية/نهائية تُضاف بعد الاكتشاف                                                               | عندما يحتاج المزوّد إلى صفوف توافق أمامي اصطناعية في `models list` والمنتقيات                                                             |
| 31  | `resolveThinkingProfile`          | مجموعة مستويات `/think` الخاصة بالنموذج، وتسميات العرض، والقيمة الافتراضية                                  | عندما يعرض المزوّد سلّم تفكير مخصصًا أو تسمية ثنائية لنماذج محددة                                                                          |
| 32  | `isBinaryThinking`                | خطاف توافق تبديل الاستدلال تشغيل/إيقاف                                                                        | عندما يعرض المزوّد التفكير الثنائي تشغيل/إيقاف فقط                                                                                         |
| 33  | `supportsXHighThinking`           | خطاف توافق دعم استدلال `xhigh`                                                                                | عندما يريد المزوّد تفعيل `xhigh` على مجموعة فرعية فقط من النماذج                                                                            |
| 34  | `resolveDefaultThinkingLevel`     | خطاف توافق مستوى `/think` الافتراضي                                                                           | عندما يملك المزوّد سياسة `/think` الافتراضية لعائلة نماذج                                                                                  |
| 35  | `isModernModelRef`                | مطابق النموذج الحديث لمرشحات ملف التعريف الحي واختيار اختبارات الدخان                                        | عندما يملك المزوّد مطابقة النموذج المفضّل للاختبارات الحية/اختبارات الدخان                                                                 |
| 36  | `prepareRuntimeAuth`              | استبدال اعتماد مكوّن بالرمز/المفتاح الفعلي لوقت التشغيل قبل الاستدلال مباشرة                                 | عندما يحتاج المزوّد إلى تبادل رمز أو اعتماد طلب قصير الأجل                                                                                 |
| 37  | `resolveUsageAuth`                | حلّ بيانات اعتماد الاستخدام/الفوترة لـ `/usage` وأسطح الحالة ذات الصلة                                     | يحتاج الموفّر إلى تحليل مخصّص لرمز الاستخدام/الحصة أو بيانات اعتماد استخدام مختلفة                                                               |
| 38  | `fetchUsageSnapshot`              | جلب لقطات الاستخدام/الحصة الخاصة بالموفّر وتطبيعها بعد حلّ المصادقة                             | يحتاج الموفّر إلى نقطة نهاية استخدام خاصة بالموفّر أو محلّل حمولة                                                                           |
| 39  | `createEmbeddingProvider`         | بناء محوّل تضمين مملوك للموفّر للذاكرة/البحث                                                     | سلوك تضمين الذاكرة يخص Plugin الموفّر                                                                                    |
| 40  | `buildReplayPolicy`               | إرجاع سياسة إعادة تشغيل تتحكم في التعامل مع سجل المحادثة للموفّر                                        | يحتاج الموفّر إلى سياسة سجل محادثة مخصّصة (على سبيل المثال، إزالة كتل التفكير)                                                               |
| 41  | `sanitizeReplayHistory`           | إعادة كتابة سجل إعادة التشغيل بعد التنظيف العام لسجل المحادثة                                                        | يحتاج الموفّر إلى إعادة كتابة خاصة بالموفّر لإعادة التشغيل تتجاوز مساعدات Compaction المشتركة                                                             |
| 42  | `validateReplayTurns`             | التحقق النهائي من أدوار إعادة التشغيل أو إعادة تشكيلها قبل المشغّل المضمّن                                           | يحتاج نقل الموفّر إلى تحقق أكثر صرامة من الأدوار بعد التنقية العامة                                                                    |
| 43  | `onModelSelected`                 | تشغيل الآثار الجانبية المملوكة للموفّر بعد الاختيار                                                                 | يحتاج الموفّر إلى قياسات عن بُعد أو حالة مملوكة للموفّر عندما يصبح نموذج نشطًا                                                                  |

يتحقق كل من `normalizeModelId` و`normalizeTransport` و`normalizeConfig` أولًا من
Plugin الموفر المطابق، ثم ينتقل عبر Plugins الموفرين الآخرين القادرين على الخطافات
إلى أن يغيّر أحدها فعليًا معرّف النموذج أو النقل/الإعداد. يحافظ ذلك على عمل
حشوات الموفر الخاصة بالاسم المستعار/التوافق دون أن يضطر المستدعي إلى معرفة أي
Plugin مضمن يملك إعادة الكتابة. إذا لم يُعد أي خطاف موفر كتابة إدخال إعداد مدعوم
من عائلة Google، فسيظل مطبّع إعداد Google المضمن يطبّق تنظيف التوافق هذا.

إذا كان الموفر يحتاج إلى بروتوكول سلكي مخصص بالكامل أو منفّذ طلبات مخصص، فهذا
نوع مختلف من الامتدادات. هذه الخطافات مخصصة لسلوك الموفر الذي لا يزال يعمل ضمن
حلقة الاستدلال العادية في OpenClaw.

### مثال موفر

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

### أمثلة مضمنة

تجمع Plugins الموفرين المضمنة الخطافات أعلاه لتناسب كتالوج كل مورّد، والمصادقة،
والتفكير، وإعادة التشغيل، واحتياجات الاستخدام. تعيش مجموعة الخطافات المرجعية مع
كل Plugin تحت `extensions/`؛ توضّح هذه الصفحة الأشكال بدلًا من مطابقة القائمة.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    تسجّل OpenRouter وKilocode وZ.AI وxAI `catalog` إضافة إلى
    `resolveDynamicModel` / `prepareDynamicModel` حتى تتمكن من إظهار معرّفات
    النماذج من المنبع قبل كتالوج OpenClaw الثابت.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    يقرن GitHub Copilot وGemini CLI وChatGPT Codex وMiniMax وXiaomi وz.ai
    `prepareRuntimeAuth` أو `formatApiKey` مع `resolveUsageAuth` +
    `fetchUsageSnapshot` لامتلاك تبادل الرموز وتكامل `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    تتيح العائلات المشتركة المسماة (`google-gemini`، `passthrough-gemini`،
    `anthropic-by-model`، `hybrid-anthropic-openai`) للموفرين الاشتراك في سياسة
    النص عبر `buildReplayPolicy` بدلًا من أن يعيد كل Plugin تنفيذ التنظيف.
  </Accordion>
  <Accordion title="Catalog-only providers">
    تسجّل `byteplus` و`cloudflare-ai-gateway` و`huggingface` و`kimi-coding` و`nvidia`
    و`qianfan` و`synthetic` و`together` و`venice` و`vercel-ai-gateway` و
    `volcengine` فقط `catalog` وتستخدم حلقة الاستدلال المشتركة.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    توجد رؤوس Beta، و`/fast` / `serviceTier`، و`context1m` داخل سطح
    `api.ts` / `contract-api.ts` العام الخاص بـ Plugin Anthropic
    (`wrapAnthropicProviderStream`، `resolveAnthropicBetas`،
    `resolveAnthropicFastMode`، `resolveAnthropicServiceTier`) بدلًا من
    SDK العام.
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

- يعيد `textToSpeech` حمولة إخراج TTS الأساسية العادية لأسطح الملف/الملاحظة الصوتية.
- يستخدم إعداد `messages.tts` الأساسي واختيار الموفر.
- يعيد مخزن صوت PCM + معدل العينة. يجب على Plugins إعادة أخذ العينات/الترميز للموفرين.
- `listVoices` اختياري لكل موفر. استخدمه لمنتقيات الأصوات أو تدفقات الإعداد التي يملكها المورّد.
- يمكن أن تتضمن قوائم الأصوات بيانات وصفية أغنى مثل اللغة، والجنس، ووسوم الشخصية للمنتقيات الواعية بالموفر.
- يدعم OpenAI وElevenLabs الاتصال الهاتفي اليوم. لا يدعمه Microsoft.

يمكن لـ Plugins أيضًا تسجيل موفري الكلام عبر `api.registerSpeechProvider(...)`.

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
- استخدم موفري الكلام لسلوك التوليف الذي يملكه المورّد.
- يتم تطبيع إدخال Microsoft القديم `edge` إلى معرّف الموفر `microsoft`.
- نموذج الملكية المفضل موجّه للشركات: يمكن لـ Plugin مورّد واحد أن يملك
  موفري النص، والكلام، والصور، والوسائط المستقبلية بينما يضيف OpenClaw
  عقود القدرات هذه.

لفهم الصور/الصوت/الفيديو، تسجّل Plugins موفر فهم وسائط واحدًا ذا نوع محدد
بدلًا من حقيبة مفتاح/قيمة عامة:

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

- أبقِ التنسيق، والرجوع الاحتياطي، والإعداد، وتوصيل القنوات في النواة.
- أبقِ سلوك المورّد في Plugin الموفر.
- يجب أن يبقى التوسع الإضافي ذا نوع محدد: طرق اختيارية جديدة، وحقول نتائج اختيارية جديدة، وقدرات اختيارية جديدة.
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
```

بالنسبة إلى نسخ الصوت، يمكن لـ Plugins استخدام إما وقت تشغيل فهم الوسائط
أو الاسم المستعار الأقدم STT:

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
- يستخدم إعداد الصوت الأساسي لفهم الوسائط (`tools.media.audio`) وترتيب الرجوع الاحتياطي للموفرين.
- يعيد `{ text: undefined }` عندما لا يتم إنتاج مخرج نسخ (مثلًا عند تخطي الإدخال أو عدم دعمه).
- يبقى `api.runtime.stt.transcribeAudioFile(...)` كاسم مستعار للتوافق.

يمكن لـ Plugins أيضًا إطلاق تشغيلات وكلاء فرعيين في الخلفية عبر `api.runtime.subagent`:

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

- `provider` و`model` تجاوزات اختيارية لكل تشغيل، وليست تغييرات جلسة دائمة.
- يحترم OpenClaw حقول التجاوز هذه فقط للمتصلين الموثوقين.
- بالنسبة إلى تشغيلات الرجوع الاحتياطي التي يملكها Plugin، يجب أن يشترك المشغلون باستخدام `plugins.entries.<id>.subagent.allowModelOverride: true`.
- استخدم `plugins.entries.<id>.subagent.allowedModels` لتقييد Plugins الموثوقة على أهداف `provider/model` قانونية محددة، أو `"*"` للسماح صراحة بأي هدف.
- لا تزال تشغيلات الوكيل الفرعي من Plugins غير الموثوقة تعمل، لكن طلبات التجاوز تُرفض بدلًا من الرجوع بصمت.
- تُوسم جلسات الوكيل الفرعي التي تنشئها Plugins بمعرّف Plugin المنشئ. قد يحذف الرجوع الاحتياطي `api.runtime.subagent.deleteSession(...)` تلك الجلسات المملوكة فقط؛ ولا يزال حذف الجلسات العشوائي يتطلب طلب Gateway بنطاق مسؤول.

بالنسبة إلى بحث الويب، يمكن لـ Plugins استهلاك مساعد وقت التشغيل المشترك بدلًا من
الوصول إلى توصيلات أداة الوكيل:

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

يمكن لـ Plugins أيضًا تسجيل موفري بحث الويب عبر
`api.registerWebSearchProvider(...)`.

ملاحظات:

- أبقِ اختيار الموفر، وحل بيانات الاعتماد، ودلالات الطلب المشتركة في النواة.
- استخدم موفري بحث الويب لنواقل البحث الخاصة بالمورّد.
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

- `generate(...)`: ولّد صورة باستخدام سلسلة موفري توليد الصور المضبوطة.
- `listProviders(...)`: اسرد موفري توليد الصور المتاحين وقدراتهم.

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

- `path`: مسار التوجيه تحت خادم HTTP الخاص بالـ gateway.
- `auth`: مطلوب. استخدم `"gateway"` لاشتراط مصادقة gateway العادية، أو `"plugin"` للمصادقة/التحقق من Webhook الذي يديره Plugin.
- `match`: اختياري. `"exact"` (الافتراضي) أو `"prefix"`.
- `replaceExisting`: اختياري. يسمح لنفس Plugin باستبدال تسجيل المسار الموجود الخاص به.
- `handler`: أعد `true` عندما يعالج المسار الطلب.

ملاحظات:

- تمت إزالة `api.registerHttpHandler(...)` وسيؤدي إلى خطأ عند تحميل Plugin. استخدم `api.registerHttpRoute(...)` بدلاً منه.
- يجب أن تعلن مسارات Plugin عن `auth` صراحةً.
- تُرفض تعارضات `path + match` الدقيقة ما لم تكن `replaceExisting: true`، ولا يمكن لـ Plugin واحد أن يستبدل مسار Plugin آخر.
- تُرفض المسارات المتداخلة ذات مستويات `auth` المختلفة. أبقِ سلاسل التمرير الاحتياطي `exact`/`prefix` على مستوى المصادقة نفسه فقط.
- لا تتلقى مسارات `auth: "plugin"` نطاقات تشغيل المشغّل تلقائياً. فهي مخصصة لـ webhooks التي يديرها Plugin/التحقق من التوقيعات، وليست لاستدعاءات مساعد Gateway ذات الامتيازات.
- تعمل مسارات `auth: "gateway"` داخل نطاق تشغيل طلب Gateway، لكن هذا النطاق محافظ عمداً:
  - مصادقة الحامل ذات السر المشترك (`gateway.auth.mode = "token"` / `"password"`) تُبقي نطاقات تشغيل مسارات Plugin مثبتة على `operator.write`، حتى إذا أرسل المستدعي `x-openclaw-scopes`
  - أوضاع HTTP الموثوقة الحاملة للهوية (مثل `trusted-proxy` أو `gateway.auth.mode = "none"` على مدخل خاص) تحترم `x-openclaw-scopes` فقط عندما يكون الرأس موجوداً صراحةً
  - إذا كان `x-openclaw-scopes` غائباً في طلبات مسارات Plugin الحاملة للهوية هذه، يعود نطاق التشغيل إلى `operator.write`
- قاعدة عملية: لا تفترض أن مسار Plugin بمصادقة Gateway هو سطح إدارة ضمني. إذا كان مسارك يحتاج إلى سلوك مخصص للمسؤولين فقط، فاشترط وضع مصادقة حامل للهوية ووثّق عقد الرأس الصريح `x-openclaw-scopes`.

## مسارات استيراد Plugin SDK

استخدم المسارات الفرعية الضيقة لـ SDK بدلاً من البرميل الجذري الأحادي `openclaw/plugin-sdk`
عند إنشاء plugins جديدة. المسارات الفرعية الأساسية:

| المسار الفرعي                       | الغرض                                             |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | بدائيات تسجيل Plugin                              |
| `openclaw/plugin-sdk/channel-core`  | مساعدات إدخال/بناء القناة                         |
| `openclaw/plugin-sdk/core`          | مساعدات مشتركة عامة وعقد جامع                     |
| `openclaw/plugin-sdk/config-schema` | مخطط Zod الجذري لـ `openclaw.json` (`OpenClawSchema`) |

تختار plugins القنوات من عائلة seams ضيقة — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`، و`channel-actions`. يجب توحيد سلوك الموافقة
على عقد `approvalCapability` واحد بدلاً من الخلط بين حقول Plugin غير ذات صلة.
راجع [plugins القنوات](/ar/plugins/sdk-channel-plugins).

توجد مساعدات التشغيل والإعدادات ضمن مسارات فرعية مركزة مطابقة من نمط `*-runtime`
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`، إلخ). فضّل `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot`، و`config-mutation`
بدلاً من برميل التوافق الواسع `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime` و`openclaw/plugin-sdk/config-runtime`
و`openclaw/plugin-sdk/infra-runtime` هي جسور توافق مهملة من أجل
plugins الأقدم. يجب أن يستورد الكود الجديد بدائيات عامة أضيق بدلاً من ذلك.
</Info>

نقاط الدخول الداخلية للمستودع (لكل جذر حزمة Plugin مضمّن):

- `index.js` — مدخل Plugin مضمّن
- `api.js` — برميل مساعدات/أنواع
- `runtime-api.js` — برميل خاص بالتشغيل فقط
- `setup-entry.js` — مدخل Plugin الإعداد

يجب أن تستورد plugins الخارجية المسارات الفرعية `openclaw/plugin-sdk/*` فقط. لا
تستورد أبداً `src/*` الخاصة بحزمة Plugin أخرى من النواة أو من Plugin آخر.
تفضّل نقاط الدخول المحمّلة عبر الواجهة لقطة إعدادات التشغيل النشطة عند وجودها،
ثم تعود إلى ملف الإعدادات المحلول على القرص.

توجد مسارات فرعية خاصة بالقدرات مثل `image-generation` و`media-understanding`
و`speech` لأن plugins المضمّنة تستخدمها اليوم. ليست هذه
بالضرورة عقوداً خارجية مجمدة طويلة الأمد تلقائياً — تحقق من صفحة مرجع SDK
ذات الصلة عند الاعتماد عليها.

## مخططات أداة الرسائل

يجب أن تمتلك plugins مساهمات مخطط `describeMessageTool(...)` الخاصة بالقناة
للبدائيات غير الرسائل مثل التفاعلات والقراءات والاستطلاعات.
يجب أن يستخدم عرض الإرسال المشترك عقد `MessagePresentation` العام
بدلاً من حقول الأزرار أو المكوّنات أو الكتل أو البطاقات الأصلية للمزوّد.
راجع [عرض الرسائل](/ar/plugins/message-presentation) للاطلاع على العقد،
وقواعد الرجوع الاحتياطي، وربط المزوّد، وقائمة تحقق مؤلف Plugin.

تعلن plugins القادرة على الإرسال ما تستطيع عرضه من خلال قدرات الرسائل:

- `presentation` لكتل العرض الدلالية (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` لطلبات التسليم المثبت

تقرر النواة ما إذا كانت ستعرض العرض أصلياً أو تخفضه إلى نص.
لا تعرض منافذ هروب لواجهة مستخدم أصلية للمزوّد من أداة الرسائل العامة.
تبقى مساعدات SDK المهملة للمخططات الأصلية القديمة مصدّرة من أجل
plugins الطرف الثالث الحالية، لكن يجب ألا تستخدمها plugins الجديدة.

## حل أهداف القنوات

يجب أن تمتلك plugins القنوات دلالات الأهداف الخاصة بالقناة. أبقِ مضيف
الإرسال المشترك عاماً واستخدم سطح محوّل المراسلة لقواعد المزوّد:

- يقرر `messaging.inferTargetChatType({ to })` ما إذا كان ينبغي التعامل مع هدف مطبّع
  باعتباره `direct` أو `group` أو `channel` قبل البحث في الدليل.
- يخبر `messaging.targetResolver.looksLikeId(raw, normalized)` النواة ما إذا كان
  الإدخال يجب أن يتجاوز مباشرةً إلى حل شبيه بالمعرّف بدلاً من البحث في الدليل.
- `messaging.targetResolver.resolveTarget(...)` هو الرجوع الاحتياطي الخاص بـ Plugin عندما
  تحتاج النواة إلى حل نهائي مملوك للمزوّد بعد التطبيع أو بعد فشل الدليل.
- يمتلك `messaging.resolveOutboundSessionRoute(...)` بناء مسار الجلسة الخاص بالمزوّد
  بمجرد حل الهدف.

التقسيم الموصى به:

- استخدم `inferTargetChatType` لقرارات الفئة التي يجب أن تحدث قبل
  البحث في النظراء/المجموعات.
- استخدم `looksLikeId` لفحوصات "تعامل مع هذا كمعرّف هدف صريح/أصلي".
- استخدم `resolveTarget` كرجوع احتياطي للتطبيع الخاص بالمزوّد، وليس
  للبحث الواسع في الدليل.
- أبقِ المعرّفات الأصلية للمزوّد مثل معرّفات الدردشة، ومعرّفات الخيوط، وJIDs، والمقابض، ومعرّفات الغرف
  داخل قيم `target` أو المعاملات الخاصة بالمزوّد، لا في حقول SDK العامة.

## أدلة مدعومة بالإعدادات

يجب أن تبقي plugins التي تستمد إدخالات الدليل من الإعدادات هذا المنطق في
Plugin وأن تعيد استخدام المساعدات المشتركة من
`openclaw/plugin-sdk/directory-runtime`.

استخدم هذا عندما تحتاج قناة إلى نظراء/مجموعات مدعومة بالإعدادات مثل:

- نظراء الرسائل المباشرة المحكومون بقائمة سماح
- خرائط القنوات/المجموعات المضبوطة
- بدائل دليل ثابتة ضمن نطاق الحساب

لا تتعامل المساعدات المشتركة في `directory-runtime` إلا مع العمليات العامة:

- ترشيح الاستعلامات
- تطبيق الحدود
- مساعدات إزالة التكرار/التطبيع
- بناء `ChannelDirectoryEntry[]`

يجب أن يبقى فحص الحساب الخاص بالقناة وتطبيع المعرّفات داخل
تنفيذ Plugin.

## كتالوجات المزوّدين

يمكن لـ plugins المزوّدين تعريف كتالوجات نماذج للاستدلال باستخدام
`registerProvider({ catalog: { run(...) { ... } } })`.

تعيد `catalog.run(...)` الشكل نفسه الذي يكتبه OpenClaw داخل
`models.providers`:

- `{ provider }` لإدخال مزوّد واحد
- `{ providers }` لعدة إدخالات مزوّدين

استخدم `catalog` عندما يمتلك Plugin معرّفات النماذج الخاصة بالمزوّد، أو القيم الافتراضية لعنوان URL الأساسي،
أو بيانات وصفية للنماذج محكومة بالمصادقة.

يتحكم `catalog.order` في وقت دمج كتالوج Plugin نسبةً إلى المزوّدين الضمنيين
المدمجين في OpenClaw:

- `simple`: مزوّدون مدفوعون بمفتاح API عادي أو بالبيئة
- `profile`: مزوّدون يظهرون عند وجود ملفات تعريف مصادقة
- `paired`: مزوّدون يركّبون عدة إدخالات مزوّدين مترابطة
- `late`: المرور الأخير، بعد المزوّدين الضمنيين الآخرين

تفوز المزوّدات اللاحقة عند تصادم المفاتيح، لذلك تستطيع plugins تجاوز إدخال مزوّد
مدمج عمداً باستخدام معرّف المزوّد نفسه.

يمكن لـ plugins أيضاً نشر صفوف نماذج للقراءة فقط عبر
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. هذا هو المسار المستقبلي لأسطح القائمة/المساعدة/المنتقي ويدعم
صفوف `text` و`image_generation` و`video_generation` و`music_generation`.
تبقى plugins المزوّدين مالكة لاستدعاءات نقطة النهاية الحية، وتبادل الرموز، وربط
استجابة البائع؛ وتمتلك النواة شكل الصف المشترك، وتسميات المصدر، وتنسيق مساعدة أدوات
الوسائط. تُنشئ تسجيلات مزوّدي توليد الوسائط صفوف كتالوج ثابتة
تلقائياً من `defaultModel` و`models` و`capabilities`.

التوافق:

- لا يزال `discovery` يعمل كاسم مستعار قديم، لكنه يصدر تحذير إهمال
- إذا سُجّل كل من `catalog` و`discovery`، يستخدم OpenClaw `catalog`
- `augmentModelCatalog` مهمل؛ يجب أن تنشر المزوّدات المضمّنة
  الصفوف التكميلية عبر `registerModelCatalogProvider`

## فحص القنوات للقراءة فقط

إذا كان Plugin الخاص بك يسجل قناة، ففضّل تنفيذ
`plugin.config.inspectAccount(cfg, accountId)` إلى جانب `resolveAccount(...)`.

السبب:

- `resolveAccount(...)` هو مسار التشغيل. يُسمح له بافتراض أن بيانات الاعتماد
  مكتملة التجسيد ويمكنه الفشل سريعاً عند غياب الأسرار المطلوبة.
- يجب ألا تحتاج مسارات الأوامر للقراءة فقط مثل `openclaw status` و`openclaw status --all`
  و`openclaw channels status` و`openclaw channels resolve` وتدفقات إصلاح doctor/config
  إلى تجسيد بيانات اعتماد التشغيل لمجرد وصف الإعدادات.

سلوك `inspectAccount(...)` الموصى به:

- أعد حالة حساب وصفية فقط.
- حافظ على `enabled` و`configured`.
- ضمّن حقول مصدر/حالة بيانات الاعتماد عند الاقتضاء، مثل:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- لا تحتاج إلى إعادة قيم الرموز الخام لمجرد الإبلاغ عن
  التوفر للقراءة فقط. إعادة `tokenStatus: "available"` (وحقل المصدر المطابق)
  كافية لأوامر نمط الحالة.
- استخدم `configured_unavailable` عندما تكون بيانات الاعتماد مضبوطة عبر SecretRef لكنها
  غير متاحة في مسار الأمر الحالي.

يتيح هذا لأوامر القراءة فقط الإبلاغ عن "مضبوط لكنه غير متاح في مسار الأمر هذا"
بدلاً من الانهيار أو الإبلاغ خطأً بأن الحساب غير مضبوط.

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

يصبح كل إدخال Plugin. إذا أدرجت الحزمة عدة extensions، يصبح معرّف Plugin
هو `name/<fileBase>`.

إذا كان Plugin الخاص بك يستورد تبعيات npm، فثبّتها في ذلك الدليل حتى
يتوفر `node_modules` (`npm install` / `pnpm install`).

حاجز أمان: يجب أن يبقى كل إدخال `openclaw.extensions` داخل دليل Plugin
بعد حل الروابط الرمزية. تُرفض الإدخالات التي تخرج من دليل الحزمة.

ملاحظة أمنية: يثبّت `openclaw plugins install` تبعيات Plugin باستخدام
`npm install --omit=dev --ignore-scripts` محلياً في المشروع (دون سكربتات دورة حياة،
ودون تبعيات تطوير في وقت التشغيل)، مع تجاهل إعدادات تثبيت npm العامة الموروثة.
أبقِ أشجار تبعيات Plugin "JS/TS نقية" وتجنب الحزم التي تتطلب
بناءات `postinstall`.

اختياري: يمكن أن يشير `openclaw.setupEntry` إلى وحدة خفيفة خاصة بالإعداد فقط.
عندما يحتاج OpenClaw إلى أسطح إعداد لـ Plugin قناة معطّل، أو
عندما يكون Plugin قناة مفعلاً لكنه لا يزال غير مضبوط، فإنه يحمّل `setupEntry`
بدلاً من مدخل Plugin الكامل. هذا يجعل بدء التشغيل والإعداد أخف
عندما يقوم مدخل Plugin الرئيسي أيضاً بتوصيل الأدوات أو الخطافات أو كود آخر خاص بالتشغيل فقط.

اختياري: يمكن لـ `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
أن يختار لـ Plugin قناة استخدام مسار `setupEntry` نفسه أثناء مرحلة بدء Gateway
قبل الاستماع، حتى عندما تكون القناة مضبوطة بالفعل.

استخدم هذا فقط عندما يغطي `setupEntry` بالكامل سطح بدء التشغيل الذي يجب أن يكون موجودًا
قبل أن يبدأ Gateway في الاستماع. عمليًا، يعني ذلك أن إدخال الإعداد
يجب أن يسجل كل قدرة مملوكة للقناة يعتمد عليها بدء التشغيل، مثل:

- تسجيل القناة نفسه
- أي مسارات HTTP يجب أن تكون متاحة قبل أن يبدأ Gateway في الاستماع
- أي طرق أو أدوات أو خدمات Gateway يجب أن تكون موجودة خلال النافذة نفسها

إذا كان الإدخال الكامل لديك لا يزال يملك أي قدرة مطلوبة لبدء التشغيل، فلا تفعّل
هذه العلامة. أبقِ Plugin على السلوك الافتراضي ودع OpenClaw يحمّل
الإدخال الكامل أثناء بدء التشغيل.

يمكن للقنوات المضمنة أيضًا نشر مساعدات سطح عقد مخصصة للإعداد فقط يستطيع النواة
استشارتها قبل تحميل وقت تشغيل القناة الكامل. سطح ترقية الإعداد الحالي هو:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

تستخدم النواة هذا السطح عندما تحتاج إلى ترقية إعدادات قناة قديمة ذات حساب واحد
إلى `channels.<id>.accounts.*` من دون تحميل إدخال Plugin الكامل.
Matrix هو المثال المضمن الحالي: ينقل فقط مفاتيح المصادقة/التمهيد إلى
حساب مُرقّى مسمى عندما تكون الحسابات المسماة موجودة بالفعل، ويمكنه الاحتفاظ
بمفتاح حساب افتراضي غير قياسي مكوّن بدلًا من إنشاء
`accounts.default` دائمًا.

تُبقي محولات تصحيح الإعداد هذه اكتشاف سطح العقد المضمن كسولًا. يبقى وقت
الاستيراد خفيفًا؛ ولا يُحمّل سطح الترقية إلا عند أول استخدام بدلًا من
إعادة الدخول في بدء تشغيل القناة المضمنة عند استيراد الوحدة.

عندما تتضمن أسطح بدء التشغيل هذه طرق RPC في Gateway، أبقِها ضمن بادئة
خاصة بالـ Plugin. تبقى مساحات أسماء إدارة النواة (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) محجوزة وتتحلل دائمًا
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

### بيانات وصف كتالوج القنوات

يمكن لـ Plugins القنوات الإعلان عن بيانات وصف الإعداد/الاكتشاف عبر `openclaw.channel` و
تلميحات التثبيت عبر `openclaw.install`. هذا يُبقي بيانات الكتالوج في النواة خالية.

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

حقول `openclaw.channel` المفيدة beyond المثال الأدنى:

- `detailLabel`: تسمية ثانوية لأسطح كتالوج/حالة أغنى
- `docsLabel`: تجاوز نص الرابط لرابط الوثائق
- `preferOver`: معرّفات Plugin/قناة ذات أولوية أدنى يجب أن يتفوق عليها إدخال الكتالوج هذا
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: عناصر تحكم في نص سطح الاختيار
- `markdownCapable`: يعلّم القناة بأنها قادرة على Markdown لقرارات تنسيق الرسائل الصادرة
- `exposure.configured`: إخفاء القناة من أسطح سرد القنوات المكوّنة عند ضبطه على `false`
- `exposure.setup`: إخفاء القناة من أدوات اختيار الإعداد/التكوين التفاعلية عند ضبطه على `false`
- `exposure.docs`: تعليم القناة بأنها داخلية/خاصة لأسطح تنقل الوثائق
- `showConfigured` / `showInSetup`: أسماء بديلة قديمة لا تزال مقبولة للتوافق؛ فضّل `exposure`
- `quickstartAllowFrom`: إدخال القناة في مسار البدء السريع القياسي `allowFrom`
- `forceAccountBinding`: طلب ربط حساب صريح حتى عندما يوجد حساب واحد فقط
- `preferSessionLookupForAnnounceTarget`: تفضيل البحث في الجلسة عند حل أهداف الإعلان

يمكن لـ OpenClaw أيضًا دمج **كتالوجات قنوات خارجية** (على سبيل المثال، تصدير سجل MPM).
ضع ملف JSON في أحد المواضع التالية:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

أو وجّه `OPENCLAW_PLUGIN_CATALOG_PATHS` (أو `OPENCLAW_MPM_CATALOG_PATHS`) إلى
ملف JSON واحد أو أكثر (مفصولة بفاصلة/فاصلة منقوطة/`PATH`). يجب أن يحتوي كل ملف
على `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. يقبل المحلل أيضًا `"packages"` أو `"plugins"` كأسماء بديلة قديمة لمفتاح `"entries"`.

تعرض إدخالات كتالوج القنوات المُنشأة وإدخالات كتالوج تثبيت المزوّدين
حقائق مصدر التثبيت المطبّعة بجانب كتلة `openclaw.install` الخام. تحدد
الحقائق المطبّعة ما إذا كانت مواصفة npm إصدارًا دقيقًا أم محددًا عائمًا،
وما إذا كانت بيانات وصف السلامة المتوقعة موجودة، وما إذا كان مسار مصدر محلي
متاحًا أيضًا. عندما تكون هوية الكتالوج/الحزمة معروفة، تحذر الحقائق المطبّعة
إذا انحرف اسم حزمة npm المحلل عن تلك الهوية. كما تحذر عندما يكون `defaultChoice`
غير صالح أو يشير إلى مصدر غير متاح، وعندما تكون بيانات وصف سلامة npm موجودة
من دون مصدر npm صالح. يجب أن يتعامل المستهلكون مع `installSource` كحقل اختياري
إضافي حتى لا تضطر الإدخالات المنشأة يدويًا وموائمات الكتالوج إلى تصنيعه.
يتيح هذا للإعداد والتشخيص شرح حالة مستوى المصدر من دون استيراد وقت تشغيل Plugin.

ينبغي لإدخالات npm الخارجية الرسمية تفضيل `npmSpec` دقيق مع
`expectedIntegrity`. لا تزال أسماء الحزم المجردة ووسوم التوزيع تعمل من أجل
التوافق، لكنها تعرض تحذيرات مستوى المصدر حتى يتمكن الكتالوج من التحرك
نحو تثبيتات مثبتة ومتحققة السلامة من دون كسر Plugins الموجودة.
عندما يثبّت الإعداد من مسار كتالوج محلي، يسجل إدخال فهرس Plugin مدار
مع `source: "path"` و`sourcePath` نسبيًا إلى مساحة العمل عندما يكون ذلك ممكنًا.
يبقى مسار التحميل التشغيلي المطلق في `plugins.load.paths`؛ ويتجنب سجل التثبيت
تكرار مسارات محطة العمل المحلية في الإعدادات طويلة الأمد. هذا يُبقي تثبيتات
التطوير المحلي مرئية لتشخيصات مستوى المصدر من دون إضافة سطح ثانٍ لكشف
مسارات نظام الملفات الخام. فهرس Plugin المستمر `plugins/installs.json` هو
مصدر الحقيقة للتثبيت ويمكن تحديثه من دون تحميل وحدات وقت تشغيل Plugin.
تبقى خريطة `installRecords` الخاصة به دائمة حتى عندما يكون بيان Plugin مفقودًا
أو غير صالح؛ ومصفوفة `plugins` الخاصة به هي عرض بيان قابل لإعادة البناء.

## Plugins محرك السياق

تملك Plugins محرك السياق تنسيق سياق الجلسة للإدخال والتجميع
وCompaction. سجّلها من Plugin الخاص بك باستخدام
`api.registerContextEngine(id, factory)`، ثم اختر المحرك النشط باستخدام
`plugins.slots.contextEngine`.

استخدم هذا عندما يحتاج Plugin الخاص بك إلى استبدال مسار السياق الافتراضي
أو توسيعه بدلًا من مجرد إضافة بحث ذاكرة أو خطافات.

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

يعرض المصنع `ctx` قيم `config` و`agentDir` و`workspaceDir` اختيارية
للتهيئة وقت الإنشاء.

إذا كان محركك **لا** يملك خوارزمية Compaction، فأبقِ `compact()`
منفذًا وفوّضه صراحة:

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

عندما يحتاج Plugin إلى سلوك لا يلائم API الحالي، لا تتجاوز
نظام Plugin عبر وصول خاص إلى الداخل. أضف القدرة الناقصة.

التسلسل الموصى به:

1. عرّف عقد النواة
   قرر ما السلوك المشترك الذي يجب أن تملكه النواة: السياسة، والاحتياط، ودمج الإعدادات،
   ودورة الحياة، والدلالات المواجهة للقنوات، وشكل مساعد وقت التشغيل.
2. أضف أسطح تسجيل/وقت تشغيل PluginTyped
   وسّع `OpenClawPluginApi` و/أو `api.runtime` بأصغر
   سطح قدرة typed مفيد.
3. صِل مستهلكي النواة + القناة/الميزة
   يجب أن تستهلك القنوات وPlugins الميزات القدرة الجديدة عبر النواة،
   لا عبر استيراد تنفيذ مورّد مباشرة.
4. سجّل تنفيذات المورّدين
   تسجل Plugins المورّدين بعد ذلك واجهاتها الخلفية مقابل القدرة.
5. أضف تغطية العقد
   أضف اختبارات حتى يبقى شكل الملكية والتسجيل صريحًا بمرور الوقت.

هكذا يبقى OpenClaw ذا رأي واضح من دون أن يصبح مرمزًا لصالح
رؤية مزوّد واحد للعالم. راجع [كتاب وصفات القدرات](/ar/plugins/adding-capabilities)
للحصول على قائمة تحقق ملفات ملموسة ومثال عملي.

### قائمة تحقق القدرة

عندما تضيف قدرة جديدة، ينبغي للتنفيذ عادةً أن يلمس هذه الأسطح
معًا:

- أنواع عقد النواة في `src/<capability>/types.ts`
- مساعد مشغّل/وقت تشغيل النواة في `src/<capability>/runtime.ts`
- سطح تسجيل Plugin API في `src/plugins/types.ts`
- توصيل سجل Plugin في `src/plugins/registry.ts`
- تعريض وقت تشغيل Plugin في `src/plugins/runtime/*` عندما تحتاج Plugins الميزات/القنوات
  إلى استهلاكه
- مساعدات الالتقاط/الاختبار في `src/test-utils/plugin-registration.ts`
- تأكيدات الملكية/العقد في `src/plugins/contracts/registry.ts`
- وثائق المشغل/Plugin في `docs/`

إذا كان أحد هذه الأسطح مفقودًا، فذلك عادةً علامة على أن القدرة
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

نمط اختبار العقد:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

هذا يُبقي القاعدة بسيطة:

- تملك النواة عقد القدرة + التنسيق
- تملك Plugins المورّدين تنفيذات المورّدين
- تستهلك Plugins الميزات/القنوات مساعدات وقت التشغيل
- تُبقي اختبارات العقد الملكية صريحة

## ذات صلة

- [بنية Plugin](/ar/plugins/architecture) — نموذج القدرة العام وأشكاله
- [مسارات فرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
