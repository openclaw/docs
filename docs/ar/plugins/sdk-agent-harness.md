---
read_when:
    - أنت تغيّر بيئة تشغيل الوكيل المضمّنة أو سجل إطار الاختبار
    - أنت تسجّل إطار تشغيل وكيل من Plugin مضمّن أو موثوق
    - يجب أن تفهم كيفية ارتباط Plugin Codex بموفري النماذج
sidebarTitle: Agent Harness
summary: واجهة SDK تجريبية لـ Plugins التي تستبدل منفّذ الوكيل المضمّن منخفض المستوى
title: Plugins إطار تشغيل الوكيل
x-i18n:
    generated_at: "2026-05-07T13:26:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: ab47fbedbd429a4c0e72da0057a88be34528b69804fa1e7af795f377c4907f55
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

إن **agent harness** هو المنفّذ منخفض المستوى لدورة واحدة مُحضّرة من وكيل OpenClaw.
ليس موفّر نموذج، ولا قناة، ولا سجل أدوات.
للنموذج الذهني الموجّه للمستخدم، راجع [تشغيلات الوكلاء](/ar/concepts/agent-runtimes).

استخدم هذا السطح فقط مع Plugins أصلية مضمّنة أو موثوقة. لا يزال العقد
تجريبيًا لأن أنواع المعاملات تعكس عمدًا المشغّل المضمّن الحالي.

## متى تستخدم harness

سجّل agent harness عندما تكون لعائلة نماذج بيئة جلسات أصلية خاصة بها
ويكون نقل موفّر OpenClaw المعتاد هو التجريد غير المناسب.

أمثلة:

- خادم وكيل برمجة أصلي يملك الخيوط وCompaction
- CLI محلي أو daemon يجب أن يبث أحداث الخطة/الاستدلال/الأدوات الأصلية
- بيئة تشغيل نموذج تحتاج إلى معرّف استئناف خاص بها إضافةً إلى سجل جلسة OpenClaw

لا تسجّل **harness** لمجرد إضافة واجهة LLM API جديدة. بالنسبة إلى واجهات نماذج HTTP أو
WebSocket المعتادة، ابنِ [provider plugin](/ar/plugins/sdk-provider-plugins).

## ما لا يزال core يملكه

قبل اختيار harness، يكون OpenClaw قد حلّ بالفعل:

- الموفّر والنموذج
- حالة مصادقة وقت التشغيل
- مستوى التفكير وميزانية السياق
- ملف سجل/جلسة OpenClaw
- مساحة العمل وsandbox وسياسة الأدوات
- استدعاءات رد القناة واستدعاءات البث
- سياسة احتياطي النموذج والتبديل الحي للنموذج

هذا الفصل مقصود. يشغّل harness محاولة مُحضّرة؛ ولا يختار
الموفّرين، ولا يستبدل تسليم القناة، ولا يبدّل النماذج بصمت.

تتضمن المحاولة المُحضّرة أيضًا `params.runtimePlan`، وهي حزمة سياسة يملكها OpenClaw
لقرارات وقت التشغيل التي يجب أن تبقى مشتركة بين PI وharnesses الأصلية:

- `runtimePlan.tools.normalize(...)` و
  `runtimePlan.tools.logDiagnostics(...)` لسياسة مخطط الأدوات الواعية بالموفّر
- `runtimePlan.transcript.resolvePolicy(...)` لتنقية السجل وسياسة
  إصلاح استدعاءات الأدوات
- `runtimePlan.delivery.isSilentPayload(...)` لقمع تسليم `NO_REPLY` والوسائط المشترك
- `runtimePlan.outcome.classifyRunResult(...)` لتصنيف احتياطي النموذج
- `runtimePlan.observability` لبيانات الموفّر/النموذج/harness metadata المحلولة

يمكن لـ Harnesses استخدام الخطة للقرارات التي يجب أن تطابق سلوك PI، لكن
ينبغي أن تتعامل معها مع ذلك كحالة محاولة يملكها المضيف. لا تعدّلها ولا تستخدمها
لتبديل الموفّرين/النماذج داخل دورة.

## تسجيل harness

**استيراد:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## سياسة الاختيار

يختار OpenClaw harness بعد حل الموفّر/النموذج:

1. يفوز معرّف harness المسجّل في جلسة موجودة، لذلك لا تؤدي تغييرات config/env إلى
   تبديل هذا السجل أثناء التشغيل إلى بيئة تشغيل أخرى.
2. يفرض `OPENCLAW_AGENT_RUNTIME=<id>` harness مسجّلًا بذلك المعرّف
   للجلسات غير المثبّتة مسبقًا.
3. يفرض `OPENCLAW_AGENT_RUNTIME=pi` harness PI المضمّن.
4. يطلب `OPENCLAW_AGENT_RUNTIME=auto` من harnesses المسجّلة ما إذا كانت تدعم
   الموفّر/النموذج المحلول.
5. إذا لم يطابق أي harness مسجّل، يستخدم OpenClaw PI ما لم يكن احتياطي PI
   معطّلًا.

تظهر إخفاقات Plugin harness كإخفاقات تشغيل. في وضع `auto`، لا يُستخدم احتياطي PI
إلا عندما لا يدعم أي Plugin harness مسجّل الموفّر/النموذج
المحلول. بعد أن يطالب Plugin harness بتشغيل ما، لا يعيد OpenClaw
تشغيل الدورة نفسها عبر PI لأن ذلك قد يغيّر دلالات المصادقة/وقت التشغيل
أو يكرر الآثار الجانبية.

يُحفظ معرّف harness المختار مع معرّف الجلسة بعد تشغيل مضمّن.
تُعامل الجلسات القديمة التي أُنشئت قبل تثبيت harnesses على أنها مثبتة على PI بمجرد
أن يكون لديها سجل محادثة. استخدم جلسة جديدة/معاد ضبطها عند التغيير بين PI و
Plugin harness أصلي. يعرض `/status` معرّفات harness غير الافتراضية مثل `codex`
بجوار `Fast`؛ ويبقى PI مخفيًا لأنه مسار التوافق الافتراضي.
إذا كان harness المختار مفاجئًا، فعّل تسجيل تصحيح `agents/harness` وافحص
سجل `agent harness selected` المنظّم في Gateway. يتضمن
معرّف harness المختار، وسبب الاختيار، وسياسة وقت التشغيل/الاحتياطي، وفي وضع
`auto`، نتيجة دعم كل مرشح Plugin.

يسجّل Plugin Codex المضمّن `codex` كمعرّف harness الخاص به. يتعامل core مع ذلك
كمعرّف Plugin harness عادي؛ أما الأسماء المستعارة الخاصة بـ Codex فمكانها في Plugin
أو إعدادات المشغّل، لا في محدد وقت التشغيل المشترك.

## إقران الموفّر مع harness

ينبغي لمعظم harnesses أن تسجّل موفّرًا أيضًا. يجعل الموفّر مراجع النماذج،
وحالة المصادقة، وبيانات تعريف النموذج، واختيار `/model` مرئية لبقية
OpenClaw. ثم يطالب harness بذلك الموفّر في `supports(...)`.

يتبع Plugin Codex المضمّن هذا النمط:

- مراجع نموذج المستخدم المفضّلة: `openai/gpt-5.5` إضافةً إلى
  `agentRuntime.id: "codex"`
- مراجع التوافق: تبقى مراجع `codex/gpt-*` القديمة مقبولة، لكن ينبغي ألا تستخدمها
  الإعدادات الجديدة كمراجع موفّر/نموذج عادية
- معرّف harness: `codex`
- المصادقة: توفر موفّر اصطناعي، لأن Codex harness يملك
  تسجيل دخول/جلسة Codex الأصلية
- طلب خادم التطبيق: يرسل OpenClaw معرّف النموذج المجرد إلى Codex ويترك
  harness يتحدث إلى بروتوكول خادم التطبيق الأصلي

Plugin Codex إضافي. تواصل مراجع `openai/gpt-*` الصريحة استخدام
مسار موفّر OpenClaw المعتاد ما لم تفرض Codex harness باستخدام
`agentRuntime.id: "codex"`. لا تزال مراجع `codex/gpt-*` الأقدم تختار
موفّر Codex وharness للتوافق.

لإعداد المشغّل، وأمثلة بادئة النموذج، وإعدادات Codex فقط، راجع
[Codex Harness](/ar/plugins/codex-harness).

يتطلب OpenClaw خادم تطبيق Codex `0.125.0` أو أحدث. يتحقق Plugin Codex
من مصافحة تهيئة خادم التطبيق ويحظر الخوادم الأقدم أو غير المرقّمة بحيث
لا يعمل OpenClaw إلا على سطح البروتوكول الذي اختُبر معه. يتضمن حد
`0.125.0` دعم حمولة hook الأصلية لـ MCP الذي وصل في
Codex `0.124.0`، مع تثبيت OpenClaw على خط stable الأحدث المختبَر.

### وسيط نتيجة الأداة

يمكن لـ Plugins المضمّنة إرفاق وسيط نتائج أدوات محايد وقت التشغيل عبر
`api.registerAgentToolResultMiddleware(...)` عندما يصرّح manifest الخاص بها
بمعرّفات وقت التشغيل المستهدفة في `contracts.agentToolResultMiddleware`. هذا
السطح الموثوق مخصص لتحويلات نتائج الأدوات غير المتزامنة التي يجب أن تعمل قبل أن يعيد PI أو Codex
تغذية خرج الأداة إلى النموذج.

لا تزال Plugins المضمّنة القديمة قادرة على استخدام
`api.registerCodexAppServerExtensionFactory(...)` لوسيط خاص بخادم تطبيق Codex فقط،
لكن ينبغي أن تستخدم تحويلات النتائج الجديدة واجهة API المحايدة وقت التشغيل.
أُزيل hook الخاص بـ Pi فقط `api.registerEmbeddedExtensionFactory(...)`؛
يجب أن تستخدم تحويلات نتائج أدوات Pi وسيطًا محايدًا وقت التشغيل.

### تصنيف نتيجة النهاية

يمكن لـ harnesses الأصلية التي تملك إسقاط البروتوكول الخاص بها استخدام
`classifyAgentHarnessTerminalOutcome(...)` من
`openclaw/plugin-sdk/agent-harness-runtime` عندما تنتج دورة مكتملة بلا
نص مساعد مرئي. يعيد المساعد `empty` أو `reasoning-only` أو
`planning-only` لكي تستطيع سياسة احتياطي OpenClaw أن تقرر ما إذا كانت ستعيد المحاولة على
نموذج مختلف. يترك عمدًا أخطاء المطالبة، والدورات الجارية، والردود الصامتة
المقصودة مثل `NO_REPLY` بلا تصنيف.

### وضع Codex harness الأصلي

يمثل harness المضمّن `codex` وضع Codex الأصلي لدورات وكيل OpenClaw
المضمّنة. فعّل Plugin `codex` المضمّن أولًا، وأدرج `codex` في
`plugins.allow` إذا كانت إعداداتك تستخدم قائمة سماح مقيّدة. ينبغي أن تستخدم
إعدادات خادم التطبيق الأصلي `openai/gpt-*`؛ تختار دورات وكيل OpenAI
Codex harness افتراضيًا. ينبغي إصلاح مسارات `openai-codex/*` القديمة باستخدام
`openclaw doctor --fix`، وتبقى مراجع نموذج `codex/*` القديمة أسماءً مستعارة للتوافق
مع harness الأصلي.

عند تشغيل هذا الوضع، يملك Codex معرّف الخيط الأصلي، وسلوك الاستئناف،
وCompaction، وتنفيذ خادم التطبيق. لا يزال OpenClaw يملك قناة المحادثة،
ومرآة السجل المرئي، وسياسة الأدوات، والموافقات، وتسليم الوسائط، واختيار الجلسة.
استخدم `agentRuntime.id: "codex"` عندما تحتاج إلى إثبات أن مسار خادم تطبيق
Codex وحده يمكنه المطالبة بالتشغيل. تفشل أوقات تشغيل Plugin الصريحة بشكل مغلق؛
ولا تُعاد محاولات إخفاقات اختيار خادم تطبيق Codex وإخفاقات وقت التشغيل عبر
PI.

## صرامة وقت التشغيل

افتراضيًا، يشغّل OpenClaw الوكلاء المضمّنين باستخدام OpenClaw Pi. في وضع `auto`،
يمكن لـ Plugin harnesses المسجّلة المطالبة بزوج موفّر/نموذج، ويتولى PI
الدورة عندما لا يطابق أي منها. استخدم وقت تشغيل Plugin صريحًا مثل
`agentRuntime.id: "codex"` عندما يجب أن يفشل اختيار harness المفقود بدلًا
من التوجيه عبر PI. تفشل إخفاقات Plugin harness المختار دائمًا بشكل صارم. هذا
لا يمنع `agentRuntime.id: "pi"` صريحًا أو
`OPENCLAW_AGENT_RUNTIME=pi`.

لتشغيلات Codex المضمّنة فقط:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

إذا أردت أن يطالب أي Plugin harness مسجّل بالنماذج المطابقة، وأن يُستخدم PI بخلاف ذلك،
فاضبط `id: "auto"`:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto"
      }
    }
  }
}
```

تستخدم التجاوزات لكل وكيل الشكل نفسه:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": { "id": "auto" }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": { "id": "codex" }
      }
    ]
  }
}
```

لا يزال `OPENCLAW_AGENT_RUNTIME` يتجاوز وقت التشغيل المكوّن.

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

مع وقت تشغيل Plugin صريح، تفشل الجلسة مبكرًا عندما لا يكون harness المطلوب
مسجلًا، أو لا يدعم الموفّر/النموذج المحلول، أو يفشل قبل إنتاج آثار جانبية للدورة.
هذا مقصود لعمليات نشر Codex فقط ولاختبارات live التي يجب أن تثبت أن مسار خادم تطبيق
Codex قيد الاستخدام فعليًا.

يتحكم هذا الإعداد فقط في agent harness المضمّن. ولا يعطّل
توجيه نماذج الصور أو الفيديو أو الموسيقى أو TTS أو PDF أو غيرها من النماذج الخاصة بالموفّر.

## الجلسات الأصلية ومرآة السجل

قد يحتفظ harness بمعرّف جلسة أصلي، أو معرّف خيط، أو رمز استئناف على جانب daemon.
احتفظ بهذا الربط مرتبطًا صراحةً بجلسة OpenClaw، واستمر في
عكس خرج المساعد/الأداة المرئي للمستخدم داخل سجل OpenClaw.

يبقى سجل OpenClaw طبقة التوافق لـ:

- سجل الجلسة المرئي في القناة
- البحث في السجل وفهرسته
- الرجوع إلى PI harness المضمّن في دورة لاحقة
- سلوك `/new` و`/reset` العام وحذف الجلسات

إذا كان harness يخزّن ربطًا جانبيًا، فنفّذ `reset(...)` حتى يستطيع OpenClaw
مسحه عند إعادة ضبط جلسة OpenClaw المالكة.

## نتائج الأدوات والوسائط

ينشئ core قائمة أدوات OpenClaw ويمررها إلى المحاولة المُحضّرة.
عندما ينفّذ harness استدعاء أداة ديناميكيًا، أعد نتيجة الأداة عبر
شكل نتيجة harness بدلًا من إرسال وسائط القناة بنفسك.

يحافظ هذا على مخرجات النص والصور والفيديو والموسيقى وTTS والموافقة وأدوات المراسلة
على مسار التسليم نفسه مثل التشغيلات المدعومة بـ PI.

## القيود الحالية

- مسار الاستيراد العام عام، لكن بعض الأسماء المستعارة لأنواع المحاولة/النتيجة لا تزال
  تحمل أسماء `Pi` لأغراض التوافق.
- تثبيت حزمة أدوات الطرف الثالث تجريبي. فضّل Plugins المزوّدين
  إلى أن تحتاج إلى وقت تشغيل جلسة أصلي.
- تبديل حزم الأدوات مدعوم عبر الأدوار. لا تبدّل حزم الأدوات في
  منتصف الدور بعد بدء الأدوات الأصلية أو الموافقات أو نص المساعد أو عمليات
  إرسال الرسائل.

## ذات صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview)
- [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime)
- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins)
- [حزمة أدوات Codex](/ar/plugins/codex-harness)
- [مزوّدو النماذج](/ar/concepts/model-providers)
