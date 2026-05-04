---
read_when:
    - شما یک کلید API واحد برای چندین مدل زبانی بزرگ می‌خواهید
    - می‌خواهید مدل‌ها را از طریق OpenRouter در OpenClaw اجرا کنید
    - می‌خواهید از OpenRouter برای تولید تصویر استفاده کنید
    - می‌خواهید از OpenRouter برای تولید ویدیو استفاده کنید
summary: از رابط برنامه‌نویسی یکپارچهٔ OpenRouter برای دسترسی به مدل‌های متعدد در OpenClaw استفاده کنید
title: OpenRouter
x-i18n:
    generated_at: "2026-05-04T02:27:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6b7299408aa0de7530e2248c7fa5dae8c09095e2d20a0e9d12a64cab83966fc
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter یک **API یکپارچه** ارائه می‌کند که درخواست‌ها را از پشت یک
endpoint و کلید API واحد به مدل‌های زیادی مسیریابی می‌کند. با OpenAI سازگار است، بنابراین بیشتر SDKهای OpenAI با تغییر URL پایه کار می‌کنند.

## شروع به کار

<Steps>
  <Step title="کلید API خود را بگیرید">
    یک کلید API در [openrouter.ai/keys](https://openrouter.ai/keys) بسازید.
  </Step>
  <Step title="onboarding را اجرا کنید">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(اختیاری) به یک مدل مشخص تغییر دهید">
    مقدار پیش‌فرض onboarding برابر `openrouter/auto` است. بعدا یک مدل مشخص انتخاب کنید:

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
providerها و مدل‌های در دسترس، [/concepts/model-providers](/fa/concepts/model-providers) را ببینید.
</Note>

نمونه‌های fallback همراه بسته:

| ارجاع مدل                         | یادداشت‌ها                        |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | مسیریابی خودکار OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 از طریق MoonshotAI     |

## تولید تصویر

OpenRouter همچنین می‌تواند پشتوانه ابزار `image_generate` باشد. از یک مدل تصویر OpenRouter زیر `agents.defaults.imageGenerationModel` استفاده کنید:

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

OpenClaw درخواست‌های تصویر را با `modalities: ["image", "text"]` به API تصویر تکمیل‌های گفت‌وگوی OpenRouter می‌فرستد. مدل‌های تصویر Gemini راهنمایی‌های پشتیبانی‌شده `aspectRatio` و `resolution` را از طریق `image_config` متعلق به OpenRouter دریافت می‌کنند. برای مدل‌های تصویر کندتر OpenRouter از `agents.defaults.imageGenerationModel.timeoutMs` استفاده کنید؛ پارامتر `timeoutMs` در هر فراخوانی ابزار `image_generate` همچنان اولویت دارد.

## تولید ویدیو

OpenRouter همچنین می‌تواند از طریق API ناهمگام `/videos` پشتوانه ابزار `video_generate` باشد. از یک مدل ویدیوی OpenRouter زیر `agents.defaults.videoGenerationModel` استفاده کنید:

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

OpenClaw کارهای تبدیل متن به ویدیو و تصویر به ویدیو را به OpenRouter ارسال می‌کند، `polling_url` برگشتی را polling می‌کند، و ویدیوی تکمیل‌شده را از
`unsigned_urls` متعلق به OpenRouter یا endpoint مستندشده محتوای کار دانلود می‌کند.
تصاویر مرجع به‌طور پیش‌فرض به‌عنوان تصاویر فریم اول/آخر فرستاده می‌شوند؛ تصاویر
برچسب‌خورده با `reference_image` به‌عنوان ارجاع‌های ورودی OpenRouter فرستاده می‌شوند. مقدار پیش‌فرض همراه بسته `google/veo-3.1-fast` مدت‌های 4/6/8
ثانیه‌ای، وضوح‌های `720P`/`1080P`، و نسبت‌های تصویر `16:9`/`9:16` را که در حال حاضر پشتیبانی می‌شوند اعلام می‌کند. تبدیل ویدیو به ویدیو برای OpenRouter ثبت نشده است، زیرا API بالادستی تولید ویدیو در حال حاضر متن و ارجاع‌های تصویر را می‌پذیرد.

## تبدیل متن به گفتار

OpenRouter همچنین می‌تواند از طریق endpoint سازگار با OpenAI یعنی
`/audio/speech` به‌عنوان provider TTS استفاده شود.

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

اگر `messages.tts.providers.openrouter.apiKey` حذف شود، TTS دوباره از
`models.providers.openrouter.apiKey` و سپس `OPENROUTER_API_KEY` استفاده می‌کند.

## احراز هویت و headerها

OpenRouter در پشت صحنه از یک توکن Bearer همراه با کلید API شما استفاده می‌کند.

در درخواست‌های واقعی OpenRouter (`https://openrouter.ai/api/v1`)، OpenClaw همچنین
headerهای مستندشده انتساب برنامه OpenRouter را اضافه می‌کند:

| Header                    | مقدار                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
اگر provider OpenRouter را به proxy یا URL پایه دیگری تغییر دهید، OpenClaw
آن headerهای ویژه OpenRouter یا نشانگرهای cache متعلق به Anthropic را تزریق **نمی‌کند**.
</Warning>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="cache کردن پاسخ">
    cache کردن پاسخ در OpenRouter اختیاری است. آن را برای هر مدل OpenRouter با
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

    OpenClaw مقدار `X-OpenRouter-Cache: true` را می‌فرستد و، وقتی پیکربندی شده باشد،
    `X-OpenRouter-Cache-TTL` را نیز ارسال می‌کند. `responseCacheClear: true` برای
    درخواست فعلی یک تازه‌سازی اجباری انجام می‌دهد و پاسخ جایگزین را ذخیره می‌کند. aliasهای snake_case
    (`response_cache`، `response_cache_ttl_seconds`، و
    `response_cache_clear`) نیز پذیرفته می‌شوند.

    این مورد از cache کردن prompt در provider و از نشانگرهای
    `cache_control` متعلق به Anthropic در OpenRouter جداست. فقط روی مسیرهای
    تاییدشده `openrouter.ai` اعمال می‌شود، نه URLهای پایه proxy سفارشی.

  </Accordion>

  <Accordion title="نشانگرهای cache متعلق به Anthropic">
    در مسیرهای تاییدشده OpenRouter، ارجاع‌های مدل Anthropic نشانگرهای
    ویژه OpenRouter یعنی `cache_control` متعلق به Anthropic را نگه می‌دارند که OpenClaw برای
    استفاده مجدد بهتر از cache prompt روی بلوک‌های prompt سیستم/توسعه‌دهنده استفاده می‌کند.
  </Accordion>

  <Accordion title="prefill استدلال Anthropic">
    در مسیرهای تاییدشده OpenRouter، ارجاع‌های مدل Anthropic با استدلال فعال،
    turnهای پایانی prefill دستیار را پیش از رسیدن درخواست به OpenRouter حذف می‌کنند،
    تا با الزام Anthropic که گفت‌وگوهای استدلال باید با یک turn کاربر پایان یابند هماهنگ باشد.
  </Accordion>

  <Accordion title="تزریق thinking / reasoning">
    در مسیرهای غیر `auto` پشتیبانی‌شده، OpenClaw سطح thinking انتخاب‌شده را به
    payloadهای استدلال proxy متعلق به OpenRouter نگاشت می‌کند. راهنمایی‌های مدل پشتیبانی‌نشده و
    `openrouter/auto` آن تزریق استدلال را رد می‌کنند. Hunter Alpha همچنین
    استدلال proxy را برای ارجاع‌های مدل پیکربندی‌شده قدیمی رد می‌کند، زیرا OpenRouter ممکن است
    برای آن مسیر بازنشسته، متن پاسخ نهایی را در فیلدهای استدلال برگرداند.
  </Accordion>

  <Accordion title="بازپخش استدلال DeepSeek V4">
    در مسیرهای تاییدشده OpenRouter، `openrouter/deepseek/deepseek-v4-flash` و
    `openrouter/deepseek/deepseek-v4-pro` مقدار `reasoning_content` گم‌شده را در
    turnهای بازپخش‌شده دستیار پر می‌کنند تا گفت‌وگوهای thinking/tool شکل پیگیری
    موردنیاز DeepSeek V4 را حفظ کنند.
  </Accordion>

  <Accordion title="شکل‌دهی درخواست فقط OpenAI">
    OpenRouter همچنان از مسیر سازگار با OpenAI به سبک proxy عبور می‌کند، بنابراین
    شکل‌دهی درخواست بومی و فقط OpenAI مانند `serviceTier`، `store` در Responses،
    payloadهای سازگار با استدلال OpenAI، و راهنمایی‌های cache prompt ارسال نمی‌شوند.
  </Accordion>

  <Accordion title="مسیرهای مبتنی بر Gemini">
    ارجاع‌های OpenRouter مبتنی بر Gemini روی مسیر proxy-Gemini باقی می‌مانند: OpenClaw پاک‌سازی
    thought-signature متعلق به Gemini را در آنجا حفظ می‌کند، اما اعتبارسنجی بازپخش بومی Gemini
    یا بازنویسی‌های bootstrap را فعال نمی‌کند.
  </Accordion>

  <Accordion title="فراداده مسیریابی provider">
    اگر مسیریابی provider متعلق به OpenRouter را زیر پارامترهای مدل پاس دهید، OpenClaw
    پیش از اجرای wrapperهای stream مشترک، آن را به‌عنوان فراداده مسیریابی OpenRouter ارسال می‌کند.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب providerها، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی برای agentها، مدل‌ها، و providerها.
  </Card>
</CardGroup>
