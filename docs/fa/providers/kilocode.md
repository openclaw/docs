---
read_when:
    - شما یک کلید API واحد برای چندین LLM می‌خواهید
    - می‌خواهید مدل‌ها را از طریق Kilo Gateway در OpenClaw اجرا کنید
summary: از API یکپارچهٔ Kilo Gateway برای دسترسی به مدل‌های متعدد در OpenClaw استفاده کنید
title: Kilo Gateway
x-i18n:
    generated_at: "2026-06-27T18:41:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be06295295b63ce9b9d00d6f3d73e132c805237fde056eac4619616bf992e803
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway یک **API یکپارچه** ارائه می‌کند که درخواست‌ها را پشت یک نقطهٔ پایانی و کلید API واحد به مدل‌های متعدد مسیریابی می‌کند. با OpenAI سازگار است، بنابراین بیشتر SDKهای OpenAI با تغییر URL پایه کار می‌کنند.

| ویژگی | مقدار                              |
| -------- | ---------------------------------- |
| ارائه‌دهنده | `kilocode`                         |
| احراز هویت     | `KILOCODE_API_KEY`                 |
| API      | سازگار با OpenAI                  |
| URL پایه | `https://api.kilo.ai/api/gateway/` |

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را دوباره راه‌اندازی کنید:

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## شروع به کار

<Steps>
  <Step title="Create an account">
    به [app.kilo.ai](https://app.kilo.ai) بروید، وارد شوید یا یک حساب بسازید، سپس به API Keys بروید و یک کلید جدید ایجاد کنید.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    یا متغیر محیطی را مستقیماً تنظیم کنید:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## مدل پیش‌فرض

مدل پیش‌فرض `kilocode/kilo/auto` است؛ یک مدل مسیریابی هوشمند تحت مالکیت ارائه‌دهنده که توسط Kilo Gateway مدیریت می‌شود.

<Note>
OpenClaw با `kilocode/kilo/auto` به‌عنوان ref پیش‌فرض پایدار رفتار می‌کند، اما نگاشت پشتیبانی‌شده با منبع از وظیفه به مدل بالادستی را برای آن مسیر منتشر نمی‌کند. مسیریابی دقیق بالادستی پشت `kilocode/kilo/auto` در مالکیت Kilo Gateway است و در OpenClaw به‌صورت سخت‌کدنویسی‌شده قرار ندارد.
</Note>

## کاتالوگ داخلی

OpenClaw هنگام راه‌اندازی، مدل‌های در دسترس را به‌صورت پویا از Kilo Gateway کشف می‌کند. برای دیدن فهرست کامل مدل‌های در دسترس با حساب خود، از `/models kilocode` استفاده کنید.

هر مدلی که روی Gateway در دسترس باشد می‌تواند با پیشوند `kilocode/` استفاده شود:

| ref مدل                                | یادداشت‌ها                              |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | پیش‌فرض — مسیریابی هوشمند            |
| `kilocode/anthropic/claude-sonnet-4`     | Anthropic از طریق Kilo                 |
| `kilocode/openai/gpt-5.5`                | OpenAI از طریق Kilo                    |
| `kilocode/google/gemini-3.1-pro-preview` | Google از طریق Kilo                    |
| ...و بسیاری موارد دیگر                         | برای فهرست‌کردن همه، از `/models kilocode` استفاده کنید |

<Tip>
هنگام راه‌اندازی، OpenClaw مسیر `GET https://api.kilo.ai/api/gateway/models` را پرس‌وجو می‌کند و مدل‌های کشف‌شده را جلوتر از کاتالوگ ایستای fallback ادغام می‌کند. fallback ایستا همیشه شامل `kilocode/kilo/auto` (`Kilo Auto`) با `input: ["text", "image"]`، `reasoning: true`، `contextWindow: 1000000` و `maxTokens: 128000` است.
</Tip>

## نمونهٔ پیکربندی

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
  <Accordion title="Transport and compatibility">
    Kilo Gateway در منبع به‌عنوان سازگار با OpenRouter مستند شده است، بنابراین به‌جای شکل‌دهی بومی درخواست OpenAI، روی مسیر سازگار با OpenAI به سبک پروکسی باقی می‌ماند.

    - refهای Kilo مبتنی بر Gemini روی مسیر پروکسی-Gemini باقی می‌مانند، بنابراین OpenClaw پاک‌سازی امضای تفکر Gemini را در آنجا حفظ می‌کند، بدون اینکه اعتبارسنجی بازپخش بومی Gemini یا بازنویسی‌های bootstrap را فعال کند.
    - Kilo Gateway در پشت صحنه از توکن Bearer همراه با کلید API شما استفاده می‌کند.

  </Accordion>

  <Accordion title="Stream wrapper and reasoning">
    wrapper جریان مشترک Kilo سربرگ برنامهٔ ارائه‌دهنده را اضافه می‌کند و payloadهای استدلال پروکسی را برای refهای مدل مشخص پشتیبانی‌شده نرمال‌سازی می‌کند.

    <Warning>
    `kilocode/kilo/auto` و دیگر hintهای پشتیبانی‌نشده برای استدلال پروکسی، تزریق استدلال را رد می‌کنند. اگر به پشتیبانی از استدلال نیاز دارید، از یک ref مدل مشخص مانند `kilocode/anthropic/claude-sonnet-4` استفاده کنید.
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - اگر کشف مدل هنگام راه‌اندازی شکست بخورد، OpenClaw به کاتالوگ ایستایی که شامل `kilocode/kilo/auto` است fallback می‌کند.
    - تأیید کنید کلید API شما معتبر است و حساب Kilo شما مدل‌های موردنظر را فعال کرده است.
    - وقتی Gateway به‌عنوان daemon اجرا می‌شود، مطمئن شوید `KILOCODE_API_KEY` برای آن فرایند در دسترس است (برای مثال در `~/.openclaw/.env` یا از طریق `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، refهای مدل و رفتار failover.
  </Card>
  <Card title="Configuration reference" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    داشبورد Kilo Gateway، کلیدهای API و مدیریت حساب.
  </Card>
</CardGroup>
