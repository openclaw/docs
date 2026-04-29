---
read_when:
    - می‌خواهید از Groq با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API یا گزینهٔ احراز هویت CLI نیاز دارید
summary: راه‌اندازی Groq (احراز هویت + انتخاب مدل)
title: Groq
x-i18n:
    generated_at: "2026-04-29T23:25:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed612471939e7ac5362f8236f179d38ae07f9076709ff55020c1790f7c56a6fa
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) استنتاج فوق‌سریع روی مدل‌های متن‌باز
(Llama، Gemma، Mistral و موارد دیگر) را با استفاده از سخت‌افزار سفارشی LPU ارائه می‌کند. OpenClaw از طریق API سازگار با OpenAI خود
به Groq متصل می‌شود.

| ویژگی | مقدار             |
| -------- | ----------------- |
| ارائه‌دهنده | `groq`            |
| احراز هویت     | `GROQ_API_KEY`    |
| API      | سازگار با OpenAI |

## شروع به کار

<Steps>
  <Step title="دریافت کلید API">
    یک کلید API در [console.groq.com/keys](https://console.groq.com/keys) ایجاد کنید.
  </Step>
  <Step title="تنظیم کلید API">
    ```bash
    export GROQ_API_KEY="gsk_..."
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

کاتالوگ مدل‌های Groq مرتب تغییر می‌کند. برای دیدن مدل‌های فعلاً در دسترس، `openclaw models list | grep groq`
را اجرا کنید، یا
[console.groq.com/docs/models](https://console.groq.com/docs/models) را بررسی کنید.

| مدل                       | یادداشت‌ها                              |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | عمومی، زمینه بزرگ     |
| **Llama 3.1 8B Instant**    | سریع، سبک                  |
| **Gemma 2 9B**              | فشرده، کارآمد                 |
| **Mixtral 8x7B**            | معماری MoE، استدلال قوی |

<Tip>
برای به‌روزترین فهرست مدل‌های موجود در حساب خود، از `openclaw models list --provider groq` استفاده کنید.
</Tip>

## مدل‌های استدلال

OpenClaw سطح‌های مشترک `/think` خود را به مقدارهای مختص مدل Groq برای
`reasoning_effort` نگاشت می‌کند. برای `qwen/qwen3-32b`، تفکر غیرفعال مقدار
`none` را ارسال می‌کند و تفکر فعال مقدار `default` را. برای مدل‌های استدلال Groq GPT-OSS،
OpenClaw مقدارهای `low`، `medium` یا `high` را ارسال می‌کند؛ تفکر غیرفعال
`reasoning_effort` را حذف می‌کند، چون این مدل‌ها از مقدار غیرفعال پشتیبانی نمی‌کنند.

## رونویسی صوتی

Groq همچنین رونویسی صوتی سریع مبتنی بر Whisper را ارائه می‌کند. وقتی به‌عنوان ارائه‌دهنده
درک رسانه پیکربندی شود، OpenClaw از مدل `whisper-large-v3-turbo` متعلق به Groq
برای رونویسی پیام‌های صوتی از طریق سطح مشترک `tools.media.audio`
استفاده می‌کند.

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
  <Accordion title="جزئیات رونویسی صوتی">
    | ویژگی | مقدار |
    |----------|-------|
    | مسیر پیکربندی مشترک | `tools.media.audio` |
    | URL پایه پیش‌فرض   | `https://api.groq.com/openai/v1` |
    | مدل پیش‌فرض      | `whisper-large-v3-turbo` |
    | نقطه پایانی API       | سازگار با OpenAI `/audio/transcriptions` |
  </Accordion>

  <Accordion title="یادداشت محیط">
    اگر Gateway به‌صورت daemon (launchd/systemd) اجرا می‌شود، مطمئن شوید `GROQ_API_KEY` برای آن فرایند
    در دسترس است (برای مثال، در `~/.openclaw/.env` یا از طریق
    `env.shellEnv`).

    <Warning>
    کلیدهایی که فقط در shell تعاملی شما تنظیم شده‌اند، برای فرایندهای gateway مدیریت‌شده توسط daemon
    قابل مشاهده نیستند. برای دسترس‌پذیری پایدار، از پیکربندی `~/.openclaw/.env` یا `env.shellEnv`
    استفاده کنید.
    </Warning>

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌واره کامل پیکربندی، شامل تنظیمات ارائه‌دهنده و صدا.
  </Card>
  <Card title="کنسول Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    داشبورد Groq، مستندات API و قیمت‌گذاری.
  </Card>
  <Card title="فهرست مدل‌های Groq" href="https://console.groq.com/docs/models" icon="list">
    کاتالوگ رسمی مدل‌های Groq.
  </Card>
</CardGroup>
