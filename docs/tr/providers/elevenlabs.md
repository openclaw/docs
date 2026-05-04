---
read_when:
    - OpenClaw'da ElevenLabs metinden konuşmaya özelliğini istiyorsunuz
    - Ses ekleri için ElevenLabs Scribe ile konuşmayı metne dönüştürme özelliğini istiyorsunuz
    - Sesli Arama veya Google Meet için ElevenLabs gerçek zamanlı transkripsiyonu istiyorsunuz
summary: OpenClaw ile ElevenLabs konuşma, Scribe STT ve gerçek zamanlı transkripsiyon kullanın
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-04T07:07:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c880bf9dcab01ef70779c74576c70ea5d0203b96b5f739291842fafcb4bdb4b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw, metinden konuşmaya dönüştürme için ElevenLabs'i, Scribe v2 ile toplu konuşmayı metne dönüştürmeyi ve Scribe v2 Realtime ile akışlı STT'yi kullanır.

| Yetenek                         | OpenClaw yüzeyi                                                       | Varsayılan               |
| ------------------------------- | --------------------------------------------------------------------- | ------------------------ |
| Metinden konuşmaya dönüştürme   | `messages.tts` / `talk`                                               | `eleven_multilingual_v2` |
| Toplu konuşmayı metne dönüştürme | `tools.media.audio`                                                   | `scribe_v2`              |
| Akışlı konuşmayı metne dönüştürme | Voice Call akışı veya Google Meet `realtime.transcriptionProvider`    | `scribe_v2_realtime`     |

## Kimlik doğrulama

Ortamda `ELEVENLABS_API_KEY` ayarlayın. Mevcut ElevenLabs araçlarıyla uyumluluk için `XI_API_KEY` de kabul edilir.

```bash
export ELEVENLABS_API_KEY="..."
```

## Metinden konuşmaya dönüştürme

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

ElevenLabs v3 TTS kullanmak için `modelId` değerini `eleven_v3` olarak ayarlayın. OpenClaw, mevcut kurulumlar için varsayılan olarak `eleven_multilingual_v2` değerini korur.

## Konuşmayı metne dönüştürme

Gelen ses ekleri ve kısa kaydedilmiş ses segmentleri için Scribe v2 kullanın:

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

OpenClaw, ElevenLabs `/v1/speech-to-text` uç noktasına `model_id: "scribe_v2"` ile multipart ses gönderir. Dil ipuçları varsa `language_code` ile eşlenir.

## Akışlı STT

Paketle gelen `elevenlabs` plugin'i, Voice Call ve Google Meet agent modu akışlı transkripsiyonu için Scribe v2 Realtime'ı kaydeder.

| Ayar             | Yapılandırma yolu                                                       | Varsayılan                                        |
| ---------------- | ----------------------------------------------------------------------- | ------------------------------------------------- |
| API anahtarı     | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | `ELEVENLABS_API_KEY` / `XI_API_KEY` değerlerine geri döner |
| Model            | `...elevenlabs.modelId`                                                 | `scribe_v2_realtime`                              |
| Ses biçimi       | `...elevenlabs.audioFormat`                                             | `ulaw_8000`                                       |
| Örnekleme hızı   | `...elevenlabs.sampleRate`                                              | `8000`                                            |
| İşleme stratejisi | `...elevenlabs.commitStrategy`                                          | `vad`                                             |
| Dil              | `...elevenlabs.languageCode`                                            | (ayarlanmamış)                                    |

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
Voice Call, Twilio medyasını 8 kHz G.711 u-law olarak alır. ElevenLabs gerçek zamanlı sağlayıcısı varsayılan olarak `ulaw_8000` kullanır, bu nedenle telefon çerçeveleri kod dönüştürme olmadan iletilebilir.
</Note>

Google Meet agent modu için `plugins.entries.google-meet.config.realtime.transcriptionProvider` değerini `"elevenlabs"` olarak ayarlayın ve aynı sağlayıcı bloğunu `plugins.entries.google-meet.config.realtime.providers.elevenlabs` altında yapılandırın.

## İlgili

- [Metinden konuşmaya dönüştürme](/tr/tools/tts)
- [Google Meet](/tr/plugins/google-meet)
- [Model seçimi](/tr/concepts/model-providers)
