---
read_when:
    - تحتاج إلى معرفة مسار SDK الفرعي الذي يجب الاستيراد منه
    - تريد مرجعًا لجميع طرق التسجيل في OpenClawPluginApi
    - أنت تبحث عن تصدير محدد من SDK
sidebarTitle: Plugin SDK overview
summary: خريطة الاستيراد، ومرجع واجهة برمجة تطبيقات التسجيل، ومعمارية حزمة تطوير البرمجيات
title: نظرة عامة على Plugin SDK
x-i18n:
    generated_at: "2026-05-07T13:26:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce2d4480368a11f559da7c5116d51c0cd603dd38985ca744723ecdf134fa21f3
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK هو العقد المطبوع بين plugins والنواة. هذه الصفحة هي
المرجع لـ **ما يجب استيراده** و **ما يمكنك تسجيله**.

<Note>
  هذه الصفحة مخصصة لمؤلفي plugins الذين يستخدمون `openclaw/plugin-sdk/*` داخل
  OpenClaw. بالنسبة إلى التطبيقات الخارجية والسكربتات ولوحات المعلومات ومهام CI وامتدادات IDE
  التي تريد تشغيل الوكلاء عبر Gateway، استخدم
  [OpenClaw App SDK](/ar/concepts/openclaw-sdk) وحزمة `@openclaw/sdk`
  بدلا من ذلك.
</Note>

<Tip>
هل تبحث عن دليل إرشادي بدلا من ذلك؟ ابدأ بـ [بناء plugins](/ar/plugins/building-plugins)، واستخدم [Channel plugins](/ar/plugins/sdk-channel-plugins) لـ channel plugins، و[Provider plugins](/ar/plugins/sdk-provider-plugins) لـ provider plugins، و[CLI backend plugins](/ar/plugins/cli-backend-plugins) لخلفيات CLI للذكاء الاصطناعي المحلية، و[Plugin hooks](/ar/plugins/hooks) لـ plugins الخاصة بأدوات أو خطافات دورة الحياة.
</Tip>

## اصطلاح الاستيراد

استورد دائما من مسار فرعي محدد:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

كل مسار فرعي هو وحدة صغيرة مستقلة بذاتها. يحافظ ذلك على سرعة بدء التشغيل
ويمنع مشكلات التبعيات الدائرية. بالنسبة إلى مساعدات الإدخال/البناء الخاصة بالقنوات،
فضّل `openclaw/plugin-sdk/channel-core`؛ واحتفظ بـ `openclaw/plugin-sdk/core`
للسطح الأوسع والمساعدات المشتركة مثل
`buildChannelConfigSchema`.

بالنسبة إلى إعدادات القناة، انشر JSON Schema المملوك للقناة عبر
`openclaw.plugin.json#channelConfigs`. المسار الفرعي `plugin-sdk/channel-config-schema`
مخصص لبدائيات المخطط المشتركة والباني العام. تستخدم plugins المضمنة في OpenClaw
`plugin-sdk/bundled-channel-config-schema` للمخططات المحتفظ بها للقنوات المضمنة.
تبقى صادرات التوافق المهملة على
`plugin-sdk/channel-config-schema-legacy`؛ ولا يمثل أي من مساري المخططات المضمنة
نمطا لـ plugins الجديدة.

<Warning>
  لا تستورد seams الملائمة ذات العلامات الخاصة بالمزود أو القناة (على سبيل المثال
  `openclaw/plugin-sdk/slack`، أو `.../discord`، أو `.../signal`، أو `.../whatsapp`).
  تجمع plugins المضمنة مسارات SDK الفرعية العامة داخل barrels الخاصة بها
  `api.ts` / `runtime-api.ts`؛ ويجب على مستهلكي النواة إما استخدام تلك barrels المحلية للـ plugin
  أو إضافة عقد SDK عام ضيق عندما تكون الحاجة عابرة للقنوات فعلا.

لا تزال مجموعة صغيرة من seams المساعدة الخاصة بـ bundled-plugin تظهر في خريطة التصدير
المولدة عندما يكون لها استخدام مالك متتبع. وهي موجودة لصيانة bundled-plugin
فقط، ولا يوصى بها كمسارات استيراد لـ plugins جديدة تابعة لأطراف ثالثة.

يتم الاحتفاظ أيضا بـ `openclaw/plugin-sdk/discord` و`openclaw/plugin-sdk/telegram-account`
كواجهات توافق مهملة لاستخدام مالك متتبع. لا تنسخ مسارات الاستيراد هذه إلى plugins جديدة؛ استخدم مساعدات وقت التشغيل المحقونة
ومسارات SDK الفرعية العامة للقنوات بدلا من ذلك.
</Warning>

## مرجع المسارات الفرعية

يتم عرض plugin SDK كمجموعة من المسارات الفرعية الضيقة المجمعة حسب المجال (إدخال plugin،
القناة، المزود، المصادقة، وقت التشغيل، القدرة، الذاكرة، ومساعدات bundled-plugin المحجوزة).
للاطلاع على الفهرس الكامل — مجمعا ومرتبطا — راجع
[المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths).

توجد القائمة المولدة التي تضم أكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`.

## واجهة برمجة التسجيل

يتلقى استدعاء `register(api)` كائنا من نوع `OpenClawPluginApi` يتضمن هذه
الطرائق:

### تسجيل القدرات

| الطريقة                                           | ما تسجله                              |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | استدلال نصي (LLM)                     |
| `api.registerAgentHarness(...)`                  | منفذ وكيل منخفض المستوى تجريبي       |
| `api.registerCliBackend(...)`                    | خلفية استدلال CLI محلية               |
| `api.registerChannel(...)`                       | قناة مراسلة                           |
| `api.registerSpeechProvider(...)`                | تحويل النص إلى كلام / تركيب STT      |
| `api.registerRealtimeTranscriptionProvider(...)` | نسخ فوري متدفق                        |
| `api.registerRealtimeVoiceProvider(...)`         | جلسات صوت فوري ثنائية الاتجاه         |
| `api.registerMediaUnderstandingProvider(...)`    | تحليل الصور/الصوت/الفيديو             |
| `api.registerImageGenerationProvider(...)`       | توليد الصور                           |
| `api.registerMusicGenerationProvider(...)`       | توليد الموسيقى                        |
| `api.registerVideoGenerationProvider(...)`       | توليد الفيديو                         |
| `api.registerWebFetchProvider(...)`              | مزود جلب / استخراج من الويب           |
| `api.registerWebSearchProvider(...)`             | بحث الويب                             |

### الأدوات والأوامر

| الطريقة                         | ما تسجله                                      |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | أداة وكيل (مطلوبة أو `{ optional: true }`)    |
| `api.registerCommand(def)`      | أمر مخصص (يتجاوز LLM)                         |

يمكن لأوامر Plugin تعيين `agentPromptGuidance` عندما يحتاج الوكيل إلى تلميح توجيه قصير
مملوك للأمر. اجعل ذلك النص عن الأمر نفسه؛ ولا تضف
سياسة خاصة بالمزود أو Plugin إلى بناة مطالبات النواة.

### البنية التحتية

| الطريقة                                        | ما تسجله                               |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | خطاف حدث                               |
| `api.registerHttpRoute(params)`                | نقطة نهاية HTTP في Gateway             |
| `api.registerGatewayMethod(name, handler)`     | طريقة RPC في Gateway                    |
| `api.registerGatewayDiscoveryService(service)` | معلن اكتشاف Gateway محلي               |
| `api.registerCli(registrar, opts?)`            | أمر فرعي في CLI                         |
| `api.registerNodeCliFeature(registrar, opts?)` | ميزة CLI في Node ضمن `openclaw nodes`   |
| `api.registerService(service)`                 | خدمة خلفية                              |
| `api.registerInteractiveHandler(registration)` | معالج تفاعلي                            |
| `api.registerAgentToolResultMiddleware(...)`   | وسيط نتيجة الأداة في وقت التشغيل        |
| `api.registerMemoryPromptSupplement(builder)`  | قسم مطالبة إضافي مجاور للذاكرة         |
| `api.registerMemoryCorpusSupplement(adapter)`  | متن إضافي للبحث/القراءة في الذاكرة     |

### خطافات المضيف لـ plugins سير العمل

خطافات المضيف هي seams في SDK لـ plugins التي تحتاج إلى المشاركة في دورة حياة المضيف
بدلا من مجرد إضافة مزود أو قناة أو أداة. إنها
عقود عامة؛ يمكن لـ Plan Mode استخدامها، وكذلك سير عمل الموافقة،
وبوابات سياسة مساحة العمل، والمراقبات الخلفية، ومعالجات الإعداد، وplugins المرافقة لواجهة المستخدم.

| الطريقة                                                                   | العقد الذي تملكه                                                                                                                   |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | حالة جلسة مملوكة لـ Plugin ومتوافقة مع JSON يتم إسقاطها عبر جلسات Gateway                                                         |
| `api.enqueueNextTurnInjection(...)`                                      | سياق دائم ينفذ مرة واحدة بالضبط ويتم حقنه في دورة الوكيل التالية لجلسة واحدة                                                       |
| `api.registerTrustedToolPolicy(...)`                                     | سياسة أداة قبلية مملوكة لـ bundled/trusted pre-plugin يمكنها حظر معلمات الأداة أو إعادة كتابتها                                  |
| `api.registerToolMetadata(...)`                                          | بيانات وصفية لعرض فهرس الأدوات دون تغيير تنفيذ الأداة                                                                              |
| `api.registerCommand(...)`                                               | أوامر Plugin محددة النطاق؛ يمكن لنتائج الأوامر تعيين `continueAgent: true`؛ وتدعم أوامر Discord الأصلية `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | واصفات مساهمة Control UI لأسطح الجلسة أو الأداة أو التشغيل أو الإعدادات                                                           |
| `api.registerRuntimeLifecycle(...)`                                      | استدعاءات تنظيف لموارد وقت التشغيل المملوكة لـ Plugin في مسارات reset/delete/reload                                                |
| `api.registerAgentEventSubscription(...)`                                | اشتراكات أحداث منقحة لحالة سير العمل والمراقبات                                                                                   |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | حالة مؤقتة لـ Plugin لكل تشغيل يتم مسحها عند دورة حياة التشغيل النهائية                                                           |
| `api.registerSessionSchedulerJob(...)`                                   | سجلات مهام مجدول الجلسة المملوكة لـ Plugin مع تنظيف حتمي                                                                           |

تقسم العقود السلطة عمدا:

- يمكن لـ plugins الخارجية امتلاك امتدادات الجلسة، وواصفات واجهة المستخدم، والأوامر، وبيانات الأدوات الوصفية، وحقن الدورة التالية، والخطافات العادية.
- تعمل سياسات الأدوات الموثوقة قبل خطافات `before_tool_call` العادية وهي مخصصة للمضمن فقط لأنها تشارك في سياسة سلامة المضيف.
- ملكية الأوامر المحجوزة مخصصة للمضمن فقط. يجب أن تستخدم plugins الخارجية أسماء أوامرها أو أسماءها المستعارة الخاصة.
- يعطل `allowPromptInjection=false` الخطافات التي تعدل المطالبة، بما في ذلك
  `agent_turn_prepare`، و`before_prompt_build`، و`heartbeat_prompt_contribution`،
  وحقول المطالبة من `before_agent_start` القديم، و
  `enqueueNextTurnInjection`.

أمثلة لمستهلكين غير تابعين لـ Plan:

| نموذج Plugin                 | الخطافات المستخدمة                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| سير عمل الموافقة             | امتداد الجلسة، متابعة الأمر، حقن الدورة التالية، واصف واجهة المستخدم                                                               |
| بوابة سياسة الميزانية/مساحة العمل | سياسة أداة موثوقة، بيانات وصفية للأداة، إسقاط الجلسة                                                                             |
| مراقب دورة حياة خلفي         | تنظيف دورة حياة وقت التشغيل، اشتراك حدث الوكيل، ملكية/تنظيف مجدول الجلسة، مساهمة مطالبة Heartbeat، واصف واجهة المستخدم            |
| معالج إعداد أو تهيئة         | امتداد الجلسة، أوامر محددة النطاق، واصف Control UI                                                                                |

<Note>
  تبقى مساحات أسماء إدارة النواة المحجوزة (`config.*`، و`exec.approvals.*`، و`wizard.*`،
  و`update.*`) دائما `operator.admin`، حتى إذا حاول Plugin تعيين نطاق طريقة Gateway
  أضيق. فضّل بادئات خاصة بـ Plugin للطرق
  المملوكة لـ Plugin.
</Note>

<Accordion title="متى تستخدم وسيط نتيجة الأداة">
  يمكن لـ plugins المضمنة استخدام `api.registerAgentToolResultMiddleware(...)` عندما
  تحتاج إلى إعادة كتابة نتيجة أداة بعد التنفيذ وقبل أن يعيد وقت التشغيل
  تغذية تلك النتيجة إلى النموذج. هذا هو seam الموثوق والمحايد لوقت التشغيل
  لمخفضات الإخراج غير المتزامنة مثل tokenjuice.

يجب أن تعلن plugins المضمّنة `contracts.agentToolResultMiddleware` لكل
وقت تشغيل مستهدف، على سبيل المثال `["pi", "codex"]`. لا يمكن لـplugins الخارجية
تسجيل هذه البرمجية الوسيطة؛ أبقِ hooks العادية لـOpenClaw plugin للأعمال
التي لا تحتاج إلى توقيت نتيجة الأداة قبل النموذج. تمت إزالة مسار تسجيل
مصنع الامتداد المضمّن القديم الخاص بـPi فقط.
</Accordion>

### تسجيل اكتشاف Gateway

يتيح `api.registerGatewayDiscoveryService(...)` لـplugin الإعلان عن Gateway النشط
على نقل اكتشاف محلي مثل mDNS/Bonjour. يستدعي OpenClaw الخدمة أثناء بدء تشغيل
Gateway عندما يكون الاكتشاف المحلي مفعّلًا، ويمرر منافذ Gateway الحالية وبيانات
تلميح TXT غير السرية، ويستدعي معالج `stop` المُعاد أثناء إيقاف تشغيل Gateway.

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

يجب ألا تعامل plugins اكتشاف Gateway قيم TXT المُعلنة على أنها أسرار أو
مصادقة. الاكتشاف تلميح توجيه؛ لا تزال مصادقة Gateway وتثبيت TLS يملكان
الثقة.

### بيانات تسجيل CLI الوصفية

يقبل `api.registerCli(registrar, opts?)` نوعين من بيانات أوامر وصفية:

- `commands`: أسماء أوامر صريحة يملكها المسجِّل
- `descriptors`: واصفات أوامر وقت التحليل المستخدمة لمساعدة CLI،
  والتوجيه، وتسجيل plugin CLI الكسول
- `parentPath`: مسار أمر أب اختياري لمجموعات الأوامر المتداخلة، مثل
  `["nodes"]`

بالنسبة إلى ميزات العقد المقترنة، فضّل
`api.registerNodeCliFeature(registrar, opts?)`. إنه غلاف صغير حول
`api.registerCli(..., { parentPath: ["nodes"] })` ويجعل أوامر مثل
`openclaw nodes canvas` ميزات عقد مملوكة صراحةً لـplugin.

إذا أردت أن يبقى أمر plugin محمّلًا بكسل في مسار CLI الجذري العادي،
فوفّر `descriptors` تغطي كل جذر أمر من المستوى الأعلى يعرضه ذلك
المسجِّل.

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

استخدم `commands` بمفرده فقط عندما لا تحتاج إلى تسجيل CLI جذري كسول.
يبقى مسار التوافق المتحمس هذا مدعومًا، لكنه لا يثبّت عناصر نائبة مدعومة
بالواصفات للتحميل الكسول في وقت التحليل.

### تسجيل واجهة CLI الخلفية

يتيح `api.registerCliBackend(...)` لـplugin امتلاك الإعداد الافتراضي لواجهة
AI CLI خلفية محلية مثل `codex-cli`.

- يصبح `id` للواجهة الخلفية بادئة المزوّد في مراجع النماذج مثل `codex-cli/gpt-5`.
- يستخدم `config` للواجهة الخلفية الشكل نفسه مثل `agents.defaults.cliBackends.<id>`.
- لا يزال إعداد المستخدم هو الأعلى أولوية. يدمج OpenClaw `agents.defaults.cliBackends.<id>` فوق
  الافتراضي القادم من plugin قبل تشغيل CLI.
- استخدم `normalizeConfig` عندما تحتاج واجهة خلفية إلى إعادة كتابات توافق بعد الدمج
  (مثل تطبيع أشكال الرايات القديمة).
- استخدم `resolveExecutionArgs` لإعادة كتابة argv ضمن نطاق الطلب التي تنتمي إلى
  لهجة CLI، مثل تعيين مستويات تفكير OpenClaw إلى راية جهد أصلية.

للاطلاع على دليل تأليف شامل، راجع
[plugins واجهة CLI الخلفية](/ar/plugins/cli-backend-plugins).

### الخانات الحصرية

| الطريقة                                     | ما تسجله                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | محرك السياق (واحد نشط في كل مرة). تتلقى دالة الاستدعاء `assemble()` القيمتين `availableTools` و`citationsMode` لكي يستطيع المحرك تخصيص إضافات الموجه. |
| `api.registerMemoryCapability(capability)` | قدرة ذاكرة موحدة                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | باني قسم موجه الذاكرة                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | محلل خطة تفريغ الذاكرة                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | محوّل وقت تشغيل الذاكرة                                                                                                                                    |

### محوّلات تضمين الذاكرة

| الطريقة                                         | ما تسجله                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | محوّل تضمين ذاكرة لـplugin النشط |

- `registerMemoryCapability` هي API plugin الذاكرة الحصرية المفضلة.
- قد يعرّض `registerMemoryCapability` أيضًا `publicArtifacts.listArtifacts(...)`
  لكي تتمكن plugins المصاحبة من استهلاك آثار الذاكرة المصدّرة عبر
  `openclaw/plugin-sdk/memory-host-core` بدلًا من الوصول إلى تخطيط خاص
  بـplugin ذاكرة محدد.
- `registerMemoryPromptSection` و`registerMemoryFlushPlan` و
  `registerMemoryRuntime` هي APIs حصرية لـplugin الذاكرة متوافقة مع الأنظمة القديمة.
- يمكن لـ`MemoryFlushPlan.model` تثبيت دورة التفريغ على مرجع `provider/model`
  دقيق، مثل `ollama/qwen3:8b`، دون وراثة سلسلة الاحتياط النشطة.
- يتيح `registerMemoryEmbeddingProvider` لـplugin الذاكرة النشط تسجيل معرّف واحد
  أو أكثر لمحوّلات التضمين (مثل `openai` أو `gemini` أو معرّف مخصص
  يعرّفه plugin).
- تُحل إعدادات المستخدم مثل `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` مقابل معرّفات المحوّلات المسجلة تلك.

### الأحداث ودورة الحياة

| الطريقة                                       | ما تفعله                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | hook دورة حياة مكتوب          |
| `api.onConversationBindingResolved(handler)` | استدعاء ربط المحادثة |

راجع [hooks Plugin](/ar/plugins/hooks) للحصول على أمثلة، وأسماء hooks شائعة، ودلالات الحراسة.

### دلالات قرار hook

- `before_tool_call`: إرجاع `{ block: true }` نهائي. بمجرد أن يعيّنه أي معالج، تُتخطى المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: إرجاع `{ block: false }` يُعامل على أنه لا قرار (مثل حذف `block`)، وليس كتجاوز.
- `before_install`: إرجاع `{ block: true }` نهائي. بمجرد أن يعيّنه أي معالج، تُتخطى المعالجات ذات الأولوية الأدنى.
- `before_install`: إرجاع `{ block: false }` يُعامل على أنه لا قرار (مثل حذف `block`)، وليس كتجاوز.
- `reply_dispatch`: إرجاع `{ handled: true, ... }` نهائي. بمجرد أن يطالب أي معالج بالإرسال، تُتخطى المعالجات ذات الأولوية الأدنى ومسار إرسال النموذج الافتراضي.
- `message_sending`: إرجاع `{ cancel: true }` نهائي. بمجرد أن يعيّنه أي معالج، تُتخطى المعالجات ذات الأولوية الأدنى.
- `message_sending`: إرجاع `{ cancel: false }` يُعامل على أنه لا قرار (مثل حذف `cancel`)، وليس كتجاوز.
- `message_received`: استخدم حقل `threadId` المكتوب عندما تحتاج إلى توجيه السلاسل/المواضيع الواردة. أبقِ `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: استخدم حقول التوجيه المكتوبة `replyToId` / `threadId` قبل الرجوع إلى `metadata` الخاصة بالقناة.
- `gateway_start`: استخدم `ctx.config` و`ctx.workspaceDir` و`ctx.getCron?.()` لحالة بدء التشغيل المملوكة لـGateway بدلًا من الاعتماد على hooks داخلية مثل `gateway:startup`.
- `cron_changed`: راقب تغييرات دورة حياة cron المملوكة لـGateway. استخدم `event.job?.state?.nextRunAtMs` و`ctx.getCron?.()` عند مزامنة مجدولات الإيقاظ الخارجية، وأبقِ OpenClaw مصدر الحقيقة لفحوصات الاستحقاق والتنفيذ.

### حقول كائن API

| الحقل                    | النوع                      | الوصف                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | معرّف Plugin                                                                                   |
| `api.name`               | `string`                  | اسم العرض                                                                                |
| `api.version`            | `string?`                 | إصدار Plugin (اختياري)                                                                   |
| `api.description`        | `string?`                 | وصف Plugin (اختياري)                                                               |
| `api.source`             | `string`                  | مسار مصدر Plugin                                                                          |
| `api.rootDir`            | `string?`                 | دليل جذر Plugin (اختياري)                                                            |
| `api.config`             | `OpenClawConfig`          | لقطة الإعداد الحالية (لقطة وقت التشغيل النشطة في الذاكرة عند توفرها)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | إعداد خاص بـPlugin من `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | مسجّل محدود النطاق (`debug`، `info`، `warn`، `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | وضع التحميل الحالي؛ `"setup-runtime"` هي نافذة بدء التشغيل/الإعداد الخفيفة قبل الإدخال الكامل |
| `api.resolvePath(input)` | `(string) => string`      | حل المسار نسبةً إلى جذر Plugin                                                        |

## اصطلاح الوحدات الداخلية

داخل plugin الخاص بك، استخدم ملفات barrel محلية للاستيرادات الداخلية:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  لا تستورد plugin الخاص بك مطلقًا عبر `openclaw/plugin-sdk/<your-plugin>`
  من كود الإنتاج. وجّه الاستيرادات الداخلية عبر `./api.ts` أو
  `./runtime-api.ts`. مسار SDK هو العقد الخارجي فقط.
</Warning>

تفضّل الأسطح العامة لـplugin المضمّن المحمّلة عبر الواجهة (`api.ts`، و`runtime-api.ts`،
و`index.ts`، و`setup-entry.ts`، وملفات الإدخال العامة المشابهة) لقطة إعداد
وقت التشغيل النشطة عندما يكون OpenClaw قيد التشغيل بالفعل. إذا لم تكن هناك
لقطة وقت تشغيل بعد، فإنها تعود إلى ملف الإعداد المحلول على القرص.
يجب تحميل واجهات plugin المضمّن المعبأة عبر محمّلات واجهات plugins في OpenClaw؛
فالاستيرادات المباشرة من `dist/extensions/...` تتجاوز فحوصات manifest
والـsidecar الخاصة بوقت التشغيل التي تستخدمها التثبيتات المعبأة للكود المملوك لـplugin.

يمكن لـ Plugins المزوّد كشف ملف تجميعي ضيق لعقد محلي خاص بالـ Plugin عندما يكون
المساعد مخصصًا للمزوّد عمدًا ولا ينتمي بعد إلى مسار فرعي عام في SDK.
أمثلة مضمنة:

- **Anthropic**: حدّ `api.ts` / `contract-api.ts` العام لمساعدات ترويسة Claude
  التجريبية و`service_tier` للبث.
- **`@openclaw/openai-provider`**: يصدّر `api.ts` منشئات المزوّد،
  ومساعدات النموذج الافتراضي، ومنشئات مزوّد الوقت الفعلي.
- **`@openclaw/openrouter-provider`**: يصدّر `api.ts` منشئ المزوّد
  بالإضافة إلى مساعدات التهيئة/الإعداد.

<Warning>
  يجب أن يتجنب كود الإنتاج في الامتداد أيضًا استيرادات `openclaw/plugin-sdk/<other-plugin>`.
  إذا كان المساعد مشتركًا فعلًا، فارفعه إلى مسار فرعي محايد في SDK
  مثل `openclaw/plugin-sdk/speech` أو `.../provider-model-shared` أو سطح آخر
  موجّه إلى القدرات بدلًا من ربط Pluginين ببعضهما.
</Warning>

## ذات صلة

<CardGroup cols={2}>
  <Card title="نقاط الدخول" icon="door-open" href="/ar/plugins/sdk-entrypoints">
    خيارات `definePluginEntry` و`defineChannelPluginEntry`.
  </Card>
  <Card title="مساعدات وقت التشغيل" icon="gears" href="/ar/plugins/sdk-runtime">
    مرجع مساحة الأسماء الكاملة `api.runtime`.
  </Card>
  <Card title="الإعداد والتهيئة" icon="sliders" href="/ar/plugins/sdk-setup">
    الحزم والبيانات الوصفية ومخططات التهيئة.
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
