---
read_when:
    - می‌خواهید هزینه‌های توکن پرامپت را با حفظ کش کاهش دهید
    - در راه‌اندازی‌های چندعاملی به رفتار کش برای هر عامل نیاز دارید
    - شما در حال تنظیم Heartbeat و پاک‌سازی cache-ttl با هم هستید
summary: دکمه‌های تنظیم کش پرامپت، ترتیب ادغام، رفتار ارائه‌دهنده و الگوهای تنظیم
title: کش کردن پرامپت
x-i18n:
    generated_at: "2026-07-01T18:18:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3189cc734bbee14236e6303aca99aca512732989ffd01612ae635608a2471e60
    source_path: reference/prompt-caching.md
    workflow: 16
---

کش کردن پرامپت یعنی ارائه‌دهندهٔ مدل می‌تواند پیشوندهای بدون تغییر پرامپت را، که معمولا شامل دستورالعمل‌های system/developer و دیگر زمینه‌های پایدار است، در نوبت‌های مختلف دوباره استفاده کند، به‌جای اینکه هر بار آن‌ها را از نو پردازش کند. OpenClaw مصرف ارائه‌دهنده را در قالب `cacheRead` و `cacheWrite` نرمال‌سازی می‌کند، در مواردی که API بالادستی این شمارنده‌ها را مستقیما در اختیار می‌گذارد.

سطوح وضعیت همچنین می‌توانند شمارنده‌های کش را از جدیدترین لاگ مصرف transcript
بازیابی کنند، وقتی snapshot نشست زنده آن‌ها را نداشته باشد، تا `/status` بتواند پس از از دست رفتن جزئی فرادادهٔ نشست همچنان
خط کش را نشان دهد. مقدارهای زندهٔ غیرصفر موجود برای کش همچنان بر مقدارهای fallback از transcript اولویت دارند.

چرا این مهم است: هزینهٔ کمتر توکن، پاسخ‌های سریع‌تر، و کارایی قابل پیش‌بینی‌تر برای نشست‌های طولانی‌مدت. بدون کش، پرامپت‌های تکراری در هر نوبت کل هزینهٔ پرامپت را می‌پردازند، حتی وقتی بیشتر ورودی تغییر نکرده باشد.

بخش‌های زیر همهٔ تنظیمات مرتبط با کش را که بر استفادهٔ دوباره از پرامپت و هزینهٔ توکن اثر می‌گذارند پوشش می‌دهند.

ارجاع‌های ارائه‌دهنده:

- کش کردن پرامپت Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- کش کردن پرامپت OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- هدرهای API و شناسه‌های درخواست OpenAI: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- شناسه‌های درخواست و خطاهای Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## تنظیمات اصلی

### `cacheRetention` (پیش‌فرض سراسری، مدل، و به‌ازای هر عامل)

نگهداشت کش را به‌عنوان پیش‌فرض سراسری برای همهٔ مدل‌ها تنظیم کنید:

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

بازنویسی به‌ازای هر عامل:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

ترتیب ادغام پیکربندی:

1. `agents.defaults.params` (پیش‌فرض سراسری — برای همهٔ مدل‌ها اعمال می‌شود)
2. `agents.defaults.models["provider/model"].params` (بازنویسی به‌ازای هر مدل)
3. `agents.list[].params` (شناسهٔ عامل منطبق؛ به‌ازای کلید بازنویسی می‌کند)

### `contextPruning.mode: "cache-ttl"`

زمینهٔ قدیمی نتیجهٔ ابزار را پس از پنجره‌های TTL کش هرس می‌کند تا درخواست‌های پس از دورهٔ بیکاری، تاریخچهٔ بیش‌ازحد بزرگ را دوباره کش نکنند.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

برای رفتار کامل، [هرس نشست](/fa/concepts/session-pruning) را ببینید.

### گرم نگه داشتن Heartbeat

Heartbeat می‌تواند پنجره‌های کش را گرم نگه دارد و نوشتن‌های تکراری کش را پس از فاصله‌های بیکاری کاهش دهد.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat به‌ازای هر عامل در `agents.list[].heartbeat` پشتیبانی می‌شود.

## رفتار ارائه‌دهنده

### Anthropic (API مستقیم)

- `cacheRetention` پشتیبانی می‌شود.
- با پروفایل‌های احراز هویت کلید API برای Anthropic، OpenClaw وقتی تنظیم نشده باشد برای ارجاع‌های مدل Anthropic مقدار `cacheRetention: "short"` را مقداردهی اولیه می‌کند.
- پاسخ‌های native Messages در Anthropic هم `cache_read_input_tokens` و هم `cache_creation_input_tokens` را در اختیار می‌گذارند، بنابراین OpenClaw می‌تواند هم `cacheRead` و هم `cacheWrite` را نشان دهد.
- برای درخواست‌های native Anthropic، مقدار `cacheRetention: "short"` به کش موقت پیش‌فرض ۵ دقیقه‌ای نگاشت می‌شود، و `cacheRetention: "long"` فقط روی میزبان‌های مستقیم `api.anthropic.com` به TTL یک‌ساعته ارتقا می‌یابد.

### OpenAI (API مستقیم)

- کش کردن پرامپت روی مدل‌های جدید پشتیبانی‌شده خودکار است. OpenClaw نیازی ندارد نشانگرهای کش در سطح بلوک تزریق کند.
- OpenClaw از `prompt_cache_key` استفاده می‌کند تا مسیریابی کش در نوبت‌ها پایدار بماند. میزبان‌های مستقیم OpenAI وقتی `cacheRetention: "long"` انتخاب شود از `prompt_cache_retention: "24h"` استفاده می‌کنند.
- ارائه‌دهنده‌های Completions سازگار با OpenAI فقط وقتی `prompt_cache_key` را دریافت می‌کنند که پیکربندی مدل آن‌ها صراحتا `compat.supportsPromptCacheKey: true` را تنظیم کرده باشد. ارسال نگهداشت بلندمدت یک قابلیت جداگانه است: مقدار صریح `cacheRetention: "long"` فقط وقتی `prompt_cache_retention: "24h"` را می‌فرستد که آن ورودی compat از نگهداشت بلندمدت کش هم پشتیبانی کند. ارائه‌دهنده‌هایی مانند Mistral می‌توانند کلیدهای کش را فعال کنند، درحالی‌که `compat.supportsLongCacheRetention: false` را تنظیم می‌کنند تا فیلد نگهداشت بلندمدت سرکوب شود. `cacheRetention: "none"` هر دو فیلد را سرکوب می‌کند.
- پاسخ‌های OpenAI توکن‌های کش‌شدهٔ پرامپت را از طریق `usage.prompt_tokens_details.cached_tokens` (یا `input_tokens_details.cached_tokens` روی رویدادهای Responses API) در اختیار می‌گذارند. OpenClaw آن را به `cacheRead` نگاشت می‌کند.
- مصرف GPT-5.6 Responses همچنین می‌تواند `input_tokens_details.cache_write_tokens` را در اختیار بگذارد. OpenClaw آن را به `cacheWrite` نگاشت می‌کند و با نرخ نوشتن کش همان مدل قیمت‌گذاری می‌کند؛ پاسخ‌هایی که این فیلد را حذف کنند `cacheWrite` را روی `0` نگه می‌دارند.
- OpenAI هدرهای مفید رهگیری و محدودیت نرخ مانند `x-request-id`، `openai-processing-ms`، و `x-ratelimit-*` را برمی‌گرداند، اما حسابداری برخورد کش باید از payload مصرف بیاید، نه از هدرها.
- در عمل، OpenAI اغلب مانند کش پیشوند اولیه رفتار می‌کند، نه استفادهٔ دوباره از کل تاریخچهٔ متحرک به سبک Anthropic. چرخش‌های متن با پیشوند بلند پایدار در probeهای زندهٔ فعلی می‌توانند نزدیک یک سکوی `4864` توکن کش‌شده قرار بگیرند، درحالی‌که transcriptهای پرابزار یا به سبک MCP اغلب حتی در تکرارهای دقیق نزدیک `4608` توکن کش‌شده به سکو می‌رسند.

### Anthropic Vertex

- مدل‌های Anthropic روی Vertex AI (`anthropic-vertex/*`) از `cacheRetention` به همان شکل Anthropic مستقیم پشتیبانی می‌کنند.
- `cacheRetention: "long"` به TTL واقعی یک‌ساعتهٔ کش پرامپت روی endpointهای Vertex AI نگاشت می‌شود.
- نگهداشت کش پیش‌فرض برای `anthropic-vertex` با پیش‌فرض‌های Anthropic مستقیم مطابقت دارد.
- درخواست‌های Vertex از مسیر شکل‌دهی کش آگاه از مرز عبور می‌کنند تا استفادهٔ دوباره از کش با چیزی که ارائه‌دهنده‌ها واقعا دریافت می‌کنند هم‌راستا بماند.

### Amazon Bedrock

- ارجاع‌های مدل Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) از عبور صریح `cacheRetention` پشتیبانی می‌کنند.
- مدل‌های غیر Anthropic در Bedrock در زمان اجرا مجبور به `cacheRetention: "none"` می‌شوند.

### مدل‌های OpenRouter

برای ارجاع‌های مدل `openrouter/anthropic/*`، OpenClaw روی بلوک‌های پرامپت system/developer
`cache_control` مربوط به Anthropic را تزریق می‌کند تا استفادهٔ دوباره از کش پرامپت
بهبود یابد، فقط وقتی درخواست همچنان یک مسیر OpenRouter تأییدشده را هدف گرفته باشد
(`openrouter` روی endpoint پیش‌فرضش، یا هر ارائه‌دهنده/base URL که به
`openrouter.ai` resolve شود).

برای ارجاع‌های مدل `openrouter/deepseek/*`، `openrouter/moonshot*/*`، و `openrouter/zai/*`،
مقدار `contextPruning.mode: "cache-ttl"` مجاز است، چون OpenRouter
کش کردن پرامپت در سمت ارائه‌دهنده را خودکار مدیریت می‌کند. OpenClaw نشانگرهای
`cache_control` مربوط به Anthropic را به این درخواست‌ها تزریق نمی‌کند.

ساخت کش DeepSeek بهترین تلاش است و می‌تواند چند ثانیه طول بکشد. یک
پیگیری فوری ممکن است همچنان `cached_tokens: 0` نشان دهد؛ با یک درخواست تکراری
با همان پیشوند پس از تأخیری کوتاه بررسی کنید و از `usage.prompt_tokens_details.cached_tokens`
به‌عنوان سیگنال برخورد کش استفاده کنید.

اگر مدل را به یک URL پروکسی دلخواه سازگار با OpenAI تغییر مسیر دهید، OpenClaw
تزریق آن نشانگرهای کش Anthropic ویژهٔ OpenRouter را متوقف می‌کند.

### ارائه‌دهنده‌های دیگر

اگر ارائه‌دهنده از این حالت کش پشتیبانی نکند، `cacheRetention` اثری ندارد.

### API مستقیم Google Gemini

- انتقال مستقیم Gemini (`api: "google-generative-ai"`) برخوردهای کش را
  از طریق `cachedContentTokenCount` بالادستی گزارش می‌کند؛ OpenClaw آن را به `cacheRead` نگاشت می‌کند.
- وقتی `cacheRetention` روی یک مدل مستقیم Gemini تنظیم شود، OpenClaw به‌صورت خودکار
  منابع `cachedContents` را برای پرامپت‌های system در اجراهای Google AI Studio
  ایجاد، دوباره استفاده، و تازه‌سازی می‌کند. یعنی دیگر نیازی ندارید یک
  هندل cached-content را دستی از قبل ایجاد کنید.
- همچنان می‌توانید یک هندل cached-content موجود Gemini را به‌عنوان
  `params.cachedContent` (یا شکل قدیمی `params.cached_content`) روی مدل پیکربندی‌شده
  عبور دهید.
- این از کش کردن پیشوند پرامپت Anthropic/OpenAI جداست. برای Gemini،
  OpenClaw یک منبع native ارائه‌دهنده به نام `cachedContents` را مدیریت می‌کند، نه اینکه
  نشانگرهای کش را به درخواست تزریق کند.

### مصرف Gemini CLI

- خروجی `stream-json` در Gemini CLI می‌تواند برخوردهای کش را از طریق `stats.cached` نشان دهد؛
  OpenClaw آن را به `cacheRead` نگاشت می‌کند. بازنویسی‌های قدیمی `--output-format json` از
  همان نرمال‌سازی مصرف استفاده می‌کنند.
- اگر CLI مقدار مستقیم `stats.input` را حذف کند، OpenClaw توکن‌های ورودی را
  از `stats.input_tokens - stats.cached` استخراج می‌کند.
- این فقط نرمال‌سازی مصرف است. به این معنی نیست که OpenClaw در حال ایجاد
  نشانگرهای کش پرامپت به سبک Anthropic/OpenAI برای Gemini CLI است.

## مرز کش پرامپت system

OpenClaw پرامپت system را به یک **پیشوند پایدار** و یک **پسوند ناپایدار**
تقسیم می‌کند که با یک مرز داخلی cache-prefix از هم جدا شده‌اند. محتوای بالای
مرز (تعریف‌های ابزار، فرادادهٔ Skills، فایل‌های workspace، و دیگر زمینه‌های
نسبتا ایستا) طوری مرتب می‌شود که در نوبت‌ها بایت‌به‌بایت یکسان بماند.
محتوای پایین مرز (برای مثال `HEARTBEAT.md`، timestampهای زمان اجرا، و
دیگر فرادادهٔ به‌ازای هر نوبت) مجاز است بدون نامعتبر کردن پیشوند کش‌شده
تغییر کند.

انتخاب‌های کلیدی طراحی:

- فایل‌های پایدار project-context مربوط به workspace پیش از `HEARTBEAT.md` مرتب می‌شوند تا
  تغییرات Heartbeat پیشوند پایدار را خراب نکند.
- مرز در شکل‌دهی انتقال‌های خانوادهٔ Anthropic، خانوادهٔ OpenAI، Google، و
  CLI اعمال می‌شود تا همهٔ ارائه‌دهنده‌های پشتیبانی‌شده از همان پایداری پیشوند
  بهره ببرند.
- درخواست‌های Codex Responses و Anthropic Vertex از مسیر
  شکل‌دهی کش آگاه از مرز عبور می‌کنند تا استفادهٔ دوباره از کش با چیزی که ارائه‌دهنده‌ها
  واقعا دریافت می‌کنند هم‌راستا بماند.
- اثرانگشت‌های پرامپت system نرمال‌سازی می‌شوند (فاصله‌ها، پایان خط‌ها،
  زمینهٔ افزوده‌شده توسط hook، ترتیب قابلیت‌های زمان اجرا) تا پرامپت‌هایی که از نظر معنایی
  بدون تغییر هستند در نوبت‌ها KV/cache مشترک داشته باشند.

اگر پس از تغییر پیکربندی یا workspace جهش‌های غیرمنتظرهٔ `cacheWrite` می‌بینید،
بررسی کنید که تغییر بالای مرز کش قرار گرفته یا پایین آن. انتقال
محتوای ناپایدار به پایین مرز (یا پایدار کردن آن) اغلب مشکل را حل می‌کند.

## نگهبان‌های پایداری کش در OpenClaw

OpenClaw همچنین چند شکل payload حساس به کش را پیش از رسیدن درخواست به ارائه‌دهنده
قطعی و قابل تکرار نگه می‌دارد:

- کاتالوگ‌های ابزار Bundle MCP پیش از ثبت ابزار به‌صورت قطعی مرتب می‌شوند،
  تا تغییر ترتیب `listTools()` بلوک ابزارها را دچار نوسان نکند و
  پیشوندهای کش پرامپت را خراب نکند.
- نشست‌های قدیمی با بلوک‌های تصویر پایدارشده، **۳ نوبت کامل‌شدهٔ جدیدتر**
  را دست‌نخورده نگه می‌دارند؛ بلوک‌های تصویر قدیمی‌تر که از قبل پردازش شده‌اند ممکن است
  با یک نشانگر جایگزین شوند تا پیگیری‌های تصویرمحور، payloadهای بزرگ و stale
  را دوباره و دوباره نفرستند.

## الگوهای تنظیم

### ترافیک ترکیبی (پیش‌فرض توصیه‌شده)

یک baseline بلندمدت را روی عامل اصلی خود نگه دارید، و کش را روی عامل‌های اعلان‌دهندهٔ bursty غیرفعال کنید:

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

### baseline هزینه‌محور

- baseline را روی `cacheRetention: "short"` تنظیم کنید.
- `contextPruning.mode: "cache-ttl"` را فعال کنید.
- Heartbeat را فقط برای عامل‌هایی که از کش گرم سود می‌برند، پایین‌تر از TTL نگه دارید.

## عیب‌یابی کش

OpenClaw عیب‌یابی‌های اختصاصی cache-trace را برای اجرای عامل‌های جاسازی‌شده در اختیار می‌گذارد.

برای عیب‌یابی‌های معمول کاربرمحور، `/status` و دیگر خلاصه‌های مصرف می‌توانند
از جدیدترین ورودی مصرف transcript به‌عنوان منبع fallback برای `cacheRead` /
`cacheWrite` استفاده کنند، وقتی ورودی نشست زنده این شمارنده‌ها را ندارد.

## آزمون‌های رگرسیون زنده

OpenClaw یک gate ترکیبی رگرسیون کش زنده برای پیشوندهای تکراری، نوبت‌های ابزار، نوبت‌های تصویر، transcriptهای ابزار به سبک MCP، و یک کنترل بدون کش Anthropic نگه می‌دارد.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

gate زندهٔ محدود را با این دستور اجرا کنید:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

فایل مبنا تازه‌ترین اعداد زنده مشاهده‌شده به‌علاوه کف‌های رگرسیون ویژه هر ارائه‌دهنده را که آزمون استفاده می‌کند ذخیره می‌کند.
اجراکننده همچنین از شناسه‌های نشست و فضاهای نام اعلان تازه برای هر اجرا استفاده می‌کند تا وضعیت کش قبلی نمونه رگرسیون فعلی را آلوده نکند.

این آزمون‌ها عمدا معیارهای موفقیت یکسانی را در همه ارائه‌دهندگان به کار نمی‌برند.

### انتظارات زنده Anthropic

- انتظار نوشتن‌های گرم‌سازی صریح از طریق `cacheWrite`.
- انتظار استفاده مجدد تقریبا کامل از تاریخچه در نوبت‌های تکراری، چون کنترل کش Anthropic نقطه شکست کش را در طول مکالمه جلو می‌برد.
- گزاره‌های زنده فعلی همچنان از آستانه‌های نرخ برخورد بالا برای مسیرهای پایدار، ابزار و تصویر استفاده می‌کنند.

### انتظارات زنده OpenAI

- فقط انتظار `cacheRead` را داشته باشید. `cacheWrite` همچنان `0` می‌ماند.
- استفاده مجدد از کش در نوبت‌های تکراری را به‌عنوان یک سکوی ویژه ارائه‌دهنده در نظر بگیرید، نه استفاده مجدد از کل تاریخچه متحرک به سبک Anthropic.
- گزاره‌های زنده فعلی از بررسی‌های کف محافظه‌کارانه‌ای استفاده می‌کنند که از رفتار زنده مشاهده‌شده روی `gpt-5.4-mini` به دست آمده‌اند:
  - پیشوند پایدار: `cacheRead >= 4608`، نرخ برخورد `>= 0.90`
  - رونوشت ابزار: `cacheRead >= 4096`، نرخ برخورد `>= 0.85`
  - رونوشت تصویر: `cacheRead >= 3840`، نرخ برخورد `>= 0.82`
  - رونوشت به سبک MCP: `cacheRead >= 4096`، نرخ برخورد `>= 0.85`

راستی‌آزمایی زنده ترکیبی تازه در 2026-04-04 به این نتایج رسید:

- پیشوند پایدار: `cacheRead=4864`، نرخ برخورد `0.966`
- رونوشت ابزار: `cacheRead=4608`، نرخ برخورد `0.896`
- رونوشت تصویر: `cacheRead=4864`، نرخ برخورد `0.954`
- رونوشت به سبک MCP: `cacheRead=4608`، نرخ برخورد `0.891`

زمان دیواری محلی اخیر برای گیت ترکیبی حدود `88s` بود.

دلیل تفاوت گزاره‌ها:

- Anthropic نقاط شکست صریح کش و استفاده مجدد از تاریخچه مکالمه متحرک را آشکار می‌کند.
- کش‌کردن اعلان OpenAI همچنان به پیشوند دقیق حساس است، اما پیشوند عملا قابل استفاده مجدد در ترافیک زنده Responses ممکن است زودتر از اعلان کامل به سکو برسد.
- به همین دلیل، مقایسه Anthropic و OpenAI با یک آستانه درصدی واحد میان ارائه‌دهندگان رگرسیون‌های کاذب ایجاد می‌کند.

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

### کلیدهای تغییر محیطی (اشکال‌زدایی یک‌باره)

- `OPENCLAW_CACHE_TRACE=1` رهگیری کش را فعال می‌کند.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` مسیر خروجی را بازنویسی می‌کند.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` ثبت کامل محتوای پیام را روشن یا خاموش می‌کند.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` ثبت متن اعلان را روشن یا خاموش می‌کند.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` ثبت اعلان سیستم را روشن یا خاموش می‌کند.

### چه چیزی را بررسی کنید

- رویدادهای رهگیری کش JSONL هستند و نماهای مرحله‌ای مانند `session:loaded`، `prompt:before`، `stream:context` و `session:after` را شامل می‌شوند.
- اثر توکن کش در هر نوبت از طریق `cacheRead` و `cacheWrite` در سطوح استفاده معمولی قابل مشاهده است (برای مثال `/usage tokens`، `/status`، خلاصه‌های استفاده نشست و چیدمان‌های سفارشی `messages.usageTemplate`).
- برای Anthropic، وقتی کش فعال است انتظار هر دو `cacheRead` و `cacheWrite` را داشته باشید.
- برای OpenAI، در برخوردهای کش انتظار `cacheRead` را داشته باشید. GPT-5.6 Responses همچنین می‌تواند هنگام نوشته‌شدن بخش‌های اعلان، `cacheWrite` را گزارش کند؛ دیگر محتوای Responses که شمارنده نوشتن را حذف می‌کنند آن را روی `0` نگه می‌دارند.
- اگر به رهگیری درخواست نیاز دارید، شناسه‌های درخواست و سرآیندهای محدودیت نرخ را جدا از سنجه‌های کش ثبت کنید. خروجی فعلی رهگیری کش OpenClaw به‌جای سرآیندهای خام پاسخ ارائه‌دهنده، بر شکل اعلان/نشست و استفاده نرمال‌شده از توکن متمرکز است.

## عیب‌یابی سریع

- `cacheWrite` بالا در بیشتر نوبت‌ها: ورودی‌های فرار اعلان سیستم را بررسی کنید و مطمئن شوید مدل/ارائه‌دهنده از تنظیمات کش شما پشتیبانی می‌کند.
- `cacheWrite` بالا در Anthropic: اغلب یعنی نقطه شکست کش روی محتوایی قرار می‌گیرد که در هر درخواست تغییر می‌کند.
- `cacheRead` پایین در OpenAI: مطمئن شوید پیشوند پایدار در ابتدا قرار دارد، پیشوند تکراری دست‌کم 1024 توکن است، و همان `prompt_cache_key` برای نوبت‌هایی که باید کش مشترک داشته باشند دوباره استفاده می‌شود.
- بی‌اثر بودن `cacheRetention`: تأیید کنید کلید مدل با `agents.defaults.models["provider/model"]` مطابقت دارد.
- درخواست‌های Bedrock Nova/Mistral با تنظیمات کش: اجبار زمان اجرا به `none` مورد انتظار است.

اسناد مرتبط:

- [Anthropic](/fa/providers/anthropic)
- [مصرف توکن و هزینه‌ها](/fa/reference/token-use)
- [هرس نشست](/fa/concepts/session-pruning)
- [مرجع پیکربندی Gateway](/fa/gateway/configuration-reference)

## مرتبط

- [مصرف توکن و هزینه‌ها](/fa/reference/token-use)
- [استفاده و هزینه‌های API](/fa/reference/api-usage-costs)
