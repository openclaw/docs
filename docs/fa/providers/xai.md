---
read_when:
    - می‌خواهید از مدل‌های Grok در OpenClaw استفاده کنید
    - شما در حال پیکربندی احراز هویت xAI یا شناسه‌های مدل هستید
summary: استفاده از مدل‌های xAI Grok در OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-06-27T18:45:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b89c1037f9800366c03bdd1313a8c4ff05e8675effa60ed1e2985d38f045aad4
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw یک Plugin ارائه‌دهنده‌ی همراه `xai` برای مدل‌های Grok عرضه می‌کند. برای بیشتر
کاربران، مسیر پیشنهادی Grok OAuth با اشتراک واجد شرایط SuperGrok یا X Premium
است. OpenClaw با اولویت محلی می‌ماند: Gateway، پیکربندی، مسیریابی و
ابزارها روی دستگاه شما اجرا می‌شوند، در حالی که درخواست‌های مدل Grok از طریق xAI
احراز هویت می‌شوند و به API شرکت xAI ارسال می‌شوند.

OAuth به کلید API xAI نیاز ندارد و به برنامه‌ی Grok Build
هم نیاز ندارد. ممکن است xAI همچنان Grok Build را در صفحه‌ی رضایت نشان دهد، چون OpenClaw از
کلاینت OAuth مشترک xAI استفاده می‌کند.

## مسیر راه‌اندازی خود را انتخاب کنید

از مسیری استفاده کنید که با وضعیت نصب OpenClaw شما سازگار است:

<Steps>
  <Step title="New OpenClaw install">
    وقتی در حال راه‌اندازی یک Gateway محلی جدید هستید، راه‌اندازی اولیه را با نصب دیمون
    اجرا کنید، سپس در مرحله‌ی مدل/احراز هویت گزینه‌ی xAI/Grok OAuth را انتخاب کنید:

    ```bash
    openclaw onboard --install-daemon
    ```

    روی VPS یا از طریق SSH، مستقیما xAI OAuth را انتخاب کنید؛ OpenClaw از تأیید
    با کد دستگاه استفاده می‌کند و به callback لوکال‌هاست نیاز ندارد:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    OAuth به کلید API xAI نیاز ندارد. OpenClaw به برنامه‌ی Grok
    Build نیاز ندارد. ممکن است xAI همچنان برنامه‌ی رضایت را Grok Build برچسب‌گذاری کند، چون
    OpenClaw از کلاینت OAuth مشترک xAI استفاده می‌کند.

  </Step>
  <Step title="Existing OpenClaw install">
    اگر OpenClaw از قبل پیکربندی شده است، فقط وارد xAI شوید. فقط برای اتصال Grok،
    راه‌اندازی اولیه‌ی کامل را دوباره اجرا نکنید یا دیمون را دوباره نصب نکنید:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    برای اینکه پس از ورود، Grok مدل پیش‌فرض شود، آن را جداگانه اعمال کنید:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    راه‌اندازی اولیه‌ی کامل را فقط زمانی دوباره اجرا کنید که عمدا بخواهید Gateway،
    دیمون، کانال، فضای کاری، یا گزینه‌های راه‌اندازی دیگر را تغییر دهید.

  </Step>
  <Step title="API-key path">
    راه‌اندازی با کلید API همچنان برای کلیدهای xAI Console و برای سطح‌های رسانه‌ای که
    به پیکربندی ارائه‌دهنده‌ی متکی به کلید نیاز دارند کار می‌کند:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="Pick a model">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw از xAI Responses API به‌عنوان انتقال‌دهنده‌ی همراه xAI استفاده می‌کند. همان
اعتبارنامه از `openclaw models auth login --provider xai --method oauth` یا
`openclaw models auth login --provider xai --method api-key` می‌تواند قابلیت‌های درجه‌اول
`web_search`، `x_search`، `code_execution` از راه دور، و تولید تصویر/ویدئوی xAI را هم تأمین کند.
گفتار و رونویسی در حال حاضر به `XAI_API_KEY` یا پیکربندی ارائه‌دهنده نیاز دارند.
`web_search` متکی به Grok، xAI OAuth را ترجیح می‌دهد و به `XAI_API_KEY` یا
پیکربندی جست‌وجوی وب Plugin بازمی‌گردد.
اگر یک کلید xAI را زیر `plugins.entries.xai.config.webSearch.apiKey` ذخیره کنید،
ارائه‌دهنده‌ی مدل همراه xAI آن کلید را نیز به‌عنوان fallback دوباره استفاده می‌کند.
برای مسیریابی `web_search` مربوط به Grok و، به‌صورت پیش‌فرض، `x_search` از طریق
یک پراکسی xAI Responses اپراتور، `plugins.entries.xai.config.webSearch.baseUrl` را تنظیم کنید.
تنظیمات `code_execution` زیر `plugins.entries.xai.config.codeExecution` قرار دارد.
</Note>

## عیب‌یابی OAuth

- برای SSH، Docker، VPS، یا راه‌اندازی‌های راه دور دیگر، از
  `openclaw models auth login --provider xai --method oauth` استفاده کنید؛ xAI OAuth از
  تأیید با کد دستگاه به‌جای callback لوکال‌هاست استفاده می‌کند.
- اگر ورود موفق شد اما Grok مدل پیش‌فرض نیست، اجرا کنید:
  `openclaw models set xai/grok-4.3`.
- برای بررسی پروفایل‌های احراز هویت ذخیره‌شده‌ی xAI، اجرا کنید:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI تصمیم می‌گیرد کدام حساب‌ها می‌توانند توکن‌های API مربوط به OAuth را دریافت کنند. اگر حسابی
  واجد شرایط نیست، مسیر کلید API را امتحان کنید یا اشتراک را در سمت xAI بررسی کنید.

<Tip>
هنگام ورود از SSH، Docker، یا VPS از `xai-oauth` استفاده کنید. OpenClaw یک
URL مربوط به xAI و یک کد کوتاه چاپ می‌کند؛ ورود را در هر مرورگر محلی کامل کنید، در حالی که فرایند راه دور
xAI را برای تکمیل تبادل توکن poll می‌کند.
</Tip>

## کاتالوگ داخلی

OpenClaw مدل‌های چت فعلی xAI را به‌صورت آماده در خود دارد، و در انتخابگرهای مدل با جدیدترین
مورد در ابتدا مرتب شده‌اند:

| خانواده       | شناسه‌های مدل                                                              |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

این Plugin همچنان slugهای قدیمی‌تر Grok 3، Grok 4، Grok 4 Fast، Grok 4.1
Fast، و Grok Code را برای پیکربندی‌های موجود forward-resolve می‌کند. aliasهای رسمی Grok Code Fast
به `grok-build-0.1` نرمال‌سازی می‌شوند؛ OpenClaw دیگر slugهای بازنشسته‌ی دیگر
upstream را در کاتالوگ قابل انتخاب نشان نمی‌دهد.

<Tip>
برای چت عمومی از `grok-4.3` و برای بارهای کاری متمرکز بر ساخت/کدنویسی از `grok-build-0.1`
استفاده کنید، مگر اینکه صراحتا به alias بتای Grok 4.20 نیاز داشته باشید.
</Tip>

## پوشش قابلیت‌های OpenClaw

Plugin همراه، سطح API عمومی فعلی xAI را به قراردادهای مشترک
ارائه‌دهنده و ابزار OpenClaw نگاشت می‌کند. قابلیت‌هایی که با قرارداد مشترک سازگار نیستند
(برای مثال TTS استریم‌شونده و صدای بلادرنگ) ارائه نمی‌شوند - جدول
زیر را ببینید.

| قابلیت xAI                  | سطح OpenClaw                              | وضعیت                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| چت / پاسخ‌ها               | ارائه‌دهنده‌ی مدل `xai/<model>`          | بله                                                                 |
| جست‌وجوی وب سمت سرور       | ارائه‌دهنده‌ی `web_search` با `grok`     | بله                                                                 |
| جست‌وجوی X سمت سرور        | ابزار `x_search`                          | بله                                                                 |
| اجرای کد سمت سرور          | ابزار `code_execution`                    | بله                                                                 |
| تصاویر                     | `image_generate`                          | بله                                                                 |
| ویدئوها                    | `video_generate`                          | بله                                                                 |
| متن‌به‌گفتار دسته‌ای       | `messages.tts.provider: "xai"` / `tts`    | بله                                                                 |
| TTS استریم‌شونده           | -                                         | ارائه نمی‌شود؛ قرارداد TTS در OpenClaw بافرهای صوتی کامل برمی‌گرداند |
| گفتاربه‌متن دسته‌ای        | `tools.media.audio` / درک رسانه           | بله                                                                 |
| گفتاربه‌متن استریم‌شونده   | Voice Call `streaming.provider: "xai"`    | بله                                                                 |
| صدای بلادرنگ               | -                                         | هنوز ارائه نمی‌شود؛ قرارداد session/WebSocket متفاوت دارد          |
| فایل‌ها / دسته‌ها          | فقط سازگاری عمومی API مدل                | ابزار درجه‌اول OpenClaw نیست                                      |

<Note>
OpenClaw از APIهای REST تصویر/ویدئو/TTS/STT شرکت xAI برای تولید رسانه،
گفتار، و رونویسی دسته‌ای، از WebSocket استریم‌شونده‌ی STT شرکت xAI برای رونویسی زنده‌ی
تماس صوتی، و از Responses API برای ابزارهای مدل، جست‌وجو، و
اجرای کد استفاده می‌کند. قابلیت‌هایی که به قراردادهای متفاوت OpenClaw نیاز دارند، مانند
sessionهای صدای بلادرنگ، در اینجا به‌عنوان قابلیت‌های upstream مستند شده‌اند نه
رفتار پنهان Plugin.
</Note>

### نگاشت‌های حالت سریع

`/fast on` یا `agents.defaults.models["xai/<model>"].params.fastMode: true`
درخواست‌های بومی xAI را به شکل زیر بازنویسی می‌کند:

| مدل مبدا      | هدف حالت سریع     |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### aliasهای سازگاری legacy

aliasهای legacy همچنان به شناسه‌های همراه canonical نرمال‌سازی می‌شوند:

| alias قدیمی               | شناسه‌ی canonical                    |
| ------------------------- | ------------------------------------- |
| `grok-code-fast-1`        | `grok-build-0.1`                      |
| `grok-code-fast`          | `grok-build-0.1`                      |
| `grok-code-fast-1-0825`   | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## قابلیت‌ها

<AccordionGroup>
  <Accordion title="Web search">
    ارائه‌دهنده‌ی همراه جست‌وجوی وب `grok` ابتدا xAI OAuth را ترجیح می‌دهد، سپس به
    `XAI_API_KEY` یا یک کلید جست‌وجوی وب Plugin بازمی‌گردد:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Video generation">
    Plugin همراه `xai` تولید ویدئو را از طریق ابزار مشترک
    `video_generate` ثبت می‌کند.

    - مدل ویدئوی پیش‌فرض: `xai/grok-imagine-video`
    - حالت‌ها: متن‌به‌ویدئو، تصویر‌به‌ویدئو، تولید تصویر مرجع، ویرایش ویدئوی راه دور،
      و گسترش ویدئوی راه دور
    - نسبت‌های تصویر: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - وضوح‌ها: `480P`, `720P`
    - مدت: 1-15 ثانیه برای تولید/تصویر‌به‌ویدئو، 1-10 ثانیه هنگام
      استفاده از نقش‌های `reference_image`، و 2-10 ثانیه برای گسترش
    - تولید تصویر مرجع: برای هر تصویر ارائه‌شده، `imageRoles` را روی `reference_image` تنظیم کنید؛
      xAI تا 7 تصویر از این نوع را می‌پذیرد
    - مهلت زمانی پیش‌فرض عملیات: 600 ثانیه، مگر اینکه `video_generate.timeoutMs`
      یا `agents.defaults.videoGenerationModel.timeoutMs` تنظیم شده باشد

    <Warning>
    بافرهای ویدئوی محلی پذیرفته نمی‌شوند. برای ورودی‌های ویرایش/گسترش
    ویدئو از URLهای راه دور `http(s)` استفاده کنید. تصویر‌به‌ویدئو بافرهای تصویر محلی را می‌پذیرد، چون
    OpenClaw می‌تواند آن‌ها را برای xAI به data URL کدگذاری کند.
    </Warning>

    برای استفاده از xAI به‌عنوان ارائه‌دهنده‌ی ویدئوی پیش‌فرض:

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
    برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار failover، [تولید ویدئو](/fa/tools/video-generation) را ببینید.
    </Note>

  </Accordion>

  <Accordion title="Image generation">
    Plugin همراه `xai` تولید تصویر را از طریق ابزار مشترک
    `image_generate` ثبت می‌کند.

    - مدل تصویر پیش‌فرض: `xai/grok-imagine-image`
    - مدل اضافی: `xai/grok-imagine-image-quality`
    - حالت‌ها: متن‌به‌تصویر و ویرایش تصویر مرجع
    - ورودی‌های مرجع: یک `image` یا تا پنج `images`
    - نسبت‌های تصویر: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - وضوح‌ها: `1K`, `2K`
    - تعداد: تا 4 تصویر
    - مهلت زمانی پیش‌فرض عملیات: 600 ثانیه، مگر اینکه `image_generate.timeoutMs`
      یا `agents.defaults.imageGenerationModel.timeoutMs` تنظیم شده باشد

    OpenClaw از xAI پاسخ‌های تصویر `b64_json` می‌خواهد تا رسانه‌ی تولیدشده بتواند
    از طریق مسیر عادی پیوست کانال ذخیره و تحویل داده شود. تصاویر مرجع محلی
    به data URL تبدیل می‌شوند؛ مراجع راه دور `http(s)` بدون تغییر عبور داده می‌شوند.

    برای استفاده از xAI به‌عنوان ارائه‌دهنده‌ی تصویر پیش‌فرض:

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
    xAI همچنین `quality`، `mask`، `user` و نسبت‌های بومی اضافی
    مانند `1:2`، `2:1`، `9:20` و `20:9` را مستند کرده است. OpenClaw امروز فقط
    کنترل‌های تصویر مشترک میان ارائه‌دهنده‌ها را ارسال می‌کند؛ کنترل‌های بومی‌محض پشتیبانی‌نشده
    عمدا از طریق `image_generate` در معرض استفاده قرار نمی‌گیرند.
    </Note>

  </Accordion>

  <Accordion title="تبدیل متن به گفتار">
    Plugin همراه `xai` تبدیل متن به گفتار را از طریق سطح ارائه‌دهنده مشترک `tts`
    ثبت می‌کند.

    - صداها: `eve`، `ara`، `rex`، `sal`، `leo`، `una`
    - صدای پیش‌فرض: `eve`
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
              speakerVoiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw از نقطه پایانی دسته‌ای `/v1/tts` متعلق به xAI استفاده می‌کند. xAI همچنین TTS جریانی
    را از طریق WebSocket ارائه می‌دهد، اما قرارداد ارائه‌دهنده گفتار OpenClaw در حال حاضر
    پیش از تحویل پاسخ، یک بافر صوتی کامل را انتظار دارد.
    </Note>

  </Accordion>

  <Accordion title="تبدیل گفتار به متن">
    Plugin همراه `xai` تبدیل گفتار به متن دسته‌ای را از طریق سطح رونویسی
    درک رسانه OpenClaw ثبت می‌کند.

    - مدل پیش‌فرض: `grok-stt`
    - نقطه پایانی: REST xAI با مسیر `/v1/stt`
    - مسیر ورودی: بارگذاری فایل صوتی چندبخشی
    - در هر جایی که رونویسی صوت ورودی از `tools.media.audio` استفاده کند توسط OpenClaw پشتیبانی می‌شود،
      از جمله بخش‌های کانال صوتی Discord و پیوست‌های صوتی کانال

    برای اجبار xAI برای رونویسی صوت ورودی:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    زبان می‌تواند از طریق پیکربندی مشترک رسانه صوتی یا درخواست رونویسی
    هر فراخوانی ارائه شود. راهنمایی‌های prompt توسط سطح مشترک OpenClaw
    پذیرفته می‌شوند، اما یکپارچه‌سازی REST STT xAI فقط فایل، مدل و
    زبان را ارسال می‌کند، چون این موارد به‌خوبی با نقطه پایانی عمومی فعلی xAI نگاشت می‌شوند.

  </Accordion>

  <Accordion title="تبدیل گفتار به متن جریانی">
    Plugin همراه `xai` همچنین یک ارائه‌دهنده رونویسی بلادرنگ
    برای صوت تماس صوتی زنده ثبت می‌کند.

    - نقطه پایانی: WebSocket xAI با `wss://api.x.ai/v1/stt`
    - کدگذاری پیش‌فرض: `mulaw`
    - نرخ نمونه‌برداری پیش‌فرض: `8000`
    - endpointing پیش‌فرض: `800ms`
    - رونویسی‌های موقت: به‌صورت پیش‌فرض فعال است

    جریان رسانه Twilio در Voice Call فریم‌های صوتی G.711 µ-law می‌فرستد، بنابراین
    ارائه‌دهنده xAI می‌تواند آن فریم‌ها را مستقیما و بدون تبدیل کدگذاری ارسال کند:

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

    پیکربندی متعلق به ارائه‌دهنده زیر
    `plugins.entries.voice-call.config.streaming.providers.xai` قرار دارد. کلیدهای
    پشتیبانی‌شده عبارت‌اند از `apiKey`، `baseUrl`، `sampleRate`، `encoding` (`pcm`، `mulaw`، یا
    `alaw`)، `interimResults`، `endpointingMs` و `language`.

    <Note>
    این ارائه‌دهنده جریانی برای مسیر رونویسی بلادرنگ Voice Call است.
    صوت Discord در حال حاضر بخش‌های کوتاه را ضبط می‌کند و به‌جای آن از مسیر رونویسی دسته‌ای
    `tools.media.audio` استفاده می‌کند.
    </Note>

  </Accordion>

  <Accordion title="پیکربندی x_search">
    Plugin همراه xAI، `x_search` را به‌عنوان یک ابزار OpenClaw برای جست‌وجوی
    محتوای X (توییتر سابق) از طریق Grok در معرض استفاده قرار می‌دهد.

    مسیر پیکربندی: `plugins.entries.xai.config.xSearch`

    | کلید               | نوع     | پیش‌فرض           | توضیح                                |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | فعال یا غیرفعال کردن x_search        |
    | `model`            | string  | `grok-4-1-fast`    | مدل استفاده‌شده برای درخواست‌های x_search |
    | `baseUrl`          | string  | -                  | بازنویسی URL پایه Responses در xAI   |
    | `inlineCitations`  | boolean | -                  | درج ارجاع‌های درون‌خطی در نتایج      |
    | `maxTurns`         | number  | -                  | حداکثر نوبت‌های مکالمه               |
    | `timeoutSeconds`   | number  | -                  | مهلت زمانی درخواست بر حسب ثانیه      |
    | `cacheTtlMinutes`  | number  | -                  | زمان ماندگاری cache بر حسب دقیقه     |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
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
    Plugin همراه xAI، `code_execution` را به‌عنوان یک ابزار OpenClaw برای
    اجرای کد راه دور در محیط sandbox xAI در معرض استفاده قرار می‌دهد.

    مسیر پیکربندی: `plugins.entries.xai.config.codeExecution`

    | کلید              | نوع     | پیش‌فرض                  | توضیح                                  |
    | ----------------- | ------- | ------------------------ | -------------------------------------- |
    | `enabled`         | boolean | `true` (اگر کلید موجود باشد) | فعال یا غیرفعال کردن اجرای کد       |
    | `model`           | string  | `grok-4-1-fast`          | مدل استفاده‌شده برای درخواست‌های اجرای کد |
    | `maxTurns`        | number  | -                        | حداکثر نوبت‌های مکالمه                 |
    | `timeoutSeconds`  | number  | -                        | مهلت زمانی درخواست بر حسب ثانیه        |

    <Note>
    این اجرای راه دور در sandbox xAI است، نه [`exec`](/fa/tools/exec) محلی.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="محدودیت‌های شناخته‌شده">
    - احراز هویت xAI می‌تواند از کلید API، متغیر محیطی، fallback پیکربندی Plugin،
      یا OAuth با یک حساب واجد شرایط xAI استفاده کند. OAuth از راستی‌آزمایی device-code
      بدون callback میزبان محلی استفاده می‌کند. xAI تصمیم می‌گیرد کدام حساب‌ها می‌توانند توکن‌های API
      مربوط به OAuth را دریافت کنند، و صفحه رضایت ممکن است Grok Build را نشان دهد، هرچند OpenClaw
      به برنامه Grok Build نیاز ندارد.
    - OpenClaw در حال حاضر خانواده مدل چندعاملی xAI را در معرض استفاده قرار نمی‌دهد. xAI
      این مدل‌ها را از طریق Responses API ارائه می‌کند، اما آن‌ها ابزارهای سمت کلاینت یا سفارشی
      مورد استفاده حلقه عامل مشترک OpenClaw را نمی‌پذیرند. به
      [محدودیت‌های چندعاملی xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations) مراجعه کنید.
    - صدای بلادرنگ xAI هنوز به‌عنوان یک ارائه‌دهنده OpenClaw ثبت نشده است. این قابلیت
      به قراردادی متفاوت برای نشست صوتی دوسویه نسبت به STT دسته‌ای یا
      رونویسی جریانی نیاز دارد.
    - `quality` تصویر xAI، `mask` تصویر و نسبت‌های تصویر اضافی بومی‌محض
      تا زمانی که ابزار مشترک `image_generate` کنترل‌های متناظر
      میان ارائه‌دهنده‌ها را نداشته باشد، در معرض استفاده قرار نمی‌گیرند.
  </Accordion>

  <Accordion title="یادداشت‌های پیشرفته">
    - OpenClaw اصلاحات سازگاری tool-schema و tool-call ویژه xAI را
      به‌صورت خودکار در مسیر runner مشترک اعمال می‌کند.
    - درخواست‌های بومی xAI به‌صورت پیش‌فرض `tool_stream: true` دارند. برای
      غیرفعال کردن آن، `agents.defaults.models["xai/<model>"].params.tool_stream` را روی `false`
      تنظیم کنید.
    - wrapper همراه xAI پیش از ارسال درخواست‌های بومی xAI، پرچم‌های strict tool-schema پشتیبانی‌نشده و
      کلیدهای payload مربوط به reasoning *effort* را حذف می‌کند. فقط
      `grok-4.3` / `grok-4.3-*` effort قابل پیکربندی reasoning را اعلام می‌کنند؛ همه
      مدل‌های دیگر xAI که قابلیت reasoning دارند همچنان
      `include: ["reasoning.encrypted_content"]` را درخواست می‌کنند تا reasoning رمزنگاری‌شده قبلی
      در نوبت‌های بعدی دوباره پخش شود.
    - `web_search`، `x_search` و `code_execution` به‌عنوان ابزارهای OpenClaw
      در معرض استفاده قرار می‌گیرند. OpenClaw به‌جای پیوست کردن همه ابزارهای بومی به هر نوبت chat،
      built-in مشخص xAI را که در هر درخواست ابزار لازم دارد فعال می‌کند.
    - `web_search` در Grok مقدار `plugins.entries.xai.config.webSearch.baseUrl` را می‌خواند.
      `x_search` مقدار `plugins.entries.xai.config.xSearch.baseUrl` را می‌خواند، سپس
      به URL پایه web-search در Grok fallback می‌کند.
    - `x_search` و `code_execution` به‌جای hardcode شدن در runtime مدل اصلی،
      متعلق به Plugin همراه xAI هستند.
    - `code_execution` اجرای راه دور در sandbox xAI است، نه
      [`exec`](/fa/tools/exec) محلی.
  </Accordion>
</AccordionGroup>

## آزمایش زنده

مسیرهای رسانه xAI با آزمون‌های واحد و مجموعه‌های زنده opt-in پوشش داده شده‌اند. پیش از اجرای
کاوشگرهای زنده، `XAI_API_KEY` را در محیط فرایند export کنید.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

فایل زنده ویژه ارائه‌دهنده، TTS عادی، TTS به‌صورت PCM مناسب تلفنی را تولید می‌کند،
صوت را از طریق STT دسته‌ای xAI رونویسی می‌کند، همان PCM را از طریق STT بلادرنگ xAI
جریان می‌دهد، خروجی متن به تصویر تولید می‌کند، و یک تصویر مرجع را ویرایش می‌کند. فایل
زنده تصویر مشترک، همان ارائه‌دهنده xAI را از طریق مسیر انتخاب runtime، fallback،
نرمال‌سازی و پیوست رسانه OpenClaw راستی‌آزمایی می‌کند.

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، model refها و رفتار failover.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار ویدئوی مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="همه ارائه‌دهنده‌ها" href="/fa/providers/index" icon="grid-2">
    نمای کلی گسترده‌تر ارائه‌دهنده‌ها.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و اصلاحات.
  </Card>
</CardGroup>
