---
read_when:
    - تريد تحويل النص إلى كلام من ElevenLabs في OpenClaw
    - تريد استخدام تحويل الكلام إلى نص عبر ElevenLabs Scribe للمرفقات الصوتية
    - تريد النسخ الصوتي الفوري من ElevenLabs للمكالمة الصوتية أو Google Meet
summary: استخدم كلام ElevenLabs وScribe STT والنسخ الفوري مع OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-06-27T18:24:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 126161d7e378382700f203efa9bce1bdd5fe7267b230e2d3d0e45112407d6a7b
    source_path: providers/elevenlabs.md
    workflow: 16
---

يستخدم OpenClaw ElevenLabs لتحويل النص إلى كلام، وتحويل الكلام إلى نص دفعيًا باستخدام Scribe
v2، وتحويل الكلام إلى نص عبر البث باستخدام Scribe v2 Realtime.

| القدرة                  | واجهة OpenClaw                                                       | الافتراضي               |
| ----------------------- | -------------------------------------------------------------------- | ----------------------- |
| تحويل النص إلى كلام     | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| تحويل الكلام إلى نص دفعيًا | `tools.media.audio`                                                  | `scribe_v2`             |
| تحويل الكلام إلى نص عبر البث | بث المكالمة الصوتية أو `realtime.transcriptionProvider` في Google Meet | `scribe_v2_realtime`    |

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
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

عيّن `modelId` إلى `eleven_v3` لاستخدام ElevenLabs v3 TTS. يبقي OpenClaw
`eleven_multilingual_v2` كافتراضي للتثبيتات الحالية.

تستخدم قنوات Discord الصوتية نقطة نهاية TTS للبث من ElevenLabs عندما تكون ElevenLabs
هي مزود `voice.tts`/`messages.tts` المحدد. يبدأ التشغيل من تدفق الصوت
المعاد بدلًا من انتظار OpenClaw لتنزيل ملف الصوت بالكامل وكتابته أولًا. يطابق
`latencyTier` معامل الاستعلام `optimize_streaming_latency` في ElevenLabs للنماذج
التي تقبله؛ ويحذف OpenClaw ذلك المعامل مع `eleven_v3`، لأنه يرفضه.

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
`model_id: "scribe_v2"`. تُطابق تلميحات اللغة `language_code` عند وجودها.

## تحويل الكلام إلى نص عبر البث

يسجل Plugin المضمن `elevenlabs` Scribe v2 Realtime للنسخ عبر البث في المكالمة الصوتية
ووضع الوكيل في Google Meet.

| الإعداد            | مسار الإعدادات                                                           | الافتراضي                                      |
| ------------------ | ------------------------------------------------------------------------ | ---------------------------------------------- |
| مفتاح API          | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | يعود إلى `ELEVENLABS_API_KEY` / `XI_API_KEY`   |
| النموذج            | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                           |
| تنسيق الصوت        | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                    |
| معدل العينة        | `...elevenlabs.sampleRate`                                                | `8000`                                         |
| استراتيجية الإرسال | `...elevenlabs.commitStrategy`                                            | `vad`                                          |
| اللغة              | `...elevenlabs.languageCode`                                              | (غير معيّن)                                    |

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
تتلقى المكالمة الصوتية وسائط Twilio بتنسيق G.711 u-law بتردد 8 كيلوهرتز. يستخدم مزود ElevenLabs
الفوري `ulaw_8000` افتراضيًا، لذا يمكن تمرير إطارات الاتصالات الهاتفية دون
إعادة ترميز.
</Note>

لوضع الوكيل في Google Meet، عيّن
`plugins.entries.google-meet.config.realtime.transcriptionProvider` إلى
`"elevenlabs"` واضبط كتلة المزود نفسها ضمن
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## ذات صلة

- [تحويل النص إلى كلام](/ar/tools/tts)
- [Google Meet](/ar/plugins/google-meet)
- [اختيار النموذج](/ar/concepts/model-providers)
