---
read_when:
    - OpenClaw'da ElevenLabs metinden konuşmaya özelliğini istiyorsunuz
    - Ses ekleri için ElevenLabs Scribe konuşmayı metne dönüştürmeyi istiyorsunuz
    - Voice Call veya Google Meet için ElevenLabs gerçek zamanlı transkripsiyon istiyorsunuz
summary: OpenClaw ile ElevenLabs konuşma, Scribe STT ve gerçek zamanlı transkripsiyon kullanın
title: ElevenLabs
x-i18n:
    generated_at: "2026-06-28T01:10:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 126161d7e378382700f203efa9bce1bdd5fe7267b230e2d3d0e45112407d6a7b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw, metinden sese, Scribe v2 ile toplu konuşmadan metne ve Scribe v2 Realtime ile akışlı STT için ElevenLabs kullanır.

| Yetenek                  | OpenClaw yüzeyi                                                     | Varsayılan               |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| Metinden sese            | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Toplu konuşmadan metne   | `tools.media.audio`                                                  | `scribe_v2`              |
| Akışlı konuşmadan metne  | Sesli Arama akışı veya Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## Kimlik Doğrulama

Ortamda `ELEVENLABS_API_KEY` ayarlayın. Mevcut ElevenLabs araçlarıyla
uyumluluk için `XI_API_KEY` de kabul edilir.

```bash
export ELEVENLABS_API_KEY="..."
```

## Metinden sese

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

ElevenLabs v3 TTS kullanmak için `modelId` değerini `eleven_v3` olarak ayarlayın. OpenClaw,
mevcut kurulumlar için varsayılan olarak `eleven_multilingual_v2` değerini korur.

Discord ses kanalları, ElevenLabs seçili `voice.tts`/`messages.tts` sağlayıcısı
olduğunda ElevenLabs'in akışlı TTS uç noktasını kullanır. Oynatma, OpenClaw'ın
önce tüm ses dosyasını indirip yazmasını beklemek yerine döndürülen ses akışından
başlar. `latencyTier`, bunu kabul eden modeller için ElevenLabs'in
`optimize_streaming_latency` sorgu parametresine eşlenir; OpenClaw, bunu reddeden
`eleven_v3` için bu parametreyi atlar.

## Konuşmadan metne

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

OpenClaw, `model_id: "scribe_v2"` ile ElevenLabs `/v1/speech-to-text` adresine
multipart ses gönderir. Dil ipuçları, varsa `language_code` değerine eşlenir.

## Akışlı STT

Paketle birlikte gelen `elevenlabs` plugin'i, Sesli Arama ve Google Meet ajan modu
akışlı transkripsiyonu için Scribe v2 Realtime'ı kaydeder.

| Ayar            | Yapılandırma yolu                                                       | Varsayılan                                        |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API anahtarı    | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | `ELEVENLABS_API_KEY` / `XI_API_KEY` değerine geri döner |
| Model           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Ses biçimi      | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Örnekleme hızı  | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| Commit stratejisi | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| Dil             | `...elevenlabs.languageCode`                                              | (ayarlanmamış)                                    |

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
sağlayıcısı varsayılan olarak `ulaw_8000` kullanır, böylece telefon çerçeveleri
transkodlama olmadan iletilebilir.
</Note>

Google Meet ajan modu için
`plugins.entries.google-meet.config.realtime.transcriptionProvider` değerini
`"elevenlabs"` olarak ayarlayın ve aynı sağlayıcı bloğunu
`plugins.entries.google-meet.config.realtime.providers.elevenlabs` altında yapılandırın.

## İlgili

- [Metinden sese](/tr/tools/tts)
- [Google Meet](/tr/plugins/google-meet)
- [Model seçimi](/tr/concepts/model-providers)
