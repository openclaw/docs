---
read_when:
    - استخراج محتوای وب مبتنی بر Firecrawl می‌خواهید
    - جست‌وجوی Firecrawl بدون کلید (رایگان) یا web_fetch بدون کلید می‌خواهید
    - برای جست‌وجو یا محدودیت‌های بالاتر، به یک کلید API از Firecrawl نیاز دارید
    - می‌خواهید Firecrawl ارائه‌دهندهٔ web_search باشد
    - برای web_fetch به استخراج مقاوم در برابر ربات‌ها نیاز دارید
summary: جست‌وجو و استخراج Firecrawl و روش جایگزین web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-07-16T17:33:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 98b8af0839b1759e3be9393879a6d9a92fa0c505bf475bafd73c3f32d20fa106
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw می‌تواند از **Firecrawl** به سه روش استفاده کند:

- به‌عنوان ارائه‌دهندهٔ `web_search`
- به‌عنوان ابزارهای صریح Plugin:‏ `firecrawl_search` و `firecrawl_scrape`
- به‌عنوان استخراج‌گر جایگزین برای `web_fetch`

این یک سرویس میزبانی‌شدهٔ استخراج/جست‌وجو است که از دور زدن ربات‌ها و ذخیره‌سازی موقت پشتیبانی می‌کند؛ قابلیتی که برای سایت‌های وابسته به JS یا صفحه‌هایی که دریافت سادهٔ HTTP را مسدود می‌کنند، مفید است.

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را راه‌اندازی مجدد کنید:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## دسترسی بدون کلید و کلیدهای API

Firecrawl دو ارائه‌دهندهٔ `web_search` را ثبت می‌کند:

- **جست‌وجوی Firecrawl** (`firecrawl`) — از API میزبانی‌شدهٔ `/v2/search` با کلید شما استفاده می‌کند؛
  در صورت وجود کلید، به‌طور خودکار شناسایی می‌شود.
- **جست‌وجوی Firecrawl (رایگان)** (`firecrawl-free`) — از سطح آغازین میزبانی‌شده و بدون کلید استفاده می‌کند
  و به کلید API نیاز ندارد. این گزینه **فقط با انتخاب صریح** فعال می‌شود و هرگز به‌طور خودکار انتخاب نمی‌شود، زیرا
  انتخاب آن، پرس‌وجوهای جست‌وجوی شما را به سطح رایگان Firecrawl ارسال می‌کند.

گزینهٔ جایگزین `web_fetch` در Firecrawl که به‌طور صریح انتخاب شده است نیز بدون کلید کار می‌کند. ابزارهای صریح
`firecrawl_search` و `firecrawl_scrape` به کلید API نیاز دارند. برای محدودیت‌های بالاتر،
`FIRECRAWL_API_KEY` را به محیط Gateway اضافه یا آن را پیکربندی کنید.

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

- انتخاب Firecrawl در راه‌اندازی اولیه یا `openclaw configure --section web`، Plugin نصب‌شدهٔ Firecrawl را به‌طور خودکار فعال می‌کند.
- برای اجرا بدون کلید API، در راه‌اندازی اولیه **جست‌وجوی Firecrawl (رایگان)** را انتخاب کنید (یا `provider: "firecrawl-free"` را تنظیم کنید). ارائه‌دهندهٔ کلیددار **جست‌وجوی Firecrawl**،‏ `plugins.entries.firecrawl.config.webSearch.apiKey` یا `FIRECRAWL_API_KEY` را ارسال می‌کند.
- `web_search` با Firecrawl از `query` و `count` پشتیبانی می‌کند.
- برای کنترل‌های ویژهٔ Firecrawl مانند `sources`،‏ `categories` یا خزش نتایج، از `firecrawl_search` استفاده کنید.
- `baseUrl` به‌طور پیش‌فرض از Firecrawl میزبانی‌شده در `https://api.firecrawl.dev` استفاده می‌کند. بازنویسی‌های خودمیزبان فقط برای نقاط پایانی خصوصی/داخلی مجازند؛ HTTP فقط برای همین مقصدهای خصوصی پذیرفته می‌شود.
- `FIRECRAWL_BASE_URL` گزینهٔ جایگزین محیطی مشترک برای URLهای پایهٔ جست‌وجو و خزش Firecrawl است.
- مهلت زمانی پیش‌فرض درخواست‌های جست‌وجوی Firecrawl برابر 30 ثانیه است؛ پارامتر `timeoutSeconds` در `firecrawl_search` آن را برای هر فراخوانی بازنویسی می‌کند.

## پیکربندی گزینهٔ جایگزین web_fetch در Firecrawl

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // explicit selection enables keyless fallback
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

نکته‌ها:

- گزینهٔ جایگزین `web_fetch` در Firecrawl که به‌طور صریح انتخاب شده است، بدون کلید API کار می‌کند. در صورت پیکربندی، OpenClaw برای محدودیت‌های بالاتر `plugins.entries.firecrawl.config.webFetch.apiKey` یا `FIRECRAWL_API_KEY` را ارسال می‌کند.
- انتخاب Firecrawl هنگام راه‌اندازی اولیه یا `openclaw configure --section web`،‏ Plugin را فعال و Firecrawl را برای `web_fetch` انتخاب می‌کند، مگر اینکه ارائه‌دهندهٔ دریافت دیگری از قبل پیکربندی شده باشد.
- `firecrawl_scrape` به کلید API نیاز دارد.
- `maxAgeMs` تعیین می‌کند نتایج ذخیره‌شده تا چه سنی (برحسب ms) قابل استفاده باشند. مقدار پیش‌فرض 172,800,000 ms (2 روز) است.
- `onlyMainContent` به‌طور پیش‌فرض `true` است؛ مقدار پیش‌فرض `timeoutSeconds` برابر 60 است.
- پیکربندی قدیمی `tools.web.fetch.firecrawl.*` و `tools.web.search.firecrawl.*` به‌طور خودکار توسط `openclaw doctor --fix` مهاجرت داده می‌شود.
- بازنویسی‌های URL پایه/خزش Firecrawl از همان قاعدهٔ میزبانی‌شده/خصوصی جست‌وجو پیروی می‌کنند: ترافیک عمومی میزبانی‌شده از `https://api.firecrawl.dev` استفاده می‌کند؛ بازنویسی‌های خودمیزبان باید به نقاط پایانی خصوصی/داخلی منتهی شوند.
- `firecrawl_scrape` پیش از ارسال URLها به Firecrawl، مقصدهای آشکارا خصوصی، حلقهٔ محلی، فراداده و URLهای مقصد غیر HTTP(S) را رد می‌کند؛ این رفتار با قرارداد ایمنی مقصد `web_fetch` برای فراخوانی‌های صریح خزش Firecrawl مطابقت دارد.

`firecrawl_scrape` از همان تنظیمات و متغیرهای محیطی `plugins.entries.firecrawl.config.webFetch.*`، از جمله کلید API الزامی آن، دوباره استفاده می‌کند.

### Firecrawl خودمیزبان

هنگامی که Firecrawl را خودتان اجرا می‌کنید، `plugins.entries.firecrawl.config.webSearch.baseUrl`،‏ `plugins.entries.firecrawl.config.webFetch.baseUrl` یا `FIRECRAWL_BASE_URL` را تنظیم کنید. OpenClaw،‏ `http://` را فقط برای مقصدهای حلقهٔ محلی، شبکهٔ خصوصی، `.local`،‏ `.internal` یا `.localhost` می‌پذیرد. میزبان‌های سفارشی عمومی رد می‌شوند تا کلیدهای API مربوط به Firecrawl به‌طور تصادفی به نقاط پایانی دلخواه ارسال نشوند.

## ابزارهای Plugin مربوط به Firecrawl

### `firecrawl_search`

وقتی به‌جای `web_search` عمومی، کنترل‌های جست‌وجوی ویژهٔ Firecrawl را می‌خواهید، از این ابزار استفاده کنید. به کلید API نیاز دارد.

پارامترها:

- `query`
- `count` (1-100)
- `sources`
- `categories`
- `includeDomains` / `excludeDomains` (فقط نام میزبان؛ ناسازگار با یکدیگر)
- `tbs` (فیلتر زمانی، برای مثال `qdr:d`،‏ `qdr:w`،‏ `sbd:1`)
- `location` و `country` (هدف‌گذاری جغرافیایی)
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

از این ابزار برای صفحه‌های وابسته به JS یا محافظت‌شده در برابر ربات استفاده کنید که `web_fetch` ساده در آن‌ها ضعیف عمل می‌کند.

پارامترها:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## حالت پنهان‌کار / دور زدن ربات

`firecrawl_scrape` و گزینهٔ جایگزین Firecrawl برای `web_fetch`، به‌طور پیش‌فرض از `proxy: "auto"` به‌همراه `storeInCache: true` استفاده می‌کنند، مگر اینکه فراخواننده این پارامترها را بازنویسی کند. `firecrawl_search` و ارائه‌دهندهٔ Firecrawl برای `web_search` هیچ کنترل `proxy`/`storeInCache` ندارند؛ حالت پراکسی پنهان‌کار فقط برای درخواست‌های خزش/دریافت اعمال می‌شود.

حالت `proxy` در Firecrawl دور زدن ربات را کنترل می‌کند (`basic`،‏ `stealth` یا `auto`). ‏`auto` در صورت شکست تلاش پایه، با پراکسی‌های پنهان‌کار دوباره تلاش می‌کند؛ این کار ممکن است نسبت به خزش صرفاً پایه، اعتبار بیشتری مصرف کند.

## نحوهٔ استفادهٔ `web_fetch` از Firecrawl

ترتیب استخراج `web_fetch`:

1. Readability (محلی)
2. ارائه‌دهندهٔ دریافت پیکربندی‌شده، مانند Firecrawl (هنگام انتخاب یا شناسایی خودکار از اعتبارنامه‌های پیکربندی‌شده)
3. پاک‌سازی پایهٔ HTML (آخرین گزینهٔ جایگزین)

گزینهٔ انتخاب `tools.web.fetch.provider` است. اگر آن را حذف کنید، OpenClaw نخستین ارائه‌دهندهٔ آمادهٔ دریافت وب را از میان اعتبارنامه‌های موجود به‌طور خودکار شناسایی می‌کند. Plugin رسمی Firecrawl این گزینهٔ جایگزین را فراهم می‌کند.

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همهٔ ارائه‌دهندگان و شناسایی خودکار
- [دریافت وب](/fa/tools/web-fetch) -- ابزار web_fetch با گزینهٔ جایگزین Firecrawl
- [Tavily](/fa/tools/tavily) -- ابزارهای جست‌وجو و استخراج
