---
read_when:
    - تريد أن تفهم كيف يجمع OpenClaw سياق النموذج
    - أنت تقوم بالتبديل بين المحرّك القديم ومحرّك Plugin
    - أنت تبني Plugin لمحرك السياق
sidebarTitle: Context engine
summary: 'محرك السياق: تجميع سياق قابل للتوصيل، وCompaction، ودورة حياة الوكيل الفرعي'
title: محرك السياق
x-i18n:
    generated_at: "2026-04-30T07:51:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f192c6b28ad2b5960b504811926fb5e30fe8da9d985d8eec3ad4b65c9f7cae5
    source_path: concepts/context-engine.md
    workflow: 16
---

يتحكم **محرك السياق** في كيفية بناء OpenClaw لسياق النموذج لكل تشغيل: الرسائل التي يجب تضمينها، وكيفية تلخيص السجل الأقدم، وكيفية إدارة السياق عبر حدود الوكلاء الفرعيين.

يأتي OpenClaw مع محرك `legacy` مدمج ويستخدمه افتراضيًا — ولا يحتاج معظم المستخدمين إلى تغيير ذلك أبدًا. ثبّت محرك Plugin وحدده فقط عندما تريد سلوكًا مختلفًا للتجميع أو Compaction أو الاستدعاء عبر الجلسات.

## البدء السريع

<Steps>
  <Step title="تحقق من المحرك النشط">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="ثبّت محرك Plugin">
    تُثبّت Plugins محرك السياق مثل أي OpenClaw Plugin آخر.

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
  <Step title="ارجع إلى legacy (اختياري)">
    اضبط `contextEngine` على `"legacy"` (أو أزل المفتاح بالكامل — `"legacy"` هو الافتراضي).
  </Step>
</Steps>

## كيف يعمل

في كل مرة يشغّل فيها OpenClaw مطالبة نموذج، يشارك محرك السياق في أربع نقاط من دورة الحياة:

<AccordionGroup>
  <Accordion title="1. الاستيعاب">
    يُستدعى عند إضافة رسالة جديدة إلى الجلسة. يمكن للمحرك تخزين الرسالة أو فهرستها في مخزن البيانات الخاص به.
  </Accordion>
  <Accordion title="2. التجميع">
    يُستدعى قبل كل تشغيل للنموذج. يعيد المحرك مجموعة مرتبة من الرسائل (و`systemPromptAddition` اختياريًا) تلائم ميزانية الرموز.
  </Accordion>
  <Accordion title="3. Compaction">
    يُستدعى عندما تمتلئ نافذة السياق، أو عندما يشغّل المستخدم `/compact`. يلخص المحرك السجل الأقدم لتحرير المساحة.
  </Accordion>
  <Accordion title="4. بعد الدور">
    يُستدعى بعد اكتمال التشغيل. يمكن للمحرك الاحتفاظ بالحالة، أو تشغيل Compaction في الخلفية، أو تحديث الفهارس.
  </Accordion>
</AccordionGroup>

بالنسبة إلى أداة Codex المضمنة غير ACP، يطبق OpenClaw دورة الحياة نفسها عبر إسقاط السياق المجمّع في تعليمات مطوّر Codex ومطالبة الدور الحالي. يظل Codex مالكًا لسجل المحادثة الأصلي وCompactor الأصلي الخاص به.

### دورة حياة الوكيل الفرعي (اختياري)

يستدعي OpenClaw خطافي دورة حياة اختياريين للوكلاء الفرعيين:

<ParamField path="prepareSubagentSpawn" type="method">
  حضّر حالة السياق المشتركة قبل بدء تشغيل فرعي. يتلقى الخطاف مفاتيح جلسة الأصل/الفرع، و`contextMode` (`isolated` أو `fork`)، ومعرّفات/ملفات النصوص المتاحة، وTTL اختياريًا. إذا أعاد مقبض تراجع، يستدعيه OpenClaw عندما يفشل الإنشاء بعد نجاح التحضير.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  نظّف عند اكتمال جلسة وكيل فرعي أو كنسها.
</ParamField>

### إضافة مطالبة النظام

يمكن لطريقة `assemble` أن تعيد سلسلة `systemPromptAddition`. يضيف OpenClaw هذه السلسلة في بداية مطالبة النظام للتشغيل. يتيح ذلك للمحركات حقن إرشادات استدعاء ديناميكية، أو تعليمات استرجاع، أو تلميحات واعية بالسياق من دون الحاجة إلى ملفات مساحة عمل ثابتة.

## محرك legacy

يحافظ محرك `legacy` المدمج على السلوك الأصلي لـ OpenClaw:

- **الاستيعاب**: بلا إجراء (يتولى مدير الجلسة الاحتفاظ بالرسائل مباشرة).
- **التجميع**: تمرير مباشر (يتولى خط أنابيب التنظيف → التحقق → التحديد الحالي في وقت التشغيل تجميع السياق).
- **Compaction**: يفوّض إلى Compaction التلخيص المدمج، الذي ينشئ ملخصًا واحدًا للرسائل الأقدم ويحافظ على الرسائل الحديثة كما هي.
- **بعد الدور**: بلا إجراء.

لا يسجل محرك legacy أدوات ولا يوفر `systemPromptAddition`.

عندما لا يتم ضبط `plugins.slots.contextEngine` (أو عندما يضبط على `"legacy"`)، يُستخدم هذا المحرك تلقائيًا.

## محركات Plugin

يمكن لـ Plugin تسجيل محرك سياق باستخدام واجهة Plugin البرمجية:

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

يتضمن المصنع `ctx` قيم `config` و`agentDir` و`workspaceDir`
الاختيارية، بحيث يمكن لـ Plugins تهيئة حالة لكل وكيل أو لكل مساحة عمل قبل تشغيل
أول خطاف دورة حياة.

ثم فعّله في التهيئة:

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

| العضو              | النوع    | الغرض                                                   |
| ------------------ | -------- | ------------------------------------------------------- |
| `info`             | خاصية    | معرّف المحرك واسمه وإصداره وما إذا كان يملك Compaction |
| `ingest(params)`   | طريقة    | تخزين رسالة واحدة                                      |
| `assemble(params)` | طريقة    | بناء السياق لتشغيل نموذج (يعيد `AssembleResult`)       |
| `compact(params)`  | طريقة    | تلخيص/تقليل السياق                                     |

تعيد `assemble` كائن `AssembleResult` يحتوي على:

<ParamField path="messages" type="Message[]" required>
  الرسائل المرتبة التي سترسل إلى النموذج.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  تقدير المحرك لإجمالي الرموز في السياق المجمّع. يستخدم OpenClaw هذا لاتخاذ قرارات عتبة Compaction وإعداد تقارير التشخيص.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  يُضاف إلى بداية مطالبة النظام.
</ParamField>

تعيد `compact` كائن `CompactResult`. عندما يدير Compaction النص النشط،
يحدد `result.sessionId` و`result.sessionFile` الجلسة اللاحقة التي يجب أن تستخدمها
إعادة المحاولة أو الدور التالي.

الأعضاء الاختيارية:

| العضو                          | النوع  | الغرض                                                                                                      |
| ------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | طريقة  | تهيئة حالة المحرك لجلسة. يُستدعى مرة واحدة عندما يرى المحرك جلسة لأول مرة (مثلًا، استيراد السجل).        |
| `ingestBatch(params)`          | طريقة  | استيعاب دور مكتمل كدفعة. يُستدعى بعد اكتمال تشغيل، مع كل الرسائل من ذلك الدور دفعة واحدة.               |
| `afterTurn(params)`            | طريقة  | عمل دورة الحياة بعد التشغيل (الاحتفاظ بالحالة، تشغيل Compaction في الخلفية).                             |
| `prepareSubagentSpawn(params)` | طريقة  | إعداد الحالة المشتركة لجلسة فرعية قبل أن تبدأ.                                                            |
| `onSubagentEnded(params)`      | طريقة  | التنظيف بعد انتهاء وكيل فرعي.                                                                             |
| `dispose()`                    | طريقة  | تحرير الموارد. يُستدعى أثناء إيقاف Gateway أو إعادة تحميل Plugin — وليس لكل جلسة.                        |

### ownsCompaction

يتحكم `ownsCompaction` فيما إذا كان Compaction التلقائي المدمج داخل المحاولة في Pi سيظل مفعّلًا للتشغيل:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    يملك المحرك سلوك Compaction. يعطّل OpenClaw Compaction التلقائي المدمج في Pi لذلك التشغيل، وتكون دالة `compact()` في المحرك مسؤولة عن `/compact`، وCompaction استرداد التجاوز، وأي Compaction استباقي يريد تنفيذه في `afterTurn()`. قد يستمر OpenClaw في تشغيل أداة الحماية من التجاوز قبل المطالبة؛ وعندما تتوقع أن النص الكامل سيتجاوز الحد، يستدعي مسار الاسترداد `compact()` للمحرك النشط قبل إرسال مطالبة أخرى.
  </Accordion>
  <Accordion title="ownsCompaction: false أو غير مضبوط">
    قد يستمر Compaction التلقائي المدمج في Pi في العمل أثناء تنفيذ المطالبة، لكن طريقة `compact()` للمحرك النشط تظل تُستدعى من أجل `/compact` واسترداد التجاوز.
  </Accordion>
</AccordionGroup>

<Warning>
لا يعني `ownsCompaction: false` أن OpenClaw يعود تلقائيًا إلى مسار Compaction الخاص بمحرك legacy.
</Warning>

هذا يعني أن هناك نمطين صالحين لـ Plugin:

<Tabs>
  <Tab title="وضع الامتلاك">
    نفّذ خوارزمية Compaction الخاصة بك واضبط `ownsCompaction: true`.
  </Tab>
  <Tab title="وضع التفويض">
    اضبط `ownsCompaction: false` واجعل `compact()` تستدعي `delegateCompactionToRuntime(...)` من `openclaw/plugin-sdk/core` لاستخدام سلوك Compaction المدمج في OpenClaw.
  </Tab>
</Tabs>

تكون `compact()` التي لا تفعل شيئًا غير آمنة لمحرك نشط غير مالك، لأنها تعطل مسار Compaction العادي لـ `/compact` واسترداد التجاوز لفتحة ذلك المحرك.

## مرجع التهيئة

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
الفتحة حصرية في وقت التشغيل — يُحل محرك سياق مسجل واحد فقط لتشغيل أو عملية Compaction معينة. ما زال بإمكان Plugins `kind: "context-engine"` المفعّلة الأخرى التحميل وتشغيل كود التسجيل الخاص بها؛ يحدد `plugins.slots.contextEngine` فقط معرّف المحرك المسجل الذي يحله OpenClaw عندما يحتاج إلى محرك سياق.
</Note>

<Note>
**إلغاء تثبيت Plugin:** عندما تلغي تثبيت Plugin المحدد حاليًا كـ `plugins.slots.contextEngine`، يعيد OpenClaw ضبط الفتحة إلى الافتراضي (`legacy`). ينطبق سلوك إعادة الضبط نفسه على `plugins.slots.memory`. لا يلزم تعديل التهيئة يدويًا.
</Note>

## العلاقة مع Compaction والذاكرة

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction هي إحدى مسؤوليات محرك السياق. يفوض المحرك القديم إلى التلخيص المدمج في OpenClaw. يمكن لمحركات Plugin تنفيذ أي استراتيجية Compaction (ملخصات DAG، استرجاع المتجهات، إلخ).
  </Accordion>
  <Accordion title="Plugins الذاكرة">
    تكون Plugins الذاكرة (`plugins.slots.memory`) منفصلة عن محركات السياق. توفر Plugins الذاكرة البحث/الاسترجاع؛ وتتحكم محركات السياق في ما يراه النموذج. يمكن أن تعمل معًا — قد يستخدم محرك السياق بيانات Plugin الذاكرة أثناء التجميع. يجب أن تفضل محركات Plugin التي تريد مسار مطالبة الذاكرة النشطة استخدام `buildMemorySystemPromptAddition(...)` من `openclaw/plugin-sdk/core`، الذي يحول أقسام مطالبة الذاكرة النشطة إلى `systemPromptAddition` جاهزة للإضافة في البداية. إذا احتاج المحرك إلى تحكم منخفض المستوى، فلا يزال بإمكانه سحب الأسطر الخام من `openclaw/plugin-sdk/memory-host-core` عبر `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="تشذيب الجلسة">
    لا يزال اقتطاع نتائج الأدوات القديمة في الذاكرة يعمل بغض النظر عن محرك السياق النشط.
  </Accordion>
</AccordionGroup>

## نصائح

- استخدم `openclaw doctor` للتحقق من أن محركك يتم تحميله بشكل صحيح.
- عند تبديل المحركات، تستمر الجلسات الحالية بتاريخها الحالي. يتولى المحرك الجديد التشغيل في عمليات التشغيل المستقبلية.
- تُسجل أخطاء المحرك وتظهر في التشخيصات. إذا فشل محرك Plugin في التسجيل أو تعذر حل معرف المحرك المحدد، فلن يعود OpenClaw تلقائيًا إلى البديل؛ تفشل عمليات التشغيل حتى تصلح Plugin أو تعيد `plugins.slots.contextEngine` إلى `"legacy"`.
- للتطوير، استخدم `openclaw plugins install -l ./my-engine` لربط دليل Plugin محلي دون نسخ.

## ذات صلة

- [Compaction](/ar/concepts/compaction) — تلخيص المحادثات الطويلة
- [السياق](/ar/concepts/context) — كيفية بناء السياق لدورات الوكيل
- [بنية Plugin](/ar/plugins/architecture) — تسجيل Plugins محرك السياق
- [بيان Plugin](/ar/plugins/manifest) — حقول بيان Plugin
- [Plugins](/ar/tools/plugin) — نظرة عامة على Plugin
