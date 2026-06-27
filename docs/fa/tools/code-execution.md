---
read_when:
    - می‌خواهید code_execution را فعال یا پیکربندی کنید
    - شما تحلیل راه دور بدون دسترسی به پوسته محلی می‌خواهید
    - می‌خواهید x_search یا web_search را با تحلیل Python از راه دور ترکیب کنید
summary: 'code_execution: اجرای تحلیل Python راه‌دور در sandbox با xAI'
title: اجرای کد
x-i18n:
    generated_at: "2026-06-27T18:56:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d510d0d2b41deab527d456e675a23ef80ac3b55b5f01906ba2c43d90e4452e36
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` تحلیل Python راه‌دور و sandboxشده را روی Responses API شرکت xAI اجرا می‌کند. این ابزار توسط Plugin همراه `xai` (زیر قرارداد `tools`) ثبت می‌شود و به همان نقطه پایانی `https://api.x.ai/v1/responses` ارسال می‌شود که `x_search` هم از آن استفاده می‌کند.

| ویژگی               | مقدار                                                                                 |
| ------------------ | --------------------------------------------------------------------------------- |
| نام ابزار           | `code_execution`                                                                  |
| Plugin ارائه‌دهنده  | `xai` (همراه، `enabledByDefault: true`)                                           |
| احراز هویت          | نمایه احراز هویت xAI، `XAI_API_KEY`، یا `plugins.entries.xai.config.webSearch.apiKey` |
| مدل پیش‌فرض         | `grok-4-1-fast`                                                                   |
| مهلت زمانی پیش‌فرض  | ۳۰ ثانیه                                                                          |
| `maxTurns` پیش‌فرض  | تنظیم‌نشده (xAI محدودیت داخلی خودش را اعمال می‌کند)                              |

این با [`exec`](/fa/tools/exec) محلی متفاوت است:

- `exec` فرمان‌های shell را روی دستگاه شما یا Node جفت‌شده اجرا می‌کند.
- `code_execution` کد Python را در sandbox راه‌دور xAI اجرا می‌کند.

از `code_execution` برای این موارد استفاده کنید:

- محاسبات.
- جدول‌بندی.
- آمار سریع.
- تحلیل‌های سبک نموداری.
- تحلیل داده‌های برگشتی از `x_search` یا `web_search`.

وقتی به فایل‌های محلی، shell، مخزن، یا دستگاه‌های جفت‌شده نیاز دارید، از آن استفاده **نکنید**. برای این کار از [`exec`](/fa/tools/exec) استفاده کنید.

## راه‌اندازی

<Steps>
  <Step title="Provide xAI credentials">
    با Grok OAuth و با استفاده از اشتراک واجد شرایط SuperGrok یا X Premium وارد شوید،
    یا یک کلید API ذخیره کنید. xAI OAuth از راستی‌آزمایی device-code استفاده می‌کند، بنابراین
    از میزبان‌های راه‌دور بدون callback روی localhost هم کار می‌کند. OAuth برای
    `code_execution` و `x_search` کار می‌کند؛ `XAI_API_KEY` یا پیکربندی web-search مربوط به Plugin
    نیز می‌تواند Grok `web_search` را راه‌اندازی کند.

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    هنگام نصب تازه، همان گزینه‌های احراز هویت در onboarding هم در دسترس هستند:

    ```bash
    openclaw onboard --install-daemon
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    یا از یک کلید API استفاده کنید:

    ```bash
    openclaw models auth login --provider xai --method api-key
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
    وقتی اعتبارنامه‌های xAI در دسترس باشند، `code_execution` در دسترس است. برای غیرفعال‌کردن آن،
    `plugins.entries.xai.config.codeExecution.enabled` را روی `false` تنظیم کنید،
    یا از همان بلوک برای تنظیم مدل و مهلت زمانی استفاده کنید.

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

## روش استفاده

به‌صورت طبیعی درخواست بدهید و هدف تحلیل را صریح بیان کنید:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

این ابزار در داخل فقط یک پارامتر `task` می‌گیرد، بنابراین عامل باید کل درخواست تحلیل و هر داده درون‌خطی را در یک prompt ارسال کند.

## خطاها

وقتی ابزار بدون احراز هویت اجرا شود، یک خطای ساخت‌یافته `missing_xai_api_key` برمی‌گرداند که به گزینه‌های نمایه احراز هویت، متغیر محیطی، و پیکربندی اشاره می‌کند. خطا JSON است، نه exception پرتاب‌شده، بنابراین عامل می‌تواند خودش اصلاح کند:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## محدودیت‌ها

- این اجرای راه‌دور xAI است، نه اجرای فرایند محلی.
- نتایج را تحلیل گذرا در نظر بگیرید، نه یک نشست notebook پایدار.
- دسترسی به فایل‌های محلی یا فضای کاری خود را فرض نکنید.
- برای داده‌های تازه X، ابتدا از [`x_search`](/fa/tools/web#x_search) استفاده کنید و نتیجه را به `code_execution` بدهید.

## مرتبط

<CardGroup cols={2}>
  <Card title="Exec tool" href="/fa/tools/exec" icon="terminal">
    اجرای shell محلی روی دستگاه شما یا Node جفت‌شده.
  </Card>
  <Card title="Exec approvals" href="/fa/tools/exec-approvals" icon="shield">
    سیاست مجاز/غیرمجاز برای اجرای shell.
  </Card>
  <Card title="Web tools" href="/fa/tools/web" icon="globe">
    `web_search`، `x_search`، و `web_fetch`.
  </Card>
  <Card title="xAI provider" href="/fa/providers/xai" icon="microchip">
    مدل‌های Grok، جست‌وجوی وب/X، و پیکربندی اجرای کد.
  </Card>
</CardGroup>
