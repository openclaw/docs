---
read_when:
    - تظهر لك رسالة التحذير OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - تظهر لك رسالة التحذير OPENCLAW_EXTENSION_API_DEPRECATED
    - استخدمت api.registerEmbeddedExtensionFactory قبل OpenClaw 2026.4.25
    - أنت تحدّث Plugin إلى بنية Plugin الحديثة
    - أنت تدير Plugin خارجيًا لـ OpenClaw
sidebarTitle: Migrate to SDK
summary: الترحيل من طبقة التوافق العكسي القديمة إلى SDK Plugin الحديث
title: ترحيل Plugin SDK
x-i18n:
    generated_at: "2026-07-01T13:02:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9f6f9b4334ca3bdbcc6602cfe2bb1499d5758de95a9163e0ef75619a712a1c3
    source_path: plugins/sdk-migration.md
    workflow: 16
---

انتقل OpenClaw من طبقة توافق واسعة مع الإصدارات السابقة إلى بنية Plugin حديثة
تستخدم عمليات استيراد مركزة وموثقة. إذا كان Plugin الخاص بك قد بُني قبل
البنية الجديدة، فسيساعدك هذا الدليل على الترحيل.

## ما الذي يتغير

كان نظام Plugin القديم يوفر سطحين مفتوحين على نطاق واسع يتيحان للـ Plugins استيراد
أي شيء تحتاجه من نقطة دخول واحدة:

- **`openclaw/plugin-sdk/compat`** - عملية استيراد واحدة كانت تعيد تصدير عشرات
  المساعدات. أُدخلت للحفاظ على عمل Plugins الأقدم المعتمدة على الخطافات أثناء
  بناء بنية Plugin الجديدة.
- **`openclaw/plugin-sdk/infra-runtime`** - حزمة مساعدات وقت تشغيل واسعة كانت
  تخلط أحداث النظام، وحالة Heartbeat، وقوائم انتظار التسليم، ومساعدات الجلب/الوكيل،
  ومساعدات الملفات، وأنواع الموافقات، وأدوات غير مرتبطة.
- **`openclaw/plugin-sdk/config-runtime`** - حزمة توافق إعدادات واسعة
  ما زالت تحمل مساعدات تحميل/كتابة مباشرة مهملة أثناء نافذة الترحيل.
- **`openclaw/extension-api`** - جسر منح Plugins وصولًا مباشرًا إلى
  مساعدات جانب المضيف مثل مشغل الوكيل المضمّن.
- **`api.registerEmbeddedExtensionFactory(...)`** - خطاف إضافة مضمّنة خاص بالمشغل
  المضمّن فقط، تمت إزالته، وكان يستطيع مراقبة أحداث المشغل المضمّن مثل
  `tool_result`.

أصبحت أسطح الاستيراد الواسعة الآن **مهملة**. ما زالت تعمل وقت التشغيل،
لكن يجب ألا تستخدمها Plugins الجديدة، وينبغي أن ترحّل Plugins الحالية قبل
أن يزيلها الإصدار الرئيسي التالي. تمت إزالة واجهة API لتسجيل مصنع الإضافة
الخاص بالمشغل المضمّن فقط؛ استخدم برمجية وسيطة لنتائج الأدوات بدلًا من ذلك.

لا يزيل OpenClaw سلوك Plugin موثقًا أو يعيد تفسيره في التغيير نفسه
الذي يقدم بديلًا. يجب أن تمر تغييرات العقود الكاسرة أولًا عبر
محوّل توافق، وتشخيصات، ووثائق، ونافذة إهمال. ينطبق ذلك على استيرادات SDK،
وحقول البيان، وواجهات API للإعداد، والخطافات، وسلوك التسجيل وقت التشغيل.

<Warning>
  ستُزال طبقة التوافق مع الإصدارات السابقة في إصدار رئيسي مستقبلي.
  ستتعطل Plugins التي لا تزال تستورد من هذه الأسطح عندما يحدث ذلك.
  تسجيلات مصانع الإضافات المضمّنة القديمة لم تعد تُحمّل بالفعل.
</Warning>

## لماذا تغيّر هذا

سبب النهج القديم مشكلات:

- **بدء تشغيل بطيء** - كان استيراد مساعد واحد يحمّل عشرات الوحدات غير المرتبطة
- **اعتماديات دائرية** - جعلت عمليات إعادة التصدير الواسعة إنشاء دورات استيراد أمرًا سهلًا
- **سطح API غير واضح** - لم تكن هناك طريقة لمعرفة أي الصادرات مستقرة وأيها داخلية

يعالج SDK الحديث للـ Plugin هذا الأمر: كل مسار استيراد (`openclaw/plugin-sdk/\<subpath\>`)
هو وحدة صغيرة، مستقلة، ذات غرض واضح وعقد موثق.

كما أُزيلت طبقات التيسير القديمة لموفري القنوات المضمّنة.
كانت طبقات المساعدات ذات علامات القنوات اختصارات خاصة بمستودع أحادي، وليست
عقود Plugin مستقرة. استخدم مسارات SDK فرعية عامة وضيقة بدلًا من ذلك. داخل مساحة عمل
Plugin المضمّن، أبقِ المساعدات المملوكة للموفر في `api.ts` أو
`runtime-api.ts` الخاصين بذلك الـ Plugin.

أمثلة الموفرين المضمّنين الحالية:

- يحتفظ Anthropic بمساعدات البث الخاصة بـ Claude في طبقة `api.ts` /
  `contract-api.ts` الخاصة به
- يحتفظ OpenAI ببُنّاة الموفرين، ومساعدات النموذج الافتراضي، وبُنّاة موفر الوقت الفعلي
  في `api.ts` الخاص به
- يحتفظ OpenRouter بباني الموفر ومساعدات الإعداد/التكوين في
  `api.ts` الخاص به

## خطة ترحيل Talk والصوت في الوقت الفعلي

ينتقل كود Talk للصوت في الوقت الفعلي، والاتصالات الهاتفية، والاجتماعات، والمتصفح من
تتبع الأدوار المحلي على السطح إلى متحكم جلسات Talk مشترك يتم تصديره بواسطة
`openclaw/plugin-sdk/realtime-voice`. يمتلك المتحكم الجديد غلاف أحداث Talk
المشترك، وحالة الدور النشط، وحالة الالتقاط، وحالة صوت الإخراج، وسجل الأحداث
الأخيرة، ورفض الأدوار القديمة. ينبغي أن تظل Plugins الموفرين مالكة
للجلسات الخاصة بالمورّد في الوقت الفعلي؛ وينبغي أن تظل Plugins الأسطح مالكة
لخصوصيات الالتقاط، والتشغيل، والاتصالات الهاتفية، والاجتماعات.

ترحيل Talk هذا كاسر ونظيف عن قصد:

1. أبقِ متحكم/أوليات وقت التشغيل المشتركة في
   `plugin-sdk/realtime-voice`.
2. انقل الأسطح المضمّنة إلى المتحكم المشترك: ترحيل المتصفح،
   وتسليم الغرفة المُدارة، ووقت الصوت الفعلي للمكالمات الصوتية، وSTT المتدفق للمكالمات الصوتية، ووقت Google
   Meet الفعلي، وميزة الضغط للتحدث الأصلية.
3. استبدل عائلات RPC القديمة الخاصة بـ Talk بواجهة API النهائية `talk.session.*` و
   `talk.client.*`.
4. أعلن عن قناة أحداث Talk حية واحدة في Gateway
   `hello-ok.features.events`: `talk.event`.
5. احذف نقطة نهاية HTTP القديمة للوقت الفعلي وأي مسار لتجاوز التعليمات
   وقت الطلب.

ينبغي ألا يستدعي الكود الجديد `createTalkEventSequencer(...)` مباشرة إلا إذا كان
ينفذ محوّلًا منخفض المستوى أو أداة اختبار. فضّل المتحكم المشترك
حتى لا يمكن إصدار أحداث محددة النطاق بدور من دون معرّف دور، ولا يمكن لاستدعاءات `turnEnd` /
`turnCancel` القديمة مسح دور نشط أحدث، وتظل أحداث دورة حياة صوت الإخراج
متسقة عبر الاتصالات الهاتفية، والاجتماعات، وترحيل المتصفح، وتسليم الغرفة المُدارة،
وعملاء Talk الأصليين.

شكل واجهة API العامة المستهدفة هو:

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

تستخدم جلسات WebRTC/مقبس ويب الموفر المملوكة للمتصفح `talk.client.create`,
لأن المتصفح يمتلك تفاوض الموفر ونقل الوسائط، بينما يمتلك
Gateway بيانات الاعتماد، والتعليمات، وسياسة الأدوات. `talk.session.*` هو
السطح المشترك المُدار بواسطة Gateway للوقت الفعلي عبر gateway-relay،
والنسخ عبر gateway-relay، وجلسات STT/TTS الأصلية للغرف المُدارة.

ينبغي إصلاح الإعدادات القديمة التي وضعت محددات الوقت الفعلي بجوار `talk.provider` /
`talk.providers` باستخدام `openclaw doctor --fix`؛ لا يعيد Talk وقت التشغيل
تفسير إعداد موفر الكلام/TTS على أنه إعداد موفر وقت فعلي.

تركيبات `talk.session.create` المدعومة صغيرة عن قصد:

| الوضع            | النقل       | الدماغ           | المالك              | ملاحظات                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | صوت موفر ثنائي الاتجاه بالكامل يُجسر عبر Gateway؛ يتم توجيه استدعاءات الأدوات عبر أداة agent-consult.      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | STT متدفق فقط؛ يرسل المستدعون صوت الإدخال ويتلقون أحداث النص المنسوخ.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | غرفة أصلية/عميل | غرف بنمط الضغط للتحدث واللاسلكي حيث يمتلك العميل الالتقاط/التشغيل ويمتلك Gateway حالة الدور. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | غرفة أصلية/عميل | وضع غرفة للمسؤولين فقط للأسطح الموثوقة من الطرف الأول التي تنفذ إجراءات أدوات Gateway مباشرة.                  |

خريطة الطرق المُزالة:

| القديم                              | الجديد                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` أو `talk.session.cancelTurn` |
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

  | الطريقة                         | تنطبق على                                             | العقد                                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | ألحِق مقطع صوت PCM بترميز base64 بجلسة المزوّد التي يملكها اتصال Gateway نفسه.                                                                                                                        |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | ابدأ دور مستخدم في غرفة مُدارة.                                                                                                                                                                       |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | أنهِ الدور النشط بعد التحقق من الدور القديم.                                                                                                                                                          |
  | `talk.session.cancelTurn`       | كل الجلسات المملوكة لـ Gateway                          | ألغِ عمل الالتقاط/المزوّد/الوكيل/TTS النشط لدور ما.                                                                                                                                                   |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | أوقف إخراج صوت المساعد دون إنهاء دور المستخدم بالضرورة.                                                                                                                                               |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | أكمِل استدعاء أداة من المزوّد أصدره المرحّل؛ مرّر `options.willContinue` للإخراج المؤقت أو `options.suppressResponse` لتلبية الاستدعاء دون استجابة أخرى من المساعد. |
  | `talk.session.steer`            | جلسات Talk المدعومة بوكيل                              | أرسل تحكمًا منطوقًا من نوع `status` أو `steer` أو `cancel` أو `followup` إلى التشغيل المضمّن النشط الذي جرى حله من جلسة Talk.                                                                         |
  | `talk.session.close`            | كل الجلسات الموحدة                                     | أوقف جلسات المرحّل أو اسحب حالة الغرفة المُدارة، ثم انسَ معرّف الجلسة الموحدة.                                                                                                                        |

  لا تُدخل حالات خاصة للمزوّد أو المنصة في النواة لجعل هذا يعمل.
  تملك النواة دلالات جلسات Talk. وتملك Plugins المزوّد إعداد جلسة البائع.
  وتملك Voice-call وGoogle Meet محولات الهاتفية/الاجتماعات. وتملك تطبيقات المتصفح والتطبيقات
  الأصلية تجربة التقاط/تشغيل الجهاز.

  ## سياسة التوافق

  بالنسبة إلى Plugins الخارجية، يتبع عمل التوافق هذا الترتيب:

  1. أضف العقد الجديد
  2. أبقِ السلوك القديم موصولًا عبر محول توافق
  3. أصدر تشخيصًا أو تحذيرًا يذكر المسار القديم والبديل
  4. غطِّ كلا المسارين في الاختبارات
  5. وثّق الإيقاف التدريجي ومسار الترحيل
  6. أزِل فقط بعد نافذة الترحيل المعلنة، عادةً في إصدار رئيسي

  يمكن للمشرفين تدقيق طابور الترحيل الحالي باستخدام
  `pnpm plugins:boundary-report`. استخدم `pnpm plugins:boundary-report:summary` من أجل
  أعداد موجزة، و`--owner <id>` من أجل Plugin واحد أو مالك توافق، و
  `pnpm plugins:boundary-report:ci` عندما يجب أن تفشل بوابة CI بسبب سجلات توافق
  مستحقة، أو استيرادات SDK محفوظة عابرة للمالكين، أو مسارات فرعية محفوظة غير مستخدمة في SDK.
  يجمع التقرير سجلات التوافق المهملة حسب تاريخ الإزالة، ويعد مراجع الكود/المستندات المحلية،
  ويُظهر استيرادات SDK المحفوظة العابرة للمالكين، ويلخص جسر SDK الخاص بمضيف
  الذاكرة حتى يبقى تنظيف التوافق صريحًا بدلًا من الاعتماد على
  عمليات بحث ارتجالية. يجب أن يكون لمسارات SDK الفرعية المحفوظة استخدام مالك متتبع؛
  ويجب إزالة تصديرات المساعدات المحفوظة غير المستخدمة من SDK العام.

  إذا كان حقل بيان ما لا يزال مقبولًا، يمكن لمؤلفي Plugins الاستمرار في استخدامه حتى
  تقول المستندات والتشخيصات خلاف ذلك. ينبغي أن يفضّل الكود الجديد البديل الموثق،
  لكن يجب ألا تتعطل Plugins الحالية أثناء الإصدارات الثانوية العادية.

  ## كيفية الترحيل

  <Steps>
  <Step title="رحّل مساعدات تحميل/كتابة إعدادات وقت التشغيل">
    يجب أن تتوقف Plugins المضمنة عن استدعاء
    `api.runtime.config.loadConfig()` و
    `api.runtime.config.writeConfigFile(...)` مباشرةً. فضّل الإعدادات التي
    مُرِّرت أصلًا إلى مسار الاستدعاء النشط. يمكن للمعالجات طويلة العمر التي تحتاج إلى
    لقطة العملية الحالية استخدام `api.runtime.config.current()`. يجب أن تستخدم أدوات
    الوكيل طويلة العمر `ctx.getRuntimeConfig()` الخاصة بسياق الأداة داخل
    `execute` حتى تظل الأداة المنشأة قبل كتابة الإعدادات ترى إعدادات وقت التشغيل
    المحدّثة.

    يجب أن تمر كتابات الإعدادات عبر مساعدات المعاملات وأن تختار سياسة
    ما بعد الكتابة:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    استخدم `afterWrite: { mode: "restart", reason: "..." }` عندما يعرف المستدعي
    أن التغيير يتطلب إعادة تشغيل Gateway نظيفة، و
    `afterWrite: { mode: "none", reason: "..." }` فقط عندما يملك المستدعي
    المتابعة ويريد عمدًا منع مخطط إعادة التحميل.
    تتضمن نتائج التعديل ملخص `followUp` مضبوط النوع للاختبارات والتسجيل؛
    وتظل Gateway مسؤولة عن تطبيق إعادة التشغيل أو جدولتها.
    يبقى `loadConfig` و`writeConfigFile` كمساعدات توافق مهملة
    لـ Plugins الخارجية أثناء نافذة الترحيل ويحذّران مرة واحدة باستخدام
    رمز التوافق `runtime-config-load-write`. Plugins المضمنة وكود وقت التشغيل في المستودع
    محمية بحواجز ماسح في
    `pnpm check:deprecated-api-usage` و
    `pnpm check:no-runtime-action-load-config`: يفشل استخدام Plugin إنتاجي جديد
    مباشرةً، وتفشل الكتابات المباشرة للإعدادات، ويجب أن تستخدم طرق خادم Gateway
    لقطة وقت التشغيل الخاصة بالطلب، ويجب أن تتلقى مساعدات إرسال/إجراء/عميل قناة وقت التشغيل
    الإعدادات من حدودها، وتملك وحدات وقت التشغيل طويلة العمر
    صفر استدعاءات محيطة مسموحة لـ `loadConfig()`.

    يجب أن يتجنب كود Plugin الجديد أيضًا استيراد برميل التوافق الواسع
    `openclaw/plugin-sdk/config-runtime`. استخدم المسار الفرعي الضيق في
    SDK الذي يطابق المهمة:

    | الحاجة | الاستيراد |
    | --- | --- |
    | أنواع الإعدادات مثل `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | تأكيدات الإعدادات المحملة مسبقًا وبحث إعدادات مدخل Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | قراءات لقطة وقت التشغيل الحالية | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | كتابات الإعدادات | `openclaw/plugin-sdk/config-mutation` |
    | مساعدات مخزن الجلسات | `openclaw/plugin-sdk/session-store-runtime` |
    | إعدادات جدول Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | مساعدات وقت تشغيل سياسة المجموعة | `openclaw/plugin-sdk/runtime-group-policy` |
    | حل إدخال السر | `openclaw/plugin-sdk/secret-input-runtime` |
    | تجاوزات النموذج/الجلسة | `openclaw/plugin-sdk/model-session-runtime` |

    تخضع Plugins المضمنة واختباراتها لحماية الماسح ضد البرميل الواسع
    حتى تبقى الاستيرادات والمحاكيات محلية للسلوك الذي تحتاجه. لا يزال البرميل الواسع
    موجودًا للتوافق الخارجي، لكن يجب ألا يعتمد عليه الكود الجديد.

  </Step>

  <Step title="رحّل امتدادات نتائج الأدوات المضمّنة إلى وسيط">
    يجب أن تستبدل Plugins المضمنة معالجات نتائج الأدوات الخاصة بالمشغّل المضمّن فقط
    `api.registerEmbeddedExtensionFactory(...)` بوسيط محايد لوقت التشغيل.

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

    يمكن لـ Plugins المثبتة أيضًا تسجيل وسيط نتائج الأدوات عندما تكون
    مفعّلة صراحةً وتعلن كل وقت تشغيل مستهدف في
    `contracts.agentToolResultMiddleware`. تُرفض تسجيلات الوسيط المثبتة
    غير المعلنة.

  </Step>

  <Step title="رحّل المعالجات الأصلية للموافقات إلى حقائق القدرات">
    تعرض Plugins القنوات القادرة على الموافقة الآن سلوك الموافقة الأصلي عبر
    `approvalCapability.nativeRuntime` بالإضافة إلى سجل سياق وقت التشغيل المشترك.

    التغييرات الرئيسية:

    - استبدل `approvalCapability.handler.loadRuntime(...)` بـ
      `approvalCapability.nativeRuntime`
    - انقل مصادقة/تسليم الموافقات المحددة بعيدًا عن توصيل `plugin.auth` /
      `plugin.approvals` القديم وإلى `approvalCapability`
    - أُزيل `ChannelPlugin.approvals` من عقد Plugin القناة العام؛ انقل حقول التسليم/الأصلي/العرض إلى `approvalCapability`
    - يبقى `plugin.auth` لتدفقات تسجيل دخول/خروج القناة فقط؛ لم تعد النواة تقرأ
      خطافات مصادقة الموافقة هناك
    - سجّل كائنات وقت التشغيل المملوكة للقناة مثل العملاء أو الرموز أو تطبيقات Bolt
      عبر `openclaw/plugin-sdk/channel-runtime-context`
    - لا ترسل إشعارات إعادة توجيه مملوكة للـ Plugin من معالجات الموافقة الأصلية؛
      تملك النواة الآن إشعارات التوجيه إلى مكان آخر من نتائج التسليم الفعلية
    - عند تمرير `channelRuntime` إلى `createChannelManager(...)`، قدّم
      سطح `createPluginRuntime().channel` حقيقيًا. تُرفض البدائل الجزئية.

    راجع `/plugins/sdk-channel-plugins` لتخطيط قدرة الموافقة الحالي.

  </Step>

  <Step title="دقّق سلوك الرجوع الاحتياطي لغلاف Windows">
    إذا كان Plugin الخاص بك يستخدم `openclaw/plugin-sdk/windows-spawn`، فإن أغلفة Windows
    غير المحلولة `.cmd`/`.bat` تفشل الآن بإغلاق آمن ما لم تمرر صراحةً
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

    إذا كان المستدعي لديك لا يعتمد عمدًا على الرجوع الاحتياطي عبر الصدفة، فلا تضبط
    `allowShellFallback` وتعامل مع الخطأ المطروح بدلًا من ذلك.

  </Step>

  <Step title="اعثر على الاستيرادات المهملة">
    ابحث في Plugin الخاص بك عن الاستيرادات من أي من السطحين المهملين:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="استبدلها باستيرادات مركزة">
    يقابل كل تصدير من السطح القديم مسار استيراد حديثًا محددًا:

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

    بالنسبة إلى مساعدات جانب المضيف، استخدم وقت تشغيل Plugin المحقون بدلًا من الاستيراد
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

  <Step title="Replace broad infra-runtime imports">
    لا يزال `openclaw/plugin-sdk/infra-runtime` موجودًا للتوافق الخارجي،
    لكن ينبغي للكود الجديد استيراد سطح المساعدات المركّز الذي يحتاجه
    فعليًا:

    | الحاجة | الاستيراد |
    | --- | --- |
    | مساعدات قائمة انتظار أحداث النظام | `openclaw/plugin-sdk/system-event-runtime` |
    | مساعدات Heartbeat للإيقاظ والحدث والظهور | `openclaw/plugin-sdk/heartbeat-runtime` |
    | تفريغ قائمة انتظار التسليم المعلّق | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | قياسات نشاط القناة | `openclaw/plugin-sdk/channel-activity-runtime` |
    | ذاكرات تخزين مؤقت لإزالة التكرار داخل الذاكرة | `openclaw/plugin-sdk/dedupe-runtime` |
    | مساعدات آمنة لمسارات الملفات المحلية/الوسائط | `openclaw/plugin-sdk/file-access-runtime` |
    | جلب مدرك للموزّع | `openclaw/plugin-sdk/runtime-fetch` |
    | مساعدات الوكيل والجلب المحروس | `openclaw/plugin-sdk/fetch-runtime` |
    | أنواع سياسة موزّع SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | أنواع طلب/حل الموافقة | `openclaw/plugin-sdk/approval-runtime` |
    | حمولة رد الموافقة ومساعدات الأوامر | `openclaw/plugin-sdk/approval-reply-runtime` |
    | مساعدات تنسيق الأخطاء | `openclaw/plugin-sdk/error-runtime` |
    | انتظار جاهزية النقل | `openclaw/plugin-sdk/transport-ready-runtime` |
    | مساعدات الرموز الآمنة | `openclaw/plugin-sdk/secure-random-runtime` |
    | تزامن محدود للمهام غير المتزامنة | `openclaw/plugin-sdk/concurrency-runtime` |
    | الإكراه الرقمي | `openclaw/plugin-sdk/number-runtime` |
    | قفل غير متزامن محلي للعملية | `openclaw/plugin-sdk/async-lock-runtime` |
    | أقفال الملفات | `openclaw/plugin-sdk/file-lock` |

    تخضع Plugins المضمنة لحماية ماسح ضد `infra-runtime`، لذلك لا يمكن
    لكود المستودع أن يتراجع إلى البرميل الواسع.

  </Step>

  <Step title="Migrate channel route helpers">
    ينبغي لكود مسارات القنوات الجديد استخدام `openclaw/plugin-sdk/channel-route`.
    تظل أسماء مفاتيح المسارات والأهداف القابلة للمقارنة الأقدم متاحة كأسماء
    مستعارة للتوافق أثناء نافذة الترحيل، لكن ينبغي لـ Plugins الجديدة استخدام
    أسماء المسارات التي تصف السلوك مباشرة:

    | المساعد القديم | المساعد الحديث |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    تطبّع مساعدات المسارات الحديثة `{ channel, to, accountId, threadId }`
    باتساق عبر الموافقات الأصلية، وكبح الردود، وإزالة تكرار الوارد،
    وتسليم Cron، وتوجيه الجلسات.

    لا تضف استخدامات جديدة لـ `ChannelMessagingAdapter.parseExplicitTarget` أو
    مساعدات المسارات المحمّلة المدعومة بالمحلل (`parseExplicitTargetForLoadedChannel`
    أو `resolveRouteTargetForLoadedChannel`) أو
    `resolveChannelRouteTargetWithParser(...)` من `plugin-sdk/channel-route`.
    هذه الخطافات مهملة ولا تبقى إلا لـ Plugins الأقدم أثناء نافذة
    الترحيل. ينبغي لـ Plugins القنوات الجديدة استخدام
    `messaging.targetResolver.resolveTarget(...)` لتطبيع معرّفات الأهداف
    والرجوع عند غياب الدليل، و`messaging.inferTargetChatType(...)` عندما
    يحتاج النواة إلى نوع النظير مبكرًا، و`messaging.resolveOutboundSessionRoute(...)`
    لهوية الجلسة ومؤشر الترابط الأصلية لدى المزوّد.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## مرجع مسارات الاستيراد

  <Accordion title="Common import path table">
  | مسار الاستيراد | الغرض | الصادرات الرئيسية |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | مساعد إدخال Plugin المعياري | `definePluginEntry` |
  | `plugin-sdk/core` | إعادة تصدير شاملة قديمة لتعريفات/بناة إدخال القنوات | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | تصدير مخطط تهيئة الجذر | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | مساعد إدخال موفر واحد | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعريفات وبناة إدخال القنوات المركزة | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة | مترجم الإعداد، مطالبات قائمة السماح، بناة حالة الإعداد |
  | `plugin-sdk/setup-runtime` | مساعدات وقت الإعداد لوقت التشغيل | `createSetupTranslator`, محولات تصحيح الإعداد الآمنة للاستيراد، مساعدات ملاحظة البحث، `promptResolvedAllowFrom`, `splitSetupEntries`, وكلاء الإعداد المفوضون |
  | `plugin-sdk/setup-adapter-runtime` | اسم مستعار مهمل لمحول الإعداد | استخدم `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | مساعدات أدوات الإعداد | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | مساعدات الحسابات المتعددة | مساعدات قائمة الحسابات/التهيئة/بوابة الإجراءات |
  | `plugin-sdk/account-id` | مساعدات معرّف الحساب | `DEFAULT_ACCOUNT_ID`, تطبيع معرّف الحساب |
  | `plugin-sdk/account-resolution` | مساعدات البحث عن الحسابات | مساعدات البحث عن الحساب + الرجوع إلى الافتراضي |
  | `plugin-sdk/account-helpers` | مساعدات الحسابات الضيقة | مساعدات قائمة الحسابات/إجراءات الحساب |
  | `plugin-sdk/channel-setup` | محولات معالج الإعداد | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, إضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | بدائيات إقران DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | بادئة الرد، والكتابة، وتوصيل التسليم من المصدر | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | مصانع محولات التهيئة ومساعدات وصول DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | بناة مخطط التهيئة | بدائيات مخطط تهيئة القنوات المشتركة والباني العام فقط |
  | `plugin-sdk/bundled-channel-config-schema` | مخططات التهيئة المضمنة | Plugins المضمنة التي يصونها OpenClaw فقط؛ يجب أن تعرّف Plugins الجديدة مخططاتها المحلية الخاصة بالـPlugin |
  | `plugin-sdk/channel-config-schema-legacy` | مخططات التهيئة المضمنة المهملة | اسم مستعار للتوافق فقط؛ استخدم `plugin-sdk/bundled-channel-config-schema` للـPlugins المضمنة المصانة |
  | `plugin-sdk/telegram-command-config` | مساعدات تهيئة أوامر Telegram | تطبيع أسماء الأوامر، تشذيب الوصف، والتحقق من التكرار/التعارض |
  | `plugin-sdk/channel-policy` | حل سياسة المجموعة/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | واجهة توافق مهملة | استخدم `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | مساعدات الظرف الوارد | مساعدات مشتركة لبناء المسار + الظرف |
  | `plugin-sdk/channel-inbound` | مساعدات الاستلام الوارد | بناء السياق، التنسيق، الجذور، المشغلات، إرسال الردود المحضّرة، ومسندات الإرسال |
  | `plugin-sdk/messaging-targets` | مسار استيراد مهمل لتحليل الهدف | استخدم `plugin-sdk/channel-targets` لمساعدات تحليل الهدف العامة، و`plugin-sdk/channel-route` لمقارنة المسارات، و`messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` المملوكة للـPlugin لحل الأهداف الخاصة بالموفر |
  | `plugin-sdk/outbound-media` | مساعدات الوسائط الصادرة | تحميل الوسائط الصادرة المشتركة |
  | `plugin-sdk/outbound-send-deps` | واجهة توافق مهملة | استخدم `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | مساعدات دورة حياة الرسائل الصادرة | محولات الرسائل، الإيصالات، مساعدات الإرسال المتين، مساعدات المعاينة المباشرة/البث، خيارات الرد، مساعدات دورة الحياة، هوية الصادر، وتخطيط الحمولة |
  | `plugin-sdk/channel-streaming` | واجهة توافق مهملة | استخدم `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | واجهة توافق مهملة | استخدم `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | مساعدات ربط المحادثات | مساعدات دورة حياة ربط المحادثات ومحولاتها |
  | `plugin-sdk/agent-media-payload` | مساعدات حمولة الوسائط القديمة | باني حمولة وسائط الوكيل لتخطيطات الحقول القديمة |
  | `plugin-sdk/channel-runtime` | رقاقة توافق مهملة | أدوات وقت تشغيل القنوات القديمة فقط |
  | `plugin-sdk/channel-send-result` | أنواع نتائج الإرسال | أنواع نتائج الرد |
  | `plugin-sdk/runtime-store` | تخزين Plugin دائم | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | مساعدات وقت تشغيل واسعة | مساعدات وقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
  | `plugin-sdk/runtime-env` | مساعدات بيئة وقت التشغيل الضيقة | مساعدات المسجل/بيئة وقت التشغيل، المهلة، إعادة المحاولة، والتراجع |
  | `plugin-sdk/plugin-runtime` | مساعدات وقت تشغيل Plugin المشتركة | مساعدات أوامر/خطافات/http/تفاعلية للـPlugin |
  | `plugin-sdk/hook-runtime` | مساعدات مسار الخطافات | مساعدات مسار خطافات Webhook/الداخلية المشتركة |
  | `plugin-sdk/lazy-runtime` | مساعدات وقت التشغيل الكسول | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | مساعدات العمليات | مساعدات تنفيذ مشتركة |
  | `plugin-sdk/cli-runtime` | مساعدات وقت تشغيل CLI | تنسيق الأوامر، الانتظارات، ومساعدات الإصدار |
  | `plugin-sdk/gateway-runtime` | مساعدات Gateway | عميل Gateway، مساعد بدء جاهز لحلقة الأحداث، حل مضيف LAN المعلن، ومساعدات تصحيح حالة القناة |
  | `plugin-sdk/config-runtime` | رقاقة توافق تهيئة مهملة | فضّل `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, و`config-mutation` |
  | `plugin-sdk/telegram-command-config` | مساعدات أوامر Telegram | مساعدات تحقق من أوامر Telegram مستقرة الرجوع عندما يكون سطح عقد Telegram المضمن غير متاح |
  | `plugin-sdk/approval-runtime` | مساعدات مطالبة الموافقة | حمولة موافقة exec/Plugin، مساعدات قدرة/ملف تعريف الموافقة، مساعدات توجيه/وقت تشغيل الموافقة الأصلية، وتنسيق مسار عرض الموافقة المنظم |
  | `plugin-sdk/approval-auth-runtime` | مساعدات تفويض الموافقة | حل الموافق، وتفويض إجراء المحادثة نفسها |
  | `plugin-sdk/approval-client-runtime` | مساعدات عميل الموافقة | مساعدات ملف تعريف/مرشح موافقة exec الأصلية |
  | `plugin-sdk/approval-delivery-runtime` | مساعدات تسليم الموافقة | محولات قدرة/تسليم الموافقة الأصلية |
  | `plugin-sdk/approval-gateway-runtime` | مساعدات Gateway للموافقة | مساعد مشترك لحل Gateway للموافقة |
  | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات محول الموافقة | مساعدات خفيفة لتحميل محول الموافقة الأصلية لنقاط إدخال القنوات الساخنة |
  | `plugin-sdk/approval-handler-runtime` | مساعدات معالج الموافقة | مساعدات أوسع لوقت تشغيل معالج الموافقة؛ فضّل منافذ المحول/Gateway الأضيق عندما تكون كافية |
  | `plugin-sdk/approval-native-runtime` | مساعدات هدف الموافقة | مساعدات ربط هدف/حساب الموافقة الأصلية |
  | `plugin-sdk/approval-reply-runtime` | مساعدات رد الموافقة | مساعدات حمولة رد موافقة exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | مساعدات سياق وقت تشغيل القناة | مساعدات عامة لتسجيل/جلب/مراقبة سياق وقت تشغيل القناة |
  | `plugin-sdk/security-runtime` | مساعدات الأمان | مساعدات مشتركة للثقة، بوابة DM، الملفات/المسارات المحدودة بالجذر، المحتوى الخارجي، وجمع الأسرار |
  | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF | مساعدات قائمة السماح للمضيف وسياسة الشبكات الخاصة |
  | `plugin-sdk/ssrf-runtime` | مساعدات وقت تشغيل SSRF | مرسل مثبت، جلب محروس، ومساعدات سياسة SSRF |
  | `plugin-sdk/system-event-runtime` | مساعدات أحداث النظام | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | مساعدات Heartbeat | مساعدات إيقاظ Heartbeat، الحدث، والرؤية |
  | `plugin-sdk/delivery-queue-runtime` | مساعدات طابور التسليم | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | مساعدات نشاط القناة | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | مساعدات إزالة التكرار | مخابئ إزالة تكرار في الذاكرة |
  | `plugin-sdk/file-access-runtime` | مساعدات وصول الملفات | مساعدات آمنة لمسار الملفات/الوسائط المحلية |
  | `plugin-sdk/transport-ready-runtime` | مساعدات جاهزية النقل | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | مساعدات سياسة موافقة exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | مساعدات ذاكرة التخزين المؤقت المحدودة | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | مساعدات بوابة التشخيص | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | مساعدات تنسيق الأخطاء | `formatUncaughtError`, `isApprovalNotFoundError`, مساعدات مخطط الأخطاء |
  | `plugin-sdk/fetch-runtime` | مساعدات الجلب/الوكيل المغلفة | `resolveFetch`, مساعدات الوكيل، ومساعدات خيارات EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | مساعدات تطبيع المضيف | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | مساعدات إعادة المحاولة | `RetryConfig`, `retryAsync`, مشغلات السياسات |
  | `plugin-sdk/allow-from` | تنسيق قائمة السماح وربط الإدخال | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | مساعدات بوابة الأوامر وسطح الأوامر | `resolveControlCommandGate`, مساعدات تفويض المرسِل، ومساعدات سجل الأوامر بما يشمل تنسيق قائمة الوسائط الديناميكية |
  | `plugin-sdk/command-status` | عارضو حالة/مساعدة الأوامر | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تحليل إدخال الأسرار | مساعدات إدخال الأسرار |
  | `plugin-sdk/webhook-ingress` | مساعدات طلب Webhook | أدوات هدف Webhook |
  | `plugin-sdk/webhook-request-guards` | مساعدات حارس جسم Webhook | مساعدات قراءة/حد جسم الطلب |
  | `plugin-sdk/reply-runtime` | وقت تشغيل الرد المشترك | الإرسال الوارد، Heartbeat، مخطط الرد، التقسيم |
  | `plugin-sdk/reply-dispatch-runtime` | مساعدات إرسال الرد الضيقة | الإنهاء، إرسال الموفر، ومساعدات تسمية المحادثة |
  | `plugin-sdk/reply-history` | مساعدات سجل الردود | `createChannelHistoryWindow`؛ صادرات توافق مهملة لمساعدات الخرائط مثل `buildPendingHistoryContextFromMap`، و`recordPendingHistoryEntry`، و`clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | تخطيط مرجع الرد | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | مساعدات أجزاء الرد | مساعدات تقسيم النص/markdown |
  | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسات | مساعدات مسار التخزين + وقت التحديث |
  | `plugin-sdk/state-paths` | مساعدات مسار الحالة | مساعدات مجلدات الحالة وOAuth |
  | `plugin-sdk/routing` | مساعدات التوجيه/مفتاح الجلسة | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, مساعدات تطبيع مفتاح الجلسة |
  | `plugin-sdk/status-helpers` | مساعدات حالة القناة | منشئات ملخص حالة القناة/الحساب، افتراضيات حالة وقت التشغيل، مساعدات بيانات تعريف المشكلات |
  | `plugin-sdk/target-resolver-runtime` | مساعدات محلل الهدف | مساعدات مشتركة لمحلل الهدف |
  | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع السلاسل | مساعدات تطبيع السلاسل/المعرّفات اللطيفة |
  | `plugin-sdk/request-url` | مساعدات عنوان URL للطلب | استخراج عناوين URL النصية من مدخلات شبيهة بالطلبات |
  | `plugin-sdk/run-command` | مساعدات الأوامر المؤقتة | مشغّل أوامر مؤقت مع stdout/stderr مطبّعين |
  | `plugin-sdk/param-readers` | قارئات المعلمات | قارئات معلمات شائعة للأدوات/CLI |
  | `plugin-sdk/tool-payload` | استخراج حمولة الأداة | استخراج الحمولات المطبّعة من كائنات نتائج الأدوات |
  | `plugin-sdk/tool-send` | استخراج إرسال الأداة | استخراج حقول هدف الإرسال الأساسية من وسائط الأداة |
  | `plugin-sdk/temp-path` | مساعدات المسار المؤقت | مساعدات مشتركة لمسار التنزيل المؤقت |
  | `plugin-sdk/logging-core` | مساعدات التسجيل | مساعدات مسجل النظام الفرعي والتنقيح |
  | `plugin-sdk/markdown-table-runtime` | مساعدات جدول Markdown | مساعدات وضع جدول Markdown |
  | `plugin-sdk/reply-payload` | أنواع رد الرسائل | أنواع حمولة الرد |
  | `plugin-sdk/provider-setup` | مساعدات إعداد موفر محلي/مستضاف ذاتياً منتقاة | مساعدات اكتشاف/تكوين الموفر المستضاف ذاتياً |
  | `plugin-sdk/self-hosted-provider-setup` | مساعدات إعداد موفر مستضاف ذاتياً ومتوافق مع OpenAI ومركزة | مساعدات اكتشاف/تكوين الموفر المستضاف ذاتياً نفسها |
  | `plugin-sdk/provider-auth-runtime` | مساعدات مصادقة الموفر في وقت التشغيل | مساعدات حل مفتاح API في وقت التشغيل |
  | `plugin-sdk/provider-auth-api-key` | مساعدات إعداد مفتاح API للموفر | مساعدات التهيئة/كتابة الملف الشخصي لمفتاح API |
  | `plugin-sdk/provider-auth-result` | مساعدات نتيجة مصادقة الموفر | منشئ نتيجة مصادقة OAuth قياسي |
  | `plugin-sdk/provider-selection-runtime` | مساعدات اختيار الموفر | اختيار الموفر المكوّن أو التلقائي ودمج تكوين الموفر الخام |
  | `plugin-sdk/provider-env-vars` | مساعدات متغيرات البيئة للموفر | مساعدات البحث عن متغيرات بيئة مصادقة الموفر |
  | `plugin-sdk/provider-model-shared` | مساعدات مشتركة لنموذج الموفر/إعادة التشغيل | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, منشئات سياسة إعادة التشغيل المشتركة، مساعدات نقطة نهاية الموفر، ومساعدات تطبيع معرّف النموذج |
  | `plugin-sdk/provider-catalog-shared` | مساعدات كتالوج الموفر المشتركة | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | تصحيحات تهيئة الموفر | مساعدات تكوين التهيئة |
  | `plugin-sdk/provider-http` | مساعدات HTTP للموفر | مساعدات HTTP/قدرات نقاط النهاية العامة للموفر، بما في ذلك مساعدات نموذج multipart لنسخ الصوت |
  | `plugin-sdk/provider-web-fetch` | مساعدات جلب الويب للموفر | مساعدات تسجيل/تخزين مؤقت لموفر جلب الويب |
  | `plugin-sdk/provider-web-search-config-contract` | مساعدات تكوين بحث الويب للموفر | مساعدات ضيقة لتكوين/اعتماد بحث الويب للموفرين الذين لا يحتاجون إلى توصيل تفعيل Plugin |
  | `plugin-sdk/provider-web-search-contract` | مساعدات عقد بحث الويب للموفر | مساعدات ضيقة لعقد تكوين/اعتماد بحث الويب مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، ومحددات/جامعات الاعتمادات محددة النطاق |
  | `plugin-sdk/provider-web-search` | مساعدات بحث الويب للموفر | مساعدات تسجيل/تخزين مؤقت/وقت تشغيل لموفر بحث الويب |
  | `plugin-sdk/provider-tools` | مساعدات توافق أداة/مخطط الموفر | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف مخططات DeepSeek/Gemini/OpenAI + التشخيصات |
  | `plugin-sdk/provider-usage` | مساعدات استخدام الموفر | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`، ومساعدات استخدام أخرى للموفر |
  | `plugin-sdk/provider-stream` | مساعدات مغلف تدفق الموفر | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، أنواع مغلف التدفق، ومساعدات مغلف Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot المشتركة |
  | `plugin-sdk/provider-transport-runtime` | مساعدات نقل الموفر | مساعدات نقل الموفر الأصلية مثل الجلب المحروس، واستخراج نص نتيجة الأداة، وتحويلات رسائل النقل، وتدفقات أحداث نقل قابلة للكتابة |
  | `plugin-sdk/keyed-async-queue` | طابور غير متزامن مرتّب | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | مساعدات الوسائط المشتركة | مساعدات جلب/تحويل/تخزين الوسائط، واستكشاف أبعاد الفيديو المدعوم بـ ffprobe، ومنشئات حمولات الوسائط |
  | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة لتوليد الوسائط | مساعدات مشتركة للتجاوز عند الفشل، واختيار المرشح، ورسائل النموذج المفقود لتوليد الصور/الفيديو/الموسيقى |
  | `plugin-sdk/media-understanding` | مساعدات فهم الوسائط | أنواع موفر فهم الوسائط بالإضافة إلى تصديرات مساعدات الصور/الصوت المواجهة للموفر |
  | `plugin-sdk/text-runtime` | تصدير توافق نصي واسع مهمل | استخدم `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`، و`logging-core` |
  | `plugin-sdk/text-chunking` | مساعدات تقسيم النص | مساعد تقسيم النص الصادر |
  | `plugin-sdk/speech` | مساعدات الكلام | أنواع موفر الكلام بالإضافة إلى مساعدات التوجيه والسجل والتحقق المواجهة للموفر، ومنشئ TTS المتوافق مع OpenAI |
  | `plugin-sdk/speech-core` | نواة الكلام المشتركة | أنواع موفر الكلام، السجل، التوجيهات، التطبيع |
  | `plugin-sdk/realtime-transcription` | مساعدات النسخ الفوري | أنواع الموفر، مساعدات السجل، ومساعد جلسة WebSocket المشتركة |
  | `plugin-sdk/realtime-voice` | مساعدات الصوت الفوري | أنواع الموفر، مساعدات السجل/الحل، مساعدات جلسة الجسر، طوابير حديث الوكيل الراجعة المشتركة، التحكم الصوتي للتشغيل النشط، صحة النص/الحدث، كبت الصدى، مطابقة سؤال الاستشارة، تنسيق الاستشارة القسرية، تتبع سياق الدور، تتبع نشاط الإخراج، ومساعدات استشارة السياق السريعة |
  | `plugin-sdk/image-generation` | مساعدات توليد الصور | أنواع موفر توليد الصور بالإضافة إلى مساعدات أصل الصورة/عنوان URL للبيانات ومنشئ موفر الصور المتوافق مع OpenAI |
  | `plugin-sdk/image-generation-core` | نواة توليد الصور المشتركة | أنواع توليد الصور، التجاوز عند الفشل، المصادقة، ومساعدات السجل |
  | `plugin-sdk/music-generation` | مساعدات توليد الموسيقى | أنواع موفر/طلب/نتيجة توليد الموسيقى |
  | `plugin-sdk/music-generation-core` | نواة توليد الموسيقى المشتركة | أنواع توليد الموسيقى، مساعدات التجاوز عند الفشل، البحث عن الموفر، وتحليل مرجع النموذج |
  | `plugin-sdk/video-generation` | مساعدات توليد الفيديو | أنواع موفر/طلب/نتيجة توليد الفيديو |
  | `plugin-sdk/video-generation-core` | نواة توليد الفيديو المشتركة | أنواع توليد الفيديو، مساعدات التجاوز عند الفشل، البحث عن الموفر، وتحليل مرجع النموذج |
  | `plugin-sdk/interactive-runtime` | مساعدات الرد التفاعلي | تطبيع/اختزال حمولة الرد التفاعلي |
  | `plugin-sdk/channel-config-primitives` | بدائيات تكوين القناة | بدائيات ضيقة لمخطط تكوين القناة |
  | `plugin-sdk/channel-config-writes` | مساعدات كتابة تكوين القناة | مساعدات تفويض كتابة تكوين القناة |
  | `plugin-sdk/channel-plugin-common` | تمهيد القناة المشترك | تصديرات تمهيد Plugin القناة المشتركة |
  | `plugin-sdk/channel-status` | مساعدات حالة القناة | مساعدات مشتركة للقطة/ملخص حالة القناة |
  | `plugin-sdk/allowlist-config-edit` | مساعدات تكوين قائمة السماح | مساعدات تحرير/قراءة تكوين قائمة السماح |
  | `plugin-sdk/group-access` | مساعدات الوصول الجماعي | مساعدات مشتركة لقرار الوصول الجماعي |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | واجهات توافق مهملة | استخدم `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | مساعدات حارس الرسائل المباشرة | مساعدات ضيقة لسياسة الحارس قبل التشفير |
  | `plugin-sdk/extension-shared` | مساعدات الإضافة المشتركة | بدائيات القناة السلبية/الحالة ومساعد الوكيل المحيط |
  | `plugin-sdk/webhook-targets` | مساعدات هدف Webhook | سجل أهداف Webhook ومساعدات تثبيت المسار |
  | `plugin-sdk/webhook-path` | اسم مستعار مهمل لمسار Webhook | استخدم `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | مساعدات وسائط الويب المشتركة | مساعدات تحميل الوسائط البعيدة/المحلية |
  | `plugin-sdk/zod` | إعادة تصدير توافق Zod مهملة | استورد `zod` من `zod` مباشرة |
  | `plugin-sdk/memory-core` | مساعدات نواة الذاكرة المضمّنة | سطح مساعدات مدير الذاكرة/التكوين/الملفات/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل محرك الذاكرة | واجهة وقت تشغيل فهرس/بحث الذاكرة |
  | `plugin-sdk/memory-core-host-embedding-registry` | سجل تضمين الذاكرة | مساعدات خفيفة لسجل موفر تضمين الذاكرة |
  | `plugin-sdk/memory-core-host-engine-foundation` | محرك أساس مضيف الذاكرة | تصديرات محرك أساس مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-embeddings` | محرك تضمين مضيف الذاكرة | عقود تضمين الذاكرة، الوصول إلى السجل، الموفر المحلي، ومساعدات الدُفعات/البعيدة العامة؛ تعيش الموفرات البعيدة الملموسة في Plugins المالكة لها |
  | `plugin-sdk/memory-core-host-engine-qmd` | محرك QMD لمضيف الذاكرة | تصديرات محرك QMD لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-storage` | محرك تخزين مضيف الذاكرة | تصديرات محرك تخزين مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعددة الوسائط لمضيف الذاكرة | مساعدات متعددة الوسائط لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-query` | مساعدات استعلام مضيف الذاكرة | مساعدات استعلام مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-secret` | مساعدات سر مضيف الذاكرة | مساعدات سر مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-events` | اسم مستعار مهمل لأحداث الذاكرة | استخدم `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة | مساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-cli` | وقت تشغيل CLI لمضيف الذاكرة | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-core` | وقت تشغيل نواة مضيف الذاكرة | مساعدات وقت تشغيل نواة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-files` | مساعدات ملف/وقت تشغيل مضيف الذاكرة | مساعدات ملف/وقت تشغيل مضيف الذاكرة |
  | `plugin-sdk/memory-host-core` | اسم مستعار لوقت تشغيل نواة مضيف الذاكرة | اسم مستعار محايد للمورد لمساعدات وقت تشغيل نواة مضيف الذاكرة |
  | `plugin-sdk/memory-host-events` | اسم مستعار لسجل أحداث مضيف الذاكرة | اسم مستعار محايد للمورد لمساعدات سجل أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-host-files` | اسم مستعار مهمل لملف/وقت تشغيل الذاكرة | استخدم `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | مساعدات Markdown مُدارة | مساعدات Markdown مُدارة مشتركة لـ Plugins المجاورة للذاكرة |
  | `plugin-sdk/memory-host-search` | واجهة بحث Active Memory | واجهة وقت تشغيل كسولة لمدير بحث Active Memory |
  | `plugin-sdk/memory-host-status` | اسم مستعار مهمل لحالة مضيف الذاكرة | استخدم `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | أدوات الاختبار | تجميعة توافق مهملة محلية للمستودع؛ استخدم مسارات فرعية اختبارية مركزة محلية للمستودع مثل `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`، و`plugin-sdk/test-fixtures` |
</Accordion>

هذا الجدول هو عن قصد مجموعة الترحيل المشتركة، وليس كامل سطح SDK.
توجد قائمة جرد نقطة دخول المصرّف في
`scripts/lib/plugin-sdk-entrypoints.json`؛ وتُولَّد صادرات الحزم من
المجموعة العامة الفرعية.

تم تقاعد seams المساعدة المحجوزة للـ bundled-plugin من خريطة تصدير SDK العامة
باستثناء واجهات التوافق الموثقة صراحة، مثل shim
`plugin-sdk/discord` المهمل والمُحتفَظ به لحزمة
`@openclaw/discord@2026.3.13` المنشورة. تعيش المساعدات الخاصة بالمالك داخل
حزمة Plugin المالكة؛ وينبغي أن ينتقل سلوك المضيف المشترك عبر عقود SDK العامة
مثل `plugin-sdk/gateway-runtime` و`plugin-sdk/security-runtime`
و`plugin-sdk/plugin-config-runtime`.

استخدم أضيق import يطابق المهمة. إذا لم تجد export، فتحقق من المصدر في
`src/plugin-sdk/` أو اسأل المشرفين عن العقد العام الذي ينبغي أن يملكه.

## الإهمالات النشطة

إهمالات أضيق تنطبق عبر SDK للـ Plugin، وعقد المزوّد، وسطح runtime، والـ manifest.
كل واحد منها ما زال يعمل اليوم لكنه سيُزال في إصدار رئيسي مستقبلي. يربط السطر
أسفل كل عنصر API القديم ببديله canonical.

<AccordionGroup>
  <Accordion title="منشئات مساعدة command-auth → command-status">
    **القديم (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **الجديد (`openclaw/plugin-sdk/command-status`)**: التواقيع نفسها، والصادرات
    نفسها - لكنها تُستورَد فقط من subpath أضيق. يعيد `command-auth`
    تصديرها كـ compat stubs.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="مساعدات حجب الإشارات → resolveInboundMentionDecision">
    **القديم**: `resolveInboundMentionRequirement({ facts, policy })` و
    `shouldDropInboundForMention(...)` من
    `openclaw/plugin-sdk/channel-inbound` أو
    `openclaw/plugin-sdk/channel-mention-gating`.

    **الجديد**: `resolveInboundMentionDecision({ facts, policy })` - يعيد
    كائن قرار واحدا بدلا من استدعاءين منفصلين.

    لقد انتقلت Plugins القنوات اللاحقة (Slack وDiscord وMatrix وMS Teams) بالفعل.

  </Accordion>

  <Accordion title="Shim runtime القناة ومساعدات إجراءات القناة">
    `openclaw/plugin-sdk/channel-runtime` هو shim توافق لـ Plugins القنوات الأقدم.
    لا تستورده من كود جديد؛ استخدم
    `openclaw/plugin-sdk/channel-runtime-context` لتسجيل كائنات runtime.

    مساعدات `channelActions*` في `openclaw/plugin-sdk/channel-actions` مهملة
    إلى جانب صادرات القناة الخام "actions". اكشف القدرات عبر سطح
    `presentation` الدلالي بدلا من ذلك - تصرّح Plugins القنوات بما تعرضه
    (بطاقات، أزرار، قوائم اختيار) بدلا من أسماء الإجراءات الخام التي تقبلها.

  </Accordion>

  <Accordion title="مساعد tool() لمزوّد بحث الويب → createTool() على الـ Plugin">
    **القديم**: مصنع `tool()` من `openclaw/plugin-sdk/provider-web-search`.

    **الجديد**: نفّذ `createTool(...)` مباشرة على Plugin المزوّد.
    لم يعد OpenClaw يحتاج إلى مساعد SDK لتسجيل wrapper الأداة.

  </Accordion>

  <Accordion title="مغلفات القناة بالنص العادي → BodyForAgent">
    **القديم**: `formatInboundEnvelope(...)` (و
    `ChannelMessageForAgent.channelEnvelope`) لبناء مغلف prompt نصي مسطح
    من رسائل القناة الواردة.

    **الجديد**: `BodyForAgent` مع كتل سياق مستخدم منظمة. ترفق Plugins القنوات
    بيانات metadata للتوجيه (thread، topic، reply-to، reactions) كحقول typed
    بدلا من دمجها في سلسلة prompt. ما زال مساعد
    `formatAgentEnvelope(...)` مدعوما للمغلفات المصطنعة الموجهة إلى المساعد،
    لكن مغلفات النص العادي الواردة في طريقها إلى الخروج.

    المناطق المتأثرة: `inbound_claim` و`message_received` وأي Plugin قناة مخصص
    كان يعالج نص `channelEnvelope` لاحقا.

  </Accordion>

  <Accordion title="خطاف deactivate → gateway_stop">
    **القديم**: `api.on("deactivate", handler)`.

    **الجديد**: `api.on("gateway_stop", handler)`. الحدث والسياق هما عقد تنظيف
    الإيقاف نفسه؛ يتغير اسم الخطاف فقط.

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

  <Accordion title="خطاف subagent_spawning → ربط thread في core">
    **القديم**: `api.on("subagent_spawning", handler)` يعيد
    `threadBindingReady` أو `deliveryOrigin`.

    **الجديد**: دع core يجهّز روابط subagent مع `thread: true` عبر
    adapter ربط جلسة القناة. استخدم `api.on("subagent_spawned", handler)`
    فقط للمراقبة بعد التشغيل.

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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` فقط كأسطح توافق
    مهملة بينما تهاجر Plugins الخارجية.

  </Accordion>

  <Accordion title="أنواع اكتشاف المزوّد → أنواع كتالوج المزوّد">
    أصبحت أربعة aliases لأنواع الاكتشاف الآن wrappers رقيقة فوق أنواع عصر
    الكتالوج:

    | الاسم المستعار القديم      | النوع الجديد              |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    بالإضافة إلى الحقيبة الثابتة القديمة `ProviderCapabilities` - ينبغي
    لـ Plugins المزوّدين استخدام hooks مزوّد صريحة مثل `buildReplayPolicy`
    و`normalizeToolSchemas` و`wrapStreamFn` بدلا من كائن ثابت.

  </Accordion>

  <Accordion title="Hooks سياسة التفكير → resolveThinkingProfile">
    **القديم** (ثلاثة hooks منفصلة على `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)` و`supportsXHighThinking(ctx)` و
    `resolveDefaultThinkingLevel(ctx)`.

    **الجديد**: `resolveThinkingProfile(ctx)` واحد يعيد
    `ProviderThinkingProfile` مع `id` canonical و`label` اختياري وقائمة
    مستويات مرتبة. يخفض OpenClaw القيم المخزنة القديمة حسب رتبة الملف الشخصي
    تلقائيا.

    يتضمن السياق `provider` و`modelId` و`reasoning` مدمجا اختياريا وحقائق
    `compat` مدمجة اختياريا للنموذج. يمكن لـ Plugins المزوّدين استخدام حقائق
    الكتالوج هذه لكشف ملف شخصي خاص بالنموذج فقط عندما يدعم عقد الطلب المكوّن ذلك.

    نفّذ hook واحدا بدلا من ثلاثة. تظل hooks القديمة تعمل خلال نافذة الإهمال
    لكنها لا تُركَّب مع نتيجة الملف الشخصي.

  </Accordion>

  <Accordion title="مزوّدو المصادقة الخارجيون → contracts.externalAuthProviders">
    **القديم**: تنفيذ hooks المصادقة الخارجية دون التصريح بالمزوّد في manifest
    الخاص بالـ Plugin.

    **الجديد**: صرّح بـ `contracts.externalAuthProviders` في manifest الخاص
    بالـ Plugin **و** نفّذ `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="بحث env-var للمزوّد → setup.providers[].envVars">
    **حقل manifest القديم**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **الجديد**: انسخ بحث env-var نفسه إلى `setup.providers[].envVars`
    في الـ manifest. يدمج هذا metadata الإعداد/الحالة الخاصة بالبيئة في مكان
    واحد ويتجنب تشغيل runtime الخاص بالـ Plugin لمجرد الإجابة عن عمليات بحث
    env-var.

    يبقى `providerAuthEnvVars` مدعوما عبر adapter توافق حتى تُغلَق نافذة الإهمال.

  </Accordion>

  <Accordion title="تسجيل Plugin الذاكرة → registerMemoryCapability">
    **القديم**: ثلاث استدعاءات منفصلة -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **الجديد**: استدعاء واحد على API حالة الذاكرة -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    المواضع نفسها، واستدعاء تسجيل واحد. لا تتأثر مساعدات prompt والـ corpus
    الإضافية (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`).

  </Accordion>

  <Accordion title="API مزوّد تضمين الذاكرة">
    **القديم**: `api.registerMemoryEmbeddingProvider(...)` مع
    `contracts.memoryEmbeddingProviders`.

    **الجديد**: `api.registerEmbeddingProvider(...)` مع
    `contracts.embeddingProviders`.

    عقد مزوّد التضمين العام قابل لإعادة الاستخدام خارج الذاكرة وهو المسار
    المدعوم للمزوّدين الجدد. تبقى API التسجيل الخاصة بالذاكرة موصولة كتوافق
    مهمل بينما يهاجر المزوّدون الحاليون. تبلغ تقارير فحص الـ Plugin عن الاستخدام
    غير المضمّن بوصفه دين توافق.

  </Accordion>

  <Accordion title="إعادة تسمية أنواع رسائل جلسات subagent">
    لا يزال aliasان قديمان للأنواع مُصدَّرين من `src/plugins/runtime/types.ts`:

    | القديم                        | الجديد                         |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    طريقة runtime `readSession` مهملة لصالح `getSessionMessages`. التوقيع نفسه؛
    تستدعي الطريقة القديمة الجديدة داخليا.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **القديم**: `runtime.tasks.flow` (بالمفرد) كان يعيد accessor حيّا لـ task-flow.

    **الجديد**: يحتفظ `runtime.tasks.managedFlows` بـ runtime تعديل TaskFlow
    المُدار للـ Plugins التي تنشئ أو تحدّث أو تلغي أو تشغّل مهاما فرعية من flow.
    استخدم `runtime.tasks.flows` عندما يحتاج الـ Plugin فقط إلى قراءات قائمة
    على DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="مصانع الإضافات المضمّنة → middleware نتائج أدوات agent">
    تمت تغطيتها في "كيفية الترحيل → ترحيل إضافات نتائج الأدوات المضمّنة إلى
    middleware" أعلاه. أُدرجت هنا للاكتمال: يتم استبدال مسار
    `api.registerEmbeddedExtensionFactory(...)` الذي أُزيل وكان خاصا بـ embedded-runner-only
    بـ `api.registerAgentToolResultMiddleware(...)` مع قائمة runtime صريحة
    في `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="alias OpenClawSchemaType → OpenClawConfig">
    أصبح `OpenClawSchemaType` المُعاد تصديره من `openclaw/plugin-sdk`
    alias من سطر واحد لـ `OpenClawConfig`. فضّل الاسم canonical.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
تُتابَع إهمالات مستوى الإضافة (داخل Plugins القنوات/المزوّدين المضمّنة تحت
`extensions/`) داخل barrels الخاصة بها `api.ts` و`runtime-api.ts`.
لا تؤثر هذه في عقود Plugins الجهات الخارجية وليست مدرجة هنا. إذا كنت تستهلك
barrel محليا لPlugin مضمّن مباشرة، فاقرأ تعليقات الإهمال في ذلك barrel قبل
الترقية.
</Note>

## الجدول الزمني للإزالة

| متى                    | ما الذي يحدث                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **الآن**               | تُصدر الواجهات المهملة تحذيرات وقت التشغيل                              |
| **الإصدار الرئيسي التالي** | ستُزال الواجهات المهملة؛ وستفشل Plugins التي لا تزال تستخدمها          |

تم ترحيل جميع Plugins الأساسية بالفعل. يجب على Plugins الخارجية الترحيل
قبل الإصدار الرئيسي التالي.

## إيقاف التحذيرات مؤقتًا

اضبط متغيرات البيئة هذه أثناء العمل على الترحيل:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

هذا مخرج مؤقت، وليس حلًا دائمًا.

## ذات صلة

- [بدء الاستخدام](/ar/plugins/building-plugins) - أنشئ أول Plugin لك
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - مرجع كامل لاستيراد المسارات الفرعية
- [Channel Plugins](/ar/plugins/sdk-channel-plugins) - بناء Channel Plugins
- [Provider Plugins](/ar/plugins/sdk-provider-plugins) - بناء Provider Plugins
- [Plugin Internals](/ar/plugins/architecture) - شرح معماري معمق
- [Plugin Manifest](/ar/plugins/manifest) - مرجع مخطط البيان
