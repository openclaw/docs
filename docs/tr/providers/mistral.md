---
read_when:
    - OpenClaw'da Mistral modellerini kullanmak istiyorsunuz
    - Sesli Arama için Voxtral gerçek zamanlı transkripsiyonu istiyorsunuz
    - Mistral API anahtarı ilk kurulumuna ve model referanslarına ihtiyacınız var
summary: OpenClaw ile Mistral modellerini ve Voxtral transkripsiyonunu kullanın
title: Mistral
x-i18n:
    generated_at: "2026-05-10T19:52:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94c4caa86d4a3eb873d8b6a1cc639edbad3dd7478f401e2ca53f704de095f829
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw, dört sözleşme kaydeden paketle gelen bir Mistral Plugin'i içerir: sohbet tamamlama, medya anlama (Voxtral toplu transkripsiyon), Voice Call için gerçek zamanlı STT (Voxtral Realtime) ve bellek embedding'leri (`mistral-embed`).

| Özellik         | Değer                                       |
| ---------------- | ------------------------------------------- |
| Sağlayıcı kimliği | `mistral`                                   |
| Plugin           | paketle gelen, `enabledByDefault: true`           |
| Kimlik doğrulama env var'ı | `MISTRAL_API_KEY`                           |
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

    Veya anahtarı doğrudan geçirin:

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

[Mistral Medium 3.5](https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04)
paketle gelen katalogdaki güncel harmanlanmış Medium modelidir: 128B yoğun ağırlık,
metin ve görüntü girişi, 256K bağlam, işlev çağırma, yapılandırılmış çıktı, kodlama
ve Chat Completions API üzerinden ayarlanabilir akıl yürütme. Varsayılan
`mistral/mistral-large-latest` yerine Mistral'ın daha yeni birleşik
ajan/kodlama modelini istediğinizde `mistral/mistral-medium-3-5` kullanın.

OpenClaw şu anda bu paketle gelen Mistral kataloğunu sağlar:

| Model ref                        | Giriş       | Bağlam | Maks. çıktı | Notlar                                                            |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | metin, görüntü | 262,144 | 16,384     | Varsayılan model                                                    |
| `mistral/mistral-medium-2508`    | metin, görüntü | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-medium-3-5`     | metin, görüntü | 262,144 | 8,192      | Mistral Medium 3.5; ayarlanabilir akıl yürütme                         |
| `mistral/mistral-small-latest`   | metin, görüntü | 128,000 | 16,384     | Mistral Small 4; API `reasoning_effort` üzerinden ayarlanabilir akıl yürütme |
| `mistral/pixtral-large-latest`   | metin, görüntü | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | metin        | 256,000 | 4,096      | Kodlama                                                           |
| `mistral/devstral-medium-latest` | metin        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | metin        | 128,000 | 40,000     | Akıl yürütme etkin                                                |

Onboarding'den sonra, Gateway'i başlatmadan Medium 3.5'i smoke test edin:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

Yapılandırmayı değiştirmeden önce paketle gelen katalog satırına göz atmak için:

```bash
openclaw models list --all --provider mistral --plain
```

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

Paketle gelen `mistral` Plugin'i, Voxtral Realtime'ı bir Voice Call
akış STT sağlayıcısı olarak kaydeder.

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
OpenClaw, Voice Call'ın Twilio medya karelerini doğrudan iletebilmesi için
Mistral gerçek zamanlı STT'yi 8 kHz'de `pcm_mulaw` olarak varsayılan yapar.
`encoding: "pcm_s16le"` ve eşleşen bir `sampleRate` değerini yalnızca yukarı akışınız
zaten ham PCM ise kullanın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Ayarlanabilir akıl yürütme">
    `mistral/mistral-small-latest` (Mistral Small 4) ve `mistral/mistral-medium-3-5`, Chat Completions API üzerinde `reasoning_effort` aracılığıyla [ayarlanabilir akıl yürütmeyi](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) destekler (`none`, çıktıda ekstra düşünmeyi en aza indirir; `high`, son yanıttan önce tam düşünme izlerini gösterir). Mistral, Medium 3.5 ajan ve kod kullanım durumları için `reasoning_effort="high"` önerir.

    OpenClaw, oturum **thinking** düzeyini Mistral'ın API'sine eşler:

    | OpenClaw thinking düzeyi                          | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Warning>
    Medium 3.5 akıl yürütme modunu `temperature: 0` ile birleştirmeyin. Mistral
    HTTP API, `reasoning_effort="high"` ile `temperature: 0` birleşimini 400
    yanıtıyla reddeder. Mistral'ın varsayılanını kullanması için sıcaklığı ayarlanmamış bırakın veya
    [Medium 3.5 önerilen ayarlarını](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B)
    izleyip yüksek akıl yürütme için `temperature: 0.7` kullanın. Belirleyici doğrudan
    yanıtlar için, sıcaklığı düşürmeden önce thinking'i kapatın/minimal yapın; böylece OpenClaw
    `reasoning_effort: "none"` gönderir.
    </Warning>

    Medium 3.5 akıl yürütmesi için model kapsamlı yapılandırma örneği:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    Paketle gelen diğer Mistral katalog modelleri bu parametreyi kullanmaz. Mistral'ın yerel akıl yürütme öncelikli davranışını istediğinizde `magistral-*` modellerini kullanmaya devam edin.
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
    - Mistral kimlik doğrulaması `MISTRAL_API_KEY` kullanır (Bearer başlığı).
    - Sağlayıcı temel URL'si varsayılan olarak `https://api.mistral.ai/v1` değerine ayarlanır ve standart OpenAI uyumlu chat-completions istek şeklini kabul eder.
    - Onboarding varsayılan modeli `mistral/mistral-large-latest`'tir.
    - Temel URL'yi `models.providers.mistral.baseUrl` altında yalnızca Mistral ihtiyacınız olan bölgesel bir uç noktayı açıkça yayımladığında geçersiz kılın.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve failover davranışını seçme.
  </Card>
  <Card title="Medya anlama" href="/tr/nodes/media-understanding" icon="microphone">
    Ses transkripsiyonu kurulumu ve sağlayıcı seçimi.
  </Card>
</CardGroup>
