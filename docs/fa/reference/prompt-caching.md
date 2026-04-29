---
read_when:
    - می‌خواهید هزینه‌های توکن پرامپت را با نگه‌داری کش کاهش دهید
    - در راه‌اندازی‌های چندعاملی به رفتار کشِ مختص هر عامل نیاز دارید
    - در حال تنظیم هم‌زمان Heartbeat و پاک‌سازی cache-ttl هستید
summary: گزینه‌های تنظیم ذخیره‌سازی موقت پرامپت، ترتیب ادغام، رفتار ارائه‌دهنده و الگوهای بهینه‌سازی
title: ذخیره‌سازی پرامپت در کش
x-i18n:
    generated_at: "2026-04-29T23:32:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4f3d1a5751ca0cab4c5b83c8933ec732b58c60d430e00c24ae9a75036aa0a6a3
    source_path: reference/prompt-caching.md
    workflow: 16
---

ذخیره‌سازی پرامپت در کش یعنی ارائه‌دهنده مدل می‌تواند پیشوندهای بدون‌تغییر پرامپت (معمولاً دستورالعمل‌های system/developer و سایر زمینه‌های پایدار) را در نوبت‌های مختلف دوباره استفاده کند، به‌جای اینکه هر بار آن‌ها را از نو پردازش کند. OpenClaw مصرف ارائه‌دهنده را به `cacheRead` و `cacheWrite` نرمال‌سازی می‌کند، در مواردی که API بالادستی این شمارنده‌ها را مستقیماً ارائه می‌دهد.

سطح‌های وضعیت همچنین می‌توانند شمارنده‌های کش را از جدیدترین لاگ مصرف transcript بازیابی کنند، وقتی snapshot نشست زنده آن‌ها را ندارد؛ بنابراین `/status` می‌تواند پس از از دست رفتن بخشی از فراداده نشست همچنان خط کش را نشان دهد. مقدارهای زنده غیرصفر موجود برای کش همچنان بر مقدارهای fallback از transcript اولویت دارند.

چرایی اهمیت: هزینه کمتر توکن، پاسخ‌های سریع‌تر، و کارایی قابل‌پیش‌بینی‌تر برای نشست‌های طولانی‌مدت. بدون کش، پرامپت‌های تکراری در هر نوبت کل هزینه پرامپت را می‌پردازند، حتی وقتی بیشتر ورودی تغییر نکرده است.

بخش‌های زیر همه تنظیمات مرتبط با کش را که بر استفاده دوباره از پرامپت و هزینه توکن اثر می‌گذارند پوشش می‌دهند.

ارجاع‌های ارائه‌دهنده:

- ذخیره‌سازی پرامپت Anthropic در کش: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- ذخیره‌سازی پرامپت OpenAI در کش: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- هدرهای API و شناسه‌های درخواست OpenAI: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- شناسه‌های درخواست و خطاهای Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## تنظیمات اصلی

### `cacheRetention` (پیش‌فرض سراسری، مدل، و برای هر عامل)

ماندگاری کش را به‌عنوان پیش‌فرض سراسری برای همه مدل‌ها تنظیم کنید:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

بازنویسی برای هر مدل:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

بازنویسی برای هر عامل:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

ترتیب ادغام پیکربندی:

1. `agents.defaults.params` (پیش‌فرض سراسری — برای همه مدل‌ها اعمال می‌شود)
2. `agents.defaults.models["provider/model"].params` (بازنویسی برای هر مدل)
3. `agents.list[].params` (شناسه عامل مطابق؛ بر اساس کلید بازنویسی می‌کند)

### `contextPruning.mode: "cache-ttl"`

زمینه قدیمی نتایج ابزار را پس از پنجره‌های TTL کش هرس می‌کند تا درخواست‌های پس از بیکاری، تاریخچه بیش‌ازحد بزرگ را دوباره کش نکنند.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

برای رفتار کامل، [هرس نشست](/fa/concepts/session-pruning) را ببینید.

### گرم نگه داشتن با Heartbeat

Heartbeat می‌تواند پنجره‌های کش را گرم نگه دارد و نوشتن‌های تکراری کش پس از فاصله‌های بیکاری را کاهش دهد.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat برای هر عامل در `agents.list[].heartbeat` پشتیبانی می‌شود.

## رفتار ارائه‌دهنده

### Anthropic (API مستقیم)

- `cacheRetention` پشتیبانی می‌شود.
- با پروفایل‌های احراز هویت کلید API Anthropic، وقتی تنظیم نشده باشد OpenClaw برای ارجاع‌های مدل Anthropic مقدار `cacheRetention: "short"` را seed می‌کند.
- پاسخ‌های بومی Messages در Anthropic هم `cache_read_input_tokens` و هم `cache_creation_input_tokens` را ارائه می‌دهند، بنابراین OpenClaw می‌تواند هر دو `cacheRead` و `cacheWrite` را نشان دهد.
- برای درخواست‌های بومی Anthropic، `cacheRetention: "short"` به کش موقت پیش‌فرض ۵ دقیقه‌ای نگاشت می‌شود، و `cacheRetention: "long"` فقط روی میزبان‌های مستقیم `api.anthropic.com` به TTL یک‌ساعته ارتقا می‌یابد.

### OpenAI (API مستقیم)

- ذخیره‌سازی پرامپت در کش روی مدل‌های جدید پشتیبانی‌شده خودکار است. OpenClaw نیازی ندارد نشانگرهای کش در سطح بلوک تزریق کند.
- OpenClaw از `prompt_cache_key` استفاده می‌کند تا مسیریابی کش در نوبت‌ها پایدار بماند، و فقط وقتی `cacheRetention: "long"` روی میزبان‌های مستقیم OpenAI انتخاب شده باشد از `prompt_cache_retention: "24h"` استفاده می‌کند.
- ارائه‌دهندگان Completions سازگار با OpenAI فقط وقتی `prompt_cache_key` را دریافت می‌کنند که پیکربندی مدل آن‌ها صراحتاً `compat.supportsPromptCacheKey: true` را تنظیم کرده باشد؛ `cacheRetention: "none"` همچنان آن را سرکوب می‌کند.
- پاسخ‌های OpenAI توکن‌های پرامپت کش‌شده را از طریق `usage.prompt_tokens_details.cached_tokens` ارائه می‌دهند (یا `input_tokens_details.cached_tokens` روی رویدادهای Responses API). OpenClaw آن را به `cacheRead` نگاشت می‌کند.
- OpenAI شمارنده جداگانه‌ای برای توکن‌های نوشتن کش ارائه نمی‌دهد، بنابراین `cacheWrite` در مسیرهای OpenAI حتی وقتی ارائه‌دهنده در حال گرم کردن کش است `0` می‌ماند.
- OpenAI هدرهای مفید برای ردگیری و محدودیت نرخ مثل `x-request-id`، `openai-processing-ms`، و `x-ratelimit-*` برمی‌گرداند، اما حسابداری cache-hit باید از payload مصرف بیاید، نه از هدرها.
- در عمل، OpenAI اغلب مانند کش پیشوند اولیه رفتار می‌کند، نه استفاده دوباره از کل تاریخچه متحرک به سبک Anthropic. نوبت‌های متنی با پیشوند بلند پایدار در probeهای زنده فعلی می‌توانند نزدیک به سکوی `4864` توکن کش‌شده قرار بگیرند، درحالی‌که transcriptهای سنگین از ابزار یا سبک MCP اغلب حتی در تکرارهای دقیق نزدیک به `4608` توکن کش‌شده ثابت می‌شوند.

### Anthropic Vertex

- مدل‌های Anthropic روی Vertex AI (`anthropic-vertex/*`) از `cacheRetention` همانند Anthropic مستقیم پشتیبانی می‌کنند.
- `cacheRetention: "long"` روی endpointهای Vertex AI به TTL واقعی یک‌ساعته کش پرامپت نگاشت می‌شود.
- ماندگاری پیش‌فرض کش برای `anthropic-vertex` با پیش‌فرض‌های Anthropic مستقیم مطابقت دارد.
- درخواست‌های Vertex از مسیر شکل‌دهی کش آگاه از مرز عبور داده می‌شوند تا استفاده دوباره از کش با آنچه ارائه‌دهندگان واقعاً دریافت می‌کنند هم‌راستا بماند.

### Amazon Bedrock

- ارجاع‌های مدل Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) از عبور صریح `cacheRetention` پشتیبانی می‌کنند.
- مدل‌های غیر Anthropic در Bedrock در زمان اجرا مجبور به `cacheRetention: "none"` می‌شوند.

### مدل‌های OpenRouter

برای ارجاع‌های مدل `openrouter/anthropic/*`، OpenClaw روی بلوک‌های پرامپت system/developer مقدار Anthropic `cache_control` را تزریق می‌کند تا استفاده دوباره از کش پرامپت بهبود یابد، فقط وقتی درخواست هنوز یک مسیر OpenRouter تأییدشده را هدف گرفته باشد (`openrouter` روی endpoint پیش‌فرض خودش، یا هر ارائه‌دهنده/base URL که به `openrouter.ai` resolve شود).

برای ارجاع‌های مدل `openrouter/deepseek/*`، `openrouter/moonshot*/*`، و `openrouter/zai/*`، مقدار `contextPruning.mode: "cache-ttl"` مجاز است، چون OpenRouter ذخیره‌سازی پرامپت سمت ارائه‌دهنده را خودکار مدیریت می‌کند. OpenClaw نشانگرهای Anthropic `cache_control` را در آن درخواست‌ها تزریق نمی‌کند.

ساخت کش DeepSeek به‌صورت best-effort است و می‌تواند چند ثانیه طول بکشد. یک پیگیری فوری ممکن است هنوز `cached_tokens: 0` نشان دهد؛ با یک درخواست تکراری با همان پیشوند پس از یک تأخیر کوتاه بررسی کنید و از `usage.prompt_tokens_details.cached_tokens` به‌عنوان سیگنال cache-hit استفاده کنید.

اگر مدل را به یک URL پروکسی دلخواه سازگار با OpenAI منتقل کنید، OpenClaw تزریق آن نشانگرهای کش Anthropic مخصوص OpenRouter را متوقف می‌کند.

### سایر ارائه‌دهندگان

اگر ارائه‌دهنده از این حالت کش پشتیبانی نکند، `cacheRetention` اثری ندارد.

### API مستقیم Google Gemini

- انتقال مستقیم Gemini (`api: "google-generative-ai"`) برخوردهای کش را از طریق `cachedContentTokenCount` بالادستی گزارش می‌کند؛ OpenClaw آن را به `cacheRead` نگاشت می‌کند.
- وقتی `cacheRetention` روی یک مدل مستقیم Gemini تنظیم شده باشد، OpenClaw به‌طور خودکار منابع `cachedContents` را برای پرامپت‌های system در اجرای Google AI Studio ایجاد، دوباره استفاده، و تازه‌سازی می‌کند. این یعنی دیگر لازم نیست handle محتوای کش‌شده را دستی از قبل ایجاد کنید.
- همچنان می‌توانید یک handle محتوای کش‌شده Gemini از پیش موجود را به‌عنوان `params.cachedContent` (یا `params.cached_content` قدیمی) روی مدل پیکربندی‌شده ارسال کنید.
- این از ذخیره‌سازی کش پیشوند پرامپت Anthropic/OpenAI جداست. برای Gemini، OpenClaw به‌جای تزریق نشانگرهای کش در درخواست، یک منبع بومی ارائه‌دهنده `cachedContents` را مدیریت می‌کند.

### مصرف JSON در Gemini CLI

- خروجی JSON در Gemini CLI همچنین می‌تواند برخوردهای کش را از طریق `stats.cached` نشان دهد؛ OpenClaw آن را به `cacheRead` نگاشت می‌کند.
- اگر CLI مقدار مستقیم `stats.input` را حذف کند، OpenClaw توکن‌های ورودی را از `stats.input_tokens - stats.cached` استخراج می‌کند.
- این فقط نرمال‌سازی مصرف است. به این معنی نیست که OpenClaw نشانگرهای کش پرامپت به سبک Anthropic/OpenAI برای Gemini CLI ایجاد می‌کند.

## مرز کش پرامپت system

OpenClaw پرامپت system را به یک **پیشوند پایدار** و یک **پسوند ناپایدار** تقسیم می‌کند که با یک مرز داخلی پیشوند کش از هم جدا شده‌اند. محتوای بالای مرز (تعریف‌های ابزار، فراداده Skills، فایل‌های workspace، و سایر زمینه‌های نسبتاً ایستا) به‌گونه‌ای مرتب می‌شود که در نوبت‌ها از نظر بایتی یکسان بماند. محتوای پایین مرز (برای مثال `HEARTBEAT.md`، timestampهای زمان اجرا، و سایر فراداده‌های هر نوبت) اجازه دارد بدون باطل کردن پیشوند کش‌شده تغییر کند.

انتخاب‌های طراحی کلیدی:

- فایل‌های پایدار زمینه پروژه workspace پیش از `HEARTBEAT.md` مرتب می‌شوند تا churn مربوط به heartbeat پیشوند پایدار را خراب نکند.
- این مرز در شکل‌دهی انتقال‌های خانواده Anthropic، خانواده OpenAI، Google، و CLI اعمال می‌شود تا همه ارائه‌دهندگان پشتیبانی‌شده از همان پایداری پیشوند بهره ببرند.
- درخواست‌های Codex Responses و Anthropic Vertex از مسیر شکل‌دهی کش آگاه از مرز عبور داده می‌شوند تا استفاده دوباره از کش با آنچه ارائه‌دهندگان واقعاً دریافت می‌کنند هم‌راستا بماند.
- اثرانگشت‌های پرامپت system نرمال‌سازی می‌شوند (فاصله‌گذاری، پایان خط‌ها، زمینه افزوده‌شده توسط hook، ترتیب قابلیت‌های زمان اجرا) تا پرامپت‌هایی که از نظر معنایی بدون‌تغییر هستند در نوبت‌ها KV/کش مشترک داشته باشند.

اگر پس از تغییر پیکربندی یا workspace جهش‌های غیرمنتظره `cacheWrite` می‌بینید، بررسی کنید که تغییر بالای مرز کش قرار می‌گیرد یا پایین آن. انتقال محتوای ناپایدار به پایین مرز (یا پایدار کردن آن) اغلب مشکل را حل می‌کند.

## محافظ‌های پایداری کش OpenClaw

OpenClaw همچنین چند شکل payload حساس به کش را پیش از رسیدن درخواست به ارائه‌دهنده قطعی و پایدار نگه می‌دارد:

- کاتالوگ‌های ابزار Bundle MCP پیش از ثبت ابزار به‌صورت قطعی sort می‌شوند، بنابراین تغییرهای ترتیب `listTools()` باعث churn در بلوک ابزارها و خراب شدن پیشوندهای کش پرامپت نمی‌شوند.
- نشست‌های قدیمی با بلوک‌های تصویر ماندگار، **۳ نوبت کامل‌شده جدیدتر** را دست‌نخورده نگه می‌دارند؛ بلوک‌های تصویر قدیمی‌تر که قبلاً پردازش شده‌اند ممکن است با یک نشانگر جایگزین شوند تا پیگیری‌های سنگین از تصویر مدام payloadهای قدیمی بزرگ را دوباره نفرستند.

## الگوهای تنظیم

### ترافیک ترکیبی (پیش‌فرض پیشنهادی)

یک baseline بلندمدت را روی عامل اصلی خود نگه دارید، و کش را برای عامل‌های notifier انفجاری غیرفعال کنید:

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
- Heartbeat را فقط برای عامل‌هایی که از کش‌های گرم سود می‌برند پایین‌تر از TTL خود نگه دارید.

## عیب‌یابی کش

OpenClaw عیب‌یابی‌های اختصاصی cache-trace را برای اجرای عامل‌های embedded ارائه می‌دهد.

برای عیب‌یابی معمول روبه‌روی کاربر، `/status` و سایر خلاصه‌های مصرف می‌توانند جدیدترین ورودی مصرف transcript را به‌عنوان منبع fallback برای `cacheRead` / `cacheWrite` استفاده کنند، وقتی ورودی نشست زنده این شمارنده‌ها را ندارد.

## تست‌های رگرسیون زنده

OpenClaw یک gate رگرسیون کش زنده ترکیبی برای پیشوندهای تکراری، نوبت‌های ابزار، نوبت‌های تصویر، transcriptهای ابزار سبک MCP، و کنترل بدون کش Anthropic نگه می‌دارد.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

gate زنده محدود را با این فرمان اجرا کنید:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

فایل baseline جدیدترین اعداد زنده مشاهده‌شده به‌همراه کف‌های رگرسیون مخصوص ارائه‌دهنده را که تست استفاده می‌کند ذخیره می‌کند.
runner همچنین از شناسه‌های نشست و namespaceهای پرامپت تازه برای هر اجرا استفاده می‌کند تا وضعیت کش قبلی نمونه رگرسیون فعلی را آلوده نکند.

این تست‌ها عمداً از معیارهای موفقیت یکسان در همه ارائه‌دهندگان استفاده نمی‌کنند.

### انتظارهای زنده Anthropic

- انتظار نوشتن‌های warmup صریح از طریق `cacheWrite` را داشته باشید.
- انتظار استفاده دوباره نزدیک به کل تاریخچه در نوبت‌های تکراری را داشته باشید، چون کنترل کش Anthropic نقطه شکست کش را در طول مکالمه جلو می‌برد.
- assertionهای زنده فعلی همچنان از آستانه‌های hit-rate بالا برای مسیرهای پایدار، ابزار، و تصویر استفاده می‌کنند.

### انتظارهای زنده OpenAI

- فقط انتظار `cacheRead` را داشته باشید. `cacheWrite` همچنان `0` می‌ماند.
- استفادهٔ دوباره از کش در نوبت‌های تکراری را به‌عنوان یک سکوی پایدار مختص ارائه‌دهنده در نظر بگیرید، نه استفادهٔ دوبارهٔ متحرک از کل تاریخچه به سبک Anthropic.
- ادعاهای زندهٔ فعلی از بررسی‌های کف محافظه‌کارانه استفاده می‌کنند که از رفتار زندهٔ مشاهده‌شده روی `gpt-5.4-mini` به دست آمده‌اند:
  - پیشوند پایدار: `cacheRead >= 4608`، نرخ برخورد `>= 0.90`
  - رونوشت ابزار: `cacheRead >= 4096`، نرخ برخورد `>= 0.85`
  - رونوشت تصویر: `cacheRead >= 3840`، نرخ برخورد `>= 0.82`
  - رونوشت به سبک MCP: `cacheRead >= 4096`، نرخ برخورد `>= 0.85`

راستی‌آزمایی زندهٔ ترکیبی تازه در 2026-04-04 به این مقادیر رسید:

- پیشوند پایدار: `cacheRead=4864`، نرخ برخورد `0.966`
- رونوشت ابزار: `cacheRead=4608`، نرخ برخورد `0.896`
- رونوشت تصویر: `cacheRead=4864`، نرخ برخورد `0.954`
- رونوشت به سبک MCP: `cacheRead=4608`، نرخ برخورد `0.891`

زمان دیواری محلی اخیر برای گیت ترکیبی حدود `88s` بود.

چرا ادعاها متفاوت‌اند:

- Anthropic نقاط شکست صریح کش و استفادهٔ دوبارهٔ متحرک از تاریخچهٔ مکالمه را آشکار می‌کند.
- کش پرامپت OpenAI همچنان به پیشوند دقیق حساس است، اما پیشوند قابل‌استفادهٔ مؤثر در ترافیک زندهٔ Responses می‌تواند زودتر از کل پرامپت به سکوی پایدار برسد.
- به همین دلیل، مقایسهٔ Anthropic و OpenAI با یک آستانهٔ درصدی واحد میان ارائه‌دهنده‌ها رگرسیون‌های کاذب ایجاد می‌کند.

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

### کلیدهای تغییر محیطی (اشکال‌زدایی موردی)

- `OPENCLAW_CACHE_TRACE=1` رهگیری کش را فعال می‌کند.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` مسیر خروجی را بازنویسی می‌کند.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` ضبط بار کامل پیام را تغییر می‌دهد.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` ضبط متن پرامپت را تغییر می‌دهد.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` ضبط پرامپت سیستم را تغییر می‌دهد.

### چه چیزی را بررسی کنید

- رویدادهای رهگیری کش JSONL هستند و نماهای مرحله‌ای مانند `session:loaded`، `prompt:before`، `stream:context` و `session:after` را شامل می‌شوند.
- اثر توکن کش در هر نوبت از طریق `cacheRead` و `cacheWrite` در سطح‌های استفادهٔ عادی قابل مشاهده است (برای مثال `/usage full` و خلاصه‌های استفادهٔ نشست).
- برای Anthropic، هنگام فعال بودن کش، انتظار هر دو مقدار `cacheRead` و `cacheWrite` را داشته باشید.
- برای OpenAI، در برخوردهای کش انتظار `cacheRead` را داشته باشید و انتظار داشته باشید `cacheWrite` برابر `0` بماند؛ OpenAI فیلد جداگانه‌ای برای توکن نوشتن در کش منتشر نمی‌کند.
- اگر به رهگیری درخواست نیاز دارید، شناسه‌های درخواست و سرآیندهای محدودیت نرخ را جدا از معیارهای کش ثبت کنید. خروجی رهگیری کش فعلی OpenClaw به‌جای سرآیندهای خام پاسخ ارائه‌دهنده، بر شکل پرامپت/نشست و استفادهٔ توکن نرمال‌شده متمرکز است.

## عیب‌یابی سریع

- `cacheWrite` بالا در بیشتر نوبت‌ها: ورودی‌های فرّار پرامپت سیستم را بررسی کنید و مطمئن شوید مدل/ارائه‌دهنده از تنظیمات کش شما پشتیبانی می‌کند.
- `cacheWrite` بالا در Anthropic: اغلب یعنی نقطهٔ شکست کش روی محتوایی قرار می‌گیرد که در هر درخواست تغییر می‌کند.
- `cacheRead` پایین در OpenAI: مطمئن شوید پیشوند پایدار در ابتدا قرار دارد، پیشوند تکراری دست‌کم 1024 توکن است، و همان `prompt_cache_key` برای نوبت‌هایی که باید کش مشترک داشته باشند دوباره استفاده می‌شود.
- بی‌اثر بودن `cacheRetention`: تأیید کنید کلید مدل با `agents.defaults.models["provider/model"]` مطابقت دارد.
- درخواست‌های Bedrock Nova/Mistral با تنظیمات کش: اعمال اجباری زمان اجرا روی `none` مورد انتظار است.

مستندات مرتبط:

- [Anthropic](/fa/providers/anthropic)
- [استفاده و هزینه‌های توکن](/fa/reference/token-use)
- [هرس نشست](/fa/concepts/session-pruning)
- [مرجع پیکربندی Gateway](/fa/gateway/configuration-reference)

## مرتبط

- [استفاده و هزینه‌های توکن](/fa/reference/token-use)
- [استفاده و هزینه‌های API](/fa/reference/api-usage-costs)
