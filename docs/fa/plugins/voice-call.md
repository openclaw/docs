---
read_when:
    - می‌خواهید از OpenClaw یک تماس صوتی خروجی برقرار کنید
    - در حال پیکربندی یا توسعهٔ Plugin تماس صوتی هستید
    - به صدای بلادرنگ یا رونویسی جریانی در تماس‌های تلفنی نیاز دارید
sidebarTitle: Voice call
summary: برقراری تماس‌های صوتی خروجی و پذیرش تماس‌های صوتی ورودی از طریق Twilio، Telnyx یا Plivo، با قابلیت اختیاری صدای بلادرنگ و رونویسی جریانی
title: Plugin تماس صوتی
x-i18n:
    generated_at: "2026-05-06T09:36:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba168696481ef0cc3c55ac8fd8be4382cb36889a12ed6d881fe6b29a2b0a54c
    source_path: plugins/voice-call.md
    workflow: 16
---

تماس‌های صوتی برای OpenClaw از طریق یک Plugin. از اعلان‌های خروجی،
گفت‌وگوهای چندمرحله‌ای، صدای بلادرنگ تمام‌دوطرفه، رونویسی جریانی
و تماس‌های ورودی با سیاست‌های فهرست مجاز پشتیبانی می‌کند.

**ارائه‌دهندگان فعلی:** `twilio` (Programmable Voice + Media Streams)،
`telnyx` (Call Control v2)، `plivo` (Voice API + XML transfer + GetInput
speech)، `mock` (توسعه/بدون شبکه).

<Note>
Plugin تماس صوتی **داخل فرایند Gateway** اجرا می‌شود. اگر از یک
Gateway راه‌دور استفاده می‌کنید، Plugin را روی دستگاهی که
Gateway را اجرا می‌کند نصب و پیکربندی کنید، سپس Gateway را برای بارگذاری آن
بازراه‌اندازی کنید.
</Note>

## شروع سریع

<Steps>
  <Step title="نصب Plugin">
    <Tabs>
      <Tab title="از npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="از یک پوشه محلی (توسعه)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    برای دنبال کردن تگ انتشار رسمی فعلی، از بسته بدون نسخه استفاده کنید.
    فقط زمانی یک نسخه دقیق را پین کنید که به نصب بازتولیدپذیر نیاز دارید.

    پس از آن Gateway را بازراه‌اندازی کنید تا Plugin بارگذاری شود.

  </Step>
  <Step title="پیکربندی ارائه‌دهنده و webhook">
    پیکربندی را زیر `plugins.entries.voice-call.config` تنظیم کنید (برای شکل کامل،
    [پیکربندی](#configuration) را در پایین ببینید). حداقل موارد لازم:
    `provider`، اعتبارنامه‌های ارائه‌دهنده، `fromNumber` و یک نشانی webhook که به‌صورت عمومی
    قابل دسترسی باشد.
  </Step>
  <Step title="راستی‌آزمایی راه‌اندازی">
    ```bash
    openclaw voicecall setup
    ```

    خروجی پیش‌فرض در گزارش‌های گفتگو و ترمینال‌ها خوانا است. این دستور
    فعال بودن Plugin، اعتبارنامه‌های ارائه‌دهنده، در دسترس بودن webhook و اینکه
    فقط یک حالت صوتی (`streaming` یا `realtime`) فعال باشد را بررسی می‌کند. برای
    اسکریپت‌ها از `--json` استفاده کنید.

  </Step>
  <Step title="آزمون دود">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    هر دو به‌صورت پیش‌فرض اجرای خشک هستند. برای اینکه واقعاً یک تماس اعلان خروجی کوتاه
    برقرار شود، `--yes` را اضافه کنید:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
برای Twilio، Telnyx و Plivo، راه‌اندازی باید به یک **URL عمومی webhook** منتهی شود.
اگر `publicUrl`، URL تونل، URL Tailscale یا جایگزین serve
به loopback یا فضای شبکه خصوصی منتهی شود، راه‌اندازی به‌جای
شروع یک ارائه‌دهنده که نمی‌تواند webhookهای اپراتور را دریافت کند، شکست می‌خورد.
</Warning>

## پیکربندی

اگر `enabled: true` باشد اما ارائه‌دهنده انتخاب‌شده اعتبارنامه نداشته باشد،
راه‌اندازی Gateway یک هشدار ناقص بودن راه‌اندازی را با کلیدهای مفقود ثبت می‌کند و
شروع runtime را رد می‌کند. فرمان‌ها، فراخوانی‌های RPC و ابزارهای عامل همچنان
هنگام استفاده، همان پیکربندی مفقود ارائه‌دهنده را برمی‌گردانند.

<Note>
اعتبارنامه‌های تماس صوتی SecretRef را می‌پذیرند. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` و `plugins.entries.voice-call.config.tts.providers.*.apiKey` از طریق سطح استاندارد SecretRef resolve می‌شوند؛ [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface) را ببینید.
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
          toNumber: "+15550005678",
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, how can I help?",
              responseSystemPrompt: "You are a concise baseball card specialist.",
              tts: {
                providers: {
                  openai: { voice: "alloy" },
                },
              },
            },
          },

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Mission Control Portal
            // (Base64; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* see Streaming transcription */ },
          realtime: { enabled: false /* see Realtime voice */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="نکته‌های امنیت و در معرض قرار دادن ارائه‌دهنده">
    - Twilio، Telnyx و Plivo همگی به یک URL webhook **قابل دسترسی عمومی** نیاز دارند.
    - `mock` یک ارائه‌دهنده محلی توسعه است (بدون فراخوانی شبکه).
    - Telnyx به `telnyx.publicKey` (یا `TELNYX_PUBLIC_KEY`) نیاز دارد، مگر اینکه `skipSignatureVerification` برابر true باشد.
    - `skipSignatureVerification` فقط برای آزمون محلی است.
    - در سطح رایگان ngrok، `publicUrl` را روی URL دقیق ngrok تنظیم کنید؛ راستی‌آزمایی امضا همیشه اعمال می‌شود.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` فقط زمانی به webhookهای Twilio با امضاهای نامعتبر اجازه می‌دهد که `tunnel.provider="ngrok"` باشد و `serve.bind` برابر loopback باشد (عامل محلی ngrok). فقط برای توسعه محلی.
    - URLهای سطح رایگان ngrok می‌توانند تغییر کنند یا رفتار میان‌صفحه اضافه کنند؛ اگر `publicUrl` تغییر کند، امضاهای Twilio شکست می‌خورند. تولید: یک دامنه پایدار یا یک funnel در Tailscale را ترجیح دهید.

  </Accordion>
  <Accordion title="سقف‌های اتصال جریانی">
    - `streaming.preStartTimeoutMs` سوکت‌هایی را می‌بندد که هرگز یک فریم معتبر `start` ارسال نمی‌کنند.
    - `streaming.maxPendingConnections` تعداد کل سوکت‌های احرازنشده پیش از شروع را محدود می‌کند.
    - `streaming.maxPendingConnectionsPerIp` سوکت‌های احرازنشده پیش از شروع را برای هر IP مبدأ محدود می‌کند.
    - `streaming.maxConnections` تعداد کل سوکت‌های باز جریان رسانه را محدود می‌کند (در انتظار + فعال).

  </Accordion>
  <Accordion title="مهاجرت‌های پیکربندی قدیمی">
    پیکربندی‌های قدیمی‌تر که از `provider: "log"`، `twilio.from` یا کلیدهای قدیمی
    `streaming.*` OpenAI استفاده می‌کنند، توسط `openclaw doctor --fix` بازنویسی می‌شوند.
    fallback زمان اجرا فعلاً هنوز کلیدهای قدیمی تماس صوتی را می‌پذیرد، اما
    مسیر بازنویسی `openclaw doctor --fix` است و shim سازگاری
    موقت است.

    کلیدهای جریانی مهاجرت‌یافته خودکار:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## محدوده نشست

به‌صورت پیش‌فرض، تماس صوتی از `sessionScope: "per-phone"` استفاده می‌کند تا تماس‌های تکراری از
همان تماس‌گیرنده حافظه گفتگو را حفظ کنند. وقتی هر تماس اپراتور باید با زمینه تازه
شروع شود، مثلاً برای پذیرش، رزرو، IVR یا جریان‌های پل Google Meet که در آن‌ها یک شماره تلفن
ممکن است نماینده جلسه‌های متفاوت باشد، `sessionScope: "per-call"` را تنظیم کنید.

## گفت‌وگوهای صوتی بلادرنگ

`realtime` یک ارائه‌دهنده صوتی بلادرنگ تمام‌دوطرفه را برای صدای زنده تماس
انتخاب می‌کند. این از `streaming` جدا است؛ `streaming` فقط صدا را به
ارائه‌دهندگان رونویسی بلادرنگ ارسال می‌کند.

<Warning>
`realtime.enabled` نمی‌تواند با `streaming.enabled` ترکیب شود. برای هر تماس
یک حالت صوتی انتخاب کنید.
</Warning>

رفتار فعلی runtime:

- `realtime.enabled` برای Twilio Media Streams پشتیبانی می‌شود.
- `realtime.provider` اختیاری است. اگر تنظیم نشده باشد، تماس صوتی از نخستین ارائه‌دهنده ثبت‌شده صوت بلادرنگ استفاده می‌کند.
- ارائه‌دهندگان صوت بلادرنگ همراه: Google Gemini Live (`google`) و OpenAI (`openai`) که توسط Pluginهای ارائه‌دهنده خودشان ثبت می‌شوند.
- پیکربندی خام متعلق به ارائه‌دهنده زیر `realtime.providers.<providerId>` قرار دارد.
- تماس صوتی ابزار مشترک بلادرنگ `openclaw_agent_consult` را به‌صورت پیش‌فرض در معرض استفاده قرار می‌دهد. مدل بلادرنگ می‌تواند وقتی تماس‌گیرنده استدلال عمیق‌تر، اطلاعات جاری یا ابزارهای عادی OpenClaw را می‌خواهد، آن را فراخوانی کند.
- `realtime.consultPolicy` به‌صورت اختیاری برای زمان‌هایی که مدل بلادرنگ باید `openclaw_agent_consult` را فراخوانی کند، راهنما اضافه می‌کند.
- `realtime.agentContext.enabled` به‌صورت پیش‌فرض خاموش است. وقتی فعال شود، تماس صوتی هنگام راه‌اندازی نشست، هویت محدود عامل، override فرمان سیستم و capsule منتخب فایل‌های workspace را به دستورهای ارائه‌دهنده بلادرنگ تزریق می‌کند.
- `realtime.fastContext.enabled` به‌صورت پیش‌فرض خاموش است. وقتی فعال شود، تماس صوتی ابتدا حافظه/زمینه نشست ایندکس‌شده را برای پرسش مشاوره جست‌وجو می‌کند و آن بخش‌ها را ظرف `realtime.fastContext.timeoutMs` به مدل بلادرنگ برمی‌گرداند، پیش از آنکه فقط در صورت true بودن `realtime.fastContext.fallbackToConsult` به عامل مشاوره کامل fallback کند.
- اگر `realtime.provider` به یک ارائه‌دهنده ثبت‌نشده اشاره کند، یا هیچ ارائه‌دهنده صوت بلادرنگی اصلاً ثبت نشده باشد، تماس صوتی یک هشدار ثبت می‌کند و به‌جای شکست دادن کل Plugin، رسانه بلادرنگ را رد می‌کند.
- کلیدهای نشست مشاوره در صورت موجود بودن از نشست تماس ذخیره‌شده دوباره استفاده می‌کنند، سپس به `sessionScope` پیکربندی‌شده fallback می‌کنند (`per-phone` به‌صورت پیش‌فرض، یا `per-call` برای تماس‌های ایزوله).

### سیاست ابزار

`realtime.toolPolicy` اجرای مشاوره را کنترل می‌کند:

| سیاست           | رفتار                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | ابزار مشاوره را در معرض استفاده قرار می‌دهد و عامل عادی را به `read`، `web_search`، `web_fetch`، `x_search`، `memory_search` و `memory_get` محدود می‌کند. |
| `owner`          | ابزار مشاوره را در معرض استفاده قرار می‌دهد و اجازه می‌دهد عامل عادی از سیاست ابزار عامل معمولی استفاده کند.                                                      |
| `none`           | ابزار مشاوره را در معرض استفاده قرار نمی‌دهد. `realtime.tools` سفارشی همچنان به ارائه‌دهنده بلادرنگ پاس داده می‌شوند.                               |

`realtime.consultPolicy` فقط دستورهای مدل بلادرنگ را کنترل می‌کند:

| سیاست        | راهنما                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | فرمان پیش‌فرض را نگه می‌دارد و اجازه می‌دهد ارائه‌دهنده تصمیم بگیرد چه زمانی ابزار مشاوره را فراخوانی کند.              |
| `substantive` | چسب گفت‌وگویی ساده را مستقیم پاسخ می‌دهد و پیش از واقعیت‌ها، حافظه، ابزارها یا زمینه، مشاوره می‌کند. |
| `always`      | پیش از هر پاسخ محتوایی مشاوره می‌کند.                                                        |

### زمینه صوتی عامل

وقتی پل صوتی باید شبیه عامل پیکربندی‌شده OpenClaw به نظر برسد، بدون پرداخت هزینه
یک رفت‌وبرگشت کامل عامل مشاوره در نوبت‌های عادی، `realtime.agentContext` را فعال کنید.
capsule زمینه یک بار هنگام ایجاد نشست بلادرنگ اضافه می‌شود، بنابراین
تأخیر هر نوبت را افزایش نمی‌دهد. فراخوانی‌های
`openclaw_agent_consult` همچنان عامل کامل OpenClaw را اجرا می‌کنند و باید برای
کار با ابزار، اطلاعات جاری، جست‌وجوی حافظه یا وضعیت workspace استفاده شوند.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeSystemPrompt: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### نمونه‌های ارائه‌دهنده بلادرنگ

<Tabs>
  <Tab title="Google Gemini Live">
    پیش‌فرض‌ها: کلید API از `realtime.providers.google.apiKey`،
    `GEMINI_API_KEY`، یا `GOOGLE_GENERATIVE_AI_API_KEY`؛ مدل
    `gemini-2.5-flash-native-audio-preview-12-2025`؛ صدا `Kore`.
    `sessionResumption` و `contextWindowCompression` برای تماس‌های طولانی‌تر و قابل اتصال مجدد، به‌صورت پیش‌فرض فعال هستند. از `silenceDurationMs`، `startSensitivity` و
    `endSensitivity` برای تنظیم نوبت‌گیری سریع‌تر روی صدای تلفنی استفاده کنید.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              provider: "twilio",
              inboundPolicy: "allowlist",
              allowFrom: ["+15550005678"],
              realtime: {
                enabled: true,
                provider: "google",
                instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
                toolPolicy: "safe-read-only",
                consultPolicy: "substantive",
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
                    silenceDurationMs: 500,
                    startSensitivity: "high",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="OpenAI">
    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              realtime: {
                enabled: true,
                provider: "openai",
                providers: {
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

برای گزینه‌های صدای بلادرنگ ویژه هر ارائه‌دهنده، [ارائه‌دهنده Google](/fa/providers/google) و
[ارائه‌دهنده OpenAI](/fa/providers/openai) را ببینید.

## رونویسی جریانی

`streaming` یک ارائه‌دهنده رونویسی بلادرنگ را برای صدای زنده تماس انتخاب می‌کند.

رفتار فعلی زمان اجرا:

- `streaming.provider` اختیاری است. اگر تنظیم نشود، Voice Call از نخستین ارائه‌دهنده رونویسی بلادرنگ ثبت‌شده استفاده می‌کند.
- ارائه‌دهندگان رونویسی بلادرنگ بسته‌بندی‌شده: Deepgram (`deepgram`)، ElevenLabs (`elevenlabs`)، Mistral (`mistral`)، OpenAI (`openai`) و xAI (`xai`) که توسط Pluginهای ارائه‌دهنده خود ثبت می‌شوند.
- پیکربندی خام متعلق به ارائه‌دهنده زیر `streaming.providers.<providerId>` قرار دارد.
- پس از اینکه Twilio پیام `start` یک جریان پذیرفته‌شده را می‌فرستد، Voice Call جریان را بی‌درنگ ثبت می‌کند، رسانه ورودی را تا زمان اتصال ارائه‌دهنده از طریق ارائه‌دهنده رونویسی در صف می‌گذارد، و پیام خوشامدگویی اولیه را فقط پس از آماده شدن رونویسی بلادرنگ شروع می‌کند.
- اگر `streaming.provider` به ارائه‌دهنده‌ای ثبت‌نشده اشاره کند، یا هیچ ارائه‌دهنده‌ای ثبت نشده باشد، Voice Call به‌جای ناموفق کردن کل Plugin، یک هشدار ثبت می‌کند و پخش جریانی رسانه را نادیده می‌گیرد.

### نمونه‌های ارائه‌دهنده پخش جریانی

<Tabs>
  <Tab title="OpenAI">
    پیش‌فرض‌ها: کلید API `streaming.providers.openai.apiKey` یا
    `OPENAI_API_KEY`؛ مدل `gpt-4o-transcribe`؛ `silenceDurationMs: 800`؛
    `vadThreshold: 0.5`.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "openai",
                streamPath: "/voice/stream",
                providers: {
                  openai: {
                    apiKey: "sk-...", // optional if OPENAI_API_KEY is set
                    model: "gpt-4o-transcribe",
                    silenceDurationMs: 800,
                    vadThreshold: 0.5,
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="xAI">
    پیش‌فرض‌ها: کلید API `streaming.providers.xai.apiKey` یا `XAI_API_KEY`؛
    نقطه پایانی `wss://api.x.ai/v1/stt`؛ کدگذاری `mulaw`؛ نرخ نمونه‌برداری `8000`؛
    `endpointingMs: 800`؛ `interimResults: true`.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                streamPath: "/voice/stream",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## TTS برای تماس‌ها

Voice Call از پیکربندی اصلی `messages.tts` برای گفتار جریانی در تماس‌ها استفاده می‌کند. می‌توانید آن را زیر پیکربندی Plugin با **همان شکل** بازنویسی کنید — این پیکربندی با `messages.tts` ادغام عمیق می‌شود.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**گفتار Microsoft برای تماس‌های صوتی نادیده گرفته می‌شود.** صدای تلفنی به PCM نیاز دارد؛
انتقال فعلی Microsoft خروجی PCM تلفنی را در دسترس قرار نمی‌دهد.
</Warning>

نکته‌های رفتاری:

- کلیدهای قدیمی `tts.<provider>` داخل پیکربندی Plugin (`openai`، `elevenlabs`، `microsoft`، `edge`) با `openclaw doctor --fix` اصلاح می‌شوند؛ پیکربندی ثبت‌شده باید از `tts.providers.<provider>` استفاده کند.
- وقتی پخش جریانی رسانه Twilio فعال باشد، از TTS اصلی استفاده می‌شود؛ در غیر این صورت تماس‌ها به صداهای بومی ارائه‌دهنده بازمی‌گردند.
- اگر یک جریان رسانه Twilio از قبل فعال باشد، Voice Call به TwiML `<Say>` بازنمی‌گردد. اگر TTS تلفنی در آن وضعیت در دسترس نباشد، درخواست پخش به‌جای آمیختن دو مسیر پخش ناموفق می‌شود.
- وقتی TTS تلفنی به یک ارائه‌دهنده ثانویه بازمی‌گردد، Voice Call برای اشکال‌زدایی هشداری همراه با زنجیره ارائه‌دهنده (`from`، `to`، `attempts`) ثبت می‌کند.
- وقتی barge-in یا teardown جریان Twilio صف TTS در انتظار را پاک می‌کند، درخواست‌های پخش صف‌شده به نتیجه می‌رسند و تماس‌گیرندگان در انتظار تکمیل پخش معلق نمی‌مانند.

### نمونه‌های TTS

<Tabs>
  <Tab title="فقط TTS اصلی">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```
  </Tab>
  <Tab title="بازنویسی به ElevenLabs (فقط تماس‌ها)">
```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="بازنویسی مدل OpenAI (ادغام عمیق)">
```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

## تماس‌های ورودی

سیاست ورودی به‌صورت پیش‌فرض `disabled` است. برای فعال کردن تماس‌های ورودی، تنظیم کنید:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` یک غربال‌گری شناسه تماس‌گیرنده با اطمینان پایین است. این
Plugin مقدار `From` ارائه‌شده توسط ارائه‌دهنده را نرمال‌سازی می‌کند و آن را با
`allowFrom` مقایسه می‌کند. راستی‌آزمایی Webhook تحویل ارائه‌دهنده و
یکپارچگی payload را احراز می‌کند، اما مالکیت شماره تماس‌گیرنده PSTN/VoIP را
**اثبات نمی‌کند**. با `allowFrom` به‌عنوان پالایش شناسه تماس‌گیرنده برخورد کنید، نه هویت
قوی تماس‌گیرنده.
</Warning>

پاسخ‌های خودکار از سیستم عامل استفاده می‌کنند. با `responseModel`،
`responseSystemPrompt` و `responseTimeoutMs` تنظیم کنید.

### مسیریابی برای هر شماره

وقتی یک Plugin به نام Voice Call برای چند شماره تلفن تماس دریافت می‌کند و هر شماره باید مانند یک خط متفاوت رفتار کند، از `numbers` استفاده کنید. برای مثال، یک
شماره می‌تواند از یک دستیار شخصی خودمانی استفاده کند، درحالی‌که شماره‌ای دیگر از یک شخصیت تجاری، عامل پاسخ متفاوت و صدای TTS متفاوت استفاده می‌کند.

مسیرها از شماره `To` شماره‌گیری‌شده و ارائه‌شده توسط ارائه‌دهنده انتخاب می‌شوند. کلیدها باید
شماره‌های E.164 باشند. وقتی تماسی می‌رسد، Voice Call مسیر مطابق را یک‌بار resolve می‌کند،
مسیر مطابق را روی رکورد تماس ذخیره می‌کند، و همان پیکربندی مؤثر را
برای خوشامدگویی، مسیر پاسخ خودکار کلاسیک، مسیر مشاوره بلادرنگ و پخش
TTS دوباره استفاده می‌کند. اگر هیچ مسیری مطابق نباشد، پیکربندی سراسری Voice Call استفاده می‌شود.
تماس‌های خروجی از `numbers` استفاده نمی‌کنند؛ هنگام آغاز تماس، مقصد خروجی، پیام و
session را صریحاً ارسال کنید.

بازنویسی‌های مسیر در حال حاضر از موارد زیر پشتیبانی می‌کنند:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

مقدار مسیر `tts` روی پیکربندی سراسری `tts` در Voice Call ادغام عمیق می‌شود، بنابراین
معمولاً می‌توانید فقط صدای ارائه‌دهنده را بازنویسی کنید:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { voice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

### قرارداد خروجی گفتاری

برای پاسخ‌های خودکار، Voice Call یک قرارداد سخت‌گیرانه خروجی گفتاری را به
system prompt اضافه می‌کند:

```text
{"spoken":"..."}
```

Voice Call متن گفتار را به‌صورت دفاعی استخراج می‌کند:

- payloadهای علامت‌گذاری‌شده به‌عنوان محتوای reasoning/error را نادیده می‌گیرد.
- JSON مستقیم، JSON حصارگذاری‌شده، یا کلیدهای درون‌خطی `"spoken"` را parse می‌کند.
- به متن ساده بازمی‌گردد و پاراگراف‌های ابتدایی محتملِ برنامه‌ریزی/متا را حذف می‌کند.

این کار پخش گفتاری را روی متن روبه‌روی تماس‌گیرنده متمرکز نگه می‌دارد و از
نشت متن برنامه‌ریزی به صدا جلوگیری می‌کند.

### رفتار شروع مکالمه

برای تماس‌های `conversation` خروجی، مدیریت پیام نخست به وضعیت پخش زنده گره خورده است:

- پاک‌سازی صف barge-in و پاسخ خودکار فقط هنگامی سرکوب می‌شوند که پیام خوشامدگویی اولیه فعالانه در حال گفتار باشد.
- اگر پخش اولیه ناموفق شود، تماس به `listening` برمی‌گردد و پیام اولیه برای تلاش مجدد در صف باقی می‌ماند.
- پخش اولیه برای پخش جریانی Twilio هنگام اتصال جریان، بدون تأخیر اضافی شروع می‌شود.
- barge-in پخش فعال را قطع می‌کند و ورودی‌های TTS در Twilio را که صف شده‌اند اما هنوز پخش نشده‌اند پاک می‌کند. ورودی‌های پاک‌شده به‌عنوان ردشده resolve می‌شوند، بنابراین منطق پاسخ بعدی می‌تواند بدون انتظار برای صدایی که هرگز پخش نخواهد شد ادامه دهد.
- مکالمه‌های صوتی بلادرنگ از نوبت آغازین خود جریان بلادرنگ استفاده می‌کنند. Voice Call برای آن پیام اولیه، به‌روزرسانی قدیمی TwiML با `<Say>` ارسال **نمی‌کند**، بنابراین sessionهای خروجی `<Connect><Stream>` متصل می‌مانند.

### مهلت قطع اتصال جریان Twilio

وقتی یک جریان رسانه Twilio قطع می‌شود، Voice Call پیش از
پایان خودکار تماس **2000 ms** صبر می‌کند:

- اگر جریان در آن بازه دوباره متصل شود، پایان خودکار لغو می‌شود.
- اگر پس از دوره مهلت هیچ جریانی دوباره ثبت نشود، تماس پایان داده می‌شود تا از گیر کردن تماس‌های فعال جلوگیری شود.

## جمع‌آور تماس‌های کهنه

از `staleCallReaperSeconds` برای پایان دادن به تماس‌هایی استفاده کنید که هرگز Webhook
پایانی دریافت نمی‌کنند (برای مثال، تماس‌های notify-mode که هرگز کامل نمی‌شوند). مقدار پیش‌فرض
`0` (غیرفعال) است.

بازه‌های پیشنهادی:

- **تولید:** `120` تا `300` ثانیه برای جریان‌های سبک اعلان.
- این مقدار را **بیشتر از `maxDurationSeconds`** نگه دارید تا فراخوانی‌های عادی بتوانند کامل شوند. نقطه شروع مناسب `maxDurationSeconds + 30–60` ثانیه است.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## امنیت Webhook

وقتی یک پروکسی یا تونل جلوی Gateway قرار می‌گیرد، Plugin
نشانی URL عمومی را برای اعتبارسنجی امضا بازسازی می‌کند. این گزینه‌ها
کنترل می‌کنند کدام سرآیندهای فورواردشده قابل اعتماد هستند:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  میزبان‌ها را از سرآیندهای فورواردینگ در فهرست مجاز قرار می‌دهد.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  به سرآیندهای فورواردشده بدون فهرست مجاز اعتماد می‌کند.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  فقط زمانی به سرآیندهای فورواردشده اعتماد می‌کند که IP راه‌دور درخواست با فهرست مطابقت داشته باشد.
</ParamField>

محافظت‌های اضافی:

- **محافظت در برابر بازپخش** Webhook برای Twilio و Plivo فعال است. درخواست‌های Webhook معتبرِ بازپخش‌شده تأیید می‌شوند، اما برای اثرات جانبی نادیده گرفته می‌شوند.
- نوبت‌های مکالمه Twilio در callbackهای `<Gather>` شامل یک توکن برای هر نوبت هستند، بنابراین callbackهای گفتار کهنه یا بازپخش‌شده نمی‌توانند یک نوبت رونوشت جدیدترِ در انتظار را برآورده کنند.
- درخواست‌های Webhook احرازنشده، وقتی سرآیندهای امضای موردنیاز ارائه‌دهنده وجود نداشته باشند، پیش از خواندن بدنه رد می‌شوند.
- Webhook تماس صوتی از پروفایل بدنه پیش‌احراز هویت مشترک (64 کیلوبایت / 5 ثانیه) به‌همراه سقف درخواست‌های هم‌زمان برای هر IP پیش از اعتبارسنجی امضا استفاده می‌کند.

نمونه با یک میزبان عمومی پایدار:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

وقتی Gateway از قبل در حال اجراست، فرمان‌های عملیاتی `voicecall` به
زمان‌اجرای تماس صوتی متعلق به Gateway واگذار می‌شوند تا CLI یک سرور Webhook
دوم را bind نکند. اگر هیچ Gateway در دسترس نباشد، فرمان‌ها به یک
زمان‌اجرای مستقل CLI fallback می‌کنند.

`latency` فایل `calls.jsonl` را از مسیر ذخیره‌سازی پیش‌فرض تماس صوتی می‌خواند.
از `--file <path>` برای اشاره به گزارش دیگری و از `--last <n>` برای محدود کردن
تحلیل به آخرین N رکورد استفاده کنید (پیش‌فرض 200). خروجی شامل p50/p90/p99
برای تأخیر نوبت و زمان‌های انتظار برای شنیدن است.

## ابزار عامل

نام ابزار: `voice_call`.

| کنش            | آرگومان‌ها                                  |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

این مخزن یک سند skill متناظر را در `skills/voice-call/SKILL.md` ارائه می‌کند.

## RPC در Gateway

| روش                 | آرگومان‌ها                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` فقط با `mode: "conversation"` معتبر است. تماس‌های notify-mode
اگر پس از اتصال به رقم‌ها نیاز دارند، باید بعد از ایجاد تماس از `voicecall.dtmf`
استفاده کنند.

## عیب‌یابی

### راه‌اندازی در افشای Webhook شکست می‌خورد

راه‌اندازی را از همان محیطی اجرا کنید که Gateway را اجرا می‌کند:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

برای `twilio`، `telnyx`، و `plivo`، `webhook-exposure` باید سبز باشد. یک
`publicUrl` پیکربندی‌شده همچنان وقتی به فضای شبکه محلی یا خصوصی اشاره کند
شکست می‌خورد، چون اپراتور نمی‌تواند به آن نشانی‌ها callback بزند. از
`localhost`، `127.0.0.1`، `0.0.0.0`، `10.x`، `172.16.x`-`172.31.x`،
`192.168.x`، `169.254.x`، `fc00::/7`، یا `fd00::/8` به‌عنوان `publicUrl`
استفاده نکنید.

تماس‌های خروجی notify-mode در Twilio، TwiML اولیه `<Say>` خود را مستقیماً در
درخواست ایجاد تماس ارسال می‌کنند، بنابراین نخستین پیام گفتاری به دریافت TwiML
از Webhook توسط Twilio وابسته نیست. یک Webhook عمومی همچنان برای callbackهای
وضعیت، تماس‌های مکالمه، DTMF پیش از اتصال، جریان‌های realtime، و کنترل تماس پس
از اتصال لازم است.

از یک مسیر افشای عمومی استفاده کنید:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // or
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

پس از تغییر پیکربندی، Gateway را restart یا reload کنید، سپس اجرا کنید:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` یک اجرای خشک است، مگر اینکه `--yes` را پاس دهید.

### اعتبارنامه‌های ارائه‌دهنده شکست می‌خورند

ارائه‌دهنده انتخاب‌شده و فیلدهای اعتبارنامه موردنیاز را بررسی کنید:

- Twilio: `twilio.accountSid`، `twilio.authToken`، و `fromNumber`، یا
  `TWILIO_ACCOUNT_SID`، `TWILIO_AUTH_TOKEN`، و `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`، `telnyx.connectionId`، `telnyx.publicKey`، و
  `fromNumber`.
- Plivo: `plivo.authId`، `plivo.authToken`، و `fromNumber`.

اعتبارنامه‌ها باید روی میزبان Gateway وجود داشته باشند. ویرایش یک پروفایل
shell محلی تا زمانی که Gateway restart یا محیط خود را reload نکند، روی Gateway
در حال اجرا اثر نمی‌گذارد.

### تماس‌ها شروع می‌شوند اما Webhookهای ارائه‌دهنده نمی‌رسند

تأیید کنید کنسول ارائه‌دهنده دقیقاً به URL عمومی Webhook اشاره می‌کند:

```text
https://voice.example.com/voice/webhook
```

سپس وضعیت زمان‌اجرا را بررسی کنید:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

دلایل رایج:

- `publicUrl` به مسیری متفاوت از `serve.path` اشاره می‌کند.
- URL تونل پس از شروع Gateway تغییر کرده است.
- یک پروکسی درخواست را فوروارد می‌کند اما سرآیندهای host/proto را حذف یا بازنویسی می‌کند.
- firewall یا DNS نام میزبان عمومی را به جایی غیر از Gateway هدایت می‌کند.
- Gateway بدون فعال بودن Plugin تماس صوتی restart شده است.

وقتی یک reverse proxy یا تونل جلوی Gateway است،
`webhookSecurity.allowedHosts` را روی نام میزبان عمومی تنظیم کنید، یا برای یک
نشانی پروکسی شناخته‌شده از `webhookSecurity.trustedProxyIPs` استفاده کنید. از
`webhookSecurity.trustForwardingHeaders` فقط وقتی استفاده کنید که مرز پروکسی
تحت کنترل شماست.

### اعتبارسنجی امضا شکست می‌خورد

امضاهای ارائه‌دهنده در برابر URL عمومی‌ای بررسی می‌شوند که OpenClaw از درخواست
ورودی بازسازی می‌کند. اگر امضاها شکست بخورند:

- تأیید کنید URL Webhook ارائه‌دهنده دقیقاً با `publicUrl`، شامل scheme، host، و path، مطابقت دارد.
- برای URLهای سطح رایگان ngrok، وقتی نام میزبان تونل تغییر می‌کند `publicUrl` را به‌روز کنید.
- مطمئن شوید پروکسی host و proto headers اصلی را حفظ می‌کند، یا
  `webhookSecurity.allowedHosts` را پیکربندی کنید.
- خارج از تست محلی، `skipSignatureVerification` را فعال نکنید.

### اتصال‌های Google Meet با Twilio شکست می‌خورند

Google Meet از این Plugin برای اتصال‌های dial-in با Twilio استفاده می‌کند. ابتدا Voice Call را بررسی کنید:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

سپس انتقال Google Meet را صراحتاً بررسی کنید:

```bash
openclaw googlemeet setup --transport twilio
```

اگر Voice Call سبز است اما شرکت‌کننده Meet هرگز وارد نمی‌شود، شماره dial-in
Meet، PIN، و `--dtmf-sequence` را بررسی کنید. تماس تلفنی می‌تواند سالم باشد
در حالی که جلسه یک توالی DTMF نادرست را رد یا نادیده می‌گیرد.

Google Meet شاخه تلفنی Twilio را از طریق `voicecall.start` با یک توالی DTMF
پیش از اتصال آغاز می‌کند. توالی‌های مشتق‌شده از PIN شامل
`voiceCall.dtmfDelayMs` متعلق به Plugin Google Meet به‌عنوان ارقام انتظار
ابتدایی Twilio هستند. مقدار پیش‌فرض 12 ثانیه است، چون اعلان‌های dial-in در
Meet ممکن است دیر برسند. سپس Voice Call پیش از درخواست خوشامدگویی ابتدایی، به
مدیریت realtime برمی‌گردد.

برای ردگیری زنده مرحله، از `openclaw logs --follow` استفاده کنید. یک اتصال سالم
Twilio Meet این ترتیب را در گزارش ثبت می‌کند:

- Google Meet اتصال Twilio را به Voice Call واگذار می‌کند.
- Voice Call توالی DTMF TwiML پیش از اتصال را ذخیره می‌کند.
- TwiML اولیه Twilio پیش از مدیریت realtime مصرف و سرو می‌شود.
- Voice Call برای تماس Twilio، TwiML realtime سرو می‌کند.
- Google Meet پس از تأخیر post-DTMF، گفتار آغازین را با `voicecall.speak` درخواست می‌کند.

`openclaw voicecall tail` همچنان رکوردهای تماس ذخیره‌شده را نشان می‌دهد؛ برای
وضعیت تماس و رونوشت‌ها مفید است، اما هر گذار Webhook/realtime در آن ظاهر
نمی‌شود.

### تماس realtime گفتار ندارد

تأیید کنید فقط یک حالت صوتی فعال است. `realtime.enabled` و
`streaming.enabled` نمی‌توانند هر دو true باشند.

برای تماس‌های realtime در Twilio، این موارد را هم بررسی کنید:

- یک Plugin ارائه‌دهنده realtime بارگذاری و ثبت شده است.
- `realtime.provider` تنظیم نشده یا نام یک ارائه‌دهنده ثبت‌شده را مشخص می‌کند.
- کلید API ارائه‌دهنده برای فرایند Gateway در دسترس است.
- `openclaw logs --follow` نشان می‌دهد TwiML realtime سرو شده، bridge realtime
  شروع شده، و خوشامدگویی اولیه در صف قرار گرفته است.

## مرتبط

- [حالت گفت‌وگو](/fa/nodes/talk)
- [تبدیل متن به گفتار](/fa/tools/tts)
- [بیدارباش صوتی](/fa/nodes/voicewake)
