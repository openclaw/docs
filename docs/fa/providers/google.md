---
read_when:
    - می‌خواهید از مدل‌های Google Gemini با OpenClaw استفاده کنید
    - به کلید API یا جریان احراز هویت OAuth نیاز دارید
summary: راه‌اندازی Google Gemini (کلید API + OAuth، تولید تصویر، درک رسانه، TTS، جست‌وجوی وب)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-11T20:42:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 740ff99392d352e8c0f479af6002c52195b0c40e3ef688289d27dec583174847
    source_path: providers/google.md
    workflow: 16
---

Plugin ‏Google از طریق Google AI Studio دسترسی به مدل‌های Gemini را فراهم می‌کند، به‌علاوه
تولید تصویر، درک رسانه (تصویر/صدا/ویدیو)، تبدیل متن به گفتار، و جست‌وجوی وب از طریق
Gemini Grounding.

- ارائه‌دهنده: `google`
- احراز هویت: `GEMINI_API_KEY` یا `GOOGLE_API_KEY`
- API: Google Gemini API
- گزینه زمان اجرا: provider/model ‏`agentRuntime.id: "google-gemini-cli"`
  از OAuth ‏Gemini CLI دوباره استفاده می‌کند و در عین حال ارجاع‌های مدل را به‌صورت canonical یعنی `google/*` نگه می‌دارد.

## شروع به کار

روش احراز هویت دلخواه خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="API key">
    **مناسب برای:** دسترسی استاندارد به Gemini API از طریق Google AI Studio.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        یا کلید را مستقیم ارسال کنید:

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
    **مناسب برای:** استفاده دوباره از ورود موجود Gemini CLI از طریق PKCE OAuth به‌جای یک کلید API جداگانه.

    <Warning>
    ارائه‌دهنده `google-gemini-cli` یک یکپارچه‌سازی غیررسمی است. برخی کاربران
    هنگام استفاده از OAuth به این روش، محدودیت‌های حساب را گزارش کرده‌اند. با مسئولیت خود استفاده کنید.
    </Warning>

    <Steps>
      <Step title="Install the Gemini CLI">
        دستور محلی `gemini` باید در `PATH` در دسترس باشد.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw هم نصب‌های Homebrew و هم نصب‌های global ‏npm را پشتیبانی می‌کند، از جمله
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

    شناسه مدل Gemini API برای Gemini 3.1 Pro برابر `gemini-3.1-pro-preview` است. OpenClaw نام کوتاه‌تر `google/gemini-3.1-pro` را به‌عنوان نام مستعار کاربردی می‌پذیرد و پیش از فراخوانی‌های ارائه‌دهنده آن را normalizes می‌کند.

    **متغیرهای محیطی:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (یا گونه‌های `GEMINI_CLI_*`.)

    <Note>
    اگر درخواست‌های OAuth ‏Gemini CLI پس از ورود شکست خوردند، `GOOGLE_CLOUD_PROJECT` یا
    `GOOGLE_CLOUD_PROJECT_ID` را روی میزبان Gateway تنظیم کنید و دوباره تلاش کنید.
    </Note>

    <Note>
    اگر ورود پیش از شروع جریان مرورگر شکست خورد، مطمئن شوید دستور محلی `gemini`
    نصب شده و در `PATH` قرار دارد.
    </Note>

    ارجاع‌های مدل `google-gemini-cli/*` نام‌های مستعار سازگاری قدیمی هستند. پیکربندی‌های
    جدید باید از ارجاع‌های مدل `google/*` به‌همراه زمان اجرای `google-gemini-cli`
    استفاده کنند وقتی اجرای محلی Gemini CLI را می‌خواهند.

  </Tab>
</Tabs>

## قابلیت‌ها

| قابلیت                 | پشتیبانی‌شده                 |
| ---------------------- | ----------------------------- |
| تکمیل‌های چت           | بله                           |
| تولید تصویر            | بله                           |
| تولید موسیقی           | بله                           |
| تبدیل متن به گفتار     | بله                           |
| صدای بلادرنگ           | بله (Google Live API)         |
| درک تصویر              | بله                           |
| رونویسی صدا            | بله                           |
| درک ویدیو              | بله                           |
| جست‌وجوی وب (Grounding) | بله                           |
| تفکر/استدلال           | بله (Gemini 2.5+ / Gemini 3+) |
| مدل‌های Gemma 4        | بله                           |

## جست‌وجوی وب

ارائه‌دهنده جست‌وجوی وب داخلی `gemini` از grounding جست‌وجوی Google در Gemini استفاده می‌کند.
یک کلید جست‌وجوی اختصاصی را زیر `plugins.entries.google.config.webSearch` پیکربندی کنید،
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

اولویت اعتبارنامه ابتدا `webSearch.apiKey`، سپس `GEMINI_API_KEY`،
و سپس `models.providers.google.apiKey` است. `webSearch.baseUrl` اختیاری است و
برای پروکسی‌های اپراتور یا endpointهای سازگار با Gemini API وجود دارد؛ وقتی حذف شود،
جست‌وجوی وب Gemini از `models.providers.google.baseUrl` دوباره استفاده می‌کند. برای رفتار ابزار ویژه ارائه‌دهنده، [جست‌وجوی Gemini](/fa/tools/gemini-search) را ببینید.

<Tip>
مدل‌های Gemini 3 به‌جای `thinkingBudget` از `thinkingLevel` استفاده می‌کنند. OpenClaw کنترل‌های استدلال alias برای
Gemini 3، Gemini 3.1، و `gemini-*-latest` را به
`thinkingLevel` نگاشت می‌کند تا اجراهای پیش‌فرض/کم‌تاخیر، مقدارهای غیرفعال‌شده
`thinkingBudget` را ارسال نکنند.

`/think adaptive` به‌جای انتخاب یک سطح ثابت OpenClaw، semantics تفکر پویا Google را حفظ می‌کند. Gemini 3 و Gemini 3.1 مقدار ثابت `thinkingLevel` را حذف می‌کنند تا
Google بتواند سطح را انتخاب کند؛ Gemini 2.5 sentinel پویای Google یعنی
`thinkingBudget: -1` را ارسال می‌کند.

مدل‌های Gemma 4 (برای نمونه `gemma-4-26b-a4b-it`) از حالت تفکر پشتیبانی می‌کنند. OpenClaw
`thinkingBudget` را برای Gemma 4 به یک `thinkingLevel` پشتیبانی‌شده Google بازنویسی می‌کند.
تنظیم تفکر روی `off` به‌جای نگاشت به `MINIMAL`، غیرفعال بودن تفکر را حفظ می‌کند.
</Tip>

## تولید تصویر

ارائه‌دهنده تولید تصویر داخلی `google` به‌طور پیش‌فرض از
`google/gemini-3.1-flash-image-preview` استفاده می‌کند.

- همچنین از `google/gemini-3-pro-image-preview` پشتیبانی می‌کند
- تولید: تا 4 تصویر در هر درخواست
- حالت ویرایش: فعال، تا 5 تصویر ورودی
- کنترل‌های هندسه: `size`، `aspectRatio`، و `resolution`

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
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار failover، [تولید تصویر](/fa/tools/image-generation) را ببینید.
</Note>

## تولید ویدیو

Plugin داخلی `google` همچنین تولید ویدیو را از طریق ابزار مشترک
`video_generate` ثبت می‌کند.

- مدل ویدیوی پیش‌فرض: `google/veo-3.1-fast-generate-preview`
- حالت‌ها: متن‌به‌ویدیو، تصویر‌به‌ویدیو، و جریان‌های مرجع تک‌ویدیو
- از `aspectRatio` (`16:9`، `9:16`) و `resolution` (`720P`، `1080P`) پشتیبانی می‌کند؛ خروجی صدا امروزه توسط Veo پشتیبانی نمی‌شود
- مدت‌های پشتیبانی‌شده: **4، 6، یا 8 ثانیه** (مقادیر دیگر به نزدیک‌ترین مقدار مجاز چفت می‌شوند)

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
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار failover، [تولید ویدیو](/fa/tools/video-generation) را ببینید.
</Note>

## تولید موسیقی

Plugin داخلی `google` همچنین تولید موسیقی را از طریق ابزار مشترک
`music_generate` ثبت می‌کند.

- مدل موسیقی پیش‌فرض: `google/lyria-3-clip-preview`
- همچنین از `google/lyria-3-pro-preview` پشتیبانی می‌کند
- کنترل‌های prompt: `lyrics` و `instrumental`
- قالب خروجی: به‌طور پیش‌فرض `mp3`، به‌علاوه `wav` روی `google/lyria-3-pro-preview`
- ورودی‌های مرجع: تا 10 تصویر
- اجراهای متکی به session از طریق جریان مشترک task/status جدا می‌شوند، از جمله `action: "status"`

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
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار failover، [تولید موسیقی](/fa/tools/music-generation) را ببینید.
</Note>

## تبدیل متن به گفتار

ارائه‌دهنده گفتار داخلی `google` از مسیر TTS در Gemini API با
`gemini-3.1-flash-tts-preview` استفاده می‌کند.

- صدای پیش‌فرض: `Kore`
- احراز هویت: `messages.tts.providers.google.apiKey`، `models.providers.google.apiKey`، `GEMINI_API_KEY`، یا `GOOGLE_API_KEY`
- خروجی: WAV برای پیوست‌های معمول TTS، ‏Opus برای مقصدهای یادداشت صوتی، PCM برای Talk/telephony
- خروجی یادداشت صوتی: Google PCM به‌صورت WAV بسته‌بندی می‌شود و با `ffmpeg` به Opus با 48 kHz ترنسکد می‌شود

مسیر batch ‏Gemini TTS در Google، صدای تولیدشده را در پاسخ کامل‌شده
`generateContent` برمی‌گرداند. برای مکالمه‌های گفتاری با کمترین تاخیر، به‌جای batch
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
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS برای کنترل سبک از prompt‌نویسی زبان طبیعی استفاده می‌کند. `audioProfile` را تنظیم کنید تا یک prompt سبک قابل استفاده‌مجدد پیش از متن گفتاری اضافه شود. وقتی متن prompt شما به یک گوینده نام‌دار اشاره می‌کند، `speakerName` را تنظیم کنید.

Gemini API TTS همچنین tagهای صوتی بیانی داخل کروشه را در متن می‌پذیرد،
مانند `[whispers]` یا `[laughs]`. برای اینکه tagها از پاسخ چت قابل مشاهده بیرون بمانند
اما به TTS ارسال شوند، آن‌ها را داخل یک بلوک `[[tts:text]]...[[/tts:text]]`
قرار دهید:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
کلید API مربوط به Google Cloud Console که به Gemini API محدود شده باشد، برای این
ارائه‌دهنده معتبر است. این مسیر جداگانه Cloud Text-to-Speech API نیست.
</Note>

## صدای بلادرنگ

Plugin داخلی `google` یک ارائه‌دهنده صدای بلادرنگ را ثبت می‌کند که برای پل‌های صوتی backend مانند Voice Call و Google Meet، با Gemini Live API پشتیبانی می‌شود.

| تنظیم                  | مسیر پیکربندی                                                      | پیش‌فرض                                                                              |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| مدل                   | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| صدا                   | `...google.voice`                                                   | `Kore`                                                                                |
| دما                   | `...google.temperature`                                             | (تنظیم‌نشده)                                                                         |
| حساسیت شروع VAD       | `...google.startSensitivity`                                        | (تنظیم‌نشده)                                                                         |
| حساسیت پایان VAD      | `...google.endSensitivity`                                          | (تنظیم‌نشده)                                                                         |
| مدت سکوت              | `...google.silenceDurationMs`                                       | (تنظیم‌نشده)                                                                         |
| رسیدگی به فعالیت      | `...google.activityHandling`                                        | پیش‌فرض Google، `start-of-activity-interrupts`                                        |
| پوشش نوبت             | `...google.turnCoverage`                                            | پیش‌فرض Google، `only-activity`                                                       |
| غیرفعال کردن VAD خودکار | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| ازسرگیری نشست         | `...google.sessionResumption`                                       | `true`                                                                                |
| فشرده‌سازی زمینه      | `...google.contextWindowCompression`                                | `true`                                                                                |
| کلید API              | `...google.apiKey`                                                  | به `models.providers.google.apiKey`، `GEMINI_API_KEY`، یا `GOOGLE_API_KEY` بازمی‌گردد |

نمونه پیکربندی بلادرنگ تماس صوتی:

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
                voice: "Kore",
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
Google Live API از صوت دوسویه و فراخوانی تابع روی WebSocket استفاده می‌کند.
OpenClaw صوت پل تلفنی/Meet را با جریان Gemini's PCM Live API سازگار می‌کند و
فراخوانی‌های ابزار را روی قرارداد مشترک صدای بلادرنگ نگه می‌دارد. `temperature`
را تنظیم‌نشده بگذارید مگر اینکه به تغییرات نمونه‌گیری نیاز داشته باشید؛ OpenClaw مقادیر غیرمثبت را حذف می‌کند
زیرا Google Live می‌تواند برای `temperature: 0` رونویسی‌ها را بدون صوت برگرداند.
رونویسی Gemini API بدون `languageCodes` فعال می‌شود؛ SDK فعلی Google
راهنمایی‌های کد زبان را در این مسیر API رد می‌کند.
</Note>

<Note>
Control UI Talk از نشست‌های مرورگر Google Live با توکن‌های یک‌بارمصرف محدود پشتیبانی می‌کند.
ارائه‌دهندگان صدای بلادرنگ فقط‌پشتیبان نیز می‌توانند از طریق انتقال رله عمومی
Gateway اجرا شوند که اعتبارنامه‌های ارائه‌دهنده را روی Gateway نگه می‌دارد.
</Note>

برای راستی‌آزمایی زنده نگه‌دارنده، اجرا کنید:
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
این smoke همچنین مسیرهای پشتیبان OpenAI/WebRTC را پوشش می‌دهد؛ بخش Google همان
شکل توکن محدود Live API را که Control UI Talk استفاده می‌کند صادر می‌کند، نقطه پایانی
WebSocket مرورگر را باز می‌کند، payload راه‌اندازی اولیه را می‌فرستد و منتظر
`setupComplete` می‌ماند.

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="استفاده دوباره مستقیم از کش Gemini">
    برای اجرای مستقیم Gemini API (`api: "google-generative-ai"`)، OpenClaw
    یک شناسه `cachedContent` پیکربندی‌شده را به درخواست‌های Gemini عبور می‌دهد.

    - پارامترهای سراسری یا مختص هر مدل را با یکی از
      `cachedContent` یا `cached_content` قدیمی پیکربندی کنید
    - اگر هر دو وجود داشته باشند، `cachedContent` اولویت دارد
    - مقدار نمونه: `cachedContents/prebuilt-context`
    - مصرف hit کش Gemini از
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

  <Accordion title="یادداشت‌های استفاده JSON برای Gemini CLI">
    هنگام استفاده از ارائه‌دهنده OAuth مربوط به `google-gemini-cli`، OpenClaw
    خروجی JSON مربوط به CLI را به شکل زیر نرمال‌سازی می‌کند:

    - متن پاسخ از فیلد `response` در JSON مربوط به CLI می‌آید.
    - وقتی CLI مقدار `usage` را خالی می‌گذارد، مصرف به `stats` بازمی‌گردد.
    - `stats.cached` به `cacheRead` در OpenClaw نرمال‌سازی می‌شود.
    - اگر `stats.input` وجود نداشته باشد، OpenClaw توکن‌های ورودی را از
      `stats.input_tokens - stats.cached` استخراج می‌کند.

  </Accordion>

  <Accordion title="محیط و راه‌اندازی daemon">
    اگر Gateway به‌صورت daemon اجرا می‌شود (launchd/systemd)، مطمئن شوید `GEMINI_API_KEY`
    برای آن فرایند در دسترس است (برای مثال، در `~/.openclaw/.env` یا از طریق
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پارامترهای ابزار تصویر مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید ویدیو" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار ویدیوی مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید موسیقی" href="/fa/tools/music-generation" icon="music">
    پارامترهای ابزار موسیقی مشترک و انتخاب ارائه‌دهنده.
  </Card>
</CardGroup>
