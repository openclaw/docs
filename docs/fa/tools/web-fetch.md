---
read_when:
    - می‌خواهید یک URL را واکشی کنید و محتوای خوانا را استخراج کنید
    - باید web_fetch یا جایگزین پشتیبان Firecrawl آن را پیکربندی کنید
    - می‌خواهید محدودیت‌ها و سازوکار کش `web_fetch` را درک کنید
sidebarTitle: Web Fetch
summary: ابزار web_fetch -- دریافت HTTP با استخراج محتوای خوانا
title: واکشی وب
x-i18n:
    generated_at: "2026-05-04T02:29:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8c3efbf4a640b2fd69cc9532dcb06a873a6830a2e8a85ab7510ab38207c8670
    source_path: tools/web-fetch.md
    workflow: 16
---

ابزار `web_fetch` یک HTTP GET ساده انجام می‌دهد و محتوای خوانا را استخراج می‌کند
(HTML به markdown یا متن). این ابزار JavaScript را **اجرا نمی‌کند**.

برای سایت‌های وابسته به JS یا صفحه‌های محافظت‌شده با ورود، به‌جای آن از
[مرورگر وب](/fa/tools/browser) استفاده کنید.

## شروع سریع

`web_fetch` به‌صورت **پیش‌فرض فعال است** -- نیازی به پیکربندی نیست. عامل می‌تواند
فوراً آن را فراخوانی کند:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## پارامترهای ابزار

<ParamField path="url" type="string" required>
URL برای واکشی. فقط `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
قالب خروجی پس از استخراج محتوای اصلی.
</ParamField>

<ParamField path="maxChars" type="number">
خروجی را به این تعداد نویسه کوتاه می‌کند.
</ParamField>

## نحوه کار

<Steps>
  <Step title="واکشی">
    یک HTTP GET با User-Agent شبیه Chrome و سرآیند `Accept-Language`
    می‌فرستد. نام‌های میزبان خصوصی/داخلی را مسدود می‌کند و تغییرمسیرها را دوباره بررسی می‌کند.
  </Step>
  <Step title="استخراج">
    Readability (استخراج محتوای اصلی) را روی پاسخ HTML اجرا می‌کند.
  </Step>
  <Step title="پس‌افت (اختیاری)">
    اگر Readability شکست بخورد و Firecrawl پیکربندی شده باشد، از طریق
    API Firecrawl با حالت دور زدن ربات دوباره تلاش می‌کند.
  </Step>
  <Step title="کش">
    نتایج برای ۱۵ دقیقه (قابل پیکربندی) کش می‌شوند تا واکشی‌های تکراری
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

## پس‌افت Firecrawl

اگر استخراج Readability شکست بخورد، `web_fetch` می‌تواند برای دور زدن ربات و استخراج بهتر به
[Firecrawl](/fa/tools/firecrawl) برگردد:

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
  اگر Firecrawl فعال باشد و SecretRef آن بدون پس‌افت env به
  `FIRECRAWL_API_KEY` حل نشده باشد، راه‌اندازی Gateway سریعاً شکست می‌خورد.
</Note>

<Note>
  بازنویسی‌های `baseUrl` در Firecrawl محدود شده‌اند: ترافیک میزبانی‌شده از
  `https://api.firecrawl.dev` استفاده می‌کند؛ بازنویسی‌های خودمیزبان باید به نقاط پایانی خصوصی یا
  داخلی اشاره کنند، و `http://` فقط برای همان مقصدهای خصوصی پذیرفته می‌شود.
</Note>

رفتار فعلی زمان اجرا:

- `tools.web.fetch.provider` ارائه‌دهنده پس‌افت واکشی را به‌طور صریح انتخاب می‌کند.
- اگر `provider` حذف شود، OpenClaw نخستین ارائه‌دهنده آماده web-fetch را
  از اعتبارنامه‌های موجود به‌صورت خودکار تشخیص می‌دهد. `web_fetch` بدون sandbox می‌تواند از
  Pluginهای نصب‌شده‌ای استفاده کند که `contracts.webFetchProviders` را اعلام می‌کنند و یک
  ارائه‌دهنده مطابق را در زمان اجرا ثبت می‌کنند. امروز ارائه‌دهنده همراه Firecrawl است.
- فراخوانی‌های `web_fetch` در sandbox به ارائه‌دهندگان همراه محدود می‌مانند.
- اگر Readability غیرفعال باشد، `web_fetch` مستقیماً به پس‌افت ارائه‌دهنده انتخاب‌شده
  می‌رود. اگر هیچ ارائه‌دهنده‌ای در دسترس نباشد، به‌صورت بسته شکست می‌خورد.

## پراکسی env مورد اعتماد

اگر استقرار شما نیاز دارد `web_fetch` از طریق یک پراکسی خروجی مورد اعتماد
HTTP(S) عبور کند، `tools.web.fetch.useTrustedEnvProxy: true` را تنظیم کنید.

در این حالت، OpenClaw همچنان پیش از ارسال درخواست بررسی‌های SSRF مبتنی بر نام میزبان را اعمال می‌کند،
اما اجازه می‌دهد پراکسی به‌جای pinning محلی DNS، DNS را حل کند. این را فقط وقتی فعال کنید که پراکسی تحت کنترل اپراتور باشد و
پس از حل DNS، سیاست خروجی را اعمال کند.

<Note>
  اگر هیچ متغیر env پراکسی HTTP(S) پیکربندی نشده باشد، یا میزبان هدف توسط
  `NO_PROXY` مستثنی شده باشد، `web_fetch` به مسیر سخت‌گیرانه عادی با pinning محلی DNS
  برمی‌گردد.
</Note>

## محدودیت‌ها و ایمنی

- `maxChars` به `tools.web.fetch.maxCharsCap` محدود می‌شود
- بدنه پاسخ پیش از parsing در `maxResponseBytes` سقف‌گذاری می‌شود؛ پاسخ‌های بیش‌ازحد بزرگ
  با یک هشدار کوتاه می‌شوند
- نام‌های میزبان خصوصی/داخلی مسدود می‌شوند
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` و
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` opt-inهای محدودی
  برای پشته‌های پراکسی fake-IP مورد اعتماد هستند؛ آن‌ها را تنظیم‌نشده بگذارید مگر اینکه پراکسی شما مالک
  آن بازه‌های ساختگی باشد و سیاست مقصد خودش را اعمال کند
- تغییرمسیرها توسط `maxRedirects` بررسی و محدود می‌شوند
- `useTrustedEnvProxy` یک opt-in صریح است و فقط باید برای پراکسی‌های
  تحت کنترل اپراتور فعال شود که همچنان پس از حل DNS سیاست خروجی را اعمال می‌کنند
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

- [جست‌وجوی وب](/fa/tools/web) -- وب را با چند ارائه‌دهنده جست‌وجو کنید
- [مرورگر وب](/fa/tools/browser) -- خودکارسازی کامل مرورگر برای سایت‌های وابسته به JS
- [Firecrawl](/fa/tools/firecrawl) -- ابزارهای جست‌وجو و scrape در Firecrawl
