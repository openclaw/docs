---
read_when:
    - می‌خواهید از مدل‌های Mistral در OpenClaw استفاده کنید
    - برای تماس صوتی، رونویسی بلادرنگ Voxtral می‌خواهید
    - به راه‌اندازی کلید API Mistral و ارجاع‌های مدل نیاز دارید
summary: از مدل‌های Mistral و رونویسی Voxtral با OpenClaw استفاده کنید
title: Mistral
x-i18n:
    generated_at: "2026-04-29T23:26:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fdba72a5a526bed78ef3a6ea633839634efca3f9d2e96b305315d534d115122
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw از Mistral هم برای مسیریابی مدل متن/تصویر (`mistral/...`) و هم برای
رونویسی صوتی از طریق Voxtral در درک رسانه پشتیبانی می‌کند.
Mistral همچنین می‌تواند برای تعبیه‌های حافظه (`memorySearch.provider = "mistral"`) استفاده شود.

- ارائه‌دهنده: `mistral`
- احراز هویت: `MISTRAL_API_KEY`
- API: تکمیل‌های گفت‌وگوی Mistral (`https://api.mistral.ai/v1`)

## شروع به کار

<Steps>
  <Step title="دریافت کلید API">
    یک کلید API در [کنسول Mistral](https://console.mistral.ai/) بسازید.
  </Step>
  <Step title="اجرای راه‌اندازی اولیه">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    یا کلید را مستقیماً ارسال کنید:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="تنظیم مدل پیش‌فرض">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="بررسی در دسترس بودن مدل">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## کاتالوگ داخلی LLM

OpenClaw در حال حاضر این کاتالوگ بسته‌بندی‌شده Mistral را ارائه می‌کند:

| ارجاع مدل                         | ورودی       | زمینه  | حداکثر خروجی | یادداشت‌ها                                                        |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | متن، تصویر | 262,144 | 16,384     | مدل پیش‌فرض                                                      |
| `mistral/mistral-medium-2508`    | متن، تصویر | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | متن، تصویر | 128,000 | 16,384     | Mistral Small 4؛ استدلال قابل تنظیم از طریق API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | متن، تصویر | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | متن        | 256,000 | 4,096      | کدنویسی                                                          |
| `mistral/devstral-medium-latest` | متن        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | متن        | 128,000 | 40,000     | دارای قابلیت استدلال                                             |

## رونویسی صوتی (Voxtral)

از Voxtral برای رونویسی صوتی دسته‌ای از طریق خط لوله درک رسانه استفاده کنید.

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
مسیر رونویسی رسانه از `/v1/audio/transcriptions` استفاده می‌کند. مدل صوتی پیش‌فرض برای Mistral برابر با `voxtral-mini-latest` است.
</Tip>

## STT جریانی Voice Call

Plugin بسته‌بندی‌شده `mistral`، Voxtral Realtime را به‌عنوان ارائه‌دهنده STT
جریانی Voice Call ثبت می‌کند.

| تنظیم        | مسیر پیکربندی                                                         | پیش‌فرض                                |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| کلید API     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | به `MISTRAL_API_KEY` بازمی‌گردد         |
| مدل          | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| کدگذاری      | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| نرخ نمونه‌برداری | `...mistral.sampleRate`                                                | `8000`                                  |
| تأخیر هدف    | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

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
OpenClaw به‌طور پیش‌فرض STT بی‌درنگ Mistral را روی `pcm_mulaw` با 8 kHz تنظیم می‌کند تا Voice Call
بتواند فریم‌های رسانه Twilio را مستقیماً ارسال کند. فقط زمانی از `encoding: "pcm_s16le"` و
`sampleRate` متناظر استفاده کنید که جریان بالادستی شما از قبل PCM خام باشد.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="استدلال قابل تنظیم (mistral-small-latest)">
    `mistral/mistral-small-latest` به Mistral Small 4 نگاشت می‌شود و از [استدلال قابل تنظیم](https://docs.mistral.ai/capabilities/reasoning/adjustable) در API تکمیل‌های گفت‌وگو از طریق `reasoning_effort` پشتیبانی می‌کند (`none` تفکر اضافی در خروجی را به حداقل می‌رساند؛ `high` ردپاهای کامل تفکر را پیش از پاسخ نهایی نمایش می‌دهد).

    OpenClaw سطح **تفکر** جلسه را به API Mistral نگاشت می‌کند:

    | سطح تفکر OpenClaw                                  | `reasoning_effort` در Mistral |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    دیگر مدل‌های کاتالوگ بسته‌بندی‌شده Mistral از این پارامتر استفاده نمی‌کنند. وقتی رفتار بومی Mistral با اولویت استدلال را می‌خواهید، همچنان از مدل‌های `magistral-*` استفاده کنید.
    </Note>

  </Accordion>

  <Accordion title="تعبیه‌های حافظه">
    Mistral می‌تواند تعبیه‌های حافظه را از طریق `/v1/embeddings` ارائه کند (مدل پیش‌فرض: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="احراز هویت و URL پایه">
    - احراز هویت Mistral از `MISTRAL_API_KEY` استفاده می‌کند.
    - URL پایه ارائه‌دهنده به‌طور پیش‌فرض `https://api.mistral.ai/v1` است.
    - مدل پیش‌فرض راه‌اندازی اولیه `mistral/mistral-large-latest` است.
    - Z.AI از احراز هویت Bearer با کلید API شما استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="درک رسانه" href="/fa/nodes/media-understanding" icon="microphone">
    راه‌اندازی رونویسی صوتی و انتخاب ارائه‌دهنده.
  </Card>
</CardGroup>
