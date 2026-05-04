---
read_when:
    - أنت تبني Plugin يحتاج إلى before_tool_call أو before_agent_reply أو خطافات الرسائل أو خطافات دورة الحياة
    - تحتاج إلى حظر استدعاءات الأدوات الصادرة من Plugin أو إعادة كتابتها أو طلب الموافقة عليها
    - تختار بين الخطافات الداخلية وخطافات Plugin
summary: 'خطافات Plugin: اعتراض أحداث دورة حياة الوكيل والأداة والرسالة والجلسة وGateway'
title: خطافات Plugin
x-i18n:
    generated_at: "2026-05-04T18:23:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37c7273036463c87e478db5678822b676c89447caee65f2f3f47a45194d1e37b
    source_path: plugins/hooks.md
    workflow: 16
---

خطافات Plugin هي نقاط توسعة داخل العملية لـ Plugins الخاصة بـ OpenClaw. استخدمها
عندما يحتاج Plugin إلى فحص أو تغيير تشغيلات الوكلاء، أو استدعاءات الأدوات، أو تدفق الرسائل،
أو دورة حياة الجلسة، أو توجيه الوكلاء الفرعيين، أو عمليات التثبيت، أو بدء تشغيل Gateway.

استخدم [الخطافات الداخلية](/ar/automation/hooks) بدلا من ذلك عندما تريد سكربت
`HOOK.md` صغيرا مثبَّتا بواسطة المشغّل لأحداث الأوامر وGateway مثل
`/new` أو `/reset` أو `/stop` أو `agent:bootstrap` أو `gateway:startup`.

## البدء السريع

سجّل خطافات Plugin المكتوبة الأنواع باستخدام `api.on(...)` من نقطة إدخال Plugin لديك:

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

تعمل معالجات الخطافات تسلسليا بترتيب `priority` تنازلي. وتحافظ الخطافات ذات
الأولوية نفسها على ترتيب التسجيل.

يقبل `api.on(name, handler, opts?)` ما يلي:

- `priority` — ترتيب المعالجات (الأعلى يعمل أولا).
- `timeoutMs` — ميزانية اختيارية لكل خطاف. عند ضبطها، يوقف مشغّل الخطافات ذلك
  المعالج بعد انقضاء الميزانية ويواصل مع التالي، بدلا من السماح لأعمال الإعداد
  أو الاسترجاع البطيئة باستهلاك مهلة النموذج المضبوطة لدى المستدعي. احذفها لاستخدام
  مهلة الملاحظة/القرار الافتراضية التي يطبقها مشغّل الخطافات بشكل عام.

يمكن للمشغّلين أيضا ضبط ميزانيات الخطافات من دون تعديل كود Plugin:

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
عددا صحيحا موجبا لا يزيد على 600000 مللي ثانية. فضّل التجاوزات لكل خطاف
للخطافات البطيئة المعروفة حتى لا يحصل Plugin واحد على ميزانية أطول في كل مكان.

يتلقى كل خطاف `event.context.pluginConfig`، وهي الإعدادات المحلولة لـ Plugin
الذي سجّل ذلك المعالج. استخدمها لقرارات الخطافات التي تحتاج إلى خيارات Plugin
الحالية؛ يحقنها OpenClaw لكل معالج من دون تغيير كائن الحدث المشترك الذي تراه
Plugins الأخرى.

## كتالوج الخطافات

تُجمّع الخطافات حسب السطح الذي توسّعه. تقبل الأسماء المكتوبة **بخط عريض** نتيجة
قرار (حظر، إلغاء، تجاوز، أو طلب موافقة)؛ أما الباقي فهي للملاحظة فقط.

**دور الوكيل**

- `before_model_resolve` — تجاوز المزوّد أو النموذج قبل تحميل رسائل الجلسة
- `agent_turn_prepare` — استهلاك حقن أدوار Plugin الموجودة في الطابور وإضافة سياق الدور نفسه قبل خطافات الموجّه
- `before_prompt_build` — إضافة سياق ديناميكي أو نص موجّه نظام قبل استدعاء النموذج
- `before_agent_start` — مرحلة مدمجة للتوافق فقط؛ فضّل الخطافين أعلاه
- **`before_agent_reply`** — اختصار دور النموذج برد اصطناعي أو صمت
- **`before_agent_finalize`** — فحص الإجابة النهائية الطبيعية وطلب تمريرة نموذج إضافية واحدة
- `agent_end` — ملاحظة الرسائل النهائية، وحالة النجاح، ومدة التشغيل
- `heartbeat_prompt_contribution` — إضافة سياق مخصص لـ Heartbeat فقط لـ Plugins المراقبة الخلفية ودورة الحياة

**ملاحظة المحادثة**

- `model_call_started` / `model_call_ended` — ملاحظة بيانات تعريف استدعاء المزوّد/النموذج بعد تنقيتها، والتوقيت، والنتيجة، وتجزئات معرّفات الطلب المحدودة من دون محتوى الموجّه أو الاستجابة
- `llm_input` — ملاحظة دخل المزوّد (موجّه النظام، الموجّه، السجل)
- `llm_output` — ملاحظة خرج المزوّد

**الأدوات**

- **`before_tool_call`** — إعادة كتابة معاملات الأداة، أو حظر التنفيذ، أو طلب الموافقة
- `after_tool_call` — ملاحظة نتائج الأدوات، والأخطاء، والمدة
- **`tool_result_persist`** — إعادة كتابة رسالة المساعد الناتجة من نتيجة أداة
- **`before_message_write`** — فحص أو حظر كتابة رسالة قيد التنفيذ (نادر)

**الرسائل والتسليم**

- **`inbound_claim`** — المطالبة برسالة واردة قبل توجيه الوكيل (ردود اصطناعية)
- `message_received` — ملاحظة المحتوى الوارد، والمرسل، والسلسلة، وبيانات التعريف
- **`message_sending`** — إعادة كتابة المحتوى الصادر أو إلغاء التسليم
- `message_sent` — ملاحظة نجاح أو فشل التسليم الصادر
- **`before_dispatch`** — فحص أو إعادة كتابة إرسال صادر قبل تسليمه إلى القناة
- **`reply_dispatch`** — المشاركة في مسار إرسال الرد النهائي

**الجلسات وCompaction**

- `session_start` / `session_end` — تتبع حدود دورة حياة الجلسة
- `before_compaction` / `after_compaction` — ملاحظة دورات Compaction أو إضافة تعليقات توضيحية إليها
- `before_reset` — ملاحظة أحداث إعادة ضبط الجلسة (`/reset`، عمليات إعادة الضبط البرمجية)

**الوكلاء الفرعيون**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — تنسيق توجيه الوكلاء الفرعيين وتسليم الإكمال

**دورة الحياة**

- `gateway_start` / `gateway_stop` — بدء أو إيقاف الخدمات المملوكة لـ Plugin مع Gateway
- `cron_changed` — ملاحظة تغييرات دورة حياة Cron المملوكة للبوابة (أضيف، حُدّث، أزيل، بدأ، انتهى، جُدول)
- **`before_install`** — فحص عمليات مسح تثبيت Skills أو Plugin وحظرها اختياريا

## سياسة استدعاء الأدوات

يتلقى `before_tool_call` ما يلي:

- `event.toolName`
- `event.params`
- `event.runId` الاختياري
- `event.toolCallId` الاختياري
- حقول السياق مثل `ctx.agentId` و`ctx.sessionKey` و`ctx.sessionId`،
  و`ctx.runId` و`ctx.jobId` (يُضبط في التشغيلات المدفوعة بـ Cron)، والتشخيص `ctx.trace`

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
- يُعامل `block: false` كأنه لا يوجد قرار.
- تعيد `params` كتابة معاملات الأداة للتنفيذ.
- يوقف `requireApproval` تشغيل الوكيل مؤقتا ويطلب من المستخدم عبر موافقات Plugin.
  يستطيع الأمر `/approve` الموافقة على موافقات exec وPlugin معا.
- لا يزال بإمكان `block: true` ذي أولوية أدنى الحظر بعد أن يطلب خطاف ذو أولوية أعلى
  الموافقة.
- يتلقى `onResolution` قرار الموافقة المحلول — `allow-once` أو
  `allow-always` أو `deny` أو `timeout` أو `cancelled`.

يمكن لـ Plugins المضمّنة التي تحتاج إلى سياسة على مستوى المضيف تسجيل سياسات أدوات موثوقة
باستخدام `api.registerTrustedToolPolicy(...)`. تعمل هذه قبل خطافات
`before_tool_call` العادية وقبل قرارات Plugin الخارجية. استخدمها فقط
للبوابات الموثوقة من المضيف مثل سياسة مساحة العمل، أو فرض الميزانية، أو
سلامة سير العمل المحجوزة. يجب على Plugins الخارجية استخدام خطافات
`before_tool_call` العادية.

### استمرار نتائج الأدوات

يمكن أن تتضمن نتائج الأدوات `details` منظّمة لعرض الواجهة، أو التشخيصات،
أو توجيه الوسائط، أو بيانات التعريف المملوكة لـ Plugin. تعامل مع `details`
على أنها بيانات تعريف وقت التشغيل، وليست محتوى موجّه:

- يزيل OpenClaw `toolResult.details` قبل إعادة تشغيل المزوّد ودخل Compaction
  حتى لا تصبح بيانات التعريف سياق نموذج.
- تحتفظ إدخالات الجلسة المستمرة بـ `details` المحدودة فقط. تُستبدل التفاصيل
  كبيرة الحجم بملخص مضغوط و`persistedDetailsTruncated: true`.
- يعمل `tool_result_persist` و`before_message_write` قبل سقف الاستمرار النهائي.
  ومع ذلك، يجب أن تبقي الخطافات `details` المعادة صغيرة وأن تتجنب وضع نص مهم
  للموجّه داخل `details` فقط؛ ضع خرج الأداة المرئي للنموذج في `content`.

## خطافات الموجّه والنموذج

استخدم الخطافات الخاصة بكل مرحلة لـ Plugins الجديدة:

- `before_model_resolve`: يتلقى الموجّه الحالي وبيانات تعريف المرفقات فقط.
  أرجع `providerOverride` أو `modelOverride`.
- `agent_turn_prepare`: يتلقى الموجّه الحالي، ورسائل الجلسة المحضّرة،
  وأي حقن موضوعة في الطابور لمرة واحدة بالضبط جرى تفريغها لهذه الجلسة. أرجع
  `prependContext` أو `appendContext`.
- `before_prompt_build`: يتلقى الموجّه الحالي ورسائل الجلسة.
  أرجع `prependContext` أو `appendContext` أو `systemPrompt`
  أو `prependSystemContext` أو `appendSystemContext`.
- `heartbeat_prompt_contribution`: يعمل فقط لأدوار Heartbeat ويعيد
  `prependContext` أو `appendContext`. وهو مخصص للمراقبات الخلفية
  التي تحتاج إلى تلخيص الحالة الحالية من دون تغيير الأدوار التي يبدأها المستخدم.

يبقى `before_agent_start` للتوافق. فضّل الخطافات الصريحة أعلاه
حتى لا يعتمد Plugin لديك على مرحلة مدمجة قديمة.

يتضمن `before_agent_start` و`agent_end` قيمة `event.runId` عندما يستطيع OpenClaw
تحديد التشغيل النشط. وتتوفر القيمة نفسها أيضا في `ctx.runId`.
تعرض التشغيلات المدفوعة بـ Cron أيضا `ctx.jobId` (معرّف مهمة Cron الأصلية) حتى
تستطيع خطافات Plugin حصر المقاييس، أو الآثار الجانبية، أو الحالة في مهمة مجدولة
محددة.

بالنسبة للتشغيلات الناشئة من قناة، يكون `ctx.messageProvider` هو سطح المزوّد مثل
`discord` أو `telegram`، بينما يكون `ctx.channelId` معرّف هدف المحادثة
عندما يستطيع OpenClaw اشتقاقه من مفتاح الجلسة أو بيانات تعريف التسليم.

`agent_end` هو خطاف ملاحظة ويعمل بنمط الإطلاق والنسيان بعد الدور. يطبق
مشغّل الخطافات مهلة 30 ثانية حتى لا يترك Plugin عالق أو نقطة نهاية تضمين
وعد الخطاف معلقا إلى الأبد. تُسجّل المهلة ويواصل OpenClaw؛ ولا تلغي عمل الشبكة
المملوك لـ Plugin إلا إذا استخدم Plugin أيضا إشارة إلغاء خاصة به.

استخدم `model_call_started` و`model_call_ended` لقياسات استدعاء المزوّد
التي يجب ألا تتلقى الموجّهات الخام، أو السجل، أو الاستجابات، أو الرؤوس، أو أجسام
الطلبات، أو معرّفات طلبات المزوّد. تتضمن هذه الخطافات بيانات تعريف مستقرة مثل
`runId` و`callId` و`provider` و`model` و`api`/`transport` الاختياريين،
و`durationMs`/`outcome` النهائيين، و`upstreamRequestIdHash` عندما يستطيع
OpenClaw اشتقاق تجزئة محدودة لمعرّف طلب المزوّد.

يعمل `before_agent_finalize` فقط عندما يكون الحامل على وشك قبول إجابة مساعد
نهائية طبيعية. وهو ليس مسار إلغاء `/stop` ولا يعمل عندما يجهض المستخدم دورا.
أرجع `{ action: "revise", reason }` لطلب تمريرة نموذج إضافية واحدة من الحامل
قبل الإنهاء، أو `{ action:
"finalize", reason? }` لفرض الإنهاء، أو احذف النتيجة للمتابعة.
تُرحّل خطافات Codex الأصلية `Stop` إلى هذا الخطاف كقرارات OpenClaw
`before_agent_finalize`.

عند إرجاع `action: "revise"`، يمكن لـ Plugins تضمين بيانات تعريف `retry` لجعل
تمريرة النموذج الإضافية محدودة وآمنة لإعادة التشغيل:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

تُضاف `instruction` إلى سبب المراجعة المرسل إلى الحامل.
تتيح `idempotencyKey` للمضيف عدّ إعادة المحاولات لطلب Plugin نفسه عبر قرارات
إنهاء متكافئة، ويحد `maxAttempts` عدد التمريرات الإضافية التي سيسمح بها المضيف
قبل المتابعة بالإجابة النهائية الطبيعية.

يجب على Plugins غير المضمّنة التي تحتاج إلى `llm_input` أو `llm_output`
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

يمكن تعطيل الخطافات التي تغيّر الموجّه والحقن الدائمة للدور التالي لكل Plugin
باستخدام `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### امتدادات الجلسة وحقن الدور التالي

يمكن لـ Workflow plugins الاحتفاظ بحالة جلسة صغيرة متوافقة مع JSON باستخدام
`api.registerSessionExtension(...)` وتحديثها عبر طريقة Gateway
`sessions.pluginPatch`. تعرض صفوف الجلسات حالة الامتداد المسجلة عبر
`pluginExtensions`، مما يتيح لـ Control UI والعملاء الآخرين عرض الحالة التي
يمتلكها الـ plugin من دون معرفة تفاصيله الداخلية.

استخدم `api.enqueueNextTurnInjection(...)` عندما يحتاج plugin إلى سياق دائم
يصل إلى دورة النموذج التالية مرة واحدة بالضبط. يفرغ OpenClaw الإدخالات
المجدولة قبل prompt hooks، ويتجاهل الإدخالات المنتهية الصلاحية، ويزيل
التكرارات بحسب `idempotencyKey` لكل plugin. هذا هو الحد الفاصل الصحيح
لاستئنافات الموافقة، وملخصات السياسات، وفروقات مراقبة الخلفية، ومتابعات
الأوامر التي يجب أن تكون مرئية للنموذج في الدورة التالية لكنها لا ينبغي أن
تصبح نصًا دائمًا في system prompt.

دلالات التنظيف جزء من العقد. تتلقى دوال تنظيف امتداد الجلسة وتنظيف دورة حياة
وقت التشغيل `reset` أو `delete` أو `disable` أو `restart`. يزيل المضيف حالة
امتداد الجلسة الدائمة التي يملكها الـ plugin والإدخالات المعلقة للدورة التالية
عند reset/delete/disable؛ أما restart فيُبقي حالة الجلسة الدائمة بينما تتيح
دوال التنظيف للـ plugins تحرير مهام المجدول، وسياق التشغيل، والموارد الأخرى
الخارجة عن المسار لجيل وقت التشغيل القديم.

## خطافات الرسائل

استخدم خطافات الرسائل لسياسة التوجيه والتسليم على مستوى القناة:

- `message_received`: مراقبة المحتوى الوارد، والمرسل، و`threadId`، و`messageId`،
  و`senderId`، والربط الاختياري بالتشغيل/الجلسة، والبيانات الوصفية.
- `message_sending`: إعادة كتابة `content` أو إرجاع `{ cancel: true }`.
- `message_sent`: مراقبة النجاح أو الفشل النهائي.

بالنسبة إلى ردود TTS الصوتية فقط، قد يحتوي `content` على النص المنطوق المخفي
حتى عندما لا تحتوي حمولة القناة على نص/تعليق مرئي. تؤدي إعادة كتابة ذلك
`content` إلى تحديث النص الظاهر للخطاف فقط؛ ولا يتم عرضه كتعليق وسائط.

تعرض سياقات خطافات الرسائل حقول ربط مستقرة عند توفرها:
`ctx.sessionKey` و`ctx.runId` و`ctx.messageId` و`ctx.senderId` و`ctx.trace`
و`ctx.traceId` و`ctx.spanId` و`ctx.parentSpanId` و`ctx.callDepth`. فضّل
هذه الحقول المباشرة قبل قراءة البيانات الوصفية القديمة.

فضّل حقلي `threadId` و`replyToId` المكتوبين قبل استخدام البيانات الوصفية
الخاصة بالقناة.

قواعد القرار:

- `message_sending` مع `cancel: true` نهائي.
- `message_sending` مع `cancel: false` يُعامل كأنه بلا قرار.
- يستمر `content` المعاد كتابته إلى الخطافات الأقل أولوية ما لم يلغِ خطاف
  لاحق التسليم.

## خطافات التثبيت

يعمل `before_install` بعد الفحص المدمج لتثبيت Skills وplugin. أرجع نتائج
إضافية أو `{ block: true, blockReason }` لإيقاف التثبيت.

`block: true` نهائي. يُعامل `block: false` كأنه بلا قرار.

## دورة حياة Gateway

استخدم `gateway_start` لخدمات plugin التي تحتاج إلى حالة يملكها Gateway. يعرض
السياق `ctx.config` و`ctx.workspaceDir` و`ctx.getCron?.()` لفحص cron وتحديثاته.
استخدم `gateway_stop` لتنظيف الموارد طويلة التشغيل.

لا تعتمد على خطاف `gateway:startup` الداخلي لخدمات وقت التشغيل التي يملكها
plugin.

يُطلق `cron_changed` لأحداث دورة حياة cron التي يملكها gateway مع حمولة حدث
مكتوبة تغطي أسباب `added` و`updated` و`removed` و`started` و`finished`
و`scheduled`. يحمل الحدث لقطة `PluginHookGatewayCronJob` (بما في ذلك
`state.nextRunAtMs` و`state.lastRunStatus` و`state.lastError` عند وجودها)
إضافة إلى `PluginHookGatewayCronDeliveryStatus` بقيمة `not-requested` |
`delivered` | `not-delivered` | `unknown`. لا تزال أحداث الإزالة تحمل لقطة
المهمة المحذوفة حتى تتمكن المجدولات الخارجية من مطابقة الحالة. استخدم
`ctx.getCron?.()` و`ctx.config` من سياق وقت التشغيل عند مزامنة مجدولات
الإيقاظ الخارجية، وأبقِ OpenClaw مصدر الحقيقة لفحوصات الاستحقاق والتنفيذ.

## الإهمالات القادمة

بعض الأسطح القريبة من الخطافات مهملة لكنها لا تزال مدعومة. انتقل قبل الإصدار
الرئيسي التالي:

- **مغلفات القنوات بنص عادي** في معالجات `inbound_claim` و`message_received`.
  اقرأ `BodyForAgent` وكتل سياق المستخدم المنظمة بدلًا من تحليل نص المغلف
  المسطح. راجع
  [مغلفات القنوات بنص عادي → BodyForAgent](/ar/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** باقٍ للتوافق. ينبغي للـ plugins الجديدة استخدام
  `before_model_resolve` و`before_prompt_build` بدلًا من المرحلة المدمجة.
- **`onResolution` في `before_tool_call`** يستخدم الآن اتحاد
  `PluginApprovalResolution` المكتوب (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) بدلًا من `string` حر الصياغة.

للاطلاع على القائمة الكاملة — تسجيل قدرة الذاكرة، وملف تفكير المزوّد،
ومزوّدي المصادقة الخارجيين، وأنواع اكتشاف المزوّد، وموصلات وقت تشغيل المهام،
وإعادة تسمية `command-auth` إلى `command-status` — راجع
[ترحيل Plugin SDK → الإهمالات النشطة](/ar/plugins/sdk-migration#active-deprecations).

## ذو صلة

- [ترحيل Plugin SDK](/ar/plugins/sdk-migration) — الإهمالات النشطة والجدول الزمني للإزالة
- [بناء plugins](/ar/plugins/building-plugins)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints)
- [الخطافات الداخلية](/ar/automation/hooks)
- [تفاصيل بنية Plugin الداخلية](/ar/plugins/architecture-internals)
