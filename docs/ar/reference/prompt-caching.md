---
read_when:
    - أنت تريد تقليل تكاليف رموز المطالبة باستخدام الاحتفاظ بالتخزين المؤقت
    - أنت تحتاج إلى سلوك تخزين مؤقت لكل وكيل في الإعدادات متعددة الوكلاء
    - أنت تضبط Heartbeat وتشذيب cache-ttl معًا
summary: عناصر ضبط التخزين المؤقت للمطالبة، وترتيب الدمج، وسلوك المزوّد، وأنماط الضبط
title: التخزين المؤقت للمطالبة
x-i18n:
    generated_at: "2026-04-24T08:03:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534a5648db39dae0979bd8b84263f83332fbaa2dc2c0675409c307fa991c7c8
    source_path: reference/prompt-caching.md
    workflow: 15
---

يعني التخزين المؤقت للمطالبة أن مزوّد النموذج يمكنه إعادة استخدام بادئات المطالبة غير المتغيرة (عادةً تعليمات system/developer وغيرها من السياق المستقر) عبر الأدوار بدلًا من إعادة معالجتها في كل مرة. ويقوم OpenClaw بتوحيد استخدام المزوّد إلى `cacheRead` و`cacheWrite` عندما تكشف واجهة API upstream عن هذه العدادات مباشرة.

يمكن لأسطح الحالة أيضًا استعادة عدادات التخزين المؤقت من أحدث
سجل استخدام في transcript عندما تفتقدها لقطة الجلسة الحية، بحيث يستطيع `/status`
الاستمرار في إظهار سطر التخزين المؤقت بعد فقدان جزئي لبيانات الجلسة الوصفية. وتظل قيم
التخزين المؤقت الحية غير الصفرية الموجودة لها الأولوية على قيم fallback من transcript.

لماذا يهم هذا: انخفاض تكلفة الرموز، واستجابات أسرع، وأداء أكثر قابلية للتوقع في الجلسات طويلة التشغيل. فمن دون التخزين المؤقت، تدفع المطالبات المتكررة تكلفة المطالبة كاملة في كل دور حتى عندما لا يتغير معظم الإدخال.

تغطي هذه الصفحة جميع عناصر الضبط المتعلقة بالتخزين المؤقت التي تؤثر في إعادة استخدام المطالبة وتكلفة الرموز.

مراجع المزوّدين:

- التخزين المؤقت للمطالبة في Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- التخزين المؤقت للمطالبة في OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- رؤوس OpenAI API ومعرّفات الطلبات: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- معرّفات الطلبات والأخطاء في Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## عناصر الضبط الأساسية

### `cacheRetention` (الافتراضي العام، والنموذج، ولكل وكيل)

اضبط الاحتفاظ بالتخزين المؤقت كقيمة افتراضية عامة لجميع النماذج:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

تجاوز لكل نموذج:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

تجاوز لكل وكيل:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

ترتيب دمج الإعداد:

1. `agents.defaults.params` (الافتراضي العام — ينطبق على جميع النماذج)
2. `agents.defaults.models["provider/model"].params` (تجاوز لكل نموذج)
3. `agents.list[].params` (معرّف الوكيل المطابق؛ ويتجاوز حسب المفتاح)

### `contextPruning.mode: "cache-ttl"`

يُشذّب سياق نتائج الأدوات القديمة بعد نوافذ TTL الخاصة بالتخزين المؤقت حتى لا تعيد الطلبات اللاحقة بعد الخمول تخزين السجل كبير الحجم مؤقتًا.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

راجع [تشذيب الجلسة](/ar/concepts/session-pruning) لمعرفة السلوك الكامل.

### Heartbeat للإبقاء على السخونة

يمكن لـ Heartbeat إبقاء نوافذ التخزين المؤقت ساخنة وتقليل عمليات كتابة التخزين المؤقت المتكررة بعد فجوات الخمول.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

يُدعم Heartbeat لكل وكيل عند `agents.list[].heartbeat`.

## سلوك المزوّد

### Anthropic (واجهة API المباشرة)

- `cacheRetention` مدعومة.
- مع ملفات تعريف مصادقة مفتاح Anthropic API، يقوم OpenClaw بتهيئة `cacheRetention: "short"` لمراجع نماذج Anthropic عندما تكون غير مضبوطة.
- تكشف استجابات Anthropic Messages الأصلية عن كل من `cache_read_input_tokens` و`cache_creation_input_tokens`، لذلك يستطيع OpenClaw إظهار كل من `cacheRead` و`cacheWrite`.
- بالنسبة إلى طلبات Anthropic الأصلية، تُطابق `cacheRetention: "short"` التخزين المؤقت ephemeral الافتراضي لمدة 5 دقائق، بينما تُرقّي `cacheRetention: "long"` إلى TTL لمدة ساعة واحدة فقط على مضيفي `api.anthropic.com` المباشرين.

### OpenAI (واجهة API المباشرة)

- يكون التخزين المؤقت للمطالبة تلقائيًا على النماذج الحديثة المدعومة. لا يحتاج OpenClaw إلى حقن علامات تخزين مؤقت على مستوى الكتل.
- يستخدم OpenClaw القيمة `prompt_cache_key` للحفاظ على استقرار توجيه التخزين المؤقت عبر الأدوار، ويستخدم `prompt_cache_retention: "24h"` فقط عندما يتم اختيار `cacheRetention: "long"` على مضيفي OpenAI المباشرين.
- تكشف استجابات OpenAI عن رموز المطالبة المخزنة مؤقتًا عبر `usage.prompt_tokens_details.cached_tokens` (أو `input_tokens_details.cached_tokens` في أحداث Responses API). ويطابق OpenClaw ذلك إلى `cacheRead`.
- لا تكشف OpenAI عن عداد منفصل لرموز كتابة التخزين المؤقت، لذلك تبقى `cacheWrite` مساوية لـ `0` على مسارات OpenAI حتى عندما يكون المزوّد يسخّن التخزين المؤقت.
- تعيد OpenAI رؤوس تتبع وحدود معدل مفيدة مثل `x-request-id` و`openai-processing-ms` و`x-ratelimit-*`، لكن يجب أن يأتي احتساب إصابات التخزين المؤقت من حمولة الاستخدام، لا من الرؤوس.
- عمليًا، تتصرف OpenAI غالبًا كتخزين مؤقت لبادئة أولية بدل إعادة استخدام كامل السجل المتحرك على طريقة Anthropic. فقد تصل الأدوار ذات النص الطويل المستقر إلى حالة plateau قرب `4864` رمزًا مخزنًا مؤقتًا في probes الحية الحالية، بينما تصل transcripts الثقيلة بالأدوات أو على نمط MCP غالبًا إلى plateau قرب `4608` رموز مخزنة مؤقتًا حتى مع التكرارات المطابقة.

### Anthropic Vertex

- تدعم نماذج Anthropic على Vertex AI (`anthropic-vertex/*`) القيمة `cacheRetention` بالطريقة نفسها الخاصة بـ Anthropic المباشرة.
- تطابق `cacheRetention: "long"` القيمة TTL الحقيقية لمدة ساعة واحدة الخاصة بالتخزين المؤقت للمطالبة على نقاط نهاية Vertex AI.
- يتطابق الاحتفاظ الافتراضي بالتخزين المؤقت في `anthropic-vertex` مع افتراضيات Anthropic المباشرة.
- تُوجَّه طلبات Vertex عبر تشكيل تخزين مؤقت مدرك للحدود بحيث تبقى إعادة الاستخدام متوافقة مع ما تستقبله المزوّدات فعليًا.

### Amazon Bedrock

- تدعم مراجع نماذج Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) تمرير `cacheRetention` الصريحة.
- تُفرض على نماذج Bedrock غير Anthropic القيمة `cacheRetention: "none"` وقت التشغيل.

### نماذج Anthropic في OpenRouter

بالنسبة إلى مراجع النماذج `openrouter/anthropic/*`، يحقن OpenClaw
القيمة `cache_control` الخاصة بـ Anthropic على كتل مطالبة system/developer لتحسين
إعادة استخدام التخزين المؤقت للمطالبة فقط عندما يبقى الطلب مستهدفًا
لمسار OpenRouter تم التحقق منه (`openrouter` على نقطة النهاية الافتراضية،
أو أي provider/base URL تُحل إلى `openrouter.ai`).

إذا أعدت توجيه النموذج إلى عنوان proxy عشوائي متوافق مع OpenAI،
فإن OpenClaw يتوقف عن حقن علامات التخزين المؤقت الخاصة بـ Anthropic والمخصصة لـ OpenRouter.

### مزوّدون آخرون

إذا كان المزوّد لا يدعم وضع التخزين المؤقت هذا، فلن يكون لـ `cacheRetention` أي أثر.

### واجهة Google Gemini API المباشرة

- تُبلّغ آلية النقل المباشر لـ Gemini (`api: "google-generative-ai"`) عن إصابات التخزين المؤقت
  عبر `cachedContentTokenCount` من upstream؛ ويطابق OpenClaw ذلك إلى `cacheRead`.
- عندما تكون `cacheRetention` مضبوطة على نموذج Gemini مباشر، يقوم OpenClaw تلقائيًا
  بإنشاء موارد `cachedContents` وإعادة استخدامها وتحديثها لمطالبات النظام
  في تشغيلات Google AI Studio. وهذا يعني أنك لم تعد بحاجة إلى إنشاء
  handle لمحتوى مخزن مؤقت مسبقًا يدويًا.
- لا يزال بإمكانك تمرير handle موجود بالفعل لمحتوى Gemini المخزن مؤقتًا
  عبر `params.cachedContent` (أو `params.cached_content` القديمة) على النموذج
  المُعدّ.
- هذا منفصل عن التخزين المؤقت لبادئة المطالبة في Anthropic/OpenAI. ففي Gemini،
  يدير OpenClaw مورد `cachedContents` أصليًا من المزوّد بدل
  حقن علامات التخزين المؤقت داخل الطلب.

### استخدام Gemini CLI بصيغة JSON

- يمكن لخرج Gemini CLI بصيغة JSON أيضًا إظهار إصابات التخزين المؤقت عبر `stats.cached`;
  ويطابق OpenClaw ذلك إلى `cacheRead`.
- إذا حذفت CLI قيمة `stats.input` المباشرة، يستنتج OpenClaw
  رموز الإدخال من `stats.input_tokens - stats.cached`.
- هذا مجرد توحيد للاستخدام. ولا يعني أن OpenClaw ينشئ
  علامات تخزين مؤقت على نمط Anthropic/OpenAI من أجل Gemini CLI.

## حد التخزين المؤقت لمطالبة النظام

يقسم OpenClaw مطالبة النظام إلى **بادئة مستقرة** و**لاحقة متغيرة**
تفصل بينهما حدود داخلية خاصة ببادئة التخزين المؤقت. ويتم ترتيب المحتوى الواقع فوق
الحد (تعريفات الأدوات، وبيانات Skills الوصفية، وملفات مساحة العمل، وغيرها من
السياق الثابت نسبيًا) بحيث يبقى مطابقًا على مستوى البايتات عبر الأدوار.
أما المحتوى الواقع تحت الحد (مثل `HEARTBEAT.md`، والطوابع الزمنية وقت التشغيل، وغيرها من
البيانات الوصفية الخاصة بكل دور) فيُسمح له بالتغير من دون إبطال
البادئة المخزنة مؤقتًا.

خيارات التصميم الأساسية:

- تُرتّب ملفات سياق المشروع المستقرة في مساحة العمل قبل `HEARTBEAT.md` بحيث
  لا يؤدي churn الخاص بالـ heartbeat إلى كسر البادئة المستقرة.
- يُطبَّق الحد عبر تشكيل التخزين المؤقت لعائلة Anthropic، وعائلة OpenAI، وGoogle، وCLI بحيث تستفيد جميع المزوّدات المدعومة من استقرار البادئة نفسه.
- تُوجَّه طلبات Codex Responses وAnthropic Vertex عبر
  تشكيل تخزين مؤقت مدرك للحدود بحيث تبقى إعادة الاستخدام متوافقة مع ما
  تستقبله المزوّدات فعليًا.
- تُسوّى بصمات مطالبة النظام (المسافات البيضاء، ونهايات الأسطر،
  والسياق المضاف عبر hooks، وترتيب القدرات وقت التشغيل) بحيث تشترك المطالبات
  غير المتغيرة دلاليًا في KV/cache عبر الأدوار.

إذا رأيت ارتفاعات غير متوقعة في `cacheWrite` بعد تغيير في الإعداد أو مساحة العمل،
فتحقق مما إذا كان التغيير يقع فوق حد التخزين المؤقت أو تحته. وغالبًا ما يؤدي نقل
المحتوى المتغير تحت الحد (أو تثبيته) إلى حل المشكلة.

## وسائل الحماية الخاصة باستقرار التخزين المؤقت في OpenClaw

يحافظ OpenClaw أيضًا على حتمية عدة أشكال من الحمولات الحساسة للتخزين المؤقت قبل
أن يصل الطلب إلى المزوّد:

- يتم ترتيب كتالوجات أدوات MCP المجمّعة بشكل حتمي قبل تسجيل
  الأدوات، بحيث لا يؤدي تغيير ترتيب `listTools()` إلى churn في كتلة الأدوات أو
  كسر بادئات التخزين المؤقت للمطالبة.
- تحتفظ الجلسات القديمة ذات كتل الصور المحفوظة **بآخر 3
  أدوار مكتملة** كما هي؛ وقد تُستبدل كتل الصور الأقدم التي تمت معالجتها بالفعل
  بعلامة حتى لا تستمر المتابعات الثقيلة بالصور في إعادة إرسال حمولات
  قديمة كبيرة.

## أنماط الضبط

### حركة مختلطة (الافتراضي الموصى به)

احتفظ بخط أساس طويل العمر على وكيلك الرئيسي، وعطّل التخزين المؤقت على وكلاء التنبيهات الاندفاعيين:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### خط أساس يركز على التكلفة

- اضبط خط الأساس `cacheRetention: "short"`.
- فعّل `contextPruning.mode: "cache-ttl"`.
- أبقِ heartbeat دون TTL فقط للوكلاء الذين يستفيدون من التخزينات المؤقتة الساخنة.

## تشخيصات التخزين المؤقت

يكشف OpenClaw عن تشخيصات مخصصة لتتبع التخزين المؤقت في تشغيلات الوكيل المضمّنة.

أما بالنسبة إلى التشخيصات العادية المواجهة للمستخدم، فيمكن لـ `/status` وملخصات الاستخدام الأخرى استخدام
أحدث إدخال استخدام في transcript كمصدر احتياطي لـ `cacheRead` /
`cacheWrite` عندما لا يحتوي إدخال الجلسة الحي على هذه العدادات.

## اختبارات الانحدار الحية

يحتفظ OpenClaw ببوابة انحدار حية واحدة مجمعة لبادئات المطالبة المتكررة، وأدوار الأدوات، وأدوار الصور، وtranscripts على نمط MCP، وضبط no-cache في Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

شغّل البوابة الحية الضيقة باستخدام:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

يخزن ملف خط الأساس أحدث الأرقام الحية المرصودة بالإضافة إلى الحدود الدنيا الخاصة بالمزوّد المستخدمة في الاختبار.
كما يستخدم المشغّل أيضًا معرّفات جلسات جديدة لكل تشغيل ومساحات أسماء جديدة للمطالبات حتى لا تلوث حالة التخزين المؤقت السابقة عينة الانحدار الحالية.

تتعمد هذه الاختبارات عدم استخدام معايير نجاح متطابقة عبر المزوّدين.

### التوقعات الحية لـ Anthropic

- توقع عمليات warmup writes صريحة عبر `cacheWrite`.
- توقع إعادة استخدام شبه كاملة للسجل في الأدوار المتكررة لأن التحكم في التخزين المؤقت لدى Anthropic يدفع نقطة كسر التخزين المؤقت عبر المحادثة.
- ما تزال assertions الحية الحالية تستخدم حدودًا مرتفعة لمعدل الإصابة في المسارات المستقرة ومسارات الأدوات والصور.

### التوقعات الحية لـ OpenAI

- توقّع `cacheRead` فقط. وتبقى `cacheWrite` مساوية لـ `0`.
- تعامل مع إعادة استخدام التخزين المؤقت في الأدوار المتكررة على أنها plateau خاصة بالمزوّد، لا على أنها إعادة استخدام كاملة متحركة للسجل على طريقة Anthropic.
- تستخدم assertions الحية الحالية فحوصات حد أدنى محافظة مشتقة من السلوك الحي المرصود على `gpt-5.4-mini`:
  - البادئة المستقرة: `cacheRead >= 4608`، ومعدل الإصابة `>= 0.90`
  - transcript الأداة: `cacheRead >= 4096`، ومعدل الإصابة `>= 0.85`
  - transcript الصورة: `cacheRead >= 3840`، ومعدل الإصابة `>= 0.82`
  - transcript على نمط MCP: `cacheRead >= 4096`، ومعدل الإصابة `>= 0.85`

هبط التحقق الحي المجمّع الجديد في 2026-04-04 عند:

- البادئة المستقرة: `cacheRead=4864`، ومعدل الإصابة `0.966`
- transcript الأداة: `cacheRead=4608`، ومعدل الإصابة `0.896`
- transcript الصورة: `cacheRead=4864`، ومعدل الإصابة `0.954`
- transcript على نمط MCP: `cacheRead=4608`، ومعدل الإصابة `0.891`

كان الزمن المحلي الأخير على ساعة الجدار للبوابة المجمعة نحو `88s`.

لماذا تختلف assertions:

- تكشف Anthropic عن نقاط كسر صريحة للتخزين المؤقت وإعادة استخدام متحركة لسجل المحادثة.
- يظل التخزين المؤقت للمطالبة في OpenAI حساسًا لبادئة المطالبة المطابقة تمامًا، لكن البادئة القابلة لإعادة الاستخدام فعليًا في حركة Responses الحية قد تصل إلى plateau أبكر من المطالبة الكاملة.
- وبسبب ذلك، فإن مقارنة Anthropic وOpenAI بحد نسبة مئوية واحد عابر للمزوّدين يخلق حالات انحدار كاذبة.

### إعداد `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # اختياري
    includeMessages: false # الافتراضي true
    includePrompt: false # الافتراضي true
    includeSystem: false # الافتراضي true
```

القيم الافتراضية:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### مفاتيح env للتشخيص لمرة واحدة

- `OPENCLAW_CACHE_TRACE=1` يفعّل تتبع التخزين المؤقت.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` يتجاوز مسار الخرج.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` يبدّل التقاط حمولة الرسالة الكاملة.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` يبدّل التقاط نص المطالبة.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` يبدّل التقاط مطالبة النظام.

### ما الذي يجب فحصه

- تكون أحداث تتبع التخزين المؤقت بصيغة JSONL وتتضمن لقطات مرحلية مثل `session:loaded` و`prompt:before` و`stream:context` و`session:after`.
- يظهر أثر رموز التخزين المؤقت لكل دور في أسطح الاستخدام العادية عبر `cacheRead` و`cacheWrite` (مثل `/usage full` وملخصات استخدام الجلسة).
- بالنسبة إلى Anthropic، توقع كلًا من `cacheRead` و`cacheWrite` عندما يكون التخزين المؤقت نشطًا.
- بالنسبة إلى OpenAI، توقع `cacheRead` عند إصابات التخزين المؤقت وأن تبقى `cacheWrite` مساوية لـ `0`؛ إذ لا تنشر OpenAI حقلًا منفصلًا لرموز كتابة التخزين المؤقت.
- إذا كنت تحتاج إلى تتبع الطلبات، فسجّل معرّفات الطلبات ورؤوس حدود المعدل بشكل منفصل عن مقاييس التخزين المؤقت. فخرج تتبع التخزين المؤقت الحالي في OpenClaw يركز على شكل المطالبة/الجلسة والاستخدام الموحّد للرموز بدل رؤوس استجابة المزوّد الخام.

## استكشاف الأخطاء السريع

- ارتفاع `cacheWrite` في معظم الأدوار: تحقق من المدخلات المتغيرة في مطالبة النظام وتأكد من أن النموذج/المزوّد يدعم إعدادات التخزين المؤقت لديك.
- ارتفاع `cacheWrite` في Anthropic: غالبًا ما يعني أن نقطة كسر التخزين المؤقت تقع على محتوى يتغير في كل طلب.
- انخفاض `cacheRead` في OpenAI: تحقق من أن البادئة المستقرة في المقدمة، وأن البادئة المتكررة لا تقل عن 1024 رمزًا، وأن `prompt_cache_key` نفسها يُعاد استخدامها في الأدوار التي يجب أن تشترك في التخزين المؤقت.
- عدم وجود أثر لـ `cacheRetention`: تأكد من أن مفتاح النموذج يطابق `agents.defaults.models["provider/model"]`.
- طلبات Bedrock Nova/Mistral مع إعدادات التخزين المؤقت: من المتوقع فرضها وقت التشغيل إلى `none`.

مستندات ذات صلة:

- [Anthropic](/ar/providers/anthropic)
- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [تشذيب الجلسة](/ar/concepts/session-pruning)
- [مرجع إعداد Gateway](/ar/gateway/configuration-reference)

## ذو صلة

- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [استخدام API والتكاليف](/ar/reference/api-usage-costs)
