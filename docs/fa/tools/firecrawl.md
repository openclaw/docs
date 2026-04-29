---
read_when:
    - استخراج وب مبتنی بر Firecrawl می‌خواهید
    - به یک کلید API Firecrawl نیاز دارید
    - می‌خواهید از Firecrawl به‌عنوان ارائه‌دهندهٔ web_search استفاده کنید.
    - برای web_fetch استخراج ضدربات می‌خواهید
summary: جست‌وجو، استخراج و مسیر جایگزین web_fetch در Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-04-29T23:42:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cd7a56c3a5c7d7876daddeef9acdbe25272404916250bdf40d1d7ad31388f19
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw می‌تواند از **Firecrawl** به سه روش استفاده کند:

- به‌عنوان ارائه‌دهنده‌ی `web_search`
- به‌عنوان ابزارهای صریح Plugin: `firecrawl_search` و `firecrawl_scrape`
- به‌عنوان استخراج‌کننده‌ی جایگزین برای `web_fetch`

این یک سرویس میزبانی‌شده برای استخراج/جست‌وجو است که از دورزدن ربات و کش‌کردن پشتیبانی می‌کند،
که برای سایت‌های سنگین از نظر JS یا صفحاتی که دریافت ساده‌ی HTTP را مسدود می‌کنند مفید است.

## دریافت کلید API

1. یک حساب Firecrawl بسازید و یک کلید API ایجاد کنید.
2. آن را در پیکربندی ذخیره کنید یا `FIRECRAWL_API_KEY` را در محیط Gateway تنظیم کنید.

## پیکربندی جست‌وجوی Firecrawl

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

نکات:

- انتخاب Firecrawl در راه‌اندازی اولیه یا `openclaw configure --section web`، Plugin داخلی Firecrawl را به‌صورت خودکار فعال می‌کند.
- `web_search` با Firecrawl از `query` و `count` پشتیبانی می‌کند.
- برای کنترل‌های مخصوص Firecrawl مانند `sources`، `categories` یا خزش نتایج، از `firecrawl_search` استفاده کنید.
- بازنویسی‌های `baseUrl` باید روی `https://api.firecrawl.dev` باقی بمانند.
- `FIRECRAWL_BASE_URL` جایگزین محیطی مشترک برای URLهای پایه‌ی جست‌وجو و خزش Firecrawl است.

## پیکربندی خزش Firecrawl + جایگزین `web_fetch`

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

نکات:

- تلاش‌های جایگزین Firecrawl فقط زمانی اجرا می‌شوند که یک کلید API در دسترس باشد (`plugins.entries.firecrawl.config.webFetch.apiKey` یا `FIRECRAWL_API_KEY`).
- `maxAgeMs` کنترل می‌کند نتایج کش‌شده تا چه اندازه می‌توانند قدیمی باشند (ms). پیش‌فرض ۲ روز است.
- پیکربندی قدیمی `tools.web.fetch.firecrawl.*` به‌صورت خودکار توسط `openclaw doctor --fix` مهاجرت داده می‌شود.
- بازنویسی‌های URL پایه/خزش Firecrawl به `https://api.firecrawl.dev` محدود هستند.

`firecrawl_scrape` از همان تنظیمات و متغیرهای محیطی `plugins.entries.firecrawl.config.webFetch.*` دوباره استفاده می‌کند.

## ابزارهای Plugin Firecrawl

### `firecrawl_search`

وقتی به‌جای `web_search` عمومی، کنترل‌های جست‌وجوی مخصوص Firecrawl می‌خواهید، از این استفاده کنید.

پارامترهای اصلی:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

برای صفحات سنگین از نظر JS یا محافظت‌شده در برابر ربات که `web_fetch` ساده در آن‌ها ضعیف است، از این استفاده کنید.

پارامترهای اصلی:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## پنهان‌کاری / دورزدن ربات

Firecrawl برای دورزدن ربات یک پارامتر **حالت پراکسی** ارائه می‌کند (`basic`، `stealth` یا `auto`).
OpenClaw همیشه برای درخواست‌های Firecrawl از `proxy: "auto"` به‌همراه `storeInCache: true` استفاده می‌کند.
اگر پراکسی حذف شود، پیش‌فرض Firecrawl برابر `auto` است. `auto` اگر یک تلاش basic ناموفق شود، با پراکسی‌های stealth دوباره تلاش می‌کند، که ممکن است نسبت به خزش فقط با basic اعتبار بیشتری مصرف کند.

## نحوه‌ی استفاده‌ی `web_fetch` از Firecrawl

ترتیب استخراج `web_fetch`:

1. خوانایی (محلی)
2. Firecrawl (اگر انتخاب شده باشد یا به‌صورت خودکار به‌عنوان جایگزین فعال web-fetch تشخیص داده شده باشد)
3. پاک‌سازی پایه‌ی HTML (آخرین جایگزین)

دکمه‌ی انتخاب `tools.web.fetch.provider` است. اگر آن را حذف کنید، OpenClaw
نخستین ارائه‌دهنده‌ی آماده‌ی web-fetch را از میان اعتبارنامه‌های موجود به‌صورت خودکار تشخیص می‌دهد.
امروز ارائه‌دهنده‌ی داخلی Firecrawl است.

## مرتبط

- [نمای کلی Web Search](/fa/tools/web) -- همه‌ی ارائه‌دهندگان و تشخیص خودکار
- [Web Fetch](/fa/tools/web-fetch) -- ابزار web_fetch با جایگزین Firecrawl
- [Tavily](/fa/tools/tavily) -- ابزارهای جست‌وجو + استخراج
