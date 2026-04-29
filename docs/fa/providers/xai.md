---
read_when:
    - می‌خواهید از مدل‌های Grok در OpenClaw استفاده کنید
    - در حال پیکربندی احراز هویت xAI یا شناسه‌های مدل هستید
summary: از مدل‌های xAI Grok در OpenClaw استفاده کنید
title: xAI
x-i18n:
    generated_at: "2026-04-29T23:30:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 420f60d5e80964b926e50cf74cf414d11de1c30d3a4aa8917f1861e0d56ef5b9
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw یک Plugin ارائه‌دهنده‌ی بسته‌بندی‌شده‌ی `xai` را برای مدل‌های Grok عرضه می‌کند.

## شروع به کار

<Steps>
  <Step title="ایجاد یک کلید API">
    در [کنسول xAI](https://console.x.ai/) یک کلید API ایجاد کنید.
  </Step>
  <Step title="تنظیم کلید API">
    `XAI_API_KEY` را تنظیم کنید، یا اجرا کنید:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="انتخاب مدل">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw از API پاسخ‌های xAI به‌عنوان انتقال‌دهنده‌ی xAI بسته‌بندی‌شده استفاده می‌کند. همان
`XAI_API_KEY` همچنین می‌تواند `web_search` مبتنی بر Grok، ابزار درجه‌اول `x_search`،
و `code_execution` راه‌دور را فعال کند.
اگر یک کلید xAI را زیر `plugins.entries.xai.config.webSearch.apiKey` ذخیره کنید،
ارائه‌دهنده‌ی مدل xAI بسته‌بندی‌شده نیز از آن کلید به‌عنوان گزینه‌ی جایگزین استفاده می‌کند.
تنظیمات `code_execution` زیر `plugins.entries.xai.config.codeExecution` قرار دارد.
</Note>

## کاتالوگ داخلی

OpenClaw این خانواده‌های مدل xAI را به‌صورت آماده شامل می‌شود:

| خانواده       | شناسه‌های مدل                                                            |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

این Plugin همچنین شناسه‌های جدیدتر `grok-4*` و `grok-code-fast*` را، وقتی از همان شکل API
پیروی کنند، به‌صورت پیشرو resolve می‌کند.

<Tip>
`grok-4-fast`، `grok-4-1-fast`، و گونه‌های `grok-4.20-beta-*` ارجاع‌های فعلی Grok
با قابلیت تصویر در کاتالوگ بسته‌بندی‌شده هستند.
</Tip>

## پوشش قابلیت‌های OpenClaw

Plugin بسته‌بندی‌شده سطح API عمومی فعلی xAI را به قراردادهای مشترک ارائه‌دهنده و ابزار
OpenClaw نگاشت می‌کند. قابلیت‌هایی که با قرارداد مشترک سازگار نیستند
(برای مثال TTS جریانی و صدای بلادرنگ) ارائه نمی‌شوند — جدول
زیر را ببینید.

| قابلیت xAI                 | سطح OpenClaw                              | وضعیت                                                               |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| چت / پاسخ‌ها               | ارائه‌دهنده‌ی مدل `xai/<model>`           | بله                                                                 |
| جست‌وجوی وب سمت سرور       | ارائه‌دهنده‌ی `web_search` با `grok`      | بله                                                                 |
| جست‌وجوی X سمت سرور        | ابزار `x_search`                          | بله                                                                 |
| اجرای کد سمت سرور          | ابزار `code_execution`                    | بله                                                                 |
| تصاویر                     | `image_generate`                          | بله                                                                 |
| ویدیوها                    | `video_generate`                          | بله                                                                 |
| متن به گفتار دسته‌ای       | `messages.tts.provider: "xai"` / `tts`    | بله                                                                 |
| TTS جریانی                 | —                                         | ارائه نشده است؛ قرارداد TTS در OpenClaw بافرهای کامل صوتی را برمی‌گرداند |
| گفتار به متن دسته‌ای       | `tools.media.audio` / درک رسانه           | بله                                                                 |
| گفتار به متن جریانی        | Voice Call `streaming.provider: "xai"`    | بله                                                                 |
| صدای بلادرنگ               | —                                         | هنوز ارائه نشده است؛ قرارداد نشست/WebSocket متفاوت است             |
| فایل‌ها / دسته‌ها          | فقط سازگاری API مدل عمومی                 | ابزار درجه‌اول OpenClaw نیست                                       |

<Note>
OpenClaw برای تولید رسانه، گفتار، و رونویسی دسته‌ای از APIهای REST تصویر/ویدیو/TTS/STT در xAI،
برای رونویسی زنده‌ی تماس صوتی از WebSocket جریانی STT در xAI،
و برای ابزارهای مدل، جست‌وجو، و اجرای کد از API پاسخ‌ها استفاده می‌کند. قابلیت‌هایی که
به قراردادهای متفاوت OpenClaw نیاز دارند، مانند نشست‌های صدای بلادرنگ، در اینجا به‌عنوان
قابلیت‌های بالادستی مستند شده‌اند، نه رفتار پنهان Plugin.
</Note>

### نگاشت‌های حالت سریع

`/fast on` یا `agents.defaults.models["xai/<model>"].params.fastMode: true`
درخواست‌های بومی xAI را به‌شکل زیر بازنویسی می‌کند:

| مدل مبدا      | مقصد حالت سریع     |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### نام‌های مستعار سازگاری قدیمی

نام‌های مستعار قدیمی همچنان به شناسه‌های بسته‌بندی‌شده‌ی متعارف نرمال‌سازی می‌شوند:

| نام مستعار قدیمی           | شناسه‌ی متعارف                       |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## قابلیت‌ها

<AccordionGroup>
  <Accordion title="جست‌وجوی وب">
    ارائه‌دهنده‌ی جست‌وجوی وب بسته‌بندی‌شده‌ی `grok` از `XAI_API_KEY` نیز استفاده می‌کند:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="تولید ویدیو">
    Plugin بسته‌بندی‌شده‌ی `xai` تولید ویدیو را از طریق ابزار مشترک
    `video_generate` ثبت می‌کند.

    - مدل پیش‌فرض ویدیو: `xai/grok-imagine-video`
    - حالت‌ها: متن به ویدیو، تصویر به ویدیو، تولید تصویر مرجع، ویرایش ویدیوی راه‌دور،
      و گسترش ویدیوی راه‌دور
    - نسبت‌های تصویر: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - وضوح‌ها: `480P`, `720P`
    - مدت‌زمان: 1 تا 15 ثانیه برای تولید/تصویر به ویدیو، 1 تا 10 ثانیه هنگام
      استفاده از نقش‌های `reference_image`، 2 تا 10 ثانیه برای گسترش
    - تولید تصویر مرجع: برای هر تصویر ارائه‌شده `imageRoles` را روی `reference_image` تنظیم کنید؛
      xAI تا 7 تصویر از این نوع را می‌پذیرد

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
    برای پارامترهای ابزار مشترک، انتخاب ارائه‌دهنده، و رفتار failover، [تولید ویدیو](/fa/tools/video-generation) را ببینید.
    </Note>

  </Accordion>

  <Accordion title="تولید تصویر">
    Plugin بسته‌بندی‌شده‌ی `xai` تولید تصویر را از طریق ابزار مشترک
    `image_generate` ثبت می‌کند.

    - مدل پیش‌فرض تصویر: `xai/grok-imagine-image`
    - مدل اضافی: `xai/grok-imagine-image-pro`
    - حالت‌ها: متن به تصویر و ویرایش تصویر مرجع
    - ورودی‌های مرجع: یک `image` یا تا پنج `images`
    - نسبت‌های تصویر: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - وضوح‌ها: `1K`, `2K`
    - تعداد: تا 4 تصویر

    OpenClaw از xAI پاسخ‌های تصویری `b64_json` درخواست می‌کند تا رسانه‌ی تولیدشده بتواند
    از مسیر عادی پیوست کانال ذخیره و تحویل داده شود. تصاویر مرجع محلی به URLهای داده
    تبدیل می‌شوند؛ ارجاع‌های راه‌دور `http(s)` بدون تغییر عبور داده می‌شوند.

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
    مانند `1:2`، `2:1`، `9:20`، و `20:9` را مستند کرده است. OpenClaw امروز فقط کنترل‌های
    تصویری مشترک میان ارائه‌دهنده‌ها را forward می‌کند؛ knobهای فقط‌بومی پشتیبانی‌نشده
    عمدا از طریق `image_generate` ارائه نمی‌شوند.
    </Note>

  </Accordion>

  <Accordion title="متن به گفتار">
    Plugin بسته‌بندی‌شده‌ی `xai` متن به گفتار را از طریق سطح ارائه‌دهنده‌ی مشترک `tts`
    ثبت می‌کند.

    - صداها: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - صدای پیش‌فرض: `eve`
    - قالب‌ها: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - زبان: کد BCP-47 یا `auto`
    - سرعت: بازنویسی سرعت بومی ارائه‌دهنده
    - قالب voice-note بومی Opus پشتیبانی نمی‌شود

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
    روی WebSocket ارائه می‌دهد، اما قرارداد ارائه‌دهنده‌ی گفتار OpenClaw در حال حاضر انتظار دارد
    پیش از تحویل پاسخ، یک بافر صوتی کامل وجود داشته باشد.
    </Note>

  </Accordion>

  <Accordion title="گفتار به متن">
    Plugin بسته‌بندی‌شده‌ی `xai` گفتار به متن دسته‌ای را از طریق سطح رونویسی
    درک رسانه‌ی OpenClaw ثبت می‌کند.

    - مدل پیش‌فرض: `grok-stt`
    - endpoint: xAI REST `/v1/stt`
    - مسیر ورودی: بارگذاری فایل صوتی multipart
    - در هر جایی از OpenClaw که رونویسی صوت ورودی از `tools.media.audio` استفاده می‌کند پشتیبانی می‌شود،
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

    زبان می‌تواند از طریق پیکربندی مشترک رسانه‌ی صوتی یا درخواست رونویسی هر فراخوانی
    ارائه شود. راهنمایی‌های prompt توسط سطح مشترک OpenClaw پذیرفته می‌شوند،
    اما یکپارچه‌سازی REST STT در xAI فقط فایل، مدل، و زبان را forward می‌کند،
    زیرا این موارد به‌صورت تمیز به endpoint عمومی فعلی xAI نگاشت می‌شوند.

  </Accordion>

  <Accordion title="گفتار به متن جریانی">
    Plugin بسته‌بندی‌شده‌ی `xai` همچنین یک ارائه‌دهنده‌ی رونویسی بلادرنگ
    برای صوت تماس صوتی زنده ثبت می‌کند.

    - endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - کدگذاری پیش‌فرض: `mulaw`
    - نرخ نمونه‌برداری پیش‌فرض: `8000`
    - endpointing پیش‌فرض: `800ms`
    - رونویسی‌های موقت: به‌صورت پیش‌فرض فعال است

    جریان رسانه‌ی Twilio در Voice Call فریم‌های صوتی G.711 µ-law ارسال می‌کند، بنابراین
    ارائه‌دهنده‌ی xAI می‌تواند آن فریم‌ها را مستقیما بدون transcode کردن forward کند:

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
    `alaw`)، `interimResults`، `endpointingMs`، و `language`.

    <Note>
    این ارائه‌دهندهٔ streaming برای مسیر رونویسی بی‌درنگ Voice Call است.
    صدای Discord در حال حاضر بخش‌های کوتاه را ضبط می‌کند و به‌جای آن از مسیر رونویسی دسته‌ای
    `tools.media.audio` استفاده می‌کند.
    </Note>

  </Accordion>

  <Accordion title="پیکربندی x_search">
    Plugin همراه xAI، `x_search` را به‌عنوان یک ابزار OpenClaw برای جست‌وجوی
    محتوای X (قبلاً Twitter) از طریق Grok ارائه می‌کند.

    مسیر پیکربندی: `plugins.entries.xai.config.xSearch`

    | کلید              | نوع     | پیش‌فرض           | توضیح                                |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | فعال یا غیرفعال کردن x_search        |
    | `model`            | string  | `grok-4-1-fast`    | مدل استفاده‌شده برای درخواست‌های x_search |
    | `inlineCitations`  | boolean | —                  | گنجاندن ارجاع‌های درون‌خطی در نتایج  |
    | `maxTurns`         | number  | —                  | حداکثر نوبت‌های مکالمه               |
    | `timeoutSeconds`   | number  | —                  | مهلت زمانی درخواست بر حسب ثانیه      |
    | `cacheTtlMinutes`  | number  | —                  | مدت زنده‌ماندن کش بر حسب دقیقه       |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
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
    اجرای کد از راه دور در محیط sandbox xAI ارائه می‌کند.

    مسیر پیکربندی: `plugins.entries.xai.config.codeExecution`

    | کلید              | نوع     | پیش‌فرض           | توضیح                                |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (اگر کلید موجود باشد) | فعال یا غیرفعال کردن اجرای کد  |
    | `model`           | string  | `grok-4-1-fast`    | مدل استفاده‌شده برای درخواست‌های اجرای کد |
    | `maxTurns`        | number  | —                  | حداکثر نوبت‌های مکالمه                  |
    | `timeoutSeconds`  | number  | —                  | مهلت زمانی درخواست بر حسب ثانیه          |

    <Note>
    این اجرای sandbox راه دور xAI است، نه [`exec`](/fa/tools/exec) محلی.
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
    - احراز هویت امروز فقط با کلید API است. هنوز هیچ جریان OAuth یا device-code برای xAI در
      OpenClaw وجود ندارد.
    - `grok-4.20-multi-agent-experimental-beta-0304` در مسیر عادی ارائه‌دهندهٔ xAI پشتیبانی نمی‌شود،
      چون به سطح API بالادستی متفاوتی نسبت به انتقال استاندارد OpenClaw xAI نیاز دارد.
    - صدای بی‌درنگ xAI هنوز به‌عنوان ارائه‌دهندهٔ OpenClaw ثبت نشده است. این قابلیت
      به قرارداد نشست صوتی دوسویه‌ای متفاوت از STT دسته‌ای یا رونویسی streaming نیاز دارد.
    - `quality` تصویر xAI، `mask` تصویر، و نسبت‌های تصویر اضافیِ فقط بومی
      تا زمانی که ابزار مشترک `image_generate` کنترل‌های متناظر بین‌ارائه‌دهنده‌ای نداشته باشد
      ارائه نمی‌شوند.
  </Accordion>

  <Accordion title="یادداشت‌های پیشرفته">
    - OpenClaw اصلاحات سازگاری مخصوص xAI برای schema ابزار و فراخوانی ابزار را
      به‌طور خودکار در مسیر runner مشترک اعمال می‌کند.
    - درخواست‌های بومی xAI به‌صورت پیش‌فرض `tool_stream: true` دارند. برای
      غیرفعال کردن آن، `agents.defaults.models["xai/<model>"].params.tool_stream` را روی `false` تنظیم کنید.
    - wrapper همراه xAI پیش از ارسال درخواست‌های بومی xAI، پرچم‌های strict پشتیبانی‌نشدهٔ schema ابزار و
      کلیدهای payload استدلال را حذف می‌کند.
    - `web_search`، `x_search`، و `code_execution` به‌عنوان ابزارهای OpenClaw ارائه می‌شوند. OpenClaw قابلیت داخلی مشخص xAI را که در هر درخواست ابزار لازم دارد فعال می‌کند،
      به‌جای اینکه همهٔ ابزارهای بومی را به هر نوبت گفت‌وگو پیوست کند.
    - `x_search` و `code_execution` متعلق به Plugin همراه xAI هستند،
      نه اینکه در runtime مدل اصلی hardcode شده باشند.
    - `code_execution` اجرای sandbox راه دور xAI است، نه
      [`exec`](/fa/tools/exec) محلی.
  </Accordion>
</AccordionGroup>

## آزمایش زنده

مسیرهای رسانه‌ای xAI با آزمون‌های واحد و مجموعه‌های زندهٔ opt-in پوشش داده شده‌اند. دستورهای زنده
پیش از بررسی `XAI_API_KEY`، رازها را از login shell شما، از جمله `~/.profile`، بارگذاری می‌کنند.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

فایل زندهٔ مخصوص ارائه‌دهنده، TTS عادی، TTS با PCM مناسب تلفنی را تولید می‌کند،
صدا را از طریق STT دسته‌ای xAI رونویسی می‌کند، همان PCM را از طریق STT بی‌درنگ xAI
stream می‌کند، خروجی متن به تصویر تولید می‌کند، و یک تصویر مرجع را ویرایش می‌کند. فایل زندهٔ تصویر مشترک،
همان ارائه‌دهندهٔ xAI را از طریق مسیر انتخاب runtime، fallback، نرمال‌سازی، و پیوست رسانه‌ای
OpenClaw تأیید می‌کند.

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار ویدئوی مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="همهٔ ارائه‌دهندگان" href="/fa/providers/index" icon="grid-2">
    نمای کلی گسترده‌تر ارائه‌دهندگان.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و رفع آن‌ها.
  </Card>
</CardGroup>
