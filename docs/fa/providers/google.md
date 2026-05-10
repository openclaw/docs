---
read_when:
    - می‌خواهید از مدل‌های Google Gemini با OpenClaw استفاده کنید
    - به کلید API یا جریان احراز هویت OAuth نیاز دارید
summary: راه‌اندازی Google Gemini (کلید API + OAuth، تولید تصویر، درک رسانه، TTS، جستجوی وب)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-10T20:03:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd61383edad3192577d37c9a706470828d59edd5a187ef4f3c30985afaf46167
    source_path: providers/google.md
    workflow: 16
---

Plugin گوگل دسترسی به مدل‌های Gemini را از طریق Google AI Studio فراهم می‌کند، به‌علاوه
تولید تصویر، درک رسانه (تصویر/صدا/ویدئو)، تبدیل متن به گفتار، و جست‌وجوی وب از طریق
Gemini Grounding.

- ارائه‌دهنده: `google`
- احراز هویت: `GEMINI_API_KEY` یا `GOOGLE_API_KEY`
- API: Google Gemini API
- گزینه زمان اجرا: provider/model `agentRuntime.id: "google-gemini-cli"`
  از OAuth مربوط به Gemini CLI دوباره استفاده می‌کند، درحالی‌که ارجاع‌های مدل را به‌صورت متعارف `google/*` نگه می‌دارد.

## شروع به کار

روش احراز هویت ترجیحی خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="API key">
    **بهترین برای:** دسترسی استاندارد به Gemini API از طریق Google AI Studio.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        یا کلید را مستقیما وارد کنید:

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
    **بهترین برای:** استفاده دوباره از ورود موجود Gemini CLI از طریق PKCE OAuth، به‌جای یک کلید API جداگانه.

    <Warning>
    ارائه‌دهنده `google-gemini-cli` یک یکپارچه‌سازی غیررسمی است. برخی کاربران
    هنگام استفاده از OAuth به این روش، محدودیت‌های حساب را گزارش کرده‌اند. با مسئولیت خودتان استفاده کنید.
    </Warning>

    <Steps>
      <Step title="Install the Gemini CLI">
        فرمان محلی `gemini` باید در `PATH` در دسترس باشد.

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

    شناسه مدل Gemini API برای Gemini 3.1 Pro برابر `gemini-3.1-pro-preview` است. OpenClaw شکل کوتاه‌تر `google/gemini-3.1-pro` را به‌عنوان یک نام مستعار برای راحتی می‌پذیرد و آن را پیش از فراخوانی‌های ارائه‌دهنده نرمال‌سازی می‌کند.

    **متغیرهای محیطی:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (یا گونه‌های `GEMINI_CLI_*`.)

    <Note>
    اگر درخواست‌های Gemini CLI OAuth پس از ورود شکست خوردند، `GOOGLE_CLOUD_PROJECT` یا
    `GOOGLE_CLOUD_PROJECT_ID` را روی میزبان gateway تنظیم کنید و دوباره تلاش کنید.
    </Note>

    <Note>
    اگر ورود پیش از شروع جریان مرورگر شکست خورد، مطمئن شوید فرمان محلی `gemini`
    نصب شده و در `PATH` قرار دارد.
    </Note>

    ارجاع‌های مدل `google-gemini-cli/*` نام‌های مستعار سازگاری قدیمی هستند. پیکربندی‌های جدید
    وقتی اجرای محلی Gemini CLI را می‌خواهند، باید از ارجاع‌های مدل `google/*` به‌همراه زمان اجرای `google-gemini-cli`
    استفاده کنند.

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
| درک ویدئو              | بله                           |
| جست‌وجوی وب (Grounding) | بله                           |
| تفکر/استدلال           | بله (Gemini 2.5+ / Gemini 3+) |
| مدل‌های Gemma 4        | بله                           |

## جست‌وجوی وب

ارائه‌دهنده جست‌وجوی وب بسته‌بندی‌شده `gemini` از Gemini Google Search grounding استفاده می‌کند.
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

اولویت اعتبارنامه‌ها ابتدا `webSearch.apiKey`، سپس `GEMINI_API_KEY`،
و بعد `models.providers.google.apiKey` است. `webSearch.baseUrl` اختیاری است و
برای پراکسی‌های اپراتور یا نقطه‌های پایانی سازگار با Gemini API وجود دارد؛ وقتی حذف شود،
جست‌وجوی وب Gemini از `models.providers.google.baseUrl` دوباره استفاده می‌کند. برای رفتار ابزار ویژه ارائه‌دهنده،
[جست‌وجوی Gemini](/fa/tools/gemini-search) را ببینید.

<Tip>
مدل‌های Gemini 3 به‌جای `thinkingBudget` از `thinkingLevel` استفاده می‌کنند. OpenClaw کنترل‌های استدلال مربوط به
Gemini 3، Gemini 3.1، و نام مستعار `gemini-*-latest` را به
`thinkingLevel` نگاشت می‌کند تا اجراهای پیش‌فرض/کم‌تاخیر، مقدارهای غیرفعال‌شده
`thinkingBudget` را ارسال نکنند.

`/think adaptive` به‌جای انتخاب یک سطح ثابت OpenClaw، معناشناسی تفکر پویای Google را حفظ می‌کند.
Gemini 3 و Gemini 3.1 یک `thinkingLevel` ثابت را حذف می‌کنند تا
Google بتواند سطح را انتخاب کند؛ Gemini 2.5 نشانگر پویای Google یعنی
`thinkingBudget: -1` را ارسال می‌کند.

مدل‌های Gemma 4 (برای مثال `gemma-4-26b-a4b-it`) از حالت تفکر پشتیبانی می‌کنند. OpenClaw
`thinkingBudget` را برای Gemma 4 به یک `thinkingLevel` پشتیبانی‌شده Google بازنویسی می‌کند.
تنظیم تفکر روی `off` به‌جای نگاشت به `MINIMAL`، غیرفعال بودن تفکر را حفظ می‌کند.
</Tip>

## تولید تصویر

ارائه‌دهنده تولید تصویر بسته‌بندی‌شده `google` به‌طور پیش‌فرض از
`google/gemini-3.1-flash-image-preview` استفاده می‌کند.

- از `google/gemini-3-pro-image-preview` نیز پشتیبانی می‌کند
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

## تولید ویدئو

Plugin بسته‌بندی‌شده `google` همچنین تولید ویدئو را از طریق ابزار مشترک
`video_generate` ثبت می‌کند.

- مدل ویدئوی پیش‌فرض: `google/veo-3.1-fast-generate-preview`
- حالت‌ها: جریان‌های متن‌به‌ویدئو، تصویر‌به‌ویدئو، و ارجاع تک‌ویدئویی
- از `aspectRatio`، `resolution`، و `audio` پشتیبانی می‌کند
- محدودیت مدت فعلی: **4 تا 8 ثانیه**

برای استفاده از Google به‌عنوان ارائه‌دهنده پیش‌فرض ویدئو:

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
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار failover، [تولید ویدئو](/fa/tools/video-generation) را ببینید.
</Note>

## تولید موسیقی

Plugin بسته‌بندی‌شده `google` همچنین تولید موسیقی را از طریق ابزار مشترک
`music_generate` ثبت می‌کند.

- مدل موسیقی پیش‌فرض: `google/lyria-3-clip-preview`
- از `google/lyria-3-pro-preview` نیز پشتیبانی می‌کند
- کنترل‌های پرامپت: `lyrics` و `instrumental`
- قالب خروجی: به‌طور پیش‌فرض `mp3`، به‌علاوه `wav` روی `google/lyria-3-pro-preview`
- ورودی‌های ارجاع: تا 10 تصویر
- اجراهای متکی بر نشست از طریق جریان مشترک task/status جدا می‌شوند، از جمله `action: "status"`

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

ارائه‌دهنده گفتار بسته‌بندی‌شده `google` از مسیر Gemini API TTS با
`gemini-3.1-flash-tts-preview` استفاده می‌کند.

- صدای پیش‌فرض: `Kore`
- احراز هویت: `messages.tts.providers.google.apiKey`، `models.providers.google.apiKey`، `GEMINI_API_KEY`، یا `GOOGLE_API_KEY`
- خروجی: WAV برای پیوست‌های معمول TTS، Opus برای مقصدهای پیام صوتی، PCM برای Talk/telephony
- خروجی پیام صوتی: Google PCM به‌صورت WAV بسته‌بندی می‌شود و با `ffmpeg` به Opus با 48 kHz تبدیل کدگذاری می‌شود

مسیر Gemini TTS دسته‌ای Google صدای تولیدشده را در پاسخ کامل‌شده
`generateContent` برمی‌گرداند. برای مکالمه‌های گفتاری با کمترین تاخیر، به‌جای TTS دسته‌ای
از ارائه‌دهنده صدای بلادرنگ Google که پشتوانه‌اش Gemini Live API است استفاده کنید.

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

Gemini API TTS برای کنترل سبک از پرامپت‌نویسی زبان طبیعی استفاده می‌کند. `audioProfile` را تنظیم کنید
تا یک پرامپت سبک قابل استفاده دوباره پیش از متن گفتاری اضافه شود. وقتی متن پرامپت شما به یک گوینده نام‌دار اشاره می‌کند،
`speakerName` را تنظیم کنید.

Gemini API TTS همچنین برچسب‌های صوتی بیانی در کروشه را در متن می‌پذیرد،
مانند `[whispers]` یا `[laughs]`. برای اینکه برچسب‌ها در پاسخ قابل مشاهده چت نمایش داده نشوند
اما به TTS ارسال شوند، آن‌ها را داخل یک بلوک `[[tts:text]]...[[/tts:text]]`
قرار دهید:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
یک کلید API از Google Cloud Console که به Gemini API محدود شده باشد برای این
ارائه‌دهنده معتبر است. این مسیر، مسیر جداگانه Cloud Text-to-Speech API نیست.
</Note>

## صدای بلادرنگ

Plugin بسته‌بندی‌شده `google` یک ارائه‌دهنده صدای بلادرنگ را نیز ثبت می‌کند که پشتوانه‌اش
Gemini Live API برای پل‌های صوتی بک‌اند مانند Voice Call و Google Meet است.

| تنظیم                 | مسیر پیکربندی                                                       | پیش‌فرض                                                                              |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| مدل                   | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| صدا                   | `...google.voice`                                                   | `Kore`                                                                                |
| دما                   | `...google.temperature`                                             | (تنظیم‌نشده)                                                                         |
| حساسیت شروع VAD       | `...google.startSensitivity`                                        | (تنظیم‌نشده)                                                                         |
| حساسیت پایان VAD      | `...google.endSensitivity`                                          | (تنظیم‌نشده)                                                                         |
| مدت سکوت              | `...google.silenceDurationMs`                                       | (تنظیم‌نشده)                                                                         |
| مدیریت فعالیت         | `...google.activityHandling`                                        | پیش‌فرض Google، `start-of-activity-interrupts`                                        |
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
Google Live API از صدای دوسویه و فراخوانی تابع از طریق WebSocket استفاده می‌کند.
OpenClaw صدای پل تلفنی/Meet را با جریان PCM Live API متعلق به Gemini سازگار می‌کند و
فراخوانی‌های ابزار را روی قرارداد مشترک صدای بلادرنگ نگه می‌دارد. `temperature` را
تنظیم‌نشده بگذارید، مگر اینکه به تغییرات نمونه‌گیری نیاز داشته باشید؛ OpenClaw مقادیر
نامثبت را حذف می‌کند، چون Google Live می‌تواند برای `temperature: 0` رونوشت‌ها را بدون صدا برگرداند.
رونویسی Gemini API بدون `languageCodes` فعال می‌شود؛ SDK فعلی Google
راهنمایی‌های کد زبان را در این مسیر API رد می‌کند.
</Note>

<Note>
Control UI Talk از نشست‌های مرورگر Google Live با توکن‌های یک‌بارمصرف محدود پشتیبانی می‌کند.
ارائه‌دهندگان صدای بلادرنگ فقط بک‌اند نیز می‌توانند از طریق انتقال رله عمومی
Gateway اجرا شوند، که اعتبارنامه‌های ارائه‌دهنده را روی Gateway نگه می‌دارد.
</Note>

برای راستی‌آزمایی زنده نگه‌دارنده، اجرا کنید:
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
این آزمون دود همچنین مسیرهای بک‌اند/WebRTC مربوط به OpenAI را پوشش می‌دهد؛ شاخه Google همان
شکل توکن محدود Live API را صادر می‌کند که Control UI Talk استفاده می‌کند، نقطه پایانی
WebSocket مرورگر را باز می‌کند، بار اولیه راه‌اندازی را می‌فرستد، و منتظر
`setupComplete` می‌ماند.

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="استفاده مجدد مستقیم از کش Gemini">
    برای اجراهای مستقیم Gemini API (`api: "google-generative-ai"`)، OpenClaw
    هندل پیکربندی‌شده `cachedContent` را به درخواست‌های Gemini پاس می‌دهد.

    - پارامترهای سراسری یا مختص مدل را با یکی از این‌ها پیکربندی کنید:
      `cachedContent` یا `cached_content` قدیمی
    - اگر هر دو وجود داشته باشند، `cachedContent` اولویت دارد
    - مقدار نمونه: `cachedContents/prebuilt-context`
    - مصرف برخورد کش Gemini از مقدار بالادستی `cachedContentTokenCount` به
      `cacheRead` در OpenClaw نرمال‌سازی می‌شود

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

  <Accordion title="نکات مصرف JSON در Gemini CLI">
    هنگام استفاده از ارائه‌دهنده OAuth متعلق به `google-gemini-cli`، OpenClaw
    خروجی JSON مربوط به CLI را به این شکل نرمال‌سازی می‌کند:

    - متن پاسخ از فیلد `response` در JSON خروجی CLI می‌آید.
    - وقتی CLI مقدار `usage` را خالی بگذارد، مصرف به `stats` بازمی‌گردد.
    - `stats.cached` به `cacheRead` در OpenClaw نرمال‌سازی می‌شود.
    - اگر `stats.input` وجود نداشته باشد، OpenClaw توکن‌های ورودی را از
      `stats.input_tokens - stats.cached` به‌دست می‌آورد.

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
    پارامترهای مشترک ابزار تصویر و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید ویدیو" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدیو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید موسیقی" href="/fa/tools/music-generation" icon="music">
    پارامترهای مشترک ابزار موسیقی و انتخاب ارائه‌دهنده.
  </Card>
</CardGroup>
