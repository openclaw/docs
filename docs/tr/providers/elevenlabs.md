---
read_when:
    - OpenClaw içinde ElevenLabs metinden konuşmaya istiyorsunuz
    - Ses ekleri için ElevenLabs Scribe konuşmadan metne istiyorsunuz
    - Voice Call için ElevenLabs gerçek zamanlı transkripsiyon istiyorsunuz
summary: OpenClaw ile ElevenLabs konuşma, Scribe STT ve gerçek zamanlı transkripsiyon kullanın
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-24T09:25:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdf86afb839cf90c8caf73a194cb6eae0078661d3ab586d63b9e1276c845e7f7
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw, metinden konuşma, Scribe
v2 ile toplu konuşmadan metne ve Voice Call akışlı STT için Scribe v2 Realtime amacıyla ElevenLabs kullanır.

| Yetenek                  | OpenClaw yüzeyi                                | Varsayılan               |
| ------------------------ | ---------------------------------------------- | ------------------------ |
| Metinden konuşma         | `messages.tts` / `talk`                        | `eleven_multilingual_v2` |
| Toplu konuşmadan metne   | `tools.media.audio`                            | `scribe_v2`              |
| Akışlı konuşmadan metne  | Voice Call `streaming.provider: "elevenlabs"`  | `scribe_v2_realtime`     |

## Kimlik doğrulama

Ortamda `ELEVENLABS_API_KEY` ayarlayın. Mevcut ElevenLabs araçlarıyla
uyumluluk için `XI_API_KEY` de kabul edilir.

```bash
export ELEVENLABS_API_KEY="..."
```

## Metinden konuşma

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

## Konuşmadan metne

Gelen ses ekleri ve kısa kaydedilmiş ses bölümleri için Scribe v2 kullanın:

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

OpenClaw, çok parçalı sesi ElevenLabs `/v1/speech-to-text` uç noktasına
`model_id: "scribe_v2"` ile gönderir. Dil ipuçları mevcut olduğunda `language_code` alanına eşlenir.

## Voice Call akışlı STT

Paketlenmiş `elevenlabs` Plugin'i, Voice Call
akışlı transkripsiyon için Scribe v2 Realtime kaydeder.

| Ayar             | Config yolu                                                             | Varsayılan                                        |
| ---------------- | ----------------------------------------------------------------------- | ------------------------------------------------- |
| API anahtarı     | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | `ELEVENLABS_API_KEY` / `XI_API_KEY` değerlerine fallback yapar |
| Model            | `...elevenlabs.modelId`                                                 | `scribe_v2_realtime`                              |
| Ses biçimi       | `...elevenlabs.audioFormat`                                             | `ulaw_8000`                                       |
| Örnekleme hızı   | `...elevenlabs.sampleRate`                                              | `8000`                                            |
| Commit stratejisi | `...elevenlabs.commitStrategy`                                         | `vad`                                             |
| Dil              | `...elevenlabs.languageCode`                                            | (ayarsız)                                         |

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
Voice Call, Twilio medyasını 8 kHz G.711 u-law olarak alır. ElevenLabs gerçek zamanlı
sağlayıcısı varsayılan olarak `ulaw_8000` kullandığından, telefon çerçeveleri
yeniden kodlama olmadan iletilebilir.
</Note>

## İlgili

- [Text-to-speech](/tr/tools/tts)
- [Model selection](/tr/concepts/model-providers)
