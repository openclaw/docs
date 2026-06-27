---
read_when:
    - تولید ویدیوها از طریق عامل
    - پیکربندی ارائه‌دهندگان و مدل‌های تولید ویدئو
    - درک پارامترهای ابزار video_generate
sidebarTitle: Video generation
summary: ویدیوها را از طریق video_generate از متن، تصویر یا ارجاعات ویدیویی در ۱۶ بک‌اند ارائه‌دهنده تولید کنید
title: تولید ویدیو
x-i18n:
    generated_at: "2026-06-27T19:06:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64c8a3191262613a1acf684496570a6dd8893ebb3a2a7e5ae41337d58555c401
    source_path: tools/video-generation.md
    workflow: 16
---

عامل‌های OpenClaw می‌توانند از اعلان‌های متنی، تصاویر مرجع، یا
ویدیوهای موجود، ویدیو تولید کنند. شانزده بک‌اند ارائه‌دهنده پشتیبانی می‌شوند
که هر کدام گزینه‌های مدل، حالت‌های ورودی، و مجموعه قابلیت‌های متفاوتی دارند.
عامل بر اساس پیکربندی و کلیدهای API موجود شما، ارائه‌دهنده مناسب را
به‌صورت خودکار انتخاب می‌کند.

<Note>
ابزار `video_generate` فقط زمانی ظاهر می‌شود که دست‌کم یک ارائه‌دهنده
تولید ویدیو در دسترس باشد. اگر آن را در ابزارهای عامل خود نمی‌بینید، یک
کلید API ارائه‌دهنده تنظیم کنید یا `agents.defaults.videoGenerationModel` را پیکربندی کنید.
</Note>

OpenClaw تولید ویدیو را به‌عنوان سه حالت زمان اجرا در نظر می‌گیرد:

- `generate` - درخواست‌های متن به ویدیو بدون رسانه مرجع.
- `imageToVideo` - درخواست شامل یک یا چند تصویر مرجع است.
- `videoToVideo` - درخواست شامل یک یا چند ویدیوی مرجع است.

ارائه‌دهندگان می‌توانند هر زیرمجموعه‌ای از این حالت‌ها را پشتیبانی کنند. ابزار،
حالت فعال را پیش از ارسال اعتبارسنجی می‌کند و حالت‌های پشتیبانی‌شده را در `action=list` گزارش می‌دهد.

## شروع سریع

<Steps>
  <Step title="پیکربندی احراز هویت">
    برای هر ارائه‌دهنده پشتیبانی‌شده یک کلید API تنظیم کنید:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="انتخاب یک مدل پیش‌فرض (اختیاری)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="درخواست از عامل">
    > یک ویدیوی سینمایی ۵ ثانیه‌ای از یک خرچنگ دریایی دوست‌داشتنی که هنگام غروب موج‌سواری می‌کند تولید کن.

    عامل به‌صورت خودکار `video_generate` را فراخوانی می‌کند. نیازی به
    allowlist کردن ابزار نیست.

  </Step>
</Steps>

## تولید ناهمگام چگونه کار می‌کند

تولید ویدیو ناهمگام است. وقتی عامل در یک نشست `video_generate` را فراخوانی می‌کند:

1. OpenClaw درخواست را به ارائه‌دهنده ارسال می‌کند و بلافاصله یک شناسه وظیفه برمی‌گرداند.
2. ارائه‌دهنده کار را در پس‌زمینه پردازش می‌کند (معمولاً از ۳۰ ثانیه تا چند دقیقه بسته به ارائه‌دهنده و وضوح؛ ارائه‌دهندگان کندِ متکی به صف می‌توانند تا زمان‌پایان پیکربندی‌شده اجرا شوند).
3. وقتی ویدیو آماده شد، OpenClaw همان نشست را با یک رویداد تکمیل داخلی بیدار می‌کند.
4. عامل از طریق حالت پاسخ قابل‌مشاهده عادی نشست به کاربر اطلاع می‌دهد:
   تحویل پاسخ نهایی در حالت خودکار، یا `message(action="send")` وقتی
   نشست به ابزار پیام نیاز دارد. اگر نشست درخواست‌کننده غیرفعال باشد یا
   بیدارسازی فعال آن شکست بخورد، و بخشی از ویدیوی تولیدشده همچنان در
   پاسخ تکمیل وجود نداشته باشد، OpenClaw یک fallback مستقیم idempotent فقط با
   ویدیوی گم‌شده ارسال می‌کند.

وقتی کاری در حال اجراست، فراخوانی‌های تکراری `video_generate` در همان
نشست به‌جای شروع یک تولید دیگر، وضعیت وظیفه فعلی را برمی‌گردانند.
برای بررسی پیشرفت از CLI، از `openclaw tasks list` یا `openclaw tasks show <taskId>` استفاده کنید.

خارج از اجراهای عاملِ پشتیبانی‌شده توسط نشست (برای مثال، فراخوانی مستقیم ابزار)،
ابزار به تولید inline برمی‌گردد و مسیر رسانه نهایی را در همان نوبت برمی‌گرداند.

وقتی ارائه‌دهنده بایت برمی‌گرداند، فایل‌های ویدیوی تولیدشده زیر فضای ذخیره‌سازی
رسانه مدیریت‌شده توسط OpenClaw ذخیره می‌شوند. سقف پیش‌فرض ذخیره ویدیوی تولیدشده
از محدودیت رسانه ویدیویی پیروی می‌کند، و `agents.defaults.mediaMaxMb` آن را برای
رندرهای بزرگ‌تر افزایش می‌دهد. وقتی ارائه‌دهنده یک URL خروجی میزبانی‌شده نیز
برمی‌گرداند، اگر پایداری محلی یک فایل بیش‌ازحد بزرگ را رد کند، OpenClaw می‌تواند
به‌جای شکست دادن وظیفه، آن URL را تحویل دهد.

### چرخه عمر وظیفه

| وضعیت       | معنی                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | وظیفه ایجاد شده و منتظر پذیرش توسط ارائه‌دهنده است.                                                   |
| `running`   | ارائه‌دهنده در حال پردازش است (معمولاً از ۳۰ ثانیه تا چند دقیقه بسته به ارائه‌دهنده و وضوح). |
| `succeeded` | ویدیو آماده است؛ عامل بیدار می‌شود و آن را در گفتگو ارسال می‌کند.                                         |
| `failed`    | خطای ارائه‌دهنده یا زمان‌پایان؛ عامل با جزئیات خطا بیدار می‌شود.                                         |

وضعیت را از CLI بررسی کنید:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

اگر یک وظیفه ویدیو برای نشست فعلی از قبل در وضعیت `queued` یا `running` باشد،
`video_generate` به‌جای شروع یک وظیفه جدید، وضعیت وظیفه موجود را برمی‌گرداند.
برای بررسی صریح بدون راه‌اندازی تولید جدید، از `action: "status"` استفاده کنید.

## ارائه‌دهندگان پشتیبانی‌شده

| ارائه‌دهنده              | مدل پیش‌فرض                   | متن | مرجع تصویر                                            | مرجع ویدیو                                       | احراز هویت                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | بله (URL راه‌دور)                                     | بله (URL راه‌دور)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | تا ۲ تصویر (فقط مدل‌های I2V؛ فریم اول + آخر) | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | تا ۲ تصویر (فریم اول + آخر از طریق role)         | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | تا ۹ تصویر مرجع                             | تا ۳ ویدیو                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | ۱ تصویر                                              | -                                               | `COMFY_API_KEY` یا `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | ۱ تصویر؛ تا ۹ تصویر با Seedance reference-to-video    | تا ۳ ویدیو با Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | ۱ تصویر                                              | ۱ ویدیو                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | ۱ تصویر                                              | -                                               | `MINIMAX_API_KEY` یا MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | ۱ تصویر                                              | ۱ ویدیو                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | تا ۴ تصویر (فریم اول/آخر یا مراجع)      | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | بله (URL راه‌دور)                                     | بله (URL راه‌دور)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | ۱ تصویر                                              | ۱ ویدیو                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | فقط `Wan-AI/Wan2.2-I2V-A14B`                        | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | ۱ تصویر (`kling`)                                    | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | ۱ تصویر فریم اول یا تا ۷ `reference_image`    | ۱ ویدیو                                         | `XAI_API_KEY`                            |

برخی ارائه‌دهندگان متغیرهای محیطی کلید API اضافی یا جایگزین را می‌پذیرند. برای جزئیات،
صفحه‌های [ارائه‌دهنده](#related) جداگانه را ببینید.

برای بررسی ارائه‌دهندگان، مدل‌ها، و حالت‌های زمان اجرا در زمان اجرا، `video_generate action=list` را اجرا کنید.

### ماتریس قابلیت‌ها

قرارداد حالت صریحی که توسط `video_generate`، تست‌های قرارداد، و
sweep زنده مشترک استفاده می‌شود:

| ارائه‌دهنده   | `generate` | `imageToVideo` | `videoToVideo` | laneهای زنده مشترک امروز                                                                                                                 |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` رد می‌شود چون این ارائه‌دهنده به URLهای ویدیوی راه‌دور `http(s)` نیاز دارد                              |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | در sweep مشترک نیست؛ پوشش مختص workflow همراه با تست‌های Comfy قرار دارد                                                              |
| DeepInfra  |     ✓      |       -        |       -        | `generate`؛ schemaهای ویدیوی بومی DeepInfra در قرارداد Plugin از نوع متن به ویدیو هستند                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` فقط هنگام استفاده از Seedance reference-to-video                                                  |
| Google     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` مشترک رد می‌شود چون sweep فعلی Gemini/Veo مبتنی بر buffer آن ورودی را نمی‌پذیرد |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` مشترک رد می‌شود چون این org/مسیر ورودی در حال حاضر به دسترسی ویرایش ویدیو در سمت ارائه‌دهنده نیاز دارد   |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` رد می‌شود چون این ارائه‌دهنده به URLهای ویدیوی راه‌دور `http(s)` نیاز دارد                              |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` فقط وقتی اجرا می‌شود که مدل انتخاب‌شده `runway/gen4_aleph` باشد                                     |
| Together   |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`؛ `imageToVideo` مشترک رد می‌شود چون `veo3` بسته‌بندی‌شده فقط متنی است و `kling` بسته‌بندی‌شده به URL تصویر راه‌دور نیاز دارد           |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` رد می‌شود چون این ارائه‌دهنده در حال حاضر به URL راه‌دور MP4 نیاز دارد                               |

## پارامترهای ابزار

### الزامی

<ParamField path="prompt" type="string" required>
  توضیح متنی ویدیویی که باید تولید شود. برای `action: "generate"` الزامی است.
</ParamField>

### ورودی‌های محتوا

<ParamField path="image" type="string">یک تصویر مرجع (مسیر یا URL).</ParamField>
<ParamField path="images" type="string[]">چند تصویر مرجع (تا ۹ مورد).</ParamField>
<ParamField path="imageRoles" type="string[]">
راهنمای نقش اختیاری برای هر جایگاه، هم‌راستا با فهرست ترکیبی تصاویر.
مقادیر کانونیک: `first_frame`، `last_frame`، `reference_image`.
</ParamField>
<ParamField path="video" type="string">یک ویدیوی مرجع (مسیر یا URL).</ParamField>
<ParamField path="videos" type="string[]">چند ویدیوی مرجع (تا ۴ مورد).</ParamField>
<ParamField path="videoRoles" type="string[]">
راهنمای نقش اختیاری برای هر جایگاه، هم‌راستا با فهرست ترکیبی ویدیوها.
مقدار کانونیک: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
یک صدای مرجع (مسیر یا URL). وقتی ارائه‌دهنده از ورودی‌های صوتی پشتیبانی کند،
برای موسیقی پس‌زمینه یا مرجع صدا استفاده می‌شود.
</ParamField>
<ParamField path="audioRefs" type="string[]">چند صدای مرجع (تا ۳ مورد).</ParamField>
<ParamField path="audioRoles" type="string[]">
راهنمای نقش اختیاری برای هر جایگاه، هم‌راستا با فهرست ترکیبی صداها.
مقدار کانونیک: `reference_audio`.
</ParamField>

<Note>
راهنماهای نقش همان‌گونه که هستند به ارائه‌دهنده ارسال می‌شوند. مقادیر کانونیک از
اتحاد `VideoGenerationAssetRole` می‌آیند، اما ارائه‌دهندگان ممکن است رشته‌های نقش
اضافی را هم بپذیرند. آرایه‌های `*Roles` نباید ورودی‌های بیشتری از فهرست مرجع
متناظر داشته باشند؛ خطاهای یکی کم یا زیاد با خطایی روشن شکست می‌خورند.
برای تنظیم‌نشده گذاشتن یک جایگاه، از رشته خالی استفاده کنید. برای xAI، نقش همه
تصاویر را روی `reference_image` بگذارید تا از حالت تولید `reference_images` آن استفاده شود؛
برای تبدیل تصویر به ویدیو با یک تصویر، نقش را حذف کنید یا از `first_frame` استفاده کنید.
</Note>

### کنترل‌های سبک

<ParamField path="aspectRatio" type="string">
  راهنمای نسبت تصویر مانند `1:1`، `16:9`، `9:16`، `adaptive`، یا یک مقدار ویژه ارائه‌دهنده. OpenClaw مقدارهای پشتیبانی‌نشده را برای هر ارائه‌دهنده نرمال‌سازی یا نادیده می‌گیرد.
</ParamField>
<ParamField path="resolution" type="string">راهنمای وضوح مانند `480P`، `720P`، `768P`، `1080P`، `4K`، یا یک مقدار ویژه ارائه‌دهنده. OpenClaw مقدارهای پشتیبانی‌نشده را برای هر ارائه‌دهنده نرمال‌سازی یا نادیده می‌گیرد.</ParamField>
<ParamField path="durationSeconds" type="number">
  مدت هدف بر حسب ثانیه (گردشده به نزدیک‌ترین مقدار پشتیبانی‌شده توسط ارائه‌دهنده).
</ParamField>
<ParamField path="size" type="string">راهنمای اندازه وقتی ارائه‌دهنده از آن پشتیبانی کند.</ParamField>
<ParamField path="audio" type="boolean">
  وقتی پشتیبانی شود، صدای تولیدشده را در خروجی فعال می‌کند. از `audioRef*` (ورودی‌ها) متمایز است.
</ParamField>
<ParamField path="watermark" type="boolean">واترمارک‌گذاری ارائه‌دهنده را وقتی پشتیبانی شود تغییر می‌دهد.</ParamField>

`adaptive` یک نشانه ویژه ارائه‌دهنده است: برای ارائه‌دهندگانی که `adaptive` را در
قابلیت‌های خود اعلام می‌کنند، همان‌گونه که هست ارسال می‌شود (برای مثال BytePlus
Seedance از آن برای تشخیص خودکار نسبت از ابعاد تصویر ورودی استفاده می‌کند).
ارائه‌دهندگانی که آن را اعلام نمی‌کنند، مقدار را از طریق `details.ignoredOverrides`
در نتیجه ابزار نشان می‌دهند تا حذف آن قابل مشاهده باشد.

### پیشرفته

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` وظیفه فعلی نشست را برمی‌گرداند؛ `"list"` ارائه‌دهندگان را بررسی می‌کند.
</ParamField>
<ParamField path="model" type="string">بازنویسی ارائه‌دهنده/مدل (مثلاً `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">راهنمای نام فایل خروجی.</ParamField>
<ParamField path="timeoutMs" type="number">مهلت اختیاری عملیات ارائه‌دهنده بر حسب میلی‌ثانیه. اگر حذف شود، OpenClaw در صورت پیکربندی از `agents.defaults.videoGenerationModel.timeoutMs` استفاده می‌کند، وگرنه وقتی مقدار پیش‌فرض ارائه‌دهنده نوشته‌شده توسط Plugin وجود داشته باشد از همان استفاده می‌کند.</ParamField>
<ParamField path="providerOptions" type="object">
  گزینه‌های ویژه ارائه‌دهنده به‌صورت یک شیء JSON (مثلاً `{"seed": 42, "draft": true}`).
  ارائه‌دهندگانی که یک schema تایپ‌شده اعلام می‌کنند، کلیدها و نوع‌ها را اعتبارسنجی می‌کنند؛
  کلیدهای ناشناخته یا ناسازگاری‌ها نامزد را هنگام fallback رد می‌کنند. ارائه‌دهندگان بدون
  schema اعلام‌شده، گزینه‌ها را همان‌گونه که هستند دریافت می‌کنند. برای دیدن آنچه هر ارائه‌دهنده
  می‌پذیرد، `video_generate action=list` را اجرا کنید.
</ParamField>

<Note>
همه ارائه‌دهندگان از همه پارامترها پشتیبانی نمی‌کنند. OpenClaw مدت را به
نزدیک‌ترین مقدار پشتیبانی‌شده توسط ارائه‌دهنده نرمال‌سازی می‌کند، و راهنماهای هندسی
ترجمه‌شده مانند اندازه به نسبت تصویر را وقتی یک ارائه‌دهنده fallback سطح کنترل
متفاوتی ارائه می‌کند، بازنگاشت می‌کند. بازنویسی‌های واقعاً پشتیبانی‌نشده تا حد امکان
نادیده گرفته می‌شوند و در نتیجه ابزار به‌صورت هشدار گزارش می‌شوند. محدودیت‌های سخت
قابلیت (مانند تعداد بیش از حد ورودی مرجع) پیش از ارسال شکست می‌خورند. نتایج ابزار
تنظیمات اعمال‌شده را گزارش می‌کنند؛ `details.normalization` هر ترجمه از مقدار
درخواست‌شده به مقدار اعمال‌شده را ثبت می‌کند.
</Note>

ورودی‌های مرجع حالت runtime را انتخاب می‌کنند:

- بدون رسانه مرجع → `generate`
- هر مرجع تصویر → `imageToVideo`
- هر مرجع ویدیو → `videoToVideo`
- ورودی‌های صدای مرجع حالت حل‌شده را تغییر **نمی‌دهند**؛ آن‌ها روی هر حالتی که
  مراجع تصویر/ویدیو انتخاب کنند اعمال می‌شوند، و فقط با ارائه‌دهندگانی کار می‌کنند
  که `maxInputAudios` را اعلام می‌کنند.

ترکیب مراجع تصویر و ویدیو یک سطح قابلیت مشترک پایدار نیست.
در هر درخواست، یک نوع مرجع را ترجیح دهید.

#### Fallback و گزینه‌های تایپ‌شده

برخی بررسی‌های قابلیت به‌جای مرز ابزار در لایه fallback اعمال می‌شوند، بنابراین
درخواستی که از محدودیت‌های ارائه‌دهنده اصلی فراتر می‌رود همچنان می‌تواند روی یک
fallback توانمند اجرا شود:

- نامزد فعالی که `maxInputAudios` را اعلام نمی‌کند (یا `0` اعلام می‌کند) وقتی
  درخواست شامل مراجع صوتی باشد رد می‌شود؛ نامزد بعدی امتحان می‌شود.
- `maxDurationSeconds` نامزد فعال کمتر از `durationSeconds` درخواست‌شده باشد
  و فهرست `supportedDurationSeconds` اعلام نشده باشد → رد می‌شود.
- درخواست شامل `providerOptions` باشد و نامزد فعال صراحتاً یک schema تایپ‌شده
  `providerOptions` اعلام کند → اگر کلیدهای ارائه‌شده در schema نباشند یا نوع
  مقدارها مطابقت نداشته باشند، رد می‌شود. ارائه‌دهندگان بدون schema اعلام‌شده
  گزینه‌ها را همان‌گونه که هستند دریافت می‌کنند (عبور سازگار با نسخه‌های قبلی).
  یک ارائه‌دهنده می‌تواند با اعلام یک schema خالی (`capabilities.providerOptions: {}`)
  از همه گزینه‌های ارائه‌دهنده انصراف دهد، که همان رد شدنِ ناسازگاری نوع را ایجاد می‌کند.

اولین دلیل رد شدن در یک درخواست با سطح `warn` ثبت می‌شود تا اپراتورها ببینند چه زمانی
ارائه‌دهنده اصلی‌شان کنار گذاشته شده است؛ رد شدن‌های بعدی با سطح `debug` ثبت می‌شوند
تا زنجیره‌های بلند fallback ساکت بمانند. اگر همه نامزدها رد شوند، خطای تجمیع‌شده
دلیل رد شدن هرکدام را شامل می‌شود.

## کنش‌ها

| کنش       | کاری که انجام می‌دهد                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | پیش‌فرض. از prompt داده‌شده و ورودی‌های مرجع اختیاری یک ویدیو می‌سازد.                                      |
| `status`   | وضعیت وظیفه ویدیویی در حال اجرا را برای نشست فعلی، بدون شروع یک تولید دیگر، بررسی می‌کند.                  |
| `list`     | ارائه‌دهندگان، مدل‌ها و قابلیت‌های در دسترس آن‌ها را نشان می‌دهد.                                           |

## انتخاب مدل

OpenClaw مدل را به این ترتیب حل می‌کند:

1. **پارامتر ابزار `model`** - اگر agent در فراخوانی یکی مشخص کند.
2. **`videoGenerationModel.primary`** از config.
3. **`videoGenerationModel.fallbacks`** به‌ترتیب.
4. **تشخیص خودکار** - ارائه‌دهندگانی که احراز هویت معتبر دارند، با شروع از
   ارائه‌دهنده پیش‌فرض فعلی، سپس سایر ارائه‌دهندگان به‌ترتیب الفبایی.

اگر یک ارائه‌دهنده شکست بخورد، نامزد بعدی به‌صورت خودکار امتحان می‌شود. اگر همه
نامزدها شکست بخورند، خطا جزئیات هر تلاش را شامل می‌شود.

برای استفاده فقط از ورودی‌های صریح `model`، `primary`، و `fallbacks`،
`agents.defaults.mediaGenerationAutoProviderFallback: false` را تنظیم کنید.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## یادداشت‌های ارائه‌دهنده

<AccordionGroup>
  <Accordion title="Alibaba">
    از endpoint ناهمگام DashScope / Model Studio استفاده می‌کند. تصاویر و
    ویدیوهای مرجع باید URLهای راه‌دور `http(s)` باشند.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    شناسه ارائه‌دهنده: `byteplus`.

    مدل‌ها: `seedance-1-0-pro-250528` (پیش‌فرض)،
    `seedance-1-0-pro-t2v-250528`، `seedance-1-0-pro-fast-251015`،
    `seedance-1-0-lite-t2v-250428`، `seedance-1-0-lite-i2v-250428`.

    مدل‌های T2V (`*-t2v-*`) ورودی تصویر را نمی‌پذیرند؛ مدل‌های I2V و
    مدل‌های عمومی `*-pro-*` از یک تصویر مرجع (فریم اول) پشتیبانی می‌کنند.
    تصویر را به‌صورت جایگاهی ارسال کنید یا `role: "first_frame"` را تنظیم کنید.
    وقتی تصویری ارائه شود، شناسه‌های مدل T2V به‌صورت خودکار به گونه I2V متناظر
    تغییر داده می‌شوند.

    کلیدهای پشتیبانی‌شده `providerOptions`: `seed` (number)، `draft` (boolean -
    اجبار به 480p)، `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    به Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    نیاز دارد. شناسه ارائه‌دهنده: `byteplus-seedance15`. مدل:
    `seedance-1-5-pro-251215`.

    از API یکپارچه `content[]` استفاده می‌کند. حداکثر از ۲ تصویر ورودی پشتیبانی می‌کند
    (`first_frame` + `last_frame`). همه ورودی‌ها باید URLهای راه‌دور `https://`
    باشند. روی هر تصویر `role: "first_frame"` / `"last_frame"` را تنظیم کنید، یا
    تصاویر را به‌صورت جایگاهی ارسال کنید.

    `aspectRatio: "adaptive"` نسبت را از تصویر ورودی به‌صورت خودکار تشخیص می‌دهد.
    `audio: true` به `generate_audio` نگاشت می‌شود. `providerOptions.seed`
    (number) ارسال می‌شود.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    به Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    نیاز دارد. شناسه ارائه‌دهنده: `byteplus-seedance2`. مدل‌ها:
    `dreamina-seedance-2-0-260128`،
    `dreamina-seedance-2-0-fast-260128`.

    از API یکپارچه `content[]` استفاده می‌کند. تا ۹ تصویر مرجع،
    ۳ ویدیوی مرجع، و ۳ صدای مرجع را پشتیبانی می‌کند. همه ورودی‌ها باید URLهای
    راه‌دور `https://` باشند. روی هر asset، `role` را تنظیم کنید - مقادیر پشتیبانی‌شده:
    `"first_frame"`، `"last_frame"`، `"reference_image"`،
    `"reference_video"`، `"reference_audio"`.

    `aspectRatio: "adaptive"` نسبت را از تصویر ورودی به‌صورت خودکار تشخیص می‌دهد.
    `audio: true` به `generate_audio` نگاشت می‌شود. `providerOptions.seed`
    (number) ارسال می‌شود.

  </Accordion>
  <Accordion title="ComfyUI">
    اجرای محلی یا ابری مبتنی بر workflow. از text-to-video و
    image-to-video از طریق graph پیکربندی‌شده پشتیبانی می‌کند.
  </Accordion>
  <Accordion title="fal">
    برای کارهای طولانی‌مدت از جریانی مبتنی بر queue استفاده می‌کند. OpenClaw به‌طور پیش‌فرض تا 20
    دقیقه منتظر می‌ماند و سپس یک کار fal queue در حال اجرا را timed
    out در نظر می‌گیرد. بیشتر مدل‌های ویدیویی fal
    یک ارجاع تصویر واحد را می‌پذیرند. مدل‌های Seedance 2.0 reference-to-video
    تا 9 تصویر، 3 ویدیو، و 3 ارجاع صوتی را می‌پذیرند، با
    حداکثر 12 فایل ارجاع در مجموع.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    از یک ارجاع تصویر یا یک ارجاع ویدیو پشتیبانی می‌کند. درخواست‌های generated-audio
    در مسیر Gemini API با یک هشدار نادیده گرفته می‌شوند، زیرا آن API
    پارامتر `generateAudio` را برای تولید ویدیوی فعلی Veo رد می‌کند.
  </Accordion>
  <Accordion title="MiniMax">
    فقط یک ارجاع تصویر واحد. MiniMax وضوح‌های `768P` و `1080P`
    را می‌پذیرد؛ درخواست‌هایی مانند `720P` پیش از ارسال به نزدیک‌ترین
    مقدار پشتیبانی‌شده نرمال‌سازی می‌شوند.
  </Accordion>
  <Accordion title="OpenAI">
    فقط override مربوط به `size` ارسال می‌شود. سایر overrideهای سبک
    (`aspectRatio`, `resolution`, `audio`, `watermark`) با
    یک هشدار نادیده گرفته می‌شوند.
  </Accordion>
  <Accordion title="OpenRouter">
    از API ناهمگام `/videos` در OpenRouter استفاده می‌کند. OpenClaw
    کار را ارسال می‌کند، `polling_url` را poll می‌کند، و یا `unsigned_urls` یا
    endpoint مستندشدهٔ محتوای کار را دانلود می‌کند. پیش‌فرض همراه `google/veo-3.1-fast`
    مدت‌های 4/6/8 ثانیه، وضوح‌های `720P`/`1080P`، و
    نسبت‌های تصویر `16:9`/`9:16` را اعلام می‌کند.
  </Accordion>
  <Accordion title="Qwen">
    همان backend DashScope مثل Alibaba. ورودی‌های ارجاع باید URLهای remote
    `http(s)` باشند؛ فایل‌های محلی از ابتدا رد می‌شوند.
  </Accordion>
  <Accordion title="Runway">
    از فایل‌های محلی از طریق data URI پشتیبانی می‌کند. video-to-video به
    `runway/gen4_aleph` نیاز دارد. اجراهای فقط متنی نسبت‌های تصویر
    `16:9` و `9:16` را عرضه می‌کنند.
  </Accordion>
  <Accordion title="Together">
    فقط یک ارجاع تصویر واحد.
  </Accordion>
  <Accordion title="Vydra">
    برای جلوگیری از redirectهایی که auth را حذف می‌کنند، مستقیما از
    `https://www.vydra.ai/api/v1` استفاده می‌کند. `veo3` فقط به‌صورت text-to-video
    همراه شده است؛ `kling` به یک URL تصویر remote نیاز دارد.
  </Accordion>
  <Accordion title="xAI">
    از text-to-video، image-to-video با یک تصویر first-frame، تا 7
    ورودی `reference_image` از طریق xAI `reference_images`، و جریان‌های
    ویرایش/گسترش ویدیوی remote پشتیبانی می‌کند.
  </Accordion>
</AccordionGroup>

## حالت‌های قابلیت ارائه‌دهنده

قرارداد مشترک تولید ویدیو به‌جای فقط محدودیت‌های تجمیعی تخت، از قابلیت‌های
ویژهٔ mode پشتیبانی می‌کند. پیاده‌سازی‌های جدید ارائه‌دهنده
باید بلوک‌های mode صریح را ترجیح دهند:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

فیلدهای تجمیعی تخت مانند `maxInputImages` و `maxInputVideos`
برای اعلام پشتیبانی از transform-mode **کافی نیستند**. ارائه‌دهنده‌ها باید
`generate`، `imageToVideo`، و `videoToVideo` را صریحا اعلام کنند تا
آزمون‌های زنده، آزمون‌های قرارداد، و ابزار مشترک `video_generate`
بتوانند پشتیبانی mode را به‌صورت قطعی اعتبارسنجی کنند.

وقتی یک مدل در یک ارائه‌دهنده پشتیبانی گسترده‌تری برای ورودی‌های ارجاع نسبت به
بقیه دارد، به‌جای افزایش محدودیت سراسری mode از
`maxInputImagesByModel`، `maxInputVideosByModel`، یا
`maxInputAudiosByModel` استفاده کنید.

## آزمون‌های زنده

پوشش زندهٔ opt-in برای ارائه‌دهنده‌های همراه مشترک:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

پوشش‌دهندهٔ مخزن:

```bash
pnpm test:live:media video
```

این فایل زنده به‌طور پیش‌فرض از env varهای از قبل exportشدهٔ ارائه‌دهنده
پیش از پروفایل‌های auth ذخیره‌شده استفاده می‌کند، و به‌طور پیش‌فرض یک smoke
ایمن برای release اجرا می‌کند:

- `generate` برای هر ارائه‌دهندهٔ غیر FAL در sweep.
- prompt یک‌ثانیه‌ای lobster.
- سقف عملیات برای هر ارائه‌دهنده از
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` به‌طور پیش‌فرض).

FAL به‌صورت opt-in است، چون latency صف در سمت ارائه‌دهنده می‌تواند بر زمان
release غالب شود:

```bash
pnpm test:live:media video --video-providers fal
```

`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` را تنظیم کنید تا modeهای
transform اعلام‌شده‌ای نیز اجرا شوند که sweep مشترک می‌تواند با رسانهٔ محلی
به‌طور ایمن تمرین کند:

- `imageToVideo` وقتی `capabilities.imageToVideo.enabled`.
- `videoToVideo` وقتی `capabilities.videoToVideo.enabled` و
  ارائه‌دهنده/مدل ورودی ویدیوی محلی buffer-backed را در sweep مشترک
  می‌پذیرد.

امروز مسیر زندهٔ مشترک `videoToVideo` فقط وقتی `runway` را پوشش می‌دهد
که `runway/gen4_aleph` را انتخاب کنید.

## پیکربندی

مدل پیش‌فرض تولید ویدیو را در پیکربندی OpenClaw خود تنظیم کنید:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

یا از طریق CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## مرتبط

- [Alibaba Model Studio](/fa/providers/alibaba)
- [کارهای پس‌زمینه](/fa/automation/tasks) - پیگیری کار برای تولید ویدیوی async
- [BytePlus](/fa/concepts/model-providers#byteplus-international)
- [ComfyUI](/fa/providers/comfy)
- [مرجع پیکربندی](/fa/gateway/config-agents#agent-defaults)
- [fal](/fa/providers/fal)
- [Google (Gemini)](/fa/providers/google)
- [MiniMax](/fa/providers/minimax)
- [مدل‌ها](/fa/concepts/models)
- [OpenAI](/fa/providers/openai)
- [Qwen](/fa/providers/qwen)
- [Runway](/fa/providers/runway)
- [Together AI](/fa/providers/together)
- [نمای کلی ابزارها](/fa/tools)
- [Vydra](/fa/providers/vydra)
- [xAI](/fa/providers/xai)
