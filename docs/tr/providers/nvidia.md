---
read_when:
    - OpenClaw'da açık modelleri ücretsiz kullanmak istiyorsunuz
    - NVIDIA_API_KEY kurulumu gerekiyor
summary: NVIDIA'nın OpenAI uyumlu API'sini OpenClaw'da kullanın
title: NVIDIA
x-i18n:
    generated_at: "2026-05-07T13:25:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8846c51b056e05f8552b3804d4dac73ff34aa874ec3d5d6fb13fad5a4112bc7f
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA, açık modeller için ücretsiz olarak `https://integrate.api.nvidia.com/v1` adresinde
OpenAI uyumlu bir API sağlar. [build.nvidia.com](https://build.nvidia.com/settings/api-keys)
üzerinden alınan bir API anahtarıyla kimlik doğrulaması yapın.

## Başlarken

<Steps>
  <Step title="Get your API key">
    [build.nvidia.com](https://build.nvidia.com/settings/api-keys) adresinde bir API anahtarı oluşturun.
  </Step>
  <Step title="Export the key and run onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Set an NVIDIA model">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Env var yerine `--nvidia-api-key` geçirirseniz, değer shell geçmişine ve `ps`
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
  <Accordion title="Auto-enable behavior">
    Sağlayıcı, `NVIDIA_API_KEY` ortam değişkeni ayarlandığında otomatik etkinleşir.
    Anahtar dışında açık bir sağlayıcı yapılandırması gerekmez.
  </Accordion>

  <Accordion title="Catalog and pricing">
    Paketlenmiş katalog statiktir. NVIDIA listelenen modeller için şu anda
    ücretsiz API erişimi sunduğundan, maliyetler kaynakta varsayılan olarak `0` olur.
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    NVIDIA standart `/v1` tamamlama uç noktasını kullanır. OpenAI uyumlu herhangi
    bir araç, NVIDIA temel URL'siyle kutudan çıktığı gibi çalışmalıdır.
  </Accordion>

  <Accordion title="Slow custom provider responses">
    NVIDIA üzerinde barındırılan bazı özel modeller, ilk yanıt parçasını yaymadan önce
    varsayılan model boşta kalma watchdog süresinden daha uzun sürebilir. Özel NVIDIA
    sağlayıcı girdileri için, tüm agent çalışma zamanı zaman aşımını artırmak yerine
    sağlayıcı zaman aşımını yükseltin:

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA modelleri şu anda ücretsiz kullanılabilir. En güncel kullanılabilirlik ve
hız sınırı ayrıntıları için [build.nvidia.com](https://build.nvidia.com/) adresini kontrol edin.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref değerlerini ve failover davranışını seçme.
  </Card>
  <Card title="Configuration reference" href="/tr/gateway/configuration-reference" icon="gear">
    Agent, modeller ve sağlayıcılar için tam yapılandırma referansı.
  </Card>
</CardGroup>
