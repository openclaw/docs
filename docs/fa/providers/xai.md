---
read_when:
    - می‌خواهید از مدل‌های Grok در OpenClaw استفاده کنید
    - در حال پیکربندی احراز هویت xAI یا شناسه‌های مدل هستید
summary: استفاده از مدل‌های xAI Grok در OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-02T12:00:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f36b597fd5c47b61724080deb0d545bca024aca17744fc8aa6a0eb4872d12d2
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw یک Plugin ارائه‌دهنده‌ی همراه `xai` را برای مدل‌های Grok عرضه می‌کند.

## شروع به کار

<Steps>
  <Step title="ایجاد یک کلید API">
    یک کلید API در [کنسول xAI](https://console.x.ai/) ایجاد کنید.
  </Step>
  <Step title="تنظیم کلید API">
    `XAI_API_KEY` را تنظیم کنید، یا اجرا کنید:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="انتخاب یک مدل">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw از API پاسخ‌های xAI به‌عنوان انتقال xAI همراه استفاده می‌کند. همان
`XAI_API_KEY` می‌تواند همچنین نیروی `web_search` پشتیبانی‌شده با Grok، `x_search` درجه‌یک،
و `code_execution` راه‌دور را فراهم کند.
اگر یک کلید xAI را زیر `plugins.entries.xai.config.webSearch.apiKey` ذخیره کنید،
ارائه‌دهنده‌ی مدل xAI همراه آن کلید را به‌عنوان جایگزین نیز بازاستفاده می‌کند.
`plugins.entries.xai.config.webSearch.baseUrl` را تنظیم کنید تا `web_search` مربوط به Grok
و، به‌طور پیش‌فرض، `x_search` را از طریق یک پروکسی API پاسخ‌های xAI متعلق به اپراتور مسیریابی کنید.
تنظیمات `code_execution` زیر `plugins.entries.xai.config.codeExecution` قرار دارد.
</Note>

## کاتالوگ داخلی

OpenClaw این خانواده‌های مدل xAI را به‌صورت آماده شامل می‌شود:

| خانواده       | شناسه‌های مدل                                                              |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

این Plugin همچنین شناسه‌های جدیدتر `grok-4*` و `grok-code-fast*` را وقتی
از همان شکل API پیروی کنند، به‌صورت پیشرو حل می‌کند.

<Tip>
`grok-4.3`، `grok-4-fast`، `grok-4-1-fast`، و گونه‌های `grok-4.20-beta-*`
ارجاع‌های فعلی Grok با قابلیت تصویر در کاتالوگ همراه هستند.
</Tip>

## پوشش قابلیت‌های OpenClaw

Plugin همراه، سطح API عمومی فعلی xAI را روی قراردادهای مشترک ارائه‌دهنده
و ابزار OpenClaw نگاشت می‌کند. قابلیت‌هایی که با قرارداد مشترک سازگار نیستند
(برای مثال TTS جریانی و صدای بی‌درنگ) ارائه نمی‌شوند — جدول زیر را ببینید.

| قابلیت xAI                  | سطح OpenClaw                              | وضعیت                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| چت / پاسخ‌ها               | ارائه‌دهنده‌ی مدل `xai/<model>`           | بله                                                                |
| جست‌وجوی وب سمت سرور       | ارائه‌دهنده‌ی `web_search` با `grok`      | بله                                                                |
| جست‌وجوی X سمت سرور        | ابزار `x_search`                          | بله                                                                |
| اجرای کد سمت سرور          | ابزار `code_execution`                    | بله                                                                |
| تصاویر                     | `image_generate`                          | بله                                                                |
| ویدیوها                    | `video_generate`                          | بله                                                                |
| تبدیل متن به گفتار دسته‌ای | `messages.tts.provider: "xai"` / `tts`    | بله                                                                |
| TTS جریانی                 | —                                         | ارائه نشده؛ قرارداد TTS در OpenClaw بافرهای صوتی کامل برمی‌گرداند |
| تبدیل گفتار به متن دسته‌ای | `tools.media.audio` / درک رسانه           | بله                                                                |
| تبدیل گفتار به متن جریانی  | Voice Call `streaming.provider: "xai"`    | بله                                                                |
| صدای بی‌درنگ               | —                                         | هنوز ارائه نشده؛ قرارداد نشست/WebSocket متفاوت است                |
| فایل‌ها / دسته‌ها          | فقط سازگاری عمومی API مدل                 | ابزار درجه‌یک OpenClaw نیست                                        |

<Note>
OpenClaw از APIهای REST تصویر/ویدیو/TTS/STT در xAI برای تولید رسانه،
گفتار، و رونویسی دسته‌ای، از WebSocket جریانی STT در xAI برای رونویسی
تماس صوتی زنده، و از API پاسخ‌ها برای ابزارهای مدل، جست‌وجو، و اجرای کد
استفاده می‌کند. قابلیت‌هایی که به قراردادهای متفاوت OpenClaw نیاز دارند،
مانند نشست‌های صدای بی‌درنگ، اینجا به‌عنوان قابلیت‌های بالادستی مستند شده‌اند
نه رفتار پنهان Plugin.
</Note>

### نگاشت‌های حالت سریع

`/fast on` یا `agents.defaults.models["xai/<model>"].params.fastMode: true`
درخواست‌های بومی xAI را به‌شکل زیر بازنویسی می‌کند:

| مدل مبدأ      | هدف حالت سریع    |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### نام‌های مستعار سازگاری قدیمی

نام‌های مستعار قدیمی همچنان به شناسه‌های همراه استاندارد نرمال‌سازی می‌شوند:

| نام مستعار قدیمی           | شناسه‌ی استاندارد                     |
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
    - نسبت‌های تصویر: `1:1`، `16:9`، `9:16`، `4:3`، `3:4`، `3:2`، `2:3`
    - وضوح‌ها: `480P`، `720P`
    - مدت: 1-15 ثانیه برای تولید/تصویر به ویدیو، 1-10 ثانیه هنگام
      استفاده از نقش‌های `reference_image`، و 2-10 ثانیه برای گسترش
    - تولید تصویر مرجع: `imageRoles` را برای هر تصویر ارائه‌شده روی
      `reference_image` تنظیم کنید؛ xAI تا 7 تصویر از این نوع را می‌پذیرد

    <Warning>
    بافرهای ویدیوی محلی پذیرفته نمی‌شوند. برای ورودی‌های ویرایش/گسترش
    ویدیو از URLهای راه‌دور `http(s)` استفاده کنید. تصویر به ویدیو بافرهای
    تصویر محلی را می‌پذیرد، چون OpenClaw می‌تواند آن‌ها را برای xAI به
    URLهای داده کدگذاری کند.
    </Warning>

    برای استفاده از xAI به‌عنوان ارائه‌دهنده‌ی ویدیوی پیش‌فرض:

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
    برای پارامترهای ابزار مشترک، انتخاب ارائه‌دهنده، و رفتار failover به
    [تولید ویدیو](/fa/tools/video-generation) مراجعه کنید.
    </Note>

  </Accordion>

  <Accordion title="تولید تصویر">
    Plugin همراه `xai` تولید تصویر را از طریق ابزار مشترک
    `image_generate` ثبت می‌کند.

    - مدل تصویر پیش‌فرض: `xai/grok-imagine-image`
    - مدل اضافی: `xai/grok-imagine-image-pro`
    - حالت‌ها: متن به تصویر و ویرایش تصویر مرجع
    - ورودی‌های مرجع: یک `image` یا حداکثر پنج `images`
    - نسبت‌های تصویر: `1:1`، `16:9`، `9:16`، `4:3`، `3:4`، `2:3`، `3:2`
    - وضوح‌ها: `1K`، `2K`
    - تعداد: حداکثر 4 تصویر

    OpenClaw از xAI پاسخ‌های تصویری `b64_json` درخواست می‌کند تا رسانه‌ی
    تولیدشده بتواند از مسیر معمول پیوست کانال ذخیره و تحویل شود. تصاویر
    مرجع محلی به URLهای داده تبدیل می‌شوند؛ مراجع راه‌دور `http(s)` بدون
    تغییر عبور داده می‌شوند.

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
    xAI همچنین `quality`، `mask`، `user`، و نسبت‌های بومی اضافی مانند
    `1:2`، `2:1`، `9:20`، و `20:9` را مستند می‌کند. OpenClaw امروز فقط
    کنترل‌های تصویری مشترک بین ارائه‌دهنده‌ها را عبور می‌دهد؛ تنظیمات
    پشتیبانی‌نشده‌ی فقط‌بومی عمداً از طریق `image_generate` ارائه نمی‌شوند.
    </Note>

  </Accordion>

  <Accordion title="تبدیل متن به گفتار">
    Plugin همراه `xai` تبدیل متن به گفتار را از طریق سطح ارائه‌دهنده‌ی
    مشترک `tts` ثبت می‌کند.

    - صداها: `eve`، `ara`، `rex`، `sal`، `leo`، `una`
    - صدای پیش‌فرض: `eve`
    - قالب‌ها: `mp3`، `wav`، `pcm`، `mulaw`، `alaw`
    - زبان: کد BCP-47 یا `auto`
    - سرعت: بازنویسی سرعت بومی ارائه‌دهنده
    - قالب بومی یادداشت صوتی Opus پشتیبانی نمی‌شود

    برای استفاده از xAI به‌عنوان ارائه‌دهنده‌ی TTS پیش‌فرض:

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
    OpenClaw از نقطه‌پایانی دسته‌ای `/v1/tts` در xAI استفاده می‌کند. xAI
    همچنین TTS جریانی را از طریق WebSocket ارائه می‌دهد، اما قرارداد ارائه‌دهنده‌ی
    گفتار OpenClaw در حال حاضر پیش از تحویل پاسخ انتظار یک بافر صوتی کامل را دارد.
    </Note>

  </Accordion>

  <Accordion title="تبدیل گفتار به متن">
    Plugin همراه `xai` تبدیل گفتار به متن دسته‌ای را از طریق سطح رونویسی
    درک رسانه‌ی OpenClaw ثبت می‌کند.

    - مدل پیش‌فرض: `grok-stt`
    - نقطه‌پایانی: REST xAI `/v1/stt`
    - مسیر ورودی: بارگذاری فایل صوتی multipart
    - در هر جایی از OpenClaw که رونویسی صوت ورودی از `tools.media.audio`
      استفاده کند پشتیبانی می‌شود، از جمله بخش‌های کانال صوتی Discord و
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
    هر فراخوانی ارائه شود. راهنمایی‌های prompt توسط سطح مشترک OpenClaw
    پذیرفته می‌شوند، اما یکپارچه‌سازی REST STT در xAI فقط فایل، مدل، و
    زبان را عبور می‌دهد، چون این‌ها به‌طور شفاف به نقطه‌پایانی عمومی فعلی
    xAI نگاشت می‌شوند.

  </Accordion>

  <Accordion title="تبدیل گفتار به متن جریانی">
    Plugin همراه `xai` همچنین یک ارائه‌دهنده‌ی رونویسی بی‌درنگ برای
    صوت تماس صوتی زنده ثبت می‌کند.

    - نقطه‌پایانی: WebSocket xAI `wss://api.x.ai/v1/stt`
    - کدگذاری پیش‌فرض: `mulaw`
    - نرخ نمونه‌برداری پیش‌فرض: `8000`
    - تشخیص پایان پیش‌فرض: `800ms`
    - رونویسی‌های موقت: به‌طور پیش‌فرض فعال

    جریان رسانه‌ای Twilio در Voice Call فریم‌های صوتی G.711 µ-law ارسال می‌کند،
    بنابراین ارائه‌دهنده‌ی xAI می‌تواند آن فریم‌ها را مستقیماً بدون ترنسکد
    ارسال کند:

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
    `plugins.entries.voice-call.config.streaming.providers.xai` قرار می‌گیرد. کلیدهای
    پشتیبانی‌شده عبارت‌اند از `apiKey`، `baseUrl`، `sampleRate`، `encoding` (`pcm`، `mulaw`، یا
    `alaw`)، `interimResults`، `endpointingMs` و `language`.

    <Note>
    این ارائه‌دهنده‌ی جریانی برای مسیر رونویسی بی‌درنگ Voice Call است.
    صدای Discord در حال حاضر قطعه‌های کوتاه ضبط می‌کند و به‌جای آن از مسیر رونویسی دسته‌ای
    `tools.media.audio` استفاده می‌کند.
    </Note>

  </Accordion>

  <Accordion title="x_search configuration">
    Plugin همراه xAI، `x_search` را به‌عنوان یک ابزار OpenClaw برای جست‌وجوی
    محتوای X (که پیش‌تر Twitter بود) از طریق Grok ارائه می‌کند.

    مسیر پیکربندی: `plugins.entries.xai.config.xSearch`

    | کلید               | نوع     | پیش‌فرض           | توضیح                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | فعال یا غیرفعال کردن x_search        |
    | `model`            | string  | `grok-4-1-fast`    | مدل استفاده‌شده برای درخواست‌های x_search |
    | `baseUrl`          | string  | —                  | بازنویسی URL پایه‌ی xAI Responses    |
    | `inlineCitations`  | boolean | —                  | گنجاندن ارجاع‌های درون‌خطی در نتایج |
    | `maxTurns`         | number  | —                  | حداکثر نوبت‌های مکالمه               |
    | `timeoutSeconds`   | number  | —                  | مهلت زمانی درخواست بر حسب ثانیه      |
    | `cacheTtlMinutes`  | number  | —                  | مدت ماندگاری کش بر حسب دقیقه         |

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
    Plugin همراه xAI، `code_execution` را به‌عنوان یک ابزار OpenClaw برای
    اجرای کد از راه دور در محیط sandbox xAI ارائه می‌کند.

    مسیر پیکربندی: `plugins.entries.xai.config.codeExecution`

    | کلید              | نوع     | پیش‌فرض                    | توضیح                                  |
    | ----------------- | ------- | -------------------------- | -------------------------------------- |
    | `enabled`         | boolean | `true` (اگر کلید موجود باشد) | فعال یا غیرفعال کردن اجرای کد       |
    | `model`           | string  | `grok-4-1-fast`            | مدل استفاده‌شده برای درخواست‌های اجرای کد |
    | `maxTurns`        | number  | —                          | حداکثر نوبت‌های مکالمه                 |
    | `timeoutSeconds`  | number  | —                          | مهلت زمانی درخواست بر حسب ثانیه        |

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
    - احراز هویت امروز فقط با کلید API انجام می‌شود. هنوز هیچ جریان xAI OAuth یا کد دستگاهی در
      OpenClaw وجود ندارد.
    - `grok-4.20-multi-agent-experimental-beta-0304` در مسیر عادی ارائه‌دهنده‌ی xAI
      پشتیبانی نمی‌شود، چون به سطح API بالادستی متفاوتی نسبت به انتقال استاندارد OpenClaw xAI
      نیاز دارد.
    - صدای بی‌درنگ xAI هنوز به‌عنوان یک ارائه‌دهنده‌ی OpenClaw ثبت نشده است. این قابلیت
      به قرارداد نشست صوتی دوسویه‌ی متفاوتی نسبت به STT دسته‌ای یا رونویسی جریانی نیاز دارد.
    - `quality` تصویر xAI، `mask` تصویر و نسبت‌های تصویر اضافی فقط-بومی تا زمانی که ابزار مشترک
      `image_generate` کنترل‌های متناظر بین‌ارائه‌دهنده‌ای نداشته باشد ارائه نمی‌شوند.
  </Accordion>

  <Accordion title="Advanced notes">
    - OpenClaw اصلاحات سازگاری مخصوص xAI برای طرح‌واره‌ی ابزار و فراخوانی ابزار را
      به‌طور خودکار در مسیر runner مشترک اعمال می‌کند.
    - درخواست‌های بومی xAI به‌صورت پیش‌فرض `tool_stream: true` دارند. برای
      غیرفعال کردن آن، `agents.defaults.models["xai/<model>"].params.tool_stream` را روی `false` بگذارید.
    - wrapper همراه xAI، پرچم‌های strict پشتیبانی‌نشده در طرح‌واره‌ی ابزار و
      کلیدهای payload استدلال را پیش از ارسال درخواست‌های بومی xAI حذف می‌کند.
    - `web_search`، `x_search` و `code_execution` به‌عنوان ابزارهای OpenClaw
      ارائه می‌شوند. OpenClaw به‌جای پیوست کردن همه‌ی ابزارهای بومی به هر نوبت چت،
      قابلیت درونی xAI مشخصی را که در هر درخواست ابزار نیاز دارد فعال می‌کند.
    - `web_search` مربوط به Grok، `plugins.entries.xai.config.webSearch.baseUrl` را می‌خواند.
      `x_search`، `plugins.entries.xai.config.xSearch.baseUrl` را می‌خواند و سپس
      در صورت نبود آن به URL پایه‌ی جست‌وجوی وب Grok برمی‌گردد.
    - `x_search` و `code_execution` به Plugin همراه xAI تعلق دارند،
      نه اینکه در runtime مدل هسته hardcode شده باشند.
    - `code_execution` اجرای sandbox از راه دور xAI است، نه
      [`exec`](/fa/tools/exec) محلی.
  </Accordion>
</AccordionGroup>

## آزمون زنده

مسیرهای رسانه‌ای xAI با آزمون‌های واحد و مجموعه‌های زنده‌ی انتخابی پوشش داده می‌شوند. دستورهای زنده
پیش از بررسی `XAI_API_KEY`، رازها را از shell ورود شما، از جمله `~/.profile`، بارگذاری می‌کنند.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

فایل زنده‌ی ویژه‌ی ارائه‌دهنده، TTS عادی، TTS با PCM سازگار با تلفن، رونویسی صدا از طریق STT دسته‌ای xAI،
جریان‌دهی همان PCM از طریق STT بی‌درنگ xAI، تولید خروجی متن‌به‌تصویر و ویرایش یک تصویر مرجع را
می‌سازد. فایل زنده‌ی تصویر مشترک، همان ارائه‌دهنده‌ی xAI را از طریق مسیر انتخاب runtime،
fallback، نرمال‌سازی و پیوست رسانه در OpenClaw راستی‌آزمایی می‌کند.

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار failover.
  </Card>
  <Card title="Video generation" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار ویدیوی مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="All providers" href="/fa/providers/index" icon="grid-2">
    نمای کلی گسترده‌تر ارائه‌دهندگان.
  </Card>
  <Card title="Troubleshooting" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و رفع آن‌ها.
  </Card>
</CardGroup>
