---
read_when:
    - می‌خواهید بدانید کدام ویژگی‌ها ممکن است APIهای پولی را فراخوانی کنند
    - باید کلیدها، هزینه‌ها و قابلیت مشاهدهٔ میزان استفاده را ممیزی کنید
    - در حال توضیح گزارش هزینهٔ /status یا /usage هستید
summary: ممیزی کنید که چه چیزهایی می‌توانند هزینه ایجاد کنند، کدام کلیدها استفاده می‌شوند، و چگونه مصرف را مشاهده کنید
title: استفاده از API و هزینه‌ها
x-i18n:
    generated_at: "2026-04-29T23:31:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5638007a77a93701ce4ed9139a6c4377c951e2d69941423c3e1b19b5bd52d5d5
    source_path: reference/api-usage-costs.md
    workflow: 16
---

# استفاده از API و هزینه‌ها

این سند **ویژگی‌هایی را که می‌توانند کلیدهای API را فراخوانی کنند** و محل نمایش هزینه‌های آن‌ها فهرست می‌کند. تمرکز آن بر ویژگی‌های OpenClaw است که می‌توانند مصرف ارائه‌دهنده یا فراخوانی‌های API پولی ایجاد کنند.

## محل نمایش هزینه‌ها (چت + CLI)

**نمای فوری هزینه هر نشست**

- `/status` مدل نشست فعلی، میزان استفاده از زمینه، و توکن‌های آخرین پاسخ را نشان می‌دهد.
- اگر مدل از **احراز هویت با کلید API** استفاده کند، `/status` همچنین **هزینه تخمینی** آخرین پاسخ را نشان می‌دهد.
- اگر فراداده زنده نشست کم‌جزئیات باشد، `/status` می‌تواند شمارنده‌های توکن/کش و برچسب مدل زمان اجرای فعال را از تازه‌ترین ورودی استفاده در رونوشت بازیابی کند. مقادیر زنده غیرصفر موجود همچنان اولویت دارند، و مجموع‌های رونوشت هم‌اندازه پرامپت می‌توانند وقتی مجموع‌های ذخیره‌شده وجود ندارند یا کوچک‌ترند، غالب شوند.

**پاورقی هزینه هر پیام**

- `/usage full` یک پاورقی استفاده به هر پاسخ اضافه می‌کند، شامل **هزینه تخمینی** (فقط برای کلید API).
- `/usage tokens` فقط توکن‌ها را نشان می‌دهد؛ جریان‌های OAuth/توکن و CLI به سبک اشتراک، هزینه دلاری را پنهان می‌کنند.
- نکته Gemini CLI: وقتی CLI خروجی JSON برمی‌گرداند، OpenClaw استفاده را از `stats` می‌خواند، `stats.cached` را به `cacheRead` نرمال می‌کند، و در صورت نیاز توکن‌های ورودی را از `stats.input_tokens - stats.cached` استخراج می‌کند.

نکته Anthropic: کارکنان Anthropic به ما گفتند استفاده از Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین OpenClaw استفاده مجدد از Claude CLI و استفاده از `claude -p` را برای این یکپارچه‌سازی مجاز می‌داند، مگر اینکه Anthropic سیاست جدیدی منتشر کند. Anthropic همچنان برآورد دلاری برای هر پیام که OpenClaw بتواند در `/usage full` نشان دهد ارائه نمی‌کند.

**پنجره‌های استفاده CLI (سهمیه‌های ارائه‌دهنده)**

- `openclaw status --usage` و `openclaw channels list` **پنجره‌های استفاده** ارائه‌دهنده را نشان می‌دهند (نمای فوری سهمیه، نه هزینه هر پیام).
- خروجی انسانی در همه ارائه‌دهندگان به `X% left` نرمال می‌شود.
- ارائه‌دهندگان فعلی پنجره استفاده: Anthropic، GitHub Copilot، Gemini CLI، OpenAI Codex، MiniMax، Xiaomi، و z.ai.
- نکته MiniMax: فیلدهای خام `usage_percent` / `usagePercent` آن به معنی سهمیه باقی‌مانده‌اند، بنابراین OpenClaw پیش از نمایش آن‌ها را وارونه می‌کند. فیلدهای مبتنی بر شمارش، وقتی موجود باشند، همچنان غالب می‌شوند. اگر ارائه‌دهنده `model_remains` برگرداند، OpenClaw ورودی مدل چت را ترجیح می‌دهد، در صورت نیاز برچسب پنجره را از زمان‌مهرها استخراج می‌کند، و نام مدل را در برچسب پلن می‌آورد.
- احراز هویت استفاده برای این پنجره‌های سهمیه، وقتی موجود باشد، از قلاب‌های مخصوص ارائه‌دهنده می‌آید؛ در غیر این صورت OpenClaw به اعتبارنامه‌های OAuth/کلید API مطابق از پروفایل‌های احراز هویت، env، یا پیکربندی برمی‌گردد.

برای جزئیات و نمونه‌ها، [استفاده از توکن و هزینه‌ها](/fa/reference/token-use) را ببینید.

## کلیدها چگونه کشف می‌شوند

OpenClaw می‌تواند اعتبارنامه‌ها را از این منابع بردارد:

- **پروفایل‌های احراز هویت** (برای هر عامل، ذخیره‌شده در `auth-profiles.json`).
- **متغیرهای محیطی** (مثلاً `OPENAI_API_KEY`، `BRAVE_API_KEY`، `FIRECRAWL_API_KEY`).
- **پیکربندی** (`models.providers.*.apiKey`، `plugins.entries.*.config.webSearch.apiKey`، `plugins.entries.firecrawl.config.webFetch.apiKey`، `memorySearch.*`، `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) که ممکن است کلیدها را به env فرایند مهارت صادر کنند.

## ویژگی‌هایی که می‌توانند کلیدها را خرج کنند

### 1) پاسخ‌های مدل هسته (چت + ابزارها)

هر پاسخ یا فراخوانی ابزار از **ارائه‌دهنده مدل فعلی** (OpenAI، Anthropic، و غیره) استفاده می‌کند. این منبع اصلی استفاده و هزینه است.

این همچنین شامل ارائه‌دهندگان میزبانی‌شده به سبک اشتراک می‌شود که همچنان خارج از رابط محلی OpenClaw صورت‌حساب می‌شوند، مانند **OpenAI Codex**، **Alibaba Cloud Model Studio Coding Plan**، **MiniMax Coding Plan**، **Z.AI / GLM Coding Plan**، و مسیر ورود Claude متعلق به Anthropic در OpenClaw با **Extra Usage** فعال.

برای پیکربندی قیمت‌گذاری، [مدل‌ها](/fa/providers/models) را ببینید و برای نمایش، [استفاده از توکن و هزینه‌ها](/fa/reference/token-use) را ببینید.

### 2) درک رسانه (صوت/تصویر/ویدیو)

رسانه ورودی می‌تواند پیش از اجرای پاسخ، خلاصه یا رونویسی شود. این از APIهای مدل/ارائه‌دهنده استفاده می‌کند.

- صوت: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- تصویر: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- ویدیو: Google / Qwen / Moonshot.

[درک رسانه](/fa/nodes/media-understanding) را ببینید.

### 3) تولید تصویر و ویدیو

قابلیت‌های تولید مشترک نیز می‌توانند کلیدهای ارائه‌دهنده را خرج کنند:

- تولید تصویر: OpenAI / Google / DeepInfra / fal / MiniMax
- تولید ویدیو: DeepInfra / Qwen

تولید تصویر می‌تواند وقتی `agents.defaults.imageGenerationModel` تنظیم نشده است، یک پیش‌فرض ارائه‌دهنده متکی بر احراز هویت را استنباط کند. تولید ویدیو در حال حاضر به یک `agents.defaults.videoGenerationModel` صریح مانند `qwen/wan2.6-t2v` نیاز دارد.

[تولید تصویر](/fa/tools/image-generation)، [Qwen Cloud](/fa/providers/qwen)، و [مدل‌ها](/fa/concepts/models) را ببینید.

### 4) جاسازی‌های حافظه + جست‌وجوی معنایی

جست‌وجوی معنایی حافظه وقتی برای ارائه‌دهندگان راه دور پیکربندی شود از **APIهای embedding** استفاده می‌کند:

- `memorySearch.provider = "openai"` → embeddingهای OpenAI
- `memorySearch.provider = "gemini"` → embeddingهای Gemini
- `memorySearch.provider = "voyage"` → embeddingهای Voyage
- `memorySearch.provider = "mistral"` → embeddingهای Mistral
- `memorySearch.provider = "deepinfra"` → embeddingهای DeepInfra
- `memorySearch.provider = "lmstudio"` → embeddingهای LM Studio (محلی/خودمیزبان)
- `memorySearch.provider = "ollama"` → embeddingهای Ollama (محلی/خودمیزبان؛ معمولاً بدون صورت‌حساب API میزبانی‌شده)
- بازگشت اختیاری به یک ارائه‌دهنده راه دور اگر embeddingهای محلی شکست بخورند

می‌توانید آن را با `memorySearch.provider = "local"` محلی نگه دارید (بدون استفاده از API).

[حافظه](/fa/concepts/memory) را ببینید.

### 5) ابزار جست‌وجوی وب

`web_search` بسته به ارائه‌دهنده شما ممکن است هزینه استفاده ایجاد کند:

- **Brave Search API**: `BRAVE_API_KEY` یا `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` یا `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` یا `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` یا `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` یا `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`، `MOONSHOT_API_KEY`، یا `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`، `MINIMAX_CODING_API_KEY`، `MINIMAX_API_KEY`، یا `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: بدون کلید برای یک میزبان محلی Ollama قابل دسترس و واردشده؛ جست‌وجوی مستقیم `https://ollama.com` از `OLLAMA_API_KEY` استفاده می‌کند، و میزبان‌های محافظت‌شده با احراز هویت می‌توانند از احراز هویت bearer معمول ارائه‌دهنده Ollama استفاده مجدد کنند
- **Perplexity Search API**: `PERPLEXITY_API_KEY`، `OPENROUTER_API_KEY`، یا `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` یا `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: بازگشت بدون کلید (بدون صورت‌حساب API، اما غیررسمی و مبتنی بر HTML)
- **SearXNG**: `SEARXNG_BASE_URL` یا `plugins.entries.searxng.config.webSearch.baseUrl` (بدون کلید/خودمیزبان؛ بدون صورت‌حساب API میزبانی‌شده)

مسیرهای قدیمی ارائه‌دهنده `tools.web.search.*` همچنان از طریق شیم سازگاری موقت بارگذاری می‌شوند، اما دیگر سطح پیکربندی پیشنهادی نیستند.

**اعتبار رایگان Brave Search:** هر پلن Brave شامل \$5 در ماه اعتبار رایگان تمدیدشونده است. پلن Search به ازای هر 1,000 درخواست \$5 هزینه دارد، بنابراین این اعتبار 1,000 درخواست در ماه را بدون هزینه پوشش می‌دهد. برای جلوگیری از هزینه‌های غیرمنتظره، سقف استفاده خود را در داشبورد Brave تنظیم کنید.

[ابزارهای وب](/fa/tools/web) را ببینید.

### 5) ابزار واکشی وب (Firecrawl)

`web_fetch` وقتی یک کلید API موجود باشد می‌تواند **Firecrawl** را فراخوانی کند:

- `FIRECRAWL_API_KEY` یا `plugins.entries.firecrawl.config.webFetch.apiKey`

اگر Firecrawl پیکربندی نشده باشد، ابزار به واکشی مستقیم به‌همراه Plugin همراه `web-readability` برمی‌گردد (بدون API پولی). برای رد کردن استخراج محلی Readability، `plugins.entries.web-readability.enabled` را غیرفعال کنید.

[ابزارهای وب](/fa/tools/web) را ببینید.

### 6) نمای فوری استفاده ارائه‌دهنده (وضعیت/سلامت)

برخی فرمان‌های وضعیت، **نقاط پایانی استفاده ارائه‌دهنده** را برای نمایش پنجره‌های سهمیه یا سلامت احراز هویت فراخوانی می‌کنند. این‌ها معمولاً فراخوانی‌های کم‌حجم هستند، اما همچنان به APIهای ارائه‌دهنده برخورد می‌کنند:

- `openclaw status --usage`
- `openclaw models status --json`

[CLI مدل‌ها](/fa/cli/models) را ببینید.

### 7) خلاصه‌سازی محافظ Compaction

محافظ Compaction می‌تواند تاریخچه نشست را با استفاده از **مدل فعلی** خلاصه کند، که هنگام اجرا APIهای ارائه‌دهنده را فراخوانی می‌کند.

[مدیریت نشست + Compaction](/fa/reference/session-management-compaction) را ببینید.

### 8) اسکن / آزمون مدل

`openclaw models scan` می‌تواند مدل‌های OpenRouter را probe کند و وقتی probe فعال باشد از `OPENROUTER_API_KEY` استفاده می‌کند.

[CLI مدل‌ها](/fa/cli/models) را ببینید.

### 9) گفتار (speech)

حالت گفتار می‌تواند وقتی پیکربندی شده باشد **ElevenLabs** را فراخوانی کند:

- `ELEVENLABS_API_KEY` یا `talk.providers.elevenlabs.apiKey`

[حالت گفتار](/fa/nodes/talk) را ببینید.

### 10) Skills (APIهای شخص ثالث)

Skills می‌تواند `apiKey` را در `skills.entries.<name>.apiKey` ذخیره کند. اگر یک skill از آن کلید برای APIهای خارجی استفاده کند، می‌تواند طبق ارائه‌دهنده آن skill هزینه ایجاد کند.

[Skills](/fa/tools/skills) را ببینید.

## مرتبط

- [استفاده از توکن و هزینه‌ها](/fa/reference/token-use)
- [کش کردن پرامپت](/fa/reference/prompt-caching)
- [ردیابی استفاده](/fa/concepts/usage-tracking)
