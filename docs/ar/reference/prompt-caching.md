---
read_when:
    - تريد تقليل تكاليف رموز المطالبة من خلال الاحتفاظ بذاكرة التخزين المؤقت
    - تحتاج إلى سلوك تخزين مؤقت خاص بكل وكيل في إعدادات متعددة الوكلاء
    - أنت تضبط Heartbeat وتنقية ذاكرة التخزين المؤقت وفق مدة البقاء معًا
summary: مقابض ضبط التخزين المؤقت للمطالبات، وترتيب الدمج، وسلوك المزوّد، وأنماط الضبط الدقيق
title: التخزين المؤقت للموجّهات
x-i18n:
    generated_at: "2026-07-16T15:05:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59a5aefc4d4139c31461b81f164b9efa9a4c1c48d03146049cf447b9dfd6ea99
    source_path: reference/prompt-caching.md
    workflow: 16
---

يتيح التخزين المؤقت للموجّه لمزوّد النموذج إعادة استخدام بادئة موجّه لم تتغير (تعليمات النظام/المطوّر، وتعريفات الأدوات، وسياق ثابت آخر) عبر الأدوار بدلًا من إعادة معالجتها في كل طلب. يقلّل هذا تكلفة الرموز ووقت الاستجابة في الجلسات طويلة الأمد ذات السياق المتكرر.

يوحّد OpenClaw استخدام المزوّد ضمن `cacheRead` و`cacheWrite` حيثما تعرض واجهة API المصدرية تلك العدّادات. وتعود ملخصات الاستخدام (`/status` وما شابه) إلى آخر إدخال استخدام في النص المنسوخ عندما تفتقر لقطة الجلسة المباشرة إلى عدّادات التخزين المؤقت؛ وتكون للقيمة المباشرة غير الصفرية دائمًا الأولوية على القيمة الاحتياطية.

مراجع المزوّدين:

- [التخزين المؤقت للموجّه في Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [التخزين المؤقت للموجّه في OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## عناصر التحكم الأساسية

### `cacheRetention`

القيم: `"none" | "short" | "long"`. قابل للتهيئة كإعداد افتراضي عام، ولكل نموذج، ولكل وكيل.
لا يُعد `"standard"` اسمًا مستعارًا؛ استخدم `"short"` لنافذة التخزين المؤقت الافتراضية للمزوّد. تُتجاهل القيم غير الصالحة مع إصدار تحذير.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # يتجاوز الإعداد الافتراضي العام لهذا النموذج
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # يتجاوز كلا الإعدادين الافتراضيين لهذا الوكيل
```

ترتيب الدمج (للأخير الأولوية):

1. `agents.defaults.params` - الإعداد الافتراضي العام لجميع النماذج
2. `agents.defaults.models["provider/model"].params` - تجاوز خاص بكل نموذج
3. `agents.list[].params` - تجاوز خاص بكل وكيل، تتم مطابقته حسب معرّف الوكيل

المصدر: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

يقتطع سياق نتائج الأدوات القديم بعد انقضاء نافذة مدة صلاحية التخزين المؤقت، بحيث لا يعيد طلب بعد فترة خمول تخزين سجل ضخم مؤقتًا.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

راجع [اقتطاع الجلسة](/ar/concepts/session-pruning) للاطلاع على السلوك الكامل.

### إبقاء التخزين دافئًا باستخدام Heartbeat

يمكن لـ Heartbeat إبقاء نوافذ التخزين المؤقت دافئة وتقليل عمليات الكتابة المتكررة إلى التخزين المؤقت بعد فترات الخمول. ويمكن تهيئته عموميًا (`agents.defaults.heartbeat`) أو لكل وكيل (`agents.list[].heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## سلوك المزوّدين

### Anthropic (واجهة API المباشرة وVertex AI)

- يُدعَم `cacheRetention` لمزوّدي `anthropic` و`anthropic-vertex`، ولنُماذج Claude على `amazon-bedrock` ونقاط النهاية المخصصة المتوافقة مع `anthropic-messages` عند تعيين `cacheRetention` صراحةً.
- عند عدم تعيينه، يضع OpenClaw قيمة أولية في `cacheRetention: "short"` لاتصالات Anthropic المباشرة (مزوّدا `anthropic` و`anthropic-vertex` فقط؛ تتطلب المسارات الأخرى من عائلة Anthropic قيمة صريحة).
- تعرض استجابات Anthropic Messages الأصلية `cache_read_input_tokens` و`cache_creation_input_tokens`، ويُربطان بـ `cacheRead` و`cacheWrite`.
- يُربط `cacheRetention: "short"` بالتخزين المؤقت المؤقت الافتراضي لمدة 5 دقائق. ويطلب `cacheRetention: "long"` مدة صلاحية قدرها ساعة واحدة (`cache_control: { type: "ephemeral", ttl: "1h" }`) عند تعيينه صراحةً. ولا تُرقّى مدة الاحتفاظ الطويلة الضمنية/المستمدة من البيئة (`OPENCLAW_CACHE_RETENTION=long` من دون `cacheRetention` صريح) إلى مدة الصلاحية البالغة ساعة واحدة إلا على `api.anthropic.com` أو مضيفي Vertex AI ‏(`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`)؛ بينما يحتفظ المضيفون الآخرون بالتخزين المؤقت لمدة 5 دقائق.

المصدر: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`، `isLongTtlEligibleEndpoint`).

### OpenAI (واجهة API المباشرة)

- يكون التخزين المؤقت للموجّه تلقائيًا في النماذج الحديثة المدعومة؛ ولا يحقن OpenClaw علامات تخزين مؤقت على مستوى الكتل.
- يرسل OpenClaw القيمة `prompt_cache_key` للحفاظ على استقرار توجيه التخزين المؤقت عبر الأدوار. ويحصل مضيفو `api.openai.com` المباشرون عليها تلقائيًا. أما الوكلاء المتوافقون مع OpenAI ‏(oMLX وllama.cpp ونقاط النهاية المخصصة) فيحتاجون إلى `compat.supportsPromptCacheKey: true` في تهيئة النموذج للاشتراك؛ ولا يُكتشف هذا تلقائيًا مطلقًا للوكيل.
- لا يُضاف `prompt_cache_retention: "24h"` إلا عند تحديد `cacheRetention: "long"` وكانت نقطة النهاية المحلولة تدعم كلًا من مفتاح التخزين المؤقت والاحتفاظ الطويل (`compat.supportsLongCacheRetention`، وقيمته الافتراضية true؛ وتعطّله ملفات التوافق الخاصة بـ Together AI وCloudflare). ويمنع `cacheRetention: "none"` كلا الحقلين.
- تظهر إصابات التخزين المؤقت عبر `usage.prompt_tokens_details.cached_tokens` ‏(Chat Completions) أو `input_tokens_details.cached_tokens` ‏(Responses API)، وتُربط بـ `cacheRead`.
- يمكن أيضًا لحمولات Responses API عرض `input_tokens_details.cache_write_tokens`، الذي يُربط بـ `cacheWrite` ويُسعّر وفق معدل الكتابة إلى التخزين المؤقت للنموذج؛ أما حمولات Responses التي تحذف هذا الحقل فتبقي `cacheWrite` عند `0`. لا توثّق واجهة Chat Completions API من OpenAI عدّاد `cache_write_tokens` ولا تصدره، لكن OpenClaw يواصل قراءة `prompt_tokens_details.cache_write_tokens` هناك للوكلاء المتوافقين مع OpenRouter والوكلاء بأسلوب DeepSeek الذين يبلغون عن عدد كتابة منفصل.
- عمليًا، يتصرف OpenAI كتخزين مؤقت للبادئة الأولية أكثر من إعادة استخدام السجل الكامل المتحرك لدى Anthropic؛ راجع [التوقعات المباشرة لـ OpenAI](#openai-live-expectations) أدناه.

### Amazon Bedrock

- تدعم مراجع نماذج Anthropic Claude ‏(`amazon-bedrock/*anthropic.claude*`، بالإضافة إلى بادئات ملفات استدلال النظام في AWS ‏`us.`/`eu.`/`global.anthropic.claude*`) تمرير `cacheRetention` الصريح.
- تُحل نماذج Bedrock غير التابعة لـ Anthropic (مثل `amazon.nova-*`) إلى عدم الاحتفاظ بالتخزين المؤقت في وقت التشغيل، بصرف النظر عن أي قيمة `cacheRetention` مهيأة.
- تُحل أيضًا أسماء ARN المبهمة لملفات استدلال تطبيق Bedrock (معرّفات الملفات التي لا تحتوي على `claude`) إلى عدم الاحتفاظ بالتخزين المؤقت ما لم يُعيّن `cacheRetention` صراحةً، إذ لا يمكن استنتاج عائلة النموذج من ARN وحده.

### OpenRouter

بالنسبة إلى مراجع نماذج `openrouter/anthropic/*`، يحقن OpenClaw علامات `cache_control` الخاصة بـ Anthropic في كتل موجّه النظام/المطوّر، لكن فقط عندما يظل الطلب موجّهًا إلى مسار OpenRouter موثّق (`openrouter` على نقطة نهايته الافتراضية، أو أي مزوّد/عنوان URL أساسي يُحل إلى `openrouter.ai`). وتؤدي إعادة توجيه النموذج إلى عنوان URL اعتباطي لوكيل متوافق مع OpenAI إلى إيقاف هذا الحقن.

يُسمح بـ `contextPruning.mode: "cache-ttl"` لمراجع نماذج `openrouter/anthropic/*` و`openrouter/deepseek/*` و`openrouter/moonshot/*` و`openrouter/moonshotai/*` و`openrouter/zai/*`، لأن هذه المسارات تتولى التخزين المؤقت للموجّه من جانب المزوّد من دون الحاجة إلى العلامات التي يحقنها OpenClaw.

المصدر: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

يُنشأ تخزين DeepSeek المؤقت على OpenRouter وفق أفضل جهد ممكن وقد يستغرق بضع ثوانٍ؛ وقد يظل طلب متابعة فوري يعرض `cached_tokens: 0`. تحقّق باستخدام طلب متكرر ذي البادئة نفسها بعد تأخير قصير، مع استخدام `usage.prompt_tokens_details.cached_tokens` كإشارة إلى إصابة التخزين المؤقت.

### Google Gemini (واجهة API المباشرة)

- يبلغ نقل Gemini المباشر (`api: "google-generative-ai"`) عن إصابات التخزين المؤقت من خلال `cachedContentTokenCount` المصدرية، التي تُربط بـ `cacheRead`.
- عائلات النماذج المؤهلة: `gemini-2.5*` و`gemini-3*` (باستثناء متغيرات Live/المعاينة الواقعة خارج مطابقة تلك البادئة، مثل `gemini-live-2.5-flash-preview`).
- عند تعيين `cacheRetention` على نموذج مؤهل، ينشئ OpenClaw تلقائيًا مورد `cachedContents` لموجّه النظام ويعيد استخدامه ويحدّثه؛ ولا حاجة إلى معرّف محتوى مخزّن مؤقتًا يدويًا. تبلغ مدة الصلاحية `300s` للقيمة `cacheRetention: "short"` و`3600s` للقيمة `"long"`.
- لا يزال بالإمكان تمرير معرّف محتوى مخزّن مؤقتًا موجود مسبقًا في Gemini عبر `params.cachedContent` (أو `params.cached_content` القديم)؛ ويتخطى المعرّف الصريح مسار الإدارة التلقائية للتخزين المؤقت بالكامل.
- يختلف هذا عن التخزين المؤقت لبادئة الموجّه في Anthropic/OpenAI: يدير OpenClaw مورد `cachedContents` أصليًا خاصًا بالمزوّد لـ Gemini بدلًا من حقن علامات تخزين مؤقت مضمنة.

المصدر: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### مزوّدو بيئة اختبار CLI ‏(Claude Code وGemini CLI)

تمر الواجهات الخلفية لـ CLI التي تصدر أحداث استخدام JSONL ‏(`jsonlDialect: "claude-stream-json"` أو `"gemini-stream-json"`) عبر محلل استخدام مشترك يتعرف على عدة متغيرات لأسماء الحقول، بما فيها عدّاد `cached` بسيط يُربط بـ `cacheRead`. عندما تحذف حمولة JSON الخاصة بـ CLI حقلًا مباشرًا لرموز الإدخال، يشتقه OpenClaw بالصيغة `input_tokens - cached`. هذا توحيد للاستخدام فقط؛ ولا ينشئ علامات تخزين مؤقت للموجّه بأسلوب Anthropic/OpenAI لهذه النماذج المشغّلة عبر CLI.

المصدر: `src/agents/cli-output.ts` (`toCliUsage`).

### مزوّدون آخرون

إذا كان المزوّد لا يدعم أيًا من أوضاع التخزين المؤقت أعلاه، فلن يكون لـ `cacheRetention` أي تأثير.

## حد التخزين المؤقت لموجّه النظام

يقسم OpenClaw موجّه النظام إلى **بادئة ثابتة** و**لاحقة متغيرة** عند حد داخلي لبادئة التخزين المؤقت. يُرتّب المحتوى أعلى الحد (تعريفات الأدوات، وبيانات Skills الوصفية، وملفات مساحة العمل) ليظل متطابقًا على مستوى البايتات عبر الأدوار. ويمكن أن يتغير المحتوى أسفل الحد (مثل `HEARTBEAT.md` والطوابع الزمنية لوقت التشغيل وغيرها من البيانات الوصفية الخاصة بكل دور) من دون إبطال البادئة المخزنة مؤقتًا.

خيارات التصميم الأساسية:

- تُرتب ملفات سياق المشروع الثابتة في مساحة العمل قبل `HEARTBEAT.md` كي لا يؤدي تغير Heartbeat إلى إبطال البادئة الثابتة.
- ينطبق الحد على تشكيل عمليات النقل لعائلات Anthropic وOpenAI وGoogle وCLI، بحيث يستفيد جميع المزوّدين المدعومين من استقرار البادئة نفسه.
- تُوجّه طلبات Codex Responses وAnthropic Vertex عبر تشكيل للتخزين المؤقت يراعي الحد، بحيث تظل إعادة استخدام التخزين المؤقت متوافقة مع ما يتلقاه المزوّدون فعليًا.
- تُوحّد بصمات موجّه النظام (المسافات البيضاء، ونهايات الأسطر، والسياق المضاف بواسطة الخطافات، وترتيب إمكانات وقت التشغيل) بحيث تتشارك الموجّهات غير المتغيرة دلاليًا التخزين المؤقت عبر الأدوار.

إذا لاحظت ارتفاعات غير متوقعة في `cacheWrite` بعد تغيير التهيئة أو مساحة العمل، فتحقق مما إذا كان التغيير يقع أعلى حد التخزين المؤقت أم أسفله. وعادةً ما يؤدي نقل المحتوى المتغير إلى أسفل الحد (أو تثبيته) إلى حل المشكلة.

## آليات حماية استقرار التخزين المؤقت في OpenClaw

- تُرتب كتالوجات أدوات MCP المضمّنة ترتيبًا حتميًا (حسب اسم الخادم، ثم اسم الأداة) قبل تسجيل الأدوات، بحيث لا تؤدي تغييرات ترتيب `listTools()` إلى تغيير كتلة الأدوات وإبطال بادئات التخزين المؤقت للموجّه.
- تحافظ الجلسات القديمة التي تحتوي على كتل صور مستمرة على **أحدث 3 أدوار مكتملة** سليمة (مع احتساب جميع الأدوار المكتملة، وليس الأدوار التي تحتوي على صور فقط). وتُستبدل كتل الصور الأقدم التي عولجت بالفعل بعلامة نصية، بحيث لا تواصل المتابعات كثيفة الصور إعادة إرسال حمولات قديمة كبيرة.

## أنماط الضبط

### حركة مرور مختلطة (الإعداد الافتراضي الموصى به)

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

- عيّن `cacheRetention: "short"` لخط الأساس.
- فعّل `contextPruning.mode: "cache-ttl"`.
- أبقِ Heartbeat دون مدة الصلاحية الخاصة بك فقط للوكلاء الذين يستفيدون من التخزين المؤقت الدافئ.

## اختبارات الانحدار المباشرة

يشغّل OpenClaw بوابة انحدار مباشرة موحّدة للتخزين المؤقت، تغطي البادئات المتكررة، وأدوار الأدوات، وأدوار الصور، والنصوص المنسوخة لأدوات بأسلوب MCP، وحالة تحكم من Anthropic بلا تخزين مؤقت.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

شغّلها باستخدام:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

يخزّن ملف خط الأساس أحدث الأرقام المرصودة مباشرةً، إضافةً إلى الحدود الدنيا للتراجع الخاصة بكل مزوّد التي يتحقق منها الاختبار. تستخدم كل عملية تشغيل معرّفات جلسات ومساحات أسماء للمطالبات جديدة خاصة بها، حتى لا تلوّث حالة ذاكرة التخزين المؤقت السابقة العينة الحالية. يطبّق Anthropic وOpenAI آليتين مختلفتين: عدم بلوغ الحد الأدنى في Anthropic يُعدّ تراجعًا حاسمًا (يفشل الاختبار)، بينما يكون عدم بلوغ الحد الأدنى في OpenAI للمراقبة فقط (يُسجّل كتحذير ولا يُفشل عملية التشغيل). ولا يشتركان في عتبة واحدة عابرة للمزوّدين.

### التوقعات المباشرة لـ Anthropic

- توقّع عمليات كتابة إحماء صريحة عبر `cacheWrite`.
- توقّع إعادة استخدام شبه كاملة للسجل في الأدوار المتكررة، لأن التحكّم في ذاكرة التخزين المؤقت لدى Anthropic يقدّم نقطة توقف التخزين المؤقت عبر المحادثة.
- تُعدّ الحدود الدنيا لخط الأساس في مسارات الاستقرار والأدوات والصور والمسارات بنمط MCP بوابات حاسمة لاكتشاف التراجع.

### التوقعات المباشرة لـ OpenAI

- توقّع `cacheRead` فقط؛ وتبقى `cacheWrite` بالقيمة `0` في Chat Completions.
- تعامل مع إعادة استخدام ذاكرة التخزين المؤقت في الأدوار المتكررة بوصفها مستوى ثبات خاصًا بالمزوّد، لا إعادة استخدام متحركة لكامل السجل على نمط Anthropic.
- الحدود الدنيا للمراقبة فقط (يُسجّل عدم بلوغها كتحذير، لا كفشل للاختبار)، وهي مشتقة من السلوك المباشر المرصود في `gpt-5.4-mini`:

| السيناريو             | الحد الأدنى لـ `cacheRead` | الحد الأدنى لمعدل الإصابة |
| -------------------- | ----------------: | -------------: |
| بادئة مستقرة        |             4,608 |           0.90 |
| نص تفريغ الأداة      |             4,096 |           0.85 |
| نص تفريغ الصورة     |             3,840 |           0.82 |
| نص تفريغ بنمط MCP |             4,096 |           0.85 |

بلغت أحدث أرقام خط الأساس المرصودة (من `live-cache-regression-baseline.ts`) ما يلي: البادئة المستقرة `cacheRead=4864`، ومعدل الإصابة `0.966`؛ نص تفريغ الأداة `cacheRead=4608`، ومعدل الإصابة `0.896`؛ نص تفريغ الصورة `cacheRead=4864`، ومعدل الإصابة `0.954`؛ نص التفريغ بنمط MCP‏ `cacheRead=4608`، ومعدل الإصابة `0.891`.

سبب اختلاف التأكيدات: يتيح Anthropic نقاط توقف صريحة لذاكرة التخزين المؤقت وإعادة استخدام متحركة لسجل المحادثة، بينما قد تستقر البادئة القابلة لإعادة الاستخدام فعليًا لدى OpenAI في حركة البيانات المباشرة قبل اكتمال المطالبة. تؤدي مقارنة المزوّدين باستخدام عتبة نسبة مئوية واحدة عابرة للمزوّدين إلى تراجعات زائفة.

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

| المفتاح               | القيمة الافتراضية                                      |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### مفاتيح تبديل البيئة (لتصحيح الأخطاء لمرة واحدة)

| المتغير                             | التأثير                               |
| ------------------------------------ | ------------------------------------ |
| `OPENCLAW_CACHE_TRACE=1`             | يفعّل تتبّع ذاكرة التخزين المؤقت                |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | يتجاوز مسار الإخراج                |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | يبدّل التقاط حمولة الرسالة كاملة |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | يبدّل التقاط نص المطالبة          |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | يبدّل التقاط مطالبة النظام        |

### ما ينبغي فحصه

- أحداث تتبّع ذاكرة التخزين المؤقت هي JSONL وتحتوي على لقطات مرحلية مثل `session:loaded` و`prompt:before` و`stream:context` و`session:after`.
- يظهر تأثير رموز ذاكرة التخزين المؤقت لكل دور في واجهات الاستخدام المعتادة: يظهر `cacheRead` و`cacheWrite` في `/usage tokens` و`/status` وملخصات استخدام الجلسات وتخطيطات `messages.usageTemplate` المخصّصة.
- بالنسبة إلى Anthropic، توقّع كلاً من `cacheRead` و`cacheWrite` عندما يكون التخزين المؤقت نشطًا.
- بالنسبة إلى OpenAI، توقّع `cacheRead` عند إصابة ذاكرة التخزين المؤقت؛ ولا تُملأ `cacheWrite` إلا في حمولات Responses API التي تتضمنها (راجع [OpenAI](#openai-direct-api) أعلاه).
- يعيد OpenAI أيضًا ترويسات التتبّع وحدود المعدّل، مثل `x-request-id` و`openai-processing-ms` و`x-ratelimit-*`؛ استخدمها لتتبّع الطلبات، لكن يجب أن يظل احتساب إصابات ذاكرة التخزين المؤقت مستمدًا من حمولة الاستخدام، لا من الترويسات.

## استكشاف الأخطاء وإصلاحها بسرعة

- **ارتفاع `cacheWrite` في معظم الأدوار**: تحقّق من وجود مدخلات متغيّرة في مطالبة النظام؛ وتأكد من أن النموذج/المزوّد يدعم إعدادات ذاكرة التخزين المؤقت.
- **ارتفاع `cacheWrite` في Anthropic**: يعني غالبًا أن نقطة توقف ذاكرة التخزين المؤقت تقع على محتوى يتغيّر مع كل طلب.
- **انخفاض `cacheRead` في OpenAI**: تأكد من أن البادئة المستقرة في المقدمة، وأن البادئة المتكررة لا تقل عن 1024 رمزًا، وأن `prompt_cache_key` نفسه يُعاد استخدامه للأدوار التي ينبغي أن تشترك في ذاكرة تخزين مؤقت.
- **عدم وجود تأثير لـ `cacheRetention`**: تأكد من أن مفتاح النموذج يطابق `agents.defaults.models["provider/model"]`.
- **طلبات Bedrock Nova مع إعدادات ذاكرة التخزين المؤقت**: هذا متوقّع؛ إذ تُحلّ هذه الطلبات إلى عدم الاحتفاظ بذاكرة التخزين المؤقت في وقت التشغيل.

وثائق ذات صلة:

- [Anthropic](/ar/providers/anthropic)
- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [تقليم الجلسة](/ar/concepts/session-pruning)
- [مرجع إعداد Gateway](/ar/gateway/configuration-reference)

## ذو صلة

- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [استخدام API والتكاليف](/ar/reference/api-usage-costs)
