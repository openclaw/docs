---
read_when:
    - می‌خواهید از تبدیل متن به گفتار ElevenLabs در OpenClaw استفاده کنید
    - شما می‌خواهید برای پیوست‌های صوتی از تبدیل گفتار به متن ElevenLabs Scribe استفاده کنید.
    - شما رونویسی بلادرنگ ElevenLabs را برای Voice Call یا Google Meet می‌خواهید
summary: از گفتار ElevenLabs، Scribe STT و رونویسی بی‌درنگ با OpenClaw استفاده کنید
title: ElevenLabs
x-i18n:
    generated_at: "2026-06-27T18:39:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 126161d7e378382700f203efa9bce1bdd5fe7267b230e2d3d0e45112407d6a7b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw از ElevenLabs برای تبدیل متن به گفتار، تبدیل گفتار به متن دسته‌ای با Scribe
v2، و STT جریانی با Scribe v2 Realtime استفاده می‌کند.

| قابلیت | سطح OpenClaw | پیش‌فرض |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| تبدیل متن به گفتار | `messages.tts` / `talk` | `eleven_multilingual_v2` |
| تبدیل گفتار به متن دسته‌ای | `tools.media.audio` | `scribe_v2` |
| تبدیل گفتار به متن جریانی | پخش جریانی Voice Call یا Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime` |

## احراز هویت

`ELEVENLABS_API_KEY` را در محیط تنظیم کنید. `XI_API_KEY` نیز برای سازگاری با ابزارهای موجود ElevenLabs پذیرفته می‌شود.

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
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

برای استفاده از TTS نسخه 3 ElevenLabs، `modelId` را روی `eleven_v3` تنظیم کنید. OpenClaw
`eleven_multilingual_v2` را برای نصب‌های موجود به‌عنوان پیش‌فرض نگه می‌دارد.

وقتی ElevenLabs ارائه‌دهنده انتخاب‌شده `voice.tts`/`messages.tts` باشد، کانال‌های صوتی Discord از endpoint جریانی TTS در ElevenLabs استفاده می‌کنند. پخش از جریان صوتی بازگردانده‌شده شروع می‌شود، به‌جای اینکه منتظر بماند OpenClaw ابتدا کل فایل صوتی را دانلود و بنویسد. `latencyTier` برای مدل‌هایی که آن را می‌پذیرند به پارامتر query با نام `optimize_streaming_latency` در ElevenLabs نگاشت می‌شود؛ OpenClaw این پارامتر را برای `eleven_v3`، که آن را رد می‌کند، حذف می‌کند.

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

OpenClaw صوت چندبخشی را با `model_id: "scribe_v2"` به `/v1/speech-to-text` در ElevenLabs می‌فرستد. راهنمایی‌های زبان، در صورت وجود، به `language_code` نگاشت می‌شوند.

## STT جریانی

Plugin همراه `elevenlabs`، Scribe v2 Realtime را برای Voice Call و رونویسی جریانی حالت عامل Google Meet ثبت می‌کند.

| تنظیم | مسیر پیکربندی | پیش‌فرض |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| کلید API | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | به `ELEVENLABS_API_KEY` / `XI_API_KEY` برمی‌گردد |
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
Voice Call رسانه Twilio را به‌صورت G.711 u-law با نرخ 8 کیلوهرتز دریافت می‌کند. ارائه‌دهنده realtime در ElevenLabs به‌طور پیش‌فرض از `ulaw_8000` استفاده می‌کند، بنابراین فریم‌های تلفنی می‌توانند بدون
transcoding ارسال شوند.
</Note>

برای حالت عامل Google Meet، مقدار
`plugins.entries.google-meet.config.realtime.transcriptionProvider` را روی
`"elevenlabs"` تنظیم کنید و همان بلوک ارائه‌دهنده را زیر
`plugins.entries.google-meet.config.realtime.providers.elevenlabs` پیکربندی کنید.

## مرتبط

- [تبدیل متن به گفتار](/fa/tools/tts)
- [Google Meet](/fa/plugins/google-meet)
- [انتخاب مدل](/fa/concepts/model-providers)
