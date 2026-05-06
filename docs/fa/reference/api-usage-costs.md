---
read_when:
    - می‌خواهید بدانید کدام قابلیت‌ها ممکن است APIهای پولی را فراخوانی کنند
    - لازم است کلیدها، هزینه‌ها و دیدپذیری مصرف را ممیزی کنید.
    - در حال توضیح گزارش‌دهی هزینهٔ /status یا /usage هستید
summary: ممیزی کنید چه مواردی می‌توانند هزینه‌زا باشند، کدام کلیدها استفاده می‌شوند و چگونه میزان استفاده را مشاهده کنید
title: استفاده از API و هزینه‌ها
x-i18n:
    generated_at: "2026-05-06T09:40:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8e6f9f8248ddb4241d00191aa231f1d72a2128a7995b4ed0ec0e18a7ed6dd69
    source_path: reference/api-usage-costs.md
    workflow: 16
---

این سند **ویژگی‌هایی را که می‌توانند کلیدهای API را فراخوانی کنند** و محل نمایش هزینه‌های آن‌ها فهرست می‌کند. تمرکز آن بر ویژگی‌های OpenClaw است که می‌توانند مصرف ارائه‌دهنده یا فراخوانی‌های API پولی ایجاد کنند.

## محل نمایش هزینه‌ها (گفت‌وگو + CLI)

**نمای فوری هزینه هر نشست**

- `/status` مدل نشست فعلی، میزان استفاده از زمینه، و توکن‌های آخرین پاسخ را نشان می‌دهد.
- اگر مدل از **احراز هویت با کلید API** استفاده کند، `/status` همچنین **هزینه تخمینی** آخرین پاسخ را نشان می‌دهد.
- اگر فراداده زنده نشست کم‌جزئیات باشد، `/status` می‌تواند شمارنده‌های توکن/کش و برچسب مدل زمان اجرای فعال را از جدیدترین ورودی استفاده در رونوشت بازیابی کند. مقدارهای زنده غیرصفر موجود همچنان اولویت دارند، و مجموع‌های رونوشت در اندازه پرامپت می‌توانند زمانی که مجموع‌های ذخیره‌شده وجود ندارند یا کوچک‌ترند، برنده شوند.

**پاورقی هزینه هر پیام**

- `/usage full` یک پاورقی استفاده را به هر پاسخ اضافه می‌کند، شامل **هزینه تخمینی** (فقط کلید API).
- `/usage tokens` فقط توکن‌ها را نشان می‌دهد؛ جریان‌های OAuth/توکن و CLI از نوع اشتراکی هزینه دلاری را پنهان می‌کنند.
- نکته Gemini CLI: وقتی CLI خروجی JSON برمی‌گرداند، OpenClaw استفاده را از `stats` می‌خواند، `stats.cached` را به `cacheRead` نرمال می‌کند، و در صورت نیاز توکن‌های ورودی را از `stats.input_tokens - stats.cached` به دست می‌آورد.

نکته Anthropic: کارکنان Anthropic به ما گفتند استفاده از Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین OpenClaw استفاده مجدد از Claude CLI و استفاده از `claude -p` را برای این یکپارچه‌سازی مجاز در نظر می‌گیرد مگر اینکه Anthropic سیاست تازه‌ای منتشر کند. Anthropic همچنان برآورد دلاری هر پیام را که OpenClaw بتواند در `/usage full` نشان دهد، ارائه نمی‌کند.

**پنجره‌های استفاده CLI (سهمیه‌های ارائه‌دهنده)**

- `openclaw status --usage` و `openclaw channels list` **پنجره‌های استفاده** ارائه‌دهنده را نشان می‌دهند (نمای فوری سهمیه، نه هزینه هر پیام).
- خروجی انسانی در همه ارائه‌دهنده‌ها به `X% left` نرمال می‌شود.
- ارائه‌دهنده‌های فعلی پنجره استفاده: Anthropic، GitHub Copilot، Gemini CLI، OpenAI Codex، MiniMax، Xiaomi، و z.ai.
- نکته MiniMax: فیلدهای خام `usage_percent` / `usagePercent` آن به معنای سهمیه باقی‌مانده هستند، بنابراین OpenClaw پیش از نمایش آن‌ها را معکوس می‌کند. فیلدهای مبتنی بر شمارش همچنان در صورت وجود اولویت دارند. اگر ارائه‌دهنده `model_remains` برگرداند، OpenClaw ورودی مدل گفت‌وگو را ترجیح می‌دهد، در صورت نیاز برچسب پنجره را از timestampها به دست می‌آورد، و نام مدل را در برچسب طرح می‌گنجاند.
- احراز هویت استفاده برای آن پنجره‌های سهمیه، در صورت موجود بودن، از hookهای اختصاصی ارائه‌دهنده می‌آید؛ در غیر این صورت OpenClaw به اعتبارنامه‌های OAuth/کلید API مطابق از پروفایل‌های احراز هویت، env، یا پیکربندی fallback می‌کند.

برای جزئیات و نمونه‌ها به [استفاده از توکن و هزینه‌ها](/fa/reference/token-use) مراجعه کنید.

## کلیدها چگونه کشف می‌شوند

OpenClaw می‌تواند اعتبارنامه‌ها را از این منابع دریافت کند:

- **پروفایل‌های احراز هویت** (برای هر عامل، ذخیره‌شده در `auth-profiles.json`).
- **متغیرهای محیطی** (مانند `OPENAI_API_KEY`، `BRAVE_API_KEY`، `FIRECRAWL_API_KEY`).
- **پیکربندی** (`models.providers.*.apiKey`، `plugins.entries.*.config.webSearch.apiKey`،
  `plugins.entries.firecrawl.config.webFetch.apiKey`، `memorySearch.*`،
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) که ممکن است کلیدها را به env فرایند skill صادر کنند.

## ویژگی‌هایی که می‌توانند کلیدها را مصرف کنند

### 1) پاسخ‌های مدل هسته (گفت‌وگو + ابزارها)

هر پاسخ یا فراخوانی ابزار از **ارائه‌دهنده مدل فعلی** استفاده می‌کند (OpenAI، Anthropic، و غیره). این منبع اصلی استفاده و هزینه است.

این شامل ارائه‌دهنده‌های میزبانی‌شده از نوع اشتراکی نیز می‌شود که همچنان خارج از UI محلی OpenClaw هزینه دریافت می‌کنند، مانند **OpenAI Codex**، **Alibaba Cloud Model Studio Coding Plan**، **MiniMax Coding Plan**، **Z.AI / GLM Coding Plan**، و مسیر ورود Claude متعلق به Anthropic در OpenClaw با فعال بودن **Extra Usage**.

برای پیکربندی قیمت‌گذاری به [مدل‌ها](/fa/providers/models) و برای نمایش به [استفاده از توکن و هزینه‌ها](/fa/reference/token-use) مراجعه کنید.

### 2) درک رسانه (صدا/تصویر/ویدئو)

رسانه ورودی می‌تواند پیش از اجرای پاسخ، خلاصه‌سازی/رونویسی شود. این کار از APIهای مدل/ارائه‌دهنده استفاده می‌کند.

- صدا: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- تصویر: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- ویدئو: Google / Qwen / Moonshot.

به [درک رسانه](/fa/nodes/media-understanding) مراجعه کنید.

### 3) تولید تصویر و ویدئو

قابلیت‌های تولید مشترک نیز می‌توانند کلیدهای ارائه‌دهنده را مصرف کنند:

- تولید تصویر: OpenAI / Google / DeepInfra / fal / MiniMax
- تولید ویدئو: DeepInfra / Qwen

تولید تصویر می‌تواند وقتی `agents.defaults.imageGenerationModel` تنظیم نشده است، یک پیش‌فرض ارائه‌دهنده متکی بر احراز هویت را استنباط کند. تولید ویدئو در حال حاضر به یک `agents.defaults.videoGenerationModel` صریح مانند `qwen/wan2.6-t2v` نیاز دارد.

به [تولید تصویر](/fa/tools/image-generation)، [Qwen Cloud](/fa/providers/qwen)، و [مدل‌ها](/fa/concepts/models) مراجعه کنید.

### 4) embeddingهای حافظه + جست‌وجوی معنایی

جست‌وجوی معنایی حافظه، وقتی برای ارائه‌دهنده‌های راه دور پیکربندی شده باشد، از **APIهای embedding** استفاده می‌کند:

- `memorySearch.provider = "openai"` → embeddingهای OpenAI
- `memorySearch.provider = "gemini"` → embeddingهای Gemini
- `memorySearch.provider = "voyage"` → embeddingهای Voyage
- `memorySearch.provider = "mistral"` → embeddingهای Mistral
- `memorySearch.provider = "deepinfra"` → embeddingهای DeepInfra
- `memorySearch.provider = "lmstudio"` → embeddingهای LM Studio (محلی/خودمیزبان)
- `memorySearch.provider = "ollama"` → embeddingهای Ollama (محلی/خودمیزبان؛ معمولاً بدون صورت‌حساب API میزبانی‌شده)
- fallback اختیاری به یک ارائه‌دهنده راه دور اگر embeddingهای محلی ناموفق باشند

می‌توانید آن را با `memorySearch.provider = "local"` محلی نگه دارید (بدون استفاده از API).

به [حافظه](/fa/concepts/memory) مراجعه کنید.

### 5) ابزار جست‌وجوی وب

`web_search` بسته به ارائه‌دهنده شما ممکن است هزینه استفاده ایجاد کند:

- **Brave Search API**: `BRAVE_API_KEY` یا `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` یا `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` یا `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` یا `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` یا `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`، `MOONSHOT_API_KEY`، یا `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`، `MINIMAX_CODING_API_KEY`، `MINIMAX_API_KEY`، یا `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: بدون کلید برای میزبان محلی Ollama که قابل دسترسی و واردشده باشد؛ جست‌وجوی مستقیم `https://ollama.com` از `OLLAMA_API_KEY` استفاده می‌کند، و میزبان‌های محافظت‌شده با احراز هویت می‌توانند احراز هویت bearer معمول ارائه‌دهنده Ollama را دوباره استفاده کنند
- **Perplexity Search API**: `PERPLEXITY_API_KEY`، `OPENROUTER_API_KEY`، یا `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` یا `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback بدون کلید (بدون صورت‌حساب API، اما غیررسمی و مبتنی بر HTML)
- **SearXNG**: `SEARXNG_BASE_URL` یا `plugins.entries.searxng.config.webSearch.baseUrl` (بدون کلید/خودمیزبان؛ بدون صورت‌حساب API میزبانی‌شده)

مسیرهای ارائه‌دهنده قدیمی `tools.web.search.*` همچنان از طریق shim سازگاری موقت بارگذاری می‌شوند، اما دیگر سطح پیکربندی توصیه‌شده نیستند.

**اعتبار رایگان Brave Search:** هر طرح Brave شامل \$5/ماه اعتبار رایگان تمدیدشونده است. طرح Search به ازای هر 1,000 درخواست \$5 هزینه دارد، بنابراین این اعتبار 1,000 درخواست در ماه را بدون هزینه پوشش می‌دهد. برای جلوگیری از هزینه‌های غیرمنتظره، سقف استفاده خود را در داشبورد Brave تنظیم کنید.

به [ابزارهای وب](/fa/tools/web) مراجعه کنید.

### 5) ابزار دریافت وب (Firecrawl)

`web_fetch` می‌تواند وقتی کلید API وجود دارد **Firecrawl** را فراخوانی کند:

- `FIRECRAWL_API_KEY` یا `plugins.entries.firecrawl.config.webFetch.apiKey`

اگر Firecrawl پیکربندی نشده باشد، ابزار به دریافت مستقیم به‌علاوه Plugin همراه `web-readability` fallback می‌کند (بدون API پولی). برای رد کردن استخراج محلی Readability، `plugins.entries.web-readability.enabled` را غیرفعال کنید.

به [ابزارهای وب](/fa/tools/web) مراجعه کنید.

### 6) نمای فوری استفاده ارائه‌دهنده (وضعیت/سلامت)

برخی فرمان‌های وضعیت برای نمایش پنجره‌های سهمیه یا سلامت احراز هویت، **endpointهای استفاده ارائه‌دهنده** را فراخوانی می‌کنند. این‌ها معمولاً فراخوانی‌های کم‌حجم هستند، اما همچنان به APIهای ارائه‌دهنده برخورد می‌کنند:

- `openclaw status --usage`
- `openclaw models status --json`

به [CLI مدل‌ها](/fa/cli/models) مراجعه کنید.

### 7) خلاصه‌سازی محافظ Compaction

محافظ Compaction می‌تواند تاریخچه نشست را با استفاده از **مدل فعلی** خلاصه کند، که هنگام اجرا APIهای ارائه‌دهنده را فراخوانی می‌کند.

به [مدیریت نشست + Compaction](/fa/reference/session-management-compaction) مراجعه کنید.

### 8) اسکن / probe مدل

`openclaw models scan` می‌تواند مدل‌های OpenRouter را probe کند و وقتی probing فعال باشد از `OPENROUTER_API_KEY` استفاده می‌کند.

به [CLI مدل‌ها](/fa/cli/models) مراجعه کنید.

### 9) گفتار (speech)

حالت گفتار می‌تواند وقتی پیکربندی شده باشد **ElevenLabs** را فراخوانی کند:

- `ELEVENLABS_API_KEY` یا `talk.providers.elevenlabs.apiKey`

به [حالت گفتار](/fa/nodes/talk) مراجعه کنید.

### 10) Skills (APIهای شخص ثالث)

Skills می‌توانند `apiKey` را در `skills.entries.<name>.apiKey` ذخیره کنند. اگر یک skill از آن کلید برای APIهای خارجی استفاده کند، ممکن است مطابق ارائه‌دهنده آن skill هزینه ایجاد کند.

به [Skills](/fa/tools/skills) مراجعه کنید.

## مرتبط

- [استفاده از توکن و هزینه‌ها](/fa/reference/token-use)
- [کش پرامپت](/fa/reference/prompt-caching)
- [ردیابی استفاده](/fa/concepts/usage-tracking)
