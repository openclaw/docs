---
read_when:
    - تريد استخدام تحويل النص إلى كلام من ElevenLabs في OpenClaw
    - تريد استخدام ElevenLabs Scribe لتحويل الكلام إلى نص للمرفقات الصوتية
    - تريد النسخ الفوري من ElevenLabs للمكالمة الصوتية أو Google Meet
summary: استخدم النطق من ElevenLabs وScribe STT والنسخ في الوقت الفعلي مع OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-04T07:09:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c880bf9dcab01ef70779c74576c70ea5d0203b96b5f739291842fafcb4bdb4b
    source_path: providers/elevenlabs.md
    workflow: 16
---

يستخدم OpenClaw ElevenLabs لتحويل النص إلى كلام، وتحويل الكلام إلى نص دفعيًا باستخدام Scribe
v2، وتحويل الكلام إلى نص عبر البث باستخدام Scribe v2 Realtime.

| الإمكانية               | سطح OpenClaw                                                     | الافتراضي                  |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| تحويل النص إلى كلام           | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| تحويل الكلام إلى نص دفعيًا     | `tools.media.audio`                                                  | `scribe_v2`              |
| تحويل الكلام إلى نص عبر البث | بث Voice Call أو Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## المصادقة

اضبط `ELEVENLABS_API_KEY` في البيئة. يُقبل `XI_API_KEY` أيضًا من أجل
التوافق مع أدوات ElevenLabs الحالية.

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

اضبط `modelId` على `eleven_v3` لاستخدام ElevenLabs v3 TTS. يُبقي OpenClaw
`eleven_multilingual_v2` افتراضيًا للتثبيتات الحالية.

## تحويل الكلام إلى نص

استخدم Scribe v2 للمرفقات الصوتية الواردة والمقاطع الصوتية القصيرة المسجلة:

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

يرسل OpenClaw الصوت متعدد الأجزاء إلى ElevenLabs `/v1/speech-to-text` مع
`model_id: "scribe_v2"`. تُحوَّل تلميحات اللغة إلى `language_code` عند وجودها.

## بث STT

يسجل Plugin `elevenlabs` المضمّن Scribe v2 Realtime لتحويل الكلام إلى نص عبر البث في Voice Call و
Google Meet ضمن وضع agent.

| الإعداد         | مسار الإعداد                                                               | الافتراضي                                           |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| مفتاح API         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | يعود احتياطيًا إلى `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| النموذج           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| تنسيق الصوت    | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| معدل العينة     | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| استراتيجية التثبيت | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| اللغة        | `...elevenlabs.languageCode`                                              | (غير مضبوط)                                           |

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
يتلقى Voice Call وسائط Twilio بصيغة G.711 u-law بمعدل 8 كيلوهرتز. مزود ElevenLabs realtime
يستخدم `ulaw_8000` افتراضيًا، لذلك يمكن تمرير إطارات الاتصالات الهاتفية دون
إعادة ترميز.
</Note>

بالنسبة إلى وضع agent في Google Meet، اضبط
`plugins.entries.google-meet.config.realtime.transcriptionProvider` على
`"elevenlabs"` واضبط كتلة المزود نفسها ضمن
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## ذات صلة

- [تحويل النص إلى كلام](/ar/tools/tts)
- [Google Meet](/ar/plugins/google-meet)
- [اختيار النموذج](/ar/concepts/model-providers)
