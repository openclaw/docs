---
read_when:
    - تولید ویدیوها از طریق عامل
    - پیکربندی ارائه‌دهندگان و مدل‌های تولید ویدیو
    - آشنایی با پارامترهای ابزار video_generate
sidebarTitle: Video generation
summary: ویدیوها را از طریق video_generate، از ارجاع‌های متنی، تصویری یا ویدیویی، در میان 16 بک‌اند ارائه‌دهنده تولید کنید.
title: تولید ویدئو
x-i18n:
    generated_at: "2026-05-11T20:47:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1dbeea0393150c1495bcc0a9acc68a57b99d919f3134fb17820f22cfe05e90
    source_path: tools/video-generation.md
    workflow: 16
---

عامل‌های OpenClaw می‌توانند از اعلان‌های متنی، تصاویر مرجع، یا
ویدیوهای موجود ویدیو تولید کنند. شانزده backend ارائه‌دهنده پشتیبانی می‌شود که هرکدام
گزینه‌های مدل، حالت‌های ورودی، و مجموعه قابلیت‌های متفاوتی دارند. عامل بر اساس پیکربندی و کلیدهای API
موجود شما، ارائه‌دهنده مناسب را به‌صورت خودکار انتخاب می‌کند.

<Note>
ابزار `video_generate` فقط زمانی ظاهر می‌شود که دست‌کم یک ارائه‌دهنده تولید ویدیو
در دسترس باشد. اگر آن را در ابزارهای عامل خود نمی‌بینید، یک
کلید API ارائه‌دهنده تنظیم کنید یا `agents.defaults.videoGenerationModel` را پیکربندی کنید.
</Note>

OpenClaw تولید ویدیو را به‌عنوان سه حالت زمان اجرا در نظر می‌گیرد:

- `generate` - درخواست‌های متن‌به‌ویدیو بدون رسانه مرجع.
- `imageToVideo` - درخواست شامل یک یا چند تصویر مرجع است.
- `videoToVideo` - درخواست شامل یک یا چند ویدیوی مرجع است.

ارائه‌دهندگان می‌توانند از هر زیرمجموعه‌ای از این حالت‌ها پشتیبانی کنند. ابزار،
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
    > یک ویدیوی سینمایی ۵ ثانیه‌ای از یک خرچنگ دریایی دوستانه تولید کن که هنگام غروب موج‌سواری می‌کند.

    عامل به‌صورت خودکار `video_generate` را فراخوانی می‌کند. نیازی به قرار دادن ابزار در allowlist
    نیست.

  </Step>
</Steps>

## تولید ناهمگام چگونه کار می‌کند

تولید ویدیو ناهمگام است. وقتی عامل در یک
نشست `video_generate` را فراخوانی می‌کند:

1. OpenClaw درخواست را به ارائه‌دهنده ارسال می‌کند و بلافاصله یک شناسه وظیفه برمی‌گرداند.
2. ارائه‌دهنده کار را در پس‌زمینه پردازش می‌کند (معمولا ۳۰ ثانیه تا چند دقیقه، بسته به ارائه‌دهنده و وضوح؛ ارائه‌دهندگان کندِ متکی به صف می‌توانند تا سقف timeout پیکربندی‌شده اجرا شوند).
3. وقتی ویدیو آماده شد، OpenClaw همان نشست را با یک رویداد تکمیل داخلی بیدار می‌کند.
4. عامل به کاربر اطلاع می‌دهد و ویدیوی نهایی را پیوست می‌کند. در گفتگوهای گروهی/کانالی
   که از تحویل قابل مشاهده فقط از طریق ابزار پیام استفاده می‌کنند، عامل نتیجه را
   به‌جای اینکه OpenClaw آن را مستقیم ارسال کند، از طریق ابزار پیام منتقل می‌کند.

وقتی یک کار در حال اجراست، فراخوانی‌های تکراری `video_generate` در همان
نشست به‌جای شروع یک تولید دیگر، وضعیت فعلی وظیفه را برمی‌گردانند.
برای بررسی پیشرفت از CLI، از `openclaw tasks list` یا `openclaw tasks show <taskId>` استفاده کنید.

بیرون از اجراهای عاملِ پشتوانه‌دار به نشست (برای مثال، فراخوانی مستقیم ابزارها)،
ابزار به تولید inline برمی‌گردد و مسیر رسانه نهایی را
در همان نوبت برمی‌گرداند.

وقتی ارائه‌دهنده byte برمی‌گرداند، فایل‌های ویدیوی تولیدشده در فضای ذخیره‌سازی رسانه تحت مدیریت OpenClaw
ذخیره می‌شوند. سقف پیش‌فرض ذخیره ویدیوی تولیدشده از
محدودیت رسانه ویدیویی پیروی می‌کند، و `agents.defaults.mediaMaxMb` آن را برای
رندرهای بزرگ‌تر افزایش می‌دهد. وقتی ارائه‌دهنده همچنین یک URL خروجی میزبانی‌شده برمی‌گرداند، OpenClaw
می‌تواند در صورت رد شدن ذخیره محلی به‌دلیل فایل بیش‌ازحد بزرگ، به‌جای ناموفق کردن وظیفه،
آن URL را تحویل دهد.

### چرخه عمر وظیفه

| وضعیت       | معنا                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | وظیفه ایجاد شده و منتظر است ارائه‌دهنده آن را بپذیرد.                                                  |
| `running`   | ارائه‌دهنده در حال پردازش است (معمولا ۳۰ ثانیه تا چند دقیقه، بسته به ارائه‌دهنده و وضوح).           |
| `succeeded` | ویدیو آماده است؛ عامل بیدار می‌شود و آن را در گفتگو ارسال می‌کند.                                     |
| `failed`    | خطای ارائه‌دهنده یا timeout؛ عامل با جزئیات خطا بیدار می‌شود.                                        |

بررسی وضعیت از CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

اگر یک وظیفه ویدیویی برای نشست فعلی از قبل `queued` یا `running` باشد،
`video_generate` به‌جای شروع یک وظیفه جدید، وضعیت وظیفه موجود را برمی‌گرداند.
برای بررسی صریح بدون راه‌اندازی یک تولید جدید، از `action: "status"` استفاده کنید.

## ارائه‌دهندگان پشتیبانی‌شده

| ارائه‌دهنده              | مدل پیش‌فرض                   | متن | ارجاع تصویر                                            | ارجاع ویدیو                                       | احراز هویت                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | بله (URL راه دور)                                     | بله (URL راه دور)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | تا ۲ تصویر (فقط مدل‌های I2V؛ فریم اول + آخر) | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | تا ۲ تصویر (فریم اول + آخر از طریق role)         | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | تا ۹ تصویر مرجع                             | تا ۳ ویدیو                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | ۱ تصویر                                              | -                                               | `COMFY_API_KEY` یا `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | ۱ تصویر؛ تا ۹ مورد با Seedance reference-to-video    | تا ۳ ویدیو با Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | ۱ تصویر                                              | ۱ ویدیو                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | ۱ تصویر                                              | -                                               | `MINIMAX_API_KEY` یا MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | ۱ تصویر                                              | ۱ ویدیو                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | تا ۴ تصویر (فریم اول/آخر یا مراجع)      | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | بله (URL راه دور)                                     | بله (URL راه دور)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | ۱ تصویر                                              | ۱ ویدیو                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | ۱ تصویر                                              | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | ۱ تصویر (`kling`)                                    | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | ۱ تصویر فریم اول یا تا ۷ `reference_image`    | ۱ ویدیو                                         | `XAI_API_KEY`                            |

برخی ارائه‌دهندگان env varهای کلید API اضافی یا جایگزین را می‌پذیرند. برای جزئیات،
[صفحه‌های ارائه‌دهنده](#related) جداگانه را ببینید.

برای بررسی ارائه‌دهندگان، مدل‌ها، و حالت‌های زمان اجرا در زمان اجرا، `video_generate action=list` را اجرا کنید.

### ماتریس قابلیت‌ها

قرارداد حالت صریحی که توسط `video_generate`، آزمون‌های قرارداد، و
جاروب زنده مشترک استفاده می‌شود:

| ارائه‌دهنده   | `generate` | `imageToVideo` | `videoToVideo` | مسیرهای زنده مشترک امروز                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` رد می‌شود چون این ارائه‌دهنده به URLهای ویدیویی راه دور `http(s)` نیاز دارد                               |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       -        | در جاروب مشترک نیست؛ پوشش workflow-specific همراه با آزمون‌های Comfy قرار دارد                                                               |
| DeepInfra  |     ✓      |       -        |       -        | `generate`؛ schemaهای ویدیوی بومی DeepInfra در قرارداد bundled، متن‌به‌ویدیو هستند                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` فقط هنگام استفاده از Seedance reference-to-video                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` مشترک رد می‌شود چون جاروب Gemini/Veo فعلیِ buffer-backed آن ورودی را نمی‌پذیرد  |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` مشترک رد می‌شود چون این سازمان/مسیر ورودی در حال حاضر به دسترسی inpaint/remix سمت ارائه‌دهنده نیاز دارد |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` رد می‌شود چون این ارائه‌دهنده به URLهای ویدیویی راه دور `http(s)` نیاز دارد                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` فقط وقتی اجرا می‌شود که مدل انتخاب‌شده `runway/gen4_aleph` باشد                                      |
| Together   |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       -        | `generate`؛ `imageToVideo` مشترک رد می‌شود چون `veo3` bundled فقط متنی است و `kling` bundled به URL تصویر راه دور نیاز دارد            |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` رد می‌شود چون این ارائه‌دهنده در حال حاضر به URL راه دور MP4 نیاز دارد                                |

## پارامترهای ابزار

### الزامی

<ParamField path="prompt" type="string" required>
  توضیح متنی ویدیویی که باید تولید شود. برای `action: "generate"` الزامی است.
</ParamField>

### ورودی‌های محتوا

<ParamField path="image" type="string">یک تصویر مرجع واحد (مسیر یا URL).</ParamField>
<ParamField path="images" type="string[]">چند تصویر مرجع (حداکثر ۹).</ParamField>
<ParamField path="imageRoles" type="string[]">
راهنمایی‌های اختیاری نقش برای هر جایگاه، موازی با فهرست ترکیبی تصاویر.
مقادیر استاندارد: `first_frame`، `last_frame`، `reference_image`.
</ParamField>
<ParamField path="video" type="string">یک ویدیوی مرجع واحد (مسیر یا URL).</ParamField>
<ParamField path="videos" type="string[]">چند ویدیوی مرجع (حداکثر ۴).</ParamField>
<ParamField path="videoRoles" type="string[]">
راهنمایی‌های اختیاری نقش برای هر جایگاه، موازی با فهرست ترکیبی ویدیوها.
مقدار استاندارد: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
یک صوت مرجع واحد (مسیر یا URL). وقتی ارائه‌دهنده از ورودی‌های صوتی پشتیبانی کند، برای موسیقی پس‌زمینه یا
مرجع صدا استفاده می‌شود.
</ParamField>
<ParamField path="audioRefs" type="string[]">چند صوت مرجع (حداکثر ۳).</ParamField>
<ParamField path="audioRoles" type="string[]">
راهنمایی‌های اختیاری نقش برای هر جایگاه، موازی با فهرست ترکیبی صوت‌ها.
مقدار استاندارد: `reference_audio`.
</ParamField>

<Note>
راهنمایی‌های نقش همان‌طور که هستند به ارائه‌دهنده ارسال می‌شوند. مقادیر استاندارد از
ترکیب `VideoGenerationAssetRole` می‌آیند، اما ارائه‌دهندگان ممکن است رشته‌های نقش اضافی را بپذیرند.
آرایه‌های `*Roles` نباید ورودی‌های بیشتری از فهرست مرجع متناظر داشته باشند؛ خطاهای یکی‌جابه‌جا
با خطایی روشن شکست می‌خورند.
برای تنظیم‌نشده گذاشتن یک جایگاه، از رشته خالی استفاده کنید. برای xAI، نقش همه تصاویر را روی
`reference_image` بگذارید تا از حالت تولید `reference_images` آن استفاده شود؛ برای تصویر-به-ویدیو
با یک تصویر، نقش را حذف کنید یا از `first_frame` استفاده کنید.
</Note>

### کنترل‌های سبک

<ParamField path="aspectRatio" type="string">
  راهنمای نسبت تصویر مانند `1:1`، `16:9`، `9:16`، `adaptive`، یا مقداری ویژه ارائه‌دهنده. OpenClaw مقادیر پشتیبانی‌نشده را بسته به ارائه‌دهنده عادی‌سازی یا نادیده می‌گیرد.
</ParamField>
<ParamField path="resolution" type="string">راهنمای وضوح مانند `480P`، `720P`، `768P`، `1080P`، `4K`، یا مقداری ویژه ارائه‌دهنده. OpenClaw مقادیر پشتیبانی‌نشده را بسته به ارائه‌دهنده عادی‌سازی یا نادیده می‌گیرد.</ParamField>
<ParamField path="durationSeconds" type="number">
  مدت هدف به ثانیه (گردشده به نزدیک‌ترین مقدار پشتیبانی‌شده توسط ارائه‌دهنده).
</ParamField>
<ParamField path="size" type="string">راهنمای اندازه، وقتی ارائه‌دهنده از آن پشتیبانی کند.</ParamField>
<ParamField path="audio" type="boolean">
  وقتی پشتیبانی شود، صوت تولیدشده را در خروجی فعال می‌کند. از `audioRef*` (ورودی‌ها) متمایز است.
</ParamField>
<ParamField path="watermark" type="boolean">در صورت پشتیبانی، واترمارک‌گذاری ارائه‌دهنده را تغییر می‌دهد.</ParamField>

`adaptive` یک نگهبان ویژه ارائه‌دهنده است: به همان شکل به
ارائه‌دهندگانی ارسال می‌شود که `adaptive` را در قابلیت‌های خود اعلام می‌کنند (مثلا BytePlus
Seedance از آن برای تشخیص خودکار نسبت از ابعاد تصویر ورودی
استفاده می‌کند). ارائه‌دهندگانی که آن را اعلام نمی‌کنند، مقدار را از طریق
`details.ignoredOverrides` در نتیجه ابزار نمایش می‌دهند تا حذف آن قابل مشاهده باشد.

### پیشرفته

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` وظیفه فعلی نشست را برمی‌گرداند؛ `"list"` ارائه‌دهندگان را بررسی می‌کند.
</ParamField>
<ParamField path="model" type="string">نادیده‌گیری ارائه‌دهنده/مدل (مثلا `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">راهنمای نام فایل خروجی.</ParamField>
<ParamField path="timeoutMs" type="number">مهلت زمانی اختیاری عملیات ارائه‌دهنده به میلی‌ثانیه. وقتی حذف شود، OpenClaw در صورت پیکربندی از `agents.defaults.videoGenerationModel.timeoutMs` استفاده می‌کند.</ParamField>
<ParamField path="providerOptions" type="object">
  گزینه‌های ویژه ارائه‌دهنده به‌صورت یک شیء JSON (مثلا `{"seed": 42, "draft": true}`).
  ارائه‌دهندگانی که شمای نوع‌دار اعلام می‌کنند کلیدها و نوع‌ها را اعتبارسنجی می‌کنند؛ کلیدهای ناشناخته
  یا ناهماهنگی‌ها نامزد را هنگام fallback رد می‌کنند. ارائه‌دهندگان بدون شمای
  اعلام‌شده گزینه‌ها را همان‌طور که هستند دریافت می‌کنند. برای دیدن آنچه هر ارائه‌دهنده می‌پذیرد،
  `video_generate action=list` را اجرا کنید.
</ParamField>

<Note>
همه ارائه‌دهندگان از همه پارامترها پشتیبانی نمی‌کنند. OpenClaw مدت را به
نزدیک‌ترین مقدار پشتیبانی‌شده توسط ارائه‌دهنده عادی‌سازی می‌کند و وقتی یک ارائه‌دهنده fallback سطح کنترل متفاوتی را ارائه دهد،
راهنماهای هندسی ترجمه‌شده مانند اندازه-به-نسبت-تصویر را بازنگاشت می‌کند.
نادیده‌گیری‌های واقعا پشتیبانی‌نشده بر پایه بیشترین تلاش نادیده گرفته می‌شوند
و در نتیجه ابزار به‌صورت هشدار گزارش می‌شوند. محدودیت‌های سخت قابلیت
(مانند تعداد بیش از حد ورودی‌های مرجع) پیش از ارسال شکست می‌خورند. نتایج ابزار
تنظیمات اعمال‌شده را گزارش می‌کنند؛ `details.normalization` هرگونه ترجمه
از مقدار درخواست‌شده به مقدار اعمال‌شده را ثبت می‌کند.
</Note>

ورودی‌های مرجع حالت زمان اجرا را انتخاب می‌کنند:

- بدون رسانه مرجع → `generate`
- هر مرجع تصویر → `imageToVideo`
- هر مرجع ویدیو → `videoToVideo`
- ورودی‌های صوت مرجع **حالت حل‌شده را تغییر نمی‌دهند**؛ آن‌ها روی
  هر حالتی که مراجع تصویر/ویدیو انتخاب می‌کنند اعمال می‌شوند، و فقط با
  ارائه‌دهندگانی کار می‌کنند که `maxInputAudios` را اعلام می‌کنند.

ترکیب مراجع تصویر و ویدیو سطح قابلیت مشترک پایداری نیست.
برای هر درخواست، یک نوع مرجع را ترجیح دهید.

#### Fallback و گزینه‌های نوع‌دار

برخی بررسی‌های قابلیت به‌جای مرز ابزار در لایه fallback اعمال می‌شوند،
پس درخواستی که از محدودیت‌های ارائه‌دهنده اصلی فراتر می‌رود همچنان می‌تواند
روی fallback توانمند اجرا شود:

- نامزد فعال که هیچ `maxInputAudios` اعلام نکرده است (یا `0`) وقتی
  درخواست شامل مراجع صوتی باشد رد می‌شود؛ نامزد بعدی امتحان می‌شود.
- `maxDurationSeconds` نامزد فعال کمتر از `durationSeconds` درخواست‌شده
  و بدون فهرست `supportedDurationSeconds` اعلام‌شده → رد می‌شود.
- درخواست شامل `providerOptions` است و نامزد فعال به‌طور صریح
  شمای نوع‌دار `providerOptions` اعلام می‌کند → اگر کلیدهای ارائه‌شده
  در شما نباشند یا نوع مقدارها منطبق نباشد رد می‌شود. ارائه‌دهندگان بدون
  شمای اعلام‌شده گزینه‌ها را همان‌طور که هستند دریافت می‌کنند (عبور سازگار با نسخه‌های قبلی).
  یک ارائه‌دهنده می‌تواند با اعلام شمای خالی (`capabilities.providerOptions: {}`) از همه
  گزینه‌های ارائه‌دهنده انصراف دهد، که همان رد شدن ناشی از ناهماهنگی نوع را
  ایجاد می‌کند.

نخستین دلیل رد شدن در یک درخواست با سطح `warn` ثبت می‌شود تا اپراتورها ببینند
چه زمانی ارائه‌دهنده اصلی آن‌ها کنار گذاشته شده است؛ رد شدن‌های بعدی با سطح `debug` ثبت می‌شوند تا
زنجیره‌های طولانی fallback کم‌صدا بمانند. اگر همه نامزدها رد شوند، خطای
تجمیع‌شده دلیل رد شدن هرکدام را شامل می‌شود.

## کنش‌ها

| کنش       | کاری که انجام می‌دهد                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | پیش‌فرض. از prompt داده‌شده و ورودی‌های مرجع اختیاری یک ویدیو ایجاد می‌کند.                             |
| `status`   | وضعیت وظیفه ویدیویی در حال اجرا برای نشست فعلی را بدون شروع تولیدی دیگر بررسی می‌کند. |
| `list`     | ارائه‌دهندگان، مدل‌ها و قابلیت‌های موجود آن‌ها را نشان می‌دهد.                                                |

## انتخاب مدل

OpenClaw مدل را به این ترتیب حل می‌کند:

1. **پارامتر ابزار `model`** - اگر عامل در فراخوانی یکی مشخص کند.
2. **`videoGenerationModel.primary`** از پیکربندی.
3. **`videoGenerationModel.fallbacks`** به‌ترتیب.
4. **تشخیص خودکار** - ارائه‌دهندگانی که احراز هویت معتبر دارند، از
   ارائه‌دهنده پیش‌فرض فعلی شروع می‌شود، سپس ارائه‌دهندگان باقی‌مانده به‌ترتیب الفبایی.

اگر یک ارائه‌دهنده شکست بخورد، نامزد بعدی به‌طور خودکار امتحان می‌شود. اگر همه
نامزدها شکست بخورند، خطا جزئیات هر تلاش را شامل می‌شود.

برای استفاده فقط از ورودی‌های صریح `model`، `primary` و `fallbacks`،
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
    از نقطه پایانی ناهمگام DashScope / Model Studio استفاده می‌کند. تصاویر و
    ویدیوهای مرجع باید URLهای راه‌دور `http(s)` باشند.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    شناسه ارائه‌دهنده: `byteplus`.

    مدل‌ها: `seedance-1-0-pro-250528` (پیش‌فرض)،
    `seedance-1-0-pro-t2v-250528`، `seedance-1-0-pro-fast-251015`،
    `seedance-1-0-lite-t2v-250428`، `seedance-1-0-lite-i2v-250428`.

    مدل‌های T2V (`*-t2v-*`) ورودی تصویر را نمی‌پذیرند؛ مدل‌های I2V و
    مدل‌های عمومی `*-pro-*` از یک تصویر مرجع واحد (فریم اول)
    پشتیبانی می‌کنند. تصویر را به‌صورت جایگاهی ارسال کنید یا `role: "first_frame"` را تنظیم کنید.
    وقتی تصویری ارائه شود، شناسه‌های مدل T2V به‌طور خودکار به گونه I2V متناظر
    تغییر داده می‌شوند.

    کلیدهای پشتیبانی‌شده `providerOptions`: `seed` (عدد)، `draft` (بولی -
    اجبار به 480p)، `camera_fixed` (بولی).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    به Plugin
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    نیاز دارد. شناسه ارائه‌دهنده: `byteplus-seedance15`. مدل:
    `seedance-1-5-pro-251215`.

    از API یکپارچه `content[]` استفاده می‌کند. حداکثر از ۲ تصویر ورودی
    (`first_frame` + `last_frame`) پشتیبانی می‌کند. همه ورودی‌ها باید URLهای راه‌دور `https://`
    باشند. روی هر تصویر `role: "first_frame"` / `"last_frame"` را تنظیم کنید، یا
    تصاویر را به‌صورت جایگاهی ارسال کنید.

    `aspectRatio: "adaptive"` نسبت را از تصویر ورودی به‌طور خودکار تشخیص می‌دهد.
    `audio: true` به `generate_audio` نگاشت می‌شود. `providerOptions.seed`
    (عدد) ارسال می‌شود.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    به Plugin
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    نیاز دارد. شناسه ارائه‌دهنده: `byteplus-seedance2`. مدل‌ها:
    `dreamina-seedance-2-0-260128`،
    `dreamina-seedance-2-0-fast-260128`.

    از API یکپارچه `content[]` استفاده می‌کند. حداکثر از ۹ تصویر مرجع،
    ۳ ویدیوی مرجع و ۳ صوت مرجع پشتیبانی می‌کند. همه ورودی‌ها باید URLهای راه‌دور
    `https://` باشند. روی هر دارایی `role` را تنظیم کنید - مقادیر پشتیبانی‌شده:
    `"first_frame"`، `"last_frame"`، `"reference_image"`،
    `"reference_video"`، `"reference_audio"`.

    `aspectRatio: "adaptive"` نسبت را از تصویر ورودی به‌طور خودکار تشخیص می‌دهد.
    `audio: true` به `generate_audio` نگاشت می‌شود. `providerOptions.seed`
    (عدد) ارسال می‌شود.

  </Accordion>
  <Accordion title="ComfyUI">
    اجرای محلی یا ابری مبتنی بر workflow. از text-to-video و
    image-to-video از طریق گراف پیکربندی‌شده پشتیبانی می‌کند.
  </Accordion>
  <Accordion title="fal">
    برای jobهای طولانی‌مدت از جریانی با پشتوانه صف استفاده می‌کند. OpenClaw به‌طور پیش‌فرض تا ۲۰
    دقیقه منتظر می‌ماند و پس از آن یک job در حال اجرای صف fal را دارای timeout
    در نظر می‌گیرد. بیشتر مدل‌های ویدئویی fal
    یک مرجع تصویر واحد را می‌پذیرند. مدل‌های reference-to-video
    مربوط به Seedance 2.0 تا ۹ تصویر، ۳ ویدئو، و ۳ مرجع صوتی را می‌پذیرند، با
    حداکثر ۱۲ فایل مرجع در مجموع.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    از یک مرجع تصویر یا یک مرجع ویدئو پشتیبانی می‌کند. درخواست‌های صدای تولیدشده
    در مسیر Gemini API با یک هشدار نادیده گرفته می‌شوند، زیرا آن API
    پارامتر `generateAudio` را برای تولید ویدئوی فعلی Veo رد می‌کند.
  </Accordion>
  <Accordion title="MiniMax">
    فقط یک مرجع تصویر واحد. MiniMax وضوح‌های `768P` و `1080P`
    را می‌پذیرد؛ درخواست‌هایی مانند `720P` پیش از ارسال به نزدیک‌ترین
    مقدار پشتیبانی‌شده عادی‌سازی می‌شوند.
  </Accordion>
  <Accordion title="OpenAI">
    فقط override مربوط به `size` ارسال می‌شود. overrideهای سبک دیگر
    (`aspectRatio`، `resolution`، `audio`، `watermark`) با
    یک هشدار نادیده گرفته می‌شوند.
  </Accordion>
  <Accordion title="OpenRouter">
    از API ناهمگام `/videos` مربوط به OpenRouter استفاده می‌کند. OpenClaw
    job را ارسال می‌کند، `polling_url` را poll می‌کند، و یا `unsigned_urls` یا
    endpoint مستندشده محتوای job را دانلود می‌کند. پیش‌فرض همراه `google/veo-3.1-fast`
    مدت‌زمان‌های ۴/۶/۸ ثانیه، وضوح‌های `720P`/`1080P`، و
    نسبت‌های تصویر `16:9`/`9:16` را اعلام می‌کند.
  </Accordion>
  <Accordion title="Qwen">
    همان backend مربوط به DashScope را مانند Alibaba دارد. ورودی‌های مرجع باید URLهای راه‌دور
    `http(s)` باشند؛ فایل‌های محلی از ابتدا رد می‌شوند.
  </Accordion>
  <Accordion title="Runway">
    از فایل‌های محلی از طریق data URIها پشتیبانی می‌کند. video-to-video به
    `runway/gen4_aleph` نیاز دارد. اجراهای فقط متنی نسبت‌های تصویر `16:9` و `9:16`
    را ارائه می‌کنند.
  </Accordion>
  <Accordion title="Together">
    فقط یک مرجع تصویر واحد.
  </Accordion>
  <Accordion title="Vydra">
    برای جلوگیری از redirectهایی که auth را حذف می‌کنند، مستقیما از `https://www.vydra.ai/api/v1`
    استفاده می‌کند. `veo3` فقط به‌صورت text-to-video همراه شده است؛ `kling` به
    یک URL تصویر راه‌دور نیاز دارد.
  </Accordion>
  <Accordion title="xAI">
    از text-to-video، image-to-video با یک تصویر first-frame واحد، تا ۷
    ورودی `reference_image` از طریق `reference_images` متعلق به xAI، و جریان‌های
    ویرایش/گسترش ویدئوی راه‌دور پشتیبانی می‌کند.
  </Accordion>
</AccordionGroup>

## حالت‌های قابلیت provider

قرارداد مشترک تولید ویدئو به‌جای فقط محدودیت‌های تجمیعی تخت، از قابلیت‌های
ویژه هر حالت پشتیبانی می‌کند. پیاده‌سازی‌های جدید provider باید
بلوک‌های حالت صریح را ترجیح دهند:

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
برای اعلام پشتیبانی از حالت transform **کافی نیستند**. providerها باید
`generate`، `imageToVideo`، و `videoToVideo` را صریحا اعلام کنند تا
تست‌های زنده، تست‌های قرارداد، و ابزار مشترک `video_generate` بتوانند
پشتیبانی از حالت را به‌صورت قطعی اعتبارسنجی کنند.

وقتی یک مدل در یک provider نسبت به بقیه از پشتیبانی گسترده‌تری برای ورودی مرجع
برخوردار است، به‌جای افزایش محدودیت کل حالت، از `maxInputImagesByModel`،
`maxInputVideosByModel`، یا `maxInputAudiosByModel` استفاده کنید.

## تست‌های زنده

پوشش زنده opt-in برای providerهای همراه مشترک:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

wrapper مخزن:

```bash
pnpm test:live:media video
```

این فایل زنده env varهای provider را که موجود نیستند از `~/.profile` بارگذاری می‌کند، به‌طور پیش‌فرض
کلیدهای API زنده/env را بر auth profileهای ذخیره‌شده ترجیح می‌دهد، و به‌طور پیش‌فرض یک smoke
ایمن برای release اجرا می‌کند:

- `generate` برای هر provider غیر FAL در sweep.
- prompt خرچنگ یک‌ثانیه‌ای.
- سقف عملیات برای هر provider از
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` به‌طور پیش‌فرض).

FAL به‌صورت opt-in است، زیرا latency صف سمت provider می‌تواند بر زمان release
غلبه کند:

```bash
pnpm test:live:media video --video-providers fal
```

برای اجرای حالت‌های transform اعلام‌شده‌ای که sweep مشترک می‌تواند با رسانه محلی به‌صورت ایمن تمرین کند نیز
`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` را تنظیم کنید:

- `imageToVideo` وقتی `capabilities.imageToVideo.enabled`.
- `videoToVideo` وقتی `capabilities.videoToVideo.enabled` و
  provider/model ورودی ویدئوی محلی buffer-backed را در sweep مشترک
  می‌پذیرد.

امروز lane زنده مشترک `videoToVideo` فقط زمانی `runway` را پوشش می‌دهد که
`runway/gen4_aleph` را انتخاب کنید.

## پیکربندی

مدل پیش‌فرض تولید ویدئو را در پیکربندی OpenClaw خود تنظیم کنید:

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
- [کارهای پس‌زمینه](/fa/automation/tasks) - ردیابی task برای تولید ویدئوی ناهمگام
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
