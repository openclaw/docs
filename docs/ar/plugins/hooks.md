---
read_when:
    - أنت تبني Plugin يحتاج إلى before_tool_call أو before_agent_reply أو خطافات الرسائل أو خطافات دورة الحياة
    - تحتاج إلى حظر استدعاءات الأدوات الصادرة من Plugin أو إعادة كتابتها أو اشتراط الموافقة عليها
    - أنت تفاضل بين الخطافات الداخلية وخطافات Plugin
summary: 'خطافات Plugin: اعتراض أحداث دورة حياة الوكيل والأداة والرسالة والجلسة وGateway'
title: خطافات Plugin
x-i18n:
    generated_at: "2026-05-11T20:37:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: b363b8ed7452f0d8bdb267d3eaa38f579d6d7cfb7ace2085ac35baf9b253b575
    source_path: plugins/hooks.md
    workflow: 16
---

خطافات Plugin هي نقاط امتداد داخل العملية لـ OpenClaw plugins. استخدمها
عندما يحتاج Plugin إلى فحص أو تغيير تشغيلات الوكيل، أو استدعاءات الأدوات، أو تدفق الرسائل،
أو دورة حياة الجلسة، أو توجيه الوكلاء الفرعيين، أو عمليات التثبيت، أو بدء تشغيل Gateway.

استخدم [الخطافات الداخلية](/ar/automation/hooks) بدلا من ذلك عندما تريد سكربت
`HOOK.md` صغيرا يثبته المشغل لأحداث الأوامر وGateway مثل
`/new` أو `/reset` أو `/stop` أو `agent:bootstrap` أو `gateway:startup`.

## البدء السريع

سجل خطافات Plugin المكتوبة الأنواع باستخدام `api.on(...)` من نقطة إدخال Plugin لديك:

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

تعمل معالجات الخطافات تسلسليا بترتيب تنازلي حسب `priority`. تحتفظ الخطافات
ذات الأولوية نفسها بترتيب التسجيل.

يقبل `api.on(name, handler, opts?)` ما يلي:

- `priority` - ترتيب المعالجات (الأعلى يعمل أولا).
- `timeoutMs` - ميزانية اختيارية لكل خطاف. عند ضبطها، يوقف مشغل الخطافات ذلك
  المعالج بعد انقضاء الميزانية ويتابع إلى التالي، بدلا من السماح لإعداد بطيء أو
  عمل استدعاء بأن يستهلك مهلة النموذج المكونة لدى المستدعي.
  احذفها لاستخدام مهلة الملاحظة/القرار الافتراضية التي يطبقها
  مشغل الخطافات بشكل عام.

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
`api.on(..., { timeoutMs })` التي كتبها Plugin. يجب أن تكون كل قيمة مكونة
عددا صحيحا موجبا لا يزيد عن 600000 مللي ثانية. فضل التجاوزات لكل خطاف
للخطافات البطيئة المعروفة حتى لا يحصل Plugin واحد على ميزانية أطول
في كل مكان.

يتلقى كل خطاف `event.context.pluginConfig`، وهي الإعدادات المحلولة لـ
Plugin الذي سجل ذلك المعالج. استخدمها لقرارات الخطاف التي تحتاج
خيارات Plugin الحالية؛ يحقنها OpenClaw لكل معالج دون تغيير كائن الحدث
المشترك الذي تراه plugins الأخرى.

## فهرس الخطافات

تجمع الخطافات حسب السطح الذي توسعه. الأسماء المكتوبة بـ **خط عريض** تقبل
نتيجة قرار (حظر أو إلغاء أو تجاوز أو طلب موافقة)؛ وكل ما عداها
للملاحظة فقط.

**دورة الوكيل**

- `before_model_resolve` - تجاوز المزود أو النموذج قبل تحميل رسائل الجلسة
- `agent_turn_prepare` - استهلاك حقنات دور Plugin المصطفة وإضافة سياق للدورة نفسها قبل خطافات المطالبة
- `before_prompt_build` - إضافة سياق ديناميكي أو نص مطالبة نظام قبل استدعاء النموذج
- `before_agent_start` - مرحلة مدمجة للتوافق فقط؛ فضل الخطافين أعلاه
- **`before_agent_run`** - فحص المطالبة النهائية ورسائل الجلسة قبل إرسالها إلى النموذج وحظر التشغيل اختياريا
- **`before_agent_reply`** - قطع دورة النموذج برد اصطناعي أو صمت
- **`before_agent_finalize`** - فحص الإجابة النهائية الطبيعية وطلب مرور نموذج إضافي
- `agent_end` - ملاحظة الرسائل النهائية وحالة النجاح ومدة التشغيل
- `heartbeat_prompt_contribution` - إضافة سياق خاص بـ Heartbeat فقط لـ plugins مراقبة الخلفية ودورة الحياة

**ملاحظة المحادثة**

- `model_call_started` / `model_call_ended` - ملاحظة بيانات وصفية منقحة لاستدعاء المزود/النموذج، والتوقيت، والنتيجة، وتجزئات معرف الطلب المحدودة دون محتوى المطالبة أو الاستجابة
- `llm_input` - ملاحظة دخل المزود (مطالبة النظام، المطالبة، السجل)
- `llm_output` - ملاحظة خرج المزود

**الأدوات**

- **`before_tool_call`** - إعادة كتابة معاملات الأداة أو حظر التنفيذ أو طلب الموافقة
- `after_tool_call` - ملاحظة نتائج الأداة والأخطاء والمدة
- **`tool_result_persist`** - إعادة كتابة رسالة المساعد الناتجة من نتيجة أداة
- **`before_message_write`** - فحص أو حظر كتابة رسالة قيد التقدم (نادر)

**الرسائل والتسليم**

- **`inbound_claim`** - المطالبة برسالة واردة قبل توجيه الوكيل (ردود اصطناعية)
- `message_received` - ملاحظة المحتوى الوارد والمرسل والسلسلة والبيانات الوصفية
- **`message_sending`** - إعادة كتابة المحتوى الصادر أو إلغاء التسليم
- `message_sent` - ملاحظة نجاح أو فشل التسليم الصادر
- **`before_dispatch`** - فحص أو إعادة كتابة إرسال صادر قبل تسليمه إلى القناة
- **`reply_dispatch`** - المشاركة في خط أنابيب إرسال الرد النهائي

**الجلسات وCompaction**

- `session_start` / `session_end` - تتبع حدود دورة حياة الجلسة. تكون قيمة `reason` في الحدث واحدة من `new` أو `reset` أو `idle` أو `daily` أو `compaction` أو `deleted` أو `shutdown` أو `restart` أو `unknown`. تنطلق قيمتا `shutdown` و`restart` من منهي إيقاف Gateway عندما تتوقف العملية أو يعاد تشغيلها بينما لا تزال الجلسات نشطة، حتى تتمكن plugins اللاحقة (مثل مخازن الذاكرة أو النصوص) من إنهاء الصفوف الشبحية التي كانت ستترك في حالة مفتوحة عبر عمليات إعادة التشغيل. المنهي محدود زمنيا حتى لا يستطيع Plugin بطيء حظر SIGTERM/SIGINT.
- `before_compaction` / `after_compaction` - ملاحظة دورات Compaction أو إضافة تعليقات توضيحية إليها
- `before_reset` - ملاحظة أحداث إعادة ضبط الجلسة (`/reset`، عمليات إعادة الضبط البرمجية)

**الوكلاء الفرعيون**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - تنسيق توجيه الوكلاء الفرعيين وتسليم الإكمال

**دورة الحياة**

- `gateway_start` / `gateway_stop` - بدء أو إيقاف الخدمات التي يملكها Plugin مع Gateway
- `cron_changed` - ملاحظة تغييرات دورة حياة Cron التي يملكها Gateway (أضيف، حدث، أزيل، بدأ، انتهى، جدول)
- **`before_install`** - فحص عمليات مسح تثبيت Skills أو Plugin وحظرها اختياريا

## سياسة استدعاء الأدوات

يتلقى `before_tool_call` ما يلي:

- `event.toolName`
- `event.params`
- `event.derivedPaths` اختياري، ويحتوي على تلميحات مسارات هدف مستنتجة من المضيف بأفضل جهد
  لأغلفة الأدوات المعروفة مثل `apply_patch`؛ عند وجودها،
  قد تكون هذه المسارات غير مكتملة أو قد تبالغ في تقريب ما ستلمسه الأداة
  فعليا (على سبيل المثال، مع مدخلات مشوهة أو جزئية)
- `event.runId` اختياري
- `event.toolCallId` اختياري
- حقول سياق مثل `ctx.agentId` و`ctx.sessionKey` و`ctx.sessionId`،
  و`ctx.runId` و`ctx.jobId` (تضبط في التشغيلات المدفوعة بـ Cron)، و`ctx.trace` التشخيصي

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

- `block: true` نهائي ويتخطى المعالجات ذات الأولوية الأدنى.
- `block: false` يعامل على أنه لا قرار.
- `params` يعيد كتابة معاملات الأداة للتنفيذ.
- `requireApproval` يوقف تشغيل الوكيل مؤقتا ويطلب من المستخدم عبر موافقات Plugin.
  يمكن لأمر `/approve` الموافقة على موافقات exec وPlugin معا.
- يمكن لـ `block: true` ذي أولوية أدنى أن يظل قادرا على الحظر بعد أن يطلب خطاف أعلى أولوية
  الموافقة.
- يتلقى `onResolution` قرار الموافقة المحلول - `allow-once` أو
  `allow-always` أو `deny` أو `timeout` أو `cancelled`.

يمكن لـ plugins المضمنة التي تحتاج سياسة على مستوى المضيف تسجيل سياسات أدوات موثوقة
باستخدام `api.registerTrustedToolPolicy(...)`. تعمل هذه قبل خطافات
`before_tool_call` العادية وقبل قرارات Plugin الخارجية. استخدمها فقط
للبوابات الموثوقة من المضيف مثل سياسة مساحة العمل أو فرض الميزانية أو
سلامة سير العمل المحجوزة. يجب أن تستخدم plugins الخارجية خطافات `before_tool_call`
العادية.

### استمرار نتيجة الأداة

يمكن أن تتضمن نتائج الأدوات `details` منظمة لعرض الواجهة، أو التشخيصات،
أو توجيه الوسائط، أو البيانات الوصفية التي يملكها Plugin. عامل `details` كبيانات وصفية وقت التشغيل،
وليس كمحتوى مطالبة:

- يزيل OpenClaw `toolResult.details` قبل إعادة تشغيل المزود ودخل Compaction
  حتى لا تصبح البيانات الوصفية سياقا للنموذج.
- تحتفظ إدخالات الجلسة المستمرة فقط بـ `details` محدودة. تستبدل التفاصيل الكبيرة
  بملخص مضغوط و`persistedDetailsTruncated: true`.
- يعمل `tool_result_persist` و`before_message_write` قبل حد الاستمرار النهائي.
  يجب أن تبقي الخطافات مع ذلك `details` المعادة صغيرة وتتجنب
  وضع نص ذي صلة بالمطالبة في `details` فقط؛ ضع خرج الأداة المرئي للنموذج
  في `content`.

## خطافات المطالبة والنموذج

استخدم الخطافات الخاصة بالمرحلة لـ plugins الجديدة:

- `before_model_resolve`: يتلقى فقط المطالبة الحالية والبيانات الوصفية للمرفقات.
  أرجع `providerOverride` أو `modelOverride`.
- `agent_turn_prepare`: يتلقى المطالبة الحالية ورسائل الجلسة المحضرة
  وأي حقنات مصفوفة مرة واحدة بالضبط تم تفريغها لهذه الجلسة. أرجع
  `prependContext` أو `appendContext`.
- `before_prompt_build`: يتلقى المطالبة الحالية ورسائل الجلسة.
  أرجع `prependContext` أو `appendContext` أو `systemPrompt`
  أو `prependSystemContext` أو `appendSystemContext`.
- `heartbeat_prompt_contribution`: يعمل فقط لدورات Heartbeat ويرجع
  `prependContext` أو `appendContext`. وهو مخصص لمراقبي الخلفية
  الذين يحتاجون إلى تلخيص الحالة الحالية دون تغيير الدورات التي بدأها المستخدم.

يبقى `before_agent_start` لأغراض التوافق. فضل الخطافات الصريحة أعلاه
حتى لا يعتمد Plugin لديك على مرحلة مدمجة قديمة.

يعمل `before_agent_run` بعد إنشاء المطالبة وقبل أي دخل للنموذج،
بما في ذلك تحميل الصور المحلي للمطالبة وملاحظة `llm_input`. يتلقى
دخل المستخدم الحالي باسم `prompt`، بالإضافة إلى سجل الجلسة المحمل في `messages`
ومطالبة النظام النشطة. أرجع `{ outcome: "block", reason, message? }`
لإيقاف التشغيل قبل أن يتمكن النموذج من قراءة المطالبة. `reason` داخلي؛
`message` هو البديل الموجه للمستخدم. النتائج الوحيدة المدعومة هي
`pass` و`block`؛ تفشل أشكال القرار غير المدعومة بشكل مغلق.

عند حظر تشغيل، يخزن OpenClaw نص البديل فقط في
`message.content` بالإضافة إلى بيانات وصفية غير حساسة للحظر مثل معرف Plugin
الذي حظر والطابع الزمني. لا يحتفظ بالنص الأصلي للمستخدم في النص أو السياق
المستقبلي. تعامل أسباب الحظر الداخلية على أنها حساسة وتستبعد من
النص، والسجل، والبث، والسجلات، وحمولات التشخيص. يجب أن تستخدم قابلية الملاحظة
حقولا منقحة مثل معرف الحاظر، أو النتيجة، أو الطابع الزمني، أو فئة آمنة.

يتضمن `before_agent_start` و`agent_end` قيمة `event.runId` عندما يستطيع OpenClaw
تحديد التشغيل النشط. تتوفر القيمة نفسها أيضا في `ctx.runId`.
تعرض التشغيلات المدفوعة بـ Cron أيضا `ctx.jobId` (معرف مهمة Cron الأصلية) حتى
تستطيع خطافات Plugin حصر المقاييس أو الآثار الجانبية أو الحالة في مهمة مجدولة
محددة.

بالنسبة للتشغيلات الناشئة من القنوات، يكون `ctx.messageProvider` هو سطح المزود مثل
`discord` أو `telegram`، بينما يكون `ctx.channelId` معرف هدف المحادثة
عندما يستطيع OpenClaw اشتقاقه من مفتاح الجلسة أو بيانات التسليم
الوصفية.

`agent_end` هو خطاف ملاحظة ويعمل بأسلوب الإطلاق والنسيان بعد الدورة. يطبق
مشغل الخطافات مهلة 30 ثانية حتى لا يتمكن Plugin عالق أو نقطة نهاية تضمين
من ترك وعد الخطاف معلقا إلى الأبد. تسجل المهلة ويتابع
OpenClaw؛ ولا تلغي عمل الشبكة الذي يملكه Plugin إلا إذا كان
Plugin يستخدم أيضا إشارة إجهاض خاصة به.

استخدم `model_call_started` و`model_call_ended` لقياسات استدعاءات المزوّد
التي يجب ألا تتلقى المطالبات الخام أو السجل أو الردود أو الرؤوس أو أجسام الطلبات
أو معرّفات طلبات المزوّد. تتضمن هذه الخطافات بيانات وصفية مستقرة مثل
`runId` و`callId` و`provider` و`model` و`api`/`transport` الاختياريين، و`durationMs`/`outcome` النهائية، و`upstreamRequestIdHash` عندما يستطيع OpenClaw اشتقاق
تجزئة محدودة لمعرّف طلب المزوّد.

يعمل `before_agent_finalize` فقط عندما تكون الحاضنة على وشك قبول إجابة مساعد
نهائية طبيعية. إنه ليس مسار إلغاء `/stop` ولا يعمل عندما يوقف المستخدم دورة. أعد `{ action: "revise", reason }` لطلب تمريرة نموذج إضافية من
الحاضنة قبل الإنهاء، أو `{ action:
"finalize", reason? }` لفرض الإنهاء، أو احذف النتيجة للمتابعة.
تُمرَّر خطافات Codex الأصلية `Stop` إلى هذا الخطاف كقرارات OpenClaw
`before_agent_finalize`.

عند إرجاع `action: "revise"`، يمكن للـ plugins تضمين بيانات `retry` الوصفية لجعل
تمريرة النموذج الإضافية محدودة وآمنة لإعادة التشغيل:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

تُلحَق `instruction` بسبب المراجعة المرسل إلى الحاضنة.
يتيح `idempotencyKey` للمضيف عدّ المحاولات للطلب نفسه من الـ Plugin عبر
قرارات إنهاء متكافئة، ويحد `maxAttempts` عدد التمريرات الإضافية التي
سيسمح بها المضيف قبل المتابعة بالإجابة النهائية الطبيعية.

يجب على الـ plugins غير المجمّعة التي تحتاج إلى خطافات المحادثة الخام (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end`, أو `before_agent_run`) ضبط ما يلي:

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

يمكن تعطيل الخطافات التي تعدّل المطالبات وحقن الدور التالي الدائمة لكل Plugin
باستخدام `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### امتدادات الجلسة وحقن الدور التالي

يمكن لـ plugins سير العمل الاحتفاظ بحالة جلسة صغيرة متوافقة مع JSON باستخدام
`api.registerSessionExtension(...)` وتحديثها عبر طريقة Gateway
`sessions.pluginPatch`. تعرض صفوف الجلسات حالة الامتداد المسجلة عبر
`pluginExtensions`، مما يتيح لـ Control UI والعملاء الآخرين عرض
حالة يملكها الـ Plugin دون معرفة تفاصيله الداخلية.

استخدم `api.enqueueNextTurnInjection(...)` عندما يحتاج Plugin إلى سياق دائم
ليصل إلى دورة النموذج التالية مرة واحدة بالضبط. يفرغ OpenClaw الحقنات المصطفة قبل
خطافات المطالبات، ويسقط الحقنات المنتهية، ويزيل التكرار حسب `idempotencyKey`
لكل Plugin. هذا هو الموضع الصحيح لاستئناف الموافقات، وملخصات السياسات،
وفروق مراقبة الخلفية، ومتابعات الأوامر التي يجب أن تكون مرئية للنموذج في
الدورة التالية ولكن يجب ألا تصبح نص مطالبة نظام دائم.

دلالات التنظيف جزء من العقد. تتلقى استدعاءات تنظيف امتداد الجلسة وتنظيف
دورة حياة وقت التشغيل `reset` أو `delete` أو `disable` أو
`restart`. يزيل المضيف حالة امتداد الجلسة الدائمة والحقنات المعلقة للدور التالي
الخاصة بالـ Plugin المالك عند reset/delete/disable؛ بينما يحتفظ restart
بحالة الجلسة الدائمة في حين تسمح استدعاءات التنظيف للـ plugins بتحرير مهام
المجدول، وسياق التشغيل، والموارد الأخرى خارج النطاق لجيل وقت التشغيل القديم.

## خطافات الرسائل

استخدم خطافات الرسائل لسياسة التوجيه والتسليم على مستوى القناة:

- `message_received`: راقب المحتوى الوارد، والمرسل، و`threadId`، و`messageId`,
  و`senderId`، وارتباط التشغيل/الجلسة الاختياري، والبيانات الوصفية.
- `message_sending`: أعد كتابة `content` أو أعد `{ cancel: true }`.
- `message_sent`: راقب النجاح أو الفشل النهائي.

بالنسبة إلى ردود TTS الصوتية فقط، قد يحتوي `content` على النص المنطوق المخفي
حتى عندما لا تحتوي حمولة القناة على نص/تعليق مرئي. إعادة كتابة ذلك
`content` تحدّث النص المرئي للخطاف فقط؛ ولا يُعرض كتعليق وسائط.

تعرض سياقات خطافات الرسائل حقول ارتباط مستقرة عند توفرها:
`ctx.sessionKey`، و`ctx.runId`، و`ctx.messageId`، و`ctx.senderId`، و`ctx.trace`،
و`ctx.traceId`، و`ctx.spanId`، و`ctx.parentSpanId`، و`ctx.callDepth`. فضّل
هذه الحقول من الدرجة الأولى قبل قراءة البيانات الوصفية القديمة.

فضّل حقلي `threadId` و`replyToId` المطبوعين قبل استخدام البيانات الوصفية الخاصة بالقناة.

قواعد القرار:

- `message_sending` مع `cancel: true` نهائي.
- `message_sending` مع `cancel: false` يُعامل كعدم وجود قرار.
- يستمر `content` المعاد كتابته إلى الخطافات ذات الأولوية الأدنى ما لم يلغِ خطاف لاحق
  التسليم.
- يمكن لـ `message_sending` إرجاع `cancelReason` و`metadata` محدودة مع
  الإلغاء. تعرض واجهات API الجديدة لدورة حياة الرسائل ذلك كنتيجة تسليم مكبوتة
  بالسبب `cancelled_by_message_sending_hook`؛ بينما يستمر التسليم المباشر القديم
  في إرجاع مصفوفة نتائج فارغة للتوافق.
- `message_sent` للملاحظة فقط. تُسجَّل إخفاقات المعالج ولا
  تغيّر نتيجة التسليم.

## خطافات التثبيت

يعمل `before_install` بعد الفحص المدمج لتثبيت Skills والـ plugins.
أعد نتائج إضافية أو `{ block: true, blockReason }` لإيقاف
التثبيت.

`block: true` نهائي. يُعامل `block: false` كعدم وجود قرار.

## دورة حياة Gateway

استخدم `gateway_start` لخدمات الـ Plugin التي تحتاج إلى حالة مملوكة لـ Gateway. يعرض
السياق `ctx.config` و`ctx.workspaceDir` و`ctx.getCron?.()` من أجل
فحص Cron وتحديثه. استخدم `gateway_stop` لتنظيف الموارد طويلة التشغيل.

لا تعتمد على خطاف `gateway:startup` الداخلي لخدمات وقت التشغيل المملوكة للـ Plugin.

ينطلق `cron_changed` لأحداث دورة حياة cron المملوكة للـ Gateway مع حمولة
حدث مطبوعة تغطي أسباب `added` و`updated` و`removed` و`started` و`finished`
و`scheduled`. يحمل الحدث لقطة `PluginHookGatewayCronJob`
(بما في ذلك `state.nextRunAtMs` و`state.lastRunStatus` و
`state.lastError` عند وجودها) بالإضافة إلى `PluginHookGatewayCronDeliveryStatus`
بقيمة `not-requested` | `delivered` | `not-delivered` | `unknown`. ما زالت
أحداث الإزالة تحمل لقطة المهمة المحذوفة حتى تتمكن المجدولات الخارجية من
تسوية الحالة. استخدم `ctx.getCron?.()` و`ctx.config` من سياق وقت التشغيل
عند مزامنة مجدولات الإيقاظ الخارجية، واجعل OpenClaw مصدر الحقيقة
لفحوصات الاستحقاق والتنفيذ.

## الإهمالات القادمة

هناك بعض الأسطح المجاورة للخطافات مهملة لكنها ما زالت مدعومة. انتقل
قبل الإصدار الرئيسي التالي:

- **أغلفة القنوات بالنص العادي** في معالجات `inbound_claim` و`message_received`.
  اقرأ `BodyForAgent` وكتل سياق المستخدم المهيكلة
  بدلاً من تحليل نص الغلاف المسطح. راجع
  [أغلفة القنوات بالنص العادي → BodyForAgent](/ar/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** يبقى للتوافق. يجب على الـ plugins الجديدة استخدام
  `before_model_resolve` و`before_prompt_build` بدلاً من المرحلة
  المدمجة.
- **`onResolution` في `before_tool_call`** يستخدم الآن اتحاد
  `PluginApprovalResolution` المطبوع (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) بدلاً من `string` حرّ الصياغة.

للحصول على القائمة الكاملة - تسجيل قدرة الذاكرة، وملف التفكير للمزوّد،
ومزوّدو المصادقة الخارجيون، وأنواع اكتشاف المزوّد، وموصلات وقت تشغيل المهمة،
وإعادة تسمية `command-auth` → `command-status` - راجع
[ترحيل Plugin SDK → الإهمالات النشطة](/ar/plugins/sdk-migration#active-deprecations).

## ذات صلة

- [ترحيل Plugin SDK](/ar/plugins/sdk-migration) - الإهمالات النشطة والجدول الزمني للإزالة
- [بناء plugins](/ar/plugins/building-plugins)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints)
- [الخطافات الداخلية](/ar/automation/hooks)
- [داخليات بنية Plugin](/ar/plugins/architecture-internals)
