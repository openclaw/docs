---
read_when:
    - تريد فهم كيفية تجميع OpenClaw لسياق النموذج
    - أنت تبدّل بين المحرّك القديم ومحرّك Plugin
    - أنت تبني Plugin لمحرك السياق
sidebarTitle: Context engine
summary: 'محرك السياق: تجميع سياق قابل للتوصيل، وCompaction، ودورة حياة الوكيل الفرعي'
title: محرك السياق
x-i18n:
    generated_at: "2026-06-27T17:27:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 124b6daf52f3d58f756352e2e169697541a8b6e67aecaa5a219bed15bda801cd
    source_path: concepts/context-engine.md
    workflow: 16
---

يتحكم **محرك السياق** في كيفية بناء OpenClaw لسياق النموذج لكل تشغيل: أي الرسائل يتم تضمينها، وكيفية تلخيص السجل الأقدم، وكيفية إدارة السياق عبر حدود الوكلاء الفرعيين.

يأتي OpenClaw مع محرك `legacy` مدمج ويستخدمه افتراضيًا - لا يحتاج معظم المستخدمين إلى تغيير هذا. ثبّت وحدد محرك Plugin فقط عندما تريد سلوكًا مختلفًا للتجميع أو Compaction أو الاستدعاء عبر الجلسات.

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
    اضبط `contextEngine` على `"legacy"` (أو أزل المفتاح بالكامل - `"legacy"` هو الافتراضي).
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
    يُستدعى عندما تمتلئ نافذة السياق، أو عندما يشغّل المستخدم `/compact`. يلخص المحرك السجل الأقدم لتفريغ مساحة.
  </Accordion>
  <Accordion title="4. بعد الدور">
    يُستدعى بعد اكتمال التشغيل. يمكن للمحرك حفظ الحالة، أو تشغيل Compaction في الخلفية، أو تحديث الفهارس.
  </Accordion>
</AccordionGroup>

بالنسبة إلى حزمة Codex غير ACP المدمجة، يطبق OpenClaw دورة الحياة نفسها عبر إسقاط السياق المجمّع في تعليمات مطور Codex ومطالبة الدور الحالي. يظل Codex مالكًا لسجل المحادثة الأصلي وCompactor الأصلي الخاص به.

### دورة حياة الوكيل الفرعي (اختياري)

يستدعي OpenClaw خطافي دورة حياة اختياريين للوكلاء الفرعيين:

<ParamField path="prepareSubagentSpawn" type="method">
  حضّر حالة السياق المشتركة قبل بدء تشغيل تابع. يتلقى الخطاف مفاتيح جلسة الأصل/التابع، و`contextMode` (`isolated` أو `fork`)، ومعرّفات/ملفات النص المتاح، وTTL اختياريًا. إذا أعاد مقبض تراجع، يستدعيه OpenClaw عندما يفشل الإنشاء بعد نجاح التحضير. عمليات إنشاء الوكلاء الفرعيين الأصلية التي تطلب `lightContext` وتتحول إلى `contextMode="isolated"` تتجاوز هذا الخطاف عمدًا حتى يبدأ التابع من سياق التمهيد الخفيف دون حالة ما قبل الإنشاء المُدارة بواسطة محرك السياق.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  نظّف عند اكتمال جلسة وكيل فرعي أو كنسها.
</ParamField>

### إضافة مطالبة النظام

يمكن لطريقة `assemble` إعادة سلسلة `systemPromptAddition`. يضيف OpenClaw هذه في بداية مطالبة النظام للتشغيل. يتيح ذلك للمحركات حقن إرشادات استدعاء ديناميكية، أو تعليمات استرجاع، أو تلميحات واعية بالسياق دون الحاجة إلى ملفات مساحة عمل ثابتة.

## محرك legacy

يحافظ محرك `legacy` المدمج على السلوك الأصلي لـ OpenClaw:

- **الاستيعاب**: بلا إجراء (يتولى مدير الجلسة حفظ الرسائل مباشرة).
- **التجميع**: تمرير مباشر (يتولى خط sanitize → validate → limit الحالي في وقت التشغيل تجميع السياق).
- **Compaction**: يفوض إلى Compaction التلخيص المدمج، الذي ينشئ ملخصًا واحدًا للرسائل الأقدم ويبقي الرسائل الحديثة كما هي.
- **بعد الدور**: بلا إجراء.

لا يسجل محرك legacy أدوات ولا يوفر `systemPromptAddition`.

عندما لا يكون `plugins.slots.contextEngine` مضبوطًا (أو يكون مضبوطًا على `"legacy"`)، يُستخدم هذا المحرك تلقائيًا.

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

يتضمن المصنع `ctx` قيم `config` و`agentDir` و`workspaceDir` الاختيارية
حتى تتمكن Plugins من تهيئة حالة لكل وكيل أو لكل مساحة عمل قبل تشغيل
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

| العضو              | النوع    | الغرض                                                    |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | خاصية    | معرّف المحرك واسمه وإصداره وما إذا كان يملك Compaction |
| `ingest(params)`   | طريقة    | تخزين رسالة واحدة                                      |
| `assemble(params)` | طريقة    | بناء سياق لتشغيل نموذج (يعيد `AssembleResult`)         |
| `compact(params)`  | طريقة    | تلخيص/تقليل السياق                                     |

تعيد `assemble` قيمة `AssembleResult` تتضمن:

<ParamField path="messages" type="Message[]" required>
  الرسائل المرتبة لإرسالها إلى النموذج.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  تقدير المحرك لإجمالي الرموز في السياق المجمّع. يستخدم OpenClaw هذا لقرارات عتبة Compaction والتقارير التشخيصية.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  تُضاف في بداية مطالبة النظام.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  يتحكم في تقدير الرموز الذي يستخدمه المشغّل لفحوصات
  الفيض الاستباقية. الافتراضي هو `"assembled"`، ما يعني فحص تقدير
  المطالبة المجمّعة فقط - وهو مناسب للمحركات التي تعيد سياقًا
  ذا نافذة ومكتفيًا بذاته. اضبطه على `"preassembly_may_overflow"` فقط
  عندما يمكن للرؤية المجمّعة لديك إخفاء خطر الفيض في النص الأساسي؛
  عندها يأخذ المشغّل الحد الأقصى بين التقدير المجمّع
  وتقدير سجل الجلسة قبل التجميع (غير ذي النافذة) عند تحديد
  ما إذا كان سيجري Compaction استباقيًا. في كلتا الحالتين، تظل الرسائل التي تعيدها
  هي ما يراه النموذج - يؤثر `promptAuthority` فقط في الفحص المسبق.
</ParamField>

تعيد `compact` قيمة `CompactResult`. عندما يدوّر Compaction النص النشط،
يحدد `result.sessionId` و`result.sessionFile` الجلسة اللاحقة
التي يجب أن تستخدمها إعادة المحاولة أو الدور التالي.

الأعضاء الاختيارية:

| العضو                          | النوع  | الغرض                                                                                                         |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | طريقة  | تهيئة حالة المحرك لجلسة. يُستدعى مرة واحدة عندما يرى المحرك جلسة لأول مرة (مثلًا، استيراد السجل).            |
| `ingestBatch(params)`          | طريقة  | استيعاب دور مكتمل كدفعة. يُستدعى بعد اكتمال التشغيل، مع كل رسائل ذلك الدور دفعة واحدة.                     |
| `afterTurn(params)`            | طريقة  | عمل دورة الحياة بعد التشغيل (حفظ الحالة، تشغيل Compaction في الخلفية).                                      |
| `prepareSubagentSpawn(params)` | طريقة  | إعداد حالة مشتركة لجلسة تابعة قبل أن تبدأ.                                                                  |
| `onSubagentEnded(params)`      | طريقة  | التنظيف بعد انتهاء وكيل فرعي.                                                                                |
| `dispose()`                    | طريقة  | تحرير الموارد. يُستدعى أثناء إيقاف Gateway أو إعادة تحميل Plugin - وليس لكل جلسة.                           |

### إعدادات وقت التشغيل

تتلقى خطافات دورة الحياة التي تعمل داخل OpenClaw كائن
`runtimeSettings` اختياريًا. إنه سطح API داخلي ذو إصدارات وللقراءة فقط
بين المنتج/المستهلك: ينتجه OpenClaw لمحرك السياق المحدد،
ويستهلكه محرك السياق داخل خطافات دورة الحياة. لا يُعرض
مباشرة للمستخدمين ولا ينشئ سطح تقارير مخصصًا.

- `schemaVersion`: حاليًا `1`
- `runtime`: مضيف OpenClaw، ووضع وقت التشغيل (`normal` أو `fallback` أو
  `degraded`)، ومعرّفات الحزمة/وقت التشغيل الاختيارية
- `contextEngineSelection`: معرّف محرك السياق المحدد ومصدر التحديد
- `executionHost`: معرّف المضيف وتسمية السطح الذي يستدعي الخطاف
- `model`: النموذج المطلوب، والنموذج المحلول، والمزوّد، وعائلة النموذج الاختيارية
- `limits`: ميزانية رموز المطالبة والحد الأقصى لرموز الإخراج عند معرفتهما
- `diagnostics`: رموز أسباب fallback المغلق وdegraded عند معرفتها

تُمثل الحقول التي قد تكون غير معروفة بقيمة `null`؛ وتظل حقول التمييز
مثل وضع وقت التشغيل ومصدر التحديد غير قابلة للإفراغ. تظل المحركات الأقدم
متوافقة: إذا رفض محرك legacy صارم `runtimeSettings` كخاصية غير معروفة،
يعيد OpenClaw محاولة استدعاء دورة الحياة دونها بدلًا من عزل
المحرك.

### متطلبات المضيف

يمكن لمحركات السياق إعلان متطلبات قدرات المضيف على `info.hostRequirements`.
يفحص OpenClaw هذه المتطلبات قبل بدء العملية ويفشل مغلقًا
مع خطأ وصفي عندما لا يستطيع وقت التشغيل المحدد تلبيتها.

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

تفي تشغيلات وكلاء Codex الأصلية وOpenClaw المضمنة بـ `assemble-before-prompt`.
أما خلفيات CLI العامة فلا تفعل ذلك، لذلك تُرفض المحركات التي تتطلبها قبل بدء
عملية CLI.

### عزل الفشل

يعزل OpenClaw محرك Plugin المحدد عن مسار الرد الأساسي. إذا كان
محرك غير legacy مفقودًا، أو فشل في التحقق من العقد، أو طرح خطأ أثناء إنشاء
المصنع، أو طرح خطأ من طريقة دورة حياة، يعزل OpenClaw ذلك المحرك
لعملية Gateway الحالية ويخفّض عمل محرك السياق إلى محرك
`legacy` المدمج. يُسجل الخطأ مع العملية الفاشلة حتى يتمكن
المشغّل من إصلاح Plugin أو تحديثه أو تعطيله دون أن يصمت الوكيل.

تختلف إخفاقات متطلبات المضيف: عندما يصرّح محرك بأن runtime
يفتقر إلى قدرة مطلوبة، يفشل OpenClaw على نحو مغلق قبل بدء التشغيل. وهذا
يحمي المحركات التي قد تفسد الحالة إذا عملت في مضيف غير مدعوم.

### ownsCompaction

يتحكم `ownsCompaction` في ما إذا كان auto-compaction المدمج داخل المحاولة في OpenClaw runtime يبقى مفعلا للتشغيل:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    يملك المحرك سلوك Compaction. يعطل OpenClaw auto-compaction المدمج في OpenClaw runtime لذلك التشغيل، ويكون تنفيذ `compact()` في المحرك مسؤولا عن `/compact`، وCompaction استرداد الفيض، وأي Compaction استباقي يريد تنفيذه في `afterTurn()`. قد يظل OpenClaw يشغل وسيلة الحماية من فيض ما قبل الموجه؛ وعندما يتنبأ بأن النص الكامل سيفيض، يستدعي مسار الاسترداد `compact()` للمحرك النشط قبل إرسال موجه آخر.
  </Accordion>
  <Accordion title="ownsCompaction: false أو غير معيّن">
    قد يظل auto-compaction المدمج في OpenClaw runtime يعمل أثناء تنفيذ الموجه، لكن طريقة `compact()` للمحرك النشط تظل تُستدعى من أجل `/compact` واسترداد الفيض.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` لا يعني **أن OpenClaw يعود تلقائيا** إلى مسار Compaction الخاص بالمحرك القديم.
</Warning>

يعني ذلك أن هناك نمطين صالحين للـ Plugin:

<Tabs>
  <Tab title="وضع الامتلاك">
    نفذ خوارزمية Compaction الخاصة بك واضبط `ownsCompaction: true`.
  </Tab>
  <Tab title="وضع التفويض">
    اضبط `ownsCompaction: false` واجعل `compact()` يستدعي `delegateCompactionToRuntime(...)` من `openclaw/plugin-sdk/core` لاستخدام سلوك Compaction المدمج في OpenClaw.
  </Tab>
</Tabs>

تكون `compact()` عديمة الأثر غير آمنة لمحرك نشط لا يملك Compaction، لأنها تعطل مسار Compaction العادي لـ `/compact` واسترداد الفيض لذلك موضع المحرك.

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
الموضع حصري وقت التشغيل - يتم حل محرك سياق مسجل واحد فقط لتشغيل معين أو عملية Compaction معينة. يمكن للـ Plugins الأخرى المفعلة ذات `kind: "context-engine"` أن تظل محملة وتشغل رمز التسجيل الخاص بها؛ يحدد `plugins.slots.contextEngine` فقط معرف المحرك المسجل الذي يحله OpenClaw عندما يحتاج إلى محرك سياق.
</Note>

<Note>
**إلغاء تثبيت Plugin:** عندما تلغي تثبيت Plugin المحدد حاليا كـ `plugins.slots.contextEngine`، يعيد OpenClaw ضبط الموضع إلى الافتراضي (`legacy`). ينطبق سلوك إعادة الضبط نفسه على `plugins.slots.memory`. لا يلزم تعديل يدوي للتهيئة.
</Note>

## العلاقة بـ Compaction والذاكرة

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction هي إحدى مسؤوليات محرك السياق. يفوض المحرك القديم إلى التلخيص المدمج في OpenClaw. يمكن لمحركات Plugin تنفيذ أي استراتيجية Compaction (ملخصات DAG، استرجاع متجهي، وما إلى ذلك).
  </Accordion>
  <Accordion title="Plugins الذاكرة">
    Plugins الذاكرة (`plugins.slots.memory`) منفصلة عن محركات السياق. توفر Plugins الذاكرة البحث/الاسترجاع؛ وتتحكم محركات السياق في ما يراه النموذج. يمكنها العمل معا - قد يستخدم محرك السياق بيانات Plugin الذاكرة أثناء التجميع. يجب أن تفضل محركات Plugin التي تريد مسار موجه الذاكرة النشط استخدام `buildMemorySystemPromptAddition(...)` من `openclaw/plugin-sdk/core`، والذي يحول أقسام موجه الذاكرة النشطة إلى `systemPromptAddition` جاهز للإضافة في المقدمة. إذا احتاج محرك إلى تحكم أدنى مستوى، فلا يزال بإمكانه سحب الأسطر الخام من `openclaw/plugin-sdk/memory-host-core` عبر `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="تشذيب الجلسة">
    يظل تقليم نتائج الأدوات القديمة في الذاكرة يعمل بغض النظر عن محرك السياق النشط.
  </Accordion>
</AccordionGroup>

## نصائح

- استخدم `openclaw doctor` للتحقق من أن محركك يتم تحميله بشكل صحيح.
- إذا بدلت المحركات، تتابع الجلسات الحالية بسجلها الحالي. يتولى المحرك الجديد عمليات التشغيل المستقبلية.
- يتم تسجيل أخطاء المحرك، ويتم عزل محرك Plugin المحدد لعملية Gateway الحالية. يعود OpenClaw إلى `legacy` لأدوار المستخدم حتى تستمر الردود، لكن يجب عليك مع ذلك إصلاح Plugin المعطل أو تحديثه أو تعطيله أو إلغاء تثبيته.
- للتطوير، استخدم `openclaw plugins install -l ./my-engine` لربط دليل Plugin محلي بدون نسخ.

## ذات صلة

- [Compaction](/ar/concepts/compaction) - تلخيص المحادثات الطويلة
- [السياق](/ar/concepts/context) - كيفية بناء السياق لأدوار الوكيل
- [معمارية Plugin](/ar/plugins/architecture) - تسجيل Plugins محرك السياق
- [بيان Plugin](/ar/plugins/manifest) - حقول بيان Plugin
- [Plugins](/ar/tools/plugin) - نظرة عامة على Plugin
