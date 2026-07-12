---
read_when:
    - می‌خواهید از مدل‌های Mistral در OpenClaw استفاده کنید
    - برای تماس صوتی، رونویسی بلادرنگ Voxtral را می‌خواهید
    - به راه‌اندازی کلید API Mistral و ارجاع‌های مدل نیاز دارید
summary: استفاده از مدل‌های Mistral و رونویسی Voxtral با OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-07-12T10:40:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58f27b9917d2e7144a64cad559de4fe26a5a1101703bbe21c04252717df801cd
    source_path: providers/mistral.md
    workflow: 16
---

Plugin همراه `mistral` چهار قرارداد را ثبت می‌کند: تکمیل‌های چت، درک رسانه (رونویسی دسته‌ای Voxtral)، تبدیل بلادرنگ گفتار به متن برای تماس صوتی (Voxtral Realtime)، و تعبیه‌های حافظه (`mistral-embed`).

| ویژگی                  | مقدار                                              |
| ---------------------- | -------------------------------------------------- |
| شناسه ارائه‌دهنده      | `mistral`                                          |
| Plugin                 | همراه، به‌طور پیش‌فرض فعال                         |
| متغیر محیطی احراز هویت | `MISTRAL_API_KEY`                                  |
| پرچم راه‌اندازی اولیه  | `--auth-choice mistral-api-key`                    |
| پرچم مستقیم CLI        | `--mistral-api-key <key>`                          |
| API                    | سازگار با OpenAI (`openai-completions`)            |
| نشانی پایه             | `https://api.mistral.ai/v1`                        |
| مدل پیش‌فرض            | `mistral/mistral-large-latest`                     |
| مدل تعبیه‌سازی         | `mistral-embed`                                    |
| پردازش دسته‌ای Voxtral | `voxtral-mini-latest` (رونویسی صوت)                |
| بلادرنگ Voxtral        | `voxtral-mini-transcribe-realtime-2602`            |

## شروع به کار

<Steps>
  <Step title="دریافت کلید API">
    یک کلید API در [کنسول Mistral](https://console.mistral.ai/) ایجاد کنید.
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

## کاتالوگ داخلی مدل‌های زبانی بزرگ

| ارجاع مدل                         | ورودی     | زمینه  | حداکثر خروجی | توضیحات                                                |
| --------------------------------- | --------- | ------- | -------------- | ------------------------------------------------------ |
| `mistral/mistral-large-latest`    | متن، تصویر | 262,144 | 16,384         | مدل پیش‌فرض                                            |
| `mistral/mistral-medium-2508`     | متن، تصویر | 262,144 | 8,192          | Mistral Medium 3.1                                     |
| `mistral/mistral-medium-3-5`      | متن، تصویر | 262,144 | 8,192          | Mistral Medium 3.5؛ استدلال قابل تنظیم                 |
| `mistral/mistral-small-latest`    | متن، تصویر | 262,144 | 16,384         | جدیدترین Mistral Small 4؛ `reasoning_effort` قابل تنظیم |
| `mistral/mistral-small-2603`      | متن، تصویر | 262,144 | 16,384         | نسخه ثابت Mistral Small 4؛ `reasoning_effort` قابل تنظیم |
| `mistral/pixtral-large-latest`    | متن، تصویر | 128,000 | 32,768         | Pixtral                                                |
| `mistral/codestral-latest`        | متن       | 256,000 | 4,096          | کدنویسی                                                |
| `mistral/devstral-medium-latest`  | متن       | 262,144 | 32,768         | Devstral 2                                             |
| `mistral/magistral-small`         | متن       | 128,000 | 40,000         | دارای قابلیت استدلال                                   |

پیش از تغییر پیکربندی، ردیف کاتالوگ همراه را مرور کنید:

```bash
openclaw models list --all --provider mistral --plain
```

بدون راه‌اندازی Gateway، یک آزمون سریع روی مدل اجرا کنید:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

## رونویسی صوت (Voxtral)

برای رونویسی دسته‌ای صوت از طریق خط لوله درک رسانه، از Voxtral استفاده کنید:

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
مسیر رونویسی رسانه از `/v1/audio/transcriptions` استفاده می‌کند. مدل صوتی پیش‌فرض Mistral برابر با `voxtral-mini-latest` است.
</Tip>

## تبدیل جریانی گفتار به متن برای تماس صوتی

Plugin همراه `mistral`، Voxtral Realtime را به‌عنوان ارائه‌دهنده تبدیل جریانی گفتار به متن برای تماس صوتی ثبت می‌کند.

| تنظیم       | مسیر پیکربندی                                                         | پیش‌فرض                                |
| ----------- | ---------------------------------------------------------------------- | -------------------------------------- |
| کلید API    | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | در صورت نبود، از `MISTRAL_API_KEY` استفاده می‌کند |
| مدل         | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| کدگذاری     | `...mistral.encoding`                                                  | `pcm_mulaw`                            |
| نرخ نمونه‌برداری | `...mistral.sampleRate`                                            | `8000`                                 |
| تأخیر هدف   | `...mistral.targetStreamingDelayMs`                                    | `800`                                  |

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
OpenClaw به‌طور پیش‌فرض تبدیل بلادرنگ گفتار به متن Mistral را روی `pcm_mulaw` با فرکانس ۸ کیلوهرتز تنظیم می‌کند تا تماس صوتی بتواند فریم‌های رسانه‌ای Twilio را مستقیماً ارسال کند. فقط زمانی از `encoding: "pcm_s16le"` و `sampleRate` متناظر استفاده کنید که جریان بالادستی شما از قبل PCM خام باشد.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="استدلال قابل تنظیم">
    مدل‌های `mistral/mistral-small-latest`، `mistral/mistral-small-2603` و `mistral/mistral-medium-3-5` از [استدلال قابل تنظیم](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) در API تکمیل‌های چت از طریق `reasoning_effort` پشتیبانی می‌کنند (`none` تفکر اضافه در خروجی را به حداقل می‌رساند؛ `high` رد کامل فرایند تفکر را پیش از پاسخ نهایی نمایش می‌دهد).

    OpenClaw سطح **تفکر** نشست را به API متعلق به Mistral نگاشت می‌کند:

    | سطح تفکر OpenClaw                                                    | `reasoning_effort` در Mistral |
    | --------------------------------------------------------------------- | ----------------------------- |
    | **خاموش** / **حداقلی**                                               | `none`                        |
    | **کم** / **متوسط** / **زیاد** / **بسیار زیاد** / **تطبیقی** / **حداکثر** | `high`                    |

    <Warning>
    از ترکیب حالت استدلال Medium 3.5 با `temperature: 0` خودداری کنید؛ گزارش شده است که API HTTP متعلق به Mistral ترکیب `reasoning_effort="high"` و `temperature: 0` را با پاسخ ۴۰۰ رد می‌کند. مقدار دما را تنظیم‌نشده باقی بگذارید، یا پیش از تنظیم دمای پایین، تفکر را خاموش/حداقلی کنید تا OpenClaw مقدار `reasoning_effort: "none"` را ارسال کند.
    </Warning>

    نمونه پیکربندی مختص مدل برای استدلال Medium 3.5:

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
    سایر مدل‌های کاتالوگ همراه Mistral از این پارامتر استفاده نمی‌کنند. هنگامی که رفتار بومی و استدلال‌محور Mistral را می‌خواهید، همچنان از مدل‌های `magistral-*` استفاده کنید.
    </Note>

  </Accordion>

  <Accordion title="تعبیه‌های حافظه">
    Mistral می‌تواند تعبیه‌های حافظه را از طریق `/v1/embeddings` ارائه کند (مدل پیش‌فرض: `mistral-embed`):

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "mistral" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="احراز هویت و نشانی پایه">
    - احراز هویت Mistral از `MISTRAL_API_KEY` استفاده می‌کند (سرآیند Bearer).
    - نشانی پایه ارائه‌دهنده به‌طور پیش‌فرض `https://api.mistral.ai/v1` است و قالب استاندارد درخواست تکمیل چت سازگار با OpenAI را می‌پذیرد.
    - مدل پیش‌فرض راه‌اندازی اولیه `mistral/mistral-large-latest` است.
    - نشانی پایه را در `models.providers.mistral.baseUrl` فقط زمانی بازنویسی کنید که Mistral صراحتاً نقطه پایانی منطقه‌ای مورد نیاز شما را منتشر کرده باشد.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="درک رسانه" href="/fa/nodes/media-understanding" icon="microphone">
    راه‌اندازی رونویسی صوت و انتخاب ارائه‌دهنده.
  </Card>
</CardGroup>
