---
read_when:
    - می‌خواهید از مدل‌های Grok در OpenClaw استفاده کنید
    - در حال پیکربندی احراز هویت xAI یا شناسه‌های مدل هستید
summary: از مدل‌های xAI Grok در OpenClaw استفاده کنید
title: xAI
x-i18n:
    generated_at: "2026-05-06T09:40:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0e682ba31829faeeb992818aa6a36ab4d18b79723009c5f37559c28160af499
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw یک Plugin ارائه‌دهنده‌ی `xai` را به‌صورت همراه برای مدل‌های Grok عرضه می‌کند.

## شروع کار

<Steps>
  <Step title="یک کلید API ایجاد کنید">
    یک کلید API در [کنسول xAI](https://console.x.ai/) ایجاد کنید.
  </Step>
  <Step title="کلید API خود را تنظیم کنید">
    `XAI_API_KEY` را تنظیم کنید، یا اجرا کنید:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="یک مدل انتخاب کنید">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw از xAI Responses API به‌عنوان انتقال همراه xAI استفاده می‌کند. همان
`XAI_API_KEY` همچنین می‌تواند `web_search` مبتنی بر Grok، `x_search` درجه‌یک،
و `code_execution` راه‌دور را نیز تأمین کند.
اگر یک کلید xAI را زیر `plugins.entries.xai.config.webSearch.apiKey` ذخیره کنید،
ارائه‌دهنده‌ی مدل همراه xAI آن کلید را به‌عنوان جایگزین نیز دوباره استفاده می‌کند.
`plugins.entries.xai.config.webSearch.baseUrl` را تنظیم کنید تا `web_search` مربوط به Grok
و، به‌صورت پیش‌فرض، `x_search` را از طریق یک پراکسی xAI Responses اپراتور مسیریابی کنید.
تنظیم دقیق `code_execution` زیر `plugins.entries.xai.config.codeExecution` قرار دارد.
</Note>

## کاتالوگ داخلی

OpenClaw این خانواده‌های مدل xAI را به‌صورت آماده شامل می‌شود:

| خانواده         | شناسه‌های مدل                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

این Plugin همچنین شناسه‌های جدیدتر `grok-4*` و `grok-code-fast*` را وقتی
از همان شکل API پیروی کنند، به‌صورت پیش‌رو resolve می‌کند.

<Tip>
`grok-4.3`، `grok-4-fast`، `grok-4-1-fast`، و گونه‌های `grok-4.20-beta-*`
ارجاع‌های Grok فعلی دارای قابلیت تصویر در کاتالوگ همراه هستند.
</Tip>

## پوشش قابلیت‌های OpenClaw

Plugin همراه، سطح API عمومی فعلی xAI را به قراردادهای مشترک ارائه‌دهنده
و ابزار OpenClaw نگاشت می‌کند. قابلیت‌هایی که با قرارداد مشترک سازگار نیستند
(برای مثال TTS جریانی و صدای بی‌درنگ) ارائه نمی‌شوند - جدول
زیر را ببینید.

| قابلیت xAI             | سطح OpenClaw                          | وضعیت                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| چت / Responses           | ارائه‌دهنده‌ی مدل `xai/<model>`              | بله                                                                 |
| جست‌وجوی وب سمت سرور     | ارائه‌دهنده‌ی `web_search` با مقدار `grok`              | بله                                                                 |
| جست‌وجوی X سمت سرور       | ابزار `x_search`                           | بله                                                                 |
| اجرای کد سمت سرور | ابزار `code_execution`                     | بله                                                                 |
| تصاویر                     | `image_generate`                          | بله                                                                 |
| ویدیوها                     | `video_generate`                          | بله                                                                 |
| تبدیل متن به گفتار دسته‌ای       | `messages.tts.provider: "xai"` / `tts`    | بله                                                                 |
| TTS جریانی              | -                                         | ارائه نمی‌شود؛ قرارداد TTS در OpenClaw بافرهای کامل صوتی برمی‌گرداند |
| تبدیل گفتار به متن دسته‌ای       | `tools.media.audio` / درک رسانه | بله                                                                 |
| تبدیل گفتار به متن جریانی   | Voice Call `streaming.provider: "xai"`    | بله                                                                 |
| صدای بی‌درنگ             | -                                         | هنوز ارائه نمی‌شود؛ قرارداد جلسه/WebSocket متفاوت است               |
| فایل‌ها / دسته‌ها            | فقط سازگاری عمومی API مدل      | ابزار درجه‌یک OpenClaw نیست                                     |

<Note>
OpenClaw برای تولید رسانه، گفتار، و رونویسی دسته‌ای از APIهای REST تصویر/ویدیو/TTS/STT در xAI،
برای رونویسی زنده‌ی تماس صوتی از WebSocket جریانی STT در xAI،
و برای ابزارهای مدل، جست‌وجو، و اجرای کد از Responses API استفاده می‌کند.
قابلیت‌هایی که به قراردادهای متفاوت OpenClaw نیاز دارند، مانند
جلسه‌های صدای بی‌درنگ، در اینجا به‌عنوان قابلیت‌های بالادستی مستند شده‌اند
نه رفتار پنهان Plugin.
</Note>

### نگاشت‌های حالت سریع

`/fast on` یا `agents.defaults.models["xai/<model>"].params.fastMode: true`
درخواست‌های بومی xAI را به شکل زیر بازنویسی می‌کند:

| مدل مبدأ  | مقصد حالت سریع   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### نام‌های مستعار سازگاری قدیمی

نام‌های مستعار قدیمی همچنان به شناسه‌های همراه canonical نرمال‌سازی می‌شوند:

| نام مستعار قدیمی              | شناسه canonical                          |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## قابلیت‌ها

<AccordionGroup>
  <Accordion title="جست‌وجوی وب">
    ارائه‌دهنده‌ی جست‌وجوی وب همراه `grok` از `XAI_API_KEY` نیز استفاده می‌کند:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="تولید ویدیو">
    Plugin همراه `xai` تولید ویدیو را از طریق ابزار مشترک
    `video_generate` ثبت می‌کند.

    - مدل ویدیوی پیش‌فرض: `xai/grok-imagine-video`
    - حالت‌ها: متن به ویدیو، تصویر به ویدیو، تولید تصویر مرجع، ویرایش ویدیوی
      راه‌دور، و گسترش ویدیوی راه‌دور
    - نسبت‌های تصویر: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - وضوح‌ها: `480P`, `720P`
    - مدت: 1-15 ثانیه برای تولید/تصویر به ویدیو، 1-10 ثانیه هنگام
      استفاده از نقش‌های `reference_image`، 2-10 ثانیه برای گسترش
    - تولید تصویر مرجع: برای هر تصویر ارائه‌شده `imageRoles` را روی `reference_image`
      تنظیم کنید؛ xAI تا 7 تصویر از این نوع را می‌پذیرد

    <Warning>
    بافرهای ویدیوی محلی پذیرفته نمی‌شوند. برای ورودی‌های ویرایش/گسترش ویدیو
    از URLهای راه‌دور `http(s)` استفاده کنید. تصویر به ویدیو بافرهای تصویر محلی را می‌پذیرد، زیرا
    OpenClaw می‌تواند آن‌ها را برای xAI به URLهای داده کدگذاری کند.
    </Warning>

    برای استفاده از xAI به‌عنوان ارائه‌دهنده‌ی پیش‌فرض ویدیو:

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
    برای پارامترهای ابزار مشترک، انتخاب ارائه‌دهنده، و رفتار failover،
    [تولید ویدیو](/fa/tools/video-generation) را ببینید.
    </Note>

  </Accordion>

  <Accordion title="تولید تصویر">
    Plugin همراه `xai` تولید تصویر را از طریق ابزار مشترک
    `image_generate` ثبت می‌کند.

    - مدل تصویر پیش‌فرض: `xai/grok-imagine-image`
    - مدل اضافی: `xai/grok-imagine-image-pro`
    - حالت‌ها: متن به تصویر و ویرایش تصویر مرجع
    - ورودی‌های مرجع: یک `image` یا تا پنج `images`
    - نسبت‌های تصویر: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - وضوح‌ها: `1K`, `2K`
    - تعداد: تا 4 تصویر

    OpenClaw از xAI پاسخ‌های تصویر `b64_json` درخواست می‌کند تا رسانه‌ی تولیدشده بتواند
    از طریق مسیر عادی پیوست کانال ذخیره و تحویل شود. تصاویر مرجع محلی
    به URLهای داده تبدیل می‌شوند؛ ارجاع‌های راه‌دور `http(s)` بدون تغییر عبور داده می‌شوند.

    برای استفاده از xAI به‌عنوان ارائه‌دهنده‌ی پیش‌فرض تصویر:

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
    xAI همچنین `quality`، `mask`، `user`، و نسبت‌های بومی اضافی
    مانند `1:2`، `2:1`، `9:20`، و `20:9` را مستند می‌کند. OpenClaw امروز فقط
    کنترل‌های تصویر مشترک میان ارائه‌دهندگان را forward می‌کند؛ knobهای فقط بومیِ پشتیبانی‌نشده
    عمداً از طریق `image_generate` ارائه نمی‌شوند.
    </Note>

  </Accordion>

  <Accordion title="تبدیل متن به گفتار">
    Plugin همراه `xai` تبدیل متن به گفتار را از طریق سطح مشترک ارائه‌دهنده‌ی `tts`
    ثبت می‌کند.

    - صداها: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - صدای پیش‌فرض: `eve`
    - قالب‌ها: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - زبان: کد BCP-47 یا `auto`
    - سرعت: بازنویسی سرعت بومی ارائه‌دهنده
    - قالب بومی یادداشت صوتی Opus پشتیبانی نمی‌شود

    برای استفاده از xAI به‌عنوان ارائه‌دهنده‌ی پیش‌فرض TTS:

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
    OpenClaw از endpoint دسته‌ای `/v1/tts` در xAI استفاده می‌کند. xAI همچنین TTS جریانی
    از طریق WebSocket ارائه می‌دهد، اما قرارداد ارائه‌دهنده‌ی گفتار OpenClaw در حال حاضر انتظار دارد
    پیش از تحویل پاسخ، یک بافر کامل صوتی موجود باشد.
    </Note>

  </Accordion>

  <Accordion title="تبدیل گفتار به متن">
    Plugin همراه `xai` تبدیل گفتار به متن دسته‌ای را از طریق سطح رونویسی
    درک رسانه در OpenClaw ثبت می‌کند.

    - مدل پیش‌فرض: `grok-stt`
    - endpoint: xAI REST `/v1/stt`
    - مسیر ورودی: بارگذاری فایل صوتی multipart
    - در هر جایی از OpenClaw که رونویسی صوت ورودی از
      `tools.media.audio` استفاده کند پشتیبانی می‌شود، از جمله بخش‌های کانال صوتی Discord و
      پیوست‌های صوتی کانال

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

    زبان می‌تواند از طریق پیکربندی مشترک رسانه‌ی صوتی یا درخواست رونویسی
    هر فراخوانی ارائه شود. راهنماهای prompt توسط سطح مشترک OpenClaw پذیرفته می‌شوند،
    اما ادغام STT مبتنی بر REST در xAI فقط فایل، مدل، و
    زبان را forward می‌کند، زیرا این موارد به‌صورت تمیز به endpoint عمومی فعلی xAI نگاشت می‌شوند.

  </Accordion>

  <Accordion title="تبدیل گفتار به متن جریانی">
    Plugin همراه `xai` همچنین یک ارائه‌دهنده‌ی رونویسی بی‌درنگ
    برای صدای تماس صوتی زنده ثبت می‌کند.

    - endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - کدگذاری پیش‌فرض: `mulaw`
    - نرخ نمونه‌برداری پیش‌فرض: `8000`
    - endpointing پیش‌فرض: `800ms`
    - رونویسی‌های موقت: به‌صورت پیش‌فرض فعال

    جریان رسانه‌ای Twilio در Voice Call فریم‌های صوتی G.711 µ-law ارسال می‌کند، بنابراین
    ارائه‌دهنده‌ی xAI می‌تواند آن فریم‌ها را مستقیماً و بدون ترنسکد forward کند:

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

    پیکربندیِ متعلق به ارائه‌دهنده زیر
    `plugins.entries.voice-call.config.streaming.providers.xai` قرار می‌گیرد. کلیدهای
    پشتیبانی‌شده عبارت‌اند از `apiKey`، `baseUrl`، `sampleRate`، `encoding` (`pcm`، `mulaw`، یا
    `alaw`)، `interimResults`، `endpointingMs`، و `language`.

    <Note>
    این ارائه‌دهندهٔ استریمینگ برای مسیر رونویسی بلادرنگ Voice Call است.
    صدای Discord در حال حاضر قطعه‌های کوتاه ضبط می‌کند و به‌جای آن از مسیر رونویسی دسته‌ای
    `tools.media.audio` استفاده می‌کند.
    </Note>

  </Accordion>

  <Accordion title="x_search configuration">
    Plugin همراه xAI، `x_search` را به‌عنوان ابزار OpenClaw برای جست‌وجوی
    محتوای X (که پیش‌تر Twitter بود) از طریق Grok ارائه می‌کند.

    مسیر پیکربندی: `plugins.entries.xai.config.xSearch`

    | کلید              | نوع     | پیش‌فرض           | توضیح                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | فعال یا غیرفعال‌کردن x_search        |
    | `model`            | string  | `grok-4-1-fast`    | مدل استفاده‌شده برای درخواست‌های x_search |
    | `baseUrl`          | string  | -                  | بازنویسی URL پایهٔ xAI Responses     |
    | `inlineCitations`  | boolean | -                  | درج ارجاع‌های درون‌خطی در نتایج      |
    | `maxTurns`         | number  | -                  | حداکثر نوبت‌های مکالمه               |
    | `timeoutSeconds`   | number  | -                  | مهلت زمانی درخواست بر حسب ثانیه      |
    | `cacheTtlMinutes`  | number  | -                  | زمان ماندگاری کش بر حسب دقیقه        |

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

  <Accordion title="Code execution configuration">
    Plugin همراه xAI، `code_execution` را به‌عنوان ابزار OpenClaw برای
    اجرای کد از راه دور در محیط sandbox مربوط به xAI ارائه می‌کند.

    مسیر پیکربندی: `plugins.entries.xai.config.codeExecution`

    | کلید              | نوع     | پیش‌فرض           | توضیح                                  |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (اگر کلید موجود باشد) | فعال یا غیرفعال‌کردن اجرای کد  |
    | `model`           | string  | `grok-4-1-fast`    | مدل استفاده‌شده برای درخواست‌های اجرای کد |
    | `maxTurns`        | number  | -                  | حداکثر نوبت‌های مکالمه                  |
    | `timeoutSeconds`  | number  | -                  | مهلت زمانی درخواست بر حسب ثانیه         |

    <Note>
    این اجرای sandbox از راه دور xAI است، نه [`exec`](/fa/tools/exec) محلی.
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

  <Accordion title="Known limits">
    - احراز هویت امروز فقط با کلید API انجام می‌شود. هنوز جریان OAuth یا device-code برای xAI در
      OpenClaw وجود ندارد.
    - `grok-4.20-multi-agent-experimental-beta-0304` در مسیر عادی ارائه‌دهندهٔ xAI پشتیبانی نمی‌شود، چون به سطح API بالادستی متفاوتی نسبت به انتقال استاندارد OpenClaw xAI نیاز دارد.
    - صدای xAI Realtime هنوز به‌عنوان ارائه‌دهندهٔ OpenClaw ثبت نشده است. این مورد به قرارداد نشست صوتی دوسویهٔ متفاوتی نسبت به STT دسته‌ای یا رونویسی استریمینگ نیاز دارد.
    - `quality` تصویر xAI، `mask` تصویر، و نسبت‌های تصویر اضافیِ فقط بومی تا زمانی که ابزار مشترک `image_generate` کنترل‌های متناظر بین‌ارائه‌دهنده‌ای نداشته باشد ارائه نمی‌شوند.

  </Accordion>

  <Accordion title="Advanced notes">
    - OpenClaw اصلاحات سازگاریِ طرح‌وارهٔ ابزار و فراخوانی ابزار مخصوص xAI را به‌صورت خودکار روی مسیر runner مشترک اعمال می‌کند.
    - درخواست‌های بومی xAI به‌طور پیش‌فرض `tool_stream: true` دارند. برای غیرفعال‌کردن آن،
      `agents.defaults.models["xai/<model>"].params.tool_stream` را روی `false` تنظیم کنید.
    - wrapper همراه xAI پیش از ارسال درخواست‌های بومی xAI، پرچم‌های strict tool-schema و کلیدهای payload reasoning پشتیبانی‌نشده را حذف می‌کند.
    - `web_search`، `x_search`، و `code_execution` به‌عنوان ابزارهای OpenClaw ارائه می‌شوند. OpenClaw به‌جای پیوست‌کردن همهٔ ابزارهای بومی به هر نوبت chat، قابلیت داخلی مشخص xAI موردنیاز خود را داخل هر درخواست ابزار فعال می‌کند.
    - `web_search` مربوط به Grok مقدار `plugins.entries.xai.config.webSearch.baseUrl` را می‌خواند.
      `x_search` مقدار `plugins.entries.xai.config.xSearch.baseUrl` را می‌خواند و سپس
      به URL پایهٔ web-search مربوط به Grok بازمی‌گردد.
    - `x_search` و `code_execution` متعلق به Plugin همراه xAI هستند، نه اینکه در runtime مدلِ core به‌صورت hardcoded قرار گرفته باشند.
    - `code_execution` اجرای sandbox از راه دور xAI است، نه
      [`exec`](/fa/tools/exec) محلی.
  </Accordion>
</AccordionGroup>

## آزمون زنده

مسیرهای رسانه‌ای xAI با آزمون‌های واحد و مجموعه‌های زندهٔ اختیاری پوشش داده شده‌اند. فرمان‌های زنده
پیش از بررسی `XAI_API_KEY`، secretها را از login shell شما، از جمله `~/.profile`، بارگذاری می‌کنند.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

فایل زندهٔ مخصوص ارائه‌دهنده، TTS عادی، TTS با PCM مناسب تلفن، رونویسی صدا از طریق STT دسته‌ای xAI، استریم همان PCM از طریق STT بلادرنگ xAI، تولید خروجی متن‌به‌تصویر، و ویرایش یک تصویر مرجع را می‌سازد. فایل زندهٔ تصویر مشترک، همان ارائه‌دهندهٔ xAI را از طریق مسیر انتخاب runtime، fallback، نرمال‌سازی، و پیوست رسانه در OpenClaw راستی‌آزمایی می‌کند.

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="Video generation" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار ویدیوی مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="All providers" href="/fa/providers/index" icon="grid-2">
    نمای کلی گسترده‌تر ارائه‌دهنده‌ها.
  </Card>
  <Card title="Troubleshooting" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و رفع آن‌ها.
  </Card>
</CardGroup>
