---
read_when:
    - تريد فهم كيفية قيام OpenClaw بتجميع سياق النموذج
    - أنت تنتقل بين المحرك القديم ومحرك Plugin
    - أنت تبني Plugin لمحرك السياق
sidebarTitle: Context engine
summary: 'محرك السياق: تجميع سياق قابل للتوصيل، وCompaction، ودورة حياة الوكيل الفرعي'
title: محرك السياق
x-i18n:
    generated_at: "2026-04-26T11:27:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a362f26cde3abca7c15487fa43a411f21e3114491e27a752ca06454add60481
    source_path: concepts/context-engine.md
    workflow: 15
---

يتحكم **محرك السياق** في كيفية بناء OpenClaw لسياق النموذج لكل تشغيل: أي الرسائل يجب تضمينها، وكيفية تلخيص السجل الأقدم، وكيفية إدارة السياق عبر حدود الوكلاء الفرعيين.

يأتي OpenClaw مزودًا بمحرك `legacy` مضمّن ويستخدمه افتراضيًا — ومعظم المستخدمين لا يحتاجون أبدًا إلى تغيير ذلك. ثبّت واختر محرك Plugin فقط عندما تريد سلوكًا مختلفًا للتجميع أو Compaction أو الاستدعاء عبر الجلسات.

## البدء السريع

<Steps>
  <Step title="تحقق من المحرك النشط">
    ```bash
    openclaw doctor
    # أو افحص التهيئة مباشرة:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="ثبّت محرك Plugin">
    يتم تثبيت Plugins الخاصة بمحرك السياق مثل أي Plugin آخر في OpenClaw.

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
            // توضع هنا التهيئة الخاصة بالـ Plugin (راجع وثائق Plugin)
          },
        },
      },
    }
    ```

    أعد تشغيل Gateway بعد التثبيت والتهيئة.

  </Step>
  <Step title="العودة إلى legacy (اختياري)">
    عيّن `contextEngine` إلى `"legacy"` (أو أزل المفتاح بالكامل — إذ إن `"legacy"` هو الافتراضي).
  </Step>
</Steps>

## كيف يعمل

في كل مرة يشغّل فيها OpenClaw مطالبة نموذج، يشارك محرك السياق في أربع نقاط من دورة الحياة:

<AccordionGroup>
  <Accordion title="1. الاستيعاب">
    يُستدعى عند إضافة رسالة جديدة إلى الجلسة. ويمكن للمحرك تخزين الرسالة أو فهرستها في مخزن بياناته الخاص.
  </Accordion>
  <Accordion title="2. التجميع">
    يُستدعى قبل كل تشغيل للنموذج. ويعيد المحرك مجموعة مرتبة من الرسائل (بالإضافة إلى `systemPromptAddition` اختياري) تلائم ميزانية الرموز.
  </Accordion>
  <Accordion title="3. Compaction">
    يُستدعى عندما تمتلئ نافذة السياق، أو عندما يشغّل المستخدم `/compact`. ويقوم المحرك بتلخيص السجل الأقدم لتحرير مساحة.
  </Accordion>
  <Accordion title="4. بعد الدور">
    يُستدعى بعد اكتمال التشغيل. ويمكن للمحرك حفظ الحالة، أو تشغيل Compaction في الخلفية، أو تحديث الفهارس.
  </Accordion>
</AccordionGroup>

بالنسبة إلى حزمة Codex غير ACP المضمّنة، يطبق OpenClaw دورة الحياة نفسها من خلال إسقاط السياق المجمّع إلى تعليمات مطوّر Codex ومطالبة الدور الحالية. ولا يزال Codex يملك سجل سلاسله الأصلي وcompactor الأصلي الخاص به.

### دورة حياة الوكيل الفرعي (اختياري)

يستدعي OpenClaw خطافين اختياريين لدورة حياة الوكيل الفرعي:

<ParamField path="prepareSubagentSpawn" type="method">
  إعداد حالة سياق مشتركة قبل بدء تشغيل فرعي. يتلقى الخطاف مفاتيح جلسات الأصل/الفرعي، و`contextMode` (`isolated` أو `fork`)، ومعرّفات/ملفات النصوص المتاحة، وTTL اختياري. وإذا أعاد مقبض rollback، يستدعيه OpenClaw عندما يفشل التشغيل الفرعي بعد نجاح الإعداد.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  التنظيف عند اكتمال جلسة وكيل فرعي أو عند كنسها.
</ParamField>

### إضافة مطالبة النظام

يمكن لطريقة `assemble` أن تعيد سلسلة `systemPromptAddition`. ويضيف OpenClaw هذه السلسلة في مقدمة مطالبة النظام الخاصة بالتشغيل. وهذا يسمح للمحركات بحقن إرشادات استدعاء ديناميكية، أو تعليمات استرجاع، أو تلميحات مدركة للسياق دون الحاجة إلى ملفات مساحة عمل ثابتة.

## المحرك legacy

يحافظ المحرك `legacy` المضمّن على السلوك الأصلي لـ OpenClaw:

- **الاستيعاب**: بلا عملية (مدير الجلسة يتولى حفظ الرسائل مباشرة).
- **التجميع**: تمرير مباشر (يتولى خط الأنابيب الحالي sanitize ← validate ← limit في بيئة التشغيل تجميع السياق).
- **Compaction**: يفوض إلى Compaction التلخيصي المضمّن، الذي ينشئ ملخصًا واحدًا للرسائل الأقدم ويبقي الرسائل الحديثة كما هي.
- **بعد الدور**: بلا عملية.

لا يسجل المحرك legacy أدوات ولا يوفّر `systemPromptAddition`.

عندما لا يتم تعيين `plugins.slots.contextEngine` (أو يتم تعيينه إلى `"legacy"`)، يُستخدم هذا المحرك تلقائيًا.

## محركات Plugin

يمكن لأي Plugin تسجيل محرك سياق باستخدام Plugin API:

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
      // خزّن الرسالة في مخزن البيانات الخاص بك
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // أعد الرسائل التي تلائم الميزانية
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
      // لخص السياق الأقدم
      return { ok: true, compacted: true };
    },
  }));
}
```

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

| العضو              | النوع    | الغرض                                                    |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | خاصية    | معرّف المحرك واسمه وإصداره وما إذا كان يملك Compaction |
| `ingest(params)`   | method   | تخزين رسالة واحدة                                       |
| `assemble(params)` | method   | بناء السياق لتشغيل نموذج (يعيد `AssembleResult`)        |
| `compact(params)`  | method   | تلخيص/تقليص السياق                                      |

تعيد `assemble` قيمة `AssembleResult` تتضمن:

<ParamField path="messages" type="Message[]" required>
  الرسائل المرتبة التي ستُرسل إلى النموذج.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  تقدير المحرك لإجمالي الرموز في السياق المجمّع. ويستخدم OpenClaw هذا لاتخاذ قرارات عتبة Compaction وللتقارير التشخيصية.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  تُضاف في مقدمة مطالبة النظام.
</ParamField>

الأعضاء الاختيارية:

| العضو                         | النوع  | الغرض                                                                                                         |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | method | تهيئة حالة المحرك لجلسة. تُستدعى مرة واحدة عندما يرى المحرك الجلسة لأول مرة (مثل استيراد السجل). |
| `ingestBatch(params)`          | method | استيعاب دور مكتمل كدفعة. تُستدعى بعد اكتمال التشغيل، مع جميع رسائل ذلك الدور دفعة واحدة.     |
| `afterTurn(params)`            | method | أعمال دورة الحياة بعد التشغيل (حفظ الحالة، تشغيل Compaction في الخلفية).                                         |
| `prepareSubagentSpawn(params)` | method | إعداد حالة مشتركة لجلسة فرعية قبل بدئها.                                                       |
| `onSubagentEnded(params)`      | method | التنظيف بعد انتهاء وكيل فرعي.                                                                                 |
| `dispose()`                    | method | تحرير الموارد. تُستدعى أثناء إيقاف Gateway أو إعادة تحميل Plugin — وليس لكل جلسة.                           |

### ownsCompaction

يتحكم `ownsCompaction` في ما إذا كان Compaction التلقائي المضمّن داخل المحاولة في Pi يظل مفعّلًا أثناء التشغيل:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    يملك المحرك سلوك Compaction. ويعطّل OpenClaw Compaction التلقائي المضمّن في Pi لذلك التشغيل، وتصبح عملية `compact()` الخاصة بالمحرك مسؤولة عن `/compact`، وCompaction الاسترداد عند الفائض، وأي Compaction استباقي يريد المحرك تنفيذه في `afterTurn()`. وقد يظل OpenClaw يشغّل حاجز الحماية قبل المطالبة عند الفائض؛ فعندما يتوقع أن النص الكامل سيتجاوز الحد، يستدعي مسار الاسترداد `compact()` في المحرك النشط قبل إرسال مطالبة أخرى.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    قد يظل Compaction التلقائي المضمّن في Pi يعمل أثناء تنفيذ المطالبة، لكن طريقة `compact()` الخاصة بالمحرك النشط تظل تُستدعى من أجل `/compact` واسترداد الفائض.
  </Accordion>
</AccordionGroup>

<Warning>
لا يعني `ownsCompaction: false` أن OpenClaw يعود تلقائيًا إلى مسار Compaction الخاص بالمحرك legacy.
</Warning>

وهذا يعني وجود نمطين صالحين للـ Plugin:

<Tabs>
  <Tab title="نمط التملك">
    نفّذ خوارزمية Compaction خاصة بك وعيّن `ownsCompaction: true`.
  </Tab>
  <Tab title="نمط التفويض">
    عيّن `ownsCompaction: false` واجعل `compact()` تستدعي `delegateCompactionToRuntime(...)` من `openclaw/plugin-sdk/core` لاستخدام سلوك Compaction المضمّن في OpenClaw.
  </Tab>
</Tabs>

إن `compact()` الخالية من العمليات ليست آمنة لمحرك نشط غير مالك لأنها تعطل مسار `/compact` وCompaction استرداد الفائض العادي لذلك الشق الخاص بالمحرك.

## مرجع التهيئة

```json5
{
  plugins: {
    slots: {
      // حدد محرك السياق النشط. الافتراضي: "legacy".
      // عيّنه إلى معرّف Plugin لاستخدام محرك Plugin.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
الشق حصري في وقت التشغيل — إذ لا يُحل سوى محرك سياق واحد مسجّل لتشغيل أو عملية Compaction معينة. ويمكن لـ Plugins أخرى مفعّلة من `kind: "context-engine"` أن تُحمّل وتنفّذ كود التسجيل الخاص بها؛ ويحدد `plugins.slots.contextEngine` فقط معرّف المحرك المسجّل الذي يحله OpenClaw عندما يحتاج إلى محرك سياق.
</Note>

<Note>
**إلغاء تثبيت Plugin:** عندما تلغي تثبيت Plugin المحدد حاليًا كـ `plugins.slots.contextEngine`، يعيد OpenClaw ضبط الشق إلى الافتراضي (`legacy`). وينطبق سلوك إعادة الضبط نفسه على `plugins.slots.memory`. لا يلزم أي تعديل يدوي في التهيئة.
</Note>

## العلاقة مع Compaction وActive Memory

<AccordionGroup>
  <Accordion title="Compaction">
    يمثل Compaction إحدى مسؤوليات محرك السياق. ويفوض المحرك legacy إلى التلخيص المضمّن في OpenClaw. ويمكن لمحركات Plugin تنفيذ أي استراتيجية Compaction (ملخصات DAG، أو استرجاع متجهي، وما إلى ذلك).
  </Accordion>
  <Accordion title="Plugins الخاصة بالذاكرة">
    Plugins الخاصة بالذاكرة (`plugins.slots.memory`) منفصلة عن محركات السياق. وتوفر Plugins الخاصة بالذاكرة البحث/الاسترجاع؛ بينما تتحكم محركات السياق فيما يراه النموذج. ويمكن أن تعملا معًا — فقد يستخدم محرك سياق بيانات Plugin للذاكرة أثناء التجميع. ويجب أن تفضّل محركات Plugin التي تريد مسار مطالبة الذاكرة النشط `buildMemorySystemPromptAddition(...)` من `openclaw/plugin-sdk/core`، إذ يحوّل أقسام مطالبة Active Memory النشطة إلى `systemPromptAddition` جاهزة للإضافة في المقدمة. وإذا احتاج المحرك إلى تحكم أدنى مستوى، فلا يزال بإمكانه سحب الأسطر الخام من `openclaw/plugin-sdk/memory-host-core` عبر `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="تشذيب الجلسة">
    يستمر تقليم نتائج الأدوات القديمة داخل الذاكرة بغض النظر عن محرك السياق النشط.
  </Accordion>
</AccordionGroup>

## نصائح

- استخدم `openclaw doctor` للتحقق من أن المحرك يتم تحميله بشكل صحيح.
- عند التبديل بين المحركات، تستمر الجلسات الحالية بسجلها الحالي. ويتولى المحرك الجديد التشغيلات المستقبلية.
- يتم تسجيل أخطاء المحرك وإظهارها في التشخيصات. وإذا فشل محرك Plugin في التسجيل أو تعذر حل معرّف المحرك المحدد، فلن يعود OpenClaw تلقائيًا؛ بل ستفشل التشغيلات حتى تصلح Plugin أو تعيد `plugins.slots.contextEngine` إلى `"legacy"`.
- أثناء التطوير، استخدم `openclaw plugins install -l ./my-engine` لربط دليل Plugin محلي من دون نسخه.

## ذو صلة

- [Compaction](/ar/concepts/compaction) — تلخيص المحادثات الطويلة
- [السياق](/ar/concepts/context) — كيفية بناء السياق لأدوار الوكيل
- [بنية Plugin](/ar/plugins/architecture) — تسجيل Plugins الخاصة بمحرك السياق
- [Plugin manifest](/ar/plugins/manifest) — حقول بيان Plugin
- [Plugins](/ar/tools/plugin) — نظرة عامة على Plugins
