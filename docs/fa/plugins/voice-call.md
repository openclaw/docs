---
read_when:
    - می‌خواهید یک تماس صوتی خروجی از OpenClaw برقرار کنید
    - شما در حال پیکربندی یا توسعهٔ Plugin تماس صوتی هستید
    - به صدای بی‌درنگ یا رونویسی جریانی در بستر تلفن نیاز دارید
sidebarTitle: Voice call
summary: تماس‌های صوتی خروجی برقرار کنید و تماس‌های صوتی ورودی را از طریق Twilio، Telnyx یا Plivo بپذیرید، با قابلیت اختیاری صدای بلادرنگ و رونویسی جریانی
title: Plugin تماس صوتی
x-i18n:
    generated_at: "2026-04-29T23:21:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7976b84ce1ee6e29706e595a4a25337632b34a9bb8f7cecdee1d6f833a8ce932
    source_path: plugins/voice-call.md
    workflow: 16
---

تماس‌های صوتی برای OpenClaw از طریق یک Plugin. از اعلان‌های خروجی،
گفت‌وگوهای چندمرحله‌ای، صدای بلادرنگ تمام‌دوطرفه، رونویسی جریانی، و تماس‌های ورودی با سیاست‌های allowlist پشتیبانی می‌کند.

**ارائه‌دهندگان فعلی:** `twilio` (Programmable Voice + Media Streams)،
`telnyx` (Call Control v2)، `plivo` (Voice API + XML transfer + GetInput
speech)، `mock` (توسعه/بدون شبکه).

<Note>
Plugin تماس صوتی **داخل فرایند Gateway** اجرا می‌شود. اگر از یک
Gateway راه دور استفاده می‌کنید، Plugin را روی ماشینی که Gateway را اجرا می‌کند
نصب و پیکربندی کنید، سپس Gateway را برای بارگذاری آن راه‌اندازی مجدد کنید.
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

    اگر npm بسته متعلق به OpenClaw را deprecated گزارش کرد، آن نسخه بسته
    از یک مسیر بسته خارجی قدیمی‌تر است؛ از یک بیلد بسته‌بندی‌شده فعلی OpenClaw
    یا مسیر پوشه محلی استفاده کنید تا زمانی که بسته npm جدیدتری منتشر شود.

    سپس Gateway را راه‌اندازی مجدد کنید تا Plugin بارگذاری شود.

  </Step>
  <Step title="پیکربندی ارائه‌دهنده و webhook">
    پیکربندی را زیر `plugins.entries.voice-call.config` تنظیم کنید (برای ساختار کامل،
    [پیکربندی](#configuration) را در ادامه ببینید). حداقل موارد لازم:
    `provider`، اعتبارنامه‌های ارائه‌دهنده، `fromNumber`، و یک URL webhook عمومی
    قابل دسترس است.
  </Step>
  <Step title="اعتبارسنجی راه‌اندازی">
    ```bash
    openclaw voicecall setup
    ```

    خروجی پیش‌فرض در لاگ‌های چت و ترمینال‌ها خوانا است. فعال بودن Plugin،
    اعتبارنامه‌های ارائه‌دهنده، در دسترس بودن webhook، و اینکه فقط یک حالت صوتی
    (`streaming` یا `realtime`) فعال باشد را بررسی می‌کند. برای اسکریپت‌ها از
    `--json` استفاده کنید.

  </Step>
  <Step title="آزمون Smoke">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    هر دو به طور پیش‌فرض dry run هستند. برای برقراری واقعی یک تماس اعلان خروجی
    کوتاه، `--yes` را اضافه کنید:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
برای Twilio، Telnyx، و Plivo، راه‌اندازی باید به یک **URL webhook عمومی** resolve شود.
اگر `publicUrl`، URL تونل، URL Tailscale، یا fallback سرویس‌دهی
به loopback یا فضای شبکه خصوصی resolve شود، راه‌اندازی به جای شروع ارائه‌دهنده‌ای که
نمی‌تواند webhookهای carrier را دریافت کند، شکست می‌خورد.
</Warning>

## پیکربندی

اگر `enabled: true` باشد اما اعتبارنامه‌های ارائه‌دهنده انتخاب‌شده موجود نباشد،
راه‌اندازی Gateway یک هشدار setup-incomplete همراه با کلیدهای مفقودشده ثبت می‌کند و
اجرای runtime را رد می‌کند. فرمان‌ها، فراخوانی‌های RPC، و ابزارهای agent همچنان
هنگام استفاده، همان پیکربندی ارائه‌دهنده مفقود را برمی‌گردانند.

<Note>
اعتبارنامه‌های voice-call از SecretRefs پشتیبانی می‌کنند. `plugins.entries.voice-call.config.twilio.authToken` و `plugins.entries.voice-call.config.tts.providers.*.apiKey` از طریق سطح استاندارد SecretRef resolve می‌شوند؛ [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface) را ببینید.
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
  <Accordion title="نکات امنیتی و در معرض‌گذاری ارائه‌دهنده">
    - Twilio، Telnyx، و Plivo همگی به یک URL webhook **قابل دسترس عمومی** نیاز دارند.
    - `mock` یک ارائه‌دهنده توسعه محلی است (بدون فراخوانی شبکه).
    - Telnyx به `telnyx.publicKey` (یا `TELNYX_PUBLIC_KEY`) نیاز دارد، مگر اینکه `skipSignatureVerification` برابر true باشد.
    - `skipSignatureVerification` فقط برای آزمون محلی است.
    - در سطح رایگان ngrok، `publicUrl` را روی URL دقیق ngrok تنظیم کنید؛ اعتبارسنجی امضا همیشه اعمال می‌شود.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` اجازه می‌دهد webhookهای Twilio با امضاهای نامعتبر **فقط** زمانی پذیرفته شوند که `tunnel.provider="ngrok"` باشد و `serve.bind` برابر loopback باشد (agent محلی ngrok). فقط برای توسعه محلی.
    - URLهای سطح رایگان ngrok ممکن است تغییر کنند یا رفتار interstitial اضافه کنند؛ اگر `publicUrl` جابه‌جا شود، امضاهای Twilio شکست می‌خورند. تولید: یک دامنه پایدار یا یک funnel در Tailscale را ترجیح دهید.

  </Accordion>
  <Accordion title="سقف‌های اتصال جریانی">
    - `streaming.preStartTimeoutMs` سوکت‌هایی را می‌بندد که هیچ فریم `start` معتبری ارسال نمی‌کنند.
    - `streaming.maxPendingConnections` سقف کل سوکت‌های pre-start احرازنشده را تعیین می‌کند.
    - `streaming.maxPendingConnectionsPerIp` سقف سوکت‌های pre-start احرازنشده برای هر IP منبع را تعیین می‌کند.
    - `streaming.maxConnections` سقف کل سوکت‌های media stream باز را تعیین می‌کند (در انتظار + فعال).

  </Accordion>
  <Accordion title="مهاجرت‌های پیکربندی قدیمی">
    پیکربندی‌های قدیمی‌تر که از `provider: "log"`، `twilio.from`، یا کلیدهای OpenAI قدیمی
    زیر `streaming.*` استفاده می‌کنند، توسط `openclaw doctor --fix` بازنویسی می‌شوند.
    fallback زمان اجرا فعلا همچنان کلیدهای قدیمی voice-call را می‌پذیرد، اما
    مسیر بازنویسی `openclaw doctor --fix` است و shim سازگاری
    موقتی است.

    کلیدهای جریانی مهاجرت‌یافته خودکار:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## گفت‌وگوهای صوتی بلادرنگ

`realtime` یک ارائه‌دهنده صوتی بلادرنگ تمام‌دوطرفه را برای صدای زنده تماس
انتخاب می‌کند. این جدا از `streaming` است که فقط صدا را به ارائه‌دهندگان
رونویسی بلادرنگ ارسال می‌کند.

<Warning>
`realtime.enabled` نمی‌تواند با `streaming.enabled` ترکیب شود. برای هر تماس
یک حالت صوتی انتخاب کنید.
</Warning>

رفتار فعلی runtime:

- `realtime.enabled` برای Twilio Media Streams پشتیبانی می‌شود.
- `realtime.provider` اختیاری است. اگر تنظیم نشده باشد، Voice Call از اولین ارائه‌دهنده صوتی بلادرنگ ثبت‌شده استفاده می‌کند.
- ارائه‌دهندگان صوتی بلادرنگ همراه: Google Gemini Live (`google`) و OpenAI (`openai`) که توسط Pluginهای ارائه‌دهنده خود ثبت می‌شوند.
- پیکربندی خام متعلق به ارائه‌دهنده زیر `realtime.providers.<providerId>` قرار دارد.
- Voice Call ابزار بلادرنگ مشترک `openclaw_agent_consult` را به طور پیش‌فرض ارائه می‌کند. مدل بلادرنگ می‌تواند زمانی که تماس‌گیرنده استدلال عمیق‌تر، اطلاعات فعلی، یا ابزارهای عادی OpenClaw را می‌خواهد، آن را فراخوانی کند.
- اگر `realtime.provider` به یک ارائه‌دهنده ثبت‌نشده اشاره کند، یا هیچ ارائه‌دهنده صوتی بلادرنگی اصلا ثبت نشده باشد، Voice Call یک هشدار ثبت می‌کند و به جای شکست دادن کل Plugin، رسانه بلادرنگ را رد می‌کند.
- کلیدهای نشست consult زمانی که ممکن باشد از نشست صوتی موجود دوباره استفاده می‌کنند، سپس به شماره تلفن تماس‌گیرنده/پاسخ‌دهنده fallback می‌کنند تا فراخوانی‌های consult بعدی در طول تماس، context را حفظ کنند.

### سیاست ابزار

`realtime.toolPolicy` اجرای consult را کنترل می‌کند:

| سیاست           | رفتار                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | ابزار consult را در معرض می‌گذارد و agent معمولی را به `read`، `web_search`، `web_fetch`، `x_search`، `memory_search`، و `memory_get` محدود می‌کند. |
| `owner`          | ابزار consult را در معرض می‌گذارد و به agent معمولی اجازه می‌دهد از سیاست ابزار agent عادی استفاده کند.                                                      |
| `none`           | ابزار consult را در معرض نمی‌گذارد. `realtime.tools` سفارشی همچنان به ارائه‌دهنده بلادرنگ پاس داده می‌شوند.                               |

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

برای گزینه‌های صوتی بلادرنگ مخصوص ارائه‌دهنده، [ارائه‌دهنده Google](/fa/providers/google) و
[ارائه‌دهنده OpenAI](/fa/providers/openai) را ببینید.

## رونویسی جریانی

`streaming` یک ارائه‌دهنده رونویسی بلادرنگ را برای صدای زنده تماس انتخاب می‌کند.

رفتار فعلی runtime:

- `streaming.provider` اختیاری است. اگر تنظیم نشده باشد، Voice Call از اولین ارائه‌دهنده رونویسی بلادرنگ ثبت‌شده استفاده می‌کند.
- ارائه‌دهندگان رونویسی بلادرنگ همراه: Deepgram (`deepgram`)، ElevenLabs (`elevenlabs`)، Mistral (`mistral`)، OpenAI (`openai`)، و xAI (`xai`) که توسط Pluginهای ارائه‌دهنده خود ثبت می‌شوند.
- پیکربندی خام متعلق به ارائه‌دهنده زیر `streaming.providers.<providerId>` قرار دارد.
- اگر `streaming.provider` به یک ارائه‌دهنده ثبت‌نشده اشاره کند، یا هیچ‌کدام ثبت نشده باشد، Voice Call یک هشدار ثبت می‌کند و به جای شکست دادن کل Plugin، media streaming را رد می‌کند.

### نمونه‌های ارائه‌دهنده جریانی

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
    پیش‌فرض‌ها: کلید API به‌صورت `streaming.providers.xai.apiKey` یا `XAI_API_KEY`؛
    endpoint به‌صورت `wss://api.x.ai/v1/stt`؛ کدگذاری `mulaw`؛ نرخ نمونه‌برداری `8000`؛
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

Voice Call از پیکربندی اصلی `messages.tts` برای گفتار جریانی
در تماس‌ها استفاده می‌کند. می‌توانید آن را در پیکربندی Plugin با
**همان شکل** بازنویسی کنید؛ این پیکربندی به‌صورت عمیق با `messages.tts` ادغام می‌شود.

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
ترنسپورت فعلی Microsoft خروجی PCM تلفنی را در دسترس قرار نمی‌دهد.
</Warning>

نکات رفتاری:

- کلیدهای قدیمی `tts.<provider>` در پیکربندی Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) با `openclaw doctor --fix` ترمیم می‌شوند؛ پیکربندی ثبت‌شده باید از `tts.providers.<provider>` استفاده کند.
- وقتی پخش جریانی رسانه Twilio فعال باشد، TTS اصلی استفاده می‌شود؛ در غیر این صورت، تماس‌ها به صداهای بومی provider برمی‌گردند.
- اگر یک جریان رسانه Twilio از قبل فعال باشد، Voice Call به TwiML `<Say>` برنمی‌گردد. اگر TTS تلفنی در آن وضعیت در دسترس نباشد، درخواست پخش به‌جای ترکیب دو مسیر پخش شکست می‌خورد.
- وقتی TTS تلفنی به یک provider ثانویه برمی‌گردد، Voice Call برای عیب‌یابی یک هشدار با زنجیره provider (`from`, `to`, `attempts`) ثبت می‌کند.
- وقتی barge-in یا جمع‌کردن جریان Twilio صف TTS در انتظار را پاک می‌کند، درخواست‌های پخش صف‌شده به نتیجه می‌رسند و تماس‌گیرندگان در انتظار تکمیل پخش معلق نمی‌مانند.

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

سیاست ورودی به‌صورت پیش‌فرض `disabled` است. برای فعال‌کردن تماس‌های ورودی، تنظیم کنید:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` یک غربالگری caller-ID با اطمینان پایین است. این
Plugin مقدار `From` ارائه‌شده توسط provider را نرمال‌سازی می‌کند و آن را با
`allowFrom` مقایسه می‌کند. راستی‌آزمایی Webhook، تحویل provider و
یکپارچگی payload را احراز می‌کند، اما مالکیت شماره تماس‌گیرنده PSTN/VoIP را
**اثبات نمی‌کند**. با `allowFrom` به‌عنوان فیلتر caller-ID رفتار کنید، نه هویت
قوی تماس‌گیرنده.
</Warning>

پاسخ‌های خودکار از سیستم agent استفاده می‌کنند. با `responseModel`,
`responseSystemPrompt`, و `responseTimeoutMs` تنظیم کنید.

### قرارداد خروجی گفتاری

برای پاسخ‌های خودکار، Voice Call یک قرارداد سخت‌گیرانه خروجی گفتاری را به
system prompt اضافه می‌کند:

```text
{"spoken":"..."}
```

Voice Call متن گفتار را به‌صورت دفاعی استخراج می‌کند:

- payloadهایی را که به‌عنوان محتوای reasoning/error علامت‌گذاری شده‌اند نادیده می‌گیرد.
- JSON مستقیم، JSON حصارگذاری‌شده، یا کلیدهای درون‌خطی `"spoken"` را تجزیه می‌کند.
- به متن ساده برمی‌گردد و پاراگراف‌های آغازین احتمالی مربوط به برنامه‌ریزی/متا را حذف می‌کند.

این کار پخش گفتاری را روی متن روبه‌روی تماس‌گیرنده متمرکز نگه می‌دارد و از
نشت متن برنامه‌ریزی به صدا جلوگیری می‌کند.

### رفتار شروع مکالمه

برای تماس‌های خروجی `conversation`، مدیریت پیام اول به وضعیت زنده
پخش گره خورده است:

- پاک‌سازی صف barge-in و پاسخ خودکار فقط زمانی سرکوب می‌شوند که خوشامدگویی اولیه فعالانه در حال پخش باشد.
- اگر پخش اولیه شکست بخورد، تماس به `listening` برمی‌گردد و پیام اولیه برای تلاش دوباره در صف می‌ماند.
- پخش اولیه برای پخش جریانی Twilio هنگام اتصال جریان بدون تاخیر اضافی شروع می‌شود.
- barge-in پخش فعال را متوقف می‌کند و ورودی‌های TTS مربوط به Twilio را که در صف هستند اما هنوز پخش نشده‌اند پاک می‌کند. ورودی‌های پاک‌شده به‌عنوان ردشده resolve می‌شوند، بنابراین منطق پاسخ بعدی می‌تواند بدون انتظار برای صدایی که هرگز پخش نمی‌شود ادامه دهد.
- مکالمه‌های صوتی realtime از نوبت آغازین خود جریان realtime استفاده می‌کنند. Voice Call برای آن پیام اولیه یک به‌روزرسانی قدیمی TwiML با `<Say>` ارسال **نمی‌کند**، بنابراین نشست‌های خروجی `<Connect><Stream>` متصل می‌مانند.

### مهلت قطع جریان Twilio

وقتی یک جریان رسانه Twilio قطع می‌شود، Voice Call پیش از
پایان‌دهی خودکار تماس **2000 ms** صبر می‌کند:

- اگر جریان در طول آن بازه دوباره وصل شود، پایان‌دهی خودکار لغو می‌شود.
- اگر پس از دوره مهلت هیچ جریانی دوباره ثبت نشود، تماس پایان می‌یابد تا از تماس‌های فعال گیرکرده جلوگیری شود.

## جمع‌آور تماس‌های کهنه

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

وقتی یک proxy یا tunnel جلوی Gateway قرار دارد، Plugin
URL عمومی را برای راستی‌آزمایی امضا بازسازی می‌کند. این گزینه‌ها
کنترل می‌کنند کدام headerهای forwarded قابل اعتماد هستند:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  میزبان‌های allowlist از headerهای forwarding.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  به headerهای forwarded بدون allowlist اعتماد کن.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  فقط زمانی به headerهای forwarded اعتماد کن که IP راه‌دور درخواست با فهرست مطابقت داشته باشد.
</ParamField>

محافظت‌های اضافی:

- **محافظت در برابر replay** در Webhook برای Twilio و Plivo فعال است. درخواست‌های معتبر Webhook که replay شده‌اند تایید می‌شوند اما برای اثرات جانبی رد می‌شوند.
- نوبت‌های مکالمه Twilio در callbackهای `<Gather>` شامل یک token به‌ازای هر نوبت هستند، بنابراین callbackهای گفتاری کهنه/replay‌شده نمی‌توانند یک نوبت transcript در انتظار جدیدتر را برآورده کنند.
- درخواست‌های Webhook احرازنشده پیش از خواندن body رد می‌شوند، وقتی headerهای امضای موردنیاز provider وجود نداشته باشند.
- Webhook مربوط به voice-call از پروفایل body مشترک pre-auth (64 KB / 5 ثانیه) به‌علاوه یک سقف in-flight به‌ازای هر IP پیش از راستی‌آزمایی امضا استفاده می‌کند.

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

`latency`، `calls.jsonl` را از مسیر ذخیره‌سازی پیش‌فرض voice-call می‌خواند.
از `--file <path>` برای اشاره به یک گزارش متفاوت و از `--last <n>` برای محدودکردن
تحلیل به آخرین N رکورد استفاده کنید (پیش‌فرض 200). خروجی شامل p50/p90/p99
برای latency نوبت و زمان‌های انتظار شنیدن است.

## ابزار agent

نام ابزار: `voice_call`.

| کنش            | آرگومان‌ها                |
| -------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

این repo یک سند skill منطبق را در `skills/voice-call/SKILL.md` ارائه می‌کند.

## RPC در Gateway

| روش                  | آرگومان‌ها                |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## مرتبط

- [حالت گفت‌وگو](/fa/nodes/talk)
- [تبدیل متن به گفتار](/fa/tools/tts)
- [بیدارباش صوتی](/fa/nodes/voicewake)
