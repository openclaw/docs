---
read_when:
    - می‌خواهید از Perplexity Search برای جست‌وجوی وب استفاده کنید
    - باید PERPLEXITY_API_KEY یا OPENROUTER_API_KEY تنظیم شده باشد
summary: سازگاری API جست‌وجوی Perplexity و Sonar/OpenRouter برای web_search
title: جست‌وجوی Perplexity (مسیر قدیمی)
x-i18n:
    generated_at: "2026-04-29T23:09:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 87a7b6e14f636cfe6b7c5833af1b0aecb334a39babbb779c32f29bbbb5c9e14a
    source_path: perplexity.md
    workflow: 16
---

# Perplexity Search API

OpenClaw از Perplexity Search API به‌عنوان یک ارائه‌دهنده `web_search` پشتیبانی می‌کند.
این API نتایج ساختاریافته‌ای با فیلدهای `title`، `url` و `snippet` برمی‌گرداند.

برای سازگاری، OpenClaw از تنظیمات قدیمی Perplexity Sonar/OpenRouter نیز پشتیبانی می‌کند.
اگر از `OPENROUTER_API_KEY`، یک کلید `sk-or-...` در `plugins.entries.perplexity.config.webSearch.apiKey` استفاده کنید، یا `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` را تنظیم کنید، ارائه‌دهنده به مسیر chat-completions تغییر می‌کند و به‌جای نتایج ساختاریافته Search API، پاسخ‌های تولیدشده با هوش مصنوعی همراه با ارجاع‌ها برمی‌گرداند.

## دریافت کلید API برای Perplexity

1. در [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) یک حساب Perplexity بسازید
2. در داشبورد یک کلید API ایجاد کنید
3. کلید را در پیکربندی ذخیره کنید یا `PERPLEXITY_API_KEY` را در محیط Gateway تنظیم کنید.

## سازگاری با OpenRouter

اگر از قبل برای Perplexity Sonar از OpenRouter استفاده می‌کردید، `provider: "perplexity"` را نگه دارید و `OPENROUTER_API_KEY` را در محیط Gateway تنظیم کنید، یا یک کلید `sk-or-...` را در `plugins.entries.perplexity.config.webSearch.apiKey` ذخیره کنید.

کنترل‌های سازگاری اختیاری:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## نمونه‌های پیکربندی

### Perplexity Search API بومی

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### سازگاری OpenRouter / Sonar

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## محل تنظیم کلید

**از طریق پیکربندی:** دستور `openclaw configure --section web` را اجرا کنید. این دستور کلید را در
`~/.openclaw/openclaw.json` زیر `plugins.entries.perplexity.config.webSearch.apiKey` ذخیره می‌کند.
این فیلد اشیای SecretRef را نیز می‌پذیرد.

**از طریق محیط:** `PERPLEXITY_API_KEY` یا `OPENROUTER_API_KEY` را
در محیط فرایند Gateway تنظیم کنید. برای نصب Gateway، آن را در
`~/.openclaw/.env` (یا محیط سرویس خود) قرار دهید. [متغیرهای محیطی](/fa/help/faq#env-vars-and-env-loading) را ببینید.

اگر `provider: "perplexity"` پیکربندی شده باشد و SecretRef کلید Perplexity بدون جایگزین محیطی resolve نشده باشد، راه‌اندازی/بارگذاری مجدد سریعاً شکست می‌خورد.

## پارامترهای ابزار

این پارامترها برای مسیر Perplexity Search API بومی اعمال می‌شوند.

| پارامتر              | توضیح                                                  |
| -------------------- | ------------------------------------------------------ |
| `query`              | پرس‌وجوی جست‌وجو (الزامی)                              |
| `count`              | تعداد نتایجی که برگردانده می‌شود (1-10، پیش‌فرض: 5)    |
| `country`            | کد کشور ISO دوحرفی (مثلاً "US"، "DE")                  |
| `language`           | کد زبان ISO 639-1 (مثلاً "en"، "de"، "fr")             |
| `freshness`          | فیلتر زمانی: `day` (24h)، `week`، `month`، یا `year`    |
| `date_after`         | فقط نتایجی که پس از این تاریخ منتشر شده‌اند (YYYY-MM-DD) |
| `date_before`        | فقط نتایجی که پیش از این تاریخ منتشر شده‌اند (YYYY-MM-DD) |
| `domain_filter`      | آرایه فهرست مجاز/فهرست مسدود دامنه‌ها (حداکثر 20)      |
| `max_tokens`         | بودجه کل محتوا (پیش‌فرض: 25000، حداکثر: 1000000)       |
| `max_tokens_per_page` | محدودیت توکن برای هر صفحه (پیش‌فرض: 2048)              |

برای مسیر سازگاری قدیمی Sonar/OpenRouter:

- `query`، `count` و `freshness` پذیرفته می‌شوند
- `count` در آنجا فقط برای سازگاری است؛ پاسخ همچنان یک پاسخ تولیدشده
  همراه با ارجاع‌ها است، نه فهرستی با N نتیجه
- فیلترهای مختص Search API مانند `country`، `language`، `date_after`،
  `date_before`، `domain_filter`، `max_tokens` و `max_tokens_per_page`
  خطاهای صریح برمی‌گردانند

**نمونه‌ها:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Domain filtering (denylist - prefix with -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// More content extraction
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### قواعد فیلتر دامنه

- حداکثر 20 دامنه برای هر فیلتر
- نمی‌توان فهرست مجاز و فهرست مسدود را در یک درخواست ترکیب کرد
- برای ورودی‌های فهرست مسدود از پیشوند `-` استفاده کنید (مثلاً `["-reddit.com"]`)

## یادداشت‌ها

- Perplexity Search API نتایج جست‌وجوی وب ساختاریافته (`title`، `url`، `snippet`) برمی‌گرداند
- OpenRouter یا `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` صریح، برای سازگاری Perplexity را دوباره به chat completions در Sonar تغییر می‌دهد
- سازگاری Sonar/OpenRouter یک پاسخ تولیدشده همراه با ارجاع‌ها برمی‌گرداند، نه ردیف‌های نتیجه ساختاریافته
- نتایج به‌طور پیش‌فرض به‌مدت 15 دقیقه cache می‌شوند (قابل پیکربندی از طریق `cacheTtlMinutes`)

برای پیکربندی کامل web_search، [ابزارهای وب](/fa/tools/web) را ببینید.
برای جزئیات بیشتر، [مستندات Perplexity Search API](https://docs.perplexity.ai/docs/search/quickstart) را ببینید.

## مرتبط

- [جست‌وجوی Perplexity](/fa/tools/perplexity-search)
- [جست‌وجوی وب](/fa/tools/web)
