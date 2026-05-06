---
read_when:
    - می‌خواهید code_execution را فعال یا پیکربندی کنید
    - می‌خواهید تحلیل از راه دور را بدون دسترسی به پوستهٔ محلی انجام دهید
    - می‌خواهید x_search یا web_search را با تحلیل Python از راه دور ترکیب کنید
summary: 'code_execution: اجرای تحلیل Python از راه دور و در محیط سندباکس با xAI'
title: اجرای کد
x-i18n:
    generated_at: "2026-05-06T09:45:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: a37e921c0016a32b01558c255bc05fcf24146f363a022da87feb94f3d6d48527
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` تحلیل Python راه دور را در محیط ایزوله روی Responses API مربوط به xAI اجرا می‌کند. این ابزار توسط Plugin همراه `xai` (تحت قرارداد `tools`) ثبت می‌شود و درخواست‌ها را به همان نقطهٔ پایانی `https://api.x.ai/v1/responses` می‌فرستد که `x_search` از آن استفاده می‌کند.

| ویژگی           | مقدار                                                          |
| ------------------ | -------------------------------------------------------------- |
| نام ابزار          | `code_execution`                                               |
| Plugin ارائه‌دهنده    | `xai` (همراه، `enabledByDefault: true`)                      |
| احراز هویت               | `XAI_API_KEY` یا `plugins.entries.xai.config.webSearch.apiKey` |
| مدل پیش‌فرض      | `grok-4-1-fast`                                                |
| مهلت زمانی پیش‌فرض    | ۳۰ ثانیه                                                     |
| `maxTurns` پیش‌فرض | تنظیم‌نشده (xAI محدودیت داخلی خودش را اعمال می‌کند)                     |

این با [`exec`](/fa/tools/exec) محلی فرق دارد:

- `exec` فرمان‌های پوسته را روی ماشین شما یا Node جفت‌شده اجرا می‌کند.
- `code_execution`، Python را در محیط ایزولهٔ راه دور xAI اجرا می‌کند.

از `code_execution` برای این موارد استفاده کنید:

- محاسبات.
- جدول‌سازی.
- آمار سریع.
- تحلیل‌های شبیه نمودار.
- تحلیل داده‌های برگشتی از `x_search` یا `web_search`.

وقتی به فایل‌های محلی، پوسته، مخزن، یا دستگاه‌های جفت‌شده نیاز دارید، از آن استفاده **نکنید**. برای این کار از [`exec`](/fa/tools/exec) استفاده کنید.

## راه‌اندازی

<Steps>
  <Step title="Provide an xAI API key">
    `XAI_API_KEY` را در محیط Gateway تنظیم کنید، یا کلید را زیر Plugin مربوط به xAI پیکربندی کنید تا همان اعتبارنامه `code_execution`، `x_search`، جست‌وجوی وب، و سایر ابزارهای xAI را پوشش دهد:

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

  <Step title="Enable and tune code_execution">
    این ابزار پشت `plugins.entries.xai.config.codeExecution.enabled` فعال می‌شود. پیش‌فرض خاموش است.

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

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    پس از اینکه Plugin مربوط به xAI دوباره با `enabled: true` ثبت شد، `code_execution` در فهرست ابزارهای عامل ظاهر می‌شود.

  </Step>
</Steps>

## نحوهٔ استفاده

به‌صورت طبیعی درخواست کنید و هدف تحلیل را صریح بیان کنید:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

این ابزار درون‌سیستمی یک پارامتر `task` می‌گیرد، بنابراین عامل باید کل درخواست تحلیل و هر دادهٔ درون‌خطی را در یک پرامپت بفرستد.

## خطاها

وقتی ابزار بدون احراز هویت اجرا شود، یک خطای ساختاریافتهٔ `missing_xai_api_key` برمی‌گرداند که به متغیر محیطی و مسیر پیکربندی اشاره می‌کند. خطا JSON است، نه یک استثنای پرتاب‌شده، بنابراین عامل می‌تواند خودش اصلاح کند:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## محدودیت‌ها

- این اجرای راه دور xAI است، نه اجرای فرایند محلی.
- نتایج را تحلیل زودگذر بدانید، نه یک نشست دفترچهٔ پایدار.
- دسترسی به فایل‌های محلی یا فضای کاری خود را فرض نکنید.
- برای داده‌های تازهٔ X، ابتدا از [`x_search`](/fa/tools/web#x_search) استفاده کنید و نتیجه را به `code_execution` بدهید.

## مرتبط

<CardGroup cols={2}>
  <Card title="Exec tool" href="/fa/tools/exec" icon="terminal">
    اجرای پوستهٔ محلی روی ماشین شما یا Node جفت‌شده.
  </Card>
  <Card title="Exec approvals" href="/fa/tools/exec-approvals" icon="shield">
    سیاست اجازه/رد برای اجرای پوسته.
  </Card>
  <Card title="Web tools" href="/fa/tools/web" icon="globe">
    `web_search`، `x_search`، و `web_fetch`.
  </Card>
  <Card title="xAI provider" href="/fa/providers/xai" icon="microchip">
    مدل‌های Grok، جست‌وجوی وب/X، و پیکربندی اجرای کد.
  </Card>
</CardGroup>
