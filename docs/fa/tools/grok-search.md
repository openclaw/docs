---
read_when:
    - می‌خواهید برای `web_search` از Grok استفاده کنید
    - می‌خواهید برای جست‌وجوی وب از OAuth شرکت xAI یا یک XAI_API_KEY استفاده کنید
summary: جست‌وجوی وب Grok از طریق پاسخ‌های مبتنی بر وب xAI
title: جست‌وجوی Grok
x-i18n:
    generated_at: "2026-07-12T11:02:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw از Grok به‌عنوان ارائه‌دهندهٔ `web_search` پشتیبانی می‌کند و با استفاده از پاسخ‌های xAI مبتنی بر داده‌های وب، پاسخ‌های ترکیب‌شده به‌وسیلهٔ هوش مصنوعی را تولید می‌کند که با نتایج زندهٔ جست‌وجو و ارجاعات پشتیبانی می‌شوند.

جست‌وجوی وب Grok در صورت وجود، ورود OAuth فعلی xAI را ترجیح می‌دهد. اگر هیچ نمایهٔ OAuth وجود نداشته باشد، همان کلید API ‏xAI ابزار داخلی `x_search` را نیز برای جست‌وجوی پست‌های X (توییتر سابق) و ابزار `code_execution` فعال می‌کند. ذخیره‌کردن کلید در `plugins.entries.xai.config.webSearch.apiKey` همچنین به OpenClaw اجازه می‌دهد از آن به‌عنوان گزینهٔ جایگزین برای ارائه‌دهندهٔ مدل xAI همراه بسته استفاده کند.

برای معیارهای سطح پست X (بازنشرها، پاسخ‌ها، نشانک‌ها و بازدیدها)، به‌جای یک عبارت جست‌وجوی گسترده، از [`x_search`](/fa/tools/web#x_search) همراه با نشانی دقیق پست یا شناسهٔ وضعیت استفاده کنید.

## راه‌اندازی اولیه و پیکربندی

انتخاب **Grok** هنگام اجرای `openclaw onboard` یا `openclaw configure --section
web` به OpenClaw اجازه می‌دهد بدون درخواست کلید جداگانه برای جست‌وجوی وب، از نمایهٔ OAuth فعلی xAI استفاده کند. در نبود OAuth، به راه‌اندازی کلید API ‏xAI بازمی‌گردد.

سپس OpenClaw مرحلهٔ تکمیلی‌ای برای فعال‌کردن `x_search` با همان اعتبارنامهٔ xAI ارائه می‌دهد. این مرحلهٔ تکمیلی:

- فقط پس از انتخاب Grok برای `web_search` نمایش داده می‌شود
- یک گزینهٔ جداگانهٔ سطح‌بالا برای ارائه‌دهندهٔ جست‌وجوی وب نیست
- می‌تواند به‌صورت اختیاری مدل `x_search` را در همان فرایند تنظیم کند

برای فعال‌کردن یا تغییر `x_search` در آینده از طریق پیکربندی، از این مرحله صرف‌نظر کنید.

## ورود به حساب یا دریافت کلید API

<Steps>
  <Step title="استفاده از OAuth ‏xAI">
    اگر پیش‌تر هنگام راه‌اندازی اولیه یا احراز هویت مدل وارد xAI شده‌اید،
    Grok را به‌عنوان ارائه‌دهندهٔ `web_search` انتخاب کنید. به کلید API جداگانه‌ای نیاز نیست:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="استفاده از کلید API جایگزین">
    هنگامی که OAuth در دسترس نیست یا عمداً می‌خواهید پیکربندی جست‌وجوی وب بر کلید متکی باشد، یک کلید API از [xAI](https://console.x.ai/) دریافت کنید.
  </Step>
  <Step title="ذخیره‌کردن کلید">
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
            apiKey: "xai-...", // در صورت دردسترس‌بودن OAuth ‏xAI یا XAI_API_KEY اختیاری است
            baseUrl: "https://api.x.ai/v1", // بازنویسی اختیاری نشانی پایه/پراکسی Responses API
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

**گزینه‌های جایگزین اعتبارنامه:** `openclaw models auth login --provider xai
--method oauth`، متغیر `XAI_API_KEY` در محیط Gateway، یا
`plugins.entries.xai.config.webSearch.apiKey`. برای نصب Gateway، متغیرهای محیطی را در `~/.openclaw/.env` قرار دهید.

## نحوهٔ کار

Grok برای ترکیب پاسخ‌هایی با ارجاعات درون‌متنی از پاسخ‌های مبتنی بر داده‌های وب xAI استفاده می‌کند؛ رویکردی مشابه روش زمینه‌سازی Google Search در Gemini.

## پارامترهای پشتیبانی‌شده

جست‌وجوی Grok از `query` پشتیبانی می‌کند. برای سازگاری مشترک با `web_search`، پارامتر `count` پذیرفته می‌شود، اما Grok همیشه به‌جای فهرستی با N نتیجه، یک پاسخ ترکیب‌شده همراه با ارجاعات برمی‌گرداند. پالایه‌های مختص ارائه‌دهنده پشتیبانی نمی‌شوند.

مهلت زمانی پیش‌فرض Grok برابر با ۶۰ ثانیه است، زیرا جست‌وجوهای Responses مبتنی بر داده‌های وب xAI ممکن است بیشتر از مهلت زمانی پیش‌فرض مشترک `web_search` طول بکشند. آن را با `tools.web.search.timeoutSeconds` بازنویسی کنید.

## بازنویسی نشانی پایه

برای هدایت جست‌وجوی وب Grok از طریق پراکسی اپراتور یا نقطهٔ پایانی Responses سازگار با xAI، مقدار `plugins.entries.xai.config.webSearch.baseUrl` را تنظیم کنید. OpenClaw پس از حذف ممیزهای انتهایی، درخواست را به `<baseUrl>/responses` ارسال می‌کند. اگر `plugins.entries.xai.config.xSearch.baseUrl` تنظیم نشده باشد، `x_search` از همان `webSearch.baseUrl` به‌عنوان گزینهٔ جایگزین استفاده می‌کند.

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همهٔ ارائه‌دهندگان و تشخیص خودکار
- [`x_search` در جست‌وجوی وب](/fa/tools/web#x_search) -- جست‌وجوی درجه‌یک X از طریق xAI
- [جست‌وجوی Gemini](/fa/tools/gemini-search) -- پاسخ‌های ترکیب‌شده به‌وسیلهٔ هوش مصنوعی از طریق زمینه‌سازی Google
