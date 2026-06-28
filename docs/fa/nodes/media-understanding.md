---
read_when:
    - طراحی یا بازآرایی درک رسانه
    - تنظیم پیش‌پردازش ورودی صدا/ویدئو/تصویر
sidebarTitle: Media understanding
summary: درک ورودی تصویر/صوت/ویدئو (اختیاری) با جایگزین‌های ارائه‌دهنده + CLI
title: درک رسانه‌ها
x-i18n:
    generated_at: "2026-06-28T05:08:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw می‌تواند پیش از اجرای خط لوله پاسخ، **رسانه‌های ورودی را خلاصه کند** (تصویر/صوت/ویدیو). وقتی ابزارهای محلی یا کلیدهای ارائه‌دهنده در دسترس باشند، آن‌ها را خودکار تشخیص می‌دهد و می‌توان آن را غیرفعال یا سفارشی کرد. اگر فهم رسانه خاموش باشد، مدل‌ها همچنان فایل‌ها/URLهای اصلی را مثل همیشه دریافت می‌کنند.

رفتار رسانه‌ای خاص هر فروشنده توسط Pluginهای فروشنده ثبت می‌شود، در حالی که هسته OpenClaw مالک پیکربندی مشترک `tools.media`، ترتیب بازگشت جایگزین، و یکپارچه‌سازی خط لوله پاسخ است.

## هدف‌ها

- اختیاری: پیش‌هضم رسانه ورودی به متن کوتاه برای مسیریابی سریع‌تر + تجزیه بهتر دستورها.
- حفظ تحویل رسانه اصلی به مدل (همیشه).
- پشتیبانی از **APIهای ارائه‌دهنده** و **جایگزین‌های CLI**.
- اجازه چند مدل با بازگشت جایگزین ترتیبی (خطا/اندازه/مهلت زمانی).

## رفتار سطح بالا

<Steps>
  <Step title="گردآوری پیوست‌ها">
    پیوست‌های ورودی (`MediaPaths`، `MediaUrls`، `MediaTypes`) را گردآوری کنید.
  </Step>
  <Step title="انتخاب به‌ازای هر قابلیت">
    برای هر قابلیت فعال‌شده (تصویر/صوت/ویدیو)، پیوست‌ها را طبق سیاست انتخاب کنید (پیش‌فرض: **اولین**).
  </Step>
  <Step title="انتخاب مدل">
    اولین ورودی مدل واجد شرایط را انتخاب کنید (اندازه + قابلیت + احراز هویت).
  </Step>
  <Step title="بازگشت جایگزین هنگام شکست">
    اگر یک مدل شکست بخورد یا رسانه بیش از حد بزرگ باشد، **به ورودی بعدی بازگردید**.
  </Step>
  <Step title="اعمال بلوک موفقیت">
    در صورت موفقیت:

    - `Body` به بلوک `[Image]`، `[Audio]`، یا `[Video]` تبدیل می‌شود.
    - صوت `{{Transcript}}` را تنظیم می‌کند؛ تجزیه دستور، وقتی متن کپشن موجود باشد از آن استفاده می‌کند، وگرنه از رونوشت.
    - کپشن‌ها به‌صورت `User text:` داخل بلوک حفظ می‌شوند.

  </Step>
</Steps>

اگر فهم رسانه شکست بخورد یا غیرفعال باشد، **جریان پاسخ ادامه می‌یابد** با بدنه + پیوست‌های اصلی.

## نمای کلی پیکربندی

`tools.media` از **مدل‌های مشترک** به‌همراه بازنویسی‌های مخصوص هر قابلیت پشتیبانی می‌کند:

<AccordionGroup>
  <Accordion title="کلیدهای سطح بالا">
    - `tools.media.models`: فهرست مدل مشترک (برای محدودسازی از `capabilities` استفاده کنید).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - پیش‌فرض‌ها (`prompt`، `maxChars`، `maxBytes`، `timeoutSeconds`، `language`)
      - بازنویسی‌های ارائه‌دهنده (`baseUrl`، `headers`، `providerOptions`)
      - گزینه‌های صوتی Deepgram از مسیر `tools.media.audio.providerOptions.deepgram`
      - کنترل‌های بازتاب رونوشت صوتی (`echoTranscript`، پیش‌فرض `false`؛ `echoFormat`)
      - **فهرست `models` مخصوص هر قابلیت** اختیاری (پیش از مدل‌های مشترک ترجیح داده می‌شود)
      - سیاست `attachments` (`mode`، `maxAttachments`، `prefer`)
      - `scope` (محدودسازی اختیاری بر اساس channel/chatType/session key)
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

    الگوهای CLI همچنین می‌توانند از این‌ها استفاده کنند:

    - `{{MediaDir}}` (پوشه‌ای که فایل رسانه در آن قرار دارد)
    - `{{OutputDir}}` (پوشه موقتی که برای این اجرا ساخته می‌شود)
    - `{{OutputBase}}` (مسیر پایه فایل موقت، بدون پسوند)

  </Tab>
</Tabs>

### اعتبارنامه‌های ارائه‌دهنده (`apiKey`)

فهم رسانه توسط ارائه‌دهنده از همان حل‌وفصل احراز هویت ارائه‌دهنده استفاده می‌کند که فراخوانی‌های عادی
مدل استفاده می‌کنند: نمایه‌های احراز هویت، متغیرهای محیطی، سپس
`models.providers.<providerId>.apiKey`.

ورودی‌های `tools.media.*.models[]` فیلد درون‌خطی `apiKey` را نمی‌پذیرند. مقدار
`provider` در یک ورودی مدل رسانه، مانند `openai` یا `moonshot`، باید
اعتبارنامه‌ها را از طریق یکی از منابع استاندارد احراز هویت ارائه‌دهنده در دسترس داشته باشد.

مثال کمینه:

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

برای مرجع کامل احراز هویت ارائه‌دهنده، از جمله نمایه‌ها، متغیرهای محیطی
و URLهای پایه سفارشی، [ابزارها و ارائه‌دهنده‌های سفارشی](/fa/gateway/config-tools) را ببینید.

## پیش‌فرض‌ها و محدودیت‌ها

پیش‌فرض‌های پیشنهادی:

- `maxChars`: **500** برای تصویر/ویدیو (کوتاه، مناسب دستور)
- `maxChars`: برای صوت **تنظیم‌نشده** (رونوشت کامل، مگر اینکه محدودیت تعیین کنید)
- `maxBytes`:
  - تصویر: **10MB**
  - صوت: **20MB**
  - ویدیو: **50MB**

<AccordionGroup>
  <Accordion title="قواعد">
    - اگر رسانه از `maxBytes` بیشتر باشد، آن مدل رد می‌شود و **مدل بعدی امتحان می‌شود**.
    - فایل‌های صوتی کوچک‌تر از **1024 bytes** خالی/خراب در نظر گرفته می‌شوند و پیش از رونویسی ارائه‌دهنده/CLI رد می‌شوند؛ بافت پاسخ ورودی یک رونوشت جای‌نگهدار قطعی دریافت می‌کند تا عامل بداند یادداشت بیش از حد کوچک بوده است.
    - اگر مدل بیش از `maxChars` برگرداند، خروجی کوتاه می‌شود.
    - `prompt` به یک "Describe the {media}." ساده به‌همراه راهنمای `maxChars` پیش‌فرض می‌شود (فقط تصویر/ویدیو).
    - اگر مدل تصویر اصلی فعال از قبل به‌صورت بومی از بینایی پشتیبانی کند، OpenClaw بلوک خلاصه `[Image]` را رد می‌کند و به‌جای آن تصویر اصلی را به مدل می‌فرستد.
    - اگر مدل اصلی Gateway/WebChat فقط متنی باشد، پیوست‌های تصویر به‌صورت ارجاع‌های واگذار‌شده `media://inbound/*` حفظ می‌شوند تا ابزارهای تصویر/PDF یا مدل تصویر پیکربندی‌شده همچنان بتوانند آن‌ها را بررسی کنند، به‌جای اینکه پیوست از دست برود.
    - درخواست‌های صریح `openclaw infer image describe --model <provider/model>` متفاوت‌اند: آن‌ها همان ارائه‌دهنده/مدل تصویرتوان را مستقیماً اجرا می‌کنند، از جمله ارجاع‌های Ollama مانند `ollama/qwen2.5vl:7b`.
    - اگر `<capability>.enabled: true` باشد اما هیچ مدلی پیکربندی نشده باشد، OpenClaw وقتی ارائه‌دهنده‌اش از قابلیت پشتیبانی کند، **مدل پاسخ فعال** را امتحان می‌کند.

  </Accordion>
</AccordionGroup>

### تشخیص خودکار فهم رسانه (پیش‌فرض)

اگر `tools.media.<capability>.enabled` روی `false` **تنظیم نشده باشد** و مدل‌ها را پیکربندی نکرده باشید، OpenClaw به این ترتیب خودکار تشخیص می‌دهد و **در اولین گزینه کارآمد متوقف می‌شود**:

<Steps>
  <Step title="مدل پاسخ فعال">
    مدل پاسخ فعال، وقتی ارائه‌دهنده‌اش از قابلیت پشتیبانی کند.
  </Step>
  <Step title="agents.defaults.imageModel">
    ارجاع‌های اصلی/جایگزین `agents.defaults.imageModel` (فقط تصویر).
    ارجاع‌های `provider/model` را ترجیح دهید. ارجاع‌های بدون پیشوند فقط وقتی از ورودی‌های مدل ارائه‌دهنده پیکربندی‌شده و تصویرتوان واجد شرایط می‌شوند که تطبیق یکتا باشد.
  </Step>
  <Step title="CLIهای محلی (فقط صوت)">
    CLIهای محلی (اگر نصب شده باشند):

    - `sherpa-onnx-offline` (به `SHERPA_ONNX_MODEL_DIR` همراه با encoder/decoder/joiner/tokens نیاز دارد)
    - `whisper-cli` (`whisper-cpp`؛ از `WHISPER_CPP_MODEL` یا مدل tiny همراه استفاده می‌کند)
    - `whisper` (CLI پایتون؛ مدل‌ها را خودکار دانلود می‌کند)

  </Step>
  <Step title="Gemini CLI">
    `gemini` با استفاده از `read_many_files`.
  </Step>
  <Step title="احراز هویت ارائه‌دهنده">
    - ورودی‌های پیکربندی‌شده `models.providers.*` که از قابلیت پشتیبانی می‌کنند پیش از ترتیب بازگشت جایگزین همراه امتحان می‌شوند.
    - ارائه‌دهنده‌های پیکربندی فقط-تصویر با یک مدل تصویرتوان، حتی وقتی Plugin فروشنده همراه نیستند، برای فهم رسانه خودکار ثبت می‌شوند.
    - فهم تصویر Ollama وقتی به‌صراحت انتخاب شود در دسترس است، برای مثال از طریق `agents.defaults.imageModel` یا `openclaw infer image describe --model ollama/<vision-model>`.

    ترتیب بازگشت جایگزین همراه:

    - صوت: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
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
تشخیص باینری در macOS/Linux/Windows در حد بهترین تلاش است؛ مطمئن شوید CLI روی `PATH` است (ما `~` را گسترش می‌دهیم)، یا یک مدل CLI صریح با مسیر کامل دستور تنظیم کنید.
</Note>

### پشتیبانی از محیط پراکسی (مدل‌های ارائه‌دهنده)

وقتی فهم رسانه مبتنی بر ارائه‌دهنده برای **صوت** و **ویدیو** فعال باشد، OpenClaw متغیرهای محیطی استاندارد پراکسی خروجی را برای فراخوانی‌های HTTP ارائه‌دهنده رعایت می‌کند:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

اگر هیچ متغیر محیطی پراکسی تنظیم نشده باشد، فهم رسانه از خروج مستقیم استفاده می‌کند. اگر مقدار پراکسی نادرست باشد، OpenClaw یک هشدار ثبت می‌کند و به دریافت مستقیم بازمی‌گردد.

## قابلیت‌ها (اختیاری)

اگر `capabilities` را تنظیم کنید، ورودی فقط برای همان نوع‌های رسانه اجرا می‌شود. برای فهرست‌های مشترک، OpenClaw می‌تواند پیش‌فرض‌ها را استنباط کند:

- `openai`، `anthropic`، `minimax`: **تصویر**
- `minimax-portal`: **تصویر**
- `moonshot`: **تصویر + ویدیو**
- `openrouter`: **تصویر + صوت**
- `google` (Gemini API): **تصویر + صوت + ویدیو**
- `qwen`: **تصویر + ویدیو**
- `mistral`: **صوت**
- `zai`: **تصویر**
- `groq`: **صوت**
- `xai`: **صوت**
- `deepgram`: **صوت**
- هر کاتالوگ `models.providers.<id>.models[]` با یک مدل تصویرتوان: **تصویر**

برای ورودی‌های CLI، برای جلوگیری از تطبیق‌های غافلگیرکننده، **`capabilities` را صریح تنظیم کنید**. اگر `capabilities` را حذف کنید، ورودی برای فهرستی که در آن ظاهر شده واجد شرایط است.

## ماتریس پشتیبانی ارائه‌دهنده (یکپارچه‌سازی‌های OpenClaw)

| قابلیت | یکپارچه‌سازی ارائه‌دهنده                                                                                                         | یادداشت‌ها                                                                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| تصویر      | OpenAI، OpenAI Codex OAuth، Codex app-server، OpenRouter، Anthropic، Google، MiniMax، Moonshot، Qwen، Z.AI، ارائه‌دهنده‌های پیکربندی | Pluginهای فروشنده پشتیبانی تصویر را ثبت می‌کنند؛ `openai/*` می‌تواند از مسیریابی کلید API یا Codex OAuth استفاده کند؛ `codex/*` از یک نوبت محدود Codex app-server استفاده می‌کند؛ MiniMax و MiniMax OAuth هر دو از `MiniMax-VL-01` استفاده می‌کنند؛ ارائه‌دهنده‌های پیکربندی تصویرتوان خودکار ثبت می‌شوند. |
| صوت      | OpenAI، Groq، xAI، Deepgram، OpenRouter، Google، SenseAudio، ElevenLabs، Mistral                                             | رونویسی ارائه‌دهنده (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                         |
| ویدیو      | Google، Qwen، Moonshot                                                                                                       | فهم ویدیو توسط ارائه‌دهنده از طریق Pluginهای فروشنده؛ فهم ویدیوی Qwen از نقاط پایانی Standard DashScope استفاده می‌کند.                                                                                                                            |

<Note>
**یادداشت MiniMax**

- درک تصویر برای `minimax`، `minimax-cn`، `minimax-portal`، و `minimax-portal-cn` از ارائه‌دهندهٔ رسانهٔ `MiniMax-VL-01` متعلق به Plugin می‌آید.
- مسیریابی خودکار تصویر همچنان از `MiniMax-VL-01` استفاده می‌کند، حتی اگر فرادادهٔ چت MiniMax M2.x قدیمی ادعای ورودی تصویر داشته باشد.

</Note>

## راهنمای انتخاب مدل

- وقتی کیفیت و ایمنی اهمیت دارد، قوی‌ترین مدل نسل جدید موجود را برای هر قابلیت رسانه ترجیح دهید.
- برای عامل‌های دارای ابزار که ورودی‌های نامطمئن را پردازش می‌کنند، از مدل‌های رسانه‌ای قدیمی‌تر/ضعیف‌تر اجتناب کنید.
- برای دسترس‌پذیری، برای هر قابلیت دست‌کم یک جایگزین نگه دارید (مدل باکیفیت + مدل سریع‌تر/ارزان‌تر).
- جایگزین‌های CLI (`whisper-cli`، `whisper`، `gemini`) زمانی مفیدند که APIهای ارائه‌دهنده در دسترس نباشند.
- نکتهٔ `parakeet-mlx`: با `--output-dir`، وقتی فرمت خروجی `txt` باشد (یا مشخص نشده باشد)، OpenClaw فایل `<output-dir>/<media-basename>.txt` را می‌خواند؛ فرمت‌های غیر `txt` به stdout بازمی‌گردند.

## سیاست پیوست

`attachments` در سطح هر قابلیت کنترل می‌کند کدام پیوست‌ها پردازش شوند:

<ParamField path="mode" type='"first" | "all"' default="first">
  اینکه نخستین پیوست انتخاب‌شده پردازش شود یا همهٔ آن‌ها.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  تعداد موارد پردازش‌شده را محدود می‌کند.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  ترجیح انتخاب میان پیوست‌های نامزد.
</ParamField>

وقتی `mode: "all"` باشد، خروجی‌ها با `[Image 1/2]`، `[Audio 2/2]`، و غیره برچسب‌گذاری می‌شوند.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - متن استخراج‌شدهٔ فایل پیش از افزوده‌شدن به اعلان رسانه، به‌صورت **محتوای خارجی نامطمئن** بسته‌بندی می‌شود.
    - بلوک تزریق‌شده از نشانگرهای مرزی صریح مانند `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` استفاده می‌کند و شامل یک خط فرادادهٔ `Source: External` است.
    - این مسیر استخراج پیوست عمداً بنر طولانی `SECURITY NOTICE:` را حذف می‌کند تا اعلان رسانه حجیم نشود؛ نشانگرهای مرزی و فراداده همچنان باقی می‌مانند.
    - اگر فایلی متن قابل استخراج نداشته باشد، OpenClaw مقدار `[No extractable text]` را تزریق می‌کند.
    - اگر در این مسیر یک PDF به تصاویر صفحهٔ رندرشده بازگردد، OpenClaw آن تصاویر صفحه را به مدل‌های پاسخ‌گوی دارای قابلیت بینایی ارسال می‌کند و جای‌نگهدار `[PDF content rendered to images]` را در بلوک فایل نگه می‌دارد.

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

این نتیجه‌ها را برای هر قابلیت و، در صورت کاربرد، ارائه‌دهنده/مدل انتخاب‌شده را نشان می‌دهد.

## نکته‌ها

- درک به‌صورت **بهترین تلاش** انجام می‌شود. خطاها پاسخ‌ها را مسدود نمی‌کنند.
- پیوست‌ها حتی وقتی درک غیرفعال باشد، همچنان به مدل‌ها ارسال می‌شوند.
- از `scope` برای محدود کردن محل اجرای درک استفاده کنید (مثلاً فقط پیام‌های مستقیم).

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [پشتیبانی تصویر و رسانه](/fa/nodes/images)
