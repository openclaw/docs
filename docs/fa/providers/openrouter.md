---
read_when:
    - شما یک کلید API واحد برای چندین مدل زبانی بزرگ می‌خواهید
    - می‌خواهید مدل‌ها را از طریق OpenRouter در OpenClaw اجرا کنید
    - می‌خواهید از OpenRouter برای تولید تصویر استفاده کنید
    - می‌خواهید از OpenRouter برای تولید ویدیو استفاده کنید
summary: از API یکپارچهٔ OpenRouter برای دسترسی به مدل‌های متعدد در OpenClaw استفاده کنید
title: OpenRouter
x-i18n:
    generated_at: "2026-05-05T01:51:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2876669c6fcc958ac13c19930cd23977b8ec27ae57069d9231932cc13c75244
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter یک **API یکپارچه** ارائه می‌کند که درخواست‌ها را به مدل‌های زیادی پشت یک
نقطهٔ پایانی و کلید API واحد مسیریابی می‌کند. با OpenAI سازگار است، بنابراین بیشتر SDKهای OpenAI با تغییر URL پایه کار می‌کنند.

## شروع به کار

<Steps>
  <Step title="دریافت کلید API">
    یک کلید API در [openrouter.ai/keys](https://openrouter.ai/keys) ایجاد کنید.
  </Step>
  <Step title="اجرای راه‌اندازی اولیه">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(اختیاری) جابه‌جایی به یک مدل مشخص">
    راه‌اندازی اولیه به‌صورت پیش‌فرض از `openrouter/auto` استفاده می‌کند. بعداً یک مدل مشخص انتخاب کنید:

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
ارائه‌دهندگان و مدل‌های در دسترس، [/concepts/model-providers](/fa/concepts/model-providers) را ببینید.
</Note>

نمونه‌های جایگزین همراه:

| ارجاع مدل                         | یادداشت‌ها                        |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | مسیریابی خودکار OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 از طریق MoonshotAI     |

## تولید تصویر

OpenRouter همچنین می‌تواند پشتوانهٔ ابزار `image_generate` باشد. از یک مدل تصویر OpenRouter زیر `agents.defaults.imageGenerationModel` استفاده کنید:

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

OpenClaw درخواست‌های تصویر را با `modalities: ["image", "text"]` به API تصویر تکمیل‌های گفت‌وگوی OpenRouter می‌فرستد. مدل‌های تصویر Gemini راهنمایی‌های پشتیبانی‌شدهٔ `aspectRatio` و `resolution` را از طریق `image_config` در OpenRouter دریافت می‌کنند. برای مدل‌های تصویر کندتر OpenRouter از `agents.defaults.imageGenerationModel.timeoutMs` استفاده کنید؛ پارامتر `timeoutMs` در هر فراخوانی ابزار `image_generate` همچنان اولویت دارد.

## تولید ویدیو

OpenRouter همچنین می‌تواند از طریق API ناهمگام `/videos` خود پشتوانهٔ ابزار `video_generate` باشد. از یک مدل ویدیوی OpenRouter زیر `agents.defaults.videoGenerationModel` استفاده کنید:

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
برگشتی را نظرسنجی می‌کند، و ویدیوی تکمیل‌شده را از `unsigned_urls` متعلق به OpenRouter
یا نقطهٔ پایانی مستندشدهٔ محتوای کار دانلود می‌کند. تصویرهای مرجع به‌صورت پیش‌فرض به‌عنوان
تصویرهای فریم اول/آخر فرستاده می‌شوند؛ تصویرهایی که با `reference_image` برچسب‌گذاری شده‌اند
به‌عنوان ارجاع‌های ورودی OpenRouter ارسال می‌شوند. پیش‌فرض همراه `google/veo-3.1-fast`
مدت‌های ۴/۶/۸ ثانیه‌ای، وضوح‌های `720P`/`1080P` و نسبت‌های تصویر `16:9`/`9:16`
را که در حال حاضر پشتیبانی می‌شوند اعلام می‌کند. ویدیو‌به‌ویدیو برای OpenRouter ثبت نشده است،
زیرا API بالادستی تولید ویدیو در حال حاضر متن و ارجاع‌های تصویری را می‌پذیرد.

## متن‌به‌گفتار

OpenRouter همچنین می‌تواند از طریق نقطهٔ پایانی سازگار با OpenAI یعنی
`/audio/speech` به‌عنوان ارائه‌دهندهٔ TTS استفاده شود.

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

OpenRouter در پشت‌صحنه از توکن Bearer همراه با کلید API شما استفاده می‌کند.

در درخواست‌های واقعی OpenRouter (`https://openrouter.ai/api/v1`)، OpenClaw همچنین
سرآیندهای مستندشدهٔ OpenRouter برای انتساب برنامه را اضافه می‌کند:

| سرآیند                    | مقدار                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
اگر ارائه‌دهندهٔ OpenRouter را به پراکسی یا URL پایهٔ دیگری اشاره دهید، OpenClaw
آن سرآیندهای ویژهٔ OpenRouter یا نشانگرهای کش Anthropic را تزریق **نمی‌کند**.
</Warning>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="کش‌کردن پاسخ">
    کش‌کردن پاسخ در OpenRouter اختیاری است. آن را برای هر مدل OpenRouter با
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
    `X-OpenRouter-Cache-TTL` را می‌فرستد. `responseCacheClear: true` برای
    درخواست فعلی بازخوانی را اجباری می‌کند و پاسخ جایگزین را ذخیره می‌کند. نام‌های مستعار snake_case
    (`response_cache`، `response_cache_ttl_seconds` و
    `response_cache_clear`) نیز پذیرفته می‌شوند.

    این مورد از کش‌کردن پرامپت ارائه‌دهنده و از نشانگرهای Anthropic
    `cache_control` در OpenRouter جدا است. فقط روی مسیرهای تأییدشدهٔ
    `openrouter.ai` اعمال می‌شود، نه URLهای پایهٔ پراکسی سفارشی.

  </Accordion>

  <Accordion title="نشانگرهای کش Anthropic">
    در مسیرهای تأییدشدهٔ OpenRouter، ارجاع‌های مدل Anthropic نشانگرهای ویژهٔ OpenRouter
    یعنی `cache_control` مربوط به Anthropic را نگه می‌دارند که OpenClaw برای
    استفادهٔ بهتر از کش پرامپت روی بلوک‌های پرامپت سیستم/توسعه‌دهنده به کار می‌برد.
  </Accordion>

  <Accordion title="پیش‌پرکردن استدلال Anthropic">
    در مسیرهای تأییدشدهٔ OpenRouter، ارجاع‌های مدل Anthropic که استدلال در آن‌ها فعال است
    نوبت‌های پیش‌پرشدهٔ انتهایی assistant را پیش از رسیدن درخواست به OpenRouter حذف می‌کنند،
    مطابق با الزام Anthropic که گفت‌وگوهای استدلالی باید با نوبت کاربر پایان یابند.
  </Accordion>

  <Accordion title="تزریق تفکر / استدلال">
    در مسیرهای پشتیبانی‌شدهٔ غیر `auto`، OpenClaw سطح تفکر انتخاب‌شده را به
    محموله‌های استدلال پراکسی OpenRouter نگاشت می‌کند. راهنمایی‌های مدل پشتیبانی‌نشده و
    `openrouter/auto` آن تزریق استدلال را رد می‌کنند. Hunter Alpha همچنین
    برای ارجاع‌های مدل پیکربندی‌شدهٔ قدیمی، استدلال پراکسی را رد می‌کند، زیرا OpenRouter ممکن است
    برای آن مسیر بازنشسته، متن پاسخ نهایی را در فیلدهای استدلال برگرداند.
  </Accordion>

  <Accordion title="بازپخش استدلال DeepSeek V4">
    در مسیرهای تأییدشدهٔ OpenRouter، `openrouter/deepseek/deepseek-v4-flash` و
    `openrouter/deepseek/deepseek-v4-pro` مقدارهای گمشدهٔ `reasoning_content` را در
    نوبت‌های assistant بازپخش‌شده پر می‌کنند تا گفت‌وگوهای تفکر/ابزار شکل پیگیری موردنیاز DeepSeek V4
    را حفظ کنند. OpenClaw مقدارهای پشتیبانی‌شدهٔ OpenRouter برای
    `reasoning_effort` را برای این مسیرها می‌فرستد؛ `xhigh` بالاترین سطح اعلام‌شده است
    و بازنویسی‌های قدیمی `max` به `xhigh` نگاشت می‌شوند.
  </Accordion>

  <Accordion title="شکل‌دهی درخواست فقط مخصوص OpenAI">
    OpenRouter همچنان از مسیر سازگار با OpenAI به سبک پراکسی عبور می‌کند، بنابراین
    شکل‌دهی درخواست بومی و فقط مخصوص OpenAI مانند `serviceTier`، مقدار `store` در Responses،
    محموله‌های سازگاری استدلال OpenAI و راهنمایی‌های کش پرامپت ارسال نمی‌شود.
  </Accordion>

  <Accordion title="مسیرهای پشتوانه‌دار با Gemini">
    ارجاع‌های OpenRouter که پشتوانهٔ Gemini دارند روی مسیر پراکسی-Gemini می‌مانند: OpenClaw
    پاک‌سازی امضای تفکر Gemini را در آنجا نگه می‌دارد، اما اعتبارسنجی بازپخش بومی Gemini
    یا بازنویسی‌های بوت‌استرپ را فعال نمی‌کند.
  </Accordion>

  <Accordion title="فرادادهٔ مسیریابی ارائه‌دهنده">
    اگر مسیریابی ارائه‌دهندهٔ OpenRouter را زیر پارامترهای مدل ارسال کنید، OpenClaw
    آن را پیش از اجرای wrapperهای جریان مشترک، به‌عنوان فرادادهٔ مسیریابی OpenRouter ارسال می‌کند.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی برای عامل‌ها، مدل‌ها، و ارائه‌دهندگان.
  </Card>
</CardGroup>
