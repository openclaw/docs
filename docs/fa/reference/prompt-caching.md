---
read_when:
    - می‌خواهید با حفظ کش، هزینهٔ توکن‌های پرامپت را کاهش دهید
    - در پیکربندی‌های چندعاملی، به رفتار کشِ مختص هر عامل نیاز دارید
    - شما در حال تنظیم هم‌زمان Heartbeat و هرس بر اساس زمان ماندگاری حافظهٔ نهان هستید
summary: تنظیمات کش‌کردن پرامپت، ترتیب ادغام، رفتار ارائه‌دهنده و الگوهای تنظیم دقیق
title: کش‌کردن پرامپت
x-i18n:
    generated_at: "2026-07-12T10:47:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

ذخیره‌سازی موقت پرامپت به ارائه‌دهندهٔ مدل امکان می‌دهد به‌جای پردازش دوبارهٔ آن در هر درخواست، پیشوند بدون تغییر پرامپت (دستورالعمل‌های system/developer، تعاریف ابزار و سایر زمینه‌های پایدار) را میان نوبت‌ها بازاستفاده کند. این کار هزینهٔ توکن و تأخیر را در نشست‌های طولانی با زمینهٔ تکراری کاهش می‌دهد.

OpenClaw در هر جایی که API بالادستی این شمارنده‌ها را ارائه کند، مصرف ارائه‌دهنده را به `cacheRead` و `cacheWrite` نرمال‌سازی می‌کند. هنگامی که تصویر لحظه‌ای نشست زنده فاقد شمارنده‌های کش باشد، خلاصه‌های مصرف (`/status` و موارد مشابه) به آخرین ورودی مصرف در رونوشت رجوع می‌کنند؛ مقدار زندهٔ غیرصفر همیشه بر مقدار جایگزین اولویت دارد.

مراجع ارائه‌دهندگان:

- [ذخیره‌سازی موقت پرامپت Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [ذخیره‌سازی موقت پرامپت OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## تنظیمات اصلی

### `cacheRetention`

مقادیر: `"none" | "short" | "long"`. به‌عنوان پیش‌فرض سراسری، برای هر مدل و برای هر عامل قابل پیکربندی است.

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
3. `agents.list[].params` - بازنویسی مختص هر عامل که بر اساس شناسهٔ عامل تطبیق داده می‌شود

منبع: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

پس از سپری‌شدن بازهٔ TTL کش، زمینهٔ قدیمی نتایج ابزار را هرس می‌کند تا درخواست پس از یک دورهٔ بیکاری، تاریخچهٔ بیش‌ازحد بزرگ را دوباره در کش ذخیره نکند.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

برای رفتار کامل، به [هرس نشست](/fa/concepts/session-pruning) مراجعه کنید.

### گرم نگه‌داشتن با Heartbeat

Heartbeat می‌تواند پنجره‌های کش را گرم نگه دارد و نوشتن‌های مکرر در کش پس از وقفه‌های بیکاری را کاهش دهد. به‌صورت سراسری (`agents.defaults.heartbeat`) یا برای هر عامل (`agents.list[].heartbeat`) قابل پیکربندی است.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## رفتار ارائه‌دهندگان

### Anthropic ‏(API مستقیم و Vertex AI)

- `cacheRetention` برای ارائه‌دهندگان `anthropic` و `anthropic-vertex`، همچنین برای مدل‌های Claude روی `amazon-bedrock` و نقاط پایانی سفارشی سازگار با `anthropic-messages` در صورت تنظیم صریح `cacheRetention` پشتیبانی می‌شود.
- در صورت تنظیم‌نشدن، OpenClaw برای Anthropic مستقیم مقدار `cacheRetention: "short"` را مقداردهی اولیه می‌کند (فقط ارائه‌دهندگان `anthropic` و `anthropic-vertex`؛ سایر مسیرهای خانوادهٔ Anthropic به مقدار صریح نیاز دارند).
- پاسخ‌های بومی Anthropic Messages مقادیر `cache_read_input_tokens` و `cache_creation_input_tokens` را ارائه می‌کنند که به‌ترتیب به `cacheRead` و `cacheWrite` نگاشت می‌شوند.
- `cacheRetention: "short"` به کش موقت پیش‌فرض ۵ دقیقه‌ای نگاشت می‌شود. وقتی `cacheRetention: "long"` به‌طور صریح تنظیم شود، TTL یک‌ساعته (`cache_control: { type: "ephemeral", ttl: "1h" }`) درخواست می‌شود. نگهداشت طولانی ضمنی یا مبتنی بر متغیر محیطی (`OPENCLAW_CACHE_RETENTION=long` بدون `cacheRetention` صریح) فقط روی میزبان‌های `api.anthropic.com` یا Vertex AI ‏(`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`) به TTL یک‌ساعته ارتقا می‌یابد؛ سایر میزبان‌ها کش ۵ دقیقه‌ای را حفظ می‌کنند.

منبع: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`، `isLongTtlEligibleEndpoint`).

### OpenAI ‏(API مستقیم)

- ذخیره‌سازی موقت پرامپت در مدل‌های جدید پشتیبانی‌شده به‌صورت خودکار انجام می‌شود؛ OpenClaw نشانگرهای کش در سطح بلوک تزریق نمی‌کند.
- OpenClaw برای پایدار نگه‌داشتن مسیریابی کش میان نوبت‌ها، `prompt_cache_key` را ارسال می‌کند. میزبان‌های مستقیم `api.openai.com` این مقدار را به‌صورت خودکار دریافت می‌کنند. پراکسی‌های سازگار با OpenAI ‏(oMLX، llama.cpp و نقاط پایانی سفارشی) برای فعال‌سازی باید `compat.supportsPromptCacheKey: true` را در پیکربندی مدل داشته باشند؛ این قابلیت هرگز برای پراکسی به‌صورت خودکار تشخیص داده نمی‌شود.
- `prompt_cache_retention: "24h"` فقط زمانی افزوده می‌شود که `cacheRetention: "long"` انتخاب شده باشد و نقطهٔ پایانی حل‌شده هم از کلید کش و هم نگهداشت طولانی پشتیبانی کند (`compat.supportsLongCacheRetention` که به‌طور پیش‌فرض `true` است؛ نمایه‌های سازگاری Together AI و Cloudflare آن را غیرفعال می‌کنند). `cacheRetention: "none"` هر دو فیلد را حذف می‌کند.
- برخوردهای کش از طریق `usage.prompt_tokens_details.cached_tokens` ‏(Chat Completions) یا `input_tokens_details.cached_tokens` ‏(Responses API) ارائه و به `cacheRead` نگاشت می‌شوند.
- محموله‌های Responses API ممکن است `input_tokens_details.cache_write_tokens` را نیز ارائه کنند که به `cacheWrite` نگاشت و با نرخ نوشتن در کش مدل قیمت‌گذاری می‌شود؛ در محموله‌های Responses که این فیلد را ندارند، `cacheWrite` برابر `0` باقی می‌ماند. API ‏Chat Completions در OpenAI شمارندهٔ `cache_write_tokens` را مستند یا منتشر نمی‌کند، اما OpenClaw همچنان `prompt_tokens_details.cache_write_tokens` را در آنجا برای پراکسی‌های سازگار با OpenRouter و پراکسی‌های سبک DeepSeek که شمارش نوشتن جداگانه‌ای گزارش می‌کنند، می‌خواند.
- در عمل، رفتار OpenAI بیشتر شبیه کش پیشوند اولیه است تا بازاستفادهٔ پویای کل تاریخچه در Anthropic؛ بخش [انتظارات زندهٔ OpenAI](#openai-live-expectations) را در ادامه ببینید.

### Amazon Bedrock

- ارجاع‌های مدل Anthropic Claude ‏(`amazon-bedrock/*anthropic.claude*` به‌همراه پیشوندهای نمایهٔ استنتاج سیستمی AWS یعنی `us.`/`eu.`/`global.anthropic.claude*`) از عبور صریح `cacheRetention` پشتیبانی می‌کنند.
- مدل‌های غیر Anthropic در Bedrock (برای مثال `amazon.nova-*`) هنگام اجرا، صرف‌نظر از هر مقدار پیکربندی‌شدهٔ `cacheRetention`، بدون نگهداشت کش حل می‌شوند.
- ARNهای مبهم نمایهٔ استنتاج برنامه در Bedrock (شناسه‌های نمایه‌ای که شامل `claude` نیستند) نیز بدون نگهداشت کش حل می‌شوند، مگر اینکه `cacheRetention` به‌طور صریح تنظیم شده باشد؛ زیرا خانوادهٔ مدل را نمی‌توان فقط از ARN استنباط کرد.

### OpenRouter

برای ارجاع‌های مدل `openrouter/anthropic/*`، ‏OpenClaw نشانگرهای `cache_control` متعلق به Anthropic را در بلوک‌های پرامپت system/developer تزریق می‌کند، اما فقط زمانی که درخواست همچنان یک مسیر تأییدشدهٔ OpenRouter را هدف گرفته باشد (`openrouter` روی نقطهٔ پایانی پیش‌فرض خود، یا هر ارائه‌دهنده/نشانی پایه‌ای که به `openrouter.ai` حل شود). تغییر مقصد مدل به یک نشانی دلخواه پراکسی سازگار با OpenAI این تزریق را متوقف می‌کند.

`contextPruning.mode: "cache-ttl"` برای ارجاع‌های مدل `openrouter/anthropic/*`، `openrouter/deepseek/*`، `openrouter/moonshot/*`، `openrouter/moonshotai/*` و `openrouter/zai/*` مجاز است، زیرا این مسیرها ذخیره‌سازی موقت پرامپت در سمت ارائه‌دهنده را بدون نیاز به نشانگرهای تزریق‌شدهٔ OpenClaw مدیریت می‌کنند.

منبع: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

ساخت کش DeepSeek روی OpenRouter به‌صورت بهترین تلاش انجام می‌شود و ممکن است چند ثانیه طول بکشد؛ یک درخواست بلافاصله پس از آن ممکن است همچنان `cached_tokens: 0` را نشان دهد. پس از تأخیری کوتاه، با تکرار درخواستی با همان پیشوند و استفاده از `usage.prompt_tokens_details.cached_tokens` به‌عنوان نشانهٔ برخورد کش، آن را تأیید کنید.

### Google Gemini ‏(API مستقیم)

- انتقال مستقیم Gemini ‏(`api: "google-generative-ai"`) برخوردهای کش را از طریق `cachedContentTokenCount` بالادستی گزارش می‌کند که به `cacheRead` نگاشت می‌شود.
- خانواده‌های مدل واجد شرایط: `gemini-2.5*` و `gemini-3*` (گونه‌های Live/پیش‌نمایش خارج از این تطبیق پیشوند، مانند `gemini-live-2.5-flash-preview`، مستثنا هستند).
- وقتی `cacheRetention` روی یک مدل واجد شرایط تنظیم شود، OpenClaw به‌طور خودکار یک منبع `cachedContents` برای پرامپت system ایجاد، بازاستفاده و تازه‌سازی می‌کند؛ به شناسهٔ دستی محتوای کش‌شده نیازی نیست. TTL برای `cacheRetention: "short"` برابر `300s` و برای `"long"` برابر `3600s` است.
- همچنان می‌توانید یک شناسهٔ محتوای کش‌شدهٔ ازپیش‌موجود Gemini را از طریق `params.cachedContent` (یا شکل قدیمی `params.cached_content`) ارسال کنید؛ شناسهٔ صریح، مسیر مدیریت خودکار کش را کاملاً رد می‌کند.
- این سازوکار از ذخیره‌سازی موقت پیشوند پرامپت در Anthropic/OpenAI جدا است: OpenClaw به‌جای تزریق نشانگرهای درون‌خطی کش، یک منبع بومی ارائه‌دهنده به نام `cachedContents` را برای Gemini مدیریت می‌کند.

منبع: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### ارائه‌دهندگان مبتنی بر مهار CLI ‏(Claude Code، Gemini CLI)

پشتانه‌های CLI که رویدادهای مصرف JSONL منتشر می‌کنند (`jsonlDialect: "claude-stream-json"` یا `"gemini-stream-json"`)، از یک تجزیه‌گر مشترک مصرف عبور می‌کنند که چندین گونهٔ نام فیلد، از جمله شمارندهٔ سادهٔ `cached` نگاشت‌شده به `cacheRead`، را تشخیص می‌دهد. وقتی محمولهٔ JSON در CLI فاقد فیلد مستقیم توکن ورودی باشد، OpenClaw آن را به‌صورت `input_tokens - cached` محاسبه می‌کند. این فقط نرمال‌سازی مصرف است و برای این مدل‌های هدایت‌شده با CLI، نشانگرهای کش پرامپت مشابه Anthropic/OpenAI ایجاد نمی‌کند.

منبع: `src/agents/cli-output.ts` (`toCliUsage`).

### سایر ارائه‌دهندگان

اگر ارائه‌دهنده‌ای از هیچ‌یک از حالت‌های کش بالا پشتیبانی نکند، `cacheRetention` اثری ندارد.

## مرز کش پرامپت system

OpenClaw پرامپت system را در یک مرز داخلی پیشوند کش به یک **پیشوند پایدار** و یک **پسوند متغیر** تقسیم می‌کند. محتوای بالای مرز (تعاریف ابزار، فرادادهٔ Skills و فایل‌های فضای کاری) طوری مرتب می‌شود که در همهٔ نوبت‌ها از نظر بایتی یکسان بماند. محتوای پایین مرز (برای مثال `HEARTBEAT.md`، مُهرهای زمانی زمان اجرا و سایر فراداده‌های مختص هر نوبت) می‌تواند بدون بی‌اعتبارکردن پیشوند کش‌شده تغییر کند.

انتخاب‌های کلیدی طراحی:

- فایل‌های پایدار زمینهٔ پروژه در فضای کاری پیش از `HEARTBEAT.md` مرتب می‌شوند تا تغییرات Heartbeat پیشوند پایدار را از بین نبرد.
- این مرز در شکل‌دهی انتقال خانوادهٔ Anthropic، خانوادهٔ OpenAI، ‏Google و CLI اعمال می‌شود تا همهٔ ارائه‌دهندگان پشتیبانی‌شده از پایداری یکسان پیشوند بهره‌مند شوند.
- درخواست‌های Codex Responses و Anthropic Vertex از شکل‌دهی کش آگاه از مرز عبور داده می‌شوند تا بازاستفاده از کش با آنچه ارائه‌دهندگان واقعاً دریافت می‌کنند هم‌تراز بماند.
- اثرانگشت‌های پرامپت system نرمال‌سازی می‌شوند (فاصله‌های سفید، پایان خط‌ها، زمینهٔ افزوده‌شده توسط هوک و ترتیب قابلیت‌های زمان اجرا) تا پرامپت‌هایی که از نظر معنایی تغییری نکرده‌اند، کش را میان نوبت‌ها به اشتراک بگذارند.

اگر پس از تغییر پیکربندی یا فضای کاری جهش‌های غیرمنتظره‌ای در `cacheWrite` مشاهده کردید، بررسی کنید که تغییر در بالا یا پایین مرز کش قرار می‌گیرد. انتقال محتوای متغیر به پایین مرز (یا پایدارکردن آن) معمولاً مشکل را برطرف می‌کند.

## محافظ‌های پایداری کش OpenClaw

- کاتالوگ‌های ابزار MCP همراه، پیش از ثبت ابزار به‌صورت قطعی مرتب می‌شوند (ابتدا بر اساس نام سرور و سپس نام ابزار) تا تغییر ترتیب `listTools()` موجب تغییر مکرر بلوک ابزارها و از بین رفتن پیشوندهای کش پرامپت نشود.
- نشست‌های قدیمی دارای بلوک‌های تصویر ذخیره‌شده، **۳ نوبت تکمیل‌شدهٔ اخیر** را دست‌نخورده نگه می‌دارند (با شمارش همهٔ نوبت‌های تکمیل‌شده، نه فقط نوبت‌های دارای تصویر). بلوک‌های تصویر قدیمی‌تر که قبلاً پردازش شده‌اند با یک نشانگر متنی جایگزین می‌شوند تا پیگیری‌های پرتصویر، محموله‌های قدیمی و بزرگ را مکرراً ارسال نکنند.

## الگوهای تنظیم

### ترافیک ترکیبی (پیش‌فرض توصیه‌شده)

یک خط پایهٔ بلندمدت را روی عامل اصلی خود حفظ کنید و ذخیره‌سازی موقت را برای عامل‌های اعلان‌گر با ترافیک جهشی غیرفعال کنید:

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

### خط پایه با اولویت هزینه

- خط پایهٔ `cacheRetention: "short"` را تنظیم کنید.
- `contextPruning.mode: "cache-ttl"` را فعال کنید.
- فقط برای عامل‌هایی که از کش گرم سود می‌برند، فاصلهٔ Heartbeat را کمتر از TTL خود نگه دارید.

## آزمون‌های زندهٔ رگرسیون

OpenClaw یک دروازهٔ ترکیبی رگرسیون زندهٔ کش را اجرا می‌کند که پیشوندهای تکراری، نوبت‌های ابزار، نوبت‌های تصویر، رونوشت‌های ابزار به سبک MCP و یک کنترل بدون کش Anthropic را پوشش می‌دهد.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

آن را با دستور زیر اجرا کنید:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

فایل خط پایه، جدیدترین اعداد زندهٔ مشاهده‌شده را به‌همراه کف‌های رگرسیون مختص هر ارائه‌دهنده که آزمون بررسی می‌کند، ذخیره می‌کند. هر اجرا از شناسه‌های نشست و فضاهای نام پرامپت تازه و مختص همان اجرا استفاده می‌کند تا وضعیت کش قبلی نمونهٔ فعلی را آلوده نکند. Anthropic و OpenAI اعمال متفاوتی دارند: نرسیدن Anthropic به کف تعیین‌شده یک رگرسیون قطعی است (آزمون شکست می‌خورد)، درحالی‌که نرسیدن OpenAI به کف فقط تحت نظارت است (به‌عنوان هشدار ثبت می‌شود و اجرا را شکست نمی‌دهد). آن‌ها یک آستانهٔ واحد مشترک میان ارائه‌دهندگان ندارند.

### انتظارات زندهٔ Anthropic

- انتظار نگارش‌های صریح گرم‌سازی از طریق `cacheWrite` را داشته باشید.
- در نوبت‌های تکراری، انتظار استفادهٔ مجدد از تقریباً تمام تاریخچه را داشته باشید، زیرا کنترل کش Anthropic نقطهٔ شکست کش را در طول مکالمه پیش می‌برد.
- کف‌های مبنا برای مسیرهای پایدار، ابزار، تصویر و سبک MCP، دروازه‌های سخت رگرسیون هستند.

### انتظارات زندهٔ OpenAI

- فقط انتظار `cacheRead` را داشته باشید؛ در Chat Completions مقدار `cacheWrite` برابر `0` باقی می‌ماند.
- استفادهٔ مجدد از کش در نوبت‌های تکراری را یک سطح ثابت مختص ارائه‌دهنده در نظر بگیرید، نه استفادهٔ مجدد متحرک از تمام تاریخچه به سبک Anthropic.
- کف‌ها فقط برای پایش هستند (عدم دستیابی به آن‌ها به‌صورت هشدار ثبت می‌شود، نه شکست آزمون) و از رفتار زندهٔ مشاهده‌شده در `gpt-5.4-mini` به دست آمده‌اند:

| سناریو                | کف `cacheRead` | کف نرخ اصابت |
| --------------------- | -------------: | -----------: |
| پیشوند پایدار         |          ۴٬۶۰۸ |         ۰٫۹۰ |
| رونوشت ابزار          |          ۴٬۰۹۶ |         ۰٫۸۵ |
| رونوشت تصویر          |          ۳٬۸۴۰ |         ۰٫۸۲ |
| رونوشت به سبک MCP     |          ۴٬۰۹۶ |         ۰٫۸۵ |

جدیدترین اعداد مبنای مشاهده‌شده (از `live-cache-regression-baseline.ts`) به این مقادیر رسیدند: پیشوند پایدار `cacheRead=4864`، نرخ اصابت `0.966`؛ رونوشت ابزار `cacheRead=4608`، نرخ اصابت `0.896`؛ رونوشت تصویر `cacheRead=4864`، نرخ اصابت `0.954`؛ رونوشت به سبک MCP با `cacheRead=4608` و نرخ اصابت `0.891`.

دلیل تفاوت ادعاها: Anthropic نقاط شکست صریح کش و استفادهٔ مجدد متحرک از تاریخچهٔ مکالمه را ارائه می‌کند، در حالی که پیشوند عملاً قابل‌استفادهٔ مجدد OpenAI در ترافیک زنده ممکن است پیش از رسیدن به کل پرامپت در یک سطح ثابت بماند. مقایسهٔ این دو ارائه‌دهنده با یک آستانهٔ درصدی واحد و مشترک میان ارائه‌دهندگان، رگرسیون‌های کاذب ایجاد می‌کند.

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

| کلید              | مقدار پیش‌فرض                               |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### کلیدهای تغییر محیطی (اشکال‌زدایی موردی)

| متغیر                                | اثر                                  |
| ------------------------------------ | ------------------------------------ |
| `OPENCLAW_CACHE_TRACE=1`             | ردیابی کش را فعال می‌کند             |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | مسیر خروجی را بازنویسی می‌کند        |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | ثبت محتوای کامل پیام را تغییر می‌دهد |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | ثبت متن پرامپت را تغییر می‌دهد       |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | ثبت پرامپت سیستم را تغییر می‌دهد     |

### چه مواردی را بررسی کنید

- رویدادهای ردیابی کش به‌صورت JSONL و دارای عکس‌های فوری مرحله‌بندی‌شده‌ای مانند `session:loaded`، `prompt:before`، `stream:context` و `session:after` هستند.
- تأثیر توکن‌های کش در هر نوبت در نماهای معمول مصرف قابل مشاهده است: `cacheRead` و `cacheWrite` در `/usage tokens`، `/status`، خلاصه‌های مصرف نشست و چیدمان‌های سفارشی `messages.usageTemplate` نمایش داده می‌شوند.
- برای Anthropic، هنگامی که کش فعال است، انتظار هر دو مقدار `cacheRead` و `cacheWrite` را داشته باشید.
- برای OpenAI، در اصابت‌های کش انتظار `cacheRead` را داشته باشید؛ `cacheWrite` فقط در محتوای Responses API که آن را شامل می‌شود مقداردهی می‌شود (به بخش [OpenAI](#openai-direct-api) در بالا مراجعه کنید).
- OpenAI همچنین سرآیندهای ردیابی و محدودیت نرخ مانند `x-request-id`، `openai-processing-ms` و `x-ratelimit-*` را بازمی‌گرداند؛ از آن‌ها برای ردیابی درخواست استفاده کنید، اما محاسبهٔ اصابت کش همچنان باید از محتوای مصرف به دست آید، نه از سرآیندها.

## عیب‌یابی سریع

- **`cacheWrite` بالا در بیشتر نوبت‌ها**: ورودی‌های متغیر پرامپت سیستم را بررسی کنید؛ اطمینان یابید مدل یا ارائه‌دهنده از تنظیمات کش شما پشتیبانی می‌کند.
- **`cacheWrite` بالا در Anthropic**: اغلب به این معناست که نقطهٔ شکست کش روی محتوایی قرار گرفته است که در هر درخواست تغییر می‌کند.
- **`cacheRead` پایین OpenAI**: بررسی کنید که پیشوند پایدار در ابتدا قرار دارد، پیشوند تکراری دست‌کم ۱۰۲۴ توکن است و برای نوبت‌هایی که باید کش مشترک داشته باشند، همان `prompt_cache_key` دوباره استفاده می‌شود.
- **بی‌اثر بودن `cacheRetention`**: تأیید کنید کلید مدل با `agents.defaults.models["provider/model"]` مطابقت دارد.
- **درخواست‌های Bedrock Nova با تنظیمات کش**: مورد انتظار است — این درخواست‌ها هنگام اجرا بدون نگهداشت کش تفکیک می‌شوند.

مستندات مرتبط:

- [Anthropic](/fa/providers/anthropic)
- [مصرف توکن و هزینه‌ها](/fa/reference/token-use)
- [هرس نشست](/fa/concepts/session-pruning)
- [مرجع پیکربندی Gateway](/fa/gateway/configuration-reference)

## مرتبط

- [مصرف توکن و هزینه‌ها](/fa/reference/token-use)
- [مصرف API و هزینه‌ها](/fa/reference/api-usage-costs)
