---
read_when:
    - استخراج محتوای وب با پشتوانهٔ Firecrawl می‌خواهید
    - می‌خواهید از `web_fetch` در Firecrawl بدون کلید استفاده کنید
    - برای جست‌وجو یا بهره‌مندی از محدودیت‌های بالاتر، به کلید API سرویس Firecrawl نیاز دارید
    - می‌خواهید از Firecrawl به‌عنوان ارائه‌دهندهٔ `web_search` استفاده کنید
    - شما استخراج ضدربات را برای `web_fetch` می‌خواهید
summary: جست‌وجو و استخراج با Firecrawl و راهکار جایگزین `web_fetch`
title: فایرکراول
x-i18n:
    generated_at: "2026-07-12T11:01:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw می‌تواند از **Firecrawl** به سه روش استفاده کند:

- به‌عنوان ارائه‌دهندهٔ `web_search`
- به‌عنوان ابزارهای صریح Plugin:‏ `firecrawl_search` و `firecrawl_scrape`
- به‌عنوان استخراج‌کنندهٔ پشتیبان برای `web_fetch`

این یک سرویس میزبانی‌شدهٔ استخراج/جست‌وجو است که از دور زدن ربات و ذخیره‌سازی موقت پشتیبانی می‌کند؛ قابلیتی که برای سایت‌های متکی بر JS یا صفحاتی که واکشی سادهٔ HTTP را مسدود می‌کنند مفید است.

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را راه‌اندازی مجدد کنید:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch بدون کلید و کلیدهای API

گزینهٔ پشتیبان میزبانی‌شدهٔ Firecrawl برای `web_fetch` که به‌طور صریح انتخاب شده است، دسترسی اولیه را بدون کلید API فراهم می‌کند. هنگامی که به محدودیت‌های بالاتری نیاز دارید، `FIRECRAWL_API_KEY` را در محیط Gateway اضافه یا آن را پیکربندی کنید. `web_search` و `firecrawl_scrape` در Firecrawl به کلید API نیاز دارند.

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

- انتخاب Firecrawl در راه‌اندازی اولیه یا `openclaw configure --section web`، Plugin نصب‌شدهٔ Firecrawl را به‌طور خودکار فعال می‌کند.
- `web_search` با Firecrawl از `query` و `count` پشتیبانی می‌کند.
- برای کنترل‌های ویژهٔ Firecrawl مانند `sources`،‏ `categories` یا خراش‌دادن نتایج، از `firecrawl_search` استفاده کنید.
- مقدار پیش‌فرض `baseUrl`، سرویس میزبانی‌شدهٔ Firecrawl در `https://api.firecrawl.dev` است. بازنویسی‌های خودمیزبان فقط برای نقاط پایانی خصوصی/داخلی مجاز هستند؛ HTTP فقط برای همان مقصدهای خصوصی پذیرفته می‌شود.
- `FIRECRAWL_BASE_URL` متغیر محیطی پشتیبان مشترک برای URLهای پایهٔ جست‌وجو و خراش‌دادن Firecrawl است.
- مهلت زمانی پیش‌فرض درخواست‌های جست‌وجوی Firecrawl برابر ۳۰ ثانیه است؛ پارامتر `timeoutSeconds` در `firecrawl_search` آن را برای هر فراخوانی بازنویسی می‌کند.

## پیکربندی گزینهٔ پشتیبان Firecrawl برای web_fetch

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // انتخاب صریح، گزینهٔ پشتیبان بدون کلید را فعال می‌کند
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
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

- گزینهٔ پشتیبان Firecrawl برای `web_fetch` که به‌طور صریح انتخاب شده است، بدون کلید API کار می‌کند. در صورت پیکربندی، OpenClaw برای دستیابی به محدودیت‌های بالاتر، `plugins.entries.firecrawl.config.webFetch.apiKey` یا `FIRECRAWL_API_KEY` را ارسال می‌کند.
- انتخاب Firecrawl هنگام راه‌اندازی اولیه یا اجرای `openclaw configure --section web`،‏ Plugin را فعال می‌کند و Firecrawl را برای `web_fetch` انتخاب می‌کند، مگر اینکه ارائه‌دهندهٔ واکشی دیگری از قبل پیکربندی شده باشد.
- `firecrawl_scrape` به کلید API نیاز دارد.
- `maxAgeMs` میزان قدیمی‌بودن مجاز نتایج ذخیره‌شده در حافظهٔ موقت را کنترل می‌کند (میلی‌ثانیه). مقدار پیش‌فرض ۱۷۲٬۸۰۰٬۰۰۰ میلی‌ثانیه (۲ روز) است.
- مقدار پیش‌فرض `onlyMainContent` برابر `true` و مقدار پیش‌فرض `timeoutSeconds` برابر ۶۰ است.
- پیکربندی قدیمی `tools.web.fetch.firecrawl.*` و `tools.web.search.firecrawl.*` به‌طور خودکار با `openclaw doctor --fix` مهاجرت داده می‌شود.
- بازنویسی‌های URL پایه/خراش‌دادن Firecrawl از همان قاعدهٔ میزبانی‌شده/خصوصی جست‌وجو پیروی می‌کنند: ترافیک میزبانی‌شدهٔ عمومی از `https://api.firecrawl.dev` استفاده می‌کند؛ بازنویسی‌های خودمیزبان باید به نقاط پایانی خصوصی/داخلی منتهی شوند.
- `firecrawl_scrape` پیش از ارسال URLهای مقصد به Firecrawl، مقصدهای آشکارا خصوصی، local loopback، فراداده و URLهای غیر HTTP(S) را رد می‌کند و برای فراخوانی‌های صریح خراش‌دادن Firecrawl از قرارداد ایمنی مقصد `web_fetch` پیروی می‌کند.

`firecrawl_scrape` از همان تنظیمات و متغیرهای محیطی `plugins.entries.firecrawl.config.webFetch.*`، از جمله کلید API الزامی آن، دوباره استفاده می‌کند.

### Firecrawl خودمیزبان

هنگامی که Firecrawl را خودتان اجرا می‌کنید، `plugins.entries.firecrawl.config.webSearch.baseUrl`،‏ `plugins.entries.firecrawl.config.webFetch.baseUrl` یا `FIRECRAWL_BASE_URL` را تنظیم کنید. OpenClaw فقط برای مقصدهای local loopback، شبکهٔ خصوصی، `.local`،‏ `.internal` یا `.localhost`، نشانی `http://` را می‌پذیرد. میزبان‌های سفارشی عمومی رد می‌شوند تا کلیدهای API مربوط به Firecrawl به‌طور تصادفی به نقاط پایانی دلخواه ارسال نشوند.

## ابزارهای Plugin مربوط به Firecrawl

### `firecrawl_search`

هنگامی که به‌جای `web_search` عمومی به کنترل‌های جست‌وجوی ویژهٔ Firecrawl نیاز دارید، از این ابزار استفاده کنید.

پارامترها:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

برای صفحات متکی بر JS یا محافظت‌شده در برابر ربات که `web_fetch` ساده در آن‌ها عملکرد ضعیفی دارد، از این ابزار استفاده کنید.

پارامترها:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## حالت مخفی / دور زدن ربات

مقادیر پیش‌فرض `firecrawl_scrape` و گزینهٔ پشتیبان Firecrawl برای `web_fetch`،‏ `proxy: "auto"` به‌همراه `storeInCache: true` هستند، مگر اینکه فراخواننده این پارامترها را بازنویسی کند. `firecrawl_search` و ارائه‌دهندهٔ Firecrawl برای `web_search` هیچ کنترلی برای `proxy`/`storeInCache` ندارند؛ حالت پروکسی مخفی فقط برای درخواست‌های خراش‌دادن/واکشی اعمال می‌شود.

حالت `proxy` در Firecrawl دور زدن ربات را کنترل می‌کند (`basic`،‏ `stealth` یا `auto`). اگر تلاش پایه ناموفق باشد، `auto` با پروکسی‌های مخفی دوباره تلاش می‌کند؛ این کار ممکن است نسبت به خراش‌دادن صرفاً پایه، اعتبار بیشتری مصرف کند.

## نحوهٔ استفادهٔ `web_fetch` از Firecrawl

ترتیب استخراج `web_fetch`:

1. Readability (محلی)
2. ارائه‌دهندهٔ واکشی پیکربندی‌شده، مانند Firecrawl (در صورت انتخاب یا شناسایی خودکار از اعتبارنامه‌های پیکربندی‌شده)
3. پاک‌سازی پایهٔ HTML (آخرین گزینهٔ پشتیبان)

گزینهٔ انتخاب `tools.web.fetch.provider` است. اگر آن را حذف کنید، OpenClaw نخستین ارائه‌دهندهٔ آمادهٔ واکشی وب را از میان اعتبارنامه‌های موجود به‌طور خودکار شناسایی می‌کند. Plugin رسمی Firecrawl این گزینهٔ پشتیبان را فراهم می‌کند.

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همهٔ ارائه‌دهندگان و شناسایی خودکار
- [واکشی وب](/fa/tools/web-fetch) -- ابزار `web_fetch` با گزینهٔ پشتیبان Firecrawl
- [Tavily](/fa/tools/tavily) -- ابزارهای جست‌وجو و استخراج
