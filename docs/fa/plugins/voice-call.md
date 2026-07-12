---
read_when:
    - می‌خواهید از OpenClaw یک تماس صوتی خروجی برقرار کنید
    - در حال پیکربندی یا توسعهٔ Plugin تماس صوتی هستید
    - برای تلفن به صدای بلادرنگ یا رونویسی جریانی نیاز دارید
sidebarTitle: Voice call
summary: با استفاده از Twilio، Telnyx یا Plivo تماس‌های صوتی خروجی برقرار و تماس‌های ورودی را دریافت کنید؛ با امکان اختیاری مکالمهٔ صوتی بلادرنگ و رونویسی جریانی.
title: Plugin تماس صوتی
x-i18n:
    generated_at: "2026-07-12T10:37:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

تماس‌های صوتی برای OpenClaw از طریق یک Plugin: اعلان‌های خروجی، مکالمات
چندنوبتی، صدای بلادرنگ تمام‌دوطرفه، رونویسی جریانی و تماس‌های ورودی با
سیاست‌های فهرست مجاز.

**ارائه‌دهندگان:** `mock` (توسعه، بدون شبکه)، `plivo` (Voice API + انتقال XML +
گفتار GetInput)، `telnyx` (Call Control v2)، `twilio` (Programmable Voice +
Media Streams).

<Note>
Plugin تماس صوتی **درون فرایند Gateway** اجرا می‌شود. اگر از یک Gateway
راه‌دور استفاده می‌کنید، Plugin را روی دستگاهی که Gateway را اجرا می‌کند
نصب و پیکربندی کنید، سپس برای بارگذاری آن Gateway را مجدداً راه‌اندازی کنید.
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

    برای دنبال‌کردن برچسب انتشار فعلی، از بسته بدون نسخه استفاده کنید. تنها
    زمانی نسخه‌ای دقیق را ثابت کنید که به نصبی تکرارپذیر نیاز دارید. پس از آن
    Gateway را مجدداً راه‌اندازی کنید تا Plugin بارگذاری شود.

  </Step>
  <Step title="پیکربندی ارائه‌دهنده و Webhook">
    پیکربندی را در `plugins.entries.voice-call.config` تنظیم کنید (بخش
    [پیکربندی](#configuration) را در ادامه ببینید). حداقل موارد لازم:
    `provider`، اطلاعات احراز هویت ارائه‌دهنده، `fromNumber` و یک نشانی
    Webhook قابل‌دسترسی عمومی.
  </Step>
  <Step title="تأیید راه‌اندازی">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    فعال‌بودن Plugin، اطلاعات احراز هویت ارائه‌دهنده، دسترسی عمومی Webhook
    و فعال‌بودن تنها یک حالت صوتی (`streaming` یا `realtime`) را بررسی می‌کند.

  </Step>
  <Step title="آزمایش اولیه">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    هر دو به‌طور پیش‌فرض اجرای آزمایشی هستند. برای برقراری یک تماس اعلان
    خروجی کوتاه، `--yes` را اضافه کنید:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
برای Twilio، Telnyx و Plivo، راه‌اندازی باید به یک **نشانی Webhook عمومی**
منتهی شود. اگر `publicUrl`، نشانی تونل، نشانی Tailscale یا گزینه جایگزین
سرویس‌دهی به local loopback یا فضای شبکه خصوصی منتهی شود، راه‌اندازی به‌جای
اجرای ارائه‌دهنده‌ای که نمی‌تواند Webhookهای اپراتور را دریافت کند، شکست می‌خورد.
</Warning>

## پیکربندی

اگر `enabled: true` باشد اما اطلاعات احراز هویت ارائه‌دهنده انتخاب‌شده موجود
نباشد، هنگام شروع Gateway یک هشدار ناقص‌بودن راه‌اندازی همراه با کلیدهای
مفقود ثبت می‌شود و اجرای زمان‌اجرا آغاز نمی‌گردد. فرمان‌ها، فراخوانی‌های RPC
و ابزارهای عامل هنگام استفاده همچنان پیکربندی دقیق مفقود را برمی‌گردانند.

<Note>
اطلاعات احراز هویت تماس صوتی از SecretRef پشتیبانی می‌کند. `plugins.entries.voice-call.config.twilio.authToken`، `plugins.entries.voice-call.config.realtime.providers.*.apiKey`، `plugins.entries.voice-call.config.streaming.providers.*.apiKey` و `plugins.entries.voice-call.config.tts.providers.*.apiKey` از طریق سطح استاندارد SecretRef تفکیک می‌شوند؛ [سطح اطلاعات احراز هویت SecretRef](/fa/reference/secretref-credential-surface) را ببینید.
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
            // region: "ie1", // optional: us1 | ie1 | au1; defaults to us1
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
          realtime: { enabled: false /* see Realtime voice conversations */ },
        },
      },
    },
  },
}
```

### مرجع پیکربندی

کلیدهای سطح بالای `plugins.entries.voice-call.config` که در بالا نشان داده نشده‌اند:

| کلید                            | پیش‌فرض      | توضیحات                                                                                         |
| ------------------------------- | ------------ | ------------------------------------------------------------------------------------------------ |
| `enabled`                       | `false`      | کلید اصلی روشن/خاموش.                                                                           |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`. بخش [تماس‌های ورودی](#inbound-calls) را ببینید. |
| `allowFrom`                     | `[]`         | فهرست مجاز E.164 برای `inboundPolicy: "allowlist"`.                                              |
| `maxDurationSeconds`            | `300`        | سقف قطعی مدت هر تماس که مستقل از وضعیت پاسخ‌گویی اعمال می‌شود.                                  |
| `staleCallReaperSeconds`        | `120`        | بخش [پاک‌ساز تماس‌های متروک](#stale-call-reaper) را ببینید. `0` آن را غیرفعال می‌کند.             |
| `silenceTimeoutMs`              | `800`        | تشخیص سکوت پایان گفتار برای جریان کلاسیک (غیربلادرنگ).                                          |
| `transcriptTimeoutMs`           | `180000`     | حداکثر زمان انتظار برای رونویسی تماس‌گیرنده پیش از صرف‌نظر از یک نوبت.                           |
| `ringTimeoutMs`                 | `30000`      | مهلت زنگ‌خوردن تماس‌های خروجی.                                                                  |
| `maxConcurrentCalls`            | `1`          | تماس‌های خروجی فراتر از این محدودیت رد می‌شوند.                                                 |
| `outbound.notifyHangupDelaySec` | `3`          | مدت انتظار بر حسب ثانیه پس از TTS، پیش از قطع خودکار تماس در حالت اعلان.                         |
| `skipSignatureVerification`     | `false`      | فقط برای آزمایش محلی؛ هرگز در محیط عملیاتی فعال نکنید.                                          |
| `store`                         | تنظیم‌نشده   | مسیر پیش‌فرض گزارش تماس `~/.openclaw/voice-calls` را بازنویسی می‌کند.                             |
| `agentId`                       | `"main"`     | عاملی که برای تولید پاسخ و ذخیره‌سازی نشست استفاده می‌شود.                                      |
| `responseModel`                 | تنظیم‌نشده   | مدل پیش‌فرض پاسخ‌های کلاسیک (غیربلادرنگ) را بازنویسی می‌کند.                                     |
| `responseSystemPrompt`          | تولیدشده     | اعلان سیستمی سفارشی برای پاسخ‌های کلاسیک.                                                       |
| `responseTimeoutMs`             | `30000`      | مهلت تولید پاسخ کلاسیک (میلی‌ثانیه).                                                            |

Twilio به‌طور پیش‌فرض از نقطه پایانی REST منطقه US1 خود استفاده می‌کند. برای
پردازش تماس‌ها در یک منطقه پشتیبانی‌شده خارج از ایالات متحده، `twilio.region`
را روی `ie1` یا `au1` تنظیم کنید و از اطلاعات احراز هویت همان منطقه استفاده
کنید. [راهنمای REST API خارج از ایالات متحده Twilio](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region)
را ببینید.

<AccordionGroup>
  <Accordion title="نکات دسترسی عمومی و امنیت ارائه‌دهنده">
    - Twilio، Telnyx و Plivo همگی به یک نشانی Webhook **قابل‌دسترسی عمومی** نیاز دارند.
    - `mock` یک ارائه‌دهنده توسعه محلی است (بدون فراخوانی شبکه).
    - Telnyx به `telnyx.publicKey` (یا `TELNYX_PUBLIC_KEY`) نیاز دارد، مگر اینکه `skipSignatureVerification` برابر با true باشد.
    - `skipSignatureVerification` فقط برای آزمایش محلی است.
    - در سطح رایگان ngrok، `publicUrl` را روی نشانی دقیق ngrok تنظیم کنید؛ تأیید امضا همیشه اعمال می‌شود.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` Webhookهای Twilio با امضای نامعتبر را **تنها** زمانی مجاز می‌کند که `tunnel.provider="ngrok"` و `serve.bind` برابر با local loopback باشد (عامل محلی ngrok). فقط برای توسعه محلی.
    - نشانی‌های سطح رایگان Ngrok ممکن است تغییر کنند یا رفتار میان‌صفحه‌ای اضافه کنند؛ اگر `publicUrl` تغییر کند، امضاهای Twilio نامعتبر می‌شوند. برای محیط عملیاتی، یک دامنه پایدار یا یک تونل Tailscale را ترجیح دهید.

  </Accordion>
  <Accordion title="سقف اتصال‌های جریانی">
    - `streaming.preStartTimeoutMs` (پیش‌فرض `5000`) سوکت‌هایی را می‌بندد که هرگز یک فریم معتبر `start` ارسال نمی‌کنند.
    - `streaming.maxPendingConnections` (پیش‌فرض `32`) تعداد کل سوکت‌های احراز هویت‌نشده پیش از شروع را محدود می‌کند.
    - `streaming.maxPendingConnectionsPerIp` (پیش‌فرض `4`) تعداد سوکت‌های احراز هویت‌نشده پیش از شروع را برای هر نشانی IP مبدأ محدود می‌کند.
    - `streaming.maxConnections` (پیش‌فرض `128`) تعداد تمام سوکت‌های باز جریان رسانه‌ای را محدود می‌کند (در انتظار + فعال).

  </Accordion>
  <Accordion title="مهاجرت پیکربندی قدیمی">
    تجزیه پیکربندی این کلیدهای قدیمی را به‌طور خودکار عادی‌سازی می‌کند و
    هشداری شامل مسیر جایگزین ثبت می‌کند؛ این لایه سازگاری در انتشار آینده
    (`2026.6.0`) حذف می‌شود، بنابراین برای بازنویسی پیکربندی ثبت‌شده به شکل
    معیار، `openclaw doctor --fix` را اجرا کنید:

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` حذف شده است (زمینه بلادرنگ اکنون از اعلان تولیدشده عامل استفاده می‌کند)

  </Accordion>
</AccordionGroup>

## دامنه نشست

به‌طور پیش‌فرض، تماس صوتی از `sessionScope: "per-phone"` استفاده می‌کند تا
تماس‌های تکراری از یک تماس‌گیرنده، حافظه مکالمه را حفظ کنند. زمانی که هر تماس
اپراتور باید با زمینه‌ای تازه آغاز شود، `sessionScope: "per-call"` را تنظیم
کنید؛ برای نمونه در جریان‌های پذیرش، رزرو، IVR یا پل Google Meet که ممکن است
یک شماره تلفن نماینده جلسه‌های متفاوت باشد.

تماس صوتی کلیدهای نشست تولیدشده را در فضای نام عامل پیکربندی‌شده
(`agent:<agentId>:voice:*`) ذخیره می‌کند. کلیدهای صریح و خام یکپارچه‌سازی نیز
در همان فضای نام تفکیک می‌شوند: یک کلید معیار `agent:<configuredAgentId>:*`
مالک خود را حفظ می‌کند و از نام مستعار `session.mainKey`/دامنه سراسری هسته
پیروی می‌کند؛ ورودی خارجی یا بدشکل `agent:*` به‌عنوان کلیدی مبهم در محدوده
عامل پیکربندی‌شده قرار می‌گیرد؛ `global` و `unknown` همچنان نشانگرهای سراسری
باقی می‌مانند.

## مکالمات صوتی بلادرنگ

`realtime` یک ارائه‌دهنده صدای بلادرنگ تمام‌دوطرفه را برای صدای زنده تماس
انتخاب می‌کند. این قابلیت از `streaming` جدا است؛ `streaming` فقط صدا را به
ارائه‌دهندگان رونویسی بلادرنگ ارسال می‌کند.

<Warning>
`realtime.enabled` را نمی‌توان با `streaming.enabled` ترکیب کرد. برای هر تماس
یک حالت صوتی انتخاب کنید.
</Warning>

رفتار فعلی زمان‌اجرا:

- `realtime.enabled` برای Twilio و Telnyx پشتیبانی می‌شود.
- `realtime.provider` اختیاری است. اگر تنظیم نشده باشد، تماس صوتی از نخستین ارائه‌دهندهٔ ثبت‌شدهٔ صدای بلادرنگ استفاده می‌کند.
- ارائه‌دهندگان همراهِ صدای بلادرنگ: Google Gemini Live (`google`) و OpenAI (`openai`) که توسط Pluginهای ارائه‌دهندهٔ خود ثبت می‌شوند.
- پیکربندی خامِ متعلق به ارائه‌دهنده در `realtime.providers.<providerId>` قرار می‌گیرد.
- تماس صوتی به‌طور پیش‌فرض ابزار بلادرنگ مشترک `openclaw_agent_consult` را در دسترس قرار می‌دهد. مدل بلادرنگ می‌تواند وقتی تماس‌گیرنده استدلال عمیق‌تر، اطلاعات جاری یا ابزارهای معمول OpenClaw را درخواست می‌کند، آن را فراخوانی کند.
- `realtime.consultPolicy` به‌صورت اختیاری راهنمایی‌هایی دربارهٔ زمان فراخوانی `openclaw_agent_consult` توسط مدل بلادرنگ اضافه می‌کند.
- `realtime.agentContext.enabled` به‌طور پیش‌فرض غیرفعال است. وقتی فعال باشد، تماس صوتی هنگام راه‌اندازی نشست، یک هویت محدودشدهٔ عامل و کپسولی از فایل‌های منتخب فضای کاری را به دستورالعمل‌های ارائه‌دهندهٔ بلادرنگ تزریق می‌کند.
- `realtime.fastContext.enabled` به‌طور پیش‌فرض غیرفعال است. وقتی فعال باشد، تماس صوتی ابتدا زمینهٔ نمایه‌شدهٔ حافظه/نشست را برای پرسش مشاوره جست‌وجو می‌کند و پیش از بازگشت به عامل مشاورهٔ کامل، آن قطعه‌ها را ظرف `realtime.fastContext.timeoutMs` به مدل بلادرنگ بازمی‌گرداند؛ این بازگشت فقط زمانی انجام می‌شود که `realtime.fastContext.fallbackToConsult` برابر با `true` باشد.
- اگر `realtime.provider` به ارائه‌دهنده‌ای ثبت‌نشده اشاره کند، یا هیچ ارائه‌دهندهٔ صدای بلادرنگی ثبت نشده باشد، تماس صوتی به‌جای از کار انداختن کل Plugin، هشداری ثبت می‌کند و از رسانهٔ بلادرنگ صرف‌نظر می‌کند.
- وقتی `realtime.enabled` برابر با `true` است، `inboundPolicy` نباید `"disabled"` باشد؛ `validateProviderConfig` این ترکیب را رد می‌کند.
- کلیدهای نشست مشاوره در صورت وجود، دوباره از نشست ذخیره‌شدهٔ تماس استفاده می‌کنند و سپس به `sessionScope` پیکربندی‌شده بازمی‌گردند (`per-phone` به‌طور پیش‌فرض، یا `per-call` برای تماس‌های مجزا).

### خط‌مشی ابزار

`realtime.toolPolicy` اجرای مشاوره را کنترل می‌کند:

| خط‌مشی           | رفتار                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | ابزار مشاوره را در دسترس قرار می‌دهد و عامل معمولی را به `read`، `web_search`، `web_fetch`، `x_search`، `memory_search` و `memory_get` محدود می‌کند. |
| `owner`          | ابزار مشاوره را در دسترس قرار می‌دهد و به عامل معمولی اجازه می‌دهد از خط‌مشی عادی ابزارهای عامل استفاده کند.                                                      |
| `none`           | ابزار مشاوره را در دسترس قرار نمی‌دهد. `realtime.tools` سفارشی همچنان بدون تغییر به ارائه‌دهندهٔ بلادرنگ ارسال می‌شود.                               |

`realtime.consultPolicy` فقط دستورالعمل‌های مدل بلادرنگ را کنترل می‌کند:

| خط‌مشی        | راهنمایی                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | پرامپت پیش‌فرض را حفظ می‌کند و تصمیم‌گیری دربارهٔ زمان فراخوانی ابزار مشاوره را به ارائه‌دهنده می‌سپارد.              |
| `substantive` | پیوندهای سادهٔ مکالمه را مستقیماً پاسخ می‌دهد و پیش از ارائهٔ واقعیت‌ها، استفاده از حافظه و ابزارها یا مراجعه به زمینه، مشاوره می‌کند. |
| `always`      | پیش از هر پاسخ محتوایی، مشاوره می‌کند.                                                        |

### زمینهٔ صوتی عامل

وقتی پل صوتی باید بدون پرداخت هزینهٔ رفت‌وبرگشت کامل مشاوره با عامل در
نوبت‌های عادی، مانند عامل پیکربندی‌شدهٔ OpenClaw به نظر برسد،
`realtime.agentContext` را فعال کنید. کپسول زمینه هنگام ایجاد نشست بلادرنگ
یک‌بار اضافه می‌شود، بنابراین برای هر نوبت تأخیر اضافه ایجاد نمی‌کند.
فراخوانی‌های `openclaw_agent_consult` همچنان عامل کامل OpenClaw را اجرا
می‌کنند و باید برای کار با ابزارها، اطلاعات جاری، جست‌وجوی حافظه یا وضعیت
فضای کاری استفاده شوند.

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

### نمونه‌های ارائه‌دهندهٔ بلادرنگ

<Tabs>
  <Tab title="Google Gemini Live">
    پیش‌فرض‌ها: کلید API از `realtime.providers.google.apiKey`، `GEMINI_API_KEY`
    یا `GOOGLE_API_KEY`؛ مدل `gemini-3.1-flash-live-preview`؛
    صدا `Kore`. گزینه‌های `sessionResumption` و `contextWindowCompression`
    برای تماس‌های طولانی‌تر و قابل اتصال مجدد، به‌طور پیش‌فرض فعال هستند.
    برای تنظیم نوبت‌گیری سریع‌تر روی صدای تلفنی، از `silenceDurationMs`،
    `startSensitivity` و `endSensitivity` استفاده کنید.

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
                    model: "gemini-3.1-flash-live-preview",
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

برای گزینه‌های صدای بلادرنگِ مختص هر ارائه‌دهنده، به
[ارائه‌دهندهٔ Google](/fa/providers/google) و
[ارائه‌دهندهٔ OpenAI](/fa/providers/openai) مراجعه کنید.

## رونویسی جریانی

`streaming` یک ارائه‌دهندهٔ رونویسی بلادرنگ را برای صدای زندهٔ تماس انتخاب می‌کند.

رفتار فعلی زمان اجرا:

- `streaming.provider` اختیاری است. اگر تنظیم نشده باشد، تماس صوتی از نخستین ارائه‌دهندهٔ ثبت‌شدهٔ رونویسی بلادرنگ استفاده می‌کند.
- ارائه‌دهندگان همراهِ رونویسی بلادرنگ: Deepgram (`deepgram`)، ElevenLabs (`elevenlabs`)، Mistral (`mistral`)، OpenAI (`openai`) و xAI (`xai`) که توسط Pluginهای ارائه‌دهندهٔ خود ثبت می‌شوند.
- پیکربندی خامِ متعلق به ارائه‌دهنده در `streaming.providers.<providerId>` قرار می‌گیرد.
- پس از اینکه Twilio پیام پذیرفته‌شدهٔ `start` مربوط به جریان را ارسال می‌کند، تماس صوتی بلافاصله جریان را ثبت می‌کند، هنگام اتصال ارائه‌دهنده رسانهٔ ورودی را برای پردازش توسط ارائه‌دهندهٔ رونویسی در صف قرار می‌دهد و پیام خوشامدگویی اولیه را تنها پس از آماده‌شدن رونویسی بلادرنگ آغاز می‌کند.
- اگر `streaming.provider` به ارائه‌دهنده‌ای ثبت‌نشده اشاره کند، یا هیچ ارائه‌دهنده‌ای ثبت نشده باشد، تماس صوتی به‌جای از کار انداختن کل Plugin، هشداری ثبت می‌کند و از پخش جریانی رسانه صرف‌نظر می‌کند.

### نمونه‌های ارائه‌دهندهٔ جریانی

<Tabs>
  <Tab title="OpenAI">
    پیش‌فرض‌ها: کلید API از `streaming.providers.openai.apiKey` یا
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
    پیش‌فرض‌ها: کلید API از `streaming.providers.xai.apiKey` یا `XAI_API_KEY`
    (اگر هیچ‌کدام تنظیم نشده باشند، به نمایهٔ احراز هویت OAuth متعلق به xAI
    بازمی‌گردد)؛ نقطهٔ پایانی `wss://api.x.ai/v1/stt`؛ کدگذاری `mulaw`؛
    نرخ نمونه‌برداری `8000`؛ `endpointingMs: 800`؛ `interimResults: true`.

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

تماس صوتی برای گفتار جریانی در تماس‌ها از پیکربندی اصلی `messages.tts`
استفاده می‌کند. می‌توانید آن را در پیکربندی Plugin با **همان ساختار**
بازنویسی کنید؛ این پیکربندی به‌صورت عمیق با `messages.tts` ادغام می‌شود.

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
**گفتار Microsoft برای تماس‌های صوتی نادیده گرفته می‌شود.** سنتز تلفنی به
ارائه‌دهنده‌ای نیاز دارد که خروجی ویژهٔ تلفن را پیاده‌سازی کند؛ ارائه‌دهندهٔ
گفتار Microsoft چنین قابلیتی ندارد، بنابراین برای تماس‌ها از آن صرف‌نظر
می‌شود و در عوض ارائه‌دهندگان دیگر در زنجیرهٔ بازگشت امتحان می‌شوند.
</Warning>

نکات رفتاری:

- کلیدهای قدیمی `tts.<provider>` در پیکربندی Plugin (`openai`، `elevenlabs`، `microsoft`، `edge`) توسط `openclaw doctor --fix` اصلاح می‌شوند؛ پیکربندی ثبت‌شده باید از `tts.providers.<provider>` استفاده کند.
- وقتی پخش جریانی رسانهٔ Twilio فعال باشد، از TTS اصلی استفاده می‌شود؛ در غیر این صورت تماس‌ها به صداهای بومی ارائه‌دهنده بازمی‌گردند.
- اگر جریان رسانهٔ Twilio از قبل فعال باشد، تماس صوتی به TwiML `<Say>` بازنمی‌گردد. اگر TTS تلفنی در آن وضعیت در دسترس نباشد، درخواست پخش به‌جای ترکیب دو مسیر پخش، ناموفق می‌شود.
- وقتی TTS تلفنی به ارائه‌دهندهٔ ثانویه بازمی‌گردد، تماس صوتی برای اشکال‌زدایی هشداری حاوی زنجیرهٔ ارائه‌دهندگان (`from`، `to`، `attempts`) ثبت می‌کند.
- وقتی ورود هم‌زمان گفتار در Twilio یا برچیدن جریان، صف در انتظار TTS را پاک می‌کند، درخواست‌های پخش صف‌شده تعیین‌تکلیف می‌شوند و تماس‌گیرندگانی که منتظر تکمیل پخش هستند معطل نمی‌مانند.

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

خط‌مشی تماس ورودی به‌طور پیش‌فرض `disabled` است. برای فعال‌کردن تماس‌های ورودی، تنظیم کنید:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` یک بررسی کم‌اطمینان برای شناسه تماس‌گیرنده است. Plugin
مقدار `From` ارائه‌شده توسط ارائه‌دهنده را نرمال‌سازی می‌کند و آن را با `allowFrom`
مقایسه می‌کند. تأیید Webhook، تحویل توسط ارائه‌دهنده و یکپارچگی بار داده را
اصالت‌سنجی می‌کند، اما مالکیت شماره تماس‌گیرنده در PSTN/VoIP را **اثبات نمی‌کند**.
با `allowFrom` به‌عنوان فیلتر شناسه تماس‌گیرنده رفتار کنید، نه هویت قدرتمند تماس‌گیرنده.
</Warning>

پاسخ‌های خودکار از سامانه عامل استفاده می‌کنند. آن‌ها را با `responseModel`،
`responseSystemPrompt` و `responseTimeoutMs` تنظیم کنید.

### مسیریابی بر اساس شماره

وقتی یک Plugin تماس صوتی برای چند شماره تلفن تماس دریافت می‌کند و هر شماره باید
مانند یک خط متفاوت رفتار کند، از `numbers` استفاده کنید. برای مثال، یک شماره
می‌تواند از یک دستیار شخصی با لحن غیررسمی استفاده کند، درحالی‌که شماره‌ای دیگر
از یک شخصیت تجاری، عامل پاسخ‌گوی متفاوت و صدای TTS متفاوت استفاده می‌کند.

مسیرها بر اساس شماره مقصد `To` که ارائه‌دهنده اعلام می‌کند انتخاب می‌شوند. کلیدها
باید شماره‌های E.164 باشند. هنگام ورود تماس، تماس صوتی مسیر منطبق را یک‌بار
تشخیص می‌دهد، مسیر منطبق را در رکورد تماس ذخیره می‌کند و همان پیکربندی مؤثر را
برای پیام خوشامدگویی، مسیر کلاسیک پاسخ خودکار، مسیر مشاوره بلادرنگ و پخش TTS
دوباره به کار می‌برد. اگر هیچ مسیری منطبق نباشد، پیکربندی سراسری تماس صوتی استفاده
می‌شود. تماس‌های خروجی از `numbers` استفاده نمی‌کنند؛ هنگام آغاز تماس، مقصد خروجی،
پیام و نشست را به‌طور صریح ارسال کنید.

در حال حاضر، بازنویسی‌های مسیر از موارد زیر پشتیبانی می‌کنند:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

مقدار `tts` مسیر به‌صورت ادغام عمیق روی پیکربندی سراسری `tts` تماس صوتی اعمال
می‌شود؛ بنابراین معمولاً می‌توانید فقط صدای ارائه‌دهنده را بازنویسی کنید:

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

برای پاسخ‌های خودکار، تماس صوتی یک قرارداد سخت‌گیرانه خروجی گفتاری را به اعلان
سیستم می‌افزاید که پاسخ JSON به‌شکل `{"spoken":"..."}` را الزامی می‌کند. تماس صوتی
متن گفتار را به‌شکل تدافعی استخراج می‌کند:

- بارهای داده‌ای را که به‌عنوان محتوای استدلال یا خطا علامت‌گذاری شده‌اند نادیده می‌گیرد.
- JSON مستقیم، JSON حصارشده یا کلیدهای درون‌خطی `"spoken"` را تجزیه می‌کند.
- در صورت نیاز به متن ساده بازمی‌گردد و بندهای آغازین احتمالی مربوط به برنامه‌ریزی یا فراداده را حذف می‌کند.

این کار پخش گفتاری را بر متن خطاب به تماس‌گیرنده متمرکز نگه می‌دارد و از افشای
متن برنامه‌ریزی در صدا جلوگیری می‌کند.

### رفتار آغاز مکالمه

برای تماس‌های خروجی `conversation`، رسیدگی به پیام نخست به وضعیت پخش زنده وابسته است:

- پاک‌سازی صف هنگام قطع میان‌گفتار و پاسخ خودکار فقط تا زمانی متوقف می‌شوند که پیام خوشامدگویی اولیه فعالانه در حال پخش باشد.
- اگر پخش اولیه شکست بخورد، تماس به حالت `listening` بازمی‌گردد و پیام اولیه برای تلاش مجدد در صف باقی می‌ماند.
- پخش اولیه برای جریان Twilio هنگام اتصال جریان و بدون تأخیر اضافی آغاز می‌شود.
- قطع میان‌گفتار، پخش فعال را متوقف می‌کند و ورودی‌های TTS مربوط به Twilio را که در صف هستند اما هنوز پخش نشده‌اند پاک می‌کند. ورودی‌های پاک‌شده با وضعیت ردشده خاتمه می‌یابند تا منطق پاسخ بعدی بدون انتظار برای صدایی که هرگز پخش نخواهد شد ادامه یابد.
- مکالمات صوتی بلادرنگ از نوبت آغازین خود جریان بلادرنگ استفاده می‌کنند. تماس صوتی برای آن پیام اولیه، به‌روزرسانی قدیمی TwiML از نوع `<Say>` ارسال **نمی‌کند**؛ بنابراین نشست‌های خروجی `<Connect><Stream>` متصل باقی می‌مانند.

### مهلت قطع اتصال جریان Twilio

هنگامی که جریان رسانه‌ای Twilio قطع می‌شود، تماس صوتی پیش از پایان خودکار تماس
**۲۰۰۰ میلی‌ثانیه** صبر می‌کند:

- اگر جریان در این بازه دوباره متصل شود، پایان خودکار لغو می‌شود.
- اگر پس از دوره مهلت هیچ جریانی دوباره ثبت نشود، تماس پایان می‌یابد تا تماس‌های فعال گیرکرده ایجاد نشوند.

## جمع‌آوری‌کننده تماس‌های منقضی

از `staleCallReaperSeconds` با مقدار پیش‌فرض **۱۲۰** برای پایان‌دادن به تماس‌هایی
استفاده کنید که هرگز پاسخ داده نمی‌شوند و هرگز به وضعیت مکالمه زنده نمی‌رسند؛
برای نمونه تماس‌های حالت اعلان که ارائه‌دهنده هرگز Webhook پایانی آن‌ها را تحویل
نمی‌دهد. برای غیرفعال‌سازی، مقدار آن را روی `0` تنظیم کنید.

جمع‌آوری‌کننده هر ۳۰ ثانیه اجرا می‌شود و فقط تماس‌هایی را پایان می‌دهد که مهر زمانی
`answeredAt` ندارند و از قبل در وضعیت پایانی یا زنده (`speaking`/`listening`) نیستند؛
بنابراین مکالمات پاسخ‌داده‌شده هرگز توسط این زمان‌سنج جمع‌آوری نمی‌شوند.
`maxDurationSeconds` با مقدار پیش‌فرض ۳۰۰، سقف جداگانه‌ای است که تماس‌های
پاسخ‌داده‌شده و بیش‌ازحد طولانی را پایان می‌دهد.

برای جریان‌های اعلان‌محور که اپراتورها ممکن است Webhookهای زنگ‌خوردن یا پاسخ را
با تأخیر تحویل دهند، `staleCallReaperSeconds` را بیشتر از مقدار پیش‌فرض تنظیم کنید
تا تماس‌های کند اما عادی زودهنگام جمع‌آوری نشوند؛ بازه ۱۲۰ تا ۳۰۰ ثانیه برای محیط
عملیاتی مناسب است.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 120,
        },
      },
    },
  },
}
```

## امنیت Webhook

وقتی یک پراکسی یا تونل جلوی Gateway قرار دارد، Plugin برای تأیید امضا، نشانی
عمومی را بازسازی می‌کند. گزینه‌های زیر تعیین می‌کنند کدام سرآیندهای فورواردشده
مورد اعتماد باشند:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  میزبان‌های مجاز از سرآیندهای فوروارد را مشخص می‌کند.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  بدون فهرست مجاز به سرآیندهای فورواردشده اعتماد می‌کند.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  فقط زمانی به سرآیندهای فورواردشده اعتماد می‌کند که نشانی IP راه دور درخواست با فهرست منطبق باشد.
</ParamField>

محافظت‌های تکمیلی:

- **محافظت در برابر بازپخش** Webhook برای Twilio، Telnyx و Plivo فعال است. درخواست‌های معتبر Webhook که بازپخش شوند تأیید دریافت می‌شوند، اما اثرات جانبی آن‌ها نادیده گرفته می‌شود.
- نوبت‌های مکالمه Twilio در فراخوانی‌های برگشتی `<Gather>` یک توکن ویژه هر نوبت دارند؛ بنابراین فراخوانی‌های گفتاری قدیمی یا بازپخش‌شده نمی‌توانند یک نوبت رونوشت معلق جدیدتر را تکمیل کنند.
- وقتی سرآیندهای امضای الزامی ارائه‌دهنده وجود نداشته باشند، درخواست‌های Webhook احرازنشده پیش از خواندن بدنه رد می‌شوند.
- Webhook تماس صوتی پیش از تأیید امضا از نمایه مشترک خواندن بدنه پیش از احراز هویت، شامل حداکثر بدنه ۶۴ کیلوبایت و مهلت خواندن ۵ ثانیه، به‌همراه سقف درخواست‌های هم‌زمان درحال‌اجرا برای هر کلید، با مقدار پیش‌فرض ۸ درخواست هم‌زمان برای هر کلید، استفاده می‌کند.

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

وقتی Gateway از قبل در حال اجرا است، فرمان‌های عملیاتی `voicecall` به زمان‌اجرای
تماس صوتی تحت مالکیت Gateway واگذار می‌شوند تا CLI یک سرور Webhook دوم را مقید
نکند. اگر هیچ Gateway در دسترس نباشد، فرمان‌ها به زمان‌اجرای مستقل CLI بازمی‌گردند.

`latency` فایل `calls.jsonl` را از مسیر ذخیره‌سازی پیش‌فرض تماس صوتی می‌خواند. برای
اشاره به گزارش متفاوت از `--file <path>` و برای محدودکردن تحلیل به آخرین N رکورد
از `--last <n>` استفاده کنید؛ مقدار پیش‌فرض ۲۰۰ است. خروجی شامل کمینه، بیشینه،
میانگین، p50 و p95 برای تأخیر نوبت و زمان‌های انتظار شنیدن است.

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

Plugin تماس صوتی همراه با یک Skill عامل منطبق عرضه می‌شود.

## RPC ‏Gateway

| روش                         | آرگومان‌ها                                                        | توضیحات                                                                    |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | وقتی `to` حذف شود، به پیکربندی `toNumber` بازمی‌گردد.                     |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | مانند `initiate` است، اما `dtmfSequence` پیش از اتصال را نیز می‌پذیرد.    |
| `voicecall.continue`        | `callId`, `message`                                              | تا تعیین تکلیف نوبت مسدود می‌ماند و رونوشت را برمی‌گرداند.                |
| `voicecall.continue.start`  | `callId`, `message`                                              | گونه ناهمگام: بلافاصله یک `operationId` برمی‌گرداند.                      |
| `voicecall.continue.result` | `operationId`                                                    | یک عملیات معلق `voicecall.continue.start` را برای دریافت نتیجه پیمایش می‌کند. |
| `voicecall.speak`           | `callId`, `message`                                              | بدون انتظار صحبت می‌کند؛ وقتی `realtime.enabled` باشد از پل بلادرنگ استفاده می‌کند. |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                           |
| `voicecall.end`             | `callId`                                                         |                                                                           |
| `voicecall.status`          | `callId?`                                                        | برای فهرست‌کردن همه تماس‌های فعال، `callId` را حذف کنید.                  |

`dtmfSequence` فقط با `mode: "conversation"` معتبر است؛ تماس‌های حالت اعلان در
صورت نیاز به ارقام پس از اتصال، باید پس از ایجاد تماس از `voicecall.dtmf` استفاده کنند.

## عیب‌یابی

### راه‌اندازی در ارائه Webhook شکست می‌خورد

راه‌اندازی را از همان محیطی اجرا کنید که Gateway در آن اجرا می‌شود:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

برای `twilio`، `telnyx` و `plivo`، وضعیت `webhook-exposure` باید سبز باشد. حتی
`publicUrl` پیکربندی‌شده نیز وقتی به فضای شبکه محلی یا خصوصی اشاره کند شکست
می‌خورد، زیرا اپراتور نمی‌تواند به آن نشانی‌ها فراخوانی برگشتی انجام دهد.
از `localhost`، `127.0.0.1`، `0.0.0.0`، `10.x`، `172.16.x`-`172.31.x`،
`192.168.x`، `169.254.x`، `fc00::/7`، `fd00::/8` یا دیگر بازه‌های NAT در سطح
اپراتور به‌عنوان `publicUrl` استفاده نکنید.

تماس‌های خروجی حالت اعلان Twilio، TwiML اولیه `<Say>` خود را مستقیماً در درخواست
ایجاد تماس ارسال می‌کنند؛ بنابراین نخستین پیام گفتاری به دریافت TwiML از Webhook
توسط Twilio وابسته نیست. همچنان برای فراخوانی‌های برگشتی وضعیت، تماس‌های مکالمه،
DTMF پیش از اتصال، جریان‌های بلادرنگ و کنترل تماس پس از اتصال به Webhook عمومی
نیاز است.

از یکی از مسیرهای ارائه عمومی استفاده کنید:

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

`voicecall smoke` آزمایشی و بدون اجرای واقعی است، مگر اینکه `--yes` را ارسال کنید.

### اعتبارنامه‌های ارائه‌دهنده شکست می‌خورند

ارائه‌دهنده انتخاب‌شده و فیلدهای الزامی اعتبارنامه را بررسی کنید:

- Twilio: `twilio.accountSid`، `twilio.authToken` و `fromNumber`، یا
  `TWILIO_ACCOUNT_SID`، `TWILIO_AUTH_TOKEN` و `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`، `telnyx.connectionId`، `telnyx.publicKey` و
  `fromNumber`، یا `TELNYX_API_KEY`، `TELNYX_CONNECTION_ID` و
  `TELNYX_PUBLIC_KEY`.
- Plivo: `plivo.authId`، `plivo.authToken` و `fromNumber`، یا
  `PLIVO_AUTH_ID` و `PLIVO_AUTH_TOKEN`.

اعتبارنامه‌ها باید روی میزبان Gateway موجود باشند. ویرایش پروفایل پوستهٔ محلی
تا زمانی که Gateway راه‌اندازی مجدد نشود یا محیط خود را دوباره بارگذاری نکند،
بر Gateway در حال اجرا تأثیری ندارد.

### تماس‌ها آغاز می‌شوند، اما Webhookهای ارائه‌دهنده دریافت نمی‌شوند

تأیید کنید که کنسول ارائه‌دهنده دقیقاً به نشانی عمومی Webhook زیر اشاره می‌کند:

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
- نشانی تونل پس از شروع Gateway تغییر کرده است.
- یک پراکسی درخواست را هدایت می‌کند، اما سرآیندهای میزبان یا پروتکل را حذف یا بازنویسی می‌کند.
- دیوار آتش یا DNS نام میزبان عمومی را به جایی غیر از Gateway هدایت می‌کند.
- Gateway بدون فعال بودن Plugin تماس صوتی دوباره راه‌اندازی شده است.

وقتی یک پراکسی معکوس یا تونل در جلوی Gateway قرار دارد،
`webhookSecurity.allowedHosts` را روی نام میزبان عمومی تنظیم کنید، یا برای
نشانی پراکسی شناخته‌شده از `webhookSecurity.trustedProxyIPs` استفاده کنید. از
`webhookSecurity.trustForwardingHeaders` فقط زمانی استفاده کنید که مرز پراکسی
تحت کنترل شما باشد.

### تأیید امضا ناموفق است

امضاهای ارائه‌دهنده در برابر نشانی عمومی‌ای بررسی می‌شوند که OpenClaw آن را
از درخواست ورودی بازسازی می‌کند. اگر تأیید امضاها ناموفق است:

- تأیید کنید که نشانی Webhook ارائه‌دهنده دقیقاً با `publicUrl`، شامل طرح، میزبان و مسیر، مطابقت دارد.
- برای نشانی‌های سطح رایگان ngrok، هنگام تغییر نام میزبان تونل، `publicUrl` را به‌روزرسانی کنید.
- مطمئن شوید پراکسی سرآیندهای اصلی میزبان و پروتکل را حفظ می‌کند، یا `webhookSecurity.allowedHosts` را پیکربندی کنید.
- `skipSignatureVerification` را خارج از آزمایش محلی فعال نکنید.

### پیوستن Google Meet از طریق Twilio ناموفق است

Google Meet برای پیوستن از طریق شماره‌گیری Twilio از این Plugin استفاده می‌کند.
ابتدا تماس صوتی را تأیید کنید:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

سپس انتقال Google Meet را به‌طور صریح تأیید کنید:

```bash
openclaw googlemeet setup --transport twilio
```

اگر تماس صوتی سالم است، اما شرکت‌کننده هرگز به جلسه Meet نمی‌پیوندد، شمارهٔ
شماره‌گیری Meet، پین و `--dtmf-sequence` را بررسی کنید. تماس تلفنی ممکن است
سالم باشد، در حالی که جلسه یک دنبالهٔ DTMF نادرست را رد یا نادیده می‌گیرد.

Google Meet بخش تلفنی Twilio را از طریق `voicecall.start` و با یک دنبالهٔ DTMF
پیش از اتصال آغاز می‌کند. دنباله‌های مشتق‌شده از پین شامل
`voiceCall.dtmfDelayMs` متعلق به Plugin ‏Google Meet با مقدار پیش‌فرض
**۱۲۰۰۰ میلی‌ثانیه** به‌صورت ارقام انتظار ابتدایی Twilio هستند، زیرا اعلان‌های
شماره‌گیری Meet ممکن است با تأخیر پخش شوند. سپس تماس صوتی، پیش از درخواست
پیام خوشامدگویی آغازین، دوباره به مدیریت بلادرنگ هدایت می‌شود.

برای مشاهدهٔ ردگیری زندهٔ مراحل از `openclaw logs --follow` استفاده کنید. در
یک پیوستن سالم به Meet از طریق Twilio، رویدادها با این ترتیب ثبت می‌شوند:

- Google Meet پیوستن از طریق Twilio را به تماس صوتی واگذار می‌کند.
- تماس صوتی TwiML مربوط به DTMF پیش از اتصال را ذخیره می‌کند.
- TwiML اولیهٔ Twilio پیش از مدیریت بلادرنگ مصرف و ارائه می‌شود.
- تماس صوتی TwiML بلادرنگ را برای تماس Twilio ارائه می‌کند.
- Google Meet پس از تأخیر بعد از DTMF، گفتار آغازین را با `voicecall.speak` درخواست می‌کند.

`openclaw voicecall tail` همچنان رکوردهای ذخیره‌شدهٔ تماس را نشان می‌دهد؛ این
دستور برای وضعیت تماس و رونوشت‌ها مفید است، اما همهٔ انتقال‌های Webhook یا
بلادرنگ در آن نمایش داده نمی‌شوند.

### تماس بلادرنگ گفتاری ندارد

تأیید کنید که فقط یک حالت صوتی فعال است: `realtime.enabled` و
`streaming.enabled` نمی‌توانند هر دو برابر با true باشند.

برای تماس‌های بلادرنگ Twilio یا Telnyx، این موارد را نیز تأیید کنید:

- یک Plugin ارائه‌دهندهٔ بلادرنگ بارگذاری و ثبت شده است.
- `realtime.provider` تنظیم نشده است یا نام یک ارائه‌دهندهٔ ثبت‌شده را مشخص می‌کند.
- کلید API ارائه‌دهنده در دسترس فرایند Gateway است.
- `openclaw logs --follow` نشان می‌دهد که TwiML بلادرنگ ارائه شده، پل بلادرنگ آغاز شده و پیام خوشامدگویی اولیه در صف قرار گرفته است.

## مرتبط

- [حالت مکالمه](/fa/nodes/talk)
- [تبدیل متن به گفتار](/fa/tools/tts)
- [فعال‌سازی صوتی](/fa/nodes/voicewake)
