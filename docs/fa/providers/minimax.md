---
read_when:
    - شما مدل‌های MiniMax را در OpenClaw می‌خواهید
    - به راهنمای راه‌اندازی MiniMax نیاز دارید
summary: استفاده از مدل‌های MiniMax در OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-29T23:26:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ef833258692c78f40a160131c2a0d36f84889e5d5196ddadb648485ba8cb04a
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw's MiniMax provider defaults to **MiniMax M2.7**.

MiniMax also provides:

- Bundled speech synthesis via T2A v2
- Bundled image understanding via `MiniMax-VL-01`
- Bundled music generation via `music-2.6`
- Bundled `web_search` through the MiniMax Coding Plan search API

Provider split:

| Provider ID      | Auth    | Capabilities                                                                                        |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | API key | Text, image generation, music generation, video generation, image understanding, speech, web search |
| `minimax-portal` | OAuth   | Text, image generation, music generation, video generation, image understanding, speech             |

## Built-in catalog

| Model                    | Type             | Description                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Chat (reasoning) | Default hosted reasoning model           |
| `MiniMax-M2.7-highspeed` | Chat (reasoning) | Faster M2.7 reasoning tier               |
| `MiniMax-VL-01`          | Vision           | Image understanding model                |
| `image-01`               | Image generation | Text-to-image and image-to-image editing |
| `music-2.6`              | Music generation | Default music model                      |
| `music-2.5`              | Music generation | Previous music generation tier           |
| `music-2.0`              | Music generation | Legacy music generation tier             |
| `MiniMax-Hailuo-2.3`     | Video generation | Text-to-video and image reference flows  |

## Getting started

Choose your preferred auth method and follow the setup steps.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Best for:** quick setup with MiniMax Coding Plan via OAuth, no API key required.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            This authenticates against `api.minimax.io`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            This authenticates against `api.minimaxi.com`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth setups use the `minimax-portal` provider id. Model refs follow the form `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Referral link for MiniMax Coding Plan (10% off): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Best for:** hosted MiniMax with Anthropic-compatible API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            This configures `api.minimax.io` as the base URL.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            This configures `api.minimaxi.com` as the base URL.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Config example

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    On the Anthropic-compatible streaming path, OpenClaw disables MiniMax thinking by default unless you explicitly set `thinking` yourself. MiniMax's streaming endpoint emits `reasoning_content` in OpenAI-style delta chunks instead of native Anthropic thinking blocks, which can leak internal reasoning into visible output if left enabled implicitly.
    </Warning>

    <Note>
    API-key setups use the `minimax` provider id. Model refs follow the form `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configure via `openclaw configure`

Use the interactive config wizard to set MiniMax without editing JSON:

<Steps>
  <Step title="راه‌اندازی جادوگر">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="انتخاب Model/auth">
    از منو **Model/auth** را انتخاب کنید.
  </Step>
  <Step title="انتخاب یک گزینه احراز هویت MiniMax">
    یکی از گزینه‌های موجود MiniMax را انتخاب کنید:

    | انتخاب احراز هویت | توضیح |
    | --- | --- |
    | `minimax-global-oauth` | OAuth بین‌المللی (طرح Coding) |
    | `minimax-cn-oauth` | OAuth چین (طرح Coding) |
    | `minimax-global-api` | کلید API بین‌المللی |
    | `minimax-cn-api` | کلید API چین |

  </Step>
  <Step title="انتخاب مدل پیش‌فرض خود">
    وقتی درخواست شد، مدل پیش‌فرض خود را انتخاب کنید.
  </Step>
</Steps>

## قابلیت‌ها

### تولید تصویر

Plugin مربوط به MiniMax مدل `image-01` را برای ابزار `image_generate` ثبت می‌کند. این موارد را پشتیبانی می‌کند:

- **تولید متن به تصویر** با کنترل نسبت تصویر
- **ویرایش تصویر به تصویر** (مرجع سوژه) با کنترل نسبت تصویر
- تا **9 تصویر خروجی** در هر درخواست
- تا **1 تصویر مرجع** در هر درخواست ویرایش
- نسبت‌های تصویر پشتیبانی‌شده: `1:1`، `16:9`، `4:3`، `3:2`، `2:3`، `3:4`، `9:16`، `21:9`

برای استفاده از MiniMax برای تولید تصویر، آن را به‌عنوان ارائه‌دهنده تولید تصویر تنظیم کنید:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin از همان `MINIMAX_API_KEY` یا احراز هویت OAuth مانند مدل‌های متنی استفاده می‌کند. اگر MiniMax از قبل راه‌اندازی شده باشد، پیکربندی بیشتری لازم نیست.

هر دو `minimax` و `minimax-portal` ابزار `image_generate` را با همان مدل
`image-01` ثبت می‌کنند. راه‌اندازی‌های مبتنی بر کلید API از `MINIMAX_API_KEY` استفاده می‌کنند؛ راه‌اندازی‌های OAuth می‌توانند به‌جای آن از مسیر احراز هویت همراه `minimax-portal` استفاده کنند.

تولید تصویر همیشه از endpoint اختصاصی تصویر MiniMax
(`/v1/image_generation`) استفاده می‌کند و `models.providers.minimax.baseUrl` را نادیده می‌گیرد،
زیرا آن فیلد URL پایه سازگار با chat/Anthropic را پیکربندی می‌کند. برای هدایت تولید تصویر
از طریق endpoint چین، `MINIMAX_API_HOST=https://api.minimaxi.com` را تنظیم کنید؛ endpoint سراسری پیش‌فرض
`https://api.minimax.io` است.

وقتی onboarding یا راه‌اندازی کلید API ورودی‌های صریح `models.providers.minimax`
را می‌نویسد، OpenClaw مدل‌های `MiniMax-M2.7` و
`MiniMax-M2.7-highspeed` را به‌عنوان مدل‌های گفت‌وگوی فقط متنی مادی‌سازی می‌کند. درک تصویر
به‌صورت جداگانه از طریق ارائه‌دهنده رسانه `MiniMax-VL-01` که در مالکیت Plugin است ارائه می‌شود.

<Note>
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار failover، [تولید تصویر](/fa/tools/image-generation) را ببینید.
</Note>

### متن به گفتار

Plugin همراه `minimax`، MiniMax T2A v2 را به‌عنوان ارائه‌دهنده گفتار برای
`messages.tts` ثبت می‌کند.

- مدل پیش‌فرض TTS: `speech-2.8-hd`
- صدای پیش‌فرض: `English_expressive_narrator`
- شناسه‌های مدل همراه پشتیبانی‌شده شامل `speech-2.8-hd`، `speech-2.8-turbo`،
  `speech-2.6-hd`، `speech-2.6-turbo`، `speech-02-hd`،
  `speech-02-turbo`، `speech-01-hd` و `speech-01-turbo` هستند.
- تفکیک احراز هویت به‌ترتیب `messages.tts.providers.minimax.apiKey`، سپس
  پروفایل‌های احراز هویت OAuth/token مربوط به `minimax-portal`، سپس کلیدهای محیطی
  Token Plan (`MINIMAX_OAUTH_TOKEN`، `MINIMAX_CODE_PLAN_KEY`،
  `MINIMAX_CODING_API_KEY`) و سپس `MINIMAX_API_KEY` است.
- اگر هیچ میزبان TTS پیکربندی نشده باشد، OpenClaw میزبان OAuth پیکربندی‌شده
  `minimax-portal` را دوباره استفاده می‌کند و پسوندهای مسیر سازگار با Anthropic
  مانند `/anthropic` را حذف می‌کند.
- پیوست‌های صوتی معمولی به‌صورت MP3 باقی می‌مانند.
- مقصدهای پیام صوتی مانند Feishu و Telegram از MP3 مربوط به MiniMax
  به Opus با فرکانس 48kHz توسط `ffmpeg` ترنسکد می‌شوند، زیرا API فایل Feishu/Lark فقط
  `file_type: "opus"` را برای پیام‌های صوتی بومی می‌پذیرد.
- MiniMax T2A مقادیر کسری `speed` و `vol` را می‌پذیرد، اما `pitch` به‌صورت
  عدد صحیح ارسال می‌شود؛ OpenClaw مقادیر کسری `pitch` را پیش از درخواست API کوتاه می‌کند.

| تنظیمات                                  | متغیر محیطی                | پیش‌فرض                       | توضیح                      |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | میزبان API MiniMax T2A.            |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | شناسه مدل TTS.                    |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | شناسه صدای استفاده‌شده برای خروجی گفتار. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | سرعت پخش، `0.5..2.0`.      |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | حجم صدا، `(0, 10]`.               |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | جابه‌جایی زیر و بمی به‌صورت عدد صحیح، `-12..12`.  |

### تولید موسیقی

Plugin همراه MiniMax، تولید موسیقی را از طریق ابزار مشترک
`music_generate` برای هر دو `minimax` و `minimax-portal` ثبت می‌کند.

- مدل موسیقی پیش‌فرض: `minimax/music-2.6`
- مدل موسیقی OAuth: `minimax-portal/music-2.6`
- همچنین از `minimax/music-2.5` و `minimax/music-2.0` پشتیبانی می‌کند
- کنترل‌های prompt: `lyrics`، `instrumental`، `durationSeconds`
- قالب خروجی: `mp3`
- اجراهای مبتنی بر نشست از طریق جریان مشترک وظیفه/وضعیت، از جمله `action: "status"`، جدا می‌شوند

برای استفاده از MiniMax به‌عنوان ارائه‌دهنده موسیقی پیش‌فرض:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار failover، [تولید موسیقی](/fa/tools/music-generation) را ببینید.
</Note>

### تولید ویدئو

Plugin همراه MiniMax، تولید ویدئو را از طریق ابزار مشترک
`video_generate` برای هر دو `minimax` و `minimax-portal` ثبت می‌کند.

- مدل ویدئوی پیش‌فرض: `minimax/MiniMax-Hailuo-2.3`
- مدل ویدئوی OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- حالت‌ها: جریان‌های متن به ویدئو و مرجع تک‌تصویری
- از `aspectRatio` و `resolution` پشتیبانی می‌کند

برای استفاده از MiniMax به‌عنوان ارائه‌دهنده ویدئوی پیش‌فرض:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار failover، [تولید ویدیو](/fa/tools/video-generation) را ببینید.
</Note>

### درک تصویر

Plugin MiniMax درک تصویر را جدا از کاتالوگ متنی ثبت می‌کند:

| شناسه ارائه‌دهنده | مدل تصویر پیش‌فرض |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

به همین دلیل مسیریابی خودکار رسانه می‌تواند از درک تصویر MiniMax استفاده کند، حتی وقتی کاتالوگ ارائه‌دهنده متنِ همراه هنوز فقط ارجاع‌های چت متنی M2.7 را نشان می‌دهد.

### جست‌وجوی وب

Plugin MiniMax همچنین `web_search` را از طریق API جست‌وجوی MiniMax Coding Plan ثبت می‌کند.

- شناسه ارائه‌دهنده: `minimax`
- نتایج ساخت‌یافته: عنوان‌ها، URLها، قطعه‌ها، پرس‌وجوهای مرتبط
- متغیر محیطی ترجیحی: `MINIMAX_CODE_PLAN_KEY`
- نام مستعار env پذیرفته‌شده: `MINIMAX_CODING_API_KEY`
- fallback سازگاری: `MINIMAX_API_KEY` وقتی از قبل به یک توکن coding-plan اشاره می‌کند
- استفاده مجدد از منطقه: `plugins.entries.minimax.config.webSearch.region`، سپس `MINIMAX_API_HOST`، سپس URLهای پایه ارائه‌دهنده MiniMax
- جست‌وجو روی شناسه ارائه‌دهنده `minimax` می‌ماند؛ راه‌اندازی OAuth برای CN/سراسری همچنان می‌تواند به‌طور غیرمستقیم منطقه را از طریق `models.providers.minimax-portal.baseUrl` هدایت کند

پیکربندی زیر `plugins.entries.minimax.config.webSearch.*` قرار دارد.

<Note>
برای پیکربندی کامل و استفاده از جست‌وجوی وب، [جست‌وجوی MiniMax](/fa/tools/minimax-search) را ببینید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="گزینه‌های پیکربندی">
    | گزینه | توضیح |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | `https://api.minimax.io/anthropic` را ترجیح دهید (سازگار با Anthropic)؛ `https://api.minimax.io/v1` برای payloadهای سازگار با OpenAI اختیاری است |
    | `models.providers.minimax.api` | `anthropic-messages` را ترجیح دهید؛ `openai-completions` برای payloadهای سازگار با OpenAI اختیاری است |
    | `models.providers.minimax.apiKey` | کلید API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | `id`، `name`، `reasoning`، `contextWindow`، `maxTokens`، `cost` را تعریف کنید |
    | `agents.defaults.models` | مدل‌هایی را که در allowlist می‌خواهید alias کنید |
    | `models.mode` | اگر می‌خواهید MiniMax را کنار موارد داخلی اضافه کنید، `merge` را نگه دارید |
  </Accordion>

  <Accordion title="پیش‌فرض‌های تفکر">
    روی `api: "anthropic-messages"`، OpenClaw مقدار `thinking: { type: "disabled" }` را تزریق می‌کند، مگر اینکه تفکر از قبل به‌طور صریح در params/config تنظیم شده باشد.

    این کار مانع می‌شود endpoint استریم MiniMax مقدار `reasoning_content` را در قطعه‌های دلتا به سبک OpenAI منتشر کند؛ چیزی که می‌توانست استدلال داخلی را وارد خروجی قابل مشاهده کند.

  </Accordion>

  <Accordion title="حالت سریع">
    `/fast on` یا `params.fastMode: true` مقدار `MiniMax-M2.7` را در مسیر استریم سازگار با Anthropic به `MiniMax-M2.7-highspeed` بازنویسی می‌کند.
  </Accordion>

  <Accordion title="نمونه fallback">
    **بهترین کاربرد:** قوی‌ترین مدل نسل جدید خود را به‌عنوان اصلی نگه دارید و در صورت شکست به MiniMax M2.7 منتقل شوید. نمونه زیر از Opus به‌عنوان مدل اصلی مشخص استفاده می‌کند؛ آن را با مدل اصلی نسل جدید دلخواه خود جایگزین کنید.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="جزئیات استفاده از Coding Plan">
    - API استفاده از Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (به کلید coding plan نیاز دارد).
    - OpenClaw میزان استفاده coding-plan MiniMax را به همان نمایش `% left` که ارائه‌دهنده‌های دیگر استفاده می‌کنند عادی‌سازی می‌کند. فیلدهای خام `usage_percent` / `usagePercent` در MiniMax سهمیه باقی‌مانده هستند، نه سهمیه مصرف‌شده؛ بنابراین OpenClaw آن‌ها را معکوس می‌کند. فیلدهای مبتنی بر شمارش، در صورت وجود، اولویت دارند.
    - وقتی API مقدار `model_remains` را برمی‌گرداند، OpenClaw ورودی مدل چت را ترجیح می‌دهد، در صورت نیاز برچسب پنجره را از `start_time` / `end_time` استخراج می‌کند، و نام مدل انتخاب‌شده را در برچسب طرح قرار می‌دهد تا تشخیص پنجره‌های coding-plan آسان‌تر شود.
    - snapshotهای استفاده، `minimax`، `minimax-cn`، و `minimax-portal` را به‌عنوان سطح سهمیه MiniMax یکسان در نظر می‌گیرند، و پیش از fallback به متغیرهای محیطی کلید Coding Plan، OAuth ذخیره‌شده MiniMax را ترجیح می‌دهند.

  </Accordion>
</AccordionGroup>

## نکته‌ها

- ارجاع‌های مدل مسیر احراز هویت را دنبال می‌کنند:
  - راه‌اندازی با کلید API: `minimax/<model>`
  - راه‌اندازی OAuth: `minimax-portal/<model>`
- مدل چت پیش‌فرض: `MiniMax-M2.7`
- مدل چت جایگزین: `MiniMax-M2.7-highspeed`
- راه‌اندازی اولیه و تنظیم مستقیم کلید API، تعریف‌های مدل فقط‌متن را برای هر دو نوع M2.7 می‌نویسند
- درک تصویر از ارائه‌دهنده رسانه `MiniMax-VL-01` متعلق به Plugin استفاده می‌کند
- اگر به ردیابی دقیق هزینه نیاز دارید، مقادیر قیمت‌گذاری را در `models.json` به‌روزرسانی کنید
- برای تأیید شناسه ارائه‌دهنده فعلی از `openclaw models list` استفاده کنید، سپس با `openclaw models set minimax/MiniMax-M2.7` یا `openclaw models set minimax-portal/MiniMax-M2.7` جابه‌جا شوید

<Tip>
لینک ارجاع برای MiniMax Coding Plan (۱۰٪ تخفیف): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
برای قواعد ارائه‌دهنده، [ارائه‌دهنده‌های مدل](/fa/concepts/model-providers) را ببینید.
</Note>

## عیب‌یابی

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    این معمولاً یعنی **ارائه‌دهنده MiniMax پیکربندی نشده است** (هیچ ورودی ارائه‌دهنده مطابقی وجود ندارد و هیچ پروفایل احراز هویت/کلید env برای MiniMax پیدا نشده است). اصلاح این تشخیص در **2026.1.12** وجود دارد. برای رفع مشکل:

    - به **2026.1.12** ارتقا دهید (یا از source `main` اجرا کنید)، سپس gateway را راه‌اندازی مجدد کنید.
    - `openclaw configure` را اجرا کنید و یک گزینه احراز هویت **MiniMax** را انتخاب کنید، یا
    - بلوک مطابق `models.providers.minimax` یا `models.providers.minimax-portal` را به‌صورت دستی اضافه کنید، یا
    - `MINIMAX_API_KEY`، `MINIMAX_OAUTH_TOKEN`، یا یک پروفایل احراز هویت MiniMax را تنظیم کنید تا ارائه‌دهنده مطابق بتواند تزریق شود.

    مطمئن شوید شناسه مدل **به حروف بزرگ و کوچک حساس** است:

    - مسیر کلید API: `minimax/MiniMax-M2.7` یا `minimax/MiniMax-M2.7-highspeed`
    - مسیر OAuth: `minimax-portal/MiniMax-M2.7` یا `minimax-portal/MiniMax-M2.7-highspeed`

    سپس دوباره با دستور زیر بررسی کنید:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
راهنمای بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq).
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پارامترهای مشترک ابزار تصویر و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید موسیقی" href="/fa/tools/music-generation" icon="music">
    پارامترهای مشترک ابزار موسیقی و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید ویدیو" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدیو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="جست‌وجوی MiniMax" href="/fa/tools/minimax-search" icon="magnifying-glass">
    پیکربندی جست‌وجوی وب از طریق MiniMax Coding Plan.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    عیب‌یابی عمومی و پرسش‌های متداول.
  </Card>
</CardGroup>
