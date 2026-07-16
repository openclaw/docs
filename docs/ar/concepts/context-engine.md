---
read_when:
    - تريد فهم كيفية تجميع OpenClaw لسياق النموذج
    - أنت تتنقل بين المحرك القديم ومحرك Plugin
    - أنت تبني Plugin لمحرك السياق
sidebarTitle: Context engine
summary: 'محرك السياق: تجميع قابل للتوسعة للسياق، وCompaction، ودورة حياة الوكيل الفرعي'
title: محرك السياق
x-i18n:
    generated_at: "2026-07-16T13:43:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 05cb5eb01f002001354dc63b77cdb86f3e9f3bc51722bd943ac20c9e1566dc60
    source_path: concepts/context-engine.md
    workflow: 16
---

A **محرك السياق** يتحكم في كيفية بناء OpenClaw لسياق النموذج لكل تشغيل: أي الرسائل يجب تضمينها، وكيفية تلخيص السجل الأقدم، وكيفية إدارة السياق عبر حدود الوكلاء الفرعيين.

يأتي OpenClaw مزودًا بمحرك `legacy` مدمج ويستخدمه افتراضيًا. لا تثبّت محرك Plugin وتحدده إلا عندما تريد سلوكًا مختلفًا في التجميع أو Compaction أو الاستدعاء عبر الجلسات.

## البدء السريع

<Steps>
  <Step title="تحقق من المحرك النشط">
    ```bash
    openclaw doctor
    # أو افحص الإعدادات مباشرةً:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="ثبّت محرك Plugin">
    تُثبَّت Plugins محرك السياق مثل أي Plugin آخر في OpenClaw.

    <Tabs>
      <Tab title="من npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="من مسار محلي">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="فعّل المحرك وحدده">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // يجب أن يطابق معرّف المحرك المسجّل في Plugin
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // توضع هنا الإعدادات الخاصة بـ Plugin (راجع وثائق Plugin)
          },
        },
      },
    }
    ```

    أعد تشغيل Gateway بعد التثبيت والتهيئة.

  </Step>
  <Step title="عُد إلى المحرك القديم (اختياري)">
    اضبط `contextEngine` على `"legacy"` (أو احذف المفتاح تمامًا، إذ إن `"legacy"` هو الإعداد الافتراضي).
  </Step>
</Steps>

## آلية العمل

في كل مرة يشغّل فيها OpenClaw مطالبة نموذج، يشارك محرك السياق عند أربع نقاط في دورة الحياة:

<AccordionGroup>
  <Accordion title="1. الاستيعاب">
    يُستدعى عند إضافة رسالة جديدة إلى الجلسة. يمكن للمحرك تخزين الرسالة أو فهرستها في مخزن بياناته.
  </Accordion>
  <Accordion title="2. التجميع">
    يُستدعى قبل كل تشغيل للنموذج. يعيد المحرك مجموعة مرتبة من الرسائل (و`systemPromptAddition` اختياريًا) ضمن ميزانية الرموز.
  </Accordion>
  <Accordion title="3. Compaction">
    يُستدعى عند امتلاء نافذة السياق، أو عندما يشغّل المستخدم `/compact`. يلخّص المحرك السجل الأقدم لإخلاء مساحة.
  </Accordion>
  <Accordion title="4. بعد الدور">
    يُستدعى بعد اكتمال التشغيل. يمكن للمحرك حفظ الحالة، أو تشغيل Compaction في الخلفية، أو تحديث الفهارس.
  </Accordion>
</AccordionGroup>

يمكن للمحركات أيضًا تنفيذ التابع الاختياري `maintain()` لصيانة النص المنسوخ (إعادة كتابة آمنة عبر `runtimeContext.rewriteTranscriptEntries()`) بعد التمهيد، أو دور ناجح، أو Compaction. اضبط `info.turnMaintenanceMode: "background"` لتشغيله كعمل مؤجل بدلًا من حظر الرد.

بالنسبة إلى عُدّة Codex المضمّنة غير التابعة لـ ACP، يطبّق OpenClaw دورة الحياة نفسها من خلال إسقاط السياق المجمّع في تعليمات مطوّر Codex ومطالبة الدور الحالي. يظل Codex مسؤولًا عن سجل سلسلة المحادثة الأصلي وأداة Compaction الأصلية الخاصة به.

### دورة حياة الوكيل الفرعي (اختيارية)

يستدعي OpenClaw خطافي دورة حياة اختياريين للوكلاء الفرعيين:

<ParamField path="prepareSubagentSpawn" type="method">
  يُعِد حالة السياق المشتركة قبل بدء تشغيل فرعي. يتلقى الخطاف مفاتيح جلسة الأصل/الفرع، و`contextMode` ‏(`isolated` أو `fork`) ومعرّفات/ملفات النصوص المنسوخة المتاحة ومدة TTL اختيارية. إذا أعاد مقبض تراجع، يستدعيه OpenClaw عندما يفشل إنشاء الفرع بعد نجاح الإعداد. تتخطى عمدًا عمليات إنشاء الوكلاء الفرعيين الأصلية التي تطلب `lightContext` وتُحل إلى `contextMode="isolated"` هذا الخطاف، لكي يبدأ الفرع من سياق التمهيد الخفيف من دون حالة مُدارة بواسطة محرك السياق قبل الإنشاء.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  ينظّف الموارد عند اكتمال جلسة وكيل فرعي أو إزالتها.
</ParamField>

### إضافة مطالبة النظام

يمكن للتابع `assemble` إعادة سلسلة `systemPromptAddition`. يضيف OpenClaw هذه السلسلة إلى بداية مطالبة النظام الخاصة بالتشغيل. يتيح ذلك للمحركات إدخال إرشادات استدعاء ديناميكية، أو تعليمات استرجاع، أو تلميحات مدركة للسياق من دون الحاجة إلى ملفات ثابتة في مساحة العمل.

## المحرك القديم

يحافظ محرك `legacy` المدمج على سلوك OpenClaw الأصلي:

- **الاستيعاب**: لا ينفّذ أي إجراء (يتولى مدير الجلسة حفظ الرسائل مباشرةً).
- **التجميع**: تمرير مباشر (يتولى المسار الحالي للتنقية ← التحقق ← التقييد في بيئة التشغيل تجميع السياق).
- **Compaction**: يفوّض إلى Compaction التلخيصي المدمج، الذي ينشئ ملخصًا واحدًا للرسائل الأقدم ويُبقي الرسائل الحديثة كما هي.
- **بعد الدور**: لا ينفّذ أي إجراء.

لا يسجّل المحرك القديم أدوات ولا يوفّر `systemPromptAddition`.

عندما لا يكون `plugins.slots.contextEngine` مضبوطًا (أو يكون مضبوطًا على `"legacy"`) يُستخدم هذا المحرك تلقائيًا.

## محركات Plugins

يمكن لـ Plugin تسجيل محرك سياق باستخدام واجهة برمجة تطبيقات Plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // خزّن الرسالة في مخزن بياناتك
      return { ingested: true };
    },

    async assemble({
      sessionId,
      sessionKey,
      messages,
      tokenBudget,
      availableTools,
      citationsMode,
    }) {
      // أعِد الرسائل التي تلائم الميزانية
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // لخّص السياق الأقدم
      return { ok: true, compacted: true };
    },
  }));
}
```

يتضمن المصنع `ctx` قيمًا اختيارية هي `config` و`agentDir` و`workspaceDir`
بحيث يمكن لـ Plugins تهيئة الحالة لكل وكيل أو لكل مساحة عمل قبل تشغيل
أول خطاف لدورة الحياة.

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

| العضو             | النوع     | الغرض                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | خاصية | معرّف المحرك واسمه وإصداره وما إذا كان مسؤولًا عن Compaction |
| `ingest(params)`   | تابع   | تخزين رسالة واحدة                                   |
| `assemble(params)` | تابع   | بناء سياق لتشغيل نموذج (يعيد `AssembleResult`) |
| `compact(params)`  | تابع   | تلخيص/تقليص السياق                                 |

يعيد `assemble` كائن `AssembleResult` يحتوي على:

<ParamField path="messages" type="Message[]" required>
  الرسائل المرتبة التي ستُرسل إلى النموذج.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  تقدير المحرك لإجمالي الرموز في السياق المجمّع. يستخدم OpenClaw هذا لاتخاذ قرارات عتبة Compaction وإعداد التقارير التشخيصية.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  يُضاف إلى بداية مطالبة النظام.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  يتحكم في تقدير الرموز الذي يستخدمه المشغّل لإجراء فحوصات استباقية
  لتجاوز السعة. القيمة الافتراضية هي `"assembled"`، ما يعني أنه لا يُفحص سوى
  تقدير المطالبة المجمّعة للمحركات غير المسؤولة عن Compaction.
  تدير المحركات التي تضبط `ownsCompaction: true` قبول مطالباتها بنفسها،
  لذلك يتخطى OpenClaw افتراضيًا الفحص العام السابق للمطالبة. اضبط
  `"preassembly_may_overflow"` فقط عندما تكون رؤيتك المجمّعة قادرة على إخفاء خطر
  تجاوز السعة في النص المنسوخ الأساسي؛ وعندها يُبقي المشغّل الفحص العام
  نشطًا ويأخذ القيمة القصوى بين التقدير المجمّع وتقدير سجل الجلسة
  السابق للتجميع (غير المقيّد بنافذة) عند تقرير ما إذا كان ينبغي إجراء
  Compaction استباقيًا. في كلتا الحالتين، تظل الرسائل التي تعيدها هي ما يراه
  النموذج؛ لا يؤثر `promptAuthority` إلا في الفحص المسبق.
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  دورة حياة إسقاط اختيارية للمضيفين ذوي سلاسل المحادثة الدائمة في الخلفية (مثل خادم تطبيق Codex). يطلب `mode: "thread_bootstrap"` مع `epoch` ثابت من المضيف إدخال السياق المجمّع مرة واحدة لكل حقبة وإعادة استخدام سلسلة المحادثة الخلفية حتى تتغير الحقبة، بدلًا من إعادة الإسقاط في كل دور. احذف هذا الحقل للإسقاط المعتاد لكل دور.
</ParamField>

يعيد `compact` كائن `CompactResult`. عندما تغيّر Compaction هوية الجلسة النشطة،
يحدّد `result.sessionTarget` (وهو `ContextEngineSessionTarget` ذو نوع محدد يحمل
هوية الجلسة ونطاق التخزين) الجلسة اللاحقة التي يجب أن تستخدمها
إعادة المحاولة أو الدور التالي؛ ويطابق `result.sessionId` معرّف الجلسة اللاحقة.

الأعضاء الاختيارية:

| العضو                         | النوع   | الغرض                                                                                                                                      |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | تابع | تهيئة حالة المحرك لجلسة. يُستدعى مرة واحدة عندما يرى المحرك الجلسة لأول مرة (مثل استيراد السجل).                              |
| `maintain(params)`             | تابع | صيانة النص المنسوخ بعد التمهيد أو دور ناجح أو Compaction. استخدم `runtimeContext.rewriteTranscriptEntries()` لإعادة الكتابة الآمنة. |
| `ingestBatch(params)`          | تابع | استيعاب دور مكتمل كدفعة. يُستدعى بعد اكتمال التشغيل، مع جميع رسائل ذلك الدور دفعةً واحدة.                                  |
| `afterTurn(params)`            | تابع | عمل دورة الحياة بعد التشغيل (حفظ الحالة، وتشغيل Compaction في الخلفية).                                                                      |
| `prepareSubagentSpawn(params)` | تابع | إعداد الحالة المشتركة لجلسة فرعية قبل بدئها.                                                                                    |
| `onSubagentEnded(params)`      | تابع | التنظيف بعد انتهاء وكيل فرعي.                                                                                                              |
| `dispose()`                    | تابع | تحرير الموارد. يُستدعى أثناء إيقاف تشغيل Gateway أو إعادة تحميل Plugin، وليس لكل جلسة.                                                        |

### إعدادات بيئة التشغيل

تتلقى خطافات دورة الحياة التي تعمل داخل OpenClaw كائن
`runtimeSettings` اختياريًا. وهو سطح واجهة برمجة تطبيقات داخلية
لمنتج/مستهلك، محدد الإصدار وللقراءة فقط: ينتجه OpenClaw لمحرك السياق
المحدد، ويستهلكه محرك السياق داخل خطافات دورة الحياة. ولا يُعرض
مباشرةً للمستخدمين ولا ينشئ سطحًا مخصصًا لإعداد التقارير.

- `schemaVersion`: حاليًا `1`
- `runtime`: مضيف OpenClaw، ووضع وقت التشغيل (`normal`، أو `fallback`، أو
  `degraded`)، ومعرّفات إطار الاختبار/وقت التشغيل الاختيارية
- `contextEngineSelection`: معرّف محرك السياق المحدد ومصدر التحديد
- `executionHost`: معرّف المضيف وتسميته للسطح الذي يستدعي الخطاف
- `model`: النموذج المطلوب، والنموذج المحسوم، والموفّر، وعائلة النموذج الاختيارية
- `limits`: ميزانية رموز المطالبة والحد الأقصى لرموز الإخراج عندما يكونان معروفين
- `diagnostics`: رموز أسباب الرجوع الاحتياطي المغلق والتشغيل المتدهور عندما تكون معروفة

تُمثَّل الحقول التي يمكن أن تكون غير معروفة بالقيمة `null`؛ أما حقول التمييز مثل
وضع وقت التشغيل ومصدر التحديد فتظل غير قابلة للقيمة الخالية. وتظل المحركات الأقدم
متوافقة: إذا رفض محرك قديم صارم الخاصية `runtimeSettings` بوصفها
خاصية غير معروفة، يعيد OpenClaw محاولة استدعاء دورة الحياة من دونها بدلًا من عزل
المحرك.

### متطلبات المضيف

يمكن لمحركات السياق إعلان متطلبات قدرات المضيف في `info.hostRequirements`.
يتحقق OpenClaw من هذه المتطلبات قبل بدء العملية، ويفشل في وضع مغلق
مع خطأ وصفي عندما يتعذر على وقت التشغيل المحدد استيفاؤها.

بالنسبة إلى عمليات تشغيل الوكيل، أعلِن `assemble-before-prompt` عندما يجب أن يتحكم المحرك في
مطالبة النموذج الفعلية من خلال `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "استخدم Codex الأصلي أو وقت التشغيل المضمّن في OpenClaw، أو حدّد محرك السياق القديم.",
    },
  },
}
```

تستوفي عمليات تشغيل الوكيل في Codex الأصلي وOpenClaw المضمّن المتطلب `assemble-before-prompt`.
أما واجهات CLI الخلفية العامة فلا تستوفيه، ولذلك تُرفض المحركات التي تتطلبه قبل بدء
عملية CLI.

### عزل حالات الفشل

يعزل OpenClaw محرك Plugin المحدد عن مسار الرد الأساسي. إذا كان
محرك غير قديم مفقودًا، أو فشل في التحقق من العقد، أو طرح استثناءً أثناء إنشاء
المصنع، أو طرح استثناءً من إحدى طرق دورة الحياة، فإن OpenClaw يعزل ذلك المحرك
لعملية Gateway الحالية ويخفض مهام محرك السياق إلى
المحرك المضمّن `legacy`. ويُسجَّل الخطأ مع العملية الفاشلة لكي يتمكن
المشغّل من إصلاح Plugin أو تحديثه أو تعطيله من دون أن يتوقف الوكيل
عن الرد.

تختلف حالات فشل متطلبات المضيف: فعندما يعلن محرك أن وقت التشغيل
يفتقر إلى قدرة مطلوبة، يفشل OpenClaw في وضع مغلق قبل بدء التشغيل. ويحمي ذلك
المحركات التي قد تفسد الحالة إذا عملت في مضيف غير مدعوم.

### ownsCompaction

يتحكم `ownsCompaction` في بقاء الضغط التلقائي المضمّن ضمن المحاولة في وقت تشغيل OpenClaw مفعّلًا لعملية التشغيل:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    يمتلك المحرك سلوك الضغط. يعطّل OpenClaw الضغط التلقائي المضمّن في وقت تشغيل OpenClaw والفحص التمهيدي العام لتجاوز السعة قبل المطالبة في عملية التشغيل تلك، ويكون تنفيذ المحرك لـ `compact()` مسؤولًا عن `/compact`، وضغط الاسترداد من تجاوز سعة الموفّر، وأي ضغط استباقي يريد تنفيذه في `afterTurn()`. يظل OpenClaw يشغّل إجراء الحماية من تجاوز السعة قبل المطالبة عندما يعيد المحرك `promptAuthority: "preassembly_may_overflow"` من `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    قد يستمر تشغيل الضغط التلقائي المضمّن في وقت تشغيل OpenClaw أثناء تنفيذ المطالبة، لكن تظل طريقة `compact()` في المحرك النشط تُستدعى من أجل `/compact` والاسترداد من تجاوز السعة.
  </Accordion>
</AccordionGroup>

<Warning>
لا يعني `ownsCompaction: false` **أن** OpenClaw يرجع تلقائيًا إلى مسار الضغط الخاص بالمحرك القديم.
</Warning>

وهذا يعني وجود نمطين صالحين للـ Plugin:

<Tabs>
  <Tab title="وضع الامتلاك">
    نفّذ خوارزمية الضغط الخاصة بك واضبط `ownsCompaction: true`.
  </Tab>
  <Tab title="وضع التفويض">
    اضبط `ownsCompaction: false` واجعل `compact()` يستدعي `delegateCompactionToRuntime(...)` من `openclaw/plugin-sdk/core` لاستخدام سلوك الضغط المضمّن في OpenClaw.
  </Tab>
</Tabs>

يُعد تنفيذ `compact()` الذي لا ينفذ أي إجراء غير آمن لمحرك نشط لا يمتلك الضغط، لأنه يعطّل مسار الضغط العادي لـ `/compact` ومسار ضغط الاسترداد من تجاوز السعة لخانة ذلك المحرك.

## مرجع الإعداد

```json5
{
  plugins: {
    slots: {
      // حدّد محرك السياق النشط. القيمة الافتراضية: "legacy".
      // اضبطه على معرّف Plugin لاستخدام محرك Plugin.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
الخانة حصرية في وقت التشغيل - لا يُحسم سوى محرك سياق مسجّل واحد لعملية تشغيل أو ضغط معينة. لا يزال بإمكان Plugins `kind: "context-engine"` المفعّلة الأخرى التحميل وتشغيل شيفرة تسجيلها؛ لا يحدد `plugins.slots.contextEngine` سوى معرّف المحرك المسجّل الذي يحسمه OpenClaw عندما يحتاج إلى محرك سياق.
</Note>

<Note>
**إلغاء تثبيت Plugin:** عند إلغاء تثبيت Plugin المحدد حاليًا بوصفه `plugins.slots.contextEngine`، يعيد OpenClaw الخانة إلى القيمة الافتراضية (`legacy`). وينطبق سلوك إعادة الضبط نفسه على `plugins.slots.memory`. لا يلزم تعديل الإعداد يدويًا.
</Note>

## العلاقة بالضغط والذاكرة

<AccordionGroup>
  <Accordion title="Compaction">
    يُعد الضغط إحدى مسؤوليات محرك السياق. يفوّض المحرك القديم عملية التلخيص المضمّنة في OpenClaw. ويمكن لمحركات Plugin تنفيذ أي استراتيجية ضغط (ملخصات DAG، والاسترجاع المتجهي، وما إلى ذلك).
  </Accordion>
  <Accordion title="Plugins الذاكرة">
    تكون Plugins الذاكرة (`plugins.slots.memory`) منفصلة عن محركات السياق. توفر Plugins الذاكرة البحث/الاسترجاع؛ بينما تتحكم محركات السياق فيما يراه النموذج. ويمكنهما العمل معًا - فقد يستخدم محرك السياق بيانات Plugin الذاكرة أثناء التجميع. ينبغي لمحركات Plugin التي تريد مسار مطالبة الذاكرة النشط تفضيل `buildMemorySystemPromptAddition(...)` من `openclaw/plugin-sdk/core`، الذي يحوّل أقسام مطالبة الذاكرة النشطة إلى `systemPromptAddition` جاهز للإضافة في البداية. وإذا احتاج محرك إلى تحكم منخفض المستوى، فلا يزال بإمكانه جلب الأسطر الأولية من `openclaw/plugin-sdk/memory-host-core` عبر `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="تنقيح الجلسة">
    يستمر اقتطاع نتائج الأدوات القديمة في الذاكرة بغض النظر عن محرك السياق النشط.
  </Accordion>
</AccordionGroup>

## نصائح

- استخدم `openclaw doctor` للتحقق من تحميل محركك بصورة صحيحة.
- عند تبديل المحركات، تستمر الجلسات الحالية بسجلها الحالي. ويتولى المحرك الجديد عمليات التشغيل المستقبلية.
- تُسجَّل أخطاء المحرك ويُعزل محرك Plugin المحدد لعملية Gateway الحالية. يرجع OpenClaw إلى `legacy` لأدوار المستخدم لكي تستمر الردود، ولكن يظل عليك إصلاح Plugin المعطّل أو تحديثه أو تعطيله أو إلغاء تثبيته.
- للتطوير، استخدم `openclaw plugins install -l ./my-engine` لربط دليل Plugin محلي من دون نسخه.

## ذو صلة

- [Compaction](/ar/concepts/compaction) - تلخيص المحادثات الطويلة
- [السياق](/ar/concepts/context) - كيفية بناء السياق لأدوار الوكيل
- [بنية Plugin](/ar/plugins/architecture) - تسجيل Plugins محرك السياق
- [بيان Plugin](/ar/plugins/manifest) - حقول بيان Plugin
- [Plugins](/ar/tools/plugin) - نظرة عامة على Plugins
