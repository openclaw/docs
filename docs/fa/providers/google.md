---
read_when:
    - می‌خواهید از مدل‌های Google Gemini با OpenClaw استفاده کنید
    - به کلید API یا جریان احراز هویت OAuth نیاز دارید
summary: راه‌اندازی Google Gemini (کلید API + OAuth، تولید تصویر، درک رسانه، TTS، جست‌وجوی وب)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-06-27T18:40:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eced20b11cc702d803992d96dcc5edb8f06640f6baffbc65dab504a6c91776bc
    source_path: providers/google.md
    workflow: 16
---

Plugin گوگل دسترسی به مدل‌های Gemini را از طریق Google AI Studio فراهم می‌کند، به‌همراه
تولید تصویر، فهم رسانه (تصویر/صدا/ویدیو)، تبدیل متن به گفتار، و جستجوی وب از طریق
Gemini Grounding.

- ارائه‌دهنده: `google`
- احراز هویت: `GEMINI_API_KEY` یا `GOOGLE_API_KEY`
- API: Google Gemini API
- گزینه زمان اجرا: ارائه‌دهنده/مدل `agentRuntime.id: "google-gemini-cli"`
  از OAuth مربوط به Gemini CLI دوباره استفاده می‌کند، در حالی که ارجاع‌های مدل را به‌صورت canonical به شکل `google/*` نگه می‌دارد.

## شروع به کار

روش احراز هویت دلخواهتان را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="API key">
    **بهترین برای:** دسترسی استاندارد به Gemini API از طریق Google AI Studio.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        یا کلید را مستقیماً وارد کنید:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    هر دو متغیر محیطی `GEMINI_API_KEY` و `GOOGLE_API_KEY` پذیرفته می‌شوند. از هرکدام که از قبل پیکربندی کرده‌اید استفاده کنید.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **بهترین برای:** استفاده دوباره از ورود موجود Gemini CLI از طریق PKCE OAuth به‌جای یک کلید API جداگانه.

    <Warning>
    ارائه‌دهنده `google-gemini-cli` یک یکپارچه‌سازی غیررسمی است. برخی کاربران
    هنگام استفاده از OAuth به این شکل، محدودیت‌هایی برای حساب گزارش کرده‌اند. با مسئولیت خودتان استفاده کنید.
    </Warning>

    <Steps>
      <Step title="Install the Gemini CLI">
        دستور محلی `gemini` باید روی `PATH` در دسترس باشد.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw هم نصب‌های Homebrew و هم نصب‌های سراسری npm را پشتیبانی می‌کند، از جمله
        چیدمان‌های رایج Windows/npm.
      </Step>
      <Step title="Log in via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - مدل پیش‌فرض: `google/gemini-3.1-pro-preview`
    - زمان اجرا: `google-gemini-cli`
    - نام مستعار: `gemini-cli`

    شناسه مدل Gemini API برای Gemini 3.1 Pro برابر با `gemini-3.1-pro-preview` است. OpenClaw نام کوتاه‌تر `google/gemini-3.1-pro` را به‌عنوان یک نام مستعار راحت می‌پذیرد و پیش از فراخوانی‌های ارائه‌دهنده آن را نرمال‌سازی می‌کند.

    **متغیرهای محیطی:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (یا گونه‌های `GEMINI_CLI_*`.)

    <Note>
    اگر درخواست‌های OAuth مربوط به Gemini CLI پس از ورود ناموفق شدند، `GOOGLE_CLOUD_PROJECT` یا
    `GOOGLE_CLOUD_PROJECT_ID` را روی میزبان Gateway تنظیم کنید و دوباره تلاش کنید.
    </Note>

    <Note>
    اگر ورود پیش از شروع جریان مرورگر ناموفق شد، مطمئن شوید دستور محلی `gemini`
    نصب شده و روی `PATH` قرار دارد.
    </Note>

    ارجاع‌های مدل `google-gemini-cli/*` نام‌های مستعار سازگاری قدیمی هستند. پیکربندی‌های
    جدید باید زمانی که اجرای محلی Gemini CLI را می‌خواهند، از ارجاع‌های مدل `google/*` به‌همراه زمان اجرای `google-gemini-cli`
    استفاده کنند.

  </Tab>
</Tabs>

## قابلیت‌ها

| قابلیت                 | پشتیبانی‌شده                  |
| ---------------------- | ----------------------------- |
| تکمیل‌های چت           | بله                           |
| تولید تصویر            | بله                           |
| تولید موسیقی           | بله                           |
| تبدیل متن به گفتار     | بله                           |
| صدای بلادرنگ           | بله (Google Live API)         |
| فهم تصویر              | بله                           |
| رونویسی صدا            | بله                           |
| فهم ویدیو              | بله                           |
| جستجوی وب (Grounding)  | بله                           |
| تفکر/استدلال           | بله (Gemini 2.5+ / Gemini 3+) |
| مدل‌های Gemma 4        | بله                           |

## جستجوی وب

ارائه‌دهنده جستجوی وب همراه `gemini` از گراندینگ Google Search در Gemini استفاده می‌کند.
یک کلید جستجوی اختصاصی را زیر `plugins.entries.google.config.webSearch` پیکربندی کنید،
یا اجازه دهید پس از `GEMINI_API_KEY` از `models.providers.google.apiKey` دوباره استفاده کند:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

اولویت اعتبارنامه‌ها ابتدا `webSearch.apiKey` اختصاصی، سپس `GEMINI_API_KEY`،
و سپس `models.providers.google.apiKey` است. `webSearch.baseUrl` اختیاری است و
برای پراکسی‌های اپراتور یا endpointهای سازگار با Gemini API وجود دارد؛ وقتی حذف شود،
جستجوی وب Gemini از `models.providers.google.baseUrl` دوباره استفاده می‌کند. برای رفتار ابزار مخصوص ارائه‌دهنده،
[جستجوی Gemini](/fa/tools/gemini-search) را ببینید.

<Tip>
مدل‌های Gemini 3 به‌جای `thinkingBudget` از `thinkingLevel` استفاده می‌کنند. OpenClaw کنترل‌های استدلال
Gemini 3، Gemini 3.1 و نام مستعار `gemini-*-latest` را به
`thinkingLevel` نگاشت می‌کند تا اجراهای پیش‌فرض/کم‌تاخیر مقادیر غیرفعال
`thinkingBudget` را ارسال نکنند.

`/think adaptive` به‌جای انتخاب یک سطح ثابت OpenClaw، معنای تفکر پویای Google را حفظ می‌کند. Gemini 3 و Gemini 3.1 یک `thinkingLevel` ثابت را حذف می‌کنند تا
Google بتواند سطح را انتخاب کند؛ Gemini 2.5 مقدار sentinel پویای Google یعنی
`thinkingBudget: -1` را ارسال می‌کند.

مدل‌های Gemma 4 (برای مثال `gemma-4-26b-a4b-it`) حالت تفکر را پشتیبانی می‌کنند. OpenClaw
`thinkingBudget` را برای Gemma 4 به یک `thinkingLevel` پشتیبانی‌شده Google بازنویسی می‌کند.
تنظیم تفکر روی `off`، به‌جای نگاشت به
`MINIMAL`، غیرفعال بودن تفکر را حفظ می‌کند.
</Tip>

## تولید تصویر

ارائه‌دهنده تولید تصویر همراه `google` به‌صورت پیش‌فرض از
`google/gemini-3.1-flash-image-preview` استفاده می‌کند.

- همچنین از `google/gemini-3-pro-image-preview` پشتیبانی می‌کند
- تولید: تا ۴ تصویر در هر درخواست
- حالت ویرایش: فعال، تا ۵ تصویر ورودی
- کنترل‌های هندسه: `size`، `aspectRatio` و `resolution`

برای استفاده از Google به‌عنوان ارائه‌دهنده پیش‌فرض تصویر:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار failover، [تولید تصویر](/fa/tools/image-generation) را ببینید.
</Note>

## تولید ویدیو

Plugin همراه `google` همچنین تولید ویدیو را از طریق ابزار مشترک
`video_generate` ثبت می‌کند.

- مدل ویدیوی پیش‌فرض: `google/veo-3.1-fast-generate-preview`
- حالت‌ها: جریان‌های متن به ویدیو، تصویر به ویدیو، و ارجاع تک‌ویدیویی
- از `aspectRatio` (`16:9`، `9:16`) و `resolution` (`720P`، `1080P`) پشتیبانی می‌کند؛ خروجی صدا امروز توسط Veo پشتیبانی نمی‌شود
- مدت‌های پشتیبانی‌شده: **۴، ۶، یا ۸ ثانیه** (مقادیر دیگر به نزدیک‌ترین مقدار مجاز می‌چسبند)

برای استفاده از Google به‌عنوان ارائه‌دهنده پیش‌فرض ویدیو:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار failover، [تولید ویدیو](/fa/tools/video-generation) را ببینید.
</Note>

## تولید موسیقی

Plugin همراه `google` همچنین تولید موسیقی را از طریق ابزار مشترک
`music_generate` ثبت می‌کند.

- مدل موسیقی پیش‌فرض: `google/lyria-3-clip-preview`
- همچنین از `google/lyria-3-pro-preview` پشتیبانی می‌کند
- کنترل‌های prompt: `lyrics` و `instrumental`
- قالب خروجی: به‌صورت پیش‌فرض `mp3`، به‌علاوه `wav` روی `google/lyria-3-pro-preview`
- ورودی‌های ارجاع: تا ۱۰ تصویر
- اجراهای مبتنی بر نشست از طریق جریان مشترک task/status جدا می‌شوند، از جمله `action: "status"`

برای استفاده از Google به‌عنوان ارائه‌دهنده پیش‌فرض موسیقی:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار failover، [تولید موسیقی](/fa/tools/music-generation) را ببینید.
</Note>

## تبدیل متن به گفتار

ارائه‌دهنده گفتار همراه `google` از مسیر TTS مربوط به Gemini API با
`gemini-3.1-flash-tts-preview` استفاده می‌کند.

- صدای پیش‌فرض: `Kore`
- احراز هویت: `messages.tts.providers.google.apiKey`، `models.providers.google.apiKey`، `GEMINI_API_KEY`، یا `GOOGLE_API_KEY`
- خروجی: WAV برای پیوست‌های معمول TTS، Opus برای مقصدهای voice-note، PCM برای Talk/تلفن
- خروجی voice-note: PCM گوگل به‌صورت WAV بسته‌بندی می‌شود و با `ffmpeg` به Opus با نرخ ۴۸ kHz تبدیل می‌شود

مسیر batch Gemini TTS گوگل، صدای تولیدشده را در پاسخ کامل‌شده
`generateContent` برمی‌گرداند. برای گفت‌وگوهای گفتاری با کمترین تاخیر، به‌جای batch
TTS از ارائه‌دهنده صدای بلادرنگ Google با پشتوانه Gemini Live API استفاده کنید.

برای استفاده از Google به‌عنوان ارائه‌دهنده پیش‌فرض TTS:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS برای کنترل سبک از prompt به زبان طبیعی استفاده می‌کند. `audioProfile` را تنظیم کنید تا یک prompt سبک قابل‌استفاده‌مجدد پیش از متن گفتاری اضافه شود. وقتی متن prompt شما به یک گوینده نام‌دار اشاره می‌کند، `speakerName` را تنظیم کنید.

Gemini API TTS همچنین tagهای صوتی بیانی داخل کروشه را در متن می‌پذیرد،
مانند `[whispers]` یا `[laughs]`. برای اینکه tagها از پاسخ چت قابل‌مشاهده بیرون بمانند
اما به TTS ارسال شوند، آن‌ها را داخل یک بلوک `[[tts:text]]...[[/tts:text]]`
قرار دهید:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
یک کلید API از Google Cloud Console که به Gemini API محدود شده باشد برای این
ارائه‌دهنده معتبر است. این مسیر جداگانه Cloud Text-to-Speech API نیست.
</Note>

## صدای بلادرنگ

Plugin همراه `google` یک ارائه‌دهنده صدای بلادرنگ با پشتوانه
Gemini Live API برای پل‌های صوتی backend مانند Voice Call و Google Meet ثبت می‌کند.

| تنظیم                 | مسیر پیکربندی                                                       | پیش‌فرض                                                                              |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| مدل                   | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| صدا                   | `...google.voice`                                                   | `Kore`                                                                                |
| دما                   | `...google.temperature`                                             | (تنظیم‌نشده)                                                                         |
| حساسیت شروع VAD      | `...google.startSensitivity`                                        | (تنظیم‌نشده)                                                                         |
| حساسیت پایان VAD     | `...google.endSensitivity`                                          | (تنظیم‌نشده)                                                                         |
| مدت سکوت              | `...google.silenceDurationMs`                                       | (تنظیم‌نشده)                                                                         |
| مدیریت فعالیت         | `...google.activityHandling`                                        | پیش‌فرض Google، `start-of-activity-interrupts`                                       |
| پوشش نوبت             | `...google.turnCoverage`                                            | پیش‌فرض Google، `only-activity`                                                       |
| غیرفعال‌سازی VAD خودکار | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| ازسرگیری نشست         | `...google.sessionResumption`                                       | `true`                                                                                |
| فشرده‌سازی زمینه      | `...google.contextWindowCompression`                                | `true`                                                                                |
| کلید API              | `...google.apiKey`                                                  | در صورت نبود، از `models.providers.google.apiKey`، `GEMINI_API_KEY`، یا `GOOGLE_API_KEY` استفاده می‌کند |

نمونه پیکربندی بلادرنگ Voice Call:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "only-activity",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Google Live API از صدای دوسویه و فراخوانی تابع روی WebSocket استفاده می‌کند.
OpenClaw صدای پل تلفنی/Meet را با جریان PCM Live API مربوط به Gemini سازگار می‌کند و
فراخوانی‌های ابزار را روی قرارداد صدای بلادرنگ مشترک نگه می‌دارد. `temperature` را
تنظیم‌نشده بگذارید مگر اینکه به تغییرات نمونه‌گیری نیاز داشته باشید؛ OpenClaw مقدارهای غیرمثبت را حذف می‌کند
زیرا Google Live می‌تواند برای `temperature: 0` رونویسی‌ها را بدون صدا برگرداند.
رونویسی Gemini API بدون `languageCodes` فعال می‌شود؛ SDK فعلی Google
راهنماهای کد زبان را در این مسیر API رد می‌کند.
</Note>

<Note>
Control UI Talk از نشست‌های مرورگری Google Live با توکن‌های محدود و یک‌بارمصرف
پشتیبانی می‌کند. ارائه‌دهندگان صدای بلادرنگ فقط‌Backend نیز می‌توانند از طریق انتقال رله عمومی
Gateway اجرا شوند، که اعتبارنامه‌های ارائه‌دهنده را روی Gateway نگه می‌دارد.
</Note>

برای راستی‌آزمایی زنده ویژه نگه‌دارنده، اجرا کنید:
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
این smoke مسیرهای Backend/WebRTC مربوط به OpenAI را نیز پوشش می‌دهد؛ بخش Google همان
شکل توکن محدود Live API را که Control UI Talk استفاده می‌کند صادر می‌کند، نقطه پایانی
WebSocket مرورگر را باز می‌کند، payload راه‌اندازی اولیه را می‌فرستد، و منتظر
`setupComplete` می‌ماند.

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    برای اجراهای مستقیم Gemini API (`api: "google-generative-ai"`)، OpenClaw
    یک دسته `cachedContent` پیکربندی‌شده را به درخواست‌های Gemini منتقل می‌کند.

    - پارامترهای سراسری یا به‌ازای هر مدل را با یکی از این‌ها پیکربندی کنید:
      `cachedContent` یا `cached_content` قدیمی
    - اگر هر دو وجود داشته باشند، `cachedContent` اولویت دارد
    - مقدار نمونه: `cachedContents/prebuilt-context`
    - مصرف cache-hit در Gemini از
      `cachedContentTokenCount` بالادستی به `cacheRead` در OpenClaw نرمال‌سازی می‌شود

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Gemini CLI usage notes">
    هنگام استفاده از ارائه‌دهنده OAuth مربوط به `google-gemini-cli`، OpenClaw به‌صورت پیش‌فرض از خروجی
    `stream-json` در Gemini CLI استفاده می‌کند و مصرف را از payload نهایی
    `stats` نرمال‌سازی می‌کند. overrideهای قدیمی `--output-format json` همچنان از
    parser مربوط به JSON استفاده می‌کنند.

    - متن پاسخ جریانی از رویدادهای `message` دستیار می‌آید.
    - برای خروجی JSON قدیمی، متن پاسخ از فیلد `response` در JSON مربوط به CLI می‌آید.
    - وقتی CLI مقدار `usage` را خالی می‌گذارد، مصرف به `stats` بازمی‌گردد.
    - `stats.cached` به `cacheRead` در OpenClaw نرمال‌سازی می‌شود.
    - اگر `stats.input` وجود نداشته باشد، OpenClaw توکن‌های ورودی را از
      `stats.input_tokens - stats.cached` به دست می‌آورد.

  </Accordion>

  <Accordion title="Environment and daemon setup">
    اگر Gateway به‌صورت daemon اجرا می‌شود (launchd/systemd)، مطمئن شوید `GEMINI_API_KEY`
    برای آن فرایند در دسترس است (برای مثال، در `~/.openclaw/.env` یا از طریق
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="Image generation" href="/fa/tools/image-generation" icon="image">
    پارامترهای مشترک ابزار تصویر و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="Video generation" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدیو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="Music generation" href="/fa/tools/music-generation" icon="music">
    پارامترهای مشترک ابزار موسیقی و انتخاب ارائه‌دهنده.
  </Card>
</CardGroup>
