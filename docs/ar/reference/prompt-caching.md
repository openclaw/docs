---
read_when:
    - تريد تقليل تكاليف رموز المطالبة مع الاحتفاظ بذاكرة التخزين المؤقت
    - تحتاج إلى سلوك التخزين المؤقت لكل وكيل في إعدادات متعددة الوكلاء
    - أنت تضبط Heartbeat وتشذيب مدة بقاء ذاكرة التخزين المؤقت معًا
summary: خيارات ضبط التخزين المؤقت للمطالبات، وترتيب الدمج، وسلوك المزوّد، وأنماط الضبط
title: التخزين المؤقت للمطالبات
x-i18n:
    generated_at: "2026-07-01T08:09:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dbbc46d5f726ae5e9b3bb51af0d271e49df768bc93de6e13b4c87519f0fca5c3
    source_path: reference/prompt-caching.md
    workflow: 16
---

يعني تخزين الموجه مؤقتًا أن مزوّد النموذج يمكنه إعادة استخدام بادئات الموجه غير المتغيرة (عادةً تعليمات النظام/المطوّر وسياقات مستقرة أخرى) عبر الأدوار بدلًا من إعادة معالجتها في كل مرة. يطبّع OpenClaw استخدام المزوّد إلى `cacheRead` و`cacheWrite` عندما تكشف API upstream هذه العدادات مباشرةً.

يمكن لأسطح الحالة أيضًا استرداد عدادات التخزين المؤقت من أحدث سجل استخدام في النص
عندما تكون لقطة الجلسة الحية لا تتضمنها، بحيث يمكن لـ `/status` الاستمرار في
عرض سطر التخزين المؤقت بعد فقدان جزئي لبيانات وصف الجلسة. تظل قيم التخزين المؤقت الحية
غير الصفرية الحالية لها الأولوية على قيم الرجوع إلى النص.

سبب أهمية ذلك: تكلفة رموز أقل، واستجابات أسرع، وأداء أكثر قابلية للتوقع للجلسات طويلة التشغيل. من دون التخزين المؤقت، تدفع الموجهات المتكررة تكلفة الموجه كاملة في كل دور حتى عندما لا يتغير معظم الإدخال.

تغطي الأقسام أدناه كل مفتاح متعلق بالتخزين المؤقت يؤثر في إعادة استخدام الموجه وتكلفة الرموز.

مراجع المزوّدين:

- تخزين موجهات Anthropic مؤقتًا: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- تخزين موجهات OpenAI مؤقتًا: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- ترويسات OpenAI API ومعرفات الطلبات: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- معرفات طلبات Anthropic والأخطاء: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## المفاتيح الأساسية

### `cacheRetention` (الافتراضي العام، والنموذج، ولكل وكيل)

عيّن احتفاظ التخزين المؤقت كافتراضي عام لكل النماذج:

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

ترتيب دمج الإعدادات:

1. `agents.defaults.params` (الافتراضي العام — ينطبق على كل النماذج)
2. `agents.defaults.models["provider/model"].params` (تجاوز لكل نموذج)
3. `agents.list[].params` (معرف الوكيل المطابق؛ يتجاوز حسب المفتاح)

### `contextPruning.mode: "cache-ttl"`

يشذّب سياق نتائج الأدوات القديم بعد نوافذ TTL للتخزين المؤقت بحيث لا تعيد الطلبات بعد الخمول تخزين سجل كبير أكثر من اللازم.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

راجع [تشذيب الجلسة](/ar/concepts/session-pruning) للسلوك الكامل.

### إبقاء Heartbeat دافئًا

يمكن لـ Heartbeat إبقاء نوافذ التخزين المؤقت دافئة وتقليل عمليات كتابة التخزين المؤقت المتكررة بعد فترات الخمول.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

يُدعم Heartbeat لكل وكيل عند `agents.list[].heartbeat`.

## سلوك المزوّد

### Anthropic (API مباشرة)

- `cacheRetention` مدعوم.
- مع ملفات تعريف مصادقة مفاتيح Anthropic API، يزرع OpenClaw القيمة `cacheRetention: "short"` لمراجع نماذج Anthropic عند عدم تعيينها.
- تكشف استجابات Messages الأصلية من Anthropic كلًا من `cache_read_input_tokens` و`cache_creation_input_tokens`، لذلك يمكن لـ OpenClaw عرض كل من `cacheRead` و`cacheWrite`.
- بالنسبة لطلبات Anthropic الأصلية، تُطابق `cacheRetention: "short"` التخزين المؤقت المؤقت الافتراضي لمدة 5 دقائق، وترقّي `cacheRetention: "long"` إلى TTL لمدة ساعة واحدة فقط على مضيفات `api.anthropic.com` المباشرة.

### OpenAI (API مباشرة)

- تخزين الموجهات مؤقتًا تلقائي على النماذج الحديثة المدعومة. لا يحتاج OpenClaw إلى حقن علامات تخزين مؤقت على مستوى الكتل.
- يستخدم OpenClaw `prompt_cache_key` للحفاظ على استقرار توجيه التخزين المؤقت عبر الأدوار. تستخدم مضيفات OpenAI المباشرة `prompt_cache_retention: "24h"` عند اختيار `cacheRetention: "long"`.
- يتلقى مزوّدو Completions المتوافقون مع OpenAI القيمة `prompt_cache_key` فقط عندما تضبط إعدادات نموذجهم صراحةً `compat.supportsPromptCacheKey: true`. تمرير الاحتفاظ الطويل هو قدرة منفصلة: ترسل `cacheRetention: "long"` الصريحة القيمة `prompt_cache_retention: "24h"` فقط عندما يدعم إدخال التوافق ذلك أيضًا احتفاظ التخزين المؤقت الطويل. يمكن لمزوّدين مثل Mistral الاشتراك في مفاتيح التخزين المؤقت مع ضبط `compat.supportsLongCacheRetention: false` لحجب حقل الاحتفاظ الطويل. تحجب `cacheRetention: "none"` كلا الحقلين.
- تكشف استجابات OpenAI رموز الموجه المخزنة مؤقتًا عبر `usage.prompt_tokens_details.cached_tokens` (أو `input_tokens_details.cached_tokens` في أحداث Responses API). يطابق OpenClaw ذلك إلى `cacheRead`.
- يمكن لاستخدام GPT-5.6 Responses أن يكشف أيضًا `input_tokens_details.cache_write_tokens`. يطابق OpenClaw ذلك إلى `cacheWrite` ويسعّره بسعر كتابة التخزين المؤقت للنموذج؛ الاستجابات التي تحذف الحقل تُبقي `cacheWrite` عند `0`.
- ترجع OpenAI ترويسات مفيدة للتتبع وحدود المعدل مثل `x-request-id` و`openai-processing-ms` و`x-ratelimit-*`، لكن يجب أن يأتي احتساب إصابات التخزين المؤقت من حمولة الاستخدام، لا من الترويسات.
- عمليًا، غالبًا ما تتصرف OpenAI مثل تخزين مؤقت للبادئة الأولية بدلًا من إعادة استخدام السجل الكامل المتحرك بأسلوب Anthropic. يمكن لأدوار النص الطويل ذي البادئة المستقرة أن تستقر قرب هضبة `4864` رمزًا مخزنًا مؤقتًا في فحوصات حية حالية، بينما غالبًا ما تستقر النصوص كثيفة الأدوات أو بأسلوب MCP قرب `4608` رموز مخزنة مؤقتًا حتى عند التكرارات المطابقة.

### Anthropic Vertex

- تدعم نماذج Anthropic على Vertex AI (`anthropic-vertex/*`) القيمة `cacheRetention` بالطريقة نفسها التي تدعمها Anthropic المباشرة.
- تطابق `cacheRetention: "long"` قيمة TTL الحقيقية لتخزين الموجه مؤقتًا لمدة ساعة واحدة على نقاط نهاية Vertex AI.
- يطابق احتفاظ التخزين المؤقت الافتراضي لـ `anthropic-vertex` افتراضيات Anthropic المباشرة.
- تُوجّه طلبات Vertex عبر تشكيل تخزين مؤقت واعٍ بالحدود بحيث يبقى إعادة استخدام التخزين المؤقت متوافقًا مع ما يتلقاه المزوّدون فعليًا.

### Amazon Bedrock

- تدعم مراجع نماذج Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) تمرير `cacheRetention` الصريح.
- تُجبر نماذج Bedrock غير Anthropic على `cacheRetention: "none"` في وقت التشغيل.

### نماذج OpenRouter

بالنسبة لمراجع نماذج `openrouter/anthropic/*`، يحقن OpenClaw
`cache_control` في كتل موجهات النظام/المطوّر لتحسين إعادة استخدام تخزين الموجه
مؤقتًا فقط عندما لا يزال الطلب يستهدف مسار OpenRouter موثقًا
(`openrouter` على نقطة نهايته الافتراضية، أو أي مزوّد/عنوان URL أساسي يتحلل
إلى `openrouter.ai`).

بالنسبة لمراجع نماذج `openrouter/deepseek/*` و`openrouter/moonshot*/*` و`openrouter/zai/*`،
يُسمح بـ `contextPruning.mode: "cache-ttl"` لأن OpenRouter
يتعامل مع تخزين الموجه مؤقتًا من جهة المزوّد تلقائيًا. لا يحقن OpenClaw
علامات Anthropic `cache_control` في تلك الطلبات.

إنشاء تخزين DeepSeek المؤقت يكون بأفضل جهد وقد يستغرق بضع ثوانٍ. قد يظل
المتابع الفوري يعرض `cached_tokens: 0`؛ تحقق بطلب متكرر
بنفس البادئة بعد تأخير قصير واستخدم `usage.prompt_tokens_details.cached_tokens`
كإشارة إصابة التخزين المؤقت.

إذا أعدت توجيه النموذج إلى عنوان URL وسيط عشوائي متوافق مع OpenAI، يتوقف OpenClaw
عن حقن علامات تخزين Anthropic المؤقت الخاصة بـ OpenRouter.

### مزوّدون آخرون

إذا كان المزوّد لا يدعم وضع التخزين المؤقت هذا، فلن يكون لـ `cacheRetention` أي تأثير.

### Google Gemini direct API

- يبلّغ نقل Gemini المباشر (`api: "google-generative-ai"`) عن إصابات التخزين المؤقت
  عبر `cachedContentTokenCount` من upstream؛ يطابق OpenClaw ذلك إلى `cacheRead`.
- عندما تُضبط `cacheRetention` على نموذج Gemini مباشر، ينشئ OpenClaw تلقائيًا
  موارد `cachedContents` لموجهات النظام على تشغيلات Google AI Studio ويعيد استخدامها
  ويحدّثها. يعني ذلك أنك لم تعد بحاجة إلى إنشاء مقبض محتوى مخزن مؤقتًا
  مسبقًا يدويًا.
- لا يزال بإمكانك تمرير مقبض محتوى Gemini مخزن مؤقتًا موجود مسبقًا عبر
  `params.cachedContent` (أو `params.cached_content` القديم) على النموذج
  المضبوط.
- هذا منفصل عن تخزين بادئات الموجه مؤقتًا في Anthropic/OpenAI. بالنسبة إلى Gemini،
  يدير OpenClaw مورد `cachedContents` أصليًا لدى المزوّد بدلًا من
  حقن علامات تخزين مؤقت في الطلب.

### استخدام Gemini CLI

- يمكن لمخرجات Gemini CLI `stream-json` إظهار إصابات التخزين المؤقت عبر `stats.cached`;
  يطابق OpenClaw ذلك إلى `cacheRead`. تستخدم تجاوزات `--output-format json` القديمة
  تطبيع الاستخدام نفسه.
- إذا حذف CLI قيمة `stats.input` مباشرة، يشتق OpenClaw رموز الإدخال
  من `stats.input_tokens - stats.cached`.
- هذا تطبيع استخدام فقط. لا يعني ذلك أن OpenClaw ينشئ
  علامات تخزين مؤقت لموجهات بأسلوب Anthropic/OpenAI من أجل Gemini CLI.

## حد تخزين موجه النظام مؤقتًا

يقسم OpenClaw موجه النظام إلى **بادئة مستقرة** و**لاحقة متغيرة**
تفصل بينهما حدود داخلية لبادئة التخزين المؤقت. يُرتّب المحتوى فوق
الحد (تعريفات الأدوات، وبيانات وصف Skills، وملفات مساحة العمل، وسياقات أخرى
ثابتة نسبيًا) بحيث يبقى مطابقًا بايتًا ببايت عبر الأدوار.
يُسمح للمحتوى أسفل الحد (على سبيل المثال `HEARTBEAT.md`، والطوابع الزمنية في وقت التشغيل، و
بيانات وصف أخرى لكل دور) بالتغير من دون إبطال البادئة المخزنة
مؤقتًا.

خيارات التصميم الرئيسية:

- تُرتب ملفات سياق مشروع مساحة العمل المستقرة قبل `HEARTBEAT.md` بحيث لا
  يفسد تغير Heartbeat البادئة المستقرة.
- يُطبق الحد عبر تشكيل نقل عائلة Anthropic، وعائلة OpenAI، وGoogle، و
  CLI بحيث يستفيد كل المزوّدين المدعومين من استقرار البادئة نفسه.
- تُوجّه طلبات Codex Responses وAnthropic Vertex عبر
  تشكيل تخزين مؤقت واعٍ بالحدود بحيث يبقى إعادة استخدام التخزين المؤقت متوافقًا مع ما يتلقاه المزوّدون
  فعليًا.
- تُطبّع بصمات موجه النظام (المسافات البيضاء، نهايات الأسطر،
  السياق المضاف عبر hooks، وترتيب قدرات وقت التشغيل) بحيث تشارك
  الموجهات غير المتغيرة دلاليًا KV/التخزين المؤقت عبر الأدوار.

إذا رأيت ارتفاعات غير متوقعة في `cacheWrite` بعد تغيير إعدادات أو مساحة عمل،
فتحّقق مما إذا كان التغيير يقع فوق حد التخزين المؤقت أو تحته. غالبًا ما يحل
نقل المحتوى المتغير أسفل الحد (أو تثبيته)
المشكلة.

## حراس استقرار التخزين المؤقت في OpenClaw

يحافظ OpenClaw أيضًا على عدة أشكال حمولة حساسة للتخزين المؤقت حتمية قبل
وصول الطلب إلى المزوّد:

- تُفرز كتالوجات أدوات MCP المجمعة حتميًا قبل تسجيل الأدوات، بحيث لا تؤدي
  تغيرات ترتيب `listTools()` إلى تغيير كتلة الأدوات وإفساد بادئات
  تخزين الموجه مؤقتًا.
- تحافظ الجلسات القديمة ذات كتل الصور المحفوظة على **أحدث 3 أدوار
  مكتملة** سليمة؛ قد تُستبدل كتل الصور الأقدم التي عولجت مسبقًا
  بعلامة بحيث لا تستمر المتابعات كثيفة الصور في إعادة إرسال حمولات كبيرة
  قديمة.

## أنماط الضبط

### حركة مرور مختلطة (الافتراضي الموصى به)

احتفظ بخط أساس طويل العمر على وكيلك الرئيسي، وعطّل التخزين المؤقت على وكلاء الإشعارات المتقطعة:

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
- أبقِ Heartbeat دون قيمة TTL لديك فقط للوكلاء الذين يستفيدون من التخزين المؤقت الدافئ.

## تشخيصات التخزين المؤقت

يكشف OpenClaw تشخيصات مخصصة لتتبع التخزين المؤقت لتشغيلات الوكلاء المضمنة.

بالنسبة للتشخيصات العادية الموجهة للمستخدم، يمكن لـ `/status` وملخصات استخدام أخرى استخدام
أحدث إدخال استخدام في النص كمصدر رجوع لـ `cacheRead` /
`cacheWrite` عندما لا يحتوي إدخال الجلسة الحية على تلك العدادات.

## اختبارات الانحدار الحية

يحافظ OpenClaw على بوابة انحدار تخزين مؤقت حية مدمجة واحدة للبادئات المتكررة، وأدوار الأدوات، وأدوار الصور، ونصوص الأدوات بأسلوب MCP، وعنصر تحكم Anthropic بلا تخزين مؤقت.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

شغّل البوابة الحية الضيقة باستخدام:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

يخزن ملف الأساس أحدث الأرقام الحية المرصودة بالإضافة إلى حدود الانحدار الدنيا الخاصة بكل مزود التي يستخدمها الاختبار.
يستخدم المشغل أيضًا معرّفات جلسات جديدة لكل تشغيل ونطاقات أسماء للمطالبات حتى لا تلوث حالة ذاكرة التخزين المؤقت السابقة عينة الانحدار الحالية.

هذه الاختبارات لا تستخدم عمدًا معايير نجاح متطابقة عبر المزودين.

### توقعات Anthropic الحية

- توقع كتابات إحماء صريحة عبر `cacheWrite`.
- توقع إعادة استخدام شبه كاملة للسجل في الأدوار المتكررة لأن التحكم في ذاكرة Anthropic المؤقتة يقدّم نقطة توقف ذاكرة التخزين المؤقت عبر المحادثة.
- لا تزال التأكيدات الحية الحالية تستخدم حدودًا عالية لمعدل الإصابة لمسارات الثبات والأدوات والصور.

### توقعات OpenAI الحية

- توقع `cacheRead` فقط. يبقى `cacheWrite` عند `0`.
- تعامل مع إعادة استخدام ذاكرة التخزين المؤقت في الأدوار المتكررة كهضبة خاصة بالمزود، وليس كإعادة استخدام متحركة للسجل الكامل على نمط Anthropic.
- تستخدم التأكيدات الحية الحالية فحوصات دنيا محافظة مشتقة من السلوك الحي المرصود على `gpt-5.4-mini`:
  - بادئة ثابتة: `cacheRead >= 4608`، معدل الإصابة `>= 0.90`
  - نص أداة: `cacheRead >= 4096`، معدل الإصابة `>= 0.85`
  - نص صورة: `cacheRead >= 3840`، معدل الإصابة `>= 0.82`
  - نص بنمط MCP: `cacheRead >= 4096`، معدل الإصابة `>= 0.85`

استقر التحقق الحي المدمج الجديد في 2026-04-04 عند:

- بادئة ثابتة: `cacheRead=4864`، معدل الإصابة `0.966`
- نص أداة: `cacheRead=4608`، معدل الإصابة `0.896`
- نص صورة: `cacheRead=4864`، معدل الإصابة `0.954`
- نص بنمط MCP: `cacheRead=4608`، معدل الإصابة `0.891`

كان وقت ساعة الحائط المحلي الأخير للبوابة المدمجة حوالي `88s`.

سبب اختلاف التأكيدات:

- تكشف Anthropic نقاط توقف صريحة لذاكرة التخزين المؤقت وإعادة استخدام متحركة لسجل المحادثة.
- لا يزال التخزين المؤقت لمطالبات OpenAI حساسًا للبادئة المطابقة تمامًا، لكن البادئة الفعالة القابلة لإعادة الاستخدام في حركة Responses الحية قد تستقر قبل المطالبة الكاملة.
- لهذا السبب، فإن مقارنة Anthropic وOpenAI بحد نسبة مئوية واحد عبر المزودين تنشئ انحدارات زائفة.

### تكوين `diagnostics.cacheTrace`

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

- يفعّل `OPENCLAW_CACHE_TRACE=1` تتبع ذاكرة التخزين المؤقت.
- يتجاوز `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` مسار الإخراج.
- يبدّل `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` التقاط حمولة الرسالة الكاملة.
- يبدّل `OPENCLAW_CACHE_TRACE_PROMPT=0|1` التقاط نص المطالبة.
- يبدّل `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` التقاط مطالبة النظام.

### ما يجب فحصه

- أحداث تتبع ذاكرة التخزين المؤقت هي JSONL وتتضمن لقطات مرحلية مثل `session:loaded` و`prompt:before` و`stream:context` و`session:after`.
- يظهر تأثير رموز ذاكرة التخزين المؤقت لكل دور في أسطح الاستخدام العادية عبر `cacheRead` و`cacheWrite` (على سبيل المثال `/usage full` وملخصات استخدام الجلسة).
- بالنسبة إلى Anthropic، توقع كلًا من `cacheRead` و`cacheWrite` عندما يكون التخزين المؤقت نشطًا.
- بالنسبة إلى OpenAI، توقع `cacheRead` عند إصابات ذاكرة التخزين المؤقت. يمكن لـ GPT-5.6 Responses أيضًا الإبلاغ عن `cacheWrite` أثناء كتابة مقاطع المطالبة؛ أما حمولات Responses الأخرى التي تحذف عداد الكتابة فتبقيه عند `0`.
- إذا احتجت إلى تتبع الطلبات، فسجّل معرّفات الطلبات وترويسات حدود المعدل بشكل منفصل عن مقاييس ذاكرة التخزين المؤقت. يركز خرج تتبع ذاكرة التخزين المؤقت الحالي في OpenClaw على شكل المطالبة/الجلسة واستخدام الرموز الموحّد بدلًا من ترويسات استجابة المزود الخام.

## استكشاف أخطاء سريع

- ارتفاع `cacheWrite` في معظم الأدوار: تحقق من مدخلات مطالبة النظام المتقلبة وتأكد من أن النموذج/المزود يدعم إعدادات ذاكرة التخزين المؤقت لديك.
- ارتفاع `cacheWrite` على Anthropic: يعني غالبًا أن نقطة توقف ذاكرة التخزين المؤقت تقع على محتوى يتغير في كل طلب.
- انخفاض `cacheRead` في OpenAI: تحقق من أن البادئة الثابتة في المقدمة، وأن البادئة المتكررة لا تقل عن 1024 رمزًا، وأن `prompt_cache_key` نفسه يُعاد استخدامه للأدوار التي ينبغي أن تشترك في ذاكرة التخزين المؤقت.
- عدم وجود تأثير من `cacheRetention`: تأكد من أن مفتاح النموذج يطابق `agents.defaults.models["provider/model"]`.
- طلبات Bedrock Nova/Mistral مع إعدادات ذاكرة التخزين المؤقت: من المتوقع أن يفرض وقت التشغيل القيمة `none`.

مستندات ذات صلة:

- [Anthropic](/ar/providers/anthropic)
- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [تشذيب الجلسة](/ar/concepts/session-pruning)
- [مرجع تكوين Gateway](/ar/gateway/configuration-reference)

## ذات صلة

- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [استخدام API والتكاليف](/ar/reference/api-usage-costs)
