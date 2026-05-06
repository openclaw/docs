---
read_when:
    - تظهر لك رسالة التحذير OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - تظهر لك رسالة التحذير OPENCLAW_EXTENSION_API_DEPRECATED
    - لقد استخدمت api.registerEmbeddedExtensionFactory قبل OpenClaw 2026.4.25
    - أنت تقوم بتحديث Plugin إلى معمارية Plugin الحديثة
    - أنت تتولى صيانة Plugin خارجي لـ OpenClaw
sidebarTitle: Migrate to SDK
summary: الترحيل من طبقة التوافق مع الإصدارات السابقة القديمة إلى SDK الحديث لـ Plugin
title: ترحيل Plugin SDK
x-i18n:
    generated_at: "2026-05-06T08:08:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: f629f6e3f9a0c122f3065d9b0b6b418e1c1ba29d42aff9ed025d61189be3e42a
    source_path: plugins/sdk-migration.md
    workflow: 16
---

انتقل OpenClaw من طبقة توافق رجعي واسعة إلى بنية Plugin حديثة
ذات استيرادات مركزة وموثقة. إذا كان Plugin الخاص بك قد بُني قبل
البنية الجديدة، فسيساعدك هذا الدليل على الترحيل.

## ما الذي يتغير

كان نظام Plugin القديم يوفّر سطحين مفتوحين على نطاق واسع يسمحان لـ Plugins باستيراد
أي شيء تحتاج إليه من نقطة إدخال واحدة:

- **`openclaw/plugin-sdk/compat`** - استيراد واحد كان يعيد تصدير عشرات
  المساعدات. قُدّم لإبقاء Plugins القديمة المعتمدة على الخطافات عاملة أثناء
  بناء بنية Plugin الجديدة.
- **`openclaw/plugin-sdk/infra-runtime`** - حزمة مساعدات تشغيل واسعة كانت
  تخلط أحداث النظام، وحالة Heartbeat، وطوابير التسليم، ومساعدات fetch/proxy،
  ومساعدات الملفات، وأنواع الموافقات، وأدوات غير مرتبطة.
- **`openclaw/plugin-sdk/config-runtime`** - حزمة توافق إعدادات واسعة
  لا تزال تحمل مساعدات التحميل/الكتابة المباشرة المهملة أثناء نافذة الترحيل.
- **`openclaw/extension-api`** - جسر كان يمنح Plugins وصولًا مباشرًا إلى
  مساعدات جانب المضيف مثل مشغّل الوكيل المضمّن.
- **`api.registerEmbeddedExtensionFactory(...)`** - خطاف Plugin مجمّع مخصص لـ Pi فقط تمت إزالته
  وكان يستطيع مراقبة أحداث المشغّل المضمّن مثل
  `tool_result`.

أصبحت أسطح الاستيراد الواسعة الآن **مهملة**. لا تزال تعمل وقت التشغيل،
لكن يجب ألا تستخدمها Plugins الجديدة، وينبغي أن ترحّل Plugins القائمة قبل
أن يزيلها الإصدار الرئيسي التالي. أزيلت API تسجيل مصنع Plugin المضمّن المخصص لـ Pi فقط؛ استخدم وسيط نتائج الأدوات بدلًا من ذلك.

لا يزيل OpenClaw سلوك Plugin موثقًا أو يعيد تفسيره في التغيير نفسه
الذي يقدّم بديلًا. يجب أن تمر تغييرات العقد الكاسرة أولًا
عبر محوّل توافق، وتشخيصات، ووثائق، ونافذة إهمال.
ينطبق ذلك على استيرادات SDK، وحقول البيان، وواجهات API للإعداد، والخطافات، وسلوك
التسجيل وقت التشغيل.

<Warning>
  ستُزال طبقة التوافق الرجعي في إصدار رئيسي مستقبلي.
  ستتعطل Plugins التي لا تزال تستورد من هذه الأسطح عندما يحدث ذلك.
  تسجيلات مصنع Plugin المضمّن المخصصة لـ Pi فقط لم تعد تُحمّل بالفعل.
</Warning>

## لماذا تغير هذا

تسبب النهج القديم في مشكلات:

- **بطء بدء التشغيل** - كان استيراد مساعد واحد يحمّل عشرات الوحدات غير المرتبطة
- **تبعيات دورية** - سهّلت إعادة التصدير الواسعة إنشاء دورات استيراد
- **سطح API غير واضح** - لم تكن هناك طريقة لمعرفة أي الصادرات مستقرة وأيها داخلية

يصلح SDK الحديث الخاص بـ Plugin هذا: كل مسار استيراد (`openclaw/plugin-sdk/\<subpath\>`)
هو وحدة صغيرة ومستقلة ذات غرض واضح وعقد موثق.

أزيلت أيضًا طبقات الراحة القديمة للمزوّدين الخاصة بالقنوات المجمّعة.
كانت طبقات المساعدات ذات علامات القنوات اختصارات خاصة داخل المستودع الأحادي، وليست
عقود Plugin مستقرة. استخدم مسارات SDK الفرعية العامة والضيقة بدلًا من ذلك. داخل مساحة عمل
Plugin المجمّعة، أبقِ المساعدات المملوكة للمزوّد في `api.ts` أو
`runtime-api.ts` الخاصتين بذلك Plugin.

أمثلة المزوّدين المجمّعين الحالية:

- يحتفظ Anthropic بمساعدات البث الخاصة بـ Claude في طبقة `api.ts` /
  `contract-api.ts` الخاصة به
- يحتفظ OpenAI ببناة المزوّدين، ومساعدات النماذج الافتراضية، وبناة مزوّدي الوقت الحقيقي
  في `api.ts` الخاص به
- يحتفظ OpenRouter بباني المزوّد ومساعدات الإعداد/التكوين في
  `api.ts` الخاص به

## خطة ترحيل Talk والصوت في الوقت الحقيقي

ينتقل كود Talk للصوت في الوقت الحقيقي، والاتصالات الهاتفية، والاجتماعات، والمتصفح من
تتبّع الأدوار المحلي لكل سطح إلى متحكم مشترك في جلسات Talk مُصدّر بواسطة
`openclaw/plugin-sdk/realtime-voice`. يمتلك المتحكم الجديد غلاف حدث Talk
المشترك، وحالة الدور النشط، وحالة الالتقاط، وحالة الصوت الخارج، وسجل الأحداث
الأخير، ورفض الأدوار القديمة. ينبغي أن تواصل Plugins المزوّدين امتلاك
جلسات الوقت الحقيقي الخاصة بالمورّدين؛ وينبغي أن تواصل Plugins الأسطح امتلاك الالتقاط،
والتشغيل، والاتصالات الهاتفية، وخصوصيات الاجتماعات.

ترحيل Talk هذا كاسر بنظافة عن قصد:

1. أبقِ بدائيات المتحكم/وقت التشغيل المشتركة في
   `plugin-sdk/realtime-voice`.
2. انقل الأسطح المجمّعة إلى المتحكم المشترك: ترحيل المتصفح،
   تسليم الغرفة المُدارة، وقت الاتصال الصوتي الحقيقي، STT المتدفق للمكالمات الصوتية، الوقت الحقيقي في Google
   Meet، والضغط للتحدث الأصلي.
3. استبدل عائلات RPC القديمة الخاصة بـ Talk بواجهة API النهائية `talk.session.*` و
   `talk.client.*`.
4. أعلن عن قناة حدث Talk مباشرة واحدة في Gateway
   `hello-ok.features.events`: `talk.event`.
5. احذف نقطة نهاية HTTP القديمة للوقت الحقيقي وأي مسار تجاوز تعليمات
   وقت الطلب.

ينبغي ألا يستدعي الكود الجديد `createTalkEventSequencer(...)` مباشرة إلا إذا كان
ينفّذ محوّلًا منخفض المستوى أو تجهيز اختبار. فضّل المتحكم المشترك
حتى لا يمكن إصدار أحداث محددة بالدور دون معرّف دور، ولا يمكن لاستدعاءات `turnEnd` /
`turnCancel` القديمة أن تمسح دورًا نشطًا أحدث، وتبقى أحداث دورة حياة
الصوت الخارج متسقة عبر الاتصالات الهاتفية، والاجتماعات، وترحيل المتصفح، وتسليم الغرفة المُدارة،
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
```

تستخدم جلسات WebRTC/مقبس ويب المزوّد المملوكة للمتصفح `talk.client.create`،
لأن المتصفح يمتلك تفاوض المزوّد ونقل الوسائط بينما يمتلك
Gateway بيانات الاعتماد، والتعليمات، وسياسة الأدوات. `talk.session.*` هو
السطح المشترك المُدار بواسطة Gateway للوقت الحقيقي عبر gateway-relay،
والنسخ عبر gateway-relay، وجلسات STT/TTS الأصلية للغرف المُدارة.

يجب إصلاح الإعدادات القديمة التي وضعت محددات الوقت الحقيقي بجانب `talk.provider` /
`talk.providers` باستخدام `openclaw doctor --fix`؛ لا يعيد Talk وقت التشغيل
تفسير إعداد مزوّد الكلام/TTS بوصفه إعداد مزوّد الوقت الحقيقي.

توليفات `talk.session.create` المدعومة صغيرة عن قصد:

| الوضع            | النقل       | العقل           | المالك              | ملاحظات                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | صوت مزوّد ثنائي الاتجاه بالكامل مجسور عبر Gateway؛ تُوجّه استدعاءات الأدوات عبر أداة agent-consult.      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | STT متدفق فقط؛ يرسل المستدعون صوت الإدخال ويتلقون أحداث النص المنسوخ.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | غرفة أصلية/عميل | غرف بنمط الضغط للتحدث واللاسلكي حيث يمتلك العميل الالتقاط/التشغيل ويمتلك Gateway حالة الدور. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | غرفة أصلية/عميل | وضع غرفة للمسؤولين فقط للأسطح الموثوقة من الطرف الأول التي تنفّذ إجراءات أدوات Gateway مباشرة.                  |

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

مفردات التحكم الموحّدة ضيقة عمدًا أيضًا:

| الطريقة                          | ينطبق على                                              | العقد                                                                                      |
| ------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | ألحق قطعة صوت PCM بترميز base64 بجلسة المزوّد المملوكة لاتصال Gateway نفسه. |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | ابدأ دور مستخدم في غرفة مُدارة.                                                               |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | أنهِ الدور النشط بعد التحقق من الدور القديم.                                              |
| `talk.session.cancelTurn`       | كل الجلسات المملوكة لـ Gateway                              | ألغِ عمل الالتقاط/المزوّد/الوكيل/TTS النشط لدور ما.                                     |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | أوقف خرج صوت المساعد دون إنهاء دور المستخدم بالضرورة.                         |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | أكمل استدعاء أداة مزوّد أصدره المرحّل.                                           |
| `talk.session.close`            | كل الجلسات الموحّدة                                    | أوقف جلسات الترحيل أو ألغِ حالة الغرفة المُدارة، ثم انسَ معرّف الجلسة الموحّد.         |

لا تُدخل حالات خاصة للمزوّد أو المنصة في النواة لجعل هذا يعمل.
تمتلك النواة دلالات جلسة Talk. تمتلك Plugins المزوّدين إعداد جلسات المورّدين.
تمتلك المكالمات الصوتية وGoogle Meet محوّلات الاتصالات الهاتفية/الاجتماعات. تمتلك تطبيقات المتصفح والأصلية
تجربة مستخدم الالتقاط/التشغيل على الجهاز.

## سياسة التوافق

بالنسبة إلى Plugins الخارجية، يتبع عمل التوافق هذا الترتيب:

1. أضف العقد الجديد
2. أبقِ السلوك القديم موصولًا عبر محوّل توافق
3. أصدر تشخيصًا أو تحذيرًا يذكر المسار القديم والبديل
4. غطِّ كلا المسارين في الاختبارات
5. وثّق الإهمال ومسار الترحيل
6. أزل فقط بعد نافذة الترحيل المعلنة، وعادةً في إصدار رئيسي

  يمكن للمحافظين تدقيق قائمة انتظار الترحيل الحالية باستخدام
  `pnpm plugins:boundary-report`. استخدم `pnpm plugins:boundary-report:summary` للحصول على
  أعداد موجزة، و`--owner <id>` لـ Plugin واحد أو مالك توافق واحد، و
  `pnpm plugins:boundary-report:ci` عندما يجب أن تفشل بوابة CI بسبب
  سجلات توافق مستحقة، أو استيرادات SDK محجوزة عابرة للمالكين، أو مسارات SDK
  فرعية محجوزة غير مستخدمة. يجمع التقرير سجلات التوافق المهملة حسب تاريخ
  الإزالة، ويعد مراجع الكود/الوثائق المحلية، ويكشف استيرادات SDK المحجوزة
  العابرة للمالكين، ويلخص جسر SDK الخاص بمضيف الذاكرة حتى يبقى تنظيف التوافق
  صريحا بدلا من الاعتماد على عمليات بحث مرتجلة. يجب أن تكون للمسارات الفرعية
  المحجوزة في SDK استخدامات مالك متتبعة؛ ويجب إزالة صادرات المساعدات المحجوزة
  غير المستخدمة من SDK العام.

  إذا كان حقل manifest لا يزال مقبولا، فيمكن لمؤلفي Plugin الاستمرار في استخدامه حتى
  تقول الوثائق والتشخيصات خلاف ذلك. يجب أن يفضل الكود الجديد البديل الموثق،
  لكن يجب ألا تتعطل Plugins الموجودة أثناء الإصدارات الثانوية العادية.

  ## كيفية الترحيل

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    يجب أن تتوقف Plugins المضمنة عن استدعاء
    `api.runtime.config.loadConfig()` و
    `api.runtime.config.writeConfigFile(...)` مباشرة. فضّل الإعدادات التي تم
    تمريرها بالفعل إلى مسار الاستدعاء النشط. يمكن للمعالجات طويلة العمر التي تحتاج
    لقطة العملية الحالية استخدام `api.runtime.config.current()`. يجب أن تستخدم
    أدوات الوكيل طويلة العمر `ctx.getRuntimeConfig()` الخاصة بسياق الأداة داخل
    `execute` حتى ترى الأداة التي أُنشئت قبل كتابة إعدادات ما إعدادات runtime
    المحدّثة.

    يجب أن تمر كتابات الإعدادات عبر المساعدات المعاملاتية وأن تختار سياسة
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
    أن التغيير يتطلب إعادة تشغيل نظيفة لـ gateway، و
    `afterWrite: { mode: "none", reason: "..." }` فقط عندما يملك المستدعي
    المتابعة ويريد عمدا كبح مخطط إعادة التحميل. تتضمن نتائج التعديل ملخص
    `followUp` ذا نوع محدد للاختبارات والتسجيل؛ ويبقى Gateway مسؤولا عن تطبيق
    إعادة التشغيل أو جدولتها. يبقى `loadConfig` و`writeConfigFile` كمساعدات
    توافق مهملة لـ Plugins الخارجية أثناء نافذة الترحيل، ويصدران تحذيرا مرة واحدة
    مع رمز التوافق `runtime-config-load-write`. تتم حماية Plugins المضمنة وكود
    runtime في المستودع عبر حواجز الماسح في
    `pnpm check:deprecated-internal-config-api` و
    `pnpm check:no-runtime-action-load-config`: يفشل استخدام Plugin الإنتاجي الجديد
    مباشرة، وتفشل كتابات الإعدادات المباشرة، ويجب أن تستخدم طرائق خادم Gateway
    لقطة runtime الخاصة بالطلب، ويجب أن تتلقى مساعدات إرسال/إجراء/عميل قناة
    runtime الإعدادات من حدها، ولا يسمح لوحدات runtime طويلة العمر بأي استدعاءات
    محيطة لـ `loadConfig()`.

    يجب أن يتجنب كود Plugin الجديد أيضا استيراد الحزمة التوافقية العامة
    `openclaw/plugin-sdk/config-runtime`. استخدم المسار الفرعي الضيق في SDK الذي
    يطابق المهمة:

    | الحاجة | الاستيراد |
    | --- | --- |
    | أنواع الإعدادات مثل `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | تأكيدات الإعدادات المحملة مسبقا وبحث إعدادات مدخل Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | قراءات لقطة runtime الحالية | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | كتابات الإعدادات | `openclaw/plugin-sdk/config-mutation` |
    | مساعدات مخزن الجلسات | `openclaw/plugin-sdk/session-store-runtime` |
    | إعدادات جدول Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | مساعدات runtime لسياسة المجموعة | `openclaw/plugin-sdk/runtime-group-policy` |
    | حل إدخال السر | `openclaw/plugin-sdk/secret-input-runtime` |
    | تجاوزات النموذج/الجلسة | `openclaw/plugin-sdk/model-session-runtime` |

    تتم حماية Plugins المضمنة واختباراتها بالماسح ضد الحزمة العامة، حتى تبقى
    الاستيرادات والمحاكيات محلية للسلوك الذي تحتاجه. لا تزال الحزمة العامة موجودة
    للتوافق الخارجي، لكن يجب ألا يعتمد عليها الكود الجديد.

  </Step>

  <Step title="Migrate Pi tool-result extensions to middleware">
    يجب أن تستبدل Plugins المضمنة معالجات نتائج الأدوات الخاصة بـ Pi فقط
    `api.registerEmbeddedExtensionFactory(...)` ببرمجية وسيطة محايدة تجاه runtime.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    حدّث manifest الخاص بـ Plugin في الوقت نفسه:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    لا يمكن لـ Plugins الخارجية تسجيل برمجية وسيطة لنتائج الأدوات لأنها تستطيع
    إعادة كتابة مخرجات أدوات عالية الثقة قبل أن يراها النموذج.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    تعرض Plugins القنوات القادرة على الموافقة الآن سلوك الموافقة الأصلي عبر
    `approvalCapability.nativeRuntime` بالإضافة إلى سجل سياق runtime المشترك.

    التغييرات الأساسية:

    - استبدل `approvalCapability.handler.loadRuntime(...)` بـ
      `approvalCapability.nativeRuntime`
    - انقل مصادقة/تسليم الموافقة المحددة من توصيل `plugin.auth` /
      `plugin.approvals` القديم إلى `approvalCapability`
    - تمت إزالة `ChannelPlugin.approvals` من عقد Plugin القناة العام؛ انقل حقول
      التسليم/الأصلي/العرض إلى `approvalCapability`
    - يبقى `plugin.auth` لتدفقات تسجيل الدخول/الخروج للقنوات فقط؛ لم يعد core يقرأ
      خطافات مصادقة الموافقة هناك
    - سجّل كائنات runtime المملوكة للقناة مثل العملاء أو الرموز أو تطبيقات Bolt عبر
      `openclaw/plugin-sdk/channel-runtime-context`
    - لا ترسل إشعارات إعادة توجيه مملوكة لـ Plugin من معالجات الموافقة الأصلية؛
      صار core يملك إشعارات التوجيه إلى مكان آخر من نتائج التسليم الفعلية
    - عند تمرير `channelRuntime` إلى `createChannelManager(...)`، وفّر سطح
      `createPluginRuntime().channel` حقيقيا. تُرفض البدائل الجزئية.

    راجع `/plugins/sdk-channel-plugins` للتخطيط الحالي لقدرة الموافقة.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    إذا كان Plugin الخاص بك يستخدم `openclaw/plugin-sdk/windows-spawn`، فإن wrappers
    غير المحلولة لـ Windows من نوع `.cmd`/`.bat` تفشل الآن بإغلاق آمن ما لم تمرر
    صراحة `allowShellFallback: true`.

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

    إذا كان المستدعي لديك لا يعتمد عمدا على الرجوع إلى shell، فلا تضبط
    `allowShellFallback` وتعامل مع الخطأ الملقى بدلا من ذلك.

  </Step>

  <Step title="Find deprecated imports">
    ابحث في Plugin الخاص بك عن الاستيرادات من أي من السطحين المهملين:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    يقابل كل تصدير من السطح القديم مسار استيراد حديثا محددا:

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

    بالنسبة لمساعدات جهة المضيف، استخدم runtime المحقون الخاص بـ Plugin بدلا من
    الاستيراد المباشر:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
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
    لا يزال `openclaw/plugin-sdk/infra-runtime` موجودا للتوافق الخارجي، لكن يجب أن
    يستورد الكود الجديد سطح المساعدات المركز الذي يحتاجه فعلا:

    | الحاجة | الاستيراد |
    | --- | --- |
    | مساعدات قائمة انتظار أحداث النظام | `openclaw/plugin-sdk/system-event-runtime` |
    | مساعدات حدث Heartbeat والرؤية | `openclaw/plugin-sdk/heartbeat-runtime` |
    | تفريغ قائمة انتظار التسليم المعلق | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | قياسات نشاط القناة | `openclaw/plugin-sdk/channel-activity-runtime` |
    | مخابئ إزالة التكرار داخل الذاكرة | `openclaw/plugin-sdk/dedupe-runtime` |
    | مساعدات مسار الملف المحلي/الوسائط الآمنة | `openclaw/plugin-sdk/file-access-runtime` |
    | جلب مدرك للموزع | `openclaw/plugin-sdk/runtime-fetch` |
    | مساعدات الوكيل والجلب المحروس | `openclaw/plugin-sdk/fetch-runtime` |
    | أنواع سياسة موزع SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | أنواع طلب/حل الموافقة | `openclaw/plugin-sdk/approval-runtime` |
    | مساعدات حمولة رد الموافقة والأوامر | `openclaw/plugin-sdk/approval-reply-runtime` |
    | مساعدات تنسيق الأخطاء | `openclaw/plugin-sdk/error-runtime` |
    | انتظار جاهزية النقل | `openclaw/plugin-sdk/transport-ready-runtime` |
    | مساعدات الرموز الآمنة | `openclaw/plugin-sdk/secure-random-runtime` |
    | تزامن مهام غير متزامنة محدود | `openclaw/plugin-sdk/concurrency-runtime` |
    | الإكراه الرقمي | `openclaw/plugin-sdk/number-runtime` |
    | قفل غير متزامن محلي للعملية | `openclaw/plugin-sdk/async-lock-runtime` |
    | أقفال الملفات | `openclaw/plugin-sdk/file-lock` |

    تتم حماية Plugins المضمنة بالماسح ضد `infra-runtime`، لذلك لا يمكن لكود المستودع
    أن يتراجع إلى الحزمة العامة.

  </Step>

  <Step title="Migrate channel route helpers">
    يجب أن يستخدم كود توجيه القنوات الجديد `openclaw/plugin-sdk/channel-route`.
    تبقى أسماء مفتاح التوجيه والهدف القابل للمقارنة الأقدم كأسماء مستعارة للتوافق
    أثناء نافذة الترحيل، لكن يجب أن تستخدم Plugins الجديدة أسماء التوجيه التي تصف
    السلوك مباشرة:

    | المساعد القديم | المساعد الحديث |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    تعمل مساعدات المسارات الحديثة على تطبيع `{ channel, to, accountId, threadId }`
    بشكل متسق عبر الموافقات الأصلية، ومنع الردود، وإزالة تكرار الوارد،
    وتسليم cron، وتوجيه الجلسات. إذا كان Plugin الخاص بك يمتلك قواعد مخصصة
    للأهداف، فاستخدم `resolveChannelRouteTargetWithParser(...)` لتكييف ذلك
    المحلّل مع عقد هدف المسار نفسه.

  </Step>

  <Step title="البناء والاختبار">
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
  | `plugin-sdk/plugin-entry` | مساعد إدخال Plugin المعتمد | `definePluginEntry` |
  | `plugin-sdk/core` | إعادة تصدير شاملة قديمة لتعريفات/بناة إدخال القنوات | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | تصدير مخطط إعدادات الجذر | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | مساعد إدخال لمزوّد واحد | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعريفات وبناة إدخال قنوات مركزة | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | مساعدو معالج الإعداد المشترك | مطالبات قائمة السماح، وبناة حالة الإعداد |
  | `plugin-sdk/setup-runtime` | مساعدو وقت تشغيل مرحلة الإعداد | محولات تصحيح الإعداد الآمنة للاستيراد، مساعدو ملاحظات البحث، `promptResolvedAllowFrom`, `splitSetupEntries`, وكلاء إعداد مفوّضون |
  | `plugin-sdk/setup-adapter-runtime` | مساعدو محول الإعداد | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | مساعدو أدوات الإعداد | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | مساعدو الحسابات المتعددة | مساعدو قائمة الحسابات/الإعدادات/بوابة الإجراءات |
  | `plugin-sdk/account-id` | مساعدو معرّف الحساب | `DEFAULT_ACCOUNT_ID`، وتطبيع معرّف الحساب |
  | `plugin-sdk/account-resolution` | مساعدو البحث عن الحساب | مساعدو البحث عن الحساب والرجوع الافتراضي الاحتياطي |
  | `plugin-sdk/account-helpers` | مساعدو الحسابات المحددة | مساعدو قائمة الحسابات/إجراءات الحساب |
  | `plugin-sdk/channel-setup` | محولات معالج الإعداد | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، إضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | بدائيات إقران الرسائل الخاصة | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | ربط بادئة الرد والكتابة وتسليم المصدر | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | مصانع محولات الإعدادات ومساعدو الوصول إلى الرسائل الخاصة | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | بناة مخطط الإعدادات | بدائيات مخطط إعدادات القناة المشتركة والباني العام فقط |
  | `plugin-sdk/bundled-channel-config-schema` | مخططات إعدادات مضمنة | Plugins المضمنة التي يصونها OpenClaw فقط؛ يجب أن تعرّف Plugins الجديدة مخططاتها المحلية الخاصة بها |
  | `plugin-sdk/channel-config-schema-legacy` | مخططات إعدادات مضمنة مهملة | اسم توافق بديل فقط؛ استخدم `plugin-sdk/bundled-channel-config-schema` لـ Plugins المضمنة المصانة |
  | `plugin-sdk/telegram-command-config` | مساعدو إعدادات أوامر Telegram | تطبيع أسماء الأوامر، وقص الأوصاف، والتحقق من التكرار/التعارض |
  | `plugin-sdk/channel-policy` | حل سياسة المجموعة/الرسائل الخاصة | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | مساعدو حالة الحساب ودورة حياة بث المسودة | `createAccountStatusSink`، ومساعدو إنهاء معاينة المسودة |
  | `plugin-sdk/inbound-envelope` | مساعدو مغلف الوارد | مساعدو المسار المشترك وبناء المغلفات |
  | `plugin-sdk/inbound-reply-dispatch` | مساعدو رد الوارد | مساعدو التسجيل والإرسال المشتركون |
  | `plugin-sdk/messaging-targets` | تحليل هدف المراسلة | مساعدو تحليل/مطابقة الهدف |
  | `plugin-sdk/outbound-media` | مساعدو الوسائط الصادرة | تحميل الوسائط الصادرة المشتركة |
  | `plugin-sdk/outbound-send-deps` | مساعدو اعتماديات الإرسال الصادر | بحث `resolveOutboundSendDep` خفيف دون استيراد وقت التشغيل الصادر الكامل |
  | `plugin-sdk/outbound-runtime` | مساعدو وقت التشغيل الصادر | مساعدو التسليم الصادر، وتفويض الهوية/الإرسال، والجلسة، والتنسيق، وتخطيط الحمولة |
  | `plugin-sdk/thread-bindings-runtime` | مساعدو ربط المحادثات | مساعدو دورة حياة ربط المحادثات والمحولات |
  | `plugin-sdk/agent-media-payload` | مساعدو حمولات الوسائط القديمة | باني حمولة وسائط الوكيل لتخطيطات الحقول القديمة |
  | `plugin-sdk/channel-runtime` | طبقة توافق مهملة | أدوات وقت تشغيل القنوات القديمة فقط |
  | `plugin-sdk/channel-send-result` | أنواع نتائج الإرسال | أنواع نتائج الرد |
  | `plugin-sdk/runtime-store` | تخزين Plugin دائم | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | مساعدو وقت تشغيل واسع النطاق | مساعدو وقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
  | `plugin-sdk/runtime-env` | مساعدو بيئة وقت تشغيل محددة | مساعدو المسجّل/بيئة وقت التشغيل، والمهلة، وإعادة المحاولة، والتراجع |
  | `plugin-sdk/plugin-runtime` | مساعدو وقت تشغيل Plugin مشتركون | مساعدو أوامر/خطافات/http/تفاعلية Plugin |
  | `plugin-sdk/hook-runtime` | مساعدو مسار معالجة الخطافات | مساعدو مسار معالجة خطافات Webhook/داخلية مشتركة |
  | `plugin-sdk/lazy-runtime` | مساعدو وقت التشغيل الكسول | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | مساعدو العمليات | مساعدو تنفيذ مشتركون |
  | `plugin-sdk/cli-runtime` | مساعدو وقت تشغيل CLI | تنسيق الأوامر، والانتظار، ومساعدو الإصدارات |
  | `plugin-sdk/gateway-runtime` | مساعدو Gateway | عميل Gateway، ومساعد بدء جاهزية حلقة الأحداث، ومساعدو تصحيح حالة القناة |
  | `plugin-sdk/config-runtime` | طبقة توافق إعدادات مهملة | فضّل `config-types`, `plugin-config-runtime`, `runtime-config-snapshot`، و`config-mutation` |
  | `plugin-sdk/telegram-command-config` | مساعدو أوامر Telegram | مساعدو تحقق من أوامر Telegram ثابتة الرجوع عند عدم توفر سطح عقد Telegram المضمن |
  | `plugin-sdk/approval-runtime` | مساعدو مطالبة الموافقة | حمولة موافقة التنفيذ/Plugin، ومساعدو قدرة/ملف تعريف الموافقة، ومساعدو توجيه/وقت تشغيل الموافقة الأصلية، وتنسيق مسار عرض الموافقة المهيكلة |
  | `plugin-sdk/approval-auth-runtime` | مساعدو مصادقة الموافقة | حل جهة الموافقة، ومصادقة إجراء المحادثة نفسها |
  | `plugin-sdk/approval-client-runtime` | مساعدو عميل الموافقة | مساعدو ملف تعريف/مرشح موافقة التنفيذ الأصلية |
  | `plugin-sdk/approval-delivery-runtime` | مساعدو تسليم الموافقة | محولات قدرة/تسليم الموافقة الأصلية |
  | `plugin-sdk/approval-gateway-runtime` | مساعدو Gateway للموافقة | مساعد حل Gateway مشترك للموافقة |
  | `plugin-sdk/approval-handler-adapter-runtime` | مساعدو محول الموافقة | مساعدو تحميل خفيفة لمحولات الموافقة الأصلية لنقاط إدخال القنوات الساخنة |
  | `plugin-sdk/approval-handler-runtime` | مساعدو معالج الموافقة | مساعدو وقت تشغيل أوسع لمعالج الموافقة؛ فضّل مسارات المحول/Gateway الأضيق عندما تكفي |
  | `plugin-sdk/approval-native-runtime` | مساعدو هدف الموافقة | مساعدو ربط هدف/حساب الموافقة الأصلية |
  | `plugin-sdk/approval-reply-runtime` | مساعدو رد الموافقة | مساعدو حمولة رد موافقة التنفيذ/Plugin |
  | `plugin-sdk/channel-runtime-context` | مساعدو سياق وقت تشغيل القناة | مساعدو عامون لتسجيل/جلب/مراقبة سياق وقت تشغيل القناة |
  | `plugin-sdk/security-runtime` | مساعدو الأمان | مساعدو الثقة المشتركة، وبوابة الرسائل الخاصة، ومساعدو الملفات/المسارات المقيدة بالجذر، والمحتوى الخارجي، وجمع الأسرار |
  | `plugin-sdk/ssrf-policy` | مساعدو سياسة SSRF | مساعدو قائمة سماح المضيف وسياسة الشبكة الخاصة |
  | `plugin-sdk/ssrf-runtime` | مساعدو وقت تشغيل SSRF | مرسل مثبت، وجلب محروس، ومساعدو سياسة SSRF |
  | `plugin-sdk/system-event-runtime` | مساعدو أحداث النظام | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | مساعدو Heartbeat | مساعدو حدث Heartbeat والرؤية |
  | `plugin-sdk/delivery-queue-runtime` | مساعدو قائمة انتظار التسليم | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | مساعدو نشاط القناة | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | مساعدو إزالة التكرار | مخابئ إزالة تكرار في الذاكرة |
  | `plugin-sdk/file-access-runtime` | مساعدو الوصول إلى الملفات | مساعدو مسارات الملفات/الوسائط المحلية الآمنة |
  | `plugin-sdk/transport-ready-runtime` | مساعدو جاهزية النقل | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | مساعدو الذاكرة المؤقتة المحدودة | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | مساعدو بوابة التشخيص | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | مساعدو تنسيق الأخطاء | `formatUncaughtError`, `isApprovalNotFoundError`، ومساعدو رسم الأخطاء |
  | `plugin-sdk/fetch-runtime` | مساعدو الجلب/الوكيل المغلف | `resolveFetch`، ومساعدو الوكيل، ومساعدو خيارات EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | مساعدو تطبيع المضيف | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | مساعدو إعادة المحاولة | `RetryConfig`, `retryAsync`، ومنفذو السياسات |
  | `plugin-sdk/allow-from` | تنسيق قائمة السماح | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | تعيين إدخال قائمة السماح | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | مساعدو بوابة الأوامر وسطح الأوامر | `resolveControlCommandGate`، ومساعدو تفويض المرسل، ومساعدو سجل الأوامر بما في ذلك تنسيق قائمة الوسائط للحجج الديناميكية |
  | `plugin-sdk/command-status` | عارضو حالة/مساعدة الأوامر | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تحليل إدخال الأسرار | مساعدو إدخال الأسرار |
  | `plugin-sdk/webhook-ingress` | مساعدو طلب Webhook | أدوات هدف Webhook |
  | `plugin-sdk/webhook-request-guards` | مساعدو حراسة جسم Webhook | مساعدو قراءة/حد جسم الطلب |
  | `plugin-sdk/reply-runtime` | وقت تشغيل الرد المشترك | إرسال الوارد، وHeartbeat، ومخطط الرد، والتجزئة |
  | `plugin-sdk/reply-dispatch-runtime` | مساعدو إرسال الرد المحدد | الإنهاء، وإرسال المزوّد، ومساعدو تسمية المحادثة |
  | `plugin-sdk/reply-history` | مساعدو سجل الردود | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | تخطيط مرجع الرد | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | مساعدو تجزئة الرد | مساعدو تجزئة النص/markdown |
  | `plugin-sdk/session-store-runtime` | مساعدو مخزن الجلسات | مساعدو مسار المخزن ووقت آخر تحديث |
  | `plugin-sdk/state-paths` | مساعدو مسار الحالة | مساعدو مجلدي الحالة وOAuth |
  | `plugin-sdk/routing` | مساعدو التوجيه/مفتاح الجلسة | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`، ومساعدو تطبيع مفتاح الجلسة |
  | `plugin-sdk/status-helpers` | مساعدو حالة القناة | بناة ملخص حالة القناة/الحساب، وافتراضيات حالة وقت التشغيل، ومساعدو بيانات تعريف المشكلة |
  | `plugin-sdk/target-resolver-runtime` | مساعدو محلل الهدف | مساعدو محلل الهدف المشتركون |
  | `plugin-sdk/string-normalization-runtime` | مساعدو تطبيع السلاسل النصية | مساعدو تطبيع slug/السلاسل النصية |
  | `plugin-sdk/request-url` | مساعدو عنوان URL للطلب | استخراج عناوين URL النصية من مدخلات شبيهة بالطلبات |
  | `plugin-sdk/run-command` | مساعدو الأوامر المؤقتة | مشغل أوامر مؤقتة مع stdout/stderr مطبعين |
  | `plugin-sdk/param-readers` | قارئات المعاملات | قارئات معاملات الأدوات/CLI المشتركة |
  | `plugin-sdk/tool-payload` | استخراج حمولة الأداة | استخرج الحمولات المطبّعة من كائنات نتائج الأدوات |
  | `plugin-sdk/tool-send` | استخراج إرسال الأداة | استخرج حقول هدف الإرسال القياسية من وسيطات الأداة |
  | `plugin-sdk/temp-path` | مساعدات المسار المؤقت | مساعدات مشتركة لمسار التنزيل المؤقت |
  | `plugin-sdk/logging-core` | مساعدات التسجيل | مساعدات مسجّل النظام الفرعي والتنقيح |
  | `plugin-sdk/markdown-table-runtime` | مساعدات جداول Markdown | مساعدات وضع جداول Markdown |
  | `plugin-sdk/reply-payload` | أنواع الرد على الرسائل | أنواع حمولة الرد |
  | `plugin-sdk/provider-setup` | مساعدات منسّقة لإعداد المزوّد المحلي/المستضاف ذاتيًا | مساعدات اكتشاف/تكوين المزوّد المستضاف ذاتيًا |
  | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركّزة لإعداد مزوّد مستضاف ذاتيًا ومتوافق مع OpenAI | مساعدات اكتشاف/تكوين المزوّد المستضاف ذاتيًا نفسها |
  | `plugin-sdk/provider-auth-runtime` | مساعدات مصادقة وقت تشغيل المزوّد | مساعدات حل مفتاح API في وقت التشغيل |
  | `plugin-sdk/provider-auth-api-key` | مساعدات إعداد مفتاح API للمزوّد | مساعدات التهيئة/كتابة الملف التعريفي لمفتاح API |
  | `plugin-sdk/provider-auth-result` | مساعدات نتيجة مصادقة المزوّد | باني نتيجة مصادقة OAuth القياسي |
  | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي للمزوّد | مساعدات تسجيل الدخول التفاعلي المشتركة |
  | `plugin-sdk/provider-selection-runtime` | مساعدات اختيار المزوّد | اختيار المزوّد المكوّن أو التلقائي ودمج تكوين المزوّد الخام |
  | `plugin-sdk/provider-env-vars` | مساعدات متغيرات بيئة المزوّد | مساعدات البحث عن متغيرات بيئة مصادقة المزوّد |
  | `plugin-sdk/provider-model-shared` | مساعدات مشتركة لنموذج/إعادة تشغيل المزوّد | `ProviderReplayFamily`، و`buildProviderReplayFamilyHooks`، و`normalizeModelCompat`، وبناة سياسة إعادة التشغيل المشتركون، ومساعدات نقاط نهاية المزوّد، ومساعدات تطبيع معرّف النموذج |
  | `plugin-sdk/provider-catalog-shared` | مساعدات كتالوج المزوّد المشتركة | `findCatalogTemplate`، و`buildSingleProviderApiKeyCatalog`، و`buildManifestModelProviderConfig`، و`supportsNativeStreamingUsageCompat`، و`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | تصحيحات تهيئة المزوّد | مساعدات تكوين التهيئة |
  | `plugin-sdk/provider-http` | مساعدات HTTP للمزوّد | مساعدات HTTP/قدرات نقطة النهاية العامة للمزوّد، بما في ذلك مساعدات نموذج الأجزاء المتعددة لنسخ الصوت |
  | `plugin-sdk/provider-web-fetch` | مساعدات جلب الويب للمزوّد | مساعدات تسجيل/تخزين مزوّد جلب الويب مؤقتًا |
  | `plugin-sdk/provider-web-search-config-contract` | مساعدات تكوين بحث الويب للمزوّد | مساعدات ضيقة لتكوين/بيانات اعتماد بحث الويب للمزوّدين الذين لا يحتاجون إلى توصيل تفعيل Plugin |
  | `plugin-sdk/provider-web-search-contract` | مساعدات عقد بحث الويب للمزوّد | مساعدات ضيقة لعقد تكوين/بيانات اعتماد بحث الويب مثل `createWebSearchProviderContractFields`، و`enablePluginInConfig`، و`resolveProviderWebSearchPluginConfig`، ومحدّدات/مسترجعات بيانات الاعتماد ذات النطاق |
  | `plugin-sdk/provider-web-search` | مساعدات بحث الويب للمزوّد | مساعدات تسجيل/تخزين مؤقت/وقت تشغيل مزوّد بحث الويب |
  | `plugin-sdk/provider-tools` | مساعدات توافق أدوات/مخططات المزوّد | `ProviderToolCompatFamily`، و`buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | مساعدات استخدام المزوّد | `fetchClaudeUsage`، و`fetchGeminiUsage`، و`fetchGithubCopilotUsage`، ومساعدات استخدام مزوّد أخرى |
  | `plugin-sdk/provider-stream` | مساعدات مغلّف تدفق المزوّد | `ProviderStreamFamily`، و`buildProviderStreamFamilyHooks`، و`composeProviderStreamWrappers`، وأنواع مغلّفات التدفق، ومساعدات مغلّفات Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot المشتركة |
  | `plugin-sdk/provider-transport-runtime` | مساعدات نقل المزوّد | مساعدات نقل المزوّد الأصلية مثل الجلب المحروس، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
  | `plugin-sdk/keyed-async-queue` | قائمة انتظار غير متزامنة مرتبة | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | مساعدات الوسائط المشتركة | مساعدات جلب/تحويل/تخزين الوسائط، وفحص أبعاد الفيديو المدعوم بـ ffprobe، وبناة حمولات الوسائط |
  | `plugin-sdk/media-generation-runtime` | مساعدات إنشاء الوسائط المشتركة | مساعدات تجاوز الفشل المشتركة، واختيار المرشحين، ورسائل النموذج المفقود لإنشاء الصور/الفيديو/الموسيقى |
  | `plugin-sdk/media-understanding` | مساعدات فهم الوسائط | أنواع مزوّد فهم الوسائط بالإضافة إلى تصديرات مساعدات الصور/الصوت المواجهة للمزوّد |
  | `plugin-sdk/text-runtime` | مساعدات النص المشتركة | إزالة النص المرئي للمساعد، ومساعدات عرض/تقطيع/جداول Markdown، ومساعدات التنقيح، ومساعدات وسوم التوجيه، وأدوات النص الآمن، ومساعدات النص/التسجيل ذات الصلة |
  | `plugin-sdk/text-chunking` | مساعدات تقطيع النص | مساعد تقطيع النص الصادر |
  | `plugin-sdk/speech` | مساعدات الكلام | أنواع مزوّد الكلام بالإضافة إلى مساعدات التوجيه والسجل والتحقق المواجهة للمزوّد، وباني TTS المتوافق مع OpenAI |
  | `plugin-sdk/speech-core` | نواة الكلام المشتركة | أنواع مزوّد الكلام، والسجل، والتوجيهات، والتطبيع |
  | `plugin-sdk/realtime-transcription` | مساعدات النسخ في الوقت الحقيقي | أنواع المزوّد، ومساعدات السجل، ومساعد جلسة WebSocket المشتركة |
  | `plugin-sdk/realtime-voice` | مساعدات الصوت في الوقت الحقيقي | أنواع المزوّد، ومساعدات السجل/الحل، ومساعدات جلسة الجسر، وقوائم انتظار ردّ كلام الوكيل المشتركة، وصحة النص/الحدث، وكبح الصدى، ومساعدات استشارة السياق السريعة |
  | `plugin-sdk/image-generation` | مساعدات إنشاء الصور | أنواع مزوّد إنشاء الصور بالإضافة إلى مساعدات عنوان URL لأصول/بيانات الصور وباني مزوّد الصور المتوافق مع OpenAI |
  | `plugin-sdk/image-generation-core` | نواة إنشاء الصور المشتركة | أنواع إنشاء الصور، وتجاوز الفشل، والمصادقة، ومساعدات السجل |
  | `plugin-sdk/music-generation` | مساعدات إنشاء الموسيقى | أنواع مزوّد/طلب/نتيجة إنشاء الموسيقى |
  | `plugin-sdk/music-generation-core` | نواة إنشاء الموسيقى المشتركة | أنواع إنشاء الموسيقى، ومساعدات تجاوز الفشل، والبحث عن المزوّد، وتحليل مرجع النموذج |
  | `plugin-sdk/video-generation` | مساعدات إنشاء الفيديو | أنواع مزوّد/طلب/نتيجة إنشاء الفيديو |
  | `plugin-sdk/video-generation-core` | نواة إنشاء الفيديو المشتركة | أنواع إنشاء الفيديو، ومساعدات تجاوز الفشل، والبحث عن المزوّد، وتحليل مرجع النموذج |
  | `plugin-sdk/interactive-runtime` | مساعدات الرد التفاعلي | تطبيع/اختزال حمولة الرد التفاعلي |
  | `plugin-sdk/channel-config-primitives` | بدائيات تكوين القناة | بدائيات ضيقة لمخطط تكوين القناة |
  | `plugin-sdk/channel-config-writes` | مساعدات كتابة تكوين القناة | مساعدات تفويض كتابة تكوين القناة |
  | `plugin-sdk/channel-plugin-common` | تمهيد القناة المشترك | تصديرات تمهيد Plugin القناة المشتركة |
  | `plugin-sdk/channel-status` | مساعدات حالة القناة | مساعدات لقطة/ملخص حالة القناة المشتركة |
  | `plugin-sdk/allowlist-config-edit` | مساعدات تكوين قائمة السماح | مساعدات تحرير/قراءة تكوين قائمة السماح |
  | `plugin-sdk/group-access` | مساعدات وصول المجموعة | مساعدات قرار وصول المجموعة المشتركة |
  | `plugin-sdk/direct-dm` | مساعدات الرسائل المباشرة | مساعدات مصادقة/حراسة الرسائل المباشرة المشتركة |
  | `plugin-sdk/extension-shared` | مساعدات الامتداد المشتركة | بدائيات القناة السلبية/الحالة ومساعد الوكيل المحيط |
  | `plugin-sdk/webhook-targets` | مساعدات هدف Webhook | سجل أهداف Webhook ومساعدات تثبيت المسارات |
  | `plugin-sdk/webhook-path` | مساعدات مسار Webhook | مساعدات تطبيع مسار Webhook |
  | `plugin-sdk/web-media` | مساعدات وسائط الويب المشتركة | مساعدات تحميل الوسائط البعيدة/المحلية |
  | `plugin-sdk/zod` | إعادة تصدير Zod | `zod` معاد تصديره لمستهلكي SDK الخاصة بـ Plugin |
  | `plugin-sdk/memory-core` | مساعدات memory-core المضمّنة | سطح مساعدات مدير/تكوين/ملف/CLI للذاكرة |
  | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل محرك الذاكرة | واجهة وقت تشغيل فهرسة/بحث الذاكرة |
  | `plugin-sdk/memory-core-host-engine-foundation` | محرك أساس مضيف الذاكرة | تصديرات محرك أساس مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-embeddings` | محرك تضمين مضيف الذاكرة | عقود تضمين الذاكرة، ووصول السجل، والمزوّد المحلي، ومساعدات الدفعات/البعيد العامة؛ المزوّدون البعيدون المحددون موجودون في Plugins المالكة لهم |
  | `plugin-sdk/memory-core-host-engine-qmd` | محرك QMD لمضيف الذاكرة | تصديرات محرك QMD لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-storage` | محرك تخزين مضيف الذاكرة | تصديرات محرك تخزين مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-multimodal` | مساعدات مضيف الذاكرة متعدد الوسائط | مساعدات مضيف الذاكرة متعدد الوسائط |
  | `plugin-sdk/memory-core-host-query` | مساعدات استعلام مضيف الذاكرة | مساعدات استعلام مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-secret` | مساعدات سر مضيف الذاكرة | مساعدات سر مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-events` | مساعدات سجل أحداث مضيف الذاكرة | مساعدات سجل أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة | مساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-cli` | وقت تشغيل CLI لمضيف الذاكرة | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-core` | وقت تشغيل نواة مضيف الذاكرة | مساعدات وقت تشغيل نواة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-files` | مساعدات ملفات/وقت تشغيل مضيف الذاكرة | مساعدات ملفات/وقت تشغيل مضيف الذاكرة |
  | `plugin-sdk/memory-host-core` | اسم مستعار لوقت تشغيل نواة مضيف الذاكرة | اسم مستعار محايد للبائع لمساعدات وقت تشغيل نواة مضيف الذاكرة |
  | `plugin-sdk/memory-host-events` | اسم مستعار لسجل أحداث مضيف الذاكرة | اسم مستعار محايد للبائع لمساعدات سجل أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-host-files` | اسم مستعار لملفات/وقت تشغيل مضيف الذاكرة | اسم مستعار محايد للبائع لمساعدات ملفات/وقت تشغيل مضيف الذاكرة |
  | `plugin-sdk/memory-host-markdown` | مساعدات Markdown المُدارة | مساعدات Markdown مُدارة مشتركة لـ Plugins المجاورة للذاكرة |
  | `plugin-sdk/memory-host-search` | واجهة بحث Active Memory | واجهة وقت تشغيل كسولة لمدير بحث Active Memory |
  | `plugin-sdk/memory-host-status` | اسم مستعار لحالة مضيف الذاكرة | اسم مستعار محايد للبائع لمساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/testing` | أدوات الاختبار | حزمة توافق عريضة قديمة؛ فضّل المسارات الفرعية المركّزة للاختبار مثل `plugin-sdk/plugin-test-runtime`، و`plugin-sdk/channel-test-helpers`، و`plugin-sdk/channel-target-testing`، و`plugin-sdk/test-env`، و`plugin-sdk/test-fixtures` |
</Accordion>

هذا الجدول هو عمدا مجموعة فرعية مشتركة للهجرة، وليس سطح SDK
الكامل. توجد القائمة الكاملة التي تضم أكثر من 200 نقطة دخول في
`scripts/lib/plugin-sdk-entrypoints.json`.

تم إيقاف واجهات المساعدة المحجوزة الخاصة بالـ Plugin المضمّنة من خريطة
تصدير SDK العامة، باستثناء واجهات التوافق الموثقة صراحة، مثل الواجهة
المهملة `plugin-sdk/discord` التي أُبقي عليها للحزمة المنشورة
`@openclaw/discord@2026.3.13`. توجد أدوات المساعدة الخاصة بالمالك داخل
حزمة الـ Plugin المالكة؛ ويجب أن ينتقل سلوك المضيف المشترك عبر عقود SDK
العامة مثل `plugin-sdk/gateway-runtime` و`plugin-sdk/security-runtime`
و`plugin-sdk/plugin-config-runtime`.

استخدم أضيق استيراد يطابق المهمة. إذا تعذر عليك العثور على تصدير،
فافحص المصدر في `src/plugin-sdk/` أو اسأل المشرفين عن العقد العام
الذي يجب أن يملكه.

## الإهمالات النشطة

إهمالات أضيق تنطبق عبر SDK الخاص بالـ Plugin، وعقد المزوّد،
وسطح وقت التشغيل، والبيان. لا يزال كل منها يعمل اليوم، لكنه سيُزال
في إصدار رئيسي مستقبلي. يربط الإدخال أسفل كل عنصر واجهة API القديمة
بالبديل القياسي لها.

<AccordionGroup>
  <Accordion title="بُنّاء مساعدة command-auth ← command-status">
    **القديم (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **الجديد (`openclaw/plugin-sdk/command-status`)**: التواقيع نفسها،
    والتصديرات نفسها - لكن يتم استيرادها من المسار الفرعي الأضيق.
    يعيد `command-auth` تصديرها كواجهات توافق.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="أدوات مساعدة حجب الإشارة ← resolveInboundMentionDecision">
    **القديم**: `resolveInboundMentionRequirement({ facts, policy })` و
    `shouldDropInboundForMention(...)` من
    `openclaw/plugin-sdk/channel-inbound` أو
    `openclaw/plugin-sdk/channel-mention-gating`.

    **الجديد**: `resolveInboundMentionDecision({ facts, policy })` - يعيد
    كائن قرار واحدا بدلا من استدعاءين منفصلين.

    تحولت إضافات القنوات اللاحقة (Slack، Discord، Matrix، MS Teams) بالفعل.

  </Accordion>

  <Accordion title="واجهة توافق وقت تشغيل القناة وأدوات مساعدة إجراءات القناة">
    `openclaw/plugin-sdk/channel-runtime` هي واجهة توافق لإضافات القنوات
    الأقدم. لا تستوردها من كود جديد؛ استخدم
    `openclaw/plugin-sdk/channel-runtime-context` لتسجيل كائنات وقت التشغيل.

    أدوات المساعدة `channelActions*` في `openclaw/plugin-sdk/channel-actions`
    مهملة إلى جانب تصديرات القنوات الخام الخاصة بـ "actions". اعرض القدرات
    عبر سطح `presentation` الدلالي بدلا من ذلك - تصرّح إضافات القنوات بما
    تعرضه (بطاقات، أزرار، قوائم اختيار) بدلا من أسماء الإجراءات الخام
    التي تقبلها.

  </Accordion>

  <Accordion title="أداة المساعدة tool() لمزوّد بحث الويب ← createTool() على الـ Plugin">
    **القديم**: مصنع `tool()` من `openclaw/plugin-sdk/provider-web-search`.

    **الجديد**: نفّذ `createTool(...)` مباشرة على Plugin المزوّد.
    لم يعد OpenClaw بحاجة إلى أداة SDK المساعدة لتسجيل مغلّف الأداة.

  </Accordion>

  <Accordion title="أغلفة القنوات ذات النص الصريح ← BodyForAgent">
    **القديم**: `formatInboundEnvelope(...)` (و
    `ChannelMessageForAgent.channelEnvelope`) لبناء غلاف مطالبة نصي مسطح
    من رسائل القنوات الواردة.

    **الجديد**: `BodyForAgent` مع كتل سياق مستخدم منظمة. ترفق إضافات
    القنوات بيانات التوجيه الوصفية (المحادثة، الموضوع، الرد على، التفاعلات)
    كحقول ذات أنواع بدلا من دمجها في سلسلة مطالبة. لا تزال أداة المساعدة
    `formatAgentEnvelope(...)` مدعومة للأغلفة المُنشأة الموجهة إلى المساعد،
    لكن الأغلفة النصية الصريحة الواردة في طريقها إلى الإزالة.

    المناطق المتأثرة: `inbound_claim` و`message_received` وأي Plugin قناة
    مخصص كان يعالج نص `channelEnvelope` بعديا.

  </Accordion>

  <Accordion title="أنواع اكتشاف المزوّد ← أنواع كتالوج المزوّد">
    أصبحت أربعة أسماء مستعارة لأنواع الاكتشاف الآن مغلفات رقيقة فوق
    أنواع عصر الكتالوج:

    | الاسم المستعار القديم      | النوع الجديد                |
    | -------------------------- | --------------------------- |
    | `ProviderDiscoveryOrder`   | `ProviderCatalogOrder`      |
    | `ProviderDiscoveryContext` | `ProviderCatalogContext`    |
    | `ProviderDiscoveryResult`  | `ProviderCatalogResult`     |
    | `ProviderPluginDiscovery`  | `ProviderPluginCatalog`     |

    بالإضافة إلى الحقيبة الثابتة القديمة `ProviderCapabilities` - يجب
    أن تستخدم إضافات المزوّد خطافات مزوّد صريحة مثل `buildReplayPolicy`
    و`normalizeToolSchemas` و`wrapStreamFn` بدلا من كائن ثابت.

  </Accordion>

  <Accordion title="خطافات سياسة التفكير ← resolveThinkingProfile">
    **القديم** (ثلاثة خطافات منفصلة على `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)` و`supportsXHighThinking(ctx)` و
    `resolveDefaultThinkingLevel(ctx)`.

    **الجديد**: `resolveThinkingProfile(ctx)` واحد يعيد
    `ProviderThinkingProfile` يتضمن `id` القياسي، و`label` اختياريا،
    وقائمة مستويات مرتبة. يخفض OpenClaw القيم القديمة المخزنة تلقائيا
    حسب رتبة الملف الشخصي.

    نفّذ خطافا واحدا بدلا من ثلاثة. تظل الخطافات القديمة تعمل خلال نافذة
    الإهمال، لكنها لا تُركّب مع نتيجة الملف الشخصي.

  </Accordion>

  <Accordion title="رجوع مزوّد OAuth خارجي ← contracts.externalAuthProviders">
    **القديم**: تنفيذ `resolveExternalOAuthProfiles(...)` من دون التصريح
    بالمزوّد في بيان الـ Plugin.

    **الجديد**: صرّح بـ `contracts.externalAuthProviders` في بيان الـ Plugin
    **ونفّذ** `resolveExternalAuthProfiles(...)`. يصدر مسار "auth fallback"
    القديم تحذيرا في وقت التشغيل وسيُزال.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="بحث متغيرات بيئة المزوّد ← setup.providers[].envVars">
    حقل البيان **القديم**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **الجديد**: انسخ بحث متغير البيئة نفسه إلى `setup.providers[].envVars`
    في البيان. يدمج هذا بيانات تعريف بيئة الإعداد/الحالة في مكان واحد
    ويتجنب تشغيل وقت تشغيل الـ Plugin لمجرد الإجابة عن عمليات بحث
    متغيرات البيئة.

    يظل `providerAuthEnvVars` مدعوما عبر محول توافق حتى تُغلق نافذة الإهمال.

  </Accordion>

  <Accordion title="تسجيل Plugin الذاكرة ← registerMemoryCapability">
    **القديم**: ثلاثة استدعاءات منفصلة -
    `api.registerMemoryPromptSection(...)`،
    `api.registerMemoryFlushPlan(...)`،
    `api.registerMemoryRuntime(...)`.

    **الجديد**: استدعاء واحد على واجهة API لحالة الذاكرة -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    الفتحات نفسها، واستدعاء تسجيل واحد. لا تتأثر أدوات الذاكرة المساعدة
    الإضافية (`registerMemoryPromptSupplement` و`registerMemoryCorpusSupplement`
    و`registerMemoryEmbeddingProvider`).

  </Accordion>

  <Accordion title="إعادة تسمية أنواع رسائل جلسات العامل الفرعي">
    لا يزال اسما نوعين مستعارين قديمين مُصدّرين من `src/plugins/runtime/types.ts`:

    | القديم                         | الجديد                           |
    | ------------------------------ | -------------------------------- |
    | `SubagentReadSessionParams`    | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`    | `SubagentGetSessionMessagesResult` |

    طريقة وقت التشغيل `readSession` مهملة لصالح `getSessionMessages`.
    التوقيع نفسه؛ تستدعي الطريقة القديمة الطريقة الجديدة.

  </Accordion>

  <Accordion title="runtime.tasks.flow ← runtime.tasks.managedFlows">
    **القديم**: `runtime.tasks.flow` (بصيغة المفرد) كان يعيد موصّلا حيا
    لتدفق المهام.

    **الجديد**: يحتفظ `runtime.tasks.managedFlows` بوقت تشغيل تعديل TaskFlow
    المُدار للإضافات التي تنشئ أو تحدّث أو تلغي أو تشغّل مهام فرعية من
    تدفق. استخدم `runtime.tasks.flows` عندما يحتاج الـ Plugin فقط إلى
    قراءات مبنية على DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="مصانع الإضافات المضمّنة ← وسيط نتائج أدوات الوكيل">
    مغطى في "كيفية الهجرة ← ترحيل إضافات نتائج أدوات Pi إلى الوسيط" أعلاه.
    أُدرج هنا للاكتمال: تم استبدال مسار Pi-only المحذوف
    `api.registerEmbeddedExtensionFactory(...)` بـ
    `api.registerAgentToolResultMiddleware(...)` مع قائمة وقت تشغيل صريحة
    في `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="الاسم المستعار OpenClawSchemaType ← OpenClawConfig">
    أصبح `OpenClawSchemaType` المعاد تصديره من `openclaw/plugin-sdk`
    اسما مستعارا من سطر واحد لـ `OpenClawConfig`. فضّل الاسم القياسي.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
تُتتبع إهمالات مستوى الإضافة (داخل إضافات القنوات/المزوّدين المضمّنة ضمن
`extensions/`) داخل حاويات `api.ts` و`runtime-api.ts` الخاصة بها. لا تؤثر
في عقود إضافات الطرف الثالث، وليست مدرجة هنا. إذا كنت تستهلك حاوية محلية
لـ Plugin مضمّن مباشرة، فاقرأ تعليقات الإهمال في تلك الحاوية قبل الترقية.
</Note>

## الجدول الزمني للإزالة

| متى                    | ما الذي يحدث                                                         |
| ---------------------- | -------------------------------------------------------------------- |
| **الآن**               | تصدر الأسطح المهملة تحذيرات وقت التشغيل                              |
| **الإصدار الرئيسي التالي** | ستُزال الأسطح المهملة؛ وستفشل الإضافات التي لا تزال تستخدمها        |

تم ترحيل جميع إضافات النواة بالفعل. يجب على الإضافات الخارجية الهجرة
قبل الإصدار الرئيسي التالي.

## كتم التحذيرات مؤقتا

عيّن متغيرات البيئة هذه أثناء العمل على الهجرة:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

هذا مخرج مؤقت، وليس حلا دائما.

## ذات صلة

- [البدء](/ar/plugins/building-plugins) - أنشئ أول Plugin لك
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - مرجع استيراد المسارات الفرعية الكامل
- [إضافات القنوات](/ar/plugins/sdk-channel-plugins) - بناء إضافات القنوات
- [إضافات المزوّدين](/ar/plugins/sdk-provider-plugins) - بناء إضافات المزوّدين
- [داخليات الـ Plugin](/ar/plugins/architecture) - تعمق في البنية
- [بيان الـ Plugin](/ar/plugins/manifest) - مرجع مخطط البيان
