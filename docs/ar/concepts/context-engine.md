---
read_when:
    - تريد أن تفهم كيف يقوم OpenClaw بتجميع سياق النموذج
    - أنت تنتقل بين المحرك القديم ومحرك Plugin
    - أنت تنشئ Plugin لمحرك السياق
summary: 'محرك السياق: تجميع سياق قابل للتوصيل، وCompaction، ودورة حياة الوكيل الفرعي'
title: محرك السياق
x-i18n:
    generated_at: "2026-04-24T07:37:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f4e5f01f945f7fe3056587f2aa60bec607dd0dd64b29e9ab2afe8e77b5d2f1e
    source_path: concepts/context-engine.md
    workflow: 15
---

يتحكم **محرك السياق** في كيفية بناء OpenClaw لسياق النموذج لكل تشغيل:
ما الرسائل التي يجب تضمينها، وكيفية تلخيص السجل الأقدم، وكيفية إدارة
السياق عبر حدود الوكلاء الفرعيين.

يأتي OpenClaw مع محرك مضمّن باسم `legacy` ويستخدمه افتراضيًا — معظم
المستخدمين لا يحتاجون أبدًا إلى تغيير هذا. قم بتثبيت واختيار محرك Plugin فقط عندما
تريد سلوكًا مختلفًا للتجميع أو Compaction أو الاستدعاء عبر الجلسات.

## بدء سريع

تحقق من المحرك النشط:

```bash
openclaw doctor
# or inspect config directly:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### تثبيت Plugin لمحرك السياق

يتم تثبيت Plugins الخاصة بمحرك السياق مثل أي Plugin أخرى في OpenClaw. قم بالتثبيت
أولًا، ثم اختر المحرك في الفتحة:

```bash
# Install from npm
openclaw plugins install @martian-engineering/lossless-claw

# Or install from a local path (for development)
openclaw plugins install -l ./my-context-engine
```

ثم قم بتمكين Plugin واخترها بوصفها المحرك النشط في إعداداتك:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // must match the plugin's registered engine id
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Plugin-specific config goes here (see the plugin's docs)
      },
    },
  },
}
```

أعد تشغيل gateway بعد التثبيت والإعداد.

للعودة إلى المحرك المضمّن، اضبط `contextEngine` على `"legacy"` (أو
احذف المفتاح بالكامل — `"legacy"` هي القيمة الافتراضية).

## كيف يعمل

في كل مرة يشغّل فيها OpenClaw مطالبة نموذج، يشارك محرك السياق في
أربع نقاط من دورة الحياة:

1. **الإدخال** — يُستدعى عند إضافة رسالة جديدة إلى الجلسة. يمكن للمحرك
   تخزين الرسالة أو فهرستها في مخزن البيانات الخاص به.
2. **التجميع** — يُستدعى قبل كل تشغيل للنموذج. يعيد المحرك مجموعة
   مرتبة من الرسائل (و`systemPromptAddition` اختيارية) تتلاءم ضمن
   ميزانية الرموز.
3. **Compaction** — يُستدعى عندما تمتلئ نافذة السياق، أو عندما يشغّل المستخدم
   `/compact`. يقوم المحرك بتلخيص السجل الأقدم لتحرير مساحة.
4. **بعد الدور** — يُستدعى بعد اكتمال التشغيل. يمكن للمحرك حفظ الحالة،
   أو تشغيل Compaction في الخلفية، أو تحديث الفهارس.

بالنسبة إلى Codex harness المضمّن غير المعتمد على ACP، يطبق OpenClaw دورة الحياة نفسها من
خلال إسقاط السياق المجمّع في تعليمات مطوّر Codex ومطالبة الدور الحالي. ولا يزال
Codex يملك سجل السلاسل الأصلي وCompaction الأصلي الخاص به.

### دورة حياة الوكيل الفرعي (اختيارية)

يستدعي OpenClaw خطافين اختياريين لدورة حياة الوكيل الفرعي:

- **prepareSubagentSpawn** — إعداد حالة سياق مشتركة قبل بدء
  تشغيل فرعي. يتلقى الخطاف مفاتيح جلسات الأصل/الفرع، و`contextMode`
  (`isolated` أو `fork`)، ومعرّفات/ملفات السجل المتاحة، وTTL اختيارية.
  إذا أعاد مقبض rollback، فإن OpenClaw يستدعيه عندما يفشل الإنشاء بعد
  نجاح الإعداد.
- **onSubagentEnded** — التنظيف عند اكتمال جلسة وكيل فرعي أو كنسها.

### إضافة مطالبة النظام

يمكن للطريقة `assemble` أن تعيد سلسلة `systemPromptAddition`. يقوم OpenClaw
بإضافتها في مقدمة مطالبة النظام الخاصة بالتشغيل. يتيح ذلك للمحركات حقن
إرشادات استدعاء ديناميكية، أو تعليمات استرجاع، أو تلميحات واعية بالسياق
من دون الحاجة إلى ملفات مساحة عمل ثابتة.

## المحرك القديم

يحافظ المحرك المضمّن `legacy` على سلوك OpenClaw الأصلي:

- **الإدخال**: لا شيء (يتولى مدير الجلسات حفظ الرسائل مباشرة).
- **التجميع**: تمرير مباشر (يتولى مسار sanitize → validate → limit
  الموجود في وقت التشغيل تجميع السياق).
- **Compaction**: يفوض إلى Compaction التلخيصية المضمّنة، التي تنشئ
  ملخصًا واحدًا للرسائل الأقدم وتحافظ على الرسائل الحديثة كما هي.
- **بعد الدور**: لا شيء.

لا يسجل المحرك القديم أدوات ولا يوفّر `systemPromptAddition`.

عندما لا تكون `plugins.slots.contextEngine` مضبوطة (أو كانت مضبوطة على `"legacy"`)،
يُستخدم هذا المحرك تلقائيًا.

## محركات Plugin

يمكن لـ Plugin تسجيل محرك سياق باستخدام Plugin API:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

ثم قم بتمكينه في الإعدادات:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### واجهة ContextEngine

الأعضاء المطلوبة:

| العضو              | النوع   | الغرض                                                  |
| ------------------ | ------- | ------------------------------------------------------ |
| `info`             | خاصية   | معرّف المحرك واسمه وإصداره وما إذا كان يملك Compaction |
| `ingest(params)`   | طريقة   | تخزين رسالة واحدة                                      |
| `assemble(params)` | طريقة   | بناء السياق لتشغيل نموذج (تعيد `AssembleResult`)       |
| `compact(params)`  | طريقة   | تلخيص/تقليل السياق                                     |

تعيد `assemble` قيمة `AssembleResult` تحتوي على:

- `messages` — الرسائل المرتبة التي ستُرسل إلى النموذج.
- `estimatedTokens` ‏(مطلوب، `number`) — تقدير المحرك لإجمالي
  الرموز في السياق المجمّع. يستخدم OpenClaw هذا لاتخاذ قرارات عتبة Compaction
  ولإعداد التقارير التشخيصية.
- `systemPromptAddition` ‏(اختياري، `string`) — تُضاف في مقدمة مطالبة النظام.

الأعضاء الاختياريون:

| العضو                         | النوع  | الغرض                                                                                                          |
| ----------------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | طريقة  | تهيئة حالة المحرك لجلسة. تُستدعى مرة واحدة عندما يرى المحرك جلسة لأول مرة (مثل استيراد السجل).                |
| `ingestBatch(params)`          | طريقة  | إدخال دور مكتمل كدفعة. تُستدعى بعد اكتمال التشغيل، مع جميع رسائل ذلك الدور دفعة واحدة.                       |
| `afterTurn(params)`            | طريقة  | أعمال دورة حياة ما بعد التشغيل (حفظ الحالة، تشغيل Compaction في الخلفية).                                    |
| `prepareSubagentSpawn(params)` | طريقة  | إعداد حالة مشتركة لجلسة فرعية قبل بدئها.                                                                      |
| `onSubagentEnded(params)`      | طريقة  | التنظيف بعد انتهاء وكيل فرعي.                                                                                  |
| `dispose()`                    | طريقة  | تحرير الموارد. تُستدعى أثناء إيقاف gateway أو إعادة تحميل Plugin — وليس لكل جلسة.                             |

### ownsCompaction

تتحكم `ownsCompaction` فيما إذا كان Compaction التلقائي المضمّن داخل المحاولة في Pi
يبقى مفعّلًا أثناء التشغيل:

- `true` — يملك المحرك سلوك Compaction. يعطّل OpenClaw
  Compaction التلقائي المضمّن في Pi لذلك التشغيل، وتكون
  دالة `compact()` في المحرك مسؤولة عن `/compact`، وCompaction استرداد
  الفائض، وأي Compaction استباقية يريد تنفيذها في `afterTurn()`.
- `false` أو غير مضبوطة — قد يستمر Compaction التلقائي المضمّن في Pi
  أثناء تنفيذ المطالبة، لكن تظل طريقة `compact()` في المحرك النشط
  تُستدعى من أجل `/compact` واسترداد الفائض.

لا تعني `ownsCompaction: false` أن OpenClaw يرجع تلقائيًا إلى
مسار Compaction الخاص بالمحرك القديم.

وهذا يعني أن هناك نمطين صالحين لـ Plugin:

- **وضع التملك** — نفّذ خوارزمية Compaction خاصة بك واضبط
  `ownsCompaction: true`.
- **وضع التفويض** — اضبط `ownsCompaction: false` واجعل `compact()` تستدعي
  `delegateCompactionToRuntime(...)` من `openclaw/plugin-sdk/core` لاستخدام
  سلوك Compaction المضمّن في OpenClaw.

تُعد `compact()` التي لا تفعل شيئًا غير آمنة لمحرك نشط غير مالك لأنها
تعطّل مسار `/compact` وCompaction استرداد الفائض المعتادين لتلك الفتحة من المحرك.

## مرجع الإعدادات

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

تكون الفتحة حصرية في وقت التشغيل — إذ يتم حل محرك سياق واحد مسجل فقط
لتشغيل أو عملية Compaction معيّنة. ولا تزال Plugins الأخرى المفعلة من نوع
`kind: "context-engine"` قادرة على التحميل وتشغيل
كود التسجيل الخاص بها؛ حيث تحدد `plugins.slots.contextEngine` فقط أي معرّف محرك
مسجل يحله OpenClaw عندما يحتاج إلى محرك سياق.

## العلاقة مع Compaction والذاكرة

- **Compaction** هي إحدى مسؤوليات محرك السياق. يفوض المحرك القديم
  إلى التلخيص المضمّن في OpenClaw. ويمكن لمحركات Plugin تنفيذ
  أي استراتيجية Compaction ‏(ملخصات DAG، والاسترجاع المتجهي، وما إلى ذلك).
- **Plugins الذاكرة** (`plugins.slots.memory`) منفصلة عن محركات السياق.
  توفّر Plugins الذاكرة البحث/الاسترجاع؛ بينما تتحكم محركات السياق في ما
  يراه النموذج. ويمكنهما العمل معًا — فقد يستخدم محرك السياق بيانات Plugin
  الذاكرة أثناء التجميع. وينبغي لمحركات Plugin التي تريد مسار مطالبة
  Active Memory تفضيل `buildMemorySystemPromptAddition(...)` من
  `openclaw/plugin-sdk/core`، إذ يحول مقاطع مطالبة الذاكرة النشطة
  إلى `systemPromptAddition` جاهزة للإضافة في المقدمة. وإذا احتاج المحرك إلى تحكم
  منخفض المستوى أكثر، فلا يزال بإمكانه سحب الأسطر الخام من
  `openclaw/plugin-sdk/memory-host-core` عبر
  `buildActiveMemoryPromptSection(...)`.
- لا يزال **تشذيب الجلسات** (اقتطاع نتائج الأدوات القديمة في الذاكرة)
  يعمل بغض النظر عن محرك السياق النشط.

## نصائح

- استخدم `openclaw doctor` للتحقق من أن محركك يتم تحميله بشكل صحيح.
- إذا كنت تبدّل بين المحركات، فإن الجلسات الحالية تستمر بسجلها الحالي.
  ويتولى المحرك الجديد العمليات المستقبلية.
- يتم تسجيل أخطاء المحرك وإظهارها في التشخيصات. وإذا فشل محرك Plugin
  في التسجيل أو تعذر حل معرّف المحرك المحدد، فإن OpenClaw
  لا يرجع تلقائيًا؛ بل تفشل العمليات حتى تصلح Plugin أو
  تعيد `plugins.slots.contextEngine` إلى `"legacy"`.
- لأغراض التطوير، استخدم `openclaw plugins install -l ./my-engine` لربط
  دليل Plugin محلي من دون نسخ.

راجع أيضًا: [Compaction](/ar/concepts/compaction)، [السياق](/ar/concepts/context)،
[Plugins](/ar/tools/plugin)، [Plugin manifest](/ar/plugins/manifest).

## ذو صلة

- [السياق](/ar/concepts/context) — كيف يُبنى السياق لأدوار الوكيل
- [بنية Plugin](/ar/plugins/architecture) — تسجيل Plugins لمحرك السياق
- [Compaction](/ar/concepts/compaction) — تلخيص المحادثات الطويلة
