---
read_when:
    - می‌خواهید یک URL را واکشی کنید و محتوای خواندنی را استخراج کنید
    - باید web_fetch یا گزینهٔ پشتیبان Firecrawl آن را پیکربندی کنید
    - می‌خواهید محدودیت‌های web_fetch و کش‌کردن را درک کنید
sidebarTitle: Web Fetch
summary: ابزار web_fetch -- واکشی HTTP با استخراج محتوای خوانا
title: واکشی وب
x-i18n:
    generated_at: "2026-05-06T18:02:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 337174898861db217bf0db052d8e8749989c295e89c73d9d5a6911f6335ba03d
    source_path: tools/web-fetch.md
    workflow: 16
---

ابزار `web_fetch` یک HTTP GET ساده انجام می‌دهد و محتوای خوانا را استخراج می‌کند
(HTML به markdown یا text). این ابزار JavaScript را اجرا **نمی‌کند**.

برای سایت‌های سنگین از نظر JS یا صفحه‌های محافظت‌شده با ورود، به‌جای آن از
[مرورگر وب](/fa/tools/browser) استفاده کنید.

## شروع سریع

`web_fetch` به‌صورت **پیش‌فرض فعال است** -- نیازی به پیکربندی ندارد. عامل می‌تواند
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
خروجی را به این تعداد نویسه کوتاه کنید.
</ParamField>

## نحوه کار

<Steps>
  <Step title="دریافت">
    یک HTTP GET با User-Agent شبیه Chrome و سرآیند `Accept-Language`
    ارسال می‌کند. نام میزبان‌های خصوصی/داخلی را مسدود می‌کند و تغییرمسیرها را دوباره بررسی می‌کند.
  </Step>
  <Step title="استخراج">
    Readability (استخراج محتوای اصلی) را روی پاسخ HTML اجرا می‌کند.
  </Step>
  <Step title="جایگزین (اختیاری)">
    اگر Readability ناموفق باشد و Firecrawl پیکربندی شده باشد، از طریق
    API Firecrawl با حالت دور زدن ربات دوباره تلاش می‌کند.
  </Step>
  <Step title="کش">
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
        useTrustedEnvProxy: false, // let a trusted HTTP(S) env proxy resolve DNS
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
  اگر Firecrawl فعال باشد و SecretRef آن بدون جایگزین محیطی
  `FIRECRAWL_API_KEY` حل نشده باشد، راه‌اندازی Gateway سریعاً شکست می‌خورد.
</Note>

<Note>
  بازنویسی‌های `baseUrl` در Firecrawl محدود شده‌اند: ترافیک میزبانی‌شده از
  `https://api.firecrawl.dev` استفاده می‌کند؛ بازنویسی‌های خودمیزبان باید نقاط پایانی خصوصی یا
  داخلی را هدف بگیرند، و `http://` فقط برای همان هدف‌های خصوصی پذیرفته می‌شود.
</Note>

رفتار فعلی زمان اجرا:

- `tools.web.fetch.provider` ارائه‌دهنده جایگزین دریافت را به‌صورت صریح انتخاب می‌کند.
- اگر `provider` حذف شود، OpenClaw نخستین ارائه‌دهنده آماده web-fetch را
  از اعتبارنامه‌های موجود به‌صورت خودکار شناسایی می‌کند. `web_fetch` غیر sandboxed می‌تواند از
  Pluginهای نصب‌شده‌ای استفاده کند که `contracts.webFetchProviders` را اعلام می‌کنند و یک
  ارائه‌دهنده منطبق را هنگام اجرا ثبت می‌کنند. امروز ارائه‌دهنده همراه‌شده Firecrawl است.
- فراخوانی‌های sandboxed `web_fetch` به ارائه‌دهندگان همراه‌شده محدود می‌مانند.
- اگر Readability غیرفعال باشد، `web_fetch` مستقیماً به جایگزین
  ارائه‌دهنده انتخاب‌شده می‌رود. اگر هیچ ارائه‌دهنده‌ای موجود نباشد، به‌صورت بسته شکست می‌خورد.

## پراکسی محیطی معتمد

اگر استقرار شما نیاز دارد `web_fetch` از طریق یک پراکسی خروجی معتمد
HTTP(S) عبور کند، `tools.web.fetch.useTrustedEnvProxy: true` را تنظیم کنید.

در این حالت، OpenClaw همچنان پیش از ارسال درخواست بررسی‌های SSRF مبتنی بر نام میزبان را اعمال می‌کند،
اما به پراکسی اجازه می‌دهد به‌جای انجام پین‌کردن DNS محلی، DNS را resolve کند.
این گزینه را فقط زمانی فعال کنید که پراکسی تحت کنترل اپراتور باشد و
پس از resolve شدن DNS، سیاست خروجی را اعمال کند.

<Note>
  اگر هیچ متغیر محیطی پراکسی HTTP(S) پیکربندی نشده باشد، یا میزبان هدف توسط
  `NO_PROXY` مستثنا شده باشد، `web_fetch` به مسیر سخت‌گیرانه معمول با پین‌کردن DNS
  محلی بازمی‌گردد.
</Note>

## محدودیت‌ها و ایمنی

- `maxChars` به `tools.web.fetch.maxCharsCap` محدود می‌شود
- بدنه پاسخ پیش از تجزیه در `maxResponseBytes` سقف‌گذاری می‌شود؛ پاسخ‌های بیش‌ازحد بزرگ
  با هشدار کوتاه می‌شوند
- نام میزبان‌های خصوصی/داخلی مسدود می‌شوند
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` و
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` opt-inهای محدودی
  برای پشته‌های پراکسی fake-IP معتمد هستند؛ آن‌ها را تنظیم‌نشده رها کنید مگر اینکه پراکسی شما
  مالک آن بازه‌های مصنوعی باشد و سیاست مقصد خودش را اعمال کند
- تغییرمسیرها توسط `maxRedirects` بررسی و محدود می‌شوند
- `useTrustedEnvProxy` یک opt-in صریح است و فقط باید برای
  پراکسی‌های تحت کنترل اپراتور فعال شود که پس از resolve شدن DNS همچنان سیاست خروجی را اعمال می‌کنند
- `web_fetch` بر پایه بهترین تلاش است -- برخی سایت‌ها به [مرورگر وب](/fa/tools/browser) نیاز دارند

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

- [جستجوی وب](/fa/tools/web) -- جستجوی وب با چند ارائه‌دهنده
- [مرورگر وب](/fa/tools/browser) -- خودکارسازی کامل مرورگر برای سایت‌های سنگین از نظر JS
- [Firecrawl](/fa/tools/firecrawl) -- ابزارهای جستجو و scrape در Firecrawl
