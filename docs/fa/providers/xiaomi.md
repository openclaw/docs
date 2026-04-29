---
read_when:
    - مدل‌های Xiaomi MiMo را در OpenClaw می‌خواهید
    - باید XIAOMI_API_KEY را تنظیم کنید
summary: از مدل‌های Xiaomi MiMo با OpenClaw استفاده کنید
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-29T23:30:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7781973c3a1d14101cdb0a8d1affe3fd076a968552ed2a8630a91a8947daeb3a
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo پلتفرم API برای مدل‌های **MiMo** است. OpenClaw از نقطه پایانی سازگار با OpenAI متعلق به Xiaomi با احراز هویت مبتنی بر کلید API استفاده می‌کند.

| ویژگی | مقدار                          |
| -------- | ------------------------------- |
| ارائه‌دهنده | `xiaomi`                        |
| احراز هویت     | `XIAOMI_API_KEY`                |
| API      | سازگار با OpenAI               |
| نشانی پایه | `https://api.xiaomimimo.com/v1` |

## شروع به کار

<Steps>
  <Step title="Get an API key">
    یک کلید API در [کنسول Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys) ایجاد کنید.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    یا کلید را مستقیماً ارسال کنید:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## کاتالوگ داخلی

| ارجاع مدل              | ورودی       | زمینه   | بیشینه خروجی | استدلال | یادداشت‌ها         |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | متن        | 262,144   | 8,192      | خیر        | مدل پیش‌فرض |
| `xiaomi/mimo-v2-pro`   | متن        | 1,048,576 | 32,000     | بله       | زمینه بزرگ |
| `xiaomi/mimo-v2-omni`  | متن، تصویر | 262,144   | 32,000     | بله       | چندوجهی    |

<Tip>
ارجاع مدل پیش‌فرض `xiaomi/mimo-v2-flash` است. وقتی `XIAOMI_API_KEY` تنظیم شده باشد یا یک پروفایل احراز هویت وجود داشته باشد، ارائه‌دهنده به‌طور خودکار تزریق می‌شود.
</Tip>

## تبدیل متن به گفتار

Plugin داخلی `xiaomi` همچنین Xiaomi MiMo را به‌عنوان ارائه‌دهنده گفتار برای
`messages.tts` ثبت می‌کند. این Plugin قرارداد TTS تکمیل‌های گفت‌وگوی Xiaomi را با متن به‌عنوان
پیام `assistant` و راهنمایی سبک اختیاری به‌عنوان پیام `user` فراخوانی می‌کند.

| ویژگی | مقدار                                    |
| -------- | ---------------------------------------- |
| شناسه TTS   | `xiaomi` (نام مستعار `mimo`)                  |
| احراز هویت     | `XIAOMI_API_KEY`                         |
| API      | `POST /v1/chat/completions` با `audio` |
| پیش‌فرض  | `mimo-v2.5-tts`، صدا `mimo_default`    |
| خروجی   | به‌طور پیش‌فرض MP3؛ در صورت پیکربندی WAV      |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

صداهای داخلی پشتیبانی‌شده شامل `mimo_default`، `default_zh`، `default_en`،
`Mia`، `Chloe`، `Milo` و `Dean` هستند. `mimo-v2-tts` برای حساب‌های قدیمی‌تر MiMo
TTS پشتیبانی می‌شود؛ پیش‌فرض از مدل TTS فعلی MiMo-V2.5 استفاده می‌کند. برای مقصدهای یادداشت صوتی
مانند Feishu و Telegram، OpenClaw پیش از تحویل خروجی Xiaomi را با `ffmpeg` به Opus با نرخ 48kHz تبدیل کدگذاری می‌کند.

## نمونه پیکربندی

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    ارائه‌دهنده `xiaomi` زمانی که `XIAOMI_API_KEY` در محیط شما تنظیم شده باشد یا یک پروفایل احراز هویت وجود داشته باشد، به‌طور خودکار تزریق می‌شود. لازم نیست ارائه‌دهنده را به‌صورت دستی پیکربندی کنید، مگر اینکه بخواهید فراداده مدل یا نشانی پایه را بازنویسی کنید.
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** — سبک و سریع، ایده‌آل برای وظایف متنی عمومی. بدون پشتیبانی از استدلال.
    - **mimo-v2-pro** — از استدلال با پنجره زمینه 1M توکنی برای بارهای کاری سندهای طولانی پشتیبانی می‌کند.
    - **mimo-v2-omni** — مدل چندوجهی با قابلیت استدلال که ورودی‌های متن و تصویر را می‌پذیرد.

    <Note>
    همه مدل‌ها از پیشوند `xiaomi/` استفاده می‌کنند (برای مثال `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - اگر مدل‌ها نمایش داده نمی‌شوند، تأیید کنید `XIAOMI_API_KEY` تنظیم شده و معتبر است.
    - وقتی Gateway به‌صورت daemon اجرا می‌شود، مطمئن شوید کلید برای آن فرایند در دسترس است (برای مثال در `~/.openclaw/.env` یا از طریق `env.shellEnv`).

    <Warning>
    کلیدهایی که فقط در پوسته تعاملی شما تنظیم شده‌اند برای فرایندهای Gateway مدیریت‌شده توسط daemon قابل مشاهده نیستند. برای دسترسی پایدار، از پیکربندی `~/.openclaw/.env` یا `env.shellEnv` استفاده کنید.
    </Warning>

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل و رفتار failover.
  </Card>
  <Card title="Configuration reference" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی OpenClaw.
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    داشبورد Xiaomi MiMo و مدیریت کلید API.
  </Card>
</CardGroup>
