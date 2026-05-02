---
read_when:
    - می‌خواهید از OpenClaw یک تماس صوتی خروجی برقرار کنید
    - شما Plugin تماس صوتی را پیکربندی یا توسعه می‌دهید
    - به صدای بلادرنگ یا رونویسی جریانی در بستر تلفنی نیاز دارید
sidebarTitle: Voice call
summary: تماس‌های صوتی خروجی را برقرار کنید و تماس‌های صوتی ورودی را از طریق Twilio، Telnyx یا Plivo بپذیرید، همراه با صدای بلادرنگ و رونویسی جریانی اختیاری
title: Plugin تماس صوتی
x-i18n:
    generated_at: "2026-05-02T11:59:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f04b14ad1aafcc6036aff2301d9d0210c0cde333051ed89d498c51b4e0c0353
    source_path: plugins/voice-call.md
    workflow: 16
---

تماس‌های صوتی برای OpenClaw از طریق یک Plugin. از اعلان‌های خروجی،
گفتگوهای چندمرحله‌ای، صدای بلادرنگ تمام‌دوطرفه، رونویسی جریانی، و
تماس‌های ورودی با سیاست‌های فهرست مجاز پشتیبانی می‌کند.

**ارائه‌دهندگان فعلی:** `twilio` (Programmable Voice + Media Streams)،
`telnyx` (Call Control v2)، `plivo` (Voice API + XML transfer + GetInput
speech)، `mock` (توسعه/بدون شبکه).

<Note>
Plugin تماس صوتی **داخل فرایند Gateway** اجرا می‌شود. اگر از یک
Gateway راه‌دور استفاده می‌کنید، Plugin را روی ماشینی که Gateway را اجرا
می‌کند نصب و پیکربندی کنید، سپس Gateway را بازراه‌اندازی کنید تا آن را بارگذاری کند.
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

    اگر npm بسته متعلق به OpenClaw را منسوخ‌شده گزارش کرد، آن نسخه بسته
    از یک خط بسته خارجی قدیمی‌تر است؛ تا زمانی که بسته npm جدیدتری منتشر شود،
    از یک ساخت بسته‌بندی‌شده فعلی OpenClaw یا مسیر پوشه محلی استفاده کنید.

    پس از آن Gateway را بازراه‌اندازی کنید تا Plugin بارگذاری شود.

  </Step>
  <Step title="پیکربندی ارائه‌دهنده و Webhook">
    پیکربندی را زیر `plugins.entries.voice-call.config` تنظیم کنید (برای شکل کامل،
    [پیکربندی](#configuration) را در ادامه ببینید). حداقل موارد لازم:
    `provider`، اعتبارنامه‌های ارائه‌دهنده، `fromNumber`، و یک URL وب‌هوک عمومی قابل دسترس.
  </Step>
  <Step title="راستی‌آزمایی راه‌اندازی">
    ```bash
    openclaw voicecall setup
    ```

    خروجی پیش‌فرض در گزارش‌های چت و ترمینال‌ها خوانا است. فعال بودن
    Plugin، اعتبارنامه‌های ارائه‌دهنده، در معرض دسترس بودن Webhook، و اینکه
    فقط یک حالت صوتی (`streaming` یا `realtime`) فعال باشد را بررسی می‌کند. برای
    اسکریپت‌ها از `--json` استفاده کنید.

  </Step>
  <Step title="آزمون دود">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    هر دو به‌صورت پیش‌فرض اجرای خشک هستند. برای برقرار کردن واقعی یک تماس
    اعلان خروجی کوتاه، `--yes` را اضافه کنید:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
برای Twilio، Telnyx، و Plivo، راه‌اندازی باید به یک **URL وب‌هوک عمومی** resolve شود.
اگر `publicUrl`، URL تونل، URL مربوط به Tailscale، یا fallback سرو کردن
به loopback یا فضای شبکه خصوصی resolve شود، راه‌اندازی به‌جای شروع کردن
ارائه‌دهنده‌ای که نمی‌تواند وب‌هوک‌های carrier را دریافت کند، شکست می‌خورد.
</Warning>

## پیکربندی

اگر `enabled: true` باشد اما ارائه‌دهنده انتخاب‌شده اعتبارنامه‌ها را نداشته باشد،
شروع Gateway یک هشدار setup-incomplete را با کلیدهای مفقود ثبت می‌کند و
از شروع runtime صرف‌نظر می‌کند. دستورها، فراخوانی‌های RPC، و ابزارهای عامل هنگام استفاده
همچنان پیکربندی دقیق مفقود ارائه‌دهنده را برمی‌گردانند.

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
  <Accordion title="نکات مربوط به در معرض دسترس قرار دادن ارائه‌دهنده و امنیت">
    - Twilio، Telnyx، و Plivo همگی به یک URL وب‌هوک **عمومی قابل دسترس** نیاز دارند.
    - `mock` یک ارائه‌دهنده توسعه محلی است (بدون فراخوانی شبکه).
    - Telnyx به `telnyx.publicKey` (یا `TELNYX_PUBLIC_KEY`) نیاز دارد مگر اینکه `skipSignatureVerification` true باشد.
    - `skipSignatureVerification` فقط برای آزمون محلی است.
    - در پلن رایگان ngrok، `publicUrl` را روی URL دقیق ngrok تنظیم کنید؛ راستی‌آزمایی امضا همیشه اعمال می‌شود.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` وب‌هوک‌های Twilio با امضاهای نامعتبر را **فقط** زمانی مجاز می‌کند که `tunnel.provider="ngrok"` باشد و `serve.bind` برابر loopback باشد (عامل محلی ngrok). فقط برای توسعه محلی.
    - URLهای پلن رایگان Ngrok می‌توانند تغییر کنند یا رفتار interstitial اضافه کنند؛ اگر `publicUrl` تغییر کند، امضاهای Twilio شکست می‌خورند. تولید: یک دامنه پایدار یا یک funnel در Tailscale را ترجیح دهید.

  </Accordion>
  <Accordion title="سقف‌های اتصال جریانی">
    - `streaming.preStartTimeoutMs` سوکت‌هایی را که هرگز یک فریم معتبر `start` ارسال نمی‌کنند می‌بندد.
    - `streaming.maxPendingConnections` کل سوکت‌های پیش از شروعِ احرازنشده را محدود می‌کند.
    - `streaming.maxPendingConnectionsPerIp` سوکت‌های پیش از شروعِ احرازنشده برای هر IP مبدأ را محدود می‌کند.
    - `streaming.maxConnections` کل سوکت‌های باز media stream را محدود می‌کند (در انتظار + فعال).

  </Accordion>
  <Accordion title="مهاجرت‌های پیکربندی قدیمی">
    پیکربندی‌های قدیمی‌تر که از `provider: "log"`، `twilio.from`، یا کلیدهای قدیمی
    OpenAI در `streaming.*` استفاده می‌کنند توسط `openclaw doctor --fix` بازنویسی می‌شوند.
    fallback زمان اجرا فعلاً هنوز کلیدهای قدیمی voice-call را می‌پذیرد، اما
    مسیر بازنویسی `openclaw doctor --fix` است و shim سازگاری
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

به‌صورت پیش‌فرض، تماس صوتی از `sessionScope: "per-phone"` استفاده می‌کند تا تماس‌های تکراری از
همان تماس‌گیرنده حافظه گفتگو را حفظ کنند. وقتی هر تماس carrier باید با زمینه تازه شروع شود،
مثلاً برای پذیرش، رزرو، IVR، یا جریان‌های پل Google Meet که در آن‌ها یک شماره تلفن ممکن است
نماینده جلسه‌های متفاوت باشد، `sessionScope: "per-call"` را تنظیم کنید.

## گفتگوهای صوتی بلادرنگ

`realtime` یک ارائه‌دهنده صدای بلادرنگ تمام‌دوطرفه را برای صدای زنده تماس
انتخاب می‌کند. این جدا از `streaming` است که فقط صدا را به
ارائه‌دهندگان رونویسی بلادرنگ ارسال می‌کند.

<Warning>
`realtime.enabled` نمی‌تواند با `streaming.enabled` ترکیب شود. برای هر تماس
یک حالت صوتی انتخاب کنید.
</Warning>

رفتار فعلی runtime:

- `realtime.enabled` برای Twilio Media Streams پشتیبانی می‌شود.
- `realtime.provider` اختیاری است. اگر تنظیم نشده باشد، تماس صوتی از اولین ارائه‌دهنده صدای بلادرنگ ثبت‌شده استفاده می‌کند.
- ارائه‌دهندگان صدای بلادرنگ همراه: Google Gemini Live (`google`) و OpenAI (`openai`) که توسط Pluginهای ارائه‌دهنده خودشان ثبت می‌شوند.
- پیکربندی خام متعلق به ارائه‌دهنده زیر `realtime.providers.<providerId>` قرار می‌گیرد.
- تماس صوتی ابزار بلادرنگ مشترک `openclaw_agent_consult` را به‌صورت پیش‌فرض در دسترس قرار می‌دهد. مدل بلادرنگ می‌تواند وقتی تماس‌گیرنده استدلال عمیق‌تر، اطلاعات فعلی، یا ابزارهای معمول OpenClaw را درخواست می‌کند آن را فراخوانی کند.
- `realtime.fastContext.enabled` به‌صورت پیش‌فرض خاموش است. وقتی فعال باشد، تماس صوتی ابتدا حافظه ایندکس‌شده/زمینه نشست را برای پرسش consult جستجو می‌کند و آن قطعه‌ها را در بازه `realtime.fastContext.timeoutMs` به مدل بلادرنگ برمی‌گرداند، پیش از اینکه فقط در صورت true بودن `realtime.fastContext.fallbackToConsult` به عامل consult کامل fallback کند.
- اگر `realtime.provider` به یک ارائه‌دهنده ثبت‌نشده اشاره کند، یا هیچ ارائه‌دهنده صدای بلادرنگی اصلاً ثبت نشده باشد، تماس صوتی یک هشدار ثبت می‌کند و به‌جای شکست دادن کل Plugin، از رسانه بلادرنگ صرف‌نظر می‌کند.
- کلیدهای نشست consult، وقتی در دسترس باشد، از نشست تماس ذخیره‌شده دوباره استفاده می‌کنند، سپس به `sessionScope` پیکربندی‌شده fallback می‌کنند (`per-phone` به‌صورت پیش‌فرض، یا `per-call` برای تماس‌های ایزوله).

### سیاست ابزار

`realtime.toolPolicy` اجرای consult را کنترل می‌کند:

| سیاست           | رفتار                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | ابزار consult را در دسترس قرار می‌دهد و عامل معمولی را به `read`، `web_search`، `web_fetch`، `x_search`، `memory_search`، و `memory_get` محدود می‌کند. |
| `owner`          | ابزار consult را در دسترس قرار می‌دهد و اجازه می‌دهد عامل معمولی از سیاست عادی ابزار عامل استفاده کند.                                                      |
| `none`           | ابزار consult را در دسترس قرار نمی‌دهد. `realtime.tools` سفارشی همچنان به ارائه‌دهنده بلادرنگ منتقل می‌شوند.                               |

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

برای گزینه‌های صدای بلادرنگ ویژه ارائه‌دهنده، [ارائه‌دهنده Google](/fa/providers/google) و
[ارائه‌دهنده OpenAI](/fa/providers/openai) را ببینید.

## رونویسی جریانی

`streaming` یک ارائه‌دهنده رونویسی بلادرنگ را برای صدای زنده تماس انتخاب می‌کند.

رفتار فعلی runtime:

- `streaming.provider` اختیاری است. اگر تنظیم نشده باشد، Voice Call از نخستین ارائه‌دهندهٔ ثبت‌شدهٔ رونویسی بلادرنگ استفاده می‌کند.
- ارائه‌دهندگان همراه رونویسی بلادرنگ: Deepgram (`deepgram`)، ElevenLabs (`elevenlabs`)، Mistral (`mistral`)، OpenAI (`openai`) و xAI (`xai`) که توسط Pluginهای ارائه‌دهندهٔ خودشان ثبت می‌شوند.
- پیکربندی خام تحت مالکیت ارائه‌دهنده زیر `streaming.providers.<providerId>` قرار دارد.
- پس از آنکه Twilio پیام `start` برای جریان پذیرفته‌شده را می‌فرستد، Voice Call جریان را بلافاصله ثبت می‌کند، رسانهٔ ورودی را هنگام اتصال ارائه‌دهنده از طریق ارائه‌دهندهٔ رونویسی در صف قرار می‌دهد، و پیام خوشامدگویی اولیه را فقط پس از آماده‌شدن رونویسی بلادرنگ شروع می‌کند.
- اگر `streaming.provider` به ارائه‌دهنده‌ای ثبت‌نشده اشاره کند، یا هیچ ارائه‌دهنده‌ای ثبت نشده باشد، Voice Call یک هشدار ثبت می‌کند و به‌جای شکست‌دادن کل Plugin، پخش جریانی رسانه را رد می‌کند.

### نمونه‌های ارائه‌دهندهٔ پخش جریانی

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

Voice Call برای گفتار پخش جریانی در تماس‌ها از پیکربندی هستهٔ `messages.tts` استفاده می‌کند. می‌توانید آن را زیر پیکربندی Plugin با **همان شکل** بازنویسی کنید — این پیکربندی با `messages.tts` به‌صورت عمیق ادغام می‌شود.

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

نکات رفتاری:

- کلیدهای قدیمی `tts.<provider>` داخل پیکربندی Plugin (`openai`، `elevenlabs`، `microsoft`، `edge`) توسط `openclaw doctor --fix` اصلاح می‌شوند؛ پیکربندی commitشده باید از `tts.providers.<provider>` استفاده کند.
- وقتی پخش جریانی رسانهٔ Twilio فعال باشد، TTS هسته استفاده می‌شود؛ در غیر این صورت تماس‌ها به صداهای بومی ارائه‌دهنده برمی‌گردند.
- اگر یک جریان رسانهٔ Twilio از قبل فعال باشد، Voice Call به TwiML `<Say>` برنمی‌گردد. اگر TTS تلفنی در آن وضعیت در دسترس نباشد، درخواست پخش به‌جای ترکیب دو مسیر پخش شکست می‌خورد.
- وقتی TTS تلفنی به ارائه‌دهندهٔ ثانویه برمی‌گردد، Voice Call برای اشکال‌زدایی یک هشدار همراه با زنجیرهٔ ارائه‌دهنده (`from`، `to`، `attempts`) ثبت می‌کند.
- وقتی barge-in یا برچیدن جریان Twilio صف TTS در انتظار را پاک می‌کند، درخواست‌های پخش صف‌شده به‌جای معلق‌ماندن تماس‌گیرندگان در انتظار تکمیل پخش، تعیین‌تکلیف می‌شوند.

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

سیاست ورودی به‌طور پیش‌فرض `disabled` است. برای فعال‌کردن تماس‌های ورودی، تنظیم کنید:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` یک غربال‌گری کم‌اطمینان شناسهٔ تماس‌گیرنده است. Plugin مقدار `From` ارائه‌شده توسط ارائه‌دهنده را نرمال‌سازی می‌کند و آن را با `allowFrom` مقایسه می‌کند. راستی‌آزمایی Webhook تحویل ارائه‌دهنده و یکپارچگی payload را احراز می‌کند، اما مالکیت شمارهٔ تماس‌گیرندهٔ PSTN/VoIP را **ثابت نمی‌کند**. `allowFrom` را به‌عنوان فیلتر شناسهٔ تماس‌گیرنده در نظر بگیرید، نه هویت قوی تماس‌گیرنده.
</Warning>

پاسخ‌های خودکار از سامانهٔ agent استفاده می‌کنند. با `responseModel`،
`responseSystemPrompt` و `responseTimeoutMs` تنظیم کنید.

### مسیریابی بر اساس شماره

وقتی یک Plugin با نام Voice Call تماس‌های چند شمارهٔ تلفن را دریافت می‌کند و هر شماره باید مانند خطی متفاوت رفتار کند، از `numbers` استفاده کنید. برای نمونه، یک شماره می‌تواند از دستیار شخصی خودمانی استفاده کند، در حالی که شماره‌ای دیگر از شخصیت کسب‌وکاری، agent پاسخ‌دهندهٔ متفاوت و صدای TTS متفاوت استفاده کند.

مسیرها از شمارهٔ `To` شماره‌گیری‌شدهٔ ارائه‌شده توسط ارائه‌دهنده انتخاب می‌شوند. کلیدها باید شماره‌های E.164 باشند. وقتی تماسی می‌رسد، Voice Call مسیر مطابق را یک‌بار حل می‌کند، مسیر مطابق را روی رکورد تماس ذخیره می‌کند، و همان پیکربندی مؤثر را برای خوشامدگویی، مسیر کلاسیک پاسخ خودکار، مسیر مشاورهٔ بلادرنگ و پخش TTS دوباره استفاده می‌کند. اگر هیچ مسیری مطابق نباشد، پیکربندی سراسری Voice Call استفاده می‌شود.
تماس‌های خروجی از `numbers` استفاده نمی‌کنند؛ هنگام آغاز تماس، مقصد خروجی، پیام و جلسه را به‌صراحت پاس بدهید.

بازنویسی‌های مسیر در حال حاضر از موارد زیر پشتیبانی می‌کنند:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

مقدار مسیر `tts` روی پیکربندی سراسری `tts` مربوط به Voice Call به‌صورت عمیق ادغام می‌شود، بنابراین معمولاً می‌توانید فقط صدای ارائه‌دهنده را بازنویسی کنید:

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

برای پاسخ‌های خودکار، Voice Call یک قرارداد سخت‌گیرانهٔ خروجی گفتاری به system prompt اضافه می‌کند:

```text
{"spoken":"..."}
```

Voice Call متن گفتار را به‌صورت تدافعی استخراج می‌کند:

- payloadهایی را که به‌عنوان محتوای استدلال/خطا علامت‌گذاری شده‌اند نادیده می‌گیرد.
- JSON مستقیم، JSON داخل حصار، یا کلیدهای درون‌خطی `"spoken"` را parse می‌کند.
- به متن ساده برمی‌گردد و پاراگراف‌های آغازین احتمالیِ برنامه‌ریزی/فرا را حذف می‌کند.

این کار پخش گفتاری را روی متن روبه‌روی تماس‌گیرنده متمرکز نگه می‌دارد و از نشت متن برنامه‌ریزی به صدا جلوگیری می‌کند.

### رفتار شروع مکالمه

برای تماس‌های خروجی `conversation`، مدیریت پیام اول به وضعیت پخش زنده وابسته است:

- پاک‌سازی صف barge-in و پاسخ خودکار فقط زمانی مهار می‌شوند که خوشامدگویی اولیه فعالانه در حال صحبت باشد.
- اگر پخش اولیه شکست بخورد، تماس به `listening` برمی‌گردد و پیام اولیه برای تلاش دوباره در صف باقی می‌ماند.
- پخش اولیه برای پخش جریانی Twilio هنگام اتصال جریان و بدون تأخیر اضافی شروع می‌شود.
- barge-in پخش فعال را قطع می‌کند و ورودی‌های TTS مربوط به Twilio را که در صف هستند اما هنوز پخش نشده‌اند پاک می‌کند. ورودی‌های پاک‌شده به‌عنوان ردشده resolve می‌شوند، بنابراین منطق پاسخ بعدی می‌تواند بدون انتظار برای صدایی که هرگز پخش نخواهد شد ادامه پیدا کند.
- مکالمه‌های صوتی بلادرنگ از نوبت آغازین خود جریان بلادرنگ استفاده می‌کنند. Voice Call برای آن پیام اولیه یک به‌روزرسانی قدیمی TwiML با `<Say>` ارسال **نمی‌کند**، بنابراین جلسه‌های خروجی `<Connect><Stream>` متصل می‌مانند.

### مهلت قطع جریان Twilio

وقتی یک جریان رسانهٔ Twilio قطع می‌شود، Voice Call پیش از پایان خودکار تماس **2000 ms** صبر می‌کند:

- اگر جریان در آن بازه دوباره وصل شود، پایان خودکار لغو می‌شود.
- اگر پس از دورهٔ مهلت هیچ جریانی دوباره ثبت نشود، تماس پایان داده می‌شود تا از گیرکردن تماس‌های فعال جلوگیری شود.

## پاک‌ساز تماس‌های کهنه

از `staleCallReaperSeconds` برای پایان‌دادن به تماس‌هایی استفاده کنید که هرگز Webhook پایانی دریافت نمی‌کنند (برای مثال، تماس‌های حالت اعلان که هرگز کامل نمی‌شوند). مقدار پیش‌فرض `0` است (غیرفعال).

بازه‌های پیشنهادی:

- **محیط تولید:** `120` تا `300` ثانیه برای جریان‌های سبک اعلان.
- این مقدار را **بالاتر از `maxDurationSeconds`** نگه دارید تا تماس‌های عادی بتوانند تمام شوند. نقطهٔ شروع خوب `maxDurationSeconds + 30–60` ثانیه است.

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

وقتی یک پروکسی یا تونل جلوی Gateway قرار دارد، Plugin نشانی عمومی را برای راستی‌آزمایی امضا بازسازی می‌کند. این گزینه‌ها کنترل می‌کنند کدام headerهای فورواردشده مورد اعتماد باشند:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  میزبان‌ها را از headerهای فورواردینگ در allowlist قرار دهید.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  به headerهای فورواردشده بدون allowlist اعتماد کنید.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  فقط وقتی به headerهای فورواردشده اعتماد کنید که IP راه‌دور درخواست با فهرست مطابق باشد.
</ParamField>

محافظت‌های بیشتر:

- **محافظت در برابر replay** برای Twilio و Plivo فعال است. درخواست‌های Webhook معتبرِ replayشده تأیید می‌شوند اما برای اثرات جانبی رد می‌شوند.
- نوبت‌های مکالمهٔ Twilio در callbackهای `<Gather>` شامل یک token برای هر نوبت هستند، بنابراین callbackهای گفتار کهنه/replayشده نمی‌توانند یک نوبت transcript جدیدتر در انتظار را برآورده کنند.
- درخواست‌های Webhook احرازهویت‌نشده، وقتی headerهای امضای موردنیاز ارائه‌دهنده وجود ندارند، پیش از خواندن بدنه رد می‌شوند.
- Webhook مربوط به voice-call از profile بدنهٔ پیشااحراز مشترک (64 KB / 5 ثانیه) به‌همراه سقف در حال اجرا برای هر IP پیش از راستی‌آزمایی امضا استفاده می‌کند.

نمونه با میزبان عمومی پایدار:

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

وقتی Gateway از قبل در حال اجراست، فرمان‌های عملیاتی `voicecall` به runtime مربوط به voice-call تحت مالکیت Gateway واگذار می‌شوند تا CLI یک سرور Webhook دوم bind نکند. اگر هیچ Gateway در دسترس نباشد، فرمان‌ها به runtime مستقل CLI برمی‌گردند.

`latency` فایل `calls.jsonl` را از مسیر پیش‌فرض ذخیره‌سازی تماس صوتی می‌خواند.
از `--file <path>` برای اشاره به یک گزارش متفاوت و از `--last <n>` برای محدود کردن
تحلیل به آخرین N رکورد استفاده کنید (پیش‌فرض 200). خروجی شامل p50/p90/p99
برای تأخیر نوبت و زمان‌های انتظار شنیدن است.

## ابزار عامل

نام ابزار: `voice_call`.

| کنش            | آرگومان‌ها                                 |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

این مخزن یک سند Skills متناظر را در `skills/voice-call/SKILL.md` ارائه می‌کند.

## RPC Gateway

| روش                 | آرگومان‌ها                                 |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` فقط با `mode: "conversation"` معتبر است. تماس‌های حالت اعلان
اگر پس از برقراری تماس به رقم‌ها نیاز داشته باشند، باید از `voicecall.dtmf`
استفاده کنند.

## عیب‌یابی

### راه‌اندازی در معرض‌گذاری Webhook ناموفق می‌شود

راه‌اندازی را از همان محیطی اجرا کنید که Gateway را اجرا می‌کند:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

برای `twilio`، `telnyx` و `plivo`، `webhook-exposure` باید سبز باشد. یک
`publicUrl` پیکربندی‌شده همچنان زمانی شکست می‌خورد که به فضای شبکه محلی یا خصوصی
اشاره کند، چون اپراتور نمی‌تواند به آن نشانی‌ها callback بفرستد. از
`localhost`، `127.0.0.1`، `0.0.0.0`، `10.x`، `172.16.x`-`172.31.x`،
`192.168.x`، `169.254.x`، `fc00::/7` یا `fd00::/8` به‌عنوان `publicUrl`
استفاده نکنید.

تماس‌های خروجی Twilio در حالت اعلان، TwiML اولیه `<Say>` خود را مستقیم در
درخواست ایجاد تماس ارسال می‌کنند، بنابراین اولین پیام گفتاری به دریافت TwiML
Webhook توسط Twilio وابسته نیست. با این حال، Webhook عمومی همچنان برای callbackهای وضعیت،
تماس‌های مکالمه، DTMF پیش از اتصال، جریان‌های بلادرنگ و کنترل تماس پس از اتصال
لازم است.

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

پس از تغییر پیکربندی، Gateway را راه‌اندازی مجدد یا بازبارگذاری کنید، سپس اجرا کنید:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` یک اجرای آزمایشی خشک است مگر اینکه `--yes` را پاس بدهید.

### اعتبارنامه‌های ارائه‌دهنده ناموفق می‌شوند

ارائه‌دهنده انتخاب‌شده و فیلدهای اعتبارنامه لازم را بررسی کنید:

- Twilio: `twilio.accountSid`، `twilio.authToken` و `fromNumber`، یا
  `TWILIO_ACCOUNT_SID`، `TWILIO_AUTH_TOKEN` و `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`، `telnyx.connectionId`، `telnyx.publicKey` و
  `fromNumber`.
- Plivo: `plivo.authId`، `plivo.authToken` و `fromNumber`.

اعتبارنامه‌ها باید روی میزبان Gateway وجود داشته باشند. ویرایش پروفایل پوسته محلی
تا زمانی که Gateway از نو راه‌اندازی یا محیط آن بازبارگذاری نشود، روی Gateway
در حال اجرا اثری ندارد.

### تماس‌ها شروع می‌شوند اما Webhookهای ارائه‌دهنده نمی‌رسند

تأیید کنید کنسول ارائه‌دهنده به URL دقیق Webhook عمومی اشاره می‌کند:

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
- فایروال یا DNS نام میزبان عمومی را به جایی غیر از Gateway مسیریابی می‌کند.
- Gateway بدون فعال بودن Plugin تماس صوتی راه‌اندازی مجدد شده است.

وقتی یک پراکسی معکوس یا تونل جلوی Gateway قرار دارد، `webhookSecurity.allowedHosts`
را روی نام میزبان عمومی تنظیم کنید، یا برای یک نشانی پراکسی شناخته‌شده از
`webhookSecurity.trustedProxyIPs` استفاده کنید. فقط زمانی از
`webhookSecurity.trustForwardingHeaders` استفاده کنید که مرز پراکسی تحت کنترل
شما باشد.

### راستی‌آزمایی امضا ناموفق می‌شود

امضاهای ارائه‌دهنده با URL عمومی‌ای بررسی می‌شوند که OpenClaw از درخواست ورودی
بازسازی می‌کند. اگر امضاها ناموفق شدند:

- تأیید کنید URL Webhook ارائه‌دهنده دقیقاً با `publicUrl` مطابقت دارد، از جمله
  طرح، میزبان و مسیر.
- برای URLهای سطح رایگان ngrok، وقتی نام میزبان تونل تغییر می‌کند `publicUrl` را به‌روزرسانی کنید.
- مطمئن شوید پراکسی سرآیندهای host و proto اصلی را حفظ می‌کند، یا
  `webhookSecurity.allowedHosts` را پیکربندی کنید.
- `skipSignatureVerification` را خارج از آزمون محلی فعال نکنید.

### پیوستن‌های Twilio به Google Meet ناموفق می‌شوند

Google Meet از این Plugin برای پیوستن‌های شماره‌گیری Twilio استفاده می‌کند. ابتدا تماس صوتی را بررسی کنید:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

سپس انتقال Google Meet را به‌صورت صریح بررسی کنید:

```bash
openclaw googlemeet setup --transport twilio
```

اگر تماس صوتی سبز است اما شرکت‌کننده Meet هرگز نمی‌پیوندد، شماره شماره‌گیری Meet،
PIN و `--dtmf-sequence` را بررسی کنید. تماس تلفنی می‌تواند سالم باشد، در حالی که
جلسه یک توالی DTMF نادرست را رد یا نادیده می‌گیرد.

Google Meet توالی DTMF Meet و متن مقدمه را به `voicecall.start` پاس می‌دهد.
برای تماس‌های Twilio، تماس صوتی ابتدا TwiML مربوط به DTMF را سرو می‌کند، دوباره
به Webhook بازهدایت می‌کند، سپس جریان رسانه بلادرنگ را باز می‌کند تا مقدمه ذخیره‌شده
پس از پیوستن شرکت‌کننده تلفنی به جلسه تولید شود.

برای ردگیری زنده مرحله، از `openclaw logs --follow` استفاده کنید. یک پیوستن سالم
Twilio به Meet این ترتیب را ثبت می‌کند:

- Google Meet پیوستن Twilio را به تماس صوتی واگذار می‌کند.
- تماس صوتی TwiML مربوط به DTMF پیش از اتصال را ذخیره می‌کند.
- TwiML اولیه Twilio پیش از پردازش بلادرنگ مصرف و سرو می‌شود.
- تماس صوتی TwiML بلادرنگ را برای تماس Twilio سرو می‌کند.
- پل بلادرنگ با سلام اولیه در صف شروع می‌شود.

`openclaw voicecall tail` همچنان رکوردهای تماس ماندگارشده را نشان می‌دهد؛ برای
وضعیت تماس و رونوشت‌ها مفید است، اما هر گذار Webhook/بلادرنگ در آن ظاهر نمی‌شود.

### تماس بلادرنگ گفتاری ندارد

تأیید کنید فقط یک حالت صوتی فعال است. `realtime.enabled` و
`streaming.enabled` نمی‌توانند هر دو true باشند.

برای تماس‌های بلادرنگ Twilio، همچنین بررسی کنید:

- یک Plugin ارائه‌دهنده بلادرنگ بارگذاری و ثبت شده است.
- `realtime.provider` تنظیم نشده یا نام یک ارائه‌دهنده ثبت‌شده را مشخص می‌کند.
- کلید API ارائه‌دهنده برای فرایند Gateway در دسترس است.
- `openclaw logs --follow` نشان می‌دهد TwiML بلادرنگ سرو شده، پل بلادرنگ
  شروع شده و سلام اولیه در صف قرار گرفته است.

## مرتبط

- [حالت گفت‌وگو](/fa/nodes/talk)
- [تبدیل متن به گفتار](/fa/tools/tts)
- [بیدارباش صوتی](/fa/nodes/voicewake)
