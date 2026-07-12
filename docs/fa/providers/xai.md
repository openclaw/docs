---
read_when:
    - می‌خواهید از مدل‌های Grok در OpenClaw استفاده کنید
    - شما در حال پیکربندی احراز هویت xAI یا شناسه‌های مدل هستید
summary: استفاده از مدل‌های xAI Grok در OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-07-12T10:45:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eba797fbb2f4f2a47c8e07daabe93ef4f6e5a8077d3c739b0f6b9c99283995e1
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw یک Plugin داخلی `xai` برای مدل‌های Grok ارائه می‌کند. مسیر
پیشنهادی، استفاده از OAuth گراک با اشتراک واجد شرایط SuperGrok یا X Premium
است. Gateway، پیکربندی، مسیریابی و ابزارها محلی باقی می‌مانند؛ فقط درخواست‌های
Grok به API شرکت xAI ارسال می‌شوند.

OAuth به کلید API شرکت xAI یا برنامه Grok Build نیاز ندارد. بااین‌حال، ممکن است
xAI در صفحه رضایت، Grok Build را نمایش دهد، زیرا OpenClaw از کارخواه OAuth
مشترک xAI استفاده می‌کند.

## راه‌اندازی

<Steps>
  <Step title="نصب جدید">
    فرایند راه‌اندازی اولیه را همراه با نصب دیمون اجرا کنید، سپس در مرحله
    مدل/احراز هویت، OAuth مربوط به xAI/Grok را انتخاب کنید:

    ```bash
    openclaw onboard --install-daemon
    ```

    در VPS یا هنگام استفاده از SSH، مستقیماً OAuth مربوط به xAI را انتخاب کنید؛
    این روش از تأیید با کد دستگاه استفاده می‌کند و به فراخوانی بازگشتی localhost
    نیاز ندارد:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="نصب موجود">
    فقط وارد xAI شوید؛ صرفاً برای اتصال Grok، کل فرایند راه‌اندازی اولیه را
    دوباره اجرا نکنید:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    مدل Grok را جداگانه به‌عنوان مدل پیش‌فرض اعمال کنید:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    کل فرایند راه‌اندازی اولیه را فقط زمانی دوباره اجرا کنید که عمداً می‌خواهید
    Gateway، دیمون، کانال، فضای کاری یا دیگر گزینه‌های راه‌اندازی را تغییر دهید.

  </Step>
  <Step title="مسیر کلید API">
    راه‌اندازی با کلید API همچنان برای کلیدهای xAI Console و سطوح رسانه‌ای که
    به پیکربندی ارائه‌دهنده مبتنی بر کلید نیاز دارند، کار می‌کند:

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
OpenClaw از API پاسخ‌های xAI به‌عنوان انتقال‌دهنده داخلی xAI استفاده می‌کند.
همان اعتبارنامه‌ای که با `openclaw models auth login --provider xai --method oauth`
یا `--method api-key` ثبت می‌شود، ابزارهای `web_search` با شناسه ارائه‌دهنده
`grok`، ابزارهای `x_search` و `code_execution`، گفتار/رونویسی و تولید تصویر/ویدئو
با xAI را نیز فعال می‌کند. اگر کلید xAI را در
`plugins.entries.xai.config.webSearch.apiKey` ذخیره کنید، ارائه‌دهنده داخلی مدل
xAI آن را نیز به‌عنوان گزینه جایگزین استفاده می‌کند.
</Note>

## عیب‌یابی OAuth

- برای SSH، Docker، VPS یا دیگر راه‌اندازی‌های راه‌دور، از
  `openclaw models auth login --provider xai --method oauth` استفاده کنید؛ این
  روش از تأیید با کد دستگاه استفاده می‌کند، نه فراخوانی بازگشتی localhost.
- اگر ورود موفق است اما Grok مدل پیش‌فرض نیست، فرمان
  `openclaw models set xai/grok-4.3` را اجرا کنید.
- پروفایل‌های ذخیره‌شده احراز هویت xAI را بررسی کنید:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI تعیین می‌کند کدام حساب‌ها می‌توانند توکن‌های API مبتنی بر OAuth دریافت
  کنند. اگر حسابی واجد شرایط نیست، از مسیر کلید API استفاده کنید یا اشتراک را
  در سمت xAI بررسی کنید.

<Tip>
هنگام ورود از طریق SSH، Docker یا VPS از `xai-oauth` استفاده کنید. OpenClaw یک
نشانی اینترنتی و کد کوتاه چاپ می‌کند؛ درحالی‌که فرایند راه‌دور برای تکمیل تبادل
توکن از xAI نظرسنجی می‌کند، ورود را در هر مرورگر محلی به پایان برسانید.
</Tip>

## فهرست داخلی

شناسه‌های قابل انتخاب در انتخاب‌گرهای مدل. Plugin همچنان شناسه‌های قدیمی Grok 3،
Grok 4، Grok 4 Fast، Grok 4.1 Fast و Grok Code را برای پیکربندی‌های موجود
تفکیک می‌کند؛ به [سازگاری قدیمی و نام‌های مستعار متغیر](#legacy-compatibility-and-moving-aliases)
مراجعه کنید.

| خانواده         | شناسه‌های مدل                                                 |
| --------------- | ------------------------------------------------------------- |
| Grok 4.5        | `grok-4.5` (نام‌های مستعار: `grok-4.5-latest`، `grok-build-latest`) |
| Grok Build 0.1  | `grok-build-0.1`                                              |
| Grok 4.3        | `grok-4.3` (نام‌های مستعار: `grok-4.3-latest`، `grok-latest`) |
| Grok 4.20       | `grok-4.20-0309-reasoning`، `grok-4.20-0309-non-reasoning`    |

<Tip>
هرجا در دسترس است، برای گفت‌وگوی عمومی، برنامه‌نویسی و کارهای عامل‌محور از
`grok-4.5` استفاده کنید. Grok 4.3 همچنان پیش‌فرض راه‌اندازی ایمن برای مناطق
مختلف است؛ `grok-build-0.1` و هر دو گونه تاریخ‌دار Grok 4.20 نیز قابل انتخاب
باقی می‌مانند.
</Tip>

## پوشش قابلیت‌ها

Plugin داخلی، APIهای پشتیبانی‌شده xAI را به قراردادهای مشترک ارائه‌دهنده و
ابزار OpenClaw نگاشت می‌کند. قابلیت‌هایی که با قرارداد مشترک سازگار نیستند،
در ادامه یا در بخش محدودیت‌های شناخته‌شده فهرست شده‌اند.

| قابلیت xAI                         | سطح OpenClaw                              | وضعیت                                                             |
| ---------------------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| گفت‌وگو / پاسخ‌ها                  | ارائه‌دهنده مدل `xai/<model>`             | بله                                                                |
| جست‌وجوی وب سمت سرور               | ارائه‌دهنده `grok` برای `web_search`      | بله                                                                |
| جست‌وجوی X سمت سرور                | ابزار `x_search`                          | بله                                                                |
| اجرای کد سمت سرور                  | ابزار `code_execution`                    | بله                                                                |
| تصاویر                             | `image_generate`                          | بله                                                                |
| ویدئوها                            | `video_generate`                          | گردش‌کار کامل کلاسیک؛ تبدیل تصویر به ویدئو با Video 1.5           |
| تبدیل دسته‌ای متن به گفتار         | `messages.tts.provider: "xai"` / `tts`    | بله                                                                |
| تبدیل جریانی متن به گفتار          | -                                         | هنوز توسط ارائه‌دهنده xAI پیاده‌سازی نشده است                      |
| تبدیل دسته‌ای گفتار به متن         | درک رسانه‌ای `tools.media.audio`          | بله                                                                |
| تبدیل جریانی گفتار به متن          | `streaming.provider: "xai"` در تماس صوتی  | بله                                                                |
| صدای بلادرنگ                       | -                                         | هنوز ارائه نشده است؛ به قرارداد نشست/WebSocket متفاوتی نیاز دارد |
| فایل‌ها / دسته‌ها                  | فقط سازگاری با API عمومی مدل              | ابزار سطح‌اول OpenClaw نیست                                        |

<Note>
OpenClaw برای تولید رسانه و رونویسی دسته‌ای از APIهای REST تصویر/ویدئو/TTS/STT
شرکت xAI، برای رونویسی زنده تماس صوتی از WebSocket جریانی STT شرکت xAI و برای
گفت‌وگو، جست‌وجو و ابزارهای اجرای کد از API پاسخ‌ها استفاده می‌کند.
</Note>

### سازگاری قدیمی حالت سریع

`/fast on` یا `agents.defaults.models["xai/<model>"].params.fastMode: true`
همچنان پیکربندی‌های قدیمی xAI را مطابق زیر بازنویسی می‌کند. این شناسه‌های مقصد
فقط برای سازگاری حفظ شده‌اند؛ برای پیکربندی‌های جدید از مدل‌های قابل انتخاب
فعلی استفاده کنید.

| مدل مبدأ        | مقصد حالت سریع     |
| --------------- | ------------------ |
| `grok-3`        | `grok-3-fast`      |
| `grok-3-mini`   | `grok-3-mini-fast` |
| `grok-4`        | `grok-4-fast`      |
| `grok-4-0709`   | `grok-4-fast`      |

### سازگاری قدیمی و نام‌های مستعار متغیر

نام‌های مستعار قدیمی به‌شکل زیر عادی‌سازی می‌شوند:

| نام مستعار قدیمی                                              | شناسه عادی‌شده   |
| ------------------------------------------------------------- | ---------------- |
| `grok-code-fast-1`، `grok-code-fast`، `grok-code-fast-1-0825` | `grok-build-0.1` |

شناسه‌های تاریخ‌دار 0309 ورودی‌های قابل انتخاب فهرست هستند. OpenClaw همه
نام‌های مستعار فعلی دیگر Grok 4.20 را بدون تغییر ارسال می‌کند تا xAI کنترل
معنای نام‌های مستعار پایدار، جدیدترین، بتا، آزمایشی و تاریخ‌دار را حفظ کند.
نام مستعار سراسری `grok-latest` نیز بدون تغییر حفظ می‌شود.

xAI شناسه‌های دقیق زیر را بازنشسته کرده است. OpenClaw آن‌ها را برای
پیکربندی‌های منتشرشده به‌صورت ردیف‌های سازگاری پنهان و با محدودیت‌ها و
قیمت‌گذاری مقصدهای تغییرمسیر فعلی‌شان حفظ می‌کند:

| شناسه‌های بازنشسته‌شده                                               | رفتار فعلی                         |
| -------------------------------------------------------------------- | ---------------------------------- |
| `grok-4-1-fast-reasoning`، `grok-4-fast-reasoning`، `grok-4-0709`    | Grok 4.3 با استدلال `low`          |
| `grok-4-1-fast-non-reasoning`، `grok-4-fast-non-reasoning`، `grok-3` | Grok 4.3 با استدلال غیرفعال        |
| `grok-code-fast-1`                                                   | Grok Build 0.1                     |
| `grok-imagine-image-pro`                                             | کیفیت تصویر Grok Imagine           |

`openclaw doctor --fix` پیش‌فرض‌های ماندگار ابزارهای سمت سرور xAI و نامک
بازنشسته‌شده تصویر باکیفیت را به‌روزرسانی می‌کند، ردیف‌های قدیمی فهرست
تولیدشده را حذف می‌کند و فراداده قدیمی زمینه را در ردیف‌های فعال 4.20 ترمیم
می‌کند. این فرمان نام‌های مستعار فعال `beta-latest` برای 4.20 را به یک
تصویر لحظه‌ای تاریخ‌دار مقید نمی‌کند.

## قابلیت‌ها

<Warning>
  `x_search` و `code_execution` روی سرورهای xAI اجرا می‌شوند. xAI برای هر
  ۱٬۰۰۰ فراخوانی ابزار ۵ دلار، به‌علاوه توکن‌های ورودی و خروجی مدل، هزینه
  دریافت می‌کند. اگر تنظیم `enabled` هر ابزار ذکر نشده باشد، OpenClaw آن را
  فقط برای یک مدل فعال xAI ارائه می‌کند. یک ارائه‌دهنده مدل مشخص و غیر xAI
  به `enabled: true` صریح برای هر ابزار نیاز دارد؛ ارائه‌دهنده ناموجود یا
  تفکیک‌نشده به‌شکل بسته و ایمن شکست می‌خورد. احراز هویت xAI همیشه الزامی است
  و `enabled: false` ابزار را برای همه ارائه‌دهندگان غیرفعال می‌کند.
</Warning>

<AccordionGroup>
  <Accordion title="جست‌وجوی وب">
    ارائه‌دهنده داخلی جست‌وجوی وب `grok` ابتدا OAuth مربوط به xAI را ترجیح
    می‌دهد و سپس به `XAI_API_KEY` یا کلید جست‌وجوی وب Plugin رجوع می‌کند:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="تولید ویدئو">
    Plugin داخلی `xai` تولید ویدئو را از طریق ابزار مشترک `video_generate`
    ثبت می‌کند.

    - مدل پیش‌فرض: `xai/grok-imagine-video`
    - مدل اضافی: `xai/grok-imagine-video-1.5`
    - حالت‌های کلاسیک: متن به ویدئو، تصویر به ویدئو، تولید با تصویر مرجع،
      ویرایش ویدئوی راه‌دور و گسترش ویدئوی راه‌دور
    - حالت Video 1.5: فقط تصویر به ویدئو، دقیقاً با یک تصویر فریم نخست
    - نسبت‌های ابعاد: `1:1`، `16:9`، `9:16`، `4:3`، `3:4`، `3:2`، `2:3`؛
      اگر مقدار ذکر نشود، حالت تصویر به ویدئوی کلاسیک و Video 1.5 نسبت تصویر
      مبدأ را به ارث می‌برند
    - وضوح‌ها: حالت کلاسیک `480P`/`720P`؛ Video 1.5 از `1080P` نیز پشتیبانی
      می‌کند؛ پیش‌فرض همه حالت‌های تولید `480P` است
    - مدت: ۱ تا ۱۵ ثانیه برای تولید/تصویر به ویدئو، ۱ تا ۱۰ ثانیه هنگام
      استفاده از نقش‌های کلاسیک `reference_image` و ۲ تا ۱۰ ثانیه برای
      گسترش کلاسیک
    - تولید با تصویر مرجع: برای همه تصاویر ارائه‌شده، `imageRoles` را روی
      `reference_image` تنظیم کنید؛ xAI حداکثر ۷ تصویر از این نوع می‌پذیرد
    - ویرایش/گسترش ویدئو، نسبت ابعاد و وضوح ویدئوی ورودی را به ارث می‌برد؛
      این عملیات تغییرات هندسی را نمی‌پذیرند
    - مهلت زمانی پیش‌فرض عملیات: ۶۰۰ ثانیه، مگر اینکه
      `video_generate.timeoutMs` یا `agents.defaults.videoGenerationModel.timeoutMs`
      تنظیم شده باشد

    <Warning>
    بافرهای ویدئوی محلی پذیرفته نمی‌شوند. برای ورودی‌های ویرایش/گسترش ویدئو از
    نشانی‌های راه‌دور `http(s)` استفاده کنید. تبدیل تصویر به ویدئو بافرهای
    تصویر محلی را می‌پذیرد، زیرا OpenClaw آن‌ها را برای xAI به‌صورت نشانی‌های
    داده رمزگذاری می‌کند.
    </Warning>

    Video 1.5 شناسه‌های `grok-imagine-video-1.5-preview` و
    `grok-imagine-video-1.5-2026-05-30` متعلق به xAI را نیز تشخیص می‌دهد.
    OpenClaw شناسه انتخاب‌شده را بدون تغییر ارسال می‌کند، اما همان اعتبارسنجی
    مختص تصویر را اعمال می‌کند.

    برای استفاده از xAI به‌عنوان ارائه‌دهنده پیش‌فرض ویدئو:

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
    برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار جابه‌جایی هنگام
    خرابی، به [تولید ویدئو](/fa/tools/video-generation) مراجعه کنید.
    </Note>

  </Accordion>

  <Accordion title="تولید تصویر">
    Plugin داخلی `xai` تولید تصویر را از طریق ابزار مشترک `image_generate`
    ثبت می‌کند.

    - مدل پیش‌فرض تصویر: `xai/grok-imagine-image`
    - مدل اضافی: `xai/grok-imagine-image-quality`
    - حالت‌ها: تبدیل متن به تصویر و ویرایش تصویر مرجع
    - ورودی‌های مرجع: یک `image` یا حداکثر سه `images`
    - نسبت‌های ابعاد: `1:1`، `16:9`، `9:16`، `4:3`، `3:4`، `3:2`، `2:3`، `2:1`،
      `1:2`، `19.5:9`، `9:19.5`، `20:9`، `9:20`
    - وضوح‌ها: `1K`، `2K`
    - تعداد: حداکثر ۴ تصویر
    - مهلت پیش‌فرض عملیات: ۶۰۰ ثانیه، مگر اینکه `image_generate.timeoutMs`
      یا `agents.defaults.imageGenerationModel.timeoutMs` تنظیم شده باشد

    OpenClaw پاسخ‌های تصویری `b64_json` را از xAI درخواست می‌کند تا رسانه تولیدشده
    بتواند از طریق مسیر عادی پیوست کانال ذخیره و تحویل شود. تصاویر مرجع محلی
    به نشانی‌های داده تبدیل می‌شوند؛ مراجع راه‌دور `http(s)` بدون تغییر
    عبور داده می‌شوند.

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
    OpenClaw در حال حاضر فقط کنترل‌های مشترک تصویر میان ارائه‌دهندگان را ارسال می‌کند؛
    این تنظیمات ویژه بومی از طریق `image_generate` در دسترس نیستند.
    </Note>

  </Accordion>

  <Accordion title="تبدیل متن به گفتار">
    Plugin همراه `xai`، قابلیت تبدیل متن به گفتار را از طریق سطح مشترک ارائه‌دهنده `tts`
    ثبت می‌کند.

    - صداها: فهرست زنده و احراز هویت‌شده از xAI؛ آن را با
      `openclaw infer tts voices --provider xai` فهرست کنید
    - صداهای جایگزین آفلاین: `ara`، `eve`، `leo`، `rex`، `sal`
    - صدای پیش‌فرض: `eve`
    - شناسه‌های صدای سفارشی حساب، حتی اگر در پاسخ فهرست داخلی موجود نباشند،
      ارسال می‌شوند
    - قالب‌ها: `mp3`، `wav`، `pcm`، `mulaw`، `alaw`
    - زبان: کد BCP-47 یا `auto`
    - سرعت: بازنویسی سرعت بومی ارائه‌دهنده
    - قالب بومی پیام صوتی Opus پشتیبانی نمی‌شود

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
    OpenClaw از نقطه پایانی دسته‌ای `/v1/tts` و فهرست احراز هویت‌شده
    `/v1/tts/voices` متعلق به xAI استفاده می‌کند. xAI همچنین TTS جریانی را از طریق WebSocket
    ارائه می‌دهد، اما ارائه‌دهنده همراه xAI هنوز آن قلاب جریانی را پیاده‌سازی نکرده است.
    </Note>

  </Accordion>

  <Accordion title="تبدیل گفتار به متن">
    Plugin همراه `xai`، تبدیل دسته‌ای گفتار به متن را از طریق سطح رونویسی
    درک رسانه OpenClaw ثبت می‌کند.

    - نقطه پایانی: REST متعلق به xAI در `/v1/stt`
    - مسیر ورودی: بارگذاری فایل صوتی چندبخشی
    - انتخاب مدل: xAI مدل رونویسی را به‌صورت داخلی انتخاب می‌کند؛ این
      نقطه پایانی انتخاب‌گر مدل ندارد
    - در هر جایی استفاده می‌شود که رونویسی صدای ورودی `tools.media.audio` را می‌خواند،
      از جمله بخش‌های کانال صوتی Discord و پیوست‌های صوتی کانال

    برای اجبار استفاده از xAI برای رونویسی صدای ورودی:

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
    هر فراخوانی ارائه کرد. راهنمایی‌های پرامپت توسط سطح مشترک OpenClaw پذیرفته می‌شوند،
    اما یکپارچه‌سازی REST STT متعلق به xAI فقط فایل و زبان را ارسال می‌کند،
    زیرا تنها این موارد با نقطه پایانی عمومی فعلی xAI نگاشت می‌شوند.

  </Accordion>

  <Accordion title="تبدیل جریانی گفتار به متن">
    Plugin همراه `xai` همچنین یک ارائه‌دهنده رونویسی بلادرنگ
    برای صدای زنده تماس صوتی ثبت می‌کند.

    - نقطه پایانی: WebSocket متعلق به xAI در `wss://api.x.ai/v1/stt`
    - کدگذاری پیش‌فرض: `mulaw`
    - نرخ نمونه‌برداری پیش‌فرض: `8000`
    - تشخیص پیش‌فرض پایان گفتار: `800ms`
    - رونویسی‌های موقت: به‌طور پیش‌فرض فعال

    جریان رسانه Twilio در Voice Call فریم‌های صوتی G.711 mu-law را ارسال می‌کند، بنابراین
    ارائه‌دهنده xAI این فریم‌ها را مستقیماً و بدون تبدیل کدگذاری ارسال می‌کند:

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

    پیکربندی متعلق به ارائه‌دهنده در
    `plugins.entries.voice-call.config.streaming.providers.xai` قرار دارد. کلیدهای
    پشتیبانی‌شده عبارت‌اند از `apiKey`، `baseUrl`، `sampleRate`، `encoding` (`pcm`، `mulaw` یا
    `alaw`)، `interimResults`، `endpointingMs` و `language`.

    <Note>
    این ارائه‌دهنده جریانی برای مسیر رونویسی بلادرنگ Voice Call است.
    Discord بخش‌های کوتاه را ضبط می‌کند و به‌جای آن از مسیر رونویسی دسته‌ای
    `tools.media.audio` استفاده می‌کند.
    </Note>

  </Accordion>

  <Accordion title="پیکربندی x_search">
    Plugin همراه xAI، ابزار `x_search` را به‌عنوان یک ابزار OpenClaw برای
    جست‌وجوی محتوای X (که پیش‌تر Twitter نام داشت) از طریق Grok ارائه می‌کند.

    مسیر پیکربندی: `plugins.entries.xai.config.xSearch`

    | کلید              | نوع     | پیش‌فرض                  | توضیحات                                                    |
    | ----------------- | ------- | ------------------------- | ---------------------------------------------------------- |
    | `enabled`         | boolean | خودکار برای مدل‌های xAI   | غیرفعال‌سازی، یا فعال‌سازی برای یک ارائه‌دهنده شناخته‌شده غیر xAI |
    | `model`           | string  | `grok-4.3`                | مدل مورداستفاده برای درخواست‌های x_search                  |
    | `baseUrl`         | string  | -                          | بازنویسی نشانی پایه Responses متعلق به xAI                 |
    | `inlineCitations` | boolean | -                          | گنجاندن ارجاع‌های درون‌متنی در نتایج                       |
    | `maxTurns`        | number  | -                          | حداکثر نوبت‌های مکالمه                                     |
    | `timeoutSeconds`  | number  | `30`                       | مهلت درخواست برحسب ثانیه                                  |
    | `cacheTtlMinutes` | number  | `15`                       | مدت اعتبار حافظه نهان برحسب دقیقه                          |

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
    Plugin همراه xAI، ابزار `code_execution` را به‌عنوان یک ابزار OpenClaw برای
    اجرای راه‌دور کد در محیط سندباکس xAI ارائه می‌کند.

    مسیر پیکربندی: `plugins.entries.xai.config.codeExecution`

    | کلید             | نوع     | پیش‌فرض                 | توضیحات                                                    |
    | ---------------- | ------- | ----------------------- | ---------------------------------------------------------- |
    | `enabled`        | boolean | خودکار برای مدل‌های xAI | غیرفعال‌سازی، یا فعال‌سازی برای یک ارائه‌دهنده شناخته‌شده غیر xAI |
    | `model`          | string  | `grok-4.3`              | مدل مورداستفاده برای درخواست‌های اجرای کد                  |
    | `maxTurns`       | number  | -                       | حداکثر نوبت‌های مکالمه                                     |
    | `timeoutSeconds` | number  | `30`                    | مهلت درخواست برحسب ثانیه                                  |

    <Note>
    این اجرای راه‌دور در سندباکس xAI است، نه [`exec`](/fa/tools/exec) محلی.
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
    - احراز هویت xAI می‌تواند از کلید API، متغیر محیطی، پیکربندی جایگزین Plugin،
      یا OAuth با یک حساب واجد شرایط xAI استفاده کند. OAuth از تأیید کد دستگاه
      بدون فراخوانی بازگشتی localhost استفاده می‌کند. xAI تعیین می‌کند کدام حساب‌ها
      می‌توانند توکن‌های API مبتنی بر OAuth دریافت کنند و ممکن است صفحه رضایت
      Grok Build را نمایش دهد، هرچند OpenClaw به برنامه Grok Build نیاز ندارد.
    - OpenClaw در حال حاضر خانواده مدل‌های چندعاملی xAI را ارائه نمی‌کند. xAI
      این مدل‌ها را از طریق Responses API ارائه می‌کند، اما آن‌ها ابزارهای سمت کارخواه
      یا ابزارهای سفارشی مورداستفاده در حلقه عامل مشترک OpenClaw را نمی‌پذیرند.
      به
      [محدودیت‌های چندعاملی xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations)
      مراجعه کنید.
    - صدای بلادرنگ xAI هنوز به‌عنوان ارائه‌دهنده OpenClaw ثبت نشده است. این قابلیت
      به قراردادی متفاوت برای نشست صوتی دوسویه نسبت به STT دسته‌ای
      یا رونویسی جریانی نیاز دارد.
    - `quality` تصویر xAI، `mask` تصویر و نسبت ابعاد بومی `auto`
      تا زمانی که ابزار مشترک `image_generate` کنترل‌های متناظر
      میان ارائه‌دهندگان را نداشته باشد، ارائه نمی‌شوند.
  </Accordion>

  <Accordion title="نکات پیشرفته">
    - OpenClaw اصلاحات سازگاری مختص xAI برای طرح‌واره ابزار و فراخوانی ابزار را
      به‌طور خودکار در مسیر اجراکننده مشترک اعمال می‌کند.
    - درخواست‌های بومی xAI به‌طور پیش‌فرض از `tool_stream: true` استفاده می‌کنند. برای
      غیرفعال‌سازی آن، `agents.defaults.models["xai/<model>"].params.tool_stream` را روی `false`
      تنظیم کنید.
    - پوشش‌دهنده همراه xAI، پیش از ارسال درخواست‌های بومی xAI، کران‌های پشتیبانی‌نشده
      تعداد contains در طرح‌واره و کلیدهای پشتیبانی‌نشده *effort* در بار reasoning را حذف می‌کند.
      Grok 4.5 از effort کم، متوسط و زیاد پشتیبانی می‌کند (پیش‌فرض زیاد).
      Grok 4.3 از effort بدون مقدار، کم، متوسط و زیاد پشتیبانی می‌کند (پیش‌فرض کم).
      دیگر مدل‌های xAI دارای قابلیت reasoning، کنترل effort قابل‌پیکربندی ارائه نمی‌کنند،
      اما همچنان `include: ["reasoning.encrypted_content"]` را درخواست می‌کنند تا reasoning
      رمزگذاری‌شده پیشین در نوبت‌های بعدی دوباره پخش شود.
    - `web_search`، `x_search` و `code_execution` به‌عنوان ابزارهای OpenClaw ارائه می‌شوند.
      OpenClaw به‌جای پیوست‌کردن تمام ابزارهای بومی به هر نوبت گفتگو، فقط ابزار داخلی
      مشخص xAI را که هر ابزار نیاز دارد به درخواست همان ابزار پیوست می‌کند.
    - `web_search` در Grok مقدار `plugins.entries.xai.config.webSearch.baseUrl` را می‌خواند.
      `x_search` مقدار `plugins.entries.xai.config.xSearch.baseUrl` را می‌خواند و سپس
      به نشانی پایه جست‌وجوی وب Grok برمی‌گردد.
    - مالکیت `x_search` و `code_execution` با Plugin همراه xAI است،
      نه اینکه در زمان اجرای هسته مدل به‌صورت ثابت کدنویسی شده باشند.
    - `code_execution` اجرای راه‌دور در سندباکس xAI است، نه
      [`exec`](/fa/tools/exec) محلی.
  </Accordion>
</AccordionGroup>

## آزمایش زنده

مسیرهای رسانه‌ای xAI با آزمون‌های واحد و مجموعه‌آزمون‌های زنده انتخابی پوشش داده می‌شوند.
پیش از اجرای بررسی‌های زنده، `XAI_API_KEY` را در محیط فرایند صادر کنید.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

فایل زندهٔ مختص ارائه‌دهنده، TTS معمولی و TTS مبتنی بر PCM مناسب تلفن را تولید می‌کند، صوت را از طریق STT دسته‌ای xAI رونویسی می‌کند، همان PCM را از طریق STT بلادرنگ xAI جریانی می‌کند، خروجی متن‌به‌تصویر می‌سازد و یک تصویر مرجع را ویرایش می‌کند.
فایل زندهٔ مشترک تصویر، همان ارائه‌دهندهٔ xAI را از طریق مسیر انتخاب زمان اجرای OpenClaw، جایگزینی هنگام خطا، نرمال‌سازی و پیوست رسانه‌ای تأیید می‌کند. مورد اختیاری Video 1.5 یک تصویر تولیدشده را به‌عنوان فریم نخست با وضوح 1080P ارسال می‌کند و دانلود ویدیوی تکمیل‌شده را تأیید می‌کند.

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خطا.
  </Card>
  <Card title="تولید ویدیو" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار مشترک ویدیو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="همهٔ ارائه‌دهندگان" href="/fa/providers/index" icon="grid-2">
    نمای کلی گسترده‌تر ارائه‌دهندگان.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و راه‌حل‌ها.
  </Card>
</CardGroup>
