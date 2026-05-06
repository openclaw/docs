---
read_when:
    - تريد فهم كيفية تجميع OpenClaw لسياق النموذج
    - أنت تبدّل بين المحرك القديم ومحرك Plugin
    - أنت تبني Plugin لمحرك السياق
sidebarTitle: Context engine
summary: 'محرك السياق: تجميع سياق قابل للتوصيل، وCompaction، ودورة حياة الوكيل الفرعي'
title: محرك السياق
x-i18n:
    generated_at: "2026-05-06T07:47:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c33c94971751d92a2ce695db545a0c0abb7adcbe1820383b83f4201fa7e628d
    source_path: concepts/context-engine.md
    workflow: 16
---

يعالج **محرك السياق** كيفية بناء OpenClaw لسياق النموذج لكل تشغيل: أي الرسائل يجب تضمينها، وكيفية تلخيص السجل الأقدم، وكيفية إدارة السياق عبر حدود الوكلاء الفرعيين.

يأتي OpenClaw مع محرك `legacy` مدمج ويستخدمه افتراضيا - ولا يحتاج معظم المستخدمين إلى تغيير ذلك أبدا. ثبّت محرك Plugin وحدده فقط عندما تريد سلوكا مختلفا في التجميع أو Compaction أو الاستدعاء عبر الجلسات.

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
    تثبت Plugins محرك السياق مثل أي Plugin آخر في OpenClaw.

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
  <Step title="الرجوع إلى legacy (اختياري)">
    اضبط `contextEngine` على `"legacy"` (أو أزل المفتاح بالكامل - `"legacy"` هو الافتراضي).
  </Step>
</Steps>

## كيف يعمل

في كل مرة يشغّل فيها OpenClaw موجها للنموذج، يشارك محرك السياق في أربع نقاط من دورة الحياة:

<AccordionGroup>
  <Accordion title="1. الاستيعاب">
    يستدعى عند إضافة رسالة جديدة إلى الجلسة. يستطيع المحرك تخزين الرسالة أو فهرستها في مخزن البيانات الخاص به.
  </Accordion>
  <Accordion title="2. التجميع">
    يستدعى قبل كل تشغيل للنموذج. يعيد المحرك مجموعة مرتبة من الرسائل (و`systemPromptAddition` اختياريا) تناسب ميزانية الرموز.
  </Accordion>
  <Accordion title="3. Compact">
    يستدعى عندما تمتلئ نافذة السياق، أو عندما يشغّل المستخدم `/compact`. يلخص المحرك السجل الأقدم لتحرير مساحة.
  </Accordion>
  <Accordion title="4. بعد الدور">
    يستدعى بعد اكتمال التشغيل. يستطيع المحرك حفظ الحالة، أو تشغيل Compaction في الخلفية، أو تحديث الفهارس.
  </Accordion>
</AccordionGroup>

بالنسبة إلى حزمة Codex غير ACP المضمنة، يطبق OpenClaw دورة الحياة نفسها من خلال إسقاط السياق المجمع في تعليمات مطور Codex وموجه الدور الحالي. لا يزال Codex يملك سجل السلسلة الأصلي والضاغط الأصلي الخاصين به.

### دورة حياة الوكيل الفرعي (اختيارية)

يستدعي OpenClaw خطافي دورة حياة اختياريين للوكلاء الفرعيين:

<ParamField path="prepareSubagentSpawn" type="method">
  جهّز حالة السياق المشتركة قبل بدء تشغيل تابع. يتلقى الخطاف مفاتيح جلسة الأصل/التابع، و`contextMode` (`isolated` أو `fork`)، ومعرفات/ملفات النصوص المتاحة، وTTL اختياريا. إذا أعاد مقبض تراجع، يستدعيه OpenClaw عندما يفشل الإنشاء بعد نجاح التحضير.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  نظّف عند اكتمال جلسة وكيل فرعي أو كنسها.
</ParamField>

### إضافة موجه النظام

يمكن لطريقة `assemble` إرجاع سلسلة `systemPromptAddition`. يضيف OpenClaw هذه السلسلة في بداية موجه النظام للتشغيل. يتيح ذلك للمحركات حقن إرشادات استدعاء ديناميكية، أو تعليمات استرجاع، أو تلميحات واعية بالسياق من دون الحاجة إلى ملفات مساحة عمل ثابتة.

## محرك legacy

يحافظ محرك `legacy` المدمج على السلوك الأصلي لـ OpenClaw:

- **الاستيعاب**: لا عملية (يتولى مدير الجلسات حفظ الرسائل مباشرة).
- **التجميع**: تمرير مباشر (يتولى مسار التعقيم → التحقق → الحد الحالي في وقت التشغيل تجميع السياق).
- **Compact**: يفوض إلى Compaction التلخيص المدمج، الذي ينشئ ملخصا واحدا للرسائل الأقدم ويبقي الرسائل الحديثة كما هي.
- **بعد الدور**: لا عملية.

لا يسجل محرك legacy أدوات ولا يوفر `systemPromptAddition`.

عندما لا يتم تعيين `plugins.slots.contextEngine` (أو يتم تعيينه إلى `"legacy"`)، يستخدم هذا المحرك تلقائيا.

## محركات Plugin

يمكن لـ Plugin تسجيل محرك سياق باستخدام واجهة برمجة تطبيقات Plugin:

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

يتضمن المصنع `ctx` قيما اختيارية هي `config` و`agentDir` و`workspaceDir`
حتى تتمكن Plugins من تهيئة حالة لكل وكيل أو لكل مساحة عمل قبل تشغيل
أول خطاف من دورة الحياة.

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
| `info`             | خاصية    | معرف المحرك، واسمه، وإصداره، وما إذا كان يملك Compaction |
| `ingest(params)`   | طريقة    | تخزين رسالة واحدة                                       |
| `assemble(params)` | طريقة    | بناء سياق لتشغيل نموذج (يعيد `AssembleResult`)           |
| `compact(params)`  | طريقة    | تلخيص/تقليل السياق                                      |

يعيد `assemble` قيمة `AssembleResult` تحتوي على:

<ParamField path="messages" type="Message[]" required>
  الرسائل المرتبة لإرسالها إلى النموذج.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  تقدير المحرك لإجمالي الرموز في السياق المجمع. يستخدم OpenClaw هذا لاتخاذ قرارات عتبة Compaction ولتقارير التشخيص.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  يضاف إلى بداية موجه النظام.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  يتحكم في تقدير الرموز الذي يستخدمه المشغّل لفحوصات تجاوز السعة
  الاستباقية. القيمة الافتراضية هي `"assembled"`، ما يعني أن تقدير
  الموجه المجمع فقط هو الذي يفحص - وهذا مناسب للمحركات التي تعيد
  سياقا نافذيا مكتفيا بذاته. اضبطه على `"preassembly_may_overflow"` فقط
  عندما يمكن للعرض المجمع لديك إخفاء خطر تجاوز السعة في النص الأساسي؛
  حينها يأخذ المشغّل الحد الأقصى بين التقدير المجمع
  وتقدير سجل الجلسة قبل التجميع (غير النافذي) عند تقرير
  ما إذا كان ينبغي إجراء Compaction استباقيا. في كلتا الحالتين، الرسائل التي تعيدها هي
  ما يراه النموذج فعلا - لا يؤثر `promptAuthority` إلا في الفحص المسبق.
</ParamField>

يعيد `compact` قيمة `CompactResult`. عندما يدوّر Compaction النص النشط،
يحدد `result.sessionId` و`result.sessionFile` جلسة الخلف
التي يجب أن تستخدمها المحاولة التالية أو الدور التالي.

الأعضاء الاختيارية:

| العضو                         | النوع | الغرض                                                                                                         |
| ------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | طريقة | تهيئة حالة المحرك لجلسة. يستدعى مرة واحدة عندما يرى المحرك جلسة لأول مرة (مثلا، استيراد السجل).              |
| `ingestBatch(params)`          | طريقة | استيعاب دور مكتمل كدفعة. يستدعى بعد اكتمال التشغيل، مع كل رسائل ذلك الدور دفعة واحدة.                       |
| `afterTurn(params)`            | طريقة | عمل دورة الحياة بعد التشغيل (حفظ الحالة، تشغيل Compaction في الخلفية).                                      |
| `prepareSubagentSpawn(params)` | طريقة | إعداد حالة مشتركة لجلسة تابعة قبل أن تبدأ.                                                                  |
| `onSubagentEnded(params)`      | طريقة | التنظيف بعد انتهاء وكيل فرعي.                                                                                |
| `dispose()`                    | طريقة | تحرير الموارد. يستدعى أثناء إيقاف Gateway أو إعادة تحميل Plugin - وليس لكل جلسة.                             |

### ownsCompaction

يتحكم `ownsCompaction` فيما إذا كان Compaction التلقائي المدمج داخل محاولة Pi يبقى مفعلا للتشغيل:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    يملك المحرك سلوك Compaction. يعطل OpenClaw Compaction التلقائي المدمج في Pi لذلك التشغيل، ويكون تنفيذ `compact()` في المحرك مسؤولا عن `/compact`، وCompaction استعادة تجاوز السعة، وأي Compaction استباقي يريد تنفيذه في `afterTurn()`. قد يظل OpenClaw يشغّل أداة الحماية من تجاوز السعة قبل الموجه؛ وعندما تتوقع أن النص الكامل سيتجاوز السعة، يستدعي مسار الاسترداد `compact()` الخاص بالمحرك النشط قبل إرسال موجه آخر.
  </Accordion>
  <Accordion title="ownsCompaction: false أو غير معين">
    قد يظل Compaction التلقائي المدمج في Pi يعمل أثناء تنفيذ الموجه، لكن طريقة `compact()` الخاصة بالمحرك النشط تظل تستدعى من أجل `/compact` واستعادة تجاوز السعة.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` لا يعني **أن** OpenClaw يعود تلقائيا إلى مسار Compaction الخاص بمحرك legacy.
</Warning>

يعني ذلك أن هناك نمطين صالحين لـ Plugin:

<Tabs>
  <Tab title="وضع الامتلاك">
    نفّذ خوارزمية Compaction الخاصة بك واضبط `ownsCompaction: true`.
  </Tab>
  <Tab title="وضع التفويض">
    اضبط `ownsCompaction: false` واجعل `compact()` يستدعي `delegateCompactionToRuntime(...)` من `openclaw/plugin-sdk/core` لاستخدام سلوك Compaction المدمج في OpenClaw.
  </Tab>
</Tabs>

إن `compact()` الذي لا يفعل شيئا غير آمن لمحرك نشط غير مالك، لأنه يعطل مسار `/compact` وCompaction استعادة تجاوز السعة الطبيعيين لفتحة ذلك المحرك.

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

<Note>
الفتحة حصرية في وقت التشغيل - لا يحل إلا محرك سياق مسجل واحد لتشغيل معين أو عملية Compaction معينة. يمكن أن تظل Plugins الأخرى المفعلة ذات `kind: "context-engine"` محملة وتشغّل رمز التسجيل الخاص بها؛ لا يحدد `plugins.slots.contextEngine` إلا معرف المحرك المسجل الذي يحله OpenClaw عندما يحتاج إلى محرك سياق.
</Note>

<Note>
**إلغاء تثبيت Plugin:** عندما تلغي تثبيت Plugin المحدد حاليا كـ `plugins.slots.contextEngine`، يعيد OpenClaw ضبط الفتحة إلى الافتراضي (`legacy`). ينطبق سلوك إعادة الضبط نفسه على `plugins.slots.memory`. لا يلزم تعديل الإعدادات يدويا.
</Note>

## العلاقة بـ Compaction والذاكرة

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction هي إحدى مسؤوليات محرك السياق. يفوض المحرك القديم إلى التلخيص المدمج في OpenClaw. يمكن لمحركات Plugin تنفيذ أي استراتيجية Compaction (ملخصات DAG، واسترجاع المتجهات، وما إلى ذلك).
  </Accordion>
  <Accordion title="Memory plugins">
    تكون Plugins الذاكرة (`plugins.slots.memory`) منفصلة عن محركات السياق. توفر Plugins الذاكرة البحث/الاسترجاع؛ وتتحكم محركات السياق في ما يراه النموذج. يمكنها العمل معًا - فقد يستخدم محرك السياق بيانات Plugin الذاكرة أثناء التجميع. يجب أن تفضل محركات Plugin التي تريد مسار مطالبة الذاكرة النشطة استخدام `buildMemorySystemPromptAddition(...)` من `openclaw/plugin-sdk/core`، الذي يحول أقسام مطالبة الذاكرة النشطة إلى `systemPromptAddition` جاهز للإضافة في البداية. إذا احتاج محرك إلى تحكم أدنى مستوى، فلا يزال بإمكانه سحب الأسطر الخام من `openclaw/plugin-sdk/memory-host-core` عبر `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Session pruning">
    لا يزال تشذيب نتائج الأدوات القديمة في الذاكرة يعمل بغض النظر عن محرك السياق النشط.
  </Accordion>
</AccordionGroup>

## نصائح

- استخدم `openclaw doctor` للتحقق من أن محركك يُحمَّل بشكل صحيح.
- عند تبديل المحركات، تواصل الجلسات الحالية العمل بسجلها الحالي. يتولى المحرك الجديد التشغيل في الجولات المستقبلية.
- تُسجل أخطاء المحرك وتظهر في التشخيصات. إذا فشل محرك Plugin في التسجيل أو تعذّر حل معرف المحرك المحدد، لا يعود OpenClaw تلقائيًا إلى البديل؛ تفشل الجولات حتى تصلح Plugin أو تعيد تبديل `plugins.slots.contextEngine` إلى `"legacy"`.
- لأغراض التطوير، استخدم `openclaw plugins install -l ./my-engine` لربط دليل Plugin محلي دون نسخه.

## ذات صلة

- [Compaction](/ar/concepts/compaction) - تلخيص المحادثات الطويلة
- [السياق](/ar/concepts/context) - كيفية بناء السياق لجولات الوكيل
- [بنية Plugin](/ar/plugins/architecture) - تسجيل Plugins محرك السياق
- [بيان Plugin](/ar/plugins/manifest) - حقول بيان Plugin
- [Plugins](/ar/tools/plugin) - نظرة عامة على Plugin
