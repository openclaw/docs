---
read_when:
    - OpenClaw'da ElevenLabs metinden sese özelliğini istiyorsunuz
    - Ses ekleri için ElevenLabs Scribe konuşmadan metne dönüştürme özelliğini istiyorsunuz
    - Sesli Arama veya Google Meet için ElevenLabs gerçek zamanlı transkripsiyonu istiyorsunuz
summary: OpenClaw ile ElevenLabs konuşma, Scribe STT ve gerçek zamanlı transkripsiyon kullanın
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-07T13:25:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72e655dc2260a353bb5e84e6df32cc39bf6329836cb29ab569c3f93833df144a
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw, metinden konuşmaya, Scribe v2 ile toplu konuşmadan metne ve Scribe v2 Realtime ile akışlı STT için ElevenLabs kullanır.

| Yetenek                 | OpenClaw yüzeyi                                                        | Varsayılan               |
| ----------------------- | ---------------------------------------------------------------------- | ------------------------ |
| Metinden konuşmaya      | `messages.tts` / `talk`                                                | `eleven_multilingual_v2` |
| Toplu konuşmadan metne  | `tools.media.audio`                                                    | `scribe_v2`              |
| Akışlı konuşmadan metne | Sesli Arama akışı veya Google Meet `realtime.transcriptionProvider`    | `scribe_v2_realtime`     |

## Kimlik doğrulama

Ortamda `ELEVENLABS_API_KEY` ayarlayın. Mevcut ElevenLabs araçlarıyla uyumluluk
için `XI_API_KEY` de kabul edilir.

```bash
export ELEVENLABS_API_KEY="..."
```

## Metinden konuşmaya

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

ElevenLabs v3 TTS kullanmak için `modelId` değerini `eleven_v3` olarak ayarlayın.
OpenClaw, mevcut kurulumlar için varsayılan olarak `eleven_multilingual_v2`
kullanmaya devam eder.

ElevenLabs seçili `voice.tts`/`messages.tts` sağlayıcısı olduğunda Discord ses
kanalları ElevenLabs'in akışlı TTS uç noktasını kullanır. Oynatma, OpenClaw'ın
önce tüm ses dosyasını indirip yazmasını beklemek yerine döndürülen ses akışından
başlar. `latencyTier`, bunu kabul eden modeller için ElevenLabs'in
`optimize_streaming_latency` sorgu parametresine eşlenir; OpenClaw, bunu reddeden
`eleven_v3` için bu parametreyi atlar.

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

OpenClaw, `model_id: "scribe_v2"` ile multipart sesi ElevenLabs
`/v1/speech-to-text` adresine gönderir. Dil ipuçları mevcut olduğunda
`language_code` değerine eşlenir.

## Akışlı STT

Birlikte gelen `elevenlabs` Plugin'i, Sesli Arama ve Google Meet aracı modu
akışlı transkripsiyonu için Scribe v2 Realtime kaydeder.

| Ayar            | Yapılandırma yolu                                                       | Varsayılan                                        |
| --------------- | ----------------------------------------------------------------------- | ------------------------------------------------- |
| API anahtarı    | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | `ELEVENLABS_API_KEY` / `XI_API_KEY` değerlerine geri döner |
| Model           | `...elevenlabs.modelId`                                                 | `scribe_v2_realtime`                              |
| Ses biçimi      | `...elevenlabs.audioFormat`                                             | `ulaw_8000`                                       |
| Örnekleme hızı  | `...elevenlabs.sampleRate`                                              | `8000`                                            |
| İşleme stratejisi | `...elevenlabs.commitStrategy`                                        | `vad`                                             |
| Dil             | `...elevenlabs.languageCode`                                            | (ayarlanmamış)                                    |

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
Sesli Arama, Twilio medyasını 8 kHz G.711 u-law olarak alır. ElevenLabs realtime
sağlayıcısı varsayılan olarak `ulaw_8000` kullanır, bu nedenle telefon çerçeveleri
kod dönüştürme olmadan iletilebilir.
</Note>

Google Meet aracı modu için
`plugins.entries.google-meet.config.realtime.transcriptionProvider` değerini
`"elevenlabs"` olarak ayarlayın ve aynı sağlayıcı bloğunu
`plugins.entries.google-meet.config.realtime.providers.elevenlabs` altında
yapılandırın.

## İlgili

- [Metinden konuşmaya](/tr/tools/tts)
- [Google Meet](/tr/plugins/google-meet)
- [Model seçimi](/tr/concepts/model-providers)
