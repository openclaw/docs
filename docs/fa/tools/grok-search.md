---
read_when:
    - می‌خواهید از Grok برای web_search استفاده کنید
    - برای جستجوی وب به XAI_API_KEY نیاز دارید
summary: جستجوی وب Grok از طریق پاسخ‌های مبتنی بر وب xAI
title: جستجوی Grok
x-i18n:
    generated_at: "2026-04-29T23:43:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37e13e7210f0b008616e27ea08d38b4f1efe89d3c4f82a61aaac944a1e1dd0af
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw از Grok به‌عنوان ارائه‌دهندهٔ `web_search` پشتیبانی می‌کند و با استفاده از پاسخ‌های وب‌مبنای xAI، پاسخ‌های ترکیب‌شده توسط هوش مصنوعی را بر پایهٔ نتایج جست‌وجوی زنده همراه با استناد تولید می‌کند.

همان `XAI_API_KEY` می‌تواند ابزار داخلی `x_search` را نیز برای جست‌وجوی پست‌های X (که پیش‌تر Twitter بود) فعال کند. اگر کلید را زیر `plugins.entries.xai.config.webSearch.apiKey` ذخیره کنید، OpenClaw اکنون آن را به‌عنوان fallback برای ارائه‌دهندهٔ مدل xAI همراه نیز دوباره استفاده می‌کند.

برای معیارهای سطح پست در X مانند بازنشرها، پاسخ‌ها، نشانک‌ها یا بازدیدها، به‌جای یک پرس‌وجوی جست‌وجوی گسترده، `x_search` را با URL دقیق پست یا شناسهٔ وضعیت ترجیح دهید.

## راه‌اندازی اولیه و پیکربندی

اگر در یکی از موارد زیر **Grok** را انتخاب کنید:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw می‌تواند یک گام پیگیری جداگانه نشان دهد تا `x_search` را با همان `XAI_API_KEY` فعال کنید. آن گام پیگیری:

- فقط پس از انتخاب Grok برای `web_search` ظاهر می‌شود
- یک انتخاب جداگانهٔ سطح بالای ارائه‌دهندهٔ جست‌وجوی وب نیست
- می‌تواند به‌صورت اختیاری مدل `x_search` را در همان جریان تنظیم کند

اگر از آن صرف‌نظر کنید، می‌توانید بعداً `x_search` را در پیکربندی فعال یا تغییر دهید.

## دریافت کلید API

<Steps>
  <Step title="ایجاد کلید">
    یک کلید API از [xAI](https://console.x.ai/) دریافت کنید.
  </Step>
  <Step title="ذخیرهٔ کلید">
    `XAI_API_KEY` را در محیط Gateway تنظیم کنید، یا از طریق زیر پیکربندی کنید:

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**جایگزین محیطی:** `XAI_API_KEY` را در محیط Gateway تنظیم کنید.
برای نصب gateway، آن را در `~/.openclaw/.env` قرار دهید.

## نحوهٔ کار

Grok از پاسخ‌های وب‌مبنای xAI استفاده می‌کند تا پاسخ‌هایی همراه با استنادهای درون‌خطی ترکیب کند، مشابه رویکرد grounding جست‌وجوی Google در Gemini.

## پارامترهای پشتیبانی‌شده

جست‌وجوی Grok از `query` پشتیبانی می‌کند.

`count` برای سازگاری مشترک `web_search` پذیرفته می‌شود، اما Grok همچنان به‌جای یک فهرست N-نتیجه‌ای، یک پاسخ ترکیب‌شده همراه با استناد برمی‌گرداند.

فیلترهای ویژهٔ ارائه‌دهنده در حال حاضر پشتیبانی نمی‌شوند.

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همهٔ ارائه‌دهنده‌ها و تشخیص خودکار
- [x_search در جست‌وجوی وب](/fa/tools/web#x_search) -- جست‌وجوی درجه‌یک X از طریق xAI
- [جست‌وجوی Gemini](/fa/tools/gemini-search) -- پاسخ‌های ترکیب‌شده توسط هوش مصنوعی از طریق grounding Google
