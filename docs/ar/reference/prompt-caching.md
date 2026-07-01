---
read_when:
    - تريد تقليل تكاليف رموز المطالبة مع الاحتفاظ بالتخزين المؤقت
    - تحتاج إلى سلوك ذاكرة تخزين مؤقت لكل وكيل في إعدادات متعددة الوكلاء
    - أنت تضبط Heartbeat وتقليم cache-ttl معًا
summary: عناصر ضبط التخزين المؤقت للمطالبات، وترتيب الدمج، وسلوك المزوّد، وأنماط الضبط
title: التخزين المؤقت للمطالبات
x-i18n:
    generated_at: "2026-07-01T18:14:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3189cc734bbee14236e6303aca99aca512732989ffd01612ae635608a2471e60
    source_path: reference/prompt-caching.md
    workflow: 16
---

يعني التخزين المؤقت للموجّه أن مزوّد النموذج يستطيع إعادة استخدام بادئات الموجّه غير المتغيرة (عادةً تعليمات النظام/المطوّر والسياقات المستقرة الأخرى) عبر الأدوار بدلًا من إعادة معالجتها في كل مرة. يطبّع OpenClaw استخدام المزوّد إلى `cacheRead` و`cacheWrite` عندما تكشف واجهة API العليا تلك العدادات مباشرةً.

يمكن لأسطح الحالة أيضًا استرداد عدادات التخزين المؤقت من أحدث سجل استخدام في النص المنسوخ
عندما تكون لقطة الجلسة الحية فاقدة لها، بحيث يستطيع `/status` مواصلة
عرض سطر التخزين المؤقت بعد فقدان جزئي لبيانات تعريف الجلسة. وتظل قيم التخزين المؤقت الحية
غير الصفرية القائمة لها الأولوية على قيم الرجوع إلى النص المنسوخ.

سبب أهمية ذلك: تكلفة رموز أقل، واستجابات أسرع، وأداء أكثر قابلية للتنبؤ للجلسات طويلة التشغيل. من دون التخزين المؤقت، تدفع الموجّهات المتكررة تكلفة الموجّه كاملة في كل دور حتى عندما لا يتغير معظم الإدخال.

تغطي الأقسام أدناه كل مفتاح متعلق بالتخزين المؤقت يؤثر في إعادة استخدام الموجّه وتكلفة الرموز.

مراجع المزوّدين:

- التخزين المؤقت للموجّهات في Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- التخزين المؤقت للموجّهات في OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- ترويسات OpenAI API ومعرّفات الطلبات: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- معرّفات طلبات Anthropic والأخطاء: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## المفاتيح الأساسية

### `cacheRetention` (الافتراضي العام، والنموذج، ولكل وكيل)

اضبط الاحتفاظ بالتخزين المؤقت كافتراضي عام لكل النماذج:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

تجاوزه لكل نموذج:

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

ترتيب دمج الإعدادات:

1. `agents.defaults.params` (الافتراضي العام — ينطبق على كل النماذج)
2. `agents.defaults.models["provider/model"].params` (تجاوز لكل نموذج)
3. `agents.list[].params` (معرّف الوكيل المطابق؛ يتجاوز حسب المفتاح)

### `contextPruning.mode: "cache-ttl"`

يشذّب سياق نتائج الأدوات القديم بعد نوافذ مدة بقاء التخزين المؤقت بحيث لا تعيد الطلبات بعد الخمول تخزين سجل كبير جدًا مؤقتًا.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

راجع [تشذيب الجلسة](/ar/concepts/session-pruning) للاطلاع على السلوك الكامل.

### إبقاء Heartbeat دافئًا

يمكن أن يبقي Heartbeat نوافذ التخزين المؤقت دافئة ويقلل عمليات كتابة التخزين المؤقت المتكررة بعد فجوات الخمول.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

يُدعم Heartbeat لكل وكيل في `agents.list[].heartbeat`.

## سلوك المزوّد

### Anthropic (واجهة API مباشرة)

- `cacheRetention` مدعوم.
- مع ملفات تعريف مصادقة مفتاح Anthropic API، يزرع OpenClaw القيمة `cacheRetention: "short"` لمراجع نماذج Anthropic عندما لا تكون مضبوطة.
- تكشف استجابات Messages الأصلية في Anthropic كلًا من `cache_read_input_tokens` و`cache_creation_input_tokens`، لذلك يستطيع OpenClaw عرض كلٍ من `cacheRead` و`cacheWrite`.
- لطلبات Anthropic الأصلية، يطابق `cacheRetention: "short"` التخزين المؤقت العابر الافتراضي لمدة 5 دقائق، ويرقّي `cacheRetention: "long"` إلى مدة بقاء ساعة واحدة فقط على مضيفي `api.anthropic.com` المباشرين.

### OpenAI (واجهة API مباشرة)

- التخزين المؤقت للموجّهات تلقائي على النماذج الحديثة المدعومة. لا يحتاج OpenClaw إلى حقن علامات تخزين مؤقت على مستوى الكتل.
- يستخدم OpenClaw `prompt_cache_key` لإبقاء توجيه التخزين المؤقت مستقرًا عبر الأدوار. يستخدم مضيفو OpenAI المباشرون `prompt_cache_retention: "24h"` عندما يُختار `cacheRetention: "long"`.
- يتلقى مزوّدو Completions المتوافقون مع OpenAI المفتاح `prompt_cache_key` فقط عندما تضبط إعدادات نموذجهم صراحةً `compat.supportsPromptCacheKey: true`. تمرير الاحتفاظ الطويل قدرة منفصلة: يرسل `cacheRetention: "long"` الصريح `prompt_cache_retention: "24h"` فقط عندما يدعم إدخال التوافق هذا أيضًا الاحتفاظ الطويل بالتخزين المؤقت. يمكن لمزوّدين مثل Mistral الاشتراك في مفاتيح التخزين المؤقت مع ضبط `compat.supportsLongCacheRetention: false` لمنع حقل الاحتفاظ الطويل. يمنع `cacheRetention: "none"` كلا الحقلين.
- تكشف استجابات OpenAI رموز الموجّه المخزّنة مؤقتًا عبر `usage.prompt_tokens_details.cached_tokens` (أو `input_tokens_details.cached_tokens` في أحداث Responses API). يربط OpenClaw ذلك بـ `cacheRead`.
- يمكن أن يكشف استخدام GPT-5.6 Responses أيضًا `input_tokens_details.cache_write_tokens`. يربط OpenClaw ذلك بـ `cacheWrite` ويسعّره وفق معدل كتابة التخزين المؤقت للنموذج؛ وتُبقي استجابات Responses التي تحذف الحقل `cacheWrite` عند `0`.
- يعيد OpenAI ترويسات مفيدة للتتبع وحدود المعدل مثل `x-request-id` و`openai-processing-ms` و`x-ratelimit-*`، لكن يجب أن يأتي حساب إصابات التخزين المؤقت من حمولة الاستخدام، لا من الترويسات.
- عمليًا، غالبًا ما يتصرف OpenAI مثل تخزين مؤقت لبادئة أولية بدلًا من إعادة استخدام سجل كامل متحرك بأسلوب Anthropic. يمكن أن تصل أدوار النص ذي البادئة الطويلة المستقرة إلى هضبة رموز مخزّنة مؤقتًا قريبة من `4864` في فحوصات حية حالية، بينما غالبًا ما تستقر النصوص المنسوخة الكثيفة بالأدوات أو بأسلوب MCP قرب `4608` رموز مخزّنة مؤقتًا حتى عند التكرارات المطابقة تمامًا.

### Anthropic Vertex

- تدعم نماذج Anthropic على Vertex AI (`anthropic-vertex/*`) `cacheRetention` بالطريقة نفسها مثل Anthropic المباشر.
- يطابق `cacheRetention: "long"` مدة بقاء التخزين المؤقت الحقيقي للموجّه لمدة ساعة واحدة على نقاط نهاية Vertex AI.
- يطابق الاحتفاظ الافتراضي بالتخزين المؤقت لـ `anthropic-vertex` افتراضيات Anthropic المباشر.
- تُوجّه طلبات Vertex عبر تشكيل تخزين مؤقت واعٍ بالحدود بحيث تبقى إعادة استخدام التخزين المؤقت متوافقة مع ما يتلقاه المزوّدون فعليًا.

### Amazon Bedrock

- تدعم مراجع نماذج Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) تمرير `cacheRetention` الصريح.
- تُجبر نماذج Bedrock غير التابعة لـ Anthropic على `cacheRetention: "none"` في وقت التشغيل.

### نماذج OpenRouter

بالنسبة إلى مراجع نماذج `openrouter/anthropic/*`، يحقن OpenClaw
`cache_control` في كتل موجّهات النظام/المطوّر لتحسين إعادة استخدام التخزين المؤقت
للموجّهات فقط عندما يظل الطلب مستهدفًا مسار OpenRouter متحققًا منه
(`openrouter` على نقطة نهايته الافتراضية، أو أي مزوّد/عنوان URL أساسي يتحول
إلى `openrouter.ai`).

بالنسبة إلى مراجع نماذج `openrouter/deepseek/*` و`openrouter/moonshot*/*` و`openrouter/zai/*`،
يُسمح بـ `contextPruning.mode: "cache-ttl"` لأن OpenRouter
يتعامل تلقائيًا مع التخزين المؤقت للموجّهات من جهة المزوّد. لا يحقن OpenClaw
علامات `cache_control` الخاصة بـ Anthropic في تلك الطلبات.

بناء تخزين DeepSeek المؤقت هو أفضل جهد وقد يستغرق بضع ثوانٍ. قد يظل
المتابع الفوري يعرض `cached_tokens: 0`؛ تحقق بطلب مكرر
بنفس البادئة بعد تأخير قصير واستخدم `usage.prompt_tokens_details.cached_tokens`
كإشارة إصابة التخزين المؤقت.

إذا أعدت توجيه النموذج إلى عنوان URL وكيل عشوائي متوافق مع OpenAI، يتوقف OpenClaw
عن حقن علامات التخزين المؤقت الخاصة بـ Anthropic والمحددة لـ OpenRouter.

### مزوّدون آخرون

إذا كان المزوّد لا يدعم وضع التخزين المؤقت هذا، فلن يكون لـ `cacheRetention` أي تأثير.

### واجهة Google Gemini API المباشرة

- يبلّغ نقل Gemini المباشر (`api: "google-generative-ai"`) عن إصابات التخزين المؤقت
  عبر `cachedContentTokenCount` من المصدر الأعلى؛ يربط OpenClaw ذلك بـ `cacheRead`.
- عندما يُضبط `cacheRetention` على نموذج Gemini مباشر، ينشئ OpenClaw تلقائيًا
  موارد `cachedContents` لموجّهات النظام في تشغيلات Google AI Studio ويعيد استخدامها
  ويحدّثها. هذا يعني أنك لم تعد بحاجة إلى إنشاء مقبض محتوى مخزّن مؤقتًا
  مسبقًا يدويًا.
- لا يزال بإمكانك تمرير مقبض محتوى Gemini مخزّن مؤقتًا قائم مسبقًا كـ
  `params.cachedContent` (أو القديم `params.cached_content`) على النموذج
  المُعدّ.
- هذا منفصل عن التخزين المؤقت لبادئات الموجّهات في Anthropic/OpenAI. بالنسبة إلى Gemini،
  يدير OpenClaw مورد `cachedContents` أصليًا لدى المزوّد بدلًا من
  حقن علامات التخزين المؤقت في الطلب.

### استخدام Gemini CLI

- يمكن أن يبرز خرج Gemini CLI `stream-json` إصابات التخزين المؤقت عبر `stats.cached`؛
  يربط OpenClaw ذلك بـ `cacheRead`. تستخدم تجاوزات `--output-format json` القديمة
  تطبيع الاستخدام نفسه.
- إذا حذف CLI قيمة `stats.input` مباشرة، يشتق OpenClaw رموز الإدخال
  من `stats.input_tokens - stats.cached`.
- هذا تطبيع استخدام فقط. لا يعني أن OpenClaw ينشئ
  علامات تخزين مؤقت للموجّهات بأسلوب Anthropic/OpenAI من أجل Gemini CLI.

## حدّ التخزين المؤقت لموجّه النظام

يقسم OpenClaw موجّه النظام إلى **بادئة مستقرة** و**لاحقة متقلبة**
يفصل بينهما حد داخلي لبادئة التخزين المؤقت. يُرتَّب المحتوى أعلى
الحد (تعريفات الأدوات، وبيانات Skills الوصفية، وملفات مساحة العمل، وسياقات أخرى
ثابتة نسبيًا) بحيث يبقى مطابقًا بايتًا ببايت عبر الأدوار.
ويُسمح للمحتوى أسفل الحد (مثل `HEARTBEAT.md`، وطوابع وقت التشغيل، وبيانات
تعريف أخرى لكل دور) بالتغير من دون إبطال البادئة المخزّنة
مؤقتًا.

اختيارات التصميم الرئيسية:

- تُرتَّب ملفات سياق مشروع مساحة العمل المستقرة قبل `HEARTBEAT.md` بحيث
  لا يؤدي تغير Heartbeat المتكرر إلى كسر البادئة المستقرة.
- يُطبّق الحد عبر تشكيل نقل عائلة Anthropic، وعائلة OpenAI، وGoogle، وCLI
  بحيث يستفيد كل المزوّدين المدعومين من استقرار البادئة نفسه.
- تُوجّه طلبات Codex Responses وAnthropic Vertex عبر
  تشكيل تخزين مؤقت واعٍ بالحدود بحيث تبقى إعادة استخدام التخزين المؤقت متوافقة مع ما يتلقاه المزوّدون
  فعليًا.
- تُطبّع بصمات موجّه النظام (المسافات البيضاء، ونهايات الأسطر،
  والسياق المضاف عبر hooks، وترتيب قدرات وقت التشغيل) بحيث تشترك
  الموجّهات غير المتغيرة دلاليًا في KV/التخزين المؤقت عبر الأدوار.

إذا رأيت ارتفاعات غير متوقعة في `cacheWrite` بعد تغيير في الإعدادات أو مساحة العمل،
فتحقق مما إذا كان التغيير يقع أعلى حد التخزين المؤقت أو أسفله. غالبًا ما يؤدي نقل
المحتوى المتقلب إلى أسفل الحد (أو تثبيته) إلى حل
المشكلة.

## حراس استقرار التخزين المؤقت في OpenClaw

يبقي OpenClaw أيضًا عدة أشكال حمولات حساسة للتخزين المؤقت حتمية قبل
وصول الطلب إلى المزوّد:

- تُفرز كتالوجات أدوات MCP المضمّنة حتميًا قبل تسجيل الأدوات، بحيث لا تؤدي
  تغييرات ترتيب `listTools()` إلى تغيير كتلة الأدوات وكسر
  بادئات التخزين المؤقت للموجّهات.
- تحتفظ الجلسات القديمة ذات كتل الصور المستمرة بأحدث **3 أدوار
  مكتملة** كما هي؛ وقد تُستبدل كتل الصور الأقدم المعالجة سابقًا
  بعلامة بحيث لا تستمر المتابعات الكثيفة بالصور في إعادة إرسال حمولات
  قديمة كبيرة.

## أنماط الضبط

### حركة مختلطة (الافتراضي الموصى به)

احتفظ بخط أساس طويل العمر على وكيلك الرئيسي، وعطّل التخزين المؤقت على وكلاء الإشعارات كثيرة الدفعات:

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

### خط أساس يقدّم التكلفة أولًا

- اضبط خط الأساس `cacheRetention: "short"`.
- فعّل `contextPruning.mode: "cache-ttl"`.
- أبقِ Heartbeat دون مدة البقاء لديك فقط للوكلاء الذين يستفيدون من التخزينات المؤقتة الدافئة.

## تشخيصات التخزين المؤقت

يكشف OpenClaw تشخيصات مخصصة لتتبع التخزين المؤقت لتشغيلات الوكلاء المضمّنة.

بالنسبة إلى التشخيصات العادية المواجهة للمستخدم، يمكن لـ `/status` وملخصات الاستخدام الأخرى استخدام
أحدث إدخال استخدام في النص المنسوخ كمصدر رجوع لـ `cacheRead` /
`cacheWrite` عندما لا يحتوي إدخال الجلسة الحية على تلك العدادات.

## اختبارات الانحدار الحية

يبقي OpenClaw بوابة انحدار حية مشتركة واحدة للبادئات المتكررة، وأدوار الأدوات، وأدوار الصور، والنصوص المنسوخة لأدوات بأسلوب MCP، وضابط Anthropic بلا تخزين مؤقت.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

شغّل البوابة الحية الضيقة باستخدام:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

يخزن ملف خط الأساس أحدث الأرقام الحية المرصودة، إضافة إلى حدود الانحدار الدنيا الخاصة بكل موفر والتي يستخدمها الاختبار.
يستخدم المشغّل أيضاً معرّفات جلسات ومساحات أسماء للمطالبات جديدة لكل تشغيل، حتى لا تلوّث حالة التخزين المؤقت السابقة عينة الانحدار الحالية.

هذه الاختبارات لا تستخدم عمداً معايير نجاح متطابقة عبر الموفّرين.

### توقعات Anthropic الحية

- توقّع كتابات إحماء صريحة عبر `cacheWrite`.
- توقّع إعادة استخدام شبه كاملة للسجل في المنعطفات المتكررة، لأن تحكم التخزين المؤقت في Anthropic يقدّم نقطة فصل التخزين المؤقت عبر المحادثة.
- لا تزال التأكيدات الحية الحالية تستخدم عتبات مرتفعة لمعدل الإصابة لمسارات الثبات والأدوات والصور.

### توقعات OpenAI الحية

- توقّع `cacheRead` فقط. يبقى `cacheWrite` بقيمة `0`.
- تعامل مع إعادة استخدام التخزين المؤقت في المنعطفات المتكررة على أنها مستوى استقرار خاص بالموفر، وليس إعادة استخدام متحركة لكامل السجل بأسلوب Anthropic.
- تستخدم التأكيدات الحية الحالية فحوصات حدود دنيا محافظة مشتقة من السلوك الحي المرصود على `gpt-5.4-mini`:
  - البادئة الثابتة: `cacheRead >= 4608`، معدل الإصابة `>= 0.90`
  - نص الأداة: `cacheRead >= 4096`، معدل الإصابة `>= 0.85`
  - نص الصورة: `cacheRead >= 3840`، معدل الإصابة `>= 0.82`
  - نص بنمط MCP: `cacheRead >= 4096`، معدل الإصابة `>= 0.85`

استقر التحقق الحي المدمج الجديد في 2026-04-04 عند:

- البادئة الثابتة: `cacheRead=4864`، معدل الإصابة `0.966`
- نص الأداة: `cacheRead=4608`، معدل الإصابة `0.896`
- نص الصورة: `cacheRead=4864`، معدل الإصابة `0.954`
- نص بنمط MCP: `cacheRead=4608`، معدل الإصابة `0.891`

كان وقت الجدار المحلي الأخير للبوابة المدمجة نحو `88s`.

سبب اختلاف التأكيدات:

- يوفّر Anthropic نقاط فصل صريحة للتخزين المؤقت وإعادة استخدام متحركة لسجل المحادثة.
- لا يزال التخزين المؤقت للمطالبات في OpenAI حساساً للبادئة المطابقة تماماً، لكن البادئة الفعالة القابلة لإعادة الاستخدام في حركة Responses الحية يمكن أن تستقر قبل المطالبة الكاملة.
- لذلك، فإن مقارنة Anthropic وOpenAI باستخدام عتبة نسبة واحدة عابرة للموفّرين تنشئ انحدارات زائفة.

### إعداد `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

القيم الافتراضية:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### مفاتيح تبديل البيئة (تصحيح أخطاء لمرة واحدة)

- يفعّل `OPENCLAW_CACHE_TRACE=1` تتبّع التخزين المؤقت.
- يتجاوز `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` مسار الإخراج.
- يبدّل `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` التقاط حمولة الرسائل الكاملة.
- يبدّل `OPENCLAW_CACHE_TRACE_PROMPT=0|1` التقاط نص المطالبة.
- يبدّل `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` التقاط مطالبة النظام.

### ما يجب فحصه

- أحداث تتبّع التخزين المؤقت هي JSONL وتتضمن لقطات مرحلية مثل `session:loaded` و`prompt:before` و`stream:context` و`session:after`.
- يظهر تأثير رموز التخزين المؤقت لكل منعطف في أسطح الاستخدام العادية عبر `cacheRead` و`cacheWrite` (على سبيل المثال `/usage tokens` و`/status` وملخصات استخدام الجلسات وتخطيطات `messages.usageTemplate` المخصصة).
- بالنسبة إلى Anthropic، توقّع كلاً من `cacheRead` و`cacheWrite` عندما يكون التخزين المؤقت نشطاً.
- بالنسبة إلى OpenAI، توقّع `cacheRead` عند إصابات التخزين المؤقت. يمكن أن تبلغ GPT-5.6 Responses أيضاً عن `cacheWrite` أثناء كتابة مقاطع المطالبة؛ أما حمولات Responses الأخرى التي تحذف عداد الكتابة فتبقيه عند `0`.
- إذا كنت تحتاج إلى تتبّع الطلبات، فسجّل معرّفات الطلبات وترويسات حدود المعدل بشكل منفصل عن مقاييس التخزين المؤقت. يركّز إخراج تتبّع التخزين المؤقت الحالي في OpenClaw على شكل المطالبة/الجلسة واستخدام الرموز الموحّد بدلاً من ترويسات استجابة الموفّر الخام.

## استكشاف الأخطاء وإصلاحها بسرعة

- ارتفاع `cacheWrite` في معظم المنعطفات: تحقق من مدخلات مطالبة النظام المتقلبة وتحقق من أن النموذج/الموفّر يدعم إعدادات التخزين المؤقت لديك.
- ارتفاع `cacheWrite` على Anthropic: غالباً يعني أن نقطة فصل التخزين المؤقت تقع على محتوى يتغير في كل طلب.
- انخفاض `cacheRead` في OpenAI: تحقق من أن البادئة الثابتة في البداية، وأن البادئة المتكررة لا تقل عن 1024 رمزاً، وأن `prompt_cache_key` نفسه يُعاد استخدامه للمنعطفات التي يجب أن تشارك التخزين المؤقت.
- لا تأثير من `cacheRetention`: تأكد من أن مفتاح النموذج يطابق `agents.defaults.models["provider/model"]`.
- طلبات Bedrock Nova/Mistral مع إعدادات التخزين المؤقت: من المتوقع أن يفرض وقت التشغيل القيمة `none`.

المستندات ذات الصلة:

- [Anthropic](/ar/providers/anthropic)
- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [تشذيب الجلسات](/ar/concepts/session-pruning)
- [مرجع إعدادات Gateway](/ar/gateway/configuration-reference)

## ذات صلة

- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [استخدام API والتكاليف](/ar/reference/api-usage-costs)
