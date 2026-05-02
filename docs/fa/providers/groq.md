---
read_when:
    - می‌خواهید از Groq با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API یا گزینهٔ احراز هویت CLI نیاز دارید
summary: راه‌اندازی Groq (احراز هویت + انتخاب مدل)
title: Groq
x-i18n:
    generated_at: "2026-05-02T11:59:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf6678047581a438906420894b250bafb68d71254fbaf30ea5dfcfc4799eac7
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) استنتاج بسیار سریع را روی مدل‌های متن‌باز
(Llama، Gemma، Mistral، و موارد دیگر) با استفاده از سخت‌افزار سفارشی LPU ارائه می‌دهد. OpenClaw از طریق API سازگار با OpenAI به Groq متصل می‌شود.

| ویژگی | مقدار             |
| -------- | ----------------- |
| ارائه‌دهنده | `groq`            |
| احراز هویت     | `GROQ_API_KEY`    |
| API      | سازگار با OpenAI |

## شروع به کار

<Steps>
  <Step title="دریافت یک کلید API">
    یک کلید API در [console.groq.com/keys](https://console.groq.com/keys) بسازید.
  </Step>
  <Step title="تنظیم کلید API">
    ```bash
    export GROQ_API_KEY="gsk_..."
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

OpenClaw یک کاتالوگ Groq مبتنی بر manifest برای فهرست‌کردن سریع مدل‌ها با فیلتر ارائه‌دهنده عرضه می‌کند. برای دیدن ردیف‌های همراه‌شده، `openclaw models list --all --provider groq` را اجرا کنید، یا
[console.groq.com/docs/models](https://console.groq.com/docs/models) را بررسی کنید.

| مدل                       | یادداشت‌ها                              |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | همه‌منظوره، زمینه بزرگ     |
| **Llama 3.1 8B Instant**    | سریع، سبک                  |
| **Gemma 2 9B**              | فشرده، کارآمد                 |
| **Mixtral 8x7B**            | معماری MoE، استدلال قوی |

<Tip>
برای ردیف‌های Groq مبتنی بر manifest که برای این نسخه OpenClaw شناخته شده‌اند، از `openclaw models list --all --provider groq` استفاده کنید.
</Tip>

## مدل‌های استدلال

OpenClaw سطح‌های مشترک `/think` خود را به مقادیر `reasoning_effort` مخصوص مدل در Groq نگاشت می‌کند. برای `qwen/qwen3-32b`، تفکر غیرفعال `none` و تفکر فعال `default` ارسال می‌کند. برای مدل‌های استدلال Groq GPT-OSS، OpenClaw مقادیر `low`، `medium`، یا `high` را ارسال می‌کند؛ تفکر غیرفعال `reasoning_effort` را حذف می‌کند، زیرا آن مدل‌ها از مقدار غیرفعال پشتیبانی نمی‌کنند.

## رونویسی صوتی

Groq همچنین رونویسی صوتی سریع مبتنی بر Whisper را ارائه می‌دهد. وقتی به‌عنوان ارائه‌دهنده درک رسانه پیکربندی شود، OpenClaw از مدل `whisper-large-v3-turbo` مربوط به Groq برای رونویسی پیام‌های صوتی از طریق سطح مشترک `tools.media.audio` استفاده می‌کند.

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

  <Accordion title="نکته محیطی">
    اگر Gateway به‌صورت daemon (launchd/systemd) اجرا می‌شود، مطمئن شوید `GROQ_API_KEY` برای آن فرایند در دسترس است (برای مثال، در `~/.openclaw/.env` یا از طریق `env.shellEnv`).

    <Warning>
    کلیدهایی که فقط در shell تعاملی شما تنظیم شده‌اند برای فرایندهای gateway مدیریت‌شده توسط daemon قابل مشاهده نیستند. برای دسترسی پایدار، از پیکربندی `~/.openclaw/.env` یا `env.shellEnv` استفاده کنید.
    </Warning>

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌واره کامل پیکربندی شامل تنظیمات ارائه‌دهنده و صوت.
  </Card>
  <Card title="کنسول Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    داشبورد Groq، مستندات API، و قیمت‌گذاری.
  </Card>
  <Card title="فهرست مدل‌های Groq" href="https://console.groq.com/docs/models" icon="list">
    کاتالوگ رسمی مدل‌های Groq.
  </Card>
</CardGroup>
