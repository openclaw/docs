---
read_when:
    - می‌خواهید از Groq با OpenClaw استفاده کنید
    - شما به متغیر محیطی کلید API یا گزینه احراز هویت CLI نیاز دارید
    - در حال پیکربندی رونویسی صوتی Whisper روی Groq هستید
summary: راه‌اندازی Groq (احراز هویت + انتخاب مدل + رونویسی Whisper)
title: Groq
x-i18n:
    generated_at: "2026-05-06T09:38:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ce6d702eb1e0abba0cf1efd3e86c766444f5e7cbf26c312b94a74fa410b700
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) استنتاج فوق‌سریع را روی مدل‌های وزن‌باز (Llama، Gemma، Kimi، Qwen، GPT OSS و موارد بیشتر) با استفاده از سخت‌افزار سفارشی LPU فراهم می‌کند. OpenClaw شامل یک Plugin بسته‌بندی‌شده Groq است که هم یک ارائه‌دهنده چت سازگار با OpenAI و هم یک ارائه‌دهنده درک رسانه صوتی را ثبت می‌کند.

| ویژگی                 | مقدار                                    |
| ---------------------- | ---------------------------------------- |
| شناسه ارائه‌دهنده      | `groq`                                   |
| Plugin                 | بسته‌بندی‌شده، `enabledByDefault: true`        |
| متغیر محیطی احراز هویت | `GROQ_API_KEY`                           |
| پرچم راه‌اندازی اولیه  | `--auth-choice groq-api-key`             |
| API                    | سازگار با OpenAI (`openai-completions`) |
| نشانی پایه             | `https://api.groq.com/openai/v1`         |
| رونویسی صوتی           | `whisper-large-v3-turbo` (پیش‌فرض)       |
| پیش‌فرض پیشنهادی چت    | `groq/llama-3.3-70b-versatile`           |

## شروع به کار

<Steps>
  <Step title="دریافت کلید API">
    یک کلید API در [console.groq.com/keys](https://console.groq.com/keys) ایجاد کنید.
  </Step>
  <Step title="تنظیم کلید API">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice groq-api-key
```

```bash Env only
export GROQ_API_KEY=gsk_...
```

    </CodeGroup>

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
  <Step title="تأیید دسترسی‌پذیری کاتالوگ">
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

OpenClaw یک کاتالوگ Groq مبتنی بر manifest همراه دارد که شامل ورودی‌های استدلالی و غیر‌استدلالی است. برای دیدن ردیف‌های بسته‌بندی‌شده مربوط به نسخه نصب‌شده خود، `openclaw models list --provider groq` را اجرا کنید، یا برای فهرست مرجع Groq به [console.groq.com/docs/models](https://console.groq.com/docs/models) مراجعه کنید.

| ارجاع مدل                                             | نام                           | استدلالی | ورودی       | زمینه  |
| ---------------------------------------------------- | ----------------------------- | -------- | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                       | Llama 3.3 70B Versatile       | خیر      | متن          | 131,072 |
| `groq/llama-3.1-8b-instant`                          | Llama 3.1 8B Instant          | خیر      | متن          | 131,072 |
| `groq/meta-llama/llama-4-maverick-17b-128e-instruct` | Llama 4 Maverick 17B          | خیر      | متن + تصویر  | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct`     | Llama 4 Scout 17B             | خیر      | متن + تصویر  | 131,072 |
| `groq/llama3-70b-8192`                               | Llama 3 70B                   | خیر      | متن          | 8,192   |
| `groq/llama3-8b-8192`                                | Llama 3 8B                    | خیر      | متن          | 8,192   |
| `groq/gemma2-9b-it`                                  | Gemma 2 9B                    | خیر      | متن          | 8,192   |
| `groq/mistral-saba-24b`                              | Mistral Saba 24B              | خیر      | متن          | 32,768  |
| `groq/moonshotai/kimi-k2-instruct`                   | Kimi K2 Instruct              | خیر      | متن          | 131,072 |
| `groq/moonshotai/kimi-k2-instruct-0905`              | Kimi K2 Instruct 0905         | خیر      | متن          | 262,144 |
| `groq/openai/gpt-oss-120b`                           | GPT OSS 120B                  | بله      | متن          | 131,072 |
| `groq/openai/gpt-oss-20b`                            | GPT OSS 20B                   | بله      | متن          | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`                  | Safety GPT OSS 20B            | بله      | متن          | 131,072 |
| `groq/qwen-qwq-32b`                                  | Qwen QwQ 32B                  | بله      | متن          | 131,072 |
| `groq/qwen/qwen3-32b`                                | Qwen3 32B                     | بله      | متن          | 131,072 |
| `groq/deepseek-r1-distill-llama-70b`                 | DeepSeek R1 Distill Llama 70B | بله      | متن          | 131,072 |
| `groq/groq/compound`                                 | Compound                      | بله      | متن          | 131,072 |
| `groq/groq/compound-mini`                            | Compound Mini                 | بله      | متن          | 131,072 |

<Tip>
  کاتالوگ با هر انتشار OpenClaw تکامل می‌یابد. `openclaw models list --provider groq` ردیف‌های شناخته‌شده برای نسخه نصب‌شده شما را نشان می‌دهد؛ برای مدل‌های تازه‌افزوده‌شده یا منسوخ‌شده، با [console.groq.com/docs/models](https://console.groq.com/docs/models) تطبیق دهید.
</Tip>

## مدل‌های استدلالی

OpenClaw سطح‌های مشترک `/think` خود را به مقدارهای اختصاصی مدل Groq در `reasoning_effort` نگاشت می‌کند:

- برای `qwen/qwen3-32b`، فکر کردن غیرفعال مقدار `none` و فکر کردن فعال مقدار `default` را ارسال می‌کند.
- برای مدل‌های استدلالی Groq GPT OSS (`openai/gpt-oss-*`)، OpenClaw بر اساس سطح `/think` مقدار `low`، `medium` یا `high` را ارسال می‌کند. فکر کردن غیرفعال `reasoning_effort` را حذف می‌کند، چون این مدل‌ها از مقدار غیرفعال پشتیبانی نمی‌کنند.
- DeepSeek R1 Distill، Qwen QwQ و Compound از سطح استدلالی بومی Groq استفاده می‌کنند؛ `/think` نمایانی را کنترل می‌کند، اما مدل همیشه استدلال می‌کند.

برای سطح‌های مشترک `/think` و این‌که OpenClaw چگونه آن‌ها را برای هر ارائه‌دهنده ترجمه می‌کند، [حالت‌های فکر کردن](/fa/tools/thinking) را ببینید.

## رونویسی صوتی

Plugin بسته‌بندی‌شده Groq همچنین یک **ارائه‌دهنده درک رسانه صوتی** ثبت می‌کند تا پیام‌های صوتی بتوانند از طریق سطح مشترک `tools.media.audio` رونویسی شوند.

| ویژگی              | مقدار                                     |
| ------------------ | ----------------------------------------- |
| مسیر پیکربندی مشترک | `tools.media.audio`                       |
| نشانی پایه پیش‌فرض | `https://api.groq.com/openai/v1`          |
| مدل پیش‌فرض        | `whisper-large-v3-turbo`                  |
| اولویت خودکار      | 20                                        |
| نقطه پایانی API    | سازگار با OpenAI `/audio/transcriptions` |

برای قرار دادن Groq به‌عنوان بک‌اند صوتی پیش‌فرض:

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
  <Accordion title="دسترسی‌پذیری محیط برای daemon">
    اگر Gateway به‌عنوان یک سرویس مدیریت‌شده (launchd، systemd، Docker) اجرا شود، `GROQ_API_KEY` باید برای آن فرایند قابل مشاهده باشد، نه فقط برای پوسته تعاملی شما.

    <Warning>
      کلیدی که فقط در `~/.profile` قرار دارد، به daemon مربوط به launchd یا systemd کمکی نمی‌کند مگر این‌که آن محیط نیز در آن‌جا وارد شده باشد. کلید را در `~/.openclaw/.env` یا از طریق `env.shellEnv` تنظیم کنید تا از فرایند gateway قابل خواندن باشد.
    </Warning>

  </Accordion>

  <Accordion title="شناسه‌های سفارشی مدل Groq">
    OpenClaw هر شناسه مدل Groq را در زمان اجرا می‌پذیرد. از شناسه دقیق نمایش‌داده‌شده توسط Groq استفاده کنید و پیشوند `groq/` را به آن اضافه کنید. کاتالوگ بسته‌بندی‌شده موارد رایج را پوشش می‌دهد؛ شناسه‌های خارج از کاتالوگ به الگوی پیش‌فرض سازگار با OpenAI منتقل می‌شوند.

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
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار failover.
  </Card>
  <Card title="حالت‌های فکر کردن" href="/fa/tools/thinking" icon="brain">
    سطح‌های تلاش استدلالی و تعامل سیاست ارائه‌دهنده.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌واره کامل پیکربندی شامل تنظیمات ارائه‌دهنده و صدا.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    داشبورد Groq، مستندات API و قیمت‌گذاری.
  </Card>
</CardGroup>
