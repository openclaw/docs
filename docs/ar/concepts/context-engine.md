---
read_when:
    - تريد أن تفهم كيف يجمع OpenClaw سياق النموذج
    - أنت تبدّل بين المحرّك القديم ومحرّك Plugin
    - أنت تبني Plugin لمحرك السياق
sidebarTitle: Context engine
summary: 'محرك السياق: تجميع سياق قابل للتوصيل، وCompaction، ودورة حياة الوكيل الفرعي'
title: محرك السياق
x-i18n:
    generated_at: "2026-06-30T14:05:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0ed65cbb72b14b1a6e8d4d9a394f730a48ada35d77e34c12b3356162b281eec
    source_path: concepts/context-engine.md
    workflow: 16
---

يتحكم **محرك السياق** في كيفية بناء OpenClaw لسياق النموذج لكل تشغيل: أي الرسائل يجب تضمينها، وكيفية تلخيص السجل الأقدم، وكيفية إدارة السياق عبر حدود الوكلاء الفرعيين.

يأتي OpenClaw مع محرك `legacy` مدمج ويستخدمه افتراضيًا - لا يحتاج معظم المستخدمين إلى تغيير ذلك. ثبّت محرك Plugin وحدده فقط عندما تريد سلوكًا مختلفًا للتجميع أو Compaction أو الاستدعاء عبر الجلسات.

## البدء السريع

<Steps>
  <Step title="Check which engine is active">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Install a plugin engine">
    تُثبّت Plugins محرك السياق مثل أي OpenClaw Plugin آخر.

    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="From a local path">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Enable and select the engine">
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

    أعد تشغيل Gateway بعد التثبيت والتهيئة.

  </Step>
  <Step title="Switch back to legacy (optional)">
    اضبط `contextEngine` على `"legacy"` (أو أزل المفتاح بالكامل - `"legacy"` هو الافتراضي).
  </Step>
</Steps>

## كيف يعمل

في كل مرة يشغّل فيها OpenClaw مطالبة نموذج، يشارك محرك السياق في أربع نقاط من دورة الحياة:

<AccordionGroup>
  <Accordion title="1. Ingest">
    يُستدعى عند إضافة رسالة جديدة إلى الجلسة. يمكن للمحرك تخزين الرسالة أو فهرستها في مخزن البيانات الخاص به.
  </Accordion>
  <Accordion title="2. Assemble">
    يُستدعى قبل كل تشغيل للنموذج. يعيد المحرك مجموعة مرتبة من الرسائل (و`systemPromptAddition` اختياريًا) تلائم ميزانية الرموز.
  </Accordion>
  <Accordion title="3. Compact">
    يُستدعى عندما تمتلئ نافذة السياق، أو عندما يشغّل المستخدم `/compact`. يلخص المحرك السجل الأقدم لتحرير مساحة.
  </Accordion>
  <Accordion title="4. After turn">
    يُستدعى بعد اكتمال التشغيل. يمكن للمحرك حفظ الحالة، أو تشغيل Compaction في الخلفية، أو تحديث الفهارس.
  </Accordion>
</AccordionGroup>

بالنسبة إلى حزمة Codex غير ACP المضمّنة، يطبق OpenClaw دورة الحياة نفسها عبر إسقاط السياق المجمّع في تعليمات مطوّر Codex ومطالبة الدور الحالي. يظل Codex مالكًا لسجل المحادثة الأصلي وCompactor الأصلي الخاص به.

### دورة حياة الوكيل الفرعي (اختياري)

يستدعي OpenClaw خطافي دورة حياة اختياريين للوكلاء الفرعيين:

<ParamField path="prepareSubagentSpawn" type="method">
  حضّر حالة السياق المشتركة قبل بدء تشغيل فرعي. يتلقى الخطاف مفاتيح جلسة الأصل/الفرع، و`contextMode` (`isolated` أو `fork`)، ومعرّفات/ملفات النص المتاحة، وTTL اختياريًا. إذا أعاد مقبض تراجع، يستدعيه OpenClaw عندما يفشل الإنشاء بعد نجاح التحضير. تتخطى عمليات إنشاء الوكيل الفرعي الأصلية التي تطلب `lightContext` وتُحل إلى `contextMode="isolated"` هذا الخطاف عمدًا لكي يبدأ الفرع من سياق تمهيد خفيف الوزن بدون حالة ما قبل الإنشاء المُدارة بواسطة محرك السياق.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  نظّف الموارد عند اكتمال جلسة وكيل فرعي أو كنسها.
</ParamField>

### إضافة مطالبة النظام

يمكن لطريقة `assemble` أن تعيد سلسلة `systemPromptAddition`. يضيف OpenClaw هذه السلسلة في بداية مطالبة النظام للتشغيل. يتيح ذلك للمحركات حقن إرشادات استدعاء ديناميكية، أو تعليمات استرجاع، أو تلميحات واعية بالسياق دون الحاجة إلى ملفات مساحة عمل ثابتة.

## المحرك legacy

يحافظ المحرك `legacy` المدمج على السلوك الأصلي لـ OpenClaw:

- **الإدخال**: بلا إجراء (يتولى مدير الجلسة حفظ الرسائل مباشرة).
- **التجميع**: تمرير مباشر (يتولى خط sanitize → validate → limit الحالي في وقت التشغيل تجميع السياق).
- **Compaction**: يفوض إلى Compaction التلخيص المدمج، الذي ينشئ ملخصًا واحدًا للرسائل الأقدم ويحافظ على الرسائل الحديثة كما هي.
- **بعد الدور**: بلا إجراء.

لا يسجل المحرك legacy أدوات ولا يوفر `systemPromptAddition`.

عندما لا يتم تعيين `plugins.slots.contextEngine` (أو يكون معينًا إلى `"legacy"`)، يُستخدم هذا المحرك تلقائيًا.

## محركات Plugin

يمكن لـ Plugin تسجيل محرك سياق باستخدام واجهة Plugin API:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
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

يتضمن المصنع `ctx` قيم `config` و`agentDir` و`workspaceDir` الاختيارية
حتى تتمكن Plugins من تهيئة حالة لكل وكيل أو لكل مساحة عمل قبل تشغيل
أول خطاف في دورة الحياة.

ثم فعّله في الإعدادات:

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

| العضو              | النوع    | الغرض                                                    |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | خاصية    | معرّف المحرك واسمه وإصداره وما إذا كان يملك Compaction |
| `ingest(params)`   | طريقة    | تخزين رسالة واحدة                                       |
| `assemble(params)` | طريقة    | بناء السياق لتشغيل نموذج (يعيد `AssembleResult`)       |
| `compact(params)`  | طريقة    | تلخيص/تقليل السياق                                      |

تعيد `assemble` قيمة `AssembleResult` مع:

<ParamField path="messages" type="Message[]" required>
  الرسائل المرتبة لإرسالها إلى النموذج.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  تقدير المحرك لإجمالي الرموز في السياق المجمّع. يستخدم OpenClaw ذلك لقرارات عتبة Compaction وإعداد التقارير التشخيصية.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  تُضاف في بداية مطالبة النظام.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  يتحكم في تقدير الرموز الذي يستخدمه المشغّل لفحوصات فيضان السياق
  الاستباقية. الإعداد الافتراضي هو `"assembled"`، ما يعني أن تقدير
  المطالبة المجمّعة فقط يُفحص للمحركات التي لا تملك Compaction.
  تدير المحركات التي تضبط `ownsCompaction: true` إدخال المطالبة الخاص بها،
  لذلك يتخطى OpenClaw فحص ما قبل المطالبة العام افتراضيًا. اضبط
  `"preassembly_may_overflow"` فقط عندما يمكن أن يخفي العرض المجمّع لديك
  خطر الفيضان في النص الأساسي؛ عندها يبقي المشغّل الفحص العام نشطًا ويأخذ
  الحد الأقصى بين التقدير المجمّع وتقدير سجل الجلسة قبل التجميع (غير المحدد
  بنافذة) عند اتخاذ قرار بتنفيذ Compaction استباقيًا. في كلتا الحالتين، تظل
  الرسائل التي تعيدها هي ما يراه النموذج - لا يؤثر `promptAuthority` إلا في الفحص المسبق.
</ParamField>

تعيد `compact` قيمة `CompactResult`. عندما تدوّر Compaction النص النشط،
يحدد `result.sessionId` و`result.sessionFile` الجلسة اللاحقة التي يجب أن
تستخدمها إعادة المحاولة أو الدور التالي.

الأعضاء الاختيارية:

| العضو                         | النوع  | الغرض                                                                                                             |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | طريقة  | تهيئة حالة المحرك لجلسة. تُستدعى مرة واحدة عندما يرى المحرك جلسة لأول مرة (مثلًا، استيراد السجل).               |
| `ingestBatch(params)`          | طريقة  | إدخال دور مكتمل كدفعة. تُستدعى بعد اكتمال تشغيل، مع جميع الرسائل من ذلك الدور دفعة واحدة.                      |
| `afterTurn(params)`            | طريقة  | عمل دورة حياة ما بعد التشغيل (حفظ الحالة، تشغيل Compaction في الخلفية).                                          |
| `prepareSubagentSpawn(params)` | طريقة  | إعداد حالة مشتركة لجلسة فرعية قبل أن تبدأ.                                                                       |
| `onSubagentEnded(params)`      | طريقة  | التنظيف بعد انتهاء وكيل فرعي.                                                                                    |
| `dispose()`                    | طريقة  | تحرير الموارد. تُستدعى أثناء إيقاف Gateway أو إعادة تحميل Plugin - وليس لكل جلسة.                              |

### إعدادات وقت التشغيل

تتلقى خطافات دورة الحياة التي تعمل داخل OpenClaw كائن
`runtimeSettings` اختياريًا. إنه سطح API داخلي للمنتج/المستهلك، بإصدارات
وقراءة فقط: ينتجه OpenClaw لمحرك السياق المحدد، ويستهلكه محرك السياق داخل
خطافات دورة الحياة. لا يُعرض مباشرة للمستخدمين ولا ينشئ سطحًا مخصصًا للتقارير.

- `schemaVersion`: حاليًا `1`
- `runtime`: مضيف OpenClaw، وضع وقت التشغيل (`normal` أو `fallback` أو
  `degraded`)، ومعرّفات الحزمة/وقت التشغيل الاختيارية
- `contextEngineSelection`: معرّف محرك السياق المحدد ومصدر التحديد
- `executionHost`: معرّف المضيف وتسميته للسطح الذي يستدعي الخطاف
- `model`: النموذج المطلوب، والنموذج المحلول، والمزوّد، وعائلة النموذج الاختيارية
- `limits`: ميزانية رموز المطالبة والحد الأقصى لرموز الإخراج عند معرفتها
- `diagnostics`: رموز أسباب fallback وdegraded المغلقة عند معرفتها

تُمثل الحقول التي يمكن أن تكون غير معروفة بقيمة `null`؛ وتبقى حقول التمييز
مثل وضع وقت التشغيل ومصدر التحديد غير قابلة للقيمة null. تظل المحركات الأقدم
متوافقة: إذا رفض محرك legacy صارم `runtimeSettings` كخاصية غير معروفة،
يعيد OpenClaw محاولة استدعاء دورة الحياة بدونها بدلًا من عزل المحرك.

### متطلبات المضيف

يمكن لمحركات السياق إعلان متطلبات قدرات المضيف في `info.hostRequirements`.
يفحص OpenClaw هذه المتطلبات قبل بدء العملية ويفشل مغلقًا مع خطأ وصفي
عندما لا يستطيع وقت التشغيل المحدد تلبيتها.

لتشغيلات الوكيل، أعلن `assemble-before-prompt` عندما يجب أن يتحكم المحرك في
مطالبة النموذج الفعلية عبر `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use the native Codex or OpenClaw embedded runtime, or select the legacy context engine.",
    },
  },
}
```

تلبي تشغيلات الوكيل الأصلية في Codex وOpenClaw المدمج `assemble-before-prompt`.
أما خلفيات CLI العامة فلا تفعل ذلك، لذلك تُرفض المحركات التي تتطلبها قبل بدء
عملية CLI.

### عزل الفشل

يعزل OpenClaw محرك Plugin المحدد عن مسار الرد الأساسي. إذا كان
محرك غير قديم مفقودًا، أو فشل في التحقق من العقد، أو رمى خطأ أثناء إنشاء
المصنع، أو رمى خطأ من طريقة دورة حياة، يعزل OpenClaw ذلك المحرك
لعملية Gateway الحالية ويخفض عمل محرك السياق إلى
المحرك المدمج `legacy`. يُسجَّل الخطأ مع العملية الفاشلة حتى يتمكن
المشغّل من إصلاح Plugin أو تحديثه أو تعطيله من دون أن يتوقف الوكيل
عن الرد.

تختلف حالات فشل متطلبات المضيف: عندما يعلن محرك أن بيئة تشغيل
تفتقر إلى قدرة مطلوبة، يفشل OpenClaw بإغلاق آمن قبل بدء التشغيل. وهذا
يحمي المحركات التي قد تفسد الحالة إذا عملت في مضيف غير مدعوم.

### ownsCompaction

يتحكم `ownsCompaction` فيما إذا كان الضغط التلقائي المدمج داخل المحاولة في وقت تشغيل OpenClaw يبقى مفعّلًا للتشغيل:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    يمتلك المحرك سلوك الضغط. يعطّل OpenClaw الضغط التلقائي المدمج في وقت تشغيل OpenClaw وفحص ما قبل تجاوز سعة الموجّه العام لذلك التشغيل، ويكون تنفيذ `compact()` الخاص بالمحرك مسؤولًا عن `/compact`، وضغط الاسترداد من تجاوز سعة المزوّد، وأي ضغط استباقي يريد تنفيذه في `afterTurn()`. يظل OpenClaw يشغّل حماية تجاوز سعة ما قبل الموجّه عندما يعيد المحرك `promptAuthority: "preassembly_may_overflow"` من `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    قد يظل الضغط التلقائي المدمج في وقت تشغيل OpenClaw يعمل أثناء تنفيذ الموجّه، لكن طريقة `compact()` الخاصة بالمحرك النشط تظل تُستدعى من أجل `/compact` واسترداد تجاوز السعة.
  </Accordion>
</AccordionGroup>

<Warning>
لا يعني `ownsCompaction: false` أن OpenClaw يعود تلقائيًا إلى مسار الضغط الخاص بالمحرك القديم.
</Warning>

هذا يعني أن هناك نمطين صالحين للـ Plugin:

<Tabs>
  <Tab title="Owning mode">
    نفّذ خوارزمية الضغط الخاصة بك واضبط `ownsCompaction: true`.
  </Tab>
  <Tab title="Delegating mode">
    اضبط `ownsCompaction: false` واجعل `compact()` يستدعي `delegateCompactionToRuntime(...)` من `openclaw/plugin-sdk/core` لاستخدام سلوك الضغط المدمج في OpenClaw.
  </Tab>
</Tabs>

يُعد تنفيذ `compact()` الذي لا يفعل شيئًا غير آمن لمحرك نشط لا يمتلك الضغط، لأنه يعطّل مسار الضغط العادي لـ `/compact` واسترداد تجاوز السعة في خانة ذلك المحرك.

## مرجع الإعداد

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

<Note>
الخانة حصرية وقت التشغيل - لا يُحلّ إلا محرك سياق واحد مسجل لتشغيل أو عملية ضغط معينة. لا يزال بإمكان Plugins أخرى مفعّلة من النوع `kind: "context-engine"` التحميل وتشغيل كود التسجيل الخاص بها؛ يحدد `plugins.slots.contextEngine` فقط معرّف المحرك المسجل الذي يحلّه OpenClaw عندما يحتاج إلى محرك سياق.
</Note>

<Note>
**إلغاء تثبيت Plugin:** عندما تلغي تثبيت Plugin المحدد حاليًا كـ `plugins.slots.contextEngine`، يعيد OpenClaw ضبط الخانة إلى القيمة الافتراضية (`legacy`). ينطبق سلوك إعادة الضبط نفسه على `plugins.slots.memory`. لا يلزم تعديل الإعداد يدويًا.
</Note>

## العلاقة بالضغط والذاكرة

<AccordionGroup>
  <Accordion title="Compaction">
    يُعد Compaction إحدى مسؤوليات محرك السياق. يفوّض المحرك القديم إلى التلخيص المدمج في OpenClaw. يمكن لمحركات Plugin تنفيذ أي استراتيجية ضغط، مثل ملخصات DAG، والاسترجاع المتجهي، وغير ذلك.
  </Accordion>
  <Accordion title="Memory plugins">
    تكون Plugins الذاكرة (`plugins.slots.memory`) منفصلة عن محركات السياق. توفر Plugins الذاكرة البحث/الاسترجاع؛ وتتحكم محركات السياق فيما يراه النموذج. يمكنها العمل معًا - فقد يستخدم محرك سياق بيانات Plugin الذاكرة أثناء التجميع. ينبغي لمحركات Plugin التي تريد مسار موجّه الذاكرة النشط تفضيل `buildMemorySystemPromptAddition(...)` من `openclaw/plugin-sdk/core`، الذي يحوّل أقسام موجّه الذاكرة النشطة إلى `systemPromptAddition` جاهز للإضافة في المقدمة. إذا احتاج محرك إلى تحكم أدنى مستوى، فلا يزال بإمكانه سحب الأسطر الخام من `openclaw/plugin-sdk/memory-host-core` عبر `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Session pruning">
    يظل تقليم نتائج الأدوات القديمة في الذاكرة يعمل بغض النظر عن محرك السياق النشط.
  </Accordion>
</AccordionGroup>

## نصائح

- استخدم `openclaw doctor` للتحقق من أن محركك يُحمَّل بشكل صحيح.
- عند تبديل المحركات، تستمر الجلسات الحالية بسجلها الحالي. يتولى المحرك الجديد التشغيلات المستقبلية.
- تُسجَّل أخطاء المحرك ويُعزل محرك Plugin المحدد لعملية Gateway الحالية. يعود OpenClaw إلى `legacy` لدورات المستخدم حتى تستمر الردود، لكن ينبغي لك مع ذلك إصلاح Plugin المعطّل أو تحديثه أو تعطيله أو إلغاء تثبيته.
- للتطوير، استخدم `openclaw plugins install -l ./my-engine` لربط دليل Plugin محلي من دون نسخه.

## ذو صلة

- [Compaction](/ar/concepts/compaction) - تلخيص المحادثات الطويلة
- [السياق](/ar/concepts/context) - كيف يُبنى السياق لدورات الوكيل
- [بنية Plugin](/ar/plugins/architecture) - تسجيل Plugins محرك السياق
- [بيان Plugin](/ar/plugins/manifest) - حقول بيان Plugin
- [Plugins](/ar/tools/plugin) - نظرة عامة على Plugin
