---
read_when:
    - می‌خواهید از مدل‌های Google Gemini با OpenClaw استفاده کنید
    - برای این کار به کلید API یا جریان احراز هویت OAuth نیاز دارید.
summary: راه‌اندازی Google Gemini (کلید API + OAuth، تولید تصویر، درک رسانه، TTS، جست‌وجوی وب)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-29T23:25:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: ea4b53dcea10fef67920da3baca4c85325ee4d4da780fbf708b67bc618e064a6
    source_path: providers/google.md
    workflow: 16
---

Plugin Google از طریق Google AI Studio دسترسی به مدل‌های Gemini را فراهم می‌کند، به‌علاوه
تولید تصویر، درک رسانه (تصویر/صوت/ویدیو)، تبدیل متن به گفتار، و جست‌وجوی وب از طریق
Gemini Grounding.

- ارائه‌دهنده: `google`
- احراز هویت: `GEMINI_API_KEY` یا `GOOGLE_API_KEY`
- API: Google Gemini API
- گزینه زمان اجرا: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  از OAuth مربوط به Gemini CLI دوباره استفاده می‌کند، در حالی که ارجاع‌های مدل را به‌صورت استاندارد `google/*` نگه می‌دارد.

## شروع به کار

روش احراز هویت ترجیحی خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="API key">
    **بهترین گزینه برای:** دسترسی استاندارد به Gemini API از طریق Google AI Studio.

    <Steps>
      <Step title="Run onboarding">
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
    **بهترین گزینه برای:** استفاده دوباره از ورود موجود Gemini CLI از طریق PKCE OAuth به‌جای یک کلید API جداگانه.

    <Warning>
    ارائه‌دهنده `google-gemini-cli` یک یکپارچه‌سازی غیررسمی است. برخی کاربران
    هنگام استفاده از OAuth به این روش، محدودیت‌های حساب را گزارش کرده‌اند. با مسئولیت خود استفاده کنید.
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

    شناسه مدل Gemini API برای Gemini 3.1 Pro برابر `gemini-3.1-pro-preview` است. OpenClaw نام کوتاه‌تر `google/gemini-3.1-pro` را به‌عنوان نام مستعار راحت می‌پذیرد و پیش از فراخوانی ارائه‌دهنده آن را نرمال‌سازی می‌کند.

    **متغیرهای محیطی:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (یا گونه‌های `GEMINI_CLI_*`.)

    <Note>
    اگر درخواست‌های OAuth مربوط به Gemini CLI پس از ورود ناموفق شدند، `GOOGLE_CLOUD_PROJECT` یا
    `GOOGLE_CLOUD_PROJECT_ID` را روی میزبان Gateway تنظیم کنید و دوباره تلاش کنید.
    </Note>

    <Note>
    اگر ورود پیش از شروع جریان مرورگر ناموفق شد، مطمئن شوید فرمان محلی `gemini`
    نصب شده و در `PATH` قرار دارد.
    </Note>

    ارجاع‌های مدل `google-gemini-cli/*` نام‌های مستعار سازگاری قدیمی هستند. پیکربندی‌های
    جدید وقتی اجرای محلی Gemini CLI را می‌خواهند، باید از ارجاع‌های مدل `google/*` به‌همراه زمان اجرای `google-gemini-cli`
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
| درک تصویر              | بله                           |
| رونویسی صوت            | بله                           |
| درک ویدیو              | بله                           |
| جست‌وجوی وب (Grounding) | بله                           |
| تفکر/استدلال           | بله (Gemini 2.5+ / Gemini 3+) |
| مدل‌های Gemma 4        | بله                           |

<Tip>
مدل‌های Gemini 3 به‌جای `thinkingBudget` از `thinkingLevel` استفاده می‌کنند. OpenClaw کنترل‌های
استدلال نام‌های مستعار Gemini 3، Gemini 3.1، و `gemini-*-latest` را به
`thinkingLevel` نگاشت می‌کند تا اجراهای پیش‌فرض/کم‌تاخیر مقدارهای غیرفعال
`thinkingBudget` را ارسال نکنند.

`/think adaptive` به‌جای انتخاب یک سطح ثابت OpenClaw، معناشناسی تفکر پویا در Google را حفظ می‌کند.
Gemini 3 و Gemini 3.1 یک `thinkingLevel` ثابت را حذف می‌کنند تا
Google بتواند سطح را انتخاب کند؛ Gemini 2.5 sentinel پویای Google یعنی
`thinkingBudget: -1` را ارسال می‌کند.

مدل‌های Gemma 4 (برای مثال `gemma-4-26b-a4b-it`) از حالت تفکر پشتیبانی می‌کنند. OpenClaw
`thinkingBudget` را برای Gemma 4 به یک `thinkingLevel` پشتیبانی‌شده Google بازنویسی می‌کند.
تنظیم تفکر روی `off` غیرفعال بودن تفکر را حفظ می‌کند، به‌جای اینکه آن را به
`MINIMAL` نگاشت کند.
</Tip>

## تولید تصویر

ارائه‌دهنده تولید تصویر داخلی `google` به‌صورت پیش‌فرض از
`google/gemini-3.1-flash-image-preview` استفاده می‌کند.

- همچنین از `google/gemini-3-pro-image-preview` پشتیبانی می‌کند
- تولید: تا ۴ تصویر در هر درخواست
- حالت ویرایش: فعال، تا ۵ تصویر ورودی
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
- حالت‌ها: جریان‌های متن‌به‌ویدیو، تصویر‌به‌ویدیو، و مرجع تک‌ویدیویی
- از `aspectRatio`، `resolution`، و `audio` پشتیبانی می‌کند
- محدودیت مدت‌زمان فعلی: **۴ تا ۸ ثانیه**

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
- کنترل‌های پرامپت: `lyrics` و `instrumental`
- قالب خروجی: به‌صورت پیش‌فرض `mp3`، به‌علاوه `wav` در `google/lyria-3-pro-preview`
- ورودی‌های مرجع: تا ۱۰ تصویر
- اجراهای مبتنی بر نشست از طریق جریان مشترک وظیفه/وضعیت، شامل `action: "status"`، جدا می‌شوند

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

ارائه‌دهنده گفتار داخلی `google` از مسیر TTS مربوط به Gemini API با
`gemini-3.1-flash-tts-preview` استفاده می‌کند.

- صدای پیش‌فرض: `Kore`
- احراز هویت: `messages.tts.providers.google.apiKey`، `models.providers.google.apiKey`، `GEMINI_API_KEY`، یا `GOOGLE_API_KEY`
- خروجی: WAV برای پیوست‌های معمول TTS، Opus برای مقصدهای پیام صوتی، PCM برای Talk/تلفنی
- خروجی پیام صوتی: PCM مربوط به Google به‌صورت WAV بسته‌بندی می‌شود و با `ffmpeg` به Opus با نرخ ۴۸ kHz تبدیل می‌شود

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

TTS مربوط به Gemini API برای کنترل سبک از پرامپت‌نویسی زبان طبیعی استفاده می‌کند. مقدار
`audioProfile` را تنظیم کنید تا یک پرامپت سبک قابل‌استفاده مجدد پیش از متن گفتاری اضافه شود. وقتی متن پرامپت شما به یک گوینده نام‌دار اشاره دارد،
`speakerName` را تنظیم کنید.

TTS مربوط به Gemini API همچنین برچسب‌های صوتی بیانی داخل کروشه را در متن می‌پذیرد،
مانند `[whispers]` یا `[laughs]`. برای بیرون نگه داشتن برچسب‌ها از پاسخ چت قابل‌مشاهده
در حالی که آن‌ها را به TTS می‌فرستید، آن‌ها را داخل یک بلوک `[[tts:text]]...[[/tts:text]]`
قرار دهید:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
یک کلید API در Google Cloud Console که به Gemini API محدود شده باشد برای این
ارائه‌دهنده معتبر است. این مسیر جداگانه Cloud Text-to-Speech API نیست.
</Note>

## صدای بلادرنگ

Plugin داخلی `google` یک ارائه‌دهنده صدای بلادرنگ ثبت می‌کند که مبتنی بر
Gemini Live API برای پل‌های صوتی بک‌اند مانند Voice Call و Google Meet است.

| تنظیمات               | مسیر پیکربندی                                                       | پیش‌فرض                                                                               |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| مدل                   | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| صدا                   | `...google.voice`                                                   | `Kore`                                                                                |
| دما                   | `...google.temperature`                                             | (تنظیم‌نشده)                                                                          |
| حساسیت شروع VAD       | `...google.startSensitivity`                                        | (تنظیم‌نشده)                                                                          |
| حساسیت پایان VAD      | `...google.endSensitivity`                                          | (تنظیم‌نشده)                                                                          |
| مدت سکوت              | `...google.silenceDurationMs`                                       | (تنظیم‌نشده)                                                                          |
| مدیریت فعالیت         | `...google.activityHandling`                                        | پیش‌فرض Google، `start-of-activity-interrupts`                                        |
| پوشش نوبت             | `...google.turnCoverage`                                            | پیش‌فرض Google، `only-activity`                                                       |
| غیرفعال کردن VAD خودکار | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| کلید API              | `...google.apiKey`                                                  | به `models.providers.google.apiKey`، `GEMINI_API_KEY`، یا `GOOGLE_API_KEY` برمی‌گردد |

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
Google Live API از صدای دوسویه و فراخوانی تابع روی WebSocket استفاده می‌کند.
OpenClaw صدای پل تلفنی/Meet را با جریان PCM Live API در Gemini تطبیق می‌دهد و
فراخوانی‌های ابزار را روی قرارداد مشترک صدای بلادرنگ نگه می‌دارد. `temperature` را
تنظیم‌نشده بگذارید مگر اینکه به تغییرات نمونه‌برداری نیاز داشته باشید؛ OpenClaw مقدارهای غیرمثبت را حذف می‌کند
زیرا Google Live می‌تواند برای `temperature: 0` رونویسی‌هایی بدون صدا برگرداند.
رونویسی Gemini API بدون `languageCodes` فعال می‌شود؛ SDK فعلی Google
راهنمایی‌های کد زبان را در این مسیر API رد می‌کند.
</Note>

<Note>
Control UI Talk از نشست‌های مرورگر Google Live با توکن‌های محدودشده و یک‌بارمصرف
پشتیبانی می‌کند. ارائه‌دهندگان صدای بلادرنگِ فقط بک‌اند نیز می‌توانند از طریق انتقال رله عمومی
Gateway اجرا شوند، که اعتبارنامه‌های ارائه‌دهنده را روی Gateway نگه می‌دارد.
</Note>

برای راستی‌آزمایی زنده توسط نگه‌دارنده، اجرا کنید:
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
بخش Google همان شکل توکن محدودشده Live API را که Control
UI Talk استفاده می‌کند صادر می‌کند، نقطه پایانی WebSocket مرورگر را باز می‌کند، بار اولیه راه‌اندازی را می‌فرستد،
و منتظر `setupComplete` می‌ماند.

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    برای اجرای مستقیم Gemini API (`api: "google-generative-ai"`)، OpenClaw
    هندل پیکربندی‌شده `cachedContent` را به درخواست‌های Gemini منتقل می‌کند.

    - پارامترهای سراسری یا مخصوص هر مدل را با یکی از
      `cachedContent` یا `cached_content` قدیمی پیکربندی کنید
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

  <Accordion title="Gemini CLI JSON usage notes">
    هنگام استفاده از ارائه‌دهنده OAuth `google-gemini-cli`، OpenClaw
    خروجی JSON مربوط به CLI را به این صورت نرمال‌سازی می‌کند:

    - متن پاسخ از فیلد `response` در JSON مربوط به CLI می‌آید.
    - وقتی CLI مقدار `usage` را خالی می‌گذارد، مصرف به `stats` برمی‌گردد.
    - `stats.cached` به `cacheRead` در OpenClaw نرمال‌سازی می‌شود.
    - اگر `stats.input` وجود نداشته باشد، OpenClaw توکن‌های ورودی را از
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
    پارامترهای مشترک ابزار تصویر و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="Video generation" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدئو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="Music generation" href="/fa/tools/music-generation" icon="music">
    پارامترهای مشترک ابزار موسیقی و انتخاب ارائه‌دهنده.
  </Card>
</CardGroup>
