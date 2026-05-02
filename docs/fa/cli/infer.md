---
read_when:
    - افزودن یا تغییر دستورهای `openclaw infer`
    - طراحی اتوماسیون پایدارِ قابلیت‌های بدون رابط کاربری
summary: CLI استنتاج‌محور برای گردش‌کارهای مبتنی بر ارائه‌دهنده در حوزهٔ مدل، تصویر، صدا، TTS، ویدئو، وب و جاسازی
title: CLI استنتاج
x-i18n:
    generated_at: "2026-05-02T11:40:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 04f8b4aeb70e960835612eedcc0a22202957803ca4e5eeb3f1e107e8c736e458
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` سطح headless رسمی برای گردش‌کارهای استنتاج با پشتوانهٔ ارائه‌دهنده است.

این دستور عمداً خانواده‌های قابلیت را آشکار می‌کند، نه نام‌های خام RPC در gateway و نه شناسه‌های خام ابزار agent.

## تبدیل infer به یک مهارت

این را در یک agent کپی و جای‌گذاری کنید:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

یک مهارت خوب مبتنی بر infer باید:

- نیت‌های رایج کاربر را به زیر‌دستور infer درست نگاشت کند
- چند نمونهٔ رسمی infer برای گردش‌کارهایی که پوشش می‌دهد داشته باشد
- در نمونه‌ها و پیشنهادها `openclaw infer ...` را ترجیح دهد
- از مستندسازی دوبارهٔ کل سطح infer داخل بدنهٔ مهارت پرهیز کند

پوشش معمول برای مهارت‌های متمرکز بر infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## چرا از infer استفاده کنیم

`openclaw infer` یک CLI یکپارچه برای کارهای استنتاج با پشتوانهٔ ارائه‌دهنده داخل OpenClaw فراهم می‌کند.

مزایا:

- به‌جای سیم‌کشی wrapperهای موردی برای هر backend، از ارائه‌دهنده‌ها و مدل‌هایی استفاده کنید که از قبل در OpenClaw پیکربندی شده‌اند.
- گردش‌کارهای مدل، تصویر، رونویسی صوت، TTS، ویدئو، وب و embedding را زیر یک درخت دستور نگه دارید.
- برای اسکریپت‌ها، خودکارسازی و گردش‌کارهای هدایت‌شده با agent از شکل خروجی پایدار `--json` استفاده کنید.
- وقتی کار اساساً «اجرای استنتاج» است، سطح first-party در OpenClaw را ترجیح دهید.
- برای بیشتر دستورهای infer، از مسیر محلی معمول بدون نیاز به Gateway استفاده کنید.

برای بررسی‌های سرتاسری ارائه‌دهنده، پس از سبز شدن آزمون‌های سطح پایین‌تر
ارائه‌دهنده، `openclaw infer ...` را ترجیح دهید. این دستور CLI منتشرشده،
بارگذاری config، resolve کردن agent پیش‌فرض، فعال‌سازی Pluginهای bundled و runtime
قابلیت مشترک را پیش از ارسال درخواست ارائه‌دهنده اجرا و بررسی می‌کند.

## درخت دستور

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## کارهای رایج

این جدول کارهای رایج استنتاج را به دستور infer متناظر نگاشت می‌کند.

| کار                          | دستور                                                                                        | نکته‌ها                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| اجرای یک prompt متنی/مدلی    | `openclaw infer model run --prompt "..." --json`                                              | به‌طور پیش‌فرض از مسیر محلی معمول استفاده می‌کند     |
| اجرای یک prompt مدل روی تصاویر | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | برای چند ورودی تصویر، `--file` را تکرار کنید         |
| تولید تصویر                  | `openclaw infer image generate --prompt "..." --json`                                         | هنگام شروع از یک فایل موجود، از `image edit` استفاده کنید |
| توصیف یک فایل تصویر          | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` باید یک `<provider/model>` دارای قابلیت تصویر باشد |
| رونویسی صوت                  | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` باید `<provider/model>` باشد                |
| ساخت گفتار                   | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` مبتنی بر Gateway است                     |
| تولید ویدئو                  | `openclaw infer video generate --prompt "..." --json`                                         | از hintهای ارائه‌دهنده مانند `--resolution` پشتیبانی می‌کند |
| توصیف یک فایل ویدئو          | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` باید `<provider/model>` باشد                |
| جست‌وجوی وب                  | `openclaw infer web search --query "..." --json`                                              |                                                       |
| دریافت یک صفحهٔ وب           | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| ایجاد embeddingها            | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## رفتار

- `openclaw infer ...` سطح اصلی CLI برای این گردش‌کارها است.
- وقتی خروجی توسط دستور یا اسکریپت دیگری مصرف می‌شود، از `--json` استفاده کنید.
- وقتی یک backend مشخص لازم است، از `--provider` یا `--model provider/model` استفاده کنید.
- برای `image describe`، `audio transcribe` و `video describe`، `--model` باید از شکل `<provider/model>` استفاده کند.
- برای `image describe`، یک `--model` صریح همان provider/model را مستقیماً اجرا می‌کند. مدل باید در کاتالوگ مدل یا config ارائه‌دهنده قابلیت تصویر داشته باشد. `codex/<model>` یک نوبت محدود فهم تصویر در app-server مربوط به Codex اجرا می‌کند؛ `openai-codex/<model>` از مسیر ارائه‌دهندهٔ OAuth مربوط به OpenAI Codex استفاده می‌کند.
- دستورهای اجرای بی‌حالت به‌طور پیش‌فرض محلی هستند.
- دستورهای state مدیریت‌شده با Gateway به‌طور پیش‌فرض از Gateway استفاده می‌کنند.
- مسیر محلی معمول نیازی ندارد Gateway در حال اجرا باشد.
- `model run` محلی یک تکمیل provider یک‌باره و سبک است. این دستور مدل و auth مربوط به agent پیکربندی‌شده را resolve می‌کند، اما نوبت chat-agent را شروع نمی‌کند، ابزارها را بارگذاری نمی‌کند، یا serverهای bundled MCP را باز نمی‌کند.
- `model run --file` فایل‌های تصویر را می‌پذیرد، نوع MIME آن‌ها را تشخیص می‌دهد و آن‌ها را همراه prompt ارائه‌شده به مدل انتخاب‌شده می‌فرستد. برای چند تصویر، `--file` را تکرار کنید.
- `model run --file` ورودی‌های غیرتصویری را رد می‌کند. برای فایل‌های صوتی از `infer audio transcribe` و برای فایل‌های ویدئویی از `infer video describe` استفاده کنید.
- `model run --gateway` مسیریابی Gateway، auth ذخیره‌شده، انتخاب ارائه‌دهنده و runtime تعبیه‌شده را تمرین می‌دهد، اما همچنان به‌عنوان یک probe خام مدل اجرا می‌شود: prompt ارائه‌شده و هر پیوست تصویری را بدون transcript قبلی جلسه، زمینهٔ bootstrap/AGENTS، مونتاژ context-engine، ابزارها، یا serverهای bundled MCP ارسال می‌کند.
- `model run --gateway --model <provider/model>` به credential قابل اعتماد operator gateway نیاز دارد، چون درخواست از Gateway می‌خواهد یک override یک‌بارهٔ provider/model را اجرا کند.

## مدل

از `model` برای استنتاج متنی با پشتوانهٔ ارائه‌دهنده و بازرسی مدل/ارائه‌دهنده استفاده کنید.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

برای smoke-test کردن یک ارائه‌دهندهٔ مشخص بدون شروع Gateway یا بارگذاری کامل سطح ابزار agent،
از refهای کامل `<provider/model>` استفاده کنید:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

نکته‌ها:

- `model run` محلی محدودترین smoke در CLI برای سلامت provider/model/auth است، چون فقط prompt ارائه‌شده را به مدل انتخاب‌شده می‌فرستد.
- `model run --file` محلی همان مسیر سبک را نگه می‌دارد و محتوای تصویر را مستقیماً به پیام واحد کاربر پیوست می‌کند. فایل‌های تصویر رایج مانند PNG، JPEG و WebP وقتی نوع MIME آن‌ها به‌صورت `image/*` تشخیص داده شود کار می‌کنند؛ فایل‌های پشتیبانی‌نشده یا شناسایی‌نشده پیش از فراخوانی ارائه‌دهنده شکست می‌خورند.
- وقتی می‌خواهید مدل متنی multimodal انتخاب‌شده را مستقیماً آزمایش کنید، `model run --file` بهترین گزینه است. وقتی انتخاب ارائه‌دهندهٔ فهم تصویر و مسیریابی پیش‌فرض مدل تصویر OpenClaw را می‌خواهید، از `infer image describe` استفاده کنید.
- مدل انتخاب‌شده باید از ورودی تصویر پشتیبانی کند؛ مدل‌های فقط‌متن ممکن است درخواست را در لایهٔ ارائه‌دهنده رد کنند.
- `model run --prompt` باید متن غیرسفیدفضا داشته باشد؛ promptهای خالی پیش از فراخوانی ارائه‌دهنده‌های محلی یا Gateway رد می‌شوند.
- وقتی ارائه‌دهنده هیچ خروجی متنی برنگرداند، `model run` محلی با کد غیرصفر خارج می‌شود، بنابراین ارائه‌دهنده‌های محلی غیرقابل‌دسترسی و تکمیل‌های خالی شبیه probeهای موفق دیده نمی‌شوند.
- وقتی لازم است مسیریابی Gateway، راه‌اندازی agent-runtime یا state ارائه‌دهندهٔ مدیریت‌شده با Gateway را آزمایش کنید و در عین حال ورودی مدل خام بماند، از `model run --gateway` استفاده کنید. وقتی زمینهٔ کامل agent، ابزارها، memory و transcript جلسه را می‌خواهید، از `openclaw agent` یا سطح‌های chat استفاده کنید.
- `model auth login`، `model auth logout` و `model auth status` state ذخیره‌شدهٔ auth ارائه‌دهنده را مدیریت می‌کنند.

## تصویر

از `image` برای تولید، ویرایش و توصیف استفاده کنید.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

نکته‌ها:

- هنگام شروع از فایل‌های ورودی موجود، از `image edit` استفاده کنید.
- برای providerها/modelهایی که از hintهای هندسه در ویرایش‌های reference-image پشتیبانی می‌کنند، از `--size`، `--aspect-ratio` یا `--resolution` همراه `image edit` استفاده کنید.
- برای خروجی PNG با پس‌زمینهٔ شفاف در OpenAI، از `--output-format png --background transparent` همراه `--model openai/gpt-image-1.5` استفاده کنید؛ `--openai-background` همچنان به‌عنوان alias ویژهٔ OpenAI در دسترس است. ارائه‌دهنده‌هایی که پشتیبانی از background را اعلام نمی‌کنند، این hint را به‌عنوان override نادیده‌گرفته‌شده گزارش می‌کنند.
- برای تأیید اینکه کدام ارائه‌دهنده‌های تصویر bundled قابل کشف، پیکربندی‌شده، انتخاب‌شده هستند و هر ارائه‌دهنده چه قابلیت‌های تولید/ویرایش را آشکار می‌کند، از `image providers --json` استفاده کنید.
- از `image generate --model <provider/model> --json` به‌عنوان محدودترین smoke زندهٔ CLI برای تغییرات تولید تصویر استفاده کنید. نمونه:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  پاسخ JSON، `ok`، `provider`، `model`، `attempts` و مسیرهای خروجی نوشته‌شده را گزارش می‌کند. وقتی `--output` تنظیم شده باشد، پسوند نهایی ممکن است از نوع MIME بازگردانده‌شده توسط ارائه‌دهنده پیروی کند.

- برای `image describe` و `image describe-many`، از `--prompt` استفاده کنید تا به مدل بینایی یک دستورالعمل ویژهٔ وظیفه بدهید، مانند OCR، مقایسه، بازرسی UI، یا شرح کوتاه.
- از `--timeout-ms` با مدل‌های بینایی محلی کند یا شروع‌های سرد Ollama استفاده کنید.
- برای `image describe`، `--model` باید یک `<provider/model>` با قابلیت تصویر باشد.
- برای مدل‌های بینایی محلی Ollama، ابتدا مدل را pull کنید و `OLLAMA_API_KEY` را روی هر مقدار جایگزین تنظیم کنید، برای مثال `ollama-local`. [Ollama](/fa/providers/ollama#vision-and-image-description) را ببینید.

## صوت

از `audio` برای رونویسی فایل استفاده کنید.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

نکته‌ها:

- `audio transcribe` برای رونویسی فایل است، نه مدیریت نشست بلادرنگ.
- `--model` باید `<provider/model>` باشد.

## TTS

از `tts` برای سنتز گفتار و وضعیت ارائه‌دهندهٔ TTS استفاده کنید.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

نکته‌ها:

- `tts status` به‌طور پیش‌فرض از Gateway استفاده می‌کند، چون وضعیت TTS مدیریت‌شده توسط Gateway را بازتاب می‌دهد.
- از `tts providers`، `tts voices` و `tts set-provider` برای بررسی و پیکربندی رفتار TTS استفاده کنید.

## ویدئو

از `video` برای تولید و توصیف استفاده کنید.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

نکته‌ها:

- `video generate` گزینه‌های `--size`، `--aspect-ratio`، `--resolution`، `--duration`، `--audio`، `--watermark` و `--timeout-ms` را می‌پذیرد و آن‌ها را به زمان‌اجرای تولید ویدئو ارسال می‌کند.
- `--model` برای `video describe` باید `<provider/model>` باشد.

## وب

از `web` برای گردش‌کارهای جست‌وجو و fetch استفاده کنید.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

نکته‌ها:

- از `web providers` برای بررسی ارائه‌دهندگان دردسترس، پیکربندی‌شده و انتخاب‌شده استفاده کنید.

## Embedding

از `embedding` برای ایجاد بردار و بررسی ارائه‌دهندهٔ embedding استفاده کنید.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## خروجی JSON

فرمان‌های Infer خروجی JSON را زیر یک پاکت مشترک نرمال‌سازی می‌کنند:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

فیلدهای سطح بالا پایدار هستند:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

برای فرمان‌های رسانهٔ تولیدشده، `outputs` شامل فایل‌هایی است که OpenClaw نوشته است. برای خودکارسازی، به‌جای تجزیهٔ stdout خوانا برای انسان، از `path`، `mimeType`، `size` و هر بعد ویژهٔ رسانه در آن آرایه استفاده کنید.

## مشکلات رایج

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## نکته‌ها

- `openclaw capability ...` نام مستعار `openclaw infer ...` است.

## مرتبط

- [مرجع CLI](/fa/cli)
- [مدل‌ها](/fa/concepts/models)
