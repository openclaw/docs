---
read_when:
    - شما یک کلید API واحد برای بسیاری از LLMها می‌خواهید
    - می‌خواهید مدل‌ها را از طریق OpenRouter در OpenClaw اجرا کنید
    - می‌خواهید از OpenRouter برای تولید تصویر استفاده کنید
    - می‌خواهید از OpenRouter برای تولید موسیقی استفاده کنید
    - می‌خواهید از OpenRouter برای تولید ویدئو استفاده کنید
summary: از API یکپارچه OpenRouter برای دسترسی به مدل‌های متعدد در OpenClaw استفاده کنید
title: OpenRouter
x-i18n:
    generated_at: "2026-06-27T18:43:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40f1888d388de6f97329fc681da97d6c82eeba5d35b3861bde71ebc7c76e19e7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter یک **API یکپارچه** ارائه می‌دهد که درخواست‌ها را پشت یک
نقطه پایانی و کلید API واحد به مدل‌های زیادی مسیریابی می‌کند. با OpenAI سازگار است، بنابراین بیشتر SDKهای OpenAI با تغییر URL پایه کار می‌کنند.

## شروع به کار

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="اجرای راه‌اندازی اولیه OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw جریان ورود مرورگری OpenRouter را باز می‌کند، کد PKCE
        را با یک کلید API OpenRouter مبادله می‌کند، و آن کلید را در پروفایل احراز هویت
        پیش‌فرض OpenRouter ذخیره می‌کند. روی میزبان‌های راه‌دور/بدون رابط گرافیکی، OpenClaw
        URL ورود را چاپ می‌کند و از شما می‌خواهد پس از ورود، URL بازگشت را بچسبانید.
      </Step>
      <Step title="(اختیاری) تغییر به یک مدل مشخص">
        راه‌اندازی اولیه به‌صورت پیش‌فرض از `openrouter/auto` استفاده می‌کند. بعدا یک مدل مشخص انتخاب کنید:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="کلید API">
    <Steps>
      <Step title="دریافت کلید API">
        یک کلید API در [openrouter.ai/keys](https://openrouter.ai/keys) بسازید.
      </Step>
      <Step title="اجرای راه‌اندازی اولیه با کلید API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(اختیاری) تغییر به یک مدل مشخص">
        راه‌اندازی اولیه به‌صورت پیش‌فرض از `openrouter/auto` استفاده می‌کند. بعدا یک مدل مشخص انتخاب کنید:

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

OpenRouter همچنین می‌تواند پشتیبان ابزار `image_generate` باشد. از یک مدل تصویر OpenRouter زیر `agents.defaults.imageGenerationModel` استفاده کنید:

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

OpenClaw درخواست‌های تصویر را با `modalities: ["image", "text"]` به API تصویر تکمیل‌های گفت‌وگوی OpenRouter می‌فرستد. مدل‌های تصویر Gemini راهنمایی‌های پشتیبانی‌شده `aspectRatio` و `resolution` را از طریق `image_config` OpenRouter دریافت می‌کنند. برای مدل‌های تصویر کندتر OpenRouter از `agents.defaults.imageGenerationModel.timeoutMs` استفاده کنید؛ پارامتر `timeoutMs` در هر فراخوانی ابزار `image_generate` همچنان اولویت دارد.

## تولید ویدیو

OpenRouter همچنین می‌تواند از طریق API ناهمگام `/videos` خود پشتیبان ابزار `video_generate` باشد. از یک مدل ویدیوی OpenRouter زیر `agents.defaults.videoGenerationModel` استفاده کنید:

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

OpenClaw کارهای تبدیل متن به ویدیو و تصویر به ویدیو را به OpenRouter ارسال می‌کند، `polling_url` برگشتی را پایش می‌کند، و ویدیوی کامل‌شده را از
`unsigned_urls` OpenRouter یا نقطه پایانی مستندشده محتوای کار دانلود می‌کند.
تصاویر مرجع به‌صورت پیش‌فرض به‌عنوان تصاویر فریم اول/آخر ارسال می‌شوند؛ تصاویر
برچسب‌خورده با `reference_image` به‌عنوان ارجاع‌های ورودی OpenRouter ارسال می‌شوند. مقدار پیش‌فرض همراه `google/veo-3.1-fast` مدت‌زمان‌های 4/6/8 ثانیه‌ای، وضوح‌های `720P`/`1080P`، و نسبت‌های تصویر `16:9`/`9:16` را که در حال حاضر پشتیبانی می‌شوند اعلام می‌کند. تبدیل ویدیو به ویدیو برای OpenRouter ثبت نشده است، زیرا API بالادستی تولید ویدیو در حال حاضر متن و ارجاع‌های تصویری را می‌پذیرد.

## تولید موسیقی

OpenRouter همچنین می‌تواند از طریق خروجی صوتی تکمیل‌های گفت‌وگو پشتیبان ابزار `music_generate` باشد. از یک مدل صوتی OpenRouter زیر
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

ارائه‌دهنده موسیقی OpenRouter همراه، به‌صورت پیش‌فرض از
`google/lyria-3-pro-preview` استفاده می‌کند و همچنین
`google/lyria-3-clip-preview` را ارائه می‌دهد. OpenClaw `modalities: ["text",
"audio"]` را ارسال می‌کند، پخش جریانی را فعال می‌کند، قطعه‌های صوتی جریانی را جمع‌آوری می‌کند، و نتیجه را به‌عنوان رسانه تولیدشده برای تحویل کانالی ذخیره می‌کند. تصاویر مرجع برای مدل‌های Lyria از طریق پارامتر مشترک `music_generate image=...` پذیرفته می‌شوند.

## تبدیل متن به گفتار

OpenRouter همچنین می‌تواند از طریق نقطه پایانی سازگار با OpenAI خود، یعنی
`/audio/speech`، به‌عنوان ارائه‌دهنده TTS استفاده شود.

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

اگر `messages.tts.providers.openrouter.apiKey` حذف شود، TTS ابتدا از
`models.providers.openrouter.apiKey` و سپس از `OPENROUTER_API_KEY` دوباره استفاده می‌کند.

## گفتار به متن (صدای ورودی)

OpenRouter می‌تواند پیوست‌های صوتی/صدای ورودی را از طریق مسیر مشترک
`tools.media.audio` و با استفاده از نقطه پایانی STT خود (`/audio/transcriptions`) رونویسی کند.
این برای هر channel plugin که صدای/صوت ورودی را به پیش‌بررسی درک رسانه ارسال می‌کند اعمال می‌شود.

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

OpenClaw درخواست‌های STT OpenRouter را به‌صورت JSON همراه با صدای base64 زیر
`input_audio` (قرارداد STT OpenRouter) ارسال می‌کند، نه به‌صورت بارگذاری‌های فرم چندبخشی OpenAI.

## مسیریاب Fusion

وقتی می‌خواهید یک ارجاع مدل OpenClaw از چند مدل OpenRouter به‌صورت موازی پرس‌وجو کند، OpenRouter پاسخ‌های آن‌ها را داوری کند، و یک پاسخ نهایی واحد را از طریق نقطه پایانی عادی ارائه‌دهنده OpenRouter برگرداند، از OpenRouter Fusion استفاده کنید. چون slug مدل بالادستی `openrouter/fusion` است، ارجاع مدل OpenClaw هم پیشوند ارائه‌دهنده OpenClaw و هم فضای نام بالادستی OpenRouter را شامل می‌شود:

```bash
openclaw models set openrouter/openrouter/fusion
```

پنل و داور Fusion را از طریق `params.extraBody` مدل پیکربندی کنید. آن
فیلدها به بدنه درخواست تکمیل‌های گفت‌وگوی OpenRouter منتقل می‌شوند. Fusion
هم با راه‌اندازی اولیه OAuth OpenRouter و هم با راه‌اندازی اولیه کلید API کار می‌کند؛ اگر از
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

فهرست `analysis_models` پنل موازی است، و `model` داخل پیکربندی Plugin مربوط به Fusion مدل داور است. در گردش‌های عادی agent/chat در OpenClaw، برای وادار کردن Fusion مقدار سطح‌بالای `tool_choice` را روی
`"required"` تنظیم نکنید؛ گردش‌های OpenClaw ممکن است تعریف‌های ابزار OpenClaw را شامل شوند، و انتخاب ابزار الزامی در سطح بالا می‌تواند به‌جای مسیریاب Fusion یکی از آن ابزارها را الزامی کند. وقتی این پیکربندی Plugin مربوط به Fusion وجود داشته باشد، OpenClaw همچنین یک یادداشت پاک‌سازی‌شده برای درخواست سیستمی اضافه می‌کند که مدل‌های تحلیل و مدل داور پیکربندی‌شده را در خود دارد تا agent بتواند به پرسش‌ها درباره پنل Fusion فعلی خود پاسخ دهد. سایر فیلدهای `extraBody` در درخواست کپی نمی‌شوند.

Fusion از روی طراحی کندتر است. OpenRouter ممکن است همان درخواست OpenClaw را به چند مدل تحلیل ارسال کند و سپس یک مرحله نهایی داوری/ترکیب را اجرا کند، بنابراین تأخیر معمولا از یک درخواست مستقیم تک‌مدلی بیشتر است. از Fusion برای پاسخ‌های سنجیده و باکیفیت یا مسیرهای escalation استفاده کنید، نه به‌عنوان پیش‌فرض برای گفت‌وگوی حساس به تأخیر. برای پاسخ‌های سریع‌تر، پنل را کوچک نگه دارید و مدل‌های تحلیل و داور سریع‌تر انتخاب کنید.

ارجاع پیکربندی‌شده را با یک فراخوانی محلی یک‌مرحله‌ای مدل آزمایش کنید:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## احراز هویت و سرآیندها

OpenRouter در پشت صحنه از یک توکن Bearer همراه با کلید API شما استفاده می‌کند. OAuth مربوط به OpenRouter یک جریان ورود PKCE است که یک کلید API OpenRouter صادر می‌کند، بنابراین OpenClaw نتیجه را به‌عنوان همان پروفایل احراز هویت کلید API با نام `openrouter:default` ذخیره می‌کند که در مسیر راه‌اندازی دستی کلید API استفاده می‌شود.

برای یک نصب موجود، بدون اجرای دوباره راه‌اندازی کامل اولیه، وارد شوید یا کلید OpenRouter ذخیره‌شده را چرخش دهید:

```bash
openclaw models auth login --provider openrouter --method oauth
```

وقتی می‌خواهید کلیدی را که به‌صورت دستی در OpenRouter ساخته‌اید بچسبانید، از `openclaw models auth login --provider openrouter --method api-key` استفاده کنید.

در درخواست‌های واقعی OpenRouter (`https://openrouter.ai/api/v1`)، OpenClaw همچنین سرآیندهای مستندشده انتساب برنامه OpenRouter را اضافه می‌کند:

| سرآیند                    | مقدار                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
اگر ارائه‌دهنده OpenRouter را به یک پراکسی یا URL پایه دیگر هدایت کنید، OpenClaw
آن سرآیندهای خاص OpenRouter یا نشانگرهای کش Anthropic را تزریق **نمی‌کند**.
</Warning>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="کش کردن پاسخ">
    کش کردن پاسخ در OpenRouter اختیاری است. آن را برای هر مدل OpenRouter با
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

    OpenClaw مقدار `X-OpenRouter-Cache: true` و، در صورت پیکربندی،
    `X-OpenRouter-Cache-TTL` را ارسال می‌کند. `responseCacheClear: true` برای
    درخواست فعلی یک تازه‌سازی اجباری انجام می‌دهد و پاسخ جایگزین را ذخیره می‌کند. نام‌های مستعار snake_case
    (`response_cache`، `response_cache_ttl_seconds`، و
    `response_cache_clear`) نیز پذیرفته می‌شوند.

    این از کش کردن درخواست ارائه‌دهنده و نشانگرهای Anthropic مربوط به `cache_control` در OpenRouter جدا است. فقط روی مسیرهای تأییدشده
    `openrouter.ai` اعمال می‌شود، نه URLهای پایه پراکسی سفارشی.

  </Accordion>

  <Accordion title="نشانگرهای کش Anthropic">
    روی مسیرهای تأییدشده OpenRouter، ارجاع‌های مدل Anthropic نشانگرهای
    `cache_control` خاص Anthropic مربوط به OpenRouter را که OpenClaw برای
    استفاده مجدد بهتر از کش درخواست روی بلوک‌های درخواست system/developer به کار می‌برد، حفظ می‌کنند.
  </Accordion>

  <Accordion title="پیش‌پرکردن استدلال Anthropic">
    در مسیرهای تأییدشده OpenRouter، ارجاع‌های مدل Anthropic که استدلال برایشان فعال است،
    نوبت‌های پیش‌پرکرده انتهایی assistant را پیش از رسیدن درخواست به OpenRouter حذف می‌کنند،
    مطابق با الزام Anthropic که گفت‌وگوهای استدلالی باید با یک نوبت user
    پایان یابند.
  </Accordion>

  <Accordion title="تزریق تفکر / استدلال">
    در مسیرهای پشتیبانی‌شده غیر از `auto`، OpenClaw سطح تفکر انتخاب‌شده را به
    payloadهای استدلالی پروکسی OpenRouter نگاشت می‌کند. اشاره‌های مدل پشتیبانی‌نشده و
    `openrouter/auto` از آن تزریق استدلال عبور می‌کنند. Hunter Alpha همچنین
    استدلال پروکسی را برای ارجاع‌های مدل پیکربندی‌شده منسوخ رد می‌کند، چون OpenRouter ممکن است
    برای آن مسیر بازنشسته، متن پاسخ نهایی را در فیلدهای استدلال برگرداند.
  </Accordion>

  <Accordion title="بازپخش استدلال DeepSeek V4">
    در مسیرهای تأییدشده OpenRouter، `openrouter/deepseek/deepseek-v4-flash` و
    `openrouter/deepseek/deepseek-v4-pro` مقدار `reasoning_content` ازدست‌رفته را در
    نوبت‌های assistant بازپخش‌شده پر می‌کنند تا گفت‌وگوهای تفکر/ابزار شکل پیگیری الزامی
    DeepSeek V4 را حفظ کنند. OpenClaw مقدارهای `reasoning_effort` پشتیبانی‌شده توسط OpenRouter
    را برای این مسیرها ارسال می‌کند؛ `xhigh` بالاترین سطح اعلام‌شده است،
    و overrideهای منسوخ `max` به `xhigh` نگاشت می‌شوند.
  </Accordion>

  <Accordion title="شکل‌دهی درخواست فقط OpenAI">
    OpenRouter همچنان از مسیر سازگار با OpenAI به سبک پروکسی عبور می‌کند، بنابراین
    شکل‌دهی درخواست فقط مخصوص OpenAI مانند `serviceTier`، مقدار `store` در Responses،
    payloadهای سازگار با استدلال OpenAI، و اشاره‌های prompt-cache ارسال نمی‌شود.
  </Accordion>

  <Accordion title="مسیرهای مبتنی بر Gemini">
    ارجاع‌های OpenRouter مبتنی بر Gemini روی مسیر proxy-Gemini می‌مانند: OpenClaw
    پاک‌سازی امضای تفکر Gemini را در آنجا حفظ می‌کند، اما اعتبارسنجی بازپخش بومی Gemini
    یا بازنویسی‌های bootstrap را فعال نمی‌کند.
  </Accordion>

  <Accordion title="فراداده مسیریابی Provider">
    OpenRouter از یک شیء درخواست `provider` برای مسیریابی Provider زیربنایی
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

    OpenClaw آن شیء را به‌عنوان payload درخواست `provider`
    به OpenRouter ارسال می‌کند. از فیلدهای snake_case مستندشده OpenRouter استفاده کنید، از جمله `sort`،
    `only`، `ignore`، `order`، `allow_fallbacks`، `require_parameters`،
    `data_collection`، `quantizations`، `max_price`، `preferred_max_latency`،
    `preferred_min_throughput`، `zdr`، و `enforce_distillable_text`.

    params هر مدل همچنان شیء مسیریابی سراسری Provider را override می‌کنند:

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

    این فقط روی مسیرهای chat-completions OpenRouter اعمال می‌شود. مسیرهای مستقیم Anthropic،
    Google، OpenAI، یا Providerهای سفارشی، params مسیریابی OpenRouter را نادیده می‌گیرند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب Providerها، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی برای عامل‌ها، مدل‌ها، و Providerها.
  </Card>
</CardGroup>
