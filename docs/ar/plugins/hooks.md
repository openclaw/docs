---
read_when:
    - أنت تبني Plugin يحتاج إلى خطافات before_tool_call أو before_agent_reply أو خطافات الرسائل أو خطافات دورة الحياة
    - تحتاج إلى حظر استدعاءات الأدوات من Plugin أو إعادة كتابتها أو اشتراط الموافقة عليها
    - أنت تقرر بين الخطافات الداخلية وخطافات الإضافات
    - أنت تُسقِط عمليات تنبيه Cron في OpenClaw على مجدول مضيف خارجي
summary: 'خطافات Plugin: اعتراض أحداث دورة حياة الوكيل والأداة والرسالة والجلسة وGateway'
title: خطافات Plugin
x-i18n:
    generated_at: "2026-07-16T14:26:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9e4e94220bca59b710b7b46c87bb889942c88b0d44f723e7133f271d34d9c929
    source_path: plugins/hooks.md
    workflow: 16
---

نقاط ربط Plugin هي نقاط توسيع داخل العملية لإضافات OpenClaw: لفحص عمليات تشغيل الوكيل أو
تغييرها، واستدعاءات الأدوات، وتدفق الرسائل، ودورة حياة الجلسة، وتوجيه الوكلاء الفرعيين،
وعمليات التثبيت، أو بدء تشغيل Gateway.

استخدم [نقاط الربط الداخلية](/ar/automation/hooks) بدلاً من ذلك لبرنامج نصي صغير يثبّته المشغّل
`HOOK.md` ويتفاعل مع أحداث الأوامر وGateway مثل `/new`،
`/reset`، أو `/stop`، أو `agent:bootstrap`، أو `gateway:startup`.

## البدء السريع

سجّل نقاط الربط ذات الأنواع باستخدام `api.on(...)` من نقطة دخول Plugin:

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
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

تُشغَّل المعالجات التي يمكنها إرجاع قرارات أو تعديلات تسلسليًا وفق
ترتيب `priority` التنازلي؛ وتحافظ المعالجات ذات الأولوية نفسها على ترتيب التسجيل.
تُشغَّل معالجات المراقبة فقط بالتوازي، ويمكن لعمليات إرسال المراقبة
التي لا تنتظر نتيجة أن تتداخل مع الأحداث اللاحقة. لا تستخدم الأولوية لترتيب
الآثار الجانبية للمراقبة.

يقبل `api.on(name, handler, opts?)` ما يلي:

| الخيار      | التأثير                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | الترتيب؛ تُشغَّل القيمة الأعلى أولاً.                                                                                                                                                                      |
| `timeoutMs` | مهلة الانتظار لكل نقطة ربط. عند انتهائها، يتوقف OpenClaw عن انتظار ذلك المعالج وينتقل إلى التالي. ولا يؤدي ذلك إلى إلغاء المعالج أو آثاره الجانبية. احذفه لاستخدام مهلة المشغّل الافتراضية لكل نقطة ربط. |

يمكن للمشغّلين تعيين مهل نقاط الربط من دون تعديل شيفرة Plugin:

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

يتجاوز `hooks.timeouts.<hookName>` القيمة `hooks.timeoutMs`، والتي تتجاوز بدورها
قيمة `api.on(..., { timeoutMs })` التي يحددها مؤلف Plugin. يجب أن تكون كل قيمة
عددًا صحيحًا موجبًا لا يتجاوز 600000 ms. فضّل التجاوزات الخاصة بكل نقطة ربط لنقاط
الربط المعروفة ببطئها حتى لا يحصل Plugin واحد على مهلة أطول في كل المواضع.

يستمر وعد المعالج الذي انتهت مهلته في العمل لأن استدعاءات نقاط الربط لا
تتلقى إشارة إلغاء. ويمكن لعملية إرسال نقطة الربط تحرير سماح الدخول إلى Gateway
بينما لا يزال عمل ذلك Plugin قيد التنفيذ. يجب على الإضافات التي تملك
أعمالاً طويلة التشغيل توفير دورة حياة الإلغاء وإيقاف التشغيل الخاصة بها.

تستخدم نقاط الربط المعدِّلة الصادرة `message_sending` و`reply_payload_sending`
مهلة افتراضية مقدارها 15 ثانية لكل معالج. إذا انتهت مهلة أحدها، يسجّل OpenClaw خطأ Plugin
ويتابع باستخدام أحدث حمولة حتى يستقر مسار التسليم التسلسلي.
عيّن مهلة أكبر لكل نقطة ربط للإضافات التي تنفذ عمدًا عملاً أبطأ
قبل التسليم.

يمكن لإضافات القنوات التي تستخدم `createReplyDispatcher` كذلك إعلان مهلة موجبة أكبر
لكل مرحلة باستخدام `beforeDeliverOptions: { timeoutMs }`، أو عند
إلحاق عمل باستخدام `dispatcher.appendBeforeDeliver(handler, { timeoutMs })`.
من دون مهلة يعلنها المالك، تستخدم عمليات الاستدعاء تلك المهلة الافتراضية نفسها
البالغة 15 ثانية حتى لا تحتفظ عملية استدعاء عالقة بمسار التسليم التسلسلي.

تتلقى كل نقطة ربط `event.context.pluginConfig`، وهي الإعدادات المحلولة
لـPlugin الذي سجّل ذلك المعالج. يحقنها OpenClaw لكل معالج من دون
تعديل كائن الحدث المشترك الذي تراه الإضافات الأخرى.

## فهرس نقاط الربط

تُجمّع نقاط الربط حسب السطح الذي توسّعه. تقبل الأسماء **بالخط العريض** نتيجة قرار
(الحظر أو الإلغاء أو التجاوز أو طلب الموافقة)؛ أما البقية فهي
للمراقبة فقط.

**دورة الوكيل**

| نقطة الربط                            | الغرض                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `before_model_resolve`          | تجاوز المزوّد أو النموذج قبل تحميل رسائل الجلسة                                  |
| `agent_turn_prepare`            | استهلاك عمليات حقن دورة Plugin الموضوعة في قائمة الانتظار وإضافة سياق للدورة نفسها قبل نقاط ربط الموجّه      |
| `before_prompt_build`           | إضافة سياق ديناميكي أو نص موجّه النظام قبل استدعاء النموذج                          |
| `before_agent_start`            | مرحلة مجمّعة للتوافق فقط؛ فضّل نقطتي الربط أعلاه                            |
| **`before_agent_run`**          | فحص الموجّه النهائي ورسائل الجلسة قبل الإرسال إلى النموذج؛ ويمكنه حظر التشغيل |
| **`before_agent_reply`**        | إنهاء دورة النموذج مبكرًا برد اصطناعي أو بصمت                           |
| **`before_agent_finalize`**     | فحص الإجابة النهائية الطبيعية وطلب مرور إضافي واحد للنموذج                         |
| `agent_end`                     | مراقبة الرسائل النهائية وحالة النجاح ومدة التشغيل                                  |
| `heartbeat_prompt_contribution` | إضافة سياق خاص بـHeartbeat لإضافات مراقبة الخلفية ودورة الحياة                  |

**مراقبة المحادثة**

| نقطة الربط                                      | الغرض                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `model_call_started` / `model_call_ended` | بيانات وصفية منقّحة لاستدعاء المزوّد/النموذج: التوقيت والنتيجة وتجزئات معرّفات الطلبات المحدودة. من دون محتوى الموجّه أو الاستجابة. |
| `llm_input`                               | إدخال المزوّد: موجّه النظام والموجّه والسجل                                                                     |
| `llm_output`                              | مخرجات المزوّد والاستخدام و`contextTokenBudget` المحلول عند توفره                                       |

**الأدوات**

| نقطة الربط                       | الغرض                                                   |
| -------------------------- | --------------------------------------------------------- |
| **`before_tool_call`**     | إعادة كتابة معاملات الأداة أو حظر التنفيذ أو طلب الموافقة |
| `after_tool_call`          | مراقبة نتائج الأدوات والأخطاء والمدة                |
| `resolve_exec_env`         | المساهمة بمتغيرات البيئة المملوكة لـPlugin في `exec`   |
| **`tool_result_persist`**  | إعادة كتابة رسالة المساعد الناتجة من نتيجة أداة |
| **`before_message_write`** | فحص عملية كتابة رسالة قيد التنفيذ أو حظرها (نادر)      |

**الرسائل والتسليم**

| نقطة الربط                            | الغرض                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| **`inbound_claim`**             | تولّي رسالة واردة قبل توجيه الوكيل (ردود اصطناعية) |
| **`channel_pairing_requested`** | مراقبة طلبات إقران الرسائل المباشرة المنشأة حديثًا                         |
| `message_received`              | مراقبة المحتوى الوارد والمرسل وسلسلة المحادثة والبيانات الوصفية             |
| **`message_sending`**           | إعادة كتابة المحتوى الصادر أو إلغاء التسليم                       |
| **`reply_payload_sending`**     | تعديل حمولات الرد الموحّدة أو إلغاؤها قبل التسليم        |
| `message_sent`                  | مراقبة نجاح التسليم الصادر أو فشله                      |
| **`before_dispatch`**           | فحص عملية إرسال صادرة أو إعادة كتابتها قبل تسليمها إلى القناة    |
| **`reply_dispatch`**            | المشاركة في مسار إرسال الرد النهائي                  |

**الجلسات وCompaction**

| نقطة الربط                                     | الغرض                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | تتبّع حدود دورة حياة الجلسة. تكون `reason` واحدة من `new`، أو `reset`، أو `idle`، أو `daily`، أو `compaction`، أو `deleted`، أو `shutdown`، أو `restart`، أو `unknown`. تنطلق `shutdown`/`restart` من أداة الإنهاء النهائية لإيقاف Gateway عندما تتوقف العملية أو يُعاد تشغيلها مع وجود جلسات نشطة، بحيث يمكن للإضافات (الذاكرة ومخازن النصوص المنسوخة) إنهاء الصفوف الوهمية بدلاً من تركها مفتوحة عبر عمليات إعادة التشغيل. أداة الإنهاء النهائية محدودة زمنيًا حتى لا يتمكن Plugin بطيء من حظر SIGTERM/SIGINT. |
| `before_compaction` / `after_compaction` | مراقبة دورات Compaction أو إضافة تعليقات توضيحية إليها                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `before_reset`                           | مراقبة أحداث إعادة ضبط الجلسة (`/reset`، عمليات إعادة الضبط البرمجية)                                                                                                                                                                                                                                                                                                                                                                                                     |

**الوكلاء الفرعيون**

- `subagent_spawned` / `subagent_ended` - راقب تشغيل الوكيل الفرعي واكتماله.
- `subagent_delivery_target` - خطاف توافق لتسليم الإكمال عندما يتعذر على أي ربط جلسة أساسي إسقاط مسار.
- `subagent_spawning` - خطاف توافق مهمل. يُعِدّ النظام الأساسي الآن روابط الوكيل الفرعي `thread: true` عبر محوّلات ربط جلسة القناة قبل إطلاق `subagent_spawned`.
- يتضمن `subagent_spawned` كلًا من `resolvedModel` و`resolvedProvider` عندما يكون OpenClaw قد حدّد النموذج الأصلي للجلسة التابعة قبل التشغيل.
- يحمل `subagent_ended` القيم `targetSessionKey` (الهوية - تطابق `subagent_spawned.childSessionKey`)، و`targetKind` (`"subagent"` أو `"acp"`)، و`reason`، و`outcome` الاختيارية (`"ok"` أو `"error"` أو `"timeout"` أو `"killed"` أو `"reset"` أو `"deleted"`)، و`error` الاختيارية، و`runId`، و`endedAt`، و`accountId`، و`sendFarewell`. وهو **لا** يتضمن `agentId` أو `childSessionKey`؛ استخدم `targetSessionKey` لربطه بحدث `subagent_spawned` المطابق.

**دورة الحياة**

| الخطاف                             | الغرض                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | بدء الخدمات التي يملكها Plugin أو إيقافها مع Gateway                                                 |
| `deactivate`                     | اسم مستعار مهمل للتوافق مع `gateway_stop`؛ استخدم `gateway_stop` في Plugins الجديدة                 |
| `cron_reconciled`                | المطابقة مع حالة Cron الكاملة في Gateway بعد بدء التشغيل أو إعادة التحميل                            |
| `cron_changed`                   | مراقبة تغييرات دورة حياة Cron التي يملكها Gateway (أُضيفت، حُدّثت، أُزيلت، بدأت، انتهت، جرى جدولتها) |
| **`before_install`**             | فحص مواد تثبيت Skill أو Plugin المرحلية من بيئة تشغيل Plugin محمّلة                         |

### طلبات إقران القنوات

استخدم `channel_pairing_requested` عندما يحتاج Plugin إلى إشعار مشغّل أو
كتابة سجل تدقيق بعد أن ينشئ مرسل رسالة مباشرة غير مقترن طلب إقران
معلقًا. يُرسَل الخطاف عند إنشاء الطلب؛ ولا يتأخر تسليم القناة لرد
الإقران بسبب بطء معالجات الخطاف أو فشلها.

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `طلب إقران ${event.channel} جديد من ${event.senderId}: ${event.code}`,
  });
});
```

الخطاف مخصص للمراقبة فقط. فهو لا يوافق على رد الإقران ولا يرفضه أو يحجبه أو يعيد
كتابته. تتضمن الحمولة القناة، و`accountId` الاختيارية،
و`senderId` ضمن نطاق القناة، و`code` للإقران، وبيانات القناة الوصفية. تعامل مع
رمز الإقران باعتباره بيانات اعتماد موافقة حية أحادية الاستخدام، ولا تسلّمه إلا إلى
وجهة مشغّل موثوقة. تعامل مع `metadata` باعتباره نص هوية غير موثوق
يوفره المرسل. لا يتضمن الخطاف متن الرسالة الواردة أو الوسائط.

## خطافات تصحيح أخطاء بيئة التشغيل

استخدم `before_model_resolve` لتبديل المزوّد أو النموذج لدورة وكيل - إذ
يعمل قبل تحديد النموذج. لا يعمل `llm_output` إلا بعد أن تنتج محاولة نموذج
مخرجات المساعد.

لإثبات نموذج الجلسة الفعلي، افحص تسجيلات بيئة التشغيل، ثم
استخدم `openclaw sessions` أو واجهات الجلسة/الحالة في Gateway. لتصحيح أخطاء
حمولات المزوّد، شغّل Gateway باستخدام `--raw-stream` و
`--raw-stream-path <path>` لكتابة أحداث تدفق النموذج الخام إلى ملف jsonl.

## سياسة استدعاء الأدوات

يتلقى `before_tool_call` ما يلي:

- `event.toolName`
- `event.params`
- القيمتان الاختياريتان `event.toolKind` و`event.toolInputKind`، وهما
  مُميّزات مرجعية موثوقة من المضيف للأدوات التي تتشارك الأسماء عمدًا؛ فعلى سبيل المثال،
  تستخدم استدعاءات `exec` الخارجية في وضع الشيفرة `toolKind: "code_mode_exec"` وتتضمن
  `toolInputKind: "javascript" | "typescript"` عندما تكون لغة الإدخال
  معروفة
- القيمة الاختيارية `event.derivedPaths`، وهي تلميحات لمسارات الهدف مشتقة من المضيف بأفضل جهد
  لمغلفات الأدوات المعروفة مثل `apply_patch`؛ وقد تكون هذه المسارات
  غير مكتملة أو تقدّر بأكثر مما ستلمسه الأداة فعليًا (على
  سبيل المثال، عند وجود مدخلات مشوهة أو جزئية)
- القيمة الاختيارية `event.runId`
- القيمة الاختيارية `event.toolCallId`
- حقول السياق مثل `ctx.agentId`، و`ctx.sessionKey`، و`ctx.sessionId`،
  و`ctx.runId`، و`ctx.toolKind`، و`ctx.toolInputKind`، وحقل التشخيص `ctx.trace`

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
    /** @deprecated الموافقات غير المحسومة تؤدي دائمًا إلى الرفض. */
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

سلوك الحماية لخطافات دورة الحياة ذات الأنواع المحددة:

- يُعد `block: true` نهائيًا ويتجاوز المعالجات ذات الأولوية الأدنى.
- يُعامل `block: false` على أنه عدم اتخاذ قرار.
- يعيد `params` كتابة معاملات الأداة للتنفيذ.
- يوقف `requireApproval` تشغيل الوكيل مؤقتًا ويطلب من المستخدم عبر
  موافقات Plugin. يمكن لـ `/approve` الموافقة على كل من موافقات التنفيذ وموافقات Plugin. وفي
  عمليات ترحيل `PreToolUse` الأصلية بوضع التقارير في خادم تطبيق Codex، يُحال هذا إلى
  طلب الموافقة المطابق في خادم التطبيق؛ راجع
  [بيئة تشغيل عُدّة Codex](/ar/plugins/codex-harness-runtime#hook-boundaries).
- لا يزال بإمكان `block: true` ذي الأولوية الأدنى الحظر بعد أن
  يطلب خطاف ذو أولوية أعلى الموافقة.
- يتلقى `onResolution` القرار المحسوم: `allow-once`، أو `allow-always`،
  أو `deny`، أو `timeout`، أو `cancelled`.

راجع [طلبات أذونات Plugin](/ar/plugins/plugin-permission-requests) للتعرّف على
توجيه الموافقة وسلوك القرار ومتى ينبغي استخدام `requireApproval` بدلًا
من الأدوات الاختيارية أو موافقات التنفيذ.

يمكن لـ Plugins التي تحتاج إلى سياسة على مستوى المضيف تسجيل سياسات أدوات موثوقة باستخدام
`api.registerTrustedToolPolicy(...)`. تعمل هذه قبل خطافات
`before_tool_call` العادية وقبل قرارات الخطافات المعتادة. تعمل السياسات الموثوقة
المضمّنة أولًا؛ ثم تعمل سياسات Plugins المثبتة الموثوقة وفق ترتيب تحميل
Plugin؛ وتعمل خطافات `before_tool_call` العادية بعدها. تحتفظ Plugins المضمّنة
بمسار السياسة الموثوقة الحالي. يجب تمكين Plugins المثبتة صراحةً
والتصريح عن معرّف كل سياسة في `contracts.trustedToolPolicies`؛ وتُرفض المعرّفات غير المصرّح بها
قبل التسجيل. تقتصر معرّفات السياسات على نطاق Plugin الذي يسجّلها،
لذا يمكن لـ Plugins مختلفة إعادة استخدام المعرّف المحلي نفسه. لا تستخدم هذه الطبقة إلا
لبوابات موثوقة من المضيف مثل سياسة مساحة العمل أو فرض الميزانية أو
سلامة سير العمل المحجوز.

### خطاف بيئة التنفيذ

يتيح `resolve_exec_env` لـ Plugins إضافة متغيرات بيئة إلى استدعاءات أداة `exec`
قبل تشغيل الأمر. ويتلقى:

- `event.sessionKey`
- `event.toolName`، وهو حاليًا دائمًا `"exec"`
- `event.host`، وهو أحد `"gateway"` أو `"sandbox"` أو `"node"`
- حقول السياق مثل `ctx.agentId`، و`ctx.sessionKey`،
  و`ctx.messageProvider`، و`ctx.channelId`

أعِد `Record<string, string>` لدمجه في بيئة التنفيذ. تعمل المعالجات
وفق ترتيب الأولوية؛ وتتجاوز النتائج اللاحقة النتائج السابقة للمفتاح
نفسه.

تُرشّح مخرجات الخطاف عبر سياسة مفاتيح بيئة التنفيذ لدى المضيف قبل
دمجها. يُحذف `PATH` دائمًا (يعتمد عليه تحديد الأمر وفحوصات
الثنائيات الآمنة). تُحذف المفاتيح غير الصالحة ومفاتيح تجاوز المضيف الخطرة مثل `LD_*`،
و`DYLD_*`، و`NODE_OPTIONS`، ومتغيرات الوكيل (`HTTP_PROXY`، و`HTTPS_PROXY`،
و`ALL_PROXY`، و`NO_PROXY`)، ومتغيرات تجاوز TLS (`NODE_TLS_REJECT_UNAUTHORIZED`،
و`SSL_CERT_FILE`، وما شابهها). تُدرج بيئة Plugin المرشّحة
في بيانات الموافقة/التدقيق الوصفية في Gateway وتُمرّر إلى طلبات التنفيذ
على مضيف Node.

### استمرارية نتائج الأدوات

يمكن أن تتضمن نتائج الأدوات `details` منظّمة لعرض واجهة المستخدم أو التشخيصات
أو توجيه الوسائط أو البيانات الوصفية التي يملكها Plugin. تعامل مع `details` كبيانات وصفية لبيئة التشغيل،
وليس كمحتوى للموجّه:

- يزيل OpenClaw القيمة `toolResult.details` قبل إعادة التشغيل لدى المزوّد وإدخال
  Compaction كي لا تصبح البيانات الوصفية جزءًا من سياق النموذج.
- لا تحتفظ إدخالات الجلسة المستمرة إلا بـ `details` محدودة الحجم. تُستبدل التفاصيل
  المفرطة الحجم بملخص موجز و`persistedDetailsTruncated: true`.
- يعمل `tool_result_persist` و`before_message_write` قبل
  حد الاستمرارية النهائي. أبقِ `details` المُعادة صغيرة وتجنب وضع
  نص ذي صلة بالموجّه في `details` فقط؛ ضع مخرجات الأداة المرئية للنموذج في
  `content`.

## خطافات الموجّه والنموذج

استخدم الخطافات الخاصة بكل مرحلة في Plugins الجديدة:

- `before_model_resolve`: يتلقى الموجّه الحالي فقط وبيانات
  المرفقات الوصفية. أعِد `providerOverride` أو `modelOverride`.
- `agent_turn_prepare`: يتلقى الموجّه الحالي ورسائل الجلسة
  المُعدّة وأي إدخالات في قائمة الانتظار لمرة واحدة فقط جرى سحبها لهذه الجلسة.
  أعِد `prependContext` أو `appendContext`.
- `before_prompt_build`: يتلقى الموجّه الحالي ورسائل الجلسة.
  أعِد `prependContext` أو `appendContext` أو `systemPrompt`،
  أو `prependSystemContext`، أو `appendSystemContext`.
- `heartbeat_prompt_contribution`: يعمل فقط لدورات Heartbeat ويُعيد
  `prependContext` أو `appendContext`. وهو مخصّص لمراقبات الخلفية التي
  تحتاج إلى تلخيص الحالة الحالية دون تغيير الدورات التي يبدأها المستخدم.

يبقى `before_agent_start` للتوافق. يُفضّل استخدام الخطافات الصريحة
أعلاه كي لا يعتمد Plugin على مرحلة قديمة مجمّعة.

يعمل `before_agent_run` بعد إنشاء الموجّه وقبل أي إدخال للنموذج،
بما في ذلك تحميل الصور المحلية للموجّه ومراقبة `llm_input`. ويتلقى
إدخال المستخدم الحالي بصفته `prompt`، بالإضافة إلى سجل الجلسة المحمّل في `messages`
وموجّه النظام النشط. أعِد `{ outcome: "block", reason, message? }`
لإيقاف التشغيل قبل أن يقرأ النموذج الموجّه. يُعد `reason` داخليًا؛
و`message` هو البديل الموجّه للمستخدم. لا تُدعم إلا نتيجتا `pass` و`block`؛
وتؤدي أشكال القرار غير المدعومة إلى الإغلاق الآمن.

عند حظر تشغيل، لا يخزّن OpenClaw سوى النص البديل في
`message.content` بالإضافة إلى بيانات الحظر الوصفية غير الحساسة مثل معرّف
Plugin الحاظر والطابع الزمني. لا يُحتفظ بنص المستخدم الأصلي في النص المنقول
أو السياق المستقبلي. تُعامل أسباب الحظر الداخلية على أنها حساسة
وتُستبعد من حمولات النص المنقول والسجل والبث والتسجيل والتشخيصات.
ينبغي أن تستخدم قابلية الرصد حقولًا منقّحة مثل معرّف الحاظر أو النتيجة
أو الطابع الزمني أو فئة آمنة.

يتضمن `before_agent_start` و`agent_end` القيمة `event.runId` عندما يستطيع OpenClaw
تحديد التشغيل النشط؛ وتوجد القيمة نفسها أيضًا في `ctx.runId`. كما تعرض عمليات التشغيل
التي يقودها Cron القيمة `ctx.jobId` (معرّف مهمة Cron المنشئة) في سياق دورة
الوكيل كي تتمكن الخطافات من قصر المقاييس أو الآثار الجانبية أو الحالة على مهمة
مجدولة محددة. لا يُعد `ctx.jobId` جزءًا من سياق الأداة `before_tool_call`.

بالنسبة إلى عمليات التشغيل الناشئة من القنوات، يحدّد `ctx.channel` و`ctx.messageProvider`
سطح المزوّد مثل `discord` أو `telegram`، بينما يمثّل `ctx.channelId`
معرّف هدف المحادثة عندما يستطيع OpenClaw اشتقاقه من
مفتاح الجلسة أو بيانات تعريف التسليم.

عندما تكون هوية المرسِل متاحة، تتضمن سياقات خطافات الوكيل أيضًا:

- `ctx.senderId` - معرّف المرسِل ضمن نطاق القناة (مثل Feishu ‏`open_id`، ومعرّف
  مستخدم Discord). يُملأ عندما تنشأ عملية التشغيل من رسالة مستخدم لها
  بيانات تعريف معروفة للمرسِل.
- `ctx.chatId` - معرّف المحادثة الأصلي لوسيلة النقل (مثل Feishu
  ‏`chat_id`، وTelegram ‏`chat_id`). يُملأ عندما توفّر القناة المنشئة
  معرّف محادثة أصليًا.
- `ctx.channelContext.sender.id` - معرّف المرسِل نفسه الموجود في `ctx.senderId`، ضمن
  كائن مملوك للقناة يمكن للـ plugins توسيعه بحقول خاصة بالقناة.
- `ctx.channelContext.chat.id` - معرّف المحادثة نفسه الموجود في `ctx.chatId`،
  ضمن كائن مملوك للقناة يمكن للـ plugins توسيعه بحقول خاصة
  بالقناة.

لا يعرّف النواة سوى حقول `id` المتداخلة. ويمكن لـ plugins القنوات التي تمرّر
بيانات تعريف أكثر تفصيلًا للمرسِل أو الدردشة عبر المساعد الوارد توسيع
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

تمرّر plugins القنوات تلك الحقول عبر مساعد SDK الوارد:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

هذه الحقول اختيارية وغير موجودة في عمليات التشغيل الناشئة من النظام (heartbeat،
cron، exec-event).

يظل `ctx.senderExternalId` حقلًا مهملًا لتوافق المصدر مع
plugins الأقدم. لا يملؤه النواة؛ وينبغي أن توجد هويات المرسِل الجديدة
الخاصة بالقنوات ضمن `ctx.channelContext.sender` من خلال
توسيع الوحدة.

`agent_end` خطاف مراقبة. تشغّله مسارات Gateway والحاضنة الدائمة
بأسلوب التشغيل وعدم الانتظار بعد الدورة، بينما تنتظر مسارات CLI القصيرة أحادية التنفيذ
وعد الخطاف قبل تنظيف العملية لكي تتمكن plugins الموثوقة من تفريغ
بيانات الرصد الطرفية أو التقاط الحالة. يطبّق مشغّل الخطاف مهلة قدرها 30 ثانية
حتى لا تتسبب Plugin عالقة أو نقطة نهاية تضمين في إبقاء وعد الخطاف
معلّقًا إلى الأبد. تُسجَّل المهلة ويواصل OpenClaw العمل؛ ولا
يلغي عمل الشبكة المملوك للـ Plugin ما لم تستخدم الـ Plugin أيضًا إشارة الإلغاء
الخاصة بها.

استخدم `model_call_started` و`model_call_ended` لقياسات استدعاءات المزوّد
التي ينبغي ألا تتلقى المطالبات الأولية أو السجل أو الاستجابات أو الرؤوس أو أجسام
الطلبات أو معرّفات طلبات المزوّد بصورتها الخام. تتضمن هذه الخطافات بيانات تعريف ثابتة مثل
`runId` و`callId` و`provider` و`model` و`api`/`transport` الاختياريين، وحقلي
النهاية `durationMs`/`outcome`، و`upstreamRequestIdHash` عندما يستطيع OpenClaw اشتقاق
تجزئة محدودة لمعرّف طلب المزوّد. وعندما يكون وقت التشغيل قد حسم
بيانات تعريف نافذة السياق، يتضمن حدث الخطاف وسياقه أيضًا
`contextTokenBudget`، وهو ميزانية الرموز الفعلية بعد حدود النموذج/الإعداد/الوكيل،
بالإضافة إلى `contextWindowSource` و`contextWindowReferenceTokens` عند تطبيق
حد أدنى.

لا يعمل `before_agent_finalize` إلا عندما تكون الحاضنة على وشك قبول إجابة
نهائية طبيعية من المساعد. وهو ليس مسار إلغاء `/stop` ولا
يعمل عندما يوقف المستخدم دورة. أعد `{ action: "revise", reason }` لطلب
تمريرة نموذج إضافية من الحاضنة قبل الإنهاء، أو `{ action:
"finalize", reason? }` لفرض الإنهاء، أو لا تُرجع نتيجة للمتابعة.
للمعالجات ميزانية افتراضية قدرها 15s؛ وعند انتهاء المهلة، يسجّل OpenClaw الفشل
ويتابع بالإجابة النهائية الأصلية.
تُمرَّر خطافات `Stop` الأصلية في Codex إلى هذا الخطاف بوصفها قرارات
`before_agent_finalize` في OpenClaw.

عند إرجاع `action: "revise"`، يمكن للـ plugins تضمين بيانات تعريف `retry`
لجعل تمريرة النموذج الإضافية محدودة وآمنة لإعادة التشغيل:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

يُلحَق `instruction` بسبب المراجعة المرسَل إلى الحاضنة.
يتيح `idempotencyKey` للمضيف عدّ محاولات إعادة التنفيذ لطلب الـ Plugin نفسه
عبر قرارات إنهاء متكافئة، ويضع `maxAttempts` حدًا لعدد التمريرات الإضافية
التي سيسمح بها المضيف قبل المتابعة بالإجابة النهائية الطبيعية.

يجب على plugins غير المضمّنة التي تحتاج إلى خطافات المحادثة الخام (`before_model_resolve`
و`before_agent_reply` و`llm_input` و`llm_output` و`before_agent_finalize`
و`agent_end` أو `before_agent_run`) ضبط:

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

يمكن تعطيل الخطافات التي تعدّل المطالبة الأولية وعمليات الحقن الدائمة للدورة التالية لكل
Plugin باستخدام `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### امتدادات الجلسة وعمليات الحقن في الدورة التالية

يمكن لـ plugins سير العمل حفظ حالة جلسة صغيرة متوافقة مع JSON باستخدام
`api.session.state.registerSessionExtension(...)` وتحديثها من خلال
طريقة Gateway ‏`sessions.pluginPatch`. تعرض صفوف الجلسات حالة
الامتداد المسجّلة عبر `pluginExtensions`، مما يتيح لواجهة Control UI والعملاء الآخرين
عرض الحالة المملوكة للـ Plugin من دون معرفة تفاصيلها الداخلية.
لا يزال `api.registerSessionExtension(...)` يعمل، لكنه مهمل لصالح
نطاق الأسماء `api.session.state`.

استخدم `api.session.workflow.enqueueNextTurnInjection(...)` عندما تحتاج Plugin إلى
سياق دائم يصل إلى دورة النموذج التالية مرة واحدة بالضبط (يمثّل
`api.enqueueNextTurnInjection(...)` ذو المستوى الأعلى اسمًا مستعارًا مهملًا بالسلوك
نفسه). يستنزف OpenClaw عمليات الحقن الموضوعة في الطابور قبل خطافات المطالبة الأولية، ويحذف
عمليات الحقن منتهية الصلاحية، ويزيل التكرار حسب `idempotencyKey` لكل Plugin. هذه هي
نقطة الربط المناسبة لاستئناف الموافقات وملخصات السياسات وفروقات مراقب الخلفية
ومتابعات الأوامر التي ينبغي أن تكون مرئية للنموذج في
الدورة التالية، لكن ينبغي ألا تصبح نصًا دائمًا في مطالبة النظام الأولية.

تُعد دلالات التنظيف جزءًا من العقد. تتلقى استدعاءات تنظيف امتداد الجلسة
وتنظيف دورة حياة وقت التشغيل `reset` أو `delete` أو `disable` أو
`restart`. يزيل المضيف حالة امتداد الجلسة الدائمة المملوكة للـ Plugin
وعمليات الحقن المعلقة للدورة التالية عند إعادة الضبط/الحذف/التعطيل؛ وتحافظ إعادة التشغيل
على حالة الجلسة الدائمة، بينما تتيح استدعاءات التنظيف للـ plugins تحرير
مهام المجدول وسياق التشغيل والموارد الأخرى خارج النطاق للجيل
القديم من وقت التشغيل.

## خطافات الرسائل

استخدم خطافات الرسائل لتوجيه القنوات وسياسة التسليم:

- `message_received`: مراقبة المحتوى الوارد والمرسِل و`threadId`
  و`messageId` و`senderId`، والربط الاختياري بعملية التشغيل/الجلسة، وبيانات التعريف.
- `message_sending`: إعادة كتابة `content` أو إرجاع `{ cancel: true }`.
- `reply_payload_sending`: إعادة كتابة كائنات `ReplyPayload` الموحّدة
  (بما في ذلك `presentation` و`delivery` ومراجع الوسائط والنص) أو إرجاع
  `{ cancel: true }`.
- `message_sent`: مراقبة النجاح أو الفشل النهائي.

بالنسبة إلى ردود تحويل النص إلى كلام الصوتية فقط، قد يحتوي `content` على النص المنطوق
المخفي حتى عندما لا تحتوي حمولة القناة على نص/تسمية توضيحية مرئية.
تؤدي إعادة كتابة `content` إلى تحديث النص الظاهر للخطاف فقط؛ ولا
يُعرَض كتسمية توضيحية للوسائط.

قد تتضمن أحداث `reply_payload_sending` الحقل `usageState`، وهو لقطة حية بأفضل جهد
للنموذج/الاستخدام/السياق لكل دورة. يُحذَف من التسليم الدائم وإعادة التشغيل المستعادة
والردود التي لا تملك ارتباطًا دقيقًا بعملية التشغيل.

تكشف سياقات خطافات الرسائل حقول ارتباط ثابتة عندما تكون متاحة:
`ctx.sessionKey` و`ctx.runId` و`ctx.messageId` و`ctx.senderId` و`ctx.trace`
و`ctx.traceId` و`ctx.spanId` و`ctx.parentSpanId` و`ctx.callDepth`. وتكشف سياقات الوارد
و`before_dispatch` أيضًا بيانات تعريف الرد عندما تملك القناة
بيانات رسالة مقتبسة مرشّحة حسب إمكانية الرؤية: `replyToId` و`replyToIdFull`
و`replyToBody` و`replyToSender` و`replyToIsQuote`. فضّل هذه
الحقول الأصلية قبل قراءة بيانات التعريف القديمة.

فضّل حقلي `threadId` و`replyToId` محددي النوع قبل استخدام بيانات التعريف
الخاصة بالقناة.

قواعد القرار:

- `message_sending` مع `cancel: true` نهائي.
- `message_sending` مع `cancel: false` يُعامل كعدم وجود قرار.
- تواصل قيمة `content` المعاد كتابتها إلى الخطافات ذات الأولوية الأدنى ما لم يُلغِ خطاف لاحق
  التسليم.
- يعمل `reply_payload_sending` بعد توحيد الحمولة وقبل
  تسليمها إلى القناة، بما في ذلك الردود الموجّهة مجددًا إلى القناة المنشئة.
  تعمل المعالجات بالتتابع، ويرى كل معالج أحدث حمولة أنتجتها
  المعالجات الأعلى أولوية.
- لا تكشف حمولات `reply_payload_sending` علامات ثقة وقت التشغيل مثل
  `trustedLocalMedia`؛ ويمكن للـ plugins تعديل بنية الحمولة، لكنها لا تستطيع منح الثقة
  للوسائط المحلية.
- يمكن لـ `message_sending` إرجاع `cancelReason` و`metadata` محدود مع
  الإلغاء. تعرض واجهات دورة حياة الرسائل الجديدة ذلك باعتباره نتيجة تسليم
  محجوبة بسبب `cancelled_by_message_sending_hook`؛ بينما يواصل
  التسليم المباشر القديم إرجاع مصفوفة نتائج فارغة حفاظًا على التوافق.
- `message_sent` للمراقبة فقط. تُسجَّل إخفاقات المعالج ولا
  تغيّر نتيجة التسليم.

## خطافات التثبيت

استخدم `security.installPolicy` لقرارات السماح/الحظر المملوكة للمشغّل. تعمل تلك
السياسة من إعداد OpenClaw، وتغطي مسارات التثبيت والتحديث في CLI،
وتفشل في الوضع المغلق عند تمكينها مع عدم توفرها.

يمثّل `before_install` خطاف دورة حياة لوقت تشغيل Plugin. ويعمل بعد
`security.installPolicy` فقط داخل عملية OpenClaw التي حُمّلت فيها خطافات Plugin
بالفعل، مثل تدفقات التثبيت المدعومة بـ Gateway. وهو مفيد
لعمليات المراقبة والتحذيرات وفحوص التوافق المملوكة للـ Plugin، لكنه ليس
حد الأمان الأساسي للمؤسسة أو المضيف لعمليات التثبيت. يظل الحقل
`builtinScan` موجودًا في حمولة الحدث حفاظًا على التوافق، لكن
OpenClaw لم يعد ينفّذ حظرًا مضمّنًا للتعليمات البرمجية الخطرة وقت التثبيت، لذا فهو
نتيجة `ok` فارغة. أعد نتائج إضافية أو
`{ block: true, blockReason }` لإيقاف التثبيت في تلك العملية.

`block: true` نهائي. ويُعامل `block: false` كعدم وجود قرار. تؤدي إخفاقات
المعالج إلى حظر التثبيت في الوضع المغلق.

## دورة حياة Gateway

استخدم `gateway_start` لبدء خدمات Plugin العامة و`gateway_stop`
لتنظيف الموارد طويلة الأمد. قد يكون مجدول cron لا يزال قيد التحميل عندما
يعمل `gateway_start`، لذا لا تستخدمه كإشارة خط أساس لعرض
cron خارجي.

لا تعتمد على خطاف `gateway:startup` الداخلي لخدمات وقت التشغيل
المملوكة للـ Plugin.

ينطلق `cron_reconciled` بعد أن يوفّق مجدول cron في Gateway ومراقبو
الخروج الخاصون به حالتهم الدائمة. وينطلق عند بدء التشغيل الأولي
وعند استبدال المجدول أثناء إعادة تحميل الإعداد. يبلّغ الحدث عن
`reason` (`startup` أو `reload`) وحالة `enabled` الفعلية. ويظل cron
المعطّل يصدر الحدث مع `enabled: false`، مما يسمح لعرض خارجي
بمسح عمليات الإيقاظ القديمة. استخدم `ctx.getCron?.()` لمثيل المجدول الدقيق الذي
أكمل التوفيق؛ ولا تعيد عملية تحميل لاحقة توجيه ذلك الاستدعاء.
يمتلك `ctx.abortSignal` لقطة المجدول نفسها. يجهضه Gateway بمجرد
تجهيز مجدول أحدث أو بدء إيقاف التشغيل. مرّره عبر كل
أثر جانبي دائم ولا تقبل اللقطة بعد إجهاضه.
هذه إشارة لدورة حياة المجدول، وليست إشارة لتنشيط Plugin:
إعادة التحميل السريع للـ Plugin فقط لا تعيد تشغيلها. يتلقى المستهلك الذي
مُكّن حديثًا أول خط أساس له عند الاستبدال التالي للمجدول أو بدء Gateway.

مثل خطافات المراقبة الأخرى، يمكن أن تتداخل استدعاءات `gateway_start` و`cron_reconciled`.
إذا كان المعالجان يشتركان في تهيئة Plugin، فنسّق بينهما
باستخدام وعد جاهزية محلي للـ Plugin بدلًا من الاعتماد على ترتيب الاستدعاءات.

`cron_changed` يُطلَق لأحداث دورة حياة Cron التي يملكها Gateway، مع حمولة حدث مكتوبة النوع تغطي أسباب `added` و`updated` و`removed` و`started` و`finished`
و`scheduled`. يحمل الحدث لقطة `PluginHookGatewayCronJob`
(بما في ذلك `state.nextRunAtMs` و`state.lastRunStatus` و
`state.lastError` عند وجودها) بالإضافة إلى `PluginHookGatewayCronDeliveryStatus`
من `not-requested` | `delivered` | `not-delivered` | `unknown`. تكون أحداث الإزالة
لاحقة للتثبيت: فلا تُطلَق إلا بعد نجاح الحذف الدائم، وتظل تحمل
لقطة المهمة المحذوفة كي تتمكن المجدولات الخارجية من تسوية الحالة.

يكون حدث `scheduled` لاحقًا للتثبيت: فلا يُطلَق إلا بعد أن تؤدي كتابة دائمة ناجحة
إلى تغيير `nextRunAtMs` الفعلي لمهمة موجودة، مع استثناء حدث دورة الحياة الصريح
`added` أو `updated` أو `removed` لتلك المهمة. يمثّل
`event.nextRunAtMs` ذو المستوى الأعلى وقت الاستيقاظ التالي المثبّت؛ وعند غيابه، لا يكون للمهمة
وقت استيقاظ تالٍ. تعامل مع هذه الأحداث بوصفها تلميحات للتسوية، لا سجل فروق
مرتبًا. استخدمها كتلميحات قابلة للدمج لإعادة قراءة المجدول الذي التقطه آخر مرة
`cron_reconciled`؛ ولا تعتمد المجدول من سياق `cron_changed`.
أبقِ OpenClaw مصدر الحقيقة لعمليات التحقق من الاستحقاق والتنفيذ.

### إسقاط Cron خارجي آمن

أسقط لقطة استيقاظ كاملة بدلًا من تمرير فروق أحداث Cron. يجب أن تكون
عملية `replaceAll` للمهايئ الخارجي ذرّية ومتكررة النتيجة، ويجب ألا
تكتمل إلا بعد أن يقبل المضيف اللقطة قبولًا دائمًا. ويجب عليها أيضًا
احترام إشارة الإلغاء المقدمة: إذا أُلغيت الإشارة قبل القبول الدائم،
فيجب ألا يقبل المهايئ تلك اللقطة.

يُبقي هذا النمط عاملًا واحدًا لأحدث حالة قيد التنفيذ. وحده `cron_reconciled`
يعتمد مثيل مجدول؛ أما `cron_changed` فلا يفعل سوى مطالبة ذلك العامل بإعادة قراءة
المثيل الموثوق، بحيث لا يمكن لتلميح متأخر أن يستعيد مجدولًا أقدم.
تُلغي مراجعة أحدث محاولة المضيف النشطة قبل أن تتمكن من قبول
لقطة قديمة.

```typescript
import { setTimeout as sleep } from "node:timers/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";

type ExternalWake = { jobId: string; runAtMs: number };

type ExternalWakeHost = {
  replaceAll(wakes: readonly ExternalWake[], options: { signal: AbortSignal }): Promise<void>;
  close(): Promise<void>;
};

type CronReader = {
  list(options: { includeDisabled: true }): Promise<
    Array<{
      id: string;
      enabled?: boolean;
      state?: { nextRunAtMs?: number };
    }>
  >;
};

export function registerCronProjection(api: OpenClawPluginApi, host: ExternalWakeHost) {
  const lifecycle = new AbortController();
  let cron: CronReader | undefined;
  let enabled = false;
  let hasBaseline = false;
  let reconciliationSignal: AbortSignal | undefined;
  let requestedRevision = 0;
  let appliedRevision = 0;
  let worker = Promise.resolve();
  let activeAttempt: AbortController | undefined;

  const projectLatest = async () => {
    let retryMs = 1_000;

    while (!lifecycle.signal.aborted && appliedRevision < requestedRevision) {
      const ownerSignal = reconciliationSignal;
      if (!ownerSignal || ownerSignal.aborted) {
        return;
      }
      const targetRevision = requestedRevision;
      const attempt = new AbortController();
      const signal = AbortSignal.any([lifecycle.signal, ownerSignal, attempt.signal]);
      activeAttempt = attempt;

      try {
        const jobs = enabled && cron ? await cron.list({ includeDisabled: true }) : [];
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        const wakes = jobs
          .flatMap((job): ExternalWake[] => {
            const runAtMs = job.enabled === false ? undefined : job.state?.nextRunAtMs;
            return runAtMs === undefined ? [] : [{ jobId: job.id, runAtMs }];
          })
          .sort((a, b) => a.runAtMs - b.runAtMs || a.jobId.localeCompare(b.jobId));

        await host.replaceAll(wakes, { signal });
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        appliedRevision = targetRevision;
        retryMs = 1_000;
      } catch {
        if (lifecycle.signal.aborted || ownerSignal.aborted) {
          return;
        }
        if (attempt.signal.aborted) {
          continue;
        }
        api.logger.warn(`فشل إسقاط Cron الخارجي؛ ستتم إعادة المحاولة خلال ${retryMs}ms`);
        try {
          await sleep(retryMs, undefined, { signal });
        } catch {
          if (lifecycle.signal.aborted) {
            return;
          }
          if (attempt.signal.aborted) {
            continue;
          }
        }
        retryMs = Math.min(retryMs * 2, 30_000);
      } finally {
        if (activeAttempt === attempt) {
          activeAttempt = undefined;
        }
      }
    }
  };

  const requestProjection = () => {
    const targetRevision = ++requestedRevision;
    activeAttempt?.abort();
    worker = worker.then(async () => {
      if (!lifecycle.signal.aborted && appliedRevision < targetRevision) {
        await projectLatest();
      }
    });
    return worker;
  };

  api.on("cron_reconciled", (event, ctx) => {
    const reconciledCron = ctx.getCron?.();
    if (event.enabled && !reconciledCron) {
      api.logger.warn("لم تكشف تسوية Cron عن مجدول");
      return;
    }
    cron = reconciledCron;
    enabled = event.enabled;
    hasBaseline = true;
    reconciliationSignal = ctx.abortSignal;
    return requestProjection();
  });

  api.on("cron_changed", () => {
    if (hasBaseline) {
      return requestProjection();
    }
  });

  api.on("gateway_stop", async () => {
    lifecycle.abort();
    await worker;
    await host.close();
  });
}
```

عندما يبلّغ `cron_reconciled` عن `enabled: false`، يستدعي المسار نفسه
`replaceAll([])` ويمسح أوقات الاستيقاظ الخارجية القديمة. تكون إعادة المحاولة/التراجع في هذا المثال
محلية للعملية، وتتعامل مع إخفاقات مهايئ وقت التشغيل بوصفها عابرة؛ تحقّق من
الإعدادات غير القابلة لإعادة المحاولة قبل التسجيل. لا يوفر OpenClaw
صندوق صادر لتأثيرات خطافات Plugin. إذا خرجت العملية قبل القبول الدائم،
يُصدر بدء Gateway التالي لقطة `cron_reconciled` موثوقة جديدة.
يُلغي `gateway_stop` عمل المضيف قيد التنفيذ، وينتظر استقرار العامل، ثم
يغلق المهايئ.

## الإهمالات القادمة

بعض الأسطح المجاورة للخطافات مهملة، لكنها لا تزال مدعومة. انتقل منها
قبل الإصدار الرئيسي التالي:

- **مغلفات القنوات ذات النص العادي** في معالجات `inbound_claim` و`message_received`.
  اقرأ `BodyForAgent` وكتل سياق المستخدم المهيكلة
  بدلًا من تحليل نص المغلف المسطح. راجع
  [مغلفات القنوات ذات النص العادي ← BodyForAgent](/ar/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** يظل موجودًا للتوافق. ينبغي لبرامج Plugin الجديدة استخدام
  `before_model_resolve` و`before_prompt_build` بدلًا من
  المرحلة المدمجة.
- **`subagent_spawning`** يظل موجودًا للتوافق مع برامج Plugin الأقدم، لكن
  ينبغي ألا تعيد برامج Plugin الجديدة توجيه الخيط منه. يُعِدّ النواة
  ارتباطات الوكلاء الفرعيين `thread: true` عبر مهايئات ارتباط جلسة القناة
  قبل إطلاق `subagent_spawned`.
- **`deactivate`** يظل اسمًا مستعارًا مهمَلًا للتوافق مع التنظيف حتى
  ما بعد 2026-08-16. ينبغي لبرامج Plugin الجديدة استخدام `gateway_stop`.
- **`onResolution` في `before_tool_call`** يستخدم الآن اتحاد
  `PluginApprovalResolution` المكتوب النوع (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) بدلًا من `string` حر الصيغة.
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** يظلان
  اسمين مستعارين للتوافق على المستوى الأعلى. ينبغي لبرامج Plugin الجديدة استخدام
  `api.session.state.registerSessionExtension(...)` و
  `api.session.workflow.enqueueNextTurnInjection(...)`.

للاطلاع على القائمة الكاملة — تسجيل قدرة الذاكرة، وملف تعريف تفكير المزوّد،
ومزوّدي المصادقة الخارجيين، وأنواع اكتشاف المزوّد، وموصلات وقت تشغيل
المهام، وإعادة التسمية من `command-auth` إلى `command-status` — راجع
[ترحيل Plugin SDK ← الإهمالات النشطة](/ar/plugins/sdk-migration#active-deprecations).

## ذو صلة

- [ترحيل Plugin SDK](/ar/plugins/sdk-migration) - الإهمالات النشطة والجدول الزمني للإزالة
- [إنشاء برامج Plugin](/ar/plugins/building-plugins)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints)
- [الخطافات الداخلية](/ar/automation/hooks)
- [التفاصيل الداخلية لبنية Plugin](/ar/plugins/architecture-internals)
