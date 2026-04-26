---
read_when:
    - أنت تبني Plugin تحتاج إلى `before_tool_call` أو `before_agent_reply` أو خطافات الرسائل أو خطافات دورة الحياة
    - تحتاج إلى حظر استدعاءات الأدوات من Plugin أو إعادة كتابتها أو طلب موافقة عليها
    - أنت تقرر بين الخطافات الداخلية وخطافات Plugin
summary: 'خطافات Plugin: اعتراض أحداث دورة حياة الوكيل، والأداة، والرسالة، والجلسة، وGateway'
title: خطافات Plugin
x-i18n:
    generated_at: "2026-04-26T11:36:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62d8c21db885abcb70c7aa940e3ce937df09d077587b153015c4c6c5169f4f1d
    source_path: plugins/hooks.md
    workflow: 15
---

خطافات Plugin هي نقاط توسعة داخل العملية لـ Plugins الخاصة بـ OpenClaw. استخدمها
عندما تحتاج Plugin إلى فحص أو تغيير تشغيلات الوكيل، أو استدعاءات الأدوات، أو تدفق الرسائل،
أو دورة حياة الجلسة، أو توجيه الوكلاء الفرعيين، أو عمليات التثبيت، أو بدء تشغيل Gateway.

استخدم [الخطافات الداخلية](/ar/automation/hooks) بدلًا من ذلك عندما تريد
سكربت `HOOK.md` صغيرًا مثبّتًا من قبل المشغّل لأحداث الأوامر وGateway مثل
`/new`، و`/reset`، و`/stop`، و`agent:bootstrap`، أو `gateway:startup`.

## البدء السريع

سجّل خطافات Plugin المطبّعة باستخدام `api.on(...)` من نقطة إدخال Plugin الخاصة بك:

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

تعمل معالجات الخطافات تسلسليًا بترتيب `priority` تنازلي. وتحافظ الخطافات ذات
الأولوية نفسها على ترتيب التسجيل.

## فهرس الخطافات

تُجمّع الخطافات بحسب السطح الذي توسّعه. الأسماء المكتوبة **بخط عريض** تقبل
نتيجة قرار (حظر، أو إلغاء، أو تجاوز، أو طلب موافقة)؛ أما جميع الخطافات الأخرى
فهي للمراقبة فقط.

**دور الوكيل**

- `before_model_resolve` — تجاوز الموفّر أو النموذج قبل تحميل رسائل الجلسة
- `before_prompt_build` — إضافة سياق ديناميكي أو نص system prompt قبل استدعاء النموذج
- `before_agent_start` — مرحلة مجمعة للتوافق فقط؛ ويفضَّل استخدام الخطافين أعلاه
- **`before_agent_reply`** — اختصار دور النموذج برد اصطناعي أو بصمت
- **`before_agent_finalize`** — فحص الإجابة النهائية الطبيعية وطلب تمريرة إضافية واحدة من النموذج
- `agent_end` — مراقبة الرسائل النهائية، وحالة النجاح، ومدة التشغيل

**مراقبة المحادثة**

- `model_call_started` / `model_call_ended` — مراقبة بيانات وصفية منقحة لمكالمة الموفّر/النموذج، والتوقيت، والنتيجة، وhashات معرّفات الطلب المحدودة، من دون محتوى prompt أو الاستجابة
- `llm_input` — مراقبة مدخلات الموفّر (system prompt، والـ prompt، والسجل)
- `llm_output` — مراقبة مخرجات الموفّر

**الأدوات**

- **`before_tool_call`** — إعادة كتابة معاملات الأداة، أو حظر التنفيذ، أو طلب موافقة
- `after_tool_call` — مراقبة نتائج الأدوات، والأخطاء، والمدة
- **`tool_result_persist`** — إعادة كتابة رسالة المساعد الناتجة من نتيجة أداة
- **`before_message_write`** — فحص عملية كتابة رسالة قيد التقدم أو حظرها (نادر)

**الرسائل والتسليم**

- **`inbound_claim`** — المطالبة برسالة واردة قبل توجيهها إلى الوكيل (ردود اصطناعية)
- `message_received` — مراقبة المحتوى الوارد، والمرسل، والخيط، والبيانات الوصفية
- **`message_sending`** — إعادة كتابة المحتوى الصادر أو إلغاء التسليم
- `message_sent` — مراقبة نجاح أو فشل التسليم الصادر
- **`before_dispatch`** — فحص عملية dispatch الصادرة أو إعادة كتابتها قبل تسليمها إلى القناة
- **`reply_dispatch`** — المشاركة في المسار النهائي لتسليم الرد

**الجلسات وCompaction**

- `session_start` / `session_end` — تتبع حدود دورة حياة الجلسة
- `before_compaction` / `after_compaction` — مراقبة دورات Compaction أو إضافة تعليقات لها
- `before_reset` — مراقبة أحداث إعادة تعيين الجلسة (`/reset`، وعمليات إعادة التعيين البرمجية)

**الوكلاء الفرعيون**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — تنسيق توجيه الوكلاء الفرعيين وتسليم الإكمال

**دورة الحياة**

- `gateway_start` / `gateway_stop` — بدء أو إيقاف الخدمات المملوكة لـ Plugin مع Gateway
- **`before_install`** — فحص عمليات تثبيت المهارات أو Plugins وإمكانية حظرها اختياريًا

## سياسة استدعاء الأدوات

يتلقى `before_tool_call` ما يلي:

- `event.toolName`
- `event.params`
- `event.runId` الاختياري
- `event.toolCallId` الاختياري
- حقول السياق مثل `ctx.agentId` و`ctx.sessionKey` و`ctx.sessionId`،
  و`ctx.runId`، و`ctx.jobId` ‏(يُضبط في التشغيلات التي تقودها Cron)، و`ctx.trace` التشخيصي

ويمكنه أن يعيد:

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
- تُعامل `block: false` على أنها بلا قرار.
- تقوم `params` بإعادة كتابة معاملات الأداة للتنفيذ.
- يؤدي `requireApproval` إلى إيقاف تشغيل الوكيل مؤقتًا وطلب موافقة المستخدم عبر
  موافقات Plugin. ويمكن لأمر `/approve` اعتماد كل من موافقات exec وموافقات Plugin.
- يمكن لحقل `block: true` ذي أولوية أقل أن يحظر التنفيذ حتى بعد أن يكون خطاف ذو أولوية أعلى
  قد طلب موافقة.
- تتلقى `onResolution` قرار الموافقة المحلول — `allow-once`,
  أو `allow-always`، أو `deny`، أو `timeout`، أو `cancelled`.

### حفظ نتيجة الأداة

يمكن أن تتضمن نتائج الأدوات `details` منظمة من أجل العرض في UI، أو التشخيصات،
أو توجيه الوسائط، أو البيانات الوصفية المملوكة لـ Plugin. تعامل مع `details` على أنها بيانات وقت تشغيل وصفية،
وليست محتوى prompt:

- يزيل OpenClaw `toolResult.details` قبل إعادة التشغيل للمزوّد وإدخال Compaction
  حتى لا تصبح البيانات الوصفية جزءًا من سياق النموذج.
- تحتفظ إدخالات الجلسة الثابتة فقط بـ `details` المحدودة. وتُستبدل التفاصيل كبيرة الحجم
  بملخص مضغوط مع `persistedDetailsTruncated: true`.
- يعمل `tool_result_persist` و`before_message_write` قبل
  الحد النهائي للحفظ. ومع ذلك ينبغي للخطافات إبقاء `details` المعادة صغيرة وتجنب
  وضع نص ذي صلة بالـ prompt في `details` فقط؛ ضع خرج الأداة المرئي للنموذج
  في `content`.

## خطافات الـ prompt والنموذج

استخدم الخطافات الخاصة بالمرحلة مع Plugins الجديدة:

- `before_model_resolve`: يتلقى فقط بيانات prompt الحالية وبيانات
  المرفقات الوصفية. أعد `providerOverride` أو `modelOverride`.
- `before_prompt_build`: يتلقى prompt الحالية ورسائل الجلسة.
  أعد `prependContext` أو `systemPrompt` أو `prependSystemContext` أو
  `appendSystemContext`.

يبقى `before_agent_start` من أجل التوافق. ويفضَّل استخدام الخطافات الصريحة أعلاه
حتى لا تعتمد Plugin الخاصة بك على مرحلة مجمعة قديمة.

يتضمن `before_agent_start` و`agent_end` القيمة `event.runId` عندما يستطيع OpenClaw
تحديد التشغيل النشط. كما تكون القيمة نفسها متاحة أيضًا على `ctx.runId`.
كما تعرض التشغيلات التي تقودها Cron القيمة `ctx.jobId` ‏(معرّف وظيفة cron الأصلية) حتى
تتمكن خطافات Plugin من تحديد المقاييس أو الآثار الجانبية أو الحالة ضمن نطاق وظيفة
مجدولة محددة.

استخدم `model_call_started` و`model_call_ended` من أجل قياسات telemetry الخاصة باستدعاءات الموفّر
والتي يجب ألا تتلقى prompts خامًا، أو سجلًا، أو استجابات، أو رؤوسًا، أو أجسام طلبات،
أو معرّفات طلبات الموفّر. تتضمن هذه الخطافات بيانات وصفية مستقرة مثل
`runId` و`callId` و`provider` و`model`، والحقليْن الاختياريين `api`/`transport`،
و`durationMs`/`outcome` النهائيين، و`upstreamRequestIdHash` عندما يستطيع OpenClaw اشتقاق
hash محدود لمعرّف طلب الموفّر.

يعمل `before_agent_finalize` فقط عندما يكون harness على وشك قبول
إجابة نهائية طبيعية من المساعد. وهو ليس مسار إلغاء `/stop` ولا
يعمل عندما يُجهض المستخدم دورًا. أعد `{ action: "revise", reason }` لطلب
تمريرة إضافية واحدة من النموذج من الـ harness قبل الإنهاء، أو `{ action:
"finalize", reason? }` لفرض الإنهاء، أو احذف النتيجة للاستمرار.
تُمرَّر خطافات `Stop` الأصلية في Codex إلى هذا الخطاف كقرارات OpenClaw
`before_agent_finalize`.

يجب على Plugins غير المضمنة التي تحتاج إلى `llm_input` أو `llm_output`،
أو `before_agent_finalize`، أو `agent_end` أن تضبط:

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

يمكن تعطيل الخطافات المعدّلة للـ prompt لكل Plugin عبر
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## خطافات الرسائل

استخدم خطافات الرسائل من أجل التوجيه على مستوى القناة وسياسة التسليم:

- `message_received`: مراقبة المحتوى الوارد، والمرسل، و`threadId`،
  و`messageId`، و`senderId`، والارتباط الاختياري بالتشغيل/الجلسة، والبيانات الوصفية.
- `message_sending`: إعادة كتابة `content` أو إعادة `{ cancel: true }`.
- `message_sent`: مراقبة النجاح أو الفشل النهائيين.

في الردود الصوتية فقط عبر TTS، قد يحتوي `content` على النسخة المنطوقة المخفية
حتى عندما لا تحتوي حمولة القناة على نص/تسمية مرئية. يؤدي إعادة كتابة ذلك
`content` إلى تحديث النسخة المرئية للخطاف فقط؛ ولا تُعرض كتسمية
وسائط.

تعرض سياقات خطافات الرسائل حقول ارتباط مستقرة عند توفرها:
`ctx.sessionKey` و`ctx.runId` و`ctx.messageId` و`ctx.senderId` و`ctx.trace`،
و`ctx.traceId`، و`ctx.spanId`، و`ctx.parentSpanId`، و`ctx.callDepth`. فضّل
هذه الحقول المباشرة قبل قراءة البيانات الوصفية القديمة.

فضّل الحقلين المطبّعين `threadId` و`replyToId` قبل استخدام البيانات الوصفية الخاصة بالقناة.

قواعد القرار:

- يكون `message_sending` مع `cancel: true` نهائيًا.
- تُعامل `message_sending` مع `cancel: false` على أنها بلا قرار.
- يستمر `content` المعاد كتابته إلى الخطافات ذات الأولوية الأدنى ما لم يقم خطاف لاحق
  بإلغاء التسليم.

## خطافات التثبيت

يعمل `before_install` بعد الفحص المدمج لعمليات تثبيت Skills وPlugins.
أعد نتائج إضافية أو `{ block: true, blockReason }` لإيقاف
التثبيت.

يكون `block: true` نهائيًا. وتُعامل `block: false` على أنها بلا قرار.

## دورة حياة Gateway

استخدم `gateway_start` لخدمات Plugin التي تحتاج إلى حالة مملوكة لـ Gateway. ويعرض
السياق `ctx.config` و`ctx.workspaceDir` و`ctx.getCron?.()` من أجل
فحص Cron وتحديثها. واستخدم `gateway_stop` لتنظيف الموارد طويلة التشغيل.

لا تعتمد على الخطاف الداخلي `gateway:startup` لخدمات وقت التشغيل
المملوكة لـ Plugin.

## عمليات الإيقاف القادمة

بعض الأسطح المجاورة للخطافات مهجورة لكنها لا تزال مدعومة. قم بالترحيل
قبل الإصدار الرئيسي التالي:

- **أغلفة القنوات النصية العادية** في معالجات `inbound_claim` و`message_received`.
  اقرأ `BodyForAgent` وكتل سياق المستخدم المنظمة
  بدلًا من تحليل نص الغلاف المسطح. راجع
  [أغلفة القنوات النصية العادية → BodyForAgent](/ar/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** يبقى من أجل التوافق. ينبغي لـ Plugins الجديدة استخدام
  `before_model_resolve` و`before_prompt_build` بدلًا من
  المرحلة المجمعة.
- **`onResolution` في `before_tool_call`** تستخدم الآن
  الاتحاد المطبّع `PluginApprovalResolution` ‏(`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) بدلًا من `string` حر.

للحصول على القائمة الكاملة — تسجيل قدرة الذاكرة، وملف
thinking profile الخاص بالموفر، وموفري المصادقة الخارجيين، وأنواع اكتشاف الموفّر، وملحقات وقت تشغيل المهمة،
وتغيير الاسم من `command-auth` إلى `command-status` — راجع
[ترحيل Plugin SDK → عمليات الإيقاف النشطة](/ar/plugins/sdk-migration#active-deprecations).

## ذو صلة

- [ترحيل Plugin SDK](/ar/plugins/sdk-migration) — عمليات الإيقاف النشطة والجدول الزمني للإزالة
- [بناء Plugins](/ar/plugins/building-plugins)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [نقاط إدخال Plugin](/ar/plugins/sdk-entrypoints)
- [الخطافات الداخلية](/ar/automation/hooks)
- [تفاصيل Plugin architecture الداخلية](/ar/plugins/architecture-internals)
