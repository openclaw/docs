---
read_when:
    - تريد فهم الميزات التي قد تستدعي واجهات برمجة تطبيقات مدفوعة
    - تحتاج إلى تدقيق المفاتيح والتكاليف وإمكانية الاطلاع على الاستخدام
    - أنت تشرح تقارير التكلفة في /status أو /usage
summary: تدقيق ما قد يترتب عليه إنفاق أموال، والمفاتيح المستخدمة، وكيفية عرض الاستخدام
title: استخدام واجهة برمجة التطبيقات والتكاليف
x-i18n:
    generated_at: "2026-05-06T08:12:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8e6f9f8248ddb4241d00191aa231f1d72a2128a7995b4ed0ec0e18a7ed6dd69
    source_path: reference/api-usage-costs.md
    workflow: 16
---

تسرد هذه الوثيقة **الميزات التي يمكنها استدعاء مفاتيح API** وأماكن ظهور تكاليفها. وهي تركّز على
ميزات OpenClaw التي يمكنها توليد استخدام لدى المزوّدين أو استدعاءات API مدفوعة.

## أين تظهر التكاليف (الدردشة + CLI)

**لقطة تكلفة لكل جلسة**

- يعرض `/status` نموذج الجلسة الحالي، واستخدام السياق، ورموز آخر رد.
- إذا كان النموذج يستخدم **مصادقة مفتاح API**، فسيعرض `/status` أيضًا **التكلفة التقديرية** لآخر رد.
- إذا كانت بيانات تعريف الجلسة الحية محدودة، فيمكن لـ `/status` استعادة عدّادات الرموز/ذاكرة التخزين المؤقت
  وتسمية نموذج وقت التشغيل النشط من أحدث إدخال استخدام في النص المنسوخ.
  تظل القيم الحية غير الصفرية الحالية ذات أولوية، ويمكن لإجماليات النص المنسوخ بحجم الموجه
  أن تفوز عندما تكون الإجماليات المخزّنة مفقودة أو أصغر.

**تذييل تكلفة لكل رسالة**

- يضيف `/usage full` تذييل استخدام إلى كل رد، بما في ذلك **التكلفة التقديرية** (لمفاتيح API فقط).
- يعرض `/usage tokens` الرموز فقط؛ وتخفي تدفقات OAuth/الرموز ذات نمط الاشتراك وCLI التكلفة بالدولار.
- ملاحظة Gemini CLI: عندما يعيد CLI مخرجات JSON، يقرأ OpenClaw الاستخدام من
  `stats`، ويحوّل `stats.cached` إلى `cacheRead`، ويشتق رموز الإدخال
  من `stats.input_tokens - stats.cached` عند الحاجة.

ملاحظة Anthropic: أخبرنا موظفو Anthropic أن استخدام Claude CLI بنمط OpenClaw
مسموح به مجددًا، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p`
على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
ما زالت Anthropic لا توفّر تقديرًا بالدولار لكل رسالة يمكن لـ OpenClaw
عرضه في `/usage full`.

**نوافذ استخدام CLI (حصص المزوّدين)**

- يعرض `openclaw status --usage` و`openclaw channels list` **نوافذ استخدام** المزوّدين
  (لقطات للحصة، وليست تكاليف لكل رسالة).
- يتم توحيد المخرجات البشرية إلى `X% left` عبر المزوّدين.
- مزوّدو نوافذ الاستخدام الحاليون: Anthropic، وGitHub Copilot، وGemini CLI،
  وOpenAI Codex، وMiniMax، وXiaomi، وz.ai.
- ملاحظة MiniMax: تعني حقولا `usage_percent` / `usagePercent` الخامان الحصة المتبقية،
  لذلك يعكسهما OpenClaw قبل العرض. تظل الحقول المعتمدة على العدد ذات أولوية
  عند وجودها. إذا أعاد المزوّد `model_remains`، يفضّل OpenClaw
  إدخال نموذج الدردشة، ويشتق تسمية النافذة من الطوابع الزمنية عند الحاجة، و
  يضمّن اسم النموذج في تسمية الخطة.
- تأتي مصادقة الاستخدام لتلك النوافذ الحصصية من خطافات خاصة بالمزوّد عند
  توفرها؛ وإلا فيرجع OpenClaw إلى مطابقة بيانات اعتماد OAuth/مفتاح API
  من ملفات تعريف المصادقة، أو البيئة، أو الإعدادات.

راجع [استخدام الرموز والتكاليف](/ar/reference/token-use) للحصول على التفاصيل والأمثلة.

## كيف يتم اكتشاف المفاتيح

يمكن لـ OpenClaw التقاط بيانات الاعتماد من:

- **ملفات تعريف المصادقة** (لكل وكيل، مخزّنة في `auth-profiles.json`).
- **متغيرات البيئة** (مثل `OPENAI_API_KEY`، و`BRAVE_API_KEY`، و`FIRECRAWL_API_KEY`).
- **الإعدادات** (`models.providers.*.apiKey`، و`plugins.entries.*.config.webSearch.apiKey`،
  و`plugins.entries.firecrawl.config.webFetch.apiKey`، و`memorySearch.*`،
  و`talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) التي قد تصدّر المفاتيح إلى بيئة عملية Skills.

## الميزات التي يمكنها إنفاق المفاتيح

### 1) ردود النموذج الأساسية (الدردشة + الأدوات)

يستخدم كل رد أو استدعاء أداة **مزوّد النموذج الحالي** (OpenAI، Anthropic، إلخ). هذا هو
المصدر الأساسي للاستخدام والتكلفة.

ويشمل ذلك أيضًا المزوّدين المستضافين بنمط الاشتراك الذين يظلون يفرضون الرسوم خارج
واجهة OpenClaw المحلية، مثل **OpenAI Codex**، و**Alibaba Cloud Model Studio
Coding Plan**، و**MiniMax Coding Plan**، و**Z.AI / GLM Coding Plan**، ومسار
تسجيل دخول Anthropic Claude في OpenClaw مع تمكين **Extra Usage**.

راجع [النماذج](/ar/providers/models) لإعدادات التسعير و[استخدام الرموز والتكاليف](/ar/reference/token-use) للعرض.

### 2) فهم الوسائط (الصوت/الصورة/الفيديو)

يمكن تلخيص/نسخ الوسائط الواردة قبل تشغيل الرد. يستخدم هذا APIs النماذج/المزوّدين.

- الصوت: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- الصورة: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- الفيديو: Google / Qwen / Moonshot.

راجع [فهم الوسائط](/ar/nodes/media-understanding).

### 3) توليد الصور والفيديو

يمكن لإمكانات التوليد المشتركة أن تنفق مفاتيح المزوّدين أيضًا:

- توليد الصور: OpenAI / Google / DeepInfra / fal / MiniMax
- توليد الفيديو: DeepInfra / Qwen

يمكن لتوليد الصور استنتاج مزوّد افتراضي مدعوم بالمصادقة عندما يكون
`agents.defaults.imageGenerationModel` غير معيّن. يتطلب توليد الفيديو حاليًا
`agents.defaults.videoGenerationModel` صريحًا مثل
`qwen/wan2.6-t2v`.

راجع [توليد الصور](/ar/tools/image-generation)، و[Qwen Cloud](/ar/providers/qwen)،
و[النماذج](/ar/concepts/models).

### 4) تضمينات الذاكرة + البحث الدلالي

يستخدم بحث الذاكرة الدلالي **APIs التضمين** عند إعداده لمزوّدين بعيدين:

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

قد يتسبب `web_search` في رسوم استخدام حسب مزوّدك:

- **Brave Search API**: `BRAVE_API_KEY` أو `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` أو `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` أو `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` أو `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` أو `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`، أو `MOONSHOT_API_KEY`، أو `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`، أو `MINIMAX_CODING_API_KEY`، أو `MINIMAX_API_KEY`، أو `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: بلا مفتاح لمضيف Ollama محلي يمكن الوصول إليه ومُسجّل الدخول؛ يستخدم البحث المباشر عبر `https://ollama.com` المفتاح `OLLAMA_API_KEY`، ويمكن للمضيفين المحميين بالمصادقة إعادة استخدام مصادقة حامل مزوّد Ollama العادية
- **Perplexity Search API**: `PERPLEXITY_API_KEY`، أو `OPENROUTER_API_KEY`، أو `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` أو `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: بديل بلا مفتاح (بلا فوترة API، لكنه غير رسمي ومعتمد على HTML)
- **SearXNG**: `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl` (بلا مفتاح/مستضاف ذاتيًا؛ بلا فوترة API مستضافة)

ما زالت مسارات مزوّد `tools.web.search.*` القديمة تُحمّل عبر طبقة التوافق المؤقتة، لكنها لم تعد سطح الإعدادات الموصى به.

**رصيد Brave Search المجاني:** تتضمن كل خطة Brave رصيدًا مجانيًا متجددًا بقيمة \$5 شهريًا.
تبلغ تكلفة خطة Search \$5 لكل 1,000 طلب، لذلك يغطي الرصيد
1,000 طلب شهريًا بلا رسوم. اضبط حد الاستخدام في لوحة تحكم Brave
لتجنب الرسوم غير المتوقعة.

راجع [أدوات الويب](/ar/tools/web).

### 5) أداة جلب الويب (Firecrawl)

يمكن لـ `web_fetch` استدعاء **Firecrawl** عند وجود مفتاح API:

- `FIRECRAWL_API_KEY` أو `plugins.entries.firecrawl.config.webFetch.apiKey`

إذا لم يتم إعداد Firecrawl، ترجع الأداة إلى الجلب المباشر مع Plugin `web-readability` المضمّن (بلا API مدفوعة). عطّل `plugins.entries.web-readability.enabled` لتخطي استخراج Readability المحلي.

راجع [أدوات الويب](/ar/tools/web).

### 6) لقطات استخدام المزوّد (الحالة/الصحة)

تستدعي بعض أوامر الحالة **نقاط نهاية استخدام المزوّد** لعرض نوافذ الحصص أو صحة المصادقة.
عادةً ما تكون هذه استدعاءات منخفضة الحجم، لكنها ما زالت تصل إلى APIs المزوّدين:

- `openclaw status --usage`
- `openclaw models status --json`

راجع [CLI النماذج](/ar/cli/models).

### 7) تلخيص حماية Compaction

يمكن لحماية Compaction تلخيص سجل الجلسة باستخدام **النموذج الحالي**، مما
يستدعي APIs المزوّدين عند تشغيلها.

راجع [إدارة الجلسات + Compaction](/ar/reference/session-management-compaction).

### 8) فحص / اختبار النموذج

يمكن لـ `openclaw models scan` اختبار نماذج OpenRouter ويستخدم `OPENROUTER_API_KEY` عند
تمكين الاختبار.

راجع [CLI النماذج](/ar/cli/models).

### 9) التحدث (الكلام)

يمكن لوضع التحدث استدعاء **ElevenLabs** عند إعداده:

- `ELEVENLABS_API_KEY` أو `talk.providers.elevenlabs.apiKey`

راجع [وضع التحدث](/ar/nodes/talk).

### 10) Skills (APIs جهات خارجية)

يمكن لـ Skills تخزين `apiKey` في `skills.entries.<name>.apiKey`. إذا استخدمت Skills ذلك المفتاح مع
APIs خارجية، فقد تتسبب في تكاليف وفقًا لمزوّد Skills.

راجع [Skills](/ar/tools/skills).

## ذات صلة

- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [تخزين الموجهات مؤقتًا](/ar/reference/prompt-caching)
- [تتبع الاستخدام](/ar/concepts/usage-tracking)
