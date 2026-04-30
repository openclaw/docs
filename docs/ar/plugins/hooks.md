---
read_when:
    - أنت تبني Plugin يحتاج إلى before_tool_call أو before_agent_reply أو خطافات الرسائل أو خطافات دورة الحياة
    - تحتاج إلى حظر استدعاءات الأدوات من Plugin أو إعادة كتابتها أو اشتراط الموافقة عليها
    - أنت تختار بين الخطافات الداخلية وخطافات Plugin
summary: 'خطافات Plugin: تعترض أحداث دورة حياة الوكيل والأداة والرسالة والجلسة وGateway'
title: خطافات Plugin
x-i18n:
    generated_at: "2026-04-30T08:14:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: f600df47c67eb07d85b7b063f1189baf78a49efad727d8cadbd37f66745c4401
    source_path: plugins/hooks.md
    workflow: 16
---

خطافات Plugin هي نقاط امتداد داخل العملية لـ Plugins الخاصة بـ OpenClaw. استخدمها
عندما يحتاج Plugin إلى فحص أو تغيير عمليات تشغيل الوكلاء، أو استدعاءات الأدوات، أو تدفق الرسائل،
أو دورة حياة الجلسة، أو توجيه الوكلاء الفرعيين، أو عمليات التثبيت، أو بدء تشغيل Gateway.

استخدم [الخطافات الداخلية](/ar/automation/hooks) بدلا من ذلك عندما تريد سكربت
`HOOK.md` صغيرا يثبته المشغل لأحداث الأوامر وGateway مثل
`/new` أو `/reset` أو `/stop` أو `agent:bootstrap` أو `gateway:startup`.

## البدء السريع

سجل خطافات Plugin ذات الأنواع باستخدام `api.on(...)` من مدخل Plugin الخاص بك:

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

تعمل معالجات الخطافات بالتتابع بترتيب `priority` تنازلي. وتحافظ الخطافات
ذات الأولوية نفسها على ترتيب التسجيل.

يقبل `api.on(name, handler, opts?)` ما يلي:

- `priority` — ترتيب المعالج (القيمة الأعلى تعمل أولا).
- `timeoutMs` — ميزانية اختيارية لكل خطاف. عند ضبطها، يوقف مشغل الخطافات ذلك
  المعالج بعد انقضاء الميزانية ويتابع مع التالي، بدلا من ترك الإعداد البطيء أو
  عمل الاستدعاء يستهلك مهلة النموذج التي ضبطها المستدعي. احذفها لاستخدام مهلة
  الملاحظة/القرار الافتراضية التي يطبقها مشغل الخطافات عموما.

يتلقى كل خطاف `event.context.pluginConfig`، وهي الإعدادات المحلولة لـ Plugin
الذي سجل ذلك المعالج. استخدمها لقرارات الخطافات التي تحتاج إلى خيارات Plugin
الحالية؛ يحقنها OpenClaw لكل معالج من دون تغيير كائن الحدث المشترك الذي تراه
Plugins الأخرى.

## فهرس الخطافات

تجمع الخطافات حسب السطح الذي تمدده. الأسماء بالخط **العريض** تقبل نتيجة
قرار (حظر، إلغاء، تجاوز، أو طلب موافقة)؛ وكل ما عدا ذلك مخصص للملاحظة فقط.

**دورة الوكيل**

- `before_model_resolve` — تجاوز المزود أو النموذج قبل تحميل رسائل الجلسة
- `agent_turn_prepare` — استهلاك إدخالات دورة Plugin المصطفة وإضافة سياق في الدورة نفسها قبل خطافات الموجه
- `before_prompt_build` — إضافة سياق ديناميكي أو نص موجه نظام قبل استدعاء النموذج
- `before_agent_start` — مرحلة مدمجة للتوافق فقط؛ فضل الخطافين أعلاه
- **`before_agent_reply`** — قطع دورة النموذج برد اصطناعي أو بالصمت
- **`before_agent_finalize`** — فحص الإجابة النهائية الطبيعية وطلب تمريرة نموذج إضافية
- `agent_end` — ملاحظة الرسائل النهائية وحالة النجاح ومدة التشغيل
- `heartbeat_prompt_contribution` — إضافة سياق مخصص لـ Heartbeat فقط لـ Plugins مراقبة الخلفية ودورة الحياة

**ملاحظة المحادثة**

- `model_call_started` / `model_call_ended` — ملاحظة بيانات وصفية منقحة لاستدعاء المزود/النموذج والتوقيت والنتيجة وتجزئات معرف الطلب المحدودة من دون محتوى الموجه أو الاستجابة
- `llm_input` — ملاحظة إدخال المزود (موجه النظام، الموجه، السجل)
- `llm_output` — ملاحظة إخراج المزود

**الأدوات**

- **`before_tool_call`** — إعادة كتابة معاملات الأداة، أو حظر التنفيذ، أو طلب موافقة
- `after_tool_call` — ملاحظة نتائج الأداة والأخطاء والمدة
- **`tool_result_persist`** — إعادة كتابة رسالة المساعد الناتجة من نتيجة أداة
- **`before_message_write`** — فحص كتابة رسالة قيد التقدم أو حظرها (نادر)

**الرسائل والتسليم**

- **`inbound_claim`** — المطالبة برسالة واردة قبل توجيه الوكيل (ردود اصطناعية)
- `message_received` — ملاحظة المحتوى الوارد والمرسل والسلسلة والبيانات الوصفية
- **`message_sending`** — إعادة كتابة المحتوى الصادر أو إلغاء التسليم
- `message_sent` — ملاحظة نجاح التسليم الصادر أو فشله
- **`before_dispatch`** — فحص إرسال صادر أو إعادة كتابته قبل تسليمه إلى القناة
- **`reply_dispatch`** — المشاركة في مسار إرسال الرد النهائي

**الجلسات وCompaction**

- `session_start` / `session_end` — تتبع حدود دورة حياة الجلسة
- `before_compaction` / `after_compaction` — ملاحظة دورات Compaction أو إضافة تعليقات توضيحية لها
- `before_reset` — ملاحظة أحداث إعادة ضبط الجلسة (`/reset`، أو عمليات إعادة الضبط البرمجية)

**الوكلاء الفرعيون**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — تنسيق توجيه الوكلاء الفرعيين وتسليم الإكمال

**دورة الحياة**

- `gateway_start` / `gateway_stop` — بدء الخدمات المملوكة لـ Plugin أو إيقافها مع Gateway
- `cron_changed` — ملاحظة تغييرات دورة حياة Cron المملوكة لـ Gateway (مضاف، محدث، محذوف، بدأ، انتهى، مجدول)
- **`before_install`** — فحص عمليات مسح تثبيت Skills أو Plugin وحظرها اختياريا

## سياسة استدعاء الأداة

يتلقى `before_tool_call` ما يلي:

- `event.toolName`
- `event.params`
- `event.runId` الاختياري
- `event.toolCallId` الاختياري
- حقول سياق مثل `ctx.agentId` و`ctx.sessionKey` و`ctx.sessionId`،
  و`ctx.runId` و`ctx.jobId` (يضبط في عمليات التشغيل المدفوعة بـ Cron)، و`ctx.trace` التشخيصي

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
- `block: false` يعامل كأنه لا يوجد قرار.
- `params` يعيد كتابة معاملات الأداة للتنفيذ.
- `requireApproval` يوقف تشغيل الوكيل مؤقتا ويطلب من المستخدم عبر موافقات Plugin.
  يمكن لأمر `/approve` الموافقة على موافقات exec وPlugin معا.
- ما يزال بإمكان `block: true` ذي أولوية أقل الحظر بعد أن يطلب خطاف ذو أولوية أعلى الموافقة.
- يتلقى `onResolution` قرار الموافقة المحلول — `allow-once` أو
  `allow-always` أو `deny` أو `timeout` أو `cancelled`.

يمكن لـ Plugins المضمنة التي تحتاج إلى سياسة على مستوى المضيف تسجيل سياسات أدوات موثوقة
باستخدام `api.registerTrustedToolPolicy(...)`. تعمل هذه قبل خطافات
`before_tool_call` العادية وقبل قرارات Plugin الخارجية. استخدمها فقط
لبوابات يثق بها المضيف مثل سياسة مساحة العمل، أو فرض الميزانية، أو
سلامة سير العمل المحجوزة. يجب أن تستخدم Plugins الخارجية خطافات
`before_tool_call` العادية.

### استمرار نتيجة الأداة

يمكن أن تتضمن نتائج الأدوات `details` منظمة لعرض واجهة المستخدم، أو التشخيصات،
أو توجيه الوسائط، أو البيانات الوصفية المملوكة لـ Plugin. تعامل مع `details`
على أنها بيانات وصفية وقت التشغيل، وليست محتوى موجه:

- يزيل OpenClaw `toolResult.details` قبل إعادة تشغيل المزود وإدخال Compaction
  حتى لا تصبح البيانات الوصفية سياقا للنموذج.
- تحتفظ إدخالات الجلسة المستمرة بـ `details` محدودة فقط. تستبدل التفاصيل
  الزائدة بملخص مضغوط و`persistedDetailsTruncated: true`.
- يعمل `tool_result_persist` و`before_message_write` قبل حد الاستمرار النهائي.
  ومع ذلك يجب أن تبقي الخطافات `details` المرجعة صغيرة وأن تتجنب وضع نص ذي صلة
  بالموجه في `details` فقط؛ ضع إخراج الأداة المرئي للنموذج في `content`.

## خطافات الموجه والنموذج

استخدم الخطافات الخاصة بالمرحلة لـ Plugins الجديدة:

- `before_model_resolve`: يتلقى الموجه الحالي وبيانات المرفقات الوصفية فقط.
  أرجع `providerOverride` أو `modelOverride`.
- `agent_turn_prepare`: يتلقى الموجه الحالي ورسائل الجلسة المحضرة وأي إدخالات
  مصطفة لمرة واحدة بالضبط تم تفريغها لهذه الجلسة. أرجع
  `prependContext` أو `appendContext`.
- `before_prompt_build`: يتلقى الموجه الحالي ورسائل الجلسة.
  أرجع `prependContext` أو `appendContext` أو `systemPrompt`
  أو `prependSystemContext` أو `appendSystemContext`.
- `heartbeat_prompt_contribution`: يعمل فقط لدورات Heartbeat ويعيد
  `prependContext` أو `appendContext`. وهو مخصص لمراقبات الخلفية التي تحتاج
  إلى تلخيص الحالة الحالية من دون تغيير الدورات التي بدأها المستخدم.

يبقى `before_agent_start` للتوافق. فضل الخطافات الصريحة أعلاه حتى لا يعتمد
Plugin الخاص بك على مرحلة مدمجة قديمة.

يتضمن `before_agent_start` و`agent_end` قيمة `event.runId` عندما يتمكن
OpenClaw من تحديد التشغيل النشط. والقيمة نفسها متاحة أيضا في `ctx.runId`.
كما تعرض عمليات التشغيل المدفوعة بـ Cron قيمة `ctx.jobId` (معرف مهمة Cron
المصدر) حتى تتمكن خطافات Plugin من حصر المقاييس أو الآثار الجانبية أو الحالة
ضمن مهمة مجدولة محددة.

`agent_end` خطاف ملاحظة ويعمل بأسلوب أطلق وانس بعد الدورة. يطبق مشغل الخطافات
مهلة 30 ثانية حتى لا يترك Plugin عالق أو نقطة نهاية تضمين وعد الخطاف معلقا
إلى الأبد. تسجل المهلة ويتابع OpenClaw؛ ولا تلغي عمل الشبكة المملوك لـ Plugin
ما لم يستخدم Plugin أيضا إشارة الإلغاء الخاصة به.

استخدم `model_call_started` و`model_call_ended` لقياسات استدعاء المزود
التي يجب ألا تتلقى الموجهات الخام أو السجل أو الاستجابات أو الرؤوس أو أجسام
الطلبات أو معرفات طلبات المزود. تتضمن هذه الخطافات بيانات وصفية ثابتة مثل
`runId` و`callId` و`provider` و`model` و`api`/`transport` الاختياريين،
و`durationMs`/`outcome` النهائيين، و`upstreamRequestIdHash` عندما يتمكن
OpenClaw من اشتقاق تجزئة محدودة لمعرف طلب المزود.

يعمل `before_agent_finalize` فقط عندما يكون الحاضن على وشك قبول إجابة مساعد
نهائية طبيعية. إنه ليس مسار إلغاء `/stop` ولا يعمل عندما يجهض المستخدم دورة.
أرجع `{ action: "revise", reason }` لطلب تمريرة نموذج إضافية من الحاضن قبل
الإنهاء، أو `{ action:
"finalize", reason? }` لفرض الإنهاء، أو احذف النتيجة للمتابعة.
ترحل خطافات `Stop` الأصلية في Codex إلى هذا الخطاف كقرارات
`before_agent_finalize` في OpenClaw.

يجب على Plugins غير المضمنة التي تحتاج إلى `llm_input` أو `llm_output`
أو `before_agent_finalize` أو `agent_end` ضبط ما يلي:

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

يمكن تعطيل الخطافات التي تغير الموجه والإدخالات الدائمة للدورة التالية لكل Plugin
باستخدام `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### امتدادات الجلسة وإدخالات الدورة التالية

يمكن لـ Plugins سير العمل استمرار حالة جلسة صغيرة متوافقة مع JSON باستخدام
`api.registerSessionExtension(...)` وتحديثها من خلال طريقة Gateway
`sessions.pluginPatch`. تعرض صفوف الجلسات حالة الامتداد المسجلة عبر
`pluginExtensions`، مما يتيح لـ Control UI والعملاء الآخرين عرض الحالة
المملوكة لـ Plugin من دون معرفة تفاصيل Plugin الداخلية.

استخدم `api.enqueueNextTurnInjection(...)` عندما يحتاج Plugin إلى سياق دائم
ليصل إلى دورة النموذج التالية مرة واحدة بالضبط. يفرغ OpenClaw الإدخالات
المصطفة قبل خطافات الموجه، ويسقط الإدخالات المنتهية الصلاحية، ويزيل التكرار
حسب `idempotencyKey` لكل Plugin. هذا هو الحد المناسب لاستئناف الموافقات،
وملخصات السياسات، وفروق مراقبة الخلفية، واستمرارات الأوامر التي يجب أن تكون
مرئية للنموذج في الدورة التالية ولكن يجب ألا تصبح نص موجه نظام دائما.

دلالات التنظيف جزء من العقد. تتلقى عمليات تنظيف امتداد الجلسة واستدعاءات تنظيف
دورة حياة وقت التشغيل `reset` أو `delete` أو `disable` أو `restart`. يزيل
المضيف حالة امتداد الجلسة المستمرة المملوكة لـ Plugin والإدخالات المعلقة
للدورة التالية عند reset/delete/disable؛ ويحافظ restart على حالة الجلسة الدائمة
بينما تتيح استدعاءات التنظيف لـ Plugins تحرير مهام المجدول وسياق التشغيل
والموارد الأخرى خارج النطاق للجيل القديم من وقت التشغيل.

## خطافات الرسائل

استخدم خطافات الرسائل لتوجيه مستوى القناة وسياسة التسليم:

- `message_received`: ملاحظة المحتوى الوارد والمرسل و`threadId` و`messageId`
  و`senderId`، والارتباط الاختياري بالتشغيل/الجلسة، والبيانات الوصفية.
- `message_sending`: إعادة كتابة `content` أو إرجاع `{ cancel: true }`.
- `message_sent`: ملاحظة النجاح أو الفشل النهائي.

لردود TTS الصوتية فقط، قد يحتوي `content` على النص المنطوق المخفي
حتى عندما لا تتضمن حمولة القناة أي نص/تعليق مرئي. تؤدي إعادة كتابة ذلك
`content` إلى تحديث النص المرئي للخطاف فقط؛ ولا يُعرض كتعليق وسائط.

تعرض سياقات خطاف الرسائل حقول ارتباط مستقرة عند توفرها:
`ctx.sessionKey` و`ctx.runId` و`ctx.messageId` و`ctx.senderId` و`ctx.trace`
و`ctx.traceId` و`ctx.spanId` و`ctx.parentSpanId` و`ctx.callDepth`. فضّل
هذه الحقول من الدرجة الأولى قبل قراءة البيانات الوصفية القديمة.

فضّل حقلي `threadId` و`replyToId` المعرّفين نوعيًا قبل استخدام البيانات
الوصفية الخاصة بالقناة.

قواعد القرار:

- `message_sending` مع `cancel: true` نهائي.
- `message_sending` مع `cancel: false` يُعامل كأنه بلا قرار.
- يستمر `content` المعاد كتابته إلى الخطافات ذات الأولوية الأقل ما لم يلغِ
  خطاف لاحق التسليم.

## تثبيت الخطافات

يعمل `before_install` بعد الفحص المضمّن لتثبيتات Skills وPlugin.
أعد نتائج إضافية أو `{ block: true, blockReason }` لإيقاف
التثبيت.

`block: true` نهائي. ويُعامل `block: false` كأنه بلا قرار.

## دورة حياة Gateway

استخدم `gateway_start` لخدمات Plugin التي تحتاج إلى حالة يملكها Gateway. يكشف
السياق `ctx.config` و`ctx.workspaceDir` و`ctx.getCron?.()` من أجل
فحص Cron وتحديثاته. استخدم `gateway_stop` لتنظيف الموارد
طويلة التشغيل.

لا تعتمد على خطاف `gateway:startup` الداخلي لخدمات وقت التشغيل التي يملكها
Plugin.

ينطلق `cron_changed` لأحداث دورة حياة Cron التي يملكها Gateway مع حمولة
حدث معرّفة نوعيًا تغطي أسباب `added` و`updated` و`removed` و`started` و`finished`
و`scheduled`. يحمل الحدث لقطة `PluginHookGatewayCronJob`
(بما في ذلك `state.nextRunAtMs` و`state.lastRunStatus` و
`state.lastError` عند وجودها) إضافة إلى `PluginHookGatewayCronDeliveryStatus`
بقيمة `not-requested` | `delivered` | `not-delivered` | `unknown`. لا تزال
أحداث الإزالة تحمل لقطة المهمة المحذوفة حتى تتمكن المجدولات الخارجية من
مصالحة الحالة. استخدم `ctx.getCron?.()` و`ctx.config` من سياق وقت التشغيل
عند مزامنة مجدولات الإيقاظ الخارجية، واجعل OpenClaw مصدر الحقيقة لفحوص
الاستحقاق والتنفيذ.

## الإيقافات المرتقبة

هناك بعض الأسطح المجاورة للخطافات مهملة لكنها لا تزال مدعومة. انقل استخدامها
قبل الإصدار الرئيسي التالي:

- **مغلفات القنوات بالنص الصريح** في معالجات `inbound_claim` و`message_received`.
  اقرأ `BodyForAgent` وكتل سياق المستخدم المهيكلة
  بدلًا من تحليل نص المغلف المسطح. راجع
  [مغلفات القنوات بالنص الصريح → BodyForAgent](/ar/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** يبقى للتوافق. ينبغي أن تستخدم Plugins الجديدة
  `before_model_resolve` و`before_prompt_build` بدلًا من المرحلة
  المدمجة.
- **`onResolution` في `before_tool_call`** يستخدم الآن اتحاد
  `PluginApprovalResolution` المعرّف نوعيًا (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) بدلًا من `string` حر الصياغة.

للاطلاع على القائمة الكاملة — تسجيل قدرة الذاكرة، وملف تفكير الموفر،
وموفري المصادقة الخارجيين، وأنواع اكتشاف الموفر، وموصلات الوصول إلى وقت تشغيل
المهام، وإعادة تسمية `command-auth` إلى `command-status` — راجع
[ترحيل Plugin SDK → الإيقافات النشطة](/ar/plugins/sdk-migration#active-deprecations).

## ذو صلة

- [ترحيل Plugin SDK](/ar/plugins/sdk-migration) — الإيقافات النشطة والجدول الزمني للإزالة
- [بناء Plugins](/ar/plugins/building-plugins)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints)
- [الخطافات الداخلية](/ar/automation/hooks)
- [تفاصيل معمارية Plugin الداخلية](/ar/plugins/architecture-internals)
