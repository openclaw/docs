---
read_when:
    - می‌خواهید از مدل‌های Mistral در OpenClaw استفاده کنید
    - شما رونویسی بی‌درنگ Voxtral را برای تماس صوتی می‌خواهید
    - به راه‌اندازی کلید API Mistral و مراجع مدل نیاز دارید
summary: استفاده از مدل‌های Mistral و رونویسی Voxtral با OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-06T09:39:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb55915526e292210df61b646e1bbcdb2da86a0e46ea4bd5afd63d244f8da71a
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw شامل یک Plugin بسته‌بندی‌شده‌ی Mistral است که چهار قرارداد را ثبت می‌کند: تکمیل‌های چت، درک رسانه (رونویسی دسته‌ای Voxtral)، STT بی‌درنگ برای تماس صوتی (Voxtral Realtime)، و embeddingهای حافظه (`mistral-embed`).

| ویژگی          | مقدار                                       |
| -------------- | ------------------------------------------- |
| شناسه‌ی ارائه‌دهنده | `mistral`                                   |
| Plugin         | بسته‌بندی‌شده، `enabledByDefault: true`     |
| متغیر env احراز هویت | `MISTRAL_API_KEY`                           |
| پرچم راه‌اندازی اولیه | `--auth-choice mistral-api-key`             |
| پرچم مستقیم CLI | `--mistral-api-key <key>`                   |
| API            | سازگار با OpenAI (`openai-completions`)     |
| URL پایه       | `https://api.mistral.ai/v1`                 |
| مدل پیش‌فرض    | `mistral/mistral-large-latest`              |
| مدل embedding  | `mistral-embed`                             |
| دسته‌ای Voxtral | `voxtral-mini-latest` (رونویسی صوتی)        |
| بی‌درنگ Voxtral | `voxtral-mini-transcribe-realtime-2602`     |

## شروع به کار

<Steps>
  <Step title="کلید API خود را دریافت کنید">
    یک کلید API در [کنسول Mistral](https://console.mistral.ai/) بسازید.
  </Step>
  <Step title="راه‌اندازی اولیه را اجرا کنید">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    یا کلید را مستقیم پاس دهید:

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
  <Step title="بررسی کنید مدل در دسترس است">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## کاتالوگ LLM داخلی

OpenClaw در حال حاضر این کاتالوگ بسته‌بندی‌شده‌ی Mistral را ارائه می‌کند:

| ارجاع مدل                        | ورودی       | زمینه | بیشینه خروجی | نکات                                                            |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | متن، تصویر | 262,144 | 16,384     | مدل پیش‌فرض                                                    |
| `mistral/mistral-medium-2508`    | متن، تصویر | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | متن، تصویر | 128,000 | 16,384     | Mistral Small 4؛ استدلال قابل تنظیم از طریق API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | متن، تصویر | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | متن        | 256,000 | 4,096      | کدنویسی                                                           |
| `mistral/devstral-medium-latest` | متن        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | متن        | 128,000 | 40,000     | با قابلیت استدلال                                                |

## رونویسی صوتی (Voxtral)

برای رونویسی دسته‌ای صوتی از طریق خط لوله‌ی درک رسانه، از Voxtral استفاده کنید.

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

## STT جریانی تماس صوتی

Plugin بسته‌بندی‌شده‌ی `mistral`، Voxtral Realtime را به‌عنوان ارائه‌دهنده‌ی STT
جریانی تماس صوتی ثبت می‌کند.

| تنظیمات      | مسیر پیکربندی                                                           | پیش‌فرض                                 |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| کلید API     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | به `MISTRAL_API_KEY` برمی‌گردد          |
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
OpenClaw مقدار پیش‌فرض STT بی‌درنگ Mistral را روی `pcm_mulaw` با 8 kHz قرار می‌دهد تا تماس صوتی
بتواند فریم‌های رسانه‌ی Twilio را مستقیم ارسال کند. تنها زمانی از `encoding: "pcm_s16le"` و
`sampleRate` متناظر استفاده کنید که جریان بالادستی شما از قبل PCM خام باشد.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="استدلال قابل تنظیم (mistral-small-latest)">
    `mistral/mistral-small-latest` به Mistral Small 4 نگاشت می‌شود و از [استدلال قابل تنظیم](https://docs.mistral.ai/capabilities/reasoning/adjustable) روی Chat Completions API از طریق `reasoning_effort` پشتیبانی می‌کند (`none` تفکر اضافی در خروجی را به حداقل می‌رساند؛ `high` ردگیری‌های کامل تفکر را پیش از پاسخ نهایی آشکار می‌کند).

    OpenClaw سطح **thinking** نشست را به API Mistral نگاشت می‌کند:

    | سطح thinking در OpenClaw                          | `reasoning_effort` در Mistral |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    دیگر مدل‌های کاتالوگ بسته‌بندی‌شده‌ی Mistral از این پارامتر استفاده نمی‌کنند. وقتی رفتار بومیِ مبتنی بر استدلال در Mistral را می‌خواهید، همچنان از مدل‌های `magistral-*` استفاده کنید.
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
    - احراز هویت Mistral از `MISTRAL_API_KEY` استفاده می‌کند (هدر Bearer).
    - URL پایه‌ی ارائه‌دهنده به‌صورت پیش‌فرض `https://api.mistral.ai/v1` است و شکل درخواست استاندارد تکمیل چتِ سازگار با OpenAI را می‌پذیرد.
    - مدل پیش‌فرض راه‌اندازی اولیه `mistral/mistral-large-latest` است.
    - URL پایه را زیر `models.providers.mistral.baseUrl` فقط زمانی بازنویسی کنید که Mistral به‌صورت صریح یک endpoint منطقه‌ای مورد نیاز شما را منتشر کرده باشد.

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
