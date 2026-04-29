---
read_when:
    - می‌خواهید از Gemini برای web_search استفاده کنید
    - به GEMINI_API_KEY نیاز دارید
    - به زمینه‌سازی با Google Search نیاز دارید
summary: جست‌وجوی وب Gemini با اتکا به Google Search
title: جست‌وجوی Gemini
x-i18n:
    generated_at: "2026-04-29T23:42:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0778ae326e23ea1bb719fdc694b2accc5a6651e08658a695d4d70e20fc5943a4
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw از مدل‌های Gemini با
[زمینه‌سازی داخلی Google Search](https://ai.google.dev/gemini-api/docs/grounding)
پشتیبانی می‌کند؛ این قابلیت پاسخ‌های ساخته‌شده توسط هوش مصنوعی را که با نتایج زنده Google Search و همراه با
ارجاع‌ها پشتیبانی می‌شوند، برمی‌گرداند.

## دریافت یک کلید API

<Steps>
  <Step title="ایجاد یک کلید">
    به [Google AI Studio](https://aistudio.google.com/apikey) بروید و یک
    کلید API ایجاد کنید.
  </Step>
  <Step title="ذخیره کلید">
    `GEMINI_API_KEY` را در محیط Gateway تنظیم کنید، یا از این طریق پیکربندی کنید:

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
            apiKey: "AIza...", // optional if GEMINI_API_KEY is set
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

**جایگزین محیطی:** `GEMINI_API_KEY` را در محیط Gateway تنظیم کنید.
برای نصب Gateway، آن را در `~/.openclaw/.env` قرار دهید.

## نحوه کارکرد

برخلاف ارائه‌دهندگان جست‌وجوی سنتی که فهرستی از لینک‌ها و قطعه‌متن‌ها را برمی‌گردانند،
Gemini از زمینه‌سازی Google Search برای تولید پاسخ‌های ساخته‌شده توسط هوش مصنوعی همراه با
ارجاع‌های درون‌خطی استفاده می‌کند. نتایج هم شامل پاسخ ساخته‌شده و هم شامل
URLهای منبع هستند.

- URLهای ارجاع از زمینه‌سازی Gemini به‌طور خودکار از URLهای تغییرمسیر Google
  به URLهای مستقیم تبدیل می‌شوند.
- حل‌وفصل تغییرمسیر پیش از برگرداندن URL نهایی ارجاع، از مسیر محافظ SSRF استفاده می‌کند (HEAD + بررسی‌های تغییرمسیر +
  اعتبارسنجی http/https).
- حل‌وفصل تغییرمسیر از پیش‌فرض‌های سخت‌گیرانه SSRF استفاده می‌کند، بنابراین تغییرمسیرها به
  مقصدهای خصوصی/داخلی مسدود می‌شوند.

## پارامترهای پشتیبانی‌شده

جست‌وجوی Gemini از `query` پشتیبانی می‌کند.

`count` برای سازگاری با `web_search` مشترک پذیرفته می‌شود، اما زمینه‌سازی Gemini
همچنان به‌جای فهرست N نتیجه‌ای، یک پاسخ ساخته‌شده همراه با ارجاع‌ها
برمی‌گرداند.

فیلترهای مخصوص ارائه‌دهنده مانند `country`، `language`، `freshness`، و
`domain_filter` پشتیبانی نمی‌شوند.

## انتخاب مدل

مدل پیش‌فرض `gemini-2.5-flash` است (سریع و مقرون‌به‌صرفه). هر مدل Gemini
که از زمینه‌سازی پشتیبانی کند، می‌تواند از طریق
`plugins.entries.google.config.webSearch.model` استفاده شود.

## مرتبط

- [نمای کلی Web Search](/fa/tools/web) -- همه ارائه‌دهندگان و تشخیص خودکار
- [Brave Search](/fa/tools/brave-search) -- نتایج ساختاریافته همراه با قطعه‌متن‌ها
- [Perplexity Search](/fa/tools/perplexity-search) -- نتایج ساختاریافته + استخراج محتوا
