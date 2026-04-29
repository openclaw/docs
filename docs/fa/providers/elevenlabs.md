---
read_when:
    - می‌خواهید تبدیل متن به گفتار ElevenLabs را در OpenClaw داشته باشید
    - به تبدیل گفتار به متن ElevenLabs Scribe برای پیوست‌های صوتی نیاز دارید
    - شما رونویسی بلادرنگ ElevenLabs را برای تماس صوتی می‌خواهید
summary: از گفتار ElevenLabs، STT Scribe و رونویسی بلادرنگ با OpenClaw استفاده کنید
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-29T23:24:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f858a344228c6355cd5fdc3775cddac39e0075f2e9fcf7683271f11be03a31a
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw از ElevenLabs برای تبدیل متن به گفتار، تبدیل گفتار به متن دسته‌ای با Scribe
v2، و STT جریانی Voice Call با Scribe v2 Realtime استفاده می‌کند.

| قابلیت | سطح OpenClaw | پیش‌فرض |
| ------------------------ | --------------------------------------------- | ------------------------ |
| تبدیل متن به گفتار | `messages.tts` / `talk` | `eleven_multilingual_v2` |
| تبدیل گفتار به متن دسته‌ای | `tools.media.audio` | `scribe_v2` |
| تبدیل گفتار به متن جریانی | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime` |

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

OpenClaw صدای multipart را به `/v1/speech-to-text` در ElevenLabs با
`model_id: "scribe_v2"` ارسال می‌کند. در صورت وجود، راهنمایی‌های زبان به `language_code` نگاشت می‌شوند.

## STT جریانی Voice Call

Plugin همراه `elevenlabs`، Scribe v2 Realtime را برای رونویسی جریانی Voice Call
ثبت می‌کند.

| تنظیم | مسیر پیکربندی | پیش‌فرض |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| کلید API | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | به `ELEVENLABS_API_KEY` / `XI_API_KEY` بازمی‌گردد |
| مدل | `...elevenlabs.modelId` | `scribe_v2_realtime` |
| قالب صوتی | `...elevenlabs.audioFormat` | `ulaw_8000` |
| نرخ نمونه‌برداری | `...elevenlabs.sampleRate` | `8000` |
| راهبرد commit | `...elevenlabs.commitStrategy` | `vad` |
| زبان | `...elevenlabs.languageCode` | (تنظیم‌نشده) |

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
Voice Call رسانه Twilio را به‌صورت G.711 u-law با فرکانس ۸ kHz دریافت می‌کند. provider بلادرنگ ElevenLabs
به‌صورت پیش‌فرض از `ulaw_8000` استفاده می‌کند، بنابراین فریم‌های تلفنی می‌توانند بدون
تبدیل کدگذاری ارسال شوند.
</Note>

## مرتبط

- [تبدیل متن به گفتار](/fa/tools/tts)
- [انتخاب مدل](/fa/concepts/model-providers)
