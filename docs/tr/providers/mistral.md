---
read_when:
    - OpenClaw'da Mistral modellerini kullanmak istiyorsunuz
    - Sesli Arama için Voxtral gerçek zamanlı transkripsiyonu istiyorsunuz
    - Mistral API anahtarı başlangıç kurulumu ve model referanslarına ihtiyacınız var
summary: OpenClaw ile Mistral modellerini ve Voxtral transkripsiyonunu kullanın
title: Mistral
x-i18n:
    generated_at: "2026-04-30T09:41:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fdba72a5a526bed78ef3a6ea633839634efca3f9d2e96b305315d534d115122
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw, hem metin/görüntü modeli yönlendirmesi (`mistral/...`) hem de
medya anlama kapsamında Voxtral üzerinden ses transkripsiyonu için Mistral'ı destekler.
Mistral, bellek yerleştirmeleri için de kullanılabilir (`memorySearch.provider = "mistral"`).

- Sağlayıcı: `mistral`
- Kimlik doğrulama: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Başlarken

<Steps>
  <Step title="API anahtarınızı alın">
    [Mistral Console](https://console.mistral.ai/) içinde bir API anahtarı oluşturun.
  </Step>
  <Step title="Onboarding çalıştırın">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Ya da anahtarı doğrudan iletin:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Varsayılan model ayarlayın">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Yerleşik LLM kataloğu

OpenClaw şu anda bu paketli Mistral kataloğuyla birlikte gelir:

| Model ref                        | Girdi       | Bağlam  | Maksimum çıktı | Notlar                                                           |
| -------------------------------- | ----------- | ------- | -------------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | metin, görüntü | 262,144 | 16,384     | Varsayılan model                                                 |
| `mistral/mistral-medium-2508`    | metin, görüntü | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | metin, görüntü | 128,000 | 16,384     | Mistral Small 4; API `reasoning_effort` üzerinden ayarlanabilir akıl yürütme |
| `mistral/pixtral-large-latest`   | metin, görüntü | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | metin        | 256,000 | 4,096      | Kodlama                                                          |
| `mistral/devstral-medium-latest` | metin        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | metin        | 128,000 | 40,000     | Akıl yürütme etkin                                               |

## Ses transkripsiyonu (Voxtral)

Medya anlama hattı üzerinden toplu ses transkripsiyonu için Voxtral kullanın.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
Medya transkripsiyonu yolu `/v1/audio/transcriptions` kullanır. Mistral için varsayılan ses modeli `voxtral-mini-latest` şeklindedir.
</Tip>

## Voice Call akış STT

Paketli `mistral` Plugin'i, Voxtral Realtime'ı bir Voice Call
akış STT sağlayıcısı olarak kaydeder.

| Ayar         | Yapılandırma yolu                                                     | Varsayılan                              |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API anahtarı | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | `MISTRAL_API_KEY` değerine geri döner   |
| Model        | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Kodlama      | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Örnekleme hızı | `...mistral.sampleRate`                                              | `8000`                                  |
| Hedef gecikme | `...mistral.targetStreamingDelayMs`                                   | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
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
OpenClaw, Voice Call'ın Twilio medya karelerini doğrudan iletebilmesi için
Mistral gerçek zamanlı STT varsayılanını 8 kHz'de `pcm_mulaw` olarak ayarlar.
Yalnızca yukarı akışınız zaten ham PCM ise `encoding: "pcm_s16le"` ve eşleşen
bir `sampleRate` kullanın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Ayarlanabilir akıl yürütme (mistral-small-latest)">
    `mistral/mistral-small-latest`, Mistral Small 4 ile eşleşir ve Chat Completions API üzerinde `reasoning_effort` aracılığıyla [ayarlanabilir akıl yürütmeyi](https://docs.mistral.ai/capabilities/reasoning/adjustable) destekler (`none` çıktıda ek düşünmeyi en aza indirir; `high` nihai yanıttan önce tam düşünme izlerini gösterir).

    OpenClaw, oturum **thinking** seviyesini Mistral API'sine eşler:

    | OpenClaw thinking seviyesi                       | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Diğer paketli Mistral katalog modelleri bu parametreyi kullanmaz. Mistral'ın yerel akıl yürütme öncelikli davranışını istediğinizde `magistral-*` modellerini kullanmaya devam edin.
    </Note>

  </Accordion>

  <Accordion title="Bellek yerleştirmeleri">
    Mistral, `/v1/embeddings` üzerinden bellek yerleştirmeleri sunabilir (varsayılan model: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Kimlik doğrulama ve temel URL">
    - Mistral kimlik doğrulaması `MISTRAL_API_KEY` kullanır.
    - Sağlayıcı temel URL'si varsayılan olarak `https://api.mistral.ai/v1` şeklindedir.
    - Onboarding varsayılan modeli `mistral/mistral-large-latest` şeklindedir.
    - Z.AI, API anahtarınızla Bearer kimlik doğrulaması kullanır.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve yük devri davranışını seçme.
  </Card>
  <Card title="Medya anlama" href="/tr/nodes/media-understanding" icon="microphone">
    Ses transkripsiyonu kurulumu ve sağlayıcı seçimi.
  </Card>
</CardGroup>
