---
read_when:
    - می‌خواهید یک URL را واکشی کنید و محتوای خوانا را استخراج کنید
    - باید web_fetch یا جایگزین Firecrawl آن را پیکربندی کنید
    - می‌خواهید محدودیت‌ها و کش‌کردن web_fetch را درک کنید
sidebarTitle: Web Fetch
summary: ابزار web_fetch -- دریافت HTTP با استخراج محتوای خوانا
title: واکشی وب
x-i18n:
    generated_at: "2026-04-29T23:48:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 430ff19fe477cff22bb88bc69f1fdd53185cb61c935f2b64481e98b2e5f4aff9
    source_path: tools/web-fetch.md
    workflow: 16
---

ابزار `web_fetch` یک HTTP GET ساده انجام می‌دهد و محتوای خوانا را استخراج می‌کند
(HTML به markdown یا متن). این ابزار JavaScript را اجرا **نمی‌کند**.

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
    یک HTTP GET با User-Agent شبیه Chrome و سربرگ `Accept-Language`
    ارسال می‌کند. نام‌های میزبان خصوصی/داخلی را مسدود می‌کند و redirectها را دوباره بررسی می‌کند.
  </Step>
  <Step title="Extract">
    Readability (استخراج محتوای اصلی) را روی پاسخ HTML اجرا می‌کند.
  </Step>
  <Step title="Fallback (optional)">
    اگر Readability ناموفق باشد و Firecrawl پیکربندی شده باشد، از طریق
    API Firecrawl با حالت دور زدن ربات دوباره تلاش می‌کند.
  </Step>
  <Step title="Cache">
    نتایج به‌مدت ۱۵ دقیقه (قابل پیکربندی) cache می‌شوند تا دریافت‌های تکراری
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

## fallback Firecrawl

اگر استخراج Readability ناموفق باشد، `web_fetch` می‌تواند برای دور زدن ربات و استخراج بهتر به
[Firecrawl](/fa/tools/firecrawl) fallback کند:

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
پیکربندی قدیمی `tools.web.fetch.firecrawl.*` به‌طور خودکار توسط `openclaw doctor --fix` مهاجرت داده می‌شود.

<Note>
  اگر Firecrawl فعال باشد و SecretRef آن بدون fallback متغیر محیطی
  `FIRECRAWL_API_KEY` resolve نشده باشد، راه‌اندازی Gateway سریعاً شکست می‌خورد.
</Note>

<Note>
  بازنویسی‌های `baseUrl` برای Firecrawl محدود شده‌اند: باید از `https://` و
  میزبان رسمی Firecrawl (`api.firecrawl.dev`) استفاده کنند.
</Note>

رفتار runtime فعلی:

- `tools.web.fetch.provider` ارائه‌دهنده fallback دریافت را به‌صراحت انتخاب می‌کند.
- اگر `provider` حذف شود، OpenClaw نخستین ارائه‌دهنده آماده web-fetch را
  از credentialهای موجود به‌طور خودکار تشخیص می‌دهد. امروز ارائه‌دهنده همراه Firecrawl است.
- اگر Readability غیرفعال باشد، `web_fetch` مستقیماً به fallback ارائه‌دهنده انتخاب‌شده می‌رود. اگر هیچ ارائه‌دهنده‌ای در دسترس نباشد، به‌صورت بسته شکست می‌خورد.

## محدودیت‌ها و ایمنی

- `maxChars` به `tools.web.fetch.maxCharsCap` محدود می‌شود
- بدنه پاسخ پیش از parsing در `maxResponseBytes` سقف‌گذاری می‌شود؛ پاسخ‌های بیش‌ازحد بزرگ
  با هشدار کوتاه می‌شوند
- نام‌های میزبان خصوصی/داخلی مسدود می‌شوند
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` و
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` opt-inهای محدودی
  برای پشته‌های proxy با IP جعلی مورد اعتماد هستند؛ آن‌ها را تنظیم‌نشده بگذارید مگر اینکه proxy شما
  مالک آن بازه‌های مصنوعی باشد و سیاست مقصد خودش را اعمال کند
- Redirectها بررسی می‌شوند و با `maxRedirects` محدود می‌شوند
- `web_fetch` بهترین تلاش را انجام می‌دهد -- بعضی سایت‌ها به [مرورگر وب](/fa/tools/browser) نیاز دارند

## پروفایل‌های ابزار

اگر از پروفایل‌های ابزار یا allowlistها استفاده می‌کنید، `web_fetch` یا `group:web` را اضافه کنید:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## مرتبط

- [جست‌وجوی وب](/fa/tools/web) -- جست‌وجوی وب با چندین ارائه‌دهنده
- [مرورگر وب](/fa/tools/browser) -- خودکارسازی کامل مرورگر برای سایت‌های سنگین از نظر JS
- [Firecrawl](/fa/tools/firecrawl) -- ابزارهای جست‌وجو و scrape در Firecrawl
