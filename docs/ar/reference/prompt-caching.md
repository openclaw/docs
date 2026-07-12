---
read_when:
    - تريد تقليل تكاليف رموز المطالبة باستخدام الاحتفاظ بذاكرة التخزين المؤقت
    - تحتاج إلى سلوك تخزين مؤقت لكل وكيل في إعدادات متعددة الوكلاء
    - أنت تضبط Heartbeat وتنقية ذاكرة التخزين المؤقت وفق مدة البقاء معًا
summary: مقابض التخزين المؤقت للموجّه، وترتيب الدمج، وسلوك المزوّد، وأنماط الضبط
title: التخزين المؤقت للموجّهات
x-i18n:
    generated_at: "2026-07-12T06:34:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

يتيح التخزين المؤقت للموجّه لمزوّد النموذج إعادة استخدام بادئة موجّه لم تتغير (تعليمات النظام/المطوّر، وتعريفات الأدوات، والسياق الثابت الآخر) عبر الأدوار بدلًا من إعادة معالجتها مع كل طلب. يقلل هذا تكلفة الرموز وزمن الاستجابة في الجلسات طويلة الأمد ذات السياق المتكرر.

يوحّد OpenClaw استخدام المزوّد في `cacheRead` و`cacheWrite` حيثما تعرض واجهة API المصدرية هذين العدّادين. تعود ملخصات الاستخدام (`/status` وما شابه) إلى آخر إدخال استخدام في سجل المحادثة عندما تفتقر لقطة الجلسة المباشرة إلى عدّادات التخزين المؤقت؛ وتتغلب دائمًا القيمة المباشرة غير الصفرية على القيمة الاحتياطية.

مراجع المزوّدين:

- [التخزين المؤقت للموجّه في Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [التخزين المؤقت للموجّه في OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## عناصر التحكم الأساسية

### `cacheRetention`

القيم: `"none" | "short" | "long"`. يمكن ضبطها كقيمة افتراضية عامة، ولكل نموذج، ولكل وكيل.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # يتجاوز القيمة الافتراضية العامة لهذا النموذج
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # يتجاوز كلتا القيمتين الافتراضيتين لهذا الوكيل
```

ترتيب الدمج (الأخير هو السائد):

1. `agents.defaults.params` - القيمة الافتراضية العامة لجميع النماذج
2. `agents.defaults.models["provider/model"].params` - تجاوز خاص بالنموذج
3. `agents.list[].params` - تجاوز خاص بالوكيل، مع المطابقة حسب معرّف الوكيل

المصدر: `src/agents/embedded-agent-runner/extra-params.ts` ‏(`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

يقلّم سياق نتائج الأدوات القديم بعد انقضاء نافذة مدة صلاحية التخزين المؤقت، بحيث لا يعيد الطلب اللاحق لفترة خمول تخزين سجل متضخم مؤقتًا.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

راجع [تقليم الجلسة](/ar/concepts/session-pruning) للاطلاع على السلوك الكامل.

### الإبقاء دافئًا عبر Heartbeat

يمكن لـ Heartbeat إبقاء نوافذ التخزين المؤقت دافئة وتقليل عمليات الكتابة المتكررة إلى التخزين المؤقت بعد فترات الخمول. يمكن ضبطه عموميًا (`agents.defaults.heartbeat`) أو لكل وكيل (`agents.list[].heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## سلوك المزوّد

### Anthropic ‏(واجهة API المباشرة وVertex AI)

- يُدعم `cacheRetention` لمزوّدي `anthropic` و`anthropic-vertex`، ولنماذج Claude على `amazon-bedrock` ونقاط النهاية المخصصة المتوافقة مع `anthropic-messages` عند تعيين `cacheRetention` صراحةً.
- عند عدم تعيينه، يضبط OpenClaw قيمة أولية هي `cacheRetention: "short"` لاتصال Anthropic المباشر (لمزوّدي `anthropic` و`anthropic-vertex` فقط؛ تتطلب مسارات عائلة Anthropic الأخرى قيمة صريحة).
- تعرض استجابات Anthropic Messages الأصلية `cache_read_input_tokens` و`cache_creation_input_tokens`، وتُربطان بـ`cacheRead` و`cacheWrite`.
- يقابل `cacheRetention: "short"` التخزين المؤقت المؤقت الافتراضي لمدة 5 دقائق. ويطلب `cacheRetention: "long"` مدة صلاحية قدرها ساعة واحدة (`cache_control: { type: "ephemeral", ttl: "1h" }`) عند تعيينه صراحةً. أما الاحتفاظ الطويل الضمني/المستمد من البيئة (`OPENCLAW_CACHE_RETENTION=long` دون `cacheRetention` صريح)، فلا يرقّي مدة الصلاحية إلى ساعة واحدة إلا على مضيفي `api.anthropic.com` أو Vertex AI ‏(`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`)؛ وتحتفظ المضيفات الأخرى بالتخزين المؤقت لمدة 5 دقائق.

المصدر: `src/agents/anthropic-payload-policy.ts` ‏(`resolveAnthropicEphemeralCacheControl`، و`isLongTtlEligibleEndpoint`).

### OpenAI ‏(واجهة API المباشرة)

- يتم التخزين المؤقت للموجّه تلقائيًا على النماذج الحديثة المدعومة؛ ولا يحقن OpenClaw علامات تخزين مؤقت على مستوى الكتل.
- يرسل OpenClaw ‏`prompt_cache_key` للحفاظ على استقرار توجيه التخزين المؤقت عبر الأدوار. تحصل مضيفات `api.openai.com` المباشرة على ذلك تلقائيًا. أما الوكلاء المتوافقون مع OpenAI ‏(oMLX وllama.cpp ونقاط النهاية المخصصة)، فيحتاجون إلى `compat.supportsPromptCacheKey: true` في إعدادات النموذج للاشتراك؛ ولا يُكتشف ذلك تلقائيًا أبدًا للوكيل.
- لا تُضاف `prompt_cache_retention: "24h"` إلا عند اختيار `cacheRetention: "long"`، وكانت نقطة النهاية المحلولة تدعم كلًا من مفتاح التخزين المؤقت والاحتفاظ الطويل (`compat.supportsLongCacheRetention`، وقيمته الافتراضية `true`؛ بينما تعطّله ملفات توافق Together AI وCloudflare). ويمنع `cacheRetention: "none"` كلا الحقلين.
- تظهر إصابات التخزين المؤقت عبر `usage.prompt_tokens_details.cached_tokens` ‏(Chat Completions) أو `input_tokens_details.cached_tokens` ‏(Responses API)، وتُربط بـ`cacheRead`.
- يمكن لحمولات Responses API أيضًا عرض `input_tokens_details.cache_write_tokens`، الذي يُربط بـ`cacheWrite` ويُسعّر وفق معدل كتابة النموذج إلى التخزين المؤقت؛ وتُبقي حمولات Responses التي تحذف الحقل قيمة `cacheWrite` عند `0`. لا توثّق واجهة Chat Completions API من OpenAI عدّاد `cache_write_tokens` ولا تصدره، لكن OpenClaw يظل يقرأ `prompt_tokens_details.cache_write_tokens` فيها للوكلاء المتوافقين مع OpenRouter والوكلاء على نمط DeepSeek الذين يبلغون عن عدد كتابة منفصل.
- عمليًا، يتصرف OpenAI كذاكرة تخزين مؤقت للبادئة الأولية أكثر من إعادة استخدام Anthropic المتحركة للسجل الكامل؛ راجع [التوقعات المباشرة لـOpenAI](#openai-live-expectations) أدناه.

### Amazon Bedrock

- تدعم مراجع نماذج Anthropic Claude ‏(`amazon-bedrock/*anthropic.claude*`، إضافة إلى بادئات ملفات تعريف الاستدلال النظامية في AWS ‏`us.`/`eu.`/`global.anthropic.claude*`) تمرير `cacheRetention` الصريح.
- تُحل نماذج Bedrock غير التابعة لـAnthropic (مثل `amazon.nova-*`) إلى عدم الاحتفاظ بالتخزين المؤقت وقت التشغيل، بصرف النظر عن أي قيمة `cacheRetention` مضبوطة.
- تُحل أيضًا أسماء موارد Amazon لملفات تعريف استدلال تطبيقات Bedrock المعتمة (معرّفات الملفات التي لا تحتوي على `claude`) إلى عدم الاحتفاظ بالتخزين المؤقت، ما لم يُعيّن `cacheRetention` صراحةً، إذ لا يمكن استنتاج عائلة النموذج من اسم المورد وحده.

### OpenRouter

بالنسبة إلى مراجع نماذج `openrouter/anthropic/*`، يحقن OpenClaw علامات `cache_control` الخاصة بـAnthropic في كتل موجّه النظام/المطوّر، لكن فقط عندما يظل الطلب مستهدفًا مسار OpenRouter موثوقًا (`openrouter` على نقطة نهايته الافتراضية، أو أي مزوّد/عنوان URL أساسي يُحل إلى `openrouter.ai`). تؤدي إعادة توجيه النموذج إلى عنوان URL عشوائي لوكيل متوافق مع OpenAI إلى إيقاف هذا الحقن.

يُسمح بـ`contextPruning.mode: "cache-ttl"` لمراجع نماذج `openrouter/anthropic/*` و`openrouter/deepseek/*` و`openrouter/moonshot/*` و`openrouter/moonshotai/*` و`openrouter/zai/*`، لأن هذه المسارات تتولى التخزين المؤقت للموجّه من جانب المزوّد دون الحاجة إلى علامات OpenClaw المحقونة.

المصدر: `extensions/openrouter/index.ts` ‏(`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

إنشاء التخزين المؤقت لـDeepSeek على OpenRouter هو جهد بأفضل ما يمكن وقد يستغرق بضع ثوانٍ؛ وقد يظل طلب متابعة فوري يعرض `cached_tokens: 0`. تحقّق باستخدام طلب متكرر بالبادئة نفسها بعد تأخير قصير، مع استخدام `usage.prompt_tokens_details.cached_tokens` كإشارة لإصابة التخزين المؤقت.

### Google Gemini ‏(واجهة API المباشرة)

- يبلغ نقل Gemini المباشر (`api: "google-generative-ai"`) عن إصابات التخزين المؤقت عبر `cachedContentTokenCount` المصدرية، وتُربط بـ`cacheRead`.
- عائلات النماذج المؤهلة: `gemini-2.5*` و`gemini-3*` (باستثناء تنويعات Live/المعاينة الواقعة خارج مطابقة هذه البادئة، مثل `gemini-live-2.5-flash-preview`).
- عند تعيين `cacheRetention` على نموذج مؤهل، ينشئ OpenClaw تلقائيًا مورد `cachedContents` لموجّه النظام ويعيد استخدامه ويحدّثه؛ ولا حاجة إلى معرّف يدوي للمحتوى المخزن مؤقتًا. مدة الصلاحية هي `300s` لـ`cacheRetention: "short"` و`3600s` لـ`"long"`.
- لا يزال بإمكانك تمرير معرّف محتوى مخزن مؤقتًا موجود مسبقًا في Gemini عبر `params.cachedContent` (أو `params.cached_content` القديم)؛ ويتخطى المعرّف الصريح مسار الإدارة التلقائية للتخزين المؤقت بالكامل.
- يختلف هذا عن التخزين المؤقت لبادئة الموجّه في Anthropic/OpenAI: يدير OpenClaw مورد `cachedContents` أصليًا لدى المزوّد لـGemini بدلًا من حقن علامات تخزين مؤقت مضمّنة.

المصدر: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### مزوّدو حاضنة CLI ‏(Claude Code وGemini CLI)

تمر الواجهات الخلفية لـCLI التي تصدر أحداث استخدام JSONL ‏(`jsonlDialect: "claude-stream-json"` أو `"gemini-stream-json"`) عبر محلل استخدام مشترك يتعرّف على عدة تنويعات لأسماء الحقول، بما في ذلك عدّاد `cached` عادي يُربط بـ`cacheRead`. عندما تحذف حمولة JSON الخاصة بـCLI حقلًا مباشرًا لرموز الإدخال، يشتقه OpenClaw على النحو `input_tokens - cached`. هذا توحيد للاستخدام فقط؛ ولا ينشئ علامات تخزين مؤقت للموجّه على نمط Anthropic/OpenAI لهذه النماذج المشغّلة عبر CLI.

المصدر: `src/agents/cli-output.ts` ‏(`toCliUsage`).

### المزوّدون الآخرون

إذا كان المزوّد لا يدعم أيًا من أوضاع التخزين المؤقت المذكورة أعلاه، فلن يكون لـ`cacheRetention` أي تأثير.

## حد التخزين المؤقت لموجّه النظام

يقسم OpenClaw موجّه النظام إلى **بادئة ثابتة** و**لاحقة متغيرة** عند حد داخلي لبادئة التخزين المؤقت. يُرتّب المحتوى الواقع أعلى الحد (تعريفات الأدوات، وبيانات Skills الوصفية، وملفات مساحة العمل) ليظل متطابقًا بايتًا ببايت عبر الأدوار. ويمكن أن يتغير المحتوى الواقع أسفل الحد (مثل `HEARTBEAT.md` والطوابع الزمنية لوقت التشغيل والبيانات الوصفية الأخرى الخاصة بكل دور) دون إبطال البادئة المخزنة مؤقتًا.

خيارات التصميم الأساسية:

- تُرتّب ملفات سياق المشروع الثابتة في مساحة العمل قبل `HEARTBEAT.md` حتى لا تؤدي تغيّرات Heartbeat إلى إفساد البادئة الثابتة.
- يُطبّق الحد عبر تشكيل عمليات النقل لعائلات Anthropic وOpenAI وGoogle وCLI، بحيث يستفيد جميع المزوّدين المدعومين من استقرار البادئة نفسه.
- تُوجّه طلبات Codex Responses وAnthropic Vertex عبر تشكيل تخزين مؤقت مدرك للحد، ليظل إعادة استخدام التخزين المؤقت متوافقًا مع ما يتلقاه المزوّدون فعليًا.
- تُطبّع بصمات موجّه النظام (المسافات البيضاء، ونهايات الأسطر، والسياق المضاف بالخطافات، وترتيب قدرات وقت التشغيل)، بحيث تتشارك الموجّهات التي لم تتغير دلاليًا التخزين المؤقت عبر الأدوار.

إذا لاحظت ارتفاعات غير متوقعة في `cacheWrite` بعد تغيير في الإعدادات أو مساحة العمل، فتحقّق مما إذا كان التغيير يقع أعلى حد التخزين المؤقت أم أسفله. عادةً ما يؤدي نقل المحتوى المتغير إلى أسفل الحد (أو تثبيته) إلى حل المشكلة.

## وسائل حماية استقرار التخزين المؤقت في OpenClaw

- تُرتّب كتالوجات أدوات MCP المضمّنة ترتيبًا حتميًا (حسب اسم الخادم، ثم اسم الأداة) قبل تسجيل الأدوات، بحيث لا تؤدي تغيّرات ترتيب `listTools()` إلى اضطراب كتلة الأدوات وإفساد بادئات التخزين المؤقت للموجّه.
- تُبقي الجلسات القديمة التي تحتوي على كتل صور مستمرة **آخر 3 أدوار مكتملة** سليمة (مع احتساب جميع الأدوار المكتملة، وليس الأدوار المحتوية على صور فقط). تُستبدل كتل الصور الأقدم التي سبق معالجتها بعلامة نصية، بحيث لا تستمر المتابعات كثيفة الصور في إعادة إرسال حمولات قديمة كبيرة.

## أنماط الضبط

### حركة مرور مختلطة (القيمة الافتراضية الموصى بها)

احتفظ بخط أساس طويل الأمد في وكيلك الرئيسي، وعطّل التخزين المؤقت في وكلاء الإشعارات ذوي النشاط المتقطع:

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

### خط أساس يعطي الأولوية للتكلفة

- اضبط خط الأساس على `cacheRetention: "short"`.
- فعّل `contextPruning.mode: "cache-ttl"`.
- أبقِ Heartbeat دون مدة الصلاحية لديك فقط للوكلاء الذين يستفيدون من التخزين المؤقت الدافئ.

## اختبارات الانحدار المباشرة

يشغّل OpenClaw بوابة واحدة مجمعة لاختبار انحدار التخزين المؤقت المباشر، تغطي البادئات المتكررة، وأدوار الأدوات، وأدوار الصور، وسجلات الأدوات على نمط MCP، وحالة تحكم بلا تخزين مؤقت لـAnthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

شغّلها باستخدام:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

يخزّن ملف خط الأساس أحدث الأرقام المباشرة المرصودة، بالإضافة إلى الحدود الدنيا للانحدار الخاصة بكل مزوّد التي يتحقق منها الاختبار. تستخدم كل عملية تشغيل معرّفات جلسات ومساحات أسماء للموجّهات جديدة خاصة بها، بحيث لا تلوّث حالة التخزين المؤقت السابقة العينة الحالية. يستخدم Anthropic وOpenAI آليتي إنفاذ مختلفتين: عدم بلوغ حد Anthropic الأدنى هو انحدار صارم (يفشل الاختبار)، بينما عدم بلوغ حد OpenAI الأدنى مخصص للمراقبة فقط (يُسجّل كتحذير ولا يفشل التشغيل). ولا يشتركان في حد واحد عابر للمزوّدين.

### التوقعات المباشرة لـAnthropic

- توقّع عمليات كتابة صريحة للإحماء عبر `cacheWrite`.
- توقّع إعادة استخدام السجل بالكامل تقريبًا في المنعطفات المتكررة، لأن التحكم في ذاكرة التخزين المؤقت لدى Anthropic يقدّم نقطة فصل ذاكرة التخزين المؤقت عبر المحادثة.
- الحدود الدنيا الأساسية للمسارات المستقرة ومسارات الأدوات والصور والمسارات الشبيهة بـ MCP هي بوابات صارمة لمنع التراجع.

### التوقعات المباشرة لـ OpenAI

- توقّع `cacheRead` فقط؛ تظل قيمة `cacheWrite` مساوية لـ `0` في Chat Completions.
- تعامل مع إعادة استخدام ذاكرة التخزين المؤقت في المنعطفات المتكررة باعتبارها حالة استقرار خاصة بمزوّد الخدمة، لا إعادة استخدام متحركة للسجل الكامل على نمط Anthropic.
- الحدود الدنيا مخصّصة للمراقبة فقط (يُسجَّل عدم بلوغها كتحذير، لا كفشل للاختبار)، وهي مستمدة من السلوك المباشر المرصود على `gpt-5.4-mini`:

| السيناريو                 | الحد الأدنى لـ `cacheRead` | الحد الأدنى لمعدل الإصابة |
| ------------------------- | -------------------------: | ------------------------: |
| بادئة مستقرة              |                      4,608 |                      0.90 |
| نص تفريغ الأداة           |                      4,096 |                      0.85 |
| نص تفريغ الصورة           |                      3,840 |                      0.82 |
| نص تفريغ شبيه بـ MCP      |                      4,096 |                      0.85 |

استقرت أحدث أرقام خط الأساس المرصودة (من `live-cache-regression-baseline.ts`) عند: البادئة المستقرة `cacheRead=4864`، ومعدل الإصابة `0.966`؛ ونص تفريغ الأداة `cacheRead=4608`، ومعدل الإصابة `0.896`؛ ونص تفريغ الصورة `cacheRead=4864`، ومعدل الإصابة `0.954`؛ والنص الشبيه بـ MCP ‏`cacheRead=4608`، ومعدل الإصابة `0.891`.

سبب اختلاف التوكيدات: تعرض Anthropic نقاط فصل صريحة لذاكرة التخزين المؤقت وإعادة استخدام متحركة لسجل المحادثة، بينما قد تستقر البادئة الفعّالة القابلة لإعادة الاستخدام لدى OpenAI في حركة البيانات المباشرة قبل اكتمال المطالبة. تؤدي مقارنة المزوّدين بحد نسبة مئوية موحّد عابر للمزوّدين إلى تراجعات زائفة.

## إعداد `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # اختياري
    includeMessages: false # القيمة الافتراضية true
    includePrompt: false # القيمة الافتراضية true
    includeSystem: false # القيمة الافتراضية true
```

القيم الافتراضية:

| المفتاح           | القيمة الافتراضية                            |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### مفاتيح تبديل البيئة (لتصحيح الأخطاء لمرة واحدة)

| المتغير                              | التأثير                                      |
| ------------------------------------ | -------------------------------------------- |
| `OPENCLAW_CACHE_TRACE=1`             | يفعّل تتبّع ذاكرة التخزين المؤقت             |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | يتجاوز مسار الإخراج                          |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | يبدّل التقاط حمولة الرسالة كاملة             |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | يبدّل التقاط نص المطالبة                     |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | يبدّل التقاط مطالبة النظام                   |

### ما يجب فحصه

- أحداث تتبّع ذاكرة التخزين المؤقت بصيغة JSONL وتحتوي على لقطات مرحلية مثل `session:loaded` و`prompt:before` و`stream:context` و`session:after`.
- يظهر تأثير رموز ذاكرة التخزين المؤقت لكل منعطف في واجهات الاستخدام المعتادة: تظهر `cacheRead` و`cacheWrite` في `/usage tokens` و`/status` وملخصات استخدام الجلسة وتخطيطات `messages.usageTemplate` المخصصة.
- بالنسبة إلى Anthropic، توقّع كلاً من `cacheRead` و`cacheWrite` عندما يكون التخزين المؤقت نشطًا.
- بالنسبة إلى OpenAI، توقّع `cacheRead` عند إصابة ذاكرة التخزين المؤقت؛ ولا تُملأ `cacheWrite` إلا في حمولات Responses API التي تتضمنها (راجع [OpenAI](#openai-direct-api) أعلاه).
- تُرجع OpenAI أيضًا ترويسات للتتبّع وحدود المعدل مثل `x-request-id` و`openai-processing-ms` و`x-ratelimit-*`؛ استخدمها لتتبّع الطلبات، لكن يجب أن تظل محاسبة إصابات ذاكرة التخزين المؤقت مستمدة من حمولة الاستخدام، لا من الترويسات.

## استكشاف الأخطاء وإصلاحها بسرعة

- **ارتفاع `cacheWrite` في معظم المنعطفات**: تحقّق من مدخلات مطالبة النظام المتقلبة؛ وتأكد من أن النموذج/المزوّد يدعم إعدادات ذاكرة التخزين المؤقت لديك.
- **ارتفاع `cacheWrite` في Anthropic**: يعني غالبًا أن نقطة فصل ذاكرة التخزين المؤقت تقع على محتوى يتغير مع كل طلب.
- **انخفاض `cacheRead` لدى OpenAI**: تأكد من أن البادئة المستقرة في المقدمة، وأن البادئة المتكررة لا تقل عن 1024 رمزًا، وأن `prompt_cache_key` نفسه يُعاد استخدامه للمنعطفات التي ينبغي أن تشترك في ذاكرة تخزين مؤقت.
- **عدم وجود تأثير لـ `cacheRetention`**: تأكد من أن مفتاح النموذج يطابق `agents.defaults.models["provider/model"]`.
- **طلبات Bedrock Nova التي تتضمن إعدادات ذاكرة التخزين المؤقت**: هذا متوقّع، إذ تُحلّ هذه الطلبات دون الاحتفاظ بذاكرة التخزين المؤقت في وقت التشغيل.

وثائق ذات صلة:

- [Anthropic](/ar/providers/anthropic)
- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [تقليم الجلسة](/ar/concepts/session-pruning)
- [مرجع إعداد Gateway](/ar/gateway/configuration-reference)

## ذو صلة

- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [استخدام API وتكاليفه](/ar/reference/api-usage-costs)
