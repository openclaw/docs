---
read_when:
    - شما می‌خواهید از مدل‌های Xiaomi MiMo در OpenClaw استفاده کنید
    - به احراز هویت Xiaomi MiMo یا راه‌اندازی Token Plan نیاز دارید
summary: از مدل‌های پرداخت به‌ازای‌مصرف و طرح توکن Xiaomi MiMo با OpenClaw استفاده کنید
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-12T10:47:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6b91ead3e4a32a93bca7e02476b8de11137e8a5b5fa434bad8187bc1b204856
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo پلتفرم API برای مدل‌های **MiMo** است. Plugin همراه `xiaomi` (با `enabledByDefault: true` و بدون مرحلهٔ نصب) دو ارائه‌دهندهٔ متن و یک ارائه‌دهندهٔ گفتار (TTS) را ثبت می‌کند:

- `xiaomi` - کلیدهای پرداخت به‌ازای مصرف (`sk-...`)
- `xiaomi-token-plan` - کلیدهای Token Plan (`tp-...`) با پیش‌تنظیم‌های نقطهٔ پایانی منطقه‌ای

| ویژگی                    | مقدار                                                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| شناسه‌های ارائه‌دهنده     | `xiaomi` (پرداخت به‌ازای مصرف)، `xiaomi-token-plan` (Token Plan)                                                                                   |
| متغیرهای محیطی احراز هویت | `XIAOMI_API_KEY`، `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| پرچم‌های راه‌اندازی اولیه | `--auth-choice xiaomi-api-key`، `--auth-choice xiaomi-token-plan-cn`، `--auth-choice xiaomi-token-plan-sgp`، `--auth-choice xiaomi-token-plan-ams` |
| پرچم‌های مستقیم CLI       | `--xiaomi-api-key <key>`، `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API                      | تکمیل‌های گفت‌وگوی سازگار با OpenAI (`openai-completions`)                                                                                        |
| قرارداد گفتار            | `speechProviders: ["xiaomi"]`                                                                                                                      |
| نشانی‌های پایه            | پرداخت به‌ازای مصرف: `https://api.xiaomimimo.com/v1`؛ Token Plan: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                      |
| مدل‌های پیش‌فرض           | `xiaomi/mimo-v2-flash`، `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| پیش‌فرض TTS              | `mimo-v2.5-tts`، صدای `mimo_default`؛ مدل طراحی صدا `mimo-v2.5-tts-voicedesign`                                                                    |

## شروع به کار

<Steps>
  <Step title="کلید مناسب را دریافت کنید">
    یک کلید پرداخت به‌ازای مصرف در [کنسول Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys) ایجاد کنید، یا صفحهٔ اشتراک Token Plan خود را باز کنید و نشانی پایهٔ منطقه‌ای سازگار با OpenAI را همراه با کلید متناظر `tp-...` کپی کنید.
  </Step>

  <Step title="راه‌اندازی اولیه را اجرا کنید">
    پرداخت به‌ازای مصرف:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    یا کلیدها را مستقیماً ارسال کنید:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="در دسترس بودن مدل را بررسی کنید">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

<Tip>
راه‌اندازی اولیه قالب کلید را اعتبارسنجی می‌کند و هنگامی هشدار می‌دهد که کلیدی با پیشوند `tp-...` در مسیر پرداخت به‌ازای مصرف، یا کلیدی با پیشوند `sk-...` در مسیر Token Plan وارد شود.
</Tip>

## فهرست مدل‌های پرداخت به‌ازای مصرف

| مرجع مدل               | ورودی      | زمینه     | حداکثر خروجی | استدلال | توضیحات       |
| ---------------------- | ---------- | ---------- | ------------ | ------- | ------------- |
| `xiaomi/mimo-v2-flash` | متن        | 262,144    | 8,192        | خیر     | مدل پیش‌فرض   |
| `xiaomi/mimo-v2-pro`   | متن        | 1,048,576  | 32,000       | بله     | زمینهٔ بزرگ   |
| `xiaomi/mimo-v2-omni`  | متن، تصویر | 262,144    | 32,000       | بله     | چندوجهی       |

## فهرست مدل‌های Token Plan

گزینهٔ احراز هویت Token Plan را انتخاب کنید که با نشانی پایهٔ منطقه‌ای نمایش‌داده‌شده در رابط کاربری اشتراک Xiaomi مطابقت دارد:

| گزینهٔ احراز هویت       | نشانی پایه                                  |
| ----------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`  | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp` | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams` | `https://token-plan-ams.xiaomimimo.com/v1` |

| مرجع مدل                          | ورودی      | زمینه     | حداکثر خروجی | استدلال | توضیحات     |
| --------------------------------- | ---------- | ---------- | ------------ | ------- | ----------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | متن        | 1,048,576  | 131,072      | بله     | مدل پیش‌فرض |
| `xiaomi-token-plan/mimo-v2.5`     | متن، تصویر | 1,048,576  | 131,072      | بله     | چندوجهی     |

`xiaomi-token-plan` برای تعیین مقصد به یک نشانی پایهٔ منطقه‌ای نیاز دارد. مسیر پشتیبانی‌شده، انتخاب راه‌اندازی اولیهٔ Token Plan همراه محصول یا یک بلوک پیکربندی صریح `models.providers.xiaomi-token-plan` با تنظیم `baseUrl` است؛ بدون یکی از این موارد، ارائه‌دهنده عرضه نمی‌شود.

## مدل‌های استدلالی

`mimo-v2-pro`، `mimo-v2-omni`، `mimo-v2.5` و `mimo-v2.5-pro` از [دستور `/think` در OpenClaw](/fa/tools/thinking) با سطوح `off`، `minimal`، `low`، `medium`، `high`، `xhigh` و `max` (پیش‌فرض `high`) پشتیبانی می‌کنند. `mimo-v2-flash` از استدلال پشتیبانی نمی‌کند.

## تبدیل متن به گفتار

Plugin همراه `xiaomi` همچنین Xiaomi MiMo را به‌عنوان ارائه‌دهندهٔ گفتار برای `messages.tts` ثبت می‌کند. این Plugin قرارداد TTS تکمیل گفت‌وگوی Xiaomi را با متن در قالب یک پیام `assistant` و راهنمای سبک اختیاری در قالب یک پیام `user` فراخوانی می‌کند.

| ویژگی    | مقدار                                      |
| -------- | ------------------------------------------ |
| شناسهٔ TTS | `xiaomi` (نام مستعار `mimo`)               |
| احراز هویت | `XIAOMI_API_KEY`                            |
| API      | `POST /v1/chat/completions` همراه با `audio` |
| پیش‌فرض  | `mimo-v2.5-tts`، صدای `mimo_default`       |
| خروجی    | به‌طور پیش‌فرض MP3؛ در صورت پیکربندی WAV   |

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
          speakerVoice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

صداهای داخلی: `mimo_default`، `default_zh`، `default_en`، `Mia`، `Chloe`، `Milo`، `Dean`. مدل‌های دارای صدای ازپیش‌تنظیم‌شده (`mimo-v2.5-tts`، `mimo-v2-tts`) از `audio.voice` استفاده می‌کنند؛ بنابراین OpenClaw برای این مدل‌ها `speakerVoice` را ارسال می‌کند.

مدل طراحی صدای `mimo-v2.5-tts-voicedesign` به‌جای شناسهٔ صدای ازپیش‌تنظیم‌شده، صدا را از یک درخواست سبک به زبان طبیعی تولید می‌کند. `style` را روی توصیف صدای دلخواه تنظیم کنید؛ OpenClaw آن را به‌عنوان پیام `user` و متن گفتاری را به‌عنوان پیام `assistant` ارسال می‌کند و برای این مدل `audio.voice` را حذف می‌کند.

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Warm, natural female voice with clear pronunciation.",
        },
      },
    },
  },
}
```

برای کانال‌هایی که مقصد ساخت یادداشت صوتی را درخواست می‌کنند (Discord، Feishu، Matrix، Telegram و WhatsApp)، OpenClaw پیش از تحویل، خروجی Xiaomi را با استفاده از `ffmpeg` به Opus تک‌کانالهٔ 48kHz تبدیل می‌کند.

## نمونهٔ پیکربندی

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
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

قیمت‌گذاری و پرچم‌های سازگاری از مانیفست Plugin همراه محصول دریافت می‌شوند؛ بنابراین برای جلوگیری از واگرایی با رفتار زمان اجرا، نمونهٔ پیکربندی `cost` و `compat` را حذف می‌کند.

Token Plan:

```json5
{
  env: { XIAOMI_TOKEN_PLAN_API_KEY: "tp-your-key" },
  agents: { defaults: { model: { primary: "xiaomi-token-plan/mimo-v2.5-pro" } } },
  models: {
    mode: "merge",
    providers: {
      "xiaomi-token-plan": {
        baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_TOKEN_PLAN_API_KEY",
        models: [
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

قیمت‌گذاری از مانیفست همراه محصول دریافت می‌شود (مدل‌های Token Plan شامل قیمت‌گذاری سطح‌بندی‌شده برای خواندن حافظهٔ نهان هستند)؛ بنابراین نمونهٔ پیکربندی `cost` را حذف می‌کند.

<AccordionGroup>
  <Accordion title="رفتار تزریق خودکار">
    ارائه‌دهندهٔ `xiaomi` هنگامی به‌طور خودکار فعال می‌شود که `XIAOMI_API_KEY` در محیط شما تنظیم شده باشد یا یک نمایهٔ احراز هویت وجود داشته باشد. `xiaomi-token-plan` به یک نشانی پایهٔ منطقه‌ای نیاز دارد؛ بنابراین مسیر پشتیبانی‌شده، انتخاب راه‌اندازی اولیهٔ Token Plan همراه محصول یا یک بلوک پیکربندی صریح `models.providers.xiaomi-token-plan` است.
  </Accordion>

  <Accordion title="جزئیات مدل‌ها">
    - **mimo-v2-flash** - سبک و سریع، مناسب برای وظایف متنی عمومی. بدون پشتیبانی از استدلال.
    - **mimo-v2-pro** - از استدلال با پنجرهٔ زمینهٔ ۱ میلیون توکن برای بارهای کاری اسناد طولانی پشتیبانی می‌کند.
    - **mimo-v2-omni** - مدل چندوجهی دارای قابلیت استدلال که ورودی‌های متن و تصویر را می‌پذیرد.
    - **mimo-v2.5-pro** - مدل پیش‌فرض Token Plan با پشتهٔ استدلالی فعلی V2.5 در Xiaomi.
    - **mimo-v2.5** - مسیر چندوجهی V2.5 در Token Plan.

    <Note>
    مدل‌های پرداخت به‌ازای مصرف از پیشوند `xiaomi/` استفاده می‌کنند. مدل‌های Token Plan از پیشوند `xiaomi-token-plan/` استفاده می‌کنند.
    </Note>

  </Accordion>

  <Accordion title="عیب‌یابی">
    - اگر مدل‌ها نمایش داده نمی‌شوند، تأیید کنید که متغیر محیطی کلید مربوطه یا نمایهٔ احراز هویت موجود و معتبر است.
    - برای Token Plan، تأیید کنید که منطقهٔ انتخاب‌شده هنگام راه‌اندازی اولیه با نشانی پایهٔ صفحهٔ اشتراک مطابقت دارد و کلید با `tp-` آغاز می‌شود.
    - هنگامی که Gateway به‌صورت سرویس پس‌زمینه اجرا می‌شود، اطمینان حاصل کنید که کلید در دسترس آن فرایند است (برای مثال در `~/.openclaw/.env` یا از طریق `env.shellEnv`).

    <Warning>
    کلیدهایی که فقط در پوستهٔ تعاملی شما تنظیم شده‌اند، برای فرایندهای Gateway تحت مدیریت سرویس پس‌زمینه قابل مشاهده نیستند. برای دسترسی پایدار از پیکربندی `~/.openclaw/.env` یا `env.shellEnv` استفاده کنید.
    </Warning>

  </Accordion>
</AccordionGroup>

## مطالب مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، مراجع مدل و رفتار انتقال به گزینهٔ جایگزین.
  </Card>
  <Card title="سطوح تفکر" href="/fa/tools/thinking" icon="brain">
    نحو دستور `/think` و نگاشت سطوح.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی OpenClaw.
  </Card>
  <Card title="کنسول Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    داشبورد Xiaomi MiMo و مدیریت کلیدهای API.
  </Card>
</CardGroup>
