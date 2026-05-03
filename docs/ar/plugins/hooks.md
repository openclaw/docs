---
read_when:
    - أنت تبني Plugin يحتاج إلى before_tool_call أو before_agent_reply أو خطافات الرسائل أو خطافات دورة الحياة
    - تحتاج إلى حظر استدعاءات الأدوات من Plugin أو إعادة كتابتها أو طلب الموافقة عليها
    - أنت تفاضل بين الخطافات الداخلية وخطافات Plugin
summary: 'خطافات Plugin: اعتراض أحداث دورة حياة الوكيل والأداة والرسالة والجلسة وGateway'
title: خطافات Plugin
x-i18n:
    generated_at: "2026-05-03T21:39:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c4ed060f1b89917e1f2f46d2da9448cd562edbcd6ce03bc9b1a83da3ed9a591
    source_path: plugins/hooks.md
    workflow: 16
---

خطافات Plugin هي نقاط تمديد داخل العملية من أجل Plugins في OpenClaw. استخدمها
عندما يحتاج Plugin إلى فحص تشغيلات الوكيل أو تغييرها، أو استدعاءات الأدوات، أو تدفق الرسائل،
أو دورة حياة الجلسة، أو توجيه الوكلاء الفرعيين، أو عمليات التثبيت، أو بدء تشغيل Gateway.

استخدم [الخطافات الداخلية](/ar/automation/hooks) بدلا من ذلك عندما تريد سكربت
`HOOK.md` صغيرا يثبته المشغل لأحداث الأوامر وGateway مثل
`/new` أو `/reset` أو `/stop` أو `agent:bootstrap` أو `gateway:startup`.

## البدء السريع

سجل خطافات Plugin المكتوبة باستخدام `api.on(...)` من نقطة دخول Plugin لديك:

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

تعمل معالجات الخطافات بالتتابع وفق `priority` تنازلي. أما الخطافات ذات الأولوية نفسها
فتحتفظ بترتيب التسجيل.

يقبل `api.on(name, handler, opts?)` ما يلي:

- `priority` — ترتيب المعالج (الأعلى يعمل أولا).
- `timeoutMs` — ميزانية اختيارية لكل خطاف. عند ضبطها، يوقف مشغل الخطافات ذلك
  المعالج بعد انقضاء الميزانية ويتابع مع التالي، بدلا من ترك الإعداد البطيء أو عمل
  الاستدعاء يستهلك مهلة النموذج التي ضبطها المستدعي. احذفها لاستخدام مهلة الملاحظة/القرار
  الافتراضية التي يطبقها مشغل الخطافات عموما.

يمكن للمشغلين أيضا ضبط ميزانيات الخطافات من دون تعديل كود Plugin:

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

يتجاوز `hooks.timeouts.<hookName>` قيمة `hooks.timeoutMs`، التي تتجاوز قيمة
`api.on(..., { timeoutMs })` التي كتبها Plugin. يجب أن تكون كل قيمة مضبوطة
عددا صحيحا موجبا لا يتجاوز 600000 مللي ثانية. فضل التجاوزات لكل خطاف
للخطافات المعروفة ببطئها حتى لا يحصل Plugin واحد على ميزانية أطول في كل مكان.

يتلقى كل خطاف `event.context.pluginConfig`، وهي الإعدادات المحلولة للـ
Plugin الذي سجل ذلك المعالج. استخدمها لقرارات الخطافات التي تحتاج إلى خيارات
Plugin الحالية؛ يحقنها OpenClaw لكل معالج من دون تغيير كائن الحدث المشترك
الذي تراه Plugins الأخرى.

## كتالوج الخطافات

تجمع الخطافات حسب السطح الذي تمدده. الأسماء المكتوبة بـ **خط عريض** تقبل
نتيجة قرار (حظر، أو إلغاء، أو تجاوز، أو طلب موافقة)؛ أما البقية فللملاحظة فقط.

**دورة الوكيل**

- `before_model_resolve` — تجاوز المزود أو النموذج قبل تحميل رسائل الجلسة
- `agent_turn_prepare` — استهلاك حقن دور Plugin المصطفة وإضافة سياق في الدور نفسه قبل خطافات الموجه
- `before_prompt_build` — إضافة سياق ديناميكي أو نص موجه نظام قبل استدعاء النموذج
- `before_agent_start` — مرحلة مدمجة للتوافق فقط؛ فضل الخطافين أعلاه
- **`before_agent_reply`** — اختصار دورة النموذج برد اصطناعي أو صمت
- **`before_agent_finalize`** — فحص الإجابة النهائية الطبيعية وطلب مرور نموذج إضافي واحد
- `agent_end` — ملاحظة الرسائل النهائية، وحالة النجاح، ومدة التشغيل
- `heartbeat_prompt_contribution` — إضافة سياق مخصص لـ Heartbeat فقط من أجل Plugins المراقبة الخلفية ودورة الحياة

**ملاحظة المحادثة**

- `model_call_started` / `model_call_ended` — ملاحظة بيانات تعريف استدعاء المزود/النموذج المنقحة، والتوقيت، والنتيجة، وتجزئات معرف الطلب المحدودة من دون محتوى الموجه أو الاستجابة
- `llm_input` — ملاحظة إدخال المزود (موجه النظام، الموجه، السجل)
- `llm_output` — ملاحظة خرج المزود

**الأدوات**

- **`before_tool_call`** — إعادة كتابة معاملات الأداة، أو حظر التنفيذ، أو طلب موافقة
- `after_tool_call` — ملاحظة نتائج الأدوات، والأخطاء، والمدة
- **`tool_result_persist`** — إعادة كتابة رسالة المساعد الناتجة من نتيجة أداة
- **`before_message_write`** — فحص كتابة رسالة قيد التقدم أو حظرها (نادر)

**الرسائل والتسليم**

- **`inbound_claim`** — المطالبة برسالة واردة قبل توجيه الوكيل (ردود اصطناعية)
- `message_received` — ملاحظة المحتوى الوارد، والمرسل، وسلسلة المحادثة، وبيانات التعريف
- **`message_sending`** — إعادة كتابة المحتوى الصادر أو إلغاء التسليم
- `message_sent` — ملاحظة نجاح التسليم الصادر أو فشله
- **`before_dispatch`** — فحص إرسال صادر أو إعادة كتابته قبل التسليم إلى القناة
- **`reply_dispatch`** — المشاركة في مسار إرسال الرد النهائي

**الجلسات وCompaction**

- `session_start` / `session_end` — تتبع حدود دورة حياة الجلسة
- `before_compaction` / `after_compaction` — ملاحظة دورات Compaction أو التعليق عليها
- `before_reset` — ملاحظة أحداث إعادة ضبط الجلسة (`/reset`، عمليات إعادة الضبط البرمجية)

**الوكلاء الفرعيون**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — تنسيق توجيه الوكلاء الفرعيين وتسليم الإكمال

**دورة الحياة**

- `gateway_start` / `gateway_stop` — بدء أو إيقاف الخدمات المملوكة لـ Plugin مع Gateway
- `cron_changed` — ملاحظة تغييرات دورة حياة Cron المملوكة لـ Gateway (أضيفت، حدثت، أزيلت، بدأت، انتهت، جدولت)
- **`before_install`** — فحص عمليات مسح تثبيت Skills أو Plugin وحظرها اختياريا

## سياسة استدعاء الأدوات

يتلقى `before_tool_call` ما يلي:

- `event.toolName`
- `event.params`
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
- يعامل `block: false` كما لو أنه لا يوجد قرار.
- يعيد `params` كتابة معاملات الأداة للتنفيذ.
- يوقف `requireApproval` تشغيل الوكيل مؤقتا ويطلب من المستخدم عبر موافقات Plugin.
  يمكن لأمر `/approve` الموافقة على موافقات exec وموافقات Plugin معا.
- لا يزال بإمكان `block: true` من أولوية أدنى الحظر بعد أن يطلب خطاف أعلى أولوية
  الموافقة.
- يتلقى `onResolution` قرار الموافقة المحلول — `allow-once`،
  أو `allow-always`، أو `deny`، أو `timeout`، أو `cancelled`.

يمكن لـ Plugins المضمنة التي تحتاج إلى سياسة على مستوى المضيف تسجيل سياسات أدوات موثوقة
باستخدام `api.registerTrustedToolPolicy(...)`. تعمل هذه قبل خطافات
`before_tool_call` العادية وقبل قرارات Plugin الخارجية. استخدمها فقط
للبوابات الموثوقة من المضيف مثل سياسة مساحة العمل، أو فرض الميزانية، أو
سلامة سير العمل المحجوزة. يجب أن تستخدم Plugins الخارجية خطافات `before_tool_call`
العادية.

### استمرارية نتيجة الأداة

يمكن أن تتضمن نتائج الأدوات `details` منظمة لعرض واجهة المستخدم، أو التشخيصات،
أو توجيه الوسائط، أو بيانات التعريف المملوكة لـ Plugin. عامل `details` كبيانات تعريف وقت تشغيل،
وليس كمحتوى موجه:

- يزيل OpenClaw `toolResult.details` قبل إعادة التشغيل لدى المزود ومدخلات Compaction
  حتى لا تصبح بيانات التعريف سياق نموذج.
- تحتفظ إدخالات الجلسة المستمرة بـ `details` محدودة فقط. تستبدل التفاصيل الضخمة
  بملخص موجز و`persistedDetailsTruncated: true`.
- يعمل `tool_result_persist` و`before_message_write` قبل حد الاستمرارية
  النهائي. يجب أن تبقي الخطافات `details` المرجعة صغيرة مع ذلك، وأن تتجنب
  وضع نص ذي صلة بالموجه فقط في `details`؛ ضع خرج الأداة المرئي للنموذج
  في `content`.

## خطافات الموجه والنموذج

استخدم الخطافات الخاصة بالمرحلة لـ Plugins الجديدة:

- `before_model_resolve`: يتلقى الموجه الحالي وبيانات تعريف المرفقات فقط.
  أرجع `providerOverride` أو `modelOverride`.
- `agent_turn_prepare`: يتلقى الموجه الحالي، ورسائل الجلسة المحضرة،
  وأي حقن مصطفة لمرة واحدة بالضبط جرى تصريفها لهذه الجلسة. أرجع
  `prependContext` أو `appendContext`.
- `before_prompt_build`: يتلقى الموجه الحالي ورسائل الجلسة.
  أرجع `prependContext` أو `appendContext` أو `systemPrompt`،
  أو `prependSystemContext`، أو `appendSystemContext`.
- `heartbeat_prompt_contribution`: يعمل فقط لدورات Heartbeat ويرجع
  `prependContext` أو `appendContext`. وهو مخصص للمراقبات الخلفية
  التي تحتاج إلى تلخيص الحالة الحالية من دون تغيير الدورات التي يبدأها المستخدم.

يبقى `before_agent_start` للتوافق. فضل الخطافات الصريحة أعلاه
حتى لا يعتمد Plugin لديك على مرحلة مدمجة قديمة.

يتضمن `before_agent_start` و`agent_end` قيمة `event.runId` عندما يستطيع OpenClaw
تحديد التشغيل النشط. تتوفر القيمة نفسها أيضا في `ctx.runId`.
تعرض التشغيلات المدفوعة بـ Cron أيضا `ctx.jobId` (معرف مهمة Cron الأصلية) حتى
تستطيع خطافات Plugin حصر المقاييس، أو الآثار الجانبية، أو الحالة ضمن مهمة مجدولة
معينة.

بالنسبة للتشغيلات الناشئة من قناة، يكون `ctx.messageProvider` هو سطح المزود مثل
`discord` أو `telegram`، بينما يكون `ctx.channelId` معرف هدف المحادثة
عندما يستطيع OpenClaw اشتقاقه من مفتاح الجلسة أو بيانات تعريف التسليم.

`agent_end` خطاف ملاحظة ويعمل بنمط أطلق وانس بعد الدور. يطبق مشغل
الخطافات مهلة قدرها 30 ثانية حتى لا يترك Plugin عالق أو نقطة نهاية تضمين
وعد الخطاف معلقا إلى الأبد. تسجل المهلة ويتابع OpenClaw؛ ولا تلغي عمل
الشبكة المملوك لـ Plugin إلا إذا استخدم Plugin أيضا إشارة إيقاف خاصة به.

استخدم `model_call_started` و`model_call_ended` لقياسات استدعاء المزود
التي يجب ألا تتلقى الموجهات الخام، أو السجل، أو الاستجابات، أو الرؤوس، أو أجسام الطلبات،
أو معرفات طلبات المزود. تتضمن هذه الخطافات بيانات تعريف مستقرة مثل
`runId` و`callId` و`provider` و`model` و`api`/`transport` الاختياريين، و
`durationMs`/`outcome` النهائيين، و`upstreamRequestIdHash` عندما يستطيع OpenClaw اشتقاق
تجزئة محدودة لمعرف طلب المزود.

يعمل `before_agent_finalize` فقط عندما يكون إطار الاختبار على وشك قبول إجابة
مساعد نهائية طبيعية. ليس هذا مسار إلغاء `/stop` ولا يعمل
عندما يوقف المستخدم دورا. أرجع `{ action: "revise", reason }` لطلب
مرور نموذج إضافي واحد من إطار الاختبار قبل الإنهاء، أو `{ action:
"finalize", reason? }` لفرض الإنهاء، أو احذف النتيجة للمتابعة.
ترحل خطافات `Stop` الأصلية في Codex إلى هذا الخطاف كقرارات
`before_agent_finalize` في OpenClaw.

يجب أن تضبط Plugins غير المضمنة التي تحتاج إلى `llm_input` أو `llm_output`،
أو `before_agent_finalize`، أو `agent_end` ما يلي:

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

يمكن تعطيل الخطافات التي تغير الموجه وحقن الدور التالي الدائم لكل Plugin
باستخدام `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### امتدادات الجلسة وحقن الدور التالي

يمكن لـ Plugins سير العمل استمرار حالة جلسة صغيرة متوافقة مع JSON باستخدام
`api.registerSessionExtension(...)` وتحديثها عبر طريقة Gateway
`sessions.pluginPatch`. تعرض صفوف الجلسات حالة الامتداد المسجلة عبر
`pluginExtensions`، ما يتيح لـ Control UI والعملاء الآخرين عرض
الحالة المملوكة لـ Plugin من دون معرفة تفاصيل Plugin الداخلية.

استخدم `api.enqueueNextTurnInjection(...)` عندما يحتاج Plugin إلى سياق دائم
للوصول إلى دورة النموذج التالية مرة واحدة بالضبط. يفرغ OpenClaw عمليات الحقن
المصطفة قبل خطافات المطالبة، ويسقط عمليات الحقن منتهية الصلاحية، ويزيل
التكرار حسب `idempotencyKey` لكل Plugin. هذه هي نقطة التكامل المناسبة
لاستئنافات الموافقة، وملخصات السياسات، وفروق مراقبة الخلفية، واستمرارات
الأوامر التي ينبغي أن تكون مرئية للنموذج في الدورة التالية لكنها لا ينبغي أن
تصبح نص مطالبة نظام دائمًا.

دلالات التنظيف جزء من العقد. تتلقى عمليات تنظيف امتداد الجلسة واستدعاءات
تنظيف دورة حياة وقت التشغيل `reset` أو `delete` أو `disable` أو `restart`.
يزيل المضيف حالة امتداد الجلسة الدائمة الخاصة بالـ Plugin المالك وعمليات
الحقن المعلقة للدورة التالية عند إعادة الضبط/الحذف/التعطيل؛ أما إعادة التشغيل
فتبقي حالة الجلسة الدائمة بينما تتيح استدعاءات التنظيف للـ Plugins تحرير مهام
المجدول، وسياق التشغيل، والموارد الأخرى خارج النطاق للجيل القديم من وقت
التشغيل.

## خطافات الرسائل

استخدم خطافات الرسائل للتوجيه على مستوى القناة وسياسة التسليم:

- `message_received`: راقب المحتوى الوارد، والمرسل، و`threadId`، و`messageId`،
  و`senderId`، وارتباط التشغيل/الجلسة الاختياري، والبيانات الوصفية.
- `message_sending`: أعد كتابة `content` أو أرجع `{ cancel: true }`.
- `message_sent`: راقب النجاح أو الفشل النهائي.

بالنسبة إلى ردود TTS الصوتية فقط، قد يحتوي `content` على النص المنطوق المخفي
حتى عندما لا تحتوي حمولة القناة على نص/تعليق مرئي. إعادة كتابة ذلك
`content` تحدّث النص المرئي للخطاف فقط؛ ولا يتم عرضه كتعليق وسائط.

تعرض سياقات خطافات الرسائل حقول ارتباط مستقرة عند توفرها:
`ctx.sessionKey` و`ctx.runId` و`ctx.messageId` و`ctx.senderId` و`ctx.trace` و
`ctx.traceId` و`ctx.spanId` و`ctx.parentSpanId` و`ctx.callDepth`. فضّل هذه
الحقول من الدرجة الأولى قبل قراءة البيانات الوصفية القديمة.

فضّل حقلي `threadId` و`replyToId` المطبوعين قبل استخدام البيانات الوصفية
الخاصة بالقناة.

قواعد القرار:

- `message_sending` مع `cancel: true` نهائي.
- `message_sending` مع `cancel: false` يُعامل كعدم وجود قرار.
- يستمر `content` المعاد كتابته إلى الخطافات ذات الأولوية الأقل ما لم يلغِ
  خطاف لاحق التسليم.

## خطافات التثبيت

يعمل `before_install` بعد الفحص المدمج لتثبيت Skills وPlugin. أرجع نتائج
إضافية أو `{ block: true, blockReason }` لإيقاف التثبيت.

`block: true` نهائي. `block: false` يُعامل كعدم وجود قرار.

## دورة حياة Gateway

استخدم `gateway_start` لخدمات Plugin التي تحتاج إلى حالة مملوكة من Gateway.
يعرض السياق `ctx.config` و`ctx.workspaceDir` و`ctx.getCron?.()` لفحص cron
وتحديثاته. استخدم `gateway_stop` لتنظيف الموارد طويلة التشغيل.

لا تعتمد على خطاف `gateway:startup` الداخلي لخدمات وقت التشغيل المملوكة
للـ Plugin.

يُطلق `cron_changed` لأحداث دورة حياة cron المملوكة من Gateway مع حمولة حدث
مطبوعة تغطي أسباب `added` و`updated` و`removed` و`started` و`finished` و
`scheduled`. يحمل الحدث لقطة `PluginHookGatewayCronJob` (بما في ذلك
`state.nextRunAtMs` و`state.lastRunStatus` و`state.lastError` عند وجودها) مع
`PluginHookGatewayCronDeliveryStatus` بقيمة `not-requested` | `delivered` |
`not-delivered` | `unknown`. ما زالت أحداث الإزالة تحمل لقطة المهمة المحذوفة
حتى تتمكن المجدولات الخارجية من مطابقة الحالة. استخدم `ctx.getCron?.()` و
`ctx.config` من سياق وقت التشغيل عند مزامنة مجدولات الإيقاظ الخارجية، وأبقِ
OpenClaw مصدر الحقيقة لفحوصات الاستحقاق والتنفيذ.

## الإهمالات القادمة

هناك بعض الأسطح القريبة من الخطافات مهملة لكنها ما زالت مدعومة. انتقل قبل
الإصدار الرئيسي التالي:

- **مظاريف القنوات النصية العادية** في معالجات `inbound_claim` و`message_received`.
  اقرأ `BodyForAgent` وكتل سياق المستخدم المهيكلة بدلًا من تحليل نص المظروف
  المسطح. راجع
  [مظاريف القنوات النصية العادية → BodyForAgent](/ar/plugins/sdk-migration#active-deprecations).
- يبقى **`before_agent_start`** للتوافق. ينبغي للـ Plugins الجديدة استخدام
  `before_model_resolve` و`before_prompt_build` بدلًا من المرحلة المجمعة.
- يستخدم **`onResolution` في `before_tool_call`** الآن اتحاد
  `PluginApprovalResolution` المطبوع (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) بدلًا من `string` حر الشكل.

للحصول على القائمة الكاملة — تسجيل قدرة الذاكرة، وملف تعريف تفكير المزوّد،
ومزوّدي المصادقة الخارجيين، وأنواع اكتشاف المزوّدين، وموصلات وقت تشغيل
المهام، وإعادة تسمية `command-auth` إلى `command-status` — راجع
[ترحيل Plugin SDK → الإهمالات النشطة](/ar/plugins/sdk-migration#active-deprecations).

## ذو صلة

- [ترحيل Plugin SDK](/ar/plugins/sdk-migration) — الإهمالات النشطة والجدول الزمني للإزالة
- [بناء Plugins](/ar/plugins/building-plugins)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints)
- [الخطافات الداخلية](/ar/automation/hooks)
- [البنية الداخلية لمعمارية Plugin](/ar/plugins/architecture-internals)
