---
read_when:
    - شما برای بسیاری از مدل‌های زبانی بزرگ یک کلید API واحد می‌خواهید
    - می‌خواهید مدل‌ها را از طریق Kilo Gateway در OpenClaw اجرا کنید
summary: از API یکپارچه Kilo Gateway برای دسترسی به مدل‌های متعدد در OpenClaw استفاده کنید
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-06T18:01:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6105f5aafa0a36de2b140909e8dd21234aa8284259367a49c67d7040eaa0a93c
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway یک **API یکپارچه** ارائه می‌دهد که درخواست‌ها را از طریق یک
نقطه پایانی و کلید API واحد به مدل‌های زیادی هدایت می‌کند. این API با OpenAI سازگار است، بنابراین بیشتر SDKهای OpenAI با تغییر URL پایه کار می‌کنند.

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
  <Step title="اجرای راه‌اندازی اولیه">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    یا متغیر محیطی را مستقیماً تنظیم کنید:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="تأیید کنید مدل در دسترس است">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## مدل پیش‌فرض

مدل پیش‌فرض `kilocode/kilo/auto` است؛ مدلی برای مسیریابی هوشمند که متعلق به ارائه‌دهنده است
و توسط Kilo Gateway مدیریت می‌شود.

<Note>
OpenClaw با `kilocode/kilo/auto` به‌عنوان ارجاع پیش‌فرض پایدار برخورد می‌کند، اما نگاشتِ مبتنی بر منبع از وظیفه به مدل بالادستی را برای آن مسیر
منتشر نمی‌کند. مسیریابی دقیق بالادستی پشت `kilocode/kilo/auto` متعلق به Kilo Gateway است، نه اینکه
در OpenClaw به‌صورت hard-code شده باشد.
</Note>

## کاتالوگ داخلی

OpenClaw هنگام شروع، مدل‌های موجود را به‌صورت پویا از Kilo Gateway کشف می‌کند. از
`/models kilocode` استفاده کنید تا فهرست کامل مدل‌های در دسترس حساب خود را ببینید.

هر مدلی که در Gateway در دسترس باشد، می‌تواند با پیشوند `kilocode/` استفاده شود:

| ارجاع مدل                              | یادداشت‌ها                              |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | پیش‌فرض — مسیریابی هوشمند            |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic از طریق Kilo                 |
| `kilocode/openai/gpt-5.5`              | OpenAI از طریق Kilo                    |
| `kilocode/google/gemini-3-pro-preview` | Google از طریق Kilo                    |
| ...و بسیاری دیگر                       | برای فهرست‌کردن همه، از `/models kilocode` استفاده کنید |

<Tip>
هنگام شروع، OpenClaw از `GET https://api.kilo.ai/api/gateway/models` پرس‌وجو می‌کند و مدل‌های
کشف‌شده را پیش از کاتالوگ جایگزین ایستای خود ادغام می‌کند. جایگزین همراه همیشه
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
    Kilo Gateway در منبع به‌عنوان سازگار با OpenRouter مستند شده است، بنابراین در مسیر
    سازگار با OpenAI به سبک پراکسی می‌ماند، نه شکل‌دهی درخواست بومی OpenAI.

    - ارجاع‌های Kilo مبتنی بر Gemini روی مسیر پراکسی-Gemini می‌مانند، بنابراین OpenClaw
      پاک‌سازی امضای تفکر Gemini را آنجا حفظ می‌کند، بدون فعال‌کردن اعتبارسنجی بازپخش
      بومی Gemini یا بازنویسی‌های bootstrap.
    - Kilo Gateway در پشت صحنه از توکن Bearer با کلید API شما استفاده می‌کند.

  </Accordion>

  <Accordion title="پوشش جریان و reasoning">
    پوشش جریان مشترک Kilo، هدر برنامه ارائه‌دهنده را اضافه می‌کند و payloadهای reasoning
    پراکسی را برای ارجاع‌های مدل مشخص پشتیبانی‌شده نرمال‌سازی می‌کند.

    <Warning>
    `kilocode/kilo/auto` و سایر hintهای پشتیبانی‌نشده برای reasoning پراکسی، injection مربوط به reasoning را رد می‌کنند.
    اگر به پشتیبانی reasoning نیاز دارید، از یک ارجاع مدل مشخص مانند
    `kilocode/anthropic/claude-sonnet-4` استفاده کنید.
    </Warning>

  </Accordion>

  <Accordion title="عیب‌یابی">
    - اگر کشف مدل هنگام شروع ناموفق باشد، OpenClaw به کاتالوگ ایستای همراه که شامل `kilocode/kilo/auto` است برمی‌گردد.
    - تأیید کنید کلید API شما معتبر است و حساب Kilo شما مدل‌های موردنظر را فعال دارد.
    - وقتی Gateway به‌صورت daemon اجرا می‌شود، مطمئن شوید `KILOCODE_API_KEY` برای آن فرایند در دسترس است (برای مثال در `~/.openclaw/.env` یا از طریق `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    داشبورد Kilo Gateway، کلیدهای API و مدیریت حساب.
  </Card>
</CardGroup>
