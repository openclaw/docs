---
read_when:
    - شما یک کلید API واحد برای بسیاری از LLMها می‌خواهید
    - می‌خواهید مدل‌ها را از طریق OpenRouter در OpenClaw اجرا کنید
    - می‌خواهید از OpenRouter برای تولید تصویر استفاده کنید
    - می‌خواهید از OpenRouter برای تولید موسیقی استفاده کنید
    - می‌خواهید از OpenRouter برای تولید ویدئو استفاده کنید
summary: از API یکپارچهٔ OpenRouter برای دسترسی به مدل‌های بسیار در OpenClaw استفاده کنید.
title: OpenRouter
x-i18n:
    generated_at: "2026-07-03T09:50:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca36f2a7afd35ea4d276f61ded28524aed7d15715b29eea9aaac0ac6e4abab40
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter یک **API یکپارچه** ارائه می‌دهد که درخواست‌ها را از طریق یک endpoint و کلید API واحد به مدل‌های بسیاری هدایت می‌کند. این سرویس با OpenAI سازگار است، بنابراین بیشتر OpenAI SDKها با تغییر base URL کار می‌کنند.

## شروع به کار

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="اجرای راه‌اندازی OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw جریان ورود مرورگری OpenRouter را باز می‌کند، کد PKCE
        را با یک کلید API برای OpenRouter مبادله می‌کند و آن کلید را در پروفایل
        احراز هویت پیش‌فرض OpenRouter ذخیره می‌کند. روی میزبان‌های راه‌دور/بدون رابط گرافیکی، OpenClaw
        URL ورود را چاپ می‌کند و از شما می‌خواهد پس از ورود، URL بازگشتی را بچسبانید.
      </Step>
      <Step title="(اختیاری) تغییر به یک مدل مشخص">
        راه‌اندازی به‌طور پیش‌فرض از `openrouter/auto` استفاده می‌کند. بعدا یک مدل مشخص انتخاب کنید:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="کلید API">
    <Steps>
      <Step title="دریافت کلید API خود">
        در [openrouter.ai/keys](https://openrouter.ai/keys) یک کلید API بسازید.
      </Step>
      <Step title="اجرای راه‌اندازی با کلید API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(اختیاری) تغییر به یک مدل مشخص">
        راه‌اندازی به‌طور پیش‌فرض از `openrouter/auto` استفاده می‌کند. بعدا یک مدل مشخص انتخاب کنید:

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
ارائه‌دهندگان و مدل‌های موجود، [/concepts/model-providers](/fa/concepts/model-providers) را ببینید.
</Note>

نمونه‌های fallback همراه:

| ارجاع مدل                         | یادداشت‌ها                        |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | مسیریابی خودکار OpenRouter |
| `openrouter/openrouter/fusion`    | مسیریاب OpenRouter Fusion     |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 از طریق MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 از طریق MoonshotAI     |

## تولید تصویر

OpenRouter می‌تواند پشتوانه ابزار `image_generate` نیز باشد. از یک مدل تصویر OpenRouter در `agents.defaults.imageGenerationModel` استفاده کنید:

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

OpenClaw درخواست‌های تصویر را با `modalities: ["image", "text"]` به API تصویر تکمیل‌های چت OpenRouter می‌فرستد. مدل‌های تصویر Gemini راهنمایی‌های پشتیبانی‌شده `aspectRatio` و `resolution` را از طریق `image_config` در OpenRouter دریافت می‌کنند. برای مدل‌های تصویر کندتر OpenRouter از `agents.defaults.imageGenerationModel.timeoutMs` استفاده کنید؛ پارامتر `timeoutMs` در هر فراخوانی ابزار `image_generate` همچنان اولویت دارد.

## تولید ویدیو

OpenRouter می‌تواند از طریق API ناهمگام `/videos` خود پشتوانه ابزار `video_generate` نیز باشد. از یک مدل ویدیوی OpenRouter در `agents.defaults.videoGenerationModel` استفاده کنید:

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

OpenClaw کارهای متن-به-ویدیو و تصویر-به-ویدیو را به OpenRouter ارسال می‌کند، `polling_url`
برگشتی را نظرسنجی می‌کند و ویدیوی کامل‌شده را از `unsigned_urls`
در OpenRouter یا endpoint مستندشده محتوای کار دانلود می‌کند.
تصاویر مرجع به‌طور پیش‌فرض به‌عنوان تصاویر فریم اول/آخر ارسال می‌شوند؛ تصاویر
دارای برچسب `reference_image` به‌عنوان مرجع‌های ورودی OpenRouter ارسال می‌شوند. پیش‌فرض
همراه `google/veo-3.1-fast` مدت‌های 4/6/8
ثانیه، وضوح‌های `720P`/`1080P`، و نسبت‌های تصویر `16:9`/`9:16`
را که در حال حاضر پشتیبانی می‌شوند اعلام می‌کند. ویدیو-به-ویدیو برای OpenRouter ثبت نشده است، چون API بالادستی
تولید ویدیو فعلا متن و مرجع‌های تصویر را می‌پذیرد.

## تولید موسیقی

OpenRouter می‌تواند از طریق خروجی صوتی تکمیل‌های چت
پشتوانه ابزار `music_generate` نیز باشد. از یک مدل صوتی OpenRouter در
`agents.defaults.musicGenerationModel` استفاده کنید:

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

ارائه‌دهنده موسیقی OpenRouter همراه به‌طور پیش‌فرض از
`google/lyria-3-pro-preview` استفاده می‌کند و
`google/lyria-3-clip-preview` را نیز در دسترس می‌گذارد. OpenClaw
`modalities: ["text", "audio"]` را می‌فرستد، streaming را فعال می‌کند،
قطعه‌های صوتی streamشده را جمع‌آوری می‌کند و نتیجه را به‌عنوان رسانه تولیدشده
برای تحویل در کانال ذخیره می‌کند. تصاویر مرجع برای مدل‌های Lyria از طریق
پارامتر مشترک `music_generate image=...` پذیرفته می‌شوند.

## متن-به-گفتار

OpenRouter همچنین می‌تواند از طریق endpoint سازگار با OpenAI
`/audio/speech` به‌عنوان ارائه‌دهنده TTS استفاده شود.

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

اگر `messages.tts.providers.openrouter.apiKey` حذف شود، TTS دوباره از
`models.providers.openrouter.apiKey` و سپس `OPENROUTER_API_KEY` استفاده می‌کند.

## گفتار-به-متن (صدای ورودی)

OpenRouter می‌تواند پیوست‌های صوتی/صدای ورودی را از طریق مسیر مشترک
`tools.media.audio` و با استفاده از endpoint STT خود (`/audio/transcriptions`) رونویسی کند.
این برای هر Plugin کانالی اعمال می‌شود که صدا/voice ورودی را به
پیش‌بررسی فهم رسانه ارسال می‌کند.

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

OpenClaw درخواست‌های STT OpenRouter را به‌صورت JSON با صدای base64 در
`input_audio` (قرارداد STT در OpenRouter) ارسال می‌کند، نه به‌صورت بارگذاری‌های فرم چندبخشی OpenAI.

## مسیریاب Fusion

وقتی می‌خواهید یک ارجاع مدل OpenClaw از چندین مدل
OpenRouter به‌صورت موازی بپرسد، OpenRouter پاسخ‌های آن‌ها را داوری کند و یک
پاسخ نهایی واحد را از طریق endpoint عادی ارائه‌دهنده OpenRouter برگرداند، از OpenRouter Fusion استفاده کنید. چون
slug مدل بالادستی `openrouter/fusion` است، ارجاع مدل OpenClaw هم
پیشوند ارائه‌دهنده OpenClaw و هم namespace بالادستی OpenRouter را شامل می‌شود:

```bash
openclaw models set openrouter/openrouter/fusion
```

پنل و داور Fusion را از طریق `params.extraBody` مدل پیکربندی کنید. این
فیلدها به بدنه درخواست chat-completions در OpenRouter فرستاده می‌شوند. Fusion
هم با راه‌اندازی OAuth در OpenRouter و هم با راه‌اندازی کلید API کار می‌کند؛ اگر از
OAuth استفاده می‌کنید، خط `env.OPENROUTER_API_KEY` را از نمونه زیر حذف کنید.

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

فهرست `analysis_models` پنل موازی است، و `model` داخل پیکربندی Plugin
Fusion مدل داور است. در نوبت‌های عادی agent/chat در OpenClaw، مقدار سطح بالای `tool_choice` را برای تلاش جهت اجبار Fusion روی
`"required"` تنظیم نکنید؛
نوبت‌های OpenClaw ممکن است شامل تعریف ابزارهای OpenClaw باشند، و انتخاب اجباری
ابزار در سطح بالا می‌تواند به‌جای مسیریاب Fusion یکی از همان ابزارها را الزام کند. وقتی
این پیکربندی Plugin Fusion وجود داشته باشد، OpenClaw همچنین یک یادداشت
system-prompt پاک‌سازی‌شده با مدل‌های تحلیل و مدل داور پیکربندی‌شده اضافه می‌کند تا
agent بتواند به پرسش‌ها درباره پنل Fusion فعلی خود پاسخ دهد. فیلدهای دیگر `extraBody`
در prompt کپی نمی‌شوند.

Fusion عمدا کندتر است. OpenRouter ممکن است همان prompt OpenClaw را به
چندین مدل تحلیل بفرستد و سپس یک مرحله نهایی داوری/ترکیب اجرا کند، بنابراین تاخیر
معمولا از یک درخواست مستقیم تک‌مدلی بیشتر است. از Fusion برای پاسخ‌های سنجیده و
باکیفیت یا مسیرهای escalation استفاده کنید، نه به‌عنوان پیش‌فرض برای
چت حساس به تاخیر. برای پاسخ‌های سریع‌تر، پنل را کوچک نگه دارید و
مدل‌های تحلیل و داوری سریع‌تر انتخاب کنید.

ارجاع پیکربندی‌شده را با یک فراخوانی یک‌باره مدل محلی آزمایش کنید:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## احراز هویت و headerها

OpenRouter در پشت صحنه از یک Bearer token همراه با کلید API شما استفاده می‌کند. OpenRouter
OAuth یک جریان ورود PKCE است که یک کلید API برای OpenRouter صادر می‌کند، بنابراین OpenClaw
نتیجه را به‌عنوان همان پروفایل احراز هویت کلید API با نام `openrouter:default` ذخیره می‌کند که در
مسیر راه‌اندازی دستی با کلید API استفاده می‌شود.

برای یک نصب موجود، بدون اجرای دوباره راه‌اندازی کامل، وارد شوید یا کلید ذخیره‌شده OpenRouter را rotate کنید:

```bash
openclaw models auth login --provider openrouter --method oauth
```

وقتی می‌خواهید کلیدی را که به‌صورت دستی در OpenRouter ساخته‌اید بچسبانید، از
`openclaw models auth login --provider openrouter --method api-key` استفاده کنید.

در درخواست‌های واقعی OpenRouter (`https://openrouter.ai/api/v1`)، OpenClaw همچنین
headerهای مستندشده انتساب برنامه در OpenRouter را اضافه می‌کند:

| Header                    | مقدار                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
اگر ارائه‌دهنده OpenRouter را به proxy یا base URL دیگری نشانه‌گذاری مجدد کنید، OpenClaw
آن headerهای خاص OpenRouter یا نشانگرهای cache در Anthropic را تزریق **نمی‌کند**.
</Warning>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="cache کردن پاسخ">
    cache کردن پاسخ در OpenRouter اختیاری و opt-in است. آن را برای هر مدل OpenRouter با
    پارامترهای مدل فعال کنید:

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
    درخواست فعلی refresh را اجبار می‌کند و پاسخ جایگزین را ذخیره می‌کند. aliasهای snake_case
    (`response_cache`، `response_cache_ttl_seconds` و
    `response_cache_clear`) نیز پذیرفته می‌شوند.

    این قابلیت از cache کردن prompt در ارائه‌دهنده و از نشانگرهای
    Anthropic `cache_control` در OpenRouter جدا است. این فقط روی مسیرهای تاییدشده
    `openrouter.ai` اعمال می‌شود، نه base URLهای proxy سفارشی.

  </Accordion>

  <Accordion title="نشانگرهای cache در Anthropic">
    روی مسیرهای تاییدشده OpenRouter، ارجاع‌های مدل Anthropic نشانگرهای
    خاص OpenRouter برای Anthropic یعنی `cache_control` را حفظ می‌کنند که OpenClaw برای
    استفاده بهتر دوباره از prompt-cache روی بلوک‌های prompt سیستم/developer به کار می‌برد.
  </Accordion>

  <Accordion title="پیش‌پرکردن استدلال Anthropic">
    در مسیرهای تأییدشده OpenRouter، ارجاع‌های مدل Anthropic که استدلال برای آن‌ها فعال است،
    نوبت‌های پیش‌پرکرده انتهایی دستیار را پیش از رسیدن درخواست به OpenRouter حذف می‌کنند؛
    این رفتار با الزام Anthropic همخوان است که گفت‌وگوهای استدلالی باید با نوبت کاربر
    پایان یابند.
  </Accordion>

  <Accordion title="تزریق تفکر / استدلال">
    در مسیرهای پشتیبانی‌شده غیر از `auto`، OpenClaw سطح تفکر انتخاب‌شده را به
    بارهای استدلال پراکسی OpenRouter نگاشت می‌کند. راهنمایی‌های مدل پشتیبانی‌نشده و
    `openrouter/auto` آن تزریق استدلال را رد می‌کنند. Hunter Alpha همچنین
    استدلال پراکسی را برای ارجاع‌های مدل پیکربندی‌شده قدیمی رد می‌کند، زیرا OpenRouter ممکن است
    متن پاسخ نهایی را در فیلدهای استدلال برای آن مسیر بازنشسته‌شده برگرداند.
  </Accordion>

  <Accordion title="بازپخش استدلال DeepSeek V4">
    در مسیرهای تأییدشده OpenRouter، `openrouter/deepseek/deepseek-v4-flash` و
    `openrouter/deepseek/deepseek-v4-pro` مقدارهای گمشده `reasoning_content` را در
    نوبت‌های دستیار بازپخش‌شده پر می‌کنند تا گفت‌وگوهای تفکر/ابزار شکل پیگیری موردنیاز DeepSeek V4 را حفظ کنند.
    OpenClaw مقدارهای `reasoning.effort` پشتیبانی‌شده توسط OpenRouter را برای این مسیرها ارسال می‌کند؛
    سطح‌های پایین‌تر غیرخاموش به `high` نگاشت می‌شوند، و بازنویسی‌های قدیمی `max` به `xhigh` نگاشت می‌شوند.
  </Accordion>

  <Accordion title="شکل‌دهی درخواست فقط مخصوص OpenAI">
    OpenRouter همچنان از مسیر سازگار با OpenAI به سبک پراکسی عبور می‌کند، بنابراین
    شکل‌دهی درخواست بومی فقط مخصوص OpenAI مانند `serviceTier`، مقدار `store` در Responses،
    بارهای سازگاری استدلال OpenAI، و راهنمایی‌های حافظه نهان پرامپت ارسال نمی‌شوند.
  </Accordion>

  <Accordion title="مسیرهای مبتنی بر Gemini">
    ارجاع‌های OpenRouter مبتنی بر Gemini روی مسیر پراکسی-Gemini باقی می‌مانند: OpenClaw
    پاک‌سازی امضای فکری Gemini را آنجا حفظ می‌کند، اما اعتبارسنجی بازپخش بومی Gemini
    یا بازنویسی‌های راه‌اندازی را فعال نمی‌کند.
  </Accordion>

  <Accordion title="فراداده مسیریابی ارائه‌دهنده">
    OpenRouter از یک شیء درخواست `provider` برای مسیریابی ارائه‌دهنده زیرین
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

    OpenClaw آن شیء را به‌عنوان بار درخواست `provider` به OpenRouter ارسال می‌کند.
    از فیلدهای snake_case مستندشده OpenRouter استفاده کنید، از جمله `sort`،
    `only`، `ignore`، `order`، `allow_fallbacks`، `require_parameters`،
    `data_collection`، `quantizations`، `max_price`، `preferred_max_latency`،
    `preferred_min_throughput`، `zdr`، و `enforce_distillable_text`.

    پارامترهای هر مدل همچنان شیء مسیریابی سراسری ارائه‌دهنده را بازنویسی می‌کنند:

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

    این فقط روی مسیرهای chat-completions در OpenRouter اعمال می‌شود. مسیرهای مستقیم Anthropic،
    Google، OpenAI، یا ارائه‌دهنده سفارشی، پارامترهای مسیریابی OpenRouter را نادیده می‌گیرند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی برای عامل‌ها، مدل‌ها، و ارائه‌دهندگان.
  </Card>
</CardGroup>
