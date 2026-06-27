---
read_when:
    - می‌خواهید از Grok برای web_search استفاده کنید
    - می‌خواهید از xAI OAuth یا XAI_API_KEY برای جست‌وجوی وب استفاده کنید
summary: جست‌وجوی وب Grok از طریق پاسخ‌های مبتنی بر وب xAI
title: جست‌وجوی Grok
x-i18n:
    generated_at: "2026-06-27T19:00:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d18866f12648c5c194112633f6e888711cab83628dcc06ac58cb7801841a73b
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw از Grok به‌عنوان ارائه‌دهنده‌ی `web_search` پشتیبانی می‌کند و از پاسخ‌های xAI مبتنی بر وب برای تولید پاسخ‌های سنتزشده با هوش مصنوعی استفاده می‌کند که با نتایج جست‌وجوی زنده و همراه با استناد پشتیبانی می‌شوند.

جست‌وجوی وب Grok، در صورت موجود بودن، ورود OAuth فعلی xAI شما را ترجیح می‌دهد. اگر هیچ نمایه‌ی OAuth وجود نداشته باشد، همان کلید API xAI می‌تواند ابزار داخلی `x_search` را برای جست‌وجوی پست‌های X (که قبلاً Twitter بود) و ابزار `code_execution` را نیز راه‌اندازی کند. اگر کلید را در `plugins.entries.xai.config.webSearch.apiKey` ذخیره کنید، OpenClaw از آن به‌عنوان گزینه‌ی جایگزین برای ارائه‌دهنده‌ی مدل xAI همراه‌شده نیز استفاده می‌کند.

برای معیارهای سطح پست X مانند بازنشرها، پاسخ‌ها، نشانک‌ها یا بازدیدها، به‌جای یک پرس‌وجوی جست‌وجوی گسترده، `x_search` را با URL دقیق پست یا شناسه‌ی وضعیت ترجیح دهید.

## راه‌اندازی اولیه و پیکربندی

اگر در زمان‌های زیر **Grok** را انتخاب کنید:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw می‌تواند بدون درخواست کلید جداگانه‌ی جست‌وجوی وب، از یک نمایه‌ی OAuth موجود xAI استفاده کند. اگر OAuth در دسترس نباشد، به راه‌اندازی با کلید API xAI برمی‌گردد. OpenClaw همچنین می‌تواند یک مرحله‌ی پیگیری جداگانه برای فعال‌سازی `x_search` با همان اعتبارنامه‌ی xAI نمایش دهد. آن مرحله‌ی پیگیری:

- فقط پس از انتخاب Grok برای `web_search` ظاهر می‌شود
- یک انتخاب جداگانه‌ی سطح بالای ارائه‌دهنده‌ی جست‌وجوی وب نیست
- می‌تواند به‌صورت اختیاری مدل `x_search` را در همان جریان تنظیم کند

اگر از آن صرف‌نظر کنید، می‌توانید بعداً `x_search` را در پیکربندی فعال یا تغییر دهید.

## وارد شوید یا یک کلید API دریافت کنید

<Steps>
  <Step title="Use xAI OAuth">
    اگر قبلاً در طول راه‌اندازی اولیه یا احراز هویت مدل با xAI وارد شده‌اید، Grok را به‌عنوان ارائه‌دهنده‌ی `web_search` انتخاب کنید. به کلید API جداگانه‌ای نیاز نیست:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Use an API key fallback">
    وقتی OAuth در دسترس نیست یا عمداً پیکربندی جست‌وجوی وب مبتنی بر کلید می‌خواهید، یک کلید API از [xAI](https://console.x.ai/) دریافت کنید.
  </Step>
  <Step title="Store the key">
    `XAI_API_KEY` را در محیط Gateway تنظیم کنید، یا از این راه پیکربندی کنید:

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
            apiKey: "xai-...", // optional if xAI OAuth or XAI_API_KEY is available
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

**جایگزین‌های اعتبارنامه:** با `openclaw models auth login
--provider xai --method oauth` وارد شوید، `XAI_API_KEY` را در محیط Gateway تنظیم کنید، یا `plugins.entries.xai.config.webSearch.apiKey` را ذخیره کنید. برای نصب gateway، متغیرهای محیطی را در `~/.openclaw/.env` قرار دهید.

## نحوه‌ی کارکرد

Grok از پاسخ‌های xAI مبتنی بر وب برای سنتز پاسخ‌ها با استنادهای درون‌خطی استفاده می‌کند؛ مشابه رویکرد مبتنی‌سازی Gemini با Google Search.

## پارامترهای پشتیبانی‌شده

جست‌وجوی Grok از `query` پشتیبانی می‌کند.

`count` برای سازگاری مشترک `web_search` پذیرفته می‌شود، اما Grok همچنان به‌جای فهرست N نتیجه‌ای، یک پاسخ سنتزشده همراه با استناد برمی‌گرداند.

فیلترهای ویژه‌ی ارائه‌دهنده در حال حاضر پشتیبانی نمی‌شوند.

Grok از زمان‌پایان پیش‌فرض ۶۰ ثانیه‌ای ویژه‌ی ارائه‌دهنده استفاده می‌کند، چون جست‌وجوهای مبتنی بر وب xAI Responses می‌توانند طولانی‌تر از مقدار پیش‌فرض مشترک `web_search` اجرا شوند. برای بازنویسی آن، `tools.web.search.timeoutSeconds` را تنظیم کنید.

## بازنویسی‌های URL پایه

وقتی جست‌وجوی وب Grok باید از طریق پراکسی اپراتور یا نقطه‌ی پایانی Responses سازگار با xAI مسیریابی شود، `plugins.entries.xai.config.webSearch.baseUrl` را تنظیم کنید. OpenClaw پس از حذف اسلش‌های پایانی، به `<baseUrl>/responses` پست می‌کند. `x_search` از همان گزینه‌ی جایگزین `webSearch.baseUrl` استفاده می‌کند، مگر اینکه `plugins.entries.xai.config.xSearch.baseUrl` تنظیم شده باشد.

## مرتبط

- [نمای کلی Web Search](/fa/tools/web) -- همه‌ی ارائه‌دهندگان و تشخیص خودکار
- [`x_search` در Web Search](/fa/tools/web#x_search) -- جست‌وجوی درجه‌اول X از طریق xAI
- [Gemini Search](/fa/tools/gemini-search) -- پاسخ‌های سنتزشده با هوش مصنوعی از طریق مبتنی‌سازی Google
