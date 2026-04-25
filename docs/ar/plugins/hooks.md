---
read_when:
    - أنت تنشئ Plugin يحتاج إلى `before_tool_call` أو `before_agent_reply` أو خطافات الرسائل أو خطافات دورة الحياة
    - تحتاج إلى حظر استدعاءات الأدوات من Plugin أو إعادة كتابتها أو طلب الموافقة عليها
    - أنت تقرر بين الخطافات الداخلية وخطافات Plugin
summary: 'خطافات Plugin: اعتراض أحداث دورة حياة الوكيل، والأداة، والرسالة، والجلسة، وGateway'
title: خطافات Plugin
x-i18n:
    generated_at: "2026-04-25T18:20:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fa7554227cbb5d283e74c16d7e12ef524c494b8bb117a7ff4b37b49daa18af
    source_path: plugins/hooks.md
    workflow: 15
---

خطافات Plugin هي نقاط توسعة داخل العملية نفسها لإضافات OpenClaw. استخدمها
عندما يحتاج Plugin إلى فحص تشغيلات الوكيل أو استدعاءات الأدوات أو تدفق الرسائل،
أو دورة حياة الجلسة، أو توجيه الوكلاء الفرعيين، أو عمليات التثبيت، أو بدء تشغيل Gateway.

استخدم [الخطافات الداخلية](/ar/automation/hooks) بدلًا من ذلك عندما تريد
برنامج `HOOK.md` صغيرًا يثبّته المشغّل لأحداث الأوامر وGateway مثل
`/new` أو `/reset` أو `/stop` أو `agent:bootstrap` أو `gateway:startup`.

## البدء السريع

سجّل خطافات Plugin typed باستخدام `api.on(...)` من نقطة إدخال Plugin لديك:

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

تعمل معالِجات الخطافات بالتسلسل وفق `priority` تنازليًا. وتحافظ الخطافات ذات
الأولوية نفسها على ترتيب التسجيل.

## فهرس الخطافات

تُجمَّع الخطافات حسب السطح الذي توسّعه. الأسماء المكتوبة **بالخط العريض** تقبل
نتيجة قرار (حظر، أو إلغاء، أو تجاوز، أو طلب موافقة)؛ أما البقية فهي
للمراقبة فقط.

**دورة الوكيل**

- `before_model_resolve` — تجاوز المزوّد أو النموذج قبل تحميل رسائل الجلسة
- `before_prompt_build` — إضافة سياق ديناميكي أو نص مطالبة نظام قبل استدعاء النموذج
- `before_agent_start` — مرحلة مدمجة للتوافق فقط؛ يُفضّل استخدام الخطافين أعلاه
- **`before_agent_reply`** — إنهاء دورة النموذج مبكرًا برد اصطناعي أو بصمت
- `agent_end` — مراقبة الرسائل النهائية، وحالة النجاح، ومدة التشغيل

**مراقبة المحادثة**

- `model_call_started` / `model_call_ended` — مراقبة بيانات تعريف استدعاء المزوّد/النموذج المنقّحة، والتوقيت، والنتيجة، وتجزيئات معرّفات الطلب المحدودة من دون محتوى المطالبة أو الاستجابة
- `llm_input` — مراقبة مدخلات المزوّد (مطالبة النظام، المطالبة، السجل)
- `llm_output` — مراقبة مخرجات المزوّد

**الأدوات**

- **`before_tool_call`** — إعادة كتابة معاملات الأداة، أو حظر التنفيذ، أو طلب الموافقة
- `after_tool_call` — مراقبة نتائج الأداة، والأخطاء، والمدة
- **`tool_result_persist`** — إعادة كتابة رسالة المساعد الناتجة من نتيجة الأداة
- **`before_message_write`** — فحص كتابة رسالة قيد التنفيذ أو حظرها (نادر)

**الرسائل والتسليم**

- **`inbound_claim`** — المطالبة برسالة واردة قبل توجيهها إلى الوكيل (ردود اصطناعية)
- `message_received` — مراقبة المحتوى الوارد، والمرسل، والسلسلة، وبيانات التعريف
- **`message_sending`** — إعادة كتابة المحتوى الصادر أو إلغاء التسليم
- `message_sent` — مراقبة نجاح التسليم الصادر أو فشله
- **`before_dispatch`** — فحص عملية dispatch صادرة أو إعادة كتابتها قبل تسليم القناة
- **`reply_dispatch`** — المشاركة في مسار dispatch النهائي للرد

**الجلسات وCompaction**

- `session_start` / `session_end` — تتبّع حدود دورة حياة الجلسة
- `before_compaction` / `after_compaction` — مراقبة دورات Compaction أو إضافة تعليقات توضيحية إليها
- `before_reset` — مراقبة أحداث إعادة ضبط الجلسة (`/reset`، وإعادات الضبط البرمجية)

**الوكلاء الفرعيون**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — تنسيق توجيه الوكيل الفرعي وتسليم الإكمال

**دورة الحياة**

- `gateway_start` / `gateway_stop` — بدء الخدمات التي يملكها Plugin أو إيقافها مع Gateway
- **`before_install`** — فحص عمليات المسح الخاصة بتثبيت Skills أو Plugins وإمكانية حظرها

## سياسة استدعاء الأدوات

يتلقى `before_tool_call` ما يلي:

- `event.toolName`
- `event.params`
- `event.runId` اختياري
- `event.toolCallId` اختياري
- حقول السياق مثل `ctx.agentId` و`ctx.sessionKey` و`ctx.sessionId` و
  حقل التشخيص `ctx.trace`

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

- `block: true` نهائي ويتجاوز المعالِجات ذات الأولوية الأدنى.
- يُعامَل `block: false` على أنه بلا قرار.
- تعيد `params` كتابة معاملات الأداة للتنفيذ.
- يوقف `requireApproval` تشغيل الوكيل مؤقتًا ويطلب من المستخدم الموافقة عبر
  موافقات Plugin. ويمكن للأمر `/approve` الموافقة على موافقات exec وموافقات Plugin معًا.
- ما يزال `block: true` ذو الأولوية الأدنى قادرًا على الحظر بعد أن يكون خطاف
  ذو أولوية أعلى قد طلب الموافقة.
- تتلقى `onResolution` قرار الموافقة المحسوم — `allow-once`،
  أو `allow-always`، أو `deny`، أو `timeout`، أو `cancelled`.

## خطافات المطالبة والنموذج

استخدم الخطافات الخاصة بالمرحلة في Plugins الجديدة:

- `before_model_resolve`: يتلقى المطالبة الحالية وبيانات تعريف
  المرفقات فقط. أرجِع `providerOverride` أو `modelOverride`.
- `before_prompt_build`: يتلقى المطالبة الحالية ورسائل الجلسة.
  أرجِع `prependContext` أو `systemPrompt` أو `prependSystemContext` أو
  `appendSystemContext`.

يبقى `before_agent_start` للتوافق. يُفضَّل استخدام الخطافات الصريحة أعلاه
حتى لا يعتمد Plugin لديك على مرحلة مدمجة قديمة.

يتضمن `before_agent_start` و`agent_end` الحقل `event.runId` عندما يستطيع OpenClaw
تحديد التشغيل النشط. وتتوفر القيمة نفسها أيضًا في `ctx.runId`.

استخدم `model_call_started` و`model_call_ended` لقياسات تتبع استدعاءات المزوّد
التي يجب ألا تتلقى المطالبات الخام أو السجل أو الاستجابات أو الرؤوس أو أجسام
الطلبات أو معرّفات طلبات المزوّد. تتضمن هذه الخطافات بيانات تعريف ثابتة مثل
`runId` و`callId` و`provider` و`model` و`api`/`transport` الاختياريين،
والقيم النهائية `durationMs`/`outcome`، و`upstreamRequestIdHash` عندما يتمكن OpenClaw من اشتقاق
تجزئة محدودة لمعرّف طلب المزوّد.

يجب على Plugins غير المضمنة التي تحتاج إلى `llm_input` أو `llm_output` أو `agent_end` ضبط:

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

يمكن تعطيل الخطافات التي تعدّل المطالبة لكل Plugin على حدة باستخدام
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## خطافات الرسائل

استخدم خطافات الرسائل لتوجيه القنوات على مستوى القناة ولسياسة التسليم:

- `message_received`: مراقبة المحتوى الوارد، والمرسل، و`threadId`، و`messageId`،
  و`senderId`، وربط التشغيل/الجلسة الاختياري، وبيانات التعريف.
- `message_sending`: إعادة كتابة `content` أو إرجاع `{ cancel: true }`.
- `message_sent`: مراقبة النجاح أو الفشل النهائي.

بالنسبة إلى ردود TTS الصوتية فقط، قد يحتوي `content` على النص المنطوق المخفي
حتى عندما لا تحتوي حمولة القناة على نص/وصف مرئي. وتؤدي إعادة كتابة
ذلك `content` إلى تحديث النص الظاهر للخطاف فقط؛ ولا يُعرَض
كتسمية توضيحية للوسائط.

تكشف سياقات خطافات الرسائل حقول ارتباط ثابتة عند توفرها:
`ctx.sessionKey` و`ctx.runId` و`ctx.messageId` و`ctx.senderId` و`ctx.trace`،
و`ctx.traceId` و`ctx.spanId` و`ctx.parentSpanId` و`ctx.callDepth`. يُفضَّل استخدام
هذه الحقول المباشرة أولًا قبل قراءة بيانات التعريف القديمة.

فضّل الحقلين typed `threadId` و`replyToId` قبل استخدام بيانات تعريف خاصة بالقناة.

قواعد القرار:

- `message_sending` مع `cancel: true` نهائي.
- يُعامَل `message_sending` مع `cancel: false` على أنه بلا قرار.
- يستمر `content` المعاد كتابته إلى الخطافات ذات الأولوية الأدنى ما لم يقم خطاف لاحق
  بإلغاء التسليم.

## خطافات التثبيت

يعمل `before_install` بعد المسح المضمن لتثبيت Skills وPlugins.
أرجِع نتائج إضافية أو `{ block: true, blockReason }` لإيقاف
التثبيت.

القيمة `block: true` نهائية. وتُعامَل `block: false` على أنها بلا قرار.

## دورة حياة Gateway

استخدم `gateway_start` للخدمات الخاصة بـ Plugin التي تحتاج إلى حالة
يملكها Gateway. يكشف السياق `ctx.config` و`ctx.workspaceDir` و`ctx.getCron?.()`
لفحص Cron وتحديثه. واستخدم `gateway_stop` لتنظيف الموارد طويلة التشغيل.

لا تعتمد على الخطاف الداخلي `gateway:startup` للخدمات وقت التشغيل التي يملكها Plugin.

## الإهمالات القادمة

بعض الأسطح المجاورة للخطافات أصبحت مهملة لكنها ما تزال مدعومة. هاجر
قبل الإصدار الرئيسي التالي:

- **أغلفة القنوات النصية الصريحة** في معالِجات `inbound_claim` و`message_received`.
  اقرأ `BodyForAgent` وكتل سياق المستخدم المهيكلة
  بدلًا من تحليل نص الغلاف المسطح. راجع
  [أغلفة القنوات النصية الصريحة → BodyForAgent](/ar/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** يبقى للتوافق. يجب أن تستخدم Plugins الجديدة
  `before_model_resolve` و`before_prompt_build` بدلًا من
  المرحلة المدمجة.
- **`onResolution` في `before_tool_call`** تستخدم الآن اتحاد
  `PluginApprovalResolution` typed ‏(`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) بدلًا من `string` حر.

للاطلاع على القائمة الكاملة — تسجيل إمكانات الذاكرة، وملف
تفكير المزوّد، ومزوّدي المصادقة الخارجيين، وأنواع اكتشاف المزوّد،
وواصفات وقت تشغيل المهام، وإعادة التسمية من `command-auth` إلى `command-status` — راجع
[ترحيل Plugin SDK → الإهمالات النشطة](/ar/plugins/sdk-migration#active-deprecations).

## ذو صلة

- [ترحيل Plugin SDK](/ar/plugins/sdk-migration) — الإهمالات النشطة والجدول الزمني للإزالة
- [بناء Plugins](/ar/plugins/building-plugins)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [نقاط إدخال Plugin](/ar/plugins/sdk-entrypoints)
- [الخطافات الداخلية](/ar/automation/hooks)
- [البنية الداخلية لـ Plugin](/ar/plugins/architecture-internals)
