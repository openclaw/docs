---
read_when:
    - می‌خواهید از OpenClaw یک تماس صوتی خروجی برقرار کنید
    - شما در حال پیکربندی یا توسعه Plugin تماس صوتی هستید
    - به صدای بلادرنگ یا رونویسی جریانی در بستر تلفنی نیاز دارید
sidebarTitle: Voice call
summary: برقراری تماس‌های صوتی خروجی و پذیرش تماس‌های صوتی ورودی از طریق Twilio، Telnyx یا Plivo، با امکان اختیاری صدای بلادرنگ و رونویسی جریانی
title: Plugin تماس صوتی
x-i18n:
    generated_at: "2026-05-02T22:24:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 18a9a0d7095ec92036b516cc26c69219a0a2fd9bb8e0cb2e7509123bb4f3f65a
    source_path: plugins/voice-call.md
    workflow: 16
---

تماس‌های صوتی برای OpenClaw از طریق یک Plugin. از اعلان‌های خروجی،
گفت‌وگوهای چندمرحله‌ای، صدای بلادرنگ تمام‌دوطرفه، رونویسی
جریانی، و تماس‌های ورودی با سیاست‌های فهرست مجاز پشتیبانی می‌کند.

**ارائه‌دهندگان فعلی:** `twilio` (Programmable Voice + Media Streams)،
`telnyx` (Call Control v2)، `plivo` (Voice API + XML transfer + GetInput
speech)، `mock` (توسعه/بدون شبکه).

<Note>
Plugin تماس صوتی **داخل فرایند Gateway** اجرا می‌شود. اگر از یک
Gateway راه دور استفاده می‌کنید، Plugin را روی ماشینی که Gateway را اجرا
می‌کند نصب و پیکربندی کنید، سپس Gateway را بازراه‌اندازی کنید تا آن را
بارگذاری کند.
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

    برای دنبال کردن برچسب انتشار رسمی فعلی، از بسته بدون نسخه استفاده کنید.
    فقط زمانی یک نسخه دقیق را pin کنید که به نصب بازتولیدپذیر نیاز دارید.

    پس از آن Gateway را بازراه‌اندازی کنید تا Plugin بارگذاری شود.

  </Step>
  <Step title="پیکربندی ارائه‌دهنده و Webhook">
    پیکربندی را زیر `plugins.entries.voice-call.config` تنظیم کنید (برای شکل
    کامل، [پیکربندی](#configuration) را در پایین ببینید). حداقل موارد لازم:
    `provider`، اعتبارنامه‌های ارائه‌دهنده، `fromNumber`، و یک URL مربوط به
    Webhook که به‌صورت عمومی قابل دسترسی باشد.
  </Step>
  <Step title="اعتبارسنجی راه‌اندازی">
    ```bash
    openclaw voicecall setup
    ```

    خروجی پیش‌فرض در لاگ‌های چت و ترمینال‌ها خواناست. فعال بودن
    Plugin، اعتبارنامه‌های ارائه‌دهنده، در معرض دسترس بودن Webhook، و این را
    بررسی می‌کند که فقط یک حالت صوتی (`streaming` یا `realtime`) فعال باشد.
    برای اسکریپت‌ها از `--json` استفاده کنید.

  </Step>
  <Step title="آزمون دود">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    هر دو به‌صورت پیش‌فرض اجرای آزمایشی بدون اثر هستند. برای اینکه واقعا یک
    تماس اعلان خروجی کوتاه برقرار شود، `--yes` را اضافه کنید:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
برای Twilio، Telnyx، و Plivo، راه‌اندازی باید به یک **URL عمومی Webhook** resolve شود.
اگر `publicUrl`، URL تونل، URL مربوط به Tailscale، یا fallback سرو، به loopback
یا فضای شبکه خصوصی resolve شود، راه‌اندازی به‌جای شروع ارائه‌دهنده‌ای که
نمی‌تواند Webhookهای اپراتور را دریافت کند، شکست می‌خورد.
</Warning>

## پیکربندی

اگر `enabled: true` باشد اما اعتبارنامه‌های ارائه‌دهنده انتخاب‌شده موجود
نباشد، شروع Gateway یک هشدار setup-incomplete همراه با کلیدهای مفقود لاگ
می‌کند و از شروع runtime صرف‌نظر می‌کند. فرمان‌ها، فراخوانی‌های RPC، و
ابزارهای agent همچنان هنگام استفاده، پیکربندی دقیق مفقود ارائه‌دهنده را
برمی‌گردانند.

<Note>
اعتبارنامه‌های تماس صوتی SecretRefها را می‌پذیرند. `plugins.entries.voice-call.config.twilio.authToken`، `plugins.entries.voice-call.config.realtime.providers.*.apiKey`، `plugins.entries.voice-call.config.streaming.providers.*.apiKey`، و `plugins.entries.voice-call.config.tts.providers.*.apiKey` از طریق سطح استاندارد SecretRef resolve می‌شوند؛ [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface) را ببینید.
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
  <Accordion title="نکات ارائه و امنیت ارائه‌دهنده">
    - Twilio، Telnyx، و Plivo همگی به یک URL مربوط به Webhook نیاز دارند که **به‌صورت عمومی قابل دسترسی** باشد.
    - `mock` یک ارائه‌دهنده توسعه محلی است (بدون فراخوانی شبکه).
    - Telnyx به `telnyx.publicKey` (یا `TELNYX_PUBLIC_KEY`) نیاز دارد مگر اینکه `skipSignatureVerification` برابر true باشد.
    - `skipSignatureVerification` فقط برای تست محلی است.
    - در سطح رایگان ngrok، `publicUrl` را روی URL دقیق ngrok تنظیم کنید؛ اعتبارسنجی امضا همیشه اعمال می‌شود.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` فقط زمانی به Twilio Webhookها با امضاهای نامعتبر اجازه می‌دهد که `tunnel.provider="ngrok"` و `serve.bind` برابر loopback باشد (عامل محلی ngrok). فقط برای توسعه محلی.
    - URLهای سطح رایگان Ngrok ممکن است تغییر کنند یا رفتار میان‌صفحه اضافه کنند؛ اگر `publicUrl` جابه‌جا شود، امضاهای Twilio شکست می‌خورند. تولید: یک دامنه پایدار یا یک funnel در Tailscale را ترجیح دهید.

  </Accordion>
  <Accordion title="سقف‌های اتصال جریانی">
    - `streaming.preStartTimeoutMs` سوکت‌هایی را می‌بندد که هرگز یک قاب `start` معتبر نمی‌فرستند.
    - `streaming.maxPendingConnections` سقف کل سوکت‌های pre-start احرازنشده را تعیین می‌کند.
    - `streaming.maxPendingConnectionsPerIp` سقف سوکت‌های pre-start احرازنشده را برای هر IP مبدأ تعیین می‌کند.
    - `streaming.maxConnections` سقف کل سوکت‌های باز stream رسانه را تعیین می‌کند (در انتظار + فعال).

  </Accordion>
  <Accordion title="مهاجرت‌های پیکربندی قدیمی">
    پیکربندی‌های قدیمی‌تر که از `provider: "log"`، `twilio.from`، یا کلیدهای
    قدیمی `streaming.*` مربوط به OpenAI استفاده می‌کنند، با `openclaw doctor --fix`
    بازنویسی می‌شوند. fallback زمان اجرا فعلا همچنان کلیدهای قدیمی voice-call را
    می‌پذیرد، اما مسیر بازنویسی `openclaw doctor --fix` است و shim سازگاری
    موقتی است.

    کلیدهای جریانی مهاجرت‌شده خودکار:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## دامنه جلسه

به‌صورت پیش‌فرض، تماس صوتی از `sessionScope: "per-phone"` استفاده می‌کند تا
تماس‌های تکراری از همان تماس‌گیرنده حافظه گفت‌وگو را حفظ کنند. وقتی هر تماس
اپراتور باید با زمینه تازه شروع شود، `sessionScope: "per-call"` را تنظیم کنید؛
برای مثال جریان‌های پذیرش، رزرو، IVR، یا پل Google Meet که در آن‌ها همان
شماره تلفن ممکن است نماینده جلسه‌های متفاوت باشد.

## گفت‌وگوهای صوتی بلادرنگ

`realtime` یک ارائه‌دهنده صدای بلادرنگ تمام‌دوطرفه را برای صدای تماس زنده
انتخاب می‌کند. این از `streaming` جداست؛ `streaming` فقط صدا را به
ارائه‌دهندگان رونویسی بلادرنگ می‌فرستد.

<Warning>
`realtime.enabled` نمی‌تواند با `streaming.enabled` ترکیب شود. برای هر تماس
یک حالت صوتی انتخاب کنید.
</Warning>

رفتار فعلی runtime:

- `realtime.enabled` برای Twilio Media Streams پشتیبانی می‌شود.
- `realtime.provider` اختیاری است. اگر تنظیم نشود، Voice Call از اولین ارائه‌دهنده ثبت‌شده صدای بلادرنگ استفاده می‌کند.
- ارائه‌دهندگان همراه صدای بلادرنگ: Google Gemini Live (`google`) و OpenAI (`openai`)، که توسط Pluginهای ارائه‌دهنده خودشان ثبت می‌شوند.
- پیکربندی خام تحت مالکیت ارائه‌دهنده زیر `realtime.providers.<providerId>` قرار می‌گیرد.
- Voice Call به‌صورت پیش‌فرض ابزار بلادرنگ مشترک `openclaw_agent_consult` را ارائه می‌کند. مدل بلادرنگ وقتی تماس‌گیرنده استدلال عمیق‌تر، اطلاعات فعلی، یا ابزارهای عادی OpenClaw را می‌خواهد، می‌تواند آن را فراخوانی کند.
- `realtime.fastContext.enabled` به‌صورت پیش‌فرض خاموش است. وقتی فعال باشد، Voice Call ابتدا حافظه/زمینه جلسه indexشده را برای پرسش consult جست‌وجو می‌کند و پیش از fallback به agent کامل consult فقط در صورتی که `realtime.fastContext.fallbackToConsult` برابر true باشد، آن قطعه‌ها را در بازه `realtime.fastContext.timeoutMs` به مدل بلادرنگ برمی‌گرداند.
- اگر `realtime.provider` به یک ارائه‌دهنده ثبت‌نشده اشاره کند، یا اصلا هیچ ارائه‌دهنده صدای بلادرنگی ثبت نشده باشد، Voice Call به‌جای شکست دادن کل Plugin، یک هشدار لاگ می‌کند و از رسانه بلادرنگ صرف‌نظر می‌کند.
- کلیدهای جلسه consult در صورت وجود از جلسه تماس ذخیره‌شده دوباره استفاده می‌کنند، سپس به `sessionScope` پیکربندی‌شده fallback می‌کنند (`per-phone` به‌صورت پیش‌فرض، یا `per-call` برای تماس‌های ایزوله).

### سیاست ابزار

`realtime.toolPolicy` اجرای consult را کنترل می‌کند:

| سیاست           | رفتار                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | ابزار consult را ارائه می‌کند و agent عادی را به `read`، `web_search`، `web_fetch`، `x_search`، `memory_search`، و `memory_get` محدود می‌کند. |
| `owner`          | ابزار consult را ارائه می‌کند و به agent عادی اجازه می‌دهد از سیاست ابزار عادی agent استفاده کند.                                                      |
| `none`           | ابزار consult را ارائه نمی‌کند. `realtime.tools` سفارشی همچنان به ارائه‌دهنده بلادرنگ منتقل می‌شود.                               |

### نمونه‌های ارائه‌دهنده بلادرنگ

<Tabs>
  <Tab title="Google Gemini Live">
    پیش‌فرض‌ها: کلید API از `realtime.providers.google.apiKey`،
    `GEMINI_API_KEY`، یا `GOOGLE_GENERATIVE_AI_API_KEY`؛ مدل
    `gemini-2.5-flash-native-audio-preview-12-2025`؛ صدا `Kore`.

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
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
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

`streaming` یک ارائه‌دهنده رونویسی بلادرنگ را برای صدای تماس زنده انتخاب می‌کند.

رفتار فعلی runtime:

- `streaming.provider` اختیاری است. اگر تنظیم نشده باشد، تماس صوتی از اولین ارائه‌دهنده رونویسی بلادرنگ ثبت‌شده استفاده می‌کند.
- ارائه‌دهندگان رونویسی بلادرنگ همراه: Deepgram (`deepgram`)، ElevenLabs (`elevenlabs`)، Mistral (`mistral`)، OpenAI (`openai`) و xAI (`xai`) که توسط Pluginهای ارائه‌دهنده خود ثبت می‌شوند.
- پیکربندی خام متعلق به ارائه‌دهنده زیر `streaming.providers.<providerId>` قرار می‌گیرد.
- پس از اینکه Twilio پیام `start` یک استریم پذیرفته‌شده را می‌فرستد، تماس صوتی بلافاصله استریم را ثبت می‌کند، رسانه ورودی را تا زمان اتصال ارائه‌دهنده از طریق ارائه‌دهنده رونویسی در صف قرار می‌دهد و سلام اولیه را فقط پس از آماده‌شدن رونویسی بلادرنگ شروع می‌کند.
- اگر `streaming.provider` به ارائه‌دهنده‌ای ثبت‌نشده اشاره کند، یا هیچ ارائه‌دهنده‌ای ثبت نشده باشد، تماس صوتی یک هشدار ثبت می‌کند و به‌جای ناموفق‌کردن کل Plugin، استریم رسانه را رد می‌کند.

### نمونه‌های ارائه‌دهنده استریم

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

تماس صوتی از پیکربندی هسته `messages.tts` برای استریم گفتار در تماس‌ها
استفاده می‌کند. می‌توانید آن را در پیکربندی Plugin با **همان ساختار** بازنویسی کنید —
این پیکربندی با `messages.tts` به‌صورت عمیق ادغام می‌شود.

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
انتقال فعلی Microsoft خروجی PCM تلفنی را در دسترس نمی‌گذارد.
</Warning>

نکات رفتاری:

- کلیدهای قدیمی `tts.<provider>` داخل پیکربندی Plugin (`openai`، `elevenlabs`، `microsoft`، `edge`) توسط `openclaw doctor --fix` ترمیم می‌شوند؛ پیکربندی ثبت‌شده باید از `tts.providers.<provider>` استفاده کند.
- وقتی استریم رسانه Twilio فعال باشد، TTS هسته استفاده می‌شود؛ در غیر این صورت تماس‌ها به صداهای بومی ارائه‌دهنده برمی‌گردند.
- اگر یک استریم رسانه Twilio از قبل فعال باشد، تماس صوتی به TwiML `<Say>` برنمی‌گردد. اگر TTS تلفنی در آن وضعیت در دسترس نباشد، درخواست پخش به‌جای ترکیب دو مسیر پخش ناموفق می‌شود.
- وقتی TTS تلفنی به یک ارائه‌دهنده ثانویه برمی‌گردد، تماس صوتی برای اشکال‌زدایی هشداری همراه با زنجیره ارائه‌دهنده (`from`، `to`، `attempts`) ثبت می‌کند.
- وقتی ورود هم‌زمان Twilio یا برچیدن استریم صف معلق TTS را پاک می‌کند، درخواست‌های پخش صف‌شده به نتیجه می‌رسند به‌جای اینکه تماس‌گیرندگان را در انتظار تکمیل پخش معلق نگه دارند.

### نمونه‌های TTS

<Tabs>
  <Tab title="Core TTS only">
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
  <Tab title="Override to ElevenLabs (calls only)">
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
  <Tab title="OpenAI model override (deep-merge)">
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

خط‌مشی ورودی به‌طور پیش‌فرض `disabled` است. برای فعال‌کردن تماس‌های ورودی، تنظیم کنید:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` یک غربال‌گری شناسه تماس‌گیرنده با اطمینان پایین است.
Plugin مقدار `From` ارائه‌شده توسط ارائه‌دهنده را نرمال‌سازی می‌کند و آن را با
`allowFrom` مقایسه می‌کند. تأیید Webhook تحویل ارائه‌دهنده و
یکپارچگی payload را احراز می‌کند، اما مالکیت شماره تماس‌گیرنده PSTN/VoIP را
**ثابت نمی‌کند**. با `allowFrom` به‌عنوان فیلتر شناسه تماس‌گیرنده رفتار کنید، نه هویت
قوی تماس‌گیرنده.
</Warning>

پاسخ‌های خودکار از سامانه عامل استفاده می‌کنند. با `responseModel`،
`responseSystemPrompt` و `responseTimeoutMs` تنظیم کنید.

### مسیریابی برای هر شماره

وقتی یک Plugin تماس صوتی تماس‌های چند شماره تلفن را دریافت می‌کند و هر شماره
باید مانند یک خط متفاوت رفتار کند، از `numbers` استفاده کنید. برای مثال، یک
شماره می‌تواند از یک دستیار شخصی غیررسمی استفاده کند در حالی که شماره‌ای دیگر از یک شخصیت
کاری، یک عامل پاسخ متفاوت و یک صدای TTS متفاوت استفاده می‌کند.

مسیرها از شماره `To` شماره‌گیری‌شده و ارائه‌شده توسط ارائه‌دهنده انتخاب می‌شوند. کلیدها باید
شماره‌های E.164 باشند. وقتی تماسی وارد می‌شود، تماس صوتی مسیر مطابق را یک‌بار حل می‌کند،
مسیر مطابق را در رکورد تماس ذخیره می‌کند و همان پیکربندی مؤثر را برای
سلام، مسیر پاسخ خودکار کلاسیک، مسیر مشاوره بلادرنگ و پخش TTS
بازاستفاده می‌کند. اگر هیچ مسیری مطابق نباشد، پیکربندی سراسری تماس صوتی استفاده می‌شود.
تماس‌های خروجی از `numbers` استفاده نمی‌کنند؛ هنگام شروع تماس، مقصد خروجی، پیام و
نشست را صریحاً ارسال کنید.

بازنویسی‌های مسیر در حال حاضر پشتیبانی می‌کنند از:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

مقدار مسیر `tts` روی پیکربندی سراسری `tts` تماس صوتی به‌صورت عمیق ادغام می‌شود، بنابراین
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

برای پاسخ‌های خودکار، تماس صوتی یک قرارداد سخت‌گیرانه خروجی گفتاری را به
پرامپت سیستم اضافه می‌کند:

```text
{"spoken":"..."}
```

تماس صوتی متن گفتار را به‌صورت تدافعی استخراج می‌کند:

- payloadهایی را که به‌عنوان محتوای استدلال/خطا علامت‌گذاری شده‌اند نادیده می‌گیرد.
- JSON مستقیم، JSON حصارگذاری‌شده یا کلیدهای درون‌خطی `"spoken"` را تجزیه می‌کند.
- به متن ساده برمی‌گردد و پاراگراف‌های آغازین محتملِ برنامه‌ریزی/فرا را حذف می‌کند.

این کار پخش گفتاری را روی متن روبه‌روی تماس‌گیرنده متمرکز نگه می‌دارد و از
نشت متن برنامه‌ریزی به صدا جلوگیری می‌کند.

### رفتار شروع مکالمه

برای تماس‌های خروجی `conversation`، مدیریت پیام اول به وضعیت پخش زنده
وابسته است:

- پاک‌سازی صف ورود هم‌زمان و پاسخ خودکار فقط زمانی سرکوب می‌شوند که سلام اولیه فعالانه در حال صحبت باشد.
- اگر پخش اولیه ناموفق شود، تماس به `listening` برمی‌گردد و پیام اولیه برای تلاش دوباره در صف می‌ماند.
- پخش اولیه برای استریم Twilio هنگام اتصال استریم و بدون تأخیر اضافی شروع می‌شود.
- ورود هم‌زمان پخش فعال را لغو می‌کند و ورودی‌های Twilio TTS صف‌شده اما هنوز پخش‌نشده را پاک می‌کند. ورودی‌های پاک‌شده به‌عنوان ردشده resolve می‌شوند، بنابراین منطق پاسخ بعدی می‌تواند بدون انتظار برای صدایی که هرگز پخش نخواهد شد ادامه دهد.
- مکالمات صوتی بلادرنگ از نوبت آغازین خود استریم بلادرنگ استفاده می‌کنند. تماس صوتی برای آن پیام اولیه، به‌روزرسانی قدیمی TwiML `<Say>` ارسال **نمی‌کند**، بنابراین نشست‌های خروجی `<Connect><Stream>` متصل باقی می‌مانند.

### مهلت قطع اتصال استریم Twilio

وقتی یک استریم رسانه Twilio قطع می‌شود، تماس صوتی پیش از
پایان خودکار تماس **2000 ms** منتظر می‌ماند:

- اگر استریم در آن بازه دوباره وصل شود، پایان خودکار لغو می‌شود.
- اگر پس از دوره مهلت هیچ استریمی دوباره ثبت نشود، تماس پایان داده می‌شود تا از گیرکردن تماس‌های فعال جلوگیری شود.

## پاک‌کننده تماس کهنه

از `staleCallReaperSeconds` برای پایان‌دادن به تماس‌هایی استفاده کنید که هرگز یک
Webhook پایانی دریافت نمی‌کنند (برای مثال، تماس‌های حالت اعلان که هرگز کامل نمی‌شوند). مقدار پیش‌فرض
`0` است (غیرفعال).

بازه‌های پیشنهادی:

- **تولید:** `120` تا `300` ثانیه برای جریان‌های سبک اعلان.
- این مقدار را **بالاتر از `maxDurationSeconds`** نگه دارید تا تماس‌های عادی بتوانند تمام شوند. نقطه شروع خوب `maxDurationSeconds + 30–60` ثانیه است.

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
نشانی URL عمومی را برای تأیید امضا بازسازی می‌کند. این گزینه‌ها
کنترل می‌کنند کدام سربرگ‌های فورواردشده قابل اعتماد باشند:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  میزبان‌های allowlist از سربرگ‌های فورواردینگ.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  اعتماد به سربرگ‌های فورواردشده بدون allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  فقط زمانی به سربرگ‌های فورواردشده اعتماد کنید که IP راه‌دور درخواست با فهرست مطابق باشد.
</ParamField>

محافظت‌های اضافی:

- **محافظت در برابر بازپخش** Webhook برای Twilio و Plivo فعال است. درخواست‌های معتبر Webhook که بازپخش شده‌اند تأیید می‌شوند اما برای اثرات جانبی رد می‌شوند.
- نوبت‌های مکالمه Twilio در callbackهای `<Gather>` شامل یک توکن برای هر نوبت هستند، بنابراین callbackهای گفتار کهنه/بازپخش‌شده نمی‌توانند یک نوبت transcript معلق جدیدتر را برآورده کنند.
- درخواست‌های Webhook احرازنشده، زمانی که سربرگ‌های امضای الزامی ارائه‌دهنده وجود نداشته باشند، پیش از خواندن بدنه رد می‌شوند.
- Webhook تماس صوتی از پروفایل مشترک بدنه پیش‌از‌احراز (64 KB / 5 ثانیه) به‌همراه سقف درحال‌پرواز برای هر IP پیش از تأیید امضا استفاده می‌کند.

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
runtime تماس صوتی متعلق به Gateway واگذار می‌شوند تا CLI یک سرور
Webhook دوم را bind نکند. اگر هیچ Gatewayی در دسترس نباشد، فرمان‌ها به یک
runtime مستقل CLI برمی‌گردند.

`latency`، `calls.jsonl` را از مسیر پیش‌فرض ذخیره‌سازی تماس صوتی می‌خواند.
از `--file <path>` برای اشاره به یک گزارش متفاوت و از `--last <n>` برای محدود کردن
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

این مخزن یک سند skill متناظر را در `skills/voice-call/SKILL.md` ارائه می‌کند.

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
اگر پس از اتصال به ارقام نیاز دارند، باید بعد از ایجاد تماس از `voicecall.dtmf`
استفاده کنند.

## عیب‌یابی

### راه‌اندازی در مواجهه با Webhook ناموفق می‌شود

راه‌اندازی را از همان محیطی اجرا کنید که Gateway را اجرا می‌کند:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

برای `twilio`، `telnyx` و `plivo`، `webhook-exposure` باید سبز باشد. یک
`publicUrl` پیکربندی‌شده همچنان وقتی به فضای شبکه محلی یا خصوصی اشاره کند
ناموفق می‌شود، چون اپراتور نمی‌تواند به آن نشانی‌ها بازتماس انجام دهد. از
`localhost`، `127.0.0.1`، `0.0.0.0`، `10.x`، `172.16.x`-`172.31.x`،
`192.168.x`، `169.254.x`، `fc00::/7`، یا `fd00::/8` به عنوان `publicUrl`
استفاده نکنید.

تماس‌های خروجی حالت اعلان Twilio، TwiML اولیه `<Say>` خود را مستقیماً در
درخواست ایجاد تماس ارسال می‌کنند، بنابراین نخستین پیام گفتاری به دریافت TwiML
Webhook توسط Twilio وابسته نیست. Webhook عمومی همچنان برای callbackهای وضعیت،
تماس‌های مکالمه، DTMF پیش از اتصال، جریان‌های بلادرنگ و کنترل تماس پس از اتصال
لازم است.

از یک مسیر مواجهه عمومی استفاده کنید:

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

پس از تغییر پیکربندی، Gateway را بازراه‌اندازی یا بازبارگذاری کنید، سپس اجرا کنید:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` یک اجرای آزمایشی خشک است مگر اینکه `--yes` را بدهید.

### اعتبارنامه‌های ارائه‌دهنده ناموفق می‌شوند

ارائه‌دهنده انتخاب‌شده و فیلدهای اعتبارنامه لازم را بررسی کنید:

- Twilio: `twilio.accountSid`، `twilio.authToken` و `fromNumber`، یا
  `TWILIO_ACCOUNT_SID`، `TWILIO_AUTH_TOKEN` و `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`، `telnyx.connectionId`، `telnyx.publicKey` و
  `fromNumber`.
- Plivo: `plivo.authId`، `plivo.authToken` و `fromNumber`.

اعتبارنامه‌ها باید روی میزبان Gateway وجود داشته باشند. ویرایش یک پروفایل پوسته
محلی تا زمانی که Gateway محیط خود را بازراه‌اندازی یا بازبارگذاری نکند، روی
Gateway در حال اجرا اثر نمی‌گذارد.

### تماس‌ها شروع می‌شوند اما Webhookهای ارائه‌دهنده نمی‌رسند

تأیید کنید کنسول ارائه‌دهنده دقیقاً به URL عمومی Webhook اشاره می‌کند:

```text
https://voice.example.com/voice/webhook
```

سپس وضعیت زمان اجرا را بررسی کنید:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

علت‌های رایج:

- `publicUrl` به مسیری متفاوت از `serve.path` اشاره می‌کند.
- URL تونل پس از شروع Gateway تغییر کرده است.
- یک پراکسی درخواست را ارسال می‌کند اما سرآیندهای host/proto را حذف یا بازنویسی می‌کند.
- دیوار آتش یا DNS نام میزبان عمومی را به جایی غیر از Gateway مسیریابی می‌کند.
- Gateway بدون فعال بودن Plugin تماس صوتی بازراه‌اندازی شده است.

وقتی یک پراکسی معکوس یا تونل جلوی Gateway قرار دارد، `webhookSecurity.allowedHosts`
را روی نام میزبان عمومی تنظیم کنید، یا برای نشانی شناخته‌شده پراکسی از
`webhookSecurity.trustedProxyIPs` استفاده کنید. فقط زمانی از
`webhookSecurity.trustForwardingHeaders` استفاده کنید که مرز پراکسی تحت کنترل
شماست.

### راستی‌آزمایی امضا ناموفق می‌شود

امضاهای ارائه‌دهنده در برابر URL عمومی‌ای بررسی می‌شوند که OpenClaw از درخواست
ورودی بازسازی می‌کند. اگر امضاها ناموفق شوند:

- تأیید کنید URL Webhook ارائه‌دهنده دقیقاً با `publicUrl` مطابق است، از جمله
  scheme، host و path.
- برای URLهای سطح رایگان ngrok، وقتی نام میزبان تونل تغییر می‌کند `publicUrl` را به‌روزرسانی کنید.
- مطمئن شوید پراکسی سرآیندهای اصلی host و proto را حفظ می‌کند، یا
  `webhookSecurity.allowedHosts` را پیکربندی کنید.
- خارج از آزمون محلی، `skipSignatureVerification` را فعال نکنید.

### اتصال‌های Google Meet با Twilio ناموفق می‌شوند

Google Meet از این Plugin برای اتصال‌های شماره‌گیری ورودی Twilio استفاده می‌کند. ابتدا Voice Call را تأیید کنید:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

سپس انتقال Google Meet را صراحتاً تأیید کنید:

```bash
openclaw googlemeet setup --transport twilio
```

اگر Voice Call سبز است اما شرکت‌کننده Meet هرگز وصل نمی‌شود، شماره شماره‌گیری
ورودی Meet، PIN و `--dtmf-sequence` را بررسی کنید. تماس تلفنی می‌تواند سالم باشد
در حالی که جلسه یک دنباله DTMF نادرست را رد یا نادیده می‌گیرد.

Google Meet دنباله DTMF و متن مقدمه Meet را به `voicecall.start` می‌فرستد.
برای تماس‌های Twilio، Voice Call ابتدا TwiML مربوط به DTMF را سرو می‌کند، سپس
به Webhook برمی‌گرداند، و بعد جریان رسانه بلادرنگ را باز می‌کند تا مقدمه
ذخیره‌شده پس از پیوستن شرکت‌کننده تلفنی به جلسه تولید شود.

برای ردگیری زنده مرحله از `openclaw logs --follow` استفاده کنید. یک اتصال سالم
Twilio Meet این ترتیب را ثبت می‌کند:

- Google Meet اتصال Twilio را به Voice Call واگذار می‌کند.
- Voice Call، TwiML مربوط به DTMF پیش از اتصال را ذخیره می‌کند.
- TwiML اولیه Twilio پیش از پردازش بلادرنگ مصرف و سرو می‌شود.
- Voice Call، TwiML بلادرنگ را برای تماس Twilio سرو می‌کند.
- پل بلادرنگ با سلام اولیه در صف شروع می‌شود.

`openclaw voicecall tail` همچنان رکوردهای تماس پایدارشده را نشان می‌دهد؛ برای
وضعیت تماس و رونوشت‌ها مفید است، اما هر گذار Webhook/بلادرنگ در آن ظاهر نمی‌شود.

### تماس بلادرنگ گفتار ندارد

تأیید کنید فقط یک حالت صوتی فعال است. `realtime.enabled` و
`streaming.enabled` نمی‌توانند هر دو true باشند.

برای تماس‌های بلادرنگ Twilio، این موارد را نیز تأیید کنید:

- یک Plugin ارائه‌دهنده بلادرنگ بارگذاری و ثبت شده است.
- `realtime.provider` تنظیم نشده یا نام یک ارائه‌دهنده ثبت‌شده را دارد.
- کلید API ارائه‌دهنده برای فرایند Gateway در دسترس است.
- `openclaw logs --follow` نشان می‌دهد TwiML بلادرنگ سرو شده، پل بلادرنگ
  شروع شده، و سلام اولیه در صف قرار گرفته است.

## مرتبط

- [حالت گفت‌وگو](/fa/nodes/talk)
- [متن به گفتار](/fa/tools/tts)
- [بیدارسازی صوتی](/fa/nodes/voicewake)
