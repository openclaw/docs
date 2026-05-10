---
read_when:
    - می‌خواهید code_execution را فعال یا پیکربندی کنید
    - تحلیل از راه دور را بدون دسترسی به پوستهٔ محلی می‌خواهید
    - می‌خواهید x_search یا web_search را با تحلیل Python از راه دور ترکیب کنید
summary: 'code_execution: اجرای تحلیل Python از راه دور در محیط سندباکس‌شده با xAI'
title: اجرای کد
x-i18n:
    generated_at: "2026-05-10T20:09:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76be496e459fac9c7f6b0324cceb884d3a693fd72d7541094d1bb64a4f1b7b8b
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` تحلیل Python راه دور و سندباکس‌شده را روی Responses API شرکت xAI اجرا می‌کند. این ابزار توسط Plugin همراه `xai` (زیر قرارداد `tools`) ثبت می‌شود و به همان نقطه پایانی `https://api.x.ai/v1/responses` ارسال می‌کند که `x_search` از آن استفاده می‌کند.

| ویژگی             | مقدار                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| نام ابزار          | `code_execution`                                                                  |
| Plugin ارائه‌دهنده | `xai` (همراه، `enabledByDefault: true`)                                           |
| احراز هویت         | پروفایل احراز هویت xAI، `XAI_API_KEY`، یا `plugins.entries.xai.config.webSearch.apiKey` |
| مدل پیش‌فرض        | `grok-4-1-fast`                                                                   |
| مهلت زمانی پیش‌فرض | ۳۰ ثانیه                                                                          |
| `maxTurns` پیش‌فرض | تنظیم‌نشده (xAI محدودیت داخلی خودش را اعمال می‌کند)                              |

این با [`exec`](/fa/tools/exec) محلی تفاوت دارد:

- `exec` فرمان‌های shell را روی ماشین شما یا node جفت‌شده اجرا می‌کند.
- `code_execution`، Python را در sandbox راه دور xAI اجرا می‌کند.

از `code_execution` برای این موارد استفاده کنید:

- محاسبات.
- جدول‌بندی.
- آمار سریع.
- تحلیل به سبک نمودار.
- تحلیل داده‌های بازگردانده‌شده توسط `x_search` یا `web_search`.

وقتی به فایل‌های محلی، shell، repo یا دستگاه‌های جفت‌شده نیاز دارید از آن استفاده **نکنید**. برای این کار از [`exec`](/fa/tools/exec) استفاده کنید.

## راه‌اندازی

<Steps>
  <Step title="یک کلید API برای xAI ارائه کنید">
    برای `code_execution` و `x_search`، فرمان `openclaw onboard --auth-choice xai-api-key` را اجرا کنید، یا `XAI_API_KEY` را تنظیم کنید / کلید را زیر Plugin xAI پیکربندی کنید
    وقتی می‌خواهید جست‌وجوی وب Grok نیز از همان اعتبارنامه استفاده کند:

    ```bash
    export XAI_API_KEY=xai-...
    ```

    یا از طریق پیکربندی:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="code_execution را فعال و تنظیم کنید">
    این ابزار با `plugins.entries.xai.config.codeExecution.enabled` کنترل می‌شود. پیش‌فرض خاموش است.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // override the default xAI code-execution model
                maxTurns: 2,            // optional cap on internal tool turns
                timeoutSeconds: 30,     // request timeout (default: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Gateway را راه‌اندازی مجدد کنید">
    ```bash
    openclaw gateway restart
    ```

    پس از اینکه Plugin xAI دوباره با `enabled: true` ثبت شد، `code_execution` در فهرست ابزارهای agent ظاهر می‌شود.

  </Step>
</Steps>

## نحوه استفاده از آن

طبیعی درخواست کنید و هدف تحلیل را صریح بیان کنید:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

این ابزار در داخل فقط یک پارامتر `task` می‌گیرد، بنابراین agent باید درخواست کامل تحلیل و هر داده درون‌خطی را در یک prompt ارسال کند.

## خطاها

وقتی ابزار بدون احراز هویت اجرا شود، یک خطای ساختاریافته `missing_xai_api_key` برمی‌گرداند که به گزینه‌های auth-profile، متغیر محیطی و پیکربندی اشاره می‌کند. خطا JSON است، نه یک استثنای پرتاب‌شده، بنابراین agent می‌تواند خودش آن را اصلاح کند:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Run openclaw onboard --auth-choice xai-api-key, set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## محدودیت‌ها

- این اجرای راه دور xAI است، نه اجرای فرایند محلی.
- نتایج را تحلیل زودگذر در نظر بگیرید، نه یک جلسه notebook پایدار.
- دسترسی به فایل‌های محلی یا workspace خود را فرض نکنید.
- برای داده‌های تازه X، ابتدا از [`x_search`](/fa/tools/web#x_search) استفاده کنید و نتیجه را به `code_execution` لوله کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="ابزار Exec" href="/fa/tools/exec" icon="terminal">
    اجرای shell محلی روی ماشین شما یا node جفت‌شده.
  </Card>
  <Card title="تأییدهای Exec" href="/fa/tools/exec-approvals" icon="shield">
    سیاست مجاز/غیرمجاز برای اجرای shell.
  </Card>
  <Card title="ابزارهای وب" href="/fa/tools/web" icon="globe">
    `web_search`، `x_search` و `web_fetch`.
  </Card>
  <Card title="ارائه‌دهنده xAI" href="/fa/providers/xai" icon="microchip">
    مدل‌های Grok، جست‌وجوی وب/X، و پیکربندی اجرای کد.
  </Card>
</CardGroup>
