---
read_when:
    - تحتاج إلى معرفة مسار SDK الفرعي الذي يجب الاستيراد منه
    - تريد مرجعًا لجميع طرائق التسجيل في OpenClawPluginApi
    - تبحث عن تصدير محدد من SDK
sidebarTitle: Plugin SDK overview
summary: خريطة الاستيراد، ومرجع API للتسجيل، وبنية SDK
title: نظرة عامة على Plugin SDK
x-i18n:
    generated_at: "2026-06-27T18:17:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69321b569f7609c6ee9312f0234ce94f274bf03822df61988f34e1effb55339e
    source_path: plugins/sdk-overview.md
    workflow: 16
---

حزمة SDK الخاصة بـ Plugin هي العقد المطبوع بين Plugins والنواة. هذه الصفحة هي
المرجع لـ **ما يجب استيراده** و**ما يمكنك تسجيله**.

<Note>
  هذه الصفحة مخصصة لمؤلفي Plugin الذين يستخدمون `openclaw/plugin-sdk/*` داخل
  OpenClaw. بالنسبة للتطبيقات الخارجية والبرامج النصية ولوحات المعلومات ومهام CI وامتدادات IDE
  التي تريد تشغيل الوكلاء عبر Gateway، استخدم
  [تكاملات Gateway للتطبيقات الخارجية](/ar/gateway/external-apps) بدلا من ذلك.
</Note>

<Tip>
هل تبحث عن دليل عملي بدلا من ذلك؟ ابدأ بـ [بناء Plugins](/ar/plugins/building-plugins)، واستخدم [Channel plugins](/ar/plugins/sdk-channel-plugins) لـ channel plugins، و[Provider plugins](/ar/plugins/sdk-provider-plugins) لـ provider plugins، و[CLI backend plugins](/ar/plugins/cli-backend-plugins) لواجهات AI CLI الخلفية المحلية، و[Plugin hooks](/ar/plugins/hooks) لـ Plugins الخاصة بأدوات أو خطافات دورة الحياة.
</Tip>

## اصطلاح الاستيراد

استورد دائما من مسار فرعي محدد:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

كل مسار فرعي هو وحدة صغيرة قائمة بذاتها. يحافظ هذا على سرعة بدء التشغيل
ويمنع مشكلات الاعتماد الدائري. بالنسبة لمساعدات إدخال/بناء القنوات المحددة،
يفضل استخدام `openclaw/plugin-sdk/channel-core`؛ أبق `openclaw/plugin-sdk/core` من أجل
السطح الأوسع والمساعدات المشتركة مثل
`buildChannelConfigSchema`.

بالنسبة إلى إعدادات القناة، انشر JSON Schema المملوك للقناة عبر
`openclaw.plugin.json#channelConfigs`. المسار الفرعي `plugin-sdk/channel-config-schema`
مخصص لبدائيات المخطط المشتركة والباني العام. تستخدم Plugins المضمنة في OpenClaw
`plugin-sdk/bundled-channel-config-schema` للاحتفاظ بمخططات القنوات المضمنة. تبقى
صادرات توافقية مهملة على
`plugin-sdk/channel-config-schema-legacy`؛ ولا يعد أي من مساري المخططات المضمنة
نمطا لـ Plugins الجديدة.

<Warning>
  لا تستورد واجهات سهولة الاستخدام الموسومة بمزود أو قناة (على سبيل المثال
  `openclaw/plugin-sdk/slack`، أو `.../discord`، أو `.../signal`، أو `.../whatsapp`).
  تجمع Plugins المضمنة مسارات SDK الفرعية العامة داخل براميل `api.ts` /
  `runtime-api.ts` الخاصة بها؛ ويجب على مستهلكي النواة إما استخدام تلك البراميل المحلية للـ Plugin
  أو إضافة عقد SDK عام ضيق عندما تكون الحاجة عابرة للقنوات حقا.

لا تزال مجموعة صغيرة من واجهات المساعدة الخاصة بـ Plugins المضمنة تظهر في خريطة التصدير
المولدة عندما يكون لها استخدام مالك متتبع. وهي موجودة لصيانة Plugins المضمنة فقط
ولا يوصى بها كمسارات استيراد لـ Plugins الطرف الثالث الجديدة.

يتم الاحتفاظ أيضا بـ `openclaw/plugin-sdk/discord` و`openclaw/plugin-sdk/telegram-account`
كواجهات توافق مهملة لاستخدام المالك المتتبع. لا
تنسخ مسارات الاستيراد هذه إلى Plugins جديدة؛ استخدم مساعدات وقت التشغيل المحقونة
ومسارات SDK الفرعية العامة للقنوات بدلا من ذلك.
</Warning>

## مرجع المسارات الفرعية

تتعرض حزمة SDK الخاصة بـ Plugin كمجموعة من المسارات الفرعية الضيقة المجموعة حسب المجال (إدخال Plugin،
القناة، المزود، المصادقة، وقت التشغيل، القدرة، الذاكرة، ومساعدات Plugins المضمنة المحجوزة).
للاطلاع على الفهرس الكامل، مجمعا ومرتبطا، راجع
[المسارات الفرعية لحزمة SDK الخاصة بـ Plugin](/ar/plugins/sdk-subpaths).

يوجد مخزون نقاط دخول المترجم في
`scripts/lib/plugin-sdk-entrypoints.json`؛ ويتم توليد صادرات الحزمة من
المجموعة العامة الفرعية بعد طرح المسارات الفرعية المحلية للاختبارات/الداخلية في المستودع المدرجة في
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. شغل
`pnpm plugin-sdk:surface` لتدقيق عدد الصادرات العامة. يتم تتبع المسارات الفرعية العامة المهملة
القديمة بما يكفي وغير المستخدمة في كود الإنتاج للامتدادات المضمنة في
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`؛ ويتم تتبع
براميل إعادة التصدير المهملة الواسعة في
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API التسجيل

يتلقى رد النداء `register(api)` كائن `OpenClawPluginApi` بهذه
الطرق:

### تسجيل القدرات

| الطريقة                                          | ما تسجله                              |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | استدلال نصي (LLM)                     |
| `api.registerAgentHarness(...)`                  | منفذ وكيل منخفض المستوى تجريبي        |
| `api.registerCliBackend(...)`                    | واجهة استدلال CLI خلفية محلية         |
| `api.registerChannel(...)`                       | قناة مراسلة                           |
| `api.registerEmbeddingProvider(...)`             | مزود تضمين متجهي قابل لإعادة الاستخدام |
| `api.registerSpeechProvider(...)`                | تحويل نص إلى كلام / تركيب STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | نسخ فوري متدفق                        |
| `api.registerRealtimeVoiceProvider(...)`         | جلسات صوت فورية ثنائية الاتجاه        |
| `api.registerMediaUnderstandingProvider(...)`    | تحليل الصور/الصوت/الفيديو             |
| `api.registerImageGenerationProvider(...)`       | توليد الصور                           |
| `api.registerMusicGenerationProvider(...)`       | توليد الموسيقى                        |
| `api.registerVideoGenerationProvider(...)`       | توليد الفيديو                         |
| `api.registerWebFetchProvider(...)`              | مزود جلب / كشط ويب                    |
| `api.registerWebSearchProvider(...)`             | بحث ويب                               |

يجب أيضا إدراج مزودي التضمين المسجلين باستخدام `api.registerEmbeddingProvider(...)`
ضمن `contracts.embeddingProviders` في بيان Plugin. هذا
هو سطح التضمين العام لتوليد المتجهات القابل لإعادة الاستخدام. يمكن لبحث الذاكرة
استهلاك سطح المزود العام هذا. واجهة
`api.registerMemoryEmbeddingProvider(...)` الأقدم و
`contracts.memoryEmbeddingProviders` هي توافق مهمل بينما
ينتقل مزودو الذاكرة الحاليون المتخصصون.

مزودو الذاكرة المتخصصون الذين لا يزالون يعرضون `batchEmbed(...)` وقت التشغيل يبقون على
عقد التجميع الحالي لكل ملف ما لم يضبط وقت تشغيلهم صراحة
`sourceWideBatchEmbed: true`. يتيح هذا الاشتراك لمضيف الذاكرة إرسال أجزاء من
عدة ملفات ذاكرة متسخة ومصادر مفعلة في استدعاء `batchEmbed(...)` واحد حتى
حدود دفعة المضيف. يجب على محولات الدفعات التي ترفع ملفات طلب JSONL
تقسيم مهام المزود قبل حد حجم الرفع وكذلك حد عدد الطلبات.
يجب على المزود إرجاع تضمين واحد لكل جزء إدخال وبالترتيب نفسه مثل
`batch.chunks`؛ احذف العلم عندما يتوقع المزود دفعات محلية للملف أو
لا يستطيع الحفاظ على ترتيب الإدخال عبر مهمة أوسع على مستوى المصدر.

### الأدوات والأوامر

استخدم [`defineToolPlugin`](/ar/plugins/tool-plugins) لـ Plugins بسيطة خاصة بالأدوات فقط
بأسماء أدوات ثابتة. استخدم `api.registerTool(...)` مباشرة لـ Plugins المختلطة
أو تسجيل الأدوات الديناميكي بالكامل.

| الطريقة                         | ما تسجله                                      |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | أداة وكيل (مطلوبة أو `{ optional: true }`)   |
| `api.registerCommand(def)`      | أمر مخصص (يتجاوز LLM)                        |

يمكن لأوامر Plugin ضبط `agentPromptGuidance` عندما يحتاج الوكيل إلى تلميح توجيه قصير
مملوك للأمر. أبق ذلك النص حول الأمر نفسه؛ لا تضف
سياسة خاصة بمزود أو Plugin إلى بناة المطالبات في النواة.

قد تكون إدخالات الإرشاد سلاسل قديمة، تنطبق على كل سطح مطالبات، أو
إدخالات منظمة:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

قد تتضمن `surfaces` المنظمة `openclaw_main` أو `codex_app_server` أو
`cli_backend` أو `acp_backend` أو `subagent`. يبقى `pi_main` اسما مستعارا مهملا
لـ `openclaw_main`. احذف `surfaces` للإرشاد المقصود لكل الأسطح. لا
تمرر مصفوفة `surfaces` فارغة؛ يتم رفضها حتى لا يصبح فقدان النطاق العرضي
نص مطالبة عاما.

تعليمات المطور الأصلية لخادم تطبيق Codex أكثر صرامة من أسطح المطالبات الأخرى:
لا تتم ترقية سوى الإرشادات المحددة صراحة إلى `codex_app_server` إلى
ذلك المسار ذي الأولوية الأعلى. تبقى إرشادات السلاسل القديمة والإرشادات المنظمة غير محددة النطاق
متاحة لأسطح المطالبات غير الخاصة بـ Codex من أجل التوافق.

### البنية التحتية

| الطريقة                                        | ما تسجله                              |
| ---------------------------------------------- | ------------------------------------ |
| `api.registerHook(events, handler, opts?)`     | خطاف حدث                             |
| `api.registerHttpRoute(params)`                | نقطة نهاية HTTP في Gateway           |
| `api.registerGatewayMethod(name, handler)`     | طريقة RPC في Gateway                 |
| `api.registerGatewayDiscoveryService(service)` | معلن اكتشاف Gateway محلي             |
| `api.registerCli(registrar, opts?)`            | أمر CLI فرعي                         |
| `api.registerNodeCliFeature(registrar, opts?)` | ميزة Node CLI تحت `openclaw nodes`   |
| `api.registerService(service)`                 | خدمة خلفية                           |
| `api.registerInteractiveHandler(registration)` | معالج تفاعلي                         |
| `api.registerAgentToolResultMiddleware(...)`   | وسيط نتيجة أداة وقت التشغيل          |
| `api.registerMemoryPromptSupplement(builder)`  | قسم مطالبة إضافي مجاور للذاكرة       |
| `api.registerMemoryCorpusSupplement(adapter)`  | متن بحث/قراءة ذاكرة إضافي            |

### خطافات المضيف لـ Plugins سير العمل

خطافات المضيف هي واجهات SDK لـ Plugins التي تحتاج إلى المشاركة في دورة حياة المضيف
بدلا من مجرد إضافة مزود أو قناة أو أداة. إنها
عقود عامة؛ يمكن لـ Plan Mode استخدامها، وكذلك سير عمل الموافقة،
وبوابات سياسة مساحة العمل، والمراقبات الخلفية، ومعالجات الإعداد، وPlugins الواجهة
المصاحبة.

| الطريقة                                                                               | العقد الذي تملكه                                                                                                                  |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | حالة جلسة مملوكة لـ Plugin ومتوافقة مع JSON تُسقَط عبر جلسات Gateway                                                    |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | سياق دائم يُحقن مرة واحدة بالضبط في دورة الوكيل التالية لجلسة واحدة                                                    |
| `api.registerTrustedToolPolicy(...)`                                                 | سياسة أداة موثوقة قبل Plugin ومحكومة بالبيان يمكنها حظر معلمات الأداة أو إعادة كتابتها                                               |
| `api.registerToolMetadata(...)`                                                      | بيانات تعريف عرض كتالوج الأدوات من دون تغيير تنفيذ الأداة                                                            |
| `api.registerCommand(...)`                                                           | أوامر Plugin محددة النطاق؛ يمكن لنتائج الأوامر تعيين `continueAgent: true`؛ تدعم أوامر Discord الأصلية `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | واصفات مساهمة واجهة التحكم لأسطح الجلسة أو الأداة أو التشغيل أو الإعدادات                                                  |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | استدعاءات تنظيف لموارد وقت التشغيل المملوكة لـ Plugin في مسارات إعادة الضبط/الحذف/إعادة التحميل                                                 |
| `api.agent.events.registerAgentEventSubscription(...)`                               | اشتراكات أحداث منقحة لحالة سير العمل وأدوات المراقبة                                                                     |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | حالة مؤقتة لكل تشغيل تخص Plugin وتُمسح عند دورة حياة التشغيل الطرفية                                                                    |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | بيانات تعريف التنظيف لمهام الجدولة المملوكة لـ Plugin؛ لا تجدول عملاً ولا تنشئ سجلات مهام                                   |
| `api.session.workflow.sendSessionAttachment(...)`                                    | تسليم مرفقات ملفات بوساطة المضيف ومتاح للحزم المضمنة فقط إلى مسار الجلسة النشطة الصادرة مباشرة                                   |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | دورات جلسة مجدولة مدعومة بـ Cron ومتاحة للحزم المضمنة فقط، مع تنظيف قائم على الوسوم                                                           |
| `api.session.controls.registerSessionAction(...)`                                    | إجراءات جلسة نمطية يمكن للعملاء إرسالها عبر Gateway                                                                    |

استخدم مساحات الأسماء المجمعة في كود Plugin الجديد:

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

تظل الطرق المسطحة المكافئة متاحة كأسماء توافقية مستعارة مهملة
للـ plugins الحالية. لا تضف كود Plugin جديداً يستدعي
`api.registerSessionExtension` أو `api.enqueueNextTurnInjection` أو
`api.registerControlUiDescriptor` أو `api.registerRuntimeLifecycle` أو
`api.registerAgentEventSubscription` أو `api.emitAgentEvent` أو
`api.setRunContext` أو `api.getRunContext` أو `api.clearRunContext` أو
`api.registerSessionSchedulerJob` أو `api.registerSessionAction` أو
`api.sendSessionAttachment` أو `api.scheduleSessionTurn` أو
`api.unscheduleSessionTurnsByTag` مباشرة.

`scheduleSessionTurn(...)` هو تسهيل محدد بنطاق الجلسة فوق مجدول
Cron في Gateway. يمتلك Cron التوقيت وينشئ سجل المهمة الخلفية عند
تشغيل الدورة؛ أما Plugin SDK فيقيد فقط الجلسة المستهدفة، والتسمية
المملوكة لـ Plugin، والتنظيف. استخدم `api.runtime.tasks.managedFlows` داخل الدورة
المجدولة عندما يحتاج العمل نفسه إلى حالة Task Flow دائمة متعددة الخطوات.

تقسم العقود الصلاحيات عمداً:

- يمكن للـ plugins الخارجية امتلاك امتدادات الجلسة، وواصفات واجهة المستخدم، والأوامر، وبيانات تعريف
  الأدوات، وحقن الدورة التالية، والخطافات العادية.
- تعمل سياسات الأدوات الموثوقة قبل خطافات `before_tool_call` العادية وهي
  موثوقة من المضيف. تعمل السياسات المضمنة أولاً؛ وتتطلب سياسات الـ plugins المثبتة
  تمكيناً صريحاً إضافة إلى معرفاتها المحلية في
  `contracts.trustedToolPolicies`، وتعمل بعدها بترتيب تحميل الـ plugins. تكون معرفات السياسات
  محددة النطاق إلى الـ Plugin الذي سجلها.
- ملكية الأوامر المحجوزة مخصصة للحزم المضمنة فقط. ينبغي للـ plugins الخارجية استخدام
  أسماء أوامرها أو أسمائها المستعارة الخاصة.
- يعطل `allowPromptInjection=false` الخطافات التي تعدل الموجه، بما في ذلك
  `agent_turn_prepare` و`before_prompt_build` و`heartbeat_prompt_contribution`،
  وحقول الموجه من `before_agent_start` القديم، و
  `enqueueNextTurnInjection`.

أمثلة على مستهلكين غير متعلقين بالخطة:

| نموذج Plugin                  | الخطافات المستخدمة                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| سير عمل الموافقة            | امتداد جلسة، استمرار أمر، حقن الدورة التالية، واصف واجهة مستخدم                                                            |
| بوابة سياسة الميزانية/مساحة العمل | سياسة أداة موثوقة، بيانات تعريف الأداة، إسقاط الجلسة                                                                                 |
| مراقب دورة حياة خلفي | تنظيف دورة حياة وقت التشغيل، اشتراك حدث الوكيل، ملكية/تنظيف مجدول الجلسة، مساهمة موجه Heartbeat، واصف واجهة مستخدم |
| معالج إعداد أو تهيئة   | امتداد جلسة، أوامر محددة النطاق، واصف واجهة التحكم                                                                              |

<Note>
  تبقى مساحات أسماء الإدارة الأساسية المحجوزة (`config.*` و`exec.approvals.*` و`wizard.*`
  و`update.*`) دائماً `operator.admin`، حتى إذا حاول Plugin تعيين نطاق
  طريقة Gateway أضيق. فضّل البادئات الخاصة بالـ Plugin للطرق
  المملوكة له.
</Note>

<Accordion title="متى تستخدم وسيط نتائج الأدوات">
  يمكن للـ plugins المضمنة والـ plugins المثبتة الممكّنة صراحةً مع عقود
  بيان مطابقة استخدام `api.registerAgentToolResultMiddleware(...)` عندما
  تحتاج إلى إعادة كتابة نتيجة أداة بعد التنفيذ وقبل أن يعيد وقت التشغيل
  تغذية تلك النتيجة إلى النموذج. هذا هو السطح الموثوق والمحايد لوقت التشغيل
  لمخفضات المخرجات غير المتزامنة مثل tokenjuice.

يجب أن تعلن الـ Plugins عن `contracts.agentToolResultMiddleware` لكل وقت تشغيل
مستهدف، على سبيل المثال `["openclaw", "codex"]`. لا يمكن للـ plugins المثبتة التي لا تملك ذلك
العقد، أو من دون تمكين صريح، تسجيل هذا الوسيط؛ أبقِ
خطافات Plugin العادية في OpenClaw للأعمال التي لا تحتاج إلى توقيت نتيجة أداة
قبل النموذج. تمت إزالة مسار تسجيل مصنع الامتداد القديم
المخصص للمشغل المضمن فقط.
</Accordion>

### تسجيل اكتشاف Gateway

يتيح `api.registerGatewayDiscoveryService(...)` للـ Plugin الإعلان عن Gateway النشط
على نقل اكتشاف محلي مثل mDNS/Bonjour. يستدعي OpenClaw
الخدمة أثناء بدء Gateway عندما يكون الاكتشاف المحلي ممكناً، ويمرر
منافذ Gateway الحالية وبيانات تلميح TXT غير السرية، ويستدعي معالج
`stop` المُعاد أثناء إيقاف Gateway.

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

يجب ألا تتعامل plugins اكتشاف Gateway مع قيم TXT المُعلن عنها كأسرار أو
مصادقة. الاكتشاف تلميح توجيه؛ ولا تزال مصادقة Gateway وتثبيت TLS
يمتلكان الثقة.

### بيانات تعريف تسجيل CLI

يقبل `api.registerCli(registrar, opts?)` نوعين من بيانات تعريف الأوامر:

- `commands`: أسماء أوامر صريحة يملكها المسجل
- `descriptors`: واصفات أوامر وقت التحليل المستخدمة لمساعدة CLI،
  والتوجيه، وتسجيل CLI الكسول للـ Plugin
- `parentPath`: مسار أمر أب اختياري لمجموعات الأوامر المتداخلة، مثل
  `["nodes"]`

لميزات العقد المقترنة، فضّل
`api.registerNodeCliFeature(registrar, opts?)`. إنه غلاف صغير حول
`api.registerCli(..., { parentPath: ["nodes"] })` ويجعل أوامر مثل
`openclaw nodes canvas` ميزات عقدة صريحة مملوكة لـ Plugin.

إذا أردت أن يبقى أمر Plugin محملاً بكسل في مسار CLI الجذر العادي،
فوفّر `descriptors` تغطي كل جذر أمر من المستوى الأعلى يعرّضه ذلك
المسجل.

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

تتلقى الأوامر المتداخلة الأمر الأب المحلول باسم `program`:

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
يظل مسار التوافق الحريص هذا مدعوماً، لكنه لا يثبت عناصر نائبة
مدعومة بالواصفات للتحميل الكسول وقت التحليل.

### تسجيل خلفية CLI

يتيح `api.registerCliBackend(...)` للـ Plugin امتلاك الإعداد الافتراضي لخلفية
CLI محلية للذكاء الاصطناعي مثل `claude-cli` أو `my-cli`.

- يصبح `id` الخاص بالخلفية بادئة الموفر في مراجع النماذج مثل `my-cli/gpt-5`.
- يستخدم `config` الخاص بالخلفية الشكل نفسه مثل `agents.defaults.cliBackends.<id>`.
- يظل إعداد المستخدم هو الفائز. يدمج OpenClaw `agents.defaults.cliBackends.<id>` فوق
  الإعداد الافتراضي للـ Plugin قبل تشغيل CLI.
- استخدم `normalizeConfig` عندما تحتاج خلفية إلى إعادة كتابات توافق بعد الدمج
  (مثل تطبيع أشكال الأعلام القديمة).
- استخدم `resolveExecutionArgs` لإعادة كتابة argv محددة بنطاق الطلب وتنتمي إلى
  لهجة CLI، مثل تعيين مستويات التفكير في OpenClaw إلى علم جهد أصلي.
  يتلقى الخطاف `ctx.executionMode`؛ استخدم `"side-question"` لإضافة
  أعلام عزل أصلية للخلفية لاستدعاءات `/btw` المؤقتة. إذا كانت تلك الأعلام
  تعطل الأدوات الأصلية بشكل موثوق في CLI يعمل دائماً خلاف ذلك، فأعلن
  أيضاً `sideQuestionToolMode: "disabled"`.

للاطلاع على دليل تأليف شامل، راجع
[plugins خلفية CLI](/ar/plugins/cli-backend-plugins).

### الفتحات الحصرية

| الطريقة                                     | ما تسجّله                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | محرّك سياق (واحد نشط في كل مرة). تتلقى استدعاءات دورة الحياة `runtimeSettings` عندما يستطيع المضيف توفير تشخيصات النموذج/المزوّد/الوضع؛ وتُعاد محاولة تشغيل المحركات الصارمة الأقدم من دون هذا المفتاح. |
| `api.registerMemoryCapability(capability)` | قدرة ذاكرة موحّدة                                                                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | منشئ قسم موجّه الذاكرة                                                                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`    | محلّل خطة تفريغ الذاكرة                                                                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | محوّل تشغيل الذاكرة                                                                                                                                                                             |

### محوّلات تضمين الذاكرة المهملة

| الطريقة                                         | ما تسجّله                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | محوّل تضمين ذاكرة للـ Plugin النشط |

- `registerMemoryCapability` هي واجهة API الحصرية المفضّلة لإضافات الذاكرة.
- قد تكشف `registerMemoryCapability` أيضًا عن `publicArtifacts.listArtifacts(...)`
  بحيث يمكن للإضافات المصاحبة استهلاك عناصر الذاكرة المصدّرة عبر
  `openclaw/plugin-sdk/memory-host-core` بدلاً من الوصول إلى التخطيط الخاص
  لإضافة ذاكرة محددة.
- `registerMemoryPromptSection` و`registerMemoryFlushPlan` و
  `registerMemoryRuntime` هي واجهات API حصرية لإضافات الذاكرة ومتوافقة مع الأنظمة القديمة.
- يمكن لـ `MemoryFlushPlan.model` تثبيت دورة التفريغ على مرجع `provider/model`
  دقيق، مثل `ollama/qwen3:8b`، من دون وراثة سلسلة الاحتياط النشطة.
- `registerMemoryEmbeddingProvider` مهملة. ينبغي لمزوّدي التضمين الجدد
  استخدام `api.registerEmbeddingProvider(...)` و
  `contracts.embeddingProviders`.
- يواصل المزوّدون الحاليون الخاصون بالذاكرة العمل أثناء نافذة الترحيل،
  لكن تقارير فحص الإضافات تعدّ ذلك دين توافق للإضافات غير المضمّنة.

### الأحداث ودورة الحياة

| الطريقة                                       | ما تفعله                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | خطاف دورة حياة مكتوب الأنواع          |
| `api.onConversationBindingResolved(handler)` | استدعاء ربط المحادثة |

راجع [خطافات Plugin](/ar/plugins/hooks) للاطلاع على أمثلة، وأسماء الخطافات الشائعة، ودلالات الحراسة.

### دلالات قرار الخطاف

`before_install` هو خطاف دورة حياة لتشغيل Plugin، وليس سطح سياسة تثبيت المشغّل. استخدم `security.installPolicy` عندما يجب أن يغطي قرار السماح/الحظر مسارات التثبيت أو التحديث المدعومة من CLI وGateway.

- `before_tool_call`: إرجاع `{ block: true }` نهائي. بمجرد أن يضبطه أي معالج، تُتخطّى المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: إرجاع `{ block: false }` يُعامل على أنه بلا قرار (مثل حذف `block`)، وليس كتجاوز.
- `before_install`: إرجاع `{ block: true }` نهائي. بمجرد أن يضبطه أي معالج، تُتخطّى المعالجات ذات الأولوية الأدنى.
- `before_install`: إرجاع `{ block: false }` يُعامل على أنه بلا قرار (مثل حذف `block`)، وليس كتجاوز.
- `reply_dispatch`: إرجاع `{ handled: true, ... }` نهائي. بمجرد أن يطالب أي معالج بالإرسال، تُتخطّى المعالجات ذات الأولوية الأدنى ومسار إرسال النموذج الافتراضي.
- `message_sending`: إرجاع `{ cancel: true }` نهائي. بمجرد أن يضبطه أي معالج، تُتخطّى المعالجات ذات الأولوية الأدنى.
- `message_sending`: إرجاع `{ cancel: false }` يُعامل على أنه بلا قرار (مثل حذف `cancel`)، وليس كتجاوز.
- `message_received`: استخدم حقل `threadId` المكتوب الأنواع عندما تحتاج إلى توجيه سلسلة/موضوع وارد. احتفظ بـ `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: استخدم حقلي التوجيه المكتوبي الأنواع `replyToId` / `threadId` قبل الرجوع إلى `metadata` الخاصة بالقناة.
- `gateway_start`: استخدم `ctx.config` و`ctx.workspaceDir` و`ctx.getCron?.()` لحالة بدء التشغيل المملوكة لـ Gateway بدلاً من الاعتماد على خطافات `gateway:startup` الداخلية.
- `cron_changed`: راقب تغييرات دورة حياة Cron المملوكة لـ Gateway. استخدم `event.job?.state?.nextRunAtMs` و`ctx.getCron?.()` عند مزامنة مجدولات التنبيه الخارجية، وأبقِ OpenClaw مصدر الحقيقة لفحوص الاستحقاق والتنفيذ.

### حقول كائن API

| الحقل                    | النوع                      | الوصف                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | معرّف Plugin                                                                                   |
| `api.name`               | `string`                  | اسم العرض                                                                                |
| `api.version`            | `string?`                 | إصدار Plugin (اختياري)                                                                   |
| `api.description`        | `string?`                 | وصف Plugin (اختياري)                                                               |
| `api.source`             | `string`                  | مسار مصدر Plugin                                                                          |
| `api.rootDir`            | `string?`                 | دليل جذر Plugin (اختياري)                                                            |
| `api.config`             | `OpenClawConfig`          | لقطة الإعدادات الحالية (لقطة تشغيل داخل الذاكرة نشطة عند توفرها)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | إعدادات خاصة بالـ Plugin من `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [مساعدات التشغيل](/ar/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | مسجّل محدود النطاق (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | وضع التحميل الحالي؛ `"setup-runtime"` هي نافذة بدء التشغيل/الإعداد الخفيفة قبل الإدخال الكامل |
| `api.resolvePath(input)` | `(string) => string`      | حل المسار نسبةً إلى جذر Plugin                                                        |

## اصطلاح الوحدات الداخلية

داخل Plugin الخاص بك، استخدم ملفات تجميع محلية للاستيرادات الداخلية:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  لا تستورد Plugin الخاص بك أبدًا عبر `openclaw/plugin-sdk/<your-plugin>`
  من كود الإنتاج. وجّه الاستيرادات الداخلية عبر `./api.ts` أو
  `./runtime-api.ts`. مسار SDK هو العقد الخارجي فقط.
</Warning>

تفضّل الأسطح العامة للـ Plugin المضمّنة والمحمّلة عبر الواجهة (`api.ts` و`runtime-api.ts`
و`index.ts` و`setup-entry.ts` وملفات الإدخال العامة المشابهة)
لقطة إعدادات التشغيل النشطة عندما يكون OpenClaw قيد التشغيل بالفعل. إذا لم تكن هناك لقطة تشغيل
بعد، فإنها ترجع إلى ملف الإعدادات المحلول على القرص.
ينبغي تحميل واجهات Plugin المضمّنة والمعبأة عبر محمّلات واجهة Plugin في OpenClaw؛
فالاستيرادات المباشرة من `dist/extensions/...` تتجاوز بيان التعريف
وفحوصات الملفات الجانبية للتشغيل التي تستخدمها عمليات التثبيت المعبأة للكود المملوك للـ Plugin.

يمكن لإضافات المزوّدين كشف ملف تجميع عقد محلي ضيّق خاص بالـ Plugin عندما يكون
المساعد مخصصًا عمدًا للمزوّد ولا ينتمي بعد إلى مسار فرعي عام في SDK.
أمثلة مضمّنة:

- **Anthropic**: سطح عام `api.ts` / `contract-api.ts` لمساعدات تدفق Claude
  beta-header و`service_tier`.
- **`@openclaw/openai-provider`**: يصدّر `api.ts` منشئي المزوّدين،
  ومساعدات النموذج الافتراضي، ومنشئي مزوّد الوقت الحقيقي.
- **`@openclaw/openrouter-provider`**: يصدّر `api.ts` منشئ المزوّد
  بالإضافة إلى مساعدات الإعداد/التكوين.

<Warning>
  ينبغي لكود إنتاج الإضافات أيضًا تجنّب استيرادات `openclaw/plugin-sdk/<other-plugin>`.
  إذا كان المساعد مشتركًا حقًا، فارفعه إلى مسار فرعي محايد في SDK
  مثل `openclaw/plugin-sdk/speech` أو `.../provider-model-shared` أو سطح آخر
  موجّه نحو القدرات بدلاً من ربط إضافتين معًا.
</Warning>

## ذو صلة

<CardGroup cols={2}>
  <Card title="نقاط الإدخال" icon="door-open" href="/ar/plugins/sdk-entrypoints">
    خيارات `definePluginEntry` و`defineChannelPluginEntry`.
  </Card>
  <Card title="مساعدات التشغيل" icon="gears" href="/ar/plugins/sdk-runtime">
    مرجع مساحة الأسماء الكامل `api.runtime`.
  </Card>
  <Card title="الإعداد والتكوين" icon="sliders" href="/ar/plugins/sdk-setup">
    التحزيم، وبيانات التعريف، ومخططات التكوين.
  </Card>
  <Card title="الاختبار" icon="vial" href="/ar/plugins/sdk-testing">
    أدوات الاختبار وقواعد الفحص.
  </Card>
  <Card title="ترحيل SDK" icon="arrows-turn-right" href="/ar/plugins/sdk-migration">
    الترحيل من الأسطح المهملة.
  </Card>
  <Card title="داخليات Plugin" icon="diagram-project" href="/ar/plugins/architecture">
    البنية العميقة ونموذج القدرات.
  </Card>
</CardGroup>
