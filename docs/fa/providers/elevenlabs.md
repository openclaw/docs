---
read_when:
    - شما می‌خواهید از تبدیل متن به گفتار ElevenLabs در OpenClaw استفاده کنید
    - برای پیوست‌های صوتی، تبدیل گفتار به متن ElevenLabs Scribe را می‌خواهید
    - برای تماس صوتی یا Google Meet به رونویسی هم‌زمان ElevenLabs نیاز دارید
summary: از گفتار ElevenLabs، تبدیل گفتار به متن Scribe و رونویسی بلادرنگ با OpenClaw استفاده کنید
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-12T10:43:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw برای تبدیل متن به گفتار، تبدیل دسته‌ای گفتار به متن با Scribe
v2 و تبدیل جریانی گفتار به متن با Scribe v2 Realtime از ElevenLabs استفاده می‌کند. این Plugin همراه محصول ارائه شده و
به‌طور پیش‌فرض فعال است؛ نیازی به اجرای مرحله `plugins install` نیست.

| قابلیت                    | سطح OpenClaw                                                         | پیش‌فرض                 |
| ------------------------- | -------------------------------------------------------------------- | ----------------------- |
| تبدیل متن به گفتار        | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| تبدیل دسته‌ای گفتار به متن | `tools.media.audio`                                                  | `scribe_v2`             |
| تبدیل جریانی گفتار به متن | پخش جریانی Voice Call یا `realtime.transcriptionProvider` در Google Meet | `scribe_v2_realtime`    |

## احراز هویت

متغیر `ELEVENLABS_API_KEY` را در محیط تنظیم کنید. برای سازگاری با ابزارهای موجود
ElevenLabs، متغیر `XI_API_KEY` نیز پذیرفته می‌شود.

```bash
export ELEVENLABS_API_KEY="..."
```

## تبدیل متن به گفتار

```json5
{
  messages: {
    tts: {
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

برای استفاده از تبدیل متن به گفتار ElevenLabs v3، مقدار `modelId` را روی `eleven_v3` تنظیم کنید. OpenClaw برای
نصب‌های موجود، `eleven_multilingual_v2` را به‌عنوان پیش‌فرض حفظ می‌کند.

وقتی ElevenLabs به‌عنوان ارائه‌دهنده `voice.tts`/`messages.tts` انتخاب شده باشد، کانال‌های صوتی Discord
از نقطه پایانی تبدیل جریانی متن به گفتار ElevenLabs استفاده می‌کنند: پخش از جریان صوتی
بازگردانده‌شده آغاز می‌شود، به‌جای آن‌که منتظر بماند OpenClaw ابتدا کل
فایل صوتی را بارگیری کند. `latencyTier` برای مدل‌هایی که آن را می‌پذیرند، به پارامتر پرس‌وجوی
`optimize_streaming_latency` در ElevenLabs نگاشت می‌شود؛ OpenClaw این پارامتر را برای
`eleven_v3` که آن را رد می‌کند، ارسال نمی‌کند.

## تبدیل گفتار به متن

برای پیوست‌های صوتی ورودی و بخش‌های کوتاه صدای ضبط‌شده از Scribe v2 استفاده کنید:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "elevenlabs", model: "scribe_v2" }],
      },
    },
  },
}
```

OpenClaw صدای چندبخشی را با
`model_id: "scribe_v2"` به `/v1/speech-to-text` در ElevenLabs ارسال می‌کند. در صورت وجود راهنمای زبان، آن به `language_code` نگاشت می‌شود.

## تبدیل جریانی گفتار به متن

Plugin همراه `elevenlabs`، قابلیت Scribe v2 Realtime را برای Voice Call و
رونویسی جریانی در حالت عامل Google Meet ثبت می‌کند.

| تنظیم             | مسیر پیکربندی                                                             | پیش‌فرض                                          |
| ----------------- | ------------------------------------------------------------------------- | ------------------------------------------------ |
| کلید API          | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | در صورت نبود، از `ELEVENLABS_API_KEY` / `XI_API_KEY` استفاده می‌شود |
| مدل               | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                             |
| قالب صوتی         | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                      |
| نرخ نمونه‌برداری  | `...elevenlabs.sampleRate`                                                | `8000`                                           |
| راهبرد ثبت        | `...elevenlabs.commitStrategy`                                            | `vad`                                            |
| زبان              | `...elevenlabs.languageCode`                                              | (تنظیم‌نشده)                                     |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "${ELEVENLABS_API_KEY}",
                audioFormat: "ulaw_8000",
                commitStrategy: "vad",
                languageCode: "en",
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
Voice Call رسانه Twilio را به‌صورت G.711 u-law با نرخ ۸ کیلوهرتز دریافت می‌کند. ارائه‌دهنده بلادرنگ ElevenLabs
به‌طور پیش‌فرض از `ulaw_8000` استفاده می‌کند؛ بنابراین فریم‌های تلفنی را می‌توان بدون
بازکدگذاری ارسال کرد.
</Note>

برای حالت عامل Google Meet، مقدار
`plugins.entries.google-meet.config.realtime.transcriptionProvider` را روی
`"elevenlabs"` تنظیم کنید و همان بلوک ارائه‌دهنده را در
`plugins.entries.google-meet.config.realtime.providers.elevenlabs` پیکربندی کنید.

## مرتبط

- [تبدیل متن به گفتار](/fa/tools/tts)
- [Google Meet](/fa/plugins/google-meet)
- [انتخاب مدل](/fa/concepts/model-providers)
