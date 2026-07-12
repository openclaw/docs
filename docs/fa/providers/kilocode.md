---
read_when:
    - برای چندین مدل زبانی بزرگ، یک کلید API واحد می‌خواهید
    - می‌خواهید مدل‌ها را از طریق Kilo Gateway در OpenClaw اجرا کنید
summary: از API یکپارچهٔ Kilo Gateway برای دسترسی به مدل‌های متعدد در OpenClaw استفاده کنید
title: Gateway کیلو
x-i18n:
    generated_at: "2026-07-12T10:39:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway درخواست‌ها را از طریق یک نقطه پایانی سازگار با OpenAI و یک کلید API واحد، به مدل‌های متعددی هدایت می‌کند.

| ویژگی | مقدار                              |
| -------- | ---------------------------------- |
| ارائه‌دهنده | `kilocode`                         |
| احراز هویت     | `KILOCODE_API_KEY`                 |
| API      | سازگار با OpenAI                  |
| نشانی پایه | `https://api.kilo.ai/api/gateway/` |

## نصب Plugin

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## راه‌اندازی

<Steps>
  <Step title="ایجاد حساب">
    به [app.kilo.ai](https://app.kilo.ai) بروید، وارد شوید یا حسابی ایجاد کنید و سپس یک کلید API بسازید.
  </Step>
  <Step title="اجرای فرایند آغازین">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    یا متغیر محیطی را مستقیماً تنظیم کنید:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="بررسی دردسترس‌بودن مدل">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## مدل پیش‌فرض و فهرست مدل‌ها

مدل پیش‌فرض `kilocode/kilo/auto` است؛ مدلی برای مسیریابی هوشمند که ارائه‌دهنده مالک آن است. OpenClaw نگاشت وظیفه به مدل بالادستی را برای آن
منتشر نمی‌کند؛ مسیریابی پشت `kilo/auto` در اختیار Kilo Gateway است.

OpenClaw هنگام راه‌اندازی، `GET https://api.kilo.ai/api/gateway/models` را فراخوانی می‌کند و مدل‌های کشف‌شده را
پیش از فهرست جایگزین ایستا ادغام می‌کند. فهرست جایگزین ایستا فقط شامل `kilocode/kilo/auto` (`Kilo Auto`،
`input: ["text", "image"]`، `reasoning: true`، `contextWindow: 1000000`، `maxTokens: 128000`) است.

هر مدل موجود در Gateway با قالب `kilocode/<upstream-id>` قابل دسترسی است (برای مثال
`kilocode/anthropic/claude-sonnet-4` و `kilocode/openai/gpt-5.5`). برای مشاهده فهرست کامل کشف‌شده، `/models kilocode` یا
`openclaw models list --provider kilocode` را اجرا کنید.

## نمونه پیکربندی

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

## نکات رفتاری

<AccordionGroup>
  <Accordion title="انتقال و سازگاری">
    Kilo Gateway با OpenRouter سازگار است؛ بنابراین به‌جای شکل‌دهی بومی درخواست‌های OpenAI، از مسیر درخواست
    پراکسی‌گونه و سازگار با OpenAI استفاده می‌کند (بدون `store` و بدون محموله میزان تلاش استدلالی OpenAI).

    - ارجاع‌های Kilo متکی بر Gemini در مسیر پراکسی Gemini باقی می‌مانند: OpenClaw امضاهای تفکر Gemini را
      در آنجا پاک‌سازی می‌کند، اما اعتبارسنجی بومی بازپخش Gemini یا بازنویسی‌های راه‌اندازی اولیه را فعال نمی‌کند.
    - درخواست‌ها از توکن Bearer ساخته‌شده از کلید API شما استفاده می‌کنند.

  </Accordion>

  <Accordion title="پوشش‌دهنده جریان و استدلال">
    پوشش‌دهنده جریان Kilo سرآیند درخواست `X-KILOCODE-FEATURE` را اضافه می‌کند (مقدار پیش‌فرض `openclaw` است و
    می‌توان آن را با متغیر محیطی `KILOCODE_FEATURE` تغییر داد) و محموله‌های میزان تلاش استدلالی را برای
    مدل‌هایی که از آن پشتیبانی می‌کنند، یکدست می‌سازد.

    <Warning>
    ارجاع‌های `kilocode/kilo/auto` و `x-ai/*` از تزریق میزان تلاش استدلالی صرف‌نظر می‌کنند. اگر به پشتیبانی از استدلال نیاز دارید،
    از ارجاع یک مدل مشخص مانند `kilocode/anthropic/claude-sonnet-4` استفاده کنید.
    </Warning>

  </Accordion>

  <Accordion title="عیب‌یابی">
    - اگر کشف مدل هنگام راه‌اندازی ناموفق باشد، OpenClaw به فهرست ایستای شامل `kilocode/kilo/auto` بازمی‌گردد.
    - معتبر بودن کلید API و فعال بودن مدل‌های موردنظر در حساب Kilo خود را بررسی کنید.
    - هنگامی که Gateway به‌صورت سرویس پس‌زمینه اجرا می‌شود، مطمئن شوید `KILOCODE_API_KEY` در دسترس آن فرایند است (برای مثال در `~/.openclaw/.env` یا از طریق `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## مطالب مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    داشبورد Kilo Gateway، کلیدهای API و مدیریت حساب.
  </Card>
</CardGroup>
