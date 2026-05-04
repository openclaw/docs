---
read_when:
    - می‌خواهید تبدیل متن به گفتار ElevenLabs را در OpenClaw داشته باشید
    - برای پیوست‌های صوتی، تبدیل گفتار به متن ElevenLabs Scribe را می‌خواهید
    - شما رونویسی بی‌درنگ ElevenLabs را برای تماس صوتی یا Google Meet می‌خواهید
summary: از گفتار ElevenLabs، Scribe STT و رونویسی بلادرنگ با OpenClaw استفاده کنید
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-04T07:06:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c880bf9dcab01ef70779c74576c70ea5d0203b96b5f739291842fafcb4bdb4b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw از ElevenLabs برای تبدیل متن به گفتار، تبدیل گفتار به متن دسته‌ای با Scribe
v2، و STT جریانی با Scribe v2 Realtime استفاده می‌کند.

| قابلیت                 | سطح OpenClaw                                                         | پیش‌فرض                 |
| ---------------------- | -------------------------------------------------------------------- | ----------------------- |
| تبدیل متن به گفتار     | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| تبدیل گفتار به متن دسته‌ای | `tools.media.audio`                                                  | `scribe_v2`             |
| تبدیل گفتار به متن جریانی | پخش جریانی Voice Call یا Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`    |

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

برای استفاده از TTS نسخه ۳ ElevenLabs، `modelId` را روی `eleven_v3` تنظیم کنید. OpenClaw
برای نصب‌های موجود، `eleven_multilingual_v2` را به‌عنوان پیش‌فرض نگه می‌دارد.

## تبدیل گفتار به متن

از Scribe v2 برای پیوست‌های صوتی ورودی و بخش‌های کوتاه صدای ضبط‌شده استفاده کنید:

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

OpenClaw صدای چندبخشی را با `model_id: "scribe_v2"` به
`/v1/speech-to-text` در ElevenLabs ارسال می‌کند. در صورت وجود، راهنمایی‌های زبان به
`language_code` نگاشت می‌شوند.

## STT جریانی

Plugin همراه `elevenlabs`، Scribe v2 Realtime را برای رونویسی جریانی در حالت عامل Voice Call و
Google Meet ثبت می‌کند.

| تنظیم           | مسیر پیکربندی                                                          | پیش‌فرض                                            |
| --------------- | ----------------------------------------------------------------------- | -------------------------------------------------- |
| کلید API        | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | به `ELEVENLABS_API_KEY` / `XI_API_KEY` بازمی‌گردد |
| مدل             | `...elevenlabs.modelId`                                                 | `scribe_v2_realtime`                               |
| قالب صوتی       | `...elevenlabs.audioFormat`                                             | `ulaw_8000`                                        |
| نرخ نمونه‌برداری | `...elevenlabs.sampleRate`                                              | `8000`                                             |
| راهبرد ثبت      | `...elevenlabs.commitStrategy`                                          | `vad`                                              |
| زبان            | `...elevenlabs.languageCode`                                            | (تنظیم‌نشده)                                      |

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
Voice Call رسانه Twilio را به‌صورت G.711 u-law با نرخ ۸ kHz دریافت می‌کند. ارائه‌دهنده بلادرنگ ElevenLabs
به‌طور پیش‌فرض از `ulaw_8000` استفاده می‌کند، بنابراین فریم‌های تلفنی می‌توانند بدون
تبدیل کدینگ بازفرستاده شوند.
</Note>

برای حالت عامل Google Meet، مقدار
`plugins.entries.google-meet.config.realtime.transcriptionProvider` را روی
`"elevenlabs"` تنظیم کنید و همان بلوک ارائه‌دهنده را زیر
`plugins.entries.google-meet.config.realtime.providers.elevenlabs` پیکربندی کنید.

## مرتبط

- [تبدیل متن به گفتار](/fa/tools/tts)
- [Google Meet](/fa/plugins/google-meet)
- [انتخاب مدل](/fa/concepts/model-providers)
