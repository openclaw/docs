---
read_when:
    - می‌خواهید تبدیل متن به گفتار ElevenLabs را در OpenClaw داشته باشید
    - اگر برای پیوست‌های صوتی، تبدیل گفتار به متن ElevenLabs Scribe را می‌خواهید
    - رونویسی بلادرنگ ElevenLabs را برای تماس صوتی یا Google Meet می‌خواهید
summary: استفاده از گفتار ElevenLabs، Scribe STT و رونویسی بی‌درنگ با OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-07T13:30:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72e655dc2260a353bb5e84e6df32cc39bf6329836cb29ab569c3f93833df144a
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw از ElevenLabs برای تبدیل متن به گفتار، تبدیل گفتار به متن دسته‌ای با Scribe
v2، و STT جریانی با Scribe v2 Realtime استفاده می‌کند.

| قابلیت                  | سطح OpenClaw                                                        | پیش‌فرض                 |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| تبدیل متن به گفتار       | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| تبدیل گفتار به متن دسته‌ای | `tools.media.audio`                                                  | `scribe_v2`              |
| تبدیل گفتار به متن جریانی | Voice Call streaming یا Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## احراز هویت

`ELEVENLABS_API_KEY` را در محیط تنظیم کنید. `XI_API_KEY` نیز برای سازگاری با
ابزارهای موجود ElevenLabs پذیرفته می‌شود.

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

برای استفاده از TTS نسخه ۳ ElevenLabs، مقدار `modelId` را روی `eleven_v3` تنظیم کنید. OpenClaw
برای نصب‌های موجود، `eleven_multilingual_v2` را به‌عنوان پیش‌فرض نگه می‌دارد.

کانال‌های صوتی Discord وقتی ElevenLabs ارائه‌دهنده انتخاب‌شده `voice.tts`/`messages.tts` باشد، از نقطه پایانی TTS جریانی ElevenLabs استفاده می‌کنند. پخش از
جریان صوتی برگشتی شروع می‌شود، به‌جای اینکه ابتدا منتظر بماند OpenClaw کل فایل
صوتی را دانلود و بنویسد. `latencyTier` برای مدل‌هایی که آن را می‌پذیرند، به پارامتر
پرس‌وجوی `optimize_streaming_latency` در ElevenLabs نگاشت می‌شود؛ OpenClaw
این پارامتر را برای `eleven_v3`، که آن را رد می‌کند، حذف می‌کند.

## تبدیل گفتار به متن

برای پیوست‌های صوتی ورودی و قطعه‌های کوتاه صدای ضبط‌شده از Scribe v2 استفاده کنید:

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

OpenClaw صدای multipart را با `model_id: "scribe_v2"` به
`/v1/speech-to-text` در ElevenLabs ارسال می‌کند. راهنمایی‌های زبان در صورت وجود به
`language_code` نگاشت می‌شوند.

## STT جریانی

Plugin بسته‌بندی‌شده `elevenlabs`، Scribe v2 Realtime را برای رونویسی جریانی Voice Call و
حالت عامل Google Meet ثبت می‌کند.

| تنظیم           | مسیر پیکربندی                                                            | پیش‌فرض                                          |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| کلید API        | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | به `ELEVENLABS_API_KEY` / `XI_API_KEY` برمی‌گردد |
| مدل             | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| قالب صوتی       | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| نرخ نمونه‌برداری | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| راهبرد commit   | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| زبان            | `...elevenlabs.languageCode`                                              | (تنظیم‌نشده)                                      |

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
Voice Call رسانه Twilio را به‌صورت G.711 u-law با فرکانس ۸ کیلوهرتز دریافت می‌کند. ارائه‌دهنده بی‌درنگ ElevenLabs
به‌طور پیش‌فرض از `ulaw_8000` استفاده می‌کند، بنابراین فریم‌های تلفنی می‌توانند بدون
تبدیل کدک ارسال شوند.
</Note>

برای حالت عامل Google Meet، مقدار
`plugins.entries.google-meet.config.realtime.transcriptionProvider` را روی
`"elevenlabs"` تنظیم کنید و همان بلوک ارائه‌دهنده را زیر
`plugins.entries.google-meet.config.realtime.providers.elevenlabs` پیکربندی کنید.

## مرتبط

- [تبدیل متن به گفتار](/fa/tools/tts)
- [Google Meet](/fa/plugins/google-meet)
- [انتخاب مدل](/fa/concepts/model-providers)
