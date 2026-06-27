---
read_when:
    - افزودن یا تغییر دستورهای `openclaw infer`
    - طراحی خودکارسازی پایدار قابلیت‌های بدون رابط گرافیکی
summary: CLI استنتاج‌محور برای گردش‌کارهای مدل، تصویر، صدا، TTS، ویدئو، وب و جاسازی با پشتیبانی ارائه‌دهنده
title: CLI استنتاج
x-i18n:
    generated_at: "2026-06-27T17:24:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93ebb2a830bfbe6aad58cfa7aa2252cf016a6c9cb99b7592406593627e41fdd1
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` سطح headless متعارف برای گردش‌کارهای استنتاج مبتنی بر ارائه‌دهنده است.

این فرمان عمدا خانواده‌های قابلیت را آشکار می‌کند، نه نام‌های خام RPC مربوط به gateway و نه شناسه‌های خام ابزار agent.

## تبدیل infer به یک skill

این را در یک agent کپی و جای‌گذاری کنید:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

یک skill خوب مبتنی بر infer باید:

- نیت‌های رایج کاربر را به زیرفرمان درست infer نگاشت کند
- چند نمونه متعارف infer برای گردش‌کارهایی که پوشش می‌دهد داشته باشد
- در نمونه‌ها و پیشنهادها `openclaw infer ...` را ترجیح دهد
- از مستندسازی دوباره کل سطح infer در بدنه skill پرهیز کند

پوشش معمول skill متمرکز بر infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## چرا از infer استفاده کنیم

`openclaw infer` یک CLI یکپارچه برای وظایف استنتاج مبتنی بر ارائه‌دهنده داخل OpenClaw فراهم می‌کند.

مزایا:

- به‌جای سیم‌کشی wrapperهای یک‌باره برای هر backend، از ارائه‌دهنده‌ها و مدل‌هایی استفاده کنید که از قبل در OpenClaw پیکربندی شده‌اند.
- گردش‌کارهای مدل، تصویر، رونویسی صدا، TTS، ویدیو، وب و embedding را زیر یک درخت فرمان نگه دارید.
- برای اسکریپت‌ها، اتوماسیون و گردش‌کارهای هدایت‌شده توسط agent از شکل خروجی پایدار `--json` استفاده کنید.
- وقتی وظیفه اساسا «اجرای استنتاج» است، یک سطح اول‌شخص OpenClaw را ترجیح دهید.
- برای بیشتر فرمان‌های infer از مسیر محلی عادی بدون نیاز به gateway استفاده کنید.

برای بررسی‌های سرتاسری ارائه‌دهنده، پس از سبز شدن تست‌های سطح پایین‌تر
ارائه‌دهنده، `openclaw infer ...` را ترجیح دهید. این کار CLI منتشرشده، بارگذاری پیکربندی،
حل default-agent، فعال‌سازی Plugin همراه، و runtime قابلیت مشترک را پیش از
ارسال درخواست به ارائه‌دهنده اجرا می‌کند.

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

این جدول وظایف رایج استنتاج را به فرمان infer متناظر نگاشت می‌کند.

| وظیفه                          | فرمان                                                                                       | نکته‌ها                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| اجرای یک prompt متنی/مدلی       | `openclaw infer model run --prompt "..." --json`                                              | به‌طور پیش‌فرض از مسیر محلی عادی استفاده می‌کند                 |
| اجرای یک prompt مدل روی تصاویر  | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | برای چند ورودی تصویر، `--file` را تکرار کنید             |
| تولید یک تصویر             | `openclaw infer image generate --prompt "..." --json`                                         | هنگام شروع از یک فایل موجود، از `image edit` استفاده کنید  |
| توصیف یک فایل تصویر یا URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` باید یک `<provider/model>` توانمند در تصویر باشد |
| رونویسی صدا              | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` باید `<provider/model>` باشد                  |
| ساخت گفتار             | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` معطوف به gateway است                      |
| تولید یک ویدیو              | `openclaw infer video generate --prompt "..." --json`                                         | از راهنمایی‌های ارائه‌دهنده مانند `--resolution` پشتیبانی می‌کند        |
| توصیف یک فایل ویدیو         | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` باید `<provider/model>` باشد                  |
| جست‌وجوی وب                | `openclaw infer web search --query "..." --json`                                              |                                                       |
| واکشی یک صفحه وب              | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| ایجاد embeddingها             | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## رفتار

- `openclaw infer ...` سطح CLI اصلی برای این گردش‌کارها است.
- وقتی خروجی توسط فرمان یا اسکریپت دیگری مصرف می‌شود، از `--json` استفاده کنید.
- وقتی یک backend مشخص لازم است، از `--provider` یا `--model provider/model` استفاده کنید.
- برای ارسال سطح thinking/reasoning یک‌باره (`off`، `minimal`، `low`، `medium`، `high`، `adaptive`، `xhigh`، یا `max`) در حالی که اجرا raw باقی می‌ماند، از `model run --thinking <level>` استفاده کنید.
- برای `image describe`، `audio transcribe`، و `video describe`، `--model` باید به شکل `<provider/model>` باشد.
- برای `image describe`، `--file` مسیرهای محلی و URLهای تصویر HTTP(S) را می‌پذیرد. URLهای remote از سیاست SSRF واکشی رسانه عادی استفاده می‌کنند.
- برای `image describe`، یک `--model` صریح همان provider/model را مستقیما اجرا می‌کند. مدل باید در کاتالوگ مدل یا پیکربندی ارائه‌دهنده توانمند در تصویر باشد. `codex/<model>` یک نوبت محدود درک تصویرِ app-server مربوط به Codex را اجرا می‌کند؛ `openai/<model>` از مسیر ارائه‌دهنده OpenAI با احراز هویت API-key یا ChatGPT/Codex OAuth استفاده می‌کند.
- فرمان‌های اجرای بدون state به‌طور پیش‌فرض محلی هستند.
- فرمان‌های state مدیریت‌شده توسط Gateway به‌طور پیش‌فرض gateway هستند.
- مسیر محلی عادی نیازی ندارد که gateway در حال اجرا باشد.
- `model run` محلی یک تکمیل ارائه‌دهنده lean و یک‌باره است. مدل و احراز هویت agent پیکربندی‌شده را resolve می‌کند، اما نوبت chat-agent را شروع نمی‌کند، ابزارها را بارگذاری نمی‌کند، یا سرورهای MCP همراه را باز نمی‌کند.
- `model run --file` فایل‌های تصویر را می‌پذیرد، نوع MIME آن‌ها را تشخیص می‌دهد، و آن‌ها را همراه با prompt داده‌شده به مدل انتخاب‌شده می‌فرستد. برای چند تصویر، `--file` را تکرار کنید.
- `model run --file` ورودی‌های غیرتصویری را رد می‌کند. برای فایل‌های صوتی از `infer audio transcribe` و برای فایل‌های ویدیویی از `infer video describe` استفاده کنید.
- `model run --gateway` مسیریابی Gateway، احراز هویت ذخیره‌شده، انتخاب ارائه‌دهنده، و runtime جاسازی‌شده را اجرا می‌کند، اما همچنان به‌عنوان یک probe خام مدل اجرا می‌شود: prompt داده‌شده و هر پیوست تصویر را بدون transcript قبلی session، context bootstrap/AGENTS، assembly موتور context، ابزارها، یا سرورهای MCP همراه می‌فرستد.
- `model run --gateway --model <provider/model>` به credential قابل‌اعتماد gateway operator نیاز دارد، چون درخواست از Gateway می‌خواهد یک override یک‌باره provider/model را اجرا کند.
- `model run --thinking` محلی از مسیر lean تکمیل ارائه‌دهنده استفاده می‌کند؛ سطح‌های ویژه ارائه‌دهنده مانند `adaptive` و `max` به نزدیک‌ترین سطح قابل‌حمل simple-completion نگاشت می‌شوند.

## مدل

از `model` برای استنتاج متن مبتنی بر ارائه‌دهنده و بازرسی مدل/ارائه‌دهنده استفاده کنید.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

برای smoke-test یک ارائه‌دهنده مشخص بدون
شروع Gateway یا بارگذاری سطح کامل ابزار agent، از refهای کامل `<provider/model>` استفاده کنید:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

نکته‌ها:

- `model run` محلی محدودترین smoke CLI برای سلامت provider/model/auth است، چون برای ارائه‌دهنده‌های غیر Codex فقط prompt داده‌شده را به مدل انتخاب‌شده می‌فرستد.
- `model run --model <provider/model>` محلی می‌تواند پیش از نوشته شدن آن ارائه‌دهنده در پیکربندی، از ردیف‌های دقیق کاتالوگ static همراه از `models list --all` استفاده کند. احراز هویت ارائه‌دهنده همچنان لازم است؛ credentialهای گمشده به‌صورت خطاهای auth شکست می‌خورند، نه `Unknown model`.
- برای probeهای reasoning مدل Mistral Medium 3.5، temperature را unset/default بگذارید. Mistral ترکیب `reasoning_effort="high"` به‌علاوه `temperature: 0` را رد می‌کند؛ از `mistral/mistral-medium-3-5` با temperature پیش‌فرض یا یک مقدار reasoning-mode غیرصفر مانند `0.7` استفاده کنید.
- probeهای محلی Codex Responses استثنای محدود هستند: OpenClaw یک دستور system کمینه اضافه می‌کند تا transport بتواند فیلد الزامی `instructions` خود را پر کند، بدون افزودن context کامل agent، ابزارها، memory، یا transcript session.
- `model run --file` محلی همان مسیر lean را نگه می‌دارد و محتوای تصویر را مستقیما به پیام واحد کاربر پیوست می‌کند. فایل‌های رایج تصویر مانند PNG، JPEG، و WebP وقتی نوع MIME آن‌ها به‌صورت `image/*` تشخیص داده شود کار می‌کنند؛ فایل‌های پشتیبانی‌نشده یا ناشناخته پیش از فراخوانی ارائه‌دهنده شکست می‌خورند.
- `model run --file` زمانی بهترین است که می‌خواهید مدل متن multimodal انتخاب‌شده را مستقیما آزمایش کنید. وقتی selection ارائه‌دهنده درک تصویر و مسیریابی model تصویر پیش‌فرض OpenClaw را می‌خواهید، از `infer image describe` استفاده کنید.
- مدل انتخاب‌شده باید از ورودی تصویر پشتیبانی کند؛ مدل‌های فقط متن ممکن است درخواست را در لایه ارائه‌دهنده رد کنند.
- `model run --prompt` باید متن غیر whitespace داشته باشد؛ promptهای خالی پیش از فراخوانی ارائه‌دهنده‌های محلی یا Gateway رد می‌شوند.
- `model run` محلی وقتی ارائه‌دهنده هیچ خروجی متنی برنمی‌گرداند با non-zero خارج می‌شود، بنابراین ارائه‌دهنده‌های محلی غیرقابل‌دسترسی و تکمیل‌های خالی مانند probeهای موفق به‌نظر نمی‌رسند.
- وقتی نیاز دارید مسیریابی Gateway، راه‌اندازی agent-runtime، یا state ارائه‌دهنده مدیریت‌شده توسط Gateway را آزمایش کنید و در عین حال ورودی مدل raw بماند، از `model run --gateway` استفاده کنید. وقتی context کامل agent، ابزارها، memory، و transcript session را می‌خواهید، از `openclaw agent` یا سطوح chat استفاده کنید.
- `model auth login`، `model auth logout`، و `model auth status` وضعیت احراز هویت ذخیره‌شده ارائه‌دهنده را مدیریت می‌کنند.

## تصویر

از `image` برای تولید، ویرایش، و توصیف استفاده کنید.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "low-cost draft poster" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

یادداشت‌ها:

- هنگام شروع از فایل‌های ورودی موجود، از `image edit` استفاده کنید.
- برای ارائه‌دهندگان/مدل‌هایی که از راهنمایی‌های هندسی در ویرایش‌های مبتنی بر تصویر مرجع پشتیبانی می‌کنند، از `--size`،‏ `--aspect-ratio` یا `--resolution` همراه با `image edit` استفاده کنید.
- برای خروجی PNG با پس‌زمینه شفاف در OpenAI، از `--output-format png --background transparent` همراه با `--model openai/gpt-image-1.5` استفاده کنید؛ `--openai-background` همچنان به‌عنوان نام مستعار ویژه OpenAI در دسترس است. ارائه‌دهندگانی که پشتیبانی از پس‌زمینه را اعلام نمی‌کنند، این راهنما را به‌عنوان بازنویسی نادیده‌گرفته‌شده گزارش می‌کنند.
- برای ارائه‌دهندگانی که از راهنمایی‌های کیفیت تصویر پشتیبانی می‌کنند، از جمله OpenAI، از `--quality low|medium|high|auto` استفاده کنید. OpenAI همچنین برای راهنمایی تعدیل ویژه ارائه‌دهنده، `--openai-moderation low|auto` را می‌پذیرد.
- برای بررسی اینکه کدام ارائه‌دهندگان تصویرِ همراه قابل کشف، پیکربندی‌شده و انتخاب‌شده هستند و هر ارائه‌دهنده چه قابلیت‌های تولید/ویرایشی را ارائه می‌کند، از `image providers --json` استفاده کنید.
- برای تغییرات تولید تصویر، از `image generate --model <provider/model> --json` به‌عنوان محدودترین تست زنده CLI استفاده کنید. مثال:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  پاسخ JSON مقدارهای `ok`،‏ `provider`،‏ `model`،‏ `attempts` و مسیرهای خروجی نوشته‌شده را گزارش می‌کند. وقتی `--output` تنظیم شده باشد، پسوند نهایی ممکن است از نوع MIME بازگردانده‌شده توسط ارائه‌دهنده پیروی کند.

- برای `image describe` و `image describe-many`، از `--prompt` استفاده کنید تا به مدل بینایی دستورالعملی ویژه وظیفه بدهید، مانند OCR، مقایسه، بررسی UI یا زیرنویس‌نویسی کوتاه.
- برای مدل‌های بینایی محلی کند یا شروع سرد Ollama، از `--timeout-ms` استفاده کنید.
- برای `image describe`، مقدار `--model` باید یک `<provider/model>` دارای قابلیت تصویر باشد.
- برای مدل‌های بینایی محلی Ollama، ابتدا مدل را pull کنید و `OLLAMA_API_KEY` را روی هر مقدار placeholder، برای مثال `ollama-local`، تنظیم کنید. [Ollama](/fa/providers/ollama#vision-and-image-description) را ببینید.

## صدا

برای رونویسی فایل از `audio` استفاده کنید.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

یادداشت‌ها:

- `audio transcribe` برای رونویسی فایل است، نه مدیریت نشست بی‌درنگ.
- مقدار `--model` باید `<provider/model>` باشد.

## TTS

برای سنتز گفتار و وضعیت ارائه‌دهنده TTS از `tts` استفاده کنید.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

یادداشت‌ها:

- `tts status` به‌طور پیش‌فرض از Gateway استفاده می‌کند، چون وضعیت TTS مدیریت‌شده توسط Gateway را بازتاب می‌دهد.
- برای بررسی و پیکربندی رفتار TTS، از `tts providers`،‏ `tts voices` و `tts set-provider` استفاده کنید.

## ویدئو

برای تولید و توصیف از `video` استفاده کنید.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

یادداشت‌ها:

- `video generate` گزینه‌های `--size`،‏ `--aspect-ratio`،‏ `--resolution`،‏ `--duration`،‏ `--audio`،‏ `--watermark` و `--timeout-ms` را می‌پذیرد و آن‌ها را به runtime تولید ویدئو ارسال می‌کند.
- مقدار `--model` برای `video describe` باید `<provider/model>` باشد.

## وب

برای جریان‌های کاری جست‌وجو و واکشی از `web` استفاده کنید.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

یادداشت‌ها:

- برای بررسی ارائه‌دهندگان موجود، پیکربندی‌شده و انتخاب‌شده، از `web providers` استفاده کنید.

## Embedding

برای ایجاد بردار و بررسی ارائه‌دهنده embedding از `embedding` استفاده کنید.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## خروجی JSON

دستورهای infer خروجی JSON را زیر یک پوشش مشترک نرمال‌سازی می‌کنند:

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

برای دستورهای رسانه تولیدشده، `outputs` شامل فایل‌هایی است که OpenClaw نوشته است. برای خودکارسازی، به‌جای تحلیل stdout خوانا برای انسان، از `path`،‏ `mimeType`،‏ `size` و هر ابعاد ویژه رسانه در آن آرایه استفاده کنید.

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
