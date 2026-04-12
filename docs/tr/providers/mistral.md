---
read_when:
    - OpenClaw’da Mistral modellerini kullanmak istiyorsunuz
    - Mistral API anahtarı onboarding’ine ve model başvurularına ihtiyacınız var
summary: OpenClaw ile Mistral modellerini ve Voxtral transkripsiyonunu kullanın
title: Mistral
x-i18n:
    generated_at: "2026-04-12T23:31:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0474f55587909ce9bbdd47b881262edbeb1b07eb3ed52de1090a8ec4d260c97b
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw, hem metin/görsel model yönlendirmesi (`mistral/...`) hem de
media understanding içinde Voxtral üzerinden ses transkripsiyonu için Mistral’ı destekler.
Mistral, bellek embedding’leri için de kullanılabilir (`memorySearch.provider = "mistral"`).

- Provider: `mistral`
- Kimlik doğrulama: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Başlarken

<Steps>
  <Step title="API anahtarınızı alın">
    [Mistral Console](https://console.mistral.ai/) içinde bir API anahtarı oluşturun.
  </Step>
  <Step title="Onboarding'i çalıştırın">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Veya anahtarı doğrudan verin:

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
  <Step title="Modelin kullanılabildiğini doğrulayın">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Yerleşik LLM kataloğu

OpenClaw şu anda bu paketli Mistral kataloğunu sunar:

| Model başvurusu                 | Girdi       | Bağlam  | Maks çıktı | Notlar                                                            |
| ------------------------------- | ----------- | ------- | ---------- | ----------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image | 262,144 | 16,384     | Varsayılan model                                                  |
| `mistral/mistral-medium-2508`    | text, image | 262,144 | 8,192      | Mistral Medium 3.1                                                |
| `mistral/mistral-small-latest`   | text, image | 128,000 | 16,384     | Mistral Small 4; API `reasoning_effort` ile ayarlanabilir akıl yürütme |
| `mistral/pixtral-large-latest`   | text, image | 128,000 | 32,768     | Pixtral                                                           |
| `mistral/codestral-latest`       | text        | 256,000 | 4,096      | Kodlama                                                           |
| `mistral/devstral-medium-latest` | text        | 262,144 | 32,768     | Devstral 2                                                        |
| `mistral/magistral-small`        | text        | 128,000 | 40,000     | Akıl yürütme etkin                                                |

## Ses transkripsiyonu (Voxtral)

Media understanding işlem hattısı üzerinden ses transkripsiyonu için Voxtral kullanın.

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
Medya transkripsiyon yolu `/v1/audio/transcriptions` kullanır. Mistral için varsayılan ses modeli `voxtral-mini-latest` modelidir.
</Tip>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Ayarlanabilir akıl yürütme (mistral-small-latest)">
    `mistral/mistral-small-latest`, Mistral Small 4’e eşlenir ve Chat Completions API’sinde `reasoning_effort` üzerinden [ayarlanabilir akıl yürütmeyi](https://docs.mistral.ai/capabilities/reasoning/adjustable) destekler (`none`, çıktıda ek düşünmeyi en aza indirir; `high`, nihai yanıttan önce tam düşünme izlerini gösterir).

    OpenClaw, oturum **thinking** düzeyini Mistral API’sine eşler:

    | OpenClaw thinking düzeyi                         | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** | `high`             |

    <Note>
    Paketli Mistral katalogundaki diğer modeller bu parametreyi kullanmaz. Mistral’ın yerel akıl yürütme öncelikli davranışını istediğinizde `magistral-*` modellerini kullanmaya devam edin.
    </Note>

  </Accordion>

  <Accordion title="Bellek embedding'leri">
    Mistral, `/v1/embeddings` üzerinden bellek embedding’leri sunabilir (varsayılan model: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Kimlik doğrulama ve temel URL">
    - Mistral kimlik doğrulaması `MISTRAL_API_KEY` kullanır.
    - Provider temel URL’si varsayılan olarak `https://api.mistral.ai/v1` değeridir.
    - Onboarding varsayılan modeli `mistral/mistral-large-latest` modelidir.
    - Z.AI, API anahtarınızla Bearer kimlik doğrulaması kullanır.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Provider’ları, model başvurularını ve failover davranışını seçme.
  </Card>
  <Card title="Media understanding" href="/tools/media-understanding" icon="microphone">
    Ses transkripsiyonu kurulumu ve provider seçimi.
  </Card>
</CardGroup>
