---
read_when:
    - می‌خواهید از Groq با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API یا انتخاب احراز هویت CLI نیاز دارید
    - در حال پیکربندی رونویسی صوتی Whisper روی Groq هستید
summary: راه‌اندازی Groq (احراز هویت + انتخاب مدل + رونویسی Whisper)
title: Groq
x-i18n:
    generated_at: "2026-06-27T18:40:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1133f2b1fa09e2e854b5762e189233597e86e8ccb2df8d619e891b4dc9c8d82
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) استنتاج فوق‌سریع را روی مدل‌های با وزن باز (Llama، Gemma، Kimi، Qwen، GPT OSS و موارد دیگر) با استفاده از سخت‌افزار LPU سفارشی فراهم می‌کند. Plugin مربوط به Groq هم یک ارائه‌دهنده گفت‌وگوی سازگار با OpenAI و هم یک ارائه‌دهنده درک رسانه صوتی را ثبت می‌کند.

| ویژگی                  | مقدار                                    |
| ---------------------- | ---------------------------------------- |
| شناسه ارائه‌دهنده      | `groq`                                   |
| Plugin                 | بسته رسمی خارجی                          |
| متغیر محیطی احراز هویت | `GROQ_API_KEY`                           |
| API                    | سازگار با OpenAI (`openai-completions`) |
| URL پایه               | `https://api.groq.com/openai/v1`         |
| رونویسی صوتی           | `whisper-large-v3-turbo` (پیش‌فرض)       |
| پیش‌فرض پیشنهادی گفت‌وگو | `groq/llama-3.3-70b-versatile`           |

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را دوباره راه‌اندازی کنید:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## شروع به کار

<Steps>
  <Step title="دریافت کلید API">
    یک کلید API در [console.groq.com/keys](https://console.groq.com/keys) ایجاد کنید.
  </Step>
  <Step title="تنظیم کلید API">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="تنظیم یک مدل پیش‌فرض">
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
  <Step title="بررسی دسترس‌پذیری کاتالوگ">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### نمونه فایل پیکربندی

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

## کاتالوگ داخلی

OpenClaw یک کاتالوگ Groq مبتنی بر مانیفست را همراه با ورودی‌های استدلالی و غیراستدلالی عرضه می‌کند. برای دیدن ردیف‌های ثابت نسخه نصب‌شده خود، `openclaw models list --provider groq` را اجرا کنید، یا برای فهرست مرجع Groq به [console.groq.com/docs/models](https://console.groq.com/docs/models) مراجعه کنید.

| مرجع مدل                                         | نام                     | استدلال | ورودی        | زمینه |
| ------------------------------------------------ | ----------------------- | ------- | ------------ | ----- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | نه      | متن          | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | نه      | متن          | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | نه      | متن + تصویر  | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | بله     | متن          | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | بله     | متن          | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | بله     | متن          | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | بله     | متن          | 131,072 |
| `groq/groq/compound`                             | Compound                | بله     | متن          | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | بله     | متن          | 131,072 |

<Tip>
  کاتالوگ با هر انتشار OpenClaw تکامل پیدا می‌کند. `openclaw models list --provider groq` ردیف‌هایی را نشان می‌دهد که برای نسخه نصب‌شده شما شناخته شده‌اند؛ برای مدل‌های تازه اضافه‌شده یا منسوخ‌شده، با [console.groq.com/docs/models](https://console.groq.com/docs/models) تطبیق دهید.
</Tip>

## مدل‌های استدلالی

OpenClaw سطح‌های مشترک `/think` خود را به مقدارهای اختصاصی مدل `reasoning_effort` در Groq نگاشت می‌کند:

- برای `qwen/qwen3-32b`، تفکر غیرفعال `none` را ارسال می‌کند و تفکر فعال `default` را ارسال می‌کند.
- برای مدل‌های استدلالی Groq GPT OSS (`openai/gpt-oss-*`)، OpenClaw بر اساس سطح `/think` مقدار `low`، `medium` یا `high` را ارسال می‌کند. تفکر غیرفعال `reasoning_effort` را حذف می‌کند، چون این مدل‌ها از مقدار غیرفعال پشتیبانی نمی‌کنند.
- DeepSeek R1 Distill، Qwen QwQ و Compound از سطح استدلال بومی Groq استفاده می‌کنند؛ `/think` میزان نمایش را کنترل می‌کند، اما مدل همیشه استدلال می‌کند.

برای سطح‌های مشترک `/think` و اینکه OpenClaw چگونه آن‌ها را برای هر ارائه‌دهنده ترجمه می‌کند، [حالت‌های تفکر](/fa/tools/thinking) را ببینید.

## رونویسی صوتی

Plugin مربوط به Groq همچنین یک **ارائه‌دهنده درک رسانه صوتی** را ثبت می‌کند تا پیام‌های صوتی بتوانند از طریق سطح مشترک `tools.media.audio` رونویسی شوند.

| ویژگی                 | مقدار                                     |
| --------------------- | ----------------------------------------- |
| مسیر پیکربندی مشترک   | `tools.media.audio`                       |
| URL پایه پیش‌فرض      | `https://api.groq.com/openai/v1`          |
| مدل پیش‌فرض           | `whisper-large-v3-turbo`                  |
| اولویت خودکار         | 20                                        |
| نقطه پایانی API       | سازگار با OpenAI `/audio/transcriptions` |

برای تبدیل Groq به بک‌اند صوتی پیش‌فرض:

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
  <Accordion title="دسترس‌پذیری محیط برای دیمن">
    اگر Gateway به‌صورت یک سرویس مدیریت‌شده اجرا می‌شود (launchd، systemd، Docker)، `GROQ_API_KEY` باید برای همان فرایند قابل مشاهده باشد — نه فقط برای پوسته تعاملی شما.

    <Warning>
      کلیدی که فقط در یک پوسته تعاملی export شده باشد، به دیمن launchd یا systemd کمکی نمی‌کند، مگر اینکه آن محیط هم در آنجا import شده باشد. برای خوانا شدن کلید از فرایند gateway، آن را در `~/.openclaw/.env` یا از طریق `env.shellEnv` تنظیم کنید.
    </Warning>

  </Accordion>

  <Accordion title="شناسه‌های سفارشی مدل Groq">
    OpenClaw هر شناسه مدل Groq را در زمان اجرا می‌پذیرد. از شناسه دقیقی که Groq نشان می‌دهد استفاده کنید و پیشوند `groq/` را به آن اضافه کنید. کاتالوگ ثابت موارد رایج را پوشش می‌دهد؛ شناسه‌های خارج از کاتالوگ به الگوی پیش‌فرض سازگار با OpenAI منتقل می‌شوند.

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

## مرتبط

<CardGroup cols={2}>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، مراجع مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="حالت‌های تفکر" href="/fa/tools/thinking" icon="brain">
    سطح‌های تلاش استدلال و تعامل با سیاست ارائه‌دهنده.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌واره کامل پیکربندی، شامل تنظیمات ارائه‌دهنده و صوت.
  </Card>
  <Card title="کنسول Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    داشبورد Groq، مستندات API و قیمت‌گذاری.
  </Card>
</CardGroup>
