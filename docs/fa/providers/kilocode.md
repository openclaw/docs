---
read_when:
    - می‌خواهید برای بسیاری از LLMها یک کلید API واحد داشته باشید
    - می‌خواهید مدل‌ها را از طریق Kilo Gateway در OpenClaw اجرا کنید
summary: برای دسترسی به مدل‌های متعدد در OpenClaw، از API یکپارچهٔ Kilo Gateway استفاده کنید
title: Kilocode
x-i18n:
    generated_at: "2026-04-29T23:26:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: c51012b94d4b720795356b67c8482ae7ee0b37d401689e923be0b7732d77c4aa
    source_path: providers/kilocode.md
    workflow: 16
---

# Kilo Gateway

Kilo Gateway یک **API یکپارچه** ارائه می‌کند که درخواست‌ها را از طریق یک endpoint و کلید API واحد به مدل‌های متعدد هدایت می‌کند. این سرویس با OpenAI سازگار است، بنابراین بیشتر SDKهای OpenAI با تغییر URL پایه کار می‌کنند.

| ویژگی | مقدار                              |
| -------- | ---------------------------------- |
| ارائه‌دهنده | `kilocode`                         |
| احراز هویت     | `KILOCODE_API_KEY`                 |
| API      | سازگار با OpenAI                  |
| URL پایه | `https://api.kilo.ai/api/gateway/` |

## شروع به کار

<Steps>
  <Step title="ایجاد حساب">
    به [app.kilo.ai](https://app.kilo.ai) بروید، وارد شوید یا یک حساب ایجاد کنید، سپس به API Keys بروید و یک کلید جدید بسازید.
  </Step>
  <Step title="اجرای فرایند راه‌اندازی">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    یا متغیر محیطی را مستقیما تنظیم کنید:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="بررسی در دسترس بودن مدل">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## مدل پیش‌فرض

مدل پیش‌فرض `kilocode/kilo/auto` است؛ یک مدل مسیریابی هوشمند متعلق به ارائه‌دهنده که توسط Kilo Gateway مدیریت می‌شود.

<Note>
OpenClaw با `kilocode/kilo/auto` به‌عنوان مرجع پیش‌فرض پایدار رفتار می‌کند، اما نگاشت وظیفه به مدل بالادستی متکی بر منبع برای آن مسیر منتشر نمی‌کند. مسیریابی دقیق بالادستی پشت `kilocode/kilo/auto` در مالکیت Kilo Gateway است و در OpenClaw hard-code نشده است.
</Note>

## کاتالوگ داخلی

OpenClaw هنگام راه‌اندازی، مدل‌های موجود را به‌صورت پویا از Kilo Gateway کشف می‌کند. برای دیدن فهرست کامل مدل‌های در دسترس با حساب خود، از `/models kilocode` استفاده کنید.

هر مدل موجود روی Gateway را می‌توان با پیشوند `kilocode/` استفاده کرد:

| مرجع مدل                              | یادداشت‌ها                              |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | پیش‌فرض — مسیریابی هوشمند            |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic از طریق Kilo                 |
| `kilocode/openai/gpt-5.5`              | OpenAI از طریق Kilo                    |
| `kilocode/google/gemini-3-pro-preview` | Google از طریق Kilo                    |
| ...و بسیاری موارد دیگر                       | برای فهرست کردن همه، از `/models kilocode` استفاده کنید |

<Tip>
هنگام راه‌اندازی، OpenClaw مسیر `GET https://api.kilo.ai/api/gateway/models` را query می‌کند و مدل‌های کشف‌شده را جلوتر از کاتالوگ fallback ایستا ادغام می‌کند. fallback بسته‌بندی‌شده همیشه شامل `kilocode/kilo/auto` (`Kilo Auto`) با `input: ["text", "image"]`، `reasoning: true`، `contextWindow: 1000000` و `maxTokens: 128000` است.
</Tip>

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

<AccordionGroup>
  <Accordion title="انتقال و سازگاری">
    Kilo Gateway در منبع به‌عنوان سازگار با OpenRouter مستند شده است، بنابراین به‌جای شکل‌دهی بومی درخواست OpenAI، روی مسیر سازگار با OpenAI به سبک proxy باقی می‌ماند.

    - مرجع‌های Kilo مبتنی بر Gemini روی مسیر proxy-Gemini باقی می‌مانند، بنابراین OpenClaw پاک‌سازی امضای فکری Gemini را در همان‌جا حفظ می‌کند، بدون اینکه اعتبارسنجی replay بومی Gemini یا بازنویسی‌های bootstrap را فعال کند.
    - Kilo Gateway در پشت صحنه از یک Bearer token با کلید API شما استفاده می‌کند.

  </Accordion>

  <Accordion title="پوشش stream و reasoning">
    پوشش stream مشترک Kilo، header برنامه ارائه‌دهنده را اضافه می‌کند و payloadهای reasoning پروکسی را برای مرجع‌های مدل مشخص پشتیبانی‌شده نرمال‌سازی می‌کند.

    <Warning>
    `kilocode/kilo/auto` و سایر hintهای بدون پشتیبانی proxy-reasoning از تزریق reasoning صرف‌نظر می‌کنند. اگر به پشتیبانی reasoning نیاز دارید، از یک مرجع مدل مشخص مانند `kilocode/anthropic/claude-sonnet-4` استفاده کنید.
    </Warning>

  </Accordion>

  <Accordion title="عیب‌یابی">
    - اگر کشف مدل هنگام راه‌اندازی شکست بخورد، OpenClaw به کاتالوگ ایستای بسته‌بندی‌شده که شامل `kilocode/kilo/auto` است fallback می‌کند.
    - تأیید کنید کلید API شما معتبر است و حساب Kilo شما مدل‌های مورد نظر را فعال کرده است.
    - وقتی Gateway به‌صورت daemon اجرا می‌شود، مطمئن شوید `KILOCODE_API_KEY` برای آن process در دسترس است (برای مثال در `~/.openclaw/.env` یا از طریق `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، مرجع‌های مدل، و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    داشبورد Kilo Gateway، کلیدهای API، و مدیریت حساب.
  </Card>
</CardGroup>
