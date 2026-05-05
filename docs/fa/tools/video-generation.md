---
read_when:
    - تولید ویدیوها از طریق عامل
    - پیکربندی ارائه‌دهندگان و مدل‌های تولید ویدئو
    - درک پارامترهای ابزار video_generate
sidebarTitle: Video generation
summary: ویدیوها را از طریق video_generate، از مرجع‌های متنی، تصویری یا ویدیویی، در ۱۶ بک‌اند ارائه‌دهنده تولید کنید
title: تولید ویدئو
x-i18n:
    generated_at: "2026-05-05T01:53:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6edce39c3006b748d512fec935b81566ae1a121c280248e9e9439edd1f052d83
    source_path: tools/video-generation.md
    workflow: 16
---

عامل‌های OpenClaw می‌توانند از اعلان‌های متنی، تصاویر مرجع، یا
ویدیوهای موجود ویدیو تولید کنند. شانزده backend ارائه‌دهنده پشتیبانی می‌شوند که هرکدام
گزینه‌های مدل، حالت‌های ورودی، و مجموعه قابلیت‌های متفاوتی دارند. عامل بر اساس پیکربندی شما و کلیدهای API
در دسترس، ارائه‌دهنده مناسب را به‌طور خودکار انتخاب می‌کند.

<Note>
ابزار `video_generate` فقط زمانی ظاهر می‌شود که دست‌کم یک ارائه‌دهنده تولید ویدیو
در دسترس باشد. اگر آن را در ابزارهای عامل خود نمی‌بینید، یک
کلید API ارائه‌دهنده تنظیم کنید یا `agents.defaults.videoGenerationModel` را پیکربندی کنید.
</Note>

OpenClaw تولید ویدیو را به‌صورت سه حالت زمان اجرا در نظر می‌گیرد:

- `generate` — درخواست‌های متن‌به‌ویدیو بدون رسانه مرجع.
- `imageToVideo` — درخواست شامل یک یا چند تصویر مرجع است.
- `videoToVideo` — درخواست شامل یک یا چند ویدیوی مرجع است.

ارائه‌دهندگان می‌توانند هر زیرمجموعه‌ای از این حالت‌ها را پشتیبانی کنند. ابزار حالت
فعال را پیش از ارسال اعتبارسنجی می‌کند و حالت‌های پشتیبانی‌شده را در `action=list` گزارش می‌دهد.

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

    عامل به‌طور خودکار `video_generate` را فراخوانی می‌کند. نیازی به allowlist کردن
    ابزار نیست.

  </Step>
</Steps>

## تولید ناهمگام چگونه کار می‌کند

تولید ویدیو ناهمگام است. وقتی عامل در یک
نشست `video_generate` را فراخوانی می‌کند:

1. OpenClaw درخواست را به ارائه‌دهنده ارسال می‌کند و بلافاصله یک شناسه وظیفه برمی‌گرداند.
2. ارائه‌دهنده کار را در پس‌زمینه پردازش می‌کند (معمولا بسته به ارائه‌دهنده و وضوح، ۳۰ ثانیه تا ۵ دقیقه).
3. وقتی ویدیو آماده شد، OpenClaw همان نشست را با یک رویداد تکمیل داخلی بیدار می‌کند.
4. عامل به کاربر اطلاع می‌دهد و ویدیوی نهایی را پیوست می‌کند. در گفت‌وگوهای گروهی/کانالی
   که از تحویل قابل مشاهده فقط از طریق ابزار پیام استفاده می‌کنند، عامل نتیجه را
   به‌جای اینکه OpenClaw آن را مستقیم ارسال کند، از طریق ابزار پیام بازپخش می‌کند.

تا وقتی کاری در جریان است، فراخوانی‌های تکراری `video_generate` در همان
نشست به‌جای شروع یک تولید دیگر، وضعیت وظیفه فعلی را برمی‌گردانند. برای
بررسی پیشرفت از CLI از `openclaw tasks list` یا `openclaw tasks show <taskId>` استفاده کنید.

خارج از اجراهای عاملِ دارای پشتوانه نشست (برای مثال، فراخوانی مستقیم ابزار)،
ابزار به تولید inline بازمی‌گردد و مسیر رسانه نهایی را
در همان نوبت برمی‌گرداند.

وقتی ارائه‌دهنده byte برمی‌گرداند، فایل‌های ویدیوی تولیدشده در فضای ذخیره‌سازی رسانه مدیریت‌شده توسط OpenClaw
ذخیره می‌شوند. سقف پیش‌فرض ذخیره ویدیوی تولیدشده از
محدودیت رسانه ویدیویی پیروی می‌کند، و `agents.defaults.mediaMaxMb` آن را برای
رندرهای بزرگ‌تر افزایش می‌دهد. وقتی ارائه‌دهنده یک URL خروجی میزبانی‌شده نیز برمی‌گرداند، OpenClaw
می‌تواند اگر پایداری محلی یک فایل بیش‌ازحد بزرگ را رد کند، به‌جای ناموفق کردن وظیفه
آن URL را تحویل دهد.

### چرخه حیات وظیفه

| وضعیت       | معنی                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | وظیفه ایجاد شده و منتظر پذیرش توسط ارائه‌دهنده است.                                             |
| `running`   | ارائه‌دهنده در حال پردازش است (معمولا بسته به ارائه‌دهنده و وضوح، ۳۰ ثانیه تا ۵ دقیقه). |
| `succeeded` | ویدیو آماده است؛ عامل بیدار می‌شود و آن را در گفت‌وگو ارسال می‌کند.                                   |
| `failed`    | خطای ارائه‌دهنده یا timeout؛ عامل با جزئیات خطا بیدار می‌شود.                                   |

وضعیت را از CLI بررسی کنید:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

اگر یک وظیفه ویدیو برای نشست فعلی از قبل `queued` یا `running` باشد،
`video_generate` به‌جای شروع یک مورد جدید، وضعیت وظیفه موجود را برمی‌گرداند.
برای بررسی صریح بدون راه‌اندازی تولید جدید از `action: "status"` استفاده کنید.

## ارائه‌دهندگان پشتیبانی‌شده

| ارائه‌دهنده              | مدل پیش‌فرض                   | متن | مرجع تصویر                                            | مرجع ویدیو                                       | احراز هویت                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | بله (URL راه‌دور)                                     | بله (URL راه‌دور)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | تا ۲ تصویر (فقط مدل‌های I2V؛ فریم اول + آخر) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | تا ۲ تصویر (فریم اول + آخر از طریق role)         | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | تا ۹ تصویر مرجع                             | تا ۳ ویدیو                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | ۱ تصویر                                              | —                                               | `COMFY_API_KEY` یا `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | ۱ تصویر؛ تا ۹ مورد با Seedance reference-to-video    | تا ۳ ویدیو با Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | ۱ تصویر                                              | ۱ ویدیو                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | ۱ تصویر                                              | —                                               | `MINIMAX_API_KEY` یا MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | ۱ تصویر                                              | ۱ ویدیو                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | تا ۴ تصویر (فریم اول/آخر یا مراجع)      | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | بله (URL راه‌دور)                                     | بله (URL راه‌دور)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | ۱ تصویر                                              | ۱ ویدیو                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | ۱ تصویر                                              | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | ۱ تصویر (`kling`)                                    | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | ۱ تصویر فریم اول یا تا ۷ `reference_image`    | ۱ ویدیو                                         | `XAI_API_KEY`                            |

برخی ارائه‌دهندگان متغیرهای env کلید API اضافی یا جایگزین می‌پذیرند. برای جزئیات،
[صفحه‌های ارائه‌دهنده](#related) جداگانه را ببینید.

برای بررسی ارائه‌دهندگان، مدل‌ها، و حالت‌های زمان اجرای در دسترس در زمان اجرا، `video_generate action=list` را اجرا کنید.

### ماتریس قابلیت‌ها

قرارداد حالت صریحی که توسط `video_generate`، آزمون‌های قرارداد، و
sweep زنده مشترک استفاده می‌شود:

| ارائه‌دهنده   | `generate` | `imageToVideo` | `videoToVideo` | laneهای زنده مشترک امروز                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` رد می‌شود چون این ارائه‌دهنده به URLهای ویدیویی راه‌دور `http(s)` نیاز دارد                               |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`، `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | در sweep مشترک نیست؛ پوشش اختصاصی workflow همراه با آزمون‌های Comfy قرار دارد                                                               |
| DeepInfra  |     ✓      |       —        |       —        | `generate`؛ schemaهای ویدیویی بومی DeepInfra در قرارداد bundled متن‌به‌ویدیو هستند                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` فقط هنگام استفاده از Seedance reference-to-video                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` مشترک رد می‌شود چون sweep فعلی Gemini/Veo با پشتوانه buffer آن ورودی را نمی‌پذیرد  |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`، `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` مشترک رد می‌شود چون این org/مسیر ورودی در حال حاضر به دسترسی inpaint/remix سمت ارائه‌دهنده نیاز دارد |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`، `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` رد می‌شود چون این ارائه‌دهنده به URLهای ویدیویی راه‌دور `http(s)` نیاز دارد                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` فقط زمانی اجرا می‌شود که مدل انتخاب‌شده `runway/gen4_aleph` باشد                                      |
| Together   |     ✓      |       ✓        |       —        | `generate`، `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`؛ `imageToVideo` مشترک رد می‌شود چون `veo3` bundled فقط متنی است و `kling` bundled به URL تصویر راه‌دور نیاز دارد            |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` رد می‌شود چون این ارائه‌دهنده در حال حاضر به URL راه‌دور MP4 نیاز دارد                                |

## پارامترهای ابزار

### ضروری

<ParamField path="prompt" type="string" required>
  توضیح متنی ویدیویی که باید تولید شود. برای `action: "generate"` ضروری است.
</ParamField>

### ورودی‌های محتوا

<ParamField path="image" type="string">یک تصویر مرجع (مسیر یا URL).</ParamField>
<ParamField path="images" type="string[]">چند تصویر مرجع (تا ۹ مورد).</ParamField>
<ParamField path="imageRoles" type="string[]">
راهنمای نقش اختیاری برای هر جایگاه، متناظر با فهرست ترکیبی تصاویر.
مقادیر متعارف: `first_frame`، `last_frame`، `reference_image`.
</ParamField>
<ParamField path="video" type="string">یک ویدئوی مرجع (مسیر یا URL).</ParamField>
<ParamField path="videos" type="string[]">چند ویدئوی مرجع (تا ۴ مورد).</ParamField>
<ParamField path="videoRoles" type="string[]">
راهنمای نقش اختیاری برای هر جایگاه، متناظر با فهرست ترکیبی ویدئوها.
مقدار متعارف: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
یک صدای مرجع (مسیر یا URL). برای موسیقی پس‌زمینه یا مرجع صدا استفاده می‌شود
وقتی ارائه‌دهنده از ورودی‌های صوتی پشتیبانی کند.
</ParamField>
<ParamField path="audioRefs" type="string[]">چند صدای مرجع (تا ۳ مورد).</ParamField>
<ParamField path="audioRoles" type="string[]">
راهنمای نقش اختیاری برای هر جایگاه، متناظر با فهرست ترکیبی صداها.
مقدار متعارف: `reference_audio`.
</ParamField>

<Note>
راهنماهای نقش همان‌طور که هستند به ارائه‌دهنده ارسال می‌شوند. مقادیر متعارف از
اتحاد `VideoGenerationAssetRole` می‌آیند، اما ارائه‌دهندگان ممکن است رشته‌های نقش
اضافی را بپذیرند. آرایه‌های `*Roles` نباید تعداد ورودی بیشتری از فهرست مرجع
متناظر داشته باشند؛ خطاهای یکی بیشتر یا کمتر با خطایی روشن شکست می‌خورند.
برای تنظیم‌نشدن یک جایگاه، از رشته خالی استفاده کنید. برای xAI، همه نقش‌های تصویر را روی
`reference_image` تنظیم کنید تا از حالت تولید `reference_images` آن استفاده شود؛
برای تصویر-به-ویدئو تک‌تصویری، نقش را حذف کنید یا از `first_frame` استفاده کنید.
</Note>

### کنترل‌های سبک

<ParamField path="aspectRatio" type="string">
  `1:1`، `2:3`، `3:2`، `3:4`، `4:3`، `4:5`، `5:4`، `9:16`، `16:9`، `21:9`، یا `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`، `720P`، `768P`، یا `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  مدت‌زمان هدف بر حسب ثانیه (گردشده به نزدیک‌ترین مقدار پشتیبانی‌شده توسط ارائه‌دهنده).
</ParamField>
<ParamField path="size" type="string">راهنمای اندازه، وقتی ارائه‌دهنده از آن پشتیبانی کند.</ParamField>
<ParamField path="audio" type="boolean">
  وقتی پشتیبانی شود، صدای تولیدشده را در خروجی فعال می‌کند. متمایز از `audioRef*` (ورودی‌ها).
</ParamField>
<ParamField path="watermark" type="boolean">وقتی پشتیبانی شود، واترمارک‌گذاری ارائه‌دهنده را تغییر می‌دهد.</ParamField>

`adaptive` یک نگهبان ویژه ارائه‌دهنده است: همان‌طور که هست به
ارائه‌دهندگانی ارسال می‌شود که `adaptive` را در قابلیت‌های خود اعلام کرده‌اند (مثلاً BytePlus
Seedance از آن برای تشخیص خودکار نسبت از ابعاد تصویر ورودی
استفاده می‌کند). ارائه‌دهندگانی که آن را اعلام نکرده‌اند، مقدار را از طریق
`details.ignoredOverrides` در نتیجه ابزار نشان می‌دهند تا حذف آن قابل مشاهده باشد.

### پیشرفته

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` وظیفه فعلی نشست را برمی‌گرداند؛ `"list"` ارائه‌دهندگان را بررسی می‌کند.
</ParamField>
<ParamField path="model" type="string">بازنویسی ارائه‌دهنده/مدل (مثلاً `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">راهنمای نام فایل خروجی.</ParamField>
<ParamField path="timeoutMs" type="number">مهلت اختیاری درخواست ارائه‌دهنده بر حسب میلی‌ثانیه.</ParamField>
<ParamField path="providerOptions" type="object">
  گزینه‌های ویژه ارائه‌دهنده به‌صورت شیء JSON (مثلاً `{"seed": 42, "draft": true}`).
  ارائه‌دهندگانی که یک اسکیمای تایپ‌شده اعلام می‌کنند، کلیدها و نوع‌ها را اعتبارسنجی می‌کنند؛ کلیدهای
  ناشناخته یا عدم تطابق‌ها نامزد را هنگام fallback کنار می‌گذارند. ارائه‌دهندگان بدون
  اسکیمای اعلام‌شده، گزینه‌ها را همان‌طور که هستند دریافت می‌کنند. `video_generate action=list` را اجرا کنید
  تا ببینید هر ارائه‌دهنده چه چیزهایی را می‌پذیرد.
</ParamField>

<Note>
همه ارائه‌دهندگان از همه پارامترها پشتیبانی نمی‌کنند. OpenClaw مدت‌زمان را به
نزدیک‌ترین مقدار پشتیبانی‌شده توسط ارائه‌دهنده نرمال‌سازی می‌کند، و راهنماهای هندسی ترجمه‌شده
مانند اندازه-به-نسبت-تصویر را وقتی ارائه‌دهنده fallback سطح کنترل متفاوتی ارائه دهد
بازنگاشت می‌کند. بازنویسی‌های واقعاً پشتیبانی‌نشده بر اساس بهترین تلاش
نادیده گرفته می‌شوند و به‌صورت هشدار در نتیجه ابزار گزارش می‌شوند. محدودیت‌های سخت قابلیت
(مانند تعداد بیش از حد ورودی‌های مرجع) پیش از ارسال شکست می‌خورند. نتایج ابزار
تنظیمات اعمال‌شده را گزارش می‌کنند؛ `details.normalization` هر ترجمه
درخواستی-به-اعمال‌شده را ثبت می‌کند.
</Note>

ورودی‌های مرجع حالت زمان اجرا را انتخاب می‌کنند:

- بدون رسانه مرجع → `generate`
- هر مرجع تصویر → `imageToVideo`
- هر مرجع ویدئو → `videoToVideo`
- ورودی‌های صدای مرجع **حالت حل‌شده را تغییر نمی‌دهند**؛ آن‌ها روی
  هر حالتی که مراجع تصویر/ویدئو انتخاب کنند اعمال می‌شوند، و فقط با
  ارائه‌دهندگانی کار می‌کنند که `maxInputAudios` را اعلام کرده‌اند.

ترکیب مراجع تصویر و ویدئو یک سطح قابلیت مشترک پایدار نیست.
در هر درخواست، یک نوع مرجع را ترجیح دهید.

#### fallback و گزینه‌های تایپ‌شده

برخی بررسی‌های قابلیت در لایه fallback اعمال می‌شوند، نه در
مرز ابزار؛ بنابراین درخواستی که از محدودیت‌های ارائه‌دهنده اصلی فراتر می‌رود
هنوز می‌تواند روی یک fallback توانمند اجرا شود:

- نامزد فعالی که هیچ `maxInputAudios` اعلام نکرده (یا `0`) وقتی
  درخواست شامل مراجع صوتی باشد کنار گذاشته می‌شود؛ نامزد بعدی امتحان می‌شود.
- `maxDurationSeconds` نامزد فعال کمتر از `durationSeconds` درخواستی باشد
  و هیچ فهرست `supportedDurationSeconds` اعلام‌شده‌ای نداشته باشد → کنار گذاشته می‌شود.
- درخواست شامل `providerOptions` است و نامزد فعال به‌صراحت
  اسکیمای تایپ‌شده `providerOptions` را اعلام می‌کند → اگر کلیدهای ارائه‌شده
  در اسکیما نباشند یا نوع مقدارها مطابقت نداشته باشند، کنار گذاشته می‌شود. ارائه‌دهندگان بدون
  اسکیمای اعلام‌شده گزینه‌ها را همان‌طور که هستند دریافت می‌کنند (عبور سازگار با گذشته).
  یک ارائه‌دهنده می‌تواند با اعلام اسکیمای خالی (`capabilities.providerOptions: {}`)
  از همه گزینه‌های ارائه‌دهنده انصراف دهد، که همان کنارگذاری ناشی از عدم تطابق نوع را
  ایجاد می‌کند.

اولین دلیل کنارگذاری در یک درخواست در سطح `warn` ثبت می‌شود تا اپراتورها ببینند
چه زمانی ارائه‌دهنده اصلی آن‌ها کنار گذاشته شده است؛ کنارگذاری‌های بعدی در سطح `debug` ثبت می‌شوند تا
زنجیره‌های طولانی fallback ساکت بمانند. اگر همه نامزدها کنار گذاشته شوند، خطای
تجمیع‌شده دلیل کنارگذاری هرکدام را شامل می‌شود.

## کنش‌ها

| کنش       | کاری که انجام می‌دهد                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | پیش‌فرض. از پرامپت داده‌شده و ورودی‌های مرجع اختیاری یک ویدئو ایجاد می‌کند.                            |
| `status`   | وضعیت وظیفه ویدئوی در حال اجرا را برای نشست فعلی، بدون شروع تولیدی دیگر، بررسی می‌کند. |
| `list`     | ارائه‌دهندگان، مدل‌ها، و قابلیت‌های موجود آن‌ها را نشان می‌دهد.                                      |

## انتخاب مدل

OpenClaw مدل را به این ترتیب حل می‌کند:

1. **پارامتر ابزار `model`** — اگر عامل یکی را در فراخوانی مشخص کند.
2. **`videoGenerationModel.primary`** از پیکربندی.
3. **`videoGenerationModel.fallbacks`** به‌ترتیب.
4. **تشخیص خودکار** — ارائه‌دهندگانی که احراز هویت معتبر دارند، با شروع از
   ارائه‌دهنده پیش‌فرض فعلی، سپس ارائه‌دهندگان باقی‌مانده به‌ترتیب الفبایی.

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
    از نقطه پایانی ناهمگام DashScope / Model Studio استفاده می‌کند. تصاویر و
    ویدئوهای مرجع باید URLهای راه‌دور `http(s)` باشند.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    شناسه ارائه‌دهنده: `byteplus`.

    مدل‌ها: `seedance-1-0-pro-250528` (پیش‌فرض)،
    `seedance-1-0-pro-t2v-250528`، `seedance-1-0-pro-fast-251015`،
    `seedance-1-0-lite-t2v-250428`، `seedance-1-0-lite-i2v-250428`.

    مدل‌های T2V (`*-t2v-*`) ورودی تصویر را نمی‌پذیرند؛ مدل‌های I2V و
    مدل‌های عمومی `*-pro-*` از یک تصویر مرجع (فریم اول) پشتیبانی می‌کنند.
    تصویر را به‌صورت موقعیتی ارسال کنید یا `role: "first_frame"` را تنظیم کنید.
    وقتی تصویری ارائه شود، شناسه‌های مدل T2V به‌صورت خودکار به
    گونه I2V متناظر تغییر داده می‌شوند.

    کلیدهای پشتیبانی‌شده `providerOptions`: `seed` (عدد)، `draft` (بولی —
    اجبار به 480p)، `camera_fixed` (بولی).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    به Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    نیاز دارد. شناسه ارائه‌دهنده: `byteplus-seedance15`. مدل:
    `seedance-1-5-pro-251215`.

    از API یکپارچه `content[]` استفاده می‌کند. حداکثر از ۲ تصویر ورودی
    (`first_frame` + `last_frame`) پشتیبانی می‌کند. همه ورودی‌ها باید URLهای راه‌دور `https://`
    باشند. روی هر تصویر `role: "first_frame"` / `"last_frame"` را تنظیم کنید، یا
    تصاویر را به‌صورت موقعیتی ارسال کنید.

    `aspectRatio: "adaptive"` نسبت را از تصویر ورودی به‌صورت خودکار تشخیص می‌دهد.
    `audio: true` به `generate_audio` نگاشت می‌شود. `providerOptions.seed`
    (عدد) ارسال می‌شود.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    به Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    نیاز دارد. شناسه ارائه‌دهنده: `byteplus-seedance2`. مدل‌ها:
    `dreamina-seedance-2-0-260128`،
    `dreamina-seedance-2-0-fast-260128`.

    از API یکپارچه `content[]` استفاده می‌کند. تا ۹ تصویر مرجع،
    ۳ ویدئوی مرجع، و ۳ صدای مرجع را پشتیبانی می‌کند. همه ورودی‌ها باید URLهای راه‌دور
    `https://` باشند. روی هر دارایی `role` را تنظیم کنید — مقادیر پشتیبانی‌شده:
    `"first_frame"`، `"last_frame"`، `"reference_image"`،
    `"reference_video"`، `"reference_audio"`.

    `aspectRatio: "adaptive"` نسبت را از تصویر ورودی به‌صورت خودکار تشخیص می‌دهد.
    `audio: true` به `generate_audio` نگاشت می‌شود. `providerOptions.seed`
    (عدد) ارسال می‌شود.

  </Accordion>
  <Accordion title="ComfyUI">
    اجرای محلی یا ابری مبتنی بر گردش‌کار. از متن-به-ویدئو و
    تصویر-به-ویدئو از طریق گراف پیکربندی‌شده پشتیبانی می‌کند.
  </Accordion>
  <Accordion title="fal">
    برای کارهای طولانی‌مدت از جریان متکی به صف استفاده می‌کند. بیشتر مدل‌های ویدئویی fal
    یک مرجع تصویر را می‌پذیرند. مدل‌های مرجع-به-ویدئو Seedance 2.0
    تا ۹ تصویر، ۳ ویدئو، و ۳ مرجع صوتی را می‌پذیرند، با
    حداکثر ۱۲ فایل مرجع در مجموع.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    از یک مرجع تصویر یا یک مرجع ویدئو پشتیبانی می‌کند.
  </Accordion>
  <Accordion title="MiniMax">
    فقط یک مرجع تصویر.
  </Accordion>
  <Accordion title="OpenAI">
    فقط بازنویسی `size` ارسال می‌شود. بازنویسی‌های سبک دیگر
    (`aspectRatio`، `resolution`، `audio`، `watermark`) با
    یک هشدار نادیده گرفته می‌شوند.
  </Accordion>
  <Accordion title="OpenRouter">
    از API ناهمگام `/videos` متعلق به OpenRouter استفاده می‌کند. OpenClaw
    کار را ارسال می‌کند، `polling_url` را نظرسنجی می‌کند، و یا `unsigned_urls` یا
    نقطه پایانی مستندشده محتوای کار را دانلود می‌کند. پیش‌فرض همراه `google/veo-3.1-fast`
    مدت‌زمان‌های ۴/۶/۸ ثانیه، وضوح‌های `720P`/`1080P`، و
    نسبت‌های تصویر `16:9`/`9:16` را اعلام می‌کند.
  </Accordion>
  <Accordion title="Qwen">
    همان پشتانه DashScope مثل Alibaba. ورودی‌های مرجع باید URLهای راه‌دور
    `http(s)` باشند؛ فایل‌های محلی از ابتدا رد می‌شوند.
  </Accordion>
  <Accordion title="Runway">
    از فایل‌های محلی از طریق داده URI پشتیبانی می‌کند. ویدئو-به-ویدئو به
    `runway/gen4_aleph` نیاز دارد. اجراهای فقط-متن نسبت‌های تصویر `16:9` و `9:16` را
    ارائه می‌کنند.
  </Accordion>
  <Accordion title="Together">
    فقط یک مرجع تصویر.
  </Accordion>
  <Accordion title="Vydra">
    برای جلوگیری از تغییرمسیرهایی که احراز هویت را حذف می‌کنند، مستقیماً از `https://www.vydra.ai/api/v1`
    استفاده می‌کند. `veo3` فقط به‌عنوان متن-به-ویدئو همراه شده است؛ `kling` به
    یک URL تصویر راه‌دور نیاز دارد.
  </Accordion>
  <Accordion title="xAI">
    از متن-به-ویدئو، تصویر-به-ویدئو با یک فریم اول، تا ۷
    ورودی `reference_image` از طریق `reference_images` متعلق به xAI، و جریان‌های ویرایش/گسترش
    ویدئوی راه‌دور پشتیبانی می‌کند.
  </Accordion>
</AccordionGroup>

## حالت‌های قابلیت ارائه‌دهنده

قرارداد مشترک تولید ویدئو به‌جای فقط محدودیت‌های تجمیعی مسطح، از قابلیت‌های اختصاصی هر حالت پشتیبانی می‌کند. پیاده‌سازی‌های جدید ارائه‌دهنده باید بلوک‌های حالت صریح را ترجیح دهند:

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

فیلدهای تجمیعی مسطح مانند `maxInputImages` و `maxInputVideos` برای اعلام پشتیبانی از حالت تبدیل **کافی نیستند**. ارائه‌دهندگان باید `generate`، `imageToVideo` و `videoToVideo` را به‌صراحت اعلام کنند تا آزمون‌های زنده، آزمون‌های قرارداد، و ابزار مشترک `video_generate` بتوانند پشتیبانی از حالت‌ها را به‌صورت قطعی اعتبارسنجی کنند.

وقتی یک مدل در یک ارائه‌دهنده نسبت به بقیه پشتیبانی گسترده‌تری از ورودی مرجع دارد، به‌جای افزایش محدودیت کل حالت، از `maxInputImagesByModel`، `maxInputVideosByModel` یا `maxInputAudiosByModel` استفاده کنید.

## آزمون‌های زنده

پوشش زندهٔ اختیاری برای ارائه‌دهندگان بسته‌بندی‌شدهٔ مشترک:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

پوشش‌دهندهٔ مخزن:

```bash
pnpm test:live:media video
```

این فایل زنده متغیرهای محیطی ارائه‌دهندهٔ جاافتاده را از `~/.profile` بارگذاری می‌کند، به‌صورت پیش‌فرض کلیدهای API زنده/محیطی را بر پروفایل‌های احراز هویت ذخیره‌شده ترجیح می‌دهد، و به‌صورت پیش‌فرض یک آزمون دود ایمن برای انتشار اجرا می‌کند:

- `generate` برای هر ارائه‌دهندهٔ غیر FAL در پیمایش.
- پرامپت خرچنگ یک‌ثانیه‌ای.
- سقف عملیات برای هر ارائه‌دهنده از
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` به‌صورت پیش‌فرض).

FAL اختیاری است چون تأخیر صف در سمت ارائه‌دهنده می‌تواند بر زمان انتشار غالب شود:

```bash
pnpm test:live:media video --video-providers fal
```

برای اجرای حالت‌های تبدیل اعلام‌شده‌ای که پیمایش مشترک می‌تواند با رسانهٔ محلی به‌صورت ایمن اجرا کند نیز `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` را تنظیم کنید:

- `imageToVideo` وقتی `capabilities.imageToVideo.enabled`.
- `videoToVideo` وقتی `capabilities.videoToVideo.enabled` و
  ارائه‌دهنده/مدل ورودی ویدئوی محلی مبتنی بر بافر را در پیمایش مشترک بپذیرد.

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
