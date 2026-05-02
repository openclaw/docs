---
read_when:
    - می‌خواهید از Grok برای web_search استفاده کنید
    - برای جست‌وجوی وب به XAI_API_KEY نیاز دارید
summary: جست‌وجوی وب Grok از طریق پاسخ‌های مبتنی بر وب xAI
title: جستجوی Grok
x-i18n:
    generated_at: "2026-05-02T12:05:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7238be2b488ba285c948065f5c1deff21898409aa11bdaa9ec893274d0eadd4a
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw از Grok به‌عنوان ارائه‌دهنده‌ی `web_search` پشتیبانی می‌کند و از پاسخ‌های مبتنی بر وب xAI برای تولید پاسخ‌های سنتزشده توسط هوش مصنوعی استفاده می‌کند که با نتایج جست‌وجوی زنده و استنادها پشتیبانی می‌شوند.

همان `XAI_API_KEY` می‌تواند ابزار داخلی `x_search` را نیز برای جست‌وجوی پست‌های X (قبلاً Twitter) تأمین کند. اگر کلید را زیر `plugins.entries.xai.config.webSearch.apiKey` ذخیره کنید، OpenClaw اکنون آن را به‌عنوان گزینه‌ی جایگزین برای ارائه‌دهنده‌ی مدل xAI همراه نیز دوباره استفاده می‌کند.

برای معیارهای سطح پست در X مانند بازنشرها، پاسخ‌ها، نشانک‌ها یا بازدیدها، به‌جای یک پرس‌وجوی جست‌وجوی گسترده، استفاده از `x_search` با URL دقیق پست یا شناسه‌ی status را ترجیح دهید.

## راه‌اندازی اولیه و پیکربندی

اگر هنگام اجرای موارد زیر **Grok** را انتخاب کنید:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw می‌تواند یک مرحله‌ی پیگیری جداگانه نشان دهد تا `x_search` را با همان `XAI_API_KEY` فعال کنید. آن مرحله‌ی پیگیری:

- فقط پس از انتخاب Grok برای `web_search` ظاهر می‌شود
- یک انتخاب جداگانه‌ی سطح بالا برای ارائه‌دهنده‌ی جست‌وجوی وب نیست
- می‌تواند به‌صورت اختیاری مدل `x_search` را در همان جریان تنظیم کند

اگر از آن بگذرید، می‌توانید بعداً `x_search` را در پیکربندی فعال یا تغییر دهید.

## دریافت کلید API

<Steps>
  <Step title="ایجاد کلید">
    یک کلید API از [xAI](https://console.x.ai/) دریافت کنید.
  </Step>
  <Step title="ذخیره‌سازی کلید">
    `XAI_API_KEY` را در محیط Gateway تنظیم کنید، یا از طریق دستور زیر پیکربندی کنید:

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
برای نصب gateway، آن را در `~/.openclaw/.env` قرار دهید.

## سازوکار

Grok از پاسخ‌های مبتنی بر وب xAI استفاده می‌کند تا پاسخ‌هایی با استنادهای درون‌خطی بسازد، مشابه رویکرد grounding جست‌وجوی Google در Gemini.

## پارامترهای پشتیبانی‌شده

جست‌وجوی Grok از `query` پشتیبانی می‌کند.

`count` برای سازگاری مشترک `web_search` پذیرفته می‌شود، اما Grok همچنان به‌جای فهرست N نتیجه‌ای، یک پاسخ سنتزشده همراه با استنادها برمی‌گرداند.

فیلترهای ویژه‌ی ارائه‌دهنده در حال حاضر پشتیبانی نمی‌شوند.

Grok از مهلت پیش‌فرض ۶۰ ثانیه‌ای ویژه‌ی ارائه‌دهنده استفاده می‌کند، چون جست‌وجوهای مبتنی بر وب xAI Responses می‌توانند طولانی‌تر از پیش‌فرض مشترک `web_search` اجرا شوند. برای بازنویسی آن، `tools.web.search.timeoutSeconds` را تنظیم کنید.

## بازنویسی‌های URL پایه

وقتی جست‌وجوی وب Grok باید از طریق پروکسی اپراتور یا نقطه‌ی پایانی Responses سازگار با xAI مسیریابی شود، `plugins.entries.xai.config.webSearch.baseUrl` را تنظیم کنید. OpenClaw پس از حذف اسلش‌های انتهایی به `<baseUrl>/responses` پست می‌کند. `x_search` از همان جایگزین `webSearch.baseUrl` استفاده می‌کند، مگر اینکه `plugins.entries.xai.config.xSearch.baseUrl` تنظیم شده باشد.

## مرتبط

- [نمای کلی Web Search](/fa/tools/web) -- همه‌ی ارائه‌دهندگان و تشخیص خودکار
- [`x_search` در Web Search](/fa/tools/web#x_search) -- جست‌وجوی درجه‌یک X از طریق xAI
- [Gemini Search](/fa/tools/gemini-search) -- پاسخ‌های سنتزشده توسط هوش مصنوعی از طریق grounding در Google
