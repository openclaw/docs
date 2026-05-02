---
read_when:
    - تريد فهم كيفية تجميع OpenClaw لسياق النموذج
    - أنت تنتقل بين المحرك القديم ومحرك Plugin
    - أنت تبني Plugin لمحرك سياق
sidebarTitle: Context engine
summary: 'محرك السياق: تجميع السياق القابل للتوصيل، وCompaction، ودورة حياة الوكيل الفرعي'
title: محرك السياق
x-i18n:
    generated_at: "2026-05-02T07:24:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7477dd1d48f9633586dce67204912a810e0931d7bc9f2d6719ba465fe19681b
    source_path: concepts/context-engine.md
    workflow: 16
---

**محرك سياق** يتحكم في كيفية بناء OpenClaw لسياق النموذج لكل تشغيل: أي الرسائل تُضمَّن، وكيفية تلخيص السجل الأقدم، وكيفية إدارة السياق عبر حدود الوكلاء الفرعيين.

يأتي OpenClaw مزودًا بمحرك `legacy` مدمج ويستخدمه افتراضيًا — لا يحتاج معظم المستخدمين إلى تغيير ذلك مطلقًا. ثبّت محرك Plugin واختره فقط عندما تريد سلوكًا مختلفًا في التجميع أو Compaction أو الاستدعاء عبر الجلسات.

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
    تُثبَّت Plugins محرك السياق مثل أي Plugin أخرى في OpenClaw.

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
  <Step title="فعّل المحرك واختره">
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
  <Step title="العودة إلى legacy (اختياري)">
    عيّن `contextEngine` إلى `"legacy"` (أو أزل المفتاح بالكامل — `"legacy"` هو الافتراضي).
  </Step>
</Steps>

## كيف يعمل

في كل مرة يشغّل فيها OpenClaw مطالبة نموذج، يشارك محرك السياق في أربع نقاط من دورة الحياة:

<AccordionGroup>
  <Accordion title="1. الإدخال">
    يُستدعى عند إضافة رسالة جديدة إلى الجلسة. يستطيع المحرك تخزين الرسالة أو فهرستها في مخزن بياناته الخاص.
  </Accordion>
  <Accordion title="2. التجميع">
    يُستدعى قبل كل تشغيل للنموذج. يعيد المحرك مجموعة مرتبة من الرسائل (و`systemPromptAddition` اختياريًا) تلائم ميزانية الرموز.
  </Accordion>
  <Accordion title="3. الضغط">
    يُستدعى عندما تمتلئ نافذة السياق، أو عندما يشغّل المستخدم `/compact`. يلخّص المحرك السجل الأقدم لتحرير مساحة.
  </Accordion>
  <Accordion title="4. بعد الدور">
    يُستدعى بعد اكتمال التشغيل. يستطيع المحرك حفظ الحالة، أو تشغيل Compaction في الخلفية، أو تحديث الفهارس.
  </Accordion>
</AccordionGroup>

بالنسبة إلى حزمة Codex غير ACP المضمنة، يطبق OpenClaw دورة الحياة نفسها عبر إسقاط السياق المجمّع في تعليمات مطوّر Codex ومطالبة الدور الحالي. يظل Codex مسؤولًا عن سجل المحادثة الأصلي والضاغط الأصلي الخاص به.

### دورة حياة الوكيل الفرعي (اختياري)

يستدعي OpenClaw خطافي دورة حياة اختياريين للوكلاء الفرعيين:

<ParamField path="prepareSubagentSpawn" type="method">
  حضّر حالة السياق المشتركة قبل بدء تشغيل فرعي. يتلقى الخطاف مفاتيح جلسة الأصل/الابن، و`contextMode` (`isolated` أو `fork`)، ومعرفات/ملفات النصوص المتاحة، وTTL اختياريًا. إذا أعاد مقبض تراجع، يستدعيه OpenClaw عندما يفشل الإنشاء بعد نجاح التحضير.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  نظّف الموارد عند اكتمال جلسة وكيل فرعي أو كنسها.
</ParamField>

### إضافة مطالبة النظام

يمكن لطريقة `assemble` أن تعيد سلسلة `systemPromptAddition`. يضيف OpenClaw هذه السلسلة في بداية مطالبة النظام للتشغيل. يتيح ذلك للمحركات حقن إرشادات استدعاء ديناميكية، أو تعليمات استرجاع، أو تلميحات واعية بالسياق من دون الحاجة إلى ملفات مساحة عمل ثابتة.

## المحرك legacy

يحافظ المحرك `legacy` المدمج على سلوك OpenClaw الأصلي:

- **الإدخال**: بلا إجراء (يتولى مدير الجلسات حفظ الرسائل مباشرة).
- **التجميع**: تمرير مباشر (يتولى مسار sanitize → validate → limit الحالي في وقت التشغيل تجميع السياق).
- **الضغط**: يفوض إلى Compaction التلخيص المدمج، الذي ينشئ ملخصًا واحدًا للرسائل الأقدم ويحافظ على الرسائل الحديثة كما هي.
- **بعد الدور**: بلا إجراء.

لا يسجل المحرك legacy أدوات ولا يوفر `systemPromptAddition`.

عند عدم تعيين `plugins.slots.contextEngine` (أو عند تعيينه إلى `"legacy"`)، يُستخدم هذا المحرك تلقائيًا.

## محركات Plugin

يمكن لـ Plugin تسجيل محرك سياق باستخدام API الخاصة بالـ Plugin:

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
كي تتمكن Plugins من تهيئة حالة لكل وكيل أو لكل مساحة عمل قبل تشغيل
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
| `info`             | خاصية    | معرف المحرك واسمه وإصداره وما إذا كان يملك Compaction  |
| `ingest(params)`   | طريقة    | تخزين رسالة واحدة                                      |
| `assemble(params)` | طريقة    | بناء السياق لتشغيل نموذج (يعيد `AssembleResult`)       |
| `compact(params)`  | طريقة    | تلخيص/تقليل السياق                                     |

يعيد `assemble` قيمة `AssembleResult` تتضمن:

<ParamField path="messages" type="Message[]" required>
  الرسائل المرتبة التي سترسل إلى النموذج.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  تقدير المحرك لإجمالي الرموز في السياق المجمّع. يستخدم OpenClaw ذلك لقرارات عتبة Compaction وتقارير التشخيص.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  تُضاف في بداية مطالبة النظام.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  يتحكم في تقدير الرموز الذي يستخدمه المشغّل لفحوصات فيضان السياق
  الاستباقية. القيمة الافتراضية هي `"assembled"`، ما يعني أن تقدير
  المطالبة المجمّعة وحده يُفحص — وهذا مناسب للمحركات التي تعيد سياقًا
  محدود النافذة ومكتفيًا بذاته. عيّنه إلى `"preassembly_may_overflow"` فقط
  عندما يمكن للعرض المجمّع أن يخفي خطر الفيضان في النص الأساسي
  الكامن؛ عندها يأخذ المشغّل القيمة القصوى بين التقدير المجمّع
  وتقدير سجل الجلسة قبل التجميع (غير محدود النافذة) عند تقرير ما إذا كان
  سيجري Compaction استباقيًا. في كلتا الحالتين، تظل الرسائل التي تعيدها
  هي ما يراه النموذج — يؤثر `promptAuthority` فقط في الفحص المسبق.
</ParamField>

يعيد `compact` قيمة `CompactResult`. عندما يدوّر Compaction النص النشط،
يحدد `result.sessionId` و`result.sessionFile` جلسة الخلف التي يجب على
إعادة المحاولة التالية أو الدور التالي استخدامها.

الأعضاء الاختيارية:

| العضو                          | النوع  | الغرض                                                                                                           |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | طريقة  | تهيئة حالة المحرك لجلسة. تُستدعى مرة واحدة عندما يرى المحرك جلسة لأول مرة (مثل استيراد السجل).                 |
| `ingestBatch(params)`          | طريقة  | إدخال دور مكتمل كدفعة. تُستدعى بعد اكتمال تشغيل، مع جميع الرسائل من ذلك الدور دفعة واحدة.                     |
| `afterTurn(params)`            | طريقة  | عمل دورة الحياة بعد التشغيل (حفظ الحالة، تشغيل Compaction في الخلفية).                                        |
| `prepareSubagentSpawn(params)` | طريقة  | إعداد الحالة المشتركة لجلسة فرعية قبل أن تبدأ.                                                                 |
| `onSubagentEnded(params)`      | طريقة  | التنظيف بعد انتهاء وكيل فرعي.                                                                                  |
| `dispose()`                    | طريقة  | تحرير الموارد. تُستدعى أثناء إيقاف Gateway أو إعادة تحميل Plugin — وليس لكل جلسة.                             |

### ownsCompaction

يتحكم `ownsCompaction` فيما إذا كان Compaction التلقائي المدمج داخل المحاولة في Pi سيبقى مفعلًا للتشغيل:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    يملك المحرك سلوك Compaction. يعطل OpenClaw Compaction التلقائي المدمج في Pi لذلك التشغيل، ويصبح تنفيذ `compact()` في المحرك مسؤولًا عن `/compact`، وCompaction استرداد الفيضان، وأي Compaction استباقي يريد تنفيذه في `afterTurn()`. قد يظل OpenClaw يشغّل حاجز فيضان ما قبل المطالبة؛ وعندما يتنبأ بأن النص الكامل سيفيض، يستدعي مسار الاسترداد `compact()` للمحرك النشط قبل إرسال مطالبة أخرى.
  </Accordion>
  <Accordion title="ownsCompaction: false أو غير معين">
    قد يظل Compaction التلقائي المدمج في Pi يعمل أثناء تنفيذ المطالبة، لكن طريقة `compact()` الخاصة بالمحرك النشط تظل تُستدعى من أجل `/compact` واسترداد الفيضان.
  </Accordion>
</AccordionGroup>

<Warning>
لا يعني `ownsCompaction: false` أن OpenClaw يعود تلقائيًا إلى مسار Compaction الخاص بالمحرك legacy.
</Warning>

هذا يعني أن هناك نمطين صالحين لـ Plugin:

<Tabs>
  <Tab title="وضع التملّك">
    نفّذ خوارزمية Compaction الخاصة بك وعيّن `ownsCompaction: true`.
  </Tab>
  <Tab title="وضع التفويض">
    عيّن `ownsCompaction: false` واجعل `compact()` يستدعي `delegateCompactionToRuntime(...)` من `openclaw/plugin-sdk/core` لاستخدام سلوك Compaction المدمج في OpenClaw.
  </Tab>
</Tabs>

تُعد `compact()` التي لا تنفذ شيئًا غير آمنة لمحرك نشط لا يملك Compaction لأنها تعطّل مسار Compaction العادي الخاص بـ `/compact` واسترداد الفيضان لذلك المنفذ.

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
المنفذ حصري في وقت التشغيل — لا يُحلّ إلا محرك سياق مسجل واحد لتشغيل أو عملية Compaction معينة. يمكن أن تستمر Plugins أخرى مفعلة من نوع `kind: "context-engine"` في التحميل وتشغيل كود التسجيل الخاص بها؛ يحدد `plugins.slots.contextEngine` فقط معرف المحرك المسجل الذي يحله OpenClaw عندما يحتاج إلى محرك سياق.
</Note>

<Note>
**إلغاء تثبيت Plugin:** عند إلغاء تثبيت Plugin المختارة حاليًا باسم `plugins.slots.contextEngine`، يعيد OpenClaw تعيين المنفذ إلى الافتراضي (`legacy`). ينطبق سلوك إعادة التعيين نفسه على `plugins.slots.memory`. لا يلزم تعديل التهيئة يدويًا.
</Note>

## العلاقة بـ Compaction والذاكرة

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction هي إحدى مسؤوليات محرك السياق. يفوّض المحرك القديم إلى التلخيص المدمج في OpenClaw. يمكن لمحركات Plugin تنفيذ أي استراتيجية Compaction (ملخصات DAG، الاسترجاع المتجهي، وغير ذلك).
  </Accordion>
  <Accordion title="Plugins الذاكرة">
    Plugins الذاكرة (`plugins.slots.memory`) منفصلة عن محركات السياق. توفر Plugins الذاكرة البحث/الاسترجاع؛ وتتحكم محركات السياق فيما يراه النموذج. يمكنهما العمل معًا — فقد يستخدم محرك السياق بيانات Plugin الذاكرة أثناء التجميع. يجب أن تفضّل محركات Plugin التي تريد مسار مطالبة الذاكرة النشطة `buildMemorySystemPromptAddition(...)` من `openclaw/plugin-sdk/core`، والذي يحوّل أقسام مطالبة الذاكرة النشطة إلى `systemPromptAddition` جاهز للإضافة في البداية. إذا احتاج محرك إلى تحكم أدنى مستوى، فلا يزال بإمكانه سحب الأسطر الخام من `openclaw/plugin-sdk/memory-host-core` عبر `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="تنقيح الجلسات">
    يستمر تشغيل تقليم نتائج الأدوات القديمة داخل الذاكرة بغض النظر عن محرك السياق النشط.
  </Accordion>
</AccordionGroup>

## نصائح

- استخدم `openclaw doctor` للتحقق من تحميل محركك بشكل صحيح.
- عند تبديل المحركات، تواصل الجلسات الحالية العمل بسجلها الحالي. يتولى المحرك الجديد التشغيلات المستقبلية.
- تُسجَّل أخطاء المحرك وتظهر في التشخيصات. إذا فشل محرك Plugin في التسجيل أو تعذّر حل معرّف المحرك المحدد، فلن يرجع OpenClaw تلقائيًا؛ وستفشل التشغيلات حتى تصلح Plugin أو تعيد `plugins.slots.contextEngine` إلى `"legacy"`.
- للتطوير، استخدم `openclaw plugins install -l ./my-engine` لربط دليل Plugin محلي من دون نسخه.

## ذات صلة

- [Compaction](/ar/concepts/compaction) — تلخيص المحادثات الطويلة
- [السياق](/ar/concepts/context) — كيف يُبنى السياق لدورات الوكيل
- [بنية Plugin](/ar/plugins/architecture) — تسجيل Plugins محرك السياق
- [بيان Plugin](/ar/plugins/manifest) — حقول بيان Plugin
- [Plugins](/ar/tools/plugin) — نظرة عامة على Plugin
