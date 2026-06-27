---
read_when:
    - می‌خواهید هزینه‌های توکن پرامپت را با حفظ کش کاهش دهید
    - در راه‌اندازی‌های چندعاملی به رفتار کش به‌ازای هر عامل نیاز دارید
    - شما در حال تنظیم هم‌زمان Heartbeat و پاک‌سازی cache-ttl هستید
summary: گزینه‌های تنظیم کش پرامپت، ترتیب ادغام، رفتار ارائه‌دهنده و الگوهای تنظیم دقیق
title: ذخیره‌سازی پرامپت در کش
x-i18n:
    generated_at: "2026-06-27T18:48:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68b4d0cb086603ebb12e4ce0edc892fb94efd09cb52faa9884b2f5ab0741585c
    source_path: reference/prompt-caching.md
    workflow: 16
---

حافظه‌گذاری prompt یعنی ارائه‌دهندهٔ مدل می‌تواند پیشوندهای بدون تغییر prompt را (معمولاً دستورالعمل‌های system/developer و سایر contextهای پایدار) در نوبت‌های مختلف دوباره استفاده کند، به‌جای اینکه هر بار آن‌ها را از نو پردازش کند. OpenClaw در جاهایی که API بالادستی این شمارنده‌ها را مستقیم ارائه می‌کند، مصرف ارائه‌دهنده را به `cacheRead` و `cacheWrite` نرمال‌سازی می‌کند.

سطح‌های وضعیت همچنین می‌توانند وقتی snapshot زندهٔ session این شمارنده‌ها را ندارد، شمارنده‌های cache را از جدیدترین لاگ مصرف transcript بازیابی کنند، تا `/status` بتواند پس از از دست رفتن بخشی از فرادادهٔ session همچنان خط cache را نشان دهد. مقادیر زندهٔ غیرصفر موجود cache همچنان بر مقادیر fallback transcript تقدم دارند.

چرایی اهمیت این موضوع: هزینهٔ token کمتر، پاسخ‌های سریع‌تر، و عملکرد قابل پیش‌بینی‌تر برای sessionهای طولانی‌مدت. بدون caching، promptهای تکراری در هر نوبت کل هزینهٔ prompt را پرداخت می‌کنند، حتی وقتی بیشتر ورودی تغییر نکرده باشد.

بخش‌های زیر همهٔ knobهای مرتبط با cache را که بر استفادهٔ مجدد از prompt و هزینهٔ token اثر می‌گذارند پوشش می‌دهند.

ارجاع‌های ارائه‌دهنده:

- حافظه‌گذاری prompt در Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- حافظه‌گذاری prompt در OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- headerهای API و شناسه‌های request در OpenAI: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- شناسه‌های request و خطاها در Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## knobهای اصلی

### `cacheRetention` (پیش‌فرض سراسری، مدل، و به‌ازای هر agent)

ماندگاری cache را به‌عنوان پیش‌فرض سراسری برای همهٔ مدل‌ها تنظیم کنید:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

بازنویسی به‌ازای هر مدل:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

بازنویسی به‌ازای هر agent:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

ترتیب ادغام config:

1. `agents.defaults.params` (پیش‌فرض سراسری — روی همهٔ مدل‌ها اعمال می‌شود)
2. `agents.defaults.models["provider/model"].params` (بازنویسی به‌ازای هر مدل)
3. `agents.list[].params` (شناسهٔ agent مطابق؛ بر اساس key بازنویسی می‌کند)

### `contextPruning.mode: "cache-ttl"`

context قدیمیِ نتیجهٔ tool را پس از پنجره‌های TTL cache هرس می‌کند تا requestهای پس از idle، history بیش‌ازحد بزرگ را دوباره cache نکنند.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

برای رفتار کامل، [هرس Session](/fa/concepts/session-pruning) را ببینید.

### گرم نگه داشتن با Heartbeat

Heartbeat می‌تواند پنجره‌های cache را گرم نگه دارد و cache writeهای تکراری پس از فاصله‌های idle را کاهش دهد.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat به‌ازای هر agent در `agents.list[].heartbeat` پشتیبانی می‌شود.

## رفتار ارائه‌دهنده

### Anthropic (API مستقیم)

- `cacheRetention` پشتیبانی می‌شود.
- با profileهای احراز هویت API key مربوط به Anthropic، OpenClaw وقتی تنظیم نشده باشد برای refهای مدل Anthropic مقدار `cacheRetention: "short"` را seed می‌کند.
- پاسخ‌های native Messages در Anthropic هم `cache_read_input_tokens` و هم `cache_creation_input_tokens` را ارائه می‌کنند، پس OpenClaw می‌تواند هم `cacheRead` و هم `cacheWrite` را نشان دهد.
- برای requestهای native Anthropic، مقدار `cacheRetention: "short"` به cache موقت پیش‌فرض 5 دقیقه‌ای map می‌شود، و `cacheRetention: "long"` فقط روی hostهای مستقیم `api.anthropic.com` به TTL یک‌ساعته ارتقا می‌یابد.

### OpenAI (API مستقیم)

- حافظه‌گذاری prompt روی مدل‌های جدید پشتیبانی‌شده خودکار است. OpenClaw نیازی به تزریق markerهای cache در سطح block ندارد.
- OpenClaw از `prompt_cache_key` استفاده می‌کند تا routing cache در نوبت‌های مختلف پایدار بماند. hostهای مستقیم OpenAI وقتی `cacheRetention: "long"` انتخاب شود از `prompt_cache_retention: "24h"` استفاده می‌کنند.
- ارائه‌دهندگان Completions سازگار با OpenAI فقط وقتی `prompt_cache_key` را دریافت می‌کنند که config مدل آن‌ها صراحتاً `compat.supportsPromptCacheKey: true` را تنظیم کرده باشد. ارسال long-retention یک قابلیت جداگانه است: مقدار صریح `cacheRetention: "long"` فقط وقتی همان ورودی compat از ماندگاری long cache هم پشتیبانی کند، `prompt_cache_retention: "24h"` را ارسال می‌کند. ارائه‌دهندگانی مثل Mistral می‌توانند cache keyها را فعال کنند و هم‌زمان با تنظیم `compat.supportsLongCacheRetention: false` فیلد long-retention را سرکوب کنند. `cacheRetention: "none"` هر دو فیلد را سرکوب می‌کند.
- پاسخ‌های OpenAI tokenهای prompt cache‌شده را از طریق `usage.prompt_tokens_details.cached_tokens` (یا `input_tokens_details.cached_tokens` در eventهای Responses API) ارائه می‌کنند. OpenClaw آن را به `cacheRead` map می‌کند.
- OpenAI شمارندهٔ جداگانهٔ token برای cache-write ارائه نمی‌کند، بنابراین `cacheWrite` در مسیرهای OpenAI حتی وقتی ارائه‌دهنده در حال گرم کردن cache است، `0` می‌ماند.
- OpenAI headerهای مفید برای tracing و rate-limit مانند `x-request-id`، `openai-processing-ms`، و `x-ratelimit-*` برمی‌گرداند، اما حسابداری cache-hit باید از payload مصرف بیاید، نه از headerها.
- در عمل، OpenAI اغلب شبیه cache پیشوند اولیه رفتار می‌کند، نه استفادهٔ مجدد full-history متحرک به سبک Anthropic. نوبت‌های متن با پیشوند بلند و پایدار در probeهای زندهٔ فعلی می‌توانند نزدیک plateau با `4864` cached-token قرار بگیرند، در حالی که transcriptهای tool-heavy یا MCP-style حتی در تکرارهای دقیق اغلب نزدیک `4608` cached token plateau می‌شوند.

### Anthropic Vertex

- مدل‌های Anthropic روی Vertex AI (`anthropic-vertex/*`) به همان شکل Anthropic مستقیم از `cacheRetention` پشتیبانی می‌کنند.
- `cacheRetention: "long"` روی endpointهای Vertex AI به TTL واقعی یک‌ساعتهٔ prompt-cache map می‌شود.
- ماندگاری cache پیش‌فرض برای `anthropic-vertex` با پیش‌فرض‌های Anthropic مستقیم یکسان است.
- requestهای Vertex از مسیر شکل‌دهی cache آگاه از boundary عبور داده می‌شوند تا استفادهٔ مجدد از cache با چیزی که ارائه‌دهنده‌ها واقعاً دریافت می‌کنند هم‌راستا بماند.

### Amazon Bedrock

- refهای مدل Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) از عبور صریح `cacheRetention` پشتیبانی می‌کنند.
- مدل‌های غیر Anthropic در Bedrock در زمان اجرا به `cacheRetention: "none"` مجبور می‌شوند.

### مدل‌های OpenRouter

برای refهای مدل `openrouter/anthropic/*`، OpenClaw روی blockهای prompt از نوع system/developer مقدار Anthropic `cache_control` را تزریق می‌کند تا استفادهٔ مجدد از prompt-cache را بهبود دهد، فقط وقتی request همچنان یک مسیر تأییدشدهٔ OpenRouter را هدف گرفته باشد (`openrouter` روی endpoint پیش‌فرض خودش، یا هر provider/base URL که به `openrouter.ai` resolve شود).

برای refهای مدل `openrouter/deepseek/*`، `openrouter/moonshot*/*`، و `openrouter/zai/*`، مقدار `contextPruning.mode: "cache-ttl"` مجاز است چون OpenRouter حافظه‌گذاری prompt سمت provider را به‌صورت خودکار مدیریت می‌کند. OpenClaw markerهای Anthropic `cache_control` را به آن requestها تزریق نمی‌کند.

ساخت cache در DeepSeek best-effort است و می‌تواند چند ثانیه طول بکشد. یک follow-up فوری ممکن است همچنان `cached_tokens: 0` را نشان دهد؛ با یک request تکراری با همان پیشوند پس از تأخیری کوتاه بررسی کنید و از `usage.prompt_tokens_details.cached_tokens` به‌عنوان سیگنال cache-hit استفاده کنید.

اگر مدل را به یک URL دلخواه proxy سازگار با OpenAI repoint کنید، OpenClaw تزریق markerهای cache Anthropic مخصوص OpenRouter را متوقف می‌کند.

### سایر ارائه‌دهندگان

اگر ارائه‌دهنده از این حالت cache پشتیبانی نکند، `cacheRetention` اثری ندارد.

### API مستقیم Google Gemini

- transport مستقیم Gemini (`api: "google-generative-ai"`) cache hitها را از طریق `cachedContentTokenCount` بالادستی گزارش می‌کند؛ OpenClaw آن را به `cacheRead` map می‌کند.
- وقتی `cacheRetention` روی یک مدل مستقیم Gemini تنظیم شود، OpenClaw به‌صورت خودکار resourceهای `cachedContents` را برای promptهای system در اجراهای Google AI Studio ایجاد، دوباره استفاده، و refresh می‌کند. این یعنی دیگر لازم نیست یک handle cached-content را دستی از قبل ایجاد کنید.
- همچنان می‌توانید یک handle cached-content موجود Gemini را به‌صورت `params.cachedContent` (یا legacy `params.cached_content`) روی مدل پیکربندی‌شده پاس دهید.
- این از حافظه‌گذاری prompt-prefix در Anthropic/OpenAI جداست. برای Gemini، OpenClaw یک resource بومی provider به نام `cachedContents` را مدیریت می‌کند، نه اینکه markerهای cache را در request تزریق کند.

### استفاده از Gemini CLI

- خروجی `stream-json` در Gemini CLI می‌تواند cache hitها را از طریق `stats.cached` نمایش دهد؛ OpenClaw آن را به `cacheRead` map می‌کند. بازنویسی‌های legacy `--output-format json` از همان نرمال‌سازی مصرف استفاده می‌کنند.
- اگر CLI مقدار مستقیم `stats.input` را حذف کند، OpenClaw tokenهای ورودی را از `stats.input_tokens - stats.cached` استخراج می‌کند.
- این فقط نرمال‌سازی مصرف است. به این معنا نیست که OpenClaw markerهای prompt-cache به سبک Anthropic/OpenAI را برای Gemini CLI ایجاد می‌کند.

## boundary cache برای system-prompt

OpenClaw، system prompt را به یک **پیشوند پایدار** و یک **پسوند volatile** تقسیم می‌کند که با یک boundary داخلی cache-prefix جدا شده‌اند. محتوای بالای boundary (تعریف‌های tool، فرادادهٔ Skills، فایل‌های workspace، و سایر contextهای نسبتاً ایستا) به‌گونه‌ای مرتب می‌شود که در نوبت‌های مختلف byte-identical بماند. محتوای پایین boundary (برای مثال `HEARTBEAT.md`، timestampهای runtime، و سایر فراداده‌های به‌ازای هر نوبت) مجاز است بدون باطل کردن پیشوند cache‌شده تغییر کند.

انتخاب‌های کلیدی طراحی:

- فایل‌های پایدار project-context در workspace پیش از `HEARTBEAT.md` مرتب می‌شوند تا churn مربوط به heartbeat پیشوند پایدار را bust نکند.
- boundary در شکل‌دهی transport خانوادهٔ Anthropic، خانوادهٔ OpenAI، Google، و CLI اعمال می‌شود تا همهٔ ارائه‌دهندگان پشتیبانی‌شده از همان پایداری پیشوند بهره ببرند.
- requestهای Codex Responses و Anthropic Vertex از مسیر شکل‌دهی cache آگاه از boundary عبور داده می‌شوند تا استفادهٔ مجدد از cache با چیزی که ارائه‌دهنده‌ها واقعاً دریافت می‌کنند هم‌راستا بماند.
- fingerprintهای system-prompt نرمال‌سازی می‌شوند (whitespace، پایان خط‌ها، context اضافه‌شده توسط hook، ترتیب capabilityهای runtime) تا promptهای بدون تغییر معنایی در نوبت‌های مختلف KV/cache مشترک داشته باشند.

اگر پس از تغییر config یا workspace جهش‌های غیرمنتظرهٔ `cacheWrite` می‌بینید، بررسی کنید که تغییر بالای boundary cache قرار می‌گیرد یا پایین آن. انتقال محتوای volatile به پایین boundary (یا پایدار کردن آن) اغلب مشکل را حل می‌کند.

## guardهای پایداری cache در OpenClaw

OpenClaw همچنین چند شکل payload حساس به cache را پیش از رسیدن request به ارائه‌دهنده deterministic نگه می‌دارد:

- catalogهای tool مربوط به Bundle MCP پیش از registration tool به‌صورت deterministic مرتب می‌شوند، تا تغییرات ترتیب `listTools()` باعث churn در block ابزارها و bust شدن پیشوندهای prompt-cache نشود.
- sessionهای legacy با blockهای image persisted، **3 نوبت تکمیل‌شدهٔ اخیر** را دست‌نخورده نگه می‌دارند؛ blockهای image قدیمی‌تر که قبلاً پردازش شده‌اند ممکن است با یک marker جایگزین شوند تا follow-upهای image-heavy مرتب payloadهای بزرگ و stale را دوباره ارسال نکنند.

## الگوهای تنظیم

### ترافیک ترکیبی (پیش‌فرض پیشنهادی)

یک baseline طولانی‌مدت را روی agent اصلی خود نگه دارید، caching را روی agentهای notifier پرنوسان غیرفعال کنید:

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

### baseline با اولویت هزینه

- مقدار baseline `cacheRetention: "short"` را تنظیم کنید.
- `contextPruning.mode: "cache-ttl"` را فعال کنید.
- heartbeat را پایین‌تر از TTL خود فقط برای agentهایی نگه دارید که از cache گرم سود می‌برند.

## تشخیص cache

OpenClaw تشخیص‌های اختصاصی cache-trace را برای اجراهای embedded agent ارائه می‌کند.

برای تشخیص‌های معمول کاربرمحور، `/status` و سایر summaryهای مصرف می‌توانند وقتی ورودی live session این شمارنده‌ها را ندارد، از جدیدترین ورودی مصرف transcript به‌عنوان منبع fallback برای `cacheRead` / `cacheWrite` استفاده کنند.

## تست‌های regression زنده

OpenClaw یک gate زندهٔ ترکیبی regression cache برای پیشوندهای تکراری، نوبت‌های tool، نوبت‌های image، transcriptهای tool به سبک MCP، و یک control بدون cache برای Anthropic نگه می‌دارد.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

gate زندهٔ محدود را با این دستور اجرا کنید:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

فایل baseline جدیدترین اعداد زندهٔ مشاهده‌شده به‌همراه کف‌های regression مخصوص هر provider را که test استفاده می‌کند ذخیره می‌کند.
runner همچنین از شناسه‌های session و namespaceهای prompt تازه به‌ازای هر اجرا استفاده می‌کند تا وضعیت cache قبلی نمونهٔ regression فعلی را آلوده نکند.

این آزمون‌ها عمداً از معیارهای موفقیت یکسان در همه‌ی ارائه‌دهنده‌ها استفاده نمی‌کنند.

### انتظارات زنده‌ی Anthropic

- انتظار نوشتن‌های گرم‌سازی صریح از طریق `cacheWrite` را داشته باشید.
- در نوبت‌های تکراری، انتظار استفاده‌ی مجدد از تقریباً کل تاریخچه را داشته باشید، چون کنترل کش Anthropic نقطه‌ی شکست کش را در طول گفتگو جلو می‌برد.
- ادعاهای زنده‌ی فعلی همچنان از آستانه‌های نرخ برخورد بالا برای مسیرهای پایدار، ابزار و تصویر استفاده می‌کنند.

### انتظارات زنده‌ی OpenAI

- فقط انتظار `cacheRead` را داشته باشید. `cacheWrite` روی `0` می‌ماند.
- استفاده‌ی مجدد از کش در نوبت‌های تکراری را به‌عنوان یک سکوی ثابت ویژه‌ی ارائه‌دهنده در نظر بگیرید، نه استفاده‌ی مجدد متحرک از کل تاریخچه به سبک Anthropic.
- ادعاهای زنده‌ی فعلی از بررسی‌های کف محافظه‌کارانه‌ای استفاده می‌کنند که از رفتار زنده‌ی مشاهده‌شده روی `gpt-5.4-mini` به دست آمده‌اند:
  - پیشوند پایدار: `cacheRead >= 4608`، نرخ برخورد `>= 0.90`
  - رونوشت ابزار: `cacheRead >= 4096`، نرخ برخورد `>= 0.85`
  - رونوشت تصویر: `cacheRead >= 3840`، نرخ برخورد `>= 0.82`
  - رونوشت به سبک MCP: `cacheRead >= 4096`، نرخ برخورد `>= 0.85`

راستی‌آزمایی زنده‌ی ترکیبی تازه در 2026-04-04 به این نتایج رسید:

- پیشوند پایدار: `cacheRead=4864`، نرخ برخورد `0.966`
- رونوشت ابزار: `cacheRead=4608`، نرخ برخورد `0.896`
- رونوشت تصویر: `cacheRead=4864`، نرخ برخورد `0.954`
- رونوشت به سبک MCP: `cacheRead=4608`، نرخ برخورد `0.891`

زمان دیواری محلی اخیر برای گیت ترکیبی حدود `88s` بود.

چرا ادعاها متفاوت‌اند:

- Anthropic نقاط شکست صریح کش و استفاده‌ی مجدد متحرک از تاریخچه‌ی گفتگو را ارائه می‌کند.
- کش پرامپت OpenAI همچنان به پیشوند دقیق حساس است، اما پیشوند قابل استفاده‌ی مجدد مؤثر در ترافیک زنده‌ی Responses می‌تواند زودتر از کل پرامپت به سکوی ثابت برسد.
- به همین دلیل، مقایسه‌ی Anthropic و OpenAI با یک آستانه‌ی درصدی واحد میان ارائه‌دهنده‌ها باعث ایجاد رگرسیون‌های کاذب می‌شود.

### پیکربندی `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

پیش‌فرض‌ها:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### تغییر وضعیت‌های Env (اشکال‌زدایی یک‌باره)

- `OPENCLAW_CACHE_TRACE=1` ردیابی کش را فعال می‌کند.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` مسیر خروجی را بازنویسی می‌کند.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` ضبط کامل بار پیام را تغییر وضعیت می‌دهد.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` ضبط متن پرامپت را تغییر وضعیت می‌دهد.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` ضبط پرامپت سیستم را تغییر وضعیت می‌دهد.

### چه چیزهایی را بررسی کنیم

- رویدادهای ردیابی کش JSONL هستند و شامل عکس‌های فوری مرحله‌ای مانند `session:loaded`، `prompt:before`، `stream:context` و `session:after` می‌شوند.
- اثر توکن کش در هر نوبت، در سطوح معمول استفاده از طریق `cacheRead` و `cacheWrite` قابل مشاهده است؛ برای مثال `/usage full` و خلاصه‌های استفاده‌ی نشست.
- برای Anthropic، وقتی کش فعال است، انتظار هر دو `cacheRead` و `cacheWrite` را داشته باشید.
- برای OpenAI، هنگام برخورد کش انتظار `cacheRead` را داشته باشید و انتظار داشته باشید `cacheWrite` روی `0` بماند؛ OpenAI فیلد توکن جداگانه‌ای برای نوشتن کش منتشر نمی‌کند.
- اگر به ردیابی درخواست نیاز دارید، شناسه‌های درخواست و سرآیندهای محدودیت نرخ را جدا از معیارهای کش ثبت کنید. خروجی فعلی ردیابی کش OpenClaw به‌جای سرآیندهای خام پاسخ ارائه‌دهنده، بر شکل پرامپت/نشست و استفاده‌ی نرمال‌شده از توکن تمرکز دارد.

## عیب‌یابی سریع

- `cacheWrite` بالا در بیشتر نوبت‌ها: ورودی‌های ناپایدار پرامپت سیستم را بررسی کنید و مطمئن شوید مدل/ارائه‌دهنده از تنظیمات کش شما پشتیبانی می‌کند.
- `cacheWrite` بالا در Anthropic: اغلب یعنی نقطه‌ی شکست کش روی محتوایی قرار می‌گیرد که در هر درخواست تغییر می‌کند.
- `cacheRead` پایین در OpenAI: مطمئن شوید پیشوند پایدار در ابتدا قرار دارد، پیشوند تکراری حداقل 1024 توکن است، و همان `prompt_cache_key` برای نوبت‌هایی که باید کش مشترک داشته باشند دوباره استفاده می‌شود.
- بی‌اثر بودن `cacheRetention`: تأیید کنید کلید مدل با `agents.defaults.models["provider/model"]` مطابقت دارد.
- درخواست‌های Bedrock Nova/Mistral با تنظیمات کش: اجبار زمان اجرا به `none` مورد انتظار است.

مستندات مرتبط:

- [Anthropic](/fa/providers/anthropic)
- [استفاده از توکن و هزینه‌ها](/fa/reference/token-use)
- [هرس نشست](/fa/concepts/session-pruning)
- [مرجع پیکربندی Gateway](/fa/gateway/configuration-reference)

## مرتبط

- [استفاده از توکن و هزینه‌ها](/fa/reference/token-use)
- [استفاده از API و هزینه‌ها](/fa/reference/api-usage-costs)
