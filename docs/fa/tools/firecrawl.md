---
read_when:
    - استخراج وب مبتنی بر Firecrawl می‌خواهید
    - می‌خواهید Firecrawl web_fetch بدون کلید داشته باشید
    - برای جست‌وجو یا محدودیت‌های بالاتر به کلید API Firecrawl نیاز دارید
    - شما Firecrawl را به‌عنوان ارائه‌دهندهٔ web_search می‌خواهید
    - برای `web_fetch` استخراج ضدبات می‌خواهید
summary: جست‌وجو، استخراج و جایگزین web_fetch در Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-06-27T19:00:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8f6ef7ea3711e8e3e55d6eec4a99397dec4efc548c7192924fdd5850cb270bf
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw می‌تواند از **Firecrawl** به سه روش استفاده کند:

- به‌عنوان ارائه‌دهنده‌ی `web_search`
- به‌عنوان ابزارهای صریح Plugin: `firecrawl_search` و `firecrawl_scrape`
- به‌عنوان استخراج‌کننده‌ی جایگزین برای `web_fetch`

این یک سرویس میزبانی‌شده برای استخراج/جست‌وجو است که از عبور از محافظت‌های ضدبات و کش‌کردن پشتیبانی می‌کند،
که برای سایت‌های سنگین از نظر JS یا صفحه‌هایی که دریافت ساده‌ی HTTP را مسدود می‌کنند مفید است.

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را بازراه‌اندازی کنید:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch بدون کلید و کلیدهای API

جایگزین میزبانی‌شده‌ی Firecrawl برای `web_fetch` که به‌صورت صریح انتخاب شده باشد، از دسترسی آغازین بدون کلید API پشتیبانی می‌کند. وقتی به سقف‌های بالاتر نیاز دارید، `FIRECRAWL_API_KEY` را در محیط Gateway اضافه کنید یا آن را پیکربندی کنید. `web_search` با Firecrawl و `firecrawl_scrape` به کلید API نیاز دارند.

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

- انتخاب Firecrawl در راه‌اندازی اولیه یا `openclaw configure --section web`، Plugin نصب‌شده‌ی Firecrawl را به‌طور خودکار فعال می‌کند.
- `web_search` با Firecrawl از `query` و `count` پشتیبانی می‌کند.
- برای کنترل‌های اختصاصی Firecrawl مانند `sources`، `categories`، یا استخراج نتایج، از `firecrawl_search` استفاده کنید.
- مقدار پیش‌فرض `baseUrl` برای Firecrawl میزبانی‌شده `https://api.firecrawl.dev` است. بازنویسی‌های خودمیزبان فقط برای نقاط پایانی خصوصی/داخلی مجاز هستند؛ HTTP فقط برای همان مقصدهای خصوصی پذیرفته می‌شود.
- `FIRECRAWL_BASE_URL` جایگزین محیطی مشترک برای URLهای پایه‌ی جست‌وجو و اسکرپ Firecrawl است.

## پیکربندی جایگزین Firecrawl برای web_fetch

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

نکات:

- جایگزین Firecrawl برای `web_fetch` که به‌صورت صریح انتخاب شده باشد، بدون کلید API کار می‌کند. هنگام پیکربندی، OpenClaw برای سقف‌های بالاتر `plugins.entries.firecrawl.config.webFetch.apiKey` یا `FIRECRAWL_API_KEY` را ارسال می‌کند.
- انتخاب Firecrawl در طول راه‌اندازی اولیه یا `openclaw configure --section web`، Plugin را فعال می‌کند و Firecrawl را برای `web_fetch` انتخاب می‌کند، مگر اینکه ارائه‌دهنده‌ی دریافت دیگری از قبل پیکربندی شده باشد.
- `firecrawl_scrape` به کلید API نیاز دارد.
- `maxAgeMs` کنترل می‌کند نتایج کش‌شده تا چه اندازه می‌توانند قدیمی باشند (ms). مقدار پیش‌فرض ۲ روز است.
- پیکربندی قدیمی `tools.web.fetch.firecrawl.*` به‌طور خودکار با `openclaw doctor --fix` مهاجرت داده می‌شود.
- بازنویسی‌های URL پایه/اسکرپ Firecrawl همان قاعده‌ی میزبانی‌شده/خصوصی جست‌وجو را دنبال می‌کنند: ترافیک عمومی میزبانی‌شده از `https://api.firecrawl.dev` استفاده می‌کند؛ بازنویسی‌های خودمیزبان باید به نقاط پایانی خصوصی/داخلی resolve شوند.
- `firecrawl_scrape` پیش از ارسال URLها به Firecrawl، URLهای مقصد آشکارا خصوصی، loopback، فراداده، و غیر HTTP(S) را رد می‌کند، تا با قرارداد ایمنی مقصد `web_fetch` برای فراخوانی‌های صریح اسکرپ Firecrawl همخوان باشد.

`firecrawl_scrape` همان تنظیمات و متغیرهای محیطی `plugins.entries.firecrawl.config.webFetch.*` را دوباره استفاده می‌کند، از جمله کلید API الزامی آن.

### Firecrawl خودمیزبان

وقتی Firecrawl را خودتان اجرا می‌کنید، `plugins.entries.firecrawl.config.webSearch.baseUrl`،
`plugins.entries.firecrawl.config.webFetch.baseUrl`، یا `FIRECRAWL_BASE_URL`
را تنظیم کنید. OpenClaw فقط برای مقصدهای loopback،
شبکه‌ی خصوصی، `.local`، `.internal`، یا `.localhost` مقدار `http://` را می‌پذیرد. میزبان‌های سفارشی عمومی رد می‌شوند تا کلیدهای API Firecrawl به‌صورت تصادفی به نقاط پایانی دلخواه ارسال نشوند.

## ابزارهای Plugin Firecrawl

### `firecrawl_search`

وقتی به‌جای `web_search` عمومی، کنترل‌های جست‌وجوی اختصاصی Firecrawl را می‌خواهید، از این استفاده کنید.

پارامترهای اصلی:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

برای صفحه‌های سنگین از نظر JS یا محافظت‌شده در برابر بات که `web_fetch` ساده در آن‌ها ضعیف است، از این استفاده کنید.

پارامترهای اصلی:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## پنهان‌کاری / عبور از محافظت‌های ضدبات

Firecrawl برای عبور از محافظت‌های ضدبات یک پارامتر **حالت پروکسی** ارائه می‌کند (`basic`، `stealth`، یا `auto`).
OpenClaw همیشه برای درخواست‌های Firecrawl از `proxy: "auto"` همراه با `storeInCache: true` استفاده می‌کند.
اگر پروکسی حذف شود، مقدار پیش‌فرض Firecrawl برابر `auto` است. اگر تلاش پایه ناموفق شود، `auto` با پروکسی‌های پنهان‌کارانه دوباره تلاش می‌کند، که ممکن است نسبت به اسکرپ فقط پایه اعتبار بیشتری مصرف کند.

## نحوه‌ی استفاده‌ی `web_fetch` از Firecrawl

ترتیب استخراج `web_fetch`:

1. Readability (محلی)
2. Firecrawl (وقتی انتخاب شده باشد، یا از اعتبارنامه‌های پیکربندی‌شده به‌طور خودکار تشخیص داده شود)
3. پاک‌سازی پایه‌ی HTML (آخرین جایگزین)

کلید انتخاب `tools.web.fetch.provider` است. اگر آن را حذف کنید، OpenClaw
اولین ارائه‌دهنده‌ی آماده‌ی web-fetch را از اعتبارنامه‌های موجود به‌طور خودکار تشخیص می‌دهد.
Plugin رسمی Firecrawl آن جایگزین را فراهم می‌کند.

## مرتبط

- [نمای کلی Web Search](/fa/tools/web) -- همه‌ی ارائه‌دهندگان و تشخیص خودکار
- [Web Fetch](/fa/tools/web-fetch) -- ابزار web_fetch با جایگزین Firecrawl
- [Tavily](/fa/tools/tavily) -- ابزارهای جست‌وجو + استخراج
