---
read_when:
    - ترى تحذير OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - ترى تحذير OPENCLAW_EXTENSION_API_DEPRECATED
    - لقد استخدمت api.registerEmbeddedExtensionFactory قبل OpenClaw 2026.4.25
    - أنت تُحدّث Plugin إلى بنية Plugin الحديثة
    - أنت تصون مكوّنًا إضافيًا خارجيًا لـ OpenClaw
sidebarTitle: Migrate to SDK
summary: الانتقال من طبقة التوافق مع الإصدارات السابقة القديمة إلى SDK الحديث الخاص بـ Plugin
title: ترحيل حزمة تطوير برمجيات Plugin
x-i18n:
    generated_at: "2026-07-01T08:05:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f05bd42cc0a6fc53f6670377b4330bb452b2a06f4d0542a494875970ee81e08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

انتقل OpenClaw من طبقة واسعة للتوافق العكسي إلى معمارية Plugin حديثة
ذات استيرادات مركزة وموثقة. إذا كان Plugin الخاص بك قد بُني قبل
المعمارية الجديدة، فسيساعدك هذا الدليل على الترحيل.

## ما الذي يتغير

كان نظام Plugin القديم يوفر سطحين واسعين ومفتوحين يتيحان للـ Plugins استيراد
أي شيء تحتاجه من نقطة إدخال واحدة:

- **`openclaw/plugin-sdk/compat`** - استيراد واحد كان يعيد تصدير عشرات
  المساعدات. قُدّم لإبقاء الـ Plugins القديمة المعتمدة على الخطاطيف تعمل أثناء
  بناء معمارية Plugin الجديدة.
- **`openclaw/plugin-sdk/infra-runtime`** - حزمة واسعة لمساعدات وقت التشغيل
  كانت تمزج أحداث النظام، وحالة Heartbeat، وطوابير التسليم، ومساعدات fetch/proxy،
  ومساعدات الملفات، وأنواع الموافقة، وأدوات غير مرتبطة.
- **`openclaw/plugin-sdk/config-runtime`** - حزمة توافق واسعة للإعدادات
  لا تزال تحمل مساعدات التحميل/الكتابة المباشرة المهجورة أثناء نافذة الترحيل.
- **`openclaw/extension-api`** - جسر كان يمنح الـ Plugins وصولا مباشرا إلى
  مساعدات جانب المضيف مثل مشغل الوكيل المضمن.
- **`api.registerEmbeddedExtensionFactory(...)`** - خطاف امتداد مضمّن محذوف ومخصص
  فقط للمشغل المضمن كان يستطيع مراقبة أحداث المشغل المضمن مثل
  `tool_result`.

أصبحت أسطح الاستيراد الواسعة الآن **مهجورة**. لا تزال تعمل في وقت التشغيل،
لكن يجب ألا تستخدمها الـ Plugins الجديدة، وينبغي للـ Plugins القائمة الترحيل قبل
أن يزيلها الإصدار الرئيسي التالي. تمت إزالة API تسجيل مصنع الامتداد المخصص
للمشغل المضمن فقط؛ استخدم وسيط نتائج الأدوات بدلا من ذلك.

لا يزيل OpenClaw سلوك Plugin موثقا أو يعيد تفسيره في نفس
التغيير الذي يقدم بديلا. يجب أن تمر تغييرات العقود الكاسرة أولا
عبر محول توافق، وتشخيصات، ووثائق، ونافذة إهمال.
ينطبق ذلك على استيرادات SDK، وحقول البيان، وواجهات API للإعداد، والخطاطيف، وسلوك
التسجيل وقت التشغيل.

<Warning>
  ستُزال طبقة التوافق العكسي في إصدار رئيسي مستقبلي.
  ستتعطل الـ Plugins التي لا تزال تستورد من هذه الأسطح عند حدوث ذلك.
  لم تعد تسجيلات مصانع الامتدادات المضمنة القديمة تُحمّل بالفعل.
</Warning>

## لماذا تغير هذا

تسبب النهج القديم في مشكلات:

- **بدء تشغيل بطيء** - كان استيراد مساعد واحد يحمّل عشرات الوحدات غير المرتبطة
- **تبعيات دائرية** - جعلت إعادة التصدير الواسعة إنشاء دورات استيراد أمرا سهلا
- **سطح API غير واضح** - لم تكن هناك طريقة لمعرفة أي الصادرات مستقرة وأيها داخلي

يصلح SDK الحديث للـ Plugin ذلك: كل مسار استيراد (`openclaw/plugin-sdk/\<subpath\>`)
هو وحدة صغيرة ومكتفية بذاتها ذات غرض واضح وعقد موثق.

اختفت أيضا أسطح الراحة القديمة لموفري القنوات المضمنة.
كانت أسطح المساعدات ذات علامات القنوات اختصارات خاصة بمستودع أحادي، وليست
عقود Plugin مستقرة. استخدم بدلا منها مسارات SDK فرعية عامة وضيقة. داخل مساحة عمل
Plugin المضمنة، أبقِ المساعدات المملوكة للموفر في `api.ts` أو
`runtime-api.ts` الخاص بذلك Plugin.

أمثلة الموفرين المضمنين الحالية:

- يحتفظ Anthropic بمساعدات البث الخاصة بـ Claude في سطح `api.ts` /
  `contract-api.ts` الخاص به
- يحتفظ OpenAI ببناة الموفر، ومساعدات النموذج الافتراضي، وبناة موفر الوقت الحقيقي
  في `api.ts` الخاص به
- يحتفظ OpenRouter بباني الموفر ومساعدات الإعداد/التهيئة في
  `api.ts` الخاص به

## خطة ترحيل Talk والصوت في الوقت الحقيقي

ينتقل كود Talk الخاص بالصوت في الوقت الحقيقي، والاتصالات الهاتفية، والاجتماعات،
والمتصفح من مسك دفاتر الأدوار المحلي لكل سطح إلى متحكم مشترك في جلسات Talk
يصدّره `openclaw/plugin-sdk/realtime-voice`. يملك المتحكم الجديد غلاف أحداث Talk
المشترك، وحالة الدور النشط، وحالة الالتقاط، وحالة إخراج الصوت، وسجل الأحداث
الأخيرة، ورفض الأدوار القديمة. ينبغي أن تستمر Plugins الموفرين في امتلاك جلسات
الوقت الحقيقي الخاصة بالمورّد؛ وينبغي أن تستمر Plugins الأسطح في امتلاك خصوصيات
الالتقاط، والتشغيل، والاتصالات الهاتفية، والاجتماعات.

ترحيل Talk هذا كاسر ونظيف عمدا:

1. أبقِ بدائيات المتحكم/وقت التشغيل المشتركة في
   `plugin-sdk/realtime-voice`.
2. انقل الأسطح المضمنة إلى المتحكم المشترك: ترحيل المتصفح،
   وتسليم الغرفة المُدارة، ووقت الاتصال الصوتي الحقيقي، وSTT المتدفق للاتصال الصوتي، وGoogle
   Meet في الوقت الحقيقي، وميزة الضغط للتحدث الأصلية.
3. استبدل عائلات Talk RPC القديمة بواجهة API النهائية `talk.session.*` و
   `talk.client.*`.
4. أعلن عن قناة أحداث Talk حية واحدة في Gateway
   `hello-ok.features.events`: `talk.event`.
5. احذف نقطة نهاية HTTP القديمة للوقت الحقيقي وأي مسار لتجاوز التعليمات وقت الطلب.

ينبغي ألا يستدعي الكود الجديد `createTalkEventSequencer(...)` مباشرة إلا إذا كان
ينفذ محولا منخفض المستوى أو تجهيز اختبار. فضّل المتحكم المشترك
حتى لا يمكن إصدار أحداث ذات نطاق دور من دون معرف دور، ولا يمكن لاستدعاءات `turnEnd` /
`turnCancel` القديمة مسح دور نشط أحدث، وتبقى أحداث دورة حياة إخراج الصوت
متسقة عبر الاتصالات الهاتفية، والاجتماعات، وترحيل المتصفح، وتسليم الغرفة المُدارة،
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

تستخدم جلسات WebRTC/موفر-websocket المملوكة للمتصفح `talk.client.create`،
لأن المتصفح يملك تفاوض الموفر ونقل الوسائط بينما يملك
Gateway بيانات الاعتماد، والتعليمات، وسياسة الأدوات. `talk.session.*` هو
السطح المشترك المُدار بواسطة Gateway لوقت gateway-relay الحقيقي، ونسخ gateway-relay
الصوتي، وجلسات STT/TTS الأصلية للغرف المُدارة.

ينبغي إصلاح الإعدادات القديمة التي وضعت محددات الوقت الحقيقي بجانب `talk.provider` /
`talk.providers` باستخدام `openclaw doctor --fix`؛ لا يعيد Talk وقت التشغيل
تفسير إعداد موفر الكلام/TTS كإعداد موفر وقت حقيقي.

توليفات `talk.session.create` المدعومة صغيرة عمدا:

| الوضع            | النقل           | الدماغ          | المالك              | ملاحظات                                                                                                             |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | صوت موفر ثنائي الاتجاه بالكامل يجسر عبر Gateway؛ تُوجّه استدعاءات الأدوات عبر أداة agent-consult.                 |
| `transcription` | `gateway-relay` | `none`          | Gateway            | STT متدفق فقط؛ يرسل المستدعون صوت الإدخال ويتلقون أحداث النص المنسوخ.                                             |
| `stt-tts`       | `managed-room`  | `agent-consult` | غرفة أصلية/عميل    | غرف بنمط الضغط للتحدث واللاسلكي حيث يملك العميل الالتقاط/التشغيل ويملك Gateway حالة الدور.                       |
| `stt-tts`       | `managed-room`  | `direct-tools`  | غرفة أصلية/عميل    | وضع غرفة للمسؤولين فقط للأسطح الموثوقة من الطرف الأول التي تنفذ إجراءات أدوات Gateway مباشرة.                    |

خريطة الطرق المحذوفة:

| القديم                           | الجديد                                                   |
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

مفردات التحكم الموحدة ضيقة أيضا عن قصد:

  | الطريقة                          | ينطبق على                                              | العقد                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | إلحاق مقطع صوت PCM بترميز base64 بجلسة الموفّر المملوكة لاتصال Gateway نفسه.                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | بدء دور مستخدم في غرفة مُدارة.                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | إنهاء الدور النشط بعد التحقق من الدور المتقادم.                                                                                                                                         |
  | `talk.session.cancelTurn`       | كل الجلسات المملوكة لـ Gateway                              | إلغاء عمل الالتقاط/الموفّر/الوكيل/TTS النشط لدور ما.                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | إيقاف إخراج صوت المساعد من دون إنهاء دور المستخدم بالضرورة.                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | إكمال استدعاء أداة موفّر صادر من المرحّل؛ مرّر `options.willContinue` للإخراج المؤقت أو `options.suppressResponse` لتلبية الاستدعاء من دون استجابة مساعد أخرى. |
  | `talk.session.steer`            | جلسات Talk المدعومة بوكيل                              | إرسال تحكم منطوق `status` أو `steer` أو `cancel` أو `followup` إلى التشغيل المضمّن النشط الذي تم حله من جلسة Talk.                                                                |
  | `talk.session.close`            | كل الجلسات الموحّدة                                    | إيقاف جلسات المرحّل أو إبطال حالة الغرفة المُدارة، ثم نسيان معرّف الجلسة الموحّدة.                                                                                                    |

  لا تضف حالات خاصة بالموفّر أو المنصة في النواة لإنجاح ذلك.
  النواة تملك دلالات جلسات Talk. وتملك Plugins الموفّر إعداد جلسات البائع.
  وتملك المكالمات الصوتية وGoogle Meet محوّلات الاتصال الهاتفي/الاجتماعات. وتملك المتصفحات والتطبيقات الأصلية
  تجربة المستخدم لالتقاط/تشغيل الجهاز.

  ## سياسة التوافق

  بالنسبة إلى Plugins الخارجية، يتبع عمل التوافق هذا الترتيب:

  1. إضافة العقد الجديد
  2. إبقاء السلوك القديم موصولًا عبر محوّل توافق
  3. إصدار تشخيص أو تحذير يذكر المسار القديم والبديل
  4. تغطية كلا المسارين في الاختبارات
  5. توثيق الإيقاف التدريجي ومسار الترحيل
  6. الإزالة فقط بعد نافذة الترحيل المعلنة، وعادةً في إصدار رئيسي

  يمكن للمشرفين تدقيق قائمة انتظار الترحيل الحالية باستخدام
  `pnpm plugins:boundary-report`. استخدم `pnpm plugins:boundary-report:summary` من أجل
  أعداد موجزة، و`--owner <id>` من أجل Plugin واحدة أو مالك توافق واحد، و
  `pnpm plugins:boundary-report:ci` عندما يجب أن تفشل بوابة CI بسبب سجلات توافق
  مستحقة، أو استيرادات SDK محجوزة عابرة للمالكين، أو مسارات SDK فرعية محجوزة غير مستخدمة.
  يجمع التقرير سجلات التوافق المهملة
  حسب تاريخ الإزالة، ويعد مراجع الكود/المستندات المحلية،
  ويعرض استيرادات SDK المحجوزة العابرة للمالكين، ويلخص جسر SDK الخاص
  بمضيف الذاكرة حتى يبقى تنظيف التوافق صريحًا بدلًا من
  الاعتماد على عمليات بحث ارتجالية. يجب أن يكون للمسارات الفرعية المحجوزة في SDK استخدام مالك متتبّع؛
  ويجب إزالة صادرات المساعدين المحجوزة غير المستخدمة من SDK العام.

  إذا كان حقل manifest ما يزال مقبولًا، فيمكن لمؤلفي Plugins الاستمرار في استخدامه إلى أن
  تقول المستندات والتشخيصات خلاف ذلك. يجب أن تفضّل الشيفرة الجديدة
  البديل الموثق، لكن يجب ألا تتعطل Plugins الحالية أثناء الإصدارات
  الثانوية العادية.

  ## كيفية الترحيل

  <Steps>
  <Step title="ترحيل مساعدات تحميل/كتابة إعدادات وقت التشغيل">
    يجب أن تتوقف Plugins المضمّنة عن استدعاء
    `api.runtime.config.loadConfig()` و
    `api.runtime.config.writeConfigFile(...)` مباشرةً. فضّل الإعدادات التي كانت
    قد مُرّرت بالفعل إلى مسار الاستدعاء النشط. يمكن للمعالجات طويلة العمر التي تحتاج إلى
    لقطة العملية الحالية استخدام `api.runtime.config.current()`. ويجب أن تستخدم
    أدوات الوكيل طويلة العمر `ctx.getRuntimeConfig()` الخاصة بسياق الأداة داخل
    `execute` حتى تظل الأداة التي أُنشئت قبل كتابة إعدادات ترى
    إعدادات وقت التشغيل المُحدّثة.

    يجب أن تمر كتابات الإعدادات عبر المساعدات التعاملية وأن تختار
    سياسة ما بعد الكتابة:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    استخدم `afterWrite: { mode: "restart", reason: "..." }` عندما يعرف المستدعي أن
    التغيير يتطلب إعادة تشغيل Gateway نظيفة، و
    `afterWrite: { mode: "none", reason: "..." }` فقط عندما يملك المستدعي
    المتابعة ويريد عمدًا كتم مخطط إعادة التحميل.
    تتضمن نتائج التعديل ملخص `followUp` مضبوط الأنواع للاختبارات والتسجيل؛
    ويظل Gateway مسؤولًا عن تطبيق إعادة التشغيل أو جدولتها.
    يظل `loadConfig` و`writeConfigFile` كمساعدات توافق
    مهملة لـ Plugins الخارجية أثناء نافذة الترحيل، ويحذران مرة واحدة باستخدام
    رمز التوافق `runtime-config-load-write`. تتم حماية Plugins المضمّنة وشيفرة
    وقت تشغيل المستودع بواسطة حواجز الماسح في
    `pnpm check:deprecated-api-usage` و
    `pnpm check:no-runtime-action-load-config`: يفشل استخدام Plugin الإنتاجي الجديد
    مباشرةً، وتفشل كتابات الإعدادات المباشرة، ويجب أن تستخدم طرق خادم Gateway
    لقطة وقت تشغيل الطلب، ويجب أن تتلقى مساعدات إرسال/إجراء/عميل قناة وقت التشغيل
    الإعدادات من حدّها، ولا يُسمح لوحدات وقت التشغيل طويلة العمر بأي
    استدعاءات محيطة لـ `loadConfig()`.

    يجب أن تتجنب شيفرة Plugin الجديدة أيضًا استيراد البرميل التوافقي العريض
    `openclaw/plugin-sdk/config-runtime`. استخدم المسار الفرعي الضيق في
    SDK الذي يطابق المهمة:

    | الحاجة | الاستيراد |
    | --- | --- |
    | أنواع الإعدادات مثل `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | تأكيدات الإعدادات المحمّلة مسبقًا والبحث عن إعدادات مدخل Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | قراءات لقطة وقت التشغيل الحالية | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | كتابات الإعدادات | `openclaw/plugin-sdk/config-mutation` |
    | مساعدات مخزن الجلسات | `openclaw/plugin-sdk/session-store-runtime` |
    | إعدادات جدول Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | مساعدات وقت تشغيل سياسة المجموعة | `openclaw/plugin-sdk/runtime-group-policy` |
    | حل إدخال السر | `openclaw/plugin-sdk/secret-input-runtime` |
    | تجاوزات النموذج/الجلسة | `openclaw/plugin-sdk/model-session-runtime` |

    تتم حماية Plugins المضمّنة واختباراتها بالماسح ضد البرميل العريض
    حتى تبقى الاستيرادات والمحاكيات محلية للسلوك الذي تحتاجه. ما يزال البرميل العريض
    موجودًا للتوافق الخارجي، لكن يجب ألا تعتمد عليه الشيفرة الجديدة.

  </Step>

  <Step title="ترحيل امتدادات نتائج الأدوات المضمّنة إلى middleware">
    يجب أن تستبدل Plugins المضمّنة معالجات نتائج الأدوات الخاصة بالمشغّل المضمّن فقط
    `api.registerEmbeddedExtensionFactory(...)` بـ middleware محايد لوقت التشغيل.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    حدّث manifest الخاص بـ Plugin في الوقت نفسه:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    يمكن لـ Plugins المثبتة أيضًا تسجيل middleware لنتائج الأدوات عندما تكون
    ممكّنة صراحةً وتعلن كل وقت تشغيل مستهدف في
    `contracts.agentToolResultMiddleware`. يتم رفض تسجيلات middleware المثبتة
    غير المعلنة.

  </Step>

  <Step title="ترحيل المعالجات الأصلية للموافقات إلى حقائق القدرات">
    تعرض Plugins القنوات القادرة على الموافقة الآن سلوك الموافقة الأصلي عبر
    `approvalCapability.nativeRuntime` بالإضافة إلى سجل سياق وقت التشغيل المشترك.

    التغييرات الأساسية:

    - استبدل `approvalCapability.handler.loadRuntime(...)` بـ
      `approvalCapability.nativeRuntime`
    - انقل المصادقة/التسليم الخاصين بالموافقة من توصيل `plugin.auth` /
      `plugin.approvals` القديم إلى `approvalCapability`
    - أُزيل `ChannelPlugin.approvals` من عقد Plugin القناة العام؛
      انقل حقول التسليم/الأصلي/العرض إلى `approvalCapability`
    - يظل `plugin.auth` لتدفقات تسجيل الدخول/الخروج للقناة فقط؛ لم تعد خطافات
      مصادقة الموافقة هناك تُقرأ بواسطة النواة
    - سجّل كائنات وقت التشغيل المملوكة للقناة مثل العملاء أو الرموز أو تطبيقات Bolt
      عبر `openclaw/plugin-sdk/channel-runtime-context`
    - لا ترسل إشعارات إعادة توجيه مملوكة لـ Plugin من معالجات الموافقة الأصلية؛
      تملك النواة الآن إشعارات التوجيه إلى مكان آخر من نتائج التسليم الفعلية
    - عند تمرير `channelRuntime` إلى `createChannelManager(...)`، وفّر
      سطح `createPluginRuntime().channel` حقيقيًا. تُرفض البدائل الجزئية.

    راجع `/plugins/sdk-channel-plugins` للاطلاع على تخطيط قدرة الموافقة الحالي.

  </Step>

  <Step title="تدقيق سلوك احتياط غلاف Windows">
    إذا كانت Plugin الخاصة بك تستخدم `openclaw/plugin-sdk/windows-spawn`، فإن أغلفة Windows
    `.cmd`/`.bat` غير المحلولة تفشل الآن بصورة مغلقة ما لم تمرر صراحةً
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

    إذا كان المستدعي لديك لا يعتمد عمدًا على احتياط الصدفة، فلا تضبط
    `allowShellFallback` وتعامل مع الخطأ المطروح بدلًا من ذلك.

  </Step>

  <Step title="العثور على الاستيرادات المهملة">
    ابحث في Plugin الخاصة بك عن الاستيرادات من أي من السطحين المهملين:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="الاستبدال باستيرادات مركّزة">
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
    لكن يجب أن تستورد الشيفرة الجديدة سطح المساعدات المركّز الذي تحتاجه فعليًا:

    | الحاجة | الاستيراد |
    | --- | --- |
    | مساعدات قائمة انتظار أحداث النظام | `openclaw/plugin-sdk/system-event-runtime` |
    | مساعدات إيقاظ Heartbeat والأحداث والرؤية | `openclaw/plugin-sdk/heartbeat-runtime` |
    | تفريغ قائمة انتظار التسليم المعلّق | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | قياسات نشاط القناة | `openclaw/plugin-sdk/channel-activity-runtime` |
    | ذاكرات التخزين المؤقت لإزالة التكرار داخل الذاكرة | `openclaw/plugin-sdk/dedupe-runtime` |
    | مساعدات آمنة لمسارات الملفات/الوسائط المحلية | `openclaw/plugin-sdk/file-access-runtime` |
    | جلب مدرك للموزّع | `openclaw/plugin-sdk/runtime-fetch` |
    | مساعدات الوكيل والجلب المحمي | `openclaw/plugin-sdk/fetch-runtime` |
    | أنواع سياسة موزّع SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | أنواع طلب/حل الموافقة | `openclaw/plugin-sdk/approval-runtime` |
    | مساعدات حمولة رد الموافقة والأوامر | `openclaw/plugin-sdk/approval-reply-runtime` |
    | مساعدات تنسيق الأخطاء | `openclaw/plugin-sdk/error-runtime` |
    | انتظار جاهزية النقل | `openclaw/plugin-sdk/transport-ready-runtime` |
    | مساعدات الرموز الآمنة | `openclaw/plugin-sdk/secure-random-runtime` |
    | تزامن محدود للمهام غير المتزامنة | `openclaw/plugin-sdk/concurrency-runtime` |
    | الإكراه الرقمي | `openclaw/plugin-sdk/number-runtime` |
    | قفل غير متزامن محلي للعملية | `openclaw/plugin-sdk/async-lock-runtime` |
    | أقفال الملفات | `openclaw/plugin-sdk/file-lock` |

    تخضع الإضافات المضمّنة لحراسة ماسح ضد `infra-runtime`، لذلك لا يمكن
    لشيفرة المستودع أن تتراجع إلى البرميل الواسع.

  </Step>

  <Step title="Migrate channel route helpers">
    يجب أن تستخدم شيفرة مسارات القنوات الجديدة `openclaw/plugin-sdk/channel-route`.
    تبقى أسماء route-key وcomparable-target الأقدم كأسماء مستعارة للتوافق
    خلال نافذة الترحيل، لكن يجب أن تستخدم الإضافات الجديدة أسماء المسارات
    التي تصف السلوك مباشرة:

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
    هذه الخطافات مهملة وتبقى فقط للإضافات الأقدم خلال نافذة الترحيل. يجب أن
    تستخدم إضافات القنوات الجديدة
    `messaging.targetResolver.resolveTarget(...)` لتطبيع معرّف الهدف
    والرجوع عند عدم العثور في الدليل، و`messaging.inferTargetChatType(...)` عندما
    يحتاج النواة إلى نوع النظير مبكرًا، و`messaging.resolveOutboundSessionRoute(...)`
    لهوية الجلسة والخيط الأصلية لدى المزوّد.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## مرجع مسار الاستيراد

  <Accordion title="Common import path table">
  | مسار الاستيراد | الغرض | الصادرات الرئيسية |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | مساعد إدخال Plugin القانوني | `definePluginEntry` |
  | `plugin-sdk/core` | إعادة تصدير شاملة قديمة لتعريفات/بناة إدخال القنوات | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | تصدير مخطط التكوين الجذري | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | مساعد إدخال لمزوّد واحد | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعريفات وبناة إدخال قنوات مركّزة | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | مساعدو معالج الإعداد المشتركون | مترجم الإعداد، مطالبات قائمة السماح، بناة حالة الإعداد |
  | `plugin-sdk/setup-runtime` | مساعدو وقت تشغيل أثناء الإعداد | `createSetupTranslator`, محولات تصحيح إعداد آمنة للاستيراد، مساعدو ملاحظات البحث، `promptResolvedAllowFrom`, `splitSetupEntries`, وكلاء إعداد مفوضون |
  | `plugin-sdk/setup-adapter-runtime` | اسم مستعار مهمل لمحول الإعداد | استخدم `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | مساعدو أدوات الإعداد | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | مساعدو الحسابات المتعددة | مساعدو قائمة الحسابات/التكوين/بوابة الإجراءات |
  | `plugin-sdk/account-id` | مساعدو معرّف الحساب | `DEFAULT_ACCOUNT_ID`, تسوية معرّف الحساب |
  | `plugin-sdk/account-resolution` | مساعدو البحث عن الحساب | مساعدو البحث عن الحساب والرجوع الافتراضي الاحتياطي |
  | `plugin-sdk/account-helpers` | مساعدو حسابات محدودو النطاق | مساعدو قائمة الحسابات/إجراءات الحساب |
  | `plugin-sdk/channel-setup` | محولات معالج الإعداد | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | بدائيات إقران الرسائل المباشرة | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | توصيل بادئة الرد، ومؤشر الكتابة، وتسليم المصدر | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | مصانع محولات التكوين ومساعدو الوصول إلى الرسائل المباشرة | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | بناة مخطط التكوين | بدائيات مخطط تكوين القنوات المشتركة والباني العام فقط |
  | `plugin-sdk/bundled-channel-config-schema` | مخططات التكوين المضمّنة | Plugins المضمّنة التي يصونها OpenClaw فقط؛ يجب أن تعرّف Plugins الجديدة مخططات محلية للـPlugin |
  | `plugin-sdk/channel-config-schema-legacy` | مخططات تكوين مضمّنة مهملة | اسم مستعار للتوافق فقط؛ استخدم `plugin-sdk/bundled-channel-config-schema` للـPlugins المضمّنة المصانة |
  | `plugin-sdk/telegram-command-config` | مساعدو تكوين أوامر Telegram | تسوية أسماء الأوامر، تقليم الأوصاف، التحقق من التكرارات/التعارضات |
  | `plugin-sdk/channel-policy` | حل سياسات المجموعات/الرسائل المباشرة | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | واجهة توافق مهملة | استخدم `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | مساعدو المغلفات الواردة | مساعدو المسارات المشتركة وبناء المغلفات |
  | `plugin-sdk/channel-inbound` | مساعدو الاستلام الوارد | بناء السياق، والتنسيق، والجذور، والمشغّلات، وإرسال الردود المجهّزة، ومسندات الإرسال |
  | `plugin-sdk/messaging-targets` | مسار استيراد مهمل لتحليل الأهداف | استخدم `plugin-sdk/channel-targets` لمساعدي تحليل الأهداف العامة، و`plugin-sdk/channel-route` لمقارنة المسارات، و`messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` المملوكين للـPlugin لحل الأهداف الخاصة بالمزوّد |
  | `plugin-sdk/outbound-media` | مساعدو الوسائط الصادرة | تحميل الوسائط الصادرة المشتركة |
  | `plugin-sdk/outbound-send-deps` | واجهة توافق مهملة | استخدم `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | مساعدو دورة حياة الرسائل الصادرة | محولات الرسائل، والإيصالات، ومساعدو الإرسال الدائم، ومساعدو المعاينة المباشرة/البث، وخيارات الرد، ومساعدو دورة الحياة، وهوية الصادر، وتخطيط الحمولة |
  | `plugin-sdk/channel-streaming` | واجهة توافق مهملة | استخدم `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | واجهة توافق مهملة | استخدم `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | مساعدو ربط السلاسل | مساعدو دورة حياة ربط السلاسل ومحولاتها |
  | `plugin-sdk/agent-media-payload` | مساعدو حمولات الوسائط القديمة | باني حمولات وسائط الوكيل لتخطيطات الحقول القديمة |
  | `plugin-sdk/channel-runtime` | طبقة توافق مهملة | أدوات وقت تشغيل القنوات القديمة فقط |
  | `plugin-sdk/channel-send-result` | أنواع نتائج الإرسال | أنواع نتائج الرد |
  | `plugin-sdk/runtime-store` | تخزين Plugin دائم | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | مساعدو وقت تشغيل واسعو النطاق | مساعدو وقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
  | `plugin-sdk/runtime-env` | مساعدو بيئة وقت تشغيل محدودو النطاق | مساعدو المسجّل/بيئة وقت التشغيل، والمهلة، وإعادة المحاولة، والتراجع |
  | `plugin-sdk/plugin-runtime` | مساعدو وقت تشغيل Plugin المشتركون | مساعدو أوامر/خطافات/http/تفاعلية للـPlugin |
  | `plugin-sdk/hook-runtime` | مساعدو مسار الخطافات | مساعدو مسار خطافات Webhook/داخلية مشتركة |
  | `plugin-sdk/lazy-runtime` | مساعدو وقت التشغيل الكسول | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | مساعدو العمليات | مساعدو تنفيذ مشتركون |
  | `plugin-sdk/cli-runtime` | مساعدو وقت تشغيل CLI | تنسيق الأوامر، والانتظارات، ومساعدو الإصدارات |
  | `plugin-sdk/gateway-runtime` | مساعدو Gateway | عميل Gateway، ومساعد بدء جاهز لحلقة الأحداث، ومساعدو تصحيح حالة القناة |
  | `plugin-sdk/config-runtime` | طبقة توافق تكوين مهملة | فضّل `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, و`config-mutation` |
  | `plugin-sdk/telegram-command-config` | مساعدو أوامر Telegram | مساعدو تحقق من أوامر Telegram مستقرون مع الاحتياط عند عدم توفر سطح عقد Telegram المضمّن |
  | `plugin-sdk/approval-runtime` | مساعدو مطالبات الموافقة | حمولة موافقة التنفيذ/Plugin، ومساعدو قدرة/ملف الموافقة، ومساعدو توجيه/وقت تشغيل الموافقات الأصلية، وتنسيق مسار عرض الموافقة المنظم |
  | `plugin-sdk/approval-auth-runtime` | مساعدو تفويض الموافقة | حل المعتمد، وتفويض الإجراء في المحادثة نفسها |
  | `plugin-sdk/approval-client-runtime` | مساعدو عميل الموافقة | مساعدو ملف/مرشح موافقة التنفيذ الأصلية |
  | `plugin-sdk/approval-delivery-runtime` | مساعدو تسليم الموافقة | محولات قدرة/تسليم الموافقة الأصلية |
  | `plugin-sdk/approval-gateway-runtime` | مساعدو Gateway للموافقة | مساعد مشترك لحل Gateway الموافقة |
  | `plugin-sdk/approval-handler-adapter-runtime` | مساعدو محولات الموافقة | مساعدو تحميل خفيف لمحولات الموافقة الأصلية لنقاط إدخال القنوات الساخنة |
  | `plugin-sdk/approval-handler-runtime` | مساعدو معالجات الموافقة | مساعدو وقت تشغيل أوسع لمعالجات الموافقة؛ فضّل واجهات المحول/Gateway الأضيق عندما تكفي |
  | `plugin-sdk/approval-native-runtime` | مساعدو أهداف الموافقة | مساعدو ربط هدف/حساب الموافقة الأصلية |
  | `plugin-sdk/approval-reply-runtime` | مساعدو رد الموافقة | مساعدو حمولة رد موافقة التنفيذ/Plugin |
  | `plugin-sdk/channel-runtime-context` | مساعدو سياق وقت تشغيل القناة | مساعدو تسجيل/جلب/مراقبة سياق وقت تشغيل القناة العام |
  | `plugin-sdk/security-runtime` | مساعدو الأمان | مساعدو الثقة المشتركة، وبوابة الرسائل المباشرة، ومساعدو الملفات/المسارات المحدودة بالجذر، والمحتوى الخارجي، وجمع الأسرار |
  | `plugin-sdk/ssrf-policy` | مساعدو سياسة SSRF | مساعدو قائمة السماح للمضيف وسياسة الشبكات الخاصة |
  | `plugin-sdk/ssrf-runtime` | مساعدو وقت تشغيل SSRF | موزّع مثبت، وجلب محمي، ومساعدو سياسة SSRF |
  | `plugin-sdk/system-event-runtime` | مساعدو أحداث النظام | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | مساعدو Heartbeat | مساعدو إيقاظ Heartbeat، والحدث، والرؤية |
  | `plugin-sdk/delivery-queue-runtime` | مساعدو طابور التسليم | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | مساعدو نشاط القناة | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | مساعدو إزالة التكرار | مخازن مؤقتة لإزالة التكرار داخل الذاكرة |
  | `plugin-sdk/file-access-runtime` | مساعدو الوصول إلى الملفات | مساعدو مسارات ملفات/وسائط محلية آمنة |
  | `plugin-sdk/transport-ready-runtime` | مساعدو جاهزية النقل | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | مساعدو سياسة موافقة التنفيذ | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | مساعدو ذاكرة تخزين مؤقت محدودة | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | مساعدو بوابة التشخيص | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | مساعدو تنسيق الأخطاء | `formatUncaughtError`, `isApprovalNotFoundError`, ومساعدو رسم الأخطاء |
  | `plugin-sdk/fetch-runtime` | مساعدو الجلب/الوكيل المغلّف | `resolveFetch`, ومساعدو الوكيل، ومساعدو خيارات EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | مساعدو تسوية المضيف | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | مساعدو إعادة المحاولة | `RetryConfig`, `retryAsync`, ومشغّلات السياسات |
  | `plugin-sdk/allow-from` | تنسيق قائمة السماح وربط الإدخال | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | بوابة الأوامر ومساعدو سطح الأوامر | `resolveControlCommandGate`, ومساعدو تفويض المرسِل، ومساعدو سجل الأوامر بما في ذلك تنسيق قائمة الوسائط الديناميكية |
  | `plugin-sdk/command-status` | عارضو حالة/مساعدة الأوامر | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تحليل إدخال الأسرار | مساعدو إدخال الأسرار |
  | `plugin-sdk/webhook-ingress` | مساعدو طلب Webhook | أدوات هدف Webhook |
  | `plugin-sdk/webhook-request-guards` | مساعدو حراسة جسم Webhook | مساعدو قراءة/حد جسم الطلب |
  | `plugin-sdk/reply-runtime` | وقت تشغيل الرد المشترك | الإرسال الوارد، Heartbeat، مخطط الرد، التقسيم |
  | `plugin-sdk/reply-dispatch-runtime` | مساعدو إرسال الرد محدودو النطاق | الإنهاء، وإرسال المزوّد، ومساعدو تسميات المحادثة |
  | `plugin-sdk/reply-history` | مساعدو سجل الردود | `createChannelHistoryWindow`؛ صادرات توافق مهملة لمساعدي الخرائط مثل `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, و`clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | تخطيط مرجع الرد | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | مساعدو تقسيم الرد | مساعدو تقسيم النص/markdown |
  | `plugin-sdk/session-store-runtime` | مساعدو مخزن الجلسات | مساعدو مسار المخزن والتحديث في |
  | `plugin-sdk/state-paths` | مساعدو مسارات الحالة | مساعدو أدلة الحالة وOAuth |
  | `plugin-sdk/routing` | أدوات مساعدة للتوجيه/مفتاح الجلسة | `resolveAgentRoute`، `buildAgentSessionKey`، `resolveDefaultAgentBoundAccountId`، أدوات مساعدة لتطبيع مفتاح الجلسة |
  | `plugin-sdk/status-helpers` | أدوات مساعدة لحالة القناة | منشئات ملخص حالة القناة/الحساب، افتراضيات حالة وقت التشغيل، أدوات مساعدة لبيانات تعريف المشكلة |
  | `plugin-sdk/target-resolver-runtime` | أدوات مساعدة لمحلل الهدف | أدوات مساعدة مشتركة لمحلل الهدف |
  | `plugin-sdk/string-normalization-runtime` | أدوات مساعدة لتطبيع السلاسل | أدوات مساعدة لتطبيع المعرفات النصية/السلاسل |
  | `plugin-sdk/request-url` | أدوات مساعدة لعنوان URL للطلب | استخراج عناوين URL النصية من مدخلات شبيهة بالطلبات |
  | `plugin-sdk/run-command` | أدوات مساعدة للأوامر المؤقتة | مشغل أوامر مؤقت مع stdout/stderr مطبعين |
  | `plugin-sdk/param-readers` | قارئات المعاملات | قارئات معاملات مشتركة للأداة/CLI |
  | `plugin-sdk/tool-payload` | استخراج حمولة الأداة | استخراج حمولات مطبعة من كائنات نتائج الأدوات |
  | `plugin-sdk/tool-send` | استخراج إرسال الأداة | استخراج حقول هدف الإرسال القياسية من وسائط الأداة |
  | `plugin-sdk/temp-path` | أدوات مساعدة للمسار المؤقت | أدوات مساعدة مشتركة لمسار التنزيل المؤقت |
  | `plugin-sdk/logging-core` | أدوات مساعدة للتسجيل | مسجل النظام الفرعي وأدوات مساعدة للتنقيح |
  | `plugin-sdk/markdown-table-runtime` | أدوات مساعدة لجداول Markdown | أدوات مساعدة لوضع جدول Markdown |
  | `plugin-sdk/reply-payload` | أنواع الرد على الرسائل | أنواع حمولة الرد |
  | `plugin-sdk/provider-setup` | أدوات مساعدة منتقاة لإعداد مزود محلي/مستضاف ذاتيا | أدوات مساعدة لاكتشاف/تكوين المزود المستضاف ذاتيا |
  | `plugin-sdk/self-hosted-provider-setup` | أدوات مساعدة مركزة لإعداد مزود مستضاف ذاتيا ومتوافق مع OpenAI | أدوات مساعدة الاكتشاف/التكوين نفسها للمزود المستضاف ذاتيا |
  | `plugin-sdk/provider-auth-runtime` | أدوات مساعدة لمصادقة المزود وقت التشغيل | أدوات مساعدة لحل مفتاح API وقت التشغيل |
  | `plugin-sdk/provider-auth-api-key` | أدوات مساعدة لإعداد مفتاح API للمزود | أدوات مساعدة لتهيئة مفتاح API وكتابة الملف الشخصي |
  | `plugin-sdk/provider-auth-result` | أدوات مساعدة لنتيجة مصادقة المزود | منشئ قياسي لنتيجة مصادقة OAuth |
  | `plugin-sdk/provider-selection-runtime` | أدوات مساعدة لاختيار المزود | اختيار مزود مكون أو تلقائي ودمج تكوين المزود الخام |
  | `plugin-sdk/provider-env-vars` | أدوات مساعدة لمتغيرات بيئة المزود | أدوات مساعدة للبحث عن متغير بيئة مصادقة المزود |
  | `plugin-sdk/provider-model-shared` | أدوات مساعدة مشتركة لنموذج المزود/إعادة التشغيل | `ProviderReplayFamily`، `buildProviderReplayFamilyHooks`، `normalizeModelCompat`، منشئات سياسة إعادة التشغيل المشتركة، أدوات مساعدة لنقطة نهاية المزود، وأدوات مساعدة لتطبيع معرف النموذج |
  | `plugin-sdk/provider-catalog-shared` | أدوات مساعدة مشتركة لفهرس المزود | `findCatalogTemplate`، `buildSingleProviderApiKeyCatalog`، `buildManifestModelProviderConfig`، `supportsNativeStreamingUsageCompat`، `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | تصحيحات تهيئة المزود | أدوات مساعدة لتكوين التهيئة |
  | `plugin-sdk/provider-http` | أدوات مساعدة لـ HTTP للمزود | أدوات مساعدة عامة لقدرات HTTP/نقطة النهاية للمزود، بما في ذلك أدوات مساعدة لنموذج multipart الخاص بتفريغ الصوت |
  | `plugin-sdk/provider-web-fetch` | أدوات مساعدة لجلب الويب للمزود | أدوات مساعدة لتسجيل/تخزين مؤقت لمزود جلب الويب |
  | `plugin-sdk/provider-web-search-config-contract` | أدوات مساعدة لتكوين بحث الويب للمزود | أدوات مساعدة ضيقة لتكوين/اعتماد بحث الويب للمزودين الذين لا يحتاجون إلى توصيل تفعيل Plugin |
  | `plugin-sdk/provider-web-search-contract` | أدوات مساعدة لعقد بحث الويب للمزود | أدوات مساعدة ضيقة لعقد تكوين/اعتماد بحث الويب مثل `createWebSearchProviderContractFields` و`enablePluginInConfig` و`resolveProviderWebSearchPluginConfig` ومحددات/جالبات الاعتماد المحددة النطاق |
  | `plugin-sdk/provider-web-search` | أدوات مساعدة لبحث الويب للمزود | أدوات مساعدة لتسجيل/تخزين مؤقت/وقت تشغيل مزود بحث الويب |
  | `plugin-sdk/provider-tools` | أدوات مساعدة لتوافق أداة/مخطط المزود | `ProviderToolCompatFamily` و`buildProviderToolCompatFamilyHooks` وتنظيف مخططات DeepSeek/Gemini/OpenAI + التشخيصات |
  | `plugin-sdk/provider-usage` | أدوات مساعدة لاستخدام المزود | `fetchClaudeUsage` و`fetchGeminiUsage` و`fetchGithubCopilotUsage` وأدوات مساعدة أخرى لاستخدام المزود |
  | `plugin-sdk/provider-stream` | أدوات مساعدة لغلاف تدفق المزود | `ProviderStreamFamily` و`buildProviderStreamFamilyHooks` و`composeProviderStreamWrappers` وأنواع أغلفة التدفق وأدوات مساعدة مشتركة لأغلفة Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | أدوات مساعدة لنقل المزود | أدوات مساعدة أصلية لنقل المزود مثل الجلب المحروس، واستخراج نص نتيجة الأداة، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
  | `plugin-sdk/keyed-async-queue` | طابور غير متزامن مرتب | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | أدوات مساعدة مشتركة للوسائط | أدوات مساعدة لجلب/تحويل/تخزين الوسائط، وفحص أبعاد الفيديو المدعوم بـ ffprobe، ومنشئات حمولة الوسائط |
  | `plugin-sdk/media-generation-runtime` | أدوات مساعدة مشتركة لتوليد الوسائط | أدوات مساعدة مشتركة للتبديل عند الفشل، واختيار المرشح، ورسائل النموذج المفقود لتوليد الصور/الفيديو/الموسيقى |
  | `plugin-sdk/media-understanding` | أدوات مساعدة لفهم الوسائط | أنواع مزودي فهم الوسائط إضافة إلى صادرات أدوات مساعدة للصور/الصوت موجهة للمزود |
  | `plugin-sdk/text-runtime` | تصدير توافق نصي واسع مهمل | استخدم `string-coerce-runtime` و`text-chunking` و`text-utility-runtime` و`logging-core` |
  | `plugin-sdk/text-chunking` | أدوات مساعدة لتقسيم النص | أداة مساعدة لتقسيم النص الصادر |
  | `plugin-sdk/speech` | أدوات مساعدة للكلام | أنواع مزودي الكلام إضافة إلى أدوات مساعدة موجهة للمزود للتوجيهات والسجل والتحقق ومنشئ TTS متوافق مع OpenAI |
  | `plugin-sdk/speech-core` | نواة كلام مشتركة | أنواع مزودي الكلام والسجل والتوجيهات والتطبيع |
  | `plugin-sdk/realtime-transcription` | أدوات مساعدة للتفريغ في الوقت الفعلي | أنواع المزود وأدوات مساعدة للسجل وأداة مساعدة مشتركة لجلسة WebSocket |
  | `plugin-sdk/realtime-voice` | أدوات مساعدة للصوت في الوقت الفعلي | أنواع المزود، وأدوات مساعدة للسجل/الحل، وأدوات مساعدة لجلسة الجسر، وطوابير مشتركة لرد كلام الوكيل، وتحكم صوتي للتشغيل النشط، وصحة النص/الحدث، وكبت الصدى، ومطابقة أسئلة الاستشارة، وتنسيق الاستشارة القسرية، وتتبع سياق الدور، وتتبع نشاط الإخراج، وأدوات مساعدة سريعة لاستشارة السياق |
  | `plugin-sdk/image-generation` | أدوات مساعدة لتوليد الصور | أنواع مزودي توليد الصور إضافة إلى أدوات مساعدة لأصل الصورة/عنوان URL للبيانات ومنشئ مزود صور متوافق مع OpenAI |
  | `plugin-sdk/image-generation-core` | نواة مشتركة لتوليد الصور | أنواع توليد الصور وأدوات مساعدة للتبديل عند الفشل والمصادقة والسجل |
  | `plugin-sdk/music-generation` | أدوات مساعدة لتوليد الموسيقى | أنواع مزود/طلب/نتيجة توليد الموسيقى |
  | `plugin-sdk/music-generation-core` | نواة مشتركة لتوليد الموسيقى | أنواع توليد الموسيقى وأدوات مساعدة للتبديل عند الفشل والبحث عن المزود وتحليل مرجع النموذج |
  | `plugin-sdk/video-generation` | أدوات مساعدة لتوليد الفيديو | أنواع مزود/طلب/نتيجة توليد الفيديو |
  | `plugin-sdk/video-generation-core` | نواة مشتركة لتوليد الفيديو | أنواع توليد الفيديو وأدوات مساعدة للتبديل عند الفشل والبحث عن المزود وتحليل مرجع النموذج |
  | `plugin-sdk/interactive-runtime` | أدوات مساعدة للرد التفاعلي | تطبيع/اختزال حمولة الرد التفاعلي |
  | `plugin-sdk/channel-config-primitives` | بدائيات تكوين القناة | بدائيات ضيقة لمخطط تكوين القناة |
  | `plugin-sdk/channel-config-writes` | أدوات مساعدة لكتابة تكوين القناة | أدوات مساعدة لتفويض كتابة تكوين القناة |
  | `plugin-sdk/channel-plugin-common` | مقدمة قناة مشتركة | صادرات مقدمة Plugin القناة المشتركة |
  | `plugin-sdk/channel-status` | أدوات مساعدة لحالة القناة | أدوات مساعدة مشتركة للقطات/ملخصات حالة القناة |
  | `plugin-sdk/allowlist-config-edit` | أدوات مساعدة لتكوين قائمة السماح | أدوات مساعدة لتحرير/قراءة تكوين قائمة السماح |
  | `plugin-sdk/group-access` | أدوات مساعدة لوصول المجموعة | أدوات مساعدة مشتركة لقرارات وصول المجموعة |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | واجهات توافق مهملة | استخدم `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | أدوات مساعدة لحارس الرسائل المباشرة | أدوات مساعدة ضيقة لسياسة الحارس قبل التشفير |
  | `plugin-sdk/extension-shared` | أدوات مساعدة مشتركة للامتداد | بدائيات مساعدة للقناة السلبية/الحالة والوكيل المحيط |
  | `plugin-sdk/webhook-targets` | أدوات مساعدة لهدف Webhook | سجل أهداف Webhook وأدوات مساعدة لتثبيت المسارات |
  | `plugin-sdk/webhook-path` | اسم مستعار مهمل لمسار Webhook | استخدم `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | أدوات مساعدة مشتركة لوسائط الويب | أدوات مساعدة لتحميل الوسائط البعيدة/المحلية |
  | `plugin-sdk/zod` | إعادة تصدير توافق Zod مهملة | استورد `zod` من `zod` مباشرة |
  | `plugin-sdk/memory-core` | أدوات مساعدة مضمّنة لنواة الذاكرة | سطح أدوات مساعدة لمدير/تكوين/ملف/CLI الذاكرة |
  | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل محرك الذاكرة | واجهة وقت تشغيل لفهرسة/بحث الذاكرة |
  | `plugin-sdk/memory-core-host-embedding-registry` | سجل تضمين الذاكرة | أدوات مساعدة خفيفة لسجل مزودي تضمين الذاكرة |
  | `plugin-sdk/memory-core-host-engine-foundation` | محرك أساس مضيف الذاكرة | صادرات محرك أساس مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-embeddings` | محرك تضمين مضيف الذاكرة | عقود تضمين الذاكرة، والوصول إلى السجل، والمزود المحلي، وأدوات مساعدة عامة للدفعات/البعيد؛ المزودون البعيدون المحددون موجودون في Plugins المالكة لهم |
  | `plugin-sdk/memory-core-host-engine-qmd` | محرك QMD لمضيف الذاكرة | صادرات محرك QMD لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-storage` | محرك تخزين مضيف الذاكرة | صادرات محرك تخزين مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-multimodal` | أدوات مساعدة متعددة الوسائط لمضيف الذاكرة | أدوات مساعدة متعددة الوسائط لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-query` | أدوات مساعدة لاستعلام مضيف الذاكرة | أدوات مساعدة لاستعلام مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-secret` | أدوات مساعدة لأسرار مضيف الذاكرة | أدوات مساعدة لأسرار مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-events` | اسم مستعار مهمل لأحداث الذاكرة | استخدم `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | أدوات مساعدة لحالة مضيف الذاكرة | أدوات مساعدة لحالة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-cli` | وقت تشغيل CLI لمضيف الذاكرة | أدوات مساعدة لوقت تشغيل CLI لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-core` | وقت تشغيل نواة مضيف الذاكرة | أدوات مساعدة لوقت تشغيل نواة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-files` | أدوات مساعدة لملف/وقت تشغيل مضيف الذاكرة | أدوات مساعدة لملف/وقت تشغيل مضيف الذاكرة |
  | `plugin-sdk/memory-host-core` | اسم مستعار لوقت تشغيل نواة مضيف الذاكرة | اسم مستعار محايد للمورّد لأدوات مساعدة وقت تشغيل نواة مضيف الذاكرة |
  | `plugin-sdk/memory-host-events` | اسم مستعار ليومية أحداث مضيف الذاكرة | اسم مستعار محايد للمورّد لأدوات مساعدة يومية أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-host-files` | اسم مستعار مهمل لملف/وقت تشغيل الذاكرة | استخدم `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | أدوات مساعدة لـ Markdown مدار | أدوات مساعدة مشتركة لـ Markdown المدار للـ Plugins القريبة من الذاكرة |
  | `plugin-sdk/memory-host-search` | واجهة بحث Active Memory | واجهة وقت تشغيل كسولة لمدير بحث Active Memory |
  | `plugin-sdk/memory-host-status` | اسم مستعار مهمل لحالة مضيف الذاكرة | استخدم `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | أدوات الاختبار | تجميعة تصدير توافق مهملة محلية للمستودع؛ استخدم مسارات اختبار فرعية مركزة محلية للمستودع مثل `plugin-sdk/plugin-test-runtime` و`plugin-sdk/channel-test-helpers` و`plugin-sdk/channel-target-testing` و`plugin-sdk/test-env` و`plugin-sdk/test-fixtures` |
</Accordion>

هذا الجدول هو عمداً المجموعة الفرعية المشتركة للترحيل، وليس كامل سطح SDK
الكامل. يوجد مخزون نقطة دخول المصرّف في
`scripts/lib/plugin-sdk-entrypoints.json`؛ وتُولَّد صادرات الحزمة من
المجموعة الفرعية العامة.

تم إيقاف مواضع الربط المساعدة المحجوزة للـ bundled-plugin من خريطة تصدير SDK
العامة باستثناء واجهات التوافق الموثّقة صراحةً، مثل
حشوة `plugin-sdk/discord` المهملة والمحتفظ بها لحزمة
`@openclaw/discord@2026.3.13` المنشورة. تعيش المساعدات الخاصة بالمالك داخل
حزمة Plugin المالكة؛ ويجب أن ينتقل سلوك المضيف المشترك عبر عقود SDK عامة
مثل `plugin-sdk/gateway-runtime` و`plugin-sdk/security-runtime`
و`plugin-sdk/plugin-config-runtime`.

استخدم أضيق استيراد يطابق المهمة. إذا لم تتمكن من العثور على تصدير،
فافحص المصدر في `src/plugin-sdk/` أو اسأل المشرفين عن العقد العام الذي
ينبغي أن يملكه.

## الإهمالات النشطة

إهمالات أضيق تنطبق عبر SDK الخاص بالـ Plugin، وعقد المزوّد،
وسطح وقت التشغيل، والبيان. كل واحد منها لا يزال يعمل اليوم، لكنه سيُزال
في إصدار رئيسي مستقبلي. يربط الإدخال أسفل كل عنصر API القديم ببديله
المعياري.

<AccordionGroup>
  <Accordion title="بناة مساعدة command-auth → command-status">
    **القديم (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **الجديد (`openclaw/plugin-sdk/command-status`)**: التواقيع نفسها،
    والصادرات نفسها - لكنها مستوردة فقط من المسار الفرعي الأضيق.
    يعيد `command-auth` تصديرها كحشوات توافق.

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
    كائن قرار واحداً بدلاً من استدعاءين منفصلين.

    لقد انتقلت Plugins القنوات اللاحقة (Slack، Discord، Matrix، MS Teams)
    بالفعل.

  </Accordion>

  <Accordion title="حشوة وقت تشغيل القناة ومساعدات إجراءات القناة">
    `openclaw/plugin-sdk/channel-runtime` هي حشوة توافق لـ Plugins القنوات
    الأقدم. لا تستوردها من شيفرة جديدة؛ استخدم
    `openclaw/plugin-sdk/channel-runtime-context` لتسجيل كائنات وقت التشغيل.

    مساعدات `channelActions*` في `openclaw/plugin-sdk/channel-actions`
    مهملة إلى جانب صادرات القناة الخام "actions". اكشف القدرات عبر سطح
    `presentation` الدلالي بدلاً من ذلك - تصرّح Plugins القنوات بما تعرضه
    (بطاقات، أزرار، قوائم اختيار) بدلاً من أسماء الإجراءات الخام التي
    تقبلها.

  </Accordion>

  <Accordion title="مساعد tool() لمزوّد بحث الويب → createTool() على الـ Plugin">
    **القديم**: مصنع `tool()` من `openclaw/plugin-sdk/provider-web-search`.

    **الجديد**: نفّذ `createTool(...)` مباشرة على Plugin المزوّد.
    لم يعد OpenClaw يحتاج إلى مساعد SDK لتسجيل غلاف الأداة.

  </Accordion>

  <Accordion title="مظاريف القنوات النصية الخالصة → BodyForAgent">
    **القديم**: `formatInboundEnvelope(...)` (و
    `ChannelMessageForAgent.channelEnvelope`) لبناء ظرف مطالبة نصية خالصة
    ومسطّحة من رسائل القناة الواردة.

    **الجديد**: `BodyForAgent` بالإضافة إلى كتل سياق مستخدم منظمة. ترفق
    Plugins القنوات بيانات توجيه وصفية (سلسلة، موضوع، رد على، تفاعلات)
    كحقول مصنّفة بدلاً من ضمّها إلى سلسلة مطالبة. لا يزال مساعد
    `formatAgentEnvelope(...)` مدعوماً للمظاريف المركّبة الموجهة للمساعد،
    لكن المظاريف النصية الخالصة الواردة في طريقها إلى الإزالة.

    المناطق المتأثرة: `inbound_claim` و`message_received` وأي Plugin قناة
    مخصص عالج نص `channelEnvelope` لاحقاً.

  </Accordion>

  <Accordion title="خطاف deactivate → gateway_stop">
    **القديم**: `api.on("deactivate", handler)`.

    **الجديد**: `api.on("gateway_stop", handler)`. الحدث والسياق هما عقد
    التنظيف نفسه عند إيقاف التشغيل؛ يتغير اسم الخطاف فقط.

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

    يظل `deactivate` موصولاً كاسم توافق بديل مهمل حتى ما بعد
    2026-08-16.

  </Accordion>

  <Accordion title="خطاف subagent_spawning → ربط سلسلة النواة">
    **القديم**: `api.on("subagent_spawning", handler)` الذي يعيد
    `threadBindingReady` أو `deliveryOrigin`.

    **الجديد**: دع النواة تجهّز ارتباطات الوكلاء الفرعيين `thread: true`
    عبر محوّل ربط جلسة القناة. استخدم `api.on("subagent_spawned", handler)`
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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` فقط كأسطح توافق
    مهملة بينما ترحّل Plugins الخارجية.

  </Accordion>

  <Accordion title="أنواع اكتشاف المزوّد → أنواع كتالوج المزوّد">
    أصبحت أربعة أسماء أنواع بديلة للاكتشاف الآن أغلفة رقيقة فوق أنواع
    حقبة الكتالوج:

    | الاسم البديل القديم       | النوع الجديد               |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    بالإضافة إلى الحقيبة الثابتة القديمة `ProviderCapabilities` - ينبغي
    لـ Plugins المزوّدين استخدام خطافات مزوّد صريحة مثل
    `buildReplayPolicy` و`normalizeToolSchemas` و`wrapStreamFn` بدلاً من
    كائن ثابت.

  </Accordion>

  <Accordion title="خطافات سياسة التفكير → resolveThinkingProfile">
    **القديم** (ثلاثة خطافات منفصلة على `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)` و`supportsXHighThinking(ctx)` و
    `resolveDefaultThinkingLevel(ctx)`.

    **الجديد**: `resolveThinkingProfile(ctx)` واحد يعيد
    `ProviderThinkingProfile` مع `id` المعياري و`label` الاختياري وقائمة
    مستويات مرتبة. يخفض OpenClaw القيم المخزنة القديمة تلقائياً حسب رتبة
    الملف الشخصي.

    يتضمن السياق `provider` و`modelId` و`reasoning` المدمج الاختياري
    وحقائق `compat` لنموذج مدمج اختيارية. يمكن لـ Plugins المزوّدين استخدام
    حقائق الكتالوج هذه لكشف ملف شخصي خاص بالنموذج فقط عندما يدعمه عقد
    الطلب المكوّن.

    نفّذ خطافاً واحداً بدلاً من ثلاثة. تظل الخطافات القديمة تعمل خلال
    نافذة الإهمال، لكنها لا تُركّب مع نتيجة الملف الشخصي.

  </Accordion>

  <Accordion title="مزوّدو المصادقة الخارجية → contracts.externalAuthProviders">
    **القديم**: تنفيذ خطافات المصادقة الخارجية من دون التصريح بالمزوّد في
    بيان الـ Plugin.

    **الجديد**: صرّح بـ `contracts.externalAuthProviders` في بيان الـ Plugin
    **و** نفّذ `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="البحث عن متغيرات بيئة المزوّد → setup.providers[].envVars">
    **حقل البيان القديم**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **الجديد**: اعكس بحث متغيرات البيئة نفسه إلى `setup.providers[].envVars`
    في البيان. يدمج هذا بيانات تعريف بيئة الإعداد/الحالة في مكان واحد
    ويتجنب تشغيل وقت تشغيل الـ Plugin لمجرد الإجابة عن عمليات بحث متغيرات
    البيئة.

    يظل `providerAuthEnvVars` مدعوماً عبر محوّل توافق حتى تُغلق نافذة
    الإهمال.

  </Accordion>

  <Accordion title="تسجيل Plugin الذاكرة → registerMemoryCapability">
    **القديم**: ثلاثة استدعاءات منفصلة -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **الجديد**: استدعاء واحد على API حالة الذاكرة -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    الفتحات نفسها، واستدعاء تسجيل واحد. لا تتأثر مساعدات المطالبة والمجموعة
    الإضافية (`registerMemoryPromptSupplement` و`registerMemoryCorpusSupplement`).

  </Accordion>

  <Accordion title="API مزوّد تضمين الذاكرة">
    **القديم**: `api.registerMemoryEmbeddingProvider(...)` بالإضافة إلى
    `contracts.memoryEmbeddingProviders`.

    **الجديد**: `api.registerEmbeddingProvider(...)` بالإضافة إلى
    `contracts.embeddingProviders`.

    عقد مزوّد التضمين العام قابل لإعادة الاستخدام خارج الذاكرة، وهو المسار
    المدعوم للمزوّدين الجدد. تظل API التسجيل الخاصة بالذاكرة موصولة كتوافق
    مهمل بينما يرحّل المزوّدون الحاليون. تبلغ تقارير فحص الـ Plugin عن
    الاستخدام غير المضمّن كدين توافق.

  </Accordion>

  <Accordion title="إعادة تسمية أنواع رسائل جلسة الوكيل الفرعي">
    اسما نوعين بديلين قديمين لا يزالان مصدّرين من `src/plugins/runtime/types.ts`:

    | القديم                       | الجديد                         |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    طريقة وقت التشغيل `readSession` مهملة لصالح `getSessionMessages`.
    التوقيع نفسه؛ تستدعي الطريقة القديمة الطريقة الجديدة.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **القديم**: `runtime.tasks.flow` (مفرد) أعاد موصّلاً حياً لتدفق المهام.

    **الجديد**: يحتفظ `runtime.tasks.managedFlows` بوقت تشغيل تعديل TaskFlow
    المُدار لـ Plugins التي تنشئ مهاماً فرعية أو تحدّثها أو تلغيها أو تشغلها
    من تدفق. استخدم `runtime.tasks.flows` عندما يحتاج الـ Plugin فقط إلى
    قراءات قائمة على DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="مصانع الامتدادات المضمّنة → وسيط نتائج أدوات الوكيل">
    مغطى في "كيفية الترحيل → ترحيل امتدادات نتائج الأدوات المضمّنة إلى
    وسيط" أعلاه. أُدرج هنا للاكتمال: استُبدل مسار
    `api.registerEmbeddedExtensionFactory(...)` المزال والخاص بالمشغّل
    المضمّن فقط بـ `api.registerAgentToolResultMiddleware(...)` مع قائمة
    وقت تشغيل صريحة في `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="الاسم البديل OpenClawSchemaType → OpenClawConfig">
    أصبح `OpenClawSchemaType` المعاد تصديره من `openclaw/plugin-sdk` اسماً
    بديلاً من سطر واحد لـ `OpenClawConfig`. فضّل الاسم المعياري.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
تُتتبّع الإهمالات على مستوى الامتداد (داخل Plugins القنوات/المزوّدين
المضمّنة تحت `extensions/`) داخل براميل `api.ts` و`runtime-api.ts` الخاصة
بها. إنها لا تؤثر في عقود Plugins الطرف الثالث ولا تُدرج هنا. إذا كنت
تستهلك برميل Plugin مضمّن محلياً مباشرة، فاقرأ تعليقات الإهمال في ذلك
البرميل قبل الترقية.
</Note>

## الجدول الزمني للإزالة

| متى                      | ماذا يحدث                                                                    |
| ------------------------ | ---------------------------------------------------------------------------- |
| **الآن**                 | تصدر الأسطح المهملة تحذيرات وقت التشغيل                                      |
| **الإصدار الرئيسي التالي** | ستُزال الأسطح المهملة؛ وستفشل Plugins التي لا تزال تستخدمها                 |

تم ترحيل جميع Plugins الأساسية بالفعل. يجب على Plugins الخارجية الترحيل
قبل الإصدار الرئيسي التالي.

## إخفاء التحذيرات مؤقتًا

عيّن متغيرات البيئة هذه أثناء العمل على الترحيل:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

هذا مخرج مؤقت، وليس حلًا دائمًا.

## ذات صلة

- [بدء الاستخدام](/ar/plugins/building-plugins) - أنشئ أول Plugin لك
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - مرجع كامل لاستيراد المسارات الفرعية
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) - بناء Plugins القنوات
- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) - بناء Plugins المزوّدين
- [داخليات Plugin](/ar/plugins/architecture) - تعمّق في البنية
- [بيان Plugin](/ar/plugins/manifest) - مرجع مخطط البيان
