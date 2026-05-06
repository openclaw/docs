---
read_when:
    - أنت تبني Plugin يحتاج إلى before_tool_call، أو before_agent_reply، أو خطافات الرسائل، أو خطافات دورة الحياة
    - تحتاج إلى حظر استدعاءات الأدوات الصادرة من Plugin أو إعادة كتابتها أو اشتراط الموافقة عليها
    - أنت تفاضل بين الخطافات الداخلية وخطافات Plugin
summary: 'خطافات Plugin: اعتراض أحداث دورة حياة الوكيل والأداة والرسالة والجلسة وGateway'
title: خطافات Plugin
x-i18n:
    generated_at: "2026-05-06T08:06:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a149e1b343ea2d3f55855c2d02f4a9519337f0450c8a1428d52cd77ab4046a
    source_path: plugins/hooks.md
    workflow: 16
---

خطافات Plugin هي نقاط توسعة داخل العملية لـ Plugins الخاصة بـ OpenClaw. استخدمها
عندما يحتاج Plugin إلى فحص أو تغيير تشغيلات الوكلاء، أو استدعاءات الأدوات، أو تدفق الرسائل،
أو دورة حياة الجلسة، أو توجيه الوكلاء الفرعيين، أو عمليات التثبيت، أو بدء تشغيل Gateway.

استخدم [الخطافات الداخلية](/ar/automation/hooks) بدلاً من ذلك عندما تريد سكربت
`HOOK.md` صغيراً يثبته المشغل لأحداث الأوامر وGateway مثل
`/new` أو `/reset` أو `/stop` أو `agent:bootstrap` أو `gateway:startup`.

## البدء السريع

سجّل خطافات Plugin typed باستخدام `api.on(...)` من نقطة دخول Plugin لديك:

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

تعمل معالجات الخطافات بالتتابع وفق ترتيب `priority` التنازلي. تحتفظ الخطافات
ذات الأولوية نفسها بترتيب التسجيل.

يقبل `api.on(name, handler, opts?)` ما يلي:

- `priority` - ترتيب المعالج (القيمة الأعلى تعمل أولاً).
- `timeoutMs` - ميزانية اختيارية لكل خطاف. عند تعيينها، يوقف مشغّل الخطافات ذلك
  المعالج بعد انقضاء الميزانية ويتابع إلى التالي، بدلاً من السماح للإعداد البطيء أو عمل
  الاسترجاع باستهلاك مهلة النموذج التي ضبطها المستدعي. احذفها لاستخدام مهلة الملاحظة/القرار
  الافتراضية التي يطبقها مشغّل الخطافات بشكل عام.

يمكن للمشغلين أيضاً تعيين ميزانيات الخطافات دون تعديل كود Plugin:

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
`api.on(..., { timeoutMs })` التي ألّفها Plugin. يجب أن تكون كل قيمة مهيأة
عدداً صحيحاً موجباً لا يزيد عن 600000 مللي ثانية. فضّل التجاوزات لكل خطاف
للخطافات البطيئة المعروفة حتى لا يحصل Plugin واحد على ميزانية أطول في كل مكان.

يتلقى كل خطاف `event.context.pluginConfig`، وهي الإعدادات المحلولة لـ Plugin
الذي سجّل ذلك المعالج. استخدمها لقرارات الخطاف التي تحتاج إلى خيارات Plugin
الحالية؛ يحقنها OpenClaw لكل معالج دون تعديل كائن الحدث المشترك الذي تراه
Plugins الأخرى.

## كتالوج الخطافات

تُجمع الخطافات حسب السطح الذي توسّعه. الأسماء المكتوبة **بالخط العريض** تقبل
نتيجة قرار (حظر، إلغاء، تجاوز، أو طلب موافقة)؛ وكل ما عدا ذلك للملاحظة فقط.

**دورة الوكيل**

- `before_model_resolve` - تجاوز المزود أو النموذج قبل تحميل رسائل الجلسة
- `agent_turn_prepare` - استهلاك حقن دور Plugin الموجودة في قائمة الانتظار وإضافة سياق للدور نفسه قبل خطافات الموجه
- `before_prompt_build` - إضافة سياق ديناميكي أو نص موجّه نظام قبل استدعاء النموذج
- `before_agent_start` - مرحلة مدمجة للتوافق فقط؛ فضّل الخطافين أعلاه
- **`before_agent_reply`** - اختصار دورة النموذج برد اصطناعي أو صمت
- **`before_agent_finalize`** - فحص الإجابة النهائية الطبيعية وطلب تمريرة نموذج أخرى
- `agent_end` - ملاحظة الرسائل النهائية وحالة النجاح ومدة التشغيل
- `heartbeat_prompt_contribution` - إضافة سياق مخصص لـ Heartbeat فقط لـ Plugins الخاصة بالمراقبة الخلفية ودورة الحياة

**ملاحظة المحادثة**

- `model_call_started` / `model_call_ended` - ملاحظة بيانات وصفية منقّحة لاستدعاء المزود/النموذج، والتوقيت، والنتيجة، وتجزيئات معرّف الطلب المحدودة دون محتوى الموجه أو الاستجابة
- `llm_input` - ملاحظة دخل المزود (موجه النظام، الموجه، السجل)
- `llm_output` - ملاحظة خرج المزود

**الأدوات**

- **`before_tool_call`** - إعادة كتابة معاملات الأداة، أو حظر التنفيذ، أو طلب الموافقة
- `after_tool_call` - ملاحظة نتائج الأدوات والأخطاء والمدة
- **`tool_result_persist`** - إعادة كتابة رسالة المساعد الناتجة من نتيجة أداة
- **`before_message_write`** - فحص كتابة رسالة قيد التنفيذ أو حظرها (نادر)

**الرسائل والتسليم**

- **`inbound_claim`** - المطالبة برسالة واردة قبل توجيه الوكيل (ردود اصطناعية)
- `message_received` - ملاحظة المحتوى الوارد والمرسل والسلسلة والبيانات الوصفية
- **`message_sending`** - إعادة كتابة المحتوى الصادر أو إلغاء التسليم
- `message_sent` - ملاحظة نجاح التسليم الصادر أو فشله
- **`before_dispatch`** - فحص إرسال صادر أو إعادة كتابته قبل تسليمه إلى القناة
- **`reply_dispatch`** - المشاركة في مسار إرسال الرد النهائي

**الجلسات وCompaction**

- `session_start` / `session_end` - تتبع حدود دورة حياة الجلسة
- `before_compaction` / `after_compaction` - ملاحظة دورات Compaction أو التعليق عليها
- `before_reset` - ملاحظة أحداث إعادة تعيين الجلسة (`/reset`، عمليات إعادة التعيين البرمجية)

**الوكلاء الفرعيون**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - تنسيق توجيه الوكلاء الفرعيين وتسليم الإكمال

**دورة الحياة**

- `gateway_start` / `gateway_stop` - بدء أو إيقاف الخدمات المملوكة لـ Plugin مع Gateway
- `cron_changed` - ملاحظة تغييرات دورة حياة Cron المملوكة لـ Gateway (مضافة، محدثة، محذوفة، بدأت، انتهت، مجدولة)
- **`before_install`** - فحص عمليات مسح تثبيت Skills أو Plugin وحظرها اختيارياً

## سياسة استدعاء الأدوات

يتلقى `before_tool_call` ما يلي:

- `event.toolName`
- `event.params`
- `event.runId` الاختياري
- `event.toolCallId` الاختياري
- حقول السياق مثل `ctx.agentId` و`ctx.sessionKey` و`ctx.sessionId`،
  و`ctx.runId` و`ctx.jobId` (يُعيّن في التشغيلات المدفوعة بـ Cron)، و`ctx.trace` التشخيصي

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
- يُعامل `block: false` كعدم وجود قرار.
- يعيد `params` كتابة معاملات الأداة للتنفيذ.
- يوقف `requireApproval` تشغيل الوكيل مؤقتاً ويطلب من المستخدم عبر موافقات Plugin.
  يمكن لأمر `/approve` الموافقة على موافقات exec وPlugin معاً.
- لا يزال بإمكان `block: true` ذي أولوية أدنى الحظر بعد أن يطلب خطاف ذو أولوية أعلى
  الموافقة.
- يتلقى `onResolution` قرار الموافقة المحلول - `allow-once` أو
  `allow-always` أو `deny` أو `timeout` أو `cancelled`.

يمكن لـ Plugins المضمّنة التي تحتاج إلى سياسة على مستوى المضيف تسجيل سياسات أدوات موثوقة
باستخدام `api.registerTrustedToolPolicy(...)`. تعمل هذه قبل خطافات
`before_tool_call` العادية وقبل قرارات Plugin الخارجية. استخدمها فقط
للبوابات الموثوقة من المضيف مثل سياسة مساحة العمل، أو فرض الميزانية، أو
سلامة سير العمل المحجوز. يجب أن تستخدم Plugins الخارجية خطافات
`before_tool_call` العادية.

### ثبات نتائج الأدوات

يمكن أن تتضمن نتائج الأدوات `details` منظمة لعرض واجهة المستخدم، أو التشخيصات،
أو توجيه الوسائط، أو البيانات الوصفية المملوكة لـ Plugin. تعامل مع `details`
كبيانات وصفية وقت التشغيل، وليس كمحتوى موجه:

- يزيل OpenClaw `toolResult.details` قبل إعادة تشغيل المزود ودخل Compaction
  حتى لا تصبح البيانات الوصفية سياقاً للنموذج.
- تحتفظ إدخالات الجلسة المثبّتة فقط بـ `details` محدودة. تُستبدل التفاصيل كبيرة الحجم
  بملخص مضغوط و`persistedDetailsTruncated: true`.
- يعمل `tool_result_persist` و`before_message_write` قبل سقف الثبات النهائي.
  يجب أن تبقي الخطافات مع ذلك `details` المُرجعة صغيرة وتتجنب وضع نص ذي صلة بالموجه
  فقط في `details`؛ ضع خرج الأداة المرئي للنموذج في `content`.

## خطافات الموجه والنموذج

استخدم الخطافات الخاصة بالمرحلة لـ Plugins الجديدة:

- `before_model_resolve`: يتلقى الموجه الحالي وبيانات المرفقات الوصفية فقط.
  أرجع `providerOverride` أو `modelOverride`.
- `agent_turn_prepare`: يتلقى الموجه الحالي، ورسائل الجلسة المحضرة،
  وأي حقن في قائمة الانتظار لمرة واحدة بالضبط تم تفريغه لهذه الجلسة. أرجع
  `prependContext` أو `appendContext`.
- `before_prompt_build`: يتلقى الموجه الحالي ورسائل الجلسة.
  أرجع `prependContext` أو `appendContext` أو `systemPrompt`،
  أو `prependSystemContext` أو `appendSystemContext`.
- `heartbeat_prompt_contribution`: يعمل فقط لدورات Heartbeat ويعيد
  `prependContext` أو `appendContext`. وهو مخصص للمراقبات الخلفية
  التي تحتاج إلى تلخيص الحالة الحالية دون تغيير الدورات التي بدأها المستخدم.

يبقى `before_agent_start` للتوافق. فضّل الخطافات الصريحة أعلاه
حتى لا يعتمد Plugin لديك على مرحلة مدمجة قديمة.

يتضمن `before_agent_start` و`agent_end` قيمة `event.runId` عندما يستطيع OpenClaw
تحديد التشغيل النشط. تتوفر القيمة نفسها أيضاً في `ctx.runId`.
كما تعرض التشغيلات المدفوعة بـ Cron قيمة `ctx.jobId` (معرّف مهمة Cron الأصلية) حتى
تتمكن خطافات Plugin من حصر المقاييس أو الآثار الجانبية أو الحالة ضمن مهمة مجدولة محددة.

بالنسبة للتشغيلات الناشئة من قناة، يكون `ctx.messageProvider` هو سطح المزود مثل
`discord` أو `telegram`، بينما يكون `ctx.channelId` هو معرّف هدف المحادثة
عندما يستطيع OpenClaw اشتقاقه من مفتاح الجلسة أو بيانات التسليم الوصفية.

`agent_end` خطاف ملاحظة ويعمل بنمط أطلق وانس بعد الدورة. يطبق مشغّل الخطافات
مهلة 30 ثانية حتى لا يستطيع Plugin عالق أو نقطة نهاية تضمين ترك وعد الخطاف معلقاً
إلى الأبد. تُسجّل المهلة ويتابع OpenClaw؛ ولا تُلغي عمل الشبكة المملوك لـ Plugin
إلا إذا استخدم Plugin أيضاً إشارة إلغاء خاصة به.

استخدم `model_call_started` و`model_call_ended` لقياسات استدعاء المزود
التي يجب ألا تتلقى الموجهات الخام، أو السجل، أو الاستجابات، أو الرؤوس، أو أجسام الطلبات،
أو معرّفات طلبات المزود. تتضمن هذه الخطافات بيانات وصفية ثابتة مثل
`runId` و`callId` و`provider` و`model`، و`api`/`transport` الاختياريين،
و`durationMs`/`outcome` النهائيين، و`upstreamRequestIdHash` عندما يستطيع OpenClaw
اشتقاق تجزئة محدودة لمعرّف طلب المزود.

يعمل `before_agent_finalize` فقط عندما تكون حزمة الاختبار على وشك قبول إجابة
مساعد نهائية طبيعية. ليس هذا مسار إلغاء `/stop` ولا يعمل عندما يوقف المستخدم دورة.
أرجع `{ action: "revise", reason }` لطلب تمريرة نموذج أخرى من حزمة الاختبار
قبل الإنهاء، أو `{ action:
"finalize", reason? }` لفرض الإنهاء، أو احذف النتيجة للمتابعة.
تُمرّر خطافات Codex الأصلية `Stop` إلى هذا الخطاف كقرارات OpenClaw
`before_agent_finalize`.

عند إرجاع `action: "revise"`، يمكن لـ Plugins تضمين بيانات `retry` الوصفية لجعل
تمريرة النموذج الإضافية محدودة وآمنة لإعادة التشغيل:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

تُضاف `instruction` إلى سبب المراجعة المرسل إلى حزمة الاختبار.
يسمح `idempotencyKey` للمضيف بعدّ محاولات الإعادة لطلب Plugin نفسه عبر
قرارات إنهاء متكافئة، ويحدد `maxAttempts` عدد التمريرات الإضافية التي سيسمح بها
المضيف قبل المتابعة بالإجابة النهائية الطبيعية.

يجب على Plugins غير المضمّنة التي تحتاج إلى `llm_input` أو `llm_output`،
أو `before_agent_finalize`، أو `agent_end` تعيين:

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

يمكن تعطيل الخطافات التي تعدّل الموجه وحقن الدور التالي الدائم لكل Plugin
باستخدام `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### امتدادات الجلسة وحقن الدور التالي

يمكن لـ Plugins الخاصة بسير العمل الاحتفاظ بحالة جلسة صغيرة متوافقة مع JSON باستخدام
`api.registerSessionExtension(...)` وتحديثها عبر طريقة Gateway
`sessions.pluginPatch`. تعرض صفوف الجلسات حالة الإضافة المسجلة
عبر `pluginExtensions`، مما يتيح لـ Control UI والعملاء الآخرين عرض
الحالة المملوكة للـ plugin دون الحاجة إلى معرفة التفاصيل الداخلية للـ plugin.

استخدم `api.enqueueNextTurnInjection(...)` عندما يحتاج plugin إلى سياق دائم
ليصل إلى دورة النموذج التالية مرة واحدة بالضبط. يفرغ OpenClaw الحقنات الموجودة في قائمة الانتظار قبل
خطافات الموجهات، ويسقط الحقنات منتهية الصلاحية، ويزيل التكرارات حسب `idempotencyKey`
لكل plugin. هذه هي نقطة الربط المناسبة لاستئناف الموافقات، وملخصات السياسات،
وفروق مراقبة الخلفية، واستمرارات الأوامر التي يجب أن تكون مرئية
للنموذج في الدورة التالية ولكن يجب ألا تصبح نصا دائما في موجه النظام.

دلالات التنظيف جزء من العقد. تتلقى استدعاءات تنظيف إضافات الجلسة
وتنظيف دورة حياة وقت التشغيل `reset` أو `delete` أو `disable` أو
`restart`. يزيل المضيف حالة إضافة الجلسة الدائمة المملوكة للـ plugin
والحقنات المعلقة للدورة التالية عند reset/delete/disable؛ أما restart فيبقي
حالة الجلسة الدائمة بينما تتيح استدعاءات التنظيف للـ plugins تحرير مهام المجدول
وسياق التشغيل والموارد الأخرى خارج النطاق لجيل وقت التشغيل القديم.

## خطافات الرسائل

استخدم خطافات الرسائل لتوجيه مستوى القناة وسياسة التسليم:

- `message_received`: راقب المحتوى الوارد والمرسل و`threadId` و`messageId`
  و`senderId`، والارتباط الاختياري بالتشغيل/الجلسة، والبيانات الوصفية.
- `message_sending`: أعد كتابة `content` أو أرجع `{ cancel: true }`.
- `message_sent`: راقب النجاح أو الفشل النهائي.

بالنسبة إلى ردود TTS الصوتية فقط، قد يحتوي `content` على النص المنطوق المخفي
حتى عندما لا تحتوي حمولة القناة على نص/تعليق مرئي. إعادة كتابة ذلك
`content` تحدث النص المرئي للخطاف فقط؛ ولا يتم عرضه كتعليق
وسائط.

تعرض سياقات خطافات الرسائل حقول ارتباط مستقرة عند توفرها:
`ctx.sessionKey` و`ctx.runId` و`ctx.messageId` و`ctx.senderId` و`ctx.trace`
و`ctx.traceId` و`ctx.spanId` و`ctx.parentSpanId` و`ctx.callDepth`. فضل
هذه الحقول من الدرجة الأولى قبل قراءة البيانات الوصفية القديمة.

فضل حقلي `threadId` و`replyToId` المطبوعين قبل استخدام
بيانات وصفية خاصة بالقناة.

قواعد القرار:

- `message_sending` مع `cancel: true` نهائي.
- `message_sending` مع `cancel: false` يعامل كعدم وجود قرار.
- يستمر `content` المعاد كتابته إلى الخطافات ذات الأولوية الأدنى ما لم يلغ خطاف لاحق
  التسليم.

## خطافات التثبيت

يعمل `before_install` بعد الفحص المدمج لتثبيت Skills والـ plugins.
أرجع نتائج إضافية أو `{ block: true, blockReason }` لإيقاف
التثبيت.

`block: true` نهائي. يعامل `block: false` كعدم وجود قرار.

## دورة حياة Gateway

استخدم `gateway_start` لخدمات plugin التي تحتاج إلى حالة مملوكة للـ Gateway. يكشف
السياق `ctx.config` و`ctx.workspaceDir` و`ctx.getCron?.()` لفحص
cron وتحديثاته. استخدم `gateway_stop` لتنظيف الموارد طويلة التشغيل.

لا تعتمد على خطاف `gateway:startup` الداخلي لخدمات وقت التشغيل
المملوكة للـ plugin.

ينطلق `cron_changed` لأحداث دورة حياة cron المملوكة للـ gateway مع حمولة
حدث مطبوعة تغطي أسباب `added` و`updated` و`removed` و`started` و`finished`
و`scheduled`. يحمل الحدث لقطة `PluginHookGatewayCronJob`
(بما في ذلك `state.nextRunAtMs` و`state.lastRunStatus` و
`state.lastError` عند وجودها) إضافة إلى `PluginHookGatewayCronDeliveryStatus`
بقيمة `not-requested` | `delivered` | `not-delivered` | `unknown`. لا تزال
أحداث الإزالة تحمل لقطة المهمة المحذوفة حتى تتمكن المجدولات الخارجية من
مطابقة الحالة. استخدم `ctx.getCron?.()` و`ctx.config` من سياق وقت التشغيل
عند مزامنة مجدولات الإيقاظ الخارجية، وأبق OpenClaw
مصدر الحقيقة لفحوصات الاستحقاق والتنفيذ.

## الإهمالات القادمة

هناك بعض الأسطح القريبة من الخطافات مهملة لكنها لا تزال مدعومة. انتقل
قبل الإصدار الرئيسي التالي:

- **مغلفات القنوات بالنص العادي** في معالجات `inbound_claim` و`message_received`.
  اقرأ `BodyForAgent` وكتل سياق المستخدم المنظمة
  بدلا من تحليل نص مغلف مسطح. راجع
  [مغلفات القنوات بالنص العادي → BodyForAgent](/ar/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** يبقى للتوافق. يجب على plugins الجديدة استخدام
  `before_model_resolve` و`before_prompt_build` بدلا من المرحلة
  المدمجة.
- **`onResolution` في `before_tool_call`** يستخدم الآن اتحاد
  `PluginApprovalResolution` المطبوع (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) بدلا من `string` حر الصياغة.

للاطلاع على القائمة الكاملة - تسجيل قدرة الذاكرة، وملف تعريف تفكير المزود،
ومزودي المصادقة الخارجيين، وأنواع اكتشاف المزود، وموصلات وقت تشغيل المهام،
وتسمية `command-auth` → `command-status` - راجع
[ترحيل Plugin SDK → الإهمالات النشطة](/ar/plugins/sdk-migration#active-deprecations).

## ذو صلة

- [ترحيل Plugin SDK](/ar/plugins/sdk-migration) - الإهمالات النشطة والجدول الزمني للإزالة
- [بناء plugins](/ar/plugins/building-plugins)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints)
- [الخطافات الداخلية](/ar/automation/hooks)
- [التفاصيل الداخلية لمعمارية Plugin](/ar/plugins/architecture-internals)
