---
read_when:
    - می‌خواهید از مدل‌های MiniMax در OpenClaw استفاده کنید
    - شما به راهنمای راه‌اندازی MiniMax نیاز دارید
summary: از مدل‌های MiniMax در OpenClaw استفاده کنید
title: MiniMax
x-i18n:
    generated_at: "2026-06-27T18:41:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fe606178d7d15383e56c026b02ba7be751ead706adc097c776c0a6a92aa2a2
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw's MiniMax provider defaults to **MiniMax M3**.

MiniMax همچنین ارائه می‌کند:

- سنتز گفتار همراه از طریق T2A v2
- درک تصویر همراه از طریق `MiniMax-VL-01`
- تولید موسیقی همراه از طریق `music-2.6`
- `web_search` همراه از طریق API جست‌وجوی MiniMax Token Plan

تفکیک ارائه‌دهنده:

| شناسه ارائه‌دهنده | احراز هویت | قابلیت‌ها |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | کلید API | متن، تولید تصویر، تولید موسیقی، تولید ویدئو، درک تصویر، گفتار، جست‌وجوی وب |
| `minimax-portal` | OAuth   | متن، تولید تصویر، تولید موسیقی، تولید ویدئو، درک تصویر، گفتار             |

## کاتالوگ داخلی

| مدل                    | نوع             | توضیح                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M3`             | چت (استدلال) | مدل استدلال میزبانی‌شده پیش‌فرض           |
| `MiniMax-M2.7`           | چت (استدلال) | مدل استدلال میزبانی‌شده قبلی          |
| `MiniMax-M2.7-highspeed` | چت (استدلال) | رده استدلال سریع‌تر M2.7               |
| `MiniMax-VL-01`          | بینایی           | مدل درک تصویر                |
| `image-01`               | تولید تصویر | ویرایش متن‌به‌تصویر و تصویر‌به‌تصویر |
| `music-2.6`              | تولید موسیقی | مدل موسیقی پیش‌فرض                      |
| `music-2.5`              | تولید موسیقی | رده قبلی تولید موسیقی           |
| `music-2.0`              | تولید موسیقی | رده قدیمی تولید موسیقی             |
| `MiniMax-Hailuo-2.3`     | تولید ویدئو | جریان‌های متن‌به‌ویدئو و ارجاع تصویر  |

## شروع به کار

روش احراز هویت دلخواه خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **بهترین برای:** راه‌اندازی سریع با MiniMax Coding Plan از طریق OAuth، بدون نیاز به کلید API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            این کار در برابر `api.minimax.io` احراز هویت می‌کند.
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

            این کار در برابر `api.minimaxi.com` احراز هویت می‌کند.
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
    راه‌اندازی‌های OAuth از شناسه ارائه‌دهنده `minimax-portal` استفاده می‌کنند. ارجاع‌های مدل از قالب `minimax-portal/MiniMax-M3` پیروی می‌کنند.
    </Note>

    <Tip>
    لینک ارجاع برای MiniMax Coding Plan (۱۰٪ تخفیف): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **بهترین برای:** MiniMax میزبانی‌شده با API سازگار با Anthropic.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            این کار `api.minimax.io` را به‌عنوان URL پایه پیکربندی می‌کند.
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

            این کار `api.minimaxi.com` را به‌عنوان URL پایه پیکربندی می‌کند.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### نمونه پیکربندی

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
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
    در مسیر استریم سازگار با Anthropic، OpenClaw به‌صورت پیش‌فرض thinking در MiniMax M2.x را غیرفعال می‌کند، مگر اینکه خودتان صراحتاً `thinking` را تنظیم کنید. نقطه پایانی استریم M2.x به‌جای بلوک‌های thinking بومی Anthropic، `reasoning_content` را در قطعه‌های دلتا به سبک OpenAI منتشر می‌کند؛ اگر به‌صورت ضمنی فعال بماند، این می‌تواند استدلال داخلی را به خروجی قابل مشاهده نشت دهد. MiniMax-M3 (و M3.x سازگار رو به جلو) از این پیش‌فرض مستثنا است: M3 بلوک‌های thinking صحیح Anthropic منتشر می‌کند و برای تولید محتوای قابل مشاهده به فعال بودن thinking نیاز دارد، بنابراین OpenClaw، M3 را روی مسیر thinking حذف‌شده/تطبیقی ارائه‌دهنده نگه می‌دارد.
    </Warning>

    <Note>
    راه‌اندازی‌های کلید API از شناسه ارائه‌دهنده `minimax` استفاده می‌کنند. ارجاع‌های مدل از قالب `minimax/MiniMax-M3` پیروی می‌کنند.
    </Note>

  </Tab>
</Tabs>

## پیکربندی از طریق `openclaw configure`

از جادوگر پیکربندی تعاملی برای تنظیم MiniMax بدون ویرایش JSON استفاده کنید:

<Steps>
  <Step title="Launch the wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Select Model/auth">
    از منو **Model/auth** را انتخاب کنید.
  </Step>
  <Step title="Choose a MiniMax auth option">
    یکی از گزینه‌های MiniMax موجود را انتخاب کنید:

    | گزینه احراز هویت | توضیح |
    | --- | --- |
    | `minimax-global-oauth` | OAuth بین‌المللی (Coding Plan) |
    | `minimax-cn-oauth` | OAuth چین (Coding Plan) |
    | `minimax-global-api` | کلید API بین‌المللی |
    | `minimax-cn-api` | کلید API چین |

  </Step>
  <Step title="Pick your default model">
    وقتی درخواست شد، مدل پیش‌فرض خود را انتخاب کنید.
  </Step>
</Steps>

## قابلیت‌ها

### تولید تصویر

Plugin MiniMax مدل `image-01` را برای ابزار `image_generate` ثبت می‌کند. پشتیبانی می‌کند از:

- **تولید متن‌به‌تصویر** با کنترل نسبت تصویر
- **ویرایش تصویر‌به‌تصویر** (ارجاع سوژه) با کنترل نسبت تصویر
- تا **۹ تصویر خروجی** در هر درخواست
- تا **۱ تصویر مرجع** در هر درخواست ویرایش
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

Plugin از همان `MINIMAX_API_KEY` یا احراز هویت OAuth مدل‌های متنی استفاده می‌کند. اگر MiniMax از قبل راه‌اندازی شده باشد، پیکربندی اضافه‌ای لازم نیست.

هر دو `minimax` و `minimax-portal`، `image_generate` را با همان
مدل `image-01` ثبت می‌کنند. راه‌اندازی‌های کلید API از `MINIMAX_API_KEY` استفاده می‌کنند؛ راه‌اندازی‌های OAuth می‌توانند به‌جای آن از
مسیر احراز هویت همراه `minimax-portal` استفاده کنند.

تولید تصویر همیشه از نقطه پایانی اختصاصی تصویر MiniMax
(`/v1/image_generation`) استفاده می‌کند و `models.providers.minimax.baseUrl` را نادیده می‌گیرد،
چون آن فیلد URL پایه چت/سازگار با Anthropic را پیکربندی می‌کند. برای مسیریابی تولید تصویر
از طریق نقطه پایانی CN، `MINIMAX_API_HOST=https://api.minimaxi.com` را تنظیم کنید؛ نقطه پایانی جهانی پیش‌فرض
`https://api.minimax.io` است.

وقتی onboarding یا راه‌اندازی کلید API ورودی‌های صریح `models.providers.minimax`
را می‌نویسد، OpenClaw، `MiniMax-M3`، `MiniMax-M2.7` و
`MiniMax-M2.7-highspeed` را به‌عنوان مدل‌های چت مادی‌سازی می‌کند. M3 ورودی متن و تصویر را اعلام می‌کند؛
درک تصویر همچنان جداگانه از طریق ارائه‌دهنده رسانه مالک Plugin
`MiniMax-VL-01` ارائه می‌شود.

<Note>
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار failover، [تولید تصویر](/fa/tools/image-generation) را ببینید.
</Note>

### تبدیل متن به گفتار

Plugin همراه `minimax`، MiniMax T2A v2 را به‌عنوان ارائه‌دهنده گفتار برای
`messages.tts` ثبت می‌کند.

- مدل TTS پیش‌فرض: `speech-2.8-hd`
- صدای پیش‌فرض: `English_expressive_narrator`
- شناسه‌های مدل همراه پشتیبانی‌شده شامل `speech-2.8-hd`، `speech-2.8-turbo`،
  `speech-2.6-hd`، `speech-2.6-turbo`، `speech-02-hd`،
  `speech-02-turbo`، `speech-01-hd` و `speech-01-turbo` هستند.
- حل احراز هویت به‌ترتیب `messages.tts.providers.minimax.apiKey`، سپس
  پروفایل‌های احراز هویت OAuth/توکن `minimax-portal`، سپس کلیدهای محیطی
  Token Plan (`MINIMAX_OAUTH_TOKEN`، `MINIMAX_CODE_PLAN_KEY`،
  `MINIMAX_CODING_API_KEY`)، سپس `MINIMAX_API_KEY` است.
- اگر هیچ میزبان TTS پیکربندی نشده باشد، OpenClaw میزبان OAuth پیکربندی‌شده
  `minimax-portal` را دوباره استفاده می‌کند و پسوندهای مسیر سازگار با Anthropic
  مانند `/anthropic` را حذف می‌کند.
- پیوست‌های صوتی معمولی MP3 باقی می‌مانند.
- مقصدهای voice-note مانند Feishu و Telegram از MP3 MiniMax
  با `ffmpeg` به Opus با ۴۸kHz تبدیل می‌شوند، چون API فایل Feishu/Lark فقط
  `file_type: "opus"` را برای پیام‌های صوتی بومی می‌پذیرد.
- MiniMax T2A مقدارهای کسری `speed` و `vol` را می‌پذیرد، اما `pitch` به‌صورت
  عدد صحیح ارسال می‌شود؛ OpenClaw مقدارهای کسری `pitch` را پیش از درخواست API کوتاه می‌کند.

| تنظیم                                         | متغیر محیطی                | پیش‌فرض                       | توضیح                      |
| ----------------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl`        | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | میزبان API MiniMax T2A.            |
| `messages.tts.providers.minimax.model`          | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | شناسه مدل TTS.                    |
| `messages.tts.providers.minimax.speakerVoiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | شناسه صدایی که برای خروجی گفتار استفاده می‌شود. |
| `messages.tts.providers.minimax.speed`          |                        | `1.0`                         | سرعت پخش، `0.5..2.0`.      |
| `messages.tts.providers.minimax.vol`            |                        | `1.0`                         | حجم صدا، `(0, 10]`.               |
| `messages.tts.providers.minimax.pitch`          |                        | `0`                           | تغییر زیر و بمی عدد صحیح، `-12..12`.  |

### تولید موسیقی

Plugin همراه MiniMax، تولید موسیقی را از طریق ابزار مشترک
`music_generate` برای هر دو `minimax` و `minimax-portal` ثبت می‌کند.

- مدل موسیقی پیش‌فرض: `minimax/music-2.6`
- مدل موسیقی OAuth: `minimax-portal/music-2.6`
- همچنین از `minimax/music-2.5` و `minimax/music-2.0` پشتیبانی می‌کند
- کنترل‌های پرامپت: `lyrics`، `instrumental`
- قالب خروجی: `mp3`
- اجراهای پشتیبانی‌شده با نشست از طریق جریان مشترک وظیفه/وضعیت جدا می‌شوند، از جمله `action: "status"`

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
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار failover به [تولید موسیقی](/fa/tools/music-generation) مراجعه کنید.
</Note>

### تولید ویدئو

Plugin همراه MiniMax تولید ویدئو را از طریق ابزار مشترک
`video_generate` برای هر دو `minimax` و `minimax-portal` ثبت می‌کند.

- مدل ویدئوی پیش‌فرض: `minimax/MiniMax-Hailuo-2.3`
- مدل ویدئوی OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- حالت‌ها: جریان‌های متن‌به‌ویدئو و ارجاع تک‌تصویری
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
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار failover به [تولید ویدئو](/fa/tools/video-generation) مراجعه کنید.
</Note>

### درک تصویر

Plugin MiniMax درک تصویر را جدا از کاتالوگ متن ثبت می‌کند:

| شناسه ارائه‌دهنده | مدل تصویر پیش‌فرض |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

به همین دلیل مسیریابی خودکار رسانه می‌تواند از درک تصویر MiniMax استفاده کند، حتی
وقتی کاتالوگ ارائه‌دهنده متن همراه، ارجاع‌های چت M3 دارای قابلیت تصویر را نیز شامل می‌شود.

### جست‌وجوی وب

Plugin MiniMax همچنین `web_search` را از طریق API جست‌وجوی MiniMax Token Plan
ثبت می‌کند.

- شناسه ارائه‌دهنده: `minimax`
- نتایج ساختاریافته: عنوان‌ها، URLها، بریده‌ها، پرس‌وجوهای مرتبط
- متغیر محیطی ترجیحی: `MINIMAX_CODE_PLAN_KEY`
- نام‌های مستعار محیطی پذیرفته‌شده: `MINIMAX_CODING_API_KEY`، `MINIMAX_OAUTH_TOKEN`
- fallback سازگاری: `MINIMAX_API_KEY` وقتی از قبل به یک اعتبارنامه token-plan اشاره می‌کند
- استفاده مجدد از منطقه: `plugins.entries.minimax.config.webSearch.region`، سپس `MINIMAX_API_HOST`، سپس URLهای پایه ارائه‌دهنده MiniMax
- جست‌وجو روی شناسه ارائه‌دهنده `minimax` باقی می‌ماند؛ راه‌اندازی OAuth چین/جهانی می‌تواند منطقه را به‌طور غیرمستقیم از طریق `models.providers.minimax-portal.baseUrl` هدایت کند و می‌تواند احراز هویت bearer را از طریق `MINIMAX_OAUTH_TOKEN` فراهم کند

پیکربندی زیر `plugins.entries.minimax.config.webSearch.*` قرار دارد.

<Note>
برای پیکربندی کامل جست‌وجوی وب و شیوه استفاده، به [جست‌وجوی MiniMax](/fa/tools/minimax-search) مراجعه کنید.
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
    | `agents.defaults.models` | مدل‌هایی را که می‌خواهید در فهرست مجاز باشند alias کنید |
    | `models.mode` | اگر می‌خواهید MiniMax را در کنار موارد داخلی اضافه کنید، `merge` را نگه دارید |
  </Accordion>

  <Accordion title="پیش‌فرض‌های تفکر">
    در `api: "anthropic-messages"`، OpenClaw برای مدل‌های MiniMax M2.x مقدار `thinking: { type: "disabled" }` را تزریق می‌کند، مگر اینکه thinking از قبل به‌طور صریح در params/config تنظیم شده باشد.

    این کار مانع می‌شود endpoint استریم M2.x مقدار `reasoning_content` را در قطعه‌های delta به سبک OpenAI منتشر کند؛ چیزی که باعث نشت استدلال داخلی به خروجی قابل مشاهده می‌شد.

    MiniMax-M3 (و M3.x) مستثنا است: M3 بلوک‌های thinking درست Anthropic منتشر می‌کند و وقتی thinking غیرفعال است، یک آرایه `content` خالی همراه با `stop_reason: "end_turn"` برمی‌گرداند، بنابراین wrapper، M3 را روی مسیر thinking حذف‌شده/تطبیقی ارائه‌دهنده نگه می‌دارد.

  </Accordion>

  <Accordion title="حالت سریع">
    `/fast on` یا `params.fastMode: true` مقدار `MiniMax-M2.7` را در مسیر استریم سازگار با Anthropic به `MiniMax-M2.7-highspeed` بازنویسی می‌کند.
  </Accordion>

  <Accordion title="نمونه fallback">
    **بهترین برای:** قوی‌ترین مدل نسل جدید خود را به‌عنوان اصلی نگه دارید و به MiniMax M2.7 fail over کنید. نمونه زیر از Opus به‌عنوان یک مدل اصلی مشخص استفاده می‌کند؛ آن را با مدل اصلی نسل جدید دلخواه خود جایگزین کنید.

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
    - API استفاده Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` یا `https://api.minimax.io/v1/token_plan/remains` (به کلید coding plan نیاز دارد).
    - polling استفاده، host را از `models.providers.minimax-portal.baseUrl` یا `models.providers.minimax.baseUrl` در صورت پیکربندی استخراج می‌کند، بنابراین راه‌اندازی‌های جهانی که از `https://api.minimax.io/anthropic` استفاده می‌کنند، `api.minimax.io` را poll می‌کنند. URLهای پایه ناموجود یا بدشکل برای سازگاری fallback چین را نگه می‌دارند.
    - OpenClaw استفاده MiniMax coding-plan را به همان نمایش `% left` که سایر ارائه‌دهندگان استفاده می‌کنند نرمال‌سازی می‌کند. فیلدهای خام `usage_percent` / `usagePercent` در MiniMax سهمیه باقی‌مانده هستند، نه سهمیه مصرف‌شده، بنابراین OpenClaw آن‌ها را معکوس می‌کند. فیلدهای مبتنی بر شمارش، در صورت وجود، اولویت دارند.
    - وقتی API مقدار `model_remains` را برمی‌گرداند، OpenClaw ورودی مدل چت را ترجیح می‌دهد، در صورت نیاز برچسب پنجره را از `start_time` / `end_time` استخراج می‌کند، و نام مدل انتخاب‌شده را در برچسب طرح قرار می‌دهد تا تشخیص پنجره‌های coding-plan آسان‌تر شود.
    - snapshotهای استفاده، `minimax`، `minimax-cn`، و `minimax-portal` را به‌عنوان یک سطح سهمیه MiniMax واحد در نظر می‌گیرند، و پیش از fallback به متغیرهای محیطی کلید Coding Plan، OAuth ذخیره‌شده MiniMax را ترجیح می‌دهند.

  </Accordion>
</AccordionGroup>

## یادداشت‌ها

- ارجاع‌های مدل از مسیر احراز هویت پیروی می‌کنند:
  - راه‌اندازی کلید API: `minimax/<model>`
  - راه‌اندازی OAuth: `minimax-portal/<model>`
- مدل چت پیش‌فرض: `MiniMax-M3`
- مدل‌های چت جایگزین: `MiniMax-M2.7`، `MiniMax-M2.7-highspeed`
- onboarding و راه‌اندازی مستقیم کلید API تعریف‌های مدل را برای M3 و هر دو گونه M2.7 می‌نویسند
- درک تصویر از ارائه‌دهنده رسانه `MiniMax-VL-01` متعلق به Plugin استفاده می‌کند
- اگر به رهگیری دقیق هزینه نیاز دارید، مقدارهای قیمت‌گذاری را در `models.json` به‌روزرسانی کنید
- برای تایید شناسه ارائه‌دهنده فعلی از `openclaw models list` استفاده کنید، سپس با `openclaw models set minimax/MiniMax-M3` یا `openclaw models set minimax-portal/MiniMax-M3` تغییر دهید

<Tip>
لینک ارجاع برای MiniMax Coding Plan (۱۰٪ تخفیف): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
برای قوانین ارائه‌دهنده به [ارائه‌دهندگان مدل](/fa/concepts/model-providers) مراجعه کنید.
</Note>

## عیب‌یابی

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M3"'>
    این معمولاً یعنی **ارائه‌دهنده MiniMax پیکربندی نشده است** (هیچ ورودی ارائه‌دهنده مطابق و هیچ پروفایل احراز هویت/کلید محیطی MiniMax پیدا نشده است). رفع این تشخیص در **2026.1.12** قرار دارد. برای رفع:

    - به **2026.1.12** ارتقا دهید (یا از سورس `main` اجرا کنید)، سپس gateway را دوباره راه‌اندازی کنید.
    - `openclaw configure` را اجرا کنید و یک گزینه احراز هویت **MiniMax** را انتخاب کنید، یا
    - بلوک مطابق `models.providers.minimax` یا `models.providers.minimax-portal` را به‌صورت دستی اضافه کنید، یا
    - `MINIMAX_API_KEY`، `MINIMAX_OAUTH_TOKEN`، یا یک پروفایل احراز هویت MiniMax را تنظیم کنید تا ارائه‌دهنده مطابق بتواند تزریق شود.

    مطمئن شوید شناسه مدل **به بزرگی و کوچکی حروف حساس است**:

    - مسیر کلید API: `minimax/MiniMax-M3`، `minimax/MiniMax-M2.7`، یا `minimax/MiniMax-M2.7-highspeed`
    - مسیر OAuth: `minimax-portal/MiniMax-M3`، `minimax-portal/MiniMax-M2.7`، یا `minimax-portal/MiniMax-M2.7-highspeed`

    سپس دوباره با این دستور بررسی کنید:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
کمک بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq).
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پارامترهای مشترک ابزار تصویر و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید موسیقی" href="/fa/tools/music-generation" icon="music">
    پارامترهای مشترک ابزار موسیقی و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدئو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="جست‌وجوی MiniMax" href="/fa/tools/minimax-search" icon="magnifying-glass">
    پیکربندی جست‌وجوی وب از طریق MiniMax Token Plan.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    عیب‌یابی عمومی و پرسش‌های متداول.
  </Card>
</CardGroup>
