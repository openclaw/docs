---
read_when:
    - استخراج وبِ مبتنی بر Firecrawl می‌خواهید
    - به یک کلید API Firecrawl نیاز دارید
    - شما Firecrawl را به‌عنوان ارائه‌دهندهٔ web_search می‌خواهید
    - شما استخراج ضدبات را برای web_fetch می‌خواهید
summary: جست‌وجو و استخراج با Firecrawl و جایگزین پشتیبان web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-05-02T12:05:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0570fde055cf8028cddf78f1ba19225d10cccd0662f45d063f23a39b4a82a7e0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw می‌تواند از **Firecrawl** به سه روش استفاده کند:

- به‌عنوان ارائه‌دهنده `web_search`
- به‌عنوان ابزارهای صریح Plugin: `firecrawl_search` و `firecrawl_scrape`
- به‌عنوان استخراج‌کننده جایگزین برای `web_fetch`

این یک سرویس میزبانی‌شده برای استخراج/جست‌وجو است که از دور زدن محدودیت‌های ضدربات و کش پشتیبانی می‌کند،
که برای سایت‌های سنگین از نظر JS یا صفحه‌هایی که واکشی‌های ساده HTTP را مسدود می‌کنند مفید است.

## دریافت کلید API

1. یک حساب Firecrawl ایجاد کنید و یک کلید API بسازید.
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

نکته‌ها:

- انتخاب Firecrawl در فرایند راه‌اندازی اولیه یا `openclaw configure --section web`، Plugin همراه Firecrawl را به‌صورت خودکار فعال می‌کند.
- `web_search` با Firecrawl از `query` و `count` پشتیبانی می‌کند.
- برای کنترل‌های ویژه Firecrawl مانند `sources`، `categories`، یا استخراج نتایج، از `firecrawl_search` استفاده کنید.
- مقدار پیش‌فرض `baseUrl` برابر Firecrawl میزبانی‌شده در `https://api.firecrawl.dev` است. بازنویسی‌های خودمیزبان فقط برای endpointهای خصوصی/داخلی مجاز هستند؛ HTTP فقط برای همان مقصدهای خصوصی پذیرفته می‌شود.
- `FIRECRAWL_BASE_URL` جایگزین محیطی مشترک برای نشانی‌های پایه جست‌وجو و استخراج Firecrawl است.

## پیکربندی استخراج Firecrawl + جایگزین web_fetch

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

نکته‌ها:

- تلاش‌های جایگزین Firecrawl فقط زمانی اجرا می‌شوند که یک کلید API در دسترس باشد (`plugins.entries.firecrawl.config.webFetch.apiKey` یا `FIRECRAWL_API_KEY`).
- `maxAgeMs` کنترل می‌کند نتایج کش‌شده چقدر می‌توانند قدیمی باشند (ms). مقدار پیش‌فرض ۲ روز است.
- پیکربندی قدیمی `tools.web.fetch.firecrawl.*` با `openclaw doctor --fix` به‌صورت خودکار مهاجرت داده می‌شود.
- بازنویسی‌های نشانی استخراج/پایه Firecrawl همان قاعده میزبانی‌شده/خصوصی جست‌وجو را دنبال می‌کنند: ترافیک عمومی میزبانی‌شده از `https://api.firecrawl.dev` استفاده می‌کند؛ بازنویسی‌های خودمیزبان باید به endpointهای خصوصی/داخلی resolve شوند.
- `firecrawl_scrape` پیش از ارسال URLهای مقصد به Firecrawl، URLهای آشکارا خصوصی، loopback، metadata و غیر HTTP(S) را رد می‌کند، و با قرارداد ایمنی مقصد `web_fetch` برای فراخوانی‌های صریح استخراج Firecrawl هم‌خوان است.

`firecrawl_scrape` از همان تنظیمات و متغیرهای محیطی `plugins.entries.firecrawl.config.webFetch.*` دوباره استفاده می‌کند.

### Firecrawl خودمیزبان

وقتی Firecrawl را خودتان اجرا می‌کنید، `plugins.entries.firecrawl.config.webSearch.baseUrl`،
`plugins.entries.firecrawl.config.webFetch.baseUrl`، یا `FIRECRAWL_BASE_URL`
را تنظیم کنید. OpenClaw فقط برای مقصدهای loopback،
شبکه خصوصی، `.local`، `.internal`، یا `.localhost` مقدار `http://` را می‌پذیرد. میزبان‌های سفارشی عمومی رد می‌شوند تا کلیدهای API Firecrawl به‌طور
تصادفی به endpointهای دلخواه ارسال نشوند.

## ابزارهای Plugin Firecrawl

### `firecrawl_search`

وقتی به‌جای `web_search` عمومی، کنترل‌های جست‌وجوی ویژه Firecrawl را می‌خواهید از این استفاده کنید.

پارامترهای اصلی:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

از این برای صفحه‌های سنگین از نظر JS یا محافظت‌شده در برابر ربات استفاده کنید که `web_fetch` ساده در آن‌ها ضعیف است.

پارامترهای اصلی:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## پنهان‌کاری / دور زدن ضدربات

Firecrawl یک پارامتر **حالت proxy** برای دور زدن ضدربات ارائه می‌کند (`basic`، `stealth`، یا `auto`).
OpenClaw همیشه برای درخواست‌های Firecrawl از `proxy: "auto"` به‌همراه `storeInCache: true` استفاده می‌کند.
اگر proxy حذف شود، Firecrawl به‌صورت پیش‌فرض از `auto` استفاده می‌کند. اگر تلاش basic شکست بخورد، `auto` با proxyهای stealth دوباره تلاش می‌کند، که ممکن است نسبت به استخراج فقط basic اعتبار بیشتری مصرف کند.

## نحوه استفاده `web_fetch` از Firecrawl

ترتیب استخراج `web_fetch`:

1. Readability (محلی)
2. Firecrawl (اگر انتخاب شده باشد یا به‌صورت خودکار به‌عنوان جایگزین فعال web-fetch شناسایی شده باشد)
3. پاک‌سازی پایه HTML (آخرین جایگزین)

دکمه انتخاب `tools.web.fetch.provider` است. اگر آن را حذف کنید، OpenClaw
اولین ارائه‌دهنده آماده web-fetch را از اعتبارنامه‌های موجود به‌صورت خودکار شناسایی می‌کند.
امروز ارائه‌دهنده همراه، Firecrawl است.

## مرتبط

- [نمای کلی Web Search](/fa/tools/web) -- همه ارائه‌دهنده‌ها و شناسایی خودکار
- [Web Fetch](/fa/tools/web-fetch) -- ابزار web_fetch با جایگزین Firecrawl
- [Tavily](/fa/tools/tavily) -- ابزارهای جست‌وجو + استخراج
