---
read_when:
    - OpenClaw içinde Mistral modellerini kullanmak istiyorsunuz
    - Voice Call için Voxtral gerçek zamanlı transkripsiyon istiyorsunuz
    - Mistral API anahtarı ilk kurulumu ve model başvurularına ihtiyacınız var
summary: Mistral modellerini ve Voxtral transkripsiyonunu OpenClaw ile kullanın
title: Mistral
x-i18n:
    generated_at: "2026-04-24T09:26:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63e1eb462f836f5ddc1afd0d01954080eee461230924368d77e2e57fef12caf1
    source_path: providers/mistral.md
    workflow: 15
---

OpenClaw, hem metin/görüntü model yönlendirmesi (`mistral/...`) hem de
medya anlama içinde Voxtral aracılığıyla ses transkripsiyonu için Mistral’ı destekler.
Mistral, bellek gömüleri için de kullanılabilir (`memorySearch.provider = "mistral"`).

- Sağlayıcı: `mistral`
- Kimlik doğrulama: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Başlarken

<Steps>
  <Step title="API anahtarınızı alın">
    [Mistral Console](https://console.mistral.ai/) içinde bir API anahtarı oluşturun.
  </Step>
  <Step title="İlk kurulumu çalıştırın">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Veya anahtarı doğrudan iletin:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Varsayılan bir model ayarlayın">
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

OpenClaw şu anda şu paketlenmiş Mistral kataloğuyla gelir:

| Model başvurusu                  | Girdi       | Bağlam  | En yüksek çıktı | Notlar                                                           |
| -------------------------------- | ----------- | ------- | --------------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | metin, görüntü | 262,144 | 16,384        | Varsayılan model                                                 |
| `mistral/mistral-medium-2508`    | metin, görüntü | 262,144 | 8,192         | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | metin, görüntü | 128,000 | 16,384        | Mistral Small 4; API `reasoning_effort` ile ayarlanabilir akıl yürütme |
| `mistral/pixtral-large-latest`   | metin, görüntü | 128,000 | 32,768        | Pixtral                                                          |
| `mistral/codestral-latest`       | metin        | 256,000 | 4,096          | Kodlama                                                          |
| `mistral/devstral-medium-latest` | metin        | 262,144 | 32,768         | Devstral 2                                                       |
| `mistral/magistral-small`        | metin        | 128,000 | 40,000         | Akıl yürütme etkin                                               |

## Ses transkripsiyonu (Voxtral)

Toplu ses transkripsiyonu için Voxtral’ı medya anlama işlem hattı üzerinden kullanın.

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
Medya transkripsiyonu yolu `/v1/audio/transcriptions` kullanır. Mistral için varsayılan ses modeli `voxtral-mini-latest`’tir.
</Tip>

## Voice Call akış STT

Paketlenmiş `mistral` Plugin’i, Voxtral Realtime’ı bir Voice Call
akış STT sağlayıcısı olarak kaydeder.

| Ayar         | Yapılandırma yolu                                                      | Varsayılan                              |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API anahtarı | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | `MISTRAL_API_KEY` değerine geri düşer   |
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
OpenClaw, Mistral gerçek zamanlı STT için varsayılan olarak `pcm_mulaw` ve 8 kHz kullanır; böylece Voice Call
Twilio medya karelerini doğrudan iletebilir. `encoding: "pcm_s16le"` ve buna uygun bir
`sampleRate` yalnızca yukarı akış akışınız zaten ham PCM ise kullanılmalıdır.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Ayarlanabilir akıl yürütme (mistral-small-latest)">
    `mistral/mistral-small-latest`, Mistral Small 4’e eşlenir ve Chat Completions API üzerinde
    `reasoning_effort` aracılığıyla [ayarlanabilir akıl yürütmeyi](https://docs.mistral.ai/capabilities/reasoning/adjustable) destekler (`none`, çıktıdaki ek düşünmeyi en aza indirir; `high`, son yanıttan önce tam düşünme izlerini gösterir).

    OpenClaw, oturum **thinking** düzeyini Mistral API’sine eşler:

    | OpenClaw thinking düzeyi                         | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Paketlenmiş diğer Mistral katalog modelleri bu parametreyi kullanmaz. Mistral’ın yerel akıl yürütme öncelikli davranışını istediğinizde `magistral-*` modellerini kullanmaya devam edin.
    </Note>

  </Accordion>

  <Accordion title="Bellek gömüleri">
    Mistral, `/v1/embeddings` aracılığıyla bellek gömüleri sunabilir (varsayılan model: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Kimlik doğrulama ve temel URL">
    - Mistral kimlik doğrulaması `MISTRAL_API_KEY` kullanır.
    - Sağlayıcı temel URL’si varsayılan olarak `https://api.mistral.ai/v1` değeridir.
    - İlk kurulum varsayılan modeli `mistral/mistral-large-latest`’tir.
    - Z.AI, API anahtarınızla Bearer kimlik doğrulaması kullanır.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Medya anlama" href="/tr/nodes/media-understanding" icon="microphone">
    Ses transkripsiyonu kurulumu ve sağlayıcı seçimi.
  </Card>
</CardGroup>
