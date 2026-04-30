---
read_when:
    - تريد فهم الميزات التي قد تستدعي واجهات برمجة التطبيقات المدفوعة
    - عليك تدقيق المفاتيح والتكاليف وإمكانية الاطلاع على الاستخدام
    - أنت تشرح تقارير التكلفة في /status أو /usage
summary: راجِع ما يمكنه إنفاق الأموال، والمفاتيح المستخدمة، وكيفية عرض الاستخدام
title: استخدام API والتكاليف
x-i18n:
    generated_at: "2026-04-30T08:24:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5638007a77a93701ce4ed9139a6c4377c951e2d69941423c3e1b19b5bd52d5d5
    source_path: reference/api-usage-costs.md
    workflow: 16
---

# استخدام API والتكاليف

يسرد هذا المستند **الميزات التي يمكنها استدعاء مفاتيح API** وأين تظهر تكاليفها. ويركز على
ميزات OpenClaw التي يمكن أن تولّد استخدامًا للمزوّد أو استدعاءات API مدفوعة.

## أين تظهر التكاليف (الدردشة + CLI)

**لقطة تكلفة لكل جلسة**

- يعرض `/status` نموذج الجلسة الحالي، واستخدام السياق، ورموز آخر رد.
- إذا كان النموذج يستخدم **مصادقة مفتاح API**، فإن `/status` يعرض أيضًا **التكلفة المقدّرة** للرد الأخير.
- إذا كانت بيانات تعريف الجلسة المباشرة شحيحة، يمكن لـ `/status` استرداد عدّادات
  الرموز/الذاكرة المخبأة وتسمية نموذج وقت التشغيل النشط من أحدث إدخال لاستخدام
  النص المنسوخ. تظل القيم المباشرة غير الصفرية الموجودة لها الأولوية، ويمكن
  لإجماليات النص المنسوخ بحجم الموجه أن تفوز عندما تكون الإجماليات المخزنة مفقودة أو أصغر.

**تذييل تكلفة لكل رسالة**

- يضيف `/usage full` تذييل استخدام إلى كل رد، بما في ذلك **التكلفة المقدّرة** (لمفتاح API فقط).
- يعرض `/usage tokens` الرموز فقط؛ أما تدفقات OAuth/الرموز بأسلوب الاشتراك وCLI فتخفي التكلفة بالدولار.
- ملاحظة Gemini CLI: عندما يعيد CLI مخرجات JSON، يقرأ OpenClaw الاستخدام من
  `stats`، ويوحّد `stats.cached` إلى `cacheRead`، ويشتق رموز الإدخال
  من `stats.input_tokens - stats.cached` عند الحاجة.

ملاحظة Anthropic: أخبرنا فريق Anthropic أن استخدام Claude CLI بأسلوب OpenClaw
مسموح به مجددًا، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p`
على أنهما مصرّح بهما لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
ما تزال Anthropic لا تكشف تقديرًا للتكلفة بالدولار لكل رسالة يمكن لـ OpenClaw
عرضه في `/usage full`.

**نوافذ استخدام CLI (حصص المزوّدين)**

- يعرض `openclaw status --usage` و`openclaw channels list` **نوافذ استخدام** المزوّدين
  (لقطات للحصص، لا تكاليف لكل رسالة).
- يتم توحيد المخرجات البشرية إلى `X% left` عبر المزوّدين.
- مزوّدو نوافذ الاستخدام الحاليون: Anthropic، وGitHub Copilot، وGemini CLI،
  وOpenAI Codex، وMiniMax، وXiaomi، وz.ai.
- ملاحظة MiniMax: تعني حقول `usage_percent` / `usagePercent` الخام الحصة المتبقية،
  لذلك يعكسها OpenClaw قبل العرض. تظل الحقول المستندة إلى العدّ هي الأسبق
  عند وجودها. إذا أعاد المزوّد `model_remains`، يفضّل OpenClaw إدخال
  نموذج الدردشة، ويشتق تسمية النافذة من الطوابع الزمنية عند الحاجة، ويدرج
  اسم النموذج في تسمية الخطة.
- تأتي مصادقة الاستخدام لنوافذ الحصص تلك من خطافات خاصة بالمزوّد عند توفرها؛
  وإلا يعود OpenClaw إلى مطابقة بيانات اعتماد OAuth/مفتاح API من ملفات
  تعريف المصادقة، أو البيئة، أو الإعدادات.

راجع [استخدام الرموز والتكاليف](/ar/reference/token-use) للتفاصيل والأمثلة.

## كيف تُكتشف المفاتيح

يمكن لـ OpenClaw التقاط بيانات الاعتماد من:

- **ملفات تعريف المصادقة** (لكل وكيل، مخزنة في `auth-profiles.json`).
- **متغيرات البيئة** (مثل `OPENAI_API_KEY` و`BRAVE_API_KEY` و`FIRECRAWL_API_KEY`).
- **الإعدادات** (`models.providers.*.apiKey`، و`plugins.entries.*.config.webSearch.apiKey`،
  و`plugins.entries.firecrawl.config.webFetch.apiKey`، و`memorySearch.*`،
  و`talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) التي قد تصدّر المفاتيح إلى بيئة عملية المهارة.

## الميزات التي يمكنها إنفاق المفاتيح

### 1) ردود النموذج الأساسية (الدردشة + الأدوات)

يستخدم كل رد أو استدعاء أداة **مزوّد النموذج الحالي** (OpenAI، وAnthropic، وما إلى ذلك). هذا هو
المصدر الأساسي للاستخدام والتكلفة.

يشمل ذلك أيضًا المزوّدين المستضافين بأسلوب الاشتراك الذين ما زالوا يفرضون رسومًا خارج
واجهة OpenClaw المحلية، مثل **OpenAI Codex**، و**Alibaba Cloud Model Studio
Coding Plan**، و**MiniMax Coding Plan**، و**Z.AI / GLM Coding Plan**، ومسار
تسجيل دخول Claude الخاص بـ Anthropic في OpenClaw مع تفعيل **الاستخدام الإضافي**.

راجع [النماذج](/ar/providers/models) لإعدادات التسعير و[استخدام الرموز والتكاليف](/ar/reference/token-use) للعرض.

### 2) فهم الوسائط (الصوت/الصورة/الفيديو)

يمكن تلخيص الوسائط الواردة أو تفريغها قبل تشغيل الرد. يستخدم هذا واجهات API للنماذج/المزوّدين.

- الصوت: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- الصورة: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- الفيديو: Google / Qwen / Moonshot.

راجع [فهم الوسائط](/ar/nodes/media-understanding).

### 3) إنشاء الصور والفيديو

يمكن لقدرات الإنشاء المشتركة أيضًا إنفاق مفاتيح المزوّدين:

- إنشاء الصور: OpenAI / Google / DeepInfra / fal / MiniMax
- إنشاء الفيديو: DeepInfra / Qwen

يمكن لإنشاء الصور استنتاج مزوّد افتراضي مدعوم بالمصادقة عندما يكون
`agents.defaults.imageGenerationModel` غير معيّن. يتطلب إنشاء الفيديو حاليًا
`agents.defaults.videoGenerationModel` صريحًا مثل
`qwen/wan2.6-t2v`.

راجع [إنشاء الصور](/ar/tools/image-generation)، و[Qwen Cloud](/ar/providers/qwen)،
و[النماذج](/ar/concepts/models).

### 4) تضمينات الذاكرة + البحث الدلالي

يستخدم بحث الذاكرة الدلالي **واجهات API للتضمين** عند إعداده لمزوّدين بعيدين:

- `memorySearch.provider = "openai"` → تضمينات OpenAI
- `memorySearch.provider = "gemini"` → تضمينات Gemini
- `memorySearch.provider = "voyage"` → تضمينات Voyage
- `memorySearch.provider = "mistral"` → تضمينات Mistral
- `memorySearch.provider = "deepinfra"` → تضمينات DeepInfra
- `memorySearch.provider = "lmstudio"` → تضمينات LM Studio (محلي/مستضاف ذاتيًا)
- `memorySearch.provider = "ollama"` → تضمينات Ollama (محلي/مستضاف ذاتيًا؛ عادةً بلا فوترة API مستضافة)
- رجوع اختياري إلى مزوّد بعيد إذا فشلت التضمينات المحلية

يمكنك إبقاؤه محليًا باستخدام `memorySearch.provider = "local"` (بلا استخدام API).

راجع [الذاكرة](/ar/concepts/memory).

### 5) أداة بحث الويب

قد يترتب على `web_search` رسوم استخدام اعتمادًا على مزوّدك:

- **Brave Search API**: `BRAVE_API_KEY` أو `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` أو `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` أو `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` أو `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` أو `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`، أو `MOONSHOT_API_KEY`، أو `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`، أو `MINIMAX_CODING_API_KEY`، أو `MINIMAX_API_KEY`، أو `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: بلا مفتاح لمضيف Ollama محلي يمكن الوصول إليه ومسجّل الدخول؛ يستخدم بحث `https://ollama.com` المباشر `OLLAMA_API_KEY`، ويمكن للمضيفين المحميين بالمصادقة إعادة استخدام مصادقة حامل مزوّد Ollama العادية
- **Perplexity Search API**: `PERPLEXITY_API_KEY`، أو `OPENROUTER_API_KEY`، أو `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` أو `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: رجوع بلا مفتاح (بلا فوترة API، لكنه غير رسمي ومستند إلى HTML)
- **SearXNG**: `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl` (بلا مفتاح/مستضاف ذاتيًا؛ بلا فوترة API مستضافة)

ما تزال مسارات مزوّدي `tools.web.search.*` القديمة تُحمّل عبر طبقة التوافق المؤقتة، لكنها لم تعد سطح الإعدادات الموصى به.

**الرصيد المجاني في Brave Search:** تتضمن كل خطة Brave رصيدًا مجانيًا متجددًا قدره \$5 شهريًا. تكلف خطة Search مقدار \$5 لكل 1,000 طلب، لذلك يغطي الرصيد
1,000 طلب شهريًا بلا رسوم. عيّن حد الاستخدام في لوحة معلومات Brave
لتجنب الرسوم غير المتوقعة.

راجع [أدوات الويب](/ar/tools/web).

### 5) أداة جلب الويب (Firecrawl)

يمكن لـ `web_fetch` استدعاء **Firecrawl** عند وجود مفتاح API:

- `FIRECRAWL_API_KEY` أو `plugins.entries.firecrawl.config.webFetch.apiKey`

إذا لم يتم إعداد Firecrawl، تعود الأداة إلى الجلب المباشر مع Plugin `web-readability` المضمّن (بلا API مدفوعة). عطّل `plugins.entries.web-readability.enabled` لتجاوز استخراج Readability المحلي.

راجع [أدوات الويب](/ar/tools/web).

### 6) لقطات استخدام المزوّد (الحالة/الصحة)

تستدعي بعض أوامر الحالة **نقاط نهاية استخدام المزوّدين** لعرض نوافذ الحصص أو صحة المصادقة.
عادةً ما تكون هذه استدعاءات منخفضة الحجم، لكنها ما تزال تصل إلى واجهات API الخاصة بالمزوّدين:

- `openclaw status --usage`
- `openclaw models status --json`

راجع [CLI النماذج](/ar/cli/models).

### 7) تلخيص حماية Compaction

يمكن لحماية Compaction تلخيص سجل الجلسة باستخدام **النموذج الحالي**، مما
يستدعي واجهات API الخاصة بالمزوّد عند تشغيله.

راجع [إدارة الجلسات + Compaction](/ar/reference/session-management-compaction).

### 8) فحص / اختبار النموذج

يمكن لـ `openclaw models scan` اختبار نماذج OpenRouter ويستخدم `OPENROUTER_API_KEY` عند
تفعيل الاختبار.

راجع [CLI النماذج](/ar/cli/models).

### 9) التحدث (الكلام)

يمكن لوضع التحدث استدعاء **ElevenLabs** عند إعداده:

- `ELEVENLABS_API_KEY` أو `talk.providers.elevenlabs.apiKey`

راجع [وضع التحدث](/ar/nodes/talk).

### 10) Skills (واجهات API تابعة لجهات خارجية)

يمكن لـ Skills تخزين `apiKey` في `skills.entries.<name>.apiKey`. إذا استخدمت مهارة ذلك المفتاح لواجهات
API خارجية، فقد تترتب عليها تكاليف وفقًا لمزوّد المهارة.

راجع [Skills](/ar/tools/skills).

## ذو صلة

- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [تخزين الموجهات مؤقتًا](/ar/reference/prompt-caching)
- [تتبع الاستخدام](/ar/concepts/usage-tracking)
