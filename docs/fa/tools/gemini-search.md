---
read_when:
    - می‌خواهید از Gemini برای web_search استفاده کنید
    - به GEMINI_API_KEY یا models.providers.google.apiKey نیاز دارید
    - شما به مبتنی‌سازی بر Google Search نیاز دارید
summary: جستجوی وب Gemini با زمینه‌سازی Google Search
title: جستجوی Gemini
x-i18n:
    generated_at: "2026-05-02T12:05:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 015d77fef123b1fd99d43eb6472bb8c672585328e17735d1fa0ead387cd2066a
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw از مدل‌های Gemini با
[زمینه‌سازی داخلی Google Search](https://ai.google.dev/gemini-api/docs/grounding)
پشتیبانی می‌کند که پاسخ‌های تولیدشده توسط هوش مصنوعی را، با پشتوانه نتایج زنده Google Search و همراه با
ارجاع‌ها، برمی‌گرداند.

## دریافت کلید API

<Steps>
  <Step title="ایجاد کلید">
    به [Google AI Studio](https://aistudio.google.com/apikey) بروید و یک
    کلید API ایجاد کنید.
  </Step>
  <Step title="ذخیره کلید">
    `GEMINI_API_KEY` را در محیط Gateway تنظیم کنید، از
    `models.providers.google.apiKey` دوباره استفاده کنید، یا یک کلید اختصاصی جست‌وجوی وب را از این طریق پیکربندی کنید:

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

**اولویت اعتبارنامه‌ها:** جست‌وجوی وب Gemini ابتدا از
`plugins.entries.google.config.webSearch.apiKey`، سپس از `GEMINI_API_KEY`،
و بعد از `models.providers.google.apiKey` استفاده می‌کند. برای URLهای پایه، مقدار اختصاصی
`plugins.entries.google.config.webSearch.baseUrl` پیش از
`models.providers.google.baseUrl` اولویت دارد.

برای نصب Gateway، کلیدهای محیطی را در `~/.openclaw/.env` قرار دهید.

## نحوه کارکرد

برخلاف ارائه‌دهندگان جست‌وجوی سنتی که فهرستی از پیوندها و قطعه‌متن‌ها برمی‌گردانند،
Gemini از زمینه‌سازی Google Search برای تولید پاسخ‌های ساخته‌شده توسط هوش مصنوعی با
ارجاع‌های درون‌خطی استفاده می‌کند. نتایج شامل هم پاسخ تولیدشده و هم URLهای منبع هستند.

- URLهای ارجاع از زمینه‌سازی Gemini به‌طور خودکار از URLهای بازهدایت Google
  به URLهای مستقیم تبدیل می‌شوند.
- حل بازهدایت پیش از برگرداندن URL نهایی ارجاع، از مسیر محافظ SSRF استفاده می‌کند (HEAD + بررسی‌های بازهدایت +
  اعتبارسنجی http/https).
- حل بازهدایت از پیش‌فرض‌های سخت‌گیرانه SSRF استفاده می‌کند، بنابراین بازهدایت به
  مقصدهای خصوصی/داخلی مسدود می‌شود.

## پارامترهای پشتیبانی‌شده

جست‌وجوی Gemini از `query`، `freshness`، `date_after` و `date_before` پشتیبانی می‌کند.

`count` برای سازگاری مشترک با `web_search` پذیرفته می‌شود، اما زمینه‌سازی Gemini
همچنان به‌جای فهرست N نتیجه‌ای، یک پاسخ تولیدشده همراه با ارجاع‌ها برمی‌گرداند.

`freshness` مقادیر `day`، `week`، `month`، `year` و میان‌برهای مشترک
`pd`، `pw`، `pm` و `py` را می‌پذیرد. OpenClaw این مقادیر، یا یک بازه صریح
`date_after`/`date_before`، را به
`timeRangeFilter` مربوط به زمینه‌سازی Google Search در Gemini تبدیل می‌کند. `country`، `language` و `domain_filter` پشتیبانی نمی‌شوند.

## انتخاب مدل

مدل پیش‌فرض `gemini-2.5-flash` است (سریع و مقرون‌به‌صرفه). هر مدل Gemini
که از زمینه‌سازی پشتیبانی کند می‌تواند از طریق
`plugins.entries.google.config.webSearch.model` استفاده شود.

## بازنویسی URL پایه

وقتی جست‌وجوی وب Gemini باید از طریق پراکسی اپراتور یا نقطه پایانی سفارشی سازگار با Gemini مسیریابی شود،
`plugins.entries.google.config.webSearch.baseUrl` را تنظیم کنید. اگر
این مقدار تنظیم نشده باشد، جست‌وجوی وب Gemini دوباره از `models.providers.google.baseUrl` استفاده می‌کند. مقدار ساده
`https://generativelanguage.googleapis.com` به
`https://generativelanguage.googleapis.com/v1beta` نرمال‌سازی می‌شود؛ مسیرهای پراکسی سفارشی پس از حذف اسلش‌های پایانی، همان‌طور که ارائه شده‌اند نگه داشته می‌شوند.

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همه ارائه‌دهندگان و تشخیص خودکار
- [Brave Search](/fa/tools/brave-search) -- نتایج ساختاریافته همراه با قطعه‌متن‌ها
- [Perplexity Search](/fa/tools/perplexity-search) -- نتایج ساختاریافته + استخراج محتوا
