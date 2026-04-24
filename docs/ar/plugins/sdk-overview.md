---
read_when:
    - أنت تحتاج إلى معرفة المسار الفرعي في SDK الذي يجب الاستيراد منه
    - أنت تريد مرجعًا لجميع طرق التسجيل على OpenClawPluginApi
    - أنت تبحث عن عنصر تصدير محدد في SDK
sidebarTitle: SDK overview
summary: خريطة الاستيراد، ومرجع API التسجيل، وبنية SDK
title: نظرة عامة على Plugin SDK
x-i18n:
    generated_at: "2026-04-24T07:55:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f4209c245a3d3462c5d5f51ad3c6e4327240ed402fdbac3f01f8a761ba75233
    source_path: plugins/sdk-overview.md
    workflow: 15
---

تمثل Plugin SDK العقد typed بين plugins والنواة. وهذه الصفحة هي المرجع الخاص بـ **ما الذي يجب استيراده** و**ما الذي يمكنك تسجيله**.

<Tip>
  هل تبحث بدلًا من ذلك عن دليل عملي؟

- أول Plugin؟ ابدأ من [Building plugins](/ar/plugins/building-plugins).
- Plugin قناة؟ راجع [Channel plugins](/ar/plugins/sdk-channel-plugins).
- Plugin مزوّد؟ راجع [Provider plugins](/ar/plugins/sdk-provider-plugins).
  </Tip>

## اصطلاح الاستيراد

استورد دائمًا من مسار فرعي محدد:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

كل مسار فرعي هو وحدة صغيرة ومستقلة ذاتيًا. وهذا يحافظ على سرعة بدء التشغيل
ويمنع مشكلات الاعتماد الدائري. وبالنسبة إلى مساعدات الإدخال/البناء الخاصة بالقنوات،
فضّل `openclaw/plugin-sdk/channel-core`؛ واحتفظ بـ `openclaw/plugin-sdk/core` من أجل
السطح الأشمل والمساعدات المشتركة مثل
`buildChannelConfigSchema`.

<Warning>
  لا تستورد حدود الراحة ذات العلامة الخاصة بالمزوّد أو القناة (مثل
  `openclaw/plugin-sdk/slack`، أو `.../discord`، أو `.../signal`، أو `.../whatsapp`).
  فالـ plugins المضمّنة تركّب مسارات SDK الفرعية العامة داخل ملفات
  `api.ts` / `runtime-api.ts` الخاصة بها؛ أما مستهلكو النواة فعليهم إما استخدام
  هذه الملفات المحلية الخاصة بالـ plugin أو إضافة عقدة SDK عامة ضيقة عندما تكون
  الحاجة مشتركة بين القنوات فعلًا.

ما تزال مجموعة صغيرة من حدود المساعدة الخاصة بالـ plugins المضمّنة (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*`، وما شابه) تظهر في
خريطة التصدير المولدة. وهي موجودة فقط من أجل صيانة الـ plugins المضمّنة وليست
مسارات استيراد موصى بها لـ plugins الجديدة التابعة لجهات خارجية.
</Warning>

## مرجع المسارات الفرعية

تُعرض Plugin SDK كمجموعة من المسارات الفرعية الضيقة المجمعة حسب المجال (إدخال
Plugin، والقناة، والمزوّد، والمصادقة، ووقت التشغيل، والقدرات، والذاكرة، ومساعدات
plugins المضمّنة المحجوزة). وللاطلاع على الكتالوج الكامل — مجمّعًا ومرتبطًا —
راجع [Plugin SDK subpaths](/ar/plugins/sdk-subpaths).

توجد القائمة المولدة التي تضم أكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`.

## API التسجيل

يتلقى callback الخاص بـ `register(api)` كائن `OpenClawPluginApi` بهذه
الطرق:

### تسجيل القدرات

| الطريقة                                         | ما الذي تسجله                         |
| ----------------------------------------------- | ------------------------------------- |
| `api.registerProvider(...)`                     | الاستدلال النصي (LLM)                 |
| `api.registerAgentHarness(...)`                 | منفذ وكيل منخفض المستوى تجريبي        |
| `api.registerCliBackend(...)`                   | واجهة CLI خلفية محلية للاستدلال       |
| `api.registerChannel(...)`                      | قناة مراسلة                           |
| `api.registerSpeechProvider(...)`               | Text-to-speech / STT synthesis        |
| `api.registerRealtimeTranscriptionProvider(...)`| نسخ فوري متدفق                        |
| `api.registerRealtimeVoiceProvider(...)`        | جلسات صوت فورية ثنائية الاتجاه        |
| `api.registerMediaUnderstandingProvider(...)`   | تحليل الصور/الصوت/الفيديو             |
| `api.registerImageGenerationProvider(...)`      | توليد الصور                           |
| `api.registerMusicGenerationProvider(...)`      | توليد الموسيقى                        |
| `api.registerVideoGenerationProvider(...)`      | توليد الفيديو                         |
| `api.registerWebFetchProvider(...)`             | مزوّد جلب / كشط الويب                 |
| `api.registerWebSearchProvider(...)`            | البحث في الويب                        |

### الأدوات والأوامر

| الطريقة                         | ما الذي تسجله                                   |
| --------------------------------| ----------------------------------------------- |
| `api.registerTool(tool, opts?)` | أداة وكيل (مطلوبة أو `{ optional: true }`)     |
| `api.registerCommand(def)`      | أمر مخصص (يتجاوز LLM)                          |

### البنية التحتية

| الطريقة                                         | ما الذي تسجله                        |
| ----------------------------------------------- | ------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | Event hook                           |
| `api.registerHttpRoute(params)`                 | نقطة نهاية Gateway HTTP              |
| `api.registerGatewayMethod(name, handler)`      | طريقة Gateway RPC                    |
| `api.registerGatewayDiscoveryService(service)`  | معلن اكتشاف محلي لـ Gateway          |
| `api.registerCli(registrar, opts?)`             | أمر CLI فرعي                         |
| `api.registerService(service)`                  | خدمة خلفية                           |
| `api.registerInteractiveHandler(registration)`  | معالج تفاعلي                         |
| `api.registerEmbeddedExtensionFactory(factory)` | مصنع امتداد لـ Pi embedded-runner    |
| `api.registerMemoryPromptSupplement(builder)`   | قسم إضافي ملاصق للذاكرة في المطالبة  |
| `api.registerMemoryCorpusSupplement(adapter)`   | corpus إضافي للبحث/القراءة في الذاكرة |

<Note>
  تظل مساحات أسماء الإدارة الأساسية المحجوزة (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) دائمًا ضمن `operator.admin`، حتى لو حاولت plugin تعيين
  نطاق أضيق لطريقة gateway. فضّل البادئات الخاصة بالـ plugin
  للطرق التي تملكها plugin.
</Note>

<Accordion title="متى تستخدم registerEmbeddedExtensionFactory">
  استخدم `api.registerEmbeddedExtensionFactory(...)` عندما تحتاج plugin إلى
  توقيت أحداث أصلي لـ Pi أثناء التشغيلات المضمّنة في OpenClaw — مثل
  إعادة كتابة `tool_result` غير المتزامنة التي يجب أن تحدث قبل إصدار
  رسالة نتيجة الأداة النهائية.

هذا حدّ فاصل خاص بالـ plugins المضمّنة اليوم: لا يجوز إلا للـ plugins المضمّنة تسجيله،
وعليها إعلان `contracts.embeddedExtensionFactories: ["pi"]` داخل
`openclaw.plugin.json`. احتفظ بـ hooks العادية الخاصة بـ OpenClaw لكل شيء
لا يحتاج إلى هذا الحد الأدنى المستوى.
</Accordion>

### تسجيل اكتشاف Gateway

يتيح `api.registerGatewayDiscoveryService(...)` للـ plugin إعلان
Gateway النشطة على وسيلة نقل اكتشاف محلية مثل mDNS/Bonjour. يستدعي OpenClaw
الخدمة أثناء بدء تشغيل Gateway عندما يكون الاكتشاف المحلي مفعّلًا، ويمرر منافذ
Gateway الحالية وبيانات تلميح TXT غير السرية، ويستدعي معالج
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

يجب ألا تتعامل plugins الخاصة باكتشاف Gateway مع قيم TXT المُعلنة كأسرار أو
مصادقة. فالاكتشاف هو تلميح توجيه؛ بينما تظل مصادقة Gateway وتثبيت TLS هما
مالكي الثقة.

### بيانات وصفية لتسجيل CLI

يقبل `api.registerCli(registrar, opts?)` نوعين من البيانات الوصفية على المستوى الأعلى:

- `commands`: جذور أوامر صريحة يملكها registrar
- `descriptors`: واصفات أوامر وقت التحليل المستخدمة في مساعدة CLI الجذرية،
  والتوجيه، والتسجيل الكسول لـ CLI الخاصة بالـ plugin

إذا كنت تريد أن يظل أمر plugin محمّلًا كسولًا في المسار الجذري العادي لـ CLI،
فوفّر `descriptors` تغطي كل جذر أمر من المستوى الأعلى يكشفه ذلك registrar.

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

استخدم `commands` وحدها فقط عندما لا تحتاج إلى تسجيل كسول في CLI الجذرية.
وما يزال مسار التوافق eager هذا مدعومًا، لكنه لا يثبت
عناصر placeholder مدعومة بـ descriptor من أجل التحميل الكسول وقت التحليل.

### تسجيل واجهة CLI الخلفية

يتيح `api.registerCliBackend(...)` للـ plugin امتلاك الإعداد الافتراضي لواجهة
AI CLI خلفية محلية مثل `codex-cli`.

- يصبح `id` الخاصة بالواجهة الخلفية هي بادئة المزوّد في مراجع النماذج مثل `codex-cli/gpt-5`.
- يستخدم `config` الخاصة بالواجهة الخلفية البنية نفسها التي تستخدمها `agents.defaults.cliBackends.<id>`.
- يظل إعداد المستخدم هو الفائز. يدمج OpenClaw القيمة `agents.defaults.cliBackends.<id>` فوق
  القيمة الافتراضية الخاصة بالـ plugin قبل تشغيل CLI.
- استخدم `normalizeConfig` عندما تحتاج واجهة خلفية إلى إعادة كتابة توافقية بعد الدمج
  (مثل تسوية أشكال الأعلام القديمة).

### الخانات الحصرية

| الطريقة                                    | ما الذي تسجله                                                                                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | محرك السياق (واحد فقط نشط في كل مرة). يتلقى callback الخاص بـ `assemble()` القيمتين `availableTools` و`citationsMode` حتى يتمكن المحرك من تخصيص الإضافات على المطالبة. |
| `api.registerMemoryCapability(capability)` | قدرة ذاكرة موحدة                                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | منشئ قسم مطالبة الذاكرة                                                                                                                                   |
| `api.registerMemoryFlushPlan(resolver)`    | محلل خطة flush الخاصة بالذاكرة                                                                                                                            |
| `api.registerMemoryRuntime(runtime)`       | مهايئ وقت تشغيل الذاكرة                                                                                                                                   |

### مهايئات embedding الخاصة بالذاكرة

| الطريقة                                        | ما الذي تسجله                                 |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | مهايئ embedding للذاكرة من أجل plugin النشطة |

- `registerMemoryCapability` هي API المفضلة الحصرية الخاصة بـ plugin الذاكرة.
- يمكن لـ `registerMemoryCapability` أيضًا كشف `publicArtifacts.listArtifacts(...)`
  حتى تتمكن plugins المصاحبة من استهلاك عناصر الذاكرة المصدرة عبر
  `openclaw/plugin-sdk/memory-host-core` بدلًا من الوصول إلى التخطيط الخاص
  بplugin ذاكرة محددة.
- تمثل `registerMemoryPromptSection` و`registerMemoryFlushPlan` و
  `registerMemoryRuntime` واجهات API حصرية متوافقة مع الذاكرة القديمة.
- يتيح `registerMemoryEmbeddingProvider` لـ plugin الذاكرة النشطة تسجيل
  معرّف واحد أو أكثر لمهايئ embedding (مثل `openai` أو `gemini` أو معرّف
  مخصص تعرّفه plugin).
- تتحلل إعدادات المستخدم مثل `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` مقابل معرّفات المهايئات المسجلة تلك.

### الأحداث ودورة الحياة

| الطريقة                                      | ما الذي تفعله             |
| -------------------------------------------- | ------------------------- |
| `api.on(hookName, handler, opts?)`           | hook لدورة حياة typed     |
| `api.onConversationBindingResolved(handler)` | callback لحل ربط المحادثة |

### دلالات قرار hook

- `before_tool_call`: تؤدي إعادة `{ block: true }` إلى قرار نهائي. وبمجرد أن يضبطها أي معالج، يتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: تُعامل إعادة `{ block: false }` على أنها بلا قرار (مثل حذف `block`) وليست تجاوزًا.
- `before_install`: تؤدي إعادة `{ block: true }` إلى قرار نهائي. وبمجرد أن يضبطها أي معالج، يتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_install`: تُعامل إعادة `{ block: false }` على أنها بلا قرار (مثل حذف `block`) وليست تجاوزًا.
- `reply_dispatch`: تؤدي إعادة `{ handled: true, ... }` إلى قرار نهائي. وبمجرد أن يدّعي أي معالج أنه تعامل مع الإرسال، يتم تخطي المعالجات ذات الأولوية الأدنى ومسار الإرسال الافتراضي للنموذج.
- `message_sending`: تؤدي إعادة `{ cancel: true }` إلى قرار نهائي. وبمجرد أن يضبطها أي معالج، يتم تخطي المعالجات ذات الأولوية الأدنى.
- `message_sending`: تُعامل إعادة `{ cancel: false }` على أنها بلا قرار (مثل حذف `cancel`) وليست تجاوزًا.
- `message_received`: استخدم الحقل typed `threadId` عندما تحتاج إلى توجيه thread/topic الوارد. واحتفظ بـ `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: استخدم حقول التوجيه typed `replyToId` / `threadId` قبل الرجوع إلى `metadata` الخاصة بالقناة.
- `gateway_start`: استخدم `ctx.config` و`ctx.workspaceDir` و`ctx.getCron?.()` لحالة بدء التشغيل المملوكة لـ gateway بدلًا من الاعتماد على hooks الداخلية `gateway:startup`.

### حقول كائن API

| الحقل                    | النوع                     | الوصف                                                                                           |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | معرّف Plugin                                                                                   |
| `api.name`               | `string`                  | اسم العرض                                                                                       |
| `api.version`            | `string?`                 | إصدار Plugin (اختياري)                                                                          |
| `api.description`        | `string?`                 | وصف Plugin (اختياري)                                                                            |
| `api.source`             | `string`                  | مسار مصدر Plugin                                                                                |
| `api.rootDir`            | `string?`                 | الدليل الجذري لـ Plugin (اختياري)                                                               |
| `api.config`             | `OpenClawConfig`          | لقطة الإعداد الحالية (لقطة وقت التشغيل النشطة داخل الذاكرة عند توفرها)                          |
| `api.pluginConfig`       | `Record<string, unknown>` | إعداد خاص بالـ Plugin من `plugins.entries.<id>.config`                                          |
| `api.runtime`            | `PluginRuntime`           | [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | مسجل محدد النطاق (`debug`, `info`, `warn`, `error`)                                             |
| `api.registrationMode`   | `PluginRegistrationMode`  | وضع التحميل الحالي؛ وتمثل `"setup-runtime"` نافذة بدء تشغيل/إعداد خفيفة قبل تحميل الإدخال الكامل |
| `api.resolvePath(input)` | `(string) => string`      | تحليل المسار نسبةً إلى جذر Plugin                                                               |

## اصطلاح الوحدات الداخلية

داخل Plugin الخاصة بك، استخدم ملفات barrel محلية للاستيرادات الداخلية:

```text
my-plugin/
  api.ts            # صادرات عامة للمستهلكين الخارجيين
  runtime-api.ts    # صادرات داخلية فقط لوقت التشغيل
  index.ts          # نقطة إدخال Plugin
  setup-entry.ts    # إدخال خفيف للإعداد فقط (اختياري)
```

<Warning>
  لا تستورد Plugin الخاصة بك أبدًا عبر `openclaw/plugin-sdk/<your-plugin>`
  من شيفرة الإنتاج. وجّه الاستيرادات الداخلية عبر `./api.ts` أو
  `./runtime-api.ts`. فمسار SDK هو العقد الخارجي فقط.
</Warning>

تفضّل الأسطح العامة للـ bundled plugin المحمّلة عبر facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`، وملفات الإدخال العامة المشابهة) استخدام
لقطة إعداد وقت التشغيل النشطة عندما يكون OpenClaw قيد التشغيل بالفعل. وإذا لم توجد
لقطة وقت تشغيل بعد، فإنها تعود إلى ملف الإعداد المحلّل على القرص.

يمكن لـ Provider Plugins كشف barrel محلي ضيق للعقد إذا كان
المساعد خاصًا عمدًا بالمزوّد ولا ينتمي بعد إلى مسار فرعي عام في SDK.
أمثلة مضمّنة:

- **Anthropic**: الحد الفاصل العام `api.ts` / `contract-api.ts` الخاص
  بمساعدات Claude beta-header و`service_tier` streams.
- **`@openclaw/openai-provider`**: يصدّر `api.ts` بُناة المزوّد،
  ومساعدات النماذج الافتراضية، وبُناة مزوّدي realtime.
- **`@openclaw/openrouter-provider`**: يصدّر `api.ts` باني المزوّد
  بالإضافة إلى مساعدات onboarding/config.

<Warning>
  يجب على شيفرة الإنتاج الخاصة بالامتدادات أيضًا تجنب استيرادات
  `openclaw/plugin-sdk/<other-plugin>`. وإذا كان المساعد مشتركًا فعلًا، فقم
  بترقيته إلى مسار فرعي محايد في SDK مثل `openclaw/plugin-sdk/speech` أو
  `.../provider-model-shared` أو سطح آخر موجّه حسب القدرة بدلًا من
  ربط pluginين معًا.
</Warning>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/ar/plugins/sdk-entrypoints">
    خيارات `definePluginEntry` و`defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/ar/plugins/sdk-runtime">
    المرجع الكامل لمساحة الأسماء `api.runtime`.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/ar/plugins/sdk-setup">
    التعبئة، وmanifestات، ومخططات الإعداد.
  </Card>
  <Card title="Testing" icon="vial" href="/ar/plugins/sdk-testing">
    أدوات الاختبار وقواعد lint.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/ar/plugins/sdk-migration">
    الترحيل من الأسطح المهملة.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/ar/plugins/architecture">
    التعمق في البنية ونموذج القدرات.
  </Card>
</CardGroup>
