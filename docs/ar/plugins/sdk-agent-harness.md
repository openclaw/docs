---
read_when:
    - أنت تغيّر وقت تشغيل الوكيل المضمّن أو سجل الـ harness
    - أنت تسجّل agent harness من plugin مضمّنة أو موثوقة
    - أنت بحاجة إلى فهم كيفية ارتباط plugin ‏Codex بموفري النماذج
sidebarTitle: Agent Harness
summary: سطح SDK تجريبي لـ plugins التي تستبدل منفّذ الوكيل المضمّن منخفض المستوى
title: Agent Harness Plugins
x-i18n:
    generated_at: "2026-04-11T02:46:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43c1f2c087230398b0162ed98449f239c8db1e822e51c7dcd40c54fa6c3374e1
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Agent Harness Plugins

إن **agent harness** هو المنفّذ منخفض المستوى لدورة وكيل OpenClaw واحدة تم إعدادها مسبقًا. وهو ليس موفر نماذج، ولا قناة، ولا سجل أدوات.

استخدم هذا السطح فقط مع plugins الأصلية المضمّنة أو الموثوقة. لا يزال هذا العقد تجريبيًا لأن أنواع المعاملات تعكس عمدًا المنفّذ المضمّن الحالي.

## متى تستخدم harness

سجّل agent harness عندما تكون لعائلة النماذج بيئة جلسات أصلية خاصة بها ويكون نقل الموفر العادي في OpenClaw تجريدًا غير مناسب.

أمثلة:

- خادم وكيل برمجة أصلي يملك سلاسل الرسائل والضغط
- CLI أو daemon محلي يجب أن يبث أحداث الخطة/الاستدلال/الأدوات الأصلية
- بيئة تشغيل نموذج تحتاج إلى معرّف استئناف خاص بها بالإضافة إلى نسخة السجل النصي للجلسة في OpenClaw

**لا** تسجّل harness فقط لإضافة API جديدة لـ LLM. بالنسبة إلى واجهات API النماذج العادية عبر HTTP أو WebSocket، أنشئ [provider plugin](/ar/plugins/sdk-provider-plugins).

## ما الذي يبقى ضمن مسؤولية core

قبل اختيار harness، يكون OpenClaw قد حدّد بالفعل:

- الموفر والنموذج
- حالة مصادقة وقت التشغيل
- مستوى الاستدلال وميزانية السياق
- ملف السجل النصي/الجلسة في OpenClaw
- مساحة العمل وsandbox وسياسة الأدوات
- استدعاءات ردود القنوات واستدعاءات البث
- سياسة النموذج الاحتياطي والتبديل المباشر للنموذج

هذا الفصل مقصود. تعمل harness على محاولة تم إعدادها مسبقًا؛ فهي لا تختار الموفرين، ولا تستبدل تسليم القنوات، ولا تبدّل النماذج بصمت.

## تسجيل harness

**الاستيراد:** `openclaw/plugin-sdk/agent-harness`

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
    // ابدأ سلسلة الرسائل الأصلية أو استأنفها.
    // استخدم params.prompt وparams.tools وparams.images وparams.onPartialReply،
    // وparams.onAgentEvent، وغيرها من حقول المحاولة المُعدّة مسبقًا.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "يشغّل النماذج المحددة عبر daemon وكيل أصلي.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## سياسة الاختيار

يختار OpenClaw harness بعد تحديد الموفر/النموذج:

1. يفرض `OPENCLAW_AGENT_RUNTIME=<id>` harness مسجّلة بالمعرّف نفسه.
2. يفرض `OPENCLAW_AGENT_RUNTIME=pi` استخدام harness ‏PI المضمّنة.
3. يطلب `OPENCLAW_AGENT_RUNTIME=auto` من الـ harnesses المسجّلة ما إذا كانت تدعم الموفر/النموذج المحدد.
4. إذا لم تتطابق أي harness مسجّلة، يستخدم OpenClaw ‏PI ما لم يكن الرجوع الاحتياطي إلى PI معطّلًا.

تظهر إخفاقات plugin harness المفروضة كإخفاقات تشغيل. في وضع `auto`، قد يرجع OpenClaw إلى PI عندما تفشل plugin harness المحددة قبل أن تنتج الدورة أي آثار جانبية. اضبط `OPENCLAW_AGENT_HARNESS_FALLBACK=none` أو `embeddedHarness.fallback: "none"` لجعل هذا الرجوع الاحتياطي إخفاقًا صريحًا بدلًا من ذلك.

تسجّل plugin ‏Codex المضمّنة `codex` بوصفه معرّف harness الخاص بها. ويتعامل core مع ذلك على أنه معرّف plugin harness عادي؛ ويجب أن تبقى الأسماء المستعارة الخاصة بـ Codex داخل plugin أو إعدادات المشغّل، لا في محدد وقت التشغيل المشترك.

## إقران الموفر مع harness

ينبغي لمعظم الـ harnesses أيضًا تسجيل موفر. يجعل الموفر مراجع النماذج، وحالة المصادقة، والبيانات الوصفية للنموذج، واختيار `/model` مرئية لبقية OpenClaw. ثم تطالب harness بهذا الموفر في `supports(...)`.

تتبع plugin ‏Codex المضمّنة هذا النمط:

- معرّف الموفر: `codex`
- مراجع النماذج للمستخدم: `codex/gpt-5.4` و`codex/gpt-5.2` أو أي نموذج آخر يعيده خادم تطبيق Codex
- معرّف harness: `codex`
- المصادقة: توفر موفر اصطناعي، لأن harness ‏Codex تملك تسجيل الدخول/الجلسة الأصلية لـ Codex
- طلب خادم التطبيق: يرسل OpenClaw معرّف النموذج المجرد إلى Codex ويجعل harness تتحدث مع بروتوكول خادم التطبيق الأصلي

إن plugin ‏Codex إضافة تكميلية. تظل مراجع `openai/gpt-*` العادية مراجع لموفر OpenAI وتواصل استخدام مسار موفر OpenClaw العادي. اختر `codex/gpt-*` عندما تريد مصادقة مُدارة من Codex، واكتشاف نماذج Codex، وسلاسل رسائل أصلية، وتنفيذ خادم تطبيق Codex. يمكن لـ `/model` التبديل بين نماذج Codex التي يعيدها خادم تطبيق Codex دون الحاجة إلى بيانات اعتماد موفر OpenAI.

لإعدادات المشغّل، وأمثلة بادئات النماذج، وإعدادات Codex فقط، راجع
[Codex Harness](/ar/plugins/codex-harness).

يتطلب OpenClaw إصدار خادم تطبيق Codex `0.118.0` أو أحدث. تتحقق plugin ‏Codex من مصافحة تهيئة خادم التطبيق وتمنع الخوادم الأقدم أو غير ذات الإصدار حتى لا يعمل OpenClaw إلا مع سطح البروتوكول الذي تم اختباره معه.

## تعطيل الرجوع الاحتياطي إلى PI

افتراضيًا، يشغّل OpenClaw الوكلاء المضمّنين مع `agents.defaults.embeddedHarness`
مضبوطة على `{ runtime: "auto", fallback: "pi" }`. في وضع `auto`، يمكن لـ plugin harnesses المسجّلة المطالبة بزوج موفر/نموذج مطابق. إذا لم يتطابق أي منها، أو إذا فشلت plugin harness مختارة تلقائيًا قبل إنتاج مخرجات، يرجع OpenClaw إلى PI.

اضبط `fallback: "none"` عندما تحتاج إلى إثبات أن plugin harness هي بيئة التشغيل الوحيدة المستخدمة. يعطّل هذا الرجوع الاحتياطي التلقائي إلى PI؛ لكنه لا يمنع `runtime: "pi"` الصريح أو `OPENCLAW_AGENT_RUNTIME=pi`.

لتشغيلات مضمّنة خاصة بـ Codex فقط:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

إذا كنت تريد أن تطالب أي plugin harness مسجّلة بالنماذج المطابقة لكنك لا تريد أبدًا أن يرجع OpenClaw بصمت إلى PI، فأبقِ `runtime: "auto"` وعطّل الرجوع الاحتياطي:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

تستخدم التجاوزات الخاصة بكل وكيل البنية نفسها:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

لا يزال `OPENCLAW_AGENT_RUNTIME` يتجاوز وقت التشغيل المضبوط. استخدم
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` لتعطيل الرجوع الاحتياطي إلى PI من البيئة.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

مع تعطيل الرجوع الاحتياطي، تفشل الجلسة مبكرًا عندما لا تكون harness المطلوبة مسجّلة، أو لا تدعم الموفر/النموذج المحدد، أو تفشل قبل إنتاج آثار جانبية للدورة. وهذا مقصود في عمليات النشر الخاصة بـ Codex فقط وفي الاختبارات المباشرة التي يجب أن تثبت أن مسار خادم تطبيق Codex مستخدم فعلًا.

يتحكم هذا الإعداد فقط في agent harness المضمّنة. وهو لا يعطّل توجيه النماذج الخاص بالموفر للصور أو الفيديو أو الموسيقى أو TTS أو PDF أو غيرها.

## الجلسات الأصلية ونسخة السجل النصي

قد تحتفظ harness بمعرّف جلسة أصلي أو معرّف سلسلة رسائل أو رمز استئناف من جهة daemon. أبقِ هذا الربط مرتبطًا صراحةً بجلسة OpenClaw، واستمر في عكس مخرجات المساعد/الأداة المرئية للمستخدم إلى السجل النصي في OpenClaw.

يبقى السجل النصي في OpenClaw طبقة التوافق من أجل:

- سجل الجلسة المرئي للقنوات
- البحث في السجل النصي وفهرسته
- التبديل مجددًا إلى harness ‏PI المضمّنة في دورة لاحقة
- السلوك العام لـ `/new` و`/reset` وحذف الجلسة

إذا كانت harness تخزّن ربط sidecar، فنفّذ `reset(...)` حتى يتمكن OpenClaw من مسحه عند إعادة تعيين جلسة OpenClaw المالكة.

## نتائج الأدوات والوسائط

ينشئ core قائمة أدوات OpenClaw ويمررها إلى المحاولة المُعدّة مسبقًا. عندما تنفّذ harness استدعاء أداة ديناميكيًا، فأعد نتيجة الأداة عبر بنية نتيجة harness بدلًا من إرسال وسائط القناة بنفسك.

هذا يُبقي مخرجات النص والصورة والفيديو والموسيقى وTTS والموافقات وأدوات المراسلة على مسار التسليم نفسه مثل التشغيلات المعتمدة على PI.

## القيود الحالية

- مسار الاستيراد العام عامّ، لكن بعض الأسماء المستعارة لأنواع المحاولة/النتيجة ما تزال تحمل أسماء `Pi` للتوافق.
- تثبيت harness من طرف ثالث ما يزال تجريبيًا. فضّل provider plugins إلى أن تحتاج إلى بيئة جلسات أصلية.
- التبديل بين الـ harnesses مدعوم عبر الدورات. لا تبدّل الـ harnesses في منتصف الدورة بعد بدء الأدوات الأصلية أو الموافقات أو نص المساعد أو إرسال الرسائل.

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview)
- [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime)
- [Provider Plugins](/ar/plugins/sdk-provider-plugins)
- [Codex Harness](/ar/plugins/codex-harness)
- [موفرو النماذج](/ar/concepts/model-providers)
