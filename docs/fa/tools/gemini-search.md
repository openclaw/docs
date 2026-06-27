---
read_when:
    - می‌خواهید از Gemini برای web_search استفاده کنید
    - به GEMINI_API_KEY یا models.providers.google.apiKey نیاز دارید
    - می‌خواهید بر پایهٔ Google Search مستند کنید
summary: جست‌وجوی وب Gemini با زمینه‌سازی Google Search
title: جست‌وجوی Gemini
x-i18n:
    generated_at: "2026-06-27T19:00:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8bbebd5689daaa63c817ff17eac70e197999a3e1ecbb198249eb567e5ba0fc5f
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw از مدل‌های Gemini با
[زمینه‌سازی Google Search](https://ai.google.dev/gemini-api/docs/grounding)
داخلی پشتیبانی می‌کند؛ این قابلیت پاسخ‌های ساخته‌شده توسط هوش مصنوعی را که بر پایه نتایج زنده Google Search و همراه با
استنادها هستند، برمی‌گرداند.

## دریافت کلید API

<Steps>
  <Step title="ایجاد کلید">
    به [Google AI Studio](https://aistudio.google.com/apikey) بروید و یک
    کلید API ایجاد کنید.
  </Step>
  <Step title="ذخیره کلید">
    `GEMINI_API_KEY` را در محیط Gateway تنظیم کنید، از
    `models.providers.google.apiKey` دوباره استفاده کنید، یا یک کلید اختصاصی جست‌وجوی وب را از طریق زیر پیکربندی کنید:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## پیکربندی

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash", // default
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**اولویت اعتبارنامه:** جست‌وجوی وب Gemini ابتدا از
`plugins.entries.google.config.webSearch.apiKey` استفاده می‌کند، سپس از `GEMINI_API_KEY`،
و بعد از `models.providers.google.apiKey`. برای URLهای پایه، مقدار اختصاصی
`plugins.entries.google.config.webSearch.baseUrl` پیش از
`models.providers.google.baseUrl` اولویت دارد.

برای نصب Gateway، کلیدهای محیطی را در `~/.openclaw/.env` قرار دهید.

## سازوکار

برخلاف ارائه‌دهندگان جست‌وجوی سنتی که فهرستی از پیوندها و قطعه‌متن‌ها را برمی‌گردانند،
Gemini از زمینه‌سازی Google Search برای تولید پاسخ‌های ساخته‌شده توسط هوش مصنوعی با
استنادهای درون‌خطی استفاده می‌کند. نتایج هم پاسخ ساخته‌شده و هم URLهای منبع را شامل می‌شوند.

- URLهای استناد از زمینه‌سازی Gemini به‌طور خودکار از URLهای هدایت Google
  به URLهای مستقیم تبدیل می‌شوند.
- تبدیل هدایت، پیش از برگرداندن URL نهایی استناد، از مسیر محافظ SSRF استفاده می‌کند (HEAD + بررسی‌های هدایت +
  اعتبارسنجی http/https).
- تبدیل هدایت از پیش‌فرض‌های سخت‌گیرانه SSRF استفاده می‌کند، بنابراین هدایت‌ها به
  مقصدهای خصوصی/داخلی مسدود می‌شوند.

## پارامترهای پشتیبانی‌شده

جست‌وجوی Gemini از `query`، `freshness`، `date_after` و `date_before` پشتیبانی می‌کند.

`count` برای سازگاری مشترک با `web_search` پذیرفته می‌شود، اما زمینه‌سازی Gemini
همچنان به‌جای فهرستی با N نتیجه، یک پاسخ ساخته‌شده همراه با استنادها برمی‌گرداند.

`freshness` مقادیر `day`، `week`، `month`، `year` و میان‌برهای مشترک
`pd`، `pw`، `pm` و `py` را می‌پذیرد. `day`/`pd` به‌جای یک بازه سخت‌گیرانه ۲۴ ساعته،
یک دستور تازگی به پرس‌وجوی Gemini اضافه می‌کند. `week`، `month`، `year` و بازه‌های صریح
`date_after`/`date_before` مقدار
`timeRangeFilter` زمینه‌سازی Google Search در Gemini را تنظیم می‌کنند. `country`، `language` و `domain_filter` پشتیبانی نمی‌شوند.

## انتخاب مدل

مدل پیش‌فرض `gemini-2.5-flash` است (سریع و مقرون‌به‌صرفه). هر مدل Gemini
که از زمینه‌سازی پشتیبانی کند، می‌تواند از طریق
`plugins.entries.google.config.webSearch.model` استفاده شود.

## بازنویسی URL پایه

زمانی `plugins.entries.google.config.webSearch.baseUrl` را تنظیم کنید که جست‌وجوی وب Gemini
باید از طریق پراکسی اپراتور یا نقطه پایانی سفارشی سازگار با Gemini مسیریابی شود. اگر
این مقدار تنظیم نشده باشد، جست‌وجوی وب Gemini از `models.providers.google.baseUrl` دوباره استفاده می‌کند. مقدار ساده
`https://generativelanguage.googleapis.com` به
`https://generativelanguage.googleapis.com/v1beta` نرمال‌سازی می‌شود؛ مسیرهای پراکسی سفارشی پس از حذف اسلش‌های انتهایی،
همان‌طور که ارائه شده‌اند حفظ می‌شوند.

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همه ارائه‌دهندگان و تشخیص خودکار
- [Brave Search](/fa/tools/brave-search) -- نتایج ساخت‌یافته همراه با قطعه‌متن‌ها
- [Perplexity Search](/fa/tools/perplexity-search) -- نتایج ساخت‌یافته + استخراج محتوا
