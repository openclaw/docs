---
read_when:
    - تحتاج إلى معرفة المسار الفرعي ضمن SDK الذي يجب الاستيراد منه
    - تريد مرجعًا لجميع طرق التسجيل في `OpenClawPluginApi`
    - أنت تبحث عن تصدير محدد من SDK
sidebarTitle: Plugin SDK overview
summary: خريطة الاستيراد، ومرجع واجهة برمجة تطبيقات التسجيل، وبنية حزمة تطوير البرمجيات
title: نظرة عامة على حزمة تطوير البرمجيات للـ Plugin
x-i18n:
    generated_at: "2026-07-12T06:23:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

عُدّة تطوير البرمجيات الخاصة بالـ Plugin هي العقد المنمّط بين الـ plugins والنواة. تمثل هذه الصفحة
مرجعًا يوضح **ما يجب استيراده** و**ما يمكنك تسجيله**.

<Note>
  هذه الصفحة مخصصة لمؤلفي الـ plugins الذين يستخدمون `openclaw/plugin-sdk/*` داخل
  OpenClaw. أما التطبيقات الخارجية والبرامج النصية ولوحات المعلومات ومهام CI وامتدادات IDE
  التي تريد تشغيل الوكلاء عبر Gateway، فاستخدم بدلًا من ذلك
  [تكاملات Gateway للتطبيقات الخارجية](/ar/gateway/external-apps).
</Note>

<Tip>
هل تبحث بدلًا من ذلك عن دليل إرشادي؟ ابدأ بـ[إنشاء الـ plugins](/ar/plugins/building-plugins). استخدم [Plugins القنوات](/ar/plugins/sdk-channel-plugins) للقنوات، و[Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) لمزوّدي النماذج، و[Plugins الواجهات الخلفية لـ CLI](/ar/plugins/cli-backend-plugins) لواجهات CLI الخلفية المحلية للذكاء الاصطناعي، و[Plugins بيئة تشغيل الوكيل](/ar/plugins/sdk-agent-harness) لمنفّذي الوكلاء الأصليين، و[خطافات الـ Plugin](/ar/plugins/hooks) لخطافات الأدوات أو دورة الحياة.
</Tip>

## اصطلاح الاستيراد

استورد دائمًا من مسار فرعي محدد:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

كل مسار فرعي هو وحدة صغيرة مستقلة بذاتها. يحافظ ذلك على سرعة بدء التشغيل
ويمنع مشكلات التبعيات الدائرية. بالنسبة إلى مساعدات نقاط الدخول/البناء الخاصة بالقنوات،
فضّل `openclaw/plugin-sdk/channel-core`؛ واحتفظ بـ`openclaw/plugin-sdk/core`
للسطح الأشمل والمساعدات المشتركة مثل
`buildChannelConfigSchema`.

بالنسبة إلى إعداد القناة، انشر مخطط JSON المملوك للقناة عبر
`openclaw.plugin.json#channelConfigs`. المسار الفرعي `plugin-sdk/channel-config-schema`
مخصص لأساسيات المخطط المشتركة والمنشئ العام. تستخدم الـ plugins المضمّنة في OpenClaw
المسار `plugin-sdk/bundled-channel-config-schema` للاحتفاظ بمخططات
القنوات المضمّنة. تظل صادرات التوافق المهملة متاحة على
`plugin-sdk/channel-config-schema-legacy`؛ ولا يمثل أيٌّ من المسارين الفرعيين للمخططات المضمّنة
نمطًا يُحتذى به للـ plugins الجديدة.

<Warning>
  لا تستورد واجهات التسهيل الموسومة باسم مزوّد أو قناة (على سبيل المثال
  `openclaw/plugin-sdk/slack` أو `.../discord` أو `.../signal` أو `.../whatsapp`).
  تركّب الـ plugins المضمّنة مسارات SDK الفرعية العامة داخل ملفات التصدير الجامعة الخاصة بها
  `api.ts` / `runtime-api.ts`؛ وينبغي لمستهلكي النواة إما استخدام ملفات التصدير الجامعة المحلية
  لتلك الـ plugins، أو إضافة عقد SDK عام ضيق عندما تكون الحاجة مشتركة فعلًا
  بين القنوات.

لا تزال مجموعة صغيرة من واجهات المساعدة للـ plugins المضمّنة تظهر في خريطة التصدير
المولّدة عندما يكون لها استخدام موثّق من المالك. وهي موجودة فقط لصيانة الـ plugins
المضمّنة، ولا يُنصح بها كمسارات استيراد للـ plugins الجديدة التابعة لجهات خارجية.

يُحتفظ أيضًا بـ`openclaw/plugin-sdk/discord` و`openclaw/plugin-sdk/telegram-account`
كواجهتي توافق مهملتين للاستخدام الموثّق من المالك. لا تنسخ
مساري الاستيراد هذين إلى plugins جديدة؛ بل استخدم مساعدات وقت التشغيل المحقونة
ومسارات SDK الفرعية العامة للقنوات بدلًا منهما.
</Warning>

## مرجع المسارات الفرعية

تُتاح عُدّة تطوير البرمجيات الخاصة بالـ Plugin في صورة مجموعة من المسارات الفرعية الضيقة المجمّعة حسب المجال (نقطة دخول الـ Plugin،
والقناة، والمزوّد، والمصادقة، ووقت التشغيل، والإمكانات، والذاكرة، ومساعدات
الـ plugins المضمّنة المحجوزة). للاطلاع على الفهرس الكامل، مجمّعًا ومزوّدًا بالروابط، راجع
[المسارات الفرعية لعُدّة تطوير البرمجيات الخاصة بالـ Plugin](/ar/plugins/sdk-subpaths).

توجد قائمة نقاط دخول المصرّف في
`scripts/lib/plugin-sdk-entrypoints.json`؛ وتُولّد صادرات الحزمة من
المجموعة الفرعية العامة بعد استبعاد مسارات الاختبار/المسارات الداخلية المحلية للمستودع المدرجة في
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. شغّل
`pnpm plugin-sdk:surface` لتدقيق عدد الصادرات العامة. تُتتبّع المسارات الفرعية العامة
المهملة التي مضى عليها وقت كافٍ ولم تعد مستخدمة في شفرة الإنتاج للامتدادات المضمّنة في
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`؛ كما تُتتبّع
ملفات التصدير الجامعة الواسعة المهملة في
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## واجهة برمجة تطبيقات التسجيل

تتلقى دالة الاستدعاء الراجع `register(api)` كائن `OpenClawPluginApi` الذي يتضمن
الأساليب التالية:

### تسجيل الإمكانات

| الأسلوب                                          | ما يسجله                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | استدلال نصي (LLM)                                                                 |
| `api.registerWorkerProvider(...)`                | عقود إيجار دورة حياة العامل السحابي                                               |
| `api.registerModelCatalogProvider(...)`          | صفوف فهرس النماذج لتوليد النصوص والوسائط                                           |
| `api.registerAgentHarness(...)`                  | منفّذ وكيل أصلي [تجريبي](/ar/plugins/sdk-agent-harness) (Codex، Copilot)             |
| `api.registerCliBackend(...)`                    | واجهة خلفية محلية للاستدلال عبر CLI                                                |
| `api.registerChannel(...)`                       | قناة مراسلة                                                                        |
| `api.registerEmbeddingProvider(...)`             | مزوّد قابل لإعادة الاستخدام لتضمين المتجهات                                        |
| `api.registerSpeechProvider(...)`                | تحويل النص إلى كلام / توليف STT                                                    |
| `api.registerRealtimeTranscriptionProvider(...)` | نسخ آني متدفق                                                                      |
| `api.registerRealtimeVoiceProvider(...)`         | جلسات صوتية آنية ثنائية الاتجاه                                                    |
| `api.registerMediaUnderstandingProvider(...)`    | تحليل الصور/الصوت/الفيديو                                                          |
| `api.registerTranscriptSourceProvider(...)`      | مصدر مباشر أو مستورد لنص اجتماع                                                    |
| `api.registerImageGenerationProvider(...)`       | توليد الصور                                                                        |
| `api.registerMusicGenerationProvider(...)`       | توليد الموسيقى                                                                     |
| `api.registerVideoGenerationProvider(...)`       | توليد الفيديو                                                                      |
| `api.registerWebFetchProvider(...)`              | مزوّد جلب الويب / استخلاص محتواه                                                   |
| `api.registerWebSearchProvider(...)`             | البحث في الويب                                                                     |
| `api.registerCompactionProvider(...)`            | واجهة خلفية قابلة للاستبدال لـCompaction نصوص الجلسات                              |

يجب أيضًا على مزوّدي العمال التصريح بمعرّفهم في `contracts.workerProviders`.
تُخزّن النواة النية الدائمة قبل `provision(profile, operationId)`. يتحقق المزوّدون من الإعدادات قبل التخصيص الخارجي ويرمون `WorkerProviderError` عند الرفض الدائم للملف التعريفي. يجب أن يتبنّى `provision` عقد الإيجار نفسه عند تكرار معرّف العملية.
تُخزّن النواة إعدادات الملف التعريفي المتحقق منها مع عقد الإيجار، وتزوّد `destroy({ leaseId, profile })` بتلك اللقطة، ويجب أن تكون هذه العملية عديمة التأثير عند التكرار، كما تزوّد بها `inspect({ leaseId, profile })` التي تُرجع `active` أو `destroyed` أو `unknown`. يتيح ذلك للمزوّدين توجيه استدعاءات دورة الحياة بعد إعادة تشغيل Gateway أو إزالة ملف تعريفي مسمّى. تستخدم نقاط نهاية SSH مرجع `SecretRef` للحقل `keyRef`، ولا تستخدم أبدًا مادة المفتاح ضمن السطر، وتتضمن `hostKey` من مخرجات التوفير الموثوقة بالتنسيق `algorithm base64` تمامًا، من دون اسم مضيف أو تعليق. تثبّت النواة `hostKey` ولا تثق مطلقًا بمفتاح من الاتصال الأول. يمكن للمزوّد الذي ينشئ `keyRef` ديناميكيًا تنفيذ `resolveSshIdentity({ leaseId, profile, keyRef })`؛ وعند وجوده، يكون هذا المحلّل هو المرجع الحاسم، بينما يستخدم المزوّدون الذين لا يملكونه محلّل الأسرار العام المضبوط.
يمكن للمزوّدين الذين لديهم عقود إيجار قابلة للتجديد تنفيذ `renew(leaseId)` أيضًا.
يجب أن ترمي `inspect` خطأً عند حالات الفشل العابرة أو غير القابلة للحسم؛ ولا تُرجع `unknown` إلا عند غياب مؤكّد. تضع النواة علامة «يتيم» على سجل محلي نشط، أو تتعامل مع الغياب بوصفه اكتمالًا للإزالة بعد طلب إتلاف مخزّن.

يجب أيضًا إدراج مزوّدي التضمين المسجلين باستخدام `api.registerEmbeddingProvider(...)`
في `contracts.embeddingProviders` ضمن بيان الـ Plugin. يمثل هذا
سطح التضمين العام لتوليد المتجهات القابل لإعادة الاستخدام. يمكن لبحث الذاكرة
استهلاك سطح المزوّد العام هذا. أما واجهة
`api.registerMemoryEmbeddingProvider(...)` و
`contracts.memoryEmbeddingProviders` الأقدم فهي واجهة توافق مهملة إلى أن
يُرحّل مزوّدو الذاكرة الحاليون المخصّصون.

يظل مزوّدو الذاكرة المخصّصون الذين لا يزالون يكشفون `batchEmbed(...)` في وقت التشغيل ضمن
عقد التجميع الحالي لكل ملف، ما لم يضبط وقت تشغيلهم صراحةً
`sourceWideBatchEmbed: true`. يتيح هذا الاشتراك لمضيف الذاكرة إرسال أجزاء من
عدة ملفات ذاكرة معدّلة ومصادر مفعّلة ضمن استدعاء `batchEmbed(...)` واحد بما لا يتجاوز
حدود الدفعة لدى المضيف. يجب على محوّلات الدفعات التي ترفع ملفات طلبات JSONL
تقسيم مهام المزوّد قبل بلوغ حد حجم الرفع وكذلك حد
عدد الطلبات. يجب أن يعيد المزوّد تضمينًا واحدًا لكل جزء إدخال وبالترتيب نفسه الوارد في
`batch.chunks`؛ احذف العلامة عندما يتوقع المزوّد دفعات محلية لكل ملف أو
لا يستطيع الحفاظ على ترتيب الإدخال عبر مهمة أوسع تشمل المصدر بأكمله.

### الأدوات والأوامر

استخدم [`defineToolPlugin`](/ar/plugins/tool-plugins) للـ plugins البسيطة المخصصة للأدوات فقط
ذات أسماء الأدوات الثابتة. استخدم `api.registerTool(...)` مباشرةً للـ plugins المختلطة
أو لتسجيل الأدوات الديناميكي بالكامل.

| الأسلوب                                | ما يسجله                                                                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | أداة وكيل (مطلوبة أو `{ optional: true }`)                                                                                               |
| `api.registerCommand(def)`             | أمر مخصّص (يتجاوز LLM)                                                                                                                    |
| `api.registerNodeHostCommand(command)` | أمر يعالجه `openclaw node run`؛ يمكن لبيانات `agentTool` الوصفية الاختيارية إظهاره كأداة مرئية للوكيل أثناء اتصال Node |

يمكن لأوامر الـ Plugin ضبط `agentPromptGuidance` عندما يحتاج الوكيل إلى تلميح توجيه قصير
مملوك للأمر. اجعل ذلك النص متعلقًا بالأمر نفسه؛ ولا تضف
سياسة خاصة بالمزوّد أو الـ Plugin إلى منشئي مطالبات النواة.

يمكن أن تكون إدخالات الإرشاد سلاسل نصية قديمة تُطبّق على كل سطح من أسطح المطالبات، أو
إدخالات منظّمة:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

قد تتضمن `surfaces` المنظّمة `openclaw_main` أو `codex_app_server`
أو `cli_backend` أو `acp_backend` أو `subagent`. يظل `pi_main` اسمًا بديلًا
مهملًا لـ`openclaw_main`. احذف `surfaces` عند قصد تطبيق الإرشاد على كل الأسطح. لا
تمرّر مصفوفة `surfaces` فارغة؛ إذ تُرفض حتى لا يتحول فقدان النطاق غير المقصود
إلى نص عام للمطالبة.

تعليمات المطوّر الأصلية لخادم تطبيق Codex أكثر صرامة من أسطح المطالبات
الأخرى: لا يُرقّى إلى ذلك المسار الأعلى أولوية إلا الإرشاد المحدد نطاقه صراحةً إلى
`codex_app_server`. يظل إرشاد السلاسل النصية القديمة والإرشاد المنظّم غير المحدد النطاق
متاحًا لأسطح المطالبات غير التابعة لـCodex لأغراض التوافق.

تُنفَّذ أوامر مضيف Node على مضيف Node المتصل، وليس داخل عملية Gateway.
إذا كان `agentTool` موجودًا، تنشر Node واصفًا بعد اتصال ناجح بـ Gateway؛ ولا
يعرضه Gateway لعمليات تشغيل الوكيل إلا أثناء اتصال تلك Node، وفقط إذا كان
`command` الخاص بالواصف ضمن سطح الأوامر المعتمد في Node. عيّن
`agentTool.defaultPlatforms` لإدراج أمر غير خطير في قائمة السماح الافتراضية
لأوامر Node؛ وإلا فاشترط `gateway.nodes.allowCommands` صريحًا أو سياسة
استدعاء Node. يجب أن يكون `agentTool.name` آمنًا لمزوّد الخدمة: يبدأ بحرف،
ويستخدم الحروف أو الأرقام أو الشرطات السفلية أو الواصلات فقط، وألا يتجاوز
64 محرفًا. يمكن لأدوات Node المدعومة بـ MCP تعيين بيانات `agentTool.mcp`
الوصفية لكي تتمكن أسطح الكتالوج والبحث عن الأدوات من إظهار هوية خادم/أداة
MCP البعيدة، لكن التنفيذ يظل يمر عبر أمر Node المُعلن.

### البنية التحتية

| الطريقة                                         | ما تسجّله                                                    |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | خطاف حدث                                                     |
| `api.registerHttpRoute(params)`                 | نقطة نهاية HTTP في Gateway                                   |
| `api.registerGatewayMethod(name, handler)`      | طريقة RPC في Gateway                                         |
| `api.registerGatewayDiscoveryService(service)`  | مُعلِن اكتشاف Gateway المحلي                                 |
| `api.registerCli(registrar, opts?)`             | أمر فرعي في CLI                                              |
| `api.registerNodeCliFeature(registrar, opts?)`  | CLI لميزة Node ضمن `openclaw nodes`                          |
| `api.registerService(service)`                  | خدمة تعمل في الخلفية                                         |
| `api.registerInteractiveHandler(registration)`  | معالج تفاعلي                                                 |
| `api.registerAgentToolResultMiddleware(...)`    | برمجية وسيطة لنتيجة الأداة في وقت التشغيل                    |
| `api.registerMemoryPromptSupplement(builder)`   | قسم إضافي للموجّه مرتبط بالذاكرة                             |
| `api.registerMemoryCorpusSupplement(adapter)`   | مجموعة إضافية للبحث في الذاكرة وقراءتها                      |
| `api.registerHostedMediaResolver(resolver)`     | محلّل لعناوين URL للوسائط المستضافة بأسلوب المتصفح           |
| `api.registerTextTransforms(transforms)`        | عمليات إعادة كتابة نصية للتوافق مع الموجّهات/الرسائل يملكها Plugin |
| `api.registerConfigMigration(migrate)`          | ترحيل خفيف للإعدادات يُشغَّل قبل تحميل وقت تشغيل Plugin      |
| `api.registerMigrationProvider(provider)`       | مستورِد للأمر `openclaw migrate`                             |
| `api.registerAutoEnableProbe(probe)`            | فحص إعدادات يمكنه تمكين هذا Plugin تلقائيًا                  |
| `api.registerReload(registration)`              | سياسة إعادة تشغيل/تحديث فوري/عدم إجراء لبادئة الإعدادات لمعالجة إعادة التحميل |
| `api.registerNodeHostCommand(command)`          | معالج أوامر معروض لعُقد Node المقترنة                         |
| `api.registerNodeInvokePolicy(policy)`          | سياسة قائمة السماح/الموافقة للأوامر المستدعاة من Node        |
| `api.registerSecurityAuditCollector(collector)` | مجمّع نتائج للأمر `openclaw security audit`                  |

تتلقى أدوات إنشاء ملحق موجّه الذاكرة سياقًا اختياريًا يتضمن `agentId`
و`agentSessionKey` و`sandboxed`. وتتلقى استدعاءات `search` و`get` في ملحق
مجموعة الذاكرة سياقًا اختياريًا يتضمن `agentId` و`sandboxed`. ينبغي أن تحل
Plugins التي تملك تخزينًا تابعًا للوكيل ذلك التخزين لكل استدعاء بدلًا من
التقاط مسار عام واحد أثناء التسجيل. إذا كان معرّف الوكيل مطلوبًا لكنه مفقود
في عملية متعددة الوكلاء، فارفض العملية افتراضيًا بدلًا من اختيار وكيل
اعتباطي.

يمكن للمعالجات التفاعلية في Telegram إرجاع `{ submitText }` لتوجيه النص عبر
مسار الوكيل الوارد المعتاد في Telegram بعد نجاح المعالج. يحتفظ OpenClaw بزر
رد الاتصال عندما تتخطى سياسة الوارد النص أو تفشل المعالجة، بحيث يستطيع
المستخدم إعادة المحاولة بعد تغيّر الحالة المانعة. حقل النتيجة هذا خاص بـ
Telegram؛ وتحتفظ القنوات الأخرى بعقود نتائجها التفاعلية الخاصة.

### خطافات المضيف لـ Plugins الخاصة بسير العمل

خطافات المضيف هي نقاط الربط في SDK المخصصة لـ Plugins التي تحتاج إلى
المشاركة في دورة حياة المضيف بدلًا من الاكتفاء بإضافة مزوّد أو قناة أو أداة.
وهي عقود عامة؛ يمكن لوضع الخطة استخدامها، كما يمكن استخدامها أيضًا في مسارات
عمل الموافقة، وبوابات سياسات مساحة العمل، ومراقبات الخلفية، ومعالجات الإعداد،
وPlugins المرافقة لواجهة المستخدم.

| الطريقة                                                                              | العقد الذي تملكه                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | حالة جلسة يملكها Plugin ومتوافقة مع JSON، تُسقَط عبر جلسات Gateway                                                                                         |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | سياق دائم يُحقن مرة واحدة بالضبط في دورة الوكيل التالية لجلسة واحدة                                                                                       |
| `api.registerTrustedToolPolicy(...)`                                                 | سياسة أدوات موثوقة ومقيّدة ببيان Plugin تعمل قبل خطافات Plugin ويمكنها حظر معاملات الأداة أو إعادة كتابتها                                                |
| `api.registerToolMetadata(...)`                                                      | بيانات وصفية لعرض كتالوج الأدوات دون تغيير تنفيذ الأداة                                                                                                   |
| `api.registerCommand(...)`                                                           | أوامر Plugin محددة النطاق؛ يمكن لنتائج الأوامر تعيين `continueAgent: true` أو `suppressReply: true`؛ وتدعم أوامر Discord الأصلية `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | واصفات مساهمة في واجهة التحكم لأسطح الجلسة أو الأداة أو التشغيل أو الإعدادات أو علامات التبويب                                                            |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | استدعاءات تنظيف لموارد وقت التشغيل التي يملكها Plugin في مسارات إعادة الضبط/الحذف/إعادة التحميل                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | اشتراكات أحداث منقّحة لحالة سير العمل والمراقبات                                                                                                          |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | حالة مؤقتة لـ Plugin لكل تشغيل، تُمسح عند دورة حياة انتهاء التشغيل                                                                                         |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | بيانات وصفية لتنظيف مهام المجدول التي يملكها Plugin؛ لا تجدول العمل ولا تنشئ سجلات مهام                                                                   |
| `api.session.workflow.sendSessionAttachment(...)`                                    | تسليم مرفقات ملفات بوساطة المضيف ومتاح فقط لـ Plugins المضمّنة، إلى مسار الجلسة النشط الصادر مباشرة                                                       |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | دورات جلسة مجدولة ومدعومة بـ Cron ومتاحة فقط لـ Plugins المضمّنة، بالإضافة إلى التنظيف المستند إلى الوسوم                                                |
| `api.session.controls.registerSessionAction(...)`                                    | إجراءات جلسة محددة النوع يمكن للعملاء إرسالها عبر Gateway                                                                                                 |

يضيف واصف `surface: "tab"` علامة تبويب إلى الشريط الجانبي في واجهة التحكم.
تُعلَن واصفات علامات تبويب Plugins النشطة لعملاء لوحة المعلومات في رسالة
ترحيب Gateway (`controlUiTabs`)، ولذلك لا تظهر علامة التبويب إلا أثناء تمكين
Plugin. يمكن لـ Plugins المضمّنة توفير عرض أصلي متكامل في لوحة المعلومات
لعلامة التبويب الخاصة بها؛ ويمكن لـ Plugins الأخرى تعيين `path` إلى مسار HTTP
خاص بـ Plugin (راجع `api.registerHttpRoute(...)`) تعرضه لوحة المعلومات داخل
إطار معزول. يمثّل `icon` تلميحًا لاسم أيقونة في لوحة المعلومات، ويختار
`group` قسم الشريط الجانبي (`control` أو `agent`)، ويحدّد `order` ترتيب علامات
تبويب Plugins، ويخفي `requiredScopes` علامة التبويب عن الاتصالات التي تفتقر
إلى نطاقات المشغّل تلك:

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Logbook",
  description: "Your day as a timeline, built from screen snapshots.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

استخدم مساحات الأسماء المجمّعة في شيفرة Plugin الجديدة:

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

تظل الطرق المسطحة المكافئة متاحة كأسماء بديلة متقادمة للتوافق مع Plugins
الحالية. لا تضف شيفرة Plugin جديدة تستدعي مباشرةً
`api.registerSessionExtension` أو `api.enqueueNextTurnInjection` أو
`api.registerControlUiDescriptor` أو `api.registerRuntimeLifecycle` أو
`api.registerAgentEventSubscription` أو `api.emitAgentEvent` أو
`api.setRunContext` أو `api.getRunContext` أو `api.clearRunContext` أو
`api.registerSessionSchedulerJob` أو `api.registerSessionAction` أو
`api.sendSessionAttachment` أو `api.scheduleSessionTurn` أو
`api.unscheduleSessionTurnsByTag`.

تُعد `scheduleSessionTurn(...)` وسيلة ملائمة محددة النطاق بالجلسة فوق مجدول
Cron في Gateway. يمتلك Cron التوقيت وينشئ سجل مهمة الخلفية عند تشغيل الدورة؛
ولا يقيّد Plugin SDK سوى الجلسة المستهدفة، والتسمية التي يملكها Plugin،
والتنظيف. استخدم `api.runtime.tasks.managedFlows` داخل الدورة المجدولة عندما
يحتاج العمل نفسه إلى حالة دائمة متعددة الخطوات لـ Task Flow.

تفصل العقود الصلاحيات عن قصد:

- يمكن لـ Plugins الخارجية امتلاك امتدادات الجلسات، وواصفات واجهة المستخدم،
  والأوامر، والبيانات الوصفية للأدوات، وعمليات الحقن في الدورة التالية،
  والخطافات العادية.
- تعمل سياسات الأدوات الموثوقة قبل خطافات `before_tool_call` العادية، ويثق
  بها المضيف. تعمل السياسات المضمّنة أولًا؛ وتتطلب سياسات Plugins المثبّتة
  تمكينًا صريحًا بالإضافة إلى معرّفاتها المحلية في
  `contracts.trustedToolPolicies`، ثم تعمل وفق ترتيب تحميل Plugins. تقتصر
  معرّفات السياسات على Plugin الذي سجّلها.
- ملكية الأوامر المحجوزة متاحة فقط للمكوّنات المضمّنة. ينبغي لـ Plugins
  الخارجية استخدام أسماء أو أسماء بديلة لأوامرها الخاصة.
- يعطّل `allowPromptInjection=false` الخطافات التي تعدّل الموجّه، بما فيها
  `agent_turn_prepare` و`before_prompt_build` و
  `heartbeat_prompt_contribution`، وحقول الموجّه من
  `before_agent_start` القديم، و`enqueueNextTurnInjection`.

أمثلة على مستهلكين لا يستخدمون وضع الخطة:

| نموذج Plugin                 | الخطافات المستخدمة                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| سير عمل الموافقة             | امتداد الجلسة، ومتابعة الأمر، والحقن في الدورة التالية، وواصف واجهة المستخدم                                                            |
| بوابة سياسة الميزانية/مساحة العمل | سياسة الأدوات الموثوقة، والبيانات الوصفية للأدوات، وإسقاط الجلسة                                                                                 |
| مراقب دورة الحياة في الخلفية | تنظيف دورة حياة وقت التشغيل، والاشتراك في أحداث الوكيل، وملكية مجدول الجلسة/تنظيفه، والمساهمة في موجّه Heartbeat، وواصف واجهة المستخدم |
| معالج الإعداد أو التهيئة الأولية | امتداد الجلسة، والأوامر محددة النطاق، وواصف واجهة مستخدم التحكم                                                                              |

<Note>
  تظل نطاقات الإدارة الأساسية المحجوزة (`config.*`، و`exec.approvals.*`، و`wizard.*`،
  و`update.*`) دائمًا ضمن `operator.admin`، حتى إذا حاول Plugin تعيين نطاق
  أضيق لأسلوب Gateway. يُفضّل استخدام بادئات خاصة بكل Plugin للأساليب
  التي يملكها Plugin.
</Note>

<Accordion title="متى تستخدم برمجية وسيطة لنتائج الأدوات">
  يمكن للـ Plugins المضمّنة والـ Plugins المثبّتة والمفعّلة صراحةً، التي تتطابق معها
  عقود البيان، استخدام `api.registerAgentToolResultMiddleware(...)` عندما
  تحتاج إلى إعادة كتابة نتيجة أداة بعد التنفيذ وقبل أن يعيد وقت التشغيل
  تمرير تلك النتيجة إلى النموذج. وهذه هي نقطة التكامل الموثوقة والمحايدة تجاه
  وقت التشغيل لمختزِلات المخرجات غير المتزامنة مثل tokenjuice.

يجب أن تعلن Plugins عن `contracts.agentToolResultMiddleware` لكل وقت تشغيل
مستهدف، مثل `["openclaw", "codex"]`. ولا يمكن للـ Plugins المثبّتة التي لا
تملك هذا العقد، أو غير المفعّلة صراحةً، تسجيل هذه البرمجية الوسيطة؛ استخدم
خطافات Plugin المعتادة في OpenClaw للأعمال التي لا تحتاج إلى توقيت نتيجة
الأداة قبل النموذج. وقد أُزيل مسار تسجيل مصنع الامتدادات القديم
الخاص بالمشغّل المضمّن فقط.
</Accordion>

### تسجيل اكتشاف Gateway

تتيح `api.registerGatewayDiscoveryService(...)` للـ Plugin الإعلان عن
Gateway النشط عبر وسيلة اكتشاف محلية مثل mDNS/Bonjour. يستدعي OpenClaw
الخدمة أثناء بدء تشغيل Gateway عندما يكون الاكتشاف المحلي مفعّلًا، ويمرّر
منافذ Gateway الحالية وبيانات تلميحات TXT غير السرية، ويستدعي معالج
`stop` المُعاد أثناء إيقاف تشغيل Gateway.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

يجب ألا تتعامل Plugins اكتشاف Gateway مع قيم TXT المُعلَن عنها باعتبارها
أسرارًا أو مصادقة. الاكتشاف تلميح توجيه؛ وتظل مصادقة Gateway وتثبيت TLS
مسؤولين عن الثقة.

### البيانات الوصفية لتسجيل CLI

تقبل `api.registerCli(registrar, opts?)` نوعين من البيانات الوصفية للأوامر:

- `commands`: أسماء أوامر صريحة يملكها المسجّل
- `descriptors`: واصفات أوامر وقت التحليل المستخدمة لمساعدة CLI،
  والتوجيه، والتسجيل الكسول لـ CLI الخاص بالـ Plugin
- `parentPath`: مسار أمر أب اختياري لمجموعات الأوامر المتداخلة، مثل
  `["nodes"]`

بالنسبة إلى ميزات العُقد المقترنة، يُفضّل استخدام
`api.registerNodeCliFeature(registrar, opts?)`. وهي مغلّف صغير حول
`api.registerCli(..., { parentPath: ["nodes"] })` وتجعل أوامر مثل
`openclaw nodes canvas` ميزات عُقد صريحة يملكها Plugin.

إذا أردت أن يظل أمر Plugin محمّلًا بشكل كسول ضمن مسار CLI الجذري المعتاد،
فقدّم `descriptors` تغطي كل جذر أمر من المستوى الأعلى يكشفه ذلك
المسجّل.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

تتلقى الأوامر المتداخلة الأمر الأب المحلول بوصفه `program`:

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

استخدم `commands` وحدها فقط عندما لا تحتاج إلى تسجيل CLI جذري كسول.
يظل مسار التوافق الاستباقي هذا مدعومًا، لكنه لا يثبّت عناصر نائبة مدعومة
بالواصفات للتحميل الكسول وقت التحليل.

### تسجيل واجهة CLI الخلفية

تتيح `api.registerCliBackend(...)` للـ Plugin امتلاك الإعداد الافتراضي
لواجهة خلفية محلية لـ CLI للذكاء الاصطناعي مثل `claude-cli` أو `my-cli`.

- يصبح `id` للواجهة الخلفية بادئة المزوّد في مراجع النماذج مثل `my-cli/gpt-5`.
- يستخدم `config` للواجهة الخلفية البنية نفسها المستخدمة في `agents.defaults.cliBackends.<id>`.
- تظل الأولوية لإعداد المستخدم. يدمج OpenClaw قيمة `agents.defaults.cliBackends.<id>` فوق
  الإعداد الافتراضي للـ Plugin قبل تشغيل CLI.
- استخدم `normalizeConfig` عندما تحتاج واجهة خلفية إلى عمليات إعادة كتابة
  توافقية بعد الدمج (مثل تطبيع بُنى العلامات القديمة).
- استخدم `resolveExecutionArgs` لعمليات إعادة كتابة argv محددة النطاق للطلب
  وتنتمي إلى لهجة CLI، مثل ربط مستويات التفكير في OpenClaw بعلامة جهد
  أصلية. يتلقى الخطاف `ctx.executionMode`؛ استخدم `"side-question"` لإضافة
  علامات عزل أصلية للواجهة الخلفية لاستدعاءات `/btw` المؤقتة. وإذا كانت تلك
  العلامات تعطّل الأدوات الأصلية بشكل موثوق في CLI تكون أدواته مفعّلة دائمًا
  بخلاف ذلك، فأعلن أيضًا `sideQuestionToolMode: "disabled"`.
- يمكن للواجهات الخلفية القادرة على تعطيل جميع الأدوات الأصلية لتشغيل محدد
  أن تعلن `nativeToolMode: "selectable"`. تمرّر الاستدعاءات المقيّدة صفًا
  فارغًا في `ctx.toolAvailability.native` بالإضافة إلى قائمة سماح MCP دقيقة
  ومعزولة عن المضيف؛ ويجب أن يفرض `resolveExecutionArgs` كليهما على argv
  النهائي للتشغيل الجديد أو المستأنف. يفشل OpenClaw في وضع مغلق إذا تعذّر
  على الواجهة الخلفية تنفيذ ذلك.

للاطلاع على دليل تأليف شامل من البداية إلى النهاية، راجع
[Plugins الواجهات الخلفية لـ CLI](/ar/plugins/cli-backend-plugins).

### الخانات الحصرية

| الأسلوب                                     | ما يسجّله                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | محرك السياق (واحد نشط في كل مرة). تتلقى استدعاءات دورة الحياة `runtimeSettings` عندما يستطيع المضيف توفير تشخيصات النموذج/المزوّد/الوضع؛ وتُعاد محاولة المحركات الصارمة القديمة من دون ذلك المفتاح. |
| `api.registerMemoryCapability(capability)` | إمكانية ذاكرة موحّدة                                                                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | منشئ قسم موجّه الذاكرة                                                                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`    | محلّل خطة تفريغ الذاكرة                                                                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | محوّل وقت تشغيل الذاكرة                                                                                                                                                                             |

### محوّلات تضمين الذاكرة المهملة

| الأسلوب                                         | ما يسجّله                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | محوّل تضمين الذاكرة للـ Plugin النشط |

- تُعد `registerMemoryCapability` واجهة API الحصرية المفضّلة لـ Plugin الذاكرة.
- قد تكشف `registerMemoryCapability` أيضًا عن `publicArtifacts.listArtifacts(...)`
  لكي تتمكن Plugins المصاحبة من استهلاك عناصر الذاكرة المصدّرة عبر
  `openclaw/plugin-sdk/memory-host-core` بدلًا من الوصول إلى التخطيط الخاص
  لـ Plugin ذاكرة بعينه.
- تُعد `registerMemoryPromptSection` و`registerMemoryFlushPlan` و
  `registerMemoryRuntime` واجهات API حصرية متوافقة مع الأنظمة القديمة
  لـ Plugin الذاكرة.
- يمكن لـ `MemoryFlushPlan.model` تثبيت دورة التفريغ على مرجع
  `provider/model` دقيق، مثل `ollama/qwen3:8b`، من دون وراثة سلسلة
  التراجع النشطة.
- أصبحت `registerMemoryEmbeddingProvider` مهملة. ينبغي لمزوّدي التضمين الجدد
  استخدام `api.registerEmbeddingProvider(...)` و
  `contracts.embeddingProviders`.
- يستمر مزوّدو الذاكرة الحاليون في العمل خلال فترة الترحيل،
  لكن فحص Plugin يبلّغ عن ذلك بوصفه دين توافق للـ Plugins
  غير المضمّنة.

### الأحداث ودورة الحياة

| الأسلوب                                       | ما يفعله                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | خطاف دورة حياة محدد النوع          |
| `api.onConversationBindingResolved(handler)` | استدعاء ربط المحادثة |

راجع [خطافات Plugin](/ar/plugins/hooks) للاطلاع على أمثلة، وأسماء الخطافات
الشائعة، ودلالات الحماية.

### دلالات قرارات الخطافات

`before_install` هو خطاف دورة حياة لوقت تشغيل Plugin، وليس سطح سياسة
التثبيت الخاصة بالمشغّل. استخدم `security.installPolicy` عندما يجب أن
يشمل قرار السماح/الحظر مسارات التثبيت أو التحديث المستندة إلى CLI وGateway.

- `before_tool_call`: تُعدّ إعادة `{ block: true }` نهائية. بمجرد أن يضبطها أي معالج، يتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: تُعامل إعادة `{ block: false }` على أنها عدم اتخاذ قرار (مثل حذف `block`)، وليست تجاوزًا.
- `before_install`: تُعدّ إعادة `{ block: true }` نهائية. بمجرد أن يضبطها أي معالج، يتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_install`: تُعامل إعادة `{ block: false }` على أنها عدم اتخاذ قرار (مثل حذف `block`)، وليست تجاوزًا.
- `reply_dispatch`: تُعدّ إعادة `{ handled: true, ... }` نهائية. بمجرد أن يتولى أي معالج الإرسال، يتم تخطي المعالجات ذات الأولوية الأدنى ومسار الإرسال الافتراضي للنموذج.
- `message_sending`: تُعدّ إعادة `{ cancel: true }` نهائية. بمجرد أن يضبطها أي معالج، يتم تخطي المعالجات ذات الأولوية الأدنى.
- `message_sending`: تُعامل إعادة `{ cancel: false }` على أنها عدم اتخاذ قرار (مثل حذف `cancel`)، وليست تجاوزًا.
- `message_received`: استخدم الحقل المنمّط `threadId` عندما تحتاج إلى توجيه السلسلة/الموضوع الوارد. واحتفظ بـ`metadata` للإضافات الخاصة بالقناة.
- `message_sending`: استخدم حقول التوجيه المنمّطة `replyToId` / `threadId` قبل الرجوع إلى `metadata` الخاصة بالقناة.
- `gateway_start`: استخدم `ctx.config` و`ctx.workspaceDir` و`ctx.getCron?.()` لحالة بدء التشغيل التي يملكها Gateway بدلًا من الاعتماد على خطافات `gateway:startup` الداخلية. قد يظل Cron قيد التحميل عند هذه النقطة.
- `cron_reconciled`: أعد بناء إسقاط Cron خارجي كامل بعد بدء التشغيل أو إعادة تحميل المجدول. يتضمن `reason` وحالة `enabled` الفعلية، بما في ذلك `enabled: false`، بينما يعيد `ctx.getCron?.()` المجدول المتصالح الدقيق. مرّر `ctx.abortSignal` إلى عمل الإسقاط الدائم؛ إذ يُجهض عندما تحل لقطة أحدث للمجدول محل تلك اللقطة أو عند إغلاق Gateway.
- `cron_changed`: راقب تغييرات دورة حياة Cron التي يملكها Gateway. أحداث `scheduled` و`removed` هي تلميحات تصالح بعد الاعتماد، وليست سجل فروق مرتبًا. يغيب `event.nextRunAtMs` في الحدث المجدول عندما لا تكون للمهمة عملية تنبيه تالية؛ ويظل الحدث المُزال يحمل لقطة المهمة المحذوفة.

ينبغي لمجدولات التنبيه الخارجية إزالة ارتداد أحداث `cron_changed` أو دمجها،
ثم إعادة قراءة العرض الدائم الكامل من المجدول الذي التقطه
`cron_reconciled` آخر مرة. لا تعتمد المجدول من سياق `cron_changed`: فقد
يتداخل تلميح منفصل من مجدول أقدم مع إعادة تحميل لاحقة.

استخدم `cron_reconciled` كمشغّل للقطة الكاملة للحالة الدائمة المحمّلة عند
بدء تشغيل Gateway أو استبدال المجدول. ولا يُعاد تشغيله عند إعادة تحميل ساخنة
خاصة بالـPlugin فقط. تعمل معالجات المراقبة بالتوازي، ويمكن أن تتداخل
عمليات الإرسال دون انتظار النتيجة، لذلك يجب ألا يعتمد المستهلكون على ترتيب
اكتمال الأحداث. أبقِ OpenClaw مصدر الحقيقة لعمليات التحقق من الاستحقاق والتنفيذ.

للاطلاع على محوّل أحادي التنفيذ يتضمن استبدالًا دائمًا، وإعادة المحاولة/التراجع،
وإيقاف تشغيل نظيف، راجع [إسقاط Cron خارجي آمن](/ar/plugins/hooks#safe-external-cron-projection).

### حقول كائن API

| الحقل                    | النوع                     | الوصف                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | معرّف الـPlugin                                                                             |
| `api.name`               | `string`                  | اسم العرض                                                                                   |
| `api.version`            | `string?`                 | إصدار الـPlugin (اختياري)                                                                   |
| `api.description`        | `string?`                 | وصف الـPlugin (اختياري)                                                                     |
| `api.source`             | `string`                  | مسار مصدر الـPlugin                                                                         |
| `api.rootDir`            | `string?`                 | الدليل الجذر للـPlugin (اختياري)                                                            |
| `api.config`             | `OpenClawConfig`          | لقطة الإعداد الحالية (لقطة وقت التشغيل النشطة في الذاكرة عند توفرها)                       |
| `api.pluginConfig`       | `Record<string, unknown>` | إعداد خاص بالـPlugin من `plugins.entries.<id>.config`                                       |
| `api.runtime`            | `PluginRuntime`           | [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime)                                                 |
| `api.logger`             | `PluginLogger`            | مسجّل محدود النطاق (`debug`، `info`، `warn`، `error`)                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | وضع التحميل الحالي؛ `"setup-runtime"` هو نافذة بدء التشغيل/الإعداد الخفيفة السابقة لتحميل نقطة الدخول الكاملة |
| `api.resolvePath(input)` | `(string) => string`      | حل المسار نسبةً إلى جذر الـPlugin                                                           |

## اصطلاح الوحدات الداخلية

داخل الـPlugin الخاص بك، استخدم ملفات التصدير التجميعية المحلية للاستيرادات الداخلية:

```text
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  لا تستورد الـPlugin الخاص بك مطلقًا عبر `openclaw/plugin-sdk/<your-plugin>`
  من شيفرة الإنتاج. وجّه الاستيرادات الداخلية عبر `./api.ts` أو
  `./runtime-api.ts`. مسار SDK هو العقد الخارجي فقط.
</Warning>

تفضّل الأسطح العامة للـPlugin المضمّن المحمّلة عبر الواجهة (`api.ts` و`runtime-api.ts`
و`index.ts` و`setup-entry.ts` وملفات الدخول العامة المشابهة) لقطة إعداد
وقت التشغيل النشطة عندما يكون OpenClaw قيد التشغيل بالفعل. وإذا لم توجد لقطة
لوقت التشغيل بعد، فإنها ترجع إلى ملف الإعداد المحلول على القرص.
ينبغي تحميل واجهات الـPlugin المضمّن المجمّعة عبر محمّلات واجهات الـPlugin
الخاصة بـOpenClaw؛ فالاستيرادات المباشرة من `dist/extensions/...` تتجاوز فحوصات
البيان والملف الجانبي لوقت التشغيل التي تستخدمها عمليات التثبيت المجمّعة للشيفرة
التي يملكها الـPlugin.

يمكن لـPlugins الموفّرين كشف ملف تجميعي لعقد محلي ضيق خاص بالـPlugin عندما يكون
المساعد خاصًا بالموفّر عمدًا ولا ينتمي بعد إلى مسار فرعي عام في SDK.
أمثلة مضمّنة:

- **Anthropic**: واجهة عامة عبر `api.ts` / `contract-api.ts` لمساعدات ترويسة
  Claude التجريبية وتدفق `service_tier`.
- **`@openclaw/openai-provider`**: يصدّر `api.ts` منشئات الموفّرين،
  ومساعدات النموذج الافتراضي، ومنشئات موفّري الوقت الحقيقي.
- **`@openclaw/openrouter-provider`**: يصدّر `api.ts` منشئ الموفّر
  إلى جانب مساعدات الإعداد الأولي/الإعداد.

<Warning>
  ينبغي أيضًا لشيفرة إنتاج الامتداد تجنب استيرادات `openclaw/plugin-sdk/<other-plugin>`.
  إذا كان المساعد مشتركًا حقًا، فانقله إلى مسار فرعي محايد في SDK
  مثل `openclaw/plugin-sdk/speech` أو `.../provider-model-shared` أو سطح آخر
  موجّه نحو القدرات بدلًا من ربط Pluginين معًا.
</Warning>

## ذو صلة

<CardGroup cols={2}>
  <Card title="نقاط الدخول" icon="door-open" href="/ar/plugins/sdk-entrypoints">
    خيارات `definePluginEntry` و`defineChannelPluginEntry`.
  </Card>
  <Card title="مساعدات وقت التشغيل" icon="gears" href="/ar/plugins/sdk-runtime">
    مرجع كامل لمساحة أسماء `api.runtime`.
  </Card>
  <Card title="الإعداد والتهيئة" icon="sliders" href="/ar/plugins/sdk-setup">
    التجميع والبيانات ومخططات الإعداد.
  </Card>
  <Card title="الاختبار" icon="vial" href="/ar/plugins/sdk-testing">
    أدوات الاختبار وقواعد التدقيق.
  </Card>
  <Card title="ترحيل SDK" icon="arrows-turn-right" href="/ar/plugins/sdk-migration">
    الترحيل من الأسطح المهملة.
  </Card>
  <Card title="البنية الداخلية للـPlugin" icon="diagram-project" href="/ar/plugins/architecture">
    البنية المتعمقة ونموذج القدرات.
  </Card>
</CardGroup>
