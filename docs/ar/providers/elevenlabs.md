---
read_when:
    - تريد استخدام تحويل النص إلى كلام من ElevenLabs في OpenClaw
    - تريد استخدام ElevenLabs Scribe لتحويل الكلام إلى نص للمرفقات الصوتية
    - تريد النسخ الفوري من ElevenLabs لمكالمة صوتية أو Google Meet
summary: استخدم الكلام من ElevenLabs وScribe STT والنسخ الفوري مع OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-07T13:27:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72e655dc2260a353bb5e84e6df32cc39bf6329836cb29ab569c3f93833df144a
    source_path: providers/elevenlabs.md
    workflow: 16
---

يستخدم OpenClaw ElevenLabs لتحويل النص إلى كلام، وتحويل الكلام إلى نص دفعيًا باستخدام Scribe
v2، وSTT المتدفق باستخدام Scribe v2 Realtime.

| القدرة                   | سطح OpenClaw                                                        | الافتراضي               |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| تحويل النص إلى كلام      | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| تحويل الكلام إلى نص دفعيًا | `tools.media.audio`                                                  | `scribe_v2`              |
| تحويل الكلام إلى نص متدفق | بث المكالمات الصوتية أو Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## المصادقة

عيّن `ELEVENLABS_API_KEY` في البيئة. يُقبل `XI_API_KEY` أيضًا للتوافق مع
أدوات ElevenLabs الحالية.

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

عيّن `modelId` إلى `eleven_v3` لاستخدام ElevenLabs v3 TTS. يُبقي OpenClaw
`eleven_multilingual_v2` كافتراضي لعمليات التثبيت الحالية.

تستخدم قنوات الصوت في Discord نقطة نهاية TTS المتدفق من ElevenLabs عندما يكون ElevenLabs
هو موفر `voice.tts`/`messages.tts` المحدد. يبدأ التشغيل من
دفق الصوت المُعاد بدلًا من انتظار OpenClaw لتنزيل ملف الصوت بالكامل وكتابته
أولًا. يرتبط `latencyTier` بمعلمة الاستعلام
`optimize_streaming_latency` في ElevenLabs للنماذج التي تقبلها؛ ويحذف OpenClaw
هذه المعلمة مع `eleven_v3`، لأنه يرفضها.

## تحويل الكلام إلى نص

استخدم Scribe v2 لمرفقات الصوت الواردة ومقاطع الصوت المسجلة القصيرة:

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

يرسل OpenClaw صوتًا متعدد الأجزاء إلى ElevenLabs `/v1/speech-to-text` مع
`model_id: "scribe_v2"`. تُربط تلميحات اللغة بـ `language_code` عند وجودها.

## STT المتدفق

يسجل Plugin `elevenlabs` المضمّن Scribe v2 Realtime للنسخ المتدفق في وضع الوكيل
للمكالمات الصوتية وGoogle Meet.

| الإعداد          | مسار الإعدادات                                                           | الافتراضي                                        |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| مفتاح API       | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | يعود إلى `ELEVENLABS_API_KEY` / `XI_API_KEY`      |
| النموذج         | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| تنسيق الصوت     | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| معدل العينة     | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| استراتيجية الإرسال | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| اللغة           | `...elevenlabs.languageCode`                                              | (غير معيّن)                                      |

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
تتلقى المكالمات الصوتية وسائط Twilio بتنسيق G.711 u-law بتردد 8 كيلوهرتز. يعتمد موفر ElevenLabs في الوقت الفعلي
افتراضيًا على `ulaw_8000`، لذلك يمكن تمرير إطارات الاتصالات الهاتفية دون
تحويل ترميز.
</Note>

بالنسبة إلى وضع الوكيل في Google Meet، عيّن
`plugins.entries.google-meet.config.realtime.transcriptionProvider` إلى
`"elevenlabs"` واضبط كتلة الموفر نفسها ضمن
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## ذات صلة

- [تحويل النص إلى كلام](/ar/tools/tts)
- [Google Meet](/ar/plugins/google-meet)
- [اختيار النموذج](/ar/concepts/model-providers)
