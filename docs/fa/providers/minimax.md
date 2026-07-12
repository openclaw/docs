---
read_when:
    - شما می‌خواهید از مدل‌های MiniMax در OpenClaw استفاده کنید
    - به راهنمای راه‌اندازی MiniMax نیاز دارید
summary: استفاده از مدل‌های MiniMax در OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-07-12T10:45:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

  Plugin همراه `minimax` دو ارائه‌دهنده و هفت قابلیت را ثبت می‌کند: گفت‌وگو، تولید تصویر، تولید موسیقی، تولید ویدئو، درک تصویر، گفتار (T2A v2) و جست‌وجوی وب.

  | شناسه ارائه‌دهنده | احراز هویت | قابلیت‌ها                                                                                         |
  | ---------------- | ----------- | ------------------------------------------------------------------------------------------------- |
  | `minimax`        | کلید API    | متن، تولید تصویر، تولید موسیقی، تولید ویدئو، درک تصویر، گفتار، جست‌وجوی وب                         |
  | `minimax-portal` | OAuth       | متن، تولید تصویر، تولید موسیقی، تولید ویدئو، درک تصویر، گفتار                                      |

  <Tip>
  پیوند معرفی MiniMax Coding Plan (با ۱۰٪ تخفیف): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
  </Tip>

  ## کاتالوگ داخلی

  | مدل                      | نوع                  | توضیحات                                           |
  | ------------------------ | -------------------- | ------------------------------------------------- |
  | `MiniMax-M3`             | گفت‌وگو (استدلالی)   | مدل استدلالی میزبانی‌شده پیش‌فرض                  |
  | `MiniMax-M2.7`           | گفت‌وگو (استدلالی)   | مدل استدلالی میزبانی‌شده پیشین                    |
  | `MiniMax-M2.7-highspeed` | گفت‌وگو (استدلالی)   | سطح استدلالی سریع‌تر M2.7                         |
  | `MiniMax-VL-01`          | بینایی               | مدل درک تصویر                                     |
  | `image-01`               | تولید تصویر          | ویرایش متن‌به‌تصویر و تصویر‌به‌تصویر              |
  | `music-2.6`              | تولید موسیقی         | مدل موسیقی پیش‌فرض                                |
  | `MiniMax-Hailuo-2.3`     | تولید ویدئو          | جریان‌های متن‌به‌ویدئو و تصویر‌به‌ویدئو            |

  ارجاع‌های مدل از مسیر احراز هویت پیروی می‌کنند: برای راه‌اندازی‌های مبتنی بر کلید API از `minimax/<model>` و برای راه‌اندازی‌های OAuth از `minimax-portal/<model>` استفاده کنید.

  ## شروع به کار

  <Tabs>
  <Tab title="OAuth (Coding Plan)">
    **مناسب برای:** راه‌اندازی سریع MiniMax Coding Plan از طریق OAuth، بدون نیاز به کلید API.

    <Tabs>
      <Tab title="بین‌المللی">
        <Steps>
          <Step title="اجرای راه‌اندازی اولیه">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            نشانی URL پایه ارائه‌دهنده در نتیجه: `api.minimax.io`.
          </Step>
          <Step title="بررسی در دسترس بودن مدل">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="چین">
        <Steps>
          <Step title="اجرای راه‌اندازی اولیه">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            نشانی URL پایه ارائه‌دهنده در نتیجه: `api.minimaxi.com`.
          </Step>
          <Step title="بررسی در دسترس بودن مدل">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    راه‌اندازی‌های OAuth از شناسه ارائه‌دهنده `minimax-portal` استفاده می‌کنند. ارجاع‌های مدل به‌شکل `minimax-portal/MiniMax-M3` هستند.
    </Note>

  </Tab>

  <Tab title="کلید API">
    **مناسب برای:** MiniMax میزبانی‌شده با API سازگار با Anthropic.

    <Tabs>
      <Tab title="بین‌المللی">
        <Steps>
          <Step title="اجرای راه‌اندازی اولیه">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            این دستور `api.minimax.io` را به‌عنوان نشانی URL پایه پیکربندی می‌کند.
          </Step>
          <Step title="بررسی در دسترس بودن مدل">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="چین">
        <Steps>
          <Step title="اجرای راه‌اندازی اولیه">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            این دستور `api.minimaxi.com` را به‌عنوان نشانی URL پایه پیکربندی می‌کند.
          </Step>
          <Step title="بررسی در دسترس بودن مدل">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### نمونه پیکربندی

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    نقطه پایانی استریم سازگار با Anthropic در MiniMax-M2.x، به‌جای بلوک‌های تفکر بومی Anthropic، `reasoning_content` را در قطعه‌های دلتای سبک OpenAI منتشر می‌کند؛ در نتیجه، اگر تفکر به‌طور ضمنی فعال باقی بماند، استدلال داخلی در خروجی قابل مشاهده افشا می‌شود. OpenClaw به‌طور پیش‌فرض تفکر M2.x را غیرفعال می‌کند، مگر اینکه خودتان `thinking` را صریحاً تنظیم کنید. MiniMax-M3 (و نسخه‌های M3.x سازگار با آینده) از این قاعده مستثنا است: M3 بلوک‌های تفکر صحیح Anthropic را منتشر می‌کند و برای تولید محتوای قابل مشاهده باید تفکر فعال باشد؛ بنابراین OpenClaw مدل M3 را در مسیر تفکر تطبیقی ارائه‌دهنده نگه می‌دارد. بخش پیش‌فرض‌های تفکر را در قسمت پیکربندی پیشرفته در ادامه ببینید.
    </Warning>

    <Note>
    راه‌اندازی‌های مبتنی بر کلید API از شناسه ارائه‌دهنده `minimax` استفاده می‌کنند. ارجاع‌های مدل به‌شکل `minimax/MiniMax-M3` هستند.
    </Note>

  </Tab>
</Tabs>

## پیکربندی با `openclaw configure`

<Steps>
  <Step title="اجرای راه‌انداز">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="انتخاب مدل/احراز هویت">
    از منو **Model/auth** را انتخاب کنید.
  </Step>
  <Step title="انتخاب یک گزینه احراز هویت MiniMax">
    | گزینه احراز هویت        | توضیحات                           |
    | ----------------------- | --------------------------------- |
    | `minimax-global-oauth` | OAuth بین‌المللی (طرح کدنویسی)   |
    | `minimax-cn-oauth`     | OAuth چین (طرح کدنویسی)           |
    | `minimax-global-api`   | کلید API بین‌المللی               |
    | `minimax-cn-api`       | کلید API چین                      |
  </Step>
  <Step title="انتخاب مدل پیش‌فرض">
    هنگام نمایش درخواست، مدل پیش‌فرض خود را انتخاب کنید.
  </Step>
</Steps>

## قابلیت‌ها

### تولید تصویر

Plugin مربوط به MiniMax، مدل `image-01` را برای ابزار `image_generate` در هر دو ارائه‌دهنده `minimax` و `minimax-portal` ثبت می‌کند و از همان `MINIMAX_API_KEY` یا احراز هویت OAuth مدل‌های متنی استفاده می‌کند.

- تولید تصویر از متن و ویرایش تصویر به تصویر (مرجع سوژه)، هر دو با قابلیت کنترل نسبت ابعاد
- حداکثر ۹ تصویر خروجی در هر درخواست و ۱ تصویر مرجع در هر درخواست ویرایش
- نسبت‌های ابعاد پشتیبانی‌شده: `1:1`، `16:9`، `4:3`، `3:2`، `2:3`، `3:4`، `9:16`، `21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

تولید تصویر همیشه از نقطه پایانی اختصاصی تصویر MiniMax (`/v1/image_generation`) استفاده می‌کند و `models.providers.minimax.baseUrl` را نادیده می‌گیرد، زیرا آن فیلد به‌جای آن، نشانی پایه سازگار با چت/Anthropic را پیکربندی می‌کند. برای هدایت تولید تصویر از طریق نقطه پایانی چین، `MINIMAX_API_HOST=https://api.minimaxi.com` را تنظیم کنید؛ نقطه پایانی جهانی پیش‌فرض `https://api.minimax.io` است.

<Note>
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار جایگزینی هنگام خرابی، به [تولید تصویر](/fa/tools/image-generation) مراجعه کنید.
</Note>

### تبدیل متن به گفتار

Plugin همراه `minimax`، ‏MiniMax T2A v2 را به‌عنوان ارائه‌دهنده گفتار برای `messages.tts` ثبت می‌کند.

- مدل پیش‌فرض TTS: ‏`speech-2.8-hd`
- صدای پیش‌فرض: `English_expressive_narrator`
- شناسه‌های مدل همراه: `speech-2.8-hd`، `speech-2.8-turbo`، `speech-2.6-hd`، `speech-2.6-turbo`، `speech-02-hd`، `speech-02-turbo`، `speech-01-hd`، `speech-01-turbo`، `speech-01-240228`
- ترتیب تشخیص احراز هویت: ابتدا `messages.tts.providers.minimax.apiKey`، سپس پروفایل‌های احراز هویت OAuth/توکن `minimax-portal`، سپس کلیدهای محیطی طرح توکن (`MINIMAX_OAUTH_TOKEN`، `MINIMAX_CODE_PLAN_KEY`، `MINIMAX_CODING_API_KEY`) و در نهایت `MINIMAX_API_KEY`
- اگر هیچ میزبان TTS پیکربندی نشده باشد، OpenClaw از میزبان OAuth پیکربندی‌شده `minimax-portal` دوباره استفاده می‌کند و پسوندهای مسیر سازگار با Anthropic مانند `/anthropic` را حذف می‌کند
- پیوست‌های صوتی عادی به‌صورت MP3 باقی می‌مانند. مقصدهای پیام صوتی (Feishu، Telegram و کانال‌های دیگری که پیوست سازگار با پیام صوتی درخواست می‌کنند) با `ffmpeg` از MP3 تولیدشده توسط MiniMax به Opus با نرخ ۴۸ کیلوهرتز تبدیل می‌شوند، زیرا برای مثال API فایل Feishu/Lark برای پیام‌های صوتی بومی فقط `file_type: "opus"` را می‌پذیرد
- MiniMax T2A مقادیر اعشاری `speed` و `vol` را می‌پذیرد، اما `pitch` به‌صورت عدد صحیح ارسال می‌شود؛ OpenClaw پیش از درخواست API بخش اعشاری مقادیر `pitch` را حذف می‌کند

| تنظیم                                     | متغیر محیطی             | پیش‌فرض                       | توضیحات                                |
| ----------------------------------------- | ----------------------- | ----------------------------- | -------------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | میزبان API مربوط به MiniMax T2A.       |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | شناسه مدل TTS.                         |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | شناسه صدای مورداستفاده برای خروجی گفتار. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | سرعت پخش، `0.5..2.0`.                  |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | بلندی صدا، `(0, 10]`.                  |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | تغییر زیر و بمی به‌صورت عدد صحیح، `-12..12`. |

### تولید موسیقی

Plugin همراه MiniMax، تولید موسیقی را از طریق ابزار مشترک `music_generate` برای هر دو ارائه‌دهنده `minimax` و `minimax-portal` ثبت می‌کند.

- مدل پیش‌فرض موسیقی: `minimax/music-2.6`‏ (OAuth: ‏`minimax-portal/music-2.6`)
- همچنین از `music-2.6-free`، `music-cover` و `music-cover-free` پشتیبانی می‌کند
- کنترل‌های اعلان: `lyrics`، `instrumental`
- قالب خروجی: `mp3`
- اجراهای متکی به نشست، از طریق روند مشترک وظیفه/وضعیت جدا می‌شوند، از جمله `action: "status"`

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: { primary: "minimax/music-2.6" },
    },
  },
}
```

<Note>
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار جایگزینی هنگام خرابی، به [تولید موسیقی](/fa/tools/music-generation) مراجعه کنید.
</Note>

### تولید ویدئو

Plugin همراه MiniMax، تولید ویدئو را از طریق ابزار مشترک `video_generate` برای هر دو ارائه‌دهنده `minimax` و `minimax-portal` ثبت می‌کند.

- مدل پیش‌فرض ویدئو: `minimax/MiniMax-Hailuo-2.3`‏ (OAuth: ‏`minimax-portal/MiniMax-Hailuo-2.3`)
- همچنین از `MiniMax-Hailuo-2.3-Fast`، `MiniMax-Hailuo-02`، `I2V-01-Director`، `I2V-01-live` و `I2V-01` پشتیبانی می‌کند
- حالت‌ها: تبدیل متن به ویدئو و روندهای دارای مرجع تک‌تصویری
- از `resolution` (مقادیر `768P` یا `1080P` در مدل‌های Hailuo 2.3/02) پشتیبانی می‌کند؛ `aspectRatio` پشتیبانی نمی‌شود و نادیده گرفته می‌شود

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "minimax/MiniMax-Hailuo-2.3" },
    },
  },
}
```

<Note>
برای آشنایی با پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار جایگزینی هنگام خرابی، به [تولید ویدئو](/fa/tools/video-generation) مراجعه کنید.
</Note>

### درک تصویر

Plugin مینی‌مکس، قابلیت درک تصویر را جدا از فهرست متنی ثبت می‌کند:

| شناسه ارائه‌دهنده | مدل پیش‌فرض تصویر | استخراج متن PDF |
| ---------------- | ------------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     | `MiniMax-M2.7`      |
| `minimax-portal` | `MiniMax-VL-01`     | `MiniMax-M2.7`      |

به همین دلیل، مسیریابی خودکار رسانه می‌تواند حتی زمانی که فهرست همراهِ ارائه‌دهندگان متن شامل ارجاع‌های گفت‌وگوی M3 با قابلیت پردازش تصویر نیز هست، از قابلیت درک تصویر مینی‌مکس استفاده کند. درک PDF فقط برای استخراج متن از `MiniMax-M2.7` استفاده می‌کند؛ مینی‌مکس هیچ مسیر تبدیل PDF به تصویر را ثبت نمی‌کند.

### جست‌وجوی وب

Plugin مینی‌مکس همچنین `web_search` را از طریق API جست‌وجوی طرح توکن مینی‌مکس (`/v1/coding_plan/search`) ثبت می‌کند.

- شناسه ارائه‌دهنده: `minimax`
- نتایج ساخت‌یافته: عنوان‌ها، نشانی‌های اینترنتی، گزیده‌ها و پرس‌وجوهای مرتبط
- متغیر محیطی ترجیحی: `MINIMAX_CODE_PLAN_KEY`
- نام‌های مستعار پذیرفته‌شده برای متغیر محیطی: `MINIMAX_CODING_API_KEY`، `MINIMAX_OAUTH_TOKEN`
- مسیر جایگزین سازگاری: `MINIMAX_API_KEY`، در صورتی که از قبل به اعتبارنامه طرح توکن اشاره کند
- استفاده مجدد از منطقه: ابتدا `plugins.entries.minimax.config.webSearch.region`، سپس `MINIMAX_API_HOST` و بعد نشانی‌های پایه ارائه‌دهنده مینی‌مکس
- جست‌وجو روی شناسه ارائه‌دهنده `minimax` باقی می‌ماند؛ راه‌اندازی OAuth چین/جهانی می‌تواند از طریق `models.providers.minimax-portal.baseUrl` به‌طور غیرمستقیم منطقه را هدایت کند و از طریق `MINIMAX_OAUTH_TOKEN` احراز هویت Bearer را فراهم کند

پیکربندی زیر `plugins.entries.minimax.config.webSearch.*` قرار دارد.

<Note>
برای پیکربندی کامل و نحوه استفاده از جست‌وجوی وب، به [جست‌وجوی مینی‌مکس](/fa/tools/minimax-search) مراجعه کنید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="گزینه‌های پیکربندی">
    | گزینه | توضیحات |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | `https://api.minimax.io/anthropic` را ترجیح دهید (سازگار با Anthropic)؛ استفاده از `https://api.minimax.io/v1` برای محموله‌های سازگار با OpenAI اختیاری است |
    | `models.providers.minimax.api` | `anthropic-messages` را ترجیح دهید؛ استفاده از `openai-completions` برای محموله‌های سازگار با OpenAI اختیاری است |
    | `models.providers.minimax.apiKey` | کلید API مینی‌مکس (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | مقادیر `id`، `name`، `reasoning`، `contextWindow`، `maxTokens` و `cost` را تعریف کنید |
    | `agents.defaults.models` | برای مدل‌هایی که می‌خواهید در فهرست مجاز باشند نام مستعار تعریف کنید |
    | `models.mode` | اگر می‌خواهید مینی‌مکس را در کنار گزینه‌های داخلی اضافه کنید، مقدار `merge` را حفظ کنید |
  </Accordion>

  <Accordion title="پیش‌فرض‌های تفکر">
    در `api: "anthropic-messages"`، OpenClaw برای مدل‌های MiniMax M2.x مقدار `thinking: { type: "disabled" }` را تزریق می‌کند، مگر اینکه یک پوشش‌دهنده قبلی فیلد `thinking` را در محموله تنظیم کرده باشد. این کار مانع می‌شود نقطه پایانی جریانی M2.x، مقدار `reasoning_content` را در قطعه‌های تغییرات به سبک OpenAI منتشر کند؛ رفتاری که استدلال داخلی را در خروجی قابل مشاهده افشا می‌کرد.

    MiniMax-M3 (و M3.x) از این قاعده مستثنا است: هنگامی که تفکر غیرفعال باشد، M3 یک آرایه خالی `content` همراه با `stop_reason: "end_turn"` برمی‌گرداند؛ بنابراین OpenClaw پیش‌فرض ضمنیِ غیرفعال را برای M3 حذف می‌کند و در صورت تنظیم سطح تفکر، به‌جای آن `thinking: { type: "adaptive" }` را اجباری می‌کند.

    سطوح تفکر موجود برای هر خانواده مدل:

    | خانواده مدل   | سطوح                                   | پیش‌فرض    |
    | -------------- | ----------------------------------------- | ---------- |
    | `MiniMax-M3`   | `off`، `adaptive`                        | `adaptive` |
    | `MiniMax-M2.x` | `off`، `minimal`، `low`، `medium`، `high` | `off`      |

  </Accordion>

  <Accordion title="حالت سریع">
    دستور `/fast on` یا `params.fastMode: true`، در مسیر جریان سازگار با Anthropic (`api: "anthropic-messages"`، ارائه‌دهنده `minimax` یا `minimax-portal`)، مقدار `MiniMax-M2.7` را به `MiniMax-M2.7-highspeed` بازنویسی می‌کند.
  </Accordion>

  <Accordion title="نمونه جایگزینی هنگام خرابی">
    **بهترین کاربرد:** قوی‌ترین مدل نسل جدید خود را به‌عنوان مدل اصلی حفظ کنید و هنگام خرابی به MiniMax M2.7 تغییر مسیر دهید. نمونه زیر از Opus به‌عنوان یک مدل اصلی مشخص استفاده می‌کند؛ آن را با مدل اصلی نسل جدید دلخواه خود جایگزین کنید.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="جزئیات استفاده از طرح کدنویسی">
    - API مصرف طرح کدنویسی: `https://api.minimaxi.com/v1/token_plan/remains` یا `https://api.minimax.io/v1/token_plan/remains` (به کلید طرح کدنویسی نیاز دارد).
    - در صورت پیکربندی، نظرسنجی مصرف، میزبان را از `models.providers.minimax-portal.baseUrl` یا `models.providers.minimax.baseUrl` استخراج می‌کند؛ بنابراین راه‌اندازی‌های جهانی که از `https://api.minimax.io/anthropic` استفاده می‌کنند، `api.minimax.io` را نظرسنجی می‌کنند. نشانی‌های پایه مفقود یا نادرست، برای سازگاری مسیر جایگزین چین را حفظ می‌کنند.
    - OpenClaw مصرف طرح کدنویسی مینی‌مکس را به همان نمایش `% left` که سایر ارائه‌دهندگان استفاده می‌کنند، عادی‌سازی می‌کند. فیلدهای خام `usage_percent` / `usagePercent` مینی‌مکس سهمیه باقی‌مانده را نشان می‌دهند، نه سهمیه مصرف‌شده؛ بنابراین OpenClaw آن‌ها را معکوس می‌کند. در صورت وجود، فیلدهای مبتنی بر شمارش اولویت دارند.
    - هنگامی که API مقدار `model_remains` را برمی‌گرداند، OpenClaw ورودی مدل گفت‌وگو را ترجیح می‌دهد، در صورت نیاز برچسب بازه را از `start_time` / `end_time` استخراج می‌کند و نام مدل انتخاب‌شده را در برچسب طرح می‌گنجاند تا تشخیص بازه‌های طرح کدنویسی آسان‌تر شود.
    - نماهای لحظه‌ای مصرف، `minimax`، `minimax-cn`، `minimax-portal` و `minimax-portal-cn` را یک سطح سهمیه مینی‌مکس در نظر می‌گیرند و پیش از استفاده از متغیرهای محیطی کلید طرح کدنویسی به‌عنوان مسیر جایگزین، OAuth ذخیره‌شده مینی‌مکس را ترجیح می‌دهند.

  </Accordion>
</AccordionGroup>

## یادداشت‌ها

- مدل پیش‌فرض گفت‌وگو: `MiniMax-M3`. مدل‌های جایگزین گفت‌وگو: `MiniMax-M2.7`، `MiniMax-M2.7-highspeed`
- فرایند راه‌اندازی اولیه و تنظیم مستقیم کلید API، تعریف مدل‌ها را برای M3 و هر دو گونه M2.7 می‌نویسند
- درک تصویر از ارائه‌دهنده رسانه `MiniMax-VL-01` متعلق به Plugin استفاده می‌کند
- اگر به ردیابی دقیق هزینه نیاز دارید، مقادیر قیمت‌گذاری را در `models.json` به‌روزرسانی کنید
- برای تأیید شناسه کنونی ارائه‌دهنده از `openclaw models list` استفاده کنید، سپس با `openclaw models set minimax/MiniMax-M3` یا `openclaw models set minimax-portal/MiniMax-M3` مدل را تغییر دهید

<Note>
برای قواعد ارائه‌دهندگان، به [ارائه‌دهندگان مدل](/fa/concepts/model-providers) مراجعه کنید.
</Note>

## عیب‌یابی

<AccordionGroup>
  <Accordion title='"مدل ناشناخته: minimax/MiniMax-M3"'>
    این پیام معمولاً به این معنا است که **ارائه‌دهنده مینی‌مکس پیکربندی نشده است** (هیچ ورودی ارائه‌دهنده منطبقی وجود ندارد و هیچ نمایه احراز هویت یا کلید محیطی مینی‌مکس یافت نشده است). برای رفع مشکل:

    - `openclaw configure` را اجرا و یکی از گزینه‌های احراز هویت **MiniMax** را انتخاب کنید، یا
    - بلوک منطبق `models.providers.minimax` یا `models.providers.minimax-portal` را به‌صورت دستی اضافه کنید، یا
    - `MINIMAX_API_KEY`، `MINIMAX_OAUTH_TOKEN` یا یک نمایه احراز هویت مینی‌مکس را تنظیم کنید تا ارائه‌دهنده منطبق قابل تزریق باشد.

    مطمئن شوید شناسه مدل **به حروف بزرگ و کوچک حساس** است:

    - مسیر کلید API: `minimax/MiniMax-M3`، `minimax/MiniMax-M2.7` یا `minimax/MiniMax-M2.7-highspeed`
    - مسیر OAuth: `minimax-portal/MiniMax-M3`، `minimax-portal/MiniMax-M2.7` یا `minimax-portal/MiniMax-M2.7-highspeed`

    سپس دوباره با دستور زیر بررسی کنید:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
راهنمای بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq).
</Note>

## مطالب مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پارامترهای مشترک ابزار تصویر و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید موسیقی" href="/fa/tools/music-generation" icon="music">
    پارامترهای مشترک ابزار موسیقی و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدئو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="جست‌وجوی مینی‌مکس" href="/fa/tools/minimax-search" icon="magnifying-glass">
    پیکربندی جست‌وجوی وب از طریق طرح توکن مینی‌مکس.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    عیب‌یابی عمومی و پرسش‌های متداول.
  </Card>
</CardGroup>
