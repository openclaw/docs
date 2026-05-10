---
read_when:
    - به یک کلید API واحد برای بسیاری از LLMها نیاز دارید
    - می‌خواهید مدل‌ها را از طریق Kilo Gateway در OpenClaw اجرا کنید
summary: از API یکپارچهٔ Kilo Gateway برای دسترسی به مدل‌های متعدد در OpenClaw استفاده کنید
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-10T20:04:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3de2d983a028082d0a897fdafa48ff1f2ad82f3aacec547763159db07adb00a2
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway یک **API یکپارچه** ارائه می‌کند که درخواست‌ها را به مدل‌های متعدد پشت یک
نقطه پایانی و کلید API واحد هدایت می‌کند. این API با OpenAI سازگار است، بنابراین بیشتر SDKهای OpenAI با تغییر Base URL کار می‌کنند.

| ویژگی | مقدار                             |
| -------- | ---------------------------------- |
| ارائه‌دهنده | `kilocode`                         |
| احراز هویت     | `KILOCODE_API_KEY`                 |
| API      | سازگار با OpenAI                  |
| Base URL | `https://api.kilo.ai/api/gateway/` |

## شروع به کار

<Steps>
  <Step title="ایجاد حساب">
    به [app.kilo.ai](https://app.kilo.ai) بروید، وارد شوید یا یک حساب ایجاد کنید، سپس به API Keys بروید و یک کلید جدید بسازید.
  </Step>
  <Step title="اجرای راه‌اندازی اولیه">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    یا متغیر محیطی را مستقیم تنظیم کنید:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="بررسی کنید که مدل در دسترس است">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## مدل پیش‌فرض

مدل پیش‌فرض `kilocode/kilo/auto` است؛ یک مدل مسیریابی هوشمند متعلق به ارائه‌دهنده
که توسط Kilo Gateway مدیریت می‌شود.

<Note>
OpenClaw با `kilocode/kilo/auto` به‌عنوان ref پیش‌فرض پایدار رفتار می‌کند، اما
برای آن مسیر، نگاشتی با پشتوانهٔ منبع از وظیفه به مدل بالادستی منتشر نمی‌کند. مسیریابی دقیق
بالادستی پشت `kilocode/kilo/auto` متعلق به Kilo Gateway است، نه اینکه در
OpenClaw به‌صورت سخت‌کد شده باشد.
</Note>

## کاتالوگ داخلی

OpenClaw هنگام شروع، مدل‌های در دسترس را به‌صورت پویا از Kilo Gateway کشف می‌کند. از
`/models kilocode` استفاده کنید تا فهرست کامل مدل‌های در دسترس با حساب خود را ببینید.

هر مدلی که روی Gateway در دسترس باشد می‌تواند با پیشوند `kilocode/` استفاده شود:

| ref مدل                                | یادداشت‌ها                              |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | پیش‌فرض — مسیریابی هوشمند            |
| `kilocode/anthropic/claude-sonnet-4`     | Anthropic از طریق Kilo                 |
| `kilocode/openai/gpt-5.5`                | OpenAI از طریق Kilo                    |
| `kilocode/google/gemini-3.1-pro-preview` | Google از طریق Kilo                    |
| ...و بسیاری موارد دیگر                         | برای فهرست کردن همه از `/models kilocode` استفاده کنید |

<Tip>
در زمان شروع، OpenClaw درخواست `GET https://api.kilo.ai/api/gateway/models` را اجرا می‌کند و
مدل‌های کشف‌شده را جلوتر از کاتالوگ fallback ایستا ادغام می‌کند. fallback بسته‌بندی‌شده همیشه
شامل `kilocode/kilo/auto` (`Kilo Auto`) با `input: ["text", "image"]`،
`reasoning: true`، `contextWindow: 1000000` و `maxTokens: 128000` است.
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
    Kilo Gateway در منبع به‌عنوان سازگار با OpenRouter مستند شده است، بنابراین به‌جای
    شکل‌دهی بومی درخواست OpenAI، روی مسیر سازگار با OpenAI به سبک پراکسی باقی می‌ماند.

    - refهای Kilo مبتنی بر Gemini روی مسیر proxy-Gemini باقی می‌مانند، بنابراین OpenClaw پاک‌سازی
      thought-signature مربوط به Gemini را در آنجا حفظ می‌کند، بدون اینکه اعتبارسنجی replay بومی Gemini
      یا بازنویسی‌های bootstrap را فعال کند.
    - Kilo Gateway در پشت صحنه از توکن Bearer همراه با کلید API شما استفاده می‌کند.

  </Accordion>

  <Accordion title="پوشش‌دهندهٔ جریان و reasoning">
    پوشش‌دهندهٔ جریان مشترک Kilo سربرگ برنامهٔ ارائه‌دهنده را اضافه می‌کند و
    payloadهای reasoning پراکسی را برای refهای مدل مشخص پشتیبانی‌شده نرمال‌سازی می‌کند.

    <Warning>
    `kilocode/kilo/auto` و سایر hintهای پشتیبانی‌نشده برای proxy-reasoning از تزریق reasoning عبور می‌کنند.
    اگر به پشتیبانی reasoning نیاز دارید، از یک ref مدل مشخص مانند
    `kilocode/anthropic/claude-sonnet-4` استفاده کنید.
    </Warning>

  </Accordion>

  <Accordion title="عیب‌یابی">
    - اگر کشف مدل هنگام شروع شکست بخورد، OpenClaw به کاتالوگ ایستای بسته‌بندی‌شده که شامل `kilocode/kilo/auto` است fallback می‌کند.
    - تأیید کنید کلید API شما معتبر است و حساب Kilo شما مدل‌های موردنظر را فعال دارد.
    - وقتی Gateway به‌صورت daemon اجرا می‌شود، مطمئن شوید `KILOCODE_API_KEY` برای آن فرایند در دسترس است (برای مثال در `~/.openclaw/.env` یا از طریق `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، refهای مدل، و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    داشبورد Kilo Gateway، کلیدهای API، و مدیریت حساب.
  </Card>
</CardGroup>
