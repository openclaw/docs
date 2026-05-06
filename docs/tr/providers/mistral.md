---
read_when:
    - OpenClaw'da Mistral modellerini kullanmak istiyorsunuz
    - Sesli Arama için Voxtral gerçek zamanlı transkripsiyonunu istiyorsunuz
    - Mistral API anahtarı ilk kurulumu ve model referansları gerekir
summary: Mistral modellerini ve Voxtral transkripsiyonunu OpenClaw ile kullanın
title: Mistral
x-i18n:
    generated_at: "2026-05-06T09:28:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb55915526e292210df61b646e1bbcdb2da86a0e46ea4bd5afd63d244f8da71a
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw; sohbet tamamlama, medya anlama (Voxtral toplu transkripsiyon), Voice Call için gerçek zamanlı STT (Voxtral Realtime) ve bellek embedding'leri (`mistral-embed`) olmak üzere dört sözleşme kaydeden, paketle birlikte gelen bir Mistral Plugin'i içerir.

| Özellik         | Değer                                       |
| ---------------- | ------------------------------------------- |
| Sağlayıcı kimliği      | `mistral`                                   |
| Plugin           | paketle birlikte gelen, `enabledByDefault: true`           |
| Kimlik doğrulama ortam değişkeni     | `MISTRAL_API_KEY`                           |
| Onboarding bayrağı  | `--auth-choice mistral-api-key`             |
| Doğrudan CLI bayrağı  | `--mistral-api-key <key>`                   |
| API              | OpenAI uyumlu (`openai-completions`)    |
| Temel URL         | `https://api.mistral.ai/v1`                 |
| Varsayılan model    | `mistral/mistral-large-latest`              |
| Embedding modeli  | `mistral-embed`                             |
| Voxtral toplu    | `voxtral-mini-latest` (ses transkripsiyonu) |
| Voxtral gerçek zamanlı | `voxtral-mini-transcribe-realtime-2602`     |

## Başlarken

<Steps>
  <Step title="API anahtarınızı alın">
    [Mistral Console](https://console.mistral.ai/) içinde bir API anahtarı oluşturun.
  </Step>
  <Step title="Onboarding'i çalıştırın">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Veya anahtarı doğrudan iletin:

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

OpenClaw şu anda paketle birlikte gelen bu Mistral kataloğunu sunar:

| Model referansı                        | Girdi       | Bağlam | Maks çıktı | Notlar                                                            |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | metin, görsel | 262,144 | 16,384     | Varsayılan model                                                    |
| `mistral/mistral-medium-2508`    | metin, görsel | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | metin, görsel | 128,000 | 16,384     | Mistral Small 4; API `reasoning_effort` ile ayarlanabilir akıl yürütme |
| `mistral/pixtral-large-latest`   | metin, görsel | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | metin        | 256,000 | 4,096      | Kodlama                                                           |
| `mistral/devstral-medium-latest` | metin        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | metin        | 128,000 | 40,000     | Akıl yürütme etkin                                                |

## Ses transkripsiyonu (Voxtral)

Medya anlama işlem hattı üzerinden toplu ses transkripsiyonu için Voxtral kullanın.

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
Medya transkripsiyonu yolu `/v1/audio/transcriptions` kullanır. Mistral için varsayılan ses modeli `voxtral-mini-latest`'tir.
</Tip>

## Voice Call akış STT'si

Paketle birlikte gelen `mistral` Plugin'i, Voxtral Realtime'ı Voice Call akış STT sağlayıcısı olarak kaydeder.

| Ayar      | Yapılandırma yolu                                                            | Varsayılan                                 |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API anahtarı      | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | `MISTRAL_API_KEY` değerine geri döner         |
| Model        | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Kodlama     | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Örnekleme hızı  | `...mistral.sampleRate`                                                | `8000`                                  |
| Hedef gecikme | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

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
OpenClaw, Voice Call'un Twilio medya karelerini doğrudan iletebilmesi için Mistral gerçek zamanlı STT'yi 8 kHz'de `pcm_mulaw` olarak varsayılan ayarlar. `encoding: "pcm_s16le"` ve eşleşen bir `sampleRate` değerini yalnızca yukarı akışınız zaten ham PCM ise kullanın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Ayarlanabilir akıl yürütme (mistral-small-latest)">
    `mistral/mistral-small-latest`, Mistral Small 4'e eşlenir ve Chat Completions API'sinde `reasoning_effort` üzerinden [ayarlanabilir akıl yürütmeyi](https://docs.mistral.ai/capabilities/reasoning/adjustable) destekler (`none` çıktıda ek düşünmeyi en aza indirir; `high` son yanıttan önce tam düşünme izlerini gösterir).

    OpenClaw, oturum **düşünme** düzeyini Mistral'ın API'sine eşler:

    | OpenClaw düşünme düzeyi                          | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **kapalı** / **minimal**                            | `none`                     |
    | **düşük** / **orta** / **yüksek** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Paketle birlikte gelen diğer Mistral katalog modelleri bu parametreyi kullanmaz. Mistral'ın yerel akıl yürütme öncelikli davranışını istediğinizde `magistral-*` modellerini kullanmaya devam edin.
    </Note>

  </Accordion>

  <Accordion title="Bellek embedding'leri">
    Mistral, `/v1/embeddings` üzerinden bellek embedding'leri sunabilir (varsayılan model: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Kimlik doğrulama ve temel URL">
    - Mistral kimlik doğrulaması `MISTRAL_API_KEY` kullanır (Bearer üstbilgisi).
    - Sağlayıcı temel URL'si varsayılan olarak `https://api.mistral.ai/v1` değerini kullanır ve standart OpenAI uyumlu chat-completions istek şeklini kabul eder.
    - Onboarding varsayılan modeli `mistral/mistral-large-latest`'tir.
    - Temel URL'yi `models.providers.mistral.baseUrl` altında yalnızca Mistral ihtiyacınız olan bölgesel bir uç noktayı açıkça yayımladığında geçersiz kılın.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Medya anlama" href="/tr/nodes/media-understanding" icon="microphone">
    Ses transkripsiyonu kurulumu ve sağlayıcı seçimi.
  </Card>
</CardGroup>
