---
read_when:
    - می‌خواهید از Groq با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API یا گزینه احراز هویت CLI نیاز دارید
    - شما در حال پیکربندی رونویسی صوتی Whisper در Groq هستید
summary: راه‌اندازی Groq (احراز هویت + انتخاب مدل + رونویسی با Whisper)
title: Groq
x-i18n:
    generated_at: "2026-07-12T10:41:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) با استفاده از سخت‌افزار سفارشی LPU، استنتاجی فوق‌سریع را روی مدل‌های دارای وزن‌های باز (Llama، Gemma، Kimi، Qwen، GPT OSS و مدل‌های دیگر) ارائه می‌دهد. Plugin مربوط به Groq هم یک ارائه‌دهندهٔ گفت‌وگوی سازگار با OpenAI و هم یک ارائه‌دهندهٔ درک رسانه‌ای صوتی را ثبت می‌کند.

| ویژگی                    | مقدار                                    |
| ------------------------ | ---------------------------------------- |
| شناسهٔ ارائه‌دهنده       | `groq`                                   |
| Plugin                   | بستهٔ خارجی رسمی                         |
| متغیر محیطی احراز هویت   | `GROQ_API_KEY`                           |
| API                      | سازگار با OpenAI (`openai-completions`) |
| نشانی پایه               | `https://api.groq.com/openai/v1`         |
| رونویسی صوتی             | `whisper-large-v3-turbo` (پیش‌فرض)       |
| پیش‌فرض پیشنهادی گفت‌وگو | `groq/llama-3.3-70b-versatile`           |

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را راه‌اندازی مجدد کنید:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## شروع به کار

<Steps>
  <Step title="دریافت کلید API">
    در [console.groq.com/keys](https://console.groq.com/keys) یک کلید API ایجاد کنید.
  </Step>
  <Step title="تنظیم کلید API">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="تنظیم مدل پیش‌فرض">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
  <Step title="بررسی دسترس‌پذیری فهرست مدل‌ها">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### نمونهٔ فایل پیکربندی

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## فهرست داخلی مدل‌ها

OpenClaw یک فهرست مدل Groq مبتنی بر مانیفست ارائه می‌کند که شامل ورودی‌های استدلالی و غیراستدلالی است. برای مشاهدهٔ ردیف‌های ثابت نسخهٔ نصب‌شدهٔ خود، `openclaw models list --provider groq` را اجرا کنید، یا برای مشاهدهٔ فهرست مرجع Groq به [console.groq.com/docs/models](https://console.groq.com/docs/models) مراجعه کنید.

| ارجاع مدل                                        | نام                     | استدلالی | ورودی      | زمینه  |
| ------------------------------------------------ | ----------------------- | -------- | ---------- | ------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | خیر      | متن        | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | خیر      | متن        | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | خیر      | متن + تصویر | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | بله      | متن        | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | بله      | متن        | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | بله      | متن        | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | بله      | متن        | 131,072 |
| `groq/groq/compound`                             | Compound                | بله      | متن        | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | بله      | متن        | 131,072 |

<Tip>
  این فهرست با هر انتشار OpenClaw تکامل می‌یابد. دستور `openclaw models list --provider groq` ردیف‌های شناخته‌شده برای نسخهٔ نصب‌شدهٔ شما را نشان می‌دهد؛ برای بررسی مدل‌های تازه‌افزوده‌شده یا منسوخ، آن را با [console.groq.com/docs/models](https://console.groq.com/docs/models) تطبیق دهید.
</Tip>

## مدل‌های استدلالی

مدل‌های استدلالی Groq (`reasoning: true` در جدول بالا) سطوح مشترک `/think` در OpenClaw را به مقادیر `low`، `medium` یا `high` برای `reasoning_effort` نگاشت می‌کنند. گزینهٔ `/think off` یا `/think none` به‌جای ارسال یک مقدار غیرفعال، `reasoning_effort` را از درخواست حذف می‌کند.

برای آشنایی با سطوح مشترک `/think` و نحوهٔ ترجمهٔ آن‌ها توسط OpenClaw برای هر ارائه‌دهنده، به [حالت‌های تفکر](/fa/tools/thinking) مراجعه کنید.

## رونویسی صوتی

Plugin مربوط به Groq همچنین یک **ارائه‌دهندهٔ درک رسانه‌ای صوتی** را ثبت می‌کند تا پیام‌های صوتی از طریق سطح مشترک `tools.media.audio` رونویسی شوند.

| ویژگی                    | مقدار                                     |
| ------------------------ | ----------------------------------------- |
| مسیر پیکربندی مشترک      | `tools.media.audio`                       |
| نشانی پایهٔ پیش‌فرض      | `https://api.groq.com/openai/v1`          |
| مدل پیش‌فرض              | `whisper-large-v3-turbo`                  |
| اولویت خودکار            | 20                                        |
| نقطهٔ پایانی API         | `/audio/transcriptions` سازگار با OpenAI |

برای قرار دادن Groq به‌عنوان پشتیبان صوتی پیش‌فرض:

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="دسترس‌پذیری محیط برای سرویس پس‌زمینه">
    اگر Gateway به‌صورت یک سرویس مدیریت‌شده (launchd، systemd یا Docker) اجرا می‌شود، `GROQ_API_KEY` باید برای همان فرایند قابل مشاهده باشد، نه فقط برای پوستهٔ تعاملی شما.

    <Warning>
      کلیدی که فقط در یک پوستهٔ تعاملی صادر شده باشد، برای سرویس پس‌زمینهٔ launchd یا systemd مفید نخواهد بود، مگر اینکه آن محیط نیز در آنجا وارد شود. کلید را در `~/.openclaw/.env` یا از طریق `env.shellEnv` تنظیم کنید تا فرایند Gateway بتواند آن را بخواند.
    </Warning>

  </Accordion>

  <Accordion title="شناسه‌های سفارشی مدل Groq">
    OpenClaw در زمان اجرا هر شناسهٔ مدل Groq را می‌پذیرد. از شناسهٔ دقیق نمایش‌داده‌شده توسط Groq استفاده کنید و پیشوند `groq/` را به آن بیفزایید. فهرست ثابت موارد متداول را پوشش می‌دهد؛ شناسه‌های فهرست‌نشده از الگوی پیش‌فرض سازگار با OpenAI استفاده می‌کنند.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/<your-model-id>" },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## مطالب مرتبط

<CardGroup cols={2}>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="حالت‌های تفکر" href="/fa/tools/thinking" icon="brain">
    سطوح تلاش استدلالی و تعامل با سیاست ارائه‌دهنده.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌وارهٔ کامل پیکربندی، شامل تنظیمات ارائه‌دهنده و صدا.
  </Card>
  <Card title="کنسول Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    داشبورد Groq، مستندات API و قیمت‌گذاری.
  </Card>
</CardGroup>
