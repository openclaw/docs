---
read_when:
    - می‌خواهید یک URL را دریافت و محتوای خوانا را استخراج کنید
    - باید web_fetch یا جایگزین پشتیبان آن، Firecrawl، را پیکربندی کنید
    - می‌خواهید محدودیت‌های web_fetch و سازوکار کش آن را درک کنید
sidebarTitle: Web Fetch
summary: ابزار web_fetch -- واکشی HTTP با استخراج محتوای خوانا
title: واکشی وب
x-i18n:
    generated_at: "2026-05-02T12:07:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: f455da77c20049f0ed0246fa53e9f49d3cf2004e65bd64a0bf871861c6e93229
    source_path: tools/web-fetch.md
    workflow: 16
---

ابزار `web_fetch` یک HTTP GET ساده انجام می‌دهد و محتوای خواندنی را استخراج می‌کند
(HTML به markdown یا متن). این ابزار JavaScript را **اجرا نمی‌کند**.

برای سایت‌های سنگین از نظر JS یا صفحه‌های محافظت‌شده با ورود، به‌جای آن از
[مرورگر وب](/fa/tools/browser) استفاده کنید.

## شروع سریع

`web_fetch` به‌صورت **پیش‌فرض فعال است** -- نیازی به پیکربندی نیست. عامل می‌تواند
بلافاصله آن را فراخوانی کند:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## پارامترهای ابزار

<ParamField path="url" type="string" required>
URL برای دریافت. فقط `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
قالب خروجی پس از استخراج محتوای اصلی.
</ParamField>

<ParamField path="maxChars" type="number">
خروجی را به این تعداد نویسه کوتاه می‌کند.
</ParamField>

## نحوه کار

<Steps>
  <Step title="Fetch">
    یک HTTP GET با User-Agent شبیه Chrome و سرآیند `Accept-Language`
    ارسال می‌کند. نام‌های میزبان خصوصی/داخلی را مسدود می‌کند و تغییرمسیرها را دوباره بررسی می‌کند.
  </Step>
  <Step title="Extract">
    Readability (استخراج محتوای اصلی) را روی پاسخ HTML اجرا می‌کند.
  </Step>
  <Step title="Fallback (optional)">
    اگر Readability ناموفق باشد و Firecrawl پیکربندی شده باشد، با حالت
    دور زدن ربات از طریق Firecrawl API دوباره تلاش می‌کند.
  </Step>
  <Step title="Cache">
    نتایج برای 15 دقیقه (قابل پیکربندی) کش می‌شوند تا دریافت‌های تکراری
    همان URL کاهش یابد.
  </Step>
</Steps>

## پیکربندی

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000, // max output chars
        maxCharsCap: 50000, // hard cap for maxChars param
        maxResponseBytes: 2000000, // max download size before truncation
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // use Readability extraction
        userAgent: "Mozilla/5.0 ...", // override User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // opt-in for trusted fake-IP proxies using 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // opt-in for trusted fake-IP proxies using fc00::/7
        },
      },
    },
  },
}
```

## جایگزین Firecrawl

اگر استخراج Readability ناموفق باشد، `web_fetch` می‌تواند برای دور زدن ربات و استخراج بهتر به
[Firecrawl](/fa/tools/firecrawl) بازگردد:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; omit for auto-detect from available credentials
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // optional if FIRECRAWL_API_KEY is set
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // cache duration (1 day)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` از اشیای SecretRef پشتیبانی می‌کند.
پیکربندی قدیمی `tools.web.fetch.firecrawl.*` به‌صورت خودکار توسط `openclaw doctor --fix` مهاجرت داده می‌شود.

<Note>
  اگر Firecrawl فعال باشد و SecretRef آن بدون جایگزین env
  `FIRECRAWL_API_KEY` حل‌نشده بماند، راه‌اندازی Gateway سریعاً ناموفق می‌شود.
</Note>

<Note>
  جایگزینی‌های `baseUrl` برای Firecrawl محدود شده‌اند: ترافیک میزبانی‌شده از
  `https://api.firecrawl.dev` استفاده می‌کند؛ جایگزینی‌های خودمیزبان باید نقاط پایانی خصوصی یا
  داخلی را هدف بگیرند، و `http://` فقط برای همان اهداف خصوصی پذیرفته می‌شود.
</Note>

رفتار فعلی زمان اجرا:

- `tools.web.fetch.provider` ارائه‌دهنده جایگزین دریافت را به‌صراحت انتخاب می‌کند.
- اگر `provider` حذف شود، OpenClaw نخستین ارائه‌دهنده آماده web-fetch را
  از اعتبارنامه‌های موجود به‌صورت خودکار تشخیص می‌دهد. `web_fetch` خارج از سندباکس می‌تواند از
  Pluginهای نصب‌شده‌ای استفاده کند که `contracts.webFetchProviders` را اعلام می‌کنند و یک
  ارائه‌دهنده منطبق را در زمان اجرا ثبت می‌کنند. امروز ارائه‌دهنده همراه Firecrawl است.
- فراخوانی‌های `web_fetch` سندباکس‌شده به ارائه‌دهندگان همراه محدود می‌مانند.
- اگر Readability غیرفعال باشد، `web_fetch` مستقیماً به جایگزین
  ارائه‌دهنده انتخاب‌شده می‌رود. اگر هیچ ارائه‌دهنده‌ای در دسترس نباشد، به‌صورت بسته ناموفق می‌شود.

## محدودیت‌ها و ایمنی

- `maxChars` به `tools.web.fetch.maxCharsCap` محدود می‌شود
- بدنه پاسخ پیش از پردازش به `maxResponseBytes` محدود می‌شود؛ پاسخ‌های بیش از اندازه
  با یک هشدار کوتاه می‌شوند
- نام‌های میزبان خصوصی/داخلی مسدود می‌شوند
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` و
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` پذیرش‌های محدود
  برای پشته‌های پروکسی fake-IP قابل اعتماد هستند؛ آن‌ها را تنظیم نکنید مگر اینکه پروکسی شما مالک
  آن بازه‌های مصنوعی باشد و سیاست مقصد خودش را اعمال کند
- تغییرمسیرها بررسی می‌شوند و با `maxRedirects` محدود می‌شوند
- `web_fetch` بر پایه بهترین تلاش است -- برخی سایت‌ها به [مرورگر وب](/fa/tools/browser) نیاز دارند

## پروفایل‌های ابزار

اگر از پروفایل‌های ابزار یا allowlist استفاده می‌کنید، `web_fetch` یا `group:web` را اضافه کنید:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## مرتبط

- [جست‌وجوی وب](/fa/tools/web) -- وب را با چند ارائه‌دهنده جست‌وجو کنید
- [مرورگر وب](/fa/tools/browser) -- خودکارسازی کامل مرورگر برای سایت‌های سنگین از نظر JS
- [Firecrawl](/fa/tools/firecrawl) -- ابزارهای جست‌وجو و scrape در Firecrawl
