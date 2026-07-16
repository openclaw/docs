---
read_when:
    - می‌خواهید با حفظ کش، هزینهٔ توکن‌های پرامپت را کاهش دهید
    - در راه‌اندازی‌های چندعاملی به رفتار کش مختص هر عامل نیاز دارید
    - شما در حال تنظیم هم‌زمان Heartbeat و پاک‌سازی cache-ttl هستید
summary: گزینه‌های تنظیم کش پرامپت، ترتیب ادغام، رفتار ارائه‌دهنده و الگوهای بهینه‌سازی
title: کش‌کردن پرامپت
x-i18n:
    generated_at: "2026-07-16T17:42:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59a5aefc4d4139c31461b81f164b9efa9a4c1c48d03146049cf447b9dfd6ea99
    source_path: reference/prompt-caching.md
    workflow: 16
---

کش‌کردن پرامپت به ارائه‌دهندهٔ مدل امکان می‌دهد پیشوند بدون‌تغییر پرامپت (دستورالعمل‌های system/developer، تعریف ابزارها و سایر زمینه‌های پایدار) را در چند نوبت دوباره استفاده کند، به‌جای آنکه در هر درخواست آن را مجدداً پردازش کند. این کار هزینهٔ توکن و تأخیر را در نشست‌های طولانی با زمینهٔ تکراری کاهش می‌دهد.

OpenClaw در هر جایی که API بالادستی این شمارنده‌ها را ارائه دهد، میزان استفادهٔ ارائه‌دهنده را به `cacheRead` و `cacheWrite` نرمال‌سازی می‌کند. خلاصه‌های استفاده (`/status` و موارد مشابه) وقتی تصویر لحظه‌ای نشست زنده فاقد شمارنده‌های کش باشد، به آخرین ورودی استفاده در رونوشت بازمی‌گردند؛ مقدار زندهٔ غیرصفر همیشه بر مقدار جایگزین اولویت دارد.

مراجع ارائه‌دهندگان:

- [کش‌کردن پرامپت Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [کش‌کردن پرامپت OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## تنظیمات اصلی

### `cacheRetention`

مقادیر: `"none" | "short" | "long"`. به‌عنوان پیش‌فرض سراسری، برای هر مدل و برای هر عامل قابل پیکربندی است.
`"standard"` نام مستعار نیست؛ برای پنجرهٔ کش پیش‌فرض ارائه‌دهنده از `"short"` استفاده کنید. مقادیر نامعتبر نادیده گرفته می‌شوند و هشداری نمایش داده می‌شود.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # پیش‌فرض سراسری را برای این مدل بازنویسی می‌کند
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # هر دو پیش‌فرض را برای این عامل بازنویسی می‌کند
```

ترتیب ادغام (مورد بعدی اولویت دارد):

1. `agents.defaults.params` - پیش‌فرض سراسری برای همهٔ مدل‌ها
2. `agents.defaults.models["provider/model"].params` - بازنویسی مختص هر مدل
3. `agents.list[].params` - بازنویسی مختص هر عامل که با شناسهٔ عامل تطبیق داده می‌شود

منبع: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

پس از پایان پنجرهٔ TTL کش، زمینهٔ قدیمی نتایج ابزار را هرس می‌کند تا درخواست پس از دورهٔ بیکاری، تاریخچهٔ بیش‌ازحد بزرگ را دوباره کش نکند.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

برای رفتار کامل، [هرس نشست](/fa/concepts/session-pruning) را ببینید.

### گرم نگه‌داشتن با Heartbeat

Heartbeat می‌تواند پنجره‌های کش را گرم نگه دارد و نوشتن‌های مکرر کش را پس از فاصله‌های بیکاری کاهش دهد. به‌صورت سراسری (`agents.defaults.heartbeat`) یا برای هر عامل (`agents.list[].heartbeat`) قابل پیکربندی است.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## رفتار ارائه‌دهندگان

### Anthropic ‏(API مستقیم و Vertex AI)

- `cacheRetention` برای ارائه‌دهندگان `anthropic` و `anthropic-vertex`، و برای مدل‌های Claude روی `amazon-bedrock` و نقاط پایانی سفارشی سازگار با `anthropic-messages` در صورت تنظیم صریح `cacheRetention` پشتیبانی می‌شود.
- وقتی تنظیم نشده باشد، OpenClaw برای Anthropic مستقیم، `cacheRetention: "short"` را مقداردهی اولیه می‌کند (فقط ارائه‌دهندگان `anthropic` و `anthropic-vertex`؛ سایر مسیرهای خانوادهٔ Anthropic به مقدار صریح نیاز دارند).
- پاسخ‌های بومی Anthropic Messages، ‏`cache_read_input_tokens` و `cache_creation_input_tokens` را ارائه می‌کنند که به `cacheRead` و `cacheWrite` نگاشت می‌شوند.
- `cacheRetention: "short"` به کش موقت پیش‌فرض 5 دقیقه‌ای نگاشت می‌شود. در صورت تنظیم صریح، `cacheRetention: "long"` ‏TTL یک‌ساعته (`cache_control: { type: "ephemeral", ttl: "1h" }`) را درخواست می‌کند. نگه‌داری طولانی ضمنی یا مبتنی بر متغیر محیطی (`OPENCLAW_CACHE_RETENTION=long` بدون `cacheRetention` صریح) فقط روی میزبان‌های `api.anthropic.com` یا Vertex AI ‏(`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`) به TTL یک‌ساعته ارتقا می‌یابد؛ سایر میزبان‌ها کش 5 دقیقه‌ای را حفظ می‌کنند.

منبع: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`، `isLongTtlEligibleEndpoint`).

### OpenAI ‏(API مستقیم)

- کش‌کردن پرامپت در مدل‌های جدیدِ پشتیبانی‌شده خودکار است؛ OpenClaw نشانگرهای کش در سطح بلوک تزریق نمی‌کند.
- OpenClaw برای پایدار نگه‌داشتن مسیریابی کش در نوبت‌ها، `prompt_cache_key` را ارسال می‌کند. میزبان‌های مستقیم `api.openai.com` آن را به‌طور خودکار دریافت می‌کنند. پراکسی‌های سازگار با OpenAI ‏(oMLX، llama.cpp و نقاط پایانی سفارشی) برای فعال‌سازی به `compat.supportsPromptCacheKey: true` در پیکربندی مدل نیاز دارند؛ این مورد هرگز برای پراکسی به‌صورت خودکار تشخیص داده نمی‌شود.
- `prompt_cache_retention: "24h"` فقط زمانی افزوده می‌شود که `cacheRetention: "long"` انتخاب شده باشد و نقطهٔ پایانی نهایی هم از کلید کش و هم از نگه‌داری طولانی پشتیبانی کند (`compat.supportsLongCacheRetention` که به‌طور پیش‌فرض true است؛ پروفایل‌های سازگاری Together AI و Cloudflare آن را غیرفعال می‌کنند). `cacheRetention: "none"` هر دو فیلد را حذف می‌کند.
- اصابت‌های کش از طریق `usage.prompt_tokens_details.cached_tokens` ‏(Chat Completions) یا `input_tokens_details.cached_tokens` ‏(Responses API) نمایان و به `cacheRead` نگاشت می‌شوند.
- بارهای Responses API می‌توانند `input_tokens_details.cache_write_tokens` را نیز ارائه دهند که به `cacheWrite` نگاشت می‌شود و با نرخ نوشتن کش مدل قیمت‌گذاری می‌شود؛ در بارهای Responses که این فیلد را ندارند، `cacheWrite` روی `0` باقی می‌ماند. API ‏Chat Completions در OpenAI شمارندهٔ `cache_write_tokens` را مستند یا منتشر نمی‌کند، اما OpenClaw همچنان `prompt_tokens_details.cache_write_tokens` را در آنجا برای پراکسی‌های سازگار با OpenRouter و مشابه DeepSeek که شمارش نوشتن جداگانه‌ای گزارش می‌کنند، می‌خواند.
- در عمل، OpenAI بیشتر شبیه کشِ پیشوند اولیه رفتار می‌کند تا استفادهٔ مجدد از کل تاریخچهٔ متحرک در Anthropic؛ [انتظارات زندهٔ OpenAI](#openai-live-expectations) را در ادامه ببینید.

### Amazon Bedrock

- ارجاع‌های مدل Anthropic Claude ‏(`amazon-bedrock/*anthropic.claude*`، به‌علاوهٔ پیشوندهای پروفایل استنتاج سیستمی AWS یعنی `us.`/`eu.`/`global.anthropic.claude*`) از عبور مستقیم و صریح `cacheRetention` پشتیبانی می‌کنند.
- مدل‌های غیر Anthropic در Bedrock (برای مثال `amazon.nova-*`) در زمان اجرا، صرف‌نظر از هر مقدار پیکربندی‌شدهٔ `cacheRetention`، بدون نگه‌داری کش حل می‌شوند.
- ARNهای مبهم پروفایل استنتاج برنامه در Bedrock (شناسه‌های پروفایلی که شامل `claude` نیستند) نیز بدون نگه‌داری کش حل می‌شوند، مگر اینکه `cacheRetention` صریحاً تنظیم شده باشد؛ زیرا خانوادهٔ مدل را نمی‌توان فقط از ARN استنتاج کرد.

### OpenRouter

برای ارجاع‌های مدل `openrouter/anthropic/*`، ‏OpenClaw نشانگرهای `cache_control` مربوط به Anthropic را در بلوک‌های پرامپت system/developer تزریق می‌کند، اما فقط زمانی که درخواست همچنان مسیر تأییدشدهٔ OpenRouter را هدف بگیرد (`openrouter` در نقطهٔ پایانی پیش‌فرض آن، یا هر ارائه‌دهنده/نشانی پایه‌ای که به `openrouter.ai` منتهی شود). تغییر مقصد مدل به نشانی دلخواه یک پراکسی سازگار با OpenAI، این تزریق را متوقف می‌کند.

`contextPruning.mode: "cache-ttl"` برای ارجاع‌های مدل `openrouter/anthropic/*`، `openrouter/deepseek/*`، `openrouter/moonshot/*`، `openrouter/moonshotai/*` و `openrouter/zai/*` مجاز است، زیرا این مسیرها کش‌کردن پرامپت در سمت ارائه‌دهنده را بدون نیاز به نشانگرهای تزریق‌شدهٔ OpenClaw مدیریت می‌کنند.

منبع: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

ساخت کش DeepSeek در OpenRouter به‌صورت حداکثر تلاش انجام می‌شود و ممکن است چند ثانیه طول بکشد؛ درخواست بلافاصله بعدی ممکن است همچنان `cached_tokens: 0` را نشان دهد. پس از تأخیری کوتاه، با یک درخواست تکراری دارای همان پیشوند بررسی کنید و `usage.prompt_tokens_details.cached_tokens` را به‌عنوان نشانهٔ اصابت کش به‌کار ببرید.

### Google Gemini ‏(API مستقیم)

- انتقال مستقیم Gemini ‏(`api: "google-generative-ai"`) اصابت‌های کش را از طریق `cachedContentTokenCount` بالادستی گزارش می‌کند که به `cacheRead` نگاشت می‌شود.
- خانواده‌های مدل واجد شرایط: `gemini-2.5*` و `gemini-3*` (گونه‌های Live/preview خارج از تطبیق این پیشوند، برای مثال `gemini-live-2.5-flash-preview`، مستثنا هستند).
- وقتی `cacheRetention` روی مدلی واجد شرایط تنظیم شود، OpenClaw یک منبع `cachedContents` را برای پرامپت سیستمی به‌طور خودکار ایجاد، استفادهٔ مجدد و تازه‌سازی می‌کند؛ به دستگیرهٔ دستی محتوای کش‌شده نیازی نیست. TTL برای `cacheRetention: "short"` برابر `300s` و برای `"long"` برابر `3600s` است.
- همچنان می‌توان یک دستگیرهٔ ازپیش‌موجودِ محتوای کش‌شدهٔ Gemini را به‌صورت `params.cachedContent` (یا `params.cached_content` قدیمی) عبور داد؛ دستگیرهٔ صریح، مسیر مدیریت خودکار کش را به‌طور کامل نادیده می‌گیرد.
- این مورد از کش‌کردن پیشوند پرامپت Anthropic/OpenAI جداست: OpenClaw به‌جای تزریق نشانگرهای کش درون‌خطی، یک منبع بومی ارائه‌دهنده با نام `cachedContents` را برای Gemini مدیریت می‌کند.

منبع: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### ارائه‌دهندگان مبتنی بر مهار CLI ‏(Claude Code، Gemini CLI)

پشتانه‌های CLI که رویدادهای استفادهٔ JSONL منتشر می‌کنند (`jsonlDialect: "claude-stream-json"` یا `"gemini-stream-json"`) از یک تجزیه‌گر مشترک استفاده عبور می‌کنند که چندین گونهٔ نام فیلد را، از جمله شمارندهٔ سادهٔ `cached` که به `cacheRead` نگاشت می‌شود، تشخیص می‌دهد. وقتی بار JSON در CLI فیلد مستقیم توکن ورودی را نداشته باشد، OpenClaw آن را به‌صورت `input_tokens - cached` محاسبه می‌کند. این فقط نرمال‌سازی استفاده است و نشانگرهای کش پرامپت به سبک Anthropic/OpenAI را برای این مدل‌های مبتنی بر CLI ایجاد نمی‌کند.

منبع: `src/agents/cli-output.ts` (`toCliUsage`).

### سایر ارائه‌دهندگان

اگر ارائه‌دهنده‌ای از هیچ‌یک از حالت‌های کش بالا پشتیبانی نکند، `cacheRetention` اثری ندارد.

## مرز کش پرامپت سیستمی

OpenClaw در یک مرز داخلیِ پیشوند کش، پرامپت سیستمی را به یک **پیشوند پایدار** و یک **پسوند متغیر** تقسیم می‌کند. محتوای بالای مرز (تعریف ابزارها، فرادادهٔ Skills و فایل‌های فضای کاری) به‌گونه‌ای مرتب می‌شود که در نوبت‌ها از نظر بایتی یکسان بماند. محتوای پایین مرز (برای مثال `HEARTBEAT.md`، مُهرهای زمانی زمان اجرا و سایر فراداده‌های مختص هر نوبت) می‌تواند بدون نامعتبرکردن پیشوند کش‌شده تغییر کند.

تصمیم‌های کلیدی طراحی:

- فایل‌های پایدار زمینهٔ پروژه در فضای کاری پیش از `HEARTBEAT.md` مرتب می‌شوند تا تغییرات Heartbeat پیشوند پایدار را باطل نکند.
- این مرز در شکل‌دهی انتقال خانوادهٔ Anthropic، خانوادهٔ OpenAI، ‏Google و CLI اعمال می‌شود تا همهٔ ارائه‌دهندگان پشتیبانی‌شده از پایداری یکسان پیشوند بهره ببرند.
- درخواست‌های Codex Responses و Anthropic Vertex از مسیر شکل‌دهی کش آگاه از مرز هدایت می‌شوند تا استفادهٔ مجدد از کش با محتوایی که ارائه‌دهندگان واقعاً دریافت می‌کنند هم‌راستا بماند.
- اثر انگشت پرامپت سیستمی نرمال‌سازی می‌شود (فاصله‌ها، پایان خطوط، زمینهٔ افزوده‌شده توسط hook و ترتیب قابلیت‌های زمان اجرا) تا پرامپت‌هایی که از نظر معنایی بدون تغییرند در نوبت‌ها کش مشترک داشته باشند.

اگر پس از تغییر پیکربندی یا فضای کاری، جهش‌های غیرمنتظرهٔ `cacheWrite` مشاهده شد، بررسی کنید که تغییر در بالا یا پایین مرز کش قرار گرفته است. انتقال محتوای متغیر به پایین مرز (یا پایدارسازی آن) معمولاً مشکل را برطرف می‌کند.

## محافظ‌های پایداری کش OpenClaw

- فهرست ابزارهای همراه MCP پیش از ثبت ابزارها به‌صورت قطعی مرتب می‌شوند (ابتدا بر اساس نام سرور، سپس نام ابزار) تا تغییر ترتیب `listTools()` موجب تغییر مداوم بلوک ابزارها و باطل‌شدن پیشوندهای کش پرامپت نشود.
- نشست‌های قدیمی دارای بلوک‌های تصویر ذخیره‌شده، **3 نوبت تکمیل‌شدهٔ اخیر** را دست‌نخورده نگه می‌دارند (با شمارش همهٔ نوبت‌های تکمیل‌شده، نه فقط نوبت‌های دارای تصویر). بلوک‌های تصویر قدیمی‌تر که قبلاً پردازش شده‌اند با یک نشانگر متنی جایگزین می‌شوند تا پیگیری‌های پرتصویر، بارهای قدیمی و بزرگ را مکرراً ارسال نکنند.

## الگوهای تنظیم

### ترافیک ترکیبی (پیش‌فرض توصیه‌شده)

یک خط مبنای بلندمدت را در عامل اصلی نگه دارید و کش‌کردن را در عامل‌های اعلان‌دهندهٔ انفجاری غیرفعال کنید:

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

### خط مبنای با اولویت هزینه

- خط مبنای `cacheRetention: "short"` را تنظیم کنید.
- `contextPruning.mode: "cache-ttl"` را فعال کنید.
- Heartbeat را فقط برای عامل‌هایی که از کش گرم سود می‌برند، پایین‌تر از TTL نگه دارید.

## آزمون‌های رگرسیون زنده

OpenClaw یک دروازهٔ ترکیبی رگرسیون کش زنده اجرا می‌کند که پیشوندهای تکراری، نوبت‌های ابزار، نوبت‌های تصویر، رونوشت ابزار به سبک MCP و یک کنترل بدون کش Anthropic را پوشش می‌دهد.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

آن را با فرمان زیر اجرا کنید:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

فایل مبنا جدیدترین اعداد مشاهده‌شده در محیط زنده را به‌همراه کف‌های رگرسیون مختص هر ارائه‌دهنده که آزمون آن‌ها را بررسی می‌کند، ذخیره می‌کند. هر اجرا از شناسه‌های نشست و فضای نام پرامپت تازه و مختص همان اجرا استفاده می‌کند تا وضعیت کش قبلی نمونه فعلی را آلوده نکند. Anthropic و OpenAI سازوکارهای اعمال متفاوتی دارند: نرسیدن به کف Anthropic یک رگرسیون قطعی است (آزمون شکست می‌خورد)، درحالی‌که نرسیدن به کف OpenAI فقط تحت نظارت است (به‌صورت هشدار ثبت می‌شود و اجرا را شکست نمی‌دهد). آن‌ها یک آستانه واحد میان‌ارائه‌دهنده‌ای ندارند.

### انتظارات محیط زنده Anthropic

- انتظار می‌رود نوشتن‌های صریح گرم‌سازی از طریق `cacheWrite` انجام شوند.
- در نوبت‌های تکراری، انتظار می‌رود تقریباً کل تاریخچه دوباره استفاده شود، زیرا کنترل کش Anthropic نقطه شکست کش را در طول مکالمه جلو می‌برد.
- کف‌های مبنا برای مسیرهای پایدار، ابزار، تصویر و سبک MCP دروازه‌های قطعی رگرسیون هستند.

### انتظارات محیط زنده OpenAI

- فقط `cacheRead` انتظار می‌رود؛ `cacheWrite` در Chat Completions به‌صورت `0` باقی می‌ماند.
- استفاده مجدد از کش در نوبت‌های تکراری را یک سطح ثابت مختص ارائه‌دهنده در نظر بگیرید، نه استفاده مجدد متحرک از کل تاریخچه به سبک Anthropic.
- کف‌ها فقط تحت نظارت هستند (نرسیدن به آن‌ها به‌صورت هشدار ثبت می‌شود، نه شکست آزمون) و از رفتار مشاهده‌شده در محیط زنده روی `gpt-5.4-mini` به‌دست آمده‌اند:

| سناریو               | کف `cacheRead` | کف نرخ اصابت |
| -------------------- | ----------------: | -------------: |
| پیشوند پایدار        |             4,608 |           0.90 |
| رونوشت ابزار         |             4,096 |           0.85 |
| رونوشت تصویر         |             3,840 |           0.82 |
| رونوشت سبک MCP       |             4,096 |           0.85 |

جدیدترین اعداد مبنای مشاهده‌شده (از `live-cache-regression-baseline.ts`) به این مقادیر رسیدند: پیشوند پایدار `cacheRead=4864`، نرخ اصابت `0.966`؛ رونوشت ابزار `cacheRead=4608`، نرخ اصابت `0.896`؛ رونوشت تصویر `cacheRead=4864`، نرخ اصابت `0.954`؛ رونوشت سبک MCP `cacheRead=4608`، نرخ اصابت `0.891`.

دلیل تفاوت گزاره‌های بررسی: Anthropic نقاط شکست صریح کش و استفاده مجدد متحرک از تاریخچه مکالمه را ارائه می‌کند، درحالی‌که پیشوند عملاً قابل‌استفاده مجدد OpenAI در ترافیک زنده ممکن است پیش از رسیدن به کل پرامپت در سطح ثابتی متوقف شود. مقایسه این دو ارائه‌دهنده با یک آستانه درصدی واحد میان‌ارائه‌دهنده‌ای، رگرسیون‌های کاذب ایجاد می‌کند.

## پیکربندی `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # اختیاری
    includeMessages: false # پیش‌فرض true
    includePrompt: false # پیش‌فرض true
    includeSystem: false # پیش‌فرض true
```

مقادیر پیش‌فرض:

| کلید               | پیش‌فرض                                      |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### کلیدهای تغییر وضعیت محیطی (اشکال‌زدایی موردی)

| متغیر                             | اثر                               |
| ------------------------------------ | ------------------------------------ |
| `OPENCLAW_CACHE_TRACE=1`             | ردیابی کش را فعال می‌کند                |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | مسیر خروجی را بازنویسی می‌کند                |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | ثبت کامل محتوای پیام را تغییر وضعیت می‌دهد |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | ثبت متن پرامپت را تغییر وضعیت می‌دهد          |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | ثبت پرامپت سیستمی را تغییر وضعیت می‌دهد        |

### موارد قابل‌بررسی

- رویدادهای ردیابی کش با قالب JSONL و شامل نماهای فوری مرحله‌بندی‌شده‌ای مانند `session:loaded`، `prompt:before`، `stream:context` و `session:after` هستند.
- اثر توکن‌های کش در هر نوبت در سطوح معمول مصرف قابل‌مشاهده است: `cacheRead` و `cacheWrite` در `/usage tokens`، `/status`، خلاصه‌های مصرف نشست و چیدمان‌های سفارشی `messages.usageTemplate` نمایش داده می‌شوند.
- برای Anthropic، هنگام فعال بودن کش انتظار می‌رود هم `cacheRead` و هم `cacheWrite` وجود داشته باشند.
- برای OpenAI، هنگام اصابت کش انتظار می‌رود `cacheRead` وجود داشته باشد؛ `cacheWrite` فقط در محتوای Responses API که آن را شامل می‌شود، مقداردهی می‌شود (بخش [OpenAI](#openai-direct-api) در بالا را ببینید).
- OpenAI همچنین سرآیندهای ردیابی و محدودیت نرخ مانند `x-request-id`، `openai-processing-ms` و `x-ratelimit-*` را برمی‌گرداند؛ از آن‌ها برای ردیابی درخواست استفاده کنید، اما محاسبه اصابت کش همچنان باید از محتوای مصرف انجام شود، نه از سرآیندها.

## عیب‌یابی سریع

- **مقدار بالای `cacheWrite` در بیشتر نوبت‌ها**: ورودی‌های متغیر پرامپت سیستمی را بررسی کنید؛ مطمئن شوید مدل/ارائه‌دهنده از تنظیمات کش پشتیبانی می‌کند.
- **مقدار بالای `cacheWrite` در Anthropic**: اغلب به این معناست که نقطه شکست کش روی محتوایی قرار می‌گیرد که در هر درخواست تغییر می‌کند.
- **مقدار پایین `cacheRead` در OpenAI**: مطمئن شوید پیشوند پایدار در ابتدای متن قرار دارد، پیشوند تکراری حداقل 1024 توکن است و همان `prompt_cache_key` برای نوبت‌هایی که باید کش مشترک داشته باشند، دوباره استفاده می‌شود.
- **بی‌اثر بودن `cacheRetention`**: تأیید کنید کلید مدل با `agents.defaults.models["provider/model"]` مطابقت دارد.
- **درخواست‌های Bedrock Nova با تنظیمات کش**: قابل‌انتظار است — این درخواست‌ها هنگام اجرا بدون نگهداشت کش پردازش می‌شوند.

مستندات مرتبط:

- [Anthropic](/fa/providers/anthropic)
- [مصرف توکن و هزینه‌ها](/fa/reference/token-use)
- [هرس نشست](/fa/concepts/session-pruning)
- [مرجع پیکربندی Gateway](/fa/gateway/configuration-reference)

## مرتبط

- [مصرف توکن و هزینه‌ها](/fa/reference/token-use)
- [مصرف API و هزینه‌ها](/fa/reference/api-usage-costs)
