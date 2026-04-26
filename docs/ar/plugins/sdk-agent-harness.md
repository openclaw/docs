---
read_when:
    - أنت تغيّر runtime الوكيل المضمّن أو سجل harness
    - أنت تسجّل Agent harness من Plugin مضمّن أو موثوق
    - تحتاج إلى فهم كيفية ارتباط Plugin الخاص بـ Codex بـ providers الخاصة بالـ Model
sidebarTitle: Agent Harness
summary: سطح SDK تجريبي للـ Plugins التي تستبدل منفذ تنفيذ الوكيل المضمّن منخفض المستوى
title: Plugins أحزمة تشغيل الوكلاء
x-i18n:
    generated_at: "2026-04-26T11:36:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 340fc6207dabc6ffe7ffb9c07ca9e80e76f1034d4978c41279dc826468302181
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

إن **Agent harness** هو منفّذ التنفيذ منخفض المستوى لمحاولة واحدة مُحضَّرة
من دور وكيل OpenClaw. وهو ليس provider للـ model، وليس قناة، وليس سجلًا للأدوات.
وللنموذج الذهني الموجّه للمستخدم، راجع [Agent runtimes](/ar/concepts/agent-runtimes).

استخدم هذا السطح فقط مع Plugins الأصلية المضمّنة أو الموثوقة. ولا يزال هذا العقد
تجريبيًا لأن أنواع المعاملات تعكس عمدًا المشغّل المضمّن الحالي.

## متى تستخدم harness

سجّل Agent harness عندما تكون لعائلة model بيئة تشغيل جلسة أصلية خاصة بها
ويكون نقل provider العادي في OpenClaw هو التجريد غير المناسب.

أمثلة:

- خادم coding-agent أصلي يملك threads وCompaction
- CLI أو daemon محلي يجب أن يمرر أحداث plan/reasoning/tool الأصلية
- runtime للـ model يحتاج إلى resume id خاص به بالإضافة إلى transcript
  الجلسة في OpenClaw

**لا** تسجّل harness فقط لإضافة LLM API جديدة. بالنسبة إلى واجهات model APIs العادية عبر HTTP أو
WebSocket، ابنِ [Provider plugin](/ar/plugins/sdk-provider-plugins).

## ما الذي لا يزال core يملكه

قبل اختيار harness، يكون OpenClaw قد حل بالفعل:

- provider وmodel
- حالة مصادقة runtime
- مستوى التفكير وميزانية السياق
- transcript/ملف الجلسة الخاص بـ OpenClaw
- مساحة العمل، وsandbox، وسياسة الأدوات
- ردود القنوات الراجعة واستدعاءات البث الراجعة
- سياسة fallback الخاصة بالـ model وتبديل model الحي

هذا التقسيم مقصود. فـ harness يشغّل محاولة مُحضَّرة؛ وهو لا يختار
providers، ولا يستبدل تسليم القنوات، ولا يبدّل models بصمت.

تتضمن المحاولة المُحضَّرة أيضًا `params.runtimePlan`، وهي حزمة سياسات
مملوكة لـ OpenClaw لقرارات وقت التشغيل التي يجب أن تظل مشتركة بين PI وnative
harnesses:

- `runtimePlan.tools.normalize(...)` و
  `runtimePlan.tools.logDiagnostics(...)` لسياسة مخطط الأدوات الواعية بالـ provider
- `runtimePlan.transcript.resolvePolicy(...)` لسياسة تنقية transcript
  وإصلاح استدعاءات الأدوات
- `runtimePlan.delivery.isSilentPayload(...)` للمسارات المشتركة `NO_REPLY` وقمع
  تسليم الوسائط
- `runtimePlan.outcome.classifyRunResult(...)` لتصنيف fallback الخاص بالـ model
- `runtimePlan.observability` لبيانات provider/model/harness الوصفية المحلولة

يمكن لـ harnesses استخدام هذه الخطة في القرارات التي يجب أن تطابق سلوك PI، لكن
يجب أن تتعامل معها على أنها حالة محاولة يملكها المضيف. لا تعدّلها ولا تستخدمها
لتبديل providers/models داخل الدور الواحد.

## سجّل harness

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
    // ابدأ أو استأنف thread الأصلية لديك.
    // استخدم params.prompt وparams.tools وparams.images وparams.onPartialReply،
    // وparams.onAgentEvent، وغيرها من حقول المحاولة المُحضّرة.
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

يختار OpenClaw harness بعد حل provider/model:

1. يتغلب harness id المسجل لجلسة موجودة، حتى لا تؤدي تغييرات config/env
   إلى تبديل transcript تلك مباشرة إلى runtime أخرى.
2. تفرض `OPENCLAW_AGENT_RUNTIME=<id>` استخدام harness مسجلة بذلك المعرف للجلسات
   التي ليست مثبّتة بالفعل.
3. تفرض `OPENCLAW_AGENT_RUNTIME=pi` استخدام PI harness المضمّنة.
4. تطلب `OPENCLAW_AGENT_RUNTIME=auto` من harnesses المسجلة أن تجيب عمّا إذا كانت تدعم
   provider/model المحلولتَين.
5. إذا لم تتطابق أي harness مسجلة، يستخدم OpenClaw ‏PI ما لم يتم
   تعطيل PI fallback.

تظهر إخفاقات Plugin harness كإخفاقات تشغيل. وفي وضع `auto`، لا يُستخدم PI fallback
إلا عندما لا تدعم أي plugin harness مسجلة
provider/model المحلولتَين. وبمجرد أن تدّعي plugin harness تشغيلًا، لا يقوم OpenClaw
بإعادة تشغيل ذلك الدور نفسه عبر PI لأن ذلك قد يغير دلالات auth/runtime
أو يكرر آثارًا جانبية.

يُحفَظ harness id المحدد مع session id بعد تشغيل مضمّن.
وتُعامل الجلسات القديمة التي أُنشئت قبل تثبيت harnesses على أنها مثبّتة على PI بمجرد أن
يصبح لديها transcript history. استخدم جلسة جديدة/معاد ضبطها عند التبديل بين PI وnative plugin harness. يعرض `/status` معرّفات harness غير الافتراضية مثل `codex`
بجانب `Fast`; وتبقى PI مخفية لأنها مسار التوافق الافتراضي.
إذا بدا أن harness المحددة غير متوقعة، ففعّل تسجيل debug الخاص بـ `agents/harness` وافحص
السجل البنيوي في gateway بعنوان `agent harness selected`. فهو يتضمن
معرّف harness المحددة، وسبب الاختيار، وسياسة runtime/fallback، وفي
وضع `auto`، نتيجة الدعم الخاصة بكل مرشح Plugin.

يسجّل Plugin Codex المضمّن `codex` بوصفه harness id الخاص به. ويتعامل core مع ذلك
بوصفه معرّف plugin harness عاديًا؛ أما الأسماء المستعارة الخاصة بـ Codex فيجب أن توجد في Plugin
أو في إعدادات المشغّل، لا في محدد runtime المشترك.

## إقران provider مع harness

ينبغي لمعظم harnesses أيضًا تسجيل provider. فـ provider تجعل مراجع model،
وحالة auth، وبيانات model الوصفية، واختيار `/model` مرئية لبقية
OpenClaw. ثم تدّعي harness تلك provider داخل `supports(...)`.

يتبع Plugin Codex المضمّن هذا النمط:

- مراجع model المفضلة للمستخدم: `openai/gpt-5.5` مع
  `agentRuntime.id: "codex"`
- مراجع التوافق: لا تزال مراجع `codex/gpt-*` القديمة مقبولة، لكن
  لا ينبغي أن تستخدمها الإعدادات الجديدة كمراجع provider/model عادية
- harness id: `codex`
- auth: توفر provider اصطناعية، لأن Codex harness تملك
  تسجيل دخول/جلسة Codex الأصلية
- طلب app-server: يرسل OpenClaw معرّف model المجرد إلى Codex ويترك
  harness تتحدث مع بروتوكول app-server الأصلي

إن Plugin Codex إضافية. فالمراجع العادية `openai/gpt-*` تواصل استخدام
مسار provider العادي في OpenClaw ما لم تفرض Codex harness عبر
`agentRuntime.id: "codex"`. أما المراجع الأقدم `codex/gpt-*` فما تزال تختار
Codex provider وharness من أجل التوافق.

بالنسبة إلى إعداد المشغّل، وأمثلة بادئات model، والإعدادات الخاصة بـ Codex فقط، راجع
[Codex Harness](/ar/plugins/codex-harness).

يتطلب OpenClaw إصدار Codex app-server ‏`0.125.0` أو أحدث. ويتحقق Plugin Codex
من مصافحة التهيئة الخاصة بـ app-server ويحظر الخوادم الأقدم أو غير المرقمة حتى
لا يعمل OpenClaw إلا على سطح البروتوكول الذي جرى اختباره معه. ويتضمن
الحد الأدنى `0.125.0` دعم حمولة native MCP hook الذي وصل في
Codex ‏`0.124.0`، مع تثبيت OpenClaw على الخط الثابت الأحدث الذي تم اختباره.

### Middleware لنتائج الأدوات

يمكن للـ Plugins المضمّنة إرفاق middleware محايدة بالنسبة إلى runtime لنتائج الأدوات عبر
`api.registerAgentToolResultMiddleware(...)` عندما يعلن manifest الخاص بها
معرّفات runtime المستهدفة في `contracts.agentToolResultMiddleware`. هذا
الحد الموثوق مخصص لتحويلات نتائج الأدوات غير المتزامنة التي يجب أن تعمل قبل أن تقوم PI أو Codex
بإرجاع مخرجات الأدوات إلى model.

لا تزال الـ Plugins المضمّنة القديمة قادرة على استخدام
`api.registerCodexAppServerExtensionFactory(...)` كـ middleware
خاصة بـ Codex app-server فقط، لكن التحويلات الجديدة للنتائج يجب أن تستخدم API المحايدة بالنسبة إلى runtime.
لقد أزيل الخطاف `api.registerEmbeddedExtensionFactory(...)` الخاص بـ Pi فقط؛
ويجب أن تستخدم تحويلات نتائج الأدوات الخاصة بـ Pi middleware محايدة بالنسبة إلى runtime.

### تصنيف النتائج النهائية

يمكن للـ native harnesses التي تملك إسقاط البروتوكول الخاص بها استخدام
`classifyAgentHarnessTerminalOutcome(...)` من
`openclaw/plugin-sdk/agent-harness-runtime` عندما ينتج عن الدور المكتمل
عدم وجود نص مساعد مرئي. تعيد الأداة القيم `empty` أو `reasoning-only` أو
`planning-only` بحيث تستطيع سياسة fallback في OpenClaw أن تقرر ما إذا كانت ستعيد المحاولة على
model مختلفة. وهي تتعمد ترك أخطاء prompt، والدورات قيد التنفيذ، والردود الصامتة المقصودة
مثل `NO_REPLY` غير مصنفة.

### وضع native Codex harness

إن `codex` harness المضمّنة هي وضع Codex الأصلي لدورات
وكلاء OpenClaw المضمّنة. فعّل Plugin ‏`codex` المضمّنة أولًا، وضمّن `codex` في
`plugins.allow` إذا كانت إعداداتك تستخدم allowlist مقيدة. يجب أن تستخدم
إعدادات app-server الأصلية الصيغة `openai/gpt-*` مع `agentRuntime.id: "codex"`.
استخدم `openai-codex/*` لمصادقة Codex OAuth عبر PI بدلًا من ذلك. أما مراجع model القديمة `codex/*`
فتبقى أسماء مستعارة توافقية لـ native harness.

عندما يعمل هذا الوضع، يملك Codex معرّف thread الأصلي، وسلوك الاستئناف،
وCompaction، وتنفيذ app-server. ولا يزال OpenClaw يملك قناة الدردشة،
ومرآة transcript المرئية، وسياسة الأدوات، والموافقات، وتسليم الوسائط، واختيار الجلسة. استخدم `agentRuntime.id: "codex"` من دون تجاوز `fallback`
عندما تحتاج إلى إثبات أن مسار Codex app-server وحده هو القادر على امتلاك التشغيل.
فـ runtimes الصريحة للـ Plugin تفشل بشكل مغلق افتراضيًا بالفعل. اضبط `fallback: "pi"`
فقط عندما تريد عمدًا أن تتولى PI التعامل مع غياب اختيار harness. أما إخفاقات Codex
app-server فهي تفشل مباشرةً بالفعل بدلًا من إعادة المحاولة عبر PI.

## تعطيل PI fallback

افتراضيًا، يشغّل OpenClaw الوكلاء المضمّنين مع تعيين `agents.defaults.agentRuntime`
إلى `{ id: "auto", fallback: "pi" }`. وفي وضع `auto`، تستطيع plugin
harnesses المسجلة أن تدّعي زوج provider/model. وإذا لم يتطابق أي منها، يعود OpenClaw إلى PI.

في وضع `auto`، اضبط `fallback: "none"` عندما تحتاج إلى أن يؤدي غياب اختيار plugin harness
إلى الفشل بدلًا من استخدام PI. أما runtimes الصريحة للـ Plugin مثل
`runtime: "codex"` فهي تفشل بالفعل بشكل مغلق افتراضيًا، ما لم يتم ضبط `fallback: "pi"` في
النطاق نفسه من config أو تجاوزات البيئة. وتفشل إخفاقات plugin harness المحددة دائمًا بشكل حاسم. وهذا لا يمنع `runtime: "pi"` الصريح أو
`OPENCLAW_AGENT_RUNTIME=pi`.

بالنسبة إلى تشغيلات مضمّنة خاصة بـ Codex فقط:

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

إذا كنت تريد أن تتمكن أي plugin harness مسجلة من امتلاك models المطابقة لكنك لا تريد أبدًا
أن يعود OpenClaw بصمت إلى PI، فأبقِ `runtime: "auto"` وعطّل
fallback:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
      }
    }
  }
}
```

تستخدم التجاوزات لكل وكيل البنية نفسها:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

لا تزال `OPENCLAW_AGENT_RUNTIME` تتجاوز runtime المهيأة. استخدم
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` لتعطيل PI fallback من
البيئة.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

مع تعطيل fallback، تفشل الجلسة مبكرًا عندما لا تكون harness المطلوبة
مسجلة، أو لا تدعم provider/model المحلولتَين، أو تفشل قبل
إنتاج آثار جانبية للدور. وهذا مقصود في عمليات النشر الخاصة بـ Codex فقط و
في الاختبارات الحية التي يجب أن تثبت أن مسار Codex app-server مستخدم فعليًا.

يتحكم هذا الإعداد فقط في Agent harness المضمّنة. وهو لا يعطل
توجيه Models الخاصة بالصور، أو الفيديو، أو الموسيقى، أو TTS، أو PDF، أو غيرها من التوجيهات الخاصة بكل provider.

## الجلسات الأصلية ومرآة transcript

قد تحتفظ harness بـ native session id أو thread id أو daemon-side resume token.
احتفظ بهذا الارتباط مرتبطًا صراحة بجلسة OpenClaw، وواصل
عكس مخرجات assistant/tool الظاهرة للمستخدم إلى transcript الخاصة بـ OpenClaw.

تبقى transcript الخاصة بـ OpenClaw طبقة التوافق من أجل:

- سجل الجلسة الظاهر في القناة
- البحث في transcripts وفهرستها
- العودة إلى PI harness المضمّنة في دور لاحق
- سلوك `/new` و`/reset` وحذف الجلسة بشكل عام

إذا كانت harness الخاصة بك تخزن sidecar binding، فنفّذ `reset(...)` حتى يستطيع OpenClaw
مسحه عند إعادة ضبط جلسة OpenClaw المالكة.

## نتائج الأدوات والوسائط

يبني core قائمة أدوات OpenClaw ويمررها إلى المحاولة المُحضّرة.
وعندما تنفذ harness استدعاء أداة ديناميكيًا، فأعِد نتيجة الأداة عبر
بنية نتيجة harness بدلًا من إرسال وسائط القناة بنفسك.

وهذا يُبقي مخرجات النص، والصورة، والفيديو، والموسيقى، وTTS، والموافقات، وأدوات المراسلة
على مسار التسليم نفسه الخاص بالتشغيلات المدعومة من PI.

## القيود الحالية

- إن مسار الاستيراد العام عام، لكن بعض الأسماء المستعارة لأنواع المحاولة/النتيجة لا تزال
  تحمل أسماء `Pi` من أجل التوافق.
- إن تثبيت harnesses من جهات خارجية لا يزال تجريبيًا. فضّل Provider plugins
  إلى أن تحتاج إلى native session runtime.
- يدعم تبديل harness عبر الأدوار. لا تبدّل harnesses في
  منتصف الدور بعد بدء الأدوات الأصلية، أو الموافقات، أو نص المساعد، أو
  إرسال الرسائل.

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview)
- [مساعدات Runtime](/ar/plugins/sdk-runtime)
- [Provider Plugins](/ar/plugins/sdk-provider-plugins)
- [Codex Harness](/ar/plugins/codex-harness)
- [Model Providers](/ar/concepts/model-providers)
