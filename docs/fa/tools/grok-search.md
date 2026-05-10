---
read_when:
    - می‌خواهید از Grok برای web_search استفاده کنید
    - برای جستجوی وب به XAI_API_KEY نیاز دارید
summary: جست‌وجوی وب Grok از طریق پاسخ‌های مبتنی بر وب xAI
title: جستجوی Grok
x-i18n:
    generated_at: "2026-05-10T20:10:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91220e1f9d3fb998d8270af5d5e9e2e47658688de00be0bab7a265910acef478
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw از Grok به‌عنوان ارائه‌دهنده‌ی `web_search` پشتیبانی می‌کند و از پاسخ‌های مبتنی بر وب xAI برای تولید پاسخ‌های سنتزشده با هوش مصنوعی، پشتیبانی‌شده با نتایج جست‌وجوی زنده و همراه با ارجاع‌ها استفاده می‌کند.

همان کلید API xAI همچنین می‌تواند ابزار داخلی `x_search` را برای جست‌وجوی پست‌های X (که پیش‌تر Twitter بود) و ابزار `code_execution` را فعال کند. اگر کلید را زیر `plugins.entries.xai.config.webSearch.apiKey` ذخیره کنید، OpenClaw اکنون آن را به‌عنوان گزینه‌ی جایگزین برای ارائه‌دهنده‌ی مدل xAI بسته‌بندی‌شده نیز دوباره استفاده می‌کند.

برای معیارهای سطح پست در X، مانند بازنشرها، پاسخ‌ها، نشانک‌ها یا بازدیدها، به‌جای یک پرس‌وجوی جست‌وجوی گسترده، از `x_search` با URL دقیق پست یا شناسه‌ی وضعیت استفاده کنید.

## آنبوردینگ و پیکربندی

اگر در طول موارد زیر **Grok** را انتخاب کنید:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw می‌تواند یک مرحله‌ی پیگیری جداگانه برای فعال‌کردن `x_search` با همان `XAI_API_KEY` نشان دهد. آن مرحله‌ی پیگیری:

- فقط پس از انتخاب Grok برای `web_search` ظاهر می‌شود
- یک انتخاب جداگانه‌ی سطح بالای ارائه‌دهنده‌ی جست‌وجوی وب نیست
- می‌تواند به‌صورت اختیاری مدل `x_search` را در همان جریان تنظیم کند

اگر آن را رد کنید، می‌توانید بعداً `x_search` را در پیکربندی فعال یا تغییر دهید.

## دریافت یک کلید API

<Steps>
  <Step title="Create a key">
    یک کلید API از [xAI](https://console.x.ai/) دریافت کنید.
  </Step>
  <Step title="Store the key">
    `XAI_API_KEY` را در محیط Gateway تنظیم کنید، یا از این طریق پیکربندی کنید:

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
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
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
برای نصب Gateway، آن را در `~/.openclaw/.env` قرار دهید.

## نحوه‌ی کار

Grok از پاسخ‌های مبتنی بر وب xAI برای سنتز پاسخ‌ها با ارجاع‌های درون‌خطی استفاده می‌کند، مشابه رویکرد grounding جست‌وجوی Google در Gemini.

## پارامترهای پشتیبانی‌شده

جست‌وجوی Grok از `query` پشتیبانی می‌کند.

`count` برای سازگاری مشترک `web_search` پذیرفته می‌شود، اما Grok همچنان به‌جای یک فهرست Nتایی از نتایج، یک پاسخ سنتزشده با ارجاع‌ها برمی‌گرداند.

فیلترهای اختصاصی ارائه‌دهنده در حال حاضر پشتیبانی نمی‌شوند.

Grok از مهلت پیش‌فرض ۶۰ ثانیه‌ای اختصاصی ارائه‌دهنده استفاده می‌کند، زیرا جست‌وجوهای مبتنی بر وب xAI Responses می‌توانند بیشتر از پیش‌فرض مشترک `web_search` طول بکشند. برای بازنویسی آن، `tools.web.search.timeoutSeconds` را تنظیم کنید.

## بازنویسی‌های URL پایه

زمانی `plugins.entries.xai.config.webSearch.baseUrl` را تنظیم کنید که جست‌وجوی وب Grok باید از طریق یک پراکسی اپراتور یا نقطه‌ی پایانی Responses سازگار با xAI مسیریابی شود. OpenClaw پس از حذف اسلش‌های انتهایی، به `<baseUrl>/responses` پست می‌کند. `x_search` از همان جایگزین `webSearch.baseUrl` استفاده می‌کند، مگر اینکه `plugins.entries.xai.config.xSearch.baseUrl` تنظیم شده باشد.

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همه‌ی ارائه‌دهندگان و تشخیص خودکار
- [`x_search` در جست‌وجوی وب](/fa/tools/web#x_search) -- جست‌وجوی درجه‌یک X از طریق xAI
- [جست‌وجوی Gemini](/fa/tools/gemini-search) -- پاسخ‌های سنتزشده با هوش مصنوعی از طریق grounding Google
