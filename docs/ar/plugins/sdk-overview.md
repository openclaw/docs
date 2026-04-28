---
read_when:
    - تحتاج إلى معرفة المسار الفرعي في SDK الذي يجب الاستيراد منه
    - تريد مرجعًا لجميع أساليب التسجيل في OpenClawPluginApi
    - أنت تبحث عن عنصر تصدير محدد في SDK
sidebarTitle: SDK overview
summary: خريطة الاستيراد، ومرجع واجهة برمجة تطبيقات التسجيل، ومعمارية SDK
title: نظرة عامة على Plugin SDK
x-i18n:
    generated_at: "2026-04-25T13:54:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 825efe8d9b2283734730348f9803e40cabaaa6399993648f4bb5822b20e588ee
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK هو العقد المعرّف بالأنواع بين Plugins والنواة. هذه الصفحة هي
المرجع الخاص بـ **ما الذي يجب استيراده** و**ما الذي يمكنك تسجيله**.

<Tip>
  هل تبحث عن دليل إرشادي بدلًا من ذلك؟

- أول Plugin؟ ابدأ من [بناء Plugins](/ar/plugins/building-plugins).
- Plugin قناة؟ راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins).
- Plugin مزود؟ راجع [Plugins المزودين](/ar/plugins/sdk-provider-plugins).
- Plugin أداة أو خطاف دورة حياة؟ راجع [خطافات Plugin](/ar/plugins/hooks).

</Tip>

## اصطلاح الاستيراد

استورد دائمًا من مسار فرعي محدد:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

كل مسار فرعي هو وحدة صغيرة مستقلة بذاتها. هذا يحافظ على سرعة بدء التشغيل
ويمنع مشكلات التبعيات الدائرية. بالنسبة إلى مساعدات الإدخال/البناء الخاصة
بالقنوات، يُفضّل استخدام `openclaw/plugin-sdk/channel-core`؛ واحتفظ بـ `openclaw/plugin-sdk/core`
للسطح المظلي الأوسع والمساعدات المشتركة مثل
`buildChannelConfigSchema`.

بالنسبة إلى إعدادات القناة، انشر JSON Schema المملوكة للقناة عبر
`openclaw.plugin.json#channelConfigs`. المسار الفرعي `plugin-sdk/channel-config-schema`
مخصص للعناصر الأولية المشتركة للمخطط والباني العام. وأي عمليات تصدير للمخططات
تسمى بأسماء قنوات مضمّنة على ذلك المسار الفرعي هي عمليات تصدير توافقية قديمة،
وليست نمطًا للPlugins الجديدة.

<Warning>
  لا تستورد مسارات الراحة الموسومة باسم مزود أو قناة (على سبيل المثال
  `openclaw/plugin-sdk/slack`، `.../discord`، `.../signal`، `.../whatsapp`).
  تقوم Plugins المضمّنة بتركيب المسارات الفرعية العامة لـ SDK داخل حاويات
  `api.ts` / `runtime-api.ts` الخاصة بها؛ ويجب على مستهلكي النواة إما استخدام
  تلك الحاويات المحلية الخاصة بـ Plugin أو إضافة عقد SDK عام ضيق عندما تكون
  الحاجة فعلًا عابرة للقنوات.

لا تزال مجموعة صغيرة من مسارات المساعدة الخاصة بالPlugins المضمّنة (`plugin-sdk/feishu`،
`plugin-sdk/zalo`، `plugin-sdk/matrix*`، وما شابهها) تظهر في
خريطة التصدير المولدة. وهي موجودة فقط لصيانة Plugins المضمّنة وليست
مسارات استيراد موصى بها لPlugins الخارجية الجديدة.
</Warning>

## مرجع المسارات الفرعية

يُعرَض Plugin SDK كمجموعة من المسارات الفرعية الضيقة المجمعة حسب المجال (إدخال
Plugin، القناة، المزود، المصادقة، وقت التشغيل، الإمكانية، الذاكرة، ومساعدات
Plugins المضمّنة المحجوزة). للاطلاع على الفهرس الكامل — مجمّعًا ومرتبطًا —
راجع [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths).

توجد القائمة المولدة التي تضم أكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`.

## واجهة برمجة تطبيقات التسجيل

يستقبل رد النداء `register(api)` كائن `OpenClawPluginApi` بهذه
الأساليب:

### تسجيل الإمكانيات

| الأسلوب                                           | ما الذي يسجله                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | الاستدلال النصي (LLM)                  |
| `api.registerAgentHarness(...)`                  | منفذ عامل منخفض المستوى تجريبي |
| `api.registerCliBackend(...)`                    | واجهة خلفية محلية لاستدلال CLI           |
| `api.registerChannel(...)`                       | قناة مراسلة                     |
| `api.registerSpeechProvider(...)`                | تحويل النص إلى كلام / تركيب STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | النسخ الفوري المتدفق      |
| `api.registerRealtimeVoiceProvider(...)`         | جلسات صوتية فورية ثنائية الاتجاه        |
| `api.registerMediaUnderstandingProvider(...)`    | تحليل الصور/الصوت/الفيديو            |
| `api.registerImageGenerationProvider(...)`       | توليد الصور                      |
| `api.registerMusicGenerationProvider(...)`       | توليد الموسيقى                      |
| `api.registerVideoGenerationProvider(...)`       | توليد الفيديو                      |
| `api.registerWebFetchProvider(...)`              | مزود جلب / كشط الويب           |
| `api.registerWebSearchProvider(...)`             | البحث على الويب                            |

### الأدوات والأوامر

| الأسلوب                          | ما الذي يسجله                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | أداة العامل (مطلوبة أو `{ optional: true }`) |
| `api.registerCommand(def)`      | أمر مخصص (يتجاوز LLM)             |

### البنية التحتية

| الأسلوب                                         | ما الذي يسجله                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | خطاف حدث                              |
| `api.registerHttpRoute(params)`                | نقطة نهاية HTTP في Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | أسلوب RPC في Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | معلن اكتشاف Gateway محلي      |
| `api.registerCli(registrar, opts?)`            | أمر فرعي في CLI                          |
| `api.registerService(service)`                 | خدمة في الخلفية                      |
| `api.registerInteractiveHandler(registration)` | معالج تفاعلي                     |
| `api.registerAgentToolResultMiddleware(...)`   | برمجية وسيطة لنتيجة الأداة في وقت التشغيل          |
| `api.registerMemoryPromptSupplement(builder)`  | قسم إضافي ملاصق لذاكرة الموجّه |
| `api.registerMemoryCorpusSupplement(adapter)`  | متن إضافي للبحث/القراءة في الذاكرة      |

<Note>
  تظل مساحات أسماء إدارة النواة المحجوزة (`config.*`، `exec.approvals.*`، `wizard.*`،
  `update.*`) دائمًا `operator.admin`، حتى إذا حاول Plugin تعيين
  نطاق أضيق لأسلوب Gateway. ويفضل استخدام بادئات خاصة بالPlugin للأساليب
  التي يملكها Plugin.
</Note>

<Accordion title="متى تستخدم البرمجية الوسيطة لنتيجة الأداة">
  يمكن للPlugins المضمّنة استخدام `api.registerAgentToolResultMiddleware(...)` عندما
  تحتاج إلى إعادة كتابة نتيجة أداة بعد التنفيذ وقبل أن يعيد وقت التشغيل
  تمرير تلك النتيجة إلى النموذج. هذا هو المسار الموثوق والمحايد لوقت التشغيل
  لمخففات المخرجات غير المتزامنة مثل tokenjuice.

يجب على Plugins المضمّنة التصريح بـ `contracts.agentToolResultMiddleware` لكل
وقت تشغيل مستهدف، على سبيل المثال `["pi", "codex"]`. لا يمكن
للPlugins الخارجية تسجيل هذه البرمجية الوسيطة؛ احتفظ بخطافات OpenClaw Plugin العادية للأعمال
التي لا تحتاج إلى توقيت نتيجة الأداة قبل النموذج. وقد تمت إزالة مسار تسجيل
مصنع الامتدادات المضمّنة القديم الخاص بـ Pi فقط.
</Accordion>

### تسجيل اكتشاف Gateway

يتيح `api.registerGatewayDiscoveryService(...)` لـ Plugin الإعلان عن
Gateway النشط على وسيط اكتشاف محلي مثل mDNS/Bonjour. يستدعي OpenClaw
الخدمة أثناء بدء تشغيل Gateway عندما يكون الاكتشاف المحلي مفعّلًا، ويمرر
منافذ Gateway الحالية وبيانات تلميحات TXT غير السرية، ويستدعي معالج
`stop` المعاد أثناء إيقاف تشغيل Gateway.

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

يجب ألا تتعامل Plugins اكتشاف Gateway مع قيم TXT المُعلَن عنها على أنها أسرار أو
مصادقة. الاكتشاف هو تلميح توجيه؛ وما تزال مصادقة Gateway وتثبيت TLS هما
المسؤولين عن الثقة.

### بيانات التسجيل الوصفية لـ CLI

يقبل `api.registerCli(registrar, opts?)` نوعين من البيانات الوصفية على المستوى الأعلى:

- `commands`: جذور أوامر صريحة يملكها المسجّل
- `descriptors`: واصفات أوامر وقت التحليل المستخدمة لمساعدة CLI الجذرية،
  والتوجيه، وتسجيل CLI الكسول الخاص بالPlugin

إذا أردت أن يبقى أمر Plugin محمّلًا كسولًا في مسار CLI الجذري العادي،
فقدّم `descriptors` تغطي كل جذر أمر من المستوى الأعلى يعرضه
ذلك المسجّل.

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
        description: "إدارة حسابات Matrix، والتحقق، والأجهزة، وحالة الملف الشخصي",
        hasSubcommands: true,
      },
    ],
  },
);
```

استخدم `commands` وحده فقط عندما لا تحتاج إلى تسجيل CLI جذري كسول.
لا يزال مسار التوافق المتلهف هذا مدعومًا، لكنه لا يثبّت عناصر نائبة
مدعومة بالواصفات من أجل التحميل الكسول في وقت التحليل.

### تسجيل الواجهة الخلفية لـ CLI

يتيح `api.registerCliBackend(...)` لـ Plugin امتلاك الإعداد الافتراضي
لواجهة خلفية محلية لـ CLI للذكاء الاصطناعي مثل `codex-cli`.

- يصبح `id` للواجهة الخلفية بادئة المزود في مراجع النماذج مثل `codex-cli/gpt-5`.
- يستخدم `config` للواجهة الخلفية نفس البنية الموجودة في `agents.defaults.cliBackends.<id>`.
- يبقى إعداد المستخدم هو الحاسم. يدمج OpenClaw `agents.defaults.cliBackends.<id>` فوق
  الإعداد الافتراضي للPlugin قبل تشغيل CLI.
- استخدم `normalizeConfig` عندما تحتاج الواجهة الخلفية إلى إعادة كتابات توافقية بعد الدمج
  (مثلًا توحيد أشكال العلامات القديمة).

### الفتحات الحصرية

| الأسلوب                                     | ما الذي يسجله                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | محرك سياق (واحد فقط نشط في كل مرة). يتلقى رد النداء `assemble()` القيمتين `availableTools` و`citationsMode` حتى يتمكن المحرك من تخصيص إضافات الموجّه. |
| `api.registerMemoryCapability(capability)` | إمكانية ذاكرة موحدة                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | باني قسم موجّه الذاكرة                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | محلل خطة تفريغ الذاكرة                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | مهايئ وقت تشغيل الذاكرة                                                                                                                                    |

### مهايئات تضمين الذاكرة

| الأسلوب                                         | ما الذي يسجله                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | مهايئ تضمين الذاكرة للPlugin النشط |

- `registerMemoryCapability` هو واجهة API المفضلة والحصرية لـ Plugin الذاكرة.
- قد يعرض `registerMemoryCapability` أيضًا `publicArtifacts.listArtifacts(...)`
  حتى تتمكن Plugins المرافقة من استهلاك العناصر المُصدَّرة الخاصة بالذاكرة عبر
  `openclaw/plugin-sdk/memory-host-core` بدلًا من الوصول إلى التخطيط
  الخاص الداخلي لإحدى Plugins الذاكرة.
- `registerMemoryPromptSection` و`registerMemoryFlushPlan` و
  `registerMemoryRuntime` هي واجهات API حصرية ومتوافقة مع الأنظمة القديمة لـ Plugins الذاكرة.
- يتيح `registerMemoryEmbeddingProvider` لـ Plugin الذاكرة النشط تسجيل
  معرف مهايئ تضمين واحد أو أكثر (مثل `openai` أو `gemini` أو معرف
  مخصص يعرّفه Plugin).
- يُحل إعداد المستخدم مثل `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` بالرجوع إلى معرفات المهايئات
  المسجلة تلك.

### الأحداث ودورة الحياة

| الأسلوب                                       | ما الذي يفعله                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | خطاف دورة حياة معرّف الأنواع          |
| `api.onConversationBindingResolved(handler)` | رد نداء ربط المحادثة |

راجع [خطافات Plugin](/ar/plugins/hooks) للاطلاع على الأمثلة، وأسماء الخطافات الشائعة، ودلالات
الحراسة.

### دلالات قرار الخطاف

- `before_tool_call`: تكون إعادة `{ block: true }` نهائية. وبمجرد أن يضبطها أي معالج، يتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: تُعامل إعادة `{ block: false }` على أنها بلا قرار (مثل حذف `block`)، وليست تجاوزًا.
- `before_install`: تكون إعادة `{ block: true }` نهائية. وبمجرد أن يضبطها أي معالج، يتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_install`: تُعامل إعادة `{ block: false }` على أنها بلا قرار (مثل حذف `block`)، وليست تجاوزًا.
- `reply_dispatch`: تكون إعادة `{ handled: true, ... }` نهائية. وبمجرد أن يدّعي أي معالج الإرسال، يتم تخطي المعالجات ذات الأولوية الأدنى ومسار إرسال النموذج الافتراضي.
- `message_sending`: تكون إعادة `{ cancel: true }` نهائية. وبمجرد أن يضبطها أي معالج، يتم تخطي المعالجات ذات الأولوية الأدنى.
- `message_sending`: تُعامل إعادة `{ cancel: false }` على أنها بلا قرار (مثل حذف `cancel`)، وليست تجاوزًا.
- `message_received`: استخدم الحقل المعرّف بالأنواع `threadId` عندما تحتاج إلى توجيه سلسلة الرسائل/الموضوع الوارد. واحتفظ بـ `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: استخدم حقول التوجيه المعرّفة بالأنواع `replyToId` / `threadId` قبل الرجوع إلى `metadata` الخاصة بالقناة.
- `gateway_start`: استخدم `ctx.config` و`ctx.workspaceDir` و`ctx.getCron?.()` لحالة بدء التشغيل المملوكة لـ Gateway بدلًا من الاعتماد على خطافات `gateway:startup` الداخلية.

### حقول كائن API

| الحقل                    | النوع                      | الوصف                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | معرف Plugin                                                                                   |
| `api.name`               | `string`                  | اسم العرض                                                                                |
| `api.version`            | `string?`                 | إصدار Plugin (اختياري)                                                                   |
| `api.description`        | `string?`                 | وصف Plugin (اختياري)                                                               |
| `api.source`             | `string`                  | مسار مصدر Plugin                                                                          |
| `api.rootDir`            | `string?`                 | الدليل الجذري لـ Plugin (اختياري)                                                            |
| `api.config`             | `OpenClawConfig`          | لقطة الإعداد الحالية (لقطة وقت التشغيل النشطة داخل الذاكرة عند توفرها)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | إعداد خاص بـ Plugin من `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | مسجل بنطاق محدد (`debug`، `info`، `warn`، `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | وضع التحميل الحالي؛ تمثل `"setup-runtime"` نافذة البدء/الإعداد الخفيفة السابقة للإدخال الكامل |
| `api.resolvePath(input)` | `(string) => string`      | حل المسار نسبةً إلى جذر Plugin                                                        |

## اصطلاح الوحدة الداخلية

داخل Plugin الخاص بك، استخدم ملفات barrel محلية لعمليات الاستيراد الداخلية:

```
my-plugin/
  api.ts            # صادرات عامة للمستهلكين الخارجيين
  runtime-api.ts    # صادرات داخلية فقط لوقت التشغيل
  index.ts          # نقطة إدخال Plugin
  setup-entry.ts    # إدخال خفيف للإعداد فقط (اختياري)
```

<Warning>
  لا تستورد Plugin الخاص بك أبدًا عبر `openclaw/plugin-sdk/<your-plugin>`
  من كود الإنتاج. وجّه عمليات الاستيراد الداخلية عبر `./api.ts` أو
  `./runtime-api.ts`. مسار SDK هو العقد الخارجي فقط.
</Warning>

تُفضّل الأسطح العامة للPlugins المضمّنة المحمّلة عبر الواجهة (`api.ts` و`runtime-api.ts`،
و`index.ts` و`setup-entry.ts` وملفات الإدخال العامة المشابهة) لقطة
إعدادات وقت التشغيل النشطة عندما يكون OpenClaw قيد التشغيل بالفعل. وإذا لم تكن
لقطة وقت التشغيل موجودة بعد، فإنها تعود إلى ملف الإعدادات المحلول على القرص.

يمكن لـ Plugins المزودين عرض barrel محلي ضيق للعقد عندما تكون إحدى
المساعدات خاصة بالمزود عن قصد ولا تنتمي بعد إلى مسار فرعي عام في SDK.
أمثلة مضمّنة:

- **Anthropic**: مسار عام `api.ts` / `contract-api.ts` لمساعدات تدفق
  رأس Claude التجريبي و`service_tier`.
- **`@openclaw/openai-provider`**: يصدّر `api.ts` بناة المزود،
  ومساعدات النموذج الافتراضي، وبناة مزود الوقت الفعلي.
- **`@openclaw/openrouter-provider`**: يصدّر `api.ts` باني المزود
  بالإضافة إلى مساعدات الإعداد/التهيئة.

<Warning>
  يجب أن يتجنب كود الإنتاج في الامتدادات أيضًا عمليات الاستيراد من `openclaw/plugin-sdk/<other-plugin>`.
  وإذا كانت إحدى المساعدات مشتركة فعلًا، فانقلها إلى مسار فرعي محايد في SDK
  مثل `openclaw/plugin-sdk/speech` أو `.../provider-model-shared` أو إلى سطح آخر
  موجّه حسب الإمكانية بدلًا من ربط Pluginين معًا.
</Warning>

## ذو صلة

<CardGroup cols={2}>
  <Card title="نقاط الإدخال" icon="door-open" href="/ar/plugins/sdk-entrypoints">
    خيارات `definePluginEntry` و`defineChannelPluginEntry`.
  </Card>
  <Card title="مساعدات وقت التشغيل" icon="gears" href="/ar/plugins/sdk-runtime">
    المرجع الكامل لمساحة الأسماء `api.runtime`.
  </Card>
  <Card title="الإعداد والتهيئة" icon="sliders" href="/ar/plugins/sdk-setup">
    الحزم وملفات البيان ومخططات الإعدادات.
  </Card>
  <Card title="الاختبار" icon="vial" href="/ar/plugins/sdk-testing">
    أدوات الاختبار وقواعد lint.
  </Card>
  <Card title="ترحيل SDK" icon="arrows-turn-right" href="/ar/plugins/sdk-migration">
    الترحيل من الأسطح المتقادمة.
  </Card>
  <Card title="البنية الداخلية للPlugin" icon="diagram-project" href="/ar/plugins/architecture">
    المعمارية العميقة ونموذج الإمكانيات.
  </Card>
</CardGroup>
