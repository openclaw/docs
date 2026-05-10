---
read_when:
    - تحتاج إلى معرفة المسار الفرعي لـ SDK الذي يجب الاستيراد منه
    - تريد مرجعًا لجميع طرق التسجيل الخاصة بـ OpenClawPluginApi
    - أنت تبحث عن تصدير محدد من حزمة تطوير البرمجيات
sidebarTitle: Plugin SDK overview
summary: خريطة الاستيراد، ومرجع واجهة برمجة تطبيقات التسجيل، ومعمارية مجموعة تطوير البرمجيات
title: نظرة عامة على Plugin SDK
x-i18n:
    generated_at: "2026-05-10T19:54:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ca09b142accc03d8ae897c5da62eab6c25793354e0175742ce1a63d700e64dd
    source_path: plugins/sdk-overview.md
    workflow: 16
---

‏SDK الخاص بالـ Plugin هو العقد المطبوع بين plugins والنواة. هذه الصفحة هي
المرجع لـ **ما يجب استيراده** و**ما يمكنك تسجيله**.

<Note>
  هذه الصفحة مخصصة لمؤلفي plugins الذين يستخدمون `openclaw/plugin-sdk/*` داخل
  OpenClaw. بالنسبة إلى التطبيقات الخارجية، والسكريبتات، ولوحات المعلومات، ومهام CI، وامتدادات IDE
  التي تريد تشغيل الوكلاء عبر Gateway، استخدم
  [OpenClaw App SDK](/ar/concepts/openclaw-sdk) وحزمة `@openclaw/sdk`
  بدلا من ذلك.
</Note>

<Tip>
هل تبحث عن دليل إرشادي بدلا من ذلك؟ ابدأ بـ [بناء plugins](/ar/plugins/building-plugins)، واستخدم [Channel plugins](/ar/plugins/sdk-channel-plugins) لـ channel plugins، و[Provider plugins](/ar/plugins/sdk-provider-plugins) لـ provider plugins، و[CLI backend plugins](/ar/plugins/cli-backend-plugins) لخلفيات CLI المحلية للذكاء الاصطناعي، و[Plugin hooks](/ar/plugins/hooks) لـ plugins الخاصة بأدوات أو خطافات دورة الحياة.
</Tip>

## اصطلاح الاستيراد

استورد دائما من مسار فرعي محدد:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

كل مسار فرعي هو وحدة صغيرة مستقلة بذاتها. يحافظ هذا على سرعة بدء التشغيل
ويمنع مشكلات الاعتماد الدائري. بالنسبة إلى مساعدات الإدخال/البناء الخاصة بالقنوات،
فضّل `openclaw/plugin-sdk/channel-core`؛ واحتفظ بـ `openclaw/plugin-sdk/core`
للسطح الشامل الأوسع والمساعدات المشتركة مثل
`buildChannelConfigSchema`.

بالنسبة إلى إعدادات القنوات، انشر JSON Schema المملوكة للقناة عبر
`openclaw.plugin.json#channelConfigs`. المسار الفرعي `plugin-sdk/channel-config-schema`
مخصص لبدائيات المخطط المشتركة والباني العام. تستخدم plugins المضمنة في OpenClaw
`plugin-sdk/bundled-channel-config-schema` للاحتفاظ بمخططات القنوات المضمنة.
تبقى صادرات التوافق المهملة على
`plugin-sdk/channel-config-schema-legacy`؛ ولا يعد أي من مساري مخططات القنوات المضمنة
نمطا لـ plugins الجديدة.

<Warning>
  لا تستورد واجهات الراحة الموسومة باسم موفر أو قناة (على سبيل المثال
  `openclaw/plugin-sdk/slack`، أو `.../discord`، أو `.../signal`، أو `.../whatsapp`).
  تجمع plugins المضمنة مسارات SDK الفرعية العامة داخل حاويات `api.ts` /
  `runtime-api.ts` الخاصة بها؛ وينبغي لمستهلكي النواة إما استخدام تلك الحاويات المحلية للـ plugin
  أو إضافة عقد SDK عام ضيق عندما تكون الحاجة عابرة للقنوات حقا.

تظل مجموعة صغيرة من واجهات مساعدات plugins المضمنة ظاهرة في خريطة التصدير المولدة
عندما يكون لها استخدام مالك متتبع. وهي موجودة فقط لصيانة plugins المضمنة
ولا يوصى بها كمسارات استيراد لـ plugins خارجية جديدة.

يظل `openclaw/plugin-sdk/discord` و`openclaw/plugin-sdk/telegram-account`
أيضا كواجهات توافق مهملة لاستخدام مالك متتبع. لا تنسخ مسارات الاستيراد هذه
إلى plugins جديدة؛ استخدم مساعدات وقت التشغيل المحقونة
ومسارات SDK العامة الخاصة بالقنوات بدلا من ذلك.
</Warning>

## مرجع المسارات الفرعية

يتاح SDK الخاص بالـ Plugin كمجموعة من المسارات الفرعية الضيقة المجمعة حسب المجال (إدخال plugin،
والقناة، والموفر، والمصادقة، ووقت التشغيل، والقدرة، والذاكرة، ومساعدات plugins المضمنة
المحجوزة). للاطلاع على الفهرس الكامل، مجمعا ومرتبطا، راجع
[المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths).

توجد قائمة مخزون نقاط إدخال المترجم في
`scripts/lib/plugin-sdk-entrypoints.json`؛ ويتم توليد صادرات الحزمة من
المجموعة العامة بعد طرح المسارات الفرعية المحلية للاختبارات/الداخلية في المستودع المدرجة في
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. شغّل
`pnpm plugin-sdk:surface` لتدقيق عدد الصادرات العامة. يتم تتبع المسارات الفرعية العامة
المهملة القديمة بما يكفي وغير المستخدمة من قبل كود الإنتاج للامتدادات المضمنة في
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`؛ ويتم تتبع
حاويات إعادة التصدير المهملة الواسعة في
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API التسجيل

تتلقى دالة الاستدعاء `register(api)` كائنا من نوع `OpenClawPluginApi` يحتوي على هذه
الأساليب:

### تسجيل القدرات

| الأسلوب                                           | ما يسجله                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | استدلال نصي (LLM)                  |
| `api.registerAgentHarness(...)`                  | منفذ وكيل منخفض المستوى تجريبي |
| `api.registerCliBackend(...)`                    | خلفية استدلال CLI محلية           |
| `api.registerChannel(...)`                       | قناة مراسلة                     |
| `api.registerSpeechProvider(...)`                | تحويل النص إلى كلام / تركيب STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | نسخ آني متدفق      |
| `api.registerRealtimeVoiceProvider(...)`         | جلسات صوت آنية ثنائية الاتجاه        |
| `api.registerMediaUnderstandingProvider(...)`    | تحليل الصور/الصوت/الفيديو            |
| `api.registerImageGenerationProvider(...)`       | توليد الصور                      |
| `api.registerMusicGenerationProvider(...)`       | توليد الموسيقى                      |
| `api.registerVideoGenerationProvider(...)`       | توليد الفيديو                      |
| `api.registerWebFetchProvider(...)`              | موفر جلب الويب / استخلاصه           |
| `api.registerWebSearchProvider(...)`             | بحث الويب                            |

### الأدوات والأوامر

| الأسلوب                          | ما يسجله                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | أداة وكيل (مطلوبة أو `{ optional: true }`) |
| `api.registerCommand(def)`      | أمر مخصص (يتجاوز LLM)             |

يمكن لأوامر Plugin تعيين `agentPromptGuidance` عندما يحتاج الوكيل إلى تلميح توجيه
قصير مملوك للأمر. أبق هذا النص متعلقا بالأمر نفسه؛ ولا تضف
سياسة خاصة بموفر أو plugin إلى بُناة مطالبات النواة.

### البنية التحتية

| الأسلوب                                         | ما يسجله                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | خطاف حدث                              |
| `api.registerHttpRoute(params)`                | نقطة نهاية HTTP في Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | أسلوب RPC في Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | معلن اكتشاف Gateway محلي      |
| `api.registerCli(registrar, opts?)`            | أمر فرعي لـ CLI                          |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI لميزة Node ضمن `openclaw nodes` |
| `api.registerService(service)`                 | خدمة خلفية                      |
| `api.registerInteractiveHandler(registration)` | معالج تفاعلي                     |
| `api.registerAgentToolResultMiddleware(...)`   | وسيط نتائج أدوات وقت التشغيل          |
| `api.registerMemoryPromptSupplement(builder)`  | قسم مضاف للمطالبة مجاور للذاكرة |
| `api.registerMemoryCorpusSupplement(adapter)`  | مجموعة مضافة للبحث/القراءة في الذاكرة      |

### خطافات المضيف لـ workflow plugins

خطافات المضيف هي واجهات SDK لـ plugins التي تحتاج إلى المشاركة في دورة حياة المضيف
بدلا من مجرد إضافة موفر أو قناة أو أداة. إنها
عقود عامة؛ يمكن لـ Plan Mode استخدامها، وكذلك يمكن لسير عمل الموافقة،
وبوابات سياسة مساحة العمل، والمراقبات الخلفية، ومعالجات الإعداد، وplugins الرفيقة للواجهة
استخدامها.

| الأسلوب                                                                   | العقد الذي يملكه                                                                                                                  |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | حالة جلسة متوافقة مع JSON ومملوكة للـ plugin يتم إسقاطها عبر جلسات Gateway                                                    |
| `api.enqueueNextTurnInjection(...)`                                      | سياق دائم بالضبط مرة واحدة يتم حقنه في دورة الوكيل التالية لجلسة واحدة                                                    |
| `api.registerTrustedToolPolicy(...)`                                     | سياسة أدوات قبلية للـ plugin مضمّنة/موثوقة يمكنها حظر معاملات الأداة أو إعادة كتابتها                                                      |
| `api.registerToolMetadata(...)`                                          | بيانات وصف عرض كتالوج الأدوات دون تغيير تنفيذ الأداة                                                            |
| `api.registerCommand(...)`                                               | أوامر plugin محددة النطاق؛ يمكن لنتائج الأمر تعيين `continueAgent: true`؛ تدعم أوامر Discord الأصلية `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | واصفات مساهمات Control UI لأسطح الجلسة أو الأداة أو التشغيل أو الإعدادات                                                  |
| `api.registerRuntimeLifecycle(...)`                                      | استدعاءات تنظيف لموارد وقت التشغيل المملوكة للـ plugin في مسارات إعادة الضبط/الحذف/إعادة التحميل                                                 |
| `api.registerAgentEventSubscription(...)`                                | اشتراكات أحداث منقحة لحالة workflow والمراقبات                                                                     |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | حالة مؤقتة لكل تشغيل خاصة بالـ plugin يتم مسحها عند انتهاء دورة حياة التشغيل                                                                    |
| `api.registerSessionSchedulerJob(...)`                                   | سجلات مهام مجدول الجلسات المملوكة للـ plugin مع تنظيف حتمي                                                             |

تقسم العقود الصلاحية عمدا:

- يمكن لـ plugins الخارجية امتلاك امتدادات الجلسة، وواصفات UI، والأوامر، وبيانات تعريف الأدوات،
  وحقن الدورة التالية، والخطافات العادية.
- تعمل سياسات الأدوات الموثوقة قبل خطافات `before_tool_call` العادية وهي
  مخصصة للمضمن فقط لأنها تشارك في سياسة أمان المضيف.
- ملكية الأوامر المحجوزة مخصصة للمضمن فقط. ينبغي لـ plugins الخارجية استخدام
  أسماء أوامرها أو أسمائها المستعارة الخاصة بها.
- يعطل `allowPromptInjection=false` الخطافات التي تغير المطالبات بما في ذلك
  `agent_turn_prepare`، و`before_prompt_build`، و`heartbeat_prompt_contribution`،
  وحقول المطالبات من `before_agent_start` القديم، و
  `enqueueNextTurnInjection`.

أمثلة على مستهلكين غير Plan:

| نمط plugin             | الخطافات المستخدمة                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| workflow الموافقة            | امتداد جلسة، استمرار أمر، حقن الدورة التالية، واصف UI                                                            |
| بوابة سياسة الميزانية/مساحة العمل | سياسة أداة موثوقة، بيانات تعريف الأداة، إسقاط الجلسة                                                                                 |
| مراقب دورة حياة خلفي | تنظيف دورة حياة وقت التشغيل، اشتراك أحداث الوكيل، ملكية/تنظيف مجدول الجلسات، مساهمة مطالبة Heartbeat، واصف UI |
| معالج إعداد أو تهيئة   | امتداد جلسة، أوامر محددة النطاق، واصف Control UI                                                                              |

<Note>
  تبقى نطاقات إدارة النواة المحجوزة (`config.*`، و`exec.approvals.*`، و`wizard.*`،
  و`update.*`) دائما `operator.admin`، حتى إذا حاول plugin تعيين
  نطاق أسلوب Gateway أضيق. فضّل البادئات الخاصة بالـ plugin
  للأساليب المملوكة للـ plugin.
</Note>

<Accordion title="متى تستخدم وسيط نتائج الأدوات">
  يمكن للـ plugins المضمّنة استخدام `api.registerAgentToolResultMiddleware(...)` عندما
  تحتاج إلى إعادة كتابة نتيجة أداة بعد التنفيذ وقبل أن يمرّر وقت التشغيل
  تلك النتيجة مرة أخرى إلى النموذج. هذه هي واجهة الربط الموثوقة والمحايدة تجاه وقت التشغيل
  لمخفضات المخرجات غير المتزامنة مثل tokenjuice.

يجب أن تصرّح الـ plugins المضمّنة بـ `contracts.agentToolResultMiddleware` لكل
وقت تشغيل مستهدف، على سبيل المثال `["pi", "codex"]`. لا يمكن للـ plugins الخارجية
تسجيل هذا الوسيط؛ أبقِ خطافات OpenClaw Plugin العادية للعمل
الذي لا يحتاج إلى توقيت نتيجة الأداة قبل النموذج. تمت إزالة مسار تسجيل
مصنع الامتداد المضمّن القديم الخاص بـ Pi فقط.
</Accordion>

### تسجيل اكتشاف Gateway

تتيح `api.registerGatewayDiscoveryService(...)` لـ Plugin الإعلان عن Gateway النشط
على وسيلة نقل اكتشاف محلية مثل mDNS/Bonjour. يستدعي OpenClaw
الخدمة أثناء بدء تشغيل Gateway عندما يكون الاكتشاف المحلي مفعّلاً، ويمرّر
منافذ Gateway الحالية وبيانات تلميح TXT غير السرية، ويستدعي
معالج `stop` المُعاد أثناء إيقاف تشغيل Gateway.

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

يجب ألا تتعامل Plugins اكتشاف Gateway مع قيم TXT المُعلنة على أنها أسرار أو
مصادقة. الاكتشاف تلميح توجيه؛ ولا تزال مصادقة Gateway وتثبيت TLS
مسؤولين عن الثقة.

### بيانات وصف تسجيل CLI

تقبل `api.registerCli(registrar, opts?)` نوعين من بيانات وصف الأوامر:

- `commands`: أسماء أوامر صريحة يملكها المسجّل
- `descriptors`: واصفات أوامر وقت التحليل المستخدمة لمساعدة CLI،
  والتوجيه، وتسجيل CLI الكسول الخاص بـ Plugin
- `parentPath`: مسار أمر أصل اختياري لمجموعات الأوامر المتداخلة، مثل
  `["nodes"]`

بالنسبة إلى ميزات العُقد المقترنة، فضّل
`api.registerNodeCliFeature(registrar, opts?)`. وهو غلاف صغير حول
`api.registerCli(..., { parentPath: ["nodes"] })` ويجعل أوامر مثل
`openclaw nodes canvas` ميزات عُقد صريحة يملكها Plugin.

إذا أردت أن يبقى أمر Plugin محمّلاً كسولاً في مسار CLI الجذري العادي،
فوفّر `descriptors` تغطي كل جذر أمر من المستوى الأعلى يعرّضه ذلك
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

تتلقى الأوامر المتداخلة الأمر الأصل المحلول باسم `program`:

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

استخدم `commands` بمفرده فقط عندما لا تحتاج إلى تسجيل CLI جذري كسول.
يبقى مسار التوافق الشره هذا مدعوماً، لكنه لا يثبّت
عناصر نائبة مدعومة بواصفات للتحميل الكسول وقت التحليل.

### تسجيل واجهة CLI الخلفية

تتيح `api.registerCliBackend(...)` لـ Plugin امتلاك الإعداد الافتراضي لواجهة
AI CLI خلفية محلية مثل `codex-cli`.

- يصبح `id` الخاص بالواجهة الخلفية بادئة المزوّد في مراجع النماذج مثل `codex-cli/gpt-5`.
- يستخدم `config` الخاص بالواجهة الخلفية الشكل نفسه مثل `agents.defaults.cliBackends.<id>`.
- تبقى إعدادات المستخدم هي الغالبة. يدمج OpenClaw `agents.defaults.cliBackends.<id>` فوق
  الافتراضي الخاص بـ Plugin قبل تشغيل CLI.
- استخدم `normalizeConfig` عندما تحتاج واجهة خلفية إلى إعادة كتابة توافقية بعد الدمج
  (على سبيل المثال، تطبيع أشكال الأعلام القديمة).
- استخدم `resolveExecutionArgs` لإعادة كتابة argv ضمن نطاق الطلب عندما تكون تابعة
  للهجة CLI، مثل ربط مستويات التفكير في OpenClaw بعلم جهد أصلي.

للحصول على دليل تأليف شامل، راجع
[Plugins واجهة CLI الخلفية](/ar/plugins/cli-backend-plugins).

### الخانات الحصرية

| الطريقة                                     | ما تسجّله                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | محرك السياق (واحد نشط في كل مرة). تتلقى معاودة النداء `assemble()` القيمتين `availableTools` و `citationsMode` كي يتمكن المحرك من تخصيص إضافات المطالبة. |
| `api.registerMemoryCapability(capability)` | قدرة ذاكرة موحدة                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | باني قسم مطالبة الذاكرة                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | محلّل خطة تفريغ الذاكرة                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | مهايئ وقت تشغيل الذاكرة                                                                                                                                    |

### مهايئات تضمين الذاكرة

| الطريقة                                         | ما تسجّله                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | مهايئ تضمين الذاكرة للـ Plugin النشط |

- `registerMemoryCapability` هي API الذاكرة الحصرية المفضلة الخاصة بـ Plugin.
- قد تعرّض `registerMemoryCapability` أيضاً `publicArtifacts.listArtifacts(...)`
  حتى تتمكن الـ plugins المصاحبة من استهلاك مصنوعات الذاكرة المصدّرة عبر
  `openclaw/plugin-sdk/memory-host-core` بدلاً من الوصول إلى التخطيط الخاص
  لـ Plugin ذاكرة محدد.
- `registerMemoryPromptSection` و `registerMemoryFlushPlan` و
  `registerMemoryRuntime` هي APIs ذاكرة حصرية متوافقة مع القديم خاصة بـ Plugin.
- يمكن لـ `MemoryFlushPlan.model` تثبيت دورة التفريغ على مرجع `provider/model`
  دقيق، مثل `ollama/qwen3:8b`، دون وراثة سلسلة الرجوع الاحتياطي النشطة.
- تتيح `registerMemoryEmbeddingProvider` لـ Plugin الذاكرة النشط تسجيل
  معرّف مهايئ تضمين واحد أو أكثر (على سبيل المثال `openai` أو `gemini` أو معرّف
  مخصص يعرّفه Plugin).
- تُحل إعدادات المستخدم مثل `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` مقابل معرّفات المهايئات المسجلة هذه.

### الأحداث ودورة الحياة

| الطريقة                                       | ما تفعله                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | خطاف دورة حياة نمطي          |
| `api.onConversationBindingResolved(handler)` | معاودة نداء ربط المحادثة |

راجع [خطافات Plugin](/ar/plugins/hooks) للأمثلة، وأسماء الخطافات الشائعة، ودلالات الحراسة.

### دلالات قرار الخطاف

- `before_tool_call`: إرجاع `{ block: true }` نهائي. بمجرد أن يعيّنه أي معالج، تُتخطى المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: يُعامل إرجاع `{ block: false }` على أنه لا قرار (مثل حذف `block`)، وليس كتجاوز.
- `before_install`: إرجاع `{ block: true }` نهائي. بمجرد أن يعيّنه أي معالج، تُتخطى المعالجات ذات الأولوية الأدنى.
- `before_install`: يُعامل إرجاع `{ block: false }` على أنه لا قرار (مثل حذف `block`)، وليس كتجاوز.
- `reply_dispatch`: إرجاع `{ handled: true, ... }` نهائي. بمجرد أن يطالب أي معالج بالإرسال، تُتخطى المعالجات ذات الأولوية الأدنى ومسار إرسال النموذج الافتراضي.
- `message_sending`: إرجاع `{ cancel: true }` نهائي. بمجرد أن يعيّنه أي معالج، تُتخطى المعالجات ذات الأولوية الأدنى.
- `message_sending`: يُعامل إرجاع `{ cancel: false }` على أنه لا قرار (مثل حذف `cancel`)، وليس كتجاوز.
- `message_received`: استخدم حقل `threadId` النمطي عندما تحتاج إلى توجيه سلسلة/موضوع وارد. أبقِ `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: استخدم حقول توجيه `replyToId` / `threadId` النمطية قبل الرجوع إلى `metadata` الخاصة بالقناة.
- `gateway_start`: استخدم `ctx.config` و `ctx.workspaceDir` و `ctx.getCron?.()` لحالة بدء التشغيل التي يملكها Gateway بدلاً من الاعتماد على خطافات `gateway:startup` الداخلية.
- `cron_changed`: راقب تغييرات دورة حياة Cron التي يملكها Gateway. استخدم `event.job?.state?.nextRunAtMs` و `ctx.getCron?.()` عند مزامنة مجدولات الإيقاظ الخارجية، وأبقِ OpenClaw مصدر الحقيقة لفحوص الاستحقاق والتنفيذ.

### حقول كائن API

| الحقل                    | النوع                      | الوصف                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | معرّف Plugin                                                                                   |
| `api.name`               | `string`                  | اسم العرض                                                                                |
| `api.version`            | `string?`                 | إصدار Plugin (اختياري)                                                                   |
| `api.description`        | `string?`                 | وصف Plugin (اختياري)                                                               |
| `api.source`             | `string`                  | مسار مصدر Plugin                                                                          |
| `api.rootDir`            | `string?`                 | دليل جذر Plugin (اختياري)                                                            |
| `api.config`             | `OpenClawConfig`          | لقطة الإعدادات الحالية (لقطة وقت التشغيل النشطة في الذاكرة عند توفرها)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | إعدادات خاصة بـ Plugin من `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | مسجّل محدود النطاق (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | وضع التحميل الحالي؛ `"setup-runtime"` هي نافذة بدء التشغيل/الإعداد الخفيفة قبل الدخول الكامل |
| `api.resolvePath(input)` | `(string) => string`      | حل المسار نسبةً إلى جذر Plugin                                                        |

## اصطلاح الوحدة الداخلية

داخل Plugin الخاص بك، استخدم ملفات barrel محلية للاستيرادات الداخلية:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  لا تستورد أبداً Plugin الخاص بك عبر `openclaw/plugin-sdk/<your-plugin>`
  من كود الإنتاج. وجّه الاستيرادات الداخلية عبر `./api.ts` أو
  `./runtime-api.ts`. مسار SDK هو العقد الخارجي فقط.
</Warning>

تفضّل الواجهات العامة للـ Plugin المضمّنة المحمّلة عبر الواجهة (`api.ts` و`runtime-api.ts`
و`index.ts` و`setup-entry.ts` وملفات الإدخال العامة المشابهة) لقطة
إعدادات وقت التشغيل النشطة عندما يكون OpenClaw قيد التشغيل بالفعل. إذا لم تكن هناك لقطة
لوقت التشغيل بعد، فإنها تعود إلى ملف الإعدادات المحلول على القرص.
ينبغي تحميل واجهات الـ Plugin المضمّنة المعبأة عبر محمّلات واجهات الـ Plugin في OpenClaw؛
فالاستيرادات المباشرة من `dist/extensions/...` تتجاوز فحوصات البيان
والملحق الجانبي لوقت التشغيل التي تستخدمها التثبيتات المعبأة للشيفرة المملوكة للـ Plugin.

يمكن لـ Plugins المزوّدين كشف حزمة عقد محلية ضيقة خاصة بالـ Plugin عندما يكون
المساعد مقصودًا أن يكون خاصًا بالمزوّد ولا ينتمي بعد إلى مسار فرعي عام في SDK.
أمثلة مضمّنة:

- **Anthropic**: واجهة `api.ts` / `contract-api.ts` عامة لمساعدات Claude
  الخاصة بترويسة beta و`service_tier` للبث.
- **`@openclaw/openai-provider`**: يصدّر `api.ts` بناة المزوّد،
  ومساعدات النموذج الافتراضي، وبناة مزوّد الوقت الفعلي.
- **`@openclaw/openrouter-provider`**: يصدّر `api.ts` باني المزوّد
  بالإضافة إلى مساعدات الإعداد الأولي/الإعدادات.

<Warning>
  ينبغي أيضًا أن تتجنب شيفرة الإنتاج الخاصة بالامتداد استيرادات `openclaw/plugin-sdk/<other-plugin>`.
  إذا كان المساعد مشتركًا حقًا، فارفعه إلى مسار فرعي محايد في SDK
  مثل `openclaw/plugin-sdk/speech` أو `.../provider-model-shared` أو سطح آخر
  موجّه إلى الإمكانات بدلًا من ربط Pluginين معًا.
</Warning>

## ذات صلة

<CardGroup cols={2}>
  <Card title="نقاط الإدخال" icon="door-open" href="/ar/plugins/sdk-entrypoints">
    خيارات `definePluginEntry` و`defineChannelPluginEntry`.
  </Card>
  <Card title="مساعدات وقت التشغيل" icon="gears" href="/ar/plugins/sdk-runtime">
    مرجع مساحة الأسماء `api.runtime` الكامل.
  </Card>
  <Card title="الإعداد والتكوين" icon="sliders" href="/ar/plugins/sdk-setup">
    التعبئة، والبيانات، ومخططات الإعدادات.
  </Card>
  <Card title="الاختبار" icon="vial" href="/ar/plugins/sdk-testing">
    أدوات الاختبار وقواعد الفحص.
  </Card>
  <Card title="ترحيل SDK" icon="arrows-turn-right" href="/ar/plugins/sdk-migration">
    الترحيل من الأسطح المهملة.
  </Card>
  <Card title="داخليات الـ Plugin" icon="diagram-project" href="/ar/plugins/architecture">
    البنية العميقة ونموذج الإمكانات.
  </Card>
</CardGroup>
