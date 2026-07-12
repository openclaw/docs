---
read_when:
    - می‌خواهید از Gemini برای `web_search` استفاده کنید
    - به `GEMINI_API_KEY` یا `models.providers.google.apiKey` نیاز دارید
    - شما به تثبیت پاسخ‌ها بر پایهٔ جست‌وجوی Google نیاز دارید
summary: جست‌وجوی وب Gemini با اتکا به Google Search
title: جست‌وجوی Gemini
x-i18n:
    generated_at: "2026-07-12T10:55:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw از مدل‌های Gemini با قابلیت داخلی
[اتکای Google Search](https://ai.google.dev/gemini-api/docs/grounding)
پشتیبانی می‌کند؛ این قابلیت پاسخ‌های ترکیب‌شده توسط هوش مصنوعی را ارائه می‌دهد که با نتایج زندهٔ Google Search و ارجاعات پشتیبانی می‌شوند.

## دریافت کلید API

<Steps>
  <Step title="ایجاد کلید">
    به [Google AI Studio](https://aistudio.google.com/apikey) بروید و یک
    کلید API ایجاد کنید.
  </Step>
  <Step title="ذخیره‌سازی کلید">
    `GEMINI_API_KEY` را در محیط Gateway تنظیم کنید، از
    `models.providers.google.apiKey` دوباره استفاده کنید، یا با دستور زیر یک کلید اختصاصی برای جست‌وجوی وب پیکربندی کنید:

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
`plugins.entries.google.config.webSearch.apiKey`، سپس از `GEMINI_API_KEY` و
پس از آن از `models.providers.google.apiKey` استفاده می‌کند. برای URLهای پایه نیز
`plugins.entries.google.config.webSearch.baseUrl` اختصاصی بر
`models.providers.google.baseUrl` اولویت دارد.

برای نصب Gateway، کلیدهای محیطی را در `~/.openclaw/.env` قرار دهید.

## نحوهٔ عملکرد

برخلاف ارائه‌دهندگان جست‌وجوی سنتی که فهرستی از پیوندها و قطعه‌متن‌ها را
برمی‌گردانند، Gemini با استفاده از اتکای Google Search پاسخ‌هایی ترکیب‌شده توسط
هوش مصنوعی همراه با ارجاعات درون‌خطی تولید می‌کند. نتایج هم پاسخ ترکیب‌شده و هم
URLهای منبع را دربر می‌گیرند.

- URLهای ارجاع حاصل از اتکای Gemini به‌طور خودکار از URLهای تغییرمسیر Google
  به URLهای مستقیم تبدیل می‌شوند؛ این کار با یک درخواست HEAD از مسیر واکشی
  محافظت‌شده در برابر SSRF در OpenClaw انجام می‌شود (دنبال‌کردن تغییرمسیرها و اعتبارسنجی http/https).
- تبدیل تغییرمسیرها از پیش‌فرض‌های سخت‌گیرانهٔ SSRF استفاده می‌کند؛ بنابراین
  تغییرمسیر به مقصدهای خصوصی یا داخلی مسدود می‌شود.

## پارامترهای پشتیبانی‌شده

جست‌وجوی Gemini از `query`، `freshness`، `date_after` و `date_before` پشتیبانی می‌کند.

`count` برای سازگاری با `web_search` مشترک پذیرفته می‌شود، اما اتکای Gemini
همچنان به‌جای فهرستی با N نتیجه، یک پاسخ ترکیب‌شده همراه با ارجاعات برمی‌گرداند.

`freshness` مقادیر `day`، `week`، `month`، `year` و میان‌برهای مشترک
`pd`، `pw`، `pm` و `py` را می‌پذیرد. `day`/`pd` به‌جای تعیین یک بازهٔ سخت‌گیرانهٔ
۲۴ ساعته، یک دستور تازگی به پرس‌وجوی Gemini اضافه می‌کند. `week`، `month`، `year`
و بازه‌های صریح `date_after`/`date_before`، مقدار `timeRangeFilter` قابلیت اتکای
Gemini به Google Search را تنظیم می‌کنند. `country`، `language` و `domain_filter`
پشتیبانی نمی‌شوند.

## انتخاب مدل

مدل پیش‌فرض `gemini-2.5-flash` است (سریع و مقرون‌به‌صرفه). هر مدل Gemini که
از اتکا پشتیبانی کند، از طریق `plugins.entries.google.config.webSearch.model`
قابل استفاده است.

## بازنویسی URL پایه

وقتی جست‌وجوی وب Gemini باید از طریق پراکسی اپراتور یا یک نقطهٔ پایانی سفارشی
سازگار با Gemini مسیریابی شود، `plugins.entries.google.config.webSearch.baseUrl`
را تنظیم کنید. اگر تنظیم نشده باشد، جست‌وجوی وب Gemini از
`models.providers.google.baseUrl` دوباره استفاده می‌کند. مقدار سادهٔ
`https://generativelanguage.googleapis.com` به
`https://generativelanguage.googleapis.com/v1beta` نرمال‌سازی می‌شود؛ مسیرهای
پراکسی سفارشی پس از حذف اسلش‌های انتهایی، به همان شکل ارائه‌شده حفظ می‌شوند.

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همهٔ ارائه‌دهندگان و تشخیص خودکار
- [Brave Search](/fa/tools/brave-search) -- نتایج ساخت‌یافته همراه با قطعه‌متن‌ها
- [Perplexity Search](/fa/tools/perplexity-search) -- نتایج ساخت‌یافته به‌همراه استخراج محتوا
