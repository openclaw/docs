---
read_when:
    - أنت تبني Plugin يحتاج إلى before_tool_call أو before_agent_reply أو خطافات الرسائل أو خطافات دورة الحياة
    - يجب عليك حظر استدعاءات الأدوات من Plugin أو إعادة كتابتها أو طلب الموافقة عليها.
    - أنت تفاضل بين الخطافات الداخلية وخطافات Plugin
summary: 'خطافات Plugin: اعتراض أحداث دورة حياة الوكيل والأداة والرسالة والجلسة وGateway'
title: خطافات Plugin
x-i18n:
    generated_at: "2026-05-02T07:37:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4efb07c6211debb5a7915d63678b1695946a91600c54d31faa0edf7025fbabf0
    source_path: plugins/hooks.md
    workflow: 16
---

خطافات Plugin هي نقاط امتداد داخل العملية لـ Plugins OpenClaw. استخدمها
عندما يحتاج Plugin إلى فحص أو تغيير تشغيلات الوكيل، أو استدعاءات الأدوات، أو تدفق الرسائل،
أو دورة حياة الجلسة، أو توجيه الوكلاء الفرعيين، أو عمليات التثبيت، أو بدء تشغيل Gateway.

استخدم [الخطافات الداخلية](/ar/automation/hooks) بدلاً من ذلك عندما تريد نصًا برمجيًا صغيرًا
`HOOK.md` يثبته المشغل لأحداث الأوامر وGateway مثل
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

تعمل معالجات الخطافات بالتتابع بترتيب تنازلي حسب `priority`. الخطافات ذات الأولوية نفسها
تحافظ على ترتيب التسجيل.

يقبل `api.on(name, handler, opts?)` ما يلي:

- `priority` — ترتيب المعالجات (القيمة الأعلى تعمل أولاً).
- `timeoutMs` — ميزانية اختيارية لكل خطاف. عند ضبطها، يوقف مشغّل الخطافات ذلك
  المعالج بعد انقضاء الميزانية ويتابع مع المعالج التالي، بدلاً من
  السماح للإعداد البطيء أو عمل الاستدعاء باستهلاك مهلة النموذج المضبوطة لدى المستدعي.
  اتركها لاستخدام مهلة الملاحظة/القرار الافتراضية التي يطبقها
  مشغّل الخطافات عمومًا.

يتلقى كل خطاف `event.context.pluginConfig`، وهو الإعداد المحلول لـ
Plugin الذي سجّل ذلك المعالج. استخدمه لقرارات الخطافات التي تحتاج
خيارات Plugin الحالية؛ يحقنه OpenClaw لكل معالج دون تغيير
كائن الحدث المشترك الذي تراه Plugins الأخرى.

## كتالوج الخطافات

تُجمّع الخطافات حسب السطح الذي توسّعه. الأسماء المكتوبة **بالغامق** تقبل
نتيجة قرار (حظر أو إلغاء أو تجاوز أو طلب موافقة)؛ وكل ما عداها
للملاحظة فقط.

**دورة الوكيل**

- `before_model_resolve` — تجاوز المزوّد أو النموذج قبل تحميل رسائل الجلسة
- `agent_turn_prepare` — استهلاك إدخالات دورة Plugin الموجودة في قائمة الانتظار وإضافة سياق للدورة نفسها قبل خطافات الموجّه
- `before_prompt_build` — إضافة سياق ديناميكي أو نص موجّه النظام قبل استدعاء النموذج
- `before_agent_start` — مرحلة مدمجة للتوافق فقط؛ فضّل الخطافين أعلاه
- **`before_agent_reply`** — اختصار دورة النموذج برد اصطناعي أو بالصمت
- **`before_agent_finalize`** — فحص الإجابة النهائية الطبيعية وطلب تمريرة نموذج إضافية
- `agent_end` — ملاحظة الرسائل النهائية، وحالة النجاح، ومدة التشغيل
- `heartbeat_prompt_contribution` — إضافة سياق خاص بـ Heartbeat فقط لـ Plugins مراقبة الخلفية ودورة الحياة

**ملاحظة المحادثة**

- `model_call_started` / `model_call_ended` — ملاحظة بيانات تعريف استدعاء المزوّد/النموذج المنقّاة، والتوقيت، والنتيجة، وتجزئات معرّفات الطلب المحدودة دون محتوى الموجّه أو الاستجابة
- `llm_input` — ملاحظة دخل المزوّد (موجّه النظام، الموجّه، السجل)
- `llm_output` — ملاحظة خرج المزوّد

**الأدوات**

- **`before_tool_call`** — إعادة كتابة معاملات الأداة، أو حظر التنفيذ، أو طلب الموافقة
- `after_tool_call` — ملاحظة نتائج الأدوات والأخطاء والمدة
- **`tool_result_persist`** — إعادة كتابة رسالة المساعد الناتجة من نتيجة أداة
- **`before_message_write`** — فحص أو حظر كتابة رسالة قيد التنفيذ (نادر)

**الرسائل والتسليم**

- **`inbound_claim`** — المطالبة برسالة واردة قبل توجيه الوكيل (ردود اصطناعية)
- `message_received` — ملاحظة المحتوى الوارد والمرسل وسلسلة المحادثة وبيانات التعريف
- **`message_sending`** — إعادة كتابة المحتوى الصادر أو إلغاء التسليم
- `message_sent` — ملاحظة نجاح التسليم الصادر أو فشله
- **`before_dispatch`** — فحص أو إعادة كتابة إرسال صادر قبل تسليمه إلى القناة
- **`reply_dispatch`** — المشاركة في خط أنابيب إرسال الرد النهائي

**الجلسات وCompaction**

- `session_start` / `session_end` — تتبع حدود دورة حياة الجلسة
- `before_compaction` / `after_compaction` — ملاحظة دورات Compaction أو إضافة تعليقات توضيحية إليها
- `before_reset` — ملاحظة أحداث إعادة ضبط الجلسة (`/reset`، عمليات إعادة الضبط البرمجية)

**الوكلاء الفرعيون**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — تنسيق توجيه الوكلاء الفرعيين وتسليم الإكمال

**دورة الحياة**

- `gateway_start` / `gateway_stop` — بدء أو إيقاف خدمات مملوكة لـ Plugin مع Gateway
- `cron_changed` — ملاحظة تغييرات دورة حياة Cron المملوكة لـ Gateway (أُضيف، حُدّث، أُزيل، بدأ، انتهى، جُدول)
- **`before_install`** — فحص عمليات مسح تثبيت Skills أو Plugin وحظرها اختياريًا

## سياسة استدعاء الأداة

يتلقى `before_tool_call` ما يلي:

- `event.toolName`
- `event.params`
- `event.runId` اختياري
- `event.toolCallId` اختياري
- حقول السياق مثل `ctx.agentId` و`ctx.sessionKey` و`ctx.sessionId`،
  و`ctx.runId` و`ctx.jobId` (تُضبط في التشغيلات المدفوعة بـ Cron)، و`ctx.trace` التشخيصي

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
- `block: false` يُعامل كأنه لا يوجد قرار.
- `params` يعيد كتابة معاملات الأداة للتنفيذ.
- `requireApproval` يوقف تشغيل الوكيل مؤقتًا ويطلب من المستخدم عبر موافقات Plugin.
  يمكن لأمر `/approve` الموافقة على موافقات exec وPlugin معًا.
- ما زال بإمكان `block: true` ذي أولوية أدنى الحظر بعد أن يطلب خطاف ذو أولوية أعلى
  الموافقة.
- يتلقى `onResolution` قرار الموافقة المحلول — `allow-once`،
  أو `allow-always`، أو `deny`، أو `timeout`، أو `cancelled`.

يمكن لـ Plugins المضمّنة التي تحتاج سياسة على مستوى المضيف تسجيل سياسات أدوات موثوقة
باستخدام `api.registerTrustedToolPolicy(...)`. تعمل هذه قبل خطافات
`before_tool_call` العادية وقبل قرارات Plugin الخارجية. استخدمها فقط
للبوابات الموثوقة من المضيف مثل سياسة مساحة العمل، أو فرض الميزانية، أو
سلامة سير العمل المحجوزة. يجب على Plugins الخارجية استخدام خطافات `before_tool_call`
العادية.

### استمرارية نتيجة الأداة

يمكن أن تتضمن نتائج الأدوات `details` منظمة لعرض الواجهة، أو التشخيصات،
أو توجيه الوسائط، أو بيانات تعريف مملوكة لـ Plugin. تعامل مع `details` كبيانات تعريف وقت تشغيل،
لا كمحتوى موجّه:

- يزيل OpenClaw `toolResult.details` قبل إعادة تشغيل المزوّد ودخل Compaction
  حتى لا تصبح بيانات التعريف سياقًا للنموذج.
- تحتفظ إدخالات الجلسة المستمرة بـ `details` محدودة فقط. تُستبدل التفاصيل كبيرة الحجم
  بملخص مضغوط و`persistedDetailsTruncated: true`.
- يعمل `tool_result_persist` و`before_message_write` قبل حدّ الاستمرارية
  النهائي. مع ذلك يجب أن تُبقي الخطافات `details` المرجعة صغيرة وتتجنب
  وضع نص ذي صلة بالموجّه في `details` فقط؛ ضع خرج الأداة المرئي للنموذج
  في `content`.

## خطافات الموجّه والنموذج

استخدم الخطافات الخاصة بالمرحلة لـ Plugins الجديدة:

- `before_model_resolve`: يتلقى الموجّه الحالي وبيانات تعريف المرفقات فقط.
  أرجع `providerOverride` أو `modelOverride`.
- `agent_turn_prepare`: يتلقى الموجّه الحالي، ورسائل الجلسة المحضّرة،
  وأي إدخالات موضوعة في قائمة الانتظار لمرة واحدة تمامًا تم تصريفها لهذه الجلسة. أرجع
  `prependContext` أو `appendContext`.
- `before_prompt_build`: يتلقى الموجّه الحالي ورسائل الجلسة.
  أرجع `prependContext` أو `appendContext` أو `systemPrompt`
  أو `prependSystemContext` أو `appendSystemContext`.
- `heartbeat_prompt_contribution`: يعمل فقط لدورات Heartbeat ويعيد
  `prependContext` أو `appendContext`. وهو مخصص لمراقبات الخلفية
  التي تحتاج إلى تلخيص الحالة الحالية دون تغيير الدورات التي بدأها المستخدم.

يبقى `before_agent_start` للتوافق. فضّل الخطافات الصريحة أعلاه
حتى لا يعتمد Plugin لديك على مرحلة مدمجة قديمة.

يتضمن `before_agent_start` و`agent_end` قيمة `event.runId` عندما يستطيع OpenClaw
تحديد التشغيل النشط. تتوفر القيمة نفسها أيضًا على `ctx.runId`.
تعرض التشغيلات المدفوعة بـ Cron أيضًا `ctx.jobId` (معرّف مهمة Cron الأصلية) حتى
تتمكن خطافات Plugin من حصر المقاييس أو الآثار الجانبية أو الحالة بمهمة مجدولة محددة.

بالنسبة للتشغيلات الصادرة من القنوات، يكون `ctx.messageProvider` هو سطح المزوّد مثل
`discord` أو `telegram`، بينما يكون `ctx.channelId` معرّف هدف المحادثة
عندما يستطيع OpenClaw اشتقاقه من مفتاح الجلسة أو بيانات تعريف التسليم.

`agent_end` خطاف ملاحظة ويعمل بأسلوب fire-and-forget بعد الدورة. يطبّق
مشغّل الخطافات مهلة 30 ثانية حتى لا يترك Plugin عالق أو نقطة نهاية تضمين
وعد الخطاف معلقًا إلى الأبد. تُسجّل المهلة ويتابع OpenClaw؛ ولا تلغي
عمل الشبكة المملوك لـ Plugin إلا إذا استخدم Plugin أيضًا إشارة إيقاف خاصة به.

استخدم `model_call_started` و`model_call_ended` لقياسات استدعاء المزوّد
التي يجب ألا تتلقى الموجّهات الخام أو السجل أو الاستجابات أو الرؤوس أو أجسام الطلبات
أو معرّفات طلبات المزوّد. تتضمن هذه الخطافات بيانات تعريف ثابتة مثل
`runId` و`callId` و`provider` و`model`، و`api`/`transport` الاختياريين، و
`durationMs`/`outcome` النهائيين، و`upstreamRequestIdHash` عندما يستطيع OpenClaw اشتقاق
تجزئة محدودة لمعرّف طلب المزوّد.

يعمل `before_agent_finalize` فقط عندما يكون إطار الاختبار على وشك قبول إجابة مساعد نهائية
طبيعية. ليس مسار إلغاء `/stop` ولا يعمل
عندما يوقف المستخدم دورة. أرجع `{ action: "revise", reason }` لطلب
تمريرة نموذج إضافية من الإطار قبل الإنهاء، أو `{ action:
"finalize", reason? }` لفرض الإنهاء، أو اترك النتيجة لمتابعة التنفيذ.
تُمرَّر خطافات `Stop` الأصلية في Codex إلى هذا الخطاف كقرارات OpenClaw
`before_agent_finalize`.

يجب على Plugins غير المضمّنة التي تحتاج `llm_input` أو `llm_output`
أو `before_agent_finalize` أو `agent_end` ضبط:

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

يمكن تعطيل خطافات تعديل الموجّه وإدخالات الدورة التالية الدائمة لكل Plugin
باستخدام `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### امتدادات الجلسة وإدخالات الدورة التالية

يمكن لـ Plugins سير العمل حفظ حالة جلسة صغيرة متوافقة مع JSON باستخدام
`api.registerSessionExtension(...)` وتحديثها عبر طريقة Gateway
`sessions.pluginPatch`. تعرض صفوف الجلسة حالة الامتداد المسجلة عبر
`pluginExtensions`، مما يتيح لـ Control UI والعملاء الآخرين عرض
الحالة المملوكة لـ Plugin دون معرفة تفاصيل Plugin الداخلية.

استخدم `api.enqueueNextTurnInjection(...)` عندما يحتاج Plugin إلى سياق دائم
يصل إلى دورة النموذج التالية مرة واحدة تمامًا. يصرّف OpenClaw الإدخالات الموجودة في قائمة الانتظار قبل
خطافات الموجّه، ويسقط الإدخالات منتهية الصلاحية، ويزيل التكرار حسب `idempotencyKey`
لكل Plugin. هذا هو الحد المناسب لاستئناف الموافقات، وملخصات السياسات،
وفروقات مراقبة الخلفية، واستمرارات الأوامر التي يجب أن تكون مرئية
للنموذج في الدورة التالية ولكن يجب ألا تصبح نصًا دائمًا لموجّه النظام.

دلالات التنظيف جزء من العقد. تتلقى عمليات تنظيف امتداد الجلسة
واستدعاءات تنظيف دورة حياة وقت التشغيل `reset` أو `delete` أو `disable` أو
`restart`. يزيل المضيف حالة امتداد الجلسة المستمرة الخاصة بـ Plugin المالك
وإدخالات الدورة التالية المعلقة عند reset/delete/disable؛ أما restart فيُبقي
حالة الجلسة الدائمة بينما تسمح استدعاءات التنظيف لـ Plugins بتحرير مهام المجدول
وسياق التشغيل والموارد الأخرى خارج النطاق الخاصة بجيل وقت التشغيل القديم.

## خطافات الرسائل

استخدم خطافات الرسائل لسياسة التوجيه والتسليم على مستوى القناة:

- `message_received`: راقب المحتوى الوارد، والمرسِل، و`threadId`، و`messageId`،
  و`senderId`، وترابط التشغيل/الجلسة الاختياري، والبيانات الوصفية.
- `message_sending`: أعد كتابة `content` أو أرجع `{ cancel: true }`.
- `message_sent`: راقب النجاح أو الفشل النهائي.

بالنسبة إلى ردود TTS الصوتية فقط، قد يحتوي `content` على النص المنطوق المخفي
حتى عندما لا تتضمن حمولة القناة نصًا/تعليقًا مرئيًا. تؤدي إعادة كتابة ذلك
`content` إلى تحديث النص المرئي للـ hook فقط؛ ولا يُعرَض كتعليق وسائط.

تكشف سياقات hook الرسائل عن حقول ترابط مستقرة عند توفرها:
`ctx.sessionKey`، و`ctx.runId`، و`ctx.messageId`، و`ctx.senderId`، و`ctx.trace`،
و`ctx.traceId`، و`ctx.spanId`، و`ctx.parentSpanId`، و`ctx.callDepth`. فضّل
هذه الحقول من الدرجة الأولى قبل قراءة البيانات الوصفية القديمة.

فضّل حقلي `threadId` و`replyToId` المطبوعين قبل استخدام البيانات الوصفية
الخاصة بالقناة.

قواعد القرار:

- يكون `message_sending` مع `cancel: true` نهائيًا.
- يُعامل `message_sending` مع `cancel: false` على أنه بلا قرار.
- يستمر `content` المُعاد كتابته إلى hooks ذات الأولوية الأدنى ما لم يُلغِ hook لاحق
  التسليم.

## تثبيت hooks

يُشغَّل `before_install` بعد الفحص المدمج لعمليات تثبيت Skills وPlugin.
أرجع نتائج إضافية أو `{ block: true, blockReason }` لإيقاف
التثبيت.

`block: true` نهائي. يُعامل `block: false` على أنه بلا قرار.

## دورة حياة Gateway

استخدم `gateway_start` لخدمات Plugin التي تحتاج إلى حالة مملوكة لـ Gateway. يكشف
السياق عن `ctx.config`، و`ctx.workspaceDir`، و`ctx.getCron?.()` من أجل
فحص cron وتحديثاته. استخدم `gateway_stop` لتنظيف الموارد طويلة التشغيل.

لا تعتمد على hook الداخلي `gateway:startup` لخدمات وقت التشغيل المملوكة لـ Plugin.

ينطلق `cron_changed` لأحداث دورة حياة cron المملوكة لـ gateway مع حمولة حدث
مطبوعة تغطي أسباب `added`، و`updated`، و`removed`، و`started`، و`finished`،
و`scheduled`. يحمل الحدث لقطة `PluginHookGatewayCronJob`
(بما في ذلك `state.nextRunAtMs`، و`state.lastRunStatus`، و
`state.lastError` عند وجودها) بالإضافة إلى `PluginHookGatewayCronDeliveryStatus`
بقيمة `not-requested` | `delivered` | `not-delivered` | `unknown`. لا تزال
أحداث الإزالة تحمل لقطة المهمة المحذوفة كي تتمكن المجدولات الخارجية من
تسوية الحالة. استخدم `ctx.getCron?.()` و`ctx.config` من سياق وقت التشغيل
عند مزامنة مجدولات الإيقاظ الخارجية، واجعل OpenClaw مصدر الحقيقة
لفحوصات الاستحقاق والتنفيذ.

## الإهمالات القادمة

هناك بعض الأسطح المجاورة لـ hooks مهملة لكنها لا تزال مدعومة. انتقل
قبل الإصدار الرئيسي التالي:

- **مغلفات القنوات ذات النص الصريح** في معالجات `inbound_claim` و`message_received`.
  اقرأ `BodyForAgent` وكتل سياق المستخدم المهيكلة
  بدلًا من تحليل نص المغلف المسطح. راجع
  [مغلفات القنوات ذات النص الصريح → BodyForAgent](/ar/plugins/sdk-migration#active-deprecations).
- يبقى **`before_agent_start`** للتوافق. يجب أن تستخدم Plugins الجديدة
  `before_model_resolve` و`before_prompt_build` بدلًا من المرحلة
  المدمجة.
- يستخدم **`onResolution` في `before_tool_call`** الآن اتحاد
  `PluginApprovalResolution` المطبوع (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) بدلًا من `string` حرّ الصياغة.

للاطلاع على القائمة الكاملة — تسجيل إمكانية الذاكرة، وملف تعريف تفكير المزوّد،
ومزوّدي المصادقة الخارجيين، وأنواع اكتشاف المزوّدين، وموصلات وصول وقت تشغيل
المهام، وإعادة تسمية `command-auth` إلى `command-status` — راجع
[ترحيل Plugin SDK → الإهمالات النشطة](/ar/plugins/sdk-migration#active-deprecations).

## ذات صلة

- [ترحيل Plugin SDK](/ar/plugins/sdk-migration) — الإهمالات النشطة والجدول الزمني للإزالة
- [بناء Plugins](/ar/plugins/building-plugins)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints)
- [hooks الداخلية](/ar/automation/hooks)
- [التفاصيل الداخلية لمعمارية Plugin](/ar/plugins/architecture-internals)
