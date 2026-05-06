---
read_when:
    - شما مدل‌های Xiaomi MiMo را در OpenClaw می‌خواهید
    - باید XIAOMI_API_KEY تنظیم شده باشد
summary: استفاده از مدل‌های Xiaomi MiMo با OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-05-06T09:40:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7bb33bf107cb44414b0f3a6140d60fdfecb3b7154c3197e7cbed982d9a6450b
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo پلتفرم API برای مدل‌های **MiMo** است. OpenClaw شامل یک Plugin باندل‌شده‌ی `xiaomi` است که هم یک ارائه‌دهنده‌ی گفت‌وگوی سازگار با OpenAI و هم یک ارائه‌دهنده‌ی گفتار (TTS) را با همان `XIAOMI_API_KEY` ثبت می‌کند.

| ویژگی        | مقدار                                    |
| --------------- | ---------------------------------------- |
| شناسه ارائه‌دهنده     | `xiaomi`                                 |
| Plugin          | باندل‌شده، `enabledByDefault: true`        |
| متغیر محیطی احراز هویت    | `XIAOMI_API_KEY`                         |
| پرچم راه‌اندازی اولیه | `--auth-choice xiaomi-api-key`           |
| پرچم مستقیم CLI | `--xiaomi-api-key <key>`                 |
| قراردادها       | تکمیل گفت‌وگو + `speechProviders`     |
| API             | سازگار با OpenAI (`openai-completions`) |
| URL پایه        | `https://api.xiaomimimo.com/v1`          |
| مدل پیش‌فرض   | `xiaomi/mimo-v2-flash`                   |
| پیش‌فرض TTS     | `mimo-v2.5-tts`، صدا `mimo_default`    |

## شروع به کار

<Steps>
  <Step title="دریافت کلید API">
    یک کلید API در [کنسول Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys) بسازید.
  </Step>
  <Step title="اجرای راه‌اندازی اولیه">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    یا کلید را مستقیماً ارسال کنید:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="بررسی در دسترس بودن مدل">
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
ارجاع مدل پیش‌فرض `xiaomi/mimo-v2-flash` است. وقتی `XIAOMI_API_KEY` تنظیم شده باشد یا یک پروفایل احراز هویت وجود داشته باشد، ارائه‌دهنده به‌صورت خودکار تزریق می‌شود.
</Tip>

## تبدیل متن به گفتار

Plugin باندل‌شده‌ی `xiaomi` همچنین Xiaomi MiMo را به‌عنوان ارائه‌دهنده‌ی گفتار برای
`messages.tts` ثبت می‌کند. این Plugin قرارداد TTS تکمیل گفت‌وگوی Xiaomi را با متن به‌عنوان
پیام `assistant` و راهنمای سبک اختیاری به‌عنوان پیام `user` فراخوانی می‌کند.

| ویژگی | مقدار                                    |
| -------- | ---------------------------------------- |
| شناسه TTS   | `xiaomi` (نام مستعار `mimo`)                  |
| احراز هویت     | `XIAOMI_API_KEY`                         |
| API      | `POST /v1/chat/completions` با `audio` |
| پیش‌فرض  | `mimo-v2.5-tts`، صدا `mimo_default`    |
| خروجی   | به‌صورت پیش‌فرض MP3؛ در صورت پیکربندی WAV      |

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
TTS پشتیبانی می‌شود؛ پیش‌فرض از مدل فعلی MiMo-V2.5 TTS استفاده می‌کند. برای مقصدهای
یادداشت صوتی مانند Feishu و Telegram، OpenClaw خروجی Xiaomi را پیش از تحویل با
`ffmpeg` به Opus با نرخ 48kHz تبدیل می‌کند.

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
  <Accordion title="رفتار تزریق خودکار">
    وقتی `XIAOMI_API_KEY` در محیط شما تنظیم شده باشد یا یک پروفایل احراز هویت وجود داشته باشد، ارائه‌دهنده‌ی `xiaomi` به‌صورت خودکار تزریق می‌شود. نیازی نیست ارائه‌دهنده را دستی پیکربندی کنید، مگر اینکه بخواهید فراداده‌ی مدل یا URL پایه را بازنویسی کنید.
  </Accordion>

  <Accordion title="جزئیات مدل">
    - **mimo-v2-flash** — سبک و سریع، ایده‌آل برای کارهای متنی عمومی. بدون پشتیبانی از استدلال.
    - **mimo-v2-pro** — از استدلال با پنجره‌ی زمینه‌ی 1M توکن برای بارهای کاری اسناد بلند پشتیبانی می‌کند.
    - **mimo-v2-omni** — مدل چندوجهی با قابلیت استدلال که هم ورودی متن و هم تصویر را می‌پذیرد.

    <Note>
    همه مدل‌ها از پیشوند `xiaomi/` استفاده می‌کنند (برای مثال `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="عیب‌یابی">
    - اگر مدل‌ها نمایش داده نمی‌شوند، تأیید کنید که `XIAOMI_API_KEY` تنظیم شده و معتبر است.
    - وقتی Gateway به‌صورت daemon اجرا می‌شود، مطمئن شوید کلید برای آن فرایند در دسترس است (برای مثال در `~/.openclaw/.env` یا از طریق `env.shellEnv`).

    <Warning>
    کلیدهایی که فقط در پوسته‌ی تعاملی شما تنظیم شده‌اند برای فرایندهای Gateway مدیریت‌شده توسط daemon قابل مشاهده نیستند. برای دسترس‌پذیری پایدار از پیکربندی `~/.openclaw/.env` یا `env.shellEnv` استفاده کنید.
    </Warning>

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
  <Card title="کنسول Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    داشبورد Xiaomi MiMo و مدیریت کلید API.
  </Card>
</CardGroup>
