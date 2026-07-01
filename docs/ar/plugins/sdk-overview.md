---
read_when:
    - تحتاج إلى معرفة المسار الفرعي للـ SDK الذي يجب الاستيراد منه
    - تريد مرجعًا لجميع طرق التسجيل في OpenClawPluginApi
    - أنت تبحث عن تصدير محدد من SDK
sidebarTitle: Plugin SDK overview
summary: مرجع خريطة الاستيراد وواجهة برمجة تطبيقات التسجيل ومعمارية SDK
title: نظرة عامة على Plugin SDK
x-i18n:
    generated_at: "2026-07-01T18:13:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7df77e34db9b780ee0747a0f2178861624f528d9f7aec8592d6954a96869e96
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK الخاص بـ Plugins هو العقد المطبوع بين Plugins والنواة. هذه الصفحة هي
المرجع لـ **ما يجب استيراده** و**ما يمكنك تسجيله**.

<Note>
  هذه الصفحة مخصصة لمؤلفي Plugins الذين يستخدمون `openclaw/plugin-sdk/*` داخل
  OpenClaw. للتطبيقات الخارجية والسكربتات ولوحات المعلومات ومهام CI وامتدادات IDE
  التي تريد تشغيل الوكلاء عبر Gateway، استخدم
  [تكاملات Gateway للتطبيقات الخارجية](/ar/gateway/external-apps) بدلا من ذلك.
</Note>

<Tip>
هل تبحث عن دليل إرشادي بدلا من ذلك؟ ابدأ بـ [بناء Plugins](/ar/plugins/building-plugins)، واستخدم [Plugins القنوات](/ar/plugins/sdk-channel-plugins) لـ Plugins القنوات، و[Plugins الموفرين](/ar/plugins/sdk-provider-plugins) لـ Plugins الموفرين، و[Plugins خلفية CLI](/ar/plugins/cli-backend-plugins) لخلفيات CLI المحلية للذكاء الاصطناعي، و[خطافات Plugin](/ar/plugins/hooks) لـ Plugins الأدوات أو خطافات دورة الحياة.
</Tip>

## اصطلاح الاستيراد

استورد دائما من مسار فرعي محدد:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

كل مسار فرعي هو وحدة صغيرة ومكتفية بذاتها. يحافظ هذا على سرعة بدء التشغيل
ويمنع مشكلات الاعتماد الدائري. لمساعدات الإدخال/البناء الخاصة بالقنوات،
فضّل `openclaw/plugin-sdk/channel-core`؛ واحتفظ بـ `openclaw/plugin-sdk/core`
للسطح الشامل الأوسع والمساعدات المشتركة مثل
`buildChannelConfigSchema`.

بالنسبة إلى إعدادات القناة، انشر JSON Schema المملوك للقناة عبر
`openclaw.plugin.json#channelConfigs`. المسار الفرعي `plugin-sdk/channel-config-schema`
مخصص لبدائيات المخططات المشتركة والباني العام. تستخدم Plugins المضمنة في OpenClaw
`plugin-sdk/bundled-channel-config-schema` لمخططات القنوات المضمنة المحتفظ بها.
تبقى صادرات التوافق المهملة على
`plugin-sdk/channel-config-schema-legacy`؛ ولا يشكل أي من مساري المخططات المضمنة
نمطا لـ Plugins الجديدة.

<Warning>
  لا تستورد مسارات تسهيل ذات علامات موفر أو قناة (على سبيل المثال
  `openclaw/plugin-sdk/slack`، و`.../discord`، و`.../signal`، و`.../whatsapp`).
  تركب Plugins المضمنة مسارات SDK الفرعية العامة داخل حاويات `api.ts` /
  `runtime-api.ts` الخاصة بها؛ وينبغي لمستهلكي النواة إما استخدام تلك الحاويات المحلية للـ Plugin
  أو إضافة عقد SDK عام ضيق عندما تكون الحاجة عابرة للقنوات فعلا.

ما زالت مجموعة صغيرة من مسارات مساعدي Plugins المضمنة تظهر في خريطة التصدير
المولدة عندما يكون لها استخدام مالك متتبع. وهي موجودة لصيانة Plugins المضمنة
فقط وليست مسارات استيراد موصى بها لـ Plugins الجهات الخارجية الجديدة.

يتم أيضا الاحتفاظ بـ `openclaw/plugin-sdk/discord` و`openclaw/plugin-sdk/telegram-account`
كواجهات توافق مهملة لاستخدام مالك متتبع. لا تنسخ مسارات الاستيراد هذه إلى Plugins جديدة؛ استخدم مساعدات وقت التشغيل المحقونة
ومسارات SDK الفرعية العامة للقنوات بدلا من ذلك.
</Warning>

## مرجع المسارات الفرعية

يُعرض SDK الخاص بـ Plugins كمجموعة من المسارات الفرعية الضيقة المجمعة حسب المجال (إدخال Plugin،
القناة، الموفر، المصادقة، وقت التشغيل، القدرة، الذاكرة، ومساعدات Plugins المضمنة
المحجوزة). للاطلاع على الفهرس الكامل — مجمعا ومرتبطا — راجع
[مسارات Plugin SDK الفرعية](/ar/plugins/sdk-subpaths).

يوجد مخزون نقاط إدخال المترجم في
`scripts/lib/plugin-sdk-entrypoints.json`؛ وتُولد صادرات الحزمة من
المجموعة العامة بعد طرح المسارات الفرعية المحلية للاختبارات/الداخلية في المستودع المدرجة في
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. شغّل
`pnpm plugin-sdk:surface` لتدقيق عدد الصادرات العامة. تُتبع المسارات الفرعية العامة المهملة
القديمة بما يكفي وغير المستخدمة في كود الإنتاج للامتدادات المضمنة في
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`؛ وتُتبع حاويات إعادة التصدير المهملة
العريضة في
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API التسجيل

تتلقى دالة الاستدعاء `register(api)` كائنا من نوع `OpenClawPluginApi` يحتوي على هذه
الطرق:

### تسجيل القدرات

| الطريقة                                           | ما تسجله                              |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | استدلال النص (LLM)                    |
| `api.registerAgentHarness(...)`                  | منفذ وكيل منخفض المستوى تجريبي        |
| `api.registerCliBackend(...)`                    | خلفية استدلال CLI محلية               |
| `api.registerChannel(...)`                       | قناة مراسلة                           |
| `api.registerEmbeddingProvider(...)`             | موفر تضمين متجهات قابل لإعادة الاستخدام |
| `api.registerSpeechProvider(...)`                | تحويل النص إلى كلام / توليف STT       |
| `api.registerRealtimeTranscriptionProvider(...)` | نسخ فوري متدفق                        |
| `api.registerRealtimeVoiceProvider(...)`         | جلسات صوت فورية مزدوجة الاتجاه        |
| `api.registerMediaUnderstandingProvider(...)`    | تحليل الصور/الصوت/الفيديو             |
| `api.registerImageGenerationProvider(...)`       | توليد الصور                           |
| `api.registerMusicGenerationProvider(...)`       | توليد الموسيقى                        |
| `api.registerVideoGenerationProvider(...)`       | توليد الفيديو                         |
| `api.registerWebFetchProvider(...)`              | موفر جلب / كشط الويب                  |
| `api.registerWebSearchProvider(...)`             | بحث الويب                             |

يجب أيضا إدراج موفري التضمين المسجلين باستخدام `api.registerEmbeddingProvider(...)`
في `contracts.embeddingProviders` ضمن بيان Plugin. هذا هو سطح التضمين العام
لتوليد المتجهات القابل لإعادة الاستخدام. يمكن لبحث الذاكرة استهلاك سطح الموفر العام هذا.
أما مسار
`api.registerMemoryEmbeddingProvider(...)` و
`contracts.memoryEmbeddingProviders` الأقدم فهو توافق مهمل بينما
ينتقل الموفرون الحاليون الخاصون بالذاكرة.

يبقى الموفرون الخاصون بالذاكرة الذين ما زالوا يعرضون `batchEmbed(...)` في وقت التشغيل على
عقد التجميع الحالي لكل ملف ما لم يضبط وقت التشغيل لديهم صراحة
`sourceWideBatchEmbed: true`. يتيح هذا الاشتراك لمضيف الذاكرة إرسال مقاطع من
ملفات ذاكرة متعددة متسخة ومصادر مفعلة في استدعاء `batchEmbed(...)` واحد حتى
حدود دفعات المضيف. يجب على محولات الدفعات التي ترفع ملفات طلب JSONL أن
تقسم مهام الموفر قبل بلوغ حد حجم الرفع وكذلك حد عدد الطلبات. يجب أن يعيد
الموفر تضمينا واحدا لكل مقطع إدخال وبنفس ترتيب `batch.chunks`؛ احذف العلم عندما يتوقع الموفر دفعات محلية للملف أو
لا يستطيع الحفاظ على ترتيب الإدخال عبر مهمة أوسع على مستوى المصدر.

### الأدوات والأوامر

استخدم [`defineToolPlugin`](/ar/plugins/tool-plugins) لـ Plugins الأدوات البسيطة فقط
ذات أسماء أدوات ثابتة. استخدم `api.registerTool(...)` مباشرة لـ Plugins المختلطة
أو التسجيل الديناميكي الكامل للأدوات.

| الطريقة                          | ما تسجله                                      |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | أداة وكيل (مطلوبة أو `{ optional: true }`)    |
| `api.registerCommand(def)`      | أمر مخصص (يتجاوز LLM)                         |

يمكن لأوامر Plugin ضبط `agentPromptGuidance` عندما يحتاج الوكيل إلى تلميح توجيه قصير
مملوك للأمر. أبق ذلك النص حول الأمر نفسه؛ ولا تضف
سياسة خاصة بالموفر أو Plugin إلى بناة المطالبات في النواة.

قد تكون إدخالات الإرشاد نصوصا قديمة، وتنطبق على كل سطح مطالبة، أو
إدخالات منظمة:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

قد تتضمن `surfaces` المنظمة `openclaw_main` أو `codex_app_server`
أو `cli_backend` أو `acp_backend` أو `subagent`. يبقى `pi_main` اسما مستعارا مهملا
لـ `openclaw_main`. احذف `surfaces` عند قصد الإرشاد على كل الأسطح. لا
تمرر مصفوفة `surfaces` فارغة؛ فهي مرفوضة كي لا يتحول فقدان النطاق العرضي
إلى نص مطالبة عام.

تعليمات المطور الأصلية لخادم تطبيقات Codex أكثر صرامة من أسطح المطالبة
الأخرى: لا يُرقى إلا الإرشاد المحدد صراحة إلى `codex_app_server` إلى
ذلك المسار الأعلى أولوية. تظل إرشادات النصوص القديمة والإرشادات المنظمة غير محددة النطاق
متاحة لأسطح المطالبة غير الخاصة بـ Codex للتوافق.

### البنية التحتية

| الطريقة                                         | ما تسجله                                |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | خطاف حدث                                |
| `api.registerHttpRoute(params)`                | نقطة نهاية HTTP في Gateway              |
| `api.registerGatewayMethod(name, handler)`     | طريقة RPC في Gateway                    |
| `api.registerGatewayDiscoveryService(service)` | معلن اكتشاف Gateway محلي                |
| `api.registerCli(registrar, opts?)`            | أمر فرعي في CLI                         |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI لميزة Node تحت `openclaw nodes`     |
| `api.registerService(service)`                 | خدمة خلفية                              |
| `api.registerInteractiveHandler(registration)` | معالج تفاعلي                            |
| `api.registerAgentToolResultMiddleware(...)`   | وسيط نتائج أدوات وقت التشغيل            |
| `api.registerMemoryPromptSupplement(builder)`  | قسم مطالبة إضافي مجاور للذاكرة          |
| `api.registerMemoryCorpusSupplement(adapter)`  | متن إضافي لبحث/قراءة الذاكرة            |

### خطافات المضيف لـ Plugins سير العمل

خطافات المضيف هي مسارات SDK لـ Plugins التي تحتاج إلى المشاركة في دورة حياة
المضيف بدلا من مجرد إضافة موفر أو قناة أو أداة. إنها
عقود عامة؛ يمكن لوضع التخطيط استخدامها، وكذلك يمكن لتدفقات الموافقة،
وبوابات سياسة مساحة العمل، والمراقبات الخلفية، ومعالجات الإعداد، وPlugins المرافقة
لواجهة المستخدم استخدامها.

| الطريقة                                                                               | العقد الذي تملكه                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | حالة جلسة متوافقة مع JSON ومملوكة للـ Plugin، تُسقَط عبر جلسات Gateway                                                                                     |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | سياق دائم يُحقن مرة واحدة بالضبط في دورة الوكيل التالية لجلسة واحدة                                                                                        |
| `api.registerTrustedToolPolicy(...)`                                                 | سياسة أداة موثوقة قبل الـ Plugin ومقيّدة بالبيان، يمكنها حظر معاملات الأداة أو إعادة كتابتها                                                              |
| `api.registerToolMetadata(...)`                                                      | بيانات تعريف عرض كتالوج الأدوات دون تغيير تنفيذ الأداة                                                                                                     |
| `api.registerCommand(...)`                                                           | أوامر Plugin محددة النطاق؛ يمكن لنتائج الأوامر تعيين `continueAgent: true` أو `suppressReply: true`؛ تدعم أوامر Discord الأصلية `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | واصفات مساهمات واجهة التحكم لأسطح الجلسة أو الأداة أو التشغيل أو الإعدادات                                                                                |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | استدعاءات تنظيف لموارد وقت التشغيل المملوكة للـ Plugin في مسارات إعادة الضبط/الحذف/إعادة التحميل                                                         |
| `api.agent.events.registerAgentEventSubscription(...)`                               | اشتراكات أحداث منقّحة لحالة سير العمل والمراقبات                                                                                                          |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | حالة مؤقتة للـ Plugin لكل تشغيل تُمسح عند دورة حياة التشغيل النهائية                                                                                       |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | بيانات تعريف التنظيف لمهام المجدول المملوكة للـ Plugin؛ لا تجدول عملاً ولا تنشئ سجلات مهام                                                               |
| `api.session.workflow.sendSessionAttachment(...)`                                    | تسليم مرفقات ملفات بوساطة المضيف، للميزات المضمّنة فقط، إلى مسار الجلسة النشط المباشر الصادر                                                             |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | دورات جلسة مجدولة ومدعومة من Cron، للميزات المضمّنة فقط، مع تنظيف قائم على الوسوم                                                                         |
| `api.session.controls.registerSessionAction(...)`                                    | إجراءات جلسة مكتوبة يمكن للعملاء إرسالها عبر Gateway                                                                                                      |

استخدم مساحات الأسماء المجمّعة لكود Plugin الجديد:

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

تظل الطرق المسطّحة المكافئة متاحة كأسماء بديلة مهملة للتوافق مع إضافات Plugin الحالية. لا تضف كود Plugin جديداً يستدعي
`api.registerSessionExtension` أو `api.enqueueNextTurnInjection` أو
`api.registerControlUiDescriptor` أو `api.registerRuntimeLifecycle` أو
`api.registerAgentEventSubscription` أو `api.emitAgentEvent` أو
`api.setRunContext` أو `api.getRunContext` أو `api.clearRunContext` أو
`api.registerSessionSchedulerJob` أو `api.registerSessionAction` أو
`api.sendSessionAttachment` أو `api.scheduleSessionTurn` أو
`api.unscheduleSessionTurnsByTag` مباشرة.

`scheduleSessionTurn(...)` وسيلة ملائمة محددة بنطاق الجلسة فوق مجدول Cron في Gateway. يملك Cron التوقيت وينشئ سجل المهمة الخلفية عند تشغيل الدورة؛ أما Plugin SDK فيقيّد فقط الجلسة المستهدفة، والتسمية المملوكة للـ Plugin، والتنظيف. استخدم `api.runtime.tasks.managedFlows` داخل الدورة المجدولة عندما يحتاج العمل نفسه إلى حالة TaskFlow دائمة ومتعددة الخطوات.

تقسم العقود الصلاحيات عمداً:

- يمكن لإضافات Plugin الخارجية امتلاك امتدادات الجلسات، وواصفات واجهة المستخدم، والأوامر، وبيانات تعريف الأدوات، وحقن الدورة التالية، والخطافات العادية.
- تعمل سياسات الأدوات الموثوقة قبل خطافات `before_tool_call` العادية وتكون موثوقة من المضيف. تعمل السياسات المضمّنة أولاً؛ وتتطلب سياسات إضافات Plugin المثبتة تمكيناً صريحاً إضافة إلى معرّفاتها المحلية في
  `contracts.trustedToolPolicies`، ثم تعمل تالياً بترتيب تحميل Plugin. تكون معرّفات السياسات محددة بنطاق Plugin الذي سجّلها.
- ملكية الأوامر المحجوزة مخصصة للميزات المضمّنة فقط. ينبغي لإضافات Plugin الخارجية استخدام أسماء أوامرها أو أسمائها البديلة الخاصة بها.
- يعطّل `allowPromptInjection=false` الخطافات التي تغيّر الموجهات، بما في ذلك
  `agent_turn_prepare` و`before_prompt_build` و`heartbeat_prompt_contribution` وحقول الموجهات من `before_agent_start` القديم و
  `enqueueNextTurnInjection`.

أمثلة لمستهلكين من غير Plan:

| نموذج Plugin                 | الخطافات المستخدمة                                                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| سير عمل الموافقة             | امتداد الجلسة، متابعة الأمر، حقن الدورة التالية، واصف واجهة المستخدم                                                                  |
| بوابة سياسة الميزانية/مساحة العمل | سياسة الأداة الموثوقة، بيانات تعريف الأداة، إسقاط الجلسة                                                                               |
| مراقب دورة حياة في الخلفية   | تنظيف دورة حياة وقت التشغيل، اشتراك حدث الوكيل، ملكية/تنظيف مجدول الجلسة، مساهمة موجه Heartbeat، واصف واجهة المستخدم               |
| معالج الإعداد أو التهيئة     | امتداد الجلسة، أوامر محددة النطاق، واصف واجهة التحكم                                                                                  |

<Note>
  تظل مساحات أسماء إدارة النواة المحجوزة (`config.*` و`exec.approvals.*` و`wizard.*` و
  `update.*`) دائماً `operator.admin`، حتى إذا حاول Plugin تعيين نطاق أضيق لطريقة Gateway. فضّل بادئات خاصة بالـ Plugin للطرق المملوكة للـ Plugin.
</Note>

<Accordion title="متى تستخدم وسيط نتائج الأدوات">
  يمكن لإضافات Plugin المضمّنة وإضافات Plugin المثبتة الممكّنة صراحةً والتي تملك عقود بيان مطابقة استخدام `api.registerAgentToolResultMiddleware(...)` عندما تحتاج إلى إعادة كتابة نتيجة أداة بعد التنفيذ وقبل أن يغذي وقت التشغيل تلك النتيجة مرة أخرى إلى النموذج. هذه هي نقطة الربط الموثوقة والمحايدة لوقت التشغيل لمخفضات الخرج غير المتزامنة مثل tokenjuice.

يجب على إضافات Plugin التصريح بـ `contracts.agentToolResultMiddleware` لكل وقت تشغيل مستهدف، مثل `["openclaw", "codex"]`. لا تستطيع إضافات Plugin المثبتة من دون ذلك العقد، أو من دون تمكين صريح، تسجيل هذا الوسيط؛ أبقِ خطافات OpenClaw Plugin العادية للأعمال التي لا تحتاج إلى توقيت نتائج الأدوات قبل النموذج. تمت إزالة مسار تسجيل مصنع الامتداد القديم الخاص فقط بالمشغّل المضمّن.
</Accordion>

### تسجيل اكتشاف Gateway

يتيح `api.registerGatewayDiscoveryService(...)` للـ Plugin الإعلان عن Gateway النشط على نقل اكتشاف محلي مثل mDNS/Bonjour. يستدعي OpenClaw الخدمة أثناء بدء تشغيل Gateway عندما يكون الاكتشاف المحلي مفعلاً، ويمرر منافذ Gateway الحالية وبيانات تلميح TXT غير السرية، ويستدعي معالج `stop` المُعاد أثناء إيقاف Gateway.

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

يجب ألا تتعامل إضافات Plugin لاكتشاف Gateway مع قيم TXT المُعلنة كأسرار أو كمصادقة. الاكتشاف تلميح توجيه؛ ولا تزال مصادقة Gateway وتثبيت TLS هما مالكي الثقة.

### بيانات تعريف تسجيل CLI

يقبل `api.registerCli(registrar, opts?)` نوعين من بيانات تعريف الأوامر:

- `commands`: أسماء أوامر صريحة يملكها المسجّل
- `descriptors`: واصفات أوامر وقت التحليل المستخدمة لمساعدة CLI،
  والتوجيه، وتسجيل CLI الكسول للـ Plugin
- `parentPath`: مسار أمر أصل اختياري لمجموعات الأوامر المتداخلة، مثل
  `["nodes"]`

للميزات ذات العقد المقترنة، فضّل
`api.registerNodeCliFeature(registrar, opts?)`. إنه غلاف صغير حول
`api.registerCli(..., { parentPath: ["nodes"] })` ويجعل أوامر مثل
`openclaw nodes canvas` ميزات عقد مملوكة صراحةً للـ Plugin.

إذا أردت أن يبقى أمر Plugin محملاً كسولاً في مسار CLI الجذري العادي، فوفّر `descriptors` تغطي كل جذر أمر علوي يعرّضه ذلك المسجّل.

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

تتلقى الأوامر المتداخلة الأمر الأصل المحلول بوصفه `program`:

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

استخدم `commands` وحده فقط عندما لا تحتاج إلى تسجيل CLI جذري كسول. يظل مسار التوافق الحريص هذا مدعوماً، لكنه لا يثبّت عناصر نائبة مدعومة بالواصفات للتحميل الكسول وقت التحليل.

### تسجيل خلفية CLI

يتيح `api.registerCliBackend(...)` للـ Plugin امتلاك الإعداد الافتراضي لخلفية CLI محلية للذكاء الاصطناعي مثل `claude-cli` أو `my-cli`.

- يصبح `id` الخاص بالخلفية بادئة المزوّد في مراجع النماذج مثل `my-cli/gpt-5`.
- يستخدم `config` الخاص بالخلفية البنية نفسها مثل `agents.defaults.cliBackends.<id>`.
- تظل إعدادات المستخدم هي الغالبة. يدمج OpenClaw `agents.defaults.cliBackends.<id>` فوق
  الإعداد الافتراضي الخاص بـ Plugin قبل تشغيل CLI.
- استخدم `normalizeConfig` عندما تحتاج الخلفية إلى إعادة كتابة للتوافق بعد الدمج
  (مثل تطبيع بُنى الرايات القديمة).
- استخدم `resolveExecutionArgs` لإعادة كتابة argv على نطاق الطلب التي تنتمي إلى
  لهجة CLI، مثل ربط مستويات التفكير في OpenClaw براية جهد أصلية.
  يتلقى الخطاف `ctx.executionMode`؛ استخدم `"side-question"` لإضافة
  رايات عزل أصلية للخلفية لاستدعاءات `/btw` المؤقتة. إذا كانت تلك الرايات
  تعطل الأدوات الأصلية بشكل موثوق في CLI تكون مفعّلة دائمًا بخلاف ذلك، فأعلن
  `sideQuestionToolMode: "disabled"` أيضًا.

للاطلاع على دليل تأليف شامل، راجع
[Plugins خلفيات CLI](/ar/plugins/cli-backend-plugins).

### الخانات الحصرية

| الطريقة                                    | ما الذي تسجله                                                                                                                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | محرك السياق (واحد نشط في كل مرة). تتلقى استدعاءات دورة الحياة `runtimeSettings` عندما يستطيع المضيف توفير تشخيصات النموذج/المزوّد/الوضع؛ وتُعاد محاولة المحركات الصارمة الأقدم من دون ذلك المفتاح. |
| `api.registerMemoryCapability(capability)` | قدرة ذاكرة موحدة                                                                                                                                                                                |
| `api.registerMemoryPromptSection(builder)` | باني قسم مطالبة الذاكرة                                                                                                                                                                         |
| `api.registerMemoryFlushPlan(resolver)`    | محلّل خطة تفريغ الذاكرة                                                                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | محوّل تشغيل الذاكرة                                                                                                                                                                             |

### محوّلات تضمين الذاكرة المهملة

| الطريقة                                       | ما الذي تسجله                              |
| -------------------------------------------- | ------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | محوّل تضمين الذاكرة لـ Plugin النشط        |

- `registerMemoryCapability` هي واجهة API الحصرية المفضلة لـ Plugin الذاكرة.
- قد تعرض `registerMemoryCapability` أيضًا `publicArtifacts.listArtifacts(...)`
  حتى تتمكن Plugins المصاحبة من استهلاك عناصر الذاكرة المصدّرة عبر
  `openclaw/plugin-sdk/memory-host-core` بدلًا من الوصول إلى التخطيط الخاص
  بـ Plugin ذاكرة محدد.
- `registerMemoryPromptSection` و`registerMemoryFlushPlan` و
  `registerMemoryRuntime` هي واجهات API حصرية لـ Plugin الذاكرة ومتوافقة مع الإرث.
- يستطيع `MemoryFlushPlan.model` تثبيت دورة التفريغ على مرجع `provider/model`
  دقيق، مثل `ollama/qwen3:8b`، من دون وراثة سلسلة الرجوع النشطة.
- `registerMemoryEmbeddingProvider` مهملة. يجب على مزوّدي التضمين الجدد
  استخدام `api.registerEmbeddingProvider(...)` و
  `contracts.embeddingProviders`.
- يستمر مزوّدو الذاكرة المحددون الحاليون في العمل خلال نافذة الترحيل،
  لكن تقارير فحص Plugin تسجل هذا كدين توافق لـ Plugins غير المضمّنة.

### الأحداث ودورة الحياة

| الطريقة                                     | ما الذي تفعله                 |
| ------------------------------------------ | ----------------------------- |
| `api.on(hookName, handler, opts?)`         | خطاف دورة حياة بنمط محدد      |
| `api.onConversationBindingResolved(handler)` | استدعاء ربط المحادثة          |

راجع [خطافات Plugin](/ar/plugins/hooks) للحصول على أمثلة وأسماء خطافات شائعة
ودلالات الحراسة.

### دلالات قرار الخطاف

`before_install` هو خطاف دورة حياة وقت تشغيل Plugin، وليس سطح سياسة تثبيت
المشغّل. استخدم `security.installPolicy` عندما يجب أن يغطي قرار السماح/الحظر
مسارات التثبيت أو التحديث المدعومة عبر CLI وGateway.

- `before_tool_call`: إرجاع `{ block: true }` نهائي. بمجرد أن يضبطه أي معالج، تُتخطى المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: إرجاع `{ block: false }` يُعامل على أنه لا قرار (مثل حذف `block`)، وليس كتجاوز.
- `before_install`: إرجاع `{ block: true }` نهائي. بمجرد أن يضبطه أي معالج، تُتخطى المعالجات ذات الأولوية الأدنى.
- `before_install`: إرجاع `{ block: false }` يُعامل على أنه لا قرار (مثل حذف `block`)، وليس كتجاوز.
- `reply_dispatch`: إرجاع `{ handled: true, ... }` نهائي. بمجرد أن يطالب أي معالج بالإرسال، تُتخطى المعالجات ذات الأولوية الأدنى ومسار إرسال النموذج الافتراضي.
- `message_sending`: إرجاع `{ cancel: true }` نهائي. بمجرد أن يضبطه أي معالج، تُتخطى المعالجات ذات الأولوية الأدنى.
- `message_sending`: إرجاع `{ cancel: false }` يُعامل على أنه لا قرار (مثل حذف `cancel`)، وليس كتجاوز.
- `message_received`: استخدم حقل `threadId` النمطي عندما تحتاج إلى توجيه الخيط/الموضوع الوارد. أبقِ `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: استخدم حقول التوجيه النمطية `replyToId` / `threadId` قبل الرجوع إلى `metadata` الخاصة بالقناة.
- `gateway_start`: استخدم `ctx.config` و`ctx.workspaceDir` و`ctx.getCron?.()` لحالة بدء التشغيل المملوكة لـ Gateway بدلًا من الاعتماد على خطافات `gateway:startup` الداخلية.
- `cron_changed`: راقب تغييرات دورة حياة Cron المملوكة لـ Gateway. استخدم `event.job?.state?.nextRunAtMs` و`ctx.getCron?.()` عند مزامنة مجدولات الإيقاظ الخارجية، وأبقِ OpenClaw مصدر الحقيقة لفحوصات الاستحقاق والتنفيذ.

### حقول كائن API

| الحقل                    | النوع                     | الوصف                                                                                     |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | معرّف Plugin                                                                              |
| `api.name`               | `string`                  | اسم العرض                                                                                 |
| `api.version`            | `string?`                 | إصدار Plugin (اختياري)                                                                    |
| `api.description`        | `string?`                 | وصف Plugin (اختياري)                                                                      |
| `api.source`             | `string`                  | مسار مصدر Plugin                                                                          |
| `api.rootDir`            | `string?`                 | دليل جذر Plugin (اختياري)                                                                 |
| `api.config`             | `OpenClawConfig`          | لقطة الإعدادات الحالية (لقطة وقت التشغيل النشطة داخل الذاكرة عند توفرها)                 |
| `api.pluginConfig`       | `Record<string, unknown>` | إعدادات خاصة بـ Plugin من `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime)                                               |
| `api.logger`             | `PluginLogger`            | مسجل محدود النطاق (`debug`, `info`, `warn`, `error`)                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | وضع التحميل الحالي؛ `"setup-runtime"` هو نافذة بدء التشغيل/الإعداد الخفيفة قبل الإدخال الكامل |
| `api.resolvePath(input)` | `(string) => string`      | حل المسار نسبةً إلى جذر Plugin                                                            |

## اصطلاح الوحدات الداخلية

داخل Plugin الخاص بك، استخدم ملفات barrel محلية للاستيرادات الداخلية:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  لا تستورد Plugin الخاص بك عبر `openclaw/plugin-sdk/<your-plugin>`
  من كود الإنتاج. وجّه الاستيرادات الداخلية عبر `./api.ts` أو
  `./runtime-api.ts`. مسار SDK هو العقد الخارجي فقط.
</Warning>

تفضّل الأسطح العامة لـ Plugin المضمّن والمحمّلة عبر الواجهة (`api.ts` و`runtime-api.ts`
و`index.ts` و`setup-entry.ts` وملفات الإدخال العامة المشابهة)
لقطة إعدادات وقت التشغيل النشطة عندما يكون OpenClaw قيد التشغيل بالفعل. إذا لم توجد
لقطة وقت تشغيل بعد، فإنها ترجع إلى ملف الإعدادات المحلول على القرص.
يجب تحميل واجهات Plugins المضمّنة والمعبأة عبر محمّلات واجهة Plugin في OpenClaw؛
فالاستيرادات المباشرة من `dist/extensions/...` تتجاوز فحوصات البيان والملف الجانبي
لوقت التشغيل التي تستخدمها التثبيتات المعبأة للكود المملوك لـ Plugin.

يمكن لـ Plugins المزوّدين عرض barrel عقد محلي ضيق خاص بـ Plugin عندما يكون
المساعد مقصودًا أن يكون خاصًا بالمزوّد ولا ينتمي بعد إلى مسار فرعي عام في SDK.
أمثلة مضمّنة:

- **Anthropic**: سطح `api.ts` / `contract-api.ts` العام لمساعدات البث
  الخاصة بـ beta-header لـ Claude و`service_tier`.
- **`@openclaw/openai-provider`**: يصدّر `api.ts` بُناة المزوّدين،
  ومساعدات النموذج الافتراضي، وبُناة مزوّدي الوقت الفعلي.
- **`@openclaw/openrouter-provider`**: يصدّر `api.ts` باني المزوّد
  بالإضافة إلى مساعدات التهيئة/الإعداد.

<Warning>
  يجب أن يتجنب كود إنتاج الامتداد أيضًا استيرادات `openclaw/plugin-sdk/<other-plugin>`.
  إذا كان المساعد مشتركًا حقًا، فارفعه إلى مسار فرعي محايد في SDK
  مثل `openclaw/plugin-sdk/speech` أو `.../provider-model-shared` أو سطح آخر
  موجه إلى القدرة بدلًا من ربط Pluginين معًا.
</Warning>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/ar/plugins/sdk-entrypoints">
    خيارات `definePluginEntry` و`defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/ar/plugins/sdk-runtime">
    مرجع مساحة الأسماء الكامل `api.runtime`.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/ar/plugins/sdk-setup">
    التعبئة والبيانات ومخططات الإعدادات.
  </Card>
  <Card title="Testing" icon="vial" href="/ar/plugins/sdk-testing">
    أدوات الاختبار وقواعد الفحص.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/ar/plugins/sdk-migration">
    الترحيل من الأسطح المهملة.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/ar/plugins/architecture">
    البنية العميقة ونموذج القدرات.
  </Card>
</CardGroup>
