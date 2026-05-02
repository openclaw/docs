---
read_when:
    - می‌خواهید برای بسیاری از LLMها یک کلید API داشته باشید
    - می‌خواهید مدل‌ها را از طریق OpenRouter در OpenClaw اجرا کنید
    - می‌خواهید برای تولید تصویر از OpenRouter استفاده کنید
    - می‌خواهید از OpenRouter برای تولید ویدئو استفاده کنید
summary: از API یکپارچهٔ OpenRouter برای دسترسی به مدل‌های متعدد در OpenClaw استفاده کنید
title: OpenRouter
x-i18n:
    generated_at: "2026-05-02T12:00:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: e98b8b540265b6d11681390c02cb68312f33625bf223823a2dbca17e877c0422
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter یک **API یکپارچه** فراهم می‌کند که درخواست‌ها را پشت یک نقطهٔ پایانی و کلید API واحد به مدل‌های بسیاری مسیریابی می‌کند. این API با OpenAI سازگار است، بنابراین بیشتر SDKهای OpenAI با تغییر URL پایه کار می‌کنند.

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
ارجاع‌های مدل از الگوی `openrouter/<provider>/<model>` پیروی می‌کنند. برای فهرست کامل ارائه‌دهندگان و مدل‌های موجود، [/concepts/model-providers](/fa/concepts/model-providers) را ببینید.
</Note>

نمونه‌های جایگزین بسته‌بندی‌شده:

| ارجاع مدل                         | یادداشت‌ها                        |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | مسیریابی خودکار OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 از طریق MoonshotAI     |

## تولید تصویر

OpenRouter همچنین می‌تواند پشتیبان ابزار `image_generate` باشد. از یک مدل تصویر OpenRouter در `agents.defaults.imageGenerationModel` استفاده کنید:

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

OpenClaw درخواست‌های تصویر را با `modalities: ["image", "text"]` به API تصویر تکمیل‌های گفت‌وگوی OpenRouter می‌فرستد. مدل‌های تصویر Gemini راهنمایی‌های پشتیبانی‌شدهٔ `aspectRatio` و `resolution` را از طریق `image_config` متعلق به OpenRouter دریافت می‌کنند. برای مدل‌های تصویر کندتر OpenRouter از `agents.defaults.imageGenerationModel.timeoutMs` استفاده کنید؛ پارامتر `timeoutMs` در هر فراخوانی ابزار `image_generate` همچنان اولویت دارد.

## تولید ویدیو

OpenRouter همچنین می‌تواند از طریق API ناهمگام `/videos` خود پشتیبان ابزار `video_generate` باشد. از یک مدل ویدیوی OpenRouter در `agents.defaults.videoGenerationModel` استفاده کنید:

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

OpenClaw کارهای متن‌به‌ویدیو و تصویر‌به‌ویدیو را به OpenRouter ارسال می‌کند، `polling_url` بازگردانده‌شده را پایش می‌کند، و ویدیوی تکمیل‌شده را از `unsigned_urls` متعلق به OpenRouter یا نقطهٔ پایانی مستندشدهٔ محتوای کار دانلود می‌کند. تصاویر مرجع به‌صورت پیش‌فرض به‌عنوان تصاویر فریم اول/آخر فرستاده می‌شوند؛ تصاویر برچسب‌خورده با `reference_image` به‌عنوان مرجع‌های ورودی OpenRouter ارسال می‌شوند. پیش‌فرض بسته‌بندی‌شدهٔ `google/veo-3.1-fast` مدت‌زمان‌های ۴/۶/۸ ثانیه، وضوح‌های `720P`/`1080P` و نسبت‌های تصویر `16:9`/`9:16` را که در حال حاضر پشتیبانی می‌شوند اعلام می‌کند. ویدیو‌به‌ویدیو برای OpenRouter ثبت نشده است، زیرا API تولید ویدیوی بالادستی در حال حاضر متن و مرجع‌های تصویر را می‌پذیرد.

## تبدیل متن به گفتار

OpenRouter همچنین می‌تواند از طریق نقطهٔ پایانی سازگار با OpenAI خود یعنی `/audio/speech` به‌عنوان ارائه‌دهندهٔ TTS استفاده شود.

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

## احراز هویت و سرآیندها

OpenRouter در پشت صحنه از یک توکن Bearer با کلید API شما استفاده می‌کند.

در درخواست‌های واقعی OpenRouter (`https://openrouter.ai/api/v1`)، OpenClaw سرآیندهای مستندشدهٔ نسبت‌دهی برنامهٔ OpenRouter را نیز اضافه می‌کند:

| سرآیند                    | مقدار                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
اگر ارائه‌دهندهٔ OpenRouter را به پروکسی یا URL پایهٔ دیگری هدایت کنید، OpenClaw آن سرآیندهای ویژهٔ OpenRouter یا نشانگرهای کش Anthropic را تزریق **نمی‌کند**.
</Warning>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="نشانگرهای کش Anthropic">
    در مسیرهای تأییدشدهٔ OpenRouter، ارجاع‌های مدل Anthropic نشانگرهای `cache_control` ویژهٔ Anthropic در OpenRouter را نگه می‌دارند که OpenClaw برای استفادهٔ دوبارهٔ بهتر از کش پرامپت در بلوک‌های پرامپت system/developer به کار می‌برد.
  </Accordion>

  <Accordion title="پیش‌پرکردن استدلال Anthropic">
    در مسیرهای تأییدشدهٔ OpenRouter، ارجاع‌های مدل Anthropic با استدلال فعال، نوبت‌های پیش‌پرکردن انتهایی assistant را پیش از رسیدن درخواست به OpenRouter حذف می‌کنند، مطابق با الزام Anthropic که گفت‌وگوهای استدلالی باید با یک نوبت user پایان یابند.
  </Accordion>

  <Accordion title="تزریق تفکر / استدلال">
    در مسیرهای پشتیبانی‌شدهٔ غیر `auto`، OpenClaw سطح تفکر انتخاب‌شده را به payloadهای استدلالی پروکسی OpenRouter نگاشت می‌کند. راهنمایی‌های مدل پشتیبانی‌نشده و `openrouter/auto` از آن تزریق استدلال صرف‌نظر می‌کنند. Hunter Alpha نیز برای ارجاع‌های مدل پیکربندی‌شدهٔ منسوخ از استدلال پروکسی صرف‌نظر می‌کند، زیرا OpenRouter می‌توانست برای آن مسیر بازنشسته متن پاسخ نهایی را در فیلدهای استدلال بازگرداند.
  </Accordion>

  <Accordion title="بازپخش استدلال DeepSeek V4">
    در مسیرهای تأییدشدهٔ OpenRouter، `openrouter/deepseek/deepseek-v4-flash` و `openrouter/deepseek/deepseek-v4-pro` در نوبت‌های assistant بازپخش‌شده، `reasoning_content` گم‌شده را پر می‌کنند تا گفت‌وگوهای تفکر/ابزار شکل پیگیری موردنیاز DeepSeek V4 را حفظ کنند.
  </Accordion>

  <Accordion title="شکل‌دهی درخواست فقط مخصوص OpenAI">
    OpenRouter همچنان از مسیر سازگار با OpenAI به سبک پروکسی عبور می‌کند، بنابراین شکل‌دهی بومی درخواست فقط مخصوص OpenAI مانند `serviceTier`، `store` در Responses، payloadهای سازگاری استدلال OpenAI و راهنمایی‌های کش پرامپت ارسال نمی‌شود.
  </Accordion>

  <Accordion title="مسیرهای پشتیبانی‌شده با Gemini">
    ارجاع‌های OpenRouter پشتیبانی‌شده با Gemini روی مسیر proxy-Gemini باقی می‌مانند: OpenClaw پاک‌سازی امضای فکر Gemini را در آنجا نگه می‌دارد، اما اعتبارسنجی بازپخش بومی Gemini یا بازنویسی‌های راه‌اندازی را فعال نمی‌کند.
  </Accordion>

  <Accordion title="فرادادهٔ مسیریابی ارائه‌دهنده">
    اگر مسیریابی ارائه‌دهندهٔ OpenRouter را زیر پارامترهای مدل ارسال کنید، OpenClaw آن را پیش از اجرای پوشش‌دهنده‌های جریان مشترک، به‌عنوان فرادادهٔ مسیریابی OpenRouter ارسال می‌کند.
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
