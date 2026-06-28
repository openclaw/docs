---
read_when:
    - طراحی یا بازآرایی درک رسانه
    - تنظیم پیش‌پردازش ورودی صدا/ویدئو/تصویر
sidebarTitle: Media understanding
summary: درک تصویر/صدا/ویدیوی ورودی (اختیاری) با fallbackهای ارائه‌دهنده + CLI
title: درک رسانه
x-i18n:
    generated_at: "2026-06-28T08:06:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw می‌تواند **رسانه‌های ورودی را خلاصه کند** (تصویر/صوت/ویدئو) پیش از آنکه خط لوله پاسخ اجرا شود. وقتی ابزارهای محلی یا کلیدهای ارائه‌دهنده در دسترس باشند، آن‌ها را به‌طور خودکار تشخیص می‌دهد، و می‌توان آن را غیرفعال یا سفارشی کرد. اگر فهم خاموش باشد، مدل‌ها همچنان مثل همیشه فایل‌ها/URLهای اصلی را دریافت می‌کنند.

رفتار رسانه‌ای مخصوص هر فروشنده توسط Pluginهای فروشنده ثبت می‌شود، در حالی که هسته OpenClaw مالک پیکربندی مشترک `tools.media`، ترتیب fallback، و یکپارچه‌سازی خط لوله پاسخ است.

## اهداف

- اختیاری: رسانه ورودی را از پیش به متن کوتاه تبدیل کند تا مسیریابی سریع‌تر و تجزیه بهتر فرمان انجام شود.
- تحویل رسانه اصلی به مدل را حفظ کند (همیشه).
- از **APIهای ارائه‌دهنده** و **fallbackهای CLI** پشتیبانی کند.
- اجازه دهد چند مدل با fallback ترتیبی داشته باشید (خطا/اندازه/timeout).

## رفتار سطح بالا

<Steps>
  <Step title="Collect attachments">
    پیوست‌های ورودی را جمع‌آوری کنید (`MediaPaths`، `MediaUrls`، `MediaTypes`).
  </Step>
  <Step title="Select per-capability">
    برای هر قابلیت فعال‌شده (تصویر/صوت/ویدئو)، پیوست‌ها را بر اساس سیاست انتخاب کنید (پیش‌فرض: **اولی**).
  </Step>
  <Step title="Choose model">
    نخستین ورودی مدل واجد شرایط را انتخاب کنید (اندازه + قابلیت + auth).
  </Step>
  <Step title="Fallback on failure">
    اگر یک مدل شکست بخورد یا رسانه بیش از حد بزرگ باشد، **به ورودی بعدی fallback کنید**.
  </Step>
  <Step title="Apply success block">
    در صورت موفقیت:

    - `Body` به بلوک `[Image]`، `[Audio]`، یا `[Video]` تبدیل می‌شود.
    - صوت `{{Transcript}}` را تنظیم می‌کند؛ تجزیه فرمان وقتی متن کپشن موجود باشد از آن استفاده می‌کند، در غیر این صورت از transcript.
    - کپشن‌ها به‌صورت `User text:` داخل بلوک حفظ می‌شوند.

  </Step>
</Steps>

اگر فهم شکست بخورد یا غیرفعال باشد، **جریان پاسخ ادامه می‌یابد** با بدنه اصلی + پیوست‌ها.

## نمای کلی پیکربندی

`tools.media` از **مدل‌های مشترک** به‌علاوه overrideهای هر قابلیت پشتیبانی می‌کند:

<AccordionGroup>
  <Accordion title="Top-level keys">
    - `tools.media.models`: فهرست مدل مشترک (برای gate کردن از `capabilities` استفاده کنید).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - پیش‌فرض‌ها (`prompt`، `maxChars`، `maxBytes`، `timeoutSeconds`، `language`)
      - overrideهای ارائه‌دهنده (`baseUrl`، `headers`، `providerOptions`)
      - گزینه‌های صوتی Deepgram از طریق `tools.media.audio.providerOptions.deepgram`
      - کنترل‌های echo برای transcript صوتی (`echoTranscript`، پیش‌فرض `false`؛ `echoFormat`)
      - **فهرست `models` هر قابلیت** اختیاری (پیش از مدل‌های مشترک ترجیح داده می‌شود)
      - سیاست `attachments` (`mode`، `maxAttachments`، `prefer`)
      - `scope` (gate اختیاری بر اساس channel/chatType/session key)
    - `tools.media.concurrency`: بیشینه اجرای هم‌زمان قابلیت‌ها (پیش‌فرض **2**).

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### ورودی‌های مدل

هر ورودی `models[]` می‌تواند **provider** یا **CLI** باشد:

<Tabs>
  <Tab title="Provider entry">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, used for multi-modal entries
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="CLI entry">
    ```json5
    {
      type: "cli",
      command: "gemini",
      args: [
        "-m",
        "gemini-3-flash",
        "--allowed-tools",
        "read_file",
        "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    templateهای CLI همچنین می‌توانند از این‌ها استفاده کنند:

    - `{{MediaDir}}` (دایرکتوری حاوی فایل رسانه)
    - `{{OutputDir}}` (scratch dir ایجادشده برای این اجرا)
    - `{{OutputBase}}` (مسیر پایه فایل scratch، بدون پسوند)

  </Tab>
</Tabs>

### اعتبارنامه‌های ارائه‌دهنده (`apiKey`)

فهم رسانه توسط ارائه‌دهنده از همان resolve کردن auth ارائه‌دهنده استفاده می‌کند که در فراخوانی‌های عادی مدل استفاده می‌شود: auth profileها، متغیرهای محیطی، سپس
`models.providers.<providerId>.apiKey`.

ورودی‌های `tools.media.*.models[]` فیلد inline با نام `apiKey` را نمی‌پذیرند. مقدار
`provider` در ورودی مدل رسانه، مانند `openai` یا `moonshot`، باید از طریق یکی از منابع استاندارد auth ارائه‌دهنده اعتبارنامه در دسترس داشته باشد.

نمونه حداقلی:

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

برای مرجع کامل auth ارائه‌دهنده، شامل profileها، متغیرهای محیطی، و base URLهای سفارشی، [ابزارها و ارائه‌دهنده‌های سفارشی](/fa/gateway/config-tools) را ببینید.

## پیش‌فرض‌ها و محدودیت‌ها

پیش‌فرض‌های پیشنهادی:

- `maxChars`: **500** برای تصویر/ویدئو (کوتاه، مناسب فرمان)
- `maxChars`: برای صوت **تنظیم‌نشده** (transcript کامل مگر اینکه محدودیت تعیین کنید)
- `maxBytes`:
  - تصویر: **10MB**
  - صوت: **20MB**
  - ویدئو: **50MB**

<AccordionGroup>
  <Accordion title="Rules">
    - اگر رسانه از `maxBytes` بیشتر باشد، آن مدل نادیده گرفته می‌شود و **مدل بعدی امتحان می‌شود**.
    - فایل‌های صوتی کوچک‌تر از **1024 bytes** پیش از transcription توسط ارائه‌دهنده/CLI، خالی/خراب تلقی و نادیده گرفته می‌شوند؛ context پاسخ ورودی یک transcript placeholder قطعی دریافت می‌کند تا agent بداند یادداشت بیش از حد کوچک بوده است.
    - اگر مدل بیش از `maxChars` برگرداند، خروجی trim می‌شود.
    - `prompt` به‌طور پیش‌فرض به یک "Describe the {media}." ساده به‌علاوه راهنمای `maxChars` تبدیل می‌شود (فقط تصویر/ویدئو).
    - اگر مدل تصویر primary فعال از قبل به‌صورت native از vision پشتیبانی کند، OpenClaw بلوک خلاصه `[Image]` را رد می‌کند و به‌جای آن تصویر اصلی را به مدل می‌فرستد.
    - اگر مدل primary در Gateway/WebChat فقط متنی باشد، پیوست‌های تصویر به‌صورت refs تخلیه‌شده `media://inbound/*` حفظ می‌شوند تا ابزارهای تصویر/PDF یا مدل تصویر پیکربندی‌شده همچنان بتوانند آن‌ها را بررسی کنند، به‌جای اینکه پیوست از دست برود.
    - درخواست‌های صریح `openclaw infer image describe --model <provider/model>` متفاوت‌اند: آن‌ها مستقیماً همان provider/model دارای قابلیت تصویر را اجرا می‌کنند، شامل refs مربوط به Ollama مانند `ollama/qwen2.5vl:7b`.
    - اگر `<capability>.enabled: true` باشد اما هیچ مدلی پیکربندی نشده باشد، OpenClaw وقتی ارائه‌دهنده آن قابلیت را پشتیبانی کند، **مدل پاسخ فعال** را امتحان می‌کند.

  </Accordion>
</AccordionGroup>

### تشخیص خودکار فهم رسانه (پیش‌فرض)

اگر `tools.media.<capability>.enabled` روی `false` تنظیم **نشده** باشد و شما مدل‌ها را پیکربندی نکرده باشید، OpenClaw به این ترتیب تشخیص خودکار انجام می‌دهد و **در اولین گزینه کارآمد متوقف می‌شود**:

<Steps>
  <Step title="Active reply model">
    مدل پاسخ فعال وقتی ارائه‌دهنده آن قابلیت را پشتیبانی کند.
  </Step>
  <Step title="agents.defaults.imageModel">
    refs مربوط به primary/fallback در `agents.defaults.imageModel` (فقط تصویر).
    refs از نوع `provider/model` را ترجیح دهید. refs بدون provider فقط زمانی از ورودی‌های مدل ارائه‌دهنده پیکربندی‌شده و دارای قابلیت تصویر qualify می‌شوند که match یکتا باشد.
  </Step>
  <Step title="Local CLIs (audio only)">
    CLIهای محلی (اگر نصب شده باشند):

    - `sherpa-onnx-offline` (به `SHERPA_ONNX_MODEL_DIR` با encoder/decoder/joiner/tokens نیاز دارد)
    - `whisper-cli` (`whisper-cpp`؛ از `WHISPER_CPP_MODEL` یا مدل tiny همراه استفاده می‌کند)
    - `whisper` (CLI پایتون؛ مدل‌ها را به‌طور خودکار دانلود می‌کند)

  </Step>
  <Step title="Gemini CLI">
    `gemini` با استفاده از `read_many_files`.
  </Step>
  <Step title="Provider auth">
    - ورودی‌های پیکربندی‌شده `models.providers.*` که از آن قابلیت پشتیبانی می‌کنند، پیش از ترتیب fallback همراه امتحان می‌شوند.
    - ارائه‌دهنده‌های config فقط-تصویر با مدل دارای قابلیت تصویر، حتی وقتی Plugin فروشنده همراه نیستند، به‌طور خودکار برای فهم رسانه ثبت می‌شوند.
    - فهم تصویر Ollama وقتی به‌صراحت انتخاب شده باشد در دسترس است، برای مثال از طریق `agents.defaults.imageModel` یا `openclaw infer image describe --model ollama/<vision-model>`.

    ترتیب fallback همراه:

    - صوت: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - تصویر: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - ویدئو: Google → Qwen → Moonshot

  </Step>
</Steps>

برای غیرفعال کردن تشخیص خودکار، تنظیم کنید:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

<Note>
تشخیص binary در macOS/Linux/Windows به‌صورت best-effort است؛ مطمئن شوید CLI روی `PATH` است (ما `~` را expand می‌کنیم)، یا یک مدل CLI صریح با مسیر کامل command تنظیم کنید.
</Note>

### پشتیبانی از محیط proxy (مدل‌های ارائه‌دهنده)

وقتی فهم رسانه مبتنی بر ارائه‌دهنده برای **صوت** و **ویدئو** فعال باشد، OpenClaw برای فراخوانی‌های HTTP ارائه‌دهنده، متغیرهای محیطی استاندارد proxy خروجی را رعایت می‌کند:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

اگر هیچ متغیر محیطی proxy تنظیم نشده باشد، فهم رسانه از egress مستقیم استفاده می‌کند. اگر مقدار proxy malformed باشد، OpenClaw یک هشدار log می‌کند و به fetch مستقیم fallback می‌کند.

## قابلیت‌ها (اختیاری)

اگر `capabilities` را تنظیم کنید، ورودی فقط برای آن نوع‌های رسانه اجرا می‌شود. برای فهرست‌های مشترک، OpenClaw می‌تواند پیش‌فرض‌ها را استنباط کند:

- `openai`، `anthropic`، `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image + audio**
- `google` (Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- هر catalog با `models.providers.<id>.models[]` که مدل دارای قابلیت تصویر داشته باشد: **image**

برای ورودی‌های CLI، برای جلوگیری از matchهای غافلگیرکننده، **`capabilities` را صریح تنظیم کنید**. اگر `capabilities` را حذف کنید، ورودی برای فهرستی که در آن ظاهر شده واجد شرایط است.

## ماتریس پشتیبانی ارائه‌دهنده (یکپارچه‌سازی‌های OpenClaw)

| قابلیت | یکپارچه‌سازی ارائه‌دهنده                                                                                                     | یادداشت‌ها                                                                                                                                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| تصویر      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Pluginهای فروشنده پشتیبانی تصویر را ثبت می‌کنند؛ `openai/*` می‌تواند از مسیریابی API-key یا Codex OAuth استفاده کند؛ `codex/*` از یک turn محدود Codex app-server استفاده می‌کند؛ MiniMax و MiniMax OAuth هر دو از `MiniMax-VL-01` استفاده می‌کنند؛ ارائه‌دهنده‌های config دارای قابلیت تصویر به‌طور خودکار ثبت می‌شوند. |
| صوت        | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | transcription ارائه‌دهنده (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                      |
| ویدئو      | Google, Qwen, Moonshot                                                                                                       | فهم ویدئو توسط ارائه‌دهنده از طریق Pluginهای فروشنده؛ فهم ویدئوی Qwen از endpointهای Standard DashScope استفاده می‌کند.                                                                                                                    |

<Note>
**یادداشت MiniMax**

- درک تصویر برای `minimax`، `minimax-cn`، `minimax-portal` و `minimax-portal-cn` از ارائه‌دهندهٔ رسانهٔ `MiniMax-VL-01` متعلق به Plugin می‌آید.
- مسیریابی خودکار تصویر همچنان از `MiniMax-VL-01` استفاده می‌کند، حتی اگر فرادادهٔ گفت‌وگوی قدیمی MiniMax M2.x ادعای ورودی تصویر داشته باشد.

</Note>

## راهنمای انتخاب مدل

- وقتی کیفیت و ایمنی اهمیت دارد، قوی‌ترین مدل نسل جدیدِ در دسترس را برای هر قابلیت رسانه‌ای ترجیح دهید.
- برای عامل‌های دارای ابزار که ورودی‌های نامطمئن را پردازش می‌کنند، از مدل‌های رسانه‌ای قدیمی‌تر/ضعیف‌تر پرهیز کنید.
- برای دسترس‌پذیری، برای هر قابلیت دست‌کم یک گزینهٔ جایگزین نگه دارید (مدل باکیفیت + مدل سریع‌تر/ارزان‌تر).
- گزینه‌های جایگزین CLI (`whisper-cli`، `whisper`، `gemini`) وقتی APIهای ارائه‌دهنده در دسترس نیستند مفیدند.
- نکتهٔ `parakeet-mlx`: با `--output-dir`، OpenClaw وقتی قالب خروجی `txt` باشد (یا مشخص نشده باشد)، `<output-dir>/<media-basename>.txt` را می‌خواند؛ قالب‌های غیر `txt` به stdout برمی‌گردند.

## سیاست پیوست

`attachments` برای هر قابلیت کنترل می‌کند کدام پیوست‌ها پردازش شوند:

<ParamField path="mode" type='"first" | "all"' default="first">
  اینکه نخستین پیوست انتخاب‌شده پردازش شود یا همهٔ آن‌ها.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  تعداد پردازش‌شده را محدود می‌کند.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  اولویت انتخاب میان پیوست‌های نامزد.
</ParamField>

وقتی `mode: "all"` باشد، خروجی‌ها با برچسب‌هایی مانند `[Image 1/2]`، `[Audio 2/2]` و غیره مشخص می‌شوند.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - متن استخراج‌شدهٔ فایل پیش از افزوده شدن به پرامپت رسانه، به‌صورت **محتوای خارجی نامطمئن** بسته‌بندی می‌شود.
    - بلوک تزریق‌شده از نشانگرهای مرزی صریح مانند `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` استفاده می‌کند و یک خط فرادادهٔ `Source: External` را شامل می‌شود.
    - این مسیر استخراج پیوست عمداً بنر بلند `SECURITY NOTICE:` را حذف می‌کند تا پرامپت رسانه حجیم نشود؛ نشانگرهای مرزی و فراداده همچنان باقی می‌مانند.
    - اگر فایلی متن قابل استخراج نداشته باشد، OpenClaw مقدار `[No extractable text]` را تزریق می‌کند.
    - اگر یک PDF در این مسیر به تصاویر صفحهٔ رندرشده برگردد، OpenClaw آن تصاویر صفحه را به مدل‌های پاسخ‌دهی دارای قابلیت بینایی ارسال می‌کند و جای‌نگهدار `[PDF content rendered to images]` را در بلوک فایل نگه می‌دارد.

  </Accordion>
</AccordionGroup>

## نمونه‌های پیکربندی

<Tabs>
  <Tab title="Shared models + overrides">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
            {
              provider: "google",
              model: "gemini-3-flash-preview",
              capabilities: ["image", "audio", "video"],
            },
            {
              type: "cli",
              command: "gemini",
              args: [
                "-m",
                "gemini-3-flash",
                "--allowed-tools",
                "read_file",
                "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
              ],
              capabilities: ["image", "video"],
            },
          ],
          audio: {
            attachments: { mode: "all", maxAttachments: 2 },
          },
          video: {
            maxChars: 500,
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Audio + video only">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [
              { provider: "openai", model: "gpt-4o-mini-transcribe" },
              {
                type: "cli",
                command: "whisper",
                args: ["--model", "base", "{{MediaPath}}"],
              },
            ],
          },
          video: {
            enabled: true,
            maxChars: 500,
            models: [
              { provider: "google", model: "gemini-3-flash-preview" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Image-only">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.5" },
              { provider: "anthropic", model: "claude-opus-4-6" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Multi-modal single entry">
    ```json5
    {
      tools: {
        media: {
          image: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          audio: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          video: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## خروجی وضعیت

وقتی درک رسانه اجرا می‌شود، `/status` یک خط خلاصهٔ کوتاه را شامل می‌شود:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

این برای هر قابلیت، نتیجه‌ها و در صورت کاربرد، ارائه‌دهنده/مدل انتخاب‌شده را نشان می‌دهد.

## نکته‌ها

- درک به‌صورت **بهترین تلاش** انجام می‌شود. خطاها پاسخ‌ها را مسدود نمی‌کنند.
- حتی وقتی درک غیرفعال باشد، پیوست‌ها همچنان به مدل‌ها ارسال می‌شوند.
- از `scope` برای محدود کردن محل اجرای درک استفاده کنید (مثلاً فقط پیام‌های خصوصی).

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [پشتیبانی تصویر و رسانه](/fa/nodes/images)
