---
read_when:
    - می‌خواهید از مدل‌های Mistral در OpenClaw استفاده کنید
    - شما رونویسی بلادرنگ Voxtral را برای تماس صوتی می‌خواهید
    - به راه‌اندازی کلید API Mistral و ارجاع‌های مدل نیاز دارید
summary: از مدل‌های Mistral و رونویسی Voxtral با OpenClaw استفاده کنید
title: Mistral
x-i18n:
    generated_at: "2026-05-10T20:04:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94c4caa86d4a3eb873d8b6a1cc639edbad3dd7478f401e2ca53f704de095f829
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw شامل یک Plugin داخلی Mistral است که چهار قرارداد را ثبت می‌کند: تکمیل‌های چت، درک رسانه (رونویسی دسته‌ای Voxtral)، STT بلادرنگ برای Voice Call (Voxtral Realtime)، و embeddingهای حافظه (`mistral-embed`).

| ویژگی           | مقدار                                      |
| ---------------- | ------------------------------------------- |
| شناسه ارائه‌دهنده | `mistral`                                   |
| Plugin           | داخلی، `enabledByDefault: true`             |
| متغیر محیطی احراز هویت | `MISTRAL_API_KEY`                           |
| پرچم راه‌اندازی اولیه | `--auth-choice mistral-api-key`             |
| پرچم مستقیم CLI  | `--mistral-api-key <key>`                   |
| API              | سازگار با OpenAI (`openai-completions`)     |
| URL پایه         | `https://api.mistral.ai/v1`                 |
| مدل پیش‌فرض      | `mistral/mistral-large-latest`              |
| مدل embedding    | `mistral-embed`                             |
| دسته‌ای Voxtral  | `voxtral-mini-latest` (رونویسی صوت)         |
| بلادرنگ Voxtral  | `voxtral-mini-transcribe-realtime-2602`     |

## شروع به کار

<Steps>
  <Step title="کلید API خود را دریافت کنید">
    در [کنسول Mistral](https://console.mistral.ai/) یک کلید API بسازید.
  </Step>
  <Step title="راه‌اندازی اولیه را اجرا کنید">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    یا کلید را مستقیم ارسال کنید:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="یک مدل پیش‌فرض تنظیم کنید">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="بررسی کنید که مدل در دسترس است">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## کاتالوگ داخلی LLM

[Mistral Medium 3.5](https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04)
مدل Medium ترکیبی فعلی در کاتالوگ داخلی است: وزن‌های dense با 128B،
ورودی متن و تصویر، زمینه 256K، فراخوانی تابع، خروجی ساختاریافته، کدنویسی،
و استدلال قابل تنظیم از طریق Chat Completions API. وقتی مدل یکپارچه جدیدتر
agentic/کدنویسی Mistral را به‌جای مدل پیش‌فرض `mistral/mistral-large-latest`
می‌خواهید، از `mistral/mistral-medium-3-5` استفاده کنید.

OpenClaw در حال حاضر این کاتالوگ داخلی Mistral را ارائه می‌کند:

| ارجاع مدل                         | ورودی       | زمینه   | حداکثر خروجی | یادداشت‌ها                                                       |
| -------------------------------- | ----------- | ------- | ------------ | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | متن، تصویر  | 262,144 | 16,384       | مدل پیش‌فرض                                                      |
| `mistral/mistral-medium-2508`    | متن، تصویر  | 262,144 | 8,192        | Mistral Medium 3.1                                               |
| `mistral/mistral-medium-3-5`     | متن، تصویر  | 262,144 | 8,192        | Mistral Medium 3.5؛ استدلال قابل تنظیم                           |
| `mistral/mistral-small-latest`   | متن، تصویر  | 128,000 | 16,384       | Mistral Small 4؛ استدلال قابل تنظیم از طریق API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | متن، تصویر  | 128,000 | 32,768       | Pixtral                                                          |
| `mistral/codestral-latest`       | متن         | 256,000 | 4,096        | کدنویسی                                                          |
| `mistral/devstral-medium-latest` | متن         | 262,144 | 32,768       | Devstral 2                                                       |
| `mistral/magistral-small`        | متن         | 128,000 | 40,000       | دارای قابلیت استدلال                                             |

پس از راه‌اندازی اولیه، Medium 3.5 را بدون راه‌اندازی Gateway با یک smoke test بررسی کنید:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

برای مرور ردیف کاتالوگ داخلی پیش از تغییر پیکربندی:

```bash
openclaw models list --all --provider mistral --plain
```

## رونویسی صوت (Voxtral)

برای رونویسی دسته‌ای صوت از طریق pipeline درک رسانه، از Voxtral استفاده کنید.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
مسیر رونویسی رسانه از `/v1/audio/transcriptions` استفاده می‌کند. مدل صوتی پیش‌فرض برای Mistral برابر `voxtral-mini-latest` است.
</Tip>

## STT جریانی Voice Call

Plugin داخلی `mistral`، Voxtral Realtime را به‌عنوان ارائه‌دهنده STT جریانی
برای Voice Call ثبت می‌کند.

| تنظیم          | مسیر پیکربندی                                                         | پیش‌فرض                                |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| کلید API      | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | به `MISTRAL_API_KEY` بازمی‌گردد         |
| مدل           | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| کدگذاری       | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| نرخ نمونه‌برداری | `...mistral.sampleRate`                                                | `8000`                                  |
| تاخیر هدف     | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
OpenClaw به‌طور پیش‌فرض STT بلادرنگ Mistral را روی `pcm_mulaw` با 8 kHz تنظیم می‌کند تا Voice Call
بتواند فریم‌های رسانه Twilio را مستقیم ارسال کند. فقط اگر جریان بالادستی شما از قبل PCM خام است، از
`encoding: "pcm_s16le"` و یک `sampleRate` متناظر استفاده کنید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="استدلال قابل تنظیم">
    `mistral/mistral-small-latest` (Mistral Small 4) و `mistral/mistral-medium-3-5` از [استدلال قابل تنظیم](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) در Chat Completions API از طریق `reasoning_effort` پشتیبانی می‌کنند (`none` تفکر اضافی در خروجی را به حداقل می‌رساند؛ `high` ردپاهای کامل تفکر را پیش از پاسخ نهایی نمایش می‌دهد). Mistral برای موارد استفاده agentic و کدنویسی در Medium 3.5، مقدار `reasoning_effort="high"` را توصیه می‌کند.

    OpenClaw سطح **thinking** نشست را به API Mistral نگاشت می‌کند:

    | سطح thinking در OpenClaw                          | `reasoning_effort` در Mistral |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Warning>
    حالت استدلال Medium 3.5 را با `temperature: 0` ترکیب نکنید. API
    HTTP مربوط به Mistral، ترکیب `reasoning_effort="high"` با `temperature: 0` را با پاسخ 400
    رد می‌کند. temperature را تنظیم‌نشده بگذارید تا Mistral از پیش‌فرض خود استفاده کند، یا از
    [تنظیمات پیشنهادی Medium 3.5](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B)
    پیروی کنید و برای استدلال بالا از `temperature: 0.7` استفاده کنید. برای پاسخ‌های مستقیم
    قطعی، thinking را خاموش/حداقلی کنید تا OpenClaw پیش از کاهش temperature،
    `reasoning_effort: "none"` را ارسال کند.
    </Warning>

    نمونه پیکربندی محدود به مدل برای استدلال Medium 3.5:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    مدل‌های دیگر کاتالوگ داخلی Mistral از این پارامتر استفاده نمی‌کنند. وقتی رفتار بومی reasoning-first در Mistral را می‌خواهید، همچنان از مدل‌های `magistral-*` استفاده کنید.
    </Note>

  </Accordion>

  <Accordion title="Embeddingهای حافظه">
    Mistral می‌تواند embeddingهای حافظه را از طریق `/v1/embeddings` ارائه کند (مدل پیش‌فرض: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="احراز هویت و URL پایه">
    - احراز هویت Mistral از `MISTRAL_API_KEY` استفاده می‌کند (سرآیند Bearer).
    - URL پایه ارائه‌دهنده به‌طور پیش‌فرض `https://api.mistral.ai/v1` است و شکل استاندارد درخواست chat-completions سازگار با OpenAI را می‌پذیرد.
    - مدل پیش‌فرض راه‌اندازی اولیه `mistral/mistral-large-latest` است.
    - URL پایه را فقط زمانی در `models.providers.mistral.baseUrl` بازنویسی کنید که Mistral به‌صراحت یک endpoint منطقه‌ای موردنیاز شما را منتشر کرده باشد.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="درک رسانه" href="/fa/nodes/media-understanding" icon="microphone">
    راه‌اندازی رونویسی صوت و انتخاب ارائه‌دهنده.
  </Card>
</CardGroup>
