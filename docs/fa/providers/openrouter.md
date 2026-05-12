---
read_when:
    - یک کلید API واحد برای چندین مدل زبانی بزرگ می‌خواهید
    - می‌خواهید مدل‌ها را از طریق OpenRouter در OpenClaw اجرا کنید
    - می‌خواهید از OpenRouter برای تولید تصویر استفاده کنید
    - می‌خواهید از OpenRouter برای تولید ویدیو استفاده کنید
summary: از API یکپارچهٔ OpenRouter برای دسترسی به مدل‌های متعدد در OpenClaw استفاده کنید
title: OpenRouter
x-i18n:
    generated_at: "2026-05-12T08:46:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dbf2b5a69636eb18471dd7d1dcf05ee30da931e2e3b5c9ae5d44a20d3e46f78
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter یک **API یکپارچه** فراهم می‌کند که درخواست‌ها را از طریق یک endpoint و کلید API واحد به مدل‌های زیادی هدایت می‌کند. این API با OpenAI سازگار است، بنابراین بیشتر SDKهای OpenAI با تغییر base URL کار می‌کنند.

## شروع کار

<Steps>
  <Step title="دریافت کلید API">
    یک کلید API در [openrouter.ai/keys](https://openrouter.ai/keys) بسازید.
  </Step>
  <Step title="اجرای راه‌اندازی اولیه">
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
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 از طریق MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 از طریق MoonshotAI     |

## تولید تصویر

OpenRouter می‌تواند پشتوانه ابزار `image_generate` نیز باشد. از یک مدل تصویر OpenRouter زیر `agents.defaults.imageGenerationModel` استفاده کنید:

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

OpenClaw درخواست‌های تصویر را با `modalities: ["image", "text"]` به API تصویر chat completions در OpenRouter ارسال می‌کند. مدل‌های تصویر Gemini اشاره‌های پشتیبانی‌شده `aspectRatio` و `resolution` را از طریق `image_config` در OpenRouter دریافت می‌کنند. برای مدل‌های تصویر کندتر OpenRouter از `agents.defaults.imageGenerationModel.timeoutMs` استفاده کنید؛ پارامتر `timeoutMs` هر فراخوانی در ابزار `image_generate` همچنان اولویت دارد.

## تولید ویدیو

OpenRouter می‌تواند از طریق API ناهمگام `/videos` خود پشتوانه ابزار `video_generate` نیز باشد. از یک مدل ویدیوی OpenRouter زیر `agents.defaults.videoGenerationModel` استفاده کنید:

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

OpenClaw کارهای متن‌به‌ویدیو و تصویر‌به‌ویدیو را به OpenRouter ارسال می‌کند، `polling_url` بازگردانده‌شده را polling می‌کند و ویدیوی کامل‌شده را از `unsigned_urls` در OpenRouter یا endpoint مستندشده محتوای کار دانلود می‌کند.
تصاویر مرجع به‌صورت پیش‌فرض به‌عنوان تصاویر فریم اول/آخر ارسال می‌شوند؛ تصاویر برچسب‌خورده با `reference_image` به‌عنوان ارجاع‌های ورودی OpenRouter ارسال می‌شوند. پیش‌فرض همراه `google/veo-3.1-fast` مدت‌زمان‌های 4/6/8 ثانیه‌ای پشتیبانی‌شده فعلی، وضوح‌های `720P`/`1080P` و نسبت‌های تصویر `16:9`/`9:16` را اعلام می‌کند. ویدیو‌به‌ویدیو برای OpenRouter ثبت نشده است، چون API بالادستی تولید ویدیو در حال حاضر متن و ارجاع‌های تصویر را می‌پذیرد.

## متن به گفتار

OpenRouter می‌تواند از طریق endpoint سازگار با OpenAI خود، یعنی `/audio/speech`، به‌عنوان ارائه‌دهنده TTS نیز استفاده شود.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

اگر `messages.tts.providers.openrouter.apiKey` حذف شود، TTS ابتدا از `models.providers.openrouter.apiKey` و سپس از `OPENROUTER_API_KEY` دوباره استفاده می‌کند.

## گفتار به متن (صدای ورودی)

OpenRouter می‌تواند پیوست‌های صوتی/voice ورودی را از طریق مسیر مشترک `tools.media.audio` و با استفاده از endpoint مربوط به STT خود (`/audio/transcriptions`) رونویسی کند.
این برای هر channel plugin که voice/audio ورودی را به پیش‌پرواز درک رسانه ارسال می‌کند اعمال می‌شود.

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

OpenClaw درخواست‌های STT برای OpenRouter را به‌صورت JSON با صدای base64 زیر `input_audio` ارسال می‌کند (قرارداد STT در OpenRouter)، نه به‌صورت بارگذاری فرم multipart مربوط به OpenAI.

## احراز هویت و headerها

OpenRouter در پشت صحنه از یک توکن Bearer با کلید API شما استفاده می‌کند.

در درخواست‌های واقعی OpenRouter (`https://openrouter.ai/api/v1`)، OpenClaw همچنین headerهای مستندشده انتساب برنامه در OpenRouter را اضافه می‌کند:

| Header                    | مقدار                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
اگر ارائه‌دهنده OpenRouter را به proxy یا base URL دیگری تغییر مسیر دهید، OpenClaw
آن headerهای اختصاصی OpenRouter یا نشانگرهای cache مربوط به Anthropic را تزریق **نمی‌کند**.
</Warning>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="کش‌کردن پاسخ">
    کش‌کردن پاسخ در OpenRouter اختیاری و نیازمند فعال‌سازی است. آن را برای هر مدل OpenRouter با
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
    (`response_cache`، `response_cache_ttl_seconds` و
    `response_cache_clear`) نیز پذیرفته می‌شوند.

    این مورد از کش‌کردن prompt در ارائه‌دهنده و از نشانگرهای Anthropic `cache_control` در OpenRouter
    جدا است. فقط روی مسیرهای تاییدشده `openrouter.ai` اعمال می‌شود، نه base URLهای proxy سفارشی.

  </Accordion>

  <Accordion title="نشانگرهای cache مربوط به Anthropic">
    در مسیرهای تاییدشده OpenRouter، ارجاع‌های مدل Anthropic نشانگرهای اختصاصی OpenRouter مربوط به Anthropic `cache_control` را که OpenClaw برای
    استفاده بهتر دوباره از prompt-cache در بلوک‌های prompt سیستم/توسعه‌دهنده استفاده می‌کند، نگه می‌دارند.
  </Accordion>

  <Accordion title="prefill استدلال Anthropic">
    در مسیرهای تاییدشده OpenRouter، ارجاع‌های مدل Anthropic که reasoning برای آن‌ها فعال است،
    turnهای پایانی prefill دستیار را پیش از رسیدن درخواست به OpenRouter حذف می‌کنند؛
    مطابق با الزام Anthropic که گفتگوهای reasoning باید با یک turn کاربر پایان یابند.
  </Accordion>

  <Accordion title="تزریق thinking / reasoning">
    در مسیرهای پشتیبانی‌شده غیر از `auto`، OpenClaw سطح thinking انتخاب‌شده را به
    payloadهای reasoning مربوط به proxy در OpenRouter نگاشت می‌کند. اشاره‌های مدل پشتیبانی‌نشده و
    `openrouter/auto` آن تزریق reasoning را رد می‌کنند. Hunter Alpha نیز برای ارجاع‌های مدل پیکربندی‌شده قدیمی،
    proxy reasoning را رد می‌کند، چون OpenRouter ممکن است برای آن مسیر بازنشسته
    متن پاسخ نهایی را در فیلدهای reasoning برگرداند.
  </Accordion>

  <Accordion title="بازپخش reasoning در DeepSeek V4">
    در مسیرهای تاییدشده OpenRouter، `openrouter/deepseek/deepseek-v4-flash` و
    `openrouter/deepseek/deepseek-v4-pro` مقدار گمشده `reasoning_content` را در
    turnهای بازپخش‌شده دستیار پر می‌کنند تا گفتگوهای thinking/tool شکل پیگیری لازم DeepSeek V4 را حفظ کنند.
    OpenClaw مقادیر پشتیبانی‌شده OpenRouter برای `reasoning_effort` را برای این مسیرها ارسال می‌کند؛
    `xhigh` بالاترین سطح اعلام‌شده است و overrideهای قدیمی `max` به `xhigh` نگاشت می‌شوند.
  </Accordion>

  <Accordion title="شکل‌دهی درخواست فقط مخصوص OpenAI">
    OpenRouter همچنان از مسیر سازگار با OpenAI به سبک proxy عبور می‌کند، بنابراین
    شکل‌دهی درخواست فقط مخصوص OpenAI مانند `serviceTier`، مقدار `store` در Responses،
    payloadهای سازگار با reasoning در OpenAI و اشاره‌های prompt-cache ارسال نمی‌شوند.
  </Accordion>

  <Accordion title="مسیرهای متکی بر Gemini">
    ارجاع‌های OpenRouter متکی بر Gemini روی مسیر proxy-Gemini باقی می‌مانند: OpenClaw پاک‌سازی thought-signature مربوط به Gemini را در آنجا حفظ می‌کند، اما
    اعتبارسنجی بازپخش native Gemini یا بازنویسی‌های bootstrap را فعال نمی‌کند.
  </Accordion>

  <Accordion title="فراداده مسیریابی ارائه‌دهنده">
    اگر مسیریابی ارائه‌دهنده OpenRouter را زیر پارامترهای مدل ارسال کنید، OpenClaw آن را
    پیش از اجرای wrapperهای stream مشترک، به‌عنوان فراداده مسیریابی OpenRouter forward می‌کند.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی برای agentها، مدل‌ها و ارائه‌دهندگان.
  </Card>
</CardGroup>
