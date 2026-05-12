---
read_when:
    - طراحی یا بازآرایی درک رسانه
    - تنظیم پیش‌پردازش صوت/ویدئو/تصویر ورودی
sidebarTitle: Media understanding
summary: درک تصویر/صدا/ویدئوی ورودی (اختیاری) با جایگزین‌های ارائه‌دهنده + CLI
title: درک رسانه‌ها
x-i18n:
    generated_at: "2026-05-12T08:46:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d58141ac1591890a4eb2c5cdcbc1bf19727fb0c3a1d4d0a912c6bb19d3f3592
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw می‌تواند **رسانه‌های ورودی را خلاصه کند** (تصویر/صدا/ویدیو) پیش از آنکه پایپ‌لاین پاسخ اجرا شود. وقتی ابزارهای محلی یا کلیدهای ارائه‌دهنده در دسترس باشند، به‌طور خودکار آن‌ها را تشخیص می‌دهد و می‌توان آن را غیرفعال یا سفارشی کرد. اگر فهم رسانه خاموش باشد، مدل‌ها همچنان فایل‌ها/URLهای اصلی را طبق معمول دریافت می‌کنند.

رفتار رسانه‌ای اختصاصی فروشنده‌ها توسط Pluginهای فروشنده ثبت می‌شود، در حالی که هستهٔ OpenClaw مالک پیکربندی مشترک `tools.media`، ترتیب بازگشت جایگزین، و یکپارچه‌سازی با پایپ‌لاین پاسخ است.

## اهداف

- اختیاری: پیش‌هضم رسانه‌های ورودی به متن کوتاه برای مسیریابی سریع‌تر + تجزیهٔ بهتر فرمان.
- حفظ ارسال رسانهٔ اصلی به مدل (همیشه).
- پشتیبانی از **APIهای ارائه‌دهنده** و **جایگزین‌های CLI**.
- اجازهٔ استفاده از چند مدل با بازگشت جایگزین ترتیبی (خطا/اندازه/مهلت زمانی).

## رفتار سطح بالا

<Steps>
  <Step title="گردآوری پیوست‌ها">
    پیوست‌های ورودی را گردآوری کنید (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="انتخاب بر پایهٔ هر قابلیت">
    برای هر قابلیت فعال (تصویر/صدا/ویدیو)، پیوست‌ها را بر پایهٔ سیاست انتخاب کنید (پیش‌فرض: **اولین**).
  </Step>
  <Step title="انتخاب مدل">
    اولین ورودی مدل واجد شرایط را انتخاب کنید (اندازه + قابلیت + احراز هویت).
  </Step>
  <Step title="بازگشت جایگزین هنگام شکست">
    اگر مدلی شکست بخورد یا رسانه بیش از حد بزرگ باشد، **به ورودی بعدی بازگردید**.
  </Step>
  <Step title="اعمال بلوک موفقیت">
    هنگام موفقیت:

    - `Body` به بلوک `[Image]`، `[Audio]`، یا `[Video]` تبدیل می‌شود.
    - صدا `{{Transcript}}` را تنظیم می‌کند؛ تجزیهٔ فرمان وقتی متن زیرنویس/شرح موجود باشد از آن استفاده می‌کند، وگرنه از متن پیاده‌سازی‌شده.
    - شرح‌ها به‌صورت `User text:` داخل بلوک حفظ می‌شوند.

  </Step>
</Steps>

اگر فهم رسانه شکست بخورد یا غیرفعال باشد، **جریان پاسخ ادامه پیدا می‌کند** با بدنه + پیوست‌های اصلی.

## نمای کلی پیکربندی

`tools.media` از **مدل‌های مشترک** به‌همراه بازنویسی‌های هر قابلیت پشتیبانی می‌کند:

<AccordionGroup>
  <Accordion title="کلیدهای سطح بالا">
    - `tools.media.models`: فهرست مدل مشترک (برای محدودسازی از `capabilities` استفاده کنید).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - پیش‌فرض‌ها (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - بازنویسی‌های ارائه‌دهنده (`baseUrl`, `headers`, `providerOptions`)
      - گزینه‌های صوتی Deepgram از طریق `tools.media.audio.providerOptions.deepgram`
      - کنترل‌های بازتاب متن پیاده‌سازی‌شدهٔ صدا (`echoTranscript`، پیش‌فرض `false`؛ `echoFormat`)
      - **فهرست `models` مخصوص هر قابلیت** اختیاری (پیش از مدل‌های مشترک ترجیح داده می‌شود)
      - سیاست `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (دروازه‌گذاری اختیاری بر پایهٔ channel/chatType/session key)
    - `tools.media.concurrency`: حداکثر اجرای هم‌زمان قابلیت‌ها (پیش‌فرض **2**).

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

هر ورودی `models[]` می‌تواند **ارائه‌دهنده** یا **CLI** باشد:

<Tabs>
  <Tab title="ورودی ارائه‌دهنده">
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
  <Tab title="ورودی CLI">
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

    قالب‌های CLI همچنین می‌توانند از این‌ها استفاده کنند:

    - `{{MediaDir}}` (دایرکتوری شامل فایل رسانه)
    - `{{OutputDir}}` (دایرکتوری موقتی ساخته‌شده برای این اجرا)
    - `{{OutputBase}}` (مسیر پایهٔ فایل موقت، بدون پسوند)

  </Tab>
</Tabs>

## پیش‌فرض‌ها و محدودیت‌ها

پیش‌فرض‌های پیشنهادی:

- `maxChars`: **500** برای تصویر/ویدیو (کوتاه، مناسب فرمان)
- `maxChars`: برای صدا **تنظیم‌نشده** (متن کامل پیاده‌سازی‌شده مگر اینکه حدی تعیین کنید)
- `maxBytes`:
  - تصویر: **10MB**
  - صدا: **20MB**
  - ویدیو: **50MB**

<AccordionGroup>
  <Accordion title="قوانین">
    - اگر رسانه از `maxBytes` فراتر برود، آن مدل رد می‌شود و **مدل بعدی امتحان می‌شود**.
    - فایل‌های صوتی کوچک‌تر از **1024 bytes** خالی/خراب تلقی می‌شوند و پیش از پیاده‌سازی توسط ارائه‌دهنده/CLI رد می‌شوند؛ زمینهٔ پاسخ ورودی یک متن پیاده‌سازی‌شدهٔ جایگزین و قطعی دریافت می‌کند تا عامل بداند یادداشت بیش از حد کوچک بوده است.
    - اگر مدل بیش از `maxChars` برگرداند، خروجی کوتاه می‌شود.
    - `prompt` به‌طور پیش‌فرض به "Describe the {media}." ساده به‌همراه راهنمای `maxChars` تبدیل می‌شود (فقط تصویر/ویدیو).
    - اگر مدل تصویر اصلی فعال از قبل به‌صورت بومی از بینایی پشتیبانی کند، OpenClaw بلوک خلاصهٔ `[Image]` را رد می‌کند و در عوض تصویر اصلی را به مدل می‌فرستد.
    - اگر مدل اصلی Gateway/WebChat فقط متنی باشد، پیوست‌های تصویری به‌صورت ارجاع‌های منتقل‌شدهٔ `media://inbound/*` حفظ می‌شوند تا ابزارهای تصویر/PDF یا مدل تصویر پیکربندی‌شده همچنان بتوانند آن‌ها را بررسی کنند، به‌جای اینکه پیوست از دست برود.
    - درخواست‌های صریح `openclaw infer image describe --model <provider/model>` متفاوت‌اند: آن‌ها همان ارائه‌دهنده/مدل دارای قابلیت تصویر را مستقیماً اجرا می‌کنند، از جمله ارجاع‌های Ollama مانند `ollama/qwen2.5vl:7b`.
    - اگر `<capability>.enabled: true` باشد اما هیچ مدلی پیکربندی نشده باشد، OpenClaw وقتی ارائه‌دهندهٔ آن قابلیت را پشتیبانی کند، **مدل پاسخ فعال** را امتحان می‌کند.

  </Accordion>
</AccordionGroup>

### تشخیص خودکار فهم رسانه (پیش‌فرض)

اگر `tools.media.<capability>.enabled` روی `false` **تنظیم نشده باشد** و مدلی پیکربندی نکرده باشید، OpenClaw به این ترتیب تشخیص خودکار انجام می‌دهد و **در اولین گزینهٔ کارآمد متوقف می‌شود**:

<Steps>
  <Step title="مدل پاسخ فعال">
    مدل پاسخ فعال وقتی ارائه‌دهنده‌اش از قابلیت پشتیبانی کند.
  </Step>
  <Step title="agents.defaults.imageModel">
    ارجاع‌های اصلی/جایگزین `agents.defaults.imageModel` (فقط تصویر).
    ارجاع‌های `provider/model` را ترجیح دهید. ارجاع‌های بدون پیشوند فقط زمانی از ورودی‌های مدل ارائه‌دهندهٔ پیکربندی‌شده و دارای قابلیت تصویر واجد شرایط می‌شوند که تطابق یکتا باشد.
  </Step>
  <Step title="CLIهای محلی (فقط صدا)">
    CLIهای محلی (اگر نصب شده باشند):

    - `sherpa-onnx-offline` (به `SHERPA_ONNX_MODEL_DIR` همراه با encoder/decoder/joiner/tokens نیاز دارد)
    - `whisper-cli` (`whisper-cpp`؛ از `WHISPER_CPP_MODEL` یا مدل tiny همراه استفاده می‌کند)
    - `whisper` (CLI پایتون؛ مدل‌ها را به‌طور خودکار دانلود می‌کند)

  </Step>
  <Step title="Gemini CLI">
    `gemini` با استفاده از `read_many_files`.
  </Step>
  <Step title="احراز هویت ارائه‌دهنده">
    - ورودی‌های پیکربندی‌شدهٔ `models.providers.*` که از قابلیت پشتیبانی می‌کنند، پیش از ترتیب بازگشت جایگزین همراه امتحان می‌شوند.
    - ارائه‌دهنده‌های پیکربندی فقط تصویر با مدل دارای قابلیت تصویر، حتی وقتی Plugin فروشندهٔ همراه نباشند، به‌طور خودکار برای فهم رسانه ثبت می‌شوند.
    - فهم تصویر Ollama وقتی به‌صورت صریح انتخاب شود در دسترس است، برای مثال از طریق `agents.defaults.imageModel` یا `openclaw infer image describe --model ollama/<vision-model>`.

    ترتیب بازگشت جایگزین همراه:

    - صدا: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - تصویر: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - ویدیو: Google → Qwen → Moonshot

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
تشخیص باینری در macOS/Linux/Windows به‌صورت best-effort انجام می‌شود؛ مطمئن شوید CLI روی `PATH` قرار دارد (ما `~` را گسترش می‌دهیم)، یا یک مدل CLI صریح با مسیر کامل فرمان تنظیم کنید.
</Note>

### پشتیبانی از محیط پراکسی (مدل‌های ارائه‌دهنده)

وقتی فهم رسانهٔ **صدا** و **ویدیو** مبتنی بر ارائه‌دهنده فعال باشد، OpenClaw متغیرهای محیطی استاندارد پراکسی خروجی را برای فراخوانی‌های HTTP ارائه‌دهنده رعایت می‌کند:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

اگر هیچ متغیر محیطی پراکسی تنظیم نشده باشد، فهم رسانه از خروج مستقیم استفاده می‌کند. اگر مقدار پراکسی بدشکل باشد، OpenClaw هشدار ثبت می‌کند و به واکشی مستقیم بازمی‌گردد.

## قابلیت‌ها (اختیاری)

اگر `capabilities` را تنظیم کنید، ورودی فقط برای آن نوع‌های رسانه اجرا می‌شود. برای فهرست‌های مشترک، OpenClaw می‌تواند پیش‌فرض‌ها را استنباط کند:

- `openai`, `anthropic`, `minimax`: **تصویر**
- `minimax-portal`: **تصویر**
- `moonshot`: **تصویر + ویدیو**
- `openrouter`: **تصویر + صدا**
- `google` (Gemini API): **تصویر + صدا + ویدیو**
- `qwen`: **تصویر + ویدیو**
- `mistral`: **صدا**
- `zai`: **تصویر**
- `groq`: **صدا**
- `xai`: **صدا**
- `deepgram`: **صدا**
- هر کاتالوگ `models.providers.<id>.models[]` با مدل دارای قابلیت تصویر: **تصویر**

برای ورودی‌های CLI، برای جلوگیری از تطابق‌های غافلگیرکننده، **`capabilities` را به‌صورت صریح تنظیم کنید**. اگر `capabilities` را حذف کنید، ورودی برای فهرستی که در آن ظاهر شده واجد شرایط است.

## ماتریس پشتیبانی ارائه‌دهنده (یکپارچه‌سازی‌های OpenClaw)

| قابلیت | یکپارچه‌سازی ارائه‌دهنده                                                                                                         | یادداشت‌ها                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| تصویر      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Pluginهای فروشنده پشتیبانی تصویر را ثبت می‌کنند؛ `openai-codex/*` از زیرساخت ارائه‌دهندهٔ OAuth استفاده می‌کند؛ `codex/*` از یک نوبت محدود Codex app-server استفاده می‌کند؛ MiniMax و MiniMax OAuth هر دو از `MiniMax-VL-01` استفاده می‌کنند؛ ارائه‌دهنده‌های پیکربندی دارای قابلیت تصویر به‌طور خودکار ثبت می‌شوند. |
| صدا      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | پیاده‌سازی گفتار به متن توسط ارائه‌دهنده (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                     |
| ویدیو      | Google, Qwen, Moonshot                                                                                                       | فهم ویدیو توسط ارائه‌دهنده از طریق Pluginهای فروشنده؛ فهم ویدیوی Qwen از endpointهای Standard DashScope استفاده می‌کند.                                                                                                                        |

<Note>
**یادداشت MiniMax**

- فهم تصویر `minimax` و `minimax-portal` از ارائه‌دهندهٔ رسانهٔ `MiniMax-VL-01` تحت مالکیت Plugin می‌آید.
- کاتالوگ متنی همراه MiniMax همچنان در ابتدا فقط متنی است؛ ورودی‌های صریح `models.providers.minimax` ارجاع‌های گفت‌وگوی M2.7 دارای قابلیت تصویر را مادی‌سازی می‌کنند.

</Note>

## راهنمای انتخاب مدل

- وقتی کیفیت و ایمنی مهم است، قوی‌ترین مدل نسل جدید در دسترس را برای هر قابلیت رسانه ترجیح دهید.
- برای عامل‌های دارای ابزار که ورودی‌های نامطمئن را پردازش می‌کنند، از مدل‌های رسانه‌ای قدیمی‌تر/ضعیف‌تر پرهیز کنید.
- برای دسترس‌پذیری، برای هر قابلیت حداقل یک جایگزین نگه دارید (مدل باکیفیت + مدل سریع‌تر/ارزان‌تر).
- جایگزین‌های CLI (`whisper-cli`, `whisper`, `gemini`) زمانی مفیدند که APIهای ارائه‌دهنده در دسترس نباشند.
- یادداشت `parakeet-mlx`: با `--output-dir`، OpenClaw وقتی قالب خروجی `txt` باشد (یا مشخص نشده باشد)، `<output-dir>/<media-basename>.txt` را می‌خواند؛ قالب‌های غیر `txt` به stdout بازمی‌گردند.

## سیاست پیوست

`attachments` مخصوص هر قابلیت کنترل می‌کند کدام پیوست‌ها پردازش شوند:

<ParamField path="mode" type='"first" | "all"' default="first">
  اینکه نخستین پیوست انتخاب‌شده پردازش شود یا همهٔ آن‌ها.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  تعداد موارد پردازش‌شده را محدود می‌کند.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  اولویت انتخاب میان پیوست‌های نامزد.
</ParamField>

وقتی `mode: "all"` باشد، خروجی‌ها با برچسب‌هایی مانند `[Image 1/2]`، `[Audio 2/2]` و غیره مشخص می‌شوند.

<AccordionGroup>
  <Accordion title="رفتار استخراج فایلِ پیوست">
    - متن فایل استخراج‌شده، پیش از افزوده شدن به پرامپت رسانه، به‌صورت **محتوای خارجی نامطمئن** بسته‌بندی می‌شود.
    - بلوک تزریق‌شده از نشانگرهای مرزی صریحی مانند `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` استفاده می‌کند و شامل یک خط فرادادهٔ `Source: External` است.
    - این مسیر استخراج پیوست عمداً بنر طولانی `SECURITY NOTICE:` را حذف می‌کند تا پرامپت رسانه بی‌جهت حجیم نشود؛ نشانگرهای مرزی و فراداده همچنان باقی می‌مانند.
    - اگر فایلی متن قابل استخراج نداشته باشد، OpenClaw مقدار `[No extractable text]` را تزریق می‌کند.
    - اگر یک PDF در این مسیر به تصاویر رندرشدهٔ صفحه‌ها برگردد، پرامپت رسانه جای‌نگهدار `[PDF content rendered to images; images not forwarded to model]` را نگه می‌دارد، زیرا این مرحلهٔ استخراج پیوست بلوک‌های متنی را ارسال می‌کند، نه تصاویر رندرشدهٔ PDF را.

  </Accordion>
</AccordionGroup>

## نمونه‌های پیکربندی

<Tabs>
  <Tab title="مدل‌های مشترک + بازنویسی‌ها">
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
  <Tab title="فقط صدا + ویدئو">
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
  <Tab title="فقط تصویر">
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
  <Tab title="ورودی تکی چندوجهی">
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

وقتی درک رسانه اجرا می‌شود، `/status` شامل یک خط خلاصهٔ کوتاه است:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

این، نتیجه‌ها را برای هر قابلیت و در صورت کاربرد، ارائه‌دهنده/مدل انتخاب‌شده را نشان می‌دهد.

## نکته‌ها

- درک به‌صورت **بهترین تلاش** انجام می‌شود. خطاها پاسخ‌ها را مسدود نمی‌کنند.
- پیوست‌ها حتی وقتی درک غیرفعال باشد، همچنان به مدل‌ها فرستاده می‌شوند.
- از `scope` برای محدود کردن محل اجرای درک استفاده کنید (مثلاً فقط پیام‌های مستقیم).

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [پشتیبانی از تصویر و رسانه](/fa/nodes/images)
