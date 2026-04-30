---
read_when:
    - OpenClaw'da açık modelleri ücretsiz olarak kullanmak istiyorsunuz
    - NVIDIA_API_KEY ayarının yapılması gerekiyor
summary: NVIDIA'nın OpenAI uyumlu API'sini OpenClaw'da kullanın
title: NVIDIA
x-i18n:
    generated_at: "2026-04-30T09:41:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 297cc25cf5235bb51f3962c2a1b8799ca6544d57e701c42e9b1e1c7d881ad32b
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA, açık modeller için `https://integrate.api.nvidia.com/v1` adresinde ücretsiz
OpenAI uyumlu bir API sağlar. [build.nvidia.com](https://build.nvidia.com/settings/api-keys)
üzerinden alınan bir API anahtarıyla kimlik doğrulayın.

## Başlarken

<Steps>
  <Step title="API anahtarınızı alın">
    [build.nvidia.com](https://build.nvidia.com/settings/api-keys) üzerinde bir API anahtarı oluşturun.
  </Step>
  <Step title="Anahtarı dışa aktarın ve onboarding çalıştırın">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Bir NVIDIA modeli ayarlayın">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Env var yerine `--nvidia-api-key` geçirirseniz değer kabuk geçmişine ve `ps`
çıktısına düşer. Mümkün olduğunda `NVIDIA_API_KEY` ortam değişkenini tercih edin.
</Warning>

Etkileşimsiz kurulum için anahtarı doğrudan da geçirebilirsiniz:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

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

| Model ref                                  | Ad                           | Bağlam  | Maksimum çıktı |
| ------------------------------------------ | ---------------------------- | ------- | -------------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192          |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192          |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192          |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192          |

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Otomatik etkinleştirme davranışı">
    `NVIDIA_API_KEY` ortam değişkeni ayarlandığında sağlayıcı otomatik olarak etkinleşir.
    Anahtar dışında açık bir sağlayıcı yapılandırması gerekmez.
  </Accordion>

  <Accordion title="Katalog ve fiyatlandırma">
    Paketle gelen katalog statiktir. NVIDIA şu anda listelenen modeller için
    ücretsiz API erişimi sunduğundan kaynakta maliyetler varsayılan olarak `0` olur.
  </Accordion>

  <Accordion title="OpenAI uyumlu uç nokta">
    NVIDIA standart `/v1` completions uç noktasını kullanır. Tüm OpenAI uyumlu
    araçlar NVIDIA base URL ile kutudan çıktığı gibi çalışmalıdır.
  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA modelleri şu anda ücretsiz kullanılabilir. En güncel kullanılabilirlik ve
rate-limit ayrıntıları için [build.nvidia.com](https://build.nvidia.com/) adresini kontrol edin.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model refs ve failover davranışını seçme.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Agents, modeller ve sağlayıcılar için tam yapılandırma referansı.
  </Card>
</CardGroup>
