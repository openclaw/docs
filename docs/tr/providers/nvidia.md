---
read_when:
    - OpenClaw'ta açık modelleri ücretsiz kullanmak istiyorsunuz
    - '`NVIDIA_API_KEY` kurulumuna ihtiyacınız var'
summary: OpenClaw'ta NVIDIA'nın OpenAI uyumlu API'sini kullanma
title: NVIDIA
x-i18n:
    generated_at: "2026-04-24T09:26:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2d056be5be012be537ba5c4d5812ea15ec440e5a552b235854e2078064376192
    source_path: providers/nvidia.md
    workflow: 15
---

NVIDIA, ücretsiz açık modeller için `https://integrate.api.nvidia.com/v1` adresinde
OpenAI uyumlu bir API sağlar. Kimlik doğrulaması için
[build.nvidia.com](https://build.nvidia.com/settings/api-keys) üzerinden alınan bir API anahtarını kullanın.

## Başlangıç

<Steps>
  <Step title="API anahtarınızı alın">
    [build.nvidia.com](https://build.nvidia.com/settings/api-keys) adresinde bir API anahtarı oluşturun.
  </Step>
  <Step title="Anahtarı dışa aktarın ve ilk kullanım akışını çalıştırın">
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
Ortam değişkeni yerine `--token` verirseniz değer shell geçmişine ve
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

| Model ref                                  | Ad                           | Bağlam  | En fazla çıktı |
| ------------------------------------------ | ---------------------------- | ------- | -------------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192          |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192          |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192          |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192          |

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Otomatik etkinleştirme davranışı">
    `NVIDIA_API_KEY` ortam değişkeni ayarlandığında sağlayıcı otomatik etkinleşir.
    Anahtar dışında açık bir sağlayıcı yapılandırması gerekmez.
  </Accordion>

  <Accordion title="Katalog ve fiyatlandırma">
    Paketlenmiş katalog statiktir. NVIDIA şu anda
    listelenen modeller için ücretsiz API erişimi sunduğundan, maliyetler kaynakta varsayılan olarak `0` olur.
  </Accordion>

  <Accordion title="OpenAI uyumlu uç nokta">
    NVIDIA standart `/v1` completions uç noktasını kullanır. Herhangi bir OpenAI uyumlu
    araç, NVIDIA base URL ile kutudan çıktığı gibi çalışmalıdır.
  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA modelleri şu anda ücretsiz kullanılabilir. Güncel kullanılabilirlik ve
hız sınırı ayrıntıları için [build.nvidia.com](https://build.nvidia.com/) sitesini denetleyin.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcı seçimi, model ref'leri ve failover davranışı.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Agent'lar, modeller ve sağlayıcılar için tam yapılandırma başvurusu.
  </Card>
</CardGroup>
