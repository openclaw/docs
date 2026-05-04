---
read_when:
    - يجب أن تعرف المسار الفرعي في SDK الذي ستستورد منه
    - تريد مرجعًا لجميع طرق التسجيل في OpenClawPluginApi
    - أنت تبحث عن تصدير محدد من SDK
sidebarTitle: Plugin SDK overview
summary: خريطة الاستيراد، ومرجع API التسجيل، وبنية SDK
title: نظرة عامة على Plugin SDK
x-i18n:
    generated_at: "2026-05-04T18:24:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8187e7d4cfb9d6fb19bbdebfbaea0bb4d98fa5cea4742d0f82a765ae5bc60127
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK الخاص بـ Plugin هو العقد المطبوع بين Plugins والنواة. هذه الصفحة هي
المرجع لـ **ما يجب استيراده** و**ما يمكنك تسجيله**.

<Note>
  هذه الصفحة مخصصة لمؤلفي Plugin الذين يستخدمون `openclaw/plugin-sdk/*` داخل
  OpenClaw. بالنسبة للتطبيقات الخارجية والسكربتات ولوحات المعلومات ومهام CI وامتدادات IDE
  التي تريد تشغيل الوكلاء عبر Gateway، استخدم
  [SDK تطبيق OpenClaw](/ar/concepts/openclaw-sdk) وحزمة `@openclaw/sdk`
  بدلا من ذلك.
</Note>

<Tip>
هل تبحث عن دليل إرشادي بدلا من ذلك؟ ابدأ بـ [بناء Plugins](/ar/plugins/building-plugins)، واستخدم [Channel plugins](/ar/plugins/sdk-channel-plugins) لـ channel plugins، و[Provider plugins](/ar/plugins/sdk-provider-plugins) لـ provider plugins، و[Plugin hooks](/ar/plugins/hooks) لـ tool أو lifecycle hook plugins.
</Tip>

## اصطلاح الاستيراد

استورد دائما من مسار فرعي محدد:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

كل مسار فرعي هو وحدة صغيرة ومستقلة بذاتها. هذا يحافظ على سرعة بدء التشغيل
ويمنع مشكلات الاعتمادية الدائرية. بالنسبة لمساعدات الإدخال/البناء الخاصة بالقنوات،
فضّل `openclaw/plugin-sdk/channel-core`؛ واحتفظ بـ `openclaw/plugin-sdk/core` للسطح
الأوسع والمساعدات المشتركة مثل
`buildChannelConfigSchema`.

بالنسبة لإعداد القناة، انشر JSON Schema المملوك للقناة عبر
`openclaw.plugin.json#channelConfigs`. المسار الفرعي `plugin-sdk/channel-config-schema`
مخصص لأساسيات المخطط المشتركة والباني العام. تستخدم Plugins المضمنة في OpenClaw
`plugin-sdk/bundled-channel-config-schema` لمخططات القنوات المضمنة المحتفظ بها.
تبقى صادرات التوافق المهملة على
`plugin-sdk/channel-config-schema-legacy`؛ ولا يمثل أي من مساري المخططات المضمنة
نمطا لـ Plugins الجديدة.

<Warning>
  لا تستورد مسارات الراحة ذات العلامات الخاصة بالمزود أو القناة (على سبيل المثال
  `openclaw/plugin-sdk/slack`، أو `.../discord`، أو `.../signal`، أو `.../whatsapp`).
  تجمع Plugins المضمنة مسارات SDK الفرعية العامة داخل براميل `api.ts` /
  `runtime-api.ts` الخاصة بها؛ ويجب على مستهلكي النواة إما استخدام تلك البراميل المحلية
  للـ Plugin أو إضافة عقد SDK عام ضيق عندما تكون الحاجة عابرة للقنوات فعلا.

ما يزال يظهر عدد صغير من مسارات مساعدات Plugins المضمنة في خريطة التصدير
المولدة عندما يكون لها استخدام مالك متتبع. وهي موجودة لصيانة Plugins المضمنة فقط
ولا يوصى بها كمسارات استيراد لـ Plugins جديدة من أطراف ثالثة.

يُحتفظ أيضا بـ `openclaw/plugin-sdk/discord` و`openclaw/plugin-sdk/telegram-account`
كواجهات توافق مهملة لاستخدام مالك متتبع. لا تنسخ مسارات الاستيراد هذه إلى
Plugins جديدة؛ استخدم مساعدات وقت التشغيل المحقونة ومسارات SDK العامة للقنوات
بدلا من ذلك.
</Warning>

## مرجع المسارات الفرعية

يُعرض Plugin SDK كمجموعة من المسارات الفرعية الضيقة المجمعة حسب المجال (إدخال
Plugin، والقناة، والمزود، والمصادقة، ووقت التشغيل، والإمكانات، والذاكرة، ومساعدات
Plugins المضمنة المحجوزة). للاطلاع على الفهرس الكامل، مجمعا ومربوطا، راجع
[المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths).

توجد القائمة المولدة التي تضم أكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`.

## API التسجيل

يتلقى رد النداء `register(api)` كائن `OpenClawPluginApi` بهذه
الطرق:

### تسجيل الإمكانات

| الطريقة                                          | ما تسجله                              |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | استدلال نصي (LLM)                    |
| `api.registerAgentHarness(...)`                  | منفذ وكيل منخفض المستوى وتجريبي       |
| `api.registerCliBackend(...)`                    | خلفية استدلال CLI محلية              |
| `api.registerChannel(...)`                       | قناة مراسلة                           |
| `api.registerSpeechProvider(...)`                | تحويل النص إلى كلام / تركيب STT      |
| `api.registerRealtimeTranscriptionProvider(...)` | تفريغ فوري متدفق                     |
| `api.registerRealtimeVoiceProvider(...)`         | جلسات صوتية فورية مزدوجة الاتجاه     |
| `api.registerMediaUnderstandingProvider(...)`    | تحليل الصور/الصوت/الفيديو            |
| `api.registerImageGenerationProvider(...)`       | توليد الصور                           |
| `api.registerMusicGenerationProvider(...)`       | توليد الموسيقى                        |
| `api.registerVideoGenerationProvider(...)`       | توليد الفيديو                         |
| `api.registerWebFetchProvider(...)`              | مزود جلب / كشط ويب                    |
| `api.registerWebSearchProvider(...)`             | بحث ويب                               |

### الأدوات والأوامر

| الطريقة                         | ما تسجله                                        |
| ------------------------------- | ----------------------------------------------- |
| `api.registerTool(tool, opts?)` | أداة وكيل (مطلوبة أو `{ optional: true }`)      |
| `api.registerCommand(def)`      | أمر مخصص (يتجاوز LLM)                          |

يمكن لأوامر Plugin ضبط `agentPromptGuidance` عندما يحتاج الوكيل إلى تلميح توجيه
قصير مملوك للأمر. أبق هذا النص عن الأمر نفسه؛ ولا تضف سياسة خاصة بمزود أو Plugin
إلى بناة الموجهات في النواة.

### البنية التحتية

| الطريقة                                        | ما تسجله                              |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | خطاف حدث                              |
| `api.registerHttpRoute(params)`                | نقطة نهاية HTTP في Gateway            |
| `api.registerGatewayMethod(name, handler)`     | طريقة RPC في Gateway                  |
| `api.registerGatewayDiscoveryService(service)` | معلن اكتشاف Gateway محلي              |
| `api.registerCli(registrar, opts?)`            | أمر فرعي CLI                          |
| `api.registerService(service)`                 | خدمة خلفية                            |
| `api.registerInteractiveHandler(registration)` | معالج تفاعلي                          |
| `api.registerAgentToolResultMiddleware(...)`   | وسيط نتيجة الأداة في وقت التشغيل      |
| `api.registerMemoryPromptSupplement(builder)`  | قسم موجه إضافي مجاور للذاكرة          |
| `api.registerMemoryCorpusSupplement(adapter)`  | متن بحث/قراءة ذاكرة إضافي             |

### خطافات المضيف لـ workflow plugins

خطافات المضيف هي مسارات SDK الخاصة بـ Plugins التي تحتاج إلى المشاركة في دورة حياة
المضيف بدلا من مجرد إضافة مزود أو قناة أو أداة. إنها عقود عامة؛ يمكن لـ Plan Mode
استخدامها، وكذلك مهام سير الموافقة، وبوابات سياسة مساحة العمل، والمراقبات الخلفية،
ومعالجات الإعداد، وPlugins المرافقة للواجهة.

| الطريقة                                                                  | العقد الذي تملكه                                                                                                                   |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | حالة جلسة مملوكة لـ Plugin ومتوافقة مع JSON ومعروضة عبر جلسات Gateway                                                              |
| `api.enqueueNextTurnInjection(...)`                                      | سياق دائم لمرة واحدة بالضبط يحقن في دور الوكيل التالي لجلسة واحدة                                                                  |
| `api.registerTrustedToolPolicy(...)`                                     | سياسة أداة قبل Plugin مضمّنة/موثوقة يمكنها حظر معلمات الأداة أو إعادة كتابتها                                                      |
| `api.registerToolMetadata(...)`                                          | بيانات وصفية لعرض فهرس الأدوات دون تغيير تنفيذ الأداة                                                                              |
| `api.registerCommand(...)`                                               | أوامر Plugin محددة النطاق؛ يمكن لنتائج الأمر ضبط `continueAgent: true`؛ وتدعم أوامر Discord الأصلية `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | واصفات مساهمة Control UI لأسطح الجلسة أو الأداة أو التشغيل أو الإعدادات                                                            |
| `api.registerRuntimeLifecycle(...)`                                      | ردود نداء تنظيف لموارد وقت التشغيل المملوكة لـ Plugin في مسارات إعادة الضبط/الحذف/إعادة التحميل                                    |
| `api.registerAgentEventSubscription(...)`                                | اشتراكات أحداث منقحة لحالة workflow والمراقبات                                                                                     |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | حالة مؤقتة لكل تشغيل خاصة بـ Plugin تُمسح عند دورة حياة التشغيل النهائية                                                           |
| `api.registerSessionSchedulerJob(...)`                                   | سجلات مهمة مجدول الجلسة المملوكة لـ Plugin مع تنظيف حتمي                                                                           |

تقسم العقود الصلاحيات عمدا:

- يمكن لـ Plugins الخارجية امتلاك امتدادات الجلسة، وواصفات الواجهة، والأوامر، وبيانات
  تعريف الأدوات، وحقن الدور التالي، والخطافات العادية.
- تعمل سياسات الأدوات الموثوقة قبل خطافات `before_tool_call` العادية وهي
  مضمّنة فقط لأنها تشارك في سياسة سلامة المضيف.
- ملكية الأوامر المحجوزة مضمّنة فقط. يجب أن تستخدم Plugins الخارجية أسماء أوامرها
  أو ألقابها الخاصة.
- يعطل `allowPromptInjection=false` الخطافات التي تعدل الموجه، بما في ذلك
  `agent_turn_prepare`، و`before_prompt_build`، و`heartbeat_prompt_contribution`،
  وحقول الموجه من `before_agent_start` القديم، و
  `enqueueNextTurnInjection`.

أمثلة على مستهلكين غير Plan:

| نموذج Plugin                 | الخطافات المستخدمة                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| workflow الموافقة            | امتداد الجلسة، متابعة الأمر، حقن الدور التالي، واصف الواجهة                                                                       |
| بوابة سياسة الميزانية/مساحة العمل | سياسة أداة موثوقة، بيانات تعريف الأداة، إسقاط الجلسة                                                                              |
| مراقب دورة حياة خلفي         | تنظيف دورة حياة وقت التشغيل، اشتراك حدث الوكيل، ملكية/تنظيف مجدول الجلسة، مساهمة موجه Heartbeat، واصف الواجهة                  |
| معالج إعداد أو onboarding    | امتداد الجلسة، أوامر محددة النطاق، واصف Control UI                                                                               |

<Note>
  تبقى مساحات أسماء إدارة النواة المحجوزة (`config.*`، و`exec.approvals.*`، و`wizard.*`،
  و`update.*`) دائما `operator.admin`، حتى إذا حاول Plugin تعيين نطاق طريقة Gateway
  أضيق. فضّل بادئات خاصة بـ Plugin للطرق المملوكة لـ Plugin.
</Note>

<Accordion title="متى تستخدم وسيط نتيجة الأداة">
  يمكن لـ Plugins المضمنة استخدام `api.registerAgentToolResultMiddleware(...)` عندما
  تحتاج إلى إعادة كتابة نتيجة أداة بعد التنفيذ وقبل أن يعيد وقت التشغيل تغذية
  تلك النتيجة إلى النموذج. هذا هو المسار الموثوق والمحايد لوقت التشغيل
  لمخفضات الإخراج غير المتزامنة مثل tokenjuice.

يجب أن تعلن Plugins المضمنة عن `contracts.agentToolResultMiddleware` لكل
وقت تشغيل مستهدف، على سبيل المثال `["pi", "codex"]`. لا يمكن لـ Plugins الخارجية
تسجيل هذا الوسيط؛ أبق خطافات OpenClaw Plugin العادية للعمل الذي لا يحتاج إلى
توقيت نتيجة الأداة قبل النموذج. تمت إزالة مسار تسجيل مصنع الامتداد المضمن
القديم الخاص بـ Pi فقط.
</Accordion>

### تسجيل اكتشاف Gateway

`api.registerGatewayDiscoveryService(...)` يتيح لـ Plugin الإعلان عن Gateway النشط
على نقل اكتشاف محلي مثل mDNS/Bonjour. يستدعي OpenClaw هذه الخدمة أثناء بدء تشغيل Gateway عندما يكون الاكتشاف المحلي مفعلا، ويمرر منافذ Gateway الحالية وبيانات تلميح TXT غير السرية، ويستدعي معالج `stop` المُعاد أثناء إيقاف تشغيل Gateway.

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
مصادقة. الاكتشاف تلميح توجيه؛ ولا تزال مصادقة Gateway وتثبيت TLS هما المسؤولين عن الثقة.

### بيانات تسجيل CLI الوصفية

`api.registerCli(registrar, opts?)` يقبل نوعين من البيانات الوصفية العليا:

- `commands`: جذور أوامر صريحة يملكها المسجِّل
- `descriptors`: واصفات أوامر وقت التحليل المستخدمة لمساعدة CLI الجذرية،
  والتوجيه، وتسجيل CLI الخاص بـ Plugin بتحميل كسول

إذا كنت تريد أن يبقى أمر Plugin محملا بكسل في مسار CLI الجذري العادي،
فوفّر `descriptors` تغطي كل جذر أمر علوي يكشفه ذلك المسجِّل.

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

استخدم `commands` وحده فقط عندما لا تحتاج إلى تسجيل CLI جذري بتحميل كسول.
يبقى مسار التوافق المتحمس هذا مدعوما، لكنه لا يثبّت عناصر نائبة مدعومة بالواصفات للتحميل الكسول وقت التحليل.

### تسجيل خلفية CLI

`api.registerCliBackend(...)` يتيح لـ Plugin امتلاك الإعداد الافتراضي لخلفية
CLI محلية للذكاء الاصطناعي مثل `codex-cli`.

- يصبح `id` الخاص بالخلفية بادئة المزوّد في مراجع النماذج مثل `codex-cli/gpt-5`.
- يستخدم `config` الخاص بالخلفية الشكل نفسه مثل `agents.defaults.cliBackends.<id>`.
- يظل إعداد المستخدم هو الغالب. يدمج OpenClaw `agents.defaults.cliBackends.<id>` فوق
  الإعداد الافتراضي الخاص بـ Plugin قبل تشغيل CLI.
- استخدم `normalizeConfig` عندما تحتاج الخلفية إلى إعادة كتابة توافقية بعد الدمج
  (على سبيل المثال تطبيع أشكال الرايات القديمة).
- استخدم `resolveExecutionArgs` لإعادة كتابة argv ضمن نطاق الطلب عندما تكون تابعة
  للّهجة CLI، مثل ربط مستويات التفكير في OpenClaw براية جهد أصلية.

### الفتحات الحصرية

| الطريقة                                    | ما تسجله                                                                                                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | محرك سياق (واحد نشط في كل مرة). يتلقى استدعاء `assemble()` حقلي `availableTools` و`citationsMode` حتى يتمكن المحرك من تخصيص إضافات الموجّه. |
| `api.registerMemoryCapability(capability)` | قدرة ذاكرة موحدة                                                                                                                                            |
| `api.registerMemoryPromptSection(builder)` | باني قسم موجّه الذاكرة                                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`    | محلّل خطة تفريغ الذاكرة                                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | محوّل تشغيل الذاكرة                                                                                                                                         |

### محوّلات تضمين الذاكرة

| الطريقة                                        | ما تسجله                              |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | محوّل تضمين ذاكرة لـ Plugin النشط     |

- `registerMemoryCapability` هو API الذاكرة الحصري المفضّل لـ Plugin.
- قد يكشف `registerMemoryCapability` أيضا `publicArtifacts.listArtifacts(...)`
  حتى تتمكن Plugins المرافقة من استهلاك عناصر الذاكرة المُصدّرة عبر
  `openclaw/plugin-sdk/memory-host-core` بدلا من الوصول إلى التخطيط الخاص لـ Plugin ذاكرة محدد.
- `registerMemoryPromptSection` و`registerMemoryFlushPlan` و
  `registerMemoryRuntime` هي واجهات API حصرية متوافقة مع الإرث لـ Plugin الذاكرة.
- يمكن لـ `MemoryFlushPlan.model` تثبيت دورة التفريغ على مرجع `provider/model`
  دقيق، مثل `ollama/qwen3:8b`، من دون وراثة سلسلة الاحتياط النشطة.
- يتيح `registerMemoryEmbeddingProvider` لـ Plugin الذاكرة النشط تسجيل معرّف
  واحد أو أكثر لمحوّل التضمين (على سبيل المثال `openai` أو `gemini` أو معرّف مخصص
  معرّف من Plugin).
- تُحل إعدادات المستخدم مثل `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` مقابل معرّفات المحوّلات المسجلة هذه.

### الأحداث ودورة الحياة

| الطريقة                                      | ما تفعله                    |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | خطاف دورة حياة مضبوط النوع  |
| `api.onConversationBindingResolved(handler)` | استدعاء عكسي لربط المحادثة  |

راجع [خطافات Plugin](/ar/plugins/hooks) للحصول على أمثلة، وأسماء الخطافات الشائعة، ودلالات الحراسة.

### دلالات قرار الخطاف

- `before_tool_call`: إرجاع `{ block: true }` نهائي. بعد أن يعيّنه أي معالج، تُتخطى المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: يُعامل إرجاع `{ block: false }` على أنه لا قرار (مثل حذف `block`)، وليس كتجاوز.
- `before_install`: إرجاع `{ block: true }` نهائي. بعد أن يعيّنه أي معالج، تُتخطى المعالجات ذات الأولوية الأدنى.
- `before_install`: يُعامل إرجاع `{ block: false }` على أنه لا قرار (مثل حذف `block`)، وليس كتجاوز.
- `reply_dispatch`: إرجاع `{ handled: true, ... }` نهائي. بعد أن يطالب أي معالج بالإرسال، تُتخطى المعالجات ذات الأولوية الأدنى ومسار إرسال النموذج الافتراضي.
- `message_sending`: إرجاع `{ cancel: true }` نهائي. بعد أن يعيّنه أي معالج، تُتخطى المعالجات ذات الأولوية الأدنى.
- `message_sending`: يُعامل إرجاع `{ cancel: false }` على أنه لا قرار (مثل حذف `cancel`)، وليس كتجاوز.
- `message_received`: استخدم الحقل مضبوط النوع `threadId` عندما تحتاج إلى توجيه سلسلة/موضوع وارد. أبقِ `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: استخدم حقول التوجيه مضبوطة النوع `replyToId` / `threadId` قبل الرجوع إلى `metadata` الخاصة بالقناة.
- `gateway_start`: استخدم `ctx.config` و`ctx.workspaceDir` و`ctx.getCron?.()` لحالة بدء التشغيل المملوكة لـ Gateway بدلا من الاعتماد على خطافات `gateway:startup` الداخلية.
- `cron_changed`: راقب تغييرات دورة حياة Cron المملوكة لـ Gateway. استخدم `event.job?.state?.nextRunAtMs` و`ctx.getCron?.()` عند مزامنة مجدولات الإيقاظ الخارجية، وأبقِ OpenClaw مصدر الحقيقة لفحوصات الاستحقاق والتنفيذ.

### حقول كائن API

| الحقل                    | النوع                     | الوصف                                                                                               |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | معرّف Plugin                                                                                        |
| `api.name`               | `string`                  | اسم العرض                                                                                           |
| `api.version`            | `string?`                 | إصدار Plugin (اختياري)                                                                              |
| `api.description`        | `string?`                 | وصف Plugin (اختياري)                                                                                |
| `api.source`             | `string`                  | مسار مصدر Plugin                                                                                    |
| `api.rootDir`            | `string?`                 | دليل جذر Plugin (اختياري)                                                                           |
| `api.config`             | `OpenClawConfig`          | لقطة الإعداد الحالية (لقطة تشغيل نشطة في الذاكرة عند توفرها)                                       |
| `api.pluginConfig`       | `Record<string, unknown>` | إعداد خاص بـ Plugin من `plugins.entries.<id>.config`                                                |
| `api.runtime`            | `PluginRuntime`           | [مساعدات التشغيل](/ar/plugins/sdk-runtime)                                                            |
| `api.logger`             | `PluginLogger`            | مسجّل محدود النطاق (`debug` و`info` و`warn` و`error`)                                               |
| `api.registrationMode`   | `PluginRegistrationMode`  | وضع التحميل الحالي؛ `"setup-runtime"` هو نافذة بدء/إعداد خفيفة قبل الإدخال الكامل                  |
| `api.resolvePath(input)` | `(string) => string`      | حل المسار نسبة إلى جذر Plugin                                                                       |

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
  لا تستورد Plugin الخاص بك أبدا عبر `openclaw/plugin-sdk/<your-plugin>`
  من كود الإنتاج. وجّه الاستيرادات الداخلية عبر `./api.ts` أو
  `./runtime-api.ts`. مسار SDK هو العقد الخارجي فقط.
</Warning>

تفضّل الأسطح العامة لـ Plugin المضمن المحمّلة عبر الواجهة (`api.ts` و`runtime-api.ts`
و`index.ts` و`setup-entry.ts` وملفات الإدخال العامة المشابهة) لقطة إعداد التشغيل
النشطة عندما يكون OpenClaw قيد التشغيل بالفعل. إذا لم توجد لقطة تشغيل بعد،
فإنها ترجع إلى ملف الإعداد المحلول على القرص. يجب تحميل واجهات Plugin المضمن
المعبأة عبر محمّلات واجهات Plugins في OpenClaw؛ فالاستيرادات المباشرة من
`dist/extensions/...` تتجاوز فحوصات البيان ومرافق التشغيل الجانبية التي تستخدمها
التثبيتات المعبأة للكود المملوك لـ Plugin.

يمكن لـ Plugins المزوّدين كشف ملف تجميع عقد ضيق ومحلي لـ Plugin عندما يكون
مساعد ما خاصا بالمزوّد عمدا ولا ينتمي بعد إلى مسار SDK فرعي عام. أمثلة مضمنة:

- **Anthropic**: حد `api.ts` / `contract-api.ts` عام لمساعدات Claude
  الخاصة برأس بيتا وتدفق `service_tier`.
- **`@openclaw/openai-provider`**: يصدّر `api.ts` بُناة المزوّدين،
  ومساعدات النموذج الافتراضي، وبُناة مزوّد الوقت الحقيقي.
- **`@openclaw/openrouter-provider`**: يصدّر `api.ts` باني المزوّد
  بالإضافة إلى مساعدات الإعداد الأولي/الإعداد.

<Warning>
  يجب أن يتجنب كود إنتاج الإضافة أيضا استيرادات `openclaw/plugin-sdk/<other-plugin>`.
  إذا كان المساعد مشتركا فعلا، فارفعه إلى مسار SDK فرعي حيادي
  مثل `openclaw/plugin-sdk/speech` أو `.../provider-model-shared` أو سطح آخر
  موجه للقدرات بدلا من ربط Pluginين معا.
</Warning>

## ذو صلة

<CardGroup cols={2}>
  <Card title="نقاط الدخول" icon="door-open" href="/ar/plugins/sdk-entrypoints">
    خيارات `definePluginEntry` و`defineChannelPluginEntry`.
  </Card>
  <Card title="مساعدات وقت التشغيل" icon="gears" href="/ar/plugins/sdk-runtime">
    مرجع كامل لمساحة الأسماء `api.runtime`.
  </Card>
  <Card title="الإعداد والتكوين" icon="sliders" href="/ar/plugins/sdk-setup">
    التحزيم، والبيانات التعريفية، ومخططات التكوين.
  </Card>
  <Card title="الاختبار" icon="vial" href="/ar/plugins/sdk-testing">
    أدوات الاختبار وقواعد الفحص.
  </Card>
  <Card title="ترحيل SDK" icon="arrows-turn-right" href="/ar/plugins/sdk-migration">
    الترحيل من الواجهات المهملة.
  </Card>
  <Card title="الأجزاء الداخلية للـ Plugin" icon="diagram-project" href="/ar/plugins/architecture">
    بنية معمارية عميقة ونموذج القدرات.
  </Card>
</CardGroup>
