---
read_when:
    - می‌خواهید بدانید کدام ویژگی‌ها ممکن است APIهای پولی را فراخوانی کنند
    - باید کلیدها، هزینه‌ها و دیدپذیری استفاده را ممیزی کنید
    - دارید گزارش هزینهٔ /status یا /usage را توضیح می‌دهید
summary: حسابرسی کنید که چه چیزهایی می‌تواند هزینه ایجاد کند، کدام کلیدها استفاده می‌شوند، و چگونه مصرف را مشاهده کنید.
title: استفاده از API و هزینه‌ها
x-i18n:
    generated_at: "2026-06-27T18:47:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 473028747c3e8eab60667106d22616aa185f867d01238b856f4235faad957a9e
    source_path: reference/api-usage-costs.md
    workflow: 16
---

این سند **قابلیت‌هایی را که می‌توانند کلیدهای API را فراخوانی کنند** و محل نمایش هزینه‌های آن‌ها فهرست می‌کند. تمرکز آن بر قابلیت‌های OpenClaw است که می‌توانند مصرف ارائه‌دهنده یا فراخوانی‌های پولی API ایجاد کنند.

## هزینه‌ها کجا نمایش داده می‌شوند (چت + CLI)

**نمای لحظه‌ای هزینه به‌ازای هر نشست**

- `/status` مدل نشست فعلی، میزان استفاده از زمینه، و توکن‌های آخرین پاسخ را نشان می‌دهد.
- اگر OpenClaw فرادادهٔ مصرف و قیمت‌گذاری محلی برای مدل فعال داشته باشد،
  `/status` همچنین **هزینهٔ تخمینی** آخرین پاسخ را نشان می‌دهد. این می‌تواند شامل
  ارائه‌دهندگان غیرکلید-API با قیمت‌گذاری صریح، مانند مدل‌های Bedrock `aws-sdk`، هم باشد.
- اگر فرادادهٔ نشست زنده کم‌جزئیات باشد، `/status` می‌تواند شمارنده‌های توکن/کش
  و برچسب مدل زمان‌اجرای فعال را از تازه‌ترین ورودی مصرف رونوشت بازیابی کند. مقدارهای زندهٔ غیرصفر موجود همچنان اولویت دارند، و مجموع‌های رونوشت در اندازهٔ پرامپت می‌توانند وقتی مجموع‌های ذخیره‌شده وجود ندارند یا کوچک‌تر هستند برنده شوند.

**پانوشت هزینه به‌ازای هر پیام**

- `/usage full` یک پانوشت مصرف به هر پاسخ اضافه می‌کند، شامل **هزینهٔ تخمینی**
  وقتی قیمت‌گذاری محلی برای مدل فعال پیکربندی شده و فرادادهٔ مصرف در دسترس باشد.
- `/usage tokens` فقط توکن‌ها را نشان می‌دهد؛ جریان‌های OAuth/توکن و CLI به سبک اشتراک
  همچنان فقط توکن‌ها را نشان می‌دهند، مگر اینکه آن زمان‌اجرا فرادادهٔ مصرف سازگار ارائه کند
  و یک قیمت محلی صریح پیکربندی شده باشد.
- نکتهٔ Gemini CLI: خروجی پیش‌فرض `stream-json` و بازنویسی‌های JSON قدیمی
  هر دو مصرف را از `stats` می‌خوانند، `stats.cached` را به `cacheRead` نرمال می‌کنند، و
  در صورت نیاز توکن‌های ورودی را از `stats.input_tokens - stats.cached` مشتق می‌کنند.

نکتهٔ Anthropic: کارکنان Anthropic به ما گفتند مصرف Claude CLI به سبک OpenClaw
دوباره مجاز است، بنابراین OpenClaw استفادهٔ دوباره از Claude CLI و استفاده از `claude -p` را
برای این یکپارچه‌سازی مجاز تلقی می‌کند، مگر اینکه Anthropic سیاست تازه‌ای منتشر کند.
Anthropic همچنان برآورد دلاری به‌ازای هر پیام را که OpenClaw بتواند در
`/usage full` نشان دهد، ارائه نمی‌کند.

**پنجره‌های مصرف CLI (سهمیه‌های ارائه‌دهنده)**

- `openclaw status --usage` و `openclaw channels list` **پنجره‌های مصرف** ارائه‌دهنده را نشان می‌دهند
  (نمای لحظه‌ای سهمیه، نه هزینه‌های به‌ازای هر پیام).
- خروجی انسانی در میان ارائه‌دهندگان به قالب `X% left` نرمال می‌شود.
- ارائه‌دهندگان فعلی پنجرهٔ مصرف: Anthropic، GitHub Copilot، Gemini CLI،
  OpenAI Codex، MiniMax، Xiaomi، و z.ai.
- نکتهٔ MiniMax: فیلدهای خام `usage_percent` / `usagePercent` به معنی سهمیهٔ باقی‌مانده هستند،
  بنابراین OpenClaw پیش از نمایش آن‌ها را وارونه می‌کند. فیلدهای مبتنی بر شمارش، وقتی موجود باشند، همچنان برنده می‌شوند. اگر ارائه‌دهنده `model_remains` برگرداند، OpenClaw ورودی مدل چت را ترجیح می‌دهد، در صورت نیاز برچسب پنجره را از زمان‌مهرها مشتق می‌کند، و نام مدل را در برچسب طرح وارد می‌کند.
- احراز هویت مصرف برای آن پنجره‌های سهمیه، وقتی در دسترس باشد، از قلاب‌های مختص ارائه‌دهنده می‌آید؛ در غیر این صورت OpenClaw به تطبیق اعتبارنامه‌های OAuth/API-key از نمایه‌های احراز هویت، محیط، یا پیکربندی بازمی‌گردد.

برای جزئیات و نمونه‌ها، [مصرف توکن و هزینه‌ها](/fa/reference/token-use) را ببینید.

## کلیدها چگونه کشف می‌شوند

OpenClaw می‌تواند اعتبارنامه‌ها را از این منابع بردارد:

- **نمایه‌های احراز هویت** (به‌ازای هر عامل، ذخیره‌شده در `auth-profiles.json`).
- **متغیرهای محیطی** (مانند `OPENAI_API_KEY`، `BRAVE_API_KEY`، `FIRECRAWL_API_KEY`).
- **پیکربندی** (`models.providers.*.apiKey`، `plugins.entries.*.config.webSearch.apiKey`،
  `plugins.entries.firecrawl.config.webFetch.apiKey`، `memorySearch.*`،
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) که ممکن است کلیدها را به محیط فرایند مهارت صادر کنند.

## قابلیت‌هایی که می‌توانند کلیدها را مصرف کنند

### 1) پاسخ‌های مدل هسته (چت + ابزارها)

هر پاسخ یا فراخوانی ابزار از **ارائه‌دهندهٔ مدل فعلی** (OpenAI، Anthropic، و غیره) استفاده می‌کند. این
منبع اصلی مصرف و هزینه است.

این همچنین شامل ارائه‌دهندگان میزبانی‌شده به سبک اشتراک می‌شود که همچنان بیرون از
رابط کاربری محلی OpenClaw صورت‌حساب می‌شوند، مانند **OpenAI Codex**، **Alibaba Cloud Model Studio
Coding Plan**، **MiniMax Coding Plan**، **Z.AI / GLM Coding Plan**، و
مسیر ورود Claude متعلق به Anthropic در OpenClaw با **Extra Usage** فعال.

برای پیکربندی قیمت‌گذاری، [مدل‌ها](/fa/providers/models) و برای نمایش، [مصرف توکن و هزینه‌ها](/fa/reference/token-use) را ببینید.

### 2) درک رسانه (صوت/تصویر/ویدیو)

رسانهٔ ورودی می‌تواند پیش از اجرای پاسخ خلاصه/رونویسی شود. این از APIهای مدل/ارائه‌دهنده استفاده می‌کند.

- صوت: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- تصویر: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- ویدیو: Google / Qwen / Moonshot.

[درک رسانه](/fa/nodes/media-understanding) را ببینید.

### 3) تولید تصویر و ویدیو

قابلیت‌های تولید مشترک نیز می‌توانند کلیدهای ارائه‌دهنده را مصرف کنند:

- تولید تصویر: OpenAI / Google / DeepInfra / fal / MiniMax
- تولید ویدیو: DeepInfra / Qwen

تولید تصویر می‌تواند وقتی `agents.defaults.imageGenerationModel` تنظیم نشده است
یک پیش‌فرض ارائه‌دهندهٔ پشتیبانی‌شده با احراز هویت را استنتاج کند. تولید ویدیو در حال حاضر
به یک `agents.defaults.videoGenerationModel` صریح مانند
`qwen/wan2.6-t2v` نیاز دارد.

[تولید تصویر](/fa/tools/image-generation)، [Qwen Cloud](/fa/providers/qwen)،
و [مدل‌ها](/fa/concepts/models) را ببینید.

### 4) جاسازی‌های حافظه + جست‌وجوی معنایی

جست‌وجوی معنایی حافظه، وقتی برای ارائه‌دهندگان دوردست پیکربندی شده باشد، از **APIهای embedding** استفاده می‌کند:

- `memorySearch.provider = "openai"` → embeddingهای OpenAI
- `memorySearch.provider = "gemini"` → embeddingهای Gemini
- `memorySearch.provider = "voyage"` → embeddingهای Voyage
- `memorySearch.provider = "mistral"` → embeddingهای Mistral
- `memorySearch.provider = "deepinfra"` → embeddingهای DeepInfra
- `memorySearch.provider = "lmstudio"` → embeddingهای LM Studio (محلی/خودمیزبان)
- `memorySearch.provider = "ollama"` → embeddingهای Ollama (محلی/خودمیزبان؛ معمولاً بدون صورت‌حساب API میزبانی‌شده)
- بازگشت اختیاری به یک ارائه‌دهندهٔ دوردست اگر embeddingهای محلی شکست بخورند

می‌توانید با `memorySearch.provider = "local"` آن را محلی نگه دارید (بدون مصرف API).

[حافظه](/fa/concepts/memory) را ببینید.

### 5) ابزار جست‌وجوی وب

`web_search` بسته به ارائه‌دهندهٔ شما ممکن است هزینهٔ مصرف ایجاد کند:

- **Brave Search API**: `BRAVE_API_KEY` یا `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` یا `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` یا `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` یا `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: نمایهٔ OAuth متعلق به xAI، `XAI_API_KEY`، یا `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`، `MOONSHOT_API_KEY`، یا `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`، `MINIMAX_CODING_API_KEY`، `MINIMAX_API_KEY`، یا `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: بدون کلید برای یک میزبان محلی Ollama قابل‌دسترسی و واردشده؛ جست‌وجوی مستقیم `https://ollama.com` از `OLLAMA_API_KEY` استفاده می‌کند، و میزبان‌های محافظت‌شده با احراز هویت می‌توانند از احراز هویت bearer عادی ارائه‌دهندهٔ Ollama دوباره استفاده کنند
- **Perplexity Search API**: `PERPLEXITY_API_KEY`، `OPENROUTER_API_KEY`، یا `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` یا `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: ارائه‌دهندهٔ بدون کلید وقتی به‌طور صریح انتخاب شود (بدون صورت‌حساب API، اما غیررسمی و مبتنی بر HTML)
- **SearXNG**: `SEARXNG_BASE_URL` یا `plugins.entries.searxng.config.webSearch.baseUrl` (بدون کلید/خودمیزبان؛ بدون صورت‌حساب API میزبانی‌شده)

مسیرهای قدیمی ارائه‌دهندهٔ `tools.web.search.*` همچنان از طریق لایهٔ سازگاری موقت بارگذاری می‌شوند، اما دیگر سطح پیکربندی پیشنهادی نیستند.

**اعتبار رایگان Brave Search:** هر طرح Brave شامل \$5/ماه اعتبار رایگان تمدیدشونده است. طرح Search برای هر 1,000 درخواست \$5 هزینه دارد، بنابراین اعتبار 1,000 درخواست/ماه را بدون هزینه پوشش می‌دهد. برای جلوگیری از هزینه‌های غیرمنتظره، حد مصرف خود را در داشبورد Brave تنظیم کنید.

[ابزارهای وب](/fa/tools/web) را ببینید.

### 5) ابزار واکشی وب (Firecrawl)

`web_fetch` می‌تواند با دسترسی آغازین بدون کلید، **Firecrawl** را فراخوانی کند. برای محدودیت‌های بالاتر، یک کلید API اضافه کنید:

- `FIRECRAWL_API_KEY` یا `plugins.entries.firecrawl.config.webFetch.apiKey`

اگر Firecrawl پیکربندی نشده باشد، ابزار به واکشی مستقیم به‌همراه Plugin بسته‌بندی‌شدهٔ `web-readability` بازمی‌گردد (بدون API پولی). برای رد کردن استخراج Readability محلی، `plugins.entries.web-readability.enabled` را غیرفعال کنید.

[ابزارهای وب](/fa/tools/web) را ببینید.

### 6) نمای لحظه‌ای مصرف ارائه‌دهنده (وضعیت/سلامت)

برخی فرمان‌های وضعیت، **نقاط پایانی مصرف ارائه‌دهنده** را فراخوانی می‌کنند تا پنجره‌های سهمیه یا سلامت احراز هویت را نمایش دهند.
این‌ها معمولاً فراخوانی‌های کم‌حجم هستند، اما همچنان به APIهای ارائه‌دهنده برخورد می‌کنند:

- `openclaw status --usage`
- `openclaw models status --json`

[CLI مدل‌ها](/fa/cli/models) را ببینید.

### 7) خلاصه‌سازی محافظ Compaction

محافظ Compaction می‌تواند تاریخچهٔ نشست را با استفاده از **مدل فعلی** خلاصه کند، که
هنگام اجرا APIهای ارائه‌دهنده را فراخوانی می‌کند.

[مدیریت نشست + Compaction](/fa/reference/session-management-compaction) را ببینید.

### 8) اسکن / کاوش مدل

`openclaw models scan` می‌تواند مدل‌های OpenRouter را کاوش کند و وقتی
کاوش فعال باشد از `OPENROUTER_API_KEY` استفاده می‌کند.

[CLI مدل‌ها](/fa/cli/models) را ببینید.

### 9) گفت‌وگو (گفتار)

حالت گفت‌وگو می‌تواند وقتی پیکربندی شده باشد **ElevenLabs** را فراخوانی کند:

- `ELEVENLABS_API_KEY` یا `talk.providers.elevenlabs.apiKey`

[حالت گفت‌وگو](/fa/nodes/talk) را ببینید.

### 10) Skills (APIهای شخص ثالث)

Skills می‌توانند `apiKey` را در `skills.entries.<name>.apiKey` ذخیره کنند. اگر یک مهارت از آن کلید برای APIهای خارجی استفاده کند، می‌تواند مطابق ارائه‌دهندهٔ آن مهارت هزینه ایجاد کند.

[Skills](/fa/tools/skills) را ببینید.

## مرتبط

- [مصرف توکن و هزینه‌ها](/fa/reference/token-use)
- [کش‌کردن پرامپت](/fa/reference/prompt-caching)
- [رهگیری مصرف](/fa/concepts/usage-tracking)
