---
read_when:
    - شما یک کلید API واحد برای چندین مدل زبانی بزرگ می‌خواهید
    - می‌خواهید مدل‌ها را از طریق OpenRouter در OpenClaw اجرا کنید
    - می‌خواهید از OpenRouter برای تولید تصویر استفاده کنید
    - می‌خواهید از OpenRouter برای تولید ویدئو استفاده کنید
summary: از API یکپارچهٔ OpenRouter برای دسترسی به مدل‌های متعدد در OpenClaw استفاده کنید
title: OpenRouter
x-i18n:
    generated_at: "2026-04-29T23:27:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 47206ce7279eb8a38f71b5c40d34646ad01df2cac25860b629951f9cec73270f
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter یک **API یکپارچه** ارائه می‌کند که درخواست‌ها را به مدل‌های زیادی پشت یک
نقطهٔ پایانی و کلید API واحد هدایت می‌کند. این API با OpenAI سازگار است، بنابراین بیشتر SDKهای OpenAI با تغییر نشانی پایه کار می‌کنند.

## شروع به کار

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

OpenClaw درخواست‌های تصویر را با `modalities: ["image", "text"]` به API تصویر تکمیل‌های گفت‌وگوی OpenRouter می‌فرستد. مدل‌های تصویر Gemini راهنمایی‌های پشتیبانی‌شدهٔ `aspectRatio` و `resolution` را از طریق `image_config` در OpenRouter دریافت می‌کنند. برای مدل‌های تصویر کندتر OpenRouter از `agents.defaults.imageGenerationModel.timeoutMs` استفاده کنید؛ پارامتر `timeoutMs` در هر فراخوانی ابزار `image_generate` همچنان اولویت دارد.

## تولید ویدیو

OpenRouter می‌تواند از طریق API ناهمگام `/videos` خود پشتیبان ابزار `video_generate` نیز باشد. از یک مدل ویدیوی OpenRouter زیر `agents.defaults.videoGenerationModel` استفاده کنید:

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

OpenClaw کارهای متن‌به‌ویدیو و تصویر‌به‌ویدیو را به OpenRouter ارسال می‌کند، `polling_url` برگشتی را نظرسنجی می‌کند، و ویدیوی تکمیل‌شده را از `unsigned_urls` در OpenRouter یا نقطهٔ پایانی مستندشدهٔ محتوای کار دانلود می‌کند.
تصاویر مرجع به‌صورت پیش‌فرض به‌عنوان تصاویر قاب اول/آخر فرستاده می‌شوند؛ تصاویر
برچسب‌خورده با `reference_image` به‌عنوان ارجاع‌های ورودی OpenRouter ارسال می‌شوند. پیش‌فرض همراه `google/veo-3.1-fast` مدت‌زمان‌های ۴/۶/۸
ثانیه‌ای پشتیبانی‌شدهٔ فعلی، وضوح‌های `720P`/`1080P` و نسبت‌های تصویر `16:9`/`9:16` را اعلام می‌کند. ویدیو‌به‌ویدیو برای OpenRouter ثبت نشده است، چون API تولید ویدیوی بالادستی در حال حاضر متن و ارجاع‌های تصویر را می‌پذیرد.

## تبدیل متن به گفتار

OpenRouter می‌تواند از طریق نقطهٔ پایانی سازگار با OpenAI یعنی
`/audio/speech` به‌عنوان ارائه‌دهندهٔ TTS نیز استفاده شود.

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

اگر `messages.tts.providers.openrouter.apiKey` حذف شود، TTS ابتدا از
`models.providers.openrouter.apiKey` و سپس از `OPENROUTER_API_KEY` دوباره استفاده می‌کند.

## احراز هویت و سرآیندها

OpenRouter در پشت صحنه از توکن Bearer همراه با کلید API شما استفاده می‌کند.

در درخواست‌های واقعی OpenRouter (`https://openrouter.ai/api/v1`)، OpenClaw همچنین
سرآیندهای مستندشدهٔ انتساب برنامهٔ OpenRouter را اضافه می‌کند:

| سرآیند                    | مقدار                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
اگر ارائه‌دهندهٔ OpenRouter را به پراکسی یا نشانی پایهٔ دیگری هدایت کنید، OpenClaw
آن سرآیندهای ویژهٔ OpenRouter یا نشانگرهای کش Anthropic را تزریق **نمی‌کند**.
</Warning>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="نشانگرهای کش Anthropic">
    در مسیرهای تأییدشدهٔ OpenRouter، ارجاع‌های مدل Anthropic نشانگرهای
    `cache_control` ویژهٔ Anthropic در OpenRouter را حفظ می‌کنند که OpenClaw برای
    استفادهٔ دوبارهٔ بهتر از کش پرامپت در بلوک‌های پرامپت سیستم/توسعه‌دهنده به کار می‌برد.
  </Accordion>

  <Accordion title="تزریق تفکر / استدلال">
    در مسیرهای غیر `auto` پشتیبانی‌شده، OpenClaw سطح تفکر انتخاب‌شده را به
    محموله‌های استدلال پراکسی OpenRouter نگاشت می‌کند. راهنمایی‌های مدل پشتیبانی‌نشده و
    `openrouter/auto` آن تزریق استدلال را نادیده می‌گیرند. Hunter Alpha نیز
    برای ارجاع‌های مدل پیکربندی‌شدهٔ قدیمی، استدلال پراکسی را نادیده می‌گیرد، چون OpenRouter ممکن است
    برای آن مسیر بازنشسته، متن پاسخ نهایی را در فیلدهای استدلال برگرداند.
  </Accordion>

  <Accordion title="شکل‌دهی درخواست فقط مخصوص OpenAI">
    OpenRouter همچنان از مسیر سازگار با OpenAI به سبک پراکسی عبور می‌کند، بنابراین
    شکل‌دهی درخواست بومی و فقط مخصوص OpenAI مانند `serviceTier`، مقدار `store` در Responses،
    محموله‌های سازگاری استدلال OpenAI، و راهنمایی‌های کش پرامپت ارسال نمی‌شود.
  </Accordion>

  <Accordion title="مسیرهای پشتیبانی‌شده با Gemini">
    ارجاع‌های OpenRouter پشتیبانی‌شده با Gemini روی مسیر پراکسی-Gemini باقی می‌مانند: OpenClaw
    پاک‌سازی امضای تفکر Gemini را در آنجا حفظ می‌کند، اما اعتبارسنجی بازپخش بومی Gemini
    یا بازنویسی‌های راه‌اندازی را فعال نمی‌کند.
  </Accordion>

  <Accordion title="فرادادهٔ مسیریابی ارائه‌دهنده">
    اگر مسیریابی ارائه‌دهندهٔ OpenRouter را زیر پارامترهای مدل ارسال کنید، OpenClaw
    آن را پیش از اجرای پوشش‌دهنده‌های جریان مشترک، به‌عنوان فرادادهٔ مسیریابی OpenRouter ارسال می‌کند.
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
