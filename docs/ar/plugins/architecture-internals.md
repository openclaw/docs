---
read_when:
    - تنفيذ خطافات وقت تشغيل المزوّد، أو دورة حياة القناة، أو حزم الحِزم
    - تصحيح أخطاء ترتيب تحميل Plugin أو حالة السجل
    - إضافة قدرة Plugin جديدة أو Plugin لمحرك السياق
summary: 'داخليات بنية Plugin: خط تحميل البيانات، والسجل، وخطافات وقت التشغيل، ومسارات HTTP، وجداول المرجع'
title: الأجزاء الداخلية لبنية Plugin
x-i18n:
    generated_at: "2026-06-27T18:00:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29abbd75d696a26cf33702a78abfcc987aaf5358eca2dc1ebe43f039f4ff6edf
    source_path: plugins/architecture-internals.md
    workflow: 16
---

للاطلاع على نموذج القدرات العام، وأشكال Plugin، وعقود الملكية/التنفيذ،
راجع [بنية Plugin](/ar/plugins/architecture). هذه الصفحة هي المرجع
لآليات العمل الداخلية: مسار التحميل، والسجل، وخطافات وقت التشغيل،
ومسارات Gateway HTTP، ومسارات الاستيراد، وجداول المخططات.

## مسار التحميل

عند بدء التشغيل، ينفذ OpenClaw تقريبًا ما يلي:

1. يكتشف جذور Plugin المرشحة
2. يقرأ بيانات الحزم الأصلية أو المتوافقة وبيانات تعريف الحزمة
3. يرفض المرشحين غير الآمنين
4. يطبّع إعدادات Plugin (`plugins.enabled`، و`allow`، و`deny`، و`entries`،
   و`slots`، و`load.paths`)
5. يقرر التمكين لكل مرشح
6. يحمّل الوحدات الأصلية الممكّنة: تستخدم الوحدات المضمّنة المبنية محمّلًا أصليًا؛
   ويستخدم مصدر TypeScript المحلي التابع لجهة خارجية بديل Jiti الطارئ
7. يستدعي خطافات `register(api)` الأصلية ويجمع التسجيلات في سجل Plugin
8. يعرّض السجل للأوامر/أسطح وقت التشغيل

<Note>
`activate` هو اسم مستعار قديم لـ `register` — يحلّ المحمّل أيهما موجود (`def.register ?? def.activate`) ويستدعيه في النقطة نفسها. تستخدم كل plugins المضمّنة `register`؛ فضّل `register` في plugins الجديدة.
</Note>

تحدث بوابات الأمان **قبل** تنفيذ وقت التشغيل. يُحظر المرشحون
عندما يفلت الإدخال من جذر Plugin، أو يكون المسار قابلًا للكتابة من الجميع، أو تبدو
ملكية المسار مريبة بالنسبة إلى plugins غير المضمّنة.

يبقى المرشحون المحظورون مرتبطين بمعرّف Plugin الخاص بهم لأغراض التشخيص. إذا كانت الإعدادات
لا تزال تشير إلى ذلك المعرّف، فسيبلغ التحقق أن Plugin موجود لكنه محظور
ويشير مجددًا إلى تحذير أمان المسار بدلًا من التعامل مع إدخال الإعدادات
على أنه قديم.

### السلوك القائم أولًا على البيان

البيان هو مصدر الحقيقة لمستوى التحكم. يستخدمه OpenClaw من أجل:

- تحديد Plugin
- اكتشاف القنوات/Skills/مخطط الإعدادات المعلنة أو قدرات الحزمة
- التحقق من `plugins.entries.<id>.config`
- تعزيز تسميات/عناصر نائبة في Control UI
- عرض بيانات تعريف التثبيت/الفهرس
- الحفاظ على واصفات التنشيط والإعداد الرخيصة دون تحميل وقت تشغيل Plugin

بالنسبة إلى plugins الأصلية، تكون وحدة وقت التشغيل هي جزء مستوى البيانات. تسجل
السلوك الفعلي مثل الخطافات، أو الأدوات، أو الأوامر، أو تدفقات المزوّد.

تبقى كتل البيان الاختيارية `activation` و`setup` على مستوى التحكم.
إنها واصفات بيانات تعريف فقط لتخطيط التنشيط واكتشاف الإعداد؛
ولا تستبدل تسجيل وقت التشغيل، أو `register(...)`، أو `setupEntry`.
يستخدم مستهلكو التنشيط الحي الأول الآن تلميحات أوامر البيان، والقنوات، والمزوّدين
لتضييق تحميل Plugin قبل التجسيد الأوسع للسجل:

- يضيّق تحميل CLI إلى plugins التي تملك الأمر الأساسي المطلوب
- يضيّق إعداد القناة/حل Plugin إلى plugins التي تملك
  معرّف القناة المطلوب
- يضيّق إعداد المزوّد الصريح/حل وقت التشغيل إلى plugins التي تملك
  معرّف المزوّد المطلوب
- يستخدم تخطيط بدء Gateway `activation.onStartup` للاستيرادات الصريحة عند بدء التشغيل
  وعمليات إلغاء بدء التشغيل؛ أما plugins التي لا تحتوي على بيانات تعريف بدء التشغيل فلا تُحمّل إلا
  عبر مشغلات تنشيط أضيق

لا تزال عمليات التحميل المسبق لوقت التشغيل وقت الطلب التي تطلب النطاق الواسع `all` تستمد
مجموعة معرّفات Plugin فعالة وصريحة من الإعدادات، وتخطيط بدء التشغيل، والقنوات
المكوّنة، والفتحات، وقواعد التمكين التلقائي. إذا كانت تلك المجموعة المستمدة فارغة، فإن OpenClaw
يحمّل سجل وقت تشغيل فارغًا بدلًا من التوسع إلى كل
Plugin قابل للاكتشاف.

يعرّض مخطِّط التنشيط كلًا من API للمعرّفات فقط للمتصلين الحاليين وAPI
للخطة للتشخيصات الجديدة. تبلّغ إدخالات الخطة عن سبب اختيار Plugin،
مع فصل تلميحات المخطِّط الصريحة `activation.*` عن بديل ملكية البيان
مثل `providers`، و`channels`، و`commandAliases`، و`setup.providers`،
و`contracts.tools`، والخطافات. هذا الفصل في السبب هو حد التوافق:
تستمر بيانات تعريف Plugin الحالية في العمل، بينما يمكن للكود الجديد اكتشاف التلميحات الواسعة
أو سلوك البديل دون تغيير دلالات تحميل وقت التشغيل.

يفضّل اكتشاف الإعداد الآن المعرّفات المملوكة للواصف مثل `setup.providers` و
`setup.cliBackends` لتضييق plugins المرشحة قبل أن يعود إلى
`setup-api` بالنسبة إلى plugins التي لا تزال تحتاج إلى خطافات وقت التشغيل وقت الإعداد. تستخدم
قوائم إعداد المزوّد `providerAuthChoices` في البيان، وخيارات الإعداد المستمدة من الواصف،
وبيانات تعريف فهرس التثبيت دون تحميل وقت تشغيل المزوّد. يمثّل
`setup.requiresRuntime: false` الصريح حدًا قاطعًا خاصًا بالواصف فقط؛ أما حذف
`requiresRuntime` فيبقي بديل setup-api القديم للتوافق. إذا ادعى أكثر
من Plugin مكتشف واحد معرّف مزوّد إعداد أو خلفية CLI نفسه بعد التطبيع،
يرفض بحث الإعداد المالك الغامض بدلًا من الاعتماد على
ترتيب الاكتشاف. عندما ينفذ وقت تشغيل الإعداد، تبلّغ تشخيصات السجل
عن الانحراف بين `setup.providers` / `setup.cliBackends` والمزوّدين أو خلفيات CLI
المسجلة بواسطة setup-api دون حظر plugins القديمة.

### حدود ذاكرة Plugin المؤقتة

لا يخزّن OpenClaw نتائج اكتشاف Plugin أو بيانات سجل البيان المباشرة
خلف نوافذ زمنية تعتمد على ساعة الحائط. يجب أن تصبح عمليات التثبيت، وتعديلات البيان، وتغييرات مسار التحميل
مرئية في القراءة الصريحة التالية لبيانات التعريف أو إعادة بناء اللقطة.
قد يحتفظ محلل ملف البيان بذاكرة مؤقتة محدودة لتوقيع الملف، مفهرسة حسب
مسار البيان المفتوح، وinode، والحجم، والطوابع الزمنية؛ ولا تتجنب تلك الذاكرة المؤقتة إلا
إعادة تحليل البايتات غير المتغيرة، ويجب ألا تخزّن إجابات الاكتشاف، أو السجل، أو المالك، أو
السياسة.

المسار السريع الآمن لبيانات التعريف هو ملكية الكائنات الصريحة، لا ذاكرة مؤقتة مخفية.
ينبغي لمسارات Gateway الساخنة عند بدء التشغيل تمرير `PluginMetadataSnapshot` الحالي، أو
`PluginLookUpTable` المستمد، أو سجل بيان صريح عبر سلسلة الاستدعاءات.
يمكن للتحقق من الإعدادات، والتمكين التلقائي عند بدء التشغيل، وتمهيد Plugin، واختيار المزوّد
إعادة استخدام تلك الكائنات ما دامت تمثل الإعدادات الحالية ومخزون
Plugin. لا يزال بحث الإعداد يعيد بناء بيانات تعريف البيان عند الطلب
ما لم يتلق مسار الإعداد المحدد سجل بيان صريحًا؛ أبقِ ذلك
كبديل للمسار البارد بدلًا من إضافة ذاكرات مؤقتة مخفية للبحث. عندما يتغير الإدخال،
أعد بناء اللقطة واستبدلها بدلًا من تعديلها أو الاحتفاظ
بنسخ تاريخية.
ينبغي إعادة حساب العروض فوق سجل Plugin النشط ومساعدات تمهيد القنوات المضمّنة
من السجل/الجذر الحاليين. الخرائط قصيرة العمر مقبولة
داخل استدعاء واحد لإزالة تكرار العمل أو حماية إعادة الدخول؛ ويجب ألا تتحول إلى ذاكرات
مؤقتة لبيانات تعريف العملية.

بالنسبة إلى تحميل Plugin، طبقة التخزين المؤقت الدائمة هي تحميل وقت التشغيل. قد تعيد استخدام
حالة المحمّل عندما يُحمّل الكود أو القطع المثبتة فعليًا، مثل:

- `PluginLoaderCacheState` وسجلات وقت التشغيل النشطة المتوافقة
- ذاكرات jiti/الوحدات المؤقتة وذاكرات محمّل الأسطح العامة المؤقتة المستخدمة لتجنب استيراد
  سطح وقت التشغيل نفسه بشكل متكرر
- ذاكرات نظام الملفات المؤقتة لقطع Plugin المثبتة
- خرائط قصيرة العمر لكل استدعاء لتطبيع المسارات أو حل التكرارات

هذه الذاكرات المؤقتة هي تفاصيل تنفيذية لمستوى البيانات. يجب ألا تجيب عن
أسئلة مستوى التحكم مثل "أي Plugin يملك هذا المزوّد؟" إلا إذا كان
المتصل قد طلب تحميل وقت التشغيل عمدًا.

لا تضف ذاكرات مؤقتة دائمة أو معتمدة على ساعة الحائط من أجل:

- نتائج الاكتشاف
- سجلات البيان المباشرة
- سجلات البيان المعاد بناؤها من فهرس Plugin المثبت
- بحث مالك المزوّد، أو كبت النموذج، أو سياسة المزوّد، أو بيانات تعريف القطع العامة
- أي إجابة أخرى مستمدة من البيان حيث يجب أن يكون البيان المتغير، أو الفهرس المثبت،
  أو مسار التحميل مرئيًا في القراءة التالية لبيانات التعريف

يعيد المتصلون الذين يعيدون بناء بيانات تعريف البيان من فهرس Plugin المثبت
المحفوظ بناء ذلك السجل عند الطلب. الفهرس المثبت هو حالة متينة
لمستوى المصدر؛ وليس ذاكرة مؤقتة مخفية لبيانات التعريف داخل العملية.

## نموذج السجل

لا تعدّل plugins المحمّلة العموميات الأساسية العشوائية مباشرة. إنها تسجل في
سجل Plugin مركزي.

يتتبع السجل:

- سجلات Plugin (الهوية، المصدر، الأصل، الحالة، التشخيصات)
- الأدوات
- الخطافات القديمة والخطافات المعرّفة بأنواع
- القنوات
- المزوّدين
- معالجات Gateway RPC
- مسارات HTTP
- مسجلات CLI
- خدمات الخلفية
- الأوامر المملوكة لـ Plugin

ثم تقرأ الميزات الأساسية من ذلك السجل بدلًا من التحدث إلى وحدات Plugin
مباشرة. هذا يبقي التحميل باتجاه واحد:

- وحدة Plugin -> تسجيل السجل
- وقت التشغيل الأساسي -> استهلاك السجل

هذا الفصل مهم لقابلية الصيانة. فهو يعني أن معظم الأسطح الأساسية لا تحتاج إلا
إلى نقطة تكامل واحدة: "اقرأ السجل"، وليس "عامل كل وحدة Plugin كحالة خاصة".

## ردود نداء ربط المحادثة

يمكن لـ plugins التي تربط محادثة أن تتفاعل عندما يُحسم اعتماد.

استخدم `api.onConversationBindingResolved(...)` لتلقي رد نداء بعد الموافقة على طلب ربط
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

حقول حمولة رد النداء:

- `status`: `"approved"` أو `"denied"`
- `decision`: `"allow-once"`، أو `"allow-always"`، أو `"deny"`
- `binding`: الربط المحسوم للطلبات الموافق عليها
- `request`: ملخص الطلب الأصلي، وتلميح الفصل، ومعرّف المرسل، وبيانات تعريف
  المحادثة

رد النداء هذا للإشعار فقط. لا يغيّر من يُسمح له بربط
محادثة، ويعمل بعد انتهاء معالجة الاعتماد الأساسية.

## خطافات وقت تشغيل المزوّد

تتكون plugins المزوّد من ثلاث طبقات:

- **بيانات تعريف البيان** للبحث الرخيص قبل وقت التشغيل:
  `setup.providers[].envVars`، وتوافق قديم مهمل `providerAuthEnvVars`،
  و`providerAuthAliases`، و`providerAuthChoices`، و`channelEnvVars`.
- **خطافات وقت الإعدادات**: `catalog` (القديم `discovery`) بالإضافة إلى
  `applyConfigDefaults`.
- **خطافات وقت التشغيل**: أكثر من 40 خطافًا اختياريًا تغطي المصادقة، وحل النموذج،
  وتغليف البث، ومستويات التفكير، وسياسة إعادة التشغيل، ونقاط نهاية الاستخدام. راجع
  القائمة الكاملة ضمن [ترتيب الخطافات والاستخدام](#hook-order-and-usage).

لا يزال OpenClaw يملك حلقة الوكيل العامة، وتجاوز الفشل، ومعالجة النصوص، و
سياسة الأدوات. هذه الخطافات هي سطح التوسعة للسلوك الخاص بالمزوّد
دون الحاجة إلى نقل استدلال مخصص كامل.

استخدم `setup.providers[].envVars` في البيان عندما يكون لدى المزوّد
اعتمادات قائمة على env ينبغي أن تراها مسارات المصادقة/الحالة/منتقي النماذج العامة دون
تحميل وقت تشغيل Plugin. لا يزال `providerAuthEnvVars` المهمل يُقرأ بواسطة
محول التوافق أثناء نافذة الإهمال، وتتلقى plugins غير المضمّنة
التي تستخدمه تشخيص بيان. استخدم `providerAuthAliases` في البيان
عندما ينبغي لمعرّف مزوّد واحد إعادة استخدام متغيرات env، وملفات تعريف المصادقة،
والمصادقة المدعومة بالإعدادات، وخيار تهيئة مفتاح API الخاصة بمعرّف مزوّد آخر. استخدم
`providerAuthChoices` في البيان عندما ينبغي لأسطح CLI الخاصة بالتهيئة/اختيار المصادقة معرفة
معرّف اختيار المزوّد، وتسميات المجموعات، وتوصيل المصادقة البسيط بعلم واحد دون
تحميل وقت تشغيل المزوّد. أبقِ `envVars` في وقت تشغيل المزوّد
للتلميحات الموجهة إلى المشغّل مثل تسميات التهيئة أو متغيرات إعداد
معرّف عميل OAuth/سر العميل.

استخدم `channelEnvVars` في البيان عندما تكون لدى القناة مصادقة أو إعداد مدفوعان بـ env ينبغي
أن يراه بديل shell-env العام، أو فحوصات الإعدادات/الحالة، أو مطالبات الإعداد
دون تحميل وقت تشغيل القناة.

### ترتيب الخطافات والاستخدام

بالنسبة إلى plugins النماذج/المزوّدين، يستدعي OpenClaw الخطافات بهذا الترتيب التقريبي.
عمود "متى تستخدم" هو دليل القرار السريع.
حقول المزوّد المخصصة للتوافق فقط التي لم يعد OpenClaw يستدعيها، مثل
`ProviderPlugin.capabilities` و`suppressBuiltInModel`، غير مدرجة هنا عمدًا.

| #   | نقطة الربط                              | ما الذي تفعله                                                                                                   | متى تُستخدم                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | نشر إعدادات المزوّد في `models.providers` أثناء توليد `models.json`                                | عندما يمتلك المزوّد كتالوجًا أو قيمًا افتراضية لعنوان URL الأساسي                                                                                                  |
| 2   | `applyConfigDefaults`             | تطبيق الإعدادات الافتراضية العامة التي يملكها المزوّد أثناء تجسيد الإعدادات                                      | عندما تعتمد القيم الافتراضية على وضع المصادقة أو البيئة أو دلالات عائلة نماذج المزوّد                                                                         |
| --  | _(البحث المضمّن عن النماذج)_         | يحاول OpenClaw استخدام مسار السجل/الكتالوج العادي أولًا                                                          | _(ليست نقطة ربط Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | تطبيع الأسماء المستعارة القديمة أو التجريبية لمعرّف النموذج قبل البحث                                                     | عندما يملك المزوّد تنظيف الأسماء المستعارة قبل حلّ النموذج القانوني                                                                                 |
| 4   | `normalizeTransport`              | تطبيع `api` / `baseUrl` لعائلة المزوّد قبل تجميع النموذج العام                                      | عندما يملك المزوّد تنظيف النقل لمعرّفات المزوّد المخصصة ضمن عائلة النقل نفسها                                                          |
| 5   | `normalizeConfig`                 | تطبيع `models.providers.<id>` قبل حلّ وقت التشغيل/المزوّد                                           | عندما يحتاج المزوّد إلى تنظيف إعدادات يجب أن يبقى مع Plugin؛ كما تعمل مساعدات عائلة Google المضمّنة كدعم احتياطي لمدخلات إعدادات Google المدعومة   |
| 6   | `applyNativeStreamingUsageCompat` | تطبيق عمليات إعادة كتابة توافق استخدام البث الأصلي على مزوّدي الإعدادات                                               | عندما يحتاج المزوّد إلى إصلاحات بيانات تعريف استخدام البث الأصلي المدفوعة بنقطة النهاية                                                                          |
| 7   | `resolveConfigApiKey`             | حلّ مصادقة علامة البيئة لمزوّدي الإعدادات قبل تحميل مصادقة وقت التشغيل                                       | عندما يوفّر المزوّدون نقاط ربطهم الخاصة لحلّ مفتاح API عبر علامة البيئة                                                                                |
| 8   | `resolveSyntheticAuth`            | إظهار المصادقة المحلية/ذاتية الاستضافة أو المدعومة بالإعدادات من دون حفظ نص عادي                                   | عندما يستطيع المزوّد العمل باستخدام علامة اعتماد اصطناعية/محلية                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | تركيب ملفات تعريف المصادقة الخارجية التي يملكها المزوّد؛ القيمة الافتراضية لـ `persistence` هي `runtime-only` لاعتمادات CLI/التطبيق | عندما يعيد المزوّد استخدام اعتمادات مصادقة خارجية من دون حفظ رموز التحديث المنسوخة؛ صرّح بـ `contracts.externalAuthProviders` في البيان |
| 10  | `shouldDeferSyntheticProfileAuth` | خفض أولوية عناصر نائبة محفوظة لملف تعريف اصطناعي خلف مصادقة مدعومة بالبيئة/الإعدادات                                      | عندما يخزّن المزوّد ملفات تعريف عناصر نائبة اصطناعية لا ينبغي أن تكون لها الأسبقية                                                                 |
| 11  | `resolveDynamicModel`             | بديل متزامن لمعرّفات النماذج التي يملكها المزوّد وغير الموجودة بعد في السجل المحلي                                       | عندما يقبل المزوّد معرّفات نماذج عشوائية من المصدر الأعلى                                                                                                 |
| 12  | `prepareDynamicModel`             | تهيئة غير متزامنة، ثم يعمل `resolveDynamicModel` مرة أخرى                                                           | عندما يحتاج المزوّد إلى بيانات تعريف شبكية قبل حلّ المعرّفات غير المعروفة                                                                                  |
| 13  | `normalizeResolvedModel`          | إعادة الكتابة النهائية قبل أن يستخدم المشغّل المضمّن النموذج المحلول                                               | عندما يحتاج المزوّد إلى إعادة كتابة النقل لكنه لا يزال يستخدم نقلًا أساسيًا من النواة                                                                             |
| 14  | `normalizeToolSchemas`            | تطبيع مخططات الأدوات قبل أن يراها المشغّل المضمّن                                                    | عندما يحتاج المزوّد إلى تنظيف مخططات عائلة النقل                                                                                                |
| 15  | `inspectToolSchemas`              | إظهار تشخيصات المخطط التي يملكها المزوّد بعد التطبيع                                                  | عندما يريد المزوّد تحذيرات كلمات مفتاحية من دون تعليم النواة قواعد خاصة بالمزوّد                                                                 |
| 16  | `resolveReasoningOutputMode`      | اختيار عقد مخرجات الاستدلال الأصلية أو الموسومة                                                              | عندما يحتاج المزوّد إلى استدلال/مخرجات نهائية موسومة بدلًا من الحقول الأصلية                                                                         |
| 17  | `prepareExtraParams`              | تطبيع معاملات الطلب قبل مغلّفات خيارات البث العامة                                              | عندما يحتاج المزوّد إلى معاملات طلب افتراضية أو تنظيف معاملات لكل مزوّد                                                                           |
| 18  | `createStreamFn`                  | استبدال مسار البث العادي بالكامل بنقل مخصص                                                   | عندما يحتاج المزوّد إلى بروتوكول سلكي مخصص، لا إلى مغلّف فقط                                                                                     |
| 20  | `wrapStreamFn`                    | مغلّف بث بعد تطبيق المغلّفات العامة                                                              | عندما يحتاج المزوّد إلى مغلّفات توافق لترويسات/جسم/نموذج الطلب من دون نقل مخصص                                                          |
| 21  | `resolveTransportTurnState`       | إرفاق ترويسات أو بيانات تعريف نقل أصلية لكل دور                                                           | عندما يريد المزوّد من عمليات النقل العامة إرسال هوية الدور الأصلية للمزوّد                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | إرفاق ترويسات WebSocket أصلية أو سياسة تهدئة الجلسة                                                    | عندما يريد المزوّد من عمليات نقل WS العامة ضبط ترويسات الجلسة أو سياسة الرجوع                                                               |
| 23  | `formatApiKey`                    | منسّق ملف تعريف المصادقة: يصبح الملف المحفوظ سلسلة `apiKey` في وقت التشغيل                                     | عندما يخزّن المزوّد بيانات تعريف مصادقة إضافية ويحتاج إلى شكل رمز وقت تشغيل مخصص                                                                    |
| 24  | `refreshOAuth`                    | تجاوز تحديث OAuth لنقاط نهاية تحديث مخصصة أو سياسة فشل التحديث                                  | عندما لا يناسب المزوّد مجدّدات التحديث المشتركة في OpenClaw                                                                                          |
| 25  | `buildAuthDoctorHint`             | تلميح إصلاح يُضاف عندما يفشل تحديث OAuth                                                                  | عندما يحتاج المزوّد إلى إرشادات إصلاح مصادقة يملكها المزوّد بعد فشل التحديث                                                                      |
| 26  | `matchesContextOverflowError`     | مطابق تجاوز نافذة السياق الذي يملكه المزوّد                                                                 | عندما تكون لدى المزوّد أخطاء تجاوز خام قد تفوتها الاستدلالات العامة                                                                                |
| 27  | `classifyFailoverReason`          | تصنيف سبب التحويل الاحتياطي الذي يملكه المزوّد                                                                  | عندما يستطيع المزوّد ربط أخطاء API/النقل الخام بحدود المعدل/الحمل الزائد/إلخ                                                                          |
| 28  | `isCacheTtlEligible`              | سياسة ذاكرة التخزين المؤقت للموجهات لمزوّدي الوكيل/النقل الخلفي                                                               | عندما يحتاج المزوّد إلى بوابة TTL لذاكرة تخزين مؤقت خاصة بالوكيل                                                                                                |
| 29  | `buildMissingAuthMessage`         | بديل لرسالة استرداد المصادقة المفقودة العامة                                                      | عندما يحتاج المزوّد إلى تلميح استرداد مصادقة مفقودة خاص بالمزوّد                                                                                 |
| 30  | `augmentModelCatalog`             | صفوف كتالوج اصطناعية/نهائية تُضاف بعد الاكتشاف                                                          | عندما يحتاج المزوّد إلى صفوف توافق مستقبلي اصطناعية في `models list` والمنتقيات                                                                     |
| 31  | `resolveThinkingProfile`          | مجموعة مستويات `/think` الخاصة بالنموذج، وتسميات العرض، والقيمة الافتراضية                                                 | عندما يوفّر المزوّد سلّم تفكير مخصصًا أو تسمية ثنائية لنماذج محددة                                                                 |
| 32  | `isBinaryThinking`                | نقطة ربط توافق لتبديل الاستدلال تشغيل/إيقاف                                                                     | عندما يوفّر المزوّد التفكير الثنائي تشغيل/إيقاف فقط                                                                                                  |
| 33  | `supportsXHighThinking`           | نقطة ربط توافق دعم الاستدلال `xhigh`                                                                   | عندما يريد المزوّد `xhigh` على مجموعة فرعية من النماذج فقط                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | نقطة ربط توافق مستوى `/think` الافتراضي                                                                      | عندما يملك المزوّد سياسة `/think` الافتراضية لعائلة نماذج                                                                                      |
| 35  | `isModernModelRef`                | مطابق النموذج الحديث لمرشحات ملفات التعريف الحية واختيار فحص الدخان                                              | عندما يملك المزوّد مطابقة النموذج المفضل للفحص الحي/فحص الدخان                                                                                             |
| 36  | `prepareRuntimeAuth`              | تبادل اعتماد مهيأ إلى رمز/مفتاح وقت التشغيل الفعلي قبل الاستدلال مباشرة                       | عندما يحتاج المزوّد إلى تبادل رمز أو اعتماد طلب قصير العمر                                                                             |
| 37  | `resolveUsageAuth`                | حلّ اعتمادات الاستخدام/الفوترة لـ `/usage` والأسطح ذات الصلة                                     | عندما يحتاج المزوّد إلى تحليل رمز استخدام/حصة مخصص أو اعتماد استخدام مختلف                                                               |
| 38  | `fetchUsageSnapshot`              | جلب لقطات الاستخدام/الحصة الخاصة بالمزوّد وتطبيعها بعد حلّ المصادقة                             | يحتاج المزوّد إلى نقطة نهاية استخدام خاصة بالمزوّد أو محلّل حمولة                                                                           |
| 39  | `createEmbeddingProvider`         | بناء محوّل تضمين مملوك للمزوّد للذاكرة/البحث                                                     | سلوك تضمين الذاكرة يخص Plugin المزوّد                                                                                    |
| 40  | `buildReplayPolicy`               | إرجاع سياسة إعادة تشغيل تتحكم في معالجة النص المنسوخ للمزوّد                                        | يحتاج المزوّد إلى سياسة نص منسوخ مخصصة (على سبيل المثال، إزالة كتل التفكير)                                                               |
| 41  | `sanitizeReplayHistory`           | إعادة كتابة سجل إعادة التشغيل بعد التنظيف العام للنص المنسوخ                                                        | يحتاج المزوّد إلى عمليات إعادة كتابة خاصة بالمزوّد لإعادة التشغيل تتجاوز مساعدات Compaction المشتركة                                                             |
| 42  | `validateReplayTurns`             | التحقق النهائي من أدوار إعادة التشغيل أو إعادة تشكيلها قبل المشغّل المضمّن                                           | يحتاج نقل المزوّد إلى تحقق أكثر صرامة من الأدوار بعد التنقية العامة                                                                    |
| 43  | `onModelSelected`                 | تشغيل الآثار الجانبية اللاحقة للاختيار والمملوكة للمزوّد                                                                 | يحتاج المزوّد إلى قياسات عن بُعد أو حالة مملوكة للمزوّد عندما يصبح نموذج نشطًا                                                                  |

`normalizeModelId` و`normalizeTransport` و`normalizeConfig` تتحقق أولًا من
Plugin المزوّد المطابق، ثم تنتقل إلى Plugins المزوّدين الأخرى القادرة على الخطافات
حتى يغيّر أحدها فعليًا معرّف النموذج أو النقل/الإعدادات. يحافظ ذلك على عمل
طبقات التوافق/الأسماء البديلة للمزوّدين من دون مطالبة المستدعي بمعرفة أي
Plugin مضمّن يملك إعادة الكتابة. إذا لم يُعد أي خطاف مزوّد كتابة إدخال إعدادات
مدعوم من عائلة Google، فسيظل مطبّع إعدادات Google المضمّن يطبّق تنظيف التوافق هذا.

إذا كان المزوّد يحتاج إلى بروتوكول سلكي مخصص بالكامل أو منفّذ طلبات مخصص،
فهذه فئة مختلفة من التوسعة. هذه الخطافات مخصصة لسلوك المزوّد الذي لا يزال
يعمل ضمن حلقة الاستدلال العادية في OpenClaw.

يقرر `resolveUsageAuth` ما إذا كان ينبغي لـ OpenClaw استدعاء `fetchUsageSnapshot` أو
الرجوع إلى حل بيانات الاعتماد العام لأسطح الاستخدام/الحالة. أعد
`{ token, accountId? }` عندما يكون لدى المزوّد بيانات اعتماد للاستخدام، وأعد
`{ handled: true }` عندما تكون مصادقة الاستخدام المملوكة للمزوّد قد عالجت الطلب
ويجب أن تمنع الرجوع العام إلى مفتاح API/OAuth، وأعد `null` أو `undefined`
عندما لا يعالج المزوّد مصادقة الاستخدام.

### مثال مزوّد

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
الفهرس والمصادقة والتفكير وإعادة التشغيل والاستخدام. تعيش مجموعة الخطافات
الموثوقة مع كل Plugin تحت `extensions/`؛ توضّح هذه الصفحة الأشكال بدلًا من
عكس القائمة.

<AccordionGroup>
  <Accordion title="مزوّدو الفهارس بالتمرير المباشر">
    يسجّل OpenRouter وKilocode وZ.AI وxAI `catalog` بالإضافة إلى
    `resolveDynamicModel` / `prepareDynamicModel` حتى يتمكنوا من إظهار
    معرّفات النماذج الصاعدة قبل فهرس OpenClaw الثابت.
  </Accordion>
  <Accordion title="مزوّدو OAuth ونقاط نهاية الاستخدام">
    يقرن GitHub Copilot وGemini CLI وChatGPT Codex وMiniMax وXiaomi وz.ai
    `prepareRuntimeAuth` أو `formatApiKey` مع `resolveUsageAuth` +
    `fetchUsageSnapshot` لامتلاك تبادل الرموز والتكامل مع `/usage`.
  </Accordion>
  <Accordion title="عائلات إعادة التشغيل وتنظيف النصوص">
    تتيح العائلات المشتركة المسماة (`google-gemini` و`passthrough-gemini`
    و`anthropic-by-model` و`hybrid-anthropic-openai`) للمزوّدين الاشتراك في
    سياسة النصوص عبر `buildReplayPolicy` بدلًا من أن يعيد كل Plugin تنفيذ
    التنظيف.
  </Accordion>
  <Accordion title="مزوّدو الفهرس فقط">
    يسجّل `byteplus` و`cloudflare-ai-gateway` و`huggingface` و`kimi-coding` و`nvidia`
    و`qianfan` و`synthetic` و`together` و`venice` و`vercel-ai-gateway` و
    `volcengine` فقط `catalog` ويستخدمون حلقة الاستدلال المشتركة.
  </Accordion>
  <Accordion title="مساعدو البث الخاصة بـ Anthropic">
    تعيش ترويسات بيتا و`/fast` / `serviceTier` و`context1m` داخل حد
    `api.ts` / `contract-api.ts` العام في Plugin الخاص بـ Anthropic
    (`wrapAnthropicProviderStream` و`resolveAnthropicBetas`
    و`resolveAnthropicFastMode` و`resolveAnthropicServiceTier`) بدلًا من SDK
    العام.
  </Accordion>
</AccordionGroup>

## مساعدو وقت التشغيل

يمكن لـ Plugins الوصول إلى مساعدي النواة المحددين عبر `api.runtime`. بالنسبة إلى TTS:

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

- يعيد `textToSpeech` حمولة إخراج TTS العادية من النواة لأسطح الملفات/الملاحظات الصوتية.
- يستخدم إعدادات `messages.tts` الأساسية واختيار المزوّد.
- يعيد مخزن صوت PCM + معدل العينة. يجب على Plugins إعادة أخذ العينات/الترميز للمزوّدين.
- `listVoices` اختياري لكل مزوّد. استخدمه لمنتقيات الصوت أو تدفقات الإعداد المملوكة للمورّد.
- يمكن أن تتضمن قوائم الأصوات بيانات وصفية أغنى مثل اللغة المحلية والجنس ووسوم الشخصية للمنتقيات الواعية بالمزوّد.
- يدعم OpenAI وElevenLabs الاتصال الهاتفي اليوم. Microsoft لا يدعمه.

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

- أبقِ سياسة TTS والرجوع وتسليم الرد في النواة.
- استخدم مزوّدي الكلام لسلوك التخليق المملوك للمورّد.
- يتم تطبيع إدخال Microsoft القديم `edge` إلى معرّف المزوّد `microsoft`.
- نموذج الملكية المفضّل متمحور حول الشركة: يمكن لـ Plugin مورّد واحد أن يملك
  مزوّدي النص والكلام والصورة والوسائط المستقبلية بينما يضيف OpenClaw
  عقود القدرات هذه.

لفهم الصور/الصوت/الفيديو، تسجّل Plugins مزوّدًا واحدًا ذا نوع محدد
لفهم الوسائط بدلًا من حاوية مفتاح/قيمة عامة:

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

- أبقِ التنسيق والرجوع والإعدادات وربط القنوات في النواة.
- أبقِ سلوك المورّد داخل Plugin المزوّد.
- يجب أن يبقى التوسع الإضافي ذا نوع محدد: طرق اختيارية جديدة، وحقول نتائج
  اختيارية جديدة، وقدرات اختيارية جديدة.
- يتبع توليد الفيديو النمط نفسه بالفعل:
  - تملك النواة عقد القدرة ومساعد وقت التشغيل
  - تسجّل Plugins المورّدين `api.registerVideoGenerationProvider(...)`
  - تستهلك Plugins الميزات/القنوات `api.runtime.videoGeneration.*`

بالنسبة إلى مساعدي وقت تشغيل فهم الوسائط، يمكن لـ Plugins استدعاء:

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

لنسخ الصوت، يمكن لـ Plugins استخدام إما وقت تشغيل فهم الوسائط
أو اسم STT البديل الأقدم:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

ملاحظات:

- `api.runtime.mediaUnderstanding.*` هو السطح المشترك المفضّل لفهم
  الصور/الصوت/الفيديو.
- `extractStructuredWithModel(...)` هو الحد الموجّه إلى Plugin للاستخراج المحدود
  المملوك للمزوّد والمعتمد أولًا على الصورة. ضمّن إدخال صورة واحدًا على الأقل؛
  إدخالات النص سياق تكميلي.
  تملك Plugins المنتج مساراتها ومخططاتها بينما يملك OpenClaw حد
  المزوّد/وقت التشغيل.
- يستخدم إعدادات صوت فهم الوسائط في النواة (`tools.media.audio`) وترتيب الرجوع بين المزوّدين.
- يعيد `{ text: undefined }` عندما لا يتم إنتاج إخراج نسخ (مثل إدخال متخطى/غير مدعوم).
- يبقى `api.runtime.stt.transcribeAudioFile(...)` كاسم بديل للتوافق.

يمكن لـ Plugins أيضًا إطلاق تشغيلات subagent في الخلفية عبر `api.runtime.subagent`:

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
- لا يكرّم OpenClaw حقول التجاوز هذه إلا للمتصلين الموثوقين.
- بالنسبة إلى تشغيلات الرجوع المملوكة لـ Plugin، يجب على المشغّلين الاشتراك عبر `plugins.entries.<id>.subagent.allowModelOverride: true`.
- استخدم `plugins.entries.<id>.subagent.allowedModels` لتقييد Plugins الموثوقة على أهداف `provider/model` معيارية محددة، أو `"*"` للسماح بأي هدف صراحةً.
- لا تزال تشغيلات subagent من Plugins غير الموثوقة تعمل، لكن يتم رفض طلبات التجاوز بدلًا من الرجوع بصمت.
- تُوسم جلسات subagent التي تنشئها Plugins بمعرّف Plugin المُنشئ. قد يحذف رجوع `api.runtime.subagent.deleteSession(...)` تلك الجلسات المملوكة فقط؛ ما يزال حذف الجلسات العشوائي يتطلب طلب Gateway بنطاق مسؤول.

بالنسبة إلى بحث الويب، يمكن لـ Plugins استهلاك مساعد وقت التشغيل المشترك بدلًا من
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

يمكن لـ Plugins أيضًا تسجيل مزوّدي بحث الويب عبر
`api.registerWebSearchProvider(...)`.

ملاحظات:

- أبقِ اختيار المزوّد وحل بيانات الاعتماد ودلالات الطلب المشتركة في النواة.
- استخدم مزوّدي بحث الويب لوسائل نقل البحث الخاصة بالمورّد.
- `api.runtime.webSearch.*` هو السطح المشترك المفضّل لـ Plugins الميزات/القنوات التي تحتاج إلى سلوك البحث من دون الاعتماد على غلاف أداة الوكيل.

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

- `generate(...)`: توليد صورة باستخدام سلسلة مزوّدي توليد الصور المهيأة.
- `listProviders(...)`: سرد مزوّدي توليد الصور المتاحين وقدراتهم.

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

- `path`: مسار التوجيه ضمن خادم HTTP الخاص بـ Gateway.
- `auth`: مطلوب. استخدم `"gateway"` لطلب مصادقة Gateway العادية، أو `"plugin"` لمصادقة/تحقق Webhook يديره Plugin.
- `match`: اختياري. `"exact"` (الافتراضي) أو `"prefix"`.
- `replaceExisting`: اختياري. يسمح لـ Plugin نفسه باستبدال تسجيل مساره الموجود.
- `handler`: أعد `true` عندما يكون المسار قد عالج الطلب.

ملاحظات:

- تمت إزالة `api.registerHttpHandler(...)` وسيتسبب في خطأ تحميل Plugin. استخدم `api.registerHttpRoute(...)` بدلا منه.
- يجب أن تعلن مسارات Plugin عن `auth` صراحة.
- تُرفض تعارضات `path + match` الدقيقة ما لم يكن `replaceExisting: true`، ولا يمكن لـ Plugin واحد استبدال مسار Plugin آخر.
- تُرفض المسارات المتداخلة ذات مستويات `auth` المختلفة. أبق سلاسل التمرير الاحتياطي `exact`/`prefix` على مستوى المصادقة نفسه فقط.
- مسارات `auth: "plugin"` لا تتلقى نطاقات تشغيل المشغل تلقائيا. هي مخصصة لـ Webhook/تحقق التوقيع الذي يديره Plugin، وليست لاستدعاءات مساعدين Gateway ذات الامتيازات.
- تعمل مسارات `auth: "gateway"` داخل نطاق تشغيل طلب Gateway، لكن هذا النطاق محافظ عمدا:
  - مصادقة حامل السر المشترك (`gateway.auth.mode = "token"` / `"password"`) تبقي نطاقات تشغيل مسار Plugin مثبتة على `operator.write`، حتى إذا أرسل المستدعي `x-openclaw-scopes`
  - أوضاع HTTP الموثوقة الحاملة للهوية (على سبيل المثال `trusted-proxy` أو `gateway.auth.mode = "none"` على مدخل خاص) تحترم `x-openclaw-scopes` فقط عندما يكون الرأس موجودا صراحة
  - إذا كان `x-openclaw-scopes` غائبا في طلبات مسار Plugin الحاملة للهوية هذه، يعود نطاق التشغيل إلى `operator.write`
- القاعدة العملية: لا تفترض أن مسار Plugin بمصادقة Gateway هو سطح إدارة ضمني. إذا كان مسارك يحتاج سلوكا مخصصا للمسؤول فقط، فاطلب وضع مصادقة حامل للهوية ووثق عقد الرأس الصريح `x-openclaw-scopes`.

## مسارات استيراد Plugin SDK

استخدم المسارات الفرعية الضيقة لـ SDK بدلا من البرميل الجذري الأحادي `openclaw/plugin-sdk`
عند تأليف Plugins جديدة. المسارات الفرعية الأساسية:

| المسار الفرعي                       | الغرض                                             |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | أساسيات تسجيل Plugin                              |
| `openclaw/plugin-sdk/channel-core`  | مساعدو إدخال/بناء القناة                          |
| `openclaw/plugin-sdk/core`          | مساعدون مشتركون عامون وعقد شامل                  |
| `openclaw/plugin-sdk/config-schema` | مخطط Zod الجذري لـ `openclaw.json` (`OpenClawSchema`) |

تختار Plugins القنوات من عائلة من الوصلات الضيقة — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, و`channel-actions`. ينبغي توحيد سلوك الموافقة
على عقد `approvalCapability` واحد بدلا من المزج بين
حقول Plugin غير ذات الصلة. راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins).

توجد مساعدات التشغيل والإعدادات ضمن مسارات فرعية مركزة مطابقة من نمط `*-runtime`
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, إلخ). فضّل `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot`, و`config-mutation`
بدلا من برميل التوافق الواسع `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
واجهات مساعدات القنوات الصغيرة، `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`,
و`openclaw/plugin-sdk/infra-runtime` هي طبقات توافق مهملة لـ
Plugins الأقدم. ينبغي أن يستورد الكود الجديد أساسيات عامة أضيق بدلا من ذلك.
</Info>

نقاط الإدخال الداخلية للمستودع (لكل جذر حزمة Plugin مدمج):

- `index.js` — إدخال Plugin مدمج
- `api.js` — برميل مساعدات/أنواع
- `runtime-api.js` — برميل مخصص للتشغيل فقط
- `setup-entry.js` — إدخال Plugin للإعداد

ينبغي لـ Plugins الخارجية استيراد المسارات الفرعية `openclaw/plugin-sdk/*` فقط. لا
تستورد أبدا `src/*` الخاصة بحزمة Plugin أخرى من النواة أو من Plugin آخر.
تفضل نقاط الإدخال المحملة عبر الواجهة لقطة إعدادات التشغيل النشطة عندما
توجد، ثم تعود إلى ملف الإعدادات المحلول على القرص.

توجد مسارات فرعية خاصة بالقدرات مثل `image-generation`, `media-understanding`,
و`speech` لأن Plugins المدمجة تستخدمها اليوم. ليست هذه
عقودا خارجية مجمدة تلقائيا على المدى الطويل — تحقق من صفحة مرجع SDK
ذات الصلة عند الاعتماد عليها.

## مخططات أدوات الرسائل

ينبغي أن تمتلك Plugins مساهمات مخطط `describeMessageTool(...)` الخاصة بالقناة
للعناصر غير الرسائل مثل التفاعلات، والقراءات، والاستطلاعات.
ينبغي أن يستخدم عرض الإرسال المشترك عقد `MessagePresentation` العام
بدلا من حقول الأزرار أو المكونات أو الكتل أو البطاقات الأصلية للمزود.
راجع [عرض الرسائل](/ar/plugins/message-presentation) للاطلاع على العقد،
وقواعد التراجع، وربط المزود، وقائمة تحقق مؤلف Plugin.

تعلن Plugins القادرة على الإرسال عما يمكنها عرضه عبر قدرات الرسائل:

- `presentation` لكتل العرض الدلالية (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` لطلبات التسليم المثبت

تقرر النواة ما إذا كانت ستعرض العرض أصليا أم تخفضه إلى نص.
لا تكشف منافذ هروب واجهة مستخدم أصلية للمزود من أداة الرسائل العامة.
تبقى مساعدات SDK المهملة للمخططات الأصلية القديمة مصدرة لـ Plugins
الجهات الخارجية الحالية، لكن ينبغي ألا تستخدمها Plugins الجديدة.

## حل هدف القناة

ينبغي أن تمتلك Plugins القنوات دلالات الهدف الخاصة بالقناة. أبق المضيف
الصادر المشترك عاما واستخدم سطح مهايئ المراسلة لقواعد المزود:

- يقرر `messaging.inferTargetChatType({ to })` ما إذا كان ينبغي التعامل مع هدف
  مطبع على أنه `direct` أو `group` أو `channel` قبل البحث في الدليل.
- يخبر `messaging.targetResolver.looksLikeId(raw, normalized)` النواة بما إذا كان
  الإدخال ينبغي أن يتجاوز مباشرة إلى حل يشبه المعرف بدلا من البحث في الدليل.
- تسرد `messaging.targetResolver.reservedLiterals` الكلمات المجردة التي تكون
  مراجع قناة/جلسة لذلك المزود. يحافظ الحل على إدخالات الدليل المهيأة
  قبل رفض الكلمات المحجوزة، ثم يفشل مغلقا عند عدم وجود مطابق في الدليل.
- `messaging.targetResolver.resolveTarget(...)` هو تراجع Plugin عندما
  تحتاج النواة إلى حل نهائي مملوك للمزود بعد التطبيع أو بعد عدم وجود مطابق في
  الدليل.
- يمتلك `messaging.resolveOutboundSessionRoute(...)` بناء مسار الجلسة الخاص
  بالمزود بمجرد حل الهدف.

التقسيم الموصى به:

- استخدم `inferTargetChatType` لقرارات الفئة التي ينبغي أن تحدث قبل
  البحث في الأقران/المجموعات.
- استخدم `looksLikeId` لفحوصات "عامل هذا كمعرف هدف صريح/أصلي".
- استخدم `resolveTarget` كتراجع للتطبيع الخاص بالمزود، وليس
  للبحث الواسع في الدليل.
- أبق المعرفات الأصلية للمزود مثل معرفات الدردشة، ومعرفات السلاسل، وJIDs، والمقابض، ومعرفات الغرف
  داخل قيم `target` أو المعاملات الخاصة بالمزود، لا في حقول SDK
  العامة.

## أدلة مدعومة بالإعدادات

ينبغي أن تبقي Plugins التي تشتق إدخالات الدليل من الإعدادات ذلك المنطق في
Plugin وتعيد استخدام المساعدات المشتركة من
`openclaw/plugin-sdk/directory-runtime`.

استخدم هذا عندما تحتاج قناة إلى أقران/مجموعات مدعومة بالإعدادات مثل:

- أقران الرسائل المباشرة المدفوعة بقائمة السماح
- خرائط القنوات/المجموعات المهيأة
- تراجعات دليل ثابتة ضمن نطاق الحساب

تعالج المساعدات المشتركة في `directory-runtime` العمليات العامة فقط:

- ترشيح الاستعلام
- تطبيق الحد
- مساعدات إزالة التكرار/التطبيع
- بناء `ChannelDirectoryEntry[]`

ينبغي أن يبقى فحص الحساب الخاص بالقناة وتطبيع المعرف في
تنفيذ Plugin.

## كتالوجات المزودين

يمكن لـ Plugins المزودين تعريف كتالوجات النماذج للاستدلال باستخدام
`registerProvider({ catalog: { run(...) { ... } } })`.

يعيد `catalog.run(...)` الشكل نفسه الذي يكتبه OpenClaw في
`models.providers`:

- `{ provider }` لإدخال مزود واحد
- `{ providers }` لعدة إدخالات مزودين

استخدم `catalog` عندما يمتلك Plugin معرفات نماذج خاصة بالمزود، أو
افتراضيات URL الأساسية، أو بيانات وصفية للنماذج محمية بالمصادقة.

يتحكم `catalog.order` في وقت دمج كتالوج Plugin مقارنة بالمزودين الضمنيين
المدمجين في OpenClaw:

- `simple`: مزودون عاديون مدفوعون بمفتاح API أو env
- `profile`: مزودون يظهرون عند وجود ملفات تعريف مصادقة
- `paired`: مزودون يصطنعون عدة إدخالات مزودين مرتبطة
- `late`: آخر تمريرة، بعد المزودين الضمنيين الآخرين

يفوز المزودون اللاحقون عند تصادم المفاتيح، لذا يمكن لـ Plugins تجاوز إدخال
مزود مدمج عمدا باستخدام معرف المزود نفسه.

يمكن لـ Plugins أيضا نشر صفوف نماذج للقراءة فقط عبر
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. هذا هو المسار المستقبلي لأسطح القائمة/المساعدة/المنتقي ويدعم
صفوف `text`, `image_generation`, `video_generation`, و`music_generation`.
ما زالت Plugins المزودين تمتلك استدعاءات نقاط النهاية الحية، وتبادل الرموز، وربط
استجابات البائع؛ وتمتلك النواة شكل الصف المشترك، وتسميات المصدر، وتنسيق مساعدة
أداة الوسائط. تنشئ تسجيلات مزودي توليد الوسائط صفوف كتالوج ثابتة تلقائيا
من `defaultModel`, و`models`, و`capabilities`.

التوافق:

- لا يزال `discovery` يعمل كاسم مستعار قديم، لكنه يصدر تحذير إهمال
- إذا تم تسجيل كل من `catalog` و`discovery`، يستخدم OpenClaw `catalog`
- `augmentModelCatalog` مهمل؛ ينبغي للمزودين المدمجين نشر
  الصفوف التكميلية عبر `registerModelCatalogProvider`

## فحص القناة للقراءة فقط

إذا كان Plugin الخاص بك يسجل قناة، ففضّل تنفيذ
`plugin.config.inspectAccount(cfg, accountId)` إلى جانب `resolveAccount(...)`.

السبب:

- `resolveAccount(...)` هو مسار التشغيل. يسمح له بافتراض أن بيانات الاعتماد
  مجسدة بالكامل ويمكنه الفشل بسرعة عندما تكون الأسرار المطلوبة مفقودة.
- ينبغي ألا تحتاج مسارات أوامر القراءة فقط مثل `openclaw status`, و`openclaw status --all`,
  و`openclaw channels status`, و`openclaw channels resolve`, وتدفقات doctor/إصلاح الإعدادات
  إلى تجسيد بيانات اعتماد التشغيل لمجرد
  وصف الإعدادات.

سلوك `inspectAccount(...)` الموصى به:

- أعد حالة حساب وصفية فقط.
- حافظ على `enabled` و`configured`.
- أدرج حقول مصدر/حالة بيانات الاعتماد عند اللزوم، مثل:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- لا تحتاج إلى إرجاع قيم الرموز الخام لمجرد الإبلاغ عن
  توفر القراءة فقط. إرجاع `tokenStatus: "available"` (وحقل المصدر المطابق)
  يكفي لأوامر نمط الحالة.
- استخدم `configured_unavailable` عندما تكون بيانات الاعتماد مهيأة عبر SecretRef لكنها
  غير متاحة في مسار الأمر الحالي.

يتيح هذا لأوامر القراءة فقط الإبلاغ عن "مهيأ لكن غير متاح في مسار الأمر هذا"
بدلا من التعطل أو الإبلاغ خطأ عن أن الحساب غير مهيأ.

## حزم الحزم

قد يتضمن دليل Plugin ملف `package.json` مع `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

يصبح كل إدخال Plugin. إذا سردت الحزمة عدة امتدادات، يصبح معرف Plugin
هو `name/<fileBase>`.

إذا كان Plugin الخاص بك يستورد تبعيات npm، فثبتها في ذلك الدليل حتى
يكون `node_modules` متاحا (`npm install` / `pnpm install`).

حاجز أمني: يجب أن يبقى كل إدخال `openclaw.extensions` داخل دليل Plugin
بعد حل الروابط الرمزية. تُرفض الإدخالات التي تخرج من دليل الحزمة.

ملاحظة أمنية: يثبّت `openclaw plugins install` اعتماديات Plugin باستخدام
`npm install --omit=dev --ignore-scripts` محليًا في المشروع (بلا سكربتات دورة حياة،
وبلا اعتماديات تطوير في وقت التشغيل)، مع تجاهل إعدادات تثبيت npm العالمية الموروثة.
أبقِ أشجار اعتماديات Plugin "JS/TS خالصة" وتجنب الحزم التي تتطلب
بناءات `postinstall`.

اختياري: يمكن أن يشير `openclaw.setupEntry` إلى وحدة خفيفة مخصصة للإعداد فقط.
عندما يحتاج OpenClaw إلى أسطح إعداد لـ Plugin قناة معطلة، أو
عندما تكون Plugin قناة مفعلة لكنها غير مهيأة بعد، فإنه يحمّل `setupEntry`
بدلًا من مدخل Plugin الكامل. هذا يجعل بدء التشغيل والإعداد أخف
عندما يوصّل مدخل Plugin الرئيسي لديك أيضًا أدوات أو خطافات أو شيفرة أخرى
مخصصة لوقت التشغيل فقط.

اختياري: يمكن لـ `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
إدخال Plugin قناة في مسار `setupEntry` نفسه أثناء مرحلة بدء تشغيل gateway
قبل الاستماع، حتى عندما تكون القناة مهيأة بالفعل.

استخدم هذا فقط عندما يغطي `setupEntry` بالكامل سطح بدء التشغيل الذي يجب أن يكون موجودًا
قبل أن يبدأ gateway بالاستماع. عمليًا، يعني ذلك أن مدخل الإعداد
يجب أن يسجل كل قدرة مملوكة للقناة يعتمد عليها بدء التشغيل، مثل:

- تسجيل القناة نفسها
- أي مسارات HTTP يجب أن تكون متاحة قبل أن يبدأ gateway بالاستماع
- أي أساليب أو أدوات أو خدمات gateway يجب أن تكون موجودة خلال النافذة نفسها

إذا كان مدخلك الكامل لا يزال يملك أي قدرة مطلوبة لبدء التشغيل، فلا تفعّل
هذا العلم. أبقِ Plugin على السلوك الافتراضي ودع OpenClaw يحمّل
المدخل الكامل أثناء بدء التشغيل.

يمكن للقنوات المضمنة أيضًا نشر مساعدين لسطح عقد مخصصين للإعداد فقط يمكن للنواة
استشارتهم قبل تحميل وقت تشغيل القناة الكامل. سطح ترقية الإعداد الحالي هو:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

تستخدم النواة هذا السطح عندما تحتاج إلى ترقية إعداد قناة قديم ذي حساب واحد
إلى `channels.<id>.accounts.*` دون تحميل مدخل Plugin الكامل.
Matrix هو المثال المضمن الحالي: ينقل فقط مفاتيح المصادقة/التمهيد إلى
حساب مرقّى مسمى عندما تكون الحسابات المسماة موجودة بالفعل، ويمكنه الحفاظ على
مفتاح حساب افتراضي غير قياسي مهيأ بدلًا من إنشاء `accounts.default` دائمًا.

تحافظ محولات رقع الإعداد تلك على كسل اكتشاف سطح العقد المضمن. يبقى
وقت الاستيراد خفيفًا؛ ولا يُحمّل سطح الترقية إلا عند أول استخدام بدلًا من
إعادة دخول بدء تشغيل القناة المضمنة عند استيراد الوحدة.

عندما تتضمن أسطح بدء التشغيل هذه أساليب RPC للـ gateway، أبقِها ضمن
بادئة خاصة بالـ Plugin. تبقى مساحات أسماء إدارة النواة (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) محجوزة وتُحل دائمًا
إلى `operator.admin`، حتى إذا طلبت Plugin نطاقًا أضيق.

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

يمكن لـ Plugins القنوات الإعلان عن بيانات وصفية للإعداد/الاكتشاف عبر `openclaw.channel` و
تلميحات التثبيت عبر `openclaw.install`. هذا يبقي بيانات فهرس النواة خالية.

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

حقول `openclaw.channel` مفيدة تتجاوز المثال الأدنى:

- `detailLabel`: تسمية ثانوية لأسطح الفهرس/الحالة الأكثر ثراءً
- `docsLabel`: تجاوز نص رابط التوثيق
- `preferOver`: معرّفات Plugin/قناة ذات أولوية أدنى يجب أن يتفوق عليها إدخال الفهرس هذا
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: عناصر تحكم في نص سطح الاختيار
- `markdownCapable`: يعلّم القناة بأنها قادرة على markdown لقرارات تنسيق الصادر
- `exposure.configured`: إخفاء القناة من أسطح سرد القنوات المهيأة عند ضبطها إلى `false`
- `exposure.setup`: إخفاء القناة من منتقيات الإعداد/التهيئة التفاعلية عند ضبطها إلى `false`
- `exposure.docs`: تعليم القناة بأنها داخلية/خاصة لأسطح تنقل التوثيق
- `showConfigured` / `showInSetup`: أسماء مستعارة قديمة ما زالت مقبولة للتوافق؛ فضّل `exposure`
- `quickstartAllowFrom`: إدخال القناة في تدفق البدء السريع القياسي `allowFrom`
- `forceAccountBinding`: طلب ربط حساب صريح حتى عند وجود حساب واحد فقط
- `preferSessionLookupForAnnounceTarget`: تفضيل البحث في الجلسة عند حل أهداف الإعلان

يمكن لـ OpenClaw أيضًا دمج **فهارس قنوات خارجية** (على سبيل المثال، تصدير سجل MPM).
ضع ملف JSON في أحد المسارات التالية:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

أو وجّه `OPENCLAW_PLUGIN_CATALOG_PATHS` (أو `OPENCLAW_MPM_CATALOG_PATHS`) إلى
ملف JSON واحد أو أكثر (مفصولة بفواصل/فواصل منقوطة/`PATH`). يجب أن يحتوي كل ملف
على `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. يقبل المحلل أيضًا `"packages"` أو `"plugins"` كأسماء مستعارة قديمة لمفتاح `"entries"`.

تعرض إدخالات فهرس القنوات المولدة وإدخالات فهرس تثبيت المزوّد
حقائق مصدر تثبيت مطبّعة بجانب كتلة `openclaw.install` الخام. تحدد
الحقائق المطبّعة ما إذا كانت مواصفة npm إصدارًا دقيقًا أم محددًا عائمًا،
وما إذا كانت بيانات سلامة متوقعة موجودة، وما إذا كان مسار مصدر محلي
متاحًا أيضًا. عندما تكون هوية الفهرس/الحزمة معروفة، تحذر
الحقائق المطبّعة إذا انحرف اسم حزمة npm المحلل عن تلك الهوية.
وتحذر أيضًا عندما يكون `defaultChoice` غير صالح أو يشير إلى مصدر
غير متاح، وعندما تكون بيانات سلامة npm موجودة بلا مصدر npm صالح.
ينبغي للمستهلكين التعامل مع `installSource` كحقل اختياري إضافي حتى
لا تضطر الإدخالات اليدوية ووسائط الفهرس إلى تصنيعه.
يسمح هذا للإعداد الأولي والتشخيصات بشرح حالة مستوى المصدر دون
استيراد وقت تشغيل Plugin.

ينبغي لإدخالات npm الخارجية الرسمية تفضيل `npmSpec` دقيق مع
`expectedIntegrity`. لا تزال أسماء الحزم المجردة ووسوم dist-tags تعمل
للتوافق، لكنها تعرض تحذيرات مستوى المصدر حتى يتمكن الفهرس من التحرك
نحو عمليات تثبيت مثبتة ومفحوصة السلامة دون كسر Plugins الموجودة.
عندما يثبّت الإعداد الأولي من مسار فهرس محلي، فإنه يسجل إدخال فهرس Plugin
مدارًا مع `source: "path"` و`sourcePath` نسبيًا لمساحة العمل
عندما يكون ذلك ممكنًا. يبقى مسار التحميل التشغيلي المطلق في
`plugins.load.paths`؛ ويتجنب سجل التثبيت تكرار مسارات محطة العمل المحلية
داخل إعدادات طويلة العمر. هذا يبقي تثبيتات التطوير المحلية مرئية
لتشخيصات مستوى المصدر دون إضافة سطح إفصاح خام ثانٍ لمسار نظام الملفات.
صف SQLite المستمر `installed_plugin_index` هو مصدر حقيقة التثبيت
ويمكن تحديثه دون تحميل وحدات وقت تشغيل Plugin.
تبقى خريطة `installRecords` الخاصة به متينة حتى عندما يكون بيان Plugin مفقودًا أو
غير صالح؛ أما حمولة `plugins` فهي عرض بيان قابل لإعادة البناء.

## Plugins محرك السياق

تملك Plugins محرك السياق تنسيق سياق الجلسة للإدخال والتجميع
وCompaction. سجّلها من Plugin لديك باستخدام
`api.registerContextEngine(id, factory)`، ثم حدد المحرك النشط باستخدام
`plugins.slots.contextEngine`.

استخدم هذا عندما تحتاج Plugin لديك إلى استبدال مسار السياق الافتراضي
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

يكشف `ctx` الخاص بالمصنع قيم `config` و`agentDir` و`workspaceDir`
الاختيارية للتهيئة وقت الإنشاء.

قد يعيد `assemble()` القيمة `contextProjection` عندما تكون لدى harness النشطة
سلسلة خلفية مستمرة. احذفها للإسقاط القديم لكل دورة. أعد
`{ mode: "thread_bootstrap", epoch }` عندما يجب حقن السياق المجمّع
مرة واحدة في سلسلة خلفية وإعادة استخدامه حتى يتغير epoch. غيّر
epoch بعد تغير السياق الدلالي للمحرك، مثلًا بعد مرور Compaction
مملوك للمحرك. قد تحافظ المضيفات على بيانات وصفية لاستدعاءات الأدوات، وشكل
الإدخال، ونتائج الأدوات المنقحة في إسقاط تمهيد السلسلة حتى تحتفظ
السلاسل الخلفية الجديدة باستمرارية الأدوات دون نسخ الحمولات الخام الحاملة للأسرار.

إذا كان محركك **لا** يملك خوارزمية Compaction، فأبقِ `compact()`
منفذًا وفوّضه صراحةً:

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

عندما تحتاج Plugin إلى سلوك لا يلائم API الحالي، لا تتجاوز
نظام Plugin بوصول خاص إلى الداخل. أضف القدرة الناقصة.

التسلسل الموصى به:

1. عرّف عقد النواة
   قرر السلوك المشترك الذي يجب أن تملكه النواة: السياسة، الاحتياط، دمج الإعداد،
   دورة الحياة، الدلالات المواجهة للقناة، وشكل مساعد وقت التشغيل.
2. أضف أسطح تسجيل/وقت تشغيل Plugin المطبّعة
   وسّع `OpenClawPluginApi` و/أو `api.runtime` بأصغر
   سطح قدرة مطبّع مفيد.
3. أوصل النواة + مستهلكي القناة/الميزة
   ينبغي للقنوات وPlugins الميزات استهلاك القدرة الجديدة عبر النواة،
   لا عبر استيراد تنفيذ مورّد مباشرة.
4. سجّل تنفيذات المورّدين
   تسجّل Plugins المورّدين بعد ذلك خلفياتها مقابل القدرة.
5. أضف تغطية للعقد
   أضف اختبارات حتى يبقى شكل الملكية والتسجيل صريحًا بمرور الوقت.

بهذه الطريقة يبقى OpenClaw ذا رأي واضح دون أن يصبح مضمّنًا بمنظور
مزوّد واحد. راجع [كتاب وصفات القدرات](/ar/plugins/adding-capabilities)
للحصول على قائمة تحقق ملفات ملموسة ومثال عملي.

### قائمة تحقق القدرة

عندما تضيف قدرة جديدة، ينبغي للتنفيذ عادةً لمس هذه الأسطح
معًا:

- أنواع عقد النواة في `src/<capability>/types.ts`
- مساعد مشغّل/وقت تشغيل النواة في `src/<capability>/runtime.ts`
- سطح تسجيل API الخاص بـ Plugin في `src/plugins/types.ts`
- توصيل سجل Plugin في `src/plugins/registry.ts`
- تعريض وقت تشغيل Plugin في `src/plugins/runtime/*` عندما تحتاج Plugins الميزات/القنوات
  إلى استهلاكه
- مساعدو الالتقاط/الاختبار في `src/test-utils/plugin-registration.ts`
- تأكيدات الملكية/العقد في `src/plugins/contracts/registry.ts`
- توثيق المشغّل/Plugin في `docs/`

إذا كان أحد هذه الأسطح مفقودًا، فعادةً ما تكون هذه علامة على أن القدرة
لم تندمج بالكامل بعد.

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

- يمتلك النواة عقد الإمكانية + التنسيق
- تمتلك Plugins الخاصة بالمورّدين تطبيقات المورّدين
- تستهلك Plugins الخاصة بالميزات/القنوات مساعدات وقت التشغيل
- تُبقي اختبارات العقد الملكية صريحة

## ذات صلة

- [بنية Plugin](/ar/plugins/architecture) — نموذج الإمكانيات والأشكال العامة
- [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
