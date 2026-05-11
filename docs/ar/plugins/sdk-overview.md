---
read_when:
    - تحتاج إلى معرفة المسار الفرعي في SDK الذي يجب الاستيراد منه
    - تريد مرجعًا لجميع طرق التسجيل الخاصة بـ OpenClawPluginApi
    - أنت تبحث عن تصدير محدد من SDK
sidebarTitle: Plugin SDK overview
summary: خريطة الاستيراد، ومرجع واجهة برمجة التطبيقات للتسجيل، ومعمارية عدة تطوير البرمجيات
title: نظرة عامة على SDK الخاص بالـ Plugin
x-i18n:
    generated_at: "2026-05-11T20:37:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 633fcffa4256c84c40e8c61e692521583370a368d3058b44d10922279a096b06
    source_path: plugins/sdk-overview.md
    workflow: 16
---

حزمة SDK الخاصة بالمكونات الإضافية هي العقد المطبوع بين المكونات الإضافية والنواة. هذه الصفحة هي
المرجع لـ **ما يجب استيراده** و **ما يمكنك تسجيله**.

<Note>
  هذه الصفحة لمؤلفي المكونات الإضافية الذين يستخدمون `openclaw/plugin-sdk/*` داخل
  OpenClaw. بالنسبة إلى التطبيقات الخارجية والسكربتات ولوحات المعلومات ومهام CI وإضافات IDE
  التي تريد تشغيل الوكلاء عبر Gateway، استخدم
  [حزمة OpenClaw App SDK](/ar/concepts/openclaw-sdk) وحزمة `@openclaw/sdk`
  بدلا من ذلك.
</Note>

<Tip>
هل تبحث عن دليل إرشادي بدلا من ذلك؟ ابدأ بـ [بناء المكونات الإضافية](/ar/plugins/building-plugins)، واستخدم [مكونات القنوات الإضافية](/ar/plugins/sdk-channel-plugins) لمكونات القنوات الإضافية، و[مكونات المزوّدين الإضافية](/ar/plugins/sdk-provider-plugins) لمكونات المزوّدين الإضافية، و[مكونات واجهة CLI الخلفية الإضافية](/ar/plugins/cli-backend-plugins) للواجهات الخلفية المحلية لواجهة CLI الخاصة بالذكاء الاصطناعي، و[خطافات المكونات الإضافية](/ar/plugins/hooks) لمكونات خطافات الأدوات أو دورة الحياة الإضافية.
</Tip>

## اصطلاح الاستيراد

استورد دائما من مسار فرعي محدد:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

كل مسار فرعي هو وحدة صغيرة ومكتفية ذاتيا. يحافظ ذلك على سرعة بدء التشغيل
ويمنع مشكلات الاعتماد الدائري. بالنسبة إلى مساعدات الإدخال/البناء الخاصة بالقنوات،
فضّل `openclaw/plugin-sdk/channel-core`؛ واحتفظ بـ `openclaw/plugin-sdk/core` من أجل
السطح الأوسع والمساعدات المشتركة مثل
`buildChannelConfigSchema`.

بالنسبة إلى إعدادات القناة، انشر JSON Schema المملوك للقناة من خلال
`openclaw.plugin.json#channelConfigs`. المسار الفرعي `plugin-sdk/channel-config-schema`
مخصص لأساسيات المخططات المشتركة والباني العام. تستخدم مكونات OpenClaw
المضمّنة `plugin-sdk/bundled-channel-config-schema` لمخططات القنوات المضمّنة
المحتفظ بها. تبقى صادرات التوافق المهملة على
`plugin-sdk/channel-config-schema-legacy`؛ ولا يشكل أي من مساري المخطط المضمّن نمطا
للمكونات الإضافية الجديدة.

<Warning>
  لا تستورد مسارات الملاءمة ذات العلامات الخاصة بالمزوّدين أو القنوات (على سبيل المثال
  `openclaw/plugin-sdk/slack` أو `.../discord` أو `.../signal` أو `.../whatsapp`).
  تجمع المكونات الإضافية المضمّنة مسارات SDK فرعية عامة داخل ملفاتها المحلية
  `api.ts` / `runtime-api.ts`؛ ويجب على مستهلكي النواة إما استخدام تلك
  البراميل المحلية للمكون الإضافي أو إضافة عقد SDK عام ضيق عندما تكون الحاجة
  عابرة للقنوات فعلا.

ما زالت مجموعة صغيرة من مسارات مساعدات المكونات الإضافية المضمّنة تظهر في خريطة التصدير
المولدة عندما يكون لها استخدام مالك متتبع. وهي موجودة فقط لصيانة المكونات الإضافية
المضمّنة ولا يُنصح بها كمسارات استيراد للمكونات الإضافية الجديدة التابعة لجهات خارجية.

يُحتفظ أيضا بـ `openclaw/plugin-sdk/discord` و `openclaw/plugin-sdk/telegram-account`
كواجهات توافق مهملة لاستخدام المالك المتتبع. لا تنسخ مسارات الاستيراد هذه
إلى مكونات إضافية جديدة؛ استخدم مساعدات وقت التشغيل المحقونة ومسارات SDK الفرعية
العامة للقنوات بدلا من ذلك.
</Warning>

## مرجع المسارات الفرعية

تُعرض حزمة SDK الخاصة بالمكونات الإضافية كمجموعة من المسارات الفرعية الضيقة المجمعة حسب المجال (إدخال المكون
الإضافي، القناة، المزوّد، المصادقة، وقت التشغيل، القدرة، الذاكرة، ومساعدات
المكونات الإضافية المضمّنة المحجوزة). للاطلاع على الفهرس الكامل، مجمعا ومربوطا، راجع
[مسارات حزمة SDK الخاصة بالمكونات الإضافية الفرعية](/ar/plugins/sdk-subpaths).

يوجد مخزون نقاط إدخال المترجم في
`scripts/lib/plugin-sdk-entrypoints.json`؛ وتُنشأ صادرات الحزمة من
المجموعة العامة الفرعية بعد طرح المسارات الفرعية المحلية للاختبارات/الداخلية في المستودع المدرجة في
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. شغّل
`pnpm plugin-sdk:surface` لتدقيق عدد الصادرات العامة. تُتبع المسارات الفرعية العامة المهملة
القديمة بما يكفي وغير المستخدمة بواسطة كود الإنتاج الخاص بالإضافات المضمّنة في
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`؛ وتُتبع
براميل إعادة التصدير المهملة الواسعة في
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## واجهة API للتسجيل

يتلقى استدعاء `register(api)` كائنا من نوع `OpenClawPluginApi` بهذه
الطرق:

### تسجيل القدرات

| الطريقة                                           | ما تسجله                              |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | استدلال نصي (LLM)                     |
| `api.registerAgentHarness(...)`                  | منفذ وكيل منخفض المستوى تجريبي        |
| `api.registerCliBackend(...)`                    | واجهة خلفية محلية لاستدلال CLI        |
| `api.registerChannel(...)`                       | قناة مراسلة                           |
| `api.registerSpeechProvider(...)`                | تركيب تحويل النص إلى كلام / STT       |
| `api.registerRealtimeTranscriptionProvider(...)` | تفريغ فوري متدفق                      |
| `api.registerRealtimeVoiceProvider(...)`         | جلسات صوت فورية ثنائية الاتجاه        |
| `api.registerMediaUnderstandingProvider(...)`    | تحليل الصور/الصوت/الفيديو             |
| `api.registerImageGenerationProvider(...)`       | توليد الصور                           |
| `api.registerMusicGenerationProvider(...)`       | توليد الموسيقى                        |
| `api.registerVideoGenerationProvider(...)`       | توليد الفيديو                         |
| `api.registerWebFetchProvider(...)`              | مزوّد جلب / كشط الويب                 |
| `api.registerWebSearchProvider(...)`             | بحث الويب                             |

### الأدوات والأوامر

| الطريقة                         | ما تسجله                                          |
| ------------------------------- | ------------------------------------------------- |
| `api.registerTool(tool, opts?)` | أداة وكيل (مطلوبة أو `{ optional: true }`)        |
| `api.registerCommand(def)`      | أمر مخصص (يتجاوز LLM)                            |

يمكن لأوامر المكونات الإضافية تعيين `agentPromptGuidance` عندما يحتاج الوكيل إلى تلميح
توجيه قصير مملوك للأمر. اجعل ذلك النص حول الأمر نفسه؛ ولا تضف
سياسة خاصة بالمزوّد أو المكون الإضافي إلى بناة الموجهات في النواة.

### البنية التحتية

| الطريقة                                        | ما تسجله                                      |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | خطاف حدث                                      |
| `api.registerHttpRoute(params)`                | نقطة نهاية HTTP في Gateway                    |
| `api.registerGatewayMethod(name, handler)`     | طريقة RPC في Gateway                          |
| `api.registerGatewayDiscoveryService(service)` | معلن اكتشاف Gateway محلي                      |
| `api.registerCli(registrar, opts?)`            | أمر فرعي في CLI                               |
| `api.registerNodeCliFeature(registrar, opts?)` | ميزة CLI لـ Node تحت `openclaw nodes`         |
| `api.registerService(service)`                 | خدمة خلفية                                    |
| `api.registerInteractiveHandler(registration)` | معالج تفاعلي                                  |
| `api.registerAgentToolResultMiddleware(...)`   | وسيط وقت تشغيل لنتائج الأدوات                 |
| `api.registerMemoryPromptSupplement(builder)`  | قسم موجه إضافي مجاور للذاكرة                  |
| `api.registerMemoryCorpusSupplement(adapter)`  | مجموعة إضافية للبحث/القراءة في الذاكرة        |

### خطافات المضيف لمكونات سير العمل الإضافية

خطافات المضيف هي مسارات SDK للمكونات الإضافية التي تحتاج إلى المشاركة في دورة حياة
المضيف بدلا من مجرد إضافة مزوّد أو قناة أو أداة. إنها عقود
عامة؛ يمكن أن يستخدمها وضع الخطة، وكذلك سير عمل الموافقات،
وبوابات سياسة مساحة العمل، والمراقبات الخلفية، ومعالجات الإعداد، ومكونات واجهة المستخدم
المرافقة.

| الطريقة                                                                              | العقد الذي تملكه                                                                                                                   |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | حالة جلسة مملوكة للمكون الإضافي ومتوافقة مع JSON تُعرض عبر جلسات Gateway                                                           |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | سياق متين مرة واحدة بالضبط يُحقن في دورة الوكيل التالية لجلسة واحدة                                                                |
| `api.registerTrustedToolPolicy(...)`                                                 | سياسة أدوات مضمّنة/موثوقة قبل المكون الإضافي يمكنها حظر معاملات الأداة أو إعادة كتابتها                                           |
| `api.registerToolMetadata(...)`                                                      | بيانات وصفية لعرض فهرس الأدوات دون تغيير تنفيذ الأداة                                                                              |
| `api.registerCommand(...)`                                                           | أوامر مكون إضافي محددة النطاق؛ يمكن أن تعين نتائج الأوامر `continueAgent: true`؛ تدعم أوامر Discord الأصلية `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | واصفات مساهمة واجهة التحكم لأسطح الجلسة أو الأداة أو التشغيل أو الإعدادات                                                          |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | استدعاءات تنظيف لموارد وقت التشغيل المملوكة للمكون الإضافي في مسارات إعادة الضبط/الحذف/إعادة التحميل                               |
| `api.agent.events.registerAgentEventSubscription(...)`                               | اشتراكات أحداث منقحة لحالة سير العمل والمراقبات                                                                                   |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | حالة مؤقتة لكل تشغيل خاصة بالمكون الإضافي تُمسح عند دورة حياة التشغيل النهائية                                                     |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | بيانات وصفية للتنظيف لمهام المجدول المملوكة للمكون الإضافي؛ لا يحدد مواعيد العمل ولا ينشئ سجلات مهام                              |
| `api.session.workflow.sendSessionAttachment(...)`                                    | تسليم مرفقات ملفات بوساطة المضيف للمضمّن فقط إلى مسار الجلسة النشطة الصادر المباشر                                                |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | دورات جلسات مجدولة مدعومة بـ Cron للمضمّن فقط، بالإضافة إلى تنظيف قائم على الوسوم                                                  |
| `api.session.controls.registerSessionAction(...)`                                    | إجراءات جلسة مطبوعة يمكن للعملاء إرسالها عبر Gateway                                                                               |

استخدم فضاءات الأسماء المجمعة لكود المكونات الإضافية الجديد:

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

تبقى الطرق المسطحة المكافئة متاحة كأسماء مستعارة توافقية مهملة
للمكونات الإضافية الحالية. لا تضف كود مكونات إضافية جديدا يستدعي
`api.registerSessionExtension` أو `api.enqueueNextTurnInjection` أو
`api.registerControlUiDescriptor` أو `api.registerRuntimeLifecycle` أو
`api.registerAgentEventSubscription` أو `api.emitAgentEvent` أو
`api.setRunContext` أو `api.getRunContext` أو `api.clearRunContext` أو
`api.registerSessionSchedulerJob` أو `api.registerSessionAction` أو
`api.sendSessionAttachment` أو `api.scheduleSessionTurn` أو
`api.unscheduleSessionTurnsByTag` مباشرة.

`scheduleSessionTurn(...)` هي أداة تيسير على نطاق الجلسة فوق مجدول Cron في Gateway. يملك Cron التوقيت وينشئ سجل مهمة الخلفية عند تشغيل الدور؛ لا يقيّد Plugin SDK إلا الجلسة الهدف، والتسمية المملوكة للـ Plugin، والتنظيف. استخدم `api.runtime.tasks.managedFlows` داخل الدور المجدول عندما يحتاج العمل نفسه إلى حالة Task Flow متينة متعددة الخطوات.

تقسم العقود الصلاحية عمدا:

- يمكن للـ Plugins الخارجية امتلاك امتدادات الجلسة، وواصفات واجهة المستخدم، والأوامر، وبيانات تعريف الأدوات، وحقن الدور التالي، والخطافات العادية.
- تعمل سياسات الأدوات الموثوقة قبل خطافات `before_tool_call` العادية، وهي مخصصة للحزم المضمنة فقط لأنها تشارك في سياسة سلامة المضيف.
- ملكية الأوامر المحجوزة مخصصة للحزم المضمنة فقط. ينبغي للـ Plugins الخارجية استخدام أسماء أوامرها أو أسمائها البديلة.
- يعطل `allowPromptInjection=false` الخطافات التي تعدل الموجهات، بما في ذلك `agent_turn_prepare`، و`before_prompt_build`، و`heartbeat_prompt_contribution`، وحقول الموجهات من `before_agent_start` القديم، و`enqueueNextTurnInjection`.

أمثلة على مستهلكين خارج Plan:

| نمط Plugin                  | الخطافات المستخدمة                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| سير عمل الموافقة             | امتداد الجلسة، متابعة الأمر، حقن الدور التالي، واصف واجهة المستخدم                                                            |
| بوابة سياسة الميزانية/مساحة العمل | سياسة أداة موثوقة، بيانات تعريف الأداة، إسقاط الجلسة                                                                                 |
| مراقب دورة حياة في الخلفية   | تنظيف دورة حياة وقت التشغيل، الاشتراك في أحداث الوكيل، ملكية/تنظيف مجدول الجلسة، مساهمة موجه Heartbeat، واصف واجهة المستخدم |
| معالج الإعداد أو التهيئة الأولية | امتداد الجلسة، أوامر محددة النطاق، واصف واجهة مستخدم التحكم                                                                              |

<Note>
  تبقى مساحات أسماء الإدارة الأساسية المحجوزة (`config.*`، `exec.approvals.*`، `wizard.*`،
  `update.*`) دائما `operator.admin`، حتى إذا حاول Plugin إسناد نطاق طريقة Gateway
  أضيق. فضّل بادئات خاصة بالـ Plugin للطرق المملوكة للـ Plugin.
</Note>

<Accordion title="When to use tool-result middleware">
  يمكن للـ Plugins المضمنة استخدام `api.registerAgentToolResultMiddleware(...)` عندما
  تحتاج إلى إعادة كتابة نتيجة أداة بعد التنفيذ وقبل أن يعيد وقت التشغيل
  تمرير تلك النتيجة إلى النموذج. هذه هي الواجهة الموثوقة والمحايدة تجاه وقت التشغيل
  لمختزلات المخرجات غير المتزامنة مثل tokenjuice.

يجب أن تصرح الـ Plugins المضمنة بـ `contracts.agentToolResultMiddleware` لكل
وقت تشغيل مستهدف، مثل `["pi", "codex"]`. لا تستطيع الـ Plugins الخارجية
تسجيل هذا الوسيط؛ أبق خطافات OpenClaw Plugin العادية للعمل
الذي لا يحتاج إلى توقيت نتيجة الأداة قبل النموذج. تمت إزالة مسار تسجيل
مصنع الامتداد المضمن القديم الخاص بـ Pi فقط.
</Accordion>

### تسجيل اكتشاف Gateway

تتيح `api.registerGatewayDiscoveryService(...)` للـ Plugin الإعلان عن Gateway النشط
على نقل اكتشاف محلي مثل mDNS/Bonjour. يستدعي OpenClaw الخدمة
أثناء بدء تشغيل Gateway عندما يكون الاكتشاف المحلي مفعلا، ويمرر
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

يجب ألا تتعامل Plugins اكتشاف Gateway مع قيم TXT المعلن عنها كأسرار أو
مصادقة. الاكتشاف تلميح توجيه؛ وما زالت مصادقة Gateway وتثبيت TLS
يمتلكان الثقة.

### بيانات تعريف تسجيل CLI

تقبل `api.registerCli(registrar, opts?)` نوعين من بيانات تعريف الأوامر:

- `commands`: أسماء أوامر صريحة يملكها المسجل
- `descriptors`: واصفات أوامر وقت التحليل المستخدمة لمساعدة CLI،
  والتوجيه، وتسجيل CLI الخاص بالـ Plugin المحمل كسولا
- `parentPath`: مسار أمر أب اختياري لمجموعات الأوامر المتداخلة، مثل
  `["nodes"]`

للميزات ذات العقدة المقترنة، فضّل
`api.registerNodeCliFeature(registrar, opts?)`. إنه مغلف صغير حول
`api.registerCli(..., { parentPath: ["nodes"] })` ويجعل أوامر مثل
`openclaw nodes canvas` ميزات عقدة صريحة مملوكة للـ Plugin.

إذا أردت أن يبقى أمر Plugin محملا كسولا في مسار CLI الجذري العادي،
فقدم `descriptors` تغطي كل جذر أمر علوي يكشفه ذلك المسجل.

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
يبقى مسار التوافق المتحمس هذا مدعوما، لكنه لا يثبت
عناصر نائبة مدعومة بالواصفات للتحميل الكسول وقت التحليل.

### تسجيل خلفية CLI

تتيح `api.registerCliBackend(...)` للـ Plugin امتلاك التكوين الافتراضي لخلفية
CLI محلية للذكاء الاصطناعي مثل `codex-cli`.

- يصبح `id` الخاص بالخلفية بادئة المزوّد في مراجع النماذج مثل `codex-cli/gpt-5`.
- يستخدم `config` الخاص بالخلفية الشكل نفسه مثل `agents.defaults.cliBackends.<id>`.
- يظل تكوين المستخدم هو الغالب. يدمج OpenClaw `agents.defaults.cliBackends.<id>` فوق
  افتراض Plugin قبل تشغيل CLI.
- استخدم `normalizeConfig` عندما تحتاج خلفية إلى إعادة كتابات توافق بعد الدمج
  (مثل تسوية أشكال الرايات القديمة).
- استخدم `resolveExecutionArgs` لإعادة كتابة argv محددة بنطاق الطلب وتنتمي إلى
  لهجة CLI، مثل ربط مستويات التفكير في OpenClaw براية جهد أصلية.

للاطلاع على دليل تأليف شامل، راجع
[Plugins خلفية CLI](/ar/plugins/cli-backend-plugins).

### الخانات الحصرية

| الطريقة                                    | ما تسجله                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | محرك السياق (واحد نشط في كل مرة). تتلقى دالة رد النداء `assemble()` القيمتين `availableTools` و`citationsMode` كي يتمكن المحرك من تخصيص إضافات الموجه. |
| `api.registerMemoryCapability(capability)` | قدرة ذاكرة موحدة                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | باني قسم موجه الذاكرة                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | محلل خطة تفريغ الذاكرة                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | محول وقت تشغيل الذاكرة                                                                                                                                    |

### محولات تضمين الذاكرة

| الطريقة                                        | ما تسجله                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | محول تضمين الذاكرة للـ Plugin النشط |

- `registerMemoryCapability` هي واجهة API الحصرية المفضلة لـ Plugin الذاكرة.
- قد تكشف `registerMemoryCapability` أيضا `publicArtifacts.listArtifacts(...)`
  كي تستطيع Plugins المصاحبة استهلاك عناصر الذاكرة المصدرة عبر
  `openclaw/plugin-sdk/memory-host-core` بدلا من الوصول إلى التخطيط الخاص
  بـ Plugin ذاكرة محدد.
- `registerMemoryPromptSection` و`registerMemoryFlushPlan` و
  `registerMemoryRuntime` هي واجهات API حصرية متوافقة مع القديم لـ Plugin الذاكرة.
- يمكن لـ `MemoryFlushPlan.model` تثبيت دور التفريغ على مرجع `provider/model`
  دقيق، مثل `ollama/qwen3:8b`، من دون وراثة سلسلة الاحتياط النشطة.
- تتيح `registerMemoryEmbeddingProvider` لـ Plugin الذاكرة النشط تسجيل معرف
  محول تضمين واحد أو أكثر (مثل `openai` أو `gemini` أو معرف مخصص
  يعرّفه Plugin).
- يحل تكوين المستخدم مثل `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` مقابل معرفات المحولات المسجلة هذه.

### الأحداث ودورة الحياة

| الطريقة                                      | ما تفعله                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | خطاف دورة حياة مطبوع          |
| `api.onConversationBindingResolved(handler)` | رد نداء ربط المحادثة |

راجع [خطافات Plugin](/ar/plugins/hooks) للاطلاع على أمثلة، وأسماء الخطافات الشائعة، ودلالات الحراسة.

### دلالات قرار الخطاف

- `before_tool_call`: إرجاع `{ block: true }` نهائي. بمجرد أن يضبطه أي معالج، يتم تخطي المعالجات الأقل أولوية.
- `before_tool_call`: يعامل إرجاع `{ block: false }` كأنه لا قرار (مثل حذف `block`)، وليس كتجاوز.
- `before_install`: إرجاع `{ block: true }` نهائي. بمجرد أن يضبطه أي معالج، يتم تخطي المعالجات الأقل أولوية.
- `before_install`: يعامل إرجاع `{ block: false }` كأنه لا قرار (مثل حذف `block`)، وليس كتجاوز.
- `reply_dispatch`: إرجاع `{ handled: true, ... }` نهائي. بمجرد أن يعلن أي معالج توليه للإرسال، يتم تخطي المعالجات الأقل أولوية ومسار إرسال النموذج الافتراضي.
- `message_sending`: إرجاع `{ cancel: true }` نهائي. بمجرد أن يضبطه أي معالج، يتم تخطي المعالجات الأقل أولوية.
- `message_sending`: يعامل إرجاع `{ cancel: false }` كأنه لا قرار (مثل حذف `cancel`)، وليس كتجاوز.
- `message_received`: استخدم حقل `threadId` المطبوع عندما تحتاج إلى توجيه سلسلة/موضوع وارد. أبق `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: استخدم حقول التوجيه المطبوعة `replyToId` / `threadId` قبل الرجوع إلى `metadata` الخاصة بالقناة.
- `gateway_start`: استخدم `ctx.config` و`ctx.workspaceDir` و`ctx.getCron?.()` لحالة بدء التشغيل المملوكة للـ Gateway بدلا من الاعتماد على خطافات `gateway:startup` الداخلية.
- `cron_changed`: راقب تغييرات دورة حياة Cron المملوكة للـ Gateway. استخدم `event.job?.state?.nextRunAtMs` و`ctx.getCron?.()` عند مزامنة مجدولات إيقاظ خارجية، وأبق OpenClaw مصدر الحقيقة لفحوص الاستحقاق والتنفيذ.

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
| `api.pluginConfig`       | `Record<string, unknown>` | إعدادات Plugin المحددة من `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | مسجّل محدود النطاق (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | وضع التحميل الحالي؛ `"setup-runtime"` هو نافذة بدء/إعداد خفيفة قبل نقطة الدخول الكاملة |
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

تفضّل الأسطح العامة لـ Plugin المضمّن والمحملة عبر الواجهة (`api.ts` و`runtime-api.ts`
و`index.ts` و`setup-entry.ts` وملفات الدخول العامة المشابهة)
لقطة إعدادات وقت التشغيل النشطة عندما يكون OpenClaw قيد التشغيل بالفعل. إذا لم تكن هناك لقطة وقت تشغيل
بعد، فإنها تعود إلى ملف الإعدادات المحلول على القرص.
يجب تحميل واجهات Plugin المضمّنة المعبأة عبر محمّلات واجهة Plugin في OpenClaw؛
فالاستيرادات المباشرة من `dist/extensions/...` تتجاوز البيان
وفحوصات المرافق الجانبية لوقت التشغيل التي تستخدمها التثبيتات المعبأة للكود المملوك لـ Plugin.

يمكن لـ provider plugins كشف ملف تجميع عقد محلي ضيق خاص بـ Plugin عندما يكون
المساعد مقصودًا أن يكون محددًا لمزوّد ولا ينتمي بعد إلى مسار فرعي عام في SDK.
أمثلة مضمّنة:

- **Anthropic**: سطح عام `api.ts` / `contract-api.ts` لمساعدات
  ترويسة Claude التجريبية وتدفق `service_tier`.
- **`@openclaw/openai-provider`**: يصدّر `api.ts` بناة المزوّد،
  ومساعدات النموذج الافتراضي، وبناة مزوّد الوقت الفعلي.
- **`@openclaw/openrouter-provider`**: يصدّر `api.ts` باني المزوّد
  بالإضافة إلى مساعدات الإعداد الأولي/الإعدادات.

<Warning>
  يجب أن يتجنب كود إنتاج الامتدادات أيضًا استيرادات `openclaw/plugin-sdk/<other-plugin>`.
  إذا كان المساعد مشتركًا فعلًا، فارفعه إلى مسار فرعي محايد في SDK
  مثل `openclaw/plugin-sdk/speech` أو `.../provider-model-shared` أو سطح آخر
  موجّه للقدرات بدلًا من ربط Pluginين معًا.
</Warning>

## ذات صلة

<CardGroup cols={2}>
  <Card title="نقاط الدخول" icon="door-open" href="/ar/plugins/sdk-entrypoints">
    خيارات `definePluginEntry` و`defineChannelPluginEntry`.
  </Card>
  <Card title="مساعدات وقت التشغيل" icon="gears" href="/ar/plugins/sdk-runtime">
    مرجع مساحة الأسماء الكامل لـ `api.runtime`.
  </Card>
  <Card title="الإعداد والإعدادات" icon="sliders" href="/ar/plugins/sdk-setup">
    التعبئة والبيانات ومخططات الإعدادات.
  </Card>
  <Card title="الاختبار" icon="vial" href="/ar/plugins/sdk-testing">
    أدوات الاختبار المساعدة وقواعد الفحص.
  </Card>
  <Card title="ترحيل SDK" icon="arrows-turn-right" href="/ar/plugins/sdk-migration">
    الترحيل من الأسطح المهملة.
  </Card>
  <Card title="داخليات Plugin" icon="diagram-project" href="/ar/plugins/architecture">
    البنية العميقة ونموذج القدرات.
  </Card>
</CardGroup>
