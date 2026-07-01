---
read_when:
    - افزودن یا تغییر دادن دستورهای `openclaw infer`
    - طراحی خودکارسازی پایدار قابلیت‌های بدون رابط گرافیکی
summary: CLI مبتنی بر استنتاج برای گردش‌کارهای مدل، تصویر، صدا، TTS، ویدئو، وب و embedding با پشتیبانی ارائه‌دهنده
title: CLI استنتاج
x-i18n:
    generated_at: "2026-07-01T08:21:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb63996dd1364bffba58d4b132849ac4157fb612555c009da795c963142f9368
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` سطح canonical headless برای workflowهای استنتاج پشتیبانی‌شده توسط ارائه‌دهنده است.

این فرمان عمدا خانواده‌های capability را نمایش می‌دهد، نه نام‌های خام RPC در Gateway و نه شناسه‌های خام ابزار agent.

## تبدیل infer به یک مهارت

این را در یک agent کپی و جای‌گذاری کنید:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

یک مهارت خوب مبتنی بر infer باید:

- intentهای رایج کاربر را به subcommand درست infer نگاشت کند
- چند نمونه canonical از infer برای workflowهایی که پوشش می‌دهد داشته باشد
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

`openclaw infer` یک CLI یکپارچه برای وظایف استنتاج پشتیبانی‌شده توسط ارائه‌دهنده در OpenClaw فراهم می‌کند.

مزایا:

- به‌جای ساخت wrapperهای موردی برای هر backend، از ارائه‌دهنده‌ها و مدل‌هایی استفاده کنید که از قبل در OpenClaw پیکربندی شده‌اند.
- workflowهای مدل، تصویر، رونویسی صوتی، TTS، ویدئو، وب، و embedding را زیر یک درخت فرمان نگه دارید.
- برای اسکریپت‌ها، automation، و workflowهای agent-driven از شکل خروجی پایدار `--json` استفاده کنید.
- وقتی وظیفه اساسا «اجرای استنتاج» است، یک سطح first-party در OpenClaw را ترجیح دهید.
- برای بیشتر فرمان‌های infer از مسیر محلی معمول بدون نیاز به Gateway استفاده کنید.

برای بررسی‌های end-to-end ارائه‌دهنده، وقتی تست‌های سطح پایین‌تر ارائه‌دهنده سبز شدند، `openclaw infer ...` را ترجیح دهید. این کار CLI منتشرشده، بارگذاری config، تشخیص default-agent، فعال‌سازی Pluginهای bundled، و runtime مشترک capability را پیش از انجام درخواست ارائه‌دهنده تمرین می‌دهد.

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

| وظیفه                         | فرمان                                                                                         | یادداشت‌ها                                            |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| اجرای یک prompt متنی/مدلی     | `openclaw infer model run --prompt "..." --json`                                              | به‌صورت پیش‌فرض از مسیر محلی معمول استفاده می‌کند    |
| اجرای prompt مدل روی تصویرها  | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | برای چند ورودی تصویر، `--file` را تکرار کنید         |
| تولید یک تصویر                | `openclaw infer image generate --prompt "..." --json`                                         | هنگام شروع از یک فایل موجود، از `image edit` استفاده کنید |
| توصیف یک فایل تصویر یا URL    | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` باید یک `<provider/model>` دارای قابلیت تصویر باشد |
| رونویسی صدا                   | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` باید `<provider/model>` باشد                |
| ساخت گفتار                    | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` مبتنی بر Gateway است                     |
| تولید یک ویدئو                | `openclaw infer video generate --prompt "..." --json`                                         | از hintهای ارائه‌دهنده مانند `--resolution` پشتیبانی می‌کند |
| توصیف یک فایل ویدئو           | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` باید `<provider/model>` باشد                |
| جست‌وجوی وب                   | `openclaw infer web search --query "..." --json`                                              |                                                       |
| دریافت یک صفحه وب             | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| ایجاد embeddingها             | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## رفتار

- `openclaw infer ...` سطح CLI اصلی برای این workflowها است.
- وقتی خروجی قرار است توسط فرمان یا اسکریپت دیگری مصرف شود، از `--json` استفاده کنید.
- وقتی backend مشخصی لازم است، از `--provider` یا `--model provider/model` استفاده کنید.
- برای پاس دادن یک سطح thinking/reasoning تک‌مرحله‌ای (`off`، `minimal`، `low`، `medium`، `high`، `adaptive`، `xhigh`، یا `max`) در حالی که اجرا raw باقی می‌ماند، از `model run --thinking <level>` استفاده کنید.
- برای `image describe`، `audio transcribe`، و `video describe`، `--model` باید از شکل `<provider/model>` استفاده کند.
- برای `image describe`، گزینه `--file` مسیرهای محلی و URLهای تصویر HTTP(S) را می‌پذیرد. URLهای remote از سیاست معمول SSRF برای media-fetch استفاده می‌کنند.
- برای `image describe`، یک `--model` صریح ابتدا آن ارائه‌دهنده/مدل را اجرا می‌کند، سپس وقتی فراخوانی مدل ناموفق شود، `agents.defaults.imageModel.fallbacks` پیکربندی‌شده را امتحان می‌کند. خطاهای آماده‌سازی ورودی، مانند فایل‌های مفقود یا URLهای پشتیبانی‌نشده، پیش از تلاش‌های fallback شکست می‌خورند. مدل باید در catalog مدل یا config ارائه‌دهنده دارای قابلیت تصویر باشد. `codex/<model>` یک turn محدود از درک تصویر در app-server مربوط به Codex اجرا می‌کند؛ `openai/<model>` از مسیر ارائه‌دهنده OpenAI با احراز هویت API-key یا ChatGPT/Codex OAuth استفاده می‌کند.
- فرمان‌های اجرای stateless به‌صورت پیش‌فرض local هستند.
- فرمان‌های state مدیریت‌شده توسط Gateway به‌صورت پیش‌فرض gateway هستند.
- مسیر محلی معمول نیاز ندارد Gateway در حال اجرا باشد.
- `model run` محلی یک provider completion سبک و تک‌مرحله‌ای است. مدل agent و auth پیکربندی‌شده را resolve می‌کند، اما turn مربوط به chat-agent را شروع نمی‌کند، ابزارها را بارگذاری نمی‌کند، یا سرورهای MCP bundled را باز نمی‌کند.
- `model run --file` فایل‌های تصویر را می‌پذیرد، نوع MIME آن‌ها را تشخیص می‌دهد، و آن‌ها را همراه با prompt ارائه‌شده به مدل انتخاب‌شده ارسال می‌کند. برای چند تصویر، `--file` را تکرار کنید.
- `model run --file` ورودی‌های غیرتصویری را رد می‌کند. برای فایل‌های صوتی از `infer audio transcribe` و برای فایل‌های ویدئویی از `infer video describe` استفاده کنید.
- `model run --gateway` routing مربوط به Gateway، auth ذخیره‌شده، انتخاب ارائه‌دهنده، و runtime تعبیه‌شده را تمرین می‌دهد، اما همچنان به‌عنوان یک probe خام مدل اجرا می‌شود: prompt ارائه‌شده و هر attachment تصویری را بدون transcript قبلی session، context مربوط به bootstrap/AGENTS، assembly موتور context، ابزارها، یا سرورهای MCP bundled ارسال می‌کند.
- `model run --gateway --model <provider/model>` به credential معتبر Gateway برای operator نیاز دارد، چون درخواست از Gateway می‌خواهد یک override موردی ارائه‌دهنده/مدل را اجرا کند.
- `model run --thinking` محلی از مسیر lean provider-completion استفاده می‌کند؛ سطح‌های خاص ارائه‌دهنده مانند `adaptive` و `max` به نزدیک‌ترین سطح portable در simple-completion نگاشت می‌شوند.

## مدل

از `model` برای استنتاج متن پشتیبانی‌شده توسط ارائه‌دهنده و بازرسی مدل/ارائه‌دهنده استفاده کنید.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

برای smoke-test یک ارائه‌دهنده مشخص بدون شروع Gateway یا بارگذاری سطح کامل ابزار agent، از refهای کامل `<provider/model>` استفاده کنید:

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

یادداشت‌ها:

- `model run` محلی باریک‌ترین smoke مربوط به CLI برای سلامت ارائه‌دهنده/مدل/auth است، چون برای ارائه‌دهنده‌های غیر Codex، فقط prompt ارائه‌شده را به مدل انتخاب‌شده ارسال می‌کند.
- `model run --model <provider/model>` محلی می‌تواند پیش از نوشته شدن آن ارائه‌دهنده در config از rowهای دقیق static catalog bundled در `models list --all` استفاده کند. auth ارائه‌دهنده همچنان لازم است؛ credentialهای مفقود به‌عنوان خطای auth شکست می‌خورند، نه `Unknown model`.
- برای probeهای reasoning در Mistral Medium 3.5، temperature را تنظیم‌نشده/پیش‌فرض بگذارید. Mistral ترکیب `reasoning_effort="high"` با `temperature: 0` را رد می‌کند؛ از `mistral/mistral-medium-3-5` با temperature پیش‌فرض یا یک مقدار reasoning-mode غیرصفر مانند `0.7` استفاده کنید.
- probeهای محلی Codex Responses استثنای محدود هستند: OpenClaw یک دستور system حداقلی اضافه می‌کند تا transport بتواند فیلد الزامی `instructions` خود را پر کند، بدون اینکه context کامل agent، ابزارها، memory، یا transcript session را اضافه کند.
- `model run --file` محلی همان مسیر lean را حفظ می‌کند و محتوای تصویر را مستقیم به یک پیام user واحد attach می‌کند. فایل‌های تصویر رایج مانند PNG، JPEG، و WebP وقتی نوع MIME آن‌ها به‌عنوان `image/*` تشخیص داده شود کار می‌کنند؛ فایل‌های پشتیبانی‌نشده یا ناشناخته پیش از فراخوانی ارائه‌دهنده شکست می‌خورند.
- `model run --file` وقتی بهترین گزینه است که می‌خواهید مدل متنی چندوجهی انتخاب‌شده را مستقیم تست کنید. وقتی می‌خواهید انتخاب ارائه‌دهنده image-understanding در OpenClaw و routing پیش‌فرض image-model را داشته باشید، از `infer image describe` استفاده کنید.
- مدل انتخاب‌شده باید از ورودی تصویر پشتیبانی کند؛ مدل‌های فقط متنی ممکن است درخواست را در لایه ارائه‌دهنده رد کنند.
- `model run --prompt` باید متن غیر whitespace داشته باشد؛ promptهای خالی پیش از فراخوانی ارائه‌دهنده‌های محلی یا Gateway رد می‌شوند.
- وقتی ارائه‌دهنده هیچ خروجی متنی برنگرداند، `model run` محلی با کد غیرصفر خارج می‌شود، تا ارائه‌دهنده‌های محلی غیرقابل دسترس و completionهای خالی شبیه probeهای موفق به نظر نرسند.
- وقتی نیاز دارید routing مربوط به Gateway، setup مربوط به agent-runtime، یا state ارائه‌دهنده مدیریت‌شده توسط Gateway را تست کنید و در عین حال ورودی مدل را raw نگه دارید، از `model run --gateway` استفاده کنید. وقتی context کامل agent، ابزارها، memory، و transcript session را می‌خواهید، از `openclaw agent` یا سطوح chat استفاده کنید.
- `model auth login`، `model auth logout`، و `model auth status` state ذخیره‌شده auth ارائه‌دهنده را مدیریت می‌کنند.

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

- وقتی از فایل‌های ورودی موجود شروع می‌کنید، از `image edit` استفاده کنید.
- برای ارائه‌دهنده‌ها/مدل‌هایی که در ویرایش‌های تصویر مرجع از راهنمایی‌های هندسی پشتیبانی می‌کنند،
  از `--size`، `--aspect-ratio` یا `--resolution` همراه با `image edit` استفاده کنید.
- برای خروجی PNG شفاف OpenAI، از `--output-format png --background transparent` همراه با
  `--model openai/gpt-image-1.5` استفاده کنید؛
  `--openai-background` همچنان به‌عنوان نام مستعار اختصاصی OpenAI در دسترس است. ارائه‌دهنده‌هایی
  که پشتیبانی از پس‌زمینه را اعلام نمی‌کنند، این راهنما را به‌عنوان بازنویسی نادیده‌گرفته‌شده گزارش می‌کنند.
- برای ارائه‌دهنده‌هایی که از راهنمایی‌های کیفیت تصویر پشتیبانی می‌کنند، از جمله OpenAI، از
  `--quality low|medium|high|auto` استفاده کنید. OpenAI همچنین `--openai-moderation low|auto` را برای
  راهنمایی اختصاصی تعدیل محتوای ارائه‌دهنده می‌پذیرد.
- برای بررسی اینکه کدام ارائه‌دهنده‌های تصویر همراه قابل کشف، پیکربندی‌شده و انتخاب‌شده هستند و هر
  ارائه‌دهنده کدام قابلیت‌های تولید/ویرایش را ارائه می‌کند، از `image providers --json` استفاده کنید.
- برای باریک‌ترین دودآزمایی زنده CLI مربوط به تغییرات تولید تصویر، از
  `image generate --model <provider/model> --json` استفاده کنید. نمونه:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  پاسخ JSON مقدارهای `ok`، `provider`، `model`، `attempts` و مسیرهای خروجی نوشته‌شده را گزارش می‌کند.
  وقتی `--output` تنظیم شده باشد، پسوند نهایی ممکن است از نوع MIME برگشتی ارائه‌دهنده پیروی کند.

- برای `image describe` و `image describe-many`، از `--prompt` استفاده کنید تا به مدل بینایی دستور مختص کار بدهید؛ مانند OCR، مقایسه، بررسی UI یا زیرنویس‌سازی کوتاه.
- با مدل‌های بینایی محلی کند یا شروع سرد Ollama، از `--timeout-ms` استفاده کنید.
- برای `image describe`، مقدار `--model` باید یک `<provider/model>` دارای قابلیت تصویر باشد.
  وقتی تنظیم شود، OpenClaw ابتدا همان مدل صریح را امتحان می‌کند و سپس، اگر فراخوانی مدل شکست بخورد،
  از جایگزین‌های پیکربندی‌شده مدل تصویر استفاده می‌کند.
- برای مدل‌های بینایی محلی Ollama، ابتدا مدل را pull کنید و `OLLAMA_API_KEY` را روی هر مقدار جانگهدار تنظیم کنید، برای مثال `ollama-local`. [Ollama](/fa/providers/ollama#vision-and-image-description) را ببینید.

## صدا

برای رونویسی فایل از `audio` استفاده کنید.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

یادداشت‌ها:

- `audio transcribe` برای رونویسی فایل است، نه مدیریت نشست بلادرنگ.
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

- پیش‌فرض `tts status` برابر Gateway است، زیرا وضعیت TTS مدیریت‌شده توسط Gateway را بازتاب می‌دهد.
- برای بررسی و پیکربندی رفتار TTS، از `tts providers`، `tts voices` و `tts set-provider` استفاده کنید.

## ویدئو

برای تولید و توصیف از `video` استفاده کنید.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

یادداشت‌ها:

- `video generate` گزینه‌های `--size`، `--aspect-ratio`، `--resolution`، `--duration`، `--audio`، `--watermark` و `--timeout-ms` را می‌پذیرد و آن‌ها را به زمان‌اجرای تولید ویدئو ارسال می‌کند.
- برای `video describe`، مقدار `--model` باید `<provider/model>` باشد.

## وب

برای جریان‌های کاری جست‌وجو و دریافت، از `web` استفاده کنید.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

یادداشت‌ها:

- برای بررسی ارائه‌دهنده‌های در دسترس، پیکربندی‌شده و انتخاب‌شده، از `web providers` استفاده کنید.

## جاسازی

برای ساخت بردار و بررسی ارائه‌دهنده جاسازی، از `embedding` استفاده کنید.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## خروجی JSON

فرمان‌های infer خروجی JSON را زیر یک پوشش مشترک نرمال‌سازی می‌کنند:

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

برای فرمان‌های رسانه تولیدشده، `outputs` شامل فایل‌هایی است که OpenClaw نوشته است. برای
خودکارسازی، به‌جای تجزیه stdout خوانا برای انسان، از `path`، `mimeType`، `size` و هر بُعد
اختصاصی رسانه در آن آرایه استفاده کنید.

## دام‌های رایج

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

- `openclaw capability ...` نام مستعاری برای `openclaw infer ...` است.

## مرتبط

- [مرجع CLI](/fa/cli)
- [مدل‌ها](/fa/concepts/models)
