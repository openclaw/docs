---
read_when:
    - يظهر لك تحذير OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - تظهر لك رسالة التحذير OPENCLAW_EXTENSION_API_DEPRECATED
    - استخدمت api.registerEmbeddedExtensionFactory قبل OpenClaw 2026.4.25
    - أنت تقوم بتحديث Plugin إلى معمارية Plugin الحديثة
    - تتولى صيانة Plugin خارجي لـ OpenClaw
sidebarTitle: Migrate to SDK
summary: الترحيل من طبقة التوافق العكسي القديمة إلى SDK الحديث الخاص بـ Plugin
title: ترحيل SDK الخاص بـ Plugin
x-i18n:
    generated_at: "2026-05-10T19:54:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7595b41c15ce36dd8d2a3faf320cc9847b013b1f4807c02b8b97c6feaee4415
    source_path: plugins/sdk-migration.md
    workflow: 16
---

انتقل OpenClaw من طبقة توافق عكسي واسعة إلى بنية Plugin حديثة
ذات عمليات استيراد مركزة وموثقة. إذا كان Plugin لديك قد بُني قبل
البنية الجديدة، فسيساعدك هذا الدليل على الترحيل.

## ما الذي يتغير

كان نظام Plugin القديم يوفر سطحين مفتوحين على نطاق واسع يسمحان لـ Plugins باستيراد
أي شيء تحتاجه من نقطة دخول واحدة:

- **`openclaw/plugin-sdk/compat`** - عملية استيراد واحدة أعادت تصدير عشرات
  المساعدات. قُدمت لإبقاء Plugins القديمة المعتمدة على الخطافات تعمل بينما كانت
  بنية Plugin الجديدة قيد البناء.
- **`openclaw/plugin-sdk/infra-runtime`** - حزمة مساعدات تشغيل واسعة
  مزجت أحداث النظام، وحالة Heartbeat، وصفوف التسليم، ومساعدات الجلب/الوكيل،
  ومساعدات الملفات، وأنواع الموافقة، وأدوات غير مترابطة.
- **`openclaw/plugin-sdk/config-runtime`** - حزمة توافق إعدادات واسعة
  لا تزال تحمل مساعدات التحميل/الكتابة المباشرة المهملة أثناء نافذة الترحيل.
- **`openclaw/extension-api`** - جسر منح Plugins وصولا مباشرا إلى
  مساعدات جانب المضيف مثل مشغّل الوكيل المضمّن.
- **`api.registerEmbeddedExtensionFactory(...)`** - خطاف إضافة مضمّنة خاص بـ Pi
  وقد أُزيل، وكان يستطيع مراقبة أحداث المشغّل المضمّن مثل
  `tool_result`.

أصبحت أسطح الاستيراد الواسعة الآن **مهملة**. لا تزال تعمل وقت التشغيل،
لكن يجب ألا تستخدمها Plugins الجديدة، وينبغي أن ترحّل Plugins الموجودة قبل
أن يزيلها الإصدار الرئيسي التالي. أُزيلت واجهة API الخاصة بتسجيل مصنع الإضافات
المضمّنة الخاص بـ Pi؛ استخدم وسيط نتائج الأدوات بدلا منها.

لا يزيل OpenClaw سلوك Plugin الموثق أو يعيد تفسيره في التغيير نفسه
الذي يقدم بديلا. يجب أن تمر تغييرات العقد الكاسرة أولا عبر
محوّل توافق، وتشخيصات، ووثائق، ونافذة إهمال.
ينطبق ذلك على عمليات استيراد SDK، وحقول البيان، وواجهات API الخاصة بالإعداد، والخطافات، وسلوك
التسجيل وقت التشغيل.

<Warning>
  ستُزال طبقة التوافق العكسي في إصدار رئيسي مستقبلي.
  ستتعطل Plugins التي لا تزال تستورد من هذه الأسطح عندما يحدث ذلك.
  لم تعد تسجيلات مصانع الإضافات المضمّنة الخاصة بـ Pi تُحمّل بالفعل.
</Warning>

## لماذا تغير هذا

تسبب النهج القديم في مشكلات:

- **بدء تشغيل بطيء** - كان استيراد مساعد واحد يحمّل عشرات الوحدات غير المرتبطة
- **اعتماديات دائرية** - جعلت عمليات إعادة التصدير الواسعة إنشاء دورات استيراد أمرا سهلا
- **سطح API غير واضح** - لم تكن هناك طريقة لمعرفة أي الصادرات مستقرة وأيها داخلية

يصلح SDK الحديث لـ Plugin هذا: كل مسار استيراد (`openclaw/plugin-sdk/\<subpath\>`)
هو وحدة صغيرة مستقلة بذاتها ذات غرض واضح وعقد موثق.

أزيلت أيضا مسارات التسهيل القديمة للمزوّدين الخاصة بالقنوات المضمّنة.
كانت مسارات المساعدات ذات علامات القنوات اختصارات خاصة بالمستودع الأحادي، وليست
عقود Plugin مستقرة. استخدم بدلا منها مسارات SDK فرعية عامة وضيقة. داخل مساحة عمل
Plugin المضمّن، أبقِ المساعدات المملوكة للمزوّد في `api.ts` أو
`runtime-api.ts` الخاصين بذلك Plugin نفسه.

أمثلة المزوّدين المضمّنين الحالية:

- يحتفظ Anthropic بمساعدات التدفق الخاصة بـ Claude في مسار `api.ts` /
  `contract-api.ts` الخاص به
- يحتفظ OpenAI ببناة المزوّد، ومساعدات النموذج الافتراضي، وبناة مزوّد
  الوقت الفعلي في `api.ts` الخاص به
- يحتفظ OpenRouter بباني المزوّد ومساعدات الإعداد/التكوين في
  `api.ts` الخاص به

## خطة ترحيل Talk والصوت في الوقت الفعلي

تنتقل شيفرة Talk الخاصة بالصوت في الوقت الفعلي، والاتصالات الهاتفية، والاجتماعات، والمتصفح من
تتبّع الأدوار المحلي لكل سطح إلى متحكم جلسة Talk مشترك يصدّره
`openclaw/plugin-sdk/realtime-voice`. يملك المتحكم الجديد غلاف أحداث Talk
المشترك، وحالة الدور النشط، وحالة الالتقاط، وحالة إخراج الصوت، وسجل
الأحداث الحديثة، ورفض الأدوار القديمة. ينبغي لـ Plugins المزوّدين أن تواصل امتلاك
جلسات الوقت الفعلي الخاصة بالبائع؛ وينبغي لـ Plugins الأسطح أن تواصل امتلاك خصائص الالتقاط،
والتشغيل، والاتصالات الهاتفية، والاجتماعات.

ترحيل Talk هذا كاسر عن قصد وبشكل نظيف:

1. أبقِ بدائيات المتحكم/التشغيل المشتركة في
   `plugin-sdk/realtime-voice`.
2. انقل الأسطح المضمّنة إلى المتحكم المشترك: ترحيل المتصفح،
   وتسليم الغرف المُدارة، والوقت الفعلي للمكالمات الصوتية، وSTT المتدفق للمكالمات الصوتية، ووقت Google
   Meet الفعلي، وميزة الضغط للتحدث الأصلية.
3. استبدل عائلات RPC القديمة الخاصة بـ Talk بواجهة API النهائية `talk.session.*` و
   `talk.client.*`.
4. أعلن عن قناة أحداث Talk حية واحدة في
   `hello-ok.features.events` الخاصة بـ Gateway: `talk.event`.
5. احذف نقطة نهاية HTTP القديمة الخاصة بالوقت الفعلي وأي مسار لتجاوز التعليمات
   وقت الطلب.

ينبغي ألا تستدعي الشيفرة الجديدة `createTalkEventSequencer(...)` مباشرة إلا إذا كانت
تنفذ محوّلا منخفض المستوى أو تجهيز اختبار. فضّل المتحكم المشترك
حتى لا يمكن إصدار الأحداث ذات نطاق الدور من دون معرّف دور، ولا يمكن لاستدعاءات `turnEnd` /
`turnCancel` القديمة أن تمسح دورا أحدث نشطا، وتبقى أحداث دورة حياة
إخراج الصوت متسقة عبر الاتصالات الهاتفية، والاجتماعات، وترحيل المتصفح، وتسليم الغرف المُدارة،
وعملاء Talk الأصليين.

شكل واجهة API العامة المستهدف هو:

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
```

تستخدم جلسات WebRTC/مقبس ويب المزوّد المملوكة للمتصفح `talk.client.create`،
لأن المتصفح يملك تفاوض المزوّد ونقل الوسائط بينما يملك
Gateway بيانات الاعتماد، والتعليمات، وسياسة الأدوات. `talk.session.*` هو
السطح المشترك المُدار من Gateway للوقت الفعلي عبر gateway-relay، والنسخ عبر gateway-relay،
وجلسات STT/TTS الأصلية للغرف المُدارة.

ينبغي إصلاح الإعدادات القديمة التي وضعت محددات الوقت الفعلي بجانب `talk.provider` /
`talk.providers` باستخدام `openclaw doctor --fix`؛ لا يعيد Talk وقت التشغيل
تفسير إعداد مزوّد الكلام/TTS بوصفه إعداد مزوّد وقت فعلي.

مجموعات `talk.session.create` المدعومة صغيرة عن قصد:

| الوضع            | النقل       | العقل           | المالك              | ملاحظات                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | صوت مزوّد ثنائي الاتجاه بالكامل موصول عبر Gateway؛ تُوجّه استدعاءات الأدوات عبر أداة agent-consult.      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | STT متدفق فقط؛ يرسل المستدعون صوت إدخال ويتلقون أحداث النص المنسوخ.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | غرفة أصلية/عميل | غرف بأسلوب الضغط للتحدث واللاسلكي حيث يملك العميل الالتقاط/التشغيل ويملك Gateway حالة الدور. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | غرفة أصلية/عميل | وضع غرفة للمديرين فقط للأسطح الموثوقة من الطرف الأول التي تنفذ إجراءات أدوات Gateway مباشرة.                  |

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

مفردات التحكم الموحدة ضيقة عمدا أيضا:

| الطريقة                          | ينطبق على                                              | العقد                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | ألحق مقطعا صوتيا بصيغة PCM ومشفرا بـ base64 بجلسة المزوّد المملوكة لاتصال Gateway نفسه.                                                                                            |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | ابدأ دور مستخدم في غرفة مُدارة.                                                                                                                                                          |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | أنهِ الدور النشط بعد التحقق من الدور القديم.                                                                                                                                         |
| `talk.session.cancelTurn`       | كل الجلسات المملوكة لـ Gateway                              | ألغِ عمل الالتقاط/المزوّد/الوكيل/TTS النشط لدور.                                                                                                                                |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | أوقف إخراج صوت المساعد من دون إنهاء دور المستخدم بالضرورة.                                                                                                                    |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | أكمل استدعاء أداة المزوّد الصادر من الترحيل؛ مرر `options.willContinue` للإخراج المؤقت أو `options.suppressResponse` لتلبية الاستدعاء من دون استجابة مساعد أخرى. |
| `talk.session.close`            | كل الجلسات الموحدة                                    | أوقف جلسات الترحيل أو ألغِ حالة الغرفة المُدارة، ثم انسَ معرّف الجلسة الموحدة.                                                                                                    |

  لا تضف حالات خاصة للمزوّد أو المنصة في النواة لجعل هذا يعمل.
  النواة تملك دلالات جلسة Talk. وتملك Plugins الخاصة بالمزوّدين إعداد جلسات المورّدين.
  وتملك مكالمات الصوت وGoogle Meet محولات الاتصال الهاتفي/الاجتماعات. وتملك المتصفحات والتطبيقات الأصلية تجربة مستخدم التقاط الجهاز/التشغيل.

  ## سياسة التوافق

  بالنسبة إلى Plugins الخارجية، يتبع عمل التوافق هذا الترتيب:

  1. أضف العقد الجديد
  2. أبقِ السلوك القديم موصولًا عبر محول توافق
  3. أصدر تشخيصًا أو تحذيرًا يذكر المسار القديم والبديل
  4. غطِّ كلا المسارين في الاختبارات
  5. وثّق الإهمال ومسار الترحيل
  6. أزِل فقط بعد نافذة الترحيل المعلنة، عادةً في إصدار رئيسي

  يمكن للمشرفين تدقيق قائمة انتظار الترحيل الحالية باستخدام
  `pnpm plugins:boundary-report`. استخدم `pnpm plugins:boundary-report:summary` للحصول على
  أعداد مضغوطة، و`--owner <id>` من أجل Plugin واحد أو مالك توافق واحد، و
  `pnpm plugins:boundary-report:ci` عندما يجب أن تفشل بوابة CI بسبب سجلات توافق
  مستحقة، أو استيرادات SDK محجوزة عابرة للمالكين، أو مسارات فرعية محجوزة غير مستخدمة في SDK. يجمع التقرير سجلات
  التوافق المهملة حسب تاريخ الإزالة، ويحصي مراجع الكود/الوثائق المحلية،
  ويعرض استيرادات SDK المحجوزة العابرة للمالكين، ويلخص جسر SDK الخاص بمضيف
  الذاكرة بحيث يبقى تنظيف التوافق صريحًا بدلًا من
  الاعتماد على عمليات بحث مرتجلة. يجب أن يكون للمسارات الفرعية المحجوزة في SDK استخدام مالك متتبع؛
  ويجب إزالة تصديرات المساعدين المحجوزة غير المستخدمة من SDK العام.

  إذا كان حقل في البيان لا يزال مقبولًا، فيمكن لمؤلفي Plugins الاستمرار في استخدامه حتى
  تقول الوثائق والتشخيصات غير ذلك. يجب أن يفضّل الكود الجديد البديل الموثق،
  لكن لا ينبغي أن تتعطل Plugins الحالية أثناء الإصدارات الفرعية العادية.

  ## كيفية الترحيل

  <Steps>
  <Step title="رحّل مساعدات تحميل/كتابة إعدادات وقت التشغيل">
    يجب أن تتوقف Plugins المضمّنة عن استدعاء
    `api.runtime.config.loadConfig()` و
    `api.runtime.config.writeConfigFile(...)` مباشرةً. فضّل الإعدادات التي تم
    تمريرها بالفعل إلى مسار الاستدعاء النشط. يمكن للمعالجات طويلة العمر التي تحتاج إلى
    لقطة العملية الحالية استخدام `api.runtime.config.current()`. ويجب أن تستخدم
    أدوات الوكيل طويلة العمر `ctx.getRuntimeConfig()` الخاصة بسياق الأداة داخل
    `execute` بحيث تظل الأداة التي أُنشئت قبل كتابة إعدادات ترى إعدادات
    وقت التشغيل المحدّثة.

    يجب أن تمر كتابات الإعدادات عبر المساعدات التعاملية وأن تختار سياسة
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
    أن التغيير يتطلب إعادة تشغيل نظيفة للـ Gateway، و
    `afterWrite: { mode: "none", reason: "..." }` فقط عندما يملك المستدعي
    المتابعة ويريد عمدًا كبت مخطط إعادة التحميل.
    تتضمن نتائج التعديل ملخص `followUp` ذا نوع محدد للاختبارات والتسجيل؛
    ويظل Gateway مسؤولًا عن تطبيق إعادة التشغيل أو جدولتها.
    تبقى `loadConfig` و`writeConfigFile` مساعدات توافق مهملة
    لـ Plugins الخارجية أثناء نافذة الترحيل وتحذر مرة واحدة باستخدام
    رمز التوافق `runtime-config-load-write`. وتتم حماية Plugins المضمّنة وكود
    وقت التشغيل في المستودع بواسطة حواجز فحص في
    `pnpm check:deprecated-api-usage` و
    `pnpm check:no-runtime-action-load-config`: يفشل الاستخدام الإنتاجي الجديد في Plugin
    مباشرةً، وتفشل كتابات الإعدادات المباشرة، ويجب أن تستخدم طرائق خادم Gateway
    لقطة وقت التشغيل الخاصة بالطلب، ويجب أن تتلقى مساعدات إرسال/إجراء/عميل قنوات
    وقت التشغيل الإعدادات من حدّها، ولا يُسمح لوحدات وقت التشغيل طويلة العمر بأي
    استدعاءات محيطة لـ `loadConfig()`.

    يجب أن يتجنب كود Plugin الجديد أيضًا استيراد البرميل الواسع للتوافق
    `openclaw/plugin-sdk/config-runtime`. استخدم المسار الفرعي الضيق من
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

    تخضع Plugins المضمّنة واختباراتها لحماية فاحص ضد البرميل الواسع
    بحيث تبقى الاستيرادات والمحاكيات محلية للسلوك الذي تحتاجه. لا يزال البرميل الواسع
    موجودًا للتوافق الخارجي، لكن يجب ألا يعتمد عليه الكود الجديد.

  </Step>

  <Step title="رحّل امتدادات نتائج أدوات Pi إلى وسيط">
    يجب على Plugins المضمّنة استبدال معالجات نتائج الأدوات الخاصة بـ Pi فقط
    `api.registerEmbeddedExtensionFactory(...)` بوسيط محايد لوقت التشغيل.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    حدّث بيان Plugin في الوقت نفسه:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    لا يمكن لـ Plugins الخارجية تسجيل وسيط نتائج الأدوات لأنه يستطيع
    إعادة كتابة مخرجات الأدوات عالية الثقة قبل أن يراها النموذج.

  </Step>

  <Step title="رحّل معالجات الموافقة الأصلية إلى حقائق القدرة">
    تعرض Plugins القنوات القادرة على الموافقة الآن سلوك الموافقة الأصلي عبر
    `approvalCapability.nativeRuntime` بالإضافة إلى سجل سياق وقت التشغيل المشترك.

    التغييرات الرئيسية:

    - استبدل `approvalCapability.handler.loadRuntime(...)` بـ
      `approvalCapability.nativeRuntime`
    - انقل المصادقة/التسليم الخاصة بالموافقة بعيدًا عن توصيلات `plugin.auth` /
      `plugin.approvals` القديمة إلى `approvalCapability`
    - تمت إزالة `ChannelPlugin.approvals` من عقد Plugin القناة العام؛ انقل حقول التسليم/الأصلي/العرض إلى `approvalCapability`
    - يبقى `plugin.auth` لتدفقات تسجيل الدخول/الخروج الخاصة بالقنوات فقط؛ لم تعد النواة تقرأ خطافات مصادقة الموافقة هناك
    - سجّل كائنات وقت التشغيل المملوكة للقناة مثل العملاء أو الرموز أو تطبيقات Bolt عبر `openclaw/plugin-sdk/channel-runtime-context`
    - لا ترسل إشعارات إعادة التوجيه المملوكة للـ Plugin من معالجات الموافقة الأصلية؛ أصبحت النواة تملك إشعارات التوجيه إلى مكان آخر من نتائج التسليم الفعلية
    - عند تمرير `channelRuntime` إلى `createChannelManager(...)`، وفّر سطحًا حقيقيًا من `createPluginRuntime().channel`. تُرفض العناصر الجزئية الزائفة.

    راجع `/plugins/sdk-channel-plugins` لتخطيط قدرة الموافقة الحالي.

  </Step>

  <Step title="دقّق سلوك الرجوع الاحتياطي لمغلّف Windows">
    إذا كان Plugin الخاص بك يستخدم `openclaw/plugin-sdk/windows-spawn`، فإن مغلّفات Windows
    `.cmd`/`.bat` غير المحلولة تفشل الآن بإغلاق آمن ما لم تمرر صراحةً
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

  <Step title="استبدلها باستيرادات مركزة">
    كل تصدير من السطح القديم يقابل مسار استيراد حديثًا محددًا:

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

  <Step title="استبدل استيرادات infra-runtime الواسعة">
    لا يزال `openclaw/plugin-sdk/infra-runtime` موجودًا للتوافق الخارجي،
    لكن يجب أن يستورد الكود الجديد سطح المساعد المركز الذي
    يحتاجه فعلًا:

    | الحاجة | الاستيراد |
    | --- | --- |
    | مساعدات قائمة انتظار أحداث النظام | `openclaw/plugin-sdk/system-event-runtime` |
    | مساعدات إيقاظ Heartbeat والحدث والرؤية | `openclaw/plugin-sdk/heartbeat-runtime` |
    | تفريغ قائمة انتظار التسليم المعلّقة | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | قياسات نشاط القناة | `openclaw/plugin-sdk/channel-activity-runtime` |
    | ذاكرات تخزين مؤقتة لإزالة التكرار داخل الذاكرة | `openclaw/plugin-sdk/dedupe-runtime` |
    | مساعدات مسارات الملفات/الوسائط المحلية الآمنة | `openclaw/plugin-sdk/file-access-runtime` |
    | جلب مدرك للموزّع | `openclaw/plugin-sdk/runtime-fetch` |
    | مساعدات الوكيل والجلب المحروس | `openclaw/plugin-sdk/fetch-runtime` |
    | أنواع سياسة موزّع SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | أنواع طلب/حل الموافقة | `openclaw/plugin-sdk/approval-runtime` |
    | مساعدات حمولة رد الموافقة والأوامر | `openclaw/plugin-sdk/approval-reply-runtime` |
    | مساعدات تنسيق الأخطاء | `openclaw/plugin-sdk/error-runtime` |
    | انتظار جاهزية النقل | `openclaw/plugin-sdk/transport-ready-runtime` |
    | مساعدات الرموز الآمنة | `openclaw/plugin-sdk/secure-random-runtime` |
    | تزامن مهام غير متزامنة محدود | `openclaw/plugin-sdk/concurrency-runtime` |
    | الإكراه الرقمي | `openclaw/plugin-sdk/number-runtime` |
    | قفل غير متزامن محلي للعملية | `openclaw/plugin-sdk/async-lock-runtime` |
    | أقفال الملفات | `openclaw/plugin-sdk/file-lock` |

    تخضع Plugins المضمّنة لحماية فاحص ضد `infra-runtime`، لذلك لا يمكن لكود المستودع
    أن يتراجع إلى البرميل الواسع.

  </Step>

  <Step title="رحّل مساعدات مسارات القنوات">
    يجب أن يستخدم كود مسارات القنوات الجديد `openclaw/plugin-sdk/channel-route`.
    تبقى أسماء مفاتيح المسارات والأهداف القابلة للمقارنة القديمة كأسماء مستعارة للتوافق
    أثناء نافذة الترحيل، لكن يجب أن تستخدم Plugins الجديدة أسماء المسارات
    التي تصف السلوك مباشرةً:

    | المساعد القديم | المساعد الحديث |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    تعمل مساعدات المسار الحديثة على تطبيع `{ channel, to, accountId, threadId }`
    باتساق عبر الموافقات الأصلية، ومنع الردود، وإزالة تكرار الوارد،
    وتسليم Cron، وتوجيه الجلسات. إذا كان Plugin الخاص بك يملك قواعد هدف
    مخصصة، فاستخدم `resolveChannelRouteTargetWithParser(...)` لتكييف ذلك
    المحلّل مع عقد هدف المسار نفسه.

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
  | مسار الاستيراد | الغرض | التصديرات الرئيسية |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | مساعد إدخال Plugin القانوني | `definePluginEntry` |
  | `plugin-sdk/core` | إعادة تصدير مظلية قديمة لتعريفات/بناة إدخال القنوات | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | تصدير مخطط الإعدادات الجذري | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | مساعد إدخال لمزوّد واحد | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعريفات وبناة إدخال قنوات مركّزة | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة | مطالبات قائمة السماح، وبناة حالة الإعداد |
  | `plugin-sdk/setup-runtime` | مساعدات وقت الإعداد للتنفيذ | محولات تصحيحات إعداد آمنة للاستيراد، ومساعدات ملاحظات البحث، `promptResolvedAllowFrom`, `splitSetupEntries`, ووكلاء إعداد مفوّضون |
  | `plugin-sdk/setup-adapter-runtime` | اسم بديل مهمل لمحول الإعداد | استخدم `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | مساعدات أدوات الإعداد | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | مساعدات الحسابات المتعددة | مساعدات قائمة الحسابات/الإعدادات/بوابة الإجراءات |
  | `plugin-sdk/account-id` | مساعدات معرّف الحساب | `DEFAULT_ACCOUNT_ID`, وتطبيع معرّف الحساب |
  | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب | مساعدات البحث عن الحساب + الرجوع إلى الافتراضي |
  | `plugin-sdk/account-helpers` | مساعدات حسابات ضيقة النطاق | مساعدات قائمة الحسابات/إجراءات الحساب |
  | `plugin-sdk/channel-setup` | محولات معالج الإعداد | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | بدائيات إقران الرسائل المباشرة | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | بادئة الرد، والكتابة، وتوصيل التسليم من المصدر | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | مصانع محولات الإعدادات ومساعدات الوصول إلى الرسائل المباشرة | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | بناة مخططات الإعدادات | بدائيات مخطط إعدادات القناة المشتركة والباني العام فقط |
  | `plugin-sdk/bundled-channel-config-schema` | مخططات الإعدادات المضمّنة | Plugins المضمّنة التي يصونها OpenClaw فقط؛ يجب أن تعرّف Plugins الجديدة مخططات محلية للـ Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | مخططات إعدادات مضمّنة مهملة | اسم بديل للتوافق فقط؛ استخدم `plugin-sdk/bundled-channel-config-schema` للـ Plugins المضمّنة المصانة |
  | `plugin-sdk/telegram-command-config` | مساعدات إعدادات أوامر Telegram | تطبيع أسماء الأوامر، وقص الأوصاف، والتحقق من التكرار/التعارض |
  | `plugin-sdk/channel-policy` | حل سياسة المجموعة/الرسائل المباشرة | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | مساعدات حالة الحساب ودورة حياة تدفق المسودات | `createAccountStatusSink`, ومساعدات إنهاء معاينة المسودات |
  | `plugin-sdk/inbound-envelope` | مساعدات غلاف الوارد | مساعدات المسار المشترك + باني الغلاف |
  | `plugin-sdk/inbound-reply-dispatch` | مساعدات الرد الوارد | مساعدات التسجيل والإرسال المشتركة |
  | `plugin-sdk/messaging-targets` | تحليل أهداف المراسلة | مساعدات تحليل/مطابقة الأهداف |
  | `plugin-sdk/outbound-media` | مساعدات الوسائط الصادرة | تحميل الوسائط الصادرة المشترك |
  | `plugin-sdk/outbound-send-deps` | مساعدات تبعيات الإرسال الصادر | بحث `resolveOutboundSendDep` خفيف دون استيراد تنفيذ الصادر الكامل |
  | `plugin-sdk/outbound-runtime` | مساعدات تنفيذ الصادر | مساعدات التسليم الصادر، وتفويض الهوية/الإرسال، والجلسة، والتنسيق، وتخطيط الحمولة |
  | `plugin-sdk/thread-bindings-runtime` | مساعدات ربط الخيوط | دورة حياة ربط الخيوط ومساعدات المحولات |
  | `plugin-sdk/agent-media-payload` | مساعدات حمولات الوسائط القديمة | باني حمولة وسائط الوكيل لتخطيطات الحقول القديمة |
  | `plugin-sdk/channel-runtime` | طبقة توافق مهملة | أدوات تنفيذ القنوات القديمة فقط |
  | `plugin-sdk/channel-send-result` | أنواع نتائج الإرسال | أنواع نتائج الرد |
  | `plugin-sdk/runtime-store` | تخزين Plugin دائم | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | مساعدات تنفيذ واسعة النطاق | مساعدات التنفيذ/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
  | `plugin-sdk/runtime-env` | مساعدات بيئة تنفيذ ضيقة النطاق | مساعدات المسجّل/بيئة التنفيذ، والمهلة، وإعادة المحاولة، والتراجع التدريجي |
  | `plugin-sdk/plugin-runtime` | مساعدات تنفيذ Plugin مشتركة | مساعدات أوامر/خطافات/http/تفاعلية للـ Plugin |
  | `plugin-sdk/hook-runtime` | مساعدات مسار الخطافات | مساعدات مسار Webhook/الخطافات الداخلية المشتركة |
  | `plugin-sdk/lazy-runtime` | مساعدات التنفيذ الكسول | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | مساعدات العمليات | مساعدات تنفيذ الأوامر المشتركة |
  | `plugin-sdk/cli-runtime` | مساعدات تنفيذ CLI | تنسيق الأوامر، والانتظار، ومساعدات الإصدارات |
  | `plugin-sdk/gateway-runtime` | مساعدات Gateway | عميل Gateway، ومساعد بدء جاهزية حلقة الأحداث، ومساعدات تصحيح حالة القناة |
  | `plugin-sdk/config-runtime` | طبقة توافق إعدادات مهملة | فضّل `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, و`config-mutation` |
  | `plugin-sdk/telegram-command-config` | مساعدات أوامر Telegram | مساعدات تحقق مستقرة الرجوع لأوامر Telegram عندما يكون سطح عقد Telegram المضمّن غير متاح |
  | `plugin-sdk/approval-runtime` | مساعدات مطالبة الموافقة | حمولة موافقة التنفيذ/Plugin، ومساعدات قدرة/ملف تعريف الموافقة، ومساعدات توجيه/تنفيذ الموافقة الأصلية، وتنسيق مسار عرض الموافقة المنظم |
  | `plugin-sdk/approval-auth-runtime` | مساعدات تفويض الموافقة | حل المعتمِد، وتفويض إجراءات المحادثة نفسها |
  | `plugin-sdk/approval-client-runtime` | مساعدات عميل الموافقة | مساعدات ملف تعريف/مرشح موافقة التنفيذ الأصلية |
  | `plugin-sdk/approval-delivery-runtime` | مساعدات تسليم الموافقة | محولات قدرة/تسليم الموافقة الأصلية |
  | `plugin-sdk/approval-gateway-runtime` | مساعدات Gateway للموافقة | مساعد حل Gateway للموافقة المشترك |
  | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات محول الموافقة | مساعدات تحميل خفيفة لمحول الموافقة الأصلية لنقاط إدخال القنوات الساخنة |
  | `plugin-sdk/approval-handler-runtime` | مساعدات معالج الموافقة | مساعدات تنفيذ أوسع لمعالج الموافقة؛ فضّل مسارات المحول/Gateway الأضيق عندما تكفي |
  | `plugin-sdk/approval-native-runtime` | مساعدات هدف الموافقة | مساعدات ربط هدف/حساب الموافقة الأصلية |
  | `plugin-sdk/approval-reply-runtime` | مساعدات رد الموافقة | مساعدات حمولة رد موافقة التنفيذ/Plugin |
  | `plugin-sdk/channel-runtime-context` | مساعدات سياق تنفيذ القنوات | مساعدات تسجيل/جلب/مراقبة سياق تنفيذ القنوات العامة |
  | `plugin-sdk/security-runtime` | مساعدات الأمان | مساعدات الثقة المشتركة، وبوابة الرسائل المباشرة، والملفات/المسارات المحدودة بالجذر، والمحتوى الخارجي، وجمع الأسرار |
  | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF | مساعدات قائمة سماح المضيفين وسياسة الشبكات الخاصة |
  | `plugin-sdk/ssrf-runtime` | مساعدات تنفيذ SSRF | مرسِل مثبّت، وجلب محمي، ومساعدات سياسة SSRF |
  | `plugin-sdk/system-event-runtime` | مساعدات أحداث النظام | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | مساعدات Heartbeat | مساعدات إيقاظ Heartbeat، والحدث، والرؤية |
  | `plugin-sdk/delivery-queue-runtime` | مساعدات قائمة انتظار التسليم | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | مساعدات نشاط القناة | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | مساعدات إزالة التكرار | مخابئ إزالة تكرار داخل الذاكرة |
  | `plugin-sdk/file-access-runtime` | مساعدات الوصول إلى الملفات | مساعدات مسارات الملفات/الوسائط المحلية الآمنة |
  | `plugin-sdk/transport-ready-runtime` | مساعدات جاهزية النقل | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | مساعدات المخابئ المحدودة | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | مساعدات بوابة التشخيص | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | مساعدات تنسيق الأخطاء | `formatUncaughtError`, `isApprovalNotFoundError`, ومساعدات رسم الأخطاء |
  | `plugin-sdk/fetch-runtime` | مساعدات الجلب/الوكيل المغلّف | `resolveFetch`, ومساعدات الوكيل، ومساعدات خيارات EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | مساعدات تطبيع المضيف | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | مساعدات إعادة المحاولة | `RetryConfig`, `retryAsync`, ومشغلات السياسات |
  | `plugin-sdk/allow-from` | تنسيق قائمة السماح | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | ربط مدخلات قائمة السماح | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | مساعدات بوابة الأوامر وسطح الأوامر | `resolveControlCommandGate`, ومساعدات تفويض المرسِل، ومساعدات سجل الأوامر بما في ذلك تنسيق قائمة الوسائط الديناميكية |
  | `plugin-sdk/command-status` | عارضات حالة/مساعدة الأوامر | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تحليل إدخال الأسرار | مساعدات إدخال الأسرار |
  | `plugin-sdk/webhook-ingress` | مساعدات طلب Webhook | أدوات أهداف Webhook |
  | `plugin-sdk/webhook-request-guards` | مساعدات حارس جسم Webhook | مساعدات قراءة/تحديد جسم الطلب |
  | `plugin-sdk/reply-runtime` | تنفيذ الرد المشترك | إرسال الوارد، وHeartbeat، ومخطط الرد، والتقسيم إلى أجزاء |
  | `plugin-sdk/reply-dispatch-runtime` | مساعدات إرسال رد ضيقة النطاق | الإنهاء، وإرسال المزوّد، ومساعدات تسمية المحادثات |
  | `plugin-sdk/reply-history` | مساعدات سجل الردود | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | تخطيط مراجع الرد | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | مساعدات تقسيم الردود | مساعدات تقسيم النص/Markdown |
  | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسات | مساعدات مسار المخزن + وقت التحديث |
  | `plugin-sdk/state-paths` | مساعدات مسار الحالة | مساعدات مجلد الحالة وOAuth |
  | `plugin-sdk/routing` | مساعدات التوجيه/مفتاح الجلسة | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, ومساعدات تطبيع مفتاح الجلسة |
  | `plugin-sdk/status-helpers` | مساعدات حالة القنوات | بناة ملخصات حالة القنوات/الحسابات، وافتراضيات حالة التنفيذ، ومساعدات بيانات تعريف المشكلات |
  | `plugin-sdk/target-resolver-runtime` | مساعدات حالّ الأهداف | مساعدات حالّ الأهداف المشتركة |
  | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع السلاسل | مساعدات تطبيع slug/السلاسل |
  | `plugin-sdk/request-url` | مساعدات عنوان URL للطلب | استخراج عناوين URL النصية من مدخلات شبيهة بالطلبات |
  | `plugin-sdk/run-command` | مساعدات الأوامر الموقوتة | مشغّل أوامر موقوت مع stdout/stderr مطبّعين |
  | `plugin-sdk/param-readers` | قارئات المعاملات | قارئات معاملات شائعة للأدوات/CLI |
  | `plugin-sdk/tool-payload` | استخراج حمولة الأداة | استخراج الحمولات المطبّعة من كائنات نتائج الأدوات |
  | `plugin-sdk/tool-send` | استخراج إرسال الأداة | استخراج حقول هدف الإرسال القياسية من وسيطات الأداة |
  | `plugin-sdk/temp-path` | مساعدات المسار المؤقت | مساعدات مشتركة لمسار التنزيل المؤقت |
  | `plugin-sdk/logging-core` | مساعدات التسجيل | مساعدات مسجّل النظام الفرعي والتنقيح |
  | `plugin-sdk/markdown-table-runtime` | مساعدات جداول Markdown | مساعدات وضع جدول Markdown |
  | `plugin-sdk/reply-payload` | أنواع الرد على الرسائل | أنواع حمولة الرد |
  | `plugin-sdk/provider-setup` | مساعدات معدّة لإعداد المزوّد المحلي/المستضاف ذاتيًا | مساعدات اكتشاف/تهيئة المزوّد المستضاف ذاتيًا |
  | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركّزة لإعداد مزوّد مستضاف ذاتيًا ومتوافق مع OpenAI | مساعدات اكتشاف/تهيئة المزوّد المستضاف ذاتيًا نفسها |
  | `plugin-sdk/provider-auth-runtime` | مساعدات مصادقة وقت تشغيل المزوّد | مساعدات حلّ مفتاح API في وقت التشغيل |
  | `plugin-sdk/provider-auth-api-key` | مساعدات إعداد مفتاح API للمزوّد | مساعدات التهيئة الأولية/كتابة ملف التعريف لمفتاح API |
  | `plugin-sdk/provider-auth-result` | مساعدات نتيجة مصادقة المزوّد | باني نتيجة مصادقة OAuth القياسية |
  | `plugin-sdk/provider-selection-runtime` | مساعدات اختيار المزوّد | اختيار المزوّد المهيأ أو التلقائي ودمج تهيئة المزوّد الخام |
  | `plugin-sdk/provider-env-vars` | مساعدات متغيرات بيئة المزوّد | مساعدات البحث عن متغيرات بيئة مصادقة المزوّد |
  | `plugin-sdk/provider-model-shared` | مساعدات مشتركة لنموذج/إعادة تشغيل المزوّد | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، وبناة سياسة إعادة التشغيل المشتركة، ومساعدات نقطة نهاية المزوّد، ومساعدات تطبيع معرّف النموذج |
  | `plugin-sdk/provider-catalog-shared` | مساعدات مشتركة لفهرس المزوّد | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | تصحيحات التهيئة الأولية للمزوّد | مساعدات تهيئة التهيئة الأولية |
  | `plugin-sdk/provider-http` | مساعدات HTTP للمزوّد | مساعدات عامة لقدرات HTTP/نقطة النهاية للمزوّد، بما في ذلك مساعدات نموذج الأجزاء المتعددة لنسخ الصوت |
  | `plugin-sdk/provider-web-fetch` | مساعدات جلب الويب للمزوّد | مساعدات تسجيل/تخزين مؤقت لمزوّد جلب الويب |
  | `plugin-sdk/provider-web-search-config-contract` | مساعدات تهيئة بحث الويب للمزوّد | مساعدات ضيقة لتهيئة/اعتماد بحث الويب للمزوّدين الذين لا يحتاجون إلى توصيل تفعيل Plugin |
  | `plugin-sdk/provider-web-search-contract` | مساعدات عقد بحث الويب للمزوّد | مساعدات ضيقة لعقد تهيئة/اعتماد بحث الويب، مثل `createWebSearchProviderContractFields` و`enablePluginInConfig` و`resolveProviderWebSearchPluginConfig` ومحدّدات/جالبات الاعتمادات ذات النطاق |
  | `plugin-sdk/provider-web-search` | مساعدات بحث الويب للمزوّد | مساعدات تسجيل/تخزين مؤقت/وقت تشغيل لمزوّد بحث الويب |
  | `plugin-sdk/provider-tools` | مساعدات توافق أداة/مخطط المزوّد | `ProviderToolCompatFamily` و`buildProviderToolCompatFamilyHooks` وتنظيف مخطط Gemini مع التشخيصات |
  | `plugin-sdk/provider-usage` | مساعدات استخدام المزوّد | `fetchClaudeUsage` و`fetchGeminiUsage` و`fetchGithubCopilotUsage` ومساعدات استخدام مزوّد أخرى |
  | `plugin-sdk/provider-stream` | مساعدات مغلّف دفق المزوّد | `ProviderStreamFamily` و`buildProviderStreamFamilyHooks` و`composeProviderStreamWrappers` وأنواع مغلّف الدفق ومساعدات مغلّف مشتركة لـ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | مساعدات نقل المزوّد | مساعدات نقل المزوّد الأصلية، مثل الجلب المحروس، وتحويلات رسائل النقل، ودفقات أحداث النقل القابلة للكتابة |
  | `plugin-sdk/keyed-async-queue` | صف غير متزامن مرتب | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | مساعدات وسائط مشتركة | مساعدات جلب/تحويل/تخزين الوسائط، وفحص أبعاد الفيديو المدعوم بـ ffprobe، وبناة حمولة الوسائط |
  | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة لتوليد الوسائط | مساعدات مشتركة للتجاوز عند الفشل، واختيار المرشحين، ورسائل النموذج المفقود لتوليد الصور/الفيديو/الموسيقى |
  | `plugin-sdk/media-understanding` | مساعدات فهم الوسائط | أنواع مزوّد فهم الوسائط إضافة إلى صادرات مساعدات الصور/الصوت الموجّهة للمزوّد |
  | `plugin-sdk/text-runtime` | تصدير واسع مهمل لتوافق النص | استخدم `string-coerce-runtime` و`text-chunking` و`text-utility-runtime` و`logging-core` |
  | `plugin-sdk/text-chunking` | مساعدات تقسيم النص إلى مقاطع | مساعد تقطيع النص الصادر |
  | `plugin-sdk/speech` | مساعدات الكلام | أنواع مزوّد الكلام إضافة إلى مساعدات التوجيه والسجل والتحقق الموجّهة للمزوّد، وباني TTS المتوافق مع OpenAI |
  | `plugin-sdk/speech-core` | نواة الكلام المشتركة | أنواع مزوّد الكلام والسجل والتوجيهات والتطبيع |
  | `plugin-sdk/realtime-transcription` | مساعدات النسخ الفوري | أنواع المزوّد، ومساعدات السجل، ومساعد جلسة WebSocket المشتركة |
  | `plugin-sdk/realtime-voice` | مساعدات الصوت الفوري | أنواع المزوّد، ومساعدات السجل/الحل، ومساعدات جلسة الجسر، وصفوف ردّ كلام الوكيل المشتركة، وصحة النص/الحدث، وكبت الصدى، ومساعدات الاستشارة السريعة للسياق |
  | `plugin-sdk/image-generation` | مساعدات توليد الصور | أنواع مزوّد توليد الصور إضافة إلى مساعدات أصل الصورة/عنوان URL للبيانات وباني مزوّد الصور المتوافق مع OpenAI |
  | `plugin-sdk/image-generation-core` | نواة مشتركة لتوليد الصور | أنواع توليد الصور، والتجاوز عند الفشل، والمصادقة، ومساعدات السجل |
  | `plugin-sdk/music-generation` | مساعدات توليد الموسيقى | أنواع مزوّد/طلب/نتيجة توليد الموسيقى |
  | `plugin-sdk/music-generation-core` | نواة مشتركة لتوليد الموسيقى | أنواع توليد الموسيقى، ومساعدات التجاوز عند الفشل، والبحث عن المزوّد، وتحليل مرجع النموذج |
  | `plugin-sdk/video-generation` | مساعدات توليد الفيديو | أنواع مزوّد/طلب/نتيجة توليد الفيديو |
  | `plugin-sdk/video-generation-core` | نواة مشتركة لتوليد الفيديو | أنواع توليد الفيديو، ومساعدات التجاوز عند الفشل، والبحث عن المزوّد، وتحليل مرجع النموذج |
  | `plugin-sdk/interactive-runtime` | مساعدات الرد التفاعلي | تطبيع/اختزال حمولة الرد التفاعلي |
  | `plugin-sdk/channel-config-primitives` | أوليات تهيئة القناة | أوليات ضيقة لمخطط تهيئة القناة |
  | `plugin-sdk/channel-config-writes` | مساعدات كتابة تهيئة القناة | مساعدات تخويل كتابة تهيئة القناة |
  | `plugin-sdk/channel-plugin-common` | تمهيد القناة المشترك | صادرات تمهيد Plugin القناة المشتركة |
  | `plugin-sdk/channel-status` | مساعدات حالة القناة | مساعدات مشتركة للقطة/ملخص حالة القناة |
  | `plugin-sdk/allowlist-config-edit` | مساعدات تهيئة قائمة السماح | مساعدات تحرير/قراءة تهيئة قائمة السماح |
  | `plugin-sdk/group-access` | مساعدات الوصول الجماعي | مساعدات مشتركة لقرار الوصول الجماعي |
  | `plugin-sdk/direct-dm` | مساعدات الرسائل المباشرة | مساعدات مشتركة لمصادقة/حراسة الرسائل المباشرة |
  | `plugin-sdk/extension-shared` | مساعدات الامتداد المشتركة | أوليات مساعد القناة السلبية/الحالة والوكيل المحيط |
  | `plugin-sdk/webhook-targets` | مساعدات أهداف Webhook | مساعدات سجل أهداف Webhook وتثبيت المسارات |
  | `plugin-sdk/webhook-path` | اسم مستعار مهمل لمسار Webhook | استخدم `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | مساعدات وسائط الويب المشتركة | مساعدات تحميل الوسائط البعيدة/المحلية |
  | `plugin-sdk/zod` | إعادة تصدير مهملة لتوافق Zod | استورد `zod` من `zod` مباشرة |
  | `plugin-sdk/memory-core` | مساعدات نواة الذاكرة المضمّنة | سطح مساعدات مدير/تهيئة/ملف/CLI الذاكرة |
  | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل محرك الذاكرة | واجهة وقت تشغيل فهرس/بحث الذاكرة |
  | `plugin-sdk/memory-core-host-engine-foundation` | محرك أساس مضيف الذاكرة | صادرات محرك أساس مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-embeddings` | محرك تضمين مضيف الذاكرة | عقود تضمين الذاكرة، والوصول إلى السجل، والمزوّد المحلي، ومساعدات الدُفعات/البعد العامة؛ تعيش المزوّدات البعيدة المحددة في Plugins المالكة لها |
  | `plugin-sdk/memory-core-host-engine-qmd` | محرك QMD لمضيف الذاكرة | صادرات محرك QMD لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-storage` | محرك تخزين مضيف الذاكرة | صادرات محرك تخزين مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-multimodal` | مساعدات مضيف الذاكرة متعددة الوسائط | مساعدات مضيف الذاكرة متعددة الوسائط |
  | `plugin-sdk/memory-core-host-query` | مساعدات استعلام مضيف الذاكرة | مساعدات استعلام مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-secret` | مساعدات سر مضيف الذاكرة | مساعدات سر مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-events` | اسم مستعار مهمل لحدث الذاكرة | استخدم `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة | مساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-cli` | وقت تشغيل CLI لمضيف الذاكرة | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-core` | وقت تشغيل نواة مضيف الذاكرة | مساعدات وقت تشغيل نواة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-files` | مساعدات ملف/وقت تشغيل مضيف الذاكرة | مساعدات ملف/وقت تشغيل مضيف الذاكرة |
  | `plugin-sdk/memory-host-core` | اسم مستعار لوقت تشغيل نواة مضيف الذاكرة | اسم مستعار محايد للمورّد لمساعدات وقت تشغيل نواة مضيف الذاكرة |
  | `plugin-sdk/memory-host-events` | اسم مستعار لسجل أحداث مضيف الذاكرة | اسم مستعار محايد للمورّد لمساعدات سجل أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-host-files` | اسم مستعار مهمل لملف/وقت تشغيل الذاكرة | استخدم `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | مساعدات Markdown المدارة | مساعدات Markdown مدارة مشتركة لـ Plugins المجاورة للذاكرة |
  | `plugin-sdk/memory-host-search` | واجهة بحث الذاكرة النشطة | واجهة وقت تشغيل كسولة لمدير بحث الذاكرة النشطة |
  | `plugin-sdk/memory-host-status` | اسم مستعار مهمل لحالة مضيف الذاكرة | استخدم `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | أدوات الاختبار | حزمة توافق مهملة محلية للمستودع؛ استخدم مسارات فرعية مركّزة محلية للمستودع مثل `plugin-sdk/plugin-test-runtime` و`plugin-sdk/channel-test-helpers` و`plugin-sdk/channel-target-testing` و`plugin-sdk/test-env` و`plugin-sdk/test-fixtures` |
</Accordion>

يقتصر هذا الجدول عمدًا على مجموعة الترحيل الفرعية المشتركة، وليس واجهة SDK الكاملة. يوجد جرد نقاط دخول المصرّف في
`scripts/lib/plugin-sdk-entrypoints.json`؛ وتُولَّد تصديرات الحزم من
المجموعة الفرعية العامة.

لم تعد واجهات الربط المساعدة المحجوزة لPlugin المضمّنة ضمن خريطة تصدير
SDK العامة، باستثناء واجهات التوافق الموثقة صراحةً مثل طبقة التوافق
المهملة `plugin-sdk/discord` التي أُبقي عليها لحزمة
`@openclaw/discord@2026.3.13` المنشورة. توجد المساعدات الخاصة بالمالك داخل
حزمة Plugin المالكة؛ وينبغي أن يمر سلوك المضيف المشترك عبر عقود SDK عامة
مثل `plugin-sdk/gateway-runtime`، و`plugin-sdk/security-runtime`،
و`plugin-sdk/plugin-config-runtime`.

استخدم أضيق استيراد يطابق المهمة. إذا لم تجد تصديرًا، فتحقق من المصدر في
`src/plugin-sdk/` أو اسأل المشرفين أي عقد عام ينبغي أن يملكه.

## الإهمالات النشطة

إهمالات أضيق نطاقًا تنطبق عبر SDK الخاص بPlugin، وعقد المزوّد، وواجهة وقت
التشغيل، والبيان. لا يزال كل منها يعمل اليوم، لكنه سيُزال في إصدار رئيسي
مستقبلي. يربط المدخل أسفل كل عنصر API القديم ببديله المعتمد.

<AccordionGroup>
  <Accordion title="بُناة مساعدة command-auth → command-status">
    **القديم (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **الجديد (`openclaw/plugin-sdk/command-status`)**: نفس التواقيع، ونفس
    التصديرات - لكنها مستوردة من المسار الفرعي الأضيق. يعيد `command-auth`
    تصديرها كدعامات توافق.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="مساعدات ضبط الإشارة → resolveInboundMentionDecision">
    **القديم**: `resolveInboundMentionRequirement({ facts, policy })` و
    `shouldDropInboundForMention(...)` من
    `openclaw/plugin-sdk/channel-inbound` أو
    `openclaw/plugin-sdk/channel-mention-gating`.

    **الجديد**: `resolveInboundMentionDecision({ facts, policy })` - يعيد
    كائن قرار واحدًا بدلًا من نداءين منفصلين.

    انتقلت إضافات Plugin الخاصة بالقنوات اللاحقة (Slack، وDiscord، وMatrix،
    وMS Teams) بالفعل.

  </Accordion>

  <Accordion title="طبقة توافق وقت تشغيل القنوات ومساعدات إجراءات القنوات">
    `openclaw/plugin-sdk/channel-runtime` هي طبقة توافق لإضافات Plugin الخاصة
    بالقنوات القديمة. لا تستوردها من الشيفرة الجديدة؛ استخدم
    `openclaw/plugin-sdk/channel-runtime-context` لتسجيل كائنات وقت التشغيل.

    مساعدات `channelActions*` في `openclaw/plugin-sdk/channel-actions` مهملة
    إلى جانب تصديرات "الإجراءات" الأولية للقنوات. اكشف القدرات عبر واجهة
    `presentation` الدلالية بدلًا من ذلك - تصرّح إضافات Plugin الخاصة
    بالقنوات بما تعرضه (بطاقات، أزرار، قوائم اختيار) بدلًا من أسماء
    الإجراءات الأولية التي تقبلها.

  </Accordion>

  <Accordion title="مساعد tool() لمزوّد بحث الويب → createTool() على Plugin">
    **القديم**: مصنع `tool()` من `openclaw/plugin-sdk/provider-web-search`.

    **الجديد**: نفّذ `createTool(...)` مباشرة على Plugin المزوّد.
    لم يعد OpenClaw يحتاج إلى مساعد SDK لتسجيل مغلّف الأداة.

  </Accordion>

  <Accordion title="مغلفات قنوات النص الصريح → BodyForAgent">
    **القديم**: `formatInboundEnvelope(...)` (و
    `ChannelMessageForAgent.channelEnvelope`) لبناء مغلف مطالبة نصي صريح
    ومسطح من رسائل القنوات الواردة.

    **الجديد**: `BodyForAgent` مع كتل سياق مستخدم منظّمة. ترفق إضافات
    Plugin الخاصة بالقنوات بيانات تعريف التوجيه (سلسلة الرسائل، الموضوع،
    الرد على، التفاعلات) كحقول ذات أنواع بدلًا من دمجها في سلسلة مطالبة.
    لا يزال مساعد `formatAgentEnvelope(...)` مدعومًا للمغلفات المركّبة
    الموجهة إلى المساعد، لكن مغلفات النص الصريح الواردة في طريقها إلى
    الإزالة.

    المناطق المتأثرة: `inbound_claim`، و`message_received`، وأي Plugin قناة
    مخصص أعاد معالجة نص `channelEnvelope`.

  </Accordion>

  <Accordion title="أنواع اكتشاف المزوّدين → أنواع كتالوج المزوّدين">
    أصبحت أربعة أسماء مستعارة لأنواع الاكتشاف الآن أغلفة رقيقة فوق أنواع
    مرحلة الكتالوج:

    | الاسم المستعار القديم     | النوع الجديد              |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    إضافةً إلى حاوية `ProviderCapabilities` الثابتة القديمة - ينبغي أن
    تستخدم إضافات Plugin الخاصة بالمزوّدين خطافات مزوّد صريحة مثل
    `buildReplayPolicy`، و`normalizeToolSchemas`، و`wrapStreamFn` بدلًا من
    كائن ثابت.

  </Accordion>

  <Accordion title="خطافات سياسة التفكير → resolveThinkingProfile">
    **القديم** (ثلاثة خطافات منفصلة على `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`، و`supportsXHighThinking(ctx)`، و
    `resolveDefaultThinkingLevel(ctx)`.

    **الجديد**: `resolveThinkingProfile(ctx)` واحد يعيد
    `ProviderThinkingProfile` مع `id` المعتمد، و`label` اختياري، وقائمة
    مستويات مرتبة. يخفض OpenClaw القيم المخزنة القديمة حسب رتبة ملف التعريف
    تلقائيًا.

    نفّذ خطافًا واحدًا بدلًا من ثلاثة. تستمر الخطافات القديمة في العمل خلال
    فترة الإهمال، لكنها لا تُدمج مع نتيجة ملف التعريف.

  </Accordion>

  <Accordion title="مسار الرجوع لمزوّد OAuth خارجي → contracts.externalAuthProviders">
    **القديم**: تنفيذ `resolveExternalOAuthProfiles(...)` دون التصريح
    بالمزوّد في بيان Plugin.

    **الجديد**: صرّح عن `contracts.externalAuthProviders` في بيان Plugin
    **و** نفّذ `resolveExternalAuthProfiles(...)`. يصدر مسار "رجوع المصادقة"
    القديم تحذيرًا في وقت التشغيل وسيُزال.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="بحث متغيرات البيئة للمزوّد → setup.providers[].envVars">
    **حقل البيان القديم**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **الجديد**: اعكس بحث متغير البيئة نفسه إلى `setup.providers[].envVars`
    في البيان. يدمج هذا بيانات تعريف بيئة الإعداد/الحالة في مكان واحد
    ويتجنب تشغيل وقت تشغيل Plugin لمجرد الإجابة عن عمليات بحث متغيرات البيئة.

    يبقى `providerAuthEnvVars` مدعومًا عبر محوّل توافق حتى تنتهي فترة
    الإهمال.

  </Accordion>

  <Accordion title="تسجيل Plugin الذاكرة → registerMemoryCapability">
    **القديم**: ثلاثة نداءات منفصلة -
    `api.registerMemoryPromptSection(...)`،
    `api.registerMemoryFlushPlan(...)`،
    `api.registerMemoryRuntime(...)`.

    **الجديد**: نداء واحد على API حالة الذاكرة -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    نفس الخانات، ونداء تسجيل واحد. لا تتأثر مساعدات الذاكرة الإضافية
    (`registerMemoryPromptSupplement`، و`registerMemoryCorpusSupplement`،
    و`registerMemoryEmbeddingProvider`).

  </Accordion>

  <Accordion title="إعادة تسمية أنواع رسائل جلسة الوكيل الفرعي">
    لا يزال اسمان مستعاران قديمان للأنواع يُصدّران من `src/plugins/runtime/types.ts`:

    | القديم                        | الجديد                         |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    طريقة وقت التشغيل `readSession` مهملة لصالح `getSessionMessages`.
    نفس التوقيع؛ تمرر الطريقة القديمة النداء إلى الجديدة.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **القديم**: `runtime.tasks.flow` (بالمفرد) أعاد موصل TaskFlow حيًا.

    **الجديد**: يحافظ `runtime.tasks.managedFlows` على وقت تشغيل تعديل
    TaskFlow المدار لإضافات Plugin التي تنشئ مهامًا فرعية أو تحدّثها أو
    تلغيها أو تشغّلها من تدفق. استخدم `runtime.tasks.flows` عندما لا يحتاج
    Plugin إلا إلى قراءات مبنية على DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="مصانع الامتدادات المضمّنة → وسيط نتيجة أداة الوكيل">
    مغطى في "كيفية الترحيل → ترحيل امتدادات نتائج أدوات Pi إلى الوسيط"
    أعلاه. أُدرج هنا للاكتمال: استُبدل مسار
    `api.registerEmbeddedExtensionFactory(...)` المحذوف والخاص بPi فقط بـ
    `api.registerAgentToolResultMiddleware(...)` مع قائمة وقت تشغيل صريحة
    في `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="الاسم المستعار OpenClawSchemaType → OpenClawConfig">
    أصبح `OpenClawSchemaType` المعاد تصديره من `openclaw/plugin-sdk` الآن
    اسمًا مستعارًا من سطر واحد لـ `OpenClawConfig`. فضّل الاسم المعتمد.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
تُتتبع الإهمالات على مستوى الامتداد (داخل إضافات Plugin المضمّنة الخاصة
بالقنوات/المزوّدين ضمن `extensions/`) داخل ملفات التجميع `api.ts` و
`runtime-api.ts` الخاصة بها. لا تؤثر هذه في عقود Plugin التابعة لجهات
خارجية وليست مدرجة هنا. إذا كنت تستهلك ملف التجميع المحلي لPlugin مضمّنة
مباشرة، فاقرأ تعليقات الإهمال في ذلك الملف قبل الترقية.
</Note>

## الجدول الزمني للإزالة

| متى                    | ما الذي يحدث                                                           |
| ---------------------- | ----------------------------------------------------------------------- |
| **الآن**               | تُصدر الواجهات المهملة تحذيرات وقت التشغيل                              |
| **الإصدار الرئيسي التالي** | ستُزال الواجهات المهملة؛ وستفشل إضافات Plugin التي لا تزال تستخدمها |

تم ترحيل كل إضافات Plugin الأساسية بالفعل. ينبغي أن ترحّل إضافات Plugin
الخارجية قبل الإصدار الرئيسي التالي.

## إسكات التحذيرات مؤقتًا

اضبط متغيرات البيئة هذه أثناء العمل على الترحيل:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

هذا منفذ هروب مؤقت، وليس حلًا دائمًا.

## ذات صلة

- [بدء الاستخدام](/ar/plugins/building-plugins) - ابنِ أول Plugin لك
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - مرجع كامل لاستيراد المسارات الفرعية
- [إضافات Plugin للقنوات](/ar/plugins/sdk-channel-plugins) - بناء إضافات Plugin للقنوات
- [إضافات Plugin للمزوّدين](/ar/plugins/sdk-provider-plugins) - بناء إضافات Plugin للمزوّدين
- [الأجزاء الداخلية لPlugin](/ar/plugins/architecture) - تعمق في البنية
- [بيان Plugin](/ar/plugins/manifest) - مرجع مخطط البيان
