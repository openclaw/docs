---
read_when:
    - می‌خواهید از Perplexity Search برای جست‌وجوی وب استفاده کنید
    - باید PERPLEXITY_API_KEY یا OPENROUTER_API_KEY را تنظیم کرده باشید
summary: سازگاری Perplexity Search API و Sonar/OpenRouter برای web_search
title: جست‌وجوی Perplexity
x-i18n:
    generated_at: "2026-06-27T19:03:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ef003238bc38dd3d92b98654598cba05fb1c324d8ca766a683cf1defe5bd435
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw از Perplexity Search API به‌عنوان ارائه‌دهنده‌ی `web_search` پشتیبانی می‌کند.
این API نتایج ساختاریافته را با فیلدهای `title`، `url` و `snippet` برمی‌گرداند.

برای سازگاری، OpenClaw از راه‌اندازی‌های قدیمی Perplexity Sonar/OpenRouter نیز پشتیبانی می‌کند.
اگر از `OPENROUTER_API_KEY`، یک کلید `sk-or-...` در `plugins.entries.perplexity.config.webSearch.apiKey` استفاده کنید، یا `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` را تنظیم کنید، ارائه‌دهنده به مسیر chat-completions تغییر می‌کند و به‌جای نتایج ساختاریافته‌ی Search API، پاسخ‌های تولیدشده با هوش مصنوعی همراه با ارجاع‌ها برمی‌گرداند.

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را بازراه‌اندازی کنید:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## دریافت کلید API از Perplexity

1. در [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) یک حساب Perplexity بسازید
2. در داشبورد یک کلید API ایجاد کنید
3. کلید را در پیکربندی ذخیره کنید یا `PERPLEXITY_API_KEY` را در محیط Gateway تنظیم کنید.

## سازگاری OpenRouter

اگر از قبل برای Perplexity Sonar از OpenRouter استفاده می‌کردید، `provider: "perplexity"` را نگه دارید و `OPENROUTER_API_KEY` را در محیط Gateway تنظیم کنید، یا یک کلید `sk-or-...` را در `plugins.entries.perplexity.config.webSearch.apiKey` ذخیره کنید.

کنترل‌های اختیاری سازگاری:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## نمونه‌های پیکربندی

### API جست‌وجوی بومی Perplexity

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

**از طریق پیکربندی:** `openclaw configure --section web` را اجرا کنید. این دستور کلید را در
`~/.openclaw/openclaw.json` زیر `plugins.entries.perplexity.config.webSearch.apiKey` ذخیره می‌کند.
این فیلد اشیای SecretRef را هم می‌پذیرد.

**از طریق محیط:** `PERPLEXITY_API_KEY` یا `OPENROUTER_API_KEY` را
در محیط پردازش Gateway تنظیم کنید. برای نصب gateway، آن را در
`~/.openclaw/.env` (یا محیط سرویس خودتان) قرار دهید. [متغیرهای محیطی](/fa/help/faq#env-vars-and-env-loading) را ببینید.

اگر `provider: "perplexity"` پیکربندی شده باشد و SecretRef کلید Perplexity بدون جایگزین محیطی حل‌نشده بماند، راه‌اندازی/بارگذاری مجدد سریعاً شکست می‌خورد.

## پارامترهای ابزار

این پارامترها برای مسیر API جست‌وجوی بومی Perplexity اعمال می‌شوند.

<ParamField path="query" type="string" required>
پرس‌وجوی جست‌وجو.
</ParamField>

<ParamField path="count" type="number" default="5">
تعداد نتایجی که باید برگردانده شوند (1-10).
</ParamField>

<ParamField path="country" type="string">
کد کشور ISO دوحرفی (مثلاً `US`، `DE`).
</ParamField>

<ParamField path="language" type="string">
کد زبان ISO 639-1 (مثلاً `en`، `de`، `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
فیلتر زمانی - `day` برابر با 24 ساعت است.
</ParamField>

<ParamField path="date_after" type="string">
فقط نتایجی که بعد از این تاریخ منتشر شده‌اند (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
فقط نتایجی که قبل از این تاریخ منتشر شده‌اند (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
آرایه‌ی فهرست مجاز/فهرست مسدود دامنه‌ها (حداکثر 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
بودجه‌ی کل محتوا (حداکثر 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
محدودیت توکن برای هر صفحه.
</ParamField>

برای مسیر سازگاری قدیمی Sonar/OpenRouter:

- `query`، `count` و `freshness` پذیرفته می‌شوند
- `count` در آنجا فقط برای سازگاری است؛ پاسخ همچنان یک پاسخ تولیدشده
  همراه با ارجاع‌ها است، نه یک فهرست Nتایی از نتایج
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
- نمی‌توان فهرست مجاز و فهرست مسدود را در یک درخواست با هم ترکیب کرد
- برای ورودی‌های فهرست مسدود از پیشوند `-` استفاده کنید (مثلاً `["-reddit.com"]`)

## نکات

- Perplexity Search API نتایج ساختاریافته‌ی جست‌وجوی وب را برمی‌گرداند (`title`، `url`، `snippet`)
- OpenRouter یا `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` صریح، Perplexity را برای سازگاری دوباره به تکمیل‌های گفت‌وگویی Sonar تغییر می‌دهد
- سازگاری Sonar/OpenRouter یک پاسخ تولیدشده همراه با ارجاع‌ها برمی‌گرداند، نه ردیف‌های نتیجه‌ی ساختاریافته
- نتایج به‌طور پیش‌فرض برای 15 دقیقه کش می‌شوند (از طریق `cacheTtlMinutes` قابل پیکربندی است)

## مرتبط

<CardGroup cols={2}>
  <Card title="Web search overview" href="/fa/tools/web" icon="globe">
    همه‌ی ارائه‌دهنده‌ها و قواعد تشخیص خودکار.
  </Card>
  <Card title="Brave search" href="/fa/tools/brave-search" icon="shield">
    نتایج ساختاریافته با فیلترهای کشور و زبان.
  </Card>
  <Card title="Exa search" href="/fa/tools/exa-search" icon="magnifying-glass">
    جست‌وجوی عصبی همراه با استخراج محتوا.
  </Card>
  <Card title="Perplexity Search API docs" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    راهنمای شروع سریع و مرجع رسمی Perplexity Search API.
  </Card>
</CardGroup>
