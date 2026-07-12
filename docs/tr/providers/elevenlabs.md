---
read_when:
    - OpenClaw'da ElevenLabs metinden konuşmaya özelliğini kullanmak istiyorsunuz
    - Ses ekleri için ElevenLabs Scribe konuşmayı metne dönüştürme özelliğini istiyorsunuz
    - Voice Call veya Google Meet için ElevenLabs gerçek zamanlı transkripsiyonunu istiyorsunuz
summary: OpenClaw ile ElevenLabs konuşma, Scribe konuşmadan metne dönüştürme ve gerçek zamanlı transkripsiyon özelliklerini kullanın
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-12T12:42:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw; metinden konuşmaya dönüştürme için ElevenLabs'i, Scribe v2 ile toplu
konuşmadan metne dönüştürmeyi ve Scribe v2 Realtime ile akışlı STT'yi kullanır.
Plugin paketle birlikte gelir ve varsayılan olarak etkindir; `plugins install`
adımı gerekmez.

| Yetenek                      | OpenClaw yüzeyi                                                      | Varsayılan               |
| ---------------------------- | -------------------------------------------------------------------- | ------------------------ |
| Metinden konuşmaya           | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Toplu konuşmadan metne       | `tools.media.audio`                                                  | `scribe_v2`              |
| Akışlı konuşmadan metne      | Voice Call akışı veya Google Meet `realtime.transcriptionProvider`   | `scribe_v2_realtime`     |

## Kimlik doğrulama

Ortamda `ELEVENLABS_API_KEY` değerini ayarlayın. Mevcut ElevenLabs araçlarıyla
uyumluluk için `XI_API_KEY` de kabul edilir.

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

ElevenLabs v3 TTS'yi kullanmak için `modelId` değerini `eleven_v3` olarak
ayarlayın. OpenClaw, mevcut kurulumlar için `eleven_multilingual_v2` değerini
varsayılan olarak korur.

ElevenLabs seçili `voice.tts`/`messages.tts` sağlayıcısı olduğunda Discord ses
kanalları, ElevenLabs'in akışlı TTS uç noktasını kullanır: oynatma, OpenClaw'ın
önce ses dosyasının tamamını indirmesini beklemek yerine döndürülen ses
akışından başlar. `latencyTier`, bunu kabul eden modeller için ElevenLabs'in
`optimize_streaming_latency` sorgu parametresine eşlenir; OpenClaw bu parametreyi
reddeden `eleven_v3` için parametreyi göndermez.

## Konuşmadan metne

Gelen ses ekleri ve kısa kaydedilmiş ses bölümleri için Scribe v2'yi kullanın:

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

OpenClaw, çok parçalı sesi `model_id: "scribe_v2"` ile ElevenLabs
`/v1/speech-to-text` uç noktasına gönderir. Dil ipuçları mevcut olduğunda
`language_code` değerine eşlenir.

## Akışlı STT

Paketle birlikte gelen `elevenlabs` Plugin'i, Voice Call ve Google Meet ajan modu
akışlı transkripsiyonu için Scribe v2 Realtime'ı kaydeder.

| Ayar                  | Yapılandırma yolu                                                         | Varsayılan                                      |
| --------------------- | ------------------------------------------------------------------------- | ----------------------------------------------- |
| API anahtarı          | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | `ELEVENLABS_API_KEY` / `XI_API_KEY` değerine geri döner |
| Model                 | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                            |
| Ses biçimi            | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                     |
| Örnekleme hızı        | `...elevenlabs.sampleRate`                                                | `8000`                                          |
| Gönderim stratejisi   | `...elevenlabs.commitStrategy`                                            | `vad`                                           |
| Dil                   | `...elevenlabs.languageCode`                                              | (ayarlanmamış)                                  |

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
Voice Call, Twilio medyasını 8 kHz G.711 u-law olarak alır. ElevenLabs gerçek
zamanlı sağlayıcısı varsayılan olarak `ulaw_8000` kullanır; böylece telefon
çerçeveleri kod dönüştürme yapılmadan iletilebilir.
</Note>

Google Meet ajan modu için
`plugins.entries.google-meet.config.realtime.transcriptionProvider` değerini
`"elevenlabs"` olarak ayarlayın ve aynı sağlayıcı bloğunu
`plugins.entries.google-meet.config.realtime.providers.elevenlabs` altında
yapılandırın.

## İlgili konular

- [Metinden konuşmaya](/tr/tools/tts)
- [Google Meet](/tr/plugins/google-meet)
- [Model seçimi](/tr/concepts/model-providers)
