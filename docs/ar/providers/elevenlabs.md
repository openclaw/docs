---
read_when:
    - تريد استخدام ElevenLabs لتحويل النص إلى كلام في OpenClaw
    - تريد استخدام ElevenLabs Scribe لتحويل الكلام إلى نص للمرفقات الصوتية
    - تريد النسخ النصي الفوري من ElevenLabs لـ Voice Call
summary: استخدم كلام ElevenLabs، وScribe STT، والنسخ النصي الفوري مع OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-24T07:58:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdf86afb839cf90c8caf73a194cb6eae0078661d3ab586d63b9e1276c845e7f7
    source_path: providers/elevenlabs.md
    workflow: 15
---

يستخدم OpenClaw خدمة ElevenLabs لتحويل النص إلى كلام، ولتحويل الكلام إلى نص على دفعات باستخدام Scribe
v2، وللنسخ النصي المتدفق في Voice Call باستخدام Scribe v2 Realtime.

| القدرة                    | سطح OpenClaw                                     | الافتراضي               |
| ------------------------- | ------------------------------------------------ | ----------------------- |
| تحويل النص إلى كلام       | `messages.tts` / `talk`                          | `eleven_multilingual_v2` |
| تحويل الكلام إلى نص دفعةً واحدة | `tools.media.audio`                        | `scribe_v2`             |
| تحويل الكلام إلى نص متدفق | Voice Call ‏`streaming.provider: "elevenlabs"`   | `scribe_v2_realtime`    |

## المصادقة

اضبط `ELEVENLABS_API_KEY` في البيئة. كما تُقبل `XI_API_KEY` أيضًا
للتوافق مع أدوات ElevenLabs الموجودة.

```bash
export ELEVENLABS_API_KEY="..."
```

## تحويل النص إلى كلام

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

## تحويل الكلام إلى نص

استخدم Scribe v2 للمرفقات الصوتية الواردة ومقاطع الصوت القصيرة المسجلة:

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

يرسل OpenClaw الصوت multipart إلى نقطة النهاية `/v1/speech-to-text` الخاصة بـ ElevenLabs مع
القيمة `model_id: "scribe_v2"`. وتُربط تلميحات اللغة إلى `language_code` عند وجودها.

## تحويل الكلام إلى نص متدفق في Voice Call

تسجّل Plugin المضمّنة `elevenlabs` خدمة Scribe v2 Realtime من أجل
النسخ النصي المتدفق لـ Voice Call.

| الإعداد         | مسار التهيئة                                                              | الافتراضي                                         |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| مفتاح API       | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | يعود إلى `ELEVENLABS_API_KEY` / `XI_API_KEY`      |
| النموذج         | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| تنسيق الصوت     | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| معدل العينة     | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| استراتيجية الإرسال | `...elevenlabs.commitStrategy`                                         | `vad`                                             |
| اللغة           | `...elevenlabs.languageCode`                                              | (غير مضبوط)                                      |

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
تستقبل Voice Call وسائط Twilio بصيغة 8 kHz G.711 u-law. ويكون مزوّد ElevenLabs الفوري
افتراضيًا على `ulaw_8000`, لذلك يمكن تمرير إطارات الاتصالات الهاتفية من دون
إعادة ترميز.
</Note>

## ذو صلة

- [تحويل النص إلى كلام](/ar/tools/tts)
- [اختيار النموذج](/ar/concepts/model-providers)
