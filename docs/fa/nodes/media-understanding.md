---
read_when:
    - طراحی یا بازآرایی درک رسانه
    - تنظیم پیش‌پردازش ورودی صدا/ویدئو/تصویر
sidebarTitle: Media understanding
summary: درک تصویر/صدا/ویدئوی ورودی (اختیاری) با مسیرهای جایگزین ارائه‌دهنده + CLI
title: درک رسانه
x-i18n:
    generated_at: "2026-06-27T18:03:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4724578632b0210290d1b32077d2c0ccf7fdfa6b96160f76bf3eff591df7b92e
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw می‌تواند **رسانه‌های ورودی را خلاصه کند** (تصویر/صدا/ویدئو) پیش از آنکه خط لوله پاسخ اجرا شود. وقتی ابزارهای محلی یا کلیدهای ارائه‌دهنده در دسترس باشند، آن‌ها را به‌صورت خودکار تشخیص می‌دهد و می‌توان آن را غیرفعال یا سفارشی کرد. اگر درک رسانه خاموش باشد، مدل‌ها همچنان فایل‌ها/URLهای اصلی را مثل همیشه دریافت می‌کنند.

رفتار رسانه‌ای اختصاصی فروشنده توسط Pluginهای فروشنده ثبت می‌شود، در حالی که هسته OpenClaw مالک پیکربندی مشترک `tools.media`، ترتیب fallback، و یکپارچه‌سازی خط لوله پاسخ است.

## اهداف

- اختیاری: رسانه ورودی را از قبل به متن کوتاه تبدیل کند تا مسیریابی سریع‌تر و تحلیل فرمان بهتر شود.
- تحویل رسانه اصلی به مدل را حفظ کند (همیشه).
- از **APIهای ارائه‌دهنده** و **fallbackهای CLI** پشتیبانی کند.
- اجازه دهد چند مدل با fallback مرتب‌شده داشته باشید (خطا/اندازه/timeout).

## رفتار سطح بالا

<Steps>
  <Step title="جمع‌آوری پیوست‌ها">
    پیوست‌های ورودی را جمع‌آوری کن (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="انتخاب برای هر قابلیت">
    برای هر قابلیت فعال (تصویر/صدا/ویدئو)، پیوست‌ها را بر اساس سیاست انتخاب کن (پیش‌فرض: **اولی**).
  </Step>
  <Step title="انتخاب مدل">
    اولین ورودی مدل واجد شرایط را انتخاب کن (اندازه + قابلیت + احراز هویت).
  </Step>
  <Step title="fallback در صورت شکست">
    اگر یک مدل شکست بخورد یا رسانه بیش از حد بزرگ باشد، **به ورودی بعدی fallback کن**.
  </Step>
  <Step title="اعمال بلوک موفقیت">
    در صورت موفقیت:

    - `Body` به بلوک `[Image]`، `[Audio]`، یا `[Video]` تبدیل می‌شود.
    - صدا `{{Transcript}}` را تنظیم می‌کند؛ تحلیل فرمان وقتی متن کپشن وجود داشته باشد از آن استفاده می‌کند، وگرنه از متن پیاده‌سازی‌شده.
    - کپشن‌ها به‌صورت `User text:` داخل بلوک حفظ می‌شوند.

  </Step>
</Steps>

اگر درک رسانه شکست بخورد یا غیرفعال باشد، **جریان پاسخ ادامه پیدا می‌کند** با بدنه اصلی + پیوست‌ها.

## نمای کلی پیکربندی

`tools.media` از **مدل‌های مشترک** به‌همراه overrideهای مخصوص هر قابلیت پشتیبانی می‌کند:

<AccordionGroup>
  <Accordion title="کلیدهای سطح بالا">
    - `tools.media.models`: فهرست مدل مشترک (برای gate کردن از `capabilities` استفاده کنید).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - پیش‌فرض‌ها (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - overrideهای ارائه‌دهنده (`baseUrl`, `headers`, `providerOptions`)
      - گزینه‌های صوتی Deepgram از طریق `tools.media.audio.providerOptions.deepgram`
      - کنترل‌های echo برای متن پیاده‌سازی‌شده صوتی (`echoTranscript`، پیش‌فرض `false`؛ `echoFormat`)
      - **فهرست `models` مخصوص هر قابلیت** اختیاری (پیش از مدل‌های مشترک ترجیح داده می‌شود)
      - سیاست `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (gate اختیاری بر اساس channel/chatType/session key)
    - `tools.media.concurrency`: حداکثر اجرای همزمان قابلیت‌ها (پیش‌فرض **2**).

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
    - `{{OutputDir}}` (دایرکتوری scratch ساخته‌شده برای این اجرا)
    - `{{OutputBase}}` (مسیر پایه فایل scratch، بدون پسوند)

  </Tab>
</Tabs>

### اعتبارنامه‌های ارائه‌دهنده (`apiKey`)

درک رسانه توسط ارائه‌دهنده از همان حل احراز هویت ارائه‌دهنده استفاده می‌کند که فراخوانی‌های معمول
مدل استفاده می‌کنند: پروفایل‌های احراز هویت، متغیرهای محیطی، سپس
`models.providers.<providerId>.apiKey`.

ورودی‌های `tools.media.*.models[]` یک فیلد inline به نام `apiKey` نمی‌پذیرند. مقدار
`provider` در یک ورودی مدل رسانه، مانند `openai` یا `moonshot`، باید
اعتبارنامه‌های در دسترس از یکی از منابع استاندارد احراز هویت ارائه‌دهنده داشته باشد.

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

برای مرجع کامل احراز هویت ارائه‌دهنده، شامل پروفایل‌ها، متغیرهای محیطی،
و URLهای پایه سفارشی، [ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools) را ببینید.

## پیش‌فرض‌ها و محدودیت‌ها

پیش‌فرض‌های پیشنهادی:

- `maxChars`: **500** برای تصویر/ویدئو (کوتاه، مناسب فرمان)
- `maxChars`: برای صدا **تنظیم‌نشده** (متن پیاده‌سازی‌شده کامل، مگر اینکه محدودیت تعیین کنید)
- `maxBytes`:
  - تصویر: **10MB**
  - صدا: **20MB**
  - ویدئو: **50MB**

<AccordionGroup>
  <Accordion title="قواعد">
    - اگر رسانه از `maxBytes` فراتر برود، آن مدل رد می‌شود و **مدل بعدی امتحان می‌شود**.
    - فایل‌های صوتی کوچک‌تر از **1024 بایت** پیش از پیاده‌سازی توسط ارائه‌دهنده/CLI خالی/خراب تلقی شده و رد می‌شوند؛ زمینه پاسخ ورودی یک placeholder قطعی برای متن پیاده‌سازی‌شده دریافت می‌کند تا agent بداند یادداشت بیش از حد کوچک بوده است.
    - اگر مدل بیش از `maxChars` برگرداند، خروجی کوتاه می‌شود.
    - `prompt` به‌صورت پیش‌فرض به "Describe the {media}." ساده به‌همراه راهنمایی `maxChars` تنظیم می‌شود (فقط تصویر/ویدئو).
    - اگر مدل تصویر اصلی فعال خودش به‌صورت native از vision پشتیبانی کند، OpenClaw بلوک خلاصه `[Image]` را رد می‌کند و به‌جای آن تصویر اصلی را به مدل می‌فرستد.
    - اگر مدل اصلی Gateway/WebChat فقط متنی باشد، پیوست‌های تصویری به‌صورت refهای offloaded با قالب `media://inbound/*` حفظ می‌شوند تا ابزارهای تصویر/PDF یا مدل تصویر پیکربندی‌شده همچنان بتوانند آن‌ها را بررسی کنند، به‌جای اینکه پیوست از دست برود.
    - درخواست‌های صریح `openclaw infer image describe --model <provider/model>` متفاوت هستند: آن‌ها همان ارائه‌دهنده/مدل دارای قابلیت تصویر را مستقیما اجرا می‌کنند، شامل refهای Ollama مثل `ollama/qwen2.5vl:7b`.
    - اگر `<capability>.enabled: true` باشد اما هیچ مدلی پیکربندی نشده باشد، OpenClaw وقتی ارائه‌دهنده مدل از آن قابلیت پشتیبانی کند، **مدل پاسخ فعال** را امتحان می‌کند.

  </Accordion>
</AccordionGroup>

### تشخیص خودکار درک رسانه (پیش‌فرض)

اگر `tools.media.<capability>.enabled` روی `false` تنظیم **نشده** باشد و مدل‌ها را پیکربندی نکرده باشید، OpenClaw به این ترتیب به‌صورت خودکار تشخیص می‌دهد و **در اولین گزینه کارآمد متوقف می‌شود**:

<Steps>
  <Step title="مدل پاسخ فعال">
    مدل پاسخ فعال وقتی ارائه‌دهنده آن از قابلیت پشتیبانی کند.
  </Step>
  <Step title="agents.defaults.imageModel">
    refهای اصلی/fallback در `agents.defaults.imageModel` (فقط تصویر).
    refهای `provider/model` را ترجیح دهید. refهای ساده فقط وقتی match یکتا باشد، از ورودی‌های مدل ارائه‌دهنده پیکربندی‌شده دارای قابلیت تصویر qualified می‌شوند.
  </Step>
  <Step title="CLIهای محلی (فقط صدا)">
    CLIهای محلی (اگر نصب باشند):

    - `sherpa-onnx-offline` (نیازمند `SHERPA_ONNX_MODEL_DIR` با encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`؛ از `WHISPER_CPP_MODEL` یا مدل tiny bundled استفاده می‌کند)
    - `whisper` (CLI پایتون؛ مدل‌ها را خودکار دانلود می‌کند)

  </Step>
  <Step title="Gemini CLI">
    `gemini` با استفاده از `read_many_files`.
  </Step>
  <Step title="احراز هویت ارائه‌دهنده">
    - ورودی‌های پیکربندی‌شده `models.providers.*` که از قابلیت پشتیبانی می‌کنند پیش از ترتیب fallback bundled امتحان می‌شوند.
    - ارائه‌دهندگان پیکربندی فقط‌تصویر با مدل دارای قابلیت تصویر، حتی وقتی Plugin فروشنده bundled نیستند، به‌صورت خودکار برای درک رسانه ثبت می‌شوند.
    - درک تصویر Ollama وقتی به‌صراحت انتخاب شود در دسترس است، مثلا از طریق `agents.defaults.imageModel` یا `openclaw infer image describe --model ollama/<vision-model>`.

    ترتیب fallback bundled:

    - صدا: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
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
تشخیص باینری در macOS/Linux/Windows به‌صورت best-effort است؛ مطمئن شوید CLI روی `PATH` قرار دارد (ما `~` را expand می‌کنیم)، یا یک مدل CLI صریح با مسیر کامل command تنظیم کنید.
</Note>

### پشتیبانی از محیط proxy (مدل‌های ارائه‌دهنده)

وقتی درک رسانه **صوتی** و **ویدئویی** مبتنی بر ارائه‌دهنده فعال باشد، OpenClaw متغیرهای محیطی استاندارد proxy خروجی را برای فراخوانی‌های HTTP ارائه‌دهنده رعایت می‌کند:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

اگر هیچ متغیر محیطی proxy تنظیم نشده باشد، درک رسانه از خروج مستقیم استفاده می‌کند. اگر مقدار proxy بدشکل باشد، OpenClaw یک هشدار log می‌کند و به fetch مستقیم fallback می‌کند.

## قابلیت‌ها (اختیاری)

اگر `capabilities` را تنظیم کنید، آن ورودی فقط برای همان نوع‌های رسانه اجرا می‌شود. برای فهرست‌های مشترک، OpenClaw می‌تواند پیش‌فرض‌ها را استنباط کند:

- `openai`, `anthropic`, `minimax`: **تصویر**
- `minimax-portal`: **تصویر**
- `moonshot`: **تصویر + ویدئو**
- `openrouter`: **تصویر + صدا**
- `google` (Gemini API): **تصویر + صدا + ویدئو**
- `qwen`: **تصویر + ویدئو**
- `mistral`: **صدا**
- `zai`: **تصویر**
- `groq`: **صدا**
- `xai`: **صدا**
- `deepgram`: **صدا**
- هر کاتالوگ `models.providers.<id>.models[]` با یک مدل دارای قابلیت تصویر: **تصویر**

برای ورودی‌های CLI، برای جلوگیری از matchهای غافلگیرکننده، **`capabilities` را به‌صراحت تنظیم کنید**. اگر `capabilities` را حذف کنید، ورودی برای فهرستی که در آن ظاهر شده واجد شرایط است.

## ماتریس پشتیبانی ارائه‌دهنده (یکپارچه‌سازی‌های OpenClaw)

| قابلیت | یکپارچه‌سازی ارائه‌دهنده                                                                                                     | نکات                                                                                                                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| تصویر      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Pluginهای فروشنده پشتیبانی تصویر را ثبت می‌کنند؛ `openai/*` می‌تواند از routing با API-key یا Codex OAuth استفاده کند؛ `codex/*` از یک turn محدود Codex app-server استفاده می‌کند؛ MiniMax و MiniMax OAuth هر دو از `MiniMax-VL-01` استفاده می‌کنند؛ ارائه‌دهندگان پیکربندی دارای قابلیت تصویر به‌صورت خودکار ثبت می‌شوند. |
| صدا      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | پیاده‌سازی گفتار به متن توسط ارائه‌دهنده (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                         |
| ویدئو      | Google, Qwen, Moonshot                                                                                                       | درک ویدئو توسط ارائه‌دهنده از طریق Pluginهای فروشنده؛ درک ویدئو Qwen از endpointهای Standard DashScope استفاده می‌کند.                                                                                                                            |

<Note>
**یادداشت MiniMax**

- درک تصویر در `minimax`، `minimax-cn`، `minimax-portal` و `minimax-portal-cn` از ارائه‌دهنده رسانه `MiniMax-VL-01` که مالکیت آن با Plugin است می‌آید.
- مسیریابی خودکار تصویر همچنان از `MiniMax-VL-01` استفاده می‌کند، حتی اگر فراداده گفت‌وگوی MiniMax M2.x قدیمی ادعای ورودی تصویر داشته باشد.

</Note>

## راهنمای انتخاب مدل

- وقتی کیفیت و ایمنی مهم است، قوی‌ترین مدل نسل جدیدِ موجود را برای هر قابلیت رسانه‌ای ترجیح دهید.
- برای عامل‌های مجهز به ابزار که ورودی‌های نامطمئن را پردازش می‌کنند، از مدل‌های رسانه‌ای قدیمی‌تر/ضعیف‌تر پرهیز کنید.
- برای دسترس‌پذیری، برای هر قابلیت دست‌کم یک جایگزین نگه دارید (مدل باکیفیت + مدل سریع‌تر/ارزان‌تر).
- جایگزین‌های CLI (`whisper-cli`، `whisper`، `gemini`) زمانی مفیدند که APIهای ارائه‌دهنده در دسترس نباشند.
- نکته `parakeet-mlx`: با `--output-dir`، OpenClaw وقتی قالب خروجی `txt` باشد (یا مشخص نشده باشد)، `<output-dir>/<media-basename>.txt` را می‌خواند؛ قالب‌های غیر `txt` به stdout برمی‌گردند.

## سیاست پیوست

`attachments` برای هر قابلیت کنترل می‌کند کدام پیوست‌ها پردازش شوند:

<ParamField path="mode" type='"first" | "all"' default="first">
  اینکه اولین پیوست انتخاب‌شده پردازش شود یا همه آن‌ها.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  تعداد موارد پردازش‌شده را محدود می‌کند.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  اولویت انتخاب میان پیوست‌های نامزد.
</ParamField>

وقتی `mode: "all"` باشد، خروجی‌ها با برچسب‌هایی مانند `[Image 1/2]`، `[Audio 2/2]` و غیره مشخص می‌شوند.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - متن استخراج‌شده فایل، پیش از افزوده شدن به پرامپت رسانه، به‌صورت **محتوای خارجی نامطمئن** بسته‌بندی می‌شود.
    - بلوک تزریق‌شده از نشانگرهای مرزی صریحی مانند `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` استفاده می‌کند و شامل یک خط فراداده `Source: External` است.
    - این مسیر استخراج پیوست عمداً بنر بلند `SECURITY NOTICE:` را حذف می‌کند تا پرامپت رسانه حجیم نشود؛ نشانگرهای مرزی و فراداده همچنان باقی می‌مانند.
    - اگر فایلی متن قابل استخراج نداشته باشد، OpenClaw مقدار `[No extractable text]` را تزریق می‌کند.
    - اگر یک PDF در این مسیر به تصویرهای رندرشده صفحه‌ها برگردد، پرامپت رسانه جای‌نگهدار `[PDF content rendered to images; images not forwarded to model]` را نگه می‌دارد، چون این مرحله استخراج پیوست بلوک‌های متنی را ارسال می‌کند، نه تصویرهای PDF رندرشده را.

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

وقتی درک رسانه اجرا می‌شود، `/status` یک خط خلاصه کوتاه شامل می‌کند:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

این نتیجه‌ها را برای هر قابلیت و، در صورت کاربرد، ارائه‌دهنده/مدل انتخاب‌شده را نشان می‌دهد.

## نکته‌ها

- درک به‌صورت **بهترین تلاش** انجام می‌شود. خطاها پاسخ‌ها را مسدود نمی‌کنند.
- پیوست‌ها حتی وقتی درک غیرفعال باشد، همچنان به مدل‌ها ارسال می‌شوند.
- از `scope` برای محدود کردن محل اجرای درک استفاده کنید (برای مثال فقط پیام‌های مستقیم).

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [پشتیبانی تصویر و رسانه](/fa/nodes/images)
