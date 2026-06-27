---
read_when:
    - أنت تبني plugin يحتاج إلى خطافات before_tool_call أو before_agent_reply أو خطافات الرسائل أو خطافات دورة الحياة
    - تحتاج إلى حظر استدعاءات الأدوات من Plugin أو إعادة كتابتها أو اشتراط الموافقة عليها.
    - أنت تختار بين الخطافات الداخلية وخطافات Plugin
summary: 'خطافات Plugin: اعتراض أحداث دورة حياة الوكيل والأداة والرسالة والجلسة وGateway'
title: Plugin hooks
x-i18n:
    generated_at: "2026-06-27T18:06:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c2db0963c85d15fd391fb575f981992ffd6d77c098bd78cac08be390caea931
    source_path: plugins/hooks.md
    workflow: 16
---

خطافات Plugin هي نقاط امتداد داخل العملية لـ Plugins في OpenClaw. استخدمها
عندما يحتاج Plugin إلى فحص أو تغيير تشغيلات الوكلاء، أو استدعاءات الأدوات، أو تدفق الرسائل،
أو دورة حياة الجلسات، أو توجيه الوكلاء الفرعيين، أو التثبيتات، أو بدء تشغيل Gateway.

استخدم [الخطافات الداخلية](/ar/automation/hooks) بدلا من ذلك عندما تريد سكربت
`HOOK.md` صغيرا مثبّتا بواسطة المشغّل لأحداث الأوامر وGateway مثل
`/new` أو `/reset` أو `/stop` أو `agent:bootstrap` أو `gateway:startup`.

## البدء السريع

سجّل خطافات Plugin المعرّفة بالأنواع باستخدام `api.on(...)` من نقطة دخول Plugin لديك:

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

تعمل معالجات الخطافات بالتتابع حسب `priority` تنازليا. تحتفظ الخطافات ذات الأولوية نفسها
بترتيب التسجيل.

يقبل `api.on(name, handler, opts?)` ما يلي:

- `priority` - ترتيب المعالج (الأعلى يعمل أولا).
- `timeoutMs` - ميزانية اختيارية لكل خطاف. عند ضبطها، يوقف مشغّل الخطافات ذلك
  المعالج بعد انقضاء الميزانية ويتابع مع التالي، بدلا من السماح للإعداد البطيء
  أو عمل الاستدعاء باستهلاك مهلة النموذج المضبوطة لدى المستدعي. احذفها لاستخدام
  مهلة الملاحظة/القرار الافتراضية التي يطبّقها مشغّل الخطافات بشكل عام.

يمكن للمشغّلين أيضا ضبط ميزانيات الخطافات دون تعديل كود Plugin:

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
`api.on(..., { timeoutMs })` التي ألّفها Plugin. يجب أن تكون كل قيمة مضبوطة
عددا صحيحا موجبا لا يزيد عن 600000 مللي ثانية. فضّل التجاوزات الخاصة بكل خطاف
للخطافات المعروفة ببطئها حتى لا يحصل Plugin واحد على ميزانية أطول في كل مكان.

يتلقى كل خطاف `event.context.pluginConfig`، وهي الإعدادات المحلولة للـ Plugin
الذي سجّل ذلك المعالج. استخدمها لقرارات الخطاف التي تحتاج خيارات Plugin الحالية؛
يحقنها OpenClaw لكل معالج دون تغيير كائن الحدث المشترك الذي تراه Plugins الأخرى.

## كتالوج الخطافات

تُجمّع الخطافات حسب السطح الذي توسّعه. الأسماء المكتوبة بخط **عريض** تقبل
نتيجة قرار (حظر أو إلغاء أو تجاوز أو طلب موافقة)؛ وكل ما عداها مخصص للملاحظة فقط.

**دورة الوكيل**

- `before_model_resolve` - تجاوز المزوّد أو النموذج قبل تحميل رسائل الجلسة
- `agent_turn_prepare` - استهلاك حقنات دورة Plugin المصطفة وإضافة سياق للدورة نفسها قبل خطافات المطالبة
- `before_prompt_build` - إضافة سياق ديناميكي أو نص مطالبة نظام قبل استدعاء النموذج
- `before_agent_start` - مرحلة مدمجة للتوافق فقط؛ فضّل الخطافين أعلاه
- **`before_agent_run`** - فحص المطالبة النهائية ورسائل الجلسة قبل إرسالها إلى النموذج وحظر التشغيل اختياريا
- **`before_agent_reply`** - اختصار دورة النموذج برد اصطناعي أو صمت
- **`before_agent_finalize`** - فحص الإجابة النهائية الطبيعية وطلب تمريرة نموذج إضافية
- `agent_end` - مراقبة الرسائل النهائية، وحالة النجاح، ومدة التشغيل
- `heartbeat_prompt_contribution` - إضافة سياق خاص بـ Heartbeat فقط لـ Plugins مراقبة الخلفية ودورة الحياة

**ملاحظة المحادثة**

- `model_call_started` / `model_call_ended` - مراقبة بيانات وصفية منقّحة لاستدعاء المزوّد/النموذج، والتوقيت، والنتيجة، وتجزئات معرف الطلب المحدودة دون محتوى المطالبة أو الاستجابة
- `llm_input` - مراقبة مدخلات المزوّد (مطالبة النظام، المطالبة، السجل)
- `llm_output` - مراقبة مخرجات المزوّد، والاستخدام، وقيمة `contextTokenBudget` المحلولة عند توفرها

**الأدوات**

- **`before_tool_call`** - إعادة كتابة معاملات الأداة، أو حظر التنفيذ، أو طلب الموافقة
- `after_tool_call` - مراقبة نتائج الأدوات، والأخطاء، والمدة
- `resolve_exec_env` - إسهام متغيرات بيئة مملوكة للـ Plugin إلى `exec`
- **`tool_result_persist`** - إعادة كتابة رسالة المساعد الناتجة من نتيجة أداة
- **`before_message_write`** - فحص أو حظر كتابة رسالة قيد التنفيذ (نادر)

**الرسائل والتسليم**

- **`inbound_claim`** - المطالبة برسالة واردة قبل توجيه الوكيل (ردود اصطناعية)
- `message_received` — مراقبة المحتوى الوارد، والمرسل، والسلسلة، والبيانات الوصفية
- **`message_sending`** — إعادة كتابة المحتوى الصادر أو إلغاء التسليم
- **`reply_payload_sending`** — تعديل أو إلغاء حمولات الرد المطبّعة قبل التسليم
- `message_sent` — مراقبة نجاح التسليم الصادر أو فشله
- **`before_dispatch`** - فحص أو إعادة كتابة إرسال صادر قبل تسليمه إلى القناة
- **`reply_dispatch`** - المشاركة في مسار إرسال الرد النهائي

**الجلسات وCompaction**

- `session_start` / `session_end` - تتبع حدود دورة حياة الجلسة. تكون قيمة `reason` في الحدث واحدة من `new` أو `reset` أو `idle` أو `daily` أو `compaction` أو `deleted` أو `shutdown` أو `restart` أو `unknown`. تُطلق قيمتا `shutdown` و`restart` من منهي إيقاف Gateway عندما تتوقف العملية أو يعاد تشغيلها بينما لا تزال الجلسات نشطة، حتى تتمكن Plugins اللاحقة (مثل مخازن الذاكرة أو النصوص) من إنهاء الصفوف الشبحية التي كانت ستبقى بخلاف ذلك في حالة مفتوحة عبر عمليات إعادة التشغيل. المنهي محدود بحيث لا يستطيع Plugin بطيء حظر SIGTERM/SIGINT.
- `before_compaction` / `after_compaction` - مراقبة دورات Compaction أو التعليق عليها
- `before_reset` - مراقبة أحداث إعادة ضبط الجلسة (`/reset`، عمليات إعادة الضبط البرمجية)

**الوكلاء الفرعيون**

- `subagent_spawned` / `subagent_ended` - مراقبة إطلاق الوكيل الفرعي واكتماله.
- `subagent_delivery_target` - خطاف توافق لتسليم الإكمال عندما لا يستطيع ربط جلسة أساسي إسقاط مسار.
- `subagent_spawning` - خطاف توافق مهمل. يجهّز الأساس الآن ارتباطات الوكيل الفرعي `thread: true` عبر محولات ربط جلسات القنوات قبل إطلاق `subagent_spawned`.
- يتضمن `subagent_spawned` القيمتين `resolvedModel` و`resolvedProvider` عندما يكون OpenClaw قد حل النموذج الأصلي للجلسة الفرعية قبل الإطلاق.
- يحمل `subagent_ended` القيم `targetSessionKey` (الهوية — وهذا يطابق `subagent_spawned.childSessionKey`)، و`targetKind` (`"subagent"` أو `"acp"`)، و`reason`، و`outcome` اختيارية (`"ok"` أو `"error"` أو `"timeout"` أو `"killed"` أو `"reset"` أو `"deleted"`)، و`error` اختيارية، و`runId`، و`endedAt`، و`accountId`، و`sendFarewell`. لا يتضمن **`agentId`** أو `childSessionKey`؛ استخدم `targetSessionKey` لربطه بحدث `subagent_spawned` المقابل.

**دورة الحياة**

- `gateway_start` / `gateway_stop` - بدء أو إيقاف الخدمات المملوكة للـ Plugin مع Gateway
- `deactivate` - اسم بديل مهمل للتوافق مع `gateway_stop`؛ استخدم `gateway_stop` في Plugins الجديدة
- `cron_changed` - مراقبة تغييرات دورة حياة Cron المملوكة لـ Gateway (مضاف، محدّث، محذوف، بدأ، انتهى، مجدول)
- **`before_install`** - فحص مادة تثبيت Skills أو Plugin المرحلية من وقت تشغيل
  Plugin محمّل

## تصحيح أخطاء خطافات وقت التشغيل

استخدم `before_model_resolve` عندما يحتاج Plugin إلى تبديل المزوّد أو النموذج
لدورة وكيل. يعمل قبل حل النموذج؛ ولا يعمل `llm_output` إلا بعد أن تنتج
محاولة نموذج مخرجات مساعد.

لإثبات نموذج الجلسة الفعّال، افحص تسجيلات وقت التشغيل، ثم استخدم
`openclaw sessions` أو أسطح جلسة/حالة Gateway. عند تصحيح أخطاء
حمولات المزوّد، ابدأ Gateway باستخدام `--raw-stream` و
`--raw-stream-path <path>`؛ تكتب هذه العلامات أحداث تدفق النموذج الخام إلى ملف
jsonl.

## سياسة استدعاء الأدوات

يتلقى `before_tool_call` ما يلي:

- `event.toolName`
- `event.params`
- `event.toolKind` و`event.toolInputKind` اختياريتان، وهما مميّزات موثوقة من المضيف
  للأدوات التي تشترك في الأسماء عمدا؛ على سبيل المثال، تستخدم استدعاءات
  `exec` في وضع الكود الخارجي `toolKind: "code_mode_exec"` وتتضمن
  `toolInputKind: "javascript" | "typescript"` عندما تكون لغة الإدخال
  معروفة
- `event.derivedPaths` اختيارية، وتحتوي تلميحات مسارات أهداف مستنتجة من المضيف بأفضل جهد
  لأغلفة الأدوات المعروفة مثل `apply_patch`؛ عند وجودها،
  قد تكون هذه المسارات غير مكتملة أو قد تبالغ في تقدير ما ستلمسه الأداة
  فعليا (على سبيل المثال، مع مدخلات مشوهة أو جزئية)
- `event.runId` اختياري
- `event.toolCallId` اختياري
- حقول سياق مثل `ctx.agentId` و`ctx.sessionKey` و`ctx.sessionId`
  و`ctx.runId` و`ctx.jobId` (مضبوطة في التشغيلات المدفوعة بـ Cron)،
  و`ctx.toolKind` و`ctx.toolInputKind` و`ctx.trace` التشخيصية

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
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

سلوك حارس الخطاف لخطافات دورة الحياة المعرّفة بالأنواع:

- `block: true` نهائي ويتخطى المعالجات ذات الأولوية الأدنى.
- `block: false` يُعامل كأنه لا يوجد قرار.
- تعيد `params` كتابة معاملات الأداة للتنفيذ.
- يوقف `requireApproval` تشغيل الوكيل مؤقتا ويطلب من المستخدم عبر موافقات Plugin.
  يمكن لأمر `/approve` الموافقة على موافقات exec وPlugin كليهما.
  في مرحلات `PreToolUse` الأصلية لوضع تقرير خادم تطبيق Codex، يؤجل ذلك
  إلى طلب موافقة خادم التطبيق المطابق؛ راجع [وقت تشغيل حاضنة Codex](/ar/plugins/codex-harness-runtime#hook-boundaries).
- لا يزال بإمكان `block: true` ذي أولوية أدنى الحظر بعد أن يطلب خطاف ذو أولوية أعلى
  الموافقة.
- يتلقى `onResolution` قرار الموافقة المحلول - `allow-once`،
  `allow-always`، أو `deny`، أو `timeout`، أو `cancelled`.

راجع [طلبات أذونات Plugin](/ar/plugins/plugin-permission-requests) لمعرفة
توجيه الموافقات، وسلوك القرار، ومتى تستخدم `requireApproval` بدلا
من الأدوات الاختيارية أو موافقات exec.

يمكن لـ Plugins التي تحتاج سياسة على مستوى المضيف تسجيل سياسات أدوات موثوقة باستخدام
`api.registerTrustedToolPolicy(...)`. تعمل هذه قبل خطافات
`before_tool_call` العادية وقبل قرارات الخطافات العادية. تعمل السياسات الموثوقة
المضمّنة أولا؛ وتعمل سياسات Plugins المثبّتة الموثوقة بعدها بترتيب تحميل Plugin؛
وتعمل خطافات `before_tool_call` العادية بعدها. تحتفظ Plugins المضمّنة
بمسار السياسة الموثوقة الحالي. يجب تمكين Plugins المثبّتة صراحة
والتصريح عن كل معرف سياسة في `contracts.trustedToolPolicies`؛ وتُرفض المعرفات
غير المصرح بها قبل التسجيل. تُنطاق معرفات السياسات إلى Plugin المسجّل،
لذلك قد تعيد Plugins مختلفة استخدام المعرف المحلي نفسه. استخدم هذه الطبقة فقط
للبوابات الموثوقة من المضيف مثل سياسة مساحة العمل، أو فرض الميزانية، أو
سلامة سير العمل المحجوز.

### خطاف بيئة exec

يتيح `resolve_exec_env` للـ Plugins الإسهام بمتغيرات بيئة إلى استدعاءات أداة
`exec` بعد بناء بيئة exec الأساسية وقبل تشغيل الأمر. يتلقى:

- `event.sessionKey`
- `event.toolName`، حاليا دائما `"exec"`
- `event.host`، واحدة من `"gateway"` أو `"sandbox"` أو `"node"`
- حقول سياق مثل `ctx.agentId` و`ctx.sessionKey`
  و`ctx.messageProvider` و`ctx.channelId`

أرجع `Record<string, string>` لدمجه في بيئة exec. تعمل المعالجات
بترتيب الأولوية، وتتجاوز نتائج الخطافات اللاحقة نتائج الخطافات السابقة
للمفتاح نفسه.

تُرشَّح مخرجات الخطاف عبر سياسة مفاتيح بيئة تنفيذ المضيف قبل
دمجها. تُسقَط المفاتيح غير الصالحة، و`PATH`، ومفاتيح تجاوز المضيف الخطرة مثل
`LD_*` و`DYLD_*` و`NODE_OPTIONS` ومتغيرات الوكيل ومتغيرات تجاوز TLS.
تُضمَّن بيئة Plugin بعد الترشيح في بيانات تعريف موافقة/تدقيق Gateway
وتُمرَّر إلى طلبات تنفيذ node-host.

### استمرارية نتائج الأدوات

يمكن أن تتضمن نتائج الأدوات `details` منظمة لعرض واجهة المستخدم، أو التشخيص،
أو توجيه الوسائط، أو بيانات تعريف يملكها Plugin. تعامَل مع `details` كبيانات تعريف وقت تشغيل،
وليس كمحتوى مطالبة:

- يزيل OpenClaw `toolResult.details` قبل إعادة تشغيل المزوّد وإدخال Compaction
  حتى لا تصبح بيانات التعريف سياقًا للنموذج.
- تحتفظ إدخالات الجلسات المستمرة فقط بـ `details` محدودة. تُستبدَل التفاصيل كبيرة الحجم
  بملخص موجز و`persistedDetailsTruncated: true`.
- يعمل `tool_result_persist` و`before_message_write` قبل الحد النهائي
  للاستمرارية. ومع ذلك، ينبغي للخطافات إبقاء `details` المُعادة صغيرة وتجنب
  وضع نص متعلق بالمطالبة في `details` فقط؛ ضع مخرجات الأداة المرئية للنموذج
  في `content`.

## خطافات المطالبات والنماذج

استخدم الخطافات الخاصة بالمرحلة للـ plugins الجديدة:

- `before_model_resolve`: يتلقى المطالبة الحالية وبيانات تعريف المرفقات فقط.
  أعِد `providerOverride` أو `modelOverride`.
- `agent_turn_prepare`: يتلقى المطالبة الحالية، ورسائل الجلسة المُحضَّرة،
  وأي حقنات مصفوفة للاستخدام مرة واحدة بالضبط تم تفريغها لهذه الجلسة. أعِد
  `prependContext` أو `appendContext`.
- `before_prompt_build`: يتلقى المطالبة الحالية ورسائل الجلسة.
  أعِد `prependContext` أو `appendContext` أو `systemPrompt`
  أو `prependSystemContext` أو `appendSystemContext`.
- `heartbeat_prompt_contribution`: يعمل فقط لدورات Heartbeat ويعيد
  `prependContext` أو `appendContext`. وهو مخصص للمراقبات الخلفية
  التي تحتاج إلى تلخيص الحالة الحالية دون تغيير الدورات التي يبدأها المستخدم.

يبقى `before_agent_start` للتوافق. فضّل الخطافات الصريحة أعلاه
حتى لا يعتمد Plugin الخاص بك على مرحلة مدمجة قديمة.

يعمل `before_agent_run` بعد إنشاء المطالبة وقبل أي إدخال للنموذج،
بما في ذلك تحميل الصور المحلية للمطالبة وملاحظة `llm_input`. يتلقى
إدخال المستخدم الحالي باسم `prompt`، بالإضافة إلى سجل الجلسة المُحمّل في `messages`
والمطالبة النظامية النشطة. أعِد `{ outcome: "block", reason, message? }`
لإيقاف التشغيل قبل أن يتمكن النموذج من قراءة المطالبة. `reason` داخلي؛
و`message` هو البديل المعروض للمستخدم. النتائج الوحيدة المدعومة هي
`pass` و`block`؛ أشكال القرار غير المدعومة تفشل مغلقة.

عندما يُحظَر تشغيل، يخزن OpenClaw نص الاستبدال فقط في
`message.content` بالإضافة إلى بيانات تعريف حظر غير حساسة مثل معرّف Plugin
الحاظر والطابع الزمني. لا يُحتفَظ بنص المستخدم الأصلي في النص المنسوخ أو السياق المستقبلي.
تُعامل أسباب الحظر الداخلية كحساسة وتُستبعد من حمولات
النص المنسوخ والسجل والبث والسجلات والتشخيصات. ينبغي للملاحظة التشغيلية
استخدام حقول مُنقّاة مثل معرّف الحاظر، أو النتيجة، أو الطابع الزمني، أو فئة آمنة.

يتضمن `before_agent_start` و`agent_end` القيمة `event.runId` عندما يستطيع OpenClaw
تحديد التشغيل النشط. وتتوفر القيمة نفسها أيضًا في `ctx.runId`.
تعرض عمليات التشغيل المدفوعة بواسطة Cron أيضًا `ctx.jobId` (معرّف مهمة cron الأصلية) حتى
تتمكن خطافات Plugin من تحديد نطاق المقاييس أو الآثار الجانبية أو الحالة لمهمة مجدولة محددة.

بالنسبة إلى عمليات التشغيل الناشئة من قناة، يحدد `ctx.channel` و`ctx.messageProvider`
سطح المزوّد مثل `discord` أو `telegram`، بينما يكون `ctx.channelId`
معرّف هدف المحادثة عندما يستطيع OpenClaw اشتقاقه من مفتاح الجلسة
أو بيانات تعريف التسليم.

عندما تكون هوية المرسل متاحة، تتضمن سياقات خطافات الوكيل أيضًا:

- `ctx.senderId` — معرّف المرسل ضمن نطاق القناة (مثل Feishu `open_id`، ومعرّف مستخدم Discord).
  يُملأ عندما ينشأ التشغيل من رسالة مستخدم ذات بيانات تعريف مرسل معروفة.
- `ctx.chatId` — معرّف المحادثة الأصلي للنقل (مثل Feishu
  `chat_id`، وTelegram `chat_id`). يُملأ عندما توفر القناة الأصلية
  معرّف محادثة أصليًا.
- `ctx.channelContext.sender.id` — معرّف المرسل نفسه مثل `ctx.senderId`، ضمن
  كائن تملكه القناة ويمكن للـ plugins توسيعه بحقول خاصة بالقناة.
- `ctx.channelContext.chat.id` — معرّف المحادثة نفسه مثل `ctx.chatId`، ضمن
  كائن تملكه القناة ويمكن للـ plugins توسيعه بحقول خاصة بالقناة.

يعرّف النواة حقول `id` المتداخلة فقط. يمكن لـ Channel plugins التي تمرر بيانات تعريف
أغنى للمرسل أو الدردشة عبر مساعد الوارد أن توسّع
`PluginHookChannelSenderContext` أو `PluginHookChannelChatContext` من
`openclaw/plugin-sdk/channel-inbound`:

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

تمرر Channel plugins تلك الحقول عبر مساعد SDK الوارد:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

هذه الحقول اختيارية وغائبة عن عمليات التشغيل الناشئة من النظام (heartbeat،
cron، exec-event).

يبقى `ctx.senderExternalId` كحقل توافق مصدر مهجور للـ plugins الأقدم.
لا يملؤه النواة؛ ينبغي لهويات المرسلين الجديدة الخاصة بالقنوات
أن تعيش تحت `ctx.channelContext.sender` من خلال توسيع الوحدة.

`agent_end` هو خطاف ملاحظة. تشغّله مسارات Gateway والحاضنة المستمرة
بنمط إطلاق ونسيان بعد الدورة، بينما تنتظر مسارات CLI قصيرة العمر ذات التشغيل الواحد
وعد الخطاف قبل تنظيف العملية حتى تتمكن plugins الموثوقة من تفريغ
ملاحظات الطرفية أو التقاط الحالة. يطبق مشغّل الخطافات مهلة قدرها 30 ثانية حتى لا
يترك Plugin عالق أو نقطة نهاية تضمين عالقة وعد الخطاف معلقًا
إلى الأبد. تُسجَّل المهلة ويواصل OpenClaw؛ ولا يلغي
عمل الشبكة الذي يملكه Plugin إلا إذا استخدم Plugin أيضًا إشارة الإلغاء الخاصة به.

استخدم `model_call_started` و`model_call_ended` لقياسات استدعاء المزوّد
التي يجب ألا تتلقى المطالبات الخام، أو السجل، أو الردود، أو الرؤوس، أو أجسام الطلبات،
أو معرّفات طلبات المزوّد. تتضمن هذه الخطافات بيانات تعريف مستقرة مثل
`runId` و`callId` و`provider` و`model`، و`api`/`transport` اختياريين، و
`durationMs`/`outcome` النهائية، و`upstreamRequestIdHash` عندما يستطيع OpenClaw اشتقاق
تجزئة محدودة لمعرّف طلب المزوّد. عندما يكون وقت التشغيل قد حسم بيانات تعريف نافذة السياق،
يتضمن حدث الخطاف والسياق أيضًا `contextTokenBudget`، وهي
ميزانية الرموز الفعالة بعد حدود النموذج/الإعداد/الوكيل، بالإضافة إلى
`contextWindowSource` و`contextWindowReferenceTokens` عند تطبيق حد أدنى.

يعمل `before_agent_finalize` فقط عندما تكون الحاضنة على وشك قبول إجابة مساعد نهائية
طبيعية. ليس هذا مسار إلغاء `/stop` ولا يعمل
عندما يجهض المستخدم دورة. أعِد `{ action: "revise", reason }` لطلب
مرور نموذج إضافي واحد من الحاضنة قبل الإنهاء، أو `{ action:
"finalize", reason? }` لفرض الإنهاء، أو احذف النتيجة للمتابعة.
تُمرَّر خطافات Codex الأصلية `Stop` إلى هذا الخطاف كقرارات OpenClaw
`before_agent_finalize`.

عند إرجاع `action: "revise"`، يمكن للـ plugins تضمين بيانات تعريف `retry` لجعل
مرور النموذج الإضافي محدودًا وآمنًا لإعادة التشغيل:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

تُلحَق `instruction` بسبب المراجعة المرسل إلى الحاضنة.
يتيح `idempotencyKey` للمضيف عدّ المحاولات للطلب نفسه من Plugin عبر
قرارات إنهاء مكافئة، ويحد `maxAttempts` من عدد المرورّات الإضافية التي
سيسمح بها المضيف قبل المتابعة بالإجابة النهائية الطبيعية.

يجب على plugins غير المجمعة التي تحتاج إلى خطافات محادثة خام (`before_model_resolve`,
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

يمكن تعطيل الخطافات التي تعدّل المطالبات وحقنات الدور التالي الدائمة لكل Plugin
باستخدام `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### امتدادات الجلسة وحقنات الدور التالي

يمكن لـ Workflow plugins حفظ حالة جلسة صغيرة متوافقة مع JSON باستخدام
`api.registerSessionExtension(...)` وتحديثها عبر طريقة Gateway
`sessions.pluginPatch`. تعرض صفوف الجلسات حالة الامتداد المسجلة
عبر `pluginExtensions`، مما يتيح لـ Control UI والعملاء الآخرين عرض
حالة يملكها Plugin دون معرفة تفاصيله الداخلية.

استخدم `api.enqueueNextTurnInjection(...)` عندما يحتاج Plugin إلى سياق دائم
يصل إلى دورة النموذج التالية مرة واحدة بالضبط. يفرّغ OpenClaw الحقنات المصطفة قبل
خطافات المطالبة، ويسقط الحقنات المنتهية الصلاحية، ويزيل التكرار حسب `idempotencyKey`
لكل Plugin. هذا هو الحد الصحيح لاستئنافات الموافقة، وملخصات السياسات،
وفروق مراقبة الخلفية، واستمرارات الأوامر التي ينبغي أن تكون مرئية
للنموذج في الدورة التالية ولكن لا ينبغي أن تصبح نص مطالبة نظامية دائمًا.

دلالات التنظيف جزء من العقد. تتلقى عمليات تنظيف امتدادات الجلسة
واستدعاءات تنظيف دورة حياة وقت التشغيل `reset` أو `delete` أو `disable` أو
`restart`. يزيل المضيف حالة امتداد الجلسة المستمرة التي يملكها Plugin
وحقنات الدور التالي المعلقة عند reset/delete/disable؛ أما restart فيُبقي
حالة الجلسة الدائمة بينما تتيح استدعاءات التنظيف للـ plugins تحرير مهام المجدول
وسياق التشغيل والموارد الأخرى خارج النطاق لجيل وقت التشغيل القديم.

## خطافات الرسائل

استخدم خطافات الرسائل لتوجيه مستوى القناة وسياسة التسليم:

- `message_received`: يراقب المحتوى الوارد، والمرسل، و`threadId`، و`messageId`,
  و`senderId`، والارتباط الاختياري بالتشغيل/الجلسة، وبيانات التعريف.
- `message_sending`: يعيد كتابة `content` أو يعيد `{ cancel: true }`.
- `reply_payload_sending`: يعيد كتابة كائنات `ReplyPayload` المطبّعة (بما في ذلك
  `presentation` و`delivery` ومراجع الوسائط والنص) أو يعيد `{ cancel: true }`.
- `message_sent`: يراقب النجاح أو الفشل النهائي.

بالنسبة إلى ردود TTS الصوتية فقط، قد يحتوي `content` على النص المنطوق المخفي
حتى عندما لا تحتوي حمولة القناة على نص/تعليق مرئي. إعادة كتابة ذلك
`content` تحدّث النص المنسوخ المرئي للخطاف فقط؛ ولا يُعرض كتعليق
وسائط.

قد تتضمن أحداث `reply_payload_sending` قيمة `usageState`، وهي لقطة حية بأفضل جهد
لكل دورة للنموذج/الاستخدام/السياق. التسليم الدائم، وإعادة التشغيل المستعادة، والردود
دون ارتباط تشغيل دقيق تحذفها.

تعرض سياقات خطافات الرسائل حقول ارتباط مستقرة عند توفرها:
`ctx.sessionKey` و`ctx.runId` و`ctx.messageId` و`ctx.senderId` و`ctx.trace`
و`ctx.traceId` و`ctx.spanId` و`ctx.parentSpanId` و`ctx.callDepth`. كما تعرض سياقات الوارد
و`before_dispatch` بيانات تعريف الرد عندما تكون لدى القناة بيانات رسالة مقتبسة
مرشحة حسب الرؤية: `replyToId` و`replyToIdFull` و
`replyToBody` و`replyToSender` و`replyToIsQuote`. فضّل هذه
الحقول من الدرجة الأولى قبل قراءة بيانات التعريف القديمة.

فضّل حقلي `threadId` و`replyToId` المطبوعين قبل استخدام بيانات تعريف
خاصة بالقناة.

قواعد القرار:

- يكون `message_sending` مع `cancel: true` نهائيًا.
- يُعامَل `message_sending` مع `cancel: false` كأنه بلا قرار.
- يواصل `content` المعاد كتابته المرور إلى الخطافات الأقل أولوية ما لم يلغِ خطاف لاحق
  التسليم.
- يعمل `reply_payload_sending` بعد تطبيع الحمولة وقبل تسليم القناة، بما في ذلك الردود الموجَّهة عائدةً إلى القناة الأصلية. تعمل المعالجات
  بالتتابع، ويرى كل معالج أحدث حمولة أنتجتها
  المعالجات الأعلى أولوية.
- لا تكشف حمولات `reply_payload_sending` علامات الثقة في وقت التشغيل مثل
  `trustedLocalMedia`؛ يمكن للـ plugins تعديل شكل الحمولة لكنها لا تستطيع منح الثقة في الوسائط
  المحلية.
- يمكن أن يعيد `message_sending` قيمة `cancelReason` و`metadata` محدودة مع
  الإلغاء. تعرض واجهات API الجديدة لدورة حياة الرسائل ذلك كنتيجة تسليم مكبوتة
  بالسبب `cancelled_by_message_sending_hook`؛ ويستمر التسليم المباشر القديم في
  إعادة مصفوفة نتائج فارغة للتوافق.
- `message_sent` مخصص للمراقبة فقط. تُسجَّل إخفاقات المعالج ولا
  تغيّر نتيجة التسليم.

## خطافات التثبيت

استخدم `security.installPolicy` لقرارات السماح/الحظر التي يملكها المشغّل. تعمل
تلك السياسة من إعداد OpenClaw، وتغطي مسارات تثبيت CLI وتحديثه، وتفشل
مغلقة عند تفعيلها وعدم توفرها.

`before_install` هو خطاف دورة حياة في وقت تشغيل الـ plugin. يعمل بعد
`security.installPolicy` فقط في عملية OpenClaw التي تكون خطافات الـ plugin فيها
قد حُمّلت بالفعل، مثل تدفقات التثبيت المدعومة من Gateway. وهو مفيد
للملاحظات والتحذيرات وفحوصات التوافق التي يملكها الـ plugin، لكنه ليس
الحد الأمني الأساسي للمؤسسة أو المضيف في عمليات التثبيت. يبقى الحقل `builtinScan`
في حمولة الحدث للتوافق، لكن OpenClaw لم يعد
يشغّل حظر الشيفرات الخطرة المدمج في وقت التثبيت، لذلك يكون نتيجة `ok`
فارغة. أعد نتائج إضافية أو `{ block: true, blockReason }` لإيقاف
التثبيت في تلك العملية.

`block: true` نهائي. يُعامَل `block: false` كأنه بلا قرار.
تحظر إخفاقات المعالج التثبيت بفشل مغلق.

## دورة حياة Gateway

استخدم `gateway_start` لخدمات الـ plugin التي تحتاج إلى حالة يملكها Gateway. يكشف
السياق `ctx.config` و`ctx.workspaceDir` و`ctx.getCron?.()` لفحص
Cron وتحديثاته. استخدم `gateway_stop` لتنظيف الموارد طويلة التشغيل.

لا تعتمد على خطاف `gateway:startup` الداخلي للخدمات وقت التشغيل التي يملكها الـ plugin.

ينطلق `cron_changed` لأحداث دورة حياة Cron التي يملكها Gateway مع حمولة
حدث نمطية تغطي أسباب `added` و`updated` و`removed` و`started` و`finished`
و`scheduled`. يحمل الحدث لقطة `PluginHookGatewayCronJob`
(بما في ذلك `state.nextRunAtMs` و`state.lastRunStatus` و
`state.lastError` عند وجودها) إضافةً إلى `PluginHookGatewayCronDeliveryStatus`
بقيمة `not-requested` | `delivered` | `not-delivered` | `unknown`. لا تزال
أحداث الإزالة تحمل لقطة المهمة المحذوفة حتى تتمكن المجدولات الخارجية من
مطابقة الحالة. استخدم `ctx.getCron?.()` و`ctx.config` من سياق وقت التشغيل
عند مزامنة مجدولات الإيقاظ الخارجية، واجعل OpenClaw
مصدر الحقيقة لفحوصات الاستحقاق والتنفيذ.

## الإهمالات القادمة

بعض الأسطح المجاورة للخطافات مهملة لكنها لا تزال مدعومة. انتقل
قبل الإصدار الرئيسي التالي:

- **أغلفة القنوات بالنص الصريح** في معالجات `inbound_claim` و`message_received`.
  اقرأ `BodyForAgent` وكتل سياق المستخدم المنظمة
  بدلًا من تحليل نص الغلاف المسطح. راجع
  [أغلفة القنوات بالنص الصريح → BodyForAgent](/ar/plugins/sdk-migration#active-deprecations).
- يبقى **`before_agent_start`** للتوافق. يجب على الـ plugins الجديدة استخدام
  `before_model_resolve` و`before_prompt_build` بدلًا من المرحلة
  المدمجة.
- يبقى **`subagent_spawning`** للتوافق مع الـ plugins الأقدم، لكن
  يجب ألا تعيد الـ plugins الجديدة توجيه الخيوط منه. يجهز Core
  ارتباطات الوكلاء الفرعيين `thread: true` عبر محولات ربط جلسات القنوات
  قبل انطلاق `subagent_spawned`.
- يبقى **`deactivate`** كاسم توافق بديل مهمل للتنظيف حتى
  ما بعد 2026-08-16. يجب على الـ plugins الجديدة استخدام `gateway_stop`.
- يستخدم **`onResolution` في `before_tool_call`** الآن اتحاد
  `PluginApprovalResolution` النمطي (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) بدلًا من `string` حر الصياغة.

للاطلاع على القائمة الكاملة - تسجيل قدرة الذاكرة، وملف تفكير المزوّد،
ومزوّدي المصادقة الخارجيين، وأنواع اكتشاف المزوّد، وموصّلات وقت تشغيل المهام،
وإعادة التسمية من `command-auth` إلى `command-status` - راجع
[ترحيل Plugin SDK → الإهمالات النشطة](/ar/plugins/sdk-migration#active-deprecations).

## ذو صلة

- [ترحيل Plugin SDK](/ar/plugins/sdk-migration) - الإهمالات النشطة والجدول الزمني للإزالة
- [بناء plugins](/ar/plugins/building-plugins)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints)
- [الخطافات الداخلية](/ar/automation/hooks)
- [داخليات بنية Plugin](/ar/plugins/architecture-internals)
