---
read_when:
    - تولید ویدیوها از طریق عامل
    - پیکربندی ارائه‌دهندگان و مدل‌های تولید ویدئو
    - درک پارامترهای ابزار video_generate
sidebarTitle: Video generation
summary: با استفاده از video_generate و بر پایه ارجاع‌های متنی، تصویری یا ویدیویی در 16 بک‌اند ارائه‌دهنده، ویدیو تولید کنید
title: تولید ویدئو
x-i18n:
    generated_at: "2026-04-29T23:47:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91409057210af560d389513c2049d643c3e1602df51aa9825ceb01571626cdf
    source_path: tools/video-generation.md
    workflow: 16
---

عامل‌های OpenClaw می‌توانند از اعلان‌های متنی، تصاویر مرجع، یا
ویدیوهای موجود ویدیو تولید کنند. شانزده پشتوانه ارائه‌دهنده پشتیبانی می‌شود که هرکدام
گزینه‌های مدل، حالت‌های ورودی، و مجموعه قابلیت‌های متفاوتی دارند. عامل
براساس پیکربندی شما و کلیدهای API موجود، ارائه‌دهنده مناسب را به‌صورت خودکار انتخاب می‌کند.

<Note>
ابزار `video_generate` فقط زمانی ظاهر می‌شود که دست‌کم یک ارائه‌دهنده تولید ویدیو
در دسترس باشد. اگر آن را در ابزارهای عامل خود نمی‌بینید، یک
کلید API ارائه‌دهنده تنظیم کنید یا `agents.defaults.videoGenerationModel` را پیکربندی کنید.
</Note>

OpenClaw تولید ویدیو را به‌عنوان سه حالت زمان اجرا در نظر می‌گیرد:

- `generate` — درخواست‌های متن به ویدیو بدون رسانه مرجع.
- `imageToVideo` — درخواست شامل یک یا چند تصویر مرجع است.
- `videoToVideo` — درخواست شامل یک یا چند ویدیوی مرجع است.

ارائه‌دهندگان می‌توانند هر زیرمجموعه‌ای از این حالت‌ها را پشتیبانی کنند. ابزار، حالت
فعال را پیش از ارسال اعتبارسنجی می‌کند و حالت‌های پشتیبانی‌شده را در `action=list` گزارش می‌دهد.

## شروع سریع

<Steps>
  <Step title="پیکربندی احراز هویت">
    برای هر ارائه‌دهنده پشتیبانی‌شده یک کلید API تنظیم کنید:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="انتخاب مدل پیش‌فرض (اختیاری)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="درخواست از عامل">
    > یک ویدیوی سینمایی ۵ ثانیه‌ای از یک خرچنگ دریایی دوستانه که هنگام غروب موج‌سواری می‌کند تولید کن.

    عامل `video_generate` را به‌صورت خودکار فراخوانی می‌کند. نیازی به allowlist کردن
    ابزار نیست.

  </Step>
</Steps>

## تولید ناهمگام چگونه کار می‌کند

تولید ویدیو ناهمگام است. وقتی عامل `video_generate` را در یک
جلسه فراخوانی می‌کند:

1. OpenClaw درخواست را به ارائه‌دهنده ارسال می‌کند و بلافاصله یک شناسه کار برمی‌گرداند.
2. ارائه‌دهنده کار را در پس‌زمینه پردازش می‌کند (معمولا ۳۰ ثانیه تا ۵ دقیقه، بسته به ارائه‌دهنده و وضوح).
3. وقتی ویدیو آماده شد، OpenClaw همان جلسه را با یک رویداد تکمیل داخلی بیدار می‌کند.
4. عامل ویدیوی نهایی را به گفتگوی اصلی برمی‌گرداند.

تا زمانی که یک کار در حال انجام است، فراخوانی‌های تکراری `video_generate` در همان
جلسه به‌جای شروع تولیدی دیگر، وضعیت کار فعلی را برمی‌گردانند. برای
بررسی پیشرفت از CLI، از `openclaw tasks list` یا `openclaw tasks show <taskId>` استفاده کنید.

بیرون از اجراهای عامل دارای پشتوانه جلسه (برای مثال، فراخوانی مستقیم ابزار)،
ابزار به تولید درون‌خطی برمی‌گردد و مسیر رسانه نهایی را
در همان نوبت برمی‌گرداند.

وقتی ارائه‌دهنده بایت برمی‌گرداند، فایل‌های ویدیوی تولیدشده در فضای ذخیره‌سازی رسانه‌ای مدیریت‌شده توسط OpenClaw ذخیره می‌شوند. سقف ذخیره پیش‌فرض ویدیوی تولیدشده از
محدودیت رسانه ویدیو پیروی می‌کند، و `agents.defaults.mediaMaxMb` آن را برای
رندرهای بزرگ‌تر افزایش می‌دهد. وقتی ارائه‌دهنده همچنین یک URL خروجی میزبانی‌شده برمی‌گرداند، OpenClaw
می‌تواند به‌جای ناموفق کردن کار در صورت رد شدن فایل بزرگ‌تر از حد توسط نگهداری محلی،
آن URL را تحویل دهد.

### چرخه عمر کار

| وضعیت       | معنی                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | کار ایجاد شده و منتظر است تا ارائه‌دهنده آن را بپذیرد.                                             |
| `running`   | ارائه‌دهنده در حال پردازش است (معمولا ۳۰ ثانیه تا ۵ دقیقه، بسته به ارائه‌دهنده و وضوح). |
| `succeeded` | ویدیو آماده است؛ عامل بیدار می‌شود و آن را در گفتگو ارسال می‌کند.                                   |
| `failed`    | خطای ارائه‌دهنده یا پایان مهلت؛ عامل با جزئیات خطا بیدار می‌شود.                                   |

وضعیت را از CLI بررسی کنید:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

اگر یک کار ویدیو برای جلسه فعلی از قبل `queued` یا `running` باشد،
`video_generate` به‌جای شروع یک کار جدید، وضعیت کار موجود را برمی‌گرداند.
برای بررسی صریح بدون راه‌اندازی تولید جدید، از `action: "status"` استفاده کنید.

## ارائه‌دهندگان پشتیبانی‌شده

| ارائه‌دهنده              | مدل پیش‌فرض                   | متن | مرجع تصویر                                            | مرجع ویدیو                                       | احراز هویت                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | بله (URL راه دور)                                     | بله (URL راه دور)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | تا ۲ تصویر (فقط مدل‌های I2V؛ فریم اول + آخر) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | تا ۲ تصویر (فریم اول + آخر از طریق نقش)         | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | تا ۹ تصویر مرجع                             | تا ۳ ویدیو                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | ۱ تصویر                                              | —                                               | `COMFY_API_KEY` یا `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | ۱ تصویر؛ تا ۹ تصویر با Seedance reference-to-video    | تا ۳ ویدیو با Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | ۱ تصویر                                              | ۱ ویدیو                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | ۱ تصویر                                              | —                                               | `MINIMAX_API_KEY` یا MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | ۱ تصویر                                              | ۱ ویدیو                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | تا ۴ تصویر (فریم اول/آخر یا مراجع)      | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | بله (URL راه دور)                                     | بله (URL راه دور)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | ۱ تصویر                                              | ۱ ویدیو                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | ۱ تصویر                                              | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | ۱ تصویر (`kling`)                                    | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | ۱ تصویر فریم اول یا تا ۷ `reference_image`    | ۱ ویدیو                                         | `XAI_API_KEY`                            |

برخی ارائه‌دهندگان متغیرهای محیطی کلید API اضافی یا جایگزین را می‌پذیرند. برای جزئیات، به
[صفحه‌های ارائه‌دهنده](#related) مربوطه مراجعه کنید.

برای بررسی ارائه‌دهندگان، مدل‌ها و حالت‌های زمان اجرای موجود در زمان اجرا، `video_generate action=list` را اجرا کنید.

### ماتریس قابلیت‌ها

قرارداد حالت صریحی که توسط `video_generate`، آزمون‌های قرارداد، و
پیمایش live مشترک استفاده می‌شود:

| ارائه‌دهنده   | `generate` | `imageToVideo` | `videoToVideo` | مسیرهای live مشترک امروز                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` نادیده گرفته می‌شود چون این ارائه‌دهنده به URLهای ویدیوی راه دور `http(s)` نیاز دارد                               |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`، `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | در پیمایش مشترک نیست؛ پوشش اختصاصی workflow همراه آزمون‌های Comfy قرار دارد                                                               |
| DeepInfra  |     ✓      |       —        |       —        | `generate`؛ طرحواره‌های ویدیوی بومی DeepInfra در قرارداد همراه‌شده متن به ویدیو هستند                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` فقط هنگام استفاده از Seedance reference-to-video                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` مشترک نادیده گرفته می‌شود چون پیمایش Gemini/Veo فعلی با پشتوانه بافر آن ورودی را نمی‌پذیرد  |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`، `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` مشترک نادیده گرفته می‌شود چون این سازمان/مسیر ورودی در حال حاضر به دسترسی inpaint/remix سمت ارائه‌دهنده نیاز دارد |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`، `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` نادیده گرفته می‌شود چون این ارائه‌دهنده به URLهای ویدیوی راه دور `http(s)` نیاز دارد                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` فقط وقتی اجرا می‌شود که مدل انتخاب‌شده `runway/gen4_aleph` باشد                                      |
| Together   |     ✓      |       ✓        |       —        | `generate`، `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`؛ `imageToVideo` مشترک نادیده گرفته می‌شود چون `veo3` همراه‌شده فقط متنی است و `kling` همراه‌شده به URL تصویر راه دور نیاز دارد            |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` نادیده گرفته می‌شود چون این ارائه‌دهنده در حال حاضر به یک URL راه دور MP4 نیاز دارد                                |

## پارامترهای ابزار

### الزامی

<ParamField path="prompt" type="string" required>
  توصیف متنی ویدیویی که باید تولید شود. برای `action: "generate"` الزامی است.
</ParamField>

### ورودی‌های محتوا

<ParamField path="image" type="string">یک تصویر مرجع (مسیر یا URL).</ParamField>
<ParamField path="images" type="string[]">چند تصویر مرجع (تا 9 مورد).</ParamField>
<ParamField path="imageRoles" type="string[]">
راهنمای اختیاری نقش برای هر موقعیت، موازی با فهرست ترکیبی تصاویر.
مقادیر استاندارد: `first_frame`، `last_frame`، `reference_image`.
</ParamField>
<ParamField path="video" type="string">یک ویدیوی مرجع (مسیر یا URL).</ParamField>
<ParamField path="videos" type="string[]">چند ویدیوی مرجع (تا 4 مورد).</ParamField>
<ParamField path="videoRoles" type="string[]">
راهنمای اختیاری نقش برای هر موقعیت، موازی با فهرست ترکیبی ویدیوها.
مقدار استاندارد: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
یک صدای مرجع (مسیر یا URL). وقتی ارائه‌دهنده از ورودی‌های صوتی پشتیبانی کند،
برای موسیقی پس‌زمینه یا مرجع صدا استفاده می‌شود.
</ParamField>
<ParamField path="audioRefs" type="string[]">چند صدای مرجع (تا 3 مورد).</ParamField>
<ParamField path="audioRoles" type="string[]">
راهنمای اختیاری نقش برای هر موقعیت، موازی با فهرست ترکیبی صداها.
مقدار استاندارد: `reference_audio`.
</ParamField>

<Note>
راهنمای نقش‌ها همان‌طور که هستند به ارائه‌دهنده ارسال می‌شوند. مقادیر استاندارد از
اتحاد `VideoGenerationAssetRole` می‌آیند، اما ارائه‌دهنده‌ها ممکن است رشته‌های نقش
اضافی را هم بپذیرند. آرایه‌های `*Roles` نباید ورودی‌های بیشتری از فهرست مرجع
متناظر داشته باشند؛ خطاهای یک‌واحدی با خطایی روشن شکست می‌خورند.
برای خالی گذاشتن یک جایگاه از رشتهٔ خالی استفاده کنید. برای xAI، نقش همهٔ تصاویر را روی
`reference_image` بگذارید تا از حالت تولید `reference_images` آن استفاده شود؛ برای
تبدیل تصویر به ویدیو با یک تصویر، نقش را حذف کنید یا از `first_frame` استفاده کنید.
</Note>

### کنترل‌های سبک

<ParamField path="aspectRatio" type="string">
  `1:1`، `2:3`، `3:2`، `3:4`، `4:3`، `4:5`، `5:4`، `9:16`، `16:9`، `21:9` یا `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`، `720P`، `768P` یا `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  مدت هدف بر حسب ثانیه (گردشده به نزدیک‌ترین مقدار پشتیبانی‌شده توسط ارائه‌دهنده).
</ParamField>
<ParamField path="size" type="string">راهنمای اندازه وقتی ارائه‌دهنده از آن پشتیبانی کند.</ParamField>
<ParamField path="audio" type="boolean">
  در صورت پشتیبانی، صدای تولیدشده را در خروجی فعال کنید. از `audioRef*` (ورودی‌ها) جدا است.
</ParamField>
<ParamField path="watermark" type="boolean">در صورت پشتیبانی، واترمارک ارائه‌دهنده را روشن یا خاموش کنید.</ParamField>

`adaptive` یک نشانگر ویژهٔ وابسته به ارائه‌دهنده است: همان‌طور که هست به
ارائه‌دهنده‌هایی ارسال می‌شود که `adaptive` را در قابلیت‌های خود اعلام کرده‌اند
(مثلاً BytePlus Seedance از آن برای تشخیص خودکار نسبت از ابعاد تصویر ورودی استفاده می‌کند).
ارائه‌دهنده‌هایی که آن را اعلام نکرده‌اند، مقدار را در نتیجهٔ ابزار از طریق
`details.ignoredOverrides` نمایش می‌دهند تا کنارگذاشته‌شدن آن قابل مشاهده باشد.

### پیشرفته

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` وظیفهٔ فعلی جلسه را برمی‌گرداند؛ `"list"` ارائه‌دهنده‌ها را بررسی می‌کند.
</ParamField>
<ParamField path="model" type="string">بازنویسی ارائه‌دهنده/مدل (مثلاً `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">راهنمای نام فایل خروجی.</ParamField>
<ParamField path="timeoutMs" type="number">مهلت زمانی اختیاری درخواست ارائه‌دهنده بر حسب میلی‌ثانیه.</ParamField>
<ParamField path="providerOptions" type="object">
  گزینه‌های ویژهٔ ارائه‌دهنده به‌صورت یک شیء JSON (مثلاً `{"seed": 42, "draft": true}`).
  ارائه‌دهنده‌هایی که شِمای نوع‌دار اعلام می‌کنند، کلیدها و نوع‌ها را اعتبارسنجی می‌کنند؛
  کلیدهای ناشناخته یا ناهماهنگی‌ها باعث می‌شوند نامزد هنگام fallback رد شود. ارائه‌دهنده‌های بدون
  شِمای اعلام‌شده، گزینه‌ها را همان‌طور که هستند دریافت می‌کنند. برای دیدن اینکه هر ارائه‌دهنده چه چیزهایی را می‌پذیرد،
  `video_generate action=list` را اجرا کنید.
</ParamField>

<Note>
همهٔ ارائه‌دهنده‌ها از همهٔ پارامترها پشتیبانی نمی‌کنند. OpenClaw مدت را به
نزدیک‌ترین مقدار پشتیبانی‌شده توسط ارائه‌دهنده نرمال‌سازی می‌کند، و راهنماهای هندسی ترجمه‌شده
مانند اندازه به نسبت تصویر را، وقتی یک ارائه‌دهندهٔ fallback سطح کنترل متفاوتی ارائه می‌کند،
بازنگاشت می‌کند. بازنویسی‌های واقعاً پشتیبانی‌نشده به‌صورت best-effort نادیده گرفته می‌شوند
و در نتیجهٔ ابزار به‌عنوان هشدار گزارش می‌شوند. محدودیت‌های سخت قابلیت
(مانند تعداد بیش از حد ورودی‌های مرجع) پیش از ارسال شکست می‌خورند. نتایج ابزار
تنظیمات اعمال‌شده را گزارش می‌کنند؛ `details.normalization` هر ترجمهٔ
درخواست‌شده به اعمال‌شده را ثبت می‌کند.
</Note>

ورودی‌های مرجع حالت زمان اجرا را انتخاب می‌کنند:

- بدون رسانهٔ مرجع → `generate`
- هر مرجع تصویری → `imageToVideo`
- هر مرجع ویدیویی → `videoToVideo`
- ورودی‌های صدای مرجع حالت حل‌شده را **تغییر نمی‌دهند**؛ آن‌ها روی
  هر حالتی که مراجع تصویر/ویدیو انتخاب کرده‌اند اعمال می‌شوند، و فقط با
  ارائه‌دهنده‌هایی کار می‌کنند که `maxInputAudios` را اعلام کرده‌اند.

ترکیب مراجع تصویر و ویدیو سطح قابلیت مشترک پایداری نیست.
در هر درخواست، یک نوع مرجع را ترجیح دهید.

#### Fallback و گزینه‌های نوع‌دار

برخی بررسی‌های قابلیت به‌جای مرز ابزار در لایهٔ fallback اعمال می‌شوند،
بنابراین درخواستی که از محدودیت‌های ارائه‌دهندهٔ اصلی فراتر می‌رود همچنان می‌تواند
روی یک fallback توانمند اجرا شود:

- نامزد فعالی که هیچ `maxInputAudios` اعلام نکرده است (یا `0` اعلام کرده) وقتی
  درخواست شامل مراجع صوتی باشد رد می‌شود؛ نامزد بعدی امتحان می‌شود.
- `maxDurationSeconds` نامزد فعال کمتر از `durationSeconds` درخواستی باشد
  و هیچ فهرست `supportedDurationSeconds` اعلام‌شده‌ای نداشته باشد → رد می‌شود.
- درخواست شامل `providerOptions` است و نامزد فعال صراحتاً یک شِمای نوع‌دار
  `providerOptions` اعلام کرده است → اگر کلیدهای ارائه‌شده در شِما نباشند
  یا نوع مقدارها مطابقت نداشته باشند، رد می‌شود. ارائه‌دهنده‌های بدون شِمای
  اعلام‌شده گزینه‌ها را همان‌طور که هستند دریافت می‌کنند (عبور سازگار با نسخه‌های قبلی).
  یک ارائه‌دهنده می‌تواند با اعلام یک شِمای خالی (`capabilities.providerOptions: {}`)
  از همهٔ گزینه‌های ارائه‌دهنده انصراف دهد، که همان ردشدن ناشی از ناهماهنگی نوع را ایجاد می‌کند.

اولین دلیل رد در یک درخواست با سطح `warn` ثبت می‌شود تا اپراتورها ببینند چه زمانی
ارائه‌دهندهٔ اصلی آن‌ها کنار گذاشته شده است؛ ردهای بعدی با سطح `debug` ثبت می‌شوند تا
زنجیره‌های طولانی fallback کم‌صدا بمانند. اگر همهٔ نامزدها رد شوند،
خطای تجمیع‌شده دلیل رد هرکدام را شامل می‌شود.

## کنش‌ها

| کنش       | کاری که انجام می‌دهد                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | پیش‌فرض. یک ویدیو از prompt داده‌شده و ورودی‌های مرجع اختیاری می‌سازد.                             |
| `status`   | وضعیت وظیفهٔ ویدیویی در حال اجرا برای جلسهٔ فعلی را بدون شروع یک تولید دیگر بررسی می‌کند. |
| `list`     | ارائه‌دهنده‌ها، مدل‌ها و قابلیت‌های موجودشان را نشان می‌دهد.                                                |

## انتخاب مدل

OpenClaw مدل را به این ترتیب حل می‌کند:

1. **پارامتر ابزار `model`** — اگر عامل یکی را در فراخوانی مشخص کند.
2. **`videoGenerationModel.primary`** از پیکربندی.
3. **`videoGenerationModel.fallbacks`** به ترتیب.
4. **تشخیص خودکار** — ارائه‌دهنده‌هایی که احراز هویت معتبر دارند، از
   ارائه‌دهندهٔ پیش‌فرض فعلی شروع می‌شوند و سپس ارائه‌دهنده‌های باقی‌مانده به ترتیب
   الفبایی بررسی می‌شوند.

اگر یک ارائه‌دهنده شکست بخورد، نامزد بعدی به‌صورت خودکار امتحان می‌شود. اگر همهٔ
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
    از نقطهٔ پایانی ناهمگام DashScope / Model Studio استفاده می‌کند. تصاویر و
    ویدیوهای مرجع باید URLهای راه‌دور `http(s)` باشند.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    شناسهٔ ارائه‌دهنده: `byteplus`.

    مدل‌ها: `seedance-1-0-pro-250528` (پیش‌فرض)،
    `seedance-1-0-pro-t2v-250528`، `seedance-1-0-pro-fast-251015`،
    `seedance-1-0-lite-t2v-250428`، `seedance-1-0-lite-i2v-250428`.

    مدل‌های T2V (`*-t2v-*`) ورودی تصویر را نمی‌پذیرند؛ مدل‌های I2V و
    مدل‌های عمومی `*-pro-*` از یک تصویر مرجع (فریم اول) پشتیبانی می‌کنند.
    تصویر را به‌صورت موقعیتی ارسال کنید یا `role: "first_frame"` را تنظیم کنید.
    وقتی تصویری ارائه شود، شناسه‌های مدل T2V به‌صورت خودکار به گونهٔ متناظر I2V
    تغییر داده می‌شوند.

    کلیدهای پشتیبانی‌شدهٔ `providerOptions`: `seed` (عدد)، `draft` (بولی —
    اجبار به 480p)، `camera_fixed` (بولی).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    به Plugin
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    نیاز دارد. شناسهٔ ارائه‌دهنده: `byteplus-seedance15`. مدل:
    `seedance-1-5-pro-251215`.

    از API یکپارچهٔ `content[]` استفاده می‌کند. حداکثر از 2 تصویر ورودی
    (`first_frame` + `last_frame`) پشتیبانی می‌کند. همهٔ ورودی‌ها باید URLهای راه‌دور
    `https://` باشند. روی هر تصویر `role: "first_frame"` / `"last_frame"` را تنظیم کنید، یا
    تصاویر را به‌صورت موقعیتی ارسال کنید.

    `aspectRatio: "adaptive"` نسبت را از تصویر ورودی به‌صورت خودکار تشخیص می‌دهد.
    `audio: true` به `generate_audio` نگاشت می‌شود. `providerOptions.seed`
    (عدد) ارسال می‌شود.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    به Plugin
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    نیاز دارد. شناسهٔ ارائه‌دهنده: `byteplus-seedance2`. مدل‌ها:
    `dreamina-seedance-2-0-260128`،
    `dreamina-seedance-2-0-fast-260128`.

    از API یکپارچهٔ `content[]` استفاده می‌کند. تا 9 تصویر مرجع،
    3 ویدیوی مرجع و 3 صدای مرجع را پشتیبانی می‌کند. همهٔ ورودی‌ها باید URLهای راه‌دور
    `https://` باشند. روی هر دارایی `role` را تنظیم کنید — مقادیر پشتیبانی‌شده:
    `"first_frame"`، `"last_frame"`، `"reference_image"`،
    `"reference_video"`، `"reference_audio"`.

    `aspectRatio: "adaptive"` نسبت را از تصویر ورودی به‌صورت خودکار تشخیص می‌دهد.
    `audio: true` به `generate_audio` نگاشت می‌شود. `providerOptions.seed`
    (عدد) ارسال می‌شود.

  </Accordion>
  <Accordion title="ComfyUI">
    اجرای محلی یا ابری مبتنی بر workflow. از تبدیل متن به ویدیو و
    تصویر به ویدیو از طریق گراف پیکربندی‌شده پشتیبانی می‌کند.
  </Accordion>
  <Accordion title="fal">
    برای کارهای طولانی‌مدت از جریانی متکی به صف استفاده می‌کند. بیشتر مدل‌های ویدیویی fal
    یک مرجع تصویری واحد را می‌پذیرند. مدل‌های مرجع‌به‌ویدیوی Seedance 2.0
    تا 9 تصویر، 3 ویدیو و 3 مرجع صوتی را می‌پذیرند، با
    حداکثر 12 فایل مرجع در مجموع.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    از یک مرجع تصویر یا یک مرجع ویدیو پشتیبانی می‌کند.
  </Accordion>
  <Accordion title="MiniMax">
    فقط یک مرجع تصویری واحد.
  </Accordion>
  <Accordion title="OpenAI">
    فقط بازنویسی `size` ارسال می‌شود. دیگر بازنویسی‌های سبک
    (`aspectRatio`، `resolution`، `audio`، `watermark`) با یک هشدار نادیده گرفته می‌شوند.
  </Accordion>
  <Accordion title="OpenRouter">
    از API ناهمگام `/videos` متعلق به OpenRouter استفاده می‌کند. OpenClaw
    کار را ارسال می‌کند، `polling_url` را polling می‌کند و یا `unsigned_urls` یا
    نقطهٔ پایانی مستندشدهٔ محتوای کار را دانلود می‌کند. پیش‌فرض همراه‌شدهٔ `google/veo-3.1-fast`
    مدت‌های 4/6/8 ثانیه، وضوح‌های `720P`/`1080P` و
    نسبت‌های تصویر `16:9`/`9:16` را اعلام می‌کند.
  </Accordion>
  <Accordion title="Qwen">
    همان backend DashScope مثل Alibaba. ورودی‌های مرجع باید URLهای راه‌دور
    `http(s)` باشند؛ فایل‌های محلی از ابتدا رد می‌شوند.
  </Accordion>
  <Accordion title="Runway">
    از فایل‌های محلی از طریق data URI پشتیبانی می‌کند. تبدیل ویدیو به ویدیو به
    `runway/gen4_aleph` نیاز دارد. اجراهای فقط متنی نسبت‌های تصویر `16:9` و `9:16` را
    ارائه می‌کنند.
  </Accordion>
  <Accordion title="Together">
    فقط یک مرجع تصویری واحد.
  </Accordion>
  <Accordion title="Vydra">
    برای جلوگیری از تغییرمسیرهایی که احراز هویت را حذف می‌کنند، مستقیماً از
    `https://www.vydra.ai/api/v1` استفاده می‌کند. `veo3` فقط به‌عنوان متن‌به‌ویدیو همراه شده است؛
    `kling` به یک URL تصویر راه‌دور نیاز دارد.
  </Accordion>
  <Accordion title="xAI">
    از متن‌به‌ویدیو، تبدیل تصویر به ویدیو با یک تصویر فریم اول، تا 7
    ورودی `reference_image` از طریق `reference_images` در xAI، و جریان‌های ویرایش/گسترش ویدیوی راه‌دور
    پشتیبانی می‌کند.
  </Accordion>
</AccordionGroup>

## حالت‌های قابلیت ارائه‌دهنده

قرارداد مشترک تولید ویدئو به‌جای فقط محدودیت‌های تجمیعی تخت، از قابلیت‌های وابسته به حالت پشتیبانی می‌کند. پیاده‌سازی‌های جدید ارائه‌دهنده باید بلوک‌های حالت صریح را ترجیح دهند:

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

فیلدهای تجمیعی تخت مانند `maxInputImages` و `maxInputVideos` برای اعلام پشتیبانی از حالت تبدیل **کافی نیستند**. ارائه‌دهندگان باید `generate`، `imageToVideo` و `videoToVideo` را به‌صورت صریح اعلام کنند تا آزمون‌های زنده، آزمون‌های قرارداد و ابزار مشترک `video_generate` بتوانند پشتیبانی حالت را به‌صورت قطعی اعتبارسنجی کنند.

وقتی یک مدل در یک ارائه‌دهنده پشتیبانی گسترده‌تری از ورودی مرجع نسبت به بقیه دارد، به‌جای افزایش محدودیت سراسری حالت، از `maxInputImagesByModel`، `maxInputVideosByModel` یا `maxInputAudiosByModel` استفاده کنید.

## آزمون‌های زنده

پوشش زندهٔ انتخابی برای ارائه‌دهندگان مشترک بسته‌بندی‌شده:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

پوشش‌دهندهٔ مخزن:

```bash
pnpm test:live:media video
```

این فایل زنده متغیرهای محیطی مفقود ارائه‌دهنده را از `~/.profile` بارگیری می‌کند، به‌صورت پیش‌فرض کلیدهای API زنده/محیطی را بر پروفایل‌های احراز هویت ذخیره‌شده ترجیح می‌دهد، و به‌صورت پیش‌فرض یک آزمون دود release-safe اجرا می‌کند:

- `generate` برای هر ارائه‌دهندهٔ غیر FAL در پیمایش.
- اعلان خرچنگ یک‌ثانیه‌ای.
- سقف عملیات به‌ازای هر ارائه‌دهنده از
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` به‌صورت پیش‌فرض).

FAL انتخابی است، چون تأخیر صف سمت ارائه‌دهنده می‌تواند بر زمان انتشار غالب شود:

```bash
pnpm test:live:media video --video-providers fal
```

برای اجرای حالت‌های تبدیل اعلام‌شده که پیمایش مشترک می‌تواند با رسانهٔ محلی به‌صورت امن تمرین کند نیز `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` را تنظیم کنید:

- `imageToVideo` وقتی `capabilities.imageToVideo.enabled`.
- `videoToVideo` وقتی `capabilities.videoToVideo.enabled` و
  ارائه‌دهنده/مدل ورودی ویدئوی محلی مبتنی بر بافر را در پیمایش مشترک می‌پذیرد.

امروز مسیر زندهٔ مشترک `videoToVideo` فقط زمانی `runway` را پوشش می‌دهد که `runway/gen4_aleph` را انتخاب کنید.

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
- [کارهای پس‌زمینه](/fa/automation/tasks) — رهگیری کار برای تولید ویدئوی ناهمگام
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
