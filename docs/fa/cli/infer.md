---
read_when:
    - افزودن یا تغییر فرمان‌های `openclaw infer`
    - طراحی خودکارسازی پایدار قابلیت‌ها در حالت بدون رابط گرافیکی
summary: CLI با رویکرد استنتاج‌محور برای گردش‌کارهای مدل، تصویر، صدا، تبدیل متن به گفتار، ویدئو، وب و تعبیه‌سازی با پشتیبانی ارائه‌دهنده
title: CLI استنتاج
x-i18n:
    generated_at: "2026-07-12T09:47:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ec90377d3fb6049e63f5eb1dddfb085562982152b1b2ba7bd4e4d2535ab3c06f
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` سطح استاندارد بدون رابط گرافیکی برای استنتاج مبتنی بر ارائه‌دهنده است. این فرمان خانواده‌های قابلیت (`model`، `image`، `audio`، `tts`، `video`، `web`، `embedding`) را ارائه می‌کند، نه نام‌های خام RPC مربوط به Gateway یا شناسه‌های ابزار عامل. `openclaw capability ...` نام مستعار همین درخت فرمان است.

دلایل ترجیح آن به یک پوشش‌دهندهٔ یک‌باره برای ارائه‌دهنده:

- از ارائه‌دهندگان و مدل‌هایی که از قبل در OpenClaw پیکربندی شده‌اند، دوباره استفاده می‌کند.
- پوشش پایدار `--json` برای اسکریپت‌ها و خودکارسازی هدایت‌شده توسط عامل ارائه می‌دهد (به [خروجی JSON](#json-output) مراجعه کنید).
- برای بیشتر زیرفرمان‌ها، مسیر محلی معمول را بدون Gateway اجرا می‌کند.
- برای بررسی‌های سرتاسری ارائه‌دهنده، پیش از ارسال درخواست به ارائه‌دهنده، CLI منتشرشده، بارگذاری پیکربندی، تشخیص عامل پیش‌فرض، فعال‌سازی Pluginهای همراه و زمان‌اجرای مشترک قابلیت را به کار می‌گیرد.

## تبدیل infer به یک Skill

این متن را در یک عامل کپی و جای‌گذاری کنید:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

یک Skill مناسب مبتنی بر infer، مقاصد رایج کاربر را به زیرفرمان درست نگاشت می‌کند، برای هر گردش‌کار چند نمونهٔ استاندارد دارد، `openclaw infer ...` را به گزینه‌های سطح پایین‌تر ترجیح می‌دهد و کل سطح infer را دوباره در بدنهٔ Skill مستند نمی‌کند.

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
    personas
    status
    enable
    disable
    set-provider
    set-persona

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

`infer list` / `infer inspect --name <capability>` این درخت را به‌شکل داده نمایش می‌دهند (شناسهٔ قابلیت، روش‌های انتقال، توضیحات).

## کارهای رایج

| کار                           | فرمان                                                                                         | نکات                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| اجرای یک درخواست متنی/مدلی   | `openclaw infer model run --prompt "..." --json`                                              | به‌طور پیش‌فرض محلی است                                     |
| اجرای درخواست مدل روی تصاویر | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | برای چند تصویر، `--file` را تکرار کنید                      |
| تولید تصویر                   | `openclaw infer image generate --prompt "..." --json`                                         | هنگام شروع از فایلی موجود، از `image edit` استفاده کنید     |
| توصیف فایل تصویر یا نشانی URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` باید یک `<provider/model>` با قابلیت تصویر باشد   |
| رونویسی صوت                   | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` باید به‌شکل `<provider/model>` باشد               |
| تولید گفتار                   | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` فقط از طریق Gateway اجرا می‌شود                |
| تولید ویدئو                   | `openclaw infer video generate --prompt "..." --json`                                         | از راهنماهای ارائه‌دهنده مانند `--resolution` پشتیبانی می‌کند |
| توصیف فایل ویدئو              | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` باید به‌شکل `<provider/model>` باشد               |
| جست‌وجوی وب                   | `openclaw infer web search --query "..." --json`                                              |                                                             |
| دریافت یک صفحهٔ وب            | `openclaw infer web fetch --url https://example.com --json`                                   |                                                             |
| ایجاد بردارهای تعبیه          | `openclaw infer embedding create --text "..." --json`                                         |                                                             |

## رفتار

- وقتی خروجی به فرمان یا اسکریپت دیگری داده می‌شود، از `--json` استفاده کنید؛ در غیر این صورت، از خروجی متنی استفاده کنید.
- برای ثابت‌کردن یک پشتیبان مشخص، از `--provider` یا `--model provider/model` استفاده کنید.
- برای بازنویسی یک‌بارهٔ سطح تفکر/استدلال، از `model run --thinking <level>` استفاده کنید: `off`، `minimal`، `low`، `medium`، `high`، `adaptive`، `xhigh` یا `max`.
- برای `image describe`، `audio transcribe` و `video describe`، مقدار `--model` باید به‌شکل `<provider/model>` باشد.
- برای `image describe`، گزینهٔ `--file` مسیرهای محلی و نشانی‌های HTTP(S) را می‌پذیرد؛ نشانی‌های راه‌دور از سیاست عادی SSRF برای دریافت رسانه عبور می‌کنند.
- فرمان‌های اجرای بدون حالت (`model run`، `image *`، `audio *`، `video *`، `web *`، `embedding *`) به‌طور پیش‌فرض محلی‌اند. فرمان‌های حالت مدیریت‌شده توسط Gateway (`tts status`) به‌طور پیش‌فرض از Gateway استفاده می‌کنند.
- مسیر محلی هرگز به در حال اجرا بودن Gateway نیاز ندارد.
- `model run` محلی یک تکمیل یک‌باره و سبک توسط ارائه‌دهنده است: مدل و احراز هویت پیکربندی‌شدهٔ عامل را تشخیص می‌دهد، اما نوبت عامل گفت‌وگو را آغاز نمی‌کند، ابزارها را بارگذاری نمی‌کند و سرورهای MCP همراه را باز نمی‌کند.
- `model run --file` فایل‌های تصویر را با نوع MIME که خودکار تشخیص داده می‌شود به درخواست پیوست می‌کند؛ برای چند تصویر، `--file` را تکرار کنید. فایل‌های غیرتصویری رد می‌شوند — به‌جای آن از `infer audio transcribe` یا `infer video describe` استفاده کنید.
- `model run --gateway` مسیریابی Gateway، احراز هویت ذخیره‌شده، انتخاب ارائه‌دهنده و زمان‌اجرای تعبیه‌شده را به کار می‌گیرد، اما همچنان یک کاوش خام مدل باقی می‌ماند: بدون رونوشت نشست قبلی، زمینهٔ راه‌اندازی/AGENTS، ابزارها یا سرورهای MCP همراه.
- `model run --gateway --model <provider/model>` به اعتبارنامهٔ Gateway متعلق به یک گردانندهٔ مورداعتماد نیاز دارد، زیرا از Gateway می‌خواهد یک بازنویسی یک‌بارهٔ ارائه‌دهنده/مدل را اجرا کند.

## مدل

استنتاج متن و بررسی مدل/ارائه‌دهنده.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

برای آزمایش سریع یک ارائه‌دهنده بدون راه‌اندازی Gateway یا بارگذاری سطح ابزار عامل، از ارجاع‌های کامل `<provider/model>` همراه با `--local` استفاده کنید:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

نکات:

- `model run` محلی محدودترین آزمایش سریع CLI برای سلامت ارائه‌دهنده/مدل/احراز هویت است: برای ارائه‌دهندگان غیر از ChatGPT-Codex، فقط درخواست ارائه‌شده را ارسال می‌کند.
- `model run --model <provider/model>` محلی می‌تواند پیش از نوشته‌شدن ارائه‌دهنده در پیکربندی، ردیف‌های دقیق کاتالوگ ایستای همراه را تشخیص دهد (همان ردیف‌هایی که `openclaw models list --all` نمایش می‌دهد). احراز هویت ارائه‌دهنده همچنان الزامی است؛ نبود اعتبارنامه به‌عنوان خطای احراز هویت شکست می‌خورد، نه `Unknown model`.
- برای کاوش‌های استدلالی Mistral Medium 3.5، دما را تنظیم‌نشده/پیش‌فرض باقی بگذارید. Mistral مقدار `reasoning_effort="high"` را با `temperature: 0` رد می‌کند؛ از دمای پیش‌فرض یا مقداری غیرصفر مانند `0.7` استفاده کنید.
- کاوش‌های محلی OAuth مربوط به OpenAI ChatGPT/Codex (API‏ `openai-chatgpt-responses`) یک دستور سیستمی حداقلی اضافه می‌کنند تا روش انتقال بتواند فیلد الزامی `instructions` را پر کند — بدون زمینهٔ کامل عامل، ابزارها، حافظه یا رونوشت نشست.
- `model run --file` محتوای تصویر را مستقیماً به پیام منفرد کاربر پیوست می‌کند. قالب‌های رایج (PNG، JPEG، WebP) هنگامی کار می‌کنند که نوع MIME به‌صورت `image/*` تشخیص داده شود؛ فایل‌های پشتیبانی‌نشده یا ناشناخته پیش از فراخوانی ارائه‌دهنده با شکست مواجه می‌شوند. اگر به‌جای کاوش مستقیم یک مدل چندوجهی، مسیریابی و جایگزین‌های مدل تصویر OpenClaw را می‌خواهید، از `infer image describe` استفاده کنید.
- مدل انتخاب‌شده باید از ورودی تصویر پشتیبانی کند؛ مدل‌های فقط‌متنی ممکن است درخواست را در لایهٔ ارائه‌دهنده رد کنند.
- `model run --prompt` باید حاوی متنی غیر از فاصلهٔ خالی باشد؛ درخواست‌های خالی پیش از هرگونه فراخوانی ارائه‌دهنده یا Gateway رد می‌شوند.
- وقتی ارائه‌دهنده هیچ خروجی متنی برنمی‌گرداند، `model run` محلی با کد غیرصفر خارج می‌شود تا ارائه‌دهندگان دسترس‌ناپذیر و تکمیل‌های خالی مانند کاوش‌های موفق به نظر نرسند.
- برای آزمایش مسیریابی Gateway یا راه‌اندازی زمان‌اجرای عامل، درحالی‌که ورودی مدل خام باقی می‌ماند، از `model run --gateway` استفاده کنید. برای زمینهٔ کامل عامل، ابزارها، حافظه و رونوشت نشست، از `openclaw agent` یا یک سطح گفت‌وگو استفاده کنید.
- `--thinking adaptive` به سطح `medium` در زمان‌اجرای تکمیل نگاشت می‌شود؛ `--thinking max` برای مدل‌های OpenAI که از حداکثر تلاش بومی پشتیبانی می‌کنند به `max` و در غیر این صورت به `xhigh` نگاشت می‌شود.
- `model auth login`، `model auth logout` و `model auth status` حالت ذخیره‌شدهٔ احراز هویت ارائه‌دهنده را مدیریت می‌کنند.

## تصویر

تولید، ویرایش و توصیف.

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

نکات:

- هنگام شروع از فایل‌های ورودی موجود، از `image edit` استفاده کنید؛ `--size`، `--aspect-ratio` یا `--resolution` در ارائه‌دهندگان/مدل‌هایی که از آن‌ها پشتیبانی می‌کنند، راهنمای هندسی اضافه می‌کنند.
- استفاده از `--output-format png --background transparent` همراه با `--model openai/gpt-image-1.5` خروجی PNG با پس‌زمینه شفاف از OpenAI ایجاد می‌کند؛ `--openai-background` نام مستعار مختص OpenAI برای همین راهنما است. ارائه‌دهندگانی که پشتیبانی از پس‌زمینه را اعلام نمی‌کنند، آن را به‌عنوان بازنویسی نادیده‌گرفته‌شده گزارش می‌کنند (`ignoredOverrides` را در [پوشش JSON](#json-output) ببینید).
- گزینه `--quality low|medium|high|auto` برای ارائه‌دهندگانی که از راهنمای کیفیت تصویر پشتیبانی می‌کنند، از جمله OpenAI، کار می‌کند. OpenAI همچنین `--openai-moderation low|auto` را می‌پذیرد.
- دستور `image providers --json` فهرست می‌کند که کدام ارائه‌دهندگان تصویر همراه، قابل کشف، پیکربندی‌شده و انتخاب‌شده هستند و هرکدام چه قابلیت‌هایی برای تولید/ویرایش ارائه می‌کنند.
- دستور `image generate --model <provider/model> --json` محدودترین آزمون زنده سریع برای تغییرات تولید تصویر است:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  پاسخ، `ok`، `provider`، `model`، `attempts` و مسیرهای خروجی نوشته‌شده را گزارش می‌کند. وقتی `--output` تنظیم شده باشد، پسوند نهایی ممکن است از نوع MIME بازگردانده‌شده توسط ارائه‌دهنده پیروی کند.

- برای `image describe` و `image describe-many`، از `--prompt` برای دستور ویژه کار استفاده کنید (OCR، مقایسه، بررسی رابط کاربری، زیرنویس‌نویسی مختصر).
- برای مدل‌های بینایی محلی کند یا راه‌اندازی سرد Ollama، از `--timeout-ms` استفاده کنید.
- برای `image describe`، یک `--model` صریح (که باید یک `<provider/model>` دارای قابلیت تصویر باشد) ابتدا اجرا می‌شود و اگر آن فراخوانی ناموفق باشد، سپس گزینه‌های پیکربندی‌شده در `agents.defaults.imageModel.fallbacks` امتحان می‌شوند. خطاهای آماده‌سازی ورودی (فایل مفقود، URL پشتیبانی‌نشده) پیش از هر تلاش جایگزین باعث شکست می‌شوند و مدل باید در کاتالوگ مدل یا پیکربندی ارائه‌دهنده دارای قابلیت تصویر باشد.
- برای مدل‌های بینایی محلی Ollama، ابتدا مدل را دریافت کنید و `OLLAMA_API_KEY` را روی هر مقدار جای‌نگهدار، برای مثال `ollama-local`، تنظیم کنید. [Ollama](/fa/providers/ollama#vision-and-image-description) را ببینید.

## صوت

رونویسی فایل (نه مدیریت نشست بلادرنگ).

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` باید به‌شکل `<provider/model>` باشد.

## TTS

ترکیب گفتار و وضعیت ارائه‌دهنده/پرسونای TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

نکته‌ها:

- `tts status` فقط از `--gateway` پشتیبانی می‌کند (وضعیت TTS مدیریت‌شده توسط Gateway را منعکس می‌کند).
- برای بررسی و پیکربندی رفتار TTS، از `tts providers`، `tts voices`، `tts personas`، `tts set-provider` و `tts set-persona` استفاده کنید.

## ویدئو

تولید و توصیف.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

نکته‌ها:

- `video generate` گزینه‌های `--size`، `--aspect-ratio`، `--resolution`، `--duration`، `--audio`، `--watermark` و `--timeout-ms` را می‌پذیرد و آن‌ها را به زمان‌اجرای تولید ویدئو ارسال می‌کند.
- برای `video describe`، گزینه `--model` باید به‌شکل `<provider/model>` باشد.

## وب

جست‌وجو و واکشی.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` ارائه‌دهندگان موجود، پیکربندی‌شده و انتخاب‌شده برای جست‌وجو و واکشی را فهرست می‌کند.

## تعبیه‌سازی

ایجاد بردار و بررسی ارائه‌دهنده تعبیه‌سازی.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## خروجی JSON

فرمان‌های Infer خروجی JSON را در یک پوشش مشترک یکسان‌سازی می‌کنند:

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

فیلدهای پایدار سطح بالا:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `inputs` (پیوست‌های تصویری ارسال‌شده همراه درخواست، در صورت کاربرد)
- `outputs`
- `ignoredOverrides` (کلیدهای راهنمایی که ارائه‌دهنده از آن‌ها پشتیبانی نمی‌کند، در صورت کاربرد)
- `error`

برای فرمان‌های رسانه تولیدشده، `outputs` شامل فایل‌هایی است که OpenClaw نوشته است. برای خودکارسازی، به‌جای تجزیه خروجی استاندارد خوانا برای انسان، از `path`، `mimeType`، `size` و هرگونه ابعاد ویژه رسانه در آن آرایه استفاده کنید.

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

## مرتبط

- [مرجع CLI](/fa/cli)
- [مدل‌ها](/fa/concepts/models)
