---
read_when:
    - می‌خواهید مدل‌های Xiaomi MiMo را در OpenClaw داشته باشید
    - به احراز هویت Xiaomi MiMo یا راه‌اندازی Token Plan نیاز دارید
summary: از مدل‌های پرداخت به‌ازای مصرف و Token Plan شیائومی MiMo با OpenClaw استفاده کنید
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-06-27T18:45:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 171c4b95c6ff12d4b8d75747d35fcad19c6173d670a3af65fe0a286e04199751
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo پلتفرم API برای مدل‌های **MiMo** است. OpenClaw شامل یک Plugin داخلی Xiaomi با دو پیش‌تنظیم ارائه‌دهنده متن است:

- `xiaomi` برای کلیدهای پرداخت به‌ازای مصرف (`sk-...`)
- `xiaomi-token-plan` برای کلیدهای Token Plan (`tp-...`) با پیش‌تنظیم‌های نقطه پایانی منطقه‌ای

همین Plugin همچنین ارائه‌دهنده گفتار (TTS) با شناسه `xiaomi` را ثبت می‌کند.

| ویژگی | مقدار |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| شناسه‌های ارائه‌دهنده | `xiaomi` (پرداخت به‌ازای مصرف)، `xiaomi-token-plan` (Token Plan) |
| Plugin | داخلی، `enabledByDefault: true` |
| متغیرهای محیطی احراز هویت | `XIAOMI_API_KEY`، `XIAOMI_TOKEN_PLAN_API_KEY` |
| پرچم‌های راه‌اندازی اولیه | `--auth-choice xiaomi-api-key`، `--auth-choice xiaomi-token-plan-cn`، `--auth-choice xiaomi-token-plan-sgp`، `--auth-choice xiaomi-token-plan-ams` |
| پرچم‌های مستقیم CLI | `--xiaomi-api-key <key>`، `--xiaomi-token-plan-api-key <key>` |
| قراردادها | تکمیل‌های چت + `speechProviders` |
| API | سازگار با OpenAI (`openai-completions`) |
| URLهای پایه | پرداخت به‌ازای مصرف: `https://api.xiaomimimo.com/v1`؛ پیش‌تنظیم‌های Token Plan: `token-plan-{cn,sgp,ams}...` |
| مدل‌های پیش‌فرض | `xiaomi/mimo-v2-flash`، `xiaomi-token-plan/mimo-v2.5-pro` |
| پیش‌فرض TTS | `mimo-v2.5-tts`، صدا `mimo_default`؛ مدل voicedesign با نام `mimo-v2.5-tts-voicedesign` |

## شروع به کار

<Steps>
  <Step title="دریافت کلید مناسب">
    یک کلید پرداخت به‌ازای مصرف در [کنسول Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys) بسازید، یا صفحه اشتراک Token Plan خود را باز کنید و URL پایه سازگار با OpenAI برای منطقه مربوطه را همراه با کلید متناظر `tp-...` کپی کنید.
  </Step>

  <Step title="اجرای راه‌اندازی اولیه">
    پرداخت به‌ازای مصرف:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    یا کلیدها را مستقیم وارد کنید:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="بررسی در دسترس بودن مدل">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

## کاتالوگ پرداخت به‌ازای مصرف

| ارجاع مدل | ورودی | زمینه | حداکثر خروجی | استدلال | یادداشت‌ها |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | متن | 262,144 | 8,192 | خیر | مدل پیش‌فرض |
| `xiaomi/mimo-v2-pro` | متن | 1,048,576 | 32,000 | بله | زمینه بزرگ |
| `xiaomi/mimo-v2-omni` | متن، تصویر | 262,144 | 32,000 | بله | چندوجهی |

<Tip>
ارجاع مدل پیش‌فرض `xiaomi/mimo-v2-flash` است. وقتی `XIAOMI_API_KEY` تنظیم شده باشد یا یک نمایه احراز هویت وجود داشته باشد، ارائه‌دهنده به‌صورت خودکار تزریق می‌شود.
</Tip>

## کاتالوگ Token Plan

گزینه احراز هویت Token Plan را انتخاب کنید که با URL پایه منطقه‌ای نمایش‌داده‌شده در رابط اشتراک Xiaomi مطابقت دارد:

- `xiaomi-token-plan-cn` -> `https://token-plan-cn.xiaomimimo.com/v1`
- `xiaomi-token-plan-sgp` -> `https://token-plan-sgp.xiaomimimo.com/v1`
- `xiaomi-token-plan-ams` -> `https://token-plan-ams.xiaomimimo.com/v1`

| ارجاع مدل | ورودی | زمینه | حداکثر خروجی | استدلال | یادداشت‌ها |
| --------------------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | متن | 1,048,576 | 131,072 | بله | مدل پیش‌فرض |
| `xiaomi-token-plan/mimo-v2.5` | متن، تصویر | 1,048,576 | 131,072 | بله | چندوجهی |

<Tip>
راه‌اندازی اولیه Token Plan شکل کلید را اعتبارسنجی می‌کند و وقتی یک کلید `tp-...` در مسیر پرداخت به‌ازای مصرف وارد شود، یا یک کلید `sk-...` در مسیر Token Plan وارد شود، هشدار می‌دهد.
</Tip>

## تبدیل متن به گفتار

Plugin داخلی `xiaomi` همچنین Xiaomi MiMo را به‌عنوان ارائه‌دهنده گفتار برای
`messages.tts` ثبت می‌کند. این Plugin قرارداد TTS تکمیل‌های چت Xiaomi را با متن به‌عنوان
یک پیام `assistant` و راهنمایی سبک اختیاری به‌عنوان یک پیام `user` فراخوانی می‌کند.

| ویژگی | مقدار |
| -------- | ---------------------------------------- |
| شناسه TTS | `xiaomi` (نام مستعار `mimo`) |
| احراز هویت | `XIAOMI_API_KEY` |
| API | `POST /v1/chat/completions` با `audio` |
| پیش‌فرض | `mimo-v2.5-tts`، صدا `mimo_default` |
| خروجی | MP3 به‌صورت پیش‌فرض؛ WAV هنگام پیکربندی |

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

صداهای داخلی پشتیبانی‌شده شامل `mimo_default`، `default_zh`، `default_en`،
`Mia`، `Chloe`، `Milo` و `Dean` هستند. مدل‌های صدای پیش‌تنظیم‌شده از `audio.voice` استفاده می‌کنند، بنابراین
OpenClaw برای `mimo-v2.5-tts` و `mimo-v2-tts` مقدار `speakerVoice` را ارسال می‌کند.

مدل voicedesign شرکت Xiaomi، یعنی `mimo-v2.5-tts-voicedesign`، صدا را
از یک پرامپت سبک به زبان طبیعی تولید می‌کند، نه از یک شناسه صدای پیش‌تنظیم‌شده. مقدار
`style` را با توصیف صدای مطلوب پیکربندی کنید؛ OpenClaw آن را به‌عنوان پیام `user`
ارسال می‌کند، متن گفتاری را به‌عنوان پیام `assistant` می‌فرستد و برای این مدل
`audio.voice` را حذف می‌کند.

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

برای مقصدهای یادداشت صوتی مانند Feishu و Telegram، OpenClaw خروجی Xiaomi
را پیش از تحویل با `ffmpeg` به Opus با نرخ 48kHz تبدیل کدک می‌کند.

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

قیمت‌گذاری و پرچم‌های سازگاری از مانیفست Plugin داخلی می‌آیند، بنابراین نمونه پیکربندی برای جلوگیری از فاصله گرفتن از رفتار زمان اجرا، `cost` و `compat` را حذف می‌کند.

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

قیمت‌گذاری از مانیفست داخلی می‌آید (مدل‌های Token Plan شامل قیمت‌گذاری لایه‌ای خواندن از کش هستند)، بنابراین نمونه پیکربندی `cost` را حذف می‌کند.

<AccordionGroup>
  <Accordion title="رفتار تزریق خودکار">
    ارائه‌دهنده `xiaomi` وقتی `XIAOMI_API_KEY` در محیط شما تنظیم شده باشد یا یک نمایه احراز هویت وجود داشته باشد، به‌صورت خودکار تزریق می‌شود. `xiaomi-token-plan` به یک URL پایه منطقه‌ای نیاز دارد، بنابراین مسیر پشتیبانی‌شده، گزینه راه‌اندازی اولیه Token Plan داخلی یا یک بلوک پیکربندی صریح `models.providers.xiaomi-token-plan` است.
  </Accordion>

  <Accordion title="جزئیات مدل">
    - **mimo-v2-flash** — سبک و سریع، ایده‌آل برای کارهای متنی عمومی. بدون پشتیبانی از استدلال.
    - **mimo-v2-pro** — از استدلال با پنجره زمینه 1M توکن برای بارهای کاری سندهای طولانی پشتیبانی می‌کند.
    - **mimo-v2-omni** — مدل چندوجهی دارای قابلیت استدلال که هم ورودی متن و هم تصویر را می‌پذیرد.
    - **mimo-v2.5-pro** — پیش‌فرض Token Plan با پشته استدلال V2.5 فعلی Xiaomi.
    - **mimo-v2.5** — مسیر چندوجهی V2.5 برای Token Plan.

    <Note>
    مدل‌های پرداخت به‌ازای مصرف از پیشوند `xiaomi/` استفاده می‌کنند. مدل‌های Token Plan از پیشوند `xiaomi-token-plan/` استفاده می‌کنند.
    </Note>

  </Accordion>

  <Accordion title="عیب‌یابی">
    - اگر مدل‌ها ظاهر نمی‌شوند، تأیید کنید که متغیر محیطی کلید مربوطه یا نمایه احراز هویت وجود دارد و معتبر است.
    - برای Token Plan، تأیید کنید که منطقه انتخاب‌شده در راه‌اندازی اولیه با URL پایه صفحه اشتراک مطابقت دارد و کلید با `tp-` شروع می‌شود.
    - وقتی Gateway به‌صورت یک daemon اجرا می‌شود، مطمئن شوید کلید برای آن فرایند در دسترس است (برای مثال در `~/.openclaw/.env` یا از طریق `env.shellEnv`).

    <Warning>
    کلیدهایی که فقط در shell تعاملی شما تنظیم شده‌اند برای فرایندهای Gateway مدیریت‌شده توسط daemon قابل مشاهده نیستند. برای دسترس‌پذیری پایدار از پیکربندی `~/.openclaw/.env` یا `env.shellEnv` استفاده کنید.
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
