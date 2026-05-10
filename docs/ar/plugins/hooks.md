---
read_when:
    - تُنشئ Plugin يحتاج إلى before_tool_call أو before_agent_reply أو خطافات الرسائل أو خطافات دورة الحياة
    - تحتاج إلى حظر استدعاءات الأدوات من Plugin أو إعادة كتابتها أو طلب الموافقة عليها.
    - أنت تفاضل بين الخطافات الداخلية وخطافات Plugin
summary: 'خطافات Plugin: اعتراض أحداث دورة حياة الوكيل والأداة والرسالة والجلسة وGateway'
title: خطافات Plugin
x-i18n:
    generated_at: "2026-05-10T19:50:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: ebdbb743441dfa9eba3d476171c1c8e9d9628d2669aeea0806ede19bafd61f62
    source_path: plugins/hooks.md
    workflow: 16
---

خطافات Plugin هي نقاط توسعة داخل العملية لـ Plugins في OpenClaw. استخدمها
عندما يحتاج Plugin إلى فحص أو تغيير تشغيلات الوكيل، أو استدعاءات الأدوات، أو تدفق الرسائل،
أو دورة حياة الجلسة، أو توجيه الوكلاء الفرعيين، أو التثبيتات، أو بدء تشغيل Gateway.

استخدم [الخطافات الداخلية](/ar/automation/hooks) بدلا من ذلك عندما تريد سكربت
`HOOK.md` صغيرا يثبته المشغل لأحداث الأوامر و Gateway مثل
`/new` أو `/reset` أو `/stop` أو `agent:bootstrap` أو `gateway:startup`.

## البدء السريع

سجل خطافات Plugin المكتوبة باستخدام `api.on(...)` من مدخل Plugin الخاص بك:

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

تعمل معالجات الخطافات تسلسليا بترتيب `priority` تنازلي. تحتفظ الخطافات ذات
الأولوية نفسها بترتيب التسجيل.

يقبل `api.on(name, handler, opts?)` ما يلي:

- `priority` - ترتيب المعالجات (الأعلى يعمل أولا).
- `timeoutMs` - ميزانية اختيارية لكل خطاف. عند ضبطها، يوقف مشغل الخطافات ذلك
  المعالج بعد انقضاء الميزانية ويتابع إلى المعالج التالي، بدلا من ترك إعداد بطيء أو عمل
  استدعاء ذاكرة يستهلك مهلة النموذج المضبوطة لدى المستدعي. احذفها لاستخدام مهلة
  الملاحظة/القرار الافتراضية التي يطبقها مشغل الخطافات بشكل عام.

يمكن للمشغلين أيضا ضبط ميزانيات الخطافات دون تعديل كود Plugin:

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
`api.on(..., { timeoutMs })` التي كتبها Plugin. يجب أن تكون كل قيمة مضبوطة
عددا صحيحا موجبا لا يزيد عن 600000 مللي ثانية. فضل التجاوزات لكل خطاف
للخطافات البطيئة المعروفة حتى لا يحصل Plugin واحد على ميزانية أطول في كل مكان.

يتلقى كل خطاف `event.context.pluginConfig`، وهي الإعدادات المحلولة للـ
Plugin الذي سجل ذلك المعالج. استخدمها لقرارات الخطافات التي تحتاج إلى
خيارات Plugin الحالية؛ يحقنها OpenClaw لكل معالج دون تغيير كائن الحدث
المشترك الذي تراه Plugins الأخرى.

## فهرس الخطافات

تجمع الخطافات حسب السطح الذي توسعه. تقبل الأسماء المكتوبة **بالخط العريض**
نتيجة قرار (حظر، إلغاء، تجاوز، أو طلب موافقة)؛ أما البقية كلها فهي للملاحظة فقط.

**دورة الوكيل**

- `before_model_resolve` - تجاوز المزود أو النموذج قبل تحميل رسائل الجلسة
- `agent_turn_prepare` - استهلاك حقن دور Plugin الموضوعة في الطابور وإضافة سياق للدور نفسه قبل خطافات المطالبة
- `before_prompt_build` - إضافة سياق ديناميكي أو نص مطالبة نظام قبل استدعاء النموذج
- `before_agent_start` - مرحلة مدمجة للتوافق فقط؛ فضل الخطافين أعلاه
- **`before_agent_run`** - فحص المطالبة النهائية ورسائل الجلسة قبل إرسالها إلى النموذج وحظر التشغيل اختياريا
- **`before_agent_reply`** - اختصار دورة النموذج برد اصطناعي أو صمت
- **`before_agent_finalize`** - فحص الإجابة النهائية الطبيعية وطلب تمريرة نموذج إضافية
- `agent_end` - ملاحظة الرسائل النهائية وحالة النجاح ومدة التشغيل
- `heartbeat_prompt_contribution` - إضافة سياق خاص بـ Heartbeat فقط لـ Plugins المراقبة الخلفية ودورة الحياة

**ملاحظة المحادثة**

- `model_call_started` / `model_call_ended` - ملاحظة بيانات تعريف استدعاء المزود/النموذج المنقحة، والتوقيت، والنتيجة، وتجزئات معرف الطلب المحدودة دون محتوى المطالبة أو الاستجابة
- `llm_input` - ملاحظة مدخلات المزود (مطالبة النظام، المطالبة، السجل)
- `llm_output` - ملاحظة مخرجات المزود

**الأدوات**

- **`before_tool_call`** - إعادة كتابة معاملات الأداة، أو حظر التنفيذ، أو طلب موافقة
- `after_tool_call` - ملاحظة نتائج الأداة والأخطاء والمدة
- **`tool_result_persist`** - إعادة كتابة رسالة المساعد الناتجة من نتيجة أداة
- **`before_message_write`** - فحص أو حظر كتابة رسالة قيد التنفيذ (نادر)

**الرسائل والتسليم**

- **`inbound_claim`** - المطالبة برسالة واردة قبل توجيه الوكيل (ردود اصطناعية)
- `message_received` - ملاحظة المحتوى الوارد والمرسل والسلسلة وبيانات التعريف
- **`message_sending`** - إعادة كتابة المحتوى الصادر أو إلغاء التسليم
- `message_sent` - ملاحظة نجاح التسليم الصادر أو فشله
- **`before_dispatch`** - فحص أو إعادة كتابة إرسال صادر قبل التسليم إلى القناة
- **`reply_dispatch`** - المشاركة في مسار إرسال الرد النهائي

**الجلسات و Compaction**

- `session_start` / `session_end` - تتبع حدود دورة حياة الجلسة
- `before_compaction` / `after_compaction` - ملاحظة دورات Compaction أو إضافة تعليقات توضيحية إليها
- `before_reset` - ملاحظة أحداث إعادة ضبط الجلسة (`/reset`، عمليات إعادة الضبط البرمجية)

**الوكلاء الفرعيون**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - تنسيق توجيه الوكلاء الفرعيين وتسليم الإكمال

**دورة الحياة**

- `gateway_start` / `gateway_stop` - بدء أو إيقاف الخدمات المملوكة لـ Plugin مع Gateway
- `cron_changed` - ملاحظة تغييرات دورة حياة Cron المملوكة لـ Gateway (مضافة، محدثة، محذوفة، بدأت، انتهت، مجدولة)
- **`before_install`** - فحص عمليات مسح تثبيت Skill أو Plugin وحظرها اختياريا

## سياسة استدعاء الأدوات

يتلقى `before_tool_call` ما يلي:

- `event.toolName`
- `event.params`
- `event.derivedPaths` اختياري، يحتوي على تلميحات مسار هدف مشتقة من المضيف
  بأفضل جهد لأغلفة أدوات معروفة مثل `apply_patch`؛ عند وجودها،
  قد تكون هذه المسارات غير مكتملة أو قد تبالغ في تقدير ما ستلمسه الأداة
  فعليا (مثلا، مع مدخلات مشوهة أو جزئية)
- `event.runId` اختياري
- `event.toolCallId` اختياري
- حقول سياق مثل `ctx.agentId` و `ctx.sessionKey` و `ctx.sessionId` و
  `ctx.runId` و `ctx.jobId` (يضبط في التشغيلات المدفوعة بـ Cron)، و `ctx.trace` التشخيصي

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

- `block: true` نهائي ويتجاوز المعالجات ذات الأولوية الأدنى.
- `block: false` يعامل كما لو أنه لا يوجد قرار.
- `params` يعيد كتابة معاملات الأداة للتنفيذ.
- `requireApproval` يوقف تشغيل الوكيل مؤقتا ويطلب من المستخدم عبر موافقات Plugin.
  يمكن لأمر `/approve` الموافقة على موافقات exec و Plugin معا.
- لا يزال بإمكان `block: true` ذي أولوية أدنى الحظر بعد أن يطلب خطاف ذو أولوية أعلى
  الموافقة.
- يتلقى `onResolution` قرار الموافقة المحلول - `allow-once` أو
  `allow-always` أو `deny` أو `timeout` أو `cancelled`.

يمكن لـ Plugins المضمنة التي تحتاج إلى سياسة على مستوى المضيف تسجيل سياسات أدوات موثوقة
باستخدام `api.registerTrustedToolPolicy(...)`. تعمل هذه قبل خطافات
`before_tool_call` العادية وقبل قرارات Plugin الخارجية. استخدمها فقط
للبوابات الموثوقة من المضيف مثل سياسة مساحة العمل، أو فرض الميزانية، أو
سلامة سير العمل المحجوزة. يجب أن تستخدم Plugins الخارجية خطافات
`before_tool_call` العادية.

### استمرار نتائج الأدوات

يمكن أن تتضمن نتائج الأدوات `details` منظمة لعرض واجهة المستخدم، أو التشخيصات،
أو توجيه الوسائط، أو بيانات التعريف المملوكة لـ Plugin. تعامل مع `details`
كبيانات تعريف وقت تشغيل، لا كمحتوى مطالبة:

- يزيل OpenClaw `toolResult.details` قبل إعادة التشغيل لدى المزود ومدخلات
  Compaction حتى لا تصبح بيانات التعريف سياقا للنموذج.
- تحتفظ إدخالات الجلسة المستمرة فقط بـ `details` محدودة. تستبدل التفاصيل الزائدة
  بملخص مضغوط و `persistedDetailsTruncated: true`.
- يعمل `tool_result_persist` و `before_message_write` قبل حد الاستمرار
  النهائي. ومع ذلك يجب أن تبقي الخطافات `details` المعادة صغيرة وأن تتجنب
  وضع نص ذي صلة بالمطالبة في `details` فقط؛ ضع مخرجات الأداة المرئية للنموذج
  في `content`.

## خطافات المطالبة والنموذج

استخدم الخطافات الخاصة بالمرحلة لـ Plugins الجديدة:

- `before_model_resolve`: يتلقى المطالبة الحالية وبيانات تعريف المرفقات فقط.
  أعد `providerOverride` أو `modelOverride`.
- `agent_turn_prepare`: يتلقى المطالبة الحالية، ورسائل الجلسة المعدة،
  وأي حقن موضوعة في الطابور لمرة واحدة بالضبط تم تفريغها لهذه الجلسة. أعد
  `prependContext` أو `appendContext`.
- `before_prompt_build`: يتلقى المطالبة الحالية ورسائل الجلسة.
  أعد `prependContext` أو `appendContext` أو `systemPrompt` أو
  `prependSystemContext` أو `appendSystemContext`.
- `heartbeat_prompt_contribution`: يعمل فقط لدورات Heartbeat ويعيد
  `prependContext` أو `appendContext`. وهو مخصص للمراقبات الخلفية
  التي تحتاج إلى تلخيص الحالة الحالية دون تغيير الدورات التي يبدأها المستخدم.

يبقى `before_agent_start` للتوافق. فضل الخطافات الصريحة أعلاه
حتى لا يعتمد Plugin الخاص بك على مرحلة مدمجة قديمة.

يعمل `before_agent_run` بعد إنشاء المطالبة وقبل أي مدخلات للنموذج،
بما في ذلك تحميل الصور المحلية للمطالبة وملاحظة `llm_input`. يتلقى
مدخل المستخدم الحالي كـ `prompt`، إضافة إلى سجل الجلسة المحمل في `messages`
ومطالبة النظام النشطة. أعد `{ outcome: "block", reason, message? }`
لإيقاف التشغيل قبل أن يتمكن النموذج من قراءة المطالبة. `reason` داخلي؛
و `message` هو البديل المعروض للمستخدم. النتائج الوحيدة المدعومة هي
`pass` و `block`؛ تفشل أشكال القرار غير المدعومة بشكل مغلق.

عندما يحظر تشغيل، يخزن OpenClaw نص الاستبدال فقط في
`message.content` إضافة إلى بيانات تعريف حظر غير حساسة مثل معرف Plugin
الذي حظر والطابع الزمني. لا يحتفظ بالنص الأصلي للمستخدم في النص الحرفي أو
السياق المستقبلي. تعامل أسباب الحظر الداخلية كحساسة وتستبعد من
النص الحرفي، والسجل، والبث، والسجل التشغيلي، وحمولات التشخيص. يجب أن تستخدم
قابلية الملاحظة حقولا منقحة مثل معرف الحاظر، أو النتيجة، أو الطابع الزمني، أو
فئة آمنة.

يتضمن `before_agent_start` و `agent_end` قيمة `event.runId` عندما يستطيع OpenClaw
تحديد التشغيل النشط. تتوفر القيمة نفسها أيضا في `ctx.runId`.
تعرض التشغيلات المدفوعة بـ Cron أيضا `ctx.jobId` (معرف مهمة Cron الأصلية) حتى
تتمكن خطافات Plugin من تحديد نطاق المقاييس، أو الآثار الجانبية، أو الحالة إلى
مهمة مجدولة محددة.

للتشغيلات الناشئة من القنوات، يكون `ctx.messageProvider` سطح المزود مثل
`discord` أو `telegram`، بينما يكون `ctx.channelId` معرف هدف المحادثة
عندما يستطيع OpenClaw اشتقاقه من مفتاح الجلسة أو بيانات تعريف التسليم.

`agent_end` خطاف ملاحظة ويعمل بأسلوب أطلق وانس بعد الدورة. يطبق
مشغل الخطافات مهلة قدرها 30 ثانية حتى لا يترك Plugin عالق أو نقطة نهاية
تضمين وعد الخطاف معلقا إلى الأبد. تسجل المهلة ويتابع OpenClaw؛
ولا تلغي عمل الشبكة المملوك لـ Plugin إلا إذا استخدم Plugin أيضا إشارة
إلغاء خاصة به.

استخدم `model_call_started` و `model_call_ended` لقياسات استدعاء المزود
التي يجب ألا تتلقى مطالبات خاما، أو سجلا، أو استجابات، أو ترويسات، أو أجسام
طلبات، أو معرفات طلبات المزود. تتضمن هذه الخطافات بيانات تعريف مستقرة مثل
`runId` و `callId` و `provider` و `model`، و `api`/`transport` اختياريين،
و `durationMs`/`outcome` النهائيتين، و `upstreamRequestIdHash` عندما يستطيع
OpenClaw اشتقاق تجزئة محدودة لمعرف طلب المزود.

`before_agent_finalize` لا يعمل إلا عندما تكون harness على وشك قبول إجابة مساعد نهائية طبيعية. إنه ليس مسار إلغاء `/stop` ولا يعمل عندما يُجهض المستخدم دورة. أعد `{ action: "revise", reason }` لطلب مرور نموذج إضافي واحد من harness قبل الإنهاء، أو `{ action:
"finalize", reason? }` لفرض الإنهاء، أو احذف النتيجة للمتابعة.
تُمرَّر خطافات `Stop` الأصلية في Codex إلى هذا الخطاف كقرارات OpenClaw
`before_agent_finalize`.

عند إرجاع `action: "revise"`، يمكن لـ plugins تضمين بيانات تعريف `retry` لجعل
مرور النموذج الإضافي محدودًا وآمنًا لإعادة التشغيل:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

تُلحَق `instruction` بسبب المراجعة المرسل إلى harness.
تتيح `idempotencyKey` للمضيف عدّ المحاولات المتكررة لطلب plugin نفسه عبر
قرارات إنهاء متكافئة، وتحد `maxAttempts` عدد المرور الإضافي الذي سيسمح به
المضيف قبل المتابعة بالإجابة النهائية الطبيعية.

يجب على plugins غير المضمّنة التي تحتاج إلى خطافات محادثة خام (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end`, أو `before_agent_run`) ضبط:

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

يمكن تعطيل خطافات تعديل المطالبات وحقن الدورة التالية الدائمة لكل plugin
باستخدام `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### امتدادات الجلسة وحقن الدورة التالية

يمكن لـ plugins سير العمل الاحتفاظ بحالة جلسة صغيرة متوافقة مع JSON باستخدام
`api.registerSessionExtension(...)` وتحديثها عبر طريقة Gateway
`sessions.pluginPatch`. تعرض صفوف الجلسة حالة الامتداد المسجلة عبر
`pluginExtensions`، مما يتيح لـ Control UI والعملاء الآخرين عرض حالة يملكها
plugin دون معرفة تفاصيل plugin الداخلية.

استخدم `api.enqueueNextTurnInjection(...)` عندما يحتاج plugin إلى سياق دائم
يصل إلى دورة النموذج التالية مرة واحدة بالضبط. يفرغ OpenClaw الحقن في قائمة
الانتظار قبل خطافات المطالبة، ويسقط الحقن منتهية الصلاحية، ويزيل التكرار حسب
`idempotencyKey` لكل plugin. هذا هو موضع التوسعة الصحيح لاستئناف الموافقات،
وملخصات السياسات، وفروقات المراقبة الخلفية، واستمرارات الأوامر التي يجب أن
تكون مرئية للنموذج في الدورة التالية ولكن لا يجب أن تصبح نص مطالبة نظام دائمًا.

دلالات التنظيف جزء من العقد. تتلقى عمليات تنظيف امتداد الجلسة واستدعاءات تنظيف
دورة حياة وقت التشغيل `reset` أو `delete` أو `disable` أو `restart`. يزيل
المضيف حالة امتداد الجلسة الدائمة التي يملكها plugin وحقن الدورة التالية
المعلقة عند reset/delete/disable؛ أما restart فيُبقي حالة الجلسة الدائمة بينما
تتيح استدعاءات التنظيف لـ plugins تحرير مهام المجدول، وسياق التشغيل، والموارد
الأخرى خارج النطاق لجيل وقت التشغيل القديم.

## خطافات الرسائل

استخدم خطافات الرسائل لسياسة التوجيه والتسليم على مستوى القناة:

- `message_received`: راقب المحتوى الوارد، والمرسل، و`threadId`، و`messageId`،
  و`senderId`، وارتباط التشغيل/الجلسة الاختياري، وبيانات التعريف.
- `message_sending`: أعد كتابة `content` أو أعد `{ cancel: true }`.
- `message_sent`: راقب النجاح أو الفشل النهائي.

بالنسبة إلى ردود TTS الصوتية فقط، قد يحتوي `content` على النص المنطوق المخفي
حتى عندما لا تحتوي حمولة القناة على نص/تعليق مرئي. إعادة كتابة هذا `content`
تحدّث النص المرئي للخطاف فقط؛ ولا يُعرض كتعليق وسائط.

تعرض سياقات خطافات الرسائل حقول ارتباط مستقرة عند توفرها:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, و`ctx.callDepth`. فضّل هذه
الحقول من الدرجة الأولى قبل قراءة بيانات التعريف القديمة.

فضّل حقلي `threadId` و`replyToId` الم typed قبل استخدام بيانات التعريف الخاصة
بالقناة.

قواعد القرار:

- `message_sending` مع `cancel: true` نهائي.
- `message_sending` مع `cancel: false` يُعامل كعدم وجود قرار.
- يستمر `content` المعاد كتابته إلى الخطافات ذات الأولوية الأدنى ما لم يلغِ
  خطاف لاحق التسليم.
- يمكن لـ `message_sending` إرجاع `cancelReason` و`metadata` محدودة مع الإلغاء.
  تعرض واجهات API الجديدة لدورة حياة الرسائل هذا كنتيجة تسليم مكبوتة بسبب
  `cancelled_by_message_sending_hook`؛ أما التسليم المباشر القديم فيستمر في
  إرجاع مصفوفة نتائج فارغة للتوافق.
- `message_sent` للمراقبة فقط. تُسجَّل إخفاقات المعالج ولا تغيّر نتيجة التسليم.

## خطافات التثبيت

يعمل `before_install` بعد الفحص المضمّن لتثبيت Skills وplugins. أعد نتائج
إضافية أو `{ block: true, blockReason }` لإيقاف التثبيت.

`block: true` نهائي. يُعامل `block: false` كعدم وجود قرار.

## دورة حياة Gateway

استخدم `gateway_start` لخدمات plugin التي تحتاج إلى حالة يملكها Gateway. يعرض
السياق `ctx.config`، و`ctx.workspaceDir`، و`ctx.getCron?.()` لفحص cron
وتحديثاته. استخدم `gateway_stop` لتنظيف الموارد طويلة التشغيل.

لا تعتمد على خطاف `gateway:startup` الداخلي لخدمات وقت التشغيل التي يملكها
plugin.

ينطلق `cron_changed` لأحداث دورة حياة cron المملوكة لـ gateway مع حمولة حدث
typed تغطي أسباب `added`، و`updated`، و`removed`، و`started`، و`finished`،
و`scheduled`. يحمل الحدث لقطة `PluginHookGatewayCronJob` (بما في ذلك
`state.nextRunAtMs`، و`state.lastRunStatus`، و`state.lastError` عند وجودها)
إضافة إلى `PluginHookGatewayCronDeliveryStatus` بقيمة `not-requested` |
`delivered` | `not-delivered` | `unknown`. لا تزال أحداث الإزالة تحمل لقطة
المهمة المحذوفة حتى تتمكن المجدولات الخارجية من تسوية الحالة. استخدم
`ctx.getCron?.()` و`ctx.config` من سياق وقت التشغيل عند مزامنة مجدولات
الإيقاظ الخارجية، وأبقِ OpenClaw مصدر الحقيقة لفحوص الاستحقاق والتنفيذ.

## الإهمالات القادمة

بعض الأسطح المجاورة للخطافات مهملة لكنها لا تزال مدعومة. انتقل قبل الإصدار
الرئيسي التالي:

- **مظاريف القنوات ذات النص الصريح** في معالجات `inbound_claim` و`message_received`.
  اقرأ `BodyForAgent` وكتل سياق المستخدم المنظمة بدلًا من تحليل نص مظروف مسطح.
  راجع [مظاريف القنوات ذات النص الصريح → BodyForAgent](/ar/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** يبقى للتوافق. يجب على plugins الجديدة استخدام
  `before_model_resolve` و`before_prompt_build` بدلًا من المرحلة المدمجة.
- **`onResolution` في `before_tool_call`** يستخدم الآن اتحاد
  `PluginApprovalResolution` typed (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) بدلًا من `string` حر الشكل.

للقائمة الكاملة - تسجيل قدرة الذاكرة، وملف تعريف تفكير المزوّد، ومزوّدي
المصادقة الخارجيين، وأنواع اكتشاف المزوّدين، وموصّلات وقت تشغيل المهام، وإعادة
تسمية `command-auth` → `command-status` - راجع
[ترحيل Plugin SDK → الإهمالات النشطة](/ar/plugins/sdk-migration#active-deprecations).

## ذات صلة

- [ترحيل Plugin SDK](/ar/plugins/sdk-migration) - الإهمالات النشطة والجدول الزمني للإزالة
- [بناء plugins](/ar/plugins/building-plugins)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints)
- [الخطافات الداخلية](/ar/automation/hooks)
- [تفاصيل بنية Plugin الداخلية](/ar/plugins/architecture-internals)
