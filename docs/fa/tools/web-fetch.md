---
read_when:
    - می‌خواهید یک URL را واکشی کنید و محتوای خوانا را استخراج کنید
    - باید web_fetch یا جایگزین Firecrawl آن را پیکربندی کنید
    - می‌خواهید محدودیت‌ها و کش‌کردن web_fetch را درک کنید
sidebarTitle: Web Fetch
summary: ابزار web_fetch -- واکشی HTTP با استخراج محتوای خوانا
title: واکشی وب
x-i18n:
    generated_at: "2026-06-27T19:07:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5a4127b97ded80eec1a5944bc8606069e630c61f89c4d5ce9cb729390b4eb4d
    source_path: tools/web-fetch.md
    workflow: 16
---

ابزار `web_fetch` یک HTTP GET ساده انجام می‌دهد و محتوای خوانا را استخراج می‌کند
(HTML به markdown یا text). این ابزار JavaScript را اجرا **نمی‌کند**.

برای سایت‌های متکی به JS یا صفحه‌های محافظت‌شده با ورود، به‌جای آن از
[مرورگر وب](/fa/tools/browser) استفاده کنید.

## شروع سریع

`web_fetch` به‌صورت **پیش‌فرض فعال است** -- به هیچ پیکربندی‌ای نیاز نیست. agent می‌تواند
فوراً آن را فراخوانی کند:

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
    ارسال می‌کند. نام‌های میزبان خصوصی/داخلی را مسدود می‌کند و تغییرمسیرها را دوباره بررسی می‌کند.
  </Step>
  <Step title="Extract">
    Readability (استخراج محتوای اصلی) را روی پاسخ HTML اجرا می‌کند.
  </Step>
  <Step title="Fallback (optional)">
    اگر Readability شکست بخورد و Firecrawl انتخاب شده باشد، از طریق
    Firecrawl API با حالت دور زدن bot دوباره تلاش می‌کند.
  </Step>
  <Step title="Cache">
    نتایج برای ۱۵ دقیقه (قابل پیکربندی) در cache نگه داشته می‌شوند تا
    دریافت‌های تکراری از همان URL کاهش یابد.
  </Step>
</Steps>

## به‌روزرسانی‌های پیشرفت

`web_fetch` فقط زمانی یک خط پیشرفت عمومی منتشر می‌کند که دریافت پس از پنج ثانیه
هنوز در انتظار باشد:

```text
Fetching page content...
```

برخوردهای سریع cache و پاسخ‌های سریع شبکه پیش از فعال شدن زمان‌سنج تمام می‌شوند، بنابراین
خط پیشرفتی نشان نمی‌دهند. اگر فراخوانی لغو شود، زمان‌سنج پاک می‌شود.
وقتی دریافت در نهایت کامل شود، agent نتیجه عادی ابزار را دریافت می‌کند؛
خط پیشرفت فقط وضعیت UI کانال است و هرگز محتوای دریافت‌شده صفحه را دربر نمی‌گیرد.

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

## fallback برای Firecrawl

اگر استخراج Readability شکست بخورد، `web_fetch` می‌تواند برای دور زدن bot و استخراج بهتر به
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
            // apiKey: "fc-...", // optional; omit for keyless starter access
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

`plugins.entries.firecrawl.config.webFetch.apiKey` اختیاری است و از شیءهای SecretRef پشتیبانی می‌کند.
پیکربندی قدیمی `tools.web.fetch.firecrawl.*` به‌صورت خودکار توسط `openclaw doctor --fix` مهاجرت داده می‌شود.

<Note>
  اگر یک SecretRef کلید API برای Firecrawl پیکربندی کنید و بدون fallback از env
  `FIRECRAWL_API_KEY` حل‌نشده بماند، راه‌اندازی gateway سریعاً شکست می‌خورد.
</Note>

<Note>
  بازنویسی‌های Firecrawl `baseUrl` محدود شده‌اند: ترافیک میزبانی‌شده از
  `https://api.firecrawl.dev` استفاده می‌کند؛ بازنویسی‌های خودمیزبان باید endpointهای خصوصی یا
  داخلی را هدف بگیرند، و `http://` فقط برای همان هدف‌های خصوصی پذیرفته می‌شود.
</Note>

رفتار runtime فعلی:

- `tools.web.fetch.provider` ارائه‌دهنده fallback دریافت را به‌صورت صریح انتخاب می‌کند.
- اگر `provider` حذف شود، OpenClaw نخستین ارائه‌دهنده web-fetch آماده را
  از credentialهای پیکربندی‌شده به‌صورت خودکار تشخیص می‌دهد. `web_fetch` غیر sandbox شده می‌تواند از
  Pluginهای نصب‌شده‌ای استفاده کند که `contracts.webFetchProviders` را اعلام می‌کنند و یک
  ارائه‌دهنده مطابق را در runtime ثبت می‌کنند. Plugin رسمی Firecrawl این
  fallback را فراهم می‌کند.
- فراخوانی‌های sandbox شده `web_fetch` ارائه‌دهندگان bundled به‌همراه ارائه‌دهندگان نصب‌شده‌ای را مجاز می‌کنند
  که منشأ رسمی npm یا ClawHub آن‌ها تأیید شده باشد. امروز این کار Plugin رسمی
  Firecrawl را مجاز می‌کند؛ Pluginهای دریافت خارجی شخص ثالث همچنان مستثنا می‌مانند.
- اگر Readability غیرفعال باشد، `web_fetch` مستقیم به fallback
  ارائه‌دهنده انتخاب‌شده می‌رود. اگر هیچ ارائه‌دهنده‌ای در دسترس نباشد، به‌صورت fail-closed شکست می‌خورد.

## proxy قابل‌اعتماد env

اگر استقرار شما نیاز دارد `web_fetch` از طریق یک proxy خروجی قابل‌اعتماد
HTTP(S) عبور کند، `tools.web.fetch.useTrustedEnvProxy: true` را تنظیم کنید.

در این حالت، OpenClaw همچنان پیش از ارسال درخواست، بررسی‌های SSRF مبتنی بر نام میزبان را اعمال می‌کند،
اما اجازه می‌دهد proxy به‌جای انجام DNS pinning محلی، DNS را resolve کند.
این را فقط زمانی فعال کنید که proxy تحت کنترل operator باشد و پس از resolution DNS
سیاست خروجی را enforce کند.

<Note>
  اگر هیچ متغیر env برای proxy HTTP(S) پیکربندی نشده باشد، یا host هدف توسط
  `NO_PROXY` مستثنا شده باشد، `web_fetch` به مسیر سخت‌گیرانه عادی با DNS
  pinning محلی fallback می‌کند.
</Note>

## محدودیت‌ها و ایمنی

- `maxChars` به `tools.web.fetch.maxCharsCap` clamp می‌شود
- بدنه پاسخ پیش از parsing در `maxResponseBytes` محدود می‌شود؛ پاسخ‌های بیش‌ازحد بزرگ
  با یک هشدار کوتاه می‌شوند
- نام‌های میزبان خصوصی/داخلی مسدود می‌شوند
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` و
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` opt-inهای محدودی
  برای stackهای proxy fake-IP قابل‌اعتماد هستند؛ آن‌ها را تنظیم‌نشده بگذارید مگر اینکه proxy شما
  مالک آن بازه‌های synthetic باشد و سیاست مقصد خودش را enforce کند
- تغییرمسیرها توسط `maxRedirects` بررسی و محدود می‌شوند
- `useTrustedEnvProxy` یک opt-in صریح است و فقط باید برای
  proxyهای تحت کنترل operator فعال شود که پس از resolution DNS همچنان سیاست خروجی را enforce می‌کنند
- `web_fetch` به‌صورت best-effort است -- بعضی سایت‌ها به [مرورگر وب](/fa/tools/browser) نیاز دارند

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

- [جست‌وجوی وب](/fa/tools/web) -- جست‌وجوی وب با چند ارائه‌دهنده
- [مرورگر وب](/fa/tools/browser) -- خودکارسازی کامل مرورگر برای سایت‌های متکی به JS
- [Firecrawl](/fa/tools/firecrawl) -- ابزارهای جست‌وجو و scrape در Firecrawl
