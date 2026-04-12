---
read_when:
    - أنت تغيّر وقت تشغيل الوكيل المضمّن أو سجل Harness الخاص به
    - أنت تسجّل Harness وكيل من مكوّن إضافي مضمّن أو موثوق به
    - تحتاج إلى فهم كيفية ارتباط مكوّن Codex الإضافي بموفري النماذج
sidebarTitle: Agent Harness
summary: سطح SDK تجريبي للمكوّنات الإضافية التي تستبدل منفّذ الوكيل المضمّن منخفض المستوى
title: مكوّنات Harness الإضافية للوكيل
x-i18n:
    generated_at: "2026-04-12T00:18:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62b88fd24ce8b600179db27e16e8d764a2cd7a14e5c5df76374c33121aa5e365
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# مكوّنات Agent Harness الإضافية

يُعد **agent harness** المنفّذ منخفض المستوى لدورة واحدة مُحضّرة لوكيل OpenClaw.
وهو ليس موفر نماذج، وليس قناة، وليس سجل أدوات.

استخدم هذا السطح فقط للمكوّنات الإضافية الأصلية المضمّنة أو الموثوق بها. لا يزال
هذا التعاقد تجريبيًا لأن أنواع المعاملات تعكس عمدًا المنفّذ المضمّن الحالي.

## متى تستخدم harness

سجّل agent harness عندما تكون لعائلة نماذج ما بيئة جلسات أصلية خاصة بها
ويكون نقل موفر OpenClaw العادي تجريدًا غير مناسب.

أمثلة:

- خادم coding-agent أصلي يملك سلاسل التنفيذ والضغط
- CLI أو daemon محلي يجب أن يبث أحداث الخطة/الاستدلال/الأدوات الأصلية
- بيئة تشغيل نموذج تحتاج إلى معرّف استئناف خاص بها بالإضافة إلى
  نص جلسة OpenClaw

**لا** تسجّل harness لمجرد إضافة واجهة API جديدة لـ LLM. بالنسبة لواجهات
HTTP أو WebSocket العادية للنماذج، أنشئ [مكوّن provider إضافي](/ar/plugins/sdk-provider-plugins).

## ما الذي لا يزال core يملكه

قبل اختيار harness، يكون OpenClaw قد حدّد بالفعل:

- الموفر والنموذج
- حالة المصادقة في وقت التشغيل
- مستوى التفكير وميزانية السياق
- ملف النص/جلسة OpenClaw
- مساحة العمل وsandbox وسياسة الأدوات
- عمليات رد القناة وعمليات البث
- سياسة الرجوع إلى نموذج بديل والتبديل بين النماذج الحية

هذا التقسيم مقصود. يقوم harness بتشغيل محاولة مُحضّرة؛ ولا يختار
الموفرين، ولا يستبدل تسليم القنوات، ولا يبدّل النماذج بصمت.

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

يختار OpenClaw harness بعد تحديد الموفر/النموذج:

1. يفرض `OPENCLAW_AGENT_RUNTIME=<id>` استخدام harness مسجّل بهذا المعرّف.
2. يفرض `OPENCLAW_AGENT_RUNTIME=pi` استخدام harness المدمج PI.
3. يطلب `OPENCLAW_AGENT_RUNTIME=auto` من الـ harnesses المسجّلة ما إذا كانت تدعم
   الموفر/النموذج الذي تم تحديده.
4. إذا لم يطابق أي harness مسجّل، يستخدم OpenClaw PI ما لم يكن الرجوع إلى PI
   معطّلًا.

تظهر أعطال harness الخاص بالمكوّن الإضافي المفروض كأعطال تشغيل. في وضع `auto`،
قد يرجع OpenClaw إلى PI عندما يفشل harness المحدد من المكوّن الإضافي قبل أن
تنتج الدورة آثارًا جانبية. عيّن `OPENCLAW_AGENT_HARNESS_FALLBACK=none` أو
`embeddedHarness.fallback: "none"` لجعل هذا الرجوع فشلًا صارمًا بدلًا من ذلك.

يسجّل مكوّن Codex الإضافي المضمّن `codex` كمعرّف harness له. ويتعامل core مع ذلك
باعتباره معرّف harness عاديًا لمكوّن إضافي؛ أما الأسماء المستعارة الخاصة بـ Codex
فينبغي أن تكون ضمن المكوّن الإضافي أو إعدادات المشغّل، لا في محدد وقت التشغيل المشترك.

## إقران provider مع harness

ينبغي لمعظم الـ harnesses أيضًا تسجيل provider. يجعل provider مراجع النماذج،
وحالة المصادقة، وبيانات النموذج الوصفية، واختيار `/model` مرئية لباقي OpenClaw.
ثم يطالب harness بهذا الموفر في `supports(...)`.

يتبع مكوّن Codex الإضافي المضمّن هذا النمط:

- معرّف provider: `codex`
- مراجع النماذج للمستخدم: `codex/gpt-5.4` و`codex/gpt-5.2` أو نموذج آخر يعيده
  خادم تطبيق Codex
- معرّف harness: `codex`
- المصادقة: إتاحة موفر تركيبية، لأن Codex harness يملك تسجيل الدخول/الجلسة الأصلية لـ Codex
- طلب خادم التطبيق: يرسل OpenClaw معرّف النموذج المجرد إلى Codex ويترك
  لـ harness التحدث مع بروتوكول خادم التطبيق الأصلي

مكوّن Codex الإضافي ذو طبيعة إضافية. تظل مراجع `openai/gpt-*` العادية
مراجع لموفر OpenAI وتستمر في استخدام مسار موفر OpenClaw العادي. اختر `codex/gpt-*`
عندما تريد مصادقة مُدارة بواسطة Codex، واكتشاف نماذج Codex، وسلاسل تنفيذ أصلية،
وتنفيذ خادم تطبيق Codex. يمكن لـ `/model` التبديل بين نماذج Codex التي يعيدها
خادم تطبيق Codex من دون الحاجة إلى بيانات اعتماد موفر OpenAI.

لإعدادات المشغّل، وأمثلة بادئات النماذج، وإعدادات Codex فقط، راجع
[Codex Harness](/ar/plugins/codex-harness).

يتطلب OpenClaw إصدار Codex app-server `0.118.0` أو أحدث. يتحقق مكوّن Codex
الإضافي من مصافحة التهيئة مع app-server ويحظر الخوادم الأقدم أو غير المرقمة
حتى لا يعمل OpenClaw إلا على سطح البروتوكول الذي جرى اختباره معه.

### وضع Codex harness الأصلي

يُعد `codex` harness المضمّن وضع Codex الأصلي لدورات وكلاء OpenClaw المضمّنة.
فعّل مكوّن `codex` الإضافي المضمّن أولًا، وأدرج `codex` في
`plugins.allow` إذا كان إعدادك يستخدم قائمة سماح مقيّدة. وهو يختلف عن
`openai-codex/*`:

- يستخدم `openai-codex/*` OAuth الخاص بـ ChatGPT/Codex عبر مسار موفر OpenClaw العادي.
- يستخدم `codex/*` موفر Codex المضمّن ويوجّه الدورة عبر Codex
  app-server.

عند تشغيل هذا الوضع، يملك Codex معرّف سلسلة التنفيذ الأصلية، وسلوك الاستئناف،
والضغط، وتنفيذ app-server. ولا يزال OpenClaw يملك قناة الدردشة،
ومرآة النص الظاهرة، وسياسة الأدوات، والموافقات، وتسليم الوسائط، واختيار
الجلسة. استخدم `embeddedHarness.runtime: "codex"` مع
`embeddedHarness.fallback: "none"` عندما تحتاج إلى إثبات أن مسار Codex
app-server مستخدم وأن الرجوع إلى PI لا يخفي harness أصليًا معطّلًا.

## تعطيل الرجوع إلى PI

بشكل افتراضي، يشغّل OpenClaw الوكلاء المضمّنين مع تعيين `agents.defaults.embeddedHarness`
إلى `{ runtime: "auto", fallback: "pi" }`. في وضع `auto`، يمكن لـ harnesses
المسجّلة من المكوّنات الإضافية المطالبة بزوج موفر/نموذج. إذا لم يطابق أي منها،
أو إذا فشل harness لمكوّن إضافي تم اختياره تلقائيًا قبل إنتاج أي مخرجات،
يرجع OpenClaw إلى PI.

عيّن `fallback: "none"` عندما تحتاج إلى إثبات أن harness الخاص بالمكوّن الإضافي
هو وقت التشغيل الوحيد الجاري استخدامه. يؤدي ذلك إلى تعطيل الرجوع التلقائي إلى PI؛
لكنه لا يمنع `runtime: "pi"` الصريح أو `OPENCLAW_AGENT_RUNTIME=pi`.

لتشغيلات مضمّنة خاصة بـ Codex:

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

إذا كنت تريد أن تطالب أي harness مسجّل من المكوّنات الإضافية بالنماذج المطابقة ولكنك
لا تريد أبدًا أن يرجع OpenClaw بصمت إلى PI، فأبقِ `runtime: "auto"` وعطّل
الرجوع:

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

تستخدم عمليات التجاوز لكل وكيل الشكل نفسه:

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

لا يزال `OPENCLAW_AGENT_RUNTIME` يتجاوز وقت التشغيل المكوَّن. استخدم
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` لتعطيل الرجوع إلى PI من
البيئة.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

مع تعطيل الرجوع، تفشل الجلسة مبكرًا عندما لا يكون harness المطلوب
مسجّلًا، أو لا يدعم الموفر/النموذج الذي تم تحديده، أو يفشل قبل
إنتاج آثار جانبية للدورة. وهذا مقصود لعمليات النشر الخاصة بـ Codex فقط
ولاختبارات live التي يجب أن تثبت أن مسار Codex app-server قيد الاستخدام فعلًا.

يتحكم هذا الإعداد فقط في embedded agent harness. ولا يعطّل
توجيه النماذج الخاص بالموفر للصور أو الفيديو أو الموسيقى أو TTS أو PDF أو غيرها.

## الجلسات الأصلية ومرآة النص

قد يحتفظ harness بمعرّف جلسة أصلي، أو معرّف سلسلة تنفيذ، أو رمز استئناف
على جانب daemon. أبقِ هذا الارتباط مقترنًا صراحةً بجلسة OpenClaw، واستمر
في عكس مخرجات المساعد/الأداة الظاهرة للمستخدم إلى نص OpenClaw.

يبقى نص OpenClaw طبقة التوافق من أجل:

- سجل الجلسة الظاهر في القناة
- البحث في النص وفهرسته
- العودة إلى harness المدمج PI في دورة لاحقة
- السلوك العام لـ `/new` و`/reset` وحذف الجلسة

إذا كان harness يخزن ارتباطًا جانبيًا، فنفّذ `reset(...)` حتى يتمكن OpenClaw من
مسحه عند إعادة تعيين جلسة OpenClaw المالكة له.

## نتائج الأدوات والوسائط

يبني core قائمة أدوات OpenClaw ويمررها إلى المحاولة المُحضّرة.
عندما ينفّذ harness استدعاء أداة ديناميكيًا، أعد نتيجة الأداة عبر
صيغة نتيجة harness بدلًا من إرسال وسائط القناة بنفسك.

يحافظ ذلك على مخرجات النص والصورة والفيديو والموسيقى وTTS والموافقة وأدوات المراسلة
ضمن مسار التسليم نفسه كما في التشغيلات المدعومة بـ PI.

## القيود الحالية

- مسار الاستيراد العام عام، لكن بعض الأسماء المستعارة لأنواع المحاولة/النتيجة لا تزال
  تحمل أسماء `Pi` من أجل التوافق.
- تثبيت harnesses الخارجية تجريبي. فضّل مكوّنات provider الإضافية
  إلى أن تحتاج إلى بيئة جلسات أصلية.
- التبديل بين harnesses مدعوم عبر الدورات. لا تبدّل بين harnesses في
  منتصف الدورة بعد بدء الأدوات الأصلية أو الموافقات أو نص المساعد أو إرسال
  الرسائل.

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview)
- [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime)
- [مكوّنات Provider الإضافية](/ar/plugins/sdk-provider-plugins)
- [Codex Harness](/ar/plugins/codex-harness)
- [موفرو النماذج](/ar/concepts/model-providers)
