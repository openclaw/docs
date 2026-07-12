---
read_when:
    - شما یک کلید API واحد برای چندین مدل زبانی بزرگ می‌خواهید
    - می‌خواهید مدل‌ها را از طریق OpenRouter در OpenClaw اجرا کنید
    - می‌خواهید برای تولید تصویر از OpenRouter استفاده کنید
    - می‌خواهید از OpenRouter برای تولید موسیقی استفاده کنید
    - می‌خواهید از OpenRouter برای تولید ویدئو استفاده کنید
summary: از API یکپارچهٔ OpenRouter برای دسترسی به مدل‌های متعدد در OpenClaw استفاده کنید
title: OpenRouter
x-i18n:
    generated_at: "2026-07-12T10:42:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter درخواست‌ها را با یک API و یک کلید به مدل‌های متعددی هدایت می‌کند. این سرویس
با OpenAI سازگار است، بنابراین OpenClaw از طریق همان انتقال به‌سبک
`openai-completions` که برای دیگر ارائه‌دهندگان پروکسی استفاده می‌شود با آن ارتباط برقرار می‌کند.

## شروع به کار

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="اجرای راه‌اندازی اولیه OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw جریان ورود مرورگری OpenRouter ‏(PKCE) را باز می‌کند، کد را
        با یک کلید API ‏OpenRouter مبادله می‌کند و آن را در نمایه احراز هویت پیش‌فرض
        OpenRouter ذخیره می‌کند. در میزبان‌های راه‌دور یا بدون رابط گرافیکی، OpenClaw نشانی
        ورود را نمایش می‌دهد و پس از ورود از شما می‌خواهد نشانی تغییرمسیر را جای‌گذاری کنید.
      </Step>
      <Step title="(اختیاری) تغییر به یک مدل مشخص">
        راه‌اندازی اولیه به‌طور پیش‌فرض از `openrouter/auto` استفاده می‌کند. بعداً یک مدل مشخص انتخاب کنید:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="کلید API">
    <Steps>
      <Step title="دریافت کلید API">
        در [openrouter.ai/keys](https://openrouter.ai/keys) یک کلید API ایجاد کنید.
      </Step>
      <Step title="اجرای راه‌اندازی اولیه با کلید API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(اختیاری) تغییر به یک مدل مشخص">
        راه‌اندازی اولیه به‌طور پیش‌فرض از `openrouter/auto` استفاده می‌کند. بعداً یک مدل مشخص انتخاب کنید:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## نمونه پیکربندی

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## ارجاع‌های مدل

<Note>
ارجاع‌های مدل از الگوی `openrouter/<provider>/<model>` پیروی می‌کنند. برای فهرست کامل
ارائه‌دهندگان و مدل‌های موجود، به [/concepts/model-providers](/fa/concepts/model-providers) مراجعه کنید.
</Note>

مدل‌های جایگزین همراه، که هنگام در دسترس نبودن کشف زنده فهرست مدل‌ها استفاده می‌شوند:

| ارجاع مدل                         | توضیحات                        |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | مسیریابی خودکار OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 از طریق MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 از طریق MoonshotAI     |

هر ارجاع دیگر با قالب `openrouter/<provider>/<model>`، از جمله
`openrouter/openrouter/fusion` (به [مسیریاب Fusion](#fusion-router) مراجعه کنید)،
به‌صورت پویا بر اساس فهرست زنده مدل‌های OpenRouter تفکیک می‌شود.

## تولید تصویر

OpenRouter می‌تواند پشتیبان ابزار `image_generate` باشد. یک مدل تصویر OpenRouter را
در `agents.defaults.imageGenerationModel` تنظیم کنید:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw درخواست‌های تصویر را با
`modalities: ["image", "text"]` به API تصویر تکمیل گفت‌وگوی OpenRouter ارسال می‌کند. مدل‌های تصویر Gemini همچنین
راهنمایی‌های `aspectRatio` و `resolution` را از طریق `image_config` در OpenRouter دریافت می‌کنند؛ دیگر
مدل‌های تصویر این راهنمایی‌ها را دریافت نمی‌کنند. برای مدل‌های کندتر از `agents.defaults.imageGenerationModel.timeoutMs`
استفاده کنید؛ مقدار `timeoutMs` مختص هر فراخوانی ابزار `image_generate` همچنان اولویت دارد.

## تولید ویدئو

OpenRouter می‌تواند از طریق API ناهمگام
`/videos` پشتیبان ابزار `video_generate` باشد. یک مدل ویدئوی OpenRouter را در
`agents.defaults.videoGenerationModel` تنظیم کنید:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw کارهای تبدیل متن به ویدئو و تصویر به ویدئو را ارسال می‌کند، نشانی
`polling_url` بازگردانده‌شده را به‌طور دوره‌ای بررسی می‌کند و ویدئوی نهایی را از
`unsigned_urls` در OpenRouter یا نقطه پایانی محتوای کار دانلود می‌کند. تصاویر مرجع به‌طور پیش‌فرض
به‌عنوان تصاویر فریم اول/آخر استفاده می‌شوند؛ تصاویری که با `reference_image` برچسب‌گذاری شده‌اند، در عوض
به‌عنوان مراجع ورودی ارسال می‌شوند. پیش‌فرض همراه `google/veo-3.1-fast` از مدت‌زمان‌های
۴/۶/۸ ثانیه، وضوح‌های `720P`/`1080P` و نسبت‌های تصویر `16:9`/`9:16` پشتیبانی می‌کند.
تبدیل ویدئو به ویدئو پشتیبانی نمی‌شود: API بالادستی فقط متن و مراجع تصویری را
می‌پذیرد.

## تولید موسیقی

OpenRouter می‌تواند از طریق خروجی صوتی تکمیل گفت‌وگو
پشتیبان ابزار `music_generate` باشد. یک مدل صوتی OpenRouter را در
`agents.defaults.musicGenerationModel` تنظیم کنید:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "openrouter/google/lyria-3-pro-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

ارائه‌دهنده موسیقی همراه OpenRouter به‌طور پیش‌فرض از `google/lyria-3-pro-preview`
استفاده می‌کند و `google/lyria-3-clip-preview` را نیز ارائه می‌دهد. OpenClaw
`modalities: ["text", "audio"]` را ارسال می‌کند، پاسخ را به‌صورت جریانی دریافت می‌کند، قطعه‌های صوتی را گردآوری می‌کند و
نتیجه را به‌عنوان رسانه تولیدشده برای تحویل در کانال ذخیره می‌کند. مدل‌های Lyria یک
تصویر مرجع را از طریق پارامتر مشترک `music_generate image=...` می‌پذیرند.
صوت جریانی، نگهداری رونوشت و پوش رویداد SSE مشتق‌شده
به `agents.defaults.mediaMaxMb` محدود می‌شوند (سقف پیش‌فرض صوت ۱۶ مگابایت است).

## تبدیل متن به گفتار

OpenRouter می‌تواند از طریق نقطه پایانی سازگار با OpenAI خود، یعنی
`/audio/speech`، به‌عنوان ارائه‌دهنده TTS عمل کند.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

اگر `messages.tts.providers.openrouter.apiKey` حذف شده باشد، TTS ابتدا به
`models.providers.openrouter.apiKey` و سپس به `OPENROUTER_API_KEY` بازمی‌گردد.

## تبدیل گفتار به متن (صدای ورودی)

OpenRouter می‌تواند پیوست‌های ورودی صوتی/صدای گفتاری را از طریق مسیر مشترک
`tools.media.audio` و با استفاده از نقطه پایانی STT خود (`/audio/transcriptions`)
رونویسی کند. این قابلیت برای هر Plugin کانالی اعمال می‌شود که صدای گفتاری/صوتی
ورودی را به پیش‌بررسی درک رسانه‌ای ارسال می‌کند.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

OpenClaw درخواست‌های STT مربوط به OpenRouter را به‌صورت JSON و با صوت کدگذاری‌شده
با base64 در `input_audio` (قرارداد STT در OpenRouter) ارسال می‌کند، نه به‌صورت
بارگذاری فرم چندبخشی OpenAI.

## مسیریاب Fusion

OpenRouter Fusion یک ارجاع مدل OpenClaw را به‌صورت موازی به چند مدل OpenRouter
می‌فرستد، از OpenRouter می‌خواهد پاسخ‌های آن‌ها را داوری کند و یک پاسخ نهایی را
از طریق نقطه پایانی معمول OpenRouter بازمی‌گرداند. شناسه مدل بالادستی
`openrouter/fusion` است؛ بنابراین ارجاع مدل OpenClaw هم پیشوند ارائه‌دهنده
OpenClaw و هم فضای نام بالادستی OpenRouter را در خود دارد:

```bash
openclaw models set openrouter/openrouter/fusion
```

پنل و داور Fusion را از طریق `params.extraBody` مدل پیکربندی کنید؛ این فیلدها
مستقیماً به بدنه درخواست تکمیل‌های گفت‌وگوی OpenRouter ارسال می‌شوند. Fusion
هم با راه‌اندازی OAuth و هم با کلید API کار می‌کند؛ اگر از OAuth استفاده
می‌کنید، خط `env.OPENROUTER_API_KEY` زیر را حذف کنید.

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/openrouter/fusion" },
      models: {
        "openrouter/openrouter/fusion": {
          params: {
            extraBody: {
              plugins: [
                {
                  id: "fusion",
                  analysis_models: [
                    "google/gemini-3.5-flash",
                    "moonshotai/kimi-k2.6",
                    "deepseek/deepseek-v4-pro",
                  ],
                  model: "google/gemini-3.5-flash",
                },
              ],
            },
          },
        },
      },
    },
  },
}
```

`analysis_models` پنل موازی است؛ `model` درون پیکربندی Plugin مربوط به Fusion،
مدل داور است. در نوبت‌های عادی عامل/گفت‌وگو، برای وادار کردن Fusion، مقدار
سطح‌بالای `tool_choice` را روی `"required"` تنظیم نکنید: نوبت‌های OpenClaw
می‌توانند شامل تعریف ابزارهای خودشان باشند و الزام به انتخاب ابزار در سطح بالا
ممکن است به‌جای مسیریاب Fusion یکی از آن ابزارها را انتخاب کند. وقتی این
پیکربندی Plugin مربوط به Fusion وجود داشته باشد، OpenClaw یادداشتی پالایش‌شده
به پیام سیستمی اضافه می‌کند که مدل‌های تحلیل پیکربندی‌شده و مدل داور را فهرست
می‌کند تا عامل بتواند به پرسش‌های مربوط به پنل Fusion خودش پاسخ دهد. سایر
فیلدهای `extraBody` در پیام کپی نمی‌شوند.

Fusion عمداً کندتر است: OpenRouter پیام را به چند مدل تحلیل توزیع می‌کند و سپس
مرحله داوری/ترکیب را اجرا می‌کند؛ بنابراین تأخیر آن از یک درخواست مستقیم تک‌مدلی
بیشتر است. از آن برای پاسخ‌های سنجیده و باکیفیت یا مسیرهای تصعید استفاده کنید،
نه به‌عنوان گزینه پیش‌فرض حساس به تأخیر. برای پاسخ‌های سریع‌تر، پنل را کوچک نگه
دارید و مدل‌های تحلیل/داور سریع‌تری انتخاب کنید.

یک ارجاع پیکربندی‌شده را با یک فراخوانی محلی تک‌مرحله‌ای آزمایش کنید:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## احراز هویت و سرآیندها

OpenRouter از توکن Bearer برگرفته از کلید API شما استفاده می‌کند. OAuth در
OpenRouter یک جریان ورود PKCE است که یک کلید API مربوط به OpenRouter صادر
می‌کند؛ بنابراین OpenClaw نتیجه را در همان پروفایل احراز هویت کلید API با نام
`openrouter:default` ذخیره می‌کند که در راه‌اندازی دستی کلید API استفاده می‌شود.

برای ورود یا چرخش کلید ذخیره‌شده در یک نصب موجود، بدون اجرای دوباره کل فرایند
راه‌اندازی:

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

در درخواست‌های تأییدشده OpenRouter (`https://openrouter.ai/api/v1`)، OpenClaw
سرآیندهای مستندشده انتساب برنامه در OpenRouter را اضافه می‌کند:

| سرآیند                    | مقدار                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
اگر ارائه‌دهنده OpenRouter را به پراکسی یا نشانی پایه دیگری هدایت کنید، OpenClaw
سرآیندهای مختص OpenRouter یا نشانگرهای کش Anthropic را تزریق **نمی‌کند**.
</Warning>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="کش‌کردن پاسخ">
    کش‌کردن پاسخ در OpenRouter اختیاری است. آن را برای هر مدل فعال کنید:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw مقدار `X-OpenRouter-Cache: true` و در صورت پیکربندی،
    `X-OpenRouter-Cache-TTL` را ارسال می‌کند. `responseCacheClear: true` برای
    درخواست جاری نوسازی را اجباری می‌کند و پاسخ جایگزین را ذخیره می‌کند.
    نام‌های مستعار با شیوه snake_case یعنی (`response_cache`،
    `response_cache_ttl_seconds`، `response_cache_clear`) و همچنین
    `responseCacheTtl` / `response_cache_ttl` بدون پسوند `Seconds` پذیرفته
    می‌شوند.

    این قابلیت از کش پیام ارائه‌دهنده و نشانگرهای Anthropic با نام
    `cache_control` در OpenRouter جدا است. این قابلیت فقط در مسیرهای تأییدشده
    `openrouter.ai` اعمال می‌شود، نه در نشانی‌های پایه پراکسی سفارشی.

  </Accordion>

  <Accordion title="نشانگرهای کش Anthropic">
    در مسیرهای تأییدشده OpenRouter، ارجاع‌های مدل Anthropic نشانگرهای Anthropic
    با نام `cache_control` در OpenRouter را برای استفاده مجدد بهتر از کش پیام
    در بلوک‌های پیام سیستم/توسعه‌دهنده حفظ می‌کنند.
  </Accordion>

  <Accordion title="پیش‌پرکردن استدلال Anthropic">
    در مسیرهای تأییدشده OpenRouter، ارجاع‌های مدل Anthropic که استدلال برایشان فعال است،
    نوبت‌های پیش‌پرکرده پایانی دستیار را پیش از رسیدن درخواست به
    OpenRouter حذف می‌کنند تا الزام Anthropic مبنی بر اینکه مکالمات استدلالی
    باید با نوبت کاربر پایان یابند، رعایت شود.
  </Accordion>

  <Accordion title="تزریق تفکر / استدلال">
    در مسیرهای پشتیبانی‌شده غیر از `auto`، OpenClaw سطح تفکر انتخاب‌شده را
    به محموله‌های استدلالی پراکسی OpenRouter نگاشت می‌کند. `openrouter/auto` و اشاره‌های
    مدل پشتیبانی‌نشده از این تزریق صرف‌نظر می‌کنند. ارجاع‌های منسوخ `openrouter/hunter-alpha` نیز
    از آن صرف‌نظر می‌کنند، زیرا OpenRouter ممکن بود در آن مسیر بازنشسته، متن پاسخ نهایی را
    در فیلدهای استدلال برگرداند.
  </Accordion>

  <Accordion title="بازپخش استدلال DeepSeek V4">
    در مسیرهای تأییدشده OpenRouter، `openrouter/deepseek/deepseek-v4-flash` و
    `openrouter/deepseek/deepseek-v4-pro` مقدار گمشده `reasoning_content` را در
    نوبت‌های بازپخش‌شده دستیار تکمیل می‌کنند و مکالمات تفکر/ابزار را در قالب پیگیری
    موردنیاز DeepSeek V4 نگه می‌دارند. OpenClaw مقادیر `reasoning.effort`
    پشتیبانی‌شده توسط OpenRouter را برای این مسیرها ارسال می‌کند: `xhigh`/`max` به `xhigh`
    نگاشت می‌شوند و هر سطح دیگری که خاموش نباشد، به `high` نگاشت می‌شود.
  </Accordion>

  <Accordion title="شکل‌دهی درخواست مختص OpenAI">
    OpenRouter از مسیر سازگار با OpenAI به سبک پراکسی اجرا می‌شود؛ بنابراین شکل‌دهی
    بومی درخواست که مختص OpenAI است، مانند `serviceTier`، گزینه `store` در Responses،
    محموله‌های سازگاری استدلال OpenAI و اشاره‌های کش پرامپت، بازارسال نمی‌شود.
  </Accordion>

  <Accordion title="مسیرهای مبتنی بر Gemini">
    ارجاع‌های OpenRouter مبتنی بر Gemini در مسیر پراکسی Gemini باقی می‌مانند: OpenClaw
    پاک‌سازی امضای تفکر Gemini را در آنجا حفظ می‌کند، اما اعتبارسنجی بومی
    بازپخش Gemini یا بازنویسی‌های راه‌اندازی اولیه را فعال نمی‌کند.
  </Accordion>

  <Accordion title="فراداده مسیریابی ارائه‌دهنده">
    OpenRouter برای مسیریابی ارائه‌دهنده زیربنایی، از یک شیء درخواست `provider`
    پشتیبانی می‌کند. یک سیاست پیش‌فرض برای همه درخواست‌های مدل متنی OpenRouter
    با `models.providers.openrouter.params.provider` پیکربندی کنید:

    ```json5
    {
      models: {
        providers: {
          openrouter: {
            params: {
              provider: {
                sort: "latency",
                require_parameters: true,
                data_collection: "deny",
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw آن شیء را به‌عنوان محموله `provider` درخواست به OpenRouter
    ارسال می‌کند. از فیلدهای snake_case مستندشده OpenRouter استفاده کنید، از جمله `sort`،
    `only`، `ignore`، `order`، `allow_fallbacks`، `require_parameters`،
    `data_collection`، `quantizations`، `max_price`، `preferred_max_latency`،
    `preferred_min_throughput`، `zdr` و `enforce_distillable_text`.

    پارامترهای هر مدل، شیء مسیریابی سراسری ارائه‌دهنده را بازنویسی می‌کنند:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/anthropic/claude-sonnet-4-6": {
              params: {
                provider: {
                  order: ["anthropic"],
                  allow_fallbacks: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    این فقط در مسیرهای تکمیل گفت‌وگوی OpenRouter اعمال می‌شود. مسیرهای مستقیم Anthropic،
    Google، OpenAI یا ارائه‌دهنده سفارشی، پارامترهای مسیریابی OpenRouter را نادیده می‌گیرند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی عامل‌ها، مدل‌ها و ارائه‌دهندگان.
  </Card>
</CardGroup>
