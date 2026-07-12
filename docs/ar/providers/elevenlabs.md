---
read_when:
    - تريد تحويل النص إلى كلام باستخدام ElevenLabs في OpenClaw
    - تريد استخدام ElevenLabs Scribe لتحويل المرفقات الصوتية من كلام إلى نص
    - تريد النسخ الفوري من ElevenLabs للمكالمة الصوتية أو Google Meet
summary: استخدم تحويل النص إلى كلام من ElevenLabs، وScribe لتحويل الكلام إلى نص، والنسخ الآني مع OpenClaw
title: إليفن لابز
x-i18n:
    generated_at: "2026-07-12T06:27:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

يستخدم OpenClaw خدمة ElevenLabs لتحويل النص إلى كلام، وتحويل الكلام إلى نص على دفعات باستخدام Scribe
v2، وتحويل الكلام إلى نص بالبث باستخدام Scribe v2 Realtime. يأتي Plugin مضمنًا
ومفعّلًا افتراضيًا؛ ولا حاجة إلى خطوة `plugins install`.

| الإمكانية                     | سطح OpenClaw                                                        | الافتراضي               |
| ----------------------------- | ------------------------------------------------------------------- | ------------------------ |
| تحويل النص إلى كلام           | `messages.tts` / `talk`                                             | `eleven_multilingual_v2` |
| تحويل الكلام إلى نص على دفعات | `tools.media.audio`                                                 | `scribe_v2`              |
| تحويل الكلام إلى نص بالبث     | بث المكالمات الصوتية أو `realtime.transcriptionProvider` في Google Meet | `scribe_v2_realtime`     |

## المصادقة

عيّن `ELEVENLABS_API_KEY` في البيئة. ويُقبل `XI_API_KEY` أيضًا للتوافق
مع أدوات ElevenLabs الحالية.

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

عيّن `modelId` إلى `eleven_v3` لاستخدام تحويل النص إلى كلام في ElevenLabs v3. يُبقي OpenClaw
على `eleven_multilingual_v2` بوصفه الخيار الافتراضي للتثبيتات الحالية.

تستخدم قنوات Discord الصوتية نقطة نهاية تحويل النص إلى كلام بالبث في ElevenLabs عندما تكون ElevenLabs
هي موفّر `voice.tts`/`messages.tts` المحدد: يبدأ التشغيل من
دفق الصوت المُعاد بدلًا من انتظار تنزيل OpenClaw لملف
الصوت بالكامل أولًا. يُطابق `latencyTier` معامل الاستعلام `optimize_streaming_latency`
في ElevenLabs للنماذج التي تقبله؛ ويحذف OpenClaw هذا المعامل مع
`eleven_v3`، الذي يرفضه.

## تحويل الكلام إلى نص

استخدم Scribe v2 لمرفقات الصوت الواردة والمقاطع الصوتية القصيرة المسجلة:

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

يرسل OpenClaw صوتًا متعدد الأجزاء إلى `/v1/speech-to-text` في ElevenLabs مع
`model_id: "scribe_v2"`. وتُطابق تلميحات اللغة `language_code` عند وجودها.

## تحويل الكلام إلى نص بالبث

يسجّل Plugin المضمن `elevenlabs` خدمة Scribe v2 Realtime للمكالمات الصوتية
والنسخ بالبث في وضع الوكيل في Google Meet.

| الإعداد            | مسار الإعداد                                                              | الافتراضي                                      |
| ------------------ | ------------------------------------------------------------------------- | ---------------------------------------------- |
| مفتاح API          | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | يرجع إلى `ELEVENLABS_API_KEY` / `XI_API_KEY`   |
| النموذج            | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                           |
| تنسيق الصوت        | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                    |
| معدل أخذ العينات   | `...elevenlabs.sampleRate`                                                | `8000`                                         |
| استراتيجية الإقرار | `...elevenlabs.commitStrategy`                                            | `vad`                                          |
| اللغة              | `...elevenlabs.languageCode`                                              | (غير معيّنة)                                   |

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
تستقبل المكالمات الصوتية وسائط Twilio بترميز G.711 u-law وتردد 8 كيلوهرتز. ويستخدم موفّر ElevenLabs الفوري
`ulaw_8000` افتراضيًا، لذا يمكن تمرير إطارات الاتصالات الهاتفية دون
إعادة ترميز.
</Note>

في وضع وكيل Google Meet، عيّن
`plugins.entries.google-meet.config.realtime.transcriptionProvider` إلى
`"elevenlabs"`، واضبط كتلة الموفّر نفسها ضمن
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## ذو صلة

- [تحويل النص إلى كلام](/ar/tools/tts)
- [Google Meet](/ar/plugins/google-meet)
- [اختيار النموذج](/ar/concepts/model-providers)
