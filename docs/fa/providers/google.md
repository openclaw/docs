---
read_when:
    - می‌خواهید از مدل‌های Google Gemini با OpenClaw استفاده کنید
    - به کلید API یا فرایند احراز هویت OAuth نیاز دارید
summary: راه‌اندازی Google Gemini (کلید API و OAuth، تولید تصویر، درک رسانه، TTS، جست‌وجوی وب)
title: گوگل (Gemini)
x-i18n:
    generated_at: "2026-07-12T10:43:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 423f9b048a705815e886690fa13f5b02f7e67707195b7b461f6b4765528a4756
    source_path: providers/google.md
    workflow: 16
---

Plugin گوگل دسترسی به مدل‌های Gemini را از طریق Google AI Studio فراهم می‌کند و همچنین شامل تولید تصویر، درک رسانه (تصویر/صدا/ویدئو)، تبدیل متن به گفتار و جست‌وجوی وب از طریق Gemini Grounding است.

- ارائه‌دهنده: `google`
- احراز هویت: `GEMINI_API_KEY` یا `GOOGLE_API_KEY`
- API: Google Gemini API
- گزینه زمان اجرا: `agentRuntime.id: "google-gemini-cli"` از OAuth مربوط به Gemini CLI دوباره استفاده می‌کند، درحالی‌که ارجاع‌های مدل را به‌شکل متعارف `google/*` نگه می‌دارد.

## شروع به کار

روش احراز هویت دلخواهتان را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="کلید API">
    **مناسب برای:** دسترسی استاندارد به Gemini API از طریق Google AI Studio.

    <Steps>
      <Step title="اجرای فرایند راه‌اندازی اولیه">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        یا کلید را مستقیماً ارائه دهید:

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
      <Step title="بررسی دردسترس‌بودن مدل">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    هر دو `GEMINI_API_KEY` و `GOOGLE_API_KEY` پذیرفته می‌شوند. از هرکدام که از قبل پیکربندی کرده‌اید استفاده کنید.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **مناسب برای:** استفاده مجدد از ورود موجود Gemini CLI از طریق PKCE OAuth به‌جای یک کلید API جداگانه.

    <Warning>
    ارائه‌دهنده `google-gemini-cli` یک یکپارچه‌سازی غیررسمی است. برخی کاربران
    هنگام استفاده از OAuth به این روش، محدودیت‌هایی را برای حساب گزارش کرده‌اند. با مسئولیت خودتان استفاده کنید.
    </Warning>

    <Steps>
      <Step title="نصب Gemini CLI">
        فرمان محلی `gemini` باید در `PATH` در دسترس باشد.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw هم نصب‌های Homebrew و هم نصب‌های سراسری npm، از جمله
        چیدمان‌های رایج Windows/npm را پشتیبانی می‌کند.
      </Step>
      <Step title="ورود از طریق OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="بررسی دردسترس‌بودن مدل">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - مدل پیش‌فرض: `google/gemini-3.1-pro-preview`
    - زمان اجرا: `google-gemini-cli`
    - نام مستعار: `gemini-cli`

    شناسه مدل Gemini API برای Gemini 3.1 Pro برابر با `gemini-3.1-pro-preview` است. OpenClaw برای سهولت، شکل کوتاه‌تر `google/gemini-3.1-pro` را به‌عنوان نام مستعار می‌پذیرد و پیش از فراخوانی ارائه‌دهنده آن را عادی‌سازی می‌کند.

    **متغیرهای محیطی:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    اگر درخواست‌های OAuth مربوط به Gemini CLI پس از ورود ناموفق بودند، `GOOGLE_CLOUD_PROJECT` یا
    `GOOGLE_CLOUD_PROJECT_ID` را روی میزبان Gateway تنظیم کنید و دوباره تلاش کنید.
    </Note>

    <Note>
    اگر ورود پیش از آغاز جریان مرورگر ناموفق بود، مطمئن شوید فرمان محلی `gemini`
    نصب شده و در `PATH` قرار دارد.
    </Note>

    ارجاع‌های مدل `google-gemini-cli/*` نام‌های مستعار سازگاری قدیمی هستند. پیکربندی‌های
    جدید برای اجرای محلی Gemini CLI باید از ارجاع‌های مدل `google/*` به‌همراه زمان اجرای
    `google-gemini-cli` استفاده کنند.

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` در ۲۰۲۶-۰۳-۰۹ بازنشسته شد؛ به‌جای آن از `google/gemini-3.1-pro-preview` استفاده کنید. اجرای دوباره راه‌اندازی کلید Gemini API (`openclaw onboard --auth-choice gemini-api-key` یا `openclaw models auth login --provider google`) مقدار پیش‌فرض پیکربندی‌شده و منسوخ را با مدل فعلی بازنویسی می‌کند.
</Note>

## قابلیت‌ها

| قابلیت                  | پشتیبانی                       |
| ---------------------- | ----------------------------- |
| تکمیل‌های گفتگو         | بله                           |
| تولید تصویر             | بله                           |
| تولید موسیقی            | بله                           |
| تبدیل متن به گفتار      | بله                           |
| صدای بلادرنگ            | بله (Google Live API)         |
| درک تصویر               | بله                           |
| رونویسی صدا             | بله                           |
| درک ویدئو               | بله                           |
| جست‌وجوی وب (Grounding) | بله                           |
| تفکر/استدلال            | بله (Gemini 2.5+ / Gemini 3+) |
| مدل‌های Gemma 4         | بله                           |

## جست‌وجوی وب

ارائه‌دهنده جست‌وجوی وب همراه `gemini` از اتصال به Google Search در Gemini استفاده می‌کند.
یک کلید اختصاصی جست‌وجو را در `plugins.entries.google.config.webSearch` پیکربندی کنید،
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

ترتیب تقدم اعتبارنامه‌ها ابتدا `webSearch.apiKey` اختصاصی، سپس `GEMINI_API_KEY`
و بعد `models.providers.google.apiKey` است. `webSearch.baseUrl` اختیاری است و
برای پراکسی‌های اپراتور یا نقاط پایانی سازگار با Gemini API در نظر گرفته شده است؛ در صورت حذف،
جست‌وجوی وب Gemini از `models.providers.google.baseUrl` دوباره استفاده می‌کند. برای رفتار ابزار ویژه ارائه‌دهنده، به
[جست‌وجوی Gemini](/fa/tools/gemini-search) مراجعه کنید.

<Tip>
مدل‌های Gemini 3 به‌جای `thinkingBudget` از `thinkingLevel` استفاده می‌کنند. OpenClaw کنترل‌های
استدلالی Gemini 3، Gemini 3.1 و نام مستعار `gemini-*-latest` را به
`thinkingLevel` نگاشت می‌کند تا اجراهای پیش‌فرض/کم‌تأخیر، مقادیر غیرفعال
`thinkingBudget` را ارسال نکنند.

`/think adaptive` به‌جای انتخاب یک سطح ثابت OpenClaw، معناشناسی تفکر پویای گوگل را حفظ می‌کند.
Gemini 3 و Gemini 3.1 یک `thinkingLevel` ثابت را حذف می‌کنند تا
گوگل بتواند سطح را انتخاب کند؛ Gemini 2.5 نشانگر پویای گوگل یعنی
`thinkingBudget: -1` را ارسال می‌کند.

مدل‌های Gemma 4 (برای مثال `gemma-4-26b-a4b-it`) از حالت تفکر پشتیبانی می‌کنند. OpenClaw
مقدار `thinkingBudget` را برای Gemma 4 به یک `thinkingLevel` پشتیبانی‌شده گوگل
بازنویسی می‌کند. تنظیم تفکر روی `off` به‌جای نگاشت به
`MINIMAL`، غیرفعال‌بودن تفکر را حفظ می‌کند.

Gemini 2.5 Pro فقط در حالت تفکر کار می‌کند و مقدار صریح
`thinkingBudget: 0` را رد می‌کند؛ OpenClaw به‌جای ارسال آن، این مقدار را از درخواست‌های Gemini 2.5 Pro
حذف می‌کند.
</Tip>

## تولید تصویر

ارائه‌دهنده همراه تولید تصویر `google` به‌طور پیش‌فرض از
`google/gemini-3.1-flash-image-preview` استفاده می‌کند.

- از `google/gemini-3-pro-image-preview` نیز پشتیبانی می‌کند
- تولید: حداکثر ۴ تصویر در هر درخواست
- حالت ویرایش: فعال، با حداکثر ۵ تصویر ورودی
- کنترل‌های هندسی: `size`، `aspectRatio` و `resolution`

برای استفاده از گوگل به‌عنوان ارائه‌دهنده پیش‌فرض تصویر:

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
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار انتقال در زمان خرابی، به [تولید تصویر](/fa/tools/image-generation) مراجعه کنید.
</Note>

## تولید ویدئو

Plugin همراه `google` همچنین تولید ویدئو را از طریق ابزار مشترک
`video_generate` ثبت می‌کند.

- مدل پیش‌فرض ویدئو: `google/veo-3.1-fast-generate-preview`
- حالت‌ها: متن به ویدئو، تصویر به ویدئو و جریان‌های ارجاعی تک‌ویدئویی
- از `aspectRatio` (`16:9`، `9:16`) و `resolution` (`720P`، `1080P`) پشتیبانی می‌کند؛ خروجی صدا در حال حاضر توسط Veo پشتیبانی نمی‌شود
- مدت‌زمان‌های پشتیبانی‌شده: **۴، ۶ یا ۸ ثانیه** (مقادیر دیگر به نزدیک‌ترین مقدار مجاز گرد می‌شوند)

برای استفاده از گوگل به‌عنوان ارائه‌دهنده پیش‌فرض ویدئو:

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
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار انتقال در زمان خرابی، به [تولید ویدئو](/fa/tools/video-generation) مراجعه کنید.
</Note>

## تولید موسیقی

Plugin همراه `google` همچنین تولید موسیقی را از طریق ابزار مشترک
`music_generate` ثبت می‌کند.

- مدل پیش‌فرض موسیقی: `google/lyria-3-clip-preview`
- از `google/lyria-3-pro-preview` نیز پشتیبانی می‌کند
- کنترل‌های فرمان: `lyrics` و `instrumental`
- قالب خروجی: به‌طور پیش‌فرض `mp3`، به‌علاوه `wav` در `google/lyria-3-pro-preview`
- ورودی‌های مرجع: حداکثر ۱۰ تصویر
- اجراهای متکی به نشست از طریق جریان مشترک وظیفه/وضعیت، از جمله `action: "status"`، جدا می‌شوند

برای استفاده از گوگل به‌عنوان ارائه‌دهنده پیش‌فرض موسیقی:

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
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار انتقال در زمان خرابی، به [تولید موسیقی](/fa/tools/music-generation) مراجعه کنید.
</Note>

## تبدیل متن به گفتار

ارائه‌دهنده گفتار همراه `google` از مسیر تبدیل متن به گفتار Gemini API با
`gemini-3.1-flash-tts-preview` استفاده می‌کند.

- صدای پیش‌فرض: `Kore`
- احراز هویت: `messages.tts.providers.google.apiKey`، `models.providers.google.apiKey`، `GEMINI_API_KEY` یا `GOOGLE_API_KEY`
- خروجی: WAV برای پیوست‌های معمول تبدیل متن به گفتار، Opus برای مقصدهای پیام صوتی و PCM برای Talk/تلفن
- خروجی پیام صوتی: PCM گوگل در قالب WAV بسته‌بندی و با `ffmpeg` به Opus با نرخ ۴۸ کیلوهرتز تبدیل می‌شود

مسیر دسته‌ای تبدیل متن به گفتار Gemini در گوگل، صدای تولیدشده را در پاسخ تکمیل‌شده
`generateContent` برمی‌گرداند. برای مکالمات گفتاری با کمترین تأخیر، به‌جای تبدیل متن به گفتار
دسته‌ای از ارائه‌دهنده صدای بلادرنگ گوگل که مبتنی بر Gemini Live API است
استفاده کنید.

برای استفاده از گوگل به‌عنوان ارائه‌دهنده پیش‌فرض تبدیل متن به گفتار:

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

تبدیل متن به گفتار Gemini API برای کنترل سبک از فرمان‌های زبان طبیعی استفاده می‌کند. `audioProfile`
را تنظیم کنید تا یک فرمان سبک قابل‌استفاده مجدد پیش از متن گفتاری افزوده شود. هنگامی که متن فرمانتان
به یک گوینده نام‌گذاری‌شده اشاره می‌کند، `speakerName` را تنظیم کنید.

تبدیل متن به گفتار Gemini API همچنین برچسب‌های صوتی بیانی درون کروشه را در متن می‌پذیرد،
مانند `[whispers]` یا `[laughs]`. برای اینکه برچسب‌ها در پاسخ قابل‌مشاهده گفتگو نمایش داده نشوند
اما به تبدیل متن به گفتار ارسال شوند، آن‌ها را درون یک بلوک `[[tts:text]]...[[/tts:text]]`
قرار دهید:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
یک کلید API مربوط به Google Cloud Console که به Gemini API محدود شده باشد، برای این
ارائه‌دهنده معتبر است. این مسیر با مسیر جداگانه Cloud Text-to-Speech API یکسان نیست.
</Note>

## صدای بلادرنگ

Plugin همراه `google` یک ارائه‌دهنده صدای بلادرنگ مبتنی بر
Gemini Live API را برای پل‌های صوتی پشتی مانند Voice Call و Google Meet ثبت می‌کند.

| تنظیم                         | مسیر پیکربندی                                                        | پیش‌فرض                                                                                         |
| ----------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| مدل                           | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                                  |
| صدا                           | `...google.voice`                                                   | `Kore`                                                                                           |
| دما                           | `...google.temperature`                                             | (تنظیم‌نشده)                                                                                     |
| حساسیت شروع VAD               | `...google.startSensitivity`                                        | (تنظیم‌نشده)                                                                                     |
| حساسیت پایان VAD              | `...google.endSensitivity`                                          | (تنظیم‌نشده)                                                                                     |
| مدت سکوت                      | `...google.silenceDurationMs`                                       | (تنظیم‌نشده)                                                                                     |
| مدیریت فعالیت                 | `...google.activityHandling`                                        | پیش‌فرض Google، `start-of-activity-interrupts`                                                    |
| پوشش نوبت                     | `...google.turnCoverage`                                            | پیش‌فرض Google، `audio-activity-and-all-video`                                                    |
| غیرفعال‌کردن VAD خودکار       | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                                          |
| ازسرگیری نشست                 | `...google.sessionResumption`                                       | `true`                                                                                           |
| فشرده‌سازی بافت               | `...google.contextWindowCompression`                                | `true`                                                                                           |
| کلید API                      | `...google.apiKey`                                                  | در صورت نبود، از `models.providers.google.apiKey`، `GEMINI_API_KEY` یا `GOOGLE_API_KEY` استفاده می‌کند |

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
                model: "gemini-3.1-flash-live-preview",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "audio-activity-and-all-video",
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
Google Live API از صدای دوسویه و فراخوانی تابع از طریق وب‌سوکت استفاده می‌کند.
OpenClaw صدای پل تلفنی/Meet را با جریان PCM مربوط به Live API در Gemini سازگار می‌کند و
فراخوانی ابزارها را در قرارداد مشترک صدای بلادرنگ نگه می‌دارد. مگر آنکه به تغییرات نمونه‌برداری
نیاز داشته باشید، `temperature` را تنظیم‌نشده باقی بگذارید؛ OpenClaw مقادیر نامثبت را حذف می‌کند،
زیرا Google Live ممکن است برای `temperature: 0` رونوشت را بدون صدا برگرداند.
رونویسی Gemini API بدون `languageCodes` فعال می‌شود؛ SDK فعلی Google
راهنماهای کد زبان را در این مسیر API رد می‌کند.
</Note>

<Note>
Gemini 3.1 Live متن مکالمه‌ای را از طریق ورودی بلادرنگ می‌پذیرد و از
فراخوانی ترتیبی تابع استفاده می‌کند. OpenClaw برای این مدل، فیلدهای قدیمی‌تر `NON_BLOCKING`،
زمان‌بندی پاسخ تابع و گفت‌وگوی عاطفی را حذف می‌کند. `thinkingLevel` را ترجیح دهید؛
مقادیر مثبت پیکربندی‌شده برای `thinkingBudget` به نزدیک‌ترین سطح پشتیبانی‌شده
نگاشت می‌شوند، درحالی‌که `-1` مقدار پیش‌فرض Google را حفظ می‌کند. به
[مقایسه قابلیت‌های Gemini Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities)
مراجعه کنید.
</Note>

<Note>
گفت‌وگوی Control UI از نشست‌های مرورگری Google Live با توکن‌های محدود و یک‌بارمصرف
پشتیبانی می‌کند. ارائه‌دهندگان صدای بلادرنگِ صرفاً سمت پشتیبان نیز می‌توانند از طریق
انتقال رله عمومی Gateway اجرا شوند که اعتبارنامه‌های ارائه‌دهنده را روی Gateway نگه می‌دارد.
</Note>

برای راستی‌آزمایی زنده توسط نگه‌دارندگان، دستور
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
را اجرا کنید.
این آزمون دود همچنین مسیرهای سمت پشتیبان/WebRTC مربوط به OpenAI را پوشش می‌دهد؛ بخش Google همان
ساختار توکن محدود Live API را که گفت‌وگوی Control UI استفاده می‌کند صادر می‌کند، نقطه پایانی
وب‌سوکت مرورگر را باز می‌کند، بار اولیه راه‌اندازی را می‌فرستد و منتظر
`setupComplete` می‌ماند.

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="استفاده مجدد مستقیم از حافظه نهان Gemini">
    برای اجراهای مستقیم Gemini API (`api: "google-generative-ai"`)، OpenClaw
    یک شناسه پیکربندی‌شده `cachedContent` را به درخواست‌های Gemini منتقل می‌کند.

    - پارامترهای سراسری یا ویژه هر مدل را با یکی از
      `cachedContent` یا `cached_content` قدیمی پیکربندی کنید
    - پارامترهای دامنه مشخص‌تر (سطح مدل نسبت به سراسری) همیشه اولویت دارند.
      در یک دامنه یکسان، اگر هر دو کلید تنظیم شده باشند، `cached_content` اولویت دارد.
      برای جلوگیری از نتایج غیرمنتظره، در هر دامنه فقط از یک کلید استفاده کنید.
    - مقدار نمونه: `cachedContents/prebuilt-context`
    - میزان استفاده از تطبیق حافظه نهان Gemini، از مقدار بالادستی
      `cachedContentTokenCount` به `cacheRead` در OpenClaw نرمال‌سازی می‌شود

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

  <Accordion title="نکات استفاده از Gemini CLI">
    هنگام استفاده از ارائه‌دهنده OAuth با نام `google-gemini-cli`، OpenClaw به‌طور پیش‌فرض
    از خروجی `stream-json` در Gemini CLI استفاده می‌کند و میزان استفاده را از بار نهایی
    `stats` نرمال‌سازی می‌کند. بازنویسی‌های قدیمی `--output-format json` همچنان از
    تجزیه‌کننده JSON استفاده می‌کنند.

    - متن پاسخ جریانی از رویدادهای `message` دستیار دریافت می‌شود.
    - برای خروجی قدیمی JSON، متن پاسخ از فیلد `response` در JSON مربوط به CLI دریافت می‌شود.
    - اگر CLI مقدار `usage` را خالی بگذارد، میزان استفاده از `stats` دریافت می‌شود.
    - `stats.cached` به `cacheRead` در OpenClaw نرمال‌سازی می‌شود.
    - اگر `stats.input` وجود نداشته باشد، OpenClaw توکن‌های ورودی را از
      `stats.input_tokens - stats.cached` محاسبه می‌کند.

  </Accordion>

  <Accordion title="راه‌اندازی محیط و سرویس پس‌زمینه">
    اگر Gateway به‌صورت سرویس پس‌زمینه (launchd/systemd) اجرا می‌شود، مطمئن شوید
    `GEMINI_API_KEY` برای آن فرایند در دسترس است (برای مثال در `~/.openclaw/.env` یا از طریق
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پارامترهای مشترک ابزار تصویر و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدئو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید موسیقی" href="/fa/tools/music-generation" icon="music">
    پارامترهای مشترک ابزار موسیقی و انتخاب ارائه‌دهنده.
  </Card>
</CardGroup>
