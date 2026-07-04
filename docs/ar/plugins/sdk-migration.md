---
read_when:
    - تظهر لك رسالة التحذير OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - تظهر لك رسالة التحذير OPENCLAW_EXTENSION_API_DEPRECATED
    - استخدمتَ api.registerEmbeddedExtensionFactory قبل OpenClaw 2026.4.25
    - أنت تحدّث Plugin إلى معمارية Plugin الحديثة
    - أنت تتولى صيانة Plugin خارجي لـ OpenClaw
sidebarTitle: Migrate to SDK
summary: الترحيل من طبقة التوافق العكسي القديمة إلى SDK الحديث للـ plugin
title: ترحيل Plugin SDK
x-i18n:
    generated_at: "2026-07-04T10:43:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7873de40aea56f456781ecf8ac9a4705c958030f7c68f8a112ad3f0fce62f078
    source_path: plugins/sdk-migration.md
    workflow: 16
---

انتقل OpenClaw من طبقة واسعة للتوافق مع الإصدارات السابقة إلى بنية Plugin
حديثة تعتمد على استيرادات مركزة وموثقة. إذا كان Plugin الخاص بك قد بُني قبل
البنية الجديدة، فسيساعدك هذا الدليل على الترحيل.

## ما الذي يتغير

كان نظام Plugin القديم يوفر سطحين واسعين ومفتوحين يتيحان لـ Plugins استيراد
أي شيء تحتاج إليه من نقطة دخول واحدة:

- **`openclaw/plugin-sdk/compat`** - استيراد واحد يعيد تصدير عشرات
  المساعدات. قُدّم لإبقاء Plugins الأقدم المعتمدة على الخطافات تعمل بينما كانت
  بنية Plugin الجديدة قيد البناء.
- **`openclaw/plugin-sdk/infra-runtime`** - حزمة مساعدات تشغيلية واسعة
  تمزج أحداث النظام، وحالة Heartbeat، وطوابير التسليم، ومساعدات الجلب/الوكيل،
  ومساعدات الملفات، وأنواع الموافقة، وأدوات غير ذات صلة.
- **`openclaw/plugin-sdk/config-runtime`** - حزمة توافق إعدادات واسعة
  ما تزال تحمل مساعدات التحميل/الكتابة المباشرة المهملة خلال نافذة الترحيل.
- **`openclaw/extension-api`** - جسر منح Plugins وصولاً مباشراً إلى
  مساعدات جانب المضيف مثل مشغّل الوكيل المضمّن.
- **`api.registerEmbeddedExtensionFactory(...)`** - خطاف Plugin مضمّن خاص
  بالمشغّل المضمّن فقط تمت إزالته، وكان يستطيع مراقبة أحداث المشغّل المضمّن مثل
  `tool_result`.

أصبحت أسطح الاستيراد الواسعة الآن **مهملة**. ما تزال تعمل في وقت التشغيل،
لكن يجب ألا تستخدمها Plugins الجديدة، وينبغي لـ Plugins الحالية الترحيل قبل
أن يزيلها الإصدار الرئيسي التالي. أزيلت واجهة برمجة تطبيقات تسجيل مصنع Plugin
الخاصة بالمشغّل المضمّن فقط؛ استخدم وسيط نتائج الأدوات بدلاً من ذلك.

لا يزيل OpenClaw سلوك Plugin الموثق أو يعيد تفسيره في التغيير نفسه الذي
يقدم بديلاً. يجب أن تمر تغييرات العقود الكاسرة أولاً عبر محول توافق، وتشخيصات،
ومستندات، ونافذة إهمال. ينطبق ذلك على استيرادات SDK، وحقول البيان، وواجهات
إعداد API، والخطافات، وسلوك التسجيل في وقت التشغيل.

<Warning>
  ستزال طبقة التوافق مع الإصدارات السابقة في إصدار رئيسي مستقبلي.
  ستتعطل Plugins التي ما تزال تستورد من هذه الأسطح عند حدوث ذلك.
  لم تعد تسجيلات مصنع Plugin المضمّن القديمة تُحمّل بالفعل.
</Warning>

## لماذا تغير هذا

تسبب النهج القديم في مشكلات:

- **بدء تشغيل بطيء** - كان استيراد مساعد واحد يحمّل عشرات الوحدات غير ذات الصلة
- **اعتماديات دائرية** - جعلت إعادة التصدير الواسعة إنشاء دورات استيراد أمراً سهلاً
- **سطح API غير واضح** - لم تكن هناك طريقة لمعرفة أي الصادرات مستقرة وأيها داخلية

يصلح SDK Plugin الحديث هذا: فكل مسار استيراد (`openclaw/plugin-sdk/\<subpath\>`)
هو وحدة صغيرة ومكتفية ذاتياً لها غرض واضح وعقد موثق.

اختفت أيضاً طبقات التسهيل القديمة للمزودين الخاصة بالقنوات المضمّنة.
كانت طبقات المساعدة ذات العلامة القنوية اختصارات خاصة بمستودع أحادي، وليست
عقود Plugin مستقرة. استخدم بدلاً منها مسارات SDK فرعية عامة وضيقة. داخل مساحة
عمل Plugin المضمّنة، أبقِ المساعدات المملوكة للمزود داخل `api.ts` أو
`runtime-api.ts` الخاصة بذلك Plugin.

أمثلة المزودين المضمّنين الحالية:

- يحتفظ Anthropic بمساعدات البث الخاصة بـ Claude في طبقة `api.ts` /
  `contract-api.ts` الخاصة به
- يحتفظ OpenAI ببناة المزودين، ومساعدات النموذج الافتراضي، وبناة مزود الوقت
  الحقيقي في `api.ts` الخاصة به
- يحتفظ OpenRouter بباني المزود ومساعدات الإعداد/التكوين في `api.ts` الخاصة به

## خطة ترحيل Talk والصوت في الوقت الحقيقي

تنتقل شيفرة Talk الخاصة بالصوت في الوقت الحقيقي، والاتصالات الهاتفية،
والاجتماعات، والمتصفح من مسك دفاتر الدور المحلي لكل سطح إلى متحكم جلسة Talk
مشترك يصدّره `openclaw/plugin-sdk/realtime-voice`. يمتلك المتحكم الجديد مظروف
أحداث Talk المشترك، وحالة الدور النشط، وحالة الالتقاط، وحالة الصوت الخارج،
وسجل الأحداث الحديثة، ورفض الأدوار القديمة. ينبغي أن تظل Plugins المزودين
مالكة لجلسات الوقت الحقيقي الخاصة بالمورّد؛ وينبغي أن تظل Plugins الأسطح مالكة
لخصوصيات الالتقاط، والتشغيل، والاتصالات الهاتفية، والاجتماعات.

ترحيل Talk هذا كاسر ونظيف عمداً:

1. أبقِ متحكم/بدائيات وقت التشغيل المشتركة في
   `plugin-sdk/realtime-voice`.
2. انقل الأسطح المضمّنة إلى المتحكم المشترك: مرحّل المتصفح،
   وتسليم الغرفة المُدارة، ووقت الاتصال الصوتي الحقيقي، وSTT المتدفق للاتصال
   الصوتي، ووقت Google Meet الحقيقي، والضغط الأصلي للتحدث.
3. استبدل عائلات RPC القديمة الخاصة بـ Talk بواجهة API النهائية `talk.session.*` و
   `talk.client.*`.
4. أعلن عن قناة أحداث Talk حية واحدة في Gateway
   `hello-ok.features.events`: `talk.event`.
5. احذف نقطة نهاية HTTP القديمة للوقت الحقيقي وأي مسار لتجاوز التعليمات وقت الطلب.

ينبغي ألا تستدعي الشيفرة الجديدة `createTalkEventSequencer(...)` مباشرة إلا إذا كانت
تنفذ محولاً منخفض المستوى أو أداة اختبار. فضّل المتحكم المشترك حتى لا يمكن إصدار
أحداث نطاق الدور من دون معرف دور، ولا يمكن لاستدعاءات `turnEnd` /
`turnCancel` القديمة مسح دور نشط أحدث، وتبقى أحداث دورة حياة الصوت الخارج
متسقة عبر الاتصالات الهاتفية، والاجتماعات، ومرحل المتصفح، وتسليم الغرفة المُدارة،
وعملاء Talk الأصليين.

شكل API العام المستهدف هو:

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

تستخدم جلسات WebRTC/provider-websocket المملوكة للمتصفح `talk.client.create`،
لأن المتصفح يمتلك تفاوض المزود ونقل الوسائط، بينما يمتلك Gateway بيانات الاعتماد
والتعليمات وسياسة الأدوات. `talk.session.*` هو السطح المشترك المُدار بواسطة Gateway
للوقت الحقيقي عبر gateway-relay، والنسخ عبر gateway-relay، وجلسات STT/TTS
الأصلية في الغرفة المُدارة.

ينبغي إصلاح الإعدادات القديمة التي وضعت محددات الوقت الحقيقي بجانب `talk.provider` /
`talk.providers` باستخدام `openclaw doctor --fix`؛ لا يعيد Talk في وقت التشغيل
تفسير إعداد مزود الكلام/TTS باعتباره إعداد مزود وقت حقيقي.

توليفات `talk.session.create` المدعومة صغيرة عمداً:

| النمط            | النقل       | العقل           | المالك              | ملاحظات                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | صوت مزود ثنائي الاتجاه الكامل يتم تجسيره عبر Gateway؛ تُوجّه استدعاءات الأدوات عبر أداة agent-consult.      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | STT متدفق فقط؛ يرسل المستدعون صوت الإدخال ويتلقون أحداث النص.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | غرفة أصلية/عميل | غرف بأسلوب الضغط للتحدث واللاسلكي حيث يمتلك العميل الالتقاط/التشغيل ويمتلك Gateway حالة الدور. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | غرفة أصلية/عميل | نمط غرفة للمسؤولين فقط للأسطح الموثوقة من الطرف الأول التي تنفذ إجراءات أدوات Gateway مباشرة.                  |

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

كما أن مفردات التحكم الموحدة ضيقة عمداً:

  | الطريقة                          | تنطبق على                                              | العقد                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | إلحاق جزء صوت PCM بترميز base64 بجلسة المزوّد التي يملكها اتصال Gateway نفسه.                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | بدء دور مستخدم في غرفة مُدارة.                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | إنهاء الدور النشط بعد التحقق من الدور المتقادم.                                                                                                                                         |
  | `talk.session.cancelTurn`       | جميع الجلسات التي يملكها Gateway                              | إلغاء عمل الالتقاط/المزوّد/الوكيل/TTS النشط لدور ما.                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | إيقاف إخراج صوت المساعد دون إنهاء دور المستخدم بالضرورة.                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | إكمال استدعاء أداة المزوّد الذي أصدره المرحّل؛ مرّر `options.willContinue` للمخرجات المؤقتة أو `options.suppressResponse` لتلبية الاستدعاء دون رد مساعد آخر. |
  | `talk.session.steer`            | جلسات Talk المدعومة بوكيل                              | إرسال تحكم منطوق من نوع `status` أو `steer` أو `cancel` أو `followup` إلى التشغيل المضمّن النشط الذي تم حله من جلسة Talk.                                                                |
  | `talk.session.close`            | جميع الجلسات الموحّدة                                    | إيقاف جلسات المرحّل أو إبطال حالة الغرفة المُدارة، ثم نسيان معرّف الجلسة الموحّدة.                                                                                                    |

  لا تُدخل حالات خاصة بالمزوّد أو المنصة في النواة لجعل هذا يعمل.
  تملك النواة دلالات جلسة Talk. وتملك إضافات المزوّد إعداد جلسة البائع.
  وتملك المكالمات الصوتية وGoogle Meet محوّلات الهاتفية/الاجتماعات. وتملك تطبيقات المتصفح والتطبيقات الأصلية
  تجربة مستخدم التقاط/تشغيل الجهاز.

  ## سياسة التوافق

  بالنسبة إلى الإضافات الخارجية، يتبع عمل التوافق هذا الترتيب:

  1. أضف العقد الجديد
  2. أبقِ السلوك القديم موصولًا عبر محوّل توافق
  3. أصدِر تشخيصًا أو تحذيرًا يذكر المسار القديم والبديل
  4. غطِّ كلا المسارين في الاختبارات
  5. وثّق الإيقاف التدريجي ومسار الترحيل
  6. أزِل فقط بعد نافذة الترحيل المُعلنة، عادةً في إصدار رئيسي

  يمكن للمشرفين تدقيق قائمة انتظار الترحيل الحالية باستخدام
  `pnpm plugins:boundary-report`. استخدم `pnpm plugins:boundary-report:summary` للحصول على
  أعداد موجزة، و`--owner <id>` لإضافة واحدة أو مالك توافق واحد، و
  `pnpm plugins:boundary-report:ci` عندما ينبغي لبوابة CI أن تفشل عند وجود
  سجلات توافق مستحقة، أو استيرادات SDK محجوزة عابرة للمالكين، أو مسارات SDK فرعية محجوزة
  غير مستخدمة. يجمع التقرير سجلات التوافق
  الموقوفة تدريجيًا حسب تاريخ الإزالة، ويعدّ مراجع الكود/المستندات المحلية،
  ويُظهر استيرادات SDK المحجوزة العابرة للمالكين، ويلخّص جسر SDK الخاص
  بمضيف الذاكرة بحيث يبقى تنظيف التوافق صريحًا بدلًا من
  الاعتماد على عمليات بحث مخصصة. يجب أن يكون للمسارات الفرعية المحجوزة في SDK استخدام مالك متتبّع؛
  وينبغي إزالة صادرات المساعدين المحجوزة غير المستخدمة من SDK العام.

  إذا كان حقل manifest لا يزال مقبولًا، فيمكن لمؤلفي الإضافات الاستمرار في استخدامه حتى
  تقول المستندات والتشخيصات خلاف ذلك. ينبغي للكود الجديد تفضيل
  البديل الموثّق، لكن لا ينبغي أن تتعطل الإضافات الموجودة أثناء
  الإصدارات الثانوية العادية.

  ## كيفية الترحيل

  <Steps>
  <Step title="ترحيل مساعدات تحميل/كتابة إعدادات وقت التشغيل">
    ينبغي للإضافات المضمّنة التوقف عن استدعاء
    `api.runtime.config.loadConfig()` و
    `api.runtime.config.writeConfigFile(...)` مباشرةً. فضّل الإعدادات التي
    تم تمريرها بالفعل إلى مسار الاستدعاء النشط. يمكن للمعالجات طويلة العمر التي تحتاج إلى
    لقطة العملية الحالية استخدام `api.runtime.config.current()`. وينبغي لأدوات
    الوكيل طويلة العمر استخدام `ctx.getRuntimeConfig()` الخاص بسياق الأداة داخل
    `execute` بحيث تظل الأداة التي أُنشئت قبل كتابة إعدادات قادرة على رؤية
    إعدادات وقت التشغيل المحدّثة.

    يجب أن تمر كتابات الإعدادات عبر المساعدات المعاملاتية وأن تختار
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
    المتابعة ويريد عمدًا كبت مخطط إعادة التحميل.
    تتضمن نتائج الطفرة ملخص `followUp` ذا نوع محددًا للاختبارات والتسجيل؛
    يظل Gateway مسؤولًا عن تطبيق إعادة التشغيل أو جدولتها.
    يظل `loadConfig` و`writeConfigFile` مساعدَي توافق
    موقوفين تدريجيًا للإضافات الخارجية أثناء نافذة الترحيل ويحذّران مرة واحدة باستخدام
    رمز التوافق `runtime-config-load-write`. تتم حماية الإضافات المضمّنة وكود وقت تشغيل
    المستودع بواسطة حواجز الماسح في
    `pnpm check:deprecated-api-usage` و
    `pnpm check:no-runtime-action-load-config`: يفشل استخدام إضافات الإنتاج الجديد
    مباشرةً، وتفشل كتابات الإعدادات المباشرة، ويجب أن تستخدم طرق خادم Gateway
    لقطة وقت تشغيل الطلب، ويجب أن تتلقى مساعدات إرسال/إجراء/عميل قناة وقت التشغيل
    الإعدادات من حدودها، ولا يُسمح لوحدات وقت التشغيل طويلة العمر بأي
    استدعاءات `loadConfig()` محيطة.

    ينبغي لكود الإضافة الجديد أيضًا تجنب استيراد
    برميل التوافق الواسع `openclaw/plugin-sdk/config-runtime`. استخدم مسار SDK الفرعي
    الضيق الذي يطابق المهمة:

    | الحاجة | الاستيراد |
    | --- | --- |
    | أنواع الإعدادات مثل `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | تأكيدات الإعدادات المحمّلة مسبقًا وبحث إعدادات مدخل الإضافة | `openclaw/plugin-sdk/plugin-config-runtime` |
    | قراءات لقطة وقت التشغيل الحالية | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | كتابات الإعدادات | `openclaw/plugin-sdk/config-mutation` |
    | مساعدات مخزن الجلسات | `openclaw/plugin-sdk/session-store-runtime` |
    | إعدادات جدول Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | مساعدات وقت تشغيل سياسة المجموعات | `openclaw/plugin-sdk/runtime-group-policy` |
    | حل إدخال السر | `openclaw/plugin-sdk/secret-input-runtime` |
    | تجاوزات النموذج/الجلسة | `openclaw/plugin-sdk/model-session-runtime` |

    تتم حماية الإضافات المضمّنة واختباراتها بالماسح ضد البرميل الواسع
    بحيث تبقى الاستيرادات والمحاكيات محلية للسلوك الذي تحتاجه. لا يزال البرميل الواسع
    موجودًا للتوافق الخارجي، لكن لا ينبغي للكود الجديد
    الاعتماد عليه.

  </Step>

  <Step title="ترحيل امتدادات نتائج الأدوات المضمّنة إلى وسيط">
    يجب على الإضافات المضمّنة استبدال معالجات نتائج الأدوات الخاصة بالمشغّل المضمّن فقط
    `api.registerEmbeddedExtensionFactory(...)`
    بوسيط محايد لوقت التشغيل.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    حدّث manifest الإضافة في الوقت نفسه:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    يمكن للإضافات المثبّتة أيضًا تسجيل وسيط نتائج الأدوات عندما تكون
    مفعّلة صراحةً وتعلن كل وقت تشغيل مستهدف في
    `contracts.agentToolResultMiddleware`. تُرفض تسجيلات الوسيط المثبّتة
    غير المعلنة.

  </Step>

  <Step title="ترحيل معالجات الموافقة الأصلية إلى حقائق الإمكانات">
    تعرض إضافات القنوات القادرة على الموافقة الآن سلوك الموافقة الأصلي عبر
    `approvalCapability.nativeRuntime` بالإضافة إلى سجل سياق وقت التشغيل المشترك.

    التغييرات الرئيسية:

    - استبدل `approvalCapability.handler.loadRuntime(...)` بـ
      `approvalCapability.nativeRuntime`
    - انقل المصادقة/التسليم الخاصين بالموافقة من توصيلات `plugin.auth` /
      `plugin.approvals` القديمة إلى `approvalCapability`
    - تمت إزالة `ChannelPlugin.approvals` من عقد إضافة القناة العام؛
      انقل حقول التسليم/الأصلي/العرض إلى `approvalCapability`
    - يبقى `plugin.auth` لتدفقات تسجيل الدخول/الخروج للقناة فقط؛ لم تعد النواة
      تقرأ خطافات مصادقة الموافقة هناك
    - سجّل كائنات وقت التشغيل المملوكة للقناة مثل العملاء أو الرموز أو تطبيقات Bolt
      عبر `openclaw/plugin-sdk/channel-runtime-context`
    - لا ترسل إشعارات إعادة التوجيه المملوكة للإضافة من معالجات الموافقة الأصلية؛
      تملك النواة الآن إشعارات التوجيه إلى مكان آخر من نتائج التسليم الفعلية
    - عند تمرير `channelRuntime` إلى `createChannelManager(...)`، قدّم
      سطح `createPluginRuntime().channel` حقيقيًا. تُرفض الجذوع الجزئية.

    راجع `/plugins/sdk-channel-plugins` للتخطيط الحالي لإمكانات الموافقة.

  </Step>

  <Step title="تدقيق سلوك الرجوع الاحتياطي لمغلّف Windows">
    إذا كانت إضافتك تستخدم `openclaw/plugin-sdk/windows-spawn`، فإن مغلّفات Windows
    `.cmd`/`.bat` غير المحلولة تفشل الآن بشكل مغلق ما لم تمرر صراحةً
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

    إذا لم يكن المستدعي لديك يعتمد عمدًا على الرجوع الاحتياطي عبر الصدفة، فلا تضبط
    `allowShellFallback` وتعامل مع الخطأ المرمى بدلًا من ذلك.

  </Step>

  <Step title="العثور على الاستيرادات الموقوفة تدريجيًا">
    ابحث في إضافتك عن الاستيرادات من أي من السطحين الموقوفين تدريجيًا:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="استبدالها باستيرادات مركّزة">
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

    بالنسبة إلى مساعدات جانب المضيف، استخدم وقت تشغيل الإضافة المحقون بدلًا من الاستيراد
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

  <Step title="استبدل استيرادات infra-runtime الواسعة">
    لا يزال `openclaw/plugin-sdk/infra-runtime` موجودًا للتوافق الخارجي، لكن ينبغي للكود الجديد أن يستورد سطح المساعدات المركّز الذي يحتاجه فعليًا:

    | الحاجة | الاستيراد |
    | --- | --- |
    | مساعدات قائمة انتظار أحداث النظام | `openclaw/plugin-sdk/system-event-runtime` |
    | مساعدات تنبيه Heartbeat والحدث والرؤية | `openclaw/plugin-sdk/heartbeat-runtime` |
    | تفريغ قائمة انتظار التسليم المعلّق | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | قياسات نشاط القناة | `openclaw/plugin-sdk/channel-activity-runtime` |
    | ذاكرات التخزين المؤقت لإزالة التكرار، المدعومة بالذاكرة والمستمرة | `openclaw/plugin-sdk/dedupe-runtime` |
    | مساعدات آمنة لمسارات الملفات المحلية/الوسائط | `openclaw/plugin-sdk/file-access-runtime` |
    | `fetch` واعٍ بالمرسِل | `openclaw/plugin-sdk/runtime-fetch` |
    | مساعدات الوكيل و`fetch` المحروس | `openclaw/plugin-sdk/fetch-runtime` |
    | أنواع سياسة مرسِل SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | أنواع طلب/حل الموافقة | `openclaw/plugin-sdk/approval-runtime` |
    | مساعدات حمولة رد الموافقة والأوامر | `openclaw/plugin-sdk/approval-reply-runtime` |
    | مساعدات تنسيق الأخطاء | `openclaw/plugin-sdk/error-runtime` |
    | انتظار جاهزية النقل | `openclaw/plugin-sdk/transport-ready-runtime` |
    | مساعدات الرموز الآمنة | `openclaw/plugin-sdk/secure-random-runtime` |
    | تزامن محدود للمهام غير المتزامنة | `openclaw/plugin-sdk/concurrency-runtime` |
    | التحويل القسري الرقمي | `openclaw/plugin-sdk/number-runtime` |
    | قفل غير متزامن محلي للعملية | `openclaw/plugin-sdk/async-lock-runtime` |
    | أقفال الملفات | `openclaw/plugin-sdk/file-lock` |

    تخضع Plugins المضمّنة لحراسة الماسح ضد `infra-runtime`، لذلك لا يمكن لكود المستودع أن يتراجع إلى البرميل الواسع.

  </Step>

  <Step title="رحّل مساعدات مسارات القنوات">
    ينبغي لكود مسارات القنوات الجديد استخدام `openclaw/plugin-sdk/channel-route`.
    تظل أسماء مفتاح المسار والهدف القابل للمقارنة الأقدم موجودة كأسماء مستعارة للتوافق أثناء نافذة الترحيل، لكن ينبغي للـ Plugins الجديدة استخدام أسماء المسارات التي تصف السلوك مباشرةً:

    | المساعد القديم | المساعد الحديث |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    تقوم مساعدات المسارات الحديثة بتطبيع `{ channel, to, accountId, threadId }`
    بشكل متسق عبر الموافقات الأصلية، وكبت الردود، وإزالة تكرار الوارد،
    وتسليم cron، وتوجيه الجلسات.

    لا تضف استخدامات جديدة لـ `ChannelMessagingAdapter.parseExplicitTarget` أو
    مساعدات المسارات المحمّلة المدعومة بالمحلل (`parseExplicitTargetForLoadedChannel`
    أو `resolveRouteTargetForLoadedChannel`) أو
    `resolveChannelRouteTargetWithParser(...)` من `plugin-sdk/channel-route`.
    هذه الخطافات مهملة وتبقى فقط للـ Plugins الأقدم أثناء نافذة الترحيل.
    ينبغي للـ Plugins القنوات الجديدة استخدام
    `messaging.targetResolver.resolveTarget(...)` لتطبيع معرّف الهدف
    والرجوع عند فقدان الدليل، و`messaging.inferTargetChatType(...)` عندما يحتاج core
    إلى نوع نظير مبكر، و`messaging.resolveOutboundSessionRoute(...)`
    لهوية الجلسة وسلسلة الرسائل الأصلية للمزوّد.

  </Step>

  <Step title="ابنِ واختبر">
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
  | `plugin-sdk/plugin-entry` | مساعد إدخال Plugin القياسي | `definePluginEntry` |
  | `plugin-sdk/core` | إعادة تصدير شاملة قديمة لتعريفات وبناة إدخالات القنوات | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | تصدير مخطط تهيئة الجذر | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | مساعد إدخال لمزوّد واحد | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعريفات وبناة مركزة لإدخالات القنوات | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة | مترجم الإعداد، مطالبات قائمة السماح، بناة حالة الإعداد |
  | `plugin-sdk/setup-runtime` | مساعدات وقت الإعداد الخاصة بوقت التشغيل | `createSetupTranslator`، محوّلات تصحيحات إعداد آمنة للاستيراد، مساعدات ملاحظات البحث، `promptResolvedAllowFrom`، `splitSetupEntries`، وكلاء إعداد مفوّضون |
  | `plugin-sdk/setup-adapter-runtime` | اسم مستعار مهمل لمحوّل الإعداد | استخدم `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | مساعدات أدوات الإعداد | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | مساعدات الحسابات المتعددة | مساعدات قائمة الحسابات/التهيئة/بوابة الإجراءات |
  | `plugin-sdk/account-id` | مساعدات معرّفات الحسابات | `DEFAULT_ACCOUNT_ID`، تطبيع معرّف الحساب |
  | `plugin-sdk/account-resolution` | مساعدات البحث عن الحسابات | مساعدات البحث عن الحسابات والرجوع الافتراضي |
  | `plugin-sdk/account-helpers` | مساعدات حسابات ضيقة النطاق | مساعدات قائمة الحسابات/إجراءات الحسابات |
  | `plugin-sdk/channel-setup` | محوّلات معالج الإعداد | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، إضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | بدائيات إقران DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | بادئة الرد، والكتابة، وتوصيل التسليم من المصدر | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | مصانع محوّلات التهيئة ومساعدات وصول DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | بناة مخططات التهيئة | بدائيات مخطط تهيئة القنوات المشتركة والباني العام فقط |
  | `plugin-sdk/bundled-channel-config-schema` | مخططات التهيئة المضمّنة | Plugins المضمّنة التي يصونها OpenClaw فقط؛ يجب أن تعرّف Plugins الجديدة مخططات محلية للـ Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | مخططات تهيئة مضمّنة مهملة | اسم مستعار للتوافق فقط؛ استخدم `plugin-sdk/bundled-channel-config-schema` للـ Plugins المضمّنة المصانة |
  | `plugin-sdk/telegram-command-config` | مساعدات تهيئة أوامر Telegram | تطبيع أسماء الأوامر، تقليم الأوصاف، التحقق من التكرار/التعارض |
  | `plugin-sdk/channel-policy` | حل سياسة المجموعة/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | واجهة توافق مهملة | استخدم `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | مساعدات مغلفات الوارد | مساعدات مشتركة لبناء المسارات والمغلفات |
  | `plugin-sdk/channel-inbound` | مساعدات استقبال الوارد | بناء السياق، والتنسيق، والجذور، والمشغّلات، وإرسال الردود المحضّرة، ومسندات الإرسال |
  | `plugin-sdk/messaging-targets` | مسار استيراد مهمل لتحليل الأهداف | استخدم `plugin-sdk/channel-targets` لمساعدات تحليل الأهداف العامة، و`plugin-sdk/channel-route` لمقارنة المسارات، و`messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` المملوكين للـ Plugin لحل الأهداف الخاصة بالمزوّد |
  | `plugin-sdk/outbound-media` | مساعدات الوسائط الصادرة | تحميل الوسائط الصادرة المشتركة |
  | `plugin-sdk/outbound-send-deps` | واجهة توافق مهملة | استخدم `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | مساعدات دورة حياة الرسائل الصادرة | محوّلات الرسائل، والإيصالات، ومساعدات الإرسال الدائم، ومساعدات المعاينة المباشرة/البث، وخيارات الرد، ومساعدات دورة الحياة، وهوية الصادر، وتخطيط الحمولة |
  | `plugin-sdk/channel-streaming` | واجهة توافق مهملة | استخدم `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | واجهة توافق مهملة | استخدم `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | مساعدات ربط المحادثات | مساعدات دورة حياة ربط المحادثات ومحوّلاته |
  | `plugin-sdk/agent-media-payload` | مساعدات حمولات الوسائط القديمة | باني حمولة وسائط الوكيل لتخطيطات الحقول القديمة |
  | `plugin-sdk/channel-runtime` | وصلة توافق مهملة | أدوات وقت تشغيل القنوات القديمة فقط |
  | `plugin-sdk/channel-send-result` | أنواع نتائج الإرسال | أنواع نتائج الرد |
  | `plugin-sdk/runtime-store` | تخزين Plugin دائم | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | مساعدات وقت تشغيل واسعة النطاق | مساعدات وقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
  | `plugin-sdk/runtime-env` | مساعدات ضيقة النطاق لبيئة وقت التشغيل | مساعدات المسجل/بيئة وقت التشغيل، والمهلة، وإعادة المحاولة، والتراجع |
  | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لوقت تشغيل Plugin | مساعدات أوامر/خطافات/http/تفاعلية للـ Plugin |
  | `plugin-sdk/hook-runtime` | مساعدات مسار الخطافات | مساعدات مشتركة لمسار خطافات Webhook/الخطافات الداخلية |
  | `plugin-sdk/lazy-runtime` | مساعدات وقت التشغيل الكسول | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | مساعدات العمليات | مساعدات exec المشتركة |
  | `plugin-sdk/cli-runtime` | مساعدات وقت تشغيل CLI | تنسيق الأوامر، والانتظار، ومساعدات الإصدار |
  | `plugin-sdk/gateway-runtime` | مساعدات Gateway | عميل Gateway، ومساعد بدء جاهز لحلقة الأحداث، وحل مضيف LAN المعلن، ومساعدات تصحيح حالة القناة |
  | `plugin-sdk/config-runtime` | وصلة توافق تهيئة مهملة | فضّل `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, و`config-mutation` |
  | `plugin-sdk/telegram-command-config` | مساعدات أوامر Telegram | مساعدات تحقق من أوامر Telegram مستقرة مع الرجوع الاحتياطي عندما يكون سطح عقد Telegram المضمّن غير متاح |
  | `plugin-sdk/approval-runtime` | مساعدات مطالبة الموافقة | حمولة موافقة exec/Plugin، ومساعدات قدرة/ملف تعريف الموافقة، ومساعدات توجيه/وقت تشغيل الموافقة الأصلية، وتنسيق مسار عرض الموافقة المنظم |
  | `plugin-sdk/approval-auth-runtime` | مساعدات مصادقة الموافقة | حل صاحب الموافقة، ومصادقة إجراء الدردشة نفسها |
  | `plugin-sdk/approval-client-runtime` | مساعدات عميل الموافقة | مساعدات ملف تعريف/مرشح موافقة exec الأصلية |
  | `plugin-sdk/approval-delivery-runtime` | مساعدات تسليم الموافقة | محوّلات قدرة/تسليم الموافقة الأصلية |
  | `plugin-sdk/approval-gateway-runtime` | مساعدات Gateway للموافقة | مساعد مشترك لحل Gateway للموافقة |
  | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات محوّل الموافقة | مساعدات خفيفة لتحميل محوّل الموافقة الأصلية لنقاط دخول القنوات الساخنة |
  | `plugin-sdk/approval-handler-runtime` | مساعدات معالج الموافقة | مساعدات أوسع لوقت تشغيل معالج الموافقة؛ فضّل وصلات المحوّل/Gateway الأضيق عندما تكون كافية |
  | `plugin-sdk/approval-native-runtime` | مساعدات هدف الموافقة | مساعدات ربط هدف/حساب الموافقة الأصلية |
  | `plugin-sdk/approval-reply-runtime` | مساعدات رد الموافقة | مساعدات حمولة رد موافقة exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | مساعدات سياق وقت تشغيل القناة | مساعدات عامة لتسجيل/جلب/مراقبة سياق وقت تشغيل القناة |
  | `plugin-sdk/security-runtime` | مساعدات الأمان | مساعدات الثقة المشتركة، وبوابة DM، ومساعدات الملفات/المسارات المحدودة بالجذر، والمحتوى الخارجي، وجمع الأسرار |
  | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF | مساعدات قائمة السماح بالمضيفين وسياسة الشبكات الخاصة |
  | `plugin-sdk/ssrf-runtime` | مساعدات وقت تشغيل SSRF | مساعدات المرسل المثبّت، والجلب المحروس، وسياسة SSRF |
  | `plugin-sdk/system-event-runtime` | مساعدات أحداث النظام | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | مساعدات Heartbeat | مساعدات إيقاظ Heartbeat، والأحداث، والرؤية |
  | `plugin-sdk/delivery-queue-runtime` | مساعدات طابور التسليم | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | مساعدات نشاط القناة | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | مساعدات إزالة التكرار | ذاكرات تخزين مؤقت لإزالة التكرار في الذاكرة ومدعومة بتخزين دائم |
  | `plugin-sdk/file-access-runtime` | مساعدات الوصول إلى الملفات | مساعدات آمنة لمسارات الملفات/الوسائط المحلية |
  | `plugin-sdk/transport-ready-runtime` | مساعدات جاهزية النقل | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | مساعدات سياسة موافقة exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | مساعدات ذاكرة تخزين مؤقت محدودة | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | مساعدات بوابة التشخيص | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | مساعدات تنسيق الأخطاء | `formatUncaughtError`, `isApprovalNotFoundError`، مساعدات رسم بياني للأخطاء |
  | `plugin-sdk/fetch-runtime` | مساعدات الجلب/الوكيل المغلّفة | `resolveFetch`، مساعدات الوكيل، مساعدات خيارات EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | مساعدات تطبيع المضيف | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | مساعدات إعادة المحاولة | `RetryConfig`, `retryAsync`، مشغّلات السياسة |
  | `plugin-sdk/allow-from` | تنسيق قائمة السماح وربط الإدخال | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | مساعدات بوابة الأوامر وسطح الأوامر | `resolveControlCommandGate`، مساعدات تفويض المرسل، مساعدات سجل الأوامر بما في ذلك تنسيق قائمة الوسائط الديناميكية |
  | `plugin-sdk/command-status` | عارضات حالة/مساعدة الأوامر | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تحليل إدخال الأسرار | مساعدات إدخال الأسرار |
  | `plugin-sdk/webhook-ingress` | مساعدات طلب Webhook | أدوات أهداف Webhook |
  | `plugin-sdk/webhook-request-guards` | مساعدات حراسة جسم Webhook | مساعدات قراءة/حد جسم الطلب |
  | `plugin-sdk/reply-runtime` | وقت تشغيل الرد المشترك | إرسال الوارد، وHeartbeat، ومخطط الرد، والتقسيم |
  | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة النطاق لإرسال الرد | الإنهاء، وإرسال المزوّد، ومساعدات تسمية المحادثة |
  | `plugin-sdk/reply-history` | مساعدات سجل الردود | `createChannelHistoryWindow`؛ صادرات توافق مهملة لمساعدات الخرائط مثل `buildPendingHistoryContextFromMap`، و`recordPendingHistoryEntry`، و`clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | تخطيط مرجع الرد | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | مساعدات تقسيم الرد | مساعدات تقسيم النص/markdown |
  | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسات | مساعدات مسار المخزن ووقت التحديث |
  | `plugin-sdk/state-paths` | مساعدات مسارات الحالة | مساعدات أدلة الحالة وOAuth |
  | `plugin-sdk/routing` | مساعدات التوجيه/مفتاح الجلسة | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, مساعدات تطبيع مفتاح الجلسة |
  | `plugin-sdk/status-helpers` | مساعدات حالة القناة | بناة ملخص حالة القناة/الحساب، افتراضيات حالة وقت التشغيل، ومساعدات بيانات تعريف المشكلات |
  | `plugin-sdk/target-resolver-runtime` | مساعدات محلل الهدف | مساعدات محلل الهدف المشتركة |
  | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع السلاسل النصية | مساعدات تطبيع السلاسل النصية/المعرّفات اللطيفة |
  | `plugin-sdk/request-url` | مساعدات عنوان URL للطلب | استخراج عناوين URL النصية من مدخلات شبيهة بالطلبات |
  | `plugin-sdk/run-command` | مساعدات الأوامر الموقوتة | مشغل أوامر موقوت مع مخرجات قياسية وأخطاء قياسية مطبعة |
  | `plugin-sdk/param-readers` | قارئات المعاملات | قارئات معاملات مشتركة للأداة/CLI |
  | `plugin-sdk/tool-payload` | استخراج حمولة الأداة | استخراج حمولات مطبعة من كائنات نتيجة الأداة |
  | `plugin-sdk/tool-send` | استخراج إرسال الأداة | استخراج حقول هدف الإرسال القياسية من وسائط الأداة |
  | `plugin-sdk/temp-path` | مساعدات المسار المؤقت | مساعدات مسار التنزيل المؤقت المشتركة |
  | `plugin-sdk/logging-core` | مساعدات التسجيل | مساعدات مسجل النظام الفرعي والتنقيح |
  | `plugin-sdk/markdown-table-runtime` | مساعدات جدول Markdown | مساعدات وضع جدول Markdown |
  | `plugin-sdk/reply-payload` | أنواع رد الرسائل | أنواع حمولة الرد |
  | `plugin-sdk/provider-setup` | مساعدات إعداد المزوّد المحلي/ذاتي الاستضافة المنسقة | مساعدات اكتشاف/تكوين المزوّد ذاتي الاستضافة |
  | `plugin-sdk/self-hosted-provider-setup` | مساعدات إعداد مركزة للمزوّد ذاتي الاستضافة المتوافق مع OpenAI | مساعدات اكتشاف/تكوين المزوّد ذاتي الاستضافة نفسها |
  | `plugin-sdk/provider-auth-runtime` | مساعدات مصادقة وقت تشغيل المزوّد | مساعدات حل مفتاح API في وقت التشغيل |
  | `plugin-sdk/provider-auth-api-key` | مساعدات إعداد مفتاح API للمزوّد | مساعدات التهيئة الأولية/كتابة الملف الشخصي لمفتاح API |
  | `plugin-sdk/provider-auth-result` | مساعدات نتيجة مصادقة المزوّد | باني نتيجة مصادقة OAuth قياسي |
  | `plugin-sdk/provider-selection-runtime` | مساعدات اختيار المزوّد | اختيار المزوّد المكوّن أو التلقائي ودمج تكوين المزوّد الخام |
  | `plugin-sdk/provider-env-vars` | مساعدات متغيرات بيئة المزوّد | مساعدات البحث عن متغيرات بيئة مصادقة المزوّد |
  | `plugin-sdk/provider-model-shared` | مساعدات مشتركة لنموذج/إعادة تشغيل المزوّد | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, بناة سياسة إعادة التشغيل المشتركة، مساعدات نقطة نهاية المزوّد، ومساعدات تطبيع معرّف النموذج |
  | `plugin-sdk/provider-catalog-shared` | مساعدات كتالوج المزوّد المشتركة | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | تصحيحات تهيئة المزوّد الأولية | مساعدات تكوين التهيئة الأولية |
  | `plugin-sdk/provider-http` | مساعدات HTTP للمزوّد | مساعدات عامة لقدرات HTTP/نقاط النهاية للمزوّد، بما في ذلك مساعدات نموذج الأجزاء المتعددة لتفريغ الصوت |
  | `plugin-sdk/provider-web-fetch` | مساعدات جلب الويب للمزوّد | مساعدات تسجيل/تخزين مؤقت لمزوّد جلب الويب |
  | `plugin-sdk/provider-web-search-config-contract` | مساعدات تكوين بحث الويب للمزوّد | مساعدات ضيقة لتكوين/اعتماد بحث الويب للمزوّدين الذين لا يحتاجون إلى توصيل تفعيل Plugin |
  | `plugin-sdk/provider-web-search-contract` | مساعدات عقد بحث الويب للمزوّد | مساعدات ضيقة لعقد تكوين/اعتماد بحث الويب مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, ومحددات/جالبات الاعتمادات محددة النطاق |
  | `plugin-sdk/provider-web-search` | مساعدات بحث الويب للمزوّد | مساعدات تسجيل/تخزين مؤقت/وقت تشغيل لمزوّد بحث الويب |
  | `plugin-sdk/provider-tools` | مساعدات توافق أداة/مخطط المزوّد | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, وتنظيف مخططات DeepSeek/Gemini/OpenAI + التشخيصات |
  | `plugin-sdk/provider-usage` | مساعدات استخدام المزوّد | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, ومساعدات أخرى لاستخدام المزوّد |
  | `plugin-sdk/provider-stream` | مساعدات مغلف دفق المزوّد | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, أنواع مغلفات الدفق، ومساعدات مغلفات Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot المشتركة |
  | `plugin-sdk/provider-transport-runtime` | مساعدات نقل المزوّد | مساعدات نقل المزوّد الأصلية مثل الجلب المحروس، واستخراج نص نتيجة الأداة، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
  | `plugin-sdk/keyed-async-queue` | طابور غير متزامن مرتب | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | مساعدات الوسائط المشتركة | مساعدات جلب/تحويل/تخزين الوسائط، وفحص أبعاد الفيديو المدعوم بـ ffprobe، وبناة حمولة الوسائط |
  | `plugin-sdk/media-generation-runtime` | مساعدات توليد الوسائط المشتركة | مساعدات تجاوز الفشل المشتركة، واختيار المرشحين، ورسائل النموذج المفقود لتوليد الصور/الفيديو/الموسيقى |
  | `plugin-sdk/media-understanding` | مساعدات فهم الوسائط | أنواع مزوّد فهم الوسائط إضافة إلى صادرات مساعدات الصور/الصوت الموجهة للمزوّد |
  | `plugin-sdk/text-runtime` | تصدير توافق نصي عريض مهمل | استخدم `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, و`logging-core` |
  | `plugin-sdk/text-chunking` | مساعدات تقطيع النص | مساعد تقطيع النص الصادر |
  | `plugin-sdk/speech` | مساعدات الكلام | أنواع مزوّد الكلام إضافة إلى مساعدات التوجيهات والسجل والتحقق الموجهة للمزوّد، وباني تحويل النص إلى كلام المتوافق مع OpenAI |
  | `plugin-sdk/speech-core` | نواة الكلام المشتركة | أنواع مزوّد الكلام، السجل، التوجيهات، التطبيع |
  | `plugin-sdk/realtime-transcription` | مساعدات التفريغ الفوري | أنواع المزوّد، مساعدات السجل، ومساعد جلسة WebSocket مشترك |
  | `plugin-sdk/realtime-voice` | مساعدات الصوت الفوري | أنواع المزوّد، مساعدات السجل/الحل، مساعدات جلسة الجسر، طوابير حديث الوكيل الخلفية المشتركة، التحكم الصوتي للتشغيل النشط، صحة النص/الحدث، منع الصدى، مطابقة أسئلة الاستشارة، تنسيق الاستشارة القسرية، تتبع سياق الدور، تتبع نشاط الإخراج، ومساعدات الاستشارة السريعة للسياق |
  | `plugin-sdk/image-generation` | مساعدات توليد الصور | أنواع مزوّد توليد الصور إضافة إلى مساعدات أصل الصورة/عنوان URL للبيانات وباني مزوّد الصور المتوافق مع OpenAI |
  | `plugin-sdk/image-generation-core` | نواة توليد الصور المشتركة | أنواع توليد الصور، تجاوز الفشل، المصادقة، ومساعدات السجل |
  | `plugin-sdk/music-generation` | مساعدات توليد الموسيقى | أنواع مزوّد/طلب/نتيجة توليد الموسيقى |
  | `plugin-sdk/music-generation-core` | نواة توليد الموسيقى المشتركة | أنواع توليد الموسيقى، مساعدات تجاوز الفشل، البحث عن المزوّد، وتحليل مرجع النموذج |
  | `plugin-sdk/video-generation` | مساعدات توليد الفيديو | أنواع مزوّد/طلب/نتيجة توليد الفيديو |
  | `plugin-sdk/video-generation-core` | نواة توليد الفيديو المشتركة | أنواع توليد الفيديو، مساعدات تجاوز الفشل، البحث عن المزوّد، وتحليل مرجع النموذج |
  | `plugin-sdk/interactive-runtime` | مساعدات الرد التفاعلي | تطبيع/اختزال حمولة الرد التفاعلي |
  | `plugin-sdk/channel-config-primitives` | بدائيات تكوين القناة | بدائيات ضيقة لمخطط تكوين القناة |
  | `plugin-sdk/channel-config-writes` | مساعدات كتابة تكوين القناة | مساعدات تفويض كتابة تكوين القناة |
  | `plugin-sdk/channel-plugin-common` | تمهيد القناة المشترك | صادرات تمهيد Plugin القناة المشتركة |
  | `plugin-sdk/channel-status` | مساعدات حالة القناة | مساعدات لقطة/ملخص حالة القناة المشتركة |
  | `plugin-sdk/allowlist-config-edit` | مساعدات تكوين قائمة السماح | مساعدات تعديل/قراءة تكوين قائمة السماح |
  | `plugin-sdk/group-access` | مساعدات وصول المجموعة | مساعدات قرار وصول المجموعة المشتركة |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | واجهات توافق مهملة | استخدم `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | مساعدات حراسة الرسائل المباشرة | مساعدات سياسة حراسة ضيقة قبل التشفير |
  | `plugin-sdk/extension-shared` | مساعدات الامتداد المشتركة | بدائيات مساعدات القناة السلبية/الحالة والوكيل المحيط |
  | `plugin-sdk/webhook-targets` | مساعدات هدف Webhook | سجل أهداف Webhook ومساعدات تثبيت المسارات |
  | `plugin-sdk/webhook-path` | اسم مستعار مهمل لمسار Webhook | استخدم `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | مساعدات وسائط الويب المشتركة | مساعدات تحميل الوسائط البعيدة/المحلية |
  | `plugin-sdk/zod` | إعادة تصدير توافق Zod مهملة | استورد `zod` من `zod` مباشرة |
  | `plugin-sdk/memory-core` | مساعدات نواة الذاكرة المضمنة | سطح مساعدات مدير الذاكرة/التكوين/الملف/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل محرك الذاكرة | واجهة وقت تشغيل فهرس/بحث الذاكرة |
  | `plugin-sdk/memory-core-host-embedding-registry` | سجل تضمين الذاكرة | مساعدات خفيفة لسجل مزوّد تضمين الذاكرة |
  | `plugin-sdk/memory-core-host-engine-foundation` | محرك أساس مضيف الذاكرة | صادرات محرك أساس مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-embeddings` | محرك تضمين مضيف الذاكرة | عقود تضمين الذاكرة، الوصول إلى السجل، المزوّد المحلي، ومساعدات الدُفعات/البُعد العامة؛ يعيش المزوّدون البعيدون الملموسون في Plugins المالكة لهم |
  | `plugin-sdk/memory-core-host-engine-qmd` | محرك QMD لمضيف الذاكرة | صادرات محرك QMD لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-storage` | محرك تخزين مضيف الذاكرة | صادرات محرك تخزين مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-multimodal` | مساعدات مضيف الذاكرة متعددة الوسائط | مساعدات مضيف الذاكرة متعددة الوسائط |
  | `plugin-sdk/memory-core-host-query` | مساعدات استعلام مضيف الذاكرة | مساعدات استعلام مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-secret` | مساعدات سر مضيف الذاكرة | مساعدات سر مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-events` | اسم مستعار مهمل لأحداث الذاكرة | استخدم `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة | مساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-cli` | وقت تشغيل CLI لمضيف الذاكرة | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-core` | وقت تشغيل نواة مضيف الذاكرة | مساعدات وقت تشغيل نواة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-files` | مساعدات ملف/وقت تشغيل مضيف الذاكرة | مساعدات ملف/وقت تشغيل مضيف الذاكرة |
  | `plugin-sdk/memory-host-core` | اسم مستعار لوقت تشغيل نواة مضيف الذاكرة | اسم مستعار محايد للمورّد لمساعدات وقت تشغيل نواة مضيف الذاكرة |
  | `plugin-sdk/memory-host-events` | اسم مستعار ليومية أحداث مضيف الذاكرة | اسم مستعار محايد للمورّد لمساعدات يومية أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-host-files` | اسم مستعار مهمل لملف/وقت تشغيل الذاكرة | استخدم `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | مساعدات Markdown مُدارة | مساعدات Markdown مُدارة مشتركة لـ Plugins المتاخمة للذاكرة |
  | `plugin-sdk/memory-host-search` | واجهة بحث Active Memory | واجهة وقت تشغيل كسولة لمدير بحث Active Memory |
  | `plugin-sdk/memory-host-status` | اسم مستعار مهمل لحالة مضيف الذاكرة | استخدم `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | أدوات الاختبار | برميل توافق مهمل محلي للمستودع؛ استخدم مسارات اختبار فرعية محلية مركزة للمستودع مثل `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, و`plugin-sdk/test-fixtures` |
</Accordion>

هذا الجدول هو عمدا مجموعة الترحيل المشتركة، وليس سطح SDK
الكامل. يوجد مخزون نقطة دخول المصرّف في
`scripts/lib/plugin-sdk-entrypoints.json`؛ وتُولَّد صادرات الحزمة من
المجموعة الفرعية العامة.

أُحيلت وصلات مساعد Plugin المضمّن المحجوزة إلى التقاعد من خريطة تصدير SDK
العامة، باستثناء واجهات التوافق الموثقة صراحة مثل طبقة التوافق المهملة
`plugin-sdk/discord` المحتفظ بها لحزمة
`@openclaw/discord@2026.3.13` المنشورة. توجد المساعدات الخاصة بالمالك داخل
حزمة Plugin المالكة؛ وينبغي أن ينتقل سلوك المضيف المشترك عبر عقود SDK
العامة مثل `plugin-sdk/gateway-runtime` و`plugin-sdk/security-runtime`
و`plugin-sdk/plugin-config-runtime`.

استخدم أضيق استيراد يطابق المهمة. إذا لم تتمكن من العثور على تصدير،
فافحص المصدر في `src/plugin-sdk/` أو اسأل المشرفين أي عقد عام
ينبغي أن يملكه.

## الإهمالات النشطة

إهمالات أضيق تنطبق عبر SDK الخاص بـ Plugin، وعقد المزوّد،
وسطح وقت التشغيل، والبيان. كل واحد منها ما زال يعمل اليوم، لكنه سيُزال
في إصدار رئيسي مستقبلي. يربط الإدخال أسفل كل عنصر API القديم ببديله
المعياري.

<AccordionGroup>
  <Accordion title="بناة مساعدة command-auth → command-status">
    **القديم (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **الجديد (`openclaw/plugin-sdk/command-status`)**: التواقيع نفسها،
    والصادرات نفسها - لكن مع الاستيراد من المسار الفرعي الأضيق. يعيد
    `command-auth` تصديرها كبدائل توافقية.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="مساعدات بوابة الإشارات → resolveInboundMentionDecision">
    **القديم**: `resolveInboundMentionRequirement({ facts, policy })` و
    `shouldDropInboundForMention(...)` من
    `openclaw/plugin-sdk/channel-inbound` أو
    `openclaw/plugin-sdk/channel-mention-gating`.

    **الجديد**: `resolveInboundMentionDecision({ facts, policy })` - يعيد
    كائن قرار واحدا بدلا من استدعاءين منفصلين.

    انتقلت Plugins القنوات اللاحقة (Slack وDiscord وMatrix وMS Teams) بالفعل.

  </Accordion>

  <Accordion title="طبقة توافق وقت تشغيل القناة ومساعدات إجراءات القناة">
    `openclaw/plugin-sdk/channel-runtime` هي طبقة توافق Plugins القنوات
    الأقدم. لا تستوردها من كود جديد؛ استخدم
    `openclaw/plugin-sdk/channel-runtime-context` لتسجيل كائنات وقت التشغيل.

    مساعدات `channelActions*` في `openclaw/plugin-sdk/channel-actions`
    مهملة إلى جانب صادرات القناة الخام "actions". اكشف القدرات عبر سطح
    `presentation` الدلالي بدلا من ذلك - تصرّح Plugins القنوات بما تعرضه
    (بطاقات، أزرار، قوائم اختيار) بدلا من أسماء الإجراءات الخام التي تقبلها.

  </Accordion>

  <Accordion title="مساعد tool() لمزوّد بحث الويب → createTool() على Plugin">
    **القديم**: مصنع `tool()` من `openclaw/plugin-sdk/provider-web-search`.

    **الجديد**: نفّذ `createTool(...)` مباشرة على Plugin المزوّد.
    لم يعد OpenClaw بحاجة إلى مساعد SDK لتسجيل غلاف الأداة.

  </Accordion>

  <Accordion title="مظاريف القناة النصية الصرفة → BodyForAgent">
    **القديم**: `formatInboundEnvelope(...)` (و
    `ChannelMessageForAgent.channelEnvelope`) لبناء مظروف موجّه نصي مسطح
    من رسائل القناة الواردة.

    **الجديد**: `BodyForAgent` إضافة إلى كتل سياق مستخدم مهيكلة. ترفق
    Plugins القنوات بيانات تعريف التوجيه (المحادثة، الموضوع، الرد على،
    التفاعلات) كحقول ذات أنواع بدلا من دمجها في سلسلة موجّه. ما زال مساعد
    `formatAgentEnvelope(...)` مدعوما للمظاريف المصطنعة المواجهة للمساعد،
    لكن المظاريف النصية الواردة في طريقها إلى الإزالة.

    المناطق المتأثرة: `inbound_claim` و`message_received` وأي Plugin قناة
    مخصص كان يعالج نص `channelEnvelope` لاحقا.

  </Accordion>

  <Accordion title="خطاف deactivate → gateway_stop">
    **القديم**: `api.on("deactivate", handler)`.

    **الجديد**: `api.on("gateway_stop", handler)`. الحدث والسياق هما عقد
    تنظيف إيقاف التشغيل نفسه؛ يتغير اسم الخطاف فقط.

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

    يبقى `deactivate` موصولا كاسم بديل توافقـي مهمل إلى ما بعد
    2026-08-16.

  </Accordion>

  <Accordion title="خطاف subagent_spawning → ربط المحادثة في النواة">
    **القديم**: `api.on("subagent_spawning", handler)` يعيد
    `threadBindingReady` أو `deliveryOrigin`.

    **الجديد**: دع النواة تجهز روابط الوكيل الفرعي `thread: true` عبر
    محوّل ربط جلسة القناة. استخدم `api.on("subagent_spawned", handler)`
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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` كأسطح توافقية
    مهملة فقط أثناء ترحيل Plugins الخارجية.

  </Accordion>

  <Accordion title="أنواع اكتشاف المزوّد → أنواع كتالوج المزوّد">
    أصبحت أربعة أسماء مستعارة لأنواع الاكتشاف أغلفة رقيقة فوق
    أنواع عصر الكتالوج:

    | الاسم المستعار القديم      | النوع الجديد              |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    إضافة إلى حاوية `ProviderCapabilities` الثابتة القديمة - ينبغي أن تستخدم
    Plugins المزوّد خطافات مزوّد صريحة مثل `buildReplayPolicy`
    و`normalizeToolSchemas` و`wrapStreamFn` بدلا من كائن ثابت.

  </Accordion>

  <Accordion title="خطافات سياسة التفكير → resolveThinkingProfile">
    **القديم** (ثلاثة خطافات منفصلة على `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)` و`supportsXHighThinking(ctx)` و
    `resolveDefaultThinkingLevel(ctx)`.

    **الجديد**: `resolveThinkingProfile(ctx)` واحد يعيد
    `ProviderThinkingProfile` مع `id` المعياري، و`label` اختياري،
    وقائمة مستويات مرتبة. يخفض OpenClaw القيم المخزنة القديمة تلقائيا
    حسب رتبة الملف الشخصي.

    يتضمن السياق `provider` و`modelId` و`reasoning` المدمج الاختياري،
    وحقائق `compat` للنموذج المدمجة الاختيارية. يمكن أن تستخدم Plugins
    المزوّد حقائق الكتالوج هذه لكشف ملف شخصي خاص بالنموذج فقط عندما يدعم
    عقد الطلب المكوّن ذلك.

    نفّذ خطافا واحدا بدلا من ثلاثة. تستمر الخطافات القديمة في العمل أثناء
    نافذة الإهمال، لكنها لا تُركّب مع نتيجة الملف الشخصي.

  </Accordion>

  <Accordion title="مزوّدو المصادقة الخارجيون → contracts.externalAuthProviders">
    **القديم**: تنفيذ خطافات مصادقة خارجية من دون التصريح بالمزوّد
    في بيان Plugin.

    **الجديد**: صرّح بـ `contracts.externalAuthProviders` في بيان Plugin
    **و** نفّذ `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="بحث متغيرات بيئة المزوّد → setup.providers[].envVars">
    **حقل البيان القديم**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **الجديد**: اعكس بحث متغير البيئة نفسه في `setup.providers[].envVars`
    على البيان. يدمج هذا بيانات تعريف بيئة الإعداد/الحالة في مكان واحد
    ويتجنب تشغيل وقت تشغيل Plugin لمجرد الإجابة عن عمليات بحث متغيرات البيئة.

    يبقى `providerAuthEnvVars` مدعوما عبر محوّل توافق إلى أن تُغلق
    نافذة الإهمال.

  </Accordion>

  <Accordion title="تسجيل Plugin الذاكرة → registerMemoryCapability">
    **القديم**: ثلاثة استدعاءات منفصلة -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **الجديد**: استدعاء واحد على API حالة الذاكرة -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    الخانات نفسها، واستدعاء تسجيل واحد. لا تتأثر مساعدات الموجّه والمتن
    الإضافية (`registerMemoryPromptSupplement` و`registerMemoryCorpusSupplement`).

  </Accordion>

  <Accordion title="API مزوّد تضمين الذاكرة">
    **القديم**: `api.registerMemoryEmbeddingProvider(...)` إضافة إلى
    `contracts.memoryEmbeddingProviders`.

    **الجديد**: `api.registerEmbeddingProvider(...)` إضافة إلى
    `contracts.embeddingProviders`.

    عقد مزوّد التضمين العام قابل لإعادة الاستخدام خارج الذاكرة، وهو المسار
    المدعوم للمزوّدين الجدد. تبقى API التسجيل الخاصة بالذاكرة موصولة كتوافق
    مهمل أثناء ترحيل المزوّدين الحاليين. تبلغ تقارير فحص Plugin عن الاستخدام
    غير المضمّن باعتباره دينا توافقيا.

  </Accordion>

  <Accordion title="إعادة تسمية أنواع رسائل جلسة الوكيل الفرعي">
    اسمان مستعاران قديمان للأنواع ما زالا مصدّرين من `src/plugins/runtime/types.ts`:

    | القديم                        | الجديد                         |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    طريقة وقت التشغيل `readSession` مهملة لصالح
    `getSessionMessages`. التوقيع نفسه؛ تستدعي الطريقة القديمة الطريقة
    الجديدة.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **القديم**: كان `runtime.tasks.flow` (بصيغة المفرد) يعيد موصل TaskFlow
    حيا.

    **الجديد**: يحتفظ `runtime.tasks.managedFlows` بوقت تشغيل طفرات TaskFlow
    المدارة من أجل Plugins التي تنشئ أو تحدث أو تلغي أو تشغل مهام فرعية
    من تدفق. استخدم `runtime.tasks.flows` عندما يحتاج Plugin فقط إلى قراءات
    مبنية على DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="مصانع الإضافات المضمّنة → وسيط نتائج أدوات الوكيل">
    مغطى في "كيفية الترحيل → رحّل إضافات نتائج الأدوات المضمّنة إلى
    وسيط" أعلاه. أُدرج هنا للاكتمال: مسار
    `api.registerEmbeddedExtensionFactory(...)` المحذوف والخاص بمشغّل التضمين
    فقط استُبدل بـ `api.registerAgentToolResultMiddleware(...)` مع قائمة
    وقت تشغيل صريحة في `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="الاسم المستعار OpenClawSchemaType → OpenClawConfig">
    أصبح `OpenClawSchemaType` المعاد تصديره من `openclaw/plugin-sdk`
    اسما مستعارا من سطر واحد لـ `OpenClawConfig`. فضّل الاسم المعياري.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
تُتتبع الإهمالات على مستوى الإضافة (داخل Plugins القنوات/المزوّدين المضمّنة
تحت `extensions/`) داخل براميل `api.ts` و`runtime-api.ts` الخاصة بها.
لا تؤثر في عقود Plugins التابعة لجهات خارجية، ولا تُدرج هنا. إذا كنت تستهلك
برميل Plugin مضمّن المحلي مباشرة، فاقرأ تعليقات الإهمال في ذلك البرميل قبل
الترقية.
</Note>

## الجدول الزمني للإزالة

| متى                    | ماذا يحدث                                                               |
| ---------------------- | ----------------------------------------------------------------------- |
| **الآن**               | تُصدر الواجهات المتقادمة تحذيرات وقت التشغيل                            |
| **الإصدار الرئيسي التالي** | ستُزال الواجهات المتقادمة؛ وستفشل plugins التي لا تزال تستخدمها |

تم ترحيل كل plugins الأساسية بالفعل. ينبغي أن ترحّل plugins الخارجية
قبل الإصدار الرئيسي التالي.

## إيقاف التحذيرات مؤقتًا

اضبط متغيرات البيئة هذه أثناء العمل على الترحيل:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

هذا مسار مؤقت لتجاوز المشكلة، وليس حلًا دائمًا.

## ذات صلة

- [بدء الاستخدام](/ar/plugins/building-plugins) - أنشئ أول plugin لك
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - مرجع كامل لاستيراد المسارات الفرعية
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) - بناء plugins القنوات
- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) - بناء plugins المزوّدين
- [داخليات Plugin](/ar/plugins/architecture) - تعمّق في البنية
- [بيان Plugin](/ar/plugins/manifest) - مرجع مخطط البيان
