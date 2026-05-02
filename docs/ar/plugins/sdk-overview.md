---
read_when:
    - تحتاج إلى معرفة المسار الفرعي في SDK الذي يجب الاستيراد منه
    - تريد مرجعًا لجميع أساليب التسجيل في OpenClawPluginApi
    - أنت تبحث عن تصدير محدد في SDK
sidebarTitle: Plugin SDK overview
summary: خريطة الاستيراد، ومرجع واجهة برمجة تطبيقات التسجيل، وبنية حزمة تطوير البرمجيات
title: نظرة عامة على Plugin SDK
x-i18n:
    generated_at: "2026-05-02T07:38:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5fa531e603fb6d87f84e3193ebd61be1431b57b8f284871ae15f34ca93fc69
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK الخاص بالـ Plugin هو العقد المطبوع بين Plugins والنواة. هذه الصفحة هي
مرجع **ما يجب استيراده** و**ما يمكنك تسجيله**.

<Note>
  هذه الصفحة مخصصة لمؤلفي Plugins الذين يستخدمون `openclaw/plugin-sdk/*` داخل
  OpenClaw. بالنسبة للتطبيقات الخارجية، والسكربتات، ولوحات المعلومات، ومهام CI، وامتدادات IDE
  التي تريد تشغيل الوكلاء عبر Gateway، استخدم
  [SDK تطبيق OpenClaw](/ar/concepts/openclaw-sdk) وحزمة `@openclaw/sdk`
  بدلا من ذلك.
</Note>

<Tip>
هل تبحث عن دليل إرشادي بدلا من ذلك؟ ابدأ بـ [بناء Plugins](/ar/plugins/building-plugins)، واستخدم [Plugins القنوات](/ar/plugins/sdk-channel-plugins) لـ Plugins القنوات، و[Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) لـ Plugins المزوّدين، و[خطافات Plugin](/ar/plugins/hooks) لـ Plugins خطافات الأدوات أو دورة الحياة.
</Tip>

## عرف الاستيراد

استورد دائما من مسار فرعي محدد:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

كل مسار فرعي هو وحدة صغيرة ومستقلة بذاتها. يحافظ ذلك على سرعة بدء التشغيل
ويمنع مشكلات الاعتماد الدائري. بالنسبة لمساعدات إدخال/بناء الخاصة بالقنوات،
فضّل `openclaw/plugin-sdk/channel-core`؛ واحتفظ بـ `openclaw/plugin-sdk/core` من أجل
السطح الأوسع والمساعدات المشتركة مثل
`buildChannelConfigSchema`.

بالنسبة لإعدادات القناة، انشر JSON Schema المملوك للقناة عبر
`openclaw.plugin.json#channelConfigs`. المسار الفرعي `plugin-sdk/channel-config-schema`
مخصص لأساسيات المخطط المشتركة والباني العام. تستخدم Plugins المضمنة في OpenClaw
`plugin-sdk/bundled-channel-config-schema` لمخططات القنوات المضمنة المحتفظ بها.
تبقى صادرات التوافق المهملة على
`plugin-sdk/channel-config-schema-legacy`؛ ولا يمثل أي من مساري مخططات القنوات المضمنة
نمطا لـ Plugins الجديدة.

<Warning>
  لا تستورد واجهات التسهيل ذات العلامة الخاصة بالمزوّدين أو القنوات (على سبيل المثال
  `openclaw/plugin-sdk/slack`، و`.../discord`، و`.../signal`، و`.../whatsapp`).
  تؤلف Plugins المضمنة مسارات SDK الفرعية العامة داخل حزم `api.ts` /
  `runtime-api.ts` المحلية الخاصة بها؛ يجب على مستهلكي النواة إما استخدام تلك الحزم المحلية للـ Plugin
  أو إضافة عقد SDK عام ضيق عندما تكون الحاجة عابرة للقنوات حقا.

ما زالت مجموعة صغيرة من واجهات مساعدات Plugins المضمنة تظهر في خريطة التصدير المولدة
عندما يكون لديها استخدام مالك متتبع. وهي موجودة لصيانة Plugins المضمنة فقط
ولا يوصى بها كمسارات استيراد لـ Plugins الطرف الثالث الجديدة.

يتم أيضا الاحتفاظ بـ `openclaw/plugin-sdk/discord` و`openclaw/plugin-sdk/telegram-account`
كواجهات توافق مهملة لاستخدام المالك المتتبع. لا
تنسخ مسارات الاستيراد هذه إلى Plugins جديدة؛ استخدم مساعدات وقت التشغيل المحقونة
ومسارات SDK العامة الخاصة بالقنوات بدلا من ذلك.
</Warning>

## مرجع المسارات الفرعية

يتم عرض SDK الخاص بالـ Plugin كمجموعة من المسارات الفرعية الضيقة المجمعة حسب المجال (إدخال Plugin،
والقناة، والمزوّد، والمصادقة، ووقت التشغيل، والقدرات، والذاكرة، ومساعدات Plugins المضمنة
المحجوزة). للاطلاع على الفهرس الكامل، مجمعا ومربوطا، راجع
[مسارات SDK الخاصة بالـ Plugin الفرعية](/ar/plugins/sdk-subpaths).

توجد القائمة المولدة لأكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`.

## API التسجيل

تتلقى دالة رد النداء `register(api)` كائن `OpenClawPluginApi` يحتوي على هذه
الطرق:

### تسجيل القدرات

| الطريقة                                           | ما تسجله                              |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | استدلال نصي (LLM)                     |
| `api.registerAgentHarness(...)`                  | منفذ وكيل منخفض المستوى تجريبي        |
| `api.registerCliBackend(...)`                    | خلفية استدلال CLI محلية               |
| `api.registerChannel(...)`                       | قناة مراسلة                           |
| `api.registerSpeechProvider(...)`                | تركيب تحويل النص إلى كلام / STT       |
| `api.registerRealtimeTranscriptionProvider(...)` | نسخ فوري متدفق                        |
| `api.registerRealtimeVoiceProvider(...)`         | جلسات صوت فورية ثنائية الاتجاه        |
| `api.registerMediaUnderstandingProvider(...)`    | تحليل الصور/الصوت/الفيديو             |
| `api.registerImageGenerationProvider(...)`       | توليد الصور                           |
| `api.registerMusicGenerationProvider(...)`       | توليد الموسيقى                        |
| `api.registerVideoGenerationProvider(...)`       | توليد الفيديو                         |
| `api.registerWebFetchProvider(...)`              | مزوّد جلب الويب / الكشط               |
| `api.registerWebSearchProvider(...)`             | بحث الويب                             |

### الأدوات والأوامر

| الطريقة                         | ما تسجله                                      |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | أداة وكيل (مطلوبة أو `{ optional: true }`)    |
| `api.registerCommand(def)`      | أمر مخصص (يتجاوز LLM)                         |

يمكن لأوامر Plugin تعيين `agentPromptGuidance` عندما يحتاج الوكيل إلى تلميح توجيه قصير
مملوك للأمر. أبق ذلك النص متعلقا بالأمر نفسه؛ لا تضف
سياسة خاصة بمزوّد أو Plugin إلى بُناة الموجهات في النواة.

### البنية التحتية

| الطريقة                                        | ما تسجله                                   |
| ---------------------------------------------- | ------------------------------------------ |
| `api.registerHook(events, handler, opts?)`     | خطاف حدث                                   |
| `api.registerHttpRoute(params)`                | نقطة نهاية HTTP في Gateway                 |
| `api.registerGatewayMethod(name, handler)`     | طريقة RPC في Gateway                       |
| `api.registerGatewayDiscoveryService(service)` | معلن اكتشاف Gateway محلي                   |
| `api.registerCli(registrar, opts?)`            | أمر فرعي في CLI                            |
| `api.registerService(service)`                 | خدمة خلفية                                 |
| `api.registerInteractiveHandler(registration)` | معالج تفاعلي                               |
| `api.registerAgentToolResultMiddleware(...)`   | وسيط نتائج أدوات وقت التشغيل               |
| `api.registerMemoryPromptSupplement(builder)`  | قسم موجه إضافي مجاور للذاكرة               |
| `api.registerMemoryCorpusSupplement(adapter)`  | مجموعة إضافية للبحث/القراءة في الذاكرة     |

### خطافات المضيف لـ Plugins سير العمل

خطافات المضيف هي واجهات SDK لـ Plugins التي تحتاج إلى المشاركة في دورة حياة المضيف
بدلا من مجرد إضافة مزوّد، أو قناة، أو أداة. إنها
عقود عامة؛ يمكن لوضع الخطة استخدامها، وكذلك سير عمل الموافقات،
وبوابات سياسة مساحة العمل، والمراقبات الخلفية، ومعالجات الإعداد، وPlugins مرافقة لواجهة المستخدم.

| الطريقة                                                                   | العقد الذي تملكه                                                                                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerSessionExtension(...)`                                      | حالة جلسة مملوكة للـ Plugin ومتوافقة مع JSON ومعروضة عبر جلسات Gateway                                                              |
| `api.enqueueNextTurnInjection(...)`                                      | سياق دائم ينفذ مرة واحدة بالضبط ويُحقن في دورة الوكيل التالية لجلسة واحدة                                                          |
| `api.registerTrustedToolPolicy(...)`                                     | سياسة أدوات ما قبل Plugin مضمّنة/موثوقة يمكنها حظر معاملات الأدوات أو إعادة كتابتها                                                |
| `api.registerToolMetadata(...)`                                          | بيانات وصفية لعرض فهرس الأدوات دون تغيير تنفيذ الأداة                                                                               |
| `api.registerCommand(...)`                                               | أوامر Plugin ذات نطاق؛ يمكن لنتائج الأمر تعيين `continueAgent: true`؛ تدعم أوامر Discord الأصلية `descriptionLocalizations`         |
| `api.registerControlUiDescriptor(...)`                                   | واصفات مساهمة واجهة التحكم لأسطح الجلسة أو الأداة أو التشغيل أو الإعدادات                                                           |
| `api.registerRuntimeLifecycle(...)`                                      | دوال تنظيف لموارد وقت التشغيل المملوكة للـ Plugin في مسارات إعادة الضبط/الحذف/إعادة التحميل                                        |
| `api.registerAgentEventSubscription(...)`                                | اشتراكات أحداث منقاة لحالة سير العمل والمراقبات                                                                                     |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | حالة مؤقتة لكل تشغيل خاصة بالـ Plugin تُمسح عند انتهاء دورة حياة التشغيل الطرفية                                                    |
| `api.registerSessionSchedulerJob(...)`                                   | سجلات مهام مجدول الجلسة المملوكة للـ Plugin مع تنظيف حتمي                                                                           |

تقسم العقود السلطة عمدا:

- يمكن لـ Plugins الخارجية امتلاك امتدادات الجلسة، وواصفات واجهة المستخدم، والأوامر، والبيانات الوصفية للأدوات، وحقن الدورة التالية، والخطافات العادية.
- تعمل سياسات الأدوات الموثوقة قبل خطافات `before_tool_call` العادية، وهي مخصصة للمضمنة فقط لأنها تشارك في سياسة أمان المضيف.
- ملكية الأوامر المحجوزة مخصصة للمضمنة فقط. يجب أن تستخدم Plugins الخارجية أسماء أوامرها أو ألقابها الخاصة.
- يعطل `allowPromptInjection=false` الخطافات التي تعدل الموجهات، بما في ذلك
  `agent_turn_prepare`، و`before_prompt_build`، و`heartbeat_prompt_contribution`،
  وحقول الموجه من `before_agent_start` القديم، و
  `enqueueNextTurnInjection`.

أمثلة على مستهلكين غير وضع الخطة:

| نمط Plugin                  | الخطافات المستخدمة                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| سير عمل موافقة              | امتداد الجلسة، متابعة الأمر، حقن الدورة التالية، واصف واجهة المستخدم                                                                  |
| بوابة سياسة الميزانية/مساحة العمل | سياسة الأدوات الموثوقة، البيانات الوصفية للأدوات، إسقاط الجلسة                                                                        |
| مراقب دورة حياة خلفي        | تنظيف دورة حياة وقت التشغيل، اشتراك أحداث الوكيل، ملكية/تنظيف مجدول الجلسة، مساهمة موجه Heartbeat، واصف واجهة المستخدم             |
| معالج إعداد أو تهيئة        | امتداد الجلسة، أوامر ذات نطاق، واصف واجهة التحكم                                                                                      |

<Note>
  تبقى مساحات أسماء الإدارة الأساسية المحجوزة (`config.*`، و`exec.approvals.*`، و`wizard.*`،
  و`update.*`) دائما `operator.admin`، حتى إذا حاول Plugin تعيين
  نطاق طريقة Gateway أضيق. فضّل البادئات الخاصة بالـ Plugin للطرق
  المملوكة للـ Plugin.
</Note>

<Accordion title="متى تستخدم وسيط نتائج الأدوات">
  يمكن لـ Plugins المضمنة استخدام `api.registerAgentToolResultMiddleware(...)` عندما
  تحتاج إلى إعادة كتابة نتيجة أداة بعد التنفيذ وقبل أن يعيد وقت التشغيل
  تغذية تلك النتيجة إلى النموذج. هذه هي الواجهة الموثوقة والمحايدة تجاه وقت التشغيل
  لمختزلات الإخراج غير المتزامنة مثل tokenjuice.

يجب أن تعلن Plugins المضمنة عن `contracts.agentToolResultMiddleware` لكل
وقت تشغيل مستهدف، على سبيل المثال `["pi", "codex"]`. لا يمكن لـ Plugins الخارجية
تسجيل هذا الوسيط؛ أبق خطافات OpenClaw Plugin العادية للأعمال
التي لا تحتاج إلى توقيت نتائج الأدوات قبل النموذج. تمت إزالة مسار تسجيل
مصنع الامتداد المضمن القديم الخاص بـ Pi فقط.
</Accordion>

### تسجيل اكتشاف Gateway

`api.registerGatewayDiscoveryService(...)` تتيح لـ Plugin الإعلان عن Gateway النشط
عبر ناقل اكتشاف محلي مثل mDNS/Bonjour. يستدعي OpenClaw الخدمة أثناء بدء تشغيل
Gateway عندما يكون الاكتشاف المحلي مفعلا، ويمرر منافذ Gateway الحالية وبيانات تلميح TXT غير السرية،
ويستدعي معالج `stop` الذي تم إرجاعه أثناء إيقاف Gateway.

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

يجب ألا تتعامل Plugins اكتشاف Gateway مع قيم TXT المعلنة كأسرار أو
مصادقة. الاكتشاف تلميح توجيه؛ ولا تزال مصادقة Gateway وتثبيت TLS
مسؤولين عن الثقة.

### بيانات تعريف تسجيل CLI

`api.registerCli(registrar, opts?)` تقبل نوعين من بيانات التعريف العلوية:

- `commands`: جذور أوامر صريحة يملكها المسجل
- `descriptors`: واصفات أوامر وقت التحليل المستخدمة لمساعدة CLI الجذرية،
  والتوجيه، وتسجيل CLI الخاص بـ Plugin بالتحميل الكسول

إذا كنت تريد أن يبقى أمر Plugin محملا كسولا في مسار CLI الجذري العادي،
فوفر `descriptors` تغطي كل جذر أمر علوي يعرّضه ذلك
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

استخدم `commands` وحدها فقط عندما لا تحتاج إلى تسجيل CLI جذري كسول.
يبقى مسار التوافق الشره هذا مدعوما، لكنه لا يثبت
عناصر نائبة مدعومة بالواصفات للتحميل الكسول وقت التحليل.

### تسجيل خلفية CLI

`api.registerCliBackend(...)` تتيح لـ Plugin امتلاك الإعداد الافتراضي لخلفية
CLI محلية للذكاء الاصطناعي مثل `codex-cli`.

- يصبح `id` الخاص بالخلفية بادئة المزود في مراجع النماذج مثل `codex-cli/gpt-5`.
- يستخدم `config` الخاص بالخلفية الشكل نفسه مثل `agents.defaults.cliBackends.<id>`.
- يظل إعداد المستخدم هو الفائز. يدمج OpenClaw `agents.defaults.cliBackends.<id>` فوق
  الإعداد الافتراضي لـ Plugin قبل تشغيل CLI.
- استخدم `normalizeConfig` عندما تحتاج الخلفية إلى إعادة كتابة توافقية بعد الدمج
  (على سبيل المثال، تطبيع أشكال الرايات القديمة).

### الخانات الحصرية

| الطريقة                                     | ما تسجله                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | محرك السياق (نشط واحد في كل مرة). يتلقى استدعاء `assemble()` قيمتي `availableTools` و`citationsMode` حتى يتمكن المحرك من تخصيص إضافات الموجه. |
| `api.registerMemoryCapability(capability)` | قدرة ذاكرة موحدة                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | باني قسم موجه الذاكرة                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | حال مخطط تفريغ الذاكرة                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | محول وقت تشغيل الذاكرة                                                                                                                                    |

### محولات تضمين الذاكرة

| الطريقة                                         | ما تسجله                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | محول تضمين الذاكرة لـ Plugin النشط |

- `registerMemoryCapability` هي API الحصرية المفضلة لـ Plugin الذاكرة.
- قد تعرض `registerMemoryCapability` أيضا `publicArtifacts.listArtifacts(...)`
  حتى تتمكن Plugins المرافقة من استهلاك آثار الذاكرة المصدرة عبر
  `openclaw/plugin-sdk/memory-host-core` بدلا من الوصول إلى التخطيط الخاص
  بـ Plugin ذاكرة محدد.
- `registerMemoryPromptSection` و`registerMemoryFlushPlan` و
  `registerMemoryRuntime` هي APIs حصرية متوافقة مع القديم لـ Plugin الذاكرة.
- يمكن لـ `MemoryFlushPlan.model` تثبيت دورة التفريغ على مرجع `provider/model`
  دقيق، مثل `ollama/qwen3:8b`، دون وراثة سلسلة الاحتياط النشطة.
- تتيح `registerMemoryEmbeddingProvider` لـ Plugin الذاكرة النشط تسجيل
  معرف محول تضمين واحد أو أكثر (على سبيل المثال `openai` أو `gemini` أو معرف
  مخصص يعرّفه Plugin).
- يتم حل إعداد المستخدم مثل `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` مقابل معرفات المحولات المسجلة هذه.

### الأحداث ودورة الحياة

| الطريقة                                       | ما تفعله                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | خطاف دورة حياة مضبوط النوع          |
| `api.onConversationBindingResolved(handler)` | استدعاء ربط المحادثة |

راجع [خطافات Plugin](/ar/plugins/hooks) للحصول على أمثلة، وأسماء الخطافات الشائعة، ودلالات الحراسة.

### دلالات قرار الخطاف

- `before_tool_call`: إرجاع `{ block: true }` نهائي. بمجرد أن يعيّنه أي معالج، يتم تخطي المعالجات الأقل أولوية.
- `before_tool_call`: إرجاع `{ block: false }` يعامل كعدم وجود قرار (مثل حذف `block`)، وليس كتجاوز.
- `before_install`: إرجاع `{ block: true }` نهائي. بمجرد أن يعيّنه أي معالج، يتم تخطي المعالجات الأقل أولوية.
- `before_install`: إرجاع `{ block: false }` يعامل كعدم وجود قرار (مثل حذف `block`)، وليس كتجاوز.
- `reply_dispatch`: إرجاع `{ handled: true, ... }` نهائي. بمجرد أن يطالب أي معالج بالإرسال، يتم تخطي المعالجات الأقل أولوية ومسار إرسال النموذج الافتراضي.
- `message_sending`: إرجاع `{ cancel: true }` نهائي. بمجرد أن يعيّنه أي معالج، يتم تخطي المعالجات الأقل أولوية.
- `message_sending`: إرجاع `{ cancel: false }` يعامل كعدم وجود قرار (مثل حذف `cancel`)، وليس كتجاوز.
- `message_received`: استخدم حقل `threadId` مضبوط النوع عندما تحتاج إلى توجيه السلاسل/المواضيع الواردة. أبق `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: استخدم حقول التوجيه مضبوطة النوع `replyToId` / `threadId` قبل الرجوع إلى `metadata` الخاصة بالقناة.
- `gateway_start`: استخدم `ctx.config` و`ctx.workspaceDir` و`ctx.getCron?.()` لحالة بدء التشغيل المملوكة لـ Gateway بدلا من الاعتماد على خطافات `gateway:startup` الداخلية.
- `cron_changed`: راقب تغييرات دورة حياة Cron المملوكة لـ Gateway. استخدم `event.job?.state?.nextRunAtMs` و`ctx.getCron?.()` عند مزامنة مجدولات الإيقاظ الخارجية، وأبق OpenClaw مصدر الحقيقة لفحوصات الاستحقاق والتنفيذ.

### حقول كائن API

| الحقل                    | النوع                      | الوصف                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | معرف Plugin                                                                                   |
| `api.name`               | `string`                  | اسم العرض                                                                                |
| `api.version`            | `string?`                 | إصدار Plugin (اختياري)                                                                   |
| `api.description`        | `string?`                 | وصف Plugin (اختياري)                                                               |
| `api.source`             | `string`                  | مسار مصدر Plugin                                                                          |
| `api.rootDir`            | `string?`                 | دليل جذر Plugin (اختياري)                                                            |
| `api.config`             | `OpenClawConfig`          | لقطة الإعداد الحالية (لقطة وقت التشغيل النشطة في الذاكرة عند توفرها)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | إعداد خاص بـ Plugin من `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | مسجل محدود النطاق (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | وضع التحميل الحالي؛ `"setup-runtime"` هي نافذة بدء التشغيل/الإعداد الخفيفة السابقة للدخول الكامل |
| `api.resolvePath(input)` | `(string) => string`      | حل المسار نسبة إلى جذر Plugin                                                        |

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
  لا تستورد أبدا Plugin الخاص بك عبر `openclaw/plugin-sdk/<your-plugin>`
  من كود الإنتاج. وجّه الاستيرادات الداخلية عبر `./api.ts` أو
  `./runtime-api.ts`. مسار SDK هو العقد الخارجي فقط.
</Warning>

تفضل الأسطح العامة لـ Plugin المضمن المحملة عبر الواجهة (`api.ts` و`runtime-api.ts` و
`index.ts` و`setup-entry.ts` وملفات الدخول العامة المشابهة)
لقطة إعداد وقت التشغيل النشطة عندما يكون OpenClaw قيد التشغيل بالفعل. إذا لم تكن هناك لقطة وقت تشغيل
بعد، فإنها تعود إلى ملف الإعداد المحلول على القرص.
ينبغي تحميل واجهات Plugins المضمنة المعبأة من خلال محملات واجهات Plugins في OpenClaw؛
فالاستيرادات المباشرة من `dist/extensions/...` تتجاوز فحوصات manifest
والتابع الجانبي لوقت التشغيل التي تستخدمها التثبيتات المعبأة للكود المملوك لـ Plugin.

يمكن لـ Plugins المزودين كشف barrel عقد ضيق محلي لـ Plugin عندما يكون
المساعد مقصودا أن يكون خاصا بالمزود ولا ينتمي بعد إلى مسار فرعي عام من SDK.
أمثلة مضمنة:

- **Anthropic**: نقطة `api.ts` / `contract-api.ts` العامة لمساعدات
  beta-header و`service_tier` الخاصة بتدفق Claude.
- **`@openclaw/openai-provider`**: يصدر `api.ts` بناة المزود،
  ومساعدات النموذج الافتراضي، وبناة مزود الوقت الحقيقي.
- **`@openclaw/openrouter-provider`**: يصدر `api.ts` باني المزود
  بالإضافة إلى مساعدات الإعداد الأولي/التكوين.

<Warning>
  ينبغي أيضا لكود إنتاج Extension تجنب استيرادات `openclaw/plugin-sdk/<other-plugin>`.
  إذا كان المساعد مشتركا حقا، فارفعه إلى مسار فرعي محايد من SDK
  مثل `openclaw/plugin-sdk/speech` أو `.../provider-model-shared` أو سطح آخر
  موجه إلى القدرة بدلا من ربط Pluginين معا.
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
    التحزيم والبيانات التعريفية ومخططات التكوين.
  </Card>
  <Card title="الاختبار" icon="vial" href="/ar/plugins/sdk-testing">
    أدوات الاختبار وقواعد التدقيق.
  </Card>
  <Card title="ترحيل SDK" icon="arrows-turn-right" href="/ar/plugins/sdk-migration">
    الترحيل من الأسطح المهملة.
  </Card>
  <Card title="داخليات Plugin" icon="diagram-project" href="/ar/plugins/architecture">
    البنية العميقة ونموذج القدرات.
  </Card>
</CardGroup>
