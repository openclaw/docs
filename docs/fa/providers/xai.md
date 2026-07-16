---
read_when:
    - می‌خواهید از مدل‌های Grok در OpenClaw استفاده کنید
    - در حال پیکربندی احراز هویت xAI یا شناسه‌های مدل هستید
summary: استفاده از مدل‌های xAI Grok در OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-07-16T17:38:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c78617876f18fbb51bd3c8485f764a5b456b6d746476142bb0c5ecdb3decfb3a
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw یک Plugin ارائه‌دهندهٔ همراهِ `xai` برای مدل‌های Grok عرضه می‌کند. مسیر
پیشنهادی، OAuth سرویس Grok با اشتراک واجد شرایط SuperGrok یا X Premium
است. Gateway، پیکربندی، مسیریابی و ابزارها محلی باقی می‌مانند؛ فقط درخواست‌های
Grok به API شرکت xAI ارسال می‌شوند.

OAuth به کلید API سرویس xAI یا برنامهٔ Grok Build نیاز ندارد. بااین‌حال، ممکن است xAI
در صفحهٔ رضایت Grok Build را نمایش دهد، زیرا OpenClaw از کلاینت مشترک
OAuth سرویس xAI استفاده می‌کند.

## راه‌اندازی

<Steps>
  <Step title="نصب جدید">
    فرایند راه‌اندازی اولیه را همراه با نصب دیمون اجرا کنید، سپس در مرحلهٔ
    مدل/احراز هویت، OAuth سرویس xAI/Grok را انتخاب کنید:

    ```bash
    openclaw onboard --install-daemon
    ```

    در VPS یا از طریق SSH، مستقیماً OAuth سرویس xAI را انتخاب کنید؛ این روش از تأیید
    کد دستگاه استفاده می‌کند و به بازفراخوانی localhost نیاز ندارد:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="نصب موجود">
    فقط وارد xAI شوید؛ صرفاً برای اتصال Grok، کل فرایند راه‌اندازی اولیه را دوباره اجرا نکنید:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    مدل Grok را جداگانه به‌عنوان مدل پیش‌فرض اعمال کنید:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    کل فرایند راه‌اندازی اولیه را فقط زمانی دوباره اجرا کنید که عمداً می‌خواهید Gateway،
    دیمون، کانال، فضای کاری یا سایر گزینه‌های راه‌اندازی را تغییر دهید.

  </Step>
  <Step title="مسیر کلید API">
    راه‌اندازی با کلید API همچنان برای کلیدهای xAI Console و سطوح رسانه‌ای
    نیازمند پیکربندی ارائه‌دهندهٔ مبتنی بر کلید کار می‌کند:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="انتخاب مدل">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw از API سرویس Responses شرکت xAI به‌عنوان انتقال همراه xAI استفاده می‌کند. همان
اعتبارنامهٔ `openclaw models auth login --provider xai --method oauth` یا
`--method api-key`، نیروی `web_search` (شناسهٔ ارائه‌دهنده `grok`)، `x_search`،
`code_execution`، گفتار/رونویسی و تولید تصویر/ویدیوی xAI را نیز تأمین می‌کند. اگر
یک کلید xAI را زیر `plugins.entries.xai.config.webSearch.apiKey` ذخیره کنید،
ارائه‌دهندهٔ همراه مدل xAI آن را نیز به‌عنوان مسیر جایگزین استفاده می‌کند.
</Note>

## عیب‌یابی OAuth

- برای SSH، Docker، VPS یا سایر راه‌اندازی‌های راه‌دور، از
  `openclaw models auth login --provider xai --method oauth` استفاده کنید؛ این روش از
  تأیید کد دستگاه استفاده می‌کند، نه بازفراخوانی localhost.
- اگر ورود موفق است اما Grok مدل پیش‌فرض نیست،
  `openclaw models set xai/grok-4.3` را اجرا کنید.
- پروفایل‌های ذخیره‌شدهٔ احراز هویت xAI را بررسی کنید:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- این xAI است که تصمیم می‌گیرد کدام حساب‌ها بتوانند توکن‌های API مبتنی بر OAuth دریافت کنند. اگر حسابی
  واجد شرایط نیست، از مسیر کلید API استفاده کنید یا اشتراک را در سمت xAI بررسی کنید.

<Tip>
هنگام ورود از SSH، Docker یا VPS از `xai-oauth` استفاده کنید. OpenClaw یک
URL و کد کوتاه نمایش می‌دهد؛ در حالی که فرایند راه‌دور برای تکمیل تبادل توکن
از xAI استعلام می‌کند، ورود را در هر مرورگر محلی تکمیل کنید.
</Tip>

## کاتالوگ داخلی

شناسه‌های قابل انتخاب در انتخاب‌گرهای مدل. Plugin همچنان شناسه‌های قدیمی Grok 3،
Grok 4، Grok 4 Fast، Grok 4.1 Fast و Grok Code را برای پیکربندی‌های موجود برطرف می‌کند؛
[سازگاری قدیمی و نام‌های مستعار متغیر](#legacy-compatibility-and-moving-aliases) را ببینید.

| خانواده         | شناسه‌های مدل                                                    |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5` (نام‌های مستعار: `grok-4.5-latest`، `grok-build-latest`) |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3` (نام‌های مستعار: `grok-4.3-latest`، `grok-latest`)       |
| Grok 4.20      | `grok-4.20-0309-reasoning`، `grok-4.20-0309-non-reasoning`   |

<Tip>
برای گفت‌وگوی عمومی، کدنویسی و کار عامل‌محور، هر جا در دسترس است از `grok-4.5` استفاده کنید.
Grok 4.3 همچنان پیش‌فرض راه‌اندازی امن از نظر منطقه‌ای است؛ `grok-build-0.1` و هر دو
گونهٔ تاریخ‌دار Grok 4.20 همچنان قابل انتخاب‌اند.
</Tip>

## پوشش قابلیت‌ها

Plugin همراه، APIهای پشتیبانی‌شدهٔ xAI را به قراردادهای مشترک ارائه‌دهنده و
ابزار OpenClaw نگاشت می‌کند. قابلیت‌هایی که در قرارداد مشترک نمی‌گنجند،
در ادامه یا زیر محدودیت‌های شناخته‌شده فهرست شده‌اند.

| قابلیت xAI             | سطح OpenClaw                        | وضعیت                                               |
| -------------------------- | --------------------------------------- | ---------------------------------------------------- |
| گفت‌وگو / Responses           | ارائه‌دهندهٔ مدل `xai/<model>`            | بله                                                  |
| جست‌وجوی وب سمت سرور     | ارائه‌دهندهٔ `web_search` با `grok`            | بله                                                  |
| جست‌وجوی X سمت سرور       | ابزار `x_search`                         | بله                                                  |
| اجرای کد سمت سرور | ابزار `code_execution`                   | بله                                                  |
| تصاویر                     | `image_generate`                        | بله                                                  |
| ویدیوها                     | `video_generate`                        | بله                                                  |
| تبدیل دسته‌ای متن به گفتار       | `messages.tts.provider: "xai"` / `tts`  | بله                                                  |
| TTS جریانی              | `textToSpeechStream`                    | بله، از طریق `wss://api.x.ai/v1/tts` (نه صدای بلادرنگ) |
| تبدیل دسته‌ای گفتار به متن       | درک رسانه‌ای `tools.media.audio` | بله                                                  |
| تبدیل جریانی گفتار به متن   | Voice Call `streaming.provider: "xai"`  | بله                                                  |
| صدای بلادرنگ             | Talk `talk.realtime.provider: "xai"`    | بله؛ بازپخش از طریق Gateway برای Nodeهای بومی Talk             |
| فایل‌ها / دسته‌ها            | فقط سازگاری با API عمومی مدل    | ابزار سطح‌اول OpenClaw نیست                      |

<Note>
OpenClaw برای تولید رسانه و رونویسی دسته‌ای از APIهای REST تصویر/ویدیو/TTS/STT
سرویس xAI، برای رونویسی زندهٔ تماس صوتی از WebSocket جریانی STT سرویس xAI،
برای نشست‌های بلادرنگ Talk از WebSocket عامل صوتی Grok سرویس xAI،
و برای ابزارهای گفت‌وگو، جست‌وجو و اجرای کد از API سرویس Responses استفاده می‌کند.
</Note>

### سازگاری قدیمی حالت سریع

`/fast on` یا `agents.defaults.models["xai/<model>"].params.fastMode: true`
همچنان پیکربندی‌های قدیمی xAI را به شکل زیر بازنویسی می‌کند. این شناسه‌های مقصد
فقط برای سازگاری نگه داشته شده‌اند؛ برای پیکربندی‌های جدید از مدل‌های قابل انتخاب
فعلی استفاده کنید.

| مدل مبدأ  | مقصد حالت سریع   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### سازگاری قدیمی و نام‌های مستعار متغیر

نام‌های مستعار قدیمی به شکل زیر نرمال‌سازی می‌شوند:

| نام مستعار قدیمی                                                  | شناسهٔ نرمال‌شده    |
| ------------------------------------------------------------- | ---------------- |
| `grok-code-fast-1`، `grok-code-fast`، `grok-code-fast-1-0825` | `grok-build-0.1` |

شناسه‌های تاریخ‌دار 0309 ورودی‌های قابل انتخاب کاتالوگ هستند. OpenClaw همهٔ نام‌های مستعار
فعلی دیگر Grok 4.20 را عیناً ارسال می‌کند تا کنترل معنای نام‌های مستعار پایدار، latest،
بتا، آزمایشی و تاریخ‌دار در اختیار xAI باقی بماند. نام مستعار سراسری `grok-latest`
نیز عیناً حفظ می‌شود.

xAI شناسه‌های دقیق زیر را بازنشسته کرده است. OpenClaw آن‌ها را به‌عنوان ردیف‌های پنهان سازگاری
برای پیکربندی‌های منتشرشده، با محدودیت‌ها و قیمت‌گذاری مقاصد هدایت فعلی‌شان
نگه می‌دارد:

| شناسه‌های بازنشسته                                                          | رفتار فعلی                 |
| -------------------------------------------------------------------- | -------------------------------- |
| `grok-4-1-fast-reasoning`، `grok-4-fast-reasoning`، `grok-4-0709`    | Grok 4.3 با استدلال `low`    |
| `grok-4-1-fast-non-reasoning`، `grok-4-fast-non-reasoning`، `grok-3` | Grok 4.3 با استدلال غیرفعال |
| `grok-code-fast-1`                                                   | Grok Build 0.1                   |
| `grok-imagine-image-pro`                                             | کیفیت تصویر Grok Imagine       |

`openclaw doctor --fix` پیش‌فرض‌های پایدارشدهٔ ابزار سمت سرور xAI و نامک
بازنشستهٔ کیفیت تصویر را به‌روزرسانی می‌کند، ردیف‌های قدیمی کاتالوگ تولیدشده را حذف می‌کند و
فرادادهٔ قدیمی زمینه را در ردیف‌های فعال 4.20 اصلاح می‌کند. این کار نام‌های مستعار فعال
`beta-latest` از 4.20 را به یک تصویر لحظه‌ای تاریخ‌دار سنجاق نمی‌کند.

## قابلیت‌ها

<Warning>
  `x_search` و `code_execution` روی سرورهای xAI اجرا می‌شوند. xAI به‌ازای هر 1,000
  فراخوانی ابزار، $5 به‌علاوهٔ توکن‌های ورودی و خروجی مدل هزینه دریافت می‌کند. اگر تنظیم
  `enabled` هر ابزار درج نشده باشد، OpenClaw آن را فقط برای یک مدل فعال xAI ارائه می‌کند.
  یک ارائه‌دهندهٔ مدل شناخته‌شدهٔ غیر xAI به `enabled: true` صریح برای هر ابزار نیاز دارد؛
  ارائه‌دهندهٔ مفقود یا حل‌نشده به‌صورت بسته شکست می‌خورد. احراز هویت xAI همیشه الزامی است
  و `enabled: false` ابزار را برای همهٔ ارائه‌دهندگان غیرفعال می‌کند.
</Warning>

<AccordionGroup>
  <Accordion title="جست‌وجوی وب">
    ارائه‌دهندهٔ همراه جست‌وجوی وب `grok`، OAuth سرویس xAI را ترجیح می‌دهد و سپس
    به `XAI_API_KEY` یا کلید جست‌وجوی وب یک Plugin بازمی‌گردد:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="تولید ویدیو">
    Plugin همراه `xai`، تولید ویدیو را از طریق ابزار مشترک
    `video_generate` ثبت می‌کند.

    - مدل پیش‌فرض: `xai/grok-imagine-video`
    - مدل اضافی: `xai/grok-imagine-video-1.5`
    - حالت‌های کلاسیک: متن‌به‌ویدیو، تصویر‌به‌ویدیو، تولید با تصویر مرجع،
      ویرایش ویدیوی راه‌دور و گسترش ویدیوی راه‌دور
    - حالت Video 1.5: فقط تصویر‌به‌ویدیو، با دقیقاً یک تصویر قاب نخست
    - نسبت‌های ابعاد: `1:1`، `16:9`، `9:16`، `4:3`، `3:4`، `3:2`، `2:3`؛
      در صورت حذف، حالت کلاسیک و تصویر‌به‌ویدیوی Video 1.5 نسبت تصویر مبدأ را
      به ارث می‌برند
    - وضوح‌ها: کلاسیک `480P`/`720P`؛ Video 1.5 از `1080P` نیز پشتیبانی می‌کند؛ همهٔ
      حالت‌های تولید به‌طور پیش‌فرض از `480P` استفاده می‌کنند
    - مدت: 1-15 ثانیه برای تولید/تصویر‌به‌ویدیو، 1-10 ثانیه هنگام
      استفاده از نقش‌های کلاسیک `reference_image`، و 2-10 ثانیه برای گسترش کلاسیک
    - تولید با تصویر مرجع: برای
      هر تصویر ارائه‌شده، `imageRoles` را روی `reference_image` تنظیم کنید؛ xAI حداکثر 7 تصویر از این نوع را می‌پذیرد
    - ویرایش/گسترش ویدیو، نسبت ابعاد و وضوح ویدیوی ورودی را به ارث می‌برند؛
      این عملیات جایگزینی هندسه را نمی‌پذیرند
    - مهلت زمانی پیش‌فرض عملیات: 600 ثانیه، مگر اینکه `video_generate.timeoutMs`
      یا `agents.defaults.videoGenerationModel.timeoutMs` تنظیم شده باشد

    <Warning>
    بافرهای ویدیویی محلی پذیرفته نمی‌شوند. برای ورودی‌های ویرایش/گسترش ویدیو از URLهای راه‌دور
    `http(s)` استفاده کنید. تصویر‌به‌ویدیو بافرهای تصویر محلی را می‌پذیرد، زیرا
    OpenClaw آن‌ها را برای xAI به‌صورت URL داده‌ای کدگذاری می‌کند.
    </Warning>

    Video 1.5 شناسه‌های `grok-imagine-video-1.5-preview` و
    `grok-imagine-video-1.5-2026-05-30` سرویس xAI را نیز تشخیص می‌دهد. OpenClaw
    شناسهٔ انتخاب‌شده را بدون تغییر ارسال می‌کند، اما همان اعتبارسنجی فقط‌تصویر را اعمال می‌کند.

    برای استفاده از xAI به‌عنوان ارائه‌دهندهٔ پیش‌فرض ویدیو:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار تغییر مسیر هنگام خرابی،
    [تولید ویدیو](/fa/tools/video-generation) را ببینید.
    </Note>

  </Accordion>

  <Accordion title="تولید تصویر">
    Plugin همراه `xai`، تولید تصویر را از طریق ابزار مشترک
    `image_generate` ثبت می‌کند.

    - مدل پیش‌فرض تصویر: `xai/grok-imagine-image`
    - مدل اضافی: `xai/grok-imagine-image-quality`
    - حالت‌ها: تبدیل متن به تصویر و ویرایش تصویر مرجع
    - ورودی‌های مرجع: یک `image` یا حداکثر سه `images`
    - نسبت‌های ابعاد: `1:1`، `16:9`، `9:16`، `4:3`، `3:4`، `3:2`، `2:3`، `2:1`،
      `1:2`، `19.5:9`، `9:19.5`، `20:9`، `9:20`
    - وضوح‌ها: `1K`، `2K`
    - تعداد: حداکثر 4 تصویر
    - مهلت زمانی پیش‌فرض عملیات: 600 ثانیه، مگر اینکه `image_generate.timeoutMs`
      یا `agents.defaults.imageGenerationModel.timeoutMs` تنظیم شده باشد

    OpenClaw پاسخ‌های تصویری `b64_json` را از xAI درخواست می‌کند تا رسانه تولیدشده
    بتواند از طریق مسیر عادی پیوست کانال ذخیره و تحویل داده شود. تصاویر
    مرجع محلی به URLهای داده تبدیل می‌شوند؛ ارجاع‌های راه‌دور `http(s)`
    بدون تغییر عبور می‌کنند.

    برای استفاده از xAI به‌عنوان ارائه‌دهنده پیش‌فرض تصویر:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI همچنین `quality`، `mask`، `user` و نسبت ابعاد `auto` را مستند کرده است.
    OpenClaw در حال حاضر فقط کنترل‌های تصویری مشترک میان ارائه‌دهندگان را ارسال می‌کند؛
    این گزینه‌های مختص xAI از طریق `image_generate` در دسترس نیستند.
    </Note>

  </Accordion>

  <Accordion title="تبدیل متن به گفتار">
    Plugin همراه `xai` قابلیت تبدیل متن به گفتار را از طریق سطح مشترک ارائه‌دهنده `tts`
    ثبت می‌کند.

    - صداها: فهرست زنده و احراز هویت‌شده از xAI؛ آن را با
      `openclaw infer tts voices --provider xai` فهرست کنید
    - صداهای جایگزین آفلاین: `ara`، `eve`، `leo`، `rex`، `sal`
    - صدای پیش‌فرض: `eve`
    - شناسه‌های صدای سفارشی حساب، حتی در صورت نبودن در پاسخ
      فهرست داخلی، ارسال می‌شوند
    - قالب‌ها: `mp3`، `wav`، `pcm`، `mulaw`، `alaw`
    - زبان: کد BCP-47 یا `auto`
    - سرعت: بازنویسی سرعت بومی ارائه‌دهنده
    - قالب بومی یادداشت صوتی Opus پشتیبانی نمی‌شود

    برای استفاده از xAI به‌عنوان ارائه‌دهنده پیش‌فرض TTS:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw برای سنتز بافرشده از نقطه پایانی دسته‌ای `/v1/tts` متعلق به xAI،
    برای کشف فهرست احراز هویت‌شده از `/v1/tts/voices` و برای سنتز جریانی از
    `wss://api.x.ai/v1/tts` بومی استفاده می‌کند. جریان به میزبان بومی
    `api.x.ai` محدود است، بنابراین مقادیر سفارشی `baseUrl` در این
    مسیر رد می‌شوند. این قابلیت از کنترل‌های موجود زبان، صدا، کُدک و سرعت استفاده می‌کند؛
    مقادیر پیش‌فرض xAI برای نرخ نمونه‌برداری و نرخ بیت اعمال می‌شوند. سنتز فایل صوتی همه
    کُدک‌های پیکربندی‌شده را رعایت می‌کند. مقصدهای یادداشت صوتی برای جریان و حالت جایگزین
    بافرشده از MP3 استفاده می‌کنند، زیرا کُدک‌های خام xAI فراداده کُدک/نرخ را حمل نمی‌کنند.
    جریان ابتدا `text.delta` و سپس
    `text.done` را ارسال می‌کند، `audio.delta`، `audio.done` یا `error` را دریافت می‌کند و
    یک `timeoutMs` بیکاری اعمال می‌کند که با هر قطعه صوتی تازه‌سازی می‌شود. این قابلیت از
    نشست‌های صوتی بی‌درنگ جدا است. قرارداد [API جریانی TTS](https://docs.x.ai/developers/rest-api-reference/inference/voice) متعلق به xAI را ببینید.
    </Note>

  </Accordion>

  <Accordion title="تبدیل گفتار به متن">
    Plugin همراه `xai` تبدیل دسته‌ای گفتار به متن را از طریق سطح رونویسی
    درک رسانه OpenClaw ثبت می‌کند.

    - نقطه پایانی: REST xAI، `/v1/stt`
    - مسیر ورودی: بارگذاری فایل صوتی چندبخشی
    - انتخاب مدل: xAI مدل رونویسی را به‌صورت داخلی انتخاب می‌کند؛
      نقطه پایانی انتخاب‌گر مدل ندارد
    - در هر جایی که رونویسی صدای ورودی `tools.media.audio` را می‌خواند استفاده می‌شود،
      از جمله بخش‌های کانال صوتی Discord و پیوست‌های صوتی کانال

    برای اجبار استفاده از xAI جهت رونویسی صدای ورودی:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
              },
            ],
          },
        },
      },
    }
    ```

    زبان را می‌توان از طریق پیکربندی مشترک رسانه صوتی یا درخواست رونویسی
    هر فراخوانی ارائه کرد. راهنمایی‌های اعلان توسط سطح مشترک OpenClaw پذیرفته می‌شوند،
    اما یکپارچه‌سازی REST تبدیل گفتار به متن xAI فقط فایل و زبان را ارسال می‌کند،
    زیرا تنها این موارد با نقطه پایانی عمومی کنونی xAI نگاشت دارند.

  </Accordion>

  <Accordion title="تبدیل جریانی گفتار به متن">
    Plugin همراه `xai` همچنین یک ارائه‌دهنده رونویسی بی‌درنگ
    برای صدای تماس صوتی زنده ثبت می‌کند.

    - نقطه پایانی: WebSocket متعلق به xAI، `wss://api.x.ai/v1/stt`
    - کدگذاری پیش‌فرض: `mulaw`
    - نرخ نمونه‌برداری پیش‌فرض: `8000`
    - تشخیص پایان گفتار پیش‌فرض: `800ms`
    - رونویسی‌های موقت: به‌طور پیش‌فرض فعال

    جریان رسانه Twilio در Voice Call قاب‌های صوتی G.711 mu-law را ارسال می‌کند، بنابراین
    ارائه‌دهنده xAI این قاب‌ها را مستقیماً و بدون تراکدگذاری ارسال می‌کند:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    پیکربندی تحت مالکیت ارائه‌دهنده در
    `plugins.entries.voice-call.config.streaming.providers.xai` قرار دارد. کلیدهای
    پشتیبانی‌شده عبارت‌اند از `apiKey`، `baseUrl`، `sampleRate`، `encoding` ‏(`pcm`، `mulaw` یا
    `alaw`)، `interimResults`، `endpointingMs` و `language`.

    <Note>
    این ارائه‌دهنده جریانی برای مسیر رونویسی بی‌درنگ Voice Call است.
    Discord بخش‌های کوتاه را ضبط می‌کند و در عوض از مسیر رونویسی دسته‌ای
    `tools.media.audio` استفاده می‌کند.
    </Note>

  </Accordion>

  <Accordion title="صدای بی‌درنگ (Talk)">
    Plugin همراه `xai` نشست‌های بی‌درنگ Grok Voice Agent را برای
    حالت Talk از طریق قرارداد مشترک `registerRealtimeVoiceProvider` ثبت می‌کند.

    - نقطه پایانی: `wss://api.x.ai/v1/realtime?model=<voice-model>`
    - مدل پیش‌فرض: `grok-voice-latest`
    - صدای پیش‌فرض: `eve`
    - انتقال: `gateway-relay` (مسیرهای رله iOS، Android و Control UI)
    - صدا: PCM16 با 24 kHz یا G.711 µ-law با 8 kHz
    - قطع میان‌گفتار: VAD سرور xAI پاسخ را قطع می‌کند؛ OpenClaw پخش صف‌شده را پاک می‌کند
      و تاریخچه پخش‌نشده ارائه‌دهنده را کوتاه می‌کند

    Talk را در Gateway پیکربندی کنید:

    ```json5
    {
      talk: {
        realtime: {
          provider: "xai",
          mode: "realtime",
          transport: "gateway-relay",
          brain: "agent-consult",
          providers: {
            xai: {
              model: "grok-voice-latest",
              voice: "eve",
              // فقط در صورتی فعال کنید که بازپخش نشست در سمت ارائه‌دهنده پذیرفتنی باشد.
              sessionResumption: false,
            },
          },
        },
      },
      env: { XAI_API_KEY: "xai-..." },
    }
    ```

    پیکربندی تحت مالکیت ارائه‌دهنده همچنین از
    `plugins.entries.voice-call.config.realtime.providers.xai` تفکیک می‌شود، هنگامی که Voice Call
    یا انتخاب‌گرهای بی‌درنگ مشترک همان نگاشت ارائه‌دهنده را دوباره استفاده کنند. کلیدهای پشتیبانی‌شده
    عبارت‌اند از `apiKey`، `baseUrl`، `model`، `voice`، `vadThreshold`، `silenceDurationMs`،
    `prefixPaddingMs`، `reasoningEffort` و `sessionResumption`.
    `reasoningEffort` فقط `high` یا `none` را می‌پذیرد که با API متعلق به xAI Voice Agent مطابقت دارد.

    VAD سرور xAI همیشه پاسخ‌ها را ایجاد و وقفه صوتی را مدیریت می‌کند.
    از `consultRouting: "provider-direct"` استفاده کنید؛ مسیریابی اجباری رونویسی و غیرفعال‌کردن
    وقفه صدای ورودی توسط پروتکل xAI Voice Agent پشتیبانی نمی‌شوند.

    <Note>
    OAuth متعلق به xAI یا `XAI_API_KEY` می‌تواند صدای بی‌درنگ را احراز هویت کند.
    WebRTC تحت مالکیت مرورگر هنوز بخشی از این سطح ارائه‌دهنده نیست؛ از Talk با gateway-relay
    در Nodeهای بومی یا مسیر رله Control UI استفاده کنید.
    </Note>

    <Note>
    مقدار پیش‌فرض `sessionResumption` برابر `false` است. وقتی روی `true` تنظیم شود، OpenClaw از
    xAI می‌خواهد وضعیت کافی از نشست را نگه دارد تا همان مکالمه پس از
    اتصال مجدد از سر گرفته شود و سپس با شناسه مکالمه بازگشتی دوباره متصل می‌شود. اگر
    بازپخش/نگه‌داری در سمت ارائه‌دهنده پذیرفتنی نیست، آن را غیرفعال نگه دارید؛ در این صورت
    سوکت‌های قطع‌شده به‌جای آغاز بی‌سروصدای یک مکالمه تازه، به‌صورت بسته و ایمن شکست می‌خورند.
    </Note>

  </Accordion>

  <Accordion title="پیکربندی x_search">
    Plugin همراه xAI، ابزار `x_search` را برای
    جست‌وجوی محتوای X (Twitter سابق) از طریق Grok در OpenClaw ارائه می‌کند.

    مسیر پیکربندی: `plugins.entries.xai.config.xSearch`

    | کلید               | نوع    | پیش‌فرض                   | توضیحات                                      |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | بولی | خودکار برای مدل‌های xAI  | غیرفعال‌کردن، یا فعال‌سازی برای یک ارائه‌دهنده شناخته‌شده غیر xAI |
    | `model`           | رشته  | `grok-4.3`                | مدل مورداستفاده برای درخواست‌های x_search                 |
    | `baseUrl`         | رشته  | -                         | بازنویسی URL پایه Responses متعلق به xAI                  |
    | `inlineCitations` | بولی | -                         | گنجاندن ارجاع‌های درون‌خطی در نتایج              |
    | `maxTurns`        | عدد  | -                         | حداکثر نوبت‌های مکالمه                       |
    | `timeoutSeconds`  | عدد  | `30`                      | مهلت زمانی درخواست برحسب ثانیه                       |
    | `cacheTtlMinutes` | عدد  | `15`                      | زمان ماندگاری حافظه نهان برحسب دقیقه                    |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4.3",
                baseUrl: "https://api.x.ai/v1",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="پیکربندی اجرای کد">
    Plugin همراه xAI، ابزار `code_execution` را برای
    اجرای راه‌دور کد در محیط جعبه شنی xAI در OpenClaw ارائه می‌کند.

    مسیر پیکربندی: `plugins.entries.xai.config.codeExecution`

    | کلید              | نوع    | پیش‌فرض                  | توضیحات                                      |
    | ---------------- | ------- | ------------------------ | ------------------------------------------------ |
    | `enabled`        | بولی | خودکار برای مدل‌های xAI | غیرفعال‌کردن، یا فعال‌سازی برای یک ارائه‌دهنده شناخته‌شده غیر xAI |
    | `model`          | رشته  | `grok-4.3`               | مدل مورداستفاده برای درخواست‌های اجرای کد           |
    | `maxTurns`       | عدد  | -                        | حداکثر نوبت‌های مکالمه                       |
    | `timeoutSeconds` | عدد  | `30`                     | مهلت زمانی درخواست برحسب ثانیه                       |

    <Note>
    این اجرای راه‌دور در جعبه شنی xAI است، نه [`exec`](/fa/tools/exec) محلی.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4.3",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="محدودیت‌های شناخته‌شده">
    - احراز هویت xAI می‌تواند از یک کلید API، متغیر محیطی، تنظیمات Plugin به‌عنوان
      راهکار جایگزین، یا OAuth با یک حساب واجد شرایط xAI استفاده کند. OAuth بدون
      فراخوانی برگشتی localhost از تأیید با کد دستگاه استفاده می‌کند. xAI تعیین می‌کند
      کدام حساب‌ها می‌توانند توکن‌های API مربوط به OAuth را دریافت کنند، و ممکن است صفحه رضایت
      Grok Build را نمایش دهد، هرچند OpenClaw به برنامه Grok Build نیازی ندارد.
    - OpenClaw در حال حاضر خانواده مدل چندعاملی xAI را ارائه نمی‌کند. xAI
      این مدل‌ها را از طریق Responses API ارائه می‌دهد، اما آن‌ها ابزارهای سمت کلاینت
      یا سفارشی مورد استفاده در حلقه عامل مشترک OpenClaw را نمی‌پذیرند.
      به
      [محدودیت‌های چندعاملی xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations)
      مراجعه کنید.
    - صدای بی‌درنگ xAI در حال حاضر فقط انتقال Talk با رله Gateway را ارائه می‌دهد.
      نشست‌های WebSocket ارائه‌دهنده که تحت مالکیت مرورگر هستند هنوز در Control UI
      متصل نشده‌اند.
    - تصویر xAI با `quality`، تصویر با `mask` و نسبت‌های ابعاد اضافی مختص حالت بومی
      تا زمانی که ابزار مشترک `image_generate` کنترل‌های متناظر
      میان‌ارائه‌دهنده‌ای نداشته باشد، ارائه نمی‌شوند.
  </Accordion>

  <Accordion title="نکات پیشرفته">
    - OpenClaw اصلاحات سازگاری مختص xAI برای طرح‌واره ابزار و فراخوانی ابزار را
      به‌طور خودکار در مسیر اجراکننده مشترک اعمال می‌کند.
    - درخواست‌های بومی xAI به‌طور پیش‌فرض `tool_stream: true` هستند. برای
      غیرفعال‌کردن آن، `agents.defaults.models["xai/<model>"].params.tool_stream` را روی `false`
      تنظیم کنید.
    - پوشش‌دهنده همراه xAI پیش از ارسال درخواست‌های بومی xAI، محدودیت‌های پشتیبانی‌نشده
      شمارش contains در طرح‌واره و کلیدهای پشتیبانی‌نشده *تلاش* در بارِ استدلال را حذف می‌کند.
      Grok 4.5 از تلاش کم، متوسط و زیاد پشتیبانی می‌کند (پیش‌فرض زیاد است).
      Grok 4.3 از تلاش بدون تلاش، کم، متوسط و زیاد پشتیبانی می‌کند
      (پیش‌فرض کم است). سایر مدل‌های xAI دارای قابلیت استدلال، کنترل تلاش
      قابل‌تنظیمی ارائه نمی‌کنند، اما همچنان `include: ["reasoning.encrypted_content"]`
      را درخواست می‌کنند تا استدلال رمزگذاری‌شده پیشین در نوبت‌های بعدی
      بازپخش شود.
    - `web_search`، `x_search` و `code_execution` به‌عنوان ابزارهای OpenClaw
      ارائه می‌شوند. OpenClaw به‌جای پیوست‌کردن همه ابزارهای بومی به هر نوبت
      گفتگو، فقط ابزار داخلی مشخص xAI را که هر ابزار نیاز دارد به درخواست آن
      ابزار پیوست می‌کند.
    - Grok `web_search` مقدار `plugins.entries.xai.config.webSearch.baseUrl` را می‌خواند.
      `x_search` مقدار `plugins.entries.xai.config.xSearch.baseUrl` را می‌خواند و سپس
      به‌عنوان راهکار جایگزین از URL پایه جست‌وجوی وب Grok استفاده می‌کند.
    - `x_search` و `code_execution` به‌جای آنکه به‌صورت ثابت در زمان‌اجرای اصلی مدل
      کدنویسی شده باشند، تحت مالکیت Plugin همراه xAI هستند.
    - `code_execution` اجرای راه‌دور در محیط ایزوله xAI است، نه
      [`exec`](/fa/tools/exec) محلی.
  </Accordion>
</AccordionGroup>

## آزمایش زنده

مسیرهای رسانه‌ای xAI تحت پوشش آزمون‌های واحد و مجموعه‌آزمون‌های زنده اختیاری هستند. پیش از
اجرای کاوش‌های زنده، `XAI_API_KEY` را در محیط فرایند صادر کنید.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

فایل زنده مختص ارائه‌دهنده، TTS عادی و TTS با PCM مناسب تلفن را تولید می‌کند،
صدا را از طریق STT دسته‌ای xAI رونویسی می‌کند، همان PCM را از طریق STT
بی‌درنگ xAI پخش جریانی می‌کند، خروجی متن‌به‌تصویر تولید می‌کند و یک تصویر مرجع
را ویرایش می‌کند. فایل زنده مشترک تصویر، همان ارائه‌دهنده xAI را از طریق
انتخاب زمان‌اجرای OpenClaw، راهکار جایگزین، عادی‌سازی و مسیر پیوست رسانه
تأیید می‌کند. مورد اختیاری Video 1.5 یک تصویر تولیدشده برای نخستین فریم را با
کیفیت 1080P ارسال می‌کند و بارگیری ویدیوی تکمیل‌شده را تأیید می‌کند.

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار تغییر مسیر هنگام خرابی.
  </Card>
  <Card title="تولید ویدیو" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار مشترک ویدیو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="همه ارائه‌دهندگان" href="/fa/providers/index" icon="grid-2">
    نمای کلی گسترده‌تر ارائه‌دهندگان.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و راه‌حل‌ها.
  </Card>
</CardGroup>
