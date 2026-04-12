---
read_when:
    - OpenClaw içinde açık modelleri ücretsiz kullanmak istiyorsunuz
    - '`NVIDIA_API_KEY` kurulumuna ihtiyacınız var'
summary: OpenClaw içinde NVIDIA’nın OpenAI uyumlu API’sini kullanın
title: NVIDIA
x-i18n:
    generated_at: "2026-04-12T23:31:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45048037365138141ee82cefa0c0daaf073a1c2ae3aa7b23815f6ca676fc0d3e
    source_path: providers/nvidia.md
    workflow: 15
---

# NVIDIA

NVIDIA, açık modeller için `https://integrate.api.nvidia.com/v1` adresinde
ücretsiz bir OpenAI uyumlu API sunar. Kimlik doğrulamasını
[build.nvidia.com](https://build.nvidia.com/settings/api-keys) üzerinden alınan bir API anahtarıyla yapın.

## Başlangıç

<Steps>
  <Step title="API anahtarınızı alın">
    [build.nvidia.com](https://build.nvidia.com/settings/api-keys) adresinde bir API anahtarı oluşturun.
  </Step>
  <Step title="Anahtarı dışa aktarın ve başlangıç kurulumunu çalıştırın">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice skip
    ```
  </Step>
  <Step title="Bir NVIDIA modeli ayarlayın">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Ortam değişkeni yerine `--token` geçirirseniz değer kabuk geçmişine ve
`ps` çıktısına düşer. Mümkün olduğunda `NVIDIA_API_KEY` ortam değişkenini tercih edin.
</Warning>

## Yapılandırma örneği

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## Yerleşik katalog

| Model ref                                  | Ad                           | Bağlam  | Maks çıktı |
| ------------------------------------------ | ---------------------------- | ------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192      |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192      |

## Gelişmiş notlar

<AccordionGroup>
  <Accordion title="Otomatik etkinleştirme davranışı">
    Sağlayıcı, `NVIDIA_API_KEY` ortam değişkeni ayarlandığında otomatik olarak etkinleşir.
    Anahtar dışında açık bir sağlayıcı yapılandırması gerekmez.
  </Accordion>

  <Accordion title="Katalog ve fiyatlandırma">
    Paketlenmiş katalog statiktir. NVIDIA şu anda
    listelenen modeller için ücretsiz API erişimi sunduğundan maliyetler kaynakta varsayılan olarak `0` olur.
  </Accordion>

  <Accordion title="OpenAI uyumlu uç nokta">
    NVIDIA standart `/v1` completions uç noktasını kullanır. Herhangi bir OpenAI uyumlu
    araç, NVIDIA temel URL’si ile kutudan çıktığı gibi çalışmalıdır.
  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA modelleri şu anda ücretsizdir. En güncel kullanılabilirlik ve
hız sınırı ayrıntıları için [build.nvidia.com](https://build.nvidia.com/) adresini kontrol edin.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Ajanlar, modeller ve sağlayıcılar için tam yapılandırma başvurusu.
  </Card>
</CardGroup>
