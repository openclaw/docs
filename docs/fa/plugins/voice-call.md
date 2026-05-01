---
read_when:
    - می‌خواهید یک تماس صوتی خروجی از OpenClaw برقرار کنید
    - شما در حال پیکربندی یا توسعه Plugin تماس صوتی هستید
    - به مکالمه صوتی بلادرنگ یا رونویسی جریانی در بستر تلفنی نیاز دارید
sidebarTitle: Voice call
summary: برقراری تماس‌های صوتی خروجی و پذیرش تماس‌های صوتی ورودی از طریق Twilio، Telnyx یا Plivo، با صدای بلادرنگ و رونویسی جریانی اختیاری
title: Plugin تماس صوتی
x-i18n:
    generated_at: "2026-05-01T11:51:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: cde64fa054743d4ed3f146042bd65532af0e9eb5b792b088a856889b3d2cb3c9
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
Gateway راه‌دور استفاده می‌کنید، Plugin را روی ماشینی که Gateway روی آن اجرا می‌شود
نصب و پیکربندی کنید، سپس Gateway را برای بارگذاری آن بازراه‌اندازی کنید.
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

    اگر npm بسته متعلق به OpenClaw را منسوخ گزارش کرد، آن نسخه بسته
    مربوط به یک قطار بسته خارجی قدیمی‌تر است؛ تا زمانی که بسته npm جدیدتری منتشر شود،
    از یک بیلد بسته‌بندی‌شده فعلی OpenClaw یا مسیر پوشه محلی استفاده کنید.

    پس از آن Gateway را بازراه‌اندازی کنید تا Plugin بارگذاری شود.

  </Step>
  <Step title="پیکربندی ارائه‌دهنده و Webhook">
    پیکربندی را زیر `plugins.entries.voice-call.config` تنظیم کنید (برای شکل کامل،
    [پیکربندی](#configuration) را در ادامه ببینید). حداقل موارد لازم:
    `provider`، اعتبارنامه‌های ارائه‌دهنده، `fromNumber`، و یک URL وبهوک
    قابل دسترس عمومی است.
  </Step>
  <Step title="تأیید راه‌اندازی">
    ```bash
    openclaw voicecall setup
    ```

    خروجی پیش‌فرض در گزارش‌های گفت‌وگو و پایانه‌ها خوانا است. این دستور
    فعال بودن Plugin، اعتبارنامه‌های ارائه‌دهنده، در معرض بودن Webhook، و اینکه
    فقط یک حالت صوتی (`streaming` یا `realtime`) فعال باشد را بررسی می‌کند. برای
    اسکریپت‌ها از `--json` استفاده کنید.

  </Step>
  <Step title="آزمون Smoke">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    هر دو به‌صورت پیش‌فرض اجرای آزمایشی هستند. برای برقرار کردن واقعی یک تماس
    اعلان خروجی کوتاه، `--yes` را اضافه کنید:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
برای Twilio، Telnyx و Plivo، راه‌اندازی باید به یک **URL وبهوک عمومی** ختم شود.
اگر `publicUrl`، URL تونل، URL مربوط به Tailscale، یا جایگزین serve
به loopback یا فضای شبکه خصوصی ختم شود، راه‌اندازی به‌جای شروع کردن
ارائه‌دهنده‌ای که نمی‌تواند Webhookهای اپراتوری را دریافت کند، شکست می‌خورد.
</Warning>

## پیکربندی

اگر `enabled: true` باشد اما ارائه‌دهنده انتخاب‌شده اعتبارنامه‌ها را نداشته باشد،
شروع Gateway یک هشدار راه‌اندازی ناقص با کلیدهای مفقود ثبت می‌کند و
از شروع runtime صرف‌نظر می‌کند. فرمان‌ها، فراخوانی‌های RPC، و ابزارهای عامل همچنان
هنگام استفاده، همان پیکربندی مفقود ارائه‌دهنده را برمی‌گردانند.

<Note>
اعتبارنامه‌های تماس صوتی SecretRef را می‌پذیرند. `plugins.entries.voice-call.config.twilio.authToken`، `plugins.entries.voice-call.config.realtime.providers.*.apiKey`، `plugins.entries.voice-call.config.streaming.providers.*.apiKey`، و `plugins.entries.voice-call.config.tts.providers.*.apiKey` از طریق سطح استاندارد SecretRef resolve می‌شوند؛ [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface) را ببینید.
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
    - Twilio، Telnyx و Plivo همگی به یک URL وبهوک **قابل دسترس عمومی** نیاز دارند.
    - `mock` یک ارائه‌دهنده توسعه محلی است (بدون فراخوانی شبکه).
    - Telnyx به `telnyx.publicKey` (یا `TELNYX_PUBLIC_KEY`) نیاز دارد مگر اینکه `skipSignatureVerification` برابر true باشد.
    - `skipSignatureVerification` فقط برای آزمون محلی است.
    - در سطح رایگان ngrok، `publicUrl` را روی URL دقیق ngrok تنظیم کنید؛ تأیید امضا همیشه اعمال می‌شود.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` به Webhookهای Twilio با امضاهای نامعتبر **فقط** زمانی اجازه می‌دهد که `tunnel.provider="ngrok"` باشد و `serve.bind` برابر loopback باشد (عامل محلی ngrok). فقط برای توسعه محلی.
    - URLهای سطح رایگان ngrok ممکن است تغییر کنند یا رفتار میان‌صفحه‌ای اضافه کنند؛ اگر `publicUrl` منحرف شود، امضاهای Twilio شکست می‌خورند. تولید: یک دامنه پایدار یا یک funnel مربوط به Tailscale را ترجیح دهید.

  </Accordion>
  <Accordion title="سقف‌های اتصال جریانی">
    - `streaming.preStartTimeoutMs` سوکت‌هایی را که هرگز یک فریم `start` معتبر ارسال نمی‌کنند می‌بندد.
    - `streaming.maxPendingConnections` مجموع سوکت‌های پیش از شروعِ احرازنشده را محدود می‌کند.
    - `streaming.maxPendingConnectionsPerIp` سوکت‌های پیش از شروعِ احرازنشده را به‌ازای هر IP مبدأ محدود می‌کند.
    - `streaming.maxConnections` مجموع سوکت‌های جریان رسانه باز را محدود می‌کند (در انتظار + فعال).

  </Accordion>
  <Accordion title="مهاجرت‌های پیکربندی قدیمی">
    پیکربندی‌های قدیمی‌تری که از `provider: "log"`، `twilio.from`، یا کلیدهای قدیمی
    OpenAI در `streaming.*` استفاده می‌کنند، توسط `openclaw doctor --fix` بازنویسی می‌شوند.
    fallback زمان اجرا فعلاً هنوز کلیدهای قدیمی voice-call را می‌پذیرد، اما
    مسیر بازنویسی `openclaw doctor --fix` است و shim سازگاری
    موقتی است.

    کلیدهای جریانی مهاجرت‌شده خودکار:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## گفت‌وگوهای صوتی بلادرنگ

`realtime` یک ارائه‌دهنده صدای بلادرنگ تمام‌دوطرفه را برای صدای زنده تماس
انتخاب می‌کند. این از `streaming` جدا است، که فقط صدا را به
ارائه‌دهندگان رونویسی بلادرنگ ارسال می‌کند.

<Warning>
`realtime.enabled` نمی‌تواند با `streaming.enabled` ترکیب شود. برای هر تماس
یک حالت صوتی انتخاب کنید.
</Warning>

رفتار زمان اجرای فعلی:

- `realtime.enabled` برای Twilio Media Streams پشتیبانی می‌شود.
- `realtime.provider` اختیاری است. اگر تنظیم نشده باشد، Voice Call از نخستین ارائه‌دهنده صدای بلادرنگ ثبت‌شده استفاده می‌کند.
- ارائه‌دهندگان صدای بلادرنگ همراه: Google Gemini Live (`google`) و OpenAI (`openai`)، که توسط Pluginهای ارائه‌دهنده خودشان ثبت می‌شوند.
- پیکربندی خام تحت مالکیت ارائه‌دهنده زیر `realtime.providers.<providerId>` قرار دارد.
- Voice Call ابزار بلادرنگ مشترک `openclaw_agent_consult` را به‌صورت پیش‌فرض در معرض می‌گذارد. وقتی تماس‌گیرنده استدلال عمیق‌تر، اطلاعات فعلی، یا ابزارهای عادی OpenClaw را درخواست کند، مدل بلادرنگ می‌تواند آن را فراخوانی کند.
- `realtime.fastContext.enabled` به‌صورت پیش‌فرض خاموش است. وقتی فعال باشد، Voice Call ابتدا حافظه/بافت نشست ایندکس‌شده را برای پرسش consult جست‌وجو می‌کند و آن قطعه‌ها را در بازه `realtime.fastContext.timeoutMs` به مدل بلادرنگ برمی‌گرداند، پیش از آنکه فقط در صورت true بودن `realtime.fastContext.fallbackToConsult` به عامل consult کامل fallback کند.
- اگر `realtime.provider` به یک ارائه‌دهنده ثبت‌نشده اشاره کند، یا هیچ ارائه‌دهنده صدای بلادرنگی اصلاً ثبت نشده باشد، Voice Call یک هشدار ثبت می‌کند و به‌جای شکست دادن کل Plugin، از رسانه بلادرنگ صرف‌نظر می‌کند.
- کلیدهای نشست consult در صورت موجود بودن از نشست صوتی موجود استفاده می‌کنند، سپس به شماره تلفن تماس‌گیرنده/گیرنده fallback می‌کنند تا فراخوانی‌های consult پیگیری در طول تماس بافت را حفظ کنند.

### سیاست ابزار

`realtime.toolPolicy` اجرای consult را کنترل می‌کند:

| سیاست           | رفتار                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | ابزار consult را در معرض بگذارید و عامل معمولی را به `read`، `web_search`، `web_fetch`، `x_search`، `memory_search`، و `memory_get` محدود کنید. |
| `owner`          | ابزار consult را در معرض بگذارید و اجازه دهید عامل معمولی از سیاست ابزار عامل عادی استفاده کند.                                                      |
| `none`           | ابزار consult را در معرض نگذارید. `realtime.tools` سفارشی همچنان به ارائه‌دهنده بلادرنگ عبور داده می‌شوند.                               |

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

`streaming` یک ارائه‌دهنده رونویسی بلادرنگ را برای صدای زنده تماس انتخاب می‌کند.

رفتار زمان اجرای فعلی:

- `streaming.provider` اختیاری است. اگر تنظیم نشده باشد، Voice Call از نخستین ارائه‌دهنده رونویسی بی‌درنگ ثبت‌شده استفاده می‌کند.
- ارائه‌دهندگان رونویسی بی‌درنگ همراه: Deepgram (`deepgram`)، ElevenLabs (`elevenlabs`)، Mistral (`mistral`)، OpenAI (`openai`) و xAI (`xai`) که توسط Pluginهای ارائه‌دهنده خود ثبت می‌شوند.
- پیکربندی خام متعلق به ارائه‌دهنده زیر `streaming.providers.<providerId>` قرار دارد.
- پس از اینکه Twilio یک پیام `start` برای جریان پذیرفته‌شده ارسال می‌کند، Voice Call جریان را بلافاصله ثبت می‌کند، رسانه ورودی را هنگام اتصال ارائه‌دهنده از طریق ارائه‌دهنده رونویسی در صف قرار می‌دهد و خوشامدگویی اولیه را فقط پس از آماده‌شدن رونویسی بی‌درنگ شروع می‌کند.
- اگر `streaming.provider` به یک ارائه‌دهنده ثبت‌نشده اشاره کند، یا هیچ ارائه‌دهنده‌ای ثبت نشده باشد، Voice Call به‌جای شکست‌دادن کل Plugin یک هشدار ثبت می‌کند و جریان‌دهی رسانه را رد می‌کند.

### نمونه‌های ارائه‌دهنده جریان‌دهی

<Tabs>
  <Tab title="OpenAI">
    پیش‌فرض‌ها: کلید API در `streaming.providers.openai.apiKey` یا
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
    پیش‌فرض‌ها: کلید API در `streaming.providers.xai.apiKey` یا `XAI_API_KEY`؛
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

Voice Call از پیکربندی اصلی `messages.tts` برای گفتار جریان‌یافته در تماس‌ها استفاده می‌کند. می‌توانید آن را زیر پیکربندی Plugin با **همان شکل** بازنویسی کنید — این پیکربندی با `messages.tts` به‌صورت عمیق ادغام می‌شود.

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
انتقال فعلی Microsoft خروجی PCM تلفنی را ارائه نمی‌کند.
</Warning>

نکات رفتاری:

- کلیدهای قدیمی `tts.<provider>` داخل پیکربندی Plugin (`openai`، `elevenlabs`، `microsoft`، `edge`) توسط `openclaw doctor --fix` تعمیر می‌شوند؛ پیکربندی commit‌شده باید از `tts.providers.<provider>` استفاده کند.
- وقتی جریان‌دهی رسانه Twilio فعال باشد، از TTS اصلی استفاده می‌شود؛ در غیر این صورت تماس‌ها به صداهای بومی ارائه‌دهنده بازمی‌گردند.
- اگر یک جریان رسانه Twilio از قبل فعال باشد، Voice Call به TwiML `<Say>` بازنمی‌گردد. اگر TTS تلفنی در آن وضعیت در دسترس نباشد، درخواست پخش به‌جای ترکیب دو مسیر پخش شکست می‌خورد.
- وقتی TTS تلفنی به یک ارائه‌دهنده ثانویه بازمی‌گردد، Voice Call برای اشکال‌زدایی هشداری با زنجیره ارائه‌دهنده (`from`، `to`، `attempts`) ثبت می‌کند.
- وقتی قطع گفتار توسط تماس‌گیرنده در Twilio یا برچیدن جریان، صف TTS در انتظار را پاک می‌کند، درخواست‌های پخش صف‌شده به نتیجه می‌رسند و تماس‌گیرندگان در انتظار تکمیل پخش معلق نمی‌مانند.

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

سیاست ورودی به‌طور پیش‌فرض `disabled` است. برای فعال‌کردن تماس‌های ورودی، تنظیم کنید:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` یک غربالگری شناسه تماس‌گیرنده با اطمینان پایین است. این
Plugin مقدار `From` ارائه‌شده توسط ارائه‌دهنده را عادی‌سازی می‌کند و آن را با
`allowFrom` مقایسه می‌کند. راستی‌آزمایی Webhook تحویل ارائه‌دهنده و
یکپارچگی بار داده را احراز هویت می‌کند، اما مالکیت شماره تماس‌گیرنده PSTN/VoIP را
**ثابت نمی‌کند**. با `allowFrom` به‌عنوان فیلتر شناسه تماس‌گیرنده برخورد کنید، نه هویت
قوی تماس‌گیرنده.
</Warning>

پاسخ‌های خودکار از سامانه عامل استفاده می‌کنند. با `responseModel`،
`responseSystemPrompt` و `responseTimeoutMs` تنظیم کنید.

### قرارداد خروجی گفتاری

برای پاسخ‌های خودکار، Voice Call یک قرارداد سخت‌گیرانه خروجی گفتاری را به
پرامپت سیستم اضافه می‌کند:

```text
{"spoken":"..."}
```

Voice Call متن گفتار را به‌صورت دفاعی استخراج می‌کند:

- بارهای داده علامت‌گذاری‌شده به‌عنوان محتوای استدلال/خطا را نادیده می‌گیرد.
- JSON مستقیم، JSON محصور، یا کلیدهای درون‌خطی `"spoken"` را تجزیه می‌کند.
- به متن ساده بازمی‌گردد و پاراگراف‌های آغازین محتملِ برنامه‌ریزی/فراداده را حذف می‌کند.

این کار پخش گفتاری را روی متن روبه‌روی تماس‌گیرنده متمرکز نگه می‌دارد و از
نشت متن برنامه‌ریزی به صدا جلوگیری می‌کند.

### رفتار شروع مکالمه

برای تماس‌های خروجی `conversation`، رسیدگی به پیام نخست به وضعیت پخش زنده
وابسته است:

- پاک‌سازی صف بر اثر قطع گفتار توسط تماس‌گیرنده و پاسخ خودکار فقط هنگامی سرکوب می‌شوند که خوشامدگویی اولیه فعالانه در حال صحبت باشد.
- اگر پخش اولیه شکست بخورد، تماس به `listening` بازمی‌گردد و پیام اولیه برای تلاش دوباره در صف می‌ماند.
- پخش اولیه برای جریان‌دهی Twilio هنگام اتصال جریان، بدون تأخیر اضافی شروع می‌شود.
- قطع گفتار توسط تماس‌گیرنده پخش فعال را متوقف می‌کند و ورودی‌های TTS مربوط به Twilio را که در صف هستند اما هنوز پخش نشده‌اند پاک می‌کند. ورودی‌های پاک‌شده به‌عنوان ردشده حل می‌شوند، بنابراین منطق پاسخ بعدی می‌تواند بدون انتظار برای صدایی که هرگز پخش نخواهد شد ادامه پیدا کند.
- مکالمه‌های صوتی بی‌درنگ از نوبت آغازین خود جریان بی‌درنگ استفاده می‌کنند. Voice Call برای آن پیام اولیه یک به‌روزرسانی TwiML قدیمی `<Say>` ارسال **نمی‌کند**، بنابراین نشست‌های خروجی `<Connect><Stream>` متصل می‌مانند.

### مهلت قطع اتصال جریان Twilio

وقتی یک جریان رسانه Twilio قطع می‌شود، Voice Call پیش از پایان خودکار تماس
**2000 میلی‌ثانیه** صبر می‌کند:

- اگر جریان در طول آن پنجره دوباره متصل شود، پایان خودکار لغو می‌شود.
- اگر پس از دوره مهلت هیچ جریانی دوباره ثبت نشود، تماس پایان داده می‌شود تا از تماس‌های فعال گیرکرده جلوگیری شود.

## پاک‌ساز تماس‌های کهنه

از `staleCallReaperSeconds` برای پایان‌دادن به تماس‌هایی استفاده کنید که هرگز یک
Webhook پایانی دریافت نمی‌کنند (برای مثال، تماس‌های حالت اعلان که هرگز کامل نمی‌شوند). مقدار پیش‌فرض
`0` است (غیرفعال).

بازه‌های پیشنهادی:

- **محیط تولید:** `120` تا `300` ثانیه برای جریان‌های سبک اعلان.
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

وقتی یک پراکسی یا تونل جلوی Gateway قرار می‌گیرد، Plugin
URL عمومی را برای راستی‌آزمایی امضا بازسازی می‌کند. این گزینه‌ها
کنترل می‌کنند کدام سرآیندهای فورواردشده مورد اعتماد باشند:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  میزبان‌های فهرست مجاز از سرآیندهای فوروارد را مجاز کنید.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  به سرآیندهای فورواردشده بدون فهرست مجاز اعتماد کنید.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  فقط وقتی IP راه‌دور درخواست با فهرست تطابق دارد، به سرآیندهای فورواردشده اعتماد کنید.
</ParamField>

محافظت‌های اضافی:

- **محافظت در برابر بازپخش** Webhook برای Twilio و Plivo فعال است. درخواست‌های معتبر Webhook که بازپخش شده‌اند تأیید می‌شوند، اما از نظر اثرات جانبی رد می‌شوند.
- نوبت‌های مکالمه Twilio در callbackهای `<Gather>` یک توکن مخصوص هر نوبت دارند، بنابراین callbackهای گفتار کهنه/بازپخش‌شده نمی‌توانند یک نوبت رونویسی در انتظارِ جدیدتر را برآورده کنند.
- درخواست‌های Webhook احراز هویت‌نشده، زمانی که سرآیندهای امضای لازم ارائه‌دهنده وجود ندارند، پیش از خواندن بدنه رد می‌شوند.
- Webhook مربوط به voice-call از پروفایل بدنه پیش‌احراز مشترک (64 کیلوبایت / 5 ثانیه) به‌علاوه یک سقف هم‌زمانی به‌ازای هر IP پیش از راستی‌آزمایی امضا استفاده می‌کند.

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

وقتی Gateway از قبل در حال اجراست، فرمان‌های عملیاتی `voicecall` به زمان اجرای voice-call متعلق به Gateway واگذار می‌شوند تا CLI یک سرور Webhook دوم را bind نکند. اگر هیچ Gateway در دسترس نباشد، فرمان‌ها به یک زمان اجرای مستقل CLI بازمی‌گردند.

`latency`، `calls.jsonl` را از مسیر ذخیره‌سازی پیش‌فرض voice-call می‌خواند.
از `--file <path>` برای اشاره به یک گزارش متفاوت و از `--last <n>` برای محدودکردن
تحلیل به آخرین N رکورد استفاده کنید (پیش‌فرض 200). خروجی شامل p50/p90/p99
برای تأخیر نوبت و زمان‌های انتظار شنیدن است.

## ابزار عامل

نام ابزار: `voice_call`.

| اقدام           | آرگومان‌ها                                  |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

این repo یک سند Skills مطابق در `skills/voice-call/SKILL.md` ارائه می‌کند.

## RPC مربوط به Gateway

| روش                 | آرگومان‌ها                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` فقط با `mode: "conversation"` معتبر است. تماس‌های حالت اعلان
اگر پس از اتصال به رقم‌ها نیاز داشته باشند، باید پس از ایجاد تماس از
`voicecall.dtmf` استفاده کنند.

## عیب‌یابی

### راه‌اندازی در معرض‌گذاری Webhook شکست می‌خورد

راه‌اندازی را از همان محیطی اجرا کنید که Gateway را اجرا می‌کند:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

برای `twilio`، `telnyx`، و `plivo`، `webhook-exposure` باید سبز باشد. یک
`publicUrl` پیکربندی‌شده همچنان وقتی به فضای شبکه محلی یا خصوصی اشاره کند
ناموفق می‌شود، چون اپراتور نمی‌تواند به آن نشانی‌ها callback بزند. از
`localhost`، `127.0.0.1`، `0.0.0.0`، `10.x`، `172.16.x`-`172.31.x`،
`192.168.x`، `169.254.x`، `fc00::/7`، یا `fd00::/8` به‌عنوان `publicUrl`
استفاده نکنید.

تماس‌های خروجی Twilio در حالت notify-mode، TwiML اولیه‌ی `<Say>` خود را مستقیما در
درخواست ایجاد تماس می‌فرستند، بنابراین نخستین پیام گفتاری به دریافت
Webhook TwiML توسط Twilio وابسته نیست. Webhook عمومی همچنان برای callbackهای وضعیت،
تماس‌های مکالمه، DTMF پیش از اتصال، جریان‌های بلادرنگ، و کنترل تماس پس از اتصال
لازم است.

از یک مسیر دسترسی عمومی استفاده کنید:

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

`voicecall smoke` یک اجرای آزمایشی خشک است، مگر اینکه `--yes` را بدهید.

### اعتبارنامه‌های ارائه‌دهنده ناموفق می‌شوند

ارائه‌دهنده‌ی انتخاب‌شده و فیلدهای اعتبارنامه‌ی لازم را بررسی کنید:

- Twilio: `twilio.accountSid`، `twilio.authToken`، و `fromNumber`، یا
  `TWILIO_ACCOUNT_SID`، `TWILIO_AUTH_TOKEN`، و `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`، `telnyx.connectionId`، `telnyx.publicKey`، و
  `fromNumber`.
- Plivo: `plivo.authId`، `plivo.authToken`، و `fromNumber`.

اعتبارنامه‌ها باید روی میزبان Gateway وجود داشته باشند. ویرایش یک پروفایل shell محلی
تا زمانی که Gateway از نو راه‌اندازی نشود یا محیط خود را reload نکند،
روی Gateway در حال اجرا اثری ندارد.

### تماس‌ها شروع می‌شوند اما Webhookهای ارائه‌دهنده نمی‌رسند

تأیید کنید console ارائه‌دهنده دقیقا به URL عمومی Webhook اشاره می‌کند:

```text
https://voice.example.com/voice/webhook
```

سپس وضعیت runtime را بررسی کنید:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

علت‌های رایج:

- `publicUrl` به مسیری متفاوت از `serve.path` اشاره می‌کند.
- URL تونل پس از شروع Gateway تغییر کرده است.
- یک proxy درخواست را forward می‌کند اما headerهای host/proto را حذف یا بازنویسی می‌کند.
- Firewall یا DNS نام میزبان عمومی را به جایی غیر از Gateway هدایت می‌کند.
- Gateway بدون فعال بودن Plugin تماس صوتی restart شده است.

وقتی یک reverse proxy یا تونل جلوی Gateway قرار دارد، `webhookSecurity.allowedHosts`
را روی نام میزبان عمومی تنظیم کنید، یا برای نشانی proxy شناخته‌شده از
`webhookSecurity.trustedProxyIPs` استفاده کنید. فقط وقتی مرز proxy تحت کنترل شماست از
`webhookSecurity.trustForwardingHeaders` استفاده کنید.

### اعتبارسنجی امضا ناموفق می‌شود

امضاهای ارائه‌دهنده در برابر URL عمومی‌ای بررسی می‌شوند که OpenClaw از درخواست
ورودی بازسازی می‌کند. اگر امضاها ناموفق شدند:

- تأیید کنید URL ارائه‌دهنده برای Webhook دقیقا با `publicUrl` مطابقت دارد، از جمله
  scheme، host، و path.
- برای URLهای سطح رایگان ngrok، وقتی نام میزبان تونل تغییر می‌کند `publicUrl` را به‌روزرسانی کنید.
- مطمئن شوید proxy، headerهای اصلی host و proto را حفظ می‌کند، یا
  `webhookSecurity.allowedHosts` را پیکربندی کنید.
- `skipSignatureVerification` را خارج از آزمون محلی فعال نکنید.

### اتصال‌های Google Meet با Twilio ناموفق می‌شوند

Google Meet برای اتصال‌های dial-in با Twilio از این Plugin استفاده می‌کند. ابتدا تماس صوتی را تأیید کنید:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

سپس transport Google Meet را به‌صورت صریح تأیید کنید:

```bash
openclaw googlemeet setup --transport twilio
```

اگر تماس صوتی سبز است اما شرکت‌کننده‌ی Meet هرگز وارد نمی‌شود، شماره‌ی dial-in
Meet، PIN، و `--dtmf-sequence` را بررسی کنید. تماس تلفنی می‌تواند سالم باشد در حالی
که جلسه، توالی DTMF نادرست را رد یا نادیده می‌گیرد.

Google Meet توالی DTMF و متن معرفی Meet را به `voicecall.start` می‌فرستد.
برای تماس‌های Twilio، تماس صوتی ابتدا TwiML مربوط به DTMF را ارائه می‌کند، به
Webhook redirect می‌کند، سپس جریان رسانه‌ی بلادرنگ را باز می‌کند تا معرفی ذخیره‌شده
پس از پیوستن شرکت‌کننده‌ی تلفنی به جلسه تولید شود.

برای trace مرحله‌ی زنده از `openclaw logs --follow` استفاده کنید. یک اتصال سالم
Twilio Meet این ترتیب را log می‌کند:

- Google Meet اتصال Twilio را به تماس صوتی واگذار می‌کند.
- تماس صوتی DTMF TwiML پیش از اتصال را ذخیره می‌کند.
- TwiML اولیه‌ی Twilio مصرف و پیش از پردازش بلادرنگ ارائه می‌شود.
- تماس صوتی TwiML بلادرنگ را برای تماس Twilio ارائه می‌کند.
- پل بلادرنگ با سلام اولیه‌ی در صف قرارگرفته شروع می‌شود.

`openclaw voicecall tail` همچنان رکوردهای تماس persist‌شده را نشان می‌دهد؛ این برای
وضعیت تماس و transcriptها مفید است، اما همه‌ی گذارهای Webhook/بلادرنگ در آن
ظاهر نمی‌شوند.

### تماس بلادرنگ گفتار ندارد

تأیید کنید فقط یک حالت صوتی فعال است. `realtime.enabled` و
`streaming.enabled` نمی‌توانند هر دو true باشند.

برای تماس‌های بلادرنگ Twilio، همچنین تأیید کنید:

- یک Plugin ارائه‌دهنده‌ی بلادرنگ load و register شده است.
- `realtime.provider` تنظیم نشده یا نام یک ارائه‌دهنده‌ی register‌شده را دارد.
- کلید API ارائه‌دهنده برای فرایند Gateway در دسترس است.
- `openclaw logs --follow` نشان می‌دهد TwiML بلادرنگ ارائه شده، پل بلادرنگ
  شروع شده، و سلام اولیه در صف قرار گرفته است.

## مرتبط

- [حالت گفت‌وگو](/fa/nodes/talk)
- [تبدیل متن به گفتار](/fa/tools/tts)
- [بیدارباش صوتی](/fa/nodes/voicewake)
