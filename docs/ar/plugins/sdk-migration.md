---
read_when:
    - ترى تحذير OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - ترى تحذير OPENCLAW_EXTENSION_API_DEPRECATED
    - لقد استخدمت api.registerEmbeddedExtensionFactory قبل OpenClaw 2026.4.25
    - أنت تعمل على تحديث Plugin إلى معمارية Plugin الحديثة
    - أنت تتولى صيانة Plugin خارجي لـ OpenClaw
sidebarTitle: Migrate to SDK
summary: الانتقال من طبقة التوافق العكسي القديمة إلى SDK Plugin الحديث
title: ترحيل Plugin SDK
x-i18n:
    generated_at: "2026-06-27T18:17:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9061b31567cbd24196458ecb9af1cb1b0351f789a136ea26951c8fb7e576cf08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

انتقل OpenClaw من طبقة توافق عكسي واسعة إلى بنية Plugin حديثة
ذات عمليات استيراد مركزة وموثقة. إذا كان Plugin الخاص بك قد بُني قبل
البنية الجديدة، فسيساعدك هذا الدليل على الترحيل.

## ما الذي يتغير

كان نظام Plugin القديم يوفر سطحين مفتوحين على نطاق واسع يتيحان للـ Plugins استيراد
أي شيء تحتاج إليه من نقطة دخول واحدة:

- **`openclaw/plugin-sdk/compat`** - استيراد واحد يعيد تصدير عشرات
  المساعدات. أُضيف للحفاظ على عمل Plugins الأقدم القائمة على الخطافات أثناء
  بناء بنية Plugin الجديدة.
- **`openclaw/plugin-sdk/infra-runtime`** - حزمة مساعدات Runtime واسعة
  تمزج أحداث النظام، وحالة Heartbeat، وصفوف التسليم، ومساعدات fetch/proxy،
  ومساعدات الملفات، وأنواع الموافقات، وأدوات مساعدة غير مرتبطة.
- **`openclaw/plugin-sdk/config-runtime`** - حزمة توافق إعدادات واسعة
  ما زالت تحمل مساعدات تحميل/كتابة مباشرة مهملة خلال نافذة الترحيل.
- **`openclaw/extension-api`** - جسر منح Plugins وصولًا مباشرًا إلى
  مساعدات جانب المضيف مثل مشغّل الوكيل المضمّن.
- **`api.registerEmbeddedExtensionFactory(...)`** - خطاف امتداد مضمّن خاص بالمشغّل
  المضمّن فقط تمت إزالته، وكان يمكنه مراقبة أحداث المشغّل المضمّن مثل
  `tool_result`.

أصبحت أسطح الاستيراد الواسعة الآن **مهملة**. ما زالت تعمل في Runtime،
لكن يجب ألا تستخدمها Plugins الجديدة، وينبغي أن ترحّل Plugins الحالية قبل
أن يزيلها الإصدار الرئيسي التالي. أُزيلت واجهة API لتسجيل مصنع الامتداد
الخاص بالمشغّل المضمّن فقط؛ استخدم وسيط نتائج الأدوات بدلًا من ذلك.

لا يزيل OpenClaw سلوك Plugin موثقًا أو يعيد تفسيره في التغيير نفسه
الذي يقدم بديلًا. يجب أن تمر تغييرات العقود الكاسرة أولًا عبر
محوّل توافق، وتشخيصات، ووثائق، ونافذة إهمال. ينطبق ذلك على استيرادات SDK،
وحقول البيان، وواجهات API للإعداد، والخطافات، وسلوك تسجيل Runtime.

<Warning>
  ستُزال طبقة التوافق العكسي في إصدار رئيسي مستقبلي.
  ستتعطل Plugins التي ما زالت تستورد من هذه الأسطح عند حدوث ذلك.
  لم تعد تسجيلات مصانع الامتدادات المضمّنة القديمة تُحمّل بالفعل.
</Warning>

## لماذا تغيّر هذا

سبّب النهج القديم مشكلات:

- **بدء تشغيل بطيء** - كان استيراد مساعد واحد يحمّل عشرات الوحدات غير المرتبطة
- **اعتماديات دائرية** - جعلت إعادة التصدير الواسعة إنشاء دورات استيراد أمرًا سهلًا
- **سطح API غير واضح** - لم تكن هناك طريقة لمعرفة أي الصادرات مستقرة وأيها داخلية

يعالج SDK الحديث للـ Plugin هذا: كل مسار استيراد (`openclaw/plugin-sdk/\<subpath\>`)
هو وحدة صغيرة ومكتفية بذاتها ذات غرض واضح وعقد موثق.

كما أُزيلت أيضًا منافذ الملاءمة القديمة لموفّري القنوات المضمّنة.
كانت منافذ المساعدات الموسومة بالقنوات اختصارات خاصة بمستودع أحادي، وليست
عقود Plugin مستقرة. استخدم مسارات SDK فرعية عامة وضيقة بدلًا من ذلك. داخل
مساحة عمل Plugin المضمّن، أبقِ المساعدات المملوكة للموفّر في `api.ts` أو
`runtime-api.ts` الخاص بذلك Plugin.

أمثلة الموفّرين المضمّنين الحالية:

- يحتفظ Anthropic بمساعدات تدفق Claude الخاصة في منفذ `api.ts` /
  `contract-api.ts` الخاص به
- يحتفظ OpenAI ببناة الموفّر، ومساعدات النموذج الافتراضي، وبناة موفّر
  الوقت الفعلي في `api.ts` الخاص به
- يحتفظ OpenRouter بباني الموفّر ومساعدات الإعداد/التهيئة في
  `api.ts` الخاص به

## خطة ترحيل Talk والصوت في الوقت الفعلي

ينتقل كود Talk للصوت في الوقت الفعلي، والاتصالات الهاتفية، والاجتماعات، والمتصفح من
تتبع الدور المحلي لكل سطح إلى متحكم مشترك في جلسة Talk يصدّره
`openclaw/plugin-sdk/realtime-voice`. يملك المتحكم الجديد غلاف حدث Talk
المشترك، وحالة الدور النشط، وحالة الالتقاط، وحالة صوت الإخراج، وسجل الأحداث
الأخيرة، ورفض الأدوار القديمة. يجب أن تستمر Plugins الموفّرين في امتلاك
جلسات الوقت الفعلي الخاصة بالمورّد؛ ويجب أن تستمر Plugins الأسطح في امتلاك
خصوصيات الالتقاط، والتشغيل، والاتصالات الهاتفية، والاجتماعات.

ترحيل Talk هذا كاسر بنظافة عن قصد:

1. أبقِ بدائيات المتحكم/Runtime المشتركة في
   `plugin-sdk/realtime-voice`.
2. انقل الأسطح المضمّنة إلى المتحكم المشترك: ترحيل المتصفح،
   وتسليم الغرفة المُدارة، والاتصال الصوتي في الوقت الفعلي، وSTT المتدفق للاتصال الصوتي، وGoogle
   Meet في الوقت الفعلي، والضغط للتحدث الأصلي.
3. استبدل عائلات RPC القديمة لـ Talk بواجهة API النهائية `talk.session.*` و
   `talk.client.*`.
4. أعلن قناة أحداث Talk مباشرة واحدة في Gateway
   `hello-ok.features.events`: `talk.event`.
5. احذف نقطة نهاية HTTP القديمة للوقت الفعلي وأي مسار تجاوز تعليمات وقت الطلب.

يجب ألا يستدعي الكود الجديد `createTalkEventSequencer(...)` مباشرة إلا إذا كان
ينفذ محوّلًا منخفض المستوى أو أداة اختبار. فضّل المتحكم المشترك
كي لا يمكن إصدار أحداث مقيّدة بالدور دون معرّف دور، ولا يمكن لاستدعاءات `turnEnd` /
`turnCancel` القديمة مسح دور نشط أحدث، وتبقى أحداث دورة حياة صوت الإخراج
متسقة عبر الاتصالات الهاتفية، والاجتماعات، وترحيل المتصفح، وتسليم الغرفة المُدارة،
وعملاء Talk الأصليين.

شكل API العامة المستهدف هو:

```typescript
// Gateway-owned Talk session API.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

تستخدم جلسات WebRTC/موفّر websocket المملوكة للمتصفح `talk.client.create`،
لأن المتصفح يملك تفاوض الموفّر ونقل الوسائط بينما يملك Gateway
بيانات الاعتماد، والتعليمات، وسياسة الأدوات. `talk.session.*` هو السطح
المشترك المُدار بواسطة Gateway للوقت الفعلي عبر gateway-relay، والنسخ عبر
gateway-relay، وجلسات STT/TTS الأصلية للغرف المُدارة.

يجب إصلاح الإعدادات القديمة التي وضعت محددات الوقت الفعلي بجانب `talk.provider` /
`talk.providers` باستخدام `openclaw doctor --fix`؛ لا يعيد Runtime الخاص بـ Talk
تفسير إعداد موفّر الكلام/TTS باعتباره إعداد موفّر وقت فعلي.

تركيبات `talk.session.create` المدعومة صغيرة عن قصد:

| الوضع            | النقل           | العقل           | المالك              | ملاحظات                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | صوت موفّر ثنائي الاتجاه بالكامل موصول عبر Gateway؛ تُوجّه استدعاءات الأدوات عبر أداة agent-consult.      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | STT متدفق فقط؛ يرسل المستدعون صوت الإدخال ويتلقون أحداث النص.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | غرفة أصلية/عميل | غرف بأسلوب الضغط للتحدث واللاسلكي حيث يملك العميل الالتقاط/التشغيل ويملك Gateway حالة الدور. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | غرفة أصلية/عميل | وضع غرفة للمسؤولين فقط للأسطح الموثوقة من الطرف الأول التي تنفذ إجراءات أدوات Gateway مباشرة.                  |

خريطة الطرق المُزالة:

| القديم                              | الجديد                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` or `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

كما أن مفردات التحكم الموحّدة ضيقة عمدًا:

  | الطريقة                          | ينطبق على                                              | العقد                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | إلحاق جزء صوت PCM بترميز base64 بجلسة المزوّد المملوكة لاتصال Gateway نفسه.                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | بدء دور مستخدم في غرفة مُدارة.                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | إنهاء الدور النشط بعد التحقق من الدور القديم.                                                                                                                                         |
  | `talk.session.cancelTurn`       | كل الجلسات المملوكة لـ Gateway                              | إلغاء عمل الالتقاط/المزوّد/الوكيل/TTS النشط لدور ما.                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | إيقاف إخراج صوت المساعد دون إنهاء دور المستخدم بالضرورة.                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | إكمال استدعاء أداة مزوّد صادر عن المرحّل؛ مرّر `options.willContinue` للإخراج المؤقت أو `options.suppressResponse` لتلبية الاستدعاء دون استجابة مساعد أخرى. |
  | `talk.session.steer`            | جلسات Talk المدعومة بوكيل                              | إرسال تحكم منطوق من نوع `status` أو `steer` أو `cancel` أو `followup` إلى التشغيل المضمّن النشط المحسوم من جلسة Talk.                                                                |
  | `talk.session.close`            | كل الجلسات الموحّدة                                    | إيقاف جلسات المرحّل أو إبطال حالة الغرفة المُدارة، ثم نسيان معرّف الجلسة الموحّدة.                                                                                                    |

  لا تُدخل حالات خاصة للمزوّد أو المنصة في النواة لإنجاح هذا.
  تملك النواة دلالات جلسات Talk. وتملك Plugins المزوّد إعداد جلسات البائع.
  وتملك المكالمات الصوتية وGoogle Meet محوّلات الهاتفية/الاجتماعات. وتملك تطبيقات المتصفح والتطبيقات الأصلية
  تجربة مستخدم التقاط/تشغيل الجهاز.

  ## سياسة التوافق

  بالنسبة إلى Plugins الخارجية، يتبع عمل التوافق هذا الترتيب:

  1. أضف العقد الجديد
  2. أبقِ السلوك القديم موصولًا عبر محوّل توافق
  3. أصدر تشخيصًا أو تحذيرًا يذكر المسار القديم والبديل
  4. غطِّ المسارين كليهما في الاختبارات
  5. وثّق الإهمال ومسار الترحيل
  6. لا تُزل إلا بعد نافذة الترحيل المعلنة، عادةً في إصدار رئيسي

  يمكن للمشرفين تدقيق قائمة انتظار الترحيل الحالية باستخدام
  `pnpm plugins:boundary-report`. استخدم `pnpm plugins:boundary-report:summary` للحصول على
  أعداد موجزة، و`--owner <id>` لـ Plugin واحد أو مالك توافق واحد، و
  `pnpm plugins:boundary-report:ci` عندما يجب أن تفشل بوابة CI بسبب سجلات توافق
  مستحقة، أو استيرادات SDK محجوزة عابرة للمالكين، أو مسارات SDK فرعية محجوزة
  غير مستخدمة. يجمّع التقرير سجلات التوافق المهملة
  حسب تاريخ الإزالة، ويعدّ مراجع الكود/المستندات المحلية،
  ويُظهر استيرادات SDK المحجوزة العابرة للمالكين، ويلخّص جسر SDK الخاص
  بمضيف الذاكرة بحيث يبقى تنظيف التوافق صريحًا بدلًا من
  الاعتماد على عمليات بحث مرتجلة. يجب أن تكون لمسارات SDK الفرعية المحجوزة استخدامات مالك متتبعة؛
  وينبغي إزالة صادرات المساعد المحجوزة غير المستخدمة من SDK العام.

  إذا ظل حقل بيان مقبولًا، فيمكن لمؤلفي Plugin الاستمرار في استخدامه حتى
  تقول المستندات والتشخيصات خلاف ذلك. يجب أن يفضّل الكود الجديد البديل
  الموثّق، لكن لا ينبغي أن تتعطل Plugins الحالية أثناء الإصدارات الثانوية
  العادية.

  ## كيفية الترحيل

  <Steps>
  <Step title="رحّل مساعدين تحميل/كتابة تهيئة وقت التشغيل">
    يجب أن تتوقف Plugins المضمّنة عن استدعاء
    `api.runtime.config.loadConfig()` و
    `api.runtime.config.writeConfigFile(...)` مباشرةً. فضّل التهيئة التي
    مُرّرت بالفعل إلى مسار الاستدعاء النشط. يمكن للمعالجات طويلة العمر التي تحتاج إلى
    لقطة العملية الحالية استخدام `api.runtime.config.current()`. يجب على
    أدوات الوكيل طويلة العمر استخدام `ctx.getRuntimeConfig()` من سياق الأداة داخل
    `execute` بحيث تظل الأداة التي أُنشئت قبل كتابة تهيئة ترى تهيئة
    وقت التشغيل المحدّثة.

    يجب أن تمر كتابات التهيئة عبر المساعدين المعامليين وأن تختار
    سياسة ما بعد الكتابة:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    استخدم `afterWrite: { mode: "restart", reason: "..." }` عندما يعرف المستدعي
    أن التغيير يتطلب إعادة تشغيل نظيفة لـ Gateway، و
    `afterWrite: { mode: "none", reason: "..." }` فقط عندما يملك المستدعي
    المتابعة ويريد عمدًا كتم مخطط إعادة التحميل.
    تتضمن نتائج التعديل ملخص `followUp` ذا نوع محدد للاختبارات والتسجيل؛
    ويظل Gateway مسؤولًا عن تطبيق إعادة التشغيل أو جدولتها.
    تبقى `loadConfig` و`writeConfigFile` كمساعدي توافق مهملين
    لـ Plugins الخارجية خلال نافذة الترحيل، وتحذّر مرة واحدة باستخدام
    رمز التوافق `runtime-config-load-write`. تتم حماية Plugins المضمّنة وكود وقت التشغيل
    في المستودع بواسطة حواجز ماسح في
    `pnpm check:deprecated-api-usage` و
    `pnpm check:no-runtime-action-load-config`: يفشل استخدام Plugin إنتاجي جديد
    مباشرةً، وتفشل كتابات التهيئة المباشرة، ويجب أن تستخدم طرق خادم Gateway
    لقطة وقت تشغيل الطلب، ويجب أن يتلقى مساعدو إرسال/إجراء/عميل قناة وقت التشغيل
    التهيئة من حدّهم، ولا يُسمح للوحدات طويلة العمر في وقت التشغيل بأي
    استدعاءات `loadConfig()` محيطية.

    يجب على كود Plugin الجديد أيضًا تجنب استيراد حزمة التوافق الواسعة
    `openclaw/plugin-sdk/config-runtime`. استخدم مسار SDK الفرعي الضيق
    الذي يطابق المهمة:

    | الحاجة | الاستيراد |
    | --- | --- |
    | أنواع التهيئة مثل `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | تأكيدات التهيئة المحمّلة مسبقًا والبحث عن تهيئة مدخل Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | قراءات لقطة وقت التشغيل الحالية | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | كتابات التهيئة | `openclaw/plugin-sdk/config-mutation` |
    | مساعدو مخزن الجلسات | `openclaw/plugin-sdk/session-store-runtime` |
    | تهيئة جدول Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | مساعدو وقت تشغيل سياسة المجموعة | `openclaw/plugin-sdk/runtime-group-policy` |
    | حل إدخال السر | `openclaw/plugin-sdk/secret-input-runtime` |
    | تجاوزات النموذج/الجلسة | `openclaw/plugin-sdk/model-session-runtime` |

    تخضع Plugins المضمّنة واختباراتها لحراسة الماسح ضد الحزمة الواسعة
    حتى تبقى الاستيرادات والمحاكيات محلية للسلوك الذي تحتاجه. لا تزال الحزمة الواسعة
    موجودة للتوافق الخارجي، لكن لا ينبغي أن يعتمد عليها الكود الجديد.

  </Step>

  <Step title="رحّل امتدادات نتائج الأدوات المضمّنة إلى برمجية وسيطة">
    يجب أن تستبدل Plugins المضمّنة معالجات نتائج الأدوات الخاصة بالمشغّل المضمّن فقط
    `api.registerEmbeddedExtensionFactory(...)` ببرمجية وسيطة محايدة لوقت التشغيل.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    حدّث بيان Plugin في الوقت نفسه:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    يمكن لـ Plugins المثبّتة أيضًا تسجيل برمجية وسيطة لنتائج الأدوات عندما تكون
    مفعّلة صراحةً وتعلن كل وقت تشغيل مستهدف في
    `contracts.agentToolResultMiddleware`. تُرفض تسجيلات البرمجية الوسيطة المثبّتة
    غير المعلنة.

  </Step>

  <Step title="رحّل معالجات الموافقة الأصلية إلى حقائق القدرة">
    تعرض Plugins القنوات القادرة على الموافقة الآن سلوك الموافقة الأصلي عبر
    `approvalCapability.nativeRuntime` بالإضافة إلى سجل سياق وقت التشغيل المشترك.

    التغييرات الرئيسية:

    - استبدل `approvalCapability.handler.loadRuntime(...)` بـ
      `approvalCapability.nativeRuntime`
    - انقل المصادقة/التسليم الخاصة بالموافقة من توصيل `plugin.auth` /
      `plugin.approvals` القديم إلى `approvalCapability`
    - أُزيل `ChannelPlugin.approvals` من عقد Plugin القناة
      العام؛ انقل حقول التسليم/الأصلي/العرض إلى `approvalCapability`
    - يبقى `plugin.auth` لتدفقات تسجيل الدخول/الخروج للقناة فقط؛ لم تعد النواة
      تقرأ خطافات مصادقة الموافقة هناك
    - سجّل كائنات وقت التشغيل المملوكة للقناة مثل العملاء أو الرموز أو تطبيقات Bolt
      عبر `openclaw/plugin-sdk/channel-runtime-context`
    - لا ترسل إشعارات إعادة توجيه مملوكة لـ Plugin من معالجات الموافقة الأصلية؛
      تملك النواة الآن إشعارات التوجيه إلى مكان آخر من نتائج التسليم الفعلية
    - عند تمرير `channelRuntime` إلى `createChannelManager(...)`، قدّم
      سطح `createPluginRuntime().channel` حقيقيًا. تُرفض البدائل الجزئية.

    راجع `/plugins/sdk-channel-plugins` لتخطيط قدرة الموافقة الحالي.

  </Step>

  <Step title="دقّق سلوك بديل مغلّف Windows">
    إذا كان Plugin الخاص بك يستخدم `openclaw/plugin-sdk/windows-spawn`، فإن مغلّفات Windows
    غير المحلولة `.cmd`/`.bat` تفشل الآن بصورة مغلقة ما لم تمرّر صراحةً
    `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    إذا كان المستدعي لديك لا يعتمد عمدًا على بديل shell، فلا تضبط
    `allowShellFallback` وتعامل مع الخطأ المرمى بدلًا من ذلك.

  </Step>

  <Step title="اعثر على الاستيرادات المهملة">
    ابحث في Plugin الخاص بك عن استيرادات من أي من السطحين المهملين:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="استبدلها باستيرادات مركّزة">
    يطابق كل تصدير من السطح القديم مسار استيراد حديثًا محددًا:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    بالنسبة إلى مساعدي جهة المضيف، استخدم وقت تشغيل Plugin المحقون بدلًا من الاستيراد
    مباشرةً:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    ينطبق النمط نفسه على مساعدات الجسر القديمة الأخرى:

    | الاستيراد القديم | المكافئ الحديث |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | مساعدات مخزن الجلسات | `api.runtime.agent.session.*` |

  </Step>

  <Step title="استبدال استيرادات infra-runtime الواسعة">
    لا يزال `openclaw/plugin-sdk/infra-runtime` موجودًا للتوافق الخارجي،
    لكن ينبغي للكود الجديد استيراد سطح المساعدات المحدد الذي يحتاجه
    فعليًا:

    | الحاجة | الاستيراد |
    | --- | --- |
    | مساعدات طابور أحداث النظام | `openclaw/plugin-sdk/system-event-runtime` |
    | مساعدات إيقاظ Heartbeat والأحداث والرؤية | `openclaw/plugin-sdk/heartbeat-runtime` |
    | تفريغ طابور التسليم المعلّق | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | قياسات نشاط القناة | `openclaw/plugin-sdk/channel-activity-runtime` |
    | مخازن إزالة التكرار المؤقتة داخل الذاكرة | `openclaw/plugin-sdk/dedupe-runtime` |
    | مساعدات آمنة لمسارات الملفات/الوسائط المحلية | `openclaw/plugin-sdk/file-access-runtime` |
    | جلب واعٍ بالموزّع | `openclaw/plugin-sdk/runtime-fetch` |
    | مساعدات الوكيل والجلب المحروس | `openclaw/plugin-sdk/fetch-runtime` |
    | أنواع سياسة موزّع SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | أنواع طلب/حل الموافقة | `openclaw/plugin-sdk/approval-runtime` |
    | حمولة رد الموافقة ومساعدات الأوامر | `openclaw/plugin-sdk/approval-reply-runtime` |
    | مساعدات تنسيق الأخطاء | `openclaw/plugin-sdk/error-runtime` |
    | انتظار جاهزية النقل | `openclaw/plugin-sdk/transport-ready-runtime` |
    | مساعدات الرموز الآمنة | `openclaw/plugin-sdk/secure-random-runtime` |
    | تزامن مهام غير متزامنة محدود | `openclaw/plugin-sdk/concurrency-runtime` |
    | تحويل رقمي قسري | `openclaw/plugin-sdk/number-runtime` |
    | قفل غير متزامن محلي للعملية | `openclaw/plugin-sdk/async-lock-runtime` |
    | أقفال الملفات | `openclaw/plugin-sdk/file-lock` |

    تخضع Plugins المضمّنة لحراسة ماسح ضد `infra-runtime`، لذلك لا يمكن لكود
    المستودع أن يرتد إلى البرميل الواسع.

  </Step>

  <Step title="ترحيل مساعدات مسار القناة">
    ينبغي لكود مسار القناة الجديد استخدام `openclaw/plugin-sdk/channel-route`.
    تبقى أسماء route-key وcomparable-target الأقدم كأسماء توافق بديلة
    خلال نافذة الترحيل، لكن ينبغي للـ Plugins الجديدة استخدام أسماء المسارات
    التي تصف السلوك مباشرة:

    | المساعد القديم | المساعد الحديث |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    تعمل مساعدات المسار الحديثة على تطبيع `{ channel, to, accountId, threadId }`
    باتساق عبر الموافقات الأصلية، وكبت الردود، وإزالة تكرار الوارد،
    وتسليم Cron، وتوجيه الجلسات.

    لا تضف استخدامات جديدة لـ `ChannelMessagingAdapter.parseExplicitTarget` أو
    مساعدات المسار المحمّل المدعومة بالمحلّل (`parseExplicitTargetForLoadedChannel`
    أو `resolveRouteTargetForLoadedChannel`) أو
    `resolveChannelRouteTargetWithParser(...)` من `plugin-sdk/channel-route`.
    هذه الخطافات مهجورة ولا تبقى إلا للـ Plugins الأقدم خلال
    نافذة الترحيل. ينبغي لـ Plugins القنوات الجديدة استخدام
    `messaging.targetResolver.resolveTarget(...)` لتطبيع معرف الهدف
    والرجوع عند غياب الدليل، و`messaging.inferTargetChatType(...)` عندما يحتاج
    اللب إلى نوع نظير مبكر، و`messaging.resolveOutboundSessionRoute(...)`
    لهوية الجلسة والخيط الأصلية لدى المزوّد.

  </Step>

  <Step title="البناء والاختبار">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## مرجع مسارات الاستيراد

  <Accordion title="Common import path table">
  | مسار الاستيراد | الغرض | أهم التصديرات |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | مساعد إدخال Plugin القانوني | `definePluginEntry` |
  | `plugin-sdk/core` | إعادة تصدير مظلة قديمة لتعريفات/بُنّاء إدخال القنوات | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | تصدير مخطط إعدادات الجذر | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | مساعد إدخال لمزوّد واحد | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعريفات وبُنّاء إدخال القنوات المركزة | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة | مترجم الإعداد، مطالبات قائمة السماح، بُنّاء حالة الإعداد |
  | `plugin-sdk/setup-runtime` | مساعدات وقت تشغيل الإعداد | `createSetupTranslator`، محولات تصحيحات إعداد آمنة للاستيراد، مساعدات ملاحظات البحث، `promptResolvedAllowFrom`, `splitSetupEntries`، وكلاء إعداد مفوّضون |
  | `plugin-sdk/setup-adapter-runtime` | اسم بديل مهمل لمحول الإعداد | استخدم `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | مساعدات أدوات الإعداد | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | مساعدات الحسابات المتعددة | مساعدات قائمة الحسابات/الإعدادات/بوابة الإجراءات |
  | `plugin-sdk/account-id` | مساعدات معرّف الحساب | `DEFAULT_ACCOUNT_ID`، تطبيع معرّف الحساب |
  | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب | مساعدات البحث عن الحساب + الرجوع الافتراضي |
  | `plugin-sdk/account-helpers` | مساعدات الحساب الضيقة | مساعدات قائمة الحسابات/إجراءات الحساب |
  | `plugin-sdk/channel-setup` | محولات معالج الإعداد | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، إضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | بدائيات إقران DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | بادئة الرد، والكتابة، وتوصيل التسليم من المصدر | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | مصانع محولات الإعداد ومساعدات وصول DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | بُنّاء مخططات الإعداد | بدائيات مخطط إعداد القناة المشتركة والبنّاء العام فقط |
  | `plugin-sdk/bundled-channel-config-schema` | مخططات الإعداد المجمّعة | Plugins المجمّعة التي يصونها OpenClaw فقط؛ يجب أن تعرّف Plugins الجديدة مخططات محلية للـ Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | مخططات إعداد مجمّعة مهملة | اسم بديل للتوافق فقط؛ استخدم `plugin-sdk/bundled-channel-config-schema` للـ Plugins المجمّعة المصانة |
  | `plugin-sdk/telegram-command-config` | مساعدات إعداد أوامر Telegram | تطبيع أسماء الأوامر، تشذيب الوصف، التحقق من التكرار/التعارض |
  | `plugin-sdk/channel-policy` | حل سياسة المجموعة/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | واجهة توافق مهملة | استخدم `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | مساعدات المظروف الوارد | مساعدات مشتركة لبناء المسارات + المظاريف |
  | `plugin-sdk/channel-inbound` | مساعدات الاستلام الوارد | بناء السياق، والتنسيق، والجذور، والمشغلات، وإرسال الرد المُحضّر، ومسوغات الإرسال |
  | `plugin-sdk/messaging-targets` | مسار استيراد مهمل لتحليل الهدف | استخدم `plugin-sdk/channel-targets` لمساعدات تحليل الأهداف العامة، و`plugin-sdk/channel-route` لمقارنة المسارات، و`messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` المملوكين للـ Plugin لحل الأهداف الخاصة بالمزوّد |
  | `plugin-sdk/outbound-media` | مساعدات الوسائط الصادرة | تحميل الوسائط الصادرة المشتركة |
  | `plugin-sdk/outbound-send-deps` | واجهة توافق مهملة | استخدم `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | مساعدات دورة حياة الرسائل الصادرة | محولات الرسائل، والإيصالات، ومساعدات الإرسال الدائم، ومساعدات المعاينة/البث المباشر، وخيارات الرد، ومساعدات دورة الحياة، والهوية الصادرة، وتخطيط الحمولة |
  | `plugin-sdk/channel-streaming` | واجهة توافق مهملة | استخدم `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | واجهة توافق مهملة | استخدم `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | مساعدات ربط السلاسل | دورة حياة ربط السلاسل ومساعدات المحولات |
  | `plugin-sdk/agent-media-payload` | مساعدات حمولة الوسائط القديمة | بانٍ لحمولة وسائط الوكيل لتخطيطات الحقول القديمة |
  | `plugin-sdk/channel-runtime` | طبقة توافق مهملة | أدوات وقت تشغيل القناة القديمة فقط |
  | `plugin-sdk/channel-send-result` | أنواع نتيجة الإرسال | أنواع نتيجة الرد |
  | `plugin-sdk/runtime-store` | تخزين Plugin دائم | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | مساعدات وقت تشغيل واسعة | مساعدات وقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
  | `plugin-sdk/runtime-env` | مساعدات بيئة وقت تشغيل ضيقة | مساعدات المسجل/بيئة وقت التشغيل، والمهلة، وإعادة المحاولة، والتراجع |
  | `plugin-sdk/plugin-runtime` | مساعدات وقت تشغيل Plugin المشتركة | مساعدات أوامر/خطافات/http/تفاعلية للـ Plugin |
  | `plugin-sdk/hook-runtime` | مساعدات مسار الخطافات | مساعدات مسار Webhook/الخطافات الداخلية المشتركة |
  | `plugin-sdk/lazy-runtime` | مساعدات وقت التشغيل الكسول | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | مساعدات العمليات | مساعدات تنفيذ مشتركة |
  | `plugin-sdk/cli-runtime` | مساعدات وقت تشغيل CLI | تنسيق الأوامر، والانتظار، ومساعدات الإصدار |
  | `plugin-sdk/gateway-runtime` | مساعدات Gateway | عميل Gateway، ومساعد بدء جاهزية حلقة الأحداث، ومساعدات تصحيح حالة القناة |
  | `plugin-sdk/config-runtime` | طبقة توافق إعدادات مهملة | فضّل `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, و`config-mutation` |
  | `plugin-sdk/telegram-command-config` | مساعدات أوامر Telegram | مساعدات تحقق من أوامر Telegram ثابتة عند الرجوع عندما يكون سطح عقد Telegram المجمّع غير متاح |
  | `plugin-sdk/approval-runtime` | مساعدات مطالبة الموافقة | حمولة موافقة التنفيذ/Plugin، ومساعدات قدرة/ملف الموافقة، ومساعدات توجيه/وقت تشغيل الموافقة الأصلية، وتنسيق مسار عرض الموافقة المنظم |
  | `plugin-sdk/approval-auth-runtime` | مساعدات مصادقة الموافقة | حل الموافق، ومصادقة إجراءات المحادثة نفسها |
  | `plugin-sdk/approval-client-runtime` | مساعدات عميل الموافقة | مساعدات ملف/مرشح موافقة التنفيذ الأصلية |
  | `plugin-sdk/approval-delivery-runtime` | مساعدات تسليم الموافقة | محولات قدرة/تسليم الموافقة الأصلية |
  | `plugin-sdk/approval-gateway-runtime` | مساعدات Gateway للموافقة | مساعد مشترك لحل Gateway للموافقة |
  | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات محول الموافقة | مساعدات خفيفة لتحميل محول الموافقة الأصلية لنقاط إدخال القنوات الساخنة |
  | `plugin-sdk/approval-handler-runtime` | مساعدات معالج الموافقة | مساعدات وقت تشغيل أوسع لمعالج الموافقة؛ فضّل مسارات المحول/Gateway الأضيق عندما تكون كافية |
  | `plugin-sdk/approval-native-runtime` | مساعدات هدف الموافقة | مساعدات ربط هدف/حساب الموافقة الأصلية |
  | `plugin-sdk/approval-reply-runtime` | مساعدات رد الموافقة | مساعدات حمولة رد موافقة التنفيذ/Plugin |
  | `plugin-sdk/channel-runtime-context` | مساعدات سياق وقت تشغيل القناة | مساعدات عامة لتسجيل/جلب/مراقبة سياق وقت تشغيل القناة |
  | `plugin-sdk/security-runtime` | مساعدات الأمان | مساعدات الثقة المشتركة، وبوابة DM، وملفات/مسارات محدودة بالجذر، والمحتوى الخارجي، وجمع الأسرار |
  | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF | مساعدات قائمة السماح للمضيفين وسياسة الشبكات الخاصة |
  | `plugin-sdk/ssrf-runtime` | مساعدات وقت تشغيل SSRF | مرسل مثبت، وجلب محمي، ومساعدات سياسة SSRF |
  | `plugin-sdk/system-event-runtime` | مساعدات أحداث النظام | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | مساعدات Heartbeat | مساعدات إيقاظ Heartbeat وحدثه وظهوره |
  | `plugin-sdk/delivery-queue-runtime` | مساعدات قائمة انتظار التسليم | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | مساعدات نشاط القناة | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | مساعدات إزالة التكرار | مخابئ إزالة تكرار داخل الذاكرة |
  | `plugin-sdk/file-access-runtime` | مساعدات الوصول إلى الملفات | مساعدات آمنة لمسارات الملفات/الوسائط المحلية |
  | `plugin-sdk/transport-ready-runtime` | مساعدات جاهزية النقل | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | مساعدات سياسة موافقة التنفيذ | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | مساعدات المخبأ المحدود | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | مساعدات بوابة التشخيص | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | مساعدات تنسيق الأخطاء | `formatUncaughtError`, `isApprovalNotFoundError`، مساعدات مخطط الأخطاء |
  | `plugin-sdk/fetch-runtime` | مساعدات جلب/وكيل مغلّفة | `resolveFetch`، مساعدات الوكيل، مساعدات خيارات EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | مساعدات تطبيع المضيف | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | مساعدات إعادة المحاولة | `RetryConfig`, `retryAsync`، مشغلات السياسات |
  | `plugin-sdk/allow-from` | تنسيق قائمة السماح وربط الإدخال | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | بوابة الأوامر ومساعدات سطح الأوامر | `resolveControlCommandGate`، مساعدات تخويل المرسل، مساعدات سجل الأوامر بما في ذلك تنسيق قائمة الوسيطات الديناميكية |
  | `plugin-sdk/command-status` | عارضات حالة/مساعدة الأوامر | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تحليل إدخال السر | مساعدات إدخال الأسرار |
  | `plugin-sdk/webhook-ingress` | مساعدات طلبات Webhook | أدوات أهداف Webhook |
  | `plugin-sdk/webhook-request-guards` | مساعدات حارس جسم Webhook | مساعدات قراءة/تحديد جسم الطلب |
  | `plugin-sdk/reply-runtime` | وقت تشغيل الرد المشترك | الإرسال الوارد، وHeartbeat، ومخطط الرد، والتقسيم إلى مقاطع |
  | `plugin-sdk/reply-dispatch-runtime` | مساعدات إرسال رد ضيقة | الإنهاء، وإرسال المزوّد، ومساعدات تسمية المحادثة |
  | `plugin-sdk/reply-history` | مساعدات سجل الردود | `createChannelHistoryWindow`؛ تصديرات توافق مهملة لمساعدات الخريطة مثل `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, و`clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | تخطيط مرجع الرد | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | مساعدات مقاطع الرد | مساعدات تقسيم النص/Markdown إلى مقاطع |
  | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسات | مساعدات مسار المخزن + وقت التحديث |
  | `plugin-sdk/state-paths` | مساعدات مسارات الحالة | مساعدات أدلة الحالة وOAuth |
  | `plugin-sdk/routing` | مساعدات التوجيه/مفتاح الجلسة | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, مساعدات تسوية مفاتيح الجلسات |
  | `plugin-sdk/status-helpers` | مساعدات حالة القناة | بناة ملخص حالة القناة/الحساب، وافتراضيات حالة وقت التشغيل، ومساعدات بيانات تعريف المشكلات |
  | `plugin-sdk/target-resolver-runtime` | مساعدات محلل الهدف | مساعدات محلل الهدف المشتركة |
  | `plugin-sdk/string-normalization-runtime` | مساعدات تسوية السلاسل | مساعدات تسوية الشرائح/السلاسل |
  | `plugin-sdk/request-url` | مساعدات عنوان URL للطلب | استخراج عناوين URL النصية من مدخلات شبيهة بالطلبات |
  | `plugin-sdk/run-command` | مساعدات الأوامر الموقوتة | مشغل أوامر موقوت مع stdout/stderr موحدين |
  | `plugin-sdk/param-readers` | قارئات المعاملات | قارئات معاملات مشتركة للأدوات/CLI |
  | `plugin-sdk/tool-payload` | استخراج حمولة الأداة | استخراج حمولات موحدة من كائنات نتائج الأداة |
  | `plugin-sdk/tool-send` | استخراج إرسال الأداة | استخراج حقول هدف الإرسال القياسية من وسائط الأداة |
  | `plugin-sdk/temp-path` | مساعدات المسارات المؤقتة | مساعدات مسارات التنزيل المؤقت المشتركة |
  | `plugin-sdk/logging-core` | مساعدات التسجيل | مسجل النظام الفرعي ومساعدات التنقيح |
  | `plugin-sdk/markdown-table-runtime` | مساعدات جداول Markdown | مساعدات أوضاع جداول Markdown |
  | `plugin-sdk/reply-payload` | أنواع ردود الرسائل | أنواع حمولات الرد |
  | `plugin-sdk/provider-setup` | مساعدات إعداد مزود محلي/مستضاف ذاتيا منتقاة | مساعدات اكتشاف/تكوين المزود المستضاف ذاتيا |
  | `plugin-sdk/self-hosted-provider-setup` | مساعدات إعداد مزود مستضاف ذاتيا ومتوافق مع OpenAI مركزة | مساعدات اكتشاف/تكوين المزود المستضاف ذاتيا نفسها |
  | `plugin-sdk/provider-auth-runtime` | مساعدات مصادقة المزود في وقت التشغيل | مساعدات حل مفتاح API في وقت التشغيل |
  | `plugin-sdk/provider-auth-api-key` | مساعدات إعداد مفتاح API للمزود | مساعدات التهيئة/كتابة الملف التعريفي لمفتاح API |
  | `plugin-sdk/provider-auth-result` | مساعدات نتيجة مصادقة المزود | باني نتيجة مصادقة OAuth القياسية |
  | `plugin-sdk/provider-selection-runtime` | مساعدات اختيار المزود | اختيار المزود المكون أو التلقائي ودمج تكوين المزود الخام |
  | `plugin-sdk/provider-env-vars` | مساعدات متغيرات البيئة للمزود | مساعدات البحث عن متغيرات بيئة مصادقة المزود |
  | `plugin-sdk/provider-model-shared` | مساعدات نموذج/إعادة تشغيل المزود المشتركة | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, بناة سياسة إعادة التشغيل المشتركة، ومساعدات نقاط نهاية المزود، ومساعدات تسوية معرفات النماذج |
  | `plugin-sdk/provider-catalog-shared` | مساعدات كتالوج المزود المشتركة | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | تصحيحات تهيئة المزود | مساعدات تكوين التهيئة |
  | `plugin-sdk/provider-http` | مساعدات HTTP للمزود | مساعدات قدرات HTTP/نقاط النهاية العامة للمزود، بما في ذلك مساعدات نموذج multipart لنسخ الصوت |
  | `plugin-sdk/provider-web-fetch` | مساعدات جلب الويب للمزود | مساعدات تسجيل/ذاكرة التخزين المؤقت لمزود جلب الويب |
  | `plugin-sdk/provider-web-search-config-contract` | مساعدات تكوين بحث الويب للمزود | مساعدات تكوين/بيانات اعتماد بحث الويب الضيقة للمزودين الذين لا يحتاجون إلى ربط تفعيل Plugin |
  | `plugin-sdk/provider-web-search-contract` | مساعدات عقد بحث الويب للمزود | مساعدات عقد تكوين/بيانات اعتماد بحث الويب الضيقة مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، ومحددات/جالبات بيانات الاعتماد محددة النطاق |
  | `plugin-sdk/provider-web-search` | مساعدات بحث الويب للمزود | مساعدات تسجيل/ذاكرة التخزين المؤقت/وقت التشغيل لمزود بحث الويب |
  | `plugin-sdk/provider-tools` | مساعدات توافق أدوات/مخطط المزود | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف مخططات DeepSeek/Gemini/OpenAI + التشخيصات |
  | `plugin-sdk/provider-usage` | مساعدات استخدام المزود | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`، ومساعدات استخدام مزودين أخرى |
  | `plugin-sdk/provider-stream` | مساعدات مغلفات تدفق المزود | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع مغلفات التدفق، ومساعدات مغلفات Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot المشتركة |
  | `plugin-sdk/provider-transport-runtime` | مساعدات نقل المزود | مساعدات نقل المزود الأصلية مثل الجلب المحروس، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
  | `plugin-sdk/keyed-async-queue` | طابور غير متزامن مرتب | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | مساعدات الوسائط المشتركة | مساعدات جلب/تحويل/تخزين الوسائط، واستكشاف أبعاد الفيديو المدعوم بـ ffprobe، وبناة حمولات الوسائط |
  | `plugin-sdk/media-generation-runtime` | مساعدات توليد الوسائط المشتركة | مساعدات تجاوز الفشل المشتركة، واختيار المرشحين، ورسائل النموذج المفقود لتوليد الصور/الفيديو/الموسيقى |
  | `plugin-sdk/media-understanding` | مساعدات فهم الوسائط | أنواع مزود فهم الوسائط بالإضافة إلى صادرات مساعدات الصور/الصوت المواجهة للمزود |
  | `plugin-sdk/text-runtime` | تصدير توافق نصي واسع مهمل | استخدم `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, و`logging-core` |
  | `plugin-sdk/text-chunking` | مساعدات تقسيم النص | مساعد تقسيم النص الصادر |
  | `plugin-sdk/speech` | مساعدات الكلام | أنواع مزود الكلام بالإضافة إلى مساعدات التوجيه، والسجل، والتحقق المواجهة للمزود، وباني TTS متوافق مع OpenAI |
  | `plugin-sdk/speech-core` | نواة الكلام المشتركة | أنواع مزود الكلام، والسجل، والتوجيهات، والتسوية |
  | `plugin-sdk/realtime-transcription` | مساعدات النسخ في الوقت الفعلي | أنواع المزود، ومساعدات السجل، ومساعد جلسة WebSocket المشتركة |
  | `plugin-sdk/realtime-voice` | مساعدات الصوت في الوقت الفعلي | أنواع المزود، ومساعدات السجل/الحل، ومساعدات جلسة الجسر، وطوابير رد كلام الوكيل المشتركة، والتحكم الصوتي في التشغيل النشط، وصحة النص/الأحداث، وكبح الصدى، ومطابقة أسئلة الاستشارة، وتنسيق الاستشارة القسرية، وتتبع سياق الدور، وتتبع نشاط المخرجات، ومساعدات استشارة السياق السريعة |
  | `plugin-sdk/image-generation` | مساعدات توليد الصور | أنواع مزود توليد الصور بالإضافة إلى مساعدات أصول الصور/عناوين URL للبيانات وباني مزود الصور المتوافق مع OpenAI |
  | `plugin-sdk/image-generation-core` | نواة توليد الصور المشتركة | أنواع توليد الصور، وتجاوز الفشل، والمصادقة، ومساعدات السجل |
  | `plugin-sdk/music-generation` | مساعدات توليد الموسيقى | أنواع مزود/طلب/نتيجة توليد الموسيقى |
  | `plugin-sdk/music-generation-core` | نواة توليد الموسيقى المشتركة | أنواع توليد الموسيقى، ومساعدات تجاوز الفشل، والبحث عن المزود، وتحليل مرجع النموذج |
  | `plugin-sdk/video-generation` | مساعدات توليد الفيديو | أنواع مزود/طلب/نتيجة توليد الفيديو |
  | `plugin-sdk/video-generation-core` | نواة توليد الفيديو المشتركة | أنواع توليد الفيديو، ومساعدات تجاوز الفشل، والبحث عن المزود، وتحليل مرجع النموذج |
  | `plugin-sdk/interactive-runtime` | مساعدات الرد التفاعلي | تسوية/اختزال حمولة الرد التفاعلي |
  | `plugin-sdk/channel-config-primitives` | بدائيات تكوين القناة | بدائيات مخطط تكوين القناة الضيقة |
  | `plugin-sdk/channel-config-writes` | مساعدات كتابة تكوين القناة | مساعدات تفويض كتابة تكوين القناة |
  | `plugin-sdk/channel-plugin-common` | تمهيد القناة المشترك | صادرات تمهيد Plugin القناة المشتركة |
  | `plugin-sdk/channel-status` | مساعدات حالة القناة | مساعدات لقطة/ملخص حالة القناة المشتركة |
  | `plugin-sdk/allowlist-config-edit` | مساعدات تكوين قائمة السماح | مساعدات تعديل/قراءة تكوين قائمة السماح |
  | `plugin-sdk/group-access` | مساعدات وصول المجموعة | مساعدات قرار وصول المجموعة المشتركة |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | واجهات توافق مهملة | استخدم `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | مساعدات حراسة Direct-DM | مساعدات سياسة الحراسة الضيقة قبل التشفير |
  | `plugin-sdk/extension-shared` | مساعدات الامتداد المشتركة | بدائيات مساعدات القناة السلبية/الحالة والوكيل المحيط |
  | `plugin-sdk/webhook-targets` | مساعدات هدف Webhook | مساعدات سجل أهداف Webhook وتثبيت المسارات |
  | `plugin-sdk/webhook-path` | اسم مستعار مهمل لمسار Webhook | استخدم `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | مساعدات وسائط الويب المشتركة | مساعدات تحميل الوسائط البعيدة/المحلية |
  | `plugin-sdk/zod` | إعادة تصدير توافق Zod مهملة | استورد `zod` من `zod` مباشرة |
  | `plugin-sdk/memory-core` | مساعدات نواة الذاكرة المضمنة | سطح مساعد مدير/تكوين/ملف/CLI الذاكرة |
  | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل محرك الذاكرة | واجهة وقت تشغيل فهرسة/بحث الذاكرة |
  | `plugin-sdk/memory-core-host-embedding-registry` | سجل تضمين الذاكرة | مساعدات سجل مزود تضمين الذاكرة الخفيف |
  | `plugin-sdk/memory-core-host-engine-foundation` | محرك أساس مضيف الذاكرة | صادرات محرك أساس مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-embeddings` | محرك تضمين مضيف الذاكرة | عقود تضمين الذاكرة، ووصول السجل، والمزود المحلي، ومساعدات الدفعات/البعيد العامة؛ يعيش المزودون البعيدون الملموسون في Plugins المالكة لهم |
  | `plugin-sdk/memory-core-host-engine-qmd` | محرك QMD لمضيف الذاكرة | صادرات محرك QMD لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-storage` | محرك تخزين مضيف الذاكرة | صادرات محرك تخزين مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-multimodal` | مساعدات مضيف الذاكرة متعدد الوسائط | مساعدات مضيف الذاكرة متعدد الوسائط |
  | `plugin-sdk/memory-core-host-query` | مساعدات استعلام مضيف الذاكرة | مساعدات استعلام مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-secret` | مساعدات أسرار مضيف الذاكرة | مساعدات أسرار مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-events` | اسم مستعار مهمل لأحداث الذاكرة | استخدم `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة | مساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-cli` | وقت تشغيل CLI لمضيف الذاكرة | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-core` | وقت تشغيل نواة مضيف الذاكرة | مساعدات وقت تشغيل نواة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-files` | مساعدات ملفات/وقت تشغيل مضيف الذاكرة | مساعدات ملفات/وقت تشغيل مضيف الذاكرة |
  | `plugin-sdk/memory-host-core` | اسم مستعار لوقت تشغيل نواة مضيف الذاكرة | اسم مستعار محايد للبائع لمساعدات وقت تشغيل نواة مضيف الذاكرة |
  | `plugin-sdk/memory-host-events` | اسم مستعار لسجل أحداث مضيف الذاكرة | اسم مستعار محايد للبائع لمساعدات سجل أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-host-files` | اسم مستعار مهمل لملفات/وقت تشغيل الذاكرة | استخدم `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | مساعدات Markdown المدارة | مساعدات Markdown المدارة المشتركة لـ Plugins المجاورة للذاكرة |
  | `plugin-sdk/memory-host-search` | واجهة بحث Active Memory | واجهة وقت تشغيل مدير بحث Active Memory الكسولة |
  | `plugin-sdk/memory-host-status` | اسم مستعار مهمل لحالة مضيف الذاكرة | استخدم `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | أدوات الاختبار | واجهة تجميعية مهملة للتوافق المحلي في المستودع؛ استخدم مسارات اختبار فرعية محلية مركزة في المستودع مثل `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, و`plugin-sdk/test-fixtures` |
</Accordion>

هذا الجدول هو عمدا المجموعة الفرعية المشتركة للهجرة، وليس سطح SDK
الكامل. يوجد مخزون نقطة دخول المترجم في
`scripts/lib/plugin-sdk-entrypoints.json`؛ وتُنشأ صادرات الحزمة من
المجموعة الفرعية العامة.

أُزيلت طبقات المساعدة المحجوزة للـ bundled-plugin من خريطة تصدير SDK
العامة، باستثناء واجهات التوافق الموثقة صراحة، مثل shim
`plugin-sdk/discord` المهمل والمُحتفَظ به لحزمة
`@openclaw/discord@2026.3.13` المنشورة. تعيش المساعدات الخاصة بالمالك داخل
حزمة الـ plugin المالكة؛ وينبغي أن ينتقل سلوك المضيف المشترك عبر عقود SDK
العامة مثل `plugin-sdk/gateway-runtime` و`plugin-sdk/security-runtime`
و`plugin-sdk/plugin-config-runtime`.

استخدم أضيق import يطابق المهمة. إذا لم تجد export، فتحقق من المصدر في
`src/plugin-sdk/` أو اسأل المشرفين عن العقد العام الذي ينبغي أن يملكه.

## الإهمالات النشطة

إهمالات أضيق تنطبق عبر SDK الخاص بالـ plugin، وعقد المزوّد،
وسطح وقت التشغيل، والـ manifest. لا يزال كل منها يعمل اليوم، لكنه سيُزال
في إصدار رئيسي مستقبلي. يربط السطر الموجود أسفل كل عنصر API القديم
ببديله المعتمد.

<AccordionGroup>
  <Accordion title="منشئات مساعدة command-auth → command-status">
    **قديم (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **جديد (`openclaw/plugin-sdk/command-status`)**: التواقيع نفسها، والصادرات نفسها -
    لكن مع الاستيراد من المسار الفرعي الأضيق. يعيد `command-auth`
    تصديرها كـ stubs توافق.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="مساعدات حجب الإشارات → resolveInboundMentionDecision">
    **قديم**: `resolveInboundMentionRequirement({ facts, policy })` و
    `shouldDropInboundForMention(...)` من
    `openclaw/plugin-sdk/channel-inbound` أو
    `openclaw/plugin-sdk/channel-mention-gating`.

    **جديد**: `resolveInboundMentionDecision({ facts, policy })` - يعيد
    كائن قرار واحدا بدلا من استدعاءين منفصلين.

    انتقلت Plugins القنوات downstream (Slack، Discord، Matrix، MS Teams) بالفعل.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` هو shim توافق للـ
    channel plugins الأقدم. لا تستورده من الكود الجديد؛ استخدم
    `openclaw/plugin-sdk/channel-runtime-context` لتسجيل كائنات وقت التشغيل.

    مساعدات `channelActions*` في `openclaw/plugin-sdk/channel-actions` مهملة
    مع صادرات "actions" الخام للقنوات. اكشف الإمكانات عبر سطح `presentation`
    الدلالي بدلا من ذلك - تصرّح channel plugins بما تعرضه (بطاقات، أزرار،
    قوائم اختيار) لا أسماء الإجراءات الخام التي تقبلها.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **قديم**: مصنع `tool()` من `openclaw/plugin-sdk/provider-web-search`.

    **جديد**: نفّذ `createTool(...)` مباشرة على provider plugin.
    لم يعد OpenClaw يحتاج إلى مساعد SDK لتسجيل غلاف الأداة.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **قديم**: `formatInboundEnvelope(...)` (و
    `ChannelMessageForAgent.channelEnvelope`) لبناء غلاف مطالبة نصية مسطحة
    من رسائل القناة الواردة.

    **جديد**: `BodyForAgent` مع كتل سياق مستخدم مهيكلة. تضيف
    channel plugins بيانات تعريف التوجيه (thread، topic، reply-to، reactions)
    كحقول typed بدلا من دمجها في سلسلة مطالبة. لا يزال مساعد
    `formatAgentEnvelope(...)` مدعوما للأغلفة المصطنعة الموجهة إلى المساعد،
    لكن أغلفة النص العادي الواردة في طريقها إلى الإزالة.

    المناطق المتأثرة: `inbound_claim` و`message_received` وأي
    channel plugin مخصص كان يعالج نص `channelEnvelope` بعديا.

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **قديم**: `api.on("deactivate", handler)`.

    **جديد**: `api.on("gateway_stop", handler)`. الحدث والسياق هما عقد
    تنظيف الإيقاف نفسه؛ يتغير اسم الـ hook فقط.

    ```typescript
    // Before
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // After
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    يبقى `deactivate` موصولا كاسم مستعار توافق مهمل حتى ما بعد
    2026-08-16.

  </Accordion>

  <Accordion title="subagent_spawning hook → core thread binding">
    **قديم**: `api.on("subagent_spawning", handler)` مع إرجاع
    `threadBindingReady` أو `deliveryOrigin`.

    **جديد**: دع core يجهز ارتباطات subagent ذات `thread: true` عبر
    محول ربط جلسة القناة. استخدم `api.on("subagent_spawned", handler)`
    فقط للمراقبة بعد الإطلاق.

    ```typescript
    // Before
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // After
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    تبقى `subagent_spawning` و`PluginHookSubagentSpawningEvent`
    و`PluginHookSubagentSpawningResult` و
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` كأسطح توافق
    مهملة فقط بينما تهاجر plugins الخارجية.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    أصبحت أربعة type aliases للاكتشاف أغلفة خفيفة فوق أنواع
    عصر الكتالوج:

    | الاسم المستعار القديم      | النوع الجديد              |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    إضافة إلى الحقيبة الثابتة القديمة `ProviderCapabilities` - ينبغي أن
    تستخدم provider plugins hooks صريحة للمزوّد مثل `buildReplayPolicy`
    و`normalizeToolSchemas` و`wrapStreamFn` بدلا من كائن ثابت.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **قديم** (ثلاثة hooks منفصلة على `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)` و`supportsXHighThinking(ctx)` و
    `resolveDefaultThinkingLevel(ctx)`.

    **جديد**: `resolveThinkingProfile(ctx)` واحد يعيد
    `ProviderThinkingProfile` مع `id` المعتمد، و`label` اختياري،
    وقائمة مستويات مرتبة. يخفض OpenClaw القيم المخزنة القديمة حسب رتبة
    الملف الشخصي تلقائيا.

    يتضمن السياق `provider` و`modelId` و`reasoning` مدمجا اختياريا،
    وحقائق `compat` مدمجة اختيارية للنموذج. يمكن لـ provider plugins استخدام
    حقائق الكتالوج هذه لكشف ملف شخصي خاص بالنموذج فقط عندما يدعم عقد الطلب
    المكوّن ذلك.

    نفّذ hook واحدا بدلا من ثلاثة. تستمر الـ hooks القديمة في العمل أثناء
    نافذة الإهمال، لكنها لا تُركّب مع نتيجة الملف الشخصي.

  </Accordion>

  <Accordion title="External auth providers → contracts.externalAuthProviders">
    **قديم**: تنفيذ hooks مصادقة خارجية دون التصريح بالمزوّد في
    manifest الـ plugin.

    **جديد**: صرّح بـ `contracts.externalAuthProviders` في manifest الـ plugin
    **و** نفّذ `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    حقل manifest **القديم**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **جديد**: انسخ بحث env-var نفسه إلى `setup.providers[].envVars`
    في الـ manifest. يوحّد هذا بيانات تعريف env الخاصة بالإعداد/الحالة في
    مكان واحد، ويتجنب تشغيل وقت تشغيل الـ plugin لمجرد الإجابة عن
    عمليات بحث env-var.

    يبقى `providerAuthEnvVars` مدعوما عبر محول توافق حتى إغلاق نافذة الإهمال.

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **قديم**: ثلاثة استدعاءات منفصلة -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **جديد**: استدعاء واحد على API حالة الذاكرة -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    الخانات نفسها، واستدعاء تسجيل واحد. لا تتأثر مساعدات المطالبات
    والـ corpus الإضافية (`registerMemoryPromptSupplement`,
    `registerMemoryCorpusSupplement`).

  </Accordion>

  <Accordion title="Memory embedding provider API">
    **قديم**: `api.registerMemoryEmbeddingProvider(...)` إضافة إلى
    `contracts.memoryEmbeddingProviders`.

    **جديد**: `api.registerEmbeddingProvider(...)` إضافة إلى
    `contracts.embeddingProviders`.

    عقد مزوّد embedding العام قابل لإعادة الاستخدام خارج الذاكرة، وهو
    المسار المدعوم للمزوّدين الجدد. تبقى API التسجيل الخاصة بالذاكرة موصولة
    كتوافق مهمل بينما يهاجر المزوّدون الحاليون. تبلغ تقارير فحص الـ plugin
    عن الاستخدام غير المضمّن كدين توافق.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    لا يزال type aliases قديمان يصدران من `src/plugins/runtime/types.ts`:

    | القديم                        | الجديد                         |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    طريقة وقت التشغيل `readSession` مهملة لصالح
    `getSessionMessages`. التوقيع نفسه؛ تستدعي الطريقة القديمة الطريقة
    الجديدة.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **قديم**: كان `runtime.tasks.flow` (بصيغة المفرد) يعيد موصلا حيا
    للـ task-flow.

    **جديد**: يحافظ `runtime.tasks.managedFlows` على وقت تشغيل تعديلات
    TaskFlow المُدار للـ plugins التي تنشئ أو تحدث أو تلغي أو تشغّل مهام
    فرعية من flow. استخدم `runtime.tasks.flows` عندما يحتاج الـ plugin إلى
    قراءات مبنية على DTO فقط.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    مشمول في "كيفية الهجرة → ترحيل إضافات نتائج الأدوات المضمنة إلى
    middleware" أعلاه. أُدرج هنا للاكتمال: يُستبدل مسار
    `api.registerEmbeddedExtensionFactory(...)` الخاص بالـ embedded-runner-only
    والمزال بـ `api.registerAgentToolResultMiddleware(...)` مع قائمة وقت تشغيل
    صريحة في `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    أصبح `OpenClawSchemaType` المعاد تصديره من `openclaw/plugin-sdk`
    اسما مستعارا من سطر واحد لـ `OpenClawConfig`. فضّل الاسم المعتمد.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
تُتتبّع الإهمالات على مستوى الامتدادات (داخل plugins القنوات/المزوّدين
المضمنة تحت `extensions/`) داخل ملفات `api.ts` و`runtime-api.ts`
الخاصة بها. لا تؤثر في عقود plugins الجهات الخارجية، وليست مدرجة هنا.
إذا كنت تستهلك barrel محليا لـ plugin مضمن مباشرة، فاقرأ تعليقات الإهمال
في ذلك الـ barrel قبل الترقية.
</Note>

## الجدول الزمني للإزالة

| متى                   | ما الذي يحدث                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **الآن**                | تصدر الواجهات المهملة تحذيرات وقت التشغيل                               |
| **الإصدار الرئيسي التالي** | ستُزال الواجهات المهملة؛ وستفشل Plugins التي ما زالت تستخدمها |

تم ترحيل جميع Plugins النواة بالفعل. ينبغي أن ترحّل Plugins الخارجية
قبل الإصدار الرئيسي التالي.

## كتم التحذيرات مؤقتًا

عيّن متغيرات البيئة هذه أثناء العمل على الترحيل:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

هذا مخرج مؤقت، وليس حلًا دائمًا.

## ذات صلة

- [البدء](/ar/plugins/building-plugins) - ابنِ أول Plugin لك
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - مرجع كامل لاستيراد المسارات الفرعية
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) - بناء Plugins القنوات
- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) - بناء Plugins المزوّدين
- [البنية الداخلية لـ Plugin](/ar/plugins/architecture) - تعمق في البنية المعمارية
- [بيان Plugin](/ar/plugins/manifest) - مرجع مخطط البيان
