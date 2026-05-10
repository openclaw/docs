---
read_when:
    - می‌خواهید یک تماس صوتی خروجی از OpenClaw برقرار کنید
    - شما در حال پیکربندی یا توسعهٔ Plugin تماس صوتی هستید
    - به صدای بلادرنگ یا رونویسی جریانی در سامانه‌های تلفنی نیاز دارید
sidebarTitle: Voice call
summary: برقراری تماس‌های صوتی خروجی و پذیرش تماس‌های صوتی ورودی از طریق Twilio، Telnyx یا Plivo، با صدای بلادرنگ و رونویسی جریانی اختیاری
title: Plugin تماس صوتی
x-i18n:
    generated_at: "2026-05-10T20:01:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94e3942b8330ebf2014f1899267f69f8a135859cfa1002ae390244a4f89883d6
    source_path: plugins/voice-call.md
    workflow: 16
---

تماس‌های صوتی برای OpenClaw از طریق یک Plugin. از اعلان‌های خروجی،
گفت‌وگوهای چندنوبتی، صدای بلادرنگ تمام‌دوسویه، رونویسی جریانی،
و تماس‌های ورودی با سیاست‌های فهرست مجاز پشتیبانی می‌کند.

**ارائه‌دهندگان فعلی:** `twilio` (Programmable Voice + Media Streams)،
`telnyx` (Call Control v2)، `plivo` (Voice API + XML transfer + GetInput
speech)، `mock` (توسعه/بدون شبکه).

<Note>
Plugin تماس صوتی **داخل فرایند Gateway** اجرا می‌شود. اگر از Gateway
راه‌دور استفاده می‌کنید، Plugin را روی ماشینی که Gateway را اجرا می‌کند
نصب و پیکربندی کنید، سپس Gateway را بازراه‌اندازی کنید تا آن را بارگذاری کند.
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

    برای دنبال کردن برچسب انتشار رسمی فعلی، از بسته ساده استفاده کنید. فقط
    زمانی نسخه دقیق را پین کنید که به نصب قابل بازتولید نیاز دارید.

    پس از آن Gateway را بازراه‌اندازی کنید تا Plugin بارگذاری شود.

  </Step>
  <Step title="پیکربندی ارائه‌دهنده و Webhook">
    پیکربندی را زیر `plugins.entries.voice-call.config` تنظیم کنید (برای شکل
    کامل، [پیکربندی](#configuration) را در پایین ببینید). حداقل موارد لازم:
    `provider`، اعتبارنامه‌های ارائه‌دهنده، `fromNumber`، و یک URL
    Webhook عمومی و قابل دسترس.
  </Step>
  <Step title="راستی‌آزمایی راه‌اندازی">
    ```bash
    openclaw voicecall setup
    ```

    خروجی پیش‌فرض در گزارش‌های چت و پایانه‌ها خوانا است. این فرمان
    فعال بودن Plugin، اعتبارنامه‌های ارائه‌دهنده، در دسترس بودن Webhook،
    و فعال بودن فقط یک حالت صوتی (`streaming` یا `realtime`) را بررسی می‌کند.
    برای اسکریپت‌ها از `--json` استفاده کنید.

  </Step>
  <Step title="آزمون دود">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    هر دو به‌صورت پیش‌فرض اجرای خشک هستند. برای برقراری واقعی یک تماس
    اعلان خروجی کوتاه، `--yes` را اضافه کنید:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
برای Twilio، Telnyx، و Plivo، راه‌اندازی باید به یک **URL عمومی Webhook** ختم شود.
اگر `publicUrl`، URL تونل، URL مربوط به Tailscale، یا جایگزین serve به loopback
یا فضای شبکه خصوصی ختم شود، راه‌اندازی به‌جای شروع ارائه‌دهنده‌ای که نمی‌تواند
Webhookهای اپراتور را دریافت کند، ناموفق می‌شود.
</Warning>

## پیکربندی

اگر `enabled: true` باشد اما اعتبارنامه‌های ارائه‌دهنده انتخاب‌شده موجود نباشد،
هنگام شروع Gateway یک هشدار راه‌اندازی‌ناقص با کلیدهای گمشده ثبت می‌شود و
شروع runtime رد می‌شود. فرمان‌ها، فراخوانی‌های RPC، و ابزارهای عامل همچنان
هنگام استفاده، همان پیکربندی گمشده ارائه‌دهنده را برمی‌گردانند.

<Note>
اعتبارنامه‌های تماس صوتی SecretRef را می‌پذیرند. `plugins.entries.voice-call.config.twilio.authToken`، `plugins.entries.voice-call.config.realtime.providers.*.apiKey`، `plugins.entries.voice-call.config.streaming.providers.*.apiKey`، و `plugins.entries.voice-call.config.tts.providers.*.apiKey` از طریق سطح استاندارد SecretRef حل می‌شوند؛ [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface) را ببینید.
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
  <Accordion title="نکات در معرض‌گذاری و امنیت ارائه‌دهنده">
    - Twilio، Telnyx، و Plivo همگی به یک URL Webhook **عمومی و قابل دسترس** نیاز دارند.
    - `mock` یک ارائه‌دهنده محلی برای توسعه است (بدون فراخوانی شبکه).
    - Telnyx به `telnyx.publicKey` (یا `TELNYX_PUBLIC_KEY`) نیاز دارد مگر اینکه `skipSignatureVerification` true باشد.
    - `skipSignatureVerification` فقط برای آزمون محلی است.
    - در سطح رایگان ngrok، `publicUrl` را روی URL دقیق ngrok تنظیم کنید؛ راستی‌آزمایی امضا همیشه اعمال می‌شود.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` فقط زمانی اجازه Webhookهای Twilio با امضاهای نامعتبر را می‌دهد که `tunnel.provider="ngrok"` باشد و `serve.bind` روی loopback تنظیم شده باشد (عامل محلی ngrok). فقط برای توسعه محلی.
    - URLهای سطح رایگان Ngrok ممکن است تغییر کنند یا رفتار میان‌صفحه‌ای اضافه کنند؛ اگر `publicUrl` جابه‌جا شود، امضاهای Twilio ناموفق می‌شوند. تولید: یک دامنه پایدار یا یک funnel مربوط به Tailscale را ترجیح دهید.

  </Accordion>
  <Accordion title="سقف‌های اتصال جریانی">
    - `streaming.preStartTimeoutMs` سوکت‌هایی را که هرگز یک فریم معتبر `start` نمی‌فرستند می‌بندد.
    - `streaming.maxPendingConnections` کل سوکت‌های پیش‌ازشروع احراز‌نشده را محدود می‌کند.
    - `streaming.maxPendingConnectionsPerIp` سوکت‌های پیش‌ازشروع احراز‌نشده را برای هر IP مبدا محدود می‌کند.
    - `streaming.maxConnections` کل سوکت‌های باز جریان رسانه را محدود می‌کند (در انتظار + فعال).

  </Accordion>
  <Accordion title="مهاجرت‌های پیکربندی قدیمی">
    پیکربندی‌های قدیمی‌تر که از `provider: "log"`، `twilio.from`، یا کلیدهای قدیمی
    OpenAI در `streaming.*` استفاده می‌کنند، توسط `openclaw doctor --fix` بازنویسی می‌شوند.
    جایگزین runtime فعلا همچنان کلیدهای قدیمی تماس صوتی را می‌پذیرد، اما
    مسیر بازنویسی `openclaw doctor --fix` است و لایه سازگاری
    موقتی است.

    کلیدهای جریانی مهاجرت‌داده‌شده خودکار:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## دامنه نشست

به‌صورت پیش‌فرض، تماس صوتی از `sessionScope: "per-phone"` استفاده می‌کند تا
تماس‌های تکراری از همان تماس‌گیرنده حافظه گفت‌وگو را نگه دارند. وقتی هر تماس
اپراتوری باید با زمینه تازه شروع شود، مثلا برای پذیرش، رزرو، IVR، یا جریان‌های
پل Google Meet که در آن‌ها یک شماره تلفن ممکن است نماینده جلسه‌های مختلف باشد،
`sessionScope: "per-call"` را تنظیم کنید.

## گفت‌وگوهای صوتی بلادرنگ

`realtime` یک ارائه‌دهنده صدای بلادرنگ تمام‌دوسویه را برای صدای زنده تماس
انتخاب می‌کند. این از `streaming` جدا است؛ `streaming` فقط صدا را به
ارائه‌دهندگان رونویسی بلادرنگ ارسال می‌کند.

<Warning>
`realtime.enabled` را نمی‌توان با `streaming.enabled` ترکیب کرد. برای هر تماس
یک حالت صوتی انتخاب کنید.
</Warning>

رفتار فعلی runtime:

- `realtime.enabled` برای Twilio Media Streams پشتیبانی می‌شود.
- `realtime.provider` اختیاری است. اگر تنظیم نشده باشد، تماس صوتی از اولین ارائه‌دهنده ثبت‌شده صدای بلادرنگ استفاده می‌کند.
- ارائه‌دهندگان صدای بلادرنگ همراه: Google Gemini Live (`google`) و OpenAI (`openai`) که توسط Pluginهای ارائه‌دهنده خودشان ثبت می‌شوند.
- پیکربندی خام متعلق به ارائه‌دهنده زیر `realtime.providers.<providerId>` قرار می‌گیرد.
- تماس صوتی به‌صورت پیش‌فرض ابزار بلادرنگ مشترک `openclaw_agent_consult` را در معرض قرار می‌دهد. مدل بلادرنگ می‌تواند زمانی که تماس‌گیرنده استدلال عمیق‌تر، اطلاعات فعلی، یا ابزارهای عادی OpenClaw را می‌خواهد، آن را فراخوانی کند.
- `realtime.consultPolicy` به‌صورت اختیاری راهنمایی‌هایی اضافه می‌کند برای اینکه مدل بلادرنگ چه زمانی باید `openclaw_agent_consult` را فراخوانی کند.
- `realtime.agentContext.enabled` به‌صورت پیش‌فرض خاموش است. وقتی فعال باشد، تماس صوتی در زمان راه‌اندازی نشست، یک هویت عامل محدود، بازنویسی پرامپت سیستمی، و کپسول انتخاب‌شده فایل‌های فضای‌کار را به دستورالعمل‌های ارائه‌دهنده بلادرنگ تزریق می‌کند.
- `realtime.fastContext.enabled` به‌صورت پیش‌فرض خاموش است. وقتی فعال باشد، تماس صوتی ابتدا در حافظه/زمینه نشست ایندکس‌شده برای پرسش مشاوره جست‌وجو می‌کند و قبل از بازگشت به عامل مشاوره کامل فقط در صورتی که `realtime.fastContext.fallbackToConsult` true باشد، آن قطعه‌ها را در بازه `realtime.fastContext.timeoutMs` به مدل بلادرنگ برمی‌گرداند.
- اگر `realtime.provider` به ارائه‌دهنده ثبت‌نشده‌ای اشاره کند، یا اصلا هیچ ارائه‌دهنده صدای بلادرنگی ثبت نشده باشد، تماس صوتی به‌جای ناموفق کردن کل Plugin، یک هشدار ثبت می‌کند و رسانه بلادرنگ را رد می‌کند.
- کلیدهای نشست مشاوره، در صورت موجود بودن، از نشست تماس ذخیره‌شده دوباره استفاده می‌کنند، سپس به `sessionScope` پیکربندی‌شده برمی‌گردند (`per-phone` به‌صورت پیش‌فرض، یا `per-call` برای تماس‌های ایزوله).

### سیاست ابزار

`realtime.toolPolicy` اجرای مشاوره را کنترل می‌کند:

| سیاست           | رفتار                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | ابزار مشاوره را در معرض قرار می‌دهد و عامل معمولی را به `read`، `web_search`، `web_fetch`، `x_search`، `memory_search`، و `memory_get` محدود می‌کند. |
| `owner`          | ابزار مشاوره را در معرض قرار می‌دهد و اجازه می‌دهد عامل معمولی از سیاست عادی ابزار عامل استفاده کند.                                                      |
| `none`           | ابزار مشاوره را در معرض قرار نمی‌دهد. `realtime.tools` سفارشی همچنان به ارائه‌دهنده بلادرنگ عبور داده می‌شوند.                               |

`realtime.consultPolicy` فقط دستورالعمل‌های مدل بلادرنگ را کنترل می‌کند:

| سیاست        | راهنمایی                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | پرامپت پیش‌فرض را نگه می‌دارد و اجازه می‌دهد ارائه‌دهنده تصمیم بگیرد چه زمانی ابزار مشاوره را فراخوانی کند.              |
| `substantive` | چسب گفت‌وگویی ساده را مستقیم پاسخ می‌دهد و قبل از facts، memory، tools، یا context مشاوره می‌کند. |
| `always`      | پیش از هر پاسخ ماهوی مشاوره می‌کند.                                                        |

### زمینه صدای عامل

وقتی پل صوتی باید مانند عامل پیکربندی‌شده OpenClaw به نظر برسد، بدون پرداخت
رفت‌وبرگشت کامل مشاوره عامل در نوبت‌های عادی، `realtime.agentContext` را فعال کنید.
کپسول زمینه یک‌بار هنگام ایجاد نشست بلادرنگ اضافه می‌شود، بنابراین تاخیر هر نوبت
را افزایش نمی‌دهد. فراخوانی‌های `openclaw_agent_consult` همچنان عامل کامل OpenClaw
را اجرا می‌کنند و باید برای کار با ابزارها، اطلاعات فعلی، جست‌وجوی حافظه، یا وضعیت
فضای‌کار استفاده شوند.

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

### نمونه‌های ارائه‌دهندهٔ بلادرنگ

<Tabs>
  <Tab title="Google Gemini Live">
    پیش‌فرض‌ها: کلید API از `realtime.providers.google.apiKey`،
    `GEMINI_API_KEY`، یا `GOOGLE_GENERATIVE_AI_API_KEY`؛ مدل
    `gemini-2.5-flash-native-audio-preview-12-2025`؛ صدا `Kore`.
    `sessionResumption` و `contextWindowCompression` به‌صورت پیش‌فرض برای تماس‌های طولانی‌تر و قابل اتصال مجدد فعال‌اند. برای تنظیم نوبت‌گیری سریع‌تر روی صدای تلفنی از `silenceDurationMs`، `startSensitivity`، و
    `endSensitivity` استفاده کنید.

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
                consultThinkingLevel: "low",
                consultFastMode: true,
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

برای گزینه‌های صدای بلادرنگ ویژهٔ هر ارائه‌دهنده، [ارائه‌دهندهٔ Google](/fa/providers/google) و
[ارائه‌دهندهٔ OpenAI](/fa/providers/openai) را ببینید.

## رونویسی جریانی

`streaming` یک ارائه‌دهندهٔ رونویسی بلادرنگ را برای صدای زندهٔ تماس انتخاب می‌کند.

رفتار فعلی زمان اجرا:

- `streaming.provider` اختیاری است. اگر تنظیم نشده باشد، Voice Call از نخستین ارائه‌دهندهٔ رونویسی بلادرنگ ثبت‌شده استفاده می‌کند.
- ارائه‌دهندگان رونویسی بلادرنگ همراه: Deepgram (`deepgram`)، ElevenLabs (`elevenlabs`)، Mistral (`mistral`)، OpenAI (`openai`)، و xAI (`xai`) که توسط Pluginهای ارائه‌دهندهٔ خودشان ثبت می‌شوند.
- پیکربندی خام متعلق به ارائه‌دهنده زیر `streaming.providers.<providerId>` قرار دارد.
- پس از اینکه Twilio یک پیام `start` جریان پذیرفته‌شده ارسال کند، Voice Call جریان را فوراً ثبت می‌کند، رسانهٔ ورودی را تا زمان اتصال ارائه‌دهنده از طریق ارائه‌دهندهٔ رونویسی در صف می‌گذارد، و سلام اولیه را فقط پس از آماده شدن رونویسی بلادرنگ شروع می‌کند.
- اگر `streaming.provider` به ارائه‌دهنده‌ای ثبت‌نشده اشاره کند، یا هیچ ارائه‌دهنده‌ای ثبت نشده باشد، Voice Call به‌جای ناموفق کردن کل Plugin، یک هشدار ثبت می‌کند و جریان رسانه را رد می‌کند.

### نمونه‌های ارائه‌دهندهٔ جریان

<Tabs>
  <Tab title="OpenAI">
    پیش‌فرض‌ها: کلید API با `streaming.providers.openai.apiKey` یا
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
    پیش‌فرض‌ها: کلید API با `streaming.providers.xai.apiKey` یا `XAI_API_KEY`؛
    نقطهٔ پایانی `wss://api.x.ai/v1/stt`؛ کدگذاری `mulaw`؛ نرخ نمونه‌برداری `8000`؛
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

Voice Call از پیکربندی هستهٔ `messages.tts` برای گفتار جریانی روی تماس‌ها استفاده می‌کند. می‌توانید آن را زیر پیکربندی Plugin با **همان شکل** بازنویسی کنید — با `messages.tts` ادغام عمیق می‌شود.

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
**گفتار Microsoft برای تماس‌های صوتی نادیده گرفته می‌شود.** صدای تلفنی به PCM نیاز دارد؛ انتقال فعلی Microsoft خروجی PCM تلفنی را ارائه نمی‌کند.
</Warning>

نکات رفتاری:

- کلیدهای قدیمی `tts.<provider>` داخل پیکربندی Plugin (`openai`، `elevenlabs`، `microsoft`، `edge`) توسط `openclaw doctor --fix` تعمیر می‌شوند؛ پیکربندی commitشده باید از `tts.providers.<provider>` استفاده کند.
- وقتی جریان رسانهٔ Twilio فعال باشد، TTS هسته استفاده می‌شود؛ در غیر این صورت تماس‌ها به صداهای بومی ارائه‌دهنده بازمی‌گردند.
- اگر جریان رسانهٔ Twilio از قبل فعال باشد، Voice Call به TwiML `<Say>` بازنمی‌گردد. اگر TTS تلفنی در آن وضعیت در دسترس نباشد، درخواست پخش به‌جای ترکیب دو مسیر پخش ناموفق می‌شود.
- وقتی TTS تلفنی به یک ارائه‌دهندهٔ ثانویه بازمی‌گردد، Voice Call برای اشکال‌زدایی هشداری با زنجیرهٔ ارائه‌دهندگان (`from`، `to`، `attempts`) ثبت می‌کند.
- وقتی ورود مزاحم Twilio یا برچیدن جریان صف TTS معلق را پاک می‌کند، درخواست‌های پخش صف‌شده به‌جای معلق نگه داشتن تماس‌گیرندگان در انتظار تکمیل پخش، تعیین‌تکلیف می‌شوند.

### نمونه‌های TTS

<Tabs>
  <Tab title="فقط TTS هسته">
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
`inboundPolicy: "allowlist"` یک غربالگری شناسهٔ تماس‌گیرنده با اطمینان پایین است. این
Plugin مقدار `From` ارائه‌شده توسط ارائه‌دهنده را نرمال‌سازی می‌کند و آن را با
`allowFrom` مقایسه می‌کند. تأیید Webhook تحویل ارائه‌دهنده و یکپارچگی بار داده را احراز می‌کند، اما مالکیت شمارهٔ تماس‌گیرندهٔ PSTN/VoIP را **ثابت نمی‌کند**. `allowFrom` را به‌عنوان فیلتر شناسهٔ تماس‌گیرنده در نظر بگیرید، نه هویت قوی تماس‌گیرنده.
</Warning>

پاسخ‌های خودکار از سامانهٔ عامل استفاده می‌کنند. با `responseModel`،
`responseSystemPrompt`، و `responseTimeoutMs` تنظیم کنید.

### مسیریابی بر اساس شماره

زمانی از `numbers` استفاده کنید که یک Plugin ‏Voice Call تماس‌های چند شمارهٔ تلفن را دریافت می‌کند و هر شماره باید مانند یک خط متفاوت رفتار کند. برای مثال، یک شماره می‌تواند از دستیار شخصی خودمانی استفاده کند، در حالی که شمارهٔ دیگر از یک شخصیت تجاری، یک عامل پاسخ متفاوت، و یک صدای TTS متفاوت استفاده می‌کند.

مسیرها از شمارهٔ `To` شماره‌گیری‌شدهٔ ارائه‌شده توسط ارائه‌دهنده انتخاب می‌شوند. کلیدها باید شماره‌های E.164 باشند. وقتی تماسی وارد می‌شود، Voice Call مسیر منطبق را یک بار حل می‌کند، مسیر منطبق را روی رکورد تماس ذخیره می‌کند، و از همان پیکربندی مؤثر برای سلام، مسیر کلاسیک پاسخ خودکار، مسیر مشاورهٔ بلادرنگ، و پخش TTS دوباره استفاده می‌کند. اگر هیچ مسیری منطبق نباشد، پیکربندی سراسری Voice Call استفاده می‌شود.
تماس‌های خروجی از `numbers` استفاده نمی‌کنند؛ هنگام آغاز تماس، مقصد خروجی، پیام، و نشست را صریحاً پاس بدهید.

بازنویسی‌های مسیر در حال حاضر از این موارد پشتیبانی می‌کنند:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

مقدار مسیر `tts` روی پیکربندی سراسری `tts` مربوط به Voice Call ادغام عمیق می‌شود، بنابراین معمولاً می‌توانید فقط صدای ارائه‌دهنده را بازنویسی کنید:

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

برای پاسخ‌های خودکار، Voice Call یک قرارداد سخت‌گیرانهٔ خروجی گفتاری را به اعلان سامانه اضافه می‌کند:

```text
{"spoken":"..."}
```

Voice Call متن گفتار را به‌شکل دفاعی استخراج می‌کند:

- بارهای دادهٔ علامت‌گذاری‌شده به‌عنوان محتوای استدلال/خطا را نادیده می‌گیرد.
- JSON مستقیم، JSON حصارگذاری‌شده، یا کلیدهای درون‌خطی `"spoken"` را تجزیه می‌کند.
- به متن ساده بازمی‌گردد و پاراگراف‌های آغازین محتملِ برنامه‌ریزی/فراداده را حذف می‌کند.

این کار پخش گفتاری را روی متن رو به تماس‌گیرنده متمرکز نگه می‌دارد و از نشت متن برنامه‌ریزی به صدا جلوگیری می‌کند.

### رفتار آغاز مکالمه

برای تماس‌های خروجی `conversation`، رسیدگی به پیام نخست به وضعیت پخش زنده گره خورده است:

- پاک‌سازی صف ورود مزاحم و پاسخ خودکار فقط زمانی سرکوب می‌شوند که سلام اولیه فعالانه در حال گفتن باشد.
- اگر پخش اولیه ناموفق شود، تماس به `listening` بازمی‌گردد و پیام اولیه برای تلاش دوباره در صف باقی می‌ماند.
- پخش اولیه برای جریان Twilio هنگام اتصال جریان، بدون تأخیر اضافی شروع می‌شود.
- ورود مزاحم پخش فعال را متوقف می‌کند و ورودی‌های TTS متعلق به Twilio را که در صف‌اند اما هنوز پخش نشده‌اند پاک می‌کند. ورودی‌های پاک‌شده به‌عنوان ردشده resolve می‌شوند، بنابراین منطق پاسخ پیگیری می‌تواند بدون انتظار برای صدایی که هرگز پخش نخواهد شد ادامه دهد.
- مکالمه‌های صوتی بلادرنگ از نوبت آغازین خودِ جریان بلادرنگ استفاده می‌کنند. Voice Call برای آن پیام اولیه به‌روزرسانی TwiML قدیمی `<Say>` ارسال **نمی‌کند**، بنابراین نشست‌های خروجی `<Connect><Stream>` متصل می‌مانند.

### مهلت قطع اتصال جریان Twilio

وقتی جریان رسانهٔ Twilio قطع می‌شود، Voice Call پیش از پایان خودکار تماس **2000 ms** صبر می‌کند:

- اگر جریان در آن بازه دوباره متصل شود، پایان خودکار لغو می‌شود.
- اگر پس از دورهٔ مهلت هیچ جریانی دوباره ثبت نشود، تماس پایان می‌یابد تا از گیر کردن تماس‌های فعال جلوگیری شود.

## جمع‌آورندهٔ تماس‌های کهنه

از `staleCallReaperSeconds` برای پایان دادن به تماس‌هایی استفاده کنید که هرگز Webhook پایانی دریافت نمی‌کنند (برای مثال، تماس‌های حالت اعلان که هرگز کامل نمی‌شوند). مقدار پیش‌فرض
`0` است (غیرفعال).

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

وقتی یک پراکسی یا تونل جلوی Gateway قرار دارد، Plugin
نشانی URL عمومی را برای راستی‌آزمایی امضا بازسازی می‌کند. این گزینه‌ها
کنترل می‌کنند کدام سرآیندهای فرواردشده قابل اعتماد هستند:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  میزبان‌های مجاز از سرآیندهای فرواردکننده.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  به سرآیندهای فرواردشده بدون فهرست مجاز اعتماد کن.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  فقط زمانی به سرآیندهای فرواردشده اعتماد کن که IP راه‌دور درخواست با فهرست مطابقت داشته باشد.
</ParamField>

محافظت‌های اضافی:

- **محافظت در برابر بازپخش** Webhook برای Twilio و Plivo فعال است. درخواست‌های Webhook معتبر بازپخش‌شده تأیید می‌شوند اما برای اثرهای جانبی نادیده گرفته می‌شوند.
- نوبت‌های مکالمه Twilio در کال‌بک‌های `<Gather>` شامل یک توکن مخصوص همان نوبت هستند، بنابراین کال‌بک‌های گفتار قدیمی/بازپخش‌شده نمی‌توانند یک نوبت رونوشت در انتظار جدیدتر را برآورده کنند.
- درخواست‌های Webhook احراز هویت‌نشده، وقتی سرآیندهای امضای موردنیاز ارائه‌دهنده وجود ندارند، پیش از خواندن بدنه رد می‌شوند.
- Webhook تماس صوتی از پروفایل مشترک بدنه پیش از احراز هویت (64 KB / 5 ثانیه) به‌همراه سقف هم‌زمان در حال اجرا به‌ازای هر IP پیش از راستی‌آزمایی امضا استفاده می‌کند.

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

وقتی Gateway از قبل در حال اجرا است، دستورهای عملیاتی `voicecall` به زمان‌اجرای تماس صوتی متعلق به Gateway واگذار می‌شوند تا CLI یک سرور Webhook دوم را bind نکند. اگر هیچ Gateway در دسترس نباشد، دستورها به زمان‌اجرای مستقل CLI برمی‌گردند.

`latency` فایل `calls.jsonl` را از مسیر پیش‌فرض ذخیره‌سازی تماس صوتی می‌خواند.
از `--file <path>` برای اشاره به گزارش دیگری و از `--last <n>` برای محدود کردن
تحلیل به آخرین N رکورد استفاده کنید (پیش‌فرض 200). خروجی شامل p50/p90/p99
برای تأخیر نوبت و زمان‌های انتظار شنیدن است.

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

این مخزن یک سند Skill متناظر را در `skills/voice-call/SKILL.md` ارائه می‌کند.

## RPC Gateway

| روش                 | آرگومان‌ها                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` فقط با `mode: "conversation"` معتبر است. تماس‌های حالت اعلان
اگر پس از برقراری تماس به ارقام پس از اتصال نیاز دارند، باید از `voicecall.dtmf`
استفاده کنند.

## عیب‌یابی

### راه‌اندازی در معرض‌گذاری Webhook ناموفق است

راه‌اندازی را از همان محیطی اجرا کنید که Gateway را اجرا می‌کند:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

برای `twilio`، `telnyx` و `plivo`، `webhook-exposure` باید سبز باشد. یک
`publicUrl` پیکربندی‌شده همچنان وقتی به فضای شبکه محلی یا خصوصی اشاره کند
ناموفق می‌شود، چون اپراتور نمی‌تواند به آن نشانی‌ها callback کند. از
`localhost`، `127.0.0.1`، `0.0.0.0`، `10.x`، `172.16.x`-`172.31.x`،
`192.168.x`، `169.254.x`، `fc00::/7` یا `fd00::/8` به‌عنوان `publicUrl` استفاده نکنید.

تماس‌های خروجی Twilio در حالت اعلان، TwiML اولیه `<Say>` خود را مستقیماً در
درخواست ایجاد تماس می‌فرستند، بنابراین نخستین پیام گفتاری به دریافت TwiML
Webhook توسط Twilio وابسته نیست. همچنان برای callbackهای وضعیت، تماس‌های
مکالمه، DTMF پیش از اتصال، جریان‌های بلادرنگ و کنترل تماس پس از اتصال به یک
Webhook عمومی نیاز است.

از یک مسیر در معرض‌گذاری عمومی استفاده کنید:

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

پس از تغییر پیکربندی، Gateway را راه‌اندازی مجدد یا reload کنید، سپس اجرا کنید:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` یک اجرای خشک است مگر اینکه `--yes` را ارسال کنید.

### اطلاعات اعتباری ارائه‌دهنده ناموفق است

ارائه‌دهنده انتخاب‌شده و فیلدهای اطلاعات اعتباری موردنیاز را بررسی کنید:

- Twilio: `twilio.accountSid`، `twilio.authToken` و `fromNumber`، یا
  `TWILIO_ACCOUNT_SID`، `TWILIO_AUTH_TOKEN` و `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`، `telnyx.connectionId`، `telnyx.publicKey` و
  `fromNumber`.
- Plivo: `plivo.authId`، `plivo.authToken` و `fromNumber`.

اطلاعات اعتباری باید روی میزبان Gateway وجود داشته باشد. ویرایش یک پروفایل
پوسته محلی تا زمانی که Gateway راه‌اندازی مجدد شود یا محیط خود را reload کند،
روی Gateway در حال اجرا اثری ندارد.

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

علت‌های رایج:

- `publicUrl` به مسیری متفاوت از `serve.path` اشاره می‌کند.
- URL تونل پس از شروع Gateway تغییر کرده است.
- یک پراکسی درخواست را فروارد می‌کند اما سرآیندهای host/proto را حذف یا بازنویسی می‌کند.
- فایروال یا DNS نام میزبان عمومی را به جایی غیر از Gateway هدایت می‌کند.
- Gateway بدون فعال بودن Plugin تماس صوتی راه‌اندازی مجدد شده است.

وقتی یک پراکسی معکوس یا تونل جلوی Gateway قرار دارد،
`webhookSecurity.allowedHosts` را روی نام میزبان عمومی تنظیم کنید، یا برای یک
نشانی پراکسی شناخته‌شده از `webhookSecurity.trustedProxyIPs` استفاده کنید. فقط
زمانی از `webhookSecurity.trustForwardingHeaders` استفاده کنید که مرز پراکسی
تحت کنترل شما باشد.

### راستی‌آزمایی امضا ناموفق است

امضاهای ارائه‌دهنده در برابر URL عمومی‌ای بررسی می‌شوند که OpenClaw از
درخواست ورودی بازسازی می‌کند. اگر امضاها ناموفق شدند:

- تأیید کنید URL Webhook ارائه‌دهنده دقیقاً با `publicUrl`، شامل scheme، host و path، مطابقت دارد.
- برای URLهای سطح رایگان ngrok، وقتی نام میزبان تونل تغییر می‌کند `publicUrl` را به‌روزرسانی کنید.
- مطمئن شوید پراکسی سرآیندهای host و proto اصلی را حفظ می‌کند، یا `webhookSecurity.allowedHosts` را پیکربندی کنید.
- `skipSignatureVerification` را خارج از آزمون محلی فعال نکنید.

### اتصال‌های Twilio به Google Meet ناموفق هستند

Google Meet از این Plugin برای اتصال‌های شماره‌گیری ورودی Twilio استفاده می‌کند. ابتدا Voice Call را راستی‌آزمایی کنید:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

سپس ترابری Google Meet را صریحاً راستی‌آزمایی کنید:

```bash
openclaw googlemeet setup --transport twilio
```

اگر Voice Call سبز است اما شرکت‌کننده Meet هرگز وارد نمی‌شود، شماره شماره‌گیری
ورودی Meet، PIN و `--dtmf-sequence` را بررسی کنید. تماس تلفنی می‌تواند سالم
باشد در حالی که جلسه یک توالی DTMF نادرست را رد یا نادیده می‌گیرد.

Google Meet شاخه تلفنی Twilio را از طریق `voicecall.start` با یک توالی DTMF
پیش از اتصال شروع می‌کند. توالی‌های مشتق‌شده از PIN شامل
`voiceCall.dtmfDelayMs` مربوط به Plugin Google Meet به‌عنوان ارقام انتظار
Twilio در ابتدا هستند. مقدار پیش‌فرض 12 ثانیه است، چون اعلان‌های شماره‌گیری
ورودی Meet ممکن است دیر برسند. سپس Voice Call پیش از درخواست خوشامدگویی آغازین
به مدیریت بلادرنگ redirect می‌کند.

برای ردیابی زنده فاز از `openclaw logs --follow` استفاده کنید. یک اتصال سالم
Twilio Meet این ترتیب را ثبت می‌کند:

- Google Meet اتصال Twilio را به Voice Call واگذار می‌کند.
- Voice Call‏ TwiML مربوط به DTMF پیش از اتصال را ذخیره می‌کند.
- TwiML اولیه Twilio مصرف و پیش از مدیریت بلادرنگ ارائه می‌شود.
- Voice Call‏ TwiML بلادرنگ را برای تماس Twilio ارائه می‌کند.
- Google Meet پس از تأخیر پس از DTMF، گفتار آغازین را با `voicecall.speak` درخواست می‌کند.

`openclaw voicecall tail` همچنان رکوردهای تماس ماندگارشده را نشان می‌دهد؛ برای
وضعیت تماس و رونوشت‌ها مفید است، اما هر گذار Webhook/بلادرنگ در آن ظاهر نمی‌شود.

### تماس بلادرنگ گفتار ندارد

تأیید کنید فقط یک حالت صوتی فعال است. `realtime.enabled` و
`streaming.enabled` نمی‌توانند هر دو true باشند.

برای تماس‌های بلادرنگ Twilio، همچنین راستی‌آزمایی کنید:

- یک Plugin ارائه‌دهنده بلادرنگ بارگذاری و ثبت شده است.
- `realtime.provider` تنظیم نشده یا نام یک ارائه‌دهنده ثبت‌شده را دارد.
- کلید API ارائه‌دهنده برای فرایند Gateway در دسترس است.
- `openclaw logs --follow` نشان می‌دهد TwiML بلادرنگ ارائه شده، پل بلادرنگ
  شروع شده و خوشامدگویی اولیه در صف قرار گرفته است.

## مرتبط

- [حالت مکالمه](/fa/nodes/talk)
- [تبدیل متن به گفتار](/fa/tools/tts)
- [بیدارباش صوتی](/fa/nodes/voicewake)
