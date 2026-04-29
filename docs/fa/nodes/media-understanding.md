---
read_when:
    - طراحی یا بازآرایی درک رسانه‌ای
    - تنظیم پیش‌پردازش صوت/ویدیو/تصویر ورودی
sidebarTitle: Media understanding
summary: درک تصویر/صدا/ویدئوی ورودی (اختیاری) با مسیرهای جایگزین ارائه‌دهنده + CLI
title: درک رسانه‌ها
x-i18n:
    generated_at: "2026-04-29T23:08:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 907cb0c84f7f0ab916ec07f65dcdffcf4f3c280a5c84ae1bc6fdf758d57545dd
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw می‌تواند **رسانه‌های ورودی را خلاصه کند** (تصویر/صدا/ویدئو) پیش از آنکه خط لوله پاسخ اجرا شود. وقتی ابزارهای محلی یا کلیدهای ارائه‌دهنده در دسترس باشند، به‌صورت خودکار تشخیص می‌دهد و می‌توان آن را غیرفعال یا سفارشی کرد. اگر فهم رسانه خاموش باشد، مدل‌ها همچنان فایل‌ها/URLهای اصلی را مثل همیشه دریافت می‌کنند.

رفتار رسانه‌ای ویژه هر فروشنده توسط Pluginهای فروشنده ثبت می‌شود، در حالی که هسته OpenClaw مالک پیکربندی مشترک `tools.media`، ترتیب fallback، و یکپارچه‌سازی خط لوله پاسخ است.

## اهداف

- اختیاری: پیش‌هضم رسانه‌های ورودی به متن کوتاه برای مسیریابی سریع‌تر + تحلیل بهتر فرمان.
- حفظ تحویل رسانه اصلی به مدل (همیشه).
- پشتیبانی از **APIهای ارائه‌دهنده** و **fallbackهای CLI**.
- امکان استفاده از چند مدل با fallback مرتب‌شده (خطا/اندازه/timeout).

## رفتار سطح بالا

<Steps>
  <Step title="Collect attachments">
    پیوست‌های ورودی (`MediaPaths`، `MediaUrls`، `MediaTypes`) را جمع‌آوری کنید.
  </Step>
  <Step title="Select per-capability">
    برای هر قابلیت فعال‌شده (تصویر/صدا/ویدئو)، پیوست‌ها را طبق policy انتخاب کنید (پیش‌فرض: **اولی**).
  </Step>
  <Step title="Choose model">
    نخستین ورودی مدل واجد شرایط را انتخاب کنید (اندازه + قابلیت + احراز هویت).
  </Step>
  <Step title="Fallback on failure">
    اگر یک مدل شکست بخورد یا رسانه بیش از حد بزرگ باشد، **به ورودی بعدی fallback کنید**.
  </Step>
  <Step title="Apply success block">
    در صورت موفقیت:

    - `Body` به بلوک `[Image]`، `[Audio]`، یا `[Video]` تبدیل می‌شود.
    - صدا `{{Transcript}}` را تنظیم می‌کند؛ تحلیل فرمان وقتی متن caption موجود باشد از آن استفاده می‌کند، در غیر این صورت از transcript.
    - Captionها به‌صورت `User text:` داخل بلوک حفظ می‌شوند.

  </Step>
</Steps>

اگر فهم رسانه شکست بخورد یا غیرفعال باشد، **جریان پاسخ ادامه می‌یابد** با بدنه اصلی + پیوست‌ها.

## نمای کلی پیکربندی

`tools.media` از **مدل‌های مشترک** به‌علاوه overrideهای هر قابلیت پشتیبانی می‌کند:

<AccordionGroup>
  <Accordion title="Top-level keys">
    - `tools.media.models`: فهرست مدل مشترک (برای gate کردن از `capabilities` استفاده کنید).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - پیش‌فرض‌ها (`prompt`، `maxChars`، `maxBytes`، `timeoutSeconds`، `language`)
      - overrideهای ارائه‌دهنده (`baseUrl`، `headers`، `providerOptions`)
      - گزینه‌های صوتی Deepgram از طریق `tools.media.audio.providerOptions.deepgram`
      - کنترل‌های بازتاب transcript صوتی (`echoTranscript`، پیش‌فرض `false`؛ `echoFormat`)
      - **فهرست اختیاری `models` برای هر قابلیت** (پیش از مدل‌های مشترک ترجیح داده می‌شود)
      - policy پیوست‌ها (`mode`، `maxAttachments`، `prefer`)
      - `scope` (gate اختیاری بر اساس کانال/chatType/کلید session)
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

    الگوهای CLI می‌توانند از این‌ها نیز استفاده کنند:

    - `{{MediaDir}}` (دایرکتوری حاوی فایل رسانه)
    - `{{OutputDir}}` (دایرکتوری scratch که برای این اجرا ساخته شده است)
    - `{{OutputBase}}` (مسیر پایه فایل scratch، بدون پسوند)

  </Tab>
</Tabs>

## پیش‌فرض‌ها و محدودیت‌ها

پیش‌فرض‌های پیشنهادی:

- `maxChars`: **500** برای تصویر/ویدئو (کوتاه، مناسب فرمان)
- `maxChars`: برای صدا **تنظیم‌نشده** (transcript کامل مگر اینکه محدودیت تعیین کنید)
- `maxBytes`:
  - تصویر: **10MB**
  - صدا: **20MB**
  - ویدئو: **50MB**

<AccordionGroup>
  <Accordion title="Rules">
    - اگر رسانه از `maxBytes` فراتر برود، آن مدل رد می‌شود و **مدل بعدی امتحان می‌شود**.
    - فایل‌های صوتی کوچک‌تر از **1024 بایت** پیش از transcription توسط ارائه‌دهنده/CLI خالی یا خراب تلقی شده و رد می‌شوند؛ context پاسخ ورودی یک transcript placeholder قطعی دریافت می‌کند تا agent بداند یادداشت بیش از حد کوچک بوده است.
    - اگر مدل بیش از `maxChars` برگرداند، خروجی کوتاه می‌شود.
    - `prompt` به‌صورت پیش‌فرض یک "Describe the {media}." ساده به‌علاوه راهنمای `maxChars` است (فقط تصویر/ویدئو).
    - اگر مدل تصویر primary فعال از قبل به‌صورت native از vision پشتیبانی کند، OpenClaw بلوک خلاصه `[Image]` را رد می‌کند و در عوض تصویر اصلی را به مدل می‌دهد.
    - اگر مدل primary در Gateway/WebChat فقط متنی باشد، پیوست‌های تصویر به‌صورت refهای offloadشده `media://inbound/*` حفظ می‌شوند تا ابزارهای تصویر/PDF یا مدل تصویر پیکربندی‌شده همچنان بتوانند آنها را بررسی کنند، به‌جای اینکه پیوست از دست برود.
    - درخواست‌های صریح `openclaw infer image describe --model <provider/model>` متفاوت‌اند: آنها همان provider/model دارای قابلیت تصویر را مستقیم اجرا می‌کنند، از جمله refهای Ollama مانند `ollama/qwen2.5vl:7b`.
    - اگر `<capability>.enabled: true` باشد اما هیچ مدلی پیکربندی نشده باشد، OpenClaw وقتی ارائه‌دهنده مدل از قابلیت پشتیبانی کند، **مدل پاسخ فعال** را امتحان می‌کند.

  </Accordion>
</AccordionGroup>

### تشخیص خودکار فهم رسانه (پیش‌فرض)

اگر `tools.media.<capability>.enabled` روی `false` **تنظیم نشده** باشد و مدلی پیکربندی نکرده باشید، OpenClaw با این ترتیب تشخیص خودکار انجام می‌دهد و **در اولین گزینه کارآمد متوقف می‌شود**:

<Steps>
  <Step title="Active reply model">
    مدل پاسخ فعال، وقتی ارائه‌دهنده آن از قابلیت پشتیبانی کند.
  </Step>
  <Step title="agents.defaults.imageModel">
    refهای primary/fallback در `agents.defaults.imageModel` (فقط تصویر).
    refهای `provider/model` را ترجیح دهید. refهای bare فقط وقتی match یکتا باشد از ورودی‌های مدل ارائه‌دهنده دارای قابلیت تصویر پیکربندی‌شده qualify می‌شوند.
  </Step>
  <Step title="Local CLIs (audio only)">
    CLIهای محلی (اگر نصب باشند):

    - `sherpa-onnx-offline` (به `SHERPA_ONNX_MODEL_DIR` با encoder/decoder/joiner/tokens نیاز دارد)
    - `whisper-cli` (`whisper-cpp`؛ از `WHISPER_CPP_MODEL` یا مدل tiny همراه استفاده می‌کند)
    - `whisper` (CLI پایتون؛ مدل‌ها را به‌صورت خودکار دانلود می‌کند)

  </Step>
  <Step title="Gemini CLI">
    `gemini` با استفاده از `read_many_files`.
  </Step>
  <Step title="Provider auth">
    - ورودی‌های پیکربندی‌شده `models.providers.*` که از قابلیت پشتیبانی می‌کنند پیش از ترتیب fallback همراه امتحان می‌شوند.
    - ارائه‌دهندگان پیکربندی فقط-تصویر با مدل دارای قابلیت تصویر، حتی وقتی Plugin فروشنده همراه نباشند، به‌صورت خودکار برای فهم رسانه ثبت می‌شوند.
    - فهم تصویر Ollama وقتی به‌صورت صریح انتخاب شود در دسترس است، برای مثال از طریق `agents.defaults.imageModel` یا `openclaw infer image describe --model ollama/<vision-model>`.

    ترتیب fallback همراه:

    - صدا: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
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
تشخیص binary در macOS/Linux/Windows best-effort است؛ مطمئن شوید CLI روی `PATH` است (ما `~` را expand می‌کنیم)، یا یک مدل CLI صریح با مسیر کامل command تنظیم کنید.
</Note>

### پشتیبانی از محیط proxy (مدل‌های ارائه‌دهنده)

وقتی فهم رسانه **صوتی** و **ویدئویی** مبتنی بر ارائه‌دهنده فعال باشد، OpenClaw متغیرهای محیطی استاندارد proxy خروجی را برای فراخوانی‌های HTTP ارائه‌دهنده رعایت می‌کند:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

اگر هیچ متغیر محیطی proxy تنظیم نشده باشد، فهم رسانه از egress مستقیم استفاده می‌کند. اگر مقدار proxy بدفرمت باشد، OpenClaw یک warning ثبت می‌کند و به fetch مستقیم fallback می‌کند.

## قابلیت‌ها (اختیاری)

اگر `capabilities` را تنظیم کنید، ورودی فقط برای آن نوع‌های رسانه اجرا می‌شود. برای فهرست‌های مشترک، OpenClaw می‌تواند پیش‌فرض‌ها را استنتاج کند:

- `openai`، `anthropic`، `minimax`: **تصویر**
- `minimax-portal`: **تصویر**
- `moonshot`: **تصویر + ویدئو**
- `openrouter`: **تصویر**
- `google` (Gemini API): **تصویر + صدا + ویدئو**
- `qwen`: **تصویر + ویدئو**
- `mistral`: **صدا**
- `zai`: **تصویر**
- `groq`: **صدا**
- `xai`: **صدا**
- `deepgram`: **صدا**
- هر کاتالوگ `models.providers.<id>.models[]` با مدل دارای قابلیت تصویر: **تصویر**

برای ورودی‌های CLI، برای جلوگیری از matchهای غافلگیرکننده **`capabilities` را صریح تنظیم کنید**. اگر `capabilities` را حذف کنید، ورودی برای فهرستی که در آن ظاهر می‌شود واجد شرایط است.

## ماتریس پشتیبانی ارائه‌دهنده (یکپارچه‌سازی‌های OpenClaw)

| قابلیت | یکپارچه‌سازی ارائه‌دهنده                                                                                                     | نکات                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| تصویر      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Pluginهای فروشنده پشتیبانی تصویر را ثبت می‌کنند؛ `openai-codex/*` از plumbing ارائه‌دهنده OAuth استفاده می‌کند؛ `codex/*` از یک turn محدود Codex app-server استفاده می‌کند؛ MiniMax و MiniMax OAuth هر دو از `MiniMax-VL-01` استفاده می‌کنند؛ ارائه‌دهندگان پیکربندی دارای قابلیت تصویر به‌صورت خودکار ثبت می‌شوند. |
| صدا        | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | transcription ارائه‌دهنده (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                    |
| ویدئو      | Google, Qwen, Moonshot                                                                                                       | فهم ویدئو توسط ارائه‌دهنده از طریق Pluginهای فروشنده؛ فهم ویدئو Qwen از endpointهای Standard DashScope استفاده می‌کند.                                                                                                                        |

<Note>
**نکته MiniMax**

- فهم تصویر `minimax` و `minimax-portal` از media provider تحت مالکیت Plugin یعنی `MiniMax-VL-01` می‌آید.
- کاتالوگ متن MiniMax همراه همچنان فقط-متن شروع می‌شود؛ ورودی‌های صریح `models.providers.minimax`، refهای chat دارای قابلیت تصویر M2.7 را materialize می‌کنند.

</Note>

## راهنمای انتخاب مدل

- وقتی کیفیت و ایمنی اهمیت دارد، قوی‌ترین مدل نسل جدید موجود را برای هر قابلیت رسانه ترجیح دهید.
- برای agentهای دارای ابزار که ورودی‌های غیرقابل اعتماد را مدیریت می‌کنند، از مدل‌های رسانه‌ای قدیمی‌تر/ضعیف‌تر پرهیز کنید.
- برای دسترس‌پذیری، حداقل یک fallback برای هر قابلیت نگه دارید (مدل باکیفیت + مدل سریع‌تر/ارزان‌تر).
- fallbackهای CLI (`whisper-cli`، `whisper`، `gemini`) وقتی APIهای ارائه‌دهنده در دسترس نیستند مفیدند.
- نکته `parakeet-mlx`: با `--output-dir`، OpenClaw وقتی قالب خروجی `txt` باشد (یا مشخص نشده باشد) `<output-dir>/<media-basename>.txt` را می‌خواند؛ قالب‌های غیر `txt` به stdout fallback می‌کنند.

## policy پیوست

`attachments` برای هر قابلیت کنترل می‌کند کدام پیوست‌ها پردازش شوند:

<ParamField path="mode" type='"first" | "all"' default="first">
  اینکه نخستین پیوست انتخاب‌شده پردازش شود یا همهٔ آن‌ها.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  تعداد موارد پردازش‌شده را محدود می‌کند.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  اولویت انتخاب میان پیوست‌های نامزد.
</ParamField>

وقتی `mode: "all"` باشد، خروجی‌ها با `[Image 1/2]`، `[Audio 2/2]` و غیره برچسب‌گذاری می‌شوند.

<AccordionGroup>
  <Accordion title="رفتار استخراج پیوست فایل">
    - متن فایل استخراج‌شده، پیش از افزوده‌شدن به پرامپت رسانه، به‌صورت **محتوای خارجی غیرقابل‌اعتماد** بسته‌بندی می‌شود.
    - بلوک تزریق‌شده از نشانگرهای مرزی صریحی مانند `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` استفاده می‌کند و یک خط فرادادهٔ `Source: External` را شامل می‌شود.
    - این مسیر استخراج پیوست، برای جلوگیری از حجیم‌شدن پرامپت رسانه، عمداً بنر طولانی `SECURITY NOTICE:` را حذف می‌کند؛ نشانگرهای مرزی و فراداده همچنان باقی می‌مانند.
    - اگر فایلی متن قابل استخراج نداشته باشد، OpenClaw مقدار `[No extractable text]` را تزریق می‌کند.
    - اگر یک PDF در این مسیر به تصاویر صفحهٔ رندرشده برگردد، پرامپت رسانه جای‌نگهدار `[PDF content rendered to images; images not forwarded to model]` را نگه می‌دارد، زیرا این مرحلهٔ استخراج پیوست بلوک‌های متنی را ارسال می‌کند، نه تصاویر PDF رندرشده را.

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
  <Tab title="ورودی واحد چندوجهی">
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

این مورد، نتیجه‌ها را به‌ازای هر قابلیت و در صورت کاربرد، ارائه‌دهنده/مدل انتخاب‌شده را نشان می‌دهد.

## نکته‌ها

- درک به‌صورت **بهترین تلاش** انجام می‌شود. خطاها پاسخ‌ها را مسدود نمی‌کنند.
- پیوست‌ها حتی وقتی درک غیرفعال باشد، همچنان به مدل‌ها ارسال می‌شوند.
- از `scope` برای محدودکردن محل اجرای درک استفاده کنید (برای مثال فقط DMها).

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [پشتیبانی تصویر و رسانه](/fa/nodes/images)
