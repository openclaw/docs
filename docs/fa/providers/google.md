---
read_when:
    - می‌خواهید از مدل‌های Google Gemini با OpenClaw استفاده کنید
    - به کلید API یا جریان احراز هویت OAuth نیاز دارید
summary: راه‌اندازی Google Gemini (کلید API + OAuth، تولید تصویر، درک رسانه، TTS، جستجوی وب)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-04T07:07:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e45627f5d5cd57e858c7590a90435b7fc0e9381509f3312a16fc9e9a4cbd908
    source_path: providers/google.md
    workflow: 16
---

Plugin Google دسترسی به مدل‌های Gemini را از طریق Google AI Studio فراهم می‌کند، به‌همراه
تولید تصویر، درک رسانه (تصویر/صدا/ویدیو)، تبدیل متن به گفتار، و جست‌وجوی وب از طریق
Gemini Grounding.

- ارائه‌دهنده: `google`
- احراز هویت: `GEMINI_API_KEY` یا `GOOGLE_API_KEY`
- API: Google Gemini API
- گزینهٔ زمان اجرا: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  ضمن نگه‌داشتن ارجاع‌های مدل به‌شکل رسمی `google/*`، OAuth متعلق به Gemini CLI را دوباره استفاده می‌کند.

## شروع کار

روش احراز هویت دلخواه خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="کلید API">
    **بهترین گزینه برای:** دسترسی استاندارد به Gemini API از طریق Google AI Studio.

    <Steps>
      <Step title="اجرای راه‌اندازی اولیه">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        یا کلید را مستقیم وارد کنید:

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
      <Step title="تأیید در دسترس بودن مدل">
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
    **بهترین گزینه برای:** استفادهٔ دوباره از ورود موجود Gemini CLI از طریق PKCE OAuth به‌جای یک کلید API جداگانه.

    <Warning>
    ارائه‌دهندهٔ `google-gemini-cli` یک یکپارچه‌سازی غیررسمی است. برخی کاربران
    هنگام استفاده از OAuth به این روش، محدودیت‌های حساب را گزارش کرده‌اند. با مسئولیت خودتان استفاده کنید.
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
      <Step title="تأیید در دسترس بودن مدل">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - مدل پیش‌فرض: `google/gemini-3.1-pro-preview`
    - زمان اجرا: `google-gemini-cli`
    - نام مستعار: `gemini-cli`

    شناسهٔ مدل Gemini API برای Gemini 3.1 Pro برابر `gemini-3.1-pro-preview` است. OpenClaw نام کوتاه‌تر `google/gemini-3.1-pro` را به‌عنوان یک نام مستعار راحت می‌پذیرد و پیش از فراخوانی‌های ارائه‌دهنده آن را عادی‌سازی می‌کند.

    **متغیرهای محیطی:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (یا گونه‌های `GEMINI_CLI_*`.)

    <Note>
    اگر درخواست‌های OAuth در Gemini CLI پس از ورود ناموفق شدند، `GOOGLE_CLOUD_PROJECT` یا
    `GOOGLE_CLOUD_PROJECT_ID` را روی میزبان Gateway تنظیم کنید و دوباره تلاش کنید.
    </Note>

    <Note>
    اگر ورود قبل از شروع جریان مرورگر ناموفق شد، مطمئن شوید دستور محلی `gemini`
    نصب شده و روی `PATH` قرار دارد.
    </Note>

    ارجاع‌های مدل `google-gemini-cli/*` نام‌های مستعار سازگاری قدیمی هستند. پیکربندی‌های
    جدید باید وقتی اجرای محلی Gemini CLI را می‌خواهند، از ارجاع‌های مدل `google/*` به‌همراه زمان اجرای `google-gemini-cli`
    استفاده کنند.

  </Tab>
</Tabs>

## قابلیت‌ها

| قابلیت                 | پشتیبانی‌شده                 |
| ---------------------- | ----------------------------- |
| تکمیل‌های چت           | بله                           |
| تولید تصویر           | بله                           |
| تولید موسیقی          | بله                           |
| تبدیل متن به گفتار    | بله                           |
| صدای بلادرنگ          | بله (Google Live API)         |
| درک تصویر             | بله                           |
| رونویسی صدا           | بله                           |
| درک ویدیو             | بله                           |
| جست‌وجوی وب (Grounding) | بله                         |
| فکر کردن/استدلال      | بله (Gemini 2.5+ / Gemini 3+) |
| مدل‌های Gemma 4        | بله                           |

## جست‌وجوی وب

ارائه‌دهندهٔ جست‌وجوی وب همراه `gemini` از grounding جست‌وجوی Google در Gemini استفاده می‌کند.
یک کلید جست‌وجوی اختصاصی را زیر `plugins.entries.google.config.webSearch` پیکربندی کنید،
یا اجازه دهید پس از `GEMINI_API_KEY`، از `models.providers.google.apiKey` دوباره استفاده کند:

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
برای پراکسی‌های اپراتور یا endpointهای سازگار Gemini API وجود دارد؛ وقتی حذف شود،
جست‌وجوی وب Gemini دوباره از `models.providers.google.baseUrl` استفاده می‌کند. برای رفتار ابزار ویژهٔ ارائه‌دهنده،
[جست‌وجوی Gemini](/fa/tools/gemini-search) را ببینید.

<Tip>
مدل‌های Gemini 3 به‌جای `thinkingBudget` از `thinkingLevel` استفاده می‌کنند. OpenClaw کنترل‌های استدلال
نام‌های مستعار Gemini 3، Gemini 3.1، و `gemini-*-latest` را به
`thinkingLevel` نگاشت می‌کند تا اجراهای پیش‌فرض/کم‌تأخیر مقادیر غیرفعال
`thinkingBudget` را ارسال نکنند.

`/think adaptive` به‌جای انتخاب یک سطح ثابت OpenClaw، معناشناسی فکر کردن پویای Google را حفظ می‌کند. Gemini 3 و Gemini 3.1 یک `thinkingLevel` ثابت را حذف می‌کنند تا
Google بتواند سطح را انتخاب کند؛ Gemini 2.5 sentinel پویای Google یعنی
`thinkingBudget: -1` را ارسال می‌کند.

مدل‌های Gemma 4 (برای مثال `gemma-4-26b-a4b-it`) از حالت فکر کردن پشتیبانی می‌کنند. OpenClaw
برای Gemma 4، `thinkingBudget` را به یک `thinkingLevel` پشتیبانی‌شدهٔ Google بازنویسی می‌کند.
تنظیم فکر کردن روی `off` به‌جای نگاشت به `MINIMAL`، غیرفعال بودن فکر کردن را حفظ می‌کند.
</Tip>

## تولید تصویر

ارائه‌دهندهٔ تولید تصویر همراه `google` به‌صورت پیش‌فرض از
`google/gemini-3.1-flash-image-preview` استفاده می‌کند.

- از `google/gemini-3-pro-image-preview` نیز پشتیبانی می‌کند
- تولید: تا ۴ تصویر در هر درخواست
- حالت ویرایش: فعال، تا ۵ تصویر ورودی
- کنترل‌های هندسه: `size`، `aspectRatio`، و `resolution`

برای استفاده از Google به‌عنوان ارائه‌دهندهٔ پیش‌فرض تصویر:

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

Plugin همراه `google` تولید ویدیو را نیز از طریق ابزار مشترک
`video_generate` ثبت می‌کند.

- مدل ویدیوی پیش‌فرض: `google/veo-3.1-fast-generate-preview`
- حالت‌ها: جریان‌های متن به ویدیو، تصویر به ویدیو، و ارجاع تک‌ویدیو
- از `aspectRatio`، `resolution`، و `audio` پشتیبانی می‌کند
- محدودیت مدت‌زمان فعلی: **۴ تا ۸ ثانیه**

برای استفاده از Google به‌عنوان ارائه‌دهندهٔ پیش‌فرض ویدیو:

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

Plugin همراه `google` تولید موسیقی را نیز از طریق ابزار مشترک
`music_generate` ثبت می‌کند.

- مدل موسیقی پیش‌فرض: `google/lyria-3-clip-preview`
- از `google/lyria-3-pro-preview` نیز پشتیبانی می‌کند
- کنترل‌های prompt: `lyrics` و `instrumental`
- قالب خروجی: به‌صورت پیش‌فرض `mp3`، به‌علاوهٔ `wav` روی `google/lyria-3-pro-preview`
- ورودی‌های مرجع: تا ۱۰ تصویر
- اجراهای متکی به جلسه از طریق جریان مشترک task/status جدا می‌شوند، شامل `action: "status"`

برای استفاده از Google به‌عنوان ارائه‌دهندهٔ پیش‌فرض موسیقی:

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

ارائه‌دهندهٔ گفتار همراه `google` از مسیر TTS در Gemini API با
`gemini-3.1-flash-tts-preview` استفاده می‌کند.

- صدای پیش‌فرض: `Kore`
- احراز هویت: `messages.tts.providers.google.apiKey`، `models.providers.google.apiKey`، `GEMINI_API_KEY`، یا `GOOGLE_API_KEY`
- خروجی: WAV برای پیوست‌های معمول TTS، Opus برای مقصدهای یادداشت صوتی، PCM برای Talk/تلفن
- خروجی یادداشت صوتی: PCM متعلق به Google به‌صورت WAV بسته‌بندی می‌شود و با `ffmpeg` به Opus با نرخ ۴۸ kHz تبدیل می‌شود

برای استفاده از Google به‌عنوان ارائه‌دهندهٔ پیش‌فرض TTS:

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

TTS در Gemini API برای کنترل سبک از prompt زبان طبیعی استفاده می‌کند. `audioProfile` را تنظیم کنید تا یک prompt سبک قابل‌استفادهٔ دوباره پیش از متن گفتاری اضافه شود. وقتی متن prompt شما به یک گویندهٔ نام‌دار اشاره دارد، `speakerName` را تنظیم کنید.

TTS در Gemini API همچنین برچسب‌های صوتی بیانی داخل کروشه را در متن می‌پذیرد،
مانند `[whispers]` یا `[laughs]`. برای دور نگه داشتن برچسب‌ها از پاسخ چت قابل‌مشاهده
درحالی‌که آن‌ها را به TTS ارسال می‌کنید، آن‌ها را داخل یک بلوک `[[tts:text]]...[[/tts:text]]`
قرار دهید:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
یک کلید API در Google Cloud Console که به Gemini API محدود شده باشد، برای این
ارائه‌دهنده معتبر است. این مسیر جداگانهٔ Cloud Text-to-Speech API نیست.
</Note>

## صدای بلادرنگ

Plugin همراه `google` یک ارائه‌دهندهٔ صدای بلادرنگ را ثبت می‌کند که با
Gemini Live API برای پل‌های صوتی backend مانند Voice Call و Google Meet پشتیبانی می‌شود.

| تنظیم                 | مسیر پیکربندی                                                       | پیش‌فرض                                                                              |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| مدل                   | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| صدا                   | `...google.voice`                                                   | `Kore`                                                                                |
| دما                   | `...google.temperature`                                             | (تنظیم‌نشده)                                                                         |
| حساسیت شروع VAD      | `...google.startSensitivity`                                        | (تنظیم‌نشده)                                                                         |
| حساسیت پایان VAD     | `...google.endSensitivity`                                          | (تنظیم‌نشده)                                                                         |
| مدت سکوت              | `...google.silenceDurationMs`                                       | (تنظیم‌نشده)                                                                         |
| مدیریت فعالیت        | `...google.activityHandling`                                        | پیش‌فرض Google، `start-of-activity-interrupts`                                        |
| پوشش نوبت             | `...google.turnCoverage`                                            | پیش‌فرض Google، `only-activity`                                                       |
| غیرفعال‌سازی VAD خودکار | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| ازسرگیری نشست        | `...google.sessionResumption`                                       | `true`                                                                                |
| فشرده‌سازی زمینه     | `...google.contextWindowCompression`                                | `true`                                                                                |
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
Google Live API از صدای دوسویه و فراخوانی تابع از طریق WebSocket استفاده می‌کند.
OpenClaw صدای پل تلفنی/Meet را با جریان PCM Live API در Gemini سازگار می‌کند و
فراخوانی‌های ابزار را روی قرارداد مشترک صدای بلادرنگ نگه می‌دارد. `temperature` را
تنظیم‌نشده بگذارید مگر اینکه به تغییرات نمونه‌گیری نیاز داشته باشید؛ OpenClaw مقدارهای غیرمثبت را حذف می‌کند،
چون Google Live می‌تواند برای `temperature: 0` رونوشت‌ها را بدون صدا برگرداند.
رونویسی Gemini API بدون `languageCodes` فعال می‌شود؛ SDK فعلی Google
راهنمایی‌های کد زبان را در این مسیر API رد می‌کند.
</Note>

<Note>
Control UI Talk از نشست‌های مرورگر Google Live با توکن‌های محدود و یک‌بارمصرف
پشتیبانی می‌کند. ارائه‌دهندگان صدای بلادرنگ فقط-بک‌اند همچنین می‌توانند از طریق
انتقال relay عمومی Gateway اجرا شوند که اعتبارنامه‌های ارائه‌دهنده را روی Gateway نگه می‌دارد.
</Note>

برای راستی‌آزمایی زنده نگه‌دارنده، اجرا کنید:
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
بخش Google همان شکل توکن محدود Live API را صادر می‌کند که Control
UI Talk از آن استفاده می‌کند، نقطه پایانی WebSocket مرورگر را باز می‌کند، محموله راه‌اندازی اولیه را می‌فرستد،
و منتظر `setupComplete` می‌ماند.

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    برای اجراهای مستقیم Gemini API (`api: "google-generative-ai"`)، OpenClaw
    شناسه `cachedContent` پیکربندی‌شده را به درخواست‌های Gemini عبور می‌دهد.

    - پارامترهای سراسری یا مخصوص هر مدل را با
      `cachedContent` یا `cached_content` قدیمی پیکربندی کنید
    - اگر هر دو حاضر باشند، `cachedContent` اولویت دارد
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

  <Accordion title="Gemini CLI JSON usage notes">
    هنگام استفاده از ارائه‌دهنده OAuth به نام `google-gemini-cli`، OpenClaw
    خروجی JSON در CLI را به شکل زیر نرمال‌سازی می‌کند:

    - متن پاسخ از فیلد `response` در JSON خروجی CLI می‌آید.
    - وقتی CLI مقدار `usage` را خالی می‌گذارد، مصرف به `stats` بازمی‌گردد.
    - `stats.cached` به `cacheRead` در OpenClaw نرمال‌سازی می‌شود.
    - اگر `stats.input` موجود نباشد، OpenClaw توکن‌های ورودی را از
      `stats.input_tokens - stats.cached` استخراج می‌کند.

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
    پارامترهای ابزار تصویر مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="Video generation" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار ویدیوی مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="Music generation" href="/fa/tools/music-generation" icon="music">
    پارامترهای ابزار موسیقی مشترک و انتخاب ارائه‌دهنده.
  </Card>
</CardGroup>
