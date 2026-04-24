---
read_when:
    - تريد فهم الميزات التي قد تستدعي واجهات API مدفوعة /*<<<analysis to=final code  omitted reasoning  qq天天中彩票 0 ېدits>تريد فهم الميزات التي قد تستدعي واجهات API مدفوعة
    - تحتاج إلى تدقيق المفاتيح، والتكاليف، وإمكانية رؤية الاستخدام
    - أنت تشرح تقارير /status أو /usage الخاصة بالتكلفة والاستخدام
summary: دقّق ما الذي يمكنه إنفاق المال، والمفاتيح المستخدمة، وكيفية عرض الاستخدام
title: استخدام API والتكاليف
x-i18n:
    generated_at: "2026-04-24T08:02:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: d44b34a782a4090a074c49b91df3fa9733f13f16b3d39258b6cf57cf24043f43
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# استخدام API والتكاليف

تسرد هذه الوثيقة **الميزات التي يمكن أن تستدعي مفاتيح API** وأين تظهر تكاليفها. وهي تركز على
ميزات OpenClaw التي يمكن أن تولد استخدام مزوّد أو استدعاءات API مدفوعة.

## أين تظهر التكاليف (الدردشة + CLI)

**لقطة تكلفة لكل جلسة**

- يعرض `/status` نموذج الجلسة الحالي، واستخدام السياق، ورموز آخر استجابة.
- إذا كان النموذج يستخدم **مصادقة مفتاح API**، فإن `/status` يعرض أيضًا **التكلفة التقديرية** للرد الأخير.
- إذا كانت بيانات الجلسة الحية الوصفية قليلة، يمكن لـ `/status` استعادة
  عدادات الرموز/التخزين المؤقت ووسم نموذج وقت التشغيل النشط من أحدث إدخال
  لاستخدام النص المفرغ. وما تزال القيم الحية غير الصفرية الموجودة مسبقًا تحظى بالأولوية، ويمكن أن تفوز إجماليات النص المفرغ ذات حجم المطالبة عندما تكون الإجماليات المخزنة مفقودة أو أصغر.

**تذييل تكلفة لكل رسالة**

- يضيف `/usage full` تذييل استخدام إلى كل رد، بما في ذلك **التكلفة التقديرية** (لمفتاح API فقط).
- يعرض `/usage tokens` الرموز فقط؛ أما تدفقات OAuth/الرموز على نمط الاشتراك وCLI فتخفي تكلفة الدولار.
- ملاحظة Gemini CLI: عندما يعيد CLI مخرجات JSON, يقرأ OpenClaw الاستخدام من
  `stats`، ويطبّع `stats.cached` إلى `cacheRead`، ويشتق رموز الإدخال من
  `stats.input_tokens - stats.cached` عند الحاجة.

ملاحظة Anthropic: أخبرنا فريق Anthropic أن استخدام Claude CLI على نمط OpenClaw
مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام
`claude -p` على أنهما مسموحان لهذه التكاملات ما لم تنشر Anthropic
سياسة جديدة.
وما تزال Anthropic لا تكشف عن تقدير تكلفة بالدولار لكل رسالة يمكن لـ OpenClaw
عرضه في `/usage full`.

**نوافذ استخدام CLI ‏(حصص المزوّد)**

- يعرض `openclaw status --usage` و`openclaw channels list` **نوافذ استخدام**
  المزوّد (لقطات الحصة، وليست تكاليف كل رسالة).
- يتم تطبيع المخرجات البشرية إلى `X% left` عبر جميع المزوّدين.
- مزوّدو نافذة الاستخدام الحاليون: Anthropic، وGitHub Copilot، وGemini CLI،
  وOpenAI Codex، وMiniMax، وXiaomi، وz.ai.
- ملاحظة MiniMax: تعني حقولها الخام `usage_percent` / `usagePercent` الحصة المتبقية،
  لذا يعكسها OpenClaw قبل العرض. وما تزال الحقول المعتمدة على العدد تفوز
  عند وجودها. وإذا أعاد المزوّد `model_remains`، فإن OpenClaw يفضّل
  إدخال نموذج الدردشة، ويشتق تسمية النافذة من الطوابع الزمنية عند الحاجة، و
  يضمّن اسم النموذج في تسمية الخطة.
- تأتي مصادقة الاستخدام لتلك النوافذ من خطافات خاصة بالمزوّد عند
  توفرها؛ وإلا يعود OpenClaw إلى مطابقة بيانات اعتماد OAuth/API-key
  من ملفات تعريف المصادقة، أو البيئة، أو الإعدادات.

راجع [استخدام الرموز والتكاليف](/ar/reference/token-use) للاطلاع على التفاصيل والأمثلة.

## كيف يتم اكتشاف المفاتيح

يمكن لـ OpenClaw التقاط بيانات الاعتماد من:

- **ملفات تعريف المصادقة** (لكل وكيل، ومخزنة في `auth-profiles.json`).
- **متغيرات البيئة** (مثل `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **الإعدادات** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** ‏(`skills.entries.<name>.apiKey`) التي قد تصدّر المفاتيح إلى بيئة عملية Skill.

## الميزات التي يمكن أن تنفق المفاتيح

### 1) استجابات النماذج الأساسية (الدردشة + الأدوات)

يستخدم كل رد أو استدعاء أداة **مزوّد النموذج الحالي** (OpenAI، Anthropic، إلخ). وهذا هو
المصدر الأساسي للاستخدام والتكلفة.

ويشمل ذلك أيضًا المزوّدين المستضافين على نمط الاشتراك الذين ما زالوا يفوترون خارج
واجهة OpenClaw المحلية، مثل **OpenAI Codex**، و**Alibaba Cloud Model Studio
Coding Plan**، و**MiniMax Coding Plan**، و**Z.AI / GLM Coding Plan**، و
مسار Claude-login في OpenClaw الخاص بـ Anthropic مع **Extra Usage** مفعّلًا.

راجع [النماذج](/ar/providers/models) لإعدادات التسعير و[استخدام الرموز والتكاليف](/ar/reference/token-use) للعرض.

### 2) فهم الوسائط (الصوت/الصورة/الفيديو)

يمكن تلخيص الوسائط الواردة أو نسخها قبل تشغيل الرد. ويستخدم هذا واجهات API للنماذج/المزوّدين.

- الصوت: OpenAI / Groq / Deepgram / Google / Mistral.
- الصورة: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- الفيديو: Google / Qwen / Moonshot.

راجع [فهم الوسائط](/ar/nodes/media-understanding).

### 3) توليد الصور والفيديو

يمكن لإمكانات التوليد المشتركة أيضًا أن تنفق مفاتيح المزوّد:

- توليد الصور: OpenAI / Google / fal / MiniMax
- توليد الفيديو: Qwen

يمكن لتوليد الصور استنتاج مزوّد افتراضي مدعوم بالمصادقة عندما
تكون `agents.defaults.imageGenerationModel` غير مضبوطة. أما توليد الفيديو فيتطلب حاليًا
ضبطًا صريحًا لـ `agents.defaults.videoGenerationModel` مثل
`qwen/wan2.6-t2v`.

راجع [توليد الصور](/ar/tools/image-generation)، و[Qwen Cloud](/ar/providers/qwen)،
و[النماذج](/ar/concepts/models).

### 4) embeddings الخاصة بالذاكرة + البحث الدلالي

يستخدم البحث الدلالي في الذاكرة **واجهات embeddings API** عندما يكون مضبوطًا لمزوّدين بعيدين:

- `memorySearch.provider = "openai"` → ‏OpenAI embeddings
- `memorySearch.provider = "gemini"` → ‏Gemini embeddings
- `memorySearch.provider = "voyage"` → ‏Voyage embeddings
- `memorySearch.provider = "mistral"` → ‏Mistral embeddings
- `memorySearch.provider = "lmstudio"` → ‏LM Studio embeddings ‏(محلي/مستضاف ذاتيًا)
- `memorySearch.provider = "ollama"` → ‏Ollama embeddings ‏(محلي/مستضاف ذاتيًا؛ عادةً من دون فوترة API مستضافة)
- رجوع اختياري إلى مزوّد بعيد إذا فشلت embeddings المحلية

يمكنك إبقاء الأمر محليًا باستخدام `memorySearch.provider = "local"` ‏(من دون استخدام API).

راجع [الذاكرة](/ar/concepts/memory).

### 5) أداة البحث في الويب

قد تتسبب `web_search` في رسوم استخدام بحسب مزوّدك:

- **Brave Search API**: ‏`BRAVE_API_KEY` أو `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: ‏`EXA_API_KEY` أو `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: ‏`FIRECRAWL_API_KEY` أو `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: ‏`GEMINI_API_KEY` أو `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: ‏`XAI_API_KEY` أو `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: ‏`KIMI_API_KEY`, `MOONSHOT_API_KEY`, أو `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: ‏`MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`, أو `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: من دون مفتاح افتراضيًا، لكنه يتطلب مضيف Ollama قابلًا للوصول بالإضافة إلى `ollama signin`؛ ويمكنه أيضًا إعادة استخدام مصادقة bearer الخاصة بمزوّد Ollama العادي عندما يتطلب المضيف ذلك
- **Perplexity Search API**: ‏`PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, أو `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: ‏`TAVILY_API_KEY` أو `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: رجوع من دون مفتاح (من دون فوترة API، لكنه غير رسمي ويعتمد على HTML)
- **SearXNG**: ‏`SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl` ‏(من دون مفتاح/مستضاف ذاتيًا؛ من دون فوترة API مستضافة)

ما تزال مسارات المزوّد القديمة `tools.web.search.*` تُحمّل عبر طبقة التوافق المؤقتة، لكنها لم تعد سطح الإعداد الموصى به.

**الرصيد المجاني لـ Brave Search:** تتضمن كل خطة Brave رصيدًا مجانيًا متجددًا
بقيمة \$5/شهر. وتبلغ تكلفة خطة Search مقدار \$5 لكل 1,000 طلب، لذلك يغطي هذا الرصيد
1,000 طلب/شهر من دون رسوم. اضبط حد الاستخدام في لوحة Brave
لتجنب الرسوم غير المتوقعة.

راجع [أدوات الويب](/ar/tools/web).

### 5) أداة جلب الويب (Firecrawl)

يمكن لـ `web_fetch` استدعاء **Firecrawl** عند وجود مفتاح API:

- `FIRECRAWL_API_KEY` أو `plugins.entries.firecrawl.config.webFetch.apiKey`

إذا لم يتم إعداد Firecrawl، فستعود الأداة إلى الجلب المباشر + readability ‏(من دون API مدفوعة).

راجع [أدوات الويب](/ar/tools/web).

### 6) لقطات استخدام المزوّد (status/health)

تستدعي بعض أوامر الحالة **نقاط نهاية استخدام المزوّد** لعرض نوافذ الحصة أو سلامة المصادقة.
وعادةً ما تكون هذه استدعاءات منخفضة الحجم لكنها ما تزال تصيب APIs المزوّد:

- `openclaw status --usage`
- `openclaw models status --json`

راجع [CLI الخاص بالنماذج](/ar/cli/models).

### 7) تلخيص حارس Compaction

يمكن لحارس Compaction تلخيص سجل الجلسة باستخدام **النموذج الحالي**، مما
يستدعي APIs المزوّد عند تشغيله.

راجع [إدارة الجلسات + Compaction](/ar/reference/session-management-compaction).

### 8) فحص / probe النماذج

يمكن لـ `openclaw models scan` فحص نماذج OpenRouter ويستخدم `OPENROUTER_API_KEY` عندما
يكون الفحص مفعّلًا.

راجع [CLI الخاص بالنماذج](/ar/cli/models).

### 9) Talk ‏(الكلام)

يمكن لوضع Talk استدعاء **ElevenLabs** عند إعداده:

- `ELEVENLABS_API_KEY` أو `talk.providers.elevenlabs.apiKey`

راجع [وضع Talk](/ar/nodes/talk).

### 10) Skills ‏(واجهات API لجهات خارجية)

يمكن لـ Skills تخزين `apiKey` في `skills.entries.<name>.apiKey`. وإذا استخدمت Skill هذا المفتاح من أجل
واجهات API خارجية، فقد تتسبب في تكاليف وفقًا لمزوّد Skill.

راجع [Skills](/ar/tools/skills).

## ذو صلة

- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [التخزين المؤقت للمطالبة](/ar/reference/prompt-caching)
- [تتبع الاستخدام](/ar/concepts/usage-tracking)
