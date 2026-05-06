---
read_when:
    - تولید ویدئوها از طریق عامل
    - پیکربندی ارائه‌دهندگان و مدل‌های تولید ویدئو
    - آشنایی با پارامترهای ابزار video_generate
sidebarTitle: Video generation
summary: ویدئوها را از طریق video_generate از مراجع متنی، تصویری یا ویدئویی در ۱۶ بک‌اند ارائه‌دهنده تولید کنید
title: تولید ویدئو
x-i18n:
    generated_at: "2026-05-06T09:49:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: ebc8b61785f69c1354951be2d6b3e7b437c99994513f13e19faf3a9e420263fb
    source_path: tools/video-generation.md
    workflow: 16
---

عامل‌های OpenClaw می‌توانند از پرامپت‌های متنی، تصاویر مرجع، یا
ویدیوهای موجود ویدیو تولید کنند. شانزده بک‌اند ارائه‌دهنده پشتیبانی می‌شوند
که هرکدام گزینه‌های مدل، حالت‌های ورودی، و مجموعه قابلیت‌های متفاوتی دارند.
عامل بر اساس پیکربندی شما و کلیدهای API موجود، ارائه‌دهنده مناسب را به‌صورت
خودکار انتخاب می‌کند.

<Note>
ابزار `video_generate` فقط زمانی ظاهر می‌شود که دست‌کم یک ارائه‌دهنده
تولید ویدیو در دسترس باشد. اگر آن را در ابزارهای عامل خود نمی‌بینید، یک
کلید API ارائه‌دهنده تنظیم کنید یا `agents.defaults.videoGenerationModel` را
پیکربندی کنید.
</Note>

OpenClaw تولید ویدیو را به‌عنوان سه حالت زمان اجرا در نظر می‌گیرد:

- `generate` - درخواست‌های متن به ویدیو بدون رسانه مرجع.
- `imageToVideo` - درخواست شامل یک یا چند تصویر مرجع است.
- `videoToVideo` - درخواست شامل یک یا چند ویدیوی مرجع است.

ارائه‌دهندگان می‌توانند هر زیرمجموعه‌ای از این حالت‌ها را پشتیبانی کنند.
ابزار، حالت فعال را پیش از ارسال اعتبارسنجی می‌کند و حالت‌های پشتیبانی‌شده
را در `action=list` گزارش می‌دهد.

## شروع سریع

<Steps>
  <Step title="Configure auth">
    برای هر ارائه‌دهنده پشتیبانی‌شده یک کلید API تنظیم کنید:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Pick a default model (optional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Ask the agent">
    > یک ویدیوی سینمایی ۵ ثانیه‌ای از یک خرچنگ دریایی دوستانه که هنگام غروب موج‌سواری می‌کند تولید کن.

    عامل به‌صورت خودکار `video_generate` را فراخوانی می‌کند. نیازی به
    قرار دادن ابزار در فهرست مجاز نیست.

  </Step>
</Steps>

## تولید ناهمگام چگونه کار می‌کند

تولید ویدیو ناهمگام است. وقتی عامل در یک نشست `video_generate` را فراخوانی
می‌کند:

1. OpenClaw درخواست را به ارائه‌دهنده ارسال می‌کند و بلافاصله یک شناسه وظیفه برمی‌گرداند.
2. ارائه‌دهنده کار را در پس‌زمینه پردازش می‌کند (معمولاً ۳۰ ثانیه تا چند دقیقه، بسته به ارائه‌دهنده و وضوح؛ ارائه‌دهندگان کند مبتنی بر صف می‌توانند تا زمان انقضای پیکربندی‌شده اجرا شوند).
3. وقتی ویدیو آماده شد، OpenClaw همان نشست را با یک رویداد تکمیل داخلی بیدار می‌کند.
4. عامل به کاربر اطلاع می‌دهد و ویدیوی تکمیل‌شده را پیوست می‌کند. در چت‌های گروهی/کانالی
   که از تحویل قابل‌مشاهده فقط از طریق ابزار پیام استفاده می‌کنند، عامل نتیجه را
   به‌جای اینکه OpenClaw مستقیماً آن را منتشر کند، از طریق ابزار پیام ارسال می‌کند.

وقتی یک کار در حال اجرا است، فراخوانی‌های تکراری `video_generate` در همان
نشست به‌جای شروع یک تولید دیگر، وضعیت فعلی وظیفه را برمی‌گردانند. برای
بررسی پیشرفت از CLI از `openclaw tasks list` یا `openclaw tasks show <taskId>`
استفاده کنید.

خارج از اجراهای عاملِ پشتیبانی‌شده با نشست (برای نمونه، فراخوانی‌های مستقیم
ابزار)، ابزار به تولید درون‌خطی بازمی‌گردد و مسیر رسانه نهایی را در همان نوبت
برمی‌گرداند.

فایل‌های ویدیویی تولیدشده، وقتی ارائه‌دهنده بایت‌ها را برمی‌گرداند، در فضای
ذخیره‌سازی رسانه مدیریت‌شده توسط OpenClaw ذخیره می‌شوند. سقف پیش‌فرض ذخیره
ویدیوی تولیدشده از محدودیت رسانه ویدیو پیروی می‌کند و
`agents.defaults.mediaMaxMb` آن را برای رندرهای بزرگ‌تر افزایش می‌دهد. وقتی
ارائه‌دهنده همچنین یک URL خروجی میزبانی‌شده برمی‌گرداند، اگر پایداری محلی
یک فایل بیش‌ازحد بزرگ را رد کند، OpenClaw می‌تواند آن URL را به‌جای ناموفق
کردن وظیفه تحویل دهد.

### چرخه حیات وظیفه

| وضعیت       | معنا                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | وظیفه ایجاد شده و منتظر پذیرش آن توسط ارائه‌دهنده است.                                                   |
| `running`   | ارائه‌دهنده در حال پردازش است (معمولاً ۳۰ ثانیه تا چند دقیقه بسته به ارائه‌دهنده و وضوح). |
| `succeeded` | ویدیو آماده است؛ عامل بیدار می‌شود و آن را در مکالمه منتشر می‌کند.                                         |
| `failed`    | خطای ارائه‌دهنده یا پایان مهلت؛ عامل با جزئیات خطا بیدار می‌شود.                                         |

وضعیت را از CLI بررسی کنید:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

اگر یک وظیفه ویدیو برای نشست فعلی از قبل `queued` یا `running` باشد،
`video_generate` به‌جای شروع یک وظیفه جدید، وضعیت وظیفه موجود را برمی‌گرداند.
برای بررسی صریح بدون آغاز تولید جدید، از `action: "status"` استفاده کنید.

## ارائه‌دهندگان پشتیبانی‌شده

| ارائه‌دهنده              | مدل پیش‌فرض                   | متن | مرجع تصویر                                            | مرجع ویدیو                                       | احراز هویت                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | بله (URL راه دور)                                     | بله (URL راه دور)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | تا ۲ تصویر (فقط مدل‌های I2V؛ فریم اول + آخر) | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | تا ۲ تصویر (فریم اول + آخر از طریق نقش)         | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | تا ۹ تصویر مرجع                             | تا ۳ ویدیو                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | ۱ تصویر                                              | -                                               | `COMFY_API_KEY` یا `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | ۱ تصویر؛ تا ۹ تصویر با Seedance reference-to-video    | تا ۳ ویدیو با Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | ۱ تصویر                                              | ۱ ویدیو                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | ۱ تصویر                                              | -                                               | `MINIMAX_API_KEY` یا MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | ۱ تصویر                                              | ۱ ویدیو                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | تا ۴ تصویر (فریم اول/آخر یا مراجع)      | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | بله (URL راه دور)                                     | بله (URL راه دور)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | ۱ تصویر                                              | ۱ ویدیو                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | ۱ تصویر                                              | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | ۱ تصویر (`kling`)                                    | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | ۱ تصویر فریم اول یا تا ۷ `reference_image`    | ۱ ویدیو                                         | `XAI_API_KEY`                            |

برخی ارائه‌دهندگان متغیرهای محیطی کلید API اضافی یا جایگزین را می‌پذیرند.
برای جزئیات، صفحه‌های جداگانه [ارائه‌دهنده](#related) را ببینید.

برای بررسی ارائه‌دهندگان، مدل‌ها، و حالت‌های زمان اجرای موجود در زمان اجرا،
`video_generate action=list` را اجرا کنید.

### ماتریس قابلیت‌ها

قرارداد حالت صریح که توسط `video_generate`، آزمون‌های قرارداد، و جاروب زنده
مشترک استفاده می‌شود:

| ارائه‌دهنده   | `generate` | `imageToVideo` | `videoToVideo` | مسیرهای زنده مشترک امروز                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` رد می‌شود چون این ارائه‌دهنده به URLهای ویدیویی راه دور `http(s)` نیاز دارد                               |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       -        | در جاروب مشترک نیست؛ پوشش وابسته به workflow همراه آزمون‌های Comfy قرار دارد                                                               |
| DeepInfra  |     ✓      |       -        |       -        | `generate`؛ طرحواره‌های ویدیوی بومی DeepInfra در قرارداد بسته‌بندی‌شده متن به ویدیو هستند                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` فقط هنگام استفاده از Seedance reference-to-video                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` مشترک رد می‌شود چون جاروب Gemini/Veo فعلیِ مبتنی بر بافر آن ورودی را نمی‌پذیرد  |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` مشترک رد می‌شود چون این سازمان/مسیر ورودی در حال حاضر به دسترسی inpaint/remix سمت ارائه‌دهنده نیاز دارد |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` رد می‌شود چون این ارائه‌دهنده به URLهای ویدیویی راه دور `http(s)` نیاز دارد                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` فقط وقتی اجرا می‌شود که مدل انتخاب‌شده `runway/gen4_aleph` باشد                                      |
| Together   |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       -        | `generate`؛ `imageToVideo` مشترک رد می‌شود چون `veo3` بسته‌بندی‌شده فقط متنی است و `kling` بسته‌بندی‌شده به URL تصویر راه دور نیاز دارد            |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` رد می‌شود چون این ارائه‌دهنده در حال حاضر به URL راه دور MP4 نیاز دارد                                |

## پارامترهای ابزار

### الزامی

<ParamField path="prompt" type="string" required>
  شرح متنی ویدیویی که باید تولید شود. برای `action: "generate"` الزامی است.
</ParamField>

### ورودی‌های محتوا

<ParamField path="image" type="string">یک تصویر مرجع (مسیر یا URL).</ParamField>
<ParamField path="images" type="string[]">چند تصویر مرجع (حداکثر 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
راهنماهای اختیاری نقش برای هر موقعیت، موازی با فهرست ترکیبی تصویرها.
مقادیر رسمی: `first_frame`، `last_frame`، `reference_image`.
</ParamField>
<ParamField path="video" type="string">یک ویدیوی مرجع (مسیر یا URL).</ParamField>
<ParamField path="videos" type="string[]">چند ویدیوی مرجع (حداکثر 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
راهنماهای اختیاری نقش برای هر موقعیت، موازی با فهرست ترکیبی ویدیوها.
مقدار رسمی: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
یک صدای مرجع (مسیر یا URL). برای موسیقی پس‌زمینه یا مرجع صدا
زمانی استفاده می‌شود که ارائه‌دهنده از ورودی‌های صوتی پشتیبانی کند.
</ParamField>
<ParamField path="audioRefs" type="string[]">چند صدای مرجع (حداکثر 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
راهنماهای اختیاری نقش برای هر موقعیت، موازی با فهرست ترکیبی صداها.
مقدار رسمی: `reference_audio`.
</ParamField>

<Note>
راهنماهای نقش همان‌طور که هستند به ارائه‌دهنده ارسال می‌شوند. مقادیر رسمی از
اتحاد `VideoGenerationAssetRole` می‌آیند، اما ارائه‌دهندگان ممکن است رشته‌های
نقش بیشتری را بپذیرند. آرایه‌های `*Roles` نباید ورودی‌های بیشتری از فهرست مرجع
متناظر داشته باشند؛ خطاهای یکی‌کم یا یکی‌زیاد با خطایی روشن شکست می‌خورند.
برای تنظیم‌نشدن یک جایگاه، از رشته خالی استفاده کنید. برای xAI، نقش همه تصویرها را روی
`reference_image` تنظیم کنید تا از حالت تولید `reference_images` آن استفاده شود؛ برای تبدیل تصویر به ویدیو با یک تصویر، نقش را حذف کنید یا از `first_frame` استفاده کنید.
</Note>

### کنترل‌های سبک

<ParamField path="aspectRatio" type="string">
  راهنمای نسبت تصویر مانند `1:1`، `16:9`، `9:16`، `adaptive`، یا مقداری ویژه ارائه‌دهنده. OpenClaw مقادیر پشتیبانی‌نشده را بسته به ارائه‌دهنده عادی‌سازی یا نادیده می‌گیرد.
</ParamField>
<ParamField path="resolution" type="string">راهنمای وضوح مانند `480P`، `720P`، `768P`، `1080P`، `4K`، یا مقداری ویژه ارائه‌دهنده. OpenClaw مقادیر پشتیبانی‌نشده را بسته به ارائه‌دهنده عادی‌سازی یا نادیده می‌گیرد.</ParamField>
<ParamField path="durationSeconds" type="number">
  مدت هدف به ثانیه (گردشده به نزدیک‌ترین مقدار پشتیبانی‌شده توسط ارائه‌دهنده).
</ParamField>
<ParamField path="size" type="string">راهنمای اندازه زمانی که ارائه‌دهنده از آن پشتیبانی کند.</ParamField>
<ParamField path="audio" type="boolean">
  فعال‌کردن صدای تولیدشده در خروجی، در صورت پشتیبانی. متمایز از `audioRef*` (ورودی‌ها).
</ParamField>
<ParamField path="watermark" type="boolean">روشن/خاموش‌کردن واترمارک ارائه‌دهنده، در صورت پشتیبانی.</ParamField>

`adaptive` یک نگهبان ویژه ارائه‌دهنده است: همان‌طور که هست به
ارائه‌دهندگانی ارسال می‌شود که `adaptive` را در قابلیت‌های خود اعلام کرده‌اند (برای نمونه BytePlus
Seedance از آن برای تشخیص خودکار نسبت از ابعاد تصویر ورودی استفاده می‌کند).
ارائه‌دهندگانی که آن را اعلام نکرده‌اند، مقدار را از طریق
`details.ignoredOverrides` در نتیجه ابزار نمایش می‌دهند تا حذف آن قابل مشاهده باشد.

### پیشرفته

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` وظیفه فعلی نشست را برمی‌گرداند؛ `"list"` ارائه‌دهندگان را بررسی می‌کند.
</ParamField>
<ParamField path="model" type="string">بازنویسی ارائه‌دهنده/مدل (برای نمونه `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">راهنمای نام فایل خروجی.</ParamField>
<ParamField path="timeoutMs" type="number">مهلت زمانی اختیاری عملیات ارائه‌دهنده به میلی‌ثانیه.</ParamField>
<ParamField path="providerOptions" type="object">
  گزینه‌های ویژه ارائه‌دهنده به‌صورت یک شیء JSON (برای نمونه `{"seed": 42, "draft": true}`).
  ارائه‌دهندگانی که یک شِمای تایپ‌شده اعلام می‌کنند، کلیدها و نوع‌ها را اعتبارسنجی می‌کنند؛ کلیدهای ناشناخته
  یا ناسازگاری‌ها باعث می‌شوند آن نامزد در هنگام fallback کنار گذاشته شود. ارائه‌دهندگان بدون شِمای
  اعلام‌شده گزینه‌ها را همان‌طور که هستند دریافت می‌کنند. `video_generate action=list` را اجرا کنید
  تا ببینید هر ارائه‌دهنده چه چیزهایی را می‌پذیرد.
</ParamField>

<Note>
همه ارائه‌دهندگان از همه پارامترها پشتیبانی نمی‌کنند. OpenClaw مدت را به
نزدیک‌ترین مقدار پشتیبانی‌شده توسط ارائه‌دهنده عادی‌سازی می‌کند و راهنماهای هندسی ترجمه‌شده
مانند اندازه به نسبت تصویر را زمانی بازنگاشت می‌کند که یک ارائه‌دهنده fallback سطح کنترل متفاوتی
ارائه کند. بازنویسی‌های واقعاً پشتیبانی‌نشده به‌صورت بهترین تلاش
نادیده گرفته می‌شوند و در نتیجه ابزار به‌عنوان هشدار گزارش می‌شوند. محدودیت‌های سخت قابلیت
(مانند تعداد بیش از حد ورودی‌های مرجع) پیش از ارسال شکست می‌خورند. نتایج ابزار
تنظیمات اعمال‌شده را گزارش می‌کنند؛ `details.normalization` هر ترجمه
از درخواست‌شده به اعمال‌شده را ثبت می‌کند.
</Note>

ورودی‌های مرجع حالت اجرا را انتخاب می‌کنند:

- بدون رسانه مرجع → `generate`
- هر مرجع تصویر → `imageToVideo`
- هر مرجع ویدیو → `videoToVideo`
- ورودی‌های صدای مرجع حالت حل‌شده را **تغییر نمی‌دهند**؛ آن‌ها روی
  هر حالتی که مرجع‌های تصویر/ویدیو انتخاب می‌کنند اعمال می‌شوند، و فقط با
  ارائه‌دهندگانی کار می‌کنند که `maxInputAudios` را اعلام کرده‌اند.

ترکیب مرجع‌های تصویر و ویدیو یک سطح قابلیت مشترک پایدار نیست.
برای هر درخواست، یک نوع مرجع را ترجیح دهید.

#### Fallback و گزینه‌های تایپ‌شده

برخی بررسی‌های قابلیت در لایه fallback اعمال می‌شوند نه در مرز
ابزار، بنابراین درخواستی که از محدودیت‌های ارائه‌دهنده اصلی فراتر می‌رود
هنوز می‌تواند روی یک fallback توانا اجرا شود:

- نامزد فعال که هیچ `maxInputAudios` اعلام نکرده است (یا `0`) زمانی کنار گذاشته می‌شود که
  درخواست شامل مرجع‌های صوتی باشد؛ نامزد بعدی امتحان می‌شود.
- `maxDurationSeconds` نامزد فعال کمتر از `durationSeconds` درخواست‌شده
  بدون فهرست اعلام‌شده `supportedDurationSeconds` → کنار گذاشته می‌شود.
- درخواست شامل `providerOptions` است و نامزد فعال صراحتاً
  یک شِمای تایپ‌شده `providerOptions` اعلام می‌کند → اگر کلیدهای ارائه‌شده
  در شِما نباشند یا نوع مقدارها همخوان نباشند، کنار گذاشته می‌شود. ارائه‌دهندگان بدون
  شِمای اعلام‌شده گزینه‌ها را همان‌طور که هستند دریافت می‌کنند (گذر سازگار با گذشته).
  یک ارائه‌دهنده می‌تواند با اعلام یک شِمای خالی
  (`capabilities.providerOptions: {}`) از همه گزینه‌های ارائه‌دهنده انصراف دهد، که
  همان کنارگذاری مانند ناسازگاری نوع را ایجاد می‌کند.

اولین دلیل کنارگذاری در یک درخواست در سطح `warn` ثبت می‌شود تا اپراتورها ببینند چه زمانی
ارائه‌دهنده اصلی آن‌ها نادیده گرفته شده است؛ کنارگذاری‌های بعدی در سطح `debug` ثبت می‌شوند تا
زنجیره‌های fallback طولانی آرام بمانند. اگر همه نامزدها کنار گذاشته شوند،
خطای تجمیع‌شده دلیل کنارگذاری هرکدام را شامل می‌شود.

## کنش‌ها

| کنش       | کاری که انجام می‌دهد                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | پیش‌فرض. از اعلان داده‌شده و ورودی‌های مرجع اختیاری یک ویدیو می‌سازد.                             |
| `status`   | وضعیت وظیفه ویدیویی در حال انجام برای نشست فعلی را بدون شروع تولیدی دیگر بررسی می‌کند. |
| `list`     | ارائه‌دهندگان، مدل‌ها و قابلیت‌های موجود آن‌ها را نشان می‌دهد.                                                |

## انتخاب مدل

OpenClaw مدل را به این ترتیب حل می‌کند:

1. **پارامتر ابزار `model`** - اگر عامل در فراخوانی یکی مشخص کند.
2. **`videoGenerationModel.primary`** از پیکربندی.
3. **`videoGenerationModel.fallbacks`** به‌ترتیب.
4. **تشخیص خودکار** - ارائه‌دهندگانی که احراز هویت معتبر دارند، با شروع از
   ارائه‌دهنده پیش‌فرض فعلی، سپس ارائه‌دهندگان باقی‌مانده به‌ترتیب الفبایی.

اگر یک ارائه‌دهنده شکست بخورد، نامزد بعدی به‌طور خودکار امتحان می‌شود. اگر همه
نامزدها شکست بخورند، خطا جزئیات هر تلاش را شامل می‌شود.

`agents.defaults.mediaGenerationAutoProviderFallback: false` را تنظیم کنید تا فقط از
ورودی‌های صریح `model`، `primary`، و `fallbacks` استفاده شود.

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
    از نقطه پایانی ناهمگام DashScope / Model Studio استفاده می‌کند. تصویرها و
    ویدیوهای مرجع باید URLهای `http(s)` راه‌دور باشند.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    شناسه ارائه‌دهنده: `byteplus`.

    مدل‌ها: `seedance-1-0-pro-250528` (پیش‌فرض)،
    `seedance-1-0-pro-t2v-250528`، `seedance-1-0-pro-fast-251015`،
    `seedance-1-0-lite-t2v-250428`، `seedance-1-0-lite-i2v-250428`.

    مدل‌های T2V (`*-t2v-*`) ورودی تصویر را نمی‌پذیرند؛ مدل‌های I2V و
    مدل‌های عمومی `*-pro-*` از یک تصویر مرجع (فریم اول) پشتیبانی می‌کنند.
    تصویر را به‌صورت موقعیتی ارسال کنید یا `role: "first_frame"` را تنظیم کنید.
    وقتی تصویری ارائه شود، شناسه‌های مدل T2V به‌طور خودکار به گونه I2V
    متناظر تغییر داده می‌شوند.

    کلیدهای پشتیبانی‌شده `providerOptions`: `seed` (عدد)، `draft` (بولی -
    اجبار به 480p)، `camera_fixed` (بولی).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    به Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    نیاز دارد. شناسه ارائه‌دهنده: `byteplus-seedance15`. مدل:
    `seedance-1-5-pro-251215`.

    از API یکپارچه `content[]` استفاده می‌کند. حداکثر از 2 تصویر ورودی
    (`first_frame` + `last_frame`) پشتیبانی می‌کند. همه ورودی‌ها باید URLهای راه‌دور `https://`
    باشند. روی هر تصویر `role: "first_frame"` / `"last_frame"` را تنظیم کنید، یا
    تصویرها را به‌صورت موقعیتی ارسال کنید.

    `aspectRatio: "adaptive"` نسبت را از تصویر ورودی به‌طور خودکار تشخیص می‌دهد.
    `audio: true` به `generate_audio` نگاشت می‌شود. `providerOptions.seed`
    (عدد) ارسال می‌شود.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    به Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    نیاز دارد. شناسه ارائه‌دهنده: `byteplus-seedance2`. مدل‌ها:
    `dreamina-seedance-2-0-260128`،
    `dreamina-seedance-2-0-fast-260128`.

    از API یکپارچه `content[]` استفاده می‌کند. از حداکثر 9 تصویر مرجع،
    3 ویدیوی مرجع، و 3 صدای مرجع پشتیبانی می‌کند. همه ورودی‌ها باید URLهای راه‌دور
    `https://` باشند. روی هر دارایی `role` را تنظیم کنید - مقادیر پشتیبانی‌شده:
    `"first_frame"`، `"last_frame"`، `"reference_image"`،
    `"reference_video"`، `"reference_audio"`.

    `aspectRatio: "adaptive"` نسبت را از تصویر ورودی به‌طور خودکار تشخیص می‌دهد.
    `audio: true` به `generate_audio` نگاشت می‌شود. `providerOptions.seed`
    (عدد) ارسال می‌شود.

  </Accordion>
  <Accordion title="ComfyUI">
    اجرای محلی یا ابری مبتنی بر گردش‌کار. از تبدیل متن به ویدیو و
    تصویر به ویدیو از طریق گراف پیکربندی‌شده پشتیبانی می‌کند.
  </Accordion>
  <Accordion title="fal">
    برای کارهای طولانی‌مدت از جریانی مبتنی بر صف استفاده می‌کند. OpenClaw به‌طور پیش‌فرض تا 20
    دقیقه منتظر می‌ماند، سپس یک کار در صف fal را که هنوز در حال اجراست
    منقضی‌شده تلقی می‌کند. بیشتر مدل‌های ویدیوی fal
    یک مرجع تصویر واحد را می‌پذیرند. مدل‌های مرجع‌به‌ویدیوی Seedance 2.0
    تا 9 تصویر، 3 ویدیو، و 3 مرجع صوتی را می‌پذیرند، با
    حداکثر 12 فایل مرجع در مجموع.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    از یک مرجع تصویر یا یک مرجع ویدیو پشتیبانی می‌کند. درخواست‌های صدای تولیدشده
    در مسیر Gemini API با یک هشدار نادیده گرفته می‌شوند، زیرا آن API
    پارامتر `generateAudio` را برای تولید ویدیوی فعلی Veo رد می‌کند.
  </Accordion>
  <Accordion title="MiniMax">
    فقط مرجع تصویر تکی. MiniMax وضوح‌های `768P` و `1080P`
    را می‌پذیرد؛ درخواست‌هایی مانند `720P` پیش از ارسال به نزدیک‌ترین
    مقدار پشتیبانی‌شده عادی‌سازی می‌شوند.
  </Accordion>
  <Accordion title="OpenAI">
    فقط override مربوط به `size` ارسال می‌شود. سایر overrideهای سبک
    (`aspectRatio`، `resolution`، `audio`، `watermark`) با
    یک هشدار نادیده گرفته می‌شوند.
  </Accordion>
  <Accordion title="OpenRouter">
    از API ناهمگام `/videos` متعلق به OpenRouter استفاده می‌کند. OpenClaw
    کار را ارسال می‌کند، `polling_url` را نظرسنجی می‌کند، و یا `unsigned_urls`
    یا نقطه پایانی مستندشده محتوای کار را دانلود می‌کند. پیش‌فرض بسته‌بندی‌شده
    `google/veo-3.1-fast` مدت‌زمان‌های 4/6/8 ثانیه، وضوح‌های
    `720P`/`1080P`، و نسبت‌های تصویر `16:9`/`9:16` را اعلام می‌کند.
  </Accordion>
  <Accordion title="Qwen">
    همان backend مربوط به DashScope مثل Alibaba. ورودی‌های مرجع باید URLهای راه دور
    `http(s)` باشند؛ فایل‌های محلی از ابتدا رد می‌شوند.
  </Accordion>
  <Accordion title="Runway">
    از فایل‌های محلی از طریق URIهای داده پشتیبانی می‌کند. تبدیل ویدیو به ویدیو به
    `runway/gen4_aleph` نیاز دارد. اجراهای فقط متنی نسبت‌های تصویر
    `16:9` و `9:16` را ارائه می‌کنند.
  </Accordion>
  <Accordion title="Together">
    فقط مرجع تصویر تکی.
  </Accordion>
  <Accordion title="Vydra">
    مستقیماً از `https://www.vydra.ai/api/v1` استفاده می‌کند تا از redirectهایی که
    احراز هویت را حذف می‌کنند جلوگیری شود. `veo3` فقط به‌صورت تبدیل متن به ویدیو بسته‌بندی شده است؛ `kling`
    به یک URL تصویر راه دور نیاز دارد.
  </Accordion>
  <Accordion title="xAI">
    از تبدیل متن به ویدیو، تبدیل تصویر به ویدیو با یک تصویر فریم اول، تا 7
    ورودی `reference_image` از طریق `reference_images` متعلق به xAI، و جریان‌های
    ویرایش/گسترش ویدیوی راه دور پشتیبانی می‌کند.
  </Accordion>
</AccordionGroup>

## حالت‌های قابلیت ارائه‌دهنده

قرارداد مشترک تولید ویدیو به‌جای فقط محدودیت‌های تجمیعی تخت، از قابلیت‌های
مختص هر حالت پشتیبانی می‌کند. پیاده‌سازی‌های جدید ارائه‌دهنده
باید بلوک‌های صریح حالت را ترجیح دهند:

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

فیلدهای تجمیعی تخت مانند `maxInputImages` و `maxInputVideos` برای
اعلام پشتیبانی از حالت تبدیل **کافی نیستند**. ارائه‌دهنده‌ها باید
`generate`، `imageToVideo` و `videoToVideo` را به‌صورت صریح اعلام کنند تا
آزمون‌های زنده، آزمون‌های قرارداد، و ابزار مشترک `video_generate` بتوانند
پشتیبانی از حالت را به‌صورت قطعی اعتبارسنجی کنند.

وقتی یک مدل در یک ارائه‌دهنده پشتیبانی گسترده‌تری از ورودی مرجع نسبت به
بقیه دارد، به‌جای بالا بردن محدودیت سراسری حالت، از `maxInputImagesByModel`،
`maxInputVideosByModel`، یا `maxInputAudiosByModel` استفاده کنید.

## آزمون‌های زنده

پوشش زنده اختیاری برای ارائه‌دهنده‌های بسته‌بندی‌شده مشترک:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper مخزن:

```bash
pnpm test:live:media video
```

این فایل زنده متغیرهای محیطی ارائه‌دهنده را که موجود نیستند از `~/.profile` بارگذاری می‌کند، به‌طور پیش‌فرض
کلیدهای API زنده/محیطی را پیش از پروفایل‌های احراز هویت ذخیره‌شده ترجیح می‌دهد، و به‌طور پیش‌فرض یک
smoke امن برای انتشار اجرا می‌کند:

- `generate` برای هر ارائه‌دهنده غیر FAL در پیمایش.
- اعلان یک‌ثانیه‌ای خرچنگ دریایی.
- سقف عملیات برای هر ارائه‌دهنده از
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` به‌طور پیش‌فرض).

FAL اختیاری است، زیرا تأخیر صف در سمت ارائه‌دهنده می‌تواند زمان انتشار
را غالب کند:

```bash
pnpm test:live:media video --video-providers fal
```

برای اجرای حالت‌های تبدیل اعلام‌شده‌ای که پیمایش مشترک می‌تواند با رسانه محلی
به‌صورت امن تمرین کند نیز `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` را تنظیم کنید:

- `imageToVideo` وقتی `capabilities.imageToVideo.enabled`.
- `videoToVideo` وقتی `capabilities.videoToVideo.enabled` و
  ارائه‌دهنده/مدل در پیمایش مشترک ورودی ویدیوی محلی مبتنی بر buffer را می‌پذیرد.

امروز مسیر زنده مشترک `videoToVideo` فقط وقتی `runway` را پوشش می‌دهد که
`runway/gen4_aleph` را انتخاب کنید.

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
- [وظایف پس‌زمینه](/fa/automation/tasks) - رهگیری وظیفه برای تولید ویدیوی ناهمگام
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
