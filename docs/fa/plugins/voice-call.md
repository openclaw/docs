---
read_when:
    - می‌خواهید از OpenClaw یک تماس صوتی خروجی برقرار کنید
    - شما در حال پیکربندی یا توسعهٔ Plugin تماس صوتی هستید
    - به صدای بلادرنگ یا رونویسی جریانی در بستر تلفنی نیاز دارید
sidebarTitle: Voice call
summary: برقراری تماس‌های صوتی خروجی و پذیرش تماس‌های صوتی ورودی از طریق Twilio، Telnyx یا Plivo، با امکان اختیاری صدای بلادرنگ و رونویسی جریانی
title: Plugin تماس صوتی
x-i18n:
    generated_at: "2026-06-27T18:34:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6eff6fe188644d6ac2f4868b28727783bd1859025e8745b1901e20637d68611c
    source_path: plugins/voice-call.md
    workflow: 16
---

تماس‌های صوتی برای OpenClaw از طریق یک plugin. از اعلان‌های خروجی،
گفت‌وگوهای چندمرحله‌ای، صدای realtime تمام‌دوطرفه، transcription
جریانی، و تماس‌های ورودی با سیاست‌های allowlist پشتیبانی می‌کند.

**ارائه‌دهندگان فعلی:** `twilio` (Programmable Voice + Media Streams)،
`telnyx` (Call Control v2)، `plivo` (Voice API + XML transfer + GetInput
speech)، `mock` (توسعه/بدون شبکه).

<Note>
plugin تماس صوتی **داخل فرایند Gateway** اجرا می‌شود. اگر از یک
Gateway راه دور استفاده می‌کنید، plugin را روی ماشینی که Gateway را اجرا
می‌کند نصب و پیکربندی کنید، سپس Gateway را برای بارگذاری آن راه‌اندازی
مجدد کنید.
</Note>

## شروع سریع

<Steps>
  <Step title="Install the plugin">
    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="From a local folder (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    برای دنبال کردن برچسب انتشار رسمی فعلی، از بسته بدون نسخه استفاده کنید. فقط
    زمانی نسخه دقیق را pin کنید که به نصب قابل بازتولید نیاز دارید.

    سپس Gateway را راه‌اندازی مجدد کنید تا plugin بارگذاری شود.

  </Step>
  <Step title="Configure provider and webhook">
    پیکربندی را زیر `plugins.entries.voice-call.config` تنظیم کنید (برای شکل کامل،
    [پیکربندی](#configuration) را در پایین ببینید). حداقل موارد لازم:
    `provider`، اعتبارنامه‌های ارائه‌دهنده، `fromNumber`، و یک URL مربوط به Webhook
    که به‌صورت عمومی قابل دسترسی باشد.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    خروجی پیش‌فرض در لاگ‌های چت و ترمینال‌ها خوانا است. این فرمان
    فعال بودن plugin، اعتبارنامه‌های ارائه‌دهنده، در معرض دسترس بودن Webhook،
    و فعال بودن فقط یک حالت صوتی (`streaming` یا `realtime`) را بررسی می‌کند. برای
    اسکریپت‌ها از `--json` استفاده کنید.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    هر دو به‌صورت پیش‌فرض اجرای آزمایشی بدون اثر هستند. برای برقرار کردن واقعی
    یک تماس کوتاه اعلان خروجی، `--yes` را اضافه کنید:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
برای Twilio، Telnyx، و Plivo، راه‌اندازی باید به یک **URL عمومی Webhook** برسد.
اگر `publicUrl`، URL تونل، URL مربوط به Tailscale، یا fallback سرو کردن
به loopback یا فضای شبکه خصوصی resolve شود، راه‌اندازی به‌جای شروع کردن
ارائه‌دهنده‌ای که نمی‌تواند Webhookهای حامل را دریافت کند، شکست می‌خورد.
</Warning>

## پیکربندی

اگر `enabled: true` باشد اما ارائه‌دهنده انتخاب‌شده اعتبارنامه‌ها را نداشته باشد،
هنگام شروع Gateway یک هشدار راه‌اندازی ناقص با کلیدهای مفقود در لاگ ثبت می‌شود و
شروع runtime رد می‌شود. فرمان‌ها، فراخوانی‌های RPC، و ابزارهای عامل همچنان
هنگام استفاده، همان پیکربندی مفقود ارائه‌دهنده را برمی‌گردانند.

<Note>
اعتبارنامه‌های voice-call از SecretRef پشتیبانی می‌کنند. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey`, و `plugins.entries.voice-call.config.tts.providers.*.apiKey` از طریق سطح استاندارد SecretRef resolve می‌شوند؛ [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface) را ببینید.
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
                  openai: { speakerVoice: "alloy" },
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
  <Accordion title="Provider exposure and security notes">
    - Twilio، Telnyx، و Plivo همگی به یک URL مربوط به Webhook که **به‌صورت عمومی قابل دسترسی** باشد نیاز دارند.
    - `mock` یک ارائه‌دهنده توسعه محلی است (بدون فراخوانی شبکه).
    - Telnyx به `telnyx.publicKey` (یا `TELNYX_PUBLIC_KEY`) نیاز دارد، مگر اینکه `skipSignatureVerification` برابر true باشد.
    - `skipSignatureVerification` فقط برای آزمایش محلی است.
    - در سطح رایگان ngrok، `publicUrl` را روی URL دقیق ngrok تنظیم کنید؛ راستی‌آزمایی امضا همیشه اعمال می‌شود.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` فقط زمانی به Webhookهای Twilio با امضاهای نامعتبر اجازه می‌دهد که `tunnel.provider="ngrok"` باشد و `serve.bind` برابر loopback باشد (عامل محلی ngrok). فقط توسعه محلی.
    - URLهای سطح رایگان Ngrok می‌توانند تغییر کنند یا رفتار میان‌صفحه‌ای اضافه کنند؛ اگر `publicUrl` جابه‌جا شود، امضاهای Twilio شکست می‌خورند. تولید: یک دامنه پایدار یا یک funnel در Tailscale را ترجیح دهید.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` سوکت‌هایی را می‌بندد که هرگز یک فریم معتبر `start` ارسال نمی‌کنند.
    - `streaming.maxPendingConnections` کل سوکت‌های pre-start احرازهویت‌نشده را محدود می‌کند.
    - `streaming.maxPendingConnectionsPerIp` سوکت‌های pre-start احرازهویت‌نشده را برای هر IP مبدا محدود می‌کند.
    - `streaming.maxConnections` کل سوکت‌های باز رسانه‌ای stream را محدود می‌کند (در انتظار + فعال).

  </Accordion>
  <Accordion title="Legacy config migrations">
    پیکربندی‌های قدیمی‌تر که از `provider: "log"`، `twilio.from`، یا کلیدهای قدیمی
    OpenAI در `streaming.*` استفاده می‌کنند، توسط `openclaw doctor --fix` بازنویسی می‌شوند.
    fallback در runtime فعلا همچنان کلیدهای قدیمی voice-call را می‌پذیرد، اما
    مسیر بازنویسی `openclaw doctor --fix` است و shim سازگاری
    موقتی است.

    کلیدهای streaming که به‌صورت خودکار مهاجرت می‌کنند:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## دامنه نشست

به‌صورت پیش‌فرض، Voice Call از `sessionScope: "per-phone"` استفاده می‌کند تا تماس‌های تکراری از
همان تماس‌گیرنده حافظه گفت‌وگو را نگه دارند. وقتی هر تماس حامل باید با زمینه تازه شروع شود،
برای مثال در جریان‌های پذیرش، رزرو، IVR، یا پل Google Meet که در آن یک شماره تلفن ممکن است
نماینده جلسه‌های متفاوت باشد، `sessionScope: "per-call"` را تنظیم کنید.

Voice Call کلیدهای نشست تولیدشده را زیر فضای نام عامل پیکربندی‌شده
(`agent:<agentId>:voice:*`) ذخیره می‌کند تا حافظه تماس پس از راه‌اندازی مجدد، از
canonicalization کلید نشست Gateway جان سالم به در ببرد. کلیدهای یکپارچه‌سازی صریح خام از همان
فضای نام عامل استفاده می‌کنند. یک کلید canonical با شکل `agent:<configuredAgentId>:*` همان مالک را نگه می‌دارد،
و aliasهای اصلی آن از `session.mainKey` هسته و دامنه سراسری پیروی می‌کنند. ورودی خارجی یا
بدشکل `agent:*` به‌عنوان یک کلید opaque زیر عامل پیکربندی‌شده scope می‌شود؛
`global` و `unknown` sentinelهای سراسری باقی می‌مانند. شروع Gateway کلیدهای خام قدیمی‌تر را
در storeهای پیش‌فرض یا مبتنی بر قالب `{agentId}` که مسیرشان یک مالک را اثبات می‌کند ارتقا می‌دهد.
در storeهای سفارشی ثابت، ردیف‌های legacy مبهم بدون تغییر باقی می‌مانند، زیرا
اطلاعات کافی برای انتخاب مالک ندارند؛ تماس‌های جدید از تاریخچه canonical agent-scoped استفاده می‌کنند.

## گفت‌وگوهای صوتی realtime

`realtime` یک ارائه‌دهنده صدای realtime تمام‌دوطرفه را برای صدای زنده تماس انتخاب می‌کند.
این از `streaming` جدا است؛ `streaming` فقط صدا را به
ارائه‌دهندگان realtime transcription ارسال می‌کند.

<Warning>
`realtime.enabled` نمی‌تواند با `streaming.enabled` ترکیب شود. برای هر تماس یک
حالت صوتی انتخاب کنید.
</Warning>

رفتار فعلی runtime:

- `realtime.enabled` برای Twilio Media Streams پشتیبانی می‌شود.
- `realtime.provider` اختیاری است. اگر تنظیم نشده باشد، Voice Call از اولین ارائه‌دهنده صدای realtime ثبت‌شده استفاده می‌کند.
- ارائه‌دهندگان bundled صدای realtime: Google Gemini Live (`google`) و OpenAI (`openai`) که توسط pluginهای ارائه‌دهنده خود ثبت می‌شوند.
- پیکربندی خام متعلق به ارائه‌دهنده زیر `realtime.providers.<providerId>` قرار دارد.
- Voice Call به‌صورت پیش‌فرض ابزار مشترک realtime با نام `openclaw_agent_consult` را در دسترس می‌گذارد. مدل realtime می‌تواند وقتی تماس‌گیرنده استدلال عمیق‌تر، اطلاعات فعلی، یا ابزارهای عادی OpenClaw را می‌خواهد، آن را فراخوانی کند.
- `realtime.consultPolicy` به‌صورت اختیاری راهنمایی اضافه می‌کند برای اینکه مدل realtime چه زمانی باید `openclaw_agent_consult` را فراخوانی کند.
- `realtime.agentContext.enabled` به‌صورت پیش‌فرض خاموش است. وقتی فعال باشد، Voice Call هنگام راه‌اندازی نشست، یک هویت عامل محدود و capsule انتخاب‌شده فایل‌های workspace را در دستورالعمل‌های ارائه‌دهنده realtime تزریق می‌کند.
- `realtime.fastContext.enabled` به‌صورت پیش‌فرض خاموش است. وقتی فعال باشد، Voice Call ابتدا حافظه/زمینه نشست ایندکس‌شده را برای پرسش consult جست‌وجو می‌کند و پیش از fallback به عامل consult کامل، آن snippetها را در بازه `realtime.fastContext.timeoutMs` به مدل realtime برمی‌گرداند؛ این fallback فقط وقتی انجام می‌شود که `realtime.fastContext.fallbackToConsult` برابر true باشد.
- اگر `realtime.provider` به ارائه‌دهنده‌ای ثبت‌نشده اشاره کند، یا اصلا هیچ ارائه‌دهنده صدای realtime ثبت نشده باشد، Voice Call یک هشدار در لاگ ثبت می‌کند و به‌جای شکست دادن کل plugin، رسانه realtime را رد می‌کند.
- کلیدهای نشست consult وقتی در دسترس باشند از نشست تماس ذخیره‌شده دوباره استفاده می‌کنند، سپس به `sessionScope` پیکربندی‌شده fallback می‌کنند (`per-phone` به‌صورت پیش‌فرض، یا `per-call` برای تماس‌های ایزوله).

### سیاست ابزار

`realtime.toolPolicy` اجرای consult را کنترل می‌کند:

| سیاست           | رفتار                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | ابزار consult را در دسترس می‌گذارد و عامل معمولی را به `read`، `web_search`، `web_fetch`، `x_search`، `memory_search`، و `memory_get` محدود می‌کند. |
| `owner`          | ابزار consult را در دسترس می‌گذارد و اجازه می‌دهد عامل معمولی از سیاست ابزار عادی عامل استفاده کند.                                                      |
| `none`           | ابزار consult را در دسترس نمی‌گذارد. `realtime.tools` سفارشی همچنان به ارائه‌دهنده realtime عبور داده می‌شوند.                               |

`realtime.consultPolicy` فقط دستورالعمل‌های مدل realtime را کنترل می‌کند:

| سیاست        | راهنمایی                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | prompt پیش‌فرض را نگه می‌دارد و اجازه می‌دهد ارائه‌دهنده تصمیم بگیرد چه زمانی ابزار consult را فراخوانی کند.              |
| `substantive` | چسب گفت‌وگویی ساده را مستقیما پاسخ می‌دهد و پیش از facts، memory، tools، یا context، consult می‌کند. |
| `always`      | پیش از هر پاسخ substantive، consult می‌کند.                                                        |

### زمینه صوتی عامل

`realtime.agentContext` را زمانی فعال کنید که پل صوتی باید بدون پرداخت هزینه رفت‌وبرگشت کامل مشورت با agent در نوبت‌های عادی، شبیه agent پیکربندی‌شده OpenClaw به نظر برسد. کپسول زمینه یک بار هنگام ایجاد نشست بی‌درنگ اضافه می‌شود، بنابراین تأخیر هر نوبت را افزایش نمی‌دهد. فراخوانی‌های `openclaw_agent_consult` همچنان agent کامل OpenClaw را اجرا می‌کنند و باید برای کار با ابزارها، اطلاعات جاری، جست‌وجوهای حافظه، یا وضعیت workspace استفاده شوند.

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

### نمونه‌های ارائه‌دهنده بی‌درنگ

<Tabs>
  <Tab title="Google Gemini Live">
    پیش‌فرض‌ها: کلید API از `realtime.providers.google.apiKey`،
    `GEMINI_API_KEY`، یا `GOOGLE_GENERATIVE_AI_API_KEY`؛ مدل
    `gemini-2.5-flash-native-audio-preview-12-2025`؛ صدا `Kore`.
    `sessionResumption` و `contextWindowCompression` به‌صورت پیش‌فرض برای تماس‌های طولانی‌تر و قابل اتصال مجدد فعال هستند. برای تنظیم نوبت‌گیری سریع‌تر روی صدای تلفنی، از `silenceDurationMs`، `startSensitivity`، و
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
                    speakerVoice: "Kore",
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

برای گزینه‌های صدای بی‌درنگ مخصوص هر ارائه‌دهنده، [ارائه‌دهنده Google](/fa/providers/google) و
[ارائه‌دهنده OpenAI](/fa/providers/openai) را ببینید.

## رونویسی جریانی

`streaming` یک ارائه‌دهنده رونویسی بی‌درنگ را برای صدای زنده تماس انتخاب می‌کند.

رفتار فعلی runtime:

- `streaming.provider` اختیاری است. اگر تنظیم نشده باشد، Voice Call از نخستین ارائه‌دهنده رونویسی بی‌درنگ ثبت‌شده استفاده می‌کند.
- ارائه‌دهندگان رونویسی بی‌درنگ همراه: Deepgram (`deepgram`)، ElevenLabs (`elevenlabs`)، Mistral (`mistral`)، OpenAI (`openai`)، و xAI (`xai`) که توسط Pluginهای ارائه‌دهنده خود ثبت می‌شوند.
- پیکربندی خام متعلق به ارائه‌دهنده زیر `streaming.providers.<providerId>` قرار دارد.
- پس از آنکه Twilio یک پیام `start` برای جریان پذیرفته‌شده ارسال می‌کند، Voice Call جریان را بلافاصله ثبت می‌کند، رسانه ورودی را تا زمان اتصال ارائه‌دهنده از طریق ارائه‌دهنده رونویسی در صف می‌گذارد، و فقط پس از آماده شدن رونویسی بی‌درنگ، خوشامدگویی اولیه را شروع می‌کند.
- اگر `streaming.provider` به ارائه‌دهنده‌ای ثبت‌نشده اشاره کند، یا هیچ ارائه‌دهنده‌ای ثبت نشده باشد، Voice Call به‌جای ناموفق کردن کل Plugin، یک هشدار ثبت می‌کند و از پخش جریانی رسانه صرف‌نظر می‌کند.

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
    endpoint `wss://api.x.ai/v1/stt`؛ encoding `mulaw`؛ نرخ نمونه‌برداری `8000`؛
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

Voice Call از پیکربندی هسته `messages.tts` برای گفتار جریانی در تماس‌ها استفاده می‌کند. می‌توانید آن را زیر پیکربندی Plugin با **همان شکل** بازنویسی کنید — این پیکربندی با `messages.tts` به‌صورت عمیق ادغام می‌شود.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**گفتار Microsoft برای تماس‌های صوتی نادیده گرفته می‌شود.** صدای تلفنی به PCM نیاز دارد؛
transport فعلی Microsoft خروجی PCM تلفنی را ارائه نمی‌کند.
</Warning>

نکته‌های رفتاری:

- کلیدهای قدیمی `tts.<provider>` داخل پیکربندی Plugin (`openai`، `elevenlabs`، `microsoft`، `edge`) با `openclaw doctor --fix` ترمیم می‌شوند؛ پیکربندی commit‌شده باید از `tts.providers.<provider>` استفاده کند.
- Core TTS زمانی استفاده می‌شود که پخش جریانی رسانه Twilio فعال باشد؛ در غیر این صورت تماس‌ها به صداهای بومی ارائه‌دهنده بازمی‌گردند.
- اگر یک جریان رسانه Twilio از قبل فعال باشد، Voice Call به TwiML `<Say>` بازنمی‌گردد. اگر TTS تلفنی در آن وضعیت در دسترس نباشد، درخواست پخش به‌جای ترکیب دو مسیر پخش، ناموفق می‌شود.
- وقتی TTS تلفنی به یک ارائه‌دهنده ثانویه بازمی‌گردد، Voice Call برای اشکال‌زدایی یک هشدار همراه با زنجیره ارائه‌دهنده (`from`، `to`، `attempts`) ثبت می‌کند.
- وقتی barge-in یا teardown جریان Twilio صف TTS در انتظار را پاک می‌کند، درخواست‌های پخش صف‌شده به‌جای معلق ماندن تماس‌گیرندگانی که منتظر تکمیل پخش هستند، تعیین‌تکلیف می‌شوند.

### نمونه‌های TTS

<Tabs>
  <Tab title="Core TTS only">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { speakerVoice: "alloy" },
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
                speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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
                speakerVoice: "marin",
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

سیاست ورودی به‌طور پیش‌فرض روی `disabled` است. برای فعال‌کردن تماس‌های ورودی، تنظیم کنید:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` یک غربالگری شناسهٔ تماس‌گیرنده با اطمینان پایین است.
plugin مقدار `From` ارائه‌شده توسط ارائه‌دهنده را نرمال‌سازی می‌کند و آن را با
`allowFrom` مقایسه می‌کند. راستی‌آزمایی Webhook تحویل ارائه‌دهنده و
یکپارچگی payload را احراز می‌کند، اما مالکیت شمارهٔ تماس‌گیرندهٔ PSTN/VoIP را
**اثبات نمی‌کند**. با `allowFrom` به‌عنوان فیلتر شناسهٔ تماس‌گیرنده برخورد کنید، نه هویت
قوی تماس‌گیرنده.
</Warning>

پاسخ‌های خودکار از سامانهٔ عامل استفاده می‌کنند. با `responseModel`،
`responseSystemPrompt` و `responseTimeoutMs` تنظیم کنید.

### مسیریابی بر اساس شماره

وقتی یک plugin تماس صوتی برای چند شمارهٔ تلفن تماس دریافت می‌کند و هر شماره باید
مانند یک خط متفاوت رفتار کند، از `numbers` استفاده کنید. برای مثال، یک
شماره می‌تواند از یک دستیار شخصی غیررسمی استفاده کند، در حالی که شماره‌ای دیگر از یک
شخصیت کاری، یک عامل پاسخ‌دهندهٔ متفاوت، و یک صدای TTS متفاوت استفاده کند.

مسیرها از شمارهٔ `To` شماره‌گیری‌شده و ارائه‌شده توسط ارائه‌دهنده انتخاب می‌شوند. کلیدها باید
شماره‌های E.164 باشند. وقتی تماسی وارد می‌شود، Voice Call مسیر منطبق را یک‌بار حل می‌کند،
مسیر منطبق را در رکورد تماس ذخیره می‌کند، و همان پیکربندی مؤثر را
برای خوشامدگویی، مسیر پاسخ خودکار کلاسیک، مسیر مشاورهٔ بی‌درنگ، و پخش TTS
دوباره به‌کار می‌گیرد. اگر هیچ مسیری منطبق نباشد، پیکربندی سراسری Voice Call استفاده می‌شود.
تماس‌های خروجی از `numbers` استفاده نمی‌کنند؛ هنگام شروع تماس، مقصد خروجی، پیام، و
نشست را صریحاً ارسال کنید.

بازنویسی‌های مسیر در حال حاضر پشتیبانی می‌کنند از:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

مقدار مسیر `tts` به‌صورت deep-merge روی پیکربندی سراسری `tts` در Voice Call ادغام می‌شود، بنابراین
معمولاً می‌توانید فقط صدای ارائه‌دهنده را بازنویسی کنید:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### قرارداد خروجی گفتاری

برای پاسخ‌های خودکار، Voice Call یک قرارداد سخت‌گیرانهٔ خروجی گفتاری را به
system prompt اضافه می‌کند:

```text
{"spoken":"..."}
```

Voice Call متن گفتار را به‌صورت دفاعی استخراج می‌کند:

- payloadهایی را که به‌عنوان محتوای استدلال/خطا علامت‌گذاری شده‌اند نادیده می‌گیرد.
- JSON مستقیم، JSON محصورشده، یا کلیدهای درون‌خطی `"spoken"` را parse می‌کند.
- به متن ساده بازمی‌گردد و پاراگراف‌های آغازین احتمالیِ برنامه‌ریزی/فرا را حذف می‌کند.

این کار پخش گفتاری را روی متن روبه‌روی تماس‌گیرنده متمرکز نگه می‌دارد و از
نشت متن برنامه‌ریزی به صدا جلوگیری می‌کند.

### رفتار شروع مکالمه

برای تماس‌های خروجی `conversation`، مدیریت پیام اول به وضعیت پخش زنده
گره خورده است:

- پاک‌سازی صف barge-in و پاسخ خودکار فقط زمانی سرکوب می‌شوند که خوشامدگویی اولیه فعالانه در حال گفتن باشد.
- اگر پخش اولیه شکست بخورد، تماس به `listening` برمی‌گردد و پیام اولیه برای تلاش دوباره در صف می‌ماند.
- پخش اولیه برای استریم Twilio هنگام اتصال استریم، بدون تأخیر اضافی شروع می‌شود.
- barge-in پخش فعال را لغو می‌کند و ورودی‌های TTS مربوط به Twilio را که در صف هستند اما هنوز پخش نشده‌اند پاک می‌کند. ورودی‌های پاک‌شده به‌عنوان skipped حل می‌شوند، بنابراین منطق پاسخ بعدی می‌تواند بدون انتظار برای صدایی که هرگز پخش نخواهد شد ادامه یابد.
- مکالمه‌های صوتی بی‌درنگ از نوبت آغازین خود استریم بی‌درنگ استفاده می‌کنند. Voice Call برای آن پیام اولیه یک به‌روزرسانی TwiML قدیمیِ `<Say>` ارسال **نمی‌کند**، بنابراین نشست‌های خروجی `<Connect><Stream>` متصل باقی می‌مانند.

### مهلت قطع اتصال استریم Twilio

وقتی یک جریان رسانه‌ای Twilio قطع می‌شود، Voice Call پیش از
پایان‌دهی خودکار تماس **2000 ms** صبر می‌کند:

- اگر جریان در طول این بازه دوباره وصل شود، پایان‌دهی خودکار لغو می‌شود.
- اگر پس از مهلت ارفاقی هیچ جریانی دوباره ثبت نشود، تماس پایان داده می‌شود تا از گیرکردن تماس‌های فعال جلوگیری شود.

## پاک‌ساز تماس کهنه

از `staleCallReaperSeconds` برای پایان‌دادن به تماس‌هایی استفاده کنید که هرگز
Webhook پایانی دریافت نمی‌کنند (برای مثال، تماس‌های حالت notify که هرگز کامل نمی‌شوند). مقدار پیش‌فرض
`0` است (غیرفعال).

بازه‌های پیشنهادی:

- **محیط تولید:** `120` تا `300` ثانیه برای جریان‌های سبک notify.
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
نشانی عمومی را برای تأیید امضا بازسازی می‌کند. این گزینه‌ها
کنترل می‌کنند کدام هدرهای فورواردشده مورد اعتماد هستند:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  میزبان‌های موجود در فهرست مجاز را از هدرهای فورواردینگ مجاز کنید.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  به هدرهای فورواردشده بدون فهرست مجاز اعتماد کنید.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  فقط وقتی IP راه‌دور درخواست با فهرست مطابقت دارد، به هدرهای فورواردشده اعتماد کنید.
</ParamField>

محافظت‌های اضافی:

- **محافظت در برابر بازپخش** Webhook برای Twilio و Plivo فعال است. درخواست‌های Webhook معتبرِ بازپخش‌شده تأیید می‌شوند اما برای اثرات جانبی نادیده گرفته می‌شوند.
- نوبت‌های مکالمه Twilio در callbackهای `<Gather>` شامل یک توکن مختص هر نوبت هستند، بنابراین callbackهای گفتار کهنه/بازپخش‌شده نمی‌توانند یک نوبت transcript در انتظارِ جدیدتر را برآورده کنند.
- درخواست‌های Webhook احرازنشده، وقتی هدرهای امضای لازم ارائه‌دهنده وجود ندارند، پیش از خواندن بدنه رد می‌شوند.
- Webhook مربوط به voice-call از پروفایل بدنه پیش‌احراز هویت مشترک (64 KB / 5 ثانیه) به‌همراه سقف درخواست‌های در حال اجرا برای هر IP پیش از تأیید امضا استفاده می‌کند.

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

وقتی Gateway از قبل در حال اجرا است، فرمان‌های عملیاتی `voicecall`
به runtime مربوط به voice-call که مالک آن Gateway است واگذار می‌شوند تا CLI یک سرور
Webhook دوم bind نکند. اگر هیچ Gateway در دسترس نباشد، فرمان‌ها به یک
runtime مستقل CLI برمی‌گردند.

`latency` فایل `calls.jsonl` را از مسیر ذخیره‌سازی پیش‌فرض voice-call می‌خواند.
از `--file <path>` برای اشاره به یک گزارش متفاوت و از `--last <n>` برای محدودکردن
تحلیل به آخرین N رکورد استفاده کنید (پیش‌فرض 200). خروجی شامل p50/p90/p99
برای تأخیر نوبت و زمان‌های انتظار برای شنیدن است.

## ابزار عامل

نام ابزار: `voice_call`.

| کنش | آرگومان‌ها |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Plugin مربوط به voice-call یک مهارت عامل متناظر را همراه خود ارائه می‌کند.

## Gateway RPC

| روش | آرگومان‌ها |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` فقط با `mode: "conversation"` معتبر است. تماس‌های حالت notify
اگر پس از برقراری اتصال به ارقام نیاز داشته باشند، باید پس از ایجاد تماس از
`voicecall.dtmf` استفاده کنند.

## عیب‌یابی

### راه‌اندازی در نمایش Webhook شکست می‌خورد

راه‌اندازی را از همان محیطی اجرا کنید که Gateway را اجرا می‌کند:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

برای `twilio`، `telnyx` و `plivo`، `webhook-exposure` باید سبز باشد. یک
`publicUrl` پیکربندی‌شده همچنان وقتی به فضای شبکه محلی یا خصوصی اشاره کند
شکست می‌خورد، چون اپراتور نمی‌تواند به آن نشانی‌ها callback بزند. از
`localhost`، `127.0.0.1`، `0.0.0.0`، `10.x`، `172.16.x`-`172.31.x`،
`192.168.x`، `169.254.x`، `fc00::/7` یا `fd00::/8` به‌عنوان `publicUrl` استفاده نکنید.

تماس‌های خروجی حالت notify در Twilio، TwiML اولیه `<Say>` خود را مستقیماً در
درخواست create-call می‌فرستند، بنابراین نخستین پیام گفتاری به دریافت TwiML مربوط به Webhook توسط Twilio
وابسته نیست. Webhook عمومی همچنان برای callbackهای وضعیت،
تماس‌های مکالمه، DTMF پیش از اتصال، جریان‌های realtime و کنترل تماس پس از اتصال
لازم است.

از یک مسیر نمایش عمومی استفاده کنید:

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

`voicecall smoke` یک اجرای آزمایشی بدون اثر است، مگر اینکه `--yes` را پاس کنید.

### اعتبارنامه‌های ارائه‌دهنده شکست می‌خورند

ارائه‌دهنده انتخاب‌شده و فیلدهای اعتبارنامه لازم را بررسی کنید:

- Twilio: `twilio.accountSid`، `twilio.authToken` و `fromNumber`، یا
  `TWILIO_ACCOUNT_SID`، `TWILIO_AUTH_TOKEN` و `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`، `telnyx.connectionId`، `telnyx.publicKey` و
  `fromNumber`.
- Plivo: `plivo.authId`، `plivo.authToken` و `fromNumber`.

اعتبارنامه‌ها باید روی میزبان Gateway وجود داشته باشند. ویرایش پروفایل shell محلی
تا زمانی که Gateway در حال اجرا restart نشود یا محیط خود را reload نکند،
روی آن اثر نمی‌گذارد.

### تماس‌ها شروع می‌شوند اما Webhookهای ارائه‌دهنده نمی‌رسند

تأیید کنید کنسول ارائه‌دهنده به نشانی عمومی دقیق Webhook اشاره می‌کند:

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
- نشانی تونل پس از شروع Gateway تغییر کرده است.
- یک پراکسی درخواست را فوروارد می‌کند اما هدرهای host/proto را حذف یا بازنویسی می‌کند.
- فایروال یا DNS نام میزبان عمومی را به جایی غیر از Gateway مسیریابی می‌کند.
- Gateway بدون فعال‌بودن Plugin Voice Call restart شده است.

وقتی یک پراکسی معکوس یا تونل جلوی Gateway است،
`webhookSecurity.allowedHosts` را روی نام میزبان عمومی تنظیم کنید، یا از
`webhookSecurity.trustedProxyIPs` برای یک نشانی پراکسی شناخته‌شده استفاده کنید. فقط وقتی
مرز پراکسی تحت کنترل شما است از
`webhookSecurity.trustForwardingHeaders` استفاده کنید.

### تأیید امضا شکست می‌خورد

امضاهای ارائه‌دهنده با نشانی عمومی‌ای بررسی می‌شوند که OpenClaw از درخواست ورودی
بازسازی می‌کند. اگر امضاها شکست می‌خورند:

- تأیید کنید نشانی Webhook ارائه‌دهنده دقیقاً با `publicUrl` مطابقت دارد، شامل
  scheme، host و path.
- برای نشانی‌های سطح رایگان ngrok، وقتی نام میزبان تونل تغییر می‌کند `publicUrl` را به‌روزرسانی کنید.
- مطمئن شوید پراکسی هدرهای اصلی host و proto را حفظ می‌کند، یا
  `webhookSecurity.allowedHosts` را پیکربندی کنید.
- `skipSignatureVerification` را بیرون از تست محلی فعال نکنید.

### پیوستن‌های Google Meet از طریق Twilio شکست می‌خورند

Google Meet از این Plugin برای پیوستن‌های dial-in از طریق Twilio استفاده می‌کند. ابتدا Voice Call را تأیید کنید:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

سپس ترابری Google Meet را به‌صراحت تأیید کنید:

```bash
openclaw googlemeet setup --transport twilio
```

اگر Voice Call سبز است اما شرکت‌کننده Meet هرگز نمی‌پیوندد، شماره dial-in مربوط به Meet،
PIN و `--dtmf-sequence` را بررسی کنید. تماس تلفنی می‌تواند سالم باشد در حالی که
جلسه یک توالی DTMF نادرست را رد یا نادیده می‌گیرد.

Google Meet شاخه تلفنی Twilio را از طریق `voicecall.start` با یک
توالی DTMF پیش از اتصال شروع می‌کند. توالی‌های مشتق‌شده از PIN شامل
`voiceCall.dtmfDelayMs` مربوط به Plugin Google Meet به‌عنوان ارقام انتظار ابتدایی Twilio هستند. مقدار پیش‌فرض 12 ثانیه است
چون اعلان‌های dial-in در Meet ممکن است دیر برسند. سپس Voice Call پیش از
درخواست خوشامدگویی آغازین دوباره به مدیریت realtime هدایت می‌شود.

از `openclaw logs --follow` برای trace زنده فاز استفاده کنید. یک پیوستن سالم Twilio Meet
این ترتیب را ثبت می‌کند:

- Google Meet پیوستن Twilio را به Voice Call واگذار می‌کند.
- Voice Call، TwiML مربوط به DTMF پیش از اتصال را ذخیره می‌کند.
- TwiML اولیه Twilio پیش از مدیریت realtime مصرف و سرو می‌شود.
- Voice Call، TwiML مربوط به realtime را برای تماس Twilio سرو می‌کند.
- Google Meet پس از تأخیر پس از DTMF، گفتار آغازین را با `voicecall.speak` درخواست می‌کند.

`openclaw voicecall tail` همچنان رکوردهای تماس ماندگارشده را نشان می‌دهد؛ برای
وضعیت تماس و transcriptها مفید است، اما هر گذار Webhook/realtime در آن
ظاهر نمی‌شود.

### تماس realtime گفتار ندارد

تأیید کنید فقط یک حالت صوتی فعال است. `realtime.enabled` و
`streaming.enabled` نمی‌توانند هر دو true باشند.

برای تماس‌های realtime Twilio، همچنین بررسی کنید:

- یک Plugin ارائه‌دهنده realtime بارگذاری و ثبت شده است.
- `realtime.provider` تنظیم نشده یا نام یک ارائه‌دهنده ثبت‌شده را دارد.
- کلید API ارائه‌دهنده برای فرایند Gateway در دسترس است.
- `openclaw logs --follow` نشان می‌دهد TwiML مربوط به realtime سرو شده، پل realtime
  شروع شده و خوشامدگویی اولیه در صف قرار گرفته است.

## مرتبط

- [حالت گفتگو](/fa/nodes/talk)
- [تبدیل متن به گفتار](/fa/tools/tts)
- [بیدارباش صوتی](/fa/nodes/voicewake)
