---
read_when:
    - می‌خواهید از مدل‌های میزبانی‌شده Ollama بدون سرور محلی Ollama استفاده کنید
    - به شناسهٔ ارائه‌دهنده، کلید یا نقطهٔ پایانی ollama-cloud نیاز دارید
summary: استفاده مستقیم از Ollama Cloud با OpenClaw
title: ابر Ollama
x-i18n:
    generated_at: "2026-07-12T10:45:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud، API میزبانی‌شدهٔ مدل‌های Ollama است. ارائه‌دهندهٔ `ollama-cloud` مستقیماً از طریق API بومی `/api/chat` در Ollama، با `https://ollama.com` تماس می‌گیرد؛ بدون نیاز به سرور محلی Ollama یا برنامهٔ محلی Ollama که در حالت ابری وارد حساب شده باشد. از ارجاع‌های مدلی مانند `ollama-cloud/kimi-k2.6` استفاده کنید.

OpenClaw، ‏`ollama-cloud` را با شناسهٔ ارائه‌دهندهٔ مستقل ثبت می‌کند تا اعتبارنامه‌های مختص فضای ابری، کشف زندهٔ فهرست مدل‌ها و انتخاب مدل با میزبان محلی `ollama` ترکیب نشوند. برای Ollama محلی، مسیریابی ترکیبی ابری و محلی، تعبیه‌ها و جزئیات میزبان سفارشی، به [Ollama](/fa/providers/ollama) مراجعه کنید.

## راه‌اندازی

یک کلید API برای Ollama Cloud در [ollama.com/settings/keys](https://ollama.com/settings/keys) ایجاد کنید، سپس دستور زیر را اجرا کنید:

```bash
openclaw onboard --auth-choice ollama-cloud
```

یا متغیر زیر را تنظیم کنید:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

راه‌اندازی غیرتعاملی کلید را مستقیماً می‌پذیرد:

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

راه‌اندازی، مدل پیش‌فرض را روی `ollama-cloud/kimi-k2.5:cloud` تنظیم می‌کند.

## پیش‌فرض‌ها

- ارائه‌دهنده: `ollama-cloud`
- نشانی پایه: `https://ollama.com`
- متغیر محیطی: `OLLAMA_API_KEY`
- سبک API: ‏`/api/chat` بومی Ollama
- مدل پیش‌فرض راه‌اندازی: `ollama-cloud/kimi-k2.5:cloud`

## چه زمانی Ollama Cloud را انتخاب کنید

- مدل‌های میزبانی‌شدهٔ Ollama را بدون اجرای محلی `ollama serve` می‌خواهید.
- همان ساختار API بومی گفت‌وگوی Ollama را می‌خواهید که OpenClaw برای Ollama محلی استفاده می‌کند، اما با مقصد `https://ollama.com`.
- برای مدل‌هایی که از قبل در فهرست میزبانی‌شدهٔ Ollama قرار دارند، یک مسیر ابری ساده می‌خواهید.
- به دریافت محلی مدل‌ها، کنترل GPU محلی یا استنتاج محدود به LAN نیاز ندارید.

اگر مسیریابی فقط محلی یا ترکیبی ابری و محلی از طریق میزبان Ollama واردشده به حساب را می‌خواهید، به‌جای آن از [Ollama](/fa/providers/ollama) استفاده کنید. اگر به معنای رفتاری `/v1/chat/completions` یا قابلیت‌های مختص ارائه‌دهنده با سبک OpenAI نیاز دارید، از یک ارائه‌دهندهٔ سازگار با OpenAI استفاده کنید.

## مدل‌ها

این ارائه‌دهنده به کلید API نیاز دارد و بدون آن غیرفعال می‌ماند. با وجود کلید، OpenClaw مدل‌های Ollama Cloud را به‌صورت زنده از فهرست میزبانی‌شده کشف می‌کند:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

شناسه‌های میزبانی‌شده در فهرست زنده شامل `deepseek-v4-flash`،‏ `glm-5`،‏ `gpt-oss:20b`،‏ `kimi-k2.6` و `minimax-m2.7` هستند. اگر کشف زنده نتیجه‌ای برنگرداند، OpenClaw به ردیف‌های همراه `kimi-k2.5:cloud`،‏ `minimax-m2.7:cloud`،‏ `glm-5.1:cloud` و `glm-5.2:cloud` بازمی‌گردد.

شناسه‌های مدل، شناسه‌های فهرست ابری هستند، نه نام‌های دریافت محلی. اگر نام مدلی در یک میزبان محلی Ollama کار می‌کند اما در فهرست میزبانی‌شده وجود ندارد، به‌جای آن از ارائه‌دهندهٔ `ollama` با همان میزبان محلی استفاده کنید.

## آزمون زنده

برای آزمون‌های دود کلید API در Ollama Cloud، آزمون زندهٔ Ollama را به نقطهٔ پایانی میزبانی‌شده هدایت کنید و مدلی را از فهرست فعلی خود انتخاب کنید:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

آزمون دود ابری، متن، جریان بومی و جست‌وجوی وب را اجرا می‌کند؛ برای رد کردن جست‌وجوی وب، `OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0` را تنظیم کنید. این آزمون به‌طور پیش‌فرض تعبیه‌ها را برای `https://ollama.com` رد می‌کند، زیرا ممکن است کلیدهای API مربوط به Ollama Cloud مجوز دسترسی به `/api/embed` را نداشته باشند؛ برای اجبار به اجرای آن‌ها، `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` را تنظیم کنید.

## عیب‌یابی

- خطاهای `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY`: یک کلید API واقعی فضای ابری ارائه کنید. نشانگر محلی `ollama-local` فقط برای میزبان‌های محلی یا خصوصی Ollama است.
- خطاهای مدل ناشناخته: دستور `openclaw models list --provider ollama-cloud` را اجرا کنید و شناسهٔ مدل میزبانی‌شده را دقیقاً کپی کنید.
- مشکلات فراخوانی ابزار یا JSON خام در میزبان‌های سفارشی Ollama: بررسی کنید که به‌اشتباه از نشانی `/v1` سازگار با OpenAI استفاده نمی‌کنید. مسیرهای Ollama باید از نشانی پایهٔ بومی و بدون پسوند `/v1` استفاده کنند.

## مرتبط

- [Ollama](/fa/providers/ollama)
- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
- [همهٔ ارائه‌دهندگان](/fa/providers/index)
