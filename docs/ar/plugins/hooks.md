---
read_when:
    - أنت تنشئ Plugin يحتاج إلى before_tool_call أو before_agent_reply أو خطافات الرسائل أو خطافات دورة الحياة
    - تحتاج إلى حظر استدعاءات الأدوات الصادرة عن Plugin أو إعادة كتابتها أو اشتراط الموافقة عليها
    - أنت تفاضل بين الخطافات الداخلية وخطافات Plugin
summary: 'خطافات Plugin: اعتراض أحداث دورة حياة الوكيل والأداة والرسالة والجلسة وGateway'
title: خطافات Plugin
x-i18n:
    generated_at: "2026-05-06T18:01:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3741b95bcccdff4e24b4c1f05de54649b48a6c0a2ca1dc4376475eb1823ae185
    source_path: plugins/hooks.md
    workflow: 16
---

خطافات Plugin هي نقاط توسيع داخل العملية لـ Plugin الخاصة بـ OpenClaw. استخدمها
عندما يحتاج Plugin إلى فحص تشغيلات الوكيل أو تغييرها، أو استدعاءات الأدوات، أو تدفق الرسائل،
أو دورة حياة الجلسة، أو توجيه الوكلاء الفرعيين، أو عمليات التثبيت، أو بدء تشغيل Gateway.

استخدم [الخطافات الداخلية](/ar/automation/hooks) بدلًا من ذلك عندما تريد سكربت
`HOOK.md` صغيرًا مثبّتًا بواسطة المشغّل لأحداث الأوامر وGateway مثل
`/new` أو `/reset` أو `/stop` أو `agent:bootstrap` أو `gateway:startup`.

## البدء السريع

سجّل خطافات Plugin ذات الأنواع باستخدام `api.on(...)` من نقطة دخول Plugin لديك:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

تعمل معالجات الخطافات تسلسليًا حسب `priority` بترتيب تنازلي. وتحافظ الخطافات
ذات الأولوية نفسها على ترتيب التسجيل.

يقبل `api.on(name, handler, opts?)` ما يلي:

- `priority` - ترتيب المعالج (الأعلى يعمل أولًا).
- `timeoutMs` - ميزانية اختيارية لكل خطاف. عند ضبطها، يوقف مشغّل الخطافات ذلك
  المعالج بعد انقضاء الميزانية ويتابع مع التالي، بدلًا من السماح لعمل الإعداد
  أو الاستدعاء البطيء باستهلاك مهلة النموذج المكوّنة لدى المستدعي.
  اتركها غير محددة لاستخدام مهلة الملاحظة/القرار الافتراضية التي يطبقها
  مشغّل الخطافات بشكل عام.

يمكن للمشغلين أيضًا ضبط ميزانيات الخطافات دون تعديل كود Plugin:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

يتجاوز `hooks.timeouts.<hookName>` قيمة `hooks.timeoutMs`، والتي تتجاوز قيمة
`api.on(..., { timeoutMs })` المكتوبة في Plugin. يجب أن تكون كل قيمة مكوّنة
عددًا صحيحًا موجبًا لا يزيد عن 600000 مللي ثانية. فضّل التجاوزات الخاصة بكل
خطاف للخطافات المعروفة ببطئها حتى لا يحصل Plugin واحد على ميزانية أطول في كل مكان.

يتلقى كل خطاف `event.context.pluginConfig`، وهي الإعدادات المحلولة للـ Plugin
الذي سجّل ذلك المعالج. استخدمها لقرارات الخطافات التي تحتاج إلى خيارات Plugin
الحالية؛ يحقنها OpenClaw لكل معالج دون تغيير كائن الحدث المشترك الذي تراه
Plugins الأخرى.

## فهرس الخطافات

تُجمّع الخطافات حسب السطح الذي توسّعه. الأسماء المكتوبة **بخط عريض** تقبل
نتيجة قرار (حظر، إلغاء، تجاوز، أو طلب موافقة)؛ وكل ما عدا ذلك للملاحظة فقط.

**دورة الوكيل**

- `before_model_resolve` - تجاوز المزوّد أو النموذج قبل تحميل رسائل الجلسة
- `agent_turn_prepare` - استهلاك حقنات دورة Plugin الموجودة في الطابور وإضافة سياق للدورة نفسها قبل خطافات الموجه
- `before_prompt_build` - إضافة سياق ديناميكي أو نص موجه نظام قبل استدعاء النموذج
- `before_agent_start` - مرحلة مدمجة للتوافق فقط؛ فضّل الخطافين أعلاه
- **`before_agent_run`** - فحص الموجه النهائي ورسائل الجلسة قبل إرسالها إلى النموذج وحظر التشغيل اختياريًا
- **`before_agent_reply`** - تقصير دورة النموذج برد اصطناعي أو صمت
- **`before_agent_finalize`** - فحص الإجابة النهائية الطبيعية وطلب تمريرة نموذج إضافية
- `agent_end` - ملاحظة الرسائل النهائية وحالة النجاح ومدة التشغيل
- `heartbeat_prompt_contribution` - إضافة سياق خاص بـ Heartbeat فقط لـ Plugins مراقبة الخلفية ودورة الحياة

**ملاحظة المحادثة**

- `model_call_started` / `model_call_ended` - ملاحظة بيانات تعريف مستدعى المزوّد/النموذج المنقّاة، والتوقيت، والنتيجة، وتجزئات معرّف الطلب المحدودة دون محتوى الموجه أو الاستجابة
- `llm_input` - ملاحظة مدخلات المزوّد (موجه النظام، الموجه، السجل)
- `llm_output` - ملاحظة مخرجات المزوّد

**الأدوات**

- **`before_tool_call`** - إعادة كتابة معاملات الأداة، أو حظر التنفيذ، أو طلب الموافقة
- `after_tool_call` - ملاحظة نتائج الأداة والأخطاء والمدة
- **`tool_result_persist`** - إعادة كتابة رسالة المساعد الناتجة من نتيجة أداة
- **`before_message_write`** - فحص كتابة رسالة قيد التنفيذ أو حظرها (نادر)

**الرسائل والتسليم**

- **`inbound_claim`** - المطالبة برسالة واردة قبل توجيه الوكيل (ردود اصطناعية)
- `message_received` - ملاحظة المحتوى الوارد والمرسل والسلسلة وبيانات التعريف
- **`message_sending`** - إعادة كتابة المحتوى الصادر أو إلغاء التسليم
- `message_sent` - ملاحظة نجاح التسليم الصادر أو فشله
- **`before_dispatch`** - فحص إرسال صادر أو إعادة كتابته قبل تسليمه إلى القناة
- **`reply_dispatch`** - المشاركة في مسار إرسال الرد النهائي

**الجلسات وCompaction**

- `session_start` / `session_end` - تتبع حدود دورة حياة الجلسة
- `before_compaction` / `after_compaction` - ملاحظة دورات Compaction أو إضافة تعليقات توضيحية إليها
- `before_reset` - ملاحظة أحداث إعادة ضبط الجلسة (`/reset`، عمليات إعادة الضبط البرمجية)

**الوكلاء الفرعيون**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - تنسيق توجيه الوكلاء الفرعيين وتسليم الإكمال

**دورة الحياة**

- `gateway_start` / `gateway_stop` - بدء خدمات يملكها Plugin أو إيقافها مع Gateway
- `cron_changed` - ملاحظة تغييرات دورة حياة cron التي يملكها Gateway (أضيفت، حُدّثت، أزيلت، بدأت، انتهت، جُدولت)
- **`before_install`** - فحص عمليات مسح تثبيت Skill أو Plugin وحظرها اختياريًا

## سياسة استدعاء الأداة

يتلقى `before_tool_call` ما يلي:

- `event.toolName`
- `event.params`
- اختياريًا `event.runId`
- اختياريًا `event.toolCallId`
- حقول سياق مثل `ctx.agentId` و`ctx.sessionKey` و`ctx.sessionId`،
  و`ctx.runId` و`ctx.jobId` (يُضبط في التشغيلات المدفوعة بواسطة cron)، والتشخيص `ctx.trace`

يمكنه إرجاع:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

القواعد:

- `block: true` نهائي ويتخطى المعالجات ذات الأولوية الأقل.
- `block: false` يُعامل على أنه بلا قرار.
- `params` يعيد كتابة معاملات الأداة للتنفيذ.
- `requireApproval` يوقف تشغيل الوكيل مؤقتًا ويطلب من المستخدم عبر موافقات Plugin.
  يمكن لأمر `/approve` الموافقة على موافقات exec وPlugin.
- يمكن لـ `block: true` ذي أولوية أقل أن يحظر رغم أن خطافًا ذا أولوية أعلى
  طلب الموافقة.
- يتلقى `onResolution` قرار الموافقة المحلول - `allow-once` أو
  `allow-always` أو `deny` أو `timeout` أو `cancelled`.

يمكن للـ Plugins المضمّنة التي تحتاج إلى سياسة على مستوى المضيف تسجيل سياسات أدوات موثوقة
باستخدام `api.registerTrustedToolPolicy(...)`. تعمل هذه قبل خطافات
`before_tool_call` العادية وقبل قرارات Plugins الخارجية. استخدمها فقط
للبوابات الموثوقة من المضيف مثل سياسة مساحة العمل أو فرض الميزانية أو
سلامة سير العمل المحجوزة. يجب أن تستخدم Plugins الخارجية خطافات `before_tool_call`
العادية.

### استمرارية نتيجة الأداة

يمكن أن تتضمن نتائج الأدوات `details` منظّمة لعرض واجهة المستخدم، أو التشخيصات،
أو توجيه الوسائط، أو بيانات تعريف يملكها Plugin. عامل `details` على أنها
بيانات تعريف وقت التشغيل، وليست محتوى موجه:

- يزيل OpenClaw قيمة `toolResult.details` قبل إعادة التشغيل لدى المزوّد ومدخلات Compaction
  حتى لا تصبح بيانات التعريف سياقًا للنموذج.
- تحتفظ إدخالات الجلسة المستمرة فقط بـ `details` محدودة. تُستبدل التفاصيل
  كبيرة الحجم بملخص مضغوط و`persistedDetailsTruncated: true`.
- يعمل `tool_result_persist` و`before_message_write` قبل حد الاستمرارية النهائي.
  يجب أن تبقي الخطافات مع ذلك `details` المُرجعة صغيرة، وأن تتجنب وضع نص
  ذي صلة بالموجه في `details` فقط؛ ضع مخرجات الأداة المرئية للنموذج في
  `content`.

## خطافات الموجه والنموذج

استخدم الخطافات الخاصة بكل مرحلة للـ Plugins الجديدة:

- `before_model_resolve`: يتلقى فقط الموجه الحالي وبيانات تعريف المرفقات.
  أعد `providerOverride` أو `modelOverride`.
- `agent_turn_prepare`: يتلقى الموجه الحالي، ورسائل الجلسة المُعدّة،
  وأي حقنات في الطابور لمرة واحدة بالضبط جرى تفريغها لهذه الجلسة. أعد
  `prependContext` أو `appendContext`.
- `before_prompt_build`: يتلقى الموجه الحالي ورسائل الجلسة.
  أعد `prependContext` أو `appendContext` أو `systemPrompt`
  أو `prependSystemContext` أو `appendSystemContext`.
- `heartbeat_prompt_contribution`: يعمل فقط لدورات Heartbeat ويعيد
  `prependContext` أو `appendContext`. وهو مخصص لمراقبي الخلفية
  الذين يحتاجون إلى تلخيص الحالة الحالية دون تغيير الدورات التي يبدأها المستخدم.

يبقى `before_agent_start` للتوافق. فضّل الخطافات الصريحة أعلاه
حتى لا يعتمد Plugin لديك على مرحلة مدمجة قديمة.

يعمل `before_agent_run` بعد إنشاء الموجه وقبل أي مدخلات للنموذج،
بما في ذلك تحميل الصور المحلية للموجه وملاحظة `llm_input`. يتلقى
مدخل المستخدم الحالي كـ `prompt`، إضافة إلى سجل الجلسة المحمّل في `messages`
وموجه النظام النشط. أعد `{ outcome: "block", reason, message? }`
لإيقاف التشغيل قبل أن يتمكن النموذج من قراءة الموجه. `reason` داخلي؛
و`message` هو البديل الظاهر للمستخدم. النتائج الوحيدة المدعومة هي
`pass` و`block`؛ تفشل أشكال القرارات غير المدعومة بشكل مغلق.

عند حظر تشغيل، يخزّن OpenClaw النص البديل فقط في
`message.content` إضافة إلى بيانات تعريف حظر غير حساسة مثل معرّف Plugin
الذي حظر والطابع الزمني. لا يُحتفظ بنص المستخدم الأصلي في النسخة أو السياق
المستقبلي. تُعامل أسباب الحظر الداخلية على أنها حساسة وتُستثنى من
حمولات النسخة والسجل والبث والسجل التشغيلي والتشخيصات. يجب أن تستخدم
قابلية الملاحظة حقولًا منقّاة مثل معرّف الحاظر، أو النتيجة، أو الطابع الزمني،
أو فئة آمنة.

يتضمن `before_agent_start` و`agent_end` قيمة `event.runId` عندما يستطيع OpenClaw
تحديد التشغيل النشط. وتتوفر القيمة نفسها أيضًا على `ctx.runId`.
كما تعرض التشغيلات المدفوعة بواسطة Cron قيمة `ctx.jobId` (معرّف مهمة cron الأصلية) حتى
تستطيع خطافات Plugin حصر المقاييس، أو الآثار الجانبية، أو الحالة في مهمة مجدولة محددة.

بالنسبة للتشغيلات الناشئة من قناة، يكون `ctx.messageProvider` هو سطح المزوّد
مثل `discord` أو `telegram`، بينما يكون `ctx.channelId` هو معرّف هدف المحادثة
عندما يستطيع OpenClaw اشتقاقه من مفتاح الجلسة أو بيانات تعريف التسليم.

`agent_end` هو خطاف ملاحظة ويعمل بأسلوب الإطلاق دون انتظار بعد الدورة. يطبق
مشغّل الخطافات مهلة 30 ثانية حتى لا يترك Plugin عالق أو نقطة نهاية تضمين
وعد الخطاف معلقًا إلى الأبد. تُسجّل المهلة ويواصل OpenClaw؛ ولا تلغي
عمل الشبكة الذي يملكه Plugin ما لم يستخدم Plugin أيضًا إشارة إلغاء خاصة به.

استخدم `model_call_started` و`model_call_ended` لقياسات مستدعى المزوّد
التي ينبغي ألا تتلقى الموجهات الخام أو السجل أو الاستجابات أو الرؤوس أو
أجسام الطلبات أو معرّفات طلبات المزوّد. تتضمن هذه الخطافات بيانات تعريف
ثابتة مثل `runId` و`callId` و`provider` و`model` و`api`/`transport` الاختياريين،
و`durationMs`/`outcome` النهائيين، و`upstreamRequestIdHash` عندما يستطيع OpenClaw
اشتقاق تجزئة محدودة لمعرّف طلب المزوّد.

يعمل `before_agent_finalize` فقط عندما يكون إطار الاختبار على وشك قبول إجابة
مساعد نهائية طبيعية. إنه ليس مسار إلغاء `/stop` ولا يعمل عندما يوقف المستخدم
دورة. أعد `{ action: "revise", reason }` لطلب تمريرة نموذج إضافية واحدة من
الإطار قبل الإنهاء، أو `{ action:
"finalize", reason? }` لفرض الإنهاء، أو اترك النتيجة لمتابعة المسار.
تُمرّر خطافات Codex الأصلية `Stop` إلى هذا الخطاف كقرارات OpenClaw
`before_agent_finalize`.

عند إرجاع `action: "revise"`، يمكن للـ Plugins تضمين بيانات تعريف `retry` لجعل
تمريرة النموذج الإضافية محدودة وآمنة لإعادة التشغيل:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

تُلحَق `instruction` بسبب المراجعة المُرسَل إلى الحاضنة.
يتيح `idempotencyKey` للمضيف عدّ محاولات إعادة المحاولة لطلب plugin نفسه عبر
قرارات الإنهاء المتكافئة، ويحدّ `maxAttempts` عدد المرورّات الإضافية التي
سيسمح بها المضيف قبل المتابعة بالإجابة النهائية الطبيعية.

يجب على plugins غير المضمّنة التي تحتاج إلى خطّافات المحادثة الخام (`before_model_resolve`،
`before_agent_reply`، `llm_input`، `llm_output`، `before_agent_finalize`،
`agent_end`، أو `before_agent_run`) ضبط ما يلي:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

يمكن تعطيل الخطّافات التي تعدّل المطالبة وحقن الدور التالي الدائمة لكل plugin
باستخدام `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### امتدادات الجلسة وحقن الدور التالي

يمكن لـ workflow plugins الاحتفاظ بحالة جلسة صغيرة متوافقة مع JSON باستخدام
`api.registerSessionExtension(...)` وتحديثها عبر طريقة Gateway
`sessions.pluginPatch`. تعرض صفوف الجلسات حالة الامتداد المسجّلة عبر
`pluginExtensions`، مما يتيح لـ Control UI والعملاء الآخرين عرض الحالة المملوكة
للـ plugin من دون معرفة التفاصيل الداخلية للـ plugin.

استخدم `api.enqueueNextTurnInjection(...)` عندما يحتاج plugin إلى سياق دائم
ليصل إلى دور النموذج التالي مرة واحدة فقط بالضبط. يفرّغ OpenClaw الحقن
المصطفة قبل خطّافات المطالبة، ويتخلص من الحقن منتهية الصلاحية، ويزيل
التكرار حسب `idempotencyKey` لكل plugin. هذا هو الموضع المناسب لاستئنافات
الموافقة، وملخصات السياسة، وفروقات مراقبة الخلفية، واستمرارات الأوامر التي
ينبغي أن تكون مرئية للنموذج في الدور التالي ولكن ينبغي ألا تصبح نصا دائما
في مطالبة النظام.

دلالات التنظيف جزء من العقد. تتلقى استدعاءات تنظيف امتداد الجلسة وتنظيف دورة
حياة وقت التشغيل `reset` أو `delete` أو `disable` أو `restart`. يزيل المضيف
حالة امتداد الجلسة الدائمة وحقن الدور التالي المعلقة المملوكة للـ plugin
عند reset/delete/disable؛ بينما يحتفظ restart بحالة الجلسة الدائمة في حين
تتيح استدعاءات التنظيف للـ plugins تحرير مهام المجدول، وسياق التشغيل،
والموارد الأخرى خارج النطاق لجيل وقت التشغيل القديم.

## خطّافات الرسائل

استخدم خطّافات الرسائل لتوجيه مستوى القناة وسياسة التسليم:

- `message_received`: راقب المحتوى الوارد، والمرسل، و`threadId`، و`messageId`،
  و`senderId`، وارتباط التشغيل/الجلسة الاختياري، والبيانات الوصفية.
- `message_sending`: أعد كتابة `content` أو أرجع `{ cancel: true }`.
- `message_sent`: راقب النجاح النهائي أو الفشل.

بالنسبة إلى ردود TTS الصوتية فقط، قد يحتوي `content` على النص المنطوق المخفي
حتى عندما لا تحتوي حمولة القناة على نص/تعليق مرئي. إعادة كتابة ذلك
`content` تحدّث النص المرئي للخطّاف فقط؛ ولا يُعرَض كتعليق وسائط.

تكشف سياقات خطّافات الرسائل حقول ارتباط مستقرة عند توفرها:
`ctx.sessionKey`، و`ctx.runId`، و`ctx.messageId`، و`ctx.senderId`، و`ctx.trace`،
و`ctx.traceId`، و`ctx.spanId`، و`ctx.parentSpanId`، و`ctx.callDepth`. فضّل
هذه الحقول من الدرجة الأولى قبل قراءة البيانات الوصفية القديمة.

فضّل حقلي `threadId` و`replyToId` المطبوعين قبل استخدام البيانات الوصفية
الخاصة بالقناة.

قواعد القرار:

- `message_sending` مع `cancel: true` نهائي.
- `message_sending` مع `cancel: false` يُعامَل كما لو لم يكن هناك قرار.
- يستمر `content` المعاد كتابته إلى الخطّافات ذات الأولوية الأدنى ما لم
  يلغِ خطّاف لاحق التسليم.

## خطّافات التثبيت

يعمل `before_install` بعد الفحص المدمج لتثبيت Skills وplugins. أرجع نتائج
إضافية أو `{ block: true, blockReason }` لإيقاف التثبيت.

`block: true` نهائي. يُعامَل `block: false` كما لو لم يكن هناك قرار.

## دورة حياة Gateway

استخدم `gateway_start` لخدمات plugin التي تحتاج إلى حالة مملوكة لـ Gateway.
يكشف السياق `ctx.config` و`ctx.workspaceDir` و`ctx.getCron?.()` لفحص cron
والتحديثات. استخدم `gateway_stop` لتنظيف الموارد طويلة التشغيل.

لا تعتمد على خطّاف `gateway:startup` الداخلي لخدمات وقت التشغيل المملوكة
للـ plugin.

ينطلق `cron_changed` لأحداث دورة حياة cron المملوكة لـ gateway مع حمولة حدث
مطبوعة تغطي أسباب `added` و`updated` و`removed` و`started` و`finished`
و`scheduled`. يحمل الحدث لقطة `PluginHookGatewayCronJob` (بما في ذلك
`state.nextRunAtMs` و`state.lastRunStatus` و`state.lastError` عند وجودها)
بالإضافة إلى `PluginHookGatewayCronDeliveryStatus` من `not-requested` |
`delivered` | `not-delivered` | `unknown`. لا تزال أحداث الإزالة تحمل لقطة
المهمة المحذوفة كي تتمكن المجدولات الخارجية من تسوية الحالة. استخدم
`ctx.getCron?.()` و`ctx.config` من سياق وقت التشغيل عند مزامنة مجدولات
الإيقاظ الخارجية، وأبقِ OpenClaw مصدر الحقيقة لفحوص الاستحقاق والتنفيذ.

## الإهمالات القادمة

بعض الأسطح المجاورة للخطّافات مهملة لكنها لا تزال مدعومة. انتقل قبل الإصدار
الرئيسي التالي:

- **مغلفات القنوات بالنص العادي** في معالجات `inbound_claim` و`message_received`.
  اقرأ `BodyForAgent` وكتل سياق المستخدم المنظمة بدلا من تحليل نص المغلف
  المسطح. راجع
  [مغلفات القنوات بالنص العادي → BodyForAgent](/ar/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** يبقى للتوافق. ينبغي للـ plugins الجديدة استخدام
  `before_model_resolve` و`before_prompt_build` بدلا من المرحلة المدمجة.
- **`onResolution` في `before_tool_call`** يستخدم الآن اتحاد
  `PluginApprovalResolution` المطبوع (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) بدلا من `string` حرّ الصيغة.

للقائمة الكاملة - تسجيل قدرة الذاكرة، وملف تعريف تفكير المزوّد، ومزوّدي
المصادقة الخارجيين، وأنواع اكتشاف المزوّد، وموصلات الوصول إلى وقت تشغيل
المهام، وإعادة تسمية `command-auth` إلى `command-status` - راجع
[ترحيل Plugin SDK → الإهمالات النشطة](/ar/plugins/sdk-migration#active-deprecations).

## ذو صلة

- [ترحيل Plugin SDK](/ar/plugins/sdk-migration) - الإهمالات النشطة والجدول الزمني للإزالة
- [بناء plugins](/ar/plugins/building-plugins)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints)
- [الخطّافات الداخلية](/ar/automation/hooks)
- [البنية الداخلية لـ Plugin](/ar/plugins/architecture-internals)
