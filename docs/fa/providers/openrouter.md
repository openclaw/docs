---
read_when:
    - یک کلید API واحد برای بسیاری از LLMها می‌خواهید
    - می‌خواهید مدل‌ها را از طریق OpenRouter در OpenClaw اجرا کنید
    - می‌خواهید از OpenRouter برای تولید تصویر استفاده کنید
    - می‌خواهید از OpenRouter برای تولید ویدئو استفاده کنید
summary: از API یکپارچهٔ OpenRouter برای دسترسی به مدل‌های متعدد در OpenClaw استفاده کنید
title: OpenRouter
x-i18n:
    generated_at: "2026-05-10T20:04:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5016c522cb2239dadebbfe63459d0e00f43b3dc76aa49cd5b4acfd542b31be71
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter یک **API یکپارچه** ارائه می‌دهد که درخواست‌ها را پشت یک
نقطهٔ پایانی و کلید API واحد به مدل‌های زیادی مسیریابی می‌کند. با OpenAI سازگار است، بنابراین بیشتر SDKهای OpenAI با تغییر نشانی پایه کار می‌کنند.

## شروع به کار

<Steps>
  <Step title="Get your API key">
    یک کلید API در [openrouter.ai/keys](https://openrouter.ai/keys) بسازید.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Optional) Switch to a specific model">
    پیش‌فرض راه‌اندازی اولیه `openrouter/auto` است. بعداً یک مدل مشخص انتخاب کنید:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## نمونهٔ پیکربندی

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

نمونه‌های جایگزین همراه‌سازی‌شده:

| ارجاع مدل                         | نکات                        |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | مسیریابی خودکار OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 از طریق MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 از طریق MoonshotAI     |

## تولید تصویر

OpenRouter می‌تواند پشتیبان ابزار `image_generate` نیز باشد. از یک مدل تصویر OpenRouter زیر `agents.defaults.imageGenerationModel` استفاده کنید:

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

OpenClaw درخواست‌های تصویر را با `modalities: ["image", "text"]` به API تصویر تکمیل گفت‌وگوی OpenRouter می‌فرستد. مدل‌های تصویر Gemini راهنمایی‌های پشتیبانی‌شدهٔ `aspectRatio` و `resolution` را از طریق `image_config` متعلق به OpenRouter دریافت می‌کنند. برای مدل‌های تصویر کندتر OpenRouter از `agents.defaults.imageGenerationModel.timeoutMs` استفاده کنید؛ پارامتر `timeoutMs` در هر فراخوانی ابزار `image_generate` همچنان اولویت دارد.

## تولید ویدیو

OpenRouter می‌تواند از ابزار `video_generate` نیز از طریق API ناهمگام `/videos` خود پشتیبانی کند. از یک مدل ویدیوی OpenRouter زیر `agents.defaults.videoGenerationModel` استفاده کنید:

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

OpenClaw کارهای متن‌به‌ویدیو و تصویر‌به‌ویدیو را به OpenRouter ارسال می‌کند، `polling_url`
برگردانده‌شده را نظرسنجی می‌کند، و ویدیوی تکمیل‌شده را از
`unsigned_urls` متعلق به OpenRouter یا نقطهٔ پایانی مستندشدهٔ محتوای کار دانلود می‌کند.
تصاویر مرجع به‌طور پیش‌فرض به‌عنوان تصاویر فریم اول/آخر ارسال می‌شوند؛ تصاویر
برچسب‌خورده با `reference_image` به‌عنوان ارجاع‌های ورودی OpenRouter ارسال می‌شوند. پیش‌فرض
همراه‌سازی‌شدهٔ `google/veo-3.1-fast` مدت‌زمان‌های ۴/۶/۸ ثانیهٔ
پشتیبانی‌شدهٔ فعلی، وضوح‌های `720P`/`1080P`، و نسبت‌های تصویر
`16:9`/`9:16` را اعلام می‌کند. ویدیو‌به‌ویدیو برای OpenRouter ثبت نشده است، چون API بالادستی
تولید ویدیو در حال حاضر متن و ارجاع‌های تصویر را می‌پذیرد.

## متن به گفتار

OpenRouter می‌تواند از طریق نقطهٔ پایانی سازگار با OpenAI خود،
`/audio/speech`، به‌عنوان ارائه‌دهندهٔ TTS نیز استفاده شود.

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

## احراز هویت و سرآیندها

OpenRouter در پشت صحنه از یک توکن Bearer همراه با کلید API شما استفاده می‌کند.

در درخواست‌های واقعی OpenRouter (`https://openrouter.ai/api/v1`)، OpenClaw همچنین
سرآیندهای مستندشدهٔ انتساب برنامهٔ OpenRouter را اضافه می‌کند:

| سرآیند                    | مقدار                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
اگر ارائه‌دهندهٔ OpenRouter را به یک پروکسی یا نشانی پایهٔ دیگر هدایت کنید، OpenClaw
آن سرآیندهای اختصاصی OpenRouter یا نشانگرهای کش Anthropic را تزریق **نمی‌کند**.
</Warning>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Response caching">
    کش‌کردن پاسخ OpenRouter اختیاری است. آن را برای هر مدل OpenRouter با
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

    OpenClaw مقدار `X-OpenRouter-Cache: true` را می‌فرستد و، هنگام پیکربندی،
    `X-OpenRouter-Cache-TTL` را نیز ارسال می‌کند. `responseCacheClear: true` برای
    درخواست فعلی تازه‌سازی را اجباری می‌کند و پاسخ جایگزین را ذخیره می‌کند. نام‌های مستعار snake_case
    (`response_cache`، `response_cache_ttl_seconds`، و
    `response_cache_clear`) نیز پذیرفته می‌شوند.

    این مورد از کش‌کردن prompt ارائه‌دهنده و نشانگرهای Anthropic `cache_control`
    متعلق به OpenRouter جدا است. این فقط روی مسیرهای تأییدشدهٔ
    `openrouter.ai` اعمال می‌شود، نه نشانی‌های پایهٔ پروکسی سفارشی.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    در مسیرهای تأییدشدهٔ OpenRouter، ارجاع‌های مدل Anthropic نشانگرهای اختصاصی OpenRouter
    برای Anthropic `cache_control` را نگه می‌دارند که OpenClaw برای
    استفادهٔ دوبارهٔ بهتر از کش prompt در بلوک‌های prompt سیستم/توسعه‌دهنده به کار می‌برد.
  </Accordion>

  <Accordion title="Anthropic reasoning prefill">
    در مسیرهای تأییدشدهٔ OpenRouter، ارجاع‌های مدل Anthropic که استدلال برایشان فعال است،
    نوبت‌های انتهایی پیش‌پرکردن دستیار را پیش از رسیدن درخواست به OpenRouter حذف می‌کنند،
    تا با الزام Anthropic که گفت‌وگوهای استدلالی باید با نوبت کاربر
    پایان یابند، مطابقت داشته باشد.
  </Accordion>

  <Accordion title="Thinking / reasoning injection">
    در مسیرهای غیر `auto` پشتیبانی‌شده، OpenClaw سطح thinking انتخاب‌شده را به
    payloadهای استدلال پروکسی OpenRouter نگاشت می‌کند. راهنمایی‌های مدل پشتیبانی‌نشده و
    `openrouter/auto` از آن تزریق استدلال صرف‌نظر می‌کنند. Hunter Alpha نیز برای
    ارجاع‌های مدل پیکربندی‌شدهٔ قدیمی از استدلال پروکسی صرف‌نظر می‌کند، چون OpenRouter می‌توانست
    برای آن مسیر بازنشسته، متن پاسخ نهایی را در فیلدهای استدلال برگرداند.
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning replay">
    در مسیرهای تأییدشدهٔ OpenRouter، `openrouter/deepseek/deepseek-v4-flash` و
    `openrouter/deepseek/deepseek-v4-pro` مقدار `reasoning_content` ازدست‌رفته را در
    نوبت‌های بازپخش‌شدهٔ دستیار پر می‌کنند تا گفت‌وگوهای thinking/tool شکل پیگیری
    موردنیاز DeepSeek V4 را حفظ کنند. OpenClaw مقادیر پشتیبانی‌شدهٔ OpenRouter برای
    `reasoning_effort` را برای این مسیرها ارسال می‌کند؛ `xhigh` بالاترین سطح اعلام‌شده است،
    و بازنویسی‌های قدیمی `max` به `xhigh` نگاشت می‌شوند.
  </Accordion>

  <Accordion title="OpenAI-only request shaping">
    OpenRouter همچنان از مسیر پروکسی‌مانند سازگار با OpenAI عبور می‌کند، بنابراین
    شکل‌دهی درخواست مختص OpenAI بومی مانند `serviceTier`، `store` متعلق به Responses،
    payloadهای سازگاری استدلال OpenAI، و راهنمایی‌های کش prompt ارسال نمی‌شوند.
  </Accordion>

  <Accordion title="Gemini-backed routes">
    ارجاع‌های OpenRouter با پشتیبانی Gemini روی مسیر پروکسی-Gemini باقی می‌مانند: OpenClaw
    پاک‌سازی امضای thought متعلق به Gemini را در آنجا نگه می‌دارد، اما اعتبارسنجی بازپخش Gemini
    بومی یا بازنویسی‌های bootstrap را فعال نمی‌کند.
  </Accordion>

  <Accordion title="Provider routing metadata">
    اگر مسیریابی ارائه‌دهندهٔ OpenRouter را زیر پارامترهای مدل ارسال کنید، OpenClaw آن را
    پیش از اجرای پوشش‌دهنده‌های stream مشترک به‌عنوان فرادادهٔ مسیریابی OpenRouter ارسال می‌کند.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="Configuration reference" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی برای عامل‌ها، مدل‌ها، و ارائه‌دهندگان.
  </Card>
</CardGroup>
