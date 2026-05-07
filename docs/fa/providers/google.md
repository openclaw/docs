---
read_when:
    - می‌خواهید از مدل‌های Google Gemini با OpenClaw استفاده کنید
    - به کلید API یا جریان احراز هویت OAuth نیاز دارید
summary: راه‌اندازی Google Gemini (کلید API + OAuth، تولید تصویر، درک رسانه، TTS، جستجوی وب)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-07T13:30:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9344307c0f20bf09d330ed82b8ffbd4dfa2592c869eb049c46191caa3ca141e
    source_path: providers/google.md
    workflow: 16
---

Plugin Google دسترسی به مدل‌های Gemini را از طریق Google AI Studio فراهم می‌کند، به‌همراه
تولید تصویر، درک رسانه (تصویر/صدا/ویدئو)، تبدیل متن به گفتار، و جست‌وجوی وب از طریق
Gemini Grounding.

- ارائه‌دهنده: `google`
- احراز هویت: `GEMINI_API_KEY` یا `GOOGLE_API_KEY`
- API: Google Gemini API
- گزینه زمان اجرا: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  از OAuth مربوط به Gemini CLI دوباره استفاده می‌کند، در حالی که ارجاع‌های مدل را به‌صورت استاندارد `google/*` نگه می‌دارد.

## شروع به کار

روش احراز هویت دلخواه خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="کلید API">
    **بهترین گزینه برای:** دسترسی استاندارد به Gemini API از طریق Google AI Studio.

    <Steps>
      <Step title="اجرای راه‌اندازی اولیه">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        یا کلید را مستقیما ارسال کنید:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="تنظیم یک مدل پیش‌فرض">
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
      <Step title="بررسی در دسترس بودن مدل">
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
    **بهترین گزینه برای:** استفاده دوباره از ورود Gemini CLI موجود از طریق PKCE OAuth به‌جای یک کلید API جداگانه.

    <Warning>
    ارائه‌دهنده `google-gemini-cli` یک یکپارچه‌سازی غیررسمی است. برخی کاربران
    هنگام استفاده از OAuth به این روش، محدودیت‌های حساب گزارش کرده‌اند. با مسئولیت خودتان استفاده کنید.
    </Warning>

    <Steps>
      <Step title="نصب Gemini CLI">
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
      <Step title="ورود از طریق OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="بررسی در دسترس بودن مدل">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - مدل پیش‌فرض: `google/gemini-3.1-pro-preview`
    - زمان اجرا: `google-gemini-cli`
    - نام مستعار: `gemini-cli`

    شناسه مدل Gemini API برای Gemini 3.1 Pro برابر با `gemini-3.1-pro-preview` است. OpenClaw نام کوتاه‌تر `google/gemini-3.1-pro` را به‌عنوان نام مستعار کاربردی می‌پذیرد و آن را پیش از فراخوانی‌های ارائه‌دهنده عادی‌سازی می‌کند.

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
    جدید باید از ارجاع‌های مدل `google/*` به‌همراه زمان اجرای `google-gemini-cli`
    استفاده کنند، وقتی اجرای محلی Gemini CLI را می‌خواهند.

  </Tab>
</Tabs>

## قابلیت‌ها

| قابلیت                 | پشتیبانی‌شده                 |
| ---------------------- | ----------------------------- |
| تکمیل‌های گفت‌وگو      | بله                           |
| تولید تصویر            | بله                           |
| تولید موسیقی           | بله                           |
| تبدیل متن به گفتار     | بله                           |
| صدای بلادرنگ           | بله (Google Live API)         |
| درک تصویر              | بله                           |
| رونویسی صدا            | بله                           |
| درک ویدئو              | بله                           |
| جست‌وجوی وب (Grounding) | بله                           |
| تفکر/استدلال           | بله (Gemini 2.5+ / Gemini 3+) |
| مدل‌های Gemma 4        | بله                           |

## جست‌وجوی وب

ارائه‌دهنده جست‌وجوی وب همراه `gemini` از grounding جست‌وجوی Google در Gemini استفاده می‌کند.
یک کلید جست‌وجوی اختصاصی را در `plugins.entries.google.config.webSearch` پیکربندی کنید،
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

ترتیب اولویت اعتبارنامه‌ها به این صورت است: `webSearch.apiKey` اختصاصی، سپس `GEMINI_API_KEY`،
سپس `models.providers.google.apiKey`. مقدار `webSearch.baseUrl` اختیاری است و
برای پراکسی‌های اپراتور یا نقطه‌های پایانی سازگار Gemini API وجود دارد؛ وقتی حذف شود،
جست‌وجوی وب Gemini از `models.providers.google.baseUrl` دوباره استفاده می‌کند. برای رفتار ابزار ویژه این ارائه‌دهنده، به
[جست‌وجوی Gemini](/fa/tools/gemini-search) مراجعه کنید.

<Tip>
مدل‌های Gemini 3 از `thinkingLevel` به‌جای `thinkingBudget` استفاده می‌کنند. OpenClaw کنترل‌های استدلال
Gemini 3، Gemini 3.1، و نام مستعار `gemini-*-latest` را به
`thinkingLevel` نگاشت می‌کند تا اجراهای پیش‌فرض/کم‌تاخیر، مقادیر غیرفعال‌شده
`thinkingBudget` را ارسال نکنند.

`/think adaptive` به‌جای انتخاب یک سطح ثابت OpenClaw، معناشناسی تفکر پویای Google را حفظ می‌کند.
Gemini 3 و Gemini 3.1 یک `thinkingLevel` ثابت را حذف می‌کنند تا
Google بتواند سطح را انتخاب کند؛ Gemini 2.5 sentinel پویای Google را با
`thinkingBudget: -1` ارسال می‌کند.

مدل‌های Gemma 4 (برای مثال `gemma-4-26b-a4b-it`) از حالت تفکر پشتیبانی می‌کنند. OpenClaw
`thinkingBudget` را برای Gemma 4 به یک `thinkingLevel` پشتیبانی‌شده Google بازنویسی می‌کند.
تنظیم تفکر روی `off` به‌جای نگاشت به `MINIMAL`، غیرفعال بودن تفکر را حفظ می‌کند.
</Tip>

## تولید تصویر

ارائه‌دهنده تولید تصویر همراه `google` به‌صورت پیش‌فرض از
`google/gemini-3.1-flash-image-preview` استفاده می‌کند.

- همچنین از `google/gemini-3-pro-image-preview` پشتیبانی می‌کند
- تولید: تا 4 تصویر در هر درخواست
- حالت ویرایش: فعال، تا 5 تصویر ورودی
- کنترل‌های هندسه: `size`، `aspectRatio`، و `resolution`

برای استفاده از Google به‌عنوان ارائه‌دهنده تصویر پیش‌فرض:

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
برای پارامترهای ابزار مشترک، انتخاب ارائه‌دهنده، و رفتار failover، به [تولید تصویر](/fa/tools/image-generation) مراجعه کنید.
</Note>

## تولید ویدئو

Plugin همراه `google` همچنین تولید ویدئو را از طریق ابزار مشترک
`video_generate` ثبت می‌کند.

- مدل ویدئوی پیش‌فرض: `google/veo-3.1-fast-generate-preview`
- حالت‌ها: متن به ویدئو، تصویر به ویدئو، و جریان‌های مرجع تک‌ویدئویی
- از `aspectRatio`، `resolution`، و `audio` پشتیبانی می‌کند
- محدودسازی مدت فعلی: **4 تا 8 ثانیه**

برای استفاده از Google به‌عنوان ارائه‌دهنده ویدئوی پیش‌فرض:

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
برای پارامترهای ابزار مشترک، انتخاب ارائه‌دهنده، و رفتار failover، به [تولید ویدئو](/fa/tools/video-generation) مراجعه کنید.
</Note>

## تولید موسیقی

Plugin همراه `google` همچنین تولید موسیقی را از طریق ابزار مشترک
`music_generate` ثبت می‌کند.

- مدل موسیقی پیش‌فرض: `google/lyria-3-clip-preview`
- همچنین از `google/lyria-3-pro-preview` پشتیبانی می‌کند
- کنترل‌های prompt: `lyrics` و `instrumental`
- قالب خروجی: به‌صورت پیش‌فرض `mp3`، به‌همراه `wav` در `google/lyria-3-pro-preview`
- ورودی‌های مرجع: تا 10 تصویر
- اجراهای مبتنی بر نشست از طریق جریان مشترک وظیفه/وضعیت جدا می‌شوند، از جمله `action: "status"`

برای استفاده از Google به‌عنوان ارائه‌دهنده موسیقی پیش‌فرض:

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
برای پارامترهای ابزار مشترک، انتخاب ارائه‌دهنده، و رفتار failover، به [تولید موسیقی](/fa/tools/music-generation) مراجعه کنید.
</Note>

## تبدیل متن به گفتار

ارائه‌دهنده گفتار همراه `google` از مسیر TTS مربوط به Gemini API با
`gemini-3.1-flash-tts-preview` استفاده می‌کند.

- صدای پیش‌فرض: `Kore`
- احراز هویت: `messages.tts.providers.google.apiKey`، `models.providers.google.apiKey`، `GEMINI_API_KEY`، یا `GOOGLE_API_KEY`
- خروجی: WAV برای پیوست‌های معمول TTS، Opus برای مقصدهای voice-note، PCM برای Talk/تلفن
- خروجی voice-note: Google PCM به‌صورت WAV بسته‌بندی می‌شود و با `ffmpeg` به Opus با 48 kHz تبدیل می‌شود

مسیر دسته‌ای Gemini TTS در Google، صدای تولیدشده را در پاسخ تکمیل‌شده
`generateContent` برمی‌گرداند. برای مکالمه‌های گفتاری با کمترین تاخیر، به‌جای TTS دسته‌ای،
از ارائه‌دهنده صدای بلادرنگ Google که بر Gemini Live API متکی است استفاده کنید.

برای استفاده از Google به‌عنوان ارائه‌دهنده TTS پیش‌فرض:

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

Gemini API TTS برای کنترل سبک از prompt زبان طبیعی استفاده می‌کند. `audioProfile` را تنظیم کنید
تا یک prompt سبک قابل استفاده مجدد را پیش از متن گفتاری اضافه کند. وقتی متن prompt شما به یک گوینده نام‌دار اشاره می‌کند،
`speakerName` را تنظیم کنید.

Gemini API TTS همچنین برچسب‌های صوتی بیانی داخل کروشه را در متن می‌پذیرد،
مانند `[whispers]` یا `[laughs]`. برای اینکه برچسب‌ها در پاسخ قابل مشاهده گفت‌وگو دیده نشوند
اما به TTS ارسال شوند، آن‌ها را داخل یک بلوک `[[tts:text]]...[[/tts:text]]`
قرار دهید:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
یک کلید API مربوط به Google Cloud Console که به Gemini API محدود شده باشد، برای این
ارائه‌دهنده معتبر است. این مسیر جداگانه Cloud Text-to-Speech API نیست.
</Note>

## صدای بلادرنگ

Plugin همراه `google` یک ارائه‌دهنده صدای بلادرنگ را ثبت می‌کند که بر
Gemini Live API برای پل‌های صوتی بک‌اند مانند Voice Call و Google Meet متکی است.

| تنظیم               | مسیر پیکربندی                                                         | پیش‌فرض                                                                               |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| مدل                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| صدا                 | `...google.voice`                                                   | `Kore`                                                                                |
| دما           | `...google.temperature`                                             | (تنظیم نشده)                                                                               |
| حساسیت شروع VAD | `...google.startSensitivity`                                        | (تنظیم نشده)                                                                               |
| حساسیت پایان VAD   | `...google.endSensitivity`                                          | (تنظیم نشده)                                                                               |
| مدت سکوت      | `...google.silenceDurationMs`                                       | (تنظیم نشده)                                                                               |
| مدیریت فعالیت     | `...google.activityHandling`                                        | پیش‌فرض Google، `start-of-activity-interrupts`                                        |
| پوشش نوبت         | `...google.turnCoverage`                                            | پیش‌فرض Google، `only-activity`                                                       |
| غیرفعال کردن VAD خودکار      | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| ازسرگیری نشست    | `...google.sessionResumption`                                       | `true`                                                                                |
| فشرده‌سازی زمینه   | `...google.contextWindowCompression`                                | `true`                                                                                |
| کلید API               | `...google.apiKey`                                                  | به `models.providers.google.apiKey`، `GEMINI_API_KEY`، یا `GOOGLE_API_KEY` برمی‌گردد |

نمونه پیکربندی بی‌درنگ Voice Call:

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
Google Live API از صدای دوسویه و فراخوانی تابع از طریق WebSocket استفاده می‌کند.
OpenClaw صدای پل تلفنی/Meet را با جریان PCM Live API در Gemini سازگار می‌کند و
فراخوانی‌های ابزار را روی قرارداد مشترک صدای بی‌درنگ نگه می‌دارد. `temperature` را
تنظیم‌نشده بگذارید، مگر اینکه به تغییرات نمونه‌برداری نیاز داشته باشید؛ OpenClaw مقادیر غیرمثبت را حذف می‌کند
زیرا Google Live می‌تواند برای `temperature: 0` رونوشت‌ها را بدون صدا برگرداند.
رونویسی Gemini API بدون `languageCodes` فعال می‌شود؛ SDK کنونی Google
راهنمایی‌های کد زبان را در این مسیر API رد می‌کند.
</Note>

<Note>
Control UI Talk از نشست‌های مرورگر Google Live با توکن‌های محدود یک‌بارمصرف پشتیبانی می‌کند.
ارائه‌دهندگان صدای بی‌درنگ فقطِ بک‌اند نیز می‌توانند از طریق انتقال رله عمومی
Gateway اجرا شوند، که اعتبارنامه‌های ارائه‌دهنده را روی Gateway نگه می‌دارد.
</Note>

برای راستی‌آزمایی زنده نگه‌دارنده، اجرا کنید:
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
شاخه Google همان شکل توکن محدود Live API را که Control
UI Talk استفاده می‌کند صادر می‌کند، نقطه پایانی WebSocket مرورگر را باز می‌کند، محموله راه‌اندازی اولیه را می‌فرستد،
و منتظر `setupComplete` می‌ماند.

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="استفاده دوباره مستقیم از کش Gemini">
    برای اجراهای مستقیم Gemini API (`api: "google-generative-ai"`)، OpenClaw
    دسته `cachedContent` پیکربندی‌شده را به درخواست‌های Gemini عبور می‌دهد.

    - پارامترهای هر مدل یا سراسری را با یکی از
      `cachedContent` یا `cached_content` قدیمی پیکربندی کنید
    - اگر هر دو وجود داشته باشند، `cachedContent` برنده می‌شود
    - مقدار نمونه: `cachedContents/prebuilt-context`
    - استفاده از برخورد کش Gemini از
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

  <Accordion title="یادداشت‌های استفاده JSON از Gemini CLI">
    هنگام استفاده از ارائه‌دهنده OAuth `google-gemini-cli`، OpenClaw
    خروجی JSON مربوط به CLI را به شکل زیر نرمال‌سازی می‌کند:

    - متن پاسخ از فیلد `response` در JSON مربوط به CLI می‌آید.
    - وقتی CLI مقدار `usage` را خالی می‌گذارد، استفاده به `stats` برمی‌گردد.
    - `stats.cached` به `cacheRead` در OpenClaw نرمال‌سازی می‌شود.
    - اگر `stats.input` وجود نداشته باشد، OpenClaw توکن‌های ورودی را از
      `stats.input_tokens - stats.cached` مشتق می‌کند.

  </Accordion>

  <Accordion title="تنظیم محیط و daemon">
    اگر Gateway به‌صورت daemon (launchd/systemd) اجرا می‌شود، مطمئن شوید `GEMINI_API_KEY`
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
    پارامترهای مشترک ابزار تصویر و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید ویدیو" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدیو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید موسیقی" href="/fa/tools/music-generation" icon="music">
    پارامترهای مشترک ابزار موسیقی و انتخاب ارائه‌دهنده.
  </Card>
</CardGroup>
