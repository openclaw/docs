---
read_when:
    - افزودن یا تغییر دستورهای `openclaw infer`
    - طراحی خودکارسازی پایدار قابلیت‌های بدون رابط گرافیکی
summary: CLI استنتاج‌محور برای گردش‌کارهای مدل، تصویر، صوت، TTS، ویدئو، وب و تعبیه با پشتیبانی ارائه‌دهنده
title: CLI استنتاج
x-i18n:
    generated_at: "2026-04-29T22:36:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a154cf11a09f6c60117740f42937da3a0e6942931dde6eee6d902fb6e0ba461
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` سطح headless مرجع برای گردش‌کارهای inference مبتنی بر provider است.

این دستور عمداً خانواده‌های قابلیت را آشکار می‌کند، نه نام‌های خام RPC مربوط به Gateway و نه شناسه‌های خام ابزار agent.

## تبدیل infer به یک مهارت

این را در یک agent کپی و جای‌گذاری کنید:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

یک مهارت خوب مبتنی بر infer باید:

- نیت‌های رایج کاربر را به زیرفرمان درست infer نگاشت کند
- چند نمونه مرجع infer برای گردش‌کارهایی که پوشش می‌دهد داشته باشد
- در نمونه‌ها و پیشنهادها `openclaw infer ...` را ترجیح دهد
- از مستندسازی دوباره کل سطح infer داخل بدنه مهارت پرهیز کند

پوشش معمول مهارت‌های متمرکز بر infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## چرا از infer استفاده کنیم

`openclaw infer` یک CLI یکپارچه برای وظایف inference مبتنی بر provider در OpenClaw فراهم می‌کند.

مزایا:

- به‌جای وصل‌کردن wrapperهای موردی برای هر backend، از providerها و مدل‌هایی استفاده کنید که از قبل در OpenClaw پیکربندی شده‌اند.
- گردش‌کارهای مدل، تصویر، رونویسی صدا، TTS، ویدیو، وب و embedding را زیر یک درخت فرمان نگه دارید.
- برای اسکریپت‌ها، automation و گردش‌کارهای agentمحور از شکل خروجی پایدار `--json` استفاده کنید.
- وقتی وظیفه اساساً «اجرای inference» است، یک سطح first-party از OpenClaw را ترجیح دهید.
- برای بیشتر فرمان‌های infer، از مسیر محلی معمول بدون نیاز به Gateway استفاده کنید.

برای بررسی‌های end-to-end مربوط به provider، پس از سبز شدن تست‌های سطح پایین‌تر
provider، `openclaw infer ...` را ترجیح دهید. این مسیر CLI منتشرشده، بارگذاری config،
تشخیص default-agent، فعال‌سازی Pluginهای bundled، ترمیم وابستگی‌های runtime،
و runtime مشترک قابلیت را پیش از ارسال درخواست provider تمرین می‌دهد.

## درخت فرمان

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

## وظایف رایج

این جدول وظایف رایج inference را به فرمان infer متناظر نگاشت می‌کند.

| وظیفه                         | فرمان                                                                                       | نکته‌ها                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| اجرای یک prompt متنی/مدلی      | `openclaw infer model run --prompt "..." --json`                                              | به‌طور پیش‌فرض از مسیر محلی معمول استفاده می‌کند                 |
| اجرای یک prompt مدل روی تصاویر | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | برای چند ورودی تصویر، `--file` را تکرار کنید             |
| تولید یک تصویر            | `openclaw infer image generate --prompt "..." --json`                                         | هنگام شروع از یک فایل موجود، از `image edit` استفاده کنید  |
| توصیف یک فایل تصویر       | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` باید یک `<provider/model>` دارای قابلیت تصویر باشد |
| رونویسی صدا             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` باید `<provider/model>` باشد                  |
| ساخت گفتار            | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` مبتنی بر Gateway است                      |
| تولید یک ویدیو             | `openclaw infer video generate --prompt "..." --json`                                         | از hintهای provider مانند `--resolution` پشتیبانی می‌کند        |
| توصیف یک فایل ویدیو        | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` باید `<provider/model>` باشد                  |
| جست‌وجوی وب               | `openclaw infer web search --query "..." --json`                                              |                                                       |
| دریافت یک صفحه وب             | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| ایجاد embeddingها            | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## رفتار

- `openclaw infer ...` سطح اصلی CLI برای این گردش‌کارهاست.
- وقتی خروجی قرار است توسط فرمان یا اسکریپت دیگری مصرف شود، از `--json` استفاده کنید.
- وقتی یک backend مشخص لازم است، از `--provider` یا `--model provider/model` استفاده کنید.
- برای `image describe`، `audio transcribe` و `video describe`، `--model` باید شکل `<provider/model>` داشته باشد.
- برای `image describe`، یک `--model` صریح همان provider/model را مستقیماً اجرا می‌کند. مدل باید در کاتالوگ مدل یا config مربوط به provider قابلیت تصویر داشته باشد. `codex/<model>` یک turn محدود در app-server مربوط به Codex برای فهم تصویر اجرا می‌کند؛ `openai-codex/<model>` از مسیر provider مربوط به OpenAI Codex OAuth استفاده می‌کند.
- فرمان‌های اجرای stateless به‌طور پیش‌فرض local هستند.
- فرمان‌های state مدیریت‌شده توسط Gateway به‌طور پیش‌فرض از Gateway استفاده می‌کنند.
- مسیر محلی معمول نیاز ندارد Gateway در حال اجرا باشد.
- `model run` محلی یک completion سبک و تک‌مرحله‌ای از provider است. مدل و auth مربوط به agent پیکربندی‌شده را resolve می‌کند، اما turn مربوط به chat-agent را شروع نمی‌کند، ابزارها را بارگذاری نمی‌کند، یا serverهای bundled MCP را باز نمی‌کند.
- `model run --file` فایل‌های تصویر را می‌پذیرد، نوع MIME آن‌ها را تشخیص می‌دهد، و آن‌ها را همراه با prompt ارائه‌شده به مدل انتخاب‌شده می‌فرستد. برای چند تصویر، `--file` را تکرار کنید.
- `model run --file` ورودی‌های غیرتصویری را رد می‌کند. برای فایل‌های صوتی از `infer audio transcribe` و برای فایل‌های ویدیویی از `infer video describe` استفاده کنید.
- `model run --gateway` routing مربوط به Gateway، auth ذخیره‌شده، انتخاب provider و runtime تعبیه‌شده را تمرین می‌دهد، اما همچنان به‌عنوان یک probe خام مدل اجرا می‌شود: prompt ارائه‌شده و هر پیوست تصویری را بدون transcript قبلی session، context مربوط به bootstrap/AGENTS، اسمبلی context-engine، ابزارها، یا serverهای bundled MCP ارسال می‌کند.
- `model run --gateway --model <provider/model>` به credential معتبر operator gateway نیاز دارد، چون درخواست از Gateway می‌خواهد یک override موردی provider/model را اجرا کند.

## مدل

از `model` برای inference متنی مبتنی بر provider و بررسی model/provider استفاده کنید.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

برای smoke-test کردن یک provider مشخص بدون شروع Gateway یا بارگذاری سطح کامل ابزارهای agent،
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

- `model run` محلی باریک‌ترین smoke در CLI برای سلامت provider/model/auth است، چون فقط prompt ارائه‌شده را به مدل انتخاب‌شده می‌فرستد.
- `model run --file` محلی همان مسیر سبک را نگه می‌دارد و محتوای تصویر را مستقیماً به تنها پیام کاربر پیوست می‌کند. فایل‌های تصویر رایج مانند PNG، JPEG و WebP وقتی نوع MIME آن‌ها به‌صورت `image/*` تشخیص داده شود کار می‌کنند؛ فایل‌های پشتیبانی‌نشده یا ناشناخته پیش از فراخوانی provider شکست می‌خورند.
- `model run --file` زمانی بهترین گزینه است که می‌خواهید مدل متنی multimodal انتخاب‌شده را مستقیماً تست کنید. وقتی انتخاب provider فهم تصویر در OpenClaw و routing پیش‌فرض image-model را می‌خواهید، از `infer image describe` استفاده کنید.
- مدل انتخاب‌شده باید از ورودی تصویر پشتیبانی کند؛ مدل‌های فقط‌متنی ممکن است درخواست را در لایه provider رد کنند.
- `model run --prompt` باید متن غیر whitespace داشته باشد؛ promptهای خالی پیش از فراخوانی providerهای محلی یا Gateway رد می‌شوند.
- وقتی provider هیچ خروجی متنی برنگرداند، `model run` محلی با کد غیرصفر خارج می‌شود، بنابراین providerهای محلی دسترس‌ناپذیر و completionهای خالی شبیه probe موفق دیده نمی‌شوند.
- وقتی لازم است routing مربوط به Gateway، راه‌اندازی agent-runtime یا state مدیریت‌شده provider توسط Gateway را تست کنید و در عین حال ورودی مدل خام بماند، از `model run --gateway` استفاده کنید. وقتی context کامل agent، ابزارها، memory و transcript مربوط به session را می‌خواهید، از `openclaw agent` یا سطح‌های chat استفاده کنید.
- `model auth login`، `model auth logout` و `model auth status` state ذخیره‌شده auth مربوط به provider را مدیریت می‌کنند.

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
- برای providerها/modelهایی که از hintهای هندسی در ویرایش‌های reference-image پشتیبانی می‌کنند، همراه با `image edit` از `--size`، `--aspect-ratio` یا `--resolution` استفاده کنید.
- برای خروجی PNG با پس‌زمینه شفاف در OpenAI، همراه با
  `--model openai/gpt-image-1.5` از `--output-format png --background transparent` استفاده کنید؛
  `--openai-background` همچنان به‌عنوان alias مختص OpenAI در دسترس است. Providerهایی
  که پشتیبانی از background را declare نمی‌کنند، این hint را به‌عنوان override نادیده‌گرفته‌شده گزارش می‌کنند.
- برای اطمینان از اینکه کدام providerهای bundled تصویر قابل کشف، پیکربندی‌شده،
  انتخاب‌شده هستند و هر provider چه قابلیت‌های generation/edit ارائه می‌کند،
  از `image providers --json` استفاده کنید.
- از `image generate --model <provider/model> --json` به‌عنوان باریک‌ترین smoke زنده
  در CLI برای تغییرات تولید تصویر استفاده کنید. نمونه:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  پاسخ JSON، `ok`، `provider`، `model`، `attempts` و مسیرهای خروجی نوشته‌شده را گزارش می‌کند. وقتی `--output` تنظیم شده باشد، پسوند نهایی ممکن است از نوع MIME بازگردانده‌شده توسط ارائه‌دهنده پیروی کند.

- برای `image describe` و `image describe-many`، از `--prompt` استفاده کنید تا به مدل بینایی یک دستورالعمل ویژهٔ کار بدهید؛ مانند OCR، مقایسه، بررسی UI، یا کپشن‌نویسی مختصر.
- با مدل‌های بینایی محلی کند یا شروع‌های سرد Ollama از `--timeout-ms` استفاده کنید.
- برای `image describe`، مقدار `--model` باید یک `<provider/model>` با قابلیت تصویر باشد.
- برای مدل‌های بینایی محلی Ollama، ابتدا مدل را pull کنید و `OLLAMA_API_KEY` را روی هر مقدار جای‌نگهدار، برای مثال `ollama-local`، تنظیم کنید. [Ollama](/fa/providers/ollama#vision-and-image-description) را ببینید.

## صدا

از `audio` برای رونویسی فایل استفاده کنید.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

یادداشت‌ها:

- `audio transcribe` برای رونویسی فایل است، نه مدیریت نشست بی‌درنگ.
- مقدار `--model` باید `<provider/model>` باشد.

## TTS

از `tts` برای سنتز گفتار و وضعیت ارائه‌دهندهٔ TTS استفاده کنید.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

یادداشت‌ها:

- `tts status` به‌طور پیش‌فرض روی Gateway است، چون وضعیت TTS مدیریت‌شده توسط Gateway را بازتاب می‌دهد.
- از `tts providers`، `tts voices` و `tts set-provider` برای بررسی و پیکربندی رفتار TTS استفاده کنید.

## ویدئو

از `video` برای تولید و توصیف استفاده کنید.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

یادداشت‌ها:

- `video generate` گزینه‌های `--size`، `--aspect-ratio`، `--resolution`، `--duration`، `--audio`، `--watermark` و `--timeout-ms` را می‌پذیرد و آن‌ها را به زمان اجرای تولید ویدئو ارسال می‌کند.
- مقدار `--model` برای `video describe` باید `<provider/model>` باشد.

## وب

از `web` برای گردش‌کارهای جست‌وجو و واکشی استفاده کنید.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

یادداشت‌ها:

- از `web providers` برای بررسی ارائه‌دهنده‌های موجود، پیکربندی‌شده و انتخاب‌شده استفاده کنید.

## جاسازی

از `embedding` برای ساخت بردار و بررسی ارائه‌دهندهٔ جاسازی استفاده کنید.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## خروجی JSON

فرمان‌های Infer خروجی JSON را زیر یک پوشش مشترک نرمال‌سازی می‌کنند:

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

برای فرمان‌های رسانهٔ تولیدشده، `outputs` شامل فایل‌هایی است که OpenClaw نوشته است. برای خودکارسازی، به‌جای تجزیهٔ stdout خوانا برای انسان، از `path`، `mimeType`، `size` و هر بُعد ویژهٔ رسانه در آن آرایه استفاده کنید.

## خطاهای رایج

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

## یادداشت‌ها

- `openclaw capability ...` نام مستعار `openclaw infer ...` است.

## مرتبط

- [مرجع CLI](/fa/cli)
- [مدل‌ها](/fa/concepts/models)
