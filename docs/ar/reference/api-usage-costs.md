---
read_when:
    - تريد فهم الميزات التي قد تستدعي واجهات API مدفوعة
    - تحتاج إلى تدقيق المفاتيح والتكاليف وإمكانية رؤية الاستخدام
    - أنت تشرح تقارير تكلفة /status أو /usage
summary: دقّق فيما يمكنه إنفاق الأموال، والمفاتيح المستخدمة، وكيفية عرض الاستخدام
title: استخدام API والتكاليف
x-i18n:
    generated_at: "2026-06-27T18:30:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 473028747c3e8eab60667106d22616aa185f867d01238b856f4235faad957a9e
    source_path: reference/api-usage-costs.md
    workflow: 16
---

يوثق هذا المستند **الميزات التي يمكنها استدعاء مفاتيح API** وأين تظهر تكاليفها. ويركز على
ميزات OpenClaw التي يمكنها توليد استخدام للمزوّدين أو استدعاءات API مدفوعة.

## أين تظهر التكاليف (الدردشة + CLI)

**لقطة تكلفة لكل جلسة**

- يعرض `/status` نموذج الجلسة الحالي، واستخدام السياق، ورموز آخر استجابة.
- إذا كانت لدى OpenClaw بيانات تعريف للاستخدام وتسعير محلي للنموذج النشط،
  فسيعرض `/status` أيضًا **التكلفة المقدّرة** لآخر رد. يمكن أن يشمل ذلك
  مزوّدين غير معتمدين على مفاتيح API ومسعّرين صراحة، مثل نماذج Bedrock `aws-sdk`.
- إذا كانت بيانات تعريف الجلسة الحية محدودة، يستطيع `/status` استرجاع عدادات
  الرموز/ذاكرة التخزين المؤقت وتسمية نموذج وقت التشغيل النشط من أحدث إدخال لاستخدام النص المنسوخ.
  تبقى القيم الحية غير الصفرية الحالية ذات أولوية، ويمكن أن تتغلب إجماليات النص المنسوخ
  بحجم الموجه عندما تكون الإجماليات المخزنة مفقودة أو أصغر.

**تذييل تكلفة لكل رسالة**

- يضيف `/usage full` تذييل استخدام إلى كل رد، بما في ذلك **التكلفة المقدّرة**
  عندما يكون التسعير المحلي مهيأ للنموذج النشط وتكون بيانات تعريف الاستخدام
  متاحة.
- يعرض `/usage tokens` الرموز فقط؛ وتظل تدفقات OAuth/الرموز وCLI ذات نمط الاشتراك
  تعرض الرموز فقط ما لم يوفّر وقت التشغيل ذلك بيانات تعريف استخدام متوافقة
  وكان سعر محلي صريح مهيأ.
- ملاحظة Gemini CLI: يقرأ مخرج `stream-json` الافتراضي وتجاوزات JSON القديمة
  كلاهما الاستخدام من `stats`، ويحوّلان `stats.cached` إلى `cacheRead`،
  ويشتقان رموز الإدخال من `stats.input_tokens - stats.cached` عند الحاجة.

ملاحظة Anthropic: أخبرنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw
مسموح به مرة أخرى، لذلك تتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام
`claude -p` بوصفهما معتمدين لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
لا تزال Anthropic لا تكشف عن تقدير بالدولار لكل رسالة يمكن أن تعرضه OpenClaw
في `/usage full`.

**نوافذ استخدام CLI (حصص المزوّدين)**

- يعرض `openclaw status --usage` و`openclaw channels list` **نوافذ استخدام** المزوّدين
  (لقطات حصص، وليست تكاليف لكل رسالة).
- يتم توحيد المخرج البشري إلى `X% left` عبر المزوّدين.
- مزوّدو نوافذ الاستخدام الحاليون: Anthropic، GitHub Copilot، Gemini CLI،
  OpenAI Codex، MiniMax، Xiaomi، وz.ai.
- ملاحظة MiniMax: تعني الحقول الخام `usage_percent` / `usagePercent` الحصة المتبقية،
  لذلك تعكسها OpenClaw قبل العرض. تظل الحقول المعتمدة على العدّ ذات أولوية
  عند وجودها. إذا أعاد المزوّد `model_remains`، تفضّل OpenClaw إدخال نموذج الدردشة،
  وتشتق تسمية النافذة من الطوابع الزمنية عند الحاجة، وتدرج اسم النموذج في تسمية الخطة.
- تأتي مصادقة الاستخدام لتلك النوافذ من خطاطيف خاصة بالمزوّد عند توفرها؛ وإلا
  تعود OpenClaw إلى مطابقة بيانات اعتماد OAuth/API-key من ملفات تعريف المصادقة،
  أو البيئة، أو الإعدادات.

راجع [استخدام الرموز والتكاليف](/ar/reference/token-use) للاطلاع على التفاصيل والأمثلة.

## كيف يتم اكتشاف المفاتيح

يمكن لـ OpenClaw التقاط بيانات الاعتماد من:

- **ملفات تعريف المصادقة** (لكل وكيل، مخزنة في `auth-profiles.json`).
- **متغيرات البيئة** (مثل `OPENAI_API_KEY`، و`BRAVE_API_KEY`، و`FIRECRAWL_API_KEY`).
- **الإعدادات** (`models.providers.*.apiKey`، و`plugins.entries.*.config.webSearch.apiKey`،
  و`plugins.entries.firecrawl.config.webFetch.apiKey`، و`memorySearch.*`،
  و`talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) التي قد تصدّر المفاتيح إلى بيئة عملية Skills.

## الميزات التي يمكنها إنفاق المفاتيح

### 1) استجابات النموذج الأساسية (الدردشة + الأدوات)

يستخدم كل رد أو استدعاء أداة **مزوّد النموذج الحالي** (OpenAI، Anthropic، إلخ). هذا هو
المصدر الأساسي للاستخدام والتكلفة.

يشمل هذا أيضًا المزوّدين المستضافين بأسلوب الاشتراك الذين تظل فوترتهم خارج
واجهة OpenClaw المحلية، مثل **OpenAI Codex**، و**Alibaba Cloud Model Studio
Coding Plan**، و**MiniMax Coding Plan**، و**Z.AI / GLM Coding Plan**، ومسار
تسجيل دخول Claude في OpenClaw الخاص بـ Anthropic مع تمكين **Extra Usage**.

راجع [النماذج](/ar/providers/models) لإعداد التسعير و[استخدام الرموز والتكاليف](/ar/reference/token-use) للعرض.

### 2) فهم الوسائط (الصوت/الصورة/الفيديو)

يمكن تلخيص/نسخ الوسائط الواردة قبل تشغيل الرد. يستخدم هذا واجهات API للنماذج/المزوّدين.

- الصوت: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- الصورة: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- الفيديو: Google / Qwen / Moonshot.

راجع [فهم الوسائط](/ar/nodes/media-understanding).

### 3) توليد الصور والفيديو

يمكن لقدرات التوليد المشتركة أن تنفق مفاتيح المزوّدين أيضًا:

- توليد الصور: OpenAI / Google / DeepInfra / fal / MiniMax
- توليد الفيديو: DeepInfra / Qwen

يمكن لتوليد الصور استنتاج مزوّد افتراضي مدعوم بالمصادقة عندما يكون
`agents.defaults.imageGenerationModel` غير مضبوط. يتطلب توليد الفيديو حاليًا
`agents.defaults.videoGenerationModel` صريحًا مثل
`qwen/wan2.6-t2v`.

راجع [توليد الصور](/ar/tools/image-generation)، و[Qwen Cloud](/ar/providers/qwen)،
و[النماذج](/ar/concepts/models).

### 4) تضمينات الذاكرة + البحث الدلالي

يستخدم بحث الذاكرة الدلالي **واجهات API للتضمين** عند تهيئته لمزوّدين بعيدين:

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

قد يترتب على `web_search` رسوم استخدام حسب مزوّدك:

- **Brave Search API**: `BRAVE_API_KEY` أو `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` أو `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` أو `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` أو `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: ملف تعريف xAI OAuth، أو `XAI_API_KEY`، أو `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`، أو `MOONSHOT_API_KEY`، أو `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`، أو `MINIMAX_CODING_API_KEY`، أو `MINIMAX_API_KEY`، أو `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: بلا مفتاح لمضيف Ollama محلي قابل للوصول ومسجّل الدخول؛ يستخدم البحث المباشر عبر `https://ollama.com` المفتاح `OLLAMA_API_KEY`، ويمكن للمضيفين المحميين بالمصادقة إعادة استخدام مصادقة حامل Ollama العادية للمزوّد
- **Perplexity Search API**: `PERPLEXITY_API_KEY`، أو `OPENROUTER_API_KEY`، أو `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` أو `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: مزوّد بلا مفتاح عند اختياره صراحة (بلا فوترة API، لكنه غير رسمي ومعتمد على HTML)
- **SearXNG**: `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl` (بلا مفتاح/مستضاف ذاتيًا؛ بلا فوترة API مستضافة)

لا تزال مسارات المزوّد القديمة `tools.web.search.*` تُحمّل عبر طبقة التوافق المؤقتة، لكنها لم تعد سطح الإعدادات الموصى به.

**رصيد Brave Search المجاني:** تتضمن كل خطة Brave رصيدًا مجانيًا متجددًا قدره \$5/شهر.
تكلف خطة Search مقدار \$5 لكل 1,000 طلب، لذلك يغطي الرصيد
1,000 طلب/شهر بلا رسوم. اضبط حد الاستخدام في لوحة تحكم Brave
لتجنب الرسوم غير المتوقعة.

راجع [أدوات الويب](/ar/tools/web).

### 5) أداة جلب الويب (Firecrawl)

يمكن لـ `web_fetch` استدعاء **Firecrawl** مع وصول ابتدائي بلا مفتاح. أضف مفتاح API
لحدود أعلى:

- `FIRECRAWL_API_KEY` أو `plugins.entries.firecrawl.config.webFetch.apiKey`

إذا لم يكن Firecrawl مهيأ، فستعود الأداة إلى الجلب المباشر بالإضافة إلى المكوّن الإضافي المضمّن `web-readability` (بلا API مدفوعة). عطّل `plugins.entries.web-readability.enabled` لتخطي استخراج Readability المحلي.

راجع [أدوات الويب](/ar/tools/web).

### 6) لقطات استخدام المزوّد (الحالة/الصحة)

تستدعي بعض أوامر الحالة **نقاط نهاية استخدام المزوّد** لعرض نوافذ الحصص أو صحة المصادقة.
تكون هذه عادةً استدعاءات منخفضة الحجم لكنها لا تزال تصل إلى واجهات API للمزوّدين:

- `openclaw status --usage`
- `openclaw models status --json`

راجع [CLI النماذج](/ar/cli/models).

### 7) تلخيص حماية Compaction

يمكن لحماية Compaction تلخيص سجل الجلسة باستخدام **النموذج الحالي**، مما
يستدعي واجهات API للمزوّدين عند تشغيلها.

راجع [إدارة الجلسات + Compaction](/ar/reference/session-management-compaction).

### 8) فحص / اختبار النموذج

يمكن لـ `openclaw models scan` اختبار نماذج OpenRouter ويستخدم `OPENROUTER_API_KEY` عند
تمكين الاختبار.

راجع [CLI النماذج](/ar/cli/models).

### 9) التحدث (الكلام)

يمكن لوضع التحدث استدعاء **ElevenLabs** عند تهيئته:

- `ELEVENLABS_API_KEY` أو `talk.providers.elevenlabs.apiKey`

راجع [وضع التحدث](/ar/nodes/talk).

### 10) Skills (واجهات API لطرف ثالث)

يمكن لـ Skills تخزين `apiKey` في `skills.entries.<name>.apiKey`. إذا استخدمت Skill ذلك المفتاح لواجهات
API خارجية، فقد تترتب عليها تكاليف وفقًا لمزوّد Skill.

راجع [Skills](/ar/tools/skills).

## ذات صلة

- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [تخزين الموجهات مؤقتًا](/ar/reference/prompt-caching)
- [تتبع الاستخدام](/ar/concepts/usage-tracking)
