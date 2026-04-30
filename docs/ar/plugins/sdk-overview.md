---
read_when:
    - تحتاج إلى معرفة المسار الفرعي لـ SDK الذي يجب الاستيراد منه
    - تريد مرجعًا لجميع طرق التسجيل في OpenClawPluginApi
    - أنت تبحث عن تصدير محدد في حزمة تطوير البرامج
sidebarTitle: Plugin SDK overview
summary: خريطة الاستيراد، ومرجع API التسجيل، ومعمارية SDK
title: نظرة عامة على حزمة تطوير برمجيات Plugin
x-i18n:
    generated_at: "2026-04-30T08:16:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1749ad99c55ffd14624b817aba963bd93ebe7976937138693177523bbe3aa88c
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK الخاص بـ Plugin هو العقد المطبوع بين Plugins والنواة. هذه الصفحة هي
المرجع لـ **ما يجب استيراده** و**ما يمكنك تسجيله**.

<Note>
  هذه الصفحة مخصصة لمؤلفي Plugin الذين يستخدمون `openclaw/plugin-sdk/*` داخل
  OpenClaw. بالنسبة للتطبيقات الخارجية والسكربتات ولوحات المعلومات ومهام CI وإضافات IDE
  التي تريد تشغيل الوكلاء عبر Gateway، استخدم
  [SDK تطبيق OpenClaw](/ar/concepts/openclaw-sdk) وحزمة `@openclaw/sdk`
  بدلا من ذلك.
</Note>

<Tip>
هل تبحث عن دليل إرشادي بدلا من ذلك؟ ابدأ بـ [بناء Plugins](/ar/plugins/building-plugins)، واستخدم [Plugins القنوات](/ar/plugins/sdk-channel-plugins) لـ Plugins القنوات، و[Plugins المزودين](/ar/plugins/sdk-provider-plugins) لـ Plugins المزودين، و[خطافات Plugin](/ar/plugins/hooks) لـ Plugins الأدوات أو خطافات دورة الحياة.
</Tip>

## اصطلاح الاستيراد

استورد دائما من مسار فرعي محدد:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

كل مسار فرعي هو وحدة صغيرة مستقلة بذاتها. يحافظ هذا على سرعة بدء التشغيل
ويمنع مشكلات التبعيات الدائرية. بالنسبة لمساعدات الإدخال/البناء الخاصة بالقنوات،
فضّل `openclaw/plugin-sdk/channel-core`؛ واحتفظ بـ `openclaw/plugin-sdk/core` من أجل
السطح الأوسع الجامع والمساعدات المشتركة مثل
`buildChannelConfigSchema`.

بالنسبة لإعدادات القناة، انشر JSON Schema المملوكة للقناة عبر
`openclaw.plugin.json#channelConfigs`. المسار الفرعي `plugin-sdk/channel-config-schema`
مخصص لبدائيات المخطط المشتركة والباني العام. تستخدم Plugins المضمّنة في OpenClaw
`plugin-sdk/bundled-channel-config-schema` لمخططات القنوات المضمّنة المحتفظ بها.
تبقى صادرات التوافق المهملة على
`plugin-sdk/channel-config-schema-legacy`؛ ولا يمثل أي من مساري المخططات المضمّنة
نمطا لـ Plugins الجديدة.

<Warning>
  لا تستورد طبقات الملاءمة الموسومة بمزود أو قناة (على سبيل المثال
  `openclaw/plugin-sdk/slack`، أو `.../discord`، أو `.../signal`، أو `.../whatsapp`).
  تركّب Plugins المضمّنة مسارات SDK الفرعية العامة داخل واجهات `api.ts` /
  `runtime-api.ts` الخاصة بها؛ يجب على مستهلكي النواة إما استخدام تلك الواجهات المحلية للـ Plugin
  أو إضافة عقد SDK عام ضيق عندما تكون الحاجة عابرة للقنوات حقا.

لا تزال مجموعة صغيرة من طبقات المساعدة الخاصة بـ Plugins المضمّنة تظهر في خريطة التصدير
المولدة عندما تكون لديها استخدامات مالك متتبعة. توجد هذه الطبقات لصيانة Plugins
المضمّنة فقط، ولا يوصى بها كمسارات استيراد لـ Plugins خارجية جديدة.

يبقى `openclaw/plugin-sdk/discord` و`openclaw/plugin-sdk/telegram-account` أيضا
كواجهات توافق مهملة لاستخدامات مالك متتبعة. لا تنسخ مسارات الاستيراد هذه إلى
Plugins جديدة؛ استخدم بدلا من ذلك مساعدات وقت التشغيل المحقونة
ومسارات SDK الفرعية العامة للقنوات.
</Warning>

## مرجع المسارات الفرعية

يُعرض SDK الخاص بـ Plugin كمجموعة من المسارات الفرعية الضيقة المجمعة حسب المجال (إدخال Plugin،
القناة، المزود، المصادقة، وقت التشغيل، الإمكانية، الذاكرة، ومساعدات Plugins المضمّنة
المحجوزة). للاطلاع على الكتالوج الكامل، مجمعا ومربوطا، راجع
[المسارات الفرعية لـ SDK الخاص بـ Plugin](/ar/plugins/sdk-subpaths).

توجد القائمة المولدة التي تضم أكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`.

## API التسجيل

تتلقى دالة الاستدعاء `register(api)` كائنا من نوع `OpenClawPluginApi` بهذه
الطرائق:

### تسجيل الإمكانيات

| الطريقة                                           | ما تسجله                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | استدلال نصي (LLM)                  |
| `api.registerAgentHarness(...)`                  | منفذ وكيل منخفض المستوى وتجريبي |
| `api.registerCliBackend(...)`                    | خلفية استدلال CLI محلية           |
| `api.registerChannel(...)`                       | قناة مراسلة                     |
| `api.registerSpeechProvider(...)`                | تحويل النص إلى كلام / تركيب STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | نسخ فوري متدفق      |
| `api.registerRealtimeVoiceProvider(...)`         | جلسات صوت فورية ثنائية الاتجاه        |
| `api.registerMediaUnderstandingProvider(...)`    | تحليل الصور/الصوت/الفيديو            |
| `api.registerImageGenerationProvider(...)`       | توليد الصور                      |
| `api.registerMusicGenerationProvider(...)`       | توليد الموسيقى                      |
| `api.registerVideoGenerationProvider(...)`       | توليد الفيديو                      |
| `api.registerWebFetchProvider(...)`              | مزود جلب / كشط الويب           |
| `api.registerWebSearchProvider(...)`             | بحث الويب                            |

### الأدوات والأوامر

| الطريقة                          | ما تسجله                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | أداة وكيل (مطلوبة أو `{ optional: true }`) |
| `api.registerCommand(def)`      | أمر مخصص (يتجاوز LLM)             |

يمكن لأوامر Plugin ضبط `agentPromptGuidance` عندما يحتاج الوكيل إلى تلميح توجيه قصير
تملكه الأوامر. أبق ذلك النص متعلقا بالأمر نفسه؛ ولا تضف
سياسة خاصة بمزود أو Plugin إلى بانيات المطالبات في النواة.

### البنية التحتية

| الطريقة                                         | ما تسجله                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | خطاف حدث                              |
| `api.registerHttpRoute(params)`                | نقطة نهاية HTTP في Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | طريقة RPC في Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | معلن اكتشاف Gateway محلي      |
| `api.registerCli(registrar, opts?)`            | أمر فرعي CLI                          |
| `api.registerService(service)`                 | خدمة خلفية                      |
| `api.registerInteractiveHandler(registration)` | معالج تفاعلي                     |
| `api.registerAgentToolResultMiddleware(...)`   | وسيط نتائج أدوات وقت التشغيل          |
| `api.registerMemoryPromptSupplement(builder)`  | قسم مطالبة إضافي مجاور للذاكرة |
| `api.registerMemoryCorpusSupplement(adapter)`  | متن إضافي للبحث/القراءة في الذاكرة      |

### خطافات المضيف لـ Plugins سير العمل

خطافات المضيف هي طبقات SDK لـ Plugins التي تحتاج إلى المشاركة في دورة حياة المضيف
بدلا من إضافة مزود أو قناة أو أداة فقط. إنها
عقود عامة؛ يمكن لـ Plan Mode استخدامها، وكذلك سير عمل الموافقات،
وبوابات سياسة مساحة العمل، والمراقبات الخلفية، ومعالجات الإعداد، وPlugins المرافقة للواجهة.

| الطريقة                                                                   | العقد الذي تملكه                                                                  |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | حالة جلسة مملوكة لـ Plugin ومتوافقة مع JSON تُعرض عبر جلسات Gateway    |
| `api.enqueueNextTurnInjection(...)`                                      | سياق متين لمرة واحدة بالضبط يُحقن في دور الوكيل التالي لجلسة واحدة    |
| `api.registerTrustedToolPolicy(...)`                                     | سياسة أدوات ما قبل Plugin مضمّنة/موثوقة يمكنها حظر معاملات الأدوات أو إعادة كتابتها      |
| `api.registerToolMetadata(...)`                                          | بيانات وصفية لعرض كتالوج الأدوات دون تغيير تنفيذ الأداة            |
| `api.registerCommand(...)`                                               | أوامر Plugin محددة النطاق؛ يمكن لنتائج الأوامر ضبط `continueAgent: true`             |
| `api.registerControlUiDescriptor(...)`                                   | واصفات مساهمة واجهة التحكم لأسطح الجلسة أو الأداة أو التشغيل أو الإعدادات  |
| `api.registerRuntimeLifecycle(...)`                                      | استدعاءات تنظيف لموارد وقت التشغيل المملوكة لـ Plugin على مسارات إعادة الضبط/الحذف/إعادة التحميل |
| `api.registerAgentEventSubscription(...)`                                | اشتراكات أحداث منقحة لحالة سير العمل والمراقبات                     |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | حالة مؤقتة لكل تشغيل خاصة بـ Plugin تُمسح عند نهاية دورة حياة التشغيل                    |
| `api.registerSessionSchedulerJob(...)`                                   | سجلات مهام مجدول الجلسات المملوكة لـ Plugin مع تنظيف حتمي             |

تقسم العقود الصلاحيات عمدا:

- يمكن لـ Plugins الخارجية امتلاك امتدادات الجلسات، وواصفات الواجهة، والأوامر، وبيانات
  الأدوات الوصفية، وحقن الدور التالي، والخطافات العادية.
- تعمل سياسات الأدوات الموثوقة قبل خطافات `before_tool_call` العادية، وهي
  مخصصة للمضمّن فقط لأنها تشارك في سياسة سلامة المضيف.
- ملكية الأوامر المحجوزة مخصصة للمضمّن فقط. يجب على Plugins الخارجية استخدام
  أسماء أوامرها أو أسمائها المستعارة الخاصة.
- يؤدي `allowPromptInjection=false` إلى تعطيل الخطافات التي تعدل المطالبات، بما في ذلك
  `agent_turn_prepare`، و`before_prompt_build`، و`heartbeat_prompt_contribution`،
  وحقول المطالبات من `before_agent_start` القديم، و
  `enqueueNextTurnInjection`.

أمثلة على مستهلكين غير Plan:

| نمط Plugin             | الخطافات المستخدمة                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| سير عمل الموافقة            | امتداد الجلسة، متابعة الأمر، حقن الدور التالي، واصف الواجهة                                                            |
| بوابة سياسة الميزانية/مساحة العمل | سياسة أدوات موثوقة، بيانات وصفية للأداة، إسقاط الجلسة                                                                                 |
| مراقب دورة حياة خلفي | تنظيف دورة حياة وقت التشغيل، اشتراك أحداث الوكيل، ملكية/تنظيف مجدول الجلسات، مساهمة مطالبة Heartbeat، واصف الواجهة |
| معالج الإعداد أو التهيئة   | امتداد الجلسة، أوامر محددة النطاق، واصف واجهة التحكم                                                                              |

<Note>
  تبقى مساحات أسماء الإدارة الأساسية المحجوزة (`config.*`، و`exec.approvals.*`، و`wizard.*`،
  و`update.*`) دائما `operator.admin`، حتى إذا حاول Plugin تعيين
  نطاق طريقة Gateway أضيق. فضّل بادئات خاصة بـ Plugin للطرائق
  المملوكة لـ Plugin.
</Note>

<Accordion title="When to use tool-result middleware">
  يمكن لـ Plugins المضمّنة استخدام `api.registerAgentToolResultMiddleware(...)` عندما
  تحتاج إلى إعادة كتابة نتيجة أداة بعد التنفيذ وقبل أن يغذي وقت التشغيل
  تلك النتيجة مرة أخرى إلى النموذج. هذه هي الطبقة الموثوقة والمحايدة بالنسبة لوقت التشغيل
  لمخفضات الخرج غير المتزامنة مثل tokenjuice.

يجب على Plugins المضمّنة إعلان `contracts.agentToolResultMiddleware` لكل
وقت تشغيل مستهدف، على سبيل المثال `["pi", "codex"]`. لا تستطيع Plugins الخارجية
تسجيل هذا الوسيط؛ أبق خطافات Plugin العادية في OpenClaw للأعمال
التي لا تحتاج إلى توقيت نتيجة الأداة قبل النموذج. تمت إزالة مسار تسجيل مصنع
الإضافة المضمن القديم الخاص بـ Pi فقط.
</Accordion>

### تسجيل اكتشاف Gateway

يتيح `api.registerGatewayDiscoveryService(...)` لـ Plugin إعلان Gateway النشط
على نقل اكتشاف محلي مثل mDNS/Bonjour. يستدعي OpenClaw
الخدمة أثناء بدء تشغيل Gateway عندما يكون الاكتشاف المحلي مفعلا، ويمرر
منافذ Gateway الحالية وبيانات تلميح TXT غير السرية، ويستدعي معالج
`stop` المعاد أثناء إيقاف Gateway.

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

يجب ألا تتعامل Plugins اكتشاف Gateway مع قيم TXT المُعلَن عنها بوصفها أسرارًا أو
مصادقة. الاكتشاف تلميح توجيه؛ ولا تزال مصادقة Gateway وتثبيت TLS
يمتلكان الثقة.

### بيانات تسجيل CLI الوصفية

يقبل `api.registerCli(registrar, opts?)` نوعين من البيانات الوصفية على المستوى الأعلى:

- `commands`: جذور أوامر صريحة يملكها المُسجِّل
- `descriptors`: واصفات أوامر وقت التحليل المستخدمة لمساعدة CLI الجذرية،
  والتوجيه، وتسجيل CLI الخاص بـ Plugin عند التحميل الكسول

إذا أردت أن يبقى أمر Plugin مُحمَّلًا بكسل في مسار CLI الجذري العادي،
فوفّر `descriptors` تغطي كل جذر أمر على المستوى الأعلى يعرضه ذلك
المُسجِّل.

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

استخدم `commands` وحدها فقط عندما لا تحتاج إلى تسجيل CLI جذري كسول.
يبقى مسار التوافق الفوري هذا مدعومًا، لكنه لا يثبّت
عناصر نائبة مدعومة بالواصفات للتحميل الكسول وقت التحليل.

### تسجيل خلفية CLI

تتيح `api.registerCliBackend(...)` لـ Plugin امتلاك الإعداد الافتراضي لخلفية
CLI محلية للذكاء الاصطناعي مثل `codex-cli`.

- يصبح `id` الخاص بالخلفية بادئة المزوّد في مراجع النماذج مثل `codex-cli/gpt-5`.
- يستخدم `config` الخاص بالخلفية البنية نفسها مثل `agents.defaults.cliBackends.<id>`.
- يظل إعداد المستخدم هو الغالب. يدمج OpenClaw `agents.defaults.cliBackends.<id>` فوق
  الافتراضي الخاص بـ Plugin قبل تشغيل CLI.
- استخدم `normalizeConfig` عندما تحتاج خلفية إلى إعادة كتابة توافقية بعد الدمج
  (مثل تطبيع أشكال الأعلام القديمة).

### الفتحات الحصرية

| الطريقة                                     | ما تسجله                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | محرك سياق (واحد نشط في كل مرة). تتلقى دالة الاستدعاء `assemble()` القيمتين `availableTools` و`citationsMode` كي يستطيع المحرك تفصيل إضافات الموجه. |
| `api.registerMemoryCapability(capability)` | إمكانية ذاكرة موحدة                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | باني قسم موجه الذاكرة                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | محلل خطة تفريغ الذاكرة                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | محوّل تشغيل الذاكرة                                                                                                                                    |

### محوّلات تضمين الذاكرة

| الطريقة                                         | ما تسجله                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | محوّل تضمين ذاكرة لـ Plugin النشط |

- `registerMemoryCapability` هي واجهة API الحصرية المفضلة لـ Plugin الذاكرة.
- يمكن لـ `registerMemoryCapability` أيضًا عرض `publicArtifacts.listArtifacts(...)`
  كي تستطيع Plugins المصاحبة استهلاك آثار الذاكرة المصدّرة عبر
  `openclaw/plugin-sdk/memory-host-core` بدلًا من الدخول إلى تخطيط خاص
  بذاكرة Plugin محدد.
- `registerMemoryPromptSection` و`registerMemoryFlushPlan` و
  `registerMemoryRuntime` هي واجهات API حصرية قديمة متوافقة لـ Plugin الذاكرة.
- يستطيع `MemoryFlushPlan.model` تثبيت دور التفريغ على مرجع `provider/model`
  دقيق، مثل `ollama/qwen3:8b`، من دون وراثة سلسلة الاحتياطي النشطة.
- تتيح `registerMemoryEmbeddingProvider` لـ Plugin الذاكرة النشط تسجيل معرّف واحد
  أو أكثر لمحوّلات التضمين (مثل `openai` أو `gemini` أو معرّف مخصص
  يعرّفه Plugin).
- تُحل إعدادات المستخدم مثل `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` مقابل معرّفات المحوّلات المسجلة تلك.

### الأحداث ودورة الحياة

| الطريقة                                       | ما تفعله                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | خطاف دورة حياة مضبوط النوع          |
| `api.onConversationBindingResolved(handler)` | دالة استدعاء ربط المحادثة |

راجع [خطافات Plugin](/ar/plugins/hooks) للاطلاع على أمثلة، وأسماء الخطافات الشائعة، ودلالات الحراسة.

### دلالات قرار الخطاف

- `before_tool_call`: إرجاع `{ block: true }` نهائي. بمجرد أن يضبطه أي معالج، تُتخطى المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: يُعامل إرجاع `{ block: false }` على أنه لا قرار (مثل حذف `block`)، وليس كتجاوز.
- `before_install`: إرجاع `{ block: true }` نهائي. بمجرد أن يضبطه أي معالج، تُتخطى المعالجات ذات الأولوية الأدنى.
- `before_install`: يُعامل إرجاع `{ block: false }` على أنه لا قرار (مثل حذف `block`)، وليس كتجاوز.
- `reply_dispatch`: إرجاع `{ handled: true, ... }` نهائي. بمجرد أن يطالب أي معالج بالإرسال، تُتخطى المعالجات ذات الأولوية الأدنى ومسار إرسال النموذج الافتراضي.
- `message_sending`: إرجاع `{ cancel: true }` نهائي. بمجرد أن يضبطه أي معالج، تُتخطى المعالجات ذات الأولوية الأدنى.
- `message_sending`: يُعامل إرجاع `{ cancel: false }` على أنه لا قرار (مثل حذف `cancel`)، وليس كتجاوز.
- `message_received`: استخدم حقل `threadId` مضبوط النوع عندما تحتاج إلى توجيه الخيط/الموضوع الوارد. احتفظ بـ `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: استخدم حقول التوجيه مضبوطة النوع `replyToId` / `threadId` قبل الرجوع إلى `metadata` الخاصة بالقناة.
- `gateway_start`: استخدم `ctx.config` و`ctx.workspaceDir` و`ctx.getCron?.()` لحالة بدء التشغيل التي يملكها Gateway بدلًا من الاعتماد على خطافات `gateway:startup` الداخلية.
- `cron_changed`: راقب تغييرات دورة حياة cron التي يملكها Gateway. استخدم `event.job?.state?.nextRunAtMs` و`ctx.getCron?.()` عند مزامنة مجدولات الإيقاظ الخارجية، واجعل OpenClaw مصدر الحقيقة لفحوصات الاستحقاق والتنفيذ.

### حقول كائن API

| الحقل                    | النوع                      | الوصف                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | معرّف Plugin                                                                                   |
| `api.name`               | `string`                  | اسم العرض                                                                                |
| `api.version`            | `string?`                 | إصدار Plugin (اختياري)                                                                   |
| `api.description`        | `string?`                 | وصف Plugin (اختياري)                                                               |
| `api.source`             | `string`                  | مسار مصدر Plugin                                                                          |
| `api.rootDir`            | `string?`                 | دليل جذر Plugin (اختياري)                                                            |
| `api.config`             | `OpenClawConfig`          | لقطة الإعداد الحالية (لقطة تشغيل نشطة في الذاكرة عند توفرها)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | إعداد خاص بـ Plugin من `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [مساعدات التشغيل](/ar/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | مسجل محدد النطاق (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | وضع التحميل الحالي؛ `"setup-runtime"` هو نافذة بدء التشغيل/الإعداد الخفيفة قبل الإدخال الكامل |
| `api.resolvePath(input)` | `(string) => string`      | حل المسار نسبة إلى جذر Plugin                                                        |

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
  لا تستورد أبدًا Plugin الخاص بك عبر `openclaw/plugin-sdk/<your-plugin>`
  من كود الإنتاج. وجّه الاستيرادات الداخلية عبر `./api.ts` أو
  `./runtime-api.ts`. مسار SDK هو العقد الخارجي فقط.
</Warning>

تفضّل الأسطح العامة لـ Plugin المضمّن والمحملة عبر الواجهة (`api.ts` و`runtime-api.ts` و
`index.ts` و`setup-entry.ts` وملفات الإدخال العامة المشابهة)
لقطة إعداد التشغيل النشطة عندما يكون OpenClaw قيد التشغيل بالفعل. إذا لم تكن لقطة تشغيل
موجودة بعد، فإنها ترجع إلى ملف الإعداد المحلول على القرص.
يجب تحميل واجهات Plugin المضمّن المعبأة عبر محمّلات واجهة Plugin في OpenClaw؛
فالاستيرادات المباشرة من `dist/extensions/...` تتجاوز مرايا تبعيات التشغيل المرحلية
التي تستخدمها التثبيتات المعبأة للتبعيات التي يملكها Plugin.

يمكن لـ Plugins المزوّدين عرض ملف تجميع عقد محلي ضيق خاص بـ Plugin عندما يكون
المساعد مقصودًا أن يكون خاصًا بالمزوّد ولا ينتمي بعد إلى مسار فرعي عام في SDK.
أمثلة مضمّنة:

- **Anthropic**: سطح عام `api.ts` / `contract-api.ts` لـ Claude
  ومساعدي البث `service_tier` ورأس beta.
- **`@openclaw/openai-provider`**: يصدّر `api.ts` بناة المزوّد،
  ومساعدي النموذج الافتراضي، وبناة مزوّد الوقت الفعلي.
- **`@openclaw/openrouter-provider`**: يصدّر `api.ts` باني المزوّد
  إضافة إلى مساعدي الإعداد/التهيئة.

<Warning>
  يجب أن يتجنب كود الإنتاج في الإضافة أيضًا استيرادات `openclaw/plugin-sdk/<other-plugin>`.
  إذا كان المساعد مشتركًا حقًا، فارفعه إلى مسار فرعي محايد في SDK
  مثل `openclaw/plugin-sdk/speech` أو `.../provider-model-shared` أو سطح آخر
  موجّه بالإمكانية بدلًا من ربط Pluginين معًا.
</Warning>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/ar/plugins/sdk-entrypoints">
    خيارات `definePluginEntry` و`defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/ar/plugins/sdk-runtime">
    مرجع كامل لمساحة الاسم `api.runtime`.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/ar/plugins/sdk-setup">
    التحزيم، والبيانات التعريفية، ومخططات الإعداد.
  </Card>
  <Card title="Testing" icon="vial" href="/ar/plugins/sdk-testing">
    أدوات الاختبار المساعدة وقواعد التدقيق.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/ar/plugins/sdk-migration">
    الترحيل من الأسطح المهملة.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/ar/plugins/architecture">
    بنية عميقة ونموذج الإمكانات.
  </Card>
</CardGroup>
